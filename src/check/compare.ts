import type {
  CheckResult,
  Declaration,
  Evidence,
  EvidenceRecord,
  Mentioned,
  RuleSet,
  Verdict,
  VerdictRow,
} from '../types.js';
import { classOf, familyOf } from './family.js';

const ORDER: Record<Verdict, number> = { FAIL: 0, WARN: 1, PASS: 2, INFO: 3 };

/** Source rules for the activity plus component-map entries that enable it. */
function rulesFor(id: string, rs: RuleSet): number {
  return rs.rules.filter((r) => r.activity === id).length + rs.components.filter((c) => c.enables.includes(id)).length;
}

/**
 * Compare an evidence record with the governing declaration (design 6.6).
 * Families: evidence for a child satisfies a declared parent and the reverse;
 * a FAIL needs the whole family undeclared. An id declared in any component
 * counts as declared even if another component rules it out.
 */
export function compare(r: EvidenceRecord, d: Declaration, rs: RuleSet, o: { failOnEnables: boolean }): CheckResult {
  const rows: VerdictRow[] = [];

  const unknown = [...new Set([...d.declared.keys(), ...d.absent])].filter((id) => !rs.registry.has(id)).sort();
  const notices = unknown.map(
    (id) => `${id} is in the declaration but not in the registry snapshot lexcode pins (version ${rs.registryVersion}); it is treated as declaration-only`,
  );

  // One verdict per id. A performs row beats an enables row for the same id.
  const byId = new Map<string, { mentioned: Mentioned; evidence: Evidence[] }>();
  for (const a of r.activities) {
    if (a.evidence.length === 0 || classOf(a.id, rs) !== 'evidence') continue;
    const cur = byId.get(a.id);
    if (!cur) byId.set(a.id, { mentioned: a.mentioned, evidence: [...a.evidence] });
    else if (a.mentioned === 'performs' && cur.mentioned === 'enables') byId.set(a.id, { mentioned: 'performs', evidence: [...a.evidence] });
    else if (a.mentioned === cur.mentioned) cur.evidence.push(...a.evidence);
  }

  for (const [id, { mentioned, evidence }] of byId) {
    const family = familyOf(id, rs);
    const declaredValues = [...family].flatMap((f) => (d.declared.has(f) ? [d.declared.get(f) as Mentioned | 'declared'] : []));
    const parent = rs.registry.get(id)?.parent ?? null;
    const ruledOut = d.absent.has(id) || (parent !== null && d.absent.has(parent));
    const rulesTried = rulesFor(id, rs);
    const row = (verdict: Verdict, kind: VerdictRow['kind']): VerdictRow => ({ verdict, id, kind, evidence, rulesTried });

    if (declaredValues.length > 0) {
      const onlyEnables = declaredValues.every((v) => v === 'enables');
      if (mentioned === 'performs' && onlyEnables) rows.push(row('WARN', 'performs-declared-enables'));
      else rows.push(row('PASS', 'confirmed'));
    } else if (mentioned === 'performs') {
      rows.push(row('FAIL', ruledOut ? 'declared-absent' : 'not-mentioned'));
    } else {
      rows.push(row(o.failOnEnables ? 'FAIL' : 'WARN', ruledOut ? 'enables-declared-absent' : 'enables-undeclared'));
    }
  }

  // INFO: declared, rules ran, nothing in the family was found.
  for (const nf of r.searched_not_found) {
    if (!d.declared.has(nf.id) || classOf(nf.id, rs) !== 'evidence') continue;
    const family = familyOf(nf.id, rs);
    if ([...byId.keys()].some((k) => family.has(k))) continue;
    rows.push({ verdict: 'INFO', id: nf.id, kind: 'not-found', evidence: [], rulesTried: nf.rules });
  }

  rows.sort((a, b) => ORDER[a.verdict] - ORDER[b.verdict] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return {
    rows,
    signals: r.signals.map((s) => ({ id: s.id, evidence: [...s.evidence] })),
    notices,
    exitCode: rows.some((x) => x.verdict === 'FAIL') ? 1 : 0,
  };
}
