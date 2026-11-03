import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { main } from '../src/main.js';
import { cacheDir } from '../src/engine/cache.js';
import { pinnedEnginePath } from '../src/engine/fetch.js';
import { ENGINE_PIN } from '../src/engine/pin.js';
import { platformKey } from '../src/engine/platform.js';
import type { CheckResult } from '../src/types.js';

function cachedEngine(): string | undefined {
  try {
    const p = pinnedEnginePath(ENGINE_PIN, platformKey(), cacheDir());
    return existsSync(p) ? p : undefined;
  } catch {
    return undefined;
  }
}
const engineAvailable = Boolean(process.env.LEXCODE_ENGINE ?? cachedEngine());

const STUB = resolve(dirname(fileURLToPath(import.meta.url)), 'stubs', 'fake-opengrep.mjs');
const FIXTURE = resolve(dirname(fileURLToPath(import.meta.url)), 'repos', 'drift');

let work: string;
let repo: string;
let rules: string;
let out: string[];
let err: string[];
const io = () => ({ stdout: (s: string) => void out.push(s), stderr: (s: string) => void err.push(s) });

// The bundled rules and component map keep growing; these tests run against a minimal rules home.
const RULES_HOME = resolve(dirname(fileURLToPath(import.meta.url)), 'repos', 'rules-home');

beforeEach(() => {
  vi.stubEnv('LEXCODE_RULES_HOME', RULES_HOME);
  work = mkdtempSync(join(tmpdir(), 'lexcode-check-'));
  repo = join(work, 'drift');
  cpSync(FIXTURE, repo, { recursive: true });
  rules = join(repo, '.rules');
  out = [];
  err = [];
});
afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(work, { recursive: true, force: true });
});

describe.skipIf(!engineAvailable)('lexcode check over test/repos/drift with the real engine', () => {
  it('exits 1 and prints one FAIL, one WARN, one PASS, one INFO and a signal', async () => {
    const code = await main(['check', repo, '--rules', rules], io());
    const text = err.join('');
    expect(code).toBe(1);
    expect(text).toContain('lexcode check against ACTIVITIES.md');
    expect(text).toMatch(/files read; rules 1\.0\.0; engine opengrep 1\.33\.1; registry 1\.15/);
    expect(text).toContain('FAIL  trains_models  the code performs trains_models and the declaration does not carry it');
    expect(text).toContain('src/app.py:8  lexcode.train.model-fit');
    expect(text).toContain("WARN  generates_text  the declaration says generates_text comes only through a dependency, and the project's own code does it");
    expect(text).toContain('PASS  processes_voice  declared, and the code shows it (1 rule tried)');
    expect(text).toContain('INFO  crawls_web  declared; the code showed nothing (1 rule tried)');
    expect(text).toContain('Worth a look (no effect on the result):');
    expect(text).toContain('operates_social_platform');
    expect(text).toContain('Result: 1 FAIL, 1 WARN, 1 PASS, 1 INFO.');
    // A FAIL prints the activity's definition from the registry snapshot.
    expect(text).toContain('It trains, fine-tunes or builds a model on data it collects.');
  });

  it('prints the comparison as JSON on stdout under --json, and nothing on stderr', async () => {
    const code = await main(['check', repo, '--rules', rules, '--json'], io());
    expect(code).toBe(1);
    expect(err.join('')).toBe('');
    const res = JSON.parse(out.join('')) as CheckResult;
    expect(res.rows.map((r) => `${r.verdict}:${r.id}:${r.kind}`)).toEqual([
      'FAIL:trains_models:not-mentioned',
      'WARN:generates_text:performs-declared-enables',
      'PASS:processes_voice:confirmed',
      'INFO:crawls_web:not-found',
    ]);
    expect(res.rows[3]?.rulesTried).toBe(1);
    expect(res.signals.map((s) => s.id)).toEqual(['operates_social_platform']);
    expect(res.exitCode).toBe(1);
  });

  it('prints only FAIL and WARN rows and the result line under --quiet', async () => {
    expect(await main(['check', repo, '--rules', rules, '--quiet'], io())).toBe(1);
    const text = err.join('');
    expect(text).toContain('FAIL  trains_models');
    expect(text).toContain('WARN  generates_text');
    expect(text).not.toContain('PASS  processes_voice');
    expect(text).not.toContain('INFO  crawls_web');
    expect(text).not.toContain('Worth a look');
    expect(text).toContain('Result: 1 FAIL, 1 WARN, 1 PASS, 1 INFO.');
  });

  it('writes the record and SARIF only where asked', async () => {
    const rec = join(work, 'rec.json');
    const sarif = join(work, 'out.sarif');
    expect(await main(['check', repo, '--rules', rules, '--out', rec, '--sarif', sarif], io())).toBe(1);
    expect(JSON.parse(readFileSync(rec, 'utf8')).schema).toBe('https://lexlint.io/lexcode/v1');
    expect(JSON.parse(readFileSync(sarif, 'utf8')).version).toBe('2.1.0');
    expect(existsSync(join(repo, 'lexcode.json'))).toBe(false);
  });

  it('exits 0 when the declaration carries what the code does', async () => {
    const md = readFileSync(join(repo, 'ACTIVITIES.md'), 'utf8')
      .replace('mentioned: enables', 'mentioned: performs')
      .replace('    activities:\n', '    activities:\n      - id: trains_models\n        mentioned: performs\n        enabled: by_default\n        where: [src/]\n        note: Fits a model.\n');
    writeFileSync(join(repo, 'ACTIVITIES.md'), md);
    expect(await main(['check', repo, '--rules', rules], io())).toBe(0);
    expect(err.join('')).toContain('Result: 0 FAIL, 0 WARN, 3 PASS, 1 INFO.');
  });

  it('reports a disagreement between ACTIVITIES.md and lexlint.yml as a WARN and compares against ACTIVITIES.md', async () => {
    writeFileSync(join(repo, 'lexlint.yml'), 'profile:\n  activities:\n    - processes_voice\n    - trains_models\n');
    const code = await main(['check', repo, '--rules', rules, '--json'], io());
    expect(code).toBe(1);
    const res = JSON.parse(out.join('')) as CheckResult;
    const dis = res.rows.filter((r) => r.kind === 'declarations-disagree').map((r) => `${r.verdict}:${r.id}`);
    expect(dis).toEqual(['WARN:crawls_web', 'WARN:generates_text', 'WARN:trains_models']);
    expect(res.rows.find((r) => r.id === 'trains_models' && r.kind === 'not-mentioned')?.verdict).toBe('FAIL');
  });

  it('lets --declaration choose lexlint.yml, and reads its app.scope', async () => {
    writeFileSync(join(repo, 'lexlint.yml'), 'profile:\n  activities:\n    - processes_voice\n    - trains_models\n    - generates_text\napp:\n  scope:\n    include:\n      - src/\n');
    const code = await main(['check', repo, '--rules', rules, '--declaration', 'lexlint.yml', '--json'], io());
    expect(code).toBe(0);
    expect(err.join('')).toBe('');
  });

  it('writes the evidence record under --allow-undeclared with no declaration', async () => {
    rmSync(join(repo, 'ACTIVITIES.md'));
    const rec = join(work, 'rec.json');
    expect(await main(['check', repo, '--rules', rules, '--allow-undeclared', '--out', rec], io())).toBe(0);
    const record = JSON.parse(readFileSync(rec, 'utf8')) as { activities: { id: string }[] };
    expect(record.activities.map((a) => a.id)).toContain('trains_models');
  });

  it('applies the sidecar: an ignore removes the evidence and the FAIL with it', async () => {
    writeFileSync(
      join(repo, '.lexcode.yml'),
      'schema: https://lexlint.io/lexcode/config/v1\nignore:\n  - rule: lexcode.train.model-fit\n    where: src/\n    reason: The fixture says so.\n',
    );
    expect(await main(['check', repo, '--rules', rules, '--json'], io())).toBe(0);
    const res = JSON.parse(out.join('')) as CheckResult;
    expect(res.rows.map((r) => r.id)).not.toContain('trains_models');
  });
});

describe.skipIf(!engineAvailable)('lexcode check shows what the repository set aside (M5, S4)', () => {
  const SIDECAR =
    'schema: https://lexlint.io/lexcode/config/v1\nignore:\n  - rule: lexcode.train.model-fit\n    where: src/\n    reason: The fixture says so.\n    by: sean\n    on: 2026-11-03\n';

  it('prints the set-aside block and the reason, with and without --quiet', async () => {
    writeFileSync(join(repo, '.lexcode.yml'), SIDECAR);
    expect(await main(['check', repo, '--rules', rules], io())).toBe(0);
    const full = err.join('');
    expect(full).toContain('Set aside by .lexcode.yml:');
    expect(full).toContain('lexcode.train.model-fit at src/: 1 match; reason: The fixture says so.; by sean; on 2026-11-03');
    err = [];
    expect(await main(['check', repo, '--rules', rules, '--quiet'], io())).toBe(0);
    const quiet = err.join('');
    expect(quiet).toContain('Set aside by .lexcode.yml:');
    expect(quiet).toContain('lexcode.train.model-fit at src/: 1 match');
    expect(quiet.indexOf('Set aside')).toBeLessThan(quiet.indexOf('Result:'));
  });

  it('puts ignored and scope in the JSON, joined with the sidecar reason', async () => {
    writeFileSync(join(repo, '.lexcode.yml'), SIDECAR);
    expect(await main(['check', repo, '--rules', rules, '--json'], io())).toBe(0);
    const res = JSON.parse(out.join('')) as CheckResult;
    expect(res.ignored).toEqual([
      { rule: 'lexcode.train.model-fit', where: 'src/', matched: 1, activities: ['trains_models'], reason: 'The fixture says so.', by: 'sean', on: '2026-11-03' },
    ]);
    expect(res.scope.files).toBeGreaterThan(0);
  });

  it('an ignore that removed evidence for an id under not: is a WARN row, exit 0', async () => {
    writeFileSync(join(repo, '.lexcode.yml'), SIDECAR);
    const md = readFileSync(join(repo, 'ACTIVITIES.md'), 'utf8');
    writeFileSync(join(repo, 'ACTIVITIES.md'), md.replace('        note: Declared, and the code shows nothing.\n', '        note: Declared, and the code shows nothing.\n    not:\n      - id: trains_models\n        why: We never train.\n'));
    expect(await main(['check', repo, '--rules', rules, '--quiet'], io())).toBe(0);
    const text = err.join('');
    expect(text).toContain('WARN  trains_models  an ignore in .lexcode.yml set aside evidence that the code does trains_models, which the declaration says it does not');
    expect(text).toContain('reason: The fixture says so.');
  });

  it('prints the Scope line when the sidecar narrows the scan, and says 1 file read', async () => {
    writeFileSync(join(repo, 'README.md'), '# fixture\n');
    writeFileSync(join(repo, '.lexcode.yml'), 'schema: https://lexlint.io/lexcode/config/v1\ninclude:\n  - README.md\n');
    await main(['check', repo, '--rules', rules, '--quiet'], io());
    expect(err.join('')).toContain('Scope: include README.md; exclude none (from .lexcode.yml)');
    err = [];
    await main(['check', repo, '--rules', rules], io());
    expect(err.join('')).toContain('1 file read; rules');
  });

  it('prints the Scope line for app.scope in lexlint.yml', async () => {
    writeFileSync(join(repo, 'lexlint.yml'), 'profile:\n  activities:\n    - processes_voice\n    - trains_models\n    - generates_text\napp:\n  scope:\n    include:\n      - src/\n');
    await main(['check', repo, '--rules', rules, '--declaration', 'lexlint.yml', '--quiet'], io());
    expect(err.join('')).toContain('Scope: include src/; exclude none (from lexlint.yml app.scope)');
  });

  it('a repository with no file lexcode reads says so and marks the declared ids not looked at', async () => {
    rmSync(join(repo, 'src'), { recursive: true });
    writeFileSync(join(repo, 'crawler.rb'), 'require "net/http"\n');
    expect(await main(['check', repo, '--rules', rules], io())).toBe(0);
    const text = err.join('');
    expect(text).toContain('no file in scope is in a language lexcode reads');
    expect(text).toContain('INFO  processes_voice  declared; lexcode has no rule that reads the files in scope for it');
    expect(text).not.toContain('the code showed nothing');
  });
});

describe('lexcode check with no declaration', () => {
  function bare(): string {
    const dir = join(work, 'bare');
    cpSync(FIXTURE, dir, { recursive: true });
    rmSync(join(dir, 'ACTIVITIES.md'));
    return dir;
  }

  it('exits 3 and names the declaration files and the escape hatch, before the engine runs', async () => {
    const dir = bare();
    // A missing engine would be exit 2 if the engine step ran first.
    expect(await main(['check', dir, '--rules', join(dir, '.rules'), '--engine', '/nonexistent/engine'], io())).toBe(3);
    const text = err.join('');
    expect(text).toContain('ACTIVITIES.md');
    expect(text).toContain('lexlint.yml');
    expect(text).toContain('--allow-undeclared');
  });

  it('still scans, writes --out and --sarif, warns and exits 0 under --allow-undeclared', async () => {
    const dir = bare();
    const rec = join(work, 'rec.json');
    const sarif = join(work, 'out.sarif');
    const code = await main(['check', dir, '--rules', join(dir, '.rules'), '--engine', STUB, '--allow-undeclared', '--out', rec, '--sarif', sarif], io());
    expect(code).toBe(0);
    expect(err.join('')).toMatch(/warning: no declaration found.*nothing was compared/);
    expect(JSON.parse(readFileSync(rec, 'utf8')).schema).toBe('https://lexlint.io/lexcode/v1');
    expect(JSON.parse(readFileSync(sarif, 'utf8')).version).toBe('2.1.0');
  });

  it('prints an empty comparison as JSON under --allow-undeclared --json', async () => {
    const dir = bare();
    expect(await main(['check', dir, '--rules', join(dir, '.rules'), '--engine', STUB, '--allow-undeclared', '--json'], io())).toBe(0);
    const res = JSON.parse(out.join('')) as CheckResult;
    expect(res.rows).toEqual([]);
    expect(res.exitCode).toBe(0);
  });
});
