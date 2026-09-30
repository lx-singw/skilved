# Requirement group compiler — 28 September 2026

The requirements experiment now assigns item IDs and constructs references in code. **Three of four frozen development cases matched all checks**, compared with one of four in the previous trial. The remaining case revealed a source statement missing from the expected answer. The new adapter remains experimental; it is not enabled in the worker and no production records were published.

## Implementation

`recentjobs_requirements_v2` replaces model-written IDs and expression strings with groups of source-backed items. A group is ALL or ANY; groups coexist under ALL. Code assigns each distinct span a stable ID, constructs the canonical expression, flattens adjacent ALL groups and references every item, including preferred items without changing their level. The model still chooses the passages, levels and group relationships; code cannot guarantee those choices are semantically correct.

The [adapter](../../../packages/catalogue/src/ai/requirements.mjs) rejects supplied IDs/expressions, duplicate or overlapping passages, mixed required/preferred alternatives, excessive items, invalid spans and contradictory resolved/unresolved output. Exact wording, coverage and promotion checks remain. Single-line compound alternatives retain their original text. Conditional or nested relationships outside this deliberately limited group format must return an unresolved passage; they are not flattened into a publishable structure.

The original full extractor and worker are unchanged. V1 decoding is retained only for explicit offline replay. The [evaluation CLI](../../../packages/catalogue/tools/evaluate-recentjobs.mjs) selects the declared saved requirement version and rejects unknown versions; historical outputs remain marked as historical. There is no provider or schema fallback during generation.

## Frozen four-case trial

The September 27 candidates and expected answers were reused unchanged. Each case received one new Groq GPT-OSS 120B request with low reasoning, the same 3,072 output-token cap and one frozen v2 prompt/schema. Calls were paced by 30 seconds after each preceding request. No retries, website fetches, employer crawls, database writes or semantic-validation calls were made.

| Case | Result | Input tokens | Output tokens, including reasoning | Total |
| --- | --- | ---: | ---: | ---: |
| Feltex | Matched three qualification alternatives | 1,245 | 412 | 1,657 |
| ALPLA | Matched requirements, exclusion and mandatory document condition | 1,260 | 470 | 1,730 |
| Hytec | Review required: an additional source education statement is absent from expectations | 1,505 | 945 | 2,450 |
| Unique Personnel | Matched separate qualification, Mathematics and English conditions | 1,294 | 255 | 1,549 |
| **Total** | **4 calls; 3 strict matches; no decoder rejection** | **5,304** | **2,082** | **7,386** |

The previous v1 trial used 7,661 tokens. This small development comparison does not establish production accuracy, repeatability or total pipeline savings. Metadata extraction and semantic validation are additional work and cost.

### Hytec review finding

V2 retained all twelve expected passages and their required/preferred levels, with valid references. It also retained the details table's education statement, **“Grade 12 / National Certificate”**, as a required item. That statement exists in the source but was absent from the frozen expectations, which already include the minimum-requirements section's Post-Matric/N3 condition.

The expected answer needs review for completeness and for how those education statements relate. This is not evidence of an invented source passage. No expectation was changed after seeing the output, and the case remains a mismatch in the scored report. Do not change the prompt to suppress that statement simply to obtain four passing scores.

## Evidence and replay

Private immutable-at-creation reservations, inputs manifest, saved responses and usage reports are under ignored `.artifacts/groq/requirements-v2/`. The trial script refuses to create an already existing output directory, preventing accidental repeat spending through that script.

```sh
node packages/catalogue/tools/evaluate-recentjobs.mjs --requirements .artifacts/groq/requirements-v2/manifest.json
```

Expected result: exit 1, three matches, one mismatch, zero rejections. Replay makes no model calls. The same CLI can replay the V1 manifest with V1 decoding; its original one match, one mismatch and two rejections remain unchanged.

The explicit experimental extraction command remains:

```sh
node --env-file=.env.local packages/catalogue/tools/extract-recentjobs.mjs --requirements <manifest.json>
```

That command makes one quota-consuming call and prints a private report. It uses a saved HTML manifest, does not fetch websites and cannot publish. Preserve outputs under an ignored private directory.

These are archived source-content tests. They do not establish current availability. In particular, Feltex's stated September 28 deadline has now reached the worker's conservative date-only cutoff; a passing extraction is not authorization to publish it today.

## Validation and next work

`pnpm catalogue:test` passed **113 tests** with exit code 0. New checks cover stable source-span IDs, complete required/preferred references, ANY construction, rejection of supplied IDs, overlapping spans, mixed-level alternatives and contradictory unresolved output. Existing extraction, worker, retry/budget and web handoff tests also pass. The focused subset passed 24 tests. Real calls were made only by the separate private trial, not the test suite.

Next, review and version the Hytec expected answer without rewriting this trial's score, expand the independently reviewed cases, and assess this requirement compiler together with a dedicated metadata extractor and semantic validation in a local shadow pipeline. Count the complete pipeline's calls/tokens. The remaining metadata omissions observed previously are still unresolved by this requirements-only work.

Automatic feed publication stays disabled. Original application routes remain the required destinations, and employer crawling remains optional and off by default.

See the [V1 experiment](19_REQUIREMENTS_STAGE_EXPERIMENT_2026-09-27.md), [frozen regression evaluation](18_RECENTJOBS_REGRESSION_EVALUATION_2026-09-27.md) and [pipeline runbook](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md).
