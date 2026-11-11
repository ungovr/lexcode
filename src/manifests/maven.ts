import type { Dependency } from '../types.js';
import { baseName, dirOf, joinRel, readText, resolveInside, type ReaderResult } from './util.js';
import { parseXml, XmlError, type XmlElement } from './xml.js';

/**
 * The Maven ecosystem: every `pom.xml` in the file list. A dependency is `<groupId>:<artifactId>`.
 * Versions resolve from the dependency's own `<version>`, then `<dependencyManagement>` up the parent chain
 * inside the repository (a BOM imported with `<scope>import</scope>` included when its pom is in the repo),
 * with `${...}` taken from `<properties>`, then `project.*`, then the parent chain. Nothing is fetched: a
 * parent POM or BOM outside the repository is not read, and what it would have given is one notice.
 * Build plugins (`<build>`, `<reporting>`) are not dependencies of the app; `<profiles>` dependencies are.
 */

const MAX_DEPTH = 10;
const MAX_CHAIN = 20;

interface PomRef {
  groupId?: string;
  artifactId: string;
  version?: string;
  /** Undefined when the element is absent; '' when it is the empty element, which means "look in no directory". */
  relativePath?: string;
}

interface Managed {
  groupId: string;
  artifactId: string;
  type: string;
  classifier: string;
  version?: string;
  scope?: string;
}

interface RawDep extends Managed {
  /** Line of the artifactId element. */
  line: number;
}

interface Pom {
  rel: string;
  dir: string;
  groupId?: string;
  artifactId?: string;
  version?: string;
  parent?: PomRef;
  props: Map<string, string>;
  profileProps: Map<string, string>;
  managed: Managed[];
  deps: RawDep[];
}

/** A pom and its parents inside the repository, nearest first. */
interface Chain {
  poms: Pom[];
  /** The chain ended at a parent that is not in the repository. */
  external: boolean;
}

function child(el: XmlElement | undefined, name: string): XmlElement | undefined {
  return el?.children.find((c) => c.name === name);
}

function childText(el: XmlElement, name: string): string | undefined {
  const c = child(el, name);
  return c === undefined ? undefined : c.text;
}

function present(s: string | undefined): string | undefined {
  return s === undefined || s === '' ? undefined : s;
}

function readDeps(list: XmlElement | undefined): RawDep[] {
  const out: RawDep[] = [];
  for (const d of list?.children ?? []) {
    if (d.name !== 'dependency') continue;
    const g = present(childText(d, 'groupId'));
    const a = child(d, 'artifactId');
    if (g === undefined || a === undefined || a.text === '') continue;
    out.push({
      groupId: g,
      artifactId: a.text,
      type: present(childText(d, 'type')) ?? 'jar',
      classifier: childText(d, 'classifier') ?? '',
      version: present(childText(d, 'version')),
      scope: present(childText(d, 'scope')),
      line: a.line,
    });
  }
  return out;
}

function readProps(el: XmlElement | undefined, into: Map<string, string>): void {
  for (const p of el?.children ?? []) if (!into.has(p.name)) into.set(p.name, p.text);
}

function toPom(rel: string, root: XmlElement): Pom {
  const parentEl = child(root, 'parent');
  const parent: PomRef | undefined =
    parentEl === undefined
      ? undefined
      : {
          groupId: present(childText(parentEl, 'groupId')),
          artifactId: childText(parentEl, 'artifactId') ?? '',
          version: present(childText(parentEl, 'version')),
          relativePath: childText(parentEl, 'relativePath'),
        };
  const props = new Map<string, string>();
  readProps(child(root, 'properties'), props);
  const profileProps = new Map<string, string>();
  const deps = readDeps(child(root, 'dependencies'));
  for (const prof of child(root, 'profiles')?.children ?? []) {
    if (prof.name !== 'profile') continue;
    readProps(child(prof, 'properties'), profileProps);
    deps.push(...readDeps(child(prof, 'dependencies')));
  }
  return {
    rel,
    dir: dirOf(rel),
    groupId: present(childText(root, 'groupId')),
    artifactId: present(childText(root, 'artifactId')),
    version: present(childText(root, 'version')),
    ...(parent ? { parent } : {}),
    props,
    profileProps,
    managed: readDeps(child(child(root, 'dependencyManagement'), 'dependencies')),
    deps,
  };
}

const effGroup = (p: Pom): string | undefined => p.groupId ?? p.parent?.groupId;
const effVersion = (p: Pom): string | undefined => p.version ?? p.parent?.version;

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** Read the dependencies of every pom.xml in the file list; `test` scope is skipped and counted. */
export function readMaven(root: string, files: string[]): ReaderResult {
  const notices: string[] = [];
  const deps: Dependency[] = [];
  let devSkipped = 0;

  // Parse every pom once before resolving any dependency, so a child read before its parent still resolves.
  const poms: Pom[] = [];
  for (const rel of files) {
    if (baseName(rel) !== 'pom.xml') continue;
    const text = readText(root, rel);
    if (text === undefined) {
      notices.push(`${rel}: could not be read; skipped`);
      continue;
    }
    let el: XmlElement;
    try {
      el = parseXml(text);
    } catch (e) {
      notices.push(`${rel}: did not parse (${e instanceof XmlError ? e.message : 'invalid XML'}); skipped`);
      continue;
    }
    if (el.name !== 'project') {
      notices.push(`${rel}: is not a Maven project file; skipped`);
      continue;
    }
    poms.push(toPom(rel, el));
  }
  const byPath = new Map<string, Pom>(poms.map((p) => [p.rel, p]));
  const byCoord = new Map<string, Pom[]>();
  for (const p of poms) {
    const g = effGroup(p);
    if (g === undefined || p.artifactId === undefined) continue;
    const k = `${g}:${p.artifactId}`;
    byCoord.set(k, [...(byCoord.get(k) ?? []), p]);
  }

  const matchesRef = (p: Pom, ref: PomRef): boolean => p.artifactId === ref.artifactId && (ref.groupId === undefined || effGroup(p) === ref.groupId);

  /** The parent pom inside the repository (a Pom), none declared (undefined), or not in the repository (null). */
  const parentCache = new Map<Pom, Pom | null | undefined>();
  const findParent = (p: Pom): Pom | null | undefined => {
    if (parentCache.has(p)) return parentCache.get(p);
    let found: Pom | null | undefined;
    const ref = p.parent;
    if (ref === undefined) found = undefined;
    else {
      found = null;
      if (ref.relativePath !== '') {
        let target = resolveInside(p.dir, ref.relativePath ?? '../pom.xml');
        if (target !== undefined) {
          if (!/\.xml$/i.test(target)) target = joinRel(target, 'pom.xml');
          const cand = byPath.get(target);
          if (cand !== undefined && cand !== p && matchesRef(cand, ref)) found = cand;
        }
      }
      if (found === null && ref.groupId !== undefined) {
        found = (byCoord.get(`${ref.groupId}:${ref.artifactId}`) ?? []).find((c) => c !== p) ?? null;
      }
    }
    parentCache.set(p, found);
    return found;
  };

  const chainCache = new Map<Pom, Chain>();
  const chainOf = (p: Pom): Chain => {
    const hit = chainCache.get(p);
    if (hit) return hit;
    const out: Pom[] = [p];
    const seen = new Set<Pom>([p]);
    let external = false;
    let cur = p;
    while (out.length < MAX_CHAIN) {
      const par = findParent(cur);
      if (par === undefined) break;
      if (par === null) {
        external = true;
        break;
      }
      if (seen.has(par)) break;
      seen.add(par);
      out.push(par);
      cur = par;
    }
    const c: Chain = { poms: out, external };
    chainCache.set(p, c);
    return c;
  };

  /** `project.version`, `pom.version`, bare `version`, and the `parent.` forms; always the leaf pom's own. */
  const projectValue = (leaf: Pom, name: string): string | undefined => {
    const m = /^(?:(?:project|pom)\.)?(parent\.)?(version|groupId|artifactId)$/.exec(name);
    if (!m) return undefined;
    const field = m[2] as 'version' | 'groupId' | 'artifactId';
    if (m[1] !== undefined) return leaf.parent?.[field];
    if (field === 'version') return effVersion(leaf);
    if (field === 'groupId') return effGroup(leaf);
    return leaf.artifactId;
  };

  const lookup = (name: string, ctx: Chain): string | undefined => {
    const leaf = ctx.poms[0] as Pom;
    const own = leaf.props.get(name) ?? leaf.profileProps.get(name);
    if (own !== undefined) return own;
    const proj = projectValue(leaf, name);
    if (proj !== undefined) return proj;
    for (const p of ctx.poms.slice(1)) {
      const v = p.props.get(name) ?? p.profileProps.get(name);
      if (v !== undefined) return v;
    }
    return undefined;
  };

  /** Replace every `${...}`; undefined when one cannot be resolved or the chain runs past MAX_DEPTH. */
  const interp = (s: string, ctx: Chain, depth = 0): string | undefined => {
    if (!s.includes('${')) return s;
    if (depth > MAX_DEPTH) return undefined;
    let failed = false;
    const out = s.replace(/\$\{([^}]*)\}/g, (_w, name: string) => {
      const v = lookup(name.trim(), ctx);
      const r = v === undefined ? undefined : interp(v, ctx, depth + 1);
      if (r === undefined) {
        failed = true;
        return '';
      }
      return r;
    });
    return failed ? undefined : out;
  };

  const isImport = (m: Managed): boolean => m.scope === 'import' && m.type === 'pom';

  /** The BOM pom in the repository that an import entry names, or undefined when it is outside. */
  const bomOf = (m: Managed, ctx: Chain): Pom | undefined => {
    const g = interp(m.groupId, ctx);
    const a = interp(m.artifactId, ctx);
    if (g === undefined || a === undefined) return undefined;
    return byCoord.get(`${g}:${a}`)?.[0];
  };

  interface Found {
    version?: string;
    scope?: string;
  }

  /** Managed version and scope for one dependency: the chain's own entries first, then its imported BOMs. */
  const findManaged = (ctx: Chain, d: RawDep, loose: boolean, depth: number, visited: Set<Pom>): Found | undefined => {
    const same = (m: Managed): boolean =>
      interp(m.groupId, ctx) === d.groupId &&
      interp(m.artifactId, ctx) === d.artifactId &&
      (loose || (m.type === d.type && m.classifier === d.classifier));
    for (const p of ctx.poms) {
      for (const m of p.managed) {
        if (isImport(m) || !same(m)) continue;
        const version = m.version === undefined ? undefined : interp(m.version, ctx);
        return { ...(version !== undefined ? { version } : {}), ...(m.scope !== undefined ? { scope: m.scope } : {}) };
      }
      if (depth >= MAX_DEPTH) continue;
      for (const m of p.managed) {
        if (!isImport(m)) continue;
        const bom = bomOf(m, ctx);
        if (bom === undefined || visited.has(bom)) continue;
        visited.add(bom);
        const hit = findManaged(chainOf(bom), d, loose, depth + 1, visited);
        if (hit !== undefined) return hit;
      }
    }
    return undefined;
  };

  /** Does the chain lean on a BOM that is not in the repository? */
  const outsideBom = (ctx: Chain): boolean => ctx.poms.some((p) => p.managed.some((m) => isImport(m) && bomOf(m, ctx) === undefined));

  let outside = 0;
  let unresolved = 0;

  for (const pom of poms) {
    const ctx = chainOf(pom);
    const seen = new Set<string>();
    for (const d of pom.deps) {
      const groupId = interp(d.groupId, ctx) ?? d.groupId;
      const artifactId = interp(d.artifactId, ctx) ?? d.artifactId;
      const dd: RawDep = { ...d, groupId, artifactId };
      // A module of this same repository is the app's own code, not a component: not recorded, not counted.
      if (byCoord.has(`${groupId}:${artifactId}`)) continue;
      let managed: Found | undefined;
      const managedFor = (): Found => (managed ??= findManaged(ctx, dd, false, 0, new Set()) ?? findManaged(ctx, dd, true, 0, new Set()) ?? {});
      const scope = (d.scope === undefined ? managedFor().scope : interp(d.scope, ctx) ?? d.scope) ?? 'compile';
      if (scope === 'test') {
        devSkipped++;
        continue;
      }
      let version: string | undefined;
      if (d.version !== undefined) version = interp(d.version, ctx);
      else version = managedFor().version;

      const name = `${groupId}:${artifactId}`;
      const dedupe = `${name}@${version ?? ''}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      deps.push({ ecosystem: 'maven', name, ...(version !== undefined ? { version } : {}), manifest: `${pom.rel}:${d.line}` });

      if (version === undefined) {
        if (ctx.external || outsideBom(ctx)) outside++;
        else unresolved++;
      }
    }
  }

  if (outside > 0) {
    notices.push(
      `${outside} Maven ${plural(outside, 'dependency takes its version', 'dependencies take their version')} from a parent POM or BOM outside this repository; recorded without a version`,
    );
  }
  if (unresolved > 0) {
    notices.push(
      `${unresolved} Maven ${plural(unresolved, 'dependency has a version', 'dependencies have a version')} lexcode cannot resolve (an undefined property or no managed version); recorded without a version`,
    );
  }
  return { deps, devSkipped, notices };
}
