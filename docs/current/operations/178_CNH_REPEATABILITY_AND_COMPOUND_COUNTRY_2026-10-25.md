# CNH repeatability and compound-country completeness

25 October 2026. The frozen CNH repeat **fails**: Gemini 3.5 Flash-Lite omits the explicitly written South Africa country while retaining Isando, Gauteng and in-person attendance. The private checklist stops processing before mapping or validation. An offline change then closes the same omission in ordinary/split decoding and canonical mapping, without changing the answer or making another provider call.

## Frozen repeat and result

The trial restores the [reviewed-origin runtime](177_REVIEWED_UNDATED_ORIGIN_IMPORT_2026-10-25.md) and latest shared quota ledger. It prospectively allows one familiar CNH repeat, one worker invocation, at most two provider calls, two guarded RecentJobs GETs and 180 seconds. Gemini 3.5 Flash-Lite is fixed with fallback off. Source identity `private_cnh_20261022`, revision 2, its 12-call daily allowance, both origin bindings and the authenticated import receipt are unchanged. No source registration or origin import is repeated. Extraction and validation begin empty; no old model answer supplies the repeat result.

The fresh source has the same frozen content hash, and the complete extraction request equals the previous V2 request. The response preserves all eight requirements, preferred qualification grouping, unknown deadline, original CNH application URL, city, province and attendance. Its own location quote includes `Job Location: Isando – Gauteng – South Africa`, but `location.places[0].country` is null. The frozen checklist's broad `LOCATION_ATTENDANCE` label identifies this country omission; attendance itself is correct.

Actual execution makes **one HTTP 200 generation call**, reporting **7,729 known tokens** and no unknown usage. Both source GETs return HTTP 200. The run stops with `PRIVATE_SOURCE_CHECKLIST_FAILED` before canonical mapping, candidate storage or validation. It creates no assessment, accepted draft or public record. No answer repair, model fallback, replacement trial or cap increase follows. The successful earlier V2 assessment remains intact; one pass followed by one failure on this familiar notice does not establish reliable extraction or unseen accuracy.

## Offline production protection

Replaying the unchanged failed extraction first confirms that the ordinary canonical mapper previously accepted the missing country. The extra private checklist was the only stop for this answer.

The location-completeness guard now recognises a narrow source-written form: a qualified `Work location`, `Job location` or `Training location` line with three simple name components separated by spaced hyphens, en dashes or em dashes, ending explicitly in `South Africa` or `ZA`. That written country must survive in structured location and in its complete supporting line. Missing, wrong or unsupported evidence rejects with `AI_LOCATION_COMPLETENESS_UNRESOLVED`.

This guard never inserts a country, derives one from a city/province, widens a quote or repairs a response. Two-component locations without a country stay representable with country null. Unqualified, conditional, negative, ambiguous, excluded preparation/promotion and out-of-programme-scope text create no additional country obligation. Other countries and unsupported layouts remain outside this narrow extra check.

The new obligation is enforcement-only. Advisory location spans, model instructions and extraction requests stay unchanged. The same saved failed answer now rejects unchanged, while the earlier correct CNH answer still maps. This is offline regression evidence; the live repeat remains failed, and no fresh provider result under the new guard is claimed.

## Verification and preserved state

Contracts build, **21 focused location tests** and the complete **933-test sequential emulator suite** pass. Five new regressions cover explicit-country retention, conservative abstention/scope, ordinary/split decoding and canonical mapping, usage-preserving one-call provider rejection, and worker rejection before candidate storage/validation with a complete positive control. Full-suite execution uses the catalogue working directory and test-file concurrency one; race tests retain their own concurrent operations.

All **4,792 prior private artifacts** retain their hashes. All five accepted drafts, their existing expiries, the earlier private assessment and its **2026-10-25T16:35:39.754Z** expiry remain unchanged. Source configurations, two source versions, two origin bindings, the import receipt, old jobs/caches/snapshots/model receipts and the pending Motus continuation are preserved. Original CNH first acquisition remains **2026-10-22T15:03:03.266Z**, with hard age boundary **2026-10-29T03:16:48.000Z**.

CNH source-day spending moves **9/12 → 10/12**, leaving two calls. Motus remains **6/6** and is not called. The shared provider ledger reaches **149 historical calls**, **445,785 known tokens** and **72 unknown usages**. The offline guard replay and tests make no additional real provider calls or quota changes.

The next real runtime restores `.artifacts/groq/cnh-v2-repeatability-2026-10-25/pilot-report.json` plus the latest shared quota ledger. Restore source-version rows using each `row.source` as JSON under `row.id`. Preserve the failed repeat and its spent call, previous private assessment, immutable origin/import history and existing accepted expiries. This export also retains new worker audit rows from this run; missing earlier generic audit rows are not reconstructed.

Next run a prospectively bounded fresh check under the new guard, or assess another independently reviewed familiar source when its original daily allowance permits. CNH has only two calls left on 25 October; Motus has none. Neither the previous pass nor this offline rejection establishes a successful fresh post-guard result. Employer availability remains unverified, employer crawling optional/off and production scheduling/publication disabled.
