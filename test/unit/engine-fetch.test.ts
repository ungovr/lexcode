import { createHash } from 'node:crypto';
import { chmod, mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToolError } from '../../src/errors.js';
import { ENGINE_PIN, type EnginePin, type PlatformKey } from '../../src/engine/pin.js';
import { ensureEngine, pinnedEnginePath } from '../../src/engine/fetch.js';

const KEY: PlatformKey = 'linux-x64-glibc';
const sha = (b: Buffer | string): string => createHash('sha256').update(b).digest('hex');
const GOOD = Buffer.from('#!/bin/sh\necho 1.33.1\n');

function pinFor(bytes: Buffer): EnginePin {
  const assets = { ...ENGINE_PIN.assets, [KEY]: { name: 'opengrep_test_asset', sha256: sha(bytes) } };
  return { ...ENGINE_PIN, assets };
}

function serve(bytes: Buffer): { impl: typeof fetch; calls: Array<{ url: string; init?: RequestInit }> } {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const impl = (async (url: unknown, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(new Uint8Array(bytes), { status: 200 });
  }) as typeof fetch;
  return { impl, calls };
}

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'lexcode-fetch-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const noSleep = async (): Promise<void> => {};
const base = (extra: Record<string, unknown> = {}) => ({
  download: true,
  cacheRoot: dir,
  platform: KEY,
  env: {},
  sleep: noSleep,
  ...extra,
});

async function cacheFiles(): Promise<string[]> {
  const out: string[] = [];
  async function walk(d: string): Promise<void> {
    for (const e of await readdir(d, { withFileTypes: true }).catch(() => [])) {
      const p = join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else out.push(p);
    }
  }
  await walk(dir);
  return out;
}

describe('ensureEngine download', () => {
  it('writes the verified asset under engine/opengrep-<version>/ with mode 0755 and does not fetch twice', async () => {
    const pin = pinFor(GOOD);
    const { impl, calls } = serve(GOOD);
    const r = await ensureEngine(base({ pin, fetchImpl: impl }));
    expect(r.pinned).toBe(true);
    expect(r.version).toBe('1.33.1');
    expect(r.path).toBe(join(dir, 'engine', 'opengrep-1.33.1', 'opengrep_test_asset'));
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe('https://github.com/opengrep/opengrep/releases/download/v1.33.1/opengrep_test_asset');
    expect(calls[0]?.init?.redirect).toBe('follow');
    expect(calls[0]?.init?.signal).toBeDefined();
    if (process.platform !== 'win32') expect((await stat(r.path)).mode & 0o777).toBe(0o755);

    const again = await ensureEngine(base({ pin, fetchImpl: impl }));
    expect(again.path).toBe(r.path);
    expect(calls).toHaveLength(1);
    expect(await cacheFiles()).toEqual([r.path]);
  });

  it('rejects bytes that do not match, naming sha256, and leaves no file behind', async () => {
    const pin = pinFor(GOOD);
    const { impl, calls } = serve(Buffer.from('tampered bytes'));
    const err = await ensureEngine(base({ pin, fetchImpl: impl })).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ToolError);
    expect((err as Error).message).toContain('sha256');
    expect((err as Error).message).toContain('--engine');
    expect(calls).toHaveLength(1); // a wrong digest is not a transient failure
    expect(await cacheFiles()).toEqual([]);
  });

  it('retries 3 times with 1 s then 3 s backoff, then names every way out', async () => {
    const pin = pinFor(GOOD);
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;
    const sleep = vi.fn(async (_ms: number) => {});
    const err = await ensureEngine(base({ pin, fetchImpl, sleep })).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ToolError);
    const m = (err as Error).message;
    for (const needle of ['lexcode engine fetch', '--engine', 'LEXCODE_ENGINE', 'NODE_USE_ENV_PROXY=1']) {
      expect(m).toContain(needle);
    }
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([1000, 3000]);
    expect(await cacheFiles()).toEqual([]);
  });

  it('treats an HTTP error status as a failed attempt and succeeds on a later one', async () => {
    const pin = pinFor(GOOD);
    let n = 0;
    const fetchImpl = (async () => {
      n += 1;
      if (n < 3) return new Response('nope', { status: 503 });
      return new Response(new Uint8Array(GOOD), { status: 200 });
    }) as typeof fetch;
    const r = await ensureEngine(base({ pin, fetchImpl }));
    expect(n).toBe(3);
    expect(r.pinned).toBe(true);
    expect(await cacheFiles()).toEqual([r.path]);
  });

  it('leaves no partial file when the body stream fails midway', async () => {
    const pin = pinFor(GOOD);
    const fetchImpl = (async () => {
      const body = new ReadableStream<Uint8Array>({
        start(c) {
          c.enqueue(new Uint8Array(GOOD.subarray(0, 5)));
        },
        pull() {
          throw new Error('connection reset');
        },
      });
      return new Response(body, { status: 200 });
    }) as typeof fetch;
    await expect(ensureEngine(base({ pin, fetchImpl }))).rejects.toBeInstanceOf(ToolError);
    expect(await cacheFiles()).toEqual([]);
  });

  it('with download:false and an empty cache, points at lexcode engine fetch', async () => {
    const err = await ensureEngine(base({ pin: pinFor(GOOD), download: false })).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ToolError);
    expect((err as Error).message).toContain('lexcode engine fetch');
    expect((err as Error).message).toContain('--engine');
  });

  it('fails the hash when a cached pinned binary changed', async () => {
    const pin = pinFor(GOOD);
    const { impl } = serve(GOOD);
    const r = await ensureEngine(base({ pin, fetchImpl: impl }));
    await writeFile(r.path, 'swapped');
    const err = await ensureEngine(base({ pin, fetchImpl: impl })).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ToolError);
    expect((err as Error).message).toContain('sha256');
    expect((err as Error).message).toContain('lexcode engine fetch');
  });
});

describe('ensureEngine explicit engines', () => {
  async function fakeEngine(): Promise<string> {
    const p = join(dir, 'my-engine');
    await writeFile(p, '#!/bin/sh\necho 9.9.9\n');
    await chmod(p, 0o755);
    return p;
  }

  it('uses enginePath as given, reports pinned:false, never hashes or fetches', async () => {
    if (process.platform === 'win32') return;
    const p = await fakeEngine();
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const r = await ensureEngine(base({ enginePath: p, fetchImpl, pin: pinFor(GOOD) }));
    expect(r).toEqual({ path: p, version: '9.9.9', pinned: false });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('prefers enginePath over LEXCODE_ENGINE, and LEXCODE_ENGINE over the cache', async () => {
    if (process.platform === 'win32') return;
    const p = await fakeEngine();
    const viaEnv = await ensureEngine(base({ env: { LEXCODE_ENGINE: p }, pin: pinFor(GOOD) }));
    expect(viaEnv.path).toBe(p);
    expect(viaEnv.pinned).toBe(false);
    const explicit = await ensureEngine(base({ enginePath: p, env: { LEXCODE_ENGINE: '/nowhere/else' }, pin: pinFor(GOOD) }));
    expect(explicit.path).toBe(p);
  });

  it('names the path and the next step when the explicit engine does not exist', async () => {
    const err = await ensureEngine(base({ enginePath: join(dir, 'missing') })).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ToolError);
    expect((err as Error).message).toContain(join(dir, 'missing'));
    expect((err as Error).message).toContain('lexcode engine fetch');
  });
});

describe('pinnedEnginePath', () => {
  it('is <cache>/engine/opengrep-<version>/<asset>', () => {
    expect(pinnedEnginePath(ENGINE_PIN, 'linux-x64-glibc', '/c')).toBe(join('/c', 'engine', 'opengrep-1.33.1', 'opengrep_manylinux_x86'));
  });
});

describe('cache parent directories', () => {
  it('creates a missing cache root', async () => {
    const pin = pinFor(GOOD);
    const { impl } = serve(GOOD);
    const root = join(dir, 'deep', 'er');
    await mkdir(dir, { recursive: true });
    const r = await ensureEngine({ download: true, cacheRoot: root, platform: KEY, env: {}, sleep: noSleep, pin, fetchImpl: impl });
    expect((await stat(r.path)).isFile()).toBe(true);
  });
});
