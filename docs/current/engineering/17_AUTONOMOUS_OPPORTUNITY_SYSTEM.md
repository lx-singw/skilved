# Autonomous opportunity system: delivery target

29 October 2026. Founder clarification: Skilved must discover, collect, extract, verify, curate, store and publish opportunities automatically, then maintain their freshness. RecentJobs remains the first discovery publisher. Supported adverts are data processed by one reusable workflow. A new vacancy must not need its own script, source registration, worker grant or code change.

This is the current delivery direction for ingestion. The earlier individual-notice pilots are evaluation evidence, not the intended operating model. Generic improvements such as span-only practical extraction remain useful; running another isolated advert is no longer the default next milestone.

## Complete workflow

1. A recurring controller discovers new and changed URLs from an approved publisher, with bounded pagination, cursors and request pacing.
2. The queue captures immutable source observations and retrieval times. Cheap layout, category, deadline, duplicate and unchanged-content checks avoid unnecessary model calls. Missing or unreachable evidence is distinguished from a closed opportunity.
3. AI extracts a versioned canonical candidate: employer, vacancy reference, category, qualifications and their logic, locations, dates, application methods, documents, subjects and trade/intake scopes. Source evidence and uncertainty are retained. Code owns source-text copying and application destinations.
4. The destination resolver finds the original employer method: employer portal, delegated ATS, exact application email, or supported form/submission instructions. It verifies the specific vacancy/intake, not just that a domain exists. An intermediary remains discovery provenance rather than the application destination.
5. Verification cross-checks critical facts against current employer-origin evidence. Employer name, vacancy identity, deadline and application relationship must agree under the publication policy. Models assist interpretation; a supported boolean alone cannot establish trust.
6. Curation resolves duplicates across publishers and employer pages, normalizes supported facts without geographical/eligibility invention, separates genuine trade intakes and excludes unsuitable or expired notices. Identity uses verified employer/reference/intake information where available, with uncertainty held rather than guessed.
7. Storage persists raw observations, canonical revisions, verification basis, freshness, model usage and decisions throughout the workflow. A validated candidate and its feed projection are committed atomically and idempotently.
8. Qualified routine cases publish automatically through the machine identity. Exceptions enter a reasoned review queue; one bad advert does not stop the rest of the batch. Routine adverts do not require a human login or approval.
9. Freshness watches recheck published records, update material changes and remove application actions when an advert closes, changes incompatibly or loses verification freshness. Controlled correction/withdrawal and audit history remain available.

Employer crawling remains an optional configured acquisition method. Original-source verification is a requirement of the target verified publication lane: evidence may come from an employer page, API/feed, delegated ATS or matching original advert. With crawling off or blocked and no equivalent evidence, the result stays unverified and is held from that lane. An unavailable check must not be labelled an employer closure. No crawl setting is changed by this document.

## Reusable configuration

Use a persistent RecentJobs publisher registration for many discovered adverts. Keep employer and recruitment-platform trust separate from individual vacancy data. Corporate careers links can establish delegation to an ATS tenant; a tenant, company name or email domain alone does not establish the exact intake or recipient. New trusted employers/platforms can be onboarded through evidence and policy; supported subsequent vacancies need no repeated onboarding.

The resolver should attempt employer discovery and corroboration automatically under those policies and cache verified relationships. A developer-maintained list of every employer is not the target. Unresolved origins enter review; finding a previously unseen employer is not itself a request for new code or a mandatory manual registration.

Adapters belong to publisher layouts and ATS families, such as JSON-LD, SuccessFactors or Direct Hire. Configuration may describe approved corporate domains, tenant identity, supported paths and acquisition limits. No adapter may branch on an advert's title, reference or sample-specific expected answer. Unsupported platforms and uncertain new origins enter the exception workflow.

Keep the current opportunity records/projections and immutable history. Migrating pilot sources to a publisher-level model must preserve source references, existing identities, actual spend, holds and quota authority. It must not replay old openings as new, approve expired drafts or manufacture a fresh allowance by renaming a source.

## Existing components and actual gaps

| Area | Existing implementation | Remaining delivery gap |
| --- | --- | --- |
| Discovery and jobs | `RecentJobsWorker.schedule/discover/run`, durable jobs, leases and watches | Production registrations/pilots are per notice; add a tested publisher-wide batch configuration, persistent discovery progress and source-independent issuer resolution |
| Extraction and validation | Shared strict contracts, evidence reconstruction, independent validation, caches and private candidates | Demonstrate generalization on a fixed mixed batch and improve recurring failure classes rather than tuning one advert at a time |
| Original-source verification | Registered issuer routes, optional employer fetching, one JSON-LD JobPosting adapter | Broader reusable employer/ATS resolution, exact intake matching and explicit verification outcomes for portals and other methods |
| Storage and curation | Persistent Firestore, immutable versions, public projections and reviewed aliases | Automatic cross-origin identity/duplicate decisions and their uncertainty/review path; source-level budgets rather than per-advert pilot allowances |
| Automatic publication | Generic automatic-mode machine writer, public automatic checks and freshness watches | Gemini, split extraction and programme extraction are explicitly shadow-only; qualify the chosen lane before changing those guards |
| Operations | Durable per-attempt quotas, provider fallback/cooldowns, audit and packaged containers | A recurring controller with stage-aware budget admission, reset-aware deferred work, restart recovery, monitoring and an operational stop control |

The current staging launcher explicitly admits one source/revision in shadow mode with employer crawling off and ingest-only access. Hosting and scheduling remain undeployed. A connected database, verified reviewer or individual private draft is not evidence that the unattended publishing service is operating.

## Implementation sequence and acceptance

Implementation progress, 29 October: [resumable publisher discovery](../operations/196_RESUMABLE_PUBLISHER_DISCOVERY_2026-10-29.md) adds opt-in bounded pagination, immutable parsed page observations, atomic continuations and restart-safe progress under one publisher registration. Authored mixed-employer and large-batch cases exercise the workflow. Employer trust is still configured within the source; its separation and automatic original-source resolution remain next. This is part of A, not completion of A–D or a live publication qualification.

**A. Publisher-wide batch ingestion.** Separate publisher policy, employer/ATS trust and vacancy data. Adapt the existing worker rather than adding another isolated runner. Demonstrate several employers and previously unseen detail URLs under one unchanged RecentJobs registration and machine grant, with duplicate/unchanged notices skipped and immutable provenance retained. First scope remains the intended apprenticeship audience; other categories require their own measured support.

**B. Reusable original-source verification.** Produce typed outcomes for matched, unavailable, closed, conflicting and unsupported evidence. Cover JSON-LD plus a reusable supported ATS layout, and retain exact original emails/subjects where independently supported. Prove a matching domain with the wrong vacancy is rejected and a legitimate platform tenant is not confused with another employer. Robots and access restrictions remain enforced.

**C. Durable unattended orchestration.** Run discovery through the selected qualified publish lane under a machine identity. Admit work within a bounded end-to-end call budget, defer when insufficient, remember provider exhaustion across jobs and resume from stored stages after reset/restart. Avoid terminal failures merely because the last stage has to wait for allowance. Monitoring reports discovered, eligible, extracted, verified, published and held counts, freshness lag and cost per published record. No source-wide run waits on one exception.

**D. Batch qualification and staging publication.** Freeze a representative mixed evaluation set and acceptance criteria before testing. Include unseen employers/intakes, positive cases, closed/conflicting notices, unsafe methods, duplicates and multi-trade cases. Audit both erroneous publication and unnecessary rejection; report denominators and costs. Use supported routine cases to demonstrate automatic staging feed/detail/original handoff, followed by change/closure handling and restart/quota recovery. Enable Gemini/multi-programme publication only for a lane that has passed its explicit qualification; removing a shadow guard alone is not delivery.

The acceptance demonstration must run a batch without per-opportunity code, manual source registrations, temporary grants or reviewer-token intervention. Source/adapter qualification and exceptional review remain operator responsibilities. A single successful sample or large unit-test count does not close this milestone.

## Immediate priority and constraints

Start with A and B, then connect C and qualify D. Stop treating another single-Sasol extraction or manually approved feed entry as the principal production milestone. Case-specific scripts may remain private diagnostic tools; any production fix needs a reusable contract/adapter change and regression evidence.

This direction change does not activate hosting, a scheduler, new grants, provider calls or publication. The founder's instruction to keep hosting undeployed remains in force. Existing source budgets, provider quota history and source holds remain binding until a separately implemented and verified migration. The currently intermittent suggestion-route test failure remains an independent quality issue; it is not solved by this plan.
