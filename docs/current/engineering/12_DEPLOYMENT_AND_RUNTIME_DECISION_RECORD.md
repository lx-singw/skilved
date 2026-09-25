# ADR DEP-02: Deployment, Runtime, and Isolation Architecture

Date: 2026-09-25. Status: CONFIRMED (budget ceiling, data residency) / RECOMMENDED (runtime topology, boundaries).
Authority: Task B01c, M0 Chronological Build Runbook. Replaces historical uncosted deployment models.

## 1. Context and Problem Statement

Skilved requires an official deployment and runtime architecture for the M0 release. The architecture must satisfy strict cost ceilings ($25 USD/mo), enforce South African data residency under POPIA, isolate untrusted remote source fetching, protect private operator workflows, and guarantee zero-downtime rollbacks without complex multi-cloud overhead.

## 2. Public Web Hosting: Cloud Run vs Vercel

Decision: Google Cloud Run (containerized Next.js standalone output) deployed in `africa-south1` (Johannesburg).

| Evaluation Dimension | Google Cloud Run (`africa-south1`) | Vercel (Hobby / Pro) | Selected Rationale |
|---|---|---|---|
| **Data Residency (POPIA)** | Native compute in Johannesburg (`africa-south1`). In-memory and local execution data remain within South Africa. | No compute region in SA; serverless functions execute in Europe (`fra1`) or US (`iad1`), causing cross-border data transit. | Cloud Run satisfies local data sovereignty preferences and reduces POPIA cross-border transfer compliance friction. |
| **Network Latency** | 10–30 ms round-trip for domestic South African end users on mobile/broadband networks. | 140–200 ms round-trip due to routing through European or North American edge/origin servers. | Low latency is essential for high mobile drop-off mitigation among South African youth. |
| **Egress Cost to Firestore** | Intra-region internal network routing in `africa-south1`. Zero or negligible intra-datacenter egress fees ($0.00–$0.01/GB). | Public internet egress across providers ($0.12/GB GCP internet egress + Vercel transfer fees) plus TLS handshake per connection. | Eliminates cross-cloud egress billing risk and connection overhead. |
| **Pricing & Terms** | Pay-per-use request pricing with true scale-to-zero (`min-instances: 0`). Initial M0 costs estimated < $5/mo. | Hobby tier explicitly forbids commercial use; Pro tier ($20/user/mo) consumes 80% of entire $25/mo budget on hosting alone. | Cloud Run enables compliant commercial operation within the strict $25 budget ceiling. |

Implementation: Next.js configured with `output: "standalone"`. Minimal container image deployed with 80 concurrency, 512MiB RAM, and 1 vCPU.

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

Decision: Bounded, secure HTTP egress client for crawler and link-import pipelines.

All outbound HTTP fetches must pass through an isolated fetch adapter enforcing five boundaries:
1. **Source Register Allowlisting:** Target hostnames must be explicitly enrolled in the maintained Source Register (`docs/current/operations/03_SOURCE_CHECKS_AND_COMMUNITY_CONTRIBUTIONS.md`). Arbitrary public URLs are rejected.
2. **DNS Resolution Pre-check:** Hostnames are resolved to IP addresses prior to connection. The client rejects connections to:
   - RFC 1918 private IPv4 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
   - Loopback addresses (`127.0.0.0/8`, `::1`)
   - Link-local and Cloud Metadata (`169.254.169.254`, `169.254.0.0/16`, `fe80::/10`)
   - Carrier-grade NAT (`100.64.0.0/10`) and multicast ranges (`224.0.0.0/4`).
3. **Payload Size Cap:** Hard maximum of 1 MB response body. Streams exceeding 1 MB are terminated immediately with an error.
4. **Strict Timeout:** Hard connection and read timeout of 10 seconds.
5. **Protocol & Redirect Security:** Only HTTPS is permitted. HTTP redirects are re-validated against the allowlist and SSRF checks on every hop (max 3 hops).

## 7. Staging versus Production Isolation

Decision: Two dedicated, isolated Google Cloud projects.

- **Project Separation:** `skilved-staging` and `skilved-prod`.
- **IAM Boundary:** Completely separate IAM policies. Service accounts in staging have zero permissions in production. No shared service account keys.
- **Database Isolation:** Staging runs against an independent Firestore instance. Synthetic data, test crawls, and schema experiments can never touch production user or catalogue data.
- **Configuration & Secrets:** Google Secret Manager instances are project-scoped (`projects/skilved-staging/secrets/*` vs `projects/skilved-prod/secrets/*`). CI/CD deployment tokens are restricted to project-specific target environments.

## 8. Rollback Procedures

Decision: Revision traffic switching for compute; expand-and-contract for schemas.

- **Application Rollback:** Cloud Run deployments create immutable revisions. A regression is rolled back instantly (< 5 seconds) via traffic shifting:
  ```sh
  gcloud run services update-traffic web --to-revisions=PREVIOUS_REVISION=100 --region=africa-south1
  ```
- **Schema Evolution (Expand-and-Contract):**
  1. *Expand:* Deploy code that writes new fields while reading both new and old fields. All new fields must be optional.
  2. *Migrate:* Asynchronous background jobs backfill historical documents.
  3. *Contract:* Remove support for obsolete fields only after verified cutover and retention window.
- Backward incompatibility is forbidden: database mutations must allow the previous container revision to operate safely if rolled back.

## 9. Cost Ceilings, Budget Alerts, and Kill-Switch Runbook

Decision: Hard budget ceiling of $25 USD / month (~R450 ZAR) with automated alerts and an operational kill switch.

### Budget Alerts (GCP Cloud Billing)
- **50% ($12.50 USD):** Informational notification sent to founder/operator email.
- **80% ($20.00 USD):** Operational caution: pause scheduled discovery crawls; audit daily read/write spikes.
- **100% ($25.00 USD):** Hard budget limit reached; immediate execution of the kill switch.

### Emergency Kill-Switch Runbook
If spending approaches or hits $25.00 USD, the operator executes the following containment steps:
1. **Disable Scheduled Jobs:** Pause all Cloud Scheduler cron triggers:
   ```sh
   gcloud scheduler jobs pause crawl-sources --location=africa-south1
   ```
2. **Scale Web to Zero / Maintenance Mode:** Reduce Cloud Run service instances to 0 to prevent billable compute:
   ```sh
   gcloud run services update web --min-instances=0 --max-instances=0 --region=africa-south1
   ```
3. **Terminate Active Workers:** Abort any executing Cloud Run Jobs:
   ```sh
   gcloud run jobs executions list --region=africa-south1
   # Cancel running execution IDs
   ```
4. **Billing Audit:** Inspect Cloud Billing reports grouped by SKU (Cloud Run vCPU, Firestore reads/writes, Egress) to isolate root causes prior to service restoration.

## 10. Governance and Review Traceability

- **Decision ID:** DEP-02 (Engineering ADR).
- **Status:** CONFIRMED by founder for cost ceiling ($25/mo), data residency (`africa-south1`), and single-operator review; RECOMMENDED for container runtimes, VPC egress, and SSRF filter parameters.
- **Review Schedule:** Mandatory review prior to R1 alpha deployment and before R3 institutional expansion.
- **Related Records:** [Architecture 06](06_ARCHITECTURE.md), [Cost Operations 12](../operations/12_COST_CAPACITY_AND_OPERATIONS.md), [Decisions 14](../governance/14_DECISIONS_AND_ASSUMPTIONS.md).
