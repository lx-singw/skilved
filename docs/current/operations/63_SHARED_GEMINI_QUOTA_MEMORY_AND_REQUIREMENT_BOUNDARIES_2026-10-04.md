# Shared Gemini quota memory and requirement boundaries

Date: 4 October 2026. Status: implemented worker controls; real-source extraction and production publication remain unqualified.

The founder corrected the earlier quota instruction: track usage and remember daily exhaustion so another job does not retry an exhausted model. Gemini workers now reserve shared project/model requests transactionally, retain reported input/total tokens, and skip daily-exhausted models across sources, stages and worker restarts. All 452 catalogue tests pass. The bounded live check skips 3.8 without a request and makes two actual calls; Bell remains held with no candidate, validation, draft or public record.

## Shared counters and exhaustion

- `m0_model_usage` holds a hashed quota scope, model, Pacific date, reserved request count, known input/total tokens, unknown-usage count and bounded rolling-minute reservations. Failed or interrupted requests are not refunded. Request reservations are conservative spending records, not Google-reported successful request counts.
- `m0_model_availability` holds a stable scope/model daily hold and expiry. Structured Google `QuotaFailure` daily violations create a hold through the next Pacific reset, extended when the provider supplies a longer delay. Provider prose, quota IDs/values, response bodies and credentials are excluded from worker receipts.
- `SKILVED_GEMINI_PROJECT_ID` groups workers using different API keys from the same Google project. If omitted, the scope hashes the key and only identical-key workers share quota state. No credential is stored in these records. Workers sharing a Google project must configure the same project ID and limits and use the same datastore.
- `SKILVED_GEMINI_MODEL_LIMITS` optionally supplies JSON per-model `rpm`, `tpm` and `rpd` limits. Invalid models, fields or non-positive/non-integer values fail configuration. There are no universal hardcoded provider quotas. The ignored local root environment is configured for the screenshot's project and model limits; provider/AI/publication switches are preserved.
- Daily request caps block before another reservation. RPM counts rolling reservations, including in-flight calls; known TPM counts reported input tokens only. Pending/missing token usage stays unknown, so TPM is not a pre-request token guarantee. Rolling minute reservations survive the daily boundary, including requests that report tokens after midnight.
- The trusted backend `holdModelForDay` operation can register an operator-reported exhausted model after checking the source and ingest grant. It preserves a longer existing hold. A skipped model spends neither a request reservation nor the source/day call budget and produces no HTTP receipt. Availability fallback continues down the existing chain; a valid response or local/semantic rejection ends that loop.

Google documents [project-scoped limits and midnight-Pacific RPD resets](https://ai.google.dev/gemini-api/docs/rate-limits). This implementation follows that reset with daylight-saving handling; it does not substitute South African midnight. Current limits should be refreshed from AI Studio if the project's tier changes. Calls made outside this datastore are unobserved; provider daily errors and explicit operator holds cover known outside exhaustion. This is not a monetary cap.

State survives ordinary worker restarts because it lives in the shared datastore. Clearing a database clears that memory. Fresh evaluation emulators require importing preserved private quota state; the controlled pilot exports its usage/availability state under ignored `.artifacts/` for subsequent local evaluations. Counters begin with observed worker calls; dashboard window/peak figures are not asserted to be exact current-day calls.

## Current extraction policy

A separately versioned `bounded_extraction_requirements_v1` policy applies to canonical extraction V7 and programme extraction V7. Recognised bounded sections distinguish required conditions, preferred advantages, and document obligations, with narrow preparation/editorial exclusions. Document acceptance restrictions must remain represented independently of the document list. An unspecified condition such as “if applicable” must remain ambiguous with unclear strength or appear as exact unknown logic; it cannot become preferred or unconditionally required. Material uncertainty still stops publication.

The policy supplies source hints and checks evidence, strength and document kind; it does not manufacture model items or conditional predicates. Unbounded sections abstain. Historical source selectors, review contracts, replay hashes and older evaluations remain unchanged. Programme validation stays V6; split extraction retains its separately versioned legacy coverage behavior.

Offline replay of the unchanged saved Bell response reduces the selected missing passages from eleven legacy boundary findings to one actual missing certified-copy acceptance sentence. The old response is still rejected. Its conditional document classification remains a separate defect, rather than being repaired or counted as a fidelity pass.

## Bounded live check

Fresh guarded robots retrieval returned `UNSUPPORTED_RESPONSE` before HTML/model access. The controlled model trial therefore uses the earlier saved Bell snapshot and robots evidence; it does not establish new freshness or permission qualification. The independent agent-authored source checklist is recorded before requests. Employer crawling remains off.

The private worker receives an operator daily hold for 3.8 based on the founder's exhaustion report. Its reset is 5 October at 07:00 UTC / 09:00 South African time. The source stays shadow-only with an ingest-only grant and a maximum eight-call allowance.

| Model | Observed action | Usage |
|---|---|---|
| 3.8 Flash | Skipped before reservation; daily hold | No new request |
| 3.7 Flash | Extraction HTTP 503 | Unknown |
| 3.6 Flash | Extraction HTTP 200 | 4,853 reported total tokens |

Two HTTP requests match two receipts, two source-budget reservations and two shared quota reservations. The available JSON has an extra top-level schema keyword and fails strict extraction parsing unchanged (`AI_INVALID_EXTRACTION`). No field is stripped, no answer is repaired, and no semantic fallback follows. There are zero canonical candidates, validation calls, cached extractions, drafts or public records. Shared counters retain 4,853 known tokens and one unknown-usage call; the private quota export retains the 3.8 hold.

## Verification and next work

`pnpm catalogue:test` passes all 452 tests, including project sharing across keys/sources, provider daily exhaustion, operator holds, restarts, reset expiry, concurrent request caps, minute limits across midnight, late token usage, policy coverage, preferred/document strength and undefined conditions. Historical frozen replay checks pass within the suite. The private pilot audit verifies the receipts/counters, unchanged strict rejection and zero publication. Source snapshots, raw responses, requests, evaluation scripts, quota state and environment files remain ignored and private.

Next improve ordinary JSON-object adherence under the frozen source checklist, then assess Bell's complete requirement logic before another bounded trial. Do not retry its rejected response unchanged across models. Real-source fidelity, repeatability and production scheduling/publication remain open; original employer application handoffs and optional employer crawling remain enforced.
