import { isMap, isScalar, isSeq, parseDocument, type Node } from 'yaml';
import type { Dependency } from '../types.js';
import { baseName, describeParseError, dirOf, joinRel, LineIndex, opensRubyBlock, readText, rubyLines, type ReaderResult } from './util.js';

/**
 * The CocoaPods ecosystem: `Podfile.lock` and `Podfile` (Decision 11 of the v1.5 plan, #13199).
 *
 * The lock's DEPENDENCIES list is the Podfile's direct dependencies, so it gives the rows, each at its own
 * line; the versions come from the lock's PODS list, never from a DEPENDENCIES entry's own constraint. The
 * Podfile is Ruby and is never evaluated: it is read line by line for its `target` blocks, which say whether
 * a pod is used only by test targets, and, when there is no lock, for its `pod` lines. Carthage's
 * `Cartfile.resolved` is not read; its entries are counted in a notice.
 */

/** Xcode's test target convention: `AppTests`, `AppUITests`. */
const TEST_TARGET = /(?:UI)?Tests$/;

function isPodfile(rel: string): boolean {
  return baseName(rel) === 'Podfile';
}

function isPodfileLock(rel: string): boolean {
  return baseName(rel) === 'Podfile.lock';
}

// ---- Podfile.lock ----------------------------------------------------------------------------

interface Lock {
  /** Version by pod name, lowercased; a subspec (`Firebase/Analytics`) is its own key. */
  versions: Map<string, string>;
  direct: { name: string; line: number }[];
}

/** `Name (constraint)` or `Name`, as a PODS or DEPENDENCIES entry writes it. */
function splitEntry(entry: string): { name: string; paren?: string } | undefined {
  const m = /^\s*([^\s()]+)(?:\s+\((.*)\))?\s*$/.exec(entry);
  if (!m) return undefined;
  return { name: m[1] as string, ...(m[2] !== undefined ? { paren: m[2].trim() } : {}) };
}

function scalarText(node: unknown): string | undefined {
  return isScalar(node) && typeof node.value === 'string' ? node.value : undefined;
}

/** A parse failure whose message is lexcode's own words, safe to show: it never quotes the lock. */
class ParseFailure extends Error {}

/** Parse one lock. Throws (with a message that quotes nothing from the text) when it is not one. */
function parseLock(text: string): Lock {
  text.split(/\r?\n/).forEach((line, i) => {
    if (/^(?:<<<<<<<|=======|>>>>>>>)/.test(line)) throw new ParseFailure(`a merge conflict marker on line ${i + 1}`);
  });
  const doc = parseDocument(text, { prettyErrors: true });
  if (doc.errors.length > 0) throw new ParseFailure(describeParseError(doc.errors[0], 'YAML', text));
  const top = doc.contents;
  const pods = isMap(top) ? top.get('PODS', true) : undefined;
  const deps = isMap(top) ? top.get('DEPENDENCIES', true) : undefined;
  if (pods === undefined && deps === undefined) throw new ParseFailure('no PODS or DEPENDENCIES section');

  const lock: Lock = { versions: new Map(), direct: [] };
  if (isSeq(pods)) {
    for (const item of pods.items) {
      // `- Name (1.2.3)` is a string; `- Name (1.2.3):` with its own dependencies under it is a one-key map.
      const key = isMap(item) ? (item.items[0]?.key as unknown) : item;
      const e = splitEntry(scalarText(key) ?? '');
      if (e?.paren !== undefined && !lock.versions.has(e.name.toLowerCase())) lock.versions.set(e.name.toLowerCase(), e.paren);
    }
  }
  if (isSeq(deps)) {
    const lines = new LineIndex(text);
    const seen = new Set<string>();
    for (const item of deps.items) {
      const e = splitEntry(scalarText(item) ?? '');
      if (!e || seen.has(e.name.toLowerCase())) continue;
      seen.add(e.name.toLowerCase());
      const at = (item as Node).range?.[0] ?? 0;
      lock.direct.push({ name: e.name, line: lines.lineAt(at) });
    }
  }
  return lock;
}

/** A pod's locked version: its own entry, else its root pod's (a subspec always has its pod's version). */
function lockedVersion(lock: Lock, name: string): string | undefined {
  const own = lock.versions.get(name.toLowerCase());
  if (own !== undefined) return own;
  const slash = name.indexOf('/');
  return slash < 0 ? undefined : lock.versions.get(name.slice(0, slash).toLowerCase());
}

// ---- Podfile ---------------------------------------------------------------------------------

interface PodLine {
  name: string;
  line: number;
  /** A plain version as the second argument (`'5.4.3'` or `'= 5.4.3'`), else undefined. */
  version?: string;
  /** The nearest enclosing `target` is one whose name ends in Tests or UITests. */
  test: boolean;
}

type Block = { kind: 'target'; name: string } | { kind: 'abstract' } | { kind: 'def' } | { kind: 'other' };

/**
 * Is a pod line at this depth in a test target? The nearest enclosing `target` or `abstract_target` decides,
 * looking past `if`, `unless`, `.each do` and other blocks inside it. A `def` stops the search, because a
 * method's pods go to whichever targets call it; so does an `abstract_target`, whose pods go to every target
 * under it.
 */
function inTestTarget(stack: Block[]): boolean {
  for (let i = stack.length - 1; i >= 0; i--) {
    const b = stack[i] as Block;
    if (b.kind === 'other') continue;
    return b.kind === 'target' && TEST_TARGET.test(b.name);
  }
  return false;
}

function parsePodfile(text: string): PodLine[] {
  const out: PodLine[] = [];
  const stack: Block[] = [];

  // A pod call that runs on over several lines is read as one.
  for (const { code, line: lineNo } of rubyLines(text, /^pod\b/)) {
    const pod = /^pod\s*\(?\s*(["'])([^"']+)\1(.*)$/.exec(code);
    if (pod) {
      const ver = /^\s*,\s*(["'])\s*(?:=\s*)?(\d+(?:\.\d+)*(?:[-+][0-9A-Za-z.+-]+)?)\s*\1/.exec(pod[3] as string);
      out.push({
        name: (pod[2] as string).trim(),
        line: lineNo,
        ...(ver ? { version: ver[2] as string } : {}),
        test: inTestTarget(stack),
      });
      continue;
    }
    if (/^end\b/.test(code)) {
      stack.pop();
      continue;
    }
    if (opensRubyBlock(code)) {
      const t = /^(abstract_target|target)\s*\(?\s*(?:(["'])([^"']+)\2|:([A-Za-z_]\w*))/.exec(code);
      if (!t) stack.push({ kind: /^def\b/.test(code) ? 'def' : 'other' });
      else if (t[1] === 'abstract_target') stack.push({ kind: 'abstract' });
      else stack.push({ kind: 'target', name: (t[3] ?? t[4]) as string });
    }
  }
  return out;
}

/**
 * The Podfile lines that declare a dependency: those naming it, and, for a subspec, those naming its pod
 * (`pod 'Firebase', :subspecs => [...]` declares `Firebase/Analytics`).
 */
function linesFor(podLines: PodLine[], name: string): PodLine[] {
  const lower = name.toLowerCase();
  const slash = lower.indexOf('/');
  const root = slash < 0 ? undefined : lower.slice(0, slash);
  return podLines.filter((p) => {
    const n = p.name.toLowerCase();
    return n === lower || (root !== undefined && n === root);
  });
}

/** Development: every Podfile line for it sits in a test target, and there is at least one. */
function isDev(podLines: PodLine[], name: string): boolean {
  const own = linesFor(podLines, name);
  return own.length > 0 && own.every((p) => p.test);
}

// ---- Carthage --------------------------------------------------------------------------------

/** The entries of a Cartfile.resolved: each non-blank line that is not a comment. */
function cartfileEntries(text: string): number {
  return text.split(/\r?\n/).filter((l) => {
    const t = l.trim();
    return t !== '' && !t.startsWith('#');
  }).length;
}

// ---- the reader ------------------------------------------------------------------------------

/**
 * Read the direct pods of every Podfile.lock (and of every Podfile that has none beside it) in the file
 * list. Pods used only by test targets are skipped and counted; Carthage is counted, never read.
 */
export function readCocoapods(root: string, files: string[]): ReaderResult {
  const deps: Dependency[] = [];
  const notices: string[] = [];
  let devSkipped = 0;
  const fileSet = new Set(files);

  const dirs = new Set<string>();
  for (const f of files) if (isPodfile(f) || isPodfileLock(f)) dirs.add(dirOf(f));

  for (const dir of [...dirs].sort()) {
    const podfileRel = joinRel(dir, 'Podfile');
    const lockRel = joinRel(dir, 'Podfile.lock');

    let podLines: PodLine[] = [];
    if (fileSet.has(podfileRel)) {
      const text = readText(root, podfileRel);
      if (text === undefined) notices.push(`${podfileRel}: could not be read; skipped`);
      else podLines = parsePodfile(text);
    }

    let lock: Lock | undefined;
    if (fileSet.has(lockRel)) {
      const text = readText(root, lockRel);
      if (text === undefined) notices.push(`${lockRel}: could not be read; versions from it are unavailable`);
      else {
        try {
          lock = parseLock(text);
        } catch (e) {
          const why = e instanceof ParseFailure ? e.message : describeParseError(e, 'YAML', text);
          notices.push(`${lockRel}: did not parse (${why}); versions from it are unavailable`);
        }
      }
    }

    if (lock) {
      for (const d of lock.direct) {
        if (isDev(podLines, d.name)) {
          devSkipped++;
          continue;
        }
        const version = lockedVersion(lock, d.name);
        deps.push({ ecosystem: 'cocoapods', name: d.name, ...(version !== undefined ? { version } : {}), manifest: `${lockRel}:${d.line}` });
      }
      continue;
    }

    // No lock that could be read: each pod line is a row, once per pod, at its first line outside a test target.
    const recorded = new Map<string, Dependency>();
    const devNames = new Set<string>();
    for (const p of podLines) {
      const key = p.name.toLowerCase();
      if (p.test) {
        devNames.add(key);
        continue;
      }
      if (recorded.has(key)) continue;
      recorded.set(key, { ecosystem: 'cocoapods', name: p.name, ...(p.version !== undefined ? { version: p.version } : {}), manifest: `${podfileRel}:${p.line}` });
    }
    for (const n of devNames) if (!recorded.has(n)) devSkipped++;
    deps.push(...recorded.values());
  }

  const unresolved = deps.filter((d) => d.version === undefined).length;
  if (unresolved > 0) {
    notices.push(
      `${unresolved} CocoaPods ${unresolved === 1 ? 'dependency has' : 'dependencies have'} no resolved version (no Podfile.lock, and no exact version in the Podfile); recorded without a version`,
    );
  }

  for (const f of files) {
    if (baseName(f) !== 'Cartfile.resolved') continue;
    const text = readText(root, f);
    if (text === undefined) continue;
    const n = cartfileEntries(text);
    if (n === 0) continue;
    notices.push(
      n === 1
        ? `${f} names 1 Carthage dependency; lexcode does not read Carthage, so it is missing from this record`
        : `${f} names ${n.toLocaleString('en-US')} Carthage dependencies; lexcode does not read Carthage, so they are missing from this record`,
    );
  }

  return { deps, devSkipped, notices };
}
