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
  { file: 'files.yml', ecosystem: 'files' },
] as const;

interface Entry {
  match?: unknown;
  enables?: unknown;
  says?: unknown;
  source?: unknown;
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
