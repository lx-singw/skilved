# Validation, security gates and release evidence

Accepted companion acceptance, 13 September 2026: [DCF-01–24](02_DISCOVERY_COMPANION_ACCEPTANCE.md) specify M0 source/requirement clarity, local continuity, sharing, safe suggestion intake and operating evidence. DCF-23 gates later social release. These cases are NOT RUN; the documentation checker only validates document structure and planning arithmetic.

13 September sequencing: the [M0 acceptance scope](../product/03_DISCOVERY_FIRST_MVP.md) governs the discovery-first public release. Apply checks to all exposed routes/data and disable unfinished sensitive endpoints at the server/deployment boundary. Full private-record, agent, sharing-of-evidence and institutional checks remain mandatory before those capabilities open, but are not requirements to implement those features for M0. No broad institutional study or payment is a discovery-launch gate.

Status: required future evidence, 11 September 2026. No test suite, production deployment or security certification was executed as part of the documentation refresh.
Owner: founder/engineering; independent reviewers are added where risk or contractual requirements justify them.
Trace requirements to [product](../product/02_PRODUCT_REQUIREMENTS.md), [architecture](../engineering/06_ARCHITECTURE.md), [contracts](../engineering/07_DATA_AND_API_CONTRACTS.md), [agents](../engineering/08_AGENT_EXECUTION.md), [sources](../operations/09_OPPORTUNITY_OPERATIONS.md) and [trust](../security/10_TRUST_PRIVACY_AND_SAFETY.md).

## 1. Evidence standard

A capability is complete only when the intended user journey works and its failure/permission boundaries have evidence.
Documentation, generated code, screenshots, mock responses and successful deployment alone do not prove that journey.
Every release evidence record identifies commit/image, configuration, environment, dataset/fixture version, command/procedure, timestamp, result and reviewer.
Distinguish local fixture tests, emulator integration, isolated provider sandbox and actual production smoke checks.
Use synthetic or appropriately consented minimal data in testing; do not copy live identity documents into general fixtures.
Unsupported historical claims of verified security, immutable logs, authentic credentials or deployed automation are superseded by this evidence standard.

## 2. Known baseline requiring resolution

| Baseline observation | Release consequence | Required proof |
|---|---|---|
| Demo profile API uses shared demo identity | No live private-user use of that route | Distinct authenticated user journey and isolation tests |
| Auth/Firebase/database TODOs or empty files | Persistence/login cannot be counted complete | Restart/reload tests against actual chosen persistence |
| Hardcoded document verification output | False credential claims must not ship | Fixtures isolated; unverifiable inputs remain unverified |
| Hardcoded opportunity crawlers/default facts | Catalogue cannot be labelled live | Source-to-record evidence with unknown/expiry handling |
| Owner-writable role used by Firestore admin check | Potential privilege escalation | Protected-field rules/server authorization negative tests |
| All signed-in users may read screenshot path | Potential cross-user disclosure | Per-owner/grant access tests on actual storage rules |
| Generic Cloud Run public invocation | Workers may be externally invocable | Unauthenticated/private endpoint denial evidence |
| CI workflow directory absent at inspection | Automated deployment is not established | Checked-in runnable pipeline with retained result |

These observations identify scope, not exhaustive vulnerabilities or a claim that production was exposed. Reinspect the current revision before fixes.
R0 must record each item as resolved, safely disabled or explicitly not in the release; neither silence nor an attractive demo is a disposition.

## 3. Test layers

| Layer | What it proves | What it does not prove |
|---|---|---|
| Static/build checks | Types, schemas, dependency/build consistency | Runtime permissions or real source accuracy |
| Unit/property tests | Requirement rules, transitions, merge logic, unknown handling | Working external integration |
| Emulator integration | Persistence interactions and security rules under controlled identity | Production IAM/region/provider configuration |
| Contract tests | API payload/auth/error/version compatibility | User comprehension or issuer acceptance |
| Browser journey tests | End-to-end behaviour and state persistence | National effectiveness or guaranteed outcomes |
| Source/model evaluation | Accuracy and abstention on specified held-out examples | Error-free arbitrary future inputs |
| Provider sandbox tests | Actual adapter/signature/delivery behaviour | Consent to contact real people |
| User observation | Comprehension and task success in the tested cohort | General population demand |
| Production smoke/drill | Released configuration and recovery procedure work | Complete security assurance |

Use meaningful tests around failure-prone or consequential behaviour. Do not chase a blanket percentage by testing trivial mirrors of implementation.
Firebase provides tools for testing rules with mocked authentication in the emulator. This should cover both allowed and forbidden operations. [Firebase rules testing](https://firebase.google.com/docs/rules/unit-tests)
Server-side data access needs separate authorization tests because server clients bypass Firestore Security Rules. [Firebase rule conditions](https://firebase.google.com/docs/firestore/security/rules-conditions)

## 4. Required negative security tests

- **SEC-03:** unauthenticated caller cannot access private profile, file, task, export, group or referral information.
- **SEC-04:** user A cannot read/modify/delete user B's records by changing IDs, query filters, body owner fields or object paths.
- **SEC-05:** owner cannot assign admin/coordinator/issuer role or edit verification, consent audit and provider receipt fields.
- **SEC-06:** coordinator cannot access non-member learners or unshared evidence; departed members and revoked grants lose new access.
- **SEC-07:** screenshot/storage access enforces subject ownership or exact grant; broad signed-in access fails.
- **SEC-08:** hidden/draft source records and internal review notes never enter public projections or search indexes.
- **SEC-09:** model/source prompt injection cannot alter recipient, grant, task authority or tool allowlist.
- **SEC-10:** upload validates actual file properties, blocks oversize/forbidden content and never publishes quarantined files.
- **SEC-11:** malicious URL, redirect, IPv4/IPv6 private address and DNS-change cases cannot fetch internal services.
- **SEC-12:** worker/admin invocation denies unauthorised callers even when the public website works.
- **SEC-13:** revoked/expired identity sessions, replayed webhooks and forged provider signatures are rejected where applicable.
- **SEC-14:** logs/errors/exports contain no credentials, signed access tokens or another person's private payload.

Test both database rules and server routes; a secure database rule does not compensate for an overprivileged server endpoint.
Test deployed configuration separately with controlled accounts. Never use destructive penetration actions on third parties or production users.
External review may be necessary for the enabled data/institutional scope; use a concrete scope/quote rather than historical arbitrary audit prices.

## 5. Critical browser journeys

| Journey ID | Procedure | Required result |
|---|---|---|
| E2E-01 | Anonymous browse/filter each of six categories and open a listing | Correct category, source/freshness/unknowns and original application route |
| E2E-02 | Sign in, save an opportunity, change checklist, close/reopen browser | Owner data persists; no demo-user substitution |
| E2E-03 | Submit a private opportunity link and wait for review | Clear queued/review states; no automatic public publication |
| E2E-04 | Compare stated requirements with incomplete learner evidence | Unknown/needs-confirmation appears; no invented eligibility |
| E2E-05 | Prepare documents, review, open external apply route, report submission | Click/report/receipt remain distinct |
| E2E-06 | Source changes a required item or deadline | Relevant diff appears; affected approval invalidated; work preserved |
| E2E-07 | Share selected evidence, then revoke/expire access | Only selected content visible; future mediated access denied |
| E2E-08 | Request help and coordinator resolves it | Permission boundary and meaningful resolution state persist |
| E2E-09 | Export then request deletion with a queued task | Export scoped correctly; tasks/shares/downstream records handled |
| E2E-10 | AI/provider unavailable or budget exhausted | Truthful degraded/manual path; no fake successful response |

R1 may exercise help with a founder-managed process; formal group/partner routing remains R3 when not enabled earlier.
R2 requires all six category paths even if a category has a clearly explained seasonal empty state.
Test narrow screens, keyboard navigation, readable errors, interrupted connections and low-bandwidth behaviour with representative devices.
Private documents must not be left in service-worker/browser caches without an explicit safe offline design and clear deletion behaviour.

## 6. Source and model evaluation

Use the benchmark contract in [opportunity operations](../operations/09_OPPORTUNITY_OPERATIONS.md): initial held-out minimum 60 cases, ten per category, plus separately labelled adversarial cases.
Report issuer/destination/deadline/mandatory-requirement error counts separately from stylistic or non-critical extraction fields.
No unresolved critical error in the release cases is allowed for an automatically publishing parser; keep manual review enabled otherwise.
The provisional ≥95% non-critical field target counts correct unknown/abstain outcomes with explicit denominators.
Inspect false exclusions as well as false eligibility; avoid rejecting a learner simply because their information is missing.
Record model, prompt, schema, temperature/configuration, input versions, cost and latency so changes can be compared.
Require a regression comparison before changing extraction/prompt/model behaviour used in production.
Small datasets cannot establish selection fairness or predict personal employment success; advanced claims need the R5 evidence gate.

## 7. Durable execution failure tests

Inject duplicate enqueue, concurrent claims, lease expiry, stale worker completion and process death between each state transition.
Simulate crash after external acceptance but before receipt persistence; confirm reconciliation blocks blind consequential resend.
Change attachment or recipient after approval; verify reapproval is required for the changed action.
Cancel/delete/revoke before dispatch and during processing; confirm the UI distinguishes stopped work from already-completed external effects.
Exhaust retries, trip a breaker, resume with a bounded probe and recover the task without fabricated output.
Concurrent budget reservations must respect the configured application allowance; failed/unknown provider usage remains visible.
Use AGT-01–10 as acceptance references and retain the state/event trace with personal payloads removed.

## 8. Performance and cost validation

Start from measured expected pilot traffic, catalogue size and source workload; do not simulate national scale as a substitute for correctness.
Test the predicted peak and a 2× burst scenario using synthetic traffic in an approved test environment.
Measure p50/p95 latency, error rate, cold starts, memory, queue age, task duration, database operations, egress and cost.
Proposed R2 targets: p95 cached/public API reads under 2 seconds and durable command acknowledgement under 2 seconds on the documented test setup.
Exclude long asynchronous completion from HTTP acknowledgement metrics and show its separate wait-time distribution.
These are initial acceptance targets, not advertised SLAs; adjust with user observation and record the tradeoff.
Cap workers/source fetches/model calls during load tests so testing itself cannot create uncontrolled bills or source traffic.
Scale/concurrency configuration changes require another representative load/cost check. Maximum instances do not establish a perfect spending cap.

## 9. Monitoring and response

Required signals: API failures, auth denial anomalies, source freshness by category, review backlog, task age/retries/lease loss, provider uncertainty, spend and deletion overdue state.
Define actionable alerts with owner, user impact, first response and escalation; avoid alerts whose only response is “watch it.”
A public service may remain available while source ingestion is broken; monitor both user-facing availability and data freshness.
Set response windows according to actual founder availability and service terms. Do not claim 24/7 support during an apprenticeship without coverage.
Critical privacy exposure stops the affected capability and follows [incident process](../security/10_TRUST_PRIVACY_AND_SAFETY.md).
Source corruption pauses publication, identifies affected records/users and prioritises corrections.
Provider or budget outage pauses optional paid work while preserving existing records and clear user status.

## 10. Backup, restore and deletion drills

Define recovery objectives before R2: proposed initial recoverable data age within 24 hours and restore within one founder working day.
These objectives depend on funded backup frequency, actual configuration and available support; they are not established guarantees.
Back up required data and configuration, identify excluded transient data, and protect backup access separately.
Firestore managed export/import is a provider facility with its own requirements and operation costs; verify these before enabling it. [Firestore export/import](https://docs.cloud.google.com/firestore/native/docs/manage-data/export-import)
Do not assume one database export captures authentication, object files, access policy, secrets configuration or third-party delivery receipts.
Maintain a recovery inventory covering database, objects, authentication configuration, schema, application image and infrastructure definitions.
Restore to an isolated environment, compare counts/sample hashes, run ownership checks and replay deletion/revocation tombstones before allowing access.
Measure actual recovery time and data gap; fix the procedure if it misses its target.
Run a drill before public launch, after a material storage/schema change and at an affordable recorded recurring cadence.
Deletion tests include cached projections, queued tasks, exports, search and the process for aging deleted data out of backups.

## 11. Release pipeline and rollback

Create real CI jobs for the packages that exist; type/build/lint scripts must execute rather than silently skip absent test commands.
Use lockfile-pinned installs, separate test secrets and managed deployment identity where available.
Build one immutable release image per service/worker and record its digest; do not release an untracked mutable image tag.
Review migrations for backward/forward compatibility; destructive changes need a separate migration and rollback strategy.
Run static/unit/contract/security checks, isolated integration and representative browser tests before promotion.
Deploy to the test environment, validate private invocation and smoke the enabled journeys.
Production promotion records founder release decision, evidence bundle, configuration and rollback conditions.
After deployment, perform bounded production smoke tests with controlled accounts and no real unsolicited sends.
Rollback restores a compatible code/configuration version; rolling back code alone does not undo data migration or external actions.
If data cannot safely roll back, freeze affected writes and apply the documented forward fix/reconciliation plan.
Record release result and observed issues; do not mark a phase complete until required evidence and operational ownership exist.

## 12. Phase gates

| Gate | Required outcome | Explicitly insufficient |
|---|---|---|
| **REL-R0** | Honest inventory, unsafe demo paths isolated, ownership/rules fixed or disabled, six-category contracts, reproducible local checks | A new architecture diagram or claimed audit score |
| **REL-R1** | Invited users complete supervised persisted journey; source provenance, task recovery and support process work | Interest, a waitlist or a staged screenshot |
| **REL-R2** | Public six-category journey, source maintenance, security negative tests, scoped sharing/export/deletion, monitored deployment and restore drill | A green build without live-configuration checks |
| **REL-R3** | Scoped groups/partners/referrals, contribution moderation, tenant isolation, evidence acceptance and database review | Signed-up organisations that never use the workflow |
| **REL-R4** | Issuer/institution authority, integration contracts, credential/RPL/post-placement validation and support capacity | Generic “verified” badges or assumed government API access |
| **REL-R5** | Calibrated advanced intelligence, sufficient consented representative evidence, country-specific operations and funded scale | Small-sample prediction charts or globally accessible hosting |

R0–R2 delivery estimates in the roadmap include validation, source curation and customer work. Do not add a second copy of engineering estimates.
Phases are capability/evidence gates. No dates become commitments until capacity, dependencies and observed throughput justify them.

## 13. Release evidence checklist IDs

- **REL-01:** baseline/requirements-to-tests matrix identifies enabled, disabled, deferred and failed capabilities.
- **REL-02:** type/build/contract checks execute on the release revision with retained results.
- **REL-03:** SEC and AGT negative/race scenarios pass for enabled functionality.
- **REL-04:** E2E and SRC category-level journeys/evaluations pass with named datasets and limits.
- **REL-05:** current deployed IAM/rules/private storage and source/provider configuration are checked.
- **REL-06:** load and cost results demonstrate the configured launch envelope and stop controls.
- **REL-07:** backup/restore/deletion drill meets the recorded recovery targets or the release scope is reduced explicitly.
- **REL-08:** monitoring, incident ownership, support capacity and correction procedures are operational.
- **REL-09:** release/rollback manifest, migration conditions and post-deploy smoke results are recorded.
- **REL-10:** user-facing claims match actual data provenance, verification authority and service limits.

## 14. Evidence bundle template

Store each future release record under a dated release-evidence location with links to actual outputs, excluding secrets and private documents.
Required fields: release ID, phase/gate, commit/image, environment/config, enabled flags, migrations, test/evaluation results, unresolved issues, risk disposition, owner and decision.
Include source/model benchmark version, capacity/cost measurements, restore report and privacy/permission checks where enabled.
Mark missing evidence as missing. A waived cosmetic issue is different from an unresolved authorization or false-verification failure.
Maintain regression cases for every consequential defect found after launch and update the source/agent policy that allowed it.
