# Reviewed fast source-policy adoption

5 November 2026. Follow-up to the fast launcher. This implements the Source API cutover boundary; it does not perform a live migration or activate the runtime.

## Current staging readback

A fresh read-only inventory at 03:51 UTC finds 630 retained documents and 21 known notices. There are no pending/running legacy detail jobs and no active source worker grants. The planner's only blocker is `SOURCE_NOT_QUIESCED`. Windows Task Scheduler reports the overnight task completed with no future run. Its semantic failure remains as recorded in operation 237.

A separate read-only authority check finds zero active Source-role operators and one active reviewer. Current worker-service-account IAM policy has zero bindings, matching the pre-trial baseline: the temporary delegation is removed. No role, source, grant or budget is changed. Private inventory and authority evidence remain ignored under `.artifacts/fast-cutover-2026-11-05/`.

## Implemented boundary

The shared Source schema now accepts the strict shadow-only `fastIngestion` policy from `fast-source-policy.mjs`. Ordinary `Catalogue.registerSource()` edits cannot add, remove or change that policy. An adopted source may be emergency-paused through the normal role/revision-controlled API, without other edits. Resuming or otherwise revising it requires a separate fast-job revision-adoption path, still pending; ordinary edits cannot silently strand pinned queued work. The legacy RecentJobs worker explicitly refuses fast sources before work; the fast worker retains its separate transactional access/ownership fences.

`Catalogue.adoptFastSource()` requires normal verified Source-role identity, a complete paused/drained migration input, reviewed plan hash and the existing create-only held-history import. One transaction rechecks all protected legacy inventory, exact import receipt, every indexed and point-read imported row, snapshot age and target source version before committing the exact planned source policy, immutable source version and adoption/audit receipts. Concurrent adoption is idempotent. Replay never repairs a changed source, metadata or receipt. Historical jobs stay held and latency-ineligible; no old job, quota, cache, grant or canonical record is reset or released.

The operator CLI exposes `fast-history-import` and `fast-source-adopt` with a private `inputFile`, `expectedSha256` and audit `reason`. The normal private Firebase token-file mechanism and Source role remain mandatory. CLI output contains status/revision, not the private inventory. This command does not grant its own access. Existing parser integration preparation has been updated for the shared Source schema.

## Live cutover and remaining work

Live adoption still requires Source-role authority, a controlled pause, a fresh inventory and external-run check, reviewed import, active index provisioning/check and exact policy adoption. The source currently remains unchanged and unpaused. No direct administrator write is used to bypass the Source-role check. The default-off worker is not started.

Cached-stage adoption, controlled historical refresh, fair freshness scheduling, attached restart/identity operation and real V32/mixed-batch automatic-publication qualification remain separate delivery work. Hosting/publication stay off.

Verification: all 286 affected emulator checks pass in a fresh run from the package working directory, alongside 24 pure/preparation checks and 14 final migration/adoption checks covering the final emergency-pause fence. Tests include concurrent adoption, exact replay, no spend/cache/history mutation, tampered indexed/unindexed metadata, changed budget, missing history, role denial, legacy-worker exclusion and unsafe revision/resume refusal. An initial root-directory run failed the CLI subprocess lookup; a subsequent retry reused its database and encountered fixture conflicts. The clean final run corrects the working directory and starts fresh emulators. These harness failures are not claimed as passing runs. CLI syntax and whitespace checks pass. Private logs remain under `.artifacts/fast-cutover-*`; no live mutation or provider request occurs.
