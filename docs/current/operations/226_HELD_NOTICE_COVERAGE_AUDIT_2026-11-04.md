# Saved-cohort coverage audit of held notices

4 November 2026. Follow-up to the [V31 cohort and deferred validation](225_V31_COHORT_AND_DEFERRED_VALIDATION_2026-11-04.md). This sprint audits the frozen **02:00 SAST** cohort using saved source bytes and recorded outcomes. It makes no site requests, provider calls, cloud writes, authority changes or job changes.

## Findings

The ordered denominator remains twenty discovered notices: nineteen held and one unvalidated candidate waiting for the next source allowance. All twenty saved detail bodies match their recorded SHA-256 hashes; replayed parsed content hashes also match the worker's recorded hashes. The eighteen source-preflight holds reproduce their original codes. The remaining original-source hold is explained by its saved resolver receipt, not by guessing a format failure.

| Held group | Count | Evidence-backed interpretation |
|---|---:|---|
| Publisher date already elapsed | 7 | Each supplies an earlier closing date; the source-date hold is supported. This does not independently verify employer closure. |
| Category conflict/review | 2 | The conflicting current internship invitation or absent apprenticeship assertion reproduces the category hold. Both notices also have elapsed publisher dates. |
| Missing parsed route with a recoverable source hint | 2 | One labelled application-email block and one Apply link in a footer nested inside the selected notice body are not captured by the current parser. Neither hint establishes employer authority or availability. |
| Incomplete/ambiguous route evidence | 1 | A poster-context email mention, missing date and source-stated uncertainty require original instructions and review; harvesting the email would not qualify a method. |
| Date-only precision holds | 6 | Four provide no closing-date candidate and two explicitly say the date is unspecified. Parsing cannot manufacture a date absent from the notice. |
| Unqualified employer authority | 1 | The recorded original resolver reason is `ORIGIN_UNQUALIFIED`. The employer page's format was not tested in this run. |

These groups account for all nineteen held notices. Existing holds remain in force. A source extraction gap is not a determination that the opportunity is open, authentic or eligible for publication.

The broad `NOTICE_PRECISION_UNSUPPORTED` code therefore hides **three missing parsed routes and six date-only cases**. Two route-missing cases also lack dates, giving **eight absent/unspecified publisher dates** among the nine precision holds. Across the full cohort, **nine publisher dates are already elapsed**, including the category-first cases. Secondary blockers remain visible instead of replacing the recorded first-stop reason.

Three parsed routes lead to job-board intermediaries and still require original-method corroboration. One undated notice explicitly describes building a database/talent pool, which needs an appropriate opportunity classification and availability policy. No job-board route, email address or talent-pool wording becomes an approved original application method through this audit.

The source registration still uses **one inline issuer entry**, with the shared issuer registry and original-discovery flags absent. The existing unsupported-original case is consequently an authority/onboarding problem before it is a demonstrated ATS-adapter problem. The source also intentionally rejects undated admission. Several holds reflect incomplete source evidence or current qualification policy rather than missing date-regex support.

## Reusable offline tool

`audit-recentjobs-holds.mjs` accepts a private saved bundle containing source policy, a frozen ordered selection, recorded detail outcomes and hash-bound observations. It runs the existing parser and source-only preflight against the recorded observation time. Missing observations/outcomes remain in the denominator. Duplicate/unselected observations, invalid source/revision bindings, altered body hashes and inconsistent capture timing reject the bundle.

The tool distinguishes source-date, category, route, undated-policy, employer-authority and quota-deferred findings. It records secondary date and intermediary/talent-pool evidence. Labelled email and embedded-footer links are **diagnostic hints only**; canonical application candidates are not amended. Footer hints must remain inside the selected notice body; site footers, navigation, promotion links, script-only labels and unsafe targets are excluded.

The CLI bounds local files and rejects path traversal and symlink escapes. It prints counts and the private report path, leaving source passages and addresses out of stdout. Reports stay under ignored `.artifacts/`. It imports no database, credential or provider client and exposes no approval or publication path.

Usage after building contracts:

```sh
node packages/catalogue/tools/audit-recentjobs-holds.mjs <private-manifest.json>
```

The real audit bundle, detailed twenty-row review, exact evidence hints and JSON report remain private under `.artifacts/groq/held-notice-audit-2026-11-04/`. Source bodies and provider responses are not copied into committed fixtures; tests use authored synthetic notices.

## Next engineering work

1. Prototype bounded **labelled application-email block** support, retaining recipient, subject and submission context. Preserve exclusions for enquiries, generic contacts, form requests, poster ambiguity and multi-intake recipient scope.
2. Prototype **notice-bound footer application actions**, with explicit identity/body containment and negative cases for site chrome and unrelated posts. A global footer/link sweep would lose the current source boundary.
3. Prepare reviewed **shared employer-authority registry/onboarding** adoption. Source policy changes require separate review and would invalidate tonight's pinned qualification plan.
4. Qualify original availability/date evidence or a separate undated lane where appropriate. Employer crawling stays optional. Missing dates, intake years and publication dates must not be converted into invented closing dates or claims that a vacancy remains open.

No production parser, source policy, quota, authority, existing candidate or scheduled bootstrap is changed in this sprint. Tonight's **23:40 SAST** local start and **00:00 SAST on 5 November** validation remain scheduled. A fresh scheduled-task and pinned-hash readback is recorded before closing.

## Verification

All **17 focused checks pass**: nine new cohort-audit/CLI tests and eight existing native-coverage tests. They cover deterministic ordering/fingerprints, immutable inputs, source/time/body bindings, missing evidence, distinct date states, authority versus format findings, bounded email/footer hints, secondary blockers, stdout privacy and file/symlink confinement. The real twenty-row replay reproduces all eighteen source holds, explains the authority stop from its receipt and preserves the pending candidate as unqualified. Network requests, provider calls and cloud writes are zero.

Six private drafts and zero public records remain the last independently audited cloud state. Independent semantic validation, current employer availability and public publication qualification are not supplied by this saved-evidence review. Hosting and publication remain off.
