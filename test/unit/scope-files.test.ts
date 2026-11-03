import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ToolError } from '../../src/errors.js';
import { listFiles, toPosix } from '../../src/scope/files.js';
import type { ScopeSpec } from '../../src/types.js';

const made: string[] = [];

function tmp(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'lexcode-scope-'));
  made.push(dir);
  return dir;
}

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
}

function put(root: string, rel: string, body = 'x\n'): void {
  const full = path.join(root, ...rel.split('/'));
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, body);
}

function repo(files: string[], opts: { git: boolean } = { git: true }): string {
  const root = tmp();
  for (const f of files) put(root, f);
  if (opts.git) git(root, 'init', '-q');
  return root;
}

const plain: ScopeSpec = { include: [], exclude: [], includeTests: false };

afterEach(() => {
  while (made.length) rmSync(made.pop() as string, { recursive: true, force: true });
});

describe('listFiles in a git repository', () => {
  it('lists tracked and untracked files, not ignored ones, and skips a tracked file deleted from disk', () => {
    const root = repo(['src/tracked.ts', 'src/untracked.ts', 'ignored.log', 'gone.ts', '.gitignore']);
    put(root, '.gitignore', '*.log\n');
    git(root, 'add', 'src/tracked.ts', 'gone.ts');
    rmSync(path.join(root, 'gone.ts'));
    const r = listFiles(root, plain);
    expect(r.files).toEqual(['.gitignore', 'src/tracked.ts', 'src/untracked.ts']);
    expect(r.info).toEqual({ include: [], exclude: [], include_tests: false, files: 3 });
    expect(r.skippedSymlinks).toBe(0);
    expect(r.skippedLarge).toBe(0);
  });

  it('skips bundled and minified files by name and counts them', () => {
    const root = repo([
      'web/app.js',
      'web/vendor.jspdf.js',
      'web/jquery.min.js',
      'web/lib.min.mjs',
      'web/main.bundle.js',
      'web/chart.vendor.js',
      'web/vendors.js',
      'src/minify.ts',
    ]);
    const r = listFiles(root, plain);
    expect(r.files).toEqual(['src/minify.ts', 'web/app.js', 'web/vendors.js']);
    expect(r.skippedBundled).toBe(5);
  });

  it('lists a file whose name holds spaces and non-ASCII characters', () => {
    const root = repo(['src/a b.ts', 'src/café.ts']);
    expect(listFiles(root, plain).files).toEqual(['src/a b.ts', 'src/café.ts']);
  });

  it('lists only the scanned subdirectory when the root is inside a larger repository', () => {
    const top = repo(['a.ts', 'pkg/b.ts', 'pkg/sub/c.ts']);
    expect(listFiles(path.join(top, 'pkg'), plain).files).toEqual(['b.ts', 'sub/c.ts']);
  });

  it('names git in the error when git itself fails for another reason', () => {
    // A root that does not exist is a tool error, not an empty scope.
    expect(() => listFiles(path.join(tmp(), 'missing'), plain)).toThrow(ToolError);
  });
});

describe('listFiles outside git', () => {
  it('walks the directory and applies the same skip list', () => {
    const root = repo(
      ['a.ts', 'src/b.ts', 'node_modules/x/i.js', '.git/config', 'dist/o.js', 'src/test/t.ts'],
      { git: false },
    );
    expect(listFiles(root, plain).files).toEqual(['a.ts', 'src/b.ts']);
  });

  it('does not honor .gitignore', () => {
    const root = repo(['a.ts', 'b.log', '.gitignore'], { git: false });
    put(root, '.gitignore', '*.log\n');
    expect(listFiles(root, plain).files).toEqual(['.gitignore', 'a.ts', 'b.log']);
  });
});

describe('the skip list', () => {
  const tree = [
    'src/keep.ts',
    'node_modules/m/a.js',
    'vendor/v/a.go',
    'dist/a.js',
    'build/a.js',
    'src/deep/node_modules/m/a.js',
    'src/deep/vendor/a.js',
    'test/a.ts',
    'tests/a.ts',
    '__tests__/a.ts',
    'spec/a.ts',
    'fixtures/a.ts',
    'testdata/a.ts',
    'src/deep/tests/a.ts',
    'src/testing.ts',
    'src/build.ts',
    'tools/build',
  ];

  it('drops each listed directory at any depth', () => {
    const root = repo(tree);
    expect(listFiles(root, plain).files).toEqual(['src/build.ts', 'src/keep.ts', 'src/testing.ts', 'tools/build']);
  });

  it('keeps the test directories under includeTests, never the dependency ones', () => {
    const root = repo(tree);
    const r = listFiles(root, { ...plain, includeTests: true });
    expect(r.files).toEqual([
      '__tests__/a.ts',
      'fixtures/a.ts',
      'spec/a.ts',
      'src/build.ts',
      'src/deep/tests/a.ts',
      'src/keep.ts',
      'src/testing.ts',
      'test/a.ts',
      'testdata/a.ts',
      'tests/a.ts',
      'tools/build',
    ]);
    expect(r.info.include_tests).toBe(true);
  });

  it('applies to a tracked file as well', () => {
    const root = repo(['src/a.ts', 'node_modules/x.js']);
    git(root, 'add', '-f', 'node_modules/x.js');
    expect(listFiles(root, plain).files).toEqual(['src/a.ts']);
  });
});

describe('include and exclude', () => {
  const files = ['src/a.ts', 'src/sub/b.ts', 'lib/c.ts', 'lib/c.py', 'README.md'];

  it('include narrows to directories and globs', () => {
    const root = repo(files);
    const r = listFiles(root, { ...plain, include: ['src/', 'lib/*.py'] });
    expect(r.files).toEqual(['lib/c.py', 'src/a.ts', 'src/sub/b.ts']);
    expect(r.info.include).toEqual(['src/', 'lib/*.py']);
    expect(r.info.files).toBe(3);
  });

  it('exclude subtracts, with or without an include', () => {
    const root = repo(files);
    expect(listFiles(root, { ...plain, exclude: ['src/sub/', '*.md'] }).files).toEqual([
      'lib/c.py',
      'lib/c.ts',
      'src/a.ts',
    ]);
    expect(listFiles(root, { ...plain, include: ['src/'], exclude: ['src/sub/**'] }).files).toEqual(['src/a.ts']);
  });

  it('an include that matches no file is an error naming it, never a fallback to the whole repository', () => {
    const root = repo(files);
    let err: unknown;
    try {
      listFiles(root, { ...plain, include: ['src/', 'nope/'] });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ToolError);
    expect((err as ToolError).message).toContain('nope/');
    expect((err as ToolError).message).not.toContain('src/,');
  });

  it('an include that matches only what the skip list drops is an error too', () => {
    const root = repo(['src/a.ts', 'tests/t.ts']);
    expect(() => listFiles(root, { ...plain, include: ['tests/'] })).toThrow(/tests\//);
    expect(listFiles(root, { ...plain, include: ['tests/'], includeTests: true }).files).toEqual(['tests/t.ts']);
  });

  it('an include that matches files an exclude then removes is not an error, but leaves nothing in scope', () => {
    const root = repo(files);
    expect(() => listFiles(root, { ...plain, include: ['src/'], exclude: ['src/'] })).toThrow(/no files in scope/);
  });

  it('refuses a path that is absolute or climbs out of the repository', () => {
    const root = repo(files);
    expect(() => listFiles(root, { ...plain, include: ['/etc/'] })).toThrow(ToolError);
    expect(() => listFiles(root, { ...plain, exclude: ['../x/'] })).toThrow(ToolError);
    expect(() => listFiles(root, { ...plain, include: ['src/../../x'] })).toThrow(ToolError);
  });

  it('zero files after the skip list is an error', () => {
    const root = repo(['node_modules/a.js', 'dist/b.js']);
    let err: unknown;
    try {
      listFiles(root, plain);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ToolError);
    expect((err as ToolError).message).toContain('no files in scope');
  });
});

describe('symlinks and large files', () => {
  for (const useGit of [true, false]) {
    const label = useGit ? 'in a git repository' : 'in a plain directory';

    it(`never lists a symlink, whatever it points to, and counts it ${label}`, () => {
      const root = repo(['src/real.ts'], { git: useGit });
      const outside = tmp();
      put(outside, 'secret.txt', 'secret\n');
      symlinkSync(path.join(outside, 'secret.txt'), path.join(root, 'src', 'to-file'));
      symlinkSync(outside, path.join(root, 'to-dir'));
      symlinkSync('/dev/zero', path.join(root, 'to-device'));
      symlinkSync('real.ts', path.join(root, 'src', 'inside'));
      symlinkSync(path.join(root, 'no-such-target'), path.join(root, 'dangling'));
      if (useGit) git(root, 'add', '-A');
      const r = listFiles(root, plain);
      expect(r.files).toEqual(['src/real.ts']);
      expect(r.skippedSymlinks).toBe(5);
    });

    it(`does not count a symlink inside a skipped directory ${label}`, () => {
      const root = repo(['src/real.ts', 'node_modules/p/i.js'], { git: useGit });
      symlinkSync('i.js', path.join(root, 'node_modules', 'p', 'link'));
      expect(listFiles(root, plain).skippedSymlinks).toBe(0);
    });
  }

  it('does not follow a symlinked directory, so nothing under it is listed', () => {
    const root = repo(['src/real.ts'], { git: false });
    const outside = tmp();
    put(outside, 'deep/x.ts');
    symlinkSync(outside, path.join(root, 'linked'));
    expect(listFiles(root, plain).files).toEqual(['src/real.ts']);
  });

  it('skips a file over 5,000,000 bytes and counts it; a file at the limit is listed', () => {
    const root = repo(['small.ts']);
    put(root, 'huge.js', 'a'.repeat(5_000_001));
    put(root, 'limit.js', 'a'.repeat(5_000_000));
    const r = listFiles(root, plain);
    expect(r.files).toEqual(['limit.js', 'small.ts']);
    expect(r.skippedLarge).toBe(1);
    expect(r.skippedSymlinks).toBe(0);
  });
});

describe.skipIf(process.platform === 'win32')('listFiles does not run or read what a repository configures for git', () => {
  function setConfig(root: string, key: string, value: string): void {
    git(root, 'config', key, value);
  }

  it('does not run a core.fsmonitor command planted in .git/config', () => {
    const root = repo(['a.ts']);
    const marker = path.join(tmp(), 'FSMONITOR_RAN');
    const hook = path.join(tmp(), 'hook.sh');
    writeFileSync(hook, `#!/bin/sh\ndate > '${marker}'\nexit 1\n`, { mode: 0o755 });
    setConfig(root, 'core.fsmonitor', hook);
    expect(listFiles(root, plain).files).toEqual(['a.ts']);
    expect(existsSync(marker)).toBe(false);
  });

  it('does not read a core.excludesFile named in .git/config', () => {
    const root = repo(['a.ts', 'b.secret']);
    const ex = path.join(tmp(), 'exclude');
    writeFileSync(ex, '*.secret\n');
    setConfig(root, 'core.excludesFile', ex);
    expect(listFiles(root, plain).files).toEqual(['a.ts', 'b.secret']);
  });

  it('does not hang on a core.excludesFile that is a FIFO', () => {
    const root = repo(['a.ts']);
    const fifo = path.join(tmp(), 'fifo');
    execFileSync('mkfifo', [fifo]);
    setConfig(root, 'core.excludesFile', fifo);
    expect(listFiles(root, plain).files).toEqual(['a.ts']);
  }, 20_000);
});

describe('toPosix', () => {
  it('turns a win32 join into a POSIX relative path', () => {
    expect(toPosix(path.win32.join('src', 'a', 'b.ts'), path.win32)).toBe('src/a/b.ts');
    expect(toPosix('src/a/b.ts', path.win32)).toBe('src/a/b.ts');
  });

  it('leaves a backslash in a POSIX file name alone', () => {
    expect(toPosix('src/we\\ird.ts', path.posix)).toBe('src/we\\ird.ts');
  });
});
