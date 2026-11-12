import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { bundledRulesDir } from '../../src/rules/load.js';

// The PHP rules that find model output sent back in a reply share one set of reply sinks and
// propagators, copied into every rule (#12987). The negative fixtures for those sinks live with the
// text rule, so this test is what makes them guard every copy: a sink or propagator that one copy
// drops or edits, metavariable-regex included, fails here. The rules differ only in their sources
// (and the content rule's sanitizers). A new PHP reply rule has to join the list below.

const CANONICAL = 'generates_text/php-chat-reply-to-response';

const STEMS = [
  'generates_text/php-chat-reply-to-response',
  'generates_images/php-image-reply-to-response',
  'generates_audio/php-speech-reply-to-response',
  'generates_video/php-video-reply-to-response',
  'generates_content/php-genai-to-response',
];

type Rule = { mode?: string; 'pattern-sinks': unknown[]; 'pattern-propagators': unknown[] };

const load = (stem: string): Rule => {
  const doc = parse(readFileSync(join(bundledRulesDir(), `${stem}.yml`), 'utf8')) as { rules: Rule[] };
  return doc.rules[0] as Rule;
};

/** The stems of every PHP taint rule that sends model output back in a reply (not a result returned). */
function replyStems(): string[] {
  const out: string[] = [];
  for (const dir of readdirSync(bundledRulesDir()).filter((d) => d.startsWith('generates_'))) {
    for (const f of readdirSync(join(bundledRulesDir(), dir))) {
      if (!f.startsWith('php-') || !f.endsWith('.yml') || f.includes('.test.') || f.includes('result-returned')) continue;
      if (load(`${dir}/${f.slice(0, -4)}`).mode === 'taint') out.push(`${dir}/${f.slice(0, -4)}`);
    }
  }
  return out.sort();
}

describe('PHP reply sinks', () => {
  const rules = new Map(STEMS.map((stem) => [stem, load(stem)]));
  const canonical = rules.get(CANONICAL) as Rule;

  it(`the list names every PHP reply rule (${STEMS.length} of them)`, () => {
    expect(replyStems()).toEqual([...STEMS].sort());
  });

  it('every rule carries the text rule\'s sinks, unchanged', () => {
    for (const stem of STEMS) {
      expect((rules.get(stem) as Rule)['pattern-sinks'], stem).toEqual(canonical['pattern-sinks']);
    }
  });

  it('every rule carries the text rule\'s propagators, unchanged', () => {
    for (const stem of STEMS) {
      expect((rules.get(stem) as Rule)['pattern-propagators'], stem).toEqual(canonical['pattern-propagators']);
    }
  });

  it('the shared sinks keep the shapes the text fixtures test', () => {
    const sinks = JSON.stringify(canonical['pattern-sinks']);
    for (const shape of [
      'echo ...;',
      'class $CMD extends Command',
      'response()->$RM(...)',
      'view(...)->with(...)',
      'broadcast(...)',
      'public function $ACTION(...)',
      'Route::$VERB($PATH, function (...) { ... })',
      'use Livewire\\\\Component;',
    ]) {
      expect(sinks, shape).toContain(shape);
    }
  });
});
