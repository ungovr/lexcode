import type { Dependency } from '../types.js';
import {
  ancestorDirs,
  baseName,
  dirOf,
  joinRel,
  opensRubyBlock,
  readText,
  resolveInside,
  rubyLines,
  splitRubyStatements,
  stripRubyComment,
  type ReaderResult,
} from './util.js';

/**
 * The gem ecosystem: `Gemfile` (or `gems.rb`), `Gemfile.lock` (or `gems.locked`) and `*.gemspec`.
 * Nothing is evaluated: a Gemfile is Ruby, so it is read line by line for its groups and line numbers,
 * and the lockfile is the authority on which gems are direct and at what version (a Gemfile that builds
 * its gem list in code, as Canvas's does, still has every direct gem in the lockfile's DEPENDENCIES).
 */

const DEV_GROUPS = new Set(['development', 'test']);
const NAMED_LIMIT = 10;

interface GemRef {
  name: string;
  /** POSIX path ':' line. */
  manifest: string;
  dev: boolean;
}

interface Lock {
  rel: string;
  /** Version by gem name, the platform suffix dropped; the first spec of a name wins. */
  specs: Map<string, string>;
  direct: { name: string; line: number }[];
}

/** Names in a group argument list or a `group:` option value: symbols, strings, `%i[...]` words. */
function groupNames(text: string): string[] {
  return [...text.replace(/%[iw]/g, '').matchAll(/(?<![\w:]):([A-Za-z_]\w*)|["']([A-Za-z_]\w*)["']|\b([A-Za-z_]\w*)\b/g)].map(
    (m) => (m[1] ?? m[2] ?? m[3]) as string,
  );
}

interface ParsedGemfile {
  gems: GemRef[];
  /** Literal `eval_gemfile "path"` targets. */
  evals: string[];
  /** Literal `path:` of a `gemspec` line: the directory whose gemspecs the Gemfile pulls in. */
  gemspecPaths: string[];
}

/** A `gem "name", ...` call, or undefined. Its groups are the enclosing blocks' plus its own `group:` option. */
function gemRef(code: string, rel: string, lineNo: number, outer: string[]): GemRef | undefined {
  const gem = /^gem\s*\(?\s*(["'])([^"']+)\1(.*)$/.exec(code);
  if (!gem) return undefined;
  const opt = /(?:\bgroups?\s*:|:groups?\s*=>)\s*(\[[^\]]*\]|%[iw]\[[^\]]*\]|%[iw]\([^)]*\)|:\w+|"\w+"|'\w+')/.exec(gem[3] as string);
  const groups = [...outer, ...(opt ? groupNames(opt[1] as string) : [])];
  return { name: gem[2] as string, manifest: `${rel}:${lineNo}`, dev: groups.length > 0 && groups.every((g) => DEV_GROUPS.has(g)) };
}

/** The group names a `group ... do` head names; any other block head names none. */
function blockGroups(head: string): string[] {
  const g = /^group\b\s*\(?(.*?)\)?\s*$/.exec(head.trim());
  return g ? groupNames(g[1] as string).filter((n) => n !== 'optional' && n !== 'true' && n !== 'false') : [];
}

function parseGemfile(rel: string, text: string): ParsedGemfile {
  const gems: GemRef[] = [];
  const evals: string[] = [];
  const gemspecPaths: string[] = [];
  const stack: string[][] = [];

  const statement = (code: string, lineNo: number): void => {
    const gem = gemRef(code, rel, lineNo, stack.flat());
    if (gem) {
      gems.push(gem);
      return;
    }
    const ev = /^eval_gemfile\s*\(?\s*(["'])([^"']+)\1/.exec(code);
    if (ev) {
      evals.push(ev[2] as string);
      return;
    }
    const gs = /^gemspec\b(.*)$/.exec(code);
    if (gs) {
      const p = /(?:\bpath\s*:|:path\s*=>)\s*(["'])([^"']+)\1/.exec(gs[1] as string);
      if (p) gemspecPaths.push(p[2] as string);
      return;
    }
    if (/^end\b/.test(code)) {
      stack.pop();
      // `end.each do |x|` closes one block and opens the next.
      if (/\bdo(?:\s*\|[^|]*\|)?$/.test(code)) stack.push([]);
      return;
    }
    // A one-line block, `group :test do gem "x" end` or `platforms :jruby do gem "y"; gem "z" end`: its gems
    // take the block's groups, and it leaves the stack as it found it.
    const one = /^(\S.*?)\s+do\b(?:\s*\|[^|]*\|)?\s*(.*?)\s*\bend$/.exec(code);
    if (one) {
      const outer = [...stack.flat(), ...blockGroups(one[1] as string)];
      for (const piece of splitRubyStatements(one[2] as string)) {
        const g = gemRef(piece, rel, lineNo, outer);
        if (g) gems.push(g);
      }
      return;
    }
    if (opensRubyBlock(code)) {
      const g = /^(.*?)\bdo\b/.exec(code);
      stack.push(g ? blockGroups(g[1] as string) : []);
    }
  };

  // A gem or group call that runs on over several lines is read as one; a line of `;`-separated statements,
  // `gem "a"; gem "b"`, is read statement by statement (#13511).
  for (const { code, line: lineNo } of rubyLines(text, /^(?:gem|group)\b/)) {
    for (const piece of splitRubyStatements(code)) statement(piece, lineNo);
  }
  return { gems, evals, gemspecPaths };
}

interface ParsedGemspec {
  name?: string;
  runtime: { name: string; manifest: string }[];
  dev: string[];
}

/** A string literal's text: `"x"`, `'x'`, or the `%q<x>` / `%q(x)` / `%q{x}` / `%q[x]` forms generated gemspecs use. */
const STR = String.raw`(?:"([^"]+)"|'([^']+)'|%[qQ]<([^>]+)>|%[qQ]\(([^)]+)\)|%[qQ]\{([^}]+)\}|%[qQ]\[([^\]]+)\])`;
const NAME_RE = new RegExp(String.raw`\.name\s*=\s*` + STR);
const DEP_RE = new RegExp(String.raw`\.add_(runtime_|development_)?dependency\s*\(?\s*` + STR);

function strText(m: RegExpExecArray, from: number): string {
  for (let k = from; k < from + 6; k++) if (m[k] !== undefined) return m[k] as string;
  return '';
}

function parseGemspec(rel: string, text: string): ParsedGemspec {
  const out: ParsedGemspec = { runtime: [], dev: [] };
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    let code = stripRubyComment(lines[i] as string);
    const nm = NAME_RE.exec(code);
    if (nm && out.name === undefined) out.name = strText(nm, 1);
    // `s.add_dependency(` with its arguments on the lines below: read the first argument line with it.
    if (/\.add_(?:runtime_|development_)?dependency\s*\(\s*$/.test(code)) {
      for (let j = i + 1; j < lines.length; j++) {
        const next = stripRubyComment(lines[j] as string).trim();
        if (next === '') continue;
        code += next;
        break;
      }
    }
    const dep = DEP_RE.exec(code);
    if (!dep) continue;
    const name = strText(dep, 2);
    if (dep[1] === 'development_') out.dev.push(name);
    else out.runtime.push({ name, manifest: `${rel}:${i + 1}` });
  }
  return out;
}

const LOCK_SPEC_SECTIONS = new Set(['GEM', 'GIT', 'PATH', 'PLUGIN SOURCE']);

/** Parse one lockfile. Throws on a merge conflict, or on text that holds no section a lockfile has. */
function parseLockfile(rel: string, text: string): Lock {
  const lock: Lock = { rel, specs: new Map(), direct: [] };
  let section = '';
  let inSpecs = false;
  let recognized = false;
  text.split(/\r?\n/).forEach((line, i) => {
    if (/^(?:<<<<<<<|=======|>>>>>>>)/.test(line)) throw new Error(`a merge conflict marker on line ${i + 1}`);
    if (/^\S/.test(line)) {
      section = line.trim();
      inSpecs = false;
      if (LOCK_SPEC_SECTIONS.has(section) || section === 'DEPENDENCIES') recognized = true;
      return;
    }
    if (LOCK_SPEC_SECTIONS.has(section)) {
      if (/^ {2}specs:\s*$/.test(line)) inSpecs = true;
      else if (inSpecs) {
        const m = /^ {4}([^\s(]+) \(([^)]+)\)\s*$/.exec(line);
        if (m && !lock.specs.has(m[1] as string)) lock.specs.set(m[1] as string, (m[2] as string).split('-')[0] as string);
      }
    } else if (section === 'DEPENDENCIES') {
      const m = /^ {2}([^\s(!]+)/.exec(line);
      if (m) lock.direct.push({ name: m[1] as string, line: i + 1 });
    }
  });
  if (!recognized) throw new Error('no GEM, PATH or DEPENDENCIES section');
  return lock;
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/**
 * Read the direct gems of every Gemfile and gemspec in the file list. The versions are the lockfile's;
 * development and test groups, and gemspec development dependencies, are skipped and counted.
 */
export function readRuby(root: string, files: string[]): ReaderResult {
  const fileSet = new Set(files);
  const deps: Dependency[] = [];
  const notices: string[] = [];
  let devSkipped = 0;

  const locks = new Map<string, Lock | undefined>();
  const loadLock = (rel: string): Lock | undefined => {
    if (locks.has(rel)) return locks.get(rel);
    let lock: Lock | undefined;
    const text = readText(root, rel);
    if (text === undefined) notices.push(`${rel}: could not be read; versions from it are unavailable`);
    else {
      try {
        lock = parseLockfile(rel, text);
      } catch (e) {
        notices.push(`${rel}: did not parse (${e instanceof Error ? e.message : String(e)}); versions from it are unavailable`);
      }
    }
    locks.set(rel, lock);
    return lock;
  };

  const gemspecsByDir = new Map<string, string[]>();
  for (const f of files) {
    if (!f.endsWith('.gemspec')) continue;
    const d = dirOf(f);
    gemspecsByDir.set(d, [...(gemspecsByDir.get(d) ?? []), f]);
  }
  const claimedDirs = new Set<string>();

  // What a gemspec adds to the gems of its group; the group's lockfile gives the versions.
  const readGemspecs = (specFiles: string[], lock: Lock | undefined, recorded: Map<string, Dependency>, devNames: Set<string>): void => {
    for (const rel of specFiles) {
      const text = readText(root, rel);
      if (text === undefined) {
        notices.push(`${rel}: could not be read; skipped`);
        continue;
      }
      const spec = parseGemspec(rel, text);
      for (const d of spec.runtime) {
        if (recorded.has(d.name)) continue;
        const version = lock?.specs.get(d.name);
        recorded.set(d.name, { ecosystem: 'gem', name: d.name, ...(version !== undefined ? { version } : {}), manifest: d.manifest });
      }
      for (const n of spec.dev) devNames.add(n);
    }
  };

  const gemfiles = files.filter((f) => baseName(f) === 'Gemfile' || baseName(f) === 'gems.rb');
  for (const gf of gemfiles) {
    const dir = dirOf(gf);
    const lockRel = joinRel(dir, baseName(gf) === 'gems.rb' ? 'gems.locked' : 'Gemfile.lock');
    const lockName = baseName(lockRel);

    // The Gemfile, the literal eval_gemfile targets it reaches, and Gemfile.d when it names that directory.
    const queue = [gf];
    const rootText = readText(root, gf);
    if (rootText !== undefined && rootText.includes('Gemfile.d')) {
      const prefix = joinRel(dir, 'Gemfile.d/');
      queue.push(...files.filter((f) => f.startsWith(prefix) && f.endsWith('.rb') && !f.slice(prefix.length).includes('/')).sort());
    }
    const seen = new Set<string>();
    const gems: GemRef[] = [];
    const specDirs = new Set<string>([dir]);
    for (let q = 0; q < queue.length; q++) {
      const rel = queue[q] as string;
      if (seen.has(rel)) continue;
      seen.add(rel);
      const text = rel === gf ? rootText : readText(root, rel);
      if (text === undefined) {
        notices.push(`${rel}: could not be read; skipped`);
        continue;
      }
      const parsed = parseGemfile(rel, text);
      gems.push(...parsed.gems);
      for (const p of parsed.gemspecPaths) {
        const d = resolveInside(dirOf(rel), p);
        if (d !== undefined) specDirs.add(d);
      }
      for (const target of parsed.evals) {
        const abs = resolveInside(dirOf(rel), target);
        if (abs !== undefined && fileSet.has(abs)) queue.push(abs);
      }
    }

    const lockPresent = fileSet.has(lockRel);
    const lock = lockPresent ? loadLock(lockRel) : undefined;
    const byName = new Map<string, { prod?: GemRef; dev: boolean }>();
    for (const g of gems) {
      const rec = byName.get(g.name) ?? { dev: false };
      if (g.dev) rec.dev = true;
      else rec.prod ??= g;
      byName.set(g.name, rec);
    }

    const recorded = new Map<string, Dependency>();
    const absent: string[] = [];
    // A gem the lockfile lists under DEPENDENCIES is in it even with no spec: one resolved for no locked
    // platform (tzinfo-data on Linux) and `bundler` never have one.
    const direct = new Set((lock?.direct ?? []).map((d) => d.name));
    for (const [name, rec] of byName) {
      if (!rec.prod) continue;
      const version = lock?.specs.get(name);
      if (lock && version === undefined && !direct.has(name)) absent.push(name);
      recorded.set(name, { ecosystem: 'gem', name, ...(version !== undefined ? { version } : {}), manifest: rec.prod.manifest });
    }

    // The gemspecs beside this Gemfile, and in any directory its `gemspec` line points at, belong to its group.
    const specFiles: string[] = [];
    for (const d of specDirs) {
      if (claimedDirs.has(d)) continue;
      claimedDirs.add(d);
      specFiles.push(...(gemspecsByDir.get(d) ?? []));
    }
    // Bundler lists a gemspec's development dependencies in DEPENDENCIES, so they are known before the fallback.
    // They come from every gemspec the group points at, claimed by an earlier Gemfile or not: a second Gemfile
    // on the same gemspec (a dummy app's) still must not record the gem itself or its development gems.
    const own = new Set<string>();
    const specDev = new Set<string>();
    const specRuntime = new Set<string>();
    for (const f of [...specDirs].flatMap((d) => gemspecsByDir.get(d) ?? [])) {
      const t = readText(root, f);
      const parsedSpec = t === undefined ? undefined : parseGemspec(f, t);
      own.add(parsedSpec?.name ?? baseName(f).slice(0, -'.gemspec'.length));
      for (const n of parsedSpec?.dev ?? []) specDev.add(n);
      for (const d of parsedSpec?.runtime ?? []) specRuntime.add(d.name);
    }

    // The lockfile lists the direct gems a Gemfile computed in code; the gem a gemspec defines is not one,
    // and neither is a gem a gemspec names only as a development dependency.
    if (lock) {
      for (const d of lock.direct) {
        if (byName.has(d.name) || own.has(d.name) || recorded.has(d.name)) continue;
        if (specDev.has(d.name) && !specRuntime.has(d.name)) continue;
        const version = lock.specs.get(d.name);
        recorded.set(d.name, { ecosystem: 'gem', name: d.name, ...(version !== undefined ? { version } : {}), manifest: `${lockRel}:${d.line}` });
      }
    }

    const devNames = new Set<string>();
    for (const [name, rec] of byName) if (rec.dev) devNames.add(name);
    readGemspecs(specFiles, lock, recorded, devNames);
    for (const n of devNames) if (!recorded.has(n)) devSkipped++;

    if (absent.length > 0) {
      const named = absent.slice(0, NAMED_LIMIT).join(', ');
      const more = absent.length > NAMED_LIMIT ? `, and ${absent.length - NAMED_LIMIT} more` : '';
      notices.push(
        `${gf}: ${absent.length} ${plural(absent.length, 'gem is', 'gems are')} not in ${lockName}, recorded without a version: ${named}${more}`,
      );
    }
    if (!lockPresent && recorded.size > 0) {
      notices.push(`${gf}: no ${lockName} beside it; ${recorded.size} ${plural(recorded.size, 'gem', 'gems')} recorded without a version`);
    }
    deps.push(...recorded.values());
  }

  // A gemspec with no Gemfile beside it: versions from the nearest lockfile above, when there is one.
  for (const [dir, specFiles] of gemspecsByDir) {
    if (claimedDirs.has(dir)) continue;
    let lock: Lock | undefined;
    for (const d of ancestorDirs(dir)) {
      const found = ['Gemfile.lock', 'gems.locked'].map((n) => joinRel(d, n)).find((p) => fileSet.has(p));
      if (found !== undefined) {
        lock = loadLock(found);
        break;
      }
    }
    const recorded = new Map<string, Dependency>();
    const devNames = new Set<string>();
    readGemspecs(specFiles, lock, recorded, devNames);
    for (const n of devNames) if (!recorded.has(n)) devSkipped++;
    deps.push(...recorded.values());
  }

  return { deps, devSkipped, notices };
}
