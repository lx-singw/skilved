# Local shadow checkpoints preserve document identity and history

25 October 2026. Local shadow reports now include a versioned checkpoint of all available `m0_` top-level JSON documents. A separate read-only command exports an existing local emulator without fetching sources or calling AI. This closes a report-format gap before further live assessment work: the previous runner omitted source versions, immutable origins/import receipts, private assessments, grants, queues and leases.

## Format and bounded capture

The [capture helper](../../../packages/catalogue/src/shadow-checkpoint.mjs) stores each document as `{id, data}`. `id` is the Firestore document ID; `data` contains the exact stored fields, including the unparsed `json` string. An embedded source ID cannot replace a source-version document ID. Native grant/queue fields and additional stored fields survive too. The previous flattened `report.records` representation is replaced by `report.checkpoint`, with `version: 1`, the local project, capture time, scope, collections and a SHA-256 integrity checksum. Counts use the full `m0_` collection names.

All selected collections are read in one read-only transaction. The exporter checks collection membership before and after capture and rejects a changed list. Limits are 64 collections, 10,000 documents and 32 MiB of serialized checkpoint data; a limit rejects the entire capture rather than truncating it. Unsupported Firestore-specific types also reject instead of being silently converted to JSON. The format covers top-level JSON documents only. It is not a general Firestore or Auth backup, does not include subcollections, and does not replace the separate shared provider quota ledger.

The [shadow runner](../../../packages/catalogue/tools/shadow-recentjobs.mjs) uses this format after its bounded worker tick. The new [export command](../../../packages/catalogue/tools/export-shadow-checkpoint.mjs) can capture an already populated emulator without starting a worker:

```sh
SKILVED_CATALOGUE_MODE=emulator \
SKILVED_CATALOGUE_PROJECT=demo-your-local-project \
FIRESTORE_EMULATOR_HOST=127.0.0.1:18080 \
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:19099 \
node packages/catalogue/tools/export-shadow-checkpoint.mjs
```

Use the existing emulator's actual demo project ID and stop local workers first. The command refuses disabled/cloud/production configuration, remote endpoints and a project mismatch. It writes exclusively created private files under ignored `.artifacts/shadow/`; stdout contains only the path, version, checksum and counts. No credentials or AI opt-in are needed. It does not restore data, resume jobs, refresh source acquisitions or renew drafts. Older unversioned reports remain unchanged and must not be treated as lossless checkpoints. Any future restore must retain source identities, revisions, histories, spent budgets and provider exhaustion, with separately verified worker authority.

## Offline verification with available archived history

A disposable emulator receives the available records from the [latest CNH assessment](179_CNH_FRESH_COUNTRY_GUARD_ASSESSMENT_2026-10-25.md), with the latest shared usage/availability ledger. Export and direct database comparison preserve all **385 available documents in 17 populated collections**, including five accepted drafts and their original expiry timestamps, both private assessments, both source versions, two origin bindings, the import receipt, spent calls, caches, pending jobs and audit rows. Source-version document IDs remain distinct from embedded source IDs.

CNH remains revision 2 at **12/12** and Motus revision 1 at **6/6**, both with zero remaining source allowance. The exporter makes **zero source requests and zero provider calls**. The shared ledger is byte-for-byte unchanged at **151 historical calls, 458,579 known tokens and 72 unknown usages**. No grant, source revision, cap, accepted draft or public record changes.

This archived copy cannot recover queues, leases, watches or grants omitted by older reports. Those omissions are recorded explicitly; no synthetic replacement history is presented as original runtime evidence. The exported copy is an offline preservation exercise, not a fresh source acquisition or a replacement runtime. Future execution still restores `.artifacts/groq/cnh-country-guard-live-2026-10-25/pilot-report.json` plus the latest shared quota ledger, using the existing source-version restoration rule.

**Eight focused tests and all 940 catalogue tests pass** under the local Auth/Firestore emulators. Tests cover preservation, conflicting embedded IDs, future collections, unsupported values, bounded failure, collection-list changes, configuration guards and private CLI output. The prior private artifact chain and shared ledger remain unchanged.

## Next live work

CNH and Motus source allowances reset at **26 October 00:00 SAST (25 October 22:00 UTC)**. Until then, neither receives another model request. The next bounded quality run must preserve existing history and test the normal accepted-draft path; the separate private assessment results do not qualify that writer or establish broad reliability. No wakeup or automatic resume is created by this sprint. Model defaults are unchanged, employer crawling remains optional/off and production scheduling/publication remain disabled.
