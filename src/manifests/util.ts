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
 * Where `"key"` is written inside the object value of `"section"`, answered from one pass over the
 * text per section. The block of a section runs to the first `}` after its `{`; when the section name
 * appears more than once, the first block that holds the key wins. A key that cannot be located is
 * line 1.
 */
export class KeyLocator {
  private readonly lines: LineIndex;
  private readonly sections = new Map<string, Map<string, number>>();

  constructor(private readonly text: string) {
    this.lines = new LineIndex(text);
  }

  private keysOf(section: string): Map<string, number> {
    const hit = this.sections.get(section);
    if (hit) return hit;
    const keys = new Map<string, number>();
    const sectionRe = new RegExp(`"${section}"\\s*:\\s*\\{`, 'g');
    const keyRe = /"((?:[^"\\]|\\.)*)"\s*:/g;
    let m: RegExpExecArray | null;
    while ((m = sectionRe.exec(this.text))) {
      const start = m.index + m[0].length;
      const close = this.text.indexOf('}', start);
      const end = close < 0 ? this.text.length : close;
      keyRe.lastIndex = start;
      let k: RegExpExecArray | null;
      while ((k = keyRe.exec(this.text)) && k.index < end) {
        const quoted = `"${k[1] as string}"`;
        if (!keys.has(quoted)) keys.set(quoted, k.index);
      }
    }
    this.sections.set(section, keys);
    return keys;
  }

  line(section: string, key: string): number {
    const at = this.keysOf(section).get(JSON.stringify(key));
    return at === undefined ? 1 : this.lines.lineAt(at);
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

// ---- Ruby manifests (Gemfile, Podfile) ---------------------------------------------------------

/** Cut a trailing `# comment` from a line of Ruby, leaving a `#` inside a quoted string alone. */
export function stripRubyComment(line: string): string {
  let quote = '';
  for (let i = 0; i < line.length; i++) {
    const c = line[i] as string;
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '#') return line.slice(0, i);
  }
  return line;
}

/** A line of Ruby with the text inside each `"..."` and `'...'` string blanked, quotes kept, so a word in a string is not a keyword. */
export function blankRubyStrings(code: string): string {
  let out = '';
  let quote = '';
  for (let i = 0; i < code.length; i++) {
    const c = code[i] as string;
    if (quote) {
      if (c === '\\') {
        out += i + 1 < code.length ? '  ' : ' ';
        i++;
      } else if (c === quote) {
        quote = '';
        out += c;
      } else out += ' ';
    } else {
      if (c === '"' || c === "'") quote = c;
      out += c;
    }
  }
  return out;
}

/**
 * The keyword `end`: a whole word that is not a method (`range.end`), a symbol (`:end`, `end:`), a variable
 * (`@end`, `$end`) or a predicate name, in code whose strings are blanked.
 */
const KEYWORD_END = /(?:^|[\s;(])end(?![\w?!:])/;
const EXPR_OPENER = /(?:[=(]|\|\||&&)\s*(?:if|unless|case|begin)\b/g;

/** Does this logical line of Ruby open a block that a later `end` closes? One-line forms and modifiers do not. */
export function opensRubyBlock(code: string): boolean {
  const b = blankRubyStrings(code);
  if (/(?:^|[\s;(])end$/.test(b)) return false;
  if (/\bdo(?:\s*\|[^|]*\|)?$/.test(code)) return true;
  if (/^def\s+[^\s(]+(?:\([^)]*\))?\s*=[^=~]/.test(code)) return false;
  if (/^(?:if|unless|case|begin|while|until|for|def|class|module)\b/.test(code)) return true;
  // `x = if ...`, `(case ...`, `y || begin`: an opener in an expression, unless the keyword `end` follows it on
  // the same line. `(1..3).end`, `opts[:end]` and `ENV["end"]` are not that keyword (#13511).
  for (const m of b.matchAll(EXPR_OPENER)) {
    if (!KEYWORD_END.test(b.slice(m.index + m[0].length))) return true;
  }
  return false;
}

/**
 * The statements of a logical line of Ruby, split at each `;` outside a string, a bracket and a `do ... end`
 * block: `gem "a"; gem "b"` is two statements, `group :test do gem "a"; gem "b" end` is one (#13511).
 */
export function splitRubyStatements(code: string): string[] {
  if (!code.includes(';')) return [code];
  const b = blankRubyStrings(code);
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < b.length; i++) {
    const c = b[i] as string;
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth = Math.max(0, depth - 1);
    else if (c === ';' && depth === 0) {
      out.push(code.slice(start, i).trim());
      start = i + 1;
    } else if ((c === 'd' || c === 'e') && !/[\w.:@$]/.test(b[i - 1] ?? ' ')) {
      const w = /^(?:do|end)(?![\w?!:])/.exec(b.slice(i, i + 4));
      if (w) {
        depth = w[0] === 'do' ? depth + 1 : Math.max(0, depth - 1);
        i += w[0].length - 1;
      }
    }
  }
  out.push(code.slice(start).trim());
  return out.filter((s) => s !== '');
}

/**
 * The logical lines of a Ruby manifest (a Gemfile or a Podfile), read and never evaluated. Comments are cut;
 * blank lines, `=begin`/`=end` blocks and heredoc bodies are skipped; and a call whose code matches `joined`
 * and runs on over several lines, each but the last ending in a comma or a backslash, is joined into one.
 * `line` is the 1-based line where the logical line starts.
 */
export function* rubyLines(text: string, joined: RegExp): Generator<{ code: string; line: number }> {
  const lines = text.split(/\r?\n/);
  let heredoc: string | undefined;
  let blockComment = false;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] as string;
    const line = i + 1;
    if (heredoc !== undefined) {
      if (raw.trim() === heredoc) heredoc = undefined;
      continue;
    }
    if (blockComment) {
      if (/^=end\b/.test(raw)) blockComment = false;
      continue;
    }
    if (/^=begin\b/.test(raw)) {
      blockComment = true;
      continue;
    }
    let code = stripRubyComment(raw).trim();
    if (code === '') continue;
    if (joined.test(code)) {
      // The pieces are joined once at the end, and only the last piece is tested and trimmed: re-testing and
      // rebuilding the whole joined text per line took 26.7 s on 100,000 lines (final review minor 1). A blank
      // piece adds nothing and trims the end of the piece before it, as trimming the joined text did.
      const parts = [code];
      while (/[,\\]$/.test(parts[parts.length - 1] as string) && i + 1 < lines.length) {
        i++;
        const next = stripRubyComment(lines[i] as string).trim();
        const k = parts.length - 1;
        const prev = (parts[k] as string).replace(/\\$/, '');
        if (next === '') parts[k] = prev.trimEnd();
        else {
          parts[k] = prev;
          parts.push(next);
        }
      }
      code = parts.join(' ').trim();
    }
    const hd = /<<[~-]?(["']?)([A-Za-z_]\w*)\1/.exec(code);
    if (hd) heredoc = hd[2];
    yield { code, line };
  }
}
