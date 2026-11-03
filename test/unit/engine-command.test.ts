import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ToolError } from '../../src/errors.js';
import { runEngineCommand } from '../../src/commands/engine.js';
import { ENGINE_PIN, type EnginePin, type PlatformKey } from '../../src/engine/pin.js';
import { pinnedEnginePath } from '../../src/engine/fetch.js';

const KEY: PlatformKey = 'linux-x64-glibc';
const BYTES = Buffer.from('#!/bin/sh\necho 1.33.1\n');
const sha = createHash('sha256').update(BYTES).digest('hex');
const pin: EnginePin = { ...ENGINE_PIN, assets: { ...ENGINE_PIN.assets, [KEY]: { name: 'opengrep_test_asset', sha256: sha } } };

let dir: string;
let out: string[];
let err: string[];
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'lexcode-cmd-'));
  out = [];
  err = [];
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const deps = () => ({
  env: { LEXCODE_CACHE_DIR: dir },
  pin,
  platform: KEY,
  sleep: async () => {},
  fetchImpl: (async () => new Response(new Uint8Array(BYTES))) as typeof fetch,
  stdout: (s: string) => void out.push(s),
  stderr: (s: string) => void err.push(s),
});

describe('lexcode engine', () => {
  it('exits 2 with usage on an unknown or missing subcommand', async () => {
    expect(await runEngineCommand(['bogus'], deps())).toBe(2);
    expect(await runEngineCommand([], deps())).toBe(2);
    expect(err.join('')).toContain('lexcode engine fetch | path | verify');
  });

  it('exits 2 with usage on extra arguments', async () => {
    expect(await runEngineCommand(['fetch', 'extra'], deps())).toBe(2);
  });

  it('fetch downloads, prints the URL and sha256, and exits 0; verify then exits 0', async () => {
    expect(await runEngineCommand(['fetch'], deps())).toBe(0);
    const text = out.join('');
    expect(text).toContain('https://github.com/opengrep/opengrep/releases/download/v1.33.1/opengrep_test_asset');
    expect(text).toContain(sha);
    out.length = 0;
    expect(await runEngineCommand(['verify'], deps())).toBe(0);
    expect(out.join('')).toContain(sha);
  });

  it('path prints the cached engine, and fails with a next step when there is none', async () => {
    await expect(runEngineCommand(['path'], deps())).rejects.toThrow(/lexcode engine fetch/);
    await runEngineCommand(['fetch'], deps());
    out.length = 0;
    expect(await runEngineCommand(['path'], deps())).toBe(0);
    expect(out.join('').trim()).toBe(pinnedEnginePath(pin, KEY, dir));
  });

  it('path prints LEXCODE_ENGINE when set', async () => {
    const d = deps();
    d.env = { LEXCODE_CACHE_DIR: dir, LEXCODE_ENGINE: '/opt/opengrep' } as typeof d.env;
    expect(await runEngineCommand(['path'], d)).toBe(0);
    expect(out.join('').trim()).toBe('/opt/opengrep');
  });

  it('verify fails with ToolError when the cached bytes changed, and fetch repairs it', async () => {
    await runEngineCommand(['fetch'], deps());
    await writeFile(pinnedEnginePath(pin, KEY, dir), 'swapped');
    const e = await runEngineCommand(['verify'], deps()).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ToolError);
    expect((e as Error).message).toContain('sha256');
    expect(await runEngineCommand(['fetch'], deps())).toBe(0);
    expect(await runEngineCommand(['verify'], deps())).toBe(0);
  });

  it('verify with nothing cached fails with a next step', async () => {
    await expect(runEngineCommand(['verify'], deps())).rejects.toThrow(/lexcode engine fetch/);
  });
});
