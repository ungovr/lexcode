import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ToolError } from '../errors.js';
import { readRegularFile } from '../fsread.js';
import { childEnv, gitExecutable } from '../proc.js';
import type { ScopeInfo, ScopeSpec } from '../types.js';
import { globToRegExp, globToRegExpSource } from './globs.js';

/** A file over this many bytes is not read; the scan counts it. */
export const MAX_FILE_BYTES = 5_000_000;

/** Directories never read, at any depth. */
const ALWAYS_SKIPPED = new Set(['node_modules', 'vendor', 'dist', 'build', '.git']);
/**
 * Directories a walk (a directory with no git work tree) also skips, at any depth. Git would have left
 * them out through .gitignore; a walk has no such list, and a third-party library under
 * `.venv/lib/.../site-packages` once raised a FAIL for an activity the project never performs.
 */
const WALK_SKIPPED = new Set([
  'site-packages',
  '__pycache__',
  '.tox',
  '.nox',
  '.mypy_cache',
  '.pytest_cache',
  '.next',
  '.nuxt',
  '.svelte-kit',
  'target',
  '.gradle',
  'Pods',
  '.terraform',
]);
/** Skipped by a walk only when the directory holds a `pyvenv.cfg`, which is what makes it a virtual environment. */
const VENV_NAMES = new Set(['.venv', 'venv', 'env']);
/** The largest root .gitignore a walk reads, and the most patterns it applies: every entry is tested against every pattern. */
const MAX_GITIGNORE_BYTES = 1024 * 1024;
const MAX_GITIGNORE_RULES = 5000;

interface IgnoreRule {
  re: RegExp;
  dirOnly: boolean;
  /** Matches the whole path from the root; otherwise the name alone, at any depth. */
  anchored: boolean;
}

/**
 * The simple patterns of a .gitignore: a name, `dir/` (directories only), a glob such as `*.ext`, and a
 * leading `/` (anchored at the root); a pattern with a `/` inside is anchored too. Negations (`!`)
 * are not supported, and neither are patterns past the first 5,000; both are only counted. Comments and
 * blank lines are skipped. A .gitignore below the root is not read.
 */
export function parseGitignore(text: string): { rules: IgnoreRule[]; notApplied: number } {
  const rules: IgnoreRule[] = [];
  let notApplied = 0;
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.replace(/(?<!\\)\s+$/, '');
    if (line === '' || line.startsWith('#')) continue;
    if (line.startsWith('!')) {
      notApplied++;
      continue;
    }
    if (line.startsWith('\\#') || line.startsWith('\\!')) line = line.slice(1);
    const dirOnly = line.endsWith('/');
    if (dirOnly) line = line.replace(/\/+$/, '');
    if (line === '') continue;
    const anchored = line.includes('/');
    const body = line.replace(/^\/+/, '');
    if (body === '') continue;
    if (rules.length >= MAX_GITIGNORE_RULES) {
      notApplied++;
      continue;
    }
    rules.push({ re: globToRegExp(body), dirOnly, anchored });
  }
  return { rules, notApplied };
}

function ignoredBy(rules: IgnoreRule[], rel: string, isDir: boolean): boolean {
  if (rules.length === 0) return false;
  const name = rel.slice(rel.lastIndexOf('/') + 1);
  for (const r of rules) {
    if (r.dirOnly && !isDir) continue;
    if (r.re.test(r.anchored ? rel : name)) return true;
  }
  return false;
}

/** Directories skipped unless `includeTests`. */
const TEST_DIRS = new Set(['test', 'tests', '__tests__', 'spec', 'fixtures', 'testdata']);
/**
 * File names of bundled or minified code: someone else's library copied in,
 * never the project's own code, and the costliest files to parse (a vendored
 * jsPDF alone cost 15 CPU-seconds on the UnGovr monorepo). The engine's own
 * minified-file check catches what these names miss.
 */
const BUNDLED_NAME = /(?:\.min\.(?:js|mjs|cjs)|\.bundle\.js|\.vendor\.js)$|^vendor\.[^/]+\.js$/;

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

/**
 * Config keys git would otherwise take from the scanned directory's own
 * .git/config, which may have come from someone else (an unpacked archive, a
 * shared folder). `core.fsmonitor` names a command git runs; `core.excludesFile`
 * names a path git reads, and a FIFO there hangs the listing. `-c` outranks
 * every config file. An empty `core.excludesFile` means "none" on every
 * platform; the user's global ignore file is not applied either, so a scan lists
 * the same files on a laptop and in CI.
 */
export const GIT_HARDENING = ['-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false', '-c', 'core.excludesFile='];

/** Paths git lists under `root` (tracked, plus untracked and not ignored), or null when `root` is not in a git work tree. */
function gitListing(root: string): string[] | null {
  const git = gitExecutable();
  if (git === undefined) return null; // git is not installed
  let out: Buffer;
  try {
    out = execFileSync(git, [...GIT_HARDENING, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: root,
      env: childEnv({ LC_ALL: 'C', LANG: 'C', GIT_OPTIONAL_LOCKS: '0' }),
      maxBuffer: 1024 * 1024 * 1024,
      timeout: 300_000,
      killSignal: 'SIGKILL',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    const err = e as NodeJS.ErrnoException & { stderr?: Buffer; status?: number | null };
    if (err.code === 'ENOENT' && err.syscall === `spawnSync ${git}`) return null; // git vanished since it was found
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

function walk(root: string): { found: string[]; gitignore: { rules: number; notApplied: number } } {
  let ignore: ReturnType<typeof parseGitignore> = { rules: [], notApplied: 0 };
  try {
    ignore = parseGitignore(readRegularFile(path.join(root, '.gitignore'), { insideRoot: root, maxBytes: MAX_GITIGNORE_BYTES }));
  } catch {
    // no .gitignore, or one that is a link, a FIFO or too large: nothing is ignored by it
  }
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
        if (ALWAYS_SKIPPED.has(entry.name) || WALK_SKIPPED.has(entry.name)) continue;
        if (VENV_NAMES.has(entry.name) && existsSync(path.join(abs, entry.name, 'pyvenv.cfg'))) continue;
        if (ignoredBy(ignore.rules, rel, true)) continue;
        visit(rel);
      } else if (!ignoredBy(ignore.rules, rel, false)) {
        found.push(rel); // files and symlinks alike; the caller sorts them out
      }
    }
  };
  visit('');
  return { found, gitignore: { rules: ignore.rules.length, notApplied: ignore.notApplied } };
}

export interface ListFilesResult {
  files: string[];
  info: Omit<ScopeInfo, 'extracted' | 'dev_dependencies_skipped'>;
  skippedSymlinks: number;
  skippedLarge: number;
  skippedBundled: number;
  /** True when `root` is not in a git work tree and the files were found by walking it. */
  noGitWorkTree: boolean;
  /** For a walk: how many simple root .gitignore patterns were applied, and how many (`!` negations, or beyond 5,000) were not. */
  gitignore: { rules: number; notApplied: number };
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

  const viaGit = gitListing(root);
  const walked = viaGit === null ? walk(root) : undefined;
  const listed = viaGit ?? (walked as ReturnType<typeof walk>).found;

  let skippedSymlinks = 0;
  let skippedLarge = 0;
  let skippedBundled = 0;
  const candidates: string[] = [];
  for (const rel of listed) {
    if (underSkippedDir(rel, spec.includeTests)) continue;
    if (BUNDLED_NAME.test(rel.slice(rel.lastIndexOf('/') + 1))) {
      skippedBundled++;
      continue;
    }
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
    skippedBundled,
    noGitWorkTree: viaGit === null,
    gitignore: walked?.gitignore ?? { rules: 0, notApplied: 0 },
  };
}
