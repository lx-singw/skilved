# Current-output batch measurement

25 October 2026. A fixed cohort of five current RecentJobs entries produces **one newly generated, checklist-supported and validator-supported private re-assessment**, from two eligible model cases. It produces **zero additional unique opportunities and zero publication-ready records**. Both eligible notices were familiar. Four of six provider requests hit client deadlines. The private measurement harness also required a correction before any provider request, so this is not an unattended operational success.

## Fixed cohort and outcome

Selection is frozen as the first five entries of one fresh apprenticeship-category page. Every selected detail is read; failed admissions are not replaced by easier cases. The ordinary source policy and existing route registrations decide private eligibility. No source grant, daily cap, issuer relationship, closing-date rule or accepted draft is changed.

| Selected notice | Admission / execution result |
| --- | --- |
| Nampak electrical/fitter | Future written date, but the exact intake's application relationship remains unqualified; no AI call |
| PepsiCo millwright | Explicitly unspecified deadline remains unsupported; no AI call |
| Motus/Kia | Eligible for recent-undated private assessment; both extraction requests hit client deadlines; no extraction or validation completes |
| CNH | Eligible for recent-undated private assessment; fresh extraction, eight-requirement checklist, canonical checks, semantic validation and draft-readiness gate complete |
| VKB Christiana | No parsed application method; no AI call |

The completion rate is **1/2 eligible cases** and **1/5 selected notices**. These are small, familiar-source development observations. They are not an unseen-source accuracy estimate or evidence of automatic publishing readiness. CNH's output preserves seven required competencies, one complete preferred qualification/subject passage, the Maths Literacy exclusion, qualitative regional benefits, source-written location/attendance, requisition and exact original application route. Unknown facts remain unknown; workshop paperwork does not become application-document requirements.

The canonical assessment is saved privately and has fresh, distinct successful extraction and validation receipts. It does not replace the existing accepted CNH draft or renew that draft's expiry. All five accepted runtime drafts remain unchanged. This separation is reflected in the metrics: **one completed fresh assessment, zero newly stored runtime drafts, zero additional unique notices**. Neither eligible case has a stated closing date, so both remain shadow-only under the current publication policy.

## Requests, latency and usage

| Case / stage | Requested endpoint | Result |
| --- | --- | --- |
| Motus extraction | Gemini 3.8 Flash | Client deadline, about 45 seconds |
| Motus extraction fallback | Gemini 3.7 Flash | Client deadline, about 45 seconds |
| CNH extraction | Gemini 3.8 Flash | Client deadline, about 45 seconds |
| CNH extraction fallback | Gemini 3.7 Flash | HTTP 200, about 40.6 seconds; checklist passes |
| CNH validation | Gemini 3.7 Flash | Client deadline, about 45 seconds |
| CNH validation fallback | Gemini 3.6 Flash | HTTP 200, about 11.4 seconds; supported with zero issues |

The existing availability hold locally defers Gemini 3.8 at CNH validation; that skip makes no provider request. All six actual requests are reserved and counted. Four lack usage metadata and remain unknown, without refunds. The two responses report **12,618 total tokens**; reported thinking usage is not added again. Six provider calls are spent per completed assessment across the batch, including Motus's failures. Corrected execution takes about **247 seconds**, excluding earlier setup, screening and the failed harness leg.

The extraction request to the 3.7 endpoint reports `modelVersion: gemini-3.8-flash`; validation through the 3.6 endpoint reports 3.6. Both requested and reported identities are preserved. This run does not establish backend independence, rank model quality or identify the underlying provider/network cause of the timeouts. Monetary cost is not estimated from incomplete usage or unobserved billing data.

There are **15 guarded source GETs**, all HTTP 200: seven for the fixed screen, four for the initial failed harness leg and four for corrected execution. Application/employer pages are not crawled and no application is submitted. Screening uses the frozen pacing; worker requests use the existing per-source cadence.

## Harness failure and preservation

The initial private case object retains an extraction-contract field where an empty result field was expected. Both jobs stop before provider requests, and their initial `extractionCompleted` flags are invalid measurement data. The original report, snapshots and terminal jobs remain intact. A diagnosed continuation initializes result fields explicitly, restores that complete history and creates linked child jobs without resetting either failed job.

The correction consumes the original remaining limits: at most six generation calls, four additional live reads and one further invocation per case. It does not increase source/day caps, replace source IDs, clear caches/holds, alter an answer or retry a semantic rejection. The two failed harness jobs and the engineering intervention are counted separately; the final metrics explicitly mark unattended end-to-end success false.

## Verification and next decision

Contracts build and **105 focused tests** pass; two saved-data assessor positives and ten authored rejecting controls also pass before live calls. All **51 pipeline code/test hashes** and **1,769 pre-sprint artifact hashes** remain unchanged. The last full serial **896-test pass** is the unchanged implementation baseline; it is not rerun for this measurement-only sprint.

The shared ledger now records **143 historical calls, 406,296 known tokens and 72 unknown usages**, preserving every earlier row. Motus spends its remaining two calls and is at **6/6 for the South African source day**; do not retry it until that allowance resets. CNH is at **4/12**, with eight remaining. Provider-day reset and availability expiry do not refund or reset Motus's source/day spend. Existing source revisions, accepted drafts/expiries, exceptions and caches are preserved; new child-job outcomes, call receipts and model holds are retained.

Real execution must next restore `.artifacts/groq/current-output-batch-2026-10-25/continuation/pilot-report.json` plus the latest `.artifacts/groq/gemini-quota-state.json`. Restoring the earlier 137-call report alone would discard this sprint's spend and pending Motus cursor. All raw responses, source snapshots, metrics and the preview remain private under `.artifacts/groq/current-output-batch-2026-10-25/`.

The next execution experiment should freeze a small Flash-Lite latency/quality comparison against the same CNH checklist within its existing remaining allowance; keep the default chain unchanged until measured. Publication needs a separate decision on bounded handling of trustworthy undated notices, because the two currently eligible notices cannot enter the feed under the existing dated-only automatic pilot. Further parser edge cases do not address either observed bottleneck. Gemini remains shadow-only, employer crawling optional/off and production scheduling/publication disabled.
