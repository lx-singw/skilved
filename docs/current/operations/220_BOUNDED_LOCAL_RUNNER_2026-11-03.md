# Read-only waiting and a bounded local runner

3 November 2026. Follow-up to [real controller resumption](219_LIVE_CONTROLLER_RESUMPTION_2026-11-03.md), within the [autonomous opportunity target](../engineering/17_AUTONOMOUS_OPPORTUNITY_SYSTEM.md).

Later checkpoint: the overnight process described below failed authorization at **17:13 SAST**, before any tick or source/model request. Its application-grant cleanup required a fresh authenticated recovery. See [actual failure, verified cleanup and credential expiry correction](221_LOCAL_CREDENTIAL_EXPIRY_RECOVERY_2026-11-03.md). The active-wait section is the earlier checkpoint, not current process status.

## Delivered behavior

`runRecentJobsController` repeatedly obtains a verified controller, probes current work, waits for eligibility and runs bounded ordinary ticks. Each renewed controller must retain the same source ID, revision and machine principal. Ready continuation delays are honored; long waits use intervals of at most one minute. Runtime uses a monotonic bound, with explicit maximum ticks, and malformed work/wake metadata fails rather than spinning. Configuration, identity and authorization errors stop the runner rather than silently granting or retrying access.

`RecentJobsController.probe()` performs the existing authority/grant/source/admission and queue/lease checks in an SDK **read-only Firestore transaction**. Writes are rejected by the SDK. Idle polling adds no audit or controller rows and does not schedule work, fetch notices or reserve models. Actual ticks retain their normal audit/provenance writes and the shared per-model/source accounting.

SIGINT/SIGTERM cancels an idle wait. An already admitted job drains through the normal worker; the controller then checkpoints without claiming another job. Runtime limits are soft while that job drains. They do not cancel an admitted provider request, refund its reservation or create an exception by pretending the network request never occurred. A process crash remains recoverable through existing durable jobs and leases.

The packaged launcher adds a separate `SKILVED_STAGING_WORKER_RUNNER=true` opt-in, which requires controller mode and the existing worker activation. Defaults are **2,700 seconds / 24 ticks**, leaving drain headroom within the unchanged one-hour job template; configured bounds allow at most 43,200 seconds / 100 ticks. The template leaves runner/controller/activation off. No cloud timer or deployment is created. Attached runtime identity still needs qualification; repeated verification and an ADC client are not a grant or credential bootstrap.

Source identity, revision, trust, optional crawl choice, two-call ceiling, models/prompts and quota authority are unchanged. A provider-day reset alone does not make the source's spent daily allowance available.

## Verification

All **183 distinct checks pass**: 147 existing worker regressions, 18 controller integration tests, ten runner unit tests and eight staging guard tests. They cover an eight-hour virtual wait, exact reset resumption through normal extraction/validation, no-write probes, SDK-enforced read-only behavior, bounded continuation, expired/revoked access, clock changes, identity changes, corrupt wake data, lease concurrency and graceful job drain. A runtime deadline is checked between claims inside a tick, so only its already admitted job drains. Tests use authored synthetic provider data in isolated emulators; they are not new live AI qualification.

The final worker image builds as `node`. Network-disabled checks compare exact worker/controller/runner/launcher/guard hashes, load the read-only probe, exercise a virtual reset, and reject disabled startup. The web image is not rebuilt and no container is deployed.

Fresh cloud preflight at 14:12 UTC / 16:12 SAST verifies the same pending validation job and previous source/model/draft history. Its 3 November source day remains at two calls, although the independent provider day has advanced to 3 November. Six private drafts and zero public records remain unchanged.

## Real stop and renewal test

A bounded local process uses genuine Google-verified delegated staging machine identity, a source-scoped ingest-only grant and existing shared quota authority. Public OAuth refresh callbacks obtain renewed in-memory access credentials under the same signed-in Cloud account. No service-account key is installed. For the short test, expired in-memory source/delegated credentials force renewal; two real refresh callbacks complete, and a subsequent Google machine identity verification and database probe succeed.

Nineteen authorized idle probes perform **zero ticks, source fetches or model calls**. SIGTERM stops the wait cleanly. Exact before/after readback verifies every catalogue collection unchanged, including audit/control data, model budgets/usage/caches and six private drafts. The prior inactive ingest grant is restored, the test's temporary IAM delegation is removed and original bindings survive. This qualifies the tested delegated local path, not attached hosted identity or long-duration availability.

## Active bounded overnight trial

At **14:40 UTC / 16:40 SAST**, a separate local WSL process enters waiting state for **22:00 UTC on 3 November / 00:00 SAST on 4 November**. An initial wait was stopped with all catalogue state unchanged and access cleanup verified before rearming the final drain-bound code. It uses source revision 3, the existing optional crawl opt-in and the registered Gemini lane from the preceding controlled trial. Credential renewal checks the original Cloud account; a changed account or source/identity/access policy stops the process. There is no standing account switch or automatic role bootstrap.

This trial permits **one actual controller tick**, up to **nine hours of runner time**, with the unchanged two-call source ceiling and a twelve-request native acquisition cap. The current job is still unvalidated. Its original source, freshness and all normal gates will be checked again at execution; a successful draft is not guaranteed or claimed in this checkpoint.

The application grant and service-account-only delegation are intentionally active for this trial, with **ten-hour absolute expiries**, approximately **02:40 SAST on 4 November**. They are not permanent permissions. On completion, stop or failure, the process attempts to restore the inactive application grant and remove its own IAM binding. A hard process/machine failure can prevent that cleanup; expiry still limits access. Unlike the completed stop test, overnight access has **not** been reported as removed before its work runs.

The machine and WSL must remain running for the scheduled attempt. This local process is not a hosted service, crash-restarting supervisor or production scheduler. Hosting and public publication stay off. The source remains shadow-only and the grant has no publish role.

Private plans, code hashes, PID, credential/access receipts and logs are under `.artifacts/groq/recurring-runner-2026-11-03/`; results and cleanup are recorded when the process finishes. The private stop helper checks the process command line before sending SIGTERM. Next follow-up is to read the actual overnight result and verify cleanup, then qualify durable attached identity, monitoring/recovery, AI completeness and broader employer/method/publication behavior.
