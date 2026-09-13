# Agent responsibilities and durable execution

Status: proposed execution contract, 11 September 2026. A module name, prompt or deployed container is not evidence of a working autonomous capability.
Owner: engineering. See [architecture](06_ARCHITECTURE.md), [contracts](07_DATA_AND_API_CONTRACTS.md) and [validation](../quality/11_VALIDATION_AND_RELEASE.md).

## 1. Meaning of an agent in Skilved

An agent is a bounded responsibility with inputs, tools, permissions, state, output schema, completion evidence and failure handling.
It may use deterministic code, a model or both. Routine parsing and database operations do not require an LLM.
The product goal is useful progress with accountable decisions; agent count and zero-human-approval metrics are not success measures.
The historical “19 employees” numbering was inconsistent. Use stable capability keys below rather than numbers as runtime identifiers.
Logical roles can share one worker executable, while confidential operations use separately restricted identities when required.

## 2. Historical-role disposition

| Capability key | Role | Earliest intended phase and boundary |
|---|---|---|
| `discovery` | Scout | R1 curated intake; R2 permitted scheduled sources |
| `extraction` | Analyst | R1 draft structured requirements; human review of ambiguity |
| `quality` | Quality | R1 source/provenance/dedup checks; no legitimacy guarantees |
| `matching` | Matching | R1 filters and stated eligibility; explanations from evidence |
| `career_record` | Skills profile | R1 user-controlled record; no invented history |
| `preparation` | Application | R1 checklist/draft/review; external application remains with user |
| `career_guidance` | Career | R2 bounded next-step explanations; R5 validated projections |
| `notifications` | Notification | R1 in-app/manual; provider delivery only with opt-in and funding |
| `outcomes` | Outcome tracker | R1 truthful reports/receipts; no inferential placement claims |
| `message_routing` | Webhook handler | Enable only when a real provider/channel is configured |
| `support` | Customer success | R1 triage and escalation; founder owns unresolved cases |
| `revenue_assistance` | Revenue | R2 operational reporting; pricing/billing changes require owner decision |
| `growth_assistance` | Growth | R2 draft content/measure activation; no automatic external posting by default |
| `evidence_checks` | Document verification | R1 metadata and presence; issuer verification only with actual access |
| `referral_coordination` | Interview coordination | R3 scoped handovers/preparation; calendar sends require permission |
| `reputation` | Reputation | R3 contextual contributions/attestations; no universal employability score |
| `credential_issuance` | Credential issuance | R4 authorised issuer and credential policy; practice completion is labelled accurately |
| `post_placement` | Gig/back-office extension | R4 discovery-led support; no marketplace/payroll build assumed |
| `skills_pulse` | Skills pulse | R5 representative-data gate; earlier internal descriptive metrics only |
| `career_simulation` | Career simulation | R5 calibration and uncertainty gate; scenarios do not promise outcomes |
| `employer_accountability` | Employer accountability | R5 independent evidence/dispute gate; no small-sample public grades |
| `collective_intelligence` | Collective intelligence | R5 sufficient consented evidence and disclosure controls |
| `source_expansion` | Scope expansion | R2 proposes source leads; collection permission never self-approved |

This is a disposition map, not a commitment to deploy 23 services or recreate every historical role unchanged.
Additional social/help coordination is implemented through the same task framework where asynchronous work is genuinely useful.
Deferred roles remain visible in the roadmap with evidence gates; their presence here is not completion or funding approval.

## 3. Task record

```ts
type Task = {
  id: string; schemaVersion: number; capability: string;
  subjectId: string | null; organisationId: string | null;
  inputRefs: Array<{ id: string; revision: number; hash: string }>;
  operationKey: string; requestHash: string;
  state: 'queued' | 'leased' | 'waiting_review' | 'retry_wait'
    | 'reconciling' | 'succeeded' | 'failed' | 'cancelled';
  attempt: number; maxAttempts: number; nextAttemptAt: string;
  leaseOwner: string | null; leaseExpiresAt: string | null; fencingToken: number;
  cancellationRequestedAt: string | null;
  approvalRef: string | null; policyVersion: string;
  budgetReservationId: string | null;
  outputRefs: string[]; errorCode: string | null;
  createdAt: string; updatedAt: string; completedAt: string | null;
};
```

Inputs reference immutable/revisioned objects; do not copy entire private documents into task metadata.
`operationKey` identifies the logical action, such as capability+subject+opportunity revision+intent version.
Retries keep the same logical key. A materially changed intent creates a new task after the old intent is cancelled/superseded.
Store each attempt separately with worker/build/model/prompt/schema versions, timing, bounded cost and sanitized outcome.

## 4. Enqueue and claim algorithm

1. Authenticate the actor and authorize the requested action against current ownership, membership and grants.
2. Validate input, compute canonical request hash and check an idempotency record scoped to actor and operation.
3. In one database transaction, create the domain command, task, idempotency mapping and any outbox entry.
4. A worker queries a bounded eligible batch and claims each candidate in a transaction.
5. Claim succeeds only if eligible state/time, unexpired entitlement and cancellation checks pass; increment attempt and fencing token, then set lease expiry.
6. Execute after leaving the transaction. No network fetch, email, model call or upload occurs inside a retriable transaction callback.
7. Heartbeat extends the lease only for the same owner and fencing token; use bounded time and server timestamps.
8. Completion transaction checks the current token, lease authority and cancellation before recording results and follow-on tasks.

Firestore transaction callbacks can be retried under contention, so side effects belong outside them. Atomicity covers database records, not the external world. [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
Queries do not grant ownership of a task: two workers may see it, but only the successful atomic claim may execute it.
A stale worker cannot commit after a new worker increments the fencing token. It must discard work and report lease loss.
Long operations that cannot finish inside one lease require renewal/checkpoints or a distinct asynchronous provider operation with a receipt.

## 5. Outbox and external side effects

`outbox` stores intent ID, task ID, destination type, approved payload hash, recipient scope, state, attempt and provider idempotency key.
Write the outbox intent atomically with the domain transition that requires it; a dispatcher processes pending intents.
Immediately before dispatch, recheck cancellation, account state, grant/approval scope, input revisions and budget reservation.
Use provider idempotency keys if supported; retain the same key across retries of the same action.
Record a `side_effect_receipt`: intent, provider operation/reference, acceptedAt, lastCheckedAt, evidence type and delivery/result state.
Provider acceptance, recipient delivery and recipient action are distinct states; do not present one as another.
If a process crashes after sending but before recording success, mark the action `reconciling` and query the provider using its reference/key where possible.
If the provider cannot establish whether the send occurred, hold for review instead of blindly repeating a consequential action.
Do not claim exactly-once external execution when the provider offers no deduplication/reconciliation mechanism.
The UI must distinguish “queued,” “provider accepted,” “delivery confirmed,” “failed” and “status uncertain.”
Application submission automation is not enabled in R1/R2; use the same stronger contract only if a later approved integration warrants it.

## 6. Approval and changed-content contract

An approval is a record of actor, action, recipient, purpose, input versions/hashes, attachment versions, policy version, expiry and timestamp.
The approval UI shows the actual content and destination being approved, including which records will be shared.
Changing a recipient, required document, generated answer, file, application destination or material opportunity requirement invalidates that approval.
The task returns to `waiting_review`, presents the diff and requests approval of the new version.
Editing unrelated display text need not invalidate every task; define material-change rules per capability and test them.
No reply or expired approval is not consent. Remove the historic Level 4 “submit after 24 hours of silence” default.
Background refresh, source checking and non-consequential calculations may run under current service settings without repeated prompts.
Creating a task is not authority to perform every tool action the agent can technically reach.
Review counts are logged truthfully. A requirement to log zero human approvals must never override observed user reviews or safety controls.

## 7. Cancellation and revocation

Cancellation sets an intent flag atomically and revokes undispatched outbox intents where possible.
Workers check cancellation before paid steps, before side effects and before committing a follow-on task.
Deletion or sharing revocation triggers the same checks for affected task subject/input references.
If work already reached the provider, cancellation is best effort and must not pretend to recall delivered messages/files.
Final state records whether nothing happened, work stopped, or an external action already occurred and needs follow-up.
Pending review tasks have expiry; inactive jobs must not wake months later and act on stale consent.
User-visible cancellation is idempotent; repeated requests return the current cancellation/result state.

## 8. Retry and circuit-breaker policy

Retry transient timeout, connection, rate-limit and eligible upstream-service errors with capped exponential backoff and jitter.
Respect `Retry-After` and source-specific request policies; rate limits are not a reason to rotate identities or evade controls.
Do not retry malformed input, permission denial, unknown verification authority or cancelled tasks automatically.
Proposed initial maximum: three execution attempts for ordinary extraction; tune per capability after evidence, not globally without thought.
Exhausted tasks enter a reviewed failure queue with a reason, next action and owner; retain minimal diagnostics.
Trip a source/provider breaker after repeated failures; show health degradation and pause further paid or risky calls.
Breaker recovery performs one bounded probe before resuming normal work; a probe cannot submit applications or disclose private data.
Repeated invalid model output can fall back to deterministic extraction or human review, never fabricated successful output.
Provider/queue redelivery must be safe even if infrastructure later changes. Pub/Sub acknowledgements and delivery choices do not remove application-level idempotency needs. [Pub/Sub subscriptions](https://docs.cloud.google.com/pubsub/docs/subscriber)

## 9. AI and tool policy

Define an allowlist of tools and field-level data for each capability. Source text, CV content and messages are untrusted data.
Instructions embedded in a webpage or document cannot change system prompts, destinations, permissions, budgets or task scope.
Fetch only allowed schemes/hosts after DNS/redirect checks; block internal addresses and credential-bearing URLs.
Models return bounded structured output, citations to input evidence and uncertainty; schema success alone does not prove factual correctness.
Validate critical values against the source: issuer, deadline, application destination and mandatory requirements.
Store prompt/model/schema versions and input hashes; keep raw private content out of ordinary traces.
Do not send uploaded IDs or certificates to a model by default. Any needed processing route must pass the privacy/data-minimization decision.
The model-provider adapter returns token usage/cost metadata, finish reason and validation state, not only text.
Selection evaluates representative quality, latency, cost and processing terms. No model is permanently designated the best without task evidence.
Use deterministic eligibility rules with “unknown/needs confirmation”; model fluency cannot establish NQF equivalence or issuer verification.

## 10. Cost and scheduling contract

Every paid task has a maximum request/token/page budget and an estimated cost reservation.
Reserve capacity atomically against the configured capability/day/month allowance; reject or defer when exhausted.
Reconcile estimated and actual cost after execution, including failed attempts. Unknown billing must be flagged rather than recorded as zero.
Set maximum tasks per run, job time, source pages and model requests. The worker stops cleanly when a boundary is reached.
Use priority classes: security/deletion, deadline-critical user work, source maintenance, then optional analysis/growth.
Priority never bypasses permissions. Avoid starvation by ageing eligible maintenance tasks within the budget.
Scheduled source refresh runs per source policy rather than a blanket four-hour crawler loop.
Share cached, reviewed extraction of the same source version across users; generate private material only when requested and funded.
There is no assumed always-on agent fleet or unlimited autonomous experimentation.

## 11. Observability and evaluation

Emit task state transition, attempt, queue wait, lease expiry, stale completion rejection, retry, review reason, cost and receipt events.
Correlate by task/intent/release identifiers. Use restricted audit access and retention controls; logs are not a second document vault.
Dashboards show completion and unresolved/reconciliation rates, not only successful calls.
Evaluate extraction against held-out fixtures; evaluate assistance by whether users complete the intended action accurately.
Maintain a regression set for fabricated requirements, false verification, wrong recipients and prompt injection.
Human override is recorded with reason and corrected version; use it to improve rules/prompts after review.
Operational owner is the founder initially, with response commitments limited to actual available support capacity.

## 12. Acceptance gates

- **AGT-01:** duplicate enqueue/dispatch and two-worker races produce one accepted domain intent and no duplicate committed completion.
- **AGT-02:** a worker with an expired/replaced lease cannot commit or create follow-on actions.
- **AGT-03:** crash after provider acceptance enters reconciliation; blind consequential resend is blocked.
- **AGT-04:** changed document, recipient or material requirement invalidates review; silence never authorises an action.
- **AGT-05:** cancellation/revocation/deletion stops pending actions; already-completed effects are reported accurately.
- **AGT-06:** retry exhaustion produces an actionable reviewed failure; infrastructure recovery resumes eligible work safely.
- **AGT-07:** hostile document/source text cannot cause new tool permissions, destinations or data access.
- **AGT-08:** spend reservation/limits and stop switches work under concurrent execution and include failure costs.
- **AGT-09:** provider outage leaves truthful degraded results and does not create fake verification/application receipts.
- **AGT-10:** logs expose versions, timing and decisions sufficient for diagnosis without raw sensitive payloads.

R0 implements the task skeleton and race tests; R1 exercises real bounded extraction/review; R2 adds operational recovery and provider delivery only when enabled.
R3–R5 reuse this contract for referrals, issuer interactions and advanced capabilities, adding explicit action-specific acceptance evidence.
