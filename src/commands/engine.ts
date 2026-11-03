import { stat } from 'node:fs/promises';
import { ToolError } from '../errors.js';
import { cacheDir } from '../engine/cache.js';
import { fetchPinnedEngine, pinnedEnginePath, verifyPinnedEngine, type EnsureEngineOptions } from '../engine/fetch.js';
import { ENGINE_PIN, type EnginePin, type PlatformKey } from '../engine/pin.js';
import { platformKey } from '../engine/platform.js';

export const ENGINE_USAGE = `usage: lexcode engine fetch | path | verify

  fetch    download the pinned Opengrep engine, verify its sha256, and print the URL and checksum
  path     print the engine lexcode would run (LEXCODE_ENGINE, else the cached pinned engine)
  verify   re-hash the cached pinned engine against its pinned sha256
`;

export interface EngineCommandDeps {
  env?: Record<string, string | undefined>;
  pin?: EnginePin;
  platform?: PlatformKey;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  stdout?: (text: string) => void;
  stderr?: (text: string) => void;
}

export async function runEngineCommand(argv: string[], deps: EngineCommandDeps = {}): Promise<number> {
  const out = deps.stdout ?? ((s: string) => void process.stdout.write(s));
  const errOut = deps.stderr ?? ((s: string) => void process.stderr.write(s));
  const [sub, ...rest] = argv;
  if ((sub !== 'fetch' && sub !== 'path' && sub !== 'verify') || rest.length > 0) {
    errOut(ENGINE_USAGE);
    return 2;
  }
  const env = deps.env ?? process.env;
  const base: Omit<EnsureEngineOptions, 'download' | 'enginePath'> = {
    env,
    pin: deps.pin,
    platform: deps.platform,
    fetchImpl: deps.fetchImpl,
    sleep: deps.sleep,
  };

  if (sub === 'fetch') {
    const got = await fetchPinnedEngine(base);
    const pin = deps.pin ?? ENGINE_PIN;
    out(`engine: ${pin.name} ${pin.version}${got.downloaded ? '' : ' (already cached)'}\nurl: ${got.url}\nsha256: ${got.sha256}\npath: ${got.path}\n`);
    return 0;
  }

  if (sub === 'verify') {
    const got = await verifyPinnedEngine(base);
    out(`verified: ${got.path}\nsha256: ${got.sha256}\n`);
    return 0;
  }

  // path
  const explicit = env.LEXCODE_ENGINE;
  if (explicit) {
    out(`${explicit}\n`);
    return 0;
  }
  const pin = deps.pin ?? ENGINE_PIN;
  const path = pinnedEnginePath(pin, deps.platform ?? platformKey(), cacheDir(env));
  const present = await stat(path).then(
    (s) => s.isFile(),
    () => false,
  );
  if (!present) {
    throw new ToolError(`the pinned engine is not installed (looked for ${path}). Run \`lexcode engine fetch\`, or set LEXCODE_ENGINE=<path>.`);
  }
  out(`${path}\n`);
  return 0;
}
