# M0 companion delivery plan, estimates and review gates

Updated: 13 September 2026. Status: proposed inclusive effort estimate, not measured throughput or committed dates. Owner: founder/engineering/product. This is the current detailed first-public-MVP plan under [M0](../product/03_DISCOVERY_FIRST_MVP.md). Existing [S01–S35](16_SPRINT_BACKLOG.md) remain the expanded work-package portfolio; B01–B10 are delivery slices within/revising that work, not ten additional releases to add on top.

## 1. Scope and order

24 September adoption: preserve M0-A–G and the full career-platform ambition while applying the [operational refinements](../governance/08_OPERATIONAL_REFINEMENTS_2026-09-24.md). Allocate them within B01–B10 below. This documentation does not complete the work or establish a new delivery date.

Keep permitted scraping, primary-source tracing, reviewed posting and browsing across six categories. Deliver source-faithful explanations, visible source checks, device-local progress, useful sharing and a bounded public-link suggestion flow. Retain issuer pages and initial discovery shelves, but prioritise the source/detail/continuity foundation ahead of elaborate popularity mechanics. Reviewed thematic collections reuse the same catalogue and may start simply as maintained filter links; no user-generated public collection platform at M0.

M0-A–G in the product specification define what launches. Full career accounts, private evidence, durable personal agents, institution workspaces and the career network follow under R1–R5. Source curation is recurring service work, not a completed one-off import. Broader INV research remains after M0.

## 2. Inclusive delivery slices

Each range includes slice design, implementation, appropriate verification, documentation and initial feature-relevant observation. Cross-cutting regression and launch work appear explicitly in B09/B10; do not count the same work in both a slice and these packages. Estimates assume reuse where the audited code actually works, the reference stack, one founder, source-based templates and bounded reviewed intake. New infrastructure/team/API access is not presumed.

| Slice | Deliverable | Dependency | Existing package homes | Inclusive estimate | Acceptance focus |
|---|---|---|---|---|---|
| B01 | Reproduce relevant code, audit exposed routes, choose public deployment boundary, prototype key task and set measured budgets | Repository and current docs | S01, bounded S02/S10 | 12–24 h | Audit evidence, DCF-18/19/22 planning; actual remaining estimate |
| B02 | Six-category schema, requirement logic, source/check records and migrations | B01 | S02–S03 | 20–36 h | DCF-01/02/05/06; both internship routes |
| B03 | Permitted crawl/source register, safe review/publish, deduplication and recheck/closure | B02 | S03–S04 | 24–44 h | DCF-03/04/13/16/22; representative real source inventory |
| B04 | Feed/filter/detail, source panel, plain explanations and source-specific checklist/handoff | B02, public projection from B03 | S04 and bounded S06 | 20–36 h | DCF-01–06/18; core usability |
| B05 | Device-local shortlist stages, route-open event, resume/change/clear behaviour | B04 | S04/S06/S10 | 12–20 h | DCF-11–13 |
| B06 | Public-link intake, private receipt/status, deduplication and reviewed result | B03–B04 | S03/S04/S06 | 16–28 h | DCF-07–10; unsafe/unsupported inputs |
| B07 | Structured share text, public source-checklist copy/download, native/WhatsApp flows and current public previews | B04 | S04/S10 | 12–24 h, pre-refinement baseline; re-estimate | DCF-14/15 and operational subcriteria; no private data, backup or delivery overclaim |
| B08 | Issuer pages, new/closing/editorial shelves and simple maintained collections | B03–B04 | S04 | 12–20 h | DCF-20; no fabricated popularity or employer ratings |
| B09 | Cross-feature accessibility, phone/network, security/data and analytics/cost regression | B05–B08 | S10 and bounded S11 | 16–28 h | DCF-09/10/18/19/21/22/24 |
| B10 | Six-category real-task review, operations rehearsal, deployment/rollback and first release feedback | B09, actual deployment access | S11 | 16–28 h | All exposed M0 acceptance; source/support owner and limitations |

**13 September M0 estimate, before the 24 September refinements: 160–288 inclusive hours.** This is a judgement range for the then-documented scope, not a quotation or revised total. B01 must revise it from actual working code and observed failures before dated commitments. Significant dependency repairs, source-access difficulties, translation, new hosting architecture, unavailable review help or expanded input support can change the range. Never silently fill seasonal gaps with fake listings.

The 160–288 hours and calendar scenarios remain the 13 September baseline, not a recalculated estimate including the 24 September refinements. B01 must account for actual repairs; B03/B10 for task-based catalogue coverage; B04 for practical conditions and actionable copy; B05 for loss-limit explanations; B07 for public checklist export; and B09 for affected privacy, failure and performance checks. Record incremental and overlapping effort once. No fixed additional hours, unchanged total, one-day stabilisation or completed B01 is claimed.

Do not add 160–288 hours to the old full R0–R5 total: foundation and discovery work overlap. The roadmap's earlier 1,290–2,180-hour portfolio is retained as a superseded-for-first-launch baseline, not a recomputed full-company total including new scope. Reconcile completed M0 slices, remaining original work and additions explicitly during reforecast. No full S package is marked complete from partial M0 delivery.

## 3. Conditional calendar scenarios

Use the existing capacity method: reserve 25% of gross weekly hours for interruptions/uncertainty. Formula: ceiling(M0 inclusive effort / planned weekly hours), plus blocking external waits. These are capacity illustrations, not a recommendation to compromise apprenticeship or a statement of founder availability.

| Gross weekly hours | Planned weekly hours | M0 elapsed working weeks |
|---|---|---|
| 10 | 7.5 | 22–39 weeks |
| 20 | 15 | 11–20 weeks |
| 35 | 26.25 | 7–11 weeks |

No start date is assumed. AI-assisted gains must show in delivered work; calendar cannot be divided by agent count. A two-week review iteration at the reference 20 gross hours/week plans 30 hands-on hours. B slices may span iterations. Broader research and ongoing source support after launch consume future capacity and are not free additions to later development.

## 4. Sprint planning and demonstrations

24 September implementation progress: the [public web stabilisation slice](../engineering/10_PUBLIC_WEB_STABILISATION_2026-09-24.md) records the public route inventory, isolated prototype handlers/data, reproducible scoped web checks and 21 passing production-server tests. B01 remains open for deployment/configuration choices, a usable task prototype, measured budgets and reforecast. The next contract implementation is B02; this partial result does not retire any accepted M0 feature or mark S01 complete.

First iteration: B01, then the highest-risk B02 contracts that fit measured capacity. Demonstrate a source-linked detail prototype, clarify the fetch/publication boundary and record known failures. Following iterations pull ready slices in dependency order; B05/B06/B07/B08 are technically separable after their dependencies but a solo founder schedules their effort sequentially unless real capacity exists.

Use the [bounded audit](../engineering/09_BASELINE_AUDIT_2026-09-24.md) to specify the first repairs. Classify exposed routes/imports, isolate unsupported sensitive functionality, select required workspace dependencies and make lint/typecheck/build reproducible. Package removal is optional engineering judgement after dependency inspection, not a blanket instruction. Record selected vs excluded checks and repair actual diagnostics, including remaining agent imports inside web routes. A build pass is only part of B01 acceptance.

Each review records completed acceptance, current source quality, measured hours/cost, unresolved risks and the next usable demonstration. Issue template: B slice; S/PRD family; user task; implementation surface; source/data boundary; dependency; inclusive estimate; DCF cases; output artefact; actual evidence; operating owner; remaining scope. The [accepted-idea traceability register](../governance/06_DISCOVERY_STRATEGY_TRACEABILITY.md) prevents an agreed idea being lost during issue creation.

No arbitrary backlog expansion to make every idea launch simultaneously. Ideas remain documented in M0, next experiments or later portfolio homes. Moving an accepted M0 slice later requires an explicit scope decision and updated public claims. If launch is restricted, say exactly which capability remains unavailable and why; do not declare complete M0 while hiding unfinished slices.

## 5. Go/no-go evidence

Public launch needs an actual build, safe exposed routes, reviewed representative six-category inventory, accurate source/application links, understandable detail/uncertainty, functional save/resume/share, bounded suggestion intake, correction/report ownership, declared data/storage practices, measured performance/cost controls and deployment/rollback evidence. Evidence is a record, not a promise to check later. Consumer support and source monitoring need actual coverage arrangements.

Attach the operations coverage/task matrix and observed relevant-result gaps to this evidence. Neither the starter source sample nor a fixed artisan-listing count proves catalogue usefulness. Preserve all categories while deepening reachable-community coverage. Demonstrate public checklist export and understandable local-save limits; do not market browser-only M0 as a lifetime backed-up record. Review cold/repeat transfer costs and source-stated practical conditions without making zero-rating a launch dependency.

No institution payment, nationwide catalogue, zero-rated carrier deal, employer API, complete personal career record or social network is required to pass M0. Keep sources, credentials and sensitive-feature gates relevant to their own use. Examples shown publicly cannot masquerade as real listings.

## 6. Post-launch work allocation

At the first post-launch review, create dated tasks for all INV-01–18 under the M0 research schedule. Proposed first two weeks: consumer comprehension, abandonments, return usefulness and source failures. Proposed weeks 2–6: institutional alternatives, recipient acceptance, buyer authority, host capacity and unit economics. Windows depend on access and observation; do not promise results on those dates.

Prioritise post-M0 experiments from observed need: follow/digest, comparisons, calendar/deadline board, richer collections, employer submission, then readiness/career continuity. Trending requires real support and an experiment protocol before activation. Social participation follows the [staged network plan](../growth/04_LOCAL_DISTRIBUTION_AND_CAREER_NETWORK.md), including moderation and school safeguards. None is automatically added to M0 estimates.

## 7. Completion reporting

Keep documentation completion separate from implementation completion. For a build milestone report user-visible behaviour, relevant DCF results, live-source coverage, remaining limitations, cost evidence and release status. Do not report registration, organic sharing, placement, partnership, model accuracy or paid adoption without the corresponding evidence.
