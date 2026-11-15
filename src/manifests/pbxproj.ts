/**
 * A reader for Xcode's `project.pbxproj`, which is an OpenStep ("old-style ASCII") property list (#13199).
 * A value is a dictionary `{ key = value; ... }`, an array `( value, value, )`, a quoted string with
 * backslash escapes, a bare string (`5.0.0`, `PBXNativeTarget`, `$(SRCROOT)/App`) or data `<0fbd 77>`,
 * which is kept as its hex digits. `/* ... *\/` and `//` comments are skipped wherever whitespace may be.
 *
 * Xcode can also save the file as an XML or binary plist; those throw `PbxprojError`, as does any
 * malformed text. The error names a line and a column and never quotes the file, which may hold a token.
 */

export type PbxValue = string | PbxValue[] | { [k: string]: PbxValue };
export type PbxDict = { [k: string]: PbxValue };

export class PbxprojError extends Error {
  /** `kind` is `binary` or `xml` for a plist in another format, `syntax` for malformed text. */
  constructor(
    message: string,
    readonly kind: 'binary' | 'xml' | 'syntax',
    readonly line?: number,
    readonly column?: number,
  ) {
    super(message);
    this.name = 'PbxprojError';
  }
}

export interface ParsedPbxproj {
  root: PbxDict;
  /** 1-based line of `key` inside the object `objectId` of the `objects` table; the object's own line when it lacks the key; 1 when there is no such object. */
  lineOf: (objectId: string, key: string) => number;
}

/** Characters of a bare (unquoted) string, as Xcode and Foundation's OpenStep reader accept them. */
const BARE = /[A-Za-z0-9_$/:.\-+]/;
const HEX = /[0-9A-Fa-f]/;
/**
 * Deepest nesting of dictionaries and arrays read. A real project nests about six deep; the cap keeps a
 * crafted file from exhausting the stack, so it is a syntax error (a notice) rather than a RangeError.
 */
export const MAX_PBX_DEPTH = 256;

function hasOwn(o: object, k: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, k);
}

/** Set `key` as an own, enumerable property: a key named `__proto__` stays a key and never reaches the prototype. */
function put(d: PbxDict, key: string, value: PbxValue): void {
  Object.defineProperty(d, key, { value, enumerable: true, writable: true, configurable: true });
}

class Parser {
  private i = 0;
  private line = 1;
  private lineStart = 0;
  private depth = 0;
  /** The line of each key of each dictionary, recorded as it is read. */
  readonly keyLines = new WeakMap<PbxDict, Map<string, number>>();

  constructor(private readonly s: string) {}

  fail(what: string, line = this.line, column = this.i - this.lineStart + 1): never {
    throw new PbxprojError(`invalid OpenStep plist at line ${line}, column ${column}: ${what}`, 'syntax', line, column);
  }

  private newline(at: number): void {
    this.line++;
    this.lineStart = at + 1;
  }

  /** Skip whitespace and comments. */
  ws(): void {
    const s = this.s;
    for (;;) {
      const c = s[this.i];
      if (c === '\n') {
        this.newline(this.i);
        this.i++;
      } else if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v' || c === '﻿') this.i++;
      else if (c === '/' && s[this.i + 1] === '/') {
        const end = s.indexOf('\n', this.i);
        this.i = end < 0 ? s.length : end;
      } else if (c === '/' && s[this.i + 1] === '*') {
        const end = s.indexOf('*/', this.i + 2);
        if (end < 0) this.fail('unterminated comment');
        for (let j = this.i; j < end; j++) if (s[j] === '\n') this.newline(j);
        this.i = end + 2;
      } else return;
    }
  }

  atEnd(): boolean {
    return this.i >= this.s.length;
  }

  value(): PbxValue {
    this.ws();
    const c = this.s[this.i];
    if (c === '{' || c === '(') {
      if (++this.depth > MAX_PBX_DEPTH) this.fail('nested too deep');
      const v = c === '{' ? this.dict() : this.array();
      this.depth--;
      return v;
    }
    if (c === '<') return this.data();
    if (c === '"' || c === "'") return this.quoted();
    if (c !== undefined && BARE.test(c)) return this.bare();
    return this.fail(c === undefined ? 'unexpected end of file' : 'unexpected character');
  }

  private expect(ch: string, what: string): void {
    this.ws();
    if (this.s[this.i] !== ch) this.fail(what);
    this.i++;
  }

  private dict(): PbxDict {
    this.i++; // {
    const out: PbxDict = {};
    const lines = new Map<string, number>();
    this.keyLines.set(out, lines);
    for (;;) {
      this.ws();
      if (this.s[this.i] === '}') {
        this.i++;
        return out;
      }
      const c = this.s[this.i];
      const keyLine = this.line;
      let key: string;
      if (c === '"' || c === "'") key = this.quoted();
      else if (c !== undefined && BARE.test(c)) key = this.bare();
      else this.fail(c === undefined ? 'unterminated dictionary' : 'expected a key');
      this.expect('=', 'expected = after a key');
      const v = this.value();
      this.expect(';', 'expected ; after a value');
      put(out, key, v);
      lines.set(key, keyLine);
    }
  }

  private array(): PbxValue[] {
    this.i++; // (
    const out: PbxValue[] = [];
    for (;;) {
      this.ws();
      if (this.s[this.i] === ')') {
        this.i++;
        return out;
      }
      if (this.atEnd()) this.fail('unterminated array');
      out.push(this.value());
      this.ws();
      if (this.s[this.i] === ',') this.i++;
      else if (this.s[this.i] !== ')') this.fail('expected , or ) in an array');
    }
  }

  private data(): string {
    this.i++; // <
    let hex = '';
    for (;;) {
      this.ws();
      const c = this.s[this.i];
      if (c === '>') {
        this.i++;
        return hex;
      }
      if (c === undefined || !HEX.test(c)) this.fail('invalid data');
      hex += c;
      this.i++;
    }
  }

  private bare(): string {
    const start = this.i;
    while (this.i < this.s.length && BARE.test(this.s[this.i] as string)) this.i++;
    return this.s.slice(start, this.i);
  }

  private quoted(): string {
    const s = this.s;
    const q = s[this.i] as string;
    // An unterminated string is reported where it starts, not at the end of the file.
    const line = this.line;
    const column = this.i - this.lineStart + 1;
    this.i++;
    let out = '';
    for (;;) {
      const c = s[this.i];
      if (c === undefined) this.fail('unterminated string', line, column);
      if (c === q) {
        this.i++;
        return out;
      }
      if (c === '\n') this.newline(this.i);
      if (c !== '\\') {
        out += c;
        this.i++;
        continue;
      }
      const e = s[this.i + 1];
      if (e === undefined) this.fail('unterminated string', line, column);
      this.i += 2;
      switch (e) {
        case 'n':
          out += '\n';
          break;
        case 't':
          out += '\t';
          break;
        case 'r':
          out += '\r';
          break;
        case 'a':
          out += '\x07';
          break;
        case 'b':
          out += '\b';
          break;
        case 'f':
          out += '\f';
          break;
        case 'v':
          out += '\v';
          break;
        case 'U': {
          const h = /^[0-9A-Fa-f]{1,4}/.exec(s.slice(this.i, this.i + 4));
          if (!h) this.fail('invalid \\U escape');
          out += String.fromCharCode(parseInt(h[0], 16));
          this.i += h[0].length;
          break;
        }
        default: {
          const o = /^[0-7]{1,3}/.exec(s.slice(this.i - 1, this.i + 2));
          if (o) {
            out += String.fromCharCode(parseInt(o[0], 8));
            this.i += o[0].length - 1;
          } else {
            if (e === '\n') this.newline(this.i - 1);
            out += e;
          }
        }
      }
    }
  }
}

/**
 * Parse the text of a `project.pbxproj`. The root must be a dictionary, and nothing but whitespace and
 * comments may follow it.
 */
export function parsePbxproj(text: string): ParsedPbxproj {
  const head = text.replace(/^﻿/, '').trimStart();
  if (head.startsWith('bplist')) throw new PbxprojError('a binary plist', 'binary');
  if (head.startsWith('<?xml') || head.startsWith('<!DOCTYPE plist') || head.startsWith('<plist')) throw new PbxprojError('an XML plist', 'xml');

  const p: Parser = new Parser(text);
  p.ws();
  if (p.atEnd()) p.fail('no root dictionary');
  const root = p.value();
  if (typeof root === 'string' || Array.isArray(root)) p.fail('the root is not a dictionary');
  p.ws();
  if (!p.atEnd()) p.fail('text after the root dictionary');

  const objects = hasOwn(root, 'objects') ? root['objects'] : undefined;
  const lineOf = (objectId: string, key: string): number => {
    if (objects === undefined || typeof objects === 'string' || Array.isArray(objects) || !hasOwn(objects, objectId)) return 1;
    const obj = objects[objectId] as PbxValue;
    if (typeof obj !== 'string' && !Array.isArray(obj)) {
      const at = p.keyLines.get(obj)?.get(key);
      if (at !== undefined && hasOwn(obj, key)) return at;
    }
    return p.keyLines.get(objects)?.get(objectId) ?? 1;
  };
  return { root, lineOf };
}
