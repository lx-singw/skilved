# Personal stages and separate route actions

16 October 2026. B05-3 against the [local continuity plan](../planning/12_B05_LOCAL_CONTINUITY_IMPLEMENTATION_PLAN.md), extending the [explicit save/resume UI](83_LOCAL_SAVE_AND_RESUME_UI_2026-10-16.md). Detailed current-fact/identity recovery and remaining loss/device/user qualification stay open.

## Implemented result

Saved public detail and saved-list entries offer accessible, reversible Interested, Preparing, Applied—marked by you and No longer pursuing choices. Changes use the existing transactional session and committed-result feedback. The first save time is preserved. Applied displays the person's report time and explicitly says Skilved has not confirmed submission. Personal annotations remain distinct from issuer facts, including when the saved public summary is unavailable.

The portal/email application action remains a native link through the existing current-revision server guard. It opens separately with noopener/noreferrer. Selecting it triggers a fresh local read and a best-effort route-action mutation without preventing or awaiting native navigation. The mutation records only an already-saved entry; selecting an unsaved route never saves it. Storage failures leave the guarded link usable and explain that a local record could not be confirmed. The guard, rather than saved data, decides whether an outbound handoff is currently safe.

Route history has its own time and never changes the personal stage, first-save time or existing Applied-report time. The copy describes an action, not proof that an issuer page loaded or accepted an application. This is not a complete navigation audit: a context-menu action, disabled JavaScript, browser termination or unavailable storage may leave no record. Native rendering retains the guarded link without JavaScript. No personal stage, time or local write token enters the href, server request, report or copied public link. No source destination is cached locally.

## Actual verification

- Final web lint, typecheck and production build pass. All **77 web tests pass**, with no skipped tests. Three new tests exercise the exported native event handler with the real local adapter and test IndexedDB, unsaved/failure behavior, reversible stage rendering and independent Applied/route times. The existing canonical page render test is updated for the client link island. No contract, storage-core, worker or server guard logic changed, so their full suites were not repeated.
- One initial test failure came from a mocked hook snapshot that stayed frozen before an awaited failed-storage handler. Refreshing that mock after the handler models the subscription rerender while retaining the exact failure-copy and native-link assertions. The final lint and all web tests pass after that test-only correction; application inputs remained unchanged. No acceptance criterion was weakened.
- Fifteen actual synthetic browser checkpoints cover an initially empty origin, explicit save, Preparing, Applied, reload and a second tab; route action while preserving Applied and its exact report time; reloaded detail and saved-list history; reversal to No longer pursuing and Interested across tabs; explicit removal; and an unsaved route selection leaving the list empty. A synthetic revision change makes each clicked native route stale, so both actual route tabs display the local 409 fresh-check response without visiting an issuer.
- A separate local HTTP check observes the unchanged fresh guard returning 303, a synthetic destination and no-referrer with redirects deliberately not followed. Stale revisions return 409 with no Location. These observations do not demonstrate external site loading, email-app behavior or submission.
- Actual 375 × 812 detail and 1280 × 900 saved-list views show the stage/report/history distinction. Measured document widths of 360 and 1265 fit their respective viewports. Screenshots and DOM observations are private evidence, not physical-device or participant qualification.

Private logs, exact input hashes, test correction, guard responses, browser results/DOM and screenshots remain ignored under `.artifacts/sprint-loop/b05-stages-2026-10-16/`. All test saves were removed, owned tabs closed, viewport restored and local server/emulators stopped. No provider call, real source permission, deployment, browser-process restart, OS storage eviction, physical-device or participant result is claimed.

## Next work and acceptance limits

B05-4 must compare the saved last-viewed revision with current public facts, explain changes before acknowledgement and retain annotations through closure, restriction, missing records, confirmed merges and merge reversals. When both identities have annotations, require explicit reconciliation rather than silently selecting or overwriting one. Keep current server handoff/revision and no cached application destination. Then B05-5 completes remaining loss/failure/concurrency engineering and records the separate device/user qualification requirements.

Full B05 and formal G2 remain open. Real six-category inventory, both internship routes, broad jobs, source/held-out/seasonal qualification, actual users/devices, funded operations and release authority retain their existing gates. This packet changes no provider-call budget or publication authority.
