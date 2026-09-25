# Decisions, assumptions and unresolved evidence

Date: 11 September 2026. Status: current planning baseline; not a claim of implementation.

## Authority and interpretation

24 September execution clarification: the founder requested a clear, comprehensive chronological phase/sprint path to a working MVP and authorised documentation fixes. The [M0 runbook](../planning/04_M0_CHRONOLOGICAL_BUILD_RUNBOOK.md) now specifies P0–P5, B01a–B10d, handoffs and gates; the [status record](../planning/05_M0_DELIVERY_STATUS.md) owns evidence and unresolved decisions. This implements the agreed scope in planning. It does not confirm weekly capacity, budget, source/deployment access or a launch date. R2 remains the expanded consumer release, not the first MVP.

The founder asked for a comprehensive plan covering the full ambition, declined to impose a scope cap, and delegated unanswered product/planning choices to the assistant. This authorises recommendations and documentation work. It does not establish unlimited money, weekly availability, customer demand, external permissions or proven superiority.

Use these labels throughout the documentation:

| Label | Meaning |
|---|---|
| CONFIRMED | Explicit founder statement or constraint |
| OBSERVED | Repository observation, with scope and date |
| RECOMMENDED | Planning choice made under delegated judgement; reversible |
| HYPOTHESIS | Behaviour, commercial result or advantage requiring an experiment |
| DEPENDENCY | Access, agreement, capability or resource not yet obtained |
| HISTORICAL | Preserved earlier plan, no longer an execution instruction |

Current documents supersede contradictory historical plans. The archive preserves the originals. A later explicit founder instruction supersedes this baseline. Recommendations do not silently become confirmed facts through repetition.

## Founder-confirmed direction

| ID | Decision or fact | Consequence |
|---|---|---|
| F-01 | Skilved began as an unfinished hackathon project and is intended as a startup | Separate retrospective, working prototype and future commercial releases |
| F-02 | Long-term ambition is South Africa, then Africa and international expansion | Design portable records and configurable local requirements; expand through evidence gates |
| F-03 | The living/floating career record and evidence are central | Opportunity discovery must contribute to a useful continuing record, not replace it |
| F-04 | The desired product is complete and complementary to existing platforms | Provide an end-to-end user journey and external sharing before requiring integrations |
| F-05 | Public launch includes bursaries, learnerships, apprenticeships, internships, graduate programmes and jobs | No category may be deferred simply to satisfy an older trade-only plan |
| F-06 | Persistent autonomous assistance is important, beyond a chat interface | Durable tasks, triggers, bounded authority and action history are core |
| F-07 | Interest extends from high school and school leaving through post-matric and later work | Include age-appropriate access; under-18 private/social participation has explicit readiness requirements |
| F-08 | First reachable communities are apprentice peers and school leavers | Recruit and observe these users first without declaring other categories unavailable |
| F-09 | Conversations have established expressed interest | No paid demand, active usage or successful outcomes are established by this fact |
| F-10 | Founder is in an apprenticeship and has limited current personal funding | Plan multiple capacity/funding scenarios; do not assume a full-time team |
| F-11 | Founder requests no arbitrary cap and delegates remaining judgement | Preserve the full feature portfolio; sequence delivery rather than promise everything simultaneously |
| F-12 | Founder wants to excel against competitors | Define fair, task-specific benchmarks; do not publish an unsupported overall superiority claim |
| F-13 | On 12 September the founder specified a 100% free consumer tier and prioritised TVET, SDF and employer-funded value | Remove applicant-paid subscriptions/assistance; validate institutional users, budget owners and procurement separately |
| F-14 | On 13 September the founder proposed launching opportunity browsing first, useful hot/discovery features and broader strategic research after the MVP | Prioritise discovery-first M0; detailed scope and ranking methods are delegated recommendations. Full career-platform ambition remains, while institutional discovery is no longer on the first-public-release critical path |
| F-15 | On 25 September the founder confirmed the hard infrastructure cost ceiling ($25 USD/mo) and single-operator review scope (DEP-02) | Enforce 50%/80%/100% budget alerts and kill-switch runbook; no unbudgeted cloud infrastructure or multi-tenant complexity in M0 |

## Recommended product decisions

Founder acceptance, 13 September 2026: document the complete companion discussion and corrected Gemini ideas under the [coverage register](06_DISCOVERY_STRATEGY_TRACEABILITY.md). Scraping/reviewed posting remain central; all six categories, both internship routes and broad job support remain. Accepted M0 additions include precise source checks, faithful explanations, browser-local progress, structured sharing and bounded public-link suggestions. Preserve the later social network and institutional roadmap. Detailed implementation choices and estimates remain planning recommendations until tested.

13 September sequencing: the [M0 launch specification](../product/03_DISCOVERY_FIRST_MVP.md) governs first-public-MVP scope. Discovery shelves, source-backed issuer pages and sharing precede full accounts, document handling and agents. Trending waits for genuine activity and abuse controls. Existing R0–R5 estimates require reforecast before representing M0 timing; no timeline or competitive superiority is confirmed.

| ID | Recommendation | Why / revisit trigger |
|---|---|---|
| D-01 | Core journey: discover, understand, prepare, review, apply externally, record outcome, continue | Demonstrates utility before employers join; revisit individual steps through observation |
| D-02 | One underlying record, different selected evidence packs, immutable application snapshots | Supports the original floating-CV idea without changing submitted history |
| D-03 | Private records by default; deliberate public career sharing | Trust and control are prerequisites for repeat use |
| D-04 | Requirements and relevance are separate | Missing evidence is not proof of ineligibility; ranking is not a success probability |
| D-05 | User-supplied opportunity links work alongside the public catalogue | Coverage need not be complete for the preparation product to help |
| D-06 | Structured help requests and invited groups precede an open social feed | Test whether other people resolve obstacles before investing in a broad content network |
| D-07 | A coordinator workflow shares the same records/tasks with limited permissions | Institutional value should reduce administration rather than create a second disconnected product |
| D-08 | Superseded by F-13: the entire consumer tier is free; organisations fund institutional workflows | No optional applicant-paid preparation or premium learner subscription in the current model |
| D-09 | The existing paid pilot is a parallel commercial experiment | Selling a service is not a requirement to browse the product or proof of SaaS demand |
| D-10 | Keep evidence provenance granular | Participation, practice, assessment, reference and official credential are different claims |
| D-11 | Programme onboarding, progress and exit records are a later connected extension | Retention should follow real needs after an award or placement |
| D-12 | RPL preparation is a later workflow with authorised assessors | Skilved organises evidence; it does not grant formal recognition independently |
| D-13 | Preserve assessed challenges and collaborative project credit | Require useful feedback and a recipient; avoid speculative badge collections |
| D-14 | General feeds, public rankings and national predictions need separate evidence gates | They cannot be justified by profile counts or a large scrape alone |
| D-15 | Keep personal exports and account continuity after leaving an institution | Product value must survive institutional transitions |

## Recommended engineering decisions

| ID | Recommendation | Status / review trigger |
|---|---|---|
| T-01 | Retain Next.js, TypeScript, Tailwind and the monorepo | Proposed continuation of existing implementation direction |
| T-02 | Google Cloud Run (africa-south1) for web; Cloud Run Jobs for workers | CONFIRMED / RECOMMENDED baseline in [DEP-02](../engineering/12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md); hard $25 USD/mo ceiling |
| T-03 | Firebase Auth with custom claims; Firestore Native in africa-south1 | CONFIRMED / RECOMMENDED in [DEP-02](../engineering/12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md); PostgreSQL evaluation scheduled for R3–R5 |
| T-04 | Logical agent roles do not require separate services | Split only for demonstrated workload, isolation or ownership needs |
| T-05 | Routine checks use deterministic code; AI handles bounded interpretation/drafting | Models must pass representative evaluation and preserve unknown values |
| T-06 | Source access is assessed individually | Public visibility and robots rules are not a reuse licence |
| T-07 | Prefer primary issuer facts, preserve all relevant discovery provenance | Aggregators remain leads rather than automatic authorities |
| T-08 | Use restartable tasks, atomic claims, idempotency and an outbox for external effects | Silence never manufactures an instruction to submit or share |
| T-09 | Authorised application adapters are conditional later extensions | All six categories work through genuine external routes without them |
| T-10 | Use ordinary filters first, add full-text/vector tools after measured need | No advanced search purchase is required solely by the hackathon diagram |
| T-11 | Retain monitoring, backups and access tests; defer unjustified infrastructure | Simplicity does not remove security responsibilities |
| T-12 | Preserve container portability, domain contracts and exports | Do not pay to maintain multiple cloud deployments before a business requirement exists |
| DEP-02 | Official hosting and runtime architecture: Cloud Run in africa-south1, Cloud Run Jobs via Scheduler, Firestore Native Mode, SSRF-bounded egress client, staging/prod isolation, expand-and-contract rollback | CONFIRMED (budget/residency/operator) / RECOMMENDED (topology/egress); full ADR in [12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md](../engineering/12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md) |

## Facts we do not yet know

| ID | Unknown | Working treatment | How to resolve |
|---|---|---|---|
| U-01 | Sustainable weekly hours | Show 10, 20 and 35 gross-hour scenarios; none is founder-confirmed | Two observed iterations |
| U-02 | New competition deadline | No new deadline assumed | Founder supplies event and rules if one exists |
| U-03 | Actual deployable budget, credits and expiry | Hard $25 USD/mo ceiling under DEP-02 with automated alerts and kill switch; no unbudgeted spend | Account/billing inventory without exposing secrets |
| U-04 | Committed collaborators | Solo ownership is the reference, staffing is conditional | Named role, availability and agreement |
| U-05 | First users' languages, devices, data costs and accessibility needs | Responsive, plain-language, low-data design; translation order remains unvalidated | Direct observation of first cohort |
| U-06 | Which problem users will repeatedly act on | Maintain retention hypotheses, do not force weekly engagement | Diary and task-based trials |
| U-07 | Paying customer and purchase authority | Funded programme coordinator is a candidate, not a confirmed buyer | Discovery, price presentation, payment/renewal |
| U-08 | School partner and safeguarding arrangements | Public browsing can precede under-18 private/social features | School/guardian process and tested safeguarding plan |
| U-09 | Authorised source/credential/API access | No external connection claimed | Source-specific agreements and working tests |
| U-10 | Existing live resources and users | Repository is a prototype baseline | Reproducible runtime audit and owned-account inventory |
| U-11 | Industry acceptance of evidence packs | Readable exports first; acceptance is measured | Named recipients use a real record |
| U-12 | Market growth, network effects and placement improvement | Hypotheses | Repeated, appropriately designed studies |
| U-13 | Installed institutional systems and remaining task gaps | Do not assume the B2B evidence market is empty; official and vendor descriptions show relevant alternatives | Observe actual workflows and accepted outputs using INV-01–18 in the strategic investigation register |

## Retired assumptions

- A fixed eight-week calendar with guaranteed Day 16 income, thousands of users or a specified revenue total.
- A fully staffed team and historical cloud payroll forecasts as current commitments.
- A fixed headline count of agents as a quality or autonomy measure.
- Universal autonomous applications, CAPTCHA bypass and zero approvals as launch requirements.
- Simulated verification, assumed government APIs, partner logos or geographical hosting as proof of compliance.
- A personal budget suggestion of R200/month as a founder-approved permanent project cap.
- A broad social network, national graph, public employer scores or automatic pricing as necessary on launch day.
- Owning a document vault or copying opportunities as a moat by itself.

## Change procedure

### ATS clarification — 12 September 2026

The founder requested a proper current treatment of the archived ATS strategy after reviewing its disposition. The [dedicated successor](../engineering/03_ATS_ADAPTER_STRATEGY.md) restores explicit adapter design, source tracing, platform/tenant capabilities, account boundaries, preflight, receipts, recovery and rollout criteria. Scraping aggregators discovers original issuer sources; application routing is a subsequent distinct step. This expands documentation without claiming implementation or reinstating unsupported coverage percentages, shared candidate accounts, CAPTCHA-bypass dependencies or automatic success labels. S26 remains conditional; an earlier supported slice requires a deliberate reprioritisation with its prerequisites and capacity accounted for.

### Hosting and runtime baseline (DEP-02) — 25 September 2026

Task B01c confirmed the official hosting and runtime decision record ([DEP-02](../engineering/12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md)). Google Cloud Run in `africa-south1` is confirmed over Vercel due to South African data residency (POPIA), local network latency (10–30 ms vs 140–200 ms), zero intra-region Firestore egress costs, and budget compliance within the hard $25 USD/month ceiling. Private workers run as Cloud Run Jobs with no public ingress. Operational data resides in Firestore Native Mode in `africa-south1`, with Cloud SQL (PostgreSQL) evaluated and scheduled for R3–R5 institutional expansion. Outbound crawling is governed by a bounded HTTP egress client enforcing Source Register allowlisting and strict SSRF defenses. Staging and production are strictly isolated across separate Google Cloud projects.

For each material change, record the decision ID, evidence, trade-off, affected requirements, release and owner. Update the roadmap and contracts together. Keep old experiments and rejected hypotheses dated rather than quietly rewriting their results. A target becomes an observed result only when the supporting evidence is linked.

See [interview and experiments](../research/19_FOUNDER_INTERVIEW_AND_EXPERIMENTS.md), [research register](../research/13_RESEARCH_AND_EVIDENCE.md) and [roadmap](../planning/15_BUILD_ROADMAP.md).
