import { randomBytes } from 'node:crypto';
import { lstat, mkdir, rename, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { ToolError } from '../errors.js';
import { toPosix } from '../scope/files.js';

/** Resolve a path given on the command line against the shell's directory, not the scanned root. */
export function fromCwd(p: string): string {
  return isAbsolute(p) ? p : resolve(process.cwd(), p);
}

/** The repository-relative POSIX path of `abs` when it lies inside `root`. */
export function insideRoot(root: string, abs: string): string | undefined {
  const rel = relative(root, abs);
  return rel === '' || rel.startsWith('..') || isAbsolute(rel) ? undefined : toPosix(rel);
}

/**
 * Write an output file without ever writing through a link.
 *
 * The default output, `<root>/lexcode.json`, sits inside a repository lexcode
 * may not trust: a repository can commit `lexcode.json` as a symbolic link to
 * a file in the user's home, and a plain write would overwrite that file. So a
 * destination that is a link, or anything but a regular file, is refused; the
 * text is written to a fresh temporary file beside it (`wx`: created, never
 * opened if it exists) and renamed over the destination, which replaces a link
 * planted between the check and the rename instead of following it.
 */
export async function writeOutput(path: string, text: string): Promise<void> {
  const fail = (why: string): never => {
    throw new ToolError(`cannot write ${path}: ${why}. Choose another place with --out or --sarif.`);
  };
  try {
    await mkdir(dirname(path), { recursive: true });
  } catch (e) {
    fail((e as NodeJS.ErrnoException).code ?? (e as Error).message);
  }
  let existing;
  try {
    existing = await lstat(path);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') fail((e as NodeJS.ErrnoException).code ?? (e as Error).message);
  }
  if (existing?.isSymbolicLink()) fail('it is a symbolic link, and lexcode never writes through one');
  if (existing && !existing.isFile()) fail('it exists and is not a regular file');
  const tmp = join(dirname(path), `.${basename(path)}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`);
  try {
    await writeFile(tmp, text, { flag: 'wx', mode: 0o644 });
    await rename(tmp, path);
  } catch (e) {
    await unlink(tmp).catch(() => undefined);
    fail((e as NodeJS.ErrnoException).code ?? (e as Error).message);
  }
}
