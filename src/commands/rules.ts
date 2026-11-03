import { fromCwd } from './fsutil.js';
import { loadRuleSet } from '../rules/load.js';
import { defaultIo, flag, parseFlags, strList, type Io } from './args.js';
import type { RuleSet } from '../types.js';
import { USAGE } from '../usage.js';

export async function runRulesCommand(argv: string[], io: Io = defaultIo(), deps: { rs?: RuleSet } = {}): Promise<number> {
  const p = parseFlags(argv, { json: { type: 'boolean' }, rules: { type: 'string', multiple: true } }, { min: 0, max: 0, what: 'no arguments' });
  if (flag(p, 'help')) {
    io.stdout(USAGE);
    return 0;
  }
  const rs = deps.rs ?? loadRuleSet(strList(p, 'rules').map(fromCwd));
  const rows = rs.rules.map((r) => ({
    id: r.id,
    activity: r.activity,
    mentioned: r.mentioned,
    strength: r.strength,
    languages: r.languages,
    definition: r.definition,
  }));
  if (flag(p, 'json')) {
    io.stdout(`${JSON.stringify(rows, null, 2)}\n`);
    return 0;
  }
  if (rows.length === 0) {
    io.stdout('This rule set holds no source rules. Add some with --rules <dir>, or read `lexcode explain <activity-id>` for what each activity means.\n');
    return 0;
  }
  const width = (f: (r: (typeof rows)[number]) => string): number => Math.max(...rows.map((r) => f(r).length));
  const w = { id: width((r) => r.id), activity: width((r) => r.activity), strength: width((r) => `${r.mentioned}/${r.strength}`) };
  for (const r of rows) {
    io.stdout(`${r.id.padEnd(w.id)}  ${r.activity.padEnd(w.activity)}  ${`${r.mentioned}/${r.strength}`.padEnd(w.strength)}  ${r.languages.join(', ')}\n`);
  }
  io.stdout(`\n${rows.length} ${rows.length === 1 ? 'rule' : 'rules'}\n`);
  return 0;
}
