import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { bundledRulesDir } from '../../src/rules/load.js';

// The C# rules that follow model output, or a model client, to a response share one set of sinks and
// propagators, copied into every rule (#13207). Five evidence rules (a generating call's result reaches
// a response) carry the text rule's sinks verbatim; four signal rules (a client from a factory or the
// container reaches a response) carry the same sinks with one designed difference: the Blazor
// component-state sink adds a metavariable-regex that drops the wiring of the client itself into a
// field. A hand edit to one copy fails here, so the negative sink fixtures beside each rule guard
// every copy. A new C# reply or client rule has to join a list below.

const EVIDENCE_CANONICAL = 'generates_text/cs-chat-reply-to-response';
const SIGNAL_CANONICAL = 'generates_text/cs-chat-client-to-response';

const EVIDENCE = [
  'generates_text/cs-chat-reply-to-response',
  'generates_images/cs-image-reply-to-response',
  'generates_audio/cs-speech-reply-to-response',
  'generates_video/cs-video-reply-to-response',
  'generates_content/cs-genai-to-response',
];

const SIGNAL = [
  'generates_text/cs-chat-client-to-response',
  'generates_images/cs-image-client-to-response',
  'generates_audio/cs-speech-client-to-response',
  'generates_content/cs-genai-client-to-response',
];

type Rule = {
  mode?: string;
  'pattern-sinks': unknown[];
  'pattern-propagators': unknown[];
  metadata: { strength?: string };
};

const load = (stem: string): Rule => {
  const doc = parse(readFileSync(join(bundledRulesDir(), `${stem}.yml`), 'utf8')) as { rules: Rule[] };
  return doc.rules[0] as Rule;
};

/** The stems of every C# taint rule under a generates_ directory. */
function csTaintStems(): string[] {
  const out: string[] = [];
  for (const dir of readdirSync(bundledRulesDir()).filter((d) => d.startsWith('generates_'))) {
    for (const f of readdirSync(join(bundledRulesDir(), dir))) {
      if (!f.startsWith('cs-') || !f.endsWith('.yml') || f.includes('.test.')) continue;
      if (load(`${dir}/${f.slice(0, -4)}`).mode === 'taint') out.push(`${dir}/${f.slice(0, -4)}`);
    }
  }
  return out.sort();
}

type Entry = { patterns?: unknown[] };

/** The index of the Blazor component-state sink: the one whose patterns name `class __RazorCode`. */
function blazorIndex(sinks: unknown[]): number {
  const found = sinks
    .map((s, i) => [s, i] as const)
    .filter(([s]) => JSON.stringify(s).includes('class __RazorCode'))
    .map(([, i]) => i);
  expect(found, 'exactly one sink is the Blazor component-state sink').toHaveLength(1);
  return found[0] as number;
}

/** The signal rules' one designed difference: a metavariable-regex on $X that drops wiring. */
const isWiringRegex = (item: unknown): boolean => {
  const mr = (item as { 'metavariable-regex'?: { metavariable?: string; regex?: string } })['metavariable-regex'];
  return mr?.metavariable === '$X' && typeof mr.regex === 'string' && mr.regex.includes('AsIChatClient');
};

/** A signal rule's sinks with its wiring regex removed, which must leave the evidence sinks. */
function withoutWiring(sinks: unknown[]): unknown[] {
  const copy = structuredClone(sinks);
  const blazor = copy[blazorIndex(copy)] as Entry;
  const items = blazor.patterns ?? [];
  const wiring = items.filter(isWiringRegex);
  expect(wiring, 'the Blazor sink carries one wiring regex').toHaveLength(1);
  blazor.patterns = items.filter((x) => !isWiringRegex(x));
  return copy;
}

describe('C# reply and client sinks', () => {
  const rules = new Map([...EVIDENCE, ...SIGNAL].map((stem) => [stem, load(stem)]));
  const evidence = rules.get(EVIDENCE_CANONICAL) as Rule;
  const signal = rules.get(SIGNAL_CANONICAL) as Rule;

  it(`the lists name every C# generation taint rule (${EVIDENCE.length + SIGNAL.length} of them)`, () => {
    expect(csTaintStems()).toEqual([...EVIDENCE, ...SIGNAL].sort());
  });

  it('the evidence list holds the evidence rules and the signal list the signal rules', () => {
    for (const stem of EVIDENCE) expect((rules.get(stem) as Rule).metadata.strength, stem).toBeUndefined();
    for (const stem of SIGNAL) expect((rules.get(stem) as Rule).metadata.strength, stem).toBe('signal');
  });

  it("every evidence rule carries the text rule's sinks, unchanged", () => {
    for (const stem of EVIDENCE) {
      expect((rules.get(stem) as Rule)['pattern-sinks'], stem).toEqual(evidence['pattern-sinks']);
    }
  });

  it("every signal rule carries the signal text rule's sinks, unchanged", () => {
    for (const stem of SIGNAL) {
      expect((rules.get(stem) as Rule)['pattern-sinks'], stem).toEqual(signal['pattern-sinks']);
    }
  });

  it('the signal sinks are the evidence sinks plus the wiring regex, and nothing else', () => {
    expect(withoutWiring(signal['pattern-sinks'])).toEqual(evidence['pattern-sinks']);
  });

  it("every rule carries the text rule's propagators, unchanged", () => {
    for (const stem of [...EVIDENCE, ...SIGNAL]) {
      expect((rules.get(stem) as Rule)['pattern-propagators'], stem).toEqual(evidence['pattern-propagators']);
    }
  });

  it('the shared sinks keep the shapes the sink fixtures test', () => {
    const sinks = JSON.stringify(evidence['pattern-sinks']);
    for (const shape of [
      'class $CTRL : $BASE { ... }',
      '[Microsoft.AspNetCore.Mvc.ApiController]',
      'public $R $ACTION(...) => $X;',
      '$APP.$MAP($ROUTE, (...) => $X)',
      'Microsoft.AspNetCore.Http.TypedResults.$RM(...)',
      '$CTX.Response.$W(...)',
      'ViewData[$K] = $X',
      'class $PAGE : Microsoft.AspNetCore.Mvc.RazorPages.PageModel { ... }',
      'class __RazorCode { ... }',
      'Clients.$WHO.SendAsync(...)',
      'class $HUBC : Microsoft.AspNetCore.SignalR.Hub { ... }',
      'class $SCREEN : Microsoft.Maui.Controls.ContentPage { ... }',
    ]) {
      expect(sinks, shape).toContain(shape);
    }
  });
});
