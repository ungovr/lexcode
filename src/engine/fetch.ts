import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { chmod, lstat, mkdir, open, rename, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { ToolError } from '../errors.js';
import { cacheDir } from './cache.js';
import { ENGINE_PIN, assetUrl, type EnginePin, type PlatformKey } from './pin.js';
import { platformKey } from './platform.js';
import { checkEngineDir, currentUid } from './dirs.js';
import { engineVersion } from './run.js';

export { checkEngineDir };

type Env = Record<string, string | undefined>;

export interface EnsureEngineOptions {
  /** An explicit engine binary (`--engine`). Wins over LEXCODE_ENGINE and the cache. */
  enginePath?: string;
  /** When the pinned asset is not cached: download it (true) or fail with the next step (false). */
  download: boolean;
  fetchImpl?: typeof fetch;
  pin?: EnginePin;
  /** The cache directory; defaults to `cacheDir(env)`. */
  cacheRoot?: string;
  env?: Env;
  platform?: PlatformKey;
  /** The directory a relative `enginePath` or LEXCODE_ENGINE is resolved against: where lexcode was started, never the scanned repository. */
  cwd?: string;
  /** Backoff between download attempts; injectable so tests do not wait. */
  sleep?: (ms: number) => Promise<void>;
}

export interface EngineHandle {
  path: string;
  version: string;
  pinned: boolean;
}

export interface PinnedEngine {
  path: string;
  url: string;
  sha256: string;
}

const ATTEMPTS = 3;
const BACKOFF_MS = [1000, 3000];
const ATTEMPT_TIMEOUT_MS = 120_000;

/** Where the pinned asset lives once downloaded. */
export function pinnedEnginePath(pin: EnginePin, key: PlatformKey, cacheRoot: string): string {
  return join(cacheRoot, 'engine', `${pin.name}-${pin.version}`, pin.assets[key].name);
}

function waysOut(): string {
  return (
    'Run `lexcode engine fetch` on a machine that can reach github.com, or install Opengrep yourself and pass it with ' +
    '`--engine <path>` or LEXCODE_ENGINE=<path>. Behind a proxy, set HTTPS_PROXY and NODE_USE_ENV_PROXY=1 ' +
    '(Node 22.21 or later) so downloads go through it.'
  );
}

/** A wrong digest is final: retrying the same bytes cannot fix it. */
class DigestMismatch extends ToolError {}

/** A refused path is final too: waiting does not make a planted link a regular file. */
class RefusedPath extends ToolError {}

/** Open the download's temporary file for writing, creating it exclusively and never through a link. */
async function openPartial(partial: string) {
  for (let again = 0; ; again += 1) {
    try {
      return await open(partial, 'wx', 0o755);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST' || again > 0) throw e;
      // Left by an earlier run with this process id, or planted. Only our own plain file is cleared.
      const st = await lstat(partial);
      const uid = currentUid();
      if (!st.isFile() || (uid !== undefined && st.uid !== uid)) {
        throw new RefusedPath(`${partial} already exists and is not a plain file of yours (a link, or another user's); lexcode will not write through it. Remove it and try again.`);
      }
      await rm(partial, { force: true });
    }
  }
}

export async function sha256OfFile(path: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk as Buffer);
  return hash.digest('hex');
}

async function exists(path: string): Promise<boolean> {
  return stat(path).then(
    (s) => s.isFile(),
    () => false,
  );
}

async function downloadOnce(url: string, final: string, expected: string, fetchImpl: typeof fetch): Promise<void> {
  const partial = `${final}.${process.pid}.partial`;
  let renamed = false;
  try {
    const res = await fetchImpl(url, { redirect: 'follow', signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    if (!res.body) throw new Error(`empty response from ${url}`);
    const hash = createHash('sha256');
    const fh = await openPartial(partial);
    try {
      for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
        hash.update(chunk);
        await fh.write(chunk);
      }
    } finally {
      await fh.close();
    }
    const actual = hash.digest('hex');
    if (actual !== expected) {
      throw new DigestMismatch(
        `the downloaded engine failed its sha256 check (expected ${expected}, got ${actual}) and was discarded. Try again, or install Opengrep yourself and pass --engine <path>.`,
      );
    }
    await chmod(partial, 0o755);
    await rename(partial, final);
    renamed = true;
  } finally {
    if (!renamed) await rm(partial, { force: true });
  }
}

async function download(pin: EnginePin, key: PlatformKey, cacheRoot: string, o: EnsureEngineOptions): Promise<PinnedEngine> {
  const asset = pin.assets[key];
  const url = assetUrl(pin, key);
  const final = pinnedEnginePath(pin, key, cacheRoot);
  await mkdir(dirname(final), { recursive: true, mode: 0o700 });
  await checkEngineDir(dirname(final));
  const fetchImpl = o.fetchImpl ?? fetch;
  const sleep = o.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  let lastReason = '';
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      await downloadOnce(url, final, asset.sha256, fetchImpl);
      return { path: final, url, sha256: asset.sha256 };
    } catch (err) {
      if (err instanceof DigestMismatch || err instanceof RefusedPath) throw err;
      lastReason = err instanceof Error ? (err.cause instanceof Error ? `${err.message}: ${err.cause.message}` : err.message) : String(err);
      if (attempt < ATTEMPTS) await sleep(BACKOFF_MS[attempt - 1] ?? 3000);
    }
  }
  throw new ToolError(`could not download the Opengrep engine from ${url} after ${ATTEMPTS} attempts (${lastReason}). ${waysOut()}`);
}

function resolveContext(o: Pick<EnsureEngineOptions, 'pin' | 'platform' | 'env' | 'cacheRoot'>): { pin: EnginePin; key: PlatformKey; root: string; env: Env } {
  const env = o.env ?? process.env;
  return { pin: o.pin ?? ENGINE_PIN, key: o.platform ?? platformKey(), root: o.cacheRoot ?? cacheDir(env), env };
}

/** The pinned engine, downloaded and verified; replaces a cached copy that no longer matches. */
export async function fetchPinnedEngine(o: Omit<EnsureEngineOptions, 'download' | 'enginePath'>): Promise<PinnedEngine & { downloaded: boolean }> {
  const { pin, key, root } = resolveContext(o);
  const path = pinnedEnginePath(pin, key, root);
  const asset = pin.assets[key];
  if (await exists(path)) {
    await checkEngineDir(dirname(path));
    if ((await sha256OfFile(path)) === asset.sha256) return { path, url: assetUrl(pin, key), sha256: asset.sha256, downloaded: false };
    await rm(path, { force: true });
  }
  return { ...(await download(pin, key, root, { ...o, download: true })), downloaded: true };
}

/** Re-hash the cached pinned engine. Throws a ToolError when it is missing or no longer matches. */
export async function verifyPinnedEngine(o: Omit<EnsureEngineOptions, 'download' | 'enginePath'>): Promise<PinnedEngine> {
  const { pin, key, root } = resolveContext(o);
  const path = pinnedEnginePath(pin, key, root);
  const asset = pin.assets[key];
  if (!(await exists(path))) {
    throw new ToolError(`the pinned engine is not installed (looked for ${path}). Run \`lexcode engine fetch\` to download and verify it, or pass --engine <path>.`);
  }
  await checkEngineDir(dirname(path));
  const actual = await sha256OfFile(path);
  if (actual !== asset.sha256) {
    throw new ToolError(
      `the cached engine at ${path} no longer matches its pinned sha256 (expected ${asset.sha256}, got ${actual}). Run \`lexcode engine fetch\` to replace it.`,
    );
  }
  return { path, url: assetUrl(pin, key), sha256: asset.sha256 };
}

/** Engine precedence: `enginePath`, then LEXCODE_ENGINE, then the cached pinned asset (downloaded when allowed). */
export async function ensureEngine(o: EnsureEngineOptions): Promise<EngineHandle> {
  const env = o.env ?? process.env;
  const given = o.enginePath || env.LEXCODE_ENGINE;
  if (given) {
    // Resolved once, here, against the directory lexcode was started from: the existence check, the
    // --version check and the scan then all name the same file, and none of them can find a program
    // of the same relative name inside the repository being scanned.
    const explicit = resolve(o.cwd ?? process.cwd(), given);
    if (!(await exists(explicit))) {
      throw new ToolError(`no engine at ${explicit}. Check the path given to --engine or LEXCODE_ENGINE, or run \`lexcode engine fetch\` to use the pinned engine.`);
    }
    return { path: explicit, version: await engineVersion(explicit), pinned: false };
  }
  const { pin, key, root } = resolveContext(o);
  const path = pinnedEnginePath(pin, key, root);
  if (await exists(path)) {
    await verifyPinnedEngine(o);
    return { path, version: pin.version, pinned: true };
  }
  if (!o.download) {
    throw new ToolError(`the Opengrep engine is not installed. ${waysOut()}`);
  }
  const got = await download(pin, key, root, o);
  return { path: got.path, version: pin.version, pinned: true };
}
