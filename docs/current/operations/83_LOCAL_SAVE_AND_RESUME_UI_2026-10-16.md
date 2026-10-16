# Local save and resume UI

16 October 2026. B05-2 against the [local continuity plan](../planning/12_B05_LOCAL_CONTINUITY_IMPLEMENTATION_PLAN.md), using the existing transactional foundation. Stage/route-event UI, detailed change/merge reconciliation and full loss/device/user qualification remain pending.

## Implemented result

Canonical public detail offers explicit Save in this browser, remove, saved-list navigation and copy-public-link fallback. The enabled feed links to `/saved`. That page is still 404 when catalogue reads are disabled; existing account/private endpoints remain disabled. Server rendering starts with a loading state, never a fabricated saved/empty result or a browser's saved IDs.

The saved page reads minimal local references, then loads validated current public summaries for the first 20 entries, expanding by 20 on request up to the 100-entry storage limit. It offers current-detail links and individual remove; it never stores or renders a cached application destination. Missing, restricted and unavailable summaries have neutral copy and retain the reference until the person removes it. Detailed revision/alias conflict explanation remains B05-4. Local save time identifies an entry; the internal record ID is not presented as an issuer reference.

The session controller confirms mutations only after the adapter returns a committed result, guards overlapping clicks and prevents an older read from overwriting a newer action. Conflicts require explicit reload and a new action. Hydration, focus, pageshow, visibility and same-browser notifications only read; they do not replay writes. Broadcast messages carry only a change signal. Read/mutation exceptions remain safe failures without private exception text.

First-save/shared-browser/loss/no-backup notices are visible before saving and beside committed feedback. Clear requires an explicit scoped confirmation with cancel, explains irreversible loss of local progress, and leaves other site data/separate receipt access alone. The UI does not call an opening or a save an application submission; checklist ticks remain transient.

## Actual verification

- Initial web lint/typecheck/build and all 74 tests passed. Focused review then replaced the internal-ID reference line with local save time. The new exact timestamp assertion initially failed because React's static markup uses `dateTime`; the assertion now matches HTML attribute case insensitively while retaining the exact timestamp. No acceptance criterion changed. The final application build/typecheck, final lint and **all 74 web tests** pass, with no skipped tests.
- Five new controller/read/render tests cover deferred confirmation, double actions, read-only invalidations, conflict reload/new action using the real adapter with the test IndexedDB implementation, old-read suppression, safe exceptions, bounded current-summary responses and honest SSR. The route inventory explicitly includes the guarded saved page; its disabled 404 remains tested. No contract/store/worker logic changed, so their full suites were not repeated.
- Actual native browser IndexedDB checks start from an observed empty test origin, save a synthetic apprenticeship, reload it and resolve its current title. A second tab observes the same save. Remove/resave and a second synthetic internship update the first tab without a page reload.
- The browser cancels clear and retains both entries, then confirms clear and observes both tabs empty/unsaved. Reload and a new tab do not restore cleared work. A new explicit save is allowed, and individual remove cleans up the test entries. These are actual tab/reload observations, not a complete browser-process restart or OS site-data eviction.
- The interaction journey predates the save-time presentation correction. The corrected saved list was then reverified in the browser at 375 × 812 and 1280 × 900: current title, local time, no visible opaque ID, save/remove and final cleanup. Document widths fit each viewport. An initial multi-tab viewport request affected another tab; the wide result was positively rechecked at actual width 1280, rather than inferred from the requested size.

Private checks, input hashes, initial/diagnostic/final logs, browser DOM/results and screenshots stay ignored under `.artifacts/sprint-loop/b05-save-ui-2026-10-16/`. All synthetic saves were removed, temporary tabs closed, viewport restored and emulator/server processes stopped. Existing ignored local environment was loaded with reads explicitly routed to the demo emulator. No real opportunity, provider call, source permission, deployment, physical-device, participant, real quota-blocking, clipboard success or browser-process restart result is claimed.

## Next work

B05-3: reversible personal stages and independent route-opening-action history for saved entries. An issuer route being selected/opened is not proof that its site loaded or accepted a submission. Preserve Applied—marked by you on reopen and never silently save an unsaved opportunity merely because its route was selected. Then complete B05-4 current revision/closed/restricted/missing/confirmed-merge/reversal and conflicting-annotation recovery, followed by B05-5 remaining loss/failure/device/user qualification. Formal G2/source/held-out/seasonal/release gates remain open.
