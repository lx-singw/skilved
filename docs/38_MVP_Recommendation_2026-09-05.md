> Status note — 11 September 2026: Retain the September 5 proposal; subsequent founder direction and current decisions supersede conflicts. Current authority: [current documentation](current/governance/14_DECISIONS_AND_ASSUMPTIONS.md). [Preserved original](archive/2026-09-11-pre-strategy-refresh/docs/38_MVP_Recommendation_2026-09-05.md).

# Skilved MVP recommendation and original-document review

Date: 5 September 2026

Status: Proposed product and engineering scope after reviewing the founding documentation and current implementation. The founder has explicitly confirmed the six launch categories below. Other tradeoffs in this document are recommendations, not implemented functionality. This review does not certify production readiness.

## 1. Founder-confirmed launch scope

The first public release includes all of these opportunity categories:

1. Bursaries.
2. Learnerships.
3. Apprenticeships.
4. Internships, including clearly distinguished student/WIL and graduate internships.
5. Graduate programmes.
6. Jobs.

Keep these as distinct filters and records. Navigation may group them as **Study funding**, **Learning and work experience**, and **Jobs**, but must preserve the four individual programme types in the middle group.

This instruction replaces the older proposal to defer internships, graduate programmes, university bursaries or matric learnerships. It also replaces trade-only onboarding. Trades remain a useful acquisition and partnership segment; a finance graduate or matric bursary applicant must be able to use the first release without selecting an invented trade.

All six categories share the same product workflow. Limit the initial source catalogue and the depth of external integrations. Category availability must not depend on having an autonomous submission adapter for that category.

Trade tests, short courses, bridging courses and other existing roadmap items can remain supporting resources. They do not substitute for any of the six categories or require additional launch products. Gigs and business administration remain later work.

## 2. The MVP we are proposing

> Skilved finds relevant opportunities across study and work, helps you complete the steps needed to pursue them, and keeps your career evidence and progress connected.

The complete first user journey is:

**Discover → understand requirements → save or choose a goal → prepare missing items → review → apply through the available route → record what actually happened → follow the next step.**

The personal career record supplies reusable facts, documents and evidence throughout this journey. Users can carry it into their next institution or opportunity. Persistent agents monitor the journey and resume work when something changes.

The first release is useful before any employer joins Skilved: a person can discover a real externally published opportunity, prepare for it, apply at its actual destination and retain their progress. This reduces the initial dependence on recruiting both sides of a marketplace. It does not eliminate the separate need to prove employer acceptance, partner value or willingness to pay.

### Required user surfaces

| Surface | What must work in the MVP |
|---|---|
| Discover | Public mobile feed and details; six category filters; field/sector, location, study/work stage and closing date; actual source and application destination; saving and sharing. Browsing and the external application link require no account. |
| My next steps | Chosen goals, saved opportunities, current applications, missing items and dated next actions. A person can pursue study funding and work opportunities at the same time. |
| My record | Editable education, actual experience/projects, references and supporting documents; structured import reviewed by the user; useful CV/export and selectively shareable profile. |
| Opportunity workspace | Source-backed requirement checklist, fit explanation, unanswered questions, document selection, truthful drafts, direct application handoff and explicit progress states. |
| Agent activity | What the agent checked or prepared, what changed, what is waiting, relevant sources, notification preferences, pause and stop controls. Show completed actions only when they happened. |

An internal operations view must support source failures, uncertain listings, user reports, unresolved tasks and support. It is an operating tool rather than a public intelligence product.

## 3. One engine with category-specific requirements

Use a shared opportunity record with an explicit category and structured requirement blocks. Capture only conditions actually stated in the source; retain unknowns and ambiguity. The examples below are fields to support, not universal eligibility rules.

| Category | Additional facts to capture when specified | Typical preparation and outcome distinctions |
|---|---|---|
| Bursary | Study year/intake, subject marks, eligible fields and institutions, admission/enrolment, financial-need criteria, funding coverage, renewal and service obligations. | Academic results, admission proof, motivation and specifically requested financial evidence. Distinguish application, provisional award, acceptance and confirmed funding; do not call a bursary a job placement. |
| Learnership | Qualification/programme, entry requirements, employment-status criteria, provider/host, location, duration and stipend. | Requested school records, application materials and programme-specific evidence. Distinguish offer, accepted place, actual start and completion. |
| Apprenticeship | Trade, subject/technical entry requirements, workplace, training structure, selection stages and duration. | Requested qualifications, CV and existing practical evidence. Do not assume every applicant needs a completed trade test. |
| Internship | Student/WIL versus graduate route, discipline, current enrolment or completion date, practical-credit requirements, duration and stipend. | Institution letter or graduate records when requested. Record workplace start and academic-credit/completion outcomes separately. |
| Graduate programme | Eligible qualifications, graduation window, marks, experience limits, rotations, locations and assessments. | Transcript, CV, supporting statements and assessment preparation. Keep programme start distinct from ordinary job application activity. |
| Job | Role, contract, schedule, experience, licences, location/remote conditions and compensation. | Relevant CV, evidence and requested references. Distinguish offer, acceptance, start and continued employment. |

Schema decisions:

- Use canonical category identifiers consistently: `bursary`, `learnership`, `apprenticeship`, `internship`, `graduate_programme`, `job`. Normalize imported `graduate_program` and related aliases at ingestion.
- Keep category separate from field/discipline/sector and optional trade specialisation. Support school learners, people without completed qualifications, students, graduates and experienced workers.
- Separate current education, completed qualifications and employment status. Do not collapse these into a single NQF value or assume a degree supersedes every subject, licence or experience requirement.
- Support national, multiple-location, remote and unknown locations. Unknown does not mean Gauteng.
- Represent funding coverage separately from salary or stipend. Missing amounts remain unspecified.
- Requirements need mandatory/preferred/conditional status, source attribution, operators where applicable, and a value that can be unknown.
- Separate relevance ranking from requirement checks. Explain `appears to meet`, `known gap` and `needs confirmation`; do not present ranking as a probability of admission or hiring. Keep browsing available when facts are incomplete.
- Version listings and the information used for an application. A later listing change must not silently rewrite a past application record.

## 4. Agent disposition: retain responsibilities, simplify deployment

The founding documents use inconsistent numbering. `24_AI_Employees_Architecture.md` numbers roles 0–19, while Quality and Outcome Tracker also appear in the legacy architecture. Across these lists there are 22 distinct logical roles; Scout and Discovery refer to the same responsibility. Use canonical names instead of preserving the misleading headline count.

**Keep** means the responsibility belongs in the MVP. It does not mean another independently deployed service. **Simplify** means deliver the stated subset. **Defer** means retain the idea in the roadmap, outside the launch requirement.

| Original agent | Decision | MVP responsibility or condition for later introduction |
|---|---|---|
| Scout / Discovery | Keep | Scheduled discovery and refresh across all six categories from a maintained source catalogue. |
| Analyst | Keep | Extract category, actual organisation, requirements, benefits, deadline and application route with provenance. |
| Quality | Keep | Validate publication criteria; detect duplicates, expiry and suspicious/contradictory content; route uncertainty for review. Source checks are not a guarantee that an opportunity is safe. |
| Skills Profile | Keep | Build and update the personal record from actual user input and reviewed extraction. Preserve evidence and attribution. |
| Matching | Simplify | Explicit requirement checks followed by preference ranking and understandable reasons. Defer learned cohort models and success probabilities. |
| Career | Keep | Persist goals and actionable next steps; explain evidence gaps; revise plans when the user or relevant opportunities change. Require relevant facts, not an arbitrary profile percentage. |
| Application | Simplify | Prepare selected applications, manage missing items and drafts, produce reusable packs, hand off to external destinations and preserve progress. Broad automatic submission is deferred. |
| Document Verification | Simplify | Document organisation, presence, readability/consistency checks, expiry and application-specific readiness. Issuer verification only where an actual authorised process exists. |
| Notification | Keep | Opted-in useful matches, deadlines and material progress; frequency controls, deduplication and immediate pause/stop. |
| Outcome Tracker | Keep | Record submission evidence, decisions, starts and later progress with the reporting source. Use category-appropriate outcomes. |
| Customer Success | Simplify | Contextual support inside the main assistant, account help and an operator escalation route. No extra persona or autonomous support promise. |
| Interview Coordination | Simplify | Track interviews/assessments, prepare from known requirements and remind the user. Defer autonomous negotiation with recruiters. |
| Scope Expansion | Simplify | Internal coverage report and suggested source additions. Human review of new source access and extraction quality. |
| Growth | Simplify | Shareable listings/records, referral attribution, search-friendly pages and assisted editorial drafts. Founder-operated distribution; no automatic posting to users' groups. |
| Career Simulation | Defer standalone engine | Later add comparisons based on documented requirements and current inventory within Career. Salary and placement forecasts require suitable evidence. |
| Revenue | Defer autonomous agent | Test a clear paid provider pilot; basic invoicing/billing can be ordinary software. No autonomous pricing or subscription changes. |
| Reputation | Defer scoring | Keep attributed references now. Revisit any scoring only with a defined purpose, evidence and correction process. |
| Credential Issuance | Defer | Retain external credentials and confirmed evidence now. Formal issuance needs an identified issuer, assessment criteria and recipient use. |
| Skills Pulse | Defer public product | Keep internal listing/source counts. Observed platform inventory cannot establish national skills demand or supply. |
| Employer Accountability | Defer public grades | Keep sourced organisation details and report/correction channels. Public grades need representative evidence and dispute handling. |
| Collective Intelligence | Defer | Record well-defined outcomes now. Introduce cohort insights only after useful, adequately supported data exists. |
| Gig | Defer | Marketplace, quoting, invoicing and collections constitute additional workflows. Users can still record real gig experience. |

Initial logical groups:

1. **Opportunity pipeline:** Scout, Analyst and Quality.
2. **Personal career work:** Skills Profile, Matching, Career, Application and document-readiness functions.
3. **Follow-up:** Notification, Outcome Tracker and simple interview/assessment reminders.
4. **Operations:** support, coverage, reports and editorial assistance.

A web application/API and background worker can host these modules initially. Keep clear contracts so services can split when actual throughput, isolation or operating requirements justify it. Retain useful existing infrastructure; avoid a rewrite solely to change cloud products. Do not require every planned analytics/cache/AI service to finish the first user journey.

### What makes this genuinely persistent agent work

An agent can continue a permitted task without the user reopening a chat. It must have:

- A durable goal/task record, owner, next action and relevant source/document versions.
- Triggers such as a new listing, approaching deadline, changed requirement, updated user fact or received confirmation.
- Explicit states including queued, running, waiting for user, waiting for recipient, ready, completed, failed and stopped.
- Retry limits, idempotency, notification coordination, cost limits and recovery after restart.
- An action-specific mandate with scope, expiry where relevant, and a revocation mechanism.
- A record of what was attempted, what succeeded and what still needs attention.

Example: a user saves a bursary, asks Skilved to help prepare, supplies a missing result later, and receives a newly prepared checklist/draft when the task resumes. The system can also flag a changed closing date. These are meaningful autonomous actions even when final submission occurs on the bursary provider's portal.

Routine filtering, dates, deduplication and status transitions should use ordinary validated code where sufficient. Reserve model calls for tasks needing interpretation or drafting.

## 5. Application automation and truthful evidence

The MVP supports preparation and external application handoff for every category. A specific approved API or email route may be added after it works reliably; such an adapter does not gate the availability of the other categories.

Broad ATS automation, shared applicant accounts and generic CAPTCHA-solving are outside the MVP. Preserve the adapter interface and useful detection helpers for later individually supported routes.

User review and prior mandates must be represented honestly. Resolve the older four-hour versus 24-hour silence rules by making silence leave a request pending or expire it; silence does not create permission. Record an existing specific standing mandate separately when an action is legitimately covered by it. Application consent does not authorise unrelated marketing posts, new purchases or unrelated document sharing.

Do not force `human_approvals_required: 0`. Record actual confirmations, standing authorisation, operator intervention, blocked tasks and completed actions.

Application events must distinguish:

`saved → preparing → ready → opened_external → submission_reported / submission_acknowledged → subsequent decision or next step`

This is an event model, not a mandatory linear chain: users can apply elsewhere, withdraw, receive an assessment invitation or report an outcome at different stages. Keep method, reporting party, evidence and timestamps. A click is not a submitted application; email delivery is not selection; an offer is not a start; silence is not rejection.

Documents and evidence must distinguish self-reported information, user-reviewed extraction, an attributed confirmation, and an actual issuer check. Record who checked what, how and when. Readability, ID-format checks, profile completeness and application activity cannot confer official verification or demonstrated competence.

Keep private document storage, access control, deletion/export and deliberate sharing as launch requirements. Request documents when relevant to a chosen purpose. Public profiles should expose only chosen career information; personal IDs, financial records and private academic documents do not become public through profile completion. School users need an age-appropriate data and sharing flow before personal-data features are released to them.

## 6. Source coverage and the initial chicken-and-egg strategy

Use public opportunity discovery to provide immediate consumer value. The three aggregators already proposed in the docs can remain discovery candidates: PuffAndPass, RecentJobs and StudentRoom. Their current access, extraction quality and usable inventory still need validation. Add a bounded set of opportunity-holder career/funding pages and authorised feeds to fill category gaps.

1. Maintain a source register: categories covered, opportunity holder, discovery URL, actual application destination, access method, update frequency and owner.
2. Prefer confirming the current intake and requirements against the organisation's own notice or authorised publication. Preserve aggregator provenance rather than treating the aggregator as the employer.
3. Store `firstSeenAt`, source publication date if known, `lastCheckedAt`, open-status confirmation and deadline certainty separately. A recently discovered old notice is not a new opportunity.
4. Deduplicate with organisation, reference, intake/year, category and location; keep source aliases. Do not merge distinct intakes based only on a matching title.
5. Recheck listings as deadlines approach. Remove or clearly mark closed, withdrawn and stale records. Handle unknown closing dates without inventing dates or silently assuming the listing remains open forever.
6. Track live inventory and failures per category. Overall volume must not hide empty bursary, internship or graduate sections.

Retain the founding plan's 200-listing goal as a planning target, not a claim about existing inventory. An initial operating target is at least 15 current usable listings per category across five opportunity holders. These are proposed product targets, not market estimates; seasonal supply may require revisiting the targets and showing honest limited availability. Never fill a quota with stale or fabricated listings.

All six categories must have working discovery, preparation and tracking at public launch. Pilot testing should include actual users with different study/work stages, including a bursary applicant, matric learnership seeker, apprentice seeker, student/WIL intern, graduate-programme applicant and jobseeker. Measure whether they find plausible options, not just whether six filter labels render.

Sharing should lead to an immediately useful listing without a signup wall. Account creation adds saved work, personal reminders and a reusable record. Growth can come from a useful opportunity being shared, a learner inviting a referee for a specific confirmation, and a programme bringing a cohort. None of these loops requires automatic group posting.

## 7. Complementary partners and the first revenue test

Build consumer value independently while testing one small provider workflow with a funded programme. The provider can invite a cohort, see consented progress, request a missing item, receive an attributed supervisor confirmation and export a reviewed report. Avoid a full LMS, employer ATS or SETA management portal in the first release.

The minimum provider workflow reuses existing learner records, tasks and outcome events. Keep organisation permissions separate from a learner's private record. A partner does not receive every document by default, and a learner keeps their record after the programme.

Proposed paid pilot offer:

> We help your programme resolve incomplete learner records, coordinate confirmations and prepare reviewed evidence and progress reports, with less manual follow-up.

Test a defined cohort/service fee and measure the labour, infrastructure and messaging cost of delivery. Do not assume the worker-premium prices, Day 16 revenue or eight-week revenue targets in the founding documents are validated.

Relevant independently checked partner routes from the preceding research:

- [SA Youth developer portal](https://developers.sayouth.org.za/): explicit APIs and webhooks for supported opportunity/recruitment workflows. Integration requires its terms and available functionality; it is not a source of automatic endorsement or permission to resell profile access.
- [YES implementation partner contact](https://www.yes4youth.co.za/contact-us): a hosting/delivery route. Initially investigate a specific service for an existing partner; YES already supplies monitoring tools.
- [Accredible partner programme](https://www.accredible.com/partnerships): possible complementary technology/credential integration, when a real customer needs it.
- [MyMzansi roadmap](https://www.mymzansi.gov.za/static/resources/MyMzansi_Roadmap_Final_2025.pdf): future authorised official credentials can complement the service. Government access is not an MVP dependency.

These are potential relationships, not Skilved partnerships. No outreach, registration or integration was performed in this review.

## 8. What the current repository actually contributes

Static inspection found useful UI and helpers, plus significant unfinished or simulated behaviour. No build, runtime integration or production test was performed for this review.

| Finding | Evidence | MVP consequence |
|---|---|---|
| Useful feed, filter, share and profile UI exists. The visible feed reads local sample data. | `apps/web/src/app/(feed)/page.tsx:15`; `apps/web/src/lib/opportunities.ts:4`; `apps/web/src/components/feed/FeedClient.tsx:131` | Preserve the presentation and connect it to real persisted listings. |
| Both opportunity enums omit internships and graduate programmes. Frontend and backend also use different field names and identifiers. | `packages/types/src/opportunity.ts:3`; `apps/web/src/constants/opportunityTypes.ts:1`; `apps/web/src/types/opportunity.ts:16` | Establish one contract/normalization boundary before adding sources. |
| Scout and Analyst default types other than apprenticeship/learnership to job, with unsupported fallback facts. | `apps/agents/scout/src/runner.ts:60`; `apps/agents/analyst/src/extractor.ts:54` | Correct classification and preserve unknown organisation, location and eligibility fields. |
| Profile storage is an in-memory demo user; important auth/apply/save/notification routes are placeholders. | `apps/web/src/app/api/profile/route.ts:4`; `apps/web/src/lib/profiles.ts:173`; `apps/web/src/app/api/agent-apply/route.ts:2` | Implement authenticated ownership, persistent records and actual tasks before claiming agent execution. |
| Several API imports resolve to nonexistent paths on static inspection. | `apps/web/src/app/api/opportunities/route.ts:2`; `apps/web/src/app/api/passport/upload-cv/route.ts:2`; `apps/web/src/app/api/documents/verify/route.ts:2` | Repair package boundaries and establish a running build. |
| Verification returns hardcoded SAQA/NAMB success; profile parsing inserts fixed skills and an employer. | `apps/agents/document-verification/src/verifier.ts:33`; `apps/agents/skills-profile/src/builder.ts:49` and `:89` | Remove simulated trust and fabricated experience from any user-facing path before release. |
| Pre-flight assumes a CV file exists; matching does not adequately separate mandatory eligibility. | `apps/agents/application/src/pre-flight.ts:23`; `apps/agents/matching/src/matcher.ts:19` | Check actual owned files and each opportunity's requirements; do not let a ranking score bypass a known gap. |

The scores and implementation claims in `37_Architecture_Audit_Report.md` should be treated as an earlier architectural opinion, not evidence that the proposed services, security controls or integrations are operational.

## 9. Build order and acceptance gates

Use milestones rather than preserving the missed competition's eight-week assumptions. Estimate delivery after the repository builds and the first real source-to-feed path runs.

| Milestone | Work | Acceptance evidence |
|---|---|---|
| A. Shared contract and working foundation | Six categories, category-specific requirements, consistent IDs, repaired imports, real persistence, authenticated ownership and basic operating logs. | Build passes; distinct users cannot access each other's private records; contract fixtures cover all six categories and unknown values. |
| B. Real discovery for all six | Supported sources, extraction, review, deduplication, refresh, expiry, feed and application destinations. | Inspect current real listings in every category; verify source attribution, category, intake and destination; expired and duplicate cases behave correctly. |
| C. Reusable record and preparation | User-reviewed import, editable evidence, controlled sharing/export, saved opportunities, requirement checks, missing-item tasks and drafts. | Users in each category can prepare an actual application with no invented claims. Check a school applicant and a graduate can onboard without trade-only assumptions. |
| D. Persistent assistance | Durable tasks, schedule/event triggers, coordinated reminders, resume on new information, pause/stop and truthful activity history. | A saved task resumes after a required update, survives restart, does not duplicate notifications and stops when revoked. |
| E. Application and outcome continuity | External handoff, submission evidence, assessments/interviews, category-appropriate decisions and follow-up. | Demonstrate the full journey in every category; an external click cannot count as submission or placement; unknown outcomes remain unknown. |
| F. Provider pilot and revenue test | One cohort view, confirmation/request workflow, permissioned progress export and defined paid service. | Measure staff time, corrections, response times, recipient use and delivery cost; record actual payment/renewal separately from interest. |

Milestones A–E define the consumer MVP. A small provider discovery/pilot can run alongside them; an enterprise contract is not a prerequisite for public discovery. F tests the commercial complement without expanding into a full institutional suite.

Track the following separately for each category:

- Current usable inventory, stale/incorrect listings and source failures.
- Discover-to-save, save-to-prepared and prepared-to-reported/acknowledged submission.
- Users completing useful next steps and returning to resume work.
- Reminder delivery, duplicate actions, task failures and operator time.
- Awards, starts and sustained outcomes with evidence/source and observation windows.
- Provider cost savings, actual payments, renewals and Skilved's cost to serve.

Activity counts, profile completeness, application volume and registrations alone do not prove employability, hiring success or business viability.

## 10. Founding-document decisions and reconciliation map

| Existing document | Keep | Revise or move later |
|---|---|---|
| `01_MVP_Scope.md` | Feed, career record, agent assistance, mobile sharing and outcomes. | Replace trade-only/six-old-type scope and competition-driven launch gates; remove national intelligence and broad ATS requirements from MVP. |
| `02_PRD.md` | FR-01–03 discovery/preparation, optional signup, editable record, notifications, pre-flight, review and outcomes. | Add all six types; replace unsupported match/verification claims, percentage gates and submission counts; align new acceptance gates. |
| `03_Feed_Development_Plan.md` | Open details, mobile filters, source links, freshness, sharing. | Add internship/graduate filters; separate field from trade, funding from salary and discovery time from last confirmation; defer employer/cohort scores. |
| `06_Agent_Architecture.md` and `24_AI_Employees_Architecture.md` | Pipeline separation, scheduling, responsibilities and error recovery. | Canonical role names, four logical groups, durable tasks and actual permission/action logs; remove mandatory autonomous-everything claims. |
| `07_Go_To_Market.md` | Useful shares, community acquisition and programme relationships. | Category-specific landing pages and messaging; distinguish free consumer access from the paid provider service; treat adoption/revenue numbers as hypotheses. |
| `08_Post_MVP_Future_Plans.md` | Long-term institutional, reputation, credential and business ambitions. | Keep deferred capabilities here, with evidence-based entry conditions. All six opportunity categories move out of the deferred list. |
| `09_Financial_Model.md` | Cost and revenue categories to investigate. | Replace fixed early revenue and worker-premium assumptions with paid-pilot evidence, actual delivery costs and scenarios. |
| `14_Data_Models_Schema.md` and `15_API_Reference.md` | Shared record and event concepts. | Category requirements, source/version metadata, application states, ownership, consent, task records and normalised API/UI contracts. |
| `20_Sprint_Plan.md` | Dependency-aware ordering and review gates. | Replace the old eight-week/XPRIZE critical path with milestones A–F. |
| `26_Worker_Permission_Model.md` | Gradual delegation, revocation and user control. | Replace contradictory Level 3/4 rules with action-specific mandates; remove forced zero-approval logging and unrelated automated sharing. |
| `27` / `28` / `30` / `32` intelligence documents | Future questions worth answering and needed event definitions. | Defer public national dashboards, salary predictions, employer grades and cohort predictions. |
| `29_ATS_Adapter_Strategy.md` | Adapter boundary, supported-route detection and failure handling. | Make universal coverage and forever-working adapters unproven assumptions; defer broad browser submission. |
| `31_Micro_Credential_System.md` | Attributable records of genuine achievements. | Remove claims that profile completion, application counts or invitations establish verified skills or readiness. |
| `33_Document_Vault.md` and `35_Security_Architecture.md` | Private files, access controls, sharing history, export/deletion and application-specific requirements. | Distinguish storage, content checks and actual issuer verification. Validate provider capabilities and controls; do not assume implementation from an architecture diagram. |
| `34_MyMzansi_Integration.md` | Long-term authorised interoperability. | Remove launch dependency and any claim of an existing Skilved integration. |
| `36_Scope_Expansion_Strategy.md` | Extensible sectors, institutions and record structure. | All six launch categories now; later phases expand source coverage, integration depth, countries and additional workflows. |
| `00_INDEX.md`, root `CLAUDE.md`, README and pitch materials | Mission and navigation. | Reconcile wording, agent count, launch categories and implemented-versus-planned claims after adopting this recommendation. |
| `docs/agents/*.md` | Potential location for concise capability contracts. | Currently empty; populate only for responsibilities being implemented, linking to the canonical scope. |

Key traceable conflicts found during review:

- `01_MVP_Scope.md:300` lists trade tests/short courses but omits internships/graduate programmes; `02_PRD.md:745` defers the latter; `36_Scope_Expansion_Strategy.md:81` postpones broader audiences.
- `scout_portal_sources.md:94` already describes internship/graduate extraction, conflicting with downstream schemas and filters.
- `02_PRD.md:248` requires 50 sources per cycle while `36_Scope_Expansion_Strategy.md:161` specifies three initial aggregators.
- `26_Worker_Permission_Model.md:139` and `24_AI_Employees_Architecture.md:118` differ on Level 3 review; the latter uses 24 hours at line 119 and four hours at line 150 for Level 4 silence.
- `24_AI_Employees_Architecture.md:157` requires zero approval logging despite describing explicit confirmation.
- `33_Document_Vault.md:67` assumes qualification-register access verifies a person's achievement; no actual issuer integration was established by this code review.

The recommendation preserves the founder's broad opportunity launch, portable record and persistent agents. It defines a complete first workflow and leaves the larger ecosystem products available for expansion when usage, evidence and customers justify them.
