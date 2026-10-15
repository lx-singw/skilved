# Sprint loop handoff

Initialized: 15 October 2026. This is the safe repository handoff for the [sequential sprint loop](08_AUTONOMOUS_SPRINT_LOOP.md). Runtime account readings and mutable recovery state belong in ignored `.artifacts/sprint-loop/`, never this file.

## Initial position

- Starting HEAD observed during setup: `e001a26` on main, tracking origin/main.
- Ten existing modified extraction/policy/test files were present. The loop setup preserved them and staged none of them; they were committed separately during setup as recorded below. The private checkpoint records the later clean product-code baseline.
- During setup the checkout advanced to `2a44666` (`Require complete qualification and subject evidence`) and those existing modifications were committed outside the loop setup. Reconcile that commit and any currently active writer before editing; the new loop must not assume exclusive ownership of the checkout.
- The latest committed runtime guide is engineering/16, describing a held qualification/grouping result and disabled production scheduling/publication. Inspect the current diff and newer evidence before deciding the next packet; do not rely on the older 26 September summary alone.
- First continuation: reconcile the unfinished grouping/extraction changes against their intent and current tests, identify ownership/concurrent work, then finish that active engineering sprint or choose the next independent authorized M0 packet with explicit acceptance. No new live provider calls are implied.

## Setup deliverables

The native task heartbeat `skilved-sequential-sprint-loop` is active every 30 minutes in this task; `scripts/sprint_loop.py` evaluates a private live usage payload, covers both subscription windows and atomically stores a wait decision. Eight focused policy tests exercise available usage, five-hour versus weekly waits, invalid/missing data, actual tool payload shape and credit non-bypass. A live payload smoke check returned `work` during setup; no quota exhaustion or autonomous reset recovery is claimed as observed. The loop keeps a 5% checkpoint reserve and reevaluates live allowance after the relevant reset.

This setup does not close product gates or claim the remaining sprints are finished. Each completed engineering sprint must update its own evidence and this handoff, then commit/push under AGENTS.md. Retain formal acceptance blockers separately and move forward only where the dependencies allow.

## Self-prompting update — 15 October 2026

The founder requested explicit self-prompting inside the existing loop. Each work packet now follows the [five-field task and review template](10_SELF_PROMPTING_PACKET_TEMPLATE.md): objective, evidence, next action, acceptance checks and stop condition. The live next task/review belongs in ignored `.artifacts/sprint-loop/next-task.md`, referenced by the private checkpoint. Plan once, implement, review against actual results, then permit one targeted correction for a concrete failure. Persistent failure without new evidence stops that approach instead of triggering endless reflection. This adds no separate model/API service and retains both account windows, the 5% reserve and the existing commit/push workflow.

## Completed packet — 15 October 2026

The [B04 preparation/report packet](11_B04_PREPARATION_AND_REPORT_PACKET.md) implements a source-faithful transient checklist and a bounded report form on public canonical detail. Clean install/compilation/lint/typecheck/build and 27 web tests pass. Synthetic browser checks verify keyboard ticks, honest non-persistence, rate-limit retry, one private report receipt and narrow/wide layout. Private evidence stays under `.artifacts/sprint-loop/b04-2026-10-15/`; the [safe sprint record](../operations/69_PREPARATION_CHECKLIST_AND_REPORT_UI_2026-10-15.md) records scope and limits.

The next [B04 geography/query packet](../operations/70_FEED_GEOGRAPHY_AND_QUERY_RECOVERY_2026-10-15.md) is now verified: nine targeted regressions, all 36 web tests, lint/typecheck/build and a synthetic mobile pagination/stale-cursor recovery check pass. Its private evidence is under `.artifacts/sprint-loop/b04-query-2026-10-15/`.

The [visible source evidence packet](../operations/71_VISIBLE_SOURCE_EVIDENCE_AND_EXPLANATIONS_2026-10-15.md) now renders reviewed explanations and all six check scopes with separate outcomes, methods, times and citations. Five focused render/integration tests, all 41 web tests, lint/typecheck/build and synthetic narrow/wide browser checks pass. The existing automatic freshness hold was also observed with an intentionally incomplete synthetic check; no guard changed.

The [navigation packet](../operations/73_CATALOGUE_RETURN_NAVIGATION_2026-10-15.md) now retains filters/page/cursor and the clicked-card return anchor, including reloaded and restricted detail. All 45 web tests and lint/typecheck/build pass; an isolated synthetic mobile journey verifies native Back, explicit return and filter-preserving stale-cursor restart after withholding. Private evidence is under `.artifacts/sprint-loop/b04-navigation-2026-10-15/`.

The [field packet](../operations/75_LISTED_FIELD_FILTER_2026-10-15.md) adds bounded literal field filtering, accessible controls and field labels. All 24 contract, 48 web and 18 affected emulator integration tests pass with lint/typecheck/build. An isolated synthetic mobile journey verifies search, pagination, reloaded detail return, no-match and blank widening. Private evidence: .artifacts/sprint-loop/b04-field-2026-10-15/.

The [entry-stage contract packet](../operations/76_SOURCE_STATED_ENTRY_STAGE_CONTRACT_2026-10-15.md) implements an optional internal reviewed assertion, explicit legacy public unknown fallback, complete reference/review traversal and automatic-publication hold. All 29 contract, 491 catalogue and 48 web tests pass with lint/typecheck/build. Private evidence: .artifacts/sprint-loop/b04-entry-stage-2026-10-15/.

The [stage discovery packet](../operations/78_STAGE_FILTER_AND_SOURCE_WORDING_2026-10-15.md) adds exact reviewed-stage filtering and original wording/citation display. Initial isolated checks passed 31 contracts, 52 web and 20 adapter tests with lint/typecheck/build. Final integrated correction for maximum-length cursor fingerprints passes 32 contracts, 52 web and 20 adapter tests plus build; UI inputs remain identical to the earlier browser candidate. Isolated synthetic browser checks cover pagination, reload/return, stale restart, empty/all-stage widening, legacy unknown detail and narrow/wide layout. Private evidence: .artifacts/sprint-loop/b04-stage-discovery-2026-10-15/.

Next continuation: reconcile remaining B04 seven-question detail, internship subtype/practical conditions and operator report-to-public correction; audit loading/limited-seasonal behavior against the runbook before B05. Credit current source sprint b10e0a2 separately: extraction evidence/classification and independent validation remain held; no new provider authority comes from this UI work. Preserve automatic ENTRY_STAGE_REVIEW_REQUIRED until actual qualification. Real inventory, source/user/provider/formal gates remain open. Check quota, HEAD and concurrent writer before editing.
