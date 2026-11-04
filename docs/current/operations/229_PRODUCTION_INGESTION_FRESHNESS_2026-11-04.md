# Production ingestion and publishing speed

4 November 2026. Founder requirement: Skilved must discover and publish relevant opportunities promptly so users can find them here early. Routine overnight allowance waits are unacceptable production behaviour. This changes the delivery priority from isolated notice experiments to measured discovery, processing capacity and feed visibility, alongside qualification of the automatic publication lane.

## Targets and current limits

These are engineering targets, not achieved production service levels:

| Measure | Target |
|---|---|
| Priority-source discovery | Poll every 2–5 minutes where permitted; default target 2 minutes. Prefer a qualified push/feed signal when available. |
| First seen by Skilved to public feed visibility | Target p95 within 3 minutes for supported notices admitted for automatic processing; aim for 1 minute where capacity permits. |
| Queue warning | Raise a backlog incident at 5 minutes. Show over-target unfinished jobs from 3 minutes rather than hiding them behind successful publication percentiles. |
| Known capacity delay | Raise an incident immediately when a stored source/provider wait would prevent meeting the target. A daily reset remains a quota boundary, not an acceptable normal delivery delay. |
| Published-record freshness | Imminent/overdue rechecks take precedence; routine rechecks retain a fair share of processing capacity. |

The pinned staging source currently has **24-hour discovery cadence and two source AI calls per day**. The worker schema/scheduler uses whole hours, and a source-wide lease serializes a complete detail job, including model work. The bounded shadow controller is ingest-only and processes at most eleven jobs per tick. Raising the source allowance alone does not produce minute-level discovery or sufficient burst throughput.

These restrictions remain appropriate to the current bounded staging qualification. They must not be copied into production as the operating configuration. Current hosting and publication remain off; the [23:40 SAST validation task](225_V31_COHORT_AND_DEFERRED_VALIDATION_2026-11-04.md) is unchanged and its future result/cleanup remain pending.

## Implemented foundation

`packages/catalogue/src/fast-ingestion.mjs` implements a pure next-dispatch planner and a capacity forecast checker. The existing worker/controller does **not** import it yet. It dispatches nothing, creates no grant, changes no quota and supplies no publication authority.

The planner selects ready new notices before routine rechecks, with a configurable default of three new dispatches before yielding to a routine refresh. Imminent publication-freshness deadlines override that order. It respects supplied effective due times and leases, isolates authority/evidence holds and allows other admitted work to proceed. A provider/source reset never silently clears a quota block: renewed transactional admission is still required, with a bounded recheck rather than a busy loop. It reports queue counts, held counts, unfinished target misses, oldest timed age and capacity/backlog incidents.

The caller must supply effective eligibility incorporating source pacing/current access, retain transactional job claims, and handle the bounded queue window without dropping older work. This planner is not a replacement for those checks or a horizontally scaled runtime.

The capacity checker requires explicit traffic assumptions, both model stages, retry headroom, allowed polling frequency, source/provider capacities and measured processing time. Unknown provider capacity or processing time prevents a passing estimate. Daily calls, minute calls and concurrent processing requirements are sized independently. A passing estimate still has `liveSloVerified: false` and does not establish source permission, AI quality or production readiness.

Read-only local usage:

```sh
node packages/catalogue/tools/plan-fast-ingestion.mjs <private-input.json>
```

The strict input contains `version: 1`, `capacity` and `queue`, using the exported policy/data schemas. The CLI writes a private report under ignored `.artifacts/shadow/` and prints summary counts/failures without job IDs. Capacity and queue targets must agree. It does not fetch, make provider requests, dispatch jobs or publish.

## Production execution design

1. **Frequent discovery and persistent identity.** Add an explicit minute-level source policy and scheduler, with authorization and pacing checked before retrieval. Persist the first observed URL and stable `firstSeenAt` through transactional deduplication; retries and rediscovery must not reset its age. Use RecentJobs first, then broaden to StudentRoom and reviewed employer feeds/career sites. Aggregator monitoring begins after the aggregator publishes; earlier employer discovery is necessary to improve that lead time.
2. **Separate paced fetching from parallel processing.** Keep per-source pacing/reservations for retrieval and independent opportunity leases for extraction, validation and publication. Do not hold a publisher-wide lock throughout every model request. Bound global/provider concurrency and acquire shared quota atomically. A hot publisher must not stall unrelated publishers or already qualified notices.
3. **Retain quality and exact original methods.** Reuse current qualified employer relationships/evidence where appropriate. Employer-page crawling remains optional. Missing authority, ambiguous application methods, conflicting dates and unsupported notices stay isolated with explicit reasons. Published actions must resolve to a qualified original method, including a verified email/manual method where supported; publisher/job-board URLs do not become original destinations through speed work.
4. **Provision enough model capacity before launch.** Retain durable actual usage, provider cooldowns, daily exhaustion and natural resets across jobs/restarts. Size the source spending guard and qualified provider capacity for measured arrival rates plus retries. Fallback requires a separately qualified extraction/validation lane and preserved accounting. It cannot evade a deliberately exhausted source spending guard. Capacity exhaustion triggers an operational incident and a capacity response; it must not quietly become routine next-day publication. No paid service or new spending is authorized by this document or tool.
5. **Commit and expose automatically.** After all current checks pass, publish idempotently through the generic writer and make the public feed projection visible promptly. Measure feed/API visibility, not merely candidate storage or creation of a private draft. A private draft does not count as an opportunity posted. The chosen model/original-verification lane still needs positive automatic-publication qualification before its existing shadow restrictions change.
6. **Operate and measure continuously.** Use an attached durable scheduler/worker identity, restart recovery, monitoring and an actionable capacity/failure path. The current local one-shot validation task is a qualification step, not that production service.

## Latency evidence and acceptance

Persist separate timestamps for first system observation, source retrieval, first eligibility, stage starts/completions, public commit and observed public feed visibility. Preserve the original first-seen time through holds/retries. Record publisher-written publication dates separately; they are not proof of the moment the page became observable. Discovery delay requires an observed availability bound or qualified source signal, not an invented timestamp.

Report the full fixed cohort: discovered, queued, running, evidence/authority held, quota blocked, failed and publicly visible. Successful-publication p95 must be paired with oldest unfinished age, target misses and hold/coverage counts. Empty or unpublished samples cannot establish a publishing SLO. A single successful advert cannot establish burst throughput or broad method coverage.

Before production, demonstrate a representative mixed batch and burst under minute-level discovery, concurrent jobs, real shared reservations and the intended extraction/validation lane. Measure public API/feed visibility and verify deduplication, exact destinations, freshness rechecks, restart recovery, exhaustion/fallback and monitoring. Each incomplete job remains in the denominator. A good capacity forecast does not replace these live results.

## Verification this sprint

All **29 focused checks pass**: thirteen new dispatch/capacity/CLI tests and sixteen existing bounded-runner/scheduled-start tests. Tests cover new-work priority, refresh fairness and urgency, leases/pacing, independent ready work, midnight-capacity incidents, exact alert boundaries, malformed queue records, unknown/insufficient capacities, retry headroom, private output and consistent targets.

A private offline exercise evaluates the pinned staging configuration against an explicitly authored traffic scenario. The **24-hour cadence and two-call source cap fail**; unknown provider capacity and processing speed remain failures. The saved pending job's retrieval timestamp is used only as a lower-bound delay proxy, not a measured first-discovery timestamp or fresh cloud read.

A separate authored scenario of forty notices/day, a peak of four/minute, two model calls/notice, 25% headroom and a 60-second measured-time input requires **100 calls/day, 10 calls/minute and five processing slots**. These are test assumptions, not observed traffic, provider limits, costs or a recommendation to buy a particular plan. Its estimate passes only the declared arithmetic; no live SLO is claimed. The dispatch trace processes three new jobs, one routine refresh, then the remaining new jobs.

No source/network requests, real provider calls, cloud writes, policy changes or publication occur. All scheduled code/bootstrap hashes and the actual task definition are rechecked before closing. Private reports remain in `.artifacts/groq/fast-ingestion-2026-11-04/`; no source bytes or provider responses are committed.

Next delivery: complete tonight's pinned qualification and cleanup, activate the prepared parser integration, then integrate minute-level scheduling, per-opportunity processing leases, durable latency timestamps and this dispatcher through an explicit reviewed operating policy. Production capacity and observed latency take priority over additional per-notice tuning. Preserve the current source identity/history and qualify automatic publication before enabling it.
