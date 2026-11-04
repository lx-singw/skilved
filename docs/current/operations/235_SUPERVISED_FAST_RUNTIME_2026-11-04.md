# Supervised fast runtime and active queue capacity

4 November 2026. Follow-up to [paced RecentJobs discovery](234_PACED_FAST_DISCOVERY_2026-11-04.md). The default-off fast pipeline now has an explicit bounded in-process supervisor, optional scoped lease heartbeats and active-only queue queries. This code is tested locally; no staging runtime, task, source policy, index or hosting service is deployed or changed.

## Lease supervision

`FastRecentJobsWorker` accepts a separate `leaseSupervision: {enabled: true}` option. Direct calls retain their previous unsupervised behaviour unless this option is present. The new runtime requires supervision. The default per-execution duration limit is fifteen minutes, configurable up to one hour. Heartbeats run at one third of the source lease duration, capped at ten seconds. Renewal requests never overlap.

Each notice renewal atomically extends the coordinator job, shared slot, normal worker execution job and compatibility lease. The existing canonical parser, issuer checks, model stages, source/provider accounting and writer remain responsible for quality decisions. Source/grant/revision/Gemini authority checks apply inside renewal transactions. A renewal that fails or reaches its old expiry before its write step cannot revive ownership. Failed atomic renewal rolls back every lease together.

Discovery renews its poll through the same scoped mechanism. Saved page receipts and chunk behaviour remain unchanged. A long listing/model request can outlive the original lease only while valid renewals keep ownership current.

The scope checks monotonic elapsed time and records the first renewal/clock/stop failure. Subsequent transactions in that execution refuse effects even when the old lease has not naturally expired. Already admitted calls remain charged. The scope neither retries the provider request nor refunds it. It cannot undo an effect or external request already admitted/committed before the failure was observed.

Renewals stop and any pending renewal is awaited before canonical completion/failure settlement or a poll's final chunk. This avoids a late heartbeat racing a successful settlement and reporting a completed job as a renewal failure. Every scope exit drains its timer and pending renewal. Maximum duration, access loss, backward monotonic time and external stop fence later transactions. Expired work remains recoverable through existing ownership/cache checks rather than receiving a fresh retry allowance.

## Independent runtime lanes

`packages/catalogue/src/fast-ingestion-runtime.mjs` exports `runFastIngestion({worker, enabled: true, ...})`. It requires an already configured supervised fast worker. It provisions no credentials, grants, policy, quota or publication role. The normal launcher/controller does not import it and no new public endpoint or background task is added.

Discovery and dispatch run in separate lanes. A blocked model request does not prevent the next approved discovery poll. A discovery commit with new queued work wakes an idle local dispatch lane immediately; a minute-bound fallback probe can notice work from another process. Each lane still uses persistent transactional ownership, so in-process wakeups are an optimization rather than a correctness authority.

The default run admits at most 24 ticks per lane and forty-five minutes of new cycles, with configurable finite bounds. When either lane reaches its tick limit or the shared elapsed limit, both stop admitting further cycles and drain already admitted work. Idle waits are abortable and at most one minute each. The elapsed run bound is an **admission bound**, not a promise to kill an already dispatched request at that instant; each execution retains its separate duration fence and native request timeouts. Native requests cannot be forcibly recalled by this supervisor.

An external stop or fatal operational error signals both lanes, fences later scoped effects and awaits all admitted executions before returning. Principal/source/revision identity is pinned across cycles. A rejected execution is surfaced rather than silently looped. Queue-capacity pressure is the explicit nonfatal discovery condition: dispatch may continue draining work while the saved poll remains resumable. Discovery still needs natural ownership recovery after an interrupted owner; no lease is silently released.

Runtime events contain bounded states/counts and sanitized error codes. Source bodies, provider answers and raw exception messages are not emitted. The returned counters describe runtime activity, not public publication, model accuracy or a production freshness SLO.

## Active capacity and retained history

Dispatch now queries source-scoped `queued`/`leased` jobs rather than reading all retained history. Completed and held records remain in place and preserve canonical IDs, notice deduplication and earliest observations. More than 500 retained completed records no longer prevent new active notices from being dispatched. The existing full-cohort `snapshot()` remains a bounded diagnostic and still refuses cohorts over 500; it is not used by runtime dispatch or a scalable all-history metric.

Discovery admission reads the active set in the same transaction as new notices/jobs. More than **500 active jobs per source** refuses the entire chunk before any notice or completion marker commits. Concurrent chunks contend on that read, so only available capacity can be consumed. Existing known/completed notices are not re-queued. A refused chunk leaves its receipt and poll unfinished for recovery; no link is silently dropped or given a new observation time.

`packages/catalogue/fast-ingestion.indexes.json` declares the source/state active-query index. It is a separate review manifest, not an applied database change or a modification to the pinned deployment configuration. The index must be provisioned and the query checked against the actual backend before live source adoption. Emulator success does not establish production index readiness. Retained records are not deleted or archived; scalable historical reporting, storage costs and longer-term retention remain separate work.

## Verification and remaining delivery

All **121 sealed checks pass**: five lease-guard cases, eight supervision/capacity emulator cases, seven runtime cases and the 101 existing discovery/dispatch/migration/bridge/coordinator/planner/runner regressions. Local checks cover non-overlapping/drained renewals, duration/clock/stop fences, atomic rollback, expiry during renewal, real private drafting after extended model work, slow-poll renewal, revocation, retained history beyond the old snapshot bound and concurrent admission at the active capacity boundary. Runtime cases cover independent discovery during a held model response, immediate dispatch wakeup, common admission limits, fatal-stop propagation, external-stop draining and identity changes. All source/model responses are authored and all database writes use demo emulators.

The initial runtime timing fixture advanced virtual time into a new poll's acquisition before waiting for that poll to settle. It now advances only to the discovery boundary and observes the second discovery event before asserting progress. The final runtime also stops admission in both lanes when either reaches its tick bound, preventing discovery from continuing after its dispatch lane has exhausted that run's allowance. Initial, focused and sealed logs remain private under `.artifacts/groq/fast-runtime-2026-11-04/`.

The **23:40 SAST on 4 November** task, thirteen pinned code files and four sealed bootstrap files remain unchanged and are verified before closing. Its future validation and cleanup remain pending. There are no real source/provider requests, staging writes, grant changes, quota resets or new deployment actions in this sprint. Hosting/publication stay off.

Next: inspect the scheduled validation and cleanup, then prepare fresh quiescence, historical/cached-stage adoption and Source API/policy cutover with the active index. A reviewed attached launcher/restart arrangement, historical refresh/fairness, real provider quality/capacity qualification and measured public-feed visibility remain required before production activation. This runtime does not itself enable publication or establish unattended production reliability.
