import type { EngineMatch, RuleMeta, RuleSet, ScopeInfo } from '../../src/types.js';
import { makeRuleSet } from './ruleset.js';

export const SCOPE: ScopeInfo = {
  include: [],
  exclude: [],
  include_tests: false,
  files: 10,
  extracted: 0,
  dev_dependencies_skipped: 0,
};

export const NOW = new Date('2026-11-03T12:34:56.789Z');

/** The small hand-built rule set plus extra rules. */
export function ruleSetWith(extra: Partial<RuleMeta>[] = [], extraClasses: Record<string, 'evidence' | 'signal' | 'declaration-only'> = {}): RuleSet {
  const rs = makeRuleSet();
  for (const [id, cls] of Object.entries(extraClasses)) rs.classes.set(id, cls);
  for (const e of extra) {
    rs.rules.push({
      id: 'lexcode.x.y',
      file: '/nowhere/x.yml',
      activity: 'processes_voice',
      mentioned: 'performs',
      strength: 'evidence',
      definition: 'https://lexlint.io/activities/processes_voice',
      languages: ['python'],
      message: 'a test rule',
      replaces: [],
      ...e,
    });
  }
  return rs;
}

export function match(ruleId: string, path: string, line: number, metavars: Record<string, string> = {}, lines = 'call(x)'): EngineMatch {
  return { ruleId, path, line, metavars, lines };
}
