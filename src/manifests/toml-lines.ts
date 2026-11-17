/**
 * Line lookups for one TOML file, answered from tables built in one pass. Looking each dependency up
 * by scanning the lines (a regex per table header, a scan from the table's header to the key) made a
 * pyproject.toml with thousands of dependencies quadratic.
 */
export class TomlLines {
  private headers: Map<string, number> | undefined;
  private keys: Map<string, number[]> | undefined;
  /** Misses allowed in `stringLine` before it stops looking: a spec TOML escapes is never on a line as parsed, and each miss reads to the end. */
  private missesLeft = 100;

  constructor(readonly lines: string[]) {}

  /** Index of the first `[a.b.c]` table header line, or -1. Spaces around dots are ignored. */
  headerLine(dotted: string): number {
    if (!this.headers) {
      const headers = new Map<string, number>();
      const re = /^\s*\[\s*([^[\]]+?)\s*\]\s*(#.*)?$/;
      this.lines.forEach((l, i) => {
        const m = re.exec(l);
        if (!m) return;
        const name = (m[1] as string).split('.').map((p) => p.trim()).join('.');
        if (!headers.has(name)) headers.set(name, i);
      });
      this.headers = headers;
    }
    return this.headers.get(dotted) ?? -1;
  }

  /** Index of the first line at or after `from` that is `key =` (key optionally quoted, case-insensitive), or -1. */
  keyLine(from: number, key: string): number {
    if (!this.keys) {
      const keys = new Map<string, number[]>();
      const re = /^\s*["']?(.*?)["']?\s*=/;
      this.lines.forEach((l, i) => {
        const m = re.exec(l);
        if (!m) return;
        const k = (m[1] as string).toLowerCase();
        const at = keys.get(k);
        if (at) at.push(i);
        else keys.set(k, [i]);
      });
      this.keys = keys;
    }
    const at = this.keys.get(key.toLowerCase());
    if (!at) return -1;
    const start = Math.max(from, 0);
    let lo = 0;
    let hi = at.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if ((at[mid] as number) < start) lo = mid + 1;
      else hi = mid;
    }
    return lo < at.length ? (at[lo] as number) : -1;
  }

  /** Index of the first line at or after `from` containing `literal`, or -1. */
  stringLine(from: number, literal: string): number {
    if (this.missesLeft <= 0) return -1;
    for (let i = Math.max(from, 0); i < this.lines.length; i++) if ((this.lines[i] as string).includes(literal)) return i;
    this.missesLeft--;
    return -1;
  }
}

/** A bare key segment, matched where it stands (sticky), so a long dotted key is read in one pass. */
const BARE_KEY = /[A-Za-z0-9_-]+/y;

/**
 * Read a dotted TOML key (bare, "basic" or 'literal' segments) starting at `i`. Returns the segments
 * and the index just past the key, or undefined when no key starts there.
 */
function keyPath(s: string, i: number): { segs: string[]; end: number } | undefined {
  const segs: string[] = [];
  const ws = (): void => {
    while (s[i] === ' ' || s[i] === '\t') i++;
  };
  for (;;) {
    ws();
    const c = s[i];
    if (c === '"') {
      let seg = '';
      i++;
      while (i < s.length && s[i] !== '"') {
        if (s[i] === '\\' && i + 1 < s.length) i++;
        seg += s[i];
        i++;
      }
      if (s[i] !== '"') return undefined;
      i++;
      segs.push(seg);
    } else if (c === "'") {
      const close = s.indexOf("'", i + 1);
      if (close < 0) return undefined;
      segs.push(s.slice(i + 1, close));
      i = close + 1;
    } else {
      BARE_KEY.lastIndex = i;
      const m = BARE_KEY.exec(s);
      if (!m) return undefined;
      segs.push(m[0]);
      i += m[0].length;
    }
    ws();
    if (s[i] !== '.') return { segs, end: i };
    i++;
  }
}

/**
 * The longest path `TomlKeyLines.line` is asked for (Cargo's `[target, <cfg>, dependencies, <crate>]`). A longer path is
 * never looked up, so it is not recorded: recording every prefix of a 70,000-segment dotted key ran the heap
 * out (final review I-2).
 */
const MAX_LOOKUP = 4;

/**
 * The net count of `[` and `{` over `]` and `}` in TOML text from `from`, outside strings and a comment: how
 * far a line opens (or closes) a multi-line array.
 */
function bracketDepth(s: string, from: number): number {
  let d = 0;
  for (let i = from; i < s.length; i++) {
    const c = s[i];
    if (c === '#') break;
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < s.length && s[j] !== c) j += c === '"' && s[j] === '\\' ? 2 : 1;
      i = j;
    } else if (c === '[' || c === '{') d++;
    else if (c === ']' || c === '}') d--;
  }
  return d;
}

/**
 * The line of every table header and every key in one TOML file, by its full path, from one pass (written for
 * Cargo.toml, #13298). Unlike `TomlLines`, it reads a quoted header segment (`[target."cfg(unix)".dependencies]`)
 * and a dotted key (`serde.workspace = true`) where they stand.
 * `[dependencies.tokio]` records `dependencies.tokio`; `serde.workspace = true` under `[dependencies]`
 * records `dependencies.serde` and `dependencies.serde.workspace`. The first line wins. A path longer than
 * MAX_LOOKUP is not recorded, and the lines inside a multi-line array are values, never headers or keys.
 */
export class TomlKeyLines {
  private readonly at = new Map<string, number>();

  constructor(text: string) {
    let table: string[] = [];
    let inString: string | undefined;
    /** How deep the multi-line array (or inline table) a key's value opened still is. */
    let open = 0;
    const lines = text.split('\n');
    for (let n = 0; n < lines.length; n++) {
      const line = lines[n] as string;
      if (inString !== undefined) {
        if (line.includes(inString)) inString = undefined;
        continue;
      }
      if (open > 0) {
        open = Math.max(0, open + bracketDepth(line, 0));
        continue;
      }
      const header = /^\s*\[(\[?)/.exec(line);
      if (header) {
        const k = keyPath(line, header[0].length);
        if (!k || line[k.end] !== ']') continue;
        table = k.segs;
        if (header[1] === '') this.record(table, n);
        continue;
      }
      const k = keyPath(line, 0);
      if (!k || line[k.end] !== '=') continue;
      for (let i = 1; i <= k.segs.length && table.length + i <= MAX_LOOKUP; i++) this.record([...table, ...k.segs.slice(0, i)], n);
      const value = line.slice(k.end + 1).trimStart();
      for (const delim of ['"""', "'''"]) {
        if (value.startsWith(delim) && !value.slice(3).includes(delim)) inString = delim;
      }
      if (inString === undefined) open = Math.max(0, bracketDepth(line, k.end + 1));
    }
  }

  private record(path: string[], line: number): void {
    if (path.length > MAX_LOOKUP) return;
    const key = path.join('\0');
    if (!this.at.has(key)) this.at.set(key, line + 1);
  }

  /** 1-based line of the key or header at `path`, else of the nearest enclosing table's header, else 1. */
  line(path: string[]): number {
    for (let n = path.length; n > 0; n--) {
      const hit = this.at.get(path.slice(0, n).join('\0'));
      if (hit !== undefined) return hit;
    }
    return 1;
  }
}
