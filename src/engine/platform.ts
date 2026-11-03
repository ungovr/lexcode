import { ToolError } from '../errors.js';
import type { PlatformKey } from './pin.js';

/** True on a Linux whose C library is not glibc (Alpine and similar). */
export function detectMusl(): boolean {
  if (process.platform !== 'linux') return false;
  try {
    const report = process.report?.getReport() as unknown as { header?: { glibcVersionRuntime?: string } } | undefined;
    return !report?.header?.glibcVersionRuntime;
  } catch {
    return false;
  }
}

export function platformKey(platform: string = process.platform, arch: string = process.arch, musl?: boolean): PlatformKey {
  if (platform === 'linux' && (arch === 'x64' || arch === 'arm64')) {
    const isMusl = musl ?? detectMusl();
    return `linux-${arch}-${isMusl ? 'musl' : 'glibc'}`;
  }
  if (platform === 'darwin' && (arch === 'x64' || arch === 'arm64')) return `darwin-${arch}`;
  if (platform === 'win32' && arch === 'x64') return 'win32-x64';
  throw new ToolError(
    `no pinned Opengrep engine for ${platform}/${arch}. Install Opengrep yourself and pass it with --engine <path> or LEXCODE_ENGINE=<path>.`,
  );
}
