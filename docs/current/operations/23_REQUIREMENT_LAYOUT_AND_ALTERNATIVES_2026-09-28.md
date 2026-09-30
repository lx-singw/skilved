# Requirement layouts and alternatives — 28 September 2026

The final `recentjobs_requirements_v5` trial matched all four frozen **targeted requirements checks** using fresh Groq responses. Feltex retained three complete alternatives, ALPLA retained its exclusion and document condition, and Hytec and Unique Personnel no longer failed because their requirements headings were unrecognised. The full catalogue suite passed **134 tests**. This is development progress, not whole-notice accuracy or production qualification; known limitations of the expectation set remain below.

## Implementation

The new [layout interpreter](../../../packages/catalogue/src/ai/requirement-layout.mjs) recognises explicitly bounded requirements sections, including emoji-decorated headings, `Desired Experience & Qualification`, `Main training/duties`, and application/publisher-promotion boundaries. It excludes introductory and preference markers from condition fields while preserving the full, original source text for the model and evidence. It does not assume an unbounded section ends at the footer.

An opening `one of the following` list is recognised only when it consists entirely of supported qualification prefixes and narrowly recognised subject continuations. A qualification ending in a colon can retain its following subject lines as one complete branch. Mixed documents/prose, conditional or preferred wording, incomplete subject lists and unbounded sections cause the deterministic alternative rule to abstain. These cases still require model interpretation and semantic validation; they are not flattened or repaired into ALL logic.

For recognised lists, the [requirements adapter](../../../packages/catalogue/src/ai/requirements.mjs) reserves one ANY group and requires each exact source branch span. Other conditions cannot join that reserved group. V5 requests one field at the first line of each complete branch; code reuses its verified descriptor for the recognised subject continuations. This avoids asking the model for identical answers repeatedly. Missing branch fields, truncated branch spans, changed group/relation and unrelated additional conditions still fail.

Notices without any recognised bounded section select the existing group response format **before** making a model request. They do not send an empty coverage object. This is deterministic format selection, not a retry or provider fallback. The whole notice is still supplied, and generation makes at most one provider call per adapter invocation. Whole-notice completeness remains a separate check.

V1–V4 schemas, prompts and decoders remain available for explicit offline replay. The [evaluator](../../../packages/catalogue/tools/evaluate-recentjobs.mjs) fingerprints the candidate-specific prompt/schema for the response version. V5 changes the worker's split extraction cache version. Shadow-only enforcement, budget accounting, original application routing and optional employer crawling are unchanged.

## Two bounded trials

Both trials used the same frozen candidate hashes and original agent-authored expectations, Groq `openai/gpt-oss-120b`, low reasoning, four calls per trial and no automatic retry. They made no website requests or employer crawls and did not write to production.

The intermediate V4 trial matched ALPLA, Hytec and Unique Personnel. Feltex correctly used ANY but left repeated fields for the N3 subject lines null; the decoder rejected it. That observation led to V5's single field per recognised branch. The original V4 result remains recorded as rejected, not retrospectively changed into a success.

| Case | V4 outcome | V4 tokens | V5 outcome | V5 tokens |
| --- | --- | ---: | --- | ---: |
| Feltex | Rejected: empty repeated subject fields | 2,888 | Targeted match: three complete ANY branches | 2,404 |
| ALPLA | Targeted match | 2,146 | Targeted match: four conditions retained | 2,080 |
| Hytec | Targeted match | 3,161 | Targeted match: ten required, two preferred conditions | 3,008 |
| Unique Personnel | Targeted match | 1,900 | Targeted match: three qualification/subject conditions | 1,911 |
| **Total** | **3/4 matches** | **10,095** | **4/4 matches** | **9,403** |

**Eight new requests used 19,498 reported tokens.** Completion counts include reasoning; no historical usage is added. Private attempts, responses, frozen manifests and reports are under `.artifacts/groq/requirements-v4/` and `.artifacts/groq/requirements-v5/`. Source text and provider responses remain ignored artifacts. There was no new metadata extraction, semantic assessment or complete live worker run in this iteration.

## Limits of the result

The four matches compare expected passages, their required/preferred levels and the expected ALL/ANY structure. They do not prove every field or every requirement classification is correct. These are repeatedly used development cases, not independently labelled or held-out notices.

Known expectation gaps remain: Hytec's details table also contains an education value that the frozen requirements expectations omit; Unique Personnel has a separate Key Skills section outside the three expected qualification lines. The new coverage recogniser does not establish that these other details can be omitted or ignored. Before treating this set as a completeness benchmark, review those passages and explicitly document whether they are additional conditions, duplicate descriptions or conflicting requirements. Keep original scores and create a separately versioned expectation set for that review.

The requirements-only trial also does not override deadlines. Hytec is expired, Feltex is at the worker's conservative date-only cutoff, and Unique Personnel has no usable closing date. A targeted requirement match does not make any of these notices publishable. Production publication, reads and scheduling remain disabled; employer-page crawling remains optional and off by default.

## Verification and next step

All **134 catalogue tests passed**, including the new list-boundary/abstention cases, exact multi-line branches, reserved-group protection, missing conditions, decorated headings, required/preferred preservation, single-call format selection and offline replay of all five response versions. Emulators shut down cleanly. The final V5 four-case offline replay also matched all four expectations without model calls.

Next: broaden and review the semantic expectations, especially skills, secondary tables and requirement kinds; then test new notices and repeated extractions under one frozen version. Only after those results hold should the complete worker be qualified for scheduled autonomous publication. Do not use the targeted four-case score as the production gate.

See the [previous coverage experiment](22_REQUIREMENT_COVERAGE_CHECKLIST_2026-09-28.md) and [autonomous pipeline runbook](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md).
