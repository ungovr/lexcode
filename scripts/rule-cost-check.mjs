#!/usr/bin/env node
// Checks scripts/rule-cost.mjs against the engine: `node scripts/rule-cost-check.mjs [<rule-cost script>]`.
//
// Release-time only, beside rule-cost.mjs (it runs the real engine for about four minutes). It copies the script
// into a scratch tree whose rules/ holds five Swift rules, runs it there, and fails unless:
//   - swift-quadratic-check, a rule that is itself quadratic on any class (each class whose number ends in 00
//     searches the rest of the file for a name that is never there), is named OVER;
//   - three rules quadratic only on a modified class are named NOT CLEARED, since the plain filler has none to match
//     (see MODIFIER_WORD and ATTRIBUTE in rule-cost.mjs): swift-final-quadratic-check (`^final class`),
//     swift-escaped-final-quadratic-check (`\bfinal class`, a modifier behind a regex escape) and
//     swift-attribute-quadratic-check (`^(?:@\w+\s+)*\S+ class`, keyed on a regex attribute and a word before
//     `class`, so it matches `final class` and never a plain `class`);
//   - swift-scanner-hit-check, a copy of swift-health-read, which the pinned engine's Swift scanner bug slows to about
//     56 s on rule-cost's first Swift filler (see BARE_HIT in rule-cost.mjs), is timed and is not OVER;
//   - nothing failed, and the script exits 1.
// What a pass proves depends on the engine. On Opengrep 1.33.1 the scanner bug hits swift-scanner-hit-check, so a
// pass shows a bug hit is cleared on the plain filler. On an engine with the fixed Swift grammar that rule is within
// bounds on the first filler, its line shows no "plain filler" note, and a pass no longer exercises that branch (the
// script says so). The second check also needs swift-health-read and its fixture to exist under that name.
// The engine is LEXCODE_ENGINE, or the one the built CLI names (`npm run build`, `lexcode engine fetch`).

import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = resolve(process.argv[2] ?? join(ROOT, 'scripts', 'rule-cost.mjs'));
const engine =
  process.env.LEXCODE_ENGINE ?? execFileSync(process.execPath, [join(ROOT, 'dist', 'cli.js'), 'engine', 'path'], { encoding: 'utf8' }).trim();

const QUADRATIC = `rules:
  - id: lexcode.check.swift-quadratic-check
    languages: [swift]
    severity: INFO
    message: rule-cost check, a quadratic rule
    pattern-regex: '(?m)^(?:final )?class (C[0-9]*00) (?=(?s:.*)C9999999 = )'
`;
/** Rules quadratic only on a modified class, each expected NOT CLEARED: stem and regex. */
const NOT_CLEARED = [
  ['swift-final-quadratic-check', String.raw`(?m)^final class (C[0-9]*00) (?=(?s:.*)C9999999 = )`],
  ['swift-escaped-final-quadratic-check', String.raw`(?m)\bfinal class (C[0-9]*00) (?=(?s:.*)C9999999 = )`],
  ['swift-attribute-quadratic-check', String.raw`(?m)^(?:@\w+\s+)*\S+ class (C[0-9]*00) (?=(?s:.*)C9999999 = )`],
];
const notClearedRule = (stem, regex) => `rules:
  - id: lexcode.check.${stem}
    languages: [swift]
    severity: INFO
    message: rule-cost check, a quadratic rule on modified classes only
    pattern-regex: '${regex}'
`;

const tree = mkdtempSync(join(tmpdir(), 'lexcode-cost-check-'));
try {
  mkdirSync(join(tree, 'scripts'));
  mkdirSync(join(tree, 'rules', 'check'), { recursive: true });
  copyFileSync(script, join(tree, 'scripts', 'rule-cost.mjs'));
  copyFileSync(join(dirname(script), 'filler.mjs'), join(tree, 'scripts', 'filler.mjs')); // rule-cost.mjs imports its filler
  symlinkSync(join(ROOT, 'node_modules'), join(tree, 'node_modules'), 'dir'); // rule-cost.mjs reads rule files with yaml
  const rules = join(tree, 'rules', 'check');
  writeFileSync(join(rules, 'swift-quadratic-check.yml'), QUADRATIC);
  writeFileSync(join(rules, 'swift-quadratic-check.test.swift'), '// lexcode-expect: 0\nfinal class Start {}\n');
  for (const [stem, regex] of NOT_CLEARED) {
    writeFileSync(join(rules, `${stem}.yml`), notClearedRule(stem, regex));
    writeFileSync(join(rules, `${stem}.test.swift`), '// lexcode-expect: 0\nfinal class Start {}\n');
  }
  const health = join(ROOT, 'rules', 'processes_personal_data');
  copyFileSync(join(health, 'swift-health-read.yml'), join(rules, 'swift-scanner-hit-check.yml'));
  const fixture = readdirSync(health).filter((f) => f.startsWith('swift-health-read.test') && f.endsWith('.swift')).sort()[0];
  copyFileSync(join(health, fixture), join(rules, 'swift-scanner-hit-check.test.swift'));

  const run = spawnSync(process.execPath, [join(tree, 'scripts', 'rule-cost.mjs')], {
    encoding: 'utf8',
    env: { ...process.env, LEXCODE_ENGINE: engine },
    maxBuffer: 16 * 1024 * 1024,
  });
  const out = run.stdout ?? '';
  process.stdout.write(`${(run.stderr ?? '').split('\n')[0]}\n${out}`);
  const line = (stem) => out.split('\n').find((l) => l.startsWith(`check/${stem}.yml`)) ?? '';
  const problems = [];
  if (!/\bOVER\b/.test(line('swift-quadratic-check'))) problems.push('swift-quadratic-check is not named OVER');
  for (const [stem] of NOT_CLEARED) {
    if (!out.split('\n').some((l) => l.startsWith(`NOT CLEARED check/${stem}.yml: `))) problems.push(`${stem} is not named NOT CLEARED`);
  }
  const hit = line('swift-scanner-hit-check');
  if (hit === '') problems.push('swift-scanner-hit-check was not timed');
  else if (/\bOVER\b/.test(hit)) problems.push('swift-scanner-hit-check is named OVER (the scanner bug read as rule cost)');
  if (/^FAILED /m.test(out)) problems.push('a rule failed');
  if (run.status !== 1) problems.push(`rule-cost exited ${String(run.status)}, not 1 (a rule over a bound and rules not cleared)`);
  if (problems.length > 0) {
    process.stdout.write(`rule-cost check FAILED: ${problems.join('; ')}\n`);
    process.exit(1);
  }
  process.stdout.write(
    /plain filler/.test(hit)
      ? 'rule-cost check passed\n'
      : 'rule-cost check passed, but swift-scanner-hit-check was within bounds on the first filler: this engine did not hit the Swift scanner bug, so the plain-filler clearing was not exercised\n',
  );
} finally {
  rmSync(tree, { recursive: true, force: true });
}
