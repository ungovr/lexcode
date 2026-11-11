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
 * A whole-file `pattern-regex` pre-filter with several alternatives in one lookahead made the engine drop
 * matches silently in large files (post-model and direct-message from 160 KB, analytics-calls from 120 KB
 * on opengrep 1.33.1; no error recorded). The converted rules use one literal per `pattern-regex`. Each file
 * below is about 300 KB of filler that names none of the rule's literals, then the only construct that
 * matches, at the end, so a regression shows as a lost match.
 */
const FILLER_KB = 300;

const CASES: { rule: string; file: string; head: string; tail: string }[] = [
  {
    rule: 'lexcode.social.java-post-model',
    file: 'Big.java',
    head: 'package demo;\n',
    tail: 'class Post { private int likes; }\n',
  },
  {
    rule: 'lexcode.social.java-direct-message',
    file: 'Big.java',
    head: 'package demo;\n',
    tail: 'class DirectMessage { private String recipient; private String sender; }\n',
  },
  {
    rule: 'lexcode.tracking.java-analytics-calls',
    file: 'Big.java',
    head: 'package demo;\n',
    tail: 'class Z { void m(Object c) { FirebaseAnalytics.getInstance(c); } }\n',
  },
  {
    rule: 'lexcode.tracking.kt-analytics-calls',
    file: 'Big.kt',
    head: 'package demo\n',
    tail: 'fun z(c: Any) { FirebaseAnalytics.getInstance(c) }\n',
  },
];

function filler(file: string): string {
  const unit = file.endsWith('.kt')
    ? 'class C%N { private val a: Int = 1; private val b: Int = 2; fun m() { val x = 1 } }\n'
    : 'class C%N { private int a; private int b; void m() { int x = 1; } }\n';
  let s = '';
  let i = 0;
  while (s.length < FILLER_KB * 1000) s += unit.replace('%N', String(i++));
  return s;
}

describe.skipIf(!engine)('whole-file pre-filters keep their matches in a large file', () => {
  const rs = loadRuleSet();
  for (const c of CASES) {
    it(`${c.rule} matches its only construct at the end of a ${FILLER_KB} KB file`, async () => {
      const rule = rs.rules.filter((r) => r.id === c.rule);
      expect(rule).toHaveLength(1);
      const dir = await mkdtemp(join(tmpdir(), 'lexcode-large-'));
      try {
        const text = c.head + filler(c.file) + c.tail;
        expect(text.length).toBeGreaterThan(FILLER_KB * 1000);
        await writeFile(join(dir, c.file), text);
        const cfg = join(dir, 'rule.yml');
        writeMergedConfig(rule, cfg);
        const r = await runEngine({ engine: engine!, configFile: cfg, targets: [c.file], root: dir });
        expect(r.fileErrors).toBe(0);
        const lines = text.split('\n').length - 1;
        expect(r.matches.map((m) => `${m.ruleId}:${m.line}`)).toEqual([`${c.rule}:${lines}`]);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    }, 60_000);
  }
});
