import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { collectDeps, runDepsCommand } from '../../src/commands/deps.js';
import { makeRuleSet } from '../helpers/ruleset.js';
import { tree } from './helpers.js';

// #12745: the component map grows by hand, so lexcode lists the packages it read and which of them
// the map gives no activity, counted across repositories, for a person to turn into entries.

const pkg = (deps: Record<string, string>, dev: Record<string, string> = {}): string =>
  `${JSON.stringify({ name: 'app', version: '1.0.0', dependencies: deps, devDependencies: dev }, null, 2)}\n`;

const rs = makeRuleSet();
rs.classes.set('processes_personal_data', 'evidence');
rs.components = [
  { ecosystem: 'npm', match: '@sentry/react', enables: ['tracks_devices', 'processes_personal_data'], says: 'a', source: 'https://example.org' },
  { ecosystem: 'pypi', match: 'Scrapy', enables: ['crawls_web'], says: 'a', source: 'https://example.org' },
];

let out: string[];
let err: string[];
const io = () => ({ stdout: (s: string) => void out.push(s), stderr: (s: string) => void err.push(s) });
beforeEach(() => {
  out = [];
  err = [];
});
afterEach(() => {
  vi.unstubAllEnvs();
});

function two(): { a: string; b: string } {
  const a = tree({
    'package.json': pkg({ '@sentry/react': '7.81.0', '@pendo/agent': '^2.278.0', lodash: '4.17.21' }, { vitest: '4.1.12' }),
    'requirements.txt': 'scrapy==2.11.0\nrequests==2.32.3\n',
  });
  const b = tree({ 'package.json': pkg({ '@pendo/agent': '2.349.0', react: '18.3.1' }) });
  return { a, b };
}

describe('collectDeps', () => {
  it('lists every production dependency once per package, with the repositories it appears in and what the map enables', () => {
    const { a, b } = two();
    const rows = collectDeps([a, b], rs);
    const byName = new Map(rows.map((r) => [`${r.ecosystem}:${r.name}`, r]));
    expect(byName.get('npm:@pendo/agent')).toMatchObject({ enables: [], repositories: [a, b] });
    expect(byName.get('npm:@sentry/react')).toMatchObject({ enables: ['processes_personal_data', 'tracks_devices'], repositories: [a] });
    expect(byName.get('pypi:scrapy')).toMatchObject({ enables: ['crawls_web'], repositories: [a] });
    expect(byName.has('npm:vitest')).toBe(false); // a dev dependency, which scan skips too
    // Most repositories first, then by ecosystem and name.
    expect(rows[0]?.name).toBe('@pendo/agent');
    expect(rows.map((r) => `${r.ecosystem}:${r.name}`).slice(1)).toEqual([
      'npm:@sentry/react',
      'npm:lodash',
      'npm:react',
      'pypi:requests',
      'pypi:scrapy',
    ]);
  });

  it('counts a package once per repository however many manifests name it', () => {
    const a = tree({ 'package.json': pkg({ lodash: '4.17.21' }), 'web/package.json': pkg({ lodash: '4.17.20' }) });
    const row = collectDeps([a], rs).find((r) => r.name === 'lodash');
    expect(row?.repositories).toEqual([a]);
    expect(row?.manifests).toHaveLength(2);
  });
});

describe('lexcode deps', () => {
  it('--unmapped --json prints only the packages the map gives no activity', async () => {
    const { a, b } = two();
    expect(await runDepsCommand([a, b, '--unmapped', '--json'], io(), { rs })).toBe(0);
    const rows = JSON.parse(out.join('')) as { name: string; enables: string[]; repositories: string[] }[];
    expect(rows.map((r) => r.name)).toEqual(['@pendo/agent', 'lodash', 'react', 'requests']);
    expect(rows.every((r) => r.enables.length === 0)).toBe(true);
  });

  it('prints a table with a summary line, and names the activities a mapped package enables', async () => {
    const { a, b } = two();
    expect(await runDepsCommand([a, b], io(), { rs })).toBe(0);
    const text = out.join('');
    expect(text).toContain('6 packages in 2 repositories; 4 with no activity in the component map');
    expect(text).toMatch(/^\s+2\s+npm\s+@pendo\/agent\s+-$/m);
    expect(text).toMatch(/^\s+1\s+npm\s+@sentry\/react\s+processes_personal_data, tracks_devices$/m);
  });

  it('reads the current directory when no path is given, and exits 2 on a path that does not exist', async () => {
    const { a } = two();
    vi.spyOn(process, 'cwd').mockReturnValue(a);
    expect(await runDepsCommand(['--json'], io(), { rs })).toBe(0);
    expect((JSON.parse(out.join('')) as unknown[]).length).toBe(5);
    await expect(runDepsCommand([`${a}/nope`], io(), { rs })).rejects.toThrow(/cannot read the repository/);
  });
});
