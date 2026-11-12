#!/usr/bin/env node
// A stand-in for the Opengrep binary, driven by environment variables.
//   FAKE_OPENGREP_MODE      ok | exit2 | badjson | errors | fatal | nooutput | sleep | sleep-ignore-term
//                           sleep: keep running for two minutes (a hung engine); sleep-ignore-term also ignores SIGTERM
//   FAKE_OPENGREP_PID_FILE  write this process id there at the start of a scan run
//   FAKE_OPENGREP_GRANDCHILD_PID_FILE  in the sleep modes, start a worker process and write its id there
//   FAKE_OPENGREP_ARGV_LOG  append one JSON line {argv, cwd, env, ruleIds} per scan run (ruleIds: the config's rule ids)
//   FAKE_OPENGREP_ERRORS    JSON array that replaces the engine's errors
//   FAKE_OPENGREP_RESULTS   JSON array that replaces the default results (ok and errors modes)
//   FAKE_OPENGREP_VERSION   the version to print and report (default 1.33.1)
import { spawn } from 'node:child_process';
import { appendFileSync, readFileSync, readlinkSync, realpathSync, writeFileSync } from 'node:fs';

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
      ruleIds: (() => {
        try {
          return [...readFileSync(options['--config'], 'utf8').matchAll(/^ {2}- id: (.+)$/gm)].map((m) => m[1]);
        } catch {
          return null;
        }
      })(),
      rootLink: (() => {
        try {
          return realpathSync(readlinkSync('scan-root'));
        } catch {
          return null;
        }
      })(),
      env: {
        SEMGREP_SEND_METRICS: process.env.SEMGREP_SEND_METRICS,
        OPENGREP_ENABLE_VERSION_CHECK: process.env.OPENGREP_ENABLE_VERSION_CHECK,
        TMPDIR: process.env.TMPDIR,
        TMP: process.env.TMP,
        TEMP: process.env.TEMP,
        SEMGREP_LOG_FILE: process.env.SEMGREP_LOG_FILE,
        XDG_CACHE_HOME: process.env.XDG_CACHE_HOME,
        NoDefaultCurrentDirectoryInExePath: process.env.NoDefaultCurrentDirectoryInExePath,
      },
    })}\n`,
  );
}

if (process.env.FAKE_OPENGREP_PID_FILE) writeFileSync(process.env.FAKE_OPENGREP_PID_FILE, String(process.pid));

if (mode === 'sleep' || mode === 'sleep-ignore-term') {
  if (mode === 'sleep-ignore-term') process.on('SIGTERM', () => {});
  if (process.env.FAKE_OPENGREP_GRANDCHILD_PID_FILE) {
    const worker = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
    writeFileSync(process.env.FAKE_OPENGREP_GRANDCHILD_PID_FILE, String(worker.pid));
  }
  setInterval(() => {}, 1000);
  await new Promise(() => {});
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
if (process.env.FAKE_OPENGREP_ERRORS) errors = JSON.parse(process.env.FAKE_OPENGREP_ERRORS);
if (mode === 'fatal') {
  errors = [{ code: 7, level: 'error', type: 'InvalidRuleSchemaError', rule_id: 'lexcode.test.rule', message: 'rule is broken: missing pattern' }];
}

writeFileSync(out, JSON.stringify({ version, results, errors, paths: { scanned: targets } }));
process.exit(0);
