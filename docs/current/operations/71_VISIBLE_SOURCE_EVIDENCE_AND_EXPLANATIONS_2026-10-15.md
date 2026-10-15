# Visible source evidence and reviewed explanations

Date: 15 October 2026. Base: `64dd864`. Completed local B04b packet; full B04/G2 remains open.

Canonical opportunity detail now renders the approved requirement explanation alongside the original preparation instructions. It identifies the requirement version and supporting public citations. Missing explanations offer a truthful source/issuer next action; a defensive revision check prevents stale explanation text from displaying even if a caller bypasses the existing public schema validation. The explanation does not decide eligibility or imply submission.

The source panel exposes all six existing check scopes independently: issuer attribution, announcement, application relationship, destination reachability, availability and requirements. Each actual record retains its outcome, recorded method or unknown method, exact timestamp and cited evidence. Supported, unresolved, failed, contradicted and absent checks remain distinct. Next-check times are labelled as recorded times, never evidence of completed rechecks. Listing update time remains separate. The generic sentence claiming an automatic source/content pass has been removed.

## Verification

- Five new React-render/integration tests cover all six categories and both internship subtypes; all check outcomes and scopes; missing checks/method; exact machine-readable timestamps and SAST display; check-specific citations and escaped source text; current/missing/stale explanation behavior; unknown deadline; and the withheld landing page's exclusion of explanations and application links.
- Web lint, typecheck and production build exit 0. All 41 web tests pass, including production asset/private-route boundaries. One test assertion initially assumed lowercase serialization of the HTML datetime attribute; accepting case-insensitive HTML attribute spelling preserves its exact timestamp requirement.
- A private synthetic fixture runs through the existing Next detail and isolated Firestore/Auth emulators. Browser inspection confirms the original OR requirement, current explanation, all four outcomes, absent scope, method and citation labels. At 375 × 812 and 1280 × 800, document widths are 360 and 1265 px respectively, with no horizontal overflow. Screenshots remain private.
- The initial synthetic fixture contained an automatic check without a next-check time. The unchanged read-time freshness guard returned the neutral under-review page and omitted the application route. Giving that synthetic check a future next-check time allowed display verification. No production freshness rule was changed.
- The successful test tab and viewport override were cleaned up; dev server and emulators stopped and ports 39203/18081/19098 were confirmed closed. A separate initial connection-error tab could not be controlled because the browser rejected its generated data URL; no user tab was modified.

Evidence and fixture harnesses are ignored under `.artifacts/sprint-loop/b04-evidence-2026-10-15/`. Production checks ran in the working checkout. Browser verification used the previous clean-installed temporary candidate with the two changed production files copied. That temporary checkout disappeared during an interrupted host session before the final byte comparison, so no later comparison or new clean-install claim is made. Current lint/typecheck/build/web tests were repeated on resumption. Backend source/worker contracts were unchanged and their full suite was not rerun. No live source/provider calls, deployment or real-user observation occurred.

## Remaining B04 work and next action

The review found actual engineering gaps, so advancing directly to B05 would be premature. Next implement and verify feed-to-detail/back-navigation recovery using current query/cursor semantics, with honest recovery after catalogue changes. Then scope source-backed field and stated entry-stage filtering against the canonical contract: it currently supports geography/category/text, exposes `fields`, and has no explicit normalized entry-stage fact. Do not infer stage from a category, title or missing experience condition. Detail subtype/practical-condition clarity and operator-to-public report correction also require reconciliation with existing evidence.

Real permitted inventory across six categories, held-out extraction qualification, participant/device observation, source/provider authority and deployment acceptance remain open. Retain G2 and subsequent release gates until their actual evidence exists; these UI checks do not close them.
