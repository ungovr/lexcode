# lexcode

lexcode reads a repository on your machine and writes down, file and line,
what the code does in the vocabulary LexLint uses for legal activities:
whether it crawls other sites, records voices, tracks devices, generates
content with a model, sends messages people did not ask for, and so on. In
CI it checks the declaration you committed (`ACTIVITIES.md` or `lexlint.yml`)
against that evidence and fails the build when the code does something the
declaration does not say.

The record is about what the code does, never about what law applies. Law is
resolved later, by the LexLint lint, from your product's own jurisdictions and
roles. lexcode gives evidence for questions a person answers; it is not legal
advice and it never writes a declaration for you.

## Run it

```
npx @ungovr/lexcode scan    # writes lexcode.json in the repository root
npx @ungovr/lexcode check   # compares the code with your declaration
```

The package is `@ungovr/lexcode` on npm for now, while npm decides on the
unscoped name `lexcode`; the command it installs is `lexcode` either way
(`npm install -g @ungovr/lexcode`, then `lexcode scan`).

Node 20 or later. On first run lexcode downloads the analysis engine it is
pinned to (Opengrep, about 40 MB) from the Opengrep GitHub release, checks its
sha256 against the value shipped in this package, and caches it. The engine
unpacks itself under lexcode's own cache directory the first time it runs
(see Privacy for everything the engine writes and where).

To scan code you do not trust (a stranger's clone, a pull request, an unpacked
archive), run lexcode from outside it, with a copy you chose:
`cd ~ && npx @ungovr/lexcode@1 scan /path/to/repo`. npm honors a project's
`.npmrc` `registry=` line and a local `@ungovr/lexcode` dependency, so
`npx @ungovr/lexcode` run inside
an untrusted repository may run something other than this package. lexcode
itself never runs a program from the scanned directory (see Privacy).

## What it reads

Files tracked by git or trackable by it, honoring `.gitignore`. Outside a git
work tree lexcode walks the directory instead, and then also leaves out
virtual environments (`.venv`, `venv` and `env` where a `pyvenv.cfg` says they
are one), `site-packages`, `__pycache__`, `.tox`, `.nox`, `.mypy_cache`,
`.pytest_cache`, `.next`, `.nuxt`, `.svelte-kit`, `target`, `.gradle`, `Pods`,
`.terraform` and .NET build output (`obj` where it holds a
`project.assets.json`, `bin` where it holds a `Debug` or `Release`
directory), and applies the simple patterns of the root `.gitignore`: a
name, `dir/`, a glob such as `*.ext`, and a leading `/`. Negations (`!pattern`)
are not supported, and neither is a `.gitignore` below the root; the scan says
so in a notice. Never
`node_modules`, `vendor`, `dist`, `build` or `.git`, never minified or bundled
files (including any named `*.min.js`, `*.bundle.js`, `vendor.*.js` or
`*.vendor.js`), never C# the compiler generated (`*.g.cs` and `*.g.i.cs`;
a `*.Designer.cs` is read), never a file with a line over 100,000 characters (generated
code, counted in a notice), never symbolic links, never files over 5 MB, never a
file you cannot open for reading (counted in a notice), and never directories
named `test`, `tests`, `__tests__`, `spec`, `fixtures`, `testdata`,
`androidTest`, `testFixtures` or `integrationTest`, or the Kotlin Multiplatform
test source sets `commonTest`, `jvmTest`, `androidUnitTest`,
`androidInstrumentedTest`, `iosTest`, `jsTest` or `nativeTest`, or .NET test
projects (a directory whose name ends in `.Tests`, `.Test`, `.UnitTests`,
`.IntegrationTests`, `.FunctionalTests`, `.AcceptanceTests` or `.Specs`, so
`src/MyApp.Tests`), in any case (so Symfony's `Tests` and Magento's `Test`
too), unless you pass `--include-tests`.
`app.scope` in `lexlint.yml` narrows the read, as the lint reads it.

Languages: TypeScript, JavaScript (with JSX and TSX), Python, Go, Ruby
(`.rb`, `.rake`, `.ru` and `.gemspec` files, and a `Rakefile`, `Fastfile`,
`Appfile` or `Capfile`), Java (`.java`), Kotlin (`.kt`, `.kts`) and PHP (`.php`,
`.phtml`, and `.inc`, `.module`, `.theme` and `.install` files that open with
`<?php`) and C# (`.cs`; `.csx` and `.cake` scripts are not read), plus the
`<script>` blocks of Vue, Svelte, HTML, Jinja, ERB (`.erb`, so `.html.erb`),
JSP (`.jsp`, `.jspf`, `.tag`), PHP (`.php`, `.phtml`), Blade (`.blade.php`),
Twig (`.twig`, so `.html.twig`) and Razor (`.cshtml`, `.razor`) files. In an
ERB, JSP, Twig or Razor view only the `<script>` blocks are read, as
JavaScript; the Ruby, Java, C# or template code inside the tags is not (the
tags are blanked, so line numbers hold), except that a Razor file's `@code`
and `@functions` blocks are also read as C#. A PHP, Blade or `.phtml` view is
PHP source, so the whole file is also scanned as PHP, and its `<script>`
blocks are read as JavaScript as well. Code in any other language (Swift, F#,
Visual Basic, Rust and the like) is not read, and the scan names each such language with its file count in a notice, so
a missing activity there reads as "not checked", never as "not there".
Manifests: npm
(`package.json` with `package-lock.json`, `pnpm-lock.yaml` or `yarn.lock`),
PyPI (`pyproject.toml`, `requirements*.txt`, `uv.lock`, `poetry.lock`), Go
(`go.mod`), RubyGems (`Gemfile` or `gems.rb`, with `Gemfile.lock` or
`gems.locked`, and `*.gemspec`), Maven (`pom.xml`, and Gradle's `build.gradle`
and `build.gradle.kts` with their version catalogs, `gradle/*.versions.toml`,
and the constants and `findLibrary` lookups in `buildSrc` and `build-logic`) and
Composer (`composer.json`, with the `composer.lock` beside it) and NuGet
(`*.csproj`, `*.fsproj`, `*.vbproj`, `Directory.Build.props`,
`Directory.Build.targets`, `Directory.Packages.props` and `packages.config`,
with the `packages.lock.json` beside a project).
How Ruby, gems, Java, Kotlin, Maven, Gradle, PHP, Composer, C#, Razor and
NuGet are read, in detail, is in [rules/README.md](rules/README.md).

## What it writes

`lexcode.json`:

```yaml
schema: https://lexlint.io/lexcode/v1
activities:
  - id: processes_voice
    mentioned: performs
    evidence:
      - rule: lexcode.voice.whisper-transcribe
        where: services/transcribe.py:88
  - id: tracks_devices
    mentioned: enables
    evidence:
      - rule: lexcode.manifest.npm
        where: package.json:31
        component: pkg:npm/%40segment/analytics-next@1.77.0
signals: []
searched_not_found:
  - id: trains_models
    rules: 7
components: [...]
```

- `performs`: a rule matched the project's own code doing it.
- `enables`: only a dependency makes it possible. A dependency is a question,
  not an answer: a package can be installed and never called.
- `signals`: weak hints shown as "worth a look". They never affect a result.
- `searched_not_found`: activities lexcode has rules for and found nothing,
  with how many rules it tried. That is a finding, not an absence of one. A
  rule is tried only when the scope holds a file it reads (one of its
  languages, with a name its `paths.include` matches); the engine is handed
  those rules and those files, nothing else.

`--sarif out.sarif` also writes SARIF 2.1.0 for GitHub code scanning or any
SARIF viewer. `--json` prints the record instead of writing a file.

## Privacy

Your code never leaves your machine. lexcode makes no network call during a
scan; its one network call is the engine download above, which
`lexcode engine fetch` does on its own for air-gapped setups. The record holds
paths, line numbers, rule ids, activity ids and package URLs, and no source
text unless you pass `--snippets`; a manifest that does not parse is reported
by line and column, never by quoting it. lexcode has no telemetry.

### What the engine writes, and where

The engine is a separate program, and left alone it writes outside the
directory it is given. lexcode points every one of those writes into its own
directories, and sets nothing in your home directory:

| What | Where | When it goes |
|------|-------|--------------|
| Scratch files: a copy of the merged rule set (`semgrep-*.rules`) and temporary target files | `TMPDIR`, `TMP` and `TEMP` for the engine are set to `<system temp>/lexcode-engine-*/tmp` | removed when the scan ends, and when lexcode is interrupted by Ctrl-C, SIGTERM or SIGHUP |
| The engine's log, which names the scanned paths (`~/.opengrep/semgrep.log` otherwise) | `SEMGREP_LOG_FILE` is set to `engine.log` in that same directory | with the scratch files |
| The engine's own unpacked runtime (`~/.cache/opengrep/<version>/` otherwise), loaded and run | `XDG_CACHE_HOME` is set to `<cache>/engine-home`, by default `~/.cache/lexcode/engine-home`; a directory only you can write to, kept between runs | stays, like the engine download in `<cache>/engine`; delete it to reclaim the space |
| lexcode's copies of the `<script>` blocks it extracts, and the merged rule file | `<system temp>/lexcode-scan-*` | removed when the scan ends or is interrupted |

The engine runs in a directory of lexcode's own inside `lexcode-engine-*`, not
in the repository, and reaches the repository through a link there. It is
started in its own process group, so a deadline or an interrupt stops its
workers too (SIGTERM, then SIGKILL after 3 seconds). If lexcode itself is killed
with SIGKILL or the machine loses power, the `lexcode-*` directories stay in the
system temp directory and are safe to delete.

`XDG_CACHE_HOME` is honored on Linux and macOS (verified for the pinned
engine on Linux); on Windows the engine's own cache location is not
redirected. lexcode runs `git ls-files` in the directory it scans, as the
program found on `PATH` (never one in the current or scanned directory), and
tells git to ignore the repository's own `core.fsmonitor`,
`core.untrackedCache` and `core.excludesFile` settings, so a `.git/config`
that came from someone else cannot run a program or point it at a file.

## The drift check

| Code shows | Declaration says | Result |
|---|---|---|
| `performs` X | X declared | PASS |
| `performs` X | X not mentioned | FAIL |
| `performs` X | X declared absent (`not:`) | FAIL |
| `enables` X only | X not declared | WARN (FAIL with `--fail-on-enables`) |
| nothing for X | X declared | INFO: a declaration can rest on things outside the repository |

A parent and its kinds count as one family: evidence for `generates_images`
satisfies a declared `generates_content`, and the reverse.

| Exit | `scan` | `check` |
|---|---|---|
| 0 | the record was written | no drift |
| 1 | | at least one FAIL |
| 2 | tool error | tool error |
| 3 | | no declaration found (`--allow-undeclared` makes it a warning) |

## `.lexcode.yml`

Suppressions and options live beside your declaration, never in code comments:

```yaml
schema: https://lexlint.io/lexcode/config/v1
ignore:
  - rule: lexcode.voice.browser-mediarecorder
    where: src/voice/
    reason: Microphone capture is for the user's own note and is not stored.
    by: you@example.com
    on: 2026-11-01
fail_on_enables: false
own_hosts: [api.example.com]   # a fetch of one of these is never crawling
include: []
exclude: []
```

An ignore without a `reason` is an error: it records a person's decision.

## Commands

```
lexcode scan   [path] [--out lexcode.json] [--json] [--sarif out.sarif] [--snippets] [--rules <dir>] [--engine <path>] [--include-tests]
lexcode check  [path] [--declaration lexlint.yml|ACTIVITIES.md] [--config .lexcode.yml] [--fail-on-enables]
               [--include-tests] [--allow-undeclared] [--sarif out.sarif] [--out lexcode.json] [--json] [--quiet]
lexcode explain <activity-id | rule-id | purl>... [--json]
lexcode rules  [--json]
lexcode deps   [path]... [--unmapped] [--json]
lexcode engine fetch | path | verify
lexcode version
```

`lexcode deps` lists the packages lexcode read from the manifests of one or
more repositories (the dependencies `scan` reads: same scope, development
dependencies skipped), with the activities the component map gives each and
the number of repositories each appears in, most first. `--unmapped` keeps
only the packages the map gives no activity: the review list for new map
entries (see [CONTRIBUTING.md](CONTRIBUTING.md)).

`--engine <path>` or `LEXCODE_ENGINE` uses an engine you installed yourself; a
relative path is resolved against the directory you ran lexcode from, never
against the repository being scanned.
Behind a proxy, run the download under `NODE_USE_ENV_PROXY=1` (Node 22.21 or
later), or fetch the engine on another machine. `LEXCODE_CACHE_DIR` moves the
cache; lexcode refuses an engine directory that another user owns or that group
or everyone can write to, since it runs a program from there.
`LEXCODE_ENGINE_DEADLINE=<seconds>` changes how long a whole engine run may
take (900, 15 minutes, by default); past it the engine is stopped and the scan
fails with exit 2.

A large scan runs the engine as several processes at once, one per 4 MB of
files it reads, at most 8, and no more than the cores and one per 3 GB of
memory allow. Each process holds its own copy of the rules, so memory rises
with them. `LEXCODE_ENGINE_LANES=<n>` sets the number; `1` runs the engine as
one process, for a machine that runs short of memory.

`LEXCODE_RULES_HOME=<dir>` replaces the bundled `rules/` directory (it needs `ruleset.yml`, `classes.yml`, `registry.snapshot.json` and `components/`), for a vendored rule set or a test.

CI: see [docs/ci.md](docs/ci.md).

## License

The code and the rules are MIT. The engine is Opengrep, under the LGPL-2.1,
run as a separate program and never modified; `NOTICE` says where its source
is. The activity registry snapshot in `rules/` is CC BY 4.0, credit LexLint
(UnGovr). Rules are written here from each activity's definition; see
[CONTRIBUTING.md](CONTRIBUTING.md).
