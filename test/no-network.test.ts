import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureEngine } from '../src/engine/fetch.js';
import { loadRuleSet, writeMergedConfig } from '../src/rules/load.js';

// A scan makes no network call (design 6.11). Three layers, each proving one thing:
//
//  1. The deny stub works. Under `node --require test/stubs/deny-network.cjs`, every way Node
//     opens a connection (fetch, http, https, net, tls, http2, dns, dgram) throws. Without this
//     layer, layer 2 could pass because the stub did nothing.
//  2. lexcode's own Node code makes no call. With the engine cached, the whole run (ensure the
//     engine without a download, merge the rules, run the engine over a repository) finishes with
//     exit 0 and real matches while every Node network API throws. This covers our code and our two
//     runtime dependencies. It cannot see the engine binary, which is a separate process.
//  3. The engine binary makes no call. The binary runs inside `docker run --network none`, a
//     container with no network interface at all, so it is the kernel and not a patch that
//     denies it. A control in the same image proves the network really is off. Needs Docker;
//     without it this layer is skipped and says why (LEXCODE_REQUIRE_DOCKER=1 makes that a failure).
//
// TODO(Task 5): switch layers 2 and 3 from test/stubs/scan-fixture-repo.mjs to `dist/cli.js scan`
// once the scan command exists (layer 3 then runs the CLI inside node:20-slim).

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const denyStub = join(root, 'test', 'stubs', 'deny-network.cjs');
const scanStub = join(root, 'test', 'stubs', 'scan-fixture-repo.mjs');
const basicRepo = join(root, 'test', 'repos', 'basic');
const DOCKER_IMAGE = process.env.LEXCODE_DOCKER_IMAGE ?? 'node:20-slim';

let enginePath: string;
let tmp: string;
const testTmp = join(root, 'test', '.tmp');
const cleanup: string[] = [];

beforeAll(async () => {
  tmp = mkdtempSync(join(tmpdir(), 'lexcode-nonet-'));
  // This process may use the network, so a missing engine is fetched here, once, unless offline.
  try {
    enginePath = (await ensureEngine({ download: process.env.LEXCODE_OFFLINE !== '1' })).path;
  } catch (e) {
    throw new Error(
      `The no-network test needs the Opengrep engine cached: ${(e as Error).message}\n` +
        'Run `node dist/cli.js engine fetch` once, or set LEXCODE_ENGINE=<path to opengrep>.',
    );
  }
  // The scan stub imports the compiled modules. Always rebuilt: a dist left from an earlier checkout
  // made this suite run old code against the current stub.
  const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  const built = spawnSync(process.execPath, [tsc, '-p', join(root, 'tsconfig.json')], { cwd: root, encoding: 'utf8' });
  if (built.status !== 0) throw new Error(`npm run build is needed first and failed:\n${built.stdout}${built.stderr}`);
}, 120_000);

afterAll(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  for (const d of cleanup) rmSync(d, { recursive: true, force: true });
  if (existsSync(testTmp) && readdirSync(testTmp).length === 0) rmSync(testTmp, { recursive: true, force: true });
});

describe('the deny stub (layer 1)', () => {
  it('makes fetch, http, https, net, tls, dns and dgram throw', () => {
    const probe = `
      const tries = {
        fetch: () => fetch('https://example.com'),
        'http.request': () => require('node:http').request('http://example.com'),
        'https.get': () => require('node:https').get('https://example.com'),
        'net.connect': () => require('node:net').connect(80, 'example.com'),
        'net.Socket.connect': () => new (require('node:net').Socket)().connect(80, 'example.com'),
        'tls.connect': () => require('node:tls').connect(443, 'example.com'),
        'dns.lookup': () => require('node:dns').lookup('example.com', () => {}),
        'dns.promises.lookup': () => require('node:dns').promises.lookup('example.com'),
        'dgram.createSocket': () => require('node:dgram').createSocket('udp4'),
      };
      const bad = [];
      for (const [name, fn] of Object.entries(tries)) {
        try { fn(); bad.push(name); } catch (e) { if (e.code !== 'ENETDENIED') bad.push(name + ':' + e.code); }
      }
      console.log(JSON.stringify(bad));
    `;
    const r = spawnSync(process.execPath, ['--require', denyStub, '-e', probe], { cwd: root, encoding: 'utf8' });
    expect(r.stderr).toBe('');
    expect(JSON.parse(r.stdout.trim())).toEqual([]);
    expect(r.status).toBe(0);
  });

  it('leaves the engine child process alone', () => {
    // The engine reports its version without any Node networking; the stub only patches Node.
    const r = spawnSync(process.execPath, ['--require', denyStub, '-e', `
      const { execFileSync } = require('node:child_process');
      process.stdout.write(execFileSync(process.argv[1], ['--version'], { encoding: 'utf8' }));
    `, enginePath], { cwd: root, encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/\d+\.\d+\.\d+/);
  });
});

describe('a scan under a denied network (layer 2)', () => {
  it('finishes with exit 0 and finds the Whisper call', () => {
    const r = spawnSync(process.execPath, ['--require', denyStub, scanStub, basicRepo], { cwd: root, encoding: 'utf8' });
    expect(r.stderr, 'the scan wrote to stderr').toBe('');
    expect(r.status).toBe(0);
    const out = JSON.parse(r.stdout) as { matches: { ruleId: string; path: string }[] };
    expect(out.matches.length).toBeGreaterThanOrEqual(1);
    expect(out.matches.map((m) => `${m.ruleId} ${m.path}`)).toContain('lexcode.voice.whisper-transcribe app.py');
  });

  it('fails without trying to download when the engine is missing', () => {
    // A control: with an empty cache the run must fail without a download (download:false) rather
    // than reach for the network, and it must not have touched the cache.
    const empty = join(tmp, 'empty-cache');
    mkdirSync(empty);
    const r = spawnSync(process.execPath, ['--require', denyStub, scanStub, basicRepo], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, LEXCODE_CACHE_DIR: empty, LEXCODE_ENGINE: '' },
    });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('lexcode engine fetch');
    expect(r.stderr).not.toContain('ENETDENIED');
  });
});

interface DockerReady {
  image?: string;
  skip?: string;
}

/** Docker present, daemon reachable, image local or pulled within 60 seconds; otherwise the reason to skip. */
function dockerReady(): DockerReady {
  if (process.platform !== 'linux') return { skip: `the pinned Linux engine binary needs a Linux host (this is ${process.platform})` };
  const info = spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], { encoding: 'utf8', timeout: 20_000 });
  if (info.error) return { skip: 'docker is not installed' };
  if (info.status !== 0) return { skip: 'the docker daemon is not reachable for this user' };
  if (spawnSync('docker', ['image', 'inspect', DOCKER_IMAGE], { encoding: 'utf8' }).status === 0) return { image: DOCKER_IMAGE };
  const pull = spawnSync('docker', ['pull', '--quiet', DOCKER_IMAGE], { encoding: 'utf8', timeout: 60_000 });
  if (pull.status === 0) return { image: DOCKER_IMAGE };
  return { skip: `${DOCKER_IMAGE} is not present and could not be pulled within 60 seconds` };
}

describe('the engine binary under --network none (layer 3)', () => {
  it('scans a repository inside a container with no network', (ctx) => {
    const ready = dockerReady();
    if (ready.image === undefined) {
      const reason = `layer 3 skipped: ${ready.skip ?? 'docker unavailable'}`;
      if (process.env.LEXCODE_REQUIRE_DOCKER === '1') throw new Error(reason);
      console.warn(reason);
      ctx.skip(reason);
      return;
    }
    const image = ready.image;
    const uid = process.getuid?.() ?? 1000;
    const gid = process.getgid?.() ?? 1000;
    const run = (args: string[]) =>
      spawnSync('docker', ['run', '--rm', '--network', 'none', '--user', `${uid}:${gid}`, ...args], { encoding: 'utf8', timeout: 100_000 });

    // Control: the same image, same flags, cannot reach the internet.
    const control = run([
      '--entrypoint', 'node', image, '-e',
      "fetch('https://example.com').then(() => process.exit(1), () => process.exit(0))",
    ]);
    expect(control.status, `a container started with --network none still reached the network:\n${control.stderr}`).toBe(0);

    // Bind mounts must be paths the Docker daemon can see; the system temp directory is not always one.
    mkdirSync(testTmp, { recursive: true });
    const work = mkdtempSync(join(testTmp, 'docker-'));
    cleanup.push(work);
    const cfgDir = join(work, 'cfg');
    const outDir = join(work, 'out');
    mkdirSync(cfgDir);
    mkdirSync(outDir);
    writeMergedConfig(loadRuleSet().rules, join(cfgDir, 'rules.yml'));
    const engineDir = dirname(enginePath);
    const scan = run([
      '-e', 'HOME=/h', '--tmpfs', '/h:exec,mode=1777',
      '-e', 'SEMGREP_SEND_METRICS=off',
      '-v', `${basicRepo}:/w:ro`,
      '-v', `${cfgDir}:/cfg:ro`,
      '-v', `${outDir}:/out`,
      '-v', `${engineDir}:/engine:ro`,
      '-w', '/w',
      '--entrypoint', `/engine/${basename(enginePath)}`,
      image,
      'scan', '--config', '/cfg/rules.yml', '--json-output', '/out/o.json',
      '--disable-version-check', '--no-rewrite-rule-ids', '--exclude-minified-files', '--quiet',
      '--', 'app.py', 'package.json',
    ]);
    expect(scan.status, `the engine failed inside the container:\n${scan.stderr}`).toBe(0);
    const doc = JSON.parse(readFileSync(join(outDir, 'o.json'), 'utf8')) as { results: { check_id: string; path: string }[] };
    expect(doc.results.map((r) => `${r.check_id} ${r.path}`)).toContain('lexcode.voice.whisper-transcribe app.py');
  });
});
