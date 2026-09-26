# B03 — persistent source review and publication

Prepared 25 September 2026 against `d91d9d3`. The user explicitly requested planning and implementation of the next sprint. Proceed with local B03 engineering; this does not manufacture G0 participant evidence, operating commitments, source permission or deployment approval. All six categories and the full agreed product ambition remain intact.

Source clarification during implementation: the founder confirmed scraping as the intended direction and requested proper source/method planning. The [source acquisition and scraping plan](../operations/10_SOURCE_ACQUISITION_AND_SCRAPING_PLAN.md) now owns that assessment. Do not treat the structured test input as the selected real-source adapter or as completion of B03a's real-notice demonstration.

## Outcome and sequence

A source notice enters a bounded fetch job, becomes a private draft, is reviewed by an authenticated operator, and is atomically published to versioned public reads. Corrections, withholding, closure, aliases and serious reports must remove unsafe actions immediately. Restarting the process must retain state and history. No public visit triggers retrieval or inference.

| Order | Packet | Implementation and acceptance |
|---|---|---|
| 1 | B03a configuration and authority | Fail-closed runtime configuration before SDK initialization; explicit emulator or cloud mode, project ID and publication flag. Emulator mode requires a demo project and loopback endpoints; production rejects emulator variables. Verified Firebase ID tokens plus current server-owned operator roles on each operation; no client role authority. |
| 2 | B03a source boundary | Strict source register with exact allowed URLs, permission reference, category coverage, review owner, limits and cadence. HTTPS transport validates every redirect, all DNS answers and actual connection address, retaining TLS hostname verification. Deadline, redirect, byte and MIME limits. Structured JSON notice adapter creates only unapproved drafts; raw source instructions cannot call tools or publish. |
| 3 | B03b durable ingestion | Firestore records/snapshots, immutable revisions, jobs with idempotency, leases and bounded retries; source pause and due rechecks. Hash/version evidence and separate source/intake identity. Failed fetch preserves last successful snapshot. No automatic merge. |
| 4 | B03c operator workflow | Protected JSON command tool for source registration/pause, queue, draft save/read, review/publish/correct/withhold/close, report triage and alias confirmation/reversal. Every mutation checks expected revision and records verified actor and audit reason. |
| 5 | B03d public reads | Versioned list/detail endpoints, strict query and cursor contract, full filter before pagination, current publication projection, no-store, generic failures. Bounded catalogue scan initially (1,000 published/status entries); exceeding cap fails explicitly rather than silently omitting matches. |
| 6 | B03c/d correction safety | Bounded anonymous issue reports with durable global/hour quota and non-enumerating acknowledgement. Operator-confirmed serious reports restrict publication; unsolicited reports never automatically withdraw listings. Atomic catalogue revision/outbox writes; no caches initially. Alias cycles/chains bounded; reversal does not restore withdrawn records. |
| 7 | Evidence | Unit/adversarial tests, real Auth/Firestore emulator integration, unauthorized operator/client-denial tests, publication/correction/restart/pagination/race/job/alias/report tests, production web boundary regression and clean build. Record actual results and gaps. |

## Architecture and limits

Implement a server-only `@skilved/catalogue` package using Firebase Admin and the canonical B02 schemas. Keep SDK loading lazy and guarded. Store canonical record JSON inside bounded Firestore documents to preserve nested requirement expressions within provider nesting limits. Existing prototype database helpers remain inactive. New collections use an `m0_` prefix to avoid accidental use of historical collections; public clients have no direct database access. Operators use verified bearer tokens, not application-default credentials as user identity. Admin SDK runtime identity still requires separately scoped deployment IAM.

A protected CLI is the initial operator interface allowed by the runbook. No new operator web login or private learner feature is needed. Public GET routes may be present but disabled without explicit configuration. Public report POST is separately enabled. Local emulator tooling is isolated from normal web execution; no seed identities, emulator tokens or fictional inventory belong in production assets.

The structured notice adapter supports source-owned JSON carrying the canonical record as extraction input. It resets all approval/publication state and preserves raw source evidence privately. This is a concrete adapter format, not a claim that arbitrary HTML/PDF sites already supply it. A real source that permits retrieval and reuse, plus a documented format mapping where needed, remains necessary for G1's real-notice demonstration. Do not invent permission or label fixtures real coverage.

## Acceptance matrix

- Authentication: missing/forged/revoked/disabled identities and missing server role denied; role updates take effect without trusting token role fields. Production emulator configuration fails before SDK creation.
- Fetch: credentials, ports, IP literals, local/private/reserved/mapped addresses, mixed DNS, rebinding, unsafe redirect, oversized/compressed/non-JSON payload, timeout and source pause fail safely.
- Persistence: restart reads same drafts/history; competing reviewer updates produce conflict; atomic version/projection/catalogue revision/audit/outbox; no partial published state after failed validation.
- Ingestion: duplicate jobs idempotent, expired lease recoverable, stale worker fenced, retry bounded, separate intakes preserved, last good snapshot retained on failure.
- Reads: filters match B02 semantics across page boundaries, stable tie-break, stale cursors rejected, drafts indistinguishable from missing, closed/withheld/alias-reversed states safe, private sentinels absent.
- Operations: quota/size-limited report acknowledgement, protected triage, serious restriction, source pause, safe restoration requires a fresh explicit review, no arbitrary old-version restore command.
- Release: six-category coverage matrix, scoped source/reviewer evidence and workload reforecast; G0/G1 remain open where human, permission or deployed evidence is absent.

## Working schedule and rollback

Execute packets in dependency order with verification after each boundary. The former 30-hour B03 scenario is unconfirmed, not a commitment; record remaining engineering and external waits separately at the end. Stop unsupported feature activation rather than weakening tests. No deployment, provisioning or unsolicited outreach is authorized by this plan.

Rollback local code through a reviewed revert. Do not roll back publication data or catalogue revisions: later withholding and withdrawal decisions must survive. Keep immutable review history and correction events. Hosted backup/restore and IAM qualification remain B09. Link actual command logs and final limitations from the delivery-status record when complete.
