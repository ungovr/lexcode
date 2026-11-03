import { describe, expect, it } from 'vitest';
import { compare } from '../../src/check/compare.js';
import { classOf, familyOf } from '../../src/check/family.js';
import type { Declaration, Evidence, EvidenceRecord, Mentioned, SignalRow } from '../../src/types.js';
import { makeRuleSet } from '../helpers/ruleset.js';

const rs = makeRuleSet();
const ev = (rule: string, where = 'src/a.ts:1'): Evidence => ({ rule, where });

function record(over: Partial<EvidenceRecord> = {}): EvidenceRecord {
  return {
    schema: 'https://lexlint.io/lexcode/v1',
    engine: { name: 'opengrep', version: '1.33.1' },
    rules: { name: 'lexcode-rules', version: '1.0.0' },
    registry: 'https://lexlint.io/activities/v1',
    registry_version: '1.15',
    scanned_at: '2026-11-03T00:00:00Z',
    root: '.',
    scope: { include: [], exclude: [], include_tests: false, files: 3, extracted: 0, dev_dependencies_skipped: 0 },
    activities: [],
    signals: [],
    searched_not_found: [],
    components: [],
    ignored: [],
    notices: [],
    ...over,
  };
}

function decl(declared: Record<string, Mentioned | 'declared'> = {}, absent: string[] = []): Declaration {
  return { source: 'ACTIVITIES.md', file: '/r/ACTIVITIES.md', declared: new Map(Object.entries(declared)), absent: new Set(absent) };
}

const opts = { failOnEnables: false };

describe('family helpers', () => {
  it('familyOf: the id, its parent, and every id under that parent or the id', () => {
    expect([...familyOf('generates_images', rs)].sort()).toEqual(
      ['generates_audio', 'generates_content', 'generates_images', 'generates_text', 'generates_video'],
    );
    expect([...familyOf('generates_content', rs)].sort()).toEqual(
      ['generates_audio', 'generates_content', 'generates_images', 'generates_text', 'generates_video'],
    );
    expect([...familyOf('deploys_chatbot', rs)].sort()).toEqual(
      ['deploys_chatbot', 'deploys_companion_chatbot', 'deploys_mental_health_chatbot'],
    );
  });
  it('familyOf: an id with no family, or an unknown id, is just itself', () => {
    expect([...familyOf('crawls_web', rs)]).toEqual(['crawls_web']);
    expect([...familyOf('made_up', rs)]).toEqual(['made_up']);
  });
  it('classOf: the class, and declaration-only for an unknown id', () => {
    expect(classOf('crawls_web', rs)).toBe('evidence');
    expect(classOf('operates_social_platform', rs)).toBe('signal');
    expect(classOf('made_up', rs)).toBe('declaration-only');
  });
});

describe('compare: the verdict table', () => {
  it('performs, declared: PASS confirmed', () => {
    const r = compare(record({ activities: [{ id: 'crawls_web', mentioned: 'performs', evidence: [ev('lexcode.crawl.x')] }] }), decl({ crawls_web: 'performs' }), rs, opts);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]).toMatchObject({ verdict: 'PASS', id: 'crawls_web', kind: 'confirmed' });
    expect(r.rows[0]?.rulesTried).toBe(2);
    expect(r.exitCode).toBe(0);
  });

  it('performs, declared from lexlint.yml (no mentioned value): PASS', () => {
    const r = compare(record({ activities: [{ id: 'crawls_web', mentioned: 'performs', evidence: [ev('lexcode.crawl.x')] }] }), decl({ crawls_web: 'declared' }), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'PASS', kind: 'confirmed' });
  });

  it('performs, not mentioned: FAIL not-mentioned with the evidence', () => {
    const e = ev('lexcode.crawl.x', 'src/crawl.ts:9');
    const r = compare(record({ activities: [{ id: 'crawls_web', mentioned: 'performs', evidence: [e] }] }), decl(), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'FAIL', id: 'crawls_web', kind: 'not-mentioned', evidence: [e] });
    expect(r.exitCode).toBe(1);
  });

  it('performs, declared absent: FAIL declared-absent', () => {
    const r = compare(record({ activities: [{ id: 'trains_models', mentioned: 'performs', evidence: [ev('r')] }] }), decl({}, ['trains_models']), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'FAIL', kind: 'declared-absent' });
    expect(r.exitCode).toBe(1);
  });

  it('enables only, not mentioned: WARN enables-undeclared, exit 0', () => {
    const r = compare(record({ activities: [{ id: 'tracks_devices', mentioned: 'enables', evidence: [ev('r')] }] }), decl(), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'WARN', kind: 'enables-undeclared' });
    expect(r.exitCode).toBe(0);
  });

  it('enables only, not mentioned, failOnEnables: FAIL with the same kind', () => {
    const r = compare(record({ activities: [{ id: 'tracks_devices', mentioned: 'enables', evidence: [ev('r')] }] }), decl(), rs, { failOnEnables: true });
    expect(r.rows[0]).toMatchObject({ verdict: 'FAIL', kind: 'enables-undeclared' });
    expect(r.exitCode).toBe(1);
  });

  it('enables only, declared absent: WARN enables-declared-absent; FAIL under failOnEnables', () => {
    const rec = record({ activities: [{ id: 'tracks_devices', mentioned: 'enables', evidence: [ev('r')] }] });
    expect(compare(rec, decl({}, ['tracks_devices']), rs, opts).rows[0]).toMatchObject({ verdict: 'WARN', kind: 'enables-declared-absent' });
    expect(compare(rec, decl({}, ['tracks_devices']), rs, { failOnEnables: true }).rows[0]).toMatchObject({ verdict: 'FAIL', kind: 'enables-declared-absent' });
  });

  it('enables only, declared: PASS confirmed', () => {
    const r = compare(record({ activities: [{ id: 'tracks_devices', mentioned: 'enables', evidence: [ev('r')] }] }), decl({ tracks_devices: 'enables' }), rs, { failOnEnables: true });
    expect(r.rows[0]).toMatchObject({ verdict: 'PASS', kind: 'confirmed' });
    expect(r.exitCode).toBe(0);
  });

  it('declared and searched_not_found: INFO not-found with rulesTried', () => {
    const r = compare(record({ searched_not_found: [{ id: 'processes_voice', rules: 7 }] }), decl({ processes_voice: 'performs' }), rs, opts);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]).toMatchObject({ verdict: 'INFO', id: 'processes_voice', kind: 'not-found', rulesTried: 7, evidence: [] });
    expect(r.exitCode).toBe(0);
  });

  it('not declared and searched_not_found: nothing', () => {
    const r = compare(record({ searched_not_found: [{ id: 'processes_voice', rules: 7 }] }), decl(), rs, opts);
    expect(r.rows).toEqual([]);
  });

  it('signals are copied, never a row, never an exit code', () => {
    const sig: SignalRow = { id: 'operates_social_platform', evidence: [ev('lexcode.social.x')] };
    const r = compare(record({ signals: [sig] }), decl(), rs, opts);
    expect(r.signals).toEqual([sig]);
    expect(r.rows).toEqual([]);
    expect(r.exitCode).toBe(0);
  });

  it('an evidence row for a signal or declaration-only id produces no verdict', () => {
    const r = compare(
      record({ activities: [
        { id: 'operates_social_platform', mentioned: 'performs', evidence: [ev('r')] },
        { id: 'serves_minors', mentioned: 'performs', evidence: [ev('r')] },
      ] }),
      decl(),
      rs,
      opts,
    );
    expect(r.rows).toEqual([]);
    expect(r.exitCode).toBe(0);
  });
});

describe('compare: families', () => {
  it('performs generates_images, declaration has generates_content: PASS', () => {
    const r = compare(record({ activities: [{ id: 'generates_images', mentioned: 'performs', evidence: [ev('r')] }] }), decl({ generates_content: 'performs' }), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'PASS', id: 'generates_images', kind: 'confirmed' });
  });

  it('performs generates_content, declaration has only generates_text: PASS', () => {
    const r = compare(record({ activities: [{ id: 'generates_content', mentioned: 'performs', evidence: [ev('r')] }] }), decl({ generates_text: 'performs' }), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'PASS' });
  });

  it('performs deploys_chatbot, declaration has only deploys_companion_chatbot: PASS', () => {
    const r = compare(record({ activities: [{ id: 'deploys_chatbot', mentioned: 'performs', evidence: [ev('r')] }] }), decl({ deploys_companion_chatbot: 'performs' }), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'PASS', id: 'deploys_chatbot' });
  });

  it('performs generates_text, nothing in the family declared: FAIL not-mentioned', () => {
    const r = compare(record({ activities: [{ id: 'generates_text', mentioned: 'performs', evidence: [ev('r')] }] }), decl({ crawls_web: 'performs' }), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'FAIL', kind: 'not-mentioned' });
  });

  it('performs generates_images, parent generates_content declared absent: FAIL declared-absent', () => {
    const r = compare(record({ activities: [{ id: 'generates_images', mentioned: 'performs', evidence: [ev('r')] }] }), decl({}, ['generates_content']), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'FAIL', kind: 'declared-absent' });
  });

  it('a sibling declared absent does not make the verdict declared-absent', () => {
    const r = compare(record({ activities: [{ id: 'generates_text', mentioned: 'performs', evidence: [ev('r')] }] }), decl({}, ['generates_images']), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'FAIL', kind: 'not-mentioned' });
  });

  it('a family with several evidence ids gives one row per id', () => {
    const r = compare(
      record({ activities: [
        { id: 'generates_text', mentioned: 'performs', evidence: [ev('a')] },
        { id: 'generates_images', mentioned: 'performs', evidence: [ev('b')] },
      ] }),
      decl({ generates_content: 'performs' }),
      rs,
      opts,
    );
    expect(r.rows.map((x) => x.id)).toEqual(['generates_images', 'generates_text']);
    expect(r.rows.every((x) => x.verdict === 'PASS')).toBe(true);
  });

  it('declared generates_content with evidence in the family and a not-found row: no INFO', () => {
    const r = compare(
      record({
        activities: [{ id: 'generates_images', mentioned: 'performs', evidence: [ev('r')] }],
        searched_not_found: [{ id: 'generates_content', rules: 4 }],
      }),
      decl({ generates_content: 'performs' }),
      rs,
      opts,
    );
    expect(r.rows.map((x) => x.verdict)).toEqual(['PASS']);
  });
});

describe('compare: performs against enables', () => {
  it('performs in the code, declaration says enables: WARN performs-declared-enables', () => {
    const r = compare(record({ activities: [{ id: 'tracks_devices', mentioned: 'performs', evidence: [ev('r')] }] }), decl({ tracks_devices: 'enables' }), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'WARN', kind: 'performs-declared-enables' });
    expect(r.exitCode).toBe(0);
  });

  it('performs-declared-enables stays a WARN under failOnEnables', () => {
    const r = compare(record({ activities: [{ id: 'tracks_devices', mentioned: 'performs', evidence: [ev('r')] }] }), decl({ tracks_devices: 'enables' }), rs, { failOnEnables: true });
    expect(r.rows[0]).toMatchObject({ verdict: 'WARN' });
  });

  it('a performs row and an enables row for one id produce one verdict, performs governs', () => {
    const r = compare(
      record({ activities: [
        { id: 'crawls_web', mentioned: 'enables', evidence: [ev('dep', 'package.json:4')] },
        { id: 'crawls_web', mentioned: 'performs', evidence: [ev('own', 'src/x.ts:2')] },
      ] }),
      decl(),
      rs,
      opts,
    );
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]).toMatchObject({ verdict: 'FAIL', kind: 'not-mentioned' });
    expect(r.rows[0]?.evidence.map((e) => e.rule)).toEqual(['own']);
  });
});

describe('compare: notices and ordering', () => {
  it('an id in the declaration unknown to the snapshot: one notice naming it and the pinned registry version, no row', () => {
    const r = compare(record(), decl({ brand_new_activity: 'performs' }, ['another_new_one']), rs, opts);
    expect(r.rows).toEqual([]);
    expect(r.notices).toHaveLength(2);
    expect(r.notices.some((n) => n.includes('brand_new_activity') && n.includes('1.15'))).toBe(true);
    expect(r.notices.some((n) => n.includes('another_new_one') && n.includes('1.15'))).toBe(true);
  });

  it('a known id produces no notice', () => {
    expect(compare(record(), decl({ crawls_web: 'performs' }, ['trains_models']), rs, opts).notices).toEqual([]);
  });

  it('exitCode is 0 with no FAIL and 1 with any FAIL', () => {
    const warn = record({ activities: [{ id: 'tracks_devices', mentioned: 'enables', evidence: [ev('r')] }] });
    expect(compare(warn, decl(), rs, opts).exitCode).toBe(0);
    const fail = record({ activities: [{ id: 'tracks_devices', mentioned: 'enables', evidence: [ev('r')] }, { id: 'crawls_web', mentioned: 'performs', evidence: [ev('r')] }] });
    expect(compare(fail, decl(), rs, opts).exitCode).toBe(1);
  });

  it('rows are sorted FAIL, WARN, PASS, INFO, then by id', () => {
    const r = compare(
      record({
        activities: [
          { id: 'tracks_devices', mentioned: 'enables', evidence: [ev('r')] }, // WARN
          { id: 'processes_voice', mentioned: 'performs', evidence: [ev('r')] }, // PASS
          { id: 'trains_models', mentioned: 'performs', evidence: [ev('r')] }, // FAIL
          { id: 'crawls_web', mentioned: 'performs', evidence: [ev('r')] }, // FAIL
        ],
        searched_not_found: [{ id: 'generates_video', rules: 3 }], // INFO
      }),
      decl({ processes_voice: 'performs', generates_video: 'performs' }),
      rs,
      opts,
    );
    expect(r.rows.map((x) => `${x.verdict}:${x.id}`)).toEqual([
      'FAIL:crawls_web',
      'FAIL:trains_models',
      'WARN:tracks_devices',
      'PASS:processes_voice',
      'INFO:generates_video',
    ]);
  });
});
