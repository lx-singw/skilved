# Compact Groq extraction evaluation — 27 September 2026

The simpler adapter is implemented and its final Feltex extraction passed mapping and medium-reasoning semantic validation. Production remains disabled: one passing development case does not qualify the source, and the unseen ALPLA case exposed omissions that the new deterministic coverage check now rejects.

## Final implementation

- Groq receives numbered source lines. Evidence spans select inclusive line ranges; code reconstructs the exact text and the existing mapper verifies snapshot offsets. No fuzzy matching or quote repair is used.
- Requirement items retain original wording, category and required/preferred/unclear status. Their canonical `description` is the complete quoted passage; the optional `qualification` and `document` subobjects are null. Academic subjects, document conditions and alternatives remain visible in the original wording. This adapter does not produce structured attributes for automatic eligibility scoring.
- Requirement logic uses a bounded string such as `all(r1,any(r2,r3))`, parsed into the existing canonical ALL/ANY/IF tree. The parser supports an explicit unknown source span, checks every item reference and rejects unused/duplicate items, extra tokens, unsupported operators, excessive depth and excessive children. It never evaluates executable code. This removes redundant graph-node IDs and root fields from model output.
- Explicitly bounded requirement sections receive a deterministic coverage check. Every substantive line must be covered by requirement evidence, including exclusions and document rules. Missing coverage fails with `AI_REQUIREMENT_COVERAGE`. Unbounded or unrecognised layouts still depend on semantic validation; coverage does not establish that a selected passage supports a model value or that its logic is correct.
- Explicit reference checks now support both `Reference: CODE` and a label followed by the code on the next line.
- The semantic audit receives all material fact states, values, quotes and requirement logic, without private storage IDs, review metadata and snapshot hashes.
- Extraction stays at **low** reasoning. Validation now defaults to **medium**, separately configurable through `SKILVED_AI_VALIDATION_THINKING=low|medium`. The worker passes the actual configured settings to both boundaries and includes validation reasoning in its validation cache key. Changing it retains extraction cache results but repeats validation.

Versions: `recentjobs_extraction_v4`, wire `recentjobs_extraction_v4_groq_v6`, semantic prompt `recentjobs_validation_v5`. The model remains Groq `openai/gpt-oss-120b`; the completion limit remains 3,072, with no automatic model/provider fallback or budget increase. Employer crawling remains optional and off by default. Application destinations still come from parsed original methods and qualified issuer routes, not discovery-page redirects.

## Real-source evaluation

| Case | Result |
| --- | --- |
| [Feltex](https://recentjobs.co.za/2026/09/23/feltex-connacher-electrical-apprentice/) — previous development case | Final low-reasoning extraction preserved the reference, deadline, location, original portal and all three qualification alternatives. Exact evidence and section coverage passed. Low validation incorrectly rejected supported summary/link details; medium validation accepted the same record with valid evidence. |
| [ALPLA](https://recentjobs.co.za/2026/09/16/alpla-plastics-apprenticeship-programme-gauteng/) — initially unseen | Expected requirements were recorded before its first model call. An early extraction omitted documents and an exclusion; the model validator accepted that incomplete result. The new coverage guard rejects such an output. Final low extraction retained document wording but omitted the explicit Mathematics Literacy exclusion and was rejected before validation. |
| ALPLA — additional medium-extraction comparison | The exclusion and document wording were retained, within the existing token limit. Manual review still found duplicated document statements, missing structured city/pay details and promotional WhatsApp text in practical conditions. This is not a qualified result, and medium extraction was not made the default. |
| [Cummins](https://recentjobs.co.za/2026/09/15/cummins-engine-workshop-field-service-technician-apprenticeship-2027/) — unseen | No parsed deadline; production preflight returned `NOTICE_PRECISION_UNSUPPORTED`. No model call. |
| [Tronox](https://recentjobs.co.za/2026/09/15/tronox-engineering-apprenticeship-2026/) — unseen | Retrieved HTML did not satisfy the supported detail layout; parsing returned `RECENTJOBS_LAYOUT_CHANGED`. No model call. |

The source reads used the existing guarded client, robots check and pacing. No employer pages were fetched. Source HTML, expected observations, raw structured responses and private replay scripts remain under ignored `.artifacts/groq/`. No source/issuer qualification, production worker grant, scheduler or publication was created by these trials.

This is an iterative development evaluation, not a held-out benchmark or repeatability claim. ALPLA ceased to be held out once its first output informed a change. Intermediate graph formats exposed missing roots, malformed references and provider schema rejections; these were rejected, not repaired into publishable records. All trials are included in usage below, rather than reporting only a favourable result.

## Tokens and verification

The final Feltex extraction used **4,282 tokens**, compared with the earlier 6,126-token extraction (about 30% fewer in this example). The stronger medium validation used 3,870 tokens, making the final passing pair **8,152 tokens**. Output counts already include reasoning. This is an observed comparison, not a general cost or accuracy guarantee.

Across this follow-up, 15 responses reported **64,882 tokens**. Six other requests returned no usage metadata: three provider HTTP 400 rejections, two rate-limit responses and one transport failure. Their usage remains unknown. These development totals are separate from the previous evaluation's 33,112 reported tokens.

The final catalogue emulator suite passed **93 tests**, including the public web handoff integration. New tests cover evidence spans, the logic grammar, coverage omissions, split-line references, semantic payload preservation and cache invalidation when validation reasoning changes. No tests use real credentials or external provider requests.

Next: use fresh notices to qualify repeated extraction and validation performance, including exclusions, application documents, promotional boilerplate and same-line alternatives. The final format improves cost and makes several omissions deterministic failures; it does not yet establish safe unattended publication across RecentJobs. Qualify source policy and original application relationships before the scheduled shadow pilot, then enable automatic publication only for the qualified scope.

See the [pipeline runbook](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md) and [earlier diagnostic results](15_RECENTJOBS_GROQ_EVALUATION_2026-09-27.md).
