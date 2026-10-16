# Suggestion runtime, routes and emulator HTTP integration

16 October 2026. B06-4b2 connects the [HTTP/configuration foundation](93_SUGGESTION_HTTP_TRANSPORT_CORE_2026-10-16.md) to the real app and existing private service. Create/status transport integration is locally evidenced. Routes default disabled; only temporary synthetic child environments were enabled, and no persistent runtime/deployment configuration was written. B06-5 withdrawal/lifecycle and later UI/integrated/formal acceptance remain open.

## Runtime and reviewed routes

The server-only suggestions package entry point parses trusted configuration on every request before a runtime provider can run. Missing/disabled/malformed settings produce private unavailable responses without initializing an app. Validated transport then lazily imports the existing runtime; its cached database mode/project must match the validated binding. A mismatch fails closed before touching the database. Receipt/keyring and admission-policy objects are fresh per dispatched request, rather than retaining an old secret manifest in another global runtime cache. No operator initialization, source fetch, worker or provider/model call is performed by the route adapter.

Three Node, force-dynamic routes are explicitly included in the [reviewed route inventory](../engineering/10_PUBLIC_WEB_STABILISATION_2026-09-24.md) and production boundary test:

| Path | Intended method and behavior |
|---|---|
| /api/v1/opportunity-suggestions | POST uses complete create orchestration, with header-only replay key; default 503. |
| /api/v1/opportunity-suggestions/{id}/status | GET uses header-only capability; default 503. |
| /api/v1/opportunity-suggestions/{id} | Future DELETE withdrawal; currently always 503 before runtime, with no acknowledgement/mutation. |

Explicit wrappers send unsupported methods, including HEAD and OPTIONS, through the same adapter. This prevents automatic framework method handling from bypassing the reviewed boundary; enabled unsupported methods return 404 without CORS grants, and disabled routes return private 503. Wrappers pass only Request, so Next's route context cannot become runtime/configuration options. No operator or worker route was added.

## Actual local integration and correction

The initial real Next request returned 403 before service dispatch. Inspection of the installed NextRequest/NextURL source showed loopback URL normalization from 127.0.0.1 to localhost. One targeted correction permits equivalent HTTP loopback request URLs only with explicit validated emulator mode and the same port. Browser Origin headers still require an exact configured match. Remote origins, different ports and non-emulator HTTP remain rejected; the added regression preserves those assertions. No production origin guard was relaxed.

The final test starts actual local Firestore/Auth emulators and Next development servers using an isolated demo project, synthetic source permission/notice records and synthetic keys. It verifies real HTTP create→receipt→same-key retry, distinct submitters with one shared review-only work item, authorized minimal status, wrong ID/token 404, new-request source pause versus existing access recovery, current multiple approved results and honest removal outcome, private headers, body/cookie/origin rejection and unavailable withdrawal without revocation. It checks that persisted receipts contain no raw submitted URL, plaintext replay key or capability.

The test then stops the Next process and starts a new one with intake disabled: create becomes unavailable while the original capability still reads the same persisted receipt/status. This is a server-process restart, not a browser/device persistence observation. The fixture's capacity state is seeded directly in its guarded demo project; no new live operator/Auth authorization observation is claimed. The separate existing emulator tests cover initializer role/audit and expiry/revocation/replay predicates. No real source website, external application destination or model provider is called.

## Observed verification and held gates

- All 37 shared contract tests/build pass.
- All 24 focused runtime/config/transport/crypto/policy tests pass, including zero-provider/app-init guards, wrong runtime binding and the emulator-only normalization regression.
- All 36 combined emulator tests pass: 35 existing receipt/admission/create cases plus the actual Next HTTP journey and restart. Owned Next and emulator processes shut down successfully.
- Web lint, typecheck and fresh production build pass; all 90 web tests pass with no skips. Tests deliberately enumerate the three routes, exercise their disabled production behavior and inspect client scripts for suggestion secret/configuration/storage code as well as existing private sentinels.

The initial failing emulator log is retained alongside the final successful run. Ten final source/test/package hashes and private task/check/review data remain under ignored .artifacts/sprint-loop/b06-http-runtime-2026-10-16/. Next integration ran before the production build/web suite to avoid competing .next writers. No full catalogue/provider suite, browser/UI, accessibility, participant/device or production traffic/load measurement is claimed.

This closes local B06-4 transport/runtime integration with DELETE explicitly held. It does not complete withdrawal acceptance or permit intake activation. Next B06-5 must implement authenticated reviewer transitions, current-public receipt resolution, withdrawal/reference/lease races, expiry/retention and both replay collections' deletion/backup/revival behavior. Actual edge-wide abuse controls remain required because transport rejects do not enter database counters. Backend response timeout still does not prove cancellation. Actual source permission, review capacity, retention notice, secrets/operations funding, inventory, provider/user/device qualification and deployment/release decisions remain open, together with B05 formal checks. No paid resources, outreach, production collection, deployment or publication was activated.
