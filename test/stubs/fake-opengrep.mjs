#!/usr/bin/env node
// A stand-in for the Opengrep binary, driven by environment variables.
//   FAKE_OPENGREP_MODE      ok | exit2 | badjson | errors | fatal | nooutput
//   FAKE_OPENGREP_ARGV_LOG  append one JSON line {argv, cwd, env} per scan run
//   FAKE_OPENGREP_RESULTS   JSON array that replaces the default results (ok and errors modes)
//   FAKE_OPENGREP_VERSION   the version to print and report (default 1.33.1)
import { appendFileSync, writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const version = process.env.FAKE_OPENGREP_VERSION ?? '1.33.1';
const mode = process.env.FAKE_OPENGREP_MODE ?? 'ok';

if (argv.includes('--version')) {
  process.stdout.write(`${version}\n`);
  process.exit(0);
}

const withValue = new Set(['--config', '--json-output', '--timeout', '--jobs']);
const options = {};
const flags = [];
const targets = [];
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (i === 0 && a === 'scan') continue;
  if (a === '--') {
    targets.push(...argv.slice(i + 1));
    break;
  }
  if (withValue.has(a)) {
    options[a] = argv[i + 1];
    i += 1;
  } else if (a.startsWith('--')) {
    flags.push(a);
  } else {
    targets.push(a);
  }
}

if (process.env.FAKE_OPENGREP_ARGV_LOG) {
  appendFileSync(
    process.env.FAKE_OPENGREP_ARGV_LOG,
    `${JSON.stringify({
      argv,
      options,
      flags,
      targets,
      cwd: process.cwd(),
      env: {
        SEMGREP_SEND_METRICS: process.env.SEMGREP_SEND_METRICS,
        OPENGREP_ENABLE_VERSION_CHECK: process.env.OPENGREP_ENABLE_VERSION_CHECK,
      },
    })}\n`,
  );
}

if (mode === 'exit2') {
  process.stderr.write('first stderr line\nconfig exploded\nlast stderr line\n');
  process.exit(2);
}

const out = options['--json-output'];
if (mode === 'nooutput') process.exit(0);
if (mode === 'badjson') {
  writeFileSync(out, '{ this is not json');
  process.exit(0);
}

const defaults = targets.map((t) => ({
  check_id: 'lexcode.test.rule',
  path: t,
  start: { line: 3, col: 1 },
  end: { line: 3, col: 9 },
  extra: {
    metavars: { $X: { abstract_content: 'value-of-x', start: {}, end: {} } },
    message: 'm',
    metadata: {},
    lines: 'some_call(x)',
  },
}));
const results = process.env.FAKE_OPENGREP_RESULTS ? JSON.parse(process.env.FAKE_OPENGREP_RESULTS) : defaults;

let errors = [];
if (mode === 'errors') {
  errors = [
    { code: 3, level: 'warn', type: 'PartialParsing', path: 'a.py', message: 'partial parse' },
    { code: 3, level: 'error', type: ['Syntax error', []], path: 'b.py', message: 'syntax error' },
  ];
}
if (mode === 'fatal') {
  errors = [{ code: 7, level: 'error', type: 'InvalidRuleSchemaError', rule_id: 'lexcode.test.rule', message: 'rule is broken: missing pattern' }];
}

writeFileSync(out, JSON.stringify({ version, results, errors, paths: { scanned: targets } }));
process.exit(0);
