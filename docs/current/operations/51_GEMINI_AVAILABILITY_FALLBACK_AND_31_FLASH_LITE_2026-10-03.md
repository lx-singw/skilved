# Gemini availability fallback and 3.1 Flash-Lite — 3 October 2026

Gemini now automatically descends through supported Flash models on availability failures. A live request passes four HTTP 503 failures and obtains an answer from 3.5 Flash-Lite. Direct 3.1 Flash-Lite calls also succeed on all three frozen attempts, but no answer passes the complete requirement checks. **All 356 catalogue tests pass; publication remains disabled.**

## Ordered, bounded availability fallback

The founder explicitly requested 3.1 Flash-Lite and automatic fallback from 3.8 downward. The Gemini adapter's order is:

`3.8 Flash → 3.7 Flash → 3.6 Flash → 3.5 Flash → 3.5 Flash-Lite → 3.1 Flash-Lite`

The generation API's model list exposes all six IDs with `generateContent` support. Google documents the stable [3.1 Flash-Lite model](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite), [3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [3.6 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.6-flash) and [3.7 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.7-flash). Being listed does not establish request availability or extraction accuracy.

Fallback is enabled by default when using Gemini. An explicit `SKILVED_AI_MODEL` starts at that model and proceeds only through lower entries; no model is attempted twice. The request body, evidence, schema, reasoning level and output cap stay fixed. The entire chain has a 90-second budget, with each attempt capped at 45 seconds, and at most six generation calls.

HTTP 404, 429, 500, 502, 503 and 504, transport failures and timeouts can advance to the next model. Billing/authentication/request failures (including HTTP 400, 401, 402 and 403) stop. Invalid JSON, blocked or incomplete content, size-limit failures and subsequent local/schema/semantic failures stop rather than triggering another model. A provider answer does not become a valid listing merely because the fallback chain reached it.

Provenance retains the requested model, actual model, actual model-bound request hash, usage and an ordered attempt history. Errors retain safe attempt codes, statuses, retryability, retry delays and usage. Provider text and credentials are not included. Rejected-call usage stays unknown when not reported. A retained `Retry-After` describes the failed model; the loop does not retry that model.

`SKILVED_AI_FALLBACK=false` disables fallback. Callers can also pass `fallback:false` for a fixed comparison, preserving the earlier single-call provenance format. Gemini mode/model/key validation still happens before requests. Groq worker settings and provider selection are unchanged; this feature operates where the Gemini adapter is selected.

## Fixed 3.1 Flash-Lite trial

The V16 sources, contracts, audits, controls, low thinking and 3,072-token output cap remain unchanged. Fallback is explicitly disabled for the three direct calls, paced 60 seconds apart. Request bodies match the saved 3.5 Flash-Lite trial exactly. Six faithful manual inventories pass unchanged preflight.

| Attempt | Direct 3.1 Flash-Lite result | Reported tokens |
| --- | --- | ---: |
| Volkswagen | Valid structure/projection; requirement coverage fails | 5,152 |
| Identical Volkswagen repeat | Same coverage failure; returned inventory differs | 4,873 |
| Traxtion | Decodes 14 conditions; nine source-audit disagreements | 2,584 |

Both Volkswagen answers include every required source line exactly once but classify L17's must-meet introduction as `context`, losing required applicant evidence. They stop with `AI_REQUIREMENT_COVERAGE`, before source-audit scoring. Requests are identical; returned inventories differ. Neither complete inventory qualifies.

Traxtion passes local decoding but differs from its faithful nine-condition inventory in these audited places:

- Lost uncertainty at L8 and L21.
- Missing complete unresolved qualification scope L10–11.
- Incorrect local strength at L15, L17, L20 and L22.
- Incorrect condition kind at L16.
- Application/deadline context at L24 promoted into a requirement.

These nine disagreements exclude separate review-required markers. The faithful Traxtion control is rejected, while the defective control is also rejected. The latter is decision agreement only. Saved 3.5 Flash-Lite also had zero complete matches on these three attempts; neither model qualifies, and this small frozen trial does not establish a broader accuracy winner. Source audits remain agent judgments rather than independent qualification evidence.

## Live automatic descent

One further frozen Volkswagen request starts at 3.8 Flash with fallback enabled. Versions 3.8, 3.7, 3.6 and 3.5 Flash each receive HTTP 503. Version 3.5 Flash-Lite returns valid JSON after the fifth call, reporting 3,318 tokens. Its inventory then fails `AI_REVIEW_TAG_ANCHOR_CONFLICT`. The chain correctly stops at that available answer and does not ask 3.1 Flash-Lite to replace a semantically invalid result. All five request bodies match the saved baseline.

The sprint makes **eight generation calls**: three direct 3.1 responses and five fallback attempts, including four HTTP 503 failures. The model-list read is separate. Successful responses report **15,927 tokens** in total; usage is unknown for the four rejected calls. No cost or free-tier capacity improvement is established. No new notice fetches, employer crawls, application-route requests, billing changes or feed writes occur.

## Verification and remaining work

All 356 catalogue tests pass; Firestore/Auth emulators shut down cleanly. Eight new synthetic tests cover the complete ordered descent with unchanged bodies and actual-model provenance, explicit lower starts and exhaustion, disabled/invalid fallback settings, terminal billing/auth/request failures, invalid/blocked/incomplete responses, local coverage rejection after an available answer, transport diagnostics and the total timeout budget. Existing fixed-model tests explicitly disable fallback where necessary.

All 162 historical V1–V16 payload/contract hashes and replay outcomes are preserved. Current manual replay gives four decision matches and exits 0. Direct 3.1 live replay gives one decision match, one mismatch and four invalid comparisons, exiting 1. Availability fallback is verified; requirement fidelity and full source-to-feed qualification remain open. Keep the source policy and publication gates strict, and use independently reviewed source cases to address the remaining semantic failures. Employer crawling stays optional/off by default.
