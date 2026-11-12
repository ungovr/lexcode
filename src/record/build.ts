import { posix } from 'node:path';
import { classOf } from '../rules/load.js';
import { ROOT_LINK } from '../engine/run.js';
import { COPIED_WHOLE_EXTENSIONS } from '../scope/extract.js';
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

/**
 * Per rule language, every extension the engine reads as that language, plus the extensions lexcode
 * reads through a whole-file copy (`COPIED_WHOLE_EXTENSIONS`). The engine's sets were measured on explicit
 * targets (opengrep 1.33.1, 2026-11-12): a `javascript` rule reads `.ts` and `.tsx` too, `json` reads
 * `.ipynb`, `kotlin` reads `.ktm` and `php` reads `.tpl`. Only the files these name are handed to the
 * engine (`enginePlan`), so an extension missing here is code a rule never sees; one too many costs nothing.
 */
const LANGUAGE_EXTENSIONS: Record<string, string[]> = {
  python: ['.py', '.pyi'],
  javascript: ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx'],
  typescript: ['.ts', '.tsx', '.mts', '.cts'],
  go: ['.go'],
  json: ['.json', '.ipynb'],
  yaml: ['.yml', '.yaml'],
  xml: ['.xml', '.plist'],
  java: ['.java'],
  kotlin: ['.kt', '.kts', '.ktm'],
  swift: ['.swift'],
  ruby: ['.rb', '.rake', '.ru', '.gemspec'],
  php: ['.php', '.phtml', '.tpl', '.inc', '.module', '.theme', '.install'],
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

/**
 * Code languages a repository may hold, by the name a notice gives them and their extensions. A
 * language here that no rule reads is named in the record, so "not found" is never read as "not there"
 * when the code was never looked at: Canvas held 6,721 Ruby files lexcode had no rule for (#12745),
 * before Ruby got its rules in 1.1.
 */
const CODE_LANGUAGES: [string, string[]][] = [
  ['Python', ['.py', '.pyi']],
  ['JavaScript', ['.js', '.jsx', '.mjs', '.cjs']],
  ['TypeScript', ['.ts', '.tsx', '.mts', '.cts']],
  ['Go', ['.go']],
  ['Ruby', ['.rb', '.rake', '.ru', '.gemspec']],
  ['PHP', ['.php', '.phtml', '.inc', '.module', '.theme', '.install']],
  ['Java', ['.java']],
  ['Kotlin', ['.kt', '.kts']],
  ['Swift', ['.swift']],
  ['C#', ['.cs']],
  ['Rust', ['.rs']],
  ['Elixir', ['.ex', '.exs']],
  ['Scala', ['.scala']],
  ['Dart', ['.dart']],
  ['C and C++', ['.c', '.cc', '.cpp', '.cxx', '.h', '.hpp']],
];

/**
 * Per code language with files in scope that no rule names among its languages, how many files: most
 * first, then by name. A `generic` or `regex` rule reads every file as text and does not count as a
 * rule for a language.
 */
export function unreadLanguages(rules: RuleMeta[], files: string[]): { language: string; files: number }[] {
  const read = new Set<string>();
  for (const r of rules) {
    const exts = extensionsOf(r);
    if (exts !== 'all') for (const e of exts) read.add(e);
  }
  const counts = new Map<string, number>();
  for (const f of files) {
    const ext = posix.extname(f).toLowerCase();
    if (ext === '' || read.has(ext)) continue;
    const lang = CODE_LANGUAGES.find(([, exts]) => exts.includes(ext));
    if (lang) counts.set(lang[0], (counts.get(lang[0]) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([language, n]) => ({ language, files: n }))
    .sort((a, b) => b.files - a.files || (a.language < b.language ? -1 : a.language > b.language ? 1 : 0));
}

const SETTINGS_LANGUAGES = new Set(['json', 'yaml', 'yml', 'xml']);

/** A rule that reads only configuration formats: a Ruby repository with a workflow file still has no code lexcode read. */
function readsOnlySettingsFiles(rule: RuleMeta): boolean {
  return rule.languages.length > 0 && rule.languages.every((l) => SETTINGS_LANGUAGES.has(l.toLowerCase()));
}

// ---- what the engine is handed ---------------------------------------------------------------

/**
 * Whether `text` matches a glob of `*` (any run of characters) and `?` (one character), compared by code point.
 * Greedy with one backtrack point, so it takes time proportional to the two lengths multiplied at worst, never
 * exponential: a rule author's `a*b*c*d*e*f*g` cannot stall a scan.
 */
function wildcardMatch(text: string[], pattern: string[]): boolean {
  let t = 0;
  let p = 0;
  let star = -1;
  let resume = 0;
  while (t < text.length) {
    if (p < pattern.length && (pattern[p] === '?' || pattern[p] === text[t])) {
      t++;
      p++;
    } else if (p < pattern.length && pattern[p] === '*') {
      star = p++;
      resume = t;
    } else if (star >= 0) {
      p = star + 1;
      t = ++resume;
    } else {
      return false;
    }
  }
  while (pattern[p] === '*') p++;
  return p === pattern.length;
}

/**
 * A test for a single path segment (a directory name or the file name) against the last segment of each
 * `paths.include` pattern. Undefined when a pattern could match more than that test sees (a bracket, a brace,
 * a backslash or a `!` anywhere, `**` in its last segment, or a last segment that matches the engine's link to
 * the repository), and the rule is then taken to read every file of its languages.
 *
 * The engine matches an include pattern anywhere in a path and against a directory as well as a file:
 * `pyproject.toml` takes `a/pyproject.toml`, and `sub` takes `sub/x.cfg` (opengrep 1.33.1, measured 2026-11-12).
 * Each such match lays the pattern's last segment over one segment of the path, so a path none of whose
 * segments matches is one the engine would not hand the rule. The test also matches with case folded and
 * ignores every other segment, so it is looser than the engine's, never tighter: it can keep a file the engine
 * then skips, never drop one it reads.
 */
function includeSegmentTest(patterns: string[]): ((segment: string) => boolean) | undefined {
  const globs: { exact: string[]; folded: string[] }[] = [];
  for (const p of patterns) {
    if (/[[\]{}\\!]/.test(p)) return undefined;
    const last = p.replace(/\/+$/, '').split('/').pop() ?? '';
    if (last === '' || last.includes('**')) return undefined;
    globs.push({ exact: [...last], folded: [...last.toLowerCase()] });
  }
  const test = (segment: string): boolean => {
    const exact = [...segment];
    const folded = [...segment.toLowerCase()];
    return globs.some((g) => wildcardMatch(exact, g.exact) || wildcardMatch(folded, g.folded));
  };
  return test(ROOT_LINK) ? undefined : test;
}

/** The extension the engine goes by: a file named only `.py` is Python to it, though `extname` gives ''. */
function engineExtension(file: string): string {
  const ext = posix.extname(file);
  if (ext !== '') return ext.toLowerCase();
  const base = file.slice(Math.max(file.lastIndexOf('/'), file.lastIndexOf('\\')) + 1);
  return base.startsWith('.') ? base.toLowerCase() : '';
}

/** What the engine is handed. */
export interface EnginePlan {
  /** The rules with at least one file to read: the engine's config holds these and no others, and these are the rules that ran. */
  rules: RuleMeta[];
  /** The files at least one of those rules reads, in the order given. */
  targets: string[];
}

/**
 * The rules worth running and the files worth reading. A rule reads the files with one of its languages'
 * extensions (every file, for `generic` and `regex`) that its `paths.include`, when it has one, can match; a
 * rule with no such file is left out of the engine's config, and a file no rule reads is not handed over.
 *
 * Both matter for speed (#12997). The engine parses the whole config again for every run of targets, and
 * parsing the 60 PHP rules alone cost about 2.6 s a run on a repository with no PHP. And a `generic` rule
 * limited to `pyproject.toml` once put every file in the target list, 53,444 photographs included, so the
 * UnGovr monorepo took eight engine runs where its 9,488 readable files fit in one.
 *
 * A language rule's file counts as read only when it is not an original the engine reads through a whole-file
 * copy (`COPIED_WHOLE_EXTENSIONS`): such an original alone does not make the rule run. When the rule runs, the
 * original is still handed over, as before.
 */
export function enginePlan(rules: RuleMeta[], files: string[]): EnginePlan {
  const exts = files.map(engineExtension);
  const byExt = new Map<string, number[]>();
  exts.forEach((e, i) => {
    const list = byExt.get(e);
    if (list) list.push(i);
    else byExt.set(e, [i]);
  });
  let segments: string[][] | undefined;
  const segmentsOf = (i: number): string[] => {
    // A copy's absolute path on Windows has backslashes, and a POSIX file name can hold one: both
    // the name whole and its pieces are tested, which only adds segments.
    segments ??= files.map((f) => {
      const parts = f.split('/');
      return f.includes('\\') ? [...parts, ...f.split(/[\\/]/)] : parts;
    });
    return segments[i] as string[];
  };

  /** Per distinct (extensions, include) pair: whether a rule with it runs, and which files it reads. */
  const seen = new Map<string, { runs: boolean; reads: number[] | 'all' }>();
  const reach = (rule: RuleMeta): { runs: boolean; reads: number[] | 'all' } => {
    const ruleExts = extensionsOf(rule);
    const key = `${ruleExts === 'all' ? '*' : [...new Set(ruleExts)].sort().join(',')}\0${(rule.include ?? []).join('\0')}`;
    const known = seen.get(key);
    if (known) return known;
    const test = rule.include ? includeSegmentTest(rule.include) : undefined;
    let reads: number[] | 'all';
    if (ruleExts === 'all' && test === undefined) {
      reads = 'all';
    } else {
      const pool = ruleExts === 'all' ? files.map((_, i) => i) : [...new Set(ruleExts)].flatMap((e) => byExt.get(e) ?? []);
      if (test === undefined) {
        reads = pool;
      } else {
        const verdicts = new Map<string, boolean>();
        const fits = (segment: string): boolean => {
          let v = verdicts.get(segment);
          if (v === undefined) {
            v = test(segment);
            verdicts.set(segment, v);
          }
          return v;
        };
        reads = pool.filter((i) => segmentsOf(i).some(fits));
      }
    }
    const runs =
      reads === 'all'
        ? files.length > 0
        : ruleExts === 'all'
          ? reads.length > 0
          : reads.some((i) => !COPIED_WHOLE_EXTENSIONS.has(exts[i] as string));
    const result = { runs, reads };
    seen.set(key, result);
    return result;
  };

  const sent: RuleMeta[] = [];
  const take = new Uint8Array(files.length);
  let takeAll = false;
  for (const r of rules) {
    const { runs, reads } = reach(r);
    if (!runs) continue;
    sent.push(r);
    if (reads === 'all') takeAll = true;
    else for (const i of reads) take[i] = 1;
  }
  return { rules: sent, targets: takeAll ? [...files] : files.filter((_, i) => take[i] === 1) };
}

/** The files handed to the engine for these rules (`enginePlan`). */
export function engineTargets(rules: RuleMeta[], files: string[]): string[] {
  return enginePlan(rules, files).targets;
}

/**
 * The size past which a whole-file lookahead pre-filter (`(?s)\A(?=.*LITERAL).*`) may stop matching: on the
 * pinned engine the lookahead gives up after about a million backtracking steps, with no error recorded, so
 * a rule that first checks a whole file for a name can lose a match in a file over about 1 MB
 * (rules/README.md, known gaps).
 */
export const PREFILTER_REACH_BYTES = 1_000_000;

/** The name a notice gives the files with an extension: the code language, the settings format, or the extension. */
function languageName(ext: string): string {
  const code = CODE_LANGUAGES.find(([, exts]) => exts.includes(ext));
  if (code) return code[0];
  const settings = Object.entries(LANGUAGE_EXTENSIONS).find(([, exts]) => exts.includes(ext));
  return settings ? settings[0].toUpperCase() : ext;
}

/**
 * Per language, how many of the files handed to the engine are over PREFILTER_REACH_BYTES and in a language
 * that at least one loaded rule pre-filters with a whole-file lookahead: most first, then by name. The
 * languages come from the loaded rules (`wholeFilePrefilter`), so a rule added for another language, or
 * one from `--rules`, moves the set with it; `bytesOf` is asked only about files in those languages.
 */
export function largePrefilteredFiles(
  rules: RuleMeta[],
  targets: string[],
  bytesOf: (file: string) => number,
): { language: string; files: number }[] {
  const exts = new Set<string>();
  let all = false;
  for (const r of rules) {
    if (!r.wholeFilePrefilter) continue;
    const e = extensionsOf(r);
    if (e === 'all') all = true;
    else for (const x of e) exts.add(x);
  }
  if (!all && exts.size === 0) return [];
  const counts = new Map<string, number>();
  for (const f of targets) {
    const ext = posix.extname(f).toLowerCase();
    // A language rule reads an `.inc` or `.rake` original only through its copy, which is a target of its own.
    if (!all && (!exts.has(ext) || COPIED_WHOLE_EXTENSIONS.has(ext))) continue;
    if (bytesOf(f) <= PREFILTER_REACH_BYTES) continue;
    const name = languageName(ext);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([language, n]) => ({ language, files: n }))
    .sort((a, b) => b.files - a.files || (a.language < b.language ? -1 : a.language > b.language ? 1 : 0));
}

/** The notice for `largePrefilteredFiles`, or undefined when there is no such file. */
export function prefilterReachNotice(large: { language: string; files: number }[]): string | undefined {
  const n = large.reduce((t, l) => t + l.files, 0);
  if (n === 0) return undefined;
  const langs =
    large.length === 1
      ? (large[0] as (typeof large)[number]).language
      : large.map((l) => `${l.files.toLocaleString('en-US')} ${l.language}`).join(', ');
  return (
    `${n.toLocaleString('en-US')} ${plural(n, 'file', 'files')} handed to the engine ${plural(n, 'is', 'are')} over ` +
    `${PREFILTER_REACH_BYTES.toLocaleString('en-US')} bytes (${langs}); rules that first check a whole file for a name can miss ` +
    `matches in a file that large, so evidence in ${plural(n, 'it', 'them')} may be missing from this record`
  );
}

/** The per-activity counts, plus how many code rules (not map entries, not rules for json, yaml or xml settings files) had a file to read. */
export class RulesRun extends Map<string, number> {
  codeRulesRan = 0;
}

/**
 * Per activity: the source rules that had at least one in-scope file to read (`enginePlan`: a
 * language's extension, and the rule's `paths.include` when it has one), plus the component-map
 * entries that enable it in an ecosystem whose manifests were found. `files` lists in-scope files
 * including extracted script blocks (`x.vue.lexcode.ts`). A `files` entry reads the file list on
 * every scan, so it always counts. `plan` is `enginePlan(rules, files)` when the caller has it.
 */
export function countRulesRun(rs: RuleSet, rules: RuleMeta[], files: string[], ecosystems: ReadonlySet<string>, plan?: EnginePlan): RulesRun {
  const out = new RulesRun();
  const bump = (id: string): void => void out.set(id, (out.get(id) ?? 0) + 1);
  for (const r of (plan ?? enginePlan(rules, files)).rules) {
    bump(r.activity);
    if (!readsOnlySettingsFiles(r)) out.codeRulesRan += 1;
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

/** What the "nothing was looked at" notice names: every language and view type the rules read (README, "Languages"). */
export const READ_LANGUAGES =
  'TypeScript, JavaScript, Python, Go, Ruby, Java, Kotlin and PHP, and script blocks in HTML, Vue, Svelte, Jinja, ERB, JSP, PHP, Blade and Twig views';

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
    const hit = new Set<string>();
    for (const item of items) {
      const sameRule = item.ruleId === ig.rule || (ruleById.get(item.ruleId)?.replaces ?? []).includes(ig.rule);
      if (!sameRule || (ig.where !== undefined && !whereMatches(ig.where, item))) continue;
      matched += 1;
      hit.add(item.id);
      removed.add(item);
    }
    const activities = [...hit].sort();
    ignored.push({ rule: ig.rule, ...(ig.where === undefined ? {} : { where: ig.where }), matched, ...(matched > 0 ? { activities } : {}) });
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
  } else if (i.rulesRun instanceof RulesRun && i.rulesRun.codeRulesRan === 0) {
    notices.push(
      `no file in scope is in a language lexcode reads (${READ_LANGUAGES}); nothing was looked at. ` +
        'If your source is in one of those languages, check that the include and exclude lists in .lexcode.yml and lexlint.yml have not left it out; otherwise read this result as "not checked", not as "clean".',
    );
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
