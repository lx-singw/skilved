# RecentJobs extraction regression evaluation — 27 September 2026

The next step is to make requirement extraction reliable before enabling automatic feed publication. An offline evaluator now compares saved model responses against frozen, source-based expectations. Four development cases have been prepared: Feltex, ALPLA, Hytec and Unique Personnel. These are agent-authored regression expectations, not independently reviewed labels or a held-out qualification set.

## What changed

The [evaluator](../../../packages/catalogue/src/ai/evaluation.mjs) checks selected canonical facts, the exact original application method/destination, required passages and their mandatory/preferred levels, and the expected ALL/ANY/IF tree. It runs the existing decoder, evidence mapper and material-fact checks. It ignores model-generated item names and order within ALL/ANY groups; other structural differences require review. It is deliberately not a general logical-equivalence or semantic-completeness judge. A single verbatim compound condition can retain its internal alternatives.

The [offline CLI](../../../packages/catalogue/tools/evaluate-recentjobs.mjs) checks frozen candidate-file hashes and reports manifest, response and current prompt/schema hashes. Historical response versions remain visibly historical. Missing outputs are `not_run`, not successful checks. It reads explicit bounded local files, makes no model/network/database calls, and never approves publication. A successful extraction comparison does not establish that a notice is still open or that its destination is qualified.

Private inputs and outputs remain under ignored `.artifacts/groq/`:

```sh
node packages/catalogue/tools/evaluate-recentjobs.mjs .artifacts/groq/regression-manifest-v5.json
```

The command prints a source-text-free JSON report and exits 1 if any case is missing, rejected or mismatched. The manifest declares `purpose: development_regression`; each case specifies an id, candidate file and SHA-256, optional saved response file, and expected facts, route, requirement passages/levels and expression. File paths resolve relative to the manifest. Reports always state `qualification: false`. Keep the manifest private because it contains source passages and original application URLs.

## Observations

| Case | Evidence | Result |
| --- | --- | --- |
| Feltex | Prior saved v4 extraction replayed through current checks | Matches selected facts, destination and three qualification alternatives; not a new v5 success |
| ALPLA | Prior saved medium-reasoning response | Rejected for duplicate requirement passages |
| ALPLA | One new v5 low-reasoning extraction | Rejected for the same duplicate-passage failure |
| Hytec | Frozen source and expectations, no saved response selected | Not run; its archived deadline cannot establish current availability |
| Unique Personnel | Frozen source and expectations, no saved response selected | Not run; closing date is explicitly unspecified |

The new ALPLA call used **4,704 tokens**: 3,290 input and 1,414 output, including 763 reasoning tokens. There was one request, no retry and no paid semantic validation. The raw response cited the same document line for two alternatives, classified both as preferred, and marked the explicit Mathematics Literacy exclusion ambiguous. The duplicate-passage check rejected it first. Those additional observations come from inspecting the saved response, not from downstream checks that did not run.

The replay report's `newModelCalls: 0` describes replay only; the separate new ALPLA generation consumed the one call above. Current production prompts, model settings and publication gates were not changed during this evaluation. Employer crawling remains optional and off.

## Next implementation decision

Test a smaller, separate requirement-extraction step against these frozen cases. Its job should be to preserve distinct source conditions, exclusions and document instructions before constructing their relationships. Keep original route selection deterministic, and retain the strict rejection rules. Compare total calls/tokens and complete-condition accuracy with the current single extraction call; do not adopt a split just because its JSON is valid.

These four cases are for development. Expand to the proposed ten distinct notices across at least three issuers, include email/submission instructions and additional layouts, independently review the expected facts, then freeze the chosen prompt/schema and run a separate qualification set. None of today's results justifies enabling production publication or adding more discovery sites yet.

Validation: 38 targeted tests passed across evaluation, Groq, canonical extraction and source-line handling, including five new evaluation tests. The preceding full catalogue suite had 101 passing tests; it was not rerun for this isolated offline tool.

See the [live shadow report](17_RECENTJOBS_LIVE_SHADOW_2026-09-27.md) and [pipeline runbook](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md).
