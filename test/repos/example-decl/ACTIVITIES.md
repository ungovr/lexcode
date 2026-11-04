---
version: 1
registry: https://lexlint.io/activities/v1
date: 2026-11-03
declared_by: the maintainers of an invented example
components:
  - name: Example platform
    shape: application
    aggregate: complete
    activities:
      - id: crawls_web
        mentioned: performs
        enabled: by_default
        where: [crawler/]
        note: Fetches public web pages on a schedule.
      - id: processes_personal_data
        mentioned: performs
        enabled: by_default
        where: [accounts/]
        note: Holds account names and email addresses.
      - id: automated_outreach
        mentioned: performs
        enabled: by_default
        where: [mail/weekly.py]
        note: Sends a weekly digest email to subscribers.
      - id: tracks_devices
        mentioned: enables
        enabled: by_default
        where: [web/analytics.ts]
        note: Loads an analytics SDK on the public pages.
    not:
      - id: trains_models
        why: Uses hosted models as they are and trains none.
      - id: serves_minors
        why: Accounts are for adults.
  - name: Example mobile app
    shape: application
    aggregate: complete
    activities:
      - id: processes_voice
        mentioned: performs
        enabled: by_default
        where: [mobile/src/voice/]
        note: Turns a spoken description into text.
      - id: crawls_web
        mentioned: enables
        enabled: by_default
        where: [mobile/src/share/]
        note: Fetches a page the user shares to read its title.
---

# Activities

An invented declaration with the shape of a real multi-component one: two
components, an activity both of them carry (performed in one, enabled in the
other), and activities a component rules out. No real application is
described here.
