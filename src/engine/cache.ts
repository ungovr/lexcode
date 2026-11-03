import { homedir } from 'node:os';
import { posix, win32 } from 'node:path';

type Env = Record<string, string | undefined>;

/** The directory lexcode keeps its engine download in. LEXCODE_CACHE_DIR wins on every platform. */
export function cacheDir(env: Env = process.env, platform: string = process.platform, home: string = homedir()): string {
  const override = env.LEXCODE_CACHE_DIR;
  if (override) return override;
  if (platform === 'win32') {
    const base = env.LOCALAPPDATA || win32.join(home, 'AppData', 'Local');
    return win32.join(base, 'lexcode', 'Cache');
  }
  if (platform === 'darwin') return posix.join(home, 'Library', 'Caches', 'lexcode');
  const base = env.XDG_CACHE_HOME || posix.join(home, '.cache');
  return posix.join(base, 'lexcode');
}
