import { parse as parseToml } from 'smol-toml';
import type { Dependency } from '../types.js';
import { admits, cmpVersion, parseRequirement, parseVersion, type Parsed } from './cargo-version.js';
import { TomlKeyLines } from './toml-lines.js';
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

// ---- versions from Cargo.lock ----------------------------------------------------------------

interface Candidate {
  /** The crate's name as the lock writes it, which is its name on the registry. */
  name: string;
  version: string;
  source?: string;
}

/** Cargo takes `feed_rs` for the crate `feed-rs`: a crate name compared as Cargo looks it up. */
export function crateKey(name: string): string {
  return name.toLowerCase().replace(/_/g, '-');
}

/**
 * The locked version of one dependency. One candidate is the answer; a git entry takes the git
 * candidate; otherwise the highest registry candidate the requirement admits, and none when the
 * requirement is not a plain caret, tilde or exact form.
 */
function pickVersion(cands: Candidate[], req: string | undefined, git: boolean): Candidate | undefined {
  if (git) {
    const g = cands.filter((c) => c.source?.startsWith('git+'));
    return g.length === 1 ? g[0] : undefined;
  }
  if (cands.length === 1) return cands[0];
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
  return best?.c;
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
          const c: Candidate = { name: p['name'], version: p['version'], ...(typeof p['source'] === 'string' ? { source: p['source'] } : {}) };
          const key = crateKey(p['name']);
          const list = out.get(key);
          if (list) list.push(c);
          else out.set(key, [c]);
        }
      } catch (e) {
        this.notices.push(`${rel}: did not parse (${describeParseError(e, 'TOML', text)}); versions from it are unavailable`);
      }
    }
    this.parsed.set(rel, out);
    return out;
  }

  /** The locked entry of one dependency: its version and its name as the lock writes it. */
  resolve(manifestRel: string, name: string, req: string | undefined, git: boolean): Candidate | undefined {
    const lock = this.lockFor(dirOf(manifestRel));
    if (lock === undefined) return undefined;
    const cands = this.load(lock)?.get(crateKey(name));
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
    const lines = new TomlKeyLines(loaded.text);
    const seen = new Set<string>();

    const prod = (table: unknown, path: string[]): void => {
      if (!isTable(table)) return;
      for (const [key, value] of Object.entries(table)) {
        const spec = manifests.spec(rel, key, value);
        if (spec === undefined) continue;
        const locked = locks.resolve(rel, spec.name, spec.req, spec.git);
        const version = locked?.version;
        // The row is named as the lock names the crate, so `feed_rs = "2"` is the row `feed-rs`.
        const name = locked?.name ?? spec.name;
        // One row per crate and version: a crate listed again under a target is the same dependency, while a
        // second version of it under another key (`rand07 = { package = "rand", ... }`) is its own row.
        const id = `${crateKey(name)}@${version ?? spec.req ?? ''}`;
        if (seen.has(id)) continue;
        seen.add(id);
        deps.push({ ecosystem: 'cargo', name, ...(version !== undefined ? { version } : {}), manifest: `${rel}:${lines.line([...path, key])}` });
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
