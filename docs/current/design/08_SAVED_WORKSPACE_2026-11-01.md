# Saved workspace and returning journeys

Implemented: 1 November 2026.

Saved now provides an overview of the browser-local shortlist, stage counts, and views for Everything, Interested, Preparing, Applied by you, and Set aside. Counts come from the whole validated local snapshot. Filtering precedes pagination; ordering can use recent personal activity or the original save date without changing stored records.

Cards show freshly loaded public title, issuer, category and closing wording. Public facts are not added to browser persistence. Changed revisions and redirected references prompt review before a preparation shortcut is offered. Closed, restricted, missing and failed reads retain the saved reference and personal stage, with distinct messages. Manual refresh also refreshes the displayed public summaries.

Preparing links return directly to the requirements. Applied remains an explicit personal report, never inferred from opening an application route. Review ticks remain transient. History and its meaning are available in each card; existing revision acknowledgement, concurrency controls and identity review are retained.

Storage failures do not appear as an empty shortlist, do not reset stored data, and do not remain in an indefinite loading state. The existing explicit confirmation for clearing all progress is preserved.

Verification passed: typecheck, lint, a production build and all 180 web tests, with six added tests for filtering/counts, ordering, pagination, resume destinations, changed identities and unavailable states. Browser checks cover saving from the feed, changing stage, the focused Preparing view, the requirements shortcut, empty-stage recovery, changed-detail presentation, manual retry and mobile overflow.

The local preview uses fictional records. No production deployment, account backup, cross-device sync, persistent checklist ticks, reminders or submission tracking was introduced. Presentation filters are temporary; saved items and personal stages retain their existing browser-local persistence.
