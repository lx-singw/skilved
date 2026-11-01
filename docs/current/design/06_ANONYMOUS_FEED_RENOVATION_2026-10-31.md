# Anonymous opportunity feed renovation — 31 October 2026

Completed and handed off: 1 November 2026.

The public web experience now opens as an opportunity feed for anonymous visitors. The redesign follows the founder-selected evidence preview's sage background, forest text, white panels and quiet borders. System fonts keep rendering independent of external font services.

## Implemented experience

- Desktop navigation and a discovery rail frame the feed; phones use a single column with persistent Feed, Saved, Suggest and About navigation.
- Six category tabs, a compact search field and expandable geographic, attendance, field and entry-stage filters replace the large opening form. Category tabs preserve other filters and clear the previous cursor. Applied filters appear as removable chips; the full form stays collapsed after searching.
- Opportunity posts show issuer, category, title, summary, location, source-stated deadline and field. Details retain their current query context and stable return anchor.
- Inline save/remove uses the existing local progress store, including its storage availability, conflict and cross-tab handling. Saved references remain accessible when catalogue reads are disabled.
- Opportunity detail, saved progress, suggestions, about, loading, empty and error surfaces use the shared theme. Detail jump links lead to application information, preparation and source evidence.
- Light sage is the default; an explicit saved dark-mode choice is respected. Blocked browser storage does not prevent theme switching or browsing.
- No private ingestion artifact or sample record is included in public source. Publication gates, checked public projections and guarded application handoff remain in place.

## Verification

Passed web type checking, ESLint with zero warnings, production build and the complete 168-test web suite after the final filter-chip changes. Coverage includes disabled publication, loading, category/filter bindings, inline save/remove, storage-unavailable behavior, public/private boundaries, preparation, source evidence and sharing.

Browser verification uses the existing isolated local emulator preview and its clearly labelled fictional listings. Desktop and phone layouts were visually inspected. Saving from a feed card persisted into the saved list; an initially timed-out detail read recovered using the existing refresh action after development compilation completed. Province filtering, category changes retaining the province, and detail-to-feed return context were checked in the browser. No production data or provider calls were required.

## Limits

This is a UI renovation, not a production catalogue launch. Accounts, document uploads and application assistance remain unavailable. Suggestions and exports still obey their existing feature settings. Saves stay in this browser and do not sync across devices. No claim of real published opportunities, eligibility or submitted applications is added.
