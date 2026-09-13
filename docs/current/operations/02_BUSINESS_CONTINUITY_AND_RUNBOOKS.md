# Business continuity and operational runbooks

Date: 11 September 2026. Status: procedures to implement and rehearse. No production command is provided without a confirmed resource inventory.

## Continuity priorities

Preserve private data and user authority first, keep existing work readable where safe, then restore preparation and source freshness. Suspend optional AI enrichment and high-volume crawling before exhausting resources needed for record access. External submissions, if introduced later, require explicit reconciliation after any interruption.

## RB-01: deploy

Confirm reviewed commit, reproducible artefact, configuration diff, migration compatibility, test evidence and rollback target. Check current incidents and outstanding background effects. Deploy to a safe environment, run ownership and critical-flow checks, then use controlled production rollout. Observe errors, queue lag, access denials, task duplication and cost signals. Record artefact ID, operator, time, checks and decision. If a gate fails, stop expansion and use rollback procedure.

## RB-02: rollback

Determine whether the failure is code, configuration, schema, credentials or external dependency. Pause affected writes/effects if necessary. Roll back only to a schema-compatible artefact. A database migration may require forward repair rather than code rollback; inspect the prepared migration plan. Reconcile tasks already accepted by providers. Verify core flows and access boundaries before reopening. Record any data loss or unresolved effects explicitly.

## RB-03: agent/task failure

Inspect task ID, mandate, attempts, lease, source/model version and last receipt using authorised diagnostics. Separate retryable transport failure, permanent invalid input, revoked mandate and uncertain external effect. Retry safe idempotent work with backoff. Quarantine poison messages after the configured attempt policy. An uncertain external effect requires reconciliation before retry. Inform the user of delayed/failed status and preserve saved work.

## RB-04: source outage or schema drift

Pause publication from affected parser/source; retain source check history. Compare a permitted snapshot with expected fields. Mark public freshness accurately, keep genuine source links available and prevent unknown dates becoming new future deadlines. Repair with regression examples, review critical fields and resume gradually. If access permission changed, use the authorised fallback instead of bypassing controls.

## RB-05: unexpected spend

Inspect service/SKU, time window, legitimate workload, retries, bot traffic and recent release. Pause the responsible optional job class; tighten concurrency/quotas and stop accidental loops. Confirm that budgets/eligible provider spend controls are configured as intended, recognising lag and uncovered charges. Preserve user access and data where possible. Reforecast recurring exposure before resuming. Never delete important data merely to reduce an unexplained bill.

## RB-06: provider outage

Confirm outage through observed failures and provider status. Open an incident if impact warrants. Serve safe cached public facts with stale labels; retain drafts only through approved mechanisms. Queue retryable work within bounded backlog limits. Do not silently switch private data to an unreviewed model/provider. On recovery, drain gradually, deduplicate and report any missed checks.

## RB-07: backup restore

Choose a documented recovery point; restore into isolated resources; verify ownership, representative records, object references, counts and schema. Apply deletion and revocation ledger before user access. Reconcile queued tasks and provider receipts. Record achieved recovery point/time and approve cutover. Destroy temporary restore resources only after their paths/resources and retention obligations are explicitly verified.

## RB-08: founder unavailable

Maintain a private continuity note containing critical accounts, safe recovery route, current customer commitments, payment/renewal dates and authorised backup contact if one exists. Reduce promises and pause time-sensitive onboarding when coverage is unavailable. No one gains broad access merely because they are a relative or customer. Establish a legally and operationally appropriate succession/access arrangement as the business becomes material.

## RB-09: orderly service closure or long pause

Stop new commitments, assess customer agreements and obligations, notify users through authorised channels, provide an appropriate export window, stop recurring external effects, reconcile charges/refunds and execute the retention/deletion plan. Preserve records that must legitimately remain. Revoke vendor access and document closure. Do not strand users' only copies of their career evidence.

## Drill record

Runbook ID; scenario; build/environment; participants; start/end; actions; observed result; user/data impact; failed assumptions; corrective tickets; next rehearsal. Before public release, rehearse deployment/rollback, task failure and restore; also conduct an incident tabletop. Later exercises follow material changes and measured risk. See [release assurance](../quality/11_VALIDATION_AND_RELEASE.md).
