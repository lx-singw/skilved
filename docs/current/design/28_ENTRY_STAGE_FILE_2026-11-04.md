# Entry-stage file and feed context

Implemented: 4 November 2026.

The entry-stage section now follows the notice's visual language, with a category accent, compass mark, explicit fact state and separate source-stated label tiles. All five supported discovery labels have their own icon. Multiple labels retain their recorded order; the display introduces no ranking, selection, eligibility result or inferred experience requirement. It explains that multiple labels do not establish separate application routes.

The section keeps its visible `entry-stage-heading` and now makes it a keyboard focus target. Connected requirements and experience wording have separate native links. The discovery/eligibility distinction and the warning that entry level does not mean no experience remain visible outside the source drawer.

The source drawer keeps complete multiline wording and resolves only the entry fact's unique available public references. References show hostnames and open separately; missing wording and missing references each have explicit copy. The separate evidence-check link remains available. Ambiguous, conflicting and missing facts do not display residual stage labels or infer a stage from the title, opportunity category or experience wording. Legacy missing-stage input retains a defensive empty state; the publication contract is unchanged.

Every feed brief now includes the reviewed stage context and a direct link to `entry-stage-heading`, retaining its complete results route. This sits inside the existing brief disclosure. The change adds no background request, storage write, account step or automatic drawer opening.

## Verification

`pnpm web:lint`, `pnpm web:typecheck`, `pnpm web:build` and `pnpm web:test` passed. All 319 web tests passed against the fresh production build. Four new tests cover recorded order without ranking or experience inference, uncertainty and defensive residual-value handling, scoped complete source wording and visible keyboard targets, and contextual feed navigation. Existing tests continue to cover all six opportunity categories, unreviewed-stage suppression and markup escaping. Feed destination counts and canonical detail assertions now include the new stage destination and label layout.

In the integrated local job example, opening the role brief displayed Experienced from its recorded stage fact. Keyboard activation of the stage link opened the detail with the job-filter return route and focused `entry-stage-heading`. The source drawer stayed closed and preparation ticks stayed at zero. Opening the drawer showed only its own notice reference, with a separate-tab target. The experience link focused `experience-heading` without changing preparation or Saved progress.

A private ignored workshop exercised all five labels in recorded order, long multiline source wording, conflicting labels and missing labels. The complete wording retained its final sentence and the drawer linked only its own fictional addendum. Conflicting and missing examples displayed zero label tiles and kept their separate explanations. Missing wording and references were both explicit.

A temporary 320px viewport request produced a measured 415px browser viewport and 396px document client width. Scroll width equalled client width; no entry-file descendant overflowed. Reading links measured approximately 44px high and the source disclosure approximately 68px. The viewport override was reset.

Browser screenshot APIs returned partial views that omitted or clipped the new section; these captures do not establish visual approval. DOM, accessibility and geometry checks passed. Screenshot-based visual review, dark-mode appearance, assistive-technology research, live catalogue data and deployed behaviour remain unverified.

Preview changes were limited to the affected components, CSS and an explicitly fictional workshop. The read-only fictional catalogue, service flags and existing browser records were retained. No source destination, application, report, suggestion or personal-progress mutation was performed.
