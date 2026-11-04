# Shared application-layout prototype

4 November 2026. Follow-up to the [saved-cohort hold audit](226_HELD_NOTICE_COVERAGE_AUDIT_2026-11-04.md). Two reusable extraction patterns are implemented in a separate opt-in adapter, with authored regressions and a complete offline replay of the twenty saved notices. There are no site requests, provider calls or cloud writes.

## Result and limits

The prototype recovers the two measured missing methods:

| Pattern | Saved-evidence result | Remaining blocker under the existing source policy |
|---|---|---|
| Labelled application-email block | The exact recipient, application context and email subject are retained as pending source evidence. | `ISSUER_RELATIONSHIP_UNQUALIFIED`: recipient/employer authority is still absent. |
| Application action inside the selected notice's footer | The exact portal URL and action label are retained; the separate publisher WhatsApp invitation is excluded. | `NOTICE_PRECISION_UNSUPPORTED`: a usable closing date is still absent. |

Both changed notices still fail source preflight. Recovering a publisher method does not establish current availability, original employer authority, application safety or publication eligibility. The other **eighteen notices have identical candidate objects and content hashes**. All twenty original raw-body and baseline parsed hashes match the saved worker outcomes. The ambiguous poster email remains unsupported, and the pending V31 candidate is unchanged.

This is an **opt-in parser prototype**, not an enabled worker feature. `packages/catalogue/src/adapters/recentjobs-application-layouts.mjs` exports `parseRecentJobsApplicationLayouts`; the existing worker, discovery adapter, source policy and deployment entry points do not import it. Tonight's [pinned validation run](225_V31_COHORT_AND_DEFERRED_VALIDATION_2026-11-04.md) continues to use its existing adapter. Promotion into the normal worker remains separate work after that run's outcome and cleanup are checked.

## Extraction boundaries

The email pattern requires an explicit How-to-apply heading, a narrowly recognized application-email label and immediate valid recipient lines. An optional email-application subheading is supported. A supplied subject must have a complete next-line value; no subject is invented. Quotes stay verbatim within source text, including heading, recipient and subject. Multiple recipients remain separate pending candidates. Repeated blocks with a shared recipient and different subjects retain a programme-scope review hold rather than assigning a subject to an intake.

Bare addresses, poster context, enquiries, generic contact/form-request/example instructions, email prohibitions, ambiguous extra recipients/subjects and oversized blocks remain unsupported. Address components are masked during context checks so a recipient's domain does not become a misleading instruction word. Numbered application instructions remain inside the application section for prohibition checks.

The footer pattern requires containment inside the already selected notice body and article. Navigation, sidebars, comments, site footers, hidden/styled content, embedded notices and unfamiliar footer structures stay excluded. Only one explicit application action is admitted. Other links or text reject the footer, except a separately labelled matching HTTPS WhatsApp invitation, which is removed before source extraction. An application label pointing to a social destination does not qualify. Existing destination checks reject credentials, IP literals, unsafe protocols, internal hosts, publisher links and unsupported ports.

The ordinary parser is reused for source/layout validation and destination syntax. No URL is visited. Unchanged inputs return the complete legacy candidate unchanged. Added layouts use a distinct shadow adapter identifier and recomputed content hash covering the added source text and pending routes. All pre-existing review, date, category, physical-method and programme-scope issues remain relevant.

## Verification and continuity

All **54 focused tests pass**, including ten new layout tests and the existing RecentJobs, held-cohort audit and scheduled-start tests. They cover exact quotes/subjects, multiple recipients and intake scope, prohibited and ambiguous email contexts, footer containment, social-text exclusion, unsafe targets, unchanged legacy hashes and existing source/body/layout limits.

The complete private replay and checks remain under ignored `.artifacts/groq/application-layouts-2026-11-04/`; source bodies, addresses and row-level evaluation data are not committed. Before closing, all thirteen scheduled code hashes and four private bootstrap hashes are rechecked, along with the actual Windows task definition and its **23:40 SAST on 4 November** start. The worker is due at **00:00 SAST on 5 November**; future validation and cleanup remain pending.

No current grant, source quota, provider accounting, job, candidate or publication state is changed. Six private drafts and zero public records remain the last independently audited cloud state. Employer crawling stays optional; hosting and publication stay off.

Next: inspect tonight's validation/cleanup receipts, then integrate the shared adapter through an explicit worker opt-in with cache/version compatibility tests. Qualify recipient/employer authority and original availability evidence independently; missing dates and ambiguous poster methods must not be promoted by route extraction alone.
