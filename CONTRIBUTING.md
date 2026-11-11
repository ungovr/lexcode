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
any case, and `&.` as well as `.`. Between the two tokens of a call, and
between the receiver and the dot, the anchors use the possessive separator
`(?:\s|\\|#[^\n]*+)*+`: white space, a `\` continuation or a comment line.
Because it is possessive it consumes the space before the next token, so a
token that needs its own leading space is written `(?<=\s)token`, not
`\s+token`.
The positive fixture carries one paren-less line and one multi-line line
(arguments over several lines, or a chain split on its dots) for each call the
anchor names, because a fixture written with parentheses on one line cannot
see a narrow anchor.

`test/anchors.test.ts` checks that the anchors admit what the fixtures hold.
For every Ruby rule with an anchor it runs the rule and a copy without the
anchor over the rule's own positive fixture, and fails on any line the copy
matches that the rule does not. It does not check that a fixture carries the
shapes above, so that part is the author's: a shape missing from the fixture
is a shape the check cannot see. A rule whose regex is the matcher or the
selector, not a pre-filter, is listed in that test with its reason.

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

The component map (`rules/components/npm.yml`, `pypi.yml`, `go.yml`,
`gem.yml`) says which activities a well-known package enables. It is
written by hand, one entry per package, and nothing adds to it on its own:

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
   little). When the description runs long, `says` may quote whole sentences
   from its start, up to a sentence boundary, and drop the rest; it never cuts
   inside a sentence or rewords one. `enables` lists activity ids whose class
   in `classes.yml` is `evidence`.
4. `npm test` checks the shape of every entry: no duplicates, known evidence
   ids, a quote and an https source.

## Naming rules and fixtures

A rule's id is `lexcode.<activity-short>.<what>`, where `<activity-short>` is
the short name the activity's other rules already use (`crawl`, `outreach`,
`chatbot`, `voice`, and so on). The file is `rules/<activity>/<what>.yml`, with a
positive fixture `<what>.test.<ext>` and a negative fixture
`<what>.neg.test.<ext>` beside it. TypeScript and JavaScript rules take the bare
`<what>`. A rule for another language often says so in its name, as a suffix for
Python (`-py`) and Go (`-go`) when a TypeScript rule already holds the bare
name. Ruby rules always carry a prefix:

| Language | Rule `<what>` part | File and fixtures |
|---|---|---|
| TypeScript, JavaScript | `<what>` | `<what>.yml`, `.test.ts`, `.neg.test.ts` |
| Python | `<what>-py` (usual) | `<what>-py.yml`, `.test.py`, `.neg.test.py` |
| Go | `<what>-go` (usual) | `<what>-go.yml`, `.test.go`, `.neg.test.go` |
| Ruby | `rb-<what>` | `rb-<what>.yml`, `.test.rb`, `.neg.test.rb` |

A Ruby rule is `lexcode.<activity-short>.rb-<what>`, file
`rules/<activity>/rb-<what>.yml`, fixtures `rb-<what>.test.rb` and
`rb-<what>.neg.test.rb`, and `languages: [ruby]`.

## Performance tests

A performance test checks a scaling ratio or a work counter, never a fixed
time. CI runners differ in speed several-fold (a shared macOS runner once took
2.8 seconds on a test budgeted at 2), so "under 2 seconds"
passes on one runner and fails on the next with no code change, and a budget
loose enough to be safe everywhere misses real regressions.

Time the same function on N and 10N inputs inside one test and assert the
ratio. Linear code costs about 10x and quadratic code about 100x, on any
machine, so a bound of 30x separates them. `test/helpers/scaling.ts` does this:
`measureScaling` warms up, takes the minimum of several repetitions per size,
and loops a call that runs under 5 ms so the clock is not the noise; a ratio
over the bound is measured again, up to three times in all, and the lowest
counts, because runner noise only adds time and comes and goes while a
quadratic regression is over the bound every time. `expectNearLinear` asserts
the ratio. Keep the existing correctness assertions
on the result it returns. Where the code has a natural counter (lines scanned,
lookups made), assert the count instead. If a ratio test flakes, fix the
measurement method; never widen the bound or skip the platform.

A deadline test (an engine that outlives its deadline is stopped) is not a
performance test, and its time bound only has to be far above the deadline it
checks.

## Running the tests

```
npm ci
npm run build
npm test
```

The fixture tests download the pinned engine on first run, or use the one
named by `LEXCODE_ENGINE`.
