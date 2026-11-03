// Stands in for `lexcode scan <repo> --json` until the scan command exists (Task 5).
// Ensures the engine without downloading, merges the rules, runs the engine over every
// file of the repository, and prints {version, files, matches:[{ruleId,path,line}]} as JSON.
// Needs `npm run build` first: it imports the compiled modules from dist/.
// Usage: node [--require test/stubs/deny-network.cjs] test/stubs/scan-fixture-repo.mjs <repo>
import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = (p) => new URL(`../../dist/${p}`, import.meta.url).href;
const { ensureEngine } = await import(dist('engine/fetch.js'));
const { runEngine } = await import(dist('engine/run.js'));
const { loadRuleSet, writeMergedConfig } = await import(dist('rules/load.js'));

const repo = resolve(process.argv[2] ?? fileURLToPath(new URL('../repos/basic', import.meta.url)));

function listFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listFiles(p));
    else out.push(relative(repo, p).split('\\').join('/'));
  }
  return out;
}

const tmp = mkdtempSync(join(tmpdir(), 'lexcode-scan-stub-'));
try {
  const engine = await ensureEngine({ download: false });
  const rules = loadRuleSet();
  const config = join(tmp, 'rules.yml');
  writeMergedConfig(rules.rules, config);
  const targets = listFiles(repo);
  const run = await runEngine({ engine: engine.path, configFile: config, targets, cwd: repo });
  process.stdout.write(
    `${JSON.stringify({
      version: run.version,
      files: targets.length,
      matches: run.matches.map((m) => ({ ruleId: m.ruleId, path: m.path, line: m.line })),
    })}\n`,
  );
} catch (err) {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 2;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
