# V31 cohort result and deferred validation

4 November 2026. Follow-up to the [bounded V31 publisher cycle](224_V31_PUBLISHER_CYCLE_ARMED_2026-11-04.md), within the [autonomous opportunity target](../engineering/17_AUTONOMOUS_OPPORTUNITY_SYSTEM.md).

## Actual cohort result

The local worker resumes at the ordinary **02:00 SAST** publisher boundary, completes two controller ticks and stops at **02:03:43** because its remaining work is deferred. Two discovery pages produce a frozen inventory of **twenty notices before any detail outcome**. All twenty receive fresh detail handling; no saved source hold is reused. Forty-six native retrievals cover publisher pages, normal robots checks and the qualifying employer notice.

The twenty detail outcomes are nine unsupported-precision holds, seven not-open holds, one unsupported original, one category conflict, one category-review hold and one quota-deferred candidate. These are bounded archive results, not proof that every held notice is unsuitable or that all original-source methods are supported.

Exactly **one real Gemini 3.5 Flash Lite extraction request** is received under **V31/Groq V8**. Its practical evidence retains the complete four-step assessment list verbatim, including the heading. The source and original-employer notice match through the normal resolver; the application destination remains the original employer. Local mapping and material checks pass. The candidate stays unapproved and unvalidated: the subsequent validation reservation reaches the source's spent daily ceiling and is deferred without making a validation API request.

The **4 November SAST source ledger records two calls in total**: the earlier midnight validation and this new extraction. Prior source budgets, model calls/cache and other immutable history survive; shared usage counters advance normally. The source cap remains two and the provider's separate Los Angeles day is not reset. The same pending job retains its extraction, source bindings and **00:00 SAST on 5 November** wake instead of becoming a terminal failure.

Cleanup completes at **02:03:53 SAST**. Independent readback at **06:32 SAST** matches the final snapshot and verifies the inactive application grant, removed trial delegation, preserved original IAM bindings and historical accounting. Six private drafts remain unchanged; zero public records exist. Ordinary public reads retain an empty feed, 404 for all six private records, disabled reports and no-store responses. The completed cycle process is no longer active.

## Deferred local start without standing worker access

The new local-tool admission gate, `scheduled-worker-start.mjs`, accepts a strict UTC start window of at most two hours. It invokes a supplied privileged bootstrap only while that window is current. Early, invalid and expired starts do not invoke the callback; failed bootstraps are not automatically retried. The helper provisions no credentials, timer, grant or publication capability.

A one-shot Windows Task Scheduler entry, **Skilved-Shadow-Validation-20261105**, is registered for **23:40 SAST on 4 November**, preparing for the job's **00:00 SAST on 5 November** quota renewal. It runs under the current signed-in Windows user at Limited privilege and launches the WSL backend directly. The task definition contains no API credentials. Windows requests wake-up and start-when-available behavior; the computer must remain powered on, plugged in and signed in. This is not a hosted scheduler or an unattended service that survives every machine/account failure.

Before admitting real work, the private bootstrap verifies pinned code hashes and the unchanged Cloud account, source policy, authority and saved pending job. An atomic start receipt and Task Scheduler's IgnoreNew setting prevent duplicate bootstrap attempts. A start at or after **00:30 SAST on 5 November** is refused; it does not silently run a stale qualification later. The task's finite trigger expires and is configured for later removal.

No application or IAM grant is kept active during today's wait. Only the admitted evening bootstrap can create the same source-scoped ingest-only grant and service-account-only delegation, both with two-hour absolute expiries. The backend then allows one ordinary controller tick, up to ninety minutes with admitted-job drain and twelve logged native retrievals. Native acquisition remains blocked before the saved source-reset time. Current publisher/original evidence is checked again; the normal cache, validation, source limits and semantic gates decide the outcome. Changed evidence can require fresh model work within the unchanged source-day ceiling. Approval, public publication and a successful validator response are not assumed.

The task's test launch runs the same bootstrap in explicit preflight mode. It verifies the WSL user, working directory and code hashes and exits before importing cloud clients or creating grants. The real action is installed only after that test completes successfully. A UTC-to-SAST conversion in the generated trigger is corrected before any real activation; native/cmdlet readbacks and the saved manifest agree on **23:40 SAST**. The original and corrected receipts remain private. PowerShell's execution policy is unchanged.

Independent readback after registration verifies the actual scheduled task, successful preflight, unchanged cloud collections, no active ingest grant and no new IAM delegation. Today's worker access has been removed. The future validation result and that future attempt's cleanup remain pending. Code, account or policy changes before the scheduled time can cause a safe refusal requiring operator follow-up.

## Verification and limits

All **48 focused checks pass**: six new scheduled-start admission tests, twelve identity tests, six credential tests, ten runner tests, six selection-process tests and eight staging guard tests. They cover early/missed activation, exact UTC boundaries, malformed/overlong windows, clock rechecks and no automatic bootstrap retry. The actual Windows-to-WSL preflight succeeds with zero provider calls or grants. The backend bootstrap passes syntax checks, while its source/worker code remains the previously qualified V31 path. No live provider call is made after the cohort audit.

V31 now has one live local-check success and a persistent validation wait. Independent semantic acceptance, a new validated draft, broader employer/method coverage, durable hosted operation and public publication qualification remain open. Hosting and publication stay off. Raw pages, provider outputs, source/job manifests, task XML, schedule/cleanup proofs and future results remain under ignored `.artifacts/groq/` directories.
