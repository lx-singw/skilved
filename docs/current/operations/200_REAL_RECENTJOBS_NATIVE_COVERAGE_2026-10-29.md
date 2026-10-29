# Fresh RecentJobs cohort: native coverage and shared format gaps

29 October 2026 (SAST). A fresh, fixed cohort of the first ten notices on the [RecentJobs apprenticeship listing](https://recentjobs.co.za/category/apprenticeships/) was collected and assessed without employer/title exclusions. All ten publisher details parsed. Three passed the cheap dated-notice checks: two email methods and one portal. All ten remained held under the current native verification lane; no extraction, validation, draft or publication resulted.

This measures actual format/policy coverage after [corporate-to-ATS discovery](199_CORPORATE_ATS_DISCOVERY_2026-10-29.md), not national accuracy, employer legitimacy or a determination that all ten vacancies are unavailable. In particular, an undated notice is not necessarily closed, and a closing-day hold is not proof that its employer has stopped accepting applications.

## Selection, acquisition and evidence

The selection rule and request bound were saved before collection: first ten distinct notice URLs in publisher order on the first apprenticeship page, no exclusions, at most 32 native retrieval attempts and at least three seconds between starts. The observed listing contained exactly ten cards. Its order and raw observations are frozen privately, including failures.

The first attempt retrieved robots successfully and timed out on the listing. One retry used the same normal guarded client, user agent, response limits and ten-second timeout. That retry succeeded. Across both attempts there were **16 bounded native retrieval attempts: 15 received and one timeout**, including publisher pages and the sole eligible portal's robots/notice. No challenge endpoint, alternate user agent, cookies, browser-script execution or access bypass was used. An independent web read separately confirmed listing availability; it is not counted as a native worker retrieval.

Source snapshots, candidates, the collection plan, exact URLs, input hashes and reports remain under ignored `.artifacts/groq/real-coverage-2026-10-29/` and `.artifacts/shadow/`. No real notice HTML, provider response or private evaluation manifest is committed.

## Fixed-denominator results

| Native result | Notices | Meaning |
| --- | ---: | --- |
| No recognized closing date extracted | 3 | Dated lane cannot assess these; no date was invented |
| Closing date explicitly unresolved | 1 | No usable calendar deadline was established |
| Application route not extracted | 1 | No supported destination/method was obtained from the parsed body |
| Publisher's date is today | 1 | Existing closing-day policy hold; no employer closure asserted |
| Publisher's date has elapsed | 1 | Source-date hold; employer availability was not fetched |
| Dated email application method | 2 | Native original-method corroboration is not implemented for email |
| Dated portal with unsupported representation | 1 | Readable employer HTML uses JobPosting microdata rather than the supported JSON-LD |
| **Total selected and parsed** | **10** | **Every selected notice remains in the denominator** |

The dated portal's page is readable and contains one Schema.org JobPosting microdata scope with title, description, hiring organization and date markers. The live adapter still rejects it as unsupported. Detecting those markers does not decode employer facts, resolve date semantics, qualify its authority or make the vacancy publishable. This is a shared serialization/adapter gap, not a reason to add an employer-name or vacancy-ID branch.

"Not extracted" is a parser result, not a claim that an image, attachment, unrecognized wording or original employer page contains no such information. This sprint does not perform OCR, indirect-route discovery or an undated-publication policy review. The email cases also retain any unresolved intake, recipient or material-fact issues; passing cheap checks is not acceptance of their contents.

## Actual worker replay

The frozen observations were replayed through `RecentJobsWorker.run` in a local emulator under **one publisher source, one ingest grant and the normal bounded discovery path**. The source enabled the new shadow registry/original/discovery flags, ten notices and one listing page. Its authority registry was intentionally empty; no real corporate identity was declared qualified. The operator identity and model dependencies were authored emulator fixtures, not live credentials or impersonation.

The worker created one completed discovery job and ten detail exceptions. Reasons were five `NOTICE_PRECISION_UNSUPPORTED`, two `NOTICE_NOT_OPEN` and three `ORIGINAL_NOTICE_UNSUPPORTED`. Private origin diagnostics distinguished the two unsupported email probe targets from the portal's unsupported issuer hint/representation. There were **zero model attempts, calls, budgets, candidates, decisions, drafts or public records**. Twenty-four frozen response replays include repeated robots reads; these are not additional live GETs.

This is an actual worker execution against frozen real observations, not a live deployment or a positive end-to-end qualification. It does not retest acquisition latency during replay, measure AI extraction accuracy or establish that source/authority permission gates are complete.

## Reusable offline assessment

`coverage:recentjobs` and `tools/assess-recentjobs-coverage.mjs` accept a private manifest of saved listing/detail/eligible-portal bodies or retrieval errors. They select by publisher order, preserve missing/failed rows, hash the inputs and save a private report with counts. Duplicate, out-of-cohort and unused portal observations are rejected. Paths, including symlinks, must stay inside the manifest bundle; file and cohort sizes are bounded.

The pure coverage module distinguishes absent/unresolved deadlines, absent routes, elapsed/today source dates, unsupported methods and portal formats. Its microdata diagnostic reports only scope/property markers. It does not widen the live primary adapter or turn diagnostic format support into authority/availability approval. The tool has no network, model, database, source/grant or publication actions. Its console output contains aggregate metrics and a private report path, not source bodies.

Eight authored regression tests cover fixed order/denominators, missing/failed/malformed observations, distinct date/route holds, email versus portal coverage, scope-aware microdata detection, unchanged live rejection, duplicate/input-boundary checks and the CLI's private path/output constraints. All **51 affected coverage/parser/policy/origin tests** pass, together with contract build/typecheck and **five staging guard checks**. The actual frozen worker replay's assertions also pass. An early fixture mismatch (`text` versus the assessment's `html` field) was corrected; the strict input contract was retained. The full catalogue suite is not rerun, and the earlier intermittent suggestion-route failure remains unresolved.

The rebuilt local worker image runs as `node` and passes network-disabled diagnostic checks: microdata is detected while the live adapter still rejects it, and disabled activation remains rejected. No image is deployed. Changed-document local-link and Git whitespace checks pass. The reusable assessment command and all fixtures contain no real source bodies; only the private report and collection retain the real observations.

## Next priorities and operating state

Implement a bounded shared **Microdata JobPosting adapter**, with exact page/scope binding and source-preserved date/reference evidence, before spending model calls on this portal class. Then add supported original-source corroboration for email methods, including the specific intake and exact recipient. Continue to hold ambiguous or mismatched instructions. Indirect method discovery and verified freshness for undated notices require their own measured support; do not invent dates or replace an exact application method with a generic careers homepage.

No provider calls, cloud writes, live source/authority changes, quota resets, grants, applications, publication or deployment occur. The existing live source budgets and provider exhaustion history are untouched. Hosting remains undeployed at the founder's request; the new verification modes remain shadow-only. The prior intermittent suggestion-route failure and the remaining orchestration/production-qualification gaps stay open.
