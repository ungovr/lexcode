import { describe, expect, it } from 'vitest';
import { renderHuman, renderJson } from '../../src/check/report.js';
import type { CheckResult, Evidence, EvidenceRecord, VerdictRow } from '../../src/types.js';
import { makeRuleSet } from '../helpers/ruleset.js';

const rs = makeRuleSet();

function record(): EvidenceRecord {
  return {
    schema: 'https://lexlint.io/lexcode/v1',
    engine: { name: 'opengrep', version: '1.33.1' },
    rules: { name: 'lexcode-rules', version: '1.0.0' },
    registry: 'https://lexlint.io/activities/v1',
    registry_version: '1.15',
    scanned_at: '2026-11-03T00:00:00Z',
    root: '.',
    scope: { include: [], exclude: [], include_tests: false, files: 42, extracted: 0, dev_dependencies_skipped: 0 },
    activities: [],
    signals: [],
    searched_not_found: [],
    components: [],
    ignored: [],
    notices: [],
  };
}

const e = (n: number): Evidence => ({ rule: `lexcode.r.n${n}`, where: `src/f${n}.ts:${n}` });
const row = (verdict: VerdictRow['verdict'], id: string, kind: VerdictRow['kind'], evidence: Evidence[] = [], rulesTried = 0): VerdictRow => ({
  verdict,
  id,
  kind,
  evidence,
  rulesTried,
});

const result: CheckResult = {
  rows: [
    row('FAIL', 'crawls_web', 'not-mentioned', [e(1), e(2), e(3), e(4), e(5)], 2),
    row('FAIL', 'trains_models', 'declared-absent', [e(6)], 2),
    row('WARN', 'tracks_devices', 'enables-undeclared', [{ rule: 'lexcode.dep.x', where: 'package.json:7', component: 'pkg:npm/x@1.0.0' }], 2),
    row('WARN', 'processes_voice', 'performs-declared-enables', [e(7)], 2),
    row('PASS', 'generates_text', 'confirmed', [e(8)], 2),
    row('INFO', 'generates_video', 'not-found', [], 3),
  ],
  signals: [{ id: 'operates_social_platform', evidence: [e(9)] }],
  notices: ['something to know'],
  exitCode: 1,
};

const ctx = { declarationFile: 'ACTIVITIES.md', record: record(), quiet: false, registry: rs.registry };

describe('renderHuman', () => {
  const out = renderHuman(result, ctx);
  const lines = out.split('\n');

  it('prints one line per row: VERDICT  id  message, with the plan messages', () => {
    expect(out).toContain('FAIL  crawls_web  the code performs crawls_web and the declaration does not carry it');
    expect(out).toContain('FAIL  trains_models  the declaration says the software does not do trains_models, and the code shows it does');
    expect(out).toContain('WARN  tracks_devices  a dependency enables tracks_devices and the declaration does not carry it; a dependency is a question, not an answer');
    expect(out).toContain("WARN  processes_voice  the declaration says processes_voice comes only through a dependency, and the project's own code does it");
    expect(out).toContain('INFO  generates_video  declared; the code showed nothing (3 rules tried)');
  });

  it('PASS lines state how many rules were tried', () => {
    expect(out).toMatch(/PASS {2}generates_text {2}.*\(2 rules tried\)/);
  });

  it('caps evidence at three lines and says and N more', () => {
    expect(out).toContain('src/f1.ts:1  lexcode.r.n1');
    expect(out).toContain('src/f3.ts:3  lexcode.r.n3');
    expect(out).not.toContain('src/f4.ts:4');
    expect(out).toContain('and 2 more');
  });

  it('shows the purl for component evidence', () => {
    expect(out).toContain('package.json:7  pkg:npm/x@1.0.0');
  });

  it('prints the registry lint_definition under FAIL and WARN only', () => {
    expect(out).toContain('Definition of crawls_web.');
    expect(out).toContain('Definition of trains_models.');
    expect(out).toContain('Definition of tracks_devices.');
    expect(out).toContain('Definition of processes_voice.');
    expect(out).not.toContain('Definition of generates_text.');
    expect(out).not.toContain('Definition of generates_video.');
  });

  it('puts the definition after the evidence of its row', () => {
    const iDef = out.indexOf('Definition of crawls_web.');
    expect(iDef).toBeGreaterThan(out.indexOf('and 2 more'));
    expect(iDef).toBeLessThan(out.indexOf('trains_models'));
  });

  it('prints signals under their heading', () => {
    expect(out).toContain('Worth a look (no effect on the result):');
    expect(out.indexOf('operates_social_platform')).toBeGreaterThan(out.indexOf('Worth a look'));
  });

  it('prints notices', () => {
    expect(out).toContain('something to know');
  });

  it('ends with the result line, exactly', () => {
    expect(lines[lines.length - 1]).toBe('');
    expect(lines[lines.length - 2]).toBe('Result: 2 FAIL, 2 WARN, 1 PASS, 1 INFO.');
  });

  it('names the declaration file', () => {
    expect(out).toContain('ACTIVITIES.md');
  });

  it('writes no ANSI escape and no em dash', () => {
    expect(out).not.toContain('\u001b');
    expect(out).not.toContain('\u2014');
  });

  it('works without a registry: no definition lines, no crash', () => {
    const o = renderHuman(result, { ...ctx, registry: undefined });
    expect(o).toContain('FAIL  crawls_web');
    expect(o).not.toContain('Definition of');
  });

  it('says 1 rule tried, not 1 rules', () => {
    const o = renderHuman({ ...result, rows: [row('INFO', 'generates_video', 'not-found', [], 1)] }, ctx);
    expect(o).toContain('(1 rule tried)');
  });

  it('prints a disagreement row', () => {
    const o = renderHuman(
      { ...result, rows: [row('WARN', 'tracks_devices, processes_voice', 'declarations-disagree')] },
      ctx,
    );
    expect(o).toContain('WARN  tracks_devices, processes_voice  the two declarations disagree on tracks_devices, processes_voice');
  });

  it('a result with no rows still has a result line', () => {
    const o = renderHuman({ rows: [], signals: [], notices: [], exitCode: 0 }, ctx);
    expect(o).toContain('Result: 0 FAIL, 0 WARN, 0 PASS, 0 INFO.');
    expect(o).not.toContain('Worth a look');
  });
});

describe('renderHuman quiet', () => {
  const out = renderHuman(result, { ...ctx, quiet: true });
  it('prints only FAIL and WARN rows and the result line', () => {
    expect(out).toContain('FAIL  crawls_web');
    expect(out).toContain('WARN  tracks_devices');
    expect(out).not.toMatch(/^PASS /m);
    expect(out).not.toMatch(/^INFO /m);
    expect(out).not.toContain('Worth a look');
    expect(out).not.toContain('something to know');
    expect(out).toContain('Result: 2 FAIL, 2 WARN, 1 PASS, 1 INFO.');
  });
});

describe('renderJson', () => {
  it('prints the CheckResult as JSON that round-trips', () => {
    const s = renderJson(result);
    expect(JSON.parse(s)).toEqual(result);
    expect(s.endsWith('\n')).toBe(true);
  });
});

describe('renderHuman header', () => {
  it('names the declaration file, the file count, the engine, the rule set and the pinned registry version', () => {
    const rec = { ...record(), scope: { ...record().scope, files: 6123 } };
    const lines = renderHuman(result, { ...ctx, record: rec }).split('\n');
    expect(lines[0]).toBe('lexcode check against ACTIVITIES.md');
    expect(lines[1]).toBe('6,123 files read; rules 1.0.0; engine opengrep 1.33.1; registry 1.15');
  });
});
