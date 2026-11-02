# Inline opportunity briefs

Implemented: 2 November 2026.

Each feed card now opens a category-specific brief: study, learning, trade, placement, programme or role. The source summary has its own introduction, followed by a neutral inventory of recorded instructions, document entries and source references. These are record counts; alternatives and conditional routes still determine how the instructions connect.

Connected requirement wording remains complete in a native disclosure. Document entries receive their own numbered reading list with the notice's required, preferred or unclear strength. Their original wording is preserved and escaped. A nearby explanation warns that document entries can belong to alternative or conditional routes. Zero document entries does not claim that no documents are required; the view points back to the complete connected wording.

Support wording has a separate disclosure. Missing, ambiguous and conflicting source facts retain different meanings, including disagreement rather than a generic clarification message. Empty support or summary fields have explicit reading guidance. Long and multiline source text remains complete. The brief does not introduce review ticks, an eligibility verdict or an application action.

Preparation and support links open the relevant sections of the detail workspace. The source-reference row now has a direct evidence link and a document icon in place of decorative dots. All destinations retain the validated public feed context, including filters and cursor, through the existing URL helper. The brief's navigation label includes the public title so repeated cards have distinct accessible context.

The implementation uses server-rendered HTML and native disclosures. All three disclosures start closed; no additional client state, persistence, public-data fields or dependencies were introduced. Existing save behaviour, publication controls and application handoff protections remain in place.

Verification passed: typecheck, lint, production build and all 237 web tests. Eight new tests cover the six category identities, disclosure defaults, conditional documents and strength, repeated expression references without inflated document counts, empty inventories, three uncertainty states, complete escaped long wording, contextual section links and closed-intake inspection. Existing presentation assertions now check the two main destinations plus the three precise section links.

Browser review used the unchanged fictional local emulator. The study brief displayed two recorded instructions, one document entry and one source reference. Keyboard Enter opened the brief, connected wording and support disclosure. Both preparation and evidence links landed visibly at their intended sections, with their target tops about 204 CSS pixels from the viewport top; returning retained the Bursaries filter and the original card anchor. Cursor preservation was covered by rendered-link tests.

At a measured 389 CSS-pixel viewport, document scroll width equalled its 370-pixel client width, all three inventory count baselines aligned, and no visible brief element overflowed horizontally. Desktop full-page rendering was reviewed and saved outside the repository. Temporary viewport sizing was reset, and the expanded study brief was left available for review. No application route, saved stage or demo data was changed.

The review remains fictional local content. Production deployment, real-content editorial review and broader user research remain separate.
