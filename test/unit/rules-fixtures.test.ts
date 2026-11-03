import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discoverFixtures, expectedCount } from '../../src/rules/fixtures.js';
import { bundledRulesDir } from '../../src/rules/load.js';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'lexcode-fixtures-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function put(rel: string, text: string): string {
  const file = join(dir, rel);
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, text);
  return file;
}

function rule(id: string): string {
  return `rules:\n  - id: ${id}\n    languages: [python]\n    severity: INFO\n    message: m\n    pattern: foo()\n`;
}

describe('expectedCount', () => {
  it('reads the count from a hash comment on line 1', () => {
    expect(expectedCount(put('a/x.test.py', '# lexcode-expect: 3\nfoo()\n'))).toBe(3);
  });

  it('reads the count from a slash comment on line 2', () => {
    expect(expectedCount(put('a/x.test.ts', '"use strict";\n// lexcode-expect: 2\nfoo();\n'))).toBe(2);
  });

  it('reads a block comment and an HTML comment', () => {
    expect(expectedCount(put('a/x.test.js', '/* lexcode-expect: 1 */\n'))).toBe(1);
    expect(expectedCount(put('a/x.test.xml', '<!-- lexcode-expect: 4 -->\n<a/>\n'))).toBe(4);
  });

  it('accepts zero', () => {
    expect(expectedCount(put('a/x.neg.test.py', '# lexcode-expect: 0\n'))).toBe(0);
  });

  it('names the fixture when there is no header', () => {
    const file = put('a/x.test.py', 'foo()\n');
    expect(() => expectedCount(file)).toThrow(file);
  });

  it('does not read a header on line 3 or later', () => {
    const file = put('a/x.test.py', 'a = 1\nb = 2\n# lexcode-expect: 1\n');
    expect(() => expectedCount(file)).toThrow(file);
  });

  it('does not read a header outside a comment', () => {
    const file = put('a/x.test.py', 'x = "lexcode-expect: 1"\n');
    expect(() => expectedCount(file)).toThrow(file);
  });

  it('reads a JSON fixture count from the .expect file beside it', () => {
    const file = put('a/x.test.json', '{"a": 1}\n');
    put('a/x.test.json.expect', '2\n');
    expect(expectedCount(file)).toBe(2);
  });

  it('fails a JSON fixture that has no .expect file, naming the fixture', () => {
    const file = put('a/x.test.json', '{"a": 1}\n');
    expect(() => expectedCount(file)).toThrow(file);
  });

  it('fails an .expect file that does not hold a single integer', () => {
    const file = put('a/x.test.json', '{}\n');
    put('a/x.test.json.expect', 'two\n');
    expect(() => expectedCount(file)).toThrow(`${file}.expect`);
  });
});

describe('discoverFixtures', () => {
  it('pairs each rule with its positive and negative fixtures, in several languages', () => {
    put('act_one/alpha.yml', rule('lexcode.one.alpha'));
    put('act_one/alpha.test.py', '# lexcode-expect: 1\n');
    put('act_one/alpha.test.ts', '// lexcode-expect: 1\n');
    put('act_one/alpha.neg.test.py', '# lexcode-expect: 0\n');
    put('act_two/beta.yml', rule('lexcode.two.beta'));
    put('act_two/beta.test.go', '// lexcode-expect: 2\n');
    put('act_two/beta.neg.test.go', '// lexcode-expect: 0\n');

    const cases = discoverFixtures(dir);
    const summary = cases.map((c) => [c.kind, c.ruleId, c.activity, c.fixture.slice(dir.length + 1)]);
    expect(summary).toEqual([
      ['negative', 'lexcode.one.alpha', 'act_one', 'act_one/alpha.neg.test.py'],
      ['positive', 'lexcode.one.alpha', 'act_one', 'act_one/alpha.test.py'],
      ['positive', 'lexcode.one.alpha', 'act_one', 'act_one/alpha.test.ts'],
      ['negative', 'lexcode.two.beta', 'act_two', 'act_two/beta.neg.test.go'],
      ['positive', 'lexcode.two.beta', 'act_two', 'act_two/beta.test.go'],
    ]);
    expect(cases[0]?.rulePath).toBe(join(dir, 'act_one', 'alpha.yml'));
  });

  it('does not take a sibling rule\'s fixture whose stem starts with the same letters', () => {
    put('a/foo.yml', rule('lexcode.a.foo'));
    put('a/foo.test.py', '# lexcode-expect: 1\n');
    put('a/foo-bar.yml', rule('lexcode.a.foo-bar'));
    put('a/foo-bar.test.py', '# lexcode-expect: 1\n');
    const byRule = discoverFixtures(dir).map((c) => `${c.ruleId} ${c.fixture.slice(dir.length + 1)}`);
    expect(byRule.sort()).toEqual(['lexcode.a.foo a/foo.test.py', 'lexcode.a.foo-bar a/foo-bar.test.py']);
  });

  it('skips .expect files and never reads a fixture as a rule', () => {
    put('a/x.yml', rule('lexcode.a.x'));
    put('a/x.test.json', '{}\n');
    put('a/x.test.json.expect', '1\n');
    put('a/x.neg.test.yml', 'rules: []\n');
    const cases = discoverFixtures(dir);
    expect(cases.map((c) => c.fixture.slice(dir.length + 1))).toEqual(['a/x.neg.test.yml', 'a/x.test.json']);
  });

  it('does not touch a header while discovering', () => {
    put('a/x.yml', rule('lexcode.a.x'));
    put('a/x.test.py', 'foo()\n'); // no header: reported by expectedCount, not by discovery
    expect(discoverFixtures(dir)).toHaveLength(1);
  });

  it('finds the fixtures of the bundled rules', () => {
    const cases = discoverFixtures(bundledRulesDir());
    expect(cases.some((c) => c.ruleId === 'lexcode.voice.whisper-transcribe' && c.kind === 'positive')).toBe(true);
    expect(cases.some((c) => c.ruleId === 'lexcode.voice.whisper-transcribe' && c.kind === 'negative')).toBe(true);
  });
});
