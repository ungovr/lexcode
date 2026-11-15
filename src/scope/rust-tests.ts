import type { EngineMatch } from '../types.js';

/**
 * Rust keeps unit tests inside the source file, in a module that carries `#[cfg(test)]`, and the engine
 * matches code there like any other. Tests are out of scope unless the scan includes them, so `scan()`
 * drops a match in a `.rs` file whose line falls inside such a module (Decision 7, #13199).
 *
 * A module is a `mod <name> { ... }` item with a `#[cfg(test)]` attribute among its outer attributes
 * (other attributes and comments may sit between, and a visibility such as `pub(crate)` before `mod`).
 * Only the exact `cfg(test)` counts: `cfg(not(test))` is code, and `cfg(any(test, ...))` is code in some
 * builds. A `#[cfg(test)] mod tests;` names another file, which this does not follow (a known gap).
 */

/** A significant token: a single punctuation character, an identifier, or an opaque literal. */
interface Tok {
  t: string;
  off: number;
}

const IDENT_START = /[A-Za-z_]/;
const IDENT_PART = /[A-Za-z0-9_]/;
const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
/** Literal tokens are opaque; this text never equals punctuation or an identifier. */
const LIT = '\0lit';

/** The tokens of `text` that matter for finding modules: comments are dropped, literals made opaque. */
function tokenize(text: string): Tok[] {
  const toks: Tok[] = [];
  const n = text.length;
  let i = 0;

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
    const c = text.charAt(i);
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
        const cp = text.codePointAt(i + 1);
        const width = cp !== undefined && cp > 0xffff ? 2 : 1;
        if (cp !== undefined && text[i + 1 + width] === "'") {
          toks.push({ t: LIT, off: i });
          i += 2 + width;
        } else {
          i += 1; // a lifetime: the name that follows is an identifier token
        }
      }
    } else if (IDENT_START.test(c)) {
      let j = i + 1;
      while (j < n && IDENT_PART.test(text.charAt(j))) j += 1;
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
      i += 1;
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

/**
 * The 1-based, inclusive line ranges of every `#[cfg(test)]` module in a Rust file, from the attribute's
 * line to the closing brace's line, in file order. An unterminated module runs to the last line. A test
 * module nested inside another is covered by the outer one and not listed again.
 */
export function rustTestRanges(text: string): Array<[number, number]> {
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

  const ranges: Array<[number, number]> = [];
  let k = 0;
  while (k < toks.length) {
    if (toks[k]?.t !== '#' || toks[k + 1]?.t !== '[') {
      k += 1;
      continue;
    }
    // A run of outer attributes; remember the first that is exactly cfg(test).
    let at = k;
    let cfgTest: Tok | undefined;
    while (toks[at]?.t === '#' && toks[at + 1]?.t === '[') {
      const end = closeOf(toks, at + 1, '[', ']');
      if (end < 0) return ranges;
      const body = toks.slice(at + 2, end).map((x) => x.t);
      if (cfgTest === undefined && body.join(' ') === 'cfg ( test )') cfgTest = toks[at];
      at = end + 1;
    }
    if (cfgTest === undefined) {
      k = at;
      continue;
    }
    let j = at;
    if (toks[j]?.t === 'pub') {
      j += 1;
      if (toks[j]?.t === '(') {
        j = closeOf(toks, j, '(', ')');
        if (j < 0) return ranges;
        j += 1;
      }
    }
    // The module's name, or a raw identifier `r#name`.
    let name = j + 1;
    const r = toks[name];
    const hash = toks[name + 1];
    if (r?.t === 'r' && hash?.t === '#' && hash.off === r.off + 1) name += 2;
    if (toks[j]?.t === 'mod' && IDENT.test(toks[name]?.t ?? '') && toks[name + 1]?.t === '{') {
      const close = closeOf(toks, name + 1, '{', '}');
      const brace = toks[close];
      ranges.push([lineOf(cfgTest.off), brace === undefined ? lastLine : lineOf(brace.off)]);
      if (brace === undefined) return ranges;
      k = close + 1;
    } else {
      k = at;
    }
  }
  return ranges;
}

/**
 * The matches outside Rust test modules. Each `.rs` file that has a match is read once, through `read`
 * (undefined when it cannot be read, and then its matches are all kept); other files are untouched.
 */
export function dropRustTestMatches(matches: EngineMatch[], read: (path: string) => string | undefined): EngineMatch[] {
  const ranges = new Map<string, Array<[number, number]>>();
  return matches.filter((m) => {
    if (!m.path.endsWith('.rs')) return true;
    let r = ranges.get(m.path);
    if (r === undefined) {
      const text = read(m.path);
      r = text === undefined ? [] : rustTestRanges(text);
      ranges.set(m.path, r);
    }
    return !r.some(([from, to]) => m.line >= from && m.line <= to);
  });
}
