import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { describe, expect, it } from 'vitest';
import { cacheDir } from '../../src/engine/cache.js';
import { pinnedEnginePath } from '../../src/engine/fetch.js';
import { ENGINE_PIN } from '../../src/engine/pin.js';
import { platformKey } from '../../src/engine/platform.js';
import { runEngine } from '../../src/engine/run.js';
import { loadRuleSet, readRuleFile } from '../../src/rules/load.js';
import { FILLER, fill } from '../../scripts/filler.mjs';

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
 * The engine matches a taint rule's sinks across the whole file, and its taint pass then costs time
 * that grows with the number of sink matches times the size of the file. With every return in the file
 * as the sink, the Python and JavaScript `*-result-returned` rules took 15 to 25 s on a 900 KB file of
 * small functions, where a scan gives one rule 30 s per file (#13034). A sink scoped to the functions
 * that make the source call matches nothing in code that never makes it.
 *
 * Each taint rule's sinks run here as a search rule over the filler `scripts/rule-cost.mjs` times rules
 * on: classes, fields and functions that each return a variable, naming nothing a rule looks for. A sink
 * that matches there matches every function of a large file. This counts matches, so it holds on any
 * machine; `scripts/rule-cost.mjs` measures the time before a release.
 */
const FILLER_KB = 20;

/**
 * Rules whose sink still matches every return, each to be scoped like the Python and JavaScript ones
 * (#13034). A rule leaves this list once its sink matches nothing here; the test fails while a listed
 * rule no longer matches, so the list cannot outlive its entries.
 */
const OPEN = new Set<string>([
  'lexcode.generate.java-model-result-returned',
  'lexcode.image.java-image-result-returned',
  'lexcode.text.java-chat-result-returned',
  'lexcode.generate.kt-model-result-returned',
  'lexcode.image.kt-image-result-returned',
  'lexcode.text.kt-chat-framework-result-returned',
  'lexcode.text.kt-chat-result-returned',
  'lexcode.generate.rb-model-result-returned',
  'lexcode.image.rb-image-result-returned',
  'lexcode.text.rb-chat-result-returned',
]);

const FORMULA_KEYS = ['pattern', 'patterns', 'pattern-either', 'pattern-regex'];

interface Filler {
  language: string;
  unit: string;
  head?: string;
}

/** One filler extension per engine language. */
function fillerByLanguage(): Map<string, { ext: string; filler: Filler }> {
  const out = new Map<string, { ext: string; filler: Filler }>();
  for (const [ext, filler] of Object.entries(FILLER as Record<string, Filler>)) {
    if (!out.has(filler.language)) out.set(filler.language, { ext, filler });
  }
  return out;
}

describe.skipIf(!engine)('taint sinks are scoped to the code they watch', () => {
  it('no taint rule has a sink that matches filler which calls nothing a rule looks for', async () => {
    const rs = loadRuleSet();
    const byLanguage = fillerByLanguage();
    /** search rule id -> taint rule id */
    const owner = new Map<string, string>();
    const rulesFor = new Map<string, object[]>();
    const taintRules = new Set<string>();
    for (const meta of rs.rules) {
      const body = readRuleFile(meta.file);
      if (body['mode'] !== 'taint') continue;
      taintRules.add(meta.id);
      const sinks = body['pattern-sinks'];
      expect(Array.isArray(sinks), `${meta.id} has pattern-sinks`).toBe(true);
      for (const language of meta.languages) {
        if (!byLanguage.has(language)) continue;
        (sinks as Record<string, unknown>[]).forEach((sink, i) => {
          const id = `${meta.id}--sink-${i}--${language}`;
          const rule: Record<string, unknown> = { id, languages: [language], severity: 'INFO', message: 'sink' };
          for (const k of FORMULA_KEYS) if (k in sink) rule[k] = sink[k];
          if (body['paths'] !== undefined) rule['paths'] = body['paths'];
          owner.set(id, meta.id);
          if (!rulesFor.has(language)) rulesFor.set(language, []);
          rulesFor.get(language)!.push(rule);
        });
      }
    }
    expect(taintRules.size).toBeGreaterThan(0);
    for (const id of OPEN) expect(taintRules.has(id), `${id} in OPEN is a taint rule`).toBe(true);

    const counts = new Map<string, number>();
    const dir = await mkdtemp(join(tmpdir(), 'lexcode-sinks-'));
    try {
      for (const [language, rules] of rulesFor) {
        const { ext, filler } = byLanguage.get(language)!;
        const file = `filler${ext}`;
        await writeFile(join(dir, file), fill(filler.head ?? '', filler.unit, FILLER_KB));
        const cfg = join(dir, `${language}.yml`);
        await writeFile(cfg, stringify({ rules }));
        const r = await runEngine({ engine: engine!, configFile: cfg, targets: [file], root: dir });
        expect(r.fileErrors, `${language} filler read without errors`).toBe(0);
        for (const m of r.matches) {
          const rule = owner.get(m.ruleId);
          if (rule) counts.set(rule, (counts.get(rule) ?? 0) + 1);
        }
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }

    const unscoped = [...counts].filter(([id]) => !OPEN.has(id)).map(([id, n]) => `${id}: ${n} sink matches`);
    expect(unscoped, 'taint rules whose sink matches code that never calls the source (CONTRIBUTING.md, Cost)').toEqual([]);
    const fixed = [...OPEN].filter((id) => !counts.has(id));
    expect(fixed, 'rules in OPEN whose sink no longer matches the filler: take them off the list').toEqual([]);
  }, 300_000);
});
