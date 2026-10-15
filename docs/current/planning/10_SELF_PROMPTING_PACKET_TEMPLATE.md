# Self-prompting work packet

Use with the [sprint loop](08_AUTONOMOUS_SPRINT_LOOP.md). This is a planning/review template, not evidence of completed work. Copy it into ignored `.artifacts/sprint-loop/next-task.md`; private source material, provider responses and live account readings must remain outside tracked documentation.

Keep entries concise and actionable. The task instruction should follow observed results and the agreed roadmap. It cannot change permissions, accepted scope, source rules or budgets.

```markdown
Packet ID / current sprint:
Checkout HEAD / relevant dirty files:

Objective:
- State the user outcome this packet advances.

Evidence:
- Observation, actual result, and its file/command/source reference.
- What remains unknown; distinguish a planned check from a completed check.

Next action:
- Give one bounded engineering assignment justified by that evidence.
- Identify the affected boundary/files and any prerequisite.

Acceptance checks:
- State observable behavior and the appropriate verification method.
- Preserve existing success, failure and privacy requirements.
- Mark each check pending until its result is actually available.

Stop condition:
- Stop when the listed checks pass, a required external fact blocks progress,
  a quota/budget boundary is reached, or the bounded correction fails.
- Record the next action before yielding; a completed packet does not by itself
  establish sprint or release acceptance.

Review after implementation:
- Actual changes and observed check results, with references.
- Acceptance: passed / failed / blocked / not run, with concrete reasons.
- Remaining material defect or unknown, if any.
- Decision: complete this packet / one targeted correction / blocked.
- Next exact action and whether a completed sprint is ready to commit and push.
```

One planning pass and one review pass are the default. Retry only a concrete failure with a bounded corrective action and unchanged acceptance criteria. After one correction without progress, stop that approach and record what new evidence or external action is required. Save the packet ID/path and next action in `.artifacts/sprint-loop/state.json`, preserving its quota/reset fields.

Evidence is part of the decision record, not a claim that the model has become an independent reviewer or changed its own weights. When a task requires source truth, user comprehension or deployment access, use that actual evidence rather than model confidence.
