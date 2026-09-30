# Mandatory requirement coverage — 28 September 2026

The shadow requirements stage now creates a required response field for every condition line in an explicitly bounded requirements section. ALPLA's previously omitted Mathematics Literacy exclusion was retained in two fresh Groq responses. The repeat also passed semantic validation when combined with saved metadata from the identical source. **The broader experiment is not ready for production:** only one of four development cases matched its frozen expectations, compared with three under V2.

## Implementation

The [requirements adapter](../../../packages/catalogue/src/ai/requirements.mjs) now uses `recentjobs_requirements_v3`. Its candidate-specific schema requires `coverage.L<number>` fields selected by the existing conservative section detector. Each field must describe a verbatim span containing that exact line. Missing keys, null fields in resolved output and spans pointing elsewhere fail. Conditions elsewhere in the notice still require model extraction into `additional`; coverage is not a universal completeness guarantee.

For a qualification spanning several lines, each corresponding field repeats the same descriptor. Code checks agreement and emits one condition, preserving its subject list. Distinct overlapping spans, duplicate additional conditions, inconsistent group relations and mixed required/preferred alternatives fail. Code assigns IDs and references as before; it never appends omitted conditions as mandatory ALL branches. Group meaning and requirement classification still need semantic validation.

Actual unresolved logic uses null coverage fields, no additional conditions and an explicit unresolved span. The span must cover the section; the resulting unknown expression cannot pass the worker's material checks. More than 40 coverage lines fails before a provider request. Existing input, output, group, item and expression bounds remain.

V1 and V2 decoders remain available for explicit offline replay. There is no automatic generation fallback. The [offline evaluator](../../../packages/catalogue/tools/evaluate-recentjobs.mjs) selects the decoder by response version and reports a prompt/schema hash per case, since V3 schemas differ by candidate. Split worker cache keys include the new version, preventing reuse of V2 requirements as V3 results. Split processing remains restricted to shadow mode; employer crawling stays optional and off by default.

## Frozen development trial

The original four source files and expectation hashes were retained. These are agent-authored development cases, not independently labelled or held-out qualification data. All requests used Groq `openai/gpt-oss-120b`, low extraction reasoning, the same V3 prompt and a four-call cap. No new website retrieval or employer crawl occurred.

| Case | Outcome | Reported tokens |
| --- | --- | ---: |
| Feltex | All passages retained, but Grade 12 made mandatory alongside N3/NCV alternatives; frozen logic mismatch | 2,309 |
| ALPLA | All four conditions and ALL logic matched, including the negative exclusion | 1,996 |
| Hytec | Provider returned `json_validate_failed`; no accepted response | Not reported |
| Unique Personnel | Empty coverage and additional arrays; canonical decoder rejected empty requirements | 1,767 |

The provider failure was not retried in this trial. Unique Personnel has no section recognized by the conservative coverage detector, illustrating the remaining need to inspect the entire notice. Feltex's mismatch was caught by the offline expectation comparison; this trial did **not** establish that the online semantic validator would catch it.

Private evidence: `.artifacts/groq/requirements-v3/` contains attempts, available responses, the unchanged expectation manifest and reports. The offline report rejects Hytec's absent response file; its provider failure is recorded separately in the live trial report. Replaying saved V2 outputs still gives three matches and the existing Hytec review mismatch, with all four correctly marked as historical versions.

## ALPLA repeat and validation

Two additional calls were allowed: one fresh V3 requirements extraction and, only after a match, one semantic assessment. The repeat retained all four conditions and matched the frozen expectation. Its metadata came from the earlier successful metadata call; candidate SHA-256, source content hash and text were checked against that saved run. Mapping, material checks and the registered issuer/original-route check passed before semantic validation.

The medium-reasoning validator returned `supported=true` with no issues. This is a repeated requirements result plus fresh validation using cached metadata, **not** a fresh three-stage end-to-end extraction or independent evidence of model accuracy.

| Request | Reported tokens |
| --- | ---: |
| ALPLA repeat requirements | 1,988 |
| ALPLA semantic validation | 4,726 |
| **All six calls this iteration** | **12,786 reported; Hytec usage unavailable** |

Output token counts already include reasoning. Saved metadata usage is historical and excluded from the new-call total. Private evidence: `.artifacts/groq/coverage-v3-followup/`.

An isolated worker replay then used the repeat requirements, new semantic assessment, saved metadata and matching archived HTML. It produced **one `shadow_pass`, one private draft and zero public records**, retaining the exact original ALPLA ATS URL. It made zero new model calls and zero live website requests. Its three model-call ledger entries are replayed stage usage, not new spend. Private evidence: `.artifacts/groq/coverage-v3-worker-replay/report.json`. The local emulators shut down after completion.

## Verification and next step

The full catalogue suite passed 127 tests. A subsequently added offline compatibility test also passed with the six-test evaluation suite. New coverage includes required keys, omitted/null/misdirected conditions, multi-line ANY branches, preferred conditions, duplicate/overlap conflicts, unresolved logic, conditions outside explicit sections and pre-request limits. Versioned replay tests cover all three response formats and per-case schema fingerprints. Tests make no live provider calls.

This change addresses omission within recognized sections, but its four-case result regressed overall. Keep it confined to shadow evaluation. Next, resolve the explicit alternative-grouping regression and the empty extraction on notices without recognized sections, then rerun the frozen corpus before evaluating new held-out notices. Production publication and scheduling remain disabled.

See the [previous split pipeline results](21_SPLIT_SHADOW_PIPELINE_2026-09-28.md) and [pipeline runbook](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md).
