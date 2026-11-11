# lexcode rule set

This directory is the rule set lexcode runs: one YAML rule per file, one
directory per LexLint activity, positive and negative fixtures beside each rule,
component maps for npm, PyPI, Go and gem packages under `components/`, and
`classes.yml`, which gives every activity id in the pinned registry snapshot
(`registry.snapshot.json`, CC BY 4.0, credit "LexLint (UnGovr)") one detection
class. Every rule is original to UnGovr and MIT licensed. The recall table below
is measured against the truth sets, per activity.

<!-- recall:start -->
Measured 2026-11-10 over the UnGovr monorepo and four pinned starter
templates, against hand-read answer keys. Found counts evidence of either
kind for the activity or its family; signal only counts the misses where
lexcode showed a worth-a-look row and nothing stronger. Recall is printed,
never gated.

| Activity | Expected | Found | Signal only | Missed in |
|---|---:|---:|---:|---|
| `aggregates_content` | 1 | 0 | 1 | monorepo |
| `automated_outreach` | 1 | 1 | 0 |  |
| `crawls_web` | 1 | 1 | 0 |  |
| `deploys_chatbot` | 1 | 1 | 0 |  |
| `distributes_software_product` | 2 | 2 | 0 |  |
| `generates_content` | 2 | 2 | 0 |  |
| `generates_text` | 1 | 1 | 0 |  |
| `processes_biometrics` | 1 | 1 | 0 |  |
| `processes_personal_data` | 5 | 5 | 0 |  |
| `processes_voice` | 1 | 1 | 0 |  |
| `records_calls` | 1 | 0 | 0 | monorepo |
| `records_text_chat` | 1 | 1 | 0 |  |
| `ships_consumer_interface` | 4 | 0 | 1 | vercel-chatbot, nextjs-subscription-payments, obytes-expo, full-stack-fastapi |
| `ships_encryption` | 4 | 1 | 0 | vercel-chatbot, obytes-expo, full-stack-fastapi |
| `ships_mobile_app` | 2 | 2 | 0 |  |
| `statutory_requests` | 1 | 0 | 1 | monorepo |
| `tracks_devices` | 2 | 2 | 0 |  |
<!-- recall:end -->

## Ruby, ERB views and gems

How lexcode reads Ruby, where the engine cannot, and what a gem manifest counts.

### Gems

`Gemfile` (or `gems.rb`) is read line by line for its groups and line numbers;
nothing in it is run. The lockfile beside it (`Gemfile.lock`, or `gems.locked`)
is the authority on which gems are direct and at what version: its
`DEPENDENCIES` section lists every direct gem, however a Gemfile computed its
list in code; a gem listed there that no Gemfile file names is recorded at its
lockfile line. The Gemfile files read are `Gemfile` or `gems.rb`, the target of
any `eval_gemfile` with a literal path, and every `Gemfile.d/*.rb` beside a
Gemfile whose text names `Gemfile.d`. A Gemfile gem missing from an existing
lockfile is recorded without a version, and one notice per Gemfile names those
gems (the first 10, then a count); a Gemfile with no lockfile beside it gives
one notice saying how many gems were recorded without a version. Gems in the
`development` and `test` groups are skipped and counted. A version with a platform suffix (`1.16.0-x86_64-linux`) is read as the
part before the first `-`, and variants of one gem collapse into one dependency.

A `*.gemspec` counts too. Its `add_dependency` and `add_runtime_dependency`
gems are direct dependencies; `add_development_dependency` gems are skipped and
counted. A gemspec beside a Gemfile (or in a directory the Gemfile's `gemspec`
line points at) takes its versions from that Gemfile's lockfile; a gemspec with
no Gemfile takes them from the nearest lockfile above it, and records no
version when there is none. A gemspec states ranges by design, so a gem that has
no locked version is recorded without one and without a flag. A gem named in
both a Gemfile and a gemspec of the same directory is recorded once, at the
Gemfile line. The gem a gemspec itself defines is not one of its own
dependencies, even though the lockfile's `DEPENDENCIES` section lists it.

### Ruby files

The engine takes only `.rb` as Ruby: given as explicit targets, an
extension-less `Fastfile` and a `.rake`, `.ru` or `.gemspec` file each scanned
0 files (measured 2026-11-10). So the Ruby rules read these files in two ways.
A `.rb` file is scanned as it is. A `.rake`, `.ru` or `.gemspec` file, and an
extension-less `Rakefile`, `Fastfile`, `Appfile` or `Capfile`, is copied whole
to `<path>.lexcode.rb` in lexcode's temporary directory and scanned there; a
finding in the copy is reported against the original path and line. A `Gemfile`
is read as a manifest, not scanned as Ruby code.

### ERB views

An `.erb` file (so `.html.erb`) joins the `<script>` block extraction used for
Vue, Svelte, HTML and Jinja. Inside a `<script>` block, an ERB output tag
(`<%=`, `<%==`) becomes `_` padded with spaces to the tag's length, so the
JavaScript around it still parses; every other tag (`<%`, `<%-`, `<%#`) becomes
spaces. Line breaks are kept, so line numbers hold. `<%%` is a literal and is
left. A tag ends at the first `%>`, as ERB ends it; one that never ends is
blanked to the end of the block. The Ruby inside an ERB tag is never scanned,
and an ERB file with no `<script>` block gives the scan nothing.

### A known residual: `rb-direct-message`

`lexcode.social.rb-direct-message` (activity `operates_social_platform`) looks
for a model that belongs to a recipient or a conversation and to a sender or an
author, in a class named like a message. A support or assistant chat, or a CRM
that stores messages with sender and author keys, has that shape, so it can
still raise the `operates_social_platform` signal. It is a worth-a-look row and
never fails CI.
