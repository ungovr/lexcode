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
npx lexcode scan            # writes lexcode.json in the repository root
npx lexcode check           # compares the code with your declaration
```

Node 20 or later. On first run lexcode downloads the analysis engine it is
pinned to (Opengrep, about 40 MB) from the Opengrep GitHub release, checks its
sha256 against the value shipped in this package, and caches it. The engine
unpacks itself under lexcode's own cache directory the first time it runs
(see Privacy for everything the engine writes and where).

To scan code you do not trust (a stranger's clone, a pull request, an unpacked
archive), run lexcode from outside it, with a copy you chose:
`cd ~ && npx lexcode@1 scan /path/to/repo`. npm honors a project's `.npmrc`
`registry=` line and a local `lexcode` dependency, so `npx lexcode` run inside
an untrusted repository may run something other than this package. lexcode
itself never runs a program from the scanned directory (see Privacy).

## What it reads

Files tracked by git or trackable by it, honoring `.gitignore`. Outside a git
work tree lexcode walks the directory instead, and then also leaves out
virtual environments (`.venv`, `venv` and `env` where a `pyvenv.cfg` says they
are one), `site-packages`, `__pycache__`, `.tox`, `.nox`, `.mypy_cache`,
`.pytest_cache`, `.next`, `.nuxt`, `.svelte-kit`, `target`, `.gradle`, `Pods`
and `.terraform`, and applies the simple patterns of the root `.gitignore`: a
name, `dir/`, a glob such as `*.ext`, and a leading `/`. Negations (`!pattern`)
are not supported, and neither is a `.gitignore` below the root; the scan says
so in a notice. Never
`node_modules`, `vendor`, `dist`, `build` or `.git`, never minified or bundled
files (including any named `*.min.js`, `*.bundle.js`, `vendor.*.js` or
`*.vendor.js`), never a file with a line over 100,000 characters (generated
code, counted in a notice), never symbolic links, never files over 5 MB, and never directories
named `test`, `tests`, `__tests__`, `spec`, `fixtures` or `testdata` unless you
pass `--include-tests`. `app.scope` in `lexlint.yml` narrows the read, as the
lint reads it.

Languages: TypeScript, JavaScript (with JSX and TSX), Python and Go, plus the
`<script>` blocks of Vue, Svelte, HTML and Jinja files. Manifests: npm
(`package.json` with `package-lock.json`, `pnpm-lock.yaml` or `yarn.lock`),
PyPI (`pyproject.toml`, `requirements*.txt`, `uv.lock`, `poetry.lock`) and Go
(`go.mod`).

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
  with how many rules it tried. That is a finding, not an absence of one.

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
lexcode engine fetch | path | verify
lexcode version
```

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

`LEXCODE_RULES_HOME=<dir>` replaces the bundled `rules/` directory (it needs `ruleset.yml`, `classes.yml`, `registry.snapshot.json` and `components/`), for a vendored rule set or a test.

CI: see [docs/ci.md](docs/ci.md).

## License

The code and the rules are MIT. The engine is Opengrep, under the LGPL-2.1,
run as a separate program and never modified; `NOTICE` says where its source
is. The activity registry snapshot in `rules/` is CC BY 4.0, credit LexLint
(UnGovr). Rules are written here from each activity's definition; see
[CONTRIBUTING.md](CONTRIBUTING.md).
