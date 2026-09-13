# Integration, compatibility and migration policy

Date: 11 September 2026. Status: target policy. No government, employer, SA Youth/Harambee or credential-provider integration is established by this document.

## Integration tiers

| Tier | Capability | Entry evidence |
|---|---|---|
| 0 | Genuine external link and user-readable selected export | Accurate destination, provenance, consent and readable output |
| 1 | Permitted public source ingestion | Source-specific access/reuse review, rate limits, parser tests and monitoring |
| 2 | Agreed data feed or referral exchange | Written scope, contact, schema, authentication, rights and correction process |
| 3 | Authenticated read of user-authorised external records | Approved interface, purpose/permissions, revocation, transfer review and audit |
| 4 | External application/action submission | Explicit applicable mandate, recipient agreement, idempotency/reconciliation, review and error handling |

Tier 0 supports early complementarity. A government roadmap or partner signup page does not imply an API entitlement. Begin conversations with a specific task or referral friction and measurable benefit rather than promising broad integration.

## Adapter contract

The dedicated [ATS adapters and application-route strategy](03_ATS_ADAPTER_STRATEGY.md) defines source tracing, platform/tenant detection, assisted completion, candidate identity, submission receipts and phased rollout. It is the current successor to the original ATS proposal.

Each adapter declares provider/source ID, version, allowed hosts, auth method, accepted inputs, output schema, field provenance, rate policy, timeouts, retryable/permanent errors, privacy classification and owner. External effect adapters additionally define idempotency key, receipt, reconciliation query, cancellation limit and uncertain-state handling.

Separate discovery, extraction and execution. An opportunity source cannot become an authorised submission destination merely because it supplies an application link. Revalidate redirects and destination authority. Never bypass access controls, CAPTCHAs or private endpoints to satisfy an integration promise.

## Compatibility

Version public API contracts and exports when consumers exist. Prefer additive changes; document semantic changes, deprecations and migration windows according to actual customer agreements. Unknown enum values must fail visibly or degrade safely, not map silently to “job” or “verified”. All six category values require round-trip tests through source, API, UI, workspace, export and analytics.

Use schema version, created/updated timestamps and stable identifiers. Distinguish mutable current records from immutable application snapshots. Export should remain useful without Skilved through readable files and documented machine-readable structure where appropriate. Standards such as CLR or verifiable credentials are later interoperability options requiring recipient/issuer adoption, not automatic acceptance.

## Database migration procedure

Document purpose, affected data, invariants, read/write compatibility, estimated workload/cost, backup/recovery, test dataset, dry-run results and rollback/forward-repair plan. Use staged expand/migrate/contract where appropriate. Make jobs restartable and auditable. Verify counts, ownership, references, category preservation, grants, deletions and representative records. Do not drop old fields until dependent readers and exports are accounted for.

The Firestore versus relational-database checkpoint is driven by real organisation/reporting/query/transaction needs and measured cost. Do not migrate merely to appear enterprise-ready; do not retain the original choice if evidence shows it blocks essential correctness.

## Model/provider migration

Keep model name/version, prompt, schema and evaluation results together. Test candidate models on the same held-out tasks and adversarial cases, including cost/latency and abstention. A provider switch receiving private data also triggers vendor/privacy review. Roll back a regressed model configuration without corrupting historical receipts. Preserve which version produced a draft.

## Partner onboarding acceptance

Complete sandbox contract tests, invalid/replay/revocation tests, data mapping review, contacts/escalation, rate/cost estimates, source correction path and user-facing explanation. Release narrowly with real monitoring. Record what was actually agreed; a prototype demonstration is not an accepted production partnership.
