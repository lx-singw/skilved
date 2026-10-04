# Form preparation, model cooldowns and cached completion — 4 October 2026

Programme extraction separates standalone blank-form requests from required submission documents. Gemini workers temporarily defer models that have returned availability errors, preserving the budget for subsequent stages. **All 409 catalogue tests pass.** A controlled live completion reuses cached electrical extraction and creates **one validated private synthetic draft**, while plumbing remains held for an incorrect route index. Zero public records are created. Production scheduling/publication remains disabled and employer crawling stays optional.

## Preserve form requests as preparation

The programme adapter identifies a deliberately narrow source pattern: standalone `Request`, `Obtain` or `Download` instructions for an application form `from`, `via` or `at` a recipient/location. It excludes mixed clauses containing submission or mandatory/completed-form wording. These source-owned anchors, with original line numbers, are supplied to extraction and validation as `formRequestInstructions`.

Local mapping requires each recognised instruction to remain verbatim in both the practical-condition value and its original evidence quote. Including that instruction in a requirement item fails as `PROGRAMME_FORM_REQUEST_MISCLASSIFIED`; dropping it fails as `PROGRAMME_FORM_REQUEST_COVERAGE`. The form-request recipient does not become the application destination. Explicit submission of a completed form remains a required document, independently of obtaining a blank form. Compound, conditional or differently worded instructions still need semantic review; this is not a general preparation classifier.

Extraction advances to `recentjobs_programme_extraction_v3`. The earlier saved answer that classified the form request as a required document is replayed unchanged and now fails the local mapping guard. No model request, automatic repair or accepted record results from that replay. Original contiguous quotes, complete OR wording, per-intake references/recipients and the existing WIL/shared-scope checks remain enforced.

## Availability cooldowns and validation allowance

For Gemini worker responses with HTTP 404, 500, 502, 503 or 504, the existing per-source daily budget stores a two-minute cooldown for that model, respecting a longer provider `Retry-After`. An unexpired cooldown defers the model before sending or reserving a new call. Availability fallback continues down the existing chain; an expired cooldown allows the model to be tried again. Sent requests remain charged and retain their receipts. Rate-limit handling continues to use its existing minimum delay. Authentication and invalid-request errors do not acquire availability cooldowns or trigger fallback.

The worker's cache policy now includes the availability policy and duration. Groq availability behavior is unchanged. The selected default model, descending chain, independent extraction/validation reasoning, grant/lease checks and daily call caps remain in place. When a fixed-model availability failure leaves a job pending, its retry time respects the recorded delay; the cache can avoid another extraction on retry.

The first live programme validator reaches `MAX_TOKENS`: 2,821 reasoning tokens and 231 answer tokens consume most of the shared 3,072 allowance. Its incomplete JSON is rejected, despite starting with `supported=true`. Programme Gemini validation now has a bounded **6,144-token allowance**, with `recentjobs_programme_validation_v3` separating its cache identity. Extraction and ordinary single-notice stages retain the 3,072 default. The shared provider wrapper honours an explicit trusted caller allowance within the Gemini adapter's 8,192 limit. All byte limits and rejection of incomplete output remain unchanged. This increases the possible token use of a programme validation request; it does not increase permitted HTTP attempts.

## Live pilot and controlled cached completion

The first fresh Auth/Firestore emulator replays the authored synthetic two-trade notice with the normal Gemini descending availability fallback and a ten-call cap. Expected facts and preparation instructions are recorded before model work. No real source, employer, application, mailbox or cloud endpoint is accessed in this replay.

| First-run stage | Outcome |
| --- | --- |
| Electrical extraction | 3.8 Flash returns 503; 3.7 Flash returns 200. The candidate retains the complete OR qualification, required CV and practical form-request instruction. |
| Electrical validation | Cooling 3.8 is deferred without a request. 3.7 and 3.6 return 503; 3.5 returns an incomplete 200 answer with `MAX_TOKENS`, which is rejected. |
| Plumbing extraction | Cooling 3.8, 3.7 and 3.6 are deferred. 3.5 returns 503; 3.5 Flash-Lite returns 200 but chooses `applicationCandidateIndex=1` rather than the sole scoped index 0. Local mapping rejects `PROGRAMME_INTAKE_MISMATCH`. |
| Saved real MISA replay | The five-intake plan is retained, but expiry causes `NOTICE_NOT_OPEN` before AI. Zero model calls. |

Seven real provider calls create seven reservations and receipts. The parent completes with two per-intake exceptions and one private electrical candidate. No automatic semantic retry is dispatched.

After the validation allowance/version change, a second isolated emulator restores that private report's original source revision, extraction caches, all seven receipts, spent budget and cooldown timestamps. A controlled private triage reopens the completed parent job. It is explicitly a development completion attempt after a stage change, not automatic fallback after semantic rejection. No credentials or source policy are altered, no clock is advanced, and the daily cap stays ten.

Three additional **validation-only** requests occur: 3.8 and 3.7 return 503 after their earlier cooldowns have expired; 3.6 returns a complete 200 assessment that passes strict shape, exact scoped evidence, semantic and commit gates. **Zero new extraction calls** occur. The electrical child becomes a canonical private draft; plumbing's cached route-index mismatch stays rejected without another extraction or repair.

Across both runs there are **ten real HTTP attempts, ten reservations/receipts and 17,601 reported tokens** for four responses, including the rejected truncated validation. Usage for six 503 responses is unknown. The restored receipts are not counted twice. Final state contains one private canonical draft and zero public records. Both emulator runs shut down successfully.

Agent review confirms the synthetic electrical draft's issuer, exact reference and application email, authored deadline, two required items, preserved internal OR wording, practical form-request/prohibited-delivery instructions, original evidence offsets and parent snapshot/citation bindings. Its extraction uses 3.7 Flash and successful validation uses 3.6 Flash. This is agent review of authored text, not independent human adjudication or real-source qualification.

## Open real-notice assessment and verification

A separate paced retrieval obtains current RecentJobs robots text and re-fetches the familiar [ALPLA notice](https://recentjobs.co.za/2026/09/16/alpla-plastics-apprenticeship-programme-gauteng/). Its content hash is unchanged. All previously reviewed mandatory passages remain present, its stated closing date is 31 October 2026, and its original ALPLA ATS destination is unchanged. These are two retrieval calls with no employer crawl, model call or publication. The source-supported future date does not establish independent employer availability. It is a single notice and does not qualify the multi-programme planner.

Seven added regression tests cover preparation versus completed-form submission, cooldown expiry, cached validation retry with no extraction repeat, longer `Retry-After`, invalid-request/authentication exclusion, a bounded validation allowance and continued rejection of truncated output. Existing fallback tests also assert model deferrals across stages, separate reasoning/caps, exact per-request accounting and private publication behavior. All 409 tests pass. The final private audit checks the resulting canonical draft, original evidence/citations, ten-call accounting, zero public records and restricted artifact permissions.

Source snapshots, provider requests/answers, state replay, diagnostics and an escaped HTML preview remain private and ignored under `.artifacts/`. Local environment configuration and credentials are unchanged.

## Remaining qualification

One synthetic intake now completes extraction, validation and private draft creation with cached extraction reuse. Plumbing's route-index error, wider preparation wording/shared applicability and open real multi-programme fidelity remain unresolved. No evidence supports enabling autonomous publication yet. Next address scoped route selection without guessing destinations or repairing rejected semantics, then qualify an open real multi-programme notice before publication.
