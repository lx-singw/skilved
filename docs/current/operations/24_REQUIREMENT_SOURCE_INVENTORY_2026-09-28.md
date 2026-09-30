# Broader requirement audit — 28 September 2026

The saved V5 responses still pass the original four targeted checks. A separately versioned, agent-authored review of all **195 source lines** now passes Feltex and ALPLA and flags Hytec and Unique Personnel. The stricter result exposes omissions and classification problems that the narrower expectations missed. **No new Groq calls, website requests or production writes were made.** Extraction remains V5; this change is an offline evaluation improvement, not a fix to the missing runtime evidence.

## What changed

[Evaluation expectations](../../../packages/catalogue/src/ai/evaluation.mjs) now optionally specify requirement `kind`, in addition to wording, level and expression. `recentjobs_evaluation_v2` also accepts a `sourceAudit` inventory. Earlier manifests remain valid and retain their original targeted results.

The [source audit](../../../packages/catalogue/src/ai/source-audit.mjs) requires every line of the title plus source text to appear exactly once in the review. Missing lines, overlaps, duplicate IDs, invalid spans and incompatible labels reject the inventory. A reviewer classifies each span as:

| Treatment | Meaning and check |
| --- | --- |
| `preserve` | Applicant condition whose exact passage must be retained as stated evidence; optional kind and level checks also apply. |
| `context` | Reviewed context, headings, metadata or explained duplicate wording; not an additional requirement assertion. |
| `exclude` | Duties, promises or publisher content that must not become an applicant requirement. Each line is checked, so quoting part of a larger excluded block is caught. |
| `unresolved` | Passage whose interpretation remains uncertain. Its omission is reported separately, and retaining it does not automatically resolve the uncertainty. |

Each entry includes a rationale; the inventory records its reviewer category and review timestamp. These labels are reviewer judgments, not independent proof. `context` labels do not establish that metadata was correctly extracted elsewhere. This is a requirements audit, not verification of every field or the employer's claims.

The [CLI](../../../packages/catalogue/tools/evaluate-recentjobs.mjs) reports the evaluation version, expectation scope, targeted result and inventory result separately. It validates an inventory even when no response has been generated. All reports retain `qualification:false`; an inventory match cannot authorise publication.

## Review and replay

The original source hashes, response files and targeted expectation manifest were preserved. A new manifest and its review record were written under ignored `.artifacts/groq/source-inventory-v1/`. The review record links to the original manifest by SHA-256 and explicitly states `independentReview:false`.

| Notice | Original targeted checks | Broader inventory | Findings |
| --- | --- | --- | --- |
| Feltex | Match | Match | Complete qualification alternatives retained. Duties, benefits, social promotion and the publisher's explanatory caution stay outside entry requirements. |
| ALPLA | Match | Match | Four entry/document conditions retained with expected kinds. Programme duration and employer values are accounted for as metadata/role context, not newly invented eligibility. |
| Hytec | Match | Mismatch | Secondary `Grade 12 / National Certificate` passage omitted; its relationship to `Post-Matric / N3` remains unresolved. Overtime willingness was classified as `other` rather than the audit's `availability` expectation. |
| Unique Personnel | Match | Mismatch | Omitted the applicant-profile sentence, five Key Skills conditions and the announcement's unemployed-youth audience statement. The audience statement provides no numeric age bound or explicit hard-eligibility rule. |

Hytec's summary of completed theory and institutional training is explicitly accounted for as a duplicate of preserved requirements. Its separate education value is **not** silently treated as an equivalent qualification, an extra ALL condition or an alternative. Unique Personnel's skills/profile annotations require preservation with unclear level where hard eligibility versus preference is unstated; they do not invent mandatory thresholds.

An `unresolved` entry keeps an audit from passing even if its evidence is preserved. That distinguishes a faithful representation of uncertainty from a resolved, publication-ready requirement. The source's expired or unspecified closing dates also remain independent blockers; this audit does not override them.

## Reproduction

The private broader manifest can be replayed without credentials or network access:

```sh
node packages/catalogue/tools/evaluate-recentjobs.mjs --requirements .artifacts/groq/source-inventory-v1/manifest.json
```

Expected result for the saved V5 responses: two matches, two mismatches, exit code 1. The original targeted manifest under `.artifacts/groq/requirements-v5/manifest.json` still gives four matches, exit code 0. Reports identify both extraction and evaluation versions and hash the manifest, responses and selected prompt/schema.

New synthetic tests exercise omitted skills and secondary tables, requirement kinds, unclear levels, partial excluded-block leakage, unknown evidence, inventory gaps/overlaps and CLI reporting. They also ensure an unresolved source judgment cannot become a passing result merely because its text was retained. Real source text and provider outputs remain ignored artifacts.

The full catalogue suite passed **141 tests**. The first run's test command succeeded but Firebase timed out during shutdown; one retry passed all 141 tests and exited cleanly with emulator shutdown complete. No application code was changed to work around that transient CLI cleanup failure.

Next: extend extraction to preserve applicant-profile/skills passages and secondary-table claims, including their uncertainty, then rerun this broader inventory before spending calls on fresh notices. The inventory itself is agent-authored development evidence and still needs independent review and held-out cases before production qualification. Production publication and scheduling remain disabled. Employer crawling stays optional and off by default.

See the [targeted V5 experiment](23_REQUIREMENT_LAYOUT_AND_ALTERNATIVES_2026-09-28.md) and [pipeline runbook](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md).
