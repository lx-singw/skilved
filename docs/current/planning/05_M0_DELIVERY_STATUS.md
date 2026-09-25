# M0 delivery status, decisions and evidence

Updated: 24 September 2026. This is the current implementation-status record for the [chronological runbook](04_M0_CHRONOLOGICAL_BUILD_RUNBOOK.md). The roadmap/runbook specifies work; this record says what evidence exists. Owner: founder/implementer until actual operating/review roles are assigned. No dated sprint or production release is committed here.

## 1. Current position

**P0 / B01 completed and evidenced. Gate G0 passed.** The build foundation is fully reproducible in a clean environment without secrets (`pnpm install --frozen-lockfile` clean clone verified). All four core checks pass with exit code 0 (`web:lint`, `web:typecheck`, `web:build`, `web:test` with 21/21 passing boundary assertions). GitHub Actions CI is established (`.github/workflows/ci.yml`). Hosting and runtime boundaries are confirmed in ADR DEP-02 (`docs/current/engineering/12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md`). The mobile task prototype is established and observed (`apps/web/prototype/task-prototype/`). Performance envelopes (DEP-04), remaining M0 reforecast of 196 net task hours (DEP-09), and the dated Sprint 2 plan (DEP-01) are codified in `docs/current/engineering/13_PERFORMANCE_ENVELOPES_AND_BUDGETS.md`.

Statuses: `NOT STARTED`, `IN PROGRESS`, `BLOCKED` (identify dependency and owner), `EVIDENCED` (completed scoped acceptance), `REOPENED` (new failure invalidates earlier acceptance). A planned test or a pointer to a specification is not an evidenced result. Sprint timebox completion and feature completion are separate.

| Slice | Phase | Status | Evidence / unfinished acceptance |
|---|---|---|---|
| B01 | P0 | EVIDENCED | Gate G0 passed. Clean-clone reproduction verified (Exit 0); CI workflow `.github/workflows/ci.yml` validated; environment schema `docs/current/engineering/11_ENVIRONMENT_SCHEMA_AND_CONFIGURATION.md` & `.env.example` verified; ADR DEP-02 in `12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md`; mobile observation prototype & budgets in `13_PERFORMANCE_ENVELOPES_AND_BUDGETS.md`; 21/21 boundary tests passing. |
| B02 | P1 | NOT STARTED | Canonical six-category schemas/projection/migration and contract tests not evidenced |
| B03 | P1 | NOT STARTED | Permitted persistent source/review/publication, protected operator access and correction controls not evidenced |
| B04 | P2 | NOT STARTED | Integrated reviewed feed/detail/checklist/report/handoff and six-category source tasks not evidenced |
| B05 | P3 | NOT STARTED | Browser-local progress and failure/change recovery not evidenced |
| B06 | P3 | NOT STARTED | Bounded suggestions, capability receipts, withdrawal and safe-fetch acceptance not evidenced |
| B07 | P3 | NOT STARTED | Public export/sharing and private-state leak tests not evidenced |
| B08 | P3 | NOT STARTED | Accurate issuer pages, shelves and catalogue relevance not evidenced |
| B09 | P4 | NOT STARTED | Integrated acceptance, device/cost measurements, notices, deployed controls and recovery not evidenced |
| B10 | P5 | NOT STARTED | Real-task launch review, promotion, smoke and initial operating window not evidenced |

Gate G0 is PASSED. Gates G1–G5 and REL-M0 remain open for subsequent sprints. No full S package or expanded R release is completed by the B01 foundation result. Keep historical audit reports dated; update this record with new evidence rather than rewriting their past results.

## 2. Decisions and dependencies with deadlines

These are required working decisions, not questions that must stop all documentation or independent implementation. The implementer prepares concrete defaults/evidence; founder confirms actual availability, access, budget and release authority where needed. No unprovided resource is assumed to exist.

| ID | Decision/dependency | Owner | Needed by | Interim treatment / pass evidence |
|---|---|---|---|---|
| DEP-01 | Actual weekly capacity, next sprint dates and operating availability | Founder | B01d / Sprint 2, resolved | Confirmed in [Doc 13](../engineering/13_PERFORMANCE_ENVELOPES_AND_BUDGETS.md): 20 gross h/wk, 25% reserve, 15 net h/wk. Sprint 2 dated: Oct 9 – Oct 23, 2026 (24 task hours). |
| DEP-02 | Deployment/store/operator-auth/worker boundary and configuration inventory | Implementer; founder for access/cost | B01c, resolved | Baseline confirmed in [ADR DEP-02](../engineering/12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md); Cloud Run in africa-south1, Firestore Native, bounded egress, $25/mo ceiling |
| DEP-03 | Permitted initial sources, coverage and review ownership | Source operator/founder | B03a; complete coverage before B10 | Use labelled fixtures for development; do not publish synthetic inventory or infer permission from visibility |
| DEP-04 | Reference phone/network, performance envelope and funded workload limits | Implementer/founder | B01d initial, resolved | Recorded in [Doc 13](../engineering/13_PERFORMANCE_ENVELOPES_AND_BUDGETS.md): Budget Android (Moto G Play/A03), SA 3G (1.5 Mbps, 150ms RTT), First Load JS <120kB, LCP <2.5s, INP <100ms, monthly cloud $25 USD. |
| DEP-05 | Staging/production access, secrets/configuration, domain and release identity | Founder/implementer | Staging qualification B09; promotion B10 | Continue emulator/local work where independent; live gate stays open without actual access |
| DEP-06 | Source-review/support/incident coverage and pause authority | Founder/operator | B09c, before public intake/release | Name actual coverage windows, queue limits and escalation; no presumed 24/7 team |
| DEP-07 | Real-task participants and suitable consent/safeguarding arrangements | Founder/product | B01d prototype; B10a launch evidence | Internal synthetic tests are useful but do not count as participant observations; no unsolicited agent outreach |
| DEP-08 | Retention/notices/analytics choices and recovery objectives | Founder/implementer | B06 before receipt exposure; final B09c–d | Reconcile existing proposed defaults with deployed behaviour; implement deletion/redaction and measure recovery |
| DEP-09 | Revised remaining effort and explicit blockers | Implementer/founder | B01d, resolved | Evidenced in [Doc 13](../engineering/13_PERFORMANCE_ENVELOPES_AND_BUDGETS.md): 196 net task hours across 6.5 sprints (Sprints 2–7.5) at 15 net task h/week. No current blockers. |

If a dependency is unavailable, record its blocked task, responsible owner, next review date and independent fallback. A fallback changes neither accepted scope nor release status silently. Source alternatives must still be permitted; local emulation cannot count as production evidence.

## 3. Next sprint preparation

B01a reconciliation, B01b clean reproduction/CI, B01c deployment decision (Doc 12), and B01d task prototype, performance budgets, reforecast, and Sprint 2 plan (Doc 13) are complete.

The committed dated plan for Sprint 2 (B02):

```text
Iteration ID / start / end: Sprint 2 (B02) / 2026-10-09 / 2026-10-23
Available gross hours / reserved hours / planned task hours: 40 gross h / 10 reserved h (25%) / 24 planned task h (6h buffer)
Phase and objective: P1 — Canonical Six-Category Opportunity Contract and Persistence Schemas
Task IDs with owner and remaining estimate: B02a (6h), B02b (8h), B02c (6h), B02d (4h) — Implementer / Performance QA
Entry-gate evidence / unresolved dependencies: Gate G0 satisfied; B01 checks reproducible, prototype observed, budgets established; DEP-01, DEP-02, DEP-04, DEP-09 resolved.
Demonstration and acceptance IDs: Six-category contract tests pass; DCF-01/02/05/06/22; public read projection excludes draft/private data.
Evidence location (safe references only): docs/current/engineering/13_PERFORMANCE_ENVELOPES_AND_BUDGETS.md
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
