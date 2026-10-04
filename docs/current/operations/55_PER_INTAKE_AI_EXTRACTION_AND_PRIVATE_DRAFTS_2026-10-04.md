# Per-intake AI extraction and private drafts — 4 October 2026

Supported programme plans now connect to separate extraction, semantic validation and canonical private draft creation. Each trade keeps its own reference, recipient, requirements and evidence. **All 399 catalogue tests pass.** A bounded live Gemini canary on an authored synthetic notice saves one unvalidated candidate but no canonical drafts; provider failures exhaust the call budget before validation completes. Production scheduling/publication remains disabled and employer crawling stays optional.

## Opt-in private worker path

`RecentJobsWorker` accepts `programmeExtraction: true`; the default remains false. The local shadow CLI exposes `--programmes`, mutually exclusive with `--split`. The feature requires shadow mode for every provider and retains the planner's narrow supported layout: explicit apprenticeship trade headings, references and written application emails. It does not generalise ambiguous routes, portal groups or physical submissions into intakes.

The original notice remains the stored snapshot and the provider's numbered source. A separate local coverage view blanks excluded lines while preserving their positions. Extraction and supported validation evidence must fall wholly within one of the selected intake's original contiguous ranges. Other trades, the experiential programme and fabricated quotes spanning removed ranges are rejected. Shared WIL-only wording remains visible as context and cannot become an apprenticeship requirement. This specific check is not a general solution to conditional applicability.

The extracted intake must exactly match the selected reference, including spaces, and use the sole scoped application candidate. Canonical titles use the selected trade heading. Facts, evidence offsets and citations all point to the full parent snapshot; application evidence retains the original parent candidate index. Strict canonical parsing caught and prompted a correction to child citation snapshot IDs during testing. Original source text is never replaced by concatenated programme excerpts.

Each intake has its own extraction and validation cache identity, including source revision/binding, provider/model policy, stage version and reasoning settings. Validation also binds the actual semantic payload. Every real fallback HTTP attempt reserves quota and rechecks the source grant and lease. Local or semantic failures stay isolated to the affected trade; availability, quota or source/lease failures stop subsequent work. Completed sibling drafts survive a later budget failure and can reuse cached stages on a subsequent run.

After local mapping, issuer checks and independent model validation, the existing publication gate runs again inside the commit transaction. The result is always a private draft. Previously public/approved children cannot be overwritten, and withdrawn/closed/archived or withheld records require review. No public approval, public opportunity or watch is created. Planned email intakes make no employer HTTP or mailbox probes; crawling remains optional for other supported routes.

## Tests and bounded live canary

Fourteen new tests cover original source preservation, distinct canonical child records, exact references and recipients, cross-trade and fabricated evidence rejection, required CV coverage, WIL-only conditions, supported validator evidence, fallback accounting, separate stage reasoning, cache reuse, semantic failure isolation, partial progress on budget exhaustion, expiry, shadow-only enforcement and source pause. All previous 385 tests also pass.

The successful worker test creates two canonical private drafts from the authored synthetic fixture. Its first extraction falls back after a simulated 503, reserves all five HTTP attempts, then repeats after 24 hours with no additional model calls. Other tests prove that a validation budget stop preserves an already completed sibling draft. These are controlled tests, not live-source qualification.

A separate fresh Auth/Firestore emulator replays the same synthetic HTML with live Gemini calls and an eight-call cap. Expected source facts are recorded before model work. No real RecentJobs, employer or application endpoint is fetched in this replay, and no cloud database is used.

| Stage | Live outcome |
| --- | --- |
| Electrical extraction | 3.8, 3.7 and 3.6 Flash return HTTP 503; 3.5 Flash returns HTTP 200. Strict decoding rejects an extra top-level `type` field. No semantic fallback occurs. |
| Plumbing extraction | 3.8 and 3.7 Flash return HTTP 503; 3.6 Flash returns HTTP 200. Local mapping saves one private candidate. |
| Plumbing validation | 3.8 Flash returns HTTP 503. The eight-call budget then blocks another request with `MODEL_BUDGET_EXHAUSTED`. |
| Saved real MISA notice | The five-intake plan and original snapshot are retained. The expired deadline causes `NOTICE_NOT_OPEN` before AI; zero model calls or child drafts. |

The eight HTTP attempts have eight reservations and receipts. Two answers report **8,060 tokens**; usage for the six 503 responses is unknown. The live replay produces two parent plans, one private candidate, one per-intake decoding exception, two parent exceptions, **zero canonical drafts and zero public records**. The synthetic robots response and source HTML are replay inputs, not fresh robots checks or new source retrievals.

Agent review confirms the plumbing candidate's exact reference/email, issuer, deadline, N2 Plumbing requirement and required CV. Every extraction evidence offset, fact snapshot ID and citation matches the original parent snapshot. This checks a synthetic candidate only; semantic validation is unfinished. The electrical answer additionally duplicates the same complete OR education sentence into two requirement items; it is not accepted or scored as faithful. Raw answers, diagnostics, sources and an escaped private HTML preview remain ignored under `.artifacts/` with restricted permissions. Local environment settings and keys are unchanged.

## Remaining work

Canonical private draft creation is now implemented and exercised in tests. The live provider has not completed this new path, and this sprint does not qualify an open real multi-programme notice. Reproduce the saved malformed answer offline, improve output reliability without relaxing strict acceptance, and obtain a bounded complete extraction/validation result before broadening source qualification. More open, relevant notices and shared-condition applicability still need review. Availability fallback does not repair semantic errors, and a model-supported answer alone does not authorise production publication.
