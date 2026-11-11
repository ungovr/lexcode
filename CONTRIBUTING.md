# Contributing to lexcode

Thank you for helping. Two rules matter more than any other.

## Every rule is written here, from the activity's definition

Write a rule against the activity's published definition at
https://lexlint.io/activities and its exclusions, one activity at a time,
with the fixtures first: a positive fixture showing the act, and a negative
fixture for every exclusion the definition names. A rule that fires on a
negative fixture cannot merge.

A `pattern-regex` conjunct is an anchor: it lets the engine skip files that
cannot match, which on a large Ruby codebase is the difference between seconds
and minutes. It must admit every shape the rule's own patterns match: no
required `(` after a method name (and an empty `()` allowed after a no-arg
one), no fixed list of method names where the rule takes any, receiver words in
any case, `&.` as well as `.`, and a line break, a comment line or a `\`
between the two tokens of a call (`\s*&?\.\s*` is the minimum). The positive
fixture carries one paren-less line and one multi-line line (arguments over
several lines, or a chain split on its dots) for each call the anchor names,
because a fixture written with parentheses on one line cannot see a narrow
anchor.

`test/anchors.test.ts` enforces the fixture half. For every Ruby rule with an
anchor it runs the rule and a copy without the anchor over the rule's own
positive fixture, and fails on any line the copy matches that the rule does
not. It can only see the shapes the fixture holds, so the fixture is where a
new shape goes. A rule whose regex is the matcher or the selector, not a
pre-filter, is listed in that test with its reason.

## Never copy a rule from another rule set

Do not copy, translate or adapt any rule, pattern, fixture or message from
`semgrep-rules`, `opengrep-rules` or `privado-rules`, or from any other rule
set whose license limits how it may be used. The reason is their licenses:

- The Semgrep rules are under the Semgrep Rules License v1.0, which permits
  use for internal business purposes only.
- `opengrep-rules` and `privado-rules` carry the Commons Clause on top of
  their open license. The Commons Clause withholds "the right to Sell the
  Software", and defines Sell to include providing a product or service
  "whose value derives, entirely or substantially, from the functionality of
  the Software", including hosting and consulting fees.

lexcode's rules are MIT, so anyone may use them for anything. One copied rule
would end that for the whole set. Every rule says so in its metadata:
`provenance: ungovr-original` and `license: MIT`.

## Adding a package to the component map

The component map (`rules/components/npm.yml`, `pypi.yml`, `go.yml`, `gem.yml`) says which
activities a well-known package enables. It is written by hand, one entry per
package, and nothing adds to it on its own:

1. Find candidates with `lexcode deps <repo>... --unmapped`, run over several
   repositories: it lists every package the map does not know, the ones most
   repositories use first. A comparison with a hand-read lint, or a truth-set
   miss, is the other source.
2. Add an entry only when the package itself does the act: an analytics or
   session-replay SDK enables `tracks_devices` and `processes_personal_data`, a
   speech SDK `processes_voice`, a crawler library `crawls_web`. A UI kit, a
   date library or an HTTP client enables nothing, however often it appears.
3. `says` quotes the vendor's own description of the package, verbatim, and
   `source` is the https page that holds it (the registry page, or the
   package's README in its published tarball when the registry page says too
   little). `enables` lists activity ids whose class in `classes.yml` is
   `evidence`.
4. `npm test` checks the shape of every entry: no duplicates, known evidence
   ids, a quote and an https source.

## Running the tests

```
npm ci
npm run build
npm test
```

The fixture tests download the pinned engine on first run, or use the one
named by `LEXCODE_ENGINE`.
