# Live ALPLA continuation and transport hold

Date: 21 October 2026. Status: a bounded live pilot accepts ALPLA extraction, resumes validation on a restarted worker with the extraction cache intact, and stops at its eight-call private cap without receiving a validation answer. No draft is refreshed and no public record is added. Product code, prompts and acceptance checks are unchanged.

## Source refresh and frozen plan

The [bounded continuation implementation](129_BOUNDED_GEMINI_FALLBACK_CONTINUATION_2026-10-20.md), committed as `750d5a0`, is the tested product baseline. UFS's saved closing date is today, so the existing conservative closing-day gate makes that cached case ineligible; this is not a claim of refreshed employer availability. The pilot instead refreshes familiar ALPLA, whose stated deadline is 31 October.

The initial robots request times out before a response. A prospective retry plan retains that failure and allows at most two additional source requests, within a cumulative four-attempt bound. Both retry responses succeed. Three source attempts in total produce two successful responses: robots and ALPLA. The fresh parsed source matches the saved content, fingerprint, deadline and original employer-named ATS anchor, apart from its observation date. No employer endpoint is fetched.

Source expectations are frozen before generation. All four existing ALPLA conditions retain their required kinds and ALL logic: the complete Grade 12 qualification with attached subjects, the standalone subject exclusion, the additional N3 condition and the document passage with its internal alternative. The existing location, qualitative pay, maximum-duration and unknown-field expectations remain unchanged. This is an agent checklist, not independent human or employer verification.

The plan fixes eight actual generation attempts, four worker invocations, a ten-minute pilot bound and at most three minutes between invocations. It uses the full configured Gemini chain from 3.8 through 3.1 Flash-Lite, with availability-only fallback, low extraction thinking and medium validation thinking. The ALPLA source cap remains seventeen; revision thirteen advances to fourteen for a fresh private evaluation. No allowance is increased after observing an answer.

## Observed generation and restart

The pilot makes eight generation attempts over two worker invocations in about 171 seconds:

| Call | Stage | Endpoint | Observed outcome |
| --- | --- | --- | --- |
| 1 | Extraction | Gemini 3.8 Flash | HTTP 503; usage unknown |
| 2 | Extraction | Gemini 3.7 Flash | HTTP 200; frozen checklist passes |
| 3 | Validation | Gemini 3.7 Flash | Client timeout; usage unknown |
| 4 | Validation | Gemini 3.6 Flash | Transport failure; usage unknown |
| 5 | Validation | Gemini 3.5 Flash | Transport failure; usage unknown |
| 6 | Validation | Gemini 3.5 Flash-Lite | Transport failure; usage unknown |
| 7 | Validation | Gemini 3.1 Flash-Lite | Transport failure; usage unknown |
| 8 | Validation, restarted worker | Gemini 3.8 Flash | Transport failure; usage unknown |

The successful extraction reports 5,941 input tokens and 425 output tokens, totaling 6,366 known tokens. Its unchanged raw answer decodes and passes both the frozen checklist and canonical/material checks. All four conditions, qualitative pay, maximum four-year duration and original application route are retained without invented experience, residence or attendance.

The first validation request skips 3.8 while its source/model cooldown is active. The remaining suffix receives no usable answer. After completing that suffix, the worker resets its cursor and saves a pending retry. Following the recorded roughly sixty-second wait, a new worker instance uses the same job, source revision and cached extraction. Its validation request is identical to the earlier requests. It reconsiders 3.8 after the earlier cooldown releases, then the private cap prevents a ninth reservation.

The terminal private job is an inspectable `PRIVATE_TRIAL_CALL_CAP` exception, with its queue entry removed. Its saved current-stage cursor points to validation's next model, 3.7, but the closed pilot is not automatically rerun. There is no validation approval or semantic rejection to interpret: no validation answer arrived. This live run verifies cached-stage reuse and reconsideration after a complete suffix; a partially traversed live cursor beyond a time window remains covered by authored tests rather than this observation.

## Connection diagnostics and launcher result

The timeout and transport failures do not establish an extraction-quality failure. A separate bounded, unauthenticated provider-host diagnostic fails during DNS lookup with `EAI_AGAIN`, before sending its planned HEAD request. It sends no API key, prompt, model request or generation call and changes no quota state. This supports a name-resolution problem at that diagnostic time; it does not assign a specific cause to every earlier transport failure or to the HTTP 503.

The evaluator child completes with exit zero and saves its complete pilot report, post-run records and quota export. Firebase CLI subsequently emits an unclassified shutdown error and exits one. Its private debug log is preserved. The local emulator ports are confirmed closed. Completion of the child and consistency of its records are independently audited; the launcher exit is not represented as a clean run, and no generation is repeated to work around it.

## Accounting, verification and limits

Eight new receipts match eight source-budget reservations and eight observed generation attempts. Seven failed-call usages remain unknown and spent. The new source-day budget records eight of its unchanged seventeen-call cap. Source day is 21 October while the Pacific provider day is still 20 October; the local date change does not reset provider spending.

The shared ledger now contains 95 cumulative observed generation attempts, 315,549 known tokens and 39 unknown-usage calls. Existing cumulative counters increase only by the new receipts. Earlier-day usage, source budgets, exhaustion records, answers, failed receipts, jobs, caches, snapshots and draft revisions remain preserved. Shared daily-exhaustion records are unchanged; these failures do not create an invented daily-exhaustion hold.

There is one new private candidate, one extraction-cache entry and one bounded exception. There are no new decisions, snapshots, draft revisions or public records. All three earlier private drafts remain unchanged. The accepted candidate is unvalidated and unqualified for publication.

The independent audit verifies raw-answer decoding, checklist immutability, complete request bodies and hashes, identical validation requests across invocations, cache reuse, stage/snapshot/revision binding, retry timing, cap enforcement, original-route retention and exact receipt/budget/quota deltas. All 535 historical artifact hashes and twenty-six tested code/test hashes match. This evaluation/documentation sprint reuses the unchanged product's contracts build, 107 focused checks and final 720-test serial suite; those tests are not rerun here. Fresh source bodies, raw answers, records, connection diagnostics and preview remain private and ignored. Documentation links, staged scope and secret checks are verified before commit.

Next diagnose the transient resolution/transport failures with sanitized diagnostics, then separately bound a cached-validation follow-up if the source remains current. Keep this eight-call pilot closed and preserve its exception and spending. No prompt change, answer repair or larger allowance is justified by an absent validation response. Employer crawling stays optional/off; production scheduling and publication remain disabled.
