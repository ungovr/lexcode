import { describe, expect, it } from 'vitest';
import { parsePbxproj, PbxprojError } from '../../src/manifests/pbxproj.js';

describe('parsePbxproj', () => {
  it('parses dictionaries, arrays, quoted and bare strings, and comments', () => {
    const { root } = parsePbxproj('{ a = b; c = ( d, "e f", ); /* x */ g = { h = "i;j"; }; // y\n }');
    expect(root).toEqual({ a: 'b', c: ['d', 'e f'], g: { h: 'i;j' } });
  });

  it('reads the header comment, escapes, data, empty containers and a last array item with no comma', () => {
    const text = [
      '// !$*UTF8*$!',
      '{',
      '\tarchiveVersion = 1;',
      '\ts = "a\\"b\\\\c\\nd";',
      '\tu = "\\U00e9";',
      '\td = <0fbd 777>;',
      '\te = ( );',
      '\tf = { };',
      '\tg = ( x /* X */, y );',
      '\t"quoted key" = $SRCROOT/a-b+c.d;',
      '}',
      '',
    ].join('\n');
    const { root } = parsePbxproj(text);
    expect(root).toEqual({ archiveVersion: '1', s: 'a"b\\c\nd', u: 'é', d: '0fbd777', e: [], f: {}, g: ['x', 'y'], 'quoted key': '$SRCROOT/a-b+c.d' });
  });

  it('a key named __proto__ is an ordinary key', () => {
    const { root } = parsePbxproj('{ __proto__ = { polluted = yes; }; }');
    expect(Object.keys(root)).toEqual(['__proto__']);
    expect(({} as { polluted?: string }).polluted).toBeUndefined();
    expect(Object.getPrototypeOf(root)).toBe(Object.prototype);
  });

  it('lineOf finds a key inside an object', () => {
    const text = [
      '// !$*UTF8*$!',
      '{',
      '\tobjects = {',
      '',
      '/* Begin XCRemoteSwiftPackageReference section */',
      '\t\tAA00 /* XCRemoteSwiftPackageReference "Alamofire" */ = {',
      '\t\t\tisa = XCRemoteSwiftPackageReference;',
      '\t\t\trepositoryURL = "https://github.com/Alamofire/Alamofire.git";',
      '\t\t\trequirement = {',
      '\t\t\t\tkind = upToNextMajorVersion;',
      '\t\t\t\tminimumVersion = 5.0.0;',
      '\t\t\t};',
      '\t\t};',
      '\t\tBB00 = { isa = PBXNativeTarget; name = App; };',
      '/* End XCRemoteSwiftPackageReference section */',
      '\t};',
      '\trootObject = CC00;',
      '}',
    ].join('\n');
    const p = parsePbxproj(text);
    expect(p.lineOf('AA00', 'repositoryURL')).toBe(8);
    expect(p.lineOf('AA00', 'isa')).toBe(7);
    expect(p.lineOf('BB00', 'name')).toBe(14);
    // A key the object lacks falls back to the object's own line; an unknown object to line 1.
    expect(p.lineOf('AA00', 'nothing')).toBe(6);
    expect(p.lineOf('ZZ99', 'isa')).toBe(1);
    expect(p.lineOf('constructor', 'isa')).toBe(1);
  });

  it('a binary or XML plist throws PbxprojError', () => {
    expect(() => parsePbxproj('bplist00Ô\u0001\u0002')).toThrow(PbxprojError);
    expect(() => parsePbxproj('<?xml version="1.0" encoding="UTF-8"?>\n<plist version="1.0"><dict/></plist>')).toThrow(PbxprojError);
    expect(() => parsePbxproj('﻿  <?xml version="1.0"?><plist/>')).toThrow(PbxprojError);
  });

  it('malformed text throws PbxprojError with a line and column, never quoting the text', () => {
    const bad = ['{', '\ta = b;', '\tsecret = "tok123', '}'].join('\n');
    let err: unknown;
    try {
      parsePbxproj(bad);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(PbxprojError);
    const e = err as PbxprojError;
    expect(e.line).toBe(3);
    expect(e.message).not.toContain('tok123');
    for (const t of ['{ a = b }', '{ a = b; ', '{ a b; }', '( a, b )', '{ a = b; } trailing', '{ a = (b c); }', '/* open', '', '{ a = <zz>; }']) {
      expect(() => parsePbxproj(t), t).toThrow(PbxprojError);
    }
  });
  it('nesting past the depth cap throws PbxprojError, never a RangeError', () => {
    const deepArrays = `{ a = ${'('.repeat(20000)}x${')'.repeat(20000)}; }`;
    const deepDicts = `{ ${'a = { '.repeat(10000)}b = c; ${'}; '.repeat(10000)}}`;
    for (const t of [deepArrays, deepDicts]) {
      let err: unknown;
      try {
        parsePbxproj(t);
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(PbxprojError);
      expect((err as PbxprojError).kind).toBe('syntax');
      expect((err as PbxprojError).message).toMatch(/nested too deep/);
    }
  });

  it('nesting under the cap parses', () => {
    const { root } = parsePbxproj(`{ a = ${'('.repeat(200)}x${')'.repeat(200)}; }`);
    let v: unknown = root['a'];
    let depth = 0;
    while (Array.isArray(v)) {
      v = v[0];
      depth++;
    }
    expect([depth, v]).toEqual([200, 'x']);
  });
});
