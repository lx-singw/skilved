# Threat model and abuse cases

13 September M0 extension: the [companion contracts](../engineering/04_DISCOVERY_COMPANION_IMPLEMENTATION.md) and [DCF-09/10/12/16/22](../quality/02_DISCOVERY_COMPANION_ACCEPTANCE.md) cover anonymous-link SSRF, DNS/redirect abuse, source prompt injection, receipt enumeration/leakage, shared-device progress, coordinated reports and stale unsafe cache projections. These are exposed-feature requirements; a hidden navigation item is not a security boundary.

Date: 11 September 2026. Status: design assessment requiring implementation tests. Accountable role: engineering/security; founder initially. Read with [trust policy](10_TRUST_PRIVACY_AND_SAFETY.md).

## Assets and boundaries

Protect personal career records, identity/contact data, private attachments, references, organisation membership, source integrity, agent mandates, external action receipts, credentials and operating funds. An inaccurate public deadline can harm an applicant even without a conventional security breach.

Trust boundaries are: browser to authenticated API; API to database/object store; public source to crawler/parser; parser to model; model output to deterministic execution; scheduler/queue to worker; person to invited recipient; organisation to another organisation; staff support to user data; infrastructure control plane to deployed services. Treat all remote content and model output as untrusted data.

## Threat register

Ratings are prioritisation judgements, not measured probabilities. A critical exposure blocks the affected release until controlled and tested.

| ID | Scenario | Initial priority | Prevention/detection | Required evidence |
|---|---|---|---|---|
| THR-01 | User edits a role field and acquires admin access | Critical | Server-controlled roles/claims; deny client role mutation; audit elevation | Attempt self-promotion with a real non-admin token and direct database access |
| THR-02 | User substitutes another record/file ID | Critical | Owner/tenant/grant check on every server operation and storage path | Cross-user API, export, object and list tests |
| THR-03 | Public or authenticated-wide file rule exposes screenshots/IDs | Critical | Private storage, explicit grant, constrained preview | Anonymous and unrelated-user retrieval both denied |
| THR-04 | Crawler follows a URL to cloud metadata/internal services | High | Scheme/host/address checks, redirect revalidation, network controls, size/time limits | Loopback, private ranges, redirects and DNS-change cases rejected |
| THR-05 | Webpage/document instructs the agent to exfiltrate records | Critical | Isolated extraction context, narrow tool schema, no unrelated private context, execution authorisation | Prompt-injection fixtures cannot trigger data access or sharing |
| THR-06 | Forged queue/webhook message creates an external action | Critical | Authenticated sender, signed events where supported, replay/idempotency checks | Invalid signature, stale event and repeated event tests |
| THR-07 | Retry duplicates a notification, export or later application | High | Durable action ledger, idempotency key, explicit uncertain state | Crash before/after provider response does not blindly repeat effect |
| THR-08 | Malicious attachment executes content or exhausts parser | High | Quarantine, scan policy, MIME validation, sandbox/resource limits, safe preview | Polyglot, oversized and active-content fixtures |
| THR-09 | Shared link leaks through referrer, logs or indexing | High | Opaque tokens, short appropriate TTL, no indexing, log redaction, restricted referrers | Link not in public analytics/cache/search; revoke semantics tested |
| THR-10 | Fake issuer/AI extraction creates a fraudulent opportunity | High | Provenance, source review, critical-field checks, report/takedown route | Seeded false fee/deadline/issuer detected or held for review |
| THR-11 | Organisation retains access after user exit/revocation | Critical | Permission evaluated on current state; token/cache invalidation | Membership change denies subsequent reads and exports |
| THR-12 | Staff account compromise enables bulk record access | Critical | MFA, least privilege, audited just-in-time support access, export restrictions | Role matrix and support access drill |
| THR-13 | Bots create costly AI/fetch workloads | High | Per-user/project quotas, queue limits, anomaly alerts, deterministic checks first | Abuse load causes bounded rejection and leaves core access usable |
| THR-14 | Logs/model prompts contain private files or secrets | High | Redaction, payload minimisation, separated access, provider review | Synthetic secret/private-data probes absent from telemetry |
| THR-15 | Adult abuses youth group or reference invitation | Critical for affected feature | Age-appropriate participation, reporting/blocking, limited contact exposure, moderation ownership | Safeguarding tabletop and end-to-end report handling |
| THR-16 | Compromised dependency/build artefact reaches production | High | Lockfile, provenance/review, secret scanning, separated environments | Trace deployed artefact to reviewed commit and dependency review |
| THR-17 | A scored outcome unjustly excludes a person | High | No opaque automatic rejection; explain sources/unknowns; correction route | Counterexamples do not convert missing data into disqualification |
| THR-18 | Backup restores deleted accounts or old access grants | High | Deletion ledger and permission reconciliation after restore | Restore drill re-applies deletions and revocations before opening traffic |

## Repository observations requiring remediation

Static review found a user-editable role path in Firestore rules, broad authenticated screenshot reads, shared demo-user behaviour, simulated verification and publicly invocable generic worker infrastructure. These observations are not evidence of an actual breach; they identify implementation work and release blockers. Confirm exact current behaviour in S01/S02 rather than assuming documentation repairs code.

## Review procedure

For each new integration or feature, draw its data flow, identify assets and authority, add abuse scenarios, select controls, write adversarial tests and name the residual-risk owner. Reassess on new file types, public sharing, multi-tenancy, payments, under-18 participation, external submissions and country expansion. Threats do not close when a ticket is merged; they close when the relevant build demonstrates the control.

Use [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) as an external verification catalogue and pin the chosen release in the implementation assurance register. No ASVS level, penetration-test result or certification is claimed here.
