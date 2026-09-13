# Skilved product requirements

13 September accepted companion subcriteria: use [DCF-01–24](../quality/02_DISCOVERY_COMPANION_ACCEPTANCE.md) and the updated [M0-A–G scope](03_DISCOVERY_FIRST_MVP.md) for source checks, faithful explanations, browser-local progress, sharing and reviewed public-link intake. PRD-006's M0 suggestion route is distinct from its later signed-in private preparation route. IDs below remain the 64 expanded requirement families; M0 subcriteria neither renumber them nor mark them complete.

Date: 11 September 2026  
Status: Build specification and acceptance targets; not a claim of delivered functionality.  
Owner: Founder / product owner.  
Dependencies: [strategy](01_PRODUCT_STRATEGY.md), [data contracts](../engineering/07_DATA_AND_API_CONTRACTS.md), [release validation](../quality/11_VALIDATION_AND_RELEASE.md).

## 1. Reading this specification

Requirement identifiers remain stable even if a release moves. R0–R5 describe the expanded capability portfolio. The 13 September [M0 discovery-first specification](03_DISCOVERY_FIRST_MVP.md) now defines first-public-MVP acceptance and explicitly maps its slices to these requirement families. M0 is a bounded subset, not completion of every referenced requirement or all R0–R2 work.

An acceptance result requires a recorded test, observation or reviewed artefact against a named build. A checkbox without evidence is not completion.

R1 establishes the supervised expanded journey; R2 delivers the expanded public career product across all six categories. M0 launches public discovery earlier with the controls appropriate to its exposed features. Requirements marked R2 may have bounded slices delivered at M0; their remaining acceptance criteria still apply before full release.

Unknown information must remain unknown. Illustrative people, opportunities, achievements and outcomes must be unmistakably labelled and isolated from production.

The public product works without a partner account. Partner workflows add value around that independent experience.

## 2. Core requirements register

| ID | Release | Requirement | Observable acceptance |
|---|---|---|---|
| PRD-001 | R1 → R2 | Open opportunity browsing | A signed-out person can read relevant details, source and external application route without creating an account. |
| PRD-002 | R0 → R2 | Six distinct opportunity categories | Shared API, database, extraction and UI fixtures distinguish bursary, learnership, apprenticeship, internship, graduate programme and job; each completes the R2 journey. |
| PRD-003 | R1 | Source provenance and freshness | Every published listing identifies the opportunity holder, original/discovery sources, check time and deadline uncertainty. |
| PRD-004 | R1 | Source-linked requirements | A reviewer can trace each material extracted condition to the source version; unstated conditions remain unspecified. |
| PRD-005 | R2 | Changes, duplicates and closure | Distinct intakes remain distinct; source aliases merge appropriately; changed or expired listings update without rewriting earlier application snapshots. |
| PRD-006 | R1 | Bring an external opportunity | A user can save a permitted external link or enter facts manually for private preparation; this does not automatically publish a listing. |
| PRD-007 | R2 | Relevant search and filters | Users can combine category, field, location, stage and dates; missing salary/funding does not wrongly exclude an otherwise relevant result. |
| PRD-008 | R2 | Honest empty and uncertain states | Empty categories show limited availability and possible next actions; no fabricated records or invented eligibility fill the gap. |
| PRD-009 | R1 | Listing correction and reporting | A report enters an operator queue with listing version, category and reason; the user receives an appropriate status without exposing reporter identity. |
| PRD-010 | R1 | Multiple career goals | One user can pursue funding and work concurrently, pause either, and see which tasks belong to which goal. |
| PRD-011 | R1 | Actionable next steps | A chosen opportunity produces editable tasks with reason, owner, status and relevant date; the user can reject irrelevant suggestions. |
| PRD-012 | R2 | Durable agent continuation | A task survives restart, resumes after a relevant update and preserves its prior source/document versions. |
| PRD-013 | R1 → R2 | Action-specific permission and stop | Pausing or revoking a mandate prevents subsequent covered actions; pending requests cannot become approved through silence. |
| PRD-014 | R2 | Duplicate prevention and recovery | Retrying after a simulated timeout does not duplicate an externally visible action; uncertain delivery stays uncertain until reconciled. |
| PRD-015 | R2 | Useful notification controls | Users choose channels/frequency, pause reminders and receive material changes once; quiet hours and delivery failures are handled. |
| PRD-016 | R1 | Truthful agent activity | Users can distinguish proposed, attempted, completed, failed and waiting actions and inspect their sources. |
| PRD-017 | R1 | Living personal record | Users edit education, actual experience, projects and goals without choosing a trade or inventing an employer. |
| PRD-018 | R2 | Reviewed import | Imported text is presented for correction with confidence/uncertainty; fabricated skills or credentials are absent from the accepted record. |
| PRD-019 | R1 → R3 | Attributed evidence | Each item identifies its origin, activity, artefact, date and any reviewer; self-report and assessed evidence render differently. |
| PRD-020 | R2 | Selective sharing | An owner previews exactly what a recipient can see, selects scope/expiry and revokes future access; recipient viewing need not require a Skilved account. |
| PRD-021 | R2 | Useful export | Users obtain human-readable career output and a structured record export, with provenance; core access to their own data does not require a subscription. |
| PRD-022 | R2 | Deletion and departure | A tested request removes or schedules owned data according to documented retention rules; retained exceptions are explained. |
| PRD-023 | R2 | Purposeful private documents | A requested document has an application/purpose; malware/file checks and access rules prevent unrelated users or public links from reading originals. |
| PRD-024 | R0 → R2 | Enforced ownership and roles | Cross-user and cross-organisation attempts fail at the server/storage boundary, including direct URL and expired-share tests. |
| PRD-025 | R1 → R2 | Truthful drafting | A generated CV or statement uses approved facts; unsupported suggestions are separated and cannot silently become claims. |
| PRD-026 | R1 | Application readiness checklist | Missing, present, needs review and not applicable are distinct; a present file cannot automatically count as valid or verified. |
| PRD-027 | R2 | Explainable fit and uncertainty | Mandatory, preferred and conditional criteria are separated; relevance score cannot override a known requirement gap or become admission probability. |
| PRD-028 | R1 | External application handoff | Users reach the actual application destination and retain prepared work; no arbitrary form submission is implied. |
| PRD-029 | R1 | Truthful application states | Opening a link cannot count as submission; reported/acknowledged submission and later decisions retain actor, evidence and timestamps. |
| PRD-030 | R2 | Application snapshot | A user can recover the reviewed information and selected documents associated with an application even after their general record changes. |
| PRD-031 | R2 | Assessment/interview preparation | Dates, preparation tasks and source-linked prompts can be recorded; no attendance or pass is inferred from an invitation. |
| PRD-032 | R2 | Category-specific outcomes | Funding, offers, acceptance, starts and completion are separate and use the appropriate category vocabulary. |
| PRD-033 | R3 | Progress after starting | A participant can change their active goal to onboarding/learning and suppress irrelevant application reminders. |
| PRD-034 | R1 design; R2+ gated | School and under-18 pathway | Public discovery remains available; private participation is released only after the age-appropriate consent, supervision, contact and escalation flow passes review. |
| PRD-035 | R1 → R2 | Accessible core journey | Keyboard and screen-reader review covers discovery, forms, errors, task changes and sharing; labels, focus and non-colour status cues work. |
| PRD-036 | R2 | Constrained-device use | Core pages work on the declared reference phone/network, text remains usable without autoplay media, and interrupted edits recover safely. |
| PRD-037 | R0 → R2 | Authentication and recovery | Login, logout, recovery and account ownership behave correctly, including shared-device and expired-session cases. |
| PRD-038 | R2 | Privacy controls understood by users | A usability participant can identify what is private, what is shared and how to revoke; the UI does not default sensitive evidence into public view. |
| PRD-039 | R1 | Operational quality queue | Uncertain extraction, sources, reports and tasks reach named review queues with severity and next owner. |
| PRD-040 | R1 → R2 | Support and escalation | A user can report a problem; published service availability matches actual staffing; unresolved serious incidents have an escalation owner. |
| PRD-041 | R1 → R2 | Meaningful progress measurement | Events distinguish attempted/completed work and stages; reports show denominator, observation window and missing outcomes. |
| PRD-042 | R0 → R2 | Resource visibility and controls | A named workload's model, storage, compute and messaging use can be reconciled; retries and abusive use cannot run without bounds. |
| PRD-043 | R3 | Purposeful private groups | Invitations, membership, roles, removal and closure work; group membership never grants blanket access to private career documents. |
| PRD-044 | R3 | Structured help requests | A request has topic, desired outcome, audience and status; a helper can accept, decline, respond or escalate without false resolution. |
| PRD-045 | R3 | Contextual feedback | Feedback attaches to a specific version of work, records reviewer relationship and remains correctable through a visible process. |
| PRD-046 | R3 | Referrals with context | The user approves a minimal handover; the receiving service accepts, declines or remains pending; sending is not counted as help delivered. |
| PRD-047 | R3 | Assessed-project pilot | A project has a published brief, permitted assistance, rubric, submission and feedback; participation does not masquerade as accreditation. |
| PRD-048 | R3 → R4 | Assessment provenance | Reviewer identity/role, rubric version, evidence and assessment date are inspectable; reassessment creates a new version. |
| PRD-049 | R3 | Correction and dispute | Users can contest erroneous evidence or feedback; disputed status and resolution history remain visible to authorised parties. |
| PRD-050 | R3 | Coordinator workspace | A coordinator sees only consented cohort information and unresolved tasks; exports cannot expose unrelated users or fields. |
| PRD-051 | R4 | Institutional receipt | A real recipient can review a selected record, identify missing information and record acceptance for a named purpose. |
| PRD-052 | R4 | Programme lifecycle | Agreed milestones, check-ins, barriers and completion evidence follow an enrolled participant without treating absence of a reply as dropout. |
| PRD-053 | R4 | Funding/credential renewal | Confirmed renewal requirements and expiry dates create useful tasks; the system preserves uncertainty when rules change. |
| PRD-054 | R4 | RPL preparation | A provider-specified evidence map, gap plan and submission pack support review; the provider's decision is attributed and never replaced by an AI qualification claim. |
| PRD-055 | R4 | Supported credential exchange | A named authorised issuer/recipient workflow passes interoperability and verification tests; format validity and issuer trust are distinguished. |
| PRD-056 | R5 | Responsible cohort insight | Published measures pass evidence, privacy and sample-appropriateness review and disclose platform coverage and missingness. |
| PRD-057 | R5 | Bounded career comparisons | Source-backed route comparisons distinguish descriptive evidence from predictions; unsupported causal salary promises are absent. |
| PRD-058 | R5 conditional | Employer outcome information | A defined methodology, appropriate evidence, correction and appeal process pass independent review before any comparative public score. |
| PRD-059 | R5 conditional | Country expansion | A target country's sources, terminology, relevant rules, language, support and recipient workflows pass a local launch checklist. |
| PRD-060 | R3–R5 conditional | Partner/public-infrastructure integration | Access, terms and purpose are confirmed; a tested fallback preserves the consumer journey when the external system is unavailable. |
| PRD-061 | R4–R5 conditional | External API access | A contracted consumer uses scoped access with audit, revocation and deletion propagation; no public unrestricted personal-data endpoint. |
| PRD-062 | R2 policy | Free consumer tier and transparent institutional pricing | Consumer access, matching, preparation, applications assistance and own-record export have no learner subscription, upgrade or transaction charge; fair-use controls cannot turn into payment demands. Organisation buyers see price/scope before commitment; institutional payment does not buy unrestricted learner data. |
| PRD-063 | R3+ conditional | Paid placements remain distinguishable | Any sponsored listing is labelled and cannot bypass source checks, falsify fit or purchase a higher trust assessment. |
| PRD-064 | R3; before social release | Social safety operations | Reporting, blocking, helper impersonation handling and moderator escalation are tested before private contact or user-generated group content opens. |

## 3. Category workflows and acceptance fixtures

Each category must support discovery, reviewed requirements, preparation, external handoff and honest outcomes. The fixtures below specify relevant variations, not universal eligibility rules.

### Bursaries

- Capture study year/intake, eligible fields, institution rules, marks, financial-need conditions, funding coverage, renewal and service obligations only where stated.
- Support a school learner awaiting final results and a continuing student applying for renewal; provisional documents remain provisional.
- Separate tuition, accommodation, books, allowance and unspecified coverage instead of treating all funding as salary.
- Checklist items may include results, admission evidence, motivation and requested financial evidence; do not request the full set by default.
- Preserve application, provisional award, accepted award, confirmed funding, disbursement report and renewal as separate events.
- Acceptance fixture: a user preparing an award application with pending admission sees the conditional requirement and can retain a draft without a false eligibility claim.
- Evidence that funding was awarded does not imply registration, receipt of money or graduation.

### Learnerships

- Capture programme/qualification, provider, workplace/host, entry requirements, employment-status rules, location, duration and stated stipend.
- Explain the relationship between learning and workplace components from the source; do not assume every programme follows identical terms.
- Let users confirm requested documents while leaving ambiguous conditions for the provider.
- Record assessment invitations separately from offers and contracts.
- Follow accepted offer, actual start, progress and completion as distinct events.
- Acceptance fixture: a listing for unemployed applicants does not automatically reject a user whose employment status is unknown; it requests confirmation.
- A listing found on a SETA-related site is not evidence that the SETA has partnered with Skilved.

### Apprenticeships

- Capture trade, school/technical subject requirements, workplace, selection stages and stated training duration.
- Support applicants who have school results but no completed trade qualification; a trade test is not assumed to be an entry requirement.
- Reuse relevant actual practical work and supervisor feedback without implying licensing or independent competence.
- Separate interview, practical assessment, offer, workplace start, learning milestones and later assessment eligibility.
- Allow programme-related evidence once accepted without requiring continued job searching.
- Acceptance fixture: an apprentice applicant with a relevant project can include it as self-reported work, with supervision identified.
- Safety-critical trade evidence must not encourage unsupervised practical tasks outside legitimate training arrangements.

### Internships

- Explicitly distinguish student/WIL routes from graduate internships.
- Capture discipline, enrolment/completion window, required practical credits, institution letters, host, duration and remuneration if stated.
- Let users identify an institution requirement while marking unconfirmed host acceptance.
- Separate host offer, academic approval, workplace start and credit/completion outcome.
- Reuse work samples with any employer confidentiality restrictions respected.
- Acceptance fixture: a student needing WIL cannot be represented as a graduate simply to pass a matching rule.
- Institutional credit is recorded from the institution's evidence, not inferred from hours entered by the user.

### Graduate programmes

- Capture eligible qualifications, graduation window, marks, experience limits, rotations, locations and assessment stages.
- Support final-year applicants where the issuer permits them; completion status remains explicit.
- Keep rotations and programme milestones separate from ordinary job contract fields.
- Prepare assessments using lawful, public material and the user's work; do not expose confidential tests or fabricate experience.
- Record conditional offer, confirmed acceptance and actual start independently.
- Acceptance fixture: a user outside a stated graduation window sees a known gap, while a missing window stays unspecified.
- One graduate programme can appear in multiple locations without duplicate application counts.

### Jobs

- Capture role, employment/contract type, schedule, location/remote conditions, experience, required licences and stated compensation.
- Distinguish salary, commission, piecework and unknown remuneration when the source does.
- Explain required and preferred qualifications without assuming a higher qualification replaces a licence or experience requirement.
- Retain user-selected CV and evidence versions for each application.
- Record offer, acceptance, start and continued employment with source and date.
- Acceptance fixture: an external application click remains an opened destination until the user or a supported recipient supplies submission evidence.
- A job seeker can record an application made outside Skilved and still receive relevant preparation or follow-through support.

## 4. Evidence record semantics

Facts and files are different entities. A person may state a qualification, attach a document, receive a review and later obtain issuer confirmation; each step remains distinguishable.

Suggested evidence classes are self-reported, user-reviewed extraction, attributed observation, rubric-assessed work and issuer-issued credential.

There is no generic trust score that promotes a complete profile into an officially verified person.

Public sharing may include selected projects or a chosen career summary. Original identity, financial and academic files remain private unless deliberately shared for a specific purpose.

Recipients should be able to understand the evidence without becoming paying Skilved users. Accountless viewing must still respect access scope and risk controls.

A share revocation prevents future platform access; do not promise that a recipient's already downloaded copy can be technically recalled.

## 5. Accessibility and first-use acceptance

Use plain English initially as a planning assumption; validate launch language priorities with the reachable users.

The accessibility objective is WCAG 2.2 AA for relevant web journeys, with practical keyboard/screen-reader and user testing rather than a compliance claim based solely on automation. [W3C standard](https://www.w3.org/TR/WCAG22/)

A user with no CV can start from a small amount of relevant information and produce one useful next step.

Users on shared devices receive clear logout and session behaviour. Sensitive file previews must not appear in public notifications.

Notification text should explain the task and deadline without revealing private financial, educational or employment details on a lock screen.

No compulsory video, public posting, contact-book upload or payment is required to understand an opportunity.

## 6. Acceptance package per requirement

Record requirement ID, release/build, test type, fixture, expected result, actual result, evidence location, reviewer and unresolved limitations.

Use synthetic records for automated fixtures and authorised participant data for observed sessions.

Security and privacy requirements need adversarial access tests; user-value requirements need observed users, not only unit tests.

The first six-category release review includes a complete example from every category, not merely a database enumeration check.

The release package also reports issues that remain open, who owns them, and whether the release scope is restricted accordingly.

## 7. Scope change rules

Move a requirement between releases with a reason, dependency and updated evidence gate; preserve its identifier.

A new feature must name the user problem, affected journey, operating responsibility and success/failure measure.

Do not silently redefine active users, completed applications, verified evidence or outcomes to improve a dashboard.

Supplier limitations, staffing and cost evidence may change implementation timing. The long-term product remains visible in the roadmap.

## 8. Traceability and related specifications

Historical inputs: [original PRD](../../archive/2026-09-11-pre-strategy-refresh/docs/02_PRD.md), [original feed plan](../../archive/2026-09-11-pre-strategy-refresh/docs/03_Feed_Development_Plan.md), [original vault](../../archive/2026-09-11-pre-strategy-refresh/docs/33_Document_Vault.md), [September recommendation](../../archive/2026-09-11-pre-strategy-refresh/docs/38_MVP_Recommendation_2026-09-05.md).

Implementation contracts belong in [architecture](../engineering/06_ARCHITECTURE.md), [data/API](../engineering/07_DATA_AND_API_CONTRACTS.md), [agents](../engineering/08_AGENT_EXECUTION.md), [opportunity operations](../operations/09_OPPORTUNITY_OPERATIONS.md) and [trust/safety](../security/10_TRUST_PRIVACY_AND_SAFETY.md).

Commercial promises must be consistent with [commercial strategy](../commercial/04_COMMERCIAL_AND_PARTNERSHIPS.md); measurement must follow [benchmarks](../research/05_COMPETITIVE_BENCHMARKS.md) and [validation](../quality/11_VALIDATION_AND_RELEASE.md).
