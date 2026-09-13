# Incident response and recovery playbook

Date: 11 September 2026. Status: proposed operating procedure; contacts, backup configuration and drills remain to be established before public operation.

## Ownership and severity

The founder initially holds incident commander, engineering and communications responsibilities. Name a backup only after that person accepts the role and access. Do not advertise round-the-clock response without staffing.

| Severity | Examples | Immediate posture |
|---|---|---|
| P0 | Active cross-user disclosure, compromised privileged account, harmful unauthorised external actions | Stop affected access/effects; preserve evidence; begin impact assessment immediately on detection |
| P1 | Suspected private-data exposure, widespread inability to prepare, corrupt source publication | Contain affected service; investigate urgently; communicate known impact |
| P2 | Isolated task failures, partial source outage with clear labels | Queue workaround and repair during published support coverage |
| P3 | Cosmetic issue or improvement request without material harm | Normal prioritisation |

Severity describes impact, not the reporter's seniority. A safety report involving a minor may require urgent handling even with few affected users.

## First response sequence

1. Open an incident record with UTC timeline, reporter, affected build/services and known facts. Use a restricted location for private evidence.
2. Contain narrowly: disable a compromised integration, pause external-effect workers, revoke a key/session, hide unsafe listings or deny the exposed route. Preserve a safe read-only path where possible.
3. Preserve relevant logs/configuration and hashes without creating unnecessary copies of private data. Do not destroy evidence through a blind redeploy or indiscriminate deletion.
4. Identify affected subjects, data types, recipients, time window, external actions and whether exposure is confirmed or suspected.
5. Decide technical recovery and applicable notification duties with the accountable privacy role and qualified advice where needed. Document the decision and its basis.
6. Communicate what happened, current impact, action taken and next update point. Do not speculate about causes or promise recovery times not supported by evidence.
7. Restore in isolation, validate ownership/deletions and only then re-enable affected functions.
8. Review root causes, missed detection, user remedies, cost and prevention work. Link follow-up tickets to tests.

POPIA notification handling must follow applicable law and current regulator procedures; do not reuse the historical blanket “72 hours” statement. The regulator describes notification requirements and reporting routes on its [POPIA page](https://inforegulator.org.za/popia/). The [trust policy](10_TRUST_PRIVACY_AND_SAFETY.md) contains the broader legal review boundary.

## Scenario runbooks

**Leaked sharing link:** revoke grant, invalidate caches/links where supported, determine whether issued links remain live, inspect access logs, tell the owner what revocation can and cannot undo, and assess whether unauthorised disclosure occurred. Never assure the user that downloaded copies disappeared.

**Prompt injection or rogue worker:** pause the relevant action class, quarantine source/task, preserve the mandate and tool receipts, rotate only credentials plausibly exposed, inspect other tasks using that source/model version and add a regression fixture before resuming.

**Incorrect live deadline or scam listing:** unpublish or mark unsafe, preserve source revisions, identify saved workspaces, deliver a factual correction to affected users through authorised channels, and review source trust. Do not silently edit the public record while leaving previously notified users with the old date.

**Lost database or destructive migration:** stop writes, choose a known recovery point, restore into an isolated environment, reapply deletion/revocation ledger, validate counts and representative records, reconcile pending external effects, and approve controlled cutover. Never replay all queued messages blindly.

**Account takeover:** revoke sessions/tokens, restrict affected grants and external effects, verify recovery using an appropriate process, inspect changes, restore only trustworthy data and notify affected parties as applicable. Do not request a password through support chat.

## Recovery objectives and evidence

The planning target is at most 24 hours of data loss and restoration within one founder working day for the initial service, conditional on affordable configured backups and a successful drill. These are proposed internal objectives, not a contractual SLA. If the actual backup plan cannot support them, change the objective or delay the affected launch; do not publish an untested promise.

Record recovery point, start/end times, restored counts, failed checks, outstanding loss and decision maker. Conduct a pre-public-release restore exercise, then repeat after material storage/permission changes and on a documented operating cadence. A backup job reporting success is not a restore test.

## Incident record template

Incident ID; severity and rationale; commander; detection time; affected versions; facts/unknowns; timeline; containment; affected users/data; notification assessment and action; recovery checks; residual impact; communication copies; root cause; corrective owners/dates; closure evidence. Store only a sanitised summary in the public repository.
