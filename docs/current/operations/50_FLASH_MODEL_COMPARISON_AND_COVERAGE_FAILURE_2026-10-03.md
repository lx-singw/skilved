# Flash model comparison and requirement coverage failure — 3 October 2026

Gemini 3.8 Flash returns one full-notice answer on the frozen V16 contract. Its structure, exact source-line coverage and tag projection pass, but requirement coverage fails. The identical repeat receives HTTP 503, so the trial stops before Traxtion. **All 348 catalogue tests pass; the incomplete comparison establishes no accuracy winner or production qualification.**

## Model-only comparison

The [saved Flash-Lite trial](49_SINGLE_CLASSIFICATION_TAGS_AND_VISIBLE_SEMANTIC_ERRORS_2026-10-03.md) supplies the baseline. Source snapshots, candidate inputs, six faithful manual inventories, source audits and faithful/defective controls are copied unchanged. V16 instructions, native/local schemas, source policy, low thinking and the explicit 3,072-token output cap remain fixed. Each Flash request body is checked for exact equality with its saved Flash-Lite counterpart before sending; only the model endpoint and model-bound provenance differ. No prompt, schema or coverage rule is adjusted to accommodate an answer.

All six faithful manual inventories pass local decoding and their unchanged source audits before calls. These audits remain agent judgments and do not constitute independent qualification evidence. The planned calls are Volkswagen, an identical Volkswagen repeat and Traxtion, paced 60 seconds apart with a 45-second request timeout. There are no retries or fallback calls; provider failure stops the trial. Source/contract hashes and AI module bytes remain unchanged.

## Results and limits

| Attempt | Flash result | Saved Flash-Lite result | Flash reported tokens |
| --- | --- | --- | ---: |
| Volkswagen | Valid structure and projection; requirement coverage fails | Tag/anchor conflict | 3,696 |
| Identical Volkswagen repeat | HTTP 503, provider `UNAVAILABLE` | Same tag/anchor conflict | Unknown |
| Traxtion | Not attempted after provider failure | Decodes; six source-audit disagreements | No call |

Flash returns every required source line exactly once, with no missing, extra or duplicate line IDs. Its tag/anchor projection passes. It assigns `context` to L17, the source's must-meet entry-requirements introduction. That line belongs to the complete qualification scope L17–18 in the faithful manual inventory and remains required applicant evidence under the unchanged policy. Local decoding rejects the answer with `AI_REQUIREMENT_COVERAGE`. Complete source-line accounting therefore does not establish complete requirement evidence. Source-audit and claim-comparison scoring are not reached for this answer.

The repeat uses the identical request body but receives HTTP 503. Private provider diagnostics report high demand; no retry delay or token usage is reported. There is no second inventory from which to assess repeatability. The trial makes **two API calls**, yielding one notice response and one provider failure; the third planned call is not made. The successful answer reports 2,674 input and 1,022 output tokens, totaling **3,696**; thinking usage is absent/null. Usage for the rejected call is unknown, rather than zero, and actual cost is unmeasured.

Only one attempt has responses from both models. Both fail local decoding, for different reasons. Flash avoids the earlier tag/anchor conflict on this answer but loses required evidence. This single paired failure, missing repeat and unattempted second notice cannot establish a semantic-accuracy or availability winner. Flash-Lite's saved Traxtion result is not paired with a Flash response.

There are no new source fetches, employer crawls, application-route requests, feed writes, worker provider changes or billing changes. Credentials, snapshots, requests, responses, diagnostics and evaluation artifacts remain private and ignored.

## Bounded completion attempt

A separately authorized attempt at 16:58 UTC on 3 October reuses the same three-call plan. Its first Volkswagen request body matches both the prior Flash request body and the saved Flash-Lite request body exactly. All source, audit, control and contract hashes remain fixed; AI module bytes match the previous trial. The first request again receives HTTP 503 with provider status `UNAVAILABLE`; private diagnostics report high demand. The run stops immediately, without making the Volkswagen repeat or Traxtion call. It yields **one new API call and no notice response**, with unknown token usage and no paired result.

The six faithful manual inventories still pass preflight. The four manual control decisions match the saved replay exactly; live replay reports six unavailable control comparisons and exits 1. Those comparisons correspond to three missing inventories, only one of which was requested. All 11 targeted tag-review tests pass. This follow-up changes documentation only; the previous full 348-test result and 162 historical hash/replay checks remain the recorded baseline, rather than being claimed as newly rerun.

Across both Flash runs there are three calls: one answer rejected for requirement coverage and two HTTP 503 failures. Reported usage remains 3,696 tokens for the one answer, with usage unknown for both rejected requests. Availability still prevents completion of the fixed comparison. No automatic retry, fallback, provider switch, billing change or publication is introduced.

## Verification and next step

All 348 catalogue tests pass and Firestore/Auth emulators shut down cleanly. Two synthetic regression tests verify identical Flash/Flash-Lite request bodies and validation with distinct model provenance, and preservation of HTTP 503 diagnostics without a retry or fallback.

All **162 historical V1–V16 payload/contract hashes and replay outcomes** are preserved. The unchanged faithful/defective manual replay gives four decision matches and exits 0. Flash live replay gives two invalid comparisons for the rejected Volkswagen inventory and four unavailable comparisons for the missing repeat/Traxtion inventories, exiting 1. These six control comparisons represent one invalid model answer and two missing inventories, not six model failures.

Keep V16 fixed for any later bounded completion of the model comparison when Flash is available. Further immediate retries would not add source-fidelity evidence while the provider is rejecting requests. Prioritize independent source audits and offline reproduction of known coverage failures; do not reinterpret source evidence or weaken validation to turn a response into a success. Fresh notices, deadline extraction and original employer/ATS/email handoff still need full-pipeline qualification. Groq remains the worker provider; production scheduling/publication remains disabled, and employer crawling stays optional/off by default.
