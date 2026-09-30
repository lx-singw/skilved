# Additional requirement evidence — 29 September 2026

The shadow extractor now selects bounded skills sections, applicant-profile sentences, audience statements and differing secondary education entries for explicit evidence retention. V7 requires non-null coverage descriptors. The final trial retained ALPLA's exclusion and Hytec's previously missing secondary education value, but **the pipeline is still not qualified for publication**: Unique Personnel's response failed the provider's JSON validation, and classification/source-interpretation issues remain. All **147 catalogue tests passed**, with clean emulator shutdown.

## Implementation

The new [evidence selector](../../../packages/catalogue/src/ai/requirement-evidence.mjs) extends the existing main-section/alternative-list interpreter without changing historical V1–V5 replay behaviour. It recognises:

- Bounded Key Skills, Required Skills and skills/competencies sections. Explicit required/preferred markers retain their level; otherwise applicability remains unclear. Unbounded lists are not assumed to end at a footer.
- Narrow ideal-candidate profile wording, retained with unclear eligibility level.
- Invitations for youth to apply, retained as ambiguous audience evidence without inventing age bounds or hard eligibility.
- Education values under an Important Details section when they differ from the main requirements' exact wording. Their relationship to the primary qualification remains ambiguous; no qualification equivalence or ALL/ANY relationship is inferred. Exact repeats do not add another uncertain condition.
- Explicit overtime-willingness conditions, classified as availability.

These are conservative, tested patterns, not a universal interpretation of job adverts. Full-source model extraction and semantic checks are still needed. The selector supplies exact single-line evidence constraints and never obtains an employer page.

The [requirements adapter](../../../packages/catalogue/src/ai/requirements.mjs) enforces hinted kind, level and state constraints. Additional evidence cannot join a reserved qualification-alternative group. Ambiguous audience/secondary-table facts are retained alongside other items with their uncertainty explicit; the worker's existing material-facts gate rejects them before publication.

V6 still allowed null coverage fields. In its fresh trial, Groq used those fields to omit selected evidence. V7 removes that schema option. For genuinely unresolved overall logic, every descriptor must instead be ambiguous/conflicting, additional items must be empty and `unresolvedSpan` must cover the selected source evidence. Code emits an unknown expression rather than inventing a resolved requirement tree. Such output remains blocked.

V1–V6 schemas/prompts/decoders remain available for versioned replay. V7 changes the split worker's extraction/cache version. The normal worker's single-stage default is unchanged; split extraction remains shadow-only. No automatic repair, provider fallback or new model retry was added.

## Frozen-source trials

Each trial had a four-call cap, used Groq `openai/gpt-oss-120b` at low reasoning, and scored against the same broader source-inventory manifest. Neither retrieved fresh websites, crawled employers, ran new metadata/semantic-validation stages nor wrote to production.

| Case | V6 | Tokens | V7 | Tokens |
| --- | --- | ---: | --- | ---: |
| Feltex | Broader audit match | 2,596 | Broader audit match | 2,553 |
| ALPLA | Coverage rejected: exclusion placed in `additional` while its coverage field was null | 2,298 | All four conditions retained; exclusion kind differs from frozen expectation | 2,612 |
| Hytec | Required evidence fields null; rejected | 3,919 | All reviewed condition passages retained, including ambiguous secondary education; source relationship remains unresolved | 5,031 |
| Unique Personnel | Profile, skills and audience fields null; rejected | 3,522 | Provider `json_validate_failed`; no accepted response | Unavailable |
| **Total** | **4 calls** | **12,335** | **4 calls** | **10,196 reported** |

**Eight new calls reported 22,531 tokens; usage for the final rejected Unique Personnel request was unavailable.** Output tokens already include reasoning. No failed request was retried within either trial. Private evidence is under `.artifacts/groq/requirements-v6/` and `.artifacts/groq/requirements-v7/`.

V7 has one strict audit match, two mismatches and one provider rejection. These outcomes are intentionally not collapsed into a four-case success:

- ALPLA labelled the Mathematics Literacy exclusion `other`; the agent-authored frozen audit expected `education`. The wording and required level were retained. Correction: the initial write-up incorrectly reported the model's kind as `subjects`. The [subsequent saved-response review](26_PROVIDER_OUTPUT_DIAGNOSIS_2026-09-29.md) confirms `other`, records a revised expectation of `subjects`, and preserves the original scores. The classification mismatch remains.
- Hytec's ambiguity is now retained rather than hidden. Its audit continues to require source interpretation, and its additional ambiguous item prevents the old resolved-expression expectation from matching. That is not evidence that the extractor should guess a relationship to make the score pass.
- Unique Personnel has no accepted V7 output, so synthetic support for its layouts is not reported as live extraction success.

## Verification and next step

All **147 tests** passed, including evidence selection/boundaries, explicit required/preferred markers, unclear skills, audience uncertainty, secondary-table repeats, exact spans, prohibited null coverage and the material gate's rejection of ambiguous facts. Offline compatibility tests cover all seven wire versions. The preceding audit-only work passed 141 tests on its clean rerun; the intermediate V6 suite passed 146 tests. Tests make no live provider calls.

Next: diagnose the remaining provider schema failure and review the classification expectation for subject exclusions. Then repeat the broader evidence checks and evaluate new notices under one frozen version. Current results do not establish repeatability, independent accuracy, complete source-to-feed success or production readiness. Publication and scheduling remain disabled; employer crawling remains optional and off by default.

See the [broader source inventory](24_REQUIREMENT_SOURCE_INVENTORY_2026-09-28.md) and [pipeline runbook](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md).
