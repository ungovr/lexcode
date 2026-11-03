# lexcode rule set

This directory is the rule set lexcode runs: one YAML rule per file, one
directory per LexLint activity, positive and negative fixtures beside each rule,
component maps for npm, PyPI and Go packages under `components/`, and
`classes.yml`, which gives every activity id in the pinned registry snapshot
(`registry.snapshot.json`, CC BY 4.0, credit "LexLint (UnGovr)") one detection
class. Every rule is original to UnGovr and MIT licensed. The recall table below
is measured against the truth sets, per activity.

<!-- recall:start -->
Measured 2026-11-03 over the UnGovr monorepo and four pinned starter
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
| `ships_encryption` | 3 | 0 | 0 | vercel-chatbot, obytes-expo, full-stack-fastapi |
| `ships_mobile_app` | 2 | 2 | 0 |  |
| `statutory_requests` | 1 | 0 | 1 | monorepo |
| `tracks_devices` | 2 | 1 | 0 | vercel-chatbot |
<!-- recall:end -->
