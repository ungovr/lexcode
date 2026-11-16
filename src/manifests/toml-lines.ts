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
