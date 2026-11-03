import { lstatSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Dependency } from '../types.js';

/** What every manifest reader returns. A manifest that fails to parse lands in `notices`, never in an exception. */
export interface ReaderResult {
  deps: Dependency[];
  devSkipped: number;
  notices: string[];
}

const MAX_BYTES = 50 * 1024 * 1024;

/**
 * Read a file under the scan root as UTF-8, or undefined when it is missing, is not a
 * regular file (a symlink is never followed) or is too large to be a manifest.
 */
export function readText(root: string, rel: string): string | undefined {
  const abs = join(root, ...rel.split('/'));
  try {
    const st = lstatSync(abs);
    if (!st.isFile() || st.size > MAX_BYTES) return undefined;
    return readFileSync(abs, 'utf8');
  } catch {
    return undefined;
  }
}

/** True for a regular file (not a symlink) at `rel` under the scan root. */
export function fileExists(root: string, rel: string): boolean {
  try {
    return lstatSync(join(root, ...rel.split('/'))).isFile();
  } catch {
    return false;
  }
}

export function baseName(rel: string): string {
  const i = rel.lastIndexOf('/');
  return i < 0 ? rel : rel.slice(i + 1);
}

/** Directory of a POSIX relative path; '' for the root. */
export function dirOf(rel: string): string {
  const i = rel.lastIndexOf('/');
  return i < 0 ? '' : rel.slice(0, i);
}

export function joinRel(dir: string, name: string): string {
  return dir ? `${dir}/${name}` : name;
}

/** `a/b/c` gives `['a/b/c', 'a/b', 'a', '']`, nearest first, ending at the root. */
export function ancestorDirs(dir: string): string[] {
  const out: string[] = [];
  let cur = dir;
  for (;;) {
    out.push(cur);
    if (cur === '') break;
    cur = dirOf(cur);
  }
  return out;
}

/**
 * Resolve `rel` against the directory `dir`, both POSIX relative to the root.
 * Returns undefined when the result would leave the root.
 */
export function resolveInside(dir: string, rel: string): string | undefined {
  const parts = dir ? dir.split('/') : [];
  for (const seg of rel.replace(/\\/g, '/').split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') {
      if (parts.length === 0) return undefined;
      parts.pop();
    } else parts.push(seg);
  }
  return parts.join('/');
}

/**
 * Line numbers for offsets into one text. The line starts are found once, so each lookup is a binary
 * search: a lookup that scanned from the top, repeated for every dependency, took minutes on a large
 * manifest.
 */
export class LineIndex {
  private readonly starts: number[] = [0];

  constructor(text: string) {
    for (let i = text.indexOf('\n'); i !== -1; i = text.indexOf('\n', i + 1)) this.starts.push(i + 1);
  }

  /** 1-based line number of the character at `index`. */
  lineAt(index: number): number {
    let lo = 0;
    let hi = this.starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if ((this.starts[mid] as number) <= index) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  }
}

export function errMessage(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  return m.split('\n')[0] ?? m;
}
