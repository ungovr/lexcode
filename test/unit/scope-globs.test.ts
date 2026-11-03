import { describe, expect, it } from 'vitest';
import { matchGlob } from '../../src/scope/globs.js';
import { matchesScopePath } from '../../src/scope/files.js';

describe('matchGlob', () => {
  it('* stays inside one path segment', () => {
    expect(matchGlob('src/a.ts', 'src/*.ts')).toBe(true);
    expect(matchGlob('src/x/a.ts', 'src/*.ts')).toBe(false);
    expect(matchGlob('a.ts', '*.ts')).toBe(true);
    expect(matchGlob('src/a.ts', '*.ts')).toBe(false);
  });

  it('** crosses segments and may match zero of them', () => {
    expect(matchGlob('src/a.ts', 'src/**/*.ts')).toBe(true);
    expect(matchGlob('src/x/y/a.ts', 'src/**/*.ts')).toBe(true);
    expect(matchGlob('src/a.py', 'src/**/*.ts')).toBe(false);
    expect(matchGlob('a/b/c.ts', '**')).toBe(true);
    expect(matchGlob('a/b/c.ts', '**/c.ts')).toBe(true);
    expect(matchGlob('c.ts', '**/c.ts')).toBe(true);
    expect(matchGlob('xc.ts', '**/c.ts')).toBe(false);
  });

  it('? matches exactly one character that is not a slash', () => {
    expect(matchGlob('a1.ts', 'a?.ts')).toBe(true);
    expect(matchGlob('a.ts', 'a?.ts')).toBe(false);
    expect(matchGlob('a/.ts', 'a?.ts')).toBe(false);
  });

  it('treats every other character, including regex syntax, literally', () => {
    expect(matchGlob('a+b.ts', 'a+b.ts')).toBe(true);
    expect(matchGlob('aab.ts', 'a+b.ts')).toBe(false);
    expect(matchGlob('a.ts', 'a.ts')).toBe(true);
    expect(matchGlob('axts', 'a.ts')).toBe(false);
    expect(matchGlob('a(1).ts', 'a(1).ts')).toBe(true);
    expect(matchGlob('a[1].ts', 'a[1].ts')).toBe(true);
    expect(matchGlob('a1.ts', 'a[1].ts')).toBe(false);
  });

  it('matches the whole path, never a part of it', () => {
    expect(matchGlob('xsrc/a.ts', 'src/a.ts')).toBe(false);
    expect(matchGlob('src/a.tsx', 'src/a.ts')).toBe(false);
  });
});

describe('matchesScopePath', () => {
  it('a trailing slash is a directory and everything under it', () => {
    expect(matchesScopePath('src/a/b.ts', 'src/')).toBe(true);
    expect(matchesScopePath('src/b.ts', 'src/')).toBe(true);
    expect(matchesScopePath('srcx/a.ts', 'src/')).toBe(false);
    expect(matchesScopePath('other/src/a.ts', 'src/')).toBe(false);
    expect(matchesScopePath('src', 'src/')).toBe(false);
  });

  it('anything else is a glob', () => {
    expect(matchesScopePath('src/a/b.ts', 'src/**/*.ts')).toBe(true);
    expect(matchesScopePath('src/b.py', '*.ts')).toBe(false);
    expect(matchesScopePath('src/b.ts', 'src')).toBe(false);
    expect(matchesScopePath('b.ts', 'b.ts')).toBe(true);
  });

  it('a directory pattern may itself hold a glob', () => {
    expect(matchesScopePath('packages/a/src/x.ts', 'packages/*/src/')).toBe(true);
    expect(matchesScopePath('packages/a/b/src/x.ts', 'packages/*/src/')).toBe(false);
  });

  it('a leading ./ is the repository root', () => {
    expect(matchesScopePath('src/a.ts', './src/')).toBe(true);
    expect(matchesScopePath('src/a.ts', './src/*.ts')).toBe(true);
  });
});
