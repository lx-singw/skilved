# M0 delivery status, decisions and evidence

Updated: 24 September 2026. This is the current implementation-status record for the [chronological runbook](04_M0_CHRONOLOGICAL_BUILD_RUNBOOK.md). The roadmap/runbook specifies work; this record says what evidence exists. Owner: founder/implementer until actual operating/review roles are assigned. No dated sprint or production release is committed here.

## 1. Current position

**P0 / B01 in progress. M0 is not ready to launch.** The [24 September stabilisation record](../engineering/10_PUBLIC_WEB_STABILISATION_2026-09-24.md) records passing scoped web lint, typecheck, build and 21 boundary tests; 29 prototype files were preserved outside routing. Public pages expose a preparation state and the catalogue is empty. These are local results, not a clean-install, CI, full-workspace, live-source, browser-user or deployment pass. This roadmap review did not rerun application checks or implement features.

Statuses: `NOT STARTED`, `IN PROGRESS`, `BLOCKED` (identify dependency and owner), `EVIDENCED` (completed scoped acceptance), `REOPENED` (new failure invalidates earlier acceptance). A planned test or a pointer to a specification is not an evidenced result. Sprint timebox completion and feature completion are separate.

| Slice | Phase | Status | Evidence / unfinished acceptance |
|---|---|---|---|
| B01 | P0 | IN PROGRESS | Local boundary/stabilisation evidence above; B01b–d still require clean reproduction/CI, deployment/configuration decisions, prototype/budgets and remaining estimate. B01a must reconcile later revisions. |
| B02 | P1 | NOT STARTED | Canonical six-category schemas/projection/migration and contract tests not evidenced |
| B03 | P1 | NOT STARTED | Permitted persistent source/review/publication, protected operator access and correction controls not evidenced |
| B04 | P2 | NOT STARTED | Integrated reviewed feed/detail/checklist/report/handoff and six-category source tasks not evidenced |
| B05 | P3 | NOT STARTED | Browser-local progress and failure/change recovery not evidenced |
| B06 | P3 | NOT STARTED | Bounded suggestions, capability receipts, withdrawal and safe-fetch acceptance not evidenced |
| B07 | P3 | NOT STARTED | Public export/sharing and private-state leak tests not evidenced |
| B08 | P3 | NOT STARTED | Accurate issuer pages, shelves and catalogue relevance not evidenced |
| B09 | P4 | NOT STARTED | Integrated acceptance, device/cost measurements, notices, deployed controls and recovery not evidenced |
| B10 | P5 | NOT STARTED | Real-task launch review, promotion, smoke and initial operating window not evidenced |

G0–G5 and REL-M0 are all open. No full S package or expanded R release is completed by the local B01 result. Keep historical audit reports dated; update this record with new evidence rather than rewriting their past results.

## 2. Decisions and dependencies with deadlines

These are required working decisions, not questions that must stop all documentation or independent implementation. The implementer prepares concrete defaults/evidence; founder confirms actual availability, access, budget and release authority where needed. No unprovided resource is assumed to exist.

| ID | Decision/dependency | Owner | Needed by | Interim treatment / pass evidence |
|---|---|---|---|---|
| DEP-01 | Actual weekly capacity, next sprint dates and operating availability | Founder | B01d / first dated sprint | Use undated task order; record actual hours, reserve and sprint commitment before promising dates |
| DEP-02 | Deployment/store/operator-auth/worker boundary and configuration inventory | Implementer; founder for access/cost | B01c, before dependent integration | Google/Firebase remains reference only; record chosen topology, environments, required access and safe local defaults |
| DEP-03 | Permitted initial sources, coverage and review ownership | Source operator/founder | B03a; complete coverage before B10 | Use labelled fixtures for development; do not publish synthetic inventory or infer permission from visibility |
| DEP-04 | Reference phone/network, performance envelope and funded workload limits | Implementer/founder | B01d initial; B09 measured acceptance | Record numeric budgets, method and owner; old build JS figures alone do not pass |
| DEP-05 | Staging/production access, secrets/configuration, domain and release identity | Founder/implementer | Staging qualification B09; promotion B10 | Continue emulator/local work where independent; live gate stays open without actual access |
| DEP-06 | Source-review/support/incident coverage and pause authority | Founder/operator | B09c, before public intake/release | Name actual coverage windows, queue limits and escalation; no presumed 24/7 team |
| DEP-07 | Real-task participants and suitable consent/safeguarding arrangements | Founder/product | B01d prototype; B10a launch evidence | Internal synthetic tests are useful but do not count as participant observations; no unsolicited agent outreach |
| DEP-08 | Retention/notices/analytics choices and recovery objectives | Founder/implementer | B06 before receipt exposure; final B09c–d | Reconcile existing proposed defaults with deployed behaviour; implement deletion/redaction and measure recovery |
| DEP-09 | Revised remaining effort and explicit blockers | Implementer/founder | B01d and every sprint review | Estimate remaining tasks including refinements/repairs once; old 160–288 hours is historical, actual completed hours remain unmeasured |

If a dependency is unavailable, record its blocked task, responsible owner, next review date and independent fallback. A fallback changes neither accepted scope nor release status silently. Source alternatives must still be permitted; local emulation cannot count as production evidence.

## 3. Next sprint preparation

The next ordered work is B01a reconciliation, B01b clean reproduction/CI, B01c concrete deployment/configuration decision and B01d task/budget/reforecast evidence. Prepare the B02 schemas against these decisions; do not enable dependent source/intake features before their controls exist. The earlier local checks are useful evidence to retain, not an instruction to rebuild the same baseline from scratch.

Use this record for each actual timebox; copy it when real planning information is available:

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
