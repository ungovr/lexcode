import { blank } from './blank.js';

// Razor views (`.cshtml`) and components (`.razor`). `blankRazorTags` blanks the Razor syntax of a script body so
// the JavaScript parser can read it, and `razorCSharp` builds the `.lexcode.cs` copy of a file's `@code` and
// `@functions` blocks. `extractScripts` in extract.ts calls both.

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
  /** Where the literal starts, its `$` or `@` included. */
  start: number;
}

/**
 * What a walk that reads the markup inside Razor code carries (`blankRazorScriptHiders`): how many markup-and-code
 * levels it has gone down, the characters it may still spend on markup that turns out never to close, and the last
 * offset of each closer the text holds, so a search for one that is not there costs nothing the second time.
 */
interface MarkupScan {
  depth: number;
  budget: { left: number };
  lastCloser: Map<string, number>;
}

/** A code character after which a `<` starts a statement, so it opens markup in a Razor code block. */
const STATEMENT_END = '{};:';

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
  if (!verbatim && quotes >= 3) return { frame: { kind: 'string', verbatim: false, interpolated: dollars > 0, raw: quotes, start: i }, next: j + quotes };
  return { frame: { kind: 'string', verbatim, interpolated: dollars > 0, raw: 0, start: i }, next: j + 1 };
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
 * `[start, end)`. Each string literal and comment it steps over (a Razor comment too) is pushed to `texts` as
 * `[start, end)`, an unclosed string's to the end of its line. With `markup` as well, a tag at the start of a
 * statement at the block's own level (after `{`, `}`, `;` or `:`, outside any `(` or `[`) and an `@<` template
 * are markup, stepped over by `markupElementEnd`; a `<` anywhere else is C# (a comparison, a type argument).
 */
function csBracketEnd(
  text: string,
  open: number,
  razor: boolean,
  keeps?: [number, number][],
  texts?: [number, number][],
  markup?: MarkupScan,
): number {
  const first = text[open] as string;
  const stack: (CodeFrame | StringFrame)[] = [{ kind: 'code', open: first, close: BRACKET_CLOSE[first] as string, depth: 0 }];
  let i = open;
  /** The last character of code read at the block's own level, white space and comments aside, and how many `(` and `[` are open there. */
  let prev = '';
  let parens = 0;
  while (i < text.length) {
    const top = stack[stack.length - 1] as CodeFrame | StringFrame;
    const ch = text[i] as string;
    if (top.kind === 'string') {
      if (top.raw > 0) {
        const close = text.indexOf('"'.repeat(top.raw), i);
        if (close === -1) return -1;
        stack.pop();
        i = close + top.raw;
        texts?.push([top.start, i]);
        prev = '"';
      } else if (ch === '"') {
        if (top.verbatim && text[i + 1] === '"') {
          i += 2;
        } else {
          stack.pop();
          i++;
          texts?.push([top.start, i]);
          prev = '"';
        }
      } else if (!top.verbatim && ch === '\\') {
        i += 2;
      } else if (!top.verbatim && (ch === '\n' || ch === '\r')) {
        stack.pop(); // an unclosed string ends at its line, as the compiler reports it
        texts?.push([top.start, i]);
        prev = '"';
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
      const end = lineEnd(text, i);
      texts?.push([i, end]);
      i = end;
      continue;
    }
    if (ch === '/' && text[i + 1] === '*') {
      const close = text.indexOf('*/', i + 2);
      if (close === -1) return -1;
      texts?.push([i, close + 2]);
      i = close + 2;
      continue;
    }
    if (razor && stack.length === 1) {
      if (ch === '@' && text[i + 1] === '*') {
        const close = text.indexOf('*@', i + 2);
        if (close === -1) return -1;
        texts?.push([i, close + 2]);
        i = close + 2;
        continue;
      }
      if (ch === '@' && text[i + 1] === ':') {
        const end = lineEnd(text, i);
        keeps?.push([i + 2, end]);
        i = end;
        prev = ';';
        continue;
      }
      if (ch === '<' && text.startsWith('<text>', i)) {
        const close = textElementClose(text, i + 6);
        if (close === -1) return -1;
        keeps?.push([i + 6, close]);
        i = close + 7;
        prev = ';';
        continue;
      }
      // Markup: a tag at the start of a statement, or a template (`@<p>...</p>`) anywhere. Razor reads it as markup
      // to its closing tag, so its text is not C#.
      if (markup !== undefined && ((ch === '<' && parens === 0 && STATEMENT_END.includes(prev)) || (ch === '@' && text[i + 1] === '<'))) {
        const end = markupElementEnd(text, ch === '@' ? i + 1 : i, markup, texts);
        if (end !== -1) {
          i = end;
          prev = ';';
          continue;
        }
      }
    }
    if (ch === "'") {
      const end = charLiteralEnd(text, i);
      i = end === -1 ? i + 1 : end;
      prev = "'";
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
        prev = '$';
        continue;
      }
    }
    if (stack.length === 1 && ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r') {
      prev = ch;
      if (ch === '(' || ch === '[') parens++;
      else if ((ch === ')' || ch === ']') && parens > 0) parens--;
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
 * header when no `{` follows them. The string literals and comments stepped over go to `texts` (`csBracketEnd`).
 */
function razorControlEnd(
  text: string,
  keyword: string,
  from: number,
  keeps: [number, number][],
  texts?: [number, number][],
  markup?: MarkupScan,
): number {
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
        const end = csBracketEnd(text, k, false, undefined, texts);
        if (end === -1) return -1;
        i = end;
      }
    }
    const brace = skipSpace(text, i);
    if (text[brace] !== '{') return i;
    const end = csBracketEnd(text, brace, true, keeps, texts, markup);
    if (end === -1) return -1;
    i = end;
    const next = skipSpace(text, i);
    if (kw === 'do') {
      if (!wordAt(text, next, 'while')) return i;
      const paren = skipSpace(text, next + 5);
      if (text[paren] !== '(') return next + 5;
      const close = csBracketEnd(text, paren, false, undefined, texts);
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
function razorImplicitEnd(text: string, from: number, texts?: [number, number][]): number {
  let i = from + identifierAt(text, from).length;
  for (;;) {
    if (text[i] === '.' && identifierAt(text, i + 1) !== '') {
      i += 1 + identifierAt(text, i + 1).length;
    } else if (text[i] === '(' || text[i] === '[') {
      const end = csBracketEnd(text, i, false, undefined, texts);
      if (end === -1) return text.length;
      i = end;
    } else {
      return i;
    }
  }
}

/** HTML elements that have no closing tag. */
const VOID_ELEMENTS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const TAG_NAME = /[A-Za-z][\w:.-]*/y;
/** The longest start tag read as one; a `<` with no `>` within this is not markup. */
const MAX_START_TAG_CHARS = 4000;

/**
 * Offset just past the `>` of the start tag whose name ends at `from`, past quoted attribute values, and whether it
 * closes itself (`/>`); null when no `>` comes within MAX_START_TAG_CHARS.
 */
function startTagEnd(text: string, from: number): { next: number; selfClosing: boolean } | null {
  const limit = Math.min(text.length, from + MAX_START_TAG_CHARS);
  let i = from;
  while (i < limit) {
    const ch = text[i] as string;
    if (ch === '"' || ch === "'") {
      i++;
      while (i < limit && text[i] !== ch) i++;
      i++;
      continue;
    }
    if (ch === '>') return { next: i + 1, selfClosing: text[i - 1] === '/' };
    i++;
  }
  return null;
}

/** Offset of the first `closer` at or after `from`, or -1; once the text holds none past an offset, asking costs nothing. */
function closerAt(text: string, closer: string, from: number, markup: MarkupScan): number {
  let last = markup.lastCloser.get(closer);
  if (last === undefined) {
    last = text.lastIndexOf(closer);
    markup.lastCloser.set(closer, last);
  }
  return from > last ? -1 : text.indexOf(closer, from);
}

/** Offset of the first `</name` (any case) at or after `from`, or -1. */
function closingTagAt(text: string, name: string, from: number): number {
  const close = new RegExp(`</${name}(?![\\w:.-])`, 'gi');
  close.lastIndex = from;
  return close.exec(text)?.index ?? -1;
}

/** The scan one level further down, or undefined past MAX_RAZOR_NESTING, where markup inside code is read as code. */
function deeper(markup: MarkupScan): MarkupScan | undefined {
  return markup.depth >= MAX_RAZOR_NESTING ? undefined : { ...markup, depth: markup.depth + 1 };
}

/**
 * Offset just past the markup that opens with the `<` at `lt` inside Razor code, as Razor reads it: an HTML comment
 * to its `-->`, a void or self-closing element to its `>`, a `<script>` or `<style>` element to its closing tag, and
 * any other element to the closing tag that matches it, past nested elements of its name. Its text is markup, not C#;
 * its Razor code (`@{ }`, `@if`, `@( )`, `@Model.X`, `@* *@`) is read as code, and each C# string or comment in it
 * goes to `texts`. An element that never closes, or whose code never does, ends with its start tag's line. Each such
 * element's reading is charged to the walk's budget, and an element is read no further than what is left of it, so
 * the walk stays linear over a file of them; once it is spent, every element ends with its line, unread. -1 when no
 * tag opens at `lt`.
 */
function markupElementEnd(text: string, lt: number, markup: MarkupScan, texts?: [number, number][]): number {
  if (text.startsWith('<!--', lt)) {
    const close = markup.budget.left > 0 ? closerAt(text, '-->', lt + 4, markup) : -1;
    return close === -1 ? lineEnd(text, lt) : close + 3;
  }
  TAG_NAME.lastIndex = lt + 1;
  const name = TAG_NAME.exec(text)?.[0];
  if (name === undefined) return -1;
  const tag = startTagEnd(text, lt + 1 + name.length);
  if (tag === null) return -1;
  const lower = name.toLowerCase();
  if (tag.selfClosing || VOID_ELEMENTS.has(lower)) return tag.next;
  // Where the element ends if it never closes: its start tag's line end, found only then, since finding it for
  // every element costs each the rest of its line, which is quadratic over a long line of elements.
  const unclosed = (): number => lineEnd(text, tag.next - 1);
  if (markup.budget.left <= 0) return unclosed();
  const fail = (): number => {
    markup.budget.left -= text.length - lt;
    return unclosed();
  };
  const pastClosingTag = (at: number): number => {
    const gt = text.indexOf('>', at);
    return gt === -1 ? fail() : gt + 1;
  };
  if (lower === 'script' || lower === 'style') {
    const close = closingTagAt(text, lower, tag.next);
    return close === -1 ? fail() : pastClosingTag(close);
  }
  const inner = deeper(markup);
  let depth = 1;
  const stop = /[<@]/g;
  stop.lastIndex = tag.next;
  for (let m = stop.exec(text); m !== null; m = stop.exec(text)) {
    const at = m.index;
    // Past what is left of the budget, the element is taken as one that never closes, as it most likely is.
    if (at - lt > markup.budget.left) return fail();
    let next = at + 1;
    if (text[at] === '<') {
      if (text.startsWith('<!--', at)) {
        const close = closerAt(text, '-->', at + 4, markup);
        if (close !== -1) next = close + 3;
      } else {
        const closing = text[at + 1] === '/';
        TAG_NAME.lastIndex = at + (closing ? 2 : 1);
        const other = TAG_NAME.exec(text)?.[0]?.toLowerCase();
        if (other !== undefined && closing && other === lower) {
          depth--;
          if (depth === 0) return pastClosingTag(at);
        } else if (other !== undefined && !closing) {
          const t = startTagEnd(text, at + 1 + other.length);
          if (t !== null) {
            next = t.next;
            if (other === lower && !t.selfClosing) depth++;
            else if ((other === 'script' || other === 'style') && !t.selfClosing) {
              const close = closingTagAt(text, other, t.next);
              if (close === -1) return fail();
              next = close;
            }
          }
        }
      }
    } else {
      const c = text[at + 1] ?? '';
      if (c === '@') {
        next = at + 2;
      } else if (c === '*') {
        // A Razor comment; one that never closes ends with its line.
        const close = closerAt(text, '*@', at + 2, markup);
        next = close === -1 ? lineEnd(text, at) : close + 2;
        texts?.push([at, next]);
      } else if (c === '{' || c === '(') {
        const end = csBracketEnd(text, at + 1, c === '{', undefined, texts, inner);
        if (end === -1) return fail();
        next = end;
      } else if (!/[\p{L}\p{N}]/u.test(text[at - 1] ?? '') && identifierAt(text, at + 1) !== '') {
        const word = identifierAt(text, at + 1);
        const end = RAZOR_CONTROL.has(word)
          ? razorControlEnd(text, word, at + 1 + word.length, [], texts, inner)
          : razorImplicitEnd(text, at + 1, texts);
        if (end === -1 || end >= text.length) return fail();
        next = end;
      }
    }
    stop.lastIndex = next;
  }
  return fail();
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

/** A `<script` or `</script` tag opener, in either case. */
const SCRIPT_TAG = /<\/?script/gi;

/**
 * Whether a `[start, end)` span of `text` holds a `<script` or `</script`, asked in O(log n): `tags` is where each
 * such opener stands and ends, in order, found once for the text. A span is never read again, which matters
 * because spans nest: each of a run of nested interpolated strings (`$"{$"{ ... }"}"`) holds all the ones inside
 * it, so their lengths add up to the square of the nesting (#13208).
 */
function scriptTagWithin(tags: [number, number][]): (start: number, end: number) => boolean {
  return (start, end) => {
    let lo = 0;
    let hi = tags.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if ((tags[mid] as [number, number])[0] < start) lo = mid + 1;
      else hi = mid;
    }
    // The first opener at or after `start` ends first of all those that do: the span holds one if it holds that.
    return lo < tags.length && (tags[lo] as [number, number])[1] <= end;
  };
}

/**
 * `text` with each place a `<script` stands that is Razor or C# text, not markup, blanked, so a search for script
 * blocks finds only live ones (#12882): a Razor comment (`@* ... *@`), and a C# string literal or comment that holds
 * `<script` or `</script` inside a code block (`@{ ... }`, `@code { ... }`, `@functions { ... }`), a control block
 * (`@if (...) { ... }` and the rest of `RAZOR_CONTROL`), an explicit expression (`@( ... )`) or an implicit one
 * (`@Html.Raw("...")`). Markup inside a code or control block (a `<script>` element written as a tag, Razor's
 * transition back to markup) is left, so it is still found: a block is not blanked whole, only those strings and
 * comments, matched string-aware as `csBracketEnd` matches brackets. That markup is read as markup to its closing tag
 * (`markupElementEnd`), so a `//`, `/*` or quote in its text is not taken for C#, and the Razor code inside it is read
 * as code again. Every length and line break holds. A block or expression that never closes runs to the end of the
 * text, and the walk stops there; a Razor comment that never closes is hidden to the end of its line.
 */
export function blankRazorScriptHiders(text: string): string {
  const hidden: [number, number][] = [];
  const holdsScriptTag = scriptTagWithin([...text.matchAll(SCRIPT_TAG)].map((m) => [m.index, m.index + m[0].length]));
  // Markup that never closes is read to the end of the text at most this often in all, then to its line unread.
  const markup: MarkupScan = { depth: 0, budget: { left: 2 * text.length + 65_536 }, lastCloser: new Map() };
  const opener = new RegExp(RAZOR_OPENER.source, RAZOR_OPENER.flags);
  for (let m = opener.exec(text); m !== null; m = opener.exec(text)) {
    const open = m.index;
    const texts: [number, number][] = [];
    let end: number;
    if (m[0] === '@@') {
      end = open + 2;
    } else if (m[0] === '@*') {
      // A comment that never closes is hidden to the end of its line, never the file's, so it hides no later script.
      const close = closerAt(text, '*@', open + 2, markup);
      end = close === -1 ? lineEnd(text, open) : close + 2;
      hidden.push([open, end]);
    } else if (m[0] === '@(' || m[0] === '@{') {
      end = csBracketEnd(text, open + 1, m[0] === '@{', undefined, texts, markup);
    } else {
      const word = identifierAt(text, open + 1);
      const after = open + 1 + word.length;
      if (word === 'code' || word === 'functions') {
        const brace = skipSpace(text, after);
        end = text[brace] === '{' ? csBracketEnd(text, brace, true, undefined, texts, markup) : after;
      } else if (RAZOR_CONTROL.has(word)) {
        end = razorControlEnd(text, word, after, [], texts, markup);
      } else {
        end = razorImplicitEnd(text, open + 1, texts);
      }
    }
    for (const [s, e] of texts) if (holdsScriptTag(s, e)) hidden.push([s, e]);
    if (end === -1 || end >= text.length) break;
    opener.lastIndex = end;
  }
  if (hidden.length === 0) return text;
  hidden.sort((a, b) => a[0] - b[0]);
  let out = '';
  let cursor = 0;
  for (const [s, e] of hidden) {
    if (e <= cursor) continue;
    const from = Math.max(s, cursor);
    out += text.slice(cursor, from) + blank(text.slice(from, e));
    cursor = e;
  }
  return out + text.slice(cursor);
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
