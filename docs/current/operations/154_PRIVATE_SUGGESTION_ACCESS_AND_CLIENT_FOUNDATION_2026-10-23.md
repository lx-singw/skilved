# Private suggestion access and client foundation

23 October 2026. B06-6a adds a browser-only private receipt/ticket ledger and explicit request composition around the delivered suggestion contracts and four server routes. The [operator cleanup packet](153_SUGGESTION_CLEANUP_OPERATOR_WORKFLOW_2026-10-23.md) remains credited separately. No form, receipt screen, browser session hook, automatic polling, route, deployment or activation is added. Suggestions remain default disabled.

## Committed private access

The native IndexedDB implementation uses skilved-suggestion-access, separate from skilved-local-progress. Its strict versioned document contains a random write token and at most25 bounded entries, with a100 KB byte ceiling. Malformed, unsupported and oversized documents remain untouched until explicit receipt clear. Writes acknowledge only transaction completion; blocked storage, quota, abort and unavailable storage do not report saved access.

An explicit submit first commits a local draft with the canonical URL before ticket issuance. The returned ticket and exact expiry commit before create, followed by a committed sent marker before the request. This gives every in-flight response a non-null local revision to recheck even after database deletion. A lost create response keeps the same ticket for an explicit retry across a new connection; it does not issue another ticket. Draft-only issuance failure may request a new ticket because no create was sent. There is no automatic mutation replay on read/reload.

Received access replaces the pending URL/ticket only after its transaction commits, with no expiry extension beyond the saved ticket window. Displayable submit results contain only an outcome and local ID or validated public result IDs. The private store API necessarily contains bearer access and must never be serialized to metadata, logs, analytics, export or public output. No local public facts or server-status cache is written. Current status is read explicitly and its receipt identity/expiry must match saved access.

Compare-and-swap writes reject stale tab actions and late responses after forget, clear or database deletion. Local forget/clear affects only this ledger and makes no server request. Withdrawal requires an actual server acknowledgement; its result separately states whether local removal also committed. A failed withdrawal retains access. Expired/pending entries are not automatically purged. Browser eviction or whole-site clearing can lose access, with no account backup or cross-device recovery; actual UI notices and retention decisions remain required.

## Request boundary

The transport uses only fixed relative same-origin endpoints, no-store cache, omitted browser credentials, no referrer and redirect error mode. Issuance/create bodies contain only URL. The signed ticket goes only in Idempotency-Key on create; receipt capabilities go only in Authorization on status/withdrawal. Receipt IDs occupy their designed path segment. No ticket or capability is added to a URL, query, hash or display result.

Success responses require bounded JSON streams (8 KB), shared strict contracts and matching receipt identity/expiry. Aborts and an eight-second default deadline return safe outcomes, including when an injected fetch ignores cancellation; late responses cannot publish saved access. Error bodies and private exceptions are not surfaced. Browser code checks ticket syntax/coherent expiry; signature verification and current authority remain server responsibilities. This does not protect a compromised same-origin script or establish browser/device qualification.

## Verification and correction

All17 focused client/store cases and all107 web cases (90 existing plus17 new) pass, with40 contract cases and a fresh production build including lint/type checks. Focused cases are included in the combined web count. They use fake-indexeddb and injected fetch/stream/transaction behavior, not an actual browser or live service. The backend is unchanged; prior132 emulator results remain evidence at a1cf330, not a new emulator run for this packet.

Checks cover connection persistence, phase ordering, response loss/same-ticket retry, compare-and-swap contention, clear/deletion during issuance/create, abort/quota after put success, malformed/future/oversized data, clock/expiry bounds, independent progress/receipt clear, private header/body boundaries, response identity/expiry, oversized streams, redirect/abort/deadline failures, uncached status, stale reads, explicit withdrawal versus local forget and honest public outcomes.

One focused review found that oversized stored strings were encoded before a coarse length check. A new allocation-observation case reproduced one unnecessary encoded copy (16/17 passed). One targeted length guard now rejects oversized strings before encoding while preserving the byte bound and all prior criteria;17/17 and the combined suite pass. Raw failure/results and hashes remain private under .artifacts/sprint-loop/b06-receipt-client-2026-10-23/.

## Remaining work

B06-6b must implement the URL-only form, private receipt screens and safe session reconciliation, then verify actual browser reload/new-tab/clear/loss/concurrency, keyboard and narrow/wide layouts. Native browser behavior, actual server/client browser integration, user/device comprehension, operating capacity, retention purpose/notices, source qualification and release authority remain unproven. B06-7 integrated/formal qualification remains open. Keep all six categories and the broader R0–R5/S01–S35 scope.
