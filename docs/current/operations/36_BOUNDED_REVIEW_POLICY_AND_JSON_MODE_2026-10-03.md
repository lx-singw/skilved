# Bounded source sections and locally validated JSON review — 3 October 2026

The V5 development reviewer corrects the source-section boundaries found in V4 and explicitly requests JSON-object output with strict local validation. All four calls decoded; the synthetic smoke test and ALPLA source audit passed, while EWC and West Coast Personnel still had semantic errors. **All 246 catalogue tests passed. Autonomous publication remains unqualified and disabled.**

## Versioned source policy

`bounded-review-policy.mjs` introduces `entry_applicability_v2`. Exact headings such as Commencement Date, General Instructions, Key Responsibilities and Enquiries end an active requirement, skills, attributes, preparation or profile section. Timing labels can include an inline value. Ordinary applicant prose mentioning those words remains evidence. The policy recomputes constraints from source text through the existing selectors; it does not remove lines based on a model response, employer name or expected answer.

The new baseline also avoids running an obsolete selector first: a small requirements section followed by many administrative lines no longer hits the historical false 40-condition cap. Actual source limits, promotion exclusions, evidence hints, complete alternative branches, unresolved scopes and independent submission conditions remain checked.

Previously frozen manual inventories for EWC and West Coast Personnel now compile, accept both good controls and reject both defect challenges while preserving uncertainty. These are **code regressions with zero model calls**, not AI success. Their agent-authored source audits and canonical expectations remain unchanged. All 48 saved V1–V4 source/contract hashes remain identical; earlier selectors and callers retain their defaults.

## Provider diagnostics and explicit transport

The rejected-output diagnostic now reports bounded schema-owned paths and codes for types, enums, constants, numeric bounds and unresolved unions, plus counts of extra properties. It retains no rejected text, values, unknown key names or provider messages. It selects a union branch only through a unique type/discriminator match; ambiguous cases stop at the parent path. The diagnostic remains a limited structural inspector, not a full JSON Schema validator.

Two unchanged strict V4 synthetic requests still returned HTTP 400 `AI_INVALID_PROVIDER_OUTPUT`, parsed JSON and unknown usage. The second request transiently checked the actual rejected document against the emitted schema with Python's Draft 7 validator: valid, zero errors. Only that boolean/count/keyword summary was saved; the rejected document was not retained. This establishes an observed disagreement with provider validation, not its root cause or a general compatibility guarantee.

`bounded-line-review.mjs` exposes `recentjobs_requirement_review_v5`, with the V4 instruction and line-value format, the new source policy and an explicit `json_object` contract. [Groq documents](https://console.groq.com/docs/structured-outputs) that this mode produces JSON syntax without schema enforcement. The development reviewer therefore always checks required keys, strict object fields, metadata, continuations, partition, source constraints and canonical expression compilation locally before using the result. Invalid output retains reported usage and fails without repair, retry or fallback.

The shared Groq client supports this explicit descriptor only; an environment variable cannot silently select it. Schema instructions are bounded before spend, and the request hash includes the transport and actual messages. The worker's extraction and full V6 semantic validator retain strict-schema transport and unchanged settings. No worker switches to V5.

## Frozen trial and results

The four-call plan, contract/source hashes, complete source audits and eight canonical control/challenge inputs were frozen before requests. It uses one synthetic example and familiar saved ALPLA, EWC and West Coast Personnel notices. These are regression sources, not new held-out observations. No RecentJobs, employer or other discovery pages were requested this sprint.

The trial uses Groq `openai/gpt-oss-120b`, low reasoning, 3,072 maximum completion tokens and 60-second spacing. Provider-accepted JSON is saved privately before local decoding; no response or expectation is repaired after inspection. The four-call cap plus the two strict diagnostics limits this sprint to six provider requests.

| Source | Local decoding | Full source fidelity | Control/challenge decisions | Reported tokens |
| --- | --- | --- | --- | --- |
| Synthetic | Passed, one condition | Matched | Both matched | 1,594 |
| ALPLA | Passed, four conditions | Matched | Both matched | 4,541 |
| EWC | Passed, four conditions | Mismatch | Good control wrongly rejected; bad control rejected | 4,618 |
| West Coast Personnel | Passed, eleven conditions | Mismatch | Good control wrongly rejected; bad control rejected | 5,587 |

Four JSON-object calls reported **16,340 total tokens**. Completion counts already include reasoning. Usage for the two strict diagnostic failures remains unknown; the sprint's complete token usage/cost is therefore unavailable. The JSON trial has no provider failures or missing saved inventories. Offline replay records **six decision matches and two mismatches**, including the synthetic pair, with no invalid/unavailable cases. It exits 1 because the good EWC/West Coast Personnel controls disagree; this is an evaluation result, not a failing code test or an accuracy estimate.

EWC's model inventory invents an ALL relationship between the three qualifications, combines an introductory line and three independent document obligations, makes a pre-placement obligation uncertain, and omits delivery/reference instructions. Its rejection of the bad control does not establish complete defect detection: some challenge defects are reproduced in the inventory itself. Source fidelity and decision agreement are reported separately.

West Coast Personnel preserves the preferred licence and code-owned audience uncertainty, and excludes future duties from requirements. It still duplicates recruitment-pitch qualifications, classifies an experience preference as education, marks five plain profile attributes preferred despite unspecified strength, and classifies required travel as preferred `other`. The complete source audit exposes these errors even though the defect challenge is rejected. Neither failing source was used to rewrite its frozen expectations or repair its saved inventory.

Unresolved scopes intentionally require review even when a manual good inventory agrees with its canonical control. EWC also has an expired September deadline and unsupported delivery/time details; the enquiries email is not an application address. West Coast Personnel retains audience uncertainty and an unspecified deadline. Neither becomes publishable through this requirement-only experiment. ALPLA still needs the separate metadata, original-route, issuer and publication checks.

## Verification and next step

The full `pnpm catalogue:test` run passed **246 tests**, including Firestore/Auth emulator integration and clean shutdown. Tests cover exact heading/prose boundaries, bounded skills/profile/preparation evidence, nested alternatives, document independence, the false-cap regression, real source limits, blind JSON requests, strict local rejection with usage, version binding, credential-free reuse and offline V5 dispatch. Provider tests verify the unchanged strict default, distinct request hashes, prompt limits and absence of fallback. Private source/model artifacts and credentials remain ignored and uncommitted.

Historical offline replay remains distinct from passing code tests. V1 has five decision matches/two mismatches/one unavailable; V2 two matches/seven invalid; V3 four matches/one mismatch/three invalid/one unavailable; V4 eleven unavailable. These expected exit-1 reports preserve prior failures and make no provider calls.

Next address independent submission obligations and unresolved qualification logic in a separately frozen development contract, then test repeats and unseen controls before considering worker adoption. Original employer/ATS/email handoffs remain enforced. Employer crawling remains optional and off by default. No production publication, public-read flag, scheduler, grant or environment setting changed.
