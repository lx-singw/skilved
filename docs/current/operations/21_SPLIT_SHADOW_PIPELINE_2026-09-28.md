# Metadata + requirements shadow pipeline — 28 September 2026

The worker now supports explicit **shadow-only split extraction**: metadata → requirement groups → canonical checks → semantic validation → private draft. A replay using saved real-source/model evidence completed that path and retained ALPLA's original application URL. **The fresh live batch did not pass:** its ALPLA requirements response failed coverage. No production record was published.

## Implementation

The [metadata adapter](../../../packages/catalogue/src/ai/metadata.mjs), `recentjobs_metadata_v1`, omits the requirements tree from its schema. It reads the full numbered notice and parsed application candidates, with instructions addressing the previously missed prose city and non-numeric pay. Evidence spans use the same canonical fact rules as the full extractor. The model selects an application index; it cannot supply a new URL or email.

The [worker](../../../packages/catalogue/src/recentjobs-worker.mjs) accepts `extractionMode: split`. Every transaction refuses that mode unless the source remains in shadow mode. The standard worker still defaults to single extraction. Metadata, requirements and validation each have their own budget reservation, cache entry and usage record. Cache keys distinguish split versions from the original extractor. Failed calls consume reservations; retries reuse successful earlier stages. Combined provenance retains both extraction stages.

Canonical mapping, material checks, issuer/route checks, optional employer corroboration, semantic assessment and transactional final checks remain. Employer crawling remains optional and off with the example policy.

Issuer entries now support explicitly registered aliases on their existing host/path or email route. Names still match exactly apart from whitespace/case normalization. Lookalike names/hosts do not match; multiple matching entries fail. Optional primary corroboration accepts only the same registered names. The private example source is now revision 2 and registers ALPLA alongside Alpla Plastics because the captured title/body use both labels. This is private evaluation configuration, not production qualification. Existing source policies need a deliberate revision update when registered names change.

## Fresh live run

The real worker used fresh local Auth/Firestore emulators, real RecentJobs pages and Groq requests, an ingest-only grant, and no employer crawling. The private harness spaced model request starts by 35 seconds and retained a four-call source limit. That extra pacing belongs to the evaluation harness; the normal worker retains its persisted Retry-After handling.

| Outcome | Notices |
| --- | --- |
| Missing/unsupported date or route precision | Sappi, Cummins, ITHUBA, Actom, Unique Personnel |
| At/past the worker's conservative date-only cutoff | Hytec, Feltex, Eskom YES |
| Unsupported detail layout | Tronox |
| Requirement coverage rejected | ALPLA |

Ten notices were discovered, nine snapshots saved, and ten detail jobs became exceptions. There were zero accepted drafts, public records or validation calls. Metadata returned Lanseria, Gauteng, qualitative salary evidence and the original application candidate. The failed low-reasoning requirements output was not retained, so its exact omission is not claimed.

Private evidence: `.artifacts/groq/split-live-2026-09-28/report.json`. The emulators stopped after the run; no background follow-up was scheduled.

## Follow-up and call accounting

The saved ALPLA candidate's content hash and text matched the fresh snapshot. One medium-reasoning requirements follow-up was also rejected. Its saved raw response omitted the explicit Mathematics Literacy exclusion. Raising reasoning did not resolve the coverage failure.

The final allowed request assessed fresh metadata combined with the earlier successful V2 requirements response for the identical source. Semantic validation returned supported=true with no issues. The old source registry still rejected the issuer label ALPLA, having registered only Alpla Plastics. The explicit alias update above addresses that configuration mismatch for subsequent evaluations; neither the original run nor its score was rewritten.

| Request | Context | Tokens |
| --- | --- | ---: |
| Metadata, low reasoning | Fresh worker run | 3,810 |
| Requirements, low reasoning | Fresh worker run; coverage rejection | 1,663 |
| Requirements, medium reasoning | Diagnostic; coverage rejection | 2,208 |
| Semantic validation, medium reasoning | Fresh metadata + historical successful requirements | 4,698 |
| **Total** | **4 new calls** | **12,379** |

Completion counts include reasoning. The last two requests were standalone diagnostics after the first emulator run ended: they are included in this total but not in that run's two-call worker ledger. Extraction defaults remain low reasoning and validation medium. The higher-reasoning diagnostic was not adopted as a default.

## Full worker replay

An isolated replay used archived HTML matching the fresh content hash, fresh metadata, previously successful V2 requirements, the fresh semantic assessment and the revised private alias registry. Discovery and robots responses were local transport fixtures, not new live-site checks. The actual worker performed mapping, evidence checks, issuer/original-route matching, semantic-result validation and transactional persistence.

Result: **one `shadow_pass`, one private draft, zero public records, zero new model calls and zero live website requests**. The draft retained the exact original ALPLA ATS URL. The replay's three `model_calls` entries describe invoked replay stages and historical response usage, not additional spend.

Private evidence: `.artifacts/groq/split-worker-replay-2026-09-28/report.json`. This verifies integration with saved real evidence. It is not a fresh end-to-end extraction success, independent accuracy measurement or authorization to publish.

## Reproduction and validation

For a new live local trial with Groq opt-in and fresh emulators:

```sh
pnpm --filter @skilved/types build:contracts
firebase emulators:exec --config packages/catalogue/firebase.test.json --project demo-skilved-shadow --only firestore,auth "node --env-file=.env.local packages/catalogue/tools/shadow-recentjobs.mjs --split packages/catalogue/tools/examples/recentjobs-shadow.json"
```

The [runner](../../../packages/catalogue/tools/shadow-recentjobs.mjs) records the extraction mode and writes an exclusive private report under ignored `.artifacts/shadow/`. It refuses unsafe emulator configuration, non-shadow sources and existing source records. This command consumes quota; it does not import successful saved responses or promise a pass. Production reads, publication and scheduling remain disabled.

The full catalogue suite passed **121 tests**, exit code 0. Coverage includes split-stage accounting, cache reuse, restart after rate limiting, failed-call charging, refusal on automatic sources, exact original destinations, optional employer crawling, metadata spans, explicit aliases and existing feed handoff behavior. The CLI isolation test also exercises `--split`. Tests make no live provider calls.

Next: preserve every explicit mandatory source condition before grouping, so negative conditions cannot disappear. The current coverage gate correctly blocks omissions. A passing replay and the previous three-of-four requirement trial do not establish repeatability; production publication remains disabled while this issue is unresolved.

See the [requirement compiler evaluation](20_REQUIREMENT_GROUP_COMPILER_2026-09-28.md) and [pipeline runbook](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md).
