# Source assessment evidence — 26 September 2026

Subsequent founder decision: [RecentJobs is first](../../../../operations/13_RECENTJOBS_FIRST_ADAPTER.md). These earlier comparative observations remain valid as dated evidence; the Transnet-first recommendation is superseded.

Scope: read-only source research plus a repository implementation brief. No crawler was installed or activated; no source was registered in Firestore, no opportunity published and no adapter tests run. See [the decision and proposed work](../../../../operations/11_FIRST_SOURCE_ASSESSMENT_2026-09-26.md).

## Direct HTTP observations

Python standard-library HTTPS requests used `SkilvedSourceAssessment/0.1`, identity encoding and no authenticated session. Requests were bounded assessment probes, not a production worker. Bodies were inspected in memory and not retained in this repository. SHA-256 values identify the observed bytes but cannot reconstruct them or substitute for permitted fixtures. Page bytes may vary across requests.

| URL | Observed response | Bytes read | SHA-256 |
|---|---|---:|---|
| [Transnet tenant robots](https://transnettalentportal.csod.com/robots.txt) | 200, text/plain; wildcard agent with 10-second crawl delay | 33 | `90cfe6339dce22b807225baffbe0be39b591fcf8966240612919878542bcb397` |
| [Capitec careers robots](https://careers.capitecbank.co.za/robots.txt) | 200, text/plain; application/account/service paths excluded | 252 | `91669efc2767d124199e1d848655af18d64ac71e61ae1227be7b6aa866f03caf` |
| [StudentRoom robots](https://www.studentroom.co.za/robots.txt) | 200, text/plain; wp-admin excluded with admin-ajax exception; sitemap declared | 125 | `f1aeaf716d03fbecab67f37d346649c003f288e7be5770a0ee54cf5fbb421b8a` |
| [Capitec search](https://careers.capitecbank.co.za/search/) | 200, HTML; job links and `jobTitle-link`/`searchResults` markers | 83,434 | `aa4aff9befee47500dfd785248a1b5e4bdce197d298c9147bbd8d1c470db044d` |
| [Capitec graduate detail](https://careers.capitecbank.co.za/job/Stellenbosch-Capitec-Graduate-Programme-2027/1405949733/) | 200, HTML; filled-position signal | 37,151 | `c94b0f14df1af577b74c37a91ee145a3393e811bdc1205cecffd278e48813830` |
| [Capitec internship detail](https://careers.capitecbank.co.za/job/Stellenbosch-Capitec-Internship-Programme-2027/1405951133/) | 200, HTML; filled-position signal | 37,170 | `9bd4593628c6a6a85deff7ee6c7be45a8fef5c7f12a2b2e99bf4f3845c98157b` |
| [Transnet requisition 5963](https://transnettalentportal.csod.com/ux/ats/careersite/1/home/requisition/5963?c=transnettalentportal) | 200, HTML; one embedded JobPosting; no ordinary readable text outside scripts | 17,668 | `2673332ba1b4e8e575bda89b3c6f67dc0044a5035b0962abb1ebdacab52de7eb` |

No ETag or Last-Modified header was observed on those four direct HTML responses. This does not establish permanent absence or rule out conditional requests elsewhere. A later Transnet response had SHA-256 `8c4b3ba1a822334b89cad262d8678f9f614132076561d4fcd313752befd02281`; the reason for changed bytes was not determined.

The Transnet object had `Title`, `Description`, `DatePosted`, `ValidThrough`, `jobLocation` and `HiringOrganization`. Its description contained HTML, style/font references, source sections and an enquiry link. It must be parsed as inert data. The offset-free metadata and a separate closing-date field require precision-aware mapping; no timezone conversion was verified.

## Policy observations and failed reads

- The three robots files were not accessible through the web reader but were retrieved by ordinary direct GETs. This is a tool-path difference, not evidence of source authorization.
- Direct retrieval of [Capitec main-site terms](https://www.capitecbank.co.za/terms-of-use/) returned 403; no proxy or identity rotation was attempted. The web search/read path exposed sections 1, 4 and 5: named main-site scope, restricted copying/IP use and prior approval for linking. Applicability to the careers subdomain remains unresolved. No career-specific policy link appeared in the bounded HTML-link scan; that does not prove none exists.
- [Transnet careers](https://www.transnet.net/Careers) explicitly links to the observed recruitment tenant. Its HR statement concerns applicant information. [Legal Notices](https://www.transnet.net/LegalNotices) did not supply recruitment reuse terms. Port-management and order-to-cash search results were excluded as different services.
- [StudentRoom](https://www.studentroom.co.za/) exposes category listings and a rights-reserved notice. Its [Transnet article](https://www.studentroom.co.za/transnet-trainee-controller-learnerships-2026-apply-with-grade-12-or-n3/) links to the observed primary requisition. No publication or snapshot-retention grant was established.

## Reproduction and validation limits

Use the linked URLs for a fresh bounded assessment after rechecking source policy. Examine inert `script[type="application/ld+json"]` data rather than relying only on rendered text. Match the tenant/requisition identity and compare material fields with description sections; record response status, MIME, time, bytes and source revision. Do not execute embedded scripts or follow application/account actions during source inspection.

The previous turn ran four existing salary-parser unit tests in `sa-search-engine`; that result does not test this proposed adapter. The current task changes documentation only. Production ingestion, extraction accuracy, operating burden and all six categories remain unqualified.

Validation: a scoped Python check of the six added/updated documents found 136 valid local link targets, balanced code fences and no trailing whitespace (exit 0). WSL Git's scoped `diff --check` also passed for the three tracked index/status files. The repository-wide PowerShell documentation checker could not execute because this host requires a signed script; execution policy was not changed. These scoped checks do not claim that the full documentation checker passed.
