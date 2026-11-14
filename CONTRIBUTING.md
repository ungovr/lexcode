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
`gem.yml`, `maven.yml`, `composer.yml`, `nuget.yml`) says which activities a
well-known package enables. It is written by hand, one entry per package, and
nothing adds to it on its own:

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

Java, Kotlin and the JVM build files carry a prefix too:

| Kind | Rule `<what>` part | File and fixtures |
|---|---|---|
| Java | `java-<what>` | `java-<what>.yml`, `.test.java`, `.neg.test.java`; `languages: [java]` |
| Kotlin | `kt-<what>` | `kt-<what>.yml`, `.test.kt`, `.neg.test.kt`; `languages: [kotlin]` |
| Maven | `maven-<what>` | `maven-<what>.yml`, fixtures `maven-<what>.test.xml` and `.neg.test.xml`; `languages: [xml]`, and `paths.include` lists `pom.xml` and `maven-<what>.*` so the fixture is scanned |
| Gradle (Groovy) | `gradle-<what>` | `gradle-<what>.yml`, `.test.gradle`, `.neg.test.gradle`; `languages: [generic]` over `*.gradle` |
| Gradle (Kotlin DSL) | `gradle-kts-<what>` | `gradle-kts-<what>.yml`, `.test.gradle.kts`, `.neg.test.gradle.kts`; `languages: [kotlin]` over `*.gradle.kts` |

PHP and Composer carry a prefix as well:

| Kind | Rule `<what>` part | File and fixtures |
|---|---|---|
| PHP | `php-<what>` | `php-<what>.yml`, `.test.php`, `.neg.test.php`; `languages: [php]` |
| Composer | `composer-<what>` | `composer-<what>.yml`, fixtures `composer-<what>.test.json` and `.neg.test.json`; `languages: [json]` |

A PHP rule is `lexcode.<activity-short>.php-<what>`, and a Composer rule is
`lexcode.<activity-short>.composer-<what>`. A PHP fixture opens with `<?php`. A JSON fixture cannot hold an expect comment,
so each Composer fixture has a `.expect` file beside it (for example
`composer-<what>.test.json.expect`) holding its match count as one integer.
A second positive fixture for the same rule takes a middle word
(`php-<what>.test.qualified.php`), which is how a fully qualified form with no
import is pinned beside the imported one.

C# and the MSBuild files carry a prefix as well:

| Kind | Rule `<what>` part | File and fixtures |
|---|---|---|
| C# | `cs-<what>` | `cs-<what>.yml`, `.test.cs`, `.neg.test.cs`; `languages: [csharp]` |
| MSBuild | `msbuild-<what>` | `msbuild-<what>.yml`, fixtures `msbuild-<what>.test.csproj` and `.neg.test.csproj`; `languages: [generic]`, and `paths.include` lists the MSBuild names the rule reads (`*.csproj`, `*.props`, `*.nuspec`) and `msbuild-<what>.*` so the fixture is scanned |

A C# rule is `lexcode.<activity-short>.cs-<what>` and an MSBuild rule is
`lexcode.<activity-short>.msbuild-<what>`. A C# rule names a library API or a
language construct any .NET app may use, never a class that exists in one app. A
C# fixture is a whole file: `using` lines, a file-scoped `namespace` and a class.
A negative fixture holds the nearest lookalike the exclusion names, and for a
library type that is an app class of the same short name in another namespace
(see the C# pattern notes). A second fixture takes a middle word
(`cs-<what>.test.global.cs`), as PHP's does, to pin a short form that has no
`using` or an initializer form.

A Java or Kotlin fixture is a whole compilation unit: a `package` line,
imports and a class, so it parses as a real file does.

A negative fixture covers the anchors on generic names: strip the guard that
keeps a rule off a common name (a class called `Post`, a `get` on any
receiver, an app's own `ActivityHandler`) and the negative has to start
matching. Other guards, among them sink and propagator restrictions and some
vendor import guards, are not each pinned by a negative yet, and a contribution
that adds one is welcome. Where a rule guards on a vendor import,
write the lookalike the guard exists for: a generic method name called on a
receiver of another type, in a file without the vendor's import. A rule that
names several vendors keeps one `patterns:` branch per vendor, each with its own
import guard, so one vendor's import cannot admit another's call. A wildcard
import binds no class in the engine, so an import guard has one
`pattern-inside` for the class's import and another for the vendor's wildcard
(`import android.speech.*;`), and the positive fixture holds a call under each.
The negative has neither import.

### Cost

An engine rule can lose the literal pre-filter that lets it skip files that
cannot match: a very large `pattern-either`, or a key pattern that has no
literal in it, is read against every file. On a large Java or Kotlin codebase
that is the difference between seconds and minutes. Check a new rule with the
engine's `--time` on a real app before it merges: `"$(lexcode engine path)"
scan --time --config <rule.yml> <dir>` runs the engine binary from lexcode's
cache (`lexcode engine path` prints where it is) with only that rule over the
app's source directory. When it is slow, split the
rule, or add a `pattern-regex` conjunct that names the vendor's package or
class so the engine can skip the file (see the anchor rules above).

A conjunct that checks the whole file for a name has a reach. Write it as one
greedy literal, `'(?s)\A(?=.*FirebaseAnalytics).*'`, one per `pattern-regex`,
and join several with a `pattern-either` for "any of these". On Opengrep 1.33.1
the lookahead stops matching after about a million backtracking steps and
records no error. A greedy `.*` counts them from the end of the file, so a name
used only near the top of the file is lost from about 1,050 KB, and one near the
end still matches at 4.5 MB. A lazy `.*?` counts them from the start, and loses
a name used only at the end from about 1,000 KB. An alternation tried at every
step shortens the reach further: the JVM rules' first form,
`[\s\S]*?(?:A|B|...)`, lost matches from 120 KB. The release test refuses a
whole-file lookahead that holds a second lookahead, an alternation at its own
level (`(?=.*A|.*B)`), an alternation in a group before its first literal
(`(?=.*(A|B))`), or a lazy `.*?` or `[\s\S]*?` at its own level. A group after
the first literal (`(?=.*Mechanize\s*\.(?:new|start))`) passes, since it is tried
only where the literal matched. What the test passes still has the reach, so a
scan says in a notice how many files it handed the engine are over 1,000,000
bytes in a language with such a rule.

A scan hands the engine only the rules that have a file to read and only the
files those rules read (#12997): every config parse costs time, about 2.6 s
for the PHP rules alone, and a `generic` rule with no limit makes every file in
the repository a target, photographs and all. So give a `generic`, `regex` or
build-file rule a `paths.include`. lexcode tests each include's last segment
(`*`, `?` and literal characters) against a path's file and directory names; an
include with a bracket, a brace, a backslash, a `!` or `**` in its last segment
cannot be tested that way, and the rule then reads every file of its languages.
A rule's languages reach only the extensions `LANGUAGE_EXTENSIONS` in
`src/record/build.ts` lists, so a new language lists every extension the engine
reads for it, measured on explicit targets (a `javascript` rule also reads
`.ts`); a rule naming a language lexcode does not map reads every file.

A large scan runs the engine as several processes at once, called lanes
(`runEngine` in `src/engine/run.ts`, #12997). One engine process does not keep
many cores busy, since its workers are threads of one process that wait on each
other: on the UnGovr monorepo one process with `--jobs 16` used about 6 of 24
cores. A scan gets one lane per 4 MB of targets (`LANE_BYTES`), at most 8
(`MAX_LANES`), at most the cores available and at most one per 3 GB of memory
(`LANE_MEMORY_BYTES`, the machine's or the process's own limit, whichever is
lower), and the lanes share up to 16 jobs. `LEXCODE_ENGINE_LANES` overrides the
count. The targets are sorted biggest first and dealt round-robin, so the
largest files land in different lanes. Each extra process costs about 3.5
CPU-seconds to start, parse the rules and take its targets, so a small
repository stays one process, and memory, since each lane holds its own copy of
the rules and its own heap: on canvas-lms about 0.65 GB a lane. The matches are
sorted into one order, so the record does not depend on the number of lanes.

A PHP taint rule keeps its pre-filter only when each source has a whole-file
`pattern-regex` anchor and the rule has about six sources or fewer; beyond that
the engine parses every file, so split a rule that grows past it. Two free
metavariables bound per array element and joined (`[..., $A => $X, ...]` with a
`pattern-inside` of `[..., $B => $Y, ...]`) cost time quadratic in the array's
size: put the names in string-literal regexes instead.

A whole-file guard on a fully qualified PHP name checks its left boundary after
the name, not before it: `NAME\b(?<!\wNAME)(?<![\w\\]\\NAME)`, and for a name
written with a leading backslash `\\NAME\b(?<![\w\\]\\NAME)`. A lookbehind written
before the name (`(?<![\w\\])\\?NAME`) costs steps at every position and lost the
only match at the top of a file over about 600 KB. After the name it is tried
only where the name matched.

A rule's cost inside one file matters as well: a scan gives each rule 30 s per
file (`--timeout 30`), and a file the rule does not finish is a file error with
its matches lost. In a `patterns` block the engine pairs the matches of the
positive terms (`pattern`, `pattern-inside`, `pattern-either`) before it applies
a name check (`metavariable-regex` and the other `metavariable-` conditions) at
the same level. A field pattern (`$T $F;`) beside a class `pattern-inside`, with
the checks after both, paired every field of a file with every class, so the JVM
social rules took 10 to 33 s on a 900 KB file and one passed 30 s on a CI runner
(#13009). Put each check in a nested `patterns` block with the term that binds
its metavariable, so each term keeps only the matches that pass before the
pairing:

```yaml
- patterns:
    - pattern-either:
        - pattern: $T $F;
        - pattern: $T $F = $V;
    - metavariable-regex:
        metavariable: $F
        regex: '^(recipient|receiver)$'
- patterns:
    - pattern-inside: |
        class $C { ... $T2 $G; ... }
    - metavariable-regex:
        metavariable: $G
        regex: '^(sender|author)$'
- pattern-not-inside: |
    $RET $M(...) { ... }
```

The nested form matches the same ranges and took those rules to about 3 s. A
check on a metavariable that two terms bind stays at the joined level. Before a
release, `node scripts/rule-cost.mjs` times each rule with a positive fixture in
Java, Kotlin, PHP, Ruby, Python, JavaScript, TypeScript or Go on that fixture
followed by filler, at 90 KB and 900 KB, beside a bare rule that only parses the
same filler. It names a rule whose time grows more than twice as fast as the bare
rule's for the 10x file, or that takes more than five times the bare rule's time
on 900 KB, and every rule the engine failed on.

### Kotlin pattern notes

Measured on Opengrep 1.33.1:

- Method chains, constructors, imports, trailing lambdas (`$X.f($A) { ... }`),
  and `fun` and `suspend fun` inside `pattern-inside` all work, and so does
  `metavariable-regex`.
- `class $K { ... }` does not match a class that has a primary constructor.
  Write `class $K(...) {` on one line, `...` on the next and `}` on the third.
- A lambda with a parameter needs `{ $P -> ... }`, or match the call that takes
  it (`$L.forEach(...)`). A trailing lambda of one parameter and one of two are
  different shapes: `$M { $P -> ... }` and `$M { $P, $Q -> ... }`, and a rule
  that must not match a lambda with parameters excludes both.
- A class literal in a pattern (`Foo::class`, `Foo::class.java`) matches every
  class literal, so a rule cannot key on one; key on the import or the call.
- `metavariable-regex` is anchored at the start, and a string metavariable
  keeps its quotes, so write `.*gpt-` to find a model name inside a string.
- The parser drops a few constructs (`value class`, `fun interface`, `..<`,
  some `in` and `->` forms in `when`, soft keywords as identifiers,
  `object : T by it`). A rule cannot match inside one, though the rest of the
  file still matches; the scan counts the file in its notice `the engine could
  not read N files; their evidence is missing from this record`.
- A path glob in `paths.exclude` also matches package directories
  (`com/google/samples/apps/...`), so Java and Kotlin source rules exclude
  `**/src/test/**` and the other test source sets and never a `samples`,
  `example` or `demo` path. Build-file rules (`maven-`, `gradle-`,
  `gradle-kts-`) are not source rules and keep their sample and example
  excludes.

### PHP pattern notes

Measured on Opengrep 1.33.1:

- A metavariable is uppercase (`$X`, `$CLIENT`). A lowercase `$name` in a
  pattern is the literal PHP variable `$name`.
- The engine does not resolve `use` imports. `new \Aws\Rekognition\RekognitionClient(...)`
  does not match `new RekognitionClient(...)` under
  `use Aws\Rekognition\RekognitionClient;`, and the short form does not match
  the fully qualified one. A library class is matched by a twin: a
  `pattern-either` of the fully qualified form and the short form, the short
  form inside a `pattern-inside` of `use <FQN>;` followed by `...`.
- An alias binds. A `pattern-inside` of `use Twilio\Rest\Client as $A;` followed
  by `...`, with `new $A(...)`, matches `new TwilioClient(...)`.
- A `use X;` pattern also matches `use X as Y;`, so every branch of a
  twin that matches a class, facade or trait by its short name carries a
  `pattern-not-inside` of `use X as $A;` followed by `...`. A rule that uses
  `use X;` only as a file-level signal that the library is present, and matches
  a method call on a variable, leaves the guard off so that an aliased import
  counts too.
- A grouped use (`use Aws\{S3\S3Client, ...};`) does not parse as a pattern, so
  it cannot be a guard. In a target file it is matched by a `use A\$C;` pattern.
- `new $C(...)` with a `metavariable-regex` on the class name also matches an
  app's own class of that short name in another namespace. Use the twin instead.
- These all match: static facade chains (`OpenAI::chat()->create(...)`),
  property chains (`$C->messages->create(...)`), array-literal keys
  (`[..., 'model' => $M, ...]`) with `metavariable-regex` (anchored at the
  start, so write `.*gpt-`), `class $K extends $P { ... }` in `pattern-inside`,
  promoted constructor parameters, and plain function calls (`curl_init(...)`,
  `mail(...)`).
- PHP constants are case-insensitive, so an exclusion that names one (`true`,
  `null`) must match in any case.
- A `.blade.php` view parses as PHP without error, because its markup is inline
  HTML. PHP rules run over it harmlessly, and Blade's `{{ }}` contents are not
  PHP to the engine.
- A build-file rule (`composer-`) with a path exclusion cannot have it pinned by
  a fixture, because the runner reads only the files beside the rule. State the
  exclusion in the rule's comment.

### C# pattern notes

Measured on Opengrep 1.33.1:

- The engine resolves `using` for C#. A pattern with the fully qualified name
  (`new OpenAI.Chat.ChatClient(...)`, `Twilio.TwilioClient.Init(...)`) matches the
  fully qualified form, the short form under `using <namespace>;`, under a
  `global using` in the same file and under `using static`, and an alias
  (`using Oai = OpenAI.Chat;` with `new Oai.ChatClient(...)`). It does not match
  an app's own `ChatClient` in another namespace. So write a library type fully
  qualified, once; PHP's twin is not needed. In a file that holds both the
  library's `using` and an app class of that name, the engine picks the
  library's, where C# binds the app's, so keep that lookalike in a file without
  the library's `using`.
- A short-form pattern (`new ChatClient(...)`) matches every class of that name,
  the app's own included, and does not match the fully qualified form.
- The engine does not see the SDK's implicit usings, or a `global using` in
  another file: `new System.Net.Http.HttpClient(...)` misses `new HttpClient()`
  in a file with no `using System.Net.Http;`. A type from a namespace the .NET
  SDK imports implicitly (`System`, `System.IO`, `System.Linq`,
  `System.Net.Http`, `System.Threading`, `System.Threading.Tasks`,
  `System.Collections.Generic`; the Web SDK adds `Microsoft.AspNetCore.Http` and
  the other ASP.NET Core and `Microsoft.Extensions` namespaces; MAUI adds the
  `Microsoft.Maui` namespaces) is matched by a `pattern-either` of its fully
  qualified and short forms, and a short form of a generic name pins its method
  names. A third-party type may add a short form only when the short name
  carries the vendor's or product's own name (`AmazonRekognitionClient`,
  `TwilioClient`, `SendGridClient`); otherwise the global-using gap stands and
  is recorded in `rules/README.md`.
- A typed metavariable follows a field, a constructor parameter, a
  primary-constructor parameter, a lambda parameter and a local built with `new`
  (`var c = new T();`, `T c = new();`). It does not follow a value returned by a
  static factory, or a `var` assigned from a method call, and it knows no
  subtypes. `(Microsoft.Extensions.AI.IChatClient $C).GetResponseAsync(...)`
  matches `_chat.GetResponseAsync(...)` for a field `IChatClient _chat`, and not
  the same call on another type. Inside a `metavariable-pattern` a typed
  metavariable does not see the file's `using` lines, and a string comes back
  without its quotes.
- `new T(...)` does not match `new T { ... }` or `new T(...) { ... }`, the usual
  shape of a .NET request or options object. Write `new T(...) { ... }`, which
  matches with and without an initializer (and `T $V = new(...) { ... };` for a
  target-typed `new()`; `new T(...)` alone misses that too). A rule keyed on a
  constructed request or options type needs a fixture with an initializer.
- A positional `$M` does not match a named argument: `new ChatClient($M, ...)`
  misses `new ChatClient(model: "gpt-4o", ...)`, which `new ChatClient(model:
  $M, ...)` matches. Carry both forms.
- A generic type resolves through a `using` or the full name only when the
  pattern omits its type arguments (`(Ns.IPasswordHasher $H)`,
  `class $K : Ns.Hub { ... }`); written with arguments (`Ns.Hub<$T>`) it matches
  only the fully qualified generic. Carry both arms where both occur. A
  namespace alias combined with generic arguments (`Mt.IConsumer<A>`,
  `AspId.IdentityUser<Guid>`) is not resolved by either.
- `$O.$M(...)` does not match a generic call (`http.GetFromJsonAsync<T>(url)`);
  add `$O.$M<$T>(...)`. A namespace or class part of a qualified name cannot be a
  metavariable (`new Org.BouncyCastle.Crypto.Modes.$C(...)` matched nothing); list
  the classes.
- A property declaration is not a pattern (`DbSet<$K> $P { get; set; }` is a
  parse error), and a member with attributes parses only inside a class pattern
  (`class $C { ... [Attr(...)] $T $P { get; set; } ... }` with
  `focus-metavariable`). `[X(...)]` matches `[X]`, `[X()]` and `[X(args)]`; an
  attribute-only pattern returns nothing, so give it its class or method, and
  `[global::X]` needs its own pattern.
- A `catch` clause cannot be a pattern on its own, and `try { ... } catch ($T $E)
  { ... }` in a `pattern-not-inside` also drops the try body.
- An interpolated string prints as `$"` followed by its text with the braces
  dropped and no closing quote (`$"{appUrl}/login"` reads `$"appUrl/login`), but a
  `metavariable-regex` sees the source text. `metavariable-regex` is anchored at
  the start, so write `.*gpt-` to find a model name inside a string.
- `pattern-not-regex` removes a match only when its regex covers the whole match,
  and a `pattern-not` beside a `pattern-regex` in the same `patterns` block is
  ignored (`pattern-not-inside` works). A branch of a `pattern-either` with no
  binding for a metavariable that a later `metavariable-regex` names is dropped
  without an error; split the branches.
- `pattern-inside: using X; ...` is met by `using X;` and by any longer namespace
  beneath it (`using OpenAI.Audio;` meets `using OpenAI;`), and not by an alias
  directive, so a guard like that is a file signal at namespace-family level.
- A line-start gate (`(?m)^`) fails on a UTF-8 byte order mark when its target
  is line 1, and a Visual Studio file often starts with one. Write it as
  `^\x{FEFF}?[ \t]*...` and pin it with a fixture whose BOM sits before the gated
  line.
- A whole-file lookahead (`(?s)\A(?=.*NAME).*`) in a `cs-` rule has the reach
  limit above and puts C# among the languages the large-file notice counts. No C#
  rule has one, and the test that checks the notice reads its language set from
  the rule files.
- All of these parse and match: top-level statements and minimal APIs
  (`$APP.MapPost($R, ...)`), `builder.Services.AddChatClient(...)`, generic calls
  (`$S.AddHttpClient<$T>(...)`), records, primary constructors, collection
  expressions, list patterns, raw string literals, `await foreach`, LINQ query
  syntax, file-scoped namespaces, and `required` and `init` members.
- An MSBuild file is not XML to the engine: `languages: [xml]` reads only `.xml`,
  so a `.csproj`, `.fsproj`, `.props` or `.nuspec` rule is `generic`, with
  `paths.include` and a `pattern-regex`, as the Gradle rules are.

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
