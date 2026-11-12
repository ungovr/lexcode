import { describe, expect, it } from 'vitest';
import { readComposer } from '../../src/manifests/composer.js';
import { lineOf, tree } from './helpers.js';

function json(o: unknown): string {
  return JSON.stringify(o, null, 4) + '\n';
}

function lock(packages: Record<string, string>, dev: Record<string, string> = {}): string {
  return json({
    _readme: ['This file locks the dependencies of your project to a known state'],
    'content-hash': '0123456789abcdef',
    packages: Object.entries(packages).map(([name, version]) => ({ name, version, type: 'library' })),
    'packages-dev': Object.entries(dev).map(([name, version]) => ({ name, version, type: 'library' })),
    'minimum-stability': 'stable',
  });
}

const UNLOCKED = (n: number): string =>
  `${n} Composer ${n === 1 ? 'dependency has' : 'dependencies have'} no locked version (no composer.lock beside composer.json, or a name it does not list); recorded without a version`;

describe('readComposer', () => {
  it('reads require with the locked version', () => {
    const manifest = json({ name: 'acme/app', require: { php: '^8.2', 'ext-gd': '*', 'twilio/sdk': '^8.0' } });
    const root = tree({ 'composer.json': manifest, 'composer.lock': lock({ 'twilio/sdk': '8.3.1' }) });
    const r = readComposer(root, ['composer.json', 'composer.lock']);
    expect(r.deps).toEqual([
      { ecosystem: 'composer', name: 'twilio/sdk', version: '8.3.1', manifest: `composer.json:${lineOf(manifest, '"twilio/sdk"')}` },
    ]);
    expect(r.devSkipped).toBe(0);
    expect(r.notices).toEqual([]);
  });

  it('skips require-dev and counts it', () => {
    const manifest = json({
      require: { 'guzzlehttp/guzzle': '^7.8' },
      'require-dev': { 'phpunit/phpunit': '^11.0', 'mockery/mockery': '^1.6' },
    });
    const root = tree({
      'composer.json': manifest,
      'composer.lock': lock({ 'guzzlehttp/guzzle': '7.8.1' }, { 'phpunit/phpunit': '11.0.3', 'mockery/mockery': '1.6.7' }),
    });
    const r = readComposer(root, ['composer.json']);
    expect(r.deps.map((d) => d.name)).toEqual(['guzzlehttp/guzzle']);
    expect(r.devSkipped).toBe(2);
    expect(r.notices).toEqual([]);
  });

  it('platform names are neither returned nor counted', () => {
    const platform = {
      php: '^8.2',
      'php-64bit': '*',
      'php-ipv6': '*',
      'php-zts': '*',
      'php-debug': '*',
      hhvm: '*',
      composer: '^2.6',
      'ext-gd': '*',
      'EXT-Intl': '*',
      'lib-icu': '>=60',
      'composer-plugin-api': '^2.0',
      'composer-runtime-api': '^2.2',
    };
    const root = tree({
      'composer.json': json({ require: platform, 'require-dev': { php: '^8.3', 'ext-xdebug': '*', 'lib-curl': '*' } }),
      'composer.lock': lock({}),
    });
    const r = readComposer(root, ['composer.json']);
    expect(r.deps).toEqual([]);
    expect(r.devSkipped).toBe(0);
    expect(r.notices).toEqual([]);
  });

  it('one notice for unlocked dependencies', () => {
    const manifest = json({
      require: { php: '^8.2', 'laravel/framework': '^11.0', 'livewire/livewire': '^3.4', 'stripe/stripe-php': '^13.0' },
      'require-dev': { 'phpunit/phpunit': '^11.0' },
    });
    const root = tree({ 'composer.json': manifest });
    const r = readComposer(root, ['composer.json']);
    expect(r.deps).toEqual([
      { ecosystem: 'composer', name: 'laravel/framework', manifest: `composer.json:${lineOf(manifest, '"laravel/framework"')}` },
      { ecosystem: 'composer', name: 'livewire/livewire', manifest: `composer.json:${lineOf(manifest, '"livewire/livewire"')}` },
      { ecosystem: 'composer', name: 'stripe/stripe-php', manifest: `composer.json:${lineOf(manifest, '"stripe/stripe-php"')}` },
    ]);
    expect(r.devSkipped).toBe(1);
    expect(r.notices).toEqual([
      '3 Composer dependencies have no locked version (no composer.lock beside composer.json, or a name it does not list); recorded without a version',
    ]);
  });

  it('a name missing from the lock counts in the same notice', () => {
    const root = tree({
      'composer.json': json({ require: { 'symfony/console': '^7.1', 'acme/missing': '^1.0' } }),
      'composer.lock': lock({ 'symfony/console': 'v7.1.0' }),
      'other/composer.json': json({ require: { 'acme/also-unlocked': '^2.0' } }),
    });
    const r = readComposer(root, ['composer.json', 'other/composer.json']);
    expect(r.deps.map((d) => [d.name, d.version])).toEqual([
      ['symfony/console', 'v7.1.0'],
      ['acme/missing', undefined],
      ['acme/also-unlocked', undefined],
    ]);
    expect(r.deps[1]).not.toHaveProperty('version');
    expect(r.notices).toEqual([UNLOCKED(2)]);
  });

  it('a single unlocked dependency reads in the singular', () => {
    const root = tree({ 'composer.json': json({ require: { 'acme/one': '^1.0' } }) });
    expect(readComposer(root, ['composer.json']).notices).toEqual([UNLOCKED(1)]);
  });

  it('the lock version is kept as written', () => {
    const root = tree({
      'composer.json': json({ require: { 'symfony/http-kernel': '^7.1', 'doctrine/orm': '^3.2' } }),
      'composer.lock': lock({ 'symfony/http-kernel': 'v7.1.0', 'doctrine/orm': '3.2.1' }),
    });
    const r = readComposer(root, ['composer.json']);
    expect(r.deps.map((d) => d.version)).toEqual(['v7.1.0', '3.2.1']);
  });

  it('a constraint in composer.json is never a version', () => {
    const root = tree({ 'composer.json': json({ require: { 'twig/twig': '3.10.3' } }) });
    const r = readComposer(root, ['composer.json']);
    expect(r.deps).toEqual([{ ecosystem: 'composer', name: 'twig/twig', manifest: 'composer.json:3' }]);
  });

  it('names match the lock case-insensitively and are lowercased', () => {
    const manifest = json({ require: { 'Twilio/SDK': '^8.0', 'aws/aws-sdk-php': '^3.300' } });
    const root = tree({ 'composer.json': manifest, 'composer.lock': lock({ 'twilio/sdk': '8.3.1', 'AWS/AWS-SDK-PHP': '3.300.0' }) });
    const r = readComposer(root, ['composer.json']);
    expect(r.deps).toEqual([
      { ecosystem: 'composer', name: 'twilio/sdk', version: '8.3.1', manifest: `composer.json:${lineOf(manifest, '"Twilio/SDK"')}` },
      { ecosystem: 'composer', name: 'aws/aws-sdk-php', version: '3.300.0', manifest: `composer.json:${lineOf(manifest, '"aws/aws-sdk-php"')}` },
    ]);
    expect(r.notices).toEqual([]);
  });

  it('a vendor-bin composer.json is tooling', () => {
    const root = tree({
      'composer.json': json({ require: { 'twig/twig': '^3.10' } }),
      'composer.lock': lock({ 'twig/twig': 'v3.10.3' }),
      'vendor-bin/phpstan/composer.json': json({ require: { php: '^8.2', 'phpstan/phpstan': '^1.11' } }),
      'vendor-bin/phpstan/composer.lock': lock({ 'phpstan/phpstan': '1.11.5' }),
    });
    const r = readComposer(root, ['composer.json', 'vendor-bin/phpstan/composer.json']);
    expect(r.deps.map((d) => d.name)).toEqual(['twig/twig']);
    expect(r.devSkipped).toBe(1);
    expect(r.notices).toEqual([]);
  });

  it('a nested vendor-bin directory is tooling too, and a name that only contains vendor-bin is not', () => {
    const root = tree({
      'tools/vendor-bin/cs/composer.json': json({ require: { 'friendsofphp/php-cs-fixer': '^3.0' }, 'require-dev': { 'acme/x': '^1' } }),
      'my-vendor-bin/composer.json': json({ require: { 'acme/real': '^1.0' } }),
    });
    const r = readComposer(root, ['tools/vendor-bin/cs/composer.json', 'my-vendor-bin/composer.json']);
    expect(r.deps.map((d) => d.name)).toEqual(['acme/real']);
    expect(r.devSkipped).toBe(2);
    expect(r.notices).toEqual([UNLOCKED(1)]);
  });

  it('reads every composer.json in scope', () => {
    const rootManifest = json({ require: { 'symfony/framework-bundle': '^7.1' } });
    const apiManifest = json({ name: 'acme/api', require: { 'symfony/framework-bundle': '^6.4', 'aws/aws-sdk-php': '^3.300' } });
    const root = tree({
      'composer.json': rootManifest,
      'composer.lock': lock({ 'symfony/framework-bundle': 'v7.1.2' }),
      'packages/api/composer.json': apiManifest,
      'packages/api/composer.lock': lock({ 'symfony/framework-bundle': 'v6.4.9', 'aws/aws-sdk-php': '3.300.0' }),
      'README.md': '# not a manifest\n',
    });
    const r = readComposer(root, ['README.md', 'composer.json', 'composer.lock', 'packages/api/composer.json', 'packages/api/composer.lock']);
    expect(r.deps).toEqual([
      { ecosystem: 'composer', name: 'symfony/framework-bundle', version: 'v7.1.2', manifest: 'composer.json:3' },
      {
        ecosystem: 'composer',
        name: 'symfony/framework-bundle',
        version: 'v6.4.9',
        manifest: `packages/api/composer.json:${lineOf(apiManifest, '"symfony/framework-bundle"')}`,
      },
      { ecosystem: 'composer', name: 'aws/aws-sdk-php', version: '3.300.0', manifest: `packages/api/composer.json:${lineOf(apiManifest, '"aws/aws-sdk-php"')}` },
    ]);
    expect(r.notices).toEqual([]);
  });

  it('the line is the key inside require, not the same name elsewhere', () => {
    const manifest = json({
      'require-dev': { 'twilio/sdk': '^8.0' },
      suggest: { 'twilio/sdk': 'for SMS' },
      require: { 'twilio/sdk': '^8.0' },
    });
    const root = tree({ 'composer.json': manifest, 'composer.lock': lock({ 'twilio/sdk': '8.3.1' }) });
    const r = readComposer(root, ['composer.json']);
    const lines = manifest.split('\n');
    const want = lines.findIndex((l, i) => l.includes('"twilio/sdk"') && lines.slice(0, i).some((p) => p.includes('"require": {'))) + 1;
    expect(r.deps).toEqual([{ ecosystem: 'composer', name: 'twilio/sdk', version: '8.3.1', manifest: `composer.json:${want}` }]);
    expect(r.devSkipped).toBe(0);
  });

  it('a composer.json that does not parse is a notice, not a throw', () => {
    const root = tree({
      'composer.json': '{\n    "require": {\n        "twilio/sdk": "^8.0",\n    }\n',
      'packages/ok/composer.json': json({ require: { 'acme/ok': '^1.0' } }),
      'packages/list/composer.json': '[1, 2]\n',
    });
    const r = readComposer(root, ['composer.json', 'packages/ok/composer.json', 'packages/list/composer.json']);
    expect(r.deps.map((d) => d.name)).toEqual(['acme/ok']);
    expect(r.notices).toHaveLength(3);
    expect(r.notices[0]).toMatch(/^composer\.json: did not parse \(invalid JSON(?: at [^)]*)?\); skipped$/);
    expect(r.notices).toContain('packages/list/composer.json: is not a JSON object; skipped');
    expect(r.notices).toContain(UNLOCKED(1));
  });

  it('a composer.lock that does not parse is a notice naming it, and its rows carry no version', () => {
    const root = tree({
      'composer.json': json({ require: { 'twilio/sdk': '^8.0', 'aws/aws-sdk-php': '^3.300' } }),
      'composer.lock': '{\n    "packages": [\n',
    });
    const r = readComposer(root, ['composer.json']);
    expect(r.deps.map((d) => [d.name, d.version])).toEqual([
      ['twilio/sdk', undefined],
      ['aws/aws-sdk-php', undefined],
    ]);
    expect(r.notices).toHaveLength(1);
    expect(r.notices[0]).toMatch(/^composer\.lock: did not parse \(invalid JSON(?: at [^)]*)?\); versions from it are unavailable$/);
  });

  it('a lock that is not a JSON object is a notice, and its rows carry no version', () => {
    const root = tree({ 'composer.json': json({ require: { 'twilio/sdk': '^8.0' } }), 'composer.lock': '"x"\n' });
    const r = readComposer(root, ['composer.json']);
    expect(r.deps).toEqual([{ ecosystem: 'composer', name: 'twilio/sdk', manifest: 'composer.json:3' }]);
    expect(r.notices).toEqual(['composer.lock: is not a JSON object; versions from it are unavailable']);
  });

  it('only the lock beside the composer.json is read, never one above it', () => {
    const root = tree({
      'composer.lock': lock({ 'acme/lib': '1.0.0' }),
      'packages/lib/composer.json': json({ require: { 'acme/lib': '^1.0' } }),
    });
    const r = readComposer(root, ['packages/lib/composer.json']);
    expect(r.deps).toEqual([{ ecosystem: 'composer', name: 'acme/lib', manifest: 'packages/lib/composer.json:3' }]);
    expect(r.notices).toEqual([UNLOCKED(1)]);
  });

  it('a composer.json with no require gives nothing and no notice', () => {
    const root = tree({ 'composer.json': json({ name: 'acme/empty', require: [] }) });
    const r = readComposer(root, ['composer.json']);
    expect(r).toEqual({ deps: [], devSkipped: 0, notices: [] });
  });
});
