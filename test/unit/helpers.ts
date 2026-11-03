import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach } from 'vitest';

const made: string[] = [];

afterEach(() => {
  while (made.length) rmSync(made.pop() as string, { recursive: true, force: true });
});

/** Build a temp directory from a map of POSIX relative path to file text. */
export function tree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'lexcode-t4-'));
  made.push(root);
  for (const [rel, text] of Object.entries(files)) {
    const abs = join(root, ...rel.split('/'));
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text);
  }
  return root;
}

/** 1-based line number of the first line containing `needle`. */
export function lineOf(text: string, needle: string): number {
  const i = text.split('\n').findIndex((l) => l.includes(needle));
  if (i < 0) throw new Error(`no line contains ${needle}`);
  return i + 1;
}
