# Data, ownership and API contracts

Accepted M0 extension, 13 September 2026: [discovery companion contracts](04_DISCOVERY_COMPANION_IMPLEMENTATION.md) refine scoped source checks, multi-component funding, organisation roles, internship subtypes, residence rules and explanation provenance. They also define browser-local progress and a separate anonymous public-suggestion/receipt flow. The signed-in private `/opportunity-links` endpoint below remains a different later feature. Reconcile the extension into these proposed types during B01/B02 with explicit schema migration; do not conflate the two endpoints or claim existing code implements either.

ATS extension note, 12 September 2026: the [ATS strategy](03_ATS_ADAPTER_STRATEGY.md) distinguishes discovery reference, primary issuer notice, application destination, route capabilities and attributable submission evidence. Map its proposed registry concepts and display states into these canonical contracts during implementation; they are not an independently adopted database schema or replacement state enum.

Status: proposed contracts, 11 September 2026. Endpoints and fields below are build targets, not a statement that existing routes implement them.
Owner: engineering. Read with [product requirements](../product/02_PRODUCT_REQUIREMENTS.md), [trust](../security/10_TRUST_PRIVACY_AND_SAFETY.md) and [agent execution](08_AGENT_EXECUTION.md).

## 1. Contract conventions

Use opaque stable IDs independent of display names, handles, URLs and provider identifiers.
Use UTC timestamps for events; retain original date text and named timezone for deadlines. Unknown timezone stays unknown.
Every mutable record has `schemaVersion`, `revision`, `createdAt`, `updatedAt` and a server-controlled owner/tenant reference where applicable.
Validate requests and model outputs with runtime schemas. Reject unrecognised privilege-bearing fields and prevent mass assignment.
An omitted fact is unknown, not false, zero, ineligible or verified. Use explicit availability/uncertainty states.
Store source-linked assertions separately from user reports and derived calculations; expose their provenance in user-facing language.
Retain immutable versions where a user decision depends on past content, subject to content-reuse and retention policies.
Public read models contain approved, selected fields; private records are not made public by adding one frontend visibility toggle.

## 2. Opportunity model

```ts
type OpportunityCategory =
  | 'bursary' | 'learnership' | 'apprenticeship'
  | 'internship' | 'graduate_programme' | 'job';

type Fact<T> = {
  state: 'stated' | 'not_stated' | 'ambiguous' | 'conflicting';
  value: T | null;
  sourceSnapshotIds: string[];
  evidenceRefs: string[];
  method: 'human' | 'structured_source' | 'rule' | 'model';
  reviewedBy: string | null;
};

type Opportunity = {
  id: string; schemaVersion: number; revision: number;
  category: OpportunityCategory;
  issuerId: string | null; issuerName: string;
  title: string; officialReference: string | null;
  intake: Fact<{ label: string; startDate: string | null }>;
  locations: Fact<Array<{ country: string; province?: string; city?: string }>>;
  deadline: Fact<{
    originalText: string; localDate: string | null;
    localTime: string | null; timezone: string | null; utcInstant: string | null;
  }>;
  compensation: Fact<{ kind: string; amount: number | null; currency: string | null; period: string | null }>;
  requirementSetId: string; currentSnapshotId: string;
  applicationRoute: Fact<{ method: 'portal' | 'email' | 'in_person' | 'post'; destination: string }>;
  lifecycle: 'draft' | 'review' | 'published' | 'closed' | 'withdrawn' | 'archived';
  freshness: 'checked' | 'recheck_due' | 'check_failed' | 'unconfirmed';
  checkedAt: string | null; nextCheckAt: string | null;
  sourceIds: string[]; createdAt: string; updatedAt: string;
};
```

Additional categories require an explicit taxonomy/version change; do not silently map them to jobs.
An opportunity may be cross-relevant to another category through tags without duplicating the underlying intake.
Public lifecycle and source-check health are independent: one timeout does not establish closure.
Do not label an opportunity “verified” from a completeness score. Show precisely which source, destination or issuer was checked.

## 3. Source versions and deduplication

`sources`: source ID, domain/issuer, approved collection method, policy review, category coverage and operational health.
`source_snapshots`: source ID, canonical URL, retrievedAt, HTTP metadata, content hash, extraction version and permitted retained evidence.
`opportunity_versions`: published fields, requirement set, source snapshot IDs and change classification at each revision.
Keep full source content only where permitted and needed; an evidence reference may instead identify a section or minimal excerpt.
Use official reference plus issuer and intake as the strongest deduplication signal when available.
Canonical application URL, category, location, dates and content similarity support candidate matches, not automatic identity proof.
Preserve separate intakes, branches and jobs with distinct references. Title plus company is insufficient as the sole key.
Store merge decisions and alias IDs. A split or mistaken merge must be reversible without losing users' saved plans.
Redirect stale opportunity IDs to the surviving record only when the identity decision is confirmed.

## 4. Requirements, eligibility and preparation

`requirement_sets` are versioned collections of atomic requirements, not a paragraph interpreted afresh on every page view.
Each requirement has ID, kind, required/preferred/unclear level, source evidence, original wording, normalized value and reviewer state.
Kinds include education, subjects/marks, age, citizenship/residency, experience, location, availability, document, funding and programme-specific conditions.
Store explicitly whether a rule is conjunctive, alternative or conditional. Unknown relationships require review.
Eligibility results are `meets_stated_requirement`, `does_not_meet_stated_requirement`, `unknown` or `needs_confirmation` per requirement.
Never convert a partial fit score into a definitive eligibility or selection promise.
`preparation_plans` bind a learner to one opportunity version, selected goal and requirement set.
`checklist_items` record status, owner, evidence IDs, due date, blocker, help request and last confirmation.
Checklist states: `not_started`, `in_progress`, `needs_help`, `ready_for_review`, `confirmed_by_user`, `not_applicable`.
A coordinator confirmation records scope and role; it does not turn a self-reported qualification into an issuer credential.
Changes to requirements create a diff and review task. Preserve completed work that remains valid while marking affected items for recheck.

## 5. Application and outcome truth

`applications` reference the preparation plan and the exact reviewed opportunity/document versions.
Proposed states: `preparing`, `ready_for_user_review`, `external_action_needed`, `submission_reported`, `submission_evidenced`, `response_received`, `withdrawn`, `closed`.
An apply-link click is an event, not submission. A user report and an issuer receipt remain distinguishable.
`submission_evidenced` requires an attributable receipt/reference/message of the stated kind, not a model's interpretation alone.
Record outcome type separately: pending, interview, offer, rejection, acceptance, start, completion or unknown.
Each outcome has reportedBy, evidenceType, observedAt, eventDate if known, source and correction history.
Absence of a reply is unknown, never automatic rejection or placement failure.
Counts in dashboards state their denominator and evidence classes; do not mix reports and confirmed starts without disclosure.

## 6. Learner records and evidence

`users` contain minimal identity/account settings; protected roles are controlled outside owner-editable profile fields.
`career_records` contain goals, experience, learning and selected public presentation fields.
`evidence_items` contain owner, type, title, description, source, dates, associated skill claims, file references and visibility defaulting private.
Evidence types distinguish self-report, work sample, practice activity, peer feedback, supervisor attestation and institution-issued credential.
`attestations` identify issuer identity, asserted fact, subject, evidence scope, issue date, correction/revocation status and signature/proof where applicable.
A learner can remove a public projection or withdraw access; they cannot edit the issuer's assertion as if the issuer changed it.
Issuer corrections create a superseding record/status, with retention and dispute handling governed by the trust policy.
Do not promise that issued facts can never be deleted: retain only the minimum justified record for the defined purpose and lawful retention period.
Downloads already received by another party cannot be recalled by changing a sharing setting; communicate this before export/share.

## 7. Files and access grants

`files`: opaque ID, owner, object key, content hash, size, detected type, scan/validation state, lifecycle state and expiry policy.
An object key is not an authorization token. Never expose bucket-wide listing to clients.
`access_grants`: grant ID, owner, recipient user/organisation, exact evidence/file/field versions, permitted purpose, expiry, revocation and creation consent.
An organisation-wide grant must explicitly name that audience; joining a group does not imply permission to read documents.
Request-time access checks combine grant, current membership, account status, file status and purpose/operation.
Revocation immediately denies new mediated access; previously issued signed URLs remain usable until expiry unless underlying access is invalidated.
Public links use unguessable tokens stored hashed, bounded scope and expiry where needed; sensitive identity files are never public portfolio items.
Audit metadata records the access decision and object ID, not full document contents, token values or identity numbers.

## 8. Organisations, groups and referrals

`organisations` have an independently established operator identity and lifecycle; verification labels explain the check performed.
`memberships` are server-managed edges: organisation, subject, role, invitedBy, acceptance, start/end and status.
Roles: learner, helper/mentor, coordinator, organisation admin, source reviewer, issuer and platform operator; capabilities may overlap only explicitly.
Platform administration is not automatically authority to issue credentials or impersonate an organisation.
`groups` define membership rules, moderation owner and intended audience; posts/help requests inherit the group's privacy boundary.
`help_requests` hold a scoped question, relevant selected context, assigned helper, status and resolution evidence.
`referrals` record consented context, sender, receiving organisation, acceptance/decline, action status and expiry.
A referral is not successful merely because it was sent; receiving acknowledgement and actual assistance are separate events.
Organisational reporting uses only authorised participants/fields and aggregates with the trust document's disclosure controls.

## 9. Proposed API envelope

All versioned endpoints below use `/api/v1`; adapting or replacing existing prototype routes is a migration task.
Public catalogue endpoints allow anonymous reads. Protected endpoints require verified identity and operation-specific authorization.
Firebase ID-token verification validates authentication; business ownership checks still apply. [Firebase verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
Use HTTPS, bounded request sizes, pagination and request IDs. Cookie authentication, if introduced, also requires explicit CSRF/session design.
Use `Idempotency-Key` for create/command requests; scope it to actor+operation and a canonical request hash.
Reuse with the same body returns the original result; reuse with a different body returns `409 IDEMPOTENCY_CONFLICT`.
Use `If-Match`/revision preconditions for edits so stale clients cannot silently overwrite newer data.

| Endpoint | Target behaviour | Authorization |
|---|---|---|
| `GET /opportunities?category=&country=&cursor=` | Paginated approved public projection and freshness | Public, rate limited |
| `GET /opportunities/{id}` | Current version, provenance and requirements | Public; hidden/draft records denied |
| `POST /opportunity-links` | Accept URL as private lead, return task ID | Signed in, bounded fetch permission |
| `POST /preparation-plans` | Save opportunity/version and create checklist | Learner owns new plan |
| `PATCH /preparation-plans/{id}/items/{itemId}` | Allowed progress transition with expected revision | Owner or scoped coordinator grant |
| `POST /applications/{id}/submission-reports` | Record report/evidence type honestly | Owner; no asserted system receipt |
| `POST /evidence-items` | Create owner evidence metadata | Owner; attestation fields protected |
| `POST /files/upload-intents` | Quarantined bounded upload intent | Owner; upload gate enabled |
| `POST /access-grants` / `DELETE /access-grants/{id}` | Grant/revoke selected access | Record owner or authorised representative |
| `POST /help-requests` | Share selected question/context | Group/member boundary checked |
| `POST /referrals` | Create consent-bound referral | R3+ and receiving route established |
| `POST /attestations` | Issue a specifically scoped assertion | R3/R4 issuer capability required |
| `GET /tasks/{id}` / `POST /tasks/{id}/cancel` | Safe task projection/cancellation intent | Task owner or scoped operator |
| `POST /exports` / `POST /deletion-requests` | Queue auditable lifecycle request | Owner, recent authentication where required |
| `POST /admin/opportunities/{id}/publish` | Publish reviewed version | Source reviewer capability |

## 10. Payload examples and errors

```json
{
  "opportunityId": "opp_example",
  "opportunityRevision": 3,
  "goal": "Prepare for this intake"
}
```

The preparation endpoint derives `ownerId` from authentication and returns `201` with plan ID, revision and checklist.
A private link submission returns `202` with `taskId`, `status: queued` and a status URL; it never immediately promises a valid opportunity.

```json
{
  "error": {
    "code": "REVIEW_STALE",
    "message": "The requirements changed. Review the updated items before continuing.",
    "requestId": "req_example",
    "retryable": false
  }
}
```

Standard errors: `400 INVALID_INPUT`, `401 AUTH_REQUIRED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 REVISION_CONFLICT`, `409 REVIEW_STALE`, `422 REQUIREMENTS_UNCLEAR`, `429 RATE_LIMITED`, `503 TEMPORARILY_UNAVAILABLE`.
Return non-enumerating errors for private resources when revealing existence would leak information. Never include credentials or upstream private payloads in errors.
Rate-limited responses include retry guidance; do not retry forbidden or validation failures automatically.

## 11. Export, deletion and retention execution

Export enumerates the requesting person's eligible records and attachments; omit other users' private data and internal security signals.
Create a short-lived private download, log completion and delete the generated package according to policy.
Deletion starts by freezing new background actions and revoking sharing, then removes eligible originals, projections, indexes, cached copies and derived personal records.
Propagate deletion to processors and scheduled tasks; record justified retention exceptions without keeping the deleted content in the audit log.
Backups have a disclosed retention/deletion process; restore must replay deletion tombstones before allowing normal access.
Keep deletion request status and completion/exception evidence. An interface confirmation alone does not prove deletion.
External recipients' independent retention and issuer records follow their disclosed responsibilities; Skilved must not claim total erasure beyond its control.

## 12. Acceptance and migration

- **DATA-01:** all six categories validate and round-trip through ingestion, persistence, API, filter and preparation views.
- **DATA-02:** missing deadline/location/qualification stays unknown; no default qualification or application email is fabricated.
- **DATA-03:** edits use revision checks; previous requirement snapshots remain attributable for recorded decisions.
- **DATA-04:** distinct intakes remain separate; reviewed merges/splits preserve saved learner plans.
- **DATA-05:** user reports, receipts, attestations and credentials retain different evidence classes throughout reporting.
- **SEC-01:** protected role, owner and issuer fields reject client mutation; cross-user and cross-tenant access tests pass.
- **SEC-02:** grants restrict exact resources, audience and time; revoked/expired/new-member access fails appropriately.
- **DATA-06:** export/deletion covers downstream copies and pending tasks, with tested restore tombstone handling.
- **API-01:** runtime schemas, pagination, idempotency, error envelopes and stale-revision behaviour have contract tests.
- **API-02:** fixture routes cannot be used as live authentication, submission or issuer-verification endpoints.

Before changing live data, record old/new schema versions, transformation, representative samples, integrity checks, rollback and owner.
The inspected prototype has no proven production dataset; establish the real state before assuming either a clean rebuild or a live migration.
