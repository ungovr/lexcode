import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, readFileSync, symlinkSync } from 'node:fs';
import { mkdtemp, readFile } from 'node:fs/promises';
import { availableParallelism, tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { terminateGroup, trackChild, trackTempDir } from '../cleanup.js';
import { ToolError } from '../errors.js';
import { childEnv } from '../proc.js';
import type { EngineMatch } from '../types.js';
import { cacheDir } from './cache.js';
import { checkEngineDir } from './dirs.js';

/**
 * Characters of target paths per engine invocation. Windows caps a command
 * line near 32,767; macOS caps argv plus the environment at 1 MiB, Linux at
 * 2 MiB. Every invocation parses the rules again (about 2 s for the full rule
 * set), so outside Windows a lane of several thousand files is one
 * invocation. On Windows a lane runs its chunks one after another.
 */
export const CHUNK_CHARS_WINDOWS = 24_000;
export const CHUNK_CHARS_OTHER = 600_000;

/**
 * Engine parallelism, summed over the lanes: at most this many, and at most the available parallelism.
 * Parsing is most of a scan's cost and scales with it.
 */
export const MAX_JOBS = 16;

/**
 * Target bytes per lane. A large scan runs as several engine processes at once (lanes), each with
 * its own share of the targets and its own `--jobs`, because one engine process does not keep many
 * cores busy: its workers are threads of one process and wait on each other. On the UnGovr
 * monorepo (9,562 targets, 24 cores) one engine process with `--jobs 16` used about 6 of them and
 * took 107 to 114 s on a busy machine; 16 processes with `--jobs 1` took 38 s, 8 with `--jobs 2`
 * took 44 s, with the same results (#12997). Each extra
 * process costs about 3.5 CPU-seconds (the engine starting, parsing the rules, taking its
 * targets), so a scan gets one lane per this many bytes of targets, and a small scan stays one
 * process with every job.
 */
export const LANE_BYTES = 4_000_000;

/**
 * Lanes at most. Each lane is an engine of its own with its own copy of the rules and its own heap:
 * on canvas-lms the engines' memory rose by about 0.65 GB a lane (10.3 GB as one process, 12.2 GB
 * as 4 lanes, 14.8 GB as 8, past 15 GB within 12 s as 16), while 8 lanes of 2 jobs kept most of the
 * time saved (UnGovr monorepo 87 to 89 s as one process, 55 s as 8 lanes, 44 s as 16) (#12997).
 */
export const MAX_LANES = 8;

/** How many lanes a scan of `totalBytes` of targets runs: one per LANE_BYTES, at least 1, at most MAX_LANES and `maxJobs`. */
export function laneCount(totalBytes: number, maxJobs: number): number {
  return Math.max(1, Math.min(maxJobs, MAX_LANES, Math.round(totalBytes / LANE_BYTES)));
}

/** Engine jobs for each of `lanes` lanes: the lanes share `maxJobs`, and each has at least one. */
export function jobsPerLane(maxJobs: number, lanes: number): number {
  return Math.max(1, Math.floor(maxJobs / lanes));
}

/**
 * Deal targets to `lanes` lanes: biggest first (ties by path, compared by code unit), round-robin,
 * so each lane gets the same mix of sizes and the largest files land on different lanes. No lane is
 * empty: there are never more lanes than targets. One lane keeps the targets in the order given.
 */
export function dealTargets(targets: string[], lanes: number, bytesOf: (target: string) => number): string[][] {
  if (targets.length === 0) return [];
  const n = Math.max(1, Math.min(lanes, targets.length));
  if (n === 1) return [[...targets]];
  const sized = targets.map((t) => ({ t, b: bytesOf(t) }));
  sized.sort((x, y) => y.b - x.b || (x.t < y.t ? -1 : x.t > y.t ? 1 : 0));
  const out: string[][] = Array.from({ length: n }, () => []);
  sized.forEach((s, i) => (out[i % n] as string[]).push(s.t));
  return out;
}

/**
 * The engine runs in a directory of lexcode's own, never in the scanned
 * repository, so nothing the repository holds (a program the engine starts by
 * name, a relative path in its environment) is found first. The repository is
 * reached through a link of this name in that directory, and targets are
 * `<name>/<path>`. Absolute targets would put the repository's own location in
 * every path, and a rule that excludes `**\/examples/**` would then drop a
 * whole repository that merely lives under a directory called `examples`.
 */
export const ROOT_LINK = 'scan-root';

const versionCache = new Map<string, string>();

/**
 * Extraction caches a run of this engine has filled in this process (`<engine>\0<cache>`). The
 * engine is a self-extracting binary: several copies started at once on an empty cache extract over
 * each other, and some die (SIGBUS, or exit without output; 3 of 3 runs of 8 lanes on an empty
 * cache, #12997). The cache they leave is complete, so one engine run first is enough.
 */
const warmedCaches = new Set<string>();

/** Where lexcode puts what it makes while it runs; the system temporary directory unless a test says otherwise. */
export interface EngineDirs {
  /** Parent of the per-run `lexcode-engine-*` directory. */
  tempRoot?: string;
  /** lexcode's cache directory, under which the engine's self-extracted copy lives. */
  cacheRoot?: string;
}

/**
 * The engine's environment. Everything it would write outside lexcode's own directories is pointed
 * inside them: its scratch files (a copy of the rule set per run, target copies) go to `scratch`,
 * which is removed with the scan; its log, which names the scanned paths, goes to a file in `scratch`;
 * and its self-extracted copy goes to `extractCache`, a directory of lexcode's own cache that only
 * the user can write to. HOME is untouched, and after a scan nothing of the engine's is left there.
 */
export function engineEnv(scratch: string, extractCache: string): NodeJS.ProcessEnv {
  return childEnv({
    SEMGREP_SEND_METRICS: 'off',
    OPENGREP_ENABLE_VERSION_CHECK: '0',
    TMPDIR: scratch,
    TMP: scratch,
    TEMP: scratch,
    SEMGREP_LOG_FILE: join(scratch, 'engine.log'),
    XDG_CACHE_HOME: extractCache,
  });
}

/**
 * Choose the extraction cache: `<cache>/engine-home` when that directory can be made and is ours
 * alone, else a directory inside `tmp` (slower, since the engine extracts itself again, but still
 * private and still removed). `shared` says which: only the shared one outlives the run.
 */
async function extractionCache(tmp: string, d: EngineDirs): Promise<{ dir: string; shared: boolean }> {
  const home = join(d.cacheRoot ?? cacheDir(), 'engine-home');
  try {
    mkdirSync(home, { recursive: true, mode: 0o700 });
  } catch {
    const own = join(tmp, 'xdg');
    mkdirSync(own, { mode: 0o700 });
    return { dir: own, shared: false };
  }
  await checkEngineDir(home);
  return { dir: home, shared: true };
}

/** Make a private scratch directory `dir` (the engine's TMPDIR and log) and return it. */
function makeScratch(dir: string): string {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}

/** What `<engine> --version` prints, read once per engine path. */
export async function engineVersion(engine: string, d: EngineDirs = {}): Promise<string> {
  const cached = versionCache.get(engine);
  if (cached) return cached;
  const tmp = await mkdtemp(join(d.tempRoot ?? tmpdir(), 'lexcode-engine-'));
  const release = trackTempDir(tmp);
  let text: string;
  try {
    const cache = await extractionCache(tmp, d);
    text = await versionText(engine, tmp, engineEnv(makeScratch(join(tmp, 'tmp')), cache.dir));
    if (cache.shared) warmedCaches.add(`${engine}\0${cache.dir}`);
  } finally {
    await release();
  }
  const match = /\d+\.\d+\.\d+\S*/.exec(text);
  const version = match?.[0] ?? text.trim().split('\n')[0] ?? '';
  if (!version) {
    throw new ToolError(`the engine at ${engine} printed no version for --version. Pass a working Opengrep with --engine <path>.`);
  }
  versionCache.set(engine, version);
  return version;
}

/** Run `<engine> --version` in `cwd` with `env` and return what it printed. */
async function versionText(engine: string, cwd: string, env: NodeJS.ProcessEnv): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const child = execFile(
      engine,
      ['--version'],
      { timeout: 30_000, killSignal: 'SIGKILL', windowsHide: true, cwd, env, detached: process.platform !== 'win32' } as Parameters<typeof execFile>[2],
      (err, stdout) => {
        untrack();
        if (err) reject(err);
        else resolve(String(stdout));
      },
    );
    const untrack = trackChild(child);
  }).catch((err: unknown) => {
    if (err instanceof ToolError) throw err;
    throw new ToolError(
      `cannot run the engine at ${engine} (${err instanceof Error ? err.message.split('\n')[0] : String(err)}). Check the path, or run \`lexcode engine fetch\` to install the pinned engine.`,
    );
  });
}

/** The longest an engine run may take, in seconds, unless LEXCODE_ENGINE_DEADLINE says otherwise. */
export const DEFAULT_ENGINE_DEADLINE_SECONDS = 900;

export function engineDeadlineMs(env: Record<string, string | undefined> = process.env): number {
  const raw = env.LEXCODE_ENGINE_DEADLINE;
  if (raw === undefined || raw.trim() === '') return DEFAULT_ENGINE_DEADLINE_SECONDS * 1000;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new ToolError(`LEXCODE_ENGINE_DEADLINE must be a positive number of seconds, not "${raw}".`);
  }
  return Math.round(n * 1000);
}

/** Split paths into groups whose joined length, with one separator between paths, stays at or under maxChars. */
export function chunkTargets(paths: string[], maxChars: number): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  let size = 0;
  for (const p of paths) {
    const added = current.length === 0 ? p.length : p.length + 1;
    if (current.length > 0 && size + added > maxChars) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    size += current.length === 0 ? p.length : p.length + 1;
    current.push(p);
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

export interface RunEngineOptions {
  engine: string;
  configFile: string;
  /** Repository-relative POSIX paths, or absolute paths (lexcode's own extracted script copies). */
  targets: string[];
  /** The scanned repository. The engine does not run here. */
  root: string;
  /** A target's size in bytes, as the target is given; the lane count and the deal read it. Without it every target counts 0 bytes, so the run is one lane. */
  bytesOf?: (target: string) => number;
  /** Override the number of lanes (tests); otherwise `laneCount` of the targets' bytes. Never more than the targets. */
  lanes?: number;
  /** Override the engine's `--jobs` in each lane (tests); otherwise `jobsPerLane`. */
  jobs?: number;
  /** Override the per-invocation target budget (tests). */
  chunkChars?: number;
  /** The whole run, all lanes and chunks, must finish within this many milliseconds; LEXCODE_ENGINE_DEADLINE (seconds), default 15 minutes. */
  deadlineMs?: number;
  /** Where lexcode's temporary and cache directories go; tests inject these. */
  dirs?: EngineDirs;
}

export interface RunEngineResult {
  matches: EngineMatch[];
  fileErrors: number;
  version: string;
}

interface RawError {
  level?: unknown;
  type?: unknown;
  rule_id?: unknown;
  path?: unknown;
  message?: unknown;
  long_msg?: unknown;
  short_msg?: unknown;
}
interface RawResult {
  check_id?: unknown;
  path?: unknown;
  start?: { line?: unknown; col?: unknown };
  end?: { line?: unknown; col?: unknown };
  extra?: { metavars?: Record<string, { abstract_content?: unknown }>; lines?: unknown };
}

function errorType(e: RawError): string {
  const t = e.type;
  if (typeof t === 'string') return t;
  if (Array.isArray(t) && typeof t[0] === 'string') return t[0];
  return '';
}

function errorText(e: RawError): string {
  for (const v of [e.message, e.long_msg, e.short_msg]) {
    if (typeof v === 'string' && v) return v.length > 400 ? `${v.slice(0, 400)}...` : v;
  }
  return errorType(e) || 'unknown engine error';
}

/**
 * A partial parse of an XML file that dropped nothing but processing
 * instructions (`<?m2e ignore?>` in a Maven pom is the common case). The
 * engine's XML grammar rejects the instruction and still reads every element
 * around it, so the file's matches are complete and no evidence is missing.
 * Anything else the parser dropped, or a file lexcode cannot reread, stays a
 * file error.
 */
function onlyProcessingInstructionsDropped(raw: RawError, root: string): boolean {
  const path = typeof raw.path === 'string' ? fromEngine(raw.path) : '';
  if (!/\.(?:xml|pom)$/i.test(path)) return false;
  const spans = (raw as { spans?: unknown }).spans;
  if (!Array.isArray(spans) || spans.length === 0) return false;
  let bytes: Buffer;
  try {
    bytes = readFileSync(isAbsolute(path) ? path : join(root, path));
  } catch {
    return false;
  }
  // The engine counts columns in bytes, so the lines stay bytes until a span is cut out of them.
  const lines: Buffer[] = [];
  for (let from = 0; ; ) {
    const nl = bytes.indexOf(0x0a, from);
    if (nl < 0) {
      lines.push(bytes.subarray(from));
      break;
    }
    lines.push(bytes.subarray(from, nl));
    from = nl + 1;
  }
  type Pos = { line?: unknown; col?: unknown };
  for (const span of spans as { start?: Pos; end?: Pos }[]) {
    const l1 = span.start?.line;
    const c1 = span.start?.col;
    const l2 = span.end?.line;
    const c2 = span.end?.col;
    if (typeof l1 !== 'number' || typeof c1 !== 'number' || typeof l2 !== 'number' || typeof c2 !== 'number') return false;
    if (l1 < 1 || l2 < l1 || l2 > lines.length) return false;
    const parts: Buffer[] = [];
    for (let l = l1; l <= l2; l++) {
      const line = lines[l - 1] as Buffer;
      parts.push(line.subarray(l === l1 ? c1 - 1 : 0, l === l2 ? c2 - 1 : line.length));
    }
    const text = Buffer.concat(parts.flatMap((p, i) => (i === 0 ? [p] : [Buffer.from('\n'), p]))).toString('utf8');
    // Exactly one processing instruction: it opens with `<?`, closes with the first `?>`, and the span ends there.
    if (text.length < 4 || !text.startsWith('<?') || !text.endsWith('?>') || text.indexOf('?>') !== text.length - 2) return false;
  }
  return true;
}

/** Per-file trouble counts in fileErrors; an error that names a rule or the config is fatal. */
function classifyErrors(errors: unknown, root: string): { fileErrors: number; fatal?: string } {
  let fileErrors = 0;
  if (!Array.isArray(errors)) return { fileErrors };
  for (const raw of errors as RawError[]) {
    const type = errorType(raw);
    if (type === 'PartialParsing' && onlyProcessingInstructionsDropped(raw, root)) continue;
    const t = type.toLowerCase();
    const level = String(raw.level ?? '').toLowerCase();
    const ruleish = /rule|pattern|config|yaml|schema|metavar/.test(t);
    const perFile = !ruleish && /pars|syntax|lexical|timeout|too ?big|too ?many|memory|oom|skipped|encoding|size/.test(t);
    if (perFile) {
      fileErrors += 1;
    } else if (level === 'error' && (ruleish || typeof raw.rule_id === 'string')) {
      return { fileErrors, fatal: errorText(raw) };
    } else if (level === 'error' && typeof raw.path === 'string') {
      fileErrors += 1;
    }
  }
  return { fileErrors };
}

function toPosix(p: string): string {
  const s = p.replace(/\\/g, '/');
  return s.startsWith('./') ? s.slice(2) : s;
}

/** An engine-reported path back to what lexcode passed in: the link prefix comes off a repository path. */
function fromEngine(reported: string): string {
  const p = toPosix(reported);
  return p.startsWith(`${ROOT_LINK}/`) ? p.slice(ROOT_LINK.length + 1) : p;
}

/** A match with the positions it is ordered by that the match itself does not carry. */
interface Placed {
  m: EngineMatch;
  col: number;
  endLine: number;
  endCol: number;
  /** The metavariables, name-sorted, as one string. */
  vars: string;
}

const num = (v: unknown): number => (typeof v === 'number' ? v : 0);

function mapResults(results: unknown): Placed[] {
  if (!Array.isArray(results)) return [];
  const out: Placed[] = [];
  for (const r of results as RawResult[]) {
    if (typeof r.check_id !== 'string' || typeof r.path !== 'string') continue;
    const metavars: Record<string, string> = {};
    for (const [name, v] of Object.entries(r.extra?.metavars ?? {})) {
      if (typeof v?.abstract_content === 'string') metavars[name] = v.abstract_content;
    }
    out.push({
      m: {
        ruleId: r.check_id,
        path: fromEngine(r.path),
        line: num(r.start?.line),
        metavars,
        lines: typeof r.extra?.lines === 'string' ? r.extra.lines : '',
      },
      col: num(r.start?.col),
      endLine: num(r.end?.line),
      endCol: num(r.end?.col),
      vars: JSON.stringify(Object.entries(metavars).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
    });
  }
  return out;
}

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/**
 * The one order matches come back in, whatever the lanes: path, start line, start column, rule id,
 * end line, end column, matched text, metavariables. The engine writes each file's matches in start
 * order, so for one rule's matches on one line that start at different columns this is the
 * engine's own order, and the evidence a record keeps for such a line (the first; `buildRecord`
 * sorts by path, line and rule id only) is the one it kept before the matches were sorted here.
 */
function compareMatches(a: Placed, b: Placed): number {
  return (
    cmp(a.m.path, b.m.path) ||
    a.m.line - b.m.line ||
    a.col - b.col ||
    cmp(a.m.ruleId, b.m.ruleId) ||
    a.endLine - b.endLine ||
    a.endCol - b.endCol ||
    cmp(a.m.lines, b.m.lines) ||
    cmp(a.vars, b.vars)
  );
}

function lastLines(text: string, n: number): string {
  return text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== '')
    .slice(-n)
    .join('\n');
}

interface Spawned {
  code: number | null;
  signal: string | null;
  stderr: string;
  timedOut: boolean;
  /** Another lane failed and the run stopped this one. */
  stopped: boolean;
}

/**
 * The engine processes of one run, across its lanes. When one lane fails, `stop` ends every other
 * lane's process group, and a lane that has not yet started its next chunk does not start it.
 */
class LaneGroup {
  stopped = false;
  private readonly live = new Set<ChildProcess>();
  private readonly signalled = new Set<ChildProcess>();
  add(child: ChildProcess): void {
    this.live.add(child);
    if (this.stopped) this.end(child);
  }
  remove(child: ChildProcess): void {
    this.live.delete(child);
  }
  /** Whether this group stopped `child` while it was still running: its exit, code 0 included, is not its own. */
  stoppedChild(child: ChildProcess): boolean {
    return this.signalled.has(child);
  }
  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    // After the exits Node has already reaped are recorded, so a lane that failed on its own at the same moment keeps its error.
    setImmediate(() => {
      for (const c of this.live) this.end(c);
    });
  }
  private end(child: ChildProcess): void {
    if (child.exitCode !== null || child.signalCode !== null || this.signalled.has(child)) return;
    this.signalled.add(child);
    void terminateGroup(child);
  }
}

/** Thrown inside a lane that another lane's failure stopped; never leaves runEngine. */
class LaneStopped extends Error {}

/**
 * Run the engine in its own process group, so a stop or a deadline takes its workers with it. The
 * child is registered with the cleanup module for the duration, which kills the group when lexcode
 * itself is interrupted, and with the run's lane group, which kills it when another lane fails.
 */
async function spawnEngine(engine: string, args: string[], cwd: string, env: NodeJS.ProcessEnv, deadlineAt: number, group: LaneGroup): Promise<Spawned> {
  return new Promise((resolve, reject) => {
    const child: ChildProcess = spawn(engine, args, {
      cwd,
      env,
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
      detached: process.platform !== 'win32',
    });
    const tracked = trackChild(child);
    group.add(child);
    const untrack = (): void => {
      group.remove(child);
      tracked();
    };
    let stderr = '';
    let timedOut = false;
    child.stderr?.setEncoding('utf8');
    child.stderr?.on('data', (d: string) => {
      stderr = (stderr + d).slice(-16_000);
    });
    const timer = setTimeout(() => {
      timedOut = true;
      void terminateGroup(child);
    }, Math.max(0, deadlineAt - Date.now()));
    child.on('error', (err) => {
      clearTimeout(timer);
      untrack();
      reject(err);
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      // The engine's workers can outlive it; the group goes with it.
      void terminateGroup(child).finally(() => {
        untrack();
        resolve({ code, signal, stderr, timedOut, stopped: group.stoppedChild(child) });
      });
    });
  });
}

/** One lane: its share of the targets in invocation-sized chunks, and a directory, scratch and log of its own. */
interface Lane {
  chunks: string[][];
  dir: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
}

interface LaneResult {
  placed: Placed[];
  fileErrors: number;
  version?: string;
}

/**
 * Run the engine over the targets as one or more lanes at once (see LANE_BYTES), under one
 * deadline. When a lane fails the others are stopped, and the error is the lowest-numbered failed
 * lane's. No engine process outlives the call. The matches come back in one fixed order (see
 * compareMatches), so the result does not depend on the number of lanes.
 */
export async function runEngine(o: RunEngineOptions): Promise<RunEngineResult> {
  const dirs = o.dirs ?? {};
  const cliVersion = await engineVersion(o.engine, dirs);
  if (o.targets.length === 0) return { matches: [], fileErrors: 0, version: cliVersion };

  const maxJobs = Math.min(availableParallelism(), MAX_JOBS);
  const bytesOf = o.bytesOf ?? ((): number => 0);
  const wanted = o.lanes ?? laneCount(o.targets.reduce((n, t) => n + bytesOf(t), 0), maxJobs);
  const shares = dealTargets(o.targets, wanted, bytesOf);
  const jobs = o.jobs ?? jobsPerLane(maxJobs, shares.length);
  const chunkChars = o.chunkChars ?? (process.platform === 'win32' ? CHUNK_CHARS_WINDOWS : CHUNK_CHARS_OTHER);

  const deadlineMs = o.deadlineMs ?? engineDeadlineMs();
  const deadlineAt = Date.now() + deadlineMs;
  const tmp = await mkdtemp(join(dirs.tempRoot ?? tmpdir(), 'lexcode-engine-'));
  const release = trackTempDir(tmp);
  try {
    const cache = await extractionCache(tmp, dirs);
    const lanes: Lane[] = shares.map((share, i) => {
      const dir = join(tmp, `lane-${i}`);
      const cwd = join(dir, 'cwd');
      mkdirSync(cwd, { recursive: true });
      symlinkSync(o.root, join(cwd, ROOT_LINK), 'junction');
      const given = share.map((t) => (isAbsolute(t) ? t : `${ROOT_LINK}/${t}`));
      return { chunks: chunkTargets(given, chunkChars), dir, cwd, env: engineEnv(makeScratch(join(dir, 'tmp')), cache.dir) };
    });
    // Lanes start at once: the engine extracts itself first, alone (see warmedCaches).
    const warmKey = `${o.engine}\0${cache.dir}`;
    if (lanes.length > 1 && !warmedCaches.has(warmKey)) {
      const warm = join(tmp, 'warm');
      await versionText(o.engine, makeScratch(warm), engineEnv(makeScratch(join(warm, 'tmp')), cache.dir));
      if (cache.shared) warmedCaches.add(warmKey);
    }
    const group = new LaneGroup();
    const settled = await Promise.all(
      lanes.map((lane) =>
        runLane(o, lane, jobs, deadlineMs, deadlineAt, group).then(
          (r) => ({ r }),
          (e: unknown) => {
            if (!(e instanceof LaneStopped)) group.stop();
            return { e };
          },
        ),
      ),
    );
    const failed = settled.find((s): s is { e: unknown } => 'e' in s && !(s.e instanceof LaneStopped));
    if (failed) throw failed.e;
    const placed: Placed[] = [];
    let fileErrors = 0;
    let version = cliVersion;
    for (const s of settled) {
      if (!('r' in s)) continue;
      placed.push(...s.r.placed);
      fileErrors += s.r.fileErrors;
      if (s.r.version) version = s.r.version;
    }
    placed.sort(compareMatches);
    return { matches: placed.map((p) => p.m), fileErrors, version };
  } finally {
    await release();
  }
}

/** Run one lane's chunks one after another. Throws the ToolError today's single run would, or LaneStopped. */
async function runLane(o: RunEngineOptions, lane: Lane, jobs: number, deadlineMs: number, deadlineAt: number, group: LaneGroup): Promise<LaneResult> {
  const out: LaneResult = { placed: [], fileErrors: 0 };
  for (const [i, chunk] of lane.chunks.entries()) {
    if (group.stopped) throw new LaneStopped();
    const outFile = join(lane.dir, `out-${i}.json`);
    const args = [
      'scan',
      '--config',
      o.configFile,
      '--json-output',
      outFile,
      '--disable-version-check',
      '--no-rewrite-rule-ids',
      '--exclude-minified-files',
      '--quiet',
      '--timeout',
      '30',
      '--jobs',
      String(jobs),
      '--',
      ...chunk,
    ];
    const run = await spawnEngine(o.engine, args, lane.cwd, lane.env, deadlineAt, group).catch((err: unknown) => {
      throw new ToolError(
        `cannot start the engine at ${o.engine} (${err instanceof Error ? err.message : String(err)}). Run \`lexcode engine fetch\` or pass --engine <path>.`,
      );
    });
    // Another lane failed and this one was stopped for it: that lane's error is the run's. The engine
    // can exit 0 on SIGTERM, so its exit status does not say this.
    if (run.stopped && !run.timedOut) throw new LaneStopped();
    if (run.timedOut) {
      throw new ToolError(
        `the engine did not finish within ${(deadlineMs / 1000).toLocaleString('en-US')} seconds (the LEXCODE_ENGINE_DEADLINE limit, 900 by default) and was stopped. ` +
          'A generated or very large file can keep it busy; exclude it in the sidecar (exclude:) or raise LEXCODE_ENGINE_DEADLINE.',
      );
    }
    if (run.code !== 0) {
      const tail = lastLines(run.stderr, 5);
      const how = run.signal ? `was stopped by ${run.signal}` : `exited with code ${String(run.code)}`;
      throw new ToolError(`the engine ${how}${tail ? `:\n${tail}` : ' without a message'}\nRe-run with the same arguments directly to see the full output.`);
    }
    let raw: unknown;
    try {
      raw = JSON.parse(await readFile(outFile, 'utf8'));
    } catch (err) {
      const missing = (err as NodeJS.ErrnoException).code === 'ENOENT';
      throw new ToolError(
        missing
          ? 'the engine finished but wrote no output file. Update the engine with `lexcode engine fetch`, or report this with the engine version.'
          : 'the engine wrote output that is not valid JSON. Update the engine with `lexcode engine fetch`, or report this with the engine version.',
      );
    }
    if (typeof raw !== 'object' || raw === null) {
      throw new ToolError('the engine wrote JSON in an unexpected shape. Update the engine with `lexcode engine fetch`.');
    }
    const doc = raw as { version?: unknown; results?: unknown; errors?: unknown };
    const classified = classifyErrors(doc.errors, o.root);
    if (classified.fatal) {
      throw new ToolError(`the engine rejected the rule set: ${classified.fatal}\nRun \`lexcode rules\` to list the rules, or pass a corrected --rules <dir>.`);
    }
    out.fileErrors += classified.fileErrors;
    out.placed.push(...mapResults(doc.results));
    if (typeof doc.version === 'string' && doc.version) out.version = doc.version;
  }
  return out;
}
