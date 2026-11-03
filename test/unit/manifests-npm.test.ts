import { describe, expect, it } from 'vitest';
import { readNpm } from '../../src/manifests/npm.js';
import { lineOf, tree } from './helpers.js';

const pkg = (deps: Record<string, string>, extra: Record<string, unknown> = {}) =>
  JSON.stringify({ name: 'app', version: '1.0.0', ...extra, dependencies: deps }, null, 2) + '\n';

describe('readNpm', () => {
  it('reads a direct dependency with its line and the version a v3 lockfile resolves', () => {
    const manifest = JSON.stringify(
      {
        name: 'app',
        version: '1.0.0',
        scripts: { build: 'tsc', test: 'vitest' },
        dependencies: { 'left-pad': '^1.3.0', '@segment/analytics-next': '^1.77.0' },
      },
      null,
      2,
    );
    const lock = JSON.stringify({
      lockfileVersion: 3,
      packages: {
        '': { name: 'app' },
        'node_modules/@segment/analytics-next': { version: '1.77.0' },
      },
    });
    const root = tree({ 'package.json': manifest, 'package-lock.json': lock });
    const r = readNpm(root, ['package.json']);
    const dep = r.deps.find((d) => d.name === '@segment/analytics-next');
    expect(dep).toEqual({
      ecosystem: 'npm',
      name: '@segment/analytics-next',
      version: '1.77.0',
      manifest: `package.json:${lineOf(manifest, '"@segment/analytics-next"')}`,
    });
    expect(r.notices).toEqual([]);
  });

  it('records a dependency missing from the lockfile with no version', () => {
    const root = tree({
      'package.json': pkg({ 'left-pad': '^1.3.0' }),
      'package-lock.json': JSON.stringify({ lockfileVersion: 3, packages: { '': {} } }),
    });
    const r = readNpm(root, ['package.json']);
    expect(r.deps).toHaveLength(1);
    expect(r.deps[0]?.version).toBeUndefined();
  });

  it('records a dependency with no version when there is no lockfile at all', () => {
    const root = tree({ 'package.json': pkg({ 'left-pad': '^1.3.0' }) });
    expect(readNpm(root, ['package.json']).deps[0]?.version).toBeUndefined();
  });

  it('falls back to lockfile v1 dependencies', () => {
    const root = tree({
      'package.json': pkg({ 'left-pad': '^1.3.0' }),
      'package-lock.json': JSON.stringify({ lockfileVersion: 1, dependencies: { 'left-pad': { version: '1.3.1' } } }),
    });
    expect(readNpm(root, ['package.json']).deps[0]?.version).toBe('1.3.1');
  });

  it('resolves a workspace manifest from the root lockfile, nested path first', () => {
    const root = tree({
      'package.json': JSON.stringify({ name: 'root', workspaces: ['apps/*'] }),
      'apps/web/package.json': pkg({ react: '^18.0.0', zod: '^3.0.0' }),
      'package-lock.json': JSON.stringify({
        lockfileVersion: 3,
        packages: {
          '': {},
          'node_modules/react': { version: '18.2.0' },
          'apps/web/node_modules/react': { version: '18.3.1' },
          'node_modules/zod': { version: '3.23.8' },
        },
      }),
    });
    const r = readNpm(root, ['package.json', 'apps/web/package.json']);
    const web = r.deps.filter((d) => d.manifest.startsWith('apps/web/package.json:'));
    expect(web.find((d) => d.name === 'react')?.version).toBe('18.3.1');
    expect(web.find((d) => d.name === 'zod')?.version).toBe('3.23.8');
  });

  it('counts devDependencies as skipped and does not return them', () => {
    const root = tree({
      'package.json': pkg({ react: '^18.0.0' }, { devDependencies: { vitest: '^1.0.0', typescript: '^5.0.0' } }),
    });
    const r = readNpm(root, ['package.json']);
    expect(r.deps.map((d) => d.name)).toEqual(['react']);
    expect(r.devSkipped).toBe(2);
  });

  it('reads optionalDependencies and peerDependencies once each', () => {
    const root = tree({
      'package.json': pkg(
        { react: '^18.0.0' },
        { optionalDependencies: { fsevents: '^2.0.0' }, peerDependencies: { react: '>=17', zod: '^3' } },
      ),
    });
    const names = readNpm(root, ['package.json']).deps.map((d) => d.name).sort();
    expect(names).toEqual(['fsevents', 'react', 'zod']);
  });

  it('resolves from pnpm-lock.yaml v9 importers and strips a peer suffix', () => {
    const root = tree({
      'package.json': pkg({ react: '^18.0.0', 'react-dom': '^18.0.0' }),
      'apps/web/package.json': pkg({ zod: '^3.0.0' }),
      'pnpm-lock.yaml': [
        "lockfileVersion: '9.0'",
        'importers:',
        '  .:',
        '    dependencies:',
        '      react:',
        '        specifier: ^18.0.0',
        '        version: 18.3.1',
        '      react-dom:',
        '        specifier: ^18.0.0',
        '        version: 18.3.1(react@18.3.1)',
        '  apps/web:',
        '    dependencies:',
        '      zod:',
        '        specifier: ^3.0.0',
        '        version: 3.23.8',
        '',
      ].join('\n'),
    });
    const r = readNpm(root, ['package.json', 'apps/web/package.json']);
    expect(r.deps.find((d) => d.name === 'react')?.version).toBe('18.3.1');
    expect(r.deps.find((d) => d.name === 'react-dom')?.version).toBe('18.3.1');
    expect(r.deps.find((d) => d.name === 'zod')?.version).toBe('3.23.8');
  });

  it('resolves from a yarn.lock v1 by matching the range string', () => {
    const root = tree({
      'package.json': pkg({ react: '^18.0.0', '@scope/pkg': '~2.1.0' }),
      'yarn.lock': [
        '# yarn lockfile v1',
        '',
        '"@scope/pkg@~2.1.0", "@scope/pkg@~2.1.3":',
        '  version "2.1.5"',
        '  resolved "https://registry.yarnpkg.com/x"',
        '',
        'react@^17.0.0:',
        '  version "17.0.2"',
        '',
        'react@^18.0.0:',
        '  version "18.3.1"',
        '',
      ].join('\n'),
    });
    const r = readNpm(root, ['package.json']);
    expect(r.deps.find((d) => d.name === 'react')?.version).toBe('18.3.1');
    expect(r.deps.find((d) => d.name === '@scope/pkg')?.version).toBe('2.1.5');
  });

  it('resolves from a yarn berry lockfile', () => {
    const root = tree({
      'package.json': pkg({ react: '^18.0.0', '@scope/pkg': '~2.1.0' }),
      'yarn.lock': [
        '__metadata:',
        '  version: 8',
        '',
        '"@scope/pkg@npm:~2.1.0, @scope/pkg@npm:~2.1.3":',
        '  version: 2.1.5',
        '  resolution: "@scope/pkg@npm:2.1.5"',
        '',
        '"react@npm:^18.0.0":',
        '  version: 18.3.1',
        '',
      ].join('\n'),
    });
    const r = readNpm(root, ['package.json']);
    expect(r.deps.find((d) => d.name === 'react')?.version).toBe('18.3.1');
    expect(r.deps.find((d) => d.name === '@scope/pkg')?.version).toBe('2.1.5');
  });

  it('skips a manifest that does not parse and returns a notice', () => {
    const root = tree({ 'package.json': '{ not json', 'ok/package.json': pkg({ react: '^18.0.0' }) });
    const r = readNpm(root, ['package.json', 'ok/package.json']);
    expect(r.deps.map((d) => d.name)).toEqual(['react']);
    expect(r.notices).toHaveLength(1);
    expect(r.notices[0]).toContain('package.json');
  });

  it('ignores a malformed lockfile and keeps the dependency unresolved', () => {
    const root = tree({ 'package.json': pkg({ react: '^18.0.0' }), 'package-lock.json': '{ nope' });
    const r = readNpm(root, ['package.json']);
    expect(r.deps[0]?.version).toBeUndefined();
    expect(r.notices.join(' ')).toContain('package-lock.json');
  });

  it('reads only manifests that are in the list', () => {
    const root = tree({ 'package.json': pkg({ react: '^18.0.0' }), 'other/package.json': pkg({ zod: '^3' }) });
    expect(readNpm(root, ['package.json']).deps.map((d) => d.name)).toEqual(['react']);
  });
});

describe('readNpm on a very large manifest', () => {
  it('reads 20,000 dependencies in under 2 seconds, each with its own line', () => {
    const deps: Record<string, string> = {};
    for (let i = 0; i < 20_000; i++) deps[`pkg-${i}`] = `^1.${i}.0`;
    const manifest = pkg(deps);
    const root = tree({ 'package.json': manifest });
    const t0 = performance.now();
    const r = readNpm(root, ['package.json']);
    const ms = performance.now() - t0;
    expect(r.deps).toHaveLength(20_000);
    const lines = manifest.split('\n');
    for (const i of [0, 1, 9_999, 19_999]) {
      const d = r.deps.find((x) => x.name === `pkg-${i}`);
      expect(d?.manifest).toBe(`package.json:${lines.findIndex((l) => l.includes(`"pkg-${i}"`)) + 1}`);
    }
    expect(ms).toBeLessThan(2000);
  });

  it('keeps the first block that holds the key when a section name repeats', () => {
    const manifest = '{\n  "overrides": {\n    "dependencies": {\n      "a": "1"\n    }\n  },\n  "dependencies": {\n    "a": "1",\n    "b": "2"\n  }\n}\n';
    const r = readNpm(tree({ 'package.json': manifest }), ['package.json']);
    expect(Object.fromEntries(r.deps.map((d) => [d.name, d.manifest]))).toEqual({ a: 'package.json:4', b: 'package.json:9' });
  });
});

describe('parse-error notices never carry source text', () => {
  const SECRET = 'ghp_NOT_QUITE_A_SECRET_0123456789';

  it('names a position and not the excerpt V8 prints, for a malformed package.json', () => {
    const root = tree({ 'package.json': `{\n  "name": "x",\n  "token": ${SECRET},\n  "dependencies": {}\n}\n` });
    const r = readNpm(root, ['package.json']);
    const notice = r.notices.join('\n');
    expect(notice).toMatch(/^package\.json: did not parse \(invalid JSON( at (line \d+(, column \d+)?|offset \d+))?\); skipped$/);
    expect(notice).not.toContain(SECRET);
    expect(notice).not.toContain('ghp_');
  });

  it('does the same for a malformed package-lock.json and a malformed pnpm-lock.yaml', () => {
    const pkgJson = '{ "name": "x", "dependencies": { "left-pad": "^1.0.0" } }';
    const a = readNpm(tree({ 'package.json': pkgJson, 'package-lock.json': `{"token": ${SECRET}}` }), ['package.json']);
    expect(a.notices.join('\n')).toMatch(/package-lock\.json: did not parse \(invalid JSON/);
    expect(a.notices.join('\n')).not.toContain('ghp_');
    const b = readNpm(tree({ 'package.json': pkgJson, 'pnpm-lock.yaml': `token: ${SECRET}\n  bad: [x\n` }), ['package.json']);
    expect(b.notices.join('\n')).toMatch(/pnpm-lock\.yaml: did not parse \(invalid YAML/);
    expect(b.notices.join('\n')).not.toContain('ghp_');
  });
});

