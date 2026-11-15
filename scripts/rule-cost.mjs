#!/usr/bin/env node
// Times every code rule on a large file: `node scripts/rule-cost.mjs [--only <regex>] [--jobs <n>]`.
//
// Release-time only, run by a maintainer on a quiet machine (RELEASING.md, CONTRIBUTING.md "Cost"). A scan
// gives each rule 30 s per file (`--timeout 30`), and a rule that does not finish a file loses that file's
// matches as a file error (#13009). For each rule with a positive fixture in a language below, the script
// writes the fixture followed by filler of that language to 90 KB and to 900 KB, runs the engine with only
// that rule on both, and runs a bare rule (one identifier, so the time is mostly the engine parsing the file)
// on the same sizes of filler. It reports two ratios, each of timings taken on one machine, so they hold on a
// fast machine and a slow one alike:
//   growth  how much faster than the bare parse the rule's time grows for the 10x file: the rule's 900 KB
//           over 90 KB time, divided by the bare rule's. A rule that costs a fixed share of the parse is
//           about 1x; one that pairs every match of one pattern with every match of another is several times
//           that. The engine's own parse grows about 10x for most languages, but about 22x for JavaScript and
//           about 37x for Go, which is why the ratio is taken against it.
//   weight  the rule's 900 KB time over the bare rule's. A rule that costs several parses runs out of its
//           30 s on a slower machine.
// Each time is the lowest of up to three runs, because load on the machine only adds time; a rule within both
// bounds after its first run is not run again. The script names every rule over a bound, and every rule the
// engine failed on, and exits 1 if there is any.
//
// It needs the built CLI for the engine's path (`npm run build`, then `lexcode engine fetch` once), or
// LEXCODE_ENGINE=<path>. Rules for build and config files (Gradle, Maven, Composer, package manifests) are
// not timed: their fixtures are not code this filler extends, and their `paths` keep them to a few files.

import { execFile, execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FILLER, fill } from './filler.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RULES = join(ROOT, 'rules');
const SMALL_KB = 90;
const LARGE_KB = 900;
const GROWTH_MAX = 2;
const WEIGHT_MAX = 5;
const ATTEMPTS = 3;
/** One engine run on the two files; far above any rule worth keeping, so a runaway rule fails instead of hanging. */
const SCAN_CAP_MS = 15 * 60 * 1000;

/** Filler per fixture extension (scripts/filler.mjs). */
const LANGS = FILLER;

function args() {
  const a = process.argv.slice(2);
  let only;
  let jobs = 2;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--only') only = new RegExp(a[++i]);
    else if (a[i] === '--jobs') jobs = Math.max(1, Number(a[++i]) || 1);
    else {
      process.stderr.write('usage: node scripts/rule-cost.mjs [--only <regex>] [--jobs <n>]\n');
      process.exit(2);
    }
  }
  return { only, jobs };
}

function enginePath() {
  if (process.env.LEXCODE_ENGINE) return process.env.LEXCODE_ENGINE;
  try {
    return execFileSync(process.execPath, [join(ROOT, 'dist', 'cli.js'), 'engine', 'path'], { encoding: 'utf8' }).trim();
  } catch {
    process.stderr.write('cannot find the engine: run `npm run build` and `node dist/cli.js engine fetch`, or set LEXCODE_ENGINE=<path>\n');
    process.exit(2);
  }
}

/**
 * Each rule file with its positive fixture in a language above: `<stem>.yml` and `<stem>.test.<ext>`, or the
 * first `<stem>.test.<variant>.<ext>` when there is no plain one. The plain fixture is the case the bounds are
 * for; a variant such as `*.test.calls.*` holds every source call of the rule at once, many at module level,
 * and would time that instead (#13034).
 */
function rulesWithFixtures(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...rulesWithFixtures(p));
      continue;
    }
    if (!entry.name.endsWith('.yml')) continue;
    const stem = entry.name.slice(0, -4);
    const positives = readdirSync(dir)
      .filter((f) => f.startsWith(`${stem}.test`) && !f.includes('.neg.') && extname(f) in LANGS)
      .sort();
    const fixture = positives.find((f) => f === `${stem}.test${extname(f)}`) ?? positives[0];
    if (fixture) out.push({ rule: p, fixture: join(dir, fixture) });
  }
  return out.sort((x, y) => x.rule.localeCompare(y.rule));
}

/** Runs the engine once; `times` maps each target's file name to its run time, or `error` says why there are none. */
function scan(engine, config, cwd, targets) {
  const out = join(cwd, 'out.json');
  rmSync(out, { force: true });
  const argv = ['scan', '--config', config, '--json-output', out, '--disable-version-check', '--quiet', '--timeout', '0', '--time', '--jobs', '1', '--', ...targets];
  return new Promise((resolve) => {
    execFile(engine, argv, { cwd, maxBuffer: 64 * 1024 * 1024, timeout: SCAN_CAP_MS, killSignal: 'SIGKILL' }, (err) => {
      if (err?.killed) return resolve({ error: `stopped after ${SCAN_CAP_MS / 60_000} minutes` });
      let doc;
      try {
        doc = JSON.parse(readFileSync(out, 'utf8'));
      } catch {
        return resolve({ error: `the engine wrote no output${err ? ` (${String(err.code ?? err.signal ?? err.message)})` : ''}` });
      }
      const times = {};
      for (const t of doc.time?.targets ?? []) times[basename(t.path)] = t.run_time;
      resolve({ times });
    });
  });
}

/** The lowest time per file over `attempts` runs, stopping early once `enough` says so. */
async function lowest(engine, config, dir, files, enough = () => false) {
  const best = {};
  for (let i = 0; i < ATTEMPTS; i++) {
    const r = await scan(engine, config, dir, files);
    if (r.error) return { error: r.error };
    for (const f of files) if (r.times[f] !== undefined) best[f] = Math.min(best[f] ?? Infinity, r.times[f]);
    if (files.some((f) => best[f] === undefined) || enough(best)) break;
  }
  return { best };
}

async function baselines(engine, exts) {
  const base = {};
  for (const ext of exts) {
    const l = LANGS[ext];
    const dir = mkdtempSync(join(tmpdir(), 'lexcode-cost-'));
    try {
      writeFileSync(join(dir, `small${ext}`), fill(l.head ?? '', l.unit, SMALL_KB));
      writeFileSync(join(dir, `large${ext}`), fill(l.head ?? '', l.unit, LARGE_KB));
      writeFileSync(join(dir, 'bare.yml'), `rules:\n  - id: bare\n    languages: [${l.language}]\n    severity: INFO\n    message: bare\n    pattern: ${l.bare}\n`);
      const r = await lowest(engine, join(dir, 'bare.yml'), dir, [`small${ext}`, `large${ext}`]);
      const small = r.best?.[`small${ext}`];
      const large = r.best?.[`large${ext}`];
      if (r.error || small === undefined || large === undefined) {
        process.stderr.write(`the bare ${l.language} rule did not run: ${r.error ?? 'no time for its files'}\n`);
        return undefined;
      }
      base[ext] = { small, large, growth: large / Math.max(small, 0.01) };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  return base;
}

async function measure(engine, base, { rule, fixture }) {
  const ext = extname(fixture);
  const l = LANGS[ext];
  const head = readFileSync(fixture, 'utf8');
  const dir = mkdtempSync(join(tmpdir(), 'lexcode-cost-'));
  const small = `small${ext}`;
  const large = `large${ext}`;
  const ratios = (t) => ({
    growth: t[large] / Math.max(t[small], 0.01) / base[ext].growth,
    weight: t[large] / base[ext].large,
  });
  try {
    writeFileSync(join(dir, small), fill(head, l.unit, SMALL_KB));
    writeFileSync(join(dir, large), fill(head, l.unit, LARGE_KB));
    const r = await lowest(engine, rule, dir, [small, large], (t) => {
      const q = ratios(t);
      return q.growth <= GROWTH_MAX && q.weight <= WEIGHT_MAX;
    });
    if (r.error) return { rule, failed: r.error };
    if (r.best[small] === undefined || r.best[large] === undefined) return { rule, notRun: true };
    const q = ratios(r.best);
    return { rule, small: r.best[small], large: r.best[large], ...q, over: q.growth > GROWTH_MAX || q.weight > WEIGHT_MAX };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function pool(items, jobs, fn) {
  const results = [];
  let next = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: jobs }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
        process.stderr.write(`\r${++done} of ${items.length}`);
      }
    }),
  );
  process.stderr.write('\n');
  return results;
}

const { only, jobs } = args();
const engine = enginePath();
const todo = rulesWithFixtures(RULES).filter((r) => !only || only.test(relative(ROOT, r.rule)));
const base = await baselines(engine, [...new Set(todo.map((r) => extname(r.fixture)))]);
if (!base) process.exit(2);
process.stderr.write(
  `bare rule, ${SMALL_KB} KB -> ${LARGE_KB} KB: ${Object.entries(base).map(([e, b]) => `${e} ${b.small.toFixed(2)} -> ${b.large.toFixed(2)} s (${b.growth.toFixed(1)}x)`).join(', ')}\n`,
);
const results = await pool(todo, jobs, (r) => measure(engine, base, r));
const timed = results.filter((r) => r.large !== undefined).sort((a, b) => b.weight - a.weight);
const fmt = (n, d = 2) => n.toFixed(d).padStart(7);
process.stdout.write(`${'rule'.padEnd(64)} ${'90 KB'.padStart(7)} ${'900 KB'.padStart(7)} ${'growth'.padStart(7)} ${'weight'.padStart(7)}\n`);
for (const r of timed) {
  process.stdout.write(`${relative(RULES, r.rule).padEnd(64)} ${fmt(r.small)} ${fmt(r.large)} ${fmt(r.growth, 1)}x ${fmt(r.weight, 1)}x${r.over ? '  OVER' : ''}\n`);
}
const notRun = results.filter((r) => r.notRun);
if (notRun.length) process.stdout.write(`not run (the rule's paths keep the engine off the file): ${notRun.map((r) => relative(RULES, r.rule)).join(', ')}\n`);
const failed = results.filter((r) => r.failed);
for (const r of failed) process.stdout.write(`FAILED ${relative(RULES, r.rule)}: ${r.failed}\n`);
const over = timed.filter((r) => r.over);
process.stdout.write(
  `${timed.length} rules timed; ${over.length} over a bound (growth over ${GROWTH_MAX}x the bare parse's, or weight over ${WEIGHT_MAX}x it); ${failed.length} failed\n`,
);
process.exit(over.length || failed.length ? 1 : 0);
