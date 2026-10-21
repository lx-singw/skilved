# Sanitized Gemini transport diagnostics and DNS hold

Date: 21 October 2026. Status: Gemini errors, fallback attempts and private worker call receipts now retain allowlisted transport codes. Separate-deadline observations identify intermittent DNS resolution: one provider-host check completes TLS/HTTP, then another fails DNS. The live generation gate stays closed. This change improves diagnostics; it does not repair the resolver or qualify publication.

## Separate-deadline observations

The [previous connectivity sprint](131_CACHED_VALIDATION_READINESS_AND_CONNECTIVITY_GATE_2026-10-21.md), committed as `5981d32`, used a shared twelve-second deadline that slow DNS mostly consumed. This sprint freezes separate limits before observation: fifteen seconds for DNS, twenty seconds for TCP/TLS after resolution, and fifteen seconds for HTTP headers after TLS. At most two unauthenticated provider checks are allowed. Both must pass before fresh robots/ALPLA retrieval or any separately bounded validation-only generation.

The first check resolves sixteen addresses, connects to a public IPv4 address, verifies TLS and receives HTTP 404 in 2,686 milliseconds. It is a HEAD request to the models-list path without an API key, prompt or model request. That status confirms an HTTP response on this connection; it does not establish model access, billing eligibility or generation availability.

After the planned three-second interval, the second check fails DNS with `EAI_AGAIN` after 10,012 milliseconds, before constructing an HTTP request. The first successful connection and second resolution failure demonstrate inconsistent name resolution at these observation times. They do not establish a provider-wide outage or model-quality failure. No resolver, network adapter, execution policy or WSL configuration is changed.

The two-check gate fails. No source refresh, authenticated provider request or live worker invocation follows, and the prospective four-call validation allowance remains unused. Earlier closed trials are not reopened.

## Private transport labels

The Gemini adapter previously replaced low-level fetch failures with `AI_TRANSPORT_FAILED` or `AI_TIMEOUT`, losing the underlying cause. It now retains a nullable `transportCode` drawn from a fixed allowlist of DNS, socket, TLS and HTTP-client timeout codes. Examples include `EAI_AGAIN`, `ENOTFOUND`, `ECONNRESET` and `UND_ERR_CONNECT_TIMEOUT`. A fired per-attempt client timer gets the explicit `CLIENT_DEADLINE` label; the overall fallback-window timeout remains separate from its individual attempt diagnostics.

The helper inspects at most eight nested error objects, including `cause` and `AggregateError.errors`. It handles cycles, limits wide/deep graphs and reads own data properties without invoking accessors. Unknown codes produce null. It copies no messages, stacks, addresses, hostnames, request headers, response bodies or raw cause objects.

Fallback attempt diagnostics retain this safe label for transport/timeouts. The worker sanitizes again when writing private model-call receipts and only populates it for Gemini transport/timeouts. Successes, provider rejections and other errors receive null. Existing receipts are not migrated or reinterpreted. The field is private operational evidence, not public feed content.

Availability classification, model order, retry timing, bounded continuation, source-budget reservations, shared daily/minute accounting, daily-exhaustion rules and publication gates are unchanged. A DNS failure is still spent with unknown usage and does not become an invented daily-exhaustion hold. This sprint does not introduce a provider-wide DNS cooldown or automatic network repair.

## Verification and preserved evidence

The contracts build, twenty direct unit checks, 115 focused emulator checks and the full 728-test serial catalogue suite pass. Unit coverage checks fixed-code redaction, nested and aggregate causes, unknown values, cycles, traversal bounds, accessors/proxies, fallback diagnostics and client-deadline labeling. Emulator cases exercise actual Gemini normalization with authored transport failures, persisted receipts, restart after stored cooldowns, unchanged failed receipts, exact spent-call/unknown-usage accounting and private drafting without publication. Additional injected-field cases verify the receipt boundary does not retain arbitrary labels or misclassify provider rejections.

Initial failures remain private: one unit assertion incorrectly treated the overall fallback timeout as an individual client deadline; the focused launcher initially lacked the login-shell Firebase path; and an authored worker test resumed just before its stored model cooldowns. The tests/launcher are corrected without changing worker timing or acceptance policy. Final passing runs are retained alongside those failures.

All 604 historical artifact hashes match. Twenty-eight current code/test files are hashed for the final checks; twenty-two prior baseline files remain unchanged, four are deliberately updated, and two are new. The saved ALPLA raw answer still decodes unchanged, passes its frozen four-condition checklist and canonical material/issuer checks, and retains the original employer-named ATS route. Its extraction-cache identity at source revision fourteen and validation payload are unchanged. These are offline saved-source checks, not fresh notice or employer verification.

Shared quota bytes remain identical: 95 cumulative observed generation attempts, 315,549 known tokens and 39 unknown-usage calls. Source day 21 October still records eight spent calls against the unchanged seventeen-call cap; provider day is also 21 October without erasing earlier rows. No new real job, receipt, draft or public record is created. Synthetic emulator checks are separate from the real private evaluation history and shared ledger. All earlier answers, failures, budgets, caches, snapshots, drafts and the closed pilot exception remain preserved.

Next stabilize or independently isolate the intermittent resolver path, then apply fresh connectivity/source checks and a new fixed validation-only bound using the accepted extraction. Do not spend model calls to diagnose unauthenticated DNS failure. Employer crawling remains optional/off; production scheduling and publication remain disabled.
