import { normalizePypiName, purlOf } from '../manifests/purl.js';
import type { ComponentEntry, ComponentRow, Dependency, Evidence } from '../types.js';

const RULE_SUFFIX = { npm: 'npm', pypi: 'pypi', golang: 'go', gem: 'gem', maven: 'maven', composer: 'composer' } as const;

/**
 * Path glob over POSIX relative paths: `*` and `?` stay inside one path segment, `**` crosses
 * segments (and `**` followed by `/` also matches zero directories). Every other character is literal.
 * Local to this module on purpose; the scope code keeps its own matcher.
 */
export function globMatch(pattern: string, path: string): boolean {
  let re = '^';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i] as string;
    if (c === '*') {
      if (pattern[i + 1] === '*') {
        if (pattern[i + 2] === '/') {
          re += '(?:.*/)?';
          i += 2;
        } else {
          re += '.*';
          i += 1;
        }
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\/]/g, '\\$&');
  }
  return new RegExp(re + '$').test(path);
}

function canon(ecosystem: Dependency['ecosystem'], s: string): string {
  return ecosystem === 'pypi' ? normalizePypiName(s) : s.toLowerCase();
}

/** An exact bare package name, or a prefix glob ending in `/*` (an npm scope, a Go module path prefix). */
function packageMatches(entry: ComponentEntry, dep: Dependency): boolean {
  const pattern = canon(dep.ecosystem, entry.match);
  const name = canon(dep.ecosystem, dep.name);
  if (pattern.endsWith('/*')) return name.startsWith(pattern.slice(0, -1));
  return name === pattern;
}

/**
 * Match dependencies and file paths against the component map. One ComponentRow per matched
 * dependency carries every activity its entries enable; evidence is one item per (activity,
 * dependency). A `files` entry yields evidence at `<path>:1` and no ComponentRow.
 */
export function matchComponents(
  deps: Dependency[],
  files: string[],
  entries: ComponentEntry[],
): { components: ComponentRow[]; evidence: { id: string; ev: Evidence }[] } {
  const components: ComponentRow[] = [];
  const evidence: { id: string; ev: Evidence }[] = [];

  for (const dep of deps) {
    const enables = new Set<string>();
    for (const e of entries) {
      if (e.ecosystem !== dep.ecosystem || !packageMatches(e, dep)) continue;
      for (const a of e.enables) enables.add(a);
    }
    if (enables.size === 0) continue;
    const purl = purlOf(dep);
    const sorted = [...enables].sort();
    const row: ComponentRow = { purl, manifest: dep.manifest, enables: sorted };
    if (!dep.version) row.unresolved = true;
    components.push(row);
    for (const id of sorted) {
      evidence.push({
        id,
        ev: { rule: `lexcode.manifest.${RULE_SUFFIX[dep.ecosystem]}`, where: dep.manifest, component: purl },
      });
    }
  }

  const fileEntries = entries.filter((e) => e.ecosystem === 'files');
  if (fileEntries.length > 0) {
    for (const path of files) {
      const enables = new Set<string>();
      for (const e of fileEntries) if (globMatch(e.match, path)) for (const a of e.enables) enables.add(a);
      for (const id of [...enables].sort()) {
        evidence.push({ id, ev: { rule: 'lexcode.manifest.files', where: `${path}:1` } });
      }
    }
  }
  return { components, evidence };
}
