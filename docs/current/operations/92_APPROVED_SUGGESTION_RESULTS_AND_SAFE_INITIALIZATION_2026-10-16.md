# Approved suggestion results, retry outcomes and safe initialization

16 October 2026. B06-3b completes the local create-orchestration checkpoint in the [B06 sequence](../planning/13_B06_SUGGESTIONS_IMPLEMENTATION_PLAN.md), following [review admission](91_SUGGESTION_REVIEW_ADMISSION_AND_LIMITS_2026-10-16.md). No HTTP endpoint, worker, UI or runtime activation is added. Public intake remains disabled; full B06 and formal release acceptance remain open.

## Current approved results

The backend create method checks for current approved results inside the same transaction used for a new intake decision. It first preserves any already-issued private receipt outcome, then validates the current Source registry and supported notice policy for a new or previously public outcome. The lookup reads bounded existing public projections and alias decisions rather than fetching any source.

URL equality alone is insufficient. Each eligible canonical public projection must fit the current Source category scope and match the current approved private draft's projected content exactly, including identity/revision. An approved citation for the exact submitted notice must bind to a private snapshot with the matching snapshot ID, URL, selected source ID, current source revision and a retrieval time no later than the test/runtime clock. Source permission remains an actual external prerequisite; configuration and fixture snapshots are not permission evidence.

The existing automatic-freshness guard suppresses expired automatic projections. Draft-only, unapproved, stale/mismatched private projections and missing/wrong/future snapshot provenance do not supply approved IDs. Closed but still approved public records remain valid public results; their canonical detail retains closed/unavailable application behavior. No response asserts that a listing is open or a person qualifies.

Confirmed aliases omit hidden originals. A canonical target must independently carry matching current notice provenance; an alias alone cannot supply it. Reversed decisions allow the original identity again. Malformed alias/public records, cycles, excessive bounds or more than 20 matching canonical candidates fail closed. The result contains all applicable sorted IDs, preserving multiple intakes, all six categories and both internship routes; it never selects the first record or filters to trades/students.

Lookup bounds are 1,001 public documents to enforce a 1,000-document ceiling, 101 aliases to enforce 100, at most 20 canonical candidate drafts and at most 20 matching notice citations per candidate. Private document JSON is size bounded before parsing. This is a bounded M0 collection read and point-read implementation; no production latency/load or more scalable URL index is claimed.

## Retry and capacity behavior

The separate suggestions contract now defines three strict create outcomes: received with private access; approved with 1–20 unique current public IDs; previous_result_unavailable with no stale IDs. Public outcomes contain no receipt capability, submitted URL or private state.

An initial approved outcome creates no receipt, work item or work reference. It stores only a private hashed replay-key binding, private work/input hash and fixed creation/expiry times in a separate public-decision replay collection; it stores no plaintext replay key, URL, server secret or public listing IDs. The configured receipt ceiling also separately bounds retained approved-decision bindings, with a hard maximum of 500. A bounded physical count and the shared admission-state revision serialize capacity under contention. Expired bindings conservatively retain slots until lifecycle cleanup.

Concurrent and restarted same-key retries preserve the decision and expiry. A previous approved decision rechecks current public truth on every retry; removal yields previous_result_unavailable without manufacturing a receipt or queue job. Expired replay cannot become a new decision. Changed input conflicts. A previous private receipt stays the same private receipt even if a listing is subsequently published; the receipt's later reviewer resolution remains B06-5. Both receipt and approved bindings for one key are inconsistent and fail closed. All enabled create attempts, including retries and semantic failures, retain B06-3a's committed attempt charge.

The internal admitReview seam remains for composition/testing; an eventual HTTP adapter must call create to include approved-result handling. No current public adapter calls either method.

## Safe initialization

Initialization uses an actual Catalogue instance on the same database and its existing mutate authorization/transaction/audit path. It requires verified identity plus the current active source operator role. Missing state is initialized only when receipt, work and both replay collections are empty. Existing valid/corrupt state or any orphaned records cause conflict, never automatic zeroing/repair. Concurrent attempts have one winner, and the state plus audit commit atomically. Existing rate counters are not reset by initialization.

The new tests exercise this path with a clearly synthetic identity-provider seam and actual persisted emulator operator roles/audit. They do not claim a newly exercised live Auth provider, production access or granted operating authority.

## Observed verification and remaining work

All 37 contract tests and contract build, seven crypto/policy tests, 35 combined actual Firestore emulator tests, all 89 web boundary tests and web typecheck pass with no test skips. The 35 emulator cases include 14 new create/initialization cases plus all 14 admission and seven receipt regressions, under the standard demo runner selection with separate fixed demo fixture projects and repository rules. New cases prove all categories/routes/multiple intakes, private approval/provenance/revision checks, current Source category scope, automatic expiry and closed results, aliases/reversal/cycles, concurrent lost-response public retries/removal/expiry, receipt-to-public timing, approved-binding capacity contention, malformed/cross-outcome state, candidate bounds, current operator roles, concurrent audited initialization and refusal to reset orphaned data. The owned emulator services shut down successfully.

Focused review reproduced one missing guard: a public projection outside its current Source category scope returned approved. One targeted correction adds that scope check without changing the expected result; the retained regression now passes in the final 35-test emulator run. The private failing reproduction is preserved as evidence.

No browser, production build, full catalogue/provider suite, live source or participant observation is claimed. Private packet/checks/logs and five final source/test hashes remain under ignored .artifacts/sprint-loop/b06-approved-2026-10-16/.

B06-4 is next: disabled-by-default, bounded versioned HTTP methods, header-only credentials, redacted errors and no-store/no-referrer transport. Full reviewer resolution/current-public receipt status, withdrawal/reference/lease races, expiry/purge and both replay collections' deletion/backup behavior remain B06-5. Do not treat TTL expiry as safe deletion or erase replay history and allow old credentials to recreate records. UI/browser/integrated qualification follows. Actual source permission, review coverage, edge controls, secrets/retention notice, inventory, provider/user/device qualification, funded operations, deployment and release decisions remain open, together with B05's remaining formal checks. No provider expansion, paid resources, outreach, public collection, deployment or publication was activated.
