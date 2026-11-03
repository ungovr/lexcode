import { describe, expect, it } from 'vitest';
import { ToolError } from '../../src/errors.js';
import { cacheDir } from '../../src/engine/cache.js';
import { ENGINE_PIN, assetUrl } from '../../src/engine/pin.js';
import { platformKey } from '../../src/engine/platform.js';

describe('platformKey', () => {
  it('picks the musl asset on a musl Linux', () => {
    expect(platformKey('linux', 'x64', true)).toBe('linux-x64-musl');
    expect(platformKey('linux', 'arm64', true)).toBe('linux-arm64-musl');
  });
  it('picks the glibc asset on a glibc Linux', () => {
    expect(platformKey('linux', 'x64', false)).toBe('linux-x64-glibc');
    expect(platformKey('linux', 'arm64', false)).toBe('linux-arm64-glibc');
  });
  it('maps macOS and Windows', () => {
    expect(platformKey('darwin', 'arm64', false)).toBe('darwin-arm64');
    expect(platformKey('darwin', 'x64', false)).toBe('darwin-x64');
    expect(platformKey('win32', 'x64', false)).toBe('win32-x64');
  });
  it('throws a ToolError naming --engine for a platform with no pinned asset', () => {
    expect(() => platformKey('win32', 'arm64', false)).toThrow(ToolError);
    expect(() => platformKey('win32', 'arm64', false)).toThrow(/--engine/);
    expect(() => platformKey('freebsd', 'x64', false)).toThrow(/--engine/);
  });
});

describe('ENGINE_PIN', () => {
  it('pins the seven assets of v1.33.1 with a sha256 each', () => {
    expect(ENGINE_PIN.name).toBe('opengrep');
    expect(ENGINE_PIN.version).toBe('1.33.1');
    expect(ENGINE_PIN.tag).toBe('v1.33.1');
    const keys = Object.keys(ENGINE_PIN.assets).sort();
    expect(keys).toEqual(
      ['darwin-arm64', 'darwin-x64', 'linux-arm64-glibc', 'linux-arm64-musl', 'linux-x64-glibc', 'linux-x64-musl', 'win32-x64'].sort(),
    );
    for (const a of Object.values(ENGINE_PIN.assets)) {
      expect(a.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(ENGINE_PIN.assets['linux-x64-glibc']).toEqual({
      name: 'opengrep_manylinux_x86',
      sha256: '46e8133cc490f9f50518061590ce2f6be5a08afaeda034471c0ceda4b3899808',
    });
    expect(ENGINE_PIN.assets['win32-x64'].name).toBe('opengrep_windows_x86.exe');
  });
  it('builds the release download URL', () => {
    expect(assetUrl(ENGINE_PIN, 'linux-x64-glibc')).toBe(
      'https://github.com/opengrep/opengrep/releases/download/v1.33.1/opengrep_manylinux_x86',
    );
  });
});

describe('cacheDir', () => {
  it('uses XDG_CACHE_HOME on Linux when set', () => {
    expect(cacheDir({ XDG_CACHE_HOME: '/x' }, 'linux', '/h')).toBe('/x/lexcode');
  });
  it('falls back to ~/.cache on Linux', () => {
    expect(cacheDir({}, 'linux', '/h')).toBe('/h/.cache/lexcode');
  });
  it('uses ~/Library/Caches on macOS', () => {
    expect(cacheDir({}, 'darwin', '/h')).toBe('/h/Library/Caches/lexcode');
  });
  it('uses LOCALAPPDATA on Windows', () => {
    expect(cacheDir({ LOCALAPPDATA: 'C:\\L' }, 'win32', 'C:\\h')).toBe('C:\\L\\lexcode\\Cache');
  });
  it('falls back to AppData\\Local on Windows without LOCALAPPDATA', () => {
    expect(cacheDir({}, 'win32', 'C:\\h')).toBe('C:\\h\\AppData\\Local\\lexcode\\Cache');
  });
  it('lets LEXCODE_CACHE_DIR win on every platform', () => {
    for (const p of ['linux', 'darwin', 'win32'] as const) {
      expect(cacheDir({ LEXCODE_CACHE_DIR: '/c', XDG_CACHE_HOME: '/x', LOCALAPPDATA: 'C:\\L' }, p, '/h')).toBe('/c');
    }
  });
  it('ignores an empty LEXCODE_CACHE_DIR', () => {
    expect(cacheDir({ LEXCODE_CACHE_DIR: '' }, 'linux', '/h')).toBe('/h/.cache/lexcode');
  });
});
