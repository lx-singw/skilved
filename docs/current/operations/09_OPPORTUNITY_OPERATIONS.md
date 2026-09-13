# Opportunity supply, provenance and maintenance

13 September accepted M0 operations: [source checks and contribution handling](03_SOURCE_CHECKS_AND_COMMUNITY_CONTRIBUTIONS.md) specify publication review, precise check records, social-link investigation, source changes and severity-based report triage. Permitted scraping and posting remain central. M0 uses reviewed publication; later automated normalization/publishing remains separately gated.

Status: proposed operating specification, 11 September 2026. No source permission, working crawler, partner feed or catalogue coverage is certified here.
Owner: founder/source operations. Interfaces: [data contracts](../engineering/07_DATA_AND_API_CONTRACTS.md), [worker execution](../engineering/08_AGENT_EXECUTION.md), [release quality](../quality/11_VALIDATION_AND_RELEASE.md).

## 1. Supply strategy

Seed the catalogue through a hybrid of permitted official-source collection, available feeds/APIs, reviewed submissions and carefully assessed discovery sources.
Prioritise the original issuing organisation for requirements, intake, deadline and application destination.
Aggregators can reveal opportunities, but copying their articles is not assumed to be permitted or sufficient verification.
Let users bring a link into a private preparation workflow. That link remains a lead until reviewed; it does not automatically become a public listing.
Support all six categories at public MVP. Scale the number of maintained sources to relevance, review capacity and measured cost.
The business advantage should be preparation/help/progress, with source quality making that experience trustworthy.

Clarification, 12 September 2026: aggregator scraping is used to discover leads and trace their original issuer/source. Preserve the discovery reference, primary notice and actual application destination separately. Where permitted, onboard the resolved issuer as a maintained source for future direct discovery. An official notice may itself live on a recruitment platform; do not require the issuer and application host to share a domain. Unresolved source relationships remain labelled uncertain. The [ATS strategy](../engineering/03_ATS_ADAPTER_STRATEGY.md) specifies this chain and what happens after source resolution.

## 2. Historical source-plan disposition

PuffAndPass, RecentJobs and StudentRoom remain candidates to assess, not an approved three-source production contract.
The archived specification points to Scrapy code in another path; the current Scout implementation inspected is TypeScript with hardcoded fixtures.
Do not describe either as an operational live ingestion system without a reproducible source-to-record run.
Retire `ROBOTSTXT_OBEY: False`. Use an identifiable crawler and applicable crawl rules, permitted access methods and source-specific rate limits.
Robots rules express crawler instructions; they do not establish authorization or content-reuse rights. Assess those separately. [Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309.html)
Do not bypass login controls, CAPTCHA, paywalls or explicit collection restrictions to fill the catalogue.
No contact with publishers or access purchase is implied by this document; record permission evidence when actually obtained.

## 3. Source registry contract

Each source has a maintained registry entry before automated collection:

| Field | Required meaning |
|---|---|
| `sourceId`, `name`, `domain`, `issuerId` | Stable identity and relationship to original issuer |
| `sourceRole` | Official issuer, institution, aggregator, partner or user-submitted lead |
| `categories`, `geography`, `intakePatterns` | Intended coverage; do not infer universal coverage |
| `method` | Manual, feed/API, ordinary HTTP or approved browser extraction |
| `accessStatus` | Pending assessment, permitted, restricted, permission required or paused |
| `policyEvidence` | Terms/license/permission/crawl-rule references, dates and reviewer |
| `reuseScope` | Fields/excerpts/files allowed to retain and publish, attribution requirements |
| `ratePolicy` | Request delay, page limit, parallelism, retry and forbidden paths |
| `refreshPolicy` | Schedule, deadline priority, last successful check, next check |
| `parserVersion`, `fixtureRefs` | Maintained extraction contract and regression examples |
| `health` | Healthy, changed layout, unavailable, access denied or review backlog |
| `owner`, `reviewDueAt` | Responsible person and next policy/quality review |

If permission/access status is unresolved, use manual discovery only within applicable terms and keep automated publishing disabled.
Permission to fetch does not necessarily include permission to retain full articles, PDFs, logos or personal contact details.
Reassess when a source changes terms, blocks access, changes ownership or supplies a complaint.

## 4. Six-category coverage plan

| Category | Candidate official supply | Category-specific facts to preserve |
|---|---|---|
| Bursaries | Funders, universities, company bursary pages | Study field/year, marks, financial criteria, covered costs, conditions and intake |
| Learnerships | Employers, authorised programme providers, public programme announcements | Qualification/programme identity, eligibility, duration, location, stipend if stated |
| Apprenticeships | Employers and recognised training programme announcements | Trade, required subjects/qualification, intake, work/training site and application route |
| Internships | Employer and public-sector career pages | Student/graduate status, field, experience restrictions, duration and location |
| Graduate programmes | Employer graduate recruitment pages | Graduation window, qualification/field, programme intake and selection requirements |
| Jobs | Employer careers pages and official vacancy circulars | Role/reference, employment type, requirements, location and deadline if provided |

These are candidate source classes, not claims of signed relationships or access to institutional systems.
For each category, maintain at least one assessed primary-source route and a fallback discovery/submission method before calling it supported.
Demonstrate current genuine records where available. If no appropriate live intake exists, show an honest empty state and useful private-link workflow.
Never fill a seasonal gap with expired fixtures or broaden “internship” into any job merely to satisfy a dashboard count.
Track category freshness, relevant active supply and review backlog separately; aggregate totals can hide a neglected category.

## 5. Discovery and safe fetching

1. Read approved feed/structured data if available; otherwise fetch ordinary public HTML using the registered method.
2. Apply conditional requests/content hashes where supported to avoid reprocessing unchanged pages.
3. Bound response size, redirects, request duration, page depth and per-domain concurrency.
4. Validate URL scheme, host and resolved destination; block localhost, internal/private addresses, cloud metadata endpoints and credential-bearing URLs.
5. Revalidate every redirect and DNS resolution in the actual network path; do not trust the submitted URL string alone.
6. Quarantine downloads and parse them in a restricted environment. Do not execute source content or instructions.
7. Follow original-issuer references where permitted; preserve both discovery and official evidence references.

User-submitted links create SSRF exposure; URL validation and network egress controls are part of the feature, not a later enhancement. [OWASP SSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
If extraction needs authenticated browser access or a difficult platform-specific adapter, assess its recurring maintenance cost before choosing it.
Source-specific blocking is a signal to pause/review, not to evade access restrictions with rotating identities.

## 6. Extraction, evidence and review

Extract title, issuer, category, reference, intake, location, deadline, requirements and application route with field-level evidence.
Retain raw date wording alongside normalized values; do not invent a midnight deadline when only a date is stated.
Normalize locale/format only when justified; conflicting date formats enter review.
Do not invent qualification defaults, email addresses, stipend values, locations or certificate equivalences.
Required versus preferred criteria stay distinct. Alternative qualifications and “and/or” requirements need explicit logic.
Model extraction produces a draft; validation checks structure and consistency, then a reviewer resolves material ambiguity.
An official-looking domain or familiar company name does not alone establish that a specific announcement is authentic.
Check destination consistency and issuer identity signals without claiming fraud detection is perfect.
In R1, a human reviews every new public record and every material change. R2 may automate clearly established low-risk normalization while preserving review of high-impact facts.
Automated publishing requires parser-specific evidence and sampled monitoring; it is a separate switch, not the consequence of adding a crawler.

## 7. Deduplication and publication

Match candidate identities using official reference, issuer, intake and application destination, with date/location/category as corroboration.
Similarity scores propose matches; they do not establish identity for separate locations or annual intakes.
Keep source snapshots and merge decisions so a reviewer can undo incorrect merges and notify affected users if needed.
Publish a concise record within permitted reuse scope, with original source, application destination, last checked time and uncertainty labels.
Retain source corrections and the version on which existing preparation plans were based.
Do not conflate factual completeness, source credibility, freshness and eligibility into one unexplained “verified” score.
Google JobPosting markup applies only where its content rules and fields are met. Do not label bursaries as jobs to gain search exposure. [Google JobPosting guidance](https://developers.google.com/search/docs/appearance/structured-data/job-posting)

## 8. Refresh and expiry state machine

Freshness and lifecycle are separate fields. Source fetch failure marks a check failure without asserting an opportunity closed.
Close an opportunity when a reliably established deadline has passed or an authoritative source states closure/withdrawal.
For a date-only deadline, show the stated date and avoid promising a precise final submission time; use a documented conservative reminder policy.
Listings with no deadline require periodic revalidation and an uncertainty label; they do not stay confirmed open forever.
On 404/removal, attempt a bounded issuer/reference check; distinguish withdrawn announcement from temporary source failure.
Track conflicting deadlines as `conflicting`; pause definitive countdowns and ask for review of the original issuer's current statement.
When an intake changes materially, create a new version or opportunity identity as appropriate rather than silently overwriting users' commitments.
Expire search markup/public availability consistently with lifecycle changes; expired job handling is part of Google's job-posting policy. [Google expiry guidance](https://developers.google.com/search/docs/appearance/structured-data/job-posting#remove-expired-jobs)

## 9. Proposed scheduling policy

Schedules are operational defaults to measure, not verified source requirements or universal promises.

| Source/change class | Starting behaviour | Adjustment signal |
|---|---|---|
| Weekly official circular | Check around publication cadence plus bounded recovery | Actual publication timing and failure rate |
| Frequently updated issuer/partner feed | Daily change check within permitted rate | New relevant opportunities missed between checks |
| Saved near-deadline opportunity | Prioritised recheck before reminders where permitted | Source limits and actual change frequency |
| Stable documentation/eligibility page | Less frequent check; recheck for material user action | Changed requirements or complaint |
| Unhealthy/restricted source | Pause normal extraction and review | Permission/layout/availability resolved |

Do not promise real-time completeness. Show when a source was checked and what remains uncertain.
Deadline reminders are useful assistance, not a guarantee the source or user will remain reachable.
Budget and review capacity may delay new publication; current participants' safety/closure corrections take priority over catalogue size.

## 10. Quality benchmark and acceptance data

Create labelled examples from permitted source material, with source/date and independent human expected values.
Use distinct development and held-out sets. Freeze a held-out initial benchmark of at least 60 cases, ten per category, and expand as new failure modes appear.
Include current/closed intake, missing deadline, conflicting dates, alternative requirements, duplicate/repeated annual title, PDF, broken link and suspicious redirect cases.
Keep synthetic adversarial cases separately labelled; they test robustness but do not substitute for real-source extraction accuracy.
Report category-level denominators, critical-field errors, correct abstentions, false eligibility conclusions and merge/split errors.
Critical fields are issuer, application destination, deadline and mandatory eligibility. Any unresolved critical error in a release case blocks that parser's automatic publication.
A clean 60-case evaluation is limited evidence, not a guarantee of zero errors on the web or national coverage.
Use provisional target ≥95% correct non-critical field decisions on the held-out set, including appropriately unknown fields; explain the denominator and exclusions.
Missing values hidden by dropping difficult records are failures of the evaluation design. Report rejected/reviewed records as well as published ones.
Measure cost and review minutes per correct, relevant, maintained opportunity—not merely pages scraped.

## 11. Daily/weekly operating loop

On operating days, review: suspicious destinations, near-deadline conflicts, user reports, source failures and pending material-change notifications.
Review new records to the capacity agreed in [operations](12_COST_CAPACITY_AND_OPERATIONS.md); a backlog must be visible rather than silently auto-approved.
Weekly, review category coverage, stale counts, duplicate errors, minutes spent, source terms changes and cost per useful record.
Create a source incident with affected record IDs, scope, mitigation, owner and next check when a parser/layout changes.
Suspend only affected ingestion/publishing where possible; keep already-reviewed source-linked records visibly dated.
If wrong information reached users, correct the record, mark the changed field and notify affected savers according to their preferences and the seriousness of the error.
Treat takedown/correction requests as trackable cases with evidence and response, not informal deletions without a record.
Do not contact employers, applicants or publishers automatically without the applicable communication permission and approved purpose.

## 12. Partner supply path

Offer a minimal submission template containing issuer identity, reference, categories, intake, requirements, deadline, destination and reuse permission.
Confirm who is authorised to submit for the organisation before granting publication capability.
Partner submissions still undergo schema, destination, versioning and expiry checks; trusted relationships do not bypass data quality.
Return a preview and correction route. Later provide CSV/API ingestion only when a real partner can maintain it.
Record refresh responsibility and escalation contact in the agreement: a feed without closure updates is incomplete supply.
Skilved can send better-prepared applicants to original application systems without claiming affiliation or a signed partnership.

## 13. Acceptance IDs

- **SRC-01:** every automated source has reviewed method, reuse scope, crawl/rate policy, owner and pause switch.
- **SRC-02:** original-source provenance and last checked time are visible; unknowns remain unknown.
- **SRC-03:** all six category journeys have source-route coverage, fixtures and honest seasonal empty states.
- **SRC-04:** deduplication preserves distinct intakes and can undo a mistaken merge without losing learner work.
- **SRC-05:** deadline conflict, source outage, closure and material-change notifications pass scenario tests.
- **SRC-06:** held-out benchmark reports all categories and review/rejection cases; unresolved critical errors block automatic publication.
- **SRC-07:** link intake rejects internal/unsafe destinations and redirect/DNS bypass attempts.
- **SRC-08:** parser outage, complaint and takedown procedures have named ownership and a tested pause/correction path.
- **SRC-09:** recorded source volume/cost/review effort supports the planned refresh cadence within available funding.
- **SRC-10:** no fixture is presented as live; no private submitted URL is made public without review and authority.

## 14. Phasing and unresolved evidence

R0 establishes taxonomy, registry, fixtures and safety boundaries. R1 proves manual/source-linked preparation with supervised records.
R2 automates maintained sources sufficiently to operate all six categories. R3 adds direct partner workflows and feedback on record quality.
R4/R5 add scale/country-specific sources only with ownership, operational capacity and evidence of demand.
Actual permission status for the legacy three aggregators, source integration success, nationwide completeness and live inventory remain unverified.
Update this document from measured runs and partner evidence; never replace an unavailable source with invented content to meet a deadline.
