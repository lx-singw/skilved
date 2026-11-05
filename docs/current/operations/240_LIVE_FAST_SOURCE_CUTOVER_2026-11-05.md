# Live fast shadow-source cutover and access cleanup

5 November 2026. The founder explicitly approved temporary Source-role access for the controlled pause, held-history import and fast shadow-policy adoption, followed by restoration of reviewer-only access. This operation is now completed in staging. No worker or public publishing service is started.

## Identity and temporary access

Genuine Google sign-in verifies the existing Firebase account, expected Cloud account, source owner and active reviewer-only operator. Browser automation did not complete sign-in; the founder completed it in Chrome. An initial verifier attempt refused before a grant because the private helper omitted the staging quota project. Read-only probes reproduced the failure and verified the correction. The helper then reused the founder's actual Google session; no custom token, impersonated user or relaxed authentication check was used. A separate existing-Cloud-session identity exchange was rejected and made no Source-role change.

`Catalogue.operator()` now enforces an optional per-role `roleExpiries` deadline. Malformed or expired deadlines deny that role; other roles and existing roles without deadlines retain their prior behaviour. The temporary Source grant had a ten-minute deadline as a fallback, plus explicit cleanup. Source operations still use normal Firebase identity verification and the server-owned Source role. Backend ID tokens stay in process memory and are cleared after completion, not written into proofs or environment files. The browser signs out of its temporary Firebase session after preparation.

## Actual operation

The normal Source API pauses revision 3 as revision 4. A fresh coherent inventory and external-run check show no pending legacy work, active source worker or future scheduled task. The reviewed plan contains exactly 21 historical notices, with all proposed jobs held and excluded from latency measurements. An independent process re-reads the protected inventory and verifies the complete target policy and unchanged two-call allowance before authorizing the exact plan hash.

At **14:31 UTC / 16:31 SAST**, normal Source-role APIs import the create-only held metadata and atomically adopt revision **5**. The source is unpaused in **shadow** mode with a 120,000-ms discovery interval, three concurrent slots and a 600,000-ms lease. These are configured limits, not evidence of an operating scheduler or achieved throughput. The existing two-model-calls/day cap, source permissions, discovery bounds and other policy fields are retained. The application-layout opt-in remains unchanged.

The exact runtime active-job query succeeds against staging before and after import. No manual index is created; backend query readiness is observed for the existing query. This is not burst/load or freshness-SLO qualification.

## Independent final verification

A separate readback at **14:32 UTC / 16:32 SAST** verifies:

- Source revision 5 exactly matches the reviewed shadow target.
- All 21 imported notices/jobs retain their reviewed metadata, stay held and remain latency-ineligible. There are zero active fast jobs.
- Every retained non-source collection is byte-for-byte unchanged, including jobs, snapshots, drafts, all model ledgers, calls, caches and usage. Existing source-version history is retained and the new version is added.
- The operator document exactly matches its original reviewer-only state. No active worker grant or service-account IAM delegation remains.
- Six private drafts and zero public records remain. No source retrieval, model request, application action or publication is performed.

The temporary loopback cutover helper is stopped after verification; the separate applicant pilot is not stopped. Private identity, role, inventory, plan, review and readback proofs remain under ignored `.artifacts/live-fast-cutover-2026-11-05/`. No private source bodies, provider responses, credentials or personal identifiers are committed.

## Checks and next work

All 37 affected operator, Source-adoption and expiry checks pass in demo emulators. Expiry tests cover the exact boundary, future and malformed deadlines, and unaffected reviewer access. Whitespace checks pass. The normal Source-role operations and cleanup also have the actual staging evidence above; emulator results are not substituted for that evidence.

Next: reconcile fast source revisions and cached/historical refresh, attach the reviewed machine-identity runtime with stop/restart evidence, and connect eligible private results to a regularly refreshed read surface. Real V32 mixed-batch quality/capacity and automatic publication/freshness acceptance remain required. A configured fast source with held history is not yet a running unattended publisher. Hosting and public publishing remain off.
