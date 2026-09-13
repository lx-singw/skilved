# AI evaluation and model governance

Date: 11 September 2026. Status: target evaluation programme; no model is certified or benchmark winner by this document.

## Permitted initial AI tasks

Use models for bounded extraction, plain-language explanation, draft preparation and next-step suggestions based on attributable inputs. Use deterministic code for authentication, permissions, deadline arithmetic, exact filters, task state transitions, financial effects and execution authorisation. An agent is a persistent authorised workflow; its value is not the number of models or separate services.

## Task-specific evaluation

| Task | Desired output | Critical failure |
|---|---|---|
| Opportunity extraction | Structured source-supported facts, unknowns preserved | Invented deadline, fee, eligibility or application destination |
| Requirement explanation | Faithful understandable explanation with source | Meaning changed or uncertain requirement presented as disqualification |
| Evidence organisation | Correctly scoped claims and selected relevant material | Invented experience/assessment or unrelated private data included |
| Draft assistance | Editable accurate draft grounded in the user's record | Fabricated employer, grade, credential or achievement |
| Next-step guidance | Actionable bounded suggestion with uncertainty | Guaranteed outcome or unsafe/unauthorised action |
| Source-change summary | Exact relevant differences and revision links | Claims a change that did not occur or misses consequential change |

## Dataset design

Maintain versioned development and held-out sets with permitted/synthetic source material and provenance. Cover all six categories, ambiguous dates, missing benefits, WIL/graduate distinctions, duplicates, long/poorly formatted text, expired listings and source changes. Add adversarial instructions, malicious links and irrelevant private-context temptations. Keep benchmark content out of prompt tuning where it would invalidate hold-out evaluation.

The release policy proposes at least sixty held-out opportunity examples, ten per category, as an initial evaluation set. This is a starting release sample, not statistical proof of national correctness. Expand based on observed error classes and source diversity. Human labels require clear rubrics and adjudication of disagreements, especially consequential fields.

## Scorecard

Report critical-field correctness, unsupported-claim rate, noncritical extraction accuracy, schema validity, abstention, coverage, reviewer corrections, latency, retries and total cost including review. Do not improve apparent accuracy by excluding abstentions or failed calls from the denominator. Compare models on identical tasks and input policies; include a deterministic/manual baseline.

For consequential publishing, critical errors in the release sample require correction/retest and/or retaining human review for that path. A model's self-reported confidence is not a calibrated probability. Matching scores are not probabilities of selection. Human review is meaningful only when reviewers can inspect the source and reject the output.

## Model change record

Task; provider/model/version; prompt/template; tool/schema version; data categories sent; provider retention/training settings; evaluation dataset; results and failed cases; cost/latency; decision owner; rollout scope; rollback configuration. Record exact versions where the provider exposes them and note aliases that may change.

Use a staged rollout and inspect real error reports under the privacy policy. Do not send private production records to a new provider merely to compare models. A fallback provider must already pass data and quality review for the intended task.

## Bias and accessibility review

Check that names, writing style, gaps in employment and missing formal credentials do not silently become unsupported exclusion signals. Evaluate whether users can correct facts and understand explanations. Do not infer sensitive traits from profiles/photos or offer an opaque employer ranking of people. When later recommendations have consequential effects, conduct a dedicated impact review and maintain an appeal/correction path.

## Ongoing monitoring

Track errors by source, category, prompt/model version and task. Inspect model/provider changes, drift and repeated corrections. Quarantine unsafe task classes when needed; preserve reliable deterministic functions. Use user reports to improve fixtures without copying unnecessary personal material. Link harmful-action cases to the [threat model](../security/01_THREAT_MODEL.md) and release tests.
