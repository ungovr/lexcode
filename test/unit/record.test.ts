import { describe, expect, it } from 'vitest';
import { buildRecord, countRulesRun, engineTargets, READ_LANGUAGES, unreadLanguages } from '../../src/record/build.js';
import { loadRuleSet } from '../../src/rules/load.js';
import type { Sidecar } from '../../src/types.js';
import { NOW, SCOPE, match, ruleSetWith } from '../helpers/record.js';

const base = {
  matches: [],
  manifestEvidence: [],
  components: [],
  rulesRun: new Map<string, number>(),
  scope: SCOPE,
  engineVersion: '1.33.1',
  snippets: false,
  now: NOW,
  fileErrors: 0,
};

const voice = { id: 'lexcode.voice.whisper', activity: 'processes_voice' };

describe('buildRecord', () => {
  it('fills the header from the rule set and the clock', () => {
    const r = buildRecord({ ...base, rs: ruleSetWith() });
    expect(r.schema).toBe('https://lexlint.io/lexcode/v1');
    expect(r.engine).toEqual({ name: 'opengrep', version: '1.33.1' });
    expect(r.rules).toEqual({ name: 'lexcode-rules', version: '1.0.0' });
    expect(r.registry).toBe('https://lexlint.io/activities/v1');
    expect(r.registry_version).toBe('1.15');
    expect(r.scanned_at).toBe('2026-11-03T12:34:56Z');
    expect(r.root).toBe('.');
    expect(r.scope).toEqual(SCOPE);
  });

  it('gives a performs row and an enables row, ids sorted, and keeps both rows for one id', () => {
    const rs = ruleSetWith([voice]);
    const r = buildRecord({
      ...base,
      rs,
      matches: [match('lexcode.voice.whisper', 'src/b.py', 9), match('lexcode.voice.whisper', 'src/a.py', 3)],
      manifestEvidence: [
        { id: 'tracks_devices', ev: { rule: 'lexcode.manifest.npm', where: 'package.json:31', component: 'pkg:npm/%40segment/analytics-next@1.77.0' } },
        { id: 'processes_voice', ev: { rule: 'lexcode.manifest.pypi', where: 'requirements.txt:3', component: 'pkg:pypi/openai@1.51.0' } },
      ],
    });
    expect(r.activities.map((a) => `${a.id}:${a.mentioned}`)).toEqual([
      'processes_voice:performs',
      'processes_voice:enables',
      'tracks_devices:enables',
    ]);
    expect(r.activities[0]?.evidence).toEqual([
      { rule: 'lexcode.voice.whisper', where: 'src/a.py:3' },
      { rule: 'lexcode.voice.whisper', where: 'src/b.py:9' },
    ]);
    expect(r.activities[2]?.evidence[0]).toEqual({
      rule: 'lexcode.manifest.npm',
      where: 'package.json:31',
      component: 'pkg:npm/%40segment/analytics-next@1.77.0',
    });
  });

  it('sorts evidence by path and numeric line, and drops an exact repeat', () => {
    const rs = ruleSetWith([voice]);
    const r = buildRecord({
      ...base,
      rs,
      matches: [
        match('lexcode.voice.whisper', 'a.py', 10),
        match('lexcode.voice.whisper', 'a.py', 9),
        match('lexcode.voice.whisper', 'a.py', 9),
      ],
    });
    expect(r.activities[0]?.evidence.map((e) => e.where)).toEqual(['a.py:9', 'a.py:10']);
  });

  it('puts a strength: signal rule in signals, never in activities', () => {
    const rs = ruleSetWith([{ id: 'lexcode.crawl.loop', activity: 'crawls_web', strength: 'signal' }]);
    const r = buildRecord({ ...base, rs, matches: [match('lexcode.crawl.loop', 'a.py', 4)] });
    expect(r.activities).toEqual([]);
    expect(r.signals).toEqual([{ id: 'crawls_web', evidence: [{ rule: 'lexcode.crawl.loop', where: 'a.py:4' }] }]);
  });

  it('lists a signal-class activity in signals even when its rule says evidence', () => {
    const rs = ruleSetWith([{ id: 'lexcode.social.feed', activity: 'operates_social_platform' }]);
    const r = buildRecord({ ...base, rs, matches: [match('lexcode.social.feed', 'a.py', 1)] });
    expect(r.activities).toEqual([]);
    expect(r.signals.map((s) => s.id)).toEqual(['operates_social_platform']);
  });

  it('never lists a declaration-only id anywhere', () => {
    const rs = ruleSetWith([{ id: 'lexcode.kids.age', activity: 'serves_minors' }]);
    const r = buildRecord({
      ...base,
      rs,
      matches: [match('lexcode.kids.age', 'a.py', 1)],
      manifestEvidence: [{ id: 'handles_health_records', ev: { rule: 'lexcode.manifest.npm', where: 'package.json:2' } }],
      rulesRun: new Map([
        ['serves_minors', 2],
        ['handles_health_records', 1],
      ]),
    });
    expect(JSON.stringify([r.activities, r.signals, r.searched_not_found])).not.toMatch(/serves_minors|handles_health_records/);
  });

  it('lists an evidence id with rules run and no match in searched_not_found, with the count it was given', () => {
    const rs = ruleSetWith([voice]);
    const r = buildRecord({
      ...base,
      rs,
      matches: [match('lexcode.voice.whisper', 'a.py', 1)],
      rulesRun: new Map([
        ['processes_voice', 1],
        ['trains_models', 7],
        ['tracks_devices', 0],
      ]),
    });
    expect(r.searched_not_found).toEqual([{ id: 'trains_models', rules: 7 }]);
  });

  it('does not list an id whose only evidence is enables', () => {
    const rs = ruleSetWith();
    const r = buildRecord({
      ...base,
      rs,
      manifestEvidence: [{ id: 'tracks_devices', ev: { rule: 'lexcode.manifest.npm', where: 'package.json:3' } }],
      rulesRun: new Map([['tracks_devices', 2]]),
    });
    expect(r.searched_not_found).toEqual([]);
  });

  it('leaves out snippets unless asked, then keeps the first matched line trimmed to 200 characters', () => {
    const rs = ruleSetWith([voice]);
    const long = `   ${'x'.repeat(300)}\nsecond line`;
    const m = [match('lexcode.voice.whisper', 'a.py', 1, {}, long)];
    const off = buildRecord({ ...base, rs, matches: m });
    expect(JSON.stringify(off)).not.toContain('snippet');
    const on = buildRecord({ ...base, rs, matches: m, snippets: true });
    expect(on.activities[0]?.evidence[0]?.snippet).toBe('x'.repeat(200));
    const short = buildRecord({
      ...base,
      rs,
      snippets: true,
      matches: [match('lexcode.voice.whisper', 'a.py', 1, {}, '  whisper.transcribe(f)  \nmore')],
    });
    expect(short.activities[0]?.evidence[0]?.snippet).toBe('whisper.transcribe(f)');
  });

  describe('host_metavar', () => {
    const rs = ruleSetWith([{ id: 'lexcode.crawl.fetch', activity: 'crawls_web', hostMetavar: '$URL' }]);
    const run = (url: string | undefined, own: string[] = []) =>
      buildRecord({
        ...base,
        rs,
        sidecar: { ignore: [], fail_on_enables: false, own_hosts: own, include: [], exclude: [] },
        matches: [match('lexcode.crawl.fetch', 'c.py', 8, url === undefined ? {} : { $URL: url })],
      });

    it('drops a match on an own host and on loopback', () => {
      expect(run(`'https://api.example.org/v1'`, ['example.org']).activities).toEqual([]);
      for (const u of [`'http://localhost:3000'`, `'http://127.0.0.1/x'`, `'file:///tmp/a'`, `'/relative/path'`]) {
        const r = run(u);
        expect(r.activities, u).toEqual([]);
        expect(r.signals, u).toEqual([]);
      }
    });

    it('says how many matches the host rule dropped', () => {
      expect(run(`'http://localhost:3000'`).notices.join('\n')).toMatch(/1 match was dropped.*own_hosts/);
    });

    it('moves a non-literal URL to signals', () => {
      const r = run('url');
      expect(r.activities).toEqual([]);
      expect(r.signals).toEqual([{ id: 'crawls_web', evidence: [{ rule: 'lexcode.crawl.fetch', where: 'c.py:8' }] }]);
      expect(run(undefined).signals).toHaveLength(1);
    });

    it('keeps a literal third-party host as evidence with the host set', () => {
      const r = run(`'https://www.gov.example/page'`, ['example.org']);
      expect(r.activities).toEqual([
        { id: 'crawls_web', mentioned: 'performs', evidence: [{ rule: 'lexcode.crawl.fetch', where: 'c.py:8', host: 'www.gov.example' }] },
      ]);
      expect(r.signals).toEqual([]);
    });

    it('does not promote a signal-strength rule on a literal host', () => {
      const sig = ruleSetWith([{ id: 'lexcode.crawl.loop', activity: 'crawls_web', strength: 'signal', hostMetavar: '$URL' }]);
      const r = buildRecord({ ...base, rs: sig, matches: [match('lexcode.crawl.loop', 'c.py', 2, { $URL: `'https://www.gov.example/'` })] });
      expect(r.activities).toEqual([]);
      expect(r.signals[0]?.evidence[0]?.host).toBe('www.gov.example');
    });
  });

  describe('sidecar ignores', () => {
    const rs = ruleSetWith([voice]);
    const sc = (ignore: Sidecar['ignore']): Sidecar => ({ ignore, fail_on_enables: false, own_hosts: [], include: [], exclude: [] });
    const matches = [
      match('lexcode.voice.whisper', 'src/voice/a.py', 1),
      match('lexcode.voice.whisper', 'src/voice/b.py', 2),
      match('lexcode.voice.whisper', 'src/other/c.py', 3),
    ];

    it('removes the evidence under a directory and records how many it removed', () => {
      const r = buildRecord({ ...base, rs, matches, sidecar: sc([{ rule: 'lexcode.voice.whisper', where: 'src/voice/', reason: 'own note' }]) });
      expect(r.activities[0]?.evidence.map((e) => e.where)).toEqual(['src/other/c.py:3']);
      expect(r.ignored).toEqual([{ rule: 'lexcode.voice.whisper', where: 'src/voice/', matched: 2, activities: ['processes_voice'] }]);
    });

    it('matches a single file by its path, and a rule with no where everywhere', () => {
      const one = buildRecord({ ...base, rs, matches, sidecar: sc([{ rule: 'lexcode.voice.whisper', where: 'src/voice/a.py', reason: 'r' }]) });
      expect(one.ignored[0]?.matched).toBe(1);
      const all = buildRecord({ ...base, rs, matches, sidecar: sc([{ rule: 'lexcode.voice.whisper', reason: 'r' }]) });
      expect(all.activities).toEqual([]);
      expect(all.ignored).toEqual([{ rule: 'lexcode.voice.whisper', matched: 3, activities: ['processes_voice'] }]);
    });

    it('does not treat a longer directory name as the directory', () => {
      const r = buildRecord({ ...base, rs, matches, sidecar: sc([{ rule: 'lexcode.voice.whisper', where: 'src/voi', reason: 'r' }]) });
      expect(r.ignored[0]?.matched).toBe(0);
    });

    it('records an ignore that matched nothing, with a notice that says what to do', () => {
      const r = buildRecord({ ...base, rs, matches, sidecar: sc([{ rule: 'lexcode.voice.gone', where: 'src/', reason: 'r' }]) });
      expect(r.ignored).toEqual([{ rule: 'lexcode.voice.gone', where: 'src/', matched: 0 }]);
      expect(r.notices.join('\n')).toMatch(/lexcode\.voice\.gone.*matched nothing.*\.lexcode\.yml/);
      expect(r.activities[0]?.evidence).toHaveLength(3);
    });

    it('honors an ignore written against a replaced rule id', () => {
      const renamed = ruleSetWith([{ ...voice, id: 'lexcode.voice.whisper-v2', replaces: ['lexcode.voice.old-name'] }]);
      const r = buildRecord({
        ...base,
        rs: renamed,
        matches: [match('lexcode.voice.whisper-v2', 'src/voice/a.py', 1)],
        sidecar: sc([{ rule: 'lexcode.voice.old-name', reason: 'r' }]),
      });
      expect(r.activities).toEqual([]);
      expect(r.ignored[0]?.matched).toBe(1);
    });
  });

  it('notes files the engine could not read', () => {
    const r = buildRecord({ ...base, rs: ruleSetWith(), fileErrors: 3 });
    expect(r.notices).toContain('the engine could not read 3 files; their evidence is missing from this record');
    expect(buildRecord({ ...base, rs: ruleSetWith(), fileErrors: 1 }).notices).toContain(
      'the engine could not read 1 file; its evidence is missing from this record',
    );
    expect(buildRecord({ ...base, rs: ruleSetWith() }).notices).toEqual([]);
  });

  it('carries extra notices from the scan before its own', () => {
    const r = buildRecord({ ...base, rs: ruleSetWith(), notices: ['skipped 2 symbolic links'], fileErrors: 3 });
    expect(r.notices[0]).toBe('skipped 2 symbolic links');
    expect(r.notices).toHaveLength(2);
  });

  it('sorts components and drops declaration-only ids from them', () => {
    const rs = ruleSetWith();
    const r = buildRecord({
      ...base,
      rs,
      components: [
        { purl: 'pkg:npm/b@1', manifest: 'package.json:3', enables: ['tracks_devices', 'serves_minors'] },
        { purl: 'pkg:npm/a@1', manifest: 'package.json:2', enables: ['serves_minors'] },
        { purl: 'pkg:npm/c@1', manifest: 'package.json:4', enables: ['processes_voice'], unresolved: true },
      ],
    });
    expect(r.components).toEqual([
      { purl: 'pkg:npm/b@1', manifest: 'package.json:3', enables: ['tracks_devices'] },
      { purl: 'pkg:npm/c@1', manifest: 'package.json:4', enables: ['processes_voice'], unresolved: true },
    ]);
  });

  describe('a repository lexcode cannot read (S4)', () => {
    const rs = ruleSetWith([{ id: 'lexcode.voice.whisper', activity: 'processes_voice' }]);
    const noRead = /no file in scope is in a language lexcode reads \(TypeScript, JavaScript, Python, Go, Ruby, Java and Kotlin, and script blocks in HTML, Vue, Svelte, Jinja, ERB and JSP\); nothing was looked at/;

    it('adds a notice when no code rule had a file to read', () => {
      const rulesRun = countRulesRun(rs, rs.rules, ['app.rb', 'README.md'], new Set());
      const r = buildRecord({ ...base, rs, rulesRun });
      expect(r.notices.filter((n) => noRead.test(n))).toHaveLength(1);
    });

    it('adds no notice when a code rule ran', () => {
      const rulesRun = countRulesRun(rs, rs.rules, ['app.py'], new Set());
      expect(buildRecord({ ...base, rs, rulesRun }).notices.join('\n')).not.toMatch(noRead);
    });

    it('a settings file alone (a workflow, a package.json) does not count as code lexcode read', () => {
      const withJson = ruleSetWith([{ id: 'lexcode.voice.whisper', activity: 'processes_voice' }, { id: 'lexcode.cfg.json', activity: 'tracks_devices', languages: ['json'] }]);
      const rulesRun = countRulesRun(withJson, withJson.rules.filter((x) => x.id.startsWith('lexcode.cfg') || x.id === 'lexcode.voice.whisper'), ['app.rb', 'package.json'], new Set());
      expect(buildRecord({ ...base, rs: withJson, rulesRun }).notices.join('\n')).toMatch(noRead);
    });

    it('the notice names every language and view type lexcode reads, Ruby, Java, Kotlin, ERB and JSP included', () => {
      const rulesRun = countRulesRun(rs, rs.rules, ['app.rb', 'README.md'], new Set());
      const text = buildRecord({ ...base, rs, rulesRun }).notices.find((n) => noRead.test(n)) ?? '';
      for (const name of ['TypeScript', 'JavaScript', 'Python', 'Go', 'Ruby', 'Java', 'Kotlin', 'HTML', 'Vue', 'Svelte', 'Jinja', 'ERB', 'JSP']) {
        expect(text).toMatch(new RegExp(`\\b${name}\\b`));
      }
    });

    it('stays in step with the bundled rules: every source language a rule reads is named', () => {
      const display: Record<string, string> = {
        typescript: 'TypeScript',
        javascript: 'JavaScript',
        python: 'Python',
        go: 'Go',
        ruby: 'Ruby',
        java: 'Java',
        kotlin: 'Kotlin',
      };
      // settings formats and build-file readers are not source languages
      const notSource = new Set(['json', 'yaml', 'yml', 'xml', 'generic', 'regex']);
      const langs = new Set(loadRuleSet().rules.flatMap((r) => r.languages.map((l) => l.toLowerCase())));
      const unnamed = [...langs].filter((l) => !notSource.has(l) && !new RegExp(`\\b${display[l] ?? `no name for ${l}`}\\b`).test(READ_LANGUAGES));
      expect(unnamed).toEqual([]);
    });

    it('a component map entry that ran does not stand in for a code rule', () => {
      const withMap = ruleSetWith([{ id: 'lexcode.voice.whisper', activity: 'processes_voice' }]);
      withMap.components.push({ ecosystem: 'npm', match: 'x', enables: ['processes_voice'], says: '', source: '' });
      const rulesRun = countRulesRun(withMap, withMap.rules, ['app.rb', 'package.json'], new Set(['npm']));
      expect(buildRecord({ ...base, rs: withMap, rulesRun }).notices.join('\n')).toMatch(noRead);
    });
  });

  it('says so when the rule set holds no source rules', () => {
    const rs = ruleSetWith();
    rs.rules.length = 0;
    expect(buildRecord({ ...base, rs }).notices.join('\n')).toMatch(/no source rules/);
  });
});

describe('countRulesRun', () => {
  const rs = ruleSetWith([
    { id: 'lexcode.a.py', activity: 'trains_models', languages: ['python'] },
    { id: 'lexcode.a.ts', activity: 'trains_models', languages: ['typescript'] },
    { id: 'lexcode.a.go', activity: 'trains_models', languages: ['go'] },
    { id: 'lexcode.b.json', activity: 'tracks_devices', languages: ['json'] },
    { id: 'lexcode.b.gen', activity: 'tracks_devices', languages: ['generic'] },
    { id: 'lexcode.c.js', activity: 'crawls_web', languages: ['js'] },
  ]);
  rs.rules = rs.rules.filter((r) => /^lexcode\.[abc]\./.test(r.id));
  rs.components.push(
    { ecosystem: 'npm', match: 'x', enables: ['trains_models', 'tracks_devices'], says: '', source: '' },
    { ecosystem: 'pypi', match: 'y', enables: ['trains_models'], says: '', source: '' },
    { ecosystem: 'files', match: '**/google-services.json', enables: ['tracks_devices'], says: '', source: '' },
  );

  it('counts a rule when an in-scope file has one of its languages, and generic when any file is in scope', () => {
    const m = countRulesRun(rs, rs.rules, ['src/a.py', 'web/page.vue.lexcode.ts', 'README.md'], new Set());
    expect(m.get('trains_models')).toBe(2);
    expect(m.get('tracks_devices')).toBe(2); // the generic rule, plus the files entry
    expect(m.get('crawls_web') ?? 0).toBe(0);
  });

  it('adds the map entries of an ecosystem whose manifests were found', () => {
    const files = ['a.py'];
    const none = countRulesRun(rs, rs.rules, files, new Set());
    const npm = countRulesRun(rs, rs.rules, files, new Set(['npm']));
    expect(npm.get('trains_models')).toBe((none.get('trains_models') ?? 0) + 1);
    expect(npm.get('tracks_devices')).toBe((none.get('tracks_devices') ?? 0) + 1);
    const both = countRulesRun(rs, rs.rules, files, new Set(['npm', 'pypi']));
    expect(both.get('trains_models')).toBe((none.get('trains_models') ?? 0) + 2);
  });

  it('counts only the activities that have something run', () => {
    const m = countRulesRun(rs, rs.rules, ['a.rb'], new Set());
    expect(m.get('trains_models')).toBeUndefined();
    expect(m.get('tracks_devices')).toBe(2);
  });
});

describe('unreadLanguages for Ruby', () => {
  const files = ['a.rb', 'b.rake', 'c.php'];
  /** The rules of the test alone: the helper's rule set carries the bundled ones as well. */
  const only = (rs: ReturnType<typeof ruleSetWith>) => rs.rules.filter((r) => r.id.startsWith('lexcode.a.'));

  it('reads .rb and .rake with a Ruby rule, so only PHP is unread', () => {
    const rs = ruleSetWith([{ id: 'lexcode.a.rb', activity: 'trains_models', languages: ['ruby'] }]);
    expect(unreadLanguages(only(rs), files)).toEqual([{ language: 'PHP', files: 1 }]);
  });

  it('counts .rb and .rake as Ruby files when no rule reads Ruby', () => {
    const rs = ruleSetWith([{ id: 'lexcode.a.py', activity: 'trains_models', languages: ['python'] }]);
    expect(unreadLanguages(only(rs), files)).toEqual([
      { language: 'Ruby', files: 2 },
      { language: 'PHP', files: 1 },
    ]);
  });

  it('counts .ru and .gemspec as Ruby, and hands them to a Ruby rule', () => {
    const rs = ruleSetWith([{ id: 'lexcode.a.rb', activity: 'trains_models', languages: ['ruby'] }]);
    const all = ['config.ru', 'x.gemspec', 'y.rb'];
    expect(unreadLanguages(only(rs), all)).toEqual([]);
    expect(engineTargets(only(rs), [...all, 'z.py'])).toEqual(all);
    const py = ruleSetWith([{ id: 'lexcode.a.py', activity: 'trains_models', languages: ['python'] }]);
    expect(unreadLanguages(only(py), all)).toEqual([{ language: 'Ruby', files: 3 }]);
  });
});
