# Source-anchored alternatives and unseen review — 3 October 2026

V9 moves requirement-group allocation into code, retaining compact JSON-object requests and exact local validation. **All 281 catalogue tests passed.** The frozen live trial made five Groq calls; none of four decoded inventories matched its full source audit, one inventory was invalid, and one newly collected notice failed preflight without a call. V9 remains a development experiment and does not qualify worker adoption or automatic publication.

## Contract

`anchored-line-review.mjs` exposes `recentjobs_requirement_review_v9`. Each current line has exactly `kind`, `strength` and `alternative`. Independent coexisting conditions use `alternative: null`. Complete explicit OR branches all point to their first branch's starting source line, including that branch itself. Nested subjects continue the same complete branch through the existing adjacent first-line references. A one-line qualification containing alternatives stays verbatim and independent.

Code allocates internal groups in source order, independently of JSON property order. Model input/schema no longer exposes compiler group numbers or relation fields, including on fixed current passages. An anchor must be an actual model-owned condition start, reference itself and have at least two complete branches. Future, dangling, chained, fixed-passage, context and continuation anchors fail. Up to 18 distinct OR sets are allowed; independent and fixed conditions occupy separate internal ALL groups. The existing compiler still rejects mixed-strength alternatives, incorrect known branch spans, missing selected evidence, altered unknown scopes and invalid continuations. Groups cannot collide with code-owned conditions.

The instruction distinguishes recent qualification with limited/no formal work experience from a separate education gate, and states that plain equipment exposure in a mixed duties/profile list cannot inherit an adjacent condition's mandatory strength. These remain model judgments. The V8 source-evidence policy is unchanged; the experiment does not add employer-specific facts or modify expected answers after model calls.

The generic prompt schema is 770 bytes. Siemens' serialized request is 13,377 bytes, versus V8's 13,133 bytes. This is a wire-format simplification, not a further request-size or token-cost improvement. Exact source-dependent local-schema hashes remain part of the contract binding. Requests use Groq `openai/gpt-oss-120b`, low reasoning and the existing 3,072 completion-token cap, with no repair, retry or fallback.

## Freeze, source collection and preflight

The instruction, demonstration payload/contract and all **30 AI implementation module hashes** were frozen before fetching or reading new article bodies. Collection excluded 16 previously known source URLs and made **five RecentJobs requests**: robots, two apprenticeship index pages and two detail pages, obeying scoped fetch rules, robots permission and pacing. No employer or application destination was fetched.

The previously unseen notices are Sea Harvest's diesel/fitting apprenticeship (39 lines) and Mercedes Benz's apprenticeship (26 lines). Their source dates close on 10 and 14 September respectively, so both are expired at this trial. Complete agent-authored source audits and canonical controls/challenges were frozen before model calls. These are development judgments, not independent qualification. Familiar Siemens, Executech and West Coast Personnel controls/audits were copied unchanged.

Sea Harvest's audit preserves eleven current conditions, including its literal youth preference without inferring a numeric age, a complete single-line education alternative, preferred experience, testing/medical conditions, work capabilities, competencies and submission documents. Its challenge omits medical/document conditions, introduces future college training as an entry qualification and loses audience uncertainty. Its faithful manual inventory fails `AI_REQUIREMENT_COVERAGE`: the existing selector also requires line 32's competency heading and line 37's shortlist administration to be applicant evidence. Those lines remain context in the frozen audit. No model call is made and no false condition is invented to satisfy the selector.

Mercedes Benz's audit preserves six current conditions: the complete diploma/Matric subject wording and five profile/credential lines with unstated strength. Its challenge omits the held licence, invents employer-provided training as education eligibility and loses audience uncertainty. This manual inventory and the three familiar-source manual inventories pass source audits, compilation and control/challenge comparisons with zero provider calls. Manual inventories are explicitly labelled as manual, not AI results.

The six-attempt plan covers Siemens first/repeat, Executech, West Coast Personnel and both new sources. It is capped at six calls, with 60-second spacing and stop-on-rate-limit/provider-rejection behavior. Sea Harvest's preflight block leaves **five actual calls**. Contracts, source/input/audit hashes, implementation and the Siemens repeated request hash remain unchanged after collection and calls. Accepted JSON is saved before decoding, including the invalid response.

## Live results

| Attempt | Local result | Full source fidelity | Control/challenge decisions | Reported tokens |
| --- | --- | --- | --- | ---: |
| Siemens first | Invalid: nine extra fixed attribute keys | Not scored | Both invalid | 4,332 |
| Executech | Nine conditions | Exposure classified with the wrong kind | Good control rejected; challenge rejected | 2,755 |
| West Coast Personnel | Eleven conditions | Two recruitment pitches added as conditions | Good control rejected; challenge rejected | 3,246 |
| Siemens repeat | Twenty conditions | Complete education branch spans lost; four mandatory strengths changed | Good control rejected; challenge rejected | 4,036 |
| Sea Harvest, previously unseen | Preflight coverage block; no call | Not scored | Both unavailable | No call |
| Mercedes Benz, previously unseen | Six conditions | Five profile/credential strengths changed | Good control rejected; challenge rejected | 2,481 |

Five calls report **16,850 tokens**, including reasoning within completion usage. Every required output key is present in the received inventories. The first Siemens response additionally echoes fixed lines 53–61, so exact local validation rejects it. The repeat has the exact key set and no reserved-group failure, but structural decoding does not establish faithful branch grouping or local strength. It starts the first education passage at line 38 instead of 37, fragments the vocational branch into separate conditions and changes four explicit mandatory profile statements to unstated. Identical requests produce materially different failures.

Executech keeps its nine condition spans and the exposure line's unstated strength, but classifies that exposure as `other` rather than `experience`. West Coast Personnel correctly classifies the experience preference this time while adding the two recruitment pitches. Mercedes Benz preserves all six condition spans but makes the five plain attributes/held-licence lines mandatory, contrary to the frozen source-local strength audit. These outcomes do not show an overall reliability improvement over V8.

Offline replay records **four decision matches, four mismatches, two invalid comparisons and two unavailable comparisons**, and correctly exits 1. Every decoded good control is rejected; the four matches are rejected challenges, not passing source inventories. Source fidelity is scored separately and has **zero matches among four decoded combined inventories**. Sea Harvest's unavailable comparisons represent a preflight block, not provider failure or passing rejection. No input, expected decision, source audit, response or contract is repaired after seeing these outcomes.

## Verification and next decision

The full `pnpm catalogue:test` run passed **281 tests**, including Firestore/Auth emulator integration and clean shutdown. New checks cover independent/fixed coexistence without exposed compiler identifiers, two distinct nested OR sets, deterministic source-order allocation, invalid/singleton/chained/future/fixed/continuation anchors, complete known alternatives, mixed-strength rejection, unknown scopes, exact key/field limits, legacy-group rejection, source/version binding, compact prompt schema, blind requests, retained failed-call usage, no retry, credential-free reuse, fully constrained zero-call sources and V9 offline dispatch.

All **92 V1–V8 source/contract hashes** and historical replay counts remain unchanged. The 30 implementation hashes match the pre-source freeze after the trial. Whitespace and staged secret checks pass. Credentials, environment files, source snapshots, provider responses, private source audits and evaluation scripts remain ignored and uncommitted.

Keep V9 development-only. Next fix coverage boundaries and distinguish non-applicant administration from actual conditions, preserving the new source audits as regressions. Simplify the partial-line coverage task and distinguish qualification-list introductions from ordinary headings so nested branches remain complete. Freeze a bounded reasoning comparison to measure whether semantic consistency improves before expanding prompt rules further. Both newly seen notices are now familiar cases; subsequent unseen evidence needs another pre-source freeze.

Worker extraction and the separate full semantic validator, grants, scheduling, reads and publication configuration remain unchanged. Employer crawling remains optional/default off. Original employer/ATS/email handoffs stay separate from publisher attribution. The new parsed candidates point to employer/recruitment ATS systems, but their issuer relationships were not qualified here. Expired/missing deadlines, unresolved audience evidence and unqualified application relationships remain separate publication barriers. No feed record was published.
