// What scripts/rule-cost.mjs needs to decide whether a Swift rule over a bound on its first filler is cleared by the
// plain one (see BARE_HIT there), kept apart so test/unit/rule-cost-swift.test.ts can hold it without the engine.

import { parse as parseYaml } from 'yaml';

/**
 * A Swift declaration modifier or attribute named in a rule's positive patterns, read conservatively: a NOT CLEARED
 * that was not needed only sends a rule to a person, while a miss lets a slow rule ship. A modifier word anywhere as a
 * whole word (`$X.open(...)` included), after each backslash escape is blanked so `\bfinal` and `\sfinal` read as
 * `final`; and an `@` followed by a letter, `\w`, `(` or `[`, so `@Model`, `@\w+`, `@(?:A|B)` and `@[A-Z]` all count.
 */
export const MODIFIER_WORD = /\b(?:final|open|public|internal|private|fileprivate)\b/g;
export const ATTRIBUTE = /@(?:[A-Za-z_]\w*|\\w|\(|\[)/g;
/** The shared Swift import guard's attribute-before-import part, which names no declaration's attribute. */
const IMPORT_GUARD_ATTRIBUTE = '(?:@\\w+(?:\\([^)]*\\))?\\s+)*import';
/**
 * Keys whose text is not a positive pattern: exclusions, sanitizers, what is not a pattern at all, and a
 * metavariable's regex or comparison, which tests text a pattern already bound (a path, a name), not a declaration.
 */
const NOT_POSITIVE = /^(?:pattern-not.*|pattern-sanitizers|metavariable-regex|metavariable-comparison|metadata|message|id|languages|severity|paths|options|fix)$/;

/** The modifiers and attributes a rule file's text names in its positive patterns, without repeats. */
export function namedModifiers(ruleText) {
  const found = new Set();
  const walk = (node, key) => {
    if (key !== undefined && NOT_POSITIVE.test(key)) return;
    if (typeof node === 'string') {
      const text = node.replaceAll(IMPORT_GUARD_ATTRIBUTE, 'import');
      for (const m of text.matchAll(ATTRIBUTE)) found.add(m[0]);
      for (const m of text.replace(/\\[A-Za-z]/g, ' ').matchAll(MODIFIER_WORD)) found.add(m[0]);
    } else if (Array.isArray(node)) {
      for (const v of node) walk(v, key);
    } else if (node !== null && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) walk(v, k);
    }
  };
  walk(parseYaml(ruleText));
  return [...found];
}

/**
 * Why a Swift rule within bounds on the plain filler is still not cleared, or none. Two tests, either enough:
 * - it names a modifier or attribute (`named`, from namedModifiers);
 * - it matched more on the first filler's 900 KB file than on the plain filler's (#13322). The two files hold the
 *   same fixture and differ only in the modifiers, so a rule that finds more on the first is keyed on modified
 *   declarations, whatever its patterns spell (`^\S+ class` names no modifier), and the plain filler gave it
 *   nothing to be slow on. Counts that are missing fail closed.
 */
export function notClearedReasons({ named, firstMatches, plainMatches }) {
  const reasons = [];
  if (firstMatches === undefined || plainMatches === undefined) reasons.push('its match counts are missing');
  else if (firstMatches > plainMatches) {
    reasons.push(`it has ${firstMatches} matches on the first filler and ${plainMatches} on the plain one, so it reads the modified declarations only the first holds`);
  }
  if (named.length > 0) reasons.push(`it names ${named.join(', ')}`);
  return reasons;
}
