import { accessSync, constants, statSync } from 'node:fs';
import { posix, win32 } from 'node:path';

type Env = Record<string, string | undefined>;

/**
 * The environment for every child process lexcode starts. On Windows a bare
 * program name is looked for in the current directory first, so a `git.exe`
 * committed at a repository root would run; this variable turns that search
 * off for the child and for anything the child starts.
 */
export function childEnv(extra: Env = {}, base: Env = process.env, platform: string = process.platform): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...base, ...extra };
  if (platform === 'win32') env.NoDefaultCurrentDirectoryInExePath = '1';
  return env;
}

interface FindOptions {
  env?: Env;
  platform?: string;
  /** Whether a candidate is a runnable file; the file system by default (tests inject it to model another platform). */
  isRunnable?: (file: string) => boolean;
}

function isExecutableFile(file: string, platform: string): boolean {
  try {
    if (!statSync(file).isFile()) return false;
    if (platform !== 'win32') accessSync(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * The absolute path of the first `name` found on PATH, or undefined. An empty
 * PATH entry (which a shell reads as the current directory) and a relative one
 * are skipped, so what runs never depends on the directory lexcode was started
 * from or is scanning. On Windows each PATHEXT extension is tried.
 */
export function findOnPath(name: string, o: FindOptions = {}): string | undefined {
  const env = o.env ?? process.env;
  const platform = o.platform ?? process.platform;
  const flavor = platform === 'win32' ? win32 : posix;
  const pathValue = platform === 'win32' ? (env.Path ?? env.PATH ?? env.path) : env.PATH;
  if (!pathValue) return undefined;
  const exts =
    platform === 'win32'
      ? (env.PATHEXT ?? env.Pathext ?? '.COM;.EXE;.BAT;.CMD').split(';').filter((e) => e !== '')
      : [''];
  const names =
    platform === 'win32' && flavor.extname(name) !== ''
      ? [name]
      : exts.map((e) => `${name}${e}`);
  for (const entry of pathValue.split(flavor === win32 ? ';' : ':')) {
    const dir = platform === 'win32' ? entry.replace(/^"(.*)"$/, '$1') : entry;
    if (dir === '' || !flavor.isAbsolute(dir)) continue;
    for (const n of names) {
      const file = flavor.join(dir, n);
      if ((o.isRunnable ?? ((f: string) => isExecutableFile(f, platform)))(file)) return file;
    }
  }
  return undefined;
}

let gitPath: string | null | undefined;

/** git, resolved once through {@link findOnPath}; undefined when it is not installed. */
export function gitExecutable(): string | undefined {
  if (gitPath === undefined) gitPath = findOnPath('git') ?? null;
  return gitPath ?? undefined;
}

/** Forget the cached git path (tests). */
export function resetGitExecutable(): void {
  gitPath = undefined;
}
