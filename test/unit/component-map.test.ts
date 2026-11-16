import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { normalizePypiName } from '../../src/manifests/purl.js';

const rulesDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'rules');
const classes = parse(readFileSync(join(rulesDir, 'classes.yml'), 'utf8')) as Record<string, string>;

const FILES = [
  { file: 'npm.yml', ecosystem: 'npm' },
  { file: 'pypi.yml', ecosystem: 'pypi' },
  { file: 'go.yml', ecosystem: 'golang' },
  { file: 'gem.yml', ecosystem: 'gem' },
  { file: 'maven.yml', ecosystem: 'maven' },
  { file: 'composer.yml', ecosystem: 'composer' },
  { file: 'nuget.yml', ecosystem: 'nuget' },
  { file: 'cargo.yml', ecosystem: 'cargo' },
  { file: 'swift.yml', ecosystem: 'swift' },
  { file: 'cocoapods.yml', ecosystem: 'cocoapods' },
  { file: 'files.yml', ecosystem: 'files' },
] as const;

/**
 * The cargo, swift and cocoapods maps (v1.5): `match` is the lowercased row name (`host/owner/repo` for a
 * Swift package, never a prefix glob), and `source` is the crates.io page, the cocoapods.org page or the
 * repository URL.
 */
function nameProblems(ecosystem: 'cargo' | 'swift' | 'cocoapods', entries: Entry[]): string[] {
  const out: string[] = [];
  const NAME = {
    cargo: /^[a-z0-9][a-z0-9_-]*$/,
    swift: /^[a-z0-9.-]+\.[a-z]+\/[a-z0-9._-]+\/[a-z0-9._-]+$/,
    cocoapods: /^[a-z0-9][a-z0-9_.+-]*(?:\/[a-z0-9_.+-]+)*$/,
  }[ecosystem];
  const SOURCE = {
    cargo: /^https:\/\/crates\.io\/crates\/[A-Za-z0-9_-]+$/,
    swift: /^https:\/\/[a-z0-9.-]+\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/,
    cocoapods: /^https:\/\/cocoapods\.org\/pods\/[A-Za-z0-9_.+-]+$/,
  }[ecosystem];
  entries.forEach((e, i) => {
    const at = `entry ${i + 1} (${String(e.match)})`;
    if (typeof e.match !== 'string' || !NAME.test(e.match)) out.push(`${at}: match is not a lowercased ${ecosystem} name`);
    if (typeof e.source !== 'string' || !SOURCE.test(e.source)) out.push(`${at}: source is not a ${ecosystem} page`);
    if (ecosystem === 'swift' && typeof e.match === 'string' && typeof e.source === 'string') {
      const repo = e.source.replace(/^https:\/\//, '').toLowerCase();
      if (repo !== e.match) out.push(`${at}: source names ${repo}`);
    }
  });
  return out;
}

interface Entry {
  match?: unknown;
  enables?: unknown;
  says?: unknown;
  source?: unknown;
}

/**
 * A ships_encryption entry's own description must say it encrypts (a cipher, an AEAD or AES by name) and
 * must not name hashing, signing, MACs, PKI or cryptography in general: those mark a general library,
 * which an app can link only for a hash or a signature (#13318, #13336).
 */
function encryptionSaysProblems(file: string, e: Entry): string[] {
  const says = String(e.says ?? '');
  const ENCRYPTION = /encrypt|cipher|\bAEAD\b|\bAES\b/i;
  const GENERAL =
    /cryptograph|crypto standards|digest|hash|\bsign(?:s|ing|ature|atures)?\b|\bPKI\b|X\.509|\bRSA\b|\bH?MAC\b|elliptic|\bcurves?\b|CryptoKit/i;
  if (!ENCRYPTION.test(says) || GENERAL.test(says)) {
    return [`${file} ${String(e.match)}: ships_encryption on a description that does not say its purpose is encryption: "${says}"`];
  }
  return [];
}

function load(file: string): { ecosystem: unknown; entries: Entry[] } {
  const doc = parse(readFileSync(join(rulesDir, 'components', file), 'utf8')) as {
    ecosystem: unknown;
    entries: Entry[];
  };
  return doc;
}

function problems(ecosystem: string, doc: { ecosystem: unknown; entries: Entry[] }): string[] {
  const out: string[] = [];
  if (doc.ecosystem !== ecosystem) out.push(`ecosystem is ${String(doc.ecosystem)}, expected ${ecosystem}`);
  if (!Array.isArray(doc.entries)) return [...out, 'entries is not a list'];
  const seen = new Set<string>();
  doc.entries.forEach((e, i) => {
    const at = `entry ${i + 1} (${String(e.match)})`;
    if (typeof e.match !== 'string' || e.match.trim() === '') out.push(`${at}: no match`);
    else {
      const key = ecosystem === 'pypi' ? normalizePypiName(e.match) : e.match.toLowerCase();
      if (seen.has(key)) out.push(`${at}: duplicate match`);
      seen.add(key);
    }
    if (!Array.isArray(e.enables) || e.enables.length === 0) out.push(`${at}: enables is empty`);
    else {
      if (new Set(e.enables as string[]).size !== e.enables.length) out.push(`${at}: enables repeats an id`);
      for (const id of e.enables as string[]) {
        const cls = classes[id];
        if (cls === undefined) out.push(`${at}: ${id} is not in classes.yml`);
        else if (cls !== 'evidence') out.push(`${at}: ${id} is ${cls}, not evidence`);
      }
    }
    if (typeof e.says !== 'string' || e.says.trim() === '') out.push(`${at}: says is empty`);
    if (typeof e.source !== 'string' || !/^https:\/\/[^\s]+$/.test(e.source)) out.push(`${at}: source is not an https URL`);
  });
  return out;
}

describe('component map', () => {
  for (const { file, ecosystem } of FILES) {
    it(`${file} is well formed`, () => {
      expect(problems(ecosystem, load(file))).toEqual([]);
    });
  }

  for (const ecosystem of ['cargo', 'swift', 'cocoapods'] as const) {
    it(`${ecosystem}.yml names each package as lexcode names its row, with its own page as source`, () => {
      expect(nameProblems(ecosystem, load(`${ecosystem}.yml`).entries)).toEqual([]);
    });
  }

  it('catches a badly named cargo, swift or cocoapods entry (self-check of the checker)', () => {
    const e = (match: string, source: string) => ({ match, enables: ['crawls_web'], says: 'x', source });
    expect(nameProblems('cargo', [e('async-openai', 'https://crates.io/crates/async-openai')])).toEqual([]);
    expect(nameProblems('cargo', [e('Async-OpenAI', 'https://github.com/64bit/async-openai')])).toHaveLength(2);
    expect(nameProblems('swift', [e('github.com/macpaw/openai', 'https://github.com/MacPaw/OpenAI')])).toEqual([]);
    expect(nameProblems('swift', [e('github.com/macpaw/*', 'https://github.com/MacPaw/OpenAI')])[0]).toContain(
      'not a lowercased swift name',
    );
    expect(nameProblems('swift', [e('github.com/macpaw/openai', 'https://github.com/MacPaw/Other')])[0]).toContain(
      'source names github.com/macpaw/other',
    );
    expect(nameProblems('cocoapods', [e('firebase/analytics', 'https://cocoapods.org/pods/FirebaseAnalytics')])).toEqual([]);
    expect(nameProblems('cocoapods', [e('Firebase/Analytics', 'https://cocoapods.org/pods/Firebase')])[0]).toContain(
      'not a lowercased cocoapods name',
    );
  });

  it('golang.org/x/crypto enables nothing: Go links only the subpackages an app imports (#13318)', () => {
    // An app that imports only x/crypto/bcrypt holds no cipher, so the module in go.mod is not evidence;
    // go-xcrypto-encryption reads the cipher subpackages in the code instead.
    const matches = load('go.yml').entries.map((e) => String(e.match).toLowerCase());
    expect(matches.filter((m) => m === 'golang.org/x/crypto' || m.startsWith('golang.org/x/crypto/'))).toEqual([]);
  });

  it('every ships_encryption entry is a library whose own description is encryption (#13318, #13336)', () => {
    // A general cryptography library that also hashes, MACs or signs has no entry in any map: an app
    // can link one only for a hash or a signature, and the code rules read its cipher calls instead.
    const out: string[] = [];
    for (const { file } of FILES) {
      for (const e of load(file).entries ?? []) {
        if (Array.isArray(e.enables) && e.enables.includes('ships_encryption')) out.push(...encryptionSaysProblems(file, e));
      }
    }
    expect(out).toEqual([]);
  });

  it('catches a mixed cryptography library in a map (self-check of the checker)', () => {
    const e = (match: string, says: string) => ({ match, enables: ['ships_encryption'], says, source: 'https://x.test' });
    expect(encryptionSaysProblems('npm.yml', e('aes-js', 'A pure JavaScript implementation of the AES block cipher.'))).toEqual([]);
    expect(encryptionSaysProblems('npm.yml', e('@noble/ciphers', 'Audited & minimal JS implementation of Salsa20, ChaCha and AES'))).toEqual([]);
    for (const [match, says] of [
      ['crypto-js', 'JavaScript library of crypto standards.'],
      ['node-forge', 'JavaScript implementations of network transports, cryptography, ciphers, PKI, message digests, and various utilities.'],
      ['cryptography', 'cryptography is a package which provides cryptographic recipes and primitives to Python developers.'],
      ['rsa', 'Pure-Python RSA implementation'],
      ['phpseclib/phpseclib', 'PHP Secure Communications Library - Pure-PHP implementations of RSA, AES, SSH2, SFTP, X.509 etc.'],
      ['org.bouncycastle:bcprov-jdk18on', 'The Bouncy Castle Crypto package is a Java implementation of cryptographic algorithms.'],
      ['openpgp', 'OpenPGP.js is a Javascript implementation of the OpenPGP protocol. This is defined in RFC 4880.'],
      ['github.com/apple/swift-crypto', 'Open-source implementation of a substantial portion of the API of Apple CryptoKit suitable for use on Linux platforms.'],
    ] as const) {
      expect(encryptionSaysProblems('x.yml', e(match, says)), match).toHaveLength(1);
    }
  });

  it('catches a bad entry (self-check of the checker)', () => {
    const bad = {
      ecosystem: 'npm',
      entries: [
        { match: 'a', enables: ['tracks_devices'], says: 'x', source: 'https://example.com' },
        { match: 'a', enables: ['serves_minors'], says: '', source: 'http://example.com' },
        { match: 'b', enables: ['is_bank'], says: 'x', source: 'https://example.com' },
        { match: 'c', enables: [], says: 'x', source: 'https://example.com' },
        { match: 'd', enables: ['ghost'], says: 'x', source: 'https://example.com' },
      ],
    };
    const p = problems('npm', bad);
    expect(p.some((x) => x.includes('duplicate match'))).toBe(true);
    expect(p.some((x) => x.includes('serves_minors is declaration-only'))).toBe(true);
    expect(p.some((x) => x.includes('says is empty'))).toBe(true);
    expect(p.some((x) => x.includes('not an https URL'))).toBe(true);
    expect(p.some((x) => x.includes('is_bank is declaration-only'))).toBe(true);
    expect(p.some((x) => x.includes('enables is empty'))).toBe(true);
    expect(p.some((x) => x.includes('ghost is not in classes.yml'))).toBe(true);
  });
});
