import { closeSync, constants, fstatSync, lstatSync, openSync, readSync, realpathSync } from 'node:fs';
import { sep } from 'node:path';
import { ToolError } from './errors.js';

/** The largest declaration or configuration file lexcode reads. lexlint.yml is about 2 MB in real use. */
export const MAX_CONFIG_BYTES = 20 * 1024 * 1024;

export interface ReadRegularOptions {
  /**
   * Set when the file was found by name inside a repository: its real path must lie inside this
   * directory. Leave it out for a path the user typed, which may be anywhere.
   */
  insideRoot?: string;
  maxBytes?: number;
}

/** True when something (a file, a link, even a dangling link) is at `path`. */
export function pathPresent(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

function codeOf(e: unknown): string {
  return (e as NodeJS.ErrnoException).code ?? (e as Error).message;
}

function inside(child: string, parent: string): boolean {
  return child === parent || child.startsWith(parent.endsWith(sep) ? parent : parent + sep);
}

/**
 * Read a declaration or configuration file as UTF-8, and nothing else. A symbolic link is refused (it
 * may lead outside the repository, or to a device that never ends), as is anything that is not a
 * regular file (a FIFO would hang the read), and a file over the size limit. The file is opened without
 * following a link and without blocking, and the type and size are checked again on the open handle, so
 * swapping the path between the check and the read gains nothing.
 */
export function readRegularFile(path: string, o: ReadRegularOptions = {}): string {
  const max = o.maxBytes ?? MAX_CONFIG_BYTES;
  let st;
  try {
    st = lstatSync(path);
  } catch (e) {
    throw new ToolError(`cannot read ${path}: ${codeOf(e)}`);
  }
  if (st.isSymbolicLink()) {
    throw new ToolError(`${path} is a symbolic link. lexcode reads declaration and configuration files only when they are regular files; point it at the file itself.`);
  }
  if (!st.isFile()) {
    throw new ToolError(`${path} is not a regular file (a directory, FIFO, device or socket); lexcode will not read it.`);
  }
  if (st.size > max) {
    throw new ToolError(`${path} is ${st.size.toLocaleString('en-US')} bytes, over the ${max.toLocaleString('en-US')} byte limit for a declaration or configuration file.`);
  }
  if (o.insideRoot !== undefined) {
    let real: string;
    let realRoot: string;
    try {
      real = realpathSync(path);
      realRoot = realpathSync(o.insideRoot);
    } catch (e) {
      throw new ToolError(`cannot read ${path}: ${codeOf(e)}`);
    }
    if (!inside(real, realRoot)) {
      throw new ToolError(`${path} resolves to ${real}, outside the repository at ${o.insideRoot}; lexcode will not read it.`);
    }
  }

  let fd: number;
  try {
    fd = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
  } catch (e) {
    throw new ToolError(`cannot read ${path}: ${codeOf(e)}`);
  }
  try {
    const open = fstatSync(fd);
    if (!open.isFile()) throw new ToolError(`${path} is not a regular file; lexcode will not read it.`);
    const chunks: Buffer[] = [];
    let total = 0;
    const buf = Buffer.allocUnsafe(1024 * 1024);
    for (;;) {
      const n = readSync(fd, buf, 0, buf.length, null);
      if (n === 0) break;
      total += n;
      if (total > max) {
        throw new ToolError(`${path} is over the ${max.toLocaleString('en-US')} byte limit for a declaration or configuration file.`);
      }
      chunks.push(Buffer.from(buf.subarray(0, n)));
    }
    return Buffer.concat(chunks, total).toString('utf8');
  } catch (e) {
    if (e instanceof ToolError) throw e;
    throw new ToolError(`cannot read ${path}: ${codeOf(e)}`);
  } finally {
    closeSync(fd);
  }
}
