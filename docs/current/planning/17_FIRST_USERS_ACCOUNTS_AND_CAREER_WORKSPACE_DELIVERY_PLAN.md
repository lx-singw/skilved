# Skilved first users accounts and career workspace delivery plan

Date: 3 November 2026. Owner: founder and product, with engineering, source operations and support responsibilities assigned before each release.

Status: detailed delivery recommendation requested by the founder. This document records the intended experience and a proposed sequence from the current build to first users, real accounts and the wider career workspace. It does not declare an implementation complete, close an existing release gate or authorise deployment, publication, provider spending, external messages or new access grants.

## Reading guide

For the immediate sequence, read sections 1, 3, 5 and 18. For the user's complete experience, read sections 6–14. For implementation and release decisions, read sections 15–24. Section 25 follows example users through the sequence. The terminology appendix explains the main product and delivery terms.

### Contents

- [1 Purpose and central recommendation](#1-purpose-and-central-recommendation)
- [2 Relationship to the existing Skilved strategy](#2-relationship-to-the-existing-skilved-strategy)
- [3 Current position and evidence limits](#3-current-position-and-evidence-limits)
- [4 Assessment of the workspace ambition](#4-assessment-of-the-workspace-ambition)
- [5 Sequence overview and release terminology](#5-sequence-overview-and-release-terminology)
- [6 Stage zero prospective users and real data readiness](#6-stage-zero-prospective-users-and-real-data-readiness)
- [7 Stage one controlled discovery pilot](#7-stage-one-controlled-discovery-pilot)
- [8 Stage two introducing real accounts](#8-stage-two-introducing-real-accounts)
- [9 Moving browser progress into an account](#9-moving-browser-progress-into-an-account)
- [10 Stage three the persistent application workspace](#10-stage-three-the-persistent-application-workspace)
- [11 The complete early user experience](#11-the-complete-early-user-experience)
- [12 Reminders and notification delivery](#12-reminders-and-notification-delivery)
- [13 Stage four living career plans](#13-stage-four-living-career-plans)
- [14 Stage five support networks and institutional use](#14-stage-five-support-networks-and-institutional-use)
- [15 Architecture and ownership for one connected product](#15-architecture-and-ownership-for-one-connected-product)
- [16 Privacy accessibility and reliability across the experience](#16-privacy-accessibility-and-reliability-across-the-experience)
- [17 Parallel delivery and capacity](#17-parallel-delivery-and-capacity)
- [18 Recommended work packets](#18-recommended-work-packets)
- [19 Release evidence and stop conditions](#19-release-evidence-and-stop-conditions)
- [20 Measures for learning and release decisions](#20-measures-for-learning-and-release-decisions)
- [21 Distribution and first user support](#21-distribution-and-first-user-support)
- [22 Reconciliation of the new workspace proposal](#22-reconciliation-of-the-new-workspace-proposal)
- [23 Risks decisions and practical responses](#23-risks-decisions-and-practical-responses)
- [24 Practical readiness checklists](#24-practical-readiness-checklists)
- [25 Example journeys through the sequence](#25-example-journeys-through-the-sequence)
- [26 Sources authority and maintenance](#26-sources-authority-and-maintenance)
- [Appendix terms used in this plan](#appendix-terms-used-in-this-plan)

## 1 Purpose and central recommendation

Skilved should reach its first users through a small, dependable experience built around real opportunities, then introduce accounts when users can preserve and continue useful work. The recommended sequence is:

**Real opportunity delivery and early observation → controlled discovery pilot → invited accounts and persistent application tracking → living career plans → selected support and institutional workflows.**

This is a sequence for delivering the existing Skilved ambition. The career workspace, user accounts, portable record, purposeful support and persistent assistance already belong to that ambition. Public opportunity discovery supplies useful content before employers, institutions and a user network have joined. Accounts turn a useful visit into continuity across applications, learning and career transitions.

The first account release should complete one personal journey: choose an opportunity, prepare, identify the next action, apply through the original route, record what happened and follow up. Broader goals and living plans can then grow from records and actions that users already understand.

First-user research can start now. A usable controlled pilot depends on current, appropriately released records and a stable environment. The formal public MVP retains its existing six-category scope and acceptance requirements. Account engineering may proceed alongside independent pipeline work when actual capacity supports both; public discovery does not acquire an account requirement merely because the personal workspace is being built.

### 1.1 What this document covers

This document explains the current position, the reason for discovery first, the ambition of the workspace, the sequence to first users, the moment and method for introducing accounts, the complete early user experience, the necessary operating controls, parallel delivery boundaries, evidence gates, metrics and subsequent expansion. It also reconciles the new career-workspace proposal with existing repository decisions.

It is intended to guide product decisions and sprint preparation. Detailed schemas, security policies, source controls and formal release acceptance remain in their existing authoritative documents. The [build roadmap](15_BUILD_ROADMAP.md) remains the numerical schedule authority; this plan supplies no replacement calendar or unmeasured total estimate.

### 1.2 Recommended immediate priorities

1. Complete and demonstrate a supported real-source path through qualified publication, public feed/detail rendering, correct application handoff and change/closure handling.
2. Observe a few reachable prospective users while that work continues, without presenting a prototype as a released service.
3. Prepare one small controlled discovery pilot with a support owner and a clear statement of its coverage.
4. Design the shared account and ownership foundation in parallel where it does not slow the ingestion objective or duplicate existing work.
5. Invite pilot users into accounts once persistent application preparation, recovery and data controls work.
6. Extend into living plans after users have actual tracked work to organise.

## 2 Relationship to the existing Skilved strategy

### 2.1 The original product remains broader than a feed

The [product strategy](../product/01_PRODUCT_STRATEGY.md) describes a career platform connecting opportunities, a living evidence record, persistent personal assistance and useful human support across education and working life. Its connected journey includes discovery, understanding, preparation, help, review, application, follow-through, recording progress and choosing the next step.

The September discovery-first decision changed launch sequencing. It retained the full career product in the expanded roadmap. The [discovery-first MVP](../product/03_DISCOVERY_FIRST_MVP.md) expressly distinguishes the bounded public launch from the full account, evidence, agent and institutional portfolio.

Consequently, the new workspace proposal develops an existing part of Skilved. It should be integrated with the same opportunity identities, user ownership, versioned records and permission model. It should not create an independent application tracker, a second profile system or a competing opportunity catalogue.

### 2.2 How opportunities address the chicken and egg problem

A platform that requires employers to post, institutions to enrol cohorts and users to build profiles before it is useful faces several dependencies at once. Source-backed public opportunities give an individual something useful immediately, even when no employer has created a Skilved account and no social network exists inside the product.

The proposed growth mechanism has distinct steps:

1. Skilved maintains useful opportunities and explains their actual requirements and application routes.
2. A person discovers a relevant listing directly or through a voluntarily shared public link.
3. The person can understand and act on that listing without a registration wall.
4. A real account becomes useful when the person wants preparation, application history and next steps to persist.
5. Repeated individual use may reveal practical needs for mentors, cohorts, evidence handover and employer participation.
6. Those needs inform supported network and institutional workflows, whose demand and economics still require their own evidence.

These are hypotheses to test. Feed traffic does not prove account retention, employer demand, institutional willingness to pay or placement impact. Each transition needs its own observations.

### 2.3 The account boundary

Public discovery and the personal workspace serve different needs. Public pages allow someone to assess an opportunity. A signed-in workspace preserves that person's work and choices. The account boundary belongs at personal continuity and protected actions, with an explanation of the benefit.

| Capability | Signed out | Signed in when released |
|---|---|---|
| Browse released opportunities and categories | Available | Available |
| Read public requirements and source evidence | Available | Available |
| Open the issuer's supported application route | Available | Available |
| Share an approved public listing | Available | Available |
| Save in the existing browser-local workspace | Available with clear device limits | Available during a deliberate transition or import |
| Maintain persistent application records | Account invitation at the point of need | Owner-controlled account data |
| Resume preparation on another device | Explain why an account is needed | Available after persistence and session checks pass |
| Receive reminders | No implied subscription | Explicit channel choice and working delivery controls |
| Maintain career goals and living plans | Explain the feature when available | Private account workspace |
| Share selected personal progress | No private sharing without a supported identity/grant path | Explicit scope, recipient, purpose and expiry |
| View cohort information | No | Separately authorised role and consent boundary |

“Real account” means a distinct authenticated user with verified provider credentials, enforceable ownership, recovery and a data lifecycle. It does not automatically mean collecting an identity document, checking every qualification or declaring the person's statements verified. Account identity, user-reported facts and independently supported evidence remain separate.

## 3 Current position and evidence limits

### 3.1 Baseline as recorded on 3 November 2026

The [current delivery status](05_M0_DELIVERY_STATUS.md) and [latest credential-recovery report](../operations/221_LOCAL_CREDENTIAL_EXPIRY_RECOVERY_2026-11-03.md) provide the baseline for this plan. This is a dated documentary baseline, not a new live database inspection.

| Area | Recorded position | Meaning for first users |
|---|---|---|
| Public application | Canonical catalogue read paths, feed/detail interfaces and source-based presentation exist | Reuse these paths rather than restoring prototype listing code |
| Private inventory | Six persistent private staging drafts are recorded | Draft count is not public inventory or launch coverage |
| Public inventory | Zero public records are recorded | A useful released feed still needs qualified publication |
| Real positive evidence | A fresh notice passed extraction and two-source validation and reached a private draft | A controlled success exists; general batch reliability is not established |
| Real applicant preview | A genuine reviewer inspected the real draft in an authenticated local preview | Rendering is demonstrated within that temporary protected boundary |
| Publisher workflow | Bounded discovery, durable jobs, holds and quota-aware resumption exist | Broad unattended acceptance and supported-method coverage remain open |
| Recurring operation | A bounded local wait/run loop and credential correction are documented | Attached machine identity, crash recovery and natural long-duration operation still need qualification |
| Hosting and publication | Hosting and public publication remain off in the recorded state | Planning does not activate either |
| Personal continuity | Browser-local saves, user stages and history exist | Useful foundation; not a persistent consumer account service |
| Career workspace proposal | Account, tracker, living-plan and later modules are specified | Detailed proposed behaviour is not delivered capability |

The latest report also records a replacement bounded local attempt with a pending result. A scheduled time passing is not evidence that validation, cleanup or unattended operation succeeded. Update the status record from actual receipts before claiming a later state.

### 3.2 Why the visible feed can still contain fictional examples

During the 3 November discussion, the local server on port 3000 was observed running from a separate October 31 UX-preview snapshot. Its interface identified itself as a local preview with fictional examples and no real applications. That snapshot was not the live scraped catalogue.

The current production-source feed reads checked catalogue projections. It has no automatic demo-opportunity fallback. Disabled or unavailable catalogue access produces a preparation/unavailable state; an empty public catalogue produces an empty state. Scraped observations and private drafts are not automatically public feed entries.

This explains two different gaps: the visible preview is separate from actual inventory, and the real pipeline has not yet completed qualified public publication. Replacing a preview alone does not close the publication gap. Completing scraping alone does not update an isolated preview.

The protected real-draft preview already demonstrates a way to inspect progress before publication. Keep that reviewer-only boundary explicit. The ordinary development experience should make it clear which environment and data class are being viewed so the founder does not mistake a design snapshot for the current system.

### 3.3 Work that should be reused

The repository already has one canonical opportunity contract, persistent catalogue machinery, public projections, source evidence, preparation interfaces, local saves, personal progress stages, revision-change handling and public sharing/export work. Reconcile the exact current implementation before assigning new tasks.

In particular, browser-local progress supports interested, preparing, applied as reported by the user, and no longer pursuing. The current interface also warns that checklist ticks are temporary. Persistent checklists, cross-device continuity and authenticated ownership must be implemented and evidenced before those benefits appear in account copy.

### 3.4 Separate the inventory counts

Operational reporting should distinguish discovered URLs, acquired notices, parsed candidates, candidates passing basic checks, original-source matches, extracted candidates, validated private drafts, approved public records and currently actionable public listings. Large scraping totals can coexist with an empty feed because later stages filter or hold candidates.

Every operational view should show its date, denominator, stage and hold reasons. It should help answer where candidates are being lost and what a reusable fix would improve. Neither a high unit-test count nor a single successful advert establishes useful live inventory.

## 4 Assessment of the workspace ambition

### 4.1 The strongest organising idea

Skilved becomes more useful when an opportunity can turn into preparation, a concrete action, a recorded application and progress the person can carry into the next stage. The workspace gives source information a practical use and gives an account a reason to exist.

The next-move concept is valuable when it reduces uncertainty. A user should be able to open a tracked application and identify one feasible action, its reason and its finish line. The product should preserve earlier work when a source changes and help users resume without reconstructing their situation.

### 4.2 The breadth that needs sequencing

Application tracking, study planning, general goals, funding, wellbeing, mentoring, social groups, credentials and institutional reporting have related purposes but different data, support and operating needs. Building all of them at once would create more uncertainty than the first release can resolve.

Keep these capabilities visible in the long-term plan. Introduce them when an observed need, a usable design and the relevant controls justify their cost. Founder use is an important source of insight, especially for application and study preparation, but other people must also be observed using the product without the founder explaining every step.

### 4.3 What concurrent development should mean

A bounded parallel effort can establish shared account contracts, ownership, recovery, persistence and one application journey while the main ingestion effort completes independent qualification work. This develops the same product and avoids treating every pipeline wait as a reason to stop all progress.

Concurrency does not create extra founder capacity. When one implementer owns both areas, choose one main implementation objective and use genuine external waits for independent design, contracts or tests. Switching repeatedly between two unfinished systems can delay both. The [existing runbook](04_M0_CHRONOLOGICAL_BUILD_RUNBOOK.md) remains the default sequence; parallel work is an explicit planning recommendation to reconcile with capacity, not a claim that its allocation already changed.

### 4.4 The boundary for the first account release

The proposed first account release includes authentication, owned persistent records, saved opportunities, preparation progress, private notes, user-reported application history, one next action, basic outcomes and working data controls. A simple list can deliver the tracker before a draggable board is justified.

It excludes document uploads, inbox parsing, general wellbeing records, social feeds, autonomous submission, broad institutional dashboards and a complete life-planning system. These remain future capabilities with their own readiness work. Reminder delivery enters only when consent, scheduling, cancellation and quiet hours are dependable.

## 5 Sequence overview and release terminology

### 5.1 The proposed progression

| Stage | User group | Experience to demonstrate | Exit evidence |
|---|---|---|---|
| 0 Understand and prepare | A few reachable prospective users and the founder | Observe real search/preparation tasks while completing the real-data path | Documented needs, current baseline, supported publication scope and named operating responsibility |
| 1 Controlled discovery pilot | Approximately 5 to 10 invited participants | Current real listings, source understanding, save/resume and original handoff | People complete useful tasks on their own phones; material failures are addressed |
| 2 Invited accounts | Pilot participants who need continuity | Create an account at a useful moment and preserve application work | Distinct users own their records, recover access and resume work reliably |
| 3 Persistent application workspace | A small supported account cohort | Prepare, report applications, follow up and record outcomes | Independent repeat use across actual application cycles with manageable support |
| 4 Living career plans | Users with demonstrated planning needs | Today, tasks, weekly review and confirmed change proposals | Planning helps people act and preserves their control |
| 5 Support and institutions | Willing users and a concrete support or buyer workflow | Selected sharing, scoped help and a bounded pilot | Working permissions, moderation where applicable and evidence of practical demand |

Suggested participant counts are learning cohorts, not adoption targets or statistical proof. Progress depends on observed behaviour and release readiness, not an arbitrary number of visitors.

### 5.2 Controlled pilot and formal public MVP

A controlled pilot can test a narrower, clearly described supported audience and inventory set. It must still meet the security, accuracy and operating requirements relevant to its exposed features. Inviting only a few people does not excuse misleading facts or access failures.

The formal M0 remains governed by the [six-category specification](../product/03_DISCOVERY_FIRST_MVP.md), its [acceptance criteria](../quality/02_DISCOVERY_COMPANION_ACCEPTANCE.md) and the existing release gates. A pilot containing only supported apprenticeship opportunities is not evidence of six-category launch coverage. Preserve category navigation and honest limited/seasonal states, and record missing coverage rather than supplying fictional filler.

Do not rename a narrow pilot as a completed M0. Conversely, a need for wider formal coverage should not prevent appropriate early observation of a smaller supported experience.

### 5.3 Existing release identifiers remain authoritative

The new workspace proposal uses R1 to mean accounts and application tracking, while the existing portfolio uses R0–R5 for a different release structure. Until reconciled, use descriptive capability names in task planning. Do not map identical numbers to identical scope by assumption.

The stages in this document describe the user rollout. They do not replace G0–G5, REL-M0, B01–B10 or S01–S35. The same piece of work should be credited once in the existing backlog, with this document providing the user-experience context.

## 6 Stage zero prospective users and real data readiness

### 6.1 Start learning before public launch

Identify about five prospective users whose current situation can be observed: an apprentice seeking a next opportunity, a school leaver exploring training or funding, or someone actively preparing an application. Recruit through relationships and channels the founder has permission to use. This plan does not send invitations or authorise unsolicited outreach.

Ask about a recent real task. Useful questions include where the opportunity was found, how its requirements were interpreted, which preparation step caused delay, what was forgotten, what was recorded after applying and what would make the person return. Ask to see their existing tracking method if they freely agree; avoid collecting their documents or private messages just to understand the workflow.

Show a prototype or supported interface with its status clearly stated. Give a task such as finding the closing information, identifying two requirements and locating the official application route. Observe hesitation and misunderstanding before explaining the interface. Record observations separately from requests and the founder's interpretation.

### 6.2 Complete the supported real opportunity path

The current [autonomous ingestion target](../engineering/17_AUTONOMOUS_OPPORTUNITY_SYSTEM.md) remains the ingestion priority. Continue through reusable publisher discovery, original-source verification, budget-aware orchestration and representative publication qualification. A hand-approved sample or one private draft does not substitute for that target.

For a supported first pilot lane, demonstrate the following with real evidence:

1. A permitted source is acquired within its configured policy and limits.
2. The notice has stable identity, source references and faithful facts with uncertainty preserved.
3. The application destination belongs to the actual vacancy/intake under the qualified policy.
4. Extraction and validation satisfy the selected publication lane rather than merely producing valid JSON.
5. Publication writes the approved public projection through normal controls.
6. Public feed and detail handlers serve that projection without exposing draft or reviewer content.
7. Changed, expired, conflicting and unavailable-source cases behave according to policy.
8. Restart and quota deferral preserve history and do not duplicate publication or spending.
9. A support/operator path can restrict a misleading listing and explain the current status.

Qualify a supported lane before widening its methods or sources. Do not remove shadow guards solely to produce a non-empty feed. The chosen Gemini or split-extraction lane needs its explicit qualification before automatic publication is enabled.

### 6.3 Prepare an environment that participants can actually use

Choose a stable test URL and access model, name the environment and its limitations, and distinguish it from the design snapshot and reviewer-only preview. A participant session must not depend on sharing a staff account or borrowing the founder's reviewer privileges.

Prepare support contact, source/correction responsibility, basic monitoring, rollback and the response to an empty or unavailable feed. Confirm that the environment's actual configuration matches its promised behaviour. Hosting is currently off by instruction; this plan prepares readiness but does not change that instruction.

### 6.4 Exit check

Stage zero is ready to yield a usable pilot when current appropriately released inventory can support a real task, public/draft boundaries hold, the environment is stable enough for invited use and somebody owns source care and participant support. Initial observations should already be influencing the interface. All remaining formal gates stay visible.

## 7 Stage one controlled discovery pilot

### 7.1 The first usable experience

Invite approximately 5 to 10 people who have a relevant current need and can receive support. Start small enough to investigate each important problem. Inclusion in this cohort is not proof of demand; independent useful behaviour is the evidence sought.

The intended journey is: open a direct or shared listing, understand what it is, read source and closing information, review requirements and practical conditions, save it if useful, prepare, then visit the issuer's original route. Users must be able to complete the core discovery task without registration.

The first pilot should contain enough current, relevant opportunities for its stated task. There is no universal minimum listing count that makes a feed useful. Relevance, remaining application time, source reliability and actual next steps matter more than a large scraped total. Empty categories must explain their current coverage honestly.

### 7.2 Observe both assisted and independent use

Run a short first session on the participant's normal phone and connection. Ask them to explain the opportunity in their own words, identify the next action and distinguish the publisher from the employer/application destination. Observe readability, data cost, navigation and uncertainty labels.

Then allow independent use. A task completed only while the founder guides every tap is assisted usability evidence. A later return, a useful save or a self-initiated follow-up provides different evidence. Do not describe requested shares as organic referrals or application-route clicks as applications.

### 7.3 What to learn before accounts become available

Watch for needs that make persistent accounts useful: returning to a saved notice, working from a second device, losing preparation progress, tracking several applications, remembering a follow-up or maintaining a document checklist. Ask what the user expected to be saved and what they would be comfortable storing.

This research should improve the first account release. It is not a rule that accounts must wait for a large anonymous audience. Account development can continue concurrently, and the same first users can become the first account cohort as soon as it works.

### 7.4 Exit check

Proceed when invited people can understand and use relevant real listings with manageable help; serious source, handoff, mobile and privacy failures have been addressed; support load is known; and the account proposition addresses an observed continuity need. If discovery is still confusing, repair it while independent account foundations continue.

## 8 Stage two introducing real accounts

### 8.1 The timing of the invitation

Introduce accounts at a moment when the person has something worth preserving. Examples include choosing to track an application, continuing preparation on another device or retaining a personal record. Explain the concrete benefit before asking for information.

Public browsing remains open. A person should be able to inspect the opportunity and original route before deciding whether the workspace is useful. This approach is consistent with [GOV.UK account-design guidance](https://design-system.service.gov.uk/patterns/create-accounts/), which recommends accounts for repeated access to personal data and allowing useful service access before account creation is necessary. This is design guidance, not evidence that a particular conversion rate will result for Skilved.

Do not advertise reminders, cross-device persistence or saved checklist progress before those features are released. An unavailable workspace feature should be marked as such; an interest form is not an operating account.

### 8.2 Suggested account entry points

| User intent | Appropriate invitation | Required follow-through |
|---|---|---|
| Track one application | Create an account to keep your application progress | Return to that opportunity with an owned record |
| Preserve browser saves | Keep selected saved opportunities in your account | Preview and confirm which local records will be imported |
| Resume elsewhere | Sign in to continue on another device | Load only the authenticated user's records |
| Receive a released reminder service | Choose a channel and reminder after account creation | Store the preference and show scheduled/cancelled status |
| Open the career workspace directly | Create an account to organise your next steps | Start with one meaningful task or existing application |

The first account cohort should normally be invited users from the discovery pilot. There is no requirement to reach hundreds of visitors or wait several months first. Broader self-service registration follows successful account and support operation.

### 8.3 Short onboarding with progressive questions

Choose one supported sign-in method first after checking accessibility, recovery, cost and the audience's actual access. Keep the architecture compatible with additional methods without requiring every option for the first pilot. The final choice remains an implementation decision to record, not an assumption of this plan.

Collect only the information necessary to create and protect the account. A name or display preference may help personalisation; province, field or career interest can be optional when they improve the next task. Ask age-related questions only through the adopted eligibility/safety process and explain their purpose. Do not front-load a full CV, identity document, academic record, contact list or life questionnaire.

Preserve the intended destination through account creation. If a person starts from an application, return them there. If authentication is cancelled or fails, preserve safe local context and show a route back to the public listing. Never turn a failed sign-in into a false claim that progress was saved remotely.

### 8.4 The first successful account session

1. The person chooses to track a particular opportunity.
2. The interface explains what an account will preserve and what remains public.
3. The person authenticates through the supported provider.
4. The server verifies the identity and creates or loads a distinct minimal account.
5. The user chooses whether to import any browser-local records.
6. The tracked opportunity opens with source requirements and owned preparation progress.
7. The user selects one next action, such as checking an education requirement or gathering a document.
8. The interface confirms the actual saved state and explains how to return.
9. Reminder consent is requested separately only if the user chooses that released feature.

An empty dashboard or a long profile form should not interrupt this sequence. Account creation should lead directly to the work that justified it.

### 8.5 Account readiness requirements

Before admitting personal records, demonstrate server-verified identity, server-controlled ownership, protected roles, account status checks, recovery, expiry handling, sign-out, rate limits and cross-user denial. The API must reject attempts to assign ownership or privilege through client fields.

Records must persist after process restart and remain correct under retries or concurrent edits. Export and deletion need a working, documented route covering the stores and jobs actually used. If a pilot uses an operator-assisted lifecycle process, its limits, response responsibility and tested completion evidence must be explicit; it must not be described as self-service functionality that does not exist.

Show a plain explanation of what is stored, where the user can change preferences and how to request help. The account pilot must apply the adopted age policy. Opening protected accounts to minors requires the relevant reviewed process; the first account cohort can be restricted to adults while that process is prepared. Public discovery and the broader school-leaver audience remain part of the strategy.

### 8.6 Exit check

Distinct real users can create and recover accounts, access only their own data, preserve one application and resume it later. They understand whether data is on the device or in the account. The same journey works after expiry, cancellation and ordinary network failures without silent loss or duplicate records.

## 9 Moving browser progress into an account

### 9.1 Preserve the existing value

Browser-local saving already provides a useful low-friction discovery feature. Keep its storage limits visible: it is tied to that browser/device, may be lost when browser data is cleared and has no automatic cross-device backup. It must not be presented as an account.

The transition should preserve the person's choice. Account creation alone should not upload all local progress from a shared browser. Offer a clearly labelled review of the records found on that device and allow selection, cancellation or import later.

### 9.2 Import behaviour

The import preview should show the listing reference, local personal stage, relevant dates, whether the public notice still exists and any ambiguity about its identity or revision. Keep public facts separate from the user's reported history. An obsolete local reference must not overwrite the current public listing.

Import through an idempotent server command bound to the authenticated owner. Repeated submission or a retry after a dropped response should not duplicate applications or counts. If the account already contains the same intake, show a merge/review choice that preserves history; use the canonical identity rules rather than matching on title alone.

A changed or aliased opportunity needs explicit identity reconciliation. Do not silently turn an old intake's applied report into a new intake's submission. Preserve the original reference and provenance even when a related current listing is available.

### 9.3 Completion and failure

Confirm successful account persistence before offering to remove the local copy. Keep cancellation and partial-failure states understandable. If the network fails, state that the import is incomplete and retain recoverable local data. Do not delete the original because a request was sent.

On a shared device, offer an explicit option to remove local personal data after confirmed import, with a clear warning. The default and wording should be tested with actual shared-device users. Signing out must end access to account data and address account caches without indiscriminately deleting unrelated browser data.

### 9.4 Import acceptance cases

Test an empty browser, existing account records, repeated import, mixed current/closed/missing listings, aliases, a revision conflict, an expired session, a failed response after a successful write, a shared device and cancellation. Confirm no private browser history enters public analytics, share text or catalogue projections.

## 10 Stage three the persistent application workspace

### 10.1 The minimum complete journey

The first workspace should support the complete sequence of choosing, preparing, applying externally, recording and following up. It should not require a public profile, a document vault, an institution or a mentor to be useful.

The main views can be a tracker list, an application detail and a compact next-actions view. A board is optional presentation. On small phones, a readable list with clear stage actions may work better than dragging cards across columns. Validate the interaction rather than treating a board as the product itself.

### 10.2 Saved opportunities and application records

A save records interest. An application record records an intention and preparation history. Users may save many items while actively pursuing only a few. Avoid creating a heavy plan or several reminders for every casual save.

When the user chooses to pursue an opportunity, create or open its owned application record against the correct canonical opportunity and reviewed revision. Preserve user notes, progress and event history as the source changes. Link current public facts into the record without making the user responsible for maintaining a copied advert.

### 10.3 Preparation and the document kit

Show source-stated requirements and preparation tasks as related but distinct information. A requirement says what the opportunity asks for. A preparation task says what the user will do about it. A completed task does not establish eligibility or independent verification.

The document kit begins as a checklist. A person can record that they have a CV, a certificate or a required copy without uploading the file. Display dates and opportunity-specific instructions where supported. Do not assume that every certified copy expires after three months; show the applicable source instruction and the age of the user's copy separately.

Allow custom tasks for practical work such as arranging transport, checking a result or asking an issuer a question. Mark these as user-created. Preserve uncertainty when the source does not state an answer.

### 10.4 One next action

Each active application should show a user-chosen next action with an understandable finish line. Examples include reading the education requirements, locating a missing certificate, completing one section of a form or preparing an assessment.

The first version can use simple rules and user choice. It does not need AI or a weighted scoring engine. Explain any system suggestion and let the user edit, dismiss or postpone it. Do not imply that completing a checklist guarantees acceptance.

### 10.5 External application handoff

The user applies through the issuer's supported original route. Preserve the actual method: portal, qualified email, form, in-person instruction or another supported route. The application action must explain where the person is going and retain source limitations.

A route click is a recorded event, not a submission. Returning from an issuer page does not prove the form was submitted. A failed destination must not be replaced with an invented route or a fabricated closure claim.

### 10.6 Recording applications and outcomes

Provide a simple “I applied” action that records the user's report, date and method. Make correction possible and preserve relevant history. A user can later add a reference or supported evidence when that feature is released; a string or screenshot alone does not justify an unqualified issuer-verification claim.

Track response events such as interview, offer, rejection, acceptance, start or completion separately from their evidence class. The product should say whether information was reported by the user, supported by a message or independently confirmed through an authorised route.

An absent reply remains unknown. Allow users to set follow-up dates, pause or stop pursuing an application, and retain it for reference without sending unwanted reminders.

### 10.7 Separate opportunity availability from personal progress

Opportunity status and application status must be independent. A source can close an intake after the user has already applied. The application may still be awaiting a response or progressing to an interview.

| Source event | Personal record behaviour |
|---|---|
| Intake closes before the user applies | Explain closure, restrict the unavailable action and let the user decide what to do with preparation |
| Intake closes after a reported submission | Preserve the submission and follow-up history; do not mark it rejected or finished |
| Deadline changes | Show the old and new source facts and any effect on preparation |
| Requirements change | Identify affected items and retain still-valid completed work |
| Source is temporarily unavailable | Explain the failed check without claiming employer closure |
| Public record is withdrawn or restricted | Preserve the owner's history while restricting unsupported public facts/actions |
| Related new intake appears | Offer it separately; do not move the old submission to it |

The source event may propose a personal plan change. It must not silently rewrite a user's report or outcome.

### 10.8 What proves this stage useful

Observe whether people resume unfinished preparation, keep several applications distinguishable, record what happened and use a next action or follow-up without prompting. Ask what they would lose if the workspace disappeared and compare that answer with actual behaviour.

Assess use over meaningful application cycles. Weekly activity may be informative for active applicants, but a person waiting for the next intake need not visit every week. A small pilot can reveal usability and continuity problems; it cannot establish population-wide retention or placement impact.

## 11 The complete early user experience

### 11.1 Arrival from a shared listing

A recipient opens the current canonical listing on a small phone. They see its title, issuer, type, location/coverage, closing information, important conditions and source evidence without signing in. The page explains what Skilved checked and what remains unknown. A shared link contains public information only.

If the listing has changed, closed, merged or been restricted, show the current status and a useful recovery path. Preserve the ability to browse related opportunities without inventing availability. A stale social preview must not override current page facts.

### 11.2 Browsing and understanding

The feed supports relevant search and filters with honest empty states. Province, national coverage, remote attendance and residence eligibility must remain distinct. A user can widen their search. Category labels do not imply that current inventory exists in every category.

Each detail should answer what the opportunity is, who offers it, current availability, requirements, practical conditions, the next action and how to report a problem. Keep original requirement wording accessible beside any faithful explanation. Avoid a generic verified badge that hides the scope or age of a check.

### 11.3 Saving before an account

If the person chooses the existing browser save, confirm that it is saved in this browser and explain the limits. They can keep browsing and use the original route. Offer persistent tracking when relevant without blocking the current task.

Local progress is an optional bridge into the account experience, not a second long-term product that must acquire every account feature first. Keep migration simple and explicit.

### 11.4 Creating an account from an opportunity

The person chooses persistent tracking, completes short authentication and returns to the same opportunity. Their selected local data is imported only with confirmation. The interface shows their actual application and one useful next action immediately.

If the account cannot be created, explain the failure and preserve a route back. If the person already has an account, direct them to sign in or recover it rather than creating ambiguous duplicate identities. Linking provider identities requires an explicit, safe design.

### 11.5 Preparing and applying

The user reviews source requirements, checks their own situation and selects tasks. The product stores preparation progress in the account when that feature is available. It shows the source deadline and any personal target separately. The user follows the original application route and later records a submission report if they choose.

The interface must never label an apply-link click “Applied.” It must also avoid labels suggesting that a completed document checklist proves that the issuer received the documents.

### 11.6 Returning later

After authentication, the user sees the work they were pursuing, relevant deadlines, source changes and the next selected action. A returning user should not be forced to re-enter their profile or reconstruct earlier notes.

If no active work exists, offer one simple starting action: find an opportunity, track an external application or choose a career goal when that capability is released. Avoid filling the screen with unavailable modules or fabricated activity.

### 11.7 Responding to change

When source facts change, identify the affected notice and revision, explain what changed and separate the source fact from any proposed plan adjustment. Preserve completed work that remains applicable. Ask for confirmation where a personal plan or priority will change.

If the user is offline, distinguish cached facts from current checks. Do not promise live deadline monitoring in an offline session. Once connected, reconcile without silently overwriting recent edits.

### 11.8 Help and recovery

Offer a clear way to report a listing error, ask about an account problem or recover access. Distinguish public source reports from private account support. Staff do not need unrestricted access to personal records to handle ordinary questions.

When an action fails, explain whether it was saved, remains local, is pending or must be retried. Only say “your changes are safe” when the implementation has durable evidence that they are recoverable. Error copy must describe the actual failure behaviour.

## 12 Reminders and notification delivery

### 12.1 Introduce reminders when delivery is dependable

Reminders can make accounts useful, but they create an operating service beyond storing dates. Add one supported channel first, chosen from actual audience access, cost and deliverability evidence. Show what will be sent, when, how to stop it and whether it is currently scheduled.

Do not make every save trigger reminders by default. Let the user select an application or task and choose the relevant reminder. Marketing, research and task reminders must not be bundled into one permission.

### 12.2 Consent and quiet hours

Check current permission and preferences at send time, not only when scheduling. Turning reminders off must prevent pending future sends through the actual delivery architecture. If a message has already been handed to an external provider, explain that practical limit rather than promising recall.

Enforce quiet hours using the user's chosen timezone and handle time changes. Snooze, pause and cancellation should be visible in the account. One user's preference must not affect another user's jobs.

### 12.3 Reliability requirements

Use durable due work, bounded retries, duplicate suppression, status records and monitored failures. Avoid a timer dependent on a developer laptop for a feature presented as a continuous public service. A worker restart must not send the same reminder repeatedly or discard every pending reminder.

Cloud event systems can deliver an event more than once. [Firebase's retry documentation](https://firebase.google.com/docs/functions/retries) describes at-least-once event execution and the need to manage retries. The chosen Skilved implementation must therefore make repeated processing safe, whatever scheduler or queue is selected.

Delivery status must distinguish scheduled, handed to provider, failed and any independently supported delivery receipt. A successful API call is not proof that the user read or acted on a message.

### 12.4 Honest deadlines

Retain source wording, known date/time/timezone and uncertainty. A date-only deadline is not automatically an exact midnight instant. The user's earlier preparation target is a separate personal choice.

If the source changes or closes, update reminders consistently with the current policy and user choice. A quiet-hours delay must not produce a message after its useful deadline without explanation. Test cancellation, source revision, account deletion, revoked permission, provider failure and reset/restart behaviour.

## 13 Stage four living career plans

### 13.1 Enter through actual work

Start living plans with application preparation, study or a qualification already present in the user's workspace. A goal gives direction, a next move gives a near-term outcome, tasks describe the work and micro-steps make starting easier. Avoid demanding this entire hierarchy before a person can record a simple application.

The Today view should help the user choose a small feasible set of actions. “Daily three” is a default, not a requirement to invent three tasks. A person should be able to pin an important action or choose a minimum day without the system arguing with them.

### 13.2 Event driven proposals

The proposed living behaviour is: an event occurs, a rule evaluates it, a proposed change explains its reason, the user confirms or edits, and the applied change is recorded. Examples include a deadline moving earlier, a requirement changing, a task remaining blocked or a week exceeding declared capacity.

Begin with a small deterministic rule set. Source-derived events must refer to actual reviewed revisions. Time passing does not prove a task was not done, an application was abandoned or an employer rejected the person. Ask for an update when knowledge is incomplete.

### 13.3 Capacity and reflow

Use declared available time, task estimates, dependencies, deadlines and user priorities to propose a feasible plan. Explain estimates and allow correction. Preserve sleep, rest and commitments the user has marked unavailable without requiring health information.

The proposed priority formula in the workspace spec is an illustrative hypothesis. A five-percent score component does not guarantee that a pinned task remains first. Decide whether pinning is a hard ordering rule or a soft preference and make the interface match that decision. Do not present unvalidated numerical precision as knowledge of what matters in a person's life.

Reflow should show the old plan, the proposed change, the reason and any at-risk work. Confirmation must apply to a known revision so a stale proposal does not overwrite a later user edit. Offer undo or a recoverable history consistent with the stored model.

### 13.4 Weekly review and minimum day

A short weekly review can help users identify completed work, blockers and the next useful focus. It should reuse existing records and require little duplicate entry. A scoreboard should describe the user's own targets and avoid turning reported tasks into verified achievements.

Minimum day can be a simple user-selected reduced plan. It does not require mood tracking, mental-health inference or a crisis feature. Optional wellbeing modules have separate evidence and review needs and should not enter the first career-planning release by default.

### 13.5 Expand goals according to observed needs

Study deadlines, certificates, trade milestones, registration and career transitions are natural candidates because they connect to existing preparation. Broader money, wellbeing and general-life modules remain options. Validate their usefulness and data implications before expanding the model and support burden.

### 13.6 Exit check

Users can understand and control suggestions, complete meaningful actions, resume interrupted work and preserve progress through source changes. Review whether planning reduces confusion or creates extra administration. Low proposal acceptance can mean poor suggestions; very high acceptance can also warrant checking whether users understand their choices.

## 14 Stage five support networks and institutional use

### 14.1 Add people around a concrete help need

A person may need a mentor to review a next step, a coordinator to help resolve a missing document or a trusted partner to receive a weekly update. Start with one named recipient and a narrowly selected summary. A social feed, public profile and open messaging system are not prerequisites for useful help.

Sharing should show exactly what will be visible, to whom, for what purpose and until when. Private notes, application details and sensitive records remain excluded unless the specific feature and user choice permit them. Sharing a public opportunity link is separate from sharing personal progress.

### 14.2 Revocation and recipient access

Future requests must respect revocation and expiry at the server. Explain that revoking access cannot recall a copy a recipient has already downloaded or recorded. Recipient viewing may be accountless only through an explicitly supported, risk-appropriate access mechanism; possession of a public listing URL never grants private workspace access.

Add report/block and moderation when the actual interaction model needs them. Do not introduce groups or stranger contact before the operating responsibility and safety controls exist, especially where younger users may participate.

### 14.3 Institutional discovery and pilots

Conversations with willing coordinators, SDFs, TVETs and employers can clarify needs after the M0 research sequence begins. The existing [institutional model](../commercial/03_TVET_SDF_AND_EMPLOYER_BUSINESS_MODEL.md) remains a buyer hypothesis. Consumer traffic or a coordinator's enthusiasm does not establish budget, procurement authority or an agreed pilot.

Before building a dashboard, identify the concrete task, current method, receiving organisation, decision maker, permitted information, success measure and actual commercial or formal pilot agreement. Test whether a simple permissioned report would solve the task before building a large multi-tenant application.

### 14.4 Aggregates and individual access

Aggregate reporting and named individual support require separate permissions. Minimum group size alone is not a complete defence against identification through repeated filters, small cohorts or differences between reports. Design the supported query set, suppression and access controls for the actual use case and review them before release.

An institution joining Skilved must not automatically gain access to all members' applications, notes, documents or goals. Membership, consent, role, purpose and record scope need enforcement. Outcome reports keep user reports, receipts and issuer-confirmed facts distinguishable.

### 14.5 Later evidence and credentials

Reusable career evidence, attestations, portfolio presentation and recognised transitions remain part of the long-term ambition. Introduce them through actual issuer/recipient workflows, correction and revocation rules, and a clear explanation of who asserted each fact. A user uploading a certificate does not make Skilved its issuer.

## 15 Architecture and ownership for one connected product

### 15.1 Reuse the shared foundation

Keep public catalogue data, private application records, personal plans and support permissions separate in access terms while connecting them through stable references. Reuse the [canonical opportunity contract](../engineering/14_CANONICAL_OPPORTUNITY_CONTRACT.md), [data and API conventions](../engineering/07_DATA_AND_API_CONTRACTS.md) and current persistence infrastructure where suitable.

Do not reopen the entire stack by default. The public catalogue already uses persistent Firestore. Evaluate the private-data workload and access patterns deliberately, recording any reason for a different store and its migration/operating cost. The spec's datastore question is not evidence that no persistence decision has ever been made.

### 15.2 Separation of facts and personal records

| Record class | Authority | Change behaviour |
|---|---|---|
| Public opportunity facts | Qualified source/publication process | Versioned revisions with source evidence |
| Personal application history | Authenticated owner or explicitly authorised actor | Corrections and events preserve provenance |
| User-entered external lead | The user's report | Clearly labelled; no automatic public trust status |
| Preparation task | Owner choice or confirmed proposal | Editable without changing source requirements |
| Derived next-action suggestion | Versioned rule or bounded assistant | Explainable, dismissible and confirmed when it changes a plan |
| Issuer attestation | Authorised issuer workflow | Correction/revocation under the trust policy |
| Shared view | Current scoped permission | Request-time access checks and expiry/revocation |

This separation lets a source change without destroying user history and lets a user add context without modifying public truth.

### 15.3 Commands events and concurrency

Use runtime input schemas, authenticated ownership, expected revisions and idempotency for commands that can be retried. The client cannot assign staff roles, ownership, publication approval or issuer authority. A browser flag is not an access boundary.

Record events needed to explain actions and recover from failures. Avoid storing full private content in audit logs or analytics. Event consumers must tolerate retries and out-of-order work according to their contract. A confirmed plan proposal should either apply consistently to its expected state or return a reviewable conflict.

### 15.4 Bring an external opportunity

An account user should eventually be able to track a lead found elsewhere, because their career work is broader than Skilved's current catalogue. Start with manual entry of a public URL, title, user-stated deadline and private notes when that capability is selected.

Label the record as user-entered and distinguish it from a checked public listing. Do not automatically fetch arbitrary URLs merely because the tracker accepts a link. Bounded retrieval, supported-source policy and private preparation rules are separate work. A private lead does not enter the public feed through account creation or a user toggle.

## 16 Privacy accessibility and reliability across the experience

### 16.1 Scope controls to the feature actually exposed

Apply the existing [trust privacy and safety policy](../security/10_TRUST_PRIVACY_AND_SAFETY.md), [threat model](../security/01_THREAT_MODEL.md) and [data governance procedures](../governance/03_DATA_GOVERNANCE_AND_RETENTION.md). This delivery plan does not establish legal compliance or replace the review required for a particular release.

An early checklist-only tracker can collect less data than a document vault or a social network. Keep that advantage by collecting the minimum needed for the actual task. Adding an optional module still requires its controls before anybody can use it.

### 16.2 Shared devices and sessions

Test sign-in, account switching, expiry, logout, browser back-navigation and cached screens on shared devices. The next person using the phone must not inherit access to the previous user's server records or cached private views. Device-local saves created while signed out need a separately explained policy.

Avoid exposing names, notes or application details in public URLs, notification previews or analytics. Let the user understand the privacy consequences of a shared screen, download or calendar export. A feature labelled private must have enforceable access boundaries behind it.

### 16.3 Export deletion and retention

Export the account data and relevant provenance actually held, excluding other users' records and secrets. Restrict generated downloads, make their expiry clear and avoid exposing personal information through public file links.

Deletion must stop relevant jobs and future sharing and cover the active stores, derived records and linkage actually used. Backups and justified retention need the existing documented handling; do not promise instantaneous removal from every backup. A completion notification should follow verified completion rather than merely queueing a request.

### 16.4 Younger users

School leavers are not automatically minors, and an adult-only first account pilot is an operational option rather than a permanent audience exclusion. Establish the age policy and applicable reviewed process before enabling younger users' private features. Staff or peer support relationships must not bypass those controls.

Avoid collecting health, mood, religion, identity documents or other high-risk information merely because the long-term plan mentions them. The career-planning experience can begin with tasks, dates and user choices.

### 16.5 Accessibility and low data

Test core journeys with keyboard and screen-reader navigation, readable text, usable touch targets and clear focus/error states. Use actual low-end or representative phones and slower connections. Accessibility is part of the first journey; it is not a decorative hardening task at the end.

Keep public discovery useful on limited data and account screens lightweight. Do not require large images, animations, a full CV upload or a heavy dashboard to access one next step. Language expansion needs native review of critical and consent text when introduced.

### 16.6 Offline behaviour

Separate offline viewing, durable local editing and synchronisation. Caching a page does not prove edits will survive a process crash or merge correctly after reconnecting. Show when a public fact was last checked and when an account change is only pending.

If offline edits are supported, test conflicts, changed account status, sign-out, a deleted account, stale source facts and reconnect retries. Never upload one account's pending edits into a later account session. Avoid promising complete offline capability before these behaviours are demonstrated.

## 17 Parallel delivery and capacity

### 17.1 Main delivery priority

The main ingestion objective remains a reusable, qualified route from publisher discovery to public inventory with original-source corroboration, appropriate curation, freshness handling and recoverable operation. Fix recurring failure classes rather than adding per-advert scripts that appear to demonstrate progress but do not generalise.

Account work should not depend on weakening source guards or publishing private drafts. It can use clearly synthetic test records for implementation while real-source qualification proceeds separately. Synthetic positives establish software behaviour, not live extraction accuracy or publication readiness.

### 17.2 Independent work that can proceed

| Pipeline work in progress | Independent account/workspace work | Coordination boundary |
|---|---|---|
| Provider/source budget wait | Account-flow design, ownership schemas and negative tests | No new provider requests or artificial quota reset |
| Original-method adapter qualification | Tracker views and preparation commands against synthetic records | Reuse the canonical public contract |
| Publication policy qualification | Authentication, recovery and data-lifecycle tests | Keep consumer and operator roles separate |
| Recurring worker qualification | Explicit browser-to-account import | Do not treat UI progress as running-service evidence |
| Source coverage expansion | Participant observation and support design | Record observations without exposing private drafts |

Do not have independent efforts concurrently rewrite shared contracts without an agreed owner and integration point. Concurrent chats or coding sessions also need coordinated file ownership and an honest accounting of review time; additional sessions do not remove integration work.

### 17.3 Work to defer from the first parallel scope

Defer document vaults, arbitrary link fetching, receipt-email ingestion, broad AI coaching, wellbeing modules, public profiles, groups, multi-tenant dashboards and automatic submission. Design their future relationships where needed, but do not implement their full infrastructure before the first personal journey works.

### 17.4 Planning a sprint

Record actual available hours, the main objective, dependent tasks, independent fallback work, evidence required, cost limits and the expected demonstration. Keep a reserve for defects and source/support operations. Use observed capacity to set scope rather than assuming AI assistance removes testing and integration effort.

The proposal's ten-hours-per-week assumption is not a confirmed capacity commitment. Its 16-week calendar includes work whose production reliability and supporting controls are not yet estimated. Replace calendar promises with re-estimated remaining work and measurable completion conditions in the authoritative planning records.

### 17.5 When to pause the secondary effort

Pause expansion when it repeatedly delays the primary release, creates unresolved ownership or migration conflicts, adds support work beyond capacity or depends on an unqualified upstream feature. Continue independent design or observation where useful. A temporary pipeline wait is not permission to broaden every module.

## 18 Recommended work packets

These packets are ordered objectives to map into B/S work packages. They are not fixed-duration sprints or newly committed releases. Close each completed sprint under the repository workflow with appropriate checks, a scoped commit, a push to main and an honest evidence report.

### 18.1 Packet one current baseline and usable data environment

Confirm the current UI/runtime/data configuration, distinguish the design snapshot from real previews, reconcile current tests and inventory stages, identify the supported first publication lane and list its remaining blockers. Prepare one stable environment and an observation script. No deployment or publication is performed merely by completing the plan.

Demonstration: the founder can identify which data is fictional, private or public; a supported real record can be traced through its actual stages; and the next qualification tasks have a concrete scope.

### 18.2 Packet two qualified source to pilot experience

Complete the selected lane's representative positive and negative qualification, normal public projection, change/closure behaviour, restart/quota recovery and operating controls. Check real phone discovery and application handoff. Prepare the controlled pilot's scope, support route and evidence record.

Demonstration: an invited participant can complete the supported public task in the prepared environment, with the release/access conditions actually satisfied. Formal broader acceptance remains separate.

### 18.3 Packet three account identity ownership and lifecycle

Implement one supported consumer authentication method, minimal account data, server-derived ownership, recovery, expiry/sign-out, cross-user denial and the chosen export/deletion processes. Keep consumer permissions distinct from catalogue staff and machine identities. Resolve the adopted age policy for the cohort.

Demonstration: two real test accounts cannot read or mutate each other's records, a user can recover access, and the lifecycle route completes with evidence. Provider identity proves an account session, not the truth of career claims.

### 18.4 Packet four persistent application journey

Implement save-to-application continuity, persistent preparation progress, private notes, one next action, user-reported submission, outcomes and independent source/application states. Add explicit local import and idempotent conflict handling. Test return after a source change and a second-device sign-in.

Demonstration: a pilot user prepares a real application, resumes it later and records what actually happened, while public truth and private history remain distinct.

### 18.5 Packet five dependable reminders

Choose one channel, implement send-time consent/preferences, quiet hours, pause/snooze/cancellation, duplicate suppression, monitored retries and deletion interaction. Use a stable operating environment appropriate to the promise. Preserve deadline uncertainty and message-status semantics.

Demonstration: a user schedules, receives where independently observable, snoozes and stops a reminder; a restart or duplicate event does not cause repeated unwanted messages.

### 18.6 Packet six small planning loop

Add Today, selected tasks, a first micro-step, a short weekly review and a small deterministic set of source/task-change proposals. Implement revision-aware confirmation and recoverable history before broad automatic reflow.

Demonstration: an actual source deadline change creates an understandable proposal, the user edits or confirms it, and valid completed work survives.

### 18.7 Packet seven support or institution experiment

Select one demonstrated support task and named recipient. Implement exact selected sharing and revocation, or prepare a concrete institutional pilot only when its agreement and scope exist. Keep unrelated private data excluded.

Demonstration: the intended recipient can perform the agreed task with the permitted information, and expiry/revocation prevents future access. Commercial results remain separate from successful permissions tests.

## 19 Release evidence and stop conditions

### 19.1 Evidence required before exposing a capability

| Capability | Evidence to retain | Stop condition |
|---|---|---|
| Real public listings | Current source/publication receipts, faithful facts and original-route checks | Unsupported critical fact, wrong destination or unqualified publication lane |
| Controlled discovery | Phone-task observation, public/draft boundary and correction/support readiness | Repeated inability to understand or act on relevant listings |
| Consumer accounts | Genuine supported identity, cross-user denial, recovery and lifecycle evidence | Another user can access data or ownership can be reassigned |
| Persistent tracking | Restart/retry/conflict tests and independent participant resumption | Silent loss, duplicated application history or incorrect source/personal-state coupling |
| Local import | Consent/selection, idempotency and shared-device tests | Automatic upload of unrelated local records or deletion before confirmed persistence |
| Reminders | Current consent checks, cancellation, duplicate/restart and failure evidence | Unwanted sends, misleading delivery claims or unmonitored loss |
| Living plans | Correct source event, explainable proposal, confirmed revision and preserved work | Silent plan changes or suggestions presented as established facts |
| Sharing | Scope/recipient/expiry checks, denial after revocation and recipient task evidence | Private fields leak or old access remains effective |
| Institutional pilot | Concrete workflow, appropriate agreement, permissions and buyer/recipient evidence | No authorised recipient, no useful task or unresolved exposure risk |

Stop conditions apply to the affected capability. They do not automatically require shutting down unrelated public browsing that remains safe and correct. Record the actual scope of a pause and the corrective evidence needed.

### 19.2 Operational readiness for a live experience

Before broader access, name who handles source errors, account support, failed jobs and incidents; define how to restrict a bad record; test backup/restore where relevant; monitor freshness and service failure; and demonstrate rollback without reviving restricted routes or deleted access.

The selected runtime should continue according to its documented promise through credential renewal, process restart and quota limits. A bounded local runner can supply useful development evidence, but a laptop-dependent process must not be described as a dependable hosted scheduler.

### 19.3 Avoid premature completion claims

Do not mark a gate closed because code exists, tests are numerous, a calendar date arrived, a model returned “supported,” one person created an account or a prototype looked polished. Record the actual observation, environment, build, source version, date, participant assistance and remaining limitations.

## 20 Measures for learning and release decisions

### 20.1 Discovery measures

Measure whether people can find something relevant, explain its requirements, identify the correct source/route and take a useful next action. Track broken/expired listings, correction time, coverage gaps, page performance and source-care effort. Counts need dates and denominators.

Raw visits, scrolling time and share-button clicks can describe activity but do not establish application completion or employment impact. When anonymous measurement cannot reliably distinguish people across browsers, state that limitation rather than calling sessions unique users.

### 20.2 Account measures

Track the number of people shown an account invitation at a relevant moment, those who start, those who complete and those who complete the intended application task afterward. Investigate abandonment, recovery failures and confusion about local versus account storage.

The useful activation event is a preserved piece of real work, such as tracking an application and completing or scheduling its next step. Account creation alone is an intermediate event. Do not optimise conversion by blocking public source information or adding pressure.

### 20.3 Workspace and planning measures

Observe return to unfinished work, meaningful preparation actions, corrected records, user-reported applications, follow-ups and outcomes. Keep reported and independently supported outcomes separate. Evaluate whether next-step and planning features reduce friction compared with the user's previous method.

For small cohorts, report counts and specific observed problems rather than impressive percentages. Review patterns across application cycles and distinguish active applicants from people waiting for a future intake. Respect a user who pauses.

### 20.4 Operating measures

Track discovered-to-published stage counts, unnecessary holds and erroneous acceptances in the evaluated set, freshness lag, requests/tokens/cost where known, cost per useful public record, queue delay, failed reminders, support time and cleanup/recovery outcomes. Private provider responses and evaluation artifacts remain outside commits.

### 20.5 Suggested review record

For each review, record the period, cohort definition, capability tested, observed tasks, assistance given, numerator/denominator, failure types, source/runtime revision, operating effort, interpretation and chosen next action. Separate observation from explanation: a user not returning might reflect an irrelevant feed, a closed application window or a poor workspace, and those require different responses.

### 20.6 Decisions from the evidence

If people find relevant listings but lose progress, prioritise persistence and account continuity. If they create accounts but never prepare, inspect the first post-sign-in experience and opportunity relevance. If planning creates more administration than action, simplify it. If source care or support becomes unsustainable, narrow exposed scope or improve operations before expanding distribution.

Do not treat a small fixed retention threshold as a universal business verdict. The workspace spec's percentage targets and stop rules are hypotheses to revisit against the cohort, opportunity season and measurement quality. Institutional willingness to pay needs separate evidence.

## 21 Distribution and first user support

### 21.1 Begin with relevant people and listings

The [distribution plan](../growth/04_LOCAL_DISTRIBUTION_AND_CAREER_NETWORK.md) starts with apprentice peers and school leavers the founder can reach. This guides initial language, sources and observation; it does not permanently exclude other users, national/remote routes or broader career stages.

Use relevant canonical links and a clear explanation of the current service. With actual permission, a willing community administrator or contact can help introduce a controlled pilot. Do not scrape private groups, upload contact lists or represent a conversation as a partnership.

### 21.2 Support the full task

Help participants recover from confusing requirements, failed source routes, lost access and uncertain saved state. Distinguish a source problem from a product bug and from a question only the issuer can answer. The support process must not guarantee eligibility, acceptance or an outcome it cannot establish.

Maintain a small issue log that excludes unnecessary private details. Resolve blocking failures before increasing the cohort. Record support effort because a manually guided success may be expensive to repeat at larger scale.

### 21.3 Expand access gradually

After the small pilot works, invite another manageable group, test self-service onboarding and observe whether support burden grows. Increase public distribution when source coverage, reliability and response capacity can support the promise. Private-beta guidance recommends limited invitations before wider access so feedback and operational capacity can develop. [GOV.UK beta guidance](https://www.gov.uk/service-manual/agile-delivery/how-the-beta-phase-works)

Broad public discovery and broad account registration need not expand on the same day. Keep personal features invitation-only if their support or controls are still being qualified while the public catalogue meets its own release requirements.

## 22 Reconciliation of the new workspace proposal

### 22.1 Account intent is already explicit

The founder-supplied `docs/current/Skilved-Career-Workspace-Product-Spec.md` identifies an Account and Application Tracker release, sign-up/sign-in, verified identity, owner-scoped records, recovery, consent, export and deletion. Its personal workspace is account-based. Anonymous discovery and temporary browser progress do not replace that intention.

This plan preserves that distinction. Earlier consideration of a local tracker is treated as a possible bridge and existing implementation foundation, not the intended long-term storage model for personal career records.

### 22.2 Update the proposal baseline before implementation

Its opening baseline relies heavily on older repository descriptions. Reconcile it with current canonical reads, persistent catalogue services, local continuity and real private-draft evidence. Credit implemented work after checking its actual behaviour; do not repeat old implementation tasks solely because they appear in a proposed schedule.

### 22.3 Resolve release and timeline inconsistencies

The proposal's broad timeline places living plans after February, while its weekly sequence builds them in weeks 10–12. Its release numbers also differ from the existing portfolio. Resolve the mapping before task allocation, and choose capability gates over conflicting calendar labels.

Treat the proposed hourly allowances as unvalidated. Reliable reminders, data deletion, offline conflict handling and selected sharing include failure cases and operating work beyond their visible interfaces. Re-estimate remaining tasks with actual implementation evidence and founder capacity.

### 22.4 Preserve the autonomous ingestion direction

The proposal's manually reviewed source-population step must be reconciled with the accepted publisher-wide autonomous target. Manual review remains an exception and qualification tool where policy requires it; a separately hand-approved listing is not evidence that routine automatic publication has been delivered.

Account and workspace work should consume the canonical published records and preserve private-draft boundaries. It should not introduce a second scraper, a new per-advert quota scheme or a shortcut that publishes unapproved private candidates.

### 22.5 Tighten state and evidence semantics

Keep source closure independent from personal application status. Define what attached evidence does and does not establish. Preserve unknown deadlines/timezones and avoid universal document-age rules. Distinguish proposed changes from applied changes in both the state model and copy.

The living-plan rule catalogue must be internally consistent: if the user must confirm a change, the scenario must not describe it as already silently applied. Consent, sharing and deletion claims must match the actual implementation and external-provider limits.

### 22.6 Keep the ambition without requiring every module now

Maintain the vision of goals, study, selected support, evidence and institutions. Use the initial application journey to establish shared primitives and user understanding. Let later modules reuse those primitives rather than requiring every module to launch simultaneously.

## 23 Risks decisions and practical responses

| Risk or uncertainty | Practical response | Evidence to review |
|---|---|---|
| Extensive scraping produces little usable inventory | Report each pipeline stage and fix recurring supported-source failure classes | Fresh evaluated cohorts, hold reasons and public usefulness |
| A polished demo is mistaken for the current product | Identify environment/data class and make real preview access explicit | Actual runtime configuration and observed pages |
| Accounts add friction before value is clear | Invite at persistent tracking and preserve the intended task | Invitation-to-task observations and abandonment reasons |
| Workspace work delays publication | Bound the parallel scope and keep one main objective per implementer | Actual capacity, unfinished work and milestone movement |
| Local/account transition loses or leaks data | Explicit selected import, idempotency and shared-device tests | Retried/partial imports and cross-account denial |
| Source changes corrupt personal history | Separate versioned public facts from owned application events | Changed/closed/aliased notice regression and user review |
| Reminders become unreliable or unwanted | One channel, send-time permission, monitored retries and cancellation | Duplicate/failure/withdrawal tests and actual support cases |
| General planning expands before value is shown | Start from tracked work and a small deterministic rule set | Independent useful actions and user feedback |
| Sensitive modules increase responsibility too early | Checklist-first data and feature-specific rollout | Inventory, access/lifecycle tests and reviewed scope |
| A tiny pilot is overinterpreted | Report counts, assistance and cohort limits | Observation records and later independent use |
| Institutions request more individual information | Enforce selected permission and validate the actual receiving task | Grant checks, recipient evidence and agreed scope |
| Founder capacity or operating cost is insufficient | Re-estimate scope and narrow the exposed promise | Support/source time, costs and current commitments |

Open decisions include the first supported pilot coverage, actual participants, support owner, approved runtime/access model, consumer authentication method, first-cohort age policy, private-data persistence design, reminder channel and real sprint capacity. Record each decision with its owner, reason and consequence in the [decision register](../governance/14_DECISIONS_AND_ASSUMPTIONS.md) when adopted.

## 24 Practical readiness checklists

### 24.1 Before the first research sessions

- [ ] Identify a few willing prospective users with current relevant tasks.
- [ ] Prepare a short task script and a clear explanation of prototype/pilot status.
- [ ] Separate public, fictional and reviewer-only data in the demonstration.
- [ ] Decide what observations are needed and avoid collecting unnecessary private material.
- [ ] Prepare a place for issues, assistance given and interpretation.

### 24.2 Before usable controlled discovery

- [ ] Verify current appropriately published inventory for the stated task and audience.
- [ ] Demonstrate the qualified publication path and original application route.
- [ ] Preserve draft/public boundaries and restrict unsupported actions.
- [ ] Check changed, closed, empty, missing and unavailable cases.
- [ ] Test the supported journey on representative phones and connections.
- [ ] Name source/correction and participant-support responsibility.
- [ ] Confirm runtime/access readiness and any required deployment decision.
- [ ] State that a narrow pilot does not close formal six-category M0 acceptance.

### 24.3 Before the first account invitations

- [ ] Demonstrate genuine supported authentication and distinct owned records.
- [ ] Pass cross-user, privilege, session-expiry and sign-out checks.
- [ ] Test recovery and the adopted age-policy boundary.
- [ ] Provide a working export/deletion process for the data held.
- [ ] Return users to the opportunity or task that prompted account creation.
- [ ] Show whether each save is local, pending or confirmed in the account.
- [ ] Offer explicit selective import with retry/conflict handling.
- [ ] Keep public discovery available without account creation.

### 24.4 Before broader account access

- [ ] Observe independent resumption and updates across actual application cycles.
- [ ] Resolve material loss, duplicate, privacy and source-history failures.
- [ ] Confirm support and operating capacity for the larger cohort.
- [ ] Test account switching, shared devices and private cache handling.
- [ ] Verify current public facts and private user history remain independent.
- [ ] Publish only the capabilities and service promises that actually work.

### 24.5 Before living plans and support expansion

- [ ] Show the planning feature solves an observed problem in existing work.
- [ ] Explain suggestions and require confirmation where plans change.
- [ ] Preserve valid completed work and handle stale proposals.
- [ ] Test reminder and permission effects of pause/deletion/revocation.
- [ ] Add selected sharing only with exact scope and recipient checks.
- [ ] Validate institutional workflow, recipient authority and pilot demand separately.

## 25 Example journeys through the sequence

### 25.1 An apprentice moves from discovery into preparation

An apprentice receives a public link to a relevant current opportunity. They read the requirements and source evidence without signing in, save it in the browser and return that evening. When they choose persistent tracking, the account invitation explains that preparation and application history will be kept.

After authentication, they confirm which local save to import, see the same opportunity and select a first action. They mark a document task complete, later open the employer route and eventually report that they applied. Skilved preserves the report as their statement. When the intake closes, their application remains awaiting a response rather than being silently closed.

### 25.2 A school leaver needs funding and limited data access

A school leaver browses bursaries on a low-data phone and checks location, education and closing information. An unknown fact remains unknown, with a source or question to pursue. They can use the public route without an account.

If admitted under the adopted account age policy, they create an account to track preparation. The document kit records checklist status without requiring an upload. They select a small next action and, once the reminder service is released, choose whether to receive a reminder. Any required younger-user process follows the actual policy rather than assuming every school leaver is under 18.

### 25.3 A returning applicant uses another device

A user signs in on a different phone and resumes owned application progress. The interface identifies a changed source revision while retaining their notes and submission history. They review the change and confirm a relevant task update.

On sign-out, the account session and private cached access are removed according to the implemented policy. Another person using that phone cannot view the prior account's records. Unrelated signed-out local saves are handled through the clearly explained device policy.

### 25.4 A user brings an opportunity Skilved does not list

A user creates a private tracker entry for a public opportunity found elsewhere. They enter a URL, title and their understanding of the deadline. Skilved labels it as user-entered and allows notes and next actions without inventing verification.

If a supported checked public record later becomes available, the user can review a proposed link or identity reconciliation. Their history is preserved. The private lead never becomes public merely because it exists in an account.

### 25.5 An active user begins a living plan

A user already tracking several applications adds a study deadline. Today shows selected actions from their real work. When a source deadline moves earlier, a proposal explains which preparation tasks could move and why. The user edits and confirms it against the current plan.

During a difficult week, they choose a reduced plan without entering health information. A short review records what helped and what should change. Only after this loop is useful does the product invite broader goals or richer support.

### 25.6 A coordinator helps through selected access

A user wants a coordinator to help resolve a specific blocker. They preview a limited summary, choose the recipient and expiry, and grant access. The coordinator sees the selected information and can perform the agreed task without access to unrelated notes or documents.

Expiry or revocation denies future requests. Any later institutional pilot uses its own agreed workflow, appropriate permissions and outcome definitions. A successful support interaction is useful evidence; it is not automatically a paid partnership or a confirmed placement.

## 26 Sources authority and maintenance

### 26.1 Repository authorities

- [Product strategy](../product/01_PRODUCT_STRATEGY.md) defines the complete career-platform ambition.
- [Product requirements](../product/02_PRODUCT_REQUIREMENTS.md) preserves requirement families, account ownership and the broader capability portfolio.
- [Discovery-first MVP](../product/03_DISCOVERY_FIRST_MVP.md) defines the first public release and six-category scope.
- [Autonomous opportunity target](../engineering/17_AUTONOMOUS_OPPORTUNITY_SYSTEM.md) defines the current ingestion direction and its qualification gaps.
- [Current delivery status](05_M0_DELIVERY_STATUS.md) records what has actual evidence and what remains open.
- [Chronological M0 runbook](04_M0_CHRONOLOGICAL_BUILD_RUNBOOK.md) and [M0 delivery plan](03_M0_COMPANION_DELIVERY_PLAN.md) retain execution and slice allocation.
- [Build roadmap](15_BUILD_ROADMAP.md) and [sprint backlog](16_SPRINT_BACKLOG.md) retain portfolio sequencing, work packages and estimate authority.
- [Canonical opportunity contract](../engineering/14_CANONICAL_OPPORTUNITY_CONTRACT.md) and [data and API conventions](../engineering/07_DATA_AND_API_CONTRACTS.md) govern shared data and protected operations.
- [Distribution and career-network plan](../growth/04_LOCAL_DISTRIBUTION_AND_CAREER_NETWORK.md) defines initial channels and staged social development.
- [Institutional business model](../commercial/03_TVET_SDF_AND_EMPLOYER_BUSINESS_MODEL.md) retains the proposed free-consumer and institutional-buyer direction.
- [Trust privacy and safety](../security/10_TRUST_PRIVACY_AND_SAFETY.md), [threat model](../security/01_THREAT_MODEL.md) and [data governance](../governance/03_DATA_GOVERNANCE_AND_RETENTION.md) govern the relevant data and access requirements.
- [Validation and release](../quality/11_VALIDATION_AND_RELEASE.md) and [discovery acceptance](../quality/02_DISCOVERY_COMPANION_ACCEPTANCE.md) govern evidence and formal release decisions.

### 26.2 Dated evidence used for the baseline

- [Real private draft and authenticated applicant preview on 2 November](../operations/215_REAL_PRIVATE_DRAFT_AND_APPLICANT_PREVIEW_2026-11-02.md).
- [Controlled live publisher shadow batch on 2 November](../operations/217_LIVE_PUBLISHER_SHADOW_BATCH_2026-11-02.md).
- [Live controller resumption on 3 November](../operations/219_LIVE_CONTROLLER_RESUMPTION_2026-11-03.md).
- [Bounded local runner on 3 November](../operations/220_BOUNDED_LOCAL_RUNNER_2026-11-03.md).
- [Credential expiry recovery and pending replacement attempt on 3 November](../operations/221_LOCAL_CREDENTIAL_EXPIRY_RECOVERY_2026-11-03.md).

The founder-supplied career-workspace product proposal is a planning input whose account intent and major reconciliation points are recorded in section 22. Its file is preserved separately; inclusion of its ideas here does not silently adopt every module, estimate, release number or date as a committed delivery plan.

### 26.3 External implementation and design guidance

- [GOV.UK Create accounts](https://design-system.service.gov.uk/patterns/create-accounts/) supports introducing accounts when repeated personal access is useful and minimising interruption before account creation.
- [GOV.UK How the beta phase works](https://www.gov.uk/service-manual/agile-delivery/how-the-beta-phase-works) describes limited private invitations, iteration and operating capacity before broader access.
- [Firebase Retry asynchronous functions](https://firebase.google.com/docs/functions/retries) describes event-delivery/retry semantics relevant to dependable background actions.

These sources support particular design and engineering choices. They do not establish Skilved adoption, security, compliance, cost or outcomes. They were checked during the 3 November planning discussion.

### 26.4 Updating this plan

At each meaningful release review, update the dated status, adopted decisions, current user cohort, exposed capabilities, actual evidence and remaining blockers. Preserve historical reports rather than rewriting failed trials as successes. Record scope changes once in the relevant backlog and avoid counting the same work across this plan and the workspace proposal.

The immediate operating sequence remains: make real opportunities usable, observe a small group, introduce accounts around persistent work, complete application follow-through and extend the connected career workspace from demonstrated needs.

## Appendix terms used in this plan

| Term | Meaning in this plan |
|---|---|
| Account | A distinct authenticated person with owned records, recovery and a data lifecycle |
| Public discovery | Browsing released opportunity information without needing a personal account |
| Browser-local progress | Data stored in one browser/device, with no implied account backup or cross-device access |
| Persistent workspace | Owned preparation and career records that survive server restarts and can be resumed through the account |
| Controlled pilot | A limited invited rollout with a stated scope, support responsibility and appropriate release controls |
| Formal M0 | The existing discovery-first public MVP with its six-category scope and formal acceptance requirements |
| Private draft | A candidate stored for review or shadow evaluation that is not publicly released |
| Public projection | The permitted published fields served to the public, separate from internal source/reviewer records |
| Shadow mode | A processing lane that records private outcomes while keeping automatic public publication disabled |
| Qualification | Evidence that a specific source, adapter or processing/publication lane meets its defined acceptance criteria |
| Hold | A recorded reason a candidate cannot advance until required evidence or conditions are satisfied |
| Original-source corroboration | Checking that employer-origin evidence supports the particular vacancy/intake and relevant facts or route |
| Canonical identity | The stable identity used to distinguish and connect records without treating a similar title as the same intake |
| Revision | A particular version of a record used to detect change and prevent stale edits |
| Idempotent command | An operation whose safe retry does not create a duplicate application, publication or other unintended repeated result |
| User report | A statement the user records, such as having applied, which is not automatically independent confirmation |
| Evidence class | The kind and source of support for a statement, such as a user report, receipt or authorised issuer confirmation |
| Next move | A user-chosen near-term outcome that connects a goal to practical work |
| Micro-step | A small first action that helps the user begin a task |
| Reflow | A proposed adjustment to tasks or dates following a change in deadlines, progress or available time |
| Access grant | A scoped permission for a specific recipient, purpose and period, with future access revocable |
| Machine identity | The service identity used by an authorised worker, separate from an end user's account or staff login |
| Durable orchestration | Stored work and recoverable execution that can continue through restarts and configured waiting conditions |
| Exit evidence | The observed result needed to move a capability or rollout stage forward |
| Outcome | A reported or supported event such as an interview, offer, start or completion, with its evidence class retained |
