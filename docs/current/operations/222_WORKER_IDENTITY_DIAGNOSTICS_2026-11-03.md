# Bounded identity retries and safe failure diagnostics

3 November 2026. Follow-up to [local credential expiry recovery](221_LOCAL_CREDENTIAL_EXPIRY_RECOVERY_2026-11-03.md), within the [autonomous opportunity target](../engineering/17_AUTONOMOUS_OPPORTUNITY_SYSTEM.md).

Completed follow-up: the replacement runner naturally renews credentials, executes its midnight tick and cleans up access. Semantic validation rejects the incomplete candidate, with no draft/publication. See [audited midnight result and selection-process completeness](223_MIDNIGHT_VALIDATION_AND_SELECTION_PROCESS_2026-11-04.md). The waiting section below is the earlier checkpoint; that process has finished.

## Observed result

The reported-expiry trial stopped at **20:36 UTC / 22:36 SAST**, after 87 authorized read-only probes, before its midnight work. It reported `WORKER_UNAUTHORIZED`, with zero controller ticks, source requests or provider calls. Its cleanup completed successfully. Fresh independent readback at **20:56 UTC / 22:56 SAST** verifies every catalogue collection unchanged, the ingest grant inactive and the trial's IAM delegation removed, preserving original bindings. Six private drafts and zero public records remain.

The earlier identity helper sanitized all credential, transport and verification exceptions to the same code. Its receipt therefore does not establish whether this was an authorization rejection, transient upstream failure, account/credential change or token-verification error. The exact underlying cause remains unknown. The reported-expiry correction remains in place; this result does not qualify reliable unattended operation.

## Shared behavior

`workerPrincipal` now exposes safe failure details through a trusted backend diagnostic callback and the sanitized terminal error. Details contain only fixed stage names, attempt numbers, validated HTTP status numbers and allowlisted network/credential codes. They omit tokens, request URLs, credentials, provider bodies, raw messages, stacks and causes. The staging launcher writes these bounded details to its ordinary error log; private local runs retain the same schema.

Known transient failures during credential acquisition, token requests or signature-verification certificate retrieval permit **three total attempts**, with one- and two-second delays. Recognized cases are HTTP 408/429/500/502/503/504 and an explicit list of connection, temporary DNS and timeout errors. Each recovered token still undergoes the existing mandatory audience/signature and verified service-account checks. No source request, AI reservation or worker job is admitted by these retries.

SDK transport retries and timeouts still apply within each attempt. A complete end-to-end network deadline and reliable unattended operation require separate qualification.

HTTP 401/403, credential/account/configuration changes, unknown failures, missing tokens, invalid signatures and invalid principals remain hard stops. Persistent transient failures also stop after the third attempt. Diagnostic callbacks cannot change that decision or bypass verification. Cancellation interrupts retry waits and prevents admission of a principal after cancellation. The runner's existing source/revision/role checks and stable machine identity remain required.

## Verification and local continuation

All **36 focused checks pass**: twelve identity tests, six local credential tests, ten runner tests and eight staging guard tests. They exercise recovery followed by mandatory verification, certificate transport recovery, retry exhaustion, hard rejection, diagnostic sanitization/callback isolation and abortable real timer behavior. A rebuilt worker image runs as `node`; network-disabled verification compares the exact identity/launcher hashes, exercises transient recovery and immediate 403 rejection, and rejects disabled startup. No image is deployed.

The new short test verifies genuine Google machine identity after two forced credential refresh callbacks. Six read-only probes complete with zero ticks, source requests or provider calls. SIGTERM stops the wait. Independent readback verifies every catalogue collection unchanged, the inactive grant restored and the trial's IAM delegation removed, preserving original bindings. This proves the short tested renewal/stop path; it does not establish the cause of the previous failure or natural long-duration reliability.

At **21:02 UTC / 23:02 SAST**, a replacement detached WSL process enters waiting state for **22:00 UTC on 3 November / 00:00 SAST on 4 November**. Independent readback verifies its process, source-scoped ingest-only grant, temporary service-account delegation and unchanged catalogue state apart from that grant. Ordinary public handlers retain an empty feed, 404 for all six private records, disabled reports and no-store responses. Safe identity failure diagnostics and the first observed natural credential-renewal receipt are retained privately if those events occur.

The attempt permits **one controller tick**, five hours of runner time with ordinary admitted-job drain, twelve native requests and the unchanged two-call source-day ceiling. Its two access grants expire after six hours, around **05:02 SAST on 4 November**, and cleanup is attempted on completion, stop or failure. These trial grants are intentionally active; the current trial's midnight result and final cleanup remain pending. The machine and WSL must remain awake. No hosted scheduler or crash-restarting supervisor is deployed, and no successful midnight validation is claimed.

Hosting and publication remain off. Source revision 3, optional employer crawling, the two-call source-day ceiling, shared provider authority, prior spending/holds/caches, queued validation and extraction/validation versions remain unchanged. Durable attached identity, monitoring/recovery, broader model/method quality and public publication qualification remain open.
