import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { scan } from '../../src/commands/scan.js';
import { loadRuleSet } from '../../src/rules/load.js';
import type { RuleSet } from '../../src/types.js';
import { makeRuleSet } from '../helpers/ruleset.js';
import { tree } from './helpers.js';

const STUB = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'stubs', 'fake-opengrep.mjs');

const VUE = ['<template>', '  <p>hi</p>', '</template>', '<script setup lang="ts">', 'const a = 1;', '</script>', ''].join('\n');

/** A rule set with exactly one real rule file on disk, whose id the stub engine echoes back. */
function stubRuleSet(languages = 'python, typescript'): RuleSet {
  const dir = tree({
    'processes_voice/stub.yml': [
      'rules:',
      '  - id: lexcode.test.rule',
      `    languages: [${languages}]`,
      '    severity: INFO',
      '    message: stub',
      '    pattern: f(...)',
      '    metadata:',
      '      activity: processes_voice',
      '      mentioned: performs',
      '      definition: https://lexlint.io/activities/processes_voice',
      '',
    ].join('\n'),
  });
  const real = loadRuleSet([dir]);
  const base = makeRuleSet();
  return { ...base, rules: real.rules.filter((r) => r.id === 'lexcode.test.rule'), components: [] };
}

/** A rule set with one real rule over Python, with a whole-file lookahead pre-filter or without one. */
function prefilterRuleSet(prefilter: boolean): RuleSet {
  const dir = tree({
    'processes_voice/stub.yml': [
      'rules:',
      '  - id: lexcode.test.rule',
      '    languages: [python]',
      '    severity: INFO',
      '    message: stub',
      '    patterns:',
      ...(prefilter ? ["      - pattern-regex: '(?s)\\A(?=.*speak).*'"] : []),
      '      - pattern: f(...)',
      '    metadata:',
      '      activity: processes_voice',
      '      mentioned: performs',
      '      definition: https://lexlint.io/activities/processes_voice',
      '',
    ].join('\n'),
  });
  const real = loadRuleSet([dir]);
  const base = makeRuleSet();
  return { ...base, rules: real.rules.filter((r) => r.id === 'lexcode.test.rule'), components: [] };
}

/** Python of about `bytes` bytes, in short lines. */
function pythonOf(bytes: number): string {
  const line = 'x = 1  # filler\n';
  return line.repeat(Math.ceil(bytes / line.length));
}

let argvLog: string;
beforeEach(() => {
  argvLog = join(tree({ 'keep.txt': '' }), 'argv.jsonl');
  process.env.FAKE_OPENGREP_ARGV_LOG = argvLog;
});
afterEach(() => {
  delete process.env.FAKE_OPENGREP_ARGV_LOG;
});

describe('scan with a stand-in engine', () => {
  it('maps a match in an extracted script block back to the original file and line, and cleans up', async () => {
    const root = tree({ 'web/App.vue': VUE, 'src/a.py': 'x = 1\n', 'README.md': '# hi\n' });
    const rec = await scan({ root, rulesDirs: [], rs: stubRuleSet(), enginePath: STUB, includeTests: false, snippets: false });
    const wheres = rec.activities.flatMap((a) => a.evidence.map((e) => e.where));
    expect(wheres).toEqual(['src/a.py:3', 'web/App.vue:3']);
    expect(rec.scope.extracted).toBe(1);
    expect(rec.scope.files).toBe(3);
    // Only files a rule can read go to the engine: the Markdown file does not.
    const runs = readFileSync(argvLog, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { options: Record<string, string>; targets: string[] });
    expect(runs).toHaveLength(1);
    const targets = (runs[0] as (typeof runs)[number]).targets;
    expect(targets).toContain('scan-root/src/a.py');
    expect(targets.some((t) => t.endsWith('App.vue.lexcode.ts'))).toBe(true);
    expect(targets).not.toContain('scan-root/README.md');
    // The merged config and the extracted blocks live in a temp directory that is gone afterwards.
    expect(existsSync((runs[0] as (typeof runs)[number]).options['--config'] as string)).toBe(false);
    expect(existsSync(targets.find((t) => t.endsWith('.lexcode.ts')) as string)).toBe(false);
  });

  it.skipIf(process.platform === 'win32')('runs the engine the user named, not a same-named file in the repository, and not from inside the repository', async () => {
    const sh = (target: string, extra = ''): string => `#!/bin/sh\n${extra}exec node '${STUB}' "$@"\n`;
    const shell = tree({ 'og': sh(STUB) });
    const root = tree({ 'src/a.py': 'x = 1\n', 'og': sh(STUB, `echo ran >> '${join(shell, 'REPO_ENGINE_RAN')}'\n`) });
    chmodSync(join(shell, 'og'), 0o755);
    chmodSync(join(root, 'og'), 0o755);
    const was = process.cwd();
    process.chdir(shell);
    try {
      await scan({ root, rulesDirs: [], rs: stubRuleSet(), enginePath: './og', includeTests: false, snippets: false });
    } finally {
      process.chdir(was);
    }
    expect(existsSync(join(shell, 'REPO_ENGINE_RAN'))).toBe(false);
    const runs = readFileSync(argvLog, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { cwd: string });
    expect(runs).toHaveLength(1);
    expect(runs[0]!.cwd).toContain('lexcode-engine-');
    expect(runs[0]!.cwd.startsWith(root)).toBe(false);
  });

  it('does not hand the engine a file with a line over 100,000 characters, and counts it in a notice', async () => {
    const root = tree({
      'src/a.py': 'x = 1\n',
      'gen/long.py': `x = "${'a'.repeat(100_001)}"\n`,
      'gen/limit.py': `${'a'.repeat(100_000)}\n`,
      'gen/multibyte.py': `# ${'\u00e9'.repeat(60_000)}\n`,
      'web/gen.vue': `<script lang="ts">const s = "${'b'.repeat(100_001)}"</script>\n`,
    });
    const rec = await scan({ root, rulesDirs: [], rs: stubRuleSet(), enginePath: STUB, includeTests: false, snippets: false });
    const runs = readFileSync(argvLog, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { targets: string[] });
    const targets = runs.flatMap((r) => r.targets);
    expect(targets).toContain('scan-root/src/a.py');
    expect(targets).toContain('scan-root/gen/limit.py');
    expect(targets).toContain('scan-root/gen/multibyte.py'); // 60,000 characters, 120,000 bytes
    expect(targets).not.toContain('scan-root/gen/long.py');
    expect(targets.some((t) => t.includes('gen.vue'))).toBe(false);
    expect(rec.notices).toContain('skipped 2 files with a line over 100,000 characters (generated or minified code); the engine did not read them');
  });

  it('reports the engine version the engine reports', async () => {
    const root = tree({ 'src/a.py': 'x = 1\n' });
    process.env.FAKE_OPENGREP_VERSION = '1.40.0';
    try {
      const rec = await scan({ root, rulesDirs: [], rs: stubRuleSet(), enginePath: STUB, includeTests: false, snippets: false });
      expect(rec.engine.version).toBe('1.40.0');
      expect(rec.notices.join('\n')).toMatch(/engine is 1\.40\.0, not the pinned 1\.33\.1/);
    } finally {
      delete process.env.FAKE_OPENGREP_VERSION;
    }
  });

  it('counts engine per-file trouble in a notice and still succeeds', async () => {
    const root = tree({ 'src/a.py': 'x = 1\n' });
    process.env.FAKE_OPENGREP_MODE = 'errors';
    try {
      const rec = await scan({ root, rulesDirs: [], rs: stubRuleSet(), enginePath: STUB, includeTests: false, snippets: false });
      expect(rec.notices.join('\n')).toMatch(/could not read \d+ files?/);
    } finally {
      delete process.env.FAKE_OPENGREP_MODE;
    }
  });

  it('fails with exit-2 error text when the engine fails', async () => {
    const root = tree({ 'src/a.py': 'x = 1\n' });
    process.env.FAKE_OPENGREP_MODE = 'exit2';
    try {
      await expect(scan({ root, rulesDirs: [], rs: stubRuleSet(), enginePath: STUB, includeTests: false, snippets: false })).rejects.toThrow(/last stderr line/);
    } finally {
      delete process.env.FAKE_OPENGREP_MODE;
    }
  });

  it('maps a match in a whole-file .lexcode.php copy back to the original, also when the engine names the copy by another path', async () => {
    const root = tree({ 'modules/m/m.module': '<?php\n\nf();\n', 'lib/x.inc': '<?php\n\nf();\n' });
    // The engine may report a copy under a path that is not the one lexcode passed (a temp directory
    // behind a symbolic link): the tail after the temp directory still names the original.
    const result = (p: string) => ({ check_id: 'lexcode.test.rule', path: p, start: { line: 3, col: 1 }, end: { line: 3, col: 4 }, extra: { message: 'm', metadata: {}, lines: 'f();' } });
    process.env.FAKE_OPENGREP_RESULTS = JSON.stringify([
      result('/elsewhere/lexcode-scan-x/scripts/modules/m/m.module.lexcode.php'),
      result('/elsewhere/lexcode-scan-x/scripts/lib/x.inc.lexcode.php'),
    ]);
    try {
      const rec = await scan({ root, rulesDirs: [], rs: stubRuleSet('php'), enginePath: STUB, includeTests: false, snippets: false });
      const wheres = rec.activities.flatMap((a) => a.evidence.map((e) => e.where)).sort();
      expect(wheres).toEqual(['lib/x.inc:3', 'modules/m/m.module:3']);
      expect(rec.scope.extracted).toBe(2);
    } finally {
      delete process.env.FAKE_OPENGREP_RESULTS;
    }
  });

  it('does not count a PHP rule as run over a Pascal .inc, and says nothing was looked at', async () => {
    const root = tree({ 'src/defs.inc': '{ Pascal include }\nconst\n  MaxItems = 100;\n', 'README.md': '# hi\n' });
    process.env.FAKE_OPENGREP_RESULTS = '[]';
    try {
      const rec = await scan({ root, rulesDirs: [], rs: stubRuleSet('php'), enginePath: STUB, includeTests: false, snippets: false });
      expect(rec.scope.extracted).toBe(0);
      expect(rec.searched_not_found.map((r) => r.id)).not.toContain('processes_voice');
      expect(rec.notices.some((n) => n.startsWith('no file in scope is in a language lexcode reads') && n.includes('nothing was looked at'))).toBe(true);
    } finally {
      delete process.env.FAKE_OPENGREP_RESULTS;
    }
  });
});

describe('scan without source rules', () => {
  function noRules(): RuleSet {
    const rs = makeRuleSet();
    rs.rules = [];
    rs.components = [
      { ecosystem: 'npm', match: 'left-pad', enables: ['tracks_devices'], says: 'pads', source: 'https://example.org' },
      { ecosystem: 'pypi', match: 'nothing', enables: ['trains_models'], says: 'x', source: 'https://example.org' },
    ];
    return rs;
  }
  const manifests = {
    'package.json': '{\n  "dependencies": {\n    "left-pad": "^1.3.0"\n  },\n  "devDependencies": { "vitest": "1" }\n}\n',
    'package-lock.json': '{"lockfileVersion":3,"packages":{"node_modules/left-pad":{"version":"1.3.0"}}}',
    'requirements.txt': 'other==1.0\n',
  };

  it('needs no engine, reads the manifests, and says that no source rules ran', async () => {
    const root = tree(manifests);
    const rec = await scan({ root, rulesDirs: [], rs: noRules(), enginePath: '/nonexistent/engine', includeTests: false, snippets: false });
    expect(rec.engine.version).toBe('1.33.1');
    expect(rec.activities).toEqual([
      {
        id: 'tracks_devices',
        mentioned: 'enables',
        evidence: [{ rule: 'lexcode.manifest.npm', where: 'package.json:3', component: 'pkg:npm/left-pad@1.3.0' }],
      },
    ]);
    expect(rec.components).toEqual([{ purl: 'pkg:npm/left-pad@1.3.0', manifest: 'package.json:3', enables: ['tracks_devices'] }]);
    expect(rec.scope.dev_dependencies_skipped).toBe(1);
    expect(rec.notices.join('\n')).toMatch(/no source rules/);
  });

  it('counts the map entries of an ecosystem whose manifests were found as rules tried', async () => {
    const root = tree(manifests);
    const rec = await scan({ root, rulesDirs: [], rs: noRules(), includeTests: false, snippets: false });
    // requirements.txt was found, so the PyPI entry was consulted; no Go manifest, so nothing else.
    expect(rec.searched_not_found).toEqual([{ id: 'trains_models', rules: 1 }]);
  });
});

describe('scan scope', () => {
  const files = { 'src/a.py': 'x\n', 'src/gen/b.py': 'x\n', 'lib/c.py': 'x\n', 'docs/d.py': 'x\n', 'lexcode.json': '{}', 'out/r.json': '{}' };
  const sidecar = { ignore: [], fail_on_enables: false, own_hosts: [], include: ['lib/'], exclude: ['src/gen/'] };

  it('unions the declaration scope with the sidecar include and exclude, and names what it used', async () => {
    const root = tree(files);
    const rs = makeRuleSet();
    rs.rules = [];
    const rec = await scan({
      root,
      rulesDirs: [],
      rs,
      includeTests: false,
      snippets: false,
      sidecar,
      scope: { include: ['src/'], exclude: [], includeTests: false },
    });
    expect(rec.scope).toMatchObject({ include: ['src/', 'lib/'], exclude: ['src/gen/'], include_tests: false, files: 2 });
  });

  it('never reads the record or SARIF it was told it wrote', async () => {
    const root = tree(files);
    const rs = makeRuleSet();
    rs.rules = [];
    const rec = await scan({ root, rulesDirs: [], rs, includeTests: false, snippets: false, skipFiles: ['lexcode.json', 'out/r.json'] });
    expect(rec.scope.files).toBe(4);
  });

  it('adds a notice when the directory is not in a git work tree, and none when it is', async () => {
    const rs = makeRuleSet();
    rs.rules = [];
    const plain = tree({ 'src/a.py': 'x\n', '.gitignore': '*.log\n!keep.log\n', 'b.log': 'x\n' });
    const rec = await scan({ root: plain, rulesDirs: [], rs, includeTests: false, snippets: false });
    const notice = rec.notices.find((n) => n.includes('not in a git work tree'));
    expect(notice).toBeDefined();
    expect(notice).toContain('1 .gitignore pattern');
    expect(rec.scope.files).toBe(2); // b.log is left out by the root .gitignore
    const repo = tree({ 'src/a.py': 'x\n' });
    execFileSync('git', ['init', '-q'], { cwd: repo });
    const inGit = await scan({ root: repo, rulesDirs: [], rs, includeTests: false, snippets: false });
    expect(inGit.notices.some((n) => n.includes('git work tree'))).toBe(false);
  });

  it('counts symbolic links it skipped', async () => {
    const root = tree({ 'src/a.py': 'x\n' });
    const target = join(tree({ 'secret.txt': 's' }), 'secret.txt');
    symlinkSync(target, join(root, 'link.txt'));
    writeFileSync(join(root, 'ok.py'), 'y\n');
    const rs = makeRuleSet();
    rs.rules = [];
    const rec = await scan({ root, rulesDirs: [], rs, includeTests: false, snippets: false });
    expect(rec.notices).toContain('skipped 1 symbolic link; lexcode does not follow them');
    expect(rec.scope.files).toBe(2);
  });
});

describe('what a scan could not read (#12745)', () => {
  it.skipIf(process.platform === 'win32' || process.getuid?.() === 0)(
    'skips a file it cannot open for reading, never hands it to the engine, and says so',
    async () => {
      const root = tree({ 'src/a.py': 'x = 1\n', 'state/locked.py': 'x = 2\n' });
      chmodSync(join(root, 'state', 'locked.py'), 0o000);
      const rec = await scan({ root, rulesDirs: [], rs: stubRuleSet(), enginePath: STUB, includeTests: false, snippets: false });
      const runs = readFileSync(argvLog, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { targets: string[] });
      const targets = runs.flatMap((r) => r.targets);
      expect(targets).toContain('scan-root/src/a.py');
      expect(targets).not.toContain('scan-root/state/locked.py');
      expect(rec.scope.files).toBe(1);
      expect(rec.notices).toContain('skipped 1 file lexcode cannot open for reading; its evidence is missing from this record');
    },
  );

  it('names each language it holds files in but has no rules for, with counts', async () => {
    const root = tree({
      'src/a.py': 'x = 1\n',
      'app/models/user.rb': 'class User; end\n',
      'app/models/post.rb': 'class Post; end\n',
      'lib/x.php': '<?php\n',
      'README.md': '# hi\n',
      'config/app.yml': 'a: 1\n',
    });
    const rec = await scan({ root, rulesDirs: [], rs: stubRuleSet(), enginePath: STUB, includeTests: false, snippets: false });
    expect(rec.notices).toContain(
      'not read: 2 Ruby files, 1 PHP file; lexcode has no rules for Ruby or PHP, so any evidence in them is missing from this record',
    );
  });

  it('counts the files over 1,000,000 bytes that a whole-file pre-filtered rule reads, in one notice', async () => {
    const root = tree({ 'src/a.py': 'x = 1\n', 'gen/big.py': pythonOf(1_100_000), 'gen/other.py': pythonOf(1_050_000), 'gen/big.ts': pythonOf(1_100_000) });
    const rec = await scan({ root, rulesDirs: [], rs: prefilterRuleSet(true), enginePath: STUB, includeTests: false, snippets: false });
    expect(rec.notices).toContain(
      '2 files handed to the engine are over 1,000,000 bytes (Python); rules that first check a whole file for a name ' +
        'can miss matches in a file that large, so evidence in them may be missing from this record',
    );
  });

  it('has no reach notice without a large file, or without a whole-file pre-filtered rule', async () => {
    const small = tree({ 'src/a.py': 'x = 1\n', 'gen/near.py': pythonOf(990_000) });
    const a = await scan({ root: small, rulesDirs: [], rs: prefilterRuleSet(true), enginePath: STUB, includeTests: false, snippets: false });
    expect(a.notices.filter((n) => n.includes('1,000,000 bytes'))).toEqual([]);
    const large = tree({ 'src/a.py': 'x = 1\n', 'gen/big.py': pythonOf(1_100_000) });
    const b = await scan({ root: large, rulesDirs: [], rs: prefilterRuleSet(false), enginePath: STUB, includeTests: false, snippets: false });
    expect(b.notices.filter((n) => n.includes('1,000,000 bytes'))).toEqual([]);
  });

  it('says nothing about languages when every code file is in a language its rules read', async () => {
    const root = tree({ 'src/a.py': 'x = 1\n', 'web/b.ts': 'const b = 1;\n', 'README.md': '# hi\n' });
    const rec = await scan({ root, rulesDirs: [], rs: stubRuleSet(), enginePath: STUB, includeTests: false, snippets: false });
    expect(rec.notices.some((n) => n.startsWith('not read:'))).toBe(false);
  });
});
