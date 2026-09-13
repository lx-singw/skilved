# Security assurance and vulnerability management

Date: 11 September 2026. Status: baseline register. **All controls below are required/proposed; this document contains no passing runtime results.**

## Assurance register

| ID | Control objective | Threats | Evidence required | Gate |
|---|---|---|---|---|
| ASSUR-01 | Only server authority grants privileged roles | THR-01,12 | Role mutation denial, privileged identity inventory | R0 |
| ASSUR-02 | Each private object is owner/tenant/grant scoped | THR-02,03,11 | API/rules/storage/list/export negative tests | R1 |
| ASSUR-03 | Remote fetches cannot reach internal targets | THR-04 | Redirect, address, DNS and response-limit fixtures | R1 |
| ASSUR-04 | Untrusted content cannot authorise tools | THR-05,17 | Adversarial model/worker evaluation receipts | R2 |
| ASSUR-05 | Retries do not repeat external effects | THR-06,07 | Crash/replay/cancellation tests | R2 |
| ASSUR-06 | Private uploads remain quarantined until permitted | THR-08 | Upload/scan/preview retrieval tests | R1 |
| ASSUR-07 | Share expiry/revocation is accurately enforced and explained | THR-09,11 | Live grant checks, TTL tests, UI comprehension | R2 |
| ASSUR-08 | Abuse cannot create unbounded routine work | THR-13 | Quota, queue-depth and spend-response exercise | R2 |
| ASSUR-09 | Telemetry and provider payloads are minimised | THR-14 | Payload inventory and synthetic-data redaction tests | R2 |
| ASSUR-10 | Youth interaction has staffed safeguarding process | THR-15 | Escalation drill, age-appropriate design and review | Before affected feature |
| ASSUR-11 | Build and deployment are traceable and reversible | THR-16 | Artefact provenance, dependency review, rollback drill | R2 |
| ASSUR-12 | Recovery preserves deletion and access decisions | THR-18 | Isolated restore and reconciliation evidence | R2 |

Maintain implementation status as: planned, implemented/unverified, tested/pass, tested/fail, exception, retired. Every result includes build, environment, date, tester, evidence pointer and expiry/retest trigger. Empty evidence is not a pass.

## Vulnerability handling

Before public launch, establish a monitored security contact and a plain reporting policy. Do not invent a working email address in product copy before provisioning it. Reports should include affected feature, reproduction, impact and safe evidence; discourage accessing other people's data or destructive tests. Acknowledge within a published response window that matches actual staffing.

Triage by exploitability, data sensitivity, affected users and scope. Active exposure takes incident precedence. Assign an owner, containment, fix target and verification test. High-severity unresolved access failures block release; lower-risk exceptions require a written reason, compensating control, expiry and review. Never automatically accept a vulnerability because a scanner labels it low or because a dependency update is inconvenient.

## Secure change review

Changes to authentication, roles, file handling, model tools, URL fetching, payments, tenant boundaries and migrations require explicit abuse-case review. Inspect dependency licences and security advisories for introduced packages. Pin and review the actual security standard version used; mapping to ASVS is a later evidence exercise, not a compliance badge.

For a solo developer, an AI-assisted review is useful but cannot supply independent organisational assurance. Obtain targeted external review before sensitive institutional integrations or broader youth social features when the risk warrants it. Record any lack of independent review as a residual risk.

## Evidence handling

Keep sanitised test summaries in version control. Store raw penetration-test reports, private findings, credentials and identifiable incident details in restricted systems with retention controls. Public security statements must describe verified present controls and limitations. Do not claim ISO 27001, SOC 2, penetration testing, end-to-end encryption or government certification without the relevant evidence and scope.

Release sign-off draws from this register and [validation and release](../quality/11_VALIDATION_AND_RELEASE.md). The [threat model](01_THREAT_MODEL.md) supplies scenarios; an implementation ticket alone cannot close them.
