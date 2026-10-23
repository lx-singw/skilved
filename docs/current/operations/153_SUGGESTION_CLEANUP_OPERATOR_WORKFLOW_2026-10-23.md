# Suggestion cleanup operator workflow

23 October 2026. B06-5c3b3 composes the delivered [receipt cleanup](151_SUGGESTION_RECEIPT_RETENTION_CLEANUP_2026-10-23.md) and [work/public replay/counter reclamation](152_SUGGESTION_WORK_REPLAY_AND_COUNTER_RECLAMATION_2026-10-23.md) with the private operator CLI. Suggestions remain default disabled; no live cleanup, deployment, source/provider/model call or production configuration activation is performed.

The [operator instructions](../engineering/15_SOURCE_PUBLICATION_RUNTIME.md#suggestion-cleanup-operator-workflow) describe strict candidate preview and single-item command envelopes. Separate trusted JSON configuration requires explicit retirement policy and defaults mutation off. Command data cannot supply policy or enable mutations. The current recovery context, project/mode and active source-role authorization remain required.

Read-only previews return bounded ID-ordered pages of minimal preconditions, with no URLs, capabilities, tickets, notes, epochs or raw records. Receipt/work/public previews reconcile bounded inventories; counter previews validate one bounded page and lookahead. These are candidates, not eligibility or deletion approval. Existing commands recheck their current transactional guards. A successful state-changing removal invalidates the other admission revision preconditions from its preview; operators must refresh rather than guess. No automatic or bulk cleanup exists.

## Verification

Final verification passes: all 132 suggestion emulator cases (eight new), 45 focused config/dispatch/replay/crypto/policy/HTTP/runtime checks, 40 contract cases and 90 web tests, with zero failures or skips. A fresh production web build includes passing lint/type checks; operator help exits successfully. The emulator files run serially through the existing catalogue node test runner, followed by sequential pnpm web:build and pnpm web:test; pnpm contracts:test and the focused node test suite also pass.

New cases check source identity/role, strict input/default-off policy, stable bounded minimal pages with unchanged data/audit, stale preview rejection, shared live receipt preservation, expiry and work recreation, trusted recovery retirement, finite untagged public history/public facts, old/current counter preconditions and malformed inventories. The actual private-file CLI fixture verifies emulator token authentication, removal only after explicit fixture enablement and rejection after source-role deactivation. Existing 124 emulator assertions remain unchanged. No targeted correction was necessary.

One focused planning and review pass found no material implementation defect; targeted corrections: none. Raw logs and input hashes remain private under .artifacts/sprint-loop/b06-cleanup-operator-2026-10-23/. Proposed checks are not treated as passed until their command results are available.

## Limits and next work

This completes only the local operator integration packet. Actual retirement decisions, coherent old-process shutdown, independent restore configuration, purpose/notices, funded staffed operations, backup/vendor deletion, edge controls, user/device observations, source qualification and release authority remain external. No local test proves them. Preview pagination does not establish a frozen cross-page inventory or scale/cost qualification; late old-window charges may recreate old counters. All six categories and the full roadmap remain in scope.

Next implement B06-6 private receipt UI with separate native IndexedDB access, URL-only form, signed-ticket retry, safe status/withdrawal/local-forget behavior and browser reload/tab/loss/clear/privacy checks. B06-7 integrated/formal qualification remains; keep suggestions disabled until actual required operating and release gates are met.
