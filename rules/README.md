# lexcode rule set

This directory is the rule set lexcode runs: one YAML rule per file, one
directory per LexLint activity, positive and negative fixtures beside each rule,
component maps for npm, PyPI, Go and gem packages under `components/`, and
`classes.yml`, which gives every activity id in the pinned registry snapshot
(`registry.snapshot.json`, CC BY 4.0, credit "LexLint (UnGovr)") one detection
class. Every rule is original to UnGovr and MIT licensed. The recall table below
is measured against the truth sets, per activity.

<!-- recall:start -->
Measured 2026-11-11 over the UnGovr monorepo and the pinned starter
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
| `processes_personal_data` | 6 | 6 | 0 |  |
| `processes_voice` | 1 | 1 | 0 |  |
| `records_calls` | 1 | 0 | 0 | monorepo |
| `records_text_chat` | 1 | 1 | 0 |  |
| `ships_consumer_interface` | 5 | 0 | 2 | vercel-chatbot, nextjs-subscription-payments, obytes-expo, full-stack-fastapi, bullet-train |
| `ships_encryption` | 5 | 1 | 0 | vercel-chatbot, obytes-expo, full-stack-fastapi, bullet-train |
| `ships_mobile_app` | 2 | 2 | 0 |  |
| `statutory_requests` | 1 | 0 | 1 | monorepo |
| `tracks_devices` | 2 | 2 | 0 |  |
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
| `generates_text` | include: same call sites as `generates_content`; `lib/translation.rb:77` | missed (searched, not found) | Missed. Ruby evidence only: `CedarClient.prompt` is a Canvas class, and the one real model call is `InstLLMHelper.client(id).chat([messages], **options)`, a positional-array form that the chat rules do not list. By design no gem entry gives `inst_llm` this activity: like every LLM SDK in the npm, PyPI and gem maps, it enables the family parent, `generates_content` (found above), and no source rule is written for a client only Instructure's own products use |
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

### Model output a view, a partial or a broadcast shows

The six Ruby rules that find model output sent back in a response (text,
images, speech, video, and Gemini and Langchain.rb content) count these shapes
beside the explicit `render json:`, `send_data`, stream and broadcast calls.
The six share one set of these sinks, and a unit test holds them to it, so the
negative fixtures beside the text rule stand for all six.

- **An instance variable a Rails controller action sets**: `@summary =
  response.dig(...)`, `||=`, `<<`, `+=`, or an attribute of one
  (`@post.summary = ...`). Rails renders the action's template when the action
  names no other response, and the template shows the variable. The class must
  be named like a controller (`...Controller`, any namespace). A method that
  calls `redirect_to`, `redirect_back`, `redirect_back_or_to` or `head`
  anywhere in its body is skipped, since it renders no view on that path.
- **An instance variable a Sinatra route sets** (`get`, `post`, `put`,
  `patch` or `delete` with a block, with or without options after the path)
  when the route renders a template (`erb`, `haml`, `slim`, `liquid`,
  `markdown`, `builder`, `rabl` or `mustache`).
- **A Sinatra route's value**: the block's last statement is the response
  body. A last statement that only hands the text on has that call's value,
  not the text, and does not count: a log call, `puts`, `print`, `p`, `pp` or
  `warn`, and a `write`, `create`, `save`, `update`, `insert`, `upsert`,
  `perform_later`, `perform_async`, `deliver`, `enqueue`, `publish`, `post`,
  `append`, `push`, `notify` or `send_message` call.
- **A partial**: `render partial:` or `render locals:`.
- **The response body set directly**: `response.body =`, or
  `self.response_body =` in `ActionController::Metal`.
- **A broadcast**: a channel's `broadcast_to`, a Turbo `broadcast_append`,
  `prepend`, `replace`, `update`, `before`, `after`, `render`, `action` or
  `refresh` call (any `_to` or `_later` form), or any
  `Turbo::StreamsChannel` broadcast. A record updated with the output
  (`record.update(content: ...)` or `update!`) carries it, so a broadcast of
  that record counts. A `broadcast_remove` shows nothing and does not count,
  in either form.

Views are not read, so lexcode does not check that a template uses the
variable. A chat object or model client kept in an instance variable is not
the output and does not count, whether it is built in the assignment
(`@chat = RubyLLM.chat(...)`, `@llm = Langchain::LLM::OpenAI.new(...)`,
`@assistant = Langchain::Assistant.new(...)`) or in a local variable of the
same method first (`chat = RubyLLM.chat; @chat = chat`).

Known residuals:

- A helper method that sets an instance variable counts even when the action
  that calls it redirects, since the redirect is in another method. Over 80
  real Rails controllers, each of the 4 such cases saved the output to a
  record that the redirect target shows, so the output reached the person,
  but not through that variable.
- An action that sets the variable and then renders something else
  (`render json: { ok: true }`, `send_data`) still counts it.
- A chat object built with a chain such as
  `RubyLLM.chat.with_instructions(...)`, or returned from another method, and
  kept in an instance variable still counts.
- A Sinatra route whose value comes from an `if` or `case` branch is not read.
- Output read with `dig` inside a hash, array or string literal
  (`@r = { text: response.dig(...) }`) is not matched as an instance variable's
  value, though `response.content` in the same place is.
- A broadcast a model declares for itself (`broadcasts_to`, an
  `after_create_commit` callback) is in another file and is not read, and
  output saved to a record that a later request shows is not counted.

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
