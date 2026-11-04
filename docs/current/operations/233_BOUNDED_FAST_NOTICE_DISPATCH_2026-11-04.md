# Bounded fast notice dispatch

4 November 2026. Follow-up to [held-history migration preparation](232_HELD_HISTORY_MIGRATION_2026-11-04.md) and the [normal-pipeline bridge](231_FAST_WORKER_PIPELINE_BRIDGE_2026-11-04.md). The default-off shadow coordinator now has a bounded dispatcher for due single-notice work. This sprint does not change staging, migrate history, attach a runtime or enable publication.

## Dispatch behaviour

`packages/catalogue/src/fast-notice-dispatcher.mjs` exports `FastNoticeDispatcher`. Construction requires `enabled: true` and an existing `FastRecentJobsWorker`. `tick({maxJobs, signal})` takes one source-authorized coordinator snapshot, selects up to 20 due jobs and awaits the entire selected batch. The batch is also bounded by the source's current concurrency limit and live leased jobs at selection. The coordinator snapshot now includes that limit from the same transaction as the jobs.

Oldest first-observation time takes precedence, with deterministic ID ordering for ties. Future retries, live leases, completed/held jobs, imported historical rows and jobs from another source revision are not selected. The dispatcher does not change a retry time, release a hold, mint a new job, reset first observation or supply a model allowance. Expired leases can be recovered through the existing transactional claim path.

Selection is advisory. Every selected notice calls `FastRecentJobsWorker.runNotice()`, which acquires coordinator ownership and repeats the existing source, grant, legacy-history and provider-authority checks. The store's atomic slot pool enforces the concurrency limit across competing dispatchers; the snapshot's available-slot count is not a replacement lock. A competing dispatcher can receive `unavailable` without doing fetch/model work.

The worker retains the same source parser, extraction, independent semantic validation, application destination checks, optional employer crawl, shared budgets/caches and canonical private writer. Successful private drafting and coordinator completion still commit atomically. A semantic failure stays held without drafting, and actual admitted calls remain charged. Daily exhaustion preserves recorded reset times and cached progress; it is not converted into another immediate attempt.

## Stop and failure reporting

An already stopped signal performs no snapshot read or execution. A stop observed after selection prevents admissions that have not started. It does not cancel an already started model request, undo a charge, revoke ownership or terminate the worker; existing ownership and authority checks continue to govern those effects.

The dispatcher observes every selected execution even when a sibling rejects. It returns job IDs, bounded states and sanitized error codes, not raw exception messages, source bodies or provider answers. An unexpected worker result is a dispatch failure. `settled` means that the batch promises were observed; it is not a quality, publication or production-readiness verdict. Individual results and canonical records determine the actual outcome.

There is no timer, autonomous restart, discovery fetch or public endpoint in this module. The normal runner/controller does not import it. There is no live source policy, Source API change, credentials/delegation or publication path added by this sprint.

## Verification and remaining work

All **87 final checks pass**: twelve new dispatcher cases and the 75 migration/bridge/coordinator/dispatch-planner/runner regressions. Local emulator checks cover real canonical private drafts and shared source charges, bounded oldest-first batches, separate processing slots, competing dispatchers, expired-owner recovery, semantic rejection, natural budget reset with extraction-cache reuse, skipped historical/revision rows, pause after selection, sibling failures, invalid worker results and stop signals. A separate reset case confirms that a notice which closes while waiting is held before further model work. All source/model inputs are authored; these are not real provider or throughput results.

The first reset fixture closed at its resumption boundary, so its expected draft correctly failed the existing `NOTICE_NOT_OPEN` gate. The final suite retains that rejection as its own case and uses an authored later deadline for the still-open cache-resumption case. Initial diagnostic and final logs remain private under `.artifacts/groq/fast-dispatch-2026-11-04/`.

Tonight's **23:40 SAST on 4 November** task, its pinned source/worker code and sealed bootstrap remain unchanged. Its future validation and cleanup are still pending. No real source/provider request or staging write is made by this sprint. Hosting/publication remain off.

Remaining work includes the fresh quiesced legacy cutover and Source API/policy adoption, cached pending-stage and historical-refresh adoption, paced discovery integration, lease heartbeat/supervised runtime operation and refresh fairness. The existing pure dispatch planner's new/refresh fairness policy is not yet connected to this notice-only batch. Real mixed-notice/model qualification and measured public-feed visibility remain required before production activation.
