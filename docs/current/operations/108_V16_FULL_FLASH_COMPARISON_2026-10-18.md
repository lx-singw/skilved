# V16 full Flash comparison and structured location omission

Date: 18 October 2026. Status: a bounded Gemini 3.8 Flash comparison completes Transnet's private workflow but ALPLA still fails the frozen private checklist. The trial exposes a location-completeness gap in the production decoder/mapper. No product code, prompt, contract or publication setting changes in this sprint.

## Controlled comparison

The [3.1 Flash-Lite repeat](107_V16_REPEATABILITY_HOLDS_2026-10-18.md) failed both familiar notices after their [earlier private completions](106_V16_PRIVATE_DRAFT_COMPLETION_2026-10-18.md). This sprint changes only the model endpoint for extraction to configured Gemini 3.8 Flash. Each extraction body is byte-identical to the earlier 3.1 request; the model-bound receipt hash changes as expected. The reported model version is `gemini-3.8-flash`.

V16/compact V7 extraction, V13 validation, semantic checklists, 3,072/6,144-token limits and low/medium thinking remain frozen before calls. Validation retains the same contract and source-policy context; its extracted facts naturally differ with the new extraction. There are at most four actual generation calls, two per notice, with fallback and retries disabled. A semantic failure holds that case; its unused validation allowance is not reused.

The saved shared quota state has no active daily hold for this model: the historical operator hold expired on 5 October. The worker still checks shared daily/minute observations and source spending before every call. Three guarded, paced requests refresh robots.txt and both RecentJobs notices. All return HTTP 200 with expected MIME types and no content encoding. Robots permits retrieval; source content, original routes and notice-stated future deadlines are unchanged. No employer page is requested. These are familiar discovery notices, not independently verified employer openings.

## ALPLA: private checklist catches a missing structured city

ALPLA extraction returns HTTP 200 and reports 5,435 total tokens. It retains maximum four-year duration, Market Related salary, the four cumulative requirements and unstated experience/residence. The summary retains the original sentence naming ALPLA Lanseria, but structured location contains Gauteng with a null city, citing only the Location/Gauteng table.

The frozen private checklist rejects `LOCATION`, producing `PRIVATE_SOURCE_CHECKLIST_FAILED`. The answer is unchanged, with no retry, validation, model cache entry, candidate or draft update. ALPLA's earlier private draft remains at revision 1.

Crucially, read-only replay confirms that the current production decoder, location evidence check and canonical mapper accept this answer. They establish support for the claimed province without requiring every stated source location in the structured field. The case-specific private checklist is not a reusable production control. The production model validator was not called for this case, so its verdict is unknown; this trial does not demonstrate publication of an incomplete record.

## Transnet: one private completion

Transnet extraction and validation return HTTP 200 and report 5,858 and 4,882 total tokens respectively. The frozen checklist and local checks pass. The answer retains all four locations, intake, deadline, three complete qualification alternatives and shared conditions. The required attachment instruction appears verbatim in practical conditions, which the frozen checklist permits; recognised publisher preparation advice is excluded.

Qualification and non-document requirement logic match the earlier successful answer after resolving local IDs and order. The full requirement-tree difference is the attachment's permitted move out of the document item into practical conditions, not a change from OR to AND. The separate-instruction concatenation seen in the Flash-Lite repeat does not recur in this answer.

Validation returns supported with no issues and valid source quotes. The private draft advances from revision 2 to 3, retaining the parsed original employer application route. Its facts remain pending review, citations remain unapproved and publication disposition remains review required. Employer reachability, authenticity and independent verification are not established. Historical draft revisions and their assessments remain in retained reports.

## Verification, accounting and next work

Contracts build and all 53 focused provider, fallback, quota, evidence, completeness and validation tests pass. Private audits reparse the fresh snapshots, verify frozen contracts/checklists and identical extraction bodies, match request hashes and raw responses to receipts, replay decoding/mapping and individual checks, compare requirement logic, validate stored draft fields, and reconcile historical records, source budgets and shared quota. Product code still matches the earlier passing 636-test serial suite; the full suite is not rerun for this private-evaluation/documentation sprint.

Three of four permitted calls spend 16,175 known total tokens, with no new unknown-usage calls. There are two extraction calls and one validation call, one new candidate/decision, two new positive cache entries, one private draft update and no public records. The unused ALPLA validation allowance remains unused. Source grants advance ALPLA from revision 7/cap 8 with seven calls spent to revision 8/cap 9, and Transnet from revision 5/cap 7 with six spent to revision 6/cap 8. Earlier spending is retained.

Shared observations now retain 54 generation requests, 164,726 known total tokens and 24 unknown-usage calls. All earlier usage rows remain unchanged; the new Pacific-day 18 October full Flash bucket records three requests. Availability and daily-exhaustion records are unchanged. These are worker observations, not provider dashboard totals; missing usage is not zero consumption. All historical outputs, failures, positive/negative caches, snapshots, receipts, decisions and budgets remain retained.

This small comparison has mixed outcomes and does not establish comparative model superiority, repeatability or independent fidelity. A model change alone has not resolved completeness. Next scope a reusable source-backed location-completeness guard and regress the unmodified held answer before widening coverage. Avoid employer-specific city filling and response repair; then repeat the frozen workflow. Unseen notices and source reuse qualification remain open.

Credentials, local environment files, source snapshots, provider outputs, private records, checklists, quota state, audits and preview remain private and ignored. Employer crawling stays optional/off; production scheduling/publication remains disabled.
