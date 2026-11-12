import { describe, expect, it } from 'vitest';
import { matchComponents, globMatch } from '../../src/components/match.js';
import type { ComponentEntry, Dependency } from '../../src/types.js';

const entry = (e: Pick<ComponentEntry, 'ecosystem' | 'match' | 'enables'>): ComponentEntry => ({
  says: 'test',
  source: 'https://example.com',
  ...e,
});

describe('globMatch', () => {
  it('supports *, ** and ?', () => {
    expect(globMatch('**/google-services.json', 'android/app/google-services.json')).toBe(true);
    expect(globMatch('**/google-services.json', 'google-services.json')).toBe(true);
    expect(globMatch('*.json', 'a/b.json')).toBe(false);
    expect(globMatch('*.json', 'b.json')).toBe(true);
    expect(globMatch('ios/*/GoogleService-Info.plist', 'ios/App/GoogleService-Info.plist')).toBe(true);
    expect(globMatch('a?c', 'abc')).toBe(true);
    expect(globMatch('a?c', 'a/c')).toBe(false);
    expect(globMatch('src/**', 'src/a/b.ts')).toBe(true);
  });
  it('treats regex metacharacters in a pattern literally', () => {
    expect(globMatch('a.b', 'axb')).toBe(false);
    expect(globMatch('(x)+', '(x)+')).toBe(true);
  });
});

describe('matchComponents', () => {
  const segment: Dependency = {
    ecosystem: 'npm',
    name: '@segment/analytics-next',
    version: '1.77.0',
    manifest: 'package.json:31',
  };
  const segmentPurl = 'pkg:npm/%40segment/analytics-next@1.77.0';

  it('yields one row and one evidence item per activity for an exact match', () => {
    const r = matchComponents(
      [segment],
      [],
      [entry({ ecosystem: 'npm', match: '@segment/analytics-next', enables: ['tracks_devices', 'processes_personal_data'] })],
    );
    expect(r.components).toEqual([
      { purl: segmentPurl, manifest: 'package.json:31', enables: ['processes_personal_data', 'tracks_devices'] },
    ]);
    expect(r.evidence).toEqual([
      { id: 'processes_personal_data', ev: { rule: 'lexcode.manifest.npm', where: 'package.json:31', component: segmentPurl } },
      { id: 'tracks_devices', ev: { rule: 'lexcode.manifest.npm', where: 'package.json:31', component: segmentPurl } },
    ]);
  });

  it('matches a scope glob', () => {
    const other: Dependency = {
      ecosystem: 'npm',
      name: '@segment/analytics-node',
      version: '2.0.0',
      manifest: 'package.json:32',
    };
    const r = matchComponents([other], [], [entry({ ecosystem: 'npm', match: '@segment/*', enables: ['tracks_devices'] })]);
    expect(r.components).toHaveLength(1);
    expect(r.components[0]?.purl).toBe('pkg:npm/%40segment/analytics-node@2.0.0');
  });

  it('does not let a scope glob match another scope or the bare scope', () => {
    const deps: Dependency[] = [
      { ecosystem: 'npm', name: '@segmentx/foo', manifest: 'package.json:1' },
      { ecosystem: 'npm', name: 'segment', manifest: 'package.json:2' },
    ];
    const r = matchComponents(deps, [], [entry({ ecosystem: 'npm', match: '@segment/*', enables: ['a'] })]);
    expect(r.components).toEqual([]);
  });

  it('matches a Go module path prefix glob', () => {
    const d: Dependency = {
      ecosystem: 'golang',
      name: 'github.com/org/sub/pkg',
      version: 'v1.0.0',
      manifest: 'go.mod:6',
    };
    const r = matchComponents([d], [], [entry({ ecosystem: 'golang', match: 'github.com/org/*', enables: ['crawls_web'] })]);
    expect(r.components[0]?.purl).toBe('pkg:golang/github.com/org/sub/pkg@v1.0.0');
    expect(r.evidence[0]?.ev.rule).toBe('lexcode.manifest.go');
  });

  it('matches a gem by name, and its evidence rule reads lexcode.manifest.gem', () => {
    const d: Dependency = { ecosystem: 'gem', name: 'aws-sdk-s3', version: '1.140.0', manifest: 'Gemfile:6' };
    const r = matchComponents([d], [], [entry({ ecosystem: 'gem', match: 'aws-sdk-s3', enables: ['stores_data'] })]);
    expect(r.components[0]?.purl).toBe('pkg:gem/aws-sdk-s3@1.140.0');
    expect(r.evidence[0]?.ev.rule).toBe('lexcode.manifest.gem');
    expect(matchComponents([d], [], [entry({ ecosystem: 'npm', match: 'aws-sdk-s3', enables: ['x'] })]).components).toEqual([]);
  });

  it('matches a Maven coordinate case-insensitively, and its evidence rule reads lexcode.manifest.maven', () => {
    const d: Dependency = { ecosystem: 'maven', name: 'com.twilio.sdk:twilio', version: '10.1.0', manifest: 'pom.xml:12' };
    const r = matchComponents([d], [], [entry({ ecosystem: 'maven', match: 'Com.Twilio.SDK:Twilio', enables: ['automated_outreach'] })]);
    expect(r.components[0]?.purl).toBe('pkg:maven/com.twilio.sdk/twilio@10.1.0');
    expect(r.evidence[0]?.ev.rule).toBe('lexcode.manifest.maven');
    expect(matchComponents([d], [], [entry({ ecosystem: 'gem', match: 'com.twilio.sdk:twilio', enables: ['x'] })]).components).toEqual([]);
  });

  it('matches PyPI names after PEP 503 normalization on both sides', () => {
    const d: Dependency = {
      ecosystem: 'pypi',
      name: 'google-cloud-speech',
      version: '2.0.0',
      manifest: 'requirements.txt:1',
    };
    const r = matchComponents([d], [], [entry({ ecosystem: 'pypi', match: 'Google_Cloud.Speech', enables: ['processes_voice'] })]);
    expect(r.components).toHaveLength(1);
    expect(r.evidence[0]?.ev.rule).toBe('lexcode.manifest.pypi');
  });

  it('merges the activities of every matching entry, sorted and unique', () => {
    const r = matchComponents(
      [segment],
      [],
      [
        entry({ ecosystem: 'npm', match: '@segment/*', enables: ['tracks_devices', 'b_activity'] }),
        entry({ ecosystem: 'npm', match: '@segment/analytics-next', enables: ['tracks_devices', 'a_activity'] }),
      ],
    );
    expect(r.components).toHaveLength(1);
    expect(r.components[0]?.enables).toEqual(['a_activity', 'b_activity', 'tracks_devices']);
    expect(r.evidence.map((e) => e.id)).toEqual(['a_activity', 'b_activity', 'tracks_devices']);
  });

  it('marks a dependency without a version unresolved', () => {
    const d: Dependency = { ecosystem: 'npm', name: 'posthog-js', manifest: 'package.json:9' };
    const r = matchComponents([d], [], [entry({ ecosystem: 'npm', match: 'posthog-js', enables: ['tracks_devices'] })]);
    expect(r.components).toEqual([
      { purl: 'pkg:npm/posthog-js', manifest: 'package.json:9', enables: ['tracks_devices'], unresolved: true },
    ]);
  });

  it('does not match an entry of another ecosystem', () => {
    const r = matchComponents([segment], [], [entry({ ecosystem: 'pypi', match: '@segment/analytics-next', enables: ['x'] })]);
    expect(r.components).toEqual([]);
    expect(r.evidence).toEqual([]);
  });

  it('yields nothing for a dependency with no entry', () => {
    const r = matchComponents([segment], ['src/a.ts'], [entry({ ecosystem: 'npm', match: 'other', enables: ['x'] })]);
    expect(r).toEqual({ components: [], evidence: [] });
  });

  it('matches a file by path glob with evidence at line 1 and no component row', () => {
    const r = matchComponents(
      [],
      ['android/app/google-services.json', 'src/index.ts'],
      [entry({ ecosystem: 'files', match: '**/google-services.json', enables: ['tracks_devices'] })],
    );
    expect(r.components).toEqual([]);
    expect(r.evidence).toEqual([
      { id: 'tracks_devices', ev: { rule: 'lexcode.manifest.files', where: 'android/app/google-services.json:1' } },
    ]);
  });

  it('gives one component row per dependency even when a package appears in two manifests', () => {
    const a: Dependency = { ecosystem: 'npm', name: 'posthog-js', version: '1.0.0', manifest: 'package.json:3' };
    const b: Dependency = { ecosystem: 'npm', name: 'posthog-js', version: '1.0.0', manifest: 'apps/web/package.json:3' };
    const r = matchComponents([a, b], [], [entry({ ecosystem: 'npm', match: 'posthog-js', enables: ['tracks_devices'] })]);
    expect(r.components.map((c) => c.manifest)).toEqual(['package.json:3', 'apps/web/package.json:3']);
    expect(r.evidence).toHaveLength(2);
  });
});
