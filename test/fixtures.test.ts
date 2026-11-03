import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { ensureEngine } from '../src/engine/fetch.js';
import { runEngine, type RunEngineResult } from '../src/engine/run.js';
import { discoverFixtures, expectedCount } from '../src/rules/fixtures.js';
import { bundledRulesDir, loadRuleSet, writeMergedConfig } from '../src/rules/load.js';
import type { RuleSet } from '../src/types.js';

// The rule fixture runner (design 6.4). One engine run covers every rule (merged into one config)
// and every fixture (passed as an explicit target). Each fixture is then its own test, named by
// its path, so a failure says which fixture broke.
//
// Positive fixture <stem>.test.<ext>: the count of matches of its own rule equals its header.
// Negative fixture <stem>.neg.test.<ext>: no rule of the same activity matches it at all.
// Header: `lexcode-expect: N` in a comment on line 1 or 2 (a JSON fixture: N in <fixture>.expect).
//
// Explicit targets are always scanned by the engine, even under a directory named rules/ or a
// file named *.test.*; its ignore files only apply when it walks a directory. That is why this
// runner lists the fixtures itself instead of pointing the engine at rules/.

const rulesDir = bundledRulesDir();
const cases = discoverFixtures(rulesDir);
const posix = (p: string): string => p.split('\\').join('/');
const rel = (file: string): string => posix(relative(rulesDir, file));

let result: RunEngineResult;
let ruleSet: RuleSet;
let tmp: string;

beforeAll(async () => {
  const offline = process.env.LEXCODE_OFFLINE === '1';
  let engine: string;
  try {
    engine = (await ensureEngine({ download: !offline })).path;
  } catch (e) {
    throw new Error(
      `The fixture suite needs the Opengrep engine and cannot get it: ${(e as Error).message}\n` +
        'Run `npm run build && node dist/cli.js engine fetch` once (it needs network), or set LEXCODE_ENGINE=<path to opengrep>. ' +
        'This suite never passes without an engine.',
    );
  }
  ruleSet = loadRuleSet();
  tmp = mkdtempSync(join(tmpdir(), 'lexcode-fixtures-'));
  const config = join(tmp, 'rules.yml');
  writeMergedConfig(ruleSet.rules, config);
  result = await runEngine({ engine, configFile: config, targets: cases.map((c) => rel(c.fixture)), root: rulesDir });
});

afterAll(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

describe('rule fixtures', () => {
  it('the rule set has fixtures to run', () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  it('the engine read every fixture without a parse error or timeout', () => {
    // A negative fixture the engine could not parse would pass with zero matches.
    expect(result.fileErrors).toBe(0);
  });

  for (const c of cases) {
    const name = `${c.kind} ${rel(c.fixture)}`;
    it(name, () => {
      const expected = expectedCount(c.fixture);
      const path = rel(c.fixture);
      const here = result.matches.filter((m) => m.path === path);
      if (c.kind === 'positive') {
        expect(expected, `${path}: a positive fixture expects at least one match`).toBeGreaterThanOrEqual(1);
        const own = here.filter((m) => m.ruleId === c.ruleId);
        expect(own.length, `${path}: matches of ${c.ruleId} (lines ${own.map((m) => m.line).join(', ') || 'none'})`).toBe(expected);
      } else {
        expect(expected, `${path}: a negative fixture declares lexcode-expect: 0`).toBe(0);
        const sameActivity = new Set(ruleSet.rules.filter((r) => r.activity === c.activity).map((r) => r.id));
        const hits = here.filter((m) => sameActivity.has(m.ruleId));
        expect(
          hits.map((m) => `${m.ruleId} at line ${m.line}`),
          `${path}: a negative fixture must not match any ${c.activity} rule`,
        ).toEqual([]);
      }
    });
  }
});
