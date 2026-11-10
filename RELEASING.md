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
2. The truth sets pass with zero false FAIL, and the recall table in
   `rules/README.md` is refreshed with its date. The truth sets and their
   runner live with LexLint's own code; the maintainers run them.
3. Bump `version` in `package.json`, and `version` in `rules/ruleset.yml` when
   any rule or component-map entry changed. `npm install` to refresh the
   lockfile's own version.
4. Read the `package-lock.json` diff since the last release, line by line. A
   new dependency, direct or transitive, is named and justified in the
   release's issue.
5. Commit, then tag `v<version>` (a prerelease such as `v1.1.0-rc.1` publishes
   under the `next` dist-tag; anything else under `latest`) and push the tag.
6. Approve the `npm` environment when the build job is green.
7. Verify: `npm view @ungovr/lexcode dist-tags`, the provenance statement on
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
