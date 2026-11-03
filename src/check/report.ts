import type { CheckResult, Evidence, EvidenceRecord, RegistryEntry, VerdictRow } from '../types.js';

const MAX_EVIDENCE = 3;
const WRAP = 76;

export interface ReportContext {
  declarationFile: string;
  record: EvidenceRecord;
  quiet: boolean;
  /** The registry snapshot, for the definition printed under FAIL and WARN. */
  registry?: ReadonlyMap<string, RegistryEntry>;
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

export function renderHuman(res: CheckResult, ctx: ReportContext): string {
  const count = (v: VerdictRow['verdict']): number => res.rows.filter((r) => r.verdict === v).length;
  const result = `Result: ${count('FAIL')} FAIL, ${count('WARN')} WARN, ${count('PASS')} PASS, ${count('INFO')} INFO.`;
  const lines: string[] = [];

  if (!ctx.quiet) {
    const rec = ctx.record;
    lines.push(`lexcode check against ${ctx.declarationFile}`);
    lines.push(`${rec.scope.files} files read; rules ${rec.rules.version}; engine ${rec.engine.name} ${rec.engine.version}`);
    lines.push('');
  }

  for (const row of res.rows) {
    const loud = row.verdict === 'FAIL' || row.verdict === 'WARN';
    if (ctx.quiet && !loud) continue;
    lines.push(`${row.verdict}  ${row.id}  ${message(row)}`);
    lines.push(...evidenceLines(row.evidence, '    '));
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

  if (lines.length > 0 && lines[lines.length - 1] !== '') lines.push('');
  lines.push(result, '');
  return lines.join('\n');
}

export function renderJson(res: CheckResult): string {
  return `${JSON.stringify(res, null, 2)}\n`;
}
