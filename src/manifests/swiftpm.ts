import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Dependency } from '../types.js';
import { parsePbxproj, PbxprojError, type PbxDict, type PbxValue } from './pbxproj.js';
import { ancestorDirs, baseName, describeParseError, dirOf, fileExists, joinRel, LineIndex, readText, type ReaderResult } from './util.js';

/**
 * The `swift` ecosystem (#13199): Swift packages named in a `Package.swift` or in an Xcode project's
 * `project.pbxproj`. lexcode never fetches anything and reads no SwiftPM cache.
 *
 * - **`Package.swift`** is Swift source, read with a string- and comment-aware scan, not a Swift parser.
 *   Each `.package(...)` call with a `url:` argument is a row at the line of `.package(`; a URL that is not
 *   one string literal, or is built by interpolation, is not read, and a notice gives its line. A `path:` call
 *   (or a `file://` URL) is a local package, neither a row nor counted. An `id: "scope.name"` call is a
 *   registry package named `scope/name`. A package is development when every
 *   `.product(name: ..., package: "<identity>")` reference to it sits inside a `.testTarget(` call and
 *   there is at least one; it is then counted, not a row.
 * - **`project.pbxproj`:** each `XCRemoteSwiftPackageReference` object is a row at the line of its
 *   `repositoryURL`. It is development when every target that lists one of its
 *   `XCSwiftPackageProductDependency` objects is a unit-test or UI-testing bundle, and there is one.
 *
 * A row's name is its repository's `host/owner/repo` (Decision 2). Its version is, in order: the pin in
 * the `Package.resolved` beside the `Package.swift` (for a project, the one in its
 * `project.xcworkspace/xcshareddata/swiftpm/`); the pin in the nearest ancestor directory's
 * `Package.resolved` (for a project, the first `*.xcworkspace` beside the `.xcodeproj`, in sorted order);
 * for a `Package.swift` with no `Package.resolved` at or above it, the first Xcode pins file
 * (`*.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/` or `*.xcworkspace/xcshareddata/swiftpm/`, in
 * sorted order) in its own directory or the nearest ancestor that has one, since a local package inside an
 * Xcode app resolves through the app's workspace. Both bundle kinds sort together by name, so
 * `App.xcodeproj` comes before `App.xcworkspace`, and the search stops at the first pins file it finds,
 * even when that file lacks the package. Last, an exact requirement. A pin is matched by identity, the URL's last path segment lowercased without
 * `.git`. A pin with no `version` (a branch or revision pin) gives no version.
 */

const MANIFEST = 'Package.swift';
const PROJECT = 'project.pbxproj';
const RESOLVED = 'Package.resolved';
const PROJECT_PINS = 'project.xcworkspace/xcshareddata/swiftpm/Package.resolved';
const WORKSPACE_PINS = 'xcshareddata/swiftpm/Package.resolved';
const TEST_PRODUCT_TYPES = new Set(['com.apple.product-type.bundle.unit-test', 'com.apple.product-type.bundle.ui-testing']);

/** A file this reader takes rows from. A version-specific `Package@swift-5.9.swift` is an alternate of `Package.swift` and is not read. */
export function isSwiftPmManifest(rel: string): boolean {
  const base = baseName(rel);
  return base === MANIFEST || base === PROJECT;
}

/**
 * A package URL as `host/owner/repo`: the scheme, any `user@`, a port, the `.git` suffix and a trailing
 * `/` removed, and `git@host:owner/repo` read as `host/owner/repo`. Undefined for a local package (a
 * `file://` URL or a path).
 */
export function swiftPackageName(url: string): string | undefined {
  let u = url.trim();
  const scheme = /^([A-Za-z][A-Za-z0-9+.-]*):\/\//.exec(u);
  if (scheme) {
    if ((scheme[1] as string).toLowerCase() === 'file') return undefined;
    u = u.slice(scheme[0].length).replace(/^[^@/]*@/, '').replace(/^([^/:]+):\d*(?=\/|$)/, '$1');
  } else {
    const scp = /^(?:[^@/:]+@)?([^/:]+):(?!\/)(.+)$/.exec(u);
    if (scp) u = `${scp[1] as string}/${scp[2] as string}`;
    else if (u.startsWith('/') || u.startsWith('.') || u.startsWith('~')) return undefined;
  }
  u = u.replace(/\/+$/, '').replace(/\.git$/i, '').replace(/\/+$/, '');
  return u === '' ? undefined : u;
}

/** The identity SwiftPM gives a package: the last path segment of its URL, lowercased, without `.git`. */
function identityOf(name: string): string {
  return (name.split('/').pop() as string).toLowerCase();
}

// ---- Swift source ----------------------------------------------------------------------------

interface StrLit {
  start: number;
  end: number;
  value: string;
  /** True when the literal holds a `\(...)` interpolation, so its value is not known. */
  interpolated: boolean;
}

/** Deepest string interpolation read; a crafted manifest past it is a notice, not a RangeError. */
const MAX_INTERPOLATION_DEPTH = 256;

class SwiftSyntaxError extends Error {
  constructor(
    readonly what: string,
    readonly at: number,
  ) {
    super(what);
  }
}

/**
 * One pass over Swift source that blanks every comment and string literal (newlines kept), so a search
 * of `code` never matches inside one, and records each top-level string literal with its value. Line
 * and block comments (nested), `"..."`, `"""..."""`, raw strings (`#"..."#`) and interpolation
 * `\(...)` are understood.
 */
class SwiftScan {
  readonly strings: StrLit[] = [];
  readonly code: string;
  private readonly out: string[];

  constructor(private readonly s: string) {
    this.out = s.split('');
    this.scanCode(0, 0);
    this.code = this.out.join('');
  }

  private blank(a: number, b: number): void {
    for (let j = a; j < b; j++) if (this.out[j] !== '\n') this.out[j] = ' ';
  }

  /** Scan code from `i`. Inside an interpolation (`level` above 0), stop after the `)` that closes it. */
  private scanCode(i: number, level: number): number {
    const s = this.s;
    const interp = level > 0;
    const start = i;
    let depth = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === '/' && s[i + 1] === '/') {
        const j = s.indexOf('\n', i);
        const end = j < 0 ? s.length : j;
        this.blank(i, end);
        i = end;
        continue;
      }
      if (c === '/' && s[i + 1] === '*') {
        const end = this.blockCommentEnd(i);
        this.blank(i, end);
        i = end;
        continue;
      }
      if (c === '"' || c === '#') {
        const m = /^(#*)("""|")/.exec(s.slice(i, i + 64));
        if (m && (c === '"' || (m[1] as string).length > 0)) {
          i = this.scanString(i, (m[1] as string).length, m[2] as string, level);
          continue;
        }
      }
      if (interp) {
        if (c === '(') depth++;
        else if (c === ')') {
          if (depth === 0) return i + 1;
          depth--;
        }
      }
      i++;
    }
    if (interp) throw new SwiftSyntaxError('unterminated string interpolation', start);
    return i;
  }

  private blockCommentEnd(i: number): number {
    const s = this.s;
    let depth = 0;
    let j = i;
    while (j < s.length) {
      if (s[j] === '/' && s[j + 1] === '*') {
        depth++;
        j += 2;
      } else if (s[j] === '*' && s[j + 1] === '/') {
        depth--;
        j += 2;
        if (depth === 0) return j;
      } else j++;
    }
    throw new SwiftSyntaxError('unterminated comment', i);
  }

  private scanString(start: number, hashes: number, delim: string, level: number): number {
    const s = this.s;
    const pound = '#'.repeat(hashes);
    const close = delim + pound;
    const esc = `\\${pound}`;
    let i = start + hashes + delim.length;
    let value = '';
    let interpolated = false;
    for (;;) {
      if (i >= s.length || (delim === '"' && s[i] === '\n')) throw new SwiftSyntaxError('unterminated string', start);
      if (s.startsWith(close, i)) {
        i += close.length;
        break;
      }
      if (s.startsWith(esc, i)) {
        const j = i + esc.length;
        const e = s[j];
        if (e === '(') {
          if (level >= MAX_INTERPOLATION_DEPTH) throw new SwiftSyntaxError('string interpolation nested too deep', start);
          interpolated = true;
          const end = this.scanCode(j + 1, level + 1);
          value += s.slice(i, end);
          i = end;
          continue;
        }
        if (e === 'u' && s[j + 1] === '{') {
          const k = s.indexOf('}', j);
          const cp = k < 0 ? NaN : parseInt(s.slice(j + 2, k), 16);
          if (Number.isFinite(cp) && cp <= 0x10ffff) {
            value += String.fromCodePoint(cp);
            i = k + 1;
            continue;
          }
        }
        const simple: Record<string, string> = { n: '\n', t: '\t', r: '\r', '0': '\0', '\\': '\\', '"': '"', "'": "'", '\n': '' };
        value += e !== undefined && e in simple ? (simple[e] as string) : (e ?? '');
        i = j + 1;
        continue;
      }
      value += s[i];
      i++;
    }
    this.blank(start, i);
    if (level === 0) this.strings.push({ start, end: i, value, interpolated });
    return i;
  }
}

/**
 * For each `(` in blanked code, the index of the `)` that closes it, or -1; matched once, with a stack, so a
 * manifest of nested calls costs one pass (each call rescanning the rest of the file took 47.9 s on 50,000
 * nested `.package(` calls, final review I-3). A `)` with no `(` open is passed over.
 */
function matchParens(code: string): Int32Array {
  const close = new Int32Array(code.length).fill(-1);
  const open: number[] = [];
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (c === '(') open.push(i);
    else if (c === ')') {
      const at = open.pop();
      if (at !== undefined) close[at] = i;
    }
  }
  return close;
}

interface Call {
  /** Index of the `.` that starts the call. */
  at: number;
  /** Arguments: `[open + 1, close)` where `close` is the index of the closing `)`. */
  argStart: number;
  argEnd: number;
}

class UnbalancedError extends Error {
  constructor(readonly at: number) {
    super('unbalanced parentheses');
  }
}

/** Every `.<name>(` call in blanked code, in order; `close` is matchParens(code). */
function calls(code: string, close: Int32Array, name: string): Call[] {
  const re = new RegExp(`\\.${name}\\s*\\(`, 'g');
  const out: Call[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const open = m.index + m[0].length - 1;
    const end = close[open] as number;
    if (end < 0) throw new UnbalancedError(m.index);
    out.push({ at: m.index, argStart: open + 1, argEnd: end });
  }
  return out;
}

interface Arg {
  label?: string;
  start: number;
  end: number;
}

/**
 * The top-level arguments of a call, split at commas outside brackets. A nested call's parentheses are jumped
 * over whole (`close`, from matchParens), so each character is read by the innermost call around it only.
 */
function args(code: string, close: Int32Array, call: Call): Arg[] {
  const out: Arg[] = [];
  let depth = 0;
  let from = call.argStart;
  const push = (to: number): void => {
    const seg = code.slice(from, to);
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:(?!:)/.exec(seg);
    out.push({ ...(m ? { label: m[1] as string } : {}), start: m ? from + m[0].length : from, end: to });
  };
  for (let i = call.argStart; i < call.argEnd; i++) {
    const c = code[i];
    if (c === '(') i = close[i] as number; // balanced inside a call: matchParens found the call's own `)`
    else if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') depth--;
    else if (c === ',' && depth === 0) {
      push(i);
      from = i + 1;
    }
  }
  if (code.slice(from, call.argEnd).trim() !== '') push(call.argEnd);
  return out;
}

/** The first top-level string literal that starts in `[start, end)`; `strings` is in source order, so a binary search. */
function literalIn(strings: StrLit[], start: number, end: number): StrLit | undefined {
  let lo = 0;
  let hi = strings.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((strings[mid] as StrLit).start < start) lo = mid + 1;
    else hi = mid;
  }
  const hit = strings[lo];
  return hit !== undefined && hit.start < end ? hit : undefined;
}

function stringIn(strings: StrLit[], start: number, end: number): string | undefined {
  return literalIn(strings, start, end)?.value;
}

/**
 * Whether the call at `at` sits inside one of `tests`' argument ranges. `tests` is in source order, so by
 * `argStart`; the call is inside one exactly when the furthest `argEnd` among those that start before it
 * passes it, which a running maximum answers with one binary search.
 */
function insideAny(tests: Call[], reach: number[], at: number): boolean {
  let lo = 0;
  let hi = tests.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((tests[mid] as Call).argStart < at) lo = mid + 1;
    else hi = mid;
  }
  return lo > 0 && (reach[lo - 1] as number) > at;
}

/** One `.package(...)` call that names a remote or registry package. */
interface PackageCall {
  name: string;
  /** Lowercased names that a `.product(package:)` may use for it: its identity, and its `name:` if given. */
  aliases: string[];
  identity: string;
  exact?: string;
  at: number;
}

interface ManifestRead {
  packages: PackageCall[];
  /** Lowercased `package:` of each `.product(...)` reference, and whether it sits inside a `.testTarget(`. */
  refs: { pkg: string; test: boolean }[];
  /** Where a `.package(url:` call's URL is built by string interpolation, which cannot be read. */
  interpolatedUrls: number[];
  /** Where a `.package(url:` call's URL is not a string literal (a variable, a concatenation, a call). */
  nonLiteralUrls: number[];
}

function readManifestText(text: string): ManifestRead {
  const scan = new SwiftScan(text);
  const { code, strings } = scan;
  const close = matchParens(code);
  const packages: PackageCall[] = [];
  const interpolatedUrls: number[] = [];
  const nonLiteralUrls: number[] = [];
  for (const call of calls(code, close, 'package')) {
    const a = args(code, close, call);
    const arg = (label: string): string | undefined => {
      const hit = a.find((x) => x.label === label);
      return hit ? stringIn(strings, hit.start, hit.end) : undefined;
    };
    if (a.some((x) => x.label === 'path')) continue;
    const explicit = arg('name');
    let exact = arg('exact');
    if (exact === undefined) {
      const ex = a.find((x) => x.label === undefined && /^\s*\.exact\s*\(/.test(code.slice(x.start, x.end)));
      if (ex) exact = stringIn(strings, ex.start, ex.end);
    }
    const urlArg = a.find((x) => x.label === 'url');
    if (urlArg) {
      // Strings and comments are blanked in `code`, so a URL written as one literal leaves only blanks there.
      const literal = literalIn(strings, urlArg.start, urlArg.end);
      if (literal === undefined || code.slice(urlArg.start, urlArg.end).trim() !== '') {
        nonLiteralUrls.push(call.at);
        continue;
      }
      if (literal.interpolated) {
        interpolatedUrls.push(call.at);
        continue;
      }
    }
    const url = arg('url');
    const id = arg('id');
    let name: string | undefined;
    let identity: string;
    if (url !== undefined) {
      name = swiftPackageName(url);
      if (name === undefined) continue;
      identity = identityOf(name);
    } else if (id !== undefined && /^[^./\s]+\.[^./\s]+$/.test(id.trim())) {
      name = id.trim().replace('.', '/');
      identity = id.trim().toLowerCase();
    } else continue;
    const aliases = [identity, ...(explicit !== undefined ? [explicit.toLowerCase()] : [])];
    packages.push({ name, aliases, identity, ...(exact !== undefined ? { exact: exact.trim() } : {}), at: call.at });
  }

  const tests = calls(code, close, 'testTarget');
  const reach: number[] = [];
  for (const t of tests) reach.push(Math.max(t.argEnd, reach[reach.length - 1] ?? -1));
  const refs: ManifestRead['refs'] = [];
  for (const call of calls(code, close, 'product')) {
    const hit = args(code, close, call).find((x) => x.label === 'package');
    const pkg = hit ? stringIn(strings, hit.start, hit.end) : undefined;
    if (pkg === undefined) continue;
    refs.push({ pkg: pkg.trim().toLowerCase(), test: insideAny(tests, reach, call.at) });
  }
  return { packages, refs, interpolatedUrls, nonLiteralUrls };
}

// ---- Package.resolved ------------------------------------------------------------------------

type PinMap = Map<string, string | null>;

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

class Pins {
  private readonly parsed = new Map<string, PinMap | null>();

  constructor(
    private readonly root: string,
    private readonly notices: string[],
  ) {}

  /** The pins of one `Package.resolved` by identity (version, or null for a branch or revision pin); null when unreadable. */
  load(rel: string): PinMap | null {
    const hit = this.parsed.get(rel);
    if (hit !== undefined) return hit;
    let out: PinMap | null = null;
    const text = readText(this.root, rel);
    if (text === undefined) {
      this.notices.push(`${rel}: could not be read; versions from it are unavailable`);
    } else {
      try {
        const data: unknown = JSON.parse(text.replace(/^\ufeff/, ''));
        out = new Map();
        // Format 1 nests the pins under `object` and names the URL `repositoryURL`; formats 2 and 3 carry `identity` and `location`.
        const pins = isObj(data) ? (isObj(data['object']) ? data['object']['pins'] : data['pins']) : undefined;
        for (const p of Array.isArray(pins) ? pins : []) {
          if (!isObj(p)) continue;
          let identity = typeof p['identity'] === 'string' ? p['identity'].toLowerCase() : undefined;
          if (identity === undefined) {
            const loc = typeof p['repositoryURL'] === 'string' ? p['repositoryURL'] : typeof p['location'] === 'string' ? p['location'] : undefined;
            const name = loc === undefined ? undefined : swiftPackageName(loc);
            if (name !== undefined) identity = identityOf(name);
          }
          if (identity === undefined || out.has(identity)) continue;
          const state = p['state'];
          const version = isObj(state) && typeof state['version'] === 'string' && state['version'].trim() !== '' ? state['version'].trim() : null;
          out.set(identity, version);
        }
      } catch (e) {
        out = null;
        this.notices.push(`${rel}: did not parse (${describeParseError(e, 'JSON', text)}); versions from it are unavailable`);
      }
    }
    this.parsed.set(rel, out);
    return out;
  }
}

/** The directories directly inside `dir` whose names end with one of `suffixes`, sorted by name. */
function bundlesIn(root: string, dir: string, suffixes: string[]): string[] {
  try {
    return readdirSync(join(root, ...(dir ? dir.split('/') : [])), { withFileTypes: true })
      .filter((e) => e.isDirectory() && suffixes.some((x) => e.name.endsWith(x)))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

/** The pins file inside an `.xcodeproj` or `.xcworkspace` bundle directory. */
function bundlePins(dir: string, bundle: string): string {
  return joinRel(joinRel(dir, bundle), bundle.endsWith('.xcodeproj') ? PROJECT_PINS : WORKSPACE_PINS);
}

/** The `Package.resolved` files to look in, in order, for a `Package.swift` or a `project.pbxproj`. */
function resolvedFor(root: string, rel: string): string[] {
  const dir = dirOf(rel);
  const out: string[] = [];
  if (baseName(rel) === MANIFEST) {
    const beside = joinRel(dir, RESOLVED);
    if (fileExists(root, beside)) out.push(beside);
    for (const d of ancestorDirs(dir).slice(1)) {
      const up = joinRel(d, RESOLVED);
      if (fileExists(root, up)) {
        out.push(up);
        break;
      }
    }
    // No Package.resolved at or above it: a local package inside an Xcode app resolves through the
    // app's workspace, so take the first Xcode pins file in its own directory or the nearest ancestor.
    if (out.length === 0) {
      search: for (const d of ancestorDirs(dir)) {
        for (const bundle of bundlesIn(root, d, ['.xcodeproj', '.xcworkspace'])) {
          const pins = bundlePins(d, bundle);
          if (fileExists(root, pins)) {
            out.push(pins);
            break search;
          }
        }
      }
    }
  } else {
    const own = joinRel(dir, PROJECT_PINS);
    if (fileExists(root, own)) out.push(own);
    const parent = dirOf(dir);
    for (const ws of bundlesIn(root, parent, ['.xcworkspace'])) {
      const pins = bundlePins(parent, ws);
      if (fileExists(root, pins)) {
        out.push(pins);
        break;
      }
    }
  }
  return out;
}

// ---- Xcode projects --------------------------------------------------------------------------

function isDict(v: PbxValue | undefined): v is PbxDict {
  return v !== undefined && typeof v !== 'string' && !Array.isArray(v);
}

function own(d: PbxDict, k: string): PbxValue | undefined {
  return Object.prototype.hasOwnProperty.call(d, k) ? d[k] : undefined;
}

function str(d: PbxDict, k: string): string | undefined {
  const v = own(d, k);
  return typeof v === 'string' ? v : undefined;
}

interface ProjectPackage {
  name: string;
  identity: string;
  exact?: string;
  line: number;
  dev: boolean;
}

function readProject(parsed: ReturnType<typeof parsePbxproj>): ProjectPackage[] {
  const objects = own(parsed.root, 'objects');
  if (!isDict(objects)) return [];
  const productsOf = new Map<string, string[]>();
  const targetTypesOf = new Map<string, string[]>();
  for (const [id, obj] of Object.entries(objects)) {
    if (!isDict(obj)) continue;
    if (str(obj, 'isa') === 'XCSwiftPackageProductDependency') {
      const pkg = str(obj, 'package');
      if (pkg === undefined) continue;
      const list = productsOf.get(pkg) ?? [];
      list.push(id);
      productsOf.set(pkg, list);
    }
    const listed = own(obj, 'packageProductDependencies');
    if (Array.isArray(listed)) {
      const type = str(obj, 'productType') ?? '';
      for (const p of listed) {
        if (typeof p !== 'string') continue;
        const list = targetTypesOf.get(p) ?? [];
        list.push(type);
        targetTypesOf.set(p, list);
      }
    }
  }

  const out: ProjectPackage[] = [];
  for (const [id, obj] of Object.entries(objects)) {
    if (!isDict(obj) || str(obj, 'isa') !== 'XCRemoteSwiftPackageReference') continue;
    const url = str(obj, 'repositoryURL');
    const name = url === undefined ? undefined : swiftPackageName(url);
    if (name === undefined) continue;
    const req = own(obj, 'requirement');
    const exact = isDict(req) && str(req, 'kind') === 'exactVersion' ? str(req, 'version') : undefined;
    const types = (productsOf.get(id) ?? []).flatMap((p) => targetTypesOf.get(p) ?? []);
    const dev = types.length > 0 && types.every((t) => TEST_PRODUCT_TYPES.has(t));
    out.push({ name, identity: identityOf(name), ...(exact !== undefined ? { exact } : {}), line: parsed.lineOf(id, 'repositoryURL'), dev });
  }
  return out;
}

// ---- the reader ------------------------------------------------------------------------------

/**
 * Read the Swift packages of every `Package.swift` and `project.pbxproj` in the file list. A manifest
 * that cannot be read or does not parse is a notice naming it, never a throw.
 */
export function readSwiftPm(root: string, files: string[]): ReaderResult {
  const deps: Dependency[] = [];
  const notices: string[] = [];
  let devSkipped = 0;
  const pins = new Pins(root, notices);

  // The pins files of one manifest are found once, not once per dependency.
  const pinFiles = new Map<string, string[]>();
  const versionOf = (rel: string, identity: string, exact: string | undefined): string | undefined => {
    let found = pinFiles.get(rel);
    if (found === undefined) {
      found = resolvedFor(root, rel);
      pinFiles.set(rel, found);
    }
    for (const r of found) {
      const map = pins.load(r);
      if (map?.has(identity)) return map.get(identity) ?? undefined;
    }
    return exact;
  };

  for (const rel of files) {
    if (!isSwiftPmManifest(rel)) continue;
    const text = readText(root, rel);
    if (text === undefined) {
      if (fileExists(root, rel)) notices.push(`${rel}: could not be read; skipped`);
      continue;
    }
    const seen = new Set<string>();
    const add = (name: string, version: string | undefined, line: number): void => {
      if (seen.has(name.toLowerCase())) return;
      seen.add(name.toLowerCase());
      deps.push({ ecosystem: 'swift', name, ...(version !== undefined ? { version } : {}), manifest: `${rel}:${line}` });
    };

    if (baseName(rel) === MANIFEST) {
      let read: ManifestRead;
      const lines = new LineIndex(text);
      try {
        read = readManifestText(text);
      } catch (e) {
        if (e instanceof SwiftSyntaxError) notices.push(`${rel}: did not parse (${e.what} at line ${lines.lineAt(e.at)}); skipped`);
        else if (e instanceof UnbalancedError) notices.push(`${rel}: did not parse (unbalanced parentheses at line ${lines.lineAt(e.at)}); skipped`);
        else throw e;
        continue;
      }
      const unread = [
        ...read.interpolatedUrls.map((at) => ({ at, why: 'built by string interpolation' })),
        ...read.nonLiteralUrls.map((at) => ({ at, why: 'that is not a string literal' })),
      ].sort((x, y) => x.at - y.at);
      for (const u of unread) notices.push(`${rel}:${lines.lineAt(u.at)}: a package URL ${u.why} is not read`);
      // Each package's references, counted once: all of them, and those inside a test target.
      const uses = new Map<string, { all: number; test: number }>();
      for (const r of read.refs) {
        const u = uses.get(r.pkg) ?? { all: 0, test: 0 };
        u.all++;
        if (r.test) u.test++;
        uses.set(r.pkg, u);
      }
      for (const p of read.packages) {
        let all = 0;
        let test = 0;
        for (const alias of new Set(p.aliases)) {
          all += uses.get(alias)?.all ?? 0;
          test += uses.get(alias)?.test ?? 0;
        }
        if (all > 0 && test === all) {
          if (!seen.has(p.name.toLowerCase())) devSkipped++;
          seen.add(p.name.toLowerCase());
          continue;
        }
        add(p.name, versionOf(rel, p.identity, p.exact), lines.lineAt(p.at));
      }
      continue;
    }

    let parsed: ReturnType<typeof parsePbxproj>;
    try {
      parsed = parsePbxproj(text);
    } catch (e) {
      if (!(e instanceof PbxprojError)) throw e;
      if (e.kind === 'binary') notices.push(`${rel}: is a binary plist, which lexcode does not read; skipped`);
      else if (e.kind === 'xml') notices.push(`${rel}: is an XML plist, which lexcode does not read; skipped`);
      else notices.push(`${rel}: did not parse (invalid OpenStep plist at line ${e.line ?? 1}, column ${e.column ?? 1}); skipped`);
      continue;
    }
    for (const p of readProject(parsed)) {
      if (p.dev) {
        if (!seen.has(p.name.toLowerCase())) devSkipped++;
        seen.add(p.name.toLowerCase());
        continue;
      }
      add(p.name, versionOf(rel, p.identity, p.exact), p.line);
    }
  }

  const unresolved = deps.filter((d) => d.version === undefined).length;
  if (unresolved > 0) {
    notices.push(
      `${unresolved} Swift ${unresolved === 1 ? 'package has' : 'packages have'} no resolved version (no Package.resolved, or a branch or revision requirement); recorded without a version`,
    );
  }
  return { deps, devSkipped, notices };
}
