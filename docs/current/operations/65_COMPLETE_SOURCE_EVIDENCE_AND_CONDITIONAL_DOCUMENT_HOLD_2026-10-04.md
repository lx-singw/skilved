# Complete source evidence and conditional-document hold

Date: 4 October 2026. Status: 460 tests pass; one controlled Bell extraction matches the reviewed passages but remains held before semantic validation.

Canonical extraction V8 now supplies source-local location evidence hints, while the current bounded requirement policy advances to V2 with complete assessment spans and held-passport classification. Programme extraction advances to V9 and split metadata to V3; programme validation stays V6. Strict response parsing, the existing location guard, material-fact checks and publication controls remain unchanged. Historical review source selectors and frozen replay expectations remain intact.

## Source-local controls

`locationEvidenceHints` reports only recognised coverage/attendance labels and their complete inclusive source spans. The two-line Locations / All provinces table includes both lines. Unrecognised, conflicting or negative labels suppress the corresponding hint. A city never supplies a province, country, attendance or scope. The model must cite the full evidence span; hints do not patch an incomplete returned quote or insert facts into its answer. Compact ordinary/programme requests and the separately versioned metadata request include these hints.

Requirement V2 recognises a deliberately narrow complete assessment passage: a pass-technical/aptitude-assessment introduction, a numeracy/literacy pair, and a bounded end or explicit next applicant condition. It abstains on unknown additional components, incomplete pairs and unbounded sections. The recognised passage must remain one complete item, with kind `other`; split or overlapping partial items fail `AI_REQUIREMENT_GROUP_UNRESOLVED`. Exact unknown logic remains a safe abstention when there are no competing confident partial items.

An unqualified “Valid passport” line in a bounded required/preferred profile section is a held credential, kind `other`, not a citizenship or submission requirement. The same wording in a document-submission section retains kind `document`. Qualified or unfamiliar wording is not classified by this narrow rule. Required/preferred strength and conditional uncertainty remain separately checked.

Authored tests cover complete location spans, geography non-inference, conflicting labels, complete versus split/overlapping assessments, unknown/incomplete continuations, passport possession versus submission and unchanged output rejection. The prior saved Bell answer is rejected without modification: its passport kind conflicts with the new source rule, its assessment is split, and its location quote still fails the unchanged evidence guard.

## Bounded controlled trial

The source snapshot and independent agent-authored pre-model checklist remain frozen from the previous evaluations. No new publisher or employer page is fetched in this trial, so it does not establish freshness or source-policy qualification. The private source remains shadow-only, with an ingest-only grant, employer crawling off and a six-call allowance.

Prior quota counters and the 3.8 daily hold are imported before any request. The hold's reset is preserved without extension. 3.8 is skipped before reservation; 3.7 returns HTTP 503 with usage unknown; 3.6 returns complete JSON reporting 5,051 total tokens. Two HTTP calls match two receipts and two spent source-budget reservations.

The unchanged returned extraction passes strict shape, current requirement policy and location mapping. The agent review finds:

- All fifteen mandatory checklist passages and all six preferred passages match with their reviewed strengths.
- The technical assessment, numeracy and literacy remain in one complete condition. Qualification subjects also remain with Grade 12 wording.
- The preferred passport uses kind `other`, with no invented nationality.
- National coverage cites Locations / All provinces; country, attendance and relocation remain unstated.
- The certified-copy acceptance restriction, original employer portal and stated deadline are retained.
- “Other supporting certificates, if applicable” remains an ambiguous document fact with unclear strength. Its undefined predicate is not guessed or promoted to an unconditional obligation.

A single private canonical candidate is stored. The existing `assertMaterialFacts` policy then rejects it (`MATERIAL_FACTS_UNRESOLVED`), before any semantic validation, draft or publication. The conditional-document fact is the candidate's sole ambiguous/conflicting material fact. There are zero validation calls, drafts or public records. This is one reviewed extraction on a familiar saved source, not repeatability, independent human review or production qualification.

The updated private quota export retains all earlier tracked reservations. Combined tracking now contains eight requests, 15,918 known total tokens and five calls with unknown usage. These are tracked worker calls only, not total provider/dashboard usage. Credentials, raw responses, sources, request freezes, private state and audits/previews remain ignored under `.artifacts/`.

## Verification and next work

`pnpm catalogue:test` passes all 460 tests, including historical frozen replay checks. All 53 targeted requirement/location/ordinary/programme tests pass. The private audit verifies exact returned evidence, complete checklist passages, passport kind, the single conditional ambiguity, unchanged daily hold, cumulative counters and zero validation/publication. Production scheduling/publication remains disabled; employer crawling remains optional.

Next distinguish explicit source-written conditional document instructions from genuinely missing eligibility facts. Preserve their exact wording and applicability instead of converting them into unconditional requirements, preferences or silently omitted documents. Any change to the material/publication policy needs meaningful regression checks and independent semantic assessment before a bounded draft trial. Broader source qualification and repeatability remain open.
