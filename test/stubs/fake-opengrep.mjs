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
//   FAKE_OPENGREP_VERSION_LOG  append one JSON line {cwd, env} per --version run
//   FAKE_OPENGREP_RESULTS_BY_TARGET  JSON object: target -> results; a run reports the results of its targets, in target order
//                           (a target the object does not name gets the default result)
//   FAKE_OPENGREP_FAIL_TARGETS  JSON object: target -> message; a run holding the target writes the message and exits 2
//   FAKE_OPENGREP_GO_FILE   a failing run (FAIL_TARGETS) waits for this file to exist before it fails
//   FAKE_OPENGREP_EXIT_FILE a failing run, once it has written its message, closes its stderr and waits for this file before it exits
//   FAKE_OPENGREP_HANG_TARGET  a run holding this target hangs as in sleep mode
//   FAKE_OPENGREP_TERM_EXIT0  in the sleep modes and a hang, exit 0 on SIGTERM without writing output
//   FAKE_OPENGREP_KILL_TARGET  a run holding this target kills itself with SIGKILL (as the out-of-memory killer would)
//   FAKE_OPENGREP_PID_DIR   create a file named by this process id in this directory at the start of a scan run
//   FAKE_OPENGREP_BARRIER   <dir>:<n>  each scan run adds a file to <dir> and waits until <dir> holds <n> files
//                           (10 s at most, then exits 3): passes only when n runs are running at once
//   FAKE_OPENGREP_SLEEP_MS  wait this long before writing the output
//   FAKE_OPENGREP_END_LOG   append one JSON line {pid, end} when a scan run writes its output
import { spawn } from 'node:child_process';
import { appendFileSync, closeSync, existsSync, readdirSync, readFileSync, readlinkSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const version = process.env.FAKE_OPENGREP_VERSION ?? '1.33.1';
const mode = process.env.FAKE_OPENGREP_MODE ?? 'ok';

if (argv.includes('--version')) {
  if (process.env.FAKE_OPENGREP_VERSION_LOG) {
    appendFileSync(process.env.FAKE_OPENGREP_VERSION_LOG, `${JSON.stringify({ cwd: process.cwd(), env: { XDG_CACHE_HOME: process.env.XDG_CACHE_HOME, TMPDIR: process.env.TMPDIR } })}\n`);
  }
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
      pid: process.pid,
      start: Date.now(),
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
if (process.env.FAKE_OPENGREP_PID_DIR) writeFileSync(join(process.env.FAKE_OPENGREP_PID_DIR, String(process.pid)), '');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
if (process.env.FAKE_OPENGREP_BARRIER) {
  const at = process.env.FAKE_OPENGREP_BARRIER.lastIndexOf(':');
  const dir = process.env.FAKE_OPENGREP_BARRIER.slice(0, at);
  const n = Number(process.env.FAKE_OPENGREP_BARRIER.slice(at + 1));
  writeFileSync(join(dir, String(process.pid)), '');
  const until = Date.now() + 10_000;
  while (readdirSync(dir).length < n) {
    if (Date.now() > until) {
      process.stderr.write(`barrier: ${readdirSync(dir).length} of ${n} runs arrived\n`);
      process.exit(3);
    }
    await sleep(10);
  }
}

const failures = process.env.FAKE_OPENGREP_FAIL_TARGETS ? JSON.parse(process.env.FAKE_OPENGREP_FAIL_TARGETS) : {};
const failing = targets.find((t) => t in failures);
if (failing !== undefined) {
  while (process.env.FAKE_OPENGREP_GO_FILE && !existsSync(process.env.FAKE_OPENGREP_GO_FILE)) await sleep(10);
  process.stderr.write(`${failures[failing]}\n`);
  if (process.env.FAKE_OPENGREP_EXIT_FILE) {
    closeSync(2);
    while (!existsSync(process.env.FAKE_OPENGREP_EXIT_FILE)) await sleep(10);
  }
  process.exit(2);
}
if (process.env.FAKE_OPENGREP_KILL_TARGET !== undefined && targets.includes(process.env.FAKE_OPENGREP_KILL_TARGET)) {
  process.kill(process.pid, 'SIGKILL');
  await new Promise(() => {});
}
const hangs = process.env.FAKE_OPENGREP_HANG_TARGET !== undefined && targets.includes(process.env.FAKE_OPENGREP_HANG_TARGET);

if (mode === 'sleep' || mode === 'sleep-ignore-term' || hangs) {
  if (mode === 'sleep-ignore-term') process.on('SIGTERM', () => {});
  else if (process.env.FAKE_OPENGREP_TERM_EXIT0) process.on('SIGTERM', () => process.exit(0));
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

if (process.env.FAKE_OPENGREP_SLEEP_MS) await sleep(Number(process.env.FAKE_OPENGREP_SLEEP_MS));

const defaultFor = (t) => ({
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
});
const defaults = targets.map(defaultFor);
const byTarget = process.env.FAKE_OPENGREP_RESULTS_BY_TARGET ? JSON.parse(process.env.FAKE_OPENGREP_RESULTS_BY_TARGET) : undefined;
const results = process.env.FAKE_OPENGREP_RESULTS
  ? JSON.parse(process.env.FAKE_OPENGREP_RESULTS)
  : byTarget
    ? targets.flatMap((t) => byTarget[t] ?? [defaultFor(t)])
    : defaults;

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
if (process.env.FAKE_OPENGREP_END_LOG) appendFileSync(process.env.FAKE_OPENGREP_END_LOG, `${JSON.stringify({ pid: process.pid, end: Date.now() })}\n`);
process.exit(0);
