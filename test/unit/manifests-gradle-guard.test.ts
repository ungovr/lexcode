import { describe, expect, it, vi } from 'vitest';
import { lineOf, tree } from './helpers.js';

// One file that throws while it is read must cost the scan that file only, never its siblings' rows.
vi.mock('../../src/manifests/util.js', async (importActual) => {
  const actual = await importActual<typeof import('../../src/manifests/util.js')>();
  return {
    ...actual,
    readText: (root: string, rel: string): string | undefined => {
      if (rel.includes('boom')) throw new RangeError('Invalid string length');
      return actual.readText(root, rel);
    },
  };
});

const { readGradle } = await import('../../src/manifests/gradle.js');

describe('readGradle: a file that throws', () => {
  it('becomes a notice, and a good build file beside it still yields its rows', () => {
    const good = "dependencies {\n    implementation 'g:a:1'\n}\n";
    const files = { 'a/build.gradle': good, 'boom/build.gradle': "dependencies {\n    implementation 'g:b:2'\n}\n", 'c/build.gradle.kts': 'dependencies {\n    implementation("g:c:3")\n}\n' };
    const r = readGradle(tree(files), Object.keys(files));
    expect(r.deps.map((d) => [d.name, d.manifest])).toEqual([
      ['g:a', `a/build.gradle:${lineOf(good, 'g:a')}`],
      ['g:c', 'c/build.gradle.kts:2'],
    ]);
    expect(r.notices).toEqual(['boom/build.gradle: could not be read; skipped']);
  });

  it('a throwing buildSrc source is a notice too', () => {
    const files = { 'buildSrc/src/boom/Deps.kt': 'object Libs { const val X = "g:x:1" }\n', 'build.gradle': "dependencies {\n    implementation 'g:ok:1'\n}\n" };
    const r = readGradle(tree(files), Object.keys(files));
    expect(r.deps.map((d) => d.name)).toEqual(['g:ok']);
    expect(r.notices).toEqual(['buildSrc/src/boom/Deps.kt: could not be read; skipped']);
  });
});
