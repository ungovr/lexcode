import { describe, expect, it } from 'vitest';
import { buildRecord } from '../../src/record/build.js';
import { toSarif } from '../../src/record/sarif.js';
import { NOW, SCOPE, match, ruleSetWith } from '../helpers/record.js';

const rs = ruleSetWith([
  { id: 'lexcode.voice.whisper', activity: 'processes_voice', message: 'transcribes audio' },
  { id: 'lexcode.crawl.loop', activity: 'crawls_web', strength: 'signal', message: 'fetches URLs from a variable' },
]);

function record(snippets: boolean) {
  return buildRecord({
    matches: [match('lexcode.voice.whisper', 'src/voice/a.py', 12, {}, 'whisper.transcribe(f)'), match('lexcode.crawl.loop', 'src/win.py', 4)],
    manifestEvidence: [
      { id: 'tracks_devices', ev: { rule: 'lexcode.manifest.npm', where: 'package.json:31', component: 'pkg:npm/%40segment/analytics-next@1.77.0' } },
    ],
    components: [],
    rs,
    rulesRun: new Map(),
    scope: SCOPE,
    engineVersion: '1.33.1',
    snippets,
    now: NOW,
    fileErrors: 0,
  });
}

type Sarif = {
  version: string;
  runs: {
    tool: { driver: { name: string; rules: { id: string; properties?: { tags?: string[] } }[] } };
    results: {
      ruleId: string;
      level: string;
      message: { text: string };
      properties: Record<string, unknown>;
      locations: { physicalLocation: { artifactLocation: { uri: string; uriBaseId: string }; region: { startLine: number; snippet?: unknown } } }[];
    }[];
  }[];
};

describe('toSarif', () => {
  const sarif = toSarif(record(false), rs, { snippets: false }) as Sarif;
  const run = sarif.runs[0]!;

  it('is SARIF 2.1.0 from a tool named lexcode', () => {
    expect(sarif.version).toBe('2.1.0');
    expect(run.tool.driver.name).toBe('lexcode');
  });

  it('keeps rule ids bare and lists each rule once', () => {
    const ids = run.tool.driver.rules.map((r) => r.id);
    expect(ids).toEqual([...new Set(ids)]);
    expect(ids).toContain('lexcode.voice.whisper');
    expect(ids).toContain('lexcode.manifest.npm');
    expect(run.results.every((r) => r.ruleId.startsWith('lexcode.'))).toBe(true);
  });

  it('puts the activity, mentioned and definition URL in every result', () => {
    expect(run.results).toHaveLength(3);
    for (const r of run.results) {
      expect(r.level).toBe('note');
      expect(typeof r.properties.activity).toBe('string');
      expect(['performs', 'enables']).toContain(r.properties.mentioned);
      expect(String(r.properties.definition)).toMatch(/^https:\/\//);
    }
    const voice = run.results.find((r) => r.ruleId === 'lexcode.voice.whisper')!;
    expect(voice.properties).toMatchObject({ activity: 'processes_voice', mentioned: 'performs', definition: 'https://lexlint.io/activities/processes_voice' });
    expect(voice.message.text).toBe('transcribes audio');
    const dep = run.results.find((r) => r.ruleId === 'lexcode.manifest.npm')!;
    expect(dep.properties).toMatchObject({ activity: 'tracks_devices', mentioned: 'enables' });
    expect(dep.message.text).toContain('pkg:npm/%40segment/analytics-next@1.77.0');
  });

  it('writes POSIX paths against %SRCROOT% and the evidence line', () => {
    const voice = run.results.find((r) => r.ruleId === 'lexcode.voice.whisper')!;
    const loc = voice.locations[0]!.physicalLocation;
    expect(loc.artifactLocation).toEqual({ uri: 'src/voice/a.py', uriBaseId: '%SRCROOT%' });
    expect(loc.region.startLine).toBe(12);
  });

  it('marks signal results and leaves the others unmarked', () => {
    const signal = run.results.find((r) => r.ruleId === 'lexcode.crawl.loop')!;
    expect(signal.properties.signal).toBe(true);
    expect(run.results.filter((r) => r.properties.signal === true)).toHaveLength(1);
  });

  it('omits snippets unless asked', () => {
    expect(JSON.stringify(sarif)).not.toContain('snippet');
    const on = toSarif(record(true), rs, { snippets: true }) as Sarif;
    const voice = on.runs[0]!.results.find((r) => r.ruleId === 'lexcode.voice.whisper')!;
    expect(JSON.stringify(voice.locations)).toContain('whisper.transcribe(f)');
  });

  it('carries no security tag on any rule', () => {
    expect(JSON.stringify(sarif)).not.toMatch(/security/i);
  });
});
