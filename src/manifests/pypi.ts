import { parse as parseToml } from 'smol-toml';
import type { Dependency } from '../types.js';
import { normalizePypiName } from './purl.js';
import {
  ancestorDirs,
  baseName,
  dirOf,
  describeParseError,
  fileExists,
  joinRel,
  readText,
  resolveInside,
  type ReaderResult,
} from './util.js';

type Table = Record<string, unknown>;

function isTable(v: unknown): v is Table {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Group and file names that mark development-only requirements. */
const DEV_TOKENS = new Set(['dev', 'develop', 'development', 'test', 'tests', 'testing', 'lint', 'linting', 'docs', 'doc', 'ci', 'qa', 'typing']);

function isDevName(name: string): boolean {
  return name
    .toLowerCase()
    .split(/[-_.]+/)
    .some((t) => DEV_TOKENS.has(t));
}

export function isRequirementsFile(rel: string): boolean {
  const base = baseName(rel).toLowerCase();
  if (/^requirements.*\.txt$/.test(base)) return true;
  const parent = baseName(dirOf(rel)).toLowerCase();
  return (parent === 'requirements' || parent === 'reqs') && base.endsWith('.txt');
}

interface Req {
  name: string;
  version?: string;
}

const NAME_RE = /^([A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?)\s*(?:\[[^\]]*\])?\s*(.*)$/;
const PACKAGE_FILE_RE = /\.(whl|zip|tar\.gz|tgz|tar|egg)$/i;

/** A pinned `==` (or `===`) version from a specifier list; ranges and wildcards give none. */
function pinFromSpecifiers(spec: string): string | undefined {
  for (const clause of spec.replace(/[()]/g, '').split(',')) {
    const m = /^\s*===?\s*([^\s*;]+)\s*$/.exec(clause);
    if (m) return m[1];
  }
  return undefined;
}

/** Parse a PEP 508 requirement. Returns undefined for a line that names no package (URL, path, option). */
function parseRequirement(raw: string): Req | undefined {
  let s = raw.trim();
  const opt = s.search(/\s--?[A-Za-z]/);
  if (opt >= 0) s = s.slice(0, opt).trim();
  const semi = s.indexOf(';');
  if (semi >= 0) s = s.slice(0, semi).trim();
  const m = NAME_RE.exec(s);
  if (!m || !m[1]) return undefined;
  const name = m[1];
  const rest = (m[2] ?? '').trim();
  if (PACKAGE_FILE_RE.test(name)) return undefined;
  if (rest === '') return { name: normalizePypiName(name) };
  if (rest.startsWith('@')) return { name: normalizePypiName(name) }; // name @ url: named, version unknown
  if (!/^[=!<>~(]/.test(rest)) return undefined; // git+https://..., ://..., stray text
  const version = pinFromSpecifiers(rest);
  return { name: normalizePypiName(name), ...(version ? { version } : {}) };
}

/** A Poetry constraint is a version only when it is a bare or `==` exact version. */
function poetryPin(spec: string): string | undefined {
  const m = /^\s*=?=?\s*(\d[A-Za-z0-9.+!_-]*)\s*$/.exec(spec);
  return m && !m[1]?.includes('*') ? m[1] : undefined;
}

interface Found extends Req {
  manifest: string;
}

class Lockfiles {
  private cache = new Map<string, Map<string, string | null> | null>();
  constructor(
    private root: string,
    private notices: string[],
  ) {}

  private load(rel: string): Map<string, string | null> | null {
    const hit = this.cache.get(rel);
    if (hit !== undefined) return hit;
    let out: Map<string, string | null> | null = null;
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
          const key = normalizePypiName(p['name']);
          const prev = out.get(key);
          // Two different versions of one name (resolution forks) leave the purl without a version.
          out.set(key, prev === undefined || prev === p['version'] ? p['version'] : null);
        }
      } catch (e) {
        this.notices.push(`${rel}: did not parse (${describeParseError(e, 'TOML', text)}); versions from it are unavailable`);
      }
    }
    this.cache.set(rel, out);
    return out;
  }

  resolve(manifestRel: string, name: string): string | undefined {
    for (const dir of ancestorDirs(dirOf(manifestRel))) {
      const found = ['uv.lock', 'poetry.lock'].map((f) => joinRel(dir, f)).filter((p) => fileExists(this.root, p));
      if (found.length === 0) continue;
      for (const lock of found) {
        const v = this.load(lock)?.get(name);
        if (v) return v;
      }
      return undefined;
    }
    return undefined;
  }
}

/** Requirements files, followed through `-r` and `-c`, read once each. */
class RequirementsReader {
  visited = new Set<string>();
  visitedConstraints = new Set<string>();

  constructor(
    private root: string,
    private notices: string[],
  ) {}

  /** Read one top-level file. Returns the requirements found (empty for a dev file) and the version pins from `-c`. */
  read(rel: string): { found: Found[]; devCount: number; constraints: Map<string, string> } {
    const found: Found[] = [];
    const constraints = new Map<string, string>();
    let devCount = 0;
    this.visited.add(rel);
    const walk = (file: string, dev: boolean, asConstraint: boolean): void => {
      const text = readText(this.root, file);
      if (text === undefined) {
        this.notices.push(`${file}: could not be read; skipped`);
        return;
      }
      const seen = new Map<string, Found>();
      let pending = '';
      let pendingLine = 0;
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const stripped = (lines[i] as string).replace(/\r$/, '').replace(/(^|\s)#.*$/, '');
        if (pending === '') pendingLine = i + 1;
        if (stripped.trimEnd().endsWith('\\')) {
          pending += stripped.trimEnd().slice(0, -1) + ' ';
          continue;
        }
        const logical = (pending + stripped).trim();
        pending = '';
        if (logical === '') continue;
        const inc = /^(-r|--requirement|-c|--constraint)(?:=|\s)\s*(\S.*)$/.exec(logical) ?? /^(-r|-c)(\S.*)$/.exec(logical);
        if (inc) {
          const target = (inc[2] as string).trim();
          const isConstraint = asConstraint || inc[1] === '-c' || inc[1] === '--constraint';
          if (target.includes('://')) continue;
          const resolved = resolveInside(dirOf(file), target);
          if (resolved === undefined) {
            this.notices.push(`${file}:${pendingLine}: include "${target}" leaves the scan root; skipped`);
            continue;
          }
          const visited = isConstraint ? this.visitedConstraints : this.visited;
          if (visited.has(resolved)) continue;
          visited.add(resolved);
          walk(resolved, dev || isDevName(baseName(resolved)), isConstraint);
          continue;
        }
        if (logical.startsWith('-')) continue; // -e, --editable, --index-url, -f ...
        const req = parseRequirement(logical);
        if (!req) continue;
        if (asConstraint) {
          if (req.version) constraints.set(req.name, req.version);
          continue;
        }
        if (dev) {
          if (!seen.has(req.name)) devCount++;
          seen.set(req.name, { ...req, manifest: `${file}:${pendingLine}` });
          continue;
        }
        const prior = seen.get(req.name);
        if (prior) {
          if (!prior.version && req.version) prior.version = req.version;
          continue;
        }
        const f: Found = { ...req, manifest: `${file}:${pendingLine}` };
        seen.set(req.name, f);
        found.push(f);
      }
    };
    walk(rel, isDevName(baseName(rel)), false);
    return { found, devCount, constraints };
  }
}

/**
 * Line lookups for one pyproject.toml, answered from tables built in one pass. Looking each
 * dependency up by scanning the lines (a regex per table header, a scan from the table's header to the
 * key) made a manifest with thousands of dependencies quadratic.
 */
class TomlLines {
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

function readPyproject(rel: string, text: string): { found: Found[]; devCount: number } {
  const data = parseToml(text);
  const toml = new TomlLines(text.split('\n'));
  const found: Found[] = [];
  let devCount = 0;
  const seen = new Set<string>();
  const add = (req: Req, lineIdx: number, fallbackIdx: number): void => {
    if (seen.has(req.name)) return;
    seen.add(req.name);
    const idx = lineIdx >= 0 ? lineIdx : fallbackIdx >= 0 ? fallbackIdx : 0;
    found.push({ ...req, manifest: `${rel}:${idx + 1}` });
  };

  const project = isTable(data['project']) ? data['project'] : undefined;
  if (project) {
    const projHeader = toml.headerLine('project');
    const deps = Array.isArray(project['dependencies']) ? project['dependencies'] : [];
    const depsKey = toml.keyLine(projHeader + 1, 'dependencies');
    let cursor = depsKey;
    for (const spec of deps) {
      if (typeof spec !== 'string') continue;
      const req = parseRequirement(spec);
      if (!req) continue;
      const at = toml.stringLine(cursor, spec);
      if (at >= 0) cursor = at;
      add(req, at, depsKey);
    }
    const optional = isTable(project['optional-dependencies']) ? project['optional-dependencies'] : {};
    const optHeader = toml.headerLine('project.optional-dependencies');
    for (const [group, specs] of Object.entries(optional)) {
      if (!Array.isArray(specs)) continue;
      if (isDevName(group)) {
        devCount += specs.filter((s) => typeof s === 'string' && parseRequirement(s)).length;
        continue;
      }
      const groupKey = toml.keyLine(optHeader + 1, group);
      let c = groupKey;
      for (const spec of specs) {
        if (typeof spec !== 'string') continue;
        const req = parseRequirement(spec);
        if (!req) continue;
        const at = toml.stringLine(c, spec);
        if (at >= 0) c = at;
        add(req, at, groupKey);
      }
    }
  }

  // PEP 735 groups and uv's dev list are development-only by construction.
  const groups = isTable(data['dependency-groups']) ? data['dependency-groups'] : {};
  for (const specs of Object.values(groups)) {
    if (Array.isArray(specs)) devCount += specs.filter((s) => typeof s === 'string' && parseRequirement(s)).length;
  }
  const tool = isTable(data['tool']) ? data['tool'] : {};
  const uv = isTable(tool['uv']) ? tool['uv'] : undefined;
  if (uv && Array.isArray(uv['dev-dependencies'])) {
    devCount += uv['dev-dependencies'].filter((s) => typeof s === 'string' && parseRequirement(s)).length;
  }

  const poetry = isTable(tool['poetry']) ? tool['poetry'] : undefined;
  if (poetry) {
    const readTable = (table: unknown, header: string): void => {
      if (!isTable(table)) return;
      const hdr = toml.headerLine(header);
      for (const [key, spec] of Object.entries(table)) {
        if (key.toLowerCase() === 'python') continue;
        let constraint: string | undefined;
        if (typeof spec === 'string') constraint = spec;
        else if (isTable(spec) && typeof spec['version'] === 'string') constraint = spec['version'];
        else if (Array.isArray(spec)) {
          const first = spec.find((e) => isTable(e) && typeof e['version'] === 'string');
          if (isTable(first)) constraint = first['version'] as string;
        }
        const pin = constraint === undefined ? undefined : poetryPin(constraint);
        const sub = toml.headerLine(`${header}.${key}`);
        add(
          { name: normalizePypiName(key), ...(pin ? { version: pin } : {}) },
          toml.keyLine(hdr + 1, key),
          sub >= 0 ? sub : hdr,
        );
      }
    };
    readTable(poetry['dependencies'], 'tool.poetry.dependencies');
    const pgroups = isTable(poetry['group']) ? poetry['group'] : {};
    for (const [g, body] of Object.entries(pgroups)) {
      const deps = isTable(body) ? body['dependencies'] : undefined;
      if (g === 'main') readTable(deps, `tool.poetry.group.${g}.dependencies`);
      else if (isTable(deps)) devCount += Object.keys(deps).filter((k) => k.toLowerCase() !== 'python').length;
    }
    const legacyDev = poetry['dev-dependencies'];
    if (isTable(legacyDev)) devCount += Object.keys(legacyDev).length;
  }
  return { found, devCount };
}

/**
 * Read the direct dependencies of `requirements*.txt` and `pyproject.toml` files in the file list.
 * An explicit `==` pin wins; otherwise a `-c` constraint, then `uv.lock` or `poetry.lock` beside
 * the manifest or in the nearest ancestor directory.
 */
export function readPypi(root: string, files: string[]): ReaderResult {
  const deps: Dependency[] = [];
  const notices: string[] = [];
  let devSkipped = 0;
  const locks = new Lockfiles(root, notices);
  const reqs = new RequirementsReader(root, notices);

  const emit = (f: Found, constraints?: Map<string, string>): void => {
    const version = f.version ?? constraints?.get(f.name) ?? locks.resolve(f.manifest.slice(0, f.manifest.lastIndexOf(':')), f.name);
    deps.push({ ecosystem: 'pypi', name: f.name, ...(version ? { version } : {}), manifest: f.manifest });
  };

  for (const rel of files) {
    const base = baseName(rel);
    if (base === 'pyproject.toml') {
      const text = readText(root, rel);
      if (text === undefined) {
        notices.push(`${rel}: could not be read; skipped`);
        continue;
      }
      try {
        const r = readPyproject(rel, text);
        devSkipped += r.devCount;
        for (const f of r.found) emit(f);
      } catch (e) {
        notices.push(`${rel}: did not parse (${describeParseError(e, 'TOML', text)}); skipped`);
      }
    } else if (isRequirementsFile(rel)) {
      if (reqs.visited.has(rel)) continue;
      const r = reqs.read(rel);
      devSkipped += r.devCount;
      for (const f of r.found) emit(f, r.constraints);
    }
  }
  return { deps, devSkipped, notices };
}
