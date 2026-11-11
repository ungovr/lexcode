import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { bundledRulesDir } from '../../src/rules/load.js';

// The six Ruby rules that find model output sent back in a response share one set of reply sinks
// (#12878). The negative fixtures for those sinks live with the text rule, so this test is what
// makes them guard all six: any drift in one rule's copy fails here. The only differences allowed
// are each rule's own: send_file for the media rules, and the chat-object and model-client
// exclusions for the two rules whose source is that object.

const STEMS = [
  'generates_text/rb-chat-reply-to-response',
  'generates_images/rb-image-reply-to-response',
  'generates_audio/rb-speech-reply-to-response',
  'generates_video/rb-video-reply-to-response',
  'generates_content/rb-genai-to-response',
  'generates_content/rb-langchain-model-to-response',
];

type Rule = { 'pattern-sinks': unknown[]; 'pattern-propagators': unknown[] };

const load = (stem: string): Rule => {
  const doc = parse(readFileSync(join(bundledRulesDir(), `${stem}.yml`), 'utf8')) as { rules: Rule[] };
  return doc.rules[0] as Rule;
};

const OWN = /RubyLLM\.chat|Langchain::/;
const isOwn = (item: unknown): boolean => {
  if (item === null || typeof item !== 'object') return false;
  const entry = item as Record<string, unknown>;
  if (entry['pattern-inside'] === 'send_file(...)') return true;
  const notInside = entry['pattern-not-inside'];
  return typeof notInside === 'string' && OWN.test(notInside);
};

// Drop the rule-specific entries from every list, at any depth.
const shared = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.filter((item) => !isOwn(item)).map(shared);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, shared(v)]));
  }
  return value;
};

describe('Ruby reply sinks', () => {
  const rules = new Map(STEMS.map((stem) => [stem, load(stem)]));
  const text = rules.get(STEMS[0] as string) as Rule;

  it('the six rules share one set of reply sinks', () => {
    for (const stem of STEMS.slice(1)) {
      expect(shared((rules.get(stem) as Rule)['pattern-sinks']), stem).toEqual(shared(text['pattern-sinks']));
    }
  });

  it('every rule lets a record updated with the output carry it', () => {
    for (const stem of STEMS) {
      const patterns = (rules.get(stem) as Rule)['pattern-propagators'].map((p) => (p as { pattern: string }).pattern);
      expect(patterns, stem).toEqual(expect.arrayContaining(['$REC.update(..., $K: $V, ...)', '$REC.update!(..., $K: $V, ...)']));
    }
  });

  it('the shared sinks keep the shapes the text fixtures test', () => {
    const sinks = JSON.stringify(text['pattern-sinks']);
    for (const shape of ['$IV << $RHS', '$IV.$ATTR = $RHS', 'redirect_to(...)', 'head(...)', 'broadcast_remove']) {
      expect(sinks, shape).toContain(shape);
    }
    for (const verb of ['get', 'post', 'put', 'patch', 'delete']) {
      expect(sinks, verb).toContain(`${verb} $PATH, ... do\\n`);
      expect(sinks, verb).toContain(`${verb} $PATH, ... do |...|\\n`);
    }
  });
});
