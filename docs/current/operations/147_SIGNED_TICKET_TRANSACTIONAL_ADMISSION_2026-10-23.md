# Signed-ticket transactional admission

23 October 2026. B06-5c2a connects the [signed replay-ticket foundation](141_SIGNED_SUGGESTION_REPLAY_TICKET_FOUNDATION_2026-10-22.md) to backend issuance and transactional create/replay. The HTTP adapter and runtime do not select this mode yet. Suggestions remain default disabled; no cleanup, capacity reclamation, worker execution or live collection is activated.

## Backend behavior

An explicit fourth `SuggestionAdmission` constructor argument must contain an actual `SuggestionReplayTickets` instance. Invalid options and duck types fail unavailable. Omitting this argument retains the existing legacy composition for the pending transport migration. Within ticket mode, neither a raw legacy key nor the private ticket digest is accepted in place of the full signed credential.

The backend-only `issueTicket` method reuses the bounded current source registry and classifier. Paused, unsupported, ambiguous or malformed source policy cannot issue a ticket. Issuance and submission share the existing separately committed create-attempt budget; malformed and unsuccessful attempts still count. A normal new ticket followed by submission consumes two attempts. Issuance reserves no receipt/work capacity and writes no receipt, replay binding or queue item. Intake-off mode refuses issuance and creation while existing status/withdrawal remains available.

Each ticket-mode transaction attempt validates the URL-bound signature, active epoch and deadline before reading replay state. Every successful callback return rechecks validity, including existing-receipt and approved-result replay. Receipt and public-decision expiry are capped by the earlier of the configured receipt lifetime and the original ticket deadline. Retrying cannot extend that deadline or recreate a revoked receipt. Existing source, approval, physical-capacity, separate-submitter and cancellation rules remain in place.

Both private replay histories can now record `retainUntil`, the ticket deadline. This differs from the shorter access/decision expiry: a receipt can expire before its ticket, so its denial binding must survive until the ticket itself is invalid. The receipt composition command carries this deadline as `replayExpiresAt`; it is not a public request field. Stored markers reject inconsistent bounds and retention beyond thirty days after receipt or approved-binding creation. Legacy mappings omit the new field and are not rewritten or assigned an invented safe deletion time.

Mappings and counters contain no plaintext submitted URL, ticket, capability or signing secret. Approved-result bindings retain hashed work identity rather than selected public IDs; replay rechecks current approved results. Receipt replay still works at capacity or after a source pause, provided its ticket and own access remain valid. Withdrawal retains denial history and another submitter's needed work.

## Verification

All 92 actual isolated suggestion emulator cases pass: 14 new ticket-admission cases and 78 existing receipt/admission/create/review/withdrawal/lease/HTTP cases. The new cases cover strict configuration, source-gated issuance, shared attempt charges, concurrent/restarted response-loss recovery, distinct submitters, delayed issuance, shorter receipt lifetime, immutable deadlines, wrong URL/raw key/digest/retired epoch, approved-result removal, withdrawal isolation, clock disagreement and legacy preservation.

An injected `ABORTED` error makes the actual Firestore transaction machinery retry after the synthetic clock advances to expiry. No queued receipt, work or mapping commits, while the separate attempt charge remains. Another injected clock change after approved-result reads rejects the successful callback and rolls back its queued binding/state writes. Fixture-only deletion of private history at ticket expiry still cannot turn the expired ticket into a fresh request. These are authored emulator fault cases, not actual backup, processor-deletion or production observations.

The first 92-case run passed. Focused review then found that a corrupted retention marker could name a far-future date. An added rejection case reproduced one failure among the 14 new tests. One targeted upper-bound correction now passes all 92 cases with the original criteria intact. Failure and successful logs remain private.

All 38 contract tests, 37 focused signer/crypto/policy/config/HTTP/runtime checks and 90 web tests pass, with no skipped tests. A fresh production build includes passing lint and type checks. Final source/test hashes match the verified inputs. Commands use `pnpm contracts:test`, the selected catalogue `node --test` files, the Firestore/Auth emulator runner with the fixed demo project, `pnpm web:build`, then `pnpm web:test`. Raw logs and recovery state remain ignored under `.artifacts/sprint-loop/b06-ticket-admission-2026-10-23/`.

## Remaining dependencies

Next wire strict ticket contracts, trusted key/epoch configuration, bounded header-only issuance/create transport, runtime selection and route inventory. A ticket-configured public runtime must not fall back to accepting legacy keys. Preserve disabled-before-SDK, origin/body/header/privacy/deadline guards, response-loss recovery, attempt budgets and intake-off status/withdrawal. The existing HTTP path has not migrated in this packet.

Cleanup remains unimplemented. Retain used bindings through `retainUntil`, preserve legacy history until explicit fail-closed retirement, and reconcile retained/unrevoked counts atomically before deleting anything. Protect other submitters, independently sourced public facts and generations across cancellation, deletion and recreation. Callback-time checks do not prove database-commit-time or transport-timeout cancellation.

Before serving restored data, independent trusted state outside the backup must fence old replay epochs, receipt capabilities and leased work. No such complete restore sequence is claimed here. Actual backup/vendor deletion, purpose/retention notices, staffed capacity, participant/device evidence and release authority remain external gates. No source/provider call, paid resource, deployment, production setting or publication is added; separately delivered source work is preserved without expanding this loop's authority.
