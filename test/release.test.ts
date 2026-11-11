import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { bundledRulesDir, loadRuleSet } from '../src/rules/load.js';
import { validateRuleFiles } from '../src/rules/validate.js';
import type { RuleMeta } from '../src/types.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const rulesDir = bundledRulesDir();

interface Snapshot {
  version: string;
  activities: { id: string }[];
  held: { id: string }[];
}
const snapshot = JSON.parse(readFileSync(join(rulesDir, 'registry.snapshot.json'), 'utf8')) as Snapshot;
const snapshotIds = [...snapshot.activities, ...snapshot.held].map((a) => a.id);

/** Evidence-class ids with no evidence-strength rule that satisfies `accept`. */
function evidenceIdsWithoutRule(accept: (r: RuleMeta) => boolean): string[] {
  const rs = loadRuleSet();
  const uncovered: string[] = [];
  for (const [id, cls] of rs.classes) {
    if (cls !== 'evidence') continue;
    if (!rs.rules.some((r) => r.activity === id && r.strength === 'evidence' && accept(r))) uncovered.push(id);
  }
  return uncovered;
}

describe('release: the rule set is complete and well formed', () => {
  it('every snapshot id has a class', () => {
    const classes = parse(readFileSync(join(rulesDir, 'classes.yml'), 'utf8')) as Record<string, string>;
    const keys = Object.keys(classes);
    expect(snapshotIds.filter((id) => !keys.includes(id))).toEqual([]);
    expect(keys.filter((k) => !snapshotIds.includes(k))).toEqual([]);
    for (const v of Object.values(classes)) {
      expect(['evidence', 'signal', 'declaration-only']).toContain(v);
    }
  });

  it('the ruleset pins the snapshot version', () => {
    const rs = loadRuleSet();
    expect(rs.registryVersion).toBe(snapshot.version);
  });

  it('every rule carries its metadata', () => {
    expect(validateRuleFiles(rulesDir, loadRuleSet()).filter((p) => !p.startsWith('[fixtures]'))).toEqual([]);
  });

  it('every rule has fixtures', () => {
    expect(validateRuleFiles(rulesDir, loadRuleSet()).filter((p) => p.startsWith('[fixtures]'))).toEqual([]);
  });

  // The publish gate (design 6.13): every evidence-class id has at least one
  // evidence-strength source rule, and the fixture tests above hold each rule
  // to a positive and a negative fixture. A component-map entry is not a rule
  // and does not count.
  it('evidence class is covered (the v1 publish gate)', () => {
    expect(evidenceIdsWithoutRule(() => true)).toEqual([]);
  });

  // The per-language gate (v1.1): Ruby joins the languages lexcode reads, so
  // every evidence-class id also has a Ruby rule at evidence strength. The next
  // language adds one line like this.
  it('every evidence-class id has a Ruby rule', () => {
    expect(evidenceIdsWithoutRule((r) => r.languages.includes('ruby'))).toEqual([]);
  });

  // The engine's `paths` excludes are unanchored globs, so `**/samples/**`
  // also drops a JVM package path (com/google/samples/apps/..., org/springframework/
  // samples/petclinic, every com/example package). A Java or Kotlin source rule
  // therefore carries none of them; build-file and config rules name real
  // directories and keep theirs.
  it('no Java or Kotlin source rule excludes a sample, example or demo path', () => {
    const hits: string[] = [];
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) walk(p);
        else if (/^(java|kt)-.*\.yml$/.test(e) && !/\.test\.yml$/.test(e)) {
          const doc = parse(readFileSync(p, 'utf8')) as { rules?: { id: string; paths?: { exclude?: string[] } }[] };
          for (const rule of doc.rules ?? []) {
            for (const glob of rule.paths?.exclude ?? []) {
              if (/\/(samples?|examples?|demos?)\//.test(glob)) hits.push(`${rule.id}: ${glob}`);
            }
          }
        }
      }
    };
    walk(rulesDir);
    expect(hits).toEqual([]);
  });

  it('contributing forbids the three rule sets', () => {
    const text = readFileSync(join(root, 'CONTRIBUTING.md'), 'utf8');
    for (const phrase of ['semgrep-rules', 'opengrep-rules', 'privado-rules', 'Commons Clause']) {
      expect(text).toContain(phrase);
    }
  });

  it('copy rules', () => {
    const files: string[] = [];
    const walk = (p: string): void => {
      if (!existsSync(p)) return;
      if (statSync(p).isDirectory()) {
        for (const e of readdirSync(p)) if (e !== 'node_modules') walk(join(p, e));
      } else files.push(p);
    };
    for (const p of ['src', 'rules', 'docs', 'README.md', 'RELEASING.md']) walk(join(root, p));
    const emDash = String.fromCharCode(0x2014);
    const banned = [/\bhonest(ly|y)?\b/i, /complian(t|ce)/i];
    const hits: string[] = [];
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      if (text.includes(emDash)) hits.push(`${f}: em dash`);
      for (const re of banned) if (re.test(text)) hits.push(`${f}: ${re}`);
    }
    expect(hits).toEqual([]);
  });
});
