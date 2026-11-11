import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { trackTempDir } from '../cleanup.js';
import { matchComponents } from '../components/match.js';
import { readLexlintYml } from '../declaration/lexlint-yml.js';
import { ToolError } from '../errors.js';
import { pathPresent } from '../fsread.js';
import { ensureEngine } from '../engine/fetch.js';
import { ENGINE_PIN } from '../engine/pin.js';
import { runEngine } from '../engine/run.js';
import { readGo } from '../manifests/go.js';
import { readNpm } from '../manifests/npm.js';
import { isRequirementsFile, readPypi } from '../manifests/pypi.js';
import { readMaven } from '../manifests/maven.js';
import { readRuby } from '../manifests/ruby.js';
import { baseName } from '../manifests/util.js';
import { buildRecord, countRulesRun, engineTargets, unreadLanguages } from '../record/build.js';
import { toSarif } from '../record/sarif.js';
import { loadRuleSet, writeMergedConfig } from '../rules/load.js';
import { extractScripts } from '../scope/extract.js';
import { listFiles } from '../scope/files.js';
import { hasLongLine, MAX_LINE_CHARS } from '../scope/longlines.js';
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
  if (!pathPresent(file)) return undefined;
  const s = readLexlintYml(file, root).scope;
  return s ? { include: s.include, exclude: s.exclude, includeTests: false } : undefined;
}

function ecosystemsFound(files: string[]): Set<string> {
  const found = new Set<string>();
  for (const f of files) {
    const base = baseName(f);
    if (base === 'package.json') found.add('npm');
    else if (base === 'go.mod') found.add('golang');
    else if (base === 'Gemfile' || base === 'gems.rb' || base.endsWith('.gemspec')) found.add('gem');
    else if (base === 'pom.xml') found.add('maven');
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
    const ext = /\.lexcode\.(?:ts|js|rb)$/.exec(posix)?.[0] ?? '';
    tails.push({ tail: `/${p.originalPath}${ext}`, original: p.originalPath });
  }
  return (reported) => {
    const hit = exact.get(reported);
    if (hit !== undefined) return hit;
    if (!/\.lexcode\.(?:ts|js|rb)$/.test(reported)) return reported;
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
  if (listed.noGitWorkTree) {
    const neg = listed.gitignore.notApplied;
    notices.push(
      'this directory is not in a git work tree, so its files were found by walking it: common dependency and build directories ' +
        '(virtual environments, site-packages, node_modules and the like) and the simple patterns of the root .gitignore were left out' +
        (neg > 0 ? `, but ${neg.toLocaleString('en-US')} .gitignore ${neg === 1 ? 'pattern' : 'patterns'} (a negation with !, or one past the first 5,000) ${neg === 1 ? 'was' : 'were'} not applied` : '') +
        '; a library that git would have ignored may have been read',
    );
  }
  if (listed.skippedSymlinks > 0) {
    notices.push(`skipped ${listed.skippedSymlinks} symbolic ${listed.skippedSymlinks === 1 ? 'link' : 'links'}; lexcode does not follow them`);
  }
  if (listed.skippedBundled > 0) {
    notices.push(`skipped ${listed.skippedBundled} bundled or minified ${listed.skippedBundled === 1 ? 'file' : 'files'} (named *.min.js, *.bundle.js, vendor.*.js or *.vendor.js)`);
  }
  if (listed.skippedLarge > 0) {
    notices.push(`skipped ${listed.skippedLarge} ${listed.skippedLarge === 1 ? 'file' : 'files'} over 5 MB`);
  }
  if (listed.skippedUnreadable > 0) {
    const n = listed.skippedUnreadable;
    notices.push(
      `skipped ${n.toLocaleString('en-US')} ${n === 1 ? 'file' : 'files'} lexcode cannot open for reading; ${n === 1 ? 'its' : 'their'} evidence is missing from this record`,
    );
  }
  if (rs.rules.length > 0) {
    const unread = unreadLanguages(rs.rules, files);
    if (unread.length > 0) {
      const total = unread.reduce((n, u) => n + u.files, 0);
      const parts = unread.map((u) => `${u.files.toLocaleString('en-US')} ${u.language} ${u.files === 1 ? 'file' : 'files'}`).join(', ');
      notices.push(
        `not read: ${parts}; lexcode has no rules for ${unread.map((u) => u.language).join(' or ')}, so any evidence in ${total === 1 ? 'it' : 'them'} is missing from this record`,
      );
    }
  }

  // Manifests: what the code enables.
  const readers = [readNpm(root, files), readPypi(root, files), readGo(root, files), readRuby(root, files), readMaven(root, files)];
  const deps: Dependency[] = readers.flatMap((r) => r.deps);
  const devSkipped = readers.reduce((n, r) => n + r.devSkipped, 0);
  for (const r of readers) notices.push(...r.notices);
  const mapped = matchComponents(deps, files, rs.components);
  const manifestEvidence: { id: string; ev: Evidence }[] = mapped.evidence;

  // Source rules: what the code performs.
  const tmp = await mkdtemp(join(tmpdir(), 'lexcode-scan-'));
  const release = trackTempDir(tmp);
  try {
    const pairs = rs.rules.length > 0 ? extractScripts(root, files, join(tmp, 'scripts')) : [];
    let countedFiles = [...files, ...pairs.map((p) => p.tempPath)];
    if (rs.rules.length > 0) {
      // A file with a line over 100,000 characters is generated code, and the engine can spend ten
      // minutes on one such line: it is not handed over, and not counted as read.
      const wanted = engineTargets(rs.rules, countedFiles);
      const long = new Set(wanted.filter((f) => hasLongLine(isAbsolute(f) ? f : join(root, ...f.split('/')))));
      if (long.size > 0) {
        countedFiles = countedFiles.filter((f) => !long.has(f));
        notices.push(
          `skipped ${long.size.toLocaleString('en-US')} ${long.size === 1 ? 'file' : 'files'} with a line over ${MAX_LINE_CHARS.toLocaleString('en-US')} characters (generated or minified code); the engine did not read ${long.size === 1 ? 'it' : 'them'}`,
        );
      }
    }
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
        const ran = await runEngine({ engine: handle.path, configFile, targets, root });
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
    await release();
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
