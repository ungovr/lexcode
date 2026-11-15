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
    expect(rustTestRanges(text)).toEqual([
      [1, 7],
      [9, 10],
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

  it('cfg(not(test)) and cfg(test) on a fn are not modules', () => {
    const text = file([
      '#[cfg(not(test))]',
      'mod real {',
      '    fn x() {}',
      '}',
      '#[cfg(test)]',
      'fn only_in_tests() {}',
      '#[cfg(test)]',
      'use std::collections::HashMap;',
      '#[cfg(any(test, feature = "x"))]',
      'mod either {}',
      '#[cfg(test)]',
      'impl Foo { fn y() {} }',
    ]);
    expect(rustTestRanges(text)).toEqual([]);
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

  it('keeps every match in a .rs file it cannot read', () => {
    expect(dropRustTestMatches([m('gone.rs', 4)], () => undefined)).toEqual([m('gone.rs', 4)]);
  });
});
