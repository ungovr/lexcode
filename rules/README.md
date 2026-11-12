# lexcode rule set

This directory is the rule set lexcode runs: one YAML rule per file, one
directory per LexLint activity, positive and negative fixtures beside each rule,
component maps for npm, PyPI and Go packages under `components/`, and
`classes.yml`, which gives every activity id in the pinned registry snapshot
(`registry.snapshot.json`, CC BY 4.0, credit "LexLint (UnGovr)") one detection
class. Every rule is original to UnGovr and MIT licensed. The recall table below
is measured against the truth sets, per activity.

<!-- recall:start -->
Measured 2026-11-12 over the UnGovr monorepo, 8 pinned starter templates and 3 real apps,
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
| `processes_personal_data` | 12 | 5 | 0 | spring-petclinic, nowinandroid, symfony-demo, wave, canvas-android, moodle, sakai |
| `processes_voice` | 4 | 2 | 1 | canvas-android, moodle |
| `records_calls` | 3 | 0 | 0 | monorepo, moodle, sakai |
| `records_text_chat` | 3 | 1 | 0 | moodle, sakai |
| `ships_consumer_interface` | 11 | 0 | 1 | vercel-chatbot, nextjs-subscription-payments, obytes-expo, full-stack-fastapi, spring-petclinic, nowinandroid, symfony-demo, wave, canvas-android, moodle, sakai |
| `ships_encryption` | 9 | 1 | 0 | vercel-chatbot, obytes-expo, full-stack-fastapi, symfony-demo, wave, canvas-android, moodle, sakai |
| `ships_mobile_app` | 4 | 4 | 0 |  |
| `statutory_requests` | 1 | 0 | 1 | monorepo |
| `tracks_devices` | 6 | 2 | 0 | nowinandroid, wave, canvas-android, sakai |
| `trains_models` | 1 | 0 | 0 | moodle |
<!-- recall:end -->
