# Private suggestion receipts and response-loss recovery

16 October 2026. B06-2 in the [suggestion implementation sequence](../planning/13_B06_SUGGESTIONS_IMPLEMENTATION_PLAN.md) is locally implemented and tested. This is a backend foundation; public intake remains disabled and no receipt UI or endpoint is added.

## Implemented boundary

The separate browser-safe suggestions entry point now defines strict receipt access and minimal status responses. It admits only bounded IDs, a fixed-format capability, status, revision, canonical times and bounded public result IDs. Extra URL, notes, contact, nonce, key or work fields are rejected. Status/result and timestamp combinations must be consistent. These schemas are not exported through general public opportunity projections.

The backend-only SuggestionReceipts component uses separate private receipt and replay collections. Its createOrReplay method composes inside a Firestore transaction; the later admitted-intake caller must perform source, capacity and queue checks before writing. This packet provides no independently callable public create operation or queue authority. Creation stores no submitted URL, plaintext capability, plaintext idempotency key or server secret. An input hash binds the normalized URL and private work ID; a domain-separated hash of the high-entropy replay credential locates the private replay mapping.

Each receipt has a fresh 32-byte random ID and nonce. A dedicated 32-byte server key derives the receipt-scoped status/withdrawal capability through HMAC-SHA-256 with a versioned domain label, key ID, receipt ID and nonce. Only its hash and derivation metadata are persisted. Key material remains in private class fields; configuration requires an explicit active key, one to four unique keys, explicit canonical clock and bounded positive TTL of at most 30 days. There is no default key or runtime activation. Configuration checks validate shape, not actual key-generation entropy or production secret operations.

An authorized same-input retry returns the same capability, receipt, revision and expiry after client recreation, even if a later command supplies a different expiry. Different input conflicts. Distinct replay credentials for the same private work produce separate IDs and capabilities; this does not yet establish queue deduplication. Expired mappings, revoked/expired receipts, missing or malformed records, a substituted receipt ID and removed/replaced keys fail without recreating access. Retained old keys allow existing access during rotation, while new receipts use the new active key.

Status checks read one receipt document and require the matching capability. Fixed-format validation precedes constant-time comparison of equal-length hashes; wrong, malformed, missing, expired and revoked credentials share SUGGESTION_NOT_FOUND. This is not a claim that complete database/HTTP timing is constant. The [Node crypto documentation](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b) describes both the comparison primitive and that surrounding-code limitation.

Private status output excludes submitted input, work identity, credential/hash/derivation data and internal notes. Stored resolved IDs are deliberately unavailable until B06-5 supplies a current-approved-public-result guard; stored IDs alone cannot produce a listing response. Withdrawal and retention mutation/cleanup are also still B06-5; the current revocation predicate is tested using synthetic persisted revoked records.

## Observed verification

- pnpm contracts:typecheck and pnpm contracts:test pass; all 36 contract tests pass, including the new strict access/status cases.
- Seven combined crypto/configuration and existing suggestion-policy tests pass. They cover missing/invalid/oversized/duplicate key configuration, derivation scope/rotation, private record/command rejection and the existing URL/source policy boundary.
- Seven Firestore emulator tests pass with no skips under the repository's actual firestore.rules. They exercise persisted response-loss replay after component recreation; six concurrent same-key transactions; changed-input conflict; separate submitter credentials; minimal status; anonymous direct database read/write denial for both collections; expiry/revocation/malformed/missing records; rotation/removal/replacement; invalid TTL/clock and withheld resolution IDs.
- All 89 web boundary tests and web typecheck pass. No UI changed, so no browser or visual result is claimed. No new production build, full catalogue/provider suite, live source or model evaluation is claimed for this packet.

The emulator uses an isolated demo project and local ports; its services shut down successfully. Private command logs, five checked source/test hashes, packet/review/checkpoint and raw emulator data remain in ignored .artifacts/sprint-loop/b06-receipts-2026-10-16/. Test keys and clocks in tracked tests are synthetic.

## Remaining gates and next work

B06-3 must compose this foundation with atomic admitted intake, current source permission/revision/pause checks, approved-result lookup, global attempt/status budgets, capacity and deduplicated review work. No rate/capacity guard or source truth is supplied by these low-level receipt primitives. B06-4 adds disabled-by-default, header-only HTTP access and safe error handling. B06-5 must prove reviewer authorization, expected revisions, withdrawal/reference-count/lease races, current public result resolution and expiry/purge mechanics, including replay after deletion/backup restoration. Purging both receipt and replay records is not yet implemented or claimed safe against revival.

Later UI/browser/integrated packets and actual key provisioning, supported workload, edge abuse controls, review coverage, adopted retention/notice, permission, six-category inventory, participant/device, provider qualification, deployment and release evidence remain open. The 30-day engineering ceiling does not adopt a production retention policy. B05's remaining formal acceptance checks stay open. No provider calls, public collection, paid resources, outreach, deployment or publication is activated.
