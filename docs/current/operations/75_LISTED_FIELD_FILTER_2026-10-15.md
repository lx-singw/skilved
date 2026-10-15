# Listed-field discovery filter — 15 October 2026

The B04 packet adds **Field or discipline** to the signed-out catalogue and displays existing field labels, or “Field not stated”, on cards. Optional API parameter field is trimmed, 1–120 characters, and matches a literal case-insensitive substring of an existing public field label. It intersects existing category, geography, attendance and keyword filters. Titles, summary, qualification and experience text do not supply field matches. No synonym expansion or full-text index is claimed.

The form explains unknown coverage. A single blank/whitespace field widens the page search; direct API empty/repeated/oversized fields fail validation. Unknown fields remain browsable without this filter. Existing publication/freshness restrictions remain intact. The database canonical matcher runs before sorting/pagination. Load-more, detail return and restart retain field selection; cursors reject a changed/removed field. Existing v1 cursors without field retain their fingerprint.

## Observed verification

- Contracts typecheck and all 24 contract/inspection tests pass. New cases cover six categories and both internship fixtures, Unicode/literal punctuation, unknown fields, intersections, lifecycle, bounds and cursor compatibility.
- Web lint, typecheck, production build and all 48 web tests pass. Three new query/render tests cover blank normalization, duplicate rejection, safe labels/help, filtered empty state and pagination/return/restart.
- Firestore/Auth emulator execution of pnpm --filter @skilved/catalogue exec node --test tests/catalogue.test.mjs passes all 18 integration tests. Alternating unknown/matching records with limit 1 return both matching pages; unfiltered results retain unknown records. The first runner used the wrong cwd for an existing operator subprocess; correcting the runner resolved it without product changes.
- A separate secret-free temporary candidate installs frozen dependencies offline with lifecycle scripts disabled and compiles shared contracts. Three changed production inputs compare byte-for-byte with the reviewed checkout.
- Actual browser checks at 375×812 use six synthetic demo-emulator records: “café & engineering” finds card 2, load-more finds card 4, reloaded detail returns to the same filtered page/card, “Nursing” yields the filtered empty state without an old cursor, and whitespace clearing restores card 1 with “Field not stated”. Document width 360 is within viewport width 375. Logs, DOM states, receipts and screenshot remain private under .artifacts/sprint-loop/b04-field-2026-10-15/.
- Temporary tab/viewport and this packet's web/emulator services are closed. Cold development compilation briefly exceeded observation deadlines; subsequent actual rendered journeys passed. Browser-tool telemetry failures were external to the local candidate.

## Remaining scope

This completes the bounded field packet, not B04 or formal G2. The existing fields array is reviewed with the published record but lacks per-label assertion provenance. Fixtures do not establish real inventory completeness.

**Stated entry-stage filtering remains pending.** The contract currently stores free-text experience and internship subtype, not a normalized stage assertion. Add a separately scoped provenance-bearing optional stage fact with legacy unknown fallback and review/projection safeguards before exposing that filter. Do not infer stage from category, title, qualification or missing experience. Detail subtype/practical-condition clarity and operator-to-public report-correction reconciliation also precede B05.

G0/G1/G2, real six-category inventory, participant/physical-device evidence and release authority remain open. No production deployment, source retrieval, provider call or paid resource occurred in this packet. Independent source sprint 5a09752 and its [numbered-requirement/submission trial](74_NUMBERED_REQUIREMENTS_AND_SUBMISSION_COVERAGE_2026-10-15.md) are credited separately.
