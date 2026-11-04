// Every type more than one module uses. Change them here and nowhere else.

export type Mentioned = 'performs' | 'enables';
export type DetectionClass = 'evidence' | 'signal' | 'declaration-only';

export interface Evidence {
  rule: string;
  /** POSIX path relative to the scanned root, then ':' and the 1-based line. */
  where: string;
  /** The purl, for evidence from a manifest. */
  component?: string;
  /** The literal host a crawl rule matched, when it has one. */
  host?: string;
  /** The matched line, only under --snippets. */
  snippet?: string;
}

export interface ActivityRow { id: string; mentioned: Mentioned; evidence: Evidence[] }
export interface SignalRow { id: string; evidence: Evidence[] }
/** `rules` is the source rules run plus the component-map entries consulted. */
export interface NotFoundRow { id: string; rules: number }
export interface ComponentRow { purl: string; manifest: string; enables: string[]; unresolved?: true }

export interface ScopeInfo {
  include: string[];
  exclude: string[];
  include_tests: boolean;
  files: number;
  extracted: number;
  dev_dependencies_skipped: number;
}

/** One sidecar ignore as the record keeps it: how much evidence it removed, and for which activities. */
export interface IgnoredEvidence {
  rule: string;
  where?: string;
  matched: number;
  /** The activity ids whose evidence this ignore removed; present when `matched` is above 0. */
  activities?: string[];
}

/** An ignored entry joined with the sidecar entry that asked for it. */
export interface IgnoredReport extends IgnoredEvidence {
  reason?: string;
  by?: string;
  on?: string;
}

export interface EvidenceRecord {
  schema: 'https://lexlint.io/lexcode/v1';
  engine: { name: 'opengrep'; version: string };
  rules: { name: 'lexcode-rules'; version: string };
  registry: 'https://lexlint.io/activities/v1';
  registry_version: string;
  scanned_at: string;
  root: '.';
  scope: ScopeInfo;
  activities: ActivityRow[];
  signals: SignalRow[];
  searched_not_found: NotFoundRow[];
  components: ComponentRow[];
  ignored: IgnoredEvidence[];
  notices: string[];
}

export interface RuleMeta {
  id: string;
  /** Absolute path of the rule's YAML file. */
  file: string;
  activity: string;
  mentioned: Mentioned;
  strength: 'evidence' | 'signal';
  definition: string;
  languages: string[];
  message: string;
  hostMetavar?: string;
  replaces: string[];
}

export interface RegistryEntry {
  id: string;
  scope: 'code' | 'deployment' | 'role';
  parent: string | null;
  /** The ids that replace a retired id; empty or absent for a current one. */
  supersededBy?: string[];
  status: string;
  term: string;
  lint_definition: string;
  page: string;
}

export interface ComponentEntry {
  ecosystem: 'npm' | 'pypi' | 'golang' | 'files';
  match: string;
  enables: string[];
  says: string;
  source: string;
}

export interface RuleSet {
  version: string;
  registryVersion: string;
  rules: RuleMeta[];
  classes: Map<string, DetectionClass>;
  registry: Map<string, RegistryEntry>;
  components: ComponentEntry[];
}

export interface Dependency {
  ecosystem: 'npm' | 'pypi' | 'golang';
  name: string;
  version?: string;
  /** POSIX path ':' line of the dependency's entry in its manifest. */
  manifest: string;
}

export interface EngineMatch {
  ruleId: string;
  path: string;
  line: number;
  metavars: Record<string, string>;
  lines: string;
}

export interface ScopeSpec { include: string[]; exclude: string[]; includeTests: boolean }

export interface Sidecar {
  ignore: { rule: string; where?: string; reason: string; by?: string; on?: string }[];
  fail_on_enables: boolean;
  own_hosts: string[];
  include: string[];
  exclude: string[];
}

export interface Declaration {
  source: 'ACTIVITIES.md' | 'lexlint.yml';
  file: string;
  declared: Map<string, Mentioned | 'declared'>;
  absent: Set<string>;
}

export type Verdict = 'FAIL' | 'WARN' | 'PASS' | 'INFO';
export type VerdictKind =
  | 'not-mentioned'
  | 'declared-absent'
  | 'enables-undeclared'
  | 'enables-declared-absent'
  | 'performs-declared-enables'
  | 'confirmed'
  | 'not-found'
  | 'declarations-disagree'
  | 'sibling-declared'
  | 'ignored-declared-absent'
  | 'not-looked-at';

export interface VerdictRow {
  verdict: Verdict;
  id: string;
  kind: VerdictKind;
  evidence: Evidence[];
  rulesTried: number;
  /** What the evidence is: set on the rows built from evidence. */
  mentioned?: Mentioned;
  /** `sibling-declared`: the declared siblings, and the parent they share with the id. */
  siblings?: string[];
  parent?: string;
  /** Free text the row prints under its message (the reason of an ignore). */
  note?: string;
}
export interface CheckResult {
  rows: VerdictRow[];
  signals: SignalRow[];
  notices: string[];
  exitCode: 0 | 1;
  /** The record's ignores, each joined with the reason, by and on of the sidecar entry. */
  ignored: IgnoredReport[];
  /** The scope the scan used. */
  scope: ScopeInfo;
}
