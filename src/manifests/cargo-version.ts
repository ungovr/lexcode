/**
 * Cargo's version rules, as the Cargo reader needs them to pick one locked version for a requirement: SemVer
 * precedence and the plain caret, tilde and exact requirement forms (#13298 moved them out of cargo.ts).
 */

type Triple = [number, number, number];

export interface Parsed {
  v: Triple;
  pre?: string;
}

export function parseVersion(s: string): Parsed | undefined {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(s.trim());
  if (!m) return undefined;
  return { v: [Number(m[1]), Number(m[2]), Number(m[3])], ...(m[4] ? { pre: m[4] } : {}) };
}

function cmpTriple(a: Triple, b: Triple): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

/** SemVer precedence: a release is above its pre-releases; identifiers compare numerically, then as text. */
export function cmpVersion(a: Parsed, b: Parsed): number {
  const t = cmpTriple(a.v, b.v);
  if (t !== 0) return t;
  if (a.pre === undefined || b.pre === undefined) return a.pre === b.pre ? 0 : a.pre === undefined ? 1 : -1;
  const x = a.pre.split('.');
  const y = b.pre.split('.');
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    const p = x[i] as string;
    const q = y[i] as string;
    const pn = /^\d+$/.test(p);
    const qn = /^\d+$/.test(q);
    if (pn && qn) {
      const d = Number(p) - Number(q);
      if (d !== 0) return d;
    } else if (pn !== qn) return pn ? -1 : 1;
    else if (p !== q) return p < q ? -1 : 1;
  }
  return x.length - y.length;
}

/** The versions a plain requirement admits: `[lower, upper)`, or exactly `lower` for a full `=` version. */
interface Range {
  lower: Parsed;
  upper?: Triple;
}

/**
 * A plain caret (`1.2`, `^1.2`), tilde (`~1.2`) or exact (`=1.2.3`) requirement, read with Cargo's rules:
 * a caret keeps the leftmost non-zero component, so `1.2` admits `1.x.y` from 1.2.0, `0.4` admits `0.4.z`
 * and `0.0.3` admits only `0.0.3`. A comparison, a wildcard or several comma-joined clauses give undefined.
 */
export function parseRequirement(req: string): Range | undefined {
  const m = /^(\^|~|=)?\s*(\d+)(?:\.(\d+)(?:\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?)?)?$/.exec(req.trim());
  if (!m) return undefined;
  const op = m[1] ?? '^';
  const major = Number(m[2]);
  const minor = m[3] === undefined ? undefined : Number(m[3]);
  const patch = m[4] === undefined ? undefined : Number(m[4]);
  const lower: Parsed = { v: [major, minor ?? 0, patch ?? 0], ...(m[5] ? { pre: m[5] } : {}) };
  if (minor === undefined) return { lower, upper: [major + 1, 0, 0] };
  if (op === '~' || (op === '=' && patch === undefined)) return { lower, upper: [major, minor + 1, 0] };
  if (op === '=') return { lower };
  if (major > 0) return { lower, upper: [major + 1, 0, 0] };
  if (minor > 0 || patch === undefined) return { lower, upper: [0, minor + 1, 0] };
  return { lower, upper: [0, 0, (patch as number) + 1] };
}

export function admits(range: Range, c: Parsed): boolean {
  // As in Cargo, a pre-release is admitted only by a requirement that names a pre-release of the same version.
  if (c.pre !== undefined && (range.lower.pre === undefined || cmpTriple(range.lower.v, c.v) !== 0)) return false;
  if (range.upper === undefined) return cmpVersion(c, range.lower) === 0;
  return cmpVersion(c, range.lower) >= 0 && cmpTriple(c.v, range.upper) < 0;
}
