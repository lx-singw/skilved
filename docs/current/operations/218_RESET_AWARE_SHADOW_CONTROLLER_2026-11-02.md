# Reset-aware shadow controller and persistent wake checkpoint

2 November 2026. Follow-up to the [applied publisher policy and live batch](217_LIVE_PUBLISHER_SHADOW_BATCH_2026-11-02.md), toward the [autonomous opportunity system](../engineering/17_AUTONOMOUS_OPPORTUNITY_SYSTEM.md).

## Delivered behavior

`RecentJobsController` runs bounded shadow ticks through the normal worker's scheduling, claims, acquisition, extraction, validation and completion/failure methods. Each tick attempts at most eleven distinct jobs. Selection examines the complete bounded source queue, up to 200 jobs; overflow stops execution with an operational error rather than hiding work beyond the ordinary launcher's first fifty rows.

The controller computes its next wake from existing job deferrals, source-budget reset markers, job/source lease expiry and the worker's existing discovery cadence. Actual per-model RPM/TPM/RPD reservations, daily exhaustion and source allowances remain in the shared worker ledger. No second allowance, quota scope, refund or reset is introduced. A source-day renewal and a provider-day renewal keep their independent meanings.

`m0_worker_controllers/<source-id>` stores a versioned private checkpoint: source revision, verified principal, observation time, ready/waiting state, wake reason/time, queue counts and the last tick's outcome counts. Ready continuations receive a suggested one-minute recheck delay. Each invocation recomputes eligibility from current jobs and leases; the saved checkpoint is operational metadata, not permission to run or a substitute for current queue state.

Existing transactional source/job leases decide ownership. A process restart can reconstruct work without an additional controller lease. Concurrent ticks cannot duplicate an admitted claim; a genuinely contested job becomes held or disappears on reinspection. A still-ready job rejected by claim instead raises `CONTROLLER_STATE_INVALID`, so corrupt work does not produce endless successful polling. Expired leases remain recoverable through ordinary claim logic.

The controller pins a source ID/revision, shadow mode and an ingest-only grant. The worker now accepts a trusted backend admission assertion and reruns it in **every transaction**, including after pacing and before the next external effect. Both packaged launcher modes use this assertion for their reviewed revision/crawl choice. Source pause, grant expiry/revocation, quota authority, freshness, issuer trust, original resolution, provider reservations and publication guards retain their existing enforcement. A mid-tick policy change prevents further effects and leaves the existing lease to expire; it is not repaired into permission.

## Launcher choice

`SKILVED_STAGING_WORKER_CONTROLLER=true` explicitly selects one bounded controller tick in the staging image. Omitted/false keeps the existing bounded worker tick. Worker activation, matching source/revision, crawl opt-in, authority epoch and genuine workload identity are still independently required. Both controller selection and worker activation remain false in the template.

Controller logging contains state/counts/wake information rather than candidate bodies or assessments. Isolated notice exceptions count as completed controller outcomes and exit successfully; operational/configuration/authentication failures still exit nonzero. The original one-shot launcher's exception exit behavior remains unchanged. Detailed outcomes and audits stay in restricted Firestore records.

This is a persistent, reset-aware tick primitive. It does **not** deploy a timer, renew credentials, create IAM/application grants or turn on public publication. No sleeping process is left running. A future recurring runner must supply verified identity/current authorization and act on wake metadata; hosting remains undeployed at the founder's request.

## Verification

- All 147 existing worker regressions pass alongside the first ten controller checks. The final twelve-controller suite covers exact SAST resumption, retained spent rows, cached ordinary stages, process restarts, discovery continuation, isolated notice holds, concurrent claims, crash recovery, pause/expiry/role fences, mid-fetch/mid-pacing policy changes, corrupt work and queue capacity. Seven staging guard tests pass. These are **166 distinct checks**; repeated controller runs are not additional unique checks.
- Authored reset tests begin with a spent two-call source day, leave the job unchanged through early restarts, resume the same job at exact midnight SAST and retain the old spent row. Synthetic provider fixtures create only a private draft in an isolated emulator. This is not fresh live AI qualification.
- The worker image builds locally as `node`. Network-disabled verification checks exact worker/controller/launcher/guard hashes, module loading, reset planning, explicit controller selection and disabled startup. The web image is not rebuilt and no image is deployed.

## Genuine staging checkpoint

A fresh read at 16:37 UTC / 18:37 SAST finds the same revision-3 source and single queued job. Its one source-budget wait, first attempt and `nextAt` **22:00 UTC on 2 November / 00:00 SAST on 3 November** remain intact; worker access is inactive.

The existing staging service account then completes two idle controller ticks under genuine verified Google machine identity, the same quota authority and a five-minute source-scoped ingest-only grant. The first writes checkpoint revision 1; a fresh controller instance writes revision 2 with the same midnight wake and one pending job. Neither tick claims a job, fetches a publisher/employer page or calls a provider. Normal scheduling/inspection/checkpoint audits are written; this is not a write-free read.

Post-run readback at 16:44 UTC / 18:44 SAST verifies every collection other than controller metadata and audits against the pre-run checkpoint. Source/version history, queued job, leases, captures, model calls/budgets/usage/caches/availability/authority, six private drafts, public projections and operator/worker records are unchanged. The prior inactive worker grant is restored, temporary service-account delegation is removed and original IAM bindings survive. The operator remains reviewer-only and public records remain zero.

The live idle check precedes final offline hardening for a mismatched reset marker and an unclaimable ready job. Those branches are covered in the final controller suite, and the image verifies the final code. No later live reset-time execution or attached hosted identity is claimed.

Private before/after snapshots, identity/cleanup evidence, current queue observation, checkpoint receipts, test logs and image hashes remain ignored under `.artifacts/groq/reset-controller-2026-11-02/`. Midnight eligibility does not activate execution: the temporary grant is removed and no timer is deployed. The next real due-time run, durable attached identity, recurring operation/monitoring and broader positive publisher/method/publication qualification remain open.
