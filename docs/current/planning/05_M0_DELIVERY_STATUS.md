# M0 delivery status, decisions and evidence

Updated: 16 October 2026. This is the current implementation-status record for the [chronological runbook](04_M0_CHRONOLOGICAL_BUILD_RUNBOOK.md). The roadmap/runbook specifies work; this record says what evidence exists. Owner: founder/implementer until actual operating/review roles are assigned. No dated sprint or production release is committed here.

## 1. Current position

16 October B05-4b: [explicit stage reconciliation](../operations/86_EXPLICIT_SAVED_STAGE_RECONCILIATION_2026-10-16.md) adds comparison and confirmed stage matching with mapping/token guards, keeping both references and histories. Final 32 contract/85 web tests, lint/typecheck/build and 13 actual synthetic browser checkpoints pass. B05-5 failure/loss/concurrency and separate user/device acceptance remain next; full B05/G2/source/release gates stay open.

16 October B05-4a: [saved current facts and explicit review](../operations/85_SAVED_CURRENT_FACTS_AND_REVIEW_2026-10-16.md) now show revision changes before acknowledgement and preserve progress across current/closed/restricted/missing/unavailable reads. All 80 web tests and lint/typecheck/build pass; 22 actual synthetic browser checkpoints cover review, retry, confirmed alias/reversal, separate annotations and narrow/wide layouts. Explicit annotation reconciliation remains B05-4b, followed by B05-5 failure/loss/device/user qualification. Full B05/G2/source/release acceptance stays open.

16 October B05-3: [personal stages and separate route actions](../operations/84_PERSONAL_STAGES_AND_ROUTE_ACTIONS_2026-10-16.md) are locally implemented. All 77 web tests and lint/typecheck/build pass; 15 actual synthetic browser checkpoints verify reversible stages, reload/two-tab state, Applied/report-time preservation on route selection, stale native-guard rejection and no implicit save. Narrow/wide layouts fit. B05-4 current-fact/identity recovery and B05-5 remaining loss/failure/device/user qualification stay open, alongside formal G2/source/release gates.

16 October B05-2: [explicit save/remove and saved-list UI](../operations/83_LOCAL_SAVE_AND_RESUME_UI_2026-10-16.md) now use committed transactional results with shared-browser/loss notices and scoped clear confirmation. All 74 web tests and lint/typecheck/build pass; actual synthetic browser checks verify reload, second-tab sharing, remove/clear propagation, cancel, no resurrection after reload and mobile/wide layout. Disabled `/saved` stays 404. B05 stages/route events, detailed change/merge handling and remaining loss/device/user qualification stay open.

16 October B05 foundation: the [local continuity plan](12_B05_LOCAL_CONTINUITY_IMPLEMENTATION_PLAN.md) orders save/resume, progress/handoff, current facts/identity and loss/concurrency work. The [strict contract and IndexedDB core](../operations/82_LOCAL_PROGRESS_STORAGE_FOUNDATION_2026-10-16.md) are implemented: frozen install, 32 contract and 69 web tests plus lint/typecheck/build pass. Atomic conflict/clear/deletion/abort behavior is verified using a test-only IndexedDB implementation. No save UI or actual browser persistence is claimed; B05-2–5 remain pending. Source trial 277ea82 and formal G2 remain separate open qualification work.

16 October B04 recovery: [feed loading, limited catalogue coverage and detail retry](../operations/81_CATALOGUE_LOADING_AND_RECOVERY_2026-10-16.md) are locally implemented. All 60 web tests and lint/typecheck/build pass. Actual local browser/stream observations verify loading before results, category/empty widening, unavailable-detail retry retaining search context and genuine 404, with no narrow/wide overflow. The preceding B04 UI/runtime packets are credited; formal G2, real source/held-out/user/device/deployment acceptance remain open. Next independent authorized engineering is B05 local continuity, with no gate silently closed.

15 October report-correction reconciliation: [seven synthetic public report/operator correction journeys](../operations/80_PUBLIC_REPORT_TO_CORRECTED_DETAIL_2026-10-15.md) now verify restriction, stale-edit rejection, explicit restoration and corrected public wording across every category and both internships. Shared-contract build and all 21 adapter tests pass. Existing UI checks are credited separately; no new browser, real applicant or deployed operator result is claimed. Loading/limited-inventory reconciliation remains before B05; G2 stays open.

15 October practical-detail packet: [internship routes, organisation roles and participation/support conditions](../operations/79_PRACTICAL_DETAIL_AND_INTERNSHIP_CONTEXT_2026-10-15.md) now expose existing reviewed public facts with original wording and citations. Unknowns/conflicts remain explicit with clarification steps. All 57 web tests and lint/typecheck/build pass; synthetic mobile/wide browser checks cover stated, conflicting and restricted detail without horizontal overflow. Operator correction and loading/limited-inventory reconciliation remain before B05; formal G2 and external source/user/release gates stay open.

15 October final cursor correction: maximum accepted escaped/Unicode queries now round-trip within bounded cursors. [Actual final evidence](../operations/78_STAGE_FILTER_AND_SOURCE_WORDING_2026-10-15.md) records 32 contract, 52 web and 20 adapter tests passing on integrated main, plus build; UI input comparison and the earlier browser evidence remain explicit.

15 October stage-discovery packet: [exact stage filters and sourced detail](../operations/78_STAGE_FILTER_AND_SOURCE_WORDING_2026-10-15.md) are implemented in isolation. All 31 contract, 52 web and 20 affected emulator tests pass with lint/typecheck/build and synthetic mobile/wide browser checks. Legacy unknowns, old cursors and source wording are preserved. Remaining B04 detail/correction/loading/limited-seasonal reconciliation and formal G2 stay open; no real stage inventory or release is claimed.

15 October entry-stage prerequisite: [reviewed stage contract](../operations/76_SOURCE_STATED_ENTRY_STAGE_CONTRACT_2026-10-15.md) is locally implemented with legacy unknown fallback, complete fact traversal and an automatic-publication hold. All 29 contract, 491 catalogue and 48 web tests pass with lint/typecheck/build. Query/UI filtering and detail/correction reconciliation remain before B05. Older strict clients require a coordinated update; no release or real stage-inventory qualification is claimed. G2 remains open.

15 October field packet: [listed-field search](../operations/75_LISTED_FIELD_FILTER_2026-10-15.md) is locally implemented. All 24 contract, 48 web and 18 affected emulator tests pass with lint/typecheck/build and an isolated synthetic mobile journey. Stated entry-stage requires a separate provenance-bearing fact; remaining detail/correction work and formal G2 stay open.

15 October navigation packet: [filter/page/card return and stale-result recovery](../operations/73_CATALOGUE_RETURN_NAVIGATION_2026-10-15.md) is locally implemented. All 45 web tests and lint/typecheck/build pass; a separate candidate and actual synthetic mobile journey verify native Back, reloaded detail return, withheld action removal and filter-preserving stale-cursor restart. Field/stated-entry-stage filtering and remaining detail/correction reconciliation precede B05; G2 stays open.

15 October source-evidence packet: [scoped check outcomes and reviewed explanations](../operations/71_VISIBLE_SOURCE_EVIDENCE_AND_EXPLANATIONS_2026-10-15.md) are visible on canonical detail, preserving original wording, timestamps, public citations and unknowns. Five new render/integration tests, all 41 web tests, lint/typecheck/build and synthetic narrow/wide browser checks pass. B04 still has engineering gaps: navigation recovery, source-backed field/stated-entry-stage filtering, detail refinements and report-correction reconciliation. B05 is not started and G2 remains open.

15 October discovery packet: [feed geography and query recovery](../operations/70_FEED_GEOGRAPHY_AND_QUERY_RECOVERY_2026-10-15.md) adds canonical province/coverage/attendance filters, filter-preserving pagination and distinct invalid/stale/outage states. All 36 web tests and lint/typecheck/build pass; isolated mobile checks verify national inclusion and stale-cursor restart. Full B04/G2 and source/user/deployment evidence remain open.

15 October UI packet: [preparation checklist and private issue reporting](../operations/69_PREPARATION_CHECKLIST_AND_REPORT_UI_2026-10-15.md) are implemented on the canonical detail page. A clean candidate passes install, shared compilation, web lint/typecheck/build and 27 web tests. Synthetic mobile/desktop browser checks verify transient ticks, actual 429 retry and exactly one private queue receipt. Flags remain default-disabled; full B04/G2, source qualification and real user/deployment evidence remain open. The [latest source qualification sprint](../operations/68_COMPLETE_QUALIFICATION_GROUPING_AND_CLOSED_SOURCE_REGRESSION_2026-10-15.md) separately records 477 catalogue tests and its held real-source next step.

26 September current worker/feed status: the [Groq pipeline and runbook](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md) implement durable acquisition, structured extraction, semantic validation, automatic publication and stale-action controls. Employer crawling defaults off, with explicit per-source opt-in. Original portal/email handoff is emulator-tested. The real Groq key passes synthetic extraction and validation; this is not held-out qualification. All 79 catalogue tests and 24 public-boundary tests pass, as do web lint/build. Source qualification, deployed identity/grants, funded operational limits and cloud scheduling remain open.

26 September founder correction: **RecentJobs is the first source**, prioritising cross-employer apprenticeships for the first audience. The [parser and source observations](../operations/13_RECENTJOBS_FIRST_ADAPTER.md) underpin the new worker. Source conditions, broader extraction qualification and the real-source G1 demonstration remain open. The [earlier Transnet assessment](../operations/11_FIRST_SOURCE_ASSESSMENT_2026-09-26.md) is deferred reference, not current task order.

Subsequent B03 work, 25 September: the founder authorized planning and implementation of the next sprint while existing external acceptance facts remain pending, then requested a proper scraping-source plan. The [B03 runtime](../engineering/15_SOURCE_PUBLICATION_RUNTIME.md) implements local persistent ingestion/review/publication controls and default-disabled public APIs. The [scraping plan](../operations/10_SOURCE_ACQUISITION_AND_SCRAPING_PLAN.md) separates actual source assessment from the controlled JSON adapter. Source permission, a real HTML/PDF/API adapter demonstration, real catalogue coverage and G1 remain open. See [B03 evidence](../quality/evidence/m0/2026-09-25-b03-publication/README.md) for current candidate results and limitations.

25 September implementation reconciliation: the user's instruction to implement was carried through across N01 and B02a–d, starting from `f116f4b`. The [current candidate evidence](../quality/evidence/m0/2026-09-25-b02-contracts/README.md) identifies tested code by file hashes and records fresh-directory verification. The [next-sprint plan](06_NEXT_SPRINT_IMPLEMENTATION_PLAN.md) remains the task specification; its original estimates are not a new remaining-effort forecast.

**B02 engineering is implemented and locally verified; formal G0 and B02 acceptance remain OPEN.** Fresh-candidate frozen installation, contract typecheck/tests, web lint/typecheck/build/tests all exited 0: 22 contract/inspection tests and 22 web boundary tests. CI configuration includes these selected checks; no hosted CI run is claimed. Narrow/wide browser checks and prototype keyboard/dialog checks are recorded, but no participant observation occurred. The deployment ADR and numeric budgets are proposals requiring actual access, funding and measurement. No cloud service or live catalogue was activated.

Statuses: `NOT STARTED`, `IN PROGRESS`, `BLOCKED` (identify dependency and owner), `EVIDENCED` (completed scoped acceptance), `REOPENED` (new failure invalidates earlier acceptance). A planned test or a pointer to a specification is not an evidenced result. Sprint timebox completion and feature completion are separate.

| Slice | Phase | Status | Evidence / unfinished acceptance |
|---|---|---|---|
| B01 | P0 | IN PROGRESS | Current candidate reproduced; scoped engineering/browser evidence in the new bundle. Participant observation G0.6 and actual capacity/budget G0.7 remain pending. Runtime environment guards and cloud controls are not active. |
| B02 | P1 | IN PROGRESS (engineering evidenced; formal acceptance pending G0) | Canonical six-category schema, provenance/projection, bounded requirements, API/storage/alias/legacy conversion contracts, isolated inspection and CT-01–20 implemented; 22 contract/inspection plus 22 web boundary tests pass. Actual persistence and live endpoints remain B03. |
| B03 | P1 | IN PROGRESS (local runtime implemented; source acquisition and formal G1 pending) | Firestore/Auth emulator integration, protected CLI, durable jobs/snapshots/versions, review/publication/report/alias controls and versioned reads implemented. Real source assessment/adapter, source coverage, actual operator provisioning and deployed qualification remain open. |
| B04 | P2 | LOCAL UI/RUNTIME PACKETS EVIDENCED; G2 OPEN | Feed/detail/fresh handoff, filters, query/loading/empty/limited-coverage recovery, preserved return, checklist, report/correction, scoped sources/explanations and practical detail have local evidence. Real six-category inventory, seasonal coverage, held-out extraction qualification, user/device/deployment and formal G2 acceptance remain open. |
| B05 | P3 | IN PROGRESS — LOCAL PROGRESS AND CURRENT-FACT REVIEW EVIDENCED | Strict local contract, atomic adapter, explicit save/remove, saved page, notices, clear confirmation, stages/route history and current revision/status review have local/test/browser evidence. Alias lookup/reversal preserves annotations; remaining loss/failure/device/user acceptance is pending. |
| B06 | P3 | NOT STARTED | Bounded suggestions, capability receipts, withdrawal and safe-fetch acceptance not evidenced |
| B07 | P3 | NOT STARTED | Public export/sharing and private-state leak tests not evidenced |
| B08 | P3 | NOT STARTED | Accurate issuer pages, shelves and catalogue relevance not evidenced |
| B09 | P4 | NOT STARTED | Integrated acceptance, device/cost measurements, notices, deployed controls and recovery not evidenced |
| B10 | P5 | NOT STARTED | Real-task launch review, promotion, smoke and initial operating window not evidenced |

Gate G0 is OPEN (Engineering foundation evidenced; participant observation & founder confirmation pending). Gates G1–G5 and REL-M0 remain open for subsequent sprints. No full S package or expanded R release is completed by the B01 foundation result. Keep historical audit reports dated; update this record with new evidence rather than rewriting their past results.

### Gate G0 criteria decomposition

- **G0.1**: Fresh-candidate frozen installation and selected commands: **EVIDENCED** in the [current results](../quality/evidence/m0/2026-09-25-b02-contracts/README.md); existing package store reused, no local environment files copied.
- **G0.2**: CI workflow configuration and equivalent selected local commands: **EVIDENCED**. Installation runs with NODE_ENV unset; production applies to web build/test. Hosted CI execution remains unobserved.
- **G0.3**: Environment schema and emulator guard specification recorded ([Doc 11](../engineering/11_ENVIRONMENT_SCHEMA_AND_CONFIGURATION.md), `.env.example`). The document's guard example is not evidence of a wired runtime control; N01 verifies active consumers and records required enforcement before any B03 SDK activation.
- **G0.4**: Proposed deployment boundary documented in [Doc 12](../engineering/12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md). Cost, access and deployed controls are unconfirmed; pause procedure requires rehearsal.
- **G0.5**: Isolated prototype and scoped browser checks: **EVIDENCED** in the [browser record](../quality/evidence/m0/2026-09-25-b02-contracts/browser-evidence.md). Physical-device, throttled-network, assistive-technology and participant checks are not claimed.
- **G0.6**: Participant observation (DCF-18): **PENDING** (Owner: Founder/Product; requires human session).
- **G0.7**: Founder capacity & budget confirmation (DEP-01, DEP-02, DEP-09): **PENDING CONFIRMATION**.

## 2. Decisions and dependencies with deadlines

These are required working decisions, not questions that must stop all documentation or independent implementation. The implementer prepares concrete defaults/evidence; founder confirms actual availability, access, budget and release authority where needed. No unprovided resource is assumed to exist.

| ID | Decision/dependency | Owner | Needed by | Interim treatment / pass evidence |
|---|---|---|---|---|
| DEP-01 | Actual weekly capacity, next sprint dates and operating availability | Founder | B01d / Sprint 2, pending founder confirmation | Proposed in [Doc 13](../engineering/13_PERFORMANCE_ENVELOPES_AND_BUDGETS.md): 20 gross h/wk, 25% reserve, 15 net h/wk. Sprint 2 dated: Oct 9 – Oct 23, 2026 (24 task hours). Pending founder confirmation (G0.7). |
| DEP-02 | Deployment/store/operator-auth/worker boundary and configuration inventory | Implementer; founder for access/cost | Before SDK activation and deployment | Proposed in [ADR DEP-02](../engineering/12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md); region, access, actual workload cost and $25/month scenario need confirmation. Egress bounds and pause controls require implementation/rehearsal. |
| DEP-03 | Permitted initial sources, coverage and review ownership | Source operator/founder | B03a; complete coverage before B10 | Use labelled fixtures for development; do not publish synthetic inventory or infer permission from visibility |
| DEP-04 | Reference phone/network, performance envelope and funded workload limits | Implementer/founder | Initial targets recorded; measured acceptance still required | [Doc 13](../engineering/13_PERFORMANCE_ENVELOPES_AND_BUDGETS.md) records proposed targets. Current loopback measurements do not establish phone/network performance or funded cloud capacity. |
| DEP-05 | Staging/production access, secrets/configuration, domain and release identity | Founder/implementer | Staging qualification B09; promotion B10 | Continue emulator/local work where independent; live gate stays open without actual access |
| DEP-06 | Source-review/support/incident coverage and pause authority | Founder/operator | B09c, before public intake/release | Name actual coverage windows, queue limits and escalation; no presumed 24/7 team |
| DEP-07 | Real-task participants and suitable consent/safeguarding arrangements | Founder/product | B01d prototype; B10a launch evidence | Internal synthetic tests are useful but do not count as participant observations; no unsolicited agent outreach |
| DEP-08 | Retention/notices/analytics choices and recovery objectives | Founder/implementer | B06 before receipt exposure; final B09c–d | Reconcile existing proposed defaults with deployed behaviour; implement deletion/redaction and measure recovery |
| DEP-09 | Revised remaining effort and explicit blockers | Implementer/founder | Next iteration planning | The prior 196 B02–B10 plus 6 B01 task-hour scenario is historical after this implementation. Re-estimate observation, decisions, resulting fixes and B03–B10 against confirmed capacity; agent runtime is not human throughput evidence. |

If a dependency is unavailable, record its blocked task, responsible owner, next review date and independent fallback. A fallback changes neither accepted scope nor release status silently. Source alternatives must still be permitted; local emulation cannot count as production evidence.

## 3. Next sprint preparation

N01 and B02a–d have scoped evidence; the founder subsequently authorized local B03 engineering. Complete the [observation and decisions kit](../quality/evidence/m0/2026-09-25-b02-contracts/observation-and-decisions.md), resolve the [source acquisition decisions](../operations/10_SOURCE_ACQUISITION_AND_SCRAPING_PLAN.md), implement and demonstrate the selected real adapter, and record formal acceptance. Proposed budgets do not establish confirmed capacity or deployed controls. Do not treat the controlled JSON fixture path as completion of real scraping or start B04 under a falsely closed G1.

The following is the original planning scenario from the [implementation plan](06_NEXT_SPRINT_IMPLEMENTATION_PLAN.md), retained for comparison. It is not current remaining work or a confirmed calendar commitment; actual task disposition is in the evidence bundle.

```text
Iteration ID / start / end: Proposed next iteration (Sprint 2) / UNCONFIRMED / UNCONFIRMED; prior Oct 9–23 dates remain a scenario
Capacity scenario: 40 gross h / 10 reserved h (25%) / 30 planned task h; availability unconfirmed
Phase and objective: Finish P0 acceptance, then P1 canonical six-category contract and persistence/API schemas
Task IDs / point estimates: N01 2h, N02 2h, N03 2h (B01 carry-over); B02a 6h, B02b 8h, B02c 6h, B02d 4h
Owner: Implementer for code/evidence; Founder/Product for participant arrangements and actual capacity/budget decisions
Remaining range: 24–46 task hours; split the objective across iterations if remaining work exceeds confirmed capacity
Entry: G0 OPEN; current-candidate correction verification, actual participant observation and founder confirmation required
Independent fallback: bounded contract-only spike; no full B02 acceptance or B03 activation while G0 remains open
Planned demonstration: actual parser/projector drives an isolated fictional inspection view; CT-01–20 coverage and partial DCF evidence
Planned evidence: new actual-date/candidate directory under docs/current/quality/evidence/m0/; no result implied
```

Use this template for subsequent iterations:

```text
Iteration ID / start / end:
Available gross hours / reserved hours / planned task hours:
Phase and objective:
Task IDs with owner and remaining estimate:
Entry-gate evidence / unresolved dependencies:
Demonstration and acceptance IDs:
Evidence location (safe references only):
End review: completed tasks, actual hours, test/user results:
Carry-over / blocker owner / next review:
Revised remaining range / capacity / expected external waits:
Next objective and release status:
```

Do not schedule more task hours than planned capacity. A missed gate moves dependent work; it does not remove testing or a category. Date forecasts only after recording a start and capacity; separate hands-on effort, calendar time and external waits.

## 4. Release decision record

Before declaring REL-M0 complete, link all of the following actual records:

- M0-A–G demonstration and DCF-01–22/24 result matrix, including operational subcriteria; DCF-23 explicitly remains later.
- Six-category source/task coverage, both internship subtypes, broad jobs, held-out source results, current source permission/check records and meaningful seasonal-gap explanations.
- Selected CI/build/domain/security/browser results; staged and deployed operator/worker/data boundaries; explicit excluded capabilities.
- Device/network/cost measurements against recorded budgets, review/support capacity and exercised pause controls.
- Actual privacy/help/local-save/receipt notices, retention/deletion checks and non-leaking public exports.
- Backup/restore/rollback rehearsal with schema/configuration/artifact references and deletion/withdrawal safeguards.
- Real-task observations, corrected critical failures and the actual founder release decision.
- Production promotion/smoke and initial operating-window results with owner, critical fixes and remaining noncritical limitations.

Until these exist the status stays open or explicitly limited. A successful build, a full document set or a completed timebox cannot substitute for a working MVP.
