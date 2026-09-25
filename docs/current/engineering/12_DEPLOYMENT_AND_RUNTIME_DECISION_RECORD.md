# ADR DEP-02: Deployment, Runtime, and Isolation Architecture

Date: 2026-09-25. Status: CONFIRMED (budget ceiling, data residency) / RECOMMENDED (runtime topology, boundaries).
Authority: Task B01c, M0 Chronological Build Runbook. Replaces historical uncosted deployment models.

## 1. Context and Problem Statement

Skilved requires an official deployment and runtime architecture for the M0 release. The architecture must satisfy strict cost ceilings ($25 USD/mo), enforce South African data residency under POPIA, isolate untrusted remote source fetching, protect private operator workflows, and guarantee zero-downtime rollbacks without complex multi-cloud overhead.

## 2. Public Web Hosting: Cloud Run vs Vercel

Decision: Google Cloud Run (containerized Next.js standalone output) deployed in `africa-south1` (Johannesburg).

| Evaluation Dimension | Google Cloud Run (`africa-south1`) | Vercel (Hobby / Pro) | Selected Rationale |
|---|---|---|---|
| **Data Residency & Geography** | Native compute and storage co-located in Johannesburg (`africa-south1`). In-memory and execution data remain in SA under POPIA. | Supports Cape Town (`cpt1`) for Edge/Serverless functions, but build caching, telemetry, and platform services transit overseas. | Cloud Run guarantees full compute, container execution, and log storage remain strictly within South Africa. |
| **Firestore Egress & Latency** | Intra-region internal Google network routing in `africa-south1`. Zero egress charges ($0.00/GB) to Firestore. | Cross-cloud calls over public internet incur GCP internet egress fees ($0.12/GB) and extra TLS handshake overhead. | Co-location eliminates cross-cloud egress billing volatility and network latency jitter. |
| **IAM & Credential Boundary** | Native GCP IAM integration (Workload Identity, service accounts). Zero static API keys or long-lived tokens in code/env. | Requires exporting static GCP Service Account JSON keys to external Vercel environment variables. | Cloud Run eliminates credential theft vectors through platform-managed ephemeral IAM tokens. |
| **VPC & Network Isolation** | Direct VPC Egress routes container traffic to private subnets without costly Serverless VPC connectors. | Requires Vercel Secure Compute (Enterprise tier only) for private VPC peering into Google Cloud. | Direct VPC Egress enables private database and worker integration without third-party network brokers. |
| **Pricing & Licensing** | True scale-to-zero (`min-instances: 0`) pay-per-use request pricing. Estimated M0 web compute is < $5.00 USD/mo. | Hobby tier explicitly forbids commercial use; Pro tier ($20/seat/mo) consumes 80% of the entire $25/mo budget on seats alone. | Cloud Run allows commercial operations without per-seat licensing penalties, preserving the $25/mo ceiling. |

Implementation: Next.js configured with `output: "standalone"`. Minimal container image deployed with 80 concurrency, 512MiB RAM, and 1 vCPU. Sub-5-second application rollback via revision traffic switching is established as an unmeasured staging target for work package B09d.

## 3. Private Worker and Crawler Boundary

Decision: Cloud Run Jobs triggered via Cloud Scheduler, restricted to non-public endpoints.

- **Execution Model:** Long-running discovery ingestion, content validation, and task queues run as Cloud Run Jobs (`apps/worker`), not always-on daemon containers or public web routes.
- **Trigger & Identity:** Cloud Scheduler triggers jobs via Google Cloud Run Jobs REST API using a dedicated service account (`worker-scheduler-sa`) holding the minimal `roles/run.invoker` permission.
- **Ingress Isolation:** Worker containers have no public HTTP endpoints (`--ingress=internal-only` or execution-only jobs). They cannot be invoked from the public internet.
- **Network Egress:** Outbound network calls use Serverless VPC Access with a connector or Direct VPC Egress, routing database traffic privately to Firestore while filtering egress.
- **Concurrency & Resource Limits:** Workload is bounded to 1 task per worker instance during M0 to prevent race conditions and memory spikes. Job execution timeout is capped at 15 minutes.

## 4. Persistent Operational Store: Firestore vs Cloud SQL

Decision: Google Cloud Firestore (Native Mode, `africa-south1`). Cloud SQL (PostgreSQL) is evaluated and scheduled for R3–R5 institutional expansion.

- **M0 Evaluation:** M0 data patterns are document-oriented (opportunity catalogs, versioned source snapshots, durable task records). Firestore Native Mode in `africa-south1` provides an included free tier (50k reads/day, 20k writes/day, 1GB storage), resulting in $0.00–$2.00/mo operating cost.
- **Cloud SQL Comparison:** The smallest managed PostgreSQL instance (`db-f1-micro` or `db-custom-1-3840`) incurs a fixed baseline cost of $10–$35/mo 24/7 before storage, backups, and egress, directly breaching the $25/mo total infrastructure budget.
- **Institutional Gate (R3–R5):** Re-evaluate PostgreSQL when multi-tenant relational reporting, complex organizational joins (TVET/SDF cohorts), and ACID cross-table operations are implemented. Migration criteria: verified database cost justification, relational schema mapping, and automated export/backfill pipelines.

## 5. Operator Authentication and Access Control

Decision: Firebase Authentication with verified Custom Claims and server-side authorization.

- **Role Claims:** Operator privileges are assigned via Firebase Auth custom claims: `{ "role": "operator" }` or `{ "role": "admin" }`.
- **Server-Side Validation:** All administrative API routes (`/api/admin/*`, review tools) verify the Firebase ID token using the Firebase Admin SDK:
  - Token signature, expiration, and project audience are verified.
  - The decoded token must contain `token.role === 'operator' || token.role === 'admin'`.
- **Zero Client Trust:** Body or query parameters asserting identity (`userId`, `role`) are rejected. Public users cannot assign custom claims; claims can only be set via an authenticated administrative bootstrap CLI using a local Google Service Account.

## 6. Approved-Fetch Boundary and SSRF Protection

Decision: Bounded, secure HTTP egress client with connection-time socket-level IP validation for crawler and link-import pipelines.

All outbound HTTP fetches must pass through an isolated fetch adapter enforcing five boundaries:
1. **Source Register Allowlisting:** Target hostnames must be explicitly enrolled in the maintained Source Register (`docs/current/operations/03_SOURCE_CHECKS_AND_COMMUNITY_CONTRIBUTIONS.md`). Arbitrary public URLs are rejected prior to network dispatch.
2. **Connection-Time Socket-Level IP Validation (Anti-TOCTOU):** Pre-fetch DNS lookups are vulnerable to Time-of-Check to Time-of-Use (TOCTOU) DNS rebinding, where an attacker-controlled nameserver serves an allowed public IP on initial resolution but returns an internal or metadata IP on the actual TCP connection. The egress HTTP client MUST mandate socket-level IP validation at connection time (e.g., intercepting the resolved IP in the socket creation hook before transmitting request bytes) on every initial connection and every redirect hop. Connections are immediately aborted if the resolved IP matches any private, link-local, or reserved address block:
   - **RFC 1918 Private IPv4:** `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
   - **Loopback Addresses:** `127.0.0.0/8` (IPv4) and `::1/128` (IPv6)
   - **Link-Local & Cloud Metadata:** `169.254.169.254` (Instance Metadata Service), `169.254.0.0/16` (IPv4 link-local), and `fe80::/10` (IPv6 link-local)
   - **Carrier-Grade NAT (CGNAT):** `100.64.0.0/10`
   - **IPv6 Unique Local Addresses (ULA):** `fc00::/7`
   - **IPv4-Mapped IPv6 Normalization:** Addresses matching `::ffff:0:0/96` (e.g., `::ffff:169.254.169.254`, `::ffff:127.0.0.1`) must be normalized to standard IPv4 notation before filtering to prevent IPv6 encapsulation bypasses.
   - **Current Network & Multicast / Reserved:** `0.0.0.0/8`, `224.0.0.0/4` (Multicast), `240.0.0.0/4` (Reserved), and `255.255.255.255/32` (Broadcast).
3. **Payload Size Cap:** Hard maximum of 1 MB response body. Streams exceeding 1 MB are terminated immediately with an error.
4. **Strict Timeout:** Hard connection and read timeout of 10 seconds.
5. **Protocol & Redirect Security:** Only HTTPS is permitted. HTTP redirects are re-validated against the hostname allowlist and subject to connection-time socket-level IP validation on every hop (maximum 3 hops).

## 7. Staging versus Production Isolation

Decision: Two dedicated, isolated Google Cloud projects.

- **Project Separation:** `skilved-staging` and `skilved-prod`.
- **IAM Boundary:** Completely separate IAM policies. Service accounts in staging have zero permissions in production. No shared service account keys.
- **Database Isolation:** Staging runs against an independent Firestore instance. Synthetic data, test crawls, and schema experiments can never touch production user or catalogue data.
- **Configuration & Secrets:** Google Secret Manager instances are project-scoped (`projects/skilved-staging/secrets/*` vs `projects/skilved-prod/secrets/*`). CI/CD deployment tokens are restricted to project-specific target environments.

## 8. Rollback Procedures

Decision: Revision traffic switching for compute; expand-and-contract for schemas.

- **Application Rollback:** Cloud Run deployments create immutable revisions. A regression is rolled back via traffic shifting:
  ```sh
  gcloud run services update-traffic skilved-web --to-revisions=PREVIOUS_REVISION=100 --region=africa-south1
  ```
  *Staging Verification Target:* Sub-5-second rollback is defined as an unmeasured staging target; it must be empirically measured, benchmarked, and verified under simulated load during work package B09d (`apps/web` deployment automation and health validation).
- **Schema Evolution (Expand-and-Contract):**
  1. *Expand:* Deploy code that writes new fields while reading both new and old fields. All new fields must be optional.
  2. *Migrate:* Asynchronous background jobs backfill historical documents.
  3. *Contract:* Remove support for obsolete fields only after verified cutover and retention window.
- Backward incompatibility is forbidden: database mutations must allow the previous container revision to operate safely if rolled back.

## 9. Cost Ceilings, Budget Alerts, and Kill-Switch Runbook

Decision: Hard budget ceiling of $25 USD / month (~R450 ZAR) with automated alerts and an operational kill switch.

### Cloud Billing Latency Realities and Budget Status
- **Billing Ingestion Delay:** Google Cloud Billing budget alerts and programmatic notifications have a multi-hour propagation delay (typically 2 to 12 hours) and do not halt billing or shut down resources automatically.
- **Operating Limit vs Automated Hard Stop:** The $25.00 USD/mo limit is a founder-funded operational ceiling and manual containment trigger, not an automated GCP billing circuit breaker.
- **Compute Containment vs Residual Costs:** Executing the emergency kill-switch halts all elastic compute charges (Cloud Run vCPU/RAM allocation, active ingestion workers). It does not eliminate residual static costs: Firestore document storage, Cloud Storage buckets, Artifact Registry image retention, and in-flight network egress. Spending will plateau at static baseline storage costs (~$0.50–$1.50/mo) rather than immediately dropping to zero.

### Alert Escalation Posture
- **50% ($12.50 USD):** Informational notification sent to founder/operator email.
- **80% ($20.00 USD):** Operational caution: pause scheduled discovery crawls; audit daily read/write spikes.
- **100% ($25.00 USD):** Hard budget limit reached; immediate execution of the emergency kill-switch runbook.

### Emergency Kill-Switch Runbook
If spending approaches or hits $25.00 USD, the operator executes the following containment steps:
1. **Pause Scheduled Ingestion Triggers:**
   ```sh
   gcloud scheduler jobs pause crawl-sources --location=africa-south1
   ```
2. **Revoke Public Ingress (Immediate 403 Stop):**
   Cloud Run rejects `--max-instances=0` (minimum value is 1). To immediately prevent public requests from spinning up container instances and incurring compute charges, remove the unauthenticated public invoker binding:
   ```sh
   gcloud run services remove-iam-policy-binding skilved-web \
     --member=allUsers \
     --role=roles/run.invoker \
     --region=africa-south1
   ```
   The Cloud Run edge proxy immediately rejects all incoming public traffic with HTTP 403 Forbidden without spinning up or billing container instances.
3. **Cancel Active Cloud Run Jobs Executions:**
   Abort any currently executing ingestion tasks:
   ```sh
   # List active executions for the crawler job
   gcloud run jobs executions list --job=crawl-sources --region=africa-south1 \
     --filter="status.conditions.type=Active AND status.conditions.status=True" \
     --format="value(name)"
   # Cancel specific running execution
   gcloud run jobs executions cancel EXECUTION_NAME --region=africa-south1
   ```
4. **Billing Audit and Restoration Protocol:**
   Inspect Cloud Billing reports grouped by SKU (Cloud Run vCPU/RAM, Firestore reads/writes, Egress) to isolate root causes. Once resolved, restore public access:
   ```sh
   gcloud run services add-iam-policy-binding skilved-web \
     --member=allUsers \
     --role=roles/run.invoker \
     --region=africa-south1
   ```

## 10. Governance and Review Traceability

- **Decision ID:** DEP-02 (Engineering ADR).
- **Status:** CONFIRMED by founder for cost ceiling ($25/mo), data residency (`africa-south1`), and single-operator review; RECOMMENDED for container runtimes, VPC egress, and SSRF filter parameters.
- **Review Schedule:** Mandatory review prior to R1 alpha deployment and before R3 institutional expansion.
- **Related Records:** [Architecture 06](06_ARCHITECTURE.md), [Cost Operations 12](../operations/12_COST_CAPACITY_AND_OPERATIONS.md), [Decisions 14](../governance/14_DECISIONS_AND_ASSUMPTIONS.md), [Performance Envelopes 13](13_PERFORMANCE_ENVELOPES_AND_BUDGETS.md).
