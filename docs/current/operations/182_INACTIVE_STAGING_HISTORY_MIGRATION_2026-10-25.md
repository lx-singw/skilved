# Reviewed history and quota migration into inactive staging

25 October 2026. The persistent [staging database foundation](181_PERSISTENT_STAGING_DATABASE_FOUNDATION_2026-10-25.md) now receives **385 available history documents across 17 populated collections**, plus one atomic migration receipt. A separate process verifies every imported document against the reviewed private manifest. The existing connectivity marker is unchanged and the catalogue remains empty.

This is an **inactive staging replica**. It creates no worker grant, operator role, queue, lease, publication watch or public listing. Hosting remains undeployed at the user's request. The original local runtime and shared provider ledger remain authoritative; this import does not authorize a cloud worker or transfer quota authority.

## Reviewed inputs and preservation

The input is `.artifacts/groq/cnh-country-guard-live-2026-10-25/pilot-report.json` with the latest `.artifacts/groq/gemini-quota-state.json`. The offline writer experiment is excluded. Reviewed file hashes bind the inputs; an independently checked manifest hash binds document IDs, stored fields, source revisions/caps, provider scope, counts and provenance.

The legacy export format requires semantic reconstruction: source versions store each row's `source` beneath the original hashed document ID; sources, jobs, snapshots and drafts retain their embedded ID; other rows discard the export-only outer ID. The migration preserves the resulting payloads exactly. It cannot recover original JSON whitespace or unknown raw Firestore fields omitted by the old exporter, and is not described as a byte-exact backup of that old database.

The imported history includes five review drafts, two separate private assessments, two CNH source versions, two immutable origin bindings, one origin-import receipt, 55 jobs including four pending jobs, 36 cache records, 122 available model-call receipts, 13 source/day budgets, 48 shared usage rows, one provider-availability row and the available audit history. Pending jobs remain records; no queue is reconstructed for them. The latest ledger supplies usage/availability only; source budgets stay as originally recorded.

The shared ledger retains **151 requests, 458,579 known tokens and 72 unknown usages**. Its larger request count than the 122 available call receipts is expected incomplete history; no usage is rebuilt or reduced to match those receipts. The actual Gemini provider scope is preserved independently of the `skilved-staging` database project.

CNH stays revision 2 at **12/12** and Motus revision 1 at **6/6** for the source day. Their existing allowance reset is **26 October 00:00 SAST / 25 October 22:00 UTC**. Source IDs, revisions, caps and original publication/acquisition timestamps do not change.

Accepted review expiry is stored in worker decisions, not the canonical draft root. CNH's accepted decision retains **2026-10-24T02:26:33.192Z** and Motus's retains **2026-10-25T10:58:58.985Z**; both remain expired. The two separate CNH assessments retain **2026-10-25T16:35:39.754Z** and **17:40:20.326Z**. Import time does not renew any of these checks or establish application availability.

## Import protections and verification

The new [migration module](../../../packages/catalogue/src/staging-migration.mjs) requires explicit cloud configuration for exactly `skilved-staging` and an independently supplied review hash. It validates the fixed private collection list, unique document IDs, JSON, source bindings, historical source budgets, provider scope and usage totals. Its input bounds are 450 documents and 8 MiB. Current documents are approximately 19 KB or smaller; the generic validator does not separately precheck Firestore's per-document size limit.

An empty target is rechecked inside one create-only transaction before all history and the receipt are written. Conflicting, partial, mixed or foreign-receipt state rejects without overwrite, merge or deletion. Existing worker/operator grants, queues, leases, watches or public documents also block the operation. The receipt records input hashes, source bindings, quota totals, counts, semantic reconstruction, `authorityCreated:false`, `publication:false` and `operationalState:inactive_replica`.

An exact immediate retry verifies the receipt and all expected documents in a read-only transaction. Validation permits a 24-hour manifest/pilot-export window, including retry verification; it is not an unrestricted future restore command. The new [regression tests](../../../packages/catalogue/tests/staging-migration.test.mjs) cover integrity, bounds, configuration, semantic invariants, conflicts, atomicity and idempotence.

**All 953 catalogue tests pass**, including 13 new migration tests. A separate real-emulator trial uses the entire 385-document manifest: an existing conflict prevents changes; an interruption after buffering 100 writes leaves zero imported history; the successful transaction imports the complete set; exact retry makes zero writes; and introduced operational authority rejects a later attempt.

The first full run passed 952/953: an existing concurrent suggestion cleanup/admission test rejected admission, and its original assertion omitted the underlying rejection. Emulator logs show transaction lock timeouts during that test file, but the precise cause remains unconfirmed. Five fixed focused diagnostic repeats pass without application changes or weaker assertions. The initial failure/logs are retained; the complete rerun passes 953/953 before cloud import. This does not establish that the intermittent failure is fixed.

After those checks, the real staging import succeeds. A separate process verifies all 385 document IDs and raw manifest fields, the receipt, unchanged connectivity marker, absent operational authority and an empty result from the ordinary catalogue repository. The operator uses the existing gcloud user's short-lived token in memory; no credential file, service-account key or local ADC setup is created. This still does not verify an attached hosted workload identity.

## Limits and next work

Four sources lack historical source-version rows in the accepted export; those missing versions and earlier audit/operational gaps are disclosed, not fabricated. Sources retain `paused:false` and shadow mode. Inactivity depends on absent execution authority and hosting, rather than a claim that source configuration was paused.

All original private artifacts, accepted local drafts/decisions/assessments and the local quota ledger remain unchanged. There are **zero live source requests, zero provider calls and zero public records**. No billing link, hosting service, scheduler or automatic publication is enabled.

Next define an explicit handoff to one authoritative quota store and prevent divergent local/cloud workers. Before enabling any cloud job, reconcile the copied ledger with its then-current authoritative state, provision the reviewed ingest-only source grant and verify the attached identity. A bounded fresh normal-writer run still needs live source and provider evidence after the existing allowance reset. Staging feed visibility, original application handoff, corrections/expiry and recovery remain separate checks. Hosting stays undeployed until the user changes that decision; employer crawling remains optional/off and production publication remains disabled.
