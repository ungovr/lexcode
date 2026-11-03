import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { main } from '../src/main.js';
import { cacheDir } from '../src/engine/cache.js';
import { pinnedEnginePath } from '../src/engine/fetch.js';
import { ENGINE_PIN } from '../src/engine/pin.js';
import { platformKey } from '../src/engine/platform.js';
import type { EvidenceRecord } from '../src/types.js';

function cachedEngine(): string | undefined {
  try {
    const p = pinnedEnginePath(ENGINE_PIN, platformKey(), cacheDir());
    return existsSync(p) ? p : undefined;
  } catch {
    return undefined;
  }
}
const engineAvailable = Boolean(process.env.LEXCODE_ENGINE ?? cachedEngine());

const FIXTURE = resolve(dirname(fileURLToPath(import.meta.url)), 'repos', 'basic');
const RULES = join(FIXTURE, '.rules');

let work: string;
let repo: string;
let out: string[];
let err: string[];
const io = () => ({ stdout: (s: string) => void out.push(s), stderr: (s: string) => void err.push(s) });

beforeEach(() => {
  work = mkdtempSync(join(tmpdir(), 'lexcode-e2e-'));
  repo = join(work, 'basic');
  cpSync(FIXTURE, repo, { recursive: true });
  out = [];
  err = [];
});
afterEach(() => {
  rmSync(work, { recursive: true, force: true });
});

describe.skipIf(!engineAvailable)('lexcode scan over test/repos/basic with the real engine', () => {
  it('writes lexcode.json and reports the original .vue path and line', async () => {
    const code = await main(['scan', repo, '--rules', join(repo, '.rules')], io());
    expect(code).toBe(0);
    const file = join(repo, 'lexcode.json');
    expect(existsSync(file)).toBe(true);
    const rec = JSON.parse(readFileSync(file, 'utf8')) as EvidenceRecord;

    const voice = rec.activities.find((a) => a.id === 'processes_voice' && a.mentioned === 'performs');
    expect(voice?.evidence.map((e) => `${e.rule} ${e.where}`)).toEqual([
      'lexcode.voice.whisper-load src/voice.py:5',
      'lexcode.voice.browser-microphone web/App.vue:7',
    ]);
    expect(rec.scope.extracted).toBe(1);
    expect(rec.scope.dev_dependencies_skipped).toBe(1);
    expect(rec.engine).toEqual({ name: 'opengrep', version: '1.33.1' });
    expect(err.join('')).toMatch(/lexcode scan: \d+ files read; 1 activity with performs evidence, 0 with enables evidence, 0 signals; record written to .*lexcode\.json/);
    // The engine's matched text never reaches the record without --snippets.
    expect(readFileSync(file, 'utf8')).not.toContain('load_model("base")');
  });

  it('prints the record to stdout and writes no file under --json', async () => {
    const code = await main(['scan', repo, '--rules', RULES, '--json'], io());
    expect(code).toBe(0);
    const rec = JSON.parse(out.join('')) as EvidenceRecord;
    expect(rec.activities.some((a) => a.id === 'processes_voice')).toBe(true);
    expect(existsSync(join(repo, 'lexcode.json'))).toBe(false);
  });

  it('writes SARIF that parses as 2.1.0 and carries the snippet only with --snippets', async () => {
    const sarifPath = join(work, 'out.sarif');
    expect(await main(['scan', repo, '--rules', RULES, '--json', '--sarif', sarifPath], io())).toBe(0);
    const sarif = JSON.parse(readFileSync(sarifPath, 'utf8')) as { version: string; runs: { results: unknown[] }[] };
    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs[0]?.results.length).toBeGreaterThanOrEqual(2);
    expect(readFileSync(sarifPath, 'utf8')).not.toContain('load_model');

    expect(await main(['scan', repo, '--rules', RULES, '--json', '--snippets', '--sarif', sarifPath], io())).toBe(0);
    expect(readFileSync(sarifPath, 'utf8')).toContain('load_model');
  });

  it('does not read the record it wrote last time', async () => {
    expect(await main(['scan', repo, '--rules', RULES], io())).toBe(0);
    out.length = 0;
    expect(await main(['scan', repo, '--rules', RULES, '--json'], io())).toBe(0);
    const rec = JSON.parse(out.join('')) as EvidenceRecord;
    // package.json, package-lock.json, src/voice.py, web/App.vue and the two rule files; never lexcode.json.
    expect(rec.scope.files).toBe(6);
  });
});

describe('lexcode scan failures', () => {
  it('exits 2 with a next step when no file is in scope', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'lexcode-empty-'));
    try {
      expect(await main(['scan', empty], io())).toBe(2);
      expect(err.join('')).toContain('no files in scope');
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });

  it('exits 2 for a path that does not exist', async () => {
    expect(await main(['scan', join(work, 'missing')], io())).toBe(2);
    expect(err.join('')).toMatch(/cannot read the repository/);
  });

  it('exits 2 with the usage for an unknown flag', async () => {
    expect(await main(['scan', repo, '--bogus'], io())).toBe(2);
    expect(err.join('')).toContain('lexcode scan');
  });
});
