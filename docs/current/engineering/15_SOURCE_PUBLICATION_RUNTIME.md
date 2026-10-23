# Source review and publication runtime — B03

Date: 25 September 2026. Local engineering implementation; source acquisition assessment and formal G0/G1 acceptance remain open. This extends the [B02 contract](14_CANONICAL_OPPORTUNITY_CONTRACT.md). The [B03 plan](../planning/07_B03_IMPLEMENTATION_PLAN.md) specifies the work; the [scraping plan](../operations/10_SOURCE_ACQUISITION_AND_SCRAPING_PLAN.md) records the founder's source clarification and remaining adapter selection.

## Runtime and commands

26 September implementation: [autonomous RecentJobs processing through feed publication](16_AUTONOMOUS_RECENTJOBS_PIPELINE.md) now has a separate durable worker, workload identity boundary, machine grants, evidence/policy validation, automatic audit/check provenance and public feed/detail/handoff. Its synthetic emulator tests pass; live qualification/deployment remain open. This page primarily documents the original operator-driven JSON workflow. The worker uses the shared transactional publication primitive, not the human `publish` command with model-generated approvals. See the linked worker document for its ten-minute leases, source policy and runtime limits.

`packages/catalogue` is a Node-only ESM package with strict runtime schemas, Firebase Admin transactions and protected operator commands. It does not import the legacy crawler samples or old database helpers. `@skilved/types/opportunities*` now resolves compiled JavaScript at runtime and source TypeScript for type information. Build contracts before running a direct package command; root `web:build`, `catalogue:test` and `catalogue:operator` do so automatically.

```
pnpm install --frozen-lockfile
pnpm contracts:typecheck
pnpm contracts:test
pnpm catalogue:test
pnpm web:lint
pnpm web:typecheck
pnpm web:build
pnpm web:test
pnpm catalogue:operator --help
```

Catalogue tests require Node 22, Java 21 and Firebase CLI 15.22.3. The root command starts Auth/Firestore on loopback 19099/18080 with project `demo-skilved-b03`, runs the tests and shuts them down. Ports must be free. It uses a separate deny-all rules file and never changes hosted rules or actual users. Test-created identities and notices are synthetic. CI installs the pinned CLI and Java; hosted CI execution is separate evidence.

## Configuration and identities

| Variable | Actual behavior |
|---|---|
| `SKILVED_CATALOGUE_MODE` | Unset/`disabled`: unavailable. `emulator` or `cloud`: explicitly selected integration |
| `SKILVED_CATALOGUE_PROJECT` | Required explicit project; emulator requires `demo-` prefix, cloud forbids it |
| `FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST` | Required loopback IPv4/port in emulator mode; production rejects all emulator variables before SDK initialization |
| `SKILVED_CATALOGUE_READS` | Exact `true` enables versioned read routes; default false |
| `SKILVED_CATALOGUE_REPORTS` | Exact `true` plus reads enabled exposes bounded report intake; default false |
| `SKILVED_OPERATOR_TOKEN_FILE` | CLI only: private file containing a current Firebase ID token; never a command-line token or browser public variable |

Cloud mode uses application-default credentials for SDK transport and a separate verified ID token for the human operator. It does not generate credentials or provision identities. Run this CLI only on a trusted protected backend host; do not distribute database service credentials to reviewers as an authentication shortcut. An OS administrator or IAM principal with direct database write access is outside the CLI's role enforcement and needs separate infrastructure controls. The operator's current `m0_operators/{uid}` record must be active and include `reviewer` or `source`, read inside each transaction. Request JSON, token role claims and legacy user-editable roles cannot grant access. Role bootstrap is deliberately absent from the public application and operator CLI: a separately authorized infrastructure administrator must provision actual operator roles. No real operator role was created by this task.

Authentication uses `verifyIdToken(token, true)` and fails generically; Firebase documents [ID token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens) and [revocation checks](https://firebase.google.com/docs/auth/admin/manage-sessions). Emulator tokens are confined to explicit local demo mode; [emulator connection behavior](https://firebase.google.com/docs/emulator-suite/connect_auth) is why the production guard runs before SDK loading. Configuration is process-scoped; restart after changing it.

## Operator workflow

Run `pnpm catalogue:operator /absolute/private/path/command.json`. Input uses one command plus its explicit fields. Inspect/queue output may contain source text or reviewer notes: run in a private terminal, protect files and do not paste output into public evidence. Tokens are read from the token file and never printed. Error output is a generic code.

| Command | Input fields besides `command` | Result |
|---|---|---|
| `source` | `source`, `expected` revision or null, `reason` | Register/update exact allowed URLs, source permission evidence, categories, owner, cadence and pause |
| `queue` | `collection`, optional `after` ID | 100 items plus continuation ID; drafts, reports, jobs, sources, audit or outbox |
| `inspect` | `collection`, `id` | Protected source/draft/report/job/snapshot/version lookup |
| `enqueue` | `job: {sourceId,url,key}`, `reason` | Idempotent job ID from full tuple |
| `run-job` | `id` | Claim lease, bounded fetch/extraction and transactional completion |
| `schedule` | optional `after` source ID | Enqueue due checks by source cadence; repeat using returned continuation |
| `save` | complete canonical `record`, `expected`, `reason` | Save next draft revision; remove current public action pending review |
| `publish` | `id`, `expected`, `action`, `reason` | Actions: publish, withhold, close, withdraw, restore |
| `alias` | canonical `alias`, `expected`, `reason` | Confirm/reverse reviewed identity decision; cycle checks |
| `report-triage` | `id`, `expected`, `decision`, `reason` | serious/resolved/spam; serious restricts current resolved record atomically |

Example mutation envelope: `{"command":"publish","id":"<record-id>","expected":2,"action":"publish","reason":"Reviewed current notice and requirement wording"}`. Replace placeholders only after inspecting the current draft. Publishing is an explicit whole-record review: facts/citations are approved under the verified actor. Application handoff additionally requires a supported check for the exact destination and current draft revision; old checks are not silently renewed across draft edits. Use `save` to supply reviewed corrections/checks before `publish`.

`save` increments the draft revision supplied by the operator and requires the previous expected revision. All other publication actions increment it on the server. A withdrawn record needs explicit `restore`; ingestion cannot change it back to a publishable lifecycle. Closing requires a currently published draft. Withholding keeps a minimal under-review status if previously public. Anonymous reports do not automatically withdraw anything; a reviewer must triage them.

## Persistence and consistency

### Private suggestion review

The [B06-5a review/status record](../operations/95_AUTHENTICATED_SUGGESTION_REVIEW_AND_CURRENT_STATUS_2026-10-16.md) describes separate local source-role operations. With an explicitly enabled trusted suggestion manifest and the existing guarded runtime/token-file setup, use a private JSON command file containing `{"command":"suggestion-queue"}` to inspect bounded work summaries. This does not initialize or repair admission state. Intake can remain false while existing work is reviewed.

Use `{"command":"suggestion-review","review":{"workId":"<64-lowercase-hex-work-id>","expectedRevision":2,"outcome":"reviewing","publicResultIds":[]}}` with the revision actually returned by the queue. Outcomes are reviewing, resolved_to_listing, unresolved, unsupported or paused; resolved requires the complete current approved public ID set. Decision reasons are fixed safe server strings. No notes/actor/URL field is accepted in the review object. A stale revision conflicts; inspect current work before deciding again. Closed/paused outcomes require explicit reviewing before a new outcome. No command grants publication, source retrieval or model execution.

Queue output is private operator material; preserve the existing access/redaction policy and keep command/result files outside Git. It excludes receipt credentials/IDs and key material. These commands do not establish funded review capacity, source permission or release authority. Withdrawal/retention/lease controls and default-disabled public intake remain separate gates.

Collections are `m0_sources`, `m0_source_versions`, `m0_source_health`, `m0_snapshots`, `m0_drafts`, `m0_versions`, `m0_public`, `m0_state`, `m0_aliases`, `m0_jobs`, `m0_source_leases`, `m0_reports`, `m0_report_limits`, `m0_operators`, `m0_audit` and `m0_outbox`. Source register versions are immutable and snapshots reference the source revision under which retrieval occurred. These supersede B02's illustrative collection names for this adapter. Private canonical payloads are JSON strings inside documents, preserving bounded nested expressions without mapping them into provider-depth-limited maps. Existing root Firestore default-deny rules deny unmatched `m0_` collections; the integration suite verifies its separate deny-all test rules. Actual deployed rules/IAM are unverified and must be qualified before exposure.

Publication writes draft, immutable version, whitelist projection or removal, catalogue revision, audit and an applied no-store invalidation event in one transaction. Version document IDs are SHA-256 of `recordId:revision`. No client can choose the audit actor. New source text or a material draft edit restricts old public output before renewed review. Never-public drafts have no public document. Failed fetches leave the last successful source snapshot/time intact.

Job IDs are hashes of source/URL/idempotency key. External record IDs are scoped by source and hashed, so separate supplied intake IDs stay separate. Jobs have a 30-second lease, three-attempt limit and bounded retry delay; source leases prevent simultaneous fetches for the same registered source. Lost workers become reclaimable; completion rechecks lease, source revision and pause status. `schedule` is an explicit command to invoke from a later authorized scheduler; no background cloud job was provisioned. A pause during retrieval prevents completion and the lease can expire safely.

Public reads use a bounded transaction over at most 1,000 public/status records and 100 alias decisions. Filtering precedes pagination and follows B02 literal text/geography semantics; sort and cursor tie-break agree. Capacity overflow returns 503, never a silently incomplete page. This is a small-catalogue correctness implementation, not a national search index: up to 1,001 document reads per request can be expensive. Replace it with a measured complete query/index strategy and public request quotas before scale qualification. No composite indexes are required for current document-ID scans. Large-catalogue cost, throttled performance and hosted contention remain unmeasured.

Alias confirmation hides the duplicate from discovery and resolves to the target's current projection. Reversal reads the original current disposition; it does not restore an old snapshot. Serious report triage resolves current aliases before restricting the record. All reads use no-store, so outbox events are already applied and no cache dispatcher is claimed. Adding caches later requires replayable invalidation and tested revocation across every cache.

## Public HTTP boundary

`GET /api/v1/opportunities`, `GET /api/v1/opportunities/{id}` and `POST /api/v1/reports` are implemented but default unavailable until configured. With catalogue reads enabled, `/` now renders published records, `/opportunities/[id]` shows detail and `/opportunities/[id]/apply` checks revision and freshness before redirecting to an approved portal. Disabled reads retain the preparation homepage; legacy `/api/opportunities` remains unchanged. No public operator/worker endpoint exists. API responses carry no-store and no-sniff; failures exclude database paths, source text, tokens and stack traces.

Report intake accepts only ID, reason enum and bounded text: 8 KB request cap, five-second body deadline, 1,500-character text and a durable global cap of 100 reports/hour. Acknowledgement is identical for unknown/private/public IDs. That global cap limits writes, but a single actor can exhaust it: per-client privacy-preserving throttling and deployed edge controls remain qualification work. No contact fields, uploaded applicant documents, receipts or automatic source fetching are accepted here. Retention/deletion policies must be exercised before public intake activation.

## Acquisition limitations and next work

Suggestion recovery addendum, 23 October: enabled suggestion manifests require an independent root recoveryEpoch outside the restored database, injected into matching signer/receipt and operator review services. It fences old tickets, receipt capabilities and lease completion after a deliberate epoch change while retaining all physical history and counts. Normal ticket-epoch rotation remains separate. Before any authorized restore is reopened, stop all old runtimes/operators/workers and apply a fresh never-reused recovery epoch coherently outside the backup; same-config restore, configuration rollback and still-running old processes are not automatically protected. No real restore or configuration change has been performed. See [local recovery evidence and remaining operational gates](../operations/150_SUGGESTION_RECOVERY_EPOCH_FENCES_2026-10-23.md). Intake remains default disabled and cleanup is pending.

The original operator adapter accepts one canonical JSON notice per approved URL. It strips all incoming approvals, check claims and explanations and produces a private review draft. The separate RecentJobs worker now handles constrained HTML discovery, extraction and automated publication. Neither implementation establishes external source permission. No real issuer was automatically collected or published.

The transport uses HTTPS, exact URL approval on every redirect, public-address checks over all DNS answers, pinned lookup, TLS hostname verification and connected-address checks. It caps retrieval at ten seconds, three redirects and source-defined bytes (maximum 500 KB). JSON is the default; the worker explicitly requests bounded uncompressed HTML or robots text with matching MIME checks. Production IO uses Node DNS/HTTPS; deterministic test transports exercise adversarial behavior without accessing third-party/private hosts. Independent deployed egress testing remains required.

Follow the scraping plan to complete RecentJobs access/reuse assessment, assemble held-out samples and perform the real-notice G1 demonstration. Robots checks and pacing exist in the RecentJobs worker; conditional HTTP requests, PDFs and other source adapters remain open. Complete pending participant observation/capacity decisions and deployed identity/rules/cost qualification. These are not implied by green emulator tests.
