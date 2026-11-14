// Filler code per fixture extension, shared by scripts/rule-cost.mjs, which times each rule on it,
// and test/unit/taint-sinks.test.ts, which counts each taint rule's sinks in it. Each unit is dense
// in classes, fields, functions and returns and names nothing a rule looks for. Every unit returns
// a local variable (PHP's returns an expression of one), so a sink written as every return in the
// file matches each unit (#13034); the Java, Kotlin and Ruby units held no return before, and the
// script could not see that cost in those languages.

const JAVA = { language: 'java', bare: 'C0', unit: 'class C%N { private int a; private int b; int m() { int x = 1; return x; } }\n' };
const KOTLIN = { language: 'kotlin', bare: 'C0', unit: 'class C%N { private val a: Int = 1; private val b: Int = 2; fun m(): Int { val x = 1; return x } }\n' };
const TYPESCRIPT = { language: 'typescript', bare: 'C0', unit: 'class C%N { a: number = 1; b: number = 2; m(p: number) { const x = p + 1; return x; } }\n' };

export const FILLER = {
  '.java': JAVA,
  '.kt': KOTLIN,
  '.php': { language: 'php', bare: 'f0', unit: 'function f%N($a, $b) { $x = $a + $b; return $x * 2; }\n', head: '<?php\n' },
  '.rb': { language: 'ruby', bare: 'C0', unit: 'class C%N\n  def m(a, b)\n    x = a + b\n    return x\n  end\nend\n' },
  '.py': { language: 'python', bare: 'C0', unit: 'class C%N:\n    a = 1\n    b = 2\n\n    def m(self, p):\n        x = p + 1\n        return x\n\n\n' },
  '.js': { language: 'javascript', bare: 'C0', unit: 'class C%N { constructor() { this.a = 1; this.b = 2; } m(p) { const x = p + 1; return x; } }\n' },
  '.ts': TYPESCRIPT,
  '.tsx': TYPESCRIPT,
  '.go': { language: 'go', bare: 'C0', unit: 'type C%N struct {\n\ta int\n\tb int\n}\n\nfunc (c C%N) M(p int) int {\n\tx := p + 1\n\treturn x\n}\n\n', head: 'package demo\n\n' },
};

/** `head`, then units numbered from 0 until the text reaches `kb` thousand characters. */
export function fill(head, unit, kb) {
  const parts = [head.endsWith('\n') || head === '' ? head : `${head}\n`];
  let n = parts[0].length;
  for (let i = 0; n < kb * 1000; i++) {
    const s = unit.replaceAll('%N', String(i));
    parts.push(s);
    n += s.length;
  }
  return parts.join('');
}
