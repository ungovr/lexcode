# lexcode rule set

This directory is the rule set lexcode runs: one YAML rule per file, one
directory per LexLint activity, positive and negative fixtures beside each rule,
component maps for npm, PyPI, Go, gem and Maven packages under `components/`, and
`classes.yml`, which gives every activity id in the pinned registry snapshot
(`registry.snapshot.json`, CC BY 4.0, credit "LexLint (UnGovr)") one detection
class. Every rule is original to UnGovr and MIT licensed. The recall table below
is measured against the truth sets, per activity.

<!-- recall:start -->
Measured 2026-11-12 over the UnGovr monorepo, 9 pinned starter templates and 3 real apps,
against answer keys, each read by an agent that had not seen the rules.
Found counts evidence of either kind for the activity or its family; signal
only counts the misses where lexcode showed a worth-a-look row and nothing
stronger. Recall is printed, never gated.

| Activity | Expected | Found | Signal only | Missed in |
|---|---:|---:|---:|---|
| `aggregates_content` | 3 | 0 | 1 | monorepo, nowinandroid, moodle |
| `automated_outreach` | 4 | 1 | 0 | symfony-demo, moodle, sakai |
| `crawls_web` | 3 | 1 | 0 | moodle, sakai |
| `deploys_chatbot` | 2 | 1 | 0 | canvas-android |
| `distributes_software_product` | 6 | 3 | 0 | nowinandroid, canvas-android, moodle |
| `generates_content` | 4 | 2 | 0 | canvas-android, moodle |
| `generates_images` | 1 | 0 | 0 | moodle |
| `generates_text` | 3 | 1 | 0 | canvas-android, moodle |
| `operates_social_platform` | 4 | 0 | 0 | symfony-demo, canvas-android, moodle, sakai |
| `processes_biometrics` | 1 | 1 | 0 |  |
| `processes_personal_data` | 13 | 6 | 0 | spring-petclinic, nowinandroid, symfony-demo, wave, canvas-android, moodle, sakai |
| `processes_voice` | 4 | 2 | 1 | canvas-android, moodle |
| `records_calls` | 3 | 0 | 0 | monorepo, moodle, sakai |
| `records_text_chat` | 3 | 1 | 0 | moodle, sakai |
| `ships_consumer_interface` | 12 | 0 | 2 | vercel-chatbot, nextjs-subscription-payments, obytes-expo, full-stack-fastapi, bullet-train, spring-petclinic, nowinandroid, symfony-demo, wave, canvas-android, moodle, sakai |
| `ships_encryption` | 10 | 1 | 0 | vercel-chatbot, obytes-expo, full-stack-fastapi, bullet-train, symfony-demo, wave, canvas-android, moodle, sakai |
| `ships_mobile_app` | 4 | 4 | 0 |  |
| `statutory_requests` | 1 | 0 | 1 | monorepo |
| `tracks_devices` | 6 | 2 | 0 | nowinandroid, wave, canvas-android, sakai |
| `trains_models` | 1 | 0 | 0 | moodle |
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

<!-- sakai:start -->
### Sakai, read with Java and the Maven manifest

Measured 2026-11-11 over `sakaiproject/sakai` at commit `f86a5cb`, with lexcode
`v1.2` (branch build at commit `703f059`), against a reading of the same
commit by an agent that had not seen the Java rules (the key's own header calls
it unreviewed), kept unchanged. The reading includes 11 activities from code, marks 12 as
absent and leaves 3 unsure. lexcode read 17,074 files (6,561 of them Java) and
1,067 script copies drawn from HTML, JSP and Vue files, in 141 seconds and
1.6 GB, and the check reports 0 FAIL.

**Score: 7 of 11 found at evidence strength, one of them on other evidence, 1 signal only, 3 missed. No
evidence contradicts a row the reading marks absent, and the 3 unsure rows
(`relies_on_digital_identity`, `aggregates_content`, `processes_biometrics`)
drew nothing, so they are neither found nor missed.** Of the 7, 4 are found on
the code the reading cites (`automated_outreach`, `records_text_chat`,
`processes_voice`, `ships_encryption`), 2 on other code in the same product
(`processes_personal_data`, `distributes_software_product`) and 1 on other
evidence (`crawls_web`: a Playwright dependency in Sakai's browser-test module,
not the calendar fetcher the reading cites). The Java rules read every Java
file: the engine reported no Java parse error, and its 17 unread files are 16
JavaScript files (5 read directly and 11 script copies, mostly Thymeleaf and JSP
markup left inside a script) and one properties file. Recall is
printed, never gated.

| Activity | The reading | lexcode | Verdict |
|---|---|---|---|
| `processes_personal_data` | include: `BaseUserDirectoryService.java:110`, `User.java:65`, `UserProfile.java:43`, `UsageSessionServiceAdaptor.java:195`, `ContentReviewServiceTurnitinOC.java:1020` | found, performs, 43 matches: 41 `lexcode.personal.java-client-ip-captured` (for example `access/.../AccessServlet.java:470`) and 2 `lexcode.personal.java-entity-field` (`plus/api/.../Subject.java:76` email, `polls/api/.../Vote.java:59` ip) | Found, on other code. None of the five cited files is matched: the account, profile and session beans are not a shape a rule names. The matches hold personal data too (a visitor's address logged with a request, a stored email, a vote's address) |
| `ships_consumer_interface` | include: `SkinnableCharonPortal.java:150`, `library/.../gateway/about.html`, `ContainerLogin.java`, `reset-pass/reset-pass/pom.xml` | missed (nothing in the record) | Missed. The portal is a servlet (`extends HttpServlet implements Portal`), the gateway pages are static HTML and the sign-in is a container-login class; the Java signal rules (a sign-up route, screen or permit) matched nothing in Sakai |
| `automated_outreach` | include: `AssignmentDueReminderServiceImpl.java:107` and `:158`, `BaseDigestService.java:663`, `UserMessagingServiceImpl.java:185`, `SignupNotifyJob.java:70` | found, performs 25 (20 `lexcode.outreach.java-send-in-loop`, 5 `java-send-in-scheduled-job`) and enables 1 (`pkg:maven/nl.martijndwars/web-push@5.1.1`, `kernel/kernel-impl/pom.xml:343`); signal `lexcode.outreach.java-sms-call-push-send` at `UserMessagingServiceImpl.java:689` | Found, on the same code the reading cites: `AssignmentDueReminderServiceImpl.java:158` exactly, `BaseDigestService.java:671`, `SignupNotifyJob.java:137`, and the web-push client and the push-send signal are the browser notifications the reading describes in `UserMessagingServiceImpl` |
| `records_text_chat` | include: `chat/.../ChatMessage.java:58` and `:91` | found, performs, 1 match; `lexcode.chat.java-chat-message-entity` at `chat/chat-api/api/.../ChatMessage.java:69` | Found, on the same class: the match is the class declaration between the two lines the reading cites |
| `tracks_devices` | include: `includeAnalytics.vm:1` and `:16`, `SkinnableCharonPortal.java:297`, `default.sakai.properties:90` and `:105` | missed (searched, not found) | Missed. The Google Analytics, GA4 and Tag Manager snippets are in a Velocity template (`#if (${googleUniversalAnalyticsId})`), which has no rules in this phase, and the Java side only reads a configuration property (`serverConfigurationService.getString(PROP_GOOGLE_ANALYTICS_ID, null)`). No analytics SDK or dependency is present, so the dependency route is empty too |
| `processes_voice` | include: `SakaiAudioRecorder.js:44`, `SakaiAccount.js:575`, `ProfileController.java:253`, `AudioUploadActionListener.java:53`, `assignment/tool/.../video-recorder.js:24` | found, performs, 1 match; `lexcode.voice.mediarecorder-microphone` at `SakaiAudioRecorder.js:46`; 4 signals `lexcode.voice.getusermedia-audio` (`SakaiAudioRecorder.js:39` and `:44`, `assignment/tool/.../video-recorder.js:24`, `library/.../sakai-recorder.js:113`) | Found, on the same code: the recorder component the reading lists first, with the assignment video recorder as a signal. The Java handlers that receive the clip (`ProfileController`, `AudioUploadActionListener`) are not matched |
| `records_calls` | include: `MicrosoftCommonServiceImpl.java:2421`, `:2533`, `:2543`, `:2566`, `MeetingsController.java:778` (the reading calls it a close call) | missed (searched, not found) | Missed. Sakai reads Teams recordings through the Microsoft Graph client (`getOnlineMeetingRecordings`); the Java meeting-recording rule names LiveKit, Chime, Connect, Vonage, Zoom, notetaker bots and Daily, and Graph is not among them |
| `crawls_web` | include: `BaseExternalCalendarSubscriptionService.java:816` and `:824`, `default.sakai.properties:2346`, `LinkMigrationHelperImpl.java:291`, `GetArchivesJob.java:80` (the reading calls it a close call) | found, enables, 1 match; `pkg:maven/com.microsoft.playwright/playwright@1.64.0` at `e2e-tests/pom.xml:43` | Found, on other evidence, not the reading's code: the dependency belongs to Sakai's browser-test module (`e2e-tests`) and carries no test scope, so it counts. The calendar fetch, the link follower and the archive job are not matched. Counted as found because it is an evidence row for the activity, though a person would not call it the right reason |
| `ships_encryption` | include: `PasswordService.java:166` and `:174` (PBKDF2), `EncryptionUtilityServiceImpl.java:29` (Jasypt AES-256), `SimpleEncryption.java:45`, `MicrosoftConfigurationServiceImpl.java:48` | found, performs 1 and enables 2; `lexcode.crypto.java-library-encryption` at `kernel/kernel-impl/.../EncryptionUtilityServiceImpl.java:29` (`new AES256TextEncryptor()`), `pkg:maven/org.jasypt/jasypt@1.9.3` (`kernel/kernel-impl/pom.xml:311`) and `pkg:maven/org.bouncycastle/bcprov-jdk18on@1.85` (`:348`) | Found, on a line the reading cites. The other cited locations use the JDK's own crypto (PBKDF2, `Cipher` AES-CBC and AES-GCM), which the rules treat as the platform's, by ruling, so they are not matched; the row is found through Jasypt |
| `distributes_software_product` | include: `README.md:28` and `:41`, `pack/pack-bin/pom.xml:12`, `docker/Dockerfile.source:19`, `pom.xml:24` | found, performs, 50 matches: `lexcode.distribute.maven-publish-plugin` at `master/pom.xml:163` (the Sonatype central-publishing plugin) and 49 `lexcode.distribute.package-json-publish-config` over `webcomponents/.../packages/*/package.json` | Found, on other code. The Maven publishing plugin is the reading's "API artifacts others embed"; the 49 package files are Sakai's `@sakai-ui` npm packages, each with a public `publishConfig`. The README, the binary pack and the Dockerfile are not matched |
| `operates_social_platform` | include: `commons/README.md:3`, `commons/api/.../Post.java:38`, `ConversationsPost.java:40`, `MessageImpl.java:40`, `SocialNetworkingInfo.java:33` | signal only, 2 matches; `lexcode.social.java-post-model` at `commons/api/.../datamodel/Post.java:37` and `conversations/api/.../ConversationsPost.java:39` | Signal only, on two of the files the reading cites (the Commons wall post and the Conversations post). The forum message and the profile social links are not matched |

Unsure in the reading, and not scored: `relies_on_digital_identity`,
`aggregates_content` and `processes_biometrics`. lexcode reported nothing for
any of the three.

Scan notices, as printed: 8 minified files skipped, 1 PHP file not read, 2 Maven
dependencies recorded without a version, and the engine could not read 17 files
(none of them Java).
<!-- sakai:end -->

<!-- canvas-android:start -->
### Canvas Student, Teacher and Parent for Android, read with Kotlin and Gradle

Measured 2026-11-11 over `instructure/canvas-android` at commit `896f61f`, with
lexcode `v1.2` (branch build at commit `703f059`), against a reading of
the same commit by an agent that had not seen the Kotlin rules (the key's own
header calls it unreviewed), kept unchanged. The reading includes 11 activities
from code, marks 13 as absent and leaves 2 unsure. lexcode read 7,018 files (the `androidTest`
files are not read by default, and 25 symbolic links are skipped) in 43 seconds
and 2.0 GB, and the check reports 0 FAIL.

**Score: 5 of 11 found at evidence strength, 1 signal only, 5 missed. One miss is
the ruled miss for an Android app (`distributes_software_product`); the other 4
(`generates_content`, `generates_text`, `deploys_chatbot`,
`operates_social_platform`) are calls to Canvas's own web service, which no rule
names. No evidence contradicts a row the reading marks absent, and the 2 unsure
rows (`records_calls`, `records_text_chat`) drew nothing, so they are neither
found nor missed.** Of the 5 found, 4 are on the code the reading cites
(`tracks_devices`, `processes_voice`, `ships_encryption`, `ships_mobile_app`) and
1 is on a related file (`processes_personal_data`). The engine could not read 9
Kotlin files (0.2 percent of the 4,441 `.kt` and `.kts` files outside test directories): 3 use a soft keyword as a name
(`annotation`, `open`), 2 an `object : T by x` expression, 2 the `..<` range
operator, 1 a trailing comma in a function type and 1 a parenthesized receiver
at the start of a statement. The rest of each file is still matched. Recall is
printed, never gated.

| Activity | The reading | lexcode | Verdict |
|---|---|---|---|
| `processes_personal_data` | include: `canvasapi2/models/User.kt:25`, `ApiPrefs.kt:120`, `SetupPendoTrackingUseCase.kt:61`, `PushExternalReceiver.kt:40` | found, performs 2 and enables 13; `lexcode.personal.kt-entity-field` at `libs/pandautils/.../room/offline/entities/UserEntity.kt:33` and `:34` (`primaryEmail`, `email`); `pkg:maven/sdk.pendo.io/pendoIO` (4 manifest lines) and `pkg:maven/com.google.firebase/firebase-crashlytics` and `-ndk` (9) | Found, on related code. The Room table that stores the signed-in user offline holds the email the reading describes; the reading's own four locations (the API model, the preferences, the Pendo setup, the push receiver) are not matched. The analytics and crash-report SDKs that receive the user id are the enables rows |
| `tracks_devices` | include: `libs/pandautils/build.gradle:239`, `apps/teacher/build.gradle:284`, `apps/parent/build.gradle:236`, `SetupPendoTrackingUseCase.kt:69`, `Analytics.kt:35`, `apps/student/.../AndroidManifest.xml:82` | found, performs 7 and enables 13; `lexcode.tracking.kt-analytics-calls` at `SetupPendoTrackingUseCase.kt:70` and `:73` (`Pendo.setup`, `Pendo.startSession`), `Analytics.kt:35` and `:40` (`Pendo.track`), `WidgetLogger.kt:82` and `:87`, `AnalyticsConsentHandler.kt:54`; `pkg:maven/sdk.pendo.io/pendoIO@3.9.%2B` at the three `build.gradle` lines the reading cites | Found, on the same code, to the file and line for the three dependency declarations and the `Analytics.kt` call. The manifest line is not matched |
| `processes_voice` | include: `FloatingRecordingView.kt:361` and `:362`, the student and teacher `AndroidManifest.xml` microphone permissions, `SpeedGraderCommentsSection.kt:277` | found, performs, 1 match; `lexcode.voice.kt-microphone-capture` at `libs/pandautils/.../views/FloatingRecordingView.kt:362` | Found, on a line the reading cites. The manifest permissions and the grading comment screen are not matched |
| `generates_content` | include: `AiAssistRepository.kt:25`, `JourneyAssistAPI.kt:10`, `AiAssistFlashcardViewModel.kt:75`, `AiAssistQuizViewModel.kt:95` | missed (searched, not found) | Missed. The assistant is a Retrofit interface to Canvas's own service (`@POST("assist") suspend fun answerPrompt(...)`), called as `journeyAssistAPI.answerPrompt(...)`; no model SDK or dependency is present for a rule to name, which is the same shape as the Ruby Canvas misses |
| `generates_text` | include: `AiAssistRepository.kt:25`, `AiAssistChatViewModel.kt:76`, `AiAssistFlashcardViewModel.kt:75`, `AiAssistQuizViewModel.kt:95`, `StudentLoginNavigation.kt:60` | missed (searched, not found) | Missed, for the same reason as `generates_content` |
| `deploys_chatbot` | include: `AiAssistChatScreen.kt:52`, `AiAssistChatViewModel.kt:57`, `AiAssistMainViewModel.kt:73` | missed (searched, not found) | Missed, for the same reason: a chat screen over Canvas's own endpoint, with no chat-model call in the app |
| `ships_encryption` | include: `FlutterAppMigration.kt:115` and `:117`, `apps/parent/build.gradle:234`, `GlobalDependencies.kt:86` | found, performs, 1 match; `lexcode.crypto.kt-encrypted-storage` at `apps/parent/.../util/FlutterAppMigration.kt:117` | Found, on a line the reading cites (the `EncryptedSharedPreferences` open). The `androidx.security:security-crypto` dependency is not an `enables` row, because the component map holds no entry for it |
| `ships_mobile_app` | include: `README.md:34` and `:42`, `apps/student/build.gradle:38`, `apps/parent/build.gradle:41`, `apps/teacher/build.gradle:29`, `UpdateModule.kt:50` | found, performs 8; `lexcode.mobile.gradle-android-application` at `apps/student/build.gradle:17`, `apps/parent/build.gradle:19` and `apps/teacher/build.gradle:16`; `lexcode.mobile.android-manifest-launcher` (3, for example `apps/parent/.../AndroidManifest.xml:68`); `lexcode.mobile.kt-android-application-class` at `AppManager.kt:40`; `lexcode.mobile.kt-play-core-store-call` at `UpdateModule.kt:51` | Found, on the same code: the same three `build.gradle` files (the plugin line rather than the application id) and the Play in-app update call the reading cites |
| `distributes_software_product` | include: `README.md:34`, `apps/student/build.gradle:38` and `:41`, `apps/parent/build.gradle:41` | missed (searched, not found) | Missed, by ruling: an Android app's store release is not read as distributing a software product, so this is a recall miss, not a rule defect |
| `ships_consumer_interface` | include: `apps/student/.../AndroidManifest.xml:103`, the parent and teacher manifests, `BaseLoginSignInActivity.kt` | signal only, 3 matches; `lexcode.consumer.kt-signup-screen` at `apps/parent/.../createaccount/CreateAccountActivity.kt:34`, `CreateAccountFragment.kt:35` and `CreateAccountScreen.kt:82` | Signal only, from other code: the Parent app's self-registration screen, which shows the public can create an account. The manifests and the sign-in activity the reading cites are not matched |
| `operates_social_platform` | include: `DiscussionAPI.kt:125` and `:129`, `InboxApi.kt:68` | missed (nothing in the record) | Missed. Discussion replies and inbox messages are Retrofit declarations to Canvas's own service (`@POST(".../discussion_topics/{topicId}/entries")`, `@POST("conversations?...")`), not a post model stored in the app, and the Kotlin post-model rule reads a post class with reactions or an author and replies |

Unsure in the reading, and not scored: `records_calls` and `records_text_chat`.
lexcode reported nothing for either.

Scan notices, as printed: 25 symbolic links skipped, 1 Dart file not read, 24
Gradle dependencies recorded without a version (a platform BOM, a plugin or a
computed value), 18 Gradle dependencies named by a constant or variable that
lexcode does not evaluate and so does not record, 1 file with a line over
100,000 characters skipped, and the engine could not read 9 files.
<!-- canvas-android:end -->

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

### A known residual: mail to administrators

The `automated_outreach` rules that find a message sent from a loop, a
background job or a scheduled job cannot tell who receives it. A job that mails
its own status or a report to the administrators who run the system has that
shape, though it is not outreach to the people the app serves. In Ruby it is
`lexcode.outreach.rb-send-in-background-job`, the job-status email in the Canvas
LMS block above. In Java it is `lexcode.outreach.java-send-in-loop` and
`lexcode.outreach.java-send-in-scheduled-job`: report mails to administrators
were 4 of the 13 matches those two rules made in Sakai when they were reviewed.
Read such a match against its recipient list before relying on it.

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
`plugins {}`, `pluginManagement {}`, `constraints {}`, `components {}` or
`modules {}` is a dependency (the last two configure or replace modules the
build already has, such as `withModule("g:a") { ... }` and
`module("g:old") { replacedBy("g:new") }`). A
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
`gradle-maven-publication` reads only a `publishing {` block that starts at the
beginning of a line (the top level of a build file), so one nested in
`subprojects {}` or `allprojects {}` is missed.

### The Java gate exemption

The release test requires every evidence-class activity to have a Java rule and
a Kotlin rule. One Java exemption stands: `distributes_software_product`, whose
JVM evidence lives in build files, is met by a `maven-` or `gradle-` rule.

### Java and Kotlin files

Test source sets are left out like `test`: the directories `androidTest`,
`testFixtures` and `integrationTest`, and the Kotlin Multiplatform test source
sets `commonTest`, `jvmTest`, `androidUnitTest`, `androidInstrumentedTest`,
`iosTest`, `jsTest` and `nativeTest`, are skipped unless `--include-tests`. The
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

## A known gap: a file over 1 MB

Some rules first check the whole file for a name, with a `pattern-regex` of the
form `(?s)\A(?=.*NAME).*`, so the engine can skip a file that cannot match. On
Opengrep 1.33.1 that check stops matching after about a million backtracking
steps and records no error. The rules write it with a greedy `.*`, which counts
the steps from the end of the file: a name used only near the top of a file is
missed from about 1,050 KB, while one near the end is still found in a 4.5 MB
file. A lazy `.*?` counts from the start and misses a name used only at the end
from about 1,000 KB, and an alternation tried at every step shortens the reach
further. lexcode cannot lift the engine's limit, so a scan counts the files it
hands the engine that are over 1,000,000 bytes and in a language with at least
one such rule (in this rule set, Java, Kotlin and Ruby), and says so: `N files
handed to the engine are over 1,000,000 bytes (Java); rules that first check a
whole file for a name can miss matches in a file that large, so evidence in them
may be missing from this record`. With files in more than one language, the
parenthesis counts each (`2 Java, 1 Kotlin`). There is no notice when there is
no such file. How a rule keeps the longest reach, and which forms the release
test refuses, is in CONTRIBUTING.md under Cost.
