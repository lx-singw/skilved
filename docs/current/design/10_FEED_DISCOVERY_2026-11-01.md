# Feed discovery and search recovery

Implemented: 1 November 2026.

The feed now gives a page-scoped published-notice count, a contextual category/search heading, and an explicit continuation label. Counts describe the returned page, never a catalogue-wide total. The unfiltered mobile header is compact so the first notice remains close to the search controls.

Active choices include the category and use readable labels for coverage, location, attendance, field and source-stated entry stage. Each removal keeps the remaining public selections and page size, and drops the old cursor. Search, filtering, category links and pagination remain ordinary local links and GET forms.

Advanced filters are grouped into location and direction, with existing explanations of residence, unknown fields/stages and experience retained. A native disclosure explains the existing case-insensitive phrase search across titles, issuers and summaries. Search behaviour and public query contracts have not changed.

Empty searches offer up to three specific ways to widen the query: remove its phrase, field or entry stage, widen geography/attendance, or cross categories. Each option states what it changes and retains the other selections. Invalid queries, stale cursors, disabled publication and service outages retain their distinct recovery paths. Unavailable reads do not display zero-result counts or suggest that a broader search fixes the outage.

Pagination identifies continuation, offers a first-page return and preserves the full public filter binding. Loading uses static card-shaped placeholders, with no invented facts or counts.

Verification passed: type checking, lint, a production build and all 196 web tests. Eight new tests cover individual selection removal, bounded recovery choices, grouped location widening, unsafe/duplicate query rejection, Unicode and cursor rebinding, page-only counts, escaped text/form retention and outage presentation. Existing feed, query and loading assertions are preserved.

Browser interaction checks covered a phrase search with bursary, Western Cape and Student selected; a no-match result; phrase-only recovery to the demo bursary; detail opening and return to the same filtered card; individual stage removal; two-record pagination and first-page return. A mobile viewport with long unbroken search text had no document-wide horizontal overflow. Removing a redundant starting-point row brought the first card from approximately 736px to 558px from the top in the tested viewport.

Screenshot capture was unavailable through both supported browser capture methods in this session, so visual screenshot review could not be completed. The live local preview remains available for review. Data remained fictional; no production deployment, personal search persistence, fuzzy search or additional sorting mode was added.
