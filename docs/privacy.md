# Privacy, and what the engine writes

The short version is in the [README](../README.md#your-code-stays-on-your-machine).

Your code never leaves your machine. lexcode makes no network call during a
scan; its one network call is the first-run download of the engine it is
pinned to, which `lexcode engine fetch` does on its own for air-gapped setups.
The record holds paths, line numbers, rule ids, activity ids and package URLs,
and no source text unless you pass `--snippets`; a manifest that does not
parse is reported by line and column, never by quoting it. lexcode has no
telemetry.

## What the engine writes, and where

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
redirected.

## What it runs

lexcode runs `git ls-files` in the directory it scans, as the program found on
`PATH` (never one in the current or scanned directory), and tells git to
ignore the repository's own `core.fsmonitor`, `core.untrackedCache` and
`core.excludesFile` settings, so a `.git/config` that came from someone else
cannot run a program or point it at a file. lexcode itself never runs a
program from the scanned directory.
