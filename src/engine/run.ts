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
 * 2 MiB. Every extra invocation parses the rules again and splits the
 * engine's parallelism, which on the UnGovr monorepo doubled the scan time,
 * so outside Windows a repository of several thousand files is one run.
 */
export const CHUNK_CHARS_WINDOWS = 24_000;
export const CHUNK_CHARS_OTHER = 600_000;
/** Engine worker processes: parsing is most of a scan's cost and scales with them. */
export const MAX_JOBS = 16;

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
 * Make the scratch directory inside `tmp` and choose the extraction cache: `<cache>/engine-home` when
 * that directory can be made and is ours alone, else a directory inside `tmp` (slower, since the engine
 * extracts itself again, but still private and still removed).
 */
async function engineSpace(tmp: string, d: EngineDirs): Promise<{ scratch: string; extractCache: string }> {
  const scratch = join(tmp, 'tmp');
  mkdirSync(scratch, { mode: 0o700 });
  const home = join(d.cacheRoot ?? cacheDir(), 'engine-home');
  try {
    mkdirSync(home, { recursive: true, mode: 0o700 });
  } catch {
    const own = join(tmp, 'xdg');
    mkdirSync(own, { mode: 0o700 });
    return { scratch, extractCache: own };
  }
  await checkEngineDir(home);
  return { scratch, extractCache: home };
}

/** What `<engine> --version` prints, read once per engine path. */
export async function engineVersion(engine: string, d: EngineDirs = {}): Promise<string> {
  const cached = versionCache.get(engine);
  if (cached) return cached;
  const tmp = await mkdtemp(join(d.tempRoot ?? tmpdir(), 'lexcode-engine-'));
  const release = trackTempDir(tmp);
  let text: string;
  try {
    const space = await engineSpace(tmp, d);
    text = await new Promise<string>((resolve, reject) => {
      const child = execFile(
        engine,
        ['--version'],
        { timeout: 30_000, killSignal: 'SIGKILL', windowsHide: true, cwd: tmp, env: engineEnv(space.scratch, space.extractCache), detached: process.platform !== 'win32' } as Parameters<typeof execFile>[2],
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
  jobs?: number;
  /** Override the per-run target budget (tests). */
  chunkChars?: number;
  /** The whole run, all chunks, must finish within this many milliseconds; LEXCODE_ENGINE_DEADLINE (seconds), default 15 minutes. */
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
  start?: { line?: unknown };
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
  let lines: string[];
  try {
    lines = readFileSync(isAbsolute(path) ? path : join(root, path), 'utf8').split(/\r\n|\n|\r/);
  } catch {
    return false;
  }
  for (const span of spans as { start?: { line?: unknown; col?: unknown } }[]) {
    const line = span.start?.line;
    const col = span.start?.col;
    if (typeof line !== 'number' || typeof col !== 'number') return false;
    if (!(lines[line - 1] ?? '').startsWith('<?', col - 1)) return false;
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

function mapResults(results: unknown): EngineMatch[] {
  if (!Array.isArray(results)) return [];
  const out: EngineMatch[] = [];
  for (const r of results as RawResult[]) {
    if (typeof r.check_id !== 'string' || typeof r.path !== 'string') continue;
    const metavars: Record<string, string> = {};
    for (const [name, v] of Object.entries(r.extra?.metavars ?? {})) {
      if (typeof v?.abstract_content === 'string') metavars[name] = v.abstract_content;
    }
    out.push({
      ruleId: r.check_id,
      path: fromEngine(r.path),
      line: typeof r.start?.line === 'number' ? r.start.line : 0,
      metavars,
      lines: typeof r.extra?.lines === 'string' ? r.extra.lines : '',
    });
  }
  return out;
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
}

/**
 * Run the engine in its own process group, so a stop or a deadline takes its workers with it. The
 * child is registered with the cleanup module for the duration, which kills the group when lexcode
 * itself is interrupted.
 */
async function spawnEngine(engine: string, args: string[], cwd: string, env: NodeJS.ProcessEnv, deadlineAt: number): Promise<Spawned> {
  return new Promise((resolve, reject) => {
    const child: ChildProcess = spawn(engine, args, {
      cwd,
      env,
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
      detached: process.platform !== 'win32',
    });
    const untrack = trackChild(child);
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
        resolve({ code, signal, stderr, timedOut });
      });
    });
  });
}

export async function runEngine(o: RunEngineOptions): Promise<RunEngineResult> {
  const dirs = o.dirs ?? {};
  const cliVersion = await engineVersion(o.engine, dirs);
  const given = o.targets.map((t) => (isAbsolute(t) ? t : `${ROOT_LINK}/${t}`));
  const chunks = chunkTargets(given, o.chunkChars ?? (process.platform === 'win32' ? CHUNK_CHARS_WINDOWS : CHUNK_CHARS_OTHER));
  const jobs = o.jobs ?? Math.min(availableParallelism(), MAX_JOBS);
  const matches: EngineMatch[] = [];
  let fileErrors = 0;
  let version = cliVersion;
  if (chunks.length === 0) return { matches, fileErrors, version };

  const deadlineMs = o.deadlineMs ?? engineDeadlineMs();
  const deadlineAt = Date.now() + deadlineMs;
  const tmp = await mkdtemp(join(dirs.tempRoot ?? tmpdir(), 'lexcode-engine-'));
  const release = trackTempDir(tmp);
  try {
    const cwd = join(tmp, 'cwd');
    mkdirSync(cwd);
    symlinkSync(o.root, join(cwd, ROOT_LINK), 'junction');
    const space = await engineSpace(tmp, dirs);
    const env = engineEnv(space.scratch, space.extractCache);
    for (const [i, chunk] of chunks.entries()) {
      const outFile = join(tmp, `out-${i}.json`);
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
      const run = await spawnEngine(o.engine, args, cwd, env, deadlineAt).catch((err: unknown) => {
        throw new ToolError(
          `cannot start the engine at ${o.engine} (${err instanceof Error ? err.message : String(err)}). Run \`lexcode engine fetch\` or pass --engine <path>.`,
        );
      });
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
      fileErrors += classified.fileErrors;
      matches.push(...mapResults(doc.results));
      if (typeof doc.version === 'string' && doc.version) version = doc.version;
    }
  } finally {
    await release();
  }
  return { matches, fileErrors, version };
}
