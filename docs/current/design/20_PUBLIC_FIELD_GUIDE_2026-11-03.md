# Public field guide and About page

Implemented: 3 November 2026.

The About page now acts as a public field guide instead of a four-card introduction. A two-part opening pairs the brand message with an illustrated notice: original wording, connected requirements and scoped sources/checks. The diagram describes reading layers and is labelled as an illustration; it is not a sample opportunity, verification badge or inventory count. The existing sage/forest theme, category glyphs and public navigation are reused.

A numbered journey connects browsing, reading conditions, browser-local Saved progress and the notice's application method. Same-page shortcuts lead to visible question summaries. A category index uses the six supported category values and their existing labels, identity colours and filter routes. No demo IDs, archived account/profile routes, new API or published-data dependency is introduced.

Four native disclosures explain what Saved retains, how to read evidence checks, how to apply, and how to suggest a notice or report a concern when those controls are available. The copy retains browser-only storage and loss limits, the temporary nature of requirement ticks, scoped checks rather than eligibility or an overall verdict, and manual application submission. Website/email handoff is described as a current-listing check, not a new destination-reachability check. Postal and in-person guidance is qualified by the instructions actually available in the notice.

Public catalogue availability follows the existing reads flag. The disabled state says browsing is unavailable here without claiming that no published records exist. The enabled state refers to published notices when available without presenting a live-health result or invented counts. Suggestion intake and issue-report availability remain conditional on their own pages and controls. Account, upload and application-assistance limits are explicit.

Verification passed against a fresh production build: typecheck, lint, production build and all 281 web tests. Three new tests cover readiness without catalogue/private-access fetches in page rendering, all six supported category routes and valid native fragment targets, absence of forms and unavailable-route links, and storage/review/application boundaries. The production public-boundary test now checks actual unavailable capabilities and disabled catalogue access rather than the former About wording. Tests that start the production server ran after the final build.

Browser checks confirmed the enabled page, its six category shortcuts and four disclosures. The evidence shortcut reached its visible question, which opened from the keyboard. The graduate-programme shortcut reached the correctly filtered feed, and the About navigation returned to the guide. No private list or application action was performed.

At a measured 389 CSS-pixel viewport, the page and all four expanded answers had document scroll width equal to the 370-pixel client width, with no horizontal content overflow. Question summaries measured 64 pixels high and category links 96 pixels high. The temporary viewport override was reset. Desktop rendered geometry also had no horizontal document overflow.

Screenshot capture failed through full-page captures and the alternate combined browser observation API. No screenshot was produced, so visual screenshot review remains incomplete; the live page is the review surface. The disabled availability branch was checked in rendered tests and the fresh production HTTP boundary, rather than by changing preview service settings.

The ignored preview received only the updated About source and shared CSS. Existing fictional catalogue records and service configuration were not modified. Browser review performed no save/stage mutation, report, suggestion, upload, application or outbound source visit. Unrelated catalogue/controller/deployment work in the shared checkout is outside this sprint. Production deployment and broader user research were not verified.
