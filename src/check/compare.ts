import type {
  CheckResult,
  Declaration,
  Evidence,
  EvidenceRecord,
  IgnoredReport,
  Mentioned,
  RuleSet,
  Sidecar,
  Verdict,
  VerdictRow,
} from '../types.js';
import { classOf, familyOf } from './family.js';

const ORDER: Record<Verdict, number> = { FAIL: 0, WARN: 1, PASS: 2, INFO: 3 };

/** Source rules for the activity plus component-map entries that enable it. */
function rulesFor(id: string, rs: RuleSet): number {
  return rs.rules.filter((r) => r.activity === id).length + rs.components.filter((c) => c.enables.includes(id)).length;
}

/** The id, its parent, and its children: the ids a declaration may carry in place of the id itself. */
function relatedIds(id: string, rs: RuleSet): Set<string> {
  const out = new Set<string>([id]);
  const parent = rs.registry.get(id)?.parent ?? null;
  if (parent !== null) out.add(parent);
  for (const e of rs.registry.values()) if (e.parent === id) out.add(e.id);
  return out;
}

/** The other children of the id's parent, sorted. */
function siblingsOf(id: string, rs: RuleSet): string[] {
  const parent = rs.registry.get(id)?.parent ?? null;
  if (parent === null) return [];
  return [...rs.registry.values()].filter((e) => e.parent === parent && e.id !== id).map((e) => e.id).sort();
}

/** Join each ignore the record kept with the sidecar entry that asked for it (same rule and where, in order). */
export function joinIgnored(r: EvidenceRecord, sidecar: Sidecar | undefined): IgnoredReport[] {
  const used = new Set<number>();
  return r.ignored.map((ig) => {
    const at = (sidecar?.ignore ?? []).findIndex((s, i) => !used.has(i) && s.rule === ig.rule && s.where === ig.where);
    const out: IgnoredReport = { ...ig, ...(ig.activities ? { activities: [...ig.activities] } : {}) };
    const entry = at < 0 ? undefined : sidecar?.ignore[at];
    if (at >= 0) used.add(at);
    if (entry) {
      out.reason = entry.reason;
      if (entry.by !== undefined) out.by = entry.by;
      if (entry.on !== undefined) out.on = entry.on;
    }
    return out;
  });
}

/**
 * Compare an evidence record with the governing declaration (design 6.6).
 * An explicit `not:` for the id, or for its parent, is a FAIL whatever else the
 * declaration carries. Otherwise evidence for a child is covered by a declared
 * parent, and evidence for a parent by a declared child; a declared sibling alone
 * is a WARN, because the lint reads a declared child as implying its parent and
 * never a sibling. A FAIL for a family needs the whole family undeclared.
 */
export function compare(
  r: EvidenceRecord,
  d: Declaration,
  rs: RuleSet,
  o: { failOnEnables: boolean; sidecar?: Sidecar },
): CheckResult {
  const rows: VerdictRow[] = [];
  const named = [...new Set([...d.declared.keys(), ...d.absent])].sort();

  const notices: string[] = [];
  const unknown = named.filter((id) => !rs.registry.has(id));
  if (unknown.length > 0) {
    const many = unknown.length > 1;
    notices.push(
      `${unknown.join(', ')} ${many ? 'are' : 'is'} in the declaration but not in the registry snapshot lexcode pins: lexcode's rules are pinned to registry ${rs.registryVersion}, ` +
        `so ${many ? 'these ids may be' : 'the id may be'} newer than this lexcode, or misspelled. ${many ? 'They are' : 'It is'} treated as declaration-only; ` +
        'update lexcode to read newer ids, or check the spelling.',
    );
  }
  const retired = named.filter((id) => rs.registry.get(id)?.status === 'retired');
  if (retired.length > 0) {
    const parts = retired.map((id) => {
      const by = rs.registry.get(id)?.supersededBy ?? [];
      return by.length > 0
        ? `${id} is retired in the registry; declare ${by.join(', ')} instead`
        : `${id} is retired in the registry and has no replacement; remove it from the declaration`;
    });
    notices.push(`${parts.join('; ')}.`);
  }

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
    const parent = rs.registry.get(id)?.parent ?? null;
    // A `not:` for the id or its parent rules it out, unless the declaration
    // also carries the id itself: in a declaration of several components
    // (compared as their union, design 6.6) one component can do what another
    // says it does not, and the one that does it governs.
    const ruledOut = !d.declared.has(id) && (d.absent.has(id) || (parent !== null && d.absent.has(parent)));
    const rulesTried = rulesFor(id, rs);
    const row = (verdict: Verdict, kind: VerdictRow['kind'], extra: Partial<VerdictRow> = {}): VerdictRow => ({
      verdict,
      id,
      kind,
      evidence,
      rulesTried,
      mentioned,
      ...extra,
    });

    if (ruledOut) {
      // The declaration says no, and nothing else it carries can turn that into a yes.
      rows.push(mentioned === 'performs' ? row('FAIL', 'declared-absent') : row(o.failOnEnables ? 'FAIL' : 'WARN', 'enables-declared-absent'));
      continue;
    }

    const declaredValues = [...relatedIds(id, rs)].flatMap((f) => (d.declared.has(f) ? [d.declared.get(f) as Mentioned | 'declared'] : []));
    if (declaredValues.length > 0) {
      const onlyEnables = declaredValues.every((v) => v === 'enables');
      rows.push(mentioned === 'performs' && onlyEnables ? row('WARN', 'performs-declared-enables') : row('PASS', 'confirmed'));
      continue;
    }

    const declaredSiblings = siblingsOf(id, rs).filter((s) => d.declared.has(s));
    if (declaredSiblings.length > 0 && parent !== null) {
      rows.push(row('WARN', 'sibling-declared', { siblings: declaredSiblings, parent }));
    } else if (mentioned === 'performs') {
      rows.push(row('FAIL', 'not-mentioned'));
    } else {
      rows.push(row(o.failOnEnables ? 'FAIL' : 'WARN', 'enables-undeclared'));
    }
  }

  // INFO: declared, and nothing in the family was found. Either the rules ran and saw nothing
  // (not-found) or no rule had a file to read (not-looked-at).
  const searched = new Map(r.searched_not_found.map((nf) => [nf.id, nf.rules]));
  for (const id of [...d.declared.keys()].sort()) {
    if (classOf(id, rs) !== 'evidence') continue;
    if ([...familyOf(id, rs)].some((k) => byId.has(k))) continue;
    const own = searched.get(id);
    if (own !== undefined) {
      rows.push({ verdict: 'INFO', id, kind: 'not-found', evidence: [], rulesTried: own });
    } else if (![...relatedIds(id, rs)].some((k) => searched.has(k))) {
      rows.push({ verdict: 'INFO', id, kind: 'not-looked-at', evidence: [], rulesTried: 0 });
    }
  }

  // WARN: an ignore in .lexcode.yml set aside evidence for something the declaration rules out.
  const ignored = joinIgnored(r, o.sidecar);
  const setAside = new Map<string, { evidence: Evidence[]; reasons: string[] }>();
  for (const ig of ignored) {
    if (ig.matched <= 0) continue;
    for (const id of ig.activities ?? []) {
      const parent = rs.registry.get(id)?.parent ?? null;
      const ruledOut = !d.declared.has(id) && (d.absent.has(id) || (parent !== null && d.absent.has(parent)));
      if (classOf(id, rs) !== 'evidence' || !ruledOut) continue;
      const cur = setAside.get(id) ?? { evidence: [], reasons: [] };
      cur.evidence.push({ rule: ig.rule, where: ig.where ?? '.lexcode.yml' });
      if (ig.reason !== undefined && ig.reason !== '' && !cur.reasons.includes(ig.reason)) cur.reasons.push(ig.reason);
      setAside.set(id, cur);
    }
  }
  for (const [id, { evidence, reasons }] of setAside) {
    rows.push({
      verdict: 'WARN',
      id,
      kind: 'ignored-declared-absent',
      evidence,
      rulesTried: rulesFor(id, rs),
      ...(reasons.length > 0 ? { note: reasons.join('; ') } : {}),
    });
  }

  rows.sort((a, b) => ORDER[a.verdict] - ORDER[b.verdict] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return {
    rows,
    signals: r.signals.map((s) => ({ id: s.id, evidence: [...s.evidence] })),
    notices,
    exitCode: rows.some((x) => x.verdict === 'FAIL') ? 1 : 0,
    ignored,
    scope: r.scope,
  };
}
