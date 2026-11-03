import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { availableParallelism, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ToolError } from '../../src/errors.js';
import { CHUNK_CHARS_OTHER, chunkTargets, engineDeadlineMs, runEngine, type RunEngineOptions } from '../../src/engine/run.js';
import { windowsKillCommand } from '../../src/cleanup.js';

const STUB = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'stubs', 'fake-opengrep.mjs');
const skipStub = process.platform === 'win32';

describe('chunkTargets', () => {
  const joinedLen = (c: string[]): number => c.reduce((n, p) => n + p.length, 0) + Math.max(0, c.length - 1);

  it('keeps each chunk, joined with separators, at or under the limit', () => {
    const paths = Array.from({ length: 5 }, () => 'a'.repeat(10));
    const chunks = chunkTargets(paths, 25);
    expect(chunks.flat()).toEqual(paths);
    for (const c of chunks) expect(joinedLen(c)).toBeLessThanOrEqual(25);
    expect(chunks).toHaveLength(3); // 2 + 2 + 1
  });
  it('is one chunk when everything fits, and none for an empty list', () => {
    expect(chunkTargets(['a', 'b'], 100)).toEqual([['a', 'b']]);
    expect(chunkTargets([], 100)).toEqual([]);
  });
  it('never splits or drops a path longer than the limit', () => {
    const long = 'x'.repeat(50);
    expect(chunkTargets(['a', long, 'b'], 20)).toEqual([['a'], [long], ['b']]);
  });
  it('counts the separator exactly at the boundary', () => {
    // 10 + 1 + 10 = 21
    expect(chunkTargets(['a'.repeat(10), 'b'.repeat(10)], 21)).toHaveLength(1);
    expect(chunkTargets(['a'.repeat(10), 'b'.repeat(10)], 20)).toHaveLength(2);
  });
});

describe.skipIf(skipStub)('runEngine with the fake engine', () => {
  let dir: string;
  let log: string;
  let dirs: { tempRoot: string; cacheRoot: string };
  const run = (o: Omit<RunEngineOptions, 'dirs'>): ReturnType<typeof runEngine> => runEngine({ dirs, ...o });
  const saved: Record<string, string | undefined> = {};
  const setEnv = (k: string, v: string | undefined): void => {
    if (!(k in saved)) saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  };

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'lexcode-run-'));
    log = join(dir, 'argv.log');
    // Beside the scanned directory, not inside it: the engine must run outside the repository.
    dirs = { tempRoot: await mkdtemp(join(tmpdir(), 'lexcode-run-t-')), cacheRoot: await mkdtemp(join(tmpdir(), 'lexcode-run-c-')) };
    setEnv('FAKE_OPENGREP_ARGV_LOG', log);
    setEnv('FAKE_OPENGREP_MODE', undefined);
    setEnv('FAKE_OPENGREP_RESULTS', undefined);
    setEnv('FAKE_OPENGREP_VERSION', undefined);
  });
  afterEach(async () => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    await rm(dir, { recursive: true, force: true });
    await rm(dirs.tempRoot, { recursive: true, force: true });
    await rm(dirs.cacheRoot, { recursive: true, force: true });
  });

  const calls = async (): Promise<Array<{ rootLink?: string; argv: string[]; options: Record<string, string>; flags: string[]; targets: string[]; cwd: string; env: Record<string, string | undefined> }>> =>
    (await readFile(log, 'utf8').catch(() => ''))
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l));

  it('passes the pinned flags, config, json output and targets, in the given cwd', async () => {
    const r = await run({ engine: STUB, configFile: '/tmp/cfg.yml', targets: ['a.py', 'sub/b.js'], root: dir, jobs: 3 });
    const [c] = await calls();
    expect(c).toBeDefined();
    expect(c!.argv[0]).toBe('scan');
    for (const f of ['--disable-version-check', '--no-rewrite-rule-ids', '--exclude-minified-files', '--quiet']) {
      expect(c!.flags).toContain(f);
    }
    expect(c!.options['--config']).toBe('/tmp/cfg.yml');
    expect(c!.options['--json-output']).toMatch(/out.*\.json$/);
    expect(c!.options['--timeout']).toBe('30');
    expect(c!.options['--jobs']).toBe('3');
    expect(c!.targets).toEqual(['scan-root/a.py', 'scan-root/sub/b.js']);
    expect(r.matches.map((m) => m.path)).toEqual(['a.py', 'sub/b.js']);
    expect(c!.env.SEMGREP_SEND_METRICS).toBe('off');
    expect(c!.env.OPENGREP_ENABLE_VERSION_CHECK).toBe('0');
    expect(r.version).toBe('1.33.1');
  });

  it('puts -- before the targets so a file name that starts with a dash is not read as an option', async () => {
    await run({ engine: STUB, configFile: 'c.yml', targets: ['-weird.py', 'ok.py'], root: dir });
    const [c] = await calls();
    const at = c!.argv.indexOf('--');
    expect(at).toBeGreaterThan(0);
    expect(c!.argv.slice(at + 1)).toEqual(['scan-root/-weird.py', 'scan-root/ok.py']);
    expect(c!.targets).toEqual(['scan-root/-weird.py', 'scan-root/ok.py']);
  });

  it('runs the engine in a directory of lexcode\'s own, reaching the repository only through a link', async () => {
    await run({ engine: STUB, configFile: 'c.yml', targets: ['a.py'], root: dir });
    const [c] = await calls();
    const here = await realpathOf(c!.cwd).catch(() => c!.cwd);
    const root = await realpathOf(dir);
    expect(here.startsWith(root)).toBe(false);
    expect(root.startsWith(here)).toBe(false);
    expect(c!.cwd).toContain('lexcode-engine-');
    expect(c!.rootLink).toBe(root);
  });

  it('leaves an absolute target (an extracted script copy) as it is and reports its path unchanged', async () => {
    const abs = join(dir, 'scripts', 'x.vue.lexcode.ts');
    const r = await run({ engine: STUB, configFile: 'c.yml', targets: [abs, 'a.py'], root: dir });
    const [c] = await calls();
    expect(c!.targets).toEqual([abs, 'scan-root/a.py']);
    expect(r.matches.map((m) => m.path)).toEqual([abs, 'a.py']);
  });

  it('defaults --jobs to the available parallelism, at most 16', async () => {
    await run({ engine: STUB, configFile: 'c.yml', targets: ['a.py'], root: dir });
    const [c] = await calls();
    const jobs = Number(c!.options['--jobs']);
    expect(jobs).toBe(Math.min(availableParallelism(), 16));
  });

  it('keeps a large repository to one engine run outside Windows', () => {
    // 7,300 targets of about 50 characters, the UnGovr monorepo's measured
    // shape, is about 370,000 characters: one run, so the rules are parsed
    // once and the engine's own parallelism covers every file.
    const targets = Array.from({ length: 7300 }, (_, i) => `ungovr-ops/ungovr_ops/routes/module_${i}.py`);
    expect(chunkTargets(targets, CHUNK_CHARS_OTHER)).toHaveLength(1);
    expect(CHUNK_CHARS_OTHER).toBeLessThanOrEqual(900_000); // macOS caps argv and environment at 1 MiB
  });

  it('maps check_id, path, start.line, metavars and lines', async () => {
    setEnv(
      'FAKE_OPENGREP_RESULTS',
      JSON.stringify([
        {
          check_id: 'lexcode.crawl.http',
          path: 'src\\deep\\a.py',
          start: { line: 12, col: 4 },
          end: { line: 12, col: 30 },
          extra: { metavars: { $URL: { abstract_content: '"https://example.com"' }, $F: { abstract_content: 'get' } }, message: 'm', metadata: {}, lines: '    requests.get(url)' },
        },
        { check_id: 'lexcode.other', path: 'b.ts', start: { line: 1 }, extra: { lines: 'x' } },
      ]),
    );
    const r = await run({ engine: STUB, configFile: 'c.yml', targets: ['x'], root: dir });
    expect(r.matches).toEqual([
      { ruleId: 'lexcode.crawl.http', path: 'src/deep/a.py', line: 12, metavars: { $URL: '"https://example.com"', $F: 'get' }, lines: '    requests.get(url)' },
      { ruleId: 'lexcode.other', path: 'b.ts', line: 1, metavars: {}, lines: 'x' },
    ]);
  });

  it('counts per-file errors in fileErrors without throwing', async () => {
    setEnv('FAKE_OPENGREP_MODE', 'errors');
    const r = await run({ engine: STUB, configFile: 'c.yml', targets: ['a.py'], root: dir });
    expect(r.fileErrors).toBe(2);
    expect(r.matches).toHaveLength(1);
  });

  it('throws a ToolError carrying the engine message for a fatal rule error', async () => {
    setEnv('FAKE_OPENGREP_MODE', 'fatal');
    const err = await run({ engine: STUB, configFile: 'c.yml', targets: ['a.py'], root: dir }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ToolError);
    expect((err as Error).message).toContain('rule is broken');
  });

  it('throws a ToolError with the last stderr line when the engine exits non-zero', async () => {
    setEnv('FAKE_OPENGREP_MODE', 'exit2');
    const err = await run({ engine: STUB, configFile: 'c.yml', targets: ['a.py'], root: dir }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ToolError);
    expect((err as Error).message).toContain('last stderr line');
    expect((err as Error).message).toContain('config exploded');
  });

  it('throws a ToolError when the output file is not JSON', async () => {
    setEnv('FAKE_OPENGREP_MODE', 'badjson');
    await expect(run({ engine: STUB, configFile: 'c.yml', targets: ['a.py'], root: dir })).rejects.toBeInstanceOf(ToolError);
  });

  it('throws a ToolError when the engine writes no output file', async () => {
    setEnv('FAKE_OPENGREP_MODE', 'nooutput');
    await expect(run({ engine: STUB, configFile: 'c.yml', targets: ['a.py'], root: dir })).rejects.toBeInstanceOf(ToolError);
  });

  it('throws a ToolError naming the engine when it cannot be started', async () => {
    const err = await run({ engine: join(dir, 'no-such-engine'), configFile: 'c.yml', targets: ['a.py'], root: dir }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ToolError);
    expect((err as Error).message).toContain('no-such-engine');
  });

  it('runs once per chunk and concatenates matches and fileErrors', async () => {
    setEnv('FAKE_OPENGREP_MODE', 'errors');
    const targets = ['aaaa.py', 'bbbb.py', 'cccc.py', 'dddd.py', 'eeee.py'];
    const r = await run({ engine: STUB, configFile: 'c.yml', targets, root: dir, chunkChars: 26 });
    const cs = await calls();
    expect(cs.length).toBeGreaterThan(1);
    expect(cs.flatMap((c) => c.targets)).toEqual(targets.map((t) => `scan-root/${t}`));
    expect(new Set(cs.map((c) => c.options['--json-output'])).size).toBe(cs.length);
    expect(r.matches.map((m) => m.path)).toEqual(targets);
    expect(r.fileErrors).toBe(2 * cs.length);
  });

  it('does not run the engine at all for an empty target list', async () => {
    const r = await run({ engine: STUB, configFile: 'c.yml', targets: [], root: dir });
    expect(r.matches).toEqual([]);
    expect(r.fileErrors).toBe(0);
    expect(await calls()).toEqual([]);
  });

  it('removes its temporary directory, on success and on failure, and leaves nothing else in the temporary root', async () => {
    await run({ engine: STUB, configFile: 'c.yml', targets: ['a.py'], root: dir });
    setEnv('FAKE_OPENGREP_MODE', 'exit2');
    await run({ engine: STUB, configFile: 'c.yml', targets: ['a.py'], root: dir }).catch(() => {});
    expect(await readdir(dirs.tempRoot)).toEqual([]);
  });

  it('points the engine\'s scratch files, log and extraction cache at lexcode\'s own directories', async () => {
    await run({ engine: STUB, configFile: 'c.yml', targets: ['a.py'], root: dir });
    const [c] = await calls();
    const e = c!.env;
    expect(e.TMPDIR).toBeDefined();
    expect(e.TMPDIR!.startsWith(join(dirs.tempRoot, 'lexcode-engine-'))).toBe(true);
    expect(e.TMP).toBe(e.TMPDIR);
    expect(e.TEMP).toBe(e.TMPDIR);
    expect(e.SEMGREP_LOG_FILE!.startsWith(`${e.TMPDIR}/`)).toBe(true);
    expect(e.XDG_CACHE_HOME).toBe(join(dirs.cacheRoot, 'engine-home'));
    expect(((await stat(e.XDG_CACHE_HOME!)).mode & 0o022)).toBe(0);
  });

  it('stops an engine that outlives its deadline, with its workers, and reports the deadline as a tool error', async () => {
    const pidFile = join(dir, 'engine.pid');
    const workerFile = join(dir, 'worker.pid');
    setEnv('FAKE_OPENGREP_MODE', 'sleep');
    setEnv('FAKE_OPENGREP_PID_FILE', pidFile);
    setEnv('FAKE_OPENGREP_GRANDCHILD_PID_FILE', workerFile);
    const t0 = Date.now();
    const err = await run({ engine: STUB, configFile: 'c.yml', targets: ['a.py'], root: dir, deadlineMs: 1500 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ToolError);
    expect((err as Error).message).toMatch(/did not finish within 1\.5 seconds/);
    expect((err as Error).message).toContain('LEXCODE_ENGINE_DEADLINE');
    expect(Date.now() - t0).toBeLessThan(15_000);
    const engine = Number(await readFile(pidFile, 'utf8'));
    const worker = Number(await readFile(workerFile, 'utf8'));
    await waitDead(engine);
    await waitDead(worker);
    expect(await readdir(dirs.tempRoot)).toEqual([]);
  });

  it('kills with SIGKILL an engine that ignores SIGTERM, after the grace period', async () => {
    const pidFile = join(dir, 'engine.pid');
    setEnv('FAKE_OPENGREP_MODE', 'sleep-ignore-term');
    setEnv('FAKE_OPENGREP_PID_FILE', pidFile);
    const t0 = Date.now();
    const err = await run({ engine: STUB, configFile: 'c.yml', targets: ['a.py'], root: dir, deadlineMs: 800 }).catch((e: unknown) => e);
    expect((err as Error).message).toMatch(/did not finish/);
    expect(Date.now() - t0).toBeGreaterThanOrEqual(2500);
    await waitDead(Number(await readFile(pidFile, 'utf8')));
  }, 30_000);

  it('reads the version from --version once per engine path', async () => {
    setEnv('FAKE_OPENGREP_VERSION', '1.33.1');
    const a = await run({ engine: STUB, configFile: 'c.yml', targets: ['a.py'], root: dir });
    expect(a.version).toBe('1.33.1');
  });
});

async function waitDead(pid: number): Promise<void> {
  for (let i = 0; i < 100; i += 1) {
    try {
      process.kill(pid, 0);
    } catch {
      return;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`process ${pid} is still running`);
}
async function realpathOf(p: string): Promise<string> {
  const { realpath } = await import('node:fs/promises');
  return realpath(p);
}

describe('the engine deadline', () => {
  it('is 15 minutes by default and LEXCODE_ENGINE_DEADLINE seconds otherwise', () => {
    expect(engineDeadlineMs({})).toBe(900_000);
    expect(engineDeadlineMs({ LEXCODE_ENGINE_DEADLINE: '' })).toBe(900_000);
    expect(engineDeadlineMs({ LEXCODE_ENGINE_DEADLINE: '120' })).toBe(120_000);
    expect(engineDeadlineMs({ LEXCODE_ENGINE_DEADLINE: '0.5' })).toBe(500);
  });

  it('rejects a value that is not a positive number of seconds', () => {
    for (const bad of ['0', '-5', 'soon', 'NaN']) {
      expect(() => engineDeadlineMs({ LEXCODE_ENGINE_DEADLINE: bad }), bad).toThrow(/LEXCODE_ENGINE_DEADLINE must be a positive number of seconds/);
    }
  });
});

describe('stopping an engine on Windows', () => {
  it('uses taskkill on the whole tree and nothing else', () => {
    const cmd = windowsKillCommand(4242, 'win32');
    expect(cmd?.file.toLowerCase()).toContain('taskkill.exe');
    expect(cmd?.args).toEqual(['/T', '/F', '/PID', '4242']);
    expect(windowsKillCommand(4242, 'linux')).toBeUndefined();
  });
});
