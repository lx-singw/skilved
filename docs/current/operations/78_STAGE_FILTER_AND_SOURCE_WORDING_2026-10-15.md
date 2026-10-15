# Entry-stage filtering and source wording — 15 October 2026

This B04 packet connects the [reviewed stage contract](76_SOURCE_STATED_ENTRY_STAGE_CONTRACT_2026-10-15.md) to signed-out discovery and detail. It retains all six categories, both internship routes and experienced jobs. Public read flags remain default-disabled; no deployment or source/provider call is part of this packet.

## Delivered behavior

Optional exact query parameter stage accepts school_leaver, student, graduate, entry_level or experienced. It intersects existing filters before pagination and matches only a reviewed public fact in state stated containing that label. Missing, legacy, unreviewed, ambiguous and conflicting stages stay browsable without a stage selection and do not become selected-stage matches. Category/title/qualification/experience text never supplies a stage.

The labelled Source-stated entry stage select includes All entry stages, explains unknown coverage and warns that entry level does not mean no experience required. One blank select means all; repeated or unsupported values remain invalid. Stage, field and geography survive pagination, detail return/reload and filter-preserving stale restart. New cursors bind the selected stage; previous no-stage and field-only v1 fingerprints remain valid.

Detail displays reviewed labels, separately labelled original wording and only that fact's approved public citations. Missing and uncertain facts give an honest explanation and issuer-confirmation next action. Conflicting evidence does not choose a label. Public text escapes markup, and restricted detail shows no stage or active application action. Discovery labels do not decide eligibility or flatten requirement alternatives.

The existing ENTRY_STAGE_REVIEW_REQUIRED automatic-publication hold is unchanged. No real stage inventory or automated extraction qualification is established here. Older strict clients still need the coordinated pre-release contract update described in the canonical contract.

## Actual verification

An isolated Linux Git worktree at baseline b26f606 installs selected frozen dependencies offline with lifecycle scripts disabled, with no local environment file. All 31 contract/inspection tests, 52 web tests, contracts typecheck, web lint/typecheck/build pass. The affected Firestore/Auth emulator suite passes all 20 tests. No tests are skipped.

Two new contract tests cover exact stage matching across every category/subtype, uncertainty/legacy/review/lifecycle, filter intersections and cursor compatibility. Three new display tests cover original wording, specific citations, unknown/conflicting states, non-inference, escaping and privacy. A new query/render test covers stage controls and URL recovery, and the existing canonical-detail integration checks actual stage wiring and restricted omission. A new adapter integration verifies all three matching pages with limit 1 among mixed unknown/uncertain records and preserves unknown legacy records unfiltered.

Actual in-app browser checks use synthetic demo-emulator records. At 375×812, Graduate plus Engineering finds card 2, load-more finds card 4, detail displays original wording/citation, and full reload plus Back to results preserves filters/page/card. A synthetic catalogue revision change produces an honest stale-results restart retaining stage/field. Experienced yields no matches; All entry stages restores the legacy unknown card, whose detail states no reviewed stage. Document widths are 360 at viewport 375 and 1265 at viewport 1280. Temporary tab/viewport and ports 18280/19299/18281/19298/39213 are closed.

Command logs, input hashes, browser DOM states/results and screenshot remain ignored under .artifacts/sprint-loop/b04-stage-discovery-2026-10-15/. No participant, physical-device or screen-reader observation is claimed.

## Integration and next work

The separate source-review chat was active in the primary checkout. Its work was preserved; this packet used a Linux Git worktree. The app-created Windows worktree had incompatible Git metadata for WSL and its clean copy was queued for recoverable archival. The primary source sprint then pushed b10e0a2 and became idle before integration; its separate provider/source evidence is not this UI packet's acceptance.

B04/G2 remain open. Reconcile remaining seven-question detail, internship subtype/practical-condition clarity and operator report-to-public correction with actual source/runtime/browser evidence; audit loading/limited-seasonal behavior before moving to B05. Real six-category inventory, held-out qualification, participant/device evidence and release authority remain external gates.
