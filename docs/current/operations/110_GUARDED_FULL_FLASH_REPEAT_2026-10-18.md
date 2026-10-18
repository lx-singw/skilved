# Guarded full Flash repeat: Transnet completes, ALPLA cites incomplete evidence

Date: 18 October 2026. Status: Transnet completes its private workflow again and advances to draft revision 4. ALPLA now retains city and province but selects a span supporting only the city, so the existing location-evidence guard holds it before validation. The new completeness check independently passes this fresh answer and is not credited for its rejection. No product code or provider contract changes occur in this sprint.

## Frozen repeat and source refresh

This follows the [full Flash comparison](108_V16_FULL_FLASH_COMPARISON_2026-10-18.md) and [source-location completeness guard](109_SOURCE_LOCATION_COMPLETENESS_2026-10-18.md). The model remains Gemini 3.8 Flash, with byte-identical extraction requests and matching model-bound receipt hashes. The reported model version is unchanged. V16/compact V7 extraction, V13 validation, semantic checklists, 3,072/6,144-token caps and low/medium thinking remain frozen. Validation retains the same contract and source-policy context while using fresh extracted facts.

The trial permits at most four actual generation calls, two per notice, with fallback and semantic retries disabled. Each failing case holds unchanged; its reserved validation allowance is not reused. The worker retains shared quota/availability observations and checks them before calls rather than disregarding daily exhaustion.

Three guarded, paced requests refresh robots.txt and both familiar RecentJobs pages. All return HTTP 200 with expected MIME types and no content encoding. Robots permits retrieval. Content, original application routes and notice-stated future deadlines are unchanged: ALPLA 31 October and Transnet 20 October. These are publisher-stated dates, not independently verified employer openings. Employer pages are not requested.

## ALPLA: values retained, province not supported by selected passage

ALPLA extraction returns HTTP 200 and reports 5,435 total tokens. Its structured location now contains Lanseria and Gauteng, with country null and no invented coverage, attendance or relocation. Its selected location span is line 7 alone: the work-base/duration sentence naming ALPLA Lanseria. Gauteng occurs elsewhere in the notice, outside this passage.

The existing location-value evidence check rejects `AI_LOCATION_EVIDENCE_UNRESOLVED` before caching, candidate storage or validation. Read-only reconstruction and canonical replay independently confirm the same rejection. The four cumulative requirements, maximum duration and qualitative pay remain supported. The frozen private checklist would pass the retained field values, but the worker never reaches that checklist because evidence binding fails first.

The new completeness check independently passes: the recognised work base is now retained in structured location and its complete passage is cited. It is not the first live hold. The earlier unchanged province-only answer remains covered by the preceding sprint's offline completeness regression; this fresh result does not establish a live rejection by that new check.

The response remains unchanged, with no repair, quote widening, retry or validation call. ALPLA's earlier private draft stays at revision 1. The reserved validation allowance remains unused.

## Transnet: required attachment moves to a permitted document item

Transnet extraction and validation return HTTP 200 and report 5,843 and 4,766 total tokens respectively. The frozen checklist, local checks and model validation pass. All four locations, recruitment reference, deadline, three complete qualification alternatives and shared conditions remain retained, with no invented pay or experience.

The required attachment instruction moves from practical conditions to an exact required document item; practical conditions becomes unstated. The frozen rubric permits both placements. Qualification/non-document logic is equivalent after resolving local IDs and order. The full requirement tree changes because it now has eight items instead of seven, not because OR became AND. Recognised publisher preparation advice remains excluded.

Validation returns supported with no issues and valid source quotes. The private draft advances from revision 3 to 4 and retains the parsed original employer application route. Facts remain pending review, citations remain unapproved and publication disposition remains review required. Employer reachability, authenticity and independent verification are not established. Earlier draft revisions and their assessments remain in historical reports.

## Verification and retained accounting

Contracts build and all 62 focused provider, quota, evidence, completeness and validation tests pass. Private audits reparse the fresh snapshots, verify frozen contracts/checklists and byte-identical requests, match receipt hashes, reconstruct answers read-only, replay individual guards and canonical mapping, compare requirement logic and stored draft fields, and reconcile historical records, budgets and quota state. Product code matches the preceding passing 645-test serial suite; the full suite is not rerun for this private-evaluation/documentation sprint.

Three of four permitted calls spend 16,044 known total tokens, with no new unknown usage. There are two extraction calls, one validation call, one new candidate/decision, two new positive cache entries, one private draft update and no public records. Source grants advance ALPLA from revision 8/cap 9 with eight calls spent to revision 9/cap 10, and Transnet from revision 6/cap 8 with eight spent to revision 7/cap 10. Actual spending then reaches nine and ten respectively; no earlier spending is refunded or reset.

Shared observations now retain 57 generation requests, 180,770 known total tokens and 24 unknown-usage calls. The 18 October Pacific full-Flash bucket records six requests and 32,219 known tokens. Other usage rows and availability/daily-exhaustion records are unchanged. These are worker observations rather than provider dashboard totals; historical missing usage is not zero consumption. All historical outputs, failures, positive/negative caches, snapshots, receipts, decisions and spending remain retained.

This repeat shows another familiar Transnet completion and a different ALPLA evidence failure under identical extraction requests. It does not qualify overall extraction repeatability, unseen-source coverage, independent fidelity or source reuse. Next add source-bound guidance for selecting a complete location evidence span, with authored offline regressions before another provider trial. Preserve both guards and failed responses; do not infer geography or repair evidence. Employer crawling stays optional/off; production scheduling/publication remains disabled. Credentials, source snapshots, provider responses and private evaluation artifacts remain ignored and uncommitted.
