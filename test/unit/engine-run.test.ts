import { readFileSync, writeFileSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { availableParallelism, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ToolError } from '../../src/errors.js';
import {
  CHUNK_CHARS_OTHER,
  chunkTargets,
  dealTargets,
  engineDeadlineMs,
  engineLanesFromEnv,
  engineVersion,
  jobsPerLane,
  LANE_BYTES,
  LANE_MEMORY_BYTES,
  laneCount,
  MAX_JOBS,
  MAX_LANES,
  memoryBytes,
  memoryLanes,
  runEngine,
  type RunEngineOptions,
} from '../../src/engine/run.js';
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

describe('engine lanes (#12997)', () => {
  it('runs one lane per LANE_BYTES of targets, rounded, at least 1 and at most MAX_LANES and maxJobs', () => {
    expect(MAX_LANES).toBe(8);
    expect(laneCount(0, 16)).toBe(1);
    expect(laneCount(1_000, 16)).toBe(1);
    expect(laneCount(LANE_BYTES * 1.49, 16)).toBe(1);
    expect(laneCount(LANE_BYTES * 1.5, 16)).toBe(2);
    expect(laneCount(LANE_BYTES * 7, 16)).toBe(7);
    expect(laneCount(LANE_BYTES * 10, 16)).toBe(MAX_LANES);
    expect(laneCount(LANE_BYTES * 1_000, 16)).toBe(MAX_LANES);
    expect(laneCount(LANE_BYTES * 1_000, 4)).toBe(4);
    expect(laneCount(LANE_BYTES * 1_000, 1)).toBe(1);
  });

  it('caps the lanes by memory: one per LANE_MEMORY_BYTES, at least 1', () => {
    const GiB = 1024 ** 3;
    expect(LANE_MEMORY_BYTES).toBe(3 * GiB);
    expect(memoryLanes(1 * GiB)).toBe(1);
    expect(memoryLanes(8 * GiB)).toBe(2);
    expect(memoryLanes(16 * GiB)).toBe(5);
    expect(memoryLanes(24 * GiB)).toBe(8);
    expect(laneCount(LANE_BYTES * 1_000, 16, 16 * GiB)).toBe(5);
    expect(laneCount(LANE_BYTES * 1_000, 16, 2 * GiB)).toBe(1);
    expect(laneCount(LANE_BYTES * 3, 16, 64 * GiB)).toBe(3);
    // A process limit lower than the machine's memory is the one that counts.
    expect(memoryBytes()).toBeGreaterThan(0);
  });

  it('reads LEXCODE_ENGINE_LANES as a whole number from 1 to maxJobs, and refuses anything else', () => {
    expect(engineLanesFromEnv(16, {})).toBeUndefined();
    expect(engineLanesFromEnv(16, { LEXCODE_ENGINE_LANES: ' ' })).toBeUndefined();
    expect(engineLanesFromEnv(16, { LEXCODE_ENGINE_LANES: '1' })).toBe(1);
    expect(engineLanesFromEnv(16, { LEXCODE_ENGINE_LANES: '16' })).toBe(16);
    for (const bad of ['0', '-2', '2.5', 'four', '17']) {
      expect(() => engineLanesFromEnv(16, { LEXCODE_ENGINE_LANES: bad })).toThrow(ToolError);
    }
    expect(() => engineLanesFromEnv(16, { LEXCODE_ENGINE_LANES: '17' })).toThrow(/from 1 to 16/);
  });

  it('shares maxJobs between the lanes, at least one job each', () => {
    expect(jobsPerLane(16, 1)).toBe(16);
    expect(jobsPerLane(16, 3)).toBe(5);
    expect(jobsPerLane(16, 16)).toBe(1);
    expect(jobsPerLane(2, 5)).toBe(1);
  });

  const sizes: Record<string, number> = { a: 10, b: 30, c: 20, d: 30, e: 5 };
  const size = (t: string): number => sizes[t] ?? 0;

  it('deals biggest first, ties by path, round-robin', () => {
    // b 30, d 30 (tie: b before d), c 20, a 10, e 5
    expect(dealTargets(['a', 'b', 'c', 'd', 'e'], 2, size)).toEqual([
      ['b', 'c', 'e'],
      ['d', 'a'],
    ]);
    expect(dealTargets(['a', 'b', 'c', 'd', 'e'], 3, size)).toEqual([['b', 'a'], ['d', 'e'], ['c']]);
  });

  it('deals the same whatever order the targets come in', () => {
    expect(dealTargets(['e', 'd', 'c', 'b', 'a'], 2, size)).toEqual(dealTargets(['a', 'b', 'c', 'd', 'e'], 2, size));
  });

  it('never makes more lanes than targets, nor an empty lane', () => {
    expect(dealTargets(['a', 'b'], 5, size)).toEqual([['b'], ['a']]);
    expect(dealTargets(['x'], 4, size)).toEqual([['x']]);
    expect(dealTargets([], 4, size)).toEqual([]);
  });

  it('keeps one lane in the order given, sizes unread', () => {
    expect(dealTargets(['e', 'a', 'b'], 1, () => {
      throw new Error('read a size');
    })).toEqual([['e', 'a', 'b']]);
  });

  it('puts every target in exactly one lane', () => {
    const targets = Array.from({ length: 101 }, (_, i) => `f${i}.py`);
    const lanes = dealTargets(targets, 7, (t) => t.length * 13);
    expect(lanes).toHaveLength(7);
    expect(lanes.flat().sort()).toEqual([...targets].sort());
    // Round-robin: lane sizes differ by at most one target.
    const counts = lanes.map((l) => l.length);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
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
    setEnv('LEXCODE_ENGINE_LANES', undefined);
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

  type Call = { pid: number; start: number; rootLink?: string; argv: string[]; options: Record<string, string>; flags: string[]; targets: string[]; cwd: string; env: Record<string, string | undefined> };
  const calls = async (): Promise<Call[]> =>
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
    // shape, is about 370,000 characters: one invocation, so even a scan in a
    // single lane parses the rules once.
    const targets = Array.from({ length: 7300 }, (_, i) => `scan-root/ungovr-ops/ungovr_ops/routes/module_${i}.py`);
    expect(chunkTargets(targets, CHUNK_CHARS_OTHER)).toHaveLength(1);
    expect(CHUNK_CHARS_OTHER).toBeLessThanOrEqual(600_000); // macOS caps argv and environment at 1 MiB
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
    // In the fixed order (path first), not the engine's.
    expect(r.matches).toEqual([
      { ruleId: 'lexcode.other', path: 'b.ts', line: 1, metavars: {}, lines: 'x' },
      { ruleId: 'lexcode.crawl.http', path: 'src/deep/a.py', line: 12, metavars: { $URL: '"https://example.com"', $F: 'get' }, lines: '    requests.get(url)' },
    ]);
  });

  it('counts per-file errors in fileErrors without throwing', async () => {
    setEnv('FAKE_OPENGREP_MODE', 'errors');
    const r = await run({ engine: STUB, configFile: 'c.yml', targets: ['a.py'], root: dir });
    expect(r.fileErrors).toBe(2);
    expect(r.matches).toHaveLength(1);
  });

  describe('a partial parse of an XML file', () => {
    // Columns are 1-based BYTES and `end` is exclusive, as the engine reports them.
    const span = (line: number, col: number, len: number, endLine = line, endCol = col + len) => ({
      file: 'pom.xml',
      start: { line, col, offset: 0 },
      end: { line: endLine, col: endCol, offset: len },
    });
    const partial = (path: string, ...spans: unknown[]) =>
      JSON.stringify([{ code: 3, level: 'warn', type: ['PartialParsing', spans], path, message: 'Syntax error', spans }]);
    const pom = '<project>\n  <build>\n    <?m2e ignore?>\n    <name>x</name>\n      <?m2e execute?>\n  </build>\n</project>\n';
    const errorsFor = async (file: string, content: string | null, errors: string): Promise<number> => {
      if (content !== null) await writeFile(join(dir, file), content);
      setEnv('FAKE_OPENGREP_ERRORS', errors);
      return (await run({ engine: STUB, configFile: 'c.yml', targets: [file], root: dir })).fileErrors;
    };

    it('is not a file error when it dropped only processing instructions (a pom with <?m2e ...?>)', async () => {
      expect(await errorsFor('pom.xml', pom, partial('scan-root/pom.xml', span(3, 5, 14), span(5, 7, 15)))).toBe(0);
    });

    it('is a file error when any dropped span is not a processing instruction', async () => {
      expect(await errorsFor('pom.xml', pom, partial('scan-root/pom.xml', span(3, 5, 14), span(4, 5, 14)))).toBe(1);
    });

    it('is a file error when a span starts at a processing instruction but runs over other dropped text', async () => {
      for (const tail of ['<!bogus>', ' & x', '<!-- unterminated']) {
        const text = `<project>\n  <?m2e ignore?>${tail}\n</project>\n`;
        const len = 14 + tail.length;
        expect(await errorsFor('pom.xml', text, partial('scan-root/pom.xml', span(2, 3, len)))).toBe(1);
      }
      // two instructions run together in one span are more than one instruction
      expect(await errorsFor('pom.xml', '<p>\n  <?a b?><?c d?>\n</p>\n', partial('scan-root/pom.xml', span(2, 3, 14)))).toBe(1);
      // a span that ends before the instruction does
      expect(await errorsFor('pom.xml', pom, partial('scan-root/pom.xml', span(3, 5, 6)))).toBe(1);
    });

    it('reads columns as bytes: a non-ASCII character before the instruction on the same line', async () => {
      const text = '<project>\n  <!-- caf\u00e9 --> <?m2e ignore?>\n</project>\n';
      // the text before the instruction is 17 bytes but 16 characters, so the instruction starts at byte column 18.
      const prefixBytes = Buffer.byteLength('  <!-- caf\u00e9 --> ');
      expect(await errorsFor('pom.xml', text, partial('scan-root/pom.xml', span(2, prefixBytes + 1, 14)))).toBe(0);
      expect(await errorsFor('pom.xml', text, partial('scan-root/pom.xml', span(2, prefixBytes, 14)))).toBe(1);
    });

    it('is a file error when the file cannot be reread, or the engine named no span or no end', async () => {
      expect(await errorsFor('missing.xml', null, partial('scan-root/missing.xml', span(3, 5, 14)))).toBe(1);
      expect(await errorsFor('pom.xml', pom, partial('scan-root/pom.xml'))).toBe(1);
      const noEnd = { file: 'pom.xml', start: { line: 3, col: 5, offset: 0 } };
      expect(await errorsFor('pom.xml', pom, partial('scan-root/pom.xml', noEnd))).toBe(1);
    });

    it('stays a file error for a source file, even where the dropped text is a <? ... ?> span', async () => {
      expect(await errorsFor('A.kt', pom, partial('scan-root/A.kt', span(3, 5, 14)))).toBe(1);
    });
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
    // A deadline test, not a runner-speed budget: 15 s is 10x the 1.5 s deadline the engine was given, so it only proves the stuck engine was stopped.
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

  describe('in lanes (#12997)', () => {
    const maxJobs = Math.min(availableParallelism(), MAX_JOBS);
    const targets = Array.from({ length: 9 }, (_, i) => `src/m${i}.py`);
    /** Distinct sizes, so the deal is known: m8 is the biggest. */
    const bytesOf = (t: string): number => 1_000 * (1 + Number(/m(\d+)/.exec(t)?.[1] ?? 0));
    const lanesOf = (n: number): string[][] => dealTargets(targets, n, bytesOf).map((l) => l.map((t) => `scan-root/${t}`));
    const sorted = (xs: string[][]): string[][] => xs.map((x) => [...x].sort()).sort((a, b) => (a[0]! < b[0]! ? -1 : 1));
    const subdir = async (name: string): Promise<string> => {
      const d = join(dir, name);
      await mkdir(d);
      return d;
    };
    const pidsIn = async (d: string): Promise<number[]> => (await readdir(d)).map(Number);

    it('runs the lanes at once, each with its own share of the targets and --jobs', async () => {
      setEnv('FAKE_OPENGREP_BARRIER', `${await subdir('barrier')}:3`);
      const r = await run({ engine: STUB, configFile: 'c.yml', targets, root: dir, bytesOf, lanes: 3 });
      const cs = await calls();
      // The barrier holds every run until three are running: three lanes, at once.
      expect(cs).toHaveLength(3);
      expect(new Set(cs.map((c) => c.pid)).size).toBe(3);
      for (const c of cs) expect(c.options['--jobs']).toBe(String(jobsPerLane(maxJobs, 3)));
      expect(sorted(cs.map((c) => c.targets))).toEqual(sorted(lanesOf(3)));
      expect(cs.flatMap((c) => c.targets).sort()).toEqual(targets.map((t) => `scan-root/${t}`).sort());
      expect(r.matches.map((m) => m.path)).toEqual([...targets].sort());
    });

    it('takes the lane count from the targets\' bytes, and stays one lane with every job for a small scan', async () => {
      const big = (): number => LANE_BYTES;
      await run({ engine: STUB, configFile: 'c.yml', targets: targets.slice(0, 3), root: dir, bytesOf: big });
      const want = laneCount(3 * LANE_BYTES, maxJobs, memoryBytes());
      let cs = await calls();
      expect(cs).toHaveLength(want);
      for (const c of cs) expect(c.options['--jobs']).toBe(String(jobsPerLane(maxJobs, want)));
      await rm(log, { force: true });
      await run({ engine: STUB, configFile: 'c.yml', targets, root: dir, bytesOf });
      cs = await calls();
      expect(cs).toHaveLength(1);
      expect(cs[0]!.options['--jobs']).toBe(String(maxJobs));
      expect(cs[0]!.targets).toEqual(targets.map((t) => `scan-root/${t}`)); // one lane: the order given
    });

    it('returns the matches in one fixed order, the same for one lane and for several', async () => {
      const res = (path: string, line: number, col: number, id: string, lines: string, url?: string): unknown => ({
        check_id: id,
        path,
        start: { line, col },
        end: { line, col: col + 5 },
        extra: { metavars: url === undefined ? {} : { $URL: { abstract_content: url } }, lines },
      });
      const byTarget: Record<string, unknown[]> = {};
      for (const t of targets) {
        const p = `scan-root/${t}`;
        // Written out of order, as an engine might: later lines first, a later column first, rule ids reversed.
        byTarget[p] = [
          res(p, 9, 1, 'r.b', 'nine'),
          res(p, 3, 20, 'r.a', 'get(a); get(b)', '"https://b.example"'),
          res(p, 3, 1, 'r.a', 'get(a); get(b)', '"https://a.example"'),
          res(p, 3, 1, 'r.0', 'get(a); get(b)'),
        ];
      }
      setEnv('FAKE_OPENGREP_RESULTS_BY_TARGET', JSON.stringify(byTarget));
      const one = await run({ engine: STUB, configFile: 'c.yml', targets: [...targets].reverse(), root: dir, bytesOf, lanes: 1 });
      const four = await run({ engine: STUB, configFile: 'c.yml', targets, root: dir, bytesOf, lanes: 4 });
      expect(four).toEqual(one);
      const first = one.matches.filter((m) => m.path === 'src/m0.py');
      expect(first.map((m) => `${m.line} ${m.ruleId} ${m.metavars.$URL ?? ''}`)).toEqual(['3 r.0 ', '3 r.a "https://a.example"', '3 r.a "https://b.example"', '9 r.b ']);
      expect(one.matches.map((m) => m.path)).toEqual([...targets].sort().flatMap((t) => [t, t, t, t]));
    });

    it('takes the lane count from LEXCODE_ENGINE_LANES when it is set', async () => {
      setEnv('LEXCODE_ENGINE_LANES', '3');
      setEnv('FAKE_OPENGREP_BARRIER', `${await subdir('barrier')}:3`);
      // No sizes: by its own rule this scan is one lane.
      await run({ engine: STUB, configFile: 'c.yml', targets, root: dir });
      const cs = await calls();
      expect(cs).toHaveLength(3);
      for (const c of cs) expect(c.options['--jobs']).toBe(String(jobsPerLane(maxJobs, 3)));
    });

    it('sums file errors over the lanes', async () => {
      setEnv('FAKE_OPENGREP_MODE', 'errors');
      const r = await run({ engine: STUB, configFile: 'c.yml', targets, root: dir, bytesOf, lanes: 3 });
      expect(r.fileErrors).toBe(2 * 3);
    });

    it('stops the other lanes when one fails, and raises that lane\'s error', async () => {
      const pids = await subdir('pids');
      const [lane0, , lane2] = lanesOf(3) as [string[], string[], string[]];
      setEnv('FAKE_OPENGREP_PID_DIR', pids);
      setEnv('FAKE_OPENGREP_HANG_TARGET', lane0[0]);
      setEnv('FAKE_OPENGREP_FAIL_TARGETS', JSON.stringify({ [lane2[0]!]: 'lane two broke' }));
      // Lane 2 fails only once all three engines are running, so the hanging lane is one that is stopped.
      const go = join(dir, 'go');
      setEnv('FAKE_OPENGREP_GO_FILE', go);
      const t0 = Date.now();
      const pending = run({ engine: STUB, configFile: 'c.yml', targets, root: dir, bytesOf, lanes: 3, deadlineMs: 120_000 }).catch((e: unknown) => e);
      for (let i = 0; i < 500 && (await pidsIn(pids)).length < 3; i += 1) await new Promise((r) => setTimeout(r, 20));
      const started = await pidsIn(pids);
      expect(started).toHaveLength(3);
      await writeFile(go, '');
      const err = await pending;
      expect(err).toBeInstanceOf(ToolError);
      expect((err as Error).message).toBe('the engine exited with code 2:\nlane two broke\nRe-run with the same arguments directly to see the full output.');
      // Stopped, not left to its two-minute hang or the deadline.
      expect(Date.now() - t0).toBeLessThan(30_000);
      for (const pid of started) await waitDead(pid);
      expect(await readdir(dirs.tempRoot)).toEqual([]);
    });

    it('raises the failed lane\'s error when a stopped lane exits 0 on SIGTERM', async () => {
      // The engine can exit 0 when it is stopped, having written no output; that is not its own result.
      const pids = await subdir('pids');
      const [lane0, , lane2] = lanesOf(3) as [string[], string[], string[]];
      setEnv('FAKE_OPENGREP_PID_DIR', pids);
      setEnv('FAKE_OPENGREP_HANG_TARGET', lane0[0]);
      setEnv('FAKE_OPENGREP_TERM_EXIT0', '1');
      setEnv('FAKE_OPENGREP_FAIL_TARGETS', JSON.stringify({ [lane2[0]!]: 'lane two broke' }));
      const go = join(dir, 'go');
      setEnv('FAKE_OPENGREP_GO_FILE', go);
      const pending = run({ engine: STUB, configFile: 'c.yml', targets, root: dir, bytesOf, lanes: 3, deadlineMs: 120_000 }).catch((e: unknown) => e);
      for (let i = 0; i < 500 && (await pidsIn(pids)).length < 3; i += 1) await new Promise((r) => setTimeout(r, 20));
      expect(await pidsIn(pids)).toHaveLength(3);
      await writeFile(go, '');
      const err = await pending;
      expect(err).toBeInstanceOf(ToolError);
      expect((err as Error).message).toBe('the engine exited with code 2:\nlane two broke\nRe-run with the same arguments directly to see the full output.');
      for (const pid of await pidsIn(pids)) await waitDead(pid);
    });

    it.skipIf(process.platform === 'win32')('says how to run as one process when a lane is killed by SIGKILL', async () => {
      const [, lane1] = lanesOf(3) as [string[], string[], string[]];
      setEnv('FAKE_OPENGREP_KILL_TARGET', lane1[0]);
      const err = await run({ engine: STUB, configFile: 'c.yml', targets, root: dir, bytesOf, lanes: 3 }).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ToolError);
      expect((err as Error).message).toContain('was stopped by SIGKILL');
      expect((err as Error).message).toContain('The engine ran as 3 processes at once; if memory ran out, run again with LEXCODE_ENGINE_LANES=1.');
      // One process: no such hint.
      const one = await run({ engine: STUB, configFile: 'c.yml', targets, root: dir, bytesOf, lanes: 1 }).catch((e: unknown) => e);
      expect((one as Error).message).toContain('was stopped by SIGKILL');
      expect((one as Error).message).not.toContain('LEXCODE_ENGINE_LANES');
    });

    it.skipIf(process.platform !== 'linux')('raises a failed lane\'s own error when several lanes fail at once, usually the lowest-numbered', async () => {
      // Lanes 1 and 2 fail at the same moment; lane 0 hangs and is stopped. Both failing engines write
      // their message and close their stderr, then Node is held busy until both have exited, so it
      // records both exits in one pass. One target per invocation, and lane 1 fails in its second, so
      // lane 2's failing engine is the older one: Node records exits in the order the processes
      // started, and lane 2's failure is the first it sees. Lane 1 should still count as failed, not
      // as stopped by lane 2's failure, and the error is a failed lane's own either way.
      const pids = await subdir('pids');
      const go = join(dir, 'go');
      const [lane0, lane1, lane2] = lanesOf(3) as [string[], string[], string[]];
      setEnv('FAKE_OPENGREP_PID_DIR', pids);
      setEnv('FAKE_OPENGREP_GO_FILE', go);
      const exit = join(dir, 'exit');
      setEnv('FAKE_OPENGREP_EXIT_FILE', exit);
      setEnv('FAKE_OPENGREP_HANG_TARGET', lane0[0]);
      setEnv('FAKE_OPENGREP_FAIL_TARGETS', JSON.stringify({ [lane1[1]!]: 'lane one broke', [lane2[0]!]: 'lane two broke' }));
      const pending = run({ engine: STUB, configFile: 'c.yml', targets, root: dir, bytesOf, lanes: 3, chunkChars: lane0[0]!.length, deadlineMs: 120_000 }).catch((e: unknown) => e);
      const failingRuns = async (): Promise<Call[]> => (await calls()).filter((c) => c.targets.includes(lane1[1]!) || c.targets.includes(lane2[0]!));
      for (let i = 0; i < 500 && (await failingRuns()).length < 2; i += 1) await new Promise((r) => setTimeout(r, 20));
      const failing = (await failingRuns()).map((c) => c.pid);
      expect(failing).toHaveLength(2);
      expect((await failingRuns())[0]!.targets).toEqual([lane2[0]]);
      await writeFile(go, '');
      // Let Node read both messages and see both stderr pipes close before the engines exit.
      await new Promise((r) => setTimeout(r, 500));
      // Synchronous: an awaited write yields, and Node can record one exit and stop the run before the other.
      writeFileSync(exit, '');
      const zombie = (pid: number): boolean => {
        try {
          return readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1]?.startsWith('Z') ?? false;
        } catch {
          return false;
        }
      };
      const until = Date.now() + 15_000;
      while (!failing.every(zombie) && Date.now() < until) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
      expect(failing.every(zombie)).toBe(true);
      const err = await pending;
      expect(err).toBeInstanceOf(ToolError);
      // Lane one's error in most runs; at a load of about 30 on 24 cores, lane two's in 1 of 20
      // (2026-11-14), so the order is not promised. Either way it is a failed lane's own message,
      // with its exit code, never a stopped lane's.
      expect((err as Error).message).toMatch(/^the engine exited with code 2:\nlane (one|two) broke\n/);
      for (const pid of await pidsIn(pids)) await waitDead(pid);
    });

    it('stops every lane at the deadline, with their workers, under one deadline message', async () => {
      const pids = await subdir('pids');
      setEnv('FAKE_OPENGREP_MODE', 'sleep');
      setEnv('FAKE_OPENGREP_PID_DIR', pids);
      const t0 = Date.now();
      const err = await run({ engine: STUB, configFile: 'c.yml', targets, root: dir, bytesOf, lanes: 3, deadlineMs: 1500 }).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ToolError);
      expect((err as Error).message).toMatch(/^the engine did not finish within 1\.5 seconds \(the LEXCODE_ENGINE_DEADLINE limit/);
      expect(Date.now() - t0).toBeLessThan(15_000);
      const started = await pidsIn(pids);
      expect(started).toHaveLength(3);
      for (const pid of started) await waitDead(pid);
      expect(await readdir(dirs.tempRoot)).toEqual([]);
    });

    it('gives each lane its own directory, scratch, log and output file, and shares the extraction cache', async () => {
      await run({ engine: STUB, configFile: 'c.yml', targets, root: dir, bytesOf, lanes: 3 });
      const cs = await calls();
      expect(cs).toHaveLength(3);
      const distinct = (f: (c: Call) => string | undefined): number => new Set(cs.map(f)).size;
      expect(distinct((c) => c.cwd)).toBe(3);
      expect(distinct((c) => c.env.TMPDIR)).toBe(3);
      expect(distinct((c) => c.env.SEMGREP_LOG_FILE)).toBe(3);
      expect(distinct((c) => c.options['--json-output'])).toBe(3);
      for (const c of cs) {
        expect(c.env.SEMGREP_LOG_FILE!.startsWith(`${c.env.TMPDIR}/`)).toBe(true);
        expect(c.env.TMP).toBe(c.env.TMPDIR);
        expect(c.env.XDG_CACHE_HOME).toBe(join(dirs.cacheRoot, 'engine-home'));
        expect(c.rootLink).toBe(await realpathOf(dir));
      }
    });

    it('runs a lane\'s chunks one after another while the lanes run at once', async () => {
      const ends = join(dir, 'ends.log');
      setEnv('FAKE_OPENGREP_SLEEP_MS', '300');
      setEnv('FAKE_OPENGREP_END_LOG', ends);
      // About two targets per invocation, as a Windows command line would hold far more of.
      await run({ engine: STUB, configFile: 'c.yml', targets, root: dir, bytesOf, lanes: 2, chunkChars: 40 });
      const cs = await calls();
      const end = new Map((await readFile(ends, 'utf8')).trim().split('\n').map((l) => JSON.parse(l) as { pid: number; end: number }).map((e) => [e.pid, e.end]));
      const byLane = new Map<string, Call[]>();
      for (const c of cs) byLane.set(c.env.TMPDIR!, [...(byLane.get(c.env.TMPDIR!) ?? []), c]);
      expect(byLane.size).toBe(2);
      const lanes = [...byLane.values()].map((l) => l.sort((a, b) => a.start - b.start));
      for (const lane of lanes) {
        expect(lane.length).toBeGreaterThan(1);
        for (const c of lane) expect(c.targets.join(' ').length).toBeLessThanOrEqual(40);
        for (let i = 1; i < lane.length; i += 1) expect(lane[i]!.start).toBeGreaterThanOrEqual(end.get(lane[i - 1]!.pid)!);
      }
      expect(sorted(lanes.map((l) => l.flatMap((c) => c.targets)))).toEqual(sorted(lanesOf(2)));
      // The two lanes overlap in time.
      const [a, b] = lanes as [Call[], Call[]];
      expect(a[0]!.start).toBeLessThan(end.get(b[b.length - 1]!.pid)!);
      expect(b[0]!.start).toBeLessThan(end.get(a[a.length - 1]!.pid)!);
    });

    describe('the extraction cache', () => {
      const versionRuns = async (file: string): Promise<{ env: { XDG_CACHE_HOME?: string } }[]> =>
        (await readFile(file, 'utf8').catch(() => ''))
          .split('\n')
          .filter(Boolean)
          .map((l) => JSON.parse(l));

      it('is filled by one engine run before several lanes start on it, once per cache', async () => {
        // The version is read (and cached) against another cache, so this run's cache is still empty.
        await engineVersion(STUB, { tempRoot: dirs.tempRoot, cacheRoot: await subdir('other-cache') });
        const vlog = join(dir, 'version.log');
        setEnv('FAKE_OPENGREP_VERSION_LOG', vlog);
        await run({ engine: STUB, configFile: 'c.yml', targets, root: dir, bytesOf, lanes: 3 });
        const home = join(dirs.cacheRoot, 'engine-home');
        expect((await versionRuns(vlog)).map((v) => v.env.XDG_CACHE_HOME)).toEqual([home]);
        await run({ engine: STUB, configFile: 'c.yml', targets, root: dir, bytesOf, lanes: 3 });
        expect(await versionRuns(vlog)).toHaveLength(1);
      });

      it('is not filled first for one lane', async () => {
        await engineVersion(STUB, { tempRoot: dirs.tempRoot, cacheRoot: await subdir('other-cache') });
        const vlog = join(dir, 'version.log');
        setEnv('FAKE_OPENGREP_VERSION_LOG', vlog);
        await run({ engine: STUB, configFile: 'c.yml', targets, root: dir, bytesOf, lanes: 1 });
        expect(await versionRuns(vlog)).toEqual([]);
      });

      it('is filled on every run when it is the run\'s own (the cache directory cannot be made)', async () => {
        const blocker = join(dir, 'not-a-dir');
        await writeFile(blocker, '');
        const vlog = join(dir, 'version.log');
        setEnv('FAKE_OPENGREP_VERSION_LOG', vlog);
        const own = { tempRoot: dirs.tempRoot, cacheRoot: join(blocker, 'cache') };
        await engineVersion(STUB, own);
        const before = (await versionRuns(vlog)).length;
        for (let i = 0; i < 2; i += 1) {
          await rm(log, { force: true });
          await runEngine({ engine: STUB, configFile: 'c.yml', targets, root: dir, bytesOf, lanes: 2, dirs: own });
          const lanes = await calls();
          const xdg = lanes[0]!.env.XDG_CACHE_HOME!;
          expect(xdg.startsWith(join(dirs.tempRoot, 'lexcode-engine-'))).toBe(true);
          expect(lanes.every((c) => c.env.XDG_CACHE_HOME === xdg)).toBe(true);
          const warmed = (await versionRuns(vlog)).slice(before + i);
          expect(warmed.map((v) => v.env.XDG_CACHE_HOME)).toEqual([xdg]);
        }
      });
    });
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
