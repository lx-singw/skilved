# Sequential sprint loop

Created: 15 October 2026. The founder authorized recurring engineering across the agreed sprints, one at a time, respecting both Codex subscription usage windows. This extends the repository AGENTS.md workflow: verify, commit and push completed sprints to main. It does not add spending, deployment, outreach or source-permission authority.

## Scheduling and quota behavior

Use one native recurring continuation in this task every 30 minutes. Preserve existing context and durable repository progress; do not launch background Codex processes or create competing automation tasks. The computer, WSL checkout and desktop app must remain available. Native scheduling is the wake-up mechanism; the Python helper does not call a model or keep a process sleeping.

At run entry, inspect `.artifacts/sprint-loop/state.json` before loading large documentation. If its quota `not_before` is still in the future, end quietly. Otherwise call the app's `get_usage_limits` tool and save its result privately to `.artifacts/sprint-loop/usage.json`; then run:

```sh
python3 scripts/sprint_loop.py --usage-file .artifacts/sprint-loop/usage.json
```

The helper returns `work`, `wait` or `refresh_required`, updating only the private quota fields atomically. It handles the tool response wrapper or parsed payload. It prefers the `codex` bucket in `rateLimitsByLimitId`, falls back to the legacy view, and requires known five-hour and weekly windows. Unknown/null values are unavailable, never zero. If the account introduces different windows/buckets, reconcile the policy rather than pretending it has passed.

The checkpoint reserve is 5% in each window: finish/save the current bounded packet when either reaches 95% used, then wait. This is a conservative checkpoint policy, not a guarantee of enough quota to finish a large test/review. When both windows block work, `not_before` is the later actual reset plus five minutes. A five-hour reset does not override a still-exhausted weekly allowance. Past/missing reset times require a new live reading; never assume a fresh allowance just because time passed. Never buy credits or switch accounts to evade a limit. User-directed changes to reserve/cadence can be recorded later.

Check usage before selecting a packet, before a costly extended review, between implementation/test stages, and at least roughly every 15 minutes of sustained work. Save progress after every meaningful change and before long commands. If a limit cuts the run off abruptly, recover from Git and the checkpoint on the next eligible scheduled continuation.

Subscription quota is separate from Groq/Gemini/cloud budgets. Respect their existing explicit limits and holds. This loop alone authorizes no new live provider trials or expanded call budget.

The heartbeat prompt can check usage only after a run starts. Public documentation does not establish a quota-exempt preflight or an exact-reset retry guarantee. While fully limited, even a scheduled continuation may fail to start; later scheduled attempts provide the intended resumption opportunity when the app and allowance permit. It is not unlimited compute or a second billing system.

## Each engineering cycle

1. Read AGENTS.md and current human steering. Use Linux Git through WSL in `/home/lx_singw/projects/skilved`. Inspect branch, HEAD, status and changed-file ownership. Preserve existing work; never stage everything blindly, force push, reset unrelated edits or bypass a hook.
2. Reconcile the private checkpoint with actual source/tests and the newest engineering/operations records. The dated delivery index can lag newer detailed sprint evidence. On setup, HEAD was `e001a26`, ten existing extraction/policy/test files were modified, and the latest committed runtime guide described a qualification-grouping hold. These are starting observations, not permanent next-task facts.
3. Continue the current in-progress sprint before opening a new one. Write its concrete outcome, bounded tasks, dependencies, acceptance cases and evidence plan. Read the chronological M0 runbook and latest active source/AI decisions, then credit already delivered work instead of rebuilding it.
4. Implement one dependency-eligible packet. Work toward completing the current sprint, but checkpoint between packets and yield when the quota reserve or safe stopping point is reached. Keep a scheduled run to about 20–25 minutes where practical; an essential running command can finish when needed. Another wake is not permission for overlapping writers.
5. Self-review the diff and test meaningful success, failure and privacy paths. Run checks appropriate to changed boundaries. Do not run the entire monorepo reflexively or substitute synthetic evidence for real-source, user or deployment acceptance. Keep raw snapshots, provider responses, private evaluations, local environment and account usage under ignored `.artifacts/` or another approved private location.
6. Update the delivery record and safe public sprint summary with actual commands/results, limits and remaining dependencies. At sprint engineering completion, stage only the reviewed sprint files, inspect staged changes, commit and push to main. Confirm remote success. On push rejection, inspect divergence and preserve all work; do not force push. Record a completed commit awaiting push separately from a completed push.
7. Save the next exact task and local recovery instructions. Move to the next sprint only after the current engineering outcome is evidenced; keep unmet external/formal acceptance explicit. Never declare user observation, permission, a successful provider evaluation or production access without its actual evidence.

## Order and blockers

M0 comes first: remaining source/contract qualification and B03/B04 work, then B05 continuity, B06 suggestions, B07 export/share, B08 issuer/shelves, B09 qualification and B10 release preparation. Existing code and newer founder decisions may refine packet order. Preserve all six categories, both internship subtypes, general jobs, free consumer access and the full R0–R5/S01–S35 ambition.

After M0 engineering, credit overlap and continue dependency-eligible work in the expanded roadmap. Research, institutional access, participant observation and production release decisions are real prerequisites; code cannot manufacture them. When one item requires an external fact, record it and continue useful authorized work that does not depend on it. Do not spend many cycles polishing the same held source/model result while other roadmap work can advance. If all remaining work depends on human/external action, notify once and wait for a meaningful change rather than inventing additional scope.

No parallel agents are authorized by this loop. Detect another writer before editing; yield if the same checkout is actively in use. The native same-task heartbeat and checkpoint policy coordinate scheduled runs, but cannot lock out a human editor or another task by themselves.

## Checkpoint and reporting

The tracked [handoff](09_SPRINT_LOOP_HANDOFF.md) records safe durable instructions and completed outcomes. The private state records current HEAD, current sprint/packet, dirty-file inventory, latest test evidence paths, next action, blockers, automation ID and quota decision. Update it atomically, preserving quota fields when editing engineering progress. Do not commit live account payloads or private source/model material.

Stay quiet on unchanged quota waits or unchanged external blockers. Notify on completed pushed sprints, substantive failure, a material decision or required user action, with commit/push/test evidence and remaining limits. On user stop, disable the native automation; on a temporary hold, preserve the checkpoint and follow the user's instruction. Once the agreed roadmap is delivered, disable the automation and report actual completion; never declare it done merely because quota or patience ran out.

Official references: [scheduled tasks](https://learn.chatgpt.com/docs/automations?surface=app) supports recurring continuation in an existing chat and requires local project availability; [usage limits](https://learn.chatgpt.com/docs/pricing) explains shared allowance and possible weekly limits. The live account tool, not fixed message estimates, supplies current percentages and reset epochs.
