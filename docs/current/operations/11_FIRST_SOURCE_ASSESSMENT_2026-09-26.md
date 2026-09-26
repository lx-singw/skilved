# First source assessment and adapter selection

Date: 26 September 2026. Scope: three-source assessment and first-adapter selection following the review of the founder's `sa-search-engine` project. This is an engineering decision and implementation brief. No adapter, source permission, scheduled collection, public listing or G1 acceptance is delivered by this document.

## Superseded first-source recommendation

Founder correction, 26 September: **RecentJobs is first**, because its cross-employer apprenticeship coverage fits the initial audience. Follow the [RecentJobs implementation brief](13_RECENTJOBS_FIRST_ADAPTER.md). The recommendation and technical brief below are retained as deferred reference, not current work order.

Select **Transnet Talent Portal requisition-detail HTML with embedded JobPosting JSON-LD** for the first offline adapter implementation. It combines a directly attributable issuer route, an observed learnership relevant to the first community, a requisition ID and structured data available without browser execution. Begin with explicitly reviewed notice URLs; automatic discovery of every vacancy is a separate, unproven capability.

Capitec is the static-HTML fallback and a useful closure-test reference. StudentRoom remains a discovery candidate and a source of legacy parser ideas. All three are **not activated**: the assessment did not establish a sufficient source-specific basis for scheduled collection, snapshot retention and public reuse. Technical selection does not supply that basis.

This narrows the next engineering task without changing Skilved's six-category scope. One Transnet learnership is neither national coverage nor evidence of current inventory in every category.

## Assessment method and limits

Read official issuer pages, linked recruitment pages, representative notices, available policy material and three robots files. Used the web reader and bounded ordinary HTTPS GETs with `SkilvedSourceAssessment/0.1`, no credentials, cookies, browser impersonation or script execution. Direct probes requested identity encoding, capped response reads at 1 MB and used a 15-second socket timeout. Those probes are assessment utilities, not the production safe-fetch implementation; they do not qualify deployed egress controls.

Only short findings and transport metadata are retained in [the evidence record](../quality/evidence/m0/2026-09-26-source-assessment/README.md). Full third-party notices, logos and personal contact details were not added to the repository. Web-reader results can be cached: a changed result or search/detail disagreement is evidence to recheck, not proof of an issuer defect.

## Three-source comparison

| Candidate | Observed value and format | Access/reuse evidence | Decision |
|---|---|---|---|
| Transnet Talent Portal | Official careers page links to the `transnettalentportal.csod.com` tenant. A learnership detail has embedded JobPosting data despite an empty readable page. Detail parsing looks feasible without a browser; complete discovery remains unproven. | Tenant robots returned 200 with a 10-second crawl delay. Recruitment reuse/retention terms were not established. Corporate HR privacy text describes applicant processing, not a collection licence. | **First development adapter:** one reviewed detail URL to private draft. Live collection/publication remains disabled. |
| Capitec careers | Official careers page links to readable search/detail HTML. Observed jobs plus filled graduate/internship pages. Suitable for static selectors and explicit-closure tests; early-career marketing is not proof of an open intake. | Robots excludes application/account/service routes. Main-site terms restrict commercial copying and linking; their scope explicitly names main-site hosts, so careers-host applicability needs clarification rather than assumption. | **Fallback:** reassess tenant terms and use if it becomes a better permitted route. |
| StudentRoom | Readable category/list/detail pages and an application link to the same Transnet tenant. Strong discovery breadth and relevant old Python spider/test structure. Article facts still need primary-source corroboration. | Robots permits ordinary article paths but the site reserves rights. No applicable automated reuse grant was found in this bounded review. | **Discovery candidate:** no wholesale article import or automatic publication. |

Evidence: [Transnet careers](https://www.transnet.net/Careers), [Transnet notice](https://transnettalentportal.csod.com/ux/ats/careersite/1/home/requisition/5963?c=transnettalentportal), [Capitec careers](https://www.capitecbank.co.za/about-us/careers/), [Capitec search](https://careers.capitecbank.co.za/search/), [Capitec terms](https://www.capitecbank.co.za/terms-of-use/), [StudentRoom discovery article](https://www.studentroom.co.za/transnet-trainee-controller-learnerships-2026-apply-with-grade-12-or-n3/).

### What changed the selection

Capitec initially looked simplest because its listings were readable directly. Inspecting Transnet's actual HTML revealed one embedded JobPosting object, including a nested HTML description. Therefore the blank web-reader result does not establish a browser dependency. This is an observation about one notice, not a guarantee for every Cornerstone tenant or Transnet page.

The sampled Transnet notice uses capitalized field variants such as `Title`, `Description`, `DatePosted`, `ValidThrough` and `HiringOrganization`. Its timestamp strings omit a timezone offset; the description separately states a date-only closing date. Its geographic coordinates alone must not become a precise job location. These findings shape parser tests, not public promises about availability.

Capitec's graduate and internship destinations both showed a filled-position message in direct GETs. A web-reader result for the graduate page initially contained an older full description, then returned the filled state. The search result for another job also differed from its detail response. Always check the actual detail and preserve the observation time; do not publish a cached search excerpt as current availability. [Graduate destination](https://careers.capitecbank.co.za/job/Stellenbosch-Capitec-Graduate-Programme-2027/1405949733/), [internship destination](https://careers.capitecbank.co.za/job/Stellenbosch-Capitec-Internship-Programme-2027/1405951133/).

## Deferred Transnet adapter brief

### Input and discovery boundary

Proposed adapter ID: `transnet_requisition_jsonld_v1`. Input is bounded HTML retrieved from an exact registered notice URL, plus source revision, retrieval time and immutable snapshot ID. The first URL is the observed requisition `5963`; its existence does not authorize enumerating adjacent IDs.

The issuer's official careers link establishes the tenant relationship; the discovery article identifies a notice within that tenant. Retain these distinct roles. The initial implementation consumes operator-reviewed URLs. Do not claim it discovers new vacancies automatically. Later discovery should use an assessed index/feed/sitemap or a separately qualified browser route; do not guess undocumented API endpoints.

### Extraction and canonical mapping

| Input | Draft treatment |
|---|---|
| Tenant + requisition ID in the reviewed URL | Stable source identity. Verify any in-description reference agrees; conflict goes to review. Keep recruitment cycles distinct and preserve the source URL. |
| JobPosting title and hiring organisation | Pending title/issuer facts, supported by the retained snapshot. Recognised company names cannot approve an advert. |
| Embedded description HTML | Parse inertly; remove style/script/link assets and retain meaningful text, lists and tables. Never execute embedded scripts, load fonts or copy its HTML into public output. |
| Explicit opportunity wording | Propose category; ambiguous categories need review. A source label alone cannot settle internship subtype. |
| Qualification/experience sections | Preserve original blocks and AND/OR/conditional relationships. Use the canonical unknown-expression form if rules cannot safely represent the relationship. |
| Closing-date prose and offset-free metadata | Preserve both observations. Prefer a corroborated date-only draft; leave timezone, time and UTC instant unknown unless source evidence establishes them. Contradictions require review. |
| Country/location fields | Preserve stated geography and uncertainty; do not infer city, residence eligibility or relocation support from coordinates or employer headquarters. |
| Salary, stipend, documents and practical conditions | Extract only stated values. Missing information stays unknown; no default salary, CV requirement or eligibility. |
| Notice URL/application controls | Propose the canonical employer notice as the handoff page, subject to review of the genuine route. An enquiry email is not automatically an application destination. |
| Publication and check fields | Always pending/unapproved; no inferred verification, availability check, reviewer identity or submission success. |

This is a mapping specification, not extracted production inventory. The first parser should use rules and operator review. Add model extraction only after measuring a specific unresolved parsing problem on held-out cases.

### Integration with existing code

1. Add a pure, network-free adapter module under `packages/catalogue/src/adapters/`, with authored fixtures under `packages/catalogue/tests/fixtures/`. Fixtures must be labelled synthetic and contain no real application destinations.
2. Extend `packages/catalogue/src/schemas.mjs` with a discriminated adapter/version configuration. Its current permission method only accepts `structured_json`. Retain the existing adapter and do not encode an unresolved permission as approved just to satisfy the schema.
3. Extend `fetch.mjs` through explicit HTML/JSON MIME profiles while retaining exact URL, DNS, TLS, redirect, timeout and byte controls. Add source-policy retrieval, robots evaluation and per-host pacing before real recurring collection. Do not weaken the current JSON profile globally.
4. Refactor `store.mjs` so retrieval, snapshot identity and adapter dispatch are separate steps. It currently parses fetched text directly as canonical JSON. Keep failed-fetch semantics, source revision checks, leases, review reset and atomic publication restrictions intact.
5. Store the original permitted response and stable extracted-content fingerprint separately. Two observed Transnet responses had different whole-page hashes; the cause was not established. Test whether volatile markup would cause needless draft revisions. A content fingerprint must include every material field and parser version, and cannot replace source evidence or periodic review.
6. Keep publication through the protected operator workflow. New source content must never publish itself. A removal or HTTP failure prompts review; an explicit closure signal can support an operator closure decision.

Potential general plumbing belongs in `packages/catalogue`; no new independently deployed AI service or queue broker is justified by this assessment. The current 30-second job lease also needs re-evaluation if policy fetches and pacing happen inside it; do not add a 10-second wait plus multiple fetches without lease tests.

## Qualification and operating proposal

First offline test cases: capitalized/lowercase field variants; conflicting duplicate variants; missing/multiple/malformed JobPosting objects; missing requisition identity; nested HTML assets; malicious embedded instructions; ambiguous requirements; offset-free or contradictory dates; missing location/pay; explicit closure; repeated unchanged content with volatile markup; distinct intake IDs; changed material facts. Reject ambiguity rather than selecting the first unrelated object silently.

Then exercise the existing emulator path: draft stays private, operator review publishes, repeat collection creates no duplicate, material changes restrict the old action pending review, failed retrieval retains last success, stale workers cannot complete, and closure/withdrawal survive restarts. These tests have not been run for this adapter because it is not implemented yet.

After the source basis is resolved, start with a proposed five-detail pilot, one scheduled run/day and one concurrent request to this host. Honour at least the observed 10-second delay and any stricter applicable condition. Use a 500 KB maximum per response initially, within the current source limit, and pause on denied access or format drift. Record material errors, changed-content false alarms, review minutes and processing cost before expanding. These are proposals, not enabled settings or staffing commitments.

Broaden the sample across independent notices and subsequent changes before declaring reliability. The first fixture set is separate from the planned 60-case, six-category held-out benchmark. It does not replace that benchmark or G1's real-source demonstration.

## Source basis and next work

For Transnet, the outstanding record must address automated retrieval of the exact tenant routes, retained evidence, source-attributed factual summaries/excerpts, deep links and correction/removal handling. No logo reuse is proposed. Relevant recruitment terms or issuer authorization need to establish the basis; a robots delay alone does not. The reviewed corporate Legal Notices page contains unrelated notices, and search results for port-management/order-to-cash terms do not establish recruitment conditions.

The **Transnet detail adapter is deferred behind RecentJobs** by the founder's subsequent decision. When this source is resumed, qualified real snapshots and recurring collection follow only when their basis is recorded. Manual copying is not an automatic workaround for unresolved reuse.

No outreach was sent, and this document does not ask for a blanket scraping approval. The assessment and technical selection are complete; live-source qualification remains open under the [acquisition plan](10_SOURCE_ACQUISITION_AND_SCRAPING_PLAN.md) and [B03 runtime contract](../engineering/15_SOURCE_PUBLICATION_RUNTIME.md).
