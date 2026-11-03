import { describe, expect, it } from 'vitest';
import { renderHuman, renderJson } from '../../src/check/report.js';
import type { CheckResult, EvidenceRecord, ScopeInfo, VerdictRow } from '../../src/types.js';
import { makeRuleSet } from '../helpers/ruleset.js';

const rs = makeRuleSet();
const SCOPE: ScopeInfo = { include: [], exclude: [], include_tests: false, files: 42, extracted: 0, dev_dependencies_skipped: 0 };

function record(scope: Partial<ScopeInfo> = {}): EvidenceRecord {
  return {
    schema: 'https://lexlint.io/lexcode/v1',
    engine: { name: 'opengrep', version: '1.33.1' },
    rules: { name: 'lexcode-rules', version: '1.0.0' },
    registry: 'https://lexlint.io/activities/v1',
    registry_version: '1.15',
    scanned_at: '2026-11-03T00:00:00Z',
    root: '.',
    scope: { ...SCOPE, ...scope },
    activities: [],
    signals: [],
    searched_not_found: [],
    components: [],
    ignored: [],
    notices: [],
  };
}

function result(over: Partial<CheckResult> = {}, rows: VerdictRow[] = []): CheckResult {
  return { rows, signals: [], notices: [], exitCode: 0, ignored: [], scope: SCOPE, ...over };
}

const ctx = { declarationFile: 'ACTIVITIES.md', record: record(), quiet: false, registry: rs.registry };

describe('the new row kinds', () => {
  it('sibling-declared says which siblings are declared and what is missing, with a next step', () => {
    const out = renderHuman(
      result({}, [{ verdict: 'WARN', id: 'generates_images', kind: 'sibling-declared', evidence: [], rulesTried: 2, mentioned: 'performs', siblings: ['generates_text'], parent: 'generates_content' }]),
      ctx,
    );
    expect(out).toContain(
      'WARN  generates_images  the code performs generates_images; the declaration carries generates_text but not generates_images or generates_content, so law that turns on generates_images is not read.',
    );
    expect(out).toContain('Declare generates_images or generates_content');
  });

  it('sibling-declared for enables evidence says a dependency enables it', () => {
    const out = renderHuman(
      result({}, [{ verdict: 'WARN', id: 'generates_images', kind: 'sibling-declared', evidence: [], rulesTried: 2, mentioned: 'enables', siblings: ['generates_text', 'generates_video'], parent: 'generates_content' }]),
      ctx,
    );
    expect(out).toContain('a dependency enables generates_images; the declaration carries generates_text, generates_video but not generates_images or generates_content');
  });

  it('ignored-declared-absent says what was set aside and prints the reason', () => {
    const out = renderHuman(
      result({}, [{ verdict: 'WARN', id: 'generates_images', kind: 'ignored-declared-absent', evidence: [{ rule: 'lexcode.img.x', where: 'src/' }], rulesTried: 2, note: 'a fixture' }]),
      ctx,
    );
    expect(out).toContain('WARN  generates_images  an ignore in .lexcode.yml set aside evidence that the code does generates_images, which the declaration says it does not');
    expect(out).toContain('    reason: a fixture');
  });

  it('not-looked-at is an INFO that says lexcode has no rule for the files in scope', () => {
    const out = renderHuman(result({}, [{ verdict: 'INFO', id: 'processes_voice', kind: 'not-looked-at', evidence: [], rulesTried: 0 }]), ctx);
    expect(out).toContain('INFO  processes_voice  declared; lexcode has no rule that reads the files in scope for it');
    expect(out).not.toContain('the code showed nothing');
  });
});

describe('the set-aside block', () => {
  const ignored = [
    { rule: 'lexcode.voice.whisper', where: 'src/voice/', matched: 2, activities: ['processes_voice'], reason: 'own note', by: 'sean', on: '2026-11-03' },
    { rule: 'lexcode.crawl.fetch', matched: 1, activities: ['crawls_web'], reason: 'tests only' },
    { rule: 'lexcode.gone', matched: 0, reason: 'matched nothing' },
  ];

  it('lists each ignore that removed evidence with rule, where, count, reason, by and on', () => {
    const out = renderHuman(result({ ignored }), ctx);
    expect(out).toContain('Set aside by .lexcode.yml:');
    expect(out).toContain('  lexcode.voice.whisper at src/voice/: 2 matches; reason: own note; by sean; on 2026-11-03');
    expect(out).toContain('  lexcode.crawl.fetch: 1 match; reason: tests only');
    expect(out).not.toContain('lexcode.gone');
  });

  it('is printed under --quiet too, just before the result line', () => {
    const out = renderHuman(result({ ignored }), { ...ctx, quiet: true });
    expect(out).toContain('Set aside by .lexcode.yml:');
    expect(out.indexOf('Set aside by .lexcode.yml:')).toBeLessThan(out.indexOf('Result:'));
    expect(out.split('\n').slice(-3, -1).join('|')).toBe('|Result: 0 FAIL, 0 WARN, 0 PASS, 0 INFO.');
  });

  it('is absent when no ignore removed evidence', () => {
    const out = renderHuman(result({ ignored: [ignored[2] as (typeof ignored)[number]] }), ctx);
    expect(out).not.toContain('Set aside');
  });

  it('sits after the notices and signals, before the result', () => {
    const out = renderHuman(result({ ignored, notices: ['a notice'], signals: [{ id: 'operates_social_platform', evidence: [] }] }), ctx);
    expect(out.indexOf('Set aside')).toBeGreaterThan(out.indexOf('Worth a look'));
    expect(out.indexOf('Set aside')).toBeGreaterThan(out.indexOf('a notice'));
  });
});

describe('the scope line', () => {
  const scope: ScopeInfo = { ...SCOPE, include: ['README.md'], exclude: ['vendor/', 'docs/'] };

  it('names the include and exclude lists and where they came from', () => {
    const out = renderHuman(result({ scope }), { ...ctx, record: record(scope), scopeFrom: ['lexlint.yml app.scope', '.lexcode.yml'] });
    expect(out).toContain('Scope: include README.md; exclude vendor/, docs/ (from lexlint.yml app.scope and .lexcode.yml)');
  });

  it('is printed under --quiet', () => {
    const out = renderHuman(result({ scope }), { ...ctx, record: record(scope), quiet: true, scopeFrom: ['.lexcode.yml'] });
    expect(out).toContain('Scope: include README.md; exclude vendor/, docs/ (from .lexcode.yml)');
  });

  it('says all files for an empty include list and none for an empty exclude list', () => {
    const only = { ...SCOPE, exclude: ['vendor/'] };
    expect(renderHuman(result({ scope: only }), { ...ctx, scopeFrom: ['.lexcode.yml'] })).toContain('Scope: include all files; exclude vendor/ (from .lexcode.yml)');
    const inc = { ...SCOPE, include: ['src/'] };
    expect(renderHuman(result({ scope: inc }), { ...ctx, scopeFrom: ['lexlint.yml app.scope'] })).toContain('Scope: include src/; exclude none (from lexlint.yml app.scope)');
  });

  it('is absent when both lists are empty', () => {
    expect(renderHuman(result(), ctx)).not.toContain('Scope:');
  });

  it('prints without a source when the caller gives none', () => {
    expect(renderHuman(result({ scope }), ctx)).toContain('Scope: include README.md; exclude vendor/, docs/\n');
  });
});

describe('the header', () => {
  it('says 1 file read, not 1 files read', () => {
    const out = renderHuman(result(), { ...ctx, record: record({ files: 1 }) });
    expect(out).toContain('1 file read; rules 1.0.0');
    expect(out).not.toContain('1 files read');
  });

  it('says 2 files read', () => {
    expect(renderHuman(result(), { ...ctx, record: record({ files: 2 }) })).toContain('2 files read; rules');
  });
});

describe('renderJson carries what was set aside and the scope', () => {
  it('has ignored and scope next to the existing fields', () => {
    const res = result({
      ignored: [{ rule: 'lexcode.voice.whisper', matched: 2, activities: ['processes_voice'], reason: 'own note', by: 'sean', on: '2026-11-03' }],
      scope: { ...SCOPE, include: ['README.md'] },
    });
    const parsed = JSON.parse(renderJson(res)) as CheckResult;
    expect(parsed.ignored).toEqual(res.ignored);
    expect(parsed.scope.include).toEqual(['README.md']);
    expect(Object.keys(parsed)).toEqual(expect.arrayContaining(['rows', 'signals', 'notices', 'exitCode', 'ignored', 'scope']));
  });
});
