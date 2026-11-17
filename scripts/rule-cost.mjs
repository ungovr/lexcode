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
// on the machine only adds time. The 90 KB file is run in all three rounds: a 90 KB time inflated by load lowers the
// growth ratio and would let a rule through, while the 900 KB file of a rule within both bounds after its first run is
// not run again (lowest, scripts/cost-samples.mjs). A Swift rule over a bound is measured again on a second filler
// the engine's Swift scanner bug cannot touch (`plain`, in filler.mjs); a rule within bounds there is cleared only if
// it names no modifier or attribute and matches no more on the first filler than on the plain one (BARE_HIT,
// scripts/swift-modifiers.mjs). The script names every rule over a bound, every rule not cleared, and every rule the
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
import { lowest } from './cost-samples.mjs';
import { FILLER, fill } from './filler.mjs';
import { namedModifiers, notClearedReasons } from './swift-modifiers.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RULES = join(ROOT, 'rules');
const SMALL_KB = 90;
const LARGE_KB = 900;
const GROWTH_MAX = 2;
const WEIGHT_MAX = 5;
/**
 * The two files' names, without the extension. With it, each path the engine is handed (`unit-090kb.swift`, run in the
 * files' own directory) is 12 characters or more on purpose: the pinned engine's Swift
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
 * The same scanner bug also follows the allocations made before a file is parsed, not only the path's length:
 * whatever small allocation was freed last decides the scanner's state, so loading some rules leaves it dirty and
 * the 900 KB Swift filler parses in about 56 s under any name (25 of the 71 Swift rules on Opengrep 1.33.1, the
 * same 56 s for one rule under four names, measured for #13199). The engine's own account cannot tell that from a
 * slow rule: `--time` reports a rule's matching inside `parse_time` (a quadratic scratch rule: 900 KB run 83.6 s,
 * parse 77.9 s, match 0), so `parse_time` is not used. What the bug needs is a class with a modifier or attribute
 * (`final class`, `public class`, `@objc class`); a plain `class` is never slowed. So a Swift rule over a bound on
 * the first filler is measured again on LANGS['.swift'].plain (scripts/filler.mjs), a filler of plain classes with no modifier at all,
 * against a bare rule on that filler. Those figures can show only what that filler exercises:
 * - over on the plain filler: the rule is over (it is slow on plain declarations);
 * - within bounds there, the rule's file names no modifier or attribute outside a `pattern-not` (namedModifiers in
 *   scripts/swift-modifiers.mjs), and the rule matched no more on the first filler's 900 KB file than on the plain
 *   one's: the rule is cleared, since its first-filler time was the bug;
 * - within bounds there, but the rule names a modifier or attribute, or matched more on the first filler: not
 *   cleared (notClearedReasons). The plain filler gives such a rule nothing to match, so it cannot tell a rule slowed
 *   by the bug from one that is slow on modified declarations itself; the script names it and exits 1, and a person
 *   decides. The match count catches a rule keyed on modified declarations through a shape that names no modifier
 *   (`^\S+ class`), which the name test cannot see (#13322).
 * A bare Swift rule whose 900 KB time is over BARE_HIT times its 90 KB time (a clean parse grows about 10x) stops the
 * script: every Swift ratio divides by it.
 */
const BARE_HIT = 40;
/** One engine run on the two files; far above any rule worth keeping, so a runaway rule fails instead of hanging. */
const SCAN_CAP_MS = 15 * 60 * 1000;

/** Filler per fixture extension (scripts/filler.mjs); Swift's carries a second, `plain` filler (see BARE_HIT). */
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

/**
 * Runs the engine once; `times` maps each target's file name to its run time and `counts` to its number of matches, or
 * `error` says why there are none.
 */
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
      const counts = Object.fromEntries(targets.map((t) => [basename(t), 0]));
      for (const m of doc.results ?? []) {
        const f = basename(m.path ?? '');
        if (f in counts) counts[f]++;
      }
      resolve({ times, counts });
    });
  });
}

/**
 * Writes the two files and times them with `lowest`, the 90 KB file in every round: it is cheap, and one sample taken
 * under load keeps a rule's growth ratio low, which fails open here and kept a probe under the bound in
 * rule-cost-check.mjs (#13322). Resolves to `{ small, large, matches }` (`matches` is the 900 KB file's match count, of
 * its fastest run), `{ error }` or `{ notRun: true }`.
 */
async function timePair(engine, config, dir, ext, text, enough = () => false) {
  const small = `${SMALL_NAME}${ext}`;
  const large = `${LARGE_NAME}${ext}`;
  writeFileSync(join(dir, small), text.small);
  writeFileSync(join(dir, large), text.large);
  try {
    const r = await lowest((f) => scan(engine, config, dir, [f]), [small, large], {
      enough: (t) => t[small] !== undefined && t[large] !== undefined && enough({ small: t[small], large: t[large] }),
      always: [small],
    });
    if (r.error) return { error: r.error };
    if (r.best[small] === undefined || r.best[large] === undefined) return { notRun: true };
    return { small: r.best[small], large: r.best[large], matches: r.counts[large] };
  } finally {
    rmSync(join(dir, small), { force: true });
    rmSync(join(dir, large), { force: true });
  }
}

/** The bare rule's figures on one filler, or a reason it has none. */
async function bareOn(engine, dir, ext, l, unit) {
  const r = await timePair(engine, join(dir, 'bare.yml'), dir, ext, { small: fill(l.head ?? '', unit, SMALL_KB), large: fill(l.head ?? '', unit, LARGE_KB) });
  if (r.error || r.notRun) return { why: r.error ?? 'no time for its files' };
  if (ext === '.swift' && r.large > BARE_HIT * r.small) return { why: `the engine's Swift scanner bug hit it (${r.small.toFixed(2)} -> ${r.large.toFixed(2)} s)` };
  return { small: r.small, large: r.large, growth: r.large / Math.max(r.small, 0.01) };
}

async function baselines(engine, exts) {
  const base = {};
  for (const ext of exts) {
    const l = LANGS[ext];
    const dir = mkdtempSync(join(tmpdir(), 'lexcode-cost-'));
    try {
      writeFileSync(join(dir, 'bare.yml'), `rules:\n  - id: bare\n    languages: [${l.language}]\n    severity: INFO\n    message: bare\n    pattern: ${l.bare}\n`);
      for (const [key, unit] of [['unit', l.unit], ['plain', l.plain]]) {
        if (unit === undefined) continue;
        const b = await bareOn(engine, dir, ext, l, unit);
        if (b.why) {
          process.stderr.write(`the bare ${l.language} rule${key === 'plain' ? ' (plain filler)' : ''} did not run: ${b.why}\n`);
          return undefined;
        }
        if (key === 'unit') base[ext] = b;
        else base[ext].plain = b;
      }
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
  const ratios = (t, b) => ({ growth: t.large / Math.max(t.small, 0.01) / b.growth, weight: t.large / b.large });
  const within = (q) => q.growth <= GROWTH_MAX && q.weight <= WEIGHT_MAX;
  try {
    // A Swift rule over a bound on the first round goes straight to the plain filler, which decides: more rounds
    // of a 56 s parse would not change that.
    const r = await timePair(engine, rule, dir, ext, { small: fill(head, l.unit, SMALL_KB), large: fill(head, l.unit, LARGE_KB) }, (t) =>
      l.plain !== undefined || within(ratios(t, base[ext])),
    );
    if (r.error) return { rule, failed: r.error };
    if (r.notRun) return { rule, notRun: true };
    const q = ratios(r, base[ext]);
    if (within(q) || l.plain === undefined) return { rule, small: r.small, large: r.large, ...q, over: !within(q) };
    // over on the first filler: the plain filler decides (see BARE_HIT)
    const p = await timePair(engine, rule, dir, ext, { small: fill(head, l.plain, SMALL_KB), large: fill(head, l.plain, LARGE_KB) }, (t) =>
      within(ratios(t, base[ext].plain)),
    );
    if (p.error) return { rule, failed: `${p.error} (plain filler)` };
    if (p.notRun) return { rule, small: r.small, large: r.large, ...q, over: true };
    const pq = ratios(p, base[ext].plain);
    const first = { small: r.small, large: r.large };
    if (within(pq)) {
      let named;
      try {
        named = namedModifiers(readFileSync(rule, 'utf8'));
      } catch (e) {
        return { rule, failed: `cannot read the rule file for its modifiers: ${e instanceof Error ? e.message : String(e)}` };
      }
      const reasons = notClearedReasons({ named, firstMatches: r.matches, plainMatches: p.matches });
      if (reasons.length > 0) return { rule, notCleared: reasons, plain: { small: p.small, large: p.large, ...pq }, first };
    }
    return { rule, small: p.small, large: p.large, ...pq, over: !within(pq), first };
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
  `bare rule, ${SMALL_KB} KB -> ${LARGE_KB} KB: ${Object.entries(base)
    .flatMap(([e, b]) => [[e, b], ...(b.plain ? [[`${e} plain`, b.plain]] : [])])
    .map(([e, b]) => `${e} ${b.small.toFixed(2)} -> ${b.large.toFixed(2)} s (${b.growth.toFixed(1)}x)`)
    .join(', ')}\n`,
);
const results = await pool(todo, jobs, (r) => measure(engine, base, r));
const timed = results.filter((r) => r.large !== undefined).sort((a, b) => b.weight - a.weight);
const fmt = (n, d = 2) => n.toFixed(d).padStart(7);
process.stdout.write(`${'rule'.padEnd(64)} ${'90 KB'.padStart(7)} ${'900 KB'.padStart(7)} ${'growth'.padStart(7)} ${'weight'.padStart(7)}\n`);
for (const r of timed) {
  const second = r.first ? `  plain filler (first filler ${r.first.small.toFixed(2)} -> ${r.first.large.toFixed(2)} s)` : '';
  process.stdout.write(`${relative(RULES, r.rule).padEnd(64)} ${fmt(r.small)} ${fmt(r.large)} ${fmt(r.growth, 1)}x ${fmt(r.weight, 1)}x${r.over ? '  OVER' : ''}${second}\n`);
}
const notRun = results.filter((r) => r.notRun);
if (notRun.length) process.stdout.write(`not run (the rule's paths keep the engine off the file): ${notRun.map((r) => relative(RULES, r.rule)).join(', ')}\n`);
const failed = results.filter((r) => r.failed);
for (const r of failed) process.stdout.write(`FAILED ${relative(RULES, r.rule)}: ${r.failed}\n`);
const notCleared = results.filter((r) => r.notCleared);
for (const r of notCleared) {
  process.stdout.write(
    `NOT CLEARED ${relative(RULES, r.rule)}: the plain filler does not exercise it (${r.notCleared.join('; ')}); ` +
      `first filler ${r.first.small.toFixed(2)} -> ${r.first.large.toFixed(2)} s, plain ${r.plain.small.toFixed(2)} -> ${r.plain.large.toFixed(2)} s\n`,
  );
}
const over = timed.filter((r) => r.over);
const retimed = timed.filter((r) => r.first).length + notCleared.length;
process.stdout.write(
  `${timed.length} rules timed; ${over.length} over a bound (growth over ${GROWTH_MAX}x the bare parse's, or weight over ${WEIGHT_MAX}x it); ` +
    `${failed.length} failed` +
    (retimed > 0 ? `; ${retimed} timed again on the plain Swift filler (${timed.filter((r) => r.first && !r.over).length} cleared, ${notCleared.length} not cleared)` : '') +
    '\n',
);
process.exit(over.length || failed.length || notCleared.length ? 1 : 0);
