# ADR DEP-02: proposed deployment and runtime boundaries

Updated: 25 September 2026. Status: technical recommendation; budget, access, deployment and operational rehearsal remain unconfirmed. This decision is a B01 design artifact, not evidence of provisioned resources. The local B02 contracts do not initialize a cloud SDK.

## 1. Selected direction and limits

Prefer a small public Next.js web service on Cloud Run, Firestore for reviewed records, Firebase operator identity with server-side authorization, and a separate restricted ingestion/review execution boundary. Retain South African regional placement as a preference to verify for each service and data flow. Region choice alone is not a legal compliance conclusion or a guarantee about all logs, backups, builds, identity and support processing.

Vercel remains a technically possible alternative; Cape Town compute exists. Cloud Run is preferred here for integration with the proposed Google store and operator/worker identities, not because Vercel requires exported long-lived keys: [Vercel documents GCP workload identity federation](https://vercel.com/docs/oidc/gcp). Compare actual account terms and complete workloads before deployment. No measured latency or absolute provider-security superiority is established.

## 2. Public/private implementation boundary

- Public web: signed-out public reads only, through approved projections. Current catalogue is empty. Next standalone output, container image, concurrency, CPU/memory and scale limits are proposed deployment work, not configured/deployed facts.
- Private jobs: proposed bounded Cloud Run Jobs, with scheduler identity and authorization to execute only the intended job. `apps/worker` is not implemented. An API endpoint protected by IAM is not equivalent to an endpoint unreachable from the internet; verify actual invocation and ingress separately.
- Store: Firestore is the proposed operational store. Schema/query/index contracts are specified in B02; persistent publication, transactions, rule/IAM tests and restart evidence belong to B03. No cost or free-tier entitlement is assumed from this document.
- Operator identity: verify signature, project audience, expiry and authorized server-controlled role. Treat source facts and source text as untrusted. Production must reject emulator configuration before SDK initialization. No applicant identity or private documents are needed for M0.
- Separation: use separate staging/production projects and service identities when provisioned, with no inherited cross-environment access. Names in prior drafts were placeholders, not confirmed project ownership.

## 3. Workload and cost model to price before deployment

These are **proposed caps for estimating**, not observed traffic or an approved operating commitment:

| Input | Initial scenario | Cost/operating consequence to calculate |
|---|---:|---|
| Public page visits | 1,000/month | Measure bytes/response, cache behavior, CPU/request and store reads/visit |
| New source notices | 20/week | At assumed 10 minutes review each, about 3.3 hands-on hours/week |
| Source rechecks | 50/week | At assumed 2 minutes triage each, about 1.7 hours/week; failures may take longer |
| Suggested links | Disabled until B06 limits and review capacity exist | Intake volume must fit actual operator availability |
| Environments | Staging and production | Price both, including idle/background resources |
| Monthly operating limit | Proposed USD 25; founder confirmation pending | Not an automatic billing cap or proof the design fits |

Compute a dated low/base/high estimate as: request and worker CPU/memory + store operations/storage/backups + egress/NAT/networking + builds/artifacts + logs/monitoring + secrets/scheduler/identity charges where applicable, less only verified account allowances. Retain unit prices, billable units and source dates in the deployment evidence. Choose Direct VPC Egress versus connector deliberately and include its networking costs. Human review/support time is a separate capacity cost, not free AI throughput. No previous `< USD 5` or residual-storage estimate is retained as validated fact.

Before B09, set funded workload and queue limits, measure current SKUs and control delay, and rehearse containment. If the scenario does not fit, adjust workload/implementation and dates explicitly; do not charge consumers or remove accepted categories.

## 4. Rollback and storage compatibility

Retain revision/image/configuration identity, old-reader/schema compatibility, publication revision and a tested recovery procedure. Expand before contract; migrate explicitly; never restore an old projection that reactivates withheld destinations. Traffic-switch timing, cold starts and recovery time are unmeasured targets until staging tests. B02's dry-run conversion does not migrate a live store.

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

## 7. Spending containment — procedure to rehearse, not executed evidence

[Cloud Billing budgets provide alerts, not a hard spending cap](https://docs.cloud.google.com/billing/docs/how-to/budgets). Notifications and usage reports may be delayed. Proposed alerts at 50/80/100% of the confirmed operating limit require a real owner and contact configuration; avoid waiting for the final threshold before action.

The following placeholders must be replaced with verified resource names and an explicitly selected project in a separately authorized staging rehearsal. First record current scaling, traffic tags, identity/access settings, scheduler triggers and active job executions.

1. Pause each actual scheduler/event producer to prevent new ingestion. Confirm the trigger list rather than assuming there is only one.
2. For the public service, the documented manual scaling mechanism supports disabling it with zero instances:

   ```sh
   gcloud run services update SERVICE --scaling=0 --project=PROJECT_ID --region=REGION
   ```

   Inspect tag-only revisions and their minimum instances separately: they can remain active outside the service allocation. Remove or otherwise contain their exposure and verify all intended routes stop serving. This command is not an all-resource billing stop. [Cloud Run manual scaling](https://docs.cloud.google.com/run/docs/configuring/services/manual-scaling).
3. Enumerate running ingestion executions and cancel each applicable execution with explicit project/region. Verify cancellation rather than treating a list operation as cancellation.
4. Inspect metrics, running instances, workers and current billing SKUs. Storage, logs, artifacts, network resources and work already in flight may still incur charges. No immediate 403, instantaneous propagation or zero-cost guarantee is made.
5. Restore the recorded scaling mode/traffic/trigger configuration only after the cause is contained and the recovery decision is recorded; verify smoke tests and spending after restoration. Do not grant `allUsers` blindly as a restoration shortcut.

Removing an `allUsers` invoker binding alone is not a reliable universal compute stop: public access can also be configured by disabling the invoker IAM check, and other authenticated traffic/background resources can remain. Review the actual configuration using [Cloud Run public-access guidance](https://docs.cloud.google.com/run/docs/authenticating/public).

## 8. Required future evidence and ownership

Founder: confirm actual budget/access and operating availability. Implementer: versioned deployment configuration, complete cost estimate, identity/egress tests, environment guards and staging rehearsal. Operator: actual review windows, queue pause and incident response. G0 design evidence is limited to this documented boundary; G1/B09/B10 require implemented controls and real test results. No cloud command was run by the B02 implementation task.
