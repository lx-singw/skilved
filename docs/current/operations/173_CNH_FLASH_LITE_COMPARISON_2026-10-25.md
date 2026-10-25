# CNH Flash-Lite comparison

25 October 2026. A prospectively frozen, two-arm experiment on **one familiar CNH notice** produces one checklist-supported and validator-supported private re-assessment. Gemini 3.1 Flash-Lite invents an open-until-filled deadline and is rejected. Gemini 3.5 Flash-Lite preserves the unknown deadline and completes both stages. No default model, source policy or accepted draft changes, and nothing is published.

## Frozen comparison and results

Both arms use the unchanged CNH source, eight-requirement checklist, assessor, V27 extraction contract and V15 validation contract. Extraction uses low thinking with a 3,072-token output limit; validation uses medium with 6,144. The two endpoints, order and stopping rules are selected before either answer: 3.1 Flash-Lite, then 3.5 Flash-Lite, with fallback disabled and at most two calls per arm. A checklist failure stops that arm before validation. The existing CNH source ID, revision and 12-call source/day cap are retained; four calls are allowed for this experiment, within its eight remaining calls.

| Arm | Outcome | Calls | Provider elapsed | Whole case elapsed | Reported total tokens |
| --- | --- | ---: | ---: | ---: | ---: |
| Gemini 3.1 Flash-Lite | Extraction decodes, but maps “Apply now online” to an invented `open_until_filled` deadline; unchanged checklist rejects it before canonical mapping or validation | 1 | 2.786 s | 7.721 s | 7,372 |
| Gemini 3.5 Flash-Lite | Extraction, checklist, canonical checks, semantic validation and private draft-readiness assessment pass | 2 | 6.460 s | 11.318 s | 11,850 |

All three provider responses are HTTP 200 and report the same model version as the requested endpoint. Extraction requests have identical source payloads, instructions, reasoning and output limits; their endpoint identities differ. There are four guarded source GETs, all HTTP 200, including a fresh robots/notice check for each arm. Source content is unchanged. No employer/application page is crawled and no application is submitted.

The passing answer retains seven required competencies and one complete preferred qualification/subject passage, including the Maths Literacy exclusion. It retains CNH, requisition 6175, Isando/Gauteng/South Africa, on-site attendance and regional qualitative benefits. Deadline, residence and prior experience remain unknown. The exact original application destination is retained; workshop paperwork does not become application-document requirements. Generic “Apply now online” wording also appears in practical instructions. No answer is edited or repaired to pass. The fresh extraction and validation each match a distinct successful stage/model/request-hash receipt; the canonical record passes its schema.

This is **one successful assessment out of two model arms on one familiar notice**, with zero additional unique opportunities, zero newly stored runtime drafts and zero public records. The assessment does not replace the accepted CNH draft or renew its expiry. An agent-authored checklist and model validation are development evidence, not independent human review or production qualification.

## What the speed observation means

The [earlier full-Flash CNH case](172_CURRENT_OUTPUT_BATCH_MEASUREMENT_2026-10-25.md) takes about 147.3 seconds and four calls, including two client deadlines. Its two responses report 12,618 tokens; two failed-call usages remain unknown. This 3.5 Flash-Lite case takes about 11.3 seconds including source reads, with about 3.5 seconds for extraction and 3.0 seconds for validation. These are sequential observations from different times, not a randomized latency benchmark. They do not establish a reliable speed ratio, lower monetary cost, provider backend independence or broader extraction accuracy. Full-Flash extraction previously reported a model version different from its requested endpoint; that discrepancy remains recorded.

The result supports another bounded 3.5 Flash-Lite shadow trial with frozen repeated and previously unseen cases. It does not support promoting 3.1's fast but incorrect response, weakening the deadline check or replacing the configured availability-fallback chain. The default chain remains 3.8 → 3.7 → 3.6 → 3.5 → 3.5 Flash-Lite → 3.1 Flash-Lite.

## Preservation and verification

Three calls spend **19,222 reported tokens**, with no new unknown usages. The shared ledger now retains **146 historical calls, 425,518 known tokens and 72 unknown usages**. CNH is **7/12** for the South African source day, with five remaining; Motus remains **6/6** and is not retried. Provider-day resets and availability expiry do not refund either source/day spend. The rejected 3.1 request remains spent. All old quota rows and availability records are retained.

Contracts build and **105 focused tests** pass. A saved positive and five authored rejecting assessor controls pass before live execution, and the no-send harness check verifies both fixed endpoint configurations. All **51 pipeline code/test hashes** and **1,900 historical artifact hashes** remain unchanged. The earlier full serial **896-test pass** is the unchanged implementation baseline, not a new full-suite run. The live helper exits successfully within its original bounds, without an intervention or retry after seeing an answer; it remains a private measurement harness, not evidence of unattended production scheduling.

All five accepted drafts and original expiries, source grants/revisions/caps, prior jobs, holds, candidates, exceptions, decisions, caches, receipts and snapshots are preserved. The pending Motus continuation and its 3.6 fallback cursor remain unchanged. Future real execution must restore `.artifacts/groq/cnh-flash-lite-comparison-2026-10-25/pilot-report.json` together with the latest `.artifacts/groq/gemini-quota-state.json`; restoring the older 143-call history alone would discard this spend.

Raw responses, source snapshots, the frozen plan, metrics, receipt audit and preview remain private under `.artifacts/groq/cnh-flash-lite-comparison-2026-10-25/`. The separate [recent-undated publication proposal](174_RECENT_UNDATED_PUBLICATION_PROPOSAL_2026-10-25.md) addresses the date-policy bottleneck without enabling it. Gemini remains shadow-only, employer crawling optional/off and production scheduling/publication disabled.
