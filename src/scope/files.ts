import { execFileSync } from 'node:child_process';
import { lstatSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ToolError } from '../errors.js';
import type { ScopeInfo, ScopeSpec } from '../types.js';
import { globToRegExp, globToRegExpSource } from './globs.js';

/** A file over this many bytes is not read; the scan counts it. */
export const MAX_FILE_BYTES = 5_000_000;

/** Directories never read, at any depth. */
const ALWAYS_SKIPPED = new Set(['node_modules', 'vendor', 'dist', 'build', '.git']);
/** Directories skipped unless `includeTests`. */
const TEST_DIRS = new Set(['test', 'tests', '__tests__', 'spec', 'fixtures', 'testdata']);

/** A POSIX relative path from a path built with the platform's own separator. */
export function toPosix(p: string, flavor: Pick<typeof path, 'sep'> = path): string {
  return flavor.sep === '/' ? p : p.split(flavor.sep).join('/');
}

function skippedDir(name: string, includeTests: boolean): boolean {
  return ALWAYS_SKIPPED.has(name) || (!includeTests && TEST_DIRS.has(name));
}

/** True when a directory segment of `rel` (never the file name) is on the skip list. */
function underSkippedDir(rel: string, includeTests: boolean): boolean {
  const parts = rel.split('/');
  for (let i = 0; i < parts.length - 1; i++) {
    if (skippedDir(parts[i] as string, includeTests)) return true;
  }
  return false;
}

function normalizeScopePattern(pattern: string): string {
  let p = pattern;
  while (p.startsWith('./')) p = p.slice(2);
  return p;
}

/**
 * Whether a POSIX relative path is selected by one `include` or `exclude`
 * entry. A trailing "/" is a directory and everything under it (the directory
 * may itself hold a glob); anything else is a glob over the whole path.
 */
export function matchesScopePath(rel: string, pattern: string): boolean {
  const p = normalizeScopePattern(pattern);
  if (p === '') return true;
  if (p.endsWith('/')) {
    const dir = p.replace(/\/+$/, '');
    if (dir === '') return true;
    return new RegExp(`^(?:${globToRegExpSource(dir)})/`, 's').test(rel);
  }
  return globToRegExp(p).test(rel);
}

function checkPattern(pattern: string, which: 'include' | 'exclude'): void {
  const p = pattern.replace(/\\/g, '/');
  if (p.startsWith('/') || /^[A-Za-z]:\//.test(p) || p.split('/').includes('..')) {
    throw new ToolError(
      `${which} entry "${pattern}" must be a path inside the repository: not absolute, and not climbing out with "..".`,
    );
  }
}

/** Paths git lists under `root` (tracked, plus untracked and not ignored), or null when `root` is not in a git work tree. */
function gitListing(root: string): string[] | null {
  let out: Buffer;
  try {
    out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: root,
      env: { ...process.env, LC_ALL: 'C', LANG: 'C' },
      maxBuffer: 1024 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    const err = e as NodeJS.ErrnoException & { stderr?: Buffer; status?: number | null };
    if (err.code === 'ENOENT' && err.syscall === 'spawnSync git') return null; // git is not installed
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
      throw new ToolError(`cannot read the repository at ${root}: ${err.message}`);
    }
    const stderr = err.stderr ? err.stderr.toString('utf8') : '';
    if (/not a git repository/i.test(stderr)) return null;
    const detail = stderr.trim().split('\n').slice(-2).join(' ') || err.message;
    throw new ToolError(`git could not list the files under ${root}: ${detail}`);
  }
  const seen = new Set<string>();
  for (const entry of out.toString('utf8').split('\0')) {
    if (entry !== '') seen.add(entry);
  }
  return [...seen];
}

function walk(root: string): string[] {
  const found: string[] = [];
  const visit = (dirRel: string): void => {
    const abs = dirRel === '' ? root : path.join(root, ...dirRel.split('/'));
    let entries;
    try {
      entries = readdirSync(abs, { withFileTypes: true });
    } catch (e) {
      if (dirRel === '') throw new ToolError(`cannot read the repository at ${root}: ${(e as Error).message}`);
      return; // an unreadable subdirectory is not a reason to stop
    }
    for (const entry of entries) {
      const rel = dirRel === '' ? entry.name : `${dirRel}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!ALWAYS_SKIPPED.has(entry.name)) visit(rel);
      } else {
        found.push(rel); // files and symlinks alike; the caller sorts them out
      }
    }
  };
  visit('');
  return found;
}

export interface ListFilesResult {
  files: string[];
  info: Omit<ScopeInfo, 'extracted' | 'dev_dependencies_skipped'>;
  skippedSymlinks: number;
  skippedLarge: number;
}

export function listFiles(root: string, spec: ScopeSpec): ListFilesResult {
  for (const p of spec.include) checkPattern(p, 'include');
  for (const p of spec.exclude) checkPattern(p, 'exclude');

  let rootStat;
  try {
    rootStat = lstatSync(root);
  } catch (e) {
    throw new ToolError(`cannot read the repository at ${root}: ${(e as Error).message}`);
  }
  if (!rootStat.isDirectory() && !rootStat.isSymbolicLink()) {
    throw new ToolError(`${root} is not a directory.`);
  }

  const listed = gitListing(root) ?? walk(root);

  let skippedSymlinks = 0;
  let skippedLarge = 0;
  const candidates: string[] = [];
  for (const rel of listed) {
    if (underSkippedDir(rel, spec.includeTests)) continue;
    let st;
    try {
      st = lstatSync(path.join(root, ...rel.split('/')));
    } catch {
      continue; // listed by git, deleted from disk
    }
    if (st.isSymbolicLink()) {
      skippedSymlinks++;
      continue;
    }
    if (!st.isFile()) continue; // a submodule, a nested repository, a socket
    if (st.size > MAX_FILE_BYTES) {
      skippedLarge++;
      continue;
    }
    candidates.push(rel);
  }
  candidates.sort();

  const unmatched = spec.include.filter((inc) => !candidates.some((rel) => matchesScopePath(rel, inc)));
  if (unmatched.length > 0) {
    const names = unmatched.map((u) => `"${u}"`).join(', ');
    throw new ToolError(
      `scope include ${names} matched no file. Nothing was scanned: an include that matches nothing is an error, never a fallback to the whole repository. ` +
        `A trailing "/" names a directory; anything else is a glob. Directories named like tests are skipped unless --include-tests is given.`,
    );
  }

  const files = candidates.filter(
    (rel) =>
      (spec.include.length === 0 || spec.include.some((inc) => matchesScopePath(rel, inc))) &&
      !spec.exclude.some((exc) => matchesScopePath(rel, exc)),
  );
  if (files.length === 0) {
    throw new ToolError(`no files in scope under ${root}: every file was skipped, excluded or not included.`);
  }

  return {
    files,
    info: {
      include: [...spec.include],
      exclude: [...spec.exclude],
      include_tests: spec.includeTests,
      files: files.length,
    },
    skippedSymlinks,
    skippedLarge,
  };
}
