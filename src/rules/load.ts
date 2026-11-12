import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';
import { ToolError } from '../errors.js';
import type {
  ComponentEntry,
  DetectionClass,
  Mentioned,
  RegistryEntry,
  RuleMeta,
  RuleSet,
} from '../types.js';

type Obj = Record<string, unknown>;

const CLASSES: readonly DetectionClass[] = ['evidence', 'signal', 'declaration-only'];
const ECOSYSTEMS = ['npm', 'pypi', 'golang', 'gem', 'maven', 'composer', 'files'] as const;

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * The rule set's home: the directory holding ruleset.yml, classes.yml, registry.snapshot.json and
 * components/. LEXCODE_RULES_HOME replaces it (a rules home for tests, or a vendored rule set); unset,
 * it is the package's rules/ directory, which from src/rules/ and from dist/rules/ is two levels up.
 */
export function bundledRulesDir(): string {
  const override = process.env.LEXCODE_RULES_HOME;
  if (override) return resolve(override);
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'rules');
}

function readYaml(file: string): unknown {
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (e) {
    throw new ToolError(`cannot read ${file}: ${(e as Error).message}`);
  }
  try {
    return parse(text);
  } catch (e) {
    throw new ToolError(`cannot parse ${file}: ${(e as Error).message}`);
  }
}

/** Every `<dir>/<activity>/<stem>.yml` that is not a fixture (name contains `.test.`), sorted. */
export function listRuleFiles(dir: string): { activity: string; file: string }[] {
  const out: { activity: string; file: string }[] = [];
  if (!existsSync(dir)) return out;
  for (const sub of readdirSync(dir).sort()) {
    if (sub === 'components') continue;
    const subPath = join(dir, sub);
    if (!statSync(subPath).isDirectory()) continue;
    for (const name of readdirSync(subPath).sort()) {
      if (!name.endsWith('.yml') || name.includes('.test.')) continue;
      out.push({ activity: sub, file: join(subPath, name) });
    }
  }
  return out;
}

/** A rule file holds exactly one rule; returns its body unchanged. */
export function readRuleFile(file: string): Obj {
  const doc = readYaml(file);
  const rules = isObj(doc) ? doc['rules'] : undefined;
  if (!Array.isArray(rules) || rules.length !== 1 || !isObj(rules[0])) {
    const n = Array.isArray(rules) ? rules.length : 0;
    throw new ToolError(`${file}: a rule file holds exactly one rule, found ${n}`);
  }
  return rules[0];
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function toRuleMeta(file: string, body: Obj): RuleMeta {
  const id = body['id'];
  if (typeof id !== 'string' || id === '') throw new ToolError(`${file}: the rule has no id`);
  const meta = isObj(body['metadata']) ? body['metadata'] : {};
  const activity = meta['activity'];
  if (typeof activity !== 'string' || activity === '') {
    throw new ToolError(`${file}: rule ${id} has no metadata.activity`);
  }
  const mentioned = meta['mentioned'];
  if (mentioned !== 'performs' && mentioned !== 'enables') {
    throw new ToolError(`${file}: rule ${id} needs metadata.mentioned of performs or enables`);
  }
  const strength = meta['strength'] === 'signal' ? 'signal' : 'evidence';
  const hostMetavar = meta['host_metavar'];
  const rule: RuleMeta = {
    id,
    file,
    activity,
    mentioned: mentioned as Mentioned,
    strength,
    definition: typeof meta['definition'] === 'string' ? meta['definition'] : '',
    languages: strList(body['languages']),
    message: typeof body['message'] === 'string' ? body['message'] : '',
    replaces: strList(meta['replaces']),
  };
  if (typeof hostMetavar === 'string') rule.hostMetavar = hostMetavar;
  if (hasWholeFilePrefilter(body)) rule.wholeFilePrefilter = true;
  return rule;
}

/**
 * Whether any `pattern-regex` in a rule body, however deep, is a whole-file lookahead (`\A(?=...)`): a
 * pre-filter the engine stops matching in a file over about a million bytes (rules/README.md, known gaps).
 */
export function hasWholeFilePrefilter(node: unknown): boolean {
  if (Array.isArray(node)) return node.some(hasWholeFilePrefilter);
  if (!isObj(node)) return false;
  return Object.entries(node).some(([k, v]) =>
    k === 'pattern-regex' && typeof v === 'string' ? /\\A\(\?=/.test(v) : hasWholeFilePrefilter(v),
  );
}

function loadRegistry(file: string): Map<string, RegistryEntry> {
  let doc: unknown;
  try {
    doc = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    throw new ToolError(`cannot read the registry snapshot ${file}: ${(e as Error).message}`);
  }
  const registry = new Map<string, RegistryEntry>();
  if (!isObj(doc)) throw new ToolError(`${file}: the registry snapshot is not an object`);
  const str = (v: unknown): string => (typeof v === 'string' ? v : '');
  for (const a of Array.isArray(doc['activities']) ? doc['activities'] : []) {
    if (!isObj(a) || typeof a['id'] !== 'string') continue;
    const supersededBy = strList(a['superseded_by']);
    registry.set(a['id'], {
      id: a['id'],
      scope: a['scope'] as RegistryEntry['scope'],
      parent: typeof a['parent'] === 'string' ? a['parent'] : null,
      ...(supersededBy.length > 0 ? { supersededBy } : {}),
      status: str(a['status']),
      term: str(a['term']),
      lint_definition: str(a['lint_definition']),
      page: str(a['page']),
    });
  }
  // Held ids are not published yet: they carry no page, status or lint definition.
  for (const h of Array.isArray(doc['held']) ? doc['held'] : []) {
    if (!isObj(h) || typeof h['id'] !== 'string' || registry.has(h['id'])) continue;
    registry.set(h['id'], {
      id: h['id'],
      scope: h['scope'] as RegistryEntry['scope'],
      parent: typeof h['parent'] === 'string' ? h['parent'] : null,
      status: 'held',
      term: str(h['term']),
      lint_definition: '',
      page: '',
    });
  }
  return registry;
}

function loadClasses(file: string): Map<string, DetectionClass> {
  const doc = readYaml(file);
  if (!isObj(doc)) throw new ToolError(`${file}: classes.yml must map activity ids to classes`);
  const classes = new Map<string, DetectionClass>();
  for (const [id, v] of Object.entries(doc)) {
    if (typeof v !== 'string' || !CLASSES.includes(v as DetectionClass)) {
      throw new ToolError(`${file}: ${id} has class ${String(v)}; expected evidence, signal or declaration-only`);
    }
    classes.set(id, v as DetectionClass);
  }
  return classes;
}

function loadComponents(dir: string): ComponentEntry[] {
  const out: ComponentEntry[] = [];
  const cdir = join(dir, 'components');
  if (!existsSync(cdir)) return out;
  for (const name of readdirSync(cdir).sort()) {
    if (!name.endsWith('.yml')) continue;
    const file = join(cdir, name);
    const doc = readYaml(file);
    const eco = isObj(doc) ? doc['ecosystem'] : undefined;
    if (typeof eco !== 'string' || !(ECOSYSTEMS as readonly string[]).includes(eco)) {
      throw new ToolError(`${file}: ecosystem must be one of ${ECOSYSTEMS.join(', ')}`);
    }
    const entries = isObj(doc) ? doc['entries'] : undefined;
    if (!Array.isArray(entries)) throw new ToolError(`${file}: entries must be a list`);
    for (const e of entries) {
      if (!isObj(e) || typeof e['match'] !== 'string') throw new ToolError(`${file}: an entry has no match`);
      out.push({
        ecosystem: eco as ComponentEntry['ecosystem'],
        match: e['match'],
        enables: strList(e['enables']),
        says: typeof e['says'] === 'string' ? e['says'] : '',
        source: typeof e['source'] === 'string' ? e['source'] : '',
      });
    }
  }
  return out;
}

/** The bundled rule set, plus rule files from extra directories (rules only, same layout). */
export function loadRuleSet(extraDirs: string[] = []): RuleSet {
  const dir = bundledRulesDir();
  const meta = readYaml(join(dir, 'ruleset.yml'));
  const registryMeta = isObj(meta) && isObj(meta['registry']) ? meta['registry'] : {};
  if (!isObj(meta) || typeof meta['version'] !== 'string') {
    throw new ToolError(`${join(dir, 'ruleset.yml')}: no version`);
  }
  const rules: RuleMeta[] = [];
  const seen = new Map<string, string>();
  for (const d of [dir, ...extraDirs]) {
    for (const { file } of listRuleFiles(d)) {
      const rule = toRuleMeta(file, readRuleFile(file));
      const prior = seen.get(rule.id);
      if (prior !== undefined) throw new ToolError(`rule id ${rule.id} is defined in both ${prior} and ${file}`);
      seen.set(rule.id, file);
      rules.push(rule);
    }
  }
  return {
    version: meta['version'],
    registryVersion: String(registryMeta['version'] ?? ''),
    rules,
    classes: loadClasses(join(dir, 'classes.yml')),
    registry: loadRegistry(join(dir, 'registry.snapshot.json')),
    components: loadComponents(dir),
  };
}

/** The id, its parent, and the parent's children. An unknown id is its own family. */
export function familyOf(id: string, rs: RuleSet): Set<string> {
  const family = new Set<string>([id]);
  const root = rs.registry.get(id)?.parent ?? id;
  family.add(root);
  for (const e of rs.registry.values()) if (e.parent === root) family.add(e.id);
  return family;
}

export function classOf(id: string, rs: RuleSet): DetectionClass {
  return rs.classes.get(id) ?? 'declaration-only';
}

/** One `rules:` document holding each rule file's single rule body unchanged. */
export function writeMergedConfig(rules: RuleMeta[], dest: string): void {
  const bodies = rules.map((r) => readRuleFile(r.file));
  writeFileSync(dest, stringify({ rules: bodies }));
}
