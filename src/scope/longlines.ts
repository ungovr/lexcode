import { readFileSync } from 'node:fs';

/**
 * A file with a line longer than this is generated or minified code, never hand-written: the engine
 * took more than ten minutes on a single 200 KB Python line and ignored its own per-file timeout.
 */
export const MAX_LINE_CHARS = 100_000;

/** True when any line of the file at `file` is longer than `max` characters. A file that cannot be read is not long. */
export function hasLongLine(file: string, max: number = MAX_LINE_CHARS): boolean {
  let buf: Buffer;
  try {
    buf = readFileSync(file);
  } catch {
    return false;
  }
  let start = 0;
  for (;;) {
    const nl = buf.indexOf(10, start);
    const end = nl < 0 ? buf.length : nl;
    // Bytes first (cheap); characters only for a line that is long in bytes, since UTF-8 makes bytes >= characters.
    if (end - start > max && buf.toString('utf8', start, end).length > max) return true;
    if (nl < 0) return false;
    start = nl + 1;
  }
}
