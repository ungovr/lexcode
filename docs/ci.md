# lexcode in CI

One step checks the committed declaration against the code:

```yaml
- run: npx lexcode@1 check --sarif lexcode.sarif
- uses: github/codeql-action/upload-sarif@v3   # optional: shows the evidence in code scanning
  if: always()
  with: { sarif_file: lexcode.sarif }
```

The step fails (exit 1) when the code performs an activity the declaration
does not carry, or says it does not do. A dependency that only enables an
activity warns, and fails only under `--fail-on-enables`.

In CI, pin the major version (`lexcode@1`, as above) and run it from the
workspace root only for a repository you trust. To scan code you do not trust
(a pull request from a fork, an unpacked archive), run it from outside that
code: `cd ~ && npx lexcode@1 scan /path/to/repo`. npm honors a project's
`.npmrc` `registry=` line and a local `lexcode` dependency, so `npx lexcode`
run inside an untrusted repository may run something other than this package.

## No declaration is a failure

A repository with neither `ACTIVITIES.md` nor `lexlint.yml` exits 3. A team
that adopts the check has declared; a team that has not should learn it from
a red build, not a green one. During a staged rollout, `--allow-undeclared`
turns that into a warning.

## Cache the engine

The engine is downloaded once per machine. On hosted runners, cache it:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/lexcode
    key: lexcode-engine-${{ runner.os }}-1.33.1
- run: npx lexcode@1 engine fetch
- run: npx lexcode@1 check
```

Or set `LEXCODE_CACHE_DIR` to a cached directory of your choice.

## Reading a failure

Each FAIL names the activity, up to three `file:line` locations with the rule
that matched, and the activity's one-line definition. Either the declaration
is missing something (add it to `ACTIVITIES.md` or `lexlint.yml`), or the
match is wrong for your code (add an `ignore` with a `reason` to
`.lexcode.yml`, and tell us at https://github.com/ungovr/lexcode/issues so the
rule can be narrowed).
