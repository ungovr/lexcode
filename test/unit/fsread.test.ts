import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, truncateSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadSidecar } from '../../src/config/sidecar.js';
import { readActivitiesMd } from '../../src/declaration/activities-md.js';
import { readLexlintYml } from '../../src/declaration/lexlint-yml.js';
import { selectDeclaration } from '../../src/declaration/select.js';
import { ToolError } from '../../src/errors.js';
import { MAX_CONFIG_BYTES, readRegularFile } from '../../src/fsread.js';
import { readAppScope } from '../../src/commands/scan.js';

const made: string[] = [];
function dir(): string {
  const d = mkdtempSync(join(tmpdir(), 'lexcode-fsread-'));
  made.push(d);
  return d;
}
afterEach(() => {
  while (made.length) rmSync(made.pop() as string, { recursive: true, force: true });
});

const MD = '---\ncomponents:\n  - activities:\n      - id: crawls_web\n        mentioned: performs\n---\n';
const YML = 'profile:\n  activities: [crawls_web]\n';
const SIDECAR = 'schema: https://lexlint.io/lexcode/config/v1\n';
const posix = process.platform !== 'win32';

describe('readRegularFile', () => {
  it('reads a regular file', () => {
    const d = dir();
    writeFileSync(join(d, 'a.md'), 'hello');
    expect(readRegularFile(join(d, 'a.md'))).toBe('hello');
    expect(readRegularFile(join(d, 'a.md'), { insideRoot: d })).toBe('hello');
  });

  it('refuses a file over the byte limit, by size, and says so', () => {
    const d = dir();
    writeFileSync(join(d, 'big'), 'x'.repeat(11));
    expect(() => readRegularFile(join(d, 'big'), { maxBytes: 10 })).toThrow(/over the 10 byte limit|11 bytes, over the 10 byte limit/);
    expect(readRegularFile(join(d, 'big'), { maxBytes: 11 })).toHaveLength(11);
  });

  it('refuses a directory', () => {
    const d = dir();
    mkdirSync(join(d, 'sub'));
    expect(() => readRegularFile(join(d, 'sub'))).toThrow(/not a regular file/);
  });

  it('names the file when it is missing', () => {
    const d = dir();
    expect(() => readRegularFile(join(d, 'nope'))).toThrow(/cannot read .*nope: ENOENT/);
  });

  it.skipIf(!posix)('refuses a file whose real path lies outside the root it was found in', () => {
    const d = dir();
    const other = dir();
    writeFileSync(join(d, 'a.md'), 'x');
    expect(() => readRegularFile(join(d, 'a.md'), { insideRoot: other })).toThrow(/outside the repository/);
  });

  it.skipIf(!posix)('refuses a FIFO without blocking', () => {
    const d = dir();
    execFileSync('mkfifo', [join(d, 'pipe')]);
    // No clock: an open that blocked on the pipe would never return to reach this line, so returning is the check.
    expect(() => readRegularFile(join(d, 'pipe'))).toThrow(/not a regular file/);
  });

  it.skipIf(!posix)('refuses a symbolic link, even to a regular file, even for an explicit path', () => {
    const d = dir();
    writeFileSync(join(d, 'real.md'), 'x');
    symlinkSync(join(d, 'real.md'), join(d, 'link.md'));
    expect(() => readRegularFile(join(d, 'link.md'))).toThrow(/symbolic link/);
  });
});

describe('the three declaration and configuration readers', () => {
  it.skipIf(!posix)('refuse a symlinked ACTIVITIES.md, naming it, and never read the target', () => {
    const root = dir();
    const outside = dir();
    writeFileSync(join(outside, 'secret.md'), MD);
    symlinkSync(join(outside, 'secret.md'), join(root, 'ACTIVITIES.md'));
    const err = (() => {
      try {
        selectDeclaration(root);
      } catch (e) {
        return e as Error;
      }
      return undefined;
    })();
    expect(err).toBeInstanceOf(ToolError);
    expect(err?.message).toContain(join(root, 'ACTIVITIES.md'));
    expect(err?.message).toMatch(/symbolic link/);
    expect(() => readActivitiesMd(join(root, 'ACTIVITIES.md'), root)).toThrow(/symbolic link/);
  });

  it.skipIf(!posix)('refuse a symlinked lexlint.yml, in selectDeclaration and in readAppScope', () => {
    const root = dir();
    const outside = dir();
    writeFileSync(join(outside, 'l.yml'), YML);
    symlinkSync(join(outside, 'l.yml'), join(root, 'lexlint.yml'));
    expect(() => selectDeclaration(root)).toThrow(/lexlint\.yml is a symbolic link/);
    expect(() => readAppScope(root)).toThrow(/symbolic link/);
  });

  it.skipIf(!posix)('refuse a symlinked .lexcode.yml, but a dangling one is refused too, not skipped', () => {
    const root = dir();
    const outside = dir();
    writeFileSync(join(outside, 's.yml'), SIDECAR);
    symlinkSync(join(outside, 's.yml'), join(root, '.lexcode.yml'));
    expect(() => loadSidecar(root)).toThrow(/\.lexcode\.yml is a symbolic link/);
    rmSync(join(root, '.lexcode.yml'));
    symlinkSync(join(outside, 'gone.yml'), join(root, '.lexcode.yml'));
    expect(() => loadSidecar(root)).toThrow(/symbolic link/);
  });

  it.skipIf(!posix)('refuse a FIFO named ACTIVITIES.md, lexlint.yml or .lexcode.yml without hanging', () => {
    for (const name of ['ACTIVITIES.md', 'lexlint.yml', '.lexcode.yml']) {
      const root = dir();
      execFileSync('mkfifo', [join(root, name)]);
      const run = (): unknown => (name === '.lexcode.yml' ? loadSidecar(root) : selectDeclaration(root));
      // No clock: an open that blocked on the pipe would never return to reach the next name, so returning is the check.
      expect(run, name).toThrow(/not a regular file/);
    }
  });

  it('refuse a file over 20 MB', () => {
    const root = dir();
    for (const name of ['ACTIVITIES.md', 'lexlint.yml', '.lexcode.yml']) {
      writeFileSync(join(root, name), '');
      truncateSync(join(root, name), MAX_CONFIG_BYTES + 1);
    }
    expect(() => readActivitiesMd(join(root, 'ACTIVITIES.md'), root)).toThrow(/byte limit/);
    expect(() => readLexlintYml(join(root, 'lexlint.yml'), root)).toThrow(/byte limit/);
    expect(() => loadSidecar(root)).toThrow(/byte limit/);
  });

  it('still read ordinary files, in the repository and by an explicit path outside it', () => {
    const root = dir();
    const elsewhere = dir();
    writeFileSync(join(root, 'ACTIVITIES.md'), MD);
    writeFileSync(join(elsewhere, 'decl.yml'), YML);
    writeFileSync(join(elsewhere, 'side.yml'), SIDECAR);
    expect(selectDeclaration(root).declaration?.declared.get('crawls_web')).toBe('performs');
    expect(selectDeclaration(root, join(elsewhere, 'decl.yml')).declaration?.source).toBe('lexlint.yml');
    expect(loadSidecar(root, join(elsewhere, 'side.yml'))).toBeDefined();
  });

  it.skipIf(!posix)('refuse an explicit --declaration or --config that is a symbolic link', () => {
    const root = dir();
    const elsewhere = dir();
    writeFileSync(join(elsewhere, 'decl.yml'), YML);
    symlinkSync(join(elsewhere, 'decl.yml'), join(elsewhere, 'l.yml'));
    writeFileSync(join(elsewhere, 'side.yml'), SIDECAR);
    symlinkSync(join(elsewhere, 'side.yml'), join(elsewhere, 's.yml'));
    expect(() => selectDeclaration(root, join(elsewhere, 'l.yml'))).toThrow(/symbolic link/);
    expect(() => loadSidecar(root, join(elsewhere, 's.yml'))).toThrow(/symbolic link/);
  });
});
