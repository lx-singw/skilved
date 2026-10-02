# Requirements attached to source passages — 3 October 2026

V11 puts a condition's metadata on its classified passage. Code derives requirements and unknown evidence from that single list, removing V10's separate condition and unresolved-span lists. Four bounded live requests produced **one audit match, two audit mismatches and one decoder rejection**. All **180 catalogue tests passed**. Extraction remains unqualified for automatic publication.

## Contract and controls

The wire contains only `passages`. Each entry has an inclusive source `span`, a `role`, and `condition`. A condition passage carries `{kind, level, group, relation}`; all other roles carry `condition: null`. An unresolved passage directly creates an unknown expression node. The model cannot supply a second span, generated identity, quote, expression or publication field.

Passages must form an ordered partition of the entire numbered source. Gaps, overlaps, reordered ranges and a missing tail reject. Condition metadata is mandatory exactly when the role is `condition`. Code groups the attached conditions, rejects conflicting relations within a group, copies source wording and assigns stable identities. The existing compiler retains checks for bounded groups/items/expressions, exact selected evidence, known complete ANY alternatives, mixed alternative levels, promotions and unresolved audience/secondary evidence. Local unknown nodes still block publication.

Input bounds and the pre-spend selected-line limit remain enforced without truncation. The stage makes one bounded Groq request, with no local retries, repairs or fallback. Split worker use remains shadow-only; the default single-stage extraction path is unchanged. The requirements/cache version is `recentjobs_requirements_v11`.

Explicit V1–V10 replay paths remain available. Offline checks confirmed that all four saved V10 prompt/schema fingerprints are unchanged. Historical responses, expectations and reports were preserved.

This removes disagreement between independently generated lists. It cannot guarantee that Groq labels every real condition correctly. Complete partitions can still conceal conditions as context or attach an incorrect kind/level. Independent source inventories and whole-source semantic validation remain necessary.

## Bounded live evaluation

The trial used Groq `openai/gpt-oss-120b` with low reasoning and the existing 3,072 completion-token limit. It reused the four immutable V8 candidates and previously frozen agent-authored expectations, including the separately recorded ALPLA subject-classification revision. Eskom and ACTOM were fetched on 2 October; they were not newly fetched for this trial. These are reused development examples, not held-out or independently reviewed qualification evidence.

The harness froze candidate, prompt/schema and payload hashes before calling the provider. It reserved an exclusive private output directory, capped requests at four, paced requests and saved accepted responses before decoding. It made no website, employer, metadata, semantic-validation, database or publication calls. No failed request was repeated.

| Case | Result | Reported tokens |
| --- | --- | ---: |
| Unique Personnel | Decoded nine conditions with exact individual skills/profile spans and local audience uncertainty. Required Mathematics and English passages were retained but mislabeled `education` instead of `subjects`; the inventory and targeted checks rejected those kinds. Audience uncertainty independently requires review. | 3,199 |
| ALPLA | Decoded all four conditions and matched the frozen targeted requirements and complete source inventory, including the subject exclusion and required document condition. | 2,678 |
| Eskom YES | Decoded six conditions, including all three employment/study/previous-participation restrictions, and retained local audience uncertainty. Behavioral conditions at lines 21–23 were classified as context and omitted; the independent inventory rejected those omissions. | 2,857 |
| ACTOM preparation | Provider accepted JSON, but the decoder rejected the partition's missing line 59. Saved output also classified the application-completion passage at line 12 as context and upgraded previous-intake/preparation claims at lines 18–26 into confirmed conditions, despite the inventory requiring unresolved evidence across lines 17–26. These semantic problems remain separate from the partition error. | 3,312 |
| **Total** | **Four provider-accepted responses; three decoded; one full audit match** | **12,046** |

The first three sources had complete partitions covering their combined 117 lines. ACTOM's 118-line source did not have a complete partition. All four attached role/metadata records were internally consistent, so the previous separate-list synchronization errors did not occur in this trial. ACTOM demonstrates that partition reliability can still regress. There was no demonstrated token saving: V10's four requests reported 11,906 tokens.

Zero-call offline replay reproduced the live counts: one match, two mismatches, one rejection. Structural review also checked historical fingerprints and retained only line spans, labels, condition metadata and safe diagnostics. Private plans, hashes, attempts, accepted responses and reports are ignored under `.artifacts/groq/requirements-v11/`; no rejected-generation text or credentials were retained in tracked files.

ALPLA's passing requirements extraction does not establish a complete pipeline success or source qualification. Unique Personnel/Eskom's audience evidence remains intentionally unresolved under the existing conservative policy. Eskom and ACTOM also retain their normal worker preflight blockers: expired/unknown deadlines and unqualified/shortened application routes. None was published.

## Verification and next work

All **180 catalogue tests passed**, with clean Firebase emulator shutdown. The focused run passed 40 tests. Coverage includes single-record derivation, role/metadata consistency, partition gaps/overlaps, exact hinted evidence, alternative logic, group conflicts, input/expression bounds, omission detection by an independent inventory, publication rejection of unknown evidence and eleven-version offline replay. Tests use simulated provider responses; live results are reported separately. Syntax and diff-whitespace checks passed.

Keep V11 in shadow evaluation. The next work should address standalone-subject classification, behavioral/profile evidence outside recognized sections, and the applicability of caveated preparation claims. Evaluate those changes against frozen inventories, then use fresh held-out notices and repeated runs before considering automatic publication. A passing partition or one matching example must not substitute for that evaluation.

Publication, public reads and scheduling remain disabled. Employer crawling remains optional and off by default. Approved application destinations remain original employer/ATS/email routes, separate from aggregator attribution.

See [V10 whole-source accounting](28_WHOLE_SOURCE_ACCOUNTING_2026-10-02.md) and the [pipeline runbook](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md).
