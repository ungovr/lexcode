#!/usr/bin/env node
// Times every code rule on a large file: `node scripts/rule-cost.mjs [--only <regex>] [--jobs <n>]`.
//
// Release-time only, run by a maintainer on a quiet machine (RELEASING.md, CONTRIBUTING.md "Cost"). A scan
// gives each rule 30 s per file (`--timeout 30`), and a rule that does not finish a file loses that file's
// matches as a file error (#13009). For each rule with a positive fixture in a language below, the script
// writes the fixture followed by filler of that language to 90 KB and to 900 KB, runs the engine with only
// that rule on both, and reports two ratios, each of two timings taken on one machine, so they hold on a
// fast machine and a slow one alike:
//   growth  the 900 KB file's time over the 90 KB file's. Linear cost is about 10x, quadratic about 100x.
//   weight  the 900 KB file's time over a bare rule's on 900 KB of the same filler, which is mostly the
//           engine parsing the file. A rule that costs several parses runs out of its 30 s on a slower machine.
// A rule over either bound is measured again, up to three times in all, and its lowest ratios count, because
// load on the machine only adds time. The script names every rule still over a bound and exits 1.
//
// It needs the built CLI for the engine's path (`npm run build`, then `lexcode engine fetch` once), or
// LEXCODE_ENGINE=<path>. A rule whose `paths` keep the engine off the generated file is listed as not run.

import { execFile, execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RULES = join(ROOT, 'rules');
const SMALL_KB = 90;
const LARGE_KB = 900;
const GROWTH_MAX = 30;
const WEIGHT_MAX = 3;
const ATTEMPTS = 3;

/** Filler per fixture extension: dense in classes, fields, functions and returns, naming nothing a rule looks for. */
const LANGS = {
  '.java': { language: 'java', bare: 'C0', unit: 'class C%N { private int a; private int b; void m() { int x = 1; } }\n' },
  '.kt': { language: 'kotlin', bare: 'C0', unit: 'class C%N { private val a: Int = 1; private val b: Int = 2; fun m() { val x = 1 } }\n' },
  '.php': { language: 'php', bare: 'f0', unit: 'function f%N($a, $b) { $x = $a + $b; return $x * 2; }\n', head: '<?php\n' },
  '.rb': { language: 'ruby', bare: 'C0', unit: 'class C%N\n  def m(a, b)\n    x = a + b\n    x * 2\n  end\nend\n' },
  '.py': { language: 'python', bare: 'C0', unit: 'class C%N:\n    a = 1\n    b = 2\n\n    def m(self, p):\n        x = p + 1\n        return x\n\n\n' },
  '.js': { language: 'javascript', bare: 'C0', unit: 'class C%N { constructor() { this.a = 1; this.b = 2; } m(p) { const x = p + 1; return x; } }\n' },
  '.ts': { language: 'typescript', bare: 'C0', unit: 'class C%N { a: number = 1; b: number = 2; m(p: number) { const x = p + 1; return x; } }\n' },
  '.go': { language: 'go', bare: 'C0', unit: 'type C%N struct {\n\ta int\n\tb int\n}\n\nfunc (c C%N) M(p int) int {\n\tx := p + 1\n\treturn x\n}\n\n', head: 'package demo\n\n' },
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
  const parts = [head.endsWith('\n') ? head : `${head}\n`];
  let n = parts[0].length;
  for (let i = 0; n < kb * 1000; i++) {
    const s = unit.replaceAll('%N', String(i));
    parts.push(s);
    n += s.length;
  }
  return parts.join('');
}

function scan(engine, config, cwd, targets) {
  const out = join(cwd, 'out.json');
  const argv = ['scan', '--config', config, '--json-output', out, '--disable-version-check', '--quiet', '--timeout', '0', '--time', '--jobs', '1', '--', ...targets];
  return new Promise((resolve) => {
    execFile(engine, argv, { cwd, maxBuffer: 64 * 1024 * 1024 }, () => {
      const times = {};
      try {
        const doc = JSON.parse(readFileSync(out, 'utf8'));
        for (const t of doc.time?.targets ?? []) times[basename(t.path)] = t.run_time;
      } catch {
        // No output: every target counts as not run.
      }
      resolve(times);
    });
  });
}

async function baselines(engine) {
  const base = {};
  for (const [ext, l] of Object.entries(LANGS)) {
    const dir = mkdtempSync(join(tmpdir(), 'lexcode-cost-'));
    try {
      writeFileSync(join(dir, `big${ext}`), fill(l.head ?? '', l.unit, LARGE_KB));
      writeFileSync(join(dir, 'bare.yml'), `rules:\n  - id: bare\n    languages: [${l.language}]\n    severity: INFO\n    message: bare\n    pattern: ${l.bare}\n`);
      let best = Infinity;
      for (let i = 0; i < ATTEMPTS; i++) best = Math.min(best, (await scan(engine, join(dir, 'bare.yml'), dir, [`big${ext}`]))[`big${ext}`] ?? Infinity);
      base[ext] = best;
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
  try {
    writeFileSync(join(dir, `small${ext}`), fill(head, l.unit, SMALL_KB));
    writeFileSync(join(dir, `large${ext}`), fill(head, l.unit, LARGE_KB));
    let best;
    for (let i = 0; i < ATTEMPTS; i++) {
      const t = await scan(engine, rule, dir, [`small${ext}`, `large${ext}`]);
      const small = t[`small${ext}`];
      const large = t[`large${ext}`];
      if (small === undefined || large === undefined) return { rule, ext, ran: false };
      const growth = large / Math.max(small, 0.01);
      const weight = large / base[ext];
      best = best
        ? { small: Math.min(best.small, small), large: Math.min(best.large, large), growth: Math.min(best.growth, growth), weight: Math.min(best.weight, weight) }
        : { small, large, growth, weight };
      if (best.growth <= GROWTH_MAX && best.weight <= WEIGHT_MAX) break;
    }
    return { rule, ext, ran: true, ...best, over: best.growth > GROWTH_MAX || best.weight > WEIGHT_MAX };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function pool(items, jobs, fn) {
  const results = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: jobs }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
        process.stderr.write(`\r${results.filter(Boolean).length} of ${items.length}`);
      }
    }),
  );
  process.stderr.write('\n');
  return results;
}

const { only, jobs } = args();
const engine = enginePath();
const todo = rulesWithFixtures(RULES).filter((r) => !only || only.test(relative(ROOT, r.rule)));
const base = await baselines(engine);
process.stderr.write(`bare parse of ${LARGE_KB} KB: ${Object.entries(base).map(([e, s]) => `${e} ${s.toFixed(2)} s`).join(', ')}\n`);
const results = await pool(todo, jobs, (r) => measure(engine, base, r));
const ran = results.filter((r) => r.ran).sort((a, b) => b.weight - a.weight);
const fmt = (n, d = 2) => n.toFixed(d).padStart(7);
process.stdout.write(`${'rule'.padEnd(64)} ${'90 KB'.padStart(7)} ${'900 KB'.padStart(7)} ${'growth'.padStart(7)} ${'weight'.padStart(7)}\n`);
for (const r of ran) {
  process.stdout.write(`${relative(RULES, r.rule).padEnd(64)} ${fmt(r.small)} ${fmt(r.large)} ${fmt(r.growth, 1)}x ${fmt(r.weight, 1)}x${r.over ? '  OVER' : ''}\n`);
}
const notRun = results.filter((r) => !r.ran);
if (notRun.length) process.stdout.write(`not run (the rule's paths keep the engine off the file): ${notRun.map((r) => relative(RULES, r.rule)).join(', ')}\n`);
const over = ran.filter((r) => r.over);
process.stdout.write(`${ran.length} rules timed; ${over.length} over a bound (growth over ${GROWTH_MAX}x for 10x the file, or weight over ${WEIGHT_MAX}x a bare parse)\n`);
process.exit(over.length ? 1 : 0);
