# Local progress storage foundation

16 October 2026. First packet of the [B05 implementation plan](../planning/12_B05_LOCAL_CONTINUITY_IMPLEMENTATION_PLAN.md), based on source sprint `277ea82`. This is a storage/contract foundation; no save UI, saved page, notification channel or personal-data migration is activated.

## Implementation

The strict version-1 document stores at most 100 entries: public opportunity ID, last viewed revision, saved/updated times, reversible personal stage, last route-opening action and reported-Applied time. Duplicate IDs and extra source, destination, receipt or personal-document fields are rejected. Reported Applied requires its own local report timestamp; a route-opening event cannot set or demote it. These remain user-controlled annotations, not employer or submission evidence.

Native IndexedDB uses a dedicated `skilved-local-progress` database and a bounded JSON document. Save/remove/stage/route/revision actions compare the observed write token inside the same readwrite transaction that writes the next document. Success waits for transaction completion, including protection against an abort after a successful put request. Clock rollback is rejected rather than used as concurrency authority.

Clear commits an empty document with a new token. Stale tabs then conflict rather than resurrecting removed progress; an actual database deletion also invalidates a caller's old token. Clear does not remove site data, theme or another database. Reads and UI invalidations do not replay writes. Malformed, older/future and oversized documents return safe unreadable states and remain untouched until an explicit scoped clear. Unavailable/blocked/open/quota/abort failures return bounded safe results without private exception text. Connections are short and close on version change.

## Actual verification

- Frozen offline selected-workspace install, contract typecheck and **32 contract tests** pass.
- Web lint/typecheck/production build and **69 web tests** pass, with no skipped tests. Nine new storage tests cover strict privacy boundaries, independent connections, save/remove/revision acknowledgement, reversible stages and independent route actions, one winner for competing edits, clear/deletion stale-tab protection, malformed/versioned data preservation, quota throw, abort after put success, blocked/unavailable storage, separate receipt database, limits and stale clocks.
- Development tests pin `fake-indexeddb` 6.2.5. The [maintainer's documentation](https://github.com/dumbmatter/fakeIndexedDB) describes its in-memory Node test API. These results establish application transaction behavior in that implementation; they do not establish disk durability, real browser restart, eviction, physical-device or participant behavior. No new browser observation is claimed.

Private commands, results, checked input hashes and packet review stay ignored under `.artifacts/sprint-loop/b05-storage-2026-10-16/`. Existing local environment/dependencies were used; no fresh-install or hosted CI claim is made. No source/provider/store-worker/publication control changed and no provider call occurred.

## Next packet and limits

B05 is **in progress**. Implement explicit detail save/remove and a saved-list surface, hydration/focus/pageshow reads, read-only cross-tab invalidations, successful first-save/shared-device/loss notices, stage controls and scoped clear confirmation. Then reconcile current facts, changed/restricted/closed/missing/merged identities and route-opening behavior. UI effects must not automatically replay a failed or stale mutation. A conflict requires reading current state and a new explicit action.

The current source trial `277ea82` produced one private draft and separately reports 505 tests; repeatability and independent source qualification remain open. This storage packet neither expands provider budgets nor approves inventory. Formal G2, source/held-out/seasonal/user/device/deployment/release gates remain open. Full B05 browser/user/loss acceptance is not claimed by the foundation tests.
