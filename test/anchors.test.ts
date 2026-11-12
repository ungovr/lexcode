import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative } from 'node:path';
import { stringify } from 'yaml';
import { ensureEngine } from '../src/engine/fetch.js';
import { runEngine, type RunEngineResult } from '../src/engine/run.js';
import { bundledRulesDir, loadRuleSet, readRuleFile } from '../src/rules/load.js';

// A `pattern-regex` conjunct in a `patterns` list is a pre-filter: it lets the engine skip files
// that cannot match, and it must admit every shape the rule's other patterns match. For every
// Ruby rule that has one, this test builds an anchor-less twin (the same rule with every such
// conjunct removed), runs shipped and twin over the rule's own positive fixture in ONE engine
// run, and fails on any line the twin matches that the shipped rule does not. The fixture must
// therefore carry the shapes a narrow anchor drops (paren-less, multi-line, `&.`, a comment
// line between the tokens); CONTRIBUTING.md names them.

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Matchers whose presence in a `patterns` list makes a sibling `pattern-regex` a conjunct. */
const MATCHERS = new Set(['pattern', 'pattern-either', 'patterns', 'pattern-inside']);

/** Paths (from the rule body) of every `pattern-regex` item that sits in a `patterns` list beside a matcher. */
function conjunctAnchors(body: unknown, path: (string | number)[] = []): (string | number)[][] {
  const found: (string | number)[][] = [];
  if (Array.isArray(body)) {
    body.forEach((v, i) => found.push(...conjunctAnchors(v, [...path, i])));
  } else if (isObj(body)) {
    for (const [k, v] of Object.entries(body)) {
      if (k === 'patterns' && Array.isArray(v)) {
        const hasMatcher = v.some((it) => isObj(it) && Object.keys(it).some((key) => MATCHERS.has(key)));
        if (hasMatcher) {
          v.forEach((it, i) => {
            if (isObj(it) && 'pattern-regex' in it) found.push([...path, k, i]);
          });
        }
      }
      found.push(...conjunctAnchors(v, [...path, k]));
    }
  }
  return found;
}

function withoutAt(body: Obj, paths: (string | number)[][]): Obj {
  const copy = structuredClone(body);
  // Deepest and last first, so earlier indices stay valid.
  const order = [...paths].sort((a, b) => b.join('.').localeCompare(a.join('.'), undefined, { numeric: true }));
  for (const p of order) {
    let parent: unknown = copy;
    for (const seg of p.slice(0, -1)) parent = (parent as Obj)[seg as string];
    (parent as unknown[]).splice(p[p.length - 1] as number, 1);
  }
  return copy;
}

/**
 * Ruby rules that contain a `pattern-regex` but have no conjunct anchor to remove, each with the
 * reason. A rule not listed here that has a `pattern-regex` anywhere must be checked below.
 */
const NOT_A_PREFILTER: Record<string, string> = {
  'lexcode.aggregate.rb-news-api-call': 'the regex is the matcher: a URL literal in a pattern-either beside AST patterns',
  'lexcode.social.rb-home-feed': 'the regex is the matcher: the rule is two pattern-regex alternatives',
  'lexcode.consumer.rb-signup-route': 'the regex is the matcher: route lines are matched as text in a pattern-either',
  'lexcode.biometric.rb-biometric-rest-apis': 'the regex is the matcher: a rule-level pattern-regex over vendor URLs',
  'lexcode.voice.rb-transcription-http': 'the regex is the matcher: a rule-level pattern-regex over vendor URLs',
  'lexcode.calls.rb-meeting-recording-apis': 'the regex is the matcher: a rule-level pattern-regex over vendor URLs',
  'lexcode.identity.rb-idv-vendor-api-call':
    'the regex is the selector: the URL literal picks the call, and the AST patterns beside it (any Faraday or get call) are only the enclosing context, so a twin without it matches every HTTP call',
};

const rulesDir = bundledRulesDir();
const rs = loadRuleSet();

interface Checked {
  id: string;
  fixture: string;
  anchors: number;
  body: Obj;
  twin: Obj;
}
const checked: Checked[] = [];
const unlisted: string[] = [];
const listedButAbsent: string[] = [];
const seenListed = new Set<string>();
for (const r of rs.rules) {
  if (!r.languages.includes('ruby')) continue;
  const body = readRuleFile(r.file);
  if (!JSON.stringify(body).includes('pattern-regex')) continue;
  const anchors = conjunctAnchors(body);
  if (r.id in NOT_A_PREFILTER) {
    seenListed.add(r.id);
    continue;
  }
  if (anchors.length === 0) {
    unlisted.push(r.id);
    continue;
  }
  const twin = withoutAt(body, anchors);
  twin['id'] = `${r.id}__noanchor`;
  const fixture = join(dirname(r.file), `${basename(r.file, '.yml')}.test.rb`);
  checked.push({ id: r.id, fixture: relative(rulesDir, fixture).split('\\').join('/'), anchors: anchors.length, body, twin });
}
for (const id of Object.keys(NOT_A_PREFILTER)) if (!seenListed.has(id)) listedButAbsent.push(id);

let result: RunEngineResult;
let tmp: string;

beforeAll(async () => {
  const offline = process.env.LEXCODE_OFFLINE === '1';
  const engine = (await ensureEngine({ download: !offline })).path;
  tmp = mkdtempSync(join(tmpdir(), 'lexcode-anchors-'));
  const config = join(tmp, 'rules.yml');
  writeFileSync(config, stringify({ rules: checked.flatMap((c) => [c.body, c.twin]) }));
  result = await runEngine({ engine, configFile: config, targets: [...new Set(checked.map((c) => c.fixture))], root: rulesDir });
});

afterAll(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

describe('Ruby rule anchors admit every shape the rule matches', () => {
  it('every Ruby rule with a pattern-regex is checked or listed with a reason', () => {
    expect(unlisted).toEqual([]);
    expect(listedButAbsent).toEqual([]);
    expect(checked.length).toBeGreaterThan(0);
  });

  it('the engine read every positive fixture', () => {
    expect(result.fileErrors).toBe(0);
  });

  for (const c of checked) {
    it(`${c.id}: no line the anchor-less twin matches is lost`, () => {
      const span = (m: { line: number; lines: string }): [number, number] => [m.line, m.line + (m.lines ? m.lines.split('\n').length : 1) - 1];
      const mine = result.matches.filter((m) => m.path === c.fixture && m.ruleId === c.id).map(span);
      const twin = result.matches.filter((m) => m.path === c.fixture && m.ruleId === `${c.id}__noanchor`);
      expect(twin.length, `${c.fixture}: the twin finds nothing, so the fixture checks nothing`).toBeGreaterThan(0);
      const lost = twin.filter((t) => {
        const [a, b] = span(t);
        return !mine.some(([x, y]) => x <= b && y >= a);
      });
      expect(
        lost.map((t) => `line ${t.line}: ${t.lines.trim().split('\n')[0]}`),
        `${c.id}: the anchor drops these lines the rule's own patterns match; widen the anchor (never the rule) and keep the line in the fixture`,
      ).toEqual([]);
    });
  }
});
