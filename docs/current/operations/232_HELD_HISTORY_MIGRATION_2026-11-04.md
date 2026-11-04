# Reviewed, held-only legacy history migration

4 November 2026. Follow-up to the [fast pipeline bridge](231_FAST_WORKER_PIPELINE_BRIDGE_2026-11-04.md). A bounded inventory collector, offline migration planner and Source-role import function now preserve historical metadata for an eventual fast-source cutover. This sprint does not migrate staging or enable a source. A fresh read-only staging capture finds current work and tonight's scheduled validation still blocking import.

## Retention and timestamp rules

`fast-ingestion-migration.mjs` inventories 27 explicitly named legacy collections in an SDK read-only transaction. Empty collections are explicit. The bounded inventory includes source/version history, jobs/queues/leases, grants, decisions, exceptions, holds, snapshots, private/public records and shared model caches, calls, budgets, usage, availability and authority records. Raw JSON strings and document IDs participate in a deterministic fingerprint; bodies and provider responses are not copied into the review plan or new records.

Notice identity remains the existing source ID plus the canonical discovery URL. The planner collects timestamp evidence from hash-bound discovery-page captures, recorded retrieval, first-seen, processing and canonical creation/update fields. Discovery captures retain earlier observations and links that were never queued for detail processing. A retry/due date, publisher-written publication date, URL date or inventory capture time cannot manufacture the age of an old notice. Missing evidence blocks import instead of assigning the current time.

The earliest retained evidence is an **observation-time bound**, not proof of the exact first time Skilved saw the notice. Imported metadata explicitly records `firstSeenBasis: "legacy_observation_bound"` and `sloEligible: false`. It has no fabricated first poll ID. Historical rows remain visible in cohort/hold counts but are excluded from latency percentiles. Public visibility remains unmeasured. The job and notice history bindings must agree before ownership is admitted.

All old records remain in place, byte-for-byte. Proposed records are limited to new held notice/job metadata and provenance references. Old exception decisions, canonical IDs, snapshots, cache IDs, provider scopes, natural reset dates and actual charges are neither renamed nor reset. No cache alias is created across source revisions or policy profiles.

New metadata's local attempt counter starts at zero because the metadata is non-runnable held history; it is not a new retry allowance. The fast bridge now refuses imported history even if someone accidentally re-queues it. A separately reviewed refresh/adoption path must reconcile original attempts, timestamps, cache context and current evidence before that history can run.

## Readiness and import controls

The planner blocks on an unpaused source, active source workers/leases, undrained legacy queues, unfinished jobs, scheduled/running external work, stale inventory, unknown ages, inconsistent identities, invalid spending metadata, public-history requirements and capacity limits. Source/provider allowances are retained; the proposed operating policy adds no quota. Public history requires a separate migration. The planner's proposed next source revision is review material only; it does not update the Source API or database source row.

`importFastIngestionHistory()` requires a verified identity with the existing **Source** role, an independently reviewed plan hash and an audit reason. Inside one transaction it re-reads the protected inventory and refuses any change. It refuses both indexed and unindexed target conflicts. It then creates only held history metadata, a typed receipt and an audit record. There are no source, grant, queue-drain, cache, quota or publication writes.

Exact replay verifies the receipt and imported records without adding another audit row or refreshing history. It can verify an already completed import after the snapshot freshness window, while the protected inventory remains unchanged. First import requires a current snapshot. Legitimate later source activation or model activity changes that inventory; post-activation reconciliation is separate from replaying the old import.

Limits are 4,000 retained documents, 8 MB of inventory data and 100 notices per atomic import. Oversized provenance fails before an oversized database write. Larger cutovers need an explicitly reviewed partitioning strategy; this code does not silently truncate history.

## Local review workflow

```sh
node packages/catalogue/tools/plan-fast-history-migration.mjs <private-input.json>
```

The strict input contains `version: 1`, `sourceId`, a complete `snapshot`, `targetPolicy` and an explicit `externalRuns` list. The CLI is offline and writes only a private report beneath ignored `.artifacts/shadow/`. Stdout contains the report/hash, counts and blockers, not source bodies, provider answers or notice URLs. There is no import/enable command in the CLI and no new HTTP endpoint.

The backend import function is tested locally with the existing Catalogue identity/role checks. Tests also simulate a later policy adoption to establish schema/read compatibility; that simulation is not a live Source API feature or authorization to activate staging. The current Source API still rejects the fast-policy extension.

## Actual staging observation

At **10:12 UTC on 4 November**, a fresh read-only transaction captured **624 retained documents across 27 collections**. The plan identifies **21 known notices**, all proposed as held historical metadata. It refuses import with:

- `SOURCE_NOT_QUIESCED`
- `LEGACY_QUEUE_NOT_DRAINED`
- `LEGACY_WORK_UNFINISHED`
- `SCHEDULED_OR_RUNNING_WORK`

This preserves the real pending cached validation job and tonight's scheduled run. No import is attempted. The staging source, workers, quotas, private/public records and task are unchanged by this sprint. This database read does not fetch a source or call an AI provider.

The private input snapshot, plan, task attestation and proof remain under `.artifacts/groq/fast-migration-2026-11-04/`. The planner fingerprint is review evidence, not current permission to import after the snapshot expires or the source changes. A new quiesced capture is required before an actual cutover.

## Verification and remaining delivery

All **75 final checks pass**: nine new planner/CLI checks, eight new import/retention emulator checks and the 58 existing fast-bridge/coordinator/dispatch/runner checks. Coverage includes deterministic fingerprints, earlier discovery evidence and never-queued links, missing-age refusal, pending-work quiescence, source-role denial, exact replay, source-spend changes, target conflicts, receipt tampering, import bounds, rediscovery deduplication and refusal to give imported history a fresh execution budget.

The emulator import leaves the retained legacy inventory byte-for-byte unchanged. It creates held metadata only, keeps the source revision/policy unchanged, and does not consume or reset a model allowance. Old notices remain held after an explicit test policy adoption and do not become apparently fresh. Historical completion markers cannot supply a public or private processing-latency percentile.

All scheduled code/bootstrap hashes and the actual task definition are verified before closing. The **23:40 SAST** start and midnight validation remain pending; neither is cancelled or repinned. Hosting/publication remain off.

Next: inspect tonight's real validation and cleanup, then obtain a fresh drained/paused-source inventory for reviewed metadata import and Source API/policy adoption. Cached pending-stage adoption, controlled historical refresh/release, dispatcher/refresh integration and attached-runtime qualification remain separate work. Production activation still needs adequate capacity, real model/method coverage and measured public feed visibility; held-history import supplies none of those approvals.
