# M0 delivery status, decisions and evidence

Updated: 25 September 2026. This is the current implementation-status record for the [chronological runbook](04_M0_CHRONOLOGICAL_BUILD_RUNBOOK.md). The roadmap/runbook specifies work; this record says what evidence exists. Owner: founder/implementer until actual operating/review roles are assigned. No dated sprint or production release is committed here.

## 1. Current position

25 September planning reconciliation: the [next-sprint implementation plan](06_NEXT_SPRINT_IMPLEMENTATION_PLAN.md) starts from correction commit `5fd878d`. Those correction edits were statically inspected for planning, not independently rerun in this planning task. Earlier evidence remains tied to its recorded candidate; N01 must establish current-candidate results before renewed sign-off. The proposed iteration includes B01 carry-over before full B02 acceptance.

**P0 / B01 in progress. Gate G0 status is OPEN (Engineering foundation evidenced; participant observation & founder confirmation pending).** The engineering foundation is fully reproducible in a clean environment without secrets (`pnpm install --frozen-lockfile` verified). All four core checks pass with exit code 0 (`web:lint`, `web:typecheck`, `web:build`, `web:test` with 21/21 passing boundary assertions). GitHub Actions CI is established (`.github/workflows/ci.yml`). Hosting and runtime boundaries are confirmed in ADR DEP-02 (`docs/current/engineering/12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md`). The mobile task prototype is established and observed (`apps/web/prototype/task-prototype/`). Performance envelopes (DEP-04), remaining M0 reforecast of 196 net task hours (DEP-09), and the dated Sprint 2 plan (DEP-01) are codified in `docs/current/engineering/13_PERFORMANCE_ENVELOPES_AND_BUDGETS.md`.

Statuses: `NOT STARTED`, `IN PROGRESS`, `BLOCKED` (identify dependency and owner), `EVIDENCED` (completed scoped acceptance), `REOPENED` (new failure invalidates earlier acceptance). A planned test or a pointer to a specification is not an evidenced result. Sprint timebox completion and feature completion are separate.

| Slice | Phase | Status | Evidence / unfinished acceptance |
|---|---|---|---|
| B01 | P0 | IN PROGRESS (Engineering foundation reproducible; CI fixed; participant observation & founder confirmation pending) | Gate G0 is OPEN (Engineering foundation evidenced; participant observation & founder confirmation pending). Clean-clone reproduction verified (Exit 0); CI workflow `.github/workflows/ci.yml` fixed/validated; environment schema `docs/current/engineering/11_ENVIRONMENT_SCHEMA_AND_CONFIGURATION.md` & `.env.example` verified; ADR DEP-02 in `12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md`; mobile observation prototype & budgets in `13_PERFORMANCE_ENVELOPES_AND_BUDGETS.md`; 21/21 boundary tests passing. Participant observation session (G0.6) and founder confirmation of capacity/budget (G0.7) pending. |
| B02 | P1 | NOT STARTED | Canonical six-category schemas/projection/migration and contract tests not evidenced |
| B03 | P1 | NOT STARTED | Permitted persistent source/review/publication, protected operator access and correction controls not evidenced |
| B04 | P2 | NOT STARTED | Integrated reviewed feed/detail/checklist/report/handoff and six-category source tasks not evidenced |
| B05 | P3 | NOT STARTED | Browser-local progress and failure/change recovery not evidenced |
| B06 | P3 | NOT STARTED | Bounded suggestions, capability receipts, withdrawal and safe-fetch acceptance not evidenced |
| B07 | P3 | NOT STARTED | Public export/sharing and private-state leak tests not evidenced |
| B08 | P3 | NOT STARTED | Accurate issuer pages, shelves and catalogue relevance not evidenced |
| B09 | P4 | NOT STARTED | Integrated acceptance, device/cost measurements, notices, deployed controls and recovery not evidenced |
| B10 | P5 | NOT STARTED | Real-task launch review, promotion, smoke and initial operating window not evidenced |

Gate G0 is OPEN (Engineering foundation evidenced; participant observation & founder confirmation pending). Gates G1–G5 and REL-M0 remain open for subsequent sprints. No full S package or expanded R release is completed by the B01 foundation result. Keep historical audit reports dated; update this record with new evidence rather than rewriting their past results.

### Gate G0 criteria decomposition

- **G0.1**: Clean-room frozen lockfile installation & verification commands: **EVIDENCED** ([`02-clean-reproduction.txt`](../quality/evidence/m0/2026-09-25-b01-foundation/02-clean-reproduction.txt), [`01-baseline-reconciliation.txt`](../quality/evidence/m0/2026-09-25-b01-foundation/01-baseline-reconciliation.txt)).
- **G0.2**: Automated CI workflow in `.github/workflows/ci.yml`: **EVIDENCED** (verified with `--prod=false` offline/dev dependencies; lint, typecheck, build, test exit 0).
- **G0.3**: Environment schema and emulator guard specification recorded ([Doc 11](../engineering/11_ENVIRONMENT_SCHEMA_AND_CONFIGURATION.md), `.env.example`). The document's guard example is not evidence of a wired runtime control; N01 verifies active consumers and records required enforcement before any B03 SDK activation.
- **G0.4**: Deployment ADR DEP-02: **EVIDENCED** ([Doc 12](../engineering/12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md)).
- **G0.5**: Mobile task prototype harness & accessibility: **EVIDENCED** (`apps/web/prototype/task-prototype/`, [Doc 13](../engineering/13_PERFORMANCE_ENVELOPES_AND_BUDGETS.md)).
- **G0.6**: Participant observation (DCF-18): **PENDING** (Owner: Founder/Product; requires human session).
- **G0.7**: Founder capacity & budget confirmation (DEP-01, DEP-02, DEP-09): **PENDING CONFIRMATION**.

## 2. Decisions and dependencies with deadlines

These are required working decisions, not questions that must stop all documentation or independent implementation. The implementer prepares concrete defaults/evidence; founder confirms actual availability, access, budget and release authority where needed. No unprovided resource is assumed to exist.

| ID | Decision/dependency | Owner | Needed by | Interim treatment / pass evidence |
|---|---|---|---|---|
| DEP-01 | Actual weekly capacity, next sprint dates and operating availability | Founder | B01d / Sprint 2, pending founder confirmation | Proposed in [Doc 13](../engineering/13_PERFORMANCE_ENVELOPES_AND_BUDGETS.md): 20 gross h/wk, 25% reserve, 15 net h/wk. Sprint 2 dated: Oct 9 – Oct 23, 2026 (24 task hours). Pending founder confirmation (G0.7). |
| DEP-02 | Deployment/store/operator-auth/worker boundary and configuration inventory | Implementer; founder for access/cost | B01c, engineering baseline evidenced; pending founder budget confirmation | Baseline recorded in [ADR DEP-02](../engineering/12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md); Cloud Run in africa-south1, Firestore Native, bounded egress, $25/mo ceiling. Pending founder budget confirmation (G0.7). |
| DEP-03 | Permitted initial sources, coverage and review ownership | Source operator/founder | B03a; complete coverage before B10 | Use labelled fixtures for development; do not publish synthetic inventory or infer permission from visibility |
| DEP-04 | Reference phone/network, performance envelope and funded workload limits | Implementer/founder | B01d initial, resolved | Recorded in [Doc 13](../engineering/13_PERFORMANCE_ENVELOPES_AND_BUDGETS.md): Budget Android (Moto G Play/A03), SA 3G (1.5 Mbps, 150ms RTT), First Load JS <120kB, LCP <2.5s, INP <100ms, monthly cloud $25 USD. |
| DEP-05 | Staging/production access, secrets/configuration, domain and release identity | Founder/implementer | Staging qualification B09; promotion B10 | Continue emulator/local work where independent; live gate stays open without actual access |
| DEP-06 | Source-review/support/incident coverage and pause authority | Founder/operator | B09c, before public intake/release | Name actual coverage windows, queue limits and escalation; no presumed 24/7 team |
| DEP-07 | Real-task participants and suitable consent/safeguarding arrangements | Founder/product | B01d prototype; B10a launch evidence | Internal synthetic tests are useful but do not count as participant observations; no unsolicited agent outreach |
| DEP-08 | Retention/notices/analytics choices and recovery objectives | Founder/implementer | B06 before receipt exposure; final B09c–d | Reconcile existing proposed defaults with deployed behaviour; implement deletion/redaction and measure recovery |
| DEP-09 | Revised remaining effort and explicit blockers | Implementer/founder | B01d; reforecast and founder confirmation pending | [Doc 13](../engineering/13_PERFORMANCE_ENVELOPES_AND_BUDGETS.md) proposes 196 B02–B10 task hours across seven two-week sprints. The [next-sprint plan](06_NEXT_SPRINT_IMPLEMENTATION_PLAN.md) adds a 6-hour B01 carry-over planning point, yielding 202 hours before further re-estimation; neither throughput nor availability is confirmed. |

If a dependency is unavailable, record its blocked task, responsible owner, next review date and independent fallback. A fallback changes neither accepted scope nor release status silently. Source alternatives must still be permitted; local emulation cannot count as production evidence.

## 3. Next sprint preparation

B01a–d have prior scoped engineering records and subsequent correction edits. N01 in the next-sprint plan reconciles those records with the current candidate before renewed acceptance. G0.6 participant observation and G0.7 founder confirmation remain pending; proposed budgets and a written reforecast do not establish confirmed capacity or runtime controls.

The proposed next iteration is specified in the [complete implementation plan](06_NEXT_SPRINT_IMPLEMENTATION_PLAN.md). It supersedes the earlier B02-only commitment wording; it does not claim completed corrections or confirmed capacity.

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
