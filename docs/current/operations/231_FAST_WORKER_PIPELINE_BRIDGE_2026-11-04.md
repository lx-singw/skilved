# Fast coordinator bridge to the existing opportunity pipeline

4 November 2026. Follow-up to the [durable fast coordinator](230_DURABLE_FAST_INGESTION_COORDINATOR_2026-11-04.md). A default-off single-notice shadow bridge now runs the coordinator's leased notices through the existing parser, extraction, independent validation, original-notice checks, caches, shared model accounting and canonical private-draft writer. Local emulator cases demonstrate actual canonical private drafts; model outputs and source responses remain authored stubs, not real provider qualification.

## Reused pipeline and execution isolation

`packages/catalogue/src/fast-recentjobs-worker.mjs` exports `FastRecentJobsWorker`. It subclasses the existing worker and calls its unchanged single-notice detail pipeline rather than copying the extraction or publication rules. Normal discovery/run/claim entry points are refused; the explicit entry point is `runNotice(noticeId)`. Construction requires `enabled: true`, the fixed source/revision and the existing explicit fast shadow source policy. Programme/split modes are refused for this bridge.

Execution-local async context maps job/lease/queue/hold/exception/health metadata into `m0_fast_worker_*` records. Each notice has its own compatibility lease. The existing source-wide legacy lease is not created or cleared by the bridge. Every parent claim assertion also validates actual coordinator ownership and then retains the parent's issuer/delegation-trust checks. Shared canonical snapshots, model caches, source budgets, provider usage/availability, quota authority and canonical record IDs are **not renamed or copied into a new allowance**.

Source/grant admission and the Gemini authority epoch are checked inside the same transactions as pipeline effects. A lease that expires during a transaction prevents completion from committing. Requests use the coordinator's shared source pacing, then repeat current ownership/authority checks before invoking the existing safe fetcher. The inherited robots, exact response URL/body limits and optional original/employer verification behaviour remain active.

The bridge currently uses the existing baseline detail parser. It does not silently activate the [separately prepared application-layout parser integration](228_APPLICATION_LAYOUT_WORKER_PREPARATION_2026-11-04.md).

## Atomic completion and failure

`FastIngestionStore.prepareSettlement()` reads ownership and the slot pool before canonical writes. Its commit step runs in that same transaction after the existing worker has made its decision. Successful validated private drafting and coordinator completion therefore commit or roll back together. Failure/defer state, the compatibility execution record and slot release also settle together.

The existing worker remains responsible for identifying genuine source-budget exhaustion, bounded retries and provider/model-window failures. The bridge observes the execution record produced by that logic; it does not grant a daily retry merely because an error is labelled `MODEL_BUDGET_EXHAUSTED`. Genuine source/provider waits preserve the next due time, cached stages, source identity, original first-seen time and prior charges. Ordinary retry counters and issuer-binding resets retain the parent's behaviour.

Retrieval and extraction milestone updates are conservative checkpoints after the corresponding snapshot/cache work. A crash between those separate checkpoints can delay their recorded timestamp; it does not invent an earlier first observation or issue another allowance. Final private-draft completion is atomic. Standalone coordinator milestones remain metadata; a canonical draft claim additionally requires the bridge execution decision and actual draft record.

## Cutover guards

Pending legacy queue work or an active legacy source lease blocks bridge preparation. A known canonical draft, source hold or public projection for the notice requires migration instead of being overwritten. Those records remain unchanged and no fetch/model work begins for the refused notice.

These checks are **not a complete historical migration audit** of every old exception, snapshot or cache. Before enabling this on an existing source, separately qualify the source's full history, reconcile pending work and inherit the earliest trustworthy observation. Do not reset the apparent age of an old notice by treating the coordinator's first observation as the first time Skilved saw it. The current Source API still rejects the fast-policy extension, and no launcher or live policy has enabled this bridge.

## Verification

All **58 final checks pass**: fourteen new bridge cases, fifteen coordinator cases, thirteen dispatch/capacity cases and sixteen bounded-runner/scheduled-start checks. The bridge cases verify:

- A canonical, unapproved private draft through the normal pipeline, with employer crawling optional and no public publication.
- Simultaneous notices using independent execution contexts and the same two-call source allowance.
- Natural source-day renewal reusing cached extractions, retaining prior-day spending and first-seen timestamps.
- Semantic rejection stopping drafting while retaining actual charged work.
- Optional original verification checking employer evidence before model work, with a conflicting expiry held rather than drafted.
- Shared Gemini project/model usage blocking a second source after daily exhaustion.
- Provider-labelled budget errors failing to impersonate genuine rejected source reservations.
- Pending legacy work and known draft/hold/public history remaining untouched behind migration guards.
- Source pause and authority revocation after a dispatched reservation fencing later cache/draft effects without refunding the charge.
- Settlement failure rolling back the draft and completion marker together.
- Lease expiry at commit rolling back completion, then a replacement finishing from both model caches without another model call.
- Pre-existing source spending and retained budget fields surviving unchanged apart from newly admitted actual calls.

The initial fixture run exposed two test assumptions: concurrent arrival order needed a controlled gate, and a Gemini mock needed to invoke the real adapter's reservation hook. Both fixtures were corrected and the affected suite rerun, followed by the final ownership/authority cases and complete 58-check run. Initial and final logs remain private under `.artifacts/groq/fast-worker-bridge-2026-11-04/`.

All input notices/model responses are authored. Emulator bookkeeping includes seeded legacy/public marker records for refusal tests; the bridge creates no public projection. There are zero real source/provider requests or staging writes. A private validation success with stubs is not evidence of real model quality, employer availability, production throughput or a publishing SLO.

## Remaining delivery

The current worker/controller/runner/schema, staging source and [23:40 SAST validation task](225_V31_COHORT_AND_DEFERRED_VALIDATION_2026-11-04.md) remain unchanged; their code/bootstrap hashes and task definition are rechecked before closing. The future real validation and independent cleanup remain pending.

Next work is a reviewed legacy-history migration and source/API cutover, then dispatcher/refresh-job integration and an attached supervised runtime. Lease sizing and heartbeat integration must cover measured fetch/model durations; lost ownership must continue to fence effects. Adopt the prepared parser profile through its explicit integration, qualify real mixed-notice throughput/model outcomes, and measure actual public commit/feed visibility before enabling automatic publication. Hosting/publication remain off. Six private drafts and zero public records remain the last independently audited staging state.
