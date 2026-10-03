# Uniform native records and remaining role conflicts — 3 October 2026

V15 establishes full-notice native structured-output access with a **792-byte homogeneous schema**. Volkswagen, its repeat and Traxtion all return structurally valid answers covering every required source line exactly once. All three still fail local record-role consistency checks, so there is no accepted inventory or publication qualification. **All 337 catalogue tests pass.**

## Response shape and retained validation

`record-line-review.mjs` exposes `recentjobs_requirement_review_v15`. It replaces the mixed string/object/integer line values with an array of records containing exactly `line`, `role`, `kind`, `strength`, `anchor` and `alternative`. Each field has one primitive type. The provider schema has no unions, references, nullable values or source-sized property map.

Current conditions use a supported kind and mandatory/advantage/unstated strength, with `anchor:0`. Independent conditions use `alternative:0`; complete multi-line OR branches share their first branch's line number. Ordinary non-current roles require neutral `none` kind/strength and zero anchors. Continuations use their own role, neutral kind/strength, zero alternative and an anchor naming the passage's first line. Contradictory fields are rejected rather than discarded or repaired.

The native schema constrains structure, enums and numeric bounds. **Exact array length and source-line coverage remain mandatory locally.** Local validation rejects omitted, duplicated, foreign and extra records, extra fields and invalid role combinations. A deterministic projection then passes the supplied classifications to the existing V13 decoder. It retains continuation ownership, complete alternatives, source constraints, protected uncertainty, complete quotations, local strength and submission-span rules. Source-owned compiled qualification branches cannot be echoed or used as anchors.

The source payload and policy are unchanged. Encoding instructions change to describe records and zero/neutral sentinels; existing applicability, kind, strength, qualification and submission guidance remains. This is not an isolated output-mode comparison. Source, reasoning, provider schema, strict local record schema and existing projection schema are bound before decoding. The offline tool now dispatches V1–V15. Worker defaults and production gates are unchanged.

## Native compatibility and bounded comparison

All six faithful frozen manual inventories convert without changing their decoded requirements and still pass the original audits: Siemens, Sea Harvest, Mercedes, Volkswagen, Traxtion and MISA. Sources, audits and faithful/defective Volkswagen and Traxtion inputs are reused unchanged. These audits remain agent judgments rather than independent model qualification.

A small synthetic request with exact native array bounds succeeds. It returns three conditions where the faithful inventory has two: the complete submission instruction is split, and its starting kind differs. That is compatibility evidence, not a correct extraction result.

The initial full Volkswagen request with exact native `minItems`/`maxItems` receives HTTP 400 and stops its planned repeat/Traxtion calls. The final contract omits those two provider bounds while retaining exact count and coverage locally. All three full-notice calls then complete. A separate control restores only the two bounds on an otherwise identical accepted Volkswagen request and again receives HTTP 400. This isolates rejection of the tested bound configuration; it does not establish a general array-size threshold or explain every earlier V14 rejection.

| Final notice attempt | Native structure and coverage | Local result | Reported tokens |
| --- | --- | --- | ---: |
| Volkswagen | Valid; every required line exactly once | Record-role conflict | 3,570 |
| Identical Volkswagen repeat | Valid; every required line exactly once | Record-role conflict | 3,570 |
| Traxtion | Valid; every required line exactly once | Record-role conflict | 2,621 |

All three classify L2 as uncertain while also supplying `other` kind and `unstated` strength, contrary to the neutral-field protocol. The first Volkswagen answer additionally marks L20 as current while setting its continuation anchor to 19. The repeat resolves that particular contradiction, but still fails L2. The repeated requests are identical; their complete inventories differ. No answer is repaired to permit further scoring.

The three final responses report **9,761 tokens**, with usage available and thinking counts absent/null. They have zero complete matches, as do the saved V13 answers for these three attempts. V13 failed alternative or wire validation; V15 fails record consistency before source-audit comparison. This does not establish improved semantic accuracy or a provider winner.

There are six bounded calls in this sprint: one successful synthetic control, one rejected initial notice request, three successful final notice requests and one rejected bound-control request. Successful responses report **11,611 tokens** in total; usage for the two rejections is unavailable and cannot be counted as zero cost. Calls use Gemini 3.5 Flash-Lite, low thinking and a 3,072-token output cap, with 60-second pacing between full-notice/control requests. Each trial stops on provider failure; no automatic retry or model fallback is added.

Google's [structured-output guide](https://ai.google.dev/gemini-api/docs/generate-content/structured-output) distinguishes schema compatibility from semantic correctness. Here, native structure succeeds after reducing provider constraints, while application-owned consistency checks still reject the model answers. There is no manual billing preflight, billing change, new source retrieval, employer crawl, application-route request or feed write. Credentials, notices, responses and evaluations remain private and ignored.

## Verification and next step

All 337 catalogue tests pass. New checks cover identical decoded source semantics, complete submission quotations, shallow native requests, strict local length/coverage, neutral-field conflicts, invalid alternatives and continuations, compiled qualification ownership, protected preparation scopes, source/version/reasoning bindings, private-claim exclusion, retained usage and rejection without fallback. Firestore/Auth emulators shut down cleanly.

All 150 historical V1–V14 payload/contract hashes and replay outcomes are preserved. The faithful/defective V15 manual replay yields four decision matches and exits 0. Final live replay yields six invalid comparisons and exits 1 because all three inventories fail local validation. Those recorded failures remain failures despite passing implementation tests.

The next response-format experiment should remove redundant classification fields that permit contradictory combinations, for example a single classification tag encoding role or condition kind/strength. It must retain complete local coverage, uncertainty and continuation/alternative checks, then face these same frozen controls and audits. Full semantic fidelity, deadlines and original employer/ATS/email handoff still require qualification. Groq remains the worker provider; production scheduling/publication is disabled and employer crawling remains optional/off by default.
