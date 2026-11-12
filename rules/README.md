# lexcode rule set

This directory is the rule set lexcode runs: one YAML rule per file, one
directory per LexLint activity, positive and negative fixtures beside each rule,
component maps for npm, PyPI, Go, gem, Maven and Composer packages under `components/`, and
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
| `ships_encryption` | include: `lib/classes/authentication/password.php:153`, `lib/classes/encryption.php:184`, `mnet/lib.php:219`, `lib/classes/oauth2/setup.php:51`, `composer.json:57`, `:42`, `:82`, `:101` | found, performs 1 and enables 1; `lexcode.crypto.php-library-encryption` at `lib/classes/oauth2/setup.php:101` (`\Defuse\Crypto\Key::createNewRandomKey()`); `pkg:composer/phpseclib/phpseclib` at `lib/lti1p3/composer.json:27` (vendored, no version) | Found, in a file the reading cites, on the key for stored OAuth secrets rather than the RSA key pair at `:51`. `ext-openssl` and `ext-sodium` (`composer.json:42`, `:57`) are platform names, which the Composer reader does not record, and the component map gives `firebase/php-jwt` and `league/oauth2-server` no activity |
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
left alone.

A `.twig` file (so `.html.twig`) is read the same way. Inside a block, `{{ ... }}`
becomes `_` padded, and `{% ... %}` and `{# ... #}` become spaces, including the
forms with a `-` for white-space control. Jinja files (`.jinja`, `.j2`, `.njk`)
keep their earlier handling and do not get this blanking, because giving it to
them would change a language that was already read. Mustache is not read: its
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
- A commented-out script in Blade (`{{-- --}}`) or Twig (`{# #}`) is extracted
  as live, as in Jinja and ERB, and so is a `@verbatim` or `{% raw %}` span.
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
one such rule (in this rule set, Java, Kotlin, PHP and Ruby), and says so: `N files
handed to the engine are over 1,000,000 bytes (Java); rules that first check a
whole file for a name can miss matches in a file that large, so evidence in them
may be missing from this record`. With files in more than one language, the
parenthesis counts each (`2 Java, 1 Kotlin`). There is no notice when there is
no such file. How a rule keeps the longest reach, and which forms the release
test refuses, is in CONTRIBUTING.md under Cost.
