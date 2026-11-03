export type PlatformKey =
  | 'linux-x64-glibc'
  | 'linux-arm64-glibc'
  | 'linux-x64-musl'
  | 'linux-arm64-musl'
  | 'darwin-x64'
  | 'darwin-arm64'
  | 'win32-x64';

export interface EnginePin {
  name: 'opengrep';
  version: string;
  tag: string;
  source: string;
  assets: Record<PlatformKey, { name: string; sha256: string }>;
}

/**
 * The one engine release lexcode runs. The sha256 values are the digests the GitHub
 * release API reported on 2026-11-03, each asset's cosign signature verified against the
 * Opengrep release workflow by `scripts/pin-engine.mjs`. Bumping the pin is a release
 * of lexcode, and that script rewrites this file at that time.
 */
export const ENGINE_PIN: EnginePin = {
  name: 'opengrep',
  version: '1.33.1',
  tag: 'v1.33.1',
  source: 'https://github.com/opengrep/opengrep/tree/v1.33.1',
  assets: {
    'linux-x64-glibc': {
      name: 'opengrep_manylinux_x86',
      sha256: '46e8133cc490f9f50518061590ce2f6be5a08afaeda034471c0ceda4b3899808',
    },
    'linux-arm64-glibc': {
      name: 'opengrep_manylinux_aarch64',
      sha256: 'd1433f63a90b8bc0b6ad4b498a13b372b856ce9a754a43484ba4920fe2d76dcf',
    },
    'linux-x64-musl': {
      name: 'opengrep_musllinux_x86',
      sha256: 'aa03c3bfff105dc122cbbe6e239dc39a5cae486f1837bba3af7a16bca173f8d6',
    },
    'linux-arm64-musl': {
      name: 'opengrep_musllinux_aarch64',
      sha256: '17c6917b53d8f8af794d8effb13c1a068018c602435d33fefc105aaa23d96f4b',
    },
    'darwin-x64': {
      name: 'opengrep_osx_x86',
      sha256: 'c3bd18e0d898d44e28419d95dad57c8928bb46ab32889a0ee1f72a87ad9627af',
    },
    'darwin-arm64': {
      name: 'opengrep_osx_arm64',
      sha256: 'a17c1881bb40e3214266a7a291cf4f2ae3bc56c1715628b5712d2ec816bc3e2d',
    },
    'win32-x64': {
      name: 'opengrep_windows_x86.exe',
      sha256: '132e606e071bdd3928286fddc893198a6106a90820d46e21197e0ace1a23e0c1',
    },
  },
};

export function assetUrl(pin: EnginePin, key: PlatformKey): string {
  return `https://github.com/opengrep/opengrep/releases/download/${pin.tag}/${pin.assets[key].name}`;
}
