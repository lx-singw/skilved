# M0 chronological build runbook

Updated: 24 September 2026. Status: execution specification, not completed implementation or a dated delivery promise. Owner: founder as product/release decision-maker; implementer owns code and checks; source/support operator owns review and service coverage. One person may hold these roles; record actual names and availability before the relevant gate.

## 1. Start here and finish here

This is the chronological implementation guide for the first public MVP. Read it with the [current status and blockers](05_M0_DELIVERY_STATUS.md). The [product specification](../product/03_DISCOVERY_FIRST_MVP.md) owns M0-A–G scope; [B01–B10](03_M0_COMPANION_DELIVERY_PLAN.md) owns slice allocation and estimate history; the [roadmap](15_BUILD_ROADMAP.md) retains the full R0–R5 destination. This runbook decomposes existing B slices; it adds no new release or extra set of hours.

**Working MVP outcome:** a signed-out person can find a real work/study opportunity, understand its source-backed conditions, save and resume locally, export/share its public checklist, reach the issuer's application route, report a problem and suggest a supported public link with private receipt access. An operator can ingest, review, publish, recheck, correct, withhold and close records, and recover the service. All six categories, both internship subtypes and broad job support are included. The consumer service is free.

Today only the public-web foundation has recorded passing local checks. The catalogue is empty. Follow the remaining B01 tasks first; do not start again by restoring prototype listings or building full learner accounts. No planning document can ensure source access or successful implementation: missing dependencies remain visible, and a failed gate requires corrective work before the dependent release proceeds.

## 2. Phase order and gates

| Phase | Build order | Demonstrable output | Gate to leave the phase |
|---|---|---|---|
| P0 — Foundation | B01 | Reproducible selected web, isolated unfinished routes, environment/deployment decision and task prototype | G0: checks reproducible, technical boundary recorded, initial budgets and remaining-work forecast recorded |
| P1 — Trusted catalogue | B02 → B03 | One canonical contract, persistent source/review pipeline and approved public projection | G1: six-category contract tests pass; one real permitted source reaches reviewed publication; unauthorized publication and unsafe fetching fail; correction/withholding works |
| P2 — Useful discovery | B04 | Feed/filter/detail/checklist/report/handoff on reviewed records | G2: signed-out source-to-action journey works; unknowns, closed records and failed requests handled honestly |
| P3 — Continuity and reach | B05 → B06 → B07 → B08 | Local progress, safe suggestions, public exports/sharing, issuer pages and shelves | G3: all M0-A–G behaviours integrated; private receipts/local state excluded from public outputs; change/closure propagates |
| P4 — Release candidate | B09 | Tested complete candidate, useful six-category coverage and rehearsed operations | G4: affected DCF/security/source checks pass, device/cost budgets met, notices and operators ready, staging recovery demonstrated |
| P5 — Launch and stabilise | B10 | Deployed, monitored working MVP with real-task and rollback evidence | G5 / REL-M0: release decision, production smoke, initial observation and critical-fix verification complete |

The default single-implementer order is B01 through B10. After B04, B05–B08 are technically separable, but this plan allocates them sequentially. Parallel execution requires real capacity and coordinated shared-contract changes; it is not assumed. A local prototype may use labelled fixtures before the pipeline exists; a public catalogue may not.

## 3. How phases become actual sprints

Use two-week timeboxes. The ten sprint plans below are ordered objectives, **not a guarantee of ten two-week sprints**. At each planning meeting take the next unfinished tasks whose dependencies are satisfied. At the illustrative 20 gross hours/week, the existing 25% reserve leaves at most 30 planned hours per sprint. Confirm real capacity before putting dates on it.

Before a sprint starts, record its actual iteration number, dates, available/planned hours, selected task IDs, estimate per task, owner, dependencies, demonstration and evidence destination in the status record. Split an oversized objective at its listed task boundaries. For example, a B03 estimate above available capacity becomes separate ingestion and review/publication iterations; later work moves, and no gate is marked done just because two weeks passed. Several small completed objectives may share a timebox if dependencies and capacity permit.

Keep one main implementation objective in progress per implementer. Fix a failed prerequisite before opening dependent functionality. While an external dependency is blocked, work on independent contracts, synthetic negative tests or UI states, labelled accordingly; do not count that as live-source or deployment evidence. Review completed acceptance, actual hours, remaining estimate, source/support burden and blockers at every sprint end.

The old 160–288 hours is a pre-refinement baseline. Re-estimate **remaining task work**, including the adopted checklist export, CI/persistence/security repairs and real curation, during B01. Record completed work separately; do not subtract guessed hours or add B tasks to the same S-package hours. Calendar follows remaining effort, observed capacity and external waits. Estimates do not determine whether acceptance is required.

## 4. Ordered sprint plans and implementation tasks

Task IDs below are stable issue identifiers within existing B slices. Execute lettered tasks in order unless a stated independent test/design task can proceed safely. Every task includes its relevant tests and documentation; the final regression phase integrates and repeats affected journeys rather than postponing quality until the end.

### Sprint plan 1 — B01: finish the build foundation

Entry: repository and current documentation. Existing local boundary evidence is linked in the status record. Implementation surface: root/web scripts, CI, selected package dependencies, environment configuration and delivery records.

| Task | Concrete work and output |
|---|---|
| B01a | Reconcile the dated baseline and public-route inventory with the current revision. Preserve the 29 isolated prototype files. Retain actual lint/typecheck/build/HTTP evidence and explicit excluded-package findings; rerun when relevant code/configuration changes. |
| B01b | Reproduce a lockfile-consistent install in a clean isolated checkout without production secrets. Add CI for selected lint, typecheck, build and public-boundary tests, retaining logs. Document runtime, required variable names/purposes, emulator/test defaults and how each selected service starts. |
| B01c | Record the deployment decision: public Next web, private source/review execution, persistent store, operator authentication, approved-fetch boundary, staging/production separation and rollback approach. Start from the existing Google/Firebase reference; choose a justified alternative explicitly if needed. Inventory required access and cost limits; do not provision simply because it is listed here. |
| B01d | Build/observe a labelled discovery/detail task prototype; define reference phone/network and initial measurement procedure. Set provisional numeric page/JS, latency, source/queue and cost limits from the observation, with owner and review date. Create the remaining-task estimate and first dated sprint plan from actual availability. |

Demo/exit G0: another clean local session can run the selected checks; unsupported personal/actions remain denied; configuration/deployment choices and initial task/budget evidence are recorded. No full-account or agent build is required. A source-linked prototype is usability/design evidence, not a live pipeline. DCF-18/19/22/24 are partial at this stage; final integrated results come later.

### Sprint plan 2 — B02: one six-category contract

Entry: G0; a contract-only spike may precede G0 closure but does not close B02. Surface: shared types/runtime schemas, web types/adapters, store schema and public API contracts.

| Task | Concrete work and output |
|---|---|
| B02a | Consolidate the canonical category enum and runtime validation across web/worker/store: bursary, learnership, apprenticeship, internship, graduate programme, job. Add student/WIL and graduate internship distinctions; retain other-stated/unknown subtype semantics and jobs beyond entry level. Remove incompatible duplicate taxonomies from the production path. |
| B02b | Implement source-linked facts, requirements with AND/OR/conditional logic, deadline uncertainty, location versus residence, compensation components, organisation roles, application destinations, scoped checks and explanation provenance. Define a whitelist public projection distinct from draft/reviewer/source payloads. |
| B02c | Specify versioned public read contracts, pagination/filter/error semantics, stable IDs/aliases and publication revisions. Reconcile legacy routes with `/api/v1`; migrate deliberately without exposing prototype APIs. Define storage schema/index needs, upgrade/backfill and rollback compatibility; if no persistent records exist, record that fact rather than inventing a migration run. |
| B02d | Add labelled six-category fixtures plus unknown/conflicting facts, both internships, broad jobs, date-only deadlines, mixed compensation, separate intakes and withheld/draft records. Test runtime rejection, projection privacy and deterministic requirement/date logic. |

Demo/exit: fixtures travel through one validated public contract and render a minimal inspection view; private fields never enter it. This establishes contract support, not real catalogue coverage. DCF-01/02/04/05/06/22; PRD families follow the M0 scope mapping.

### Sprint plan 3 — B03: source to reviewed, persistent publication

Entry: B02 complete and chosen storage/operator/fetch boundary. Surface: source adapter/worker, persistence repository, protected review controls, publication/read API and source register. Begin with emulators and controlled test identities; hosted access must be ready before staging qualification.

| Task | Concrete work and output |
|---|---|
| B03a | Create source register entries with method/access/reuse evidence, category coverage, reviewer, limits and recheck cadence. Implement one permitted real adapter through bounded allowlisted retrieval and extraction into drafts. Reject unsafe destinations/redirects and untrusted instructions before any remote-fetch feature is exposed. Keep manual review; add further permitted adapters through the same contract. |
| B03b | Implement persistent source versions, draft records, deduplication candidates/alias decisions and restartable ingestion/recheck jobs with bounded retries and idempotency. Prove persistence across restart, failed fetch preserving the last successful check, and distinct intakes surviving deduplication. No per-visit crawl or inference. |
| B03c | Build operator-only review/publish/correct/withhold/close and report-triage controls, with server-verified identity, protected reviewer roles, expected revisions and audit records. A protected command/tool is acceptable initially if all operating tasks are usable and audited. Implement bounded report intake/acknowledgement; never publish from a report or model alone. |
| B03d | Serve only approved versioned projections through public reads. Implement recheck scheduling, source pause, atomic publication/invalidation and safe old-link states. Test unauthorized reads/writes, stale reviewer updates, reversal of mistaken merges, serious-report restriction, cache invalidation and restoring records without reviving withdrawn destinations. |

Demo/exit G1: one real permitted notice is fetched, reviewed, published, fetched publicly, corrected, withheld and safely restored/replaced under policy; a restart does not lose the review history. Establish the six-category source coverage matrix and remaining gaps now, then deepen it throughout B04–B10. A single-adapter demo does not satisfy launch coverage. DCF-03/04/09/13/16/17/22 and SRC-01–10 as relevant; full held-out/coverage evidence follows before launch.

### Sprint plan 4 — B04: usable discovery to application handoff

Entry: G1 and public projection. Surface: feed/filter/detail UI, read APIs, checklist formatter and report UI.

| Task | Concrete work and output |
|---|---|
| B04a | Implement signed-out mobile feed, six-category search/filter controls, location/national/remote/field/entry-stage behaviour, shareable query URLs and bounded accessible load-more. Preserve back-navigation position; build loading, empty, limited-seasonal and retry states. |
| B04b | Implement the seven-question detail, scoped source/check panel, original requirements plus faithful explanations, practical sourced costs/support and public preparation checklist. Link to the actual issuer-directed route. Unknowns receive a supported next action; missing/unsafe destination disables that action without inventing closure or eligibility. |
| B04c | Connect bounded report UI to B03 triage, with clear receipt/failure states, no applicant document input and neutral under-review/closed/merged landing states. Confirm a real report can be acted on by the operator and reflected on the public page. |
| B04d | Test source-to-detail/handoff and report correction across six categories, both internship routes and relevant failure cases. Expand real source coverage and freeze separate development/held-out extraction cases under the existing source benchmark: at least 60 held-out cases, ten per category, plus adversarial cases. Record critical errors, unknowns, source versions and review decisions; fixtures never count as live inventory. |

Demo/exit G2: a signed-out user finds and understands a reviewed opportunity and opens the official route; an operator corrects it and the page reflects the change. Opening the route is never labelled submission. DCF-01–06/16–19/24. Observe early usability now; complete integrated save/resume and final real-task review in B05/B10.

### Sprint plan 5 — B05: honest browser-local continuity

Entry: G2. Surface: shortlist page, local state adapter and current-record lookup.

| Task | Concrete work and output |
|---|---|
| B05a | Implement versioned local save/remove/clear with successful-write confirmation and first-save/shared-device/loss notices. Store minimal public IDs, revision and progress; keep receipt material separate. No applicant account, cloud backup or sync claim. |
| B05b | Add reversible interested/preparing/applied-reported/not-pursuing stages. Record route opening independently; returning from the external site does not erase data or prove submission. |
| B05c | Reload current public facts on revisit, resolve confirmed merges, show material changes/closure and retain the user's stage. Withheld/unsafe records cannot leave an active old apply link. |
| B05d | Verify browser restart, ordinary handoff/return, blocked/quota-limited storage, malformed/older records, simultaneous tabs and removal/site-data clearing. Failed writes never show a successful save; cleared work never silently reappears. |

Demo/exit: save → leave → return → resume → source changes → user understands the change; separately demonstrate actual data loss and shared-browser visibility. DCF-11/12/13/18/19 and OP02.

### Sprint plan 6 — B06: safe public-link suggestions

Entry: B03 review/fetch controls and B04 detail; B05 is completed first in the default sequence. Surface: versioned suggestion/status/withdraw endpoints, bounded queue and minimal public form/receipt view.

| Task | Concrete work and output |
|---|---|
| B06a | Implement URL-only supported-source intake, request validation, idempotency/rate/queue limits and existing-approved-listing lookup. New or unsupported suggestions never auto-publish or borrow the visitor's login session. Reuse B03 safe fetching; no unrestricted URL fetcher. |
| B06b | Persist minimal private receipt/status with high-entropy scoped capabilities, hashed server storage, header-only access, expiry and redacted logs. Deduplicated work does not share another submitter's receipt. |
| B06c | Connect operator resolve/unresolved/unsupported/paused decisions to the status UI. Implement withdrawal/deletion and queue cancellation consistent with declared retention; source facts independently obtained remain separate. Explain lost browser receipt access. |
| B06d | Exercise redirect/DNS/private-IP/session-bearing links, injection, enumeration, expired/wrong capability, duplicate retries, queue saturation, withdrawal races and tokens in referrers/logs. Confirm unsupported/private sources fail honestly and no email/phone/document is required. |

Demo/exit: approved URL resolves to its listing; new supported URL receives a private receipt, survives restart and is reviewed to a public result; unauthorized status access fails. DCF-07–10/21/22. Keep intake disabled if these controls or actual review capacity fail; do not declare full M0 while it remains disabled.

### Sprint plan 7 — B07: public checklist export and sharing

Entry: B04 public checklist/projection; B05/B06 supply local-state/receipt leak test cases in the default sequence. Surface: shared public formatter, export/share UI and canonical metadata.

| Task | Concrete work and output |
|---|---|
| B07a | Build one whitelist formatter for previewable public checklist text: requirements, uncertainty, source/check date, canonical detail URL and separately labelled official application destination. Never read personal ticks, annotations, stages or receipt storage into the payload. |
| B07b | Implement copy, text-file download, native share where supported, explicit WhatsApp compose and copy-link fallback, using user actions and truthful cancellation/failure states. Test Unicode and denied/unavailable clipboard/share APIs. |
| B07c | Serve canonical titles/descriptions and modest public previews from the current approved projection; update/invalidate after material change. Closed/withheld records and failed current fetch use safe current state or canonical-link fallback. Old external copies are labelled dated and cannot be recalled. |
| B07d | Put distinctive private local/receipt sentinel values in a test browser and inspect every export, filename, URL, metadata and telemetry variant. Exercise stale forwards, cancelled sharing and unavailable apps; no delivery, private-state backup or data-free-access claim. |

Demo/exit: a recipient opens a shared link to current truthful detail; copied/downloaded checklist contains only public dated facts, including safe behaviour after closure. DCF-10/13/14/15/19/21/24 and OP03.

### Sprint plan 8 — B08: issuer pages and useful shelves

Entry: B03/B04; B05–B07 complete in the default sequence. Surface: issuer projection/pages, shelf queries, maintained editorial collections and source coverage record.

| Task | Concrete work and output |
|---|---|
| B08a | Implement source-backed issuer identity/aliases and current openings grouped by category. Counts mean open listings found by Skilved, not total employer vacancies or endorsement. |
| B08b | Implement new-this-week, known-deadline closing-soon, source-stated no-experience and labelled editor picks. Separate first-listed from issuer-publication dates; unknown experience never qualifies as no-experience. Simple reviewed collection/filter links may reuse the catalogue. |
| B08c | Review task-based coverage for reachable communities across all six categories, both internships, general jobs and geographic conditions. Fill permitted-source gaps and record genuine seasonal limitations plus review workload; do not substitute a fixed listing count for relevance. |
| B08d | Test shelf boundaries, date/time uncertainty, issuer alias merges, duplicate intakes and withdrawal propagation through shelves/counts/search/previews. Test filter widening and honest empty states. Keep unproven popularity/trending disabled. |

Demo/exit G3: each M0 scope row is demonstrable end to end, including issuer discovery, continuity, sharing, suggestions and correction. DCF-01/02/04/13/15/20/24 and OP01. Real catalogue usefulness still needs final observation, not just fixtures.

### Sprint plan 9 — B09: qualify the complete release candidate

Entry: G3, accessible staging resources and proposed operational ownership. Surface: CI/integration/browser suites, deployed test configuration, instrumentation, notices and runbooks.

| Task | Concrete work and output |
|---|---|
| B09a | Extend CI to the implemented shared contracts, worker/store/rules and web. Run full M0 browser journeys and affected negative/security/source cases on the candidate. Keep explicit excluded-package status; verify private worker/admin invocation and public projection boundaries in staging, not only emulators. |
| B09b | Measure cold/repeat bytes, latency, memory, keyboard/screen-reader usability and interrupted requests on the declared phone/network for feed/detail/shortlist. Compare against recorded numeric budgets, measure hosting/fetch/review/support costs and model-outage behaviour, and test workload caps/pause controls. Fix misses or openly revise an evidenced budget before release; do not redefine a pass after seeing a failed result. |
| B09c | Complete actual source/storage/receipt/analytics inventory, retention/deletion jobs and user-facing privacy/terms/help/local-save notices. Verify minimised events and abuse controls; clicks are not placements. Assign named source/support/incident owners and achievable response windows. |
| B09d | Rehearse correction, source/queue pause, backup/restore, deletion replay, cache invalidation and application/schema rollback in isolated staging. Record candidate revision/configuration and a release evidence bundle; repair critical findings and retest affected cases. |

Demo/exit G4: all exposed M0 acceptance is evidenced or awaiting the explicitly assigned B10 user/production check; no unresolved critical source, access, fetch, handoff or core-accessibility defect. DCF-01–22/24 applicable M0 subcriteria, SRC-01–10 and REL-01–10 scoped to enabled functionality. DCF-23 and full learner/agent/organisation tests belong to later enabled releases; an exclusion needs a named disabled surface and reason.

### Sprint plan 10 — B10: prove, release and stabilise the MVP

Entry: G4, candidate evidence, usable current source inventory and actual deployment access. Surface: real-task observations, release manifest, production configuration and operating review.

| Task | Concrete work and output |
|---|---|
| B10a | Observe consenting reachable users on representative six-category find/understand/save/resume/share/handoff tasks, including uncertainty, change/failure and shared-device limits. Record coaching, errors, relevant-result gaps and fixes; use the source benchmark and coverage matrix, not six empty tabs, as part of launch evidence. |
| B10b | Freeze the tested candidate and source/configuration versions. Verify staging smoke, migration compatibility, recovery objectives, source recheck/report queues and operator coverage. Prepare the exact production promotion and rollback steps, authorised access and cost envelope for the founder's release decision. |
| B10c | After the actual release decision, promote the tested artifact, apply reviewed configuration and run bounded production smoke on every enabled journey without submitting real applications or unsolicited messages. Remove preparation-only noindex/status copy only where the corresponding public experience is ready. Roll back or pause affected functionality on critical failure; preserve withdrawal/deletion safeguards. |
| B10d | Observe an initial funded operating window, proposed seven calendar days with actual coverage agreed before release. Check representative user failures, source freshness, oldest queues, review minutes, spend and corrections; fix critical faults and rerun affected cases. Record G5/REL-M0 decision and schedule the post-M0 research/reforecast review. |

Demo/exit G5: the release is usable by the intended public, the operator can sustain and correct it, and production/recovery evidence exists. Seven days is an initial operational observation window, not proof of retention, placements or product-market fit. If an accepted capability is still unavailable, report a limited release and the open task; do not mark M0 complete.

## 5. Engineering handoffs that must agree

Use the [canonical contracts](../engineering/07_DATA_AND_API_CONTRACTS.md) and [M0 extension](../engineering/04_DISCOVERY_COMPANION_IMPLEMENTATION.md), not parallel incompatible models.

| Handoff | Producing tasks → consuming tasks | Acceptance before integration |
|---|---|---|
| Opportunity schema and taxonomy | B02a–d → B03–B08 | Same runtime schema, IDs, revision/unknown semantics and migration version |
| Review to public projection | B03c–d → B04/B07/B08 | Whitelisted approved fields, authorization, version preconditions, no private notes; revocation invalidates all public surfaces |
| Public reads and detail | B03d/B04a–b → B05/B07/B08 | Stable IDs/slugs, bounded query/cursor contract, aliases, not-found versus withheld/closed states and safe destinations |
| Local progress | B05 → detail/shortlist | Versioned origin-local state, successful-write evidence, change reconciliation and explicit loss limits |
| Suggestion lifecycle | B03 review/fetch + B06 → receipt UI/operator | Scoped capability, non-enumeration, durable state, withdrawal/expiry and no automatic publication |
| Public export/metadata | B04 checklist + B07 → share/recipient | One approved current public payload, dated static copies, private-state exclusion and closure fallback |
| Release artifact and store | B09 → B10 | Traceable revision/image/configuration, backwards-compatible migration or tested rollback, deletion/withdrawal replay |

Build only the storage/query/index access needed for these paths. Choose and record repository interfaces before depending on empty shared database helpers. Operator authentication is required for review even though learner accounts are deferred. A crawler is bounded recurring operational execution; implementing it does not require the entire personal-agent platform.

## 6. Scope and acceptance coverage

| Accepted scope | Implementation ownership | Release evidence |
|---|---|---|
| M0-A feed/search/filter | B02/B03/B04 | DCF-01/02/04/18/19; six-category source/task matrix |
| M0-B shelves | B03/B08 | DCF-04/20/24; date/experience/editorial tests |
| M0-C detail/checklist | B02/B03/B04 | DCF-03–06/17/18/24; source and explanation review |
| M0-D local progress/share/export | B05/B07 | DCF-10–15/18/19/21; loss and leak tests |
| M0-E issuer pages | B03/B08 | DCF-03/20; aliases, source relationship and count tests |
| M0-F correction/operations | B01/B03/B04/B09/B10 | DCF-09/16/19/21/22/24; triage, recovery and operating evidence |
| M0-G public-link suggestions | B03/B06 | DCF-07–10/21/22; safe fetching and private receipt evidence |

All DCF-01–22 and DCF-24 have an M0 owner above; DCF-23 remains the later social gate. Operational refinements OP01–OP07 are allocated within these tasks; OP08 schedules institutional research after M0. The status record tracks results and blockers, not just links to specifications.

## 7. Evidence and recovery rules

For every completed task retain task ID, requirement/DCF references, code/build and schema/config revision, environment, source/fixture version, command or observation method, result, date, operator/reviewer, actual effort, limitation and corrective issue. Suggested evidence home: `docs/current/quality/evidence/m0/<build-or-date>/`; create records when evidence exists, and store private research/source material outside public documentation with safe references only. A planned filename is not evidence.

Use the existing `pnpm web:lint`, `pnpm web:typecheck`, `pnpm web:build`, then `pnpm web:test` for the current selected web baseline. As routes change, update the public-boundary inventory to the reviewed contract and add positive/negative feature tests; never delete a failing boundary assertion merely to obtain green output. B01/B09 add missing CI, domain, integration and browser commands and record their exact invocation. This document does not pretend those suites already exist.

Before promotion, REL-M0 requires: complete accepted scope; permitted useful source coverage; no unresolved critical facts/access/fetch/handoff failures; recorded device/cost budgets; functioning report/review ownership; privacy/retention notices matching actual behaviour; staging and production boundary checks; tested recovery; a traceable release decision; and initial operating evidence. Cosmetic issues may have explicit owners and limits. Missing categories or accepted functions cannot be waived as cosmetic.

On a critical defect, pause affected ingestion/intake/publication, withhold the unsafe destination and invalidate current caches as needed. Recover using the tested compatible artifact/data procedure; do not blindly restore an old database/projection that revives removed unsafe data. Record the incident and repeat affected acceptance before reopening. Consult the existing [release policy](../quality/11_VALIDATION_AND_RELEASE.md) and [source operations](../operations/03_SOURCE_CHECKS_AND_COMMUNITY_CONTRIBUTIONS.md).

## 8. After the first working MVP

At the first post-launch review allocate the existing INV-01–18 research tasks: consumer observations first, then institutional recipient/buyer/workflow research in the proposed post-M0 windows. Reconcile which S01–S11 subcriteria M0 actually delivered. Build remaining R0/R1 foundations for personal records, evidence and selected sharing, then the R2 continuing-assistance release, followed by the gated R3–R5 network/institutional/expansion work. Do not rebuild completed M0 components or make institutional payment a retroactive launch prerequisite. The full ambition remains in the roadmap.
