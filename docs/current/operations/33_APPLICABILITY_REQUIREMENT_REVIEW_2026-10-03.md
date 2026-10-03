# Applicability and strength review — 3 October 2026

The development reviewer now states whether a passage concerns entry criteria, post-selection conduct, employer obligations, preparation, conditional evidence or ordinary context. Source-derived rules enforce several narrow applicability and strength constraints. **Production publication remains disabled:** the fresh Sappi control/challenge pair passed, but five of six inventories failed local checks, including both ALPLA reviews.

All six Groq responses completed within the unchanged **3,072 completion-token cap**, reporting **21,432 total tokens**. No response was truncated or rejected by the provider. Five provider-accepted inventories were rejected locally; those failures are neither semantic rejection decisions nor passing reviews. Only Sappi reached canonical comparison. The final catalogue suite passed **215 tests**.

## Entry policy

Requirements describe criteria for selecting applicants or completing the current application. Qualifications, restrictions, selection skills and applicant attributes remain visible even when located under Job description. Work, training and conduct expected after appointment remain source context outside entry eligibility. Employer-provided training, equipment and future trade-test preparation do not become qualifications that applicants must already hold.

Unstated strength is separate from unclear applicability. A bounded ideal-candidate profile or Behavioral/Attributes list does not automatically establish mandatory eligibility. Explicit mandatory or advantageous wording is retained. An inline preference for school subjects remains verbatim within its qualification; it does not make every subject mandatory or make the entire qualification preferred.

Submission/consideration gates are mandatory document conditions when clearly stated in a Requirements list, including CVs accompanied by results/certificates being considered. Conditional preferences dependent on project agreements remain unresolved. Previous-intake preparation keeps its caveat and dependent claims in one unresolved scope; separately confirmed current application instructions remain conditions.

These are explicit product interpretation rules, not proof of an employer's actual screening policy. The expectation inventories remain agent-authored development judgments and are not independent source qualification.

## Implementation

`requirement-review-policy.mjs` exposes policy `entry_applicability_v1`. It derives narrow constraints from the source, without employer-name matching or evaluation expectations:

- A bounded selected/successful-candidate identity/values passage becomes post-selection context. Unbounded or conflicting scopes stop before spending.
- A preference that may apply where/if external obligations require it retains conditional uncertainty.
- A document consideration gate within a bounded Requirements list retains mandatory document strength.
- An exact ideal-candidate list introduction is a heading; its bounded entries retain their own wording and explicit or unstated strength. A complete profile sentence remains evidence rather than being discarded as a heading.

`applicability-requirement-review.mjs` uses version `recentjobs_requirement_review_v2`. Each ordered source passage includes applicability plus nullable kind, strength, group and relation fields. Current conditions require all four metadata fields; other passages require all four to be null. Code maps mandatory/advantage/unstated to required/preferred/unclear, and maps preparation/conditional/uncertain to canonical unknown scopes. Exact policy scopes and document constraints are checked before canonical compilation. Conflicting metadata is rejected rather than silently discarded.

The reviewer remains blind to extracted claims, gold inventories and application destinations. Inventories bind to source and contract hashes; those hashes detect drift, not provenance authenticity. The comparison logic is shared with V1, while its prompt, schema, source selector and binding hashes remain unchanged. The offline tool dispatches saved V1 or V2 inventories explicitly.

The new diagnostic explicitly uses **low reasoning**. The worker still uses low extraction and medium validation reasoning, with its unchanged full V6 validator. There is no global environment change, fallback, output-limit increase, automatic retry or source truncation. Typed policy, prompt, schema and reasoning changed together, so this trial cannot isolate the effect of low reasoning alone.

## Frozen trial and results

The previous five challenge inputs and their source audits were reused unchanged. ALPLA was reviewed twice; each inventory would be compared against both the passing and failing extraction. Eskom, ACTOM and Cummins each had one attempt. A new Sappi source fixture added a positive control and a negative extraction that invented a pre-entry trade-test condition and omitted N1 subjects. The six-call plan, input/contract hashes, expected decisions and source inventories were frozen before any model call.

| Review | Outcome | Reported tokens |
| --- | --- | ---: |
| ALPLA first | Invalid applicability/metadata combination: post-selection and employer passages carried condition metadata. No canonical decision. | 3,457 |
| Eskom | Source coverage failed: its audience statement was classified as context instead of retaining the constrained uncertainty. No canonical decision. | 3,723 |
| ACTOM | Preparation scope failed: the caveat was separated from dependent claims, which were promoted into current conditions. No canonical decision. | 4,150 |
| Cummins | Its conditional-preference passage carried non-null condition metadata. No canonical decision. | 3,708 |
| ALPLA repeat | Its mandatory document condition had null group/relation metadata. No canonical decision. | 3,655 |
| Sappi | Two education/profile conditions and the audience unknown were retained. Source audit matched fidelity; the good control passed and the invented-training/missing-N1 case failed. | 2,739 |

The reported errors are the first blocking local checks, not exhaustive defect inventories. No invalid review was normalized into an acceptance or counted as detecting all known defects.

The fresh-source collection made **four RecentJobs requests**: robots, the apprenticeship index and two details. ITHUBA was inspected but excluded from this trial as an expired youth-development notice; Sappi was selected as an explicit apprenticeship. Its source was newly fetched and previously uncalled, but inspected during policy development before the model trial. It is a development fixture, not an independent held-out qualification benchmark. Sappi's stated application deadline was already past, and its retained audience uncertainty still requires review. Neither control was a publishable opportunity.

No employer pages were fetched. Employer crawling remains optional and off by default. No production store, application handoff, public feed, source grant or scheduler was modified. Application destinations remain original employer/ATS/email routes rather than discovery publishers.

## Replay and verification

The existing `evaluate-structured-review.mjs` now replays both versions without credentials, model calls, network or publication. V2 replay has **two decision matches and seven invalid comparison cases**: five invalid inventories, with the two ALPLA inventories each shared by two cases. There are zero missing inventories because all six accepted provider outputs were saved privately before decoding. V1 replay retains its prior five matches, two mismatches and one unavailable inventory. V1 source/contract hashes were verified unchanged before the new calls.

Private, ignored artifacts are in `.artifacts/groq/applicability-review-v2/` and `.artifacts/groq/applicability-review-v2-fresh/`. They include the frozen plan/inputs/audits, accepted inventories, usage/error reports, metadata diagnostics and separate offline reports. No model output, source snapshot or credential is committed.

All **215 catalogue tests passed** with clean Firebase emulator shutdown. New tests cover typed applicability and strength constraints, retained preparation caveats, bounded/unbounded and conflicting scopes, profile headings versus prose, inline preferences, historical selector isolation, low reasoning with the unchanged cap, blind payloads, credential-free reuse, source/contract binding, bounded/circular output rejection, billed local failures and V2 offline dispatch. Whitespace and staged secret checks passed.

## Next step

Constrain current versus non-current metadata in the provider schema, rather than allowing every field to be nullable and relying on prose to coordinate them. Keep applicability/coverage checks in code: grammar alone will not prevent ACTOM's preparation claims or Eskom's omitted uncertainty from being misclassified. Reduce the model's responsibility for source scopes that code already knows, then freeze a new bounded trial with repeated controls and additional development sources. The single Sappi pair and absence of truncation do not qualify a replacement validator or autonomous publication.
