# Application-layout worker integration prepared

4 November 2026. Follow-up to the [shared parser prototype](227_APPLICATION_LAYOUT_PROTOTYPE_2026-11-04.md). The **23:40 SAST** validation start is still in the future. No semantic result or future cleanup is claimed. Integration work is prepared and tested in a separate local copy while the scheduled worker and its source policy remain unchanged.

## Integration contract

`worker-detail-adapter.mjs` supplies the shared parser-selection and saved-hold boundary. Absent opt-in continues to return the existing parser's candidate exactly. The prepared source-schema change admits only `automation.applicationLayouts: "shadow_v1"` in shadow mode. Employer crawling remains optional. Automatic, disabled, malformed and wrong-method opt-ins are rejected.

The prepared normal-worker change selects the parser through that boundary and records `detailAdapterProfile` on new-profile source holds. Legacy holds retain their existing serialization and version. Enabling or disabling the parser cannot reuse a hold from the other profile, even if a source revision were accidentally left unchanged. Compatible holds still suppress repeated retrieval until their existing expiry. Original exceptions, snapshots and spending history are retained.

Existing snapshot and model-cache key construction stays intact. Identical candidates keep their content hashes; added methods and source text change the hash and separate snapshots/caches. No source ID, daily counter, provider history, allowance or retry policy is reset. Source revision changes retain their existing cache boundary. Keeping the same revision in the local transition tests deliberately exercises profile isolation; a real reviewed source update must still advance its revision.

## Reproducible local preparation

From the Linux checkout:

```sh
node packages/catalogue/tools/prepare-application-layout-integration.mjs
```

The command writes an **unapplied** patch, before/after hashes, a local worker/schema copy and emulator test entry points beneath ignored `.artifacts/shadow/`. It checks the patch with `git apply --check` and verifies that both current files remain unchanged. Missing or repeated integration anchors fail preparation. It never applies the patch, edits a source, grants access, starts the production worker or calls an AI provider.

The generated `manifest.json` supplies `integrationTests` and `regressionTests`. Run those entry points through the repository's existing Firestore/Auth emulator configuration. The test copy changes only the worker parser/hold call sites and the optional source-schema field; other code is reused from the checkout. It is a local integration test environment, not a deployed service or an immutable release image.

Eight authored normal-worker acceptance cases exercise:

- Source-schema rejection outside the explicit shadow opt-in.
- Exact email subject/recipient evidence reaching an unapproved private draft, then cache reuse after restart.
- Legacy-to-new and new-to-legacy hold transitions, retaining original exceptions and later compatible cooldowns.
- Unchanged content reusing extraction/validation caches across parser-profile changes.
- Changed footer content separating snapshots/caches, preserving source identity and accumulated spending, and excluding the adjacent social invitation.
- A spent source allowance deferring changed content without replacing the prior draft or acquiring another model allowance.
- Unqualified recipients and missing dates stopping before model work or drafting.

The acceptance cases use synthetic source bytes, fake extraction/validation responses and demo-project local emulators. Their private draft outcomes do not qualify any real notice or establish real AI quality.

Verification: **147 existing worker regressions, eight final integration cases and seven policy/preparation checks pass**. The initial combined run exposed an incorrect field lookup in one new snapshot assertion; that assertion was corrected and all eight integration cases rerun successfully against a fresh preparation. The prepared worker/schema hashes match the copy used for the 147 existing regressions. The initial log is retained alongside the final passing evidence under ignored `.artifacts/groq/application-layout-integration-2026-11-04/`.

All thirteen scheduled code hashes and four private bootstrap hashes match. Fresh Windows readback confirms the task remains ready, with its actions, identity, settings and trigger definition unchanged. Local document links, whitespace and commit-candidate credential checks are verified before closing.

## Activation remains pending

The live checkout's worker/schema and the scheduled bootstrap remain unchanged. The existing staging source does not contain the new opt-in, so the current strict schema still rejects attempts to use it. Source-role review and a new revision remain necessary when the feature is actually enabled.

After tonight's validation finishes, inspect both its semantic result and independent access cleanup. Recheck the prepared patch's base hashes, rerun preparation/tests against any intervening changes, then integrate the worker/schema changes through the normal commit workflow. Keep the source opt-in absent until its policy update is reviewed. Original recipient/employer authority and availability evidence remain separate requirements.

No site/model calls or cloud writes are made by this sprint. Six private drafts and zero public records remain the last independently audited staging state. Hosting and publication remain off; tonight's future validation and cleanup remain pending.
