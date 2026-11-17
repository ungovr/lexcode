import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { namedModifiers, notClearedReasons } from '../../scripts/swift-modifiers.mjs';

// scripts/rule-cost.mjs clears a Swift rule the engine's scanner bug slowed only when the plain filler shows it is not
// slow (#13322). These tests hold the two parts that need no engine: the reasons a rule stays NOT CLEARED, and the
// by-hand list in RELEASING.md, which must name every Swift rule the modifier detector names.

const ROOT = join(import.meta.dirname, '..', '..');

function swiftRules(): string[] {
  const out: string[] = [];
  const rules = join(ROOT, 'rules');
  for (const d of readdirSync(rules, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    for (const f of readdirSync(join(rules, d.name))) if (/^swift-.*\.yml$/.test(f)) out.push(`${d.name}/${f}`);
  }
  return out.sort();
}

describe('notClearedReasons', () => {
  it('clears a rule that names no modifier and matches the same on both fillers', () => {
    expect(notClearedReasons({ named: [], firstMatches: 3, plainMatches: 3 })).toEqual([]);
  });

  it('keeps a rule that matches more on the first filler than on the plain one, though it names no modifier', () => {
    const reasons = notClearedReasons({ named: [], firstMatches: 93, plainMatches: 1 });
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toMatch(/93 matches on the first filler and 1 on the plain/);
  });

  it('keeps a rule that names a modifier even when its matches are the same', () => {
    const reasons = notClearedReasons({ named: ['final'], firstMatches: 1, plainMatches: 1 });
    expect(reasons).toEqual(['it names final']);
  });

  it('gives both reasons when both hold', () => {
    expect(notClearedReasons({ named: ['@Model'], firstMatches: 5, plainMatches: 0 })).toHaveLength(2);
  });

  it('does not clear a rule whose match counts are unknown', () => {
    expect(notClearedReasons({ named: [], firstMatches: undefined, plainMatches: 0 })).toEqual(['its match counts are missing']);
  });
});

describe('namedModifiers', () => {
  it('reads a modifier behind a regex escape and an attribute, and skips the import guard and exclusions', () => {
    const named = namedModifiers(`rules:
  - id: x
    languages: [swift]
    severity: INFO
    message: x
    patterns:
      - pattern-regex: '(?ms)\\A(?=.*^\\x{FEFF}?[ \\t]*(?:@\\w+(?:\\([^)]*\\))?\\s+)*import\\s+Foo\\b).*'
      - pattern-regex: '\\bfinal class'
      - pattern-not: '@Model class $C { ... }'
      - pattern: '@Field var $X'
`);
    expect(named.sort()).toEqual(['@Field', 'final']);
  });
});

describe('RELEASING.md by-hand list', () => {
  it('names every Swift rule the modifier detector names, and no other', () => {
    const named = swiftRules().filter((r) => namedModifiers(readFileSync(join(ROOT, 'rules', r), 'utf8')).length > 0);
    const releasing = readFileSync(join(ROOT, 'RELEASING.md'), 'utf8');
    const block = /<!-- swift-by-hand:start -->([\s\S]*?)<!-- swift-by-hand:end -->/.exec(releasing)?.[1] ?? '';
    const listed = [...block.matchAll(/`(swift-[\w-]+)`/g)].map((m) => m[1]);
    expect(named.length).toBeGreaterThan(0);
    expect([...new Set(listed)].sort()).toEqual(named.map((r) => r.split('/')[1]!.replace(/\.yml$/, '')).sort());
  });
});
