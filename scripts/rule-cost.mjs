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
// Each size is timed in an engine run of its own, and each time is the lowest of up to three runs, because load
// on the machine only adds time; a rule within both bounds after its first run is not run again. A Swift run the
// engine's scanner bug hit (SCANNER_HIT below) is run again under other file names, and a rule hit every time is
// named as not measured, not as over a bound. The script names every rule over a bound, and every rule the engine
// failed on, and exits 1 if there is any.
//
// It needs the built CLI for the engine's path (`npm run build`, then `lexcode engine fetch` once), or
// LEXCODE_ENGINE=<path>. Rules for build and config files (Gradle, Maven, Composer, package manifests) are
// not timed: their fixtures are not code this filler extends, and their `paths` keep them to a few files.

import { execFile, execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RULES = join(ROOT, 'rules');
const SMALL_KB = 90;
const LARGE_KB = 900;
const GROWTH_MAX = 2;
const WEIGHT_MAX = 5;
const ATTEMPTS = 3;
/**
 * The two files' names, without the extension. Each is 12 characters or more on purpose: the pinned engine's Swift
 * scanner (opengrep/semgrep-swift lib/scanner.c) allocates its state with `calloc(0, ...)`, and on the engine's musl
 * build a target path of 11 characters or fewer frees its C string into the slot the scanner then reads, so a
 * modified class parses in quadratic time (`large.swift` at 900 KB: 57 s, against 2.2 s under a longer name), and
 * the bare figure every Swift ratio divides by stops being a parse figure. tree-sitter-swift fixed it upstream in
 * 8abb3e8b33 (calloc(1, ...)); Opengrep 1.33.1 still pins the unfixed fork. Other languages are not affected, and
 * use the same names so every figure is taken the same way.
 */
const SMALL_NAME = 'unit-090kb';
const LARGE_NAME = 'unit-900kb';
/**
 * The same scanner bug also follows the allocations made before the file is parsed, not only the path's length
 * (fname-cost-report: whatever small allocation was freed last decides the scanner's state), so loading some
 * rules leaves the slot dirty and the 900 KB Swift file parses in about 56 s under any name. Each size is
 * therefore timed in an engine run of its own, and a Swift run whose 900 KB time is over SCANNER_HIT times 10
 * times its 90 KB time (a clean parse grows about 9x) is taken as hit by the bug and run again, up to three
 * times, under the next names below. A rule hit every time is reported as not measured; a pair of names for
 * the first run and one per rerun, each 12 characters or more.
 */
const SCANNER_HIT = 4;
const RUN_NAMES = [
  [SMALL_NAME, LARGE_NAME],
  ['unit-090kb-rerun-1', 'unit-900kb-rerun-1'],
  ['u-090kb-second-rerun-x2', 'u-900kb-second-rerun-x2'],
  ['unit-sized-090kb-third-rerun', 'unit-sized-900kb-third-rerun'],
];
/** One engine run on the two files; far above any rule worth keeping, so a runaway rule fails instead of hanging. */
const SCAN_CAP_MS = 15 * 60 * 1000;

const JAVA = { language: 'java', bare: 'C0', unit: 'class C%N { private int a; private int b; void m() { int x = 1; } }\n' };
const KOTLIN = { language: 'kotlin', bare: 'C0', unit: 'class C%N { private val a: Int = 1; private val b: Int = 2; fun m() { val x = 1 } }\n' };
const TYPESCRIPT = { language: 'typescript', bare: 'C0', unit: 'class C%N { a: number = 1; b: number = 2; m(p: number) { const x = p + 1; return x; } }\n' };
/** Filler per fixture extension: dense in classes, fields, functions and returns, naming nothing a rule looks for. */
const LANGS = {
  '.java': JAVA,
  '.kt': KOTLIN,
  '.php': { language: 'php', bare: 'f0', unit: 'function f%N($a, $b) { $x = $a + $b; return $x * 2; }\n', head: '<?php\n' },
  '.rb': { language: 'ruby', bare: 'C0', unit: 'class C%N\n  def m(a, b)\n    x = a + b\n    x * 2\n  end\nend\n' },
  '.py': { language: 'python', bare: 'C0', unit: 'class C%N:\n    a = 1\n    b = 2\n\n    def m(self, p):\n        x = p + 1\n        return x\n\n\n' },
  '.js': { language: 'javascript', bare: 'C0', unit: 'class C%N { constructor() { this.a = 1; this.b = 2; } m(p) { const x = p + 1; return x; } }\n' },
  '.ts': TYPESCRIPT,
  '.tsx': TYPESCRIPT,
  '.go': { language: 'go', bare: 'C0', unit: 'type C%N struct {\n\ta int\n\tb int\n}\n\nfunc (c C%N) M(p int) int {\n\tx := p + 1\n\treturn x\n}\n\n', head: 'package demo\n\n' },
  '.cs': { language: 'csharp', bare: 'C0', unit: 'public class C%N { private int a = 1; private int b = 2; public int M(int p) { var x = p + 1; return x * 2; } }\n' },
  '.swift': { language: 'swift', bare: 'C0', unit: 'final class C%N { private let a = 1; private let b = 2; func m() -> Int { let x = a + b; return x * 2 } }\n' },
  '.rs': { language: 'rust', bare: 'f0', unit: 'fn f%N(a: i64, b: i64) -> i64 { let x = a + b; x * 2 }\n' },
};

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

/** Each rule file with its first positive fixture in a language above: `<stem>.yml` and `<stem>.test*.<ext>`. */
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
    const fixture = readdirSync(dir)
      .filter((f) => f.startsWith(`${stem}.test`) && !f.includes('.neg.') && extname(f) in LANGS)
      .sort()[0];
    if (fixture) out.push({ rule: p, fixture: join(dir, fixture) });
  }
  return out.sort((x, y) => x.rule.localeCompare(y.rule));
}

function fill(head, unit, kb) {
  const parts = [head.endsWith('\n') || head === '' ? head : `${head}\n`];
  let n = parts[0].length;
  for (let i = 0; n < kb * 1000; i++) {
    const s = unit.replaceAll('%N', String(i));
    parts.push(s);
    n += s.length;
  }
  return parts.join('');
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

/**
 * The lowest time per file over up to ATTEMPTS rounds, stopping early once `enough` says so. Each file is timed in
 * an engine run of its own, so one file's parse cannot change the allocations another is parsed after.
 */
async function lowest(engine, config, dir, files, enough = () => false) {
  const best = {};
  for (let i = 0; i < ATTEMPTS; i++) {
    for (const f of files) {
      const r = await scan(engine, config, dir, [f]);
      if (r.error) return { error: r.error };
      if (r.times[f] !== undefined) best[f] = Math.min(best[f] ?? Infinity, r.times[f]);
    }
    if (files.some((f) => best[f] === undefined) || enough(best)) break;
  }
  return { best };
}

/** A Swift pair of times the engine's scanner bug hit (see SCANNER_HIT). */
function scannerHit(ext, small, large) {
  return ext === '.swift' && large > SCANNER_HIT * 10 * small;
}

/**
 * Writes the two files under each pair of RUN_NAMES in turn and times them with `lowest`, until a run is not hit by
 * the Swift scanner bug. Returns `{ small, large }`, `{ error }`, `{ notRun: true }`, or `{ scannerBug, small, large }`
 * with the last run's times when every run was hit.
 */
async function timePair(engine, config, dir, ext, text, enough) {
  let last;
  for (const [smallName, largeName] of RUN_NAMES) {
    const small = `${smallName}${ext}`;
    const large = `${largeName}${ext}`;
    writeFileSync(join(dir, small), text.small);
    writeFileSync(join(dir, large), text.large);
    const r = await lowest(engine, config, dir, [small, large], (t) => enough({ small: t[small], large: t[large] }));
    rmSync(join(dir, small), { force: true });
    rmSync(join(dir, large), { force: true });
    if (r.error) return { error: r.error };
    if (r.best[small] === undefined || r.best[large] === undefined) return { notRun: true };
    last = { small: r.best[small], large: r.best[large] };
    if (!scannerHit(ext, last.small, last.large)) return last;
  }
  return { scannerBug: true, ...last };
}

async function baselines(engine, exts) {
  const base = {};
  for (const ext of exts) {
    const l = LANGS[ext];
    const dir = mkdtempSync(join(tmpdir(), 'lexcode-cost-'));
    try {
      writeFileSync(join(dir, 'bare.yml'), `rules:\n  - id: bare\n    languages: [${l.language}]\n    severity: INFO\n    message: bare\n    pattern: ${l.bare}\n`);
      const text = { small: fill(l.head ?? '', l.unit, SMALL_KB), large: fill(l.head ?? '', l.unit, LARGE_KB) };
      const r = await timePair(engine, join(dir, 'bare.yml'), dir, ext, text, (t) => t.small !== undefined && t.large !== undefined && scannerHit(ext, t.small, t.large));
      if (r.error || r.notRun || r.scannerBug) {
        const why = r.error ?? (r.scannerBug ? `the engine's Swift scanner bug hit every run (${r.small.toFixed(2)} -> ${r.large.toFixed(2)} s)` : 'no time for its files');
        process.stderr.write(`the bare ${l.language} rule did not run: ${why}\n`);
        return undefined;
      }
      base[ext] = { small: r.small, large: r.large, growth: r.large / Math.max(r.small, 0.01) };
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
  const ratios = (t) => ({
    growth: t.large / Math.max(t.small, 0.01) / base[ext].growth,
    weight: t.large / base[ext].large,
  });
  try {
    const text = { small: fill(head, l.unit, SMALL_KB), large: fill(head, l.unit, LARGE_KB) };
    const r = await timePair(engine, rule, dir, ext, text, (t) => {
      if (t.small === undefined || t.large === undefined) return false;
      // a hit run is the same on every attempt under the same names (probed), so go on to the next names
      if (scannerHit(ext, t.small, t.large)) return true;
      const q = ratios(t);
      return q.growth <= GROWTH_MAX && q.weight <= WEIGHT_MAX;
    });
    if (r.error) return { rule, failed: r.error };
    if (r.notRun) return { rule, notRun: true };
    if (r.scannerBug) return { rule, scannerBug: true, small: r.small, hitLarge: r.large };
    const q = ratios(r);
    return { rule, small: r.small, large: r.large, ...q, over: q.growth > GROWTH_MAX || q.weight > WEIGHT_MAX };
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
const hit = results.filter((r) => r.scannerBug);
for (const r of hit) {
  process.stdout.write(
    `engine scanner bug, not measured: ${relative(RULES, r.rule)} (hit in all ${RUN_NAMES.length} runs; last ${r.small.toFixed(2)} -> ${r.hitLarge.toFixed(2)} s)\n`,
  );
}
const failed = results.filter((r) => r.failed);
for (const r of failed) process.stdout.write(`FAILED ${relative(RULES, r.rule)}: ${r.failed}\n`);
const over = timed.filter((r) => r.over);
process.stdout.write(
  `${timed.length} rules timed; ${over.length} over a bound (growth over ${GROWTH_MAX}x the bare parse's, or weight over ${WEIGHT_MAX}x it); ` +
    `${failed.length} failed; ${hit.length} not measured (the engine's Swift scanner bug)\n`,
);
process.exit(over.length || failed.length ? 1 : 0);
