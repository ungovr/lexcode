import { describe, expect, it } from 'vitest';
import { opensRubyBlock, rubyLines, splitRubyStatements } from '../../src/manifests/util.js';

const read = (text: string): { code: string; line: number }[] => [...rubyLines(text, /^(?:gem|pod)\b/)];

describe('rubyLines', () => {
  it('joins a call that runs on after a comma or a backslash, and keeps the line it starts on', () => {
    const text = ['source "https://rubygems.org"', 'gem "rails",', '  "~> 7.1", # pinned', '  require: false', 'gem "pg" \\', '  , "1.5"', 'gem "x"'].join('\n');
    expect(read(text)).toEqual([
      { code: 'source "https://rubygems.org"', line: 1 },
      { code: 'gem "rails", "~> 7.1", require: false', line: 2 },
      { code: 'gem "pg"  , "1.5"', line: 5 },
      { code: 'gem "x"', line: 7 },
    ]);
  });

  it('a blank or comment-only line after a comma does not end the call; one after a backslash does', () => {
    const text = ['pod "A",', '', '  # the version', '  "1.0"', 'pod "B" \\', '', '  "2.0"', 'pod "C", \\', '', '  "3.0"'].join('\n');
    expect(read(text)).toEqual([
      { code: 'pod "A", "1.0"', line: 1 },
      { code: 'pod "B"', line: 5 },
      { code: '"2.0"', line: 7 },
      { code: 'pod "C", "3.0"', line: 8 },
    ]);
  });

  it('a long continuation costs time in proportion to its length (final review minor 1)', () => {
    // Each continuation line once rebuilt and re-tested the whole joined text: 100,000 lines took 26.7 s.
    const text = `pod 'X',\n${'  :a => 1,\n'.repeat(100000)}  :b => 2\npod 'Y'\n`;
    const t0 = Date.now();
    const out = read(text);
    expect(Date.now() - t0).toBeLessThan(5000);
    expect(out.map((l) => l.line)).toEqual([1, 100003]);
    expect(out[0]?.code.endsWith(':a => 1, :b => 2')).toBe(true);
  });
});

describe('opensRubyBlock (#13511)', () => {
  it('an expression opener with the keyword end later on its line opens nothing', () => {
    expect(opensRubyBlock('x = (if a then 1 else 2 end)')).toBe(false);
    expect(opensRubyBlock("z = (case opts[:end] when 'end' then 3 end)")).toBe(false);
    expect(opensRubyBlock('a = (if x then 1 end) || begin')).toBe(true);
  });

  it('an end that is a method, a symbol, a variable or a word in a string is not the keyword', () => {
    expect(opensRubyBlock('x = if (1..3).end > 2')).toBe(true);
    expect(opensRubyBlock('x = if ENV["end"]')).toBe(true);
    expect(opensRubyBlock("x = if opts[:end] || 'end'")).toBe(true);
    expect(opensRubyBlock('x = if range.end')).toBe(true);
    expect(opensRubyBlock('x = if @end')).toBe(true);
    expect(opensRubyBlock('x = if end?')).toBe(true);
  });
});

describe('splitRubyStatements (#13511)', () => {
  it('splits at a top-level ; and nowhere else', () => {
    expect(splitRubyStatements('gem "a"; gem "b"')).toEqual(['gem "a"', 'gem "b"']);
    expect(splitRubyStatements('gem "h", "~> 1.0; beta"')).toEqual(['gem "h", "~> 1.0; beta"']);
    expect(splitRubyStatements('group :test do gem "f"; gem "g" end')).toEqual(['group :test do gem "f"; gem "g" end']);
    expect(splitRubyStatements('gem "e"; group :test do gem "f"; gem "g" end; gem "i"')).toEqual([
      'gem "e"',
      'group :test do gem "f"; gem "g" end',
      'gem "i"',
    ]);
    expect(splitRubyStatements('x = foo(a; b); gem "download"; end')).toEqual(['x = foo(a; b)', 'gem "download"', 'end']);
    expect(splitRubyStatements('gem "a";')).toEqual(['gem "a"']);
  });
});
