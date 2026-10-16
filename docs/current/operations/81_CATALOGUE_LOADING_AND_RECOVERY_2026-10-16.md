# Catalogue loading and recovery

16 October 2026. B04a/b recovery against the chronological runbook. This packet follows the [report-correction reconciliation](80_PUBLIC_REPORT_TO_CORRECTED_DETAIL_2026-10-15.md) and credits the prior filter, navigation, requirements, source, practical-detail and report work.

## Implemented behavior

The enabled feed has a Suspense boundary before query/data resolution, with a labelled live loading status and busy state. It shows no invented cards, counts or application action. The boundary applies only to the feed; the default-disabled preparation page and genuine missing-route behavior remain unchanged.

Successful catalogue reads explain that Skilved's published notices are a limited catalogue, not a complete picture of available opportunities. Category gaps do not establish closure or predict a future intake. Filtered empty results offer widening and clearing, including how unknown field/stage values affect discovery. Unfiltered empty results distinguish an empty catalogue from absence of opportunities elsewhere. No seasonal date, issuer schedule, notification promise or synthetic filler is invented. Actual seasonal/source coverage remains unqualified.

Canonical detail now distinguishes infrastructure/invalid-output failures from a genuine NOT_FOUND or invalid ID. An unavailable detail shows a neutral explanation and a full-page retry retaining validated search context; it exposes neither old facts nor an application action. A valid missing listing still uses the 404 page. This does not change the versioned HTTP API or the fresh application-handoff guard.

## Actual verification

- All **60 web tests** pass, with no skipped tests, together with web lint/typecheck/production build. Three new tests plus extended canonical-page assertions cover pending query/data loading, unchanged disabled mode, limited/nonempty/filtered-empty coverage, genuine missing IDs, safe unknown backend errors, disabled runtime and malformed public output. Retry/back links retain canonical public context and omit facts/actions/private errors.
- A synthetic Firestore/Auth browser fixture observed the loading status at 375 × 812, followed by actual results. A separate real local response stream put the fallback in chunk 0 and completed synthetic results in chunk 41. No application delay or testing hook was added to production code.
- Actual browser actions select an empty internship category, read the coverage/widening explanation, clear filters and recover the synthetic bursary. Removing the only synthetic projection verifies an unfiltered empty catalogue at 375 × 812 and 1280 × 900.
- Invalid synthetic backend output produces the unavailable-detail screen, with no private sentinel or application action. After restoring the projection, the visible retry link reloads current detail while retaining category/field return context. The genuinely missing record displays the existing Page not found/404 presentation; the local server also logged HTTP 404.
- Measured document width does not exceed viewport width: feed 360/375 and 1265/1280; unavailable detail 375/375 and 1280/1280. Temporary tab/viewport and emulator/server processes were cleaned up.

Private logs, input hashes, response chunks, browser DOM/results and screenshots stay ignored under `.artifacts/sprint-loop/b04-recovery-2026-10-16/`. The existing checkout and its ignored local environment were used with catalogue reads explicitly routed to the demo emulator. No clean install, provider trial, real vacancy/source/seasonal coverage, participant, physical-device, assistive-technology or deployed observation is claimed. Store/worker logic did not change; their full suites were not repeated.

## Handoff and open gates

The locally implemented B04 feed/detail/report/runtime packets now have scoped evidence, including the seven synthetic correction journeys in operations 80. This does not close G2: the real source acquisition/qualification holds, six-category inventory and held-out cases, actual user comprehension, device/network/cost evidence and deployment/release authority remain open. No source or provider budget is expanded.

Next independent authorized engineering is B05: inspect the existing local-state code and write a bounded plan for browser-local save/remove/clear, versioned progress and current-record recovery. Preserve missing/closed/restricted/merged handling and shared-device/data-loss warnings; never count opening the issuer route as submission. Formal gates stay open while independent local engineering proceeds under the founder's sprint-loop authorization.
