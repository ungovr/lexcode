import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runExplainCommand } from '../../src/commands/explain.js';
import { runRulesCommand } from '../../src/commands/rules.js';
import { main } from '../../src/main.js';
import { makeRuleSet } from '../helpers/ruleset.js';
import { tree } from './helpers.js';

const here = dirname(fileURLToPath(import.meta.url));
const DRIFT_RULES = resolve(here, '..', 'repos', 'drift', '.rules');
const PKG = JSON.parse(readFileSync(resolve(here, '..', '..', 'package.json'), 'utf8')) as { version: string };

let out: string[];
let err: string[];
const io = () => ({ stdout: (s: string) => void out.push(s), stderr: (s: string) => void err.push(s) });
// The bundled rules keep growing; these tests read a minimal rules home.
const RULES_HOME = resolve(here, '..', 'repos', 'rules-home');
beforeEach(() => {
  vi.stubEnv('LEXCODE_RULES_HOME', RULES_HOME);
  out = [];
  err = [];
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('lexcode version', () => {
  it('prints the package, rule set, engine and registry versions', async () => {
    expect(await main(['version'], io())).toBe(0);
    expect(out.join('')).toBe(`lexcode ${PKG.version}\nrules 1.1.0\nengine opengrep 1.33.1\nregistry 1.15\n`);
  });

  it('has no effect on import and answers --version like version', async () => {
    expect(await main(['--version'], io())).toBe(0);
    expect(out.join('')).toContain(`lexcode ${PKG.version}`);
  });
});

describe('lexcode explain', () => {
  it('prints the class, the registry definition, the page and the rule ids of an activity', async () => {
    expect(await main(['explain', 'crawls_web', '--rules', DRIFT_RULES], io())).toBe(0);
    const text = out.join('');
    expect(text).toContain('crawls_web  (Crawls the web)');
    expect(text).toContain('class: evidence');
    expect(text).toContain('It fetches pages or files from sites you do not operate');
    expect(text).toContain('page: https://lexlint.io/activities/crawls-web');
    expect(text).toContain('rules (1): lexcode.crawl.spider-crawl');
  });

  it('says a signal-class activity never fails a check', async () => {
    expect(await main(['explain', 'operates_social_platform'], io())).toBe(0);
    expect(out.join('')).toMatch(/class: signal \(.*never fails a check\)/);
  });

  it('prints the term and says a held id is held in the registry', async () => {
    expect(await main(['explain', 'ships_encryption'], io())).toBe(0);
    const text = out.join('');
    expect(text).toContain('Ships encryption');
    expect(text).toMatch(/held in the registry/);
    expect(text).not.toMatch(/page: /);
  });

  it('shows a family', async () => {
    expect(await main(['explain', 'generates_images'], io())).toBe(0);
    expect(out.join('')).toContain('a kind of generates_content');
    out.length = 0;
    expect(await main(['explain', 'generates_content'], io())).toBe(0);
    expect(out.join('')).toContain('generates_text');
  });

  it('prints the activity and message of a rule id', async () => {
    expect(await main(['explain', 'lexcode.train.model-fit', '--rules', DRIFT_RULES], io())).toBe(0);
    const text = out.join('');
    expect(text).toContain('activity: trains_models');
    expect(text).toContain('message: fits a model to data');
    expect(text).toContain('strength: evidence');
  });

  it('exits 2 and says what to run next for something it does not know, printing nothing else', async () => {
    expect(await main(['explain', 'crawls_web', 'nonsense'], io())).toBe(2);
    expect(out.join('')).toBe('');
    expect(err.join('')).toMatch(/"nonsense" is not an activity id, a rule id or a package URL.*lexcode rules/);
  });

  it('takes several arguments and prints a JSON array under --json', async () => {
    expect(await main(['explain', 'crawls_web', 'trains_models', '--json'], io())).toBe(0);
    const docs = JSON.parse(out.join('')) as { id: string; class: string; kind: string }[];
    expect(docs.map((d) => [d.id, d.class, d.kind])).toEqual([
      ['crawls_web', 'evidence', 'activity'],
      ['trains_models', 'evidence', 'activity'],
    ]);
  });

  it('exits 2 with the usage when it is given nothing', async () => {
    expect(await main(['explain'], io())).toBe(2);
    expect(err.join('')).toContain('lexcode explain');
  });

  describe('a package URL', () => {
    const rs = makeRuleSet();
    rs.components = [
      { ecosystem: 'npm', match: '@segment/analytics-next', enables: ['tracks_devices', 'processes_personal_data'], says: 'a', source: 'https://example.org' },
      { ecosystem: 'golang', match: 'github.com/gocolly/colly/*', enables: ['crawls_web'], says: 'a', source: 'https://example.org' },
      { ecosystem: 'pypi', match: 'Django_REST-framework', enables: ['processes_personal_data'], says: 'a', source: 'https://example.org' },
    ];
    const run = async (args: string[]) => runExplainCommand(args, io(), { rs });

    it('is matched against the component map and printed as {purl, enables}', async () => {
      const purl = 'pkg:npm/%40segment/analytics-next@1.77.0';
      expect(await run([purl, '--json'])).toBe(0);
      expect(JSON.parse(out.join(''))).toEqual({ purl, enables: ['processes_personal_data', 'tracks_devices'] });
    });

    it('reads an unencoded scope, a Go module path and a PyPI name', async () => {
      expect(await run(['pkg:npm/@segment/analytics-next', '--json'])).toBe(0);
      expect(JSON.parse(out.join('')).enables).toEqual(['processes_personal_data', 'tracks_devices']);
      out.length = 0;
      expect(await run(['pkg:golang/github.com/gocolly/colly/v2@v2.1.0', '--json'])).toBe(0);
      expect(JSON.parse(out.join('')).enables).toEqual(['crawls_web']);
      out.length = 0;
      expect(await run(['pkg:pypi/django-rest-framework@3.15.2', '--json'])).toBe(0);
      expect(JSON.parse(out.join('')).enables).toEqual(['processes_personal_data']);
    });

    it('answers a package with no entry with an empty list, not an error', async () => {
      expect(await run(['pkg:npm/left-pad@1.3.0', '--json'])).toBe(0);
      expect(JSON.parse(out.join(''))).toEqual({ purl: 'pkg:npm/left-pad@1.3.0', enables: [] });
      out.length = 0;
      expect(await run(['pkg:npm/left-pad@1.3.0'])).toBe(0);
      expect(out.join('')).toContain('no entry in the dependency map');
    });

    it('prints one {purl, enables} per argument for several', async () => {
      expect(await run(['pkg:npm/left-pad', 'pkg:cargo/serde@1.0.0', '--json'])).toBe(0);
      expect(JSON.parse(out.join(''))).toEqual([
        { purl: 'pkg:npm/left-pad', enables: [] },
        { purl: 'pkg:cargo/serde@1.0.0', enables: [] },
      ]);
    });

    it('reads a Maven purl as <group>/<artifact>, the map\'s <group>:<artifact>', async () => {
      const maven = makeRuleSet();
      maven.components = [{ ecosystem: 'maven', match: 'com.twilio.sdk:twilio', enables: ['processes_voice'], says: 'a', source: 'https://example.org' }];
      const purl = 'pkg:maven/com.twilio.sdk/twilio@10.1.0';
      expect(await runExplainCommand([purl, '--json'], io(), { rs: maven })).toBe(0);
      expect(JSON.parse(out.join(''))).toEqual({ purl, enables: ['processes_voice'] });
      out.length = 0;
      // The group is not read as part of the artifact, nor the artifact alone as the name.
      expect(await runExplainCommand(['pkg:maven/com.twilio/sdk-twilio', '--json'], io(), { rs: maven })).toBe(0);
      expect(JSON.parse(out.join('')).enables).toEqual([]);
      out.length = 0;
      expect(await runExplainCommand(['pkg:maven/twilio', '--json'], io(), { rs: maven })).toBe(0);
      expect(JSON.parse(out.join('')).enables).toEqual([]);
    });

    it('answers a Maven purl from the bundled map through main', async () => {
      vi.unstubAllEnvs(); // the bundled rules home, not the minimal one, holds the Maven map
      expect(await main(['explain', 'pkg:maven/com.twilio.sdk/twilio@10.1.0', '--json'], io())).toBe(0);
      expect(JSON.parse(out.join('')).enables).toContain('automated_outreach');
    });

    it('rejects a malformed purl with exit 2 through main', async () => {
      expect(await main(['explain', 'pkg:npm', '--json'], io())).toBe(2);
      expect(err.join('')).toMatch(/not a valid package URL/);
    });
  });
});

describe('lexcode rules', () => {
  it('lists every rule as JSON with its id, activity, strength and languages', async () => {
    expect(await main(['rules', '--json', '--rules', DRIFT_RULES], io())).toBe(0);
    const rows = JSON.parse(out.join('')) as { id: string; activity: string; strength: string; languages: string[] }[];
    expect(rows.find((r) => r.id === 'lexcode.social.feed-publish')).toMatchObject({ activity: 'operates_social_platform', strength: 'signal', languages: ['python'] });
    expect(rows.find((r) => r.id === 'lexcode.train.model-fit')).toMatchObject({ activity: 'trains_models', strength: 'evidence' });
  });

  it('prints a table and a count', async () => {
    expect(await main(['rules', '--rules', DRIFT_RULES], io())).toBe(0);
    expect(out.join('')).toMatch(/lexcode\.crawl\.spider-crawl\s+crawls_web\s+performs\/evidence\s+python/);
    expect(out.join('')).toMatch(/\n\d+ rules\n$/);
  });

  it('says what to do when the set has no rules', async () => {
    const rs = makeRuleSet();
    rs.rules = [];
    expect(await runRulesCommand([], io(), { rs })).toBe(0);
    expect(out.join('')).toMatch(/holds no source rules/);
    out.length = 0;
    expect(await runRulesCommand(['--json'], io(), { rs })).toBe(0);
    expect(JSON.parse(out.join(''))).toEqual([]);
  });
});

describe('the command line', () => {
  it('prints the usage and exits 0 for no command, help and --help', async () => {
    for (const argv of [[], ['help'], ['--help'], ['scan', '--help']]) {
      out.length = 0;
      expect(await main(argv, io())).toBe(0);
      expect(out.join('')).toContain('lexcode scan');
    }
  });

  it('exits 2 with the usage for an unknown command and for an unknown flag on every command', async () => {
    expect(await main(['frobnicate'], io())).toBe(2);
    expect(err.join('')).toContain('unknown command "frobnicate"');
    for (const cmd of ['scan', 'check', 'explain', 'rules', 'version']) {
      err.length = 0;
      expect(await main([cmd, 'crawls_web', '--bogus'], io()), cmd).toBe(2);
      expect(err.join(''), cmd).toMatch(/Unknown option '--bogus'/);
      expect(err.join(''), cmd).toContain('Exit codes:');
    }
  });

  it('exits 2 for a flag that needs a value and for too many arguments', async () => {
    expect(await main(['scan', '--out'], io())).toBe(2);
    expect(await main(['scan', 'a', 'b'], io())).toBe(2);
    expect(err.join('')).toContain('too many arguments');
  });

  it('accepts --rules more than once', async () => {
    const extra = tree({
      'trains_models/other.yml': [
        'rules:',
        '  - id: lexcode.other.thing',
        '    languages: [python]',
        '    severity: INFO',
        '    message: other',
        '    pattern: other(...)',
        '    metadata: {activity: trains_models, mentioned: performs}',
        '',
      ].join('\n'),
    });
    expect(await main(['rules', '--json', '--rules', DRIFT_RULES, '--rules', extra], io())).toBe(0);
    const ids = (JSON.parse(out.join('')) as { id: string }[]).map((r) => r.id);
    expect(ids).toContain('lexcode.other.thing');
    expect(ids).toContain('lexcode.train.model-fit');
  });

  it('keeps the engine command working through main', async () => {
    expect(await main(['engine', 'bogus'], io())).toBe(2);
    expect(err.join('')).toContain('lexcode engine fetch | path | verify');
  });

  it('keeps the copy rules in what it prints', async () => {
    await main(['--help'], io());
    expect(join(out.join(''), err.join(''))).not.toMatch(/—|honest|complian/i);
  });
});
