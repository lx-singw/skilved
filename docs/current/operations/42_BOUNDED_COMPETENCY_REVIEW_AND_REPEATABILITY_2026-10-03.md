# Bounded competency review and repeatability — 3 October 2026

V11 adds source-derived constraints for selected competency/profile lines and held driving licences. Siemens and Mercedes Benz each match their complete source audits once. An identical Siemens repeat fails alternative grouping, and Sea Harvest still has three kind mismatches. Both unseen notices stop at preflight. **All 300 catalogue tests passed**, but the development reviewer remains outside the worker and does not qualify autonomous publication.

## Change and source ownership

`profile-review-policy.mjs` introduces `entry_applicability_v7` on top of V10's source selection. Narrow recognized traits and held licences receive `other` typing in explicitly bounded What You Bring, Qualifications and requirements, Key competencies and attribute lists. Plain traits retain unstated strength; explicit preference or obligation applies to that line only. A technical foundation described as beneficial stays preferred. A valid South African driving licence is a held credential, without inferring citizenship or a copy-submission obligation.

Unbounded lists, conditional/past/future context, negative or complex clauses and unfamiliar prose receive no new profile constraints. Existing uncertainty scopes, qualification alternatives and submission evidence take precedence. Source text and quotes stay unchanged; no employer names or expected responses determine the rules. These narrow rules are not a general classifier for arbitrary competency prose.

`profile-line-review.mjs` exposes `recentjobs_requirement_review_v11`. It reuses V10's full-line instruction, compact prompt schema, projection and constraint checks. Shared helpers were extracted without changing historical contract/payload outputs. Every source key remains required, including protected conditions. A supplied wrong kind, strength, span or applicability is rejected rather than replaced with code facts. Source, policy, local schema and low/medium reasoning remain bound to each saved inventory. Live defaults remain low, JSON-object output and a 3,072 completion-token cap, without retries or fallback. No worker settings changed.

## Frozen trial

All **34 AI module byte hashes**, the instruction and demonstration contract/payload were frozen before retrieving unseen source bodies. Six guarded RecentJobs requests collected two notices, following robots rules and pacing. There were no employer or application-destination requests. Source snapshots, manual audits, inputs, provider outputs and scripts remain private and ignored.

Siemens, Sea Harvest and Mercedes Benz are familiar regressions with unchanged controls, challenges and agent-authored full source audits. Their manual inventories pass preflight, audit fidelity and control/challenge comparisons. Manual results are labelled as manual and do not count as AI accuracy.

The six-slot plan freezes three familiar low runs, an identical Siemens repeat and two unseen slots before provider calls. Sappi's 184-line engineering apprenticeship article exceeds the existing 160-line source limit (`AI_INPUT_LIMIT`). It is not truncated or sent with expanded limits. Volkswagen's 37-line engineering apprenticeship notice receives a complete manual audit, but a faithful manual answer fails `AI_REQUIREMENT_COVERAGE`: the selector includes programme headings, successful-candidate future restrictions, a document introduction, recruitment/deadline/enquiry prose and an equity heading as minimum applicant evidence. The affected manual non-current minima are lines 21–25 and 31–34. Its separate current qualification and submission obligations are retained in the manual answer. Neither blocked notice receives a model call, and neither establishes unseen model performance.

## Results

| Attempt | Local result | Full source audit | Reported tokens |
| --- | --- | --- | ---: |
| Siemens low | Seventeen conditions | Match | 4,445 |
| Sea Harvest low | Eleven conditions | Three kind mismatches | 2,983 |
| Mercedes Benz low | Six conditions | Match | 2,570 |
| Siemens identical repeat | Invalid alternative anchor | Not scored | 4,434 |
| Unseen Sappi | Input limit at preflight | Not scored | No model call |
| Unseen Volkswagen | Coverage failure at preflight | Not scored | No model call |

Four calls report **14,432 total tokens**. Completion usage includes reasoning. All four answers have every required source key and valid wire metadata. Two of three decoded combined inventories match their full audits; two of four calls produce faithful inventories. This small familiar sample is not a held-out qualification result or a repeatability claim.

The first Siemens answer preserves complete qualification branches, all seventeen conditions and their strengths. Mercedes preserves all six conditions, including the held licence. Their good controls are supported and altered challenges rejected. Both still require review because the publisher's youth-audience invitation remains an unresolved scope. Sea Harvest now retains its competencies with the expected strengths, but classifies youth preference, prior practical experience and shift/overtime availability as `other` instead of the frozen `age`, `experience` and `availability` kinds. Its good control is rejected, and its challenge rejection does not establish inventory accuracy.

The identical Siemens repeat makes the second qualification introduction and subjects continuations of the first branch. Only one current object remains in the anchored alternative set, causing `AI_REVIEW_ALTERNATIVE_INVALID`. The request hashes are identical; no contract change or higher-budget retry follows the failure. The retained invalid answer is not repaired into a pass.

Final offline replay, without credentials or calls, records **five decision matches, one mismatch, two invalid comparisons and no unavailable comparisons**. It correctly exits 1. The two unseen preflight blocks are reported separately and are not scored as passing rejections or unavailable provider outputs.

## Verification and next decision

The full `pnpm catalogue:test` suite passed **300 tests**, including Firestore/Auth integration and clean emulator shutdown. New tests cover bounded competency strength, preference isolation, must clauses, held-versus-submitted licence separation, protected spans, caveated/unbounded abstention, uncertainty precedence, source/reasoning/version bindings, blind requests, unchanged completion limits, no retries, retained usage and offline V11 dispatch.

All **116 V1–V10 source/contract hashes** and historical replay counts remain unchanged. All 34 implementation hashes match the pre-source freeze after calls. Reconstructed request hashes match saved provenance, including the identical Siemens repeat. Whitespace and staged credential checks pass.

Next remove repeated model ambiguity over already-recognized complete qualification branches, correct mixed programme/submission boundaries, and test residual age/experience/availability typing. Freeze another contract before further unseen retrieval. Require repeated faithful unseen results before worker integration; audience applicability, source policy, issuer/application relationships and the full publication gate remain open.

Production reads, publication and scheduling remain disabled. Employer crawling stays optional and off by default. Original employer/ATS/email handoffs remain separate from publisher attribution. No feed record was published, no grants were provisioned and no environment configuration changed.
