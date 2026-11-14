import type { Dependency } from '../types.js';
import { baseName, describeParseError, dirOf, fileExists, joinRel, KeyLocator, readText, type ReaderResult } from './util.js';

/**
 * The Composer ecosystem: every `composer.json` in the file list. A dependency is `<vendor>/<name>`,
 * lowercased, as Composer compares names. The direct dependencies are the `require` keys; `require-dev`
 * is counted, not returned. Platform names (PHP itself, its extensions and system libraries, Composer's
 * own APIs) are not packages, so they are neither returned nor counted. A `composer.json` under a
 * `vendor-bin/` directory holds the development tools of `bamarni/composer-bin-plugin`: its `require`
 * is counted, not returned.
 *
 * A version comes only from the `composer.lock` beside the `composer.json`, as written there (`v7.1.0`
 * stays `v7.1.0`). A constraint in `composer.json` is never a version, and nothing is fetched.
 */

type Json = Record<string, unknown>;

function isObj(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const PLATFORM = new Set([
  'php',
  'php-64bit',
  'php-ipv6',
  'php-zts',
  'php-debug',
  'hhvm',
  'composer',
  'composer-plugin-api',
  'composer-runtime-api',
]);

/** A platform requirement, which Composer checks against the running system and never installs. Takes a lowercased name. */
function isPlatform(name: string): boolean {
  return PLATFORM.has(name) || name.startsWith('ext-') || name.startsWith('lib-');
}

/** The bin-plugin's tool directories: `vendor-bin/<tool>/composer.json`, at the root or below it. */
function isVendorBin(rel: string): boolean {
  return /(?:^|\/)vendor-bin\//.test(rel);
}

/** The non-platform keys of a `require`-shaped object, as written. */
function packageKeys(group: unknown): string[] {
  return isObj(group) ? Object.keys(group).filter((k) => !isPlatform(k.toLowerCase())) : [];
}

/**
 * Version by lowercased package name from a lock's `packages[]`; `'missing'` when there is no lock, and
 * `'unusable'` when there is one that cannot be read or parsed, which has its own notice.
 */
function readLock(root: string, rel: string, notices: string[]): Map<string, string> | 'missing' | 'unusable' {
  if (!fileExists(root, rel)) return 'missing';
  const text = readText(root, rel);
  if (text === undefined) {
    notices.push(`${rel}: could not be read; versions from it are unavailable`);
    return 'unusable';
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    notices.push(`${rel}: did not parse (${describeParseError(e, 'JSON', text)}); versions from it are unavailable`);
    return 'unusable';
  }
  if (!isObj(data)) {
    notices.push(`${rel}: is not a JSON object; versions from it are unavailable`);
    return 'unusable';
  }
  const versions = new Map<string, string>();
  const packages = data['packages'];
  for (const p of Array.isArray(packages) ? packages : []) {
    if (!isObj(p) || typeof p['name'] !== 'string' || typeof p['version'] !== 'string') continue;
    const name = p['name'].toLowerCase();
    if (!versions.has(name)) versions.set(name, p['version']);
  }
  return versions;
}

/** Read the `require` of every composer.json in the file list, with versions from the composer.lock beside each. */
export function readComposer(root: string, files: string[]): ReaderResult {
  const deps: Dependency[] = [];
  const notices: string[] = [];
  let devSkipped = 0;
  let unlocked = 0;

  for (const rel of files) {
    if (baseName(rel) !== 'composer.json') continue;
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

    const required = packageKeys(data['require']);
    const names = new Set(required.map((k) => k.toLowerCase()));
    for (const k of packageKeys(data['require-dev'])) if (!names.has(k.toLowerCase())) devSkipped++;
    if (isVendorBin(rel)) {
      devSkipped += names.size;
      continue;
    }
    if (required.length === 0) continue;

    const lock = readLock(root, joinRel(dirOf(rel), 'composer.lock'), notices);
    const where = new KeyLocator(text);
    const seen = new Set<string>();
    for (const key of required) {
      const name = key.toLowerCase();
      if (seen.has(name)) continue;
      seen.add(name);
      const version = typeof lock === 'string' ? undefined : lock.get(name);
      // An unusable lock has its own notice; a missing lock and a name the lock does not list share the one below.
      if (version === undefined && lock !== 'unusable') unlocked++;
      deps.push({ ecosystem: 'composer', name, ...(version !== undefined ? { version } : {}), manifest: `${rel}:${where.line('require', key)}` });
    }
  }

  if (unlocked > 0) {
    notices.push(
      `${unlocked} Composer ${unlocked === 1 ? 'dependency has' : 'dependencies have'} no locked version (no composer.lock beside composer.json, or a name it does not list); recorded without a version`,
    );
  }
  return { deps, devSkipped, notices };
}
