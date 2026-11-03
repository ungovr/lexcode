import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { childEnv, findOnPath, gitExecutable, resetGitExecutable } from '../../src/proc.js';
import { listFiles } from '../../src/scope/files.js';

describe('findOnPath on a POSIX platform', () => {
  const have = (set: string[]) => (f: string) => set.includes(f);

  it('returns the first absolute entry that holds the program', () => {
    const got = findOnPath('git', { platform: 'linux', env: { PATH: '/a:/b:/c' }, isRunnable: have(['/b/git', '/c/git']) });
    expect(got).toBe('/b/git');
  });

  it('skips an empty entry and a relative one, even when they hold the program', () => {
    const env = { PATH: ':.:bin:./bin:/real' };
    const runnable = have(['git', './git', 'bin/git', 'bin/./git', path.posix.join('.', 'git'), '/real/git']);
    expect(findOnPath('git', { platform: 'linux', env, isRunnable: runnable })).toBe('/real/git');
    expect(findOnPath('git', { platform: 'linux', env: { PATH: ':.:bin' }, isRunnable: () => true })).toBeUndefined();
  });

  it('is undefined with no PATH', () => {
    expect(findOnPath('git', { platform: 'linux', env: {}, isRunnable: () => true })).toBeUndefined();
  });
});

describe('findOnPath on Windows', () => {
  const have = (set: string[]) => (f: string) => set.includes(f);

  it('tries each PATHEXT extension in order in each absolute directory', () => {
    const env = { Path: 'C:\\tools;D:\\git\\cmd', PATHEXT: '.COM;.EXE;.CMD' };
    const got = findOnPath('git', { platform: 'win32', env, isRunnable: have(['C:\\tools\\git.CMD', 'D:\\git\\cmd\\git.EXE']) });
    expect(got).toBe('C:\\tools\\git.CMD');
    expect(findOnPath('git', { platform: 'win32', env, isRunnable: have(['D:\\git\\cmd\\git.EXE']) })).toBe('D:\\git\\cmd\\git.EXE');
  });

  it('skips empty, relative and drive-relative entries, so a git.exe in the current directory is never found', () => {
    const env = { PATH: ';.;bin;C:bin;"D:\\git\\cmd"', PATHEXT: '.EXE' };
    const runnable = have(['git.EXE', '.\\git.EXE', 'bin\\git.EXE', 'C:bin\\git.EXE', 'D:\\git\\cmd\\git.EXE']);
    expect(findOnPath('git', { platform: 'win32', env, isRunnable: runnable })).toBe('D:\\git\\cmd\\git.EXE');
    expect(findOnPath('git', { platform: 'win32', env: { PATH: ';.;bin', PATHEXT: '.EXE' }, isRunnable: () => true })).toBeUndefined();
  });

  it('keeps a name that already has an extension as it is', () => {
    const env = { PATH: 'C:\\tools', PATHEXT: '.EXE' };
    expect(findOnPath('git.exe', { platform: 'win32', env, isRunnable: have(['C:\\tools\\git.exe']) })).toBe('C:\\tools\\git.exe');
  });
});

describe('childEnv', () => {
  it('turns off the current-directory program search on Windows only', () => {
    expect(childEnv({}, { A: '1' }, 'win32')).toMatchObject({ A: '1', NoDefaultCurrentDirectoryInExePath: '1' });
    expect(childEnv({}, { A: '1' }, 'linux')).not.toHaveProperty('NoDefaultCurrentDirectoryInExePath');
    expect(childEnv({ X: '2' }, { A: '1' }, 'darwin')).toEqual({ A: '1', X: '2' });
  });
});

describe.skipIf(process.platform === 'win32')('a git planted in the scanned directory', () => {
  const made: string[] = [];
  const savedPath = process.env.PATH;
  afterEach(() => {
    process.env.PATH = savedPath;
    resetGitExecutable();
    while (made.length) rmSync(made.pop() as string, { recursive: true, force: true });
  });

  it('is not run when PATH has an empty entry, and the git that runs is an absolute path', () => {
    const real = findOnPath('git');
    expect(real).toBeDefined();
    const root = mkdtempSync(path.join(tmpdir(), 'lexcode-proc-'));
    const marker = path.join(mkdtempSync(path.join(tmpdir(), 'lexcode-proc-m-')), 'RAN');
    made.push(root, path.dirname(marker));
    execFileSync(real as string, ['init', '-q'], { cwd: root });
    writeFileSync(path.join(root, 'a.ts'), 'x\n');
    writeFileSync(path.join(root, 'git'), `#!/bin/sh\ndate > '${marker}'\nexit 1\n`, { mode: 0o755 });
    process.env.PATH = `:${savedPath ?? ''}`;
    resetGitExecutable();
    expect(path.isAbsolute(gitExecutable() as string)).toBe(true);
    expect(listFiles(root, { include: [], exclude: [], includeTests: false }).files).toContain('a.ts');
    expect(existsSync(marker)).toBe(false);
  });
});
