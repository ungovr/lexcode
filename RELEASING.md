# Releasing lexcode

The package is `@ungovr/lexcode` while npm Support decides on the unscoped
name `lexcode`. If the name is granted, the package moves there and every
`@ungovr/lexcode` version is deprecated with a pointer to it.

Releases go to npm from `.github/workflows/release.yml` by npm trusted
publishing, with provenance. No npm token is stored anywhere. Each release
waits for a reviewer to approve the `npm` environment.

## Checklist

1. The rule set's gate passes: `LEXCODE_GATE=1 npm test` (every
   evidence-class activity has a rule with positive and negative fixtures).
2. On a quiet machine, `npm run build`, then `node scripts/rule-cost-check.mjs`
   (about two minutes) and `node scripts/rule-cost.mjs` (about an hour with
   the Swift and Rust rules). Every rule it names, over a bound or failed, is
   fixed or has an open issue that the release's issue links; a Swift rule it
   names as not cleared is timed by hand on real Swift with that rule's modifiers
   or attributes, and the result is recorded in the release's issue. The bounds
   and why they matter are in CONTRIBUTING.md, Cost.

   Until the engine pin moves past the Swift scanner fault (CONTRIBUTING.md,
   "Swift pattern notes"), the Swift rules below are timed by hand at every
   release whatever the script says, because they key on a modifier or an
   attribute and the plain filler can never clear them.
   `test/unit/rule-cost-swift.test.ts` holds this list equal to the rules
   `scripts/swift-modifiers.mjs` names, so a new rule of that kind fails the
   suite until it is added here. Run each rule alone with the engine's `--time`
   (`"$(lexcode engine path)" scan --time --jobs 1 --config <rule.yml> <dir>`)
   over the real code named, beside a bare rule (`pattern: C0`) over the same
   files, and record in the release's issue the largest per-file run time and
   any file where the rule takes more than five times the bare rule's time:

   <!-- swift-by-hand:start -->
   | Rule | What it keys on | Real code to time it on |
   |---|---|---|
   | `swift-entity-field` | `@Model`, `@NSManaged`, `@Field`, `@OptionalField` | a SwiftData app (`clean-architecture-swiftui`), Core Data classes (`wikipedia-ios`) and a Vapor app with Fluent models |
   | `swift-chat-message-entity` | `@SwiftData.Model` (a SwiftData message model) | `clean-architecture-swiftui` and a SwiftData chat app |
   | `swift-follow-relation` | access modifiers, `final`, `@Siblings` and any attribute | a Vapor app with Fluent models, and `wikipedia-ios` for its many modified classes |
   | `swift-post-composer` | access modifiers, `final` and any attribute | `wikipedia-ios` (its talk page compose screens) |
   | `swift-library-encryption` | `open` (a cipher's or a secret box's `open`) | a Vapor app that imports swift-crypto's `Crypto` (`penny-bot`) |
   | `swift-platform-encryption` | `open` (a cipher's `open`) | `wikipedia-ios` and a CryptoKit app with `AES.GCM` or `ChaChaPoly` |
   <!-- swift-by-hand:end -->
3. The truth sets pass with zero false FAIL, and the recall table in
   `rules/README.md` is refreshed with its date: the runner's
   `--write-readme <checkout>/rules/README.md` rewrites the block between
   `<!-- recall:start -->` and `<!-- recall:end -->`, and nothing else. Each
   per-app recall block (`<!-- <app>:start -->` to `<!-- <app>:end -->`) sits
   outside it and names the build it measured. When a release adds or changes
   rules for that app's language, scan the app at its pinned commit, run
   `check --declaration` against its key, and refresh the block by hand: for
   1.5.0, the `wikipedia-ios` (Swift) and `lemmy` (Rust) blocks, which measured
   a `v1.5` branch build. The truth sets and their runner live with LexLint's
   own code; the maintainers run them.
4. Bump `version` in `package.json`, and `version` in `rules/ruleset.yml` when
   any rule or component-map entry changed. `npm install` to refresh the
   lockfile's own version. A rule-set bump also moves its three test pins:
   `test/repos/rules-home/ruleset.yml` (a mirror the tests hold equal),
   `test/unit/rules-load.test.ts` and the `version` line in
   `test/unit/cli.test.ts`.
5. Read the `package-lock.json` diff since the last release, line by line. A
   new dependency, direct or transitive, is named and justified in the
   release's issue.
6. Commit, then tag `v<version>` (a prerelease such as `v1.1.0-rc.1` publishes
   under the `next` dist-tag; anything else under `latest`) and push the tag.
7. Approve the `npm` environment when the build job is green.
8. Verify: `npm view @ungovr/lexcode dist-tags`, the provenance statement on
   https://www.npmjs.com/package/@ungovr/lexcode, and
   `npx @ungovr/lexcode@<version> version`
   from a clean directory.

## Bumping the engine

1. Install cosign (https://github.com/sigstore/cosign).
2. `node scripts/pin-engine.mjs vX.Y.Z`. It verifies every pinned asset's
   cosign signature against the Opengrep release workflow's identity and its
   bytes against the release API's sha256, and only then rewrites
   `src/engine/pin.ts`.
3. Update the source link in `NOTICE`, run the whole test suite (the fixture
   tests run the new engine), run the truth sets, and release.

## Rolling back

In order, stopping at the first that is enough:

1. `npm dist-tag add @ungovr/lexcode@<good> latest`: new installs get the good
   version at once.
2. `npm deprecate @ungovr/lexcode@<bad> "<what is wrong>; use <good>"`: anyone who
   pinned the bad version sees why on install.
3. Release a fixed patch through this workflow.
4. `npm unpublish @ungovr/lexcode@<bad>` only within 72 hours of the publish and only
   when the package itself must not exist. npm never lets a version number be
   reused.
