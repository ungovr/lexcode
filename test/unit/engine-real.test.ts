import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cacheDir } from '../../src/engine/cache.js';
import { pinnedEnginePath } from '../../src/engine/fetch.js';
import { ENGINE_PIN } from '../../src/engine/pin.js';
import { platformKey } from '../../src/engine/platform.js';
import { runEngine } from '../../src/engine/run.js';

function cachedEngine(): string | undefined {
  try {
    const p = pinnedEnginePath(ENGINE_PIN, platformKey(), cacheDir());
    return existsSync(p) ? p : undefined;
  } catch {
    return undefined;
  }
}
const engine = process.env.LEXCODE_ENGINE ?? cachedEngine();

// Skipped unless the pinned engine is already cached (run `lexcode engine fetch` first).
describe.skipIf(!engine)('the real pinned engine', () => {
  it('finds a one-line Python call with a one-rule config and reports a bare rule id', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'lexcode-real-'));
    try {
      await writeFile(join(dir, 'app.py'), 'import requests\nrequests.get("https://example.com")\n');
      await writeFile(
        join(dir, 'rule.yml'),
        [
          'rules:',
          '  - id: lexcode.test.requests-get',
          '    languages: [python]',
          '    severity: INFO',
          '    message: an HTTP GET',
          '    pattern: requests.get($URL)',
          '',
        ].join('\n'),
      );
      const r = await runEngine({ engine: engine!, configFile: join(dir, 'rule.yml'), targets: ['app.py'], cwd: dir });
      expect(r.matches).toHaveLength(1);
      expect(r.matches[0]).toMatchObject({ ruleId: 'lexcode.test.requests-get', path: 'app.py', line: 2 });
      expect(r.matches[0]?.metavars.$URL).toBe('"https://example.com"');
      expect(r.fileErrors).toBe(0);
      expect(r.version).toMatch(/^\d+\.\d+\.\d+/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
