# B04 preparation checklist and report UI

Date: 15 October 2026. Base: `f65d645`. Scoped engineering packet for B04b/c, following the completed qualification-grouping correction in [operations/68](../operations/68_COMPLETE_QUALIFICATION_GROUPING_AND_CLOSED_SOURCE_REGRESSION_2026-10-15.md). The next real-source trial remains subject to its existing provider authority/budget; this independent UI packet uses synthetic local data only.

## Outcome and work order

Readers can review preparation instructions without losing source alternatives or uncertainty, and send a bounded private issue report through the existing API. Preparation ticks are transient until B05 supplies explicit persistence and recovery semantics.

1. Add a public-contract preparation component. Show the shared canonical AND/OR/conditional formatting, source wording, required/preferred/unclear labels and unknowns. Ticks indicate the reader reviewed an instruction, not eligibility or application submission. Reset the child component when record or requirement-set revision changes.
2. Add a report form to configured public detail pages using the existing report-intake flag and four accepted reason values. Submit only opportunity ID, reason and bounded description. Use POST even without hydration to avoid descriptions entering GET URLs; explain the JavaScript requirement.
3. Recognize only an actual 202/received acknowledgement. Prevent concurrent submits, bound the request duration, preserve the description on failure, distinguish rate limiting and provide an explicit retry without automatic duplicate sends. Tell readers that receipt is not verification or resolution.
4. Verify rendered canonical conditions across all six categories and both internship routes, source escaping, report privacy/size limits, the production preparation/denial boundary, and browser-to-emulator report receipt. Keep fixtures and test tooling outside application routing and public assets.
5. Record actual evidence/limitations, commit and push the completed packet, then checkpoint the next dependency-eligible B04 work. Formal source/user/deployment gates remain open.

## Acceptance and disposition

| Acceptance | Result |
|---|---|
| Canonical alternatives/conditions, unknowns and source text preserved | Three focused rendering/privacy regressions pass, including all-category/subtype cases |
| Transient ticks are labelled honestly and usable by keyboard | Synthetic browser interaction confirms keyboard toggle, clear control and reset on reload; revision changes key the component |
| Report intake is bounded and private | Form sends only the existing accepted fields; no attachments/contact fields; body capped by existing API and description by 1,500 characters |
| Failure does not lose the report or fabricate receipt | Browser whitespace rejection and 429 response retain state; deliberate retry produces receipt only after successful API response |
| Actual private queue receives report, without ticks | Isolated Firestore contains exactly one pending synthetic report after the successful retry, with no checklist fields |
| Default-disabled and sensitive-route boundaries remain intact | Production build and all 27 web tests pass |

See the [sprint result and limits](../operations/69_PREPARATION_CHECKLIST_AND_REPORT_UI_2026-10-15.md). This completes the scoped local packet, not full B04/G2 acceptance. Network timeout recovery is implemented but was not induced in the browser session. Real device/assistive-technology/user observation, live source coverage and deployed report retention/abuse controls remain open.
