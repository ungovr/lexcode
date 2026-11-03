export const USAGE = `lexcode: local evidence of what a repository's code does, in LexLint's activity vocabulary

  lexcode scan   [path] [--out lexcode.json] [--json] [--sarif out.sarif] [--snippets] [--rules <dir>]...
                 [--config .lexcode.yml] [--engine <path>] [--include-tests]
  lexcode check  [path] [--declaration lexlint.yml|ACTIVITIES.md] [--config .lexcode.yml] [--fail-on-enables]
                 [--include-tests] [--allow-undeclared] [--sarif out.sarif] [--out lexcode.json] [--snippets]
                 [--rules <dir>]... [--engine <path>] [--json] [--quiet]
  lexcode explain <activity-id | rule-id | purl>... [--rules <dir>]... [--json]
  lexcode rules  [--rules <dir>]... [--json]
  lexcode engine fetch | path | verify
  lexcode version

Exit codes: scan 0 or 2; check 0 (no drift), 1 (drift), 2 (tool error), 3 (no declaration).
`;
