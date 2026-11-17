import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { cacheDir } from '../../src/engine/cache.js';
import { pinnedEnginePath } from '../../src/engine/fetch.js';
import { ENGINE_PIN } from '../../src/engine/pin.js';
import { platformKey } from '../../src/engine/platform.js';
import { runEngine } from '../../src/engine/run.js';

// The Rust constructs the pinned engine's grammar cannot read (rules/README.md, "Known Rust gaps",
// "Engine parse faults"; #13296). Each probe in test/engine-probes/rust/ holds one, with a call
// before, inside and after it, and this pins what the engine makes of it: the parse error it
// counts and the calls it still matches. When a new engine reads a construct, its test fails:
// update the README's parse-fault line and this probe, then let the test pin the new reading.

function cachedEngine(): string | undefined {
  try {
    const p = pinnedEnginePath(ENGINE_PIN, platformKey(), cacheDir());
    return existsSync(p) ? p : undefined;
  } catch {
    return undefined;
  }
}
const engine = process.env.LEXCODE_ENGINE ?? cachedEngine();
const probes = fileURLToPath(new URL('../engine-probes/rust', import.meta.url));

/** The lines where `reqwest::get(...)` matches in one probe, and the file errors the engine counts. */
async function probe(name: string): Promise<{ lines: number[]; fileErrors: number }> {
  const dir = await mkdtemp(join(tmpdir(), 'lexcode-rust-probe-'));
  try {
    await writeFile(
      join(dir, 'rule.yml'),
      ['rules:', '  - id: lexcode.test.reqwest-get', '    languages: [rust]', '    severity: INFO', '    message: a GET', '    pattern: reqwest::get(...)', ''].join('\n'),
    );
    const r = await runEngine({ engine: engine!, configFile: join(dir, 'rule.yml'), targets: [name], root: probes });
    return { lines: r.matches.map((m) => m.line).sort((a, b) => a - b), fileErrors: r.fileErrors };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// Skipped unless the pinned engine is already cached (run `lexcode engine fetch` first).
describe.skipIf(!engine)('Rust constructs the pinned engine cannot read', () => {
  it('an async closure: the engine drops `async`, counts the file, and still matches the closure body and the code around it', async () => {
    expect(await probe('async-closure.rs')).toEqual({ lines: [8, 12, 13], fileErrors: 1 });
  });

  it('an associated-type bound in a generic argument list: the engine drops the bound and reads the rest', async () => {
    expect(await probe('assoc-type-bound.rs')).toEqual({ lines: [13, 17], fileErrors: 1 });
  });

  it('an attribute on a generic parameter: the item that carries it is lost, the items around it are read', async () => {
    expect(await probe('generic-param-attr.rs')).toEqual({ lines: [8, 22], fileErrors: 1 });
  });

  it('an attribute on a generic parameter of an item with a where clause: the whole file is lost', async () => {
    expect(await probe('generic-param-attr-where.rs')).toEqual({ lines: [], fileErrors: 1 });
  });
});
