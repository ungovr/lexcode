import { matchComponents } from '../components/match.js';
import { ToolError } from '../errors.js';
import { classOf, loadRuleSet } from '../rules/load.js';
import type { Dependency, RuleMeta, RuleSet } from '../types.js';
import { USAGE } from '../usage.js';
import { defaultIo, flag, parseFlags, strList, UsageError, type Io } from './args.js';
import { fromCwd } from './fsutil.js';

const CLASS_MEANING: Record<string, string> = {
  evidence: 'a match is evidence of the activity',
  signal: 'a match is shown as a question and never fails a check',
  'declaration-only': 'never read from code; only a declaration can carry it',
};

const PURL_ECOSYSTEM: Record<string, Dependency['ecosystem']> = { npm: 'npm', pypi: 'pypi', golang: 'golang', gem: 'gem', maven: 'maven', composer: 'composer' };

type Explained =
  | { kind: 'purl'; purl: string; enables: string[]; unsupported?: string }
  | { kind: 'activity'; id: string }
  | { kind: 'rule'; rule: RuleMeta; renamedFrom?: string };

function decode(s: string, purl: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    throw new ToolError(`${purl} is not a valid package URL: bad percent-encoding. Write an npm scope as pkg:npm/%40scope/name@1.0.0.`);
  }
}

/** pkg:<type>/<namespace/name>[@version][?qualifiers][#subpath] */
function parsePurl(purl: string): { type: string; name: string; version?: string } {
  const body = purl.replace(/[?#].*$/, '');
  const m = /^pkg:([A-Za-z0-9.+-]+)\/(.+?)(?:@([^@/]+))?$/.exec(body);
  if (!m) throw new ToolError(`${purl} is not a valid package URL. The form is pkg:<type>/<name>@<version>, for example pkg:npm/%40segment/analytics-next@1.77.0.`);
  const name = (m[2] as string).split('/').map((seg) => decode(seg, purl)).join('/');
  const version = m[3] === undefined ? undefined : decode(m[3], purl);
  return { type: (m[1] as string).toLowerCase(), name, ...(version === undefined ? {} : { version }) };
}

function resolveArg(arg: string, rs: RuleSet): Explained {
  if (arg.startsWith('pkg:')) {
    const parsed = parsePurl(arg);
    const ecosystem = PURL_ECOSYSTEM[parsed.type];
    if (ecosystem === undefined) return { kind: 'purl', purl: arg, enables: [], unsupported: parsed.type };
    // A Maven purl is pkg:maven/<group>/<artifact>; the dependency name is <group>:<artifact>.
    const name = ecosystem === 'maven' ? parsed.name.replace(/\/([^/]*)$/, ':$1') : parsed.name;
    const dep: Dependency = { ecosystem, name, ...(parsed.version ? { version: parsed.version } : {}), manifest: 'purl' };
    const hit = matchComponents([dep], [], rs.components).components[0];
    return { kind: 'purl', purl: arg, enables: hit ? [...hit.enables] : [] };
  }
  if (rs.registry.has(arg) || rs.classes.has(arg)) return { kind: 'activity', id: arg };
  const rule = rs.rules.find((r) => r.id === arg);
  if (rule) return { kind: 'rule', rule };
  const renamed = rs.rules.find((r) => r.replaces.includes(arg));
  if (renamed) return { kind: 'rule', rule: renamed, renamedFrom: arg };
  throw new ToolError(
    `"${arg}" is not an activity id, a rule id or a package URL. Run \`lexcode rules\` to list the rules; activity ids are the ones in the pinned registry (version ${rs.registryVersion}).`,
  );
}

function activityJson(id: string, rs: RuleSet): Record<string, unknown> {
  const e = rs.registry.get(id);
  const rules = rs.rules.filter((r) => r.activity === id).map((r) => r.id);
  return {
    id,
    kind: 'activity',
    term: e?.term ?? '',
    class: classOf(id, rs),
    held: e?.status === 'held',
    definition: e?.lint_definition ?? '',
    page: e?.page ?? '',
    parent: e?.parent ?? null,
    children: [...rs.registry.values()].filter((x) => x.parent === id).map((x) => x.id),
    rules,
    component_entries: rs.components.filter((c) => c.enables.includes(id)).length,
  };
}

function ruleJson(r: RuleMeta, renamedFrom?: string): Record<string, unknown> {
  return {
    id: r.id,
    kind: 'rule',
    activity: r.activity,
    mentioned: r.mentioned,
    strength: r.strength,
    languages: r.languages,
    message: r.message,
    definition: r.definition,
    replaces: r.replaces,
    ...(renamedFrom ? { renamed_from: renamedFrom } : {}),
  };
}

function activityText(id: string, rs: RuleSet): string {
  const j = activityJson(id, rs);
  const cls = j.class as string;
  const lines = [`${id}${j.term ? `  (${String(j.term)})` : ''}`, `class: ${cls} (${CLASS_MEANING[cls] ?? ''})`];
  if (j.held) {
    lines.push(`definition: held in the registry: the registry lists this id but has not published a definition for it yet. Its term is "${String(j.term)}".`);
  } else {
    lines.push(`definition: ${String(j.definition)}`, `page: ${String(j.page)}`);
  }
  if (j.parent) lines.push(`family: a kind of ${String(j.parent)}`);
  const children = j.children as string[];
  if (children.length > 0) lines.push(`family: its kinds are ${children.join(', ')}`);
  const rules = j.rules as string[];
  lines.push(rules.length > 0 ? `rules (${rules.length}): ${rules.join(', ')}` : 'rules: none in this rule set');
  lines.push(`dependency map: ${String(j.component_entries)} ${j.component_entries === 1 ? 'entry enables' : 'entries enable'} it`);
  return lines.join('\n');
}

function ruleText(r: RuleMeta, renamedFrom?: string): string {
  const lines = [r.id];
  if (renamedFrom) lines.push(`renamed: ${renamedFrom} is now ${r.id}`);
  lines.push(
    `activity: ${r.activity}`,
    `mentioned: ${r.mentioned}`,
    `strength: ${r.strength}`,
    `languages: ${r.languages.join(', ')}`,
    `message: ${r.message}`,
    `definition: ${r.definition}`,
  );
  if (r.replaces.length > 0) lines.push(`replaces: ${r.replaces.join(', ')}`);
  return lines.join('\n');
}

function purlText(e: Extract<Explained, { kind: 'purl' }>): string {
  if (e.unsupported) {
    return `${e.purl}\nlexcode reads npm, PyPI, Go, RubyGems and Maven packages, so a "${e.unsupported}" package has no entry in the dependency map.`;
  }
  return e.enables.length > 0
    ? `${e.purl}\nenables: ${e.enables.join(', ')}`
    : `${e.purl}\nno entry in the dependency map. A package with no entry says nothing about what the code does.`;
}

/** `deps.rs` replaces the loaded rule set (tests). */
export async function runExplainCommand(argv: string[], io: Io = defaultIo(), deps: { rs?: RuleSet } = {}): Promise<number> {
  const p = parseFlags(argv, { json: { type: 'boolean' }, rules: { type: 'string', multiple: true } }, { min: 0, max: Infinity, what: 'an activity id, a rule id or a package URL' });
  if (flag(p, 'help')) {
    io.stdout(USAGE);
    return 0;
  }
  if (p.positionals.length === 0) throw new UsageError('explain needs an activity id, a rule id or a package URL');
  const rs = deps.rs ?? loadRuleSet(strList(p, 'rules').map(fromCwd));
  // Resolve every argument first so a mistake prints nothing half-answered.
  const items = p.positionals.map((a) => resolveArg(a, rs));

  if (flag(p, 'json')) {
    const docs = items.map((e) =>
      e.kind === 'purl' ? { purl: e.purl, enables: e.enables } : e.kind === 'activity' ? activityJson(e.id, rs) : ruleJson(e.rule, e.renamedFrom),
    );
    io.stdout(`${JSON.stringify(docs.length === 1 ? docs[0] : docs, null, 2)}\n`);
    return 0;
  }
  io.stdout(
    `${items
      .map((e) => (e.kind === 'purl' ? purlText(e) : e.kind === 'activity' ? activityText(e.id, rs) : ruleText(e.rule, e.renamedFrom)))
      .join('\n\n')}\n`,
  );
  return 0;
}
