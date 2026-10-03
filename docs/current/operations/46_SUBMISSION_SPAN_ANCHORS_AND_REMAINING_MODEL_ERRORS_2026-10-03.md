# Submission span anchors and remaining model errors — 3 October 2026

V13 corrects a local validation error: a source-confirmed “must” obligation can continue onto the next source line. The faithful frozen Volkswagen inventory now passes with its complete two-line trade-selection instruction. **All 321 catalogue tests pass.** Three live Flash-Lite answers still fail alternative or wire validation, so this resolves the local span bug without qualifying the model or publication.

## What the validator knows

The previous policy confirmed a standalone current must-clause's strength while leaving its kind to the model, but the shared compiler also demanded an exact single-line passage. That extra constraint rejected a valid continuation explaining how to make the required selection.

The separately versioned V13 policy marks only those strength-only hints with `spanPolicy: anchor`. The complete condition must start at the hinted line and retain mandatory strength. Its kind and end remain model judgments; continuation lines must belong to the same obligation. Typed hints retain exact spans, including any hint subsequently typed by the profile policy. Another anchored obligation must start its own passage. Protected typed conditions, context and uncertainty scopes cannot be absorbed into a continuation.

This is a minimum source check, not a guarantee that every chosen continuation is semantically correct. Full source coverage, quote reconstruction, source constraints and independent audit comparisons still apply. No employer names, expected answers or model responses determine the anchor rule. Caveats and existing uncertainty take precedence. The worker and V1–V12 callers keep their original exact-span behavior.

`submission-line-review.mjs` exposes `recentjobs_requirement_review_v13` with policy `entry_applicability_v9`. Source, policy, prompt, local schema, version and reasoning are bound before model output is used. Shared V12 payload/decoder helpers accept explicit evidence without changing default contracts. The offline evaluation tool now dispatches V13 and advertises V1–V13 support.

## Frozen preflight and bounded calls

All six existing faithful manual inventories pass the new policy and unchanged complete source audits: Siemens, Sea Harvest, Mercedes, Volkswagen, Traxtion and MISA. Volkswagen retains eight conditions and its two unresolved scopes. The audit is not rewritten to make the span pass. Its new faithful control comes from that retained manual inventory; the defective control omits the required certified-ID condition. Both controls are frozen before calls. Traxtion controls and audits are copied unchanged.

The live plan contains Volkswagen plus an identical repeat and familiar Traxtion. All use Gemini 3.5 Flash-Lite, low thinking, JSON-object mode, a 3,072-token cap, 60-second pacing and no retries or fallback. There is no billing preflight, billing change, new source retrieval, employer crawl, route request or publication. Inventories are saved before validation. AI module byte hashes remain unchanged during the calls.

| Attempt | Result | Reported tokens |
| --- | --- | ---: |
| Volkswagen | Wire valid; invalid singleton alternative anchor | 3,279 |
| Identical Volkswagen repeat | Wire valid; same alternative error | 3,256 |
| Traxtion | All source keys present; invalid value at L24 | 2,386 |

Both Volkswagen answers assign L18 an alternative anchor of 18 without a second complete branch. The qualification alternatives are inside that single source line and should remain one verbatim condition, with no multi-line alternative anchor. Both also classify the trade-selection obligation as `other` and leave its explanation at L20 as context; these additional disagreements are recorded diagnostically, not repaired. The corrected validator accepts the faithful continuation, but the model does not supply it in either call.

The repeated requests are identical; the complete returned inventories differ. Neither passes semantic decoding, so output repeatability is not a qualification success. Traxtion returns the string `document` at L24, where a supported non-current role or a complete current object is required. That is a wire failure, not a missing source key or a provider outage. The trial reports **8,921 tokens**, with usage available for all three answers and thinking counts absent/null. Actual billing is not inspected.

## Verification and limits

All 321 catalogue tests pass, including complete multi-line quotation, omitted/weakened obligation rejection, protection against merging independent anchored obligations or typed evidence, protected programme boundaries, caveats, binding failures and blind bounded requests. Firestore/Auth emulators shut down cleanly. All 138 historical V1–V12 payload/contract hashes and replay outcomes are preserved; original source/audit and input hashes are also reverified.

The faithful/defective manual V13 replay produces four decision matches and exits successfully. Live V13 replay produces six invalid comparisons and exits 1, as expected for the recorded failures. Passing tests and manual preflight do not turn those model answers into successes. Audits remain agent judgments, not independent model qualification.

The next experiment should test Gemini's native structured-output schema on the frozen contract to prevent unsupported role values, then measure remaining alternative and applicability errors separately. Deadline extraction, original application URL/email selection and full source-to-feed qualification still require testing. Automatic publication remains disabled, Groq remains the worker provider and employer crawling remains optional/off by default.
