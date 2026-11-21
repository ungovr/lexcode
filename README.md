<p align="center">
  <a href="https://lexlint.io/lexcode">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ungovr/lexcode/main/.github/assets/lexlint-logo-on-dark.png">
      <img src="https://raw.githubusercontent.com/ungovr/lexcode/main/.github/assets/lexlint-logo.png" alt="LexLint" width="300">
    </picture>
  </a>
</p>

<h1 align="center">LexCode</h1>

<p align="center">
  LexLint's code reader. It writes down, file and line, what your code does,<br>
  and fails the build when your declaration stops saying it.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@ungovr/lexcode"><img src="https://img.shields.io/npm/v/%40ungovr%2Flexcode" alt="npm version"></a>
  <a href="https://github.com/ungovr/lexcode/actions/workflows/ci.yml"><img src="https://github.com/ungovr/lexcode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://socket.dev/npm/package/@ungovr/lexcode"><img src="https://socket.dev/api/badge/npm/package/@ungovr/lexcode" alt="Socket"></a>
  <a href="https://github.com/ungovr/lexcode/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://lexlint.io/lexcode">Website</a> &middot;
  <a href="https://learn.lexlint.io/lint/lexcode">Watch it run</a> &middot;
  <a href="https://lexlint.io/activities">The activities</a> &middot;
  <a href="https://github.com/ungovr/lexcode/blob/main/docs/ci.md">Use it in CI</a>
</p>

---

LexCode reads a repository on your machine and records what the code does in
the words LexLint uses for activities: crawling other sites, recording a
voice, tracking a device, generating content with a model, sending messages
nobody asked for. In CI, `lexcode check` holds your declaration
(`ACTIVITIES.md` or `lexlint.yml`) to that evidence.

It says what the code does, never what law applies, and it never writes a
declaration for you. Law comes later, from the
[LexLint lint](https://lexlint.io), for your own jurisdictions and roles.
LexCode is not legal advice.

## Run it

```sh
npx @ungovr/lexcode scan    # writes lexcode.json in the repository root
npx @ungovr/lexcode check   # compares the code with your declaration
```

Or install it: `npm install -g @ungovr/lexcode`, then `lexcode scan`. Node 20
or later.

On first run LexCode downloads the analysis engine it is pinned to (Opengrep,
about 40 MB) from the Opengrep GitHub release, checks its sha256 against the
value shipped in the package, and caches it. The package is `@ungovr/lexcode`; the command it installs is
`lexcode`.

> **Scanning code you do not trust** (a stranger's clone, a pull request, an
> unpacked archive)? Run LexCode from outside it:
> `cd ~ && npx @ungovr/lexcode@1 scan /path/to/repo`. npm honors a project's
> `.npmrc` `registry=` line and a local `@ungovr/lexcode` dependency, so `npx`
> run inside an untrusted repository may run something other than this
> package. LexCode itself never runs a program from the scanned directory.

## What it reads

| Kind | What LexCode reads |
|---|---|
| **Languages** | TypeScript, JavaScript, Python, Go, Ruby, Java, Kotlin, PHP, C#, Swift, Rust |
| **Views** | The `<script>` blocks of Vue, Svelte, HTML, Jinja, Nunjucks, ERB, JSP, Twig, Tera and Razor files; PHP and Blade views in full |
| **Package manifests** | npm, PyPI, Go, RubyGems, Maven and Gradle, Composer, NuGet, Cargo, Swift packages, CocoaPods |
| **Apple app configuration** | `Info.plist`, `PrivacyInfo.xcprivacy`, `*.entitlements`, `project.pbxproj` |
| **Which files** | What git tracks or could track, honoring `.gitignore` |
| **Left out** | Dependencies, build output, generated and minified code, files over 5 MB, and tests unless you pass `--include-tests` |

A language it does not read is named in the scan with its file count, so an
activity there reads as "not checked", never as "not there".

More:
[languages on lexlint.io](https://lexlint.io/lexcode#languages) &middot;
[every file, extension and exclusion](https://github.com/ungovr/lexcode/blob/main/docs/what-it-reads.md) &middot;
[how each language is read, rule by rule](https://github.com/ungovr/lexcode/blob/main/rules/README.md)

## What it writes

`lexcode.json`, an evidence record ([how a scan works](https://lexlint.io/lexcode#how)):

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

| Field | Means |
|---|---|
| `performs` | A rule matched the project's own code doing it |
| `enables` | Only a dependency makes it possible. A dependency is a question, not an answer: a package can be installed and never called |
| `signals` | Weak hints shown as "worth a look". They never affect a result |
| `searched_not_found` | Activities LexCode has rules for and found nothing, with how many rules it tried. That is a finding, not an absence of one. A rule is tried only when the scope holds a file it reads |

`--sarif out.sarif` also writes SARIF 2.1.0 for GitHub code scanning or any
SARIF viewer. `--json` prints the record instead of writing a file.

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

More: [the check in CI](https://lexlint.io/lexcode#check) &middot;
[sample output from real runs](https://lexlint.io/lexcode#samples) &middot;
[how often it agrees with a reader](https://lexlint.io/lexcode#agreement) &middot;
[setting it up in CI](https://github.com/ungovr/lexcode/blob/main/docs/ci.md)

## Your code stays on your machine

- No network call during a scan. The only one is the first-run engine
  download, which `lexcode engine fetch` does on its own for air-gapped setups.
- No source text in the record unless you pass `--snippets`: paths, line
  numbers, rule ids, activity ids and package URLs.
- No telemetry.

More: [privacy on lexlint.io](https://lexlint.io/lexcode#privacy) &middot;
[what the engine writes, and where](https://github.com/ungovr/lexcode/blob/main/docs/privacy.md) &middot;
[what LexCode does not do](https://lexlint.io/lexcode#limits)

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

`lexcode deps` lists the packages LexCode read from the manifests of one or
more repositories (the dependencies `scan` reads: same scope, development
dependencies skipped), with the activities the component map gives each and
the number of repositories each appears in, most first. `--unmapped` keeps
only the packages the map gives no activity: the review list for new map
entries (see [CONTRIBUTING.md](https://github.com/ungovr/lexcode/blob/main/CONTRIBUTING.md)).

### Environment

| Variable | What it does |
|---|---|
| `LEXCODE_ENGINE` | Uses an engine you installed yourself, as `--engine <path>` does. A relative path is resolved against the directory you ran LexCode from, never against the repository being scanned |
| `LEXCODE_CACHE_DIR` | Moves the cache. LexCode refuses an engine directory that another user owns or that group or everyone can write to, since it runs a program from there |
| `LEXCODE_ENGINE_DEADLINE` | Seconds a whole engine run may take (900, 15 minutes, by default). Past it the engine is stopped and the scan fails with exit 2 |
| `LEXCODE_ENGINE_LANES` | How many engine processes a large scan runs at once. By default one per 4 MB of files read, at most 8, and no more than the cores and one per 3 GB of memory allow; each holds its own copy of the rules. `1` runs one process, for a machine short of memory |
| `LEXCODE_RULES_HOME` | Replaces the bundled `rules/` directory (it needs `ruleset.yml`, `classes.yml`, `registry.snapshot.json` and `components/`), for a vendored rule set or a test |
| `NODE_USE_ENV_PROXY=1` | Lets the engine download go through a proxy (Node 22.21 or later). Or fetch the engine on another machine |

## License

The code and the rules are MIT. The engine is Opengrep, under the LGPL-2.1,
run as a separate program and never modified;
[`NOTICE`](https://github.com/ungovr/lexcode/blob/main/NOTICE) says where its
source is. The activity registry snapshot in `rules/` is CC BY 4.0, credit
LexLint (UnGovr). Rules are written here from each activity's definition; see
[CONTRIBUTING.md](https://github.com/ungovr/lexcode/blob/main/CONTRIBUTING.md).
