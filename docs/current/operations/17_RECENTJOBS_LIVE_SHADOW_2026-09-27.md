# RecentJobs live worker shadow run — 27 September 2026

The real worker completed a bounded RecentJobs discovery run against local Firestore/Auth emulators, with real website requests and real Groq calls. **Ten notices produced zero accepted drafts and zero public records.** The isolated source was in shadow mode, employer crawling was disabled, and the local machine grant had only `ingest`. No cloud database, production grant, public-read flag or scheduler was configured.

## Observed outcome

| Outcome | Notices |
| --- | --- |
| Date unknown/unsupported | Unique Personnel, Actom, Sappi, Cummins |
| Date already closed under the pilot policy | Hytec, Eskom YES |
| Unsupported detail layout | Tronox |
| Fetch timed out; retry recorded as pending | ITHUBA |
| Groq rejected extraction | Feltex |
| Unresolved material facts blocked the record | ALPLA |

Discovery returned ten cards. Eight immutable snapshots were retained. Nine detail jobs ended in exceptions and one had a pending retry; discovery itself completed. Three of the four allowed model calls were used: one rejected extraction without usage metadata, one received extraction (4,351 tokens), and one received validation (4,349 tokens). Total reported usage was **8,700 tokens**; the rejected request's usage is unknown. The fresh Sappi read before this run also had no parsed closing date and incurred no AI call.

The emulator was stopped after the run, so the pending retry is a recorded state, not a running scheduled follow-up. The private report is `.artifacts/groq/live-shadow-report.json`; its initial export includes jobs, budgets, usage and snapshots, but did not include candidate/model-cache documents. The reusable runner below now exports those too. The exact ALPLA unresolved field cannot be reconstructed from that initial report alone; no more specific cause is claimed.

This run demonstrates real discovery, extraction attempts, semantic validation, durable exception handling and enforcement of publication gates. It does not demonstrate accepted real-source publication or qualify the source for automatic operation.

## Changes from the run and preceding saved failures

- Explicit publisher invitations such as “Join our WhatsApp group” are marked in model input and rejected if used as factual/application evidence. Source text remains intact for auditing. This narrow detector does not classify every form of promotional wording.
- Multiple requirement items cannot cite the same complete line range and pretend to be different alternatives. Single-line compound conditions remain verbatim, including their internal OR wording.
- Unresolved material facts are checked immediately after retaining the extracted candidate, before optional employer-page retrieval or a paid semantic validation call. The final publication check repeats the same gate. This would have avoided the ALPLA validation call in the observed run.
- A Groq HTTP 400 whose bounded error body explicitly reports `json_validate_failed` is classified as `AI_INVALID_PROVIDER_OUTPUT`, retryable by the existing worker attempt limit and backoff. Other HTTP 400 errors remain non-retryable. The client makes one request; there is no immediate retry loop. Provider messages and failed generations are never copied into worker logs. Numeric HTTP status is retained for diagnostics.
- Retry reservation still counts failed requests. Tests exercise restart, delayed retry and a three-call budget covering failed extraction, successful extraction and validation.

Current versions are `recentjobs_extraction_v5`, `recentjobs_extraction_v5_groq_v6` and `recentjobs_validation_v6`. Defaults remain low extraction reasoning and medium validation reasoning on Groq GPT-OSS 120B, with the existing 3,072 completion-token limit.

Validation after these changes: `pnpm catalogue:test` passed all **101 tests**, including worker retries/budgets, early material checks, promotion/duplicate rejection, CLI isolation and actual web application handoffs. The first run passed its tests but Firebase CLI timed out during shutdown; a repeat passed all 101 and exited successfully. The example source also passes the source schema, documentation links resolve, and private environment/report paths remain ignored by Git. The reusable CLI's help and isolation guards were tested; the observed live batch used the preceding private harness with the same worker.

## Reproducible local pilot

The [example source configuration](../../../packages/catalogue/tools/examples/recentjobs-shadow.json) is explicitly for private evaluation. Its two issuer scopes come from observed discovery-notice application anchors and do not establish production qualification.

From the repository root, with Node 22, Firebase CLI, Java and local Groq opt-in configured:

```sh
pnpm --filter @skilved/types build:contracts
firebase emulators:exec --config packages/catalogue/firebase.test.json --project demo-skilved-shadow --only firestore,auth "node --env-file=.env.local packages/catalogue/tools/shadow-recentjobs.mjs packages/catalogue/tools/examples/recentjobs-shadow.json"
```

The [runner](../../../packages/catalogue/tools/shadow-recentjobs.mjs) requires local emulator endpoints, fixes the database namespace to a demo project, rejects production Node mode and non-shadow sources, and creates only an ingest grant. Use fresh emulators; an existing source is rejected rather than reset. It runs one tick, then writes an exclusive private report under ignored `.artifacts/shadow/`, including candidates, model cache, exceptions and snapshots. Reports may contain source text; keep them private. It does not enable reads, publish, schedule, send applications or fetch employer pages with the example policy.

The proposal for the next qualification stage is ten distinct notices across at least three issuers, with expected requirements and original methods recorded before model calls, followed by two runs per case under one frozen prompt/schema. Include exclusions, required documents, alternatives, email instructions and publisher promotions. Record every failure and token count. Archived cases may test extraction at a recorded observation date, but cannot establish that an opportunity is open today. Any missed mandatory requirement or wrong application destination fails qualification; do not tune on a case and continue calling it held out.

Only after that evidence is reviewed should source/issuer qualification and a real worker identity be configured for scheduled shadow operation. Automatic feed publication remains disabled. Employer-page crawling remains optional throughout.

See the [pipeline runbook](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md) and [compact-format evaluation](16_RECENTJOBS_COMPACT_EXTRACTION_2026-09-27.md).
