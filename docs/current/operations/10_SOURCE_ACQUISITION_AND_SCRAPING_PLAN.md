# Source acquisition and scraping plan

Date: 25 September 2026. Decision: scraping remains an intended Skilved capability. Source selection, permission, adapter formats and operating capacity are not yet settled. This plan responds to the founder's request to plan that direction properly while B03 persistence/review engineering continues. It does not authorize outreach, infer source permission or claim a live crawler network.

## What actually exists

26 September founder decision: **RecentJobs first**, then other sources and individual employers such as Transnet. The [RecentJobs brief](13_RECENTJOBS_FIRST_ADAPTER.md) records the cross-employer apprenticeship rationale, initial network-free parser, bounded source observations and remaining integration. The [earlier three-source comparison](11_FIRST_SOURCE_ASSESSMENT_2026-09-26.md) remains deferred reference. The old `sa-search-engine` Python spider informs extraction/regression cases; its defaults are not imported wholesale. Source-specific retrieval/retention/publication conditions and live qualification remain open.

Repository inspection found 39 TypeScript files under `apps/agents/scout/src/sources`: 35 are empty. `BaseCrawler.ts` defines a legacy interface; PuffAndPass, StudentRoom and RecentJobs implementations return hardcoded examples. The legacy extraction taxonomy omits canonical internship/graduate-programme coverage and assumes a trade classification. None of this establishes successful network extraction or accurate current vacancies. Do not activate these examples or reuse their invented notice URLs as fixtures labelled real.

The archived portal specification describes three aggregators, Scrapy spiders, 50-page limits and a four-hour schedule. The referenced `proofile_2.0/scraping-engine/spiders/portals/` is not present among tracked files. Those historical strengths, selectors, volumes and reliability claims need fresh validation. Current authority remains [source operations](09_OPPORTUNITY_OPERATIONS.md) and [source checks](03_SOURCE_CHECKS_AND_COMMUNITY_CONTRIBUTIONS.md), which explicitly retain permitted scraping, direct monitoring and reviewed contributions.

B03's new structured JSON adapter is a controlled pipeline input, not an assumption that South African issuers publish Skilved-shaped JSON. Its use in tests proves the storage/review path. General HTML, PDF, browser-rendered and real provider-specific acquisition remain separate adapters to select and qualify.

## Recommended acquisition mix

Start with a small maintained primary-source portfolio that covers actual user tasks across all six categories. Expand by useful coverage and review burden, not a headline number of crawled domains. Consumer access stays free; source acquisition can still have operating costs and contractual conditions.

| Route | Where it works | Failure modes | Treatment |
|---|---|---|---|
| Documented issuer/ATS feed or API | Stable IDs, explicit fields, change detection, efficient retrieval | Tenant-specific rights, rate caps, HTML embedded in fields, missing deadlines/requirements, a post ID not an intake identity | First technical preference when a useful issuer and allowed reuse are established; read endpoints only |
| Ordinary primary HTML | Employer/programme pages with readable notices and stable links | Layout drift, cookie walls, duplicate navigation, missing years, archived notices, pagination | Source-specific selectors and snapshots; deterministic extraction plus review |
| Primary PDF/circular | Public-sector notices, bursary forms, detailed requirements | Tables/columns split roles, OCR mistakes, multiple deadlines, amendments, embedded links | Separate quarantined PDF parsing with page references and human verification; never infer missing requirements |
| RSS/sitemap | Efficient discovery and changes | Partial text, stale links, lack of eligibility data | Discovery feed; fetch approved canonical notice for facts |
| JavaScript-rendered page | Valuable permitted source with no usable feed/static response | High compute, browser drift, session/cookie dependence, incomplete rendering | Add only after cheaper routes fail and value exceeds maintenance; isolated browser worker, no personal session |
| Aggregator | Finding issuers and intake leads across categories | Rewritten facts, delayed closure, stale copied destinations, content reuse restrictions | Assess individually; preserve discovery provenance, verify against primary source where possible; avoid wholesale article republication |
| Reviewed manual entry or issuer-provided notice | Low volume, small issuers, seasonal launches, sources without stable adapters | Human time, transcription errors, uncertain submitter authority | First-class source workflow with evidence; not a way to bypass reuse/access restrictions |
| Social/community links | Leads from communities and small organisations | Impersonation, edited/deleted posts, platform access constraints, private contact details | Lead queue, attributable review and corroboration; no automatic rejection as fraud or automatic publishing |

Scraping alone does not determine source truth, permission, freshness or applicant eligibility. Models can propose field extraction, category/subtype and faithful explanations, but cannot invent source approval, silently resolve contradictory facts or decide to submit applications. Do not run model calls on each consumer visit.

## Candidate assessment and current evidence

This is a shortlist of research routes, not an approved source register. Reviewed sources below were read on 25 September 2026. No scheduled crawl or bulk extraction was run.

| Candidate | Evidence and likely value | Current disposition / next step |
|---|---|---|
| DPSA public-service circulars | Official circular index and department-specific notices; potential broad jobs and some internships | Assess terms before commercial reuse and deep linking; prototype PDF parsing only with permitted test material; record amendments and department application routes |
| Individual employer/SETA/funder/university pages | Candidate supply for bursaries, learnerships, apprenticeships, internships and graduate programmes | Existing employer/SETA crawler filenames are placeholders. Select actual URLs by community tasks; inspect each method, terms, robots and representative notices before enabling |
| SAPS career pages | Primary career/internship information and issuer warnings about bogus advertisements | Useful candidate for source-chain validation; current openings, reuse and automated collection permission remain unverified |
| Greenhouse job boards for identified relevant employers | Official API documents unauthenticated GET access to published jobs and detail | Technical feasibility established by documentation only. Verify employer board identity, relevance, tenant/reuse terms and notice fields; no blanket redistribution right inferred |
| PuffAndPass / StudentRoom / RecentJobs | Legacy discovery candidates | No working crawler evidence; current structure, feed availability, terms and reuse must be assessed. Do not port the hardcoded samples |

DPSA's [circular index](https://www.dpsa.gov.za/newsroom/psvc/) describes a generally weekly publication outside December and directs vacancy enquiries to the advertising department. Its [terms](https://www.dpsa.gov.za/terms-of-use/) distinguish non-commercial information use from commercial use requiring prior written permission, restrict deep links without prior approval, and address crawlers that slow servers or infringe copyright. Therefore keep DPSA automated reuse/publication disabled pending a recorded basis appropriate to Skilved. A free consumer tier does not resolve the startup's commercial-use question; do not assume the same terms apply to every government domain. This is an implementation constraint from the published terms, not a legal determination about every possible use.

The [Greenhouse Job Board API](https://docs.greenhouse.io/job-board.html) describes public GET endpoints and a separate authenticated application-submission endpoint. That is a reason to assess read integration for relevant tenants, not to enable submission or claim all ATS platforms work alike. [SAPS internships](https://www.saps.gov.za/careers/internships.php) is a primary-source candidate; it is not evidence of a current permitted live intake in Skilved.

## Per-source decision record

Record these before activating any recurring adapter:

1. Owner/issuer, canonical notice and discovery routes, actual category/intake coverage and task relevance.
2. Access method and authentication needs; terms URL/version/date, robots response/date, API/feed documentation and any written permission reference. Keep fetch, retention, excerpt publication, logos and redistribution scopes separate. Unresolved does not mean allowed or permanently impossible.
3. Exact allowed hosts/routes and redirect chain, source application-route relationship and expected MIME/encoding. No substring domain checks or URL guessing for vacancies.
4. Parser version, selectors/field map, stable external ID, source-local date/time handling, uncertainties, fallback and permitted snapshot retention.
5. Per-source frequency, maximum pages/bytes/runtime, concurrency, conditional request support, backoff, pause triggers and review owner.
6. Representative positive/negative cases, material-field accuracy, source change handling, correction response and human minutes.
7. Enable/hold/retire decision, evidence, next review date and operating capacity. A code adapter and a written plan do not satisfy this record.

Robots rules are machine-readable crawling instructions, not a reuse licence or security authorization. Implement the selected policy with a maintained parser, user-agent matching, bounded retrieval and cached revalidation; an unreachable policy endpoint should pause new crawl work pending review. RFC 9309 explicitly distinguishes the [robots protocol](https://datatracker.ietf.org/doc/html/rfc9309) from authorization. This robots policy is planned, not yet implemented by the B03 JSON transport. No broad crawler should be enabled before it exists.

## Collection and review pipeline

Discovery → approved source/method → bounded retrieval → retained permitted snapshot/hash → parser draft → duplicate/intake candidates → operator review → atomic publication → due recheck → correction/withdrawal. Keep discovery, primary notice and application destination as distinct fields. A source may direct users to a different ATS host; validate that relationship instead of requiring same-domain links.

At M0, review every first publication and material change. A changed deadline, requirement, compensation or application route must not update silently. Preserve AND/OR/conditional wording, unknown timezones, date-only deadlines, separate place/residence, multi-component funding and both internship subtypes. A fetch failure must not refresh the last successful timestamp or label the intake closed. A removed listing is a signal for review, not alone proof of closure. Explicit issuer closure can close the record with retained context.

Use immutable snapshot hashes, original external reference and intake identity. Similar titles are duplicate candidates, not merge authority; do not merge distinct recruitment cycles or regional posts. Confirmed aliases need audited reversal and current-state safety. Search/filtering consumes reviewed projections and never invokes a scraper.

## What we should avoid

- Crawling the whole web or all historical source filenames before measuring useful supply.
- Assuming public visibility, robots allowance, an API GET endpoint or an aggregator backlink grants every reuse right.
- Rotating identities, bypassing login/CAPTCHA, or using the founder's signed-in session to overcome access restrictions.
- A universal AI extractor that guesses absent requirements, salary, source legitimacy or application success.
- Treating old examples, source reachability, parser success or large record counts as useful reviewed coverage.
- Putting raw source HTML/scripts into public pages or giving fetched instructions authority over tools.
- Building submission automation as a prerequisite for discovery. M0 hands off to the genuine application route.

## Security and resource design

HTTPS fetches need exact scope, DNS/connection-time public-address checks, safe redirects, TLS hostname verification, time/byte/MIME/decompression limits and no ambient cookies/credentials. PDFs and browser execution need isolated parsing with CPU/memory/process limits. The B03 JSON transport does not yet provide HTML/PDF parsing, robots evaluation, conditional HTTP requests or browser isolation; keep these visibly open.

Proposed pilot limits: one concurrent request per source, at least two seconds between same-source requests, 20 discovery pages per scheduled run, one megabyte per HTML response and five megabytes per PDF, three retries with backoff and pause on repeated access denial or structural drift. These are starting ceilings to validate against actual source terms and resource measurements, not already enforced global crawler settings. A source's stricter limits win. The current JSON transport has its own smaller byte/time limits.

Scheduling should match change patterns: weekly circular index checks around publication, seasonal programme checks near announced intakes, and more frequent known-deadline/destination checks only where justified. The archived universal four-hour interval is not a commitment. ETag/Last-Modified and content hashing reduce traffic and repeat review, but hash equality cannot establish that a source is still authoritative indefinitely.

## Rollout and measurable decisions

1. Source assessment: choose one useful primary route and one fallback per category; separate internship student/WIL and graduate tasks and retain experienced jobs. Write access/reuse and format decisions. Output is a candidate matrix, not national coverage.
2. First adapter: choose the highest-value permitted route with manageable format and stable identity. Prefer an available documented read feed; otherwise one ordinary HTML parser. Add a PDF adapter next if assessed coverage makes it worthwhile. Do not invent a compatible feed to fit existing code.
3. Qualification: test representative source snapshots, layout/date/redirect changes and held-out notices. Freeze the B04 benchmark of at least 60 held-out cases, ten per category, plus adversarial cases; do not claim that sample now exists. Release criteria include zero known critical wrong-destination/material-requirement errors in the accepted sample, explicit unknowns, observed review burden and usable correction controls.
4. Small reviewed pilot: measure discovery-to-primary-source resolution, missing/stale supply, material fact errors, duplicate/intake errors, changed-page alerts, review minutes, fetch/parser cost and oldest backlog. Expand only when coverage improves within maintainable capacity.
5. Sustained operation: monthly source/method review initially, immediate review on changed terms/block/complaint or serious data error, parser-version rollback and source-specific pause. Founder confirms actual operating windows before public promises.

Illustrative workload only: 12 assessed sources × 2 runs/day × 5 pages gives 120 requests/day before detail/recheck traffic. At 100 KB/response that is roughly 12 MB/day; browser/PDF/model costs are additional. Twenty new notices/week at 10 minutes each plus 50 rechecks at 2 minutes each is about five human hours/week, before support and fixes. Measure this on the pilot; don't promise a cloud amount or staffing capacity from request count alone.

## Current open decisions and engineering continuation

The founder has confirmed the intent to scrape, not a particular first source, permission record, parser or funded cadence. Engineering can finish guarded persistence/review/public APIs and controlled integration tests now. Real automated source collection, public content reuse and G1's real-notice demonstration remain open until the source assessment is complete. No outreach has been sent. The next source-specific work should produce a concrete method/rights/fixture/maintenance assessment for review, then implement that adapter; it should not ask for a vague blanket approval to scrape everything.

This does not shrink the ambition. A reliable, correctable and maintainable source network is how Skilved earns the right to expand discovery and later assistance.
