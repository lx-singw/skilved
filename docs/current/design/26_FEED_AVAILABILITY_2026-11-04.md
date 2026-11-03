# Feed availability and recovery

Implemented: 4 November 2026.

The home feed previously described disabled catalogue reads as an empty catalogue, including the unsupported claim that no listings had been published. It also displayed recently-updated wording before current results were available. Availability now has its own notice file with a short explanation, a reading ledger, a deliberate next action and a route to the browser-local Saved workspace.

## Behaviour

- Disabled public reads explain that access is unavailable in this workspace and offer the field guide. They do not infer published inventory.
- A failed read explains that current results could not be checked. A native anchor reloads the same canonical query, making a full request even when the route has not changed.
- Changed and invalid continuation links restart the first page with valid search choices retained and the cursor removed.
- Unreadable or unsupported filters take precedence over disabled access and clear to the home feed. Invalid values are not reflected into the recovery action.
- Successful empty results retain the existing scoped count and filter-widening tools. They remain distinct from unavailable results.
- Unloaded results say “Current results not loaded”; loading copy makes no inventory claim.

The file follows the sage and forest notice system, with a compact index, left-aligned heading, two reading rows, accessible actions and a browser-storage footnote. Narrow layouts stack the rows and expand the primary action. No background retry, persistence mutation or new production endpoint was added.

## Integrated local review

The existing isolated preview at `http://localhost:3000/` now has six explicitly fictional public projections, one per opportunity category. Titles, banner and counts identify them as UI examples. All application states are unavailable, with no application destination or redirect. These examples are private ignored artifacts; they are not production fixtures or published catalogue data.

The private adapter uses the existing query parser, matching rules, cursor codec and public schemas. It supports filtered lists, continuation and detail reads without a database or provider connection. Public-read feature flags remain disabled; no emulator reseed, application submission, external source visit or Saved-record write was performed. Existing browser records were retained. Fictional revision changes still require the existing explicit user acknowledgement.

A private feed-state gallery forces the recovery cases for review and labels them as UI examples rather than service-health observations. Browser checks confirmed six cards at home, a single graduate-programme result, the detail reading sections, no application action, and the exact category/card return route. Changed-results recovery retained bursary, Gauteng and page size while removing the old cursor and reaching the expected fictional result. Disabled access and failed loading displayed distinct explanations and routes.

## Verification and limits

- `pnpm web:lint`, `pnpm web:typecheck`, `pnpm web:build` and `pnpm web:test` passed; 310 tests passed. Four new availability tests cover state distinctions, native same-query retry, continuation recovery, invalid-filter precedence and public exits without background activity. The production HTTP boundary now checks truthful disabled-access copy.
- A separate private HTTP check passed all six categories, national-province matching, entry stage, empty search, unique continuation pages, stale/invalid cursors and public detail schemas. GET checks for all six application routes returned 409 without a redirect. No writes were requested.
- A temporary 300px viewport request produced a measured 389px browser viewport and 370px document client width. Document scroll width equalled client width. Recovery actions measured approximately 44px high. The viewport override was reset.
- Both supported screenshot methods failed to capture this sprint. DOM, accessibility and geometry checks passed, but screenshot-based visual approval is outstanding.
- Live catalogue data, deployed behaviour and external application destinations were not verified. The local examples establish UI integration only.
