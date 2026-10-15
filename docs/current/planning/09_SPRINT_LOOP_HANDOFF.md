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
