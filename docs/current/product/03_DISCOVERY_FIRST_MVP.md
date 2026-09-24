# Discovery-first MVP and launch learning plan

24 September operational adoption: the founder retained this scope and the larger ambition while accepting [targeted refinements](../governance/08_OPERATIONAL_REFINEMENTS_2026-09-24.md). Deepen useful first-community inventory without removing any category; explain local-save loss/shared-device limits; add previewable copy/download/share of the public source-backed preparation checklist within M0-C/D; pair uncertainty with truthful next actions; and present source-stated practical costs/support. Personal-progress export and an affordability calculator remain later options. Technical stabilisation, measured data use and existing post-M0 institutional sequencing remain explicit. These are documented requirements, not implemented functions; delivery estimates require reconciliation.

Updated: 13 September 2026, accepted companion-strategy revision. Status: founder-authorised product direction translated into build specifications, not implemented functionality. Owner: founder/product. Launch discovery first and start broader strategic investigations after the MVP. The [idea and claim register](../governance/06_DISCOVERY_STRATEGY_TRACEABILITY.md) records every accepted addition and corrected assumption.

## 1. Sequencing decision and authority

**M0 is the first public MVP: find a useful opportunity, understand its requirements, save or share it, and reach the original application route.** The complete career platform remains the destination. All six categories launch together: bursaries, learnerships, apprenticeships, internships, graduate programmes and jobs. Consumer use remains free.

**Permitted scraping, source discovery, reviewed posting and the scrolling feed remain central.** The companion experience adds clarity and continuity; it replaces none of those capabilities. Support both student/WIL and graduate internships, jobs beyond entry-level, and national/remote opportunities. The initial apprentice/school-leaver audience guides outreach and local coverage depth, not a silent restriction on users or catalogue scope.

This document supersedes earlier wording that made the complete R2 career workspace the first public MVP. R0–R5 and S01–S35 remain the expanded capability plan, with R2 now the expanded consumer release. M0 pulls forward only the relevant discovery, source, usability and operating controls. Completing M0 does not complete all of R0, R1, R2 or their requirements.

Institutional discovery, buyer interviews and the broader INV-01–18 programme start after M0. They do not block public opportunity browsing. Checks necessary for the actual launched features remain before launch: functioning code, permitted sourcing, source accuracy, data handling, usability, operating costs and correction/support. This is product delivery work, not a requirement to finish a market study.

## 2. Initial promise

**Skilved helps people starting their careers in South Africa make sense of work and study opportunities—with clear sources, practical next steps and support that grows with them.**

Short task promise: **Find your next opportunity. Understand what it needs. Apply at the source.** People can arrive simply to scroll. The connected experience should earn four feelings: understood, informed, in control and supported. Measure those through comprehension, reversible choices, useful next actions and recovery from changes; friendly copy alone is insufficient.

Target the first distribution effort at reachable apprentice peers and school leavers while keeping all six categories available. The differentiating hypothesis at launch is a useful combination of freshness, clear requirements, low-data browsing and trustworthy handoff across work and study opportunities. Neither this combination nor attractive UI is assumed to be unique or sufficient to defeat established competitors.

The [experience specification](../design/05_OPPORTUNITY_COMPANION_EXPERIENCE.md) defines seven questions every detail answers: what it is, who offers it, availability, relevant requirements, practical conditions, next action and how to resolve a problem. Locality means source knowledge and practical context; location, residence eligibility and relocation are separate. Users can widen their search. Larger platforms can copy individual features; we must establish better task outcomes for actual users.

## 3. M0 scope and acceptance

These slices specify M0 acceptance; existing PRD references identify their broader requirement families, not a claim that each referenced requirement is fully delivered.

| Slice | Launch behaviour | Acceptance and existing mapping |
|---|---|---|
| M0-A: opportunity feed | Signed-out, mobile-first scrolling with search and six category filters; location, field and stated entry-stage filters; accessible load-more, preserved navigation position and shareable result URLs | Representative real listings in each category; meaningful limited/seasonal availability states; no fabricated filler. PRD-001/002/007/008/035/036; S02–S04 |
| M0-B: useful discovery shelves | New this week, closing soon, source-stated no-experience routes and clearly labelled editor's picks | New means first listed on Skilved unless the original publication date is known and labelled separately. Closing soon uses known deadlines and handles date/time uncertainty; missing experience rules never imply no experience required. PRD-003/004/005/007; S03–S04 |
| M0-C: clear opportunity detail | Seven-question detail, visible source/check panel, original requirement plus faithful explanation, practical conditions and source-specific preparation checklist | Show scope/time/uncertainty of checks; distinguish URL reachability from issuer attribution and availability. No guessed pay, equivalence, document waiver or submission guarantee; no document upload. PRD-003/004/026/028/029; S03–S04 and bounded S06 |
| M0-D: shortlist, continuity and sharing | Device-local interested/preparing/applied-reported/not-pursuing stages; independent route-open event; return/change notices; structured WhatsApp/native/copy share, public source-checklist copy/download and public previews | Browser-only/shared-device and data-loss limits, reliable save/clear/failure states, no sync or backup claim; user report is not issuer receipt. Current facts survive at canonical links; static exports are dated references; private state never enters shares/exports. PRD-005/028/029/036/038/041; S04/S06/S10 |
| M0-E: companies with current openings | Simple issuer pages derived from source-backed, currently open catalogue entries, grouped by category and linked to the original careers/application site | Show "open listings found by Skilved" with check time. Listing counts are not total vacancies, actual hires, company quality or endorsement. Merge issuer aliases and deduplicate listings; no employer account required. PRD-003/005/007; S03–S04 |
| M0-F: correction and operation | Report listing, operator review/publish/correct/close controls, minimal lawful aggregate measurement, error handling and rollback | Reports cannot auto-publish changes; secrets/admin endpoints are protected; demo listings cannot enter production. Source failures and expired records are handled. PRD-009/024/035/036/039/040/041/042; S01/S02/S04/S10/S11 slices |
| M0-G: bring a public link | Supported public-link lookup or reviewed suggestion with minimal private receipt/status; locate original source and existing record where possible | No automatic publication/verification, private-group scraping, screenshots, credentials or applicant documents. Safe bounded retrieval, non-enumerating receipt access, review owner and honest unresolved/unsupported states required. Separate from later signed-in private preparation. PRD-006/009/024/038/039/042; S03/S04/S06 |

M0 has no requirement for a public social profile, document vault, AI chat, persistent autonomous agents, full career account or institutional dashboard. Those remain in the expanded product plan. Unreleased sensitive routes must be disabled at the server/deployment boundary, not merely hidden in the navigation. Add accounts or notifications only with their complete ownership, recovery, privacy and delivery controls; do not make them an accidental launch dependency.

## 4. Hot features with a useful purpose

| Timing | Feature | Value and release condition |
|---|---|---|
| M0 | New this week / closing soon / editor's picks | Useful discovery immediately, even without traffic; editorial selection has published criteria and is not labelled popularity |
| M0 | Companies with current openings | Helps users discover recurring issuers; limited to the indexed, checked catalogue |
| M0 | Shareable opportunity cards | Public previews show title, category, issuer, source link and date where known; clicking returns to the current detail page so an old share does not conceal closure |
| M0 | Bring a public link and resume saved progress | Creates value when discovery happens elsewhere and on return; bounded review and browser-only continuity under M0-D/G |
| M0, simple editorial form | Maintained thematic collections | Reuse catalogue/filter links for useful groupings; source-backed inclusion, no separate user-generated collection platform |
| First post-M0 experiments | Trending on Skilved | Based on genuine, sufficiently supported activity under section 5; a popularity hypothesis, not a guarantee of suitability |
| First post-M0 experiments | Follow a search, category or company; opt-in digest | Gives a reason to return when something changes. Begin with one supportable channel; require preference, unsubscribe, duplication and cost controls |
| First post-M0 experiments | Compare a few opportunities | Compare source-stated requirements, locations, deadlines and funding/pay on like-for-like terms; unknown fields remain visible |
| First post-M0 experiments | Personal deadline board and calendar export | Turns browsing into preparation; careful handling of source changes, unknown time zones and dates without exact times |
| First post-M0 experiments | Richer and user-created collections | Extend simple M0 editorial collections after moderation, audience and sharing controls; do not create stale duplicate records |
| First post-M0 experiments | Employer/provider submit-an-opportunity form | Capture issuer, official listing URL, category and minimally necessary contact details; review before publication, confirm origin/authority where required, prevent spam, and avoid collecting candidate documents. Submission does not buy a trust badge |
| Expanded consumer release | Reusable career facts, readiness gap help and evidence packs | Connect discovery to the original personal career product once document/ownership controls and user demand support it |
| Research-gated later work | Institutional handover, supervisor evidence, SDF workspace and integrations | Follow the existing investigation and recipient/buyer gates before committing to these builds |

Keep these as a prioritised option set. Add one coherent improvement, observe its effect and choose the next. Extra features are extra work; none is assumed to fit existing estimates for free. Employer reviews, "best employer" rankings, open DMs, engagement streaks, mass auto-apply and a full social network are outside M0.

## 5. What trending and company activity actually mean

At cold start, use chronological shelves and labelled editorial picks. Never invent views, saves, applications, urgency, testimonials or hiring activity. "Trending" must say **on Skilved**, with its observation window. It describes platform interest, not the whole South African labour market, competition for a role or the chance of being hired.

Trending is a post-M0 experiment governed by the [distribution/network plan](../growth/04_LOCAL_DISTRIBUTION_AND_CAREER_NETWORK.md). A save-based signal is a candidate, not an adopted formula. Choose the observation window, support threshold, deduplication, privacy and manipulation controls using measured data before evaluating the experiment. The earlier tentative ten-browser threshold is retired as a product requirement. At insufficient support, show chronological/editorial shelves; raw clicks or share intents are not applications or completed shares.

Keep chronological discovery available, respect user filters, avoid letting popularity hide every lesser-known issuer, and remove closed listings from active ranking. A separate, source-stated closing-soon label must not distort the popularity count. Future sponsorship is separately labelled and does not enter organic trend scoring through payment.

Company "activity" initially means checked open listings in the catalogue, with duplicates merged. A later "new listings this month" count requires retained history and a declared window. No claims such as "fastest hiring", "best employer", "most likely to hire you" or employee satisfaction without suitable evidence and the separate PRD-058 review. A discovered issuer page does not imply partnership or a verified company representative.

## 6. Small launch growth loop

Someone finds a useful source-backed listing, saves or shares it voluntarily, a recipient opens the current page without a registration wall, and both can discover related opportunities. Measure usefulness at each step before calling this a viral loop.

Prepare representative public pages, accurate social previews, maintained collections and an understandable first-use journey. Start promotion through founder-authorised channels and willing community administrators; this plan authorises no messages, contacts upload, paid campaign or spending. Search indexing is a distribution experiment with no guaranteed traffic. Public listings should preserve attribution and avoid reproducing more source content than the permitted use requires.

Useful launch measures: detail-to-save and detail-to-application-route-open rates, repeat useful visits by cohort/window, broken/expired listing rate, correction turnaround, mobile usability, source coverage, operating cost and unsolicited useful feedback. Report denominators and limits. Dwell time, downloads, raw views and mandatory sign-ins do not establish employment impact or business viability.

## 7. Research after M0

The complete [INV-01–18 agenda](../research/02_STRATEGIC_INVESTIGATIONS_AND_PRODUCT_OPTIONS.md) stays active as a scheduled workstream, not a launch prerequisite and not abandoned documentation.

| When | Investigation work | Result to record |
|---|---|---|
| Before M0 launch | Only launch-relevant portions of INV-01/06/12/13/14/17: a few actual browse/understand/handoff observations, source and data checks, cost visibility, working-code verification | Fix blockers in the launched journey; no comprehensive institutional study or paying customer gate |
| First two weeks after M0, proposed hands-on window | INV-01/06/07/14/15: observe successful and abandoned discovery tasks, check who returns and why, inspect wrong assumptions and category coverage | Prioritised consumer fixes and one post-launch feature experiment; appointments and enough observations may take longer |
| Weeks 2–6 after M0, proposed discovery window | INV-02/03/04/05/08/09/10/11/12/13/16: installed systems, actual bottleneck, accepted output, buyer authority, recurring economics, verification and partner access | Keep/change/defer institutional hypothesis; no payment or access presumed |
| Before an institutional build or paid product promise | Resolve the relevant original P0 gates; revisit INV-17 for the actual proposed workflow | Concrete scope supported by recipient, buyer and implementation evidence |
| Expansion | INV-18 plus longitudinal follow-up on earlier findings | Evidence that value transfers to another institution, sector or country |

Founder owns the research backlog. At the first post-launch review, create dated investigation tasks and maintain an evidence/decision log; revisit at each two-week product review. Windows are relative to an actual launch, not calendar commitments, automations or a claim of completed interviews. Do not postpone all learning until a large audience exists. Consumer traffic alone cannot validate institutional willingness to pay.

## 8. Build sequence and honest estimates

The [M0 delivery plan](../planning/03_M0_COMPANION_DELIVERY_PLAN.md) expands the earlier five groups into B01–B10 with dependencies, PRD/S-package mapping, acceptance and an initial **160–288 inclusive-hour** range from 13 September. That baseline covers link intake, progress and source/feed work, but is not a recalculated estimate of the 24 September operational refinements. B01/S01 must reconcile those refinements and actual code before promising dates. The earlier reference 20 gross hours/week scenario yields 11–20 working weeks before blocking external waits; it is not confirmed founder availability, a revised schedule or a deadline.

Existing S01–S35 contain overlapping foundation work. Allocate that work once to M0 and leave remaining expanded-release scope visible; do not add the M0 estimate to all previous R0–R2 hours or label incomplete packages finished. The R0–R5 arithmetic remains the earlier expanded-portfolio baseline pending reconciliation; it is not a recomputed total including every new idea. Trend activation and later social/institutional experiments need separate estimates when selected.

M0 release evidence must include real permitted inventory across all six categories; accurate source/application links and uncertainty; source refresh/closure handling; accessible low-data browse/save/resume/share/handoff and safe suggestion-intake tests; protected admin and disabled unreleased sensitive endpoints; appropriate analytics/reporting data handling; correction/support ownership; measured operating cost controls; and deployment/rollback evidence. Use [DCF-01–24](../quality/02_DISCOVERY_COMPANION_ACCEPTANCE.md) with its release allocations. Check exposed features while preserving fuller gates for later capabilities.

## 9. Competition and evidence limits

Alerts and saves are established features: [LinkedIn job alerts](https://www.linkedin.com/help/linkedin/answer/a508396) and [Indeed saved jobs](https://ca.indeed.com/help/job-seekers/articles/14087165677837-my-jobs-saving-a-job) describe them in their own help material, checked 13 September 2026. Their presence is no basis for claiming Skilved uniquely invented these tools or will displace competitors.

The product hypothesis is that Skilved can earn preference for a specific audience through a better complete discovery task and then learn which deeper career capabilities they need. This document changes sequencing and acceptance scope. It does not establish implemented code, actual rankings, launch traffic, employer participation, partnerships, customer payment or market superiority.

## 10. Companion standards and later network

The companion is demonstrated by faithful explanation, scoped source checks, continuity and correction. No blanket verified/safe badge, fake urgency, unsupported legal warning, invented performance number or fabricated competitive superiority is allowed. Source-linked evidence, original requirement logic and accurate states take priority over persuasive wording. M0 has no programmatic display ads, compulsory media or intrusive popups; measure device/network performance before making claims.

Social ambition remains: useful individually at M0, better with reviewed contributions/invited groups, then a purposeful career network with profiles, projects, referrals, programme communities and employer participation. The [network plan](../growth/04_LOCAL_DISTRIBUTION_AND_CAREER_NETWORK.md) specifies gates and later surface options. Neither WhatsApp sharing nor initial focus is a permanent prohibition on in-product social relationships.

Implementation details, source operations and design follow their [contracts](../engineering/04_DISCOVERY_COMPANION_IMPLEMENTATION.md), [runbook](../operations/03_SOURCE_CHECKS_AND_COMMUNITY_CONTRIBUTIONS.md) and [experience specification](../design/05_OPPORTUNITY_COMPANION_EXPERIENCE.md). They are part of this accepted scope, not optional notes or claims of delivered code.
