import { posix } from 'node:path';
import { classOf } from '../rules/load.js';
import type {
  ActivityRow,
  ComponentRow,
  EngineMatch,
  Evidence,
  EvidenceRecord,
  Mentioned,
  NotFoundRow,
  RuleMeta,
  RuleSet,
  ScopeInfo,
  Sidecar,
  SignalRow,
} from '../types.js';
import { isOwnHost, urlLiteral } from './hosts.js';

export interface BuildInput {
  matches: EngineMatch[];
  manifestEvidence: { id: string; ev: Evidence }[];
  components: ComponentRow[];
  rs: RuleSet;
  /** Per activity: source rules run plus component-map entries consulted (see `countRulesRun`). */
  rulesRun: Map<string, number>;
  scope: ScopeInfo;
  sidecar?: Sidecar;
  engineVersion: string;
  snippets: boolean;
  now: Date;
  fileErrors: number;
  /** Notices the scan collected before the record was built; they come first. */
  notices?: string[];
}

// ---- which files a rule's languages read ---------------------------------------------------

const LANGUAGE_EXTENSIONS: Record<string, string[]> = {
  python: ['.py', '.pyi'],
  javascript: ['.js', '.jsx', '.mjs', '.cjs'],
  typescript: ['.ts', '.tsx', '.mts', '.cts'],
  go: ['.go'],
  json: ['.json'],
  yaml: ['.yml', '.yaml'],
  xml: ['.xml', '.plist'],
  java: ['.java'],
  kotlin: ['.kt', '.kts'],
  swift: ['.swift'],
  ruby: ['.rb'],
  php: ['.php'],
};
const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  python2: 'python',
  python3: 'python',
  golang: 'go',
  yml: 'yaml',
};

/** The extensions a rule reads, or `'all'` for `generic`, `regex` and any language lexcode does not map. */
function extensionsOf(rule: RuleMeta): string[] | 'all' {
  const out: string[] = [];
  for (const raw of rule.languages) {
    const lang = LANGUAGE_ALIASES[raw.toLowerCase()] ?? raw.toLowerCase();
    const exts = LANGUAGE_EXTENSIONS[lang];
    if (exts === undefined) return 'all';
    out.push(...exts);
  }
  return out;
}

/** The files worth handing to the engine: every file when any rule reads any file, else those with a rule's extension. */
export function engineTargets(rules: RuleMeta[], files: string[]): string[] {
  const wanted = new Set<string>();
  for (const r of rules) {
    const exts = extensionsOf(r);
    if (exts === 'all') return files;
    for (const e of exts) wanted.add(e);
  }
  return files.filter((f) => wanted.has(posix.extname(f).toLowerCase()));
}

/**
 * Per activity: the source rules that had at least one in-scope file to read, plus the
 * component-map entries that enable it in an ecosystem whose manifests were found. `files`
 * lists in-scope files including extracted script blocks (`x.vue.lexcode.ts`). A `files`
 * entry reads the file list on every scan, so it always counts.
 */
export function countRulesRun(rs: RuleSet, rules: RuleMeta[], files: string[], ecosystems: ReadonlySet<string>): Map<string, number> {
  const present = new Set(files.map((f) => posix.extname(f).toLowerCase()));
  const out = new Map<string, number>();
  const bump = (id: string): void => void out.set(id, (out.get(id) ?? 0) + 1);
  for (const r of rules) {
    const exts = extensionsOf(r);
    const ran = files.length > 0 && (exts === 'all' || exts.some((e) => present.has(e)));
    if (ran) bump(r.activity);
  }
  for (const c of rs.components) {
    if (c.ecosystem !== 'files' && !ecosystems.has(c.ecosystem)) continue;
    for (const id of c.enables) bump(id);
  }
  return out;
}

// ---- the record ------------------------------------------------------------------------------

interface Item {
  id: string;
  mentioned: Mentioned;
  strength: 'evidence' | 'signal';
  ruleId: string;
  path: string;
  line: number;
  ev: Evidence;
}

function splitWhere(where: string): { path: string; line: number } {
  const i = where.lastIndexOf(':');
  const n = i < 0 ? NaN : Number(where.slice(i + 1));
  return Number.isInteger(n) && n >= 0 ? { path: where.slice(0, i), line: n } : { path: where, line: 0 };
}

function firstLine(text: string, max: number): string {
  const line = (text.split(/\r?\n/)[0] ?? '').trim();
  return line.length > max ? line.slice(0, max) : line;
}

/** A sidecar `where`: a file, a directory (trailing `/` or not), or `file:line`. */
function whereMatches(where: string, item: Item): boolean {
  const at = /^(.*):(\d+)$/.exec(where);
  if (at) return item.path === at[1] && item.line === Number(at[2]);
  if (where.endsWith('/')) return item.path.startsWith(where);
  return item.path === where || item.path.startsWith(`${where}/`);
}

function compareItems(a: Item, b: Item): number {
  if (a.path !== b.path) return a.path < b.path ? -1 : 1;
  if (a.line !== b.line) return a.line - b.line;
  return a.ruleId < b.ruleId ? -1 : a.ruleId > b.ruleId ? 1 : 0;
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

export function buildRecord(i: BuildInput): EvidenceRecord {
  const { rs } = i;
  const ruleById = new Map<string, RuleMeta>(rs.rules.map((r) => [r.id, r]));
  const ownHosts = i.sidecar?.own_hosts ?? [];
  const items: Item[] = [];
  let droppedByHost = 0;

  for (const m of i.matches) {
    const rule = ruleById.get(m.ruleId);
    if (!rule) continue;
    const cls = classOf(rule.activity, rs);
    if (cls === 'declaration-only') continue;
    let strength: Item['strength'] = cls === 'signal' ? 'signal' : rule.strength;
    const ev: Evidence = { rule: rule.id, where: `${m.path}:${m.line}` };
    if (rule.hostMetavar !== undefined) {
      const value = m.metavars[rule.hostMetavar];
      const url = value === undefined ? ({ literal: false } as const) : urlLiteral(value);
      if (url.literal) {
        if (url.host === null || isOwnHost(url.host, ownHosts)) {
          droppedByHost += 1;
          continue;
        }
        ev.host = url.host;
      } else {
        strength = 'signal';
      }
    }
    if (i.snippets) {
      const snippet = firstLine(m.lines, 200);
      if (snippet !== '') ev.snippet = snippet;
    }
    items.push({ id: rule.activity, mentioned: rule.mentioned, strength, ruleId: rule.id, path: m.path, line: m.line, ev });
  }

  for (const { id, ev } of i.manifestEvidence) {
    const cls = classOf(id, rs);
    if (cls === 'declaration-only') continue;
    const { path, line } = splitWhere(ev.where);
    items.push({ id, mentioned: 'enables', strength: cls === 'signal' ? 'signal' : 'evidence', ruleId: ev.rule, path, line, ev: { ...ev } });
  }

  // Sidecar ignores: each entry records how many pieces of evidence it removed.
  const ignored: EvidenceRecord['ignored'] = [];
  const notices: string[] = [...(i.notices ?? [])];
  const removed = new Set<Item>();
  for (const ig of i.sidecar?.ignore ?? []) {
    let matched = 0;
    for (const item of items) {
      const sameRule = item.ruleId === ig.rule || (ruleById.get(item.ruleId)?.replaces ?? []).includes(ig.rule);
      if (!sameRule || (ig.where !== undefined && !whereMatches(ig.where, item))) continue;
      matched += 1;
      removed.add(item);
    }
    ignored.push(ig.where === undefined ? { rule: ig.rule, matched } : { rule: ig.rule, where: ig.where, matched });
    if (matched === 0) {
      notices.push(
        `the ignore for ${ig.rule}${ig.where === undefined ? '' : ` at ${ig.where}`} matched nothing; remove it from .lexcode.yml, or correct its rule id or path`,
      );
    }
  }
  const kept = items.filter((it) => !removed.has(it)).sort(compareItems);

  const dedupe = (list: Item[]): Evidence[] => {
    const seen = new Set<string>();
    const out: Evidence[] = [];
    for (const it of list) {
      const key = `${it.ev.rule}\0${it.ev.where}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(it.ev);
    }
    return out;
  };

  const grouped = new Map<string, Item[]>();
  const signalGroups = new Map<string, Item[]>();
  for (const it of kept) {
    const target = it.strength === 'signal' ? signalGroups : grouped;
    const key = it.strength === 'signal' ? it.id : `${it.id}\0${it.mentioned}`;
    const list = target.get(key);
    if (list) list.push(it);
    else target.set(key, [it]);
  }

  const activities: ActivityRow[] = [...grouped.values()]
    .map((list) => ({ id: (list[0] as Item).id, mentioned: (list[0] as Item).mentioned, evidence: dedupe(list) }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : a.mentioned === b.mentioned ? 0 : a.mentioned === 'performs' ? -1 : 1));
  const signals: SignalRow[] = [...signalGroups.entries()]
    .map(([id, list]) => ({ id, evidence: dedupe(list) }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const withEvidence = new Set(activities.map((a) => a.id));
  const searched_not_found: NotFoundRow[] = [...i.rulesRun.entries()]
    .filter(([id, n]) => n > 0 && classOf(id, rs) === 'evidence' && !withEvidence.has(id))
    .map(([id, rules]) => ({ id, rules }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const components: ComponentRow[] = i.components
    .map((c) => ({ ...c, enables: c.enables.filter((id) => classOf(id, rs) !== 'declaration-only') }))
    .filter((c) => c.enables.length > 0)
    .sort((a, b) => (a.purl < b.purl ? -1 : a.purl > b.purl ? 1 : a.manifest < b.manifest ? -1 : a.manifest > b.manifest ? 1 : 0));

  if (droppedByHost > 0) {
    notices.push(
      `${droppedByHost} ${plural(droppedByHost, 'match was', 'matches were')} dropped because the URL names the operator's own host or a loopback address; list more of your hosts under own_hosts in .lexcode.yml`,
    );
  }
  if (rs.rules.length === 0) {
    notices.push('the rule set holds no source rules, so only dependency manifests and file names were read');
  }
  if (i.fileErrors > 0) {
    notices.push(
      i.fileErrors === 1
        ? 'the engine could not read 1 file; its evidence is missing from this record'
        : `the engine could not read ${i.fileErrors} files; their evidence is missing from this record`,
    );
  }

  return {
    schema: 'https://lexlint.io/lexcode/v1',
    engine: { name: 'opengrep', version: i.engineVersion },
    rules: { name: 'lexcode-rules', version: rs.version },
    registry: 'https://lexlint.io/activities/v1',
    registry_version: rs.registryVersion,
    scanned_at: i.now.toISOString().replace(/\.\d+Z$/, 'Z'),
    root: '.',
    scope: i.scope,
    activities,
    signals,
    searched_not_found,
    components,
    ignored,
    notices,
  };
}
