import { mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync, mkdirSync, lstatSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { writeOutput } from '../../src/commands/fsutil.js';
import { ToolError } from '../../src/errors.js';

const made: string[] = [];

function dir(): string {
  const d = mkdtempSync(join(tmpdir(), 'lexcode-fsutil-'));
  made.push(d);
  return d;
}

afterEach(() => {
  while (made.length) rmSync(made.pop() as string, { recursive: true, force: true });
});

describe('writeOutput', () => {
  it('writes a new file and leaves no temporary file behind', async () => {
    const d = dir();
    await writeOutput(join(d, 'out', 'lexcode.json'), '{"a":1}\n');
    expect(readFileSync(join(d, 'out', 'lexcode.json'), 'utf8')).toBe('{"a":1}\n');
    expect(readdirSync(join(d, 'out'))).toEqual(['lexcode.json']);
  });

  it('replaces an existing regular file', async () => {
    const d = dir();
    writeFileSync(join(d, 'lexcode.json'), 'old');
    await writeOutput(join(d, 'lexcode.json'), 'new');
    expect(readFileSync(join(d, 'lexcode.json'), 'utf8')).toBe('new');
  });

  it('refuses a destination that is a symbolic link and leaves its target untouched', async () => {
    const d = dir();
    const victim = join(d, 'victim.txt');
    writeFileSync(victim, 'keep me');
    symlinkSync(victim, join(d, 'lexcode.json'));
    await expect(writeOutput(join(d, 'lexcode.json'), 'overwritten')).rejects.toThrow(ToolError);
    await expect(writeOutput(join(d, 'lexcode.json'), 'overwritten')).rejects.toThrow(/symbolic link/);
    expect(readFileSync(victim, 'utf8')).toBe('keep me');
    expect(lstatSync(join(d, 'lexcode.json')).isSymbolicLink()).toBe(true);
  });

  it('refuses a dangling symbolic link too', async () => {
    const d = dir();
    symlinkSync(join(d, 'not-there'), join(d, 'lexcode.json'));
    await expect(writeOutput(join(d, 'lexcode.json'), 'x')).rejects.toThrow(/symbolic link/);
    expect(readdirSync(d)).toEqual(['lexcode.json']);
  });

  it('refuses a destination that is a directory', async () => {
    const d = dir();
    mkdirSync(join(d, 'lexcode.json'));
    await expect(writeOutput(join(d, 'lexcode.json'), 'x')).rejects.toThrow(/not a regular file/);
  });
});
