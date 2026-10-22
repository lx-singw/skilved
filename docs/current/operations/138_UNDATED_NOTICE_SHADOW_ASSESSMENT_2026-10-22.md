# Undated notices: bounded private assessment

22 October 2026. Implements an explicit route from a recent undated notice to extraction, validation and an unapproved private draft. It does not qualify undated notices for automatic publication.

## Policy and implementation

`automation.undatedNotices` defaults to `reject`. A source can opt into `shadow_recent` only with `automation.mode: shadow`; the strict source schema rejects this option in automatic or disabled mode. Use the normal source registration workflow and a new source revision when changing policy. Existing dated notices retain their publication gate.

The first policy supports the single-notice worker path with exactly one registered original application method. Before model work it requires:

- No parsed deadline and no closing-date, deadline, apply-by, rolling-application or until-filled wording. Explicit “not stated” closing-date wording and invalid, incomplete or conflicting dates remain outside this exception.
- No detected closure statement, unresolved programme subject scope or physical-submission instructions. Existing apprenticeship-category and route-registration checks still apply.
- One valid source publication timestamp, no later than acquisition, less than seven days old. The adapter's source timestamp is used; the URL's date and the observation day cannot substitute for it.
- A valid acquisition timestamp no later than the current time. Private validity ends at the earlier of publication plus seven days and acquisition plus `checkTtlHours`, which is bounded by the source schema to 24 hours.

The worker saves the first acquisition timestamp for a job and content hash. Retrying unchanged content preserves that timestamp; it cannot renew the review window. A separate job that actually retrieves the same content has its own acquisition, independently of the older shared content snapshot. Changed content also gets a new acquisition. None of these events changes the employer's deadline.

After extraction and semantic validation, `draftGate` requires the deadline fact to remain `not_stated` with a null value, the exact original registered route, a qualified issuer match and resolved material facts. An affirmative model assessment cannot bypass these checks. If an optional employer crawl supplies a closing date, the undated path stops for reconciliation. Missing primary pages still fail when employer crawling is explicitly required by that source configuration.

The gate runs again inside the final transaction. Passing saves a review record with publication unapproved and no automatic public checks or freshness watch. Its private decision is `undated_shadow_pass`, with `undated_shadow_v1`, the publication/acquisition timestamps, review expiry and `availability: unverified`. Expiry limits processing eligibility; an already saved private draft remains a review record, without a new automated maintenance schedule. `publicationGate` still rejects the unknown deadline. Programme extraction does not gain this exception.

Hold-policy version three releases older negative preflight decisions. Freshness failures before model work can create the existing bounded source hold. Original exceptions, snapshots and published freshness watches remain preserved.

## Evidence

Nine policy tests and seven targeted worker tests pass. The contracts build and all 764 tests across 79 selected catalogue test files pass serially. The selection includes the new policy test and all 78 previously tracked test files; two pre-existing unrelated untracked replay-ticket files are excluded and preserved byte-for-byte.

Worker regressions cover private drafting, source-revision release of an old hold, stale-source suppression, expiry inside the final write, unchanged-retry acquisition memory, semantic rejection and hold-version migration. Pure policy checks also reject automatic-mode opt-in, fabricated deadlines, changed routes, unknown requirement logic, primary conflicts and deadline variants. The dated path remains covered by the full existing suite.

An offline preflight replay uses three saved notices and their original 22 October acquisition receipts. Under hypothetical route registrations, CNH and the corrected Shandalea candidate can reach private model assessment. Caxton remains blocked by its missing application method. This replay creates no source registration or grant and establishes neither issuer qualification nor source availability. It does not run extraction or validation, assess image contents, or create real drafts. These outcomes are narrower than an end-to-end pilot.

There are zero source requests and zero provider calls in this sprint. The shared Gemini ledger remains byte-identical: 100 cumulative generation calls, 319,554 known tokens and 43 calls with unknown usage. These are historical totals, not today's RPD. All 867 prior artifact hashes are preserved; previous real drafts, spending, receipts and failures remain unchanged. Source snapshots, replay details and evaluation evidence remain private under `.artifacts/groq/undated-shadow-policy-2026-10-22/`.

## Next trial and remaining limits

Run one bounded CNH shadow trial after freezing an independent source checklist, issuer/route scope and call cap. Preserve the notice's preferred qualification wording, subject grouping, missing deadline and original portal; programme duties must not become applicant submission documents. An extraction or validation failure stays a failure, with original responses and usage retained.

This sprint changes no real source configuration. Gemini remains shadow-only, employer crawling remains optional/off, and production scheduling and publication remain disabled. Seven-day recency and a 24-hour acquisition cap are limits on private assessment, not evidence that an employer is still accepting applications. A publication policy for undated opportunities remains unqualified.
