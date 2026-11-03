import { describe, expect, it } from 'vitest';
import { readGo } from '../../src/manifests/go.js';
import { tree } from './helpers.js';

describe('readGo', () => {
  it('reads require blocks and single lines with their line numbers, skipping indirect', () => {
    const src = [
      'module example.com/app',
      '',
      'go 1.22',
      '',
      'require (',
      '\tgithub.com/gocolly/colly/v2 v2.1.0',
      '\tgolang.org/x/net v0.30.0 // indirect',
      '\tgithub.com/old/pkg v2.0.0+incompatible',
      ')',
      '',
      'require github.com/single/dep v1.0.0',
      'require github.com/single/indirect v1.0.0 // indirect',
      '',
    ].join('\n');
    const root = tree({ 'go.mod': src });
    const r = readGo(root, ['go.mod']);
    expect(r.deps).toEqual([
      { ecosystem: 'golang', name: 'github.com/gocolly/colly/v2', version: 'v2.1.0', manifest: 'go.mod:6' },
      { ecosystem: 'golang', name: 'github.com/old/pkg', version: 'v2.0.0+incompatible', manifest: 'go.mod:8' },
      { ecosystem: 'golang', name: 'github.com/single/dep', version: 'v1.0.0', manifest: 'go.mod:11' },
    ]);
    expect(r.devSkipped).toBe(0);
    expect(r.notices).toEqual([]);
  });

  it('reads a nested module and ignores replace and exclude lines', () => {
    const root = tree({
      'svc/go.mod': 'module x\nrequire a.com/b v1.2.3\nreplace a.com/b => ../b\nexclude a.com/c v1.0.0\n',
    });
    const r = readGo(root, ['svc/go.mod']);
    expect(r.deps).toEqual([{ ecosystem: 'golang', name: 'a.com/b', version: 'v1.2.3', manifest: 'svc/go.mod:2' }]);
  });

  it('returns a notice for an unterminated require block', () => {
    const root = tree({ 'go.mod': 'module x\nrequire (\n\ta.com/b v1.0.0\n' });
    const r = readGo(root, ['go.mod']);
    expect(r.notices).toHaveLength(1);
    expect(r.deps).toEqual([]);
  });

  it('reads only go.mod files in the list', () => {
    const root = tree({
      'go.mod': 'module x\nrequire a.com/b v1.0.0\n',
      'other/go.mod': 'module y\nrequire a.com/c v1.0.0\n',
    });
    expect(readGo(root, ['go.mod']).deps.map((d) => d.name)).toEqual(['a.com/b']);
  });
});
