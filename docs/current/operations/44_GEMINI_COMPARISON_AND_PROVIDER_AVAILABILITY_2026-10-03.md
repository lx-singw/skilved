# Gemini comparison and provider availability — 3 October 2026

The bounded Gemini-versus-Groq requirement comparison is prepared, but **Gemini returns no full-notice inventory** in this sprint. Five full-notice requests return HTTP 503; the retained safe diagnostics for Sea Harvest and Traxtion identify `UNAVAILABLE` and overload. A minimal generation request succeeds. These results establish a workload availability problem during the trial, not inferior extraction accuracy. **All 313 catalogue tests pass.** Groq remains the worker provider; production qualification and publication remain open.

## Comparison contract

The existing V12 numbered sources, instructions, generic prompt schema, exact local schemas, source constraints, compiled qualification branches, low reasoning and 3,072-token completion cap remain unchanged. Gemini's explicit JSON-object mode uses the identical normalized schema and instruction text sent to Groq, with JSON MIME output and caller-owned strict validation. Tests compare both providers' complete instruction and source strings and check rejection of an incomplete inventory.

Gemini's original schema mode and 8,192-token default remain unchanged. An explicit development cap can only reduce that limit. Unsupported modes, invalid caps and oversized instructions stop before network requests. HTTP failures retain safe status and numeric Retry-After diagnostics; raw provider error messages are not exposed. Calls have no built-in retry or fallback.

The baseline uses saved Groq V12 results, not concurrent new Groq calls. Existing agent-authored audits and faithful/defective controls are frozen independently of the Gemini answers. They remain reviewer judgments, not independently adjudicated truth. This trial covers requirements only: deadline extraction, original application URLs/emails, route qualification and full source-to-feed accuracy are not measured.

Volkswagen remains blocked before either provider's model score by the existing `AI_REQUIREMENT_EVIDENCE_SPAN` constraint on a faithful multi-line submission instruction. MISA's saved Groq attempt has no inventory after HTTP 429. An unavailable response cannot count as a semantic error, complete inventory, repeatability success or comparison win.

## Actual requests and limits

Six generation requests are made in total, with no new discovery or employer-page requests:

| Request | Transport | Outcome |
| --- | --- | --- |
| Siemens, first attempt | Node fetch | HTTP 503; usage unknown |
| Siemens, bounded recovery after cooldown | Node fetch | HTTP 503; usage unknown |
| Minimal JSON generation diagnostic | Python urllib | HTTP 200, STOP; 15 reported tokens |
| Identical Siemens request through a second client | Python urllib | HTTP 503; usage unknown |
| Frozen Sea Harvest request | Python urllib | HTTP 503, UNAVAILABLE/overload; usage unknown |
| Frozen Traxtion request | Python urllib | HTTP 503, UNAVAILABLE/overload; usage unknown |

The three Siemens request bodies and model settings are identical. No Siemens model inventory exists, so output repeatability is unmeasured. Full-notice failures through both clients rule out a failure exclusive to Node fetch; the successful tiny request shows generation access works but does not prove larger requests are available. Metadata retrieval separately succeeds and lists `generateContent` as supported for Gemini 3.8 Flash.

The first private runner also failed an offline bookkeeping assertion after its provider failure: it passed a saved review wrapper where raw inventory was expected. That assertion made no API calls. Preflight handling was corrected and verified before subsequent requests. Failed runs and call counts are preserved; no prompt, source audit or requirement policy was changed in response to the failures.

The five failed generation requests supply no token usage. The 15-token diagnostic is the only known usage; it is **not the total billed usage** for the sprint. Account billing tier and actual charges were not verified. [Google's troubleshooting guide](https://ai.google.dev/gemini-api/docs/troubleshooting) treats 503 as retryable with bounded backoff; the trial uses explicit bounded recovery, not an unbounded retry loop. [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) depend on the project and account tier. Published free-tier availability does not establish this account's quota or sustained capacity.

## Verification and next decision

All 313 catalogue tests pass, with Firestore/Auth emulators shut down cleanly. The 126 V1–V11 source/contract hashes and historical replay outcomes remain unchanged. All six V12 source, audit, payload and contract hash sets and ten control/challenge input hashes are reverified. AI module bytes remain unchanged during the live requests. Source snapshots, credentials, requests, provider artifacts and trial scripts remain ignored and private.

There are zero paired Gemini/Groq notice inventories. No accuracy winner or cost-per-correct-notice estimate is justified. The next qualification step is to rerun the frozen comparison when full-notice Gemini generation is available, then add unseen notices and full-pipeline deadline/application-route checks. Both model semantics and the known local span constraint still need evidence before selecting a replacement provider or enabling autonomous publication. Employer crawling remains optional and off by default.
