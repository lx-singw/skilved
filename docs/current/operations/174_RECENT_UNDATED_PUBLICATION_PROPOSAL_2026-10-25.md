# Proposed recent-undated publication policy

25 October 2026. **Design proposal only; no runtime, contract, source grant or publication flag changes in this sprint.** Extend the eventual automatic pilot to a narrowly qualified class of recent notices whose closing date is absent or explicitly unspecified. Keep the closing date unknown, disclose the limited source check and expire visibility promptly. Recent CNH and Motus results motivate this proposal; they do not qualify either notice for publication.

## Admission

The proposed policy is an explicit, versioned per-source opt-in, separate from the existing `shadow_recent` private-assessment policy. It requires the ordinary source qualification, supported apprenticeship scope, one original application method, exact employer/delegated-route registration, attributable issuer, complete requirements and successful material-fact and semantic checks. An unresolved route, competing intake, ambiguous condition or failed checklist remains a hold. AI cannot approve a destination, invent a closing date or classify an application button as evidence that applications remain open.

| Source timing evidence | Proposed treatment |
| --- | --- |
| No closing-date statement anywhere in the bound current notice | Eligible for the undated rule if all other gates pass |
| One unambiguous closing/deadline field whose entire value is “not specified” or “not stated,” allowing case/whitespace/punctuation normalization | Eligible as explicitly unspecified; retain exact source wording and evidence |
| Future date-only deadline | Use the existing dated policy |
| Past date, affirmative current closure or vacancy-filled notice | Withhold; preserve the actual evidence and reason |
| Conflicting dates, malformed/relative dates, “TBC,” “rolling,” “until filled,” ambiguous wording or unsupported timing precision | Hold for a separately qualified policy; do not treat as missing |

Any competing timing statement elsewhere in the notice takes the case out of the narrow missing/unspecified branch. Classification must operate on the bound notice, including its introduction and application instructions; a matching substring is insufficient. Qualifying explicit unknown wording requires implementation and tests: the current worker rejects it. The canonical deadline stays `not_stated` with a null value; exact source wording remains in private source evidence and a typed policy decision rather than becoming an invented date or an invalid fact quote.

## Time limits and source checks

Use a **seven-day maximum age from the validated original publication instant** and a **six-hour maximum source-check TTL** for the initial pilot. Both are proposed ceilings. Validate publication ≤ first acquisition ≤ current time. Unknown, future or contradictory publication timestamps are held. Record the origin once, bound to the employer, original destination and intake identity, and retain the earliest supported origin and first-seen history. Refetches, text corrections, new job IDs, source revisions, duplicate URLs or apparent reposts must not restart the seven-day window. Uncertain repost/intake identity is held rather than automatically treated as a new opportunity.

For a successful check at time `checkedAt`, visibility expires at the earlier of `checkedAt + 6 hours` and `originalPublishedAt + 7 days`. At the exact expiry instant, feed, detail, export and application handoff must all suppress the actionable listing, even if the worker or scheduler is down. There is no stale grace period. Existing accepted drafts and their expiries are not migrated or renewed merely because this policy is proposed or later implemented.

A renewal requires a real successful guarded source retrieval, confirmed notice identity, unchanged qualified issuer/application relationship and a current source/grant/revision check. An HTTP 200 alone is insufficient: identity/layout failure or material changes hold the item. Unchanged text may reuse correctly bound extraction/validation caches; polling does not require new AI calls. Changes to requirements, issuer, route, timing or other material facts require reassessment before further visibility. Registry/policy revisions must invalidate or requalify dependent decisions. A retrieval that finds an existing listing stale does not resurrect it before the full renewal transaction succeeds.

Schedule source maintenance with enough capacity and headroom to finish before the six-hour TTL. A missed run, fetch failure, exhausted allowance or unavailable provider lets the listing expire. A missing category/index entry or failed request alone does not prove the employer closed recruitment. Affirmative current closure evidence withdraws the item with an evidence-bound reason. Operator withholding is sticky; paused sources, revoked grants and revision/lease conflicts remain enforced at renewal and at every public read/handoff. Retry/repost jobs cannot bypass these controls.

## What the applicant sees

Show **“Closing date not stated”**, the last successful source-check time and **“Employer availability has not been checked”** beside the application action when employer crawling is off. A successful publisher check supports only the checks actually performed; it cannot produce an “open,” “employer verified” or “deadline confirmed” claim. Missing optional facts remain unknown.

The application action opens the exact original employer/delegated portal or source-authorized email/method. Discovery attribution does not change that destination to RecentJobs or StudentRoom. Employer-page crawling remains optional and off by default. Enabling it later requires its own qualified checks and must handle conflicting employer timing evidence explicitly; it cannot silently borrow this undated exception. Public output uses allowlisted fields and exposes no raw snapshots, provider replies, credentials or internal quota details.

## Effect on reviewed notices

| Notice | Effect of this proposed date rule alone |
| --- | --- |
| CNH and Motus/Kia | Could enter a future undated qualification cohort; private extraction success does not establish publication readiness, employer availability or a renewed expiry |
| PepsiCo | Narrow explicit-unknown wording could pass the date rule; the exact delegated application relationship remains unregistered, so the notice stays held |
| Nampak | Already dated; exact intake/email authority and shared-email programme representation remain separate holds |
| VKB Christiana | Missing application method remains a hold |
| Lifta and Unique Personnel | Original publication age exceeds seven days; classification, route or layout concerns also remain unresolved |

All existing model/day, minute, source/day and attempt allowances continue to apply. Failed calls remain spent. Model exhaustion persists across jobs until its actual reset; a provider reset does not reset the South African source/day budget. The proposal creates no paid fallback or extra allowance.

## Implementation and qualification sequence

1. Implement the timing classifier and immutable notice-origin record in shadow mode, with explicit evidence for both absent and narrowly unspecified deadlines. Keep automatic publication disabled.
2. Test admission boundaries and misleading wording, duplicate/repost identities, future/invalid timestamps, material changes, unchanged-cache reuse, exact six-hour/seven-day expiry, failed renewals and simultaneous jobs. Test pause, revocation, sticky withholding and revision/lease races across feed, detail, export and original application handoff. Public labels must match the checks performed.
3. Freeze a current shadow cohort without replacing failed cases. Measure correct inclusion/exclusion, identity binding, source-change/closure handling, expiry suppression, check capacity, quota consumption and exception rates across repeated runs. Distinguish source admissions, fresh assessments, stored drafts and public records. Single familiar-source model success is insufficient.
4. Qualify each source and original application relationship, verify deployed identity/grants/egress and maintenance capacity, and record an explicit enablement decision before any bounded automatic pilot. Expand only from observed results.

The [Flash-Lite comparison](173_CNH_FLASH_LITE_COMPARISON_2026-10-25.md) is the execution result for this sprint. This proposal has no live experiment or acceptance claim of its own. Current code still permits recent undated notices only in private shadow assessment, and the automatic pilot still requires a future stated date. Production scheduling/publication remains disabled.
