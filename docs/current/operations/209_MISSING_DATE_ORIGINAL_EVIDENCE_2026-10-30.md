# Original evidence collection for missing publisher dates

30 October 2026. Follow-up to the [broader twenty-notice batch](208_BROADER_CURRENT_BATCH_AND_EMAIL_DISCOVERY_2026-10-30.md) under the [autonomous delivery target](../engineering/17_AUTONOMOUS_OPPORTUNITY_SYSTEM.md).

## Result and scope

The normal worker can now save original-source evidence when an otherwise supported portal notice has no usable publisher date. This is a separate, explicit opt-in to collect evidence after failed preflight. The publisher hold remains; it cannot advance the notice into extraction, validation, a draft or publication.

This replaces neither publisher evidence nor application-deadline semantics. A structured `JobPosting.validThrough` may describe a platform expiry. Its presence and future timestamp alone do not establish an employer application deadline or verified availability. Exact URL, issuer, title and reference checks still precede interpretable expiry evidence.

There is no employer, notice title, mailbox, URL or expected answer in the production change. Original email/intake verification remains unsupported by this portal-only step. Hosting, scheduling and automatic publication remain undeployed/unqualified. No live cloud, authority, quota, source or role state changes.

## Explicit source policy

`automation.missingDateEvidence: "shadow_v1"` is optional and absent by default. Source validation permits it only with all of:

- `mode: "shadow"`;
- `originalVerification: "shadow_v1"`;
- `employerCrawl: true`, explicitly authorized for that source;
- `undatedNotices: "reject"`.

It cannot be combined with automatic or disabled mode, crawl off, or either private undated-draft policy. The staging launcher retains its crawl-off requirement, so this step is not activated there. Changing a registered source still requires the existing Source role and revision workflow.

Collection starts only from `NOTICE_PRECISION_UNSUPPORTED`, with one portal method and absent or whole explicitly unspecified date evidence. The shared undated timing parser rejects unresolved timing prose, malformed/competing dates, duplicate unspecified fields and closure language. Category, programme, method and other preflight failures cannot trigger this step. Stated dates retain the existing dated path.

## Acquisition and private receipt

The existing original resolver selects the exact linked destination under current issuer/delegation authority. Unknown authority produces `ORIGIN_UNQUALIFIED` without fetching the destination; this step does not discover or approve an unknown company. Optional crawling, robots, network/byte bounds, pacing, source revision, grant, lease and registry/delegation fences remain in force. Retrieval restrictions remain unavailable outcomes, not closure findings. Authorization failures propagate.

An existing private `worker_original_resolutions` receipt connects the publisher snapshot, original snapshot, source revision, attempt and issuer/origin evidence. Its new `assessment` envelope records:

- `version: "missing_publisher_date_v1"`, absent/unspecified timing and the candidate hash;
- `availability: "unverified"`, `admission: "held"`, `publication: false`;
- the assessed field `JobPosting.validThrough`, labelled `structured_valid_through_only`;
- the observed URL, exact body hash and observation time, or null observation fields if no body was acquired.

The existing resolution retains its identity checks, raw structured value and parsed expiry evidence where supported. No publisher date is inserted, candidate hash rewritten, tracking query removed, deadline disagreement settled or issuer scope expanded. A structured expiry with matching identity still yields `SOURCE_DEADLINE_UNRESOLVED` when publisher corroboration is absent. Conflicting identities and URLs retain their own diagnostic reasons.

After receipt storage the job returns to its preflight stage and throws the original publisher error. The exception links the receipt; the existing source hold and restart cooldown apply. Previously public records retain the existing freshness/withdrawal behavior. Evidence collection creates no AI budget or model-cache admission.

## Verification

**276 affected tests pass:** 90 pure parser/resolver/policy/coverage/staging tests and 186 emulator worker/registry/origin/undated tests. Contract typechecking passes. The full catalogue suite was not rerun; the earlier intermittent suggestion-route failure remains open.

Authored normal-worker tests process multiple employers in one batch. Exact qualified originals preserve body/hash provenance and absent/unspecified timing. Unknown authority causes no destination fetch; tracked/clean URL disagreement, wrong issuer, elapsed expiry and retrieval failure retain their distinct receipts. Ambiguous publisher timing produces no assessment. All notices remain at preflight with zero extraction/validation calls, candidates, decisions, drafts or public records. Default behavior performs no original request. Restarted source holds suppress repeat acquisition, and grant revocation during robots acquisition blocks the page request and receipt write.

Private saved-evidence replay and container receipts are retained under ignored `.artifacts/groq/missing-date-evidence-2026-10-30/`; original source snapshots remain in the previous private bundle. These are local tests and replay, not unattended production acceptance. No new provider call or live source retrieval is needed for this sprint.

The same saved twenty-notice, two-page denominator runs through one opt-in publisher registration and its continuation cursor: twenty-two jobs and twenty preflight/original exceptions. Five missing-date portal cases add `ORIGIN_UNQUALIFIED` assessment receipts without original page requests. All 48 replay observations are present; replay fetch count is unchanged. The exclusive first-hold breakdown remains nine precision, six source dates, two category, two unsupported original emails and one original deadline conflict. Candidates, decisions, drafts, public records and model call/budget documents remain zero. This does not demonstrate a qualified original from a real missing-date notice; that positive is still only authored regression evidence.

Both worker and web images build locally; web compilation, typechecking and page generation pass. Network-disabled checks as `node` compare all three changed production-file hashes and verify explicit opt-in, unchanged publisher preflight rejection, unqualified-origin rejection, structured expiry remaining unsupported, and disabled runtime/launcher rejection. No image is deployed.

## Remaining work

Qualify employer/delegated-tenant authority and exact vacancy binding for real missing-date routes before claiming original evidence coverage. Where a platform supplies an expiry, independently establish whether it is the employer's application deadline and preserve each fact's provenance. Original email/intake acquisition remains a separate gap. Positive real-batch extraction/drafting and publication qualification remain open; the evidence step deliberately leaves those admission checks intact.
