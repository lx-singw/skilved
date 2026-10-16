# Suggestion review admission, shared work and limits

16 October 2026. B06-3a in the [suggestion plan](../planning/13_B06_SUGGESTIONS_IMPLEMENTATION_PLAN.md) is locally implemented. This checkpoint implements review admission; B06-3b's current-approved-listing shortcut and complete create orchestration remain required before HTTP. Public intake stays disabled.

## Implemented behavior

The backend-only SuggestionAdmission component composes the [private receipt foundation](90_PRIVATE_SUGGESTION_RECEIPTS_AND_REPLAY_2026-10-16.md) with transaction-current Source records, capacity and private pending work. It accepts a strict URL-only request plus a separate fixed-format replay credential; callers cannot choose a source or grant permission. Missing/invalid policy fails closed. Policy must explicitly specify enabled state, TTL and positive limits no higher than 100 work records, 500 receipt records, 50 create attempts/hour and 600 status calls/hour. TTL cannot exceed the configured receipt component's maximum. These are engineering ceilings with smaller synthetic test values, not funded production capacity.

New review admission reads at most 101 Source documents and fails for more than 100, no sources, invalid JSON/schema, mismatched document identity, ambiguity, unsupported URLs or pause. Existing Source and target-policy validation is reused. A selected current source revision and a fingerprint of its permission configuration are recorded in private work. Permission configuration is not actual permission evidence. Reusing work after source identity/revision/permission drift fails until a later authorized lifecycle operation reconciles it. No stale caller preflight is trusted.

The stable work ID is a domain-separated private hash of the normalized URL. Distinct submitters receive separate receipts/capabilities while sharing one pending review-only work record and its reference count. Suggestion work uses a separate collection and cannot invoke the existing automatic polling/publication pipeline. There is no fetch, provider call, lease, automatic retry or worker execution in this component.

All source and capacity reads precede receipt writes. Receipt/replay creation, work/reference count and global capacity state commit in one transaction. Capacity requires an explicitly initialized strict state document. It is reconciled against bounded physical reads of at most 501 receipts and 101 work records, validated record identities, work hashes and per-work receipt counts. Missing, corrupt, mismatched or orphaned state fails closed; it is never reset to zero automatically. Existing expired/revoked records conservatively retain slots until B06-5 cleanup. Authenticated empty-queue initialization and later lifecycle reconciliation remain to implement; tests seed state only in their isolated demo project.

The receipt component now provides a read-only authorized replay operation. A known same-input credential recovers the same access without adding a slot/reference or starting work, including after a source pause/drift or at capacity. Changed input conflicts; expired/revoked access cannot reenqueue through replay. This is recovery of existing access, not permission to process the paused source. Turning off new intake rejects new create calls while leaving budgeted status available.

Create-attempt and status-call charges commit in separate small transactions before semantic processing. Malformed, unsupported, capacity-denied, wrong-credential and retried enabled calls consume their applicable budget; later failure/rollback cannot refund a charge. Concurrent requests cannot overdraw it. Fixed UTC-hour counters roll over to a new bounded counter; malformed or mismatched existing counters remain untouched and unavailable. Disabled intake performs no create charge. Anonymous edge abuse protection and cleanup of historical counters remain launch/lifecycle work.

Submitted URLs exist only in private work, not receipt/replay/capacity/rate records, responses or error codes. Backend component errors use stable domain codes for semantic failures. The future HTTP adapter must also redact unexpected SDK errors and enforce transport bounds. No client database permission is added.

## Actual verification

- All 36 shared contract tests pass with contract build.
- Seven crypto/configuration and existing suggestion-policy tests pass.
- Fourteen new actual Firestore emulator tests pass: concurrent and restarted replay; distinct submitters/shared work; malformed/paused/unsupported/current source changes; receipt capacity contention; different URLs racing for the last work slot; strict missing/corrupt/drifted state; rollback after queued receipt writes; committed attempts on failed/retried calls; concurrent attempt limits; hour rollover; status budgets with disabled intake; malformed counters; expired/revoked replay.
- All seven existing receipt emulator tests pass after the read-only replay refactor, including direct anonymous database read/write denial under actual repository rules.
- The final combined 21 emulator tests also pass under the standard catalogue runner's demo-skilved-b03 project selection, with fixture data kept in separate fixed demo projects. Review caught the prior tests' overly narrow project-ID guards; the targeted correction accepts only the three known demo runner IDs and retains explicit loopback emulator guards. No assertion was removed or test skipped.
- All 89 web boundary tests pass. No browser, production build, lint/typecheck or full catalogue/provider suite is newly claimed; changed runtime files are backend JavaScript and no UI/route is wired.

Private task/review, exact checked file hashes and command/emulator logs remain in ignored .artifacts/sprint-loop/b06-admission-2026-10-16/. Every owned emulator run shut down successfully. Tests use synthetic keys, URLs, permissions and clocks.

## Next and held gates

Complete B06-3b before B06-4: bounded current approved-public provenance lookup with confirmed/reversed alias handling and all applicable intakes, coherent approved-result versus receipt replay behavior, and authenticated safe empty-queue initialization. Do not expose admitReview directly as a complete create API; it intentionally does not check for already approved results.

Reviewer mutation, current-public result resolution, reference removal/cancellation/leases, expiry/purge/counter cleanup and replay after deletion/backup restoration remain B06-5. Conservative slots may fill while cleanup is absent; there is no implicit eviction. Physical document reads are bounded, but production latency/load has not been measured. Actual source permission, inventory, review staffing, edge controls, secrets/retention notice, user/device/provider qualification, operating funds, deployment and release authority remain open. B05 formal acceptance remains open. No source access, provider expansion, paid resources, outreach, public collection, deployment or publication was activated.
