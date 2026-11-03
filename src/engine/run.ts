import { execFile, spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { availableParallelism, tmpdir } from 'node:os';
import { join } from 'node:path';
import { ToolError } from '../errors.js';
import type { EngineMatch } from '../types.js';

/** Characters of target paths per engine invocation: Windows caps a command line near 32,767. */
export const CHUNK_CHARS_WINDOWS = 24_000;
export const CHUNK_CHARS_OTHER = 200_000;

const versionCache = new Map<string, string>();

/** What `<engine> --version` prints, read once per engine path. */
export async function engineVersion(engine: string): Promise<string> {
  const cached = versionCache.get(engine);
  if (cached) return cached;
  const text = await new Promise<string>((resolve, reject) => {
    execFile(engine, ['--version'], { timeout: 30_000, windowsHide: true, env: engineEnv() }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  }).catch((err: unknown) => {
    throw new ToolError(
      `cannot run the engine at ${engine} (${err instanceof Error ? err.message.split('\n')[0] : String(err)}). Check the path, or run \`lexcode engine fetch\` to install the pinned engine.`,
    );
  });
  const match = /\d+\.\d+\.\d+\S*/.exec(text);
  const version = match?.[0] ?? text.trim().split('\n')[0] ?? '';
  if (!version) {
    throw new ToolError(`the engine at ${engine} printed no version for --version. Pass a working Opengrep with --engine <path>.`);
  }
  versionCache.set(engine, version);
  return version;
}

function engineEnv(): NodeJS.ProcessEnv {
  return { ...process.env, SEMGREP_SEND_METRICS: 'off', OPENGREP_ENABLE_VERSION_CHECK: '0' };
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
  targets: string[];
  cwd: string;
  jobs?: number;
  /** Override the per-run target budget (tests). */
  chunkChars?: number;
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

/** Per-file trouble counts in fileErrors; an error that names a rule or the config is fatal. */
function classifyErrors(errors: unknown): { fileErrors: number; fatal?: string } {
  let fileErrors = 0;
  if (!Array.isArray(errors)) return { fileErrors };
  for (const raw of errors as RawError[]) {
    const type = errorType(raw);
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
      path: toPosix(r.path),
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

async function spawnEngine(engine: string, args: string[], cwd: string): Promise<{ code: number | null; signal: string | null; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(engine, args, { cwd, env: engineEnv(), stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (d: string) => {
      stderr = (stderr + d).slice(-16_000);
    });
    child.on('error', reject);
    child.on('close', (code, signal) => resolve({ code, signal, stderr }));
  });
}

export async function runEngine(o: RunEngineOptions): Promise<RunEngineResult> {
  const cliVersion = await engineVersion(o.engine);
  const chunks = chunkTargets(o.targets, o.chunkChars ?? (process.platform === 'win32' ? CHUNK_CHARS_WINDOWS : CHUNK_CHARS_OTHER));
  const jobs = o.jobs ?? Math.min(availableParallelism(), 8);
  const matches: EngineMatch[] = [];
  let fileErrors = 0;
  let version = cliVersion;
  if (chunks.length === 0) return { matches, fileErrors, version };

  const tmp = await mkdtemp(join(tmpdir(), 'lexcode-engine-'));
  try {
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
      const run = await spawnEngine(o.engine, args, o.cwd).catch((err: unknown) => {
        throw new ToolError(
          `cannot start the engine at ${o.engine} (${err instanceof Error ? err.message : String(err)}). Run \`lexcode engine fetch\` or pass --engine <path>.`,
        );
      });
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
      const classified = classifyErrors(doc.errors);
      if (classified.fatal) {
        throw new ToolError(`the engine rejected the rule set: ${classified.fatal}\nRun \`lexcode rules\` to list the rules, or pass a corrected --rules <dir>.`);
      }
      fileErrors += classified.fileErrors;
      matches.push(...mapResults(doc.results));
      if (typeof doc.version === 'string' && doc.version) version = doc.version;
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
  return { matches, fileErrors, version };
}
