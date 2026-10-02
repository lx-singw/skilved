# Compact requirement tasks — 2 October 2026

V8 separates supplementary evidence from the main requirement descriptors. In a frozen four-request trial, all four responses passed schema/decoder checks and Unique Personnel retained its seven previously omitted evidence entries. **Only ALPLA matched the broader source audit.** Unique Personnel marked clear requirements uncertain; two newly fetched notices omitted conditions outside the selected tasks. The format is an experiment in the shadow-only split pipeline, not publication qualification.

## Contract and retained checks

The prior V7 response required span, group and relation on every supplementary line even though code already constrained them to an exact single-line span and an independent ALL relationship. V8 asks for only `kind`, `level` and `state` in a mandatory `evidence` object. Its keys and exact source text are also supplied explicitly as `evidenceTasks`. Code reconstructs the previously enforced spans and grouping; it does not supply missing classifications or resolve ambiguous evidence.

Main descriptors remain in `coverage`, with an explicit `coverageTasks` checklist. They still carry their spans and ALL/ANY grouping. Known alternative qualifications retain their full subject continuations, exact spans and reserved ANY groups. Additional applicant conditions elsewhere in the notice must still be extracted in `additional`. The new instruction states the reviewed convention: standalone subject acceptance/exclusion is `subjects`; a qualification including subjects is `education`.

Missing/null evidence, invented mandatory skills, resolved ambiguous audience/secondary education, duplicate/overlapping passages and misuse of reserved alternatives remain rejected. Genuine unresolved logic must cover all selected lines and has no additional items; code emits an unknown expression and blocks publication. Evidence descriptors need not all pretend to be ambiguous to represent unresolved overall logic. Supplementary-only cases have an explicit empty main coverage object. Notices without any recognized main or supplementary evidence still select the group format before the single provider call.

V1–V7 schemas, instructions and decoders remain available for explicit historical replay. V8 changes the split extraction/cache version. The normal worker's single-stage default remains as before, and split execution still enforces shadow mode. Employer crawling is optional and off by default. Application destinations must remain original employer/ATS/email routes; aggregators and shortened URLs are not approved handoff destinations.

## Frozen trial and source inventory

The trial used Groq `openai/gpt-oss-120b`, low reasoning and a four-call cap, with no retries. It reused frozen Unique Personnel and ALPLA candidates and the explicitly revised ALPLA subject expectation. It also checked robots rules and fetched the RecentJobs apprenticeship index plus two previously untested articles. These were fresh fetches of articles dated 19 and 17 September, not newly published October adverts. No employer or application destination was fetched.

Before generation, the contract, payload/candidate hashes and full source inventories were saved. Agent-authored inventories account for all **235 source lines** across the four notices. The two previously untested cases were reviewed before seeing their model outputs, but this is still an agent review with no independent human qualification. No expectations were changed after generation.

| Case | Accepted structure | Broader result | Tokens |
| --- | --- | --- | ---: |
| Unique Personnel, reused | Yes; seven of seven selected evidence passages retained | All ten items were ambiguous, including explicit qualifications. Required levels and subject kinds were not faithfully classified. | 3,510 |
| ALPLA, reused | Yes | Four conditions retained; subject exclusion classified `subjects`; matched the revised inventory and requirement tree. | 2,462 |
| Eskom YES X50, previously untested | Yes | Main citizenship, age and qualification conditions retained. Three negative employment/study/previous-participation conditions and three behavioral attributes outside the checklist were omitted. Audience uncertainty retained. | 2,405 |
| ACTOM 2027 preparation article, previously untested | Yes | Audience retained, but submission completion and certified-document conditions were omitted, as was the caveated preparation passage. | 2,419 |
| **Total** | **Four decoded responses** | **One match, three mismatches** | **10,796** |

Three decoded outputs retain uncertainty and are not publishable. ALPLA passed this requirements-only audit; its full publication path was not tested here. A successful schema check establishes structural compliance, not complete source interpretation. The model still ignored unselected content despite a whole-notice instruction; this is a generalization failure beyond the initial missing-field problem. The Unique Personnel result also shows that retaining text can coexist with excessive uncertainty and incorrect classification.

The newly fetched notices would be rejected by normal worker preflight before model spending: Eskom closed on 22 September and is a YES/internship listing; ACTOM has an unknown deadline and a `lnkd.in` application anchor. Exact issuer relationships are also not qualified by this experiment. The four model calls were standalone requirement-stage development tests, not normal worker ingestion, metadata/semantic validation or an end-to-end feed trial.

Private evidence is in ignored `.artifacts/groq/requirements-v8/` and `.artifacts/groq/requirements-v8-fresh/`. The live harness initially passed full extraction expectations to the strict requirements-only evaluator, causing a local scoring exception after each saved response had decoded. Its original report misleadingly labels those results `TRIAL_FAILED`. This harness error was corrected, and saved responses were rescored offline without further model calls. `replay-report.json` and `offline-report.json` contain the reported one-match/three-mismatch results. The original harness report is preserved and is not evidence of provider rejection. No raw rejected generation or credentials were retained.

## Verification and decision

All **158 catalogue tests passed** with clean emulator shutdown. The focused extraction/evaluation run passed 33 tests. A final additional availability/secondary-education test passed with all eight compact-task tests; no runtime code changed after the full-suite pass. Verification includes eight-version replay fingerprints, exact evidence reconstruction, preserved ANY branches, missing-entry rejection, duplicate prevention, uncertainty/material gates and supplementary-only output. Tests make no live provider calls.

Keep V8 restricted to shadow evaluation. It improves selected-entry retention in one observed Unique Personnel request and fixes ALPLA's classification in one request, but does not establish repeatability or adequate whole-source extraction. The next contract should explicitly account for every source line or passage, including classification as applicant condition, context, duties, promotion or unresolved evidence. Validate its source coverage and uncertainty decisions before running further pilot publication work. Adding more heading patterns alone cannot establish completeness.

Automatic publishing, public catalogue reads and scheduling remain disabled. This experiment publishes no records.

See [provider output diagnosis](26_PROVIDER_OUTPUT_DIAGNOSIS_2026-09-29.md), [source inventory methodology](24_REQUIREMENT_SOURCE_INVENTORY_2026-09-28.md) and [pipeline runbook](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md).
