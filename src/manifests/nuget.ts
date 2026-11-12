import type { Dependency } from '../types.js';
import { ancestorDirs, baseName, describeParseError, dirOf, fileExists, joinRel, readText, type ReaderResult } from './util.js';
import { parseXml, XmlError, type XmlElement } from './xml.js';

/**
 * The NuGet ecosystem, read from MSBuild files (#13012). A dependency is a `<PackageReference Include>`
 * in a project file (`*.csproj`, `*.fsproj`, `*.vbproj`: the packages are NuGet whatever the project's
 * language) or in a `Directory.Build.props` or `Directory.Build.targets`, whose references apply to every
 * project below it and are recorded once, at that file; or a `<package>` of a legacy `packages.config`.
 * Its name is the package Id as written, compared case-insensitively, and its manifest is the line of
 * the element. `Update` and `Remove` forms add no dependency.
 *
 * Skipped and counted as development: a reference whose `PrivateAssets` is `all`, every reference of a
 * test project (`<IsTestProject>true</IsTestProject>`, or a reference to `Microsoft.NET.Test.Sdk`), every
 * `<GlobalPackageReference>` (analyzers and build tools), and a `packages.config` entry marked
 * `developmentDependency="true"`.
 *
 * A version comes, in order, from the `packages.lock.json` beside the file (the first framework in file
 * order that lists the Id as a `Direct` dependency), the reference's own `VersionOverride` or `Version`,
 * the `<PackageVersion>` of the nearest `Directory.Packages.props` at or above it, or a `packages.config`
 * entry's `version`. Only a plain NuGet version counts: a floating version, a range or an MSBuild property
 * that does not resolve leaves the row without one. `$(Name)` resolves one level, from a `<PropertyGroup>`
 * of the same file, else of the nearest `Directory.Build.props`, else of the nearest
 * `Directory.Packages.props`. Nothing is fetched, and the NuGet cache is not read.
 */

const PROJECT_EXT = /\.(?:cs|fs|vb)proj$/;
const BUILD_FILES = new Set(['Directory.Build.props', 'Directory.Build.targets']);
const PACKAGES_PROPS = 'Directory.Packages.props';
const PACKAGES_CONFIG = 'packages.config';
const LOCK = 'packages.lock.json';
const TEST_SDK = 'microsoft.net.test.sdk';

/** `1.2.3`, `1.2.3.4`, `1.2.3-beta.1`, with optional build metadata: what NuGet resolves to one version. */
const PLAIN_VERSION = /^\d+(?:\.\d+){0,3}(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const PROPERTY_REF = /\$\(([A-Za-z_][A-Za-z0-9_.-]*)\)/g;

/** A file whose presence makes a scan report the `nuget` ecosystem. */
export function isNugetManifest(rel: string): boolean {
  const base = baseName(rel);
  return PROJECT_EXT.test(base) || BUILD_FILES.has(base) || base === PACKAGES_PROPS || base === PACKAGES_CONFIG;
}

type Json = Record<string, unknown>;

function isObj(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function same(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** An attribute by name in any case (MSBuild names are case-insensitive). */
function attr(el: XmlElement, name: string): string | undefined {
  for (const [k, v] of Object.entries(el.attrs)) if (same(k, name)) return v;
  return undefined;
}

/** Item metadata: the attribute, or failing that a child element's text, by name in any case. */
function meta(el: XmlElement, name: string): string | undefined {
  return attr(el, name) ?? el.children.find((c) => same(c.name, name))?.text;
}

/** The trimmed `Include` of an item, or undefined when it has none (an `Update` or `Remove` form). */
function include(el: XmlElement): string | undefined {
  const id = attr(el, 'Include')?.trim();
  return id ? id : undefined;
}

function* descendants(el: XmlElement): Generator<XmlElement> {
  for (const c of el.children) {
    yield c;
    yield* descendants(c);
  }
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

interface MsbuildFile {
  root: XmlElement;
  /** Properties of every `<PropertyGroup>`; a later definition replaces an earlier one, as MSBuild evaluates. */
  props: Map<string, string>;
}

class NugetReader {
  readonly deps: Dependency[] = [];
  readonly notices: string[] = [];
  devSkipped = 0;
  unresolved = 0;
  private readonly xml = new Map<string, MsbuildFile | undefined>();
  private readonly locks = new Map<string, Map<string, string> | undefined>();

  constructor(private readonly root: string) {}

  /** A parsed MSBuild file, read once; undefined when it is absent or unusable (a notice says which). */
  file(rel: string): MsbuildFile | undefined {
    if (this.xml.has(rel)) return this.xml.get(rel);
    let parsed: MsbuildFile | undefined;
    if (fileExists(this.root, rel)) {
      const text = readText(this.root, rel);
      if (text === undefined) this.notices.push(`${rel}: could not be read; skipped`);
      else {
        try {
          const root = parseXml(text);
          const props = new Map<string, string>();
          for (const el of descendants(root)) {
            if (!same(el.name, 'PropertyGroup')) continue;
            for (const p of el.children) props.set(p.name.toLowerCase(), p.text);
          }
          parsed = { root, props };
        } catch (e) {
          this.notices.push(`${rel}: did not parse (${e instanceof XmlError ? e.message : 'invalid XML'}); skipped`);
        }
      }
    }
    this.xml.set(rel, parsed);
    return parsed;
  }

  /** The nearest file of this name at or above `dir`, parsed. */
  private nearest(dir: string, name: string): { rel: string; file: MsbuildFile } | undefined {
    for (const d of ancestorDirs(dir)) {
      const rel = joinRel(d, name);
      if (!fileExists(this.root, rel)) continue;
      const file = this.file(rel);
      return file ? { rel, file } : undefined;
    }
    return undefined;
  }

  /** Resolved `Direct` versions by lowercased Id from the lock beside `dir`; undefined without a usable one. */
  private lock(dir: string): Map<string, string> | undefined {
    const rel = joinRel(dir, LOCK);
    if (this.locks.has(rel)) return this.locks.get(rel);
    let versions: Map<string, string> | undefined;
    if (fileExists(this.root, rel)) {
      const text = readText(this.root, rel);
      let data: unknown;
      if (text === undefined) this.notices.push(`${rel}: could not be read; versions from it are unavailable`);
      else {
        try {
          data = JSON.parse(text);
          if (!isObj(data)) this.notices.push(`${rel}: is not a JSON object; versions from it are unavailable`);
        } catch (e) {
          this.notices.push(`${rel}: did not parse (${describeParseError(e, 'JSON', text)}); versions from it are unavailable`);
        }
      }
      if (isObj(data)) {
        versions = new Map();
        const frameworks = data['dependencies'];
        for (const deps of isObj(frameworks) ? Object.values(frameworks) : []) {
          if (!isObj(deps)) continue;
          for (const [id, d] of Object.entries(deps)) {
            const key = id.toLowerCase();
            if (versions.has(key) || !isObj(d) || d['type'] !== 'Direct' || typeof d['resolved'] !== 'string') continue;
            versions.set(key, d['resolved']);
          }
        }
      }
    }
    this.locks.set(rel, versions);
    return versions;
  }

  /**
   * Expand every `$(Name)` in `value` one level: from the file the value is written in, else the nearest
   * Directory.Build.props, else the nearest Directory.Packages.props. Undefined when a name is not found.
   */
  private expand(value: string, rel: string): string | undefined {
    if (!value.includes('$(')) return value;
    const dir = dirOf(rel);
    const sources = [this.file(rel), this.nearest(dir, 'Directory.Build.props')?.file, this.nearest(dir, PACKAGES_PROPS)?.file];
    let missing = false;
    const out = value.replace(PROPERTY_REF, (_whole, name: string) => {
      for (const s of sources) {
        const v = s?.props.get(name.toLowerCase());
        if (v !== undefined) return v;
      }
      missing = true;
      return '';
    });
    return missing ? undefined : out;
  }

  /** A value written in `rel`, as a version: expanded one level, then kept only when it is a plain version. */
  private plain(value: string, rel: string): string | undefined {
    const v = this.expand(value.trim(), rel)?.trim();
    return v !== undefined && PLAIN_VERSION.test(v) ? v : undefined;
  }

  /** The `Version` of the nearest Directory.Packages.props's `<PackageVersion>` for `id`, if it has one. */
  private central(dir: string, id: string): { value: string; rel: string } | undefined {
    const found = this.nearest(dir, PACKAGES_PROPS);
    if (!found) return undefined;
    for (const el of descendants(found.file.root)) {
      if (!same(el.name, 'PackageVersion') || !same(include(el) ?? '', id)) continue;
      const value = meta(el, 'Version');
      return value === undefined ? undefined : { value, rel: found.rel };
    }
    return undefined;
  }

  /** Decision 4's order: the lock beside the file, the element's own value, the central version. */
  private version(rel: string, id: string, own: string | undefined): string | undefined {
    const locked = this.lock(dirOf(rel))?.get(id.toLowerCase());
    if (locked !== undefined && PLAIN_VERSION.test(locked)) return locked;
    if (own !== undefined && own.trim() !== '') return this.plain(own, rel);
    const central = this.central(dirOf(rel), id);
    return central ? this.plain(central.value, central.rel) : undefined;
  }

  private push(rel: string, el: XmlElement, id: string, version: string | undefined): void {
    if (version === undefined) this.unresolved++;
    this.deps.push({ ecosystem: 'nuget', name: id, ...(version !== undefined ? { version } : {}), manifest: `${rel}:${el.line}` });
  }

  /** The references of a project file or a Directory.Build.props / .targets. */
  readProject(rel: string): void {
    const file = this.file(rel);
    if (!file) return;
    const refs: { el: XmlElement; id: string }[] = [];
    for (const el of descendants(file.root)) {
      if (same(el.name, 'GlobalPackageReference') && include(el)) this.devSkipped++;
      if (!same(el.name, 'PackageReference')) continue;
      const id = include(el);
      if (id) refs.push({ el, id });
    }
    const isTest =
      same(file.props.get('istestproject')?.trim() ?? '', 'true') || refs.some((r) => r.id.toLowerCase() === TEST_SDK);
    const seen = new Set<string>();
    for (const { el, id } of refs) {
      const key = id.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const priv = meta(el, 'PrivateAssets') ?? '';
      if (isTest || priv.split(';').some((a) => same(a.trim(), 'all'))) {
        this.devSkipped++;
        continue;
      }
      this.push(rel, el, id, this.version(rel, id, meta(el, 'VersionOverride') ?? meta(el, 'Version')));
    }
  }

  /** A Directory.Packages.props gives versions only; its `<GlobalPackageReference>` entries are counted. */
  readPackagesProps(rel: string): void {
    const file = this.file(rel);
    if (!file) return;
    for (const el of descendants(file.root)) if (same(el.name, 'GlobalPackageReference') && include(el)) this.devSkipped++;
  }

  readPackagesConfig(rel: string): void {
    const file = this.file(rel);
    if (!file) return;
    const seen = new Set<string>();
    for (const el of file.root.children) {
      if (!same(el.name, 'package')) continue;
      const id = meta(el, 'id')?.trim();
      if (!id || seen.has(id.toLowerCase())) continue;
      seen.add(id.toLowerCase());
      if (same(meta(el, 'developmentDependency')?.trim() ?? '', 'true')) {
        this.devSkipped++;
        continue;
      }
      this.push(rel, el, id, this.version(rel, id, meta(el, 'version')));
    }
  }
}

/** Read the NuGet dependencies of every MSBuild project file, Directory.Build file and packages.config in the file list. */
export function readNuget(root: string, files: string[]): ReaderResult {
  const r = new NugetReader(root);
  for (const rel of files) {
    const base = baseName(rel);
    if (PROJECT_EXT.test(base) || BUILD_FILES.has(base)) r.readProject(rel);
    else if (base === PACKAGES_PROPS) r.readPackagesProps(rel);
    else if (base === PACKAGES_CONFIG) r.readPackagesConfig(rel);
  }
  if (r.unresolved > 0) {
    r.notices.push(
      `${r.unresolved} NuGet ${plural(r.unresolved, 'dependency has', 'dependencies have')} no resolved version (no packages.lock.json, a floating or range version, or an MSBuild property lexcode could not resolve); recorded without a version`,
    );
  }
  return { deps: r.deps, devSkipped: r.devSkipped, notices: r.notices };
}
