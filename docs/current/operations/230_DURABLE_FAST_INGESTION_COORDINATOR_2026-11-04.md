# Durable minute discovery, opportunity leases and latency milestones

4 November 2026. Follow-up to the [production ingestion speed targets](229_PRODUCTION_INGESTION_FRESHNESS_2026-11-04.md). A separate, default-off backend coordinator now implements persistent minute-based discovery ownership, per-notice processing slots, source fetch pacing and latency milestones. It is qualified with authored inputs in local Firestore/Auth emulators. It is not an attached production scheduler or a replacement for the current worker.

## Implemented component

`packages/catalogue/src/fast-ingestion-store.mjs` exports `FastIngestionStore`, its explicit shadow source-policy parser and a private-milestone summary. Construction requires `enabled: true`, a fixed source ID/revision and a machine principal. Every transaction checks the current source, pause/revision, active source-scoped ingest-only grant and reported grant expiry. Expiry is checked again after launcher admission and before the transaction returns. Writes remain abortable until commit. Actual current-policy changes conflict with the transaction's reads and require renewed admission.

The separate source extension is `automation.fastIngestion`, with `version: "shadow_v1"`, `discoveryIntervalMs` between 120000 and 300000, `maxConcurrentJobs` between 1 and 20, and `leaseMs` between 30000 and 600000. It preserves the existing Source validation after removing only this explicitly validated extension, and rejects non-shadow use. The ordinary Source API and worker remain unchanged and **do not accept/enable this policy**. No live source registration was edited.

| Boundary | Persistent behaviour |
|---|---|
| `poll()` | Atomically owns a discovery cycle at the configured minute boundary. Concurrent schedulers cannot claim the same active cycle. Completion prevents another poll within the same bucket; an expired owner can be replaced on the existing cycle. An external supervisor must invoke it. |
| `recordDiscovery()` | Validates canonical RecentJobs detail URLs, binds them to the current poll lease and transactionally creates one notice/job per source URL. Repeated discoveries preserve the first coordinator observation and existing work. Per-batch source bounds reject excess input rather than truncating it. |
| `claimNotice()` | Owns an individual notice and reserves a slot in the shared per-source concurrency pool. Multiple notices can be owned independently. Expired slots are recoverable; an active owner cannot be overwritten. Model/spending admission remains separately required. |
| `reserveFetch()` / `admitFetch()` | Allocate source-paced turns independently of model processing. Admission checks current ownership/access after the wait, refuses early/replayed turns and serializes the actual admission clock. Workers waking late together cannot collapse all reserved gaps into simultaneous admitted turns. These methods perform no HTTP request or robots/destination qualification. |
| `renew()` | Renews live poll/notice ownership under current access and source policy, updating the corresponding processing slot. Expired/replaced tokens cannot renew or checkpoint. |
| `checkpoint()` | Records ordered retrieval, extraction and private-validation milestones without resetting first seen. Private completion releases its processing slot. It creates no canonical draft, public projection or publication approval. The trusted pipeline must perform the actual work/checks before recording each milestone. |
| `defer()` | Releases a processing slot while retaining stage, first seen, history and timestamps. Source/provider waits retain their due time; renewed ownership after reset is not model authorization. Authority/evidence holds remain held. No allowance is created or reset. |
| `snapshot()` | Uses a machine-authorized SDK read-only transaction to return a bounded full queue window and milestone summary without adding audit rows. More than 500 jobs refuses the snapshot rather than silently truncating it. |

## Queryability and timing integrity

New `m0_ingestion_*` collections retain private JSON records. Jobs additionally expose transactional index fields for source, state, due time and first observation, so source-scoped queue queries can actually find them. Readers validate that the index agrees with the job. Notice and event records retain appropriate source/time index fields. Job/notice identity and first-seen bindings, stored schemas, stage order and clock direction are checked before effects.

First observation survives rediscovery, process restart, quota deferral and lease replacement. A lease takeover does not manufacture a fresh opportunity or latency start. Ordered milestone timestamps support first-seen-to-private-ready timing and unfinished age. Private-ready counts are explicitly separate from public visibility: the report always has `publicVisibilityMeasured: false`, `p95FirstSeenToPublicMs: null` and `livePublishingSloVerified: false`. Empty samples do not invent a percentile.

The first-seen timestamp here is the first observation recorded by this coordinator. It must not replace earlier known legacy observations during a future migration. No legacy notice, job, snapshot, cache or model-usage history was imported, renamed or rewritten in this sprint.

## Verification

All **44 final checks pass**: fifteen new coordinator/emulator cases, thirteen dispatch/capacity checks and sixteen existing bounded-runner/scheduled-start checks. They cover simultaneous poll claims, exact minute boundaries, crash recovery, stable URL deduplication, parallel notice claims, slot limits, reservation idempotency, delayed-arrival pacing, lease renewal, stale tokens, quota deferral, read-only summaries, invalid grants/expiry, source pause/revision changes and inconsistent queue indexes. Seeded spent source budgets remain byte-for-byte unchanged. The tests create no public projection or canonical draft and make no real source/provider request.

The initial run exposed that JSON-only jobs were invisible to source-scoped queue queries. Transactional index projections corrected the storage implementation; the full affected tests were rerun, then the final read-only/expiry cases added and all 44 checks rerun successfully. Initial and final logs remain private under `.artifacts/groq/fast-coordinator-2026-11-04/`.

All scheduled code/bootstrap hashes and the actual task definition are rechecked before closing. The current worker, controller, runner, Source API/schema and source policy remain unchanged. Tonight's **23:40 SAST** start and **00:00 SAST on 5 November** validation are still pending. No staging grant, provider counter, database record or hosting configuration is changed.

## Cutover work still required

- Bridge these leases and milestones into the existing extraction, independent validation, original-method checks, shared quota reservation and generic writer. Legacy model reservation expects the legacy claim/lease shape; these new claims must not be passed into it as though already compatible.
- Integrate the fairness/urgency dispatcher and refresh/content-version jobs. This component currently deduplicates initial notice jobs; it does not generate subsequent content-change or publication-freshness watches.
- Review the minute source policy through an updated Source API. Qualify an exclusive cutover from legacy source-wide processing, including source-revision transitions, preserved legacy IDs/caches/accounting and inherited earliest known timestamps. The legacy and new engines must not process the same source concurrently during that transition.
- Size leases and heartbeats to measured work duration, wire safe retrieval immediately after a current paced admission, and retain robots, destination, employer-authority and publication checks. A paced turn is not fetch/model/publish permission.
- Attach a durable supervised runtime and record actual public commit/feed visibility. Demonstrate burst throughput and publishing latency with the intended real model lane before enabling automatic publication.

These limits keep this change a tested component rather than a claim that production is already fast. Hosting/publication remain off. Six private drafts and zero public records remain the last independently audited staging state; future semantic validation and cleanup remain pending.
