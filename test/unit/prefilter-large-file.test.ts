import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cacheDir } from '../../src/engine/cache.js';
import { pinnedEnginePath } from '../../src/engine/fetch.js';
import { ENGINE_PIN } from '../../src/engine/pin.js';
import { platformKey } from '../../src/engine/platform.js';
import { runEngine } from '../../src/engine/run.js';
import { loadRuleSet, writeMergedConfig } from '../../src/rules/load.js';

function cachedEngine(): string | undefined {
  try {
    const p = pinnedEnginePath(ENGINE_PIN, platformKey(), cacheDir());
    return existsSync(p) ? p : undefined;
  } catch {
    return undefined;
  }
}
const engine = process.env.LEXCODE_ENGINE ?? cachedEngine();

/**
 * A whole-file `pattern-regex` pre-filter stops matching in a large file with no error recorded. On opengrep
 * 1.33.1 the lookahead gives up after about a million backtracking steps: with several alternatives in one
 * lookahead the JVM rules lost matches from 120 KB (analytics-calls) and 160 KB (post-model, direct-message),
 * and the converted one-literal greedy form `(?s)\A(?=.*LITERAL).*`, whose steps count from the end of the
 * file, loses an only occurrence near the top from about 1,050 KB. Each file below is filler that names none
 * of the rule's literals plus the only construct that matches: at the end of a 300 KB file, the case the
 * alternations failed, and near the top of a 900 KB file, the worst case just inside the reach. A regression,
 * or an engine that shortens the reach, shows as a lost match.
 */
const END_KB = 300;
const TOP_KB = 900;

interface Case {
  rule: string;
  file: string;
  head: string;
  construct: string;
  /** The text of the line the match is reported on. */
  at: string;
}

const CASES: Case[] = [
  {
    rule: 'lexcode.social.java-post-model',
    file: 'Big.java',
    head: 'package demo;\n',
    construct: 'class Post { private int likes; }\n',
    at: 'class Post { private int likes; }',
  },
  {
    rule: 'lexcode.social.java-direct-message',
    file: 'Big.java',
    head: 'package demo;\n',
    construct: 'class DirectMessage { private String recipient; private String sender; }\n',
    at: 'class DirectMessage { private String recipient; private String sender; }',
  },
  {
    rule: 'lexcode.tracking.java-analytics-calls',
    file: 'Big.java',
    head: 'package demo;\n',
    construct: 'class Z { void m(Object c) { FirebaseAnalytics.getInstance(c); } }\n',
    at: 'class Z { void m(Object c) { FirebaseAnalytics.getInstance(c); } }',
  },
  {
    rule: 'lexcode.tracking.kt-analytics-calls',
    file: 'Big.kt',
    head: 'package demo\n',
    construct: 'fun z(c: Any) { FirebaseAnalytics.getInstance(c) }\n',
    at: 'fun z(c: Any) { FirebaseAnalytics.getInstance(c) }',
  },
  {
    rule: 'lexcode.crawl.rb-mechanize-fetch',
    file: 'big.rb',
    head: 'require "mechanize"\n',
    construct: 'class Reader\n  def read(url)\n    @agent = Mechanize.new\n    @agent.get(url)\n  end\nend\n',
    at: '    @agent.get(url)',
  },
];

function filler(file: string, kb: number): string {
  const unit = file.endsWith('.kt')
    ? 'class C%N { private val a: Int = 1; private val b: Int = 2; fun m() { val x = 1 } }\n'
    : file.endsWith('.rb')
      ? 'class C%N\n  def m(a, b)\n    x = a + b\n    x * 2\n  end\nend\n'
      : 'class C%N { private int a; private int b; void m() { int x = 1; } }\n';
  let s = '';
  let i = 0;
  while (s.length < kb * 1000) s += unit.replace('%N', String(i++));
  return s;
}

/** The 1-based line of the first line that reads exactly `at`. */
function lineOf(text: string, at: string): number {
  return text.split('\n').indexOf(at) + 1;
}

describe.skipIf(!engine)('whole-file pre-filters keep their matches in a large file', () => {
  const rs = loadRuleSet();
  const shapes: { where: 'end' | 'top'; kb: number }[] = [
    { where: 'end', kb: END_KB },
    { where: 'top', kb: TOP_KB },
  ];
  for (const c of CASES) {
    for (const { where, kb } of shapes) {
      it(`${c.rule} matches its only construct at the ${where} of a ${kb} KB file`, async () => {
        const rule = rs.rules.filter((r) => r.id === c.rule);
        expect(rule).toHaveLength(1);
        const dir = await mkdtemp(join(tmpdir(), 'lexcode-large-'));
        try {
          const text = where === 'end' ? c.head + filler(c.file, kb) + c.construct : c.head + c.construct + filler(c.file, kb);
          expect(text.length).toBeGreaterThan(kb * 1000);
          // Just inside the reach: a file over 1,000,000 bytes is what the scan notices.
          expect(text.length).toBeLessThan(1_000_000);
          await writeFile(join(dir, c.file), text);
          const cfg = join(dir, 'rule.yml');
          writeMergedConfig(rule, cfg);
          const r = await runEngine({ engine: engine!, configFile: cfg, targets: [c.file], root: dir });
          expect(r.fileErrors).toBe(0);
          const line = lineOf(text, c.at);
          expect(line).toBeGreaterThan(0);
          expect(r.matches.map((m) => `${m.ruleId}:${m.line}`)).toEqual([`${c.rule}:${line}`]);
        } finally {
          await rm(dir, { recursive: true, force: true });
        }
      }, 120_000);
    }
  }
});
