import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ToolError } from '../errors.js';

// Opengrep has no Vue or Svelte parser (design section 6.10), so a JS or TS
// rule never reads those files, nor the scripts inside an HTML or Jinja page,
// an ERB view (`.erb`, whose ERB tags are blanked first), a JSP, a PHP view
// (`.php`, `.phtml`), a Blade view (`.blade.php`), a Twig template (`.twig`) or a Razor view or component
// (`.cshtml`, `.razor`; the C# of their `@code` blocks is copied too, see `razorCSharp`).
// lexcode copies each qualifying <script> body into a temporary file in which
// every other character is a space (line breaks kept), so a finding's line
// number is the line in the original file, and scans that.
// Ruby and PHP files the engine will not take by name are copied whole instead:
// see RUBY_BASENAMES, RUBY_COPY_EXTENSIONS and PHP_COPY_EXTENSIONS below.

const JSP_EXTENSIONS = new Set(['.jsp', '.jspf', '.tag']);
// A `.blade.php` view is told from a `.php` one by its full name, before its extension is looked at.
const PHP_VIEW_EXTENSIONS = new Set(['.php', '.phtml']);
const BLADE_SUFFIX = '.blade.php';
// Razor views and components: their script blocks are read as JavaScript, and their `@code` and `@functions`
// blocks as C# through a `.lexcode.cs` copy (the engine reads only `.cs` as C#).
const RAZOR_EXTENSIONS = new Set(['.cshtml', '.razor']);
const EXTRACT_EXTENSIONS = new Set([
  '.vue',
  '.svelte',
  '.html',
  '.htm',
  '.jinja',
  '.jinja2',
  '.j2',
  '.njk',
  '.erb',
  ...JSP_EXTENSIONS,
  ...PHP_VIEW_EXTENSIONS,
  '.twig',
  ...RAZOR_EXTENSIONS,
]);

// The engine takes only `.rb` as Ruby: given as explicit targets, an extension-less `Fastfile` and a `.rake`,
// `.ru` or `.gemspec` file each read 0 files (opengrep 1.33.1, measured 2026-11-10). So these Ruby files are
// copied whole to `<path>.lexcode.rb`, and a finding in the copy is reported against the original.
const RUBY_BASENAMES = new Set(['Rakefile', 'Fastfile', 'Appfile', 'Capfile']);
const RUBY_COPY_EXTENSIONS = new Set(['.rake', '.ru', '.gemspec']);

// The engine reads `.php`, `.phtml` and `.tpl` as PHP; given as explicit targets, an `.inc`, `.module`, `.theme`
// or `.install` file reads 0 files (opengrep 1.33.1, measured 2026-11-12). So these are copied whole to
// `<path>.lexcode.php`, as the Ruby files above are, but only when the text begins with `<?php` after an optional
// BOM and whitespace: `.inc` is a C, Pascal and assembler extension as well.
const PHP_COPY_EXTENSIONS = new Set(['.inc', '.module', '.theme', '.install']);
const PHP_OPENING = /^\uFEFF?\s*<\?php(?:\s|$)/i;

/**
 * Extensions a language rule reads only through a whole-file copy: the engine takes 0 files of the original.
 * Such an original is never counted as code a rule read (rules that ran, the large-file pre-filter notice);
 * its copy is, when one was made. A C or Pascal `.inc` gets no copy, so no PHP rule counts as having read it.
 */
export const COPIED_WHOLE_EXTENSIONS: ReadonlySet<string> = new Set([...RUBY_COPY_EXTENSIONS, ...PHP_COPY_EXTENSIONS]);

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

/**
 * `text` with only A-Z lowercased, one UTF-16 unit for one, so its offsets are `text`'s. `toLowerCase()` will
 * not do: a character whose lowercase is longer (Turkish "İ", U+0130, becomes two units) moves every later
 * offset, and a block after it was dropped. HTML matches tag names in ASCII only, so this is also the match
 * HTML makes.
 */
function asciiLower(text: string): string {
  return text.replace(/[A-Z]+/g, (m) => m.toLowerCase());
}

function findScriptBlocks(text: string): ScriptBlock[] {
  const lower = asciiLower(text);
  const blocks: ScriptBlock[] = [];
  let i = 0;
  // Once a search for "-->" fails, no later one can succeed: without this, a file of nothing but "<!--" searched
  // to its end at every opener, and 200 KB of them took 18 seconds.
  let noMoreCommentEnds = false;
  while (i < text.length) {
    const lt = text.indexOf('<', i);
    if (lt === -1) break;
    if (!noMoreCommentEnds && text.startsWith('<!--', lt)) {
      const close = text.indexOf('-->', lt + 4);
      if (close !== -1) {
        i = close + 3;
        continue;
      }
      noMoreCommentEnds = true;
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
  return s.replace(/[^\r\n]/g, ' ');
}

/**
 * Blanks the ERB tags of a script body so the JavaScript parser can read it: an output tag (`<%=`, `<%==`)
 * becomes `_` padded with spaces to its length, every other tag (`<%`, `<%-`, `<%#`) becomes spaces, and line
 * breaks stay, so line and column numbers hold. `<%%` is a literal and is left. A tag ends at the first `%>`,
 * as ERB itself ends it, quotes or not; one that never ends is blanked to the end of the body.
 */
export function blankErbTags(body: string): string {
  let out = '';
  let cursor = 0;
  let i = 0;
  while (i < body.length) {
    const open = body.indexOf('<%', i);
    if (open === -1) break;
    if (body[open + 2] === '%') {
      i = open + 3;
      continue;
    }
    const close = body.indexOf('%>', open + 2);
    const end = close === -1 ? body.length : close + 2;
    const tag = blank(body.slice(open, end));
    const output = body[open + 2] === '=';
    out += body.slice(cursor, open) + (output && tag.length > 0 ? '_' + tag.slice(1) : tag);
    cursor = end;
    i = end;
  }
  return out + body.slice(cursor);
}

/** Offset just past the `}` that closes the EL expression whose `{` is at `open`; `text.length` when it never closes. Quoted strings and nested braces are stepped over. */
function elEnd(text: string, open: number): number {
  let depth = 0;
  let i = open;
  while (i < text.length) {
    const ch = text[i] as string;
    if (ch === '"' || ch === "'") {
      i++;
      while (i < text.length && text[i] !== ch) i += text[i] === '\\' ? 2 : 1;
      i++; // past the closing quote
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i + 1;
    }
    i++;
  }
  return text.length;
}

/** The longest namespaced tag lexcode will blank; a `<` that has no `>` within this is just a less-than sign. */
const MAX_TAG_CHARS = 4000;

/**
 * Offset just past the `>` that closes the namespaced tag (`<h:outputText ...>`, `</f:view>`, `<c:out ... />`) whose
 * name starts at `from`, stepping over quoted attribute values (a `>` or a `<script>` inside quotes is part of the
 * value; an escaped quote is not a quote). -1 when it does not close within MAX_TAG_CHARS.
 */
function tagEnd(text: string, from: number): number {
  const limit = Math.min(text.length, from + MAX_TAG_CHARS);
  let i = from;
  while (i < limit) {
    const ch = text[i] as string;
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      i++;
      while (i < limit && text[i] !== ch) i += text[i] === '\\' ? 2 : 1;
      i++;
      continue;
    }
    if (ch === '>') return i + 1;
    i++;
  }
  return -1;
}

/**
 * Blanks the JSP syntax of a script body so the JavaScript parser can read it: an output tag (`<%=`), an
 * EL expression (`${...}`, `#{...}`) and a namespaced tag (`<h:outputText .../>`, `</f:view>`, `<c:out>`,
 * `<jsp:expression>`: `<` or `</`, a word, a colon, a name that ends at whitespace, `/` or `>`) become `_` padded with spaces to their length, so
 * they stay a valid JavaScript expression in a string and out of one; every other tag (`<%`, `<%!`, `<%@`)
 * and the `<![CDATA[` and `]]>` markers of a CDATA section become spaces. Line breaks stay, so line and column
 * numbers hold. A `<%--` comment runs to `--%>`, any other tag to the first `%>`, an EL expression to its
 * closing brace, past nested braces and quoted strings, and a namespaced tag to its `>`, past quoted values.
 * A `\${` or `\#{` is a literal and is left. A JSP tag that never ends is blanked to the end of the body; a
 * namespaced tag that never ends is not a tag and is left, as is `a < b:c` (a tag name follows the `<`
 * directly), an unspaced ternary `c?a<b:d;` (the name must end at whitespace, `/` or `>`) and an HTML tag
 * without a prefix. A `]]>` is blanked only after a `<![CDATA[` opened in the body,
 * so `a[b[0]]>c` is left.
 */
export function blankJspTags(body: string): string {
  const opener = /<%|[$#]\{|<\/?\w+:[A-Za-z_][\w.-]*(?=[\s/>])|<!\[CDATA\[|\]\]>/g;
  let out = '';
  let cursor = 0;
  let inCdata = false;
  for (let m = opener.exec(body); m !== null; m = opener.exec(body)) {
    const open = m.index;
    if (m[0] === ']]>' && !inCdata) continue;
    if ((m[0] === '${' || m[0] === '#{') && body[open - 1] === '\\') continue;
    let end: number;
    let output: boolean;
    if (m[0] === '<%') {
      if (body.startsWith('<%--', open)) {
        const close = body.indexOf('--%>', open + 4);
        end = close === -1 ? body.length : close + 4;
        output = false;
      } else {
        const close = body.indexOf('%>', open + 2);
        end = close === -1 ? body.length : close + 2;
        output = body[open + 2] === '=';
      }
    } else if (m[0] === '${' || m[0] === '#{') {
      end = elEnd(body, open + 1);
      output = true;
    } else if (m[0] === '<![CDATA[') {
      end = open + m[0].length;
      output = false;
      inCdata = true;
    } else if (m[0] === ']]>') {
      end = open + 3;
      output = false;
      inCdata = false;
    } else {
      end = tagEnd(body, open + m[0].length);
      if (end === -1) continue; // no closing `>`: a less-than sign, not a tag
      output = true;
    }
    const tag = blank(body.slice(open, end));
    out += body.slice(cursor, open) + (output && tag.length > 0 ? '_' + tag.slice(1) : tag);
    cursor = end;
    opener.lastIndex = end;
  }
  return out + body.slice(cursor);
}

/**
 * Offset just past the quote that closes the string whose opening quote is at `open`; `limit` (the end of the
 * text by default) when it does not close before that. A backslash escapes the next character.
 */
function quotedEnd(text: string, open: number, limit: number = text.length): number {
  const q = text[open];
  let i = open + 1;
  while (i < limit && text[i] !== q) i += text[i] === '\\' ? 2 : 1;
  return Math.min(i + 1, limit);
}

/** What ends a stretch of plain PHP code: a `?>`, a quote, a comment or attribute opener, or a heredoc or nowdoc opener. */
const PHP_CODE_STOP = /\?>|['"`]|#\[?|\/\/|\/\*|<<</g;
const PHP_LINE_COMMENT_END = /[\r\n]|\?>/g;
const HEREDOC_OPENER = /<<<[ \t]*(["']?)([A-Za-z_\x80-\uFFFF][\w\x80-\uFFFF]*)\1\r?\n/y;

/**
 * Offset just past the `?>` that ends the PHP region whose code starts at `from`; `text.length` when the region
 * runs to the end of the text, as a PHP file with no closing tag does. A `?>` inside a quoted string (single,
 * double or backtick quotes, backslash escapes), a block comment, a heredoc or a nowdoc does not end the region;
 * one in a `//` or `#` line comment does, as it does in PHP. `#[` opens a PHP 8 attribute, which is code.
 */
function phpRegionEnd(text: string, from: number): number {
  let i = from;
  for (;;) {
    PHP_CODE_STOP.lastIndex = i;
    const m = PHP_CODE_STOP.exec(text);
    if (m === null) return text.length;
    const at = m.index;
    const tok = m[0];
    if (tok === '?>') return at + 2;
    if (tok === "'" || tok === '"' || tok === '`') {
      i = quotedEnd(text, at);
    } else if (tok === '#[') {
      i = at + 2;
    } else if (tok === '#' || tok === '//') {
      PHP_LINE_COMMENT_END.lastIndex = at + tok.length;
      const e = PHP_LINE_COMMENT_END.exec(text);
      if (e === null) return text.length;
      if (e[0] === '?>') return e.index + 2;
      i = e.index + 1;
    } else if (tok === '/*') {
      const close = text.indexOf('*/', at + 2);
      if (close === -1) return text.length;
      i = close + 2;
    } else {
      HEREDOC_OPENER.lastIndex = at;
      const h = HEREDOC_OPENER.exec(text);
      if (h === null) {
        i = at + 3;
        continue;
      }
      // PHP 7.3 and later let the closing identifier be indented; it must not run on into a longer name.
      const closer = new RegExp(`^[ \\t]*${h[2] as string}(?![\\w\\x80-\\uFFFF])`, 'gm');
      closer.lastIndex = HEREDOC_OPENER.lastIndex;
      const c = closer.exec(text);
      if (c === null) return text.length;
      i = c.index + c[0].length;
    }
  }
}

interface PhpRegion {
  start: number;
  end: number;
  /** An output tag: `<?=`, or a `<?php` or `<?` tag whose code begins with `echo` or `print`. */
  output: boolean;
}

/**
 * After `<?`: the code of a `<?php` or `<?` tag that begins with `echo` or `print` (PHP keywords, any case). Such a
 * tag is the long form of `<?=`: it puts a value in the same place (#12987).
 */
const PHP_PRINTS = /(?:php(?=\s))?\s*(?:echo|print)(?![\w\x80-\uFFFF])/iy;

/** Each PHP region of `text`, in order: from `<?php`, `<?=` or `<?` to just past its `?>`, or to the end of the text. */
function phpRegions(text: string): PhpRegion[] {
  const regions: PhpRegion[] = [];
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf('<?', i);
    if (open === -1) break;
    const end = phpRegionEnd(text, open + 2);
    PHP_PRINTS.lastIndex = open + 2;
    regions.push({ start: open, end, output: text[open + 2] === '=' || PHP_PRINTS.test(text) });
    i = end;
  }
  return regions;
}

/** Blanks every PHP region of `text`; with `outputAsName`, a `<?=` region becomes `_` padded instead of spaces. */
function blankRegions(text: string, outputAsName: boolean): string {
  if (!text.includes('<?')) return text;
  let out = '';
  let cursor = 0;
  for (const r of phpRegions(text)) {
    const tag = blank(text.slice(r.start, r.end));
    out += text.slice(cursor, r.start) + (outputAsName && r.output && tag.length > 0 ? '_' + tag.slice(1) : tag);
    cursor = r.end;
  }
  return out + text.slice(cursor);
}

/**
 * Blanks every PHP region of a PHP view (from `<?php`, `<?=` or `<?` to `?>`, or to the end of the file) to
 * spaces, keeping lengths and line breaks, so only the inline HTML is left: a `<script>` that the PHP code writes
 * in a string is then not a script block. See `phpRegionEnd` for what ends a region.
 */
export function blankPhpRegions(text: string): string {
  return blankRegions(text, false);
}

/**
 * Blanks the PHP tags of a script body so the JavaScript parser can read it: an output tag (`<?= ... ?>`, or a
 * `<?php` or `<?` tag whose code begins with `echo` or `print`) becomes `_` padded with spaces to its length,
 * every other PHP tag becomes spaces, and line breaks stay, so line and column numbers hold. A tag ends where `blankPhpRegions` ends a region; one that never ends runs to the end of the body.
 */
export function blankPhpTags(body: string): string {
  return blankRegions(body, true);
}

/**
 * The longest Blade argument list lexcode will look for a closing `)` in. Without a bound, a body of unclosed
 * `@x(` openers would be searched to its end once per opener (quadratic); a real argument list, even an
 * `@json` of a literal array, is far shorter.
 */
const MAX_ARGUMENT_CHARS = 10_000;

/**
 * Offset just past the `)` that closes the argument list whose `(` is at `open`, past nested parentheses and
 * quoted strings (single and double quotes, backslash escapes); -1 when it does not close within
 * MAX_ARGUMENT_CHARS.
 */
function argumentsEnd(text: string, open: number): number {
  const limit = Math.min(text.length, open + MAX_ARGUMENT_CHARS);
  let depth = 0;
  let i = open;
  while (i < limit) {
    const ch = text[i] as string;
    if (ch === '"' || ch === "'") {
      i = quotedEnd(text, i, limit);
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i + 1;
    }
    i++;
  }
  return -1;
}

/** A Blade comment, raw echo, escaped echo or echo, or a directive: an `@` and a name, not after a letter, digit, `_` or `@`. */
const BLADE_OPENER = /\{\{--|\{!!|@?\{\{|(?<![\p{L}\p{N}_@])@[A-Za-z_]\w*/gu;

/**
 * Blanks the Blade syntax of a script body (after `blankPhpTags`) so the JavaScript parser can read it:
 * `{{ ... }}`, `{!! ... !!}`, `@json(...)` and `@js(...)` become `_` padded with spaces to their length, and a
 * `{{-- ... --}}` comment, an `@php ... @endphp` span and every other directive, with its argument list when one
 * follows (after optional spaces or tabs), become spaces. A directive is an `@` and a name not preceded by a
 * letter, digit, `_` or `@`, so the `@` of an email address in a JavaScript string is left. An argument list
 * runs to its closing `)`, past nested parentheses and quoted strings; one with no closing `)` is not an argument
 * list, as Blade's argument group is optional, so only the directive's name is blanked.
 * An echo ends at the first `}}` (`!!}`, `--}}`), as Blade ends it. `@{{ ... }}` is Blade's escaped echo,
 * printed as `{{ ... }}`: its `@` becomes a space and the rest is left. Line breaks stay. An echo, comment or
 * `@php` span that never ends is blanked to the end of the body.
 */
export function blankBladeTags(body: string): string {
  let out = '';
  let cursor = 0;
  BLADE_OPENER.lastIndex = 0;
  for (let m = BLADE_OPENER.exec(body); m !== null; m = BLADE_OPENER.exec(body)) {
    const open = m.index;
    const tok = m[0];
    let end: number;
    let output = false;
    if (tok === '@{{') {
      const close = body.indexOf('}}', open + 3);
      end = close === -1 ? body.length : close + 2;
      out += body.slice(cursor, open) + ' ' + body.slice(open + 1, end);
      cursor = end;
      BLADE_OPENER.lastIndex = end;
      continue;
    }
    if (tok === '{{--') {
      const close = body.indexOf('--}}', open + 4);
      end = close === -1 ? body.length : close + 4;
    } else if (tok === '{!!') {
      const close = body.indexOf('!!}', open + 3);
      end = close === -1 ? body.length : close + 3;
      output = true;
    } else if (tok === '{{') {
      const close = body.indexOf('}}', open + 2);
      end = close === -1 ? body.length : close + 2;
      output = true;
    } else {
      const name = tok.slice(1).toLowerCase();
      end = open + tok.length;
      let paren = end;
      while (body[paren] === ' ' || body[paren] === '\t') paren++;
      const close = body[paren] === '(' ? argumentsEnd(body, paren) : -1;
      if (close !== -1) {
        end = close;
        output = name === 'json' || name === 'js';
      } else if (name === 'php') {
        const close = body.indexOf('@endphp', end);
        end = close === -1 ? body.length : close + '@endphp'.length;
      }
    }
    const tag = blank(body.slice(open, end));
    out += body.slice(cursor, open) + (output && tag.length > 0 ? '_' + tag.slice(1) : tag);
    cursor = end;
    BLADE_OPENER.lastIndex = end;
  }
  return out + body.slice(cursor);
}

/**
 * Offset just past the `closer` (`}}` or `%}`) that ends the Twig tag whose contents start at `from`, past
 * quoted strings (single and double quotes, backslash escapes) and nested brackets, as Twig's lexer reads an
 * expression: `{{ {'a': {'b': 1}} }}` ends at its last `}}`. `text.length` when it never ends.
 */
function twigTagEnd(text: string, from: number, closer: string): number {
  let depth = 0;
  let i = from;
  while (i < text.length) {
    const ch = text[i] as string;
    if (depth === 0 && text.startsWith(closer, i)) return i + closer.length;
    if (ch === '"' || ch === "'") {
      i = quotedEnd(text, i);
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if ((ch === ')' || ch === ']' || ch === '}') && depth > 0) depth--;
    i++;
  }
  return text.length;
}

/**
 * Blanks the Twig syntax of a script body so the JavaScript parser can read it: `{{ ... }}` becomes `_` padded
 * with spaces to its length, and `{% ... %}` and `{# ... #}` become spaces, the `-` and `~` whitespace-control
 * forms included. Line breaks stay. A comment ends at the first `#}`; an output or statement tag ends at its
 * closer past quoted strings and nested brackets (`twigTagEnd`). Anything that never ends is blanked to the end
 * of the body. It is applied to `.twig` files only: Jinja files keep their tags.
 */
export function blankTwigTags(body: string): string {
  const opener = /\{[{%#]/g;
  let out = '';
  let cursor = 0;
  for (let m = opener.exec(body); m !== null; m = opener.exec(body)) {
    const open = m.index;
    let end: number;
    if (m[0] === '{#') {
      const close = body.indexOf('#}', open + 2);
      end = close === -1 ? body.length : close + 2;
    } else {
      end = twigTagEnd(body, open + 2, m[0] === '{{' ? '}}' : '%}');
    }
    const tag = blank(body.slice(open, end));
    out += body.slice(cursor, open) + (m[0] === '{{' && tag.length > 0 ? '_' + tag.slice(1) : tag);
    cursor = end;
    opener.lastIndex = end;
  }
  return out + body.slice(cursor);
}

// ---- Razor (`.cshtml`, `.razor`) ------------------------------------------------------------

const BRACKET_CLOSE: Record<string, string> = { '(': ')', '[': ']', '{': '}' };

/** C# code: brackets of the opening kind are counted until the one at depth 0 closes. */
interface CodeFrame {
  kind: 'code';
  open: string;
  close: string;
  depth: number;
}

/** A C# string literal: `raw` is the quote count of a raw literal (`"""`), 0 otherwise. */
interface StringFrame {
  kind: 'string';
  verbatim: boolean;
  interpolated: boolean;
  raw: number;
}

/** Offset of the line break that ends the line holding `from`, or `text.length`. */
function lineEnd(text: string, from: number): number {
  let i = from;
  while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i++;
  return i;
}

/**
 * Offset just past the C# char literal whose `'` is at `i`, or -1 when none is there: one character (a surrogate
 * pair counts as one) or a backslash escape of up to ten characters, closed on the same line. An apostrophe that
 * is not one of these is text, so `It's` in markup does not open a literal.
 */
function charLiteralEnd(text: string, i: number): number {
  if (text[i + 1] === '\\') {
    for (let k = i + 3; k < Math.min(text.length, i + 13); k++) {
      if (text[k] === '\n' || text[k] === '\r') return -1;
      if (text[k] === "'") return k + 1;
    }
    return -1;
  }
  const cp = text.codePointAt(i + 1);
  if (cp === undefined || cp === 0x27 || cp === 0x0a || cp === 0x0d) return -1;
  const after = i + 1 + (cp > 0xffff ? 2 : 1);
  return text[after] === "'" ? after + 1 : -1;
}

/**
 * The C# string literal that opens at `i` (`"`, `@"`, `$"`, `$@"`, `@$"`, `$$"""` and the like), as the frame to
 * push and the offset of its first character, or null when none opens there.
 */
function stringOpen(text: string, i: number): { frame: StringFrame; next: number } | null {
  let j = i;
  let dollars = 0;
  let verbatim = false;
  while (text[j] === '$') {
    dollars++;
    j++;
  }
  if (text[j] === '@') {
    verbatim = true;
    j++;
    while (text[j] === '$') {
      dollars++;
      j++;
    }
  }
  if (text[j] !== '"') return null;
  let quotes = 0;
  while (text[j + quotes] === '"') quotes++;
  if (!verbatim && quotes >= 3) return { frame: { kind: 'string', verbatim: false, interpolated: dollars > 0, raw: quotes }, next: j + quotes };
  return { frame: { kind: 'string', verbatim, interpolated: dollars > 0, raw: 0 }, next: j + 1 };
}

/**
 * Offset of the `</text>` that closes a `<text>` element whose content starts at `from`, counting the `<text>`
 * elements nested in it (a control block inside the content may hold its own); -1 when it never closes.
 */
function textElementClose(text: string, from: number): number {
  const tag = /<\/?text>/g;
  tag.lastIndex = from;
  let depth = 1;
  for (let m = tag.exec(text); m !== null; m = tag.exec(text)) {
    depth += m[0] === '<text>' ? 1 : -1;
    if (depth === 0) return m.index;
  }
  return -1;
}

/**
 * Offset just past the bracket that closes the `(`, `[` or `{` at `open` in C# code; -1 when it never closes.
 * The scan is string-aware: a bracket inside a string (`"..."` with backslash escapes, ending at the line break
 * if unclosed; verbatim `@"..."` with `""` for a quote; raw `"""..."""`), a char literal, or a line or block comment
 * is not counted, and an interpolated string's holes (`$"{...}"`) are code again, strings and all. It
 * keeps an explicit stack, so nesting costs no call depth. With `razor`, the code is a Razor code or control
 * block: at its own level a `@* ... *@` comment is stepped over, and the content of each `<text> ... </text>`
 * element (to its own closing tag, past nested ones) and `@:` line is stepped over and pushed to `keeps` as
 * `[start, end)`.
 */
function csBracketEnd(text: string, open: number, razor: boolean, keeps?: [number, number][]): number {
  const first = text[open] as string;
  const stack: (CodeFrame | StringFrame)[] = [{ kind: 'code', open: first, close: BRACKET_CLOSE[first] as string, depth: 0 }];
  let i = open;
  while (i < text.length) {
    const top = stack[stack.length - 1] as CodeFrame | StringFrame;
    const ch = text[i] as string;
    if (top.kind === 'string') {
      if (top.raw > 0) {
        const close = text.indexOf('"'.repeat(top.raw), i);
        if (close === -1) return -1;
        stack.pop();
        i = close + top.raw;
      } else if (ch === '"') {
        if (top.verbatim && text[i + 1] === '"') {
          i += 2;
        } else {
          stack.pop();
          i++;
        }
      } else if (!top.verbatim && ch === '\\') {
        i += 2;
      } else if (!top.verbatim && (ch === '\n' || ch === '\r')) {
        stack.pop(); // an unclosed string ends at its line, as the compiler reports it
      } else if (top.interpolated && ch === '{') {
        if (text[i + 1] === '{') {
          i += 2;
        } else {
          stack.push({ kind: 'code', open: '{', close: '}', depth: 1 });
          i++;
        }
      } else {
        i++;
      }
      continue;
    }
    if (ch === '/' && text[i + 1] === '/') {
      i = lineEnd(text, i);
      continue;
    }
    if (ch === '/' && text[i + 1] === '*') {
      const close = text.indexOf('*/', i + 2);
      if (close === -1) return -1;
      i = close + 2;
      continue;
    }
    if (razor && stack.length === 1) {
      if (ch === '@' && text[i + 1] === '*') {
        const close = text.indexOf('*@', i + 2);
        if (close === -1) return -1;
        i = close + 2;
        continue;
      }
      if (ch === '@' && text[i + 1] === ':') {
        const end = lineEnd(text, i);
        keeps?.push([i + 2, end]);
        i = end;
        continue;
      }
      if (ch === '<' && text.startsWith('<text>', i)) {
        const close = textElementClose(text, i + 6);
        if (close === -1) return -1;
        keeps?.push([i + 6, close]);
        i = close + 7;
        continue;
      }
    }
    if (ch === "'") {
      const end = charLiteralEnd(text, i);
      i = end === -1 ? i + 1 : end;
      continue;
    }
    if (ch === '"' || ch === '@' || ch === '$') {
      const s = stringOpen(text, i);
      if (s !== null) {
        stack.push(s.frame);
        i = s.next;
        continue;
      }
      // No string opens anywhere in a run of `$`: step past the whole run, or each `$` in it would read the run
      // again (quadratic over a long one).
      if (ch === '$') {
        while (text[i] === '$') i++;
        continue;
      }
    }
    if (ch === top.open) {
      top.depth++;
    } else if (ch === top.close) {
      top.depth--;
      if (top.depth === 0) {
        stack.pop();
        if (stack.length === 0) return i + 1;
      }
    }
    i++;
  }
  return -1;
}

const IDENTIFIER = /[\p{L}_][\p{L}\p{N}_]*/uy;
const IDENTIFIER_CHAR = /[\p{L}\p{N}_]/u;

/** The C# identifier that starts at `at`, or '' when none does. */
function identifierAt(text: string, at: number): string {
  IDENTIFIER.lastIndex = at;
  return IDENTIFIER.exec(text)?.[0] ?? '';
}

/** Whether `word` stands at `at` as a whole word. */
function wordAt(text: string, at: number, word: string): boolean {
  return text.startsWith(word, at) && !IDENTIFIER_CHAR.test(text[at + word.length] ?? '');
}

function skipSpace(text: string, from: number): number {
  let i = from;
  while (i < text.length && /\s/.test(text[i] as string)) i++;
  return i;
}

/** The keywords that open a Razor control block, and those of them that take a `( ... )` header. */
const RAZOR_CONTROL = new Set(['if', 'else', 'foreach', 'for', 'while', 'do', 'switch', 'using', 'lock', 'try', 'catch', 'finally']);
const RAZOR_HEADED = new Set(['if', 'foreach', 'for', 'while', 'switch', 'using', 'lock', 'catch']);

/**
 * Offset just past the Razor control block whose keyword (`if`, `try`, `do` ...) ends at `from`, with chained
 * `else`, `else if`, `catch` and `finally` blocks and a `do` block's `while (...)` and `;`. Each block's `<text>`
 * and `@:` content goes to `keeps`. -1 when a header or a block never closes; the offset after the keyword and
 * header when no `{` follows them.
 */
function razorControlEnd(text: string, keyword: string, from: number, keeps: [number, number][]): number {
  let kw = keyword;
  let i = from;
  for (;;) {
    if (kw === 'else') {
      const k = skipSpace(text, i);
      if (wordAt(text, k, 'if')) {
        kw = 'if';
        i = k + 2;
      }
    }
    if (RAZOR_HEADED.has(kw)) {
      const k = skipSpace(text, i);
      if (text[k] === '(') {
        const end = csBracketEnd(text, k, false);
        if (end === -1) return -1;
        i = end;
      }
    }
    const brace = skipSpace(text, i);
    if (text[brace] !== '{') return i;
    const end = csBracketEnd(text, brace, true, keeps);
    if (end === -1) return -1;
    i = end;
    const next = skipSpace(text, i);
    if (kw === 'do') {
      if (!wordAt(text, next, 'while')) return i;
      const paren = skipSpace(text, next + 5);
      if (text[paren] !== '(') return next + 5;
      const close = csBracketEnd(text, paren, false);
      if (close === -1) return -1;
      const semi = skipSpace(text, close);
      return text[semi] === ';' ? semi + 1 : close;
    }
    if ((kw === 'if' || kw === 'else') && wordAt(text, next, 'else')) {
      kw = 'else';
      i = next + 4;
    } else if ((kw === 'try' || kw === 'catch') && (wordAt(text, next, 'catch') || wordAt(text, next, 'finally'))) {
      kw = wordAt(text, next, 'catch') ? 'catch' : 'finally';
      i = next + kw.length;
    } else {
      return i;
    }
  }
}

/** Offset just past the implicit expression whose identifier starts at `from`: the identifier, then any run of `.identifier`, `( ... )` and `[ ... ]`. */
function razorImplicitEnd(text: string, from: number): number {
  let i = from + identifierAt(text, from).length;
  for (;;) {
    if (text[i] === '.' && identifierAt(text, i + 1) !== '') {
      i += 1 + identifierAt(text, i + 1).length;
    } else if (text[i] === '(' || text[i] === '[') {
      const end = csBracketEnd(text, i, false);
      if (end === -1) return text.length;
      i = end;
    } else {
      return i;
    }
  }
}

/** `@@`, `@*`, `@(`, `@{`, or an `@` before an identifier that follows no letter or digit (Razor's email rule). */
const RAZOR_OPENER = /@[@*({]|(?<![\p{L}\p{N}])@(?=[\p{L}_])/gu;

/** How deep `<text>` and `@:` content inside control blocks inside such content is followed; past this it is blanked. */
const MAX_RAZOR_NESTING = 16;

function razorBlank(body: string, depth: number): string {
  if (depth > MAX_RAZOR_NESTING) return blank(body);
  let out = '';
  let cursor = 0;
  const opener = new RegExp(RAZOR_OPENER.source, RAZOR_OPENER.flags);
  for (let m = opener.exec(body); m !== null; m = opener.exec(body)) {
    const open = m.index;
    let end: number;
    let replaced: string;
    if (m[0] === '@@') {
      end = open + 2;
      replaced = ' @';
    } else if (m[0] === '@*') {
      const close = body.indexOf('*@', open + 2);
      end = close === -1 ? body.length : close + 2;
      replaced = blank(body.slice(open, end));
    } else if (m[0] === '@(' || m[0] === '@{') {
      const close = csBracketEnd(body, open + 1, m[0] === '@{');
      end = close === -1 ? body.length : close;
      const span = blank(body.slice(open, end));
      replaced = m[0] === '@(' ? '_' + span.slice(1) : span;
    } else {
      const word = identifierAt(body, open + 1);
      if (RAZOR_CONTROL.has(word)) {
        const keeps: [number, number][] = [];
        const close = razorControlEnd(body, word, open + 1 + word.length, keeps);
        end = close === -1 ? body.length : close;
        replaced = '';
        let at = open;
        // A block that never closes is blanked whole, its content too.
        for (const [s, e] of close === -1 ? [] : keeps) {
          replaced += blank(body.slice(at, s)) + razorBlank(body.slice(s, e), depth + 1);
          at = e;
        }
        replaced += blank(body.slice(at, end));
      } else {
        let start = open + 1;
        if (word === 'await') {
          let k = start + 5;
          while (body[k] === ' ' || body[k] === '\t') k++;
          if (k > start + 5 && identifierAt(body, k) !== '') start = k;
        }
        end = razorImplicitEnd(body, start);
        const span = blank(body.slice(open, end));
        replaced = '_' + span.slice(1);
      }
    }
    out += body.slice(cursor, open) + replaced;
    cursor = end;
    opener.lastIndex = end;
  }
  return out + body.slice(cursor);
}

/**
 * Blanks the Razor syntax of a script body (Decision 8 of #13012) so the JavaScript parser can read it, keeping
 * every length and line break:
 * - `@* ... *@` becomes spaces, and `@@` becomes ` @`.
 * - An explicit expression `@( ... )` and an implicit one (`@`, an optional `await `, an identifier, then any run
 *   of `.identifier`, `( ... )` and `[ ... ]`) become `_` padded with spaces to their length. An implicit
 *   expression is recognized only where the `@` follows no letter or digit, Razor's own email rule, so the
 *   address in `'support@example.com'` is left.
 * - A code block `@{ ... }` becomes spaces.
 * - A control block (`@if`, `@else`, `@foreach`, `@for`, `@while`, `@do`, `@switch`, `@using`, `@lock`, `@try`,
 *   `@catch`, `@finally`, with chained `else`, `catch` and `finally`) becomes spaces, keyword, header and braces
 *   included, except the content of its `<text> ... </text>` elements and `@:` lines, which is kept as script
 *   with its own Razor syntax blanked the same way.
 * Brackets are matched string-aware (`csBracketEnd`), so a `)` or `}` in a C# string does not end them. An
 * expression, block or comment that never ends is blanked to the end of the body; a control keyword with no
 * `{` after its header is blanked with its header only.
 */
export function blankRazorTags(body: string): string {
  return razorBlank(body, 0);
}

/** A Razor comment, or an `@code` or `@functions` directive up to its `{`. */
const RAZOR_CODE_DIRECTIVE = /@\*|(?<![\p{L}\p{N}])@(?:code|functions)(?![\p{L}\p{N}_])\s*\{/gu;
/**
 * `@using <namespace>` on a line of its own (`static` and alias forms too; not the `@using (...)` control block),
 * matched against `directiveLine`'s text, which has no trailing white space or semicolon. No two white-space
 * quantifiers stand side by side here or in the inject pattern: that shape backtracks cubically over a long run of
 * spaces (92 s for 10,000 of them), and a scan reaches it before any engine-side limit.
 */
const RAZOR_USING_LINE = /^([ \t\uFEFF]*)@using[ \t]+([\p{L}_][^{}()\r\n;]*)$/u;
/**
 * The other directive lines a file may open with before its usings (a routable component starts with `@page`, and
 * often `@rendermode`): they do not take the class header. A byte order mark may come first.
 */
const RAZOR_LEADING_DIRECTIVE = /^[ \t\uFEFF]*@(?:page|rendermode|layout|attribute|implements|inherits|namespace|model|typeparam|preservewhitespace)(?![\p{L}\p{N}_])/u;
/** `@inject <Type> <Name>` on a line of its own, matched against `directiveLine`'s text as the using pattern is. */
const RAZOR_INJECT_LINE = /^([ \t]*)@inject([ \t]+\S.*\s[\p{L}_][\p{L}\p{N}_]*)$/u;
const RAZOR_CLASS_HEADER = 'class __RazorCode {';

/** A directive line's text without its trailing white space and one trailing semicolon (`@inject T X ;`). */
function directiveLine(content: string): string {
  const trimmed = content.trimEnd();
  return trimmed.endsWith(';') ? trimmed.slice(0, -1).trimEnd() : trimmed;
}

/** A Razor comment or an HTML comment opening in markup. */
const MARKUP_COMMENT = /@\*|<!--/g;

/** `markup` with its `@* ... *@` and `<!-- ... -->` comments blanked; one that never closes is blanked to the end. */
function blankMarkupComments(markup: string): string {
  let out = '';
  let cursor = 0;
  const opener = new RegExp(MARKUP_COMMENT.source, MARKUP_COMMENT.flags);
  for (let m = opener.exec(markup); m !== null; m = opener.exec(markup)) {
    const closer = m[0] === '@*' ? '*@' : '-->';
    const close = markup.indexOf(closer, m.index + m[0].length);
    const end = close === -1 ? markup.length : close + closer.length;
    out += markup.slice(cursor, m.index) + blank(markup.slice(m.index, end));
    cursor = end;
    opener.lastIndex = end;
  }
  return out + markup.slice(cursor);
}

/**
 * The C# copy of a Razor file (Decision 9 of #13012), or null when it has no `@code { ... }` or
 * `@functions { ... }` block: a single class holding every such block, so a C# rule can read the code a
 * `.razor` component or a `.cshtml` view carries.
 * - `class __RazorCode {` is placed at the start of the first line that is neither blank nor one of the leading
 *   directive lines: `@page`, `@using`, `@rendermode`, `@layout`, `@attribute`, `@implements`, `@inherits`,
 *   `@namespace`, `@model`, `@typeparam`, `@preservewhitespace` (Decision 9 as amended: a routable component opens
 *   with `@page`, often `@rendermode`, before its usings, as eShop's `Chatbot.razor` does).
 * - Each `@using <namespace>` line before the header becomes `using <namespace>;`; the other directives of that
 *   leading block become spaces. An `@using` after the header stays spaces, a known gap.
 * - Each `@inject <Type> <Name>` line becomes the field `<Type> <Name>;`, at its own columns; the header may share
 *   its line.
 * - Each code block keeps its body as written, and its own braces become spaces. A block that never closes runs
 *   to the end of the file.
 * - Everything else becomes spaces, and `}` is appended after the last line.
 * - A line that is only a markup comment (`@* ... *@`, `<!-- ... -->`, a licence header) counts as blank, and a
 *   directive inside one is not read.
 * - The header goes no later than the line where the first code block's body starts, so a file whose other lines
 *   are all blank or directives (`@layout MainLayout @code { ... }`) still gets one.
 * Line numbers hold; columns hold everywhere except on the header line.
 */
export function razorCSharp(text: string): string | null {
  /** `[start, end)` of each code block's body, and of each whole block (`@code` to its `}`), where no line directive is read. */
  const bodies: [number, number][] = [];
  const spans: [number, number][] = [];
  const directive = new RegExp(RAZOR_CODE_DIRECTIVE.source, RAZOR_CODE_DIRECTIVE.flags);
  for (let m = directive.exec(text); m !== null; m = directive.exec(text)) {
    let end: number;
    if (m[0] === '@*') {
      const close = text.indexOf('*@', m.index + 2);
      end = close === -1 ? text.length : close + 2;
    } else {
      const brace = m.index + m[0].length - 1;
      // A code block is Razor code: a `@* *@` comment, `<text>` or `@:` line in it does not count its braces.
      const close = csBracketEnd(text, brace, true);
      end = close === -1 ? text.length : close;
      bodies.push([brace + 1, close === -1 ? text.length : close - 1]);
      spans.push([m.index, end]);
    }
    directive.lastIndex = end;
  }
  if (bodies.length === 0) return null;

  let kept = '';
  let cursor = 0;
  for (const [s, e] of bodies) {
    kept += blank(text.slice(cursor, s)) + text.slice(s, e);
    cursor = e;
  }
  kept += blank(text.slice(cursor));

  // The text with the comments of its markup (`@* *@`, `<!-- -->`) blanked, which the line directives are read
  // from: a line that is only a comment (a licence header) counts as blank, and a commented-out directive is not read.
  let uncommented = '';
  cursor = 0;
  for (const [s, e] of spans) {
    uncommented += blankMarkupComments(text.slice(cursor, s)) + text.slice(s, e);
    cursor = e;
  }
  uncommented += blankMarkupComments(text.slice(cursor));

  const plain = uncommented.split('\n');
  const out = kept.split('\n');
  // The class must open no later than the line where the first code block's body starts, even when every line
  // before it is a leading directive (`@layout MainLayout @code { ... }`).
  const firstBodyLine = text.slice(0, (bodies[0] as [number, number])[0]).split('\n').length - 1;
  let header = -1;
  let lineStart = 0;
  let span = 0;
  for (let n = 0; n < plain.length; n++) {
    const line = plain[n] as string;
    while (span < spans.length && (spans[span] as [number, number])[1] <= lineStart) span++;
    const inside = span < spans.length && (spans[span] as [number, number])[0] < lineStart;
    const cr = line.endsWith('\r') ? '\r' : '';
    const content = cr === '' ? line : line.slice(0, -1);
    if (header === -1) {
      const using = inside ? null : RAZOR_USING_LINE.exec(directiveLine(content));
      if (using !== null) out[n] = `${using[1] as string}using ${using[2] as string};${cr}`;
      else if (content.trim() !== '' && (inside || !RAZOR_LEADING_DIRECTIVE.test(content))) header = n;
      if (n === firstBodyLine) header = n;
    }
    if (header !== -1 && !inside) {
      const inject = RAZOR_INJECT_LINE.exec(directiveLine(content));
      if (inject !== null) out[n] = `${inject[1] as string}${' '.repeat('@inject'.length)}${inject[2] as string};${cr}`;
    }
    lineStart += line.length + 1;
  }
  out[header] = RAZOR_CLASS_HEADER + (out[header] as string);
  const joined = out.join('\n');
  return joined + (joined.endsWith('\n') ? '}' : '\n}');
}

interface TemplateOptions {
  erb?: boolean;
  jsp?: boolean;
  /** A PHP view: script blocks are looked for only in its inline HTML, and PHP tags are blanked inside a block. */
  php?: boolean;
  /** A Blade view: what `php` does, then Blade syntax is blanked inside a block. */
  blade?: boolean;
  twig?: boolean;
  /** A Razor view or component (`.cshtml`, `.razor`): Razor syntax is blanked inside a block. */
  razor?: boolean;
}

function blankTemplateTags(body: string, opts: TemplateOptions): string {
  if (opts.razor === true) return blankRazorTags(body);
  if (opts.blade === true) return blankBladeTags(blankPhpTags(body));
  if (opts.php === true) return blankPhpTags(body);
  if (opts.twig === true) return blankTwigTags(body);
  if (opts.erb === true) return blankErbTags(body);
  if (opts.jsp === true) return blankJspTags(body);
  return body;
}

/**
 * Keeps the body of each qualifying `<script>` element and replaces every
 * other character except line breaks with a space, so line and column numbers
 * hold. Returns null when no block qualifies. In a PHP or Blade view the blocks
 * are looked for in `blankPhpRegions(text)`, so only inline HTML holds one, and
 * each body is taken from the original text and then blanked; blanking keeps
 * every length, so the offsets agree.
 */
export function blankOutsideScripts(text: string, opts: TemplateOptions = {}): { text: string; lang: 'ts' | 'js' } | null {
  // No "<script" at all, as in a PHP class file: nothing to find, and no PHP region to walk.
  if (!/<script/i.test(text)) return null;
  const searched = opts.php === true || opts.blade === true ? blankPhpRegions(text) : text;
  const blocks = findScriptBlocks(searched).filter((b) => qualifies(b, searched));
  if (blocks.length === 0) return null;
  let out = '';
  let cursor = 0;
  for (const b of blocks) {
    out += blank(text.slice(cursor, b.start));
    out += blankTemplateTags(text.slice(b.start, b.end), opts);
    cursor = b.end;
  }
  out += blank(text.slice(cursor));
  return { text: out, lang: blocks.some(isTypeScript) ? 'ts' : 'js' };
}

/**
 * Writes `<tmpDir>/<originalPath>.lexcode.<ts|js>` for each file with an
 * extractable extension that holds at least one script block (in a `.php`,
 * `.phtml` or `.blade.php` view, one in its inline HTML), and
 * `<tmpDir>/<originalPath>.lexcode.rb` (the whole file) for a Rakefile,
 * Fastfile, Appfile or Capfile, and for a `.rake`, `.ru` or `.gemspec` file, and
 * `<tmpDir>/<originalPath>.lexcode.php` (the whole file) for an `.inc`, `.module`, `.theme` or `.install` file
 * whose text begins with `<?php`, and `<tmpDir>/<originalPath>.lexcode.cs` (`razorCSharp`) for a `.cshtml` or
 * `.razor` file with an `@code` or `@functions` block. A Razor file can give both a script copy and a C# copy,
 * so the pairs are one per copy, not one per file. `files` are POSIX paths relative to `root`.
 */
export function extractScripts(
  root: string,
  files: string[],
  tmpDir: string,
): { tempPath: string; originalPath: string }[] {
  const pairs: { tempPath: string; originalPath: string }[] = [];
  const tmpRoot = path.resolve(tmpDir);
  for (const originalPath of files) {
    const ext = path.posix.extname(originalPath).toLowerCase();
    const wholeRuby = RUBY_BASENAMES.has(path.posix.basename(originalPath)) || RUBY_COPY_EXTENSIONS.has(ext);
    const wholePhp = PHP_COPY_EXTENSIONS.has(ext);
    if (!wholeRuby && !wholePhp && !EXTRACT_EXTENSIONS.has(ext)) continue;
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
    // One file can give two copies: a Razor file's script blocks and its C# code.
    const copies: { kept: string; suffix: string }[] = [];
    if (wholeRuby) {
      copies.push({ kept: text, suffix: 'rb' });
    } else if (wholePhp) {
      if (!PHP_OPENING.test(text)) continue; // an `.inc` in C, Pascal or assembler
      copies.push({ kept: text, suffix: 'php' });
    } else {
      const blade = originalPath.toLowerCase().endsWith(BLADE_SUFFIX);
      const razor = RAZOR_EXTENSIONS.has(ext);
      const blanked = blankOutsideScripts(text, {
        erb: ext === '.erb',
        jsp: JSP_EXTENSIONS.has(ext),
        php: !blade && PHP_VIEW_EXTENSIONS.has(ext),
        blade,
        twig: ext === '.twig',
        razor,
      });
      if (blanked !== null) copies.push({ kept: blanked.text, suffix: blanked.lang });
      const cs = razor ? razorCSharp(text) : null;
      if (cs !== null) copies.push({ kept: cs, suffix: 'cs' });
    }
    for (const { kept, suffix } of copies) {
      const tempPath = path.join(tmpRoot, ...segments) + `.lexcode.${suffix}`;
      if (!tempPath.startsWith(tmpRoot + path.sep)) {
        throw new ToolError(`refusing to extract "${originalPath}": it is outside the repository.`);
      }
      mkdirSync(path.dirname(tempPath), { recursive: true });
      writeFileSync(tempPath, kept);
      pairs.push({ tempPath, originalPath });
    }
  }
  return pairs;
}
