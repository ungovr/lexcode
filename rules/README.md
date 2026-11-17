# lexcode rule set

This directory is the rule set lexcode runs: one YAML rule per file, one
directory per LexLint activity, positive and negative fixtures beside each rule,
component maps for npm, PyPI, Go, gem, Maven, Composer, NuGet, Cargo, Swift and
CocoaPods packages under `components/`, and `classes.yml`, which gives every
activity id in the pinned registry snapshot (`registry.snapshot.json`, CC BY
4.0, credit "LexLint (UnGovr)") one detection class. Every rule is original to
UnGovr and MIT licensed. The recall table below is measured against the truth
sets, per activity.

<!-- recall:start -->
Measured 2026-11-16 over the UnGovr monorepo, 15 pinned starter templates and 6 real apps,
against answer keys, each read by an agent that had not seen the rules.
Found counts evidence of either kind for the activity or its family; signal
only counts the misses where lexcode showed a worth-a-look row and nothing
stronger. Recall is printed, never gated.

| Activity | Expected | Found | Signal only | Missed in |
|---|---:|---:|---:|---|
| `aggregates_content` | 5 | 2 | 1 | monorepo, nowinandroid, penny-bot |
| `automated_outreach` | 8 | 7 | 0 | zero-to-production |
| `crawls_web` | 5 | 3 | 1 | penny-bot, moodle |
| `deploys_chatbot` | 4 | 2 | 0 | canvas-android, nopcommerce |
| `distributes_software_product` | 12 | 7 | 2 | nowinandroid, eshop, clean-architecture-swiftui, canvas-android, wikipedia-ios |
| `generates_content` | 6 | 4 | 0 | canvas-android, moodle |
| `generates_images` | 1 | 0 | 0 | moodle |
| `generates_text` | 5 | 3 | 0 | canvas-android, moodle |
| `operates_social_platform` | 8 | 0 | 6 | symfony-demo, realworld-axum-sqlx, canvas-android, lemmy, moodle, nopcommerce, sakai, wikipedia-ios |
| `processes_biometrics` | 1 | 1 | 0 |  |
| `processes_personal_data` | 21 | 20 | 0 | penny-bot |
| `processes_voice` | 4 | 3 | 1 | moodle |
| `records_calls` | 3 | 1 | 0 | monorepo, sakai |
| `records_text_chat` | 5 | 2 | 0 | eshop, penny-bot, moodle |
| `ships_consumer_interface` | 19 | 0 | 9 | vercel-chatbot, nextjs-subscription-payments, obytes-expo, full-stack-fastapi, bullet-train, spring-petclinic, nowinandroid, symfony-demo, wave, eshop, clean-architecture, clean-architecture-swiftui, penny-bot, zero-to-production, canvas-android, moodle, nopcommerce, sakai, wikipedia-ios |
| `ships_encryption` | 7 | 5 | 0 | penny-bot, zero-to-production |
| `ships_mobile_app` | 7 | 7 | 0 |  |
| `statutory_requests` | 1 | 0 | 1 | monorepo |
| `tracks_devices` | 8 | 6 | 0 | sakai, wikipedia-ios |
| `trains_models` | 1 | 0 | 0 | moodle |
<!-- recall:end -->

The `ships_encryption` row, and the `ships_encryption` rows of the app readings
below, were measured before the encryption rules were redrawn: the rules now
read the platform's own ciphers and key agreement (the JDK's `Cipher`, .NET's
`Aes`, Node's crypto module and the rest) and no longer read password hashing,
and an encrypted attribute that holds only sign-in data no longer counts (see
"Shipping encryption"). They are measured again at release.

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
| `ships_encryption` | include: `PasswordService.java:166` and `:174` (PBKDF2), `EncryptionUtilityServiceImpl.java:29` (Jasypt AES-256), `SimpleEncryption.java:45`, `MicrosoftConfigurationServiceImpl.java:48` | found, performs 1 and enables 2; `lexcode.crypto.java-library-encryption` at `kernel/kernel-impl/.../EncryptionUtilityServiceImpl.java:29` (`new AES256TextEncryptor()`), `pkg:maven/org.jasypt/jasypt@1.9.3` (`kernel/kernel-impl/pom.xml:311`) and `pkg:maven/org.bouncycastle/bcprov-jdk18on@1.85` (`:348`) | Found, on a line the reading cites. The other cited locations use the JDK's own crypto (PBKDF2, `Cipher` AES-CBC and AES-GCM), which the rules of that commit left to the platform, so they were not matched; the row was found through Jasypt. Since then `java-platform-encryption` reads a JDK `Cipher`, and PBKDF2 is password hashing, which no rule reads; and the Bouncy Castle `bcprov` artifacts enable nothing in the component map (#13336), so the row is found through Jasypt alone |
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

<!-- moodle:start -->
### Moodle, read with PHP and the Composer manifest

Measured 2026-11-12 over `moodle/moodle` at commit `afbcc55`, with lexcode
`v1.3` (branch build at commit `5f2d303`), against a reading of the same commit
by an agent that had not seen the PHP rules, checked row by row by a second
reader who had not seen them either, kept unchanged. The reading includes 15
activities from code, marks 9 as absent and leaves 2 unsure. Every figure below
is from one run, `lexcode check --declaration` with that build, unless it names
another: lexcode read 60,335 files and 2 script copies drawn from PHP views, in
6 minutes 7 seconds and 3.7 GB on a shared machine (load average 6 to 8), and
the check reports 0 FAIL. Before lexcode read PHP, a scan of the same commit
took 4 minutes 4 seconds and 3.2 GB, and its notice named 52,544 of the same
60,335 files as PHP it did not read (the check record does not count files by
language).

**Score: 6 of 15 found at evidence strength, one of them on the Composer
manifest only (`aggregates_content`), 2 signal only, 7 missed. No evidence
contradicts a row the reading marks absent, and the 2 unsure rows
(`tracks_devices`, `relies_on_digital_identity`) drew nothing, so they are
neither found nor missed.** Before lexcode read PHP it found none of the 15,
showed 1 as a signal (`processes_voice`) and gave 1 false positive (an emoji
table read as document-and-selfie verification, fixed in `5f2d303`). Of the 6
found, 3 are on a line the reading cites (`records_calls`,
`distributes_software_product`, and `automated_outreach` through its PHPMailer
dependency), 1 on other code in a file the reading cites (`ships_encryption`),
1 on the Composer manifest only (`aggregates_content`: SimplePie, the feed
library behind the RSS block the reading cites) and 1 on other code
(`processes_personal_data`). The 7 misses are Moodle's own idioms: the AI
providers send a PSR-7 request through Moodle's HTTP client with the endpoint
read from settings, messages and posts are written with `$DB->insert_record` to
tables named in XML schema, training is handed to a separate Python package, and
sign-up is a plain script behind an authentication plugin. Recall is printed,
never gated. Paths below are under `public/` unless they start with
`composer.json`, `README.md` or `.github/`.

| Activity | The reading | lexcode | Verdict |
|---|---|---|---|
| `processes_personal_data` | include: `lib/db/install.xml:870`, `:884`, `:857` (the user table), `admin/tool/log/store/standard/db/install.xml:28`, `auth/email/auth.php:75` | found, performs, 3 matches; `lexcode.personal.php-third-party-person` at `lib/classes/output/user_picture.php:373` and `:375`, and at `enrol/lti/ims-blti/blti.php:190` (vendored) | Found, on other code: the Gravatar address built from the MD5 of a user's email. The schema files and the sign-up page the reading cites are not matched |
| `ships_consumer_interface` | include: `auth/email/auth.php:75`, `login/signup.php`, `login/index.php:52` and `:146`, `index.php` | missed (nothing in the record) | Missed. The PHP sign-up rules name a Laravel route, a Livewire Volt page, a Symfony route attribute or Fortify's registration; Moodle's sign-up is a plain script behind an authentication plugin's `can_signup()` |
| `automated_outreach` | include: `mod/assign/db/tasks.php:35`, `mod/forum/classes/task/send_user_digests.php:39`, `message/output/email/message_output_email.php:104`, `sms/gateway/aws/classes/local/service/aws_sns.php:62`, `composer.json:86` and `:88` | found, performs 2 and enables 1; `lexcode.outreach.php-send-in-loop` at `mod/assign/locallib.php:3128` (the assignment cron's loop over graded submissions) and `:7481` (the loop over graders when a student submits); `pkg:composer/phpmailer/phpmailer@v6.9.3` at `composer.json:86`; 7 signals, among them `lexcode.outreach.php-sms-call-push-send` at `sms/gateway/aws/classes/local/service/aws_sns.php:62` | Found. The PHPMailer row is the reading's `composer.json:86`, and the SNS signal is on the reading's own line. The send-in-loop matches are the assignment notifications the reading describes, in the cron rather than the task registration it cites |
| `records_text_chat` | include: `lib/db/install.xml:649`, `:672`, `lib/classes/message/manager.php:67`, `lib/db/install.xml:4998` | missed (searched, not found) | Missed. A message is stored with `$DB->insert_record($table, $tabledata)` (`lib/messagelib.php:209`), the table name in a variable; the PHP rule reads a literal table named for chat or conversation messages. The schema is XML, which no rule reads |
| `processes_voice` | include: `lib/editor/tiny/plugins/recordrtc/amd/src/base_recorder.js:215`, `:584`, `:1001`, `audio_recorder.js:30` | signal only, 1 match; `lexcode.voice.getusermedia-audio` at `lib/editor/tiny/plugins/recordrtc/amd/src/screen_recorder.js:114` | Signal only, unchanged from before PHP: a sibling file in the same recorder plugin. JavaScript evidence; no PHP rule bears on it |
| `records_calls` | include: `mod/bigbluebuttonbn/classes/meeting.php:392`, `:394`, `classes/instance.php:860`, `classes/local/proxy/recording_proxy.php:178` | found, performs, 1 match; `lexcode.calls.php-bigbluebutton-record` at `mod/bigbluebuttonbn/classes/meeting.php:392` | Found, on the line the reading cites first (`$data['record'] = ...`) |
| `crawls_web` | include: `blocks/rss_client/classes/task/refreshfeeds.php:122` and `:132`, `blog/lib.php:148`, `calendar/lib.php:2468`, `repository/url/lib.php:153` and `:170`, `composer.json:87` | signal only, 1 match; `lexcode.crawl.php-html-of-fetched-page` at `repository/url/lib.php:172` | Signal only, on the URL repository, which the reading calls the weakest of its four. The RSS task loops over the feed records but fetches each in a method of its own (`fetch_feed()`, through `moodle_simplepie`), which the loop rule does not follow into. The blog sync fetches through `moodle_simplepie` too (`blog/lib.php:152`, `set_feed_url()` at `:165`). The calendar cron loops over subscriptions (`lib/classes/task/calendar_cron_task.php:59`) and fetches two calls down, with Moodle's own `curl` class (`$curl->get($url)` at `calendar/lib.php:2476`), which no rule names |
| `aggregates_content` | include: `blocks/rss_client/block_rss_client.php:183` and `:193`, `blog/lib.php:148`, `blog/external_blog_edit.php:76` | found, enables 1; `pkg:composer/simplepie/simplepie@1.9.0` at `composer.json:87`; 10 signals `lexcode.aggregate.php-feed-read` (6 in Moodle's own RSS block and blog code, 4 in vendored SimplePie) | Found by dependency: the feed library behind the RSS block the reading cites. The feed-read signals sit in that block (`blocks/rss_client/classes/task/refreshfeeds.php:131`) and in `blog/lib.php:165` |
| `ships_encryption` | include: `lib/classes/authentication/password.php:153`, `lib/classes/encryption.php:184`, `mnet/lib.php:219`, `lib/classes/oauth2/setup.php:51`, `composer.json:57`, `:42`, `:82`, `:101` | found, performs 1 and enables 1; `lexcode.crypto.php-library-encryption` at `lib/classes/oauth2/setup.php:101` (`\Defuse\Crypto\Key::createNewRandomKey()`); `pkg:composer/phpseclib/phpseclib` at `lib/lti1p3/composer.json:27` (vendored, no version) | Found, in a file the reading cites, on the key for stored OAuth secrets rather than the RSA key pair at `:51`. `ext-openssl` and `ext-sodium` (`composer.json:42`, `:57`) are platform names, which the Composer reader does not record, and the component map gives `firebase/php-jwt` and `league/oauth2-server` no activity. Since then `phpseclib/phpseclib` enables nothing in the component map either (#13336); `php-library-encryption` reads its ciphers, key agreement, RSA encryption and SSH connections in the code |
| `distributes_software_product` | include: `composer.json:2`, `:5`, `:7`, `README.md:29` | found, performs, 44 matches; `lexcode.distribute.composer-package` at `composer.json:5`, and 43 in vendored libraries (38 `composer-package`, 3 `composer-bin`, 2 `php-phar-build`) | Found, on a line the reading cites (the package type). 43 of the 44 matches are vendored |
| `operates_social_platform` | include: `mod/forum/db/install.xml:74`, `blog/locallib.php:566`, `lib/db/install.xml:768`, `:784`, `:1149`, `:2845` | missed (nothing in the record) | Missed. The PHP social rules read an Eloquent or Doctrine post, follow or message model, or a feed query keyed on followed accounts; Moodle's forums, blogs, comments and contacts are XML schema and `$DB` calls |
| `generates_content` | include: `ai/placement/editor/classes/placement.php:33`, `ai/placement/courseassist/classes/placement.php:32`, `ai/provider/openai/classes/abstract_processor.php:118` | missed (searched, not found) | Missed. Each provider builds a PSR-7 request and sends it with `\core\di::get(http_client::class)->send($request, ['base_uri' => $this->get_endpoint()])`, the endpoint read from settings; the vendor's address is only a settings form's default. No SDK class, facade or literal endpoint sits at the call for a rule to name |
| `generates_text` | include: `ai/classes/aiactions/generate_text.php:28`, `ai/provider/openai/classes/form/action_generate_text_form.php:45`, `ai/provider/anthropic/classes/abstract_processor.php:37`, `lib/db/install.xml:4995` | missed (searched, not found) | Missed, for the same reason as `generates_content` |
| `generates_images` | include: `ai/classes/aiactions/generate_image.php`, `ai/provider/openai/classes/process_generate_image.php:32`, `ai/provider/gemini/classes/process_generate_image.php:57`, `lib/db/install.xml:4952` | missed (searched, not found) | Missed, for the same reason |
| `trains_models` | include: `analytics/classes/model.php:690`, `lib/mlbackend/python/classes/processor.php:238` and `:480` | missed (searched, not found) | Missed. Training is handed to the separate `moodle-mlbackend-python` package, run with `exec()` or reached through Moodle's `curl` class (`lib/mlbackend/python/classes/processor.php:160`, `:182`); the PHP rules name Rubix ML, PHP-ML and hosted fine-tuning services |

Unsure in the reading, and not scored: `tracks_devices` and
`relies_on_digital_identity`. lexcode reported nothing for either.

**Vendored code outside `vendor/` (known gap).** lexcode reads it as Moodle's
own code in this phase. Moodle's 18 `thirdpartylibs.xml` files list 127 library
locations; 49 of the check record's 73 evidence rows lie under one of them: 43
of the 44 `distributes_software_product` matches, 1 of the 3
`processes_personal_data` matches (`enrol/lti/ims-blti/blti.php:190`), the
`ships_encryption` dependency row (`lib/lti1p3/composer.json:27`) and 4 of the
10 `aggregates_content` signals (SimplePie). No found row rests on vendored
evidence alone. Of the 109 Composer dependency rows (`lexcode deps` on the same
commit), 60 come from vendored libraries' `composer.json` files; 64 carry no
version, 60 of those vendored and 4 from the CI-only
`.github/workflows/composed/composer.json`.

**PHP the engine could not parse.** In a separate run with a rule that holds no
fixed text, so that every file is parsed, the engine read 52,442 PHP files and
both script copies (102 PHP files have a line over 100,000 characters and are
not handed over) and partially parsed 17 PHP files (0.03 percent), with no error
in a copy. The rest of each file is still matched. The causes: 13 a trailing
comma in `unset(...)`, 1 a capitalized cast (`(String)`), 2 a list assignment
that skips its first element (`[, $x] = ...`) and 1 a trailing comma in a
grouped `use` (`use A\{B, C,};`). In the last 3, the fallback parser then also
drops the file's `readonly` property declarations. Attributes (in 2,511 files),
enums, `match`, first-class callables and `readonly` elsewhere (the word is in
580 files) parse in every file handed over. The check run's own count (31 files
the engine could not read) covers the files its rules opened, in every language.

The check run's notices, as printed: 40 minified files skipped, 1 file over 5 MB
skipped, 64 Composer dependencies recorded without a version, 124 files with a
line over 100,000 characters skipped, and the engine could not read 31 files.
The notice naming unread PHP files is gone.
<!-- moodle:end -->

<!-- nopcommerce:start -->
### nopCommerce, read with C#, Razor and the MSBuild manifests

Measured 2026-11-14 over `nopSolutions/nopCommerce` at commit `aeb6862`
(its tree is at https://github.com/nopSolutions/nopCommerce/tree/aeb686282007ed774b362e3cdff34b7c233f8933
and its license is NPL-4.0, AGPL-3.0 with an attribution term), with lexcode `v1.4` (branch
build at commit `524e554`), against a reading of the same commit by an agent
that had not seen the C# rules, checked row by row by a second reader who had
not seen them either, kept unchanged. The reading includes 10 activities from
code, marks 12 as absent and leaves 4 unsure. Every figure below is from one
run, `lexcode scan` and `lexcode check --declaration` with that build, unless it
names another: lexcode read 6,413 files and 391 extracted copies (script blocks
of Razor views, and the C# of `@functions` blocks), in 1 minute 20 seconds
(scan) and 1 minute 49 seconds (check), 0.9 GB at most, on a shared machine
(load average about 35). The check reports 0 FAIL and 0 WARN.

**Score: 6 of 10 found at evidence strength, 2 signal only, 2 missed, counting
`generates_content` as found through its family; with no family credit, 5 found,
2 signal only and 3 missed. No evidence contradicts a row the reading marks
absent. Of the 4 unsure rows, one drew a signal (`aggregates_content`) and three
drew nothing, so none is found or missed.** Of the 6 found, 5 have evidence
under the activity's own id: `processes_personal_data`, `automated_outreach`,
`tracks_devices` and `distributes_software_product` on C# or MSBuild evidence,
and `generates_text` on the DeepL package alone. The sixth, `generates_content`,
has no evidence under its own id. It counts as found because the registry makes
`generates_text` a child of `generates_content`, so the check and the truth-set
script read them as one family, and the DeepL package is the only evidence for
either. That package sits on the translation path, which the reading calls the
weaker case for `generates_text` and does not cite for `generates_content` at
all. Read plainly, the built-in AI service (OpenAI, Gemini or DeepSeek writing
product descriptions) was not seen. The 2 misses are `deploys_chatbot`, where
nopCommerce inserts an operator-pasted embed code for a chatbot that runs on the
vendor's servers, and `ships_encryption`, which rests on .NET's own
`System.Security.Cryptography` classes, ASP.NET Core Data Protection
configuration and the GoogleAuthenticator package, none of which a C# rule or
the NuGet component map named at that commit (`cs-platform-encryption` now
reads the `System.Security.Cryptography` ciphers). The 2 signals are `ships_consumer_interface` and
`operates_social_platform`, the two activities whose rules are signal class by
design. Recall is printed, never gated. Paths below are relative to the
repository root.

| Activity | The reading | lexcode | Verdict |
|---|---|---|---|
| `processes_personal_data` | include: `src/Libraries/Nop.Core/Domain/Customers/Customer.cs:24`, `:29`, `:94`, `:214`, `src/Libraries/Nop.Core/Domain/Common/Address.cs:11`, `:21`, `:66`, `src/Libraries/Nop.Core/Domain/Orders/Order.cs:189`, `src/Libraries/Nop.Core/Domain/Logging/ActivityLog.cs:41`, `src/Presentation/Nop.Web/Controllers/CustomerController.cs:468` and `:1018`, `src/Plugins/Nop.Plugin.Widgets.FacebookPixel/Domain/ConversionsEventUserData.cs:29` | found, performs, 10 matches of `lexcode.personal.cs-schema-field`, among them `src/Libraries/Nop.Data/Mapping/Builders/Customers/CustomerBuilder.cs:26` (`Customer.Email`), `:37` (`Phone`), `:42` (`DateOfBirth`), `:44` (`LastIpAddress`) and `src/Libraries/Nop.Data/Mapping/Builders/Logging/ActivityLogBuilder.cs:23` (`IpAddress`); and enables 1, `pkg:nuget/Microsoft.AspNetCore.Authentication.Facebook@10.0.11` at `src/Plugins/Nop.Plugin.ExternalAuth.Facebook/Nop.Plugin.ExternalAuth.Facebook.csproj:61` | Found, on other code: the database column mappings for the same `Customer` and `ActivityLog` entities the reading cites. The entity files themselves, the sign-in pages and the Facebook Pixel payload are not matched |
| `ships_consumer_interface` | include: `src/Presentation/Nop.Web/Controllers/HomeController.cs:9`, `CatalogController.cs:117` and `:364`, `ShoppingCartController.cs:593` and `:791`, `CheckoutController.cs:342`, `CustomerController.cs:1018`, and the views `Views/Home/Index.cshtml` and `Views/Checkout/OnePageCheckout.cshtml` | signal only, 3 matches; `lexcode.consumer.cs-signup-screen` at `src/Presentation/Nop.Web/Controllers/CustomerController.cs:1000` and `:1013`, and `lexcode.consumer.cs-signup-route` at `src/Presentation/Nop.Web/Infrastructure/RouteProvider.cs:45` | Signal only, by design: the sign-up rules are signal class. The two controller matches are the attribute lines of the two `Register` actions, the second five lines above the reading's `:1018`, and the route match is the one that serves `/register/`. The storefront controllers and views are not matched |
| `automated_outreach` | include: `src/Libraries/Nop.Services/Messages/QueuedMessagesSendTask.cs:62`, `src/Libraries/Nop.Services/Reminders/ProcessAbandonedCartsTask.cs:48`, `ProcessPendingOrdersTask.cs:54`, `ProcessIncompleteRegistrationsTask.cs:56`, `src/Plugins/Nop.Plugin.Sms.Twilio/Services/TwilioService.cs:47`, `src/Plugins/Nop.Plugin.Sms.Twilio/Nop.Plugin.Sms.Twilio.csproj:49`, `src/Plugins/Nop.Plugin.Misc.Brevo/Services/BrevoManager.cs:1429` and `:1462`, 23 lines in all | found, performs 9 and enables 1; `lexcode.outreach.cs-send-in-loop` at `src/Libraries/Nop.Services/Messages/QueuedMessagesSendTask.cs:62`, `src/Libraries/Nop.Services/Reminders/ProcessAbandonedCartsTask.cs:135` and `ProcessPendingOrdersTask.cs:143`, `src/Libraries/Nop.Services/Catalog/BackInStockSubscriptionService.cs:155` and 4 more in `OrderProcessingService.cs`; `lexcode.outreach.cs-bulk-send` at `src/Plugins/Nop.Plugin.Misc.Brevo/Services/BrevoManager.cs:1462`; `pkg:nuget/Twilio@8.0.1` at `src/Plugins/Nop.Plugin.Sms.Twilio/Nop.Plugin.Sms.Twilio.csproj:49`; 1 signal, `lexcode.outreach.cs-sms-call-push-send` at `src/Plugins/Nop.Plugin.Sms.Twilio/Services/TwilioService.cs:47` | Found, on 4 of the reading's own lines (`QueuedMessagesSendTask.cs:62`, `BrevoManager.cs:1462`, the Twilio csproj `:49` and, as a signal, `TwilioService.cs:47`) and in 2 more of its files (the abandoned-cart and pending-order tasks). `ProcessIncompleteRegistrationsTask.cs`, the campaign service and the Omnisend plugin are not matched |
| `tracks_devices` | include: `src/Plugins/Nop.Plugin.Widgets.GoogleAnalytics/GoogleAnalyticsPlugin.cs:98` and `:99`, `Components/WidgetsGoogleAnalyticsViewComponent.cs:123`, `GoogleAnalyticsDefaults.cs:21`, `src/Plugins/Nop.Plugin.Widgets.FacebookPixel/Services/FacebookPixelService.cs:248`, `:294`, `:1073`, `FacebookConversionsHttpClient.cs:51`, `src/Plugins/Nop.Plugin.Misc.Brevo/BrevoPlugin.cs:103` and `:108`, `src/Plugins/Nop.Plugin.Misc.Omnisend/OmnisendPlugin.cs:94` and `:97`, 18 lines in all | found, performs, 2 matches; `lexcode.tracking.cs-analytics-calls` at `src/Plugins/Nop.Plugin.Widgets.GoogleAnalytics/GoogleAnalyticsDefaults.cs:21` (the Measurement Protocol endpoint) and `:26` (its debug twin) | Found, on a line the reading cites (`:21`). The tracking scripts of Google Analytics, Facebook Pixel, Brevo and Omnisend are C# string literals handed to the page by a view component or the plugin's install code, and none is matched; the only matches are the server-side endpoint constants |
| `deploys_chatbot` | include: `src/Plugins/Nop.Plugin.Widgets.Jotform/JotformPlugin.cs:52`, `:94`, `:96`, `Components/WidgetJotformViewComponent.cs:9` and `:41` | missed (searched, not found; 7 rules tried) | Missed. The plugin registers a widget zone and returns the operator's pasted embed code as `new HtmlString(_jotformSettings.EmbedCode)` (`WidgetJotformViewComponent.cs:41`). There is no model SDK, conversation service or turn history in nopCommerce's code for a rule to name; the chatbot runs on Jotform's servers. The reading itself calls this row a close call |
| `generates_content` | include: `src/Libraries/Nop.Services/ArtificialIntelligence/ArtificialIntelligenceDefaults.cs:13`, `:18`, `:27`, `:46`, `ArtificialIntelligenceHttpClient.cs:64`, `ArtificialIntelligenceService.cs:302`, `src/Presentation/Nop.Web/Areas/Admin/Controllers/ProductController.cs:1628`, `ArtificialIntelligenceController.cs:73` | no evidence under its own id; counted as found through the family, on `pkg:nuget/DeepL.net@1.22.1` at `src/Presentation/Nop.Web.Framework/Nop.Web.Framework.csproj:15` (see `generates_text`) | Found by family only, and not on the reading's lines. The reading rests this row on the built-in OpenAI, Gemini and DeepSeek service, which lexcode did not see: it builds a request in a helper object and sends it with `_httpClient.SendAsync(request)`, the endpoint a string property on a static class (`ArtificialIntelligenceDefaults.cs:18`, `:27`, `:46`). The C# rules name SDK classes and chat-completion calls, and none reads a hosted model's address |
| `generates_text` | include: `src/Libraries/Nop.Services/ArtificialIntelligence/ArtificialIntelligenceDefaults.cs:58`, `:63`, `:68`, `:73`, `ArtificialIntelligenceHttpClient.cs:64`, `ArtificialIntelligenceService.cs:302` and `:364`, `src/Presentation/Nop.Web.Framework/Factories/TranslationModelFactory.cs:131`, `Nop.Web.Framework.csproj:15` and `:18` | found, enables 1; `pkg:nuget/DeepL.net@1.22.1` at `src/Presentation/Nop.Web.Framework/Nop.Web.Framework.csproj:15` | Found by dependency, on a line the reading cites, and on the path the reading calls the weaker case (the admin translate button). The language-model path the reading rests the row on is missed, for the reason given under `generates_content` |
| `ships_encryption` | include: `src/Libraries/Nop.Services/Security/EncryptionService.cs:73`, `:110`, `:121`, `:141`, `src/Libraries/Nop.Services/Customers/CustomerRegistrationService.cs:115` and `:320`, `NopCustomerServiceDefaults.cs:23`, `src/Presentation/Nop.Web.Framework/Infrastructure/Extensions/ServiceCollectionExtensions.cs:263`, `src/Plugins/Nop.Plugin.MultiFactorAuth.GoogleAuthenticator/Services/GoogleAuthenticatorService.cs:181` and `:195`, and its csproj `:52` | missed (searched, not found; 21 rules tried) | Missed. `EncryptionService.cs:73` calls `Aes.Create()` or `TripleDES.Create()` from .NET's own `System.Security.Cryptography`, which the C# rules of that commit left to the framework; they named bundled libraries (Bouncy Castle, NSec, libsodium, PgpCore, JOSE). Since then `cs-platform-encryption` reads the algorithm's encryptor, and an encryption that holds only passwords or other sign-in data is not `ships_encryption`. Data protection is configured with `services.AddDataProtection().PersistKeysToFileSystem(...)` (`ServiceCollectionExtensions.cs:263`), while the data-protection rule reads `CreateProtector(...)` and `DataProtectionProvider.Create(...)`. The `GoogleAuthenticator` package (`csproj:52`) has no entry in the NuGet component map |
| `distributes_software_product` | include: `LICENSE.md:1`, `README.md:1` and `:56`, `Dockerfile:1`, `src/Presentation/Nop.Web/Nop.Web.csproj:7`, `src/Libraries/Nop.Core/NopVersion.cs:11` | found, performs, 5 matches of `lexcode.distribute.msbuild-nuget-package`, all on the `<PackageLicenseUrl>` line: `src/Libraries/Nop.Core/Nop.Core.csproj:9`, `src/Libraries/Nop.Data/Nop.Data.csproj:9`, `src/Libraries/Nop.Services/Nop.Services.csproj:9`, `src/Presentation/Nop.Web.Framework/Nop.Web.Framework.csproj:9` and `src/Presentation/Nop.Web/Nop.Web.csproj:9` | Found, in a file the reading cites (`Nop.Web.csproj`, two lines below its version at `:7`). The matches are the NuGet package metadata of 5 projects, not the Dockerfile, the license or the version constant |
| `operates_social_platform` | include: `src/Plugins/Nop.Plugin.Misc.Forums/Domain/ForumTopic.cs:8`, `ForumPost.cs:8`, `Public/Controllers/BoardsController.cs:425` and `:726`, `Services/ForumInstallService.cs:74`, `src/Libraries/Nop.Core/Domain/Catalog/ProductReview.cs:36`, `src/Presentation/Nop.Web/Controllers/ProductController.cs:309`, `BlogController.cs:174`, `ProfileController.cs:29`, `src/Libraries/Nop.Core/Domain/Customers/CustomerSettings.cs:148`, 12 lines in all | signal only, 2 matches; `lexcode.social.cs-post-model` at `src/Plugins/Nop.Plugin.Misc.Forums/Domain/ForumPost.cs:43` and `lexcode.social.cs-direct-message` at `src/Libraries/Nop.Core/Domain/Customers/PrivateMessage.cs:21` | Signal only, by design: the social rules are signal class. One match is in a file the reading cites (`ForumPost.cs`), on its vote-count property; the other is the customer-to-customer private message, which the reading discusses under `records_text_chat` and does not cite for this row. Reviews, blog and news comments and profile pages are not matched |

Unsure in the reading, and not scored: `crawls_web`, `aggregates_content`,
`records_text_chat` and `relies_on_digital_identity`. lexcode reported nothing
for `crawls_web`, `records_text_chat` or `relies_on_digital_identity`. For
`aggregates_content` it gave one signal, `lexcode.aggregate.cs-feed-read` at
`src/Libraries/Nop.Services/Common/NopHttpClient.cs:174` (`RssFeed.LoadAsync`),
in the method that fetches the vendor news feed the reading discusses at
`NopHttpClient.cs:161`.

**Absent rows.** The reading marks 12 activities absent: `trains_models`,
`generates_images`, `generates_video`, `generates_audio`, `processes_voice`,
`processes_biometrics`, `records_calls`, `collects_e_signatures`,
`ships_mobile_app`, `operates_app_store`, `statutory_requests` and
`publishes_adult_content`. lexcode reported no evidence and no signal for any of
them, so the check has 0 FAIL.

**Client libraries (known gap).** lexcode reads files under
`wwwroot/lib/` as the app's own JavaScript in this phase. nopCommerce's
`src/Presentation/Nop.Web/wwwroot/lib/` holds adminLTE and summernote, with 2
JavaScript files; `wwwroot/lib_npm/` holds 426 JavaScript files, 263 of them not
minified or bundled. Of the record's 36 rows (29 evidence rows and 7 signal
rows), 0 lie under `wwwroot/lib/` and 0 under `wwwroot/lib_npm/`, so the count is
0 for every activity and no row rests on vendored code. The reading found the
same: no row rests on a client library.

The scan's notices, as printed: 172 bundled, minified or generated files
skipped (named `*.min.js`, `*.bundle.js`, `vendor.*.js`, `*.vendor.js`, `*.g.cs`
or `*.g.i.cs`), 1 file over 5 MB skipped, and the engine could not read 14 files.
<!-- nopcommerce:end -->

<!-- wikipedia-ios:start -->
### Wikipedia for iOS, read with Swift, the Xcode project and the Info.plist files

Measured 2026-11-15 over `wikimedia/wikipedia-ios` at commit `0919f3e`
(its tree is at https://github.com/wikimedia/wikipedia-ios/tree/0919f3eafd0b47492b5dac93b818a90b126ae8aa
and its license is MIT), with lexcode `v1.5` (branch build at commit
`cf76768`), against a reading of the same commit by an agent that had not seen
the Swift rules, checked row by row by a second reader who had not seen them
either, kept unchanged. The reading includes 6 activities from code, marks 20
as absent and leaves none unsure. Every figure below is from one run, `lexcode
scan` and `lexcode check --declaration` with that build: lexcode read 4,208
files and 2 extracted copies, in 13 seconds (scan) and 13 seconds (check), 0.46
GB at most, on a shared machine (load average about 5 when the scan started).
The check reports 0 FAIL and 0 WARN.

**Score: 2 of 6 found at evidence strength, 3 signal only, 1 missed. Family
credit changes nothing: none of the 6 rows has a parent or a child in the
registry, so the figures are the same with and without it. No evidence
lands on a row the reading marks absent, and one signal does (see "Absent
rows").** The 2 found are `processes_personal_data`, on the location manager and
the donation form's contact fields only, and `ships_mobile_app`, on the Xcode
application targets, the Info.plist files and the fastlane upload steps. The 3
signals are `ships_consumer_interface`, `distributes_software_product` and
`operates_social_platform`. The miss is `tracks_devices`: the app mints its own
install ID and sends it with every request and event, and no rule reads an ID
the app made for itself. Recall is printed, never gated. Paths below are
relative to the repository root.

| Activity | The reading | lexcode | Verdict |
|---|---|---|---|
| `processes_personal_data` | include: sign-in and account creation (`Wikipedia/Code/WMFAccountLoginLogoutFetcher.swift:94` to `:96`, `WMFAccountCreator.swift:162` and `:174`), the Keychain (`WMFKeychainCredentials.swift:132`), the Apple Pay donation payload (`WMFData/Sources/WMFData/Data Controllers/Donor Experience/WMFDonateDataController.swift:204` to `:241`), location (`WMF Framework/LocationManager.swift:78` and `:139`, `Wikipedia/Wikipedia-Info.plist:78` and `:82`), the geosearch call, Core Data page views and talk page posts, 24 lines in all | found, performs, 3 matches; `lexcode.personal.swift-device-location` at `WMF Framework/LocationManager.swift:78` (`startUpdatingLocation()`), and `lexcode.personal.swift-payment-contact` at `WMFComponents/Sources/WMFComponents/Components/Donate Form/WMFDonateViewModel.swift:389` and `:390` (the billing name and postal address, and the email address, the form asks Apple Pay for); 14 further signal rows, among them `Wikipedia/Wikipedia-Info.plist:78` and `:82` | Found, on one line the reading cites (`LocationManager.swift:78`) and on the donation flow in the view model that builds the request the reading follows to the data controller. The 2 plist lines are signals, not evidence. Sign-in, account creation, the Keychain write, the geosearch coordinates, the Core Data history and the talk page posts are not matched |
| `tracks_devices` | include: the install ID minted with `UUID().uuidString` (`Wikipedia/Code/WMFAppViewController+Extensions.swift:849` and `:850`, `NSUserDefaults+WMFExtensions.swift:92`), sent as the `X-WMF-UUID` header (`WMFData/Sources/WMFData/Service/WMFBasicService.swift:328`) and inside every analytics event (`WMF Framework/Event Platform/EventPlatformClient.swift:799`, `:944`, `:952`, `UserSession.swift:22`), the events endpoint (`EventPlatformClient.swift:193`), the Test Kitchen adapter and the hCaptcha package (`Wikipedia.xcodeproj/project.pbxproj:15742`), 20 lines in all | missed (searched, not found; 44 rules tried) | Missed, with every cited file read by the engine. The nearest rule, `swift-device-id-sent`, follows `identifierForVendor` into a request, and this app never reads it: the ID is a random UUID the app made, saved in its own store. No rule reads a self-made install ID. The scan's component list is empty, and the Swift package map leaves hCaptcha out on purpose, because its description names no activity |
| `ships_consumer_interface` | include: `Wikipedia/Code/AppDelegate.swift:18`, `SceneDelegate.swift:7`, `WMFAppViewController.swift:49`, `ExploreViewController.swift:9`, `ArticleViewController.swift:11`, `SearchViewController.swift:11`, `HomeViewController.swift:12`, `WMFLoginViewController.swift:9`, `WMFComponents/Sources/WMFComponents/Components/Home/WMFHomeView.swift:4` and `Wikipedia/Wikipedia-Info.plist:130` | signal only, 2 matches; `lexcode.consumer.swift-app-window` at `Wikipedia/Code/SceneDelegate.swift:7` and `lexcode.consumer.swift-signup-screen` at `Wikipedia/Code/WMFAccountCreationViewController.swift:10` | Signal only, by design: the consumer-interface rules are signal class. One match is on a line the reading cites (`SceneDelegate.swift:7`); the other is the account-creation screen, which the reading names only in prose. The Explore, Article and Home view controllers, 3 of the reading's lines, are among the files the engine could not read (see "Files the engine could not read"); the other cited screens were read and drew no match |
| `ships_mobile_app` | include: the application target and bundle identifier (`Wikipedia.xcodeproj/project.pbxproj:8158` and `:11884`), `Wikipedia/Wikipedia-Info.plist:74`, the TestFlight and App Store lanes (`fastlane/Fastfile:77` and `:302`), `.github/workflows/v2_submit_appstore.yml:1`, `README.md:2` and the extension targets (`project.pbxproj:8048` and `:8197`) | found, performs, 15 matches; `lexcode.mobile.xcode-ios-application` at `Wikipedia.xcodeproj/project.pbxproj:8158`, `:8259` and `:8287`; `lexcode.mobile.ios-info-plist` at `Wikipedia/Wikipedia-Info.plist:38`, `Wikipedia/Alpha-Info.plist:38`, `Wikipedia/Experimental-Info.plist:38` and `Wikipedia/Local-Info.plist:18`; `lexcode.mobile.swift-uikit-app-delegate` at `Wikipedia/Code/AppDelegate.swift:17`; and 7 of `lexcode.mobile.rb-fastlane-store-upload` in `fastlane/Fastfile` (`:77`, `:107`, `:236`, `:277`, `:302`, `:384`, `:421`) | Found, on 3 lines the reading cites (`project.pbxproj:8158`, `Fastfile:77` and `:302`) and in 1 more of its files (`Wikipedia-Info.plist`, where the match is the bundle identifier 36 lines above the reading's `:74`). `project.pbxproj:8259` and `:8287` are 2 further application targets, and the other Fastfile lanes and `AppDelegate.swift:17` (`@main`) are extra evidence. The reading's `:11884`, the extension targets and the workflow file are not matched |
| `distributes_software_product` | include: `LICENSE.txt:1`, `README.md:1`, `:2` and `:7`, the `Package.swift` of `WMFData`, `WMFComponents` and `WMFTestKitchen` (`:1` each), `Wikipedia/Wikipedia-Info.plist:64` | signal only, 7 matches; `lexcode.distribute.swift-package-product` at `WMFComponents/Package.swift:11`, `WMFData/Package.swift:11`, `:14` and `:16`, `WMFLocalizations/Package.swift:12` and `:15`, `WMFTestKitchen/Package.swift:11` (each a `.library(` product) | Signal only, in 3 files the reading cites, each match 10 or more lines below the reading's `:1`. The reading calls these four local packages the app's own libraries, consumed by the app targets and not published for others, so a signal is the strength the rule gives them. The MIT license, the README and `CFBundleVersion` are not matched |
| `operates_social_platform` | include: talk page replies and topics (`Wikipedia/Code/TalkPageFetcher.swift:189` and `:211`, `TalkPageDataController.swift:74` and `:82`), the undo edit (`WMFData/Sources/WMFData/Data Controllers/Watchlist/WMFWatchlistDataController.swift:452` and `:466`), thanks (`DiffThanker.swift:22`) and the user impact page (`WMFUserImpactDataController.swift:34`) | signal only, 3 matches; `lexcode.social.swift-post-composer` at `Wikipedia/Code/TalkPageReplyComposeContentView.swift:5`, `TalkPageReplyComposeController.swift:10` and `TalkPageTopicComposeViewController.swift:16` | Signal only, by design: the social rules are signal class. The 3 matches are the compose screens for the same talk page replies and topics the reading cites, in none of the reading's files. The undo, thanks and user impact lines are not matched |

Unsure in the reading: none, so every row above is scored.

**Absent rows.** The reading marks 20 activities absent: `crawls_web`,
`trains_models`, `generates_content`, `generates_text`, `generates_images`,
`generates_video`, `generates_audio`, `deploys_chatbot`, `processes_biometrics`,
`records_calls`, `records_text_chat`, `collects_e_signatures`, `ships_encryption`,
`operates_app_store`, `statutory_requests`, `publishes_adult_content`,
`processes_voice`, `automated_outreach`, `aggregates_content` and
`relies_on_digital_identity`. lexcode reported no evidence for any of them, so
the check has 0 FAIL. It reported one signal on one of them, read here:
`lexcode.voice.ios-plist-microphone-speech` at `Wikipedia/Experimental-Info.plist:86`
(`NSMicrophoneUsageDescription`), under `processes_voice`. The reading's own row
names those same lines (`Wikipedia/Experimental-Info.plist:78` to `:79` and `:86` to
`:87`) as the close call it ruled absent: the permission text sits in the
Experimental build's plist, the internal design-review build, and the production,
Alpha and Local plists carry neither string, and no recording code exists. Neither
side looks wrong. The rule reads every Info.plist in the tree and cannot tell
which configuration ships to the public, which is why it speaks at signal
strength, and the reading had already weighed the same line.

**Files the engine could not read (known gap).** 18 files, 17 Swift and 1
JavaScript (`Wikipedia/Code/Properties.js`). The Swift causes are grammar gaps in
the engine's parser: `#unavailable(...)`, `await` inside an `if let` or `guard
let` condition, `@objc(selector:)` accessors and `nonisolated(unsafe)`, and one
file with a raw string (`#"..."#`) that the engine's Swift scanner misreads, a
known engine fault. Three of the reading's cited lines lie in unread files, all
under `ships_consumer_interface` (`ExploreViewController.swift`,
`ArticleViewController.swift` and `HomeViewController.swift`, each unread for
`#unavailable`). Their evidence, if any, is missing from the record, so that row's
signal may undercount. No other row cites an unread file.

**Vendored code.** lexcode reads the three libraries under `Wikipedia/Third Party Code/`, which the reading puts out of scope, as the app's own Swift in this phase. Of the record's 45 rows (18 evidence rows and 27 signal rows), 0 lie under that directory, so no row rests on vendored code.

The scan's notices, as printed: skipped 4 symbolic links, 155 C and C++ files and
125 Objective-C files not read because lexcode has no rules for those languages
(the reading names no row that rests on Objective-C alone), and the engine could
not read 18 files.

**Re-run for the 1.5.0 release, 2026-11-16.** The release build gives the same
record, row for row, with the same notices and the same 0 FAIL. The scan took 15
seconds and 0.43 GB at most, under a load average of about 24.
<!-- wikipedia-ios:end -->

<!-- lemmy:start -->
### Lemmy, read with Rust and the Cargo manifests

Measured 2026-11-15 over `LemmyNet/lemmy` at commit `60d1cc3`
(its tree is at https://github.com/LemmyNet/lemmy/tree/60d1cc36a8d4ebea065d7f5df9294932497a79e4
and its license is AGPL-3.0), with lexcode `v1.5` (branch build at commit
`cf76768`), against a reading of the same commit by an agent that had not seen
the Rust rules, checked row by row by a second reader who had not seen them
either, kept unchanged. The reading includes 7 activities from code, marks 16
as absent and leaves 3 unsure. Every figure below is from one run, `lexcode
scan` and `lexcode check --declaration` with that build: lexcode read 1,479
files (and skipped 101 development dependencies), in 11 seconds (scan) and 11
seconds (check), 0.86 GB at most, on a shared machine (load average about 19
when the scan started). The check reports 0 FAIL and 0 WARN.

**Score: 6 of 7 found at evidence strength, 1 signal only, 0 missed. Family
credit changes nothing: none of the 7 rows has a parent or a child in the
registry, so the figures are the same with and without it. No evidence
lands on a row the reading marks absent, and one signal does (see "Absent
rows"). Of the 3 unsure rows, none drew evidence or a signal, so none is found
or missed.** Of the 6 found, 5 have evidence on lines or in files the reading
cites. The sixth, `distributes_software_product`, is found on 3 member crates'
manifests that the reading does not cite, so it counts as found by a different
route than the reading's, and the server binary, the Dockerfile and the release
script it rests on are not matched. The signal-only row is
`operates_social_platform`, an activity whose rules are signal class by design.
Recall is printed, never gated. Paths below are relative to the repository root.

| Activity | The reading | lexcode | Verdict |
|---|---|---|---|
| `processes_personal_data` | include: `crates/db_schema/src/source/person.rs:26`, `:36`, `:52`, `local_user.rs:27` and `:28`, `login_token.rs:27` and `:28`, `private_message.rs:28`, `crates/db_schema/src/impls/local_user.rs:41`, `crates/api/api_crud/src/user/create.rs:83`, `crates/api/api/src/local_user/export_data.rs:17` and `crates/api/api_crud/src/user/delete.rs:23`, 12 lines in all | found, performs, 16 matches; 6 of `lexcode.personal.rs-password-hash` (`crates/db_schema/src/impls/local_user.rs:41` and `:87`, `crates/api/api/src/local_user/login.rs:40` and `:56`, `change_password.rs:33`, `crates/api/api_crud/src/user/delete.rs:35`) and 10 of `lexcode.personal.rs-model-field` (`crates/db_schema/src/source/local_user.rs:27`, `:28`, `:91`, `:93`, `:166`, `:167`, `login_token.rs:27` and `:39`, `email_verification.rs:13` and `:22`) | Found, on 4 lines the reading cites (`impls/local_user.rs:41`, `source/local_user.rs:27` and `:28`, `login_token.rs:27`) and in 1 more of its files (`user/delete.rs`, where the match is `:35` and the reading cites `:23`). The person record, the private message, the data export and the registration handler are not matched, and the registration handler (`user/create.rs`) is among the files the engine could not read |
| `crawls_web` | include: the link-preview fetch (`crates/api/api_utils/src/request.rs:72`, `:90`, `:188`, `:498`), `crates/api/api_utils/Cargo.toml:82`, `crates/api/api_crud/src/post/create.rs:156`, `crates/apub/objects/src/objects/post.rs:326`, the nodeinfo poll (`crates/routes/src/utils/scheduled_tasks.rs:881` and `:920`), the bootstrap fetch (`crates/api/api_crud/src/user/create.rs:729`) and `Cargo.toml:180` | found, performs 2 and enables 1; `lexcode.crawl.rs-link-preview-fetch` at `crates/api/api_utils/src/request.rs:88` and `:576`; `pkg:cargo/webpage@2.1.0` at `crates/api/api_utils/Cargo.toml:82` | Found, on a line the reading cites (`Cargo.toml:82`, the `webpage` crate) and on the GET at `request.rs:88`, the start of the fetch the reading describes at `request.rs:88-96`. The reading calls this row a hard call. The nodeinfo poll and the bootstrap fetch lie in unread files (`scheduled_tasks.rs`, `user/create.rs`), so they were not seen |
| `aggregates_content` | include: `crates/api/api_utils/src/request.rs:72`, `:247`, `:265`, `:477`, `crates/db_schema/src/source/post.rs:48`, `:50`, `:52`, `crates/api/api/src/post/get_link_metadata.rs:9`, `crates/routes/src/images/download.rs:59` and the migration `migrations/2026-03-03-211442-0000_move_config_pictrs_to_db/up.sql:9` | found, performs, 2 matches; `lexcode.aggregate.rs-link-preview` at `crates/api/api_utils/src/request.rs:269` and `:278` (`HTML::from_string(...)`) | Found, in a file the reading cites and in the function it cites, 4 lines below its `:265`: the parse of the fetched page for title, description and image. The stored embed fields, the thumbnail keeping and the metadata endpoint are not matched |
| `automated_outreach` | include: `crates/email/src/send.rs:19`, `:32`, `:62`, `crates/email/Cargo.toml:33`, `crates/email/src/notifications.rs:38`, `crates/api/api_utils/src/notify.rs:118`, `:312`, `:361`, `crates/email/src/account.rs:16` and `:40`, `crates/email/src/admin.rs:7` and `:32`, `crates/utils/src/settings/structs.rs:22` | found, performs 2 and enables 1; `lexcode.outreach.rs-send-in-loop` at `crates/api/api_utils/src/notify.rs:118` and `:361`; `pkg:cargo/lettre@0.11.23` at `crates/email/Cargo.toml:33` | Found, on 3 lines the reading cites. The mail itself (`send.rs`, `notifications.rs`, `account.rs`, `admin.rs`) is not matched, and the reading marks the row as needing configuration |
| `ships_encryption` | include: `Cargo.toml:189` (bcrypt), `crates/db_schema/src/impls/local_user.rs:41` and `:87`, the HS256 token (`crates/api/api_utils/Cargo.toml:84`, `crates/api/api_utils/src/claims.rs:53`), TOTP (`crates/api/api_utils/Cargo.toml:59`, `crates/api/api_utils/src/utils.rs:241`), the RSA key pairs (`crates/api/api_crud/src/user/create.rs:539`, `community/create.rs:103`, `crates/routes/src/utils/setup_local_site.rs:59`, `Cargo.toml:154`) and rustls with ring (`Cargo.toml:217`, `crates/diesel_utils/src/connection.rs:179`), 13 lines in all | found, performs, 2 matches; `lexcode.crypto.rs-bundled-tls` at `crates/api/api_utils/src/request.rs:42` (`rustls::crypto::ring::default_provider().install_default()`) and `crates/diesel_utils/src/connection.rs:181` (`ClientConfig::builder()`) | Found, on the rustls and ring part of the reading and 2 lines below its `connection.rs:179`. The bcrypt calls, among them the reading's `impls/local_user.rs:41` and `:87`, draw nothing here: password hashing keeps no data confidential, so lexcode does not read it as shipping encryption (it is evidence under `processes_personal_data`). The token signing (`claims.rs:53` was read) and the key pair at `community/create.rs:103` drew no match, and the TOTP code and 2 of the key pair lines lie in unread files (`utils.rs`, `user/create.rs`, `setup_local_site.rs`) |
| `distributes_software_product` | include: `LICENSE:1`, `README.md:81`, `Cargo.toml:5`, `crates/server/Cargo.toml:2`, `crates/server/src/main.rs:8`, `docker/Dockerfile:46` and `:58`, `docker/docker-compose.yml:25` and `scripts/release.bash:1` | found, performs, 3 matches; `lexcode.distribute.cargo-published` at the `[package]` header, line 1, of `crates/db_views/notification_sql/Cargo.toml`, `crates/db_views/report_combined/Cargo.toml` and `crates/db_views/report_combined_sql/Cargo.toml`; 29 further signals of `lexcode.distribute.cargo-package` in other member crates | Found by a different route, on no line or file the reading cites. The 3 matches are member crates that set `publish = true`, which says a crate is made available to others; the reading rests the row on the server that people install and run themselves, and the binary, Dockerfile, compose file and release script are not matched. The root manifest the reading cites at `Cargo.toml:5` is not matched either |
| `operates_social_platform` | include: the create handlers for posts, comments, communities and private messages (`crates/api/api_crud/src/post/create.rs:47`, `comment/create.rs:40`, `community/create.rs:50`, `private_message/create.rs:32`), `crates/api/api/src/post/like.rs:27`, `community/follow.rs:14`, the route table (`crates/api/routes/src/lib.rs:280` and `:309`), `crates/api/api_crud/src/user/create.rs:83` and `crates/db_schema/src/source/person.rs:36` | signal only, 4 matches; `lexcode.social.rs-follow-relation` at `crates/apub/activities/src/protocol/following/follow.rs:15` and `crates/db_schema/src/source/person.rs:159`, `lexcode.social.rs-post-model` at `crates/db_schema/src/source/post.rs:28`, `lexcode.social.rs-direct-message` at `crates/db_schema/src/source/private_message.rs:24` | Signal only, by design: the social rules are signal class. One match is in a file the reading cites (`person.rs`, well below its `:36` and `:52`); the others are the follow, post and private message data types. The handlers, the vote and follow actions and the route table are not matched |

Unsure in the reading, and not scored: `records_text_chat`,
`relies_on_digital_identity` and `publishes_adult_content`. lexcode reported
nothing for any of them, with no signal, so none is found or missed. The reading
leaves `records_text_chat` open on whether stored private messages count as a
chat, `relies_on_digital_identity` on whether sign-in through an administrator's
OAuth2 provider counts, and `publishes_adult_content` on whether a platform that
lets users flag and view NSFW posts counts.

**Absent rows.** The reading marks 16 activities absent: `trains_models`,
`generates_content`, `generates_text`, `generates_images`, `generates_video`,
`generates_audio`, `deploys_chatbot`, `processes_voice`, `processes_biometrics`,
`records_calls`, `collects_e_signatures`, `ships_mobile_app`, `operates_app_store`,
`ships_consumer_interface`, `statutory_requests` and `tracks_devices`. lexcode
reported no evidence for any of them, so the check has 0 FAIL. It reported one
signal on one of them, read here: `lexcode.consumer.rs-signup-route` at
`crates/api/routes/src/lib.rs:344` (`.route("/register", post().to(register))`)
and `crates/api/routes_v3/src/lib.rs:165` (`resource("/user/register")`), under
`ships_consumer_interface`. The reading rules the row absent because the tree is
an HTTP API with no screen of its own, the screens being a separate repository.
The reading is right by the activity's own wording, which leaves out an API with
no screen of its own. The rule reads a sign-up path on a router and cannot tell a
server that renders a page from one that answers in JSON, which is why it speaks
at signal strength; whether a sign-up route with no front end in the tree should
be shown at all is a question for the rule, not the key.

**Files the engine could not read (known gap).** 18 files, all Rust: 15 use async
closures (`async |x| { ... }` or `async move || { ... }`, Rust 2024), 1 has an
associated-type bound inside a generic parameter list
(`crates/diesel_utils/src/utils.rs`) and 2 have attributes on generic parameters
(`crates/db_views/vote/src/impls.rs`, `crates/diesel_utils/src/pagination.rs`).
One of the 18 is a test file, outside the record in any case. Of the reading's
cited lines, those in `crates/api/api_crud/src/user/create.rs` (under
`processes_personal_data`, `crawls_web`, `ships_encryption` and
`operates_social_platform`), `crates/routes/src/utils/scheduled_tasks.rs`
(`crawls_web`), `crates/api/api_utils/src/utils.rs` and
`crates/routes/src/utils/setup_local_site.rs` (`ships_encryption`) are in unread
files, so the evidence there is missing from the record. No row's verdict
changes on that account, because each of those rows is found or signalled on
other lines.

**Vendored code.** Of the record's 64 rows (29 evidence rows and 35 signal rows), 0 lie under a `vendor`, `Pods` or `node_modules` directory, so no row rests on vendored code.

The scan's notices, as printed: skipped 1 symbolic link, and the engine could not
read 18 files.

**Re-run for the 1.5.0 release, 2026-11-16.** The release build gives the same
record and the same score, except that the 6 `rs-password-hashing` signals under
`ships_encryption` are gone (the table above is updated): 1.5.0 reads password
hashing as no part of shipping encryption. The notices and the 0 FAIL are
unchanged. The scan took 12 seconds and 0.85 GB at most, under a load average of
about 24.
<!-- lemmy:end -->

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
and an ERB file with no `<script>` block gives the scan nothing. Blocks are
looked for with the file's ERB tags blanked, so a `<script>` inside a comment
tag (`<%# <script> %>`) or a Ruby string is not read as live, and a
`</script>` inside a tag does not end a block.

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
and the scan names it in the record's notice: `the engine could not read N
files in full; evidence in them may be missing from this record`, followed by
the files under "Not parsed in full". Two engine limits shape the
rules. A class literal in a pattern matches every class literal, so a rule does
not key on one. A wildcard import binds no class, so a rule that guards on an
import keeps its list of names for the wildcard arm.

The definitions the rules follow, one line each:

- A cipher or a key agreement is `ships_encryption` whether it runs through the
  platform's own crypto (a javax.crypto `Cipher` or `KeyAgreement`) or a bundled
  library, and each call is counted by one rule. A `Cipher.getInstance` whose
  provider is Bouncy Castle by name (`"BC"` or `BouncyCastleProvider.PROVIDER_NAME`,
  with `Cipher` imported or fully qualified) is the library rule's; every other
  one, a Bouncy Castle provider passed as an object (`new BouncyCastleProvider()`,
  `Security.getProvider("BC")`) included, is the platform rule's. Password
  hashing is not `ships_encryption` (see "Shipping encryption" below).
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
tag with no closing `>` are left alone. Blocks are looked for with the file's
JSP syntax blanked the same way, so a `<script>` inside a JSP comment
(`<%-- --%>`), a scriptlet or expression string, an EL expression or a
namespaced tag's attribute is not read as live, and a `</script>` inside one
does not end a block.
Thymeleaf templates are `.html` and already read; FreeMarker and Velocity
templates are not read.

## PHP, Blade, Twig and the Composer ecosystem

How lexcode reads PHP and its views, where the engine cannot, and what a
Composer manifest counts. Composer is one ecosystem, `composer`: a dependency is
named `<vendor>/<package>`, its package URL is `pkg:composer/<vendor>/<package>@<version>`,
its evidence rule id is `lexcode.manifest.composer`, and the component map is
`components/composer.yml`.

### Composer

Every in-scope `composer.json` is read. Its direct dependencies are the keys of
`require`. The keys of `require-dev` are skipped and counted. Platform names are
neither recorded nor counted: `php`, `php-64bit`, `php-ipv6`, `php-zts`,
`php-debug`, `hhvm`, `composer`, `composer-plugin-api`, `composer-runtime-api`,
`ext-*` and `lib-*`. A `composer.json` under a `vendor-bin/` directory holds the
development tools of `bamarni/composer-bin-plugin`, so its `require` is skipped
and counted too.

A dependency's version comes only from the `composer.lock` beside its
`composer.json`: the `packages[]` entry of the same name (compared without
regard to case), with `version` recorded as written, so `v7.1.0` stays `v7.1.0`.
A constraint in `composer.json` is never a version. With no lock beside the
file, or with a name the lock does not list, the row is recorded without a
version, and the scan gives one notice for all of them, not one per dependency:
`N Composer dependencies have no locked version (no composer.lock beside
composer.json, or a name it does not list); recorded without a version`. A lock
that does not parse gets a notice naming it, and its rows carry no version. The
row's manifest line is the line of the package's key inside `"require"`.

### PHP files

The engine reads `.php`, `.phtml` and `.tpl` as PHP. Given as explicit targets,
`.inc`, `.module`, `.theme` and `.install` files each scanned 0 files (measured
2026-11-12). So those four are copied whole to `<path>.lexcode.php` in
lexcode's temporary directory and scanned there; a finding in the copy is
reported against the original path and line. A file is copied only when its text
begins with `<?php`, after an optional byte order mark and white space, because
`.inc` is also a C, Pascal and assembler extension.

### PHP, Blade and Twig views

A `.php` or `.phtml` file joins the `<script>` block extraction used for Vue,
Svelte, HTML, Jinja, ERB and JSP, and the block is read as JavaScript. A block
is looked for only in inline HTML: every PHP region (from `<?php`, `<?=` or
`<?` to `?>`, or to the end of the file) is blanked before the search, so a
`<script>` written inside a PHP string is not a block. Inside a block, an output
tag becomes `_` padded with spaces to its length, so the JavaScript around it
still parses: `<?= ... ?>`, and a `<?php` or `<?` tag whose code begins with
`echo` or `print` (in any case). Every other PHP tag becomes spaces. Line breaks are kept, so line numbers hold. The scan of a PHP
region honors quotes, heredocs and comments.

A `.blade.php` view (matched before `.php`) is read that way first. Then, inside
a block, `{{ ... }}`, `{!! ... !!}`, `@json(...)` and `@js(...)` become `_`
padded, and `{{-- ... --}}` becomes spaces. Any other directive becomes spaces,
together with its argument list when one follows: an `@` plus an identifier, not
preceded by a word character or `@`. An `@php ... @endphp` span becomes spaces
too. An `@` inside a word, such as an email address in a JavaScript string, is
left alone. Blocks are looked for with the PHP regions and then the Blade syntax
blanked, so a `<script>` inside a Blade comment (`{{-- --}}`), an echo or an
`@php` span is not read as live.

A `.twig` file (so `.html.twig`) is read the same way. Inside a block, `{{ ... }}`
becomes `_` padded, and `{% ... %}` and `{# ... #}` become spaces, including the
forms with a `-` for white-space control. Tera (`.tera`), Jinja (`.jinja`,
`.jinja2`, `.j2`) and Nunjucks (`.njk`) files get the same blanking. Blocks are
looked for with these tags blanked, so a `<script>` inside a comment
(`{# #}`), a `{% set %}` string or an output tag is not read as live, and a
`</script>` inside a tag does not end a block. Mustache is not read: its
sections are a convention of one app, and that app's JavaScript lives in plain
`.js` files that lexcode already reads.

A `.blade.php` view also parses as PHP without error, because its markup is
inline HTML, so the PHP rules run over it harmlessly. Blade's `{{ }}` contents
are not PHP to the engine.

### The PHP gate

The release test requires every evidence-class activity to have a rule whose
`languages` include `php`. One exemption stands: `distributes_software_product`,
whose PHP evidence lives in `composer.json`, is met by a `composer-` rule, as
Java's is met by a build-file rule. Any other exemption must be argued and
ruled before it is added.

### What the PHP rules decide

- A library class is matched by a twin: the fully qualified name, or the short
  name inside a `use <FQN>;` import. An alias binds: after
  `use Twilio\Rest\Client as TwilioClient;`, `new TwilioClient(...)` is found.
  The engine does not resolve imports, so no rule relies on it to join the two
  forms.
- An app's own class of the same short name in another namespace is not matched
  as the library's.
- Model output sent back in a response is followed when it leaves as an array
  value (`['reply' => $reply]`) or through `->with('reply', $reply)`.
- The openssl and sodium extensions' ciphers and key exchange are
  `ships_encryption` evidence, as Laravel's encrypter and the bundled
  libraries are. An encrypted cast on a column named for access-control data
  (a two-factor secret, a token, an API key) is not, and neither is Laravel's
  cookie encryption.

### Known PHP gaps

- On Opengrep 1.33.1 a `use X;` pattern also matches `use X as Y;`. Every PHP
  branch that matches a class, facade or trait by its short name carries a
  `pattern-not-inside: use X as $A; ...` for it, so a file that imports the same
  class both plainly and aliased loses its plain-name matches. A rule that uses
  `use X;` only as a file-level signal that the library is present (it then
  matches a method call on a variable) has no such guard and counts an aliased
  import too, on purpose.
- A grouped `use A\{B, C};` cannot be written as a pattern. In a target file it
  is matched by a `use A\$C;` pattern, so only the patterns are affected.
- Scanning a PHP region honors quotes, heredocs and comments. What remains is a
  `?>` inside a `{$...}` interpolation: `"{$b["?>"]}"` ends the region early.
- `compact('reply')` passed to a view or a response is not followed, because
  taint cannot link a string to a variable. `['reply' => $reply]` and
  `->with('reply', $reply)` are followed.
- Laravel's `Http::` facade is matched by name, because Laravel aliases it
  globally and routes files use it with no `use`. An app class named `Http`
  with a static `get($url)` would also match, and that call is itself a fetch.
- Mail to administrators sent from a loop, a scheduled job or a background job
  is a known false-match class, as in Ruby and Java. Console commands are left
  out of the background-job rule on purpose.
- Vendored code outside `vendor/` is read as the app's own code, including those
  libraries' `composer.json` files. An app can list such directories in a file
  of its own (Moodle does, in `thirdpartylibs.xml`), but lexcode does not read
  that list in this release.
- Inside a `@verbatim` span in Blade, a `{{ }}` is still blanked as a tag, and
  so is a `{{ }}` or `{# #}` inside a `{% raw %}` or `{% verbatim %}` span in
  Twig, Tera, Jinja and Nunjucks, though the template prints each as written.
- An Artisan command that extends an app's own base command class is not
  excluded from the signature rule, because the engine cannot follow
  inheritance.
- Some PHP anchors lead with `->`, which cuts the whole-file reach (see the
  next section) to roughly 700 to 950 KB in arrow-dense files, below the
  1,000,000-byte notice.
- PHP has no result-returned signal rule, as Python, JavaScript, Ruby, Java and
  Kotlin have: a service class that calls a model and returns its output gives
  no signal when the response is built in another file.
- No rule reads a NativePHP Mobile app as `ships_mobile_app` (the PHP rule reads
  a Google Play upload), or a PHAR built by Box from a `box.json` as
  `distributes_software_product` (the PHAR rule reads code that builds one with
  the `Phar` class).

## C#, Razor and the NuGet ecosystem

How lexcode reads C# and Razor views, where the engine cannot, and what a NuGet
manifest counts. NuGet is one ecosystem, `nuget`: a dependency is named by its
package Id (compared without regard to case), its package URL is
`pkg:nuget/<Id>@<version>`, its evidence rule id is `lexcode.manifest.nuget`,
and the component map is `components/nuget.yml`. Nothing is fetched: a package
outside the repository is not read, and neither is the NuGet cache.

### NuGet

A project file (`*.csproj`, `*.fsproj`, `*.vbproj`: the packages are NuGet
whatever the project's language) holds `<PackageReference Include="...">`
dependencies; `Update` and `Remove` forms are not new ones.
`Directory.Build.props` and `.targets` hold references for every project below
them, recorded once, at that file. `Directory.Packages.props` gives versions
only, and a legacy `packages.config` lists `<package>` entries. A row's manifest
line is the line of its element.

Skipped and counted as development: a reference whose `PrivateAssets` is `all`;
every reference of a test project (`<IsTestProject>true</IsTestProject>`, a
reference to `Microsoft.NET.Test.Sdk`, or the `MSTest.Sdk` project SDK); every
`<GlobalPackageReference>`; and a `packages.config` entry marked
`developmentDependency="true"`. A Directory.Build file is not a project, so its
references are judged one by one: development only when the reference or its
`<ItemGroup>` has a `Condition` requiring `IsTestProject` to equal `true`, and
`Microsoft.NET.Test.Sdk` always.

A version comes from the first of these that is present: the
`packages.lock.json` beside the project file (the `type: "Direct"` entry of that
Id, passed over when it is not a plain version); the reference's own
`VersionOverride` or `Version` (for a `packages.config` entry, its `version`);
the `<PackageVersion>` of the nearest `Directory.Packages.props` at or above the
project. Only a plain NuGet version (`1.2.3`, `1.2.3-beta.1`) counts: a floating
version (`*`), a range, or an MSBuild property lexcode cannot resolve gives the
row no version, and the search stops at the source that held it. `$(Name)`
resolves one level, from a `<PropertyGroup>` of the same file, else of the
nearest `Directory.Build.props`, else of the nearest `Directory.Packages.props`.
Rows with no version get one notice for all of them: `N NuGet dependencies have
no resolved version (no packages.lock.json, a floating or range version, or an
MSBuild property lexcode could not resolve); recorded without a version`. A file
that does not parse gets a notice naming it.

Known NuGet gaps: a test host with no test marker (an Aspire functional-test
project) is not a test project, so under `--include-tests` its references count;
in a Directory.Build `Condition`, `IsTestProject` is recognized only in a quoted
comparison (in a project it is the property
`<IsTestProject>true</IsTestProject>`); `Include="Foo;Bar"` is read as one Id; a
package referenced twice in one file is read once, from its first reference; and
a reference's own floating `Version` does not fall through to
`Directory.Packages.props`, and a `$(Name)` in a central version resolves from
the props file's location, not the project's.

### C# files

The engine reads only `.cs` as C#: given as explicit targets, `.csx`, `.cake`,
`.razor` and `.cshtml` files each scanned 0 files (measured 2026-11-12). So
`.csx` and `.cake` scripts are not read, a known gap that the scan's notice about
other languages does not name. `*.g.cs` and `*.g.i.cs` are skipped as generated,
and `*.Designer.cs` is read. A file the parser cannot read is counted in the
notice `the engine could not read N files in full; evidence in them may be missing from
this record`, which names the file. In a walk, `bin` is skipped only where it holds a `Debug` or `Release`
directory, so `bin/x64/Debug` is read. A legacy NuGet restore folder is skipped,
but missed where its `.nupkg` files are gitignored and absent from the disk, and
where the restore uses the `RestorePackagesPath` layout. Files under
`wwwroot/lib/`, LibMan's default for client libraries, are read as the app's own
JavaScript, a known gap.

### Razor views

`.cshtml` and `.razor` files join the `<script>` block extraction used for Vue,
Svelte, HTML and the other template languages. Blocks are looked for with the
file's `@* *@` comments blanked, and the C# strings and comments that hold a
`<script` inside a code block, control block or expression, so a script in a
comment or a C# string (`@{ var s = "<script>..."; }`, `@Html.Raw("<script>...")`)
is not read as live. A code or control block is not blanked whole for the
search, because markup inside one (a `<script>` element written in `@if { }` or
`@{ }`) is live. Inside a block the Razor syntax is blanked so the JavaScript
around it still parses and line numbers hold. Comments, `@{ }` code blocks and
control blocks (`@if`, `@foreach`, `@using` and the rest, header and braces
included) become spaces, except the content of `<text>` elements and `@:` lines
inside a control block, which stays as script (inside `@{ }` they are blanked
too). An expression, `@( ... )` or an implicit one such as `@Model.Name` or
`@await Foo()`, becomes `_` padded to its length. An `@` after a letter or digit
is an email address and is left alone, and brackets are matched with C# strings
in mind, so a `)` inside a string does not end one.

A Razor file with at least one `@code { ... }` or `@functions { ... }` block
also gets a C# copy, `<path>.lexcode.cs`, whose findings are reported against
the original file and line. It is one class, `__RazorCode`:

- The class header goes at the start of the first line that is neither blank nor
  a directive line (`@page`, `@using`, `@rendermode`, `@layout`, `@attribute`,
  `@implements`, `@inherits`, `@namespace`, `@model`, `@typeparam`,
  `@preservewhitespace`). A line holding only a `@* *@` or `<!-- -->` comment
  counts as blank, and a file of only blank and directive lines gets its header
  on its first code block's line.
- A `@using <namespace>` before the header becomes `using <namespace>;`, other
  directives before it become spaces, and `@inject <Type> <Name>` becomes the
  field `<Type> <Name>;`. Each code block keeps its body and loses its braces,
  everything else becomes spaces, and line numbers hold.

Known Razor gaps:

- An `@using` after the class header is not read as a `using`, so a file whose
  `@inject` comes before its `@using` loses that using. `_Imports.razor` (and
  `_ViewImports.cshtml` for views) holds the usings of every component or view
  beside it, in another file, so a library type there is found only by a
  short-form pattern. A `@{ ... }` statement block is not read as C#; only
  `@code` and `@functions` are.
- The block search reads markup inside a code or control block as C# when it
  looks for strings and comments, so a `//` in that markup's text (a written-out
  `http://` address) hides a `<script>` later on the same line.
- Markup inside an `@functions` method lands in the C# copy, which the engine
  reads as partly parsed, so a match inside the dropped part is missing (the
  scan counts the file in its unread-files notice), and `@@code {` (an escaped
  `@code`) is read as a code block there.
- In a script block, an expression that writes code
  (`$("#tabs").tabs()@Html.Raw(x);`) becomes `_` and leaves invalid JavaScript,
  both branches of an `@if` / `else` around `<text>` elements are kept, and a
  `<script>` inside a `@* *@` comment or a `@{ }` string is read as live. An
  unclosed `<!--` blanks everything to the next code block, which can hide
  `@inject` lines after it.

### The C# gate

The release test requires every evidence-class activity to have a rule whose
`languages` include `csharp`. One exemption stands:
`distributes_software_product`, whose evidence lives in project files, is met by
an `msbuild-` rule, as Java's is met by a build-file rule. Those rules read
project and `.nuspec` text as `generic` files. Any other exemption must be
argued and ruled before it is added.

### What the C# rules decide

- A library type is written fully qualified, once, and matches under a `using`,
  a `global using` in the same file and an alias, never an app's own class of the
  same name. A type from a namespace the .NET, Web or MAUI SDK imports implicitly
  is matched in both forms, and a third-party type gets a short form only when
  its short name carries the vendor's or product's own name. The engine behavior
  behind this is in CONTRIBUTING.md, "C# pattern notes".
- Generation evidence is a direct generating call whose result reaches a sink (a
  response, a view, a component field). A client or request object handed around
  (`GetService<IChatClient>()`, `GetChatClient(...)`, a new request) is a signal.
- .NET's own cryptography used to keep data confidential (`AesGcm`, an `Aes`
  encryptor, RSA encryption, `ECDiffieHellman`, `ProtectedData`) is
  `ships_encryption` evidence, as a bundled library that encrypts (Bouncy
  Castle, NSec, libsodium, PgpCore, JOSE) is. So is an ASP.NET Core Data
  Protection protector the app creates, unless its purpose string names a
  token, cookie, session or other sign-in secret. Password hashing, PBKDF2 and
  the framework's own key ring and sign-in cookies are not.
- A bare Twilio `VoiceResponse.Record` verb (voicemail) is `processes_voice`, not
  `records_calls`, and an in-app SignalR notification is a user interface push,
  not `automated_outreach`.

### Known C# gaps

The engine sets most of these limits, and the rules' comments point here.

- A third-party type reached only through a `global using` in another file
  (`GlobalUsings.cs`, an MSBuild `<Using Include>`) is missed, except where its
  short name carries the vendor's own name.
- A namespace alias combined with a generic type argument (`Mt.IConsumer<A>`,
  `Id.UserManager<T>`) is not resolved. The engine knows the type of a field, a
  parameter and a local built with `new`, not of a value from a static factory
  or `var x = call()`, so a call on `var a = client.GetAudioClient(...)` is found
  at the factory call where a rule reads it there, and missed otherwise.
- Generation: a reply stored by member access in a Blazor component
  (`_answer = r.Text`), an anonymous-object response (`Ok(new { reply })`) and a
  hosted model's address in a plain `HttpClient` helper are not read, nor are
  Bedrock `ModelId` as a statement or non-literal, Vertex `PredictAsync` and
  `PredictLongRunning`, or a Vertex client from `builder.Build()`.
- Text chat: a history held in memory and sent to a model vendor is not
  `records_text_chat`, because the rules read a store.
- Voice and calls: no rule reads Android call audio, LiveKit egress,
  BigBlueButton, WebRTC audio taps or AWS Transcribe streaming.
- Crawling: the `HtmlWeb` and AngleSharp arms do not judge an interpolated
  address, so `OpenAsync($"pages/{n}")` matches.
- Personal data and tracking: a FluentMigrator migration on a custom base class,
  an EF Core configuration through a `var` or an owned-type chain, and a Dapper
  `Execute` that stores an IP are missed.
- Identity and signatures: a signature pad declared in XAML and Adobe Acrobat
  Sign are not read, and the selfie rule reads a class's members as text, so a
  field set in an initializer is missed, a method's use of an ID-document word
  is admitted, and a nested class can blur two classes' members.
- Shipping: a .NET for iOS app with neither MAUI nor Xamarin.Forms is not read as
  `ships_mobile_app` (its `AppDelegate` is shared with tvOS and Mac Catalyst, and
  its template `Info.plist` has no `CFBundleIdentifier`). A fine-tuning client in
  a `var` local and a launcher activity declared as a partial class with no base
  list are missed. A project that sets `PackageLicenseUrl`,
  `PackageLicenseExpression` or `PackageLicenseFile` for its license metadata
  only, or an app's own attribute named `Activity` with a `MainLauncher`
  property, matches.
- Encryption: a symmetric algorithm's encryptor (`CreateEncryptor`,
  `EncryptCbc` and the rest) is read where `System.Security.Cryptography`
  itself is imported (a deeper namespace such as `X509Certificates` alone does
  not count) or aliased, or where the algorithm was built fully qualified
  earlier in the same scope. It is missed in a file that reaches the namespace
  only through a `global using` elsewhere, and on an algorithm handed in from
  another file with no import. RSA encryption whose padding is held in a
  variable, and an `RSACryptoServiceProvider` held as a value from a factory or
  a `var` set from a call, are missed. A Data Protection purpose held in a
  variable is read whatever it protects.
- Signals: the MVC sign-up arm needs a literal `return View(...)` or
  `=> View(...)`, and no rule reads an `@page` or `.cshtml` route, so a
  storefront of Razor components with no sign-up screen shows no
  consumer-interface signal.

## Swift, Rust and the Cargo, Swift package and CocoaPods ecosystems

How lexcode reads Swift, Rust and Apple's configuration files, where the engine
cannot, and what a Cargo, Swift package or CocoaPods manifest counts. There are
three ecosystems, and each names a dependency its own way:

| Ecosystem | A dependency is named by | Package URL | Evidence rule id | Component map |
|---|---|---|---|---|
| `cargo` | the crate name | `pkg:cargo/<name>@<version>` | `lexcode.manifest.cargo` | `components/cargo.yml` |
| `swift` | the repository, `host/owner/repo` | `pkg:swift/github.com/alamofire/alamofire@<version>` | `lexcode.manifest.swift` | `components/swift.yml` |
| `cocoapods` | the pod, as `Podfile.lock` writes it | `pkg:cocoapods/Firebase@10.29.0#Analytics` | `lexcode.manifest.cocoapods` | `components/cocoapods.yml` |

A Swift package's name is its URL without the scheme, any `user@`, the `.git`
suffix and a trailing `/`, and `git@host:owner/repo` reads as `host/owner/repo`.
A CocoaPods subspec keeps its path in the name (`Firebase/Analytics`) and puts it
in the package URL's subpath. Every name is compared without regard to case.
Nothing is fetched: a package outside the repository is not read, and neither is
any package cache (`~/.cargo`, SwiftPM's, CocoaPods').

### Cargo

`[dependencies]`, `[dependencies.<name>]` and `[target.<cfg>.dependencies]` hold
dependencies, in `name = "1.0"`, `name = { version = ... }`, `name.workspace =
true` and `name = { workspace = true }` forms. A row's manifest line is the line
of the entry's key, or of its `[dependencies.<name>]` header. A renamed entry
(`package = "real"`) is named `real`. An entry with a `path` is the workspace's
own crate, so it is neither a row nor counted; a `git` entry is a row.
A `workspace = true` entry takes its specification from `[workspace.dependencies]`
in the nearest ancestor `Cargo.toml` that has a `[workspace]` table, its own
directory included. `[patch.*]` and `[replace]` are ignored.

Skipped and counted as development: `[dev-dependencies]` and
`[build-dependencies]`, in every target form.

A version comes from the `Cargo.lock` in the same directory or the nearest
ancestor that has one. The lock's `[[package]]` entries with the crate's name are
the candidates. With one candidate the row takes its version. With several, it
takes the highest version the requirement allows under Cargo's caret rule (the
same leftmost non-zero component, so `1.2` matches `1.x.y`, `0.4` matches
`0.4.z` and `0.0.3` matches `0.0.3`), and a tilde (`~1.2`) or exact (`=1.2.3`)
requirement is read as well; a comparison or a wildcard gives no version when
there are several candidates. A `git` entry takes the candidate whose `source`
starts with `git+`. Rows with no version get one notice for all of them: `N Cargo
dependencies have no resolved version (no Cargo.lock, or a requirement lexcode
could not match to one locked version); recorded without a version`. A
`Cargo.toml` or `Cargo.lock` that does not parse gets a notice naming it.

Known Cargo gaps: a crate spelled with a hyphen in one place and an underscore
in another (`serde_json`, `serde-json`) is looked up by the spelling the manifest
uses, in the lock and in the component map. Which cryptography crates and Swift
packages are mapped follows the rule for every map, under "Shipping encryption".
Key-agreement crates (`x25519-dalek`, `p256`) are not mapped, a known gap
since key agreement counts (#13318): `rs-library-encryption` reads
`x25519-dalek`'s key agreement in the code, and `p256`'s ECDH is not read.

### Swift packages

A `Package.swift` holds each `.package(url: ...)` call as a row, at the line of
`.package(`, with its arguments read by string-aware parenthesis matching. A
`.package(path: ...)` call is a local package, neither a row nor counted, and a
`.package(id: "scope.name", ...)` registry call is a row named `scope/name`. A
`Package@swift-5.9.swift` is an alternate of the same file and is not read, and
a URL built by string interpolation, or not written as a string literal (a
variable or a concatenation), is not a row: the scan gives a notice with its
line. In an Xcode project, `project.pbxproj` holds each
`XCRemoteSwiftPackageReference` as a row, at the line of its `repositoryURL`; an
`XCLocalSwiftPackageReference` is ignored. The file is an OpenStep property list,
which lexcode reads itself (nesting past 256 levels is a notice, not a crash); a
project file that is a binary or XML property list gets a notice naming it.

A package used by both manifests of one app, a `Package.swift` and the Xcode
project, is two rows, one per file.

A version comes from the first of these that is present: the pin in the
`Package.resolved` beside a `Package.swift` (for a project file, the one at
`<X>.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved`); the
nearest ancestor directory's `Package.resolved`; for a `Package.swift` with none
of those, the pins of the Xcode project or workspace in its own directory or an
ancestor's (a local package of an app resolves through the app's workspace);
and an `exact:` argument, `.exact(...)` or `requirement = { kind = exactVersion; ...}`.
A pin is matched by the last path segment of the URL, lowercased and without
`.git`, and `Package.resolved` formats 1, 2 and 3 are all read. A branch or
revision pin has no version. Rows with no version get one notice: `N Swift
packages have no resolved version (no Package.resolved, or a branch or revision
requirement); recorded without a version`.

Skipped and counted as development: a `Package.swift` dependency every
`.product(name: ..., package: "<identity>")` reference to which sits inside a
`.testTarget(`, and a project-file dependency used only by unit-test or UI-test
targets. A package used only through a build plugin, or named by a bare string in
a target's dependencies, stays a row.

### CocoaPods

Rows come from `Podfile.lock`'s `DEPENDENCIES` list, which holds the direct
dependencies, at each entry's line. A version is the pod's entry in `PODS`
(`- Name (1.2.3):`), never the constraint on the `DEPENDENCIES` line (`~> 10.0`,
`(from ...)`), and a subspec with no entry of its own takes its pod's version. A
`Podfile` with no lock gives a row for each `pod 'Name'` line, with a version
only when the second argument is a plain version (`'5.4.3'` or `'= 5.4.3'`).
Rows with no version get one notice: `N CocoaPods dependencies have no resolved
version (no Podfile.lock, and no exact version in the Podfile); recorded without
a version`.

A pod is development when every `pod '<Name>'` line for it in the `Podfile`
beside the lock sits inside `target '<T>' do` blocks whose name ends in `Tests`
or `UITests`. The Podfile is never run, so a pod added by a helper method called
inside a test target, and a one-line `target 'X' do; pod 'Y'; end`, stay rows.
A root pod declared in an app target keeps all of its subspecs as rows, even one
that a test target names by its full path.

Carthage's `Cartfile.resolved` is not read, a known gap. One notice per file
counts its entries: `<path>/Cartfile.resolved names N Carthage dependencies;
lexcode does not read Carthage, so they are missing from this record`. `Pods/`
and `Carthage/` are skipped as vendored code in every scan, even where a team
commits them.

### Swift files

The engine reads `.swift`, which includes `Package.swift`. Skipped as generated:
`*.generated.swift`, `*+Generated.swift`, `*.pb.swift`, `*.grpc.swift`, and any
`.swift` file under a directory named `GeneratedSources` (swift-openapi-generator's
output; the name is case-sensitive, and the directory's other files are read). Xcode test
targets, a directory whose name ends in `Tests` with a capital T, are test
directories. Objective-C is not read, and the scan counts its files in the
notice about other languages: every `.mm` file, and each `.m` file in a scope that
holds a `project.pbxproj`, a `Podfile` or a `Package.swift` (a `.m` file is also
MATLAB's). `.h` stays with C and C++. A Swift string interpolation is read as
the file writes it: a host written before the first `\( )` is the host
(`"https://api.example.com/\(id)"`), and one with the interpolation in the
scheme or host (`"https://\(host)/path"`) stays a signal, so an address the
code builds from a variable is never taken for one of your own hosts. Leaf templates
(`.leaf`, Vapor's) are not extracted: the one Swift server app measured holds 3,
all Markdown message bodies with no `<script>` block.

### Rust files

The engine reads `.rs`, including `build.rs` and `examples/`. `benches` is a test
directory. Unit tests live in the source file, in a `#[cfg(test)]` module, so a
scan drops every match in a `.rs` file that starts inside one, unless you pass
`--include-tests`. The module is a `mod <name> { ... }` item with the exact
attribute `#[cfg(test)]` among its outer attributes (other attributes, comments
and a visibility such as `pub(crate)` may sit between), found by a tokenizer that
knows strings, raw strings (`r#"}"#`), character literals and comments, so a
brace inside one does not end the module. `cfg(not(test))` and
`cfg(any(test, ...))` are code. Measured over three Rust apps on 2026-11-15, the
filter dropped 2 findings in Lemmy, 3 in a newsletter service and none in an API
server, and the default scan holds no finding that `--include-tests` lacks.

Tera templates (`.tera`, so `.html.tera`) join the `<script>` block extraction,
with Twig's tags blanked (`{{ }}`, `{% %}` and `{# #}`, with `-` whitespace
control). Askama templates are `.html` and were already read. Handlebars
(`.hbs`) is not read: it is also Ember's template extension, and adding it would
change what lexcode finds in JavaScript apps.

### Apple configuration files

Four kinds of Apple file are read. An `Info.plist` is read as XML. The engine's
`xml` language reads no `.xcprivacy` or `.entitlements` file, and an Xcode
project is not XML, so those three are read as `generic` text, each rule limited
to its file name. The rules' names say which file they read:

- `ios-plist-` rules read an `Info.plist` (or an Xcode `<Target>-Info.plist`) as
  XML, and `xcode-infoplist-` rules read the same keys written as
  `INFOPLIST_KEY_<key> = ...;` build settings in `project.pbxproj`.
- `xcprivacy-` rules read `PrivacyInfo.xcprivacy`: `NSPrivacyTracking` set to
  true, a non-empty `NSPrivacyTrackingDomains`, and collected data types linked to
  the person.
- `entitlements-` rules read `*.entitlements` keys (HealthKit, Sign in with
  Apple and shared web credentials, In App Identity Presentment).
- `xcode-ios-application` reads an application target in `project.pbxproj`, one
  whose build settings carry `SDKROOT = iphoneos` or a `SUPPORTED_PLATFORMS` that
  lists iphoneos, as `ships_mobile_app`, beside `ios-info-plist`.

A usage string or an entitlement shows that the app asks for a permission or a
capability, not that it does the activity: the same Wikipedia project carries a
microphone string in a build configuration that has no recording code. So the
usage-description rules (location, contacts and health, microphone and speech
recognition, Face ID, App Tracking Transparency, identity requests) and the
entitlement rules are signals, and the code rules carry the evidence. The
privacy manifest and the application target are evidence, because they are the
app's own statements: `NSPrivacyTracking` is the app saying it tracks,
`ITSAppUsesNonExemptEncryption = true` is the developer's own statement to App
Store Connect that the app uses encryption outside the export exemptions, and an
application target is a mobile app. A privacy manifest that lists only collected
data types that are not linked to the person says nothing the definition counts,
so only linked entries match.

Known gaps in the configuration rules:

- A binary property list is not text and the engine skips it. One was found in
  the six apps measured, a resource list (`LibrariesUsed.plist`) that is not an
  `Info.plist`, privacy manifest or entitlements file, so no evidence is lost; a
  binary `Info.plist` would be.
- A rule reads every `Info.plist` in the tree, so it cannot tell which build
  configuration ships to the public (a design-review build's microphone string
  speaks at signal strength for that reason).
- `xcode-ios-application` reads the platform from the whole project file. A
  project that holds an iOS target also counts its other application targets, a
  single-target watchOS, tvOS or visionOS app among them, and a project with a
  Mac app and a separate iOS-only framework target matches. A last `SDKROOT` setting
  more than about 1 MB from the end of the file loses the match with no notice.
- The rules also read the `Info.plist`, `PrivacyInfo.xcprivacy` and
  `*.entitlements` files inside a `*.framework` or `*.xcframework` bundle
  checked into the tree, so a vendored SDK's own privacy manifest or usage
  strings can match as the app's. Of the Apple dependency folders, only `Pods/`
  and `Carthage/` are skipped.

### The Swift and Rust gates

The release test requires every evidence-class activity to have a rule whose
`languages` include `swift`, and one whose `languages` include `rust`. The Apple
configuration rules are additional evidence, not Swift, and do not count toward
the Swift gate. One Rust exemption stands: `distributes_software_product`, whose
package evidence lives in `Cargo.toml` (`[package]` listing keys, `publish`, a
release packaging section), is met by a `cargo-` rule, as Java's is met by a
build-file rule and C#'s by an `msbuild-` rule. No Swift exemption was needed.
Any other exemption must be argued and ruled before it is added.

### What the Swift and Rust rules decide

- A library type is written module-qualified or by its full crate path, once,
  and the engine matches it under the file's `import` or `use`, never an app's
  own type of the same name. A Swift Foundation type (`URLSession`,
  `URLRequest`, `JSONEncoder`) reaches a file through `import UIKit`,
  `import SwiftUI`, `import AppKit` or `import Cocoa`, which the engine does not
  follow, so it is matched in its module-qualified and its short form. A Swift
  or Rust vendor type gets a short form only when the short name carries the
  vendor's or product's own name (`FirebaseApp`, `Mixpanel`, `SentrySDK`), or in
  Rust when the file also names the crate on a `use` line. The engine behavior
  behind this is in CONTRIBUTING.md, "Swift pattern notes" and "Rust pattern
  notes".
- Generation evidence is a direct model call whose result reaches a sink (a
  response, a view, a stored property, a returned value). A function that
  returns a model's result with no sink in view is a signal. Rust has no
  result-returned signals.
- A cipher or a key agreement is `ships_encryption` evidence whether it runs
  through Apple's own cryptography (CryptoKit, CommonCrypto's `CCCrypt`, the
  Security framework's SecKey encryption and key exchange:
  `swift-platform-encryption`), the system's OpenSSL through the Rust `openssl`
  crate (`rs-openssl-encryption`) or a bundled library (swift-crypto, which
  bundles BoringSSL, rustls with ring, RustCrypto ciphers, age, libsodium
  bindings). A CryptoKit-shaped call in a file that also imports swift-crypto's
  `Crypto` is read by `swift-library-encryption` only. A general cryptography
  library that also hashes, MACs or signs has no component-map entry (see
  "Shipping encryption"). HTTPS through
  `URLSession`, `native-tls` or the `openssl` crate's TLS is not read, and
  neither are hashing, a MAC, password hashing, key derivation and signing (see
  "Shipping encryption"). In Rust, password hashing is evidence of
  `processes_personal_data` instead, since a password is personal data.
- A Swift package product, `.library(...)` in `Package.swift`, is a signal for
  `distributes_software_product`: no manifest field separates a published
  library from a local one. A crate is evidence when its `[package]` table lists
  `keywords` or `categories`, sets `publish = true` (or a registry list naming
  crates-io), or has a `[package.metadata.docs.rs]` table, and so is a release
  packaging section (`cargo-dist`'s `dist-workspace.toml` among them); a crate
  with a description and a license only is a signal, and a crate with
  `publish = false` or a proprietary license is neither.
- `ships_mobile_app` is an iPhone or iPad app, as the definition says: a tvOS,
  visionOS or watchOS target is left out, and the iPad app on a Mac (Mac
  Catalyst) stays.
- A server-side fetch of the page behind a link someone posted, to build a
  preview, is `crawls_web` evidence: the definition has no scale condition.
  ActivityPub federation is read as neither crawling nor aggregation.
- Amazon Transcribe Call Analytics is `processes_voice`, as in C#. A system
  composer a person sends from (`MessageUI`) is not `automated_outreach`, since
  the person sends each message.
- A public sign-up route or screen, a compose-and-publish screen, a direct
  message, a post or follow model and any SwiftUI or UIKit app window are signals
  for `ships_consumer_interface` and `operates_social_platform`, never evidence.
- Opening the microphone (an `AVAudioRecorder`, a tap on an audio engine's input
  node, cpal's input streams) is `processes_voice` evidence in both languages.

### Known Swift gaps

The engine sets most of these limits, and the rules' comments point here.

- **Engine parse faults.** The engine's Swift grammar does not read `await` or
  `try await` in an `if let` or `guard let` condition, the typed shorthand `if let
  x: T {`, `#unavailable(...)`, a `#Predicate<...> { }` expression, an `if` or
  `switch` used as an expression, `consume`, `& ~Escapable`, `package import`,
  `@objc(selector:)` accessors or `nonisolated(unsafe)`. A file with one is read
  in part or not at all, for every rule, and the scan names it in `the engine
  could not read N files in full`. Of the three Swift apps measured on 2026-11-15, 32
  files were lost: 2 of a SwiftUI reference app, 13 of a Vapor Discord bot (among
  them its interaction and message handlers) and 17 of Wikipedia for iOS. Two of
  the 32 are raw-string losses from the scanner fault below, and 30 are grammar
  gaps.
- **The engine's Swift scanner.** Its state is allocated with `calloc(0, ...)`,
  so one field, which counts the `#` of a raw string, starts as whatever the
  memory held. On some runs it starts above zero, and then a file that declares a
  class with a modifier or attribute (`final class`, `public class`, `@objc
  class`) is parsed in time quadratic in its size (900 KB: 57 s, against 2.2 s
  when the field is clear), and a real raw string (`#"..."#`) is misread, which
  loses the file. In a run of one file it follows the length of the path (11
  characters or fewer is slow); in a scan it follows what the process allocated
  before. It is fixed upstream in tree-sitter-swift (commit `8abb3e8b33`), and
  Opengrep 1.33.1 still pins the fork without it. Parse time is outside the
  30-second limit a rule gets per file, so a slow parse is not cut off, and a
  large Swift file can make a scan slower than its size suggests. The cost
  script names its Swift test files with 12 or more characters for this reason.
- **A vendor reached by another file's import.** An `@_exported import` in one
  file brings a module to a whole target, and the engine does not follow it, so
  an import-guarded or module-qualified pattern misses a file that gets the
  vendor only that way, except where the short name carries the vendor's own
  name. Three files in the Vapor app use it (for an OpenAPI client, a Discord
  model type and LeafKit), none for a vendor a rule reads. The same holds for an
  umbrella: a file that imports only `AVKit` (which brings AVFoundation), or only
  `MapKit`, `SpriteKit`, `WebKit`, `StoreKit` or `PhotosUI` (which bring UIKit),
  is not read by a rule that guards on AVFoundation or UIKit. A file that builds
  an `HTTPClientRequest` through Vapor without `import AsyncHTTPClient` is not
  read by the rule that guards on that import.
- **Taint and functions.** Taint does not cross a function: a model result
  returned from a function that calls a helper (`return try await helper.ask(p)`),
  a result held at file scope and returned from a function that names no call, a
  page downloaded in one function and parsed in another, and a send called
  through the app's own function from a loop in another function are not joined.
  Top-level code (a `main.swift` script) is not seen by the HTML and feed rules,
  a script held in a variable is not read by the web view rule, and a source
  inside a `map` closure does not reach its result. Taint passes an optional
  binding only in part: `guard let a = r.x, let b = f(a)` binds only the first
  name, and a value derived two steps before the binding is lost.
- **Not read at all.** Objective-C and C and C++ files (125 and 155 in Wikipedia
  for iOS, named in the scan's notice), Core Data entities that Xcode generates
  from a `.xcdatamodeld`, a Sparkle updater created in a nib or storyboard, a
  SwiftUI `App` with no UIKit delegate (the Xcode project rule finds the app
  instead), a Mac app with no Sparkle (no Swift evidence of distribution), and
  Leaf templates (above).
- **Generation and chat.** Discord posts through DiscordBM, Anthropic's Swift
  clients, Slack bot messages, Firebase Cloud Messaging from a Swift server,
  Hummingbird jobs, `BGTaskScheduler` tasks and a Lambda event handler as a job
  shape, Soto's `SNS.PublishInput` type, a model reached through the app's own
  wrapper service, and on-device speech models (WhisperKit, whisper.cpp
  bindings) are not read. A system prompt placed in front of a request's
  messages (`[sys] + body.messages`) is missed, and a screen that keeps its
  history only in a Foundation Models `session.transcript` has no rule. The
  scheduled-job send rule skips a send inside a `do { } catch { }` clause, an
  alert to the operator, but not one inside a typed clause (`catch let error`,
  `catch is CancellationError`). Polly
  audio written to a file and played by URL breaks the flow at the write. With
  about 1,800 appends in one function the engine drops the history rule's match.
- **Identity, signatures and encryption.** No Swift rule reads a selfie with an
  ID document, a verifiable credential or a PDF signature, and identity vendors
  beyond the six SDKs the rules name reach only the URL rule. No Swift rule
  or map entry reads a bundled TLS stack (swift-nio-ssl, which vendors
  BoringSSL and comes in through AsyncHTTPClient or Vapor), so a server whose
  only encryption is that TLS is missed, as a Rust app whose rustls is chosen
  only by a Cargo feature is. A CryptoKit or CommonCrypto cipher cannot show
  what it encrypts, so one that holds only a sign-in token still counts and is
  for a person to confirm.
- **Data and tracking.** No rule reads a Vapor server's client address or a
  device fingerprint, and an install ID the app mints for itself (a random UUID
  kept in its own store and sent with every request) is not read, so
  `tracks_devices` is missed on an app that does only that. Taint does not follow
  a class property initialized from a source into a method.
- **Shipping.** A tvOS-only or visionOS-only app whose delegate file carries no
  platform cue is matched as a mobile app, an SDK's non-open delegate forwarder
  is matched, a delegate that conforms in fourth place or later is missed, and a
  test double is excluded by name only.

### Known Rust gaps

- **Imports the engine does not resolve.** A path inside a `use` group
  (`use async_openai::{types::Args, Client}`, `use a::{b::Item}`), `self as m`
  in a group, a glob (`use ring::aead::*;`) and a rename inside a group
  (`use poem::web::Form as PForm`) are not followed, so a crate-path pattern
  misses calls on those items. A rule covers a crate whose own examples use
  nested groups with a short form guarded by a check that the file names the
  crate on a `use` line, which means an app's own item of the same name in a file
  that also uses the crate reads as the crate's. A parameter type matches on its
  last path segment, so a rule that keys on a handler's parameter type also
  checks that the file uses the crate. A gated method on a client typed in another
  file, where this file never names the crate, is missed, and so is warp's `path()`
  called through a grouped `use` or an alias of the crate.
- **Macro bodies.** The engine does not see a call inside the body of `format!`,
  `serde_json::json!`, `tokio::select!`, `html!`, `view!`, `rsx!` or a Diesel
  `table!`, so a handler that returns `Json(json!({ "reply": reply }))` or
  `Html(format!(...))` is not followed, taint into a log or query macro sees only
  a bare identifier (not `ip = %addr` or an argument written with a trailing
  comma), and a regex rule that reads a string still sees the text. Counted over
  Lemmy, a newsletter service and an API server on 2026-11-15: 4,956 lines hold
  the name of a call some rule anchors on, and 176 of them sit inside a macro
  body, nearly all in test assertions or on generic names (`parse`, `contains`,
  `from`). Of the 1,609 lines that hold a name specific enough to be a rule's
  own, 1 does, a `select!` in Lemmy that hosts an `insert`.
- **Test modules.** A `#[cfg(test)] mod tests;` whose module is in another file
  is not followed (4 in Lemmy), a file-level `#![cfg(test)]` is not honored,
  `cfg(all(test, ...))` and `cfg(any(test, ...))` are kept as code, a module
  whose name has a non-ASCII character is not recognized and code on the same line
  as the attribute is dropped with the module.
- **Engine parse faults.** The grammar does not read async closures (`async |x| {
  ... }`, `async move || { ... }`, Rust 2024), an associated-type bound inside a
  generic parameter list (`CursorKey<C, SqlType: Send>`) or an attribute on a
  generic parameter (`#[cfg(feature = "ts-rs")] T: TS`). A file with one is read
  in part, for every rule, and counted in the scan's notice. Of Lemmy's 18
  unreadable files, 15 use async closures, 1 has the bound and 2 have the
  attributes, and 1 of the 18 is a test file.
- **Cost.** The engine gives a rule 30 seconds per file, and a rule that matches
  thousands of times in one file (about 3,000) does not finish, whatever its
  shape, so a file of that size loses that rule's matches.
- **Taint and functions.** A fetch and its HTML parse in two functions, a send
  called through the app's own function from a worker in another function, a
  request built in one statement and sent in the next (`let req = c.get(url);
  req.send()`), a handler that returns the model's output as its tail expression
  with no response wrapper, a model id or address held in a `const`, and an
  `mpsc` channel between a generating task and a stream are not joined. A send
  from a `match` arm on `Err` inside a timer matches, because the rule excludes
  only `if let Err`. The client-address rule counts a write only when its
  statement is an INSERT or UPDATE string literal, so a `const` SQL string or a
  `query(&format!("INSERT ..."))` is missed, and a predicate other than `is_ok`,
  `is_err`, `is_some` or `is_none` at the end of a write chain (`.is_empty()`,
  `.is_some_and(...)`) hides the match.
- **Staff routes.** A route registered in a router built in another function
  and nested by name (`.nest("/admin", admin_routes())`), a route behind an
  authentication layer and a handler in a file under `admin/` are not read as
  staff, and an inline staff-named `mod` is excluded by a text regex, so a brace
  in a string inside it can end its range early.
- **Not read.** A serenity (Discord) or teloxide (Telegram) bot is not read as
  a chatbot, and no Rust rule reads Woodpecker CI (`.woodpecker.yml`), `tauri.conf.json`, `cargo-apk` metadata, a
  `publish.workspace = true` that the workspace turns on, a Dioxus `launch` with
  the `mobile` feature, SIP stacks, or a TLS stack chosen only by the `rustls-tls`
  feature with no call. Twilio calls placed through an OpenAPI-generated client,
  and voice, face and meeting vendors with no maintained Rust crate (matched by
  address only, so an address assembled from parts is missed) are not read. A
  crate's item paths come from its documentation, since nothing is fetched, so a
  crate that moves an item is missed, never misread.
- **Not extracted.** Handlebars templates (above).

## Shipping encryption

`ships_encryption` is code that encrypts data or agrees keys to keep data
confidential, in its own code, through the platform's cryptography APIs or with
a library it bundles, or that bundles or vendors a cryptography library that
does. Export control reaches cryptography for confidentiality and carves out
authentication, signatures, integrity and password protection, and it asks
what the code does, not whose library does it. So the rules read:

- A cipher, public-key encryption or a key agreement through the platform:
  Node's crypto module and Web Crypto (`js-platform-encryption`), Go's
  `crypto/cipher` modes with `crypto/aes` or `crypto/des`, RSA encryption and
  `crypto/ecdh` (`go-platform-encryption`), javax.crypto `Cipher` and
  `KeyAgreement` (`java-` and `kt-platform-encryption`), .NET's
  `System.Security.Cryptography` (`cs-platform-encryption`) and Data
  Protection (`cs-data-protection`), Ruby's `OpenSSL::Cipher` and RSA
  (`rb-platform-encryption`), PHP's openssl and sodium extensions
  (`php-platform-encryption`), and Apple's CryptoKit, CommonCrypto and
  Security framework (`swift-platform-encryption`). Python's standard library
  has no cipher, so Python has no platform rule, and neither has Rust; a Rust
  app's ciphers come from crates (`rs-library-encryption`), and the `openssl`
  crate's from the system's OpenSSL or a vendored copy
  (`rs-openssl-encryption`).
- The same through a bundled library (the `*-library-encryption` rules, the
  framework, attribute and storage rules), and a cryptography library whose
  purpose is encryption in the dependency tree (the component map).
- In every component map, a library is listed only when its own description
  says its purpose is encryption: the RustCrypto ciphers, age, MinIO's sio,
  Jasypt, aes-js, @noble/ciphers, @stablelib/chacha20poly1305, pyaes. A
  general cryptography library that also hashes, MACs or signs has no entry,
  because an app can link one only for a hash or a signature, which holds no
  cipher it uses. Its cipher and key-agreement calls, encrypting or
  decrypting, are read in the code instead: libsodium, TweetNaCl, crypto-js, crypto-es, node-forge, OpenPGP.js,
  kbpgp, SJCL, @noble/curves, elliptic and eccrypto by
  `js-library-encryption`; cryptography, PyCryptodome, PyNaCl, libnacl, Tink,
  rsa and PGPy by `py-library-encryption`; Bouncy Castle and Tink by `java-` and
  `kt-library-encryption`; phpseclib by `php-library-encryption`; ProtonMail's
  OpenPGP, Tink and CIRCL by `go-library-encryption`; swift-crypto,
  CryptoSwift and swift-sodium by `swift-library-encryption`; orion,
  sodiumoxide, ring and aws-lc-rs by `rs-library-encryption`. Go's own
  `golang.org/x/crypto` is the first case: Go links only the subpackages a
  program imports, so `go-xcrypto-encryption` reads the cipher subpackages in
  use, and an app that imports only `x/crypto/bcrypt` holds no cipher. A
  library's key-pair generation is not read either, since the key may only
  sign (#13318, #13336).
- Never: hashing, a MAC, password hashing and key derivation (bcrypt, Argon2,
  scrypt, PBKDF2), signing (JWT, ECDSA, RSA signatures), random bytes, or HTTPS
  through the platform's stock client.
- Not access-control data alone. Encrypting only passwords, PINs, tokens,
  two-factor secrets, API keys or session data to control access is
  authentication (15 C.F.R. 772.1). An encrypted model attribute or cast named
  for such data (`encrypts :otp_secret`, `'two_factor_secret' => 'encrypted'`)
  is not read, a Data Protection purpose that names one is not read, and no
  rule reads a framework's encrypted cookies or sessions. A call-level cipher
  cannot show what it encrypts, so it stays evidence for a person to confirm,
  and so do the Android encrypted-storage rules, which cannot tell a stored
  sign-in token from other data.
- Algorithm and key strength are not read: the export lists share their
  thresholds, and code does not show a runtime key size.

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
one such rule (in this rule set, Java, Kotlin, PHP, Ruby, Rust and Swift), and says so: `N files
handed to the engine are over 1,000,000 bytes (Java); rules that first check a
whole file for a name can miss matches in a file that large, so evidence in them
may be missing from this record`. With files in more than one language, the
parenthesis counts each (`2 Java, 1 Kotlin`). There is no notice when there is
no such file. How a rule keeps the longest reach, and which forms the release
test refuses, is in CONTRIBUTING.md under Cost.
