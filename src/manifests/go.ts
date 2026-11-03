import type { Dependency } from '../types.js';
import { baseName, readText, type ReaderResult } from './util.js';

function unquote(s: string): string {
  return s.length >= 2 && (s.startsWith('"') || s.startsWith('`')) && s.endsWith(s[0] as string) ? s.slice(1, -1) : s;
}

/** Parse one `go.mod`. Throws on a require block that never closes or a require line with no version. */
function parseGoMod(rel: string, text: string): Dependency[] {
  const out: Dependency[] = [];
  let inBlock = false;
  const lines = text.split('\n');

  const take = (spec: string, lineNo: number, indirect: boolean): void => {
    const tokens = spec.trim().split(/\s+/);
    if (tokens.length < 2 || !tokens[0] || !tokens[1]) throw new Error(`line ${lineNo}: a require line needs a module and a version`);
    if (indirect) return;
    out.push({ ecosystem: 'golang', name: unquote(tokens[0]), version: tokens[1], manifest: `${rel}:${lineNo}` });
  };

  lines.forEach((raw, i) => {
    const lineNo = i + 1;
    const cut = raw.indexOf('//');
    const code = (cut < 0 ? raw : raw.slice(0, cut)).trim();
    const indirect = cut >= 0 && /^\/\/\s*indirect\b/.test(raw.slice(cut));
    if (inBlock) {
      if (code === ')') inBlock = false;
      else if (code !== '') take(code, lineNo, indirect);
      return;
    }
    if (/^require\s*\(\s*$/.test(code)) {
      inBlock = true;
      return;
    }
    const single = /^require\s+(\S.*)$/.exec(code);
    if (single) take(single[1] as string, lineNo, indirect);
  });
  if (inBlock) throw new Error('a require block is not closed');
  return out;
}

/** Read the direct requirements of every `go.mod` in the file list; the version is the one go.mod pins. */
export function readGo(root: string, files: string[]): ReaderResult {
  const deps: Dependency[] = [];
  const notices: string[] = [];
  for (const rel of files) {
    if (baseName(rel) !== 'go.mod') continue;
    const text = readText(root, rel);
    if (text === undefined) {
      notices.push(`${rel}: could not be read; skipped`);
      continue;
    }
    try {
      deps.push(...parseGoMod(rel, text));
    } catch (e) {
      notices.push(`${rel}: did not parse (${e instanceof Error ? e.message : String(e)}); skipped`);
    }
  }
  return { deps, devSkipped: 0, notices };
}
