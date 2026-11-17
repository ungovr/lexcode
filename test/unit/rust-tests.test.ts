import { describe, expect, it } from 'vitest';
import { dropRustTestMatches, rustTestRanges } from '../../src/scope/rust-tests.js';
import type { EngineMatch } from '../../src/types.js';

/** A file from its lines, one per array entry, joined with newlines and ending in one. */
const file = (lines: string[]): string => `${lines.join('\n')}\n`;

describe('rustTestRanges', () => {
  it('finds a cfg(test) module', () => {
    const text = file([
      'use reqwest;', // 1
      '',
      'fn main() {',
      '    let _ = reqwest::get("https://a.example.com");',
      '}',
      '',
      'fn helper() -> u32 {',
      '    1',
      '}',
      '#[cfg(test)]', // 10
      'mod tests {',
      '    #[test]',
      '    fn t() { assert_eq!(super::helper(), 1); }',
      '}', // 14
      '',
      'fn after() {}',
    ]);
    expect(rustTestRanges(text)).toEqual([[10, 14]]);
  });

  it('attributes and comments between', () => {
    const text = file([
      '#[cfg(test)]', // 1
      '#[allow(unused)]',
      '// note',
      '/* a block */ /// a doc comment',
      'pub(crate) mod t {',
      '    fn x() {}',
      '}', // 7
      '#[allow(dead_code)]', // 8
      '#[cfg(test)]', // 9
      'pub mod u { fn y() {} }', // 10
      '#[cfg(test)] // trailing', // 11
      'pub(in crate::a) mod v {', // 12
      '}', // 13
    ]);
    // The range starts at the module's first attribute, here the #[allow(dead_code)] on line 8.
    expect(rustTestRanges(text)).toEqual([
      [1, 7],
      [8, 10],
      [11, 13],
    ]);
  });

  it('braces in strings, raw strings, chars and comments do not count', () => {
    const text = file([
      '#[cfg(test)]', // 1
      'mod tests {',
      '    const A: &str = "}";',
      '    const B: &str = r#"}"#;',
      '    const C: &[u8] = b"}";',
      "    const D: char = '}';",
      "    const E: char = '\\u{7d}';",
      "    fn lt<'a>(x: &'a str) -> &'a str { x }",
      '    // }',
      '    /* } /* } */ */',
      '    const F: &str = r##"a "# } "##;',
      '    const G: &[u8] = br#"}"#;',
      '    const H: &str = "\\"}";',
      "    const I: u8 = b'}';",
      "    const J: char = '\\'';",
      '    const K: &str = r"C:\\";',
      '    const L: &str = "{";',
      "    'outer: loop { break 'outer; }",
      '    #[test]',
      '    fn t() { let _ = reqwest::get("https://d"); }',
      '}', // 21
      '',
      'fn main() { let _ = reqwest::get("https://e"); }', // 23
    ]);
    expect(rustTestRanges(text)).toEqual([[1, 21]]);
  });

  it('cfg(not(test)) and cfg(any(test, ...)) modules are code', () => {
    const text = file([
      '#[cfg(not(test))]',
      'mod real {',
      '    fn x() {}',
      '}',
      '#[cfg(any(test, feature = "x"))]',
      'mod either {}',
      '#[cfg(any(test, not(test)))]',
      'mod always {}',
      '#[cfg(feature = "test")]',
      'mod named_test {}',
      '#[cfg(all())]',
      'mod empty_all {}',
    ]);
    expect(rustTestRanges(text)).toEqual([]);
  });

  it('cfg(test) on an item that is not a module is not a range', () => {
    const text = file([
      '#[cfg(test)]',
      'fn only_in_tests() {}',
      '#[cfg(test)]',
      'use std::collections::HashMap;',
      '#[cfg(test)]',
      'impl Foo { fn y() {} }',
    ]);
    expect(rustTestRanges(text)).toEqual([]);
  });

  it('a cfg that holds only in test builds is a test module: all(test, ...), not(not(test)), any(test, test)', () => {
    const text = file([
      '#[cfg(all(test, feature = "full"))]', // 1
      'mod a {}',
      '#[cfg(all(unix, any(test, all(test, debug_assertions))))]', // 3
      'mod b {}',
      '#[cfg(not(not(test)))]', // 5
      'mod c {}',
      '#[cfg(any(test, test))]', // 7
      'mod d {}',
      '#[cfg(all(test, not(feature = "x"),))]', // 9, a trailing comma
      'mod e {}',
      '#[cfg(any())]', // 11, never built: not a test module
      'mod never {}',
    ]);
    expect(rustTestRanges(text)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8],
      [9, 10],
    ]);
  });

  it('a file-level #![cfg(test)] makes the whole file a range', () => {
    const text = file(['//! Checks the schema.', '#![cfg(test)]', '#![allow(clippy::all)]', '', 'fn x() { go(); }']);
    expect(rustTestRanges(text)).toEqual([[1, 5]]);
    expect(rustTestRanges(file(['#![cfg(all(test, feature = "full"))]', 'fn x() {}']))).toEqual([[1, 2]]);
    // A shebang line is not an attribute, and a file-level cfg that is not test-only is code.
    expect(rustTestRanges(file(['#!/usr/bin/env rust-script', 'fn x() {}']))).toEqual([]);
    expect(rustTestRanges(file(['#![cfg(any(test, feature = "x"))]', 'fn x() {}']))).toEqual([]);
    expect(rustTestRanges(file(['#![cfg(not(test))]', 'fn x() {}']))).toEqual([]);
  });

  it('an inner #![cfg(test)] at the top of a module body makes the module a range', () => {
    const text = file([
      'fn main() {}', // 1
      'mod helpers {', // 2
      '    #![cfg(test)]',
      '    fn h() {}',
      '}', // 5
      'mod code {',
      '    #![allow(unused)]',
      '    fn c() {}',
      '}',
      'fn f() {',
      '    #![cfg(test)]', // an inner attribute on a function is not a module
      '}',
    ]);
    expect(rustTestRanges(text)).toEqual([[2, 5]]);
  });

  it('a module whose name is not ASCII is found', () => {
    const text = file(['#[cfg(test)]', 'mod prüfungen {', '    fn t() {}', '}', '#[cfg(test)]', 'mod 測試 {}', '#[cfg(test)]', 'mod t𝔸 {}']);
    expect(rustTestRanges(text)).toEqual([
      [1, 4],
      [5, 6],
      [7, 8],
    ]);
  });

  it('code on the attribute line before the module, or on the closing line after it, is not in the range', () => {
    const text = file([
      'fn a() { go(); } #[cfg(test)]', // 1: code before the attribute
      'mod tests {', // 2
      '    fn t() { go(); }',
      '} fn b() { go(); }', // 4: code after the closing brace
      '/* note */ #[cfg(test)] mod u { fn t() { go(); } } // after', // 5: only comments around
      '#[allow(unused)] #[cfg(test)]', // 6: the module's own attributes
      'mod v {',
      '}', // 8
      'fn c() { go(); } #[cfg(test)] mod w { fn t() { go(); } } fn d() { go(); }', // 9: all on one line
    ]);
    expect(rustTestRanges(text)).toEqual([
      [2, 3],
      [5, 5],
      [6, 8],
    ]);
  });

  it('mod tests; is not a range', () => {
    const text = file(['fn main() {}', '#[cfg(test)]', 'mod tests;', 'fn after() {}']);
    expect(rustTestRanges(text)).toEqual([]);
  });

  it('an unterminated module runs to the end of the file', () => {
    expect(rustTestRanges(file(['fn main() {}', '#[cfg(test)]', 'mod tests {', '    fn t() {', '    }']))).toEqual([[2, 5]]);
    // With no newline at the end, the last line is still the last line of text.
    expect(rustTestRanges('#[cfg(test)]\nmod tests {\n    fn t() {}')).toEqual([[1, 3]]);
  });

  it('a cfg(test) module nested in another module is found, and one nested in a test module is not counted twice', () => {
    const text = file([
      'mod outer {', // 1
      '    #[cfg(test)]', // 2
      '    mod tests {',
      '        #[cfg(test)]',
      '        mod deeper {}',
      '    }', // 6
      '}',
      'r#mod::x();', // a raw identifier is not a raw string
      '#[cfg(test)]', // 9
      'mod again {}', // 9..10
      '#[cfg(test)] mod r#try { }', // 11, a raw identifier as the name
    ]);
    expect(rustTestRanges(text)).toEqual([
      [2, 6],
      [9, 10],
      [11, 11],
    ]);
  });

  it('a file with no module gives no range', () => {
    expect(rustTestRanges('')).toEqual([]);
    expect(rustTestRanges('fn main() {}\n')).toEqual([]);
  });
});

describe('dropRustTestMatches', () => {
  const m = (path: string, line: number): EngineMatch => ({ ruleId: 'r', path, line, metavars: {}, lines: '' });
  const rs = file(['fn main() { go(); }', '#[cfg(test)]', 'mod tests {', '    fn t() { go(); }', '}', 'fn z() { go(); }']);

  it('drops matches inside a test module of a .rs file, keeps the rest, and reads each .rs file once', () => {
    const reads: string[] = [];
    const read = (p: string): string | undefined => {
      reads.push(p);
      return p === 'src/main.rs' || p === 'src/lib.rs' ? rs : undefined;
    };
    const kept = dropRustTestMatches(
      [m('src/main.rs', 1), m('src/main.rs', 4), m('src/main.rs', 2), m('src/main.rs', 6), m('src/lib.rs', 4), m('app.py', 4), m('web/App.vue', 4)],
      read,
    );
    expect(kept).toEqual([m('src/main.rs', 1), m('src/main.rs', 6), m('app.py', 4), m('web/App.vue', 4)]);
    expect(reads).toEqual(['src/main.rs', 'src/lib.rs']);
  });

  it('drops every match in a file whose own first lines say #![cfg(test)]', () => {
    const files: Record<string, string> = { 'src/schema/diff_check.rs': file(['#![cfg(test)]', 'fn t() { go(); }']), 'src/schema/mod.rs': file(['mod diff_check;']) };
    expect(dropRustTestMatches([m('src/schema/diff_check.rs', 2), m('src/schema/mod.rs', 1)], (p) => files[p])).toEqual([m('src/schema/mod.rs', 1)]);
  });

  describe('a module declared #[cfg(test)] mod name; in another file', () => {
    /** Every match in each named file, one per line, through a reader over `files` that records its reads. */
    const run = (files: Record<string, string>, matched: string[]): { kept: string[]; reads: string[] } => {
      const reads: string[] = [];
      const read = (p: string): string | undefined => {
        reads.push(p);
        return files[p];
      };
      const all = matched.map((p) => m(p, 1));
      return { kept: dropRustTestMatches(all, read).map((x) => x.path), reads };
    };

    it('drops the module file beside a lib.rs, main.rs or mod.rs that declares it, and its submodules', () => {
      const files = {
        'crates/post/src/lib.rs': file(['use serde::Serialize;', '#[cfg(test)]', 'mod db_perf;', '#[cfg(test)]', 'mod test;', 'pub mod api;']),
        'crates/post/src/test.rs': file(['fn t() { go(); }']),
        'crates/post/src/api.rs': file(['fn a() { go(); }']),
        'crates/post/src/db_perf/mod.rs': file(['mod series;', 'fn p() { go(); }']),
        'crates/post/src/db_perf/series.rs': file(['fn s() { go(); }']),
        'src/bin/main.rs': file(['#[cfg(test)]', 'mod tests;', 'fn main() { go(); }']),
        'src/bin/tests.rs': file(['fn t() { go(); }']),
        'src/site/apps/mod.rs': file(['pub mod approve;', '#[cfg(test)]', 'mod tests;']),
        'src/site/apps/tests.rs': file(['fn t() { go(); }']),
        'src/site/apps/approve.rs': file(['fn a() { go(); }']),
      };
      const { kept } = run(files, Object.keys(files));
      expect(kept).toEqual(['crates/post/src/lib.rs', 'crates/post/src/api.rs', 'src/bin/main.rs', 'src/site/apps/mod.rs', 'src/site/apps/approve.rs']);
    });

    it('drops the module file of a non-mod.rs parent (src/a.rs declares src/a/tests.rs), and a tests/mod.rs', () => {
      const files = {
        'src/a.rs': file(['#[cfg(test)]', 'mod tests;', 'mod inner;']),
        'src/a/tests.rs': file(['fn t() { go(); }']),
        'src/a/inner.rs': file(['fn i() { go(); }']),
        'src/b.rs': file(['#[cfg(all(test, feature = "db"))]', 'mod tests;']),
        'src/b/tests/mod.rs': file(['fn t() { go(); }']),
      };
      expect(run(files, ['src/a/tests.rs', 'src/a/inner.rs', 'src/b/tests/mod.rs']).kept).toEqual(['src/a/inner.rs']);
    });

    it('drops a module file declared inside an inline test module or an inline module of the parent', () => {
      const files = {
        'src/lib.rs': file(['#[cfg(test)]', 'mod support {', '    pub mod fixtures;', '}', 'mod net {', '    #[cfg(test)]', '    mod mock;', '    pub mod real;', '}']),
        'src/support/fixtures.rs': file(['fn f() { go(); }']),
        'src/net/mock.rs': file(['fn f() { go(); }']),
        'src/net/real.rs': file(['fn f() { go(); }']),
      };
      expect(run(files, ['src/support/fixtures.rs', 'src/net/mock.rs', 'src/net/real.rs']).kept).toEqual(['src/net/real.rs']);
    });

    it('keeps a module file declared without a test cfg, declared only under cfg(any(test, ...)), or declared by no file it can read', () => {
      const files = {
        'src/lib.rs': file(['mod tests;', '#[cfg(any(test, feature = "x"))]', 'mod either;', '#[cfg(not(test))]', 'mod real;']),
        'src/tests.rs': file(['fn t() { go(); }']),
        'src/either.rs': file(['fn e() { go(); }']),
        'src/real.rs': file(['fn r() { go(); }']),
        'src/orphan/tests.rs': file(['fn o() { go(); }']),
      };
      expect(run(files, ['src/tests.rs', 'src/either.rs', 'src/real.rs', 'src/orphan/tests.rs']).kept).toEqual(['src/tests.rs', 'src/either.rs', 'src/real.rs', 'src/orphan/tests.rs']);
    });

    it('keeps a module file that one parent declares as a test and another as code', () => {
      const files = {
        'src/lib.rs': file(['#[cfg(test)]', 'mod util;']),
        'src/main.rs': file(['mod util;']),
        'src/util.rs': file(['fn u() { go(); }']),
      };
      expect(run(files, ['src/util.rs']).kept).toEqual(['src/util.rs']);
    });

    it('does not follow a #[path] attribute, a declaration in a function body or a declaration in a comment or string', () => {
      const files = {
        'src/lib.rs': file(['#[cfg(test)]', '#[path = "other.rs"]', 'mod tests;', 'fn f() {', '    #[cfg(test)]', '    mod inner;', '}', '// #[cfg(test)] mod quoted;', 'const S: &str = "#[cfg(test)] mod quoted;";']),
        'src/tests.rs': file(['fn t() { go(); }']),
        'src/inner.rs': file(['fn i() { go(); }']),
        'src/quoted.rs': file(['fn q() { go(); }']),
      };
      expect(run(files, ['src/tests.rs', 'src/inner.rs', 'src/quoted.rs']).kept).toEqual(['src/tests.rs', 'src/inner.rs', 'src/quoted.rs']);
    });

    it('reads each file once and follows a declaring chain to its end', () => {
      const files = {
        'src/lib.rs': file(['#[cfg(test)]', 'mod a;']),
        'src/a/mod.rs': file(['mod b;']),
        'src/a/b/mod.rs': file(['mod c;']),
        'src/a/b/c.rs': file(['fn c() { go(); }']),
        // y is declared by x, which no file declares: both are code.
        'src/x/mod.rs': file(['mod y;']),
        'src/x/y/mod.rs': file(['fn y() { go(); }']),
      };
      const { kept, reads } = run(files, ['src/a/b/c.rs', 'src/a/b/c.rs', 'src/x/y/mod.rs']);
      expect(kept).toEqual(['src/x/y/mod.rs']);
      expect(new Set(reads).size).toBe(reads.length);
    });

    it('never looks for a parent of a lib.rs, main.rs or build.rs', () => {
      const { kept, reads } = run({ 'src/lib.rs': file(['fn l() { go(); }']), 'build.rs': file(['fn main() { go(); }']) }, ['src/lib.rs', 'build.rs']);
      expect(kept).toEqual(['src/lib.rs', 'build.rs']);
      expect(reads).toEqual(['src/lib.rs', 'build.rs']);
    });
  });

  it('keeps every match in a .rs file it cannot read', () => {
    expect(dropRustTestMatches([m('gone.rs', 4)], () => undefined)).toEqual([m('gone.rs', 4)]);
  });
});
