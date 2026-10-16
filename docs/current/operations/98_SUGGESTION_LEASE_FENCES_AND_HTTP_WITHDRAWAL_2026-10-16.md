# Suggestion lease fences and HTTP withdrawal

16 October 2026. B06-5b2 follows the [withdrawal core](97_SUGGESTION_WITHDRAWAL_REFERENCE_AND_CANCELLATION_CORE_2026-10-16.md) and [suggestions plan](../planning/13_B06_SUGGESTIONS_IMPLEMENTATION_PLAN.md). It adds authenticated lease persistence checks and wires header-authorized DELETE. Overall suggestion configuration and public intake remain default disabled; no environment or deployment is changed. Retention/replay/restore and later B06 acceptance remain open.

## Lease and cancellation boundary

`SuggestionLeases` is a backend-only composition API. It requires an actual shared Catalogue/admission binding and an explicit integer lease duration from 1 through 30,000 ms. Acquire/complete verify identity and transaction-current active source role through Catalogue.mutate. A random lease ID is bound to the verified owner, work generation, start and expiry. Strict stored shapes reject extra fields, mismatched generation, invalid dates/duration and leases on nonpending work. Existing work defaults to no lease.

Acquisition requires expected work revision, pending work, a current valid receipt, and the current unambiguous Source revision/permission/allowlist/pause policy. The bounded inventory of 100 work items admits at most one current lease globally. Expired leases can be reclaimed with a fresh ID/generation; duplicate acquisition cannot allocate another current lease. A lost acquisition acknowledgement may require waiting for the bounded lease expiry before reclaiming; it cannot authorize duplicate execution.

Completion requires the same verified owner, exact lease ID/generation, an unexpired lease, current source policy and at least one surviving unexpired/unrevoked receipt. It accepts only reviewing or unresolved workflow handoff, with no model text, public IDs, source payload or publication. A shared validated outcome writer advances generation, clears the lease and updates only eligible receipts atomically, with fixed minimal audit reasons. It performs no source retrieval, network/model call or public mutation.

Final withdrawal clears the lease and advances generation. Partial withdrawal preserves a lease still needed by others; a fresh submitter can join that same generation. A reviewer decision clears/fences an older lease. Cancelled work, renewed generations, expired/reclaimed leases, changed source policy, revoked roles and no remaining valid reference prevent stale completion. Source/receipt/work reads and validation precede writes; rejected completion cannot partially persist or append an audit.

These checks protect persistence. Lease expiry does not stop an already running external request, and one current lease is not proof of one physical request after a worker outlives it. No suggestion worker, automatic execution, lease CLI command or public operator/lease endpoint is added. Actual execution/abort, provider budgets, source permission and operating capacity still require their existing authority and qualification.

## HTTP withdrawal

DELETE /api/v1/opportunity-suggestions/{id} now dispatches to the existing atomic withdrawal service only under explicit enabled suggestion configuration. It requires the header-only bearer capability and the same canonical-origin, cookie/query/hash/encoding, header-size and private/no-store/no-referrer/noindex guards as status. It accepts no body data. Next supplies an empty stream for bodyless DELETE; the adapter proves zero actual bytes within the bounded read deadline before initializing runtime. Nonempty/announced bodies fail; a stalled stream times out without waiting on an untrusted cancel promise.

Successful output is the strict minimal schema version, receipt ID and withdrawn status. Wrong/missing/expired/revoked/repeated access maps to the same 404 failure. Intake may be off while valid status/withdrawal remains available. Status and withdrawal share the configured bounded credential-operation budget. There are no CORS/cookie grants, bearer URL parameters, secret fields, public result IDs or deletion claims in the acknowledgement.

A backend timeout may still be followed by a committed withdrawal. Retrying can return not-found; that indicates no active access and does not prove physical erasure or distinguish revocation from other unavailable access. Retained private records, work slots and replay evidence remain until explicit B06-5c cleanup. No public facts or other submitter access is removed by withdrawal.

## Verification

Final checks pass: 38 contracts/build, 28 focused runtime/config/HTTP/crypto/policy tests, 78 combined actual emulator cases (13 new lease cases plus 65 prior domain/review/withdrawal/HTTP cases), 90 web tests, lint, typecheck and fresh production build. No skips. Owned Next children and emulator processes shut down. The final actual Next journey passes after one targeted correction; no second general review or weaker acceptance is used. Private commands, initial failure, final logs and source hashes remain under ignored `.artifacts/sprint-loop/b06-leases-http-withdrawal-2026-10-16/`.

The initial run passed 77 of 78 emulator cases; all lease cases passed. Actual Next DELETE returned 400 before reaching expired-receipt authorization. Installed NextRequestAdapter.fromNodeNextRequest passes request.body for methods other than GET/HEAD. One targeted correction accepts only a deadline-bounded zero-byte DELETE stream, preserving the no-body-data requirement. A native empty/nonempty/stalled-stream regression is added. The expiry test also checks acquisition after the existing lease expires, so its no-current-reference failure cannot be attributed only to an occupied lease.

The actual HTTP journey uses a temporary synthetic expiry fixture, restores that fixture only inside the test, then checks real withdrawal, wrong/repeated access, dead create replay, untouched surviving receipt, process restart with intake off and final withdrawal despite source pause. This is local synthetic server/process evidence; browser persistence/device/user and deployed release behavior are not claimed. Existing default-disabled routes remain unavailable before SDK initialization. Prior actual local Auth evidence is credited separately; new lease role tests use a synthetic identity-provider seam and real persisted roles/transactions.

## Remaining work

B06-5c is next: expiry, purpose/retention/deletion, bounded replay window/tombstone handling and restore fences. Existing random replay keys have no issuance window: purging all history cannot itself reject an identical old retry. Restore must not revive revoked/expired capabilities or old generations; backup and key/epoch handling need explicit tested mechanics and actual operating decisions. Keep live intake held while those controls and notices/vendor/edge/review-capacity gates remain open.

B06-6 private receipt UI and B06-7 integrated qualification follow. Actual source permission/inventory/fidelity, funded review/provider operations, user/device/accessibility evidence, deployed identity/rules/egress, retention adoption and release authority remain separate gates. All six categories, both internship routes, broad jobs, free consumer access and later roadmap ambition remain unchanged.
