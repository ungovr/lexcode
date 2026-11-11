# lexcode rule set

This directory is the rule set lexcode runs: one YAML rule per file, one
directory per LexLint activity, positive and negative fixtures beside each rule,
component maps for npm, PyPI, Go, gem and Maven packages under `components/`, and
`classes.yml`, which gives every activity id in the pinned registry snapshot
(`registry.snapshot.json`, CC BY 4.0, credit "LexLint (UnGovr)") one detection
class. Every rule is original to UnGovr and MIT licensed. The recall table below
is measured against the truth sets, per activity.

<!-- recall:start -->
Measured 2026-11-11 over the UnGovr monorepo, 6 pinned starter templates and 2 real apps,
against hand-read answer keys. Found counts evidence of either
kind for the activity or its family; signal only counts the misses where
lexcode showed a worth-a-look row and nothing stronger. Recall is printed,
never gated.

| Activity | Expected | Found | Signal only | Missed in |
|---|---:|---:|---:|---|
| `aggregates_content` | 2 | 0 | 1 | monorepo, nowinandroid |
| `automated_outreach` | 2 | 2 | 0 |  |
| `crawls_web` | 2 | 2 | 0 |  |
| `deploys_chatbot` | 2 | 1 | 0 | canvas-android |
| `distributes_software_product` | 5 | 3 | 0 | nowinandroid, canvas-android |
| `generates_content` | 3 | 2 | 0 | canvas-android |
| `generates_text` | 2 | 1 | 0 | canvas-android |
| `operates_social_platform` | 2 | 0 | 1 | canvas-android, sakai |
| `processes_biometrics` | 1 | 1 | 0 |  |
| `processes_personal_data` | 9 | 9 | 0 |  |
| `processes_voice` | 3 | 3 | 0 |  |
| `records_calls` | 2 | 0 | 0 | monorepo, sakai |
| `records_text_chat` | 2 | 2 | 0 |  |
| `ships_consumer_interface` | 8 | 0 | 2 | vercel-chatbot, nextjs-subscription-payments, obytes-expo, full-stack-fastapi, spring-petclinic, nowinandroid, canvas-android, sakai |
| `ships_encryption` | 6 | 3 | 0 | vercel-chatbot, obytes-expo, full-stack-fastapi |
| `ships_mobile_app` | 4 | 4 | 0 |  |
| `statutory_requests` | 1 | 0 | 1 | monorepo |
| `tracks_devices` | 5 | 4 | 0 | sakai |
<!-- recall:end -->

<!-- canvas:start -->
### Canvas LMS, read with Ruby

Measured 2026-11-11 over `instructure/canvas-lms` at commit `1c9f0bb`, with
lexcode `v1.1` (commit `103181c`), against a person's reading of the same
commit (a hand-made table of what the code does, written before lexcode read
Ruby and kept unchanged). The reading includes 14
activities from code. Before lexcode read Ruby it showed 3 of them.

**Score: 7 of 14 found at evidence strength, 3 signal only, 4 missed. The 4
misses all rest on Ruby evidence alone. 3 false positives. The baseline was 3
of 14.** Of the 7, 4 are found from code that performs the activity and 3 from a
gem or package that enables it. The false positives are one dependency match
(`aws-sdk-bedrockruntime`, which Canvas uses for embeddings), one signal
(`lexcode.outreach.rb-send-in-background-job`, an administrator's job-status
email) and the Kaltura signal on `processes_biometrics`
(`lexcode.biometric.device-biometric-prompt`) that the baseline already had. No
Ruby rule fired where the reading found nothing. Beyond the 14, lexcode reports
`ships_encryption` (held in the registry; `gems/canvas_security` and
`ui/shared/encrypted-forage`, which is what the reading names as standard
crypto) and nothing for the activities the reading found none of. Recall is
printed, never gated.

| Activity | The reading | lexcode | Verdict |
|---|---|---|---|
| `processes_personal_data` | include: `app/controllers/application_controller.rb:453` (Pendo payload with email and name), `app/models/user.rb:1709` (MD5 of email to Gravatar) | found, 12 performs and 4 enables; `lexcode.personal.rb-third-party-person` at `app/models/user.rb:1709` | Found, on the same code the reading cites. The other 11 performs matches (permitted `:email` params, `request.remote_ip` stored and logged, the `pseudonym` sign-in model, schema columns) also hold personal data. The Pendo payload at `:453` is not itself matched |
| `ships_consumer_interface` | include: `app/models/course.rb:1266` (`public_courses`), `app/views/layouts/application.html.erb` | signal only, 1 match; `lexcode.consumer.rb-signup-route` at `config/routes.rb:1009` | Signal only. The evidence is other code: a self-registration route, which the reading calls an institution-level switch. The public-course scope and the layout are not matched |
| `automated_outreach` | include: `app/models/message.rb:1058` (`deliver_via_email`), `:1119` (`deliver_via_push`), SNS at `app/models/notification_endpoint.rb:38` | found, enables, 1 match; `pkg:gem/aws-sdk-sns` at `Gemfile.d/app.rb:39`. Also a signal at `lib/support_helpers/fixer.rb:77` | Found by dependency, and it is the SNS client the reading cites. No performs rule fired on `message.rb`. The signal is a **false positive**: a one-off status email to the staff member who ran a support fixer, not outreach to people |
| `records_text_chat` | include: `app/models/conversation_message.rb:21`, `app/services/ai_experiences/conversation_continue_service.rb:49` | missed (searched, not found) | Missed. Ruby evidence only: Inbox messages are saved with `ConversationMessage.new` in `conversation.rb:339`, and the AI transcript goes through Canvas's own HTTP client (`@client.post(".../messages/add")`), neither a shape the chat rules name |
| `records_calls` | include: `app/models/big_blue_button_conference.rb:193` (`:record => settings[:record]`) | found, performs, 1 match; `lexcode.calls.rb-bigbluebutton-record` at `app/models/big_blue_button_conference.rb:187` | Found, on the same code: the match starts at the request hash on `:187` that holds the `:record` key at `:193` |
| `tracks_devices` | include: `ui/shared/pendo/index.ts:137` (Pendo), the Datadog RUM partial, `ui/boot/initializers/initSentry.ts:36` | found, enables, 4 matches; `@pendo/agent` (`package.json:118`), `@sentry/react` (`package.json:123`), `sentry-rails`, `sentry-inst_jobs` | Found, now including Pendo, the baseline's miss. Dependencies only: the code that loads them is not matched, and the Datadog RUM script tag in the ERB partial is not read |
| `processes_voice` | include: `speed_grader.tsx:1231`, `media_tracks_controller.rb:153` (ASR captions), `packages/canvas-media/src/MediaRecorder.js:31` | found, performs, 1 match; `lexcode.voice.speech-recognition-start` at `ui/features/speed_grader/jquery/speed_grader.tsx:1264` | Found, unchanged from the baseline: the `recognition.start()` call, in the same block as the reading's constructor. The Ruby ASR route and the media recorder are not matched |
| `deploys_chatbot` | include: `app/services/ai_experiences/conversation_continue_service.rb:49`, `app/models/ai_experience.rb:20`, `lib/llm_conversation/http_client.rb:124` | missed (searched, not found) | Missed. Ruby evidence only: the conversation goes through Canvas's own `Net::HTTP` client, with a `role: "User"` payload that no chat rule's model-call shape matches |
| `generates_content` | include: `app/services/study_assist.rb:228`, `app/models/discussion_topic_insight.rb:122`, `app/controllers/discussion_topics_api_controller.rb:1385`, `app/controllers/wiki_pages_api_controller.rb:716`, `app/services/rubric_llm_service.rb:215` (all `CedarClient`) | found, enables, 2 matches; `pkg:gem/inst_llm` (`Gemfile.d/app.rb:65`) and `pkg:gem/aws-sdk-bedrockruntime` (`:36`) | Found on `inst_llm`, which Canvas calls at `discussion_topic_insight.rb:82` and `discussion_topics_api_controller.rb:1408`. The `aws-sdk-bedrockruntime` match is a **false positive**: Canvas uses that client only to make embeddings for smart search (`lib/smart_search.rb:48`) |
| `generates_text` | include: same call sites as `generates_content`; `lib/translation.rb:77` | missed (searched, not found) | Missed. Ruby evidence only: `CedarClient.prompt` is a Canvas class, and the one real model call is `InstLLMHelper.client(id).chat([messages], **options)`, a positional-array form that the chat rules do not list. No gem entry gives `inst_llm` this activity |
| `aggregates_content` | include: `lib/external_feed_aggregator.rb:89` (`CanvasHttp.get(feed.url)`), scheduled at `config/initializers/periodic_jobs.rb:114` | found, performs 1 and enables 1; `lexcode.aggregate.rb-feedjira-parse` at `lib/external_feed_aggregator.rb:68`, `pkg:gem/feedjira` (`Gemfile.d/app.rb:96`) | Found, in the same file and the same feed pipeline: `Feedjira.parse` on the body fetched at `:89` |
| `crawls_web` | include: `lib/external_feed_aggregator.rb:89`, `lib/course_link_validator.rb:318` (`CanvasHttp.head`, then `get`) | missed (searched, not found) | Missed. Ruby evidence only: both fetches go through `CanvasHttp`, a Canvas class that no rule names, and the feed fetch is not inside a loop over a URL list |
| `operates_social_platform` | include: `app/models/discussion_entry.rb:21`, `app/models/discussion_topic.rb:20`, `app/models/conversation_message.rb:21` | signal only, 1 match; `lexcode.social.rb-direct-message` at `app/models/conversation_message.rb:30` | Signal only, in a file the reading cites (the Inbox message model). The discussion models are not matched |
| `distributes_software_product` | include: `LICENSE:1` (AGPL), `Dockerfile.production:7`, `README.md:11` install section | signal only, 89 matches (58 `rb-gemspec`, 31 `rb-gem-tasks`) over 53 `gems/*` directories, from `gems/activesupport-suspend_callbacks` on | Signal only, from other code: the repository's internal gems, which Canvas loads by path. The rule's own message says a gemspec may never be published. The reading's evidence (license, production Dockerfile, install section) is still not read. The baseline's miss, now a signal |
<!-- canvas:end -->

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
is read only as a manifest; `gems.rb` and the `.rb` files a Gemfile pulls in are
read both ways.

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

### A known residual: `rb-gemspec-published`

`lexcode.distribute.rb-gemspec-published` (activity
`distributes_software_product`) reads a gemspec that fills in published-gem
metadata such as `source_code_uri` or `rubygems_mfa_required`. An internal
engine kept inside a monolith can set either, with a `source_code_uri` that
points into the monolith's own tree, and so reads as a distributed product.
Telling an in-repo path gem from a published one is not done yet.

## Java, Kotlin, JSP and the Maven ecosystem

How lexcode reads Java and Kotlin, where the engine cannot, and what a Maven or
Gradle manifest counts. Maven and Gradle share one ecosystem, `maven`: both
resolve from Maven repositories, a dependency is named `<groupId>:<artifactId>`,
its package URL is `pkg:maven/<groupId>/<artifactId>@<version>`, and one
component map (`components/maven.yml`) serves both. Its evidence rule id is
`lexcode.manifest.maven`. Nothing is fetched: a parent POM, BOM or Gradle plugin
that is not in the repository is not read.

### Maven

Every `pom.xml` is read with a small element reader (comments, CDATA,
processing instructions and the five XML entities are handled; no XML library
is added). A dependency's version resolves in this order: its own `<version>`,
then `<dependencyManagement>` up the parent chain inside the repository,
including a BOM imported with `<scope>import</scope>` when that BOM's pom is in
the repository. `${...}` resolves from the pom's `<properties>`, then
`project.version`, `project.groupId` and `project.parent.version` (with their
`pom.` and bare `version` aliases), then the parent chain. The parent is the
`<relativePath>` file (default `../pom.xml`) when that file is the named parent,
else a scanned pom with the parent's `groupId:artifactId`.

Whatever is left unresolved is recorded without a version, and the reader gives
one notice per kind for the whole scan, never one per dependency: `N Maven
dependencies take their version from a parent POM or BOM outside this
repository; recorded without a version`, and `N Maven dependencies have a
version lexcode cannot resolve (an undefined property or no managed version);
recorded without a version`. A Spring Boot app whose versions all come from
`spring-boot-starter-parent` reads as the first notice, once.

Scopes: `test` is skipped and counted. `compile`, `runtime`, `provided`,
`system` and optional dependencies count. Dependencies under `<build>` (plugins
and their dependencies) and `<reporting>` are not read; those under
`<profiles>` are. A dependency on another module of the same repository is the
app's own code and is not recorded.

### Gradle

Every `build.gradle` and `build.gradle.kts` is read as tokens, with braces
counted, and never evaluated. Only a declaration directly inside a
`dependencies {}` block counts, and nothing inside `buildscript {}`,
`plugins {}`, `pluginManagement {}` or `constraints {}` is a dependency. A
closure after a declaration (`implementation('g:a:v') { exclude group: 'x' }`)
does not end the block, and its `exclude` is not read as a dependency.

The forms read are `conf "g:a:v"`, `conf("g:a:v")`, `conf('g:a:v') { ... }`,
`conf group: 'g', name: 'a', version: 'v'`, `conf(group = "g", name = "a",
version = "v")`, `"conf"("g:a:v")`, `add("conf", "g:a:v")`, and catalog
accessors (`conf(libs.x.y)`, `conf libs.x.y`, `libs.bundles.z`). `project(...)`,
`files(...)`, `fileTree(...)`, `platform(...)`, `enforcedPlatform(...)` and
`kotlin("...")` name no component and are not recorded.

A configuration is development, skipped and counted, when a camel-case segment
of its name is `test` or `debug` (so `testImplementation`,
`androidTestImplementation`, `testFixturesApi` and `debugImplementation`), or
when its name is `kapt`, `ksp` or `annotationProcessor` or starts with one of
them followed by a capital (`kaptTest`, `kspJvm`), or is `lintChecks`,
`lintPublish`, `detektPlugins` or `ktlint`. Everything else counts, flavor
prefixes included (`releaseImplementation`, `fdroidImplementation`,
`compileOnly`).

`$name` and `${name}` in a coordinate resolve from the same file (`val name =`,
`def name =`, `ext.name =`, `ext { name = }`, `extra["name"] =`), then the root
build file's `ext`, then `gradle.properties` beside the file and at the build
root. A version that stays unresolved is recorded without a version, and one
notice counts those (`N Gradle dependencies have no version lexcode can read
(a platform BOM, a plugin or a computed value); recorded without a version`).
A group or artifact that stays unresolved skips the dependency, and a different
notice counts it (`N Gradle dependencies name their group or artifact through a
value lexcode cannot read; skipped`). Two more notices count what is left out:
a dependency named by a constant or variable lexcode does not evaluate (`not
recorded`), and a catalog reference that matches no library in a catalog
lexcode can read (`skipped`).

A version catalog, `gradle/*.versions.toml` at the build root (the directory
holding `settings.gradle(.kts)`, else the scan root), is named by its file
stem. Accessors are lowercased, and `-`, `_` and `.` count as the same
separator. Library entries may be `"g:a:v"`, `{ module = "g:a", version.ref =
"k" }`, `{ group, name, version }` or a version table (`strictly`, then
`require`, then `prefer`). A catalog entry is recorded only where a build file
references it, at the referencing line; an entry nothing references is not a
dependency.

Convention plugins are read too. The build files under `buildSrc/`,
`build-logic/` and any directory `settings.gradle(.kts)` names in
`includeBuild("...")` are build tooling: their own dependencies are skipped and
counted. Their `.kt` and `.kts` sources are read for `findLibrary("alias")` and
`findBundle("alias")` literals, recorded under the configuration named on the
same line (`add("conf", ...)`, `"conf"(...)`), else `implementation`. A
reference such as `Libs.OKHTTP` in a build file is read from the `object`
constants those sources declare. A module a settings file moves with
`project(':x').projectDir = ...` is followed to its new directory.

Known gaps: Gradle lockfiles (`gradle.lockfile`) are not read, because a
lockfile lists transitive dependencies with no way to tell the direct ones, and
few apps commit one. `apply from:` scripts and `.groovy` sources under `buildSrc` are not read, and
neither are the dependency declarations of precompiled `*.gradle.kts` plugins
(their `findLibrary` and `findBundle` literals are). A coordinate built by
string concatenation is not recorded. A dependency whose version comes from a
BOM, or from a parent outside the repository, is recorded without a version.
JVM Test Suite dependencies (`testing { suites { ... } }`) count as production.

### The Java gate exemption

The release test requires every evidence-class activity to have a Java rule and
a Kotlin rule. One Java exemption stands: `distributes_software_product`, whose
JVM evidence lives in build files, is met by a `maven-` or `gradle-` rule.

### Java and Kotlin files

Test source sets are left out like `test`: the directories `androidTest`,
`testFixtures` and `integrationTest` are skipped unless `--include-tests`. The
`samples`, `example` and `demo` path excludes some rules use are not used on
Java or Kotlin source rules, because the engine's path globs also match package
paths (`com.google.samples.apps`, `org.springframework.samples`,
`com.example`) and would drop a whole app.

The engine reads Kotlin with a parser that drops some constructs (measured on
Opengrep 1.33.1): `value class`, `fun interface`, the `..<` range, some `in`
and `->` forms in `when` branches, soft keywords used as identifiers, and
`object : T by it`. The rest of such a file still matches, but a match inside
the dropped construct is missing. The engine reports the file as partly parsed,
and the scan counts it and says so in the record: `the engine could not read N
files; their evidence is missing from this record`. Two engine limits shape the
rules. A class literal in a pattern matches every class literal, so a rule does
not key on one. A wildcard import binds no class, so a rule that guards on an
import keeps its list of names for the wildcard arm.

The definitions the rules follow, one line each:

- The platform's own crypto (the JDK's and Android's) is not
  `ships_encryption`; a bundled library that encrypts is, and bundled password
  hashing is a signal.
- Signing a PDF with a key is a signal.
- An Android app is `ships_mobile_app` evidence only; it says nothing else.
- Publishing to GitHub Packages is not `distributes_software_product`.
- A Spark feature transformer is not training.
- A WebRTC audio callback is a signal for `records_calls`.
- An `ANDROID_ID` read counts as `tracks_devices` only when it is sent off the
  device; starting a crash-reporting SDK counts.
- "Transcript" alone is not chat.

### JSP

`.jsp`, `.jspf` and `.tag` files join the `<script>` block extraction used for
Vue, Svelte, HTML, Jinja and ERB, and the block is read as JavaScript. Inside a
block, `<%= ... %>` becomes `_` padded with spaces to its length, every other
`<% ... %>` tag becomes spaces, a `<%-- ... --%>` comment runs to `--%>`, and EL
(`${...}`, `#{...}`) becomes `_` padded, with line breaks kept so line numbers
hold. A namespaced tag inside a script body (a JSF component such as `<h:outputText
value="#{msgs.x}"/>`, a JSTL action such as `<c:if test="${a}">` or `</c:if>`,
`<jsp:expression>`: `<` or `</`, a prefix, a colon, a name, up to its closing
`>`, past quoted values) also becomes `_` padded, so it stays valid JavaScript
in a string and in an expression; `<![CDATA[` and a `]]>` that closes it become
spaces. A comparison such as `a < b:c`, an unprefixed HTML tag and a namespaced
tag with no closing `>` are left alone. A `<script>` inside a JSP comment is
still read, because extraction finds the element before the comment is blanked.
Thymeleaf templates are `.html` and already read; FreeMarker and Velocity
templates are not read.
