import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { bundledRulesDir } from '../../src/rules/load.js';

// The Java and the Kotlin rules that find model output sent back in a reply each share one set of reply
// sinks, copied into every rule. The negative fixtures for those sinks live with the text rule, so this
// test is what makes them guard every copy: a shared sink that one copy drops or edits fails here. Each
// rule's designed differences are its own: the media rules add their media sinks; only the text and
// content rules carry the on-screen text sinks (a view's text, a toast, a snackbar, a Compose Text); and
// the Kotlin callback rule, whose output arrives in a callback, has no `return` sink and no
// annotated-function shapes.

interface Family {
  /** The rule whose sinks are the shared set. */
  canonical: string;
  stems: string[];
  /** The rules that carry the on-screen text sinks. */
  textRules: string[];
  /** The on-screen text sinks, as leaves. */
  textSinks: string[];
  /** Per rule, the shared leaves it leaves out by design. */
  missing: Record<string, (leaf: string) => boolean>;
}

/** Every `pattern*` string under a node, as `key: text` with whitespace collapsed. */
function leaves(node: unknown, acc: string[] = []): string[] {
  if (Array.isArray(node)) for (const x of node) leaves(x, acc);
  else if (node !== null && typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (typeof v === 'string' && k.startsWith('pattern')) acc.push(`${k}: ${v.trim().replace(/\s+/g, ' ')}`);
      else leaves(v, acc);
    }
  }
  return acc;
}

type Rule = { mode?: string; 'pattern-sinks': unknown[]; 'pattern-propagators'?: unknown[] };

const load = (stem: string): Rule => {
  const doc = parse(readFileSync(join(bundledRulesDir(), `${stem}.yml`), 'utf8')) as { rules: Rule[] };
  return doc.rules[0] as Rule;
};

const JAVA: Family = {
  canonical: 'generates_text/java-chat-reply-to-response',
  stems: [
    'generates_text/java-chat-reply-to-response',
    'generates_content/java-genai-to-response',
    'generates_content/java-langchain4j-aiservice-to-response',
    'generates_images/java-image-reply-to-response',
    'generates_audio/java-speech-reply-to-response',
    'generates_video/java-video-reply-to-response',
  ],
  textRules: [
    'generates_text/java-chat-reply-to-response',
    'generates_content/java-genai-to-response',
    'generates_content/java-langchain4j-aiservice-to-response',
  ],
  textSinks: ['pattern: $V.setText($X)', 'pattern: Toast.makeText($CTX, $X, ...)', 'pattern: Snackbar.make($V, $X, ...)'],
  missing: {},
};

/** The Kotlin callback rule's output is a callback argument: nothing it finds is returned from a handler. */
const callbackShape = (leaf: string): boolean =>
  leaf === 'pattern: return $X' || leaf.startsWith('pattern-inside: @$A') || leaf.startsWith('pattern-not-inside: { $P');

const KOTLIN: Family = {
  canonical: 'generates_text/kt-chat-reply-to-response',
  stems: [
    'generates_text/kt-chat-reply-to-response',
    'generates_text/kt-chat-callback-reply-to-response',
    'generates_text/kt-chat-framework-reply-to-response',
    'generates_content/kt-genai-to-response',
    'generates_content/kt-langchain4j-aiservice-to-response',
    'generates_images/kt-image-reply-to-response',
    'generates_audio/kt-speech-reply-to-response',
    'generates_video/kt-video-reply-to-response',
  ],
  textRules: [
    'generates_text/kt-chat-reply-to-response',
    'generates_text/kt-chat-callback-reply-to-response',
    'generates_text/kt-chat-framework-reply-to-response',
    'generates_content/kt-genai-to-response',
    'generates_content/kt-langchain4j-aiservice-to-response',
  ],
  textSinks: [
    'pattern: $V.setText($X)',
    'pattern: $V.text = $X',
    'pattern: Toast.makeText($CTX, $X, ...)',
    'pattern: Snackbar.make($V, $X, ...)',
    'pattern: Text(text = $X, ...)',
    'pattern: Text($X, ...)',
  ],
  missing: { 'generates_text/kt-chat-callback-reply-to-response': callbackShape },
};

/** The stems of every taint rule of a language that sends model output back in a reply (not a result returned). */
function replyStems(prefix: string): string[] {
  const out: string[] = [];
  for (const dir of readdirSync(bundledRulesDir()).filter((d) => d.startsWith('generates_'))) {
    for (const f of readdirSync(join(bundledRulesDir(), dir))) {
      if (!f.startsWith(prefix) || !f.endsWith('.yml') || f.includes('.test.') || f.includes('result-returned')) continue;
      if (load(`${dir}/${f.slice(0, -4)}`).mode === 'taint') out.push(`${dir}/${f.slice(0, -4)}`);
    }
  }
  return out.sort();
}

for (const [language, prefix, fam] of [
  ['Java', 'java-', JAVA],
  ['Kotlin', 'kt-', KOTLIN],
] as const) {
  describe(`${language} reply sinks`, () => {
    const sinks = new Map(fam.stems.map((stem) => [stem, new Set(leaves(load(stem)['pattern-sinks']))]));
    const canonical = sinks.get(fam.canonical) as Set<string>;
    const shared = [...canonical].filter((l) => !fam.textSinks.includes(l));

    it(`the list names every ${language} reply rule (${fam.stems.length} of them)`, () => {
      expect(replyStems(prefix)).toEqual([...fam.stems].sort());
    });

    it('every rule carries every shared sink, apart from its own designed absences', () => {
      for (const stem of fam.stems) {
        const own = sinks.get(stem) as Set<string>;
        const skip = fam.missing[stem] ?? ((): boolean => false);
        const lost = shared.filter((l) => !skip(l) && !own.has(l));
        expect(lost, stem).toEqual([]);
      }
    });

    it('a designed absence is absent, so it stays a decision and not an accident', () => {
      for (const [stem, skip] of Object.entries(fam.missing)) {
        const own = sinks.get(stem) as Set<string>;
        expect(shared.filter(skip).length, stem).toBeGreaterThan(0);
        expect(shared.filter((l) => skip(l) && own.has(l)), stem).toEqual([]);
      }
    });

    it('the on-screen text sinks are in the text and content rules, and only there', () => {
      for (const l of fam.textSinks) expect(canonical.has(l), l).toBe(true);
      for (const stem of fam.stems) {
        const own = sinks.get(stem) as Set<string>;
        const has = fam.textSinks.filter((l) => own.has(l));
        expect(has, stem).toEqual(fam.textRules.includes(stem) ? fam.textSinks : []);
      }
    });

    it('a sink in more than one rule is a shared sink: an addition to several copies goes in all of them', () => {
      const count = new Map<string, number>();
      for (const s of sinks.values()) for (const l of s) count.set(l, (count.get(l) ?? 0) + 1);
      const strays = [...count.entries()].filter(([l, n]) => n > 1 && !canonical.has(l)).map(([l]) => l);
      expect(strays).toEqual([]);
    });
  });
}
