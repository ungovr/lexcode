import { readdirSync } from 'node:fs';
import { basename, dirname, relative } from 'node:path';
import { ToolError } from '../errors.js';
import type { RuleSet } from '../types.js';
import { listRuleFiles, readRuleFile } from './load.js';

const ID_RE = /^lexcode\.[a-z0-9-]+\.[a-z0-9-]+$/;

/**
 * Check every rule file under `dir` (layout `<dir>/<activity>/<stem>.yml`) against the registry
 * in `rs`. Returns problem strings, empty when the set is sound. Problems about fixtures start
 * with `[fixtures]`, every other problem with `[metadata]`.
 */
export function validateRuleFiles(dir: string, rs: RuleSet): string[] {
  const problems: string[] = [];
  const meta = (rel: string, msg: string): void => {
    problems.push(`[metadata] ${rel}: ${msg}`);
  };
  const fixture = (rel: string, msg: string): void => {
    problems.push(`[fixtures] ${rel}: ${msg}`);
  };
  const owners = new Map<string, string>(); // rule id -> file that defines it
  const replaced = new Map<string, string>(); // old id -> file that lists it

  for (const { activity, file } of listRuleFiles(dir)) {
    const rel = relative(dir, file).split('\\').join('/');

    const entry = rs.registry.get(activity);
    if (entry === undefined) meta(rel, `directory ${activity} is not an activity id in the registry`);

    let body: Record<string, unknown> | undefined;
    try {
      body = readRuleFile(file);
    } catch (e) {
      meta(rel, e instanceof ToolError ? e.message : String(e));
    }
    if (body !== undefined) {
      const id = body['id'];
      if (typeof id !== 'string' || !ID_RE.test(id)) {
        meta(rel, `rule id ${String(id)} does not match ${ID_RE.source}`);
      } else {
        const prior = owners.get(id);
        if (prior !== undefined) meta(rel, `rule id ${id} is also defined in ${prior}`);
        else owners.set(id, rel);
      }
      const md = typeof body['metadata'] === 'object' && body['metadata'] !== null && !Array.isArray(body['metadata'])
        ? (body['metadata'] as Record<string, unknown>)
        : {};
      if (md['activity'] !== activity) {
        meta(rel, `metadata.activity is ${String(md['activity'])} but the directory is ${activity}`);
      }
      if (md['mentioned'] !== 'performs' && md['mentioned'] !== 'enables') {
        meta(rel, `metadata.mentioned is ${String(md['mentioned'])}; expected performs or enables`);
      }
      const def = md['definition'];
      if (entry !== undefined && entry.page !== '') {
        if (def !== entry.page) meta(rel, `metadata.definition is ${String(def)}; the registry page is ${entry.page}`);
      } else if (typeof def !== 'string' || def === '') {
        meta(rel, 'metadata.definition is missing');
      }
      if (md['provenance'] !== 'ungovr-original') {
        meta(rel, `metadata.provenance is ${String(md['provenance'])}; expected ungovr-original`);
      }
      if (md['license'] !== 'MIT') meta(rel, `metadata.license is ${String(md['license'])}; expected MIT`);
      if ('cwe' in md || 'cwe' in body) meta(rel, 'a rule must not carry a cwe key');
      if (md['replaces'] !== undefined && !Array.isArray(md['replaces'])) {
        meta(rel, 'metadata.replaces must be a list');
      }
      for (const old of Array.isArray(md['replaces']) ? md['replaces'] : []) {
        if (typeof old !== 'string') continue;
        const prior = replaced.get(old);
        if (prior !== undefined) meta(rel, `${old} is also listed in replaces of ${prior}`);
        else replaced.set(old, rel);
      }
    }

    // Fixtures sit beside the rule: <stem>.test.<ext> and <stem>.neg.test.<ext>.
    const stem = basename(file, '.yml');
    const siblings = readdirSync(dirname(file)).filter((n) => !n.endsWith('.expect'));
    if (!siblings.some((n) => n.startsWith(`${stem}.test.`))) {
      fixture(rel, `no positive fixture (${stem}.test.<ext>)`);
    }
    if (!siblings.some((n) => n.startsWith(`${stem}.neg.test.`))) {
      fixture(rel, `no negative fixture (${stem}.neg.test.<ext>)`);
    }
  }

  for (const [id, where] of replaced) {
    const owner = owners.get(id);
    if (owner !== undefined) meta(where, `replaces ${id}, which is still defined in ${owner}`);
  }
  return problems;
}
