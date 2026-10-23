# Suggestion work, replay and counter reclamation

23 October 2026. B06-5c3b2 extends the [receipt retention primitive](151_SUGGESTION_RECEIPT_RETENTION_CLEANUP_2026-10-23.md) with bounded authenticated removal of empty work, obsolete approved-result replay bindings and elapsed hourly counters. These remain backend primitives without a route, CLI, scheduler, actual retirement decision or cleanup of live data. Suggestions remain default disabled.

## Work capacity and generation continuity

Work removal requires source-role authority, expected work/admission revisions, and reconciled bounded receipt/replay/work/public-binding inventories. Only cancelled work with zero receipts, zero unrevoked references and no lease can be removed. The transaction deletes the private work/URL row, decrements its physical work count and raises a single admission generationFloor to at least the deleted generation. No per-URL tombstone collection grows over time.

First reclamation atomically promotes admission state from version 1 to version 2, where the bounded integer floor is required. Subsequent mutations preserve it. Missing, malformed or overflowed version-2 floors fail unavailable rather than restart a generation at one. Version 1 remains supported before reclamation and cannot carry a floor. Fresh work starts above the stored floor; restarting a retained cancelled anchor still advances its own generation. The existing lease ID/owner/source/time/recovery-epoch checks also remain. Exhausted numeric range fails closed without partial receipt/work allocation.

The floor lives in the database and does not establish independent restore safety by itself. Actual restores still require fresh coherent recovery configuration outside the backup and stopping old processes. Older binaries that cannot handle version 2 must not be reopened against reclaimed state. No production migration or recovery procedure is performed here.

## Public replay and hourly counters

Approved-result replay removal requires the binding ID, expected creation time and admission revision. It validates at most 500 public bindings plus receipt history, rejects malformed/oversized records and receipt/public binding-ID collisions, and removes only the selected binding. New bindings carry their recovery epoch. Current finite ticket windows remain protected through retainUntil; shorter decision expiry cannot reclaim a slot early. Tagged retired contexts require the existing explicit trusted declaration.

Pre-upgrade untagged bindings can belong to current recovery-mode tickets. Their finite deadlines therefore remain protected even when legacy retirement is declared. Undated untagged bindings require explicit trusted legacy retirement. No missing epoch or deadline is automatically treated as safe deletion. Removing an empty work row preserves a still-live approved replay; subsequent public-result removal still returns previous_result_unavailable without manufacturing new work. Independently sourced public facts remain unchanged.

Counter removal requires a canonical kind/hour ID and exact expected window/count. It rejects current/future windows, mismatched identity, unaligned hours and impossible counts. Only the selected elapsed counter and a fixed minimal audit are written; the current-hour counter and admission floor are untouched. An already captured old-window charge can recreate its old bucket after cleanup. The fixture checks that this does not refund the current-hour allowance. Cleanup is not cancellation of an in-flight charge or a guarantee that a row can never reappear. Trusted coherent clocks remain an operational prerequisite.

All methods use existing authenticated source-role transactions and fixed audit reasons. Shared receipt/replay consistency retains the prior 8 KB bounds and bijective ownership checks. Queued audit failure or an observed callback clock rollback aborts the transaction. This does not prove database-commit-time cancellation, distributed clock coherence or backup/vendor erasure.

## Verification

Final integrated verification passes: all 124 suggestion emulator cases (15 new), 41 focused replay/crypto/policy/HTTP/config/runtime checks, 40 contract checks and 90 web tests, with zero failures or skips in the final suites. The fresh production web build passes including lint and type checks. Commands used the existing catalogue test runner with serial emulator files, pnpm contracts:test, pnpm web:build and pnpm web:test. The four implementation/test input hashes match the corrected verified inputs; documentation links and whitespace checks pass. The emulator runner and its fixture Next child shut down after the suite.

The first 124-case run passed all 15 new reclamation cases but failed one existing concurrent/restarted replay test with Firestore gRPC code 3, Transaction is invalid or closed. Its assertions remain unchanged and the failure log is preserved; no cause is inferred or production retry policy changed.

Focused review found that an optional floor could disappear and be interpreted as legacy absence. An added dropped-floor case reproduced a missing rejection, with 14 of 15 reclamation cases passing. One targeted correction adds required version-2 floor state and atomic promotion, retaining version-1 compatibility before cleanup. Raw command logs, hashes and recovery remain private under .artifacts/sprint-loop/b06-capacity-reclamation-2026-10-23/.

The new cases exercise identity/revisions, saturated work capacity, stale lease rejection, same-notice recreation, a global floor across different notices, malformed/missing/overflow state, cleanup/admission contention, finite and untagged public history, explicit legacy/epoch retirement, live replay/public-fact preservation, corrupt/colliding/oversized records, counter boundaries/identity/counts, late charging, same-item contention, queued audit failure and clock rollback. No real source/provider/model request is made.

## Remaining work

Operator cleanup preview/command integration and integrated lifecycle qualification remain before this is an actionable operating workflow. Retired-epoch/legacy declarations are trusted decision inputs, not proof that old processes were stopped or operational approval was granted. No scheduling or execution authority is added by local tests. Actual backup/vendor deletion, purpose/notices, funded staffed operations, edge controls, user/device evidence and release authority remain separate gates. Receipt UI and B06 integrated qualification remain next in M0; all six categories and the broader roadmap remain in scope.
