import { parse as parseYaml } from 'yaml';
import type { Dependency } from '../types.js';
import {
  ancestorDirs,
  baseName,
  dirOf,
  describeParseError,
  fileExists,
  joinRel,
  LineIndex,
  readText,
  type ReaderResult,
} from './util.js';

type Json = Record<string, unknown>;

function isObj(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function own(o: Json, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(o, key) ? o[key] : undefined;
}

/** Resolves a direct dependency of the manifest in `relDir` (relative to the lockfile's directory). */
interface Resolver {
  resolve(name: string, range: string, relDir: string): string | undefined;
}

const LOCKFILES = ['package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock'] as const;

function npmLockResolver(data: Json): Resolver {
  const packages = isObj(data['packages']) ? data['packages'] : undefined;
  const legacy = isObj(data['dependencies']) ? data['dependencies'] : undefined;
  return {
    resolve(name, _range, relDir) {
      if (packages) {
        for (const a of ancestorDirs(relDir)) {
          const entry = own(packages, joinRel(a, `node_modules/${name}`));
          if (!isObj(entry)) continue;
          if (typeof entry['version'] === 'string') return entry['version'];
          if (entry['link'] === true && typeof entry['resolved'] === 'string') {
            const target = own(packages, entry['resolved']);
            if (isObj(target) && typeof target['version'] === 'string') return target['version'];
          }
        }
      }
      if (legacy) {
        const entry = own(legacy, name);
        if (isObj(entry) && typeof entry['version'] === 'string') return entry['version'];
      }
      return undefined;
    },
  };
}

function cleanPnpmVersion(v: unknown): string | undefined {
  if (typeof v !== 'string' && typeof v !== 'number') return undefined;
  const s = String(v);
  if (/^(link|file|workspace|portal|git|https?):/.test(s)) return undefined;
  const cut = s.search(/[(_]/);
  const out = (cut < 0 ? s : s.slice(0, cut)).trim();
  return out || undefined;
}

function pnpmResolver(data: Json): Resolver {
  const importers = isObj(data['importers']) ? data['importers'] : undefined;
  return {
    resolve(name, _range, relDir) {
      let section: Json | undefined;
      if (importers) {
        const imp = own(importers, relDir === '' ? '.' : relDir);
        if (isObj(imp)) section = imp;
      } else if (relDir === '') {
        section = data; // lockfile v5 and earlier keep the single project at the top level
      }
      if (!section) return undefined;
      for (const key of ['dependencies', 'optionalDependencies', 'devDependencies']) {
        const group = section[key];
        if (!isObj(group)) continue;
        const entry = own(group, name);
        if (entry === undefined) continue;
        return cleanPnpmVersion(isObj(entry) ? entry['version'] : entry);
      }
      return undefined;
    },
  };
}

function stripQuotes(s: string): string {
  const t = s.trim();
  return t.length >= 2 && t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1) : t;
}

function yarnV1Resolver(text: string): Resolver {
  const map = new Map<string, string>();
  let keys: string[] = [];
  for (const line of text.split('\n')) {
    if (line.startsWith('#') || line.trim() === '') continue;
    if (!line.startsWith(' ') && line.trimEnd().endsWith(':')) {
      keys = line.trimEnd().slice(0, -1).split(',').map(stripQuotes);
      continue;
    }
    const m = /^ {2}version:?\s+"?([^"\s]+)"?\s*$/.exec(line);
    if (m && keys.length) {
      for (const k of keys) map.set(k, m[1] as string);
      keys = [];
    }
  }
  return { resolve: (name, range) => map.get(`${name}@${range}`) };
}

function yarnBerryResolver(data: Json): Resolver {
  const map = new Map<string, string>();
  for (const [k, v] of Object.entries(data)) {
    if (k === '__metadata' || !isObj(v) || v['version'] === undefined) continue;
    for (const part of k.split(',')) map.set(part.trim(), String(v['version']));
  }
  return {
    resolve: (name, range) => map.get(`${name}@npm:${range}`) ?? map.get(`${name}@${range}`),
  };
}

/** Loads and caches lockfiles; a lockfile that fails to parse is reported once and then ignored. */
class LockCache {
  private cache = new Map<string, Resolver | null>();
  constructor(
    private root: string,
    private notices: string[],
  ) {}

  private load(rel: string): Resolver | null {
    const hit = this.cache.get(rel);
    if (hit !== undefined) return hit;
    let res: Resolver | null = null;
    const text = readText(this.root, rel);
    if (text === undefined) {
      this.notices.push(`${rel}: could not be read; versions from it are unavailable`);
    } else {
      try {
        const name = baseName(rel);
        if (name === 'pnpm-lock.yaml') {
          const d: unknown = parseYaml(text);
          res = pnpmResolver(isObj(d) ? d : {});
        } else if (name === 'yarn.lock') {
          if (/^__metadata:/m.test(text)) {
            const d: unknown = parseYaml(text);
            res = yarnBerryResolver(isObj(d) ? d : {});
          } else res = yarnV1Resolver(text);
        } else {
          const d: unknown = JSON.parse(text);
          res = npmLockResolver(isObj(d) ? d : {});
        }
      } catch (e) {
        const kind = baseName(rel) === 'pnpm-lock.yaml' || baseName(rel) === 'yarn.lock' ? 'YAML' : 'JSON';
        this.notices.push(`${rel}: did not parse (${describeParseError(e, kind, text)}); versions from it are unavailable`);
      }
    }
    this.cache.set(rel, res);
    return res;
  }

  /** Version of `name` for the manifest in `manifestDir`, from the nearest directory that holds a lockfile. */
  resolve(manifestDir: string, name: string, range: string): string | undefined {
    for (const dir of ancestorDirs(manifestDir)) {
      const found = LOCKFILES.map((f) => joinRel(dir, f)).filter((p) => fileExists(this.root, p));
      if (found.length === 0) continue;
      const relDir = dir === '' ? manifestDir : manifestDir.slice(dir.length + 1);
      for (const lock of found) {
        const v = this.load(lock)?.resolve(name, range, relDir);
        if (v) return v;
      }
      return undefined;
    }
    return undefined;
  }
}

/**
 * Where `"key"` is written inside the object value of `"section"`, answered from one pass over the
 * text per section. The block of a section runs to the first `}` after its `{`; when the section name
 * appears more than once, the first block that holds the key wins. A key that cannot be located is
 * line 1.
 */
class KeyLocator {
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

const DIRECT_SECTIONS = ['dependencies', 'optionalDependencies', 'peerDependencies'] as const;

/**
 * Read the direct dependencies of every `package.json` in the file list, with the versions
 * their lockfile resolves. `devDependencies` are counted, not returned.
 */
export function readNpm(root: string, files: string[]): ReaderResult {
  const deps: Dependency[] = [];
  const notices: string[] = [];
  let devSkipped = 0;
  const locks = new LockCache(root, notices);

  for (const rel of files) {
    if (baseName(rel) !== 'package.json') continue;
    const text = readText(root, rel);
    if (text === undefined) {
      notices.push(`${rel}: could not be read; skipped`);
      continue;
    }
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch (e) {
      notices.push(`${rel}: did not parse (${describeParseError(e, 'JSON', text)}); skipped`);
      continue;
    }
    if (!isObj(data)) {
      notices.push(`${rel}: is not a JSON object; skipped`);
      continue;
    }
    const dir = dirOf(rel);
    const where = new KeyLocator(text);
    const seen = new Map<string, { section: string; range: string }>();
    for (const section of DIRECT_SECTIONS) {
      const group = data[section];
      if (!isObj(group)) continue;
      for (const [name, range] of Object.entries(group)) {
        if (!seen.has(name)) seen.set(name, { section, range: typeof range === 'string' ? range : '' });
      }
    }
    const dev = data['devDependencies'];
    if (isObj(dev)) for (const name of Object.keys(dev)) if (!seen.has(name)) devSkipped++;

    for (const [name, { section, range }] of seen) {
      const version = locks.resolve(dir, name, range);
      deps.push({
        ecosystem: 'npm',
        name,
        ...(version ? { version } : {}),
        manifest: `${rel}:${where.line(section, name)}`,
      });
    }
  }
  return { deps, devSkipped, notices };
}
