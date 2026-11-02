# Application handoff and recovery

Implemented: 2 November 2026.

The application rail now presents the method and destination before the action. Portal notices show the hostname and an expandable full address, while email, postal and in-person notices show the complete source-stated destination. Email and portal opening still use the existing server recheck. Postal and in-person routes offer address copying and instructions, without an online Apply action.

An expandable document section preserves source wording, required/preferred/unclear strength and uncertainty. Each item links to its instruction in the connected requirement route. The section explicitly retains route and stage conditions rather than treating every mentioned document as universally required. Missing document instructions point back to the original notice.

Optional next-step guidance is tailored to the application method and distinguishes opening a route, completing an application and personally recording a stage. Existing native route history remains best-effort and never marks Applied automatically.

Public-address copying reports success or a manual selection fallback. A three-second bound handles clipboard APIs that remain pending; it does not report an unconfirmed copy as successful. Copying does not change personal progress.

Failed application checks now return a branded, responsive HTML recovery view with links to current details, the feed and Saved. The response remains 409 and no-store, with no external destination. Closed, changed, moved, unavailable, review-needed and malformed links receive appropriate wording. Unknown reads do not claim closure or removal. Duplicate or extra parameters and reference-identity changes require a fresh review. Successful portal/email requests retain their native 303 redirect and no-referrer behaviour.

Verification passed: typecheck, lint, production build and all 205 web tests. Nine added tests cover the four methods, closed/unavailable views, conditional documents, guarded redirects, recovery cases, malformed links, revision changes, copying and a stalled clipboard API. Existing local-progress and source-evidence assertions are preserved.

Browser checks used fictional local records: portal destination display, document expansion and instruction navigation, email presentation, mobile postal/in-person address wrapping and absent online actions, keyboard clipboard success, stale-link recovery and return to the current notice. Mobile method and recovery views had no document-wide horizontal overflow. Screenshots were captured for visual review. Temporary application methods were restored after checking.

No external application was opened or submitted. The preview remains fictional, and production deployment is separate.
