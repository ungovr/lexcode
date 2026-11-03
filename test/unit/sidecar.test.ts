import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadSidecar } from '../../src/config/sidecar.js';
import { ToolError } from '../../src/errors.js';

const SCHEMA = 'schema: https://lexlint.io/lexcode/config/v1';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'lexcode-sidecar-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function write(body: string, name = '.lexcode.yml'): void {
  writeFileSync(join(dir, name), body);
}

function msgOf(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ToolError);
    return (e as Error).message;
  }
  throw new Error('expected a ToolError');
}

describe('loadSidecar', () => {
  it('an absent file returns undefined', () => {
    expect(loadSidecar(dir)).toBeUndefined();
  });

  it('a file with only the schema line gets the defaults', () => {
    write(`${SCHEMA}\n`);
    expect(loadSidecar(dir)).toEqual({ ignore: [], fail_on_enables: false, own_hosts: [], include: [], exclude: [] });
  });

  it('reads every known key', () => {
    write(
      [
        SCHEMA,
        'ignore:',
        '  - rule: lexcode.voice.browser-mediarecorder',
        '    where: ungovr-mobile/src/voice/stt.ts',
        '    reason: Microphone capture is for a personal note.',
        '    by: sean@ungovr.org',
        '    on: 2026-11-01',
        '  - rule: lexcode.crawl.fetch',
        '    where: scripts/',
        '    reason: A build helper.',
        'fail_on_enables: true',
        'own_hosts: [api.example.org]',
        'include: [src/]',
        'exclude: [vendor/]',
        '',
      ].join('\n'),
    );
    const s = loadSidecar(dir);
    expect(s?.fail_on_enables).toBe(true);
    expect(s?.own_hosts).toEqual(['api.example.org']);
    expect(s?.include).toEqual(['src/']);
    expect(s?.exclude).toEqual(['vendor/']);
    expect(s?.ignore).toHaveLength(2);
    expect(s?.ignore[0]).toMatchObject({ rule: 'lexcode.voice.browser-mediarecorder', by: 'sean@ungovr.org', on: '2026-11-01' });
    expect(s?.ignore[1]?.where).toBe('scripts/');
  });

  it('an ignore without reason is a ToolError containing reason', () => {
    write(`${SCHEMA}\nignore:\n  - rule: lexcode.x.y\n`);
    expect(msgOf(() => loadSidecar(dir))).toContain('reason');
  });

  it('an ignore with an empty reason is a ToolError', () => {
    write(`${SCHEMA}\nignore:\n  - rule: lexcode.x.y\n    reason: "   "\n`);
    expect(msgOf(() => loadSidecar(dir))).toContain('reason');
  });

  it('an ignore without rule is a ToolError containing rule', () => {
    write(`${SCHEMA}\nignore:\n  - reason: because\n`);
    expect(msgOf(() => loadSidecar(dir))).toContain('rule');
  });

  it('an unknown top-level key is a ToolError naming the key', () => {
    write(`${SCHEMA}\nfail_on_enable: true\n`);
    expect(msgOf(() => loadSidecar(dir))).toContain('fail_on_enable');
  });

  it('an unknown key inside an ignore is a ToolError', () => {
    write(`${SCHEMA}\nignore:\n  - rule: a\n    reason: b\n    why: c\n`);
    expect(msgOf(() => loadSidecar(dir))).toContain('why');
  });

  it('a wrong schema value is a ToolError', () => {
    write('schema: https://example.org/other\n');
    expect(msgOf(() => loadSidecar(dir))).toContain('https://lexlint.io/lexcode/config/v1');
  });

  it('a missing schema is a ToolError', () => {
    write('fail_on_enables: true\n');
    expect(msgOf(() => loadSidecar(dir))).toContain('schema');
  });

  it('where must not be absolute or use backslashes', () => {
    write(`${SCHEMA}\nignore:\n  - rule: a\n    where: /etc/passwd\n    reason: b\n`);
    expect(msgOf(() => loadSidecar(dir))).toContain('where');
    write(`${SCHEMA}\nignore:\n  - rule: a\n    where: src\\x.ts\n    reason: b\n`);
    expect(msgOf(() => loadSidecar(dir))).toContain('where');
  });

  it('wrong types are ToolErrors', () => {
    write(`${SCHEMA}\nfail_on_enables: "yes"\n`);
    expect(msgOf(() => loadSidecar(dir))).toContain('fail_on_enables');
    write(`${SCHEMA}\nown_hosts: example.org\n`);
    expect(msgOf(() => loadSidecar(dir))).toContain('own_hosts');
    write(`${SCHEMA}\nignore: nope\n`);
    expect(msgOf(() => loadSidecar(dir))).toContain('ignore');
  });

  it('a YAML syntax error names the file and a line', () => {
    write(`${SCHEMA}\nignore: [a, b\nown_hosts: : :\n`);
    const m = msgOf(() => loadSidecar(dir));
    expect(m).toContain('.lexcode.yml');
    expect(m).toMatch(/line \d+/);
  });

  it('an explicit path is read, and a missing explicit path is a ToolError', () => {
    write(`${SCHEMA}\nfail_on_enables: true\n`, 'ci.yml');
    expect(loadSidecar(dir, 'ci.yml')?.fail_on_enables).toBe(true);
    expect(() => loadSidecar(dir, 'missing.yml')).toThrow(ToolError);
  });
});
