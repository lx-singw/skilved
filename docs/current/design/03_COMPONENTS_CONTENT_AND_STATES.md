# Components, content and state catalogue

M0 detail update, 13 September 2026: implement the [companion component states](05_OPPORTUNITY_COMPANION_EXPERIENCE.md): source/check panel, original/explained/unclear requirements, device-local progress, changed/closed record, private suggestion receipt, report acknowledgement and structured share fallback. Scope-specific evidence replaces blanket verification badges; source-faithful copy and actual storage/share outcomes govern success states.

Date: 11 September 2026. Status: build specification. This catalogue defines shared behaviour; it does not claim components already exist.

## Core component contracts

| Component | Inputs | Essential behaviour and states |
|---|---|---|
| Opportunity card | Category, title, issuer, source, location/work mode, deadline and certainty, category-specific benefit | Whole-card reading order remains clear; dedicated open/save controls; distinguish expired and unchecked |
| Category filter | Six categories, result count where known, selected state | Keyboard accessible; URL/state restoration; zero is different from count unavailable |
| Source status | Publisher URL, last successful check, source revision, uncertainty | Explain “last checked”; do not conflate fetch time, publication time and closing date |
| Requirement row | Source requirement, evidence link, state, explanation | States: supported, missing, unknown, not applicable with reason; user can correct data |
| Evidence card | Claim, artefact type, contributor, origin, timestamp, assessment scope, visibility | Clearly distinguish self-report, reference, assessment and official credential |
| File uploader | Allowed types/size from server policy, progress, scan status | Validate server-side; cancel/retry; quarantine state; keyboard-friendly picker; no raw active HTML preview |
| Preparation progress | Completed applicable steps, total known steps, unresolved requirements | Explain denominator; no probability-of-selection implication |
| Task receipt | Mandate, trigger, action/result, source, status, next attempt | User-readable result plus inspectable detail; pause/cancel accessible |
| Share preview | Exact selected fields/files, recipient mode, expiry, downloadable/export effects | Preview before grant; distinguish revocation from recalling an already downloaded copy |
| Outcome control | State, reporter, timestamp, optional supporting evidence | Separate self-reported and externally confirmed outcomes; permit correction |
| Help request, later | Specific blocker, participants, visibility, status | Purpose-bounded invitation; close/report/block controls |
| Organisation selector, later | Active organisation and role | Persistent context; explicit switch; no silently inherited cross-tenant search |

## Category-specific content

All categories share source, location, deadline, eligibility and next action. They do not share every benefit field.

| Category | Detail emphasis |
|---|---|
| Bursary | Study level/field, institution constraints, funding coverage, academic requirements, obligations if stated |
| Learnership | Qualification or programme if stated, duration, eligibility and stipend when published |
| Apprenticeship | Trade, location, entry requirements, duration and training/employer route |
| Internship | WIL versus graduate eligibility, field, required enrolment/qualification, placement duration |
| Graduate programme | Graduation window, disciplines, intake, rotations and application stages when published |
| Job | Employment type, experience, location/work mode, salary only when supplied |

Unknown salary or stipend is displayed as “Not stated by the source”, not R0. An inferred category is a reviewable classification. Benefits and requirements may differ across tracks within one announcement; retain the distinction rather than merging into a misleading single card.

## Copy patterns

| Situation | Recommended copy |
|---|---|
| Unknown eligibility | “We need more information to check this requirement.” |
| AI draft | “Draft based on the information you provided. Review it before using it.” |
| Evidence added | “Added to your record. You choose where to share it.” |
| Watch activated | “We'll check this according to the schedule shown here. You can pause it.” |
| Source stale | “Our last successful check was [date]. Confirm details with the source before applying.” |
| Task failed | “This check did not finish. Your saved work is still available. [Retry / View details]” |
| External route opened | “You opened the application site. Tell us when you have submitted.” |
| Recipient reference | “[Name/role] confirmed [specific claim] on [date].” |
| Empty record | “Start with something you have done: a project, task, course or contribution.” |

Avoid “guaranteed”, “100% verified”, “perfect match”, “employability score” and fabricated urgency. Do not claim affiliation with MyMzansi, Harambee, a SETA or an employer merely because Skilved links to them.

## Forms and validation

Labels remain visible after typing. Required fields have a reason; optional fields are marked consistently. Validate useful formatting early, but preserve input on server errors. Provide an error summary and field-specific errors linked programmatically. Dates use a clear local display and an unambiguous stored representation. Deadline time zones and unspecified times must remain visible rather than silently assuming midnight.

Never require an identity number for public browsing or a basic record if the use case does not need it. Do not copy full sensitive values into analytics, URL query parameters, toast messages or client logs. A password, token or private file URL must not appear in support screenshots by default.

## State acceptance checklist

Every component implementation demonstrates loading, success, empty, error, partial data, denied access, long translated text and keyboard focus. Components involving background work also demonstrate cancellation, retries and stale results. Components involving sharing demonstrate expiry and revocation. Components involving documents demonstrate scan-pending and rejected content. Include a screen-reader description of status updates without repeatedly interrupting the user.

The [accessibility review](04_ACCESSIBILITY_AND_DESIGN_QA.md) and [test catalogue](../quality/01_TEST_CASE_CATALOGUE.md) connect these states to release evidence.
