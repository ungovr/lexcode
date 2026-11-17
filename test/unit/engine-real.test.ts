import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cacheDir } from '../../src/engine/cache.js';
import { pinnedEnginePath } from '../../src/engine/fetch.js';
import { ENGINE_PIN } from '../../src/engine/pin.js';
import { platformKey } from '../../src/engine/platform.js';
import { runEngine } from '../../src/engine/run.js';
import { urlLiteral } from '../../src/record/hosts.js';

function cachedEngine(): string | undefined {
  try {
    const p = pinnedEnginePath(ENGINE_PIN, platformKey(), cacheDir());
    return existsSync(p) ? p : undefined;
  } catch {
    return undefined;
  }
}
const engine = process.env.LEXCODE_ENGINE ?? cachedEngine();

// Skipped unless the pinned engine is already cached (run `lexcode engine fetch` first).
describe.skipIf(!engine)('the real pinned engine', () => {
  it('finds a one-line Python call with a one-rule config and reports a bare rule id', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'lexcode-real-'));
    try {
      await writeFile(join(dir, 'app.py'), 'import requests\nrequests.get("https://example.com")\n');
      await writeFile(
        join(dir, 'rule.yml'),
        [
          'rules:',
          '  - id: lexcode.test.requests-get',
          '    languages: [python]',
          '    severity: INFO',
          '    message: an HTTP GET',
          '    pattern: requests.get($URL)',
          '',
        ].join('\n'),
      );
      const r = await runEngine({ engine: engine!, configFile: join(dir, 'rule.yml'), targets: ['app.py'], root: dir });
      expect(r.matches).toHaveLength(1);
      expect(r.matches[0]).toMatchObject({ ruleId: 'lexcode.test.requests-get', path: 'app.py', line: 2 });
      expect(r.matches[0]?.metavars.$URL).toBe('"https://example.com"');
      expect(r.fileErrors).toBe(0);
      expect(r.version).toMatch(/^\d+\.\d+\.\d+/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  // The printed text of an interpolated string has lost its holes; the source slice keeps them, in every
  // language whose printed form the engine mangles, and across a non-ASCII prefix (columns are bytes) (#12882).
  it('gives each host metavariable its text as the file writes it, interpolations included', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'lexcode-real-'));
    try {
      const files: Record<string, [string, string]> = {
        'a.rb': ['ruby', 'x = "é"; fetchit("https://r.example.com/v1/#{id}")\n'],
        'a.js': ['javascript', 'const é = 1; fetchit(\n  `https://${host}/x`)\n'],
        'a.py': ['python', 'fetchit(f"https://p.example.com/{id}")\n'],
        'a.kt': ['kotlin', 'fun f() { fetchit("https://k.example.com/$id") }\n'],
        'a.php': ['php', '<?php\nfetchit("https://{$host}/x");\n'],
      };
      const rules = ['rules:'];
      for (const [name, [lang, body]] of Object.entries(files)) {
        await writeFile(join(dir, name), body);
        rules.push(`  - id: t.${lang}`, `    languages: [${lang}]`, '    severity: INFO', '    message: m', '    pattern: fetchit($URL)');
      }
      await writeFile(join(dir, 'rule.yml'), rules.join('\n') + '\n');
      const r = await runEngine({ engine: engine!, configFile: join(dir, 'rule.yml'), targets: Object.keys(files), root: dir });
      const source = Object.fromEntries(r.matches.map((m) => [m.path, m.source?.$URL]));
      expect(source).toEqual({
        'a.rb': '"https://r.example.com/v1/#{id}"',
        'a.js': '`https://${host}/x`',
        'a.py': 'f"https://p.example.com/{id}"',
        'a.kt': '"https://k.example.com/$id"',
        'a.php': '"https://{$host}/x"',
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  // C#: the engine's range for an interpolated string stops before the closing quote (and before the last
  // hole's `}`), so the slice is unclosed in every form; Swift's slice is complete. urlLiteral must read the
  // host from the shape the engine really gives, not from a closed string a unit test makes up (#12882).
  it('slices C# interpolated strings unclosed and Swift ones whole, and urlLiteral reads the host from each', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'lexcode-real-'));
    try {
      const cs = [
        'class A { void F() {',
        'Fetchit($"https://c.example.com/{id}");',
        'Fetchit($"https://b.example/x");',
        'Fetchit(@$"https://d.example.com/{id}");',
        'Fetchit($@"https://e.example.com/{id}");',
        'Fetchit($"""https://f.example.com/{id}""");',
        'Fetchit($$"""https://g.example.com/{{id}}""");',
        'Fetchit($"https://{host}/x");',
        'Fetchit($"{baseUrl}/x");',
        '} }',
        '',
      ].join('\n');
      const swift = ['fetchit("https://s.example.com/\\(id)")', 'fetchit("https://\\(host)/x")', 'fetchit("https://t.example.com/x")', ''].join('\n');
      await writeFile(join(dir, 'a.cs'), cs);
      await writeFile(join(dir, 'a.swift'), swift);
      await writeFile(
        join(dir, 'rule.yml'),
        [
          'rules:',
          ...['csharp', 'swift'].flatMap((lang) => [
            `  - id: t.${lang}`,
            `    languages: [${lang}]`,
            '    severity: INFO',
            '    message: m',
            `    pattern: ${lang === 'csharp' ? 'Fetchit' : 'fetchit'}($URL)`,
          ]),
          '',
        ].join('\n'),
      );
      const r = await runEngine({ engine: engine!, configFile: join(dir, 'rule.yml'), targets: ['a.cs', 'a.swift'], root: dir });
      const got = r.matches.map((m) => [`${m.path}:${m.line}`, m.source?.$URL, urlLiteral(m.source?.$URL ?? '', { source: true })]);
      const host = (h: string) => ({ literal: true, host: h });
      const code = { literal: false };
      expect(got).toEqual([
        ['a.cs:2', '$"https://c.example.com/{id', host('c.example.com')],
        ['a.cs:3', '$"https://b.example/x', host('b.example')],
        ['a.cs:4', '@$"https://d.example.com/{id', host('d.example.com')],
        ['a.cs:5', '$@"https://e.example.com/{id', host('e.example.com')],
        ['a.cs:6', '$"""https://f.example.com/{id', host('f.example.com')],
        ['a.cs:7', '$$"""https://g.example.com/{{id', host('g.example.com')],
        ['a.cs:8', '$"https://{host}/x', code],
        ['a.cs:9', '$"{baseUrl}/x', code],
        ['a.swift:1', '"https://s.example.com/\\(id)"', host('s.example.com')],
        ['a.swift:2', '"https://\\(host)/x"', code],
        ['a.swift:3', '"https://t.example.com/x"', host('t.example.com')],
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  // The engine prints a non-UTF-8 byte as U+FFFD in `lines` but counts columns in the file's bytes, so a
  // slice on that line would be shifted; it gets no source, and a line without one keeps it (#12882).
  it('gives no source on a line of a Latin-1 file that holds a non-UTF-8 byte', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'lexcode-real-'));
    try {
      await writeFile(
        join(dir, 'l.py'),
        Buffer.concat([Buffer.from('x = "caf'), Buffer.from([0xe9]), Buffer.from('"; fetchit(f"https://p.example.com/{id}")\nfetchit(f"https://q.example.com/{id}")\n')]),
      );
      await writeFile(join(dir, 'rule.yml'), ['rules:', '  - id: t.py', '    languages: [python]', '    severity: INFO', '    message: m', '    pattern: fetchit($URL)', ''].join('\n'));
      const r = await runEngine({ engine: engine!, configFile: join(dir, 'rule.yml'), targets: ['l.py'], root: dir });
      expect(r.matches.map((m) => [m.line, m.source?.$URL])).toEqual([
        [1, undefined],
        [2, 'f"https://q.example.com/{id}"'],
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('still applies a rule path exclude to the repository-relative path when the repository lives under a directory named examples', async () => {
    const outer = await mkdtemp(join(tmpdir(), 'lexcode-real-'));
    try {
      const root = join(outer, 'examples', 'app');
      await mkdir(join(root, 'examples'), { recursive: true });
      await writeFile(join(root, 'app.py'), 'import requests\nrequests.get("https://example.com")\n');
      await writeFile(join(root, 'examples', 'demo.py'), 'import requests\nrequests.get("https://example.com")\n');
      await writeFile(
        join(outer, 'rule.yml'),
        [
          'rules:',
          '  - id: lexcode.test.requests-get',
          '    languages: [python]',
          '    severity: INFO',
          '    message: an HTTP GET',
          '    pattern: requests.get($URL)',
          '    paths:',
          '      exclude:',
          '        - "**/examples/**"',
          '',
        ].join('\n'),
      );
      const r = await runEngine({ engine: engine!, configFile: join(outer, 'rule.yml'), targets: ['app.py', 'examples/demo.py'], root });
      expect(r.matches.map((m) => m.path)).toEqual(['app.py']);
    } finally {
      await rm(outer, { recursive: true, force: true });
    }
  });

  it('writes nothing outside lexcode\'s own directories: no rule-set copy in the temporary directory, nothing in HOME', async () => {
    const outer = await mkdtemp(join(tmpdir(), 'lexcode-real-'));
    const saved = { TMPDIR: process.env.TMPDIR, TMP: process.env.TMP, TEMP: process.env.TEMP, HOME: process.env.HOME };
    try {
      const fakeTmp = join(outer, 'tmp');
      const fakeHome = join(outer, 'home');
      const root = join(outer, 'repo');
      const own = { tempRoot: join(outer, 'own-tmp'), cacheRoot: join(outer, 'own-cache') };
      for (const d of [fakeTmp, fakeHome, root, own.tempRoot]) await mkdir(d);
      await writeFile(join(root, 'app.py'), 'import requests\nrequests.get("https://example.com")\n');
      await writeFile(
        join(outer, 'rule.yml'),
        ['rules:', '  - id: lexcode.test.requests-get', '    languages: [python]', '    severity: INFO', '    message: an HTTP GET', '    pattern: requests.get($URL)', ''].join('\n'),
      );
      // The engine inherits these; if lexcode did not override them, its files would land here.
      Object.assign(process.env, { TMPDIR: fakeTmp, TMP: fakeTmp, TEMP: fakeTmp, HOME: fakeHome });
      const r = await runEngine({ engine: engine!, configFile: join(outer, 'rule.yml'), targets: ['app.py'], root, dirs: own });
      expect(r.matches).toHaveLength(1);
      expect(await readdir(fakeTmp)).toEqual([]);
      expect(await readdir(fakeHome)).toEqual([]);
      expect(await readdir(own.tempRoot)).toEqual([]); // its per-run directory, with the scratch files and the log, is gone
      expect(await readdir(join(own.cacheRoot, 'engine-home'))).toEqual(['opengrep']); // the extraction went to lexcode's cache
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
      await rm(outer, { recursive: true, force: true });
    }
  }, 120_000);
});

