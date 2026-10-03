# Compact review requests and mixed applicant/work evidence — 3 October 2026

The V8 development reviewer reduces prompt overhead, checks applicant evidence within mixed duties sections, and bounds profile/attribute evidence before employer information. **All 272 catalogue tests passed.** The six-call familiar-source trial is recorded below. Production publication remains unqualified.

## Contract and evidence changes

`compact-line-review.mjs` exposes `recentjobs_requirement_review_v8`, using Groq `openai/gpt-oss-120b`, low reasoning and explicit JSON-object transport. One generic 790-byte prompt schema replaces repeated source-line unions. JSON-object transport guarantees JSON syntax only; the shared local validator still requires every residual key, rejects extra keys/fields, validates kind/strength/group ranges and checks adjacent continuation targets. The compiler retains source spans, qualification alternatives, independent code-owned conditions and unresolved scopes. Source/contract binding now includes the hash of the exact source-dependent local schema as well as the actual prompt contract. There is no response repair, automatic retry or fallback.

The revised instruction checks applicability line by line, including applicant conditions before and after future duties. It distinguishes prior experience, interest, fitness and criminal-record conditions from workshop tasks; local strength and qualification-versus-experience classification remain model judgments where no typed source fact exists. Complete nested course alternatives stay intact. Empty source hints do not mean the notice has no conditions.

`compact-review-policy.mjs` introduces `entry_applicability_v5`. Shared evidence constructors accept explicit supplements while historical callers retain their defaults. V8 recomputes evidence with employer-introduction and rewards boundaries before compiling passages. Behavioral evidence is guarded against conditional, previous-intake and selected-candidate context. A trailing “as required” support clause does not make a whole attribute mandatory. Label recognition handles en/em dashes and invisible leading characters without changing numbered source text or quotes. Bounded current-profile qualification wording includes engineering course-credit subjects, with unstated strength preserved. Normalized publisher social invitations are excluded. Source uncertainty and known alternatives retain precedence; no employer names or expected/model answers determine code rules.

## Frozen trial

This trial reuses Siemens Energy, Executech, West Coast Personnel and Sappi from the previous private corpus. They are **familiar regressions**, including the two notices that were previously unseen in V7. There are no new RecentJobs requests or employer-page requests. Source audits, canonical controls/challenges and input hashes are copied unchanged. Agent-authored audits are development judgments, not independent accuracy qualification.

All 29 AI implementation module hashes, payloads, contracts, source audits and the six-attempt plan are frozen before model calls. Manual inventories pass the compiler, full source audits and control/challenge comparisons with zero model calls; these inventories are explicitly manual, not provider results. The plan uses the existing 3,072 completion-token cap and 60-second spacing, stops on rate limiting/provider rejection and never adapts the contract during a repeat. Accepted JSON is saved before local decoding, including invalid inventories.

| Source | V7 request body | V8 request body |
| --- | ---: | ---: |
| Siemens Energy | 34,900 bytes | 13,133 bytes |
| Executech | 18,472 bytes | 9,619 bytes |
| West Coast Personnel | 23,417 bytes | 11,022 bytes |
| Sappi | 14,994 bytes | 9,216 bytes |

These are exact serialized byte measurements, not provider-token or reasoning-capacity guarantees. The instruction is 5,850 bytes. Both repeat pairs use identical request hashes. Source/contract/input/audit and implementation hashes remain unchanged after the calls.

## Live results

| Attempt | Local result | Full source fidelity | Control/challenge decisions | Reported tokens |
| --- | --- | --- | --- | ---: |
| Siemens first | Invalid group number | Not scored | Both invalid | 3,541 |
| Executech first | Nine conditions | One strength mismatch | Good control rejected; challenge rejected | 2,861 |
| West Coast Personnel | Nine conditions | One kind mismatch | Good control rejected; challenge rejected | 2,902 |
| Siemens repeat | Invalid group numbers | Not scored | Both invalid | 3,599 |
| Executech repeat | Nine conditions | Matched | Both matched | 2,842 |
| Sappi | Two conditions | Matched | Both matched | 2,338 |

Six calls report **18,083 tokens**, including reasoning within completion usage. All six provider responses are available, and every required output key is present with no extra keys. The two Siemens inventories use group 20 on model-owned lines, outside the permitted 1–19 range; the first has one such line and the repeat has six. They fail exact local validation and are not repaired or scored as passing rejections. V7's Siemens HTTP 413 does not recur in this trial. The smaller request was accepted, but the precise cause of the earlier rejection remains unknown.

Executech retains all nine audited applicant conditions in both calls, separating intervening future workshop tasks. Its first call makes plain heavy-machinery exposure mandatory; its repeat correctly preserves unstated strength and matches the full audit. Identical request hashes therefore do not establish repeatable semantics. West Coast Personnel no longer adds a recruitment pitch as an extra condition, but classifies the recent-qualification/limited-experience preference as education rather than experience. Sappi's two qualifications are code-owned before the call, including decorated N1 course-credit wording; the combined code/model inventory matches the audit without turning future trade training into entry eligibility.

Two of four decoded combined inventories match their full source audits, excluding only the expected review-required marker for preserved audience uncertainty. Two more responses cannot be decoded. Offline replay records **six decision matches, two mismatches, four invalid comparisons and no unavailable comparisons**, and correctly exits 1. The two mismatches reject good controls; challenge rejection and structural key coverage alone do not establish inventory accuracy. Every supported control still requires review because audience uncertainty is retained. These familiar-source results do not qualify automatic publication or establish performance on unseen notices.

## Verification and adoption

The full `pnpm catalogue:test` run passed **272 tests**, including Firestore/Auth emulator integration and clean shutdown. New checks cover constant prompt size versus exact local coverage, missing/extra keys and fields, enum/range failures, source binding, illegal continuations, complete nested course alternatives, mixed duties/current conditions, decorated profile quotes, bounded attributes, conditional/past/selected abstention, explicit preferences, blind requests, billing retained on failed decoding, no retries, cached credential-free reuse, zero-call fully constrained notices and V8 offline dispatch.

All **80 V1–V7 source/contract hashes** and their historical replay counts remain unchanged. Shared evidence injection preserves historical defaults. Expected evaluation failures stay separate from the passing code suite. Credentials, environment files, source snapshots, provider responses, source audits and evaluation scripts remain private and ignored.

V8 remains a development reviewer. Worker extraction, the separate full semantic-validator contract, source grants, scheduling, public reads and publication configuration remain unchanged. Original employer/ATS/email application handoffs remain enforced, with publisher attribution separate. Employer crawling remains optional and off by default. Missing/expired deadlines, unresolved audience evidence and unqualified issuer/application relationships remain separate publication barriers; no application destination was fetched by this trial.

Next simplify model grouping so code-owned groups cannot tempt the model to reuse reserved identifiers, while keeping complete source alternatives and local rejection intact. Address local strength and experience classification with a small, frozen contract change rather than appending more source-specific instructions. Then repeat the regressions and collect genuinely unseen evidence under a pre-source freeze. This sprint resolves request overhead and improves mixed-duty coverage; semantic repeatability and whole-pipeline qualification remain open.
