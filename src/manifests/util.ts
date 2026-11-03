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

/**
 * Where a manifest failed to parse, and nothing else. A parser's own message can quote the text it
 * choked on (V8 prints an excerpt of the JSON around the fault), and a manifest may hold a token that
 * must not be copied into the evidence record, so the message is never used: only a line and column
 * (or an offset), taken from the error's own fields or the numbers in its text, or located by finding
 * V8's excerpt in the source, which is looked at and not repeated.
 */
export function describeParseError(e: unknown, kind: 'JSON' | 'YAML' | 'TOML', text: string): string {
  const at = locate(e, text);
  return at ? `invalid ${kind} at ${at}` : `invalid ${kind}`;
}

function locate(e: unknown, text: string): string | undefined {
  if (typeof e !== 'object' || e === null) return undefined;
  const o = e as { line?: unknown; column?: unknown; linePos?: unknown; message?: unknown };
  if (typeof o.line === 'number' && typeof o.column === 'number') return `line ${o.line}, column ${o.column}`;
  if (Array.isArray(o.linePos)) {
    const p = o.linePos[0] as { line?: unknown; col?: unknown } | undefined;
    if (p && typeof p.line === 'number' && typeof p.col === 'number') return `line ${p.line}, column ${p.col}`;
  }
  const msg = typeof o.message === 'string' ? o.message : '';
  const lc = /\(line (\d+) column (\d+)\)/.exec(msg);
  if (lc) return `line ${lc[1]}, column ${lc[2]}`;
  const pos = /\bat position (\d+)\b/.exec(msg);
  if (pos) return `offset ${pos[1]}`;
  // Older V8 words: Unexpected token 'g', ..."excerpt"... is not valid JSON
  const ex = /(?:, |\.\.\.)"([\s\S]*?)"(?:\.\.\.)? is not valid JSON$/.exec(msg);
  if (ex && ex[1]) {
    const idx = text.indexOf(ex[1]);
    if (idx >= 0) return `line ${new LineIndex(text).lineAt(idx + ex[1].length)}`;
  }
  return undefined;
}
