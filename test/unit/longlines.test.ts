import { statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { longLineFiles } from '../../src/scope/longlines.js';
import { tree } from './helpers.js';

describe('longLineFiles (#13251)', () => {
  /** One line of exactly `chars` characters, so the file is `chars` bytes: the smallest size that can be long. */
  const line = (chars: number): string => 'a'.repeat(chars);

  function setup(): { root: string; pathOf: (f: string) => string; realBytes: (f: string) => number } {
    const root = tree({ 'long.js': line(100_001), 'limit.js': line(100_000), 'short.js': 'x = 1\n' });
    const pathOf = (f: string): string => join(root, f);
    return { root, pathOf, realBytes: (f) => statSync(pathOf(f)).size };
  }

  it('reads a file over 100,000 bytes and finds its long line, and passes the one at the limit', () => {
    const { pathOf, realBytes } = setup();
    expect(longLineFiles(['long.js', 'limit.js', 'short.js'], { pathOf, bytesOf: realBytes, judged: new Map() })).toEqual(new Set(['long.js']));
  });

  it('does not read a file whose size rules a long line out', () => {
    const { pathOf, realBytes } = setup();
    // The size says 100,000 bytes, which cannot hold a 100,001-character line, so the file is not read and not long.
    const bytesOf = (f: string): number => (f === 'long.js' ? 100_000 : realBytes(f));
    expect(longLineFiles(['long.js', 'short.js'], { pathOf, bytesOf, judged: new Map() })).toEqual(new Set());
  });

  it('asks the size of every file it does not have an answer for, once, and of no judged copy', () => {
    const { pathOf, realBytes } = setup();
    const asked: string[] = [];
    const bytesOf = (f: string): number => {
      asked.push(f);
      return realBytes(f);
    };
    const judged = new Map([['copy.lexcode.js', false]]);
    longLineFiles(['long.js', 'short.js', 'copy.lexcode.js'], { pathOf, bytesOf, judged });
    expect(asked).toEqual(['long.js', 'short.js']);
  });

  it('takes a judged copy\'s answer without reading it', () => {
    const { pathOf, realBytes } = setup();
    // gone.lexcode.js was never written; long.js holds a long line that the judged answer overrules.
    const judged = new Map([
      ['gone.lexcode.js', true],
      ['long.js', false],
    ]);
    expect(longLineFiles(['gone.lexcode.js', 'long.js', 'short.js'], { pathOf, bytesOf: realBytes, judged })).toEqual(new Set(['gone.lexcode.js']));
  });

  it('counts a file it cannot read as not long, as hasLongLine does', () => {
    const { pathOf } = setup();
    expect(longLineFiles(['missing.js'], { pathOf, bytesOf: () => 200_000, judged: new Map() })).toEqual(new Set());
  });
});
