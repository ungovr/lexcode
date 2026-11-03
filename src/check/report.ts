import type { CheckResult, Evidence, EvidenceRecord, IgnoredReport, RegistryEntry, ScopeInfo, VerdictRow } from '../types.js';

const MAX_EVIDENCE = 3;
const WRAP = 76;

export interface ReportContext {
  declarationFile: string;
  record: EvidenceRecord;
  quiet: boolean;
  /** The registry snapshot, for the definition printed under FAIL and WARN. */
  registry?: ReadonlyMap<string, RegistryEntry>;
  /** Where the scope lists came from, for the Scope line: `lexlint.yml app.scope`, `.lexcode.yml`, or both. */
  scopeFrom?: string[];
}

function message(row: VerdictRow): string {
  const { id } = row;
  const tried = `${row.rulesTried} ${row.rulesTried === 1 ? 'rule' : 'rules'} tried`;
  switch (row.kind) {
    case 'not-mentioned':
      return `the code performs ${id} and the declaration does not carry it`;
    case 'declared-absent':
      return `the declaration says the software does not do ${id}, and the code shows it does`;
    case 'enables-undeclared':
      return `a dependency enables ${id} and the declaration does not carry it; a dependency is a question, not an answer`;
    case 'enables-declared-absent':
      return `a dependency enables ${id} and the declaration says the software does not do it; a dependency is a question, not an answer`;
    case 'performs-declared-enables':
      return `the declaration says ${id} comes only through a dependency, and the project's own code does it`;
    case 'confirmed':
      return `declared, and the code shows it (${tried})`;
    case 'not-found':
      return `declared; the code showed nothing (${tried})`;
    case 'declarations-disagree':
      return `the two declarations disagree on ${id}`;
    case 'sibling-declared': {
      const what = row.mentioned === 'enables' ? 'a dependency enables' : 'the code performs';
      const parent = row.parent ?? 'its parent';
      return (
        `${what} ${id}; the declaration carries ${(row.siblings ?? []).join(', ')} but not ${id} or ${parent}, so law that turns on ${id} is not read. ` +
        `Declare ${id} or ${parent} to have it read.`
      );
    }
    case 'ignored-declared-absent':
      return `an ignore in .lexcode.yml set aside evidence that the code does ${id}, which the declaration says it does not; remove the ignore, or correct the declaration`;
    case 'not-looked-at':
      return 'declared; lexcode has no rule that reads the files in scope for it';
  }
}

function evidenceLines(evidence: Evidence[], indent: string): string[] {
  const out = evidence.slice(0, MAX_EVIDENCE).map((e) => `${indent}${e.where}  ${e.component ?? e.rule}`);
  if (evidence.length > MAX_EVIDENCE) out.push(`${indent}and ${evidence.length - MAX_EVIDENCE} more`);
  return out;
}

function wrap(text: string, indent: string): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (cur !== '' && indent.length + cur.length + 1 + word.length > WRAP) {
      lines.push(indent + cur);
      cur = word;
    } else {
      cur = cur === '' ? word : `${cur} ${word}`;
    }
  }
  if (cur !== '') lines.push(indent + cur);
  return lines;
}

function list(items: string[], none: string): string {
  return items.length > 0 ? items.join(', ') : none;
}

function setAsideLines(ignored: IgnoredReport[], scope: ScopeInfo, from: string[] | undefined): string[] {
  const out: string[] = [];
  const removed = ignored.filter((ig) => ig.matched > 0);
  if (removed.length > 0) {
    out.push('Set aside by .lexcode.yml:');
    for (const ig of removed) {
      const matches = `${ig.matched.toLocaleString('en-US')} ${ig.matched === 1 ? 'match' : 'matches'}`;
      const parts = [`${ig.rule}${ig.where === undefined ? '' : ` at ${ig.where}`}: ${matches}`];
      if (ig.reason !== undefined && ig.reason !== '') parts.push(`reason: ${ig.reason}`);
      if (ig.by !== undefined) parts.push(`by ${ig.by}`);
      if (ig.on !== undefined) parts.push(`on ${ig.on}`);
      out.push(`  ${parts.join('; ')}`);
    }
  }
  if (scope.include.length > 0 || scope.exclude.length > 0) {
    const source = from !== undefined && from.length > 0 ? ` (from ${from.join(' and ')})` : '';
    if (out.length > 0) out.push('');
    out.push(`Scope: include ${list(scope.include, 'all files')}; exclude ${list(scope.exclude, 'none')}${source}`);
  }
  return out;
}

export function renderHuman(res: CheckResult, ctx: ReportContext): string {
  const count = (v: VerdictRow['verdict']): number => res.rows.filter((r) => r.verdict === v).length;
  const result = `Result: ${count('FAIL')} FAIL, ${count('WARN')} WARN, ${count('PASS')} PASS, ${count('INFO')} INFO.`;
  const lines: string[] = [];

  if (!ctx.quiet) {
    const rec = ctx.record;
    lines.push(`lexcode check against ${ctx.declarationFile}`);
    lines.push(
      `${rec.scope.files.toLocaleString('en-US')} ${rec.scope.files === 1 ? 'file' : 'files'} read; rules ${rec.rules.version}; engine ${rec.engine.name} ${rec.engine.version}; registry ${rec.registry_version}`,
    );
    lines.push('');
  }

  for (const row of res.rows) {
    const loud = row.verdict === 'FAIL' || row.verdict === 'WARN';
    if (ctx.quiet && !loud) continue;
    lines.push(`${row.verdict}  ${row.id}  ${message(row)}`);
    lines.push(...evidenceLines(row.evidence, '    '));
    if (row.note !== undefined) lines.push(...wrap(`reason: ${row.note}`, '    '));
    const definition = loud ? ctx.registry?.get(row.id)?.lint_definition : undefined;
    if (definition) lines.push(...wrap(definition, '    '));
  }

  if (!ctx.quiet) {
    if (res.notices.length > 0) {
      lines.push('', 'Notices:');
      for (const n of res.notices) lines.push(`  ${n}`);
    }
    if (res.signals.length > 0) {
      lines.push('', 'Worth a look (no effect on the result):');
      for (const s of res.signals) {
        lines.push(`  ${s.id}`);
        lines.push(...evidenceLines(s.evidence, '    '));
      }
    }
  }

  // What the repository's own files set aside is shown with or without --quiet: a reader of the
  // result line alone must still see that something was removed from what the code was checked on.
  const aside = setAsideLines(res.ignored, res.scope, ctx.scopeFrom);
  if (aside.length > 0) lines.push(...(lines.length > 0 && lines[lines.length - 1] !== '' ? [''] : []), ...aside);

  if (lines.length > 0 && lines[lines.length - 1] !== '') lines.push('');
  lines.push(result, '');
  return lines.join('\n');
}

export function renderJson(res: CheckResult): string {
  return `${JSON.stringify(res, null, 2)}\n`;
}
