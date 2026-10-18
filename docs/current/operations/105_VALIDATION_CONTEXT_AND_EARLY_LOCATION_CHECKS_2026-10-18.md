# Publisher validation context and early location evidence checks

Date: 18 October 2026. Status: contracts build, 79 focused tests, all 636 serial catalogue tests and private replay audits pass. No source retrievals, live provider calls, quota changes or publication occur. The saved V15 failures remain unchanged.

## Explicit publisher preparation context

The [V15 trial](104_V15_CURRENT_NOTICES_AND_VALIDATION_DISAGREEMENT_2026-10-18.md) found that Transnet extraction passed the frozen checklist, but validation demanded excluded publisher preparation advice. Validation now receives `sourcePolicyContext.publisherPreparationSections`: complete recognised passages and their inclusive one-based spans in the original notice. The full notice, extracted values/evidence, primary notice and parsed original routes remain present and unchanged.

The shared preparation parser works directly on that original corpus, including numbered headings, multiple sections and an unclosed section through EOF. The validation instruction explicitly distinguishes omitted publisher preparation from a missing employer instruction. A document required independently elsewhere still needs its own source-supported requirement or practical instruction; repeated wording is not globally excluded. Context cannot broaden a selected programme's scope or replace independent primary checks.

The validator still supplies its own assessment. Verdict parsing, negative assessments, source-quote integrity, material gates and publication checks are unchanged. No code converts a negative result into approval based on the new context. Context recognition remains bounded to supported headings; it is not a complete semantic classification of every notice.

## Duration priority and earlier location rejection

Extraction and split metadata guidance now prioritise a recognised maximum-duration passage in the summary, copying the complete source wording and retaining its upper bound. Separate application instructions keep their own complete practical passage. This changes guidance without filling an omitted value or joining distant evidence. The existing pay/duration completeness checks remain in force; model compliance still needs a live assessment.

Location guidance explicitly requires each stated city, province and country in that field's own selected evidence. Separate city/province lines need one contiguous span covering both. A province mentioned elsewhere cannot support a city-only span, and stated geography must not be silently dropped to conceal incomplete evidence.

The shared compact metadata decoder now runs the existing location evidence check, so ordinary and split extraction reject an underspecified location span before extraction caching, candidate storage or validation. Canonical mapping retains its independent location check. A simulated complete answer preserves unknown country/attendance, maximum duration, separate document instructions and the original employer route through to a private draft.

Canonical/programme extraction advance to V16, compact shape stays V7, split metadata advances to V9, ordinary validation to V13 and programme validation to V12. New contracts use separate cache identities; historical cached failures are retained. Output schemas, provider/token budgets, fallback rules and employer-crawl settings are unchanged.

## Captured-response replay and verification

Offline replay rejects the unchanged ALPLA V15 answer for omitted maximum duration and independently confirms its location evidence failure. Transnet's saved V12 negative assessment remains schema-valid, negative and historically attributed to V12. The new validation context contains the entire preparation passage behind that complaint while retaining the actual required attachment instruction outside it. This is context coverage, not evidence that a new model assessment will succeed.

Authored tests cover repeated genuine/publisher document wording, exact original spans, single-line/unclosed boundaries, preserved primary evidence, unchanged negative verdicts and usage, ordinary/split location rejection and complete evidence. Emulator worker coverage checks that a short location span spends one simulated call but creates no extraction cache, candidate, validation or draft; complete evidence can proceed to a private draft without publication. The contracts build, 79 focused tests and all 636 catalogue tests pass. The full suite runs serially against Firestore/Auth emulators. Code hashes remain unchanged throughout final verification.

All 43 prior V15 trial files remain unchanged, including provider outputs, negative cache, receipts, snapshots, budgets and earlier private draft. Real-provider observations remain 45 generation requests, 114,465 known total tokens and 24 unknown-usage calls across retained history; availability and daily-exhaustion state are unchanged. These are worker observations rather than provider dashboard totals.

Credentials, local environment files, source snapshots, provider responses and private audits remain ignored. Employer crawling stays optional/off, with production scheduling/publication disabled. Next assess the new contracts in a separately frozen bounded trial on freshly screened open discovery notices. Independent fidelity, repeatability and source reuse qualification remain open.
