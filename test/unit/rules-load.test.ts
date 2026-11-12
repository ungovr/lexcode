import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { bundledRulesDir, classOf, familyOf, loadRuleSet, writeMergedConfig } from '../../src/rules/load.js';
import { validateRuleFiles } from '../../src/rules/validate.js';
import { ToolError } from '../../src/errors.js';

const rs = loadRuleSet();

describe('bundled rule set', () => {
  it('reads the pinned versions and the registry snapshot', () => {
    expect(rs.version).toBe('1.3.0');
    expect(rs.registryVersion).toBe('1.15');
    expect(rs.registry.get('crawls_web')?.page).toBe('https://lexlint.io/activities/crawls-web');
    expect(rs.registry.get('records_conversations')?.status).toBe('retired');
    expect(rs.registry.has('ships_encryption')).toBe(true); // a held id
  });

  it('bundledRulesDir holds ruleset.yml', () => {
    expect(readFileSync(join(bundledRulesDir(), 'ruleset.yml'), 'utf8')).toContain('lexcode-rules');
  });

  it('familyOf covers the id, its parent and the parent\'s children', () => {
    expect(familyOf('generates_images', rs)).toEqual(
      new Set(['generates_content', 'generates_text', 'generates_images', 'generates_video', 'generates_audio']),
    );
    expect(familyOf('generates_content', rs)).toEqual(
      new Set(['generates_content', 'generates_text', 'generates_images', 'generates_video', 'generates_audio']),
    );
    expect(familyOf('crawls_web', rs)).toEqual(new Set(['crawls_web']));
    expect(familyOf('deploys_companion_chatbot', rs)).toEqual(
      new Set(['deploys_chatbot', 'deploys_companion_chatbot', 'deploys_mental_health_chatbot']),
    );
    expect(familyOf('not_a_real_id', rs)).toEqual(new Set(['not_a_real_id']));
  });

  it('classOf reads classes.yml and defaults unknown ids to declaration-only', () => {
    expect(classOf('crawls_web', rs)).toBe('evidence');
    expect(classOf('ships_encryption', rs)).toBe('evidence');
    expect(classOf('operates_social_platform', rs)).toBe('signal');
    expect(classOf('is_bank', rs)).toBe('declaration-only');
    expect(classOf('records_conversations', rs)).toBe('declaration-only');
    expect(classOf('not_a_real_id', rs)).toBe('declaration-only');
  });

  it('counts 21 evidence and 5 signal ids', () => {
    const count = (c: string): number => [...rs.classes.values()].filter((v) => v === c).length;
    expect(count('evidence')).toBe(21);
    expect(count('signal')).toBe(5);
  });
});

let tmp: string;
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'lexcode-rules-'));
});
afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

const PAGE = 'https://lexlint.io/activities/crawls-web';

/** A rule body; `metadata` merges into the default metadata, and any other key replaces the default's. */
function rule(over: { id?: string; metadata?: Record<string, unknown>; [key: string]: unknown } = {}): Record<string, unknown> {
  const { id, metadata, ...rest } = over;
  return {
    id: id ?? 'lexcode.crawls-web.demo',
    languages: ['python'],
    severity: 'INFO',
    message: 'Demo rule message.',
    pattern: 'requests.get(...)',
    metadata: {
      activity: 'crawls_web',
      mentioned: 'performs',
      definition: PAGE,
      provenance: 'ungovr-original',
      license: 'MIT',
      ...(metadata ?? {}),
    },
    ...rest,
  };
}

function writeRule(dir: string, activity: string, stem: string, rules: unknown[], fixtures = true): string {
  const d = join(dir, activity);
  mkdirSync(d, { recursive: true });
  const file = join(d, `${stem}.yml`);
  writeFileSync(file, stringify({ rules }));
  if (fixtures) {
    writeFileSync(join(d, `${stem}.test.py`), 'requests.get(u)\n');
    writeFileSync(join(d, `${stem}.neg.test.py`), 'print(1)\n');
  }
  return file;
}

describe('loadRuleSet with extra directories', () => {
  it('loads one valid rule with defaults', () => {
    const file = writeRule(tmp, 'crawls_web', 'demo', [rule()]);
    const set = loadRuleSet([tmp]);
    const r = set.rules.find((x) => x.id === 'lexcode.crawls-web.demo');
    expect(r).toBeDefined();
    expect(r).toMatchObject({
      file,
      activity: 'crawls_web',
      mentioned: 'performs',
      strength: 'evidence',
      definition: PAGE,
      languages: ['python'],
      message: 'Demo rule message.',
      replaces: [],
    });
    expect(r?.hostMetavar).toBeUndefined();
  });

  it('reads strength, host_metavar and replaces from metadata', () => {
    writeRule(tmp, 'crawls_web', 'demo', [
      rule({ metadata: { strength: 'signal', host_metavar: '$URL', replaces: ['lexcode.crawls-web.old'] } }),
    ]);
    const r = loadRuleSet([tmp]).rules.find((x) => x.id === 'lexcode.crawls-web.demo');
    expect(r).toMatchObject({ strength: 'signal', hostMetavar: '$URL', replaces: ['lexcode.crawls-web.old'] });
  });

  it('skips fixtures whose names contain .test.', () => {
    writeRule(tmp, 'crawls_web', 'demo', [rule()]);
    writeFileSync(join(tmp, 'crawls_web', 'demo.test.yml'), 'not: a rule file\n');
    writeFileSync(join(tmp, 'crawls_web', 'demo.neg.test.yml'), 'not: a rule file\n');
    expect(() => loadRuleSet([tmp])).not.toThrow();
  });

  it('throws ToolError on a rule file with two rules', () => {
    writeRule(tmp, 'crawls_web', 'two', [rule(), rule({ id: 'lexcode.crawls-web.other' })]);
    expect(() => loadRuleSet([tmp])).toThrow(ToolError);
  });

  it('throws ToolError on a rule file with no rules', () => {
    writeRule(tmp, 'crawls_web', 'none', []);
    expect(() => loadRuleSet([tmp])).toThrow(ToolError);
  });

  it('throws ToolError on a rule that names no languages, which a scan would otherwise never hand the engine (#12997)', () => {
    writeRule(tmp, 'crawls_web', 'nolang', [rule({ languages: [] })]);
    expect(() => loadRuleSet([tmp])).toThrow(/names no languages/);
  });

  it('reads paths.include, and leaves it unset when the list is empty or holds anything but strings (#12997)', () => {
    writeRule(tmp, 'crawls_web', 'inc', [rule({ paths: { include: ['pyproject.toml', 'x.*'] } })]);
    writeRule(tmp, 'crawls_web', 'empty', [rule({ id: 'lexcode.crawls-web.empty', paths: { include: [] } })]);
    writeRule(tmp, 'crawls_web', 'mixed', [rule({ id: 'lexcode.crawls-web.mixed', paths: { include: ['a.py', 7] } })]);
    const rules = loadRuleSet([tmp]).rules;
    expect(rules.find((x) => x.id === 'lexcode.crawls-web.demo')?.include).toEqual(['pyproject.toml', 'x.*']);
    expect(rules.find((x) => x.id === 'lexcode.crawls-web.empty')?.include).toBeUndefined();
    expect(rules.find((x) => x.id === 'lexcode.crawls-web.mixed')?.include).toBeUndefined();
  });

  it('throws ToolError on a duplicate rule id across files', () => {
    writeRule(tmp, 'crawls_web', 'a', [rule()]);
    writeRule(tmp, 'crawls_web', 'b', [rule()]);
    expect(() => loadRuleSet([tmp])).toThrow(ToolError);
  });
});

describe('writeMergedConfig', () => {
  it('writes one rules document that parses back to the same ids and bodies', () => {
    writeRule(tmp, 'crawls_web', 'a', [rule({ id: 'lexcode.crawls-web.a' })]);
    writeRule(tmp, 'crawls_web', 'b', [rule({ id: 'lexcode.crawls-web.b' })]);
    const set = loadRuleSet([tmp]);
    const mine = set.rules.filter((r) => r.file.startsWith(tmp));
    const dest = join(tmp, 'merged.yml');
    writeMergedConfig(mine, dest);
    const doc = parse(readFileSync(dest, 'utf8')) as { rules: Record<string, unknown>[] };
    expect(doc.rules.map((r) => r['id']).sort()).toEqual(['lexcode.crawls-web.a', 'lexcode.crawls-web.b']);
    expect(doc.rules.find((r) => r['id'] === 'lexcode.crawls-web.a')).toEqual(rule({ id: 'lexcode.crawls-web.a' }));
  });
});

describe('validateRuleFiles is not vacuous', () => {
  it('passes a complete rule', () => {
    writeRule(tmp, 'crawls_web', 'demo', [rule()]);
    expect(validateRuleFiles(tmp, rs)).toEqual([]);
  });

  it('reports a rule missing provenance', () => {
    const r = rule();
    delete (r['metadata'] as Record<string, unknown>)['provenance'];
    writeRule(tmp, 'crawls_web', 'demo', [r]);
    const problems = validateRuleFiles(tmp, rs);
    expect(problems.length).toBe(1);
    expect(problems[0]).toContain('provenance');
  });

  it('reports a cwe key, a wrong definition, an unknown activity directory and a bad id', () => {
    writeRule(tmp, 'crawls_web', 'a', [rule({ metadata: { cwe: 'CWE-1' } })]);
    writeRule(tmp, 'crawls_web', 'b', [rule({ id: 'lexcode.crawls-web.b', metadata: { definition: 'https://x.test/' } })]);
    writeRule(tmp, 'crawls_web', 'c', [rule({ id: 'Bad_Id', metadata: { mentioned: 'sometimes' } })]);
    writeRule(tmp, 'no_such_activity', 'd', [rule({ id: 'lexcode.nsa.d' })]);
    const joined = validateRuleFiles(tmp, rs).join('\n');
    expect(joined).toContain('cwe');
    expect(joined).toContain('definition');
    expect(joined).toContain('Bad_Id');
    expect(joined).toContain('mentioned');
    expect(joined).toContain('no_such_activity');
  });

  it('reports a rule whose activity differs from its directory', () => {
    writeRule(tmp, 'trains_models', 'demo', [rule()]);
    expect(validateRuleFiles(tmp, rs).join('\n')).toContain('activity');
  });

  it('reports a missing negative fixture and a missing positive fixture', () => {
    const file = writeRule(tmp, 'crawls_web', 'demo', [rule()], false);
    writeFileSync(file.replace('.yml', '.test.py'), 'x\n');
    let problems = validateRuleFiles(tmp, rs);
    expect(problems.some((p) => p.startsWith('[fixtures]') && p.includes('neg'))).toBe(true);
    rmSync(file.replace('.yml', '.test.py'));
    writeFileSync(file.replace('.yml', '.neg.test.py'), 'x\n');
    problems = validateRuleFiles(tmp, rs);
    expect(problems.some((p) => p.startsWith('[fixtures]') && !p.includes('neg'))).toBe(true);
  });

  it('reports duplicate ids and ids that collide with a replaces entry', () => {
    writeRule(tmp, 'crawls_web', 'a', [rule()]);
    writeRule(tmp, 'crawls_web', 'b', [rule({ id: 'lexcode.crawls-web.b', metadata: { replaces: ['lexcode.crawls-web.demo'] } })]);
    writeRule(tmp, 'crawls_web', 'c', [rule({ id: 'lexcode.crawls-web.demo' })]);
    const joined = validateRuleFiles(tmp, rs).join('\n');
    expect(joined).toContain('lexcode.crawls-web.demo');
  });

  it('reports a file with two rules instead of throwing', () => {
    writeRule(tmp, 'crawls_web', 'two', [rule(), rule({ id: 'lexcode.crawls-web.other' })]);
    expect(validateRuleFiles(tmp, rs).join('\n')).toContain('exactly one rule');
  });
});
