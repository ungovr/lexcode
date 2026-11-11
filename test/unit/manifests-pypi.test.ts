import { describe, expect, it } from 'vitest';
import { readPypi } from '../../src/manifests/pypi.js';
import { expectNearLinear, measureScaling } from '../helpers/scaling.js';
import { tree } from './helpers.js';

describe('readPypi', () => {
  it('reads a pinned requirement with its line', () => {
    const root = tree({ 'requirements.txt': '# deps\nflask\nopenai==1.51.0\n' });
    const r = readPypi(root, ['requirements.txt']);
    expect(r.deps).toContainEqual({ ecosystem: 'pypi', name: 'openai', version: '1.51.0', manifest: 'requirements.txt:3' });
    expect(r.deps).toContainEqual({ ecosystem: 'pypi', name: 'flask', manifest: 'requirements.txt:2' });
  });

  it('handles ~=, >=, extras, markers, comments and hashes', () => {
    const root = tree({
      'requirements.txt': [
        'requests[security,socks]~=2.31  # http',
        'numpy>=1.26 ; python_version >= "3.9"',
        'Pillow==10.4.0 ; sys_platform == "linux" \\',
        '    --hash=sha256:abc',
        'pydantic>=2,<3',
        'scrapy === 2.11.2',
        '',
      ].join('\n'),
    });
    const r = readPypi(root, ['requirements.txt']);
    const by = Object.fromEntries(r.deps.map((d) => [d.name, d.version]));
    expect(by['requests']).toBeUndefined();
    expect(by['numpy']).toBeUndefined();
    expect(by['pillow']).toBe('10.4.0');
    expect(by['pydantic']).toBeUndefined();
    expect(by['scrapy']).toBe('2.11.2');
    expect(Object.keys(by).sort()).toEqual(['numpy', 'pillow', 'pydantic', 'requests', 'scrapy']);
  });

  it('normalizes names per PEP 503', () => {
    const root = tree({ 'requirements.txt': 'Django_REST.framework==3.15.2\n' });
    expect(readPypi(root, ['requirements.txt']).deps[0]?.name).toBe('django-rest-framework');
  });

  it('skips editable installs, URLs, options and local paths', () => {
    const root = tree({
      'requirements.txt': [
        '-e .',
        '-e git+https://github.com/a/b.git#egg=b',
        'git+https://github.com/a/c.git',
        'https://example.com/pkg.whl',
        './local/pkg',
        '../other',
        '--index-url https://pypi.example/simple',
        '-i https://pypi.example/simple',
        'flask==3.0.0',
        '',
      ].join('\n'),
    });
    expect(readPypi(root, ['requirements.txt']).deps.map((d) => d.name)).toEqual(['flask']);
  });

  it('follows -r includes relative to the including file, once each', () => {
    const root = tree({
      'requirements.txt': '-r base/common.txt\n-r base/common.txt\nflask==3.0.0\n',
      'base/common.txt': '-r ../requirements.txt\nrequests==2.32.3\n',
    });
    const r = readPypi(root, ['requirements.txt']);
    expect(r.deps.filter((d) => d.name === 'requests')).toHaveLength(1);
    expect(r.deps.find((d) => d.name === 'requests')?.manifest).toBe('base/common.txt:2');
    expect(r.deps.filter((d) => d.name === 'flask')).toHaveLength(1);
  });

  it('reads a file that is both listed and included once', () => {
    const root = tree({
      'requirements.txt': '-r requirements-base.txt\n',
      'requirements-base.txt': 'flask==3.0.0\n',
    });
    const r = readPypi(root, ['requirements.txt', 'requirements-base.txt']);
    expect(r.deps).toHaveLength(1);
  });

  it('uses a -c constraints file for versions only, never adding dependencies', () => {
    const root = tree({
      'requirements.txt': '-c constraints.txt\nflask\n',
      'constraints.txt': 'flask==3.0.3\nwerkzeug==3.0.1\n',
    });
    const r = readPypi(root, ['requirements.txt']);
    expect(r.deps).toHaveLength(1);
    expect(r.deps[0]?.version).toBe('3.0.3');
  });

  it('refuses an include that escapes the scan root', () => {
    const root = tree({ 'requirements.txt': '-r ../../etc/secret.txt\nflask==3.0.0\n' });
    const r = readPypi(root, ['requirements.txt']);
    expect(r.deps.map((d) => d.name)).toEqual(['flask']);
    expect(r.notices.length).toBeGreaterThan(0);
  });

  it('skips dev requirement files and counts them', () => {
    const root = tree({ 'requirements.txt': 'flask==3.0.0\n', 'requirements-dev.txt': 'pytest==8.0.0\nruff==0.5.0\n' });
    const r = readPypi(root, ['requirements.txt', 'requirements-dev.txt']);
    expect(r.deps.map((d) => d.name)).toEqual(['flask']);
    expect(r.devSkipped).toBe(2);
  });

  it('reads pyproject [project].dependencies and optional groups, skipping dev and test', () => {
    const toml = [
      '[project]',
      'name = "app"',
      'dependencies = [',
      '  "openai>=1.0",',
      '  "Flask[async]==3.0.0; python_version >= \'3.9\'",',
      ']',
      '',
      '[project.optional-dependencies]',
      'postgres = ["psycopg>=3"]',
      'dev = ["pytest", "ruff"]',
      'test = ["coverage"]',
      '',
    ].join('\n');
    const root = tree({ 'pyproject.toml': toml });
    const r = readPypi(root, ['pyproject.toml']);
    const by = Object.fromEntries(r.deps.map((d) => [d.name, d]));
    expect(Object.keys(by).sort()).toEqual(['flask', 'openai', 'psycopg']);
    expect(by['flask']?.version).toBe('3.0.0');
    expect(by['flask']?.manifest).toBe('pyproject.toml:5');
    expect(by['openai']?.manifest).toBe('pyproject.toml:4');
    expect(by['psycopg']?.manifest).toBe('pyproject.toml:9');
    expect(r.devSkipped).toBe(3);
  });

  it('reads poetry main dependencies and skips groups and python', () => {
    const toml = [
      '[tool.poetry.dependencies]',
      'python = "^3.11"',
      'openai = "^1.0"',
      'Requests = { version = "2.32.3", extras = ["socks"] }',
      '',
      '[tool.poetry.group.dev.dependencies]',
      'pytest = "^8"',
      '',
      '[tool.poetry.group.main.dependencies]',
      'httpx = "^0.27"',
      '',
    ].join('\n');
    const root = tree({ 'pyproject.toml': toml });
    const r = readPypi(root, ['pyproject.toml']);
    const by = Object.fromEntries(r.deps.map((d) => [d.name, d]));
    expect(Object.keys(by).sort()).toEqual(['httpx', 'openai', 'requests']);
    expect(by['requests']?.version).toBe('2.32.3');
    expect(by['openai']?.manifest).toBe('pyproject.toml:3');
    expect(r.devSkipped).toBe(1);
  });

  it('takes versions from uv.lock, matching normalized names', () => {
    const root = tree({
      'pyproject.toml': '[project]\nname = "app"\ndependencies = ["Django_Rest_Framework>=3", "openai"]\n',
      'uv.lock': [
        'version = 1',
        '',
        '[[package]]',
        'name = "django-rest-framework"',
        'version = "3.15.2"',
        '',
        '[[package]]',
        'name = "openai"',
        'version = "1.51.0"',
        '',
      ].join('\n'),
    });
    const r = readPypi(root, ['pyproject.toml']);
    expect(r.deps.find((d) => d.name === 'django-rest-framework')?.version).toBe('3.15.2');
    expect(r.deps.find((d) => d.name === 'openai')?.version).toBe('1.51.0');
  });

  it('takes versions from poetry.lock for a requirements line without a pin, and keeps a pin as written', () => {
    const root = tree({
      'app/requirements.txt': 'openai>=1\nflask==3.0.0\n',
      'poetry.lock': '[[package]]\nname = "openai"\nversion = "1.51.0"\n\n[[package]]\nname = "flask"\nversion = "9.9.9"\n',
    });
    const r = readPypi(root, ['app/requirements.txt']);
    expect(r.deps.find((d) => d.name === 'openai')?.version).toBe('1.51.0');
    expect(r.deps.find((d) => d.name === 'flask')?.version).toBe('3.0.0');
  });

  it('leaves a dependency unresolved when the lockfile holds conflicting versions', () => {
    const root = tree({
      'pyproject.toml': '[project]\nname = "app"\ndependencies = ["numpy"]\n',
      'uv.lock': '[[package]]\nname = "numpy"\nversion = "1.26.4"\n\n[[package]]\nname = "numpy"\nversion = "2.0.0"\n',
    });
    expect(readPypi(root, ['pyproject.toml']).deps[0]?.version).toBeUndefined();
  });

  it('skips a pyproject that does not parse and returns a notice', () => {
    const root = tree({ 'pyproject.toml': '[project\nbroken', 'requirements.txt': 'flask==3.0.0\n' });
    const r = readPypi(root, ['pyproject.toml', 'requirements.txt']);
    expect(r.deps.map((d) => d.name)).toEqual(['flask']);
    expect(r.notices).toHaveLength(1);
    expect(r.notices[0]).toContain('pyproject.toml');
  });
});

describe('readPypi on very large manifests', () => {
  it('reads 20,000 Poetry dependencies, each with its own line, in time that grows near-linearly with the count', () => {
    const m = measureScaling({
      small: 2_000,
      large: 20_000,
      setup: (n) => {
        const body = Array.from({ length: n }, (_, i) => `pkg-${i} = "^1.${i}"`);
        return tree({ 'pyproject.toml': ['[tool.poetry.dependencies]', 'python = "^3.11"', ...body, ''].join('\n') });
      },
      run: (root) => readPypi(root, ['pyproject.toml']),
    });
    expectNearLinear(m, 'readPypi (Poetry)');
    expect(m.result.deps).toHaveLength(20_000);
    expect(m.result.deps.find((d) => d.name === 'pkg-0')?.manifest).toBe('pyproject.toml:3');
    expect(m.result.deps.find((d) => d.name === 'pkg-19999')?.manifest).toBe('pyproject.toml:20002');
  });

  it('still points a Poetry dependency written as its own table at that table', () => {
    const text = ['[tool.poetry.dependencies]', 'python = "^3.11"', '', '[tool.poetry.dependencies.requests]', 'version = "2.31.0"', ''].join('\n');
    const r = readPypi(tree({ 'pyproject.toml': text }), ['pyproject.toml']);
    expect(r.deps).toEqual([{ ecosystem: 'pypi', name: 'requests', version: '2.31.0', manifest: 'pyproject.toml:4' }]);
  });

  it('reads 20,000 PEP 621 dependencies whose text cannot be found on any line, in time that grows near-linearly with the count', () => {
    // A TOML escape means the parsed string is not a substring of the file.
    const m = measureScaling({
      small: 2_000,
      large: 20_000,
      setup: (n) => {
        const specs = Array.from({ length: n }, (_, i) => `"pkg-${i}\\u0041>=1"`);
        return tree({ 'pyproject.toml': ['[project]', 'name = "x"', `dependencies = [${specs.join(', ')}]`, ''].join('\n') });
      },
      run: (root) => readPypi(root, ['pyproject.toml']),
    });
    expectNearLinear(m, 'readPypi (PEP 621)');
    expect(m.result.deps).toHaveLength(20_000);
  });
});

describe('parse-error notices never carry source text (TOML)', () => {
  const SECRET = 'ghp_NOT_QUITE_A_SECRET_0123456789';

  it('names a line and column for a malformed pyproject.toml and a malformed uv.lock', () => {
    const a = readPypi(tree({ 'pyproject.toml': `[project]\nname = "x"\ntoken = ${SECRET}\n` }), ['pyproject.toml']);
    expect(a.notices.join('\n')).toMatch(/^pyproject\.toml: did not parse \(invalid TOML at line 3, column \d+\); skipped$/);
    expect(a.notices.join('\n')).not.toContain('ghp_');
    const b = readPypi(tree({ 'pyproject.toml': '[project]\nname = "x"\ndependencies = ["flask"]\n', 'uv.lock': `token = ${SECRET}\n` }), ['pyproject.toml']);
    expect(b.notices.join('\n')).toMatch(/uv\.lock: did not parse \(invalid TOML at line 1/);
    expect(b.notices.join('\n')).not.toContain('ghp_');
  });
});

