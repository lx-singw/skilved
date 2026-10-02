# Scoped requirement evidence and stricter audits — 3 October 2026

V12 adds narrow checks for standalone subjects, bounded behavioral lists, explicit final-submission conditions and caveated preparation passages. The audit now distinguishes preserved uncertainty from source wording wrongly promoted into a confirmed condition. These controls improve rejection and observability; **eight live extractions produced no full audit matches**. Automatic publication remains disabled.

## Implementation

`requirement-context.mjs` supplements the original evidence selector without modifying it. Standalone subject lines within recognized requirement sections get a subject-kind constraint. Nested subjects remain inside their qualification, including known ANY branches. The selector abstains on broader skills prose and subject lines outside bounded sections.

Explicit Behavioral/Attributes sections provide individual applicant attributes, with unstated mandatory/preferred status kept `unclear`. Section boundaries stop the list; None/N/A and quoted response-policy prose do not become attributes. Unbounded lists are not extended into an unknown footer. Preparation headings stop behavioral selection too.

An explicit application-is-only-complete-after-submission statement is a required document/submission condition. A preparation statement that explicitly refers to requirements from a previous intake creates a bounded unresolved scope through its dependent claims. An explicit subsequent section boundary or independently confirmed current application rule ends the scope. The exact caveat and dependent passage must remain one unknown node. An unknown scope rejects before model spending; the selector does not guess its extent.

The complete source partition and single-record V11 format remain. New stated evidence has mandatory condition roles, while caveated ranges have mandatory unresolved roles. Kind, level, exact evidence, alternative logic, partition and input limits remain enforced. Oversized newly selected evidence also rejects before spending. No rejected output is repaired or automatically retried within the extraction call.

The requirements/cache version is `recentjobs_requirements_v12`. V1–V11 retain explicit replay paths; offline checks confirmed unchanged V11 prompt/schema and payload hashes for all four prior candidates. The default single-stage worker remains unchanged, and split extraction stays shadow-only.

The evaluator advances separately to `recentjobs_evaluation_v3`. Two audit gaps were found during the fresh-notice review:

- An unresolved inventory passage retained only inside a stated condition now reports `SOURCE_AUDIT_UNCERTAINTY_LOST`, in addition to the existing review requirement. Unknown nodes and ambiguous/conflicting facts retain uncertainty; missing passages remain missing.
- Context lines copied into requirements or unknown nodes now report `SOURCE_AUDIT_CONTEXT_AS_REQUIREMENT`. This catches headings, employer context and placement explanations promoted into eligibility.

These are offline development checks against explicit inventories, not an independent production reviewer. They use exact source wording and do not prove semantic completeness. Historical V2 reports were preserved; saved responses were replayed under V3 into separately named reports, without changing expectations or making additional calls.

## Source discovery and frozen evaluation

The first trial reused the four V8 candidates and inventories. A robots-checked RecentJobs category request then selected two previously unused notices, both published on 15 September: Tronox and Cummins. They were newly fetched for this sprint, not newly published on 3 October. One explicit Tronox refetch retained the HTML that the initial failing parser attempt had not saved. In total there were one robots request, one index request and three detail requests, with pacing and bounded responses. No employer site was fetched.

Tronox was rejected before AI because its primary WordPress article contains a second nested article body with another `entry-content`. Selecting either body or mixing them would bypass the adapter's single-body assumption. The adapter remains strict; a synthetic regression now verifies rejection of that layout. No Tronox model request was made.

Cummins parsed into 27 lines. Its agent-authored inventory was frozen before generation: technical applicant capabilities and the explicit driving condition are preserved; future duties and promotion are excluded; conditional community preference and the ambiguously connected education alternatives remain unresolved. The extraction prompt was already frozen before this source review. The later evaluator fixes are development changes informed by the failures, so this is not an independently qualified benchmark.

The follow-up repeated Unique Personnel and ALPLA once each, and ran Cummins twice with identical frozen inputs. Each batch capped calls at four, for **eight total model requests**. Groq remained `openai/gpt-oss-120b`, low reasoning, maximum 3,072 completion tokens. There were no provider retries, repairs, fallback, metadata extraction, semantic-validation, database or publication calls.

| Request | Outcome | Reported tokens |
| --- | --- | ---: |
| Unique Personnel | Rejected overlapping/reordered source passages. | 3,644 |
| ALPLA | Decoded 17 conditions, including employer context promoted into eligibility; required documents had the wrong level. | 3,276 |
| Eskom YES | Retained the three behavioral conditions. Employment/study restrictions had wrong kinds, and placement context was promoted into a condition. | 3,372 |
| ACTOM preparation | Retained the exact previous-intake scope as unresolved and the final-submission condition as stated. Omitted the separately confirmed certified-document condition at line 27. | 3,211 |
| Unique Personnel repeat | Rejected selected evidence omitted from requirements. | 3,037 |
| ALPLA repeat | Again decoded 17 conditions with contextual material; qualification/exclusion kinds differed from the frozen expectations. | 3,583 |
| Cummins first | Decoded, but merged independent conditions with their heading, asserted a conditional preference as mandatory, and failed to retain the complete unresolved education passage. | 2,947 |
| Cummins repeat | Rejected an invalid source partition. | 2,903 |
| **Total** | **Five audit mismatches, three decoder rejections, zero full matches** | **25,973** |

All eight requests returned provider-accepted JSON and usage metadata. Completion counts include reasoning, which is not added again. Zero-call V3 replay reproduced both batches' counts. Replaying V11 with the stricter evaluator still gave its historical one match, two mismatches and one rejection. Repetition and the fresh source exposed continuing failures; no reliability or token-cost improvement has been established.

Plans, candidate/prompt/payload hashes, source snapshots, inventories, attempts, accepted responses, reports and separate V3 replays remain ignored under `.artifacts/groq/requirements-v12/`, `requirements-v12-fresh/` and `requirements-v12-followup/`. No credentials or rejected-generation text were added to tracked files.

## Verification and decision

The final catalogue suite passed **190 tests** with clean emulator shutdown. The focused run passed 55 tests. New coverage verifies scoped behavioral selection, standalone versus nested subjects, exact applicability boundaries, pre-spend rejection, uncertainty preservation, contextual content rejection, nested-body parser rejection and twelve-version replay. The earlier 188-test run passed before the final audit changes. Tests use simulated provider responses; live results above are separate evidence.

Keep the controls and the results in shadow development. Further prompt/checklist expansion alone has not established reliability. Next test the existing whole-source semantic validator against these saved failures, including invented eligibility, omission and uncertainty loss, before another extraction-format experiment. Then compare a bounded extraction strategy on frozen inputs and fresh notices. Qualification must include repeatability and end-to-end rejection behavior.

Publication, public reads and scheduling remain disabled. Employer crawling remains optional and off by default. Application destinations remain original employer/ATS/email routes, separate from aggregator attribution. No records were published.

The owner's sprint workflow is recorded in the repository's `AGENTS.md`: verify, commit and push completed sprints to main, while keeping private artifacts and credentials untracked.

See [V11 attached passages](29_ATTACHED_REQUIREMENT_PASSAGES_2026-10-03.md) and the [pipeline runbook](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md).
