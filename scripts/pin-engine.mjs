#!/usr/bin/env node
// Pins lexcode to an Opengrep release: `node scripts/pin-engine.mjs v1.33.1`.
//
// Release-time only, run by a maintainer, never by users and never in a scan.
// For each platform asset lexcode supports it:
//   1. reads the asset's sha256 from the GitHub release API (`gh api`),
//   2. downloads the asset with its cosign `.sig` and `.cert` (`gh release download`),
//   3. verifies the signature with cosign against the Opengrep release
//      workflow's identity and GitHub's OIDC issuer (refuses to run without cosign),
//   4. checks the downloaded bytes hash to the digest the API reported,
// and only when every asset passes, rewrites src/engine/pin.ts.
//
// The identity is the one in the v1.33.1 certificates, read 2026-11-03:
//   https://github.com/opengrep/opengrep/.github/workflows/rolling-release.yml@refs/heads/release-v1.33.1
// If Opengrep moves its release workflow, verification fails here and a person
// decides whether the new identity is theirs before widening the pattern.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'opengrep/opengrep';
const OIDC_ISSUER = 'https://token.actions.githubusercontent.com';
const IDENTITY = /^https:\/\/github\.com\/opengrep\/opengrep\/\.github\/workflows\/rolling-release\.yml@refs\/heads\/release-v/;
const IDENTITY_REGEXP = '^https://github\\.com/opengrep/opengrep/\\.github/workflows/rolling-release\\.yml@refs/heads/release-v';

const ASSETS = {
  'linux-x64-glibc': 'opengrep_manylinux_x86',
  'linux-arm64-glibc': 'opengrep_manylinux_aarch64',
  'linux-x64-musl': 'opengrep_musllinux_x86',
  'linux-arm64-musl': 'opengrep_musllinux_aarch64',
  'darwin-x64': 'opengrep_osx_x86',
  'darwin-arm64': 'opengrep_osx_arm64',
  'win32-x64': 'opengrep_windows_x86.exe',
};

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
}

function fail(message) {
  process.stderr.write(`pin-engine: ${message}\n`);
  process.exit(1);
}

const tag = process.argv[2];
if (!tag || !/^v\d+\.\d+\.\d+$/.test(tag)) fail('usage: node scripts/pin-engine.mjs vX.Y.Z');

try {
  run('cosign', ['version']);
} catch {
  fail('cosign is not installed; install it (https://github.com/sigstore/cosign) and run again. The pin is never written unverified.');
}

const release = JSON.parse(run('gh', ['api', `repos/${REPO}/releases/tags/${tag}`]));
if (release.prerelease || release.draft) fail(`${tag} is a prerelease or draft; pin a release`);
const digests = new Map(release.assets.map((a) => [a.name, a.digest]));

const work = mkdtempSync(join(tmpdir(), 'lexcode-pin-'));
const pinned = {};
try {
  for (const [key, name] of Object.entries(ASSETS)) {
    const digest = digests.get(name);
    if (!digest || !digest.startsWith('sha256:')) fail(`${tag} has no sha256 digest for ${name}`);
    for (const suffix of ['', '.sig', '.cert']) {
      if (!digests.has(name + suffix)) fail(`${tag} has no ${name + suffix}`);
    }
    run('gh', ['release', 'download', tag, '-R', REPO, '-D', work, '--clobber',
      '-p', name, '-p', `${name}.sig`, '-p', `${name}.cert`]);
    const asset = join(work, name);
    const certPem = Buffer.from(readFileSync(`${asset}.cert`, 'utf8').trim(), 'base64').toString('utf8');
    const certFile = `${asset}.cert.pem`;
    writeFileSync(certFile, certPem.includes('BEGIN CERTIFICATE') ? certPem : readFileSync(`${asset}.cert`, 'utf8'));
    run('cosign', ['verify-blob', asset,
      '--signature', `${asset}.sig`,
      '--certificate', certFile,
      '--certificate-identity-regexp', IDENTITY_REGEXP,
      '--certificate-oidc-issuer', OIDC_ISSUER]);
    const sans = run('openssl', ['x509', '-in', certFile, '-noout', '-ext', 'subjectAltName']);
    const uri = /URI:(\S+)/.exec(sans)?.[1] ?? '';
    if (!IDENTITY.test(uri) || !uri.endsWith(`release-${tag}`)) fail(`${name}: certificate identity ${uri} is not the ${tag} release workflow`);
    const sha256 = createHash('sha256').update(readFileSync(asset)).digest('hex');
    if (`sha256:${sha256}` !== digest) fail(`${name}: downloaded bytes hash to ${sha256}, the API reported ${digest}`);
    pinned[key] = { name, sha256 };
    process.stdout.write(`verified ${name} ${sha256}\n`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

const version = tag.slice(1);
const today = new Date().toISOString().slice(0, 10);
const pinFile = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'engine', 'pin.ts');
const source = readFileSync(pinFile, 'utf8');
const head = source.slice(0, source.indexOf('/**\n * The one engine release'));
const tail = source.slice(source.indexOf('export function assetUrl'));
const assets = Object.entries(pinned)
  .map(([k, v]) => `    '${k}': {\n      name: '${v.name}',\n      sha256: '${v.sha256}',\n    },`)
  .join('\n');
writeFileSync(pinFile, `${head}/**
 * The one engine release lexcode runs. The sha256 values are the digests the GitHub
 * release API reported on ${today}, each asset's cosign signature verified against the
 * Opengrep release workflow by \`scripts/pin-engine.mjs\`. Bumping the pin is a release
 * of lexcode, and that script rewrites this file at that time.
 */
export const ENGINE_PIN: EnginePin = {
  name: 'opengrep',
  version: '${version}',
  tag: '${tag}',
  source: 'https://github.com/opengrep/opengrep/tree/${tag}',
  assets: {
${assets}
  },
};

${tail}`);
process.stdout.write(`pinned ${tag} in src/engine/pin.ts; update NOTICE's source link to ${tag} too\n`);
