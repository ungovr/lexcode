import { describe, expect, it } from 'vitest';
import { compare } from '../../src/check/compare.js';
import type { Declaration, Evidence, EvidenceRecord, Mentioned, Sidecar } from '../../src/types.js';
import { makeRuleSet } from '../helpers/ruleset.js';

// The pre-release review's verdict findings: M4 (a declared sibling overrode an explicit not:),
// S10 (a sibling alone covered the evidence), S4 (declared and never looked at), M5 (what the
// repository's own files set aside), and the two declaration notices.

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

describe('M4: an explicit not: beats what the family declares', () => {
  const images = record({ activities: [{ id: 'generates_images', mentioned: 'performs', evidence: [ev('lexcode.img.x')] }] });

  it('declares generates_text, lists not: generates_images, the code generates images: FAIL declared-absent, exit 1', () => {
    const r = compare(images, decl({ generates_text: 'performs' }, ['generates_images']), rs, opts);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]).toMatchObject({ verdict: 'FAIL', id: 'generates_images', kind: 'declared-absent' });
    expect(r.exitCode).toBe(1);
  });

  it('declares the parent and lists the child under not: still FAIL declared-absent', () => {
    const r = compare(images, decl({ generates_content: 'performs' }, ['generates_images']), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'FAIL', kind: 'declared-absent' });
  });

  it('declares the id itself and lists its parent under not: the exact declaration governs, PASS', () => {
    const r = compare(images, decl({ generates_images: 'performs' }, ['generates_content']), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'PASS', kind: 'confirmed' });
  });

  it('the same id declared in one component and listed under not: in another: the union governs, PASS', () => {
    // Design 6.6 compares a several-component ACTIVITIES.md as the union of its
    // components: one component doing what another rules out is not drift.
    const r = compare(images, decl({ generates_images: 'performs' }, ['generates_images']), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'PASS', kind: 'confirmed' });
    expect(r.exitCode).toBe(0);
  });

  it('declares only the parent and lists the id under not: still FAIL declared-absent', () => {
    const r = compare(images, decl({ generates_content: 'declared' }, ['generates_images']), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'FAIL', kind: 'declared-absent' });
  });

  it('enables evidence for an id listed under not: enables-declared-absent even when a sibling is declared', () => {
    const rec = record({ activities: [{ id: 'generates_images', mentioned: 'enables', evidence: [ev('dep')] }] });
    const d = decl({ generates_text: 'performs' }, ['generates_images']);
    expect(compare(rec, d, rs, opts).rows[0]).toMatchObject({ verdict: 'WARN', kind: 'enables-declared-absent' });
    expect(compare(rec, d, rs, { failOnEnables: true }).rows[0]).toMatchObject({ verdict: 'FAIL', kind: 'enables-declared-absent' });
  });
});

describe('S10: a sibling alone does not cover the evidence', () => {
  const images = record({ activities: [{ id: 'generates_images', mentioned: 'performs', evidence: [ev('lexcode.img.x')] }] });

  it('performs generates_images, only the sibling generates_text declared: WARN sibling-declared, exit 0', () => {
    const r = compare(images, decl({ generates_text: 'performs' }), rs, opts);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]).toMatchObject({ verdict: 'WARN', id: 'generates_images', kind: 'sibling-declared', parent: 'generates_content', siblings: ['generates_text'] });
    expect(r.exitCode).toBe(0);
  });

  it('stays a WARN under failOnEnables', () => {
    const r = compare(images, decl({ generates_text: 'performs' }), rs, { failOnEnables: true });
    expect(r.rows[0]).toMatchObject({ verdict: 'WARN', kind: 'sibling-declared' });
    expect(r.exitCode).toBe(0);
  });

  it('names every declared sibling, sorted', () => {
    const r = compare(images, decl({ generates_video: 'performs', generates_text: 'performs' }), rs, opts);
    expect(r.rows[0]?.siblings).toEqual(['generates_text', 'generates_video']);
  });

  it('parent declared next to a sibling: PASS', () => {
    const r = compare(images, decl({ generates_content: 'performs', generates_text: 'performs' }), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'PASS', kind: 'confirmed' });
  });

  it('the id itself declared next to a sibling: PASS', () => {
    const r = compare(images, decl({ generates_images: 'performs', generates_text: 'performs' }), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'PASS', kind: 'confirmed' });
  });

  it('a child declared, evidence for the parent: PASS', () => {
    const rec = record({ activities: [{ id: 'generates_content', mentioned: 'performs', evidence: [ev('r')] }] });
    expect(compare(rec, decl({ generates_images: 'performs' }), rs, opts).rows[0]).toMatchObject({ verdict: 'PASS', kind: 'confirmed' });
  });

  it('chatbot family: evidence deploys_chatbot with only deploys_companion_chatbot declared: PASS', () => {
    const rec = record({ activities: [{ id: 'deploys_chatbot', mentioned: 'performs', evidence: [ev('r')] }] });
    expect(compare(rec, decl({ deploys_companion_chatbot: 'performs' }), rs, opts).rows[0]).toMatchObject({ verdict: 'PASS', kind: 'confirmed' });
  });

  it('enables evidence with only a sibling declared: WARN sibling-declared, not a FAIL under failOnEnables', () => {
    const rec = record({ activities: [{ id: 'generates_images', mentioned: 'enables', evidence: [ev('dep')] }] });
    const r = compare(rec, decl({ generates_text: 'enables' }), rs, { failOnEnables: true });
    expect(r.rows[0]).toMatchObject({ verdict: 'WARN', kind: 'sibling-declared', mentioned: 'enables' });
    expect(r.exitCode).toBe(0);
  });

  it('a performs row declared as enables on the id itself is still performs-declared-enables', () => {
    const r = compare(images, decl({ generates_images: 'enables', generates_text: 'performs' }), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'WARN', kind: 'performs-declared-enables' });
  });

  it('nothing in the family declared is still a FAIL not-mentioned', () => {
    const r = compare(images, decl({ crawls_web: 'performs' }), rs, opts);
    expect(r.rows[0]).toMatchObject({ verdict: 'FAIL', kind: 'not-mentioned' });
  });
});

describe('S4: declared and never looked at', () => {
  it('a declared evidence id with no rule run: INFO not-looked-at, not not-found', () => {
    const r = compare(record(), decl({ processes_voice: 'performs' }), rs, opts);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]).toMatchObject({ verdict: 'INFO', id: 'processes_voice', kind: 'not-looked-at', rulesTried: 0, evidence: [] });
    expect(r.exitCode).toBe(0);
  });

  it('a declared id whose rules ran and found nothing stays not-found', () => {
    const r = compare(record({ searched_not_found: [{ id: 'processes_voice', rules: 2 }] }), decl({ processes_voice: 'performs' }), rs, opts);
    expect(r.rows.map((x) => x.kind)).toEqual(['not-found']);
  });

  it('a declared parent whose children were searched is not called not-looked-at', () => {
    const r = compare(record({ searched_not_found: [{ id: 'generates_text', rules: 2 }] }), decl({ generates_content: 'performs' }), rs, opts);
    expect(r.rows.map((x) => x.kind)).not.toContain('not-looked-at');
  });

  it('a declared id with evidence in its family has no INFO row', () => {
    const rec = record({ activities: [{ id: 'generates_images', mentioned: 'performs', evidence: [ev('r')] }] });
    expect(compare(rec, decl({ generates_content: 'performs' }), rs, opts).rows.map((x) => x.kind)).toEqual(['confirmed']);
  });

  it('a declared signal or declaration-only id has no row', () => {
    expect(compare(record(), decl({ operates_social_platform: 'performs', serves_minors: 'performs' }), rs, opts).rows).toEqual([]);
  });
});

describe('M5: what the repository set aside', () => {
  const sidecar: Sidecar = {
    ignore: [{ rule: 'lexcode.img.x', where: 'src/', reason: 'a fixture', by: 'sean', on: '2026-11-03' }],
    fail_on_enables: false,
    own_hosts: [],
    include: [],
    exclude: [],
  };
  const ignoredRecord = record({ ignored: [{ rule: 'lexcode.img.x', where: 'src/', matched: 2, activities: ['generates_images'] }] });

  it('an ignore that removed evidence for a not: id is a WARN ignored-declared-absent carrying its reason', () => {
    const r = compare(ignoredRecord, decl({ generates_text: 'performs' }, ['generates_images']), rs, { ...opts, sidecar });
    const rows = r.rows.filter((x) => x.kind === 'ignored-declared-absent');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ verdict: 'WARN', id: 'generates_images', note: 'a fixture' });
    expect(r.exitCode).toBe(0);
  });

  it('an ignore for an id under a not: parent counts too', () => {
    const r = compare(ignoredRecord, decl({}, ['generates_content']), rs, { ...opts, sidecar });
    expect(r.rows.map((x) => x.kind)).toEqual(['ignored-declared-absent']);
    expect(r.rows[0]?.id).toBe('generates_images');
  });

  it('an ignore that removed evidence for an id not under not: gives no such row', () => {
    const r = compare(ignoredRecord, decl({ generates_images: 'performs' }), rs, { ...opts, sidecar });
    expect(r.rows.map((x) => x.kind)).not.toContain('ignored-declared-absent');
  });

  it('an ignore that matched nothing gives no such row', () => {
    const r = compare(record({ ignored: [{ rule: 'lexcode.img.x', matched: 0 }] }), decl({}, ['generates_images']), rs, { ...opts, sidecar });
    expect(r.rows.map((x) => x.kind)).not.toContain('ignored-declared-absent');
  });

  it('the result carries the record ignores joined with the sidecar reason, by and on, and the record scope', () => {
    const r = compare(ignoredRecord, decl(), rs, { ...opts, sidecar });
    expect(r.ignored).toEqual([
      { rule: 'lexcode.img.x', where: 'src/', matched: 2, activities: ['generates_images'], reason: 'a fixture', by: 'sean', on: '2026-11-03' },
    ]);
    expect(r.scope).toEqual(ignoredRecord.scope);
  });

  it('without a sidecar the ignores are still listed, without a reason', () => {
    expect(compare(ignoredRecord, decl(), rs, opts).ignored).toEqual([
      { rule: 'lexcode.img.x', where: 'src/', matched: 2, activities: ['generates_images'] },
    ]);
  });
});

describe('notices about the declaration', () => {
  it('an unknown id: one notice for the run, naming every unknown id and the pinned registry version', () => {
    const r = compare(record(), decl({ brand_new_activity: 'performs', crawls_web: 'performs' }, ['another_new_one']), rs, opts);
    const n = r.notices.filter((x) => x.includes('registry 1.15'));
    expect(r.notices).toHaveLength(1);
    expect(n[0]).toContain('brand_new_activity');
    expect(n[0]).toContain('another_new_one');
    expect(n[0]).toMatch(/may be newer/);
  });

  it('a retired id: one notice naming what replaced it', () => {
    const rs2 = makeRuleSet();
    rs2.registry.set('records_conversations', {
      id: 'records_conversations', scope: 'code', parent: null, status: 'retired', term: 'x', lint_definition: '', page: '',
      supersededBy: ['records_calls', 'records_text_chat'],
    });
    const r = compare(record(), decl({ records_conversations: 'performs' }), rs2, opts);
    expect(r.notices).toHaveLength(1);
    expect(r.notices[0]).toContain('records_conversations');
    expect(r.notices[0]).toContain('retired');
    expect(r.notices[0]).toContain('records_calls, records_text_chat');
  });

  it('several retired ids still give one notice', () => {
    const rs2 = makeRuleSet();
    for (const id of ['old_a', 'old_b']) {
      rs2.registry.set(id, { id, scope: 'code', parent: null, status: 'retired', term: 'x', lint_definition: '', page: '', supersededBy: ['crawls_web'] });
    }
    expect(compare(record(), decl({ old_a: 'performs', old_b: 'performs' }), rs2, opts).notices).toHaveLength(1);
  });

  it('a retired id listed under not: gets the notice too', () => {
    const rs2 = makeRuleSet();
    rs2.registry.set('old_a', { id: 'old_a', scope: 'code', parent: null, status: 'retired', term: 'x', lint_definition: '', page: '', supersededBy: ['crawls_web'] });
    expect(compare(record(), decl({}, ['old_a']), rs2, opts).notices).toHaveLength(1);
  });

  it('a retired id with nothing superseding it says only that it is retired', () => {
    const rs2 = makeRuleSet();
    rs2.registry.set('old_a', { id: 'old_a', scope: 'code', parent: null, status: 'retired', term: 'x', lint_definition: '', page: '' });
    const n = compare(record(), decl({ old_a: 'performs' }), rs2, opts).notices;
    expect(n).toHaveLength(1);
    expect(n[0]).toContain('retired');
  });
});
