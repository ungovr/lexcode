import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { bundledRulesDir, loadRuleSet } from '../src/rules/load.js';
import { validateRuleFiles } from '../src/rules/validate.js';
import type { RuleMeta } from '../src/types.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const rulesDir = bundledRulesDir();

interface Snapshot {
  version: string;
  activities: { id: string }[];
  held: { id: string }[];
}
const snapshot = JSON.parse(readFileSync(join(rulesDir, 'registry.snapshot.json'), 'utf8')) as Snapshot;
const snapshotIds = [...snapshot.activities, ...snapshot.held].map((a) => a.id);

/** Evidence-class ids with no evidence-strength rule that satisfies `accept`. */
function evidenceIdsWithoutRule(accept: (r: RuleMeta) => boolean): string[] {
  const rs = loadRuleSet();
  const uncovered: string[] = [];
  for (const [id, cls] of rs.classes) {
    if (cls !== 'evidence') continue;
    if (!rs.rules.some((r) => r.activity === id && r.strength === 'evidence' && accept(r))) uncovered.push(id);
  }
  return uncovered;
}

/** Every `pattern-regex` string in a parsed rule file, however deep. */
function patternRegexes(node: unknown): string[] {
  if (Array.isArray(node)) return node.flatMap(patternRegexes);
  if (node === null || typeof node !== 'object') return [];
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
    k === 'pattern-regex' && typeof v === 'string' ? [v] : patternRegexes(v),
  );
}

/** Why a whole-file lookahead pre-filter would lose matches in a large file, or null when it is fine or not one. */
function wholeFileLookaheadProblem(rx: string): string | null {
  const start = rx.search(/\\A\(\?=/);
  if (start === -1) return null;
  const lookaheads = rx.split('(?=').length - 1;
  if (lookaheads > 1) return 'second lookahead';
  // Walk the lookahead to its closing parenthesis, ignoring escapes and character classes. An alternation
  // at the lookahead's own level is always the failing shape (`(?=.*A|.*B)`). One inside a group fails only
  // when it comes before the lookahead's first literal (`(?=.*(A|B))`): the engine then tries every
  // alternative at every position of the file. After a leading literal (`(?=.*?Mechanize(?:\s|#)*\.new)`)
  // it runs only where the literal matched, which held to 940 KB on opengrep 1.33.1.
  let depth = 1;
  let inClass = false;
  let seenLiteral = false;
  for (let i = start + '\\A(?='.length; i < rx.length; i++) {
    const ch = rx[i] as string;
    if (ch === '\\') {
      const next = rx[i + 1] ?? '';
      if (depth === 1 && !/[sSwWdDbBAzZ]/.test(next)) seenLiteral = true;
      i++;
      continue;
    }
    if (inClass) {
      if (ch === ']') inClass = false;
      continue;
    }
    if (ch === '[') inClass = true;
    else if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return null;
    } else if (ch === '|' && (depth === 1 || !seenLiteral)) return 'alternation';
    else if (depth === 1 && !'.*+?{}^$'.includes(ch) && !/[\d,]/.test(ch)) seenLiteral = true;
  }
  return null;
}

describe('release: the rule set is complete and well formed', () => {
  it('every snapshot id has a class', () => {
    const classes = parse(readFileSync(join(rulesDir, 'classes.yml'), 'utf8')) as Record<string, string>;
    const keys = Object.keys(classes);
    expect(snapshotIds.filter((id) => !keys.includes(id))).toEqual([]);
    expect(keys.filter((k) => !snapshotIds.includes(k))).toEqual([]);
    for (const v of Object.values(classes)) {
      expect(['evidence', 'signal', 'declaration-only']).toContain(v);
    }
  });

  it('the ruleset pins the snapshot version', () => {
    const rs = loadRuleSet();
    expect(rs.registryVersion).toBe(snapshot.version);
  });

  it('every rule carries its metadata', () => {
    expect(validateRuleFiles(rulesDir, loadRuleSet()).filter((p) => !p.startsWith('[fixtures]'))).toEqual([]);
  });

  it('every rule has fixtures', () => {
    expect(validateRuleFiles(rulesDir, loadRuleSet()).filter((p) => p.startsWith('[fixtures]'))).toEqual([]);
  });

  // The publish gate (design 6.13): every evidence-class id has at least one
  // evidence-strength source rule, and the fixture tests above hold each rule
  // to a positive and a negative fixture. A component-map entry is not a rule
  // and does not count.
  it('evidence class is covered (the v1 publish gate)', () => {
    expect(evidenceIdsWithoutRule(() => true)).toEqual([]);
  });

  // The per-language gate (v1.1): Ruby joins the languages lexcode reads, so
  // every evidence-class id also has a Ruby rule at evidence strength. The next
  // language adds one line like this.
  it('every evidence-class id has a Ruby rule', () => {
    expect(evidenceIdsWithoutRule((r) => r.languages.includes('ruby'))).toEqual([]);
  });

  // Java and Kotlin (v1.2, Decision 14). The one Java exemption is
  // distributes_software_product, whose JVM evidence lives in build files: it
  // is met by a maven- or gradle- rule instead of a Java source rule. Kotlin has
  // no exemption (the gradle-kts- rules read as Kotlin).
  it('every evidence-class id has a Java rule', () => {
    const buildFileRule = (r: RuleMeta): boolean => /^(?:maven|gradle)-/.test(basename(r.file));
    expect(
      evidenceIdsWithoutRule(
        (r) => r.languages.includes('java') || (r.activity === 'distributes_software_product' && buildFileRule(r)),
      ),
    ).toEqual([]);
  });

  it('every evidence-class id has a Kotlin rule', () => {
    expect(evidenceIdsWithoutRule((r) => r.languages.includes('kotlin'))).toEqual([]);
  });

  // The engine's `paths` excludes are unanchored globs, so `**/samples/**`
  // also drops a JVM package path (com/google/samples/apps/..., org/springframework/
  // samples/petclinic, every com/example package). A Java or Kotlin source rule
  // therefore carries none of them; build-file and config rules name real
  // directories and keep theirs.
  it('no Java or Kotlin source rule excludes a sample, example or demo path', () => {
    const hits: string[] = [];
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) walk(p);
        else if (/^(java|kt)-.*\.yml$/.test(e) && !/\.test\.yml$/.test(e)) {
          const doc = parse(readFileSync(p, 'utf8')) as { rules?: { id: string; paths?: { exclude?: string[] } }[] };
          for (const rule of doc.rules ?? []) {
            for (const glob of rule.paths?.exclude ?? []) {
              if (/\/(samples?|examples?|demos?)\//.test(glob)) hits.push(`${rule.id}: ${glob}`);
            }
          }
        }
      }
    };
    walk(rulesDir);
    expect(hits).toEqual([]);
  });

  // Build-file and config rules name real directories, so they keep these
  // excludes, but a singular without its plural (or the reverse) is a slip: the
  // gradle-kts- rules once had `sample` and not `samples`.
  it('a rule that excludes a sample, example or demo directory excludes the plural and the singular alike', () => {
    const hits: string[] = [];
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) walk(p);
        else if (e.endsWith('.yml') && !e.endsWith('.test.yml') && !/^(java|kt)-/.test(e)) {
          const doc = parse(readFileSync(p, 'utf8')) as { rules?: { id: string; paths?: { exclude?: string[] } }[] };
          for (const rule of doc?.rules ?? []) {
            const ex = new Set(rule.paths?.exclude ?? []);
            for (const word of ['sample', 'example', 'demo']) {
              if (ex.has(`**/${word}/**`) !== ex.has(`**/${word}s/**`)) hits.push(`${rule.id}: ${word}/${word}s`);
            }
          }
        }
      }
    };
    walk(rulesDir);
    expect(hits).toEqual([]);
  });

  // A whole-file pre-filter is a `pattern-regex` of the form (?s)\A(?=.*LITERAL).* whose range is the whole
  // file, so the engine can skip a file without LITERAL. With more than one alternative in the lookahead, or
  // two lookaheads, the engine's regex silently stops matching in a large file (measured on opengrep 1.33.1:
  // post-model and direct-message from 160 KB, analytics-calls from 120 KB; one literal held to 950 KB)
  // and the rule loses real matches with no error recorded. One literal per pattern-regex, joined with
  // a `pattern-either` for "any of these".
  it('no whole-file pre-filter lookahead holds an alternation or a second lookahead', () => {
    const bad: string[] = [];
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) walk(p);
        else if (e.endsWith('.yml') && !e.endsWith('.test.yml')) {
          const doc = parse(readFileSync(p, 'utf8')) as unknown;
          for (const rx of patternRegexes(doc)) {
            const why = wholeFileLookaheadProblem(rx);
            if (why) bad.push(`${e}: ${why}: ${rx}`);
          }
        }
      }
    };
    walk(rulesDir);
    expect(bad).toEqual([]);
  });

  it('the pre-filter guard sees the shapes it exists for, and passes the one-literal form', () => {
    expect(wholeFileLookaheadProblem('(?s)\\A(?=.*(Post|Tweet)).*')).toMatch(/alternation/);
    expect(wholeFileLookaheadProblem('(?s)\\A(?=[\\s\\S]*?(?:A|B))[\\s\\S]*')).toMatch(/alternation/);
    expect(wholeFileLookaheadProblem('(?is)\\A(?=.*a)(?=.*b).*')).toMatch(/second lookahead/);
    expect(wholeFileLookaheadProblem('(?s)\\A(?=.*Post\\b).*')).toBeNull();
    expect(wholeFileLookaheadProblem('(?s)\\A(?=.*com\\.openai\\.).*')).toBeNull();
    // An alternation in an ordinary (not whole-file) regex is fine.
    expect(wholeFileLookaheadProblem('\\b(find|exists)By(Follower|Followee)\\b')).toBeNull();
    // An escaped bar, and a bar inside a character class, are not alternations.
    expect(wholeFileLookaheadProblem('(?s)\\A(?=.*a\\|b).*')).toBeNull();
    expect(wholeFileLookaheadProblem('(?s)\\A(?=.*[|]x).*')).toBeNull();
    // An alternation at the lookahead's own level fails even after a literal; one in a group after the
    // lookahead's first literal runs only where that literal matched, and passes.
    expect(wholeFileLookaheadProblem('(?s)\\A(?=.*Post|.*Tweet).*')).toMatch(/alternation/);
    expect(wholeFileLookaheadProblem('(?s)\\A(?=.*?(?:Post|Tweet)Model).*')).toMatch(/alternation/);
    expect(wholeFileLookaheadProblem('(?s)\\A(?=.*?Mechanize(?:\\s|#)*\\.(?:new|start)).*')).toBeNull();
    expect(wholeFileLookaheadProblem('(?s)\\A(?=.*com\\.(?:openai|anthropic)).*')).toBeNull();
    expect(wholeFileLookaheadProblem('(?s)\\A(?=.*\\b(?:A|B)).*')).toMatch(/alternation/);
  });

  it('contributing forbids the three rule sets', () => {
    const text = readFileSync(join(root, 'CONTRIBUTING.md'), 'utf8');
    for (const phrase of ['semgrep-rules', 'opengrep-rules', 'privado-rules', 'Commons Clause']) {
      expect(text).toContain(phrase);
    }
  });

  it('copy rules', () => {
    const files: string[] = [];
    const walk = (p: string): void => {
      if (!existsSync(p)) return;
      if (statSync(p).isDirectory()) {
        for (const e of readdirSync(p)) if (e !== 'node_modules') walk(join(p, e));
      } else files.push(p);
    };
    for (const p of ['src', 'rules', 'docs', 'README.md', 'RELEASING.md']) walk(join(root, p));
    const emDash = String.fromCharCode(0x2014);
    const banned = [/\bhonest(ly|y)?\b/i, /complian(t|ce)/i];
    const hits: string[] = [];
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      if (text.includes(emDash)) hits.push(`${f}: em dash`);
      for (const re of banned) if (re.test(text)) hits.push(`${f}: ${re}`);
    }
    expect(hits).toEqual([]);
  });
});
