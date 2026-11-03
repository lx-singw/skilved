# Local credential expiry and failed-wait recovery

3 November 2026. Follow-up to the [bounded local runner](220_BOUNDED_LOCAL_RUNNER_2026-11-03.md), within the [autonomous opportunity target](../engineering/17_AUTONOMOUS_OPPORTUNITY_SYSTEM.md).

Later checkpoint: the replacement wait described below stopped at **22:36 SAST**, before any work, with cleanup completed. See [independent readback and shared identity diagnostics](222_WORKER_IDENTITY_DIAGNOSTICS_2026-11-03.md). Its underlying failure cause was not retained by the earlier sanitized identity helper; the waiting section is a historical checkpoint.

## Actual failure and cleanup

The earlier overnight process stopped at **15:13 UTC / 17:13 SAST**, after thirty read-only probes and before its midnight work. It reported `WORKER_UNAUTHORIZED`; its operator cleanup/readback also received an authentication rejection. No source fetch, provider request or controller tick occurred. The service-account IAM delegation was removed, but the application grant restoration failed. The initial cleanup receipt's `oldGrantRestored` boolean incorrectly described attempted restoration; its accompanying error already showed failure. That boolean is not accepted as cleanup evidence.

A fresh authenticated recovery at **18:54 UTC / 20:54 SAST** compares the current grant with this trial's exact purpose, source, roles and expiry, then restores the original inactive grant in a transaction. Independent readback verifies every catalogue collection equal to the pre-trial snapshot and the trial's IAM delegation absent, with original bindings preserved. Six private drafts and zero public records remain. Historical source/model spending, holds, cache and the queued validation are unchanged.

## Credential correction

The private local helper had assigned an estimated forty-five-minute expiry to an access token returned by `gcloud auth print-access-token`. A cached token can have less remaining lifetime; a successful forced refresh alone did not qualify a long wait. The saved failure does not establish the exact expiry of that earlier token, but the invented expiry is a concrete defect and has been removed.

The reusable local-tool adapter, `packages/catalogue/tools/gcloud-credentials.mjs`, obtains structured credentials using `gcloud config config-helper --min-expiry=10m --format=json`. It preserves the reported absolute expiry, rejects missing/invalid/near-expired metadata, and supplies the same metadata through the SDK's refresh callback. The original CLI account is checked before and after acquisition; unexpected credential overrides or emulator/ADC environment conflicts fail closed. CLI output is captured in memory and command failures are sanitized. It does not install credentials, create grants, change ADC, or retry failed worker authorization by granting access.

This adapter is for local operator tooling. The deployed runtime's attached ADC path and worker image are unchanged. The private launcher now records restoration as successful only after successful write/readback; failed final readback receives its own sanitized receipt.

## Verification and next attempt

All **24 focused offline checks pass**: six credential tests, ten existing runner tests and eight staging guard tests. They cover the SDK refresh path with reported expiry, account changes, credential conflicts, malformed lifetime/token data and sanitized failures, plus existing reset/wait/runtime/stop controls. A real operator database read succeeds before and after forced credential renewal, with the source unchanged and the refreshed expiry equal to current CLI metadata. No provider call is used for this proof.

A replacement short local test verifies the genuine Google-signed machine identity again after two forced source-credential refresh callbacks. Ten read-only probes complete with zero ticks, source requests or provider calls. SIGTERM stops the process, successful cleanup restores the inactive grant and removes the trial's delegation, and independent before/after readback verifies every catalogue collection unchanged. This is a short forced-renewal test; it does not qualify natural long-duration renewal.

At **18:59 UTC / 20:59 SAST**, the replacement detached WSL process enters waiting state for **22:00 UTC on 3 November / 00:00 SAST on 4 November**. Independent readback verifies its live process, matching source-scoped ingest-only grant, IAM delegation and unchanged catalogue state apart from the temporary grant. Ordinary public handlers still return an empty feed, 404 for all six private records, disabled reports and no-store responses.

The replacement permits **one controller tick**, at most **five hours of runner time** with ordinary admitted-job drain, and twelve native source requests. It retains the two-call source ceiling. Both temporary access grants have six-hour absolute expiries, around **03:00 SAST on 4 November**, and cleanup is attempted on stop, failure or completion. The current trial's access is intentionally active, not reported as removed. The same machine and WSL must remain awake. Its midnight result, natural credential renewal and final cleanup remain pending; this is not a hosted scheduler or crash-restarting service.

Hosting and public publication remain off. The existing source revision, optional employer-crawl policy, two-call source-day ceiling, provider authority, queued work and extraction/validation versions remain unchanged. Private failure, recovery and retry artifacts remain under ignored `.artifacts/groq/` directories.
