import type { EngineMatch } from '../types.js';

/**
 * Rust keeps unit tests inside the source file, in a module that carries `#[cfg(test)]`, and the engine
 * matches code there like any other. Tests are out of scope unless the scan includes them, so `scan()`
 * drops a match in a `.rs` file whose line falls inside such a module (Decision 7, #13199), or in a file
 * that is such a module (#13299).
 *
 * A test module is a `mod <name> { ... }` item with a test-only `cfg` among its outer attributes (other
 * attributes and comments may sit between, and a visibility such as `pub(crate)` before `mod`), or one
 * whose body opens with a test-only `#![cfg(...)]`. A `cfg` is test-only when it holds in a test build
 * and in no other, whatever the other options are: `cfg(test)`, `cfg(all(test, ...))`, `cfg(not(not(test)))`.
 * `cfg(not(test))` is code, and `cfg(any(test, ...))` is code in some builds, so both are kept.
 *
 * A whole file is a test module when its first lines carry a test-only `#![cfg(...)]`, or when every file
 * that declares it (`#[cfg(test)] mod tests;` in the parent) declares it as a test module or is one. The
 * parent is found by Rust's own file layout: `a/tests.rs` or `a/tests/mod.rs` is declared by `a/mod.rs`,
 * `a/lib.rs`, `a/main.rs` or `a.rs`, or by an inline `mod` of a file higher up. A `#[path = "..."]`
 * declaration, and one inside a function body, are not followed.
 */

/** A significant token: a single punctuation character, an identifier, or an opaque literal. */
interface Tok {
  t: string;
  off: number;
}

const IDENT_START = /[\p{XID_Start}_]/u;
const IDENT_PART = /\p{XID_Continue}/u;
const IDENT = /^[\p{XID_Start}_]\p{XID_Continue}*$/u;
/** Literal tokens are opaque; this text never equals punctuation or an identifier. */
const LIT = '\0lit';

/** The tokens of `text` that matter for finding modules: comments are dropped, literals made opaque. */
function tokenize(text: string): Tok[] {
  const toks: Tok[] = [];
  const n = text.length;
  let i = 0;

  /** The code point at `j` as a string (one or two UTF-16 units), or '' past the end. */
  const charAt = (j: number): string => {
    const cp = text.codePointAt(j);
    return cp === undefined ? '' : String.fromCodePoint(cp);
  };

  /** The end of a quoted string body that starts at `i` (just past the opening quote), with escapes. */
  const quoted = (from: number): number => {
    let j = from;
    while (j < n) {
      const c = text[j];
      if (c === '\\') j += 2;
      else if (c === '"') return j + 1;
      else j += 1;
    }
    return n;
  };

  /** A raw string at `from` (`#`* then `"`), or -1 when there is none. Returns the index past its end. */
  const raw = (from: number): number => {
    let j = from;
    while (j < n && text[j] === '#') j += 1;
    if (text[j] !== '"') return -1;
    const close = `"${'#'.repeat(j - from)}`;
    const end = text.indexOf(close, j + 1);
    return end < 0 ? n : end + close.length;
  };

  while (i < n) {
    const c = charAt(i);
    if (c === '/' && text[i + 1] === '/') {
      const nl = text.indexOf('\n', i);
      i = nl < 0 ? n : nl;
    } else if (c === '/' && text[i + 1] === '*') {
      // Block comments nest in Rust.
      let depth = 1;
      i += 2;
      while (i < n && depth > 0) {
        if (text[i] === '/' && text[i + 1] === '*') {
          depth += 1;
          i += 2;
        } else if (text[i] === '*' && text[i + 1] === '/') {
          depth -= 1;
          i += 2;
        } else i += 1;
      }
    } else if (c === '"') {
      toks.push({ t: LIT, off: i });
      i = quoted(i + 1);
    } else if (c === "'") {
      // A char literal ('x', '\n', '\u{7d}', '}') or a lifetime or label ('a, 'static, 'outer:).
      if (text[i + 1] === '\\') {
        let j = i + 3;
        while (j < n && text[j] !== "'" && text[j] !== '\n') j += 1;
        toks.push({ t: LIT, off: i });
        i = j + 1;
      } else {
        const ch = charAt(i + 1);
        if (ch !== '' && text[i + 1 + ch.length] === "'") {
          toks.push({ t: LIT, off: i });
          i += 2 + ch.length;
        } else {
          i += 1; // a lifetime: the name that follows is an identifier token
        }
      }
    } else if (IDENT_START.test(c)) {
      let j = i + c.length;
      for (let d = charAt(j); d !== '' && IDENT_PART.test(d); d = charAt(j)) j += d.length;
      const word = text.slice(i, j);
      // r"..", r#".."#, br"..", cr#".."#: a raw string, where a backslash escapes nothing. `r#name` is a raw identifier.
      const end = word === 'r' || word === 'br' || word === 'cr' ? raw(j) : -1;
      if (end >= 0) {
        toks.push({ t: LIT, off: i });
        i = end;
      } else {
        toks.push({ t: word, off: i });
        i = j;
      }
    } else if (/\s/.test(c)) {
      i += 1;
    } else {
      toks.push({ t: c, off: i });
      i += c.length;
    }
  }
  return toks;
}

/** The index of the bracket that closes the one at `open`, or -1 when it never closes. */
function closeOf(toks: Tok[], open: number, o: string, c: string): number {
  let depth = 0;
  for (let k = open; k < toks.length; k++) {
    const t = toks[k]?.t;
    if (t === o) depth += 1;
    else if (t === c && --depth === 0) return k;
  }
  return -1;
}

/** Kleene's three values: false, true, and unknown (an option other than `test`). */
type Tri = 0 | 1 | 2;
const F: Tri = 0;
const T: Tri = 1;
const U: Tri = 2;

/**
 * The value of the configuration predicate in `body` (the tokens between `cfg(` and `)`) when `test` is
 * set as given and every other option is unknown, or undefined when it does not parse.
 */
function cfgValue(body: string[], test: boolean): Tri | undefined {
  let i = 0;
  const pred = (): Tri | undefined => {
    const word = body[i];
    if (word === undefined || !IDENT.test(word)) return undefined;
    i += 1;
    if ((word === 'all' || word === 'any' || word === 'not') && body[i] === '(') {
      i += 1;
      const vals: Tri[] = [];
      while (body[i] !== ')') {
        const v = pred();
        if (v === undefined) return undefined;
        vals.push(v);
        if (body[i] === ',') i += 1;
        else if (body[i] !== ')') return undefined;
      }
      i += 1;
      if (word === 'not') {
        if (vals.length !== 1) return undefined;
        return vals[0] === U ? U : vals[0] === T ? F : T;
      }
      if (word === 'all') return vals.includes(F) ? F : vals.includes(U) ? U : T;
      return vals.includes(T) ? T : vals.includes(U) ? U : F;
    }
    if (body[i] === '=') {
      if (body[i + 1] !== LIT) return undefined;
      i += 2;
      return U; // feature = "test" names a feature, not the test build
    }
    if (word === 'test') return test ? T : F;
    return U;
  };
  const v = pred();
  return i === body.length ? v : undefined;
}

/** Whether an attribute's tokens (between `[` and `]`) are a `cfg` that holds in test builds only. */
function testOnlyCfg(attr: string[]): boolean {
  if (attr[0] !== 'cfg' || attr[1] !== '(' || attr[attr.length - 1] !== ')') return false;
  const body = attr.slice(2, -1);
  return cfgValue(body, false) === F && (cfgValue(body, true) ?? F) !== F;
}

/** A `mod <name>;` item, with the inline modules it sits in, from the outermost. */
interface ModDecl {
  path: string[];
  name: string;
  /** Declared with a test-only cfg, or inside a test module. */
  test: boolean;
}

interface RustScan {
  /** The file is a test module by its own first lines. */
  fileTest: boolean;
  ranges: Array<[number, number]>;
  decls: ModDecl[];
}

/** One open brace: a module body (`name` set) or any other block. */
interface Frame {
  name?: string;
  test: boolean;
  /** This frame is a test module and the one around it is not: its range is reported. */
  own: boolean;
  /** The token that starts the item: the first outer attribute, or the visibility or `mod`. */
  start: number;
}

function scanRust(text: string): RustScan {
  const toks = tokenize(text);
  const newlines: number[] = [];
  for (let i = text.indexOf('\n'); i >= 0; i = text.indexOf('\n', i + 1)) newlines.push(i);
  const lineOf = (off: number): number => {
    let lo = 0;
    let hi = newlines.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if ((newlines[mid] ?? Infinity) < off) lo = mid + 1;
      else hi = mid;
    }
    return lo + 1;
  };
  const lastLine = newlines.length + (text.length > 0 && !text.endsWith('\n') ? 1 : 0);
  const lineOfTok = (k: number): number | undefined => {
    const tok = toks[k];
    return tok === undefined ? undefined : lineOf(tok.off);
  };

  const ranges: Array<[number, number]> = [];
  const decls: ModDecl[] = [];
  const stack: Frame[] = [];
  let fileTest = false;

  /**
   * The range from the item at `start` to the brace at `close` (or the end of the file), less a first
   * line that holds code before the item and a last line that holds code after the brace.
   */
  const report = (start: number, close: number | undefined): void => {
    let from = lineOfTok(start) ?? 1;
    if (start > 0 && lineOfTok(start - 1) === from) from += 1;
    let to = close === undefined ? lastLine : (lineOfTok(close) ?? lastLine);
    if (close !== undefined && lineOfTok(close + 1) === to) to -= 1;
    if (from <= to) ranges.push([from, to]);
  };

  let k = 0;
  while (k < toks.length) {
    const t = toks[k]?.t;
    const top = stack[stack.length - 1];
    const inTest = top?.test ?? false;

    // An inner attribute: on the file when no brace is open, else on the block it opens.
    if (t === '#' && toks[k + 1]?.t === '!' && toks[k + 2]?.t === '[') {
      const end = closeOf(toks, k + 2, '[', ']');
      if (end < 0) break;
      if (testOnlyCfg(toks.slice(k + 3, end).map((x) => x.t))) {
        if (top === undefined) fileTest = true;
        else if (top.name !== undefined && !top.test) {
          top.test = true;
          top.own = true;
        }
      }
      k = end + 1;
      continue;
    }

    // An item, with its outer attributes: a module is a body or a declaration; anything else is read on.
    let at = k;
    let testAttr = false;
    let pathAttr = false;
    while (toks[at]?.t === '#' && toks[at + 1]?.t === '[') {
      const end = closeOf(toks, at + 1, '[', ']');
      if (end < 0) break;
      const attr = toks.slice(at + 2, end).map((x) => x.t);
      if (testOnlyCfg(attr)) testAttr = true;
      if (attr[0] === 'path' && attr[1] === '=') pathAttr = true;
      at = end + 1;
    }
    let j = at;
    if (toks[j]?.t === 'pub') {
      j += 1;
      if (toks[j]?.t === '(') {
        const close = closeOf(toks, j, '(', ')');
        j = close < 0 ? j : close + 1;
      }
    }
    if (toks[j]?.t === 'mod') {
      // The module's name, or a raw identifier `r#name`.
      let name = j + 1;
      const r = toks[name];
      const hash = toks[name + 1];
      if (r?.t === 'r' && hash?.t === '#' && hash.off === r.off + 1) name += 2;
      const word = toks[name]?.t ?? '';
      const after = toks[name + 1]?.t;
      if (IDENT.test(word) && after === '{') {
        const test = inTest || testAttr;
        stack.push({ name: word, test, own: test && !inTest, start: k });
        k = name + 2;
        continue;
      }
      if (IDENT.test(word) && after === ';') {
        if (!pathAttr && stack.every((f) => f.name !== undefined)) {
          decls.push({ path: stack.map((f) => f.name ?? ''), name: word, test: inTest || testAttr });
        }
        k = name + 2;
        continue;
      }
    }
    if (at > k) {
      k = at; // attributes on another item: read the item itself on
      continue;
    }

    if (t === '{') stack.push({ test: inTest, own: false, start: k });
    else if (t === '}') {
      const frame = stack.pop();
      if (frame?.own === true) report(frame.start, k);
    }
    k += 1;
  }
  // An unterminated test module runs to the last line.
  const open = stack.find((f) => f.own);
  if (open !== undefined) report(open.start, undefined);
  if (fileTest) return { fileTest, ranges: lastLine > 0 ? [[1, lastLine]] : [], decls };
  return { fileTest, ranges, decls };
}

/**
 * The 1-based, inclusive line ranges of every test module in a Rust file, from the module's first
 * attribute to its closing brace, in file order; the whole file when its first lines say it is one. A line
 * that holds code before the module starts, or after it ends, is left out. An unterminated module runs to
 * the last line. A test module nested inside another is covered by the outer one and not listed again.
 */
export function rustTestRanges(text: string): Array<[number, number]> {
  return scanRust(text).ranges;
}

/** Files that are crate roots by Cargo's layout, never a module another file declares. */
const CRATE_ROOTS = new Set(['lib.rs', 'main.rs', 'build.rs']);
/** How many inline modules deep a declaration of an out-of-line module is looked for. */
const MAX_INLINE = 3;

/**
 * The files that may declare the module in `path` with `mod <name>;`, each with the inline modules the
 * declaration would sit in. Empty for a crate root.
 */
function declarers(path: string): Array<{ file: string; inline: string[]; name: string }> {
  const parts = path.split('/');
  const base = parts.pop() ?? '';
  if (CRATE_ROOTS.has(base) || !base.endsWith('.rs')) return [];
  let name = base.slice(0, -3);
  if (base === 'mod.rs') {
    const dir = parts.pop();
    if (dir === undefined) return [];
    name = dir;
  }
  const out: Array<{ file: string; inline: string[]; name: string }> = [];
  for (let j = parts.length; j >= Math.max(0, parts.length - MAX_INLINE); j--) {
    const prefix = parts.slice(0, j);
    const inline = parts.slice(j);
    // A mod.rs, lib.rs or main.rs keeps its modules in its own directory, any other file in a directory named for it.
    for (const own of ['mod.rs', 'lib.rs', 'main.rs']) out.push({ file: [...prefix, own].join('/'), inline, name });
    if (j > 0) out.push({ file: `${[...prefix.slice(0, -1), `${prefix[j - 1] ?? ''}.rs`].join('/')}`, inline, name });
  }
  return out.filter((d) => d.file !== path);
}

/**
 * The matches outside Rust test code. Each `.rs` file is read at most once, through `read` (undefined when
 * it cannot be read, and then its matches are all kept): a file with a match, and the files that may
 * declare it as a module. Other files are untouched.
 */
export function dropRustTestMatches(matches: EngineMatch[], read: (path: string) => string | undefined): EngineMatch[] {
  const scans = new Map<string, RustScan | null>();
  const scanOf = (path: string): RustScan | undefined => {
    let s = scans.get(path);
    if (s === undefined) {
      const text = read(path);
      s = text === undefined ? null : scanRust(text);
      scans.set(path, s);
    }
    return s ?? undefined;
  };

  const testFiles = new Map<string, boolean>();
  const isTestFile = (path: string): boolean => {
    const known = testFiles.get(path);
    if (known !== undefined) return known;
    testFiles.set(path, false); // a file that declares itself, by some odd layout, is not followed round
    let verdict = scanOf(path)?.fileTest ?? false;
    if (!verdict) {
      const found: boolean[] = [];
      for (const d of declarers(path)) {
        const s = scanOf(d.file);
        if (s === undefined) continue;
        for (const decl of s.decls) {
          if (decl.name !== d.name || decl.path.join('/') !== d.inline.join('/')) continue;
          found.push(decl.test || isTestFile(d.file));
        }
      }
      verdict = found.length > 0 && found.every(Boolean);
    }
    testFiles.set(path, verdict);
    return verdict;
  };

  return matches.filter((m) => {
    if (!m.path.endsWith('.rs')) return true;
    const s = scanOf(m.path);
    if (s === undefined) return true;
    if (s.ranges.some(([from, to]) => m.line >= from && m.line <= to)) return false;
    return !isTestFile(m.path);
  });
}
