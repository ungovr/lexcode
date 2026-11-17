import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { bundledRulesDir } from '../../src/rules/load.js';

// The C# crawl and feed rules read an HttpClient download with the same blocks: the receiver that
// counts as an HTTP client, the read methods, the filter that drops a download of a path relative to
// the client's BaseAddress, and (in the two rules that read a download inside another call) one
// metavariable-pattern holding all of them. Each was copied by hand and the copies drifted (#13214):
// one rule took `new WebClient()` by its text, another listed WebClient's methods in its filter but
// not in its reader. Inside a rule the copies are YAML anchors; across rules this test keeps them
// equal, so a change made to one copy fails here until it is made in every rule below.

const STEMS = [
  'aggregates_content/cs-feed-read',
  'crawls_web/cs-html-of-fetched-page',
  'crawls_web/cs-fetch-extracted-link',
  'crawls_web/cs-fetch-loop-over-urls',
];

/** The two rules that read an HttpClient download inside a parser or feed-reader call. */
const DOWNLOAD_STEMS = ['aggregates_content/cs-feed-read', 'crawls_web/cs-html-of-fetched-page'];

type Node = unknown;

const load = (stem: string): Node =>
  (parse(readFileSync(join(bundledRulesDir(), `${stem}.yml`), 'utf8')) as { rules: Node[] }).rules[0];

/** Every object under `node` (depth first), the node itself included. */
function objects(node: Node): Record<string, unknown>[] {
  if (Array.isArray(node)) return node.flatMap(objects);
  if (node === null || typeof node !== 'object') return [];
  const o = node as Record<string, unknown>;
  return [o, ...Object.values(o).flatMap(objects)];
}

/** The regexes of every `metavariable-regex` on `metavariable` whose regex passes `keep`. */
function regexesOn(stem: string, metavariables: string[], keep: (rx: string) => boolean): string[] {
  return objects(load(stem))
    .map((o) => o['metavariable-regex'] as { metavariable?: string; regex?: string } | undefined)
    .filter((m): m is { metavariable: string; regex: string } => typeof m?.regex === 'string' && typeof m.metavariable === 'string')
    .filter((m) => metavariables.includes(m.metavariable) && keep(m.regex))
    .map((m) => m.regex);
}

/** Every metavariable-pattern's `patterns` that reads an HttpClient call (it names `$HC.$GET`). */
function httpGetBlocks(stem: string): unknown[] {
  return objects(load(stem))
    .map((o) => o['metavariable-pattern'] as { patterns?: unknown } | undefined)
    .filter((m) => m?.patterns !== undefined && JSON.stringify(m.patterns).includes('$HC.$GET('))
    .map((m) => m?.patterns);
}

const distinct = (xs: unknown[]): string[] => [...new Set(xs.map((x) => JSON.stringify(x)))];

describe('the C# crawl and feed rules share their HttpClient blocks', () => {
  it('every rule reads an HTTP client receiver with the one regex', () => {
    const all = STEMS.flatMap((s) => regexesOn(s, ['$HC', '$C'], (rx) => rx.includes('CreateClient')));
    expect(all.length).toBeGreaterThanOrEqual(STEMS.length);
    expect(distinct(all)).toHaveLength(1);
  });

  it("every rule reads HttpClient's GET methods with the one regex", () => {
    const all = STEMS.flatMap((s) => regexesOn(s, ['$GET'], (rx) => rx.startsWith('^Get(')));
    expect(all.length).toBeGreaterThanOrEqual(STEMS.length);
    expect(distinct(all)).toHaveLength(1);
  });

  it('the download rules hold one metavariable-pattern and one relative-address filter between them', () => {
    const blocks = DOWNLOAD_STEMS.flatMap(httpGetBlocks);
    expect(blocks.length).toBeGreaterThanOrEqual(DOWNLOAD_STEMS.length);
    expect(distinct(blocks)).toHaveLength(1);
    const filters = DOWNLOAD_STEMS.flatMap((s) => regexesOn(s, ['$SRC', '$FETCH'], (rx) => rx.includes('Async\\(')));
    expect(filters.length).toBeGreaterThanOrEqual(DOWNLOAD_STEMS.length);
    expect(distinct(filters)).toHaveLength(1);
  });

  // System.Net.WebClient is in no implicitly imported namespace, so a rule reads it by its full type
  // name where the file's `using` lines are seen, never by its text (an app's own WebClient would pass).
  it('no rule reads WebClient by its text', () => {
    for (const stem of STEMS) {
      const texts = objects(load(stem)).flatMap((o) =>
        Object.entries(o)
          .filter(([k, v]) => (k === 'regex' || k === 'pattern-regex') && typeof v === 'string' && /WebClient/.test(v))
          .map(([, v]) => v as string),
      );
      expect(texts, stem).toEqual([]);
    }
  });
});
