import { spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

// These run the compiled command line as a separate process, because they send it signals.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STUB = join(root, 'test', 'stubs', 'fake-opengrep.mjs');
const FIXTURE = join(root, 'test', 'repos', 'basic');
const RULES_HOME = join(root, 'test', 'repos', 'rules-home');
const outDir = join(root, 'test', '.tmp', `signals-build-${process.pid}`);
const skip = process.platform === 'win32';

let work: string;
let priv: string;
let repo: string;

beforeAll(() => {
  if (skip) return;
  const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  const built = spawnSync(process.execPath, [tsc, '-p', join(root, 'tsconfig.json'), '--outDir', outDir], { cwd: root, encoding: 'utf8' });
  if (built.status !== 0) throw new Error(`tsc failed:\n${built.stdout}${built.stderr}`);
}, 120_000);

afterAll(() => {
  rmSync(outDir, { recursive: true, force: true });
});

beforeEach(() => {
  work = mkdtempSync(join(tmpdir(), 'lexcode-sig-'));
  priv = join(work, 'tmp');
  mkdirSync(priv);
  repo = join(work, 'basic');
  cpSync(FIXTURE, repo, { recursive: true });
});
afterEach(() => {
  rmSync(work, { recursive: true, force: true });
});

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
async function until(what: string, ok: () => boolean, ms = 20_000): Promise<void> {
  const t0 = Date.now();
  while (!ok()) {
    if (Date.now() - t0 > ms) throw new Error(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 50));
  }
}

function launch(extraEnv: Record<string, string>): { exited: Promise<{ code: number | null; signal: string | null; stderr: string }>; kill: (s: NodeJS.Signals) => void } {
  const child = spawn(process.execPath, [join(outDir, 'cli.js'), 'scan', repo, '--rules', join(repo, '.rules'), '--engine', STUB, '--json'], {
    env: {
      ...process.env,
      TMPDIR: priv,
      LEXCODE_CACHE_DIR: join(work, 'cache'),
      LEXCODE_RULES_HOME: RULES_HOME,
      FAKE_OPENGREP_PID_FILE: join(work, 'engine.pid'),
      FAKE_OPENGREP_GRANDCHILD_PID_FILE: join(work, 'worker.pid'),
      ...extraEnv,
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (d: Buffer) => {
    stderr += d.toString('utf8');
  });
  const exited = new Promise<{ code: number | null; signal: string | null; stderr: string }>((res) => {
    child.on('close', (code, signal) => res({ code, signal, stderr }));
  });
  return { exited, kill: (s) => void child.kill(s) };
}

async function engineAndWorker(): Promise<{ engine: number; worker: number }> {
  await until('the engine and its worker to start', () => existsSync(join(work, 'worker.pid')) && readFileSync(join(work, 'worker.pid'), 'utf8') !== '');
  return { engine: Number(readFileSync(join(work, 'engine.pid'), 'utf8')), worker: Number(readFileSync(join(work, 'worker.pid'), 'utf8')) };
}

describe.skipIf(skip)('lexcode scan stopped by a signal or a deadline', () => {
  it.each([
    ['SIGTERM', 143],
    ['SIGINT', 130],
  ] as const)('on %s kills the engine and its worker, removes its temporary directories and exits %i', async (signal, code) => {
    const run = launch({ FAKE_OPENGREP_MODE: 'sleep-ignore-term' });
    const { engine, worker } = await engineAndWorker();
    expect(alive(engine) && alive(worker)).toBe(true);
    expect(readdirSync(priv).some((n) => n.startsWith('lexcode-scan-'))).toBe(true);
    run.kill(signal);
    const done = await run.exited;
    expect(done.code).toBe(code);
    await until('the engine to be gone', () => !alive(engine), 10_000);
    await until('its worker to be gone', () => !alive(worker), 10_000);
    expect(readdirSync(priv)).toEqual([]);
  }, 60_000);

  it('kills the engine at the deadline, exits 2 and names the deadline', async () => {
    const run = launch({ FAKE_OPENGREP_MODE: 'sleep', LEXCODE_ENGINE_DEADLINE: '2' });
    const { engine, worker } = await engineAndWorker();
    const done = await run.exited;
    expect(done.code).toBe(2);
    expect(done.stderr).toMatch(/did not finish within 2 seconds/);
    expect(done.stderr).toContain('LEXCODE_ENGINE_DEADLINE');
    await until('the engine to be gone', () => !alive(engine), 10_000);
    await until('its worker to be gone', () => !alive(worker), 10_000);
    expect(readdirSync(priv)).toEqual([]);
  }, 60_000);

  it('does not leave scan directories behind after a normal run either', async () => {
    const run = launch({ FAKE_OPENGREP_MODE: 'ok' });
    const done = await run.exited;
    expect(done.code).toBe(0);
    expect(readdirSync(priv)).toEqual([]);
  }, 60_000);
});

describe.skipIf(skip)('a reader that closes the pipe early (#12745)', () => {
  it('ends quietly with exit 0, as `lexcode deps | head -1` needs, instead of an unhandled EPIPE', async () => {
    const deps: Record<string, string> = {};
    for (let i = 0; i < 4000; i++) deps[`package-number-${i}`] = '1.0.0';
    const dir = join(work, 'many');
    mkdirSync(dir);
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'many', version: '1.0.0', dependencies: deps }));
    const child = spawn(process.execPath, [join(outDir, 'cli.js'), 'deps', dir], {
      env: { ...process.env, LEXCODE_RULES_HOME: RULES_HOME },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
    child.stdout.once('data', () => child.stdout.destroy());
    const code = await new Promise<number | null>((r) => child.on('close', (c) => r(c)));
    expect(stderr).not.toMatch(/EPIPE|Unhandled|unexpected error/);
    expect(code).toBe(0);
  }, 30_000);
});

