# Structured requirement review — 3 October 2026

The new development reviewer inventories the source without seeing extracted claims, then compares each claim and source condition in code. It replaces the approval boolean in this diagnostic path with explicit evidence and structure checks. **It is not qualified for production:** both ALPLA controls were rejected against the frozen expectations, one repeat promoted post-selection behavior into entry conditions, and Eskom exhausted the completion budget. Automatic publication, public catalogue reads and scheduling remain disabled.

Six bounded Groq calls reported **23,930 tokens**. Five inventories decoded; Eskom returned an incomplete response at the existing 3,072-token completion limit. The resulting seven comparisons agreed with five expected rejection decisions and disagreed with both positive controls. Those five rejection agreements are not five accurate inventories. Source audits matched the retained evidence and uncertainty for ACTOM's two runs; the other three decoded inventories had fidelity issues. No expectations were rewritten from these outputs.

## Implementation and scope

`packages/catalogue/src/ai/structured-requirement-review.mjs` uses version `recentjobs_requirement_review_v1`. Its provider payload contains only numbered source lines and existing deterministic source hints. Extracted requirements, application candidates, evaluation expectations and record approval fields are excluded. The schema and compiler reuse the bounded V12 passage representation, with a distinct reviewer prompt and version. Each source line must belong to exactly one ordered passage; source constraints, caveated scopes and exact quotes remain enforced.

The model identifies source conditions and unresolved scopes; it does not return `supported`. Code produces checks for every extracted claim and every source condition or unresolved scope, exposing unexpected claims, missing conditions, classification/level/state mismatches, duplicate or partial evidence, lost uncertainty and logic differences. Evidence must match an entire uniquely located passage. Conditions with different spans are conservatively treated as different claims. Exact evidence alone does not establish semantic equivalence.

Logic comparison permits changed local IDs, reordered children and nested identical ALL/ANY operators. It does not equate different operators, discard multiplicity or attempt distributive rewrites. IF structures can be compared, but source logic that the attached-passage inventory cannot represent must remain unresolved. Verbatim requirement values are accepted by this diagnostic; paraphrased descriptions and structured qualification/document values require a separate semantic assessment.

`supported` is computed from comparison issues. `needsReview` separately marks retained source uncertainty: a faithful unknown can match without becoming publishable. Results explicitly carry `scope: requirements_evidence_and_structure` and `qualification: false`. They do not assess metadata, dates, summaries, application authenticity or the full opportunity record.

Saved inventories bind to the source payload and exact contract hashes. The combined review API validates claims before spending and can reuse a bound inventory without credentials or another model call. Invalid local inventories retain billed usage and are not retried. The live development runner saved provider-accepted inventories privately before decoding, so accepted structural failures can be inspected without retaining provider-rejected generation bodies.

The worker's full V6 validator, requirements extraction versions, source grants, model settings and caches are unchanged. This reviewer is not wired into the worker. Employer crawling remains optional and off by default; original employer/ATS/email destinations remain the application handoff policy.

## Frozen trial

The five inputs came from the preceding [validator challenge sprint](31_WHOLE_SOURCE_VALIDATOR_CHALLENGES_2026-10-03.md). Full ALPLA inputs were projected into requirements-only inputs; their original input hashes were retained. The blind ALPLA source inventory was reused against both controls, so a good/bad pair did not require two reviewer calls. The six-call plan, contract/source hashes, expected decisions and defects were frozen before spending. Calls used `openai/gpt-oss-120b`, medium validation reasoning, the existing completion limit, no fallback and no retries. No websites, employers or production data stores were accessed.

| Source review | Result | Reported tokens |
| --- | --- | ---: |
| ALPLA first | Four conditions. Employer/role context stayed outside the inventory, but the document level was `unclear` rather than the frozen `required`. The passing control was rejected; the bad control was also rejected. | 4,119 |
| Eskom | Incomplete provider response; all 3,072 completion tokens consumed. No valid inventory or semantic decision. | 4,701 |
| ACTOM first | Two current submission/document conditions. Both audience uncertainty and previous-intake scope retained. The missing line-27 documents were correctly exposed. | 4,213 |
| Cummins | Independent skills/driving conditions and the unresolved education scope were retained. The bad extraction's merged conditions and missing uncertainty were exposed. However, line 17 was treated as a stated preferred condition rather than retaining the frozen conditional uncertainty. | 3,207 |
| ALPLA repeat | Five conditions, including one merged lines-9–21 post-selection values/behavior passage that the frozen audit classifies as context. The document level was corrected, but the good control was still rejected. Rejection of the bad control does not demonstrate correct context classification. | 3,630 |
| ACTOM repeat | Repeated the first run's two conditions and retained uncertainty. The missing documents were again exposed. | 4,060 |

The negative ALPLA input's document level is **preferred**; the first source inventory chose **unclear**, and the repeat chose **required**. Both differences trigger a comparison issue, but only the repeat matches the frozen source classification for that document. Its separate context error still invalidates the inventory.

The source audits are existing agent-authored development expectations, not independent qualification. In particular, ALPLA's successful-candidate values/behavior paragraph is classified as post-selection context in the frozen inventory. Agreement or disagreement with that label must not be presented as proof about the employer's actual screening rules. The boundary between entry eligibility and ongoing employment expectations needs an explicit, consistently applied product policy.

## Offline replay and verification

```bash
node packages/catalogue/tools/evaluate-structured-review.mjs <manifest.json>
```

The manifest uses version 1, purpose `development_structured_requirement_review`, `qualification: false`, and cases with `id`, `expectedSupported`, `input`, `inputSha256` and `inventory`. Each input contains `candidate` and canonical `requirements`; the inventory is the bound review envelope. The CLI makes no model/network/database calls, does not read credentials, and outputs counts, comparison codes, spans and hashes without source quotes or model reasons. Input changes, unsupported versions/contracts and missing inventories remain invalid or unavailable. It explicitly requires a separate audit for inventory accuracy.

Private artifacts are in ignored `.artifacts/groq/structured-review-v1/`: frozen manifest/inputs, one-time run plan, five accepted inventories, error/usage results, source-audit report and offline reports. Replay reports five decision matches, two mismatches and one unavailable inventory. Eskom's unavailable inventory corresponds to a paid incomplete call, not an unattempted case.

The final catalogue suite passed **207 tests** with clean Firebase emulator shutdown. New tests cover blind payloads, per-claim/per-source accounting, missing documents, context additions, uncertainty, semantic-value abstention, logic differences, duplicate/partial evidence, source/contract binding, pre-spend claim rejection, credential-free reuse, billed local failures and private offline replay. An earlier full run passed 206 tests before the combined API test was added. Whitespace and staged secret checks passed.

## Next step

Define and test the entry-eligibility versus post-selection behavior policy, then represent applicability and requirement strength explicitly in the source review. Address the completion-budget failure without silently truncating source coverage. Freeze the revised contract and expectations before another capped repeated/held-out trial. Require repeatable positive controls and accurate inventories, not merely rejection of negative examples, before integrating any replacement validator into the worker or publication.
