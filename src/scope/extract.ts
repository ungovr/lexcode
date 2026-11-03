import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ToolError } from '../errors.js';

// Opengrep has no Vue or Svelte parser (design section 6.10), so a JS or TS
// rule never reads those files, nor the scripts inside an HTML or Jinja page.
// lexcode copies each qualifying <script> body into a temporary file in which
// every other character is a space (line breaks kept), so a finding's line
// number is the line in the original file, and scans that.

const EXTRACT_EXTENSIONS = new Set(['.vue', '.svelte', '.html', '.htm', '.jinja', '.jinja2', '.j2', '.njk']);

/** `type` values of a script that holds code; an absent or empty `type` qualifies as well. */
const CODE_TYPES = new Set([
  'module',
  'text/javascript',
  'application/javascript',
  'text/babel',
  'text/typescript',
]);

interface Attrs {
  [name: string]: string;
}

interface ScriptBlock {
  /** Offset of the first character of the body. */
  start: number;
  /** Offset just past the last character of the body. */
  end: number;
  attrs: Attrs;
}

function isTagEnd(ch: string | undefined): boolean {
  return ch === undefined || ch === '>' || ch === '/' || /\s/.test(ch);
}

/** Parses the attributes of a start tag whose name ends at `from`. Returns the attributes, the offset just past the `>`, and whether the tag self-closes. */
function parseStartTag(text: string, from: number): { attrs: Attrs; next: number; selfClosing: boolean } {
  const attrs: Attrs = {};
  let i = from;
  let selfClosing = false;
  while (i < text.length) {
    const ch = text[i] as string;
    if (ch === '>') {
      i++;
      return { attrs, next: i, selfClosing };
    }
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '/') {
      selfClosing = text[i + 1] === '>';
      i++;
      continue;
    }
    selfClosing = false;
    let nameEnd = i;
    while (nameEnd < text.length && !/[\s=>/]/.test(text[nameEnd] as string)) nameEnd++;
    if (nameEnd === i) {
      i++; // a stray "=" or similar: step over it
      continue;
    }
    const name = text.slice(i, nameEnd).toLowerCase();
    i = nameEnd;
    let j = i;
    while (j < text.length && /\s/.test(text[j] as string)) j++;
    if (text[j] !== '=') {
      if (!(name in attrs)) attrs[name] = '';
      continue;
    }
    j++;
    while (j < text.length && /\s/.test(text[j] as string)) j++;
    const q = text[j];
    let value: string;
    if (q === '"' || q === "'") {
      const close = text.indexOf(q, j + 1);
      const stop = close === -1 ? text.length : close;
      value = text.slice(j + 1, stop);
      i = close === -1 ? text.length : close + 1;
    } else {
      let k = j;
      while (k < text.length && !/[\s>]/.test(text[k] as string)) k++;
      value = text.slice(j, k);
      i = k;
    }
    if (!(name in attrs)) attrs[name] = value;
  }
  return { attrs, next: text.length, selfClosing };
}

function findScriptBlocks(text: string): ScriptBlock[] {
  const lower = text.toLowerCase();
  const blocks: ScriptBlock[] = [];
  let i = 0;
  while (i < text.length) {
    const lt = text.indexOf('<', i);
    if (lt === -1) break;
    if (text.startsWith('<!--', lt)) {
      const close = text.indexOf('-->', lt + 4);
      if (close !== -1) {
        i = close + 3;
        continue;
      }
      // An unterminated comment is not treated as one: a stray "<!--" must not hide the rest of the file.
    }
    if (lower.startsWith('<script', lt) && isTagEnd(text[lt + 7])) {
      const tag = parseStartTag(text, lt + 7);
      if (tag.selfClosing) {
        blocks.push({ start: tag.next, end: tag.next, attrs: tag.attrs });
        i = tag.next;
        continue;
      }
      let close = tag.next;
      let found = -1;
      while (close < text.length) {
        const at = lower.indexOf('</script', close);
        if (at === -1) break;
        if (isTagEnd(text[at + 8])) {
          found = at;
          break;
        }
        close = at + 8;
      }
      const end = found === -1 ? text.length : found;
      blocks.push({ start: tag.next, end, attrs: tag.attrs });
      if (found === -1) break;
      const gt = text.indexOf('>', found);
      i = gt === -1 ? text.length : gt + 1;
      continue;
    }
    i = lt + 1;
  }
  return blocks;
}

function qualifies(block: ScriptBlock, text: string): boolean {
  const type = (block.attrs['type'] ?? '').trim().toLowerCase();
  if (type !== '' && !CODE_TYPES.has(type)) return false;
  // Nothing to scan: an external script (src with no body) or a block with only white space.
  if (text.slice(block.start, block.end).trim() === '') return false;
  return true;
}

function isTypeScript(block: ScriptBlock): boolean {
  const lang = (block.attrs['lang'] ?? '').trim().toLowerCase();
  const type = (block.attrs['type'] ?? '').trim().toLowerCase();
  return lang === 'ts' || lang === 'typescript' || type === 'text/typescript';
}

function blank(s: string): string {
  return s.replace(/[^\r\n]/gu, ' ');
}

/**
 * Keeps the body of each qualifying `<script>` element and replaces every
 * other character except line breaks with a space, so line and column numbers
 * hold. Returns null when no block qualifies.
 */
export function blankOutsideScripts(text: string): { text: string; lang: 'ts' | 'js' } | null {
  const blocks = findScriptBlocks(text).filter((b) => qualifies(b, text));
  if (blocks.length === 0) return null;
  let out = '';
  let cursor = 0;
  for (const b of blocks) {
    out += blank(text.slice(cursor, b.start));
    out += text.slice(b.start, b.end);
    cursor = b.end;
  }
  out += blank(text.slice(cursor));
  return { text: out, lang: blocks.some(isTypeScript) ? 'ts' : 'js' };
}

/**
 * Writes `<tmpDir>/<originalPath>.lexcode.<ts|js>` for each file with an
 * extractable extension that holds at least one script block. `files` are
 * POSIX paths relative to `root`.
 */
export function extractScripts(
  root: string,
  files: string[],
  tmpDir: string,
): { tempPath: string; originalPath: string }[] {
  const pairs: { tempPath: string; originalPath: string }[] = [];
  const tmpRoot = path.resolve(tmpDir);
  for (const originalPath of files) {
    if (!EXTRACT_EXTENSIONS.has(path.posix.extname(originalPath).toLowerCase())) continue;
    const segments = originalPath.split('/');
    if (segments.includes('..') || path.isAbsolute(originalPath)) {
      throw new ToolError(`refusing to extract "${originalPath}": it is outside the repository.`);
    }
    let text: string;
    try {
      text = readFileSync(path.join(root, ...segments), 'utf8');
    } catch {
      continue; // gone since it was listed
    }
    const blanked = blankOutsideScripts(text);
    if (blanked === null) continue;
    const tempPath = path.join(tmpRoot, ...segments) + `.lexcode.${blanked.lang}`;
    if (!tempPath.startsWith(tmpRoot + path.sep)) {
      throw new ToolError(`refusing to extract "${originalPath}": it is outside the repository.`);
    }
    mkdirSync(path.dirname(tempPath), { recursive: true });
    writeFileSync(tempPath, blanked.text);
    pairs.push({ tempPath, originalPath });
  }
  return pairs;
}
