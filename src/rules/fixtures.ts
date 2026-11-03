import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { ToolError } from '../errors.js';
import { listRuleFiles, readRuleFile } from './load.js';

/**
 * One fixture file and the rule it is written for. A positive fixture (`<stem>.test.<ext>`) must
 * produce `expected` matches of `ruleId`. A negative fixture (`<stem>.neg.test.<ext>`) must
 * produce none from any rule of the same activity.
 */
export interface FixtureCase {
  kind: 'positive' | 'negative';
  ruleId: string;
  /** The rule's directory name, which is its activity id. */
  activity: string;
  rulePath: string;
  fixture: string;
}

/**
 * A comment opener, then `lexcode-expect: N`. The opener keeps the marker out of string
 * literals and code; `*` lets a block comment's continuation line carry the header too.
 */
const HEADER_RE = /(?:#|\/\/|\/\*|<!--|--|^\s*\*)[^\n]*?\blexcode-expect:\s*(\d+)\b/;

/** Pair every rule under `rulesDir` (layout `<rulesDir>/<activity>/<stem>.yml`) with its fixtures, sorted. */
export function discoverFixtures(rulesDir: string): FixtureCase[] {
  const cases: FixtureCase[] = [];
  for (const { activity, file } of listRuleFiles(rulesDir)) {
    const ruleId = readRuleFile(file)['id'];
    if (typeof ruleId !== 'string') throw new ToolError(`${file}: the rule has no id`);
    const stem = basename(file, '.yml');
    const names = readdirSync(dirname(file))
      .filter((n) => !n.endsWith('.expect'))
      .sort();
    for (const name of names) {
      const kind = name.startsWith(`${stem}.neg.test.`) ? 'negative' : name.startsWith(`${stem}.test.`) ? 'positive' : undefined;
      if (kind === undefined) continue;
      cases.push({ kind, ruleId, activity, rulePath: file, fixture: join(dirname(file), name) });
    }
  }
  return cases;
}

function parseCount(text: string, where: string): number {
  if (!/^\d+$/.test(text.trim())) {
    throw new ToolError(`${where}: expected a single non-negative integer, found ${JSON.stringify(text.trim().slice(0, 40))}`);
  }
  return Number(text.trim());
}

/**
 * The match count a fixture declares. `<fixture>.expect` (one integer) wins when present and is
 * required for a `.json` fixture, which cannot hold a comment. Every other fixture carries
 * `lexcode-expect: N` inside a comment on line 1 or 2.
 */
export function expectedCount(fixture: string): number {
  const sidecar = `${fixture}.expect`;
  if (existsSync(sidecar)) return parseCount(readFileSync(sidecar, 'utf8'), sidecar);
  if (fixture.endsWith('.json')) {
    throw new ToolError(`${fixture}: a JSON fixture declares its count in ${sidecar}, which is missing`);
  }
  const head = readFileSync(fixture, 'utf8').split(/\r?\n/).slice(0, 2);
  for (const line of head) {
    const m = HEADER_RE.exec(line);
    if (m?.[1] !== undefined) return Number(m[1]);
  }
  throw new ToolError(`${fixture}: no \`lexcode-expect: N\` header in a comment on line 1 or 2`);
}
