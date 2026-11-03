---
version: 1
registry: https://lexlint.io/activities/v1
date: 2026-11-03
declared_by: the drift fixture
components:
  - name: Drift fixture
    shape: application
    aggregate: complete
    activities:
      - id: processes_voice
        mentioned: performs
        enabled: by_default
        where: [src/]
        note: Loads a speech-to-text model.
      - id: generates_text
        mentioned: enables
        enabled: by_default
        where: [src/]
        note: Says text generation comes only through a dependency, which the code contradicts.
      - id: crawls_web
        mentioned: performs
        enabled: by_default
        where: [src/]
        note: Declared, and the code shows nothing.
---

# Drift fixture

A fixture for the check end-to-end test. It declares three activities and leaves one out on purpose.
