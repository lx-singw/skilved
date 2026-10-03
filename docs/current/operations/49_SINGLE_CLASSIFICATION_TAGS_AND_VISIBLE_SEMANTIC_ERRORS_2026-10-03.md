# Single classification tags and visible semantic errors — 3 October 2026

V16 removes separate role/kind/strength fields, so the contradictory classifications seen in V15 cannot be expressed. All three frozen notice calls return valid structure and exact source-line coverage. Traxtion now passes local decoding but disagrees with its source audit in six places. Both Volkswagen answers still fail tag/anchor validation. **All 346 catalogue tests pass; no complete inventory qualifies.**

## One classification decision per line

`tag-line-review.mjs` exposes `recentjobs_requirement_review_v16`. Each record contains exactly `line`, `tag`, `anchor` and `alternative`. A tag is either a non-current role, `continuation`, or a supported condition kind/local-strength pair such as `education:mandatory` or `experience:advantage`. The schema offers 38 tags: 30 condition combinations, seven non-current roles and continuation. There are no neutral kind/strength placeholders or independent role fields.

The provider schema is 1,155 bytes, with primitive fields and no unions, references or native array-count bounds. Exact count, unique required line IDs, extra-field rejection and anchor/alternative consistency remain local. Current tags require a zero continuation anchor; ordinary non-current tags require zero anchors and alternatives; continuation requires a nonzero first-line anchor and zero alternative. No contradictory record is repaired or reinterpreted.

Projection maps the tag to the existing V13 inventory without changing source semantics. Existing protected uncertainty, continuation ownership, complete OR branches, source constraints, complete quotation and submission-span checks remain. The source payload and policy are unchanged. Only encoding instructions and schema change from V15, so the comparison is not an isolated model or output-mode test. Version, source, reasoning, native schema, strict local tag schema and existing projection schema are bound before decoding. The offline tool dispatches V1–V16; worker defaults remain unchanged.

All six faithful manual inventories retain identical decoded requirements and pass their unchanged audits: Siemens, Sea Harvest, Mercedes, Volkswagen, Traxtion and MISA. Frozen sources and faithful/defective controls are reused unchanged. The audits remain agent judgments, not independent qualification evidence.

## Three bounded native calls

The trial uses Gemini 3.5 Flash-Lite, low thinking, a 3,072-token cap and 60-second pacing. Requests contain numbered source evidence, not private claims or audit answers. Inventories are saved before local validation. Source/contract hashes and AI module byte hashes are verified. There are no retries, fallback calls, billing preflight/changes, new source retrievals, employer crawls, route requests or publication.

| Attempt | Native structure and coverage | Local/audit result | Reported tokens |
| --- | --- | --- | ---: |
| Volkswagen | Valid; every required line once | Tag/anchor conflict at L18 | 3,702 |
| Identical Volkswagen repeat | Valid; every required line once | Same conflict | 3,702 |
| Traxtion | Valid; every required line once | Decodes 14 conditions; six audit disagreements | 2,736 |

Both Volkswagen answers give L18 `education:mandatory` while setting its continuation anchor to 18. A current condition cannot also be a continuation. Both additionally set `alternative:18` on that line, where qualification alternatives occur inside one source line. That diagnostic is retained without repairing the earlier conflict or claiming further validation succeeded. Requests and full returned inventories are identical, but repeatability is not correctness.

Traxtion no longer carries contradictory role/kind/strength fields and passes local decoding. Its faithful inventory has nine conditions; the model returns fourteen. The unchanged audit reports:

- Lost uncertainty at L8.
- Missing complete unresolved qualification scope L10–11.
- Incorrect local strength at L17 and L19.
- Lost uncertainty at L21.
- Application/deadline context at L24 promoted into a requirement.

Those six issues exclude the audit's separate review-required markers. The faithful Traxtion control is rejected, while the defective control is also rejected. Only the latter is decision agreement; it does not establish correct extraction. This exposes semantic errors that V15's record consistency failure prevented us from scoring.

All three attempts have zero complete inventory matches, as do their saved V15 baselines. V16 allows one inventory to decode versus none in V15; there is no semantic-accuracy winner or production qualification. Three calls report **10,140 tokens**, with usage available for all and thinking counts absent/null. The trial does not establish a cost improvement.

## Verification and next step

All 346 catalogue tests pass. New tests cover unchanged source semantics and complete quotations, a four-field native schema, invalid tags and forbidden extra classification fields, exact local coverage, tag/anchor contradictions, complete alternatives, independent compiled/residual groups, protected preparation scopes, cached-review bindings, blind bounded requests, retained usage and rejection without fallback. Firestore/Auth emulators shut down cleanly.

All 156 historical V1–V15 payload/contract hashes and replay outcomes are preserved. The faithful/defective V16 manual replay gives four decision matches and exits 0. Live replay gives one decision match, one mismatch and four invalid comparisons, exiting 1. Implementation tests and one defective-control rejection do not turn those failures into qualification.

The next useful comparison is the configured Gemini Flash model against Flash-Lite with this same frozen V16 contract, audits, controls and output budget. That can distinguish model behavior from another encoding change; it should be bounded and stop on provider failure. Broader independent audit evidence, fresh notices, deadline extraction and original employer/ATS/email handoff still need full-pipeline qualification. Groq remains the worker provider, production scheduling/publication remains disabled, and employer crawling stays optional/off by default.
