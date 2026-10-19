# Bounded document and required-competency coverage

Date: 19 October 2026. Status: offline implementation adds local completeness checks for explicit standard-document submission blocks, inherent job requirements, recommendations and required competency details. Missing passages, incorrect knowledge classification and optionalized mandatory facts stop canonical mapping before candidate storage, model validation or drafting. The saved UFS answer remains unchanged and rejected; no new real extraction is attempted.

## Problem and resulting behavior

The [UFS Flash-Lite trial](119_UFS_FLASH_LITE_ANSWER_AND_ATTENDANCE_COMPLETENESS_HOLD_2026-10-19.md), committed as `8a34762`, returned valid JSON with unsupported attendance. Its diagnostic audit also found missing submission context, all four standard document instructions and all nine required competency details, plus basic knowledge classified as education. The old bounded requirement policy supplied no hints for those sections despite transmitting the full source.

Source policy V8 recognizes closed `Inherent Job Requirements`, `Recommendations` and `Key Competencies Required` sections, plus explicit prose introducing a standard-document submission list. Recognition retains source text and line positions. Unbounded lists continue to abstain, and unfamiliar layouts still require semantic review.

The document block retains its all-document instruction and directly adjacent incomplete-application rejection rule. Unconditional submission passages may be complete required document items or full practical instructions. A document instruction cannot become an optional ANY/IF branch merely by retaining a required level label. Scoped foreign-qualification, identity-alternative and external-applicant instructions stay verbatim in practical conditions, including their applicability wording; they cannot become unconditional applicant eligibility or an inferred predicate.

For the recognized inherent/competency layout, basic knowledge uses `other`, explicit experience recommendations stay preferred and mandatory details remain required under ALL. An explicit alternative-list introduction suppresses the new ALL hints rather than changing source alternatives into conjunctions. A complete single-line qualification alternative remains together. Complete grouped competency evidence is accepted; standalone subheadings cannot replace details or become requirements themselves.

Competency headings are context. Duties, assumption-of-duties timing, stipend headings and publisher preparation advice are excluded from these requirement sections. A source sentence beginning with “Competencies” is not treated as a boundary merely because it shares that word with a heading. These are bounded local checks, not a universal eligibility classifier or independent semantic verification.

## Contract and worker integration

Canonical extraction advances to V20, compact extraction to `recentjobs_extraction_v20_groq_v7`, scoped programme extraction to V20 and split metadata to V13. Compact wire format V7 remains unchanged. New versions separate future extraction/cache use from the old behavior; historical outputs and cache records are not rewritten. Full validation remains V15 and programme validation V14.

The ordinary extraction payload carries the expanded source policy. Split metadata receives the complete submission and conditional-document instructions. Canonical mapping applies the checks before candidate storage and model validation, including internal or previously decoded answers. A schema-valid raw extraction can still be retained in the private model cache before canonical mapping; cache presence is not acceptance or permission to draft. No semantic retry or response repair is added.

The attendance guard remains strict. Simulated ordinary extraction still rejects unsupported attendance after one call with usage retained, without trying another endpoint. Employer crawling remains optional/off; production scheduling and publication remain disabled.

## Unchanged real-answer regression

The saved UFS snapshot now supplies thirteen requirement lines: two education conditions, knowledge, preferred experience and nine required competency details. It also supplies three unconditional submission passages and three scoped document instructions, covering the acceptance/context and all four documents. Five competency subheadings remain context; duties and start timing are outside coverage.

The saved answer covers none of the nine competency details and omits five submission passages: the all-document context and four document instructions. Direct source-policy checks and canonical mapping reject that unchanged answer with `AI_REQUIREMENT_COVERAGE`. Compact decoding still rejects its unsupported attendance first with `AI_LOCATION_EVIDENCE_UNRESOLVED`. These are separate offline entry points; this sprint does not rerun the worker on the real source or claim a new live first hold. Province remains null with raw `FS ZA` retained and is not the attendance failure.

No fields, source spans, expectations, raw response, negative verdict or earlier budget are modified. This demonstrates a stronger local rejection of known incomplete output, not improved real-model extraction quality.

## Verification and next work

The contracts build, all 61 focused checks and the final 678-test serial Firestore/Auth emulator suite pass. Eleven new authored tests cover scoped document preservation, omissions, knowledge kind, mandatory conjunctions, alternative-list abstention, grouped evidence, context-only headings, unknown logic, unchanged attendance rejection and split metadata payloads. Five worker scenarios verify four failure paths stop before candidate storage/validation/drafting, while a complete fictional answer reaches an unapproved private synthetic draft. No synthetic case publishes a public record.

The private regression verifies all 219 frozen historical artifact hashes and an identical quota-state hash. There are zero new source requests or real provider calls. Shared observations remain 77 requests, 267,299 known tokens and 28 unknown-usage calls; daily exhaustion, availability, spending and all earlier receipts remain unchanged. Public test fixtures are authored fictional sources and simulated responses. Real snapshots, responses, credentials and evaluation artifacts remain private and ignored.

Next assess freshly retrieved eligible notices using V20 under a separately bounded call allowance and a source checklist fixed before calls. Preserve this negative regression and all spending, stop on semantic failures, and assess the full answer before any validation or draft claim. New real-source fidelity, repeatability, source qualification and independent employer verification remain open.
