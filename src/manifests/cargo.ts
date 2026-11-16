import { parse as parseToml } from 'smol-toml';
import type { Dependency } from '../types.js';
import { ancestorDirs, baseName, describeParseError, dirOf, fileExists, joinRel, readText, type ReaderResult } from './util.js';

type Table = Record<string, unknown>;

function isTable(v: unknown): v is Table {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function isCargoManifest(rel: string): boolean {
  return baseName(rel) === 'Cargo.toml';
}

/** The production dependency tables of a manifest or of one `[target.<cfg>]` table. */
const PROD_TABLES = ['dependencies'];
/** Development-only tables; `dev_dependencies` and `build_dependencies` are the older spellings Cargo still reads. */
const DEV_TABLES = ['dev-dependencies', 'dev_dependencies', 'build-dependencies', 'build_dependencies'];

// ---- where each key is written ---------------------------------------------------------------

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
 * The longest path `CargoLines.line` is asked for: `[target, <cfg>, dependencies, <crate>]`. A longer path is
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
 * The line of every table header and every key in one Cargo.toml, by its full path, from one pass.
 * `[dependencies.tokio]` records `dependencies.tokio`; `serde.workspace = true` under `[dependencies]`
 * records `dependencies.serde` and `dependencies.serde.workspace`. The first line wins. A path longer than
 * MAX_LOOKUP is not recorded, and the lines inside a multi-line array are values, never headers or keys.
 */
class CargoLines {
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

// ---- versions from Cargo.lock ----------------------------------------------------------------

interface Candidate {
  version: string;
  source?: string;
}

type Triple = [number, number, number];

interface Parsed {
  v: Triple;
  pre?: string;
}

function parseVersion(s: string): Parsed | undefined {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(s.trim());
  if (!m) return undefined;
  return { v: [Number(m[1]), Number(m[2]), Number(m[3])], ...(m[4] ? { pre: m[4] } : {}) };
}

function cmpTriple(a: Triple, b: Triple): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

/** SemVer precedence: a release is above its pre-releases; identifiers compare numerically, then as text. */
function cmpVersion(a: Parsed, b: Parsed): number {
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
function parseRequirement(req: string): Range | undefined {
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

function admits(range: Range, c: Parsed): boolean {
  // As in Cargo, a pre-release is admitted only by a requirement that names a pre-release of the same version.
  if (c.pre !== undefined && (range.lower.pre === undefined || cmpTriple(range.lower.v, c.v) !== 0)) return false;
  if (range.upper === undefined) return cmpVersion(c, range.lower) === 0;
  return cmpVersion(c, range.lower) >= 0 && cmpTriple(c.v, range.upper) < 0;
}

/**
 * The locked version of one dependency. One candidate is the answer; a git entry takes the git
 * candidate; otherwise the highest registry candidate the requirement admits, and none when the
 * requirement is not a plain caret, tilde or exact form.
 */
function pickVersion(cands: Candidate[], req: string | undefined, git: boolean): string | undefined {
  if (git) {
    const g = cands.filter((c) => c.source?.startsWith('git+'));
    return g.length === 1 ? (g[0] as Candidate).version : undefined;
  }
  if (cands.length === 1) return (cands[0] as Candidate).version;
  if (cands.length === 0 || req === undefined) return undefined;
  const range = parseRequirement(req);
  if (!range) return undefined;
  let best: { c: Candidate; p: Parsed } | undefined;
  for (const c of cands) {
    if (c.source?.startsWith('git+')) continue;
    const p = parseVersion(c.version);
    if (!p || !admits(range, p)) continue;
    if (!best || cmpVersion(p, best.p) > 0) best = { c, p };
  }
  return best?.c.version;
}

class CargoLocks {
  private readonly parsed = new Map<string, Map<string, Candidate[]> | null>();
  private readonly lockOfDir = new Map<string, string | null>();

  constructor(
    private readonly root: string,
    private readonly notices: string[],
  ) {}

  /** The Cargo.lock in `dir` or its nearest ancestor that has one. */
  private lockFor(dir: string): string | undefined {
    const hit = this.lockOfDir.get(dir);
    if (hit !== undefined) return hit ?? undefined;
    let found: string | null = null;
    for (const d of ancestorDirs(dir)) {
      const rel = joinRel(d, 'Cargo.lock');
      if (fileExists(this.root, rel)) {
        found = rel;
        break;
      }
    }
    this.lockOfDir.set(dir, found);
    return found ?? undefined;
  }

  private load(rel: string): Map<string, Candidate[]> | null {
    const hit = this.parsed.get(rel);
    if (hit !== undefined) return hit;
    let out: Map<string, Candidate[]> | null = null;
    const text = readText(this.root, rel);
    if (text === undefined) {
      this.notices.push(`${rel}: could not be read; versions from it are unavailable`);
    } else {
      try {
        const data = parseToml(text);
        out = new Map();
        const pkgs = Array.isArray(data['package']) ? data['package'] : [];
        for (const p of pkgs) {
          if (!isTable(p) || typeof p['name'] !== 'string' || typeof p['version'] !== 'string') continue;
          const c: Candidate = { version: p['version'], ...(typeof p['source'] === 'string' ? { source: p['source'] } : {}) };
          const list = out.get(p['name']);
          if (list) list.push(c);
          else out.set(p['name'], [c]);
        }
      } catch (e) {
        this.notices.push(`${rel}: did not parse (${describeParseError(e, 'TOML', text)}); versions from it are unavailable`);
      }
    }
    this.parsed.set(rel, out);
    return out;
  }

  resolve(manifestRel: string, name: string, req: string | undefined, git: boolean): string | undefined {
    const lock = this.lockFor(dirOf(manifestRel));
    if (lock === undefined) return undefined;
    const cands = this.load(lock)?.get(name);
    return cands ? pickVersion(cands, req, git) : undefined;
  }
}

// ---- manifests -------------------------------------------------------------------------------

/** What one dependency entry asks for, after any `workspace = true` is replaced by the workspace's own spec. */
interface Spec {
  name: string;
  req?: string;
  git: boolean;
}

class Manifests {
  private readonly parsed = new Map<string, { data: Table; text: string } | null>();
  private readonly workspaceOfDir = new Map<string, Table | null>();

  constructor(
    private readonly root: string,
    private readonly notices: string[],
  ) {}

  /** A parsed Cargo.toml and its text, or null (with one notice) when it cannot be read or does not parse. */
  load(rel: string): { data: Table; text: string } | null {
    const hit = this.parsed.get(rel);
    if (hit !== undefined) return hit;
    let out: { data: Table; text: string } | null = null;
    const text = readText(this.root, rel);
    if (text === undefined) {
      if (fileExists(this.root, rel)) this.notices.push(`${rel}: could not be read; skipped`);
    } else {
      try {
        out = { data: parseToml(text) as Table, text };
      } catch (e) {
        this.notices.push(`${rel}: did not parse (${describeParseError(e, 'TOML', text)}); skipped`);
      }
    }
    this.parsed.set(rel, out);
    return out;
  }

  /** `[workspace.dependencies]` of the nearest Cargo.toml at or above `dir` that has a `[workspace]` table. */
  workspaceDeps(dir: string): Table | undefined {
    const hit = this.workspaceOfDir.get(dir);
    if (hit !== undefined) return hit ?? undefined;
    let found: Table | null = null;
    for (const d of ancestorDirs(dir)) {
      const rel = joinRel(d, 'Cargo.toml');
      if (!fileExists(this.root, rel)) continue;
      const ws = this.load(rel)?.data['workspace'];
      if (!isTable(ws)) continue;
      found = isTable(ws['dependencies']) ? ws['dependencies'] : {};
      break;
    }
    this.workspaceOfDir.set(dir, found);
    return found ?? undefined;
  }

  /**
   * The spec of one entry, or undefined for a path entry (the workspace's own crate) and for a value
   * that is not a dependency. A renamed entry is named by its `package`.
   */
  spec(manifestRel: string, key: string, value: unknown): Spec | undefined {
    let body: unknown = value;
    if (isTable(value) && value['workspace'] === true) {
      body = this.workspaceDeps(dirOf(manifestRel))?.[key];
      if (body === undefined) body = {};
    }
    if (typeof body === 'string') return { name: key, req: body, git: false };
    if (!isTable(body)) return undefined;
    if (typeof body['path'] === 'string') return undefined;
    const name = typeof body['package'] === 'string' ? body['package'] : key;
    const req = typeof body['version'] === 'string' ? body['version'] : undefined;
    return { name, ...(req !== undefined ? { req } : {}), git: typeof body['git'] === 'string' };
  }
}

/**
 * Read the direct dependencies of every `Cargo.toml` in the file list. `[dependencies]` and each
 * `[target.<cfg>.dependencies]` give rows; dev and build dependencies, in every target form, are
 * counted as development; `[patch]` and `[replace]` are ignored; a path entry is the workspace's own
 * crate and is neither. Versions come from the nearest `Cargo.lock` at or above the manifest.
 */
export function readCargo(root: string, files: string[]): ReaderResult {
  const deps: Dependency[] = [];
  const notices: string[] = [];
  let devSkipped = 0;
  const manifests = new Manifests(root, notices);
  const locks = new CargoLocks(root, notices);

  for (const rel of files) {
    if (!isCargoManifest(rel)) continue;
    const loaded = manifests.load(rel);
    if (loaded === null) continue;
    const data = loaded.data;
    const lines = new CargoLines(loaded.text);
    const seen = new Set<string>();

    const prod = (table: unknown, path: string[]): void => {
      if (!isTable(table)) return;
      for (const [key, value] of Object.entries(table)) {
        const spec = manifests.spec(rel, key, value);
        if (spec === undefined) continue;
        const version = locks.resolve(rel, spec.name, spec.req, spec.git);
        // One row per crate and version: a crate listed again under a target is the same dependency, while a
        // second version of it under another key (`rand07 = { package = "rand", ... }`) is its own row.
        const id = `${spec.name.toLowerCase()}@${version ?? spec.req ?? ''}`;
        if (seen.has(id)) continue;
        seen.add(id);
        deps.push({ ecosystem: 'cargo', name: spec.name, ...(version !== undefined ? { version } : {}), manifest: `${rel}:${lines.line([...path, key])}` });
      }
    };
    const dev = (table: unknown): void => {
      if (!isTable(table)) return;
      for (const [key, value] of Object.entries(table)) if (manifests.spec(rel, key, value) !== undefined) devSkipped++;
    };

    for (const t of PROD_TABLES) prod(data[t], [t]);
    for (const t of DEV_TABLES) dev(data[t]);
    const targets = isTable(data['target']) ? data['target'] : {};
    for (const [cfg, body] of Object.entries(targets)) {
      if (!isTable(body)) continue;
      for (const t of PROD_TABLES) prod(body[t], ['target', cfg, t]);
      for (const t of DEV_TABLES) dev(body[t]);
    }
  }

  const unresolved = deps.filter((d) => d.version === undefined).length;
  if (unresolved > 0) {
    notices.push(
      `${unresolved} Cargo ${unresolved === 1 ? 'dependency has' : 'dependencies have'} no resolved version (no Cargo.lock, or a requirement lexcode could not match to one locked version); recorded without a version`,
    );
  }
  return { deps, devSkipped, notices };
}
