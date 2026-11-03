import { existsSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { compare } from '../check/compare.js';
import { renderHuman, renderJson } from '../check/report.js';
import { loadSidecar } from '../config/sidecar.js';
import { selectDeclaration } from '../declaration/select.js';
import { toSarif } from '../record/sarif.js';
import { loadRuleSet } from '../rules/load.js';
import type { CheckResult, VerdictRow } from '../types.js';
import { USAGE } from '../usage.js';
import { defaultIo, flag, parseFlags, str, strList, type Io } from './args.js';
import { fromCwd, insideRoot, writeOutput } from './fsutil.js';
import { scan } from './scan.js';

const ORDER = { FAIL: 0, WARN: 1, PASS: 2, INFO: 3 } as const;

export const CHECK_OPTIONS = {
  declaration: { type: 'string' },
  config: { type: 'string' },
  'fail-on-enables': { type: 'boolean' },
  'include-tests': { type: 'boolean' },
  'allow-undeclared': { type: 'boolean' },
  sarif: { type: 'string' },
  out: { type: 'string' },
  snippets: { type: 'boolean' },
  rules: { type: 'string', multiple: true },
  engine: { type: 'string' },
  json: { type: 'boolean' },
  quiet: { type: 'boolean' },
} as const;

/** A --declaration path is read from the repository root, as the declaration code does; a path that only exists from the shell's directory is accepted too. */
function declarationArg(root: string, arg: string | undefined): string | undefined {
  if (arg === undefined || isAbsolute(arg)) return arg;
  if (existsSync(join(root, arg))) return arg;
  const here = resolve(process.cwd(), arg);
  return existsSync(here) ? here : arg;
}

export async function runCheckCommand(argv: string[], io: Io = defaultIo()): Promise<number> {
  const p = parseFlags(argv, CHECK_OPTIONS, { min: 0, max: 1, what: 'at most one path' });
  if (flag(p, 'help')) {
    io.stdout(USAGE);
    return 0;
  }
  const root = resolve(p.positionals[0] ?? '.');
  const rs = loadRuleSet(strList(p, 'rules').map(fromCwd));
  const sidecar = loadSidecar(root, str(p, 'config'));
  const sel = selectDeclaration(root, declarationArg(root, str(p, 'declaration')), rs.registry);

  // No declaration is settled before the engine runs: with nothing to compare against and no
  // --allow-undeclared, there is nothing worth scanning for.
  const undeclaredMessage =
    `no declaration found under ${root}. lexcode check compares the code with ACTIVITIES.md or lexlint.yml at the repository root: ` +
    'add one, name one with --declaration <file>, or pass --allow-undeclared to skip the comparison while you roll this out.';
  if (!sel.declaration && !flag(p, 'allow-undeclared')) {
    io.stderr(`lexcode: ${undeclaredMessage}\n`);
    return 3;
  }

  const outArg = str(p, 'out');
  const sarifArg = str(p, 'sarif');
  const outPath = outArg !== undefined ? fromCwd(outArg) : undefined;
  const sarifPath = sarifArg !== undefined ? fromCwd(sarifArg) : undefined;
  const skipFiles = [outPath, sarifPath, join(root, 'lexcode.json')]
    .map((x) => (x === undefined ? undefined : insideRoot(root, x)))
    .filter((x): x is string => x !== undefined);

  const enginePath = str(p, 'engine');
  const record = await scan({
    root,
    rulesDirs: [],
    rs,
    ...(enginePath !== undefined ? { enginePath } : {}),
    includeTests: flag(p, 'include-tests'),
    snippets: flag(p, 'snippets'),
    ...(sidecar ? { sidecar } : {}),
    ...(sel.scope ? { scope: sel.scope } : {}),
    skipFiles,
  });

  // --allow-undeclared with no declaration: the record and SARIF are still written (a CI step that
  // uploads the SARIF file must find it), the comparison is skipped, and the exit code is 0.
  const declaration = sel.declaration;
  let final: CheckResult;
  if (declaration) {
    const result = compare(record, declaration, rs, { failOnEnables: flag(p, 'fail-on-enables') || sidecar?.fail_on_enables === true });
    const disagree: VerdictRow[] = sel.disagreements.map((id) => ({ verdict: 'WARN', id, kind: 'declarations-disagree', evidence: [], rulesTried: 0 }));
    const rows = [...result.rows, ...disagree].sort((a, b) => ORDER[a.verdict] - ORDER[b.verdict] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    final = { ...result, rows, notices: [...new Set([...result.notices, ...record.notices])] };
  } else {
    final = { rows: [], signals: record.signals, notices: [...new Set(record.notices)], exitCode: 0 };
  }

  if (outPath !== undefined) await writeOutput(outPath, `${JSON.stringify(record, null, 2)}\n`);
  if (sarifPath !== undefined) await writeOutput(sarifPath, `${JSON.stringify(toSarif(record, rs, { snippets: flag(p, 'snippets') }), null, 2)}\n`);

  if (!declaration) io.stderr(`lexcode: warning: ${undeclaredMessage} The record was scanned and written as asked; nothing was compared.\n`);
  if (flag(p, 'json')) {
    io.stdout(renderJson(final));
  } else if (declaration) {
    const rel = relative(root, declaration.file);
    const declarationFile = rel === '' || rel.startsWith('..') || isAbsolute(rel) ? declaration.file : rel.split('\\').join('/');
    io.stderr(renderHuman(final, { declarationFile, record, quiet: flag(p, 'quiet'), registry: rs.registry }));
  }
  return final.exitCode;
}
