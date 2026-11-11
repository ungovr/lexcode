import { parse as parseToml } from 'smol-toml';
import type { Dependency } from '../types.js';
import { baseName, describeParseError, dirOf, joinRel, readText, resolveInside, ancestorDirs, type ReaderResult } from './util.js';

/**
 * The Gradle side of the `maven` ecosystem: every `build.gradle` and `build.gradle.kts`, plus the version
 * catalogs (`gradle/*.versions.toml`) and the convention plugins they feed. Nothing is evaluated: a build file
 * is read as tokens (comments and strings set aside, braces counted), so a Groovy closure after a declaration
 * cannot end the `dependencies {}` block it sits in, and `exclude group:` inside it is not a dependency.
 *
 * What is a dependency: a declaration directly inside a `dependencies {}` block that is not inside
 * `buildscript`, `plugins`, `pluginManagement` or `constraints`, and that names a `group:artifact[:version]`
 * string, the map form, a catalog accessor (`libs.x.y`, `libs.bundles.z`) or a `findLibrary("alias")` lookup.
 * `project(...)`, `files(...)`, `platform(...)` and `kotlin("...")` are not components of the app and are not
 * recorded. Test, debug and annotation-processor configurations, and the build files of `buildSrc/`,
 * `build-logic/` and every `includeBuild` directory (build tooling), are skipped and counted.
 *
 * Variables (`$name`, `${name}`) come from the same file, then the root build file, then `gradle.properties`
 * beside the file and at the build root. Every expansion is bounded: memoized, cycle-checked, and capped in
 * depth and length, so a chain of variables each naming the next cannot hang a scan. Nothing is fetched, and
 * nothing in a notice quotes the file: a notice names a count, or a path.
 */

const MAX_VAR_DEPTH = 8;
const MAX_EXPANDED = 4096;
const MAX_LOOKAHEAD = 5000;
const MAX_LOOKBACK = 400;
const PLACEHOLDER_RE = /\$\{([^{}]*)\}|\$([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)/g;

/**
 * Replace every `$name` and `${expr}` in `raw`, or give undefined when one cannot be replaced. Shared by the
 * variable and the constant resolvers, so the bounds live in one place: a text already longer than the cap is
 * refused before any work, the output length is counted as it grows and the expansion stops the moment it
 * passes the cap (N placeholders of a large value never build N copies of it), and the depth is capped.
 * `lookup` resolves a dotted name; `lookupExpr` resolves a braced expression that is not a plain name.
 */
function expandPlaceholders(
  raw: string,
  depth: number,
  lookup: (name: string) => string | undefined,
  lookupExpr?: (expr: string) => string | undefined,
): string | undefined {
  if (raw.includes('\u0001')) return undefined;
  if (!raw.includes('$')) return raw;
  if (depth > MAX_VAR_DEPTH || raw.length > MAX_EXPANDED) return undefined;
  const pieces: string[] = [];
  let length = 0;
  let last = 0;
  for (const m of raw.matchAll(PLACEHOLDER_RE)) {
    const braced = m[1];
    const bare = m[2];
    let value: string | undefined;
    if (braced !== undefined) {
      const e = braced.trim();
      value = /^[A-Za-z_][\w.]*$/.test(e) ? lookup(e) : lookupExpr?.(e);
    } else if (bare !== undefined) {
      // `$a.b.c`: the longest dotted name that exists, the rest stays text (Kotlin).
      const parts = bare.split('.');
      for (let k = parts.length; k >= 1 && value === undefined; k--) {
        const v = lookup(parts.slice(0, k).join('.'));
        if (v !== undefined) value = v + parts.slice(k).map((p) => `.${p}`).join('');
      }
    }
    if (value === undefined) return undefined;
    const before = raw.slice(last, m.index);
    length += before.length + value.length;
    if (length > MAX_EXPANDED) return undefined;
    pieces.push(before, value);
    last = (m.index as number) + m[0].length;
  }
  const tail = raw.slice(last);
  if (length + tail.length > MAX_EXPANDED) return undefined;
  const out = pieces.join('') + tail;
  return out.includes('$') ? undefined : out;
}

// ---------------------------------------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------------------------------------

interface Tok {
  k: 'id' | 'str' | 'num' | 'p';
  v: string;
  line: number;
  /** A string whose `$` expands: double-quoted. A Groovy single-quoted string and a Kotlin char do not. */
  interp?: boolean;
}

const isIdStart = (c: string): boolean => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '$';
const isIdPart = (c: string): boolean => isIdStart(c) || (c >= '0' && c <= '9');
const isDigit = (c: string): boolean => c >= '0' && c <= '9';

/** Index just past the `}` that closes a `${` opened before `i`, skipping nested strings. */
function skipTemplate(text: string, i: number): number {
  let depth = 1;
  let j = i;
  while (j < text.length && depth > 0) {
    const c = text[j] as string;
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '"' || c === "'") {
      const q = c;
      j++;
      while (j < text.length && text[j] !== q && text[j] !== '\n') j += text[j] === '\\' ? 2 : 1;
    }
    j++;
  }
  return j;
}

function lex(text: string): Tok[] {
  const toks: Tok[] = [];
  let line = 1;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i] as string;
    if (c === '\n') {
      line++;
      i++;
    } else if (c === ' ' || c === '\t' || c === '\r' || c === '\f') {
      i++;
    } else if (c === '/' && text[i + 1] === '/') {
      while (i < n && text[i] !== '\n') i++;
    } else if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end < 0 ? n : end + 2;
      for (let j = i; j < stop; j++) if (text[j] === '\n') line++;
      i = stop;
    } else if (c === '"' || c === "'") {
      const startLine = line;
      const triple = text[i + 1] === c && text[i + 2] === c;
      let out = '';
      if (triple) {
        i += 3;
        const close = c + c + c;
        const end = text.indexOf(close, i);
        const stop = end < 0 ? n : end;
        for (let j = i; j < stop; j++) {
          const ch = text[j] as string;
          if (ch === '\n') line++;
          out += ch === '\\' && text[j + 1] === '$' ? '\u0001' : ch;
          if (ch === '\\' && text[j + 1] === '$') j++;
        }
        i = end < 0 ? n : end + 3;
      } else {
        i++;
        while (i < n && text[i] !== c && text[i] !== '\n') {
          const ch = text[i] as string;
          if (ch === '\\') {
            const nx = text[i + 1] ?? '';
            out += nx === '$' ? '\u0001' : nx;
            i += 2;
          } else if (c === '"' && ch === '$' && text[i + 1] === '{') {
            const end = skipTemplate(text, i + 2);
            const slice = text.slice(i, end);
            for (const s of slice) if (s === '\n') line++;
            out += slice;
            i = end;
          } else {
            out += ch;
            i++;
          }
        }
        if (text[i] === c) i++;
      }
      toks.push({ k: 'str', v: out, line: startLine, interp: c === '"' });
    } else if (c === '`') {
      const end = text.indexOf('`', i + 1);
      const stop = end < 0 || text.slice(i, end).includes('\n') ? i + 1 : end;
      if (stop === i + 1) {
        i++;
      } else {
        toks.push({ k: 'id', v: text.slice(i + 1, stop), line });
        i = stop + 1;
      }
    } else if (isIdStart(c)) {
      let j = i + 1;
      while (j < n && isIdPart(text[j] as string)) j++;
      toks.push({ k: 'id', v: text.slice(i, j), line });
      i = j;
    } else if (isDigit(c)) {
      let j = i + 1;
      while (j < n && (isIdPart(text[j] as string) || text[j] === '.') && !(text[j] === '.' && !isDigit(text[j + 1] ?? ''))) j++;
      toks.push({ k: 'num', v: text.slice(i, j), line });
      i = j;
    } else {
      const two = text.slice(i, i + 2);
      if (two === '->' || two === '?.' || two === '?:' || two === '::' || two === '..') {
        toks.push({ k: 'p', v: two, line });
        i += 2;
      } else {
        toks.push({ k: 'p', v: c, line });
        i++;
      }
    }
  }
  return toks;
}

const isP = (t: Tok | undefined, v: string): boolean => t !== undefined && t.k === 'p' && t.v === v;

// ---------------------------------------------------------------------------------------------------------
// Configurations
// ---------------------------------------------------------------------------------------------------------

const DEV_NAMES = new Set(['lintChecks', 'lintPublish', 'detektPlugins', 'ktlint']);
/** kapt, ksp and annotationProcessor, bare or with a flavor, target or source set after them (`kaptFree`, `kspJvm`). */
const PROCESSOR_PREFIX = /^(?:kapt|ksp|annotationProcessor)(?:[A-Z]|$)/;
const DEV_SEGMENTS = new Set(['test', 'debug']);

/** Decision 7: a test, debug or processor configuration is not a dependency the app ships. */
function isDevConf(conf: string): boolean {
  if (DEV_NAMES.has(conf) || PROCESSOR_PREFIX.test(conf)) return true;
  const segments = conf.match(/[A-Z]?[a-z0-9]+|[A-Z]+(?![a-z0-9])/g) ?? [];
  return segments.some((s) => DEV_SEGMENTS.has(s.toLowerCase()));
}

// ---------------------------------------------------------------------------------------------------------
// Catalogs
// ---------------------------------------------------------------------------------------------------------

interface LibRef {
  name: string;
  version?: string;
}

interface Catalog {
  name: string;
  rel: string;
  versions: Map<string, string>;
  libs: Map<string, LibRef>;
  bundles: Map<string, string[]>;
}

const normAlias = (s: string): string => s.toLowerCase().replace(/[-_.]/g, '.');

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const NAME_RE = /^[A-Za-z0-9_.-]+$/;
const VERSION_RE = /^[^\s$\u0001'"]+$/;

/** A version value as a catalog writes it: a string, or a table read strictly, then require, then prefer. */
function versionText(v: unknown, versions: Map<string, string>): string | undefined {
  if (typeof v === 'string') return v === '' ? undefined : v;
  if (!isObj(v)) return undefined;
  if (typeof v.ref === 'string') return versions.get(v.ref);
  for (const key of ['strictly', 'require', 'prefer']) {
    const x = v[key];
    if (typeof x === 'string' && x !== '') return x;
  }
  return undefined;
}

function parseCatalog(rel: string, text: string): Catalog {
  const t = parseToml(text) as Record<string, unknown>;
  const stem = baseName(rel).replace(/\.versions\.toml$/, '');
  const cat: Catalog = { name: stem, rel, versions: new Map(), libs: new Map(), bundles: new Map() };
  if (isObj(t.versions)) {
    for (const [k, v] of Object.entries(t.versions)) {
      const s = versionText(v, cat.versions);
      if (s !== undefined) cat.versions.set(normAlias(k), s);
      // `version.ref` names the key as written, so keep that spelling too.
      if (s !== undefined) cat.versions.set(k, s);
    }
  }
  if (isObj(t.libraries)) {
    for (const [alias, v] of Object.entries(t.libraries)) {
      let group: string | undefined;
      let artifact: string | undefined;
      let version: string | undefined;
      if (typeof v === 'string') {
        const p = v.split(':');
        group = p[0];
        artifact = p[1];
        version = p[2] === '' ? undefined : p[2];
      } else if (isObj(v)) {
        if (typeof v.module === 'string') {
          const p = v.module.split(':');
          group = p[0];
          artifact = p[1];
        } else {
          group = typeof v.group === 'string' ? v.group : undefined;
          artifact = typeof v.name === 'string' ? v.name : undefined;
        }
        version = versionText(v.version, cat.versions);
      }
      if (!group || !artifact || !NAME_RE.test(group) || !NAME_RE.test(artifact)) continue;
      if (version !== undefined && !VERSION_RE.test(version)) version = undefined;
      cat.libs.set(normAlias(alias), { name: `${group}:${artifact}`, ...(version !== undefined ? { version } : {}) });
    }
  }
  if (isObj(t.bundles)) {
    for (const [k, v] of Object.entries(t.bundles)) {
      if (Array.isArray(v)) cat.bundles.set(normAlias(k), v.filter((x): x is string => typeof x === 'string').map(normAlias));
    }
  }
  return cat;
}

// ---------------------------------------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------------------------------------

interface VarEntry {
  line: number;
  raw: string;
  interp: boolean;
}

type Vars = Map<string, VarEntry[]>;

function addVar(vars: Vars, name: string, entry: VarEntry): void {
  const list = vars.get(name);
  if (list) list.push(entry);
  else vars.set(name, [entry]);
}

/** A string token that is the whole right-hand side: not the start of `"a" + b` or `"a".toString()`. */
function wholeValue(toks: Tok[], i: number): boolean {
  const after = toks[i + 1];
  if (after === undefined) return true;
  if (after.k === 'p' && ['+', '.', '?.', '?:', '*', '%', '-', '/'].includes(after.v)) return false;
  return true;
}

/** `val x = "..."`, `def x = '...'`, `ext.x = '...'`, `ext { x = '...' }`, `extra["x"] = "..."`, `ext.versions = [a: '1']`. */
function collectVars(toks: Tok[]): Vars {
  const vars: Vars = new Map();
  let parens = 0;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i] as Tok;
    if (t.k === 'p') {
      if (t.v === '(') parens++;
      else if (t.v === ')') parens = Math.max(0, parens - 1);
      continue;
    }
    if (parens > 0) continue;
    const prev = toks[i - 1];
    const nx = toks[i + 1];
    if (t.k === 'id' && isP(nx, '=')) {
      // `val v: String = "1"` names the variable before the colon; `ext.v = "1"` ignores the qualifier.
      const typed = isP(prev, ':') && toks[i - 2]?.k === 'id';
      const name = typed ? (toks[i - 2] as Tok).v : t.v;
      const val = toks[i + 2];
      if (val?.k === 'str' && wholeValue(toks, i + 2)) addVar(vars, name, { line: t.line, raw: val.v, interp: val.interp === true });
      else if (isP(val, '[')) collectMap(toks, i + 2, name, vars);
    } else if (t.k === 'id' && (t.v === 'ext' || t.v === 'extra') && isP(nx, '[') && toks[i + 2]?.k === 'str' && isP(toks[i + 3], ']') && isP(toks[i + 4], '=')) {
      const val = toks[i + 5];
      const key = toks[i + 2] as Tok;
      if (val?.k === 'str' && wholeValue(toks, i + 5)) addVar(vars, key.v, { line: key.line, raw: val.v, interp: val.interp === true });
    } else if (t.k === 'id' && (t.v === 'ext' || t.v === 'extra') && isP(nx, '.') && toks[i + 2]?.v === 'set' && isP(toks[i + 3], '(') && toks[i + 4]?.k === 'str' && isP(toks[i + 5], ',') && toks[i + 6]?.k === 'str') {
      const key = toks[i + 4] as Tok;
      const val = toks[i + 6] as Tok;
      addVar(vars, key.v, { line: key.line, raw: val.v, interp: val.interp === true });
    } else if (t.k === 'id' && toks[i + 1]?.v === 'by' && toks[i + 2]?.v === 'extra' && isP(toks[i + 3], '(') && toks[i + 4]?.k === 'str') {
      const val = toks[i + 4] as Tok;
      addVar(vars, t.v, { line: t.line, raw: val.v, interp: val.interp === true });
    }
  }
  return vars;
}

/** `name = [key: 'v', other: "w"]`: each pair is the variable `name.key`. */
function collectMap(toks: Tok[], open: number, name: string, vars: Vars): void {
  let depth = 0;
  for (let k = open; k < toks.length && k < open + MAX_LOOKAHEAD; k++) {
    const t = toks[k] as Tok;
    if (t.k === 'p') {
      if (t.v === '[' || t.v === '(' || t.v === '{') depth++;
      else if (t.v === ']' || t.v === ')' || t.v === '}') {
        depth--;
        if (depth <= 0) return;
      }
    } else if (depth === 1 && (t.k === 'id' || t.k === 'str') && isP(toks[k + 1], ':') && toks[k + 2]?.k === 'str') {
      const val = toks[k + 2] as Tok;
      addVar(vars, `${name}.${t.v}`, { line: t.line, raw: val.v, interp: val.interp === true });
    }
  }
}

function parseProperties(text: string): Map<string, string> {
  const props = new Map<string, string>();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#') || line.startsWith('!')) continue;
    const m = /^([^=:\s]+)\s*[=:\s]\s*(.*)$/.exec(line);
    if (m && !props.has(m[1] as string)) props.set(m[1] as string, (m[2] as string).trim());
  }
  return props;
}

// ---------------------------------------------------------------------------------------------------------
// Constants in buildSrc objects
// ---------------------------------------------------------------------------------------------------------

interface ConstEntry {
  raw: string;
  interp: boolean;
  /** The object path that holds it (`Libs`, `Libs.Google`), for a sibling reference like `$NAME`. */
  objPath: string;
}

/** `const val NAME = "..."` and `val NAME = "..."` directly inside `object X { }` (nested objects join with dots). */
function collectConsts(toks: Tok[], into: Map<string, ConstEntry>): void {
  let depth = 0;
  const frames: { name: string; depth: number }[] = [];
  let pending: { name: string; at: number } | undefined;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i] as Tok;
    if (t.k === 'p') {
      if (t.v === '{') {
        depth++;
        if (pending && pending.at === i) frames.push({ name: pending.name, depth });
        pending = undefined;
      } else if (t.v === '}') {
        if (frames.length > 0 && (frames[frames.length - 1] as { depth: number }).depth === depth) frames.pop();
        depth = Math.max(0, depth - 1);
      }
      continue;
    }
    if (t.k !== 'id') continue;
    if (t.v === 'object' && toks[i + 1]?.k === 'id') {
      for (let j = i + 2; j < toks.length && j < i + 12; j++) {
        const u = toks[j] as Tok;
        if (u.k === 'p' && u.v === '{') {
          pending = { name: (toks[i + 1] as Tok).v, at: j };
          break;
        }
        if (u.k === 'p' && (u.v === ';' || u.v === '=' || u.v === '}')) break;
      }
    } else if (t.v === 'val' && frames.length > 0 && (frames[frames.length - 1] as { depth: number }).depth === depth && toks[i + 1]?.k === 'id') {
      let k = i + 2;
      if (isP(toks[k], ':')) {
        while (k < toks.length && k < i + 8 && !isP(toks[k], '=')) k++;
      }
      const val = toks[k + 1];
      if (isP(toks[k], '=') && val?.k === 'str' && wholeValue(toks, k + 1)) {
        const objPath = frames.map((f) => f.name).join('.');
        into.set(`${objPath}.${(toks[i + 1] as Tok).v}`, { raw: val.v, interp: val.interp === true, objPath });
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------------------
// The reader
// ---------------------------------------------------------------------------------------------------------

interface FileCtx {
  rel: string;
  dir: string;
  buildRoot: string;
  toks: Tok[];
  vars: Vars;
}

type Frame = { kind: 'dependencies' | 'excluded' | 'closure' | 'other'; eff: string; base: number };

const EXCLUDED_BLOCKS = new Set(['buildscript', 'plugins', 'pluginManagement', 'constraints']);
const CONTROL = new Set(['if', 'for', 'while', 'when', 'switch', 'catch', 'synchronized']);
/** A call in an argument list that never names a component of the app. */
const SKIP_CALLS = new Set(['platform', 'enforcedPlatform', 'project', 'files', 'fileTree', 'kotlin', 'gradleApi', 'localGroovy', 'gradleTestKit', 'testFixtures']);
const NAMED = new Set(['group', 'name', 'version', 'classifier', 'ext', 'configuration', 'path', 'transitive', 'changing', 'force']);
/** A statement head inside `dependencies {}` that is never a configuration. */
const DENY = new Set([
  'val', 'var', 'def', 'final', 'if', 'else', 'for', 'while', 'return', 'println', 'print', 'apply', 'exclude', 'components', 'modules',
  'constraints', 'attributesSchema', 'dependencies', 'project', 'evaluationDependsOn', 'configurations', 'String', 'class', 'fun', 'import',
]);
const CONT = new Set([',', '.', '=', '+', '-', '*', '/', ':', '?', '(', '[', '->', '&&', '||', '?.', '?:', '::', '%']);
const NOT_CONF = new Set(['get', 'asProvider', 'listOf', 'setOf', 'mapOf', 'arrayOf', 'also', 'let', 'run', 'apply', 'with', 'invoke', 'check', 'require', 'println', 'print', 'if', 'for', 'while', 'when', 'findLibrary', 'findBundle', 'named', 'getByType']);

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** Split `g:a:v` at the colons that are not inside a `${...}`. */
function splitColons(s: string): string[] {
  const out: string[] = [];
  let cur = '';
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i] as string;
    if (c === '$' && s[i + 1] === '{') {
      depth++;
      cur += '${';
      i++;
    } else if (c === '{' && depth > 0) {
      depth++;
      cur += c;
    } else if (c === '}' && depth > 0) {
      depth--;
      cur += c;
    } else if (c === ':' && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

/** Read the dependencies of every Gradle build file in the file list. */
export function readGradle(root: string, files: string[]): ReaderResult {
  const notices: string[] = [];
  const deps: Dependency[] = [];
  let devSkipped = 0;
  let unversioned = 0;
  let nameUnresolved = 0;
  let constants = 0;
  let catalogMissing = 0;

  const fileSet = new Set(files);
  /** One notice per file that could not be read, however many passes tried it. */
  const unreadableFiles = new Set<string>();
  const unreadable = (rel: string): void => {
    if (unreadableFiles.has(rel)) return;
    unreadableFiles.add(rel);
    notices.push(`${rel}: could not be read; skipped`);
  };

  // ---- version catalogs, parsed once up front so a broken one is always reported ----
  const catalogsByDir = new Map<string, Catalog[]>();
  for (const rel of files) {
    const m = /^(?:(.*)\/)?gradle\/[^/]+\.versions\.toml$/.exec(rel);
    if (!m) continue;
    const text = readText(root, rel);
    if (text === undefined) {
      unreadable(rel);
      continue;
    }
    try {
      const cat = parseCatalog(rel, text);
      const dir = m[1] ?? '';
      catalogsByDir.set(dir, [...(catalogsByDir.get(dir) ?? []), cat]);
    } catch (e) {
      notices.push(`${rel}: did not parse (${describeParseError(e, 'TOML', text)}); skipped`);
    }
  }
  const catalogCache = new Map<string, Catalog[]>();
  /** The catalogs of the nearest directory above (or at) `dir` that has any. */
  const catalogsFor = (dir: string): Catalog[] => {
    const hit = catalogCache.get(dir);
    if (hit) return hit;
    let found: Catalog[] = [];
    for (const d of ancestorDirs(dir)) {
      const c = catalogsByDir.get(d);
      if (c) {
        found = c;
        break;
      }
    }
    catalogCache.set(dir, found);
    return found;
  };

  // ---- builds: the directory of each settings file is a build root ----
  const settingsDirs = new Set<string>();
  for (const rel of files) {
    const b = baseName(rel);
    if (b === 'settings.gradle' || b === 'settings.gradle.kts') settingsDirs.add(dirOf(rel));
  }
  /** A module whose directory a settings file moves with `project(':x').projectDir = ...`, mapped to that settings directory. */
  const movedProjects = new Map<string, string>();
  const buildRootOf = (dir: string): string => {
    for (const d of ancestorDirs(dir)) {
      if (settingsDirs.has(d)) return d;
      const moved = movedProjects.get(d);
      if (moved !== undefined) return moved;
    }
    return '';
  };

  // ---- tooling directories: buildSrc, build-logic and every includeBuild("...") ----
  /** Each includeBuild target, with the directory of the settings file that names it. */
  const includedBuilds = new Map<string, string>();
  for (const rel of files) {
    const b = baseName(rel);
    if (b !== 'settings.gradle' && b !== 'settings.gradle.kts') continue;
    const text = readText(root, rel);
    if (text === undefined || !(text.includes('includeBuild') || text.includes('projectDir'))) continue;
    const toks = lex(text);
    for (let i = 0; i < toks.length; i++) {
      if (toks[i]?.k === 'id' && toks[i]?.v === 'projectDir' && isP(toks[i - 1], '.') && isP(toks[i + 1], '=')) {
        // project(':x').projectDir = new File(rootProject.projectDir, '/../libs/x')  |  = file("../libs/x")
        let path: string | undefined;
        for (let k = i + 2; k < toks.length && toks[k]?.line === toks[i]?.line; k++) if (toks[k]?.k === 'str') path = (toks[k] as Tok).v;
        const moved = path === undefined ? undefined : resolveInside(dirOf(rel), path);
        if (moved !== undefined && moved !== '' && moved !== dirOf(rel) && !movedProjects.has(moved)) movedProjects.set(moved, dirOf(rel));
        continue;
      }
      if (toks[i]?.k !== 'id' || toks[i]?.v !== 'includeBuild') continue;
      const arg = isP(toks[i + 1], '(') ? toks[i + 2] : toks[i + 1];
      if (arg?.k !== 'str') continue;
      const target = resolveInside(dirOf(rel), arg.v);
      if (target !== undefined && target !== '') includedBuilds.set(target, dirOf(rel));
    }
  }
  const isTooling = (rel: string): boolean => {
    const segs = rel.split('/');
    for (let i = 0; i < segs.length - 1; i++) if (segs[i] === 'buildSrc' || segs[i] === 'build-logic') return true;
    for (const d of includedBuilds.keys()) if (rel.startsWith(`${d}/`)) return true;
    return false;
  };
  /** The directory a tooling file belongs to: its buildSrc or build-logic directory, or its includeBuild target. */
  const toolingRootOf = (rel: string): string | undefined => {
    const segs = rel.split('/');
    for (let i = 0; i < segs.length - 1; i++) if (segs[i] === 'buildSrc' || segs[i] === 'build-logic') return segs.slice(0, i + 1).join('/');
    for (const d of includedBuilds.keys()) if (rel.startsWith(`${d}/`)) return d;
    return undefined;
  };

  // ---- constants declared in objects of the tooling sources, by tooling directory ----
  const constsByRoot = new Map<string, Map<string, ConstEntry>>();
  for (const rel of files) {
    const b = baseName(rel);
    if (!(b.endsWith('.kt') || b.endsWith('.kts')) || b === 'settings.gradle.kts' || !isTooling(rel)) continue;
    try {
      const text = readText(root, rel);
      if (text === undefined || !text.includes('object')) continue;
      const r = toolingRootOf(rel);
      if (r === undefined) continue;
      let m = constsByRoot.get(r);
      if (!m) constsByRoot.set(r, (m = new Map()));
      collectConsts(lex(text), m);
    } catch {
      unreadable(rel);
    }
  }
  const constRootsCache = new Map<string, string[]>();
  /** The tooling directories whose constants a build file can see, nearest first. */
  const constRootsFor = (dir: string): string[] => {
    const hit = constRootsCache.get(dir);
    if (hit) return hit;
    const out: string[] = [];
    const br = buildRootOf(dir);
    for (const d of [...ancestorDirs(dir), br]) {
      for (const name of ['buildSrc', 'build-logic']) {
        const r = joinRel(d, name);
        if (constsByRoot.has(r) && !out.includes(r)) out.push(r);
      }
    }
    for (const [target, settingsDir] of includedBuilds) if (settingsDir === br && constsByRoot.has(target)) out.push(target);
    constRootsCache.set(dir, out);
    return out;
  };
  const constMemo = new Map<string, string | null>();
  const constVisiting = new Set<string>();
  const expandConst = (raw: string, rootDir: string, objPath: string, depth: number): string | undefined =>
    expandPlaceholders(raw, depth, (name) => resolveConst(rootDir, `${objPath}.${name}`, depth) ?? resolveConst(rootDir, name, depth));
  const resolveConst = (rootDir: string, path: string, depth: number): string | undefined => {
    const e = constsByRoot.get(rootDir)?.get(path);
    if (!e) return undefined;
    if (!e.interp) return e.raw.includes('$') ? undefined : e.raw;
    const key = `${rootDir}\0${path}`;
    const cached = constMemo.get(key);
    if (cached !== undefined) return cached ?? undefined;
    if (constVisiting.has(key)) return undefined;
    constVisiting.add(key);
    const out = expandConst(e.raw, rootDir, e.objPath, depth + 1);
    constVisiting.delete(key);
    constMemo.set(key, out ?? null);
    return out;
  };

  // ---- per-file contexts and properties ----
  const ctxCache = new Map<string, FileCtx | null>();
  const ctxOf = (rel: string): FileCtx | undefined => {
    const hit = ctxCache.get(rel);
    if (hit !== undefined) return hit ?? undefined;
    const text = fileSet.has(rel) ? readText(root, rel) : undefined;
    if (text === undefined) {
      ctxCache.set(rel, null);
      return undefined;
    }
    const toks = lex(text);
    const ctx: FileCtx = { rel, dir: dirOf(rel), buildRoot: buildRootOf(dirOf(rel)), toks, vars: collectVars(toks) };
    ctxCache.set(rel, ctx);
    return ctx;
  };
  const rootBuildFile = (buildRoot: string): FileCtx | undefined => ctxOf(joinRel(buildRoot, 'build.gradle')) ?? ctxOf(joinRel(buildRoot, 'build.gradle.kts'));
  const propsCache = new Map<string, Map<string, string>>();
  const propsAt = (dir: string): Map<string, string> => {
    const hit = propsCache.get(dir);
    if (hit) return hit;
    const rel = joinRel(dir, 'gradle.properties');
    const text = fileSet.has(rel) ? readText(root, rel) : undefined;
    const props = text === undefined ? new Map<string, string>() : parseProperties(text);
    propsCache.set(dir, props);
    return props;
  };

  // ---- variable expansion: bounded, memoized, cycle-checked ----
  const memo = new Map<string, string | null>();
  const visiting = new Set<string>();

  const catalogVersion = (ctx: FileCtx, catalog: string, key: string): string | undefined => {
    const cat = catalogsFor(ctx.dir).find((c) => c.name === catalog);
    return cat?.versions.get(key) ?? cat?.versions.get(normAlias(key));
  };

  const lookupVar = (rawName: string, ctx: FileCtx, line: number, depth: number): string | undefined => {
    let name = rawName;
    for (;;) {
      const m = /^(?:project|rootProject|ext|extra|properties|gradle\.ext)\./.exec(name);
      if (!m) break;
      name = name.slice(m[0].length);
    }
    const rootCtx = rootBuildFile(ctx.buildRoot);
    for (const c of rootCtx && rootCtx.rel !== ctx.rel ? [ctx, rootCtx] : [ctx]) {
      const list = c.vars.get(name);
      if (!list) continue;
      // The latest definition at or before the use, else the first.
      let pick = list[0] as VarEntry;
      for (const e of list) if (e.line <= line) pick = e;
      if (!pick.interp) return pick.raw;
      const key = `${c.rel}\0${name}\0${pick.line}`;
      const cached = memo.get(key);
      if (cached !== undefined) return cached ?? undefined;
      if (visiting.has(key)) return undefined;
      visiting.add(key);
      const out = expand(pick.raw, c, pick.line, depth + 1);
      visiting.delete(key);
      memo.set(key, out ?? null);
      return out;
    }
    const fromProps = propsAt(ctx.dir).get(name) ?? propsAt(ctx.buildRoot).get(name);
    return fromProps;
  };

  const PROP_CALL = /^(?:(?:project|rootProject)\.)?(?:findProperty|property)\(\s*["']([^"']+)["']\s*\)(?:\s*(?:as\??\s*String|\.toString\(\)))?$/;
  const CATALOG_VERSION = /^([A-Za-z_]\w*)\.versions\.([\w.]+?)(?:\.get\(\))?$/;

  /** The text with every `$name` and `${name}` replaced, or undefined when one cannot be. */
  const expand = (raw: string, ctx: FileCtx, line: number, depth: number): string | undefined =>
    expandPlaceholders(
      raw,
      depth,
      (name) => lookupVar(name, ctx, line, depth),
      (e) => {
        const pc = PROP_CALL.exec(e);
        if (pc) return lookupVar(pc[1] as string, ctx, line, depth);
        const cv = CATALOG_VERSION.exec(e);
        return cv ? catalogVersion(ctx, cv[1] as string, cv[2] as string) : undefined;
      },
    );

  const valueOf = (t: Tok, ctx: FileCtx): string | undefined => (t.interp ? expand(t.v, ctx, t.line, 0) : t.v.includes('$') || t.v.includes('\u0001') ? undefined : t.v);

  // ---- recording ----
  const record = (conf: string, lib: LibRef, rel: string, line: number, tooling: boolean, seen: Set<string>): void => {
    if (tooling || isDevConf(conf)) {
      devSkipped++;
      return;
    }
    const key = `${lib.name}@${lib.version ?? ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    deps.push({ ecosystem: 'maven', name: lib.name, ...(lib.version !== undefined ? { version: lib.version } : {}), manifest: `${rel}:${line}` });
    if (lib.version === undefined) unversioned++;
  };

  /** A `group:artifact[:version][:classifier][@ext]` string. */
  const coordinate = (t: Tok, ctx: FileCtx, expander?: (s: string) => string | undefined): { lib?: LibRef; shape: boolean } => {
    const parts = splitColons(t.v);
    if (parts.length < 2 || parts[0] === '' || parts[1] === '') return { shape: false };
    const expandPart =
      expander ?? ((s: string): string | undefined => (t.interp ? expand(s, ctx, t.line, 0) : s.includes('$') || s.includes('\u0001') ? undefined : s));
    const group = expandPart(parts[0] as string);
    const artifact = expandPart(parts[1] as string);
    if (group === undefined || artifact === undefined || !NAME_RE.test(group) || !NAME_RE.test(artifact)) return { shape: true };
    let version = parts[2] === undefined ? undefined : expandPart(parts[2]);
    if (version !== undefined) version = version.replace(/@.*$/, '');
    if (version === undefined || version === '' || !VERSION_RE.test(version)) version = undefined;
    return { shape: true, lib: { name: `${group}:${artifact}`, ...(version !== undefined ? { version } : {}) } };
  };

  /** A catalog accessor path or an alias, resolved against the catalogs above `dir`. */
  const fromCatalog = (kind: 'path' | 'lib' | 'bundle', segs: string[], dir: string): LibRef[] | 'ignore' | 'missing' => {
    const cats = catalogsFor(dir);
    let cat: Catalog | undefined;
    let rest: string[];
    if (kind === 'path') {
      cat = cats.find((c) => c.name === segs[0]);
      rest = segs.slice(1);
      if (rest[0] === 'versions' || rest[0] === 'plugins') return 'ignore';
      if (!cat) return 'missing';
    } else {
      rest = segs;
    }
    const isBundle = kind === 'bundle' || (kind === 'path' && rest[0] === 'bundles');
    const alias = normAlias((kind === 'path' && isBundle ? rest.slice(1) : rest).join('.'));
    const searched = cat ? [cat] : cats;
    for (const c of searched) {
      if (isBundle) {
        const members = c.bundles.get(alias);
        if (!members) continue;
        return members.map((m) => c.libs.get(m)).filter((x): x is LibRef => x !== undefined);
      }
      const lib = c.libs.get(alias);
      if (lib) return [lib];
    }
    return 'missing';
  };

  // ---- the walk over one build file ----
  const readBuildFile = (rel: string): void => {
    const ctx = ctxOf(rel);
    if (!ctx) {
      unreadable(rel);
      return;
    }
    const toks = ctx.toks;
    const tooling = isTooling(rel);
    const seen = new Set<string>();
    const stack: Frame[] = [];
    const openStack: number[] = [];
    const closeToOpen = new Map<number, number>();
    let excluded = 0;

    const classify = (i: number): Frame['kind'] => {
      const p = toks[i - 1];
      if (!p) return 'other';
      if (p.k === 'p' && p.v === ')') {
        const open = closeToOpen.get(i - 1);
        const head = open === undefined ? undefined : toks[open - 1];
        return head && head.k === 'id' && CONTROL.has(head.v) ? 'other' : 'closure';
      }
      if ((p.k === 'p' && p.v === ',') || p.k === 'str') return 'closure';
      if (p.k === 'id') {
        if (p.v === 'dependencies') return 'dependencies';
        if (EXCLUDED_BLOCKS.has(p.v)) return 'excluded';
      }
      return 'other';
    };

    const matchClose = (open: number): number => {
      let depth = 0;
      for (let k = open; k < toks.length && k < open + MAX_LOOKAHEAD; k++) {
        const t = toks[k] as Tok;
        if (t.k !== 'p') continue;
        if (t.v === '(' || t.v === '[' || t.v === '{') depth++;
        else if (t.v === ')' || t.v === ']' || t.v === '}') {
          depth--;
          if (depth === 0) return t.v === ')' ? k : -1;
        }
      }
      return -1;
    };

    /** The end (exclusive) of a command-style argument list that starts at `s`. */
    const commandEnd = (s: number): number => {
      let depth = 0;
      for (let k = s; k < toks.length && k < s + MAX_LOOKAHEAD; k++) {
        const t = toks[k] as Tok;
        const prev = toks[k - 1] as Tok;
        if (depth === 0 && k > s) {
          if (t.k === 'p' && (t.v === '{' || t.v === '}' || t.v === ';')) return k;
          if (t.line > prev.line && !(prev.k === 'p' && CONT.has(prev.v))) return k;
        }
        if (t.k === 'p') {
          if (t.v === '(' || t.v === '[') depth++;
          else if (t.v === ')' || t.v === ']') depth = Math.max(0, depth - 1);
          else if (depth > 0 && t.v === '{') depth++;
          else if (depth > 1 && t.v === '}') depth--;
        }
      }
      return Math.min(toks.length, s + MAX_LOOKAHEAD);
    };

    const split = (s: number, e: number): [number, number][] => {
      const out: [number, number][] = [];
      let depth = 0;
      let start = s;
      for (let k = s; k < e; k++) {
        const t = toks[k] as Tok;
        if (t.k !== 'p') continue;
        if (t.v === '(' || t.v === '[' || t.v === '{') depth++;
        else if (t.v === ')' || t.v === ']' || t.v === '}') depth--;
        else if (t.v === ',' && depth === 0) {
          out.push([start, k]);
          start = k + 1;
        }
      }
      out.push([start, e]);
      return out.filter(([a, b]) => b > a);
    };

    const countable = (conf: string): boolean => !tooling && !isDevConf(conf);

    const handleLookup = (conf: string, kind: 'path' | 'lib' | 'bundle', segs: string[], line: number): void => {
      const r = fromCatalog(kind, segs, ctx.dir);
      if (r === 'ignore') return;
      if (r === 'missing') {
        if (countable(conf)) catalogMissing++;
        return;
      }
      for (const lib of r) record(conf, lib, rel, line, tooling, seen);
    };

    const handleArgs = (conf: string, s: number, e: number): void => {
      const named = new Map<string, [number, number]>();
      for (const [a, b] of split(s, e)) {
        const first = toks[a] as Tok;
        const second = toks[a + 1];
        if (first.k === 'id' && NAMED.has(first.v) && second !== undefined && second.k === 'p' && (second.v === ':' || second.v === '=')) {
          named.set(first.v, [a + 2, b]);
          continue;
        }
        positional(conf, a, b);
      }
      const nameRange = named.get('name');
      const groupRange = named.get('group');
      if (nameRange && groupRange) {
        const text = (r: [number, number]): string | undefined => {
          const t = toks[r[0]] as Tok | undefined;
          if (!t || r[1] - r[0] !== 1) return undefined;
          if (t.k === 'str') return valueOf(t, ctx);
          if (t.k === 'id') return lookupVar(t.v, ctx, t.line, 0);
          return undefined;
        };
        const group = text(groupRange);
        const artifact = text(nameRange);
        const vr = named.get('version');
        let version = vr ? text(vr) : undefined;
        if (version !== undefined && !VERSION_RE.test(version)) version = undefined;
        const line = (toks[nameRange[0]] as Tok | undefined)?.line ?? (toks[groupRange[0]] as Tok).line;
        if (group === undefined || artifact === undefined || !NAME_RE.test(group) || !NAME_RE.test(artifact)) {
          if (countable(conf)) nameUnresolved++;
        } else {
          record(conf, { name: `${group}:${artifact}`, ...(version !== undefined ? { version } : {}) }, rel, line, tooling, seen);
        }
      }
    };

    const positional = (conf: string, a: number, b: number): void => {
      const first = toks[a] as Tok;
      const len = b - a;
      if (first.k === 'str' && len === 1) {
        const c = coordinate(first, ctx);
        if (c.lib) record(conf, c.lib, rel, first.line, tooling, seen);
        else if (c.shape && countable(conf)) nameUnresolved++;
        return;
      }
      if (isP(first, '[')) {
        for (let k = a + 1; k < b; k++) {
          const t = toks[k] as Tok;
          if (t.k !== 'str') continue;
          const before = toks[k - 1];
          const after = toks[k + 1];
          if (!(isP(before, '[') || isP(before, ',')) || !(isP(after, ',') || isP(after, ']'))) continue;
          const c = coordinate(t, ctx);
          if (c.lib) record(conf, c.lib, rel, t.line, tooling, seen);
          else if (c.shape && countable(conf)) nameUnresolved++;
        }
        return;
      }
      if (first.k !== 'id') return;
      if (isP(toks[a + 1], '(') && SKIP_CALLS.has(first.v)) return;
      // libs.findLibrary("x").get() and its kin
      for (let k = a; k + 3 < b; k++) {
        const t = toks[k] as Tok;
        if (t.k === 'id' && (t.v === 'findLibrary' || t.v === 'findBundle') && isP(toks[k + 1], '(') && toks[k + 2]?.k === 'str' && isP(toks[k + 3], ')')) {
          handleLookup(conf, t.v === 'findLibrary' ? 'lib' : 'bundle', [(toks[k + 2] as Tok).v], t.line);
          return;
        }
      }
      // An accessor: id(.id)* with an optional trailing .get() or .asProvider()
      const segs: string[] = [];
      let k = a;
      let shaped = false;
      for (;;) {
        const t = toks[k] as Tok | undefined;
        if (k >= b || !t || t.k !== 'id') break;
        segs.push(t.v);
        k++;
        if (k < b && isP(toks[k], '.') && toks[k + 1]?.k === 'id') {
          k++;
          continue;
        }
        shaped = true;
        break;
      }
      if (!shaped) return;
      if (k < b) {
        // a trailing call: only get() and asProvider() are accessor syntax
        const last = segs[segs.length - 1];
        if (!(segs.length >= 2 && (last === 'get' || last === 'asProvider') && isP(toks[k], '(') && isP(toks[k + 1], ')') && k + 2 === b)) return;
        segs.pop();
      } else if (isP(toks[b - 1], ')')) {
        return;
      }
      // `projects.core.model` is a type-safe accessor for a module of this same build.
      if (segs[0] === 'projects' && !catalogsFor(ctx.dir).some((c) => c.name === 'projects')) return;
      const known = segs[0] === 'libs' || catalogsFor(ctx.dir).some((c) => c.name === segs[0]);
      if (known && segs.length >= 2) {
        handleLookup(conf, 'path', segs, first.line);
        return;
      }
      // `Libs.OKHTTP`, `Libs.Group.OKHTTP`: a string constant declared in an object of buildSrc or build-logic.
      if (segs.length >= 2) {
        const path = segs.join('.');
        for (const r of constRootsFor(ctx.dir)) {
          const entry = constsByRoot.get(r)?.get(path);
          if (!entry) continue;
          const c = coordinate({ k: 'str', v: entry.raw, line: first.line }, ctx, (part) => expandConst(part, r, entry.objPath, 0));
          if (c.lib) record(conf, c.lib, rel, first.line, tooling, seen);
          else if (c.shape && countable(conf)) nameUnresolved++;
          return;
        }
      }
      if (countable(conf) && !['true', 'false', 'null'].includes(first.v)) {
        constants++;
      }
    };

    const tryDecl = (i: number): void => {
      const h = toks[i] as Tok;
      const nx = toks[i + 1];
      if (!nx || (h.k !== 'id' && h.k !== 'str')) return;
      if (h.k === 'id' && DENY.has(h.v)) return;
      if (isP(nx, '(')) {
        const close = matchClose(i + 1);
        if (close < 0) return;
        if (h.k === 'id' && h.v === 'add') {
          const c = toks[i + 2];
          if (c?.k === 'str' && isP(toks[i + 3], ',')) handleArgs(c.v, i + 4, close);
          return;
        }
        handleArgs(h.v, i + 2, close);
        return;
      }
      if (h.k !== 'id' || nx.line !== h.line) return;
      if (!(nx.k === 'str' || nx.k === 'id' || isP(nx, '['))) return;
      if (nx.k === 'id' && isP(toks[i + 2], '=')) return;
      handleArgs(h.v, i + 1, commandEnd(i + 1));
    };

    for (let i = 0; i < toks.length; i++) {
      const t = toks[i] as Tok;
      const top = stack[stack.length - 1];
      if (t.k === 'p') {
        if (t.v === '(' || t.v === '[') {
          openStack.push(i);
          continue;
        }
        if (t.v === ')' || t.v === ']') {
          const o = openStack.pop();
          if (o !== undefined) closeToOpen.set(i, o);
          continue;
        }
        if (t.v === '{') {
          const kind = classify(i);
          const eff = kind === 'other' ? (top?.eff ?? 'root') : kind;
          stack.push({ kind, eff, base: openStack.length });
          if (kind === 'excluded') excluded++;
          continue;
        }
        if (t.v === '}') {
          const f = stack.pop();
          if (f) {
            if (f.kind === 'excluded') excluded--;
            if (openStack.length > f.base) openStack.length = f.base;
          }
          continue;
        }
      }
      if (excluded > 0 || top === undefined || top.eff !== 'dependencies' || openStack.length !== top.base) continue;
      const prev = toks[i - 1];
      const stmtStart = prev === undefined || (prev.k === 'p' && (prev.v === '{' || prev.v === '}' || prev.v === ';')) || (t.line > prev.line && !(prev.k === 'p' && CONT.has(prev.v)));
      if (stmtStart) tryDecl(i);
    }
  };

  // ---- convention plugin sources: findLibrary("alias") and findBundle("alias") ----
  const readConventionSource = (rel: string): void => {
    const text = readText(root, rel);
    if (text === undefined || !(text.includes('findLibrary') || text.includes('findBundle'))) return;
    const toks = lex(text);
    const dir = dirOf(rel);
    const seen = new Set<string>();

    /** The configuration a lookup feeds: 'skip' for a platform, a name, or undefined when none is on the way out. */
    const confAround = (j: number): string | undefined => {
      let depth = 0;
      for (let k = j - 1; k >= 0 && k >= j - MAX_LOOKBACK; k--) {
        const t = toks[k] as Tok;
        if (t.k !== 'p') continue;
        if (t.v === ')' || t.v === ']') depth++;
        else if (t.v === '(' || t.v === '[') {
          if (depth > 0) {
            depth--;
            continue;
          }
          const head = toks[k - 1];
          if (head?.k === 'id') {
            if (head.v === 'platform' || head.v === 'enforcedPlatform') return 'skip';
            const first = toks[k + 1];
            if (head.v === 'add' && first?.k === 'str' && isP(toks[k + 2], ',')) return first.v;
            if (!NOT_CONF.has(head.v) && /^[a-z][A-Za-z0-9]*$/.test(head.v)) return head.v;
          } else if (head?.k === 'str') return head.v;
        } else if (depth === 0 && (t.v === '{' || t.v === '}' || t.v === ';')) break;
      }
      return undefined;
    };

    for (let j = 0; j + 3 < toks.length; j++) {
      const t = toks[j] as Tok;
      if (t.k !== 'id' || (t.v !== 'findLibrary' && t.v !== 'findBundle')) continue;
      if (!isP(toks[j + 1], '(') || toks[j + 2]?.k !== 'str' || !isP(toks[j + 3], ')')) continue;
      let conf = confAround(j);
      if (conf === undefined) {
        // val bom = libs.findLibrary("x").get()  ... "implementation"(platform(bom))
        let s = j - 1;
        while (s >= 0 && s > j - 12 && !(toks[s]?.k === 'id' && (toks[s]?.v === 'val' || toks[s]?.v === 'var') && toks[s + 1]?.k === 'id' && isP(toks[s + 2], '='))) s--;
        if (s >= 0 && s > j - 12 && toks[s]?.line !== undefined) {
          const name = (toks[s + 1] as Tok).v;
          const uses: string[] = [];
          for (let k = j + 4; k < toks.length && k < j + MAX_LOOKAHEAD; k++) {
            if (toks[k]?.k === 'id' && toks[k]?.v === name && !isP(toks[k - 1], '.')) uses.push(confAround(k) ?? 'implementation');
          }
          if (uses.length > 0 && uses.every((u) => u === 'skip')) continue;
          conf = uses.find((u) => u !== 'skip');
        }
      }
      if (conf === 'skip') continue;
      const kind = t.v === 'findLibrary' ? 'lib' : 'bundle';
      const r = fromCatalog(kind, [(toks[j + 2] as Tok).v], dir);
      const effective = conf ?? 'implementation';
      if (r === 'ignore') continue;
      if (r === 'missing') {
        if (!isDevConf(effective)) catalogMissing++;
        continue;
      }
      for (const lib of r) record(effective, lib, rel, t.line, false, seen);
    }
  };

  for (const rel of files) {
    const b = baseName(rel);
    // One file that cannot be read must not cost the scan every other file's rows.
    try {
      if (b === 'build.gradle' || b === 'build.gradle.kts') {
        readBuildFile(rel);
      } else if ((b.endsWith('.kt') || b.endsWith('.kts')) && b !== 'settings.gradle.kts' && isTooling(rel)) {
        readConventionSource(rel);
      }
    } catch {
      unreadable(rel);
    }
  }

  if (unversioned > 0) {
    notices.push(
      `${unversioned} Gradle ${plural(unversioned, 'dependency has', 'dependencies have')} no version lexcode can read (a platform BOM, a plugin or a computed value); recorded without a version`,
    );
  }
  if (nameUnresolved > 0) {
    notices.push(
      `${nameUnresolved} Gradle ${plural(nameUnresolved, 'dependency names its', 'dependencies name their')} group or artifact through a value lexcode cannot read; skipped`,
    );
  }
  if (constants > 0) {
    notices.push(
      `${constants} Gradle ${plural(constants, 'dependency is', 'dependencies are')} named by a constant or variable lexcode does not evaluate; not recorded`,
    );
  }
  if (catalogMissing > 0) {
    notices.push(
      `${catalogMissing} Gradle catalog ${plural(catalogMissing, 'reference names', 'references name')} no library in a version catalog lexcode can read; skipped`,
    );
  }
  return { deps, devSkipped, notices };
}
