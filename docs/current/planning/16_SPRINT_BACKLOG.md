# Sprint backlog and delivery work packages

Accepted companion update, 13 September 2026: execute [B01–B10](03_M0_COMPANION_DELIVERY_PLAN.md) for [M0-A–G](../product/03_DISCOVERY_FIRST_MVP.md) before the full career workspace. These detailed slices replace the earlier five-group launch outline and draw from S01–S04/S06/S10/S11. The proposed M0 estimate is 160–288 inclusive hours, subject to B01/S01 audit and overlap reconciliation. Source panels, faithful explanations, local progress, structured sharing and safe public-link intake are accepted M0 work. Later trends, full accounts/agents and the social network retain their separate gates. Existing S-package ranges remain the earlier expanded-portfolio baseline, not an additional M0 bill or first-launch promise.

Date: 11 September 2026. Status: proposed, uncalibrated backlog. All packages start **NOT STARTED / baseline unverified** unless completion evidence is subsequently linked.

## Sprint method

Use two-week review iterations. The reference capacity is 20 gross hours/week with 25% unallocated contingency, giving 30 planned hours/iteration. S01–S35 are work packages, not guaranteed two-week durations. Split high-range packages into smaller demonstrable slices. A package ends when its acceptance evidence exists, not when its calendar slot expires.

Every package includes design, implementation, appropriate tests, documentation and feedback work in the stated range. These hours are the same inclusive hours in the roadmap. Do not add AI-agent estimates or separate QA allocations to them again. External waiting time is separately tracked. Owner defaults to founder/implementer; a named reviewer/customer/coordinator is a dependency, not an assumed employee.

For every issue record: package ID, requirement ID, owner, dependency, estimate, acceptance test, evidence link, cost impact and current status. Translate product/engineering IDs from the linked canonical specifications into implementation issues as work begins.

## R0: foundation (50–80 hours)

### S01 — Reproducible baseline and execution plan (20–30 h)

- **Depends on:** current docs and repository access.
- Inventory runtime, package/import failures, deployment claims, sample-data paths and existing cloud resources read-only. Preserve uncommitted user work.
- Reproduce build/typecheck/test commands; record actual failures and supported commands. Establish CI checks and secret-safe environment documentation.
- Catalogue all six category paths and user/account states; mark mocks separately.
- Observe first users' actual workflow and record sustainable project time for the iteration.
- **Demo:** a fresh checkout/emulator session starts from documented steps; known gaps are visible.
- **Exit:** baseline report, CI result, implementation issue list and first evidence notes. No fabricated readiness score.
- **Risk:** unknown dependency/runtime breakage; re-estimate S02 if the baseline requires substantial repair.

### S02 — Ownership, roles and shared domain foundation (30–50 h)

- **Depends on:** S01.
- Implement managed sign-in/session verification and persistent user-owned records.
- Protect privileged role fields; fix cross-user document/screenshot access and distinguish public web from private workers.
- Create canonical six-category IDs, unknown values, source/intake IDs, dates and shared schemas.
- Add authorization tests, account recovery baseline, environment separation and synthetic-data controls.
- **Demo:** two users create records; neither can read/edit the other's private material or grant themselves admin.
- **Exit:** access tests pass, demo verification removed from real paths, one real persistence round trip and documented rollback.
- **Risk:** auth changes affect all later features; complete the foundation rather than bypassing it for a demo.

## R1: supervised alpha (100–160 hours)

### S03 — Source register and first real ingestion (25–40 h)

- **Depends on:** S02.
- Assess permitted source methods; select initial source coverage across all six categories.
- Implement one real source adapter end-to-end, then use shared contracts for additional allowed sources.
- Store provenance, original notice, reference/intake, extracted fields and review state; isolate fixtures.
- Resolve aggregator leads to the issuer notice and application route, keeping their identities separate; record route/platform uncertainty and assess permitted direct monitoring of resolved issuers. Follow the [ATS source-resolution strategy](../engineering/03_ATS_ADAPTER_STRATEGY.md).
- Add a manual/submitted-link route so discovery gaps do not make preparation impossible.
- **Demo:** source notice becomes a draft listing with exact origin and unknowns preserved.
- **Exit:** source register, representative genuine records and rejection examples; no permission presumed.
- **Risk:** source access is denied or unstable; use allowed substitutes without bypassing access controls.

### S04 — Review, deduplication, freshness and public discovery (25–40 h)

- **Depends on:** S03.
- Build operator review/correction queue, source aliases, intake-aware duplicate handling and expiry states.
- Wire actual persisted listings to existing feed/detail/filter/share UI.
- Show last successful check separately from first discovery and failed refresh.
- Add category-specific tests for deadlines, multiple locations, funding versus pay and unknown fields.
- **Demo:** duplicate notices merge appropriately; a separate intake stays separate; a closed listing changes state.
- **Exit:** source-quality sample and public six-category navigation with honest inventory.
- **Risk:** excessive manual review; measure time before increasing crawl volume.

### S05 — Living record and selected evidence (25–40 h)

- **Depends on:** S02; may overlap source work when capacity exists.
- Implement editable education, actual experience, contributions, projects and reference records.
- Add selected sharing/export, private file metadata, file-size/type controls and user-reviewed import drafts.
- Separate self-report, reviewed extraction, observer confirmation and issuer evidence.
- **Demo:** the same person creates different selected views for study funding and work without disclosing unrelated private files.
- **Exit:** recipient can read an export, access can be withdrawn for hosted sharing and current record changes do not alter saved snapshots.
- **Risk:** overclaiming evidence; keep trust labels precise and unsupported facts absent.

### S06 — Opportunity workspace and supervised journey (25–40 h)

- **Depends on:** S04 and S05.
- Turn source requirements into checklists with mandatory/preferred/conditional and unknown states.
- Support missing-item tasks, selected evidence pack, truthful drafts and external application handoff.
- Capture application snapshot and distinguish opening an external site from reported/acknowledged submission.
- Preserve route-specific instructions, required candidate facts and portal/email/hybrid steps without assuming automatic submission or inventing missing declarations.
- Conduct supervised tasks with apprentice peers and school leavers; include all six category journeys in representative tests.
- **Demo:** a user prepares a real opportunity and explains the remaining step without founder coaching.
- **Exit:** observed preparation, error log, corrected problems and first recipient feedback.
- **Risk:** enthusiasm hides friction; measure successful tasks rather than only asking whether users like it.

## R2: public MVP (140–220 hours)

### S07 — Durable personal missions (30–45 h)

- **Depends on:** S06.
- Implement task owner, mandate, status, source/document versions, next action, atomic claims, retry/backoff and leases.
- Use idempotency and outbox receipts for notifications/external actions; recover after restart.
- Add user pause/stop, scope change invalidation and activity history.
- **Demo:** a preparation mission waits for a document, resumes when supplied and does not duplicate work after a retry.
- **Exit:** failure-injection and cancellation tests, no silent permissions or false completion.
- **Risk:** distributed side effects; prioritize safety and traceability over dramatic autonomous demos.

### S08 — Helpful guidance and model evaluation (30–50 h)

- **Depends on:** S05–S07.
- Implement bounded extraction and drafting through a replaceable model adapter.
- Build test cases for invented qualifications, missing evidence, ambiguity, language clarity and malicious source text.
- Add deterministic eligibility explanations and short next-step plans, with escalation for uncertain interpretations.
- Measure token/call/runtime cost and cache repeated source work appropriately.
- **Demo:** update a genuine fact and see a grounded plan change; incorrect or ambiguous input stays visible.
- **Exit:** evaluation report, human-review conditions and measured cost sample.
- **Risk:** model fluency looks like accuracy; retain evidence and explicit unsupported-result tests.

### S09 — Follow-through and notification controls (25–45 h)

- **Depends on:** S07.
- Add source changes/deadlines, user-selected cadence, opt-in notification channel, unsubscribe and deduplication.
- Record assessments/interviews, decisions, acceptance, starts and completion with category-specific semantics.
- Track unknown outcomes honestly; do not treat non-response as rejection.
- **Demo:** material deadline change produces one useful notification; stopping a task stops further notifications.
- **Exit:** consent/delivery tests, explicit submission provenance and stage-specific outcome records.
- **Risk:** messaging costs/permission delays; retain in-app updates and supported channels without making paid WhatsApp integration mandatory.

### S10 — Accessibility, privacy and operator readiness (25–40 h)

- **Depends on:** S06–S09.
- Test mobile/low-data paths, keyboard/screen-reader use, plain language and shared-device sign-out behaviour.
- Complete deletion/export, access expiry, private uploads, account recovery and reporting workflows.
- Establish adult supervised pilot and under-18 participation readiness according to the trust specification.
- Build minimal support/source/task dashboards and document realistic response ownership.
- **Demo:** private report is triaged, user export works and unauthorized requests fail.
- **Exit:** release security/accessibility checks and operating runbooks.
- **Risk:** support promises beyond availability; publish measured support expectations.

### S11 — Public release and first commercial experiment (30–40 h)

- **Depends on:** S10 and applicable release gates.
- Run end-to-end representative six-category checks, restore drill, load/cost sample and smoke deployment.
- Publish honest coverage, limitations, privacy/help pages and grounded product messaging.
- Invite consenting first users; run the benchmark baseline and stage-based activation/retention measurement.
- Present the existing paid pilot to a relevant coordinator after discovery; invoice/deliver only if agreed.
- **Demo:** public discovery to private preparation to truthful next-step record, plus a clearly labelled commercial demo.
- **Exit:** R2 evidence pack, measured costs, no critical unresolved release failures and commercial experiment outcome recorded separately.
- **Risk:** launch attention exceeds support capacity; use explicit invitations/rate limits and funded operational expansion.

## R3: useful network and coordinator product (180–300 hours)

Each package below is estimated at **30–50 hours**, including its evaluation and operating work.

| Package | Depends on | Build and demonstrate | Exit evidence |
|---|---|---|---|
| S12 — Structured help | S11 | Scoped requests, invited helper, accept/decline/resolved states, context-specific privacy and reporting | Real requests resolved; compare coordinator/user effort to existing messages |
| S13 — Invited groups | S12 | Cohort onboarding, group purpose, scoped visibility, moderator tools, no document leakage | Role/abuse tests and useful group task completion; under-18 participation only with readiness |
| S14 — Contributions and references | S05,S13 | Team activity with individual credit, named observer confirmations, corrections and selective sharing | Contributors/referees complete an actual confirmation; no unobserved competence claim |
| S15 — Coordinator workflow | S12–S14 | Organisation membership, missing-item queue, batch factual requests, consented progress export | Measured staff time, permission audit and one end-to-end cohort process |
| S16 — Buyer workflow and billing | S15 | Defined offer, plan/seat/cohort entitlement chosen from evidence, invoice/payment tracking and cancellation | Real purchase decision recorded; delivery margin/costs tracked, no artificial traction |
| S17 — Retention, sharing and recipient acceptance | S12–S16 | Test stage-based digest, reusable packs, collaborator/referee invitations, a consented showcase, a bounded manually assessed-project pilot and a basic recipient-acknowledged referral | Voluntary useful repeat use, recipient feedback, pilot rubric/assessment provenance, authentic referral outcomes and R3 review |

If useful social behaviour or willingness to pay fails to emerge, change that hypothesis before building all remaining R3 packages. Core individual utility remains available. One sale does not prove scalable acquisition or product-market fit.

The S17 manual pilots cover PRD-046/047 within the existing group/evidence workflow. They do not build the full assessment engine or multi-organisation referral lifecycle; those belong to S19/S21. S17 also covers the small post-start goal change and suppression of irrelevant application reminders required by PRD-033. Keep pilots bounded and re-estimate S17 if recipient or assessment requirements add material implementation work beyond its original range.

## R4: institutional continuity (320–520 hours)

Each package below is estimated at **40–65 hours**. Partner waiting time and qualification-specific validation are additional calendar dependencies.

| Package | Depends on | Build and demonstrate | Exit evidence |
|---|---|---|---|
| S18 — Practical logbooks | S14,S15 | Activity/evidence templates, supervisor observations, individual contribution and programme-specific requirements | A real programme uses the record during work; staff workload measured |
| S19 — Assessments and challenges | S18 | Published rubric, assessor identity, feedback, participation vs competence distinction and dispute flow | Independent recipient understands what completion establishes; no fake credentials |
| S20 — Programme transitions | S15,S18 | Acceptance/onboarding, private check-ins, obstacles, source-backed programme renewal requirements/reminders, exit pack and continued personal access | Programme participant starts/continues/exits with accurate records; support and agreed renewal paths work |
| S21 — Referrals and handovers | S12,S15,S20 | Selective context, receiving organisation acknowledgement, capacity/decline and follow-through | Actual partner accepts or declines referrals without losing context or excessive data sharing |
| S22 — RPL preparation | S18,S19 + authorised provider | Map existing evidence to provider-specified requirements; preserve formal assessor responsibility | Provider reviews an actual prepared portfolio and states its accepted scope |
| S23 — Credential interoperability | S19 + issuer/recipient | Adopt an appropriate supported format, issuer provenance, validity/revocation, import/export and recovery | Real issuer/recipient exchange passes tests; no claimed standards certification without it |
| S24 — Authorised official integrations | S23 + access agreement | Implement only requested MyMzansi/qualification or partner APIs with versioning and consent | Access terms, test receipts, revocation and failure/recovery evidence |
| S25 — Institutional architecture and release | S18–S24 where justified | Review SQL/query needs, security boundaries, audit exports, retention, localisation and operating economics | R4 evidence pack and repeat institutional value; dependencies not ready remain explicitly deferred |

S24 is not mandatory for earlier releases or for every R4 customer. Complete the useful independent institutional workflow and record official integrations as pending if access does not exist.

## R5: advanced capability and expansion (500–900 hours)

Each package below is an initial **50–90 hour discovery/build envelope**, re-estimated after prerequisites. These are conditional options, not an instruction to build every proposed analytics product. National adoption and international operations are not included as guaranteed outcomes of these engineering hours.

| Package | Depends on | Proposed work | Prerequisite / acceptance evidence |
|---|---|---|---|
| S26 — Supported application routes | R2 reliability + issuer permission | One authorised API/email/ATS adapter at a time; declarations, attachments and receipts | Representative successful/failure cases, scope-specific mandates and manual fallback; no CAPTCHA bypass dependency |
| S27 — Better pathway guidance | R4 records + evaluation data | Compare evidenced alternatives, prerequisites and costs; show uncertainty | Held-out evaluation, bias/error analysis and appropriate claims; no causal salary promise |
| S28 — Collective insights | Suitable consented dataset | Cohort observations and support patterns with privacy thresholds | Representativeness/selection limits disclosed; suppression and re-identification tests |
| S29 — Skills intelligence | Buyer/research need + sound methodology | Aggregate opportunity/skills reporting, documented coverage and trend limits | Independent methodology review; platform counts not presented as national labour totals |
| S30 — Organisation feedback | S28 + governance | Structured feedback, response/correction, evidence windows and publication rules | Adequate evidence and dispute capacity; public grades can remain unlaunched |
| S31 — Country discovery | R3/R4 repeat value | Select one expansion market by actual demand, source access, language and partner research | Country business case and locally reviewed source/privacy/support plan |
| S32 — Country release | S31 | Configurable requirements, documents, language, date/currency and local support | Local user/recipient pilot passes the same quality and economics gates |
| S33 — Further sectors and work types | R4 + segment demand | Professional records, continuing development or gig-experience support; separate marketplace discovery | New workflow validated without corrupting core evidence meanings |
| S34 — Platform and integration scale | Repeated external demand | Stable external APIs, organisation integrations, stronger operations and integration billing if justified | Partner contracts, usage, reliability and sustainable support; no premature multi-cloud requirement |
| S35 — Portfolio review and next roadmap | Completed valid workstreams | Assess outcomes, unit economics, customer concentration, resilience and next strategic options | Evidence-backed investment plan; retire weak bets and publish honest scope |

## Post-M0 strategic research and continuing learning

13 September sequencing takes precedence over the earlier allocations below: retain only launch-relevant source, usability, data and operation checks before M0. Start the broader INV-01–18 programme after M0, with consumer task observations in the first two weeks and institutional workflow/buyer investigations in the proposed weeks 2–6 window. These are relative planning windows, dependent on access; the founder owns dated tasks and review decisions. See the M0 specification for complete ID coverage. Do not require institutional interviews or payment to launch discovery.

Research priorities update, 12 September 2026: use [INV-01–18](../research/02_STRATEGIC_INVESTIGATIONS_AND_PRODUCT_OPTIONS.md) to direct existing research work. Before a paid institutional build commitment, establish the recent failure, installed alternative, accepted output, participant burden and actual buying process. S01/S06/S11 carry initial evidence gathering; S15 acceptance must compare the customer's existing workflow with that workflow plus Skilved. These are sharper discovery/acceptance conditions, not eighteen extra implementation packages or a claim of completed research.

Institutional revenue update, 12 September 2026: the [TVET/SDF/employer model](../commercial/03_TVET_SDF_AND_EMPLOYER_BUSINESS_MODEL.md) replaces applicant charging with a free consumer tier. S01/S06/S11 investigate an actual institutional reporting/evidence workflow and budget owner; S15 tests its scoped organisation workspace and versioned requirements, S16 prices/bills the organisation, and S18/S20 deepen programme milestones. Detailed grant-rule automation or WSP/ATR functionality requires validated scope and re-estimation. The optional small paid service tests repeatable product value; it does not replace institutional software or become a public-MVP gate.

ATS clarification, 12 September 2026: use the [dedicated adapter strategy](../engineering/03_ATS_ADAPTER_STRATEGY.md) for S26 contracts and ATS-01–ATS-12 acceptance cases. S26 starts with one evidenced route, not a promised percentage of national coverage. Its prerequisite is R2 reliability and route-specific authority/readiness; moving a bounded slice earlier requires an explicit roadmap/capacity revision rather than waiting mechanically for every R3/R4 feature or silently enlarging the MVP. Broad adapter work remains conditional in the present allocation.

Every iteration includes feature-relevant observation or delivery feedback. Earlier estimates included research effort; reallocation to M0 and later releases must avoid double counting and include new scope explicitly. A coordinator service can run after M0 and before R2 when separately ready; its contracted delivery hours reduce available product capacity. Keep personal conversations, raw documents and real invoices outside public documentation.

## Definition of ready

The task has a user/purpose, relevant requirement, data/permission boundary, dependency owner, demonstration, testable exit and operating-cost implication. Anything depending on external access has an independent fallback or remains pending.

## Definition of done

The feature works on real or explicitly labelled test inputs; negative/permission cases pass; state and evidence are truthful; useful feedback is recorded; documentation matches; no sensitive data leaks; costs and known limits are understood. Public release additionally needs [release checks](../quality/11_VALIDATION_AND_RELEASE.md).

## Replanning triggers

- Two iterations show a material capacity or estimate mismatch.
- A source, API or partner denies/changes access.
- A privacy/security failure or materially wrong requirement is discovered.
- The observed workflow does not deliver the proposed benefit.
- Costs or support demand exceed resources actually available.
- A paying customer requests a coherent higher-value adjacent workflow.

Record the choice and consequence in [decisions](../governance/14_DECISIONS_AND_ASSUMPTIONS.md). Do not compensate for a failed gate by changing a metric definition after seeing results.
