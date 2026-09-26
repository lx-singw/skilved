# RecentJobs first: apprenticeship discovery and extraction

Date: 26 September 2026. **Founder decision: start with RecentJobs, then expand to other sources and individual employers such as Transnet.** Its cross-employer apprenticeship coverage fits the first audience better than beginning with a single company. This supersedes the earlier [Transnet-first recommendation](11_FIRST_SOURCE_ASSESSMENT_2026-09-26.md).

The apprenticeship category is the first acquisition slice, not a restriction of Skilved's six-category product. Primary employer/ATS links are reviewed for attribution and application handoff within this workflow. Building a separate adapter for each employer is not a prerequisite for RecentJobs development.

## Observed source behaviour

Bounded ordinary HTTPS reads on 26 September returned the [apprenticeship category](https://recentjobs.co.za/category/apprenticeships/) and two detail pages. The category uses WordPress article cards and pagination. The new parser found ten cards and a page-two link; this is not ten verified/open opportunities or complete catalogue coverage. Category membership alone does not establish an apprenticeship.

- The [Feltex article](https://recentjobs.co.za/2026/09/23/feltex-connacher-electrical-apprentice/) contains qualification alternatives, a stated deadline and an application candidate on `feltex.erecruit.co`.
- The [Hytec article](https://recentjobs.co.za/2026/09/22/hytec-sa-apprentice-fitter-kempton-park/) states a deadline before the assessment date and links to `boschrexrothafrica.erecruit.co`. Recent publication does not establish current availability.
- Menus include old article links. Widgets include comments, advertisements and sharing links. Extraction must scope article cards and content rather than ingest the whole page.

Employer destinations were identified, not independently authenticated or fetched in this task. The [robots file](https://recentjobs.co.za/robots.txt) excludes administration and bot-check paths and declares a sitemap. The [privacy policy](https://recentjobs.co.za/privacy-policy/) concerns visitor data and does not establish a content-reuse grant. Automated collection, retained evidence and public reuse still need a source-specific recorded basis; absence of a grant is not treated as a blanket prohibition. No outreach was sent.

## Implemented parser

The network-free [adapter module](../../../packages/catalogue/src/adapters/recentjobs.mjs) exports:

- `parseRecentJobsList({html, url})`: source/category validation, scoped article discovery, URL deduplication and next-category-page extraction. Missing, empty or unexpected layouts fail explicitly for review.
- `parseRecentJobsDetail({html, url, observedOn?})`: title, original publication metadata, inert article text, explicit deadline candidates and labelled application candidates. It preserves the RecentJobs source URL separately from application destinations, with a stable source ID and content hash.

Outputs are **unreviewed extraction candidates**, not canonical opportunity records or stored/public drafts. Qualifications remain in source text with list boundaries; this slice does not claim complete structured eligibility, automatic issuer/location/pay extraction or direct persistence. Missing/conflicting dates and multiple application routes are surfaced. An explicit observation date flags a past source deadline without inventing issuer closure or end-of-day timing.

HTML is parsed with pinned `parse5` 8.0.0. The module makes no network requests, executes no scripts and loads no embedded resources. It excludes scripts/styles, forms, sidebars, comment widgets and recognised sharing blocks. Instructions in article prose remain untrusted text. Link labels and syntax produce pending application candidates, not authentication of an employer or permission to fetch an arbitrary URL. Production DNS/redirect checks remain required at the fetch boundary.

The [tests](../../../packages/catalogue/tests/recentjobs.test.mjs) use authored fictional notices and example destinations. Run `pnpm --filter @skilved/catalogue test:adapters`. The existing catalogue test glob also includes these cases.

## Reuse from the first project

The old `sa-search-engine/scraping-engine/spiders/portals/recentjobs_spider.py` and tests informed list/detail separation and regression cases. Avoid these legacy behaviours:

- Numeric closing-date months can fall back to January; the new parser validates numeric months and actual calendar dates.
- An arbitrary date or URL date must not become the closing date.
- Do not overwrite the discovery URL with the application URL, guess an issuer by stripping the title or default missing geography to South Africa.
- Do not select the first external link, merge opportunities by title alone, flatten qualification alternatives or reuse the old queue's retry behaviour.

## Next integration work

1. Expand qualification across independent layouts, multi-trade notices, amended dates, missing links, email/in-person routes and category ambiguity. Keep one notice's multiple trades together unless source references establish distinct intakes.
2. Map candidates into canonical private drafts with retained permitted evidence. Preserve AND/OR/conditional requirements or mark the relationship unknown; distinguish aggregator claims from issuer corroboration. Source article, primary notice and application route stay separately attributable.
3. Extend the JSON-only transport and source schema explicitly for HTML and discovery jobs. Retain exact URL/DNS/TLS/redirect/size guards, leases and source pause; add robots evaluation and pacing. Validate discovered URLs against a constrained source policy before queueing. Never automatically follow arbitrary application destinations.
4. Exercise review/publication in the emulator: private draft, explicit review, no duplicates on repeats, restricted old actions on material changes, failed-fetch recovery and durable withdrawal.
5. Qualify a permitted pilot. Proposed initial ceiling: one category page plus ten detail pages/run, one concurrent request, at least two seconds between requests and one run/day, subject to stricter source conditions and actual capacity. Measure accuracy, stale supply and human review time before expanding RecentJobs categories, other sources and individual employers.

The parser is not wired into `store.mjs`, the operator command or public APIs. No scheduled crawler or publication was enabled. The [acquisition plan](10_SOURCE_ACQUISITION_AND_SCRAPING_PLAN.md) and [publication runtime](../engineering/15_SOURCE_PUBLICATION_RUNTIME.md) govern the remaining work. This sample does not replace the six-category held-out benchmark or close G1.

## Evidence and validation

Ordinary unauthenticated probes used `SkilvedSourceAssessment/0.1`, identity encoding, time/size limits and sequential pacing. The web reader returned an access error on the category while direct reads returned 200; no browser impersonation, proxy, credentials or bot-check interaction was used. This does not guarantee future access. Bodies were inspected in memory, not committed as fixtures; hashes identify observed bytes but cannot reconstruct them.

| Page | HTTP / bytes | Observed SHA-256 |
|---|---|---|
| Robots | 200 / 161 | `be7624852644cbc4ec532845cfe38596ec92cad4b77488f4ebcda64e3938da32` |
| Apprenticeship category | 200 / 69,401 | `0e8d81d42a970981b9352ea209eb971b68178f655582f3134bafe90f1f9abd50` |
| Feltex detail | 200 / 78,607 | `f2cd9bd52f0d0fa4443ce4fe10eaf57e2deb8c08e38f902e2bb4d777dc826227` |
| Hytec detail | 200 / 81,131 | `52806df9f971fb764c366dfdf79005fdded8c4bfd4e9d0be1e1e312d7bff5720` |

The actual parser was exercised in memory on the category and both details. Results: ten unique article URLs plus page-two navigation; Feltex date-only deadline and employer-host application candidate; Hytec date-only deadline, employer-host application candidate and `source_deadline_before_observation`. No second category page or employer destination was fetched by this check. All detail outputs retained pending review and unverified availability.

Final local checks: `pnpm --filter @skilved/catalogue exec node --test tests/recentjobs.test.mjs tests/fetch.test.mjs` passed all 15 tests (11 adapter cases and four existing transport cases). A scoped document check passed seven documents and 145 local link targets; WSL `git diff --check` passed. The full emulator suite and web build were not rerun for this isolated parser addition. No production deployment or real-source end-to-end qualification is implied.
