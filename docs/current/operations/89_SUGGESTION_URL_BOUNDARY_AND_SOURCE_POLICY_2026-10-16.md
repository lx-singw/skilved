# Suggestion URL boundary and source policy

16 October 2026. B06-1 begins the [complete B06 implementation sequence](../planning/13_B06_SUGGESTIONS_IMPLEMENTATION_PLAN.md). The source/route audit found no existing suggestion intake, status/withdrawal route, private receipt store or suggestion contract. Existing incorrect-listing reports remain a separate feature. B06-2–7 are not delivered by this packet.

## Implemented boundary

A separate browser-safe package entry exports a bounded URL-only request contract; the general public opportunity projection entry does not export it. Unknown fields such as contact details, documents, notes, profile IDs, capabilities or user stages are rejected. HTTPS scheme/host may normalize; path/query/fragment data is never silently stripped into a new accepted link. Credentials, ports/IP hosts, whitespace/control/backslashes, query/fragment, encoded or parser-normalized-away paths and path parameters are rejected.

This conservative initial syntax also rejects some legitimate public links. Rejection is not proof of maliciousness; a later source-specific extension requires reviewed source evidence and tests. Syntactic acceptance establishes neither publicness, source permission, authenticity nor eligibility.

The new backend-only classifier validates the existing bounded Source registry. Structured sources require exact approved URLs. RecentJobs detail URLs reuse the existing worker target policy and require its reviewed index in the source record. Missing/malformed/oversized/duplicate/ambiguous registries fail closed. Invalid, unsupported, paused and unavailable results contain only a safe class; an eligible private result carries the canonical URL and source ID/revision for a later admission/worker recheck.

There is no fetch, queue mutation, capability issuance, endpoint, feature-flag activation or live-source/provider trial. All six categories remain available to configured sources; no trade, student or internship eligibility filter is introduced. Existing guarded retrieval remains mandatory at the future worker boundary; hostname/path classification alone is not SSRF protection.

## Verification and limits

Final contract typecheck/build and **35 contract tests**, **19 affected catalogue policy/fetch tests**, web typecheck/build and **89 web tests** pass, with no skipped tests. Seven new tests cover strict payloads, sensitive/session-shaped input, URL parser normalization, separation from general public projections, exact versus host/prefix matching, existing RecentJobs notice rules, paused sources and corrupt/ambiguous registries. Existing DNS/socket/TLS/redirect/MIME/size and worker-policy regressions are included in the affected suite. Package export resolution is exercised through the actual classifier import.

No web component/route changed, so no new browser interaction or visual qualification is claimed. Web boundary tests retain the disabled account/private surfaces; no suggestion endpoint exists yet. Full catalogue/model/emulator suites and web lint were not repeated for unchanged boundaries. Checked file hashes, bounded logs and the focused packet review stay ignored under .artifacts/sprint-loop/b06-boundary-2026-10-16/.

Next is B06-2 private receipt contracts/crypto/persistence: independently scoped capabilities, hashed storage, response-loss/idempotent replay, expiry/revocation and minimal status projection, tested with synthetic keys/clocks before routes. The plan explicitly separates those proposed controls from actual evidence. Queue/admission, HTTP, review/withdrawal/retention, browser receipt UI and integrated qualification follow in order. Keep intake disabled and source/held-out/seasonal, B05 formal device/user, actual review capacity/retention/operations/deployment/release gates open.
