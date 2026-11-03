import type { Evidence, EvidenceRecord, Mentioned, RuleSet } from '../types.js';

const REGISTRY_URL = 'https://lexlint.io/activities/v1';

interface Row {
  activity: string;
  mentioned: Mentioned;
  signal: boolean;
  ev: Evidence;
}

function splitWhere(where: string): { uri: string; line: number } {
  const i = where.lastIndexOf(':');
  const n = i < 0 ? NaN : Number(where.slice(i + 1));
  return Number.isInteger(n) && n >= 1 ? { uri: where.slice(0, i), line: n } : { uri: where, line: 1 };
}

/**
 * SARIF 2.1.0 built from the record, not passed through from the engine: rule ids stay bare,
 * each result carries the activity, `mentioned` and the definition URL in `properties`, and
 * the matched line appears only under --snippets.
 */
export function toSarif(r: EvidenceRecord, rs: RuleSet, o: { snippets: boolean }): object {
  const ruleById = new Map(rs.rules.map((x) => [x.id, x]));
  const rows: Row[] = [];
  for (const a of r.activities) for (const ev of a.evidence) rows.push({ activity: a.id, mentioned: a.mentioned, signal: false, ev });
  for (const s of r.signals) {
    for (const ev of s.evidence) rows.push({ activity: s.id, mentioned: ruleById.get(ev.rule)?.mentioned ?? 'performs', signal: true, ev });
  }

  const definitionOf = (row: Row): string => {
    const rule = ruleById.get(row.ev.rule);
    return rule?.definition || rs.registry.get(row.activity)?.page || REGISTRY_URL;
  };

  const ruleIds: string[] = [];
  const driverRules: object[] = [];
  const indexOf = new Map<string, number>();
  for (const row of rows) {
    if (indexOf.has(row.ev.rule)) continue;
    indexOf.set(row.ev.rule, ruleIds.length);
    ruleIds.push(row.ev.rule);
    const rule = ruleById.get(row.ev.rule);
    driverRules.push(
      rule
        ? {
            id: rule.id,
            shortDescription: { text: rule.message || `the code shows ${rule.activity}` },
            helpUri: definitionOf(row),
            properties: { activity: rule.activity, mentioned: rule.mentioned, definition: definitionOf(row) },
          }
        : {
            id: row.ev.rule,
            shortDescription: { text: 'a dependency in a manifest or a file name enables an activity' },
            helpUri: REGISTRY_URL,
          },
    );
  }

  const results = rows.map((row) => {
    const rule = ruleById.get(row.ev.rule);
    const loc = splitWhere(row.ev.where);
    const text = rule?.message || (row.ev.component ? `a dependency enables ${row.activity}: ${row.ev.component}` : `the code shows ${row.activity}`);
    const properties: Record<string, unknown> = {
      activity: row.activity,
      mentioned: row.mentioned,
      definition: definitionOf(row),
    };
    if (row.signal) properties.signal = true;
    if (row.ev.component) properties.component = row.ev.component;
    if (row.ev.host) properties.host = row.ev.host;
    const region: Record<string, unknown> = { startLine: loc.line };
    if (o.snippets && row.ev.snippet) region.snippet = { text: row.ev.snippet };
    return {
      ruleId: row.ev.rule,
      ruleIndex: indexOf.get(row.ev.rule),
      level: 'note',
      message: { text },
      locations: [{ physicalLocation: { artifactLocation: { uri: loc.uri, uriBaseId: '%SRCROOT%' }, region } }],
      properties,
    };
  });

  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'lexcode',
            informationUri: 'https://lexlint.io/lexcode',
            rules: driverRules,
            properties: { ruleSet: `${r.rules.name} ${r.rules.version}`, engine: `${r.engine.name} ${r.engine.version}` },
          },
        },
        results,
      },
    ],
  };
}
