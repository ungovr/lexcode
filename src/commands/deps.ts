import { resolve } from 'node:path';
import { loadSidecar } from '../config/sidecar.js';
import { matchComponents } from '../components/match.js';
import { readGo } from '../manifests/go.js';
import { readNpm } from '../manifests/npm.js';
import { normalizePypiName } from '../manifests/purl.js';
import { readPypi } from '../manifests/pypi.js';
import { readGradle } from '../manifests/gradle.js';
import { readComposer } from '../manifests/composer.js';
import { readNuget } from '../manifests/nuget.js';
import { readMaven } from '../manifests/maven.js';
import { readRuby } from '../manifests/ruby.js';
import { classOf, loadRuleSet } from '../rules/load.js';
import { listFiles } from '../scope/files.js';
import type { Dependency, RuleSet, ScopeSpec } from '../types.js';
import { USAGE } from '../usage.js';
import { defaultIo, flag, parseFlags, strList, type Io } from './args.js';
import { fromCwd } from './fsutil.js';
import { readAppScope } from './scan.js';

/**
 * One package across the repositories read: what the component map says it enables (empty when the
 * map has no entry for it), the repositories it appears in, and each manifest line that names it.
 * The map grows by hand (#12745); a package many repositories use and the map does not know is the
 * first candidate for an entry, written from the vendor's own description.
 */
export interface DepRow {
  ecosystem: Dependency['ecosystem'];
  name: string;
  enables: string[];
  repositories: string[];
  manifests: string[];
}

function key(d: Dependency): string {
  return `${d.ecosystem}:${d.ecosystem === 'pypi' ? normalizePypiName(d.name) : d.name.toLowerCase()}`;
}

function union(...lists: string[][]): string[] {
  return [...new Set(lists.flat())];
}

/** The production dependencies of each repository, read the way `scan` reads them (same scope, dev dependencies skipped). */
export function collectDeps(roots: string[], rs: RuleSet): DepRow[] {
  const rows = new Map<string, DepRow>();
  for (const label of roots) {
    const root = resolve(label);
    const sidecar = loadSidecar(root);
    const app = readAppScope(root);
    const spec: ScopeSpec = {
      include: union(app?.include ?? [], sidecar?.include ?? []),
      exclude: union(app?.exclude ?? [], sidecar?.exclude ?? []),
      includeTests: false,
    };
    const files = listFiles(root, spec).files;
    const deps = [readNpm(root, files), readPypi(root, files), readGo(root, files), readRuby(root, files), readMaven(root, files), readGradle(root, files), readComposer(root, files), readNuget(root, files)].flatMap((r) => r.deps);
    for (const dep of deps) {
      const k = key(dep);
      let row = rows.get(k);
      if (row === undefined) {
        const hit = matchComponents([dep], [], rs.components).components[0];
        const enables = (hit?.enables ?? []).filter((id) => classOf(id, rs) !== 'declaration-only');
        row = { ecosystem: dep.ecosystem, name: dep.name, enables, repositories: [], manifests: [] };
        rows.set(k, row);
      }
      if (!row.repositories.includes(label)) row.repositories.push(label);
      row.manifests.push(`${label}:${dep.manifest}`);
    }
  }
  return [...rows.values()].sort(
    (a, b) =>
      b.repositories.length - a.repositories.length ||
      (a.ecosystem < b.ecosystem ? -1 : a.ecosystem > b.ecosystem ? 1 : 0) ||
      (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
  );
}

const DEPS_OPTIONS = {
  unmapped: { type: 'boolean' },
  json: { type: 'boolean' },
  rules: { type: 'string', multiple: true },
} as const;

function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
}

export async function runDepsCommand(argv: string[], io: Io = defaultIo(), opts: { rs?: RuleSet } = {}): Promise<number> {
  const p = parseFlags(argv, DEPS_OPTIONS, { min: 0, max: Number.POSITIVE_INFINITY, what: 'repository paths' });
  if (flag(p, 'help')) {
    io.stdout(USAGE);
    return 0;
  }
  const roots = p.positionals.length > 0 ? p.positionals : ['.'];
  const rs = opts.rs ?? loadRuleSet(strList(p, 'rules').map(fromCwd));
  const all = collectDeps(roots, rs);
  const unmappedCount = all.filter((r) => r.enables.length === 0).length;
  const rows = flag(p, 'unmapped') ? all.filter((r) => r.enables.length === 0) : all;

  if (flag(p, 'json')) {
    io.stdout(`${JSON.stringify(rows, null, 2)}\n`);
    return 0;
  }
  io.stdout(
    `lexcode deps: ${plural(all.length, 'package', 'packages')} in ${plural(roots.length, 'repository', 'repositories')}; ` +
      `${unmappedCount.toLocaleString('en-US')} with no activity in the component map\n`,
  );
  const width = Math.max(7, ...rows.map((r) => r.name.length));
  io.stdout(`${'repos'.padStart(5)}  ${'ecosystem'.padEnd(9)}  ${'package'.padEnd(width)}  activities\n`);
  for (const r of rows) {
    const acts = r.enables.length > 0 ? r.enables.join(', ') : '-';
    io.stdout(`${String(r.repositories.length).padStart(5)}  ${r.ecosystem.padEnd(9)}  ${r.name.padEnd(width)}  ${acts}\n`);
  }
  return 0;
}
