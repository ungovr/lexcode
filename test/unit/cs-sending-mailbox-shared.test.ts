import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { bundledRulesDir } from '../../src/rules/load.js';

// A store's sending mail account (nopCommerce's EmailAccount: the mailbox and SMTP login the app
// sends its own mail from) is not personal data (#13215). Every C# rule that reads stored fields sets
// it aside the same way: a class or table named for a mail account, in a file that maps a sending
// setting and names no owner. A rule file cannot include another, so each rule holds a copy of the
// file test and the account name; this test keeps the copies equal, so a change made to one copy
// fails here until it is made in every rule below.

const STEMS = ['processes_personal_data/cs-schema-field', 'processes_personal_data/cs-entity-field'];
const ACCOUNT_NAME = '(e_?mail|mail|smtp)_?accounts?';

type Node = unknown;

const load = (stem: string): Node =>
  (parse(readFileSync(join(bundledRulesDir(), `${stem}.yml`), 'utf8')) as { rules: Node[] }).rules[0];

/** Every object under `node` (depth first), the node itself included. */
function objects(node: Node): Record<string, unknown>[] {
  if (Array.isArray(node)) return node.flatMap(objects);
  if (node === null || typeof node !== 'object') return [];
  const o = node as Record<string, unknown>;
  return [o, ...Object.values(o).flatMap(objects)];
}

/** The `patterns` of the rule's sending-mailbox exclusion: the pattern-not-inside formula that holds the file test. */
function exclusion(stem: string): unknown[] {
  const found = objects(load(stem))
    .map((o) => o['pattern-not-inside'] as { patterns?: unknown[] } | undefined)
    .filter((n): n is { patterns: unknown[] } => Array.isArray(n?.patterns) && JSON.stringify(n.patterns).includes('smtp_?'));
  expect(found, `${stem}: one sending-mailbox exclusion`).toHaveLength(1);
  return found[0]!.patterns;
}

/** The file test: the sending-setting regexes and the nested owner formula (every item but the account-name scopes). */
const fileTest = (stem: string): unknown[] => exclusion(stem).slice(0, 2);

describe('the C# stored-field rules set aside a sending mail account the same way', () => {
  it('every rule holds the one file test (a sending setting, no owner)', () => {
    const tests = STEMS.map((s) => JSON.stringify(fileTest(s)));
    expect(tests[0]).toContain('host');
    expect(tests[0]).toContain('user_?id');
    expect(new Set(tests).size).toBe(1);
  });

  it('every account-name check in every rule reads the one account name', () => {
    for (const stem of STEMS) {
      const scopes = JSON.stringify(exclusion(stem).slice(2));
      const checks = scopes.split('_?accounts?').length - 1;
      const named = scopes.split(ACCOUNT_NAME).length - 1;
      expect(checks, `${stem}: account-name checks`).toBeGreaterThan(0);
      expect(named, `${stem}: checks that read ${ACCOUNT_NAME}`).toBe(checks);
    }
  });
});
