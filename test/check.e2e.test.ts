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
