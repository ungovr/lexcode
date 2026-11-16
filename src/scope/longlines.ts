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

/**
 * The files of `targets` with a line over `max` characters, reading only what it must (#13251). A file `judged`
 * answers for is not read: extraction judged its copies from their text and wrote none that is long. Nor is a file
 * whose size, from `bytesOf`, rules a long line out: a line of `max` bytes or fewer decodes to `max` UTF-16 units or
 * fewer, which is why `hasLongLine` compares bytes first. `bytesOf` is the scan's one size map, which the
 * pre-filter notice and the engine's lanes read afterwards.
 */
export function longLineFiles(
  targets: readonly string[],
  o: { pathOf: (f: string) => string; bytesOf: (f: string) => number; judged: ReadonlyMap<string, boolean>; max?: number },
): Set<string> {
  const max = o.max ?? MAX_LINE_CHARS;
  return new Set(targets.filter((f) => o.judged.get(f) ?? (o.bytesOf(f) > max && hasLongLine(o.pathOf(f), max))));
}

/**
 * True when any line of `text` is longer than `max` characters: the answer `hasLongLine` gives for the file
 * `text` is written to as UTF-8, taken without writing it. Both split lines at "\n" alone and count UTF-16 units
 * (a carriage return, a byte-order mark and each half of a pair outside the Basic Multilingual Plane count one),
 * and a string written as UTF-8 reads back as the same units, a lone surrogate as one U+FFFD.
 */
export function textHasLongLine(text: string, max: number = MAX_LINE_CHARS): boolean {
  if (text.length <= max) return false;
  let start = 0;
  for (;;) {
    const nl = text.indexOf('\n', start);
    const end = nl < 0 ? text.length : nl;
    if (end - start > max) return true;
    if (nl < 0) return false;
    start = nl + 1;
  }
}
