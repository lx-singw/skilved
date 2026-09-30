# Requirements-only extraction experiment — 27 September 2026

**Decision: retain this as a development experiment; do not enable it in the worker.** A smaller extraction task resolved the observed ALPLA requirement errors once, but only one of four frozen development cases matched every check. This does not establish reliable automatic publication.

## Implementation

The [requirements adapter](../../../packages/catalogue/src/ai/requirements.mjs) uses Groq GPT-OSS 120B with low reasoning, the existing 3,072 output-token cap and one request per invocation. Its version is `recentjobs_requirements_v1`. Input retains the entire numbered notice and coverage/promotion hints; application destinations are excluded because this stage does not select or verify routes. Output contains only requirement items and their expression. Conditions retain their exact source wording, including single-line compound alternatives, exclusions and document instructions.

The full and experimental adapters now share the same bounded span/logic decoder. Duplicate passages, invalid references, unsupported syntax and excessive nesting remain rejected. The experimental wrapper also applies explicit-section coverage and promotion checks. No silent repair, model fallback, retry, metadata merge or publication was added. The full extractor's prompt/schema hash and replay results were verified unchanged by the refactor.

The [offline evaluator](../../../packages/catalogue/tools/evaluate-recentjobs.mjs) now accepts `--requirements`. Reports explicitly say `scope: requirements_only` and `qualification: false`; a match does not cover employer, dates, location, compensation, route, availability or semantic validation.

## Four-call trial

Each frozen source was used once under the same unchanged prompt/schema. Requests were spaced by 30 seconds after the preceding call. There were no retries, employer requests or database writes. Private request reservations, responses and per-case outcomes are in ignored `.artifacts/groq/requirements-v1/`. The exclusive trial directory prevents accidental repetition of the private batch script.

| Case | Result | Input tokens | Output tokens, including reasoning | Total |
| --- | --- | ---: | ---: | ---: |
| Feltex | Rejected: invalid conditional and changed alternative logic | 1,250 | 606 | 1,856 |
| ALPLA | Matched frozen requirement text, levels and expression | 1,265 | 544 | 1,809 |
| Hytec | Rejected: two preferred items were omitted from the expression | 1,510 | 908 | 2,418 |
| Unique Personnel | Structural review required: three expected conditions were retained together in one verbatim item | 1,299 | 279 | 1,578 |
| **Total** | **4 calls; 1 strict match** | **5,324** | **2,337** | **7,661** |

ALPLA retained Mathematics Literacy's exclusion as stated, the N3 requirement and the combined document condition as required, without duplicate spans. This is one development success, not a repeated or held-out result.

Feltex produced `if(r4,none,all(r1,r2,r3))`: `none` is unsupported in the then branch, and ALL does not preserve the source's three qualification alternatives. Its extra condition came from a later advisory passage. Hytec preserved the twelve selected passages and their required/preferred levels, but referenced only the ten required items; canonical records reject unreferenced items because they can disappear from rendering. Unique Personnel preserved the expected words together; the comparator could not establish equivalence with the expected three-item tree. Do not report that last case as an observed omission or semantic error.

The requirements-only ALPLA call used 1,809 tokens versus 4,704 for the preceding full extraction, but these tasks have different scope. A split production pipeline still needs metadata extraction and semantic validation, so no end-to-end saving is established. The prior saved full ALPLA response also omitted the stated city and compensation; fixing requirements alone would not make that whole record complete.

## Reproduction

Replay the saved trial without credentials or model calls:

```sh
node packages/catalogue/tools/evaluate-recentjobs.mjs --requirements .artifacts/groq/requirements-v1/manifest.json
```

The expected exit code is 1, with one match, one structural mismatch and two rejections. The report's `newModelCalls: 0` refers to replay, not the four generation calls above.

To make one experimental request from a permitted saved HTML notice, use the existing extraction manifest format (`sourceId`, `url`, `htmlPath`):

```sh
node --env-file=.env.local packages/catalogue/tools/extract-recentjobs.mjs --requirements <manifest.json>
```

This requires explicit Groq opt-in and consumes quota. It prints a private report; keep redirected output in ignored `.artifacts/`. It does not fetch websites, schedule, initialise Firestore or publish. The worker continues to use the full extractor.

## Next design step

Move item identity and reference bookkeeping into deterministic code, then constrain the model's choices over source-backed groups. This targets the failure modes observed here instead of relying on more prompt instructions. Preserve explicit alternatives and preferred levels, and retain an unresolved path for genuine ambiguity. Evaluate representation equivalence separately from missing or changed conditions; the current strict comparator intentionally requests review for grouping differences.

Keep these cases as development regressions. Further qualification still needs separately reviewed expectations, fresh cases, original email/submission methods, repeated runs under a frozen version and end-to-end token/call accounting. Production publication stays disabled; employer crawling remains optional and off.

Validation: the full catalogue suite passed **111 tests** with exit code 0. Focused CLI/extraction/evaluation tests also passed after exposing the experimental CLI flag. Tests cover the small schema, absence of route URLs from model input, exact compound/exclusion wording, mandatory/preferred mismatches, duplicate rejection with retained usage, coverage, promotions, bounded grammar, and disabled-mode refusal before reading files or making requests. No online calls occur in the test suite.

See the [frozen regression evaluation](18_RECENTJOBS_REGRESSION_EVALUATION_2026-09-27.md) and [live shadow report](17_RECENTJOBS_LIVE_SHADOW_2026-09-27.md).
