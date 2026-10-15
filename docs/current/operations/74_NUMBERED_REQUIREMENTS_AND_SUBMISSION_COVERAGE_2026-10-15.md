# Numbered requirement sections and explicit submission coverage

Date: 15 October 2026. Status: 487 catalogue tests pass. A bounded new-contract trial on the same frozen Transnet snapshot passes the source checklist and produces one private draft. No public records are created.

Canonical extraction advances to V12, compact extraction to recentjobs_extraction_v12_groq_v7, bounded requirement policy to V5, programme extraction to V13, split metadata to V5 and ordinary/programme validation to V10. Strict output schemas, expression grammar, original application binding and publication controls remain unchanged.

## Source coverage and field semantics

Known section headings can carry a numeric prefix such as 2. or 2). Only heading recognition uses that normalised label. Original text, numbered condition wording and one-based evidence positions are unchanged. Known duties/end headings close the requirement section; Documents to prepare also closes it so publisher advice does not become required eligibility.

A deliberately narrow table recogniser handles the observed explicit educational-pathway introduction, Qualification route / Required subjects headers, distinct bounded route/subject pairs, and Important conditions followed by explicit age and citizenship conditions. It abstains on unknown rows/continuations, duplicate routes or missing shared-condition evidence. The introduction and table headers become layout context. Every route stays one complete education item, and the route references must be direct, distinct children of ANY. Replacing them with ALL or splitting a route fails locally. Shared conditions remain separately covered and still receive semantic review.

Within bounded required sections, a limited set of unconditional Attach/Submit/Provide/Include statements about qualifications, academic records, transcripts, CVs or certificates becomes submissionInstructions. The full instruction must be in a required document item or in both practicalConditions.value and its contiguous evidence. Missing evidence fails AI_SUBMISSION_INSTRUCTION_COVERAGE; a competing preferred/wrong-kind item fails AI_SUBMISSION_INSTRUCTION_UNRESOLVED. Exact unknown logic remains a safe material hold. Mixed/conditional wording and instructions outside the recognised section are not silently classified by this rule.

Metadata receives the submission hints and preserves their exact wording. Full-record validation checks both eligible fields before calling an instruction missing. It continues to distinguish publisher preparation advice from employer requirements. Code neither inserts the missing instruction nor repairs a returned answer.

## Authored and offline verification

Seven focused regressions cover numeric headings and unchanged numbered condition text, excluded table context/duties/preparation advice, required document versus practical-field placement, omission and partial wording, wrong strength/kind, complete ANY routes, unknown holds, unfamiliar/unbounded layouts, original route preservation, no semantic fallback after a local failure, and split metadata payload/evidence.

An emulator worker regression rejects an omitted attachment before candidate storage or validation; the complete practical instruction proceeds through a separate simulated assessment to a private draft with the exact original route and no publication. All 487 catalogue tests pass, including historical replay and real feed/detail/handoff integration. The 42 targeted source-policy/compact/validation checks also pass.

The previous saved 3.6 answer is rejected unchanged by the new coverage contract. That answer retains age/citizenship in equivalent header text, but the new hints require the listed section passages; those facts must not be reported as actually absent. The genuinely missing attachment is isolated in authored guard tests and was already caught by the previous semantic assessment. No previous response or source snapshot is modified.

## Bounded private trial

The worker reuses the same snapshot acquired earlier on 15 October, with its frozen pre-model checklist. There are no new publisher/employer requests in this sprint. The source stays unqualified, shadow-only and ingest-only, with employer crawling off and a six-call cap. Previous quota state is imported before work; the historical expired hold is not reactivated or extended.

3.8 returns an extraction in one call, reporting 5,603 total tokens. A separate 3.8 assessment reports supported=true with no issues and 5,461 tokens. There are two actual calls, two receipts and two spent reservations; all usage is known. The unchanged output passes shape, exact evidence, source coverage, grouping, route and material checks.

The agent checklist review verifies all three complete qualification alternatives under ANY; the four shared mathematics, age, citizenship and no-trade-certificate conditions under ALL; and the attachment instruction verbatim in practical conditions. Publisher preparation documents are not promoted into required items. Four original cities retain unknown province/country/attendance/relocation; the reference, future deadline and exact original requisition link remain preserved.

One private candidate, shadow decision and draft are stored. The draft remains lifecycle review and publication.approved=false; there are zero public records. The previous trial used a different available model, 3.6, so this observation is not a controlled comparison attributing the result solely to the contract. It is one passing familiar-source trial, not repeatability, independent human review or broad source qualification.

Updated shared tracking is exported: twenty-one observed worker requests, 53,778 known total tokens and eleven historical unknown-usage calls across prior/current trials. The two new calls add 11,064 tokens and no unknown-usage calls. These are not provider/dashboard totals. The historical availability export remains unchanged.

Credentials, local environment files, raw responses, source snapshots, private checklists, quotas, audits and previews remain ignored. The separate navigation sprint and its files were preserved.

Next verify repeatability and an independently screened eligible notice under this frozen contract. Broader qualification layouts, numbered-section variants, publisher versus issuer evidence and source/route reuse policy remain qualification work. Production scheduling/publication stays disabled; employer crawling optional.
