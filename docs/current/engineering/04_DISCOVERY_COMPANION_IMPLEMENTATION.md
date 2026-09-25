# Discovery companion implementation and contract extension

Implementation update, 25 September 2026: B02's schema, public projection, bounded requirements and API/storage/legacy conversion contracts are now implemented. The [canonical contract and B03 handoff](14_CANONICAL_OPPORTUNITY_CONTRACT.md) specifies actual names, imports and behavior and supersedes conflicting illustrative shapes below. Live routes, persistence, review authorization and publication remain later implementation; formal G0/B02 acceptance is open. [Current evidence](../quality/evidence/m0/2026-09-25-b02-contracts/README.md).

Updated: 13 September 2026. Status: proposed implementation specification; no routes, controls or migrations are claimed to exist. Owner: engineering/founder. Extends [canonical data/API contracts](07_DATA_AND_API_CONTRACTS.md), [ATS strategy](03_ATS_ADAPTER_STRATEGY.md) and [M0 scope](../product/03_DISCOVERY_FIRST_MVP.md). Names below are proposed contracts to reconcile with actual repository types during S01; do not create a second competing opportunity model.

## 1. Implementation boundaries

24 September refinement: implement the [adopted operational improvements](../governance/08_OPERATIONAL_REFINEMENTS_2026-09-24.md) within the existing M0 boundaries. These are contracts, not completed controls.

Retain the reference stack and permitted crawler/source pipeline. M0 adds bounded public read models, review operations, browser-local progress and a reviewed public-link intake. It does not require private document storage, learner accounts, real-time chat, a graph database or full autonomous application agents. Existing useful code should be reused after testing; unfinished sensitive routes must be disabled server-side in the public deployment.

Flow: permitted source/lead → safe retrieval → draft assertions → validation/review → versioned publication → cached public projection → feed/detail/share → local progress/external handoff. A public visit does not trigger an unbounded crawl, model call or credential check. Parse/review once and reuse approved results until sources change.

B01 begins from the [bounded audit](09_BASELINE_AUDIT_2026-09-24.md). Inventory all public routes and imports, then disable unsupported private/verification/action routes at the server/deployment boundary. Select the public application and required dependencies for reproducible checks; package removal is not an automatic prerequisite. Excluding an agent from workspace discovery does not remove a web route's import of it. Track excluded checks and unfinished packages explicitly, without reporting a filtered pass as monorepo success. Check manifests, runtime, lint dependencies/configuration, build-time network assets and actual type diagnostics before choosing repairs. Do not promise a fixed error count or one-day completion. A static catalogue may support an isolated labelled development demonstration; it is not proof of reviewed live inventory or a source pipeline.

## 2. Extend the canonical opportunity model

Use existing `Fact<T>`, versions and source references. Add these explicit concepts, with runtime validation and schema migration:

| Concept | Required semantics |
|---|---|
| Internship subtype | student/WIL, graduate, other stated or unknown; retain one internship category |
| Participant organisations | role-specific issuer, employer/host, training provider, qualification issuer and oversight relationship; each assertion sourced, unknown roles unfilled |
| Place and attendance | opportunity location separate from residence eligibility; remote/hybrid/in-person, attendance and relocation conditions only where stated |
| Qualification requirements | original designation, level where stated, subjects/marks, completion/provisional status, AND/OR/conditional expression; no automatic equivalence |
| Compensation/funding components | multiple typed components: salary, stipend, tuition, books, accommodation, transport, allowance, other; stated amount/currency/period/coverage and uncertainty per component |
| Application document constraints | document kind, requested stage, required/preferred/conditional, certification wording, format and size limit where stated; unknown is not a default limit |
| Explanation | text, source assertion IDs, requirement-set revision, authoring method and review state; explanation never overwrites original wording |
| Checks | scope, outcome, actor/method, checkedAt, evidence/source version and next check; public summary separated from internal notes |

Migrate singular compensation without losing its original assertion; do not sum mixed periods, currencies or tuition and monthly cash into a fictitious salary. Keep existing values readable during migration. Source-derived no-experience filters require affirmative evidence; unknown rules remain unknown. National/remote records remain accessible with local filtering controls.

Affordability presentation reuses sourced compensation, attendance and location components. It introduces no guessed fares, net-income rank or hard eligibility exclusion. If later user-entered costs are trialled, keep estimates separate from source facts, align currency/period, allow unknowns and evaluate privacy/storage before implementation. That calculator is not required for M0.

## 3. Source checks and publication projection

Proposed `source_check` record: ID, opportunity/source revision, scope (`issuer_attribution`, `announcement`, `application_relationship`, `destination_reachability`, `availability`, `requirements`), outcome (`supported`, `unresolved`, `failed`, `contradicted`), method, checkedAt, reviewer reference, evidence references, nextCheckAt. Internal security observations are excluded from public projection. This is a record of a scoped check, not a certification.

Render only the check that supports each claim. A successful HTTP response cannot establish vacancy availability; a failed request cannot establish closure. Source, discovery reference and application destination remain distinct. Follow issuer-established ATS relationships even across domains. Unknown or materially changed destination relationships require review before an active apply action is restored.

Maintain the existing lifecycle enum; represent withholding through publication eligibility and a separate risk/review disposition rather than silently adding an incompatible state. For a previously published record under a serious unresolved review, serve a minimal status page, suppress the active application action and remove it from discovery as appropriate. Do not expose an allegation as a proven fraud label. New unreviewed records return no public detail. Cache/index/share metadata invalidation follows the publication decision and preserves a safe tombstone for already-shared links where justified.

## 4. Public-link intake separate from private preparation

The existing signed-in `POST /opportunity-links` remains a later private preparation feature. Add a distinct M0 endpoint for public opportunity suggestions; accepting an anonymous suggestion does not authorise private profile processing or a public post.

| Proposed endpoint | Contract and boundary |
|---|---|
| `POST /api/v1/opportunity-suggestions` | Validated public URL only; explicit supported-source policy; bounded, idempotent intake; returns existing approved listing or a private receipt capability with `202` |
| `GET /api/v1/opportunity-suggestions/{id}/status` | Receipt capability in Authorization header, not URL; returns minimal status and approved public result if available; no raw submitted link or reviewer notes |
| `DELETE /api/v1/opportunity-suggestions/{id}` | Capability-authorised withdrawal/deletion request; apply declared retention exceptions; cannot remove independently sourced public opportunity |
| `POST /api/v1/opportunities/{id}/reports` | Public bounded report reasons; review receipt; cannot edit or remove a listing directly |
| `POST /api/v1/admin/suggestions/{id}/resolve` | Source-reviewer permission; expected revision, resolution reason and public record link if any |

M0 does not collect an email, phone, screenshot or candidate document for suggestions. Define statuses `received`, `reviewing`, `resolved_to_listing`, `unresolved`, `unsupported`, `paused`, `withdrawn`. Deduplication may reuse a public result but must never reveal another submitter's private receipt or their identity. A raw URL match is not an authenticity decision. New intake receives a new capability even if internal work is deduplicated.

Use high-entropy scoped receipt capabilities, store server-side hashes, redact headers/tokens from logs, declare expiry, return non-enumerating failures and rate-limit status access. Store browser receipt material separately from public saved listings; never include it in analytics or share URLs. Warn that clearing browser data loses anonymous access. Reconcile the proposed defaults in [M0 retention governance](../governance/03_DATA_GOVERNANCE_AND_RETENTION.md) with actual deployment/provider behaviour and public notices before enabling intake. Expiry and withdrawal must stop unnecessary queued work; expiry is not a promise that independently justified incident evidence is immediately erased.

## 5. Safe fetching and untrusted content

M0 source policy is allowlisted retrieval after review, not an unrestricted URL-to-browser service. Reject unsupported schemes, embedded credentials, local/private/link-local/metadata destinations and suspicious sensitive/session-bearing links. Resolve and validate destination IPs at connection time; enforce network egress restrictions and handle DNS changes. Disable automatic redirects or independently revalidate each bounded hop, including public shorteners. Do not rely on client validation or hostname regex alone. Bound time, bytes, redirects, retries, parsing resources and concurrency. [OWASP SSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)

An unsupported social/private/login route receives an honest status; no cookie borrowing, account rotation, CAPTCHA bypass or login wall circumvention. Review may independently locate a permitted issuer source. Do not scrape private groups or messages. A lack of corporate website does not prove fraud; reviewers need an appropriate independently established source path.

Source text and model output are untrusted data. Strip unsafe active content, escape rendering and restrict parsers. Instructions embedded in a page cannot alter crawler permissions, publish a record or trigger outbound messages. The fetch worker has no learner documents, personal credentials or privileged publication capability. M0 screenshots/uploads remain off. Reuse the existing threat model for XSS, SSRF, prompt injection and queue abuse.

## 6. Browser-local progress contract

Proposed versioned local record: opportunityId, lastViewedRevision, savedAt, updatedAt, userStage (`interested`, `preparing`, `applied_reported`, `not_pursuing`), lastRouteOpenedAt and reportedAppliedAt. Store only minimal public-record references and personal annotations; no ID files, contact details or private account tokens. Source facts are loaded from the current public record rather than becoming a second editable source database.

Application-route opening is an independent event. User-selected stages remain reversible; reopening a route cannot overwrite applied status. A browser timestamp is user-controlled evidence, not an authoritative submission receipt. Later account migration requires explicit user choice, preserves reported evidence classes and does not silently import another shared-device user's shortlist. Do not claim local data is encrypted, backed up or secure from another browser user.

Test unavailable storage, quota failures, malformed/older schema records, clearing, multi-tab updates and intentional user removal. Use revision/time reconciliation without silently re-creating cleared work; corrupt items should not crash the feed. Local storage is origin-specific and can be unavailable or cleared, so success messages must follow successful writes and fallbacks must work. [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

Describe loss on site-data removal/device change and shared-browser visibility at first save. Test external handoff and return without treating navigation as data deletion. Test actual site-data removal separately from HTTP asset-cache clearing. Public-checklist export is a fallback reference, not local-state backup, restoration or cross-device migration.

On revisit, resolve merged IDs, compare viewed/public revisions and show material differences. Keep prior user stage when a listing closes. Browser-local M0 has no guaranteed background notification. A withdrawn/unsafe record must not retain an active application link in local cached content.

## 7. Sharing and metadata

Build share text from the approved current public projection. Allow user review and user-initiated dispatch. Use native share when supported, an explicit WhatsApp compose flow and copy-link fallback; encode parameters and test Unicode, cancellation, no-app and desktop behaviour. Native sharing requires appropriate browser support, security context and user activation; completion behaviour varies by platform and cannot prove delivery to a recipient. [MDN share](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)

Serve accurate canonical URL, title, description and modest public preview imagery if used. Do not put raw submitted URLs, receipt capabilities, personal progress, invite identities or profile facts into metadata. Closed/withdrawn listings retain safe current landing states. Third-party preview caches and forwarded text cannot be recalled; include an as-of date in longer text and encourage checking the current page. No guarantee of consistent preview layout across messaging clients.

Build plain-text preparation exports from the same approved current projection and reviewed checklist used on the detail page. Include source revision/check time and a separately labelled canonical detail URL and permitted official application URL. Whitelist public fields; never read local user stages, completed ticks, private notes or receipt storage into the export. Copy, text-file download, native share and WhatsApp compose reuse this public payload. Validate/encode links, handle Unicode and unavailable APIs, and report copy/download initiation accurately without claiming retention or message delivery. A record that is closed, withheld or materially changed must export its current safe state; an unavailable current record falls back to the canonical link. Previously saved external copies cannot be revoked or updated. No restore/import subsystem or personal checklist-completion model is added by this refinement.

## 8. Performance, accessibility and cost

Prefer reusable static/server-rendered public content, bounded cursor pagination, compression, minimal fonts/scripts and appropriately sized optional images. Keep core source/detail text readable if enhancement fails. Do not embed live social widgets, autoplay or programmatic ad scripts in M0. Cache only approved public data; privileged review and receipt responses are private/no-store. Use explicit invalidation for safety and material content changes.

During the first delivery slice, record cold/repeat transfer size including scripts/fonts/images, requests, usability timings and memory behaviour for feed/detail/shortlist on the chosen low-end phone and constrained network. Set measured page/JS budgets and failure thresholds in release configuration; the old 100KB number is not a promise or silently assumed acceptance test. Tests must exercise load-more, back navigation, focus and interrupted requests, not just a desktop landing screenshot.

Limit AI to reviewed batch extraction/explanation where useful; deterministic formatting renders saved approved facts. Cost model includes source checks, human review, corrections, hosting, status abuse and support. Set intake and workload limits with an honest paused state instead of unlimited background processing or charging learners when a limit is reached.

Record ordinary browse behaviour during model unavailability and verify that approved pages do not invoke per-visit inference. This does not make hosting, source maintenance or the user's connectivity free. Measure actual transfer size and device/network behaviour; configuration region is not evidence of deployed location or carrier zero-rating. Seek a carrier arrangement only as a separately justified later option, not a launch assumption.

## 9. Migration and release checklist

S01 inventories actual types/routes and chooses migrations, feature flags and rollback. Map these proposed fields into canonical schemas; keep old records readable or backfill explicitly. Separate real inventory and synthetic fixtures. Audit all exposed APIs/storage rules, not only newly designed screens. Stage with representative six-category fixtures, then permissioned real-source records. Enable public read → operational checks → local progress/sharing → suggestion intake only after their acceptance evidence. All accepted M0 slices remain planned; a blocked slice requires explicit scope/status reporting, not silent removal.

Record deployment/configuration, schema version, source sample, test evidence, measured budgets, owner, queue coverage, kill switches and rollback. Suggested controls: disable new intake, pause crawler, withhold listing/destination, invalidate public caches and roll back read projection without losing reviewed source history. [Acceptance tests](../quality/02_DISCOVERY_COMPANION_ACCEPTANCE.md) and [delivery sequence](../planning/03_M0_COMPANION_DELIVERY_PLAN.md) define the reviewable build work.
