import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { matchComponents } from '../components/match.js';
import { readLexlintYml } from '../declaration/lexlint-yml.js';
import { ToolError } from '../errors.js';
import { ensureEngine } from '../engine/fetch.js';
import { ENGINE_PIN } from '../engine/pin.js';
import { runEngine } from '../engine/run.js';
import { readGo } from '../manifests/go.js';
import { readNpm } from '../manifests/npm.js';
import { isRequirementsFile, readPypi } from '../manifests/pypi.js';
import { baseName } from '../manifests/util.js';
import { buildRecord, countRulesRun, engineTargets } from '../record/build.js';
import { toSarif } from '../record/sarif.js';
import { loadRuleSet, writeMergedConfig } from '../rules/load.js';
import { extractScripts } from '../scope/extract.js';
import { listFiles } from '../scope/files.js';
import { loadSidecar } from '../config/sidecar.js';
import type { Dependency, EngineMatch, Evidence, EvidenceRecord, RuleSet, ScopeSpec, Sidecar } from '../types.js';
import { defaultIo, flag, parseFlags, str, strList, type Io } from './args.js';
import { USAGE } from '../usage.js';
import { fromCwd, insideRoot, writeOutput } from './fsutil.js';

export interface ScanOptions {
  root: string;
  rulesDirs: string[];
  enginePath?: string;
  includeTests: boolean;
  snippets: boolean;
  sidecar?: Sidecar;
  /** The scope the declaration asks for (lexlint.yml `app.scope`). */
  scope?: ScopeSpec;
  /** The loaded rule set; loaded from `rulesDirs` when absent. */
  rs?: RuleSet;
  /** Repository-relative POSIX paths never read (the record and SARIF files lexcode itself wrote). */
  skipFiles?: string[];
  now?: Date;
}

function union(...lists: string[][]): string[] {
  return [...new Set(lists.flat())];
}

/** app.scope from the root's lexlint.yml, when the file exists, whichever declaration governs. */
export function readAppScope(root: string): ScopeSpec | undefined {
  const file = join(root, 'lexlint.yml');
  if (!existsSync(file)) return undefined;
  const s = readLexlintYml(file).scope;
  return s ? { include: s.include, exclude: s.exclude, includeTests: false } : undefined;
}

function ecosystemsFound(files: string[]): Set<string> {
  const found = new Set<string>();
  for (const f of files) {
    const base = baseName(f);
    if (base === 'package.json') found.add('npm');
    else if (base === 'go.mod') found.add('golang');
    else if (base === 'pyproject.toml' || isRequirementsFile(f)) found.add('pypi');
  }
  return found;
}

/** Map an engine-reported path back to the original file when it names an extracted script block. */
function pathMapper(pairs: { tempPath: string; originalPath: string }[]): (reported: string) => string {
  const exact = new Map<string, string>();
  const tails: { tail: string; original: string }[] = [];
  for (const p of pairs) {
    const posix = p.tempPath.replace(/\\/g, '/');
    exact.set(posix, p.originalPath);
    const ext = /\.lexcode\.(?:ts|js)$/.exec(posix)?.[0] ?? '';
    tails.push({ tail: `/${p.originalPath}${ext}`, original: p.originalPath });
  }
  return (reported) => {
    const hit = exact.get(reported);
    if (hit !== undefined) return hit;
    if (!/\.lexcode\.(?:ts|js)$/.test(reported)) return reported;
    return tails.find((t) => reported.endsWith(t.tail))?.original ?? reported;
  };
}

export async function scan(o: ScanOptions): Promise<EvidenceRecord> {
  const root = resolve(o.root);
  const rs = o.rs ?? loadRuleSet(o.rulesDirs);
  const side = o.sidecar;

  const spec: ScopeSpec = {
    include: union(o.scope?.include ?? [], side?.include ?? []),
    exclude: union(o.scope?.exclude ?? [], side?.exclude ?? []),
    includeTests: o.includeTests,
  };
  const listed = listFiles(root, spec);
  const skip = new Set(o.skipFiles ?? []);
  const files = skip.size > 0 ? listed.files.filter((f) => !skip.has(f)) : listed.files;
  if (files.length === 0) throw new ToolError(`no files in scope under ${root}: every file was skipped, excluded or not included.`);

  const notices: string[] = [];
  if (listed.skippedSymlinks > 0) {
    notices.push(`skipped ${listed.skippedSymlinks} symbolic ${listed.skippedSymlinks === 1 ? 'link' : 'links'}; lexcode does not follow them`);
  }
  if (listed.skippedLarge > 0) {
    notices.push(`skipped ${listed.skippedLarge} ${listed.skippedLarge === 1 ? 'file' : 'files'} over 5 MB`);
  }

  // Manifests: what the code enables.
  const readers = [readNpm(root, files), readPypi(root, files), readGo(root, files)];
  const deps: Dependency[] = readers.flatMap((r) => r.deps);
  const devSkipped = readers.reduce((n, r) => n + r.devSkipped, 0);
  for (const r of readers) notices.push(...r.notices);
  const mapped = matchComponents(deps, files, rs.components);
  const manifestEvidence: { id: string; ev: Evidence }[] = mapped.evidence;

  // Source rules: what the code performs.
  const tmp = await mkdtemp(join(tmpdir(), 'lexcode-scan-'));
  try {
    const pairs = rs.rules.length > 0 ? extractScripts(root, files, join(tmp, 'scripts')) : [];
    const countedFiles = [...files, ...pairs.map((p) => p.tempPath)];
    const rulesRun = countRulesRun(rs, rs.rules, countedFiles, ecosystemsFound(files));

    let matches: EngineMatch[] = [];
    let fileErrors = 0;
    let engineVersion: string = ENGINE_PIN.version;
    if (rs.rules.length > 0) {
      const handle = await ensureEngine({ enginePath: o.enginePath, download: true });
      engineVersion = handle.version;
      const configFile = join(tmp, 'rules.yml');
      writeMergedConfig(rs.rules, configFile);
      const targets = engineTargets(rs.rules, countedFiles);
      if (targets.length > 0) {
        const ran = await runEngine({ engine: handle.path, configFile, targets, cwd: root });
        engineVersion = ran.version;
        fileErrors = ran.fileErrors;
        const back = pathMapper(pairs);
        matches = ran.matches.map((m) => ({ ...m, path: back(m.path) }));
      }
      if (!handle.pinned && engineVersion !== ENGINE_PIN.version) {
        notices.push(`the engine is ${engineVersion}, not the pinned ${ENGINE_PIN.version}; the rule fixtures were checked against the pinned version only`);
      }
    }

    return buildRecord({
      matches,
      manifestEvidence,
      components: mapped.components,
      rs,
      rulesRun,
      scope: { ...listed.info, files: files.length, extracted: pairs.length, dev_dependencies_skipped: devSkipped },
      ...(side ? { sidecar: side } : {}),
      engineVersion,
      snippets: o.snippets,
      now: o.now ?? new Date(),
      fileErrors,
      notices,
    });
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

// ---- the command ---------------------------------------------------------------------------

function count(n: number): string {
  return n.toLocaleString('en-US');
}

export const SCAN_OPTIONS = {
  out: { type: 'string' },
  json: { type: 'boolean' },
  sarif: { type: 'string' },
  snippets: { type: 'boolean' },
  rules: { type: 'string', multiple: true },
  config: { type: 'string' },
  engine: { type: 'string' },
  'include-tests': { type: 'boolean' },
} as const;

export function summaryLine(r: EvidenceRecord, recordPath: string | undefined): string {
  const performs = r.activities.filter((a) => a.mentioned === 'performs').length;
  const enables = r.activities.filter((a) => a.mentioned === 'enables').length;
  const tail = recordPath ? `record written to ${recordPath}` : 'no record file written';
  return (
    `lexcode scan: ${count(r.scope.files)} files read; ${performs} ${performs === 1 ? 'activity' : 'activities'} with performs evidence, ` +
    `${enables} with enables evidence, ${r.signals.length} ${r.signals.length === 1 ? 'signal' : 'signals'}; ${tail}\n`
  );
}

export async function runScanCommand(argv: string[], io: Io = defaultIo()): Promise<number> {
  const p = parseFlags(argv, SCAN_OPTIONS, { min: 0, max: 1, what: 'at most one path' });
  if (flag(p, 'help')) {
    io.stdout(USAGE);
    return 0;
  }
  const root = resolve(p.positionals[0] ?? '.');
  const json = flag(p, 'json');
  const rs = loadRuleSet(strList(p, 'rules').map(fromCwd));
  const sidecar = loadSidecar(root, str(p, 'config'));

  const outArg = str(p, 'out');
  // Under --json the record goes to stdout and no file is written unless --out names one.
  const recordPath = outArg !== undefined ? fromCwd(outArg) : json ? undefined : join(root, 'lexcode.json');
  const sarifArg = str(p, 'sarif');
  const sarifPath = sarifArg !== undefined ? fromCwd(sarifArg) : undefined;
  const skipFiles = [recordPath, sarifPath, join(root, 'lexcode.json')]
    .map((x) => (x === undefined ? undefined : insideRoot(root, x)))
    .filter((x): x is string => x !== undefined);

  const appScope = readAppScope(root);
  const record = await scan({
    root,
    rulesDirs: [],
    rs,
    ...(str(p, 'engine') !== undefined ? { enginePath: str(p, 'engine') as string } : {}),
    includeTests: flag(p, 'include-tests'),
    snippets: flag(p, 'snippets'),
    ...(sidecar ? { sidecar } : {}),
    ...(appScope ? { scope: appScope } : {}),
    skipFiles,
  });

  const text = `${JSON.stringify(record, null, 2)}\n`;
  if (recordPath !== undefined) await writeOutput(recordPath, text);
  if (sarifPath !== undefined) await writeOutput(sarifPath, `${JSON.stringify(toSarif(record, rs, { snippets: flag(p, 'snippets') }), null, 2)}\n`);
  if (json) {
    io.stdout(text);
  } else {
    io.stderr(summaryLine(record, recordPath));
    for (const n of record.notices) io.stderr(`  notice: ${n}\n`);
  }
  return 0;
}
