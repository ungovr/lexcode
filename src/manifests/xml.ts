import { LineIndex } from './util.js';

/**
 * A small XML element reader, enough for a Maven `pom.xml`: elements, attributes, text, CDATA, comments,
 * processing instructions, a DOCTYPE (skipped, never expanded), self-closing tags, the five XML entities
 * and numeric character references, and the line each element starts on. It validates nothing beyond
 * well-formedness of the element tree, and it takes no dependency (#12858).
 */

export interface XmlElement {
  name: string;
  attrs: Record<string, string>;
  children: XmlElement[];
  /** Character data directly inside this element (CDATA included), decoded and trimmed. */
  text: string;
  /** 1-based line of the element's opening `<`. */
  line: number;
}

/** Malformed input. The message never quotes the text, only a line, so it is safe in an evidence record. */
export class XmlError extends Error {
  constructor(
    message: string,
    readonly line: number,
  ) {
    super(message);
    this.name = 'XmlError';
  }
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decode(s: string): string {
  if (!s.includes('&')) return s;
  return s.replace(/&(#x[0-9A-Fa-f]{1,6}|#[0-9]{1,7}|amp|lt|gt|quot|apos);/g, (whole, body: string) => {
    if (body.startsWith('#')) {
      const code = body[1] === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[body] ?? whole;
  });
}

const NAME_END = /[\s/>]/;

export function parseXml(input: string): XmlElement {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const lines = new LineIndex(text);
  const n = text.length;
  const stack: { el: XmlElement; raw: string }[] = [];
  let root: XmlElement | undefined;
  let i = 0;

  const fail = (message: string, at: number): never => {
    const line = lines.lineAt(Math.min(at, Math.max(n - 1, 0)));
    throw new XmlError(`${message} (line ${line})`, line);
  };

  const addText = (raw: string, at: number): void => {
    const top = stack[stack.length - 1];
    if (top) top.raw += raw;
    else if (raw.trim() !== '') fail('text outside the root element', at);
  };

  while (i < n) {
    const lt = text.indexOf('<', i);
    if (lt === -1) {
      addText(decode(text.slice(i)), i);
      break;
    }
    if (lt > i) addText(decode(text.slice(i, lt)), i);
    i = lt;

    if (text.startsWith('<!--', i)) {
      const end = text.indexOf('-->', i + 4);
      if (end === -1) fail('a comment is never closed', i);
      i = end + 3;
    } else if (text.startsWith('<![CDATA[', i)) {
      const end = text.indexOf(']]>', i + 9);
      if (end === -1) fail('a CDATA section is never closed', i);
      const top = stack[stack.length - 1];
      if (!top) fail('CDATA outside the root element', i);
      else top.raw += text.slice(i + 9, end);
      i = end + 3;
    } else if (text.startsWith('<?', i)) {
      const end = text.indexOf('?>', i + 2);
      if (end === -1) fail('a processing instruction is never closed', i);
      i = end + 2;
    } else if (text.startsWith('<!', i)) {
      // A DOCTYPE or other declaration: skipped to its closing '>', through any [ ... ] internal subset.
      let depth = 0;
      let quote = '';
      let j = i + 2;
      for (; j < n; j++) {
        const c = text[j] as string;
        if (quote) {
          if (c === quote) quote = '';
        } else if (c === '"' || c === "'") quote = c;
        else if (c === '[') depth++;
        else if (c === ']') depth--;
        else if (c === '>' && depth <= 0) break;
      }
      if (j >= n) fail('a declaration is never closed', i);
      i = j + 1;
    } else if (text.startsWith('</', i)) {
      const end = text.indexOf('>', i + 2);
      if (end === -1) fail('a closing tag is never finished', i);
      const name = text.slice(i + 2, end).trim();
      const top = stack.pop();
      if (!top) fail('a closing tag has no element to close', i);
      else if (top.el.name !== name) {
        throw new XmlError(`a closing tag on line ${lines.lineAt(i)} does not match the element opened on line ${top.el.line}`, top.el.line);
      } else top.el.text = top.raw.trim();
      i = end + 1;
    } else {
      // A start tag: name, attributes, then '>' or '/>'.
      const start = i;
      let j = i + 1;
      while (j < n && !NAME_END.test(text[j] as string)) j++;
      const name = text.slice(i + 1, j);
      if (name === '') fail('a tag has no name', start);
      const attrs: Record<string, string> = {};
      let selfClosing = false;
      for (;;) {
        while (j < n && /\s/.test(text[j] as string)) j++;
        if (j >= n) fail(`the tag ${name} is never finished`, start);
        const c = text[j] as string;
        if (c === '>') {
          j++;
          break;
        }
        if (c === '/') {
          if (text[j + 1] !== '>') fail(`the tag ${name} is malformed`, start);
          selfClosing = true;
          j += 2;
          break;
        }
        let k = j;
        while (k < n && !/[\s=/>]/.test(text[k] as string)) k++;
        const attr = text.slice(j, k);
        if (attr === '') fail(`the tag ${name} is malformed`, start);
        while (k < n && /\s/.test(text[k] as string)) k++;
        if (text[k] !== '=') {
          attrs[attr] = '';
          j = k;
          continue;
        }
        k++;
        while (k < n && /\s/.test(text[k] as string)) k++;
        const q = text[k];
        if (q !== '"' && q !== "'") fail(`an attribute of ${name} has no quoted value`, start);
        const close = text.indexOf(q as string, k + 1);
        if (close === -1) fail(`an attribute of ${name} is never closed`, start);
        attrs[attr] = decode(text.slice(k + 1, close));
        j = close + 1;
      }
      const el: XmlElement = { name, attrs, children: [], text: '', line: lines.lineAt(start) };
      const parent = stack[stack.length - 1];
      if (parent) parent.el.children.push(el);
      else if (root) fail('a second root element', start);
      else root = el;
      if (!selfClosing) stack.push({ el, raw: '' });
      i = j;
    }
  }

  const open = stack[stack.length - 1];
  if (open) throw new XmlError(`the element ${open.el.name} opened on line ${open.el.line} is never closed`, open.el.line);
  if (!root) throw new XmlError('no root element on line 1', 1);
  return root;
}
