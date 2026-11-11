import { describe, expect, it } from 'vitest';
import { parseXml, XmlError } from '../../src/manifests/xml.js';

describe('parseXml', () => {
  it('reads nested elements, text and line numbers', () => {
    const root = parseXml(['<a>', '  <b>one</b>', '  <c>', '    <d>two</d>', '  </c>', '</a>'].join('\n'));
    expect(root.name).toBe('a');
    expect(root.line).toBe(1);
    expect(root.children.map((c) => [c.name, c.line, c.text])).toEqual([
      ['b', 2, 'one'],
      ['c', 3, ''],
    ]);
    expect(root.children[1]?.children[0]).toMatchObject({ name: 'd', line: 4, text: 'two' });
  });

  it('skips comments, the xml declaration and other processing instructions', () => {
    const root = parseXml(
      ['<?xml version="1.0" encoding="UTF-8"?>', '<!-- a <fake>tag</fake> -->', '<?pi target?>', '<a><!-- <x> --><b>1</b></a>'].join('\n'),
    );
    expect(root.name).toBe('a');
    expect(root.children.map((c) => c.name)).toEqual(['b']);
    expect(root.children[0]?.line).toBe(4);
  });

  it('reads CDATA as literal text', () => {
    const root = parseXml('<a><b><![CDATA[x < y && <z>]]></b></a>');
    expect(root.children[0]?.text).toBe('x < y && <z>');
  });

  it('reads self-closing tags and attributes', () => {
    const root = parseXml('<a x="1" y=\'two > three\'><b/><c k="v" /></a>');
    expect(root.attrs).toEqual({ x: '1', y: 'two > three' });
    expect(root.children.map((c) => c.name)).toEqual(['b', 'c']);
    expect(root.children[1]?.attrs).toEqual({ k: 'v' });
    expect(root.children[0]?.text).toBe('');
  });

  it('decodes the five XML entities and numeric references', () => {
    const root = parseXml('<a v="&quot;q&quot;"><b>a &amp; b &lt;c&gt; &apos;d&apos; &#65;&#x42;</b></a>');
    expect(root.attrs['v']).toBe('"q"');
    expect(root.children[0]?.text).toBe("a & b <c> 'd' AB");
  });

  it('keeps an unknown entity as written and does not expand a DOCTYPE entity', () => {
    const root = parseXml('<!DOCTYPE a [<!ENTITY e "boom">]>\n<a><b>&e; &nbsp;</b></a>');
    expect(root.children[0]?.text).toBe('&e; &nbsp;');
    expect(root.children[0]?.line).toBe(2);
  });

  it('ignores a byte order mark', () => {
    expect(parseXml('﻿<a><b>1</b></a>').children).toHaveLength(1);
  });

  it('throws an XmlError naming the line of an unclosed element', () => {
    let err: unknown;
    try {
      parseXml(['<a>', '  <b>', '    <c>1</c>', '</a>'].join('\n'));
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(XmlError);
    expect((err as XmlError).line).toBe(2);
    expect((err as XmlError).message).toContain('line 2');
  });

  it('an error message names a line and never quotes the document', () => {
    const token = 'AKIAIOSFODNN7EXAMPLE';
    for (const doc of [`<a>\n<${token}`, `<a>\n<b ${token}="`, `<a>\n<b ${token}=x>`, `<a>\n<${token}>\n</a>`, `<${token}>\n<b>\n</${token}>`, `<a>\n<b ${token}`]) {
      let err: unknown;
      try {
        parseXml(doc);
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(XmlError);
      expect((err as XmlError).message).not.toContain(token);
      expect((err as XmlError).message).toMatch(/line \d+/);
    }
  });

  it('throws on a closing tag that does not match, an unterminated comment and an empty document', () => {
    expect(() => parseXml('<a>\n</b>')).toThrow(XmlError);
    expect(() => parseXml('<a><!-- never closed </a>')).toThrow(XmlError);
    expect(() => parseXml('')).toThrow(XmlError);
    expect(() => parseXml('<a/><b/>')).toThrow(XmlError);
    expect(() => parseXml('plain text')).toThrow(XmlError);
  });
});
