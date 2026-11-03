import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
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

export async function writeOutput(path: string, text: string): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, text);
  } catch (e) {
    throw new ToolError(`cannot write ${path}: ${(e as NodeJS.ErrnoException).code ?? (e as Error).message}. Choose another place with --out or --sarif.`);
  }
}
