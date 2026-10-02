# Whole-source accounting — 2 October 2026

The requirements stage now requires an ordered passage classification covering every source line exactly once. Conditions and unresolved evidence must agree with that classification. In the final V10 trial, all four model responses partitioned all **235 lines** correctly, but **none passed the full extraction audit**: three failed decoder checks and ALPLA failed classification/level checks. These results support the new rejection controls, not production qualification.

## Contract and compilation

Each `passages` entry contains an inclusive source span and one of `condition`, `context`, `duties`, `promotion` or `unresolved`. The partition starts at line 1, ends at the source's final line and has no gaps, overlaps or reordered ranges. Contiguous lines can share a classification.

The wire also supplies condition `groups` and `unresolvedSpans`. Every condition line must occur exactly once in a group item, and every unresolved line exactly once in an unresolved span. Items cannot cite context, duties or promotions. Missing condition items, missing unresolved evidence, contradictory roles and overlapping evidence fail before mapping. Code assigns IDs and copies source wording without rewriting it.

Clearly stated conditions use group items; an unstated required/preferred level stays `unclear` without making the condition itself ambiguous. Unresolved source passages become local unknown expression nodes alongside the retained clear items. Such nodes block publication, so an ambiguous audience statement does not need to downgrade every other qualification to ambiguity. Genuine conditional or preparation guidance stays unresolved rather than receiving an invented eligibility relationship.

Known requirement sections and evidence hints remain minimum checks. Selected lines cannot be dismissed as context. Hinted skills/profile lines retain exact individual spans and hinted levels/kinds; ambiguous audience/secondary-table evidence stays unresolved. `fixedRoles` restates mandatory audience/promotional classifications explicitly in the payload. Known complete qualification alternatives must retain exact branch spans in a single ANY group; mixed required/preferred alternatives are rejected.

Input is bounded at 160 lines and 96 KB, with the existing maximum of 40 selected requirement/evidence lines retained before provider spending. Oversized sources are rejected, never truncated. Item, group, expression, source span and quote bounds remain enforced. One bounded Groq request has no local retry, repair or provider fallback. Split worker execution remains shadow-only and the normal single-stage default is unchanged.

Full bookkeeping does not prove correct meaning. A model can still label an unrecognized applicant condition as context. A test explicitly demonstrates that the independent source inventory catches such an omission even when the partition and decoder checks pass. Whole-source semantic validation and source audits remain necessary.

V1–V9 formats have explicit historical replay paths. V10 changes the requirements/cache version. The prior V8 implementation is preserved, along with its results. No historical responses or expectations were rewritten.

## Trials and diagnostic follow-up

Both four-call trials used Groq `openai/gpt-oss-120b` at low reasoning on the same frozen Unique Personnel, ALPLA, Eskom YES and ACTOM preparation sources from V8. They reused the previously reviewed inventories and revised ALPLA subject expectation. They made no website, employer, metadata, semantic-validation, database or publication calls. These are now reused development cases, not fresh or independently qualified examples.

V9 used a fixed-length positional `lineRoles` array. Unique Personnel and ALPLA failed provider JSON/schema validation; ACTOM's rejected generation was not valid JSON. Eskom returned accepted provider output, but the decoder rejected omitted selected audience evidence. All four cases were rejected. The one response with usage reported 2,542 tokens; usage for the three provider rejections was unavailable. Diagnostics did not establish a single common cause for those provider failures.

A separate one-call V9 diagnostic repeat returned accepted provider JSON, retained the skills, but failed the application decoder because it marked a policy-constrained audience statement as resolved. Its saved accepted response reported **2,939 tokens**. The diagnostic harness originally reported null usage on that subsequent local error; the structural review records the correction from saved provenance. No rejected-generation text was retained.

V10 uses explicit ordered passage spans instead of positional labels. All four requests returned accepted provider JSON and correct complete partitions:

| Case | Partition | Final result | Tokens |
| --- | --- | --- | ---: |
| Unique Personnel | All 35 lines | Decoder rejected the five individually selected skills merged into one span `[23,27]`. Its qualification/subject block was also merged with unclear level in the saved output. | 3,063 |
| ALPLA | All 48 lines | Decoder accepted four items; broader audit rejected the exclusion kind and the required document condition's level. | 2,514 |
| Eskom YES | All 34 lines | Decoder rejected an unresolved span citing a line classified as context. Offline inspection also found a condition-tagged line with no item. | 2,842 |
| ACTOM preparation | All 118 lines | Decoder rejected condition-tagged lines 16–17 without corresponding items. | 3,487 |
| **V10 total** | **235 lines** | **Three decoder rejections, one audit mismatch** | **11,906** |

There were **nine new model requests**: four V9, one diagnostic repeat, four V10. They reported **17,387 tokens**, with usage unavailable for three provider-rejected requests. Each experiment had its own explicit cap and no request was automatically retried. The V10 change did not resolve classification accuracy or repetition reliability.

Ignored evidence is in `.artifacts/groq/requirements-v9/`, `.artifacts/groq/unique-v9-diagnostic/` and `.artifacts/groq/requirements-v10/`. Frozen manifests, candidate/prompt/payload hashes, attempts, accepted responses, live results, offline reports and the safe structural inspection remain private. Structural inspection makes zero model calls and reports line numbers/role conflicts rather than source text.

Provider diagnostics now also report bounded array cardinality errors using schema-owned paths and counts. They retain no input values or arbitrary input keys, and remain a partial structural inspection rather than a complete validator. This does not reinterpret an error as a successful extraction.

## Verification and decision

All **171 catalogue tests passed**, including ten-version replay fingerprints, exact source partitions, omitted/overlapping evidence, role contradictions, complete qualification alternatives, local unknown evidence, publication rejection, pre-spend input bounds and diagnostic privacy. The focused final run passed 50 tests. Firebase emulator shutdown was clean. An earlier full run exposed a missing pre-spend selected-line bound; that bound was restored and verified by the final suite. Tests make no live provider calls.

Keep V10 in shadow evaluation. The next simplification should make a condition or unknown passage's classification and extracted metadata one record, so the model does not have to synchronize separate passage, condition and unresolved lists. Preserve exact spans, independent review of classification/levels, known alternative logic and publication gates. Do not weaken the checks merely to accept these outputs.

Production publication, public reads and scheduling remain disabled. Employer crawling remains optional and off by default. Original employer/ATS/email routes remain the only approved application destinations. No records were published.

See [V8 omissions](27_COMPACT_REQUIREMENT_TASKS_2026-10-02.md) and the [pipeline runbook](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md).
