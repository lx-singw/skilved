# Source-stated entry-stage contract — 15 October 2026

This B04 prerequisite stores an optional, reviewed entry-stage assertion. It does not yet expose a stage filter or populate real catalogue stage labels. The [canonical contract](../engineering/14_CANONICAL_OPPORTUNITY_CONTRACT.md) defines the public/private boundary.

## Behavior and source discipline

The internal `entryStage` fact uses the existing assertion ID, source snapshot/evidence, original wording, uncertainty, method and reviewer controls. A stated value holds 1–5 distinct labels: `school_leaver`, `student`, `graduate`, `entry_level`, `experienced`. Labels can overlap. They describe source-stated discovery context and do not replace or flatten the requirement expression. Entry level does not establish that no experience is required. Category, suggestive title, qualification and missing experience never assign a stage automatically. Wording outside these labels remains unknown pending an evidenced contract extension.

Old internal records serialize unchanged without a stage. Current public projection/response parsing represents an omitted stage as `not_stated`, with null value/wording and no citations. Present unreviewed/rejected/uncited assertions become unknown; ambiguous/conflicting assertions retain uncertainty with no chosen public value. Private alternatives and source/reviewer identifiers remain private. Malformed supplied assertions fail validation rather than silently becoming unknown.

Every relevant fact traversal now includes a present stage: duplicate/reference validation, explanation support, source-ingestion approval reset, actual-reviewer publication and worker material-fact checks. Source-provided approval cannot survive ingestion. A stage correction restricts the old projection until explicit publication. The semantic audit includes a present stage's state/value/wording while omitting storage metadata.

Automatic publication explicitly holds a stated stage with `ENTRY_STAGE_REVIEW_REQUIRED`. Current extractors assign none. Real extraction/semantic qualification must precede relaxing that hold; this packet makes no new provider call or source retrieval and does not grant that authority.

## Compatibility and remaining work

This pre-release schema-version-1 extension allows current readers to accept old records/projections. Previously compiled strict public readers will reject the new public key and require a coordinated update before any release. There is no production rollout or claim of old-client forward compatibility.

After this contract's verification, add the stage query, cursor binding, accessible filter and source-wording display with unknown coverage explained. Preserve all six categories, both internship routes and experienced jobs; do not turn stage filters into applicant eligibility decisions. Subtype/practical detail and report-correction reconciliation remain before B05. G0/G1/G2, real source/stage inventory, participant/physical-device evidence, provider qualification and release authority remain open.

## Verification

- Contracts typecheck and all **29 contract/inspection tests** pass. Five new cases cover legacy roundtrip/public defaults, every label across category/subtype fixtures, overlapping labels without requirement changes, malformed/uncited/unreviewed assertions, privacy, uncertainty and lifecycle.
- The full Firestore/Auth emulator catalogue suite passes **491 tests**, including two new stage worker/payload cases and an ingestion/publication/correction integration. Source-supplied stage approvals reset to pending, references bind to the captured snapshot, publication uses the authenticated reviewer, and a saved correction restricts old public output until re-publication.
- Web lint/typecheck, production build and all **48 web boundary tests** pass. The catalogue suite includes its enabled server-rendered web/handoff smoke. No browser UI interaction or participant observation is claimed for this data-only packet.
- All ten changed code/test inputs match their saved verification hashes. Emulator ports 18080/19099 are closed after the suite.
- Two setup issues are preserved privately: a privacy-test fixture ID contained “student”; a neutral ID resolved the false positive with the same no-stage-leak criterion. A concurrent catalogue Next dev smoke server shared .next with the initial production build, causing a missing trace at finalization. After that suite exited, sequential production build and web tests passed. No product change or test deletion addressed this runner conflict.

Commands: pnpm contracts:typecheck; pnpm contracts:test; pnpm web:lint; pnpm web:typecheck; pnpm web:build; pnpm web:test. Catalogue: Firebase CLI emulators:exec with packages/catalogue/firebase.test.json, demo-skilved-b03, firestore/auth and pnpm --filter @skilved/catalogue test. Private logs, hashes and review: .artifacts/sprint-loop/b04-entry-stage-2026-10-15/.
