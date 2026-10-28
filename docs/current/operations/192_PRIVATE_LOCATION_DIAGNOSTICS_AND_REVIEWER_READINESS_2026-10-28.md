# Private location diagnostics and reviewer readiness

28 October 2026 (SAST). Following the [dated-notice assessment](191_DECISION_HISTORY_AND_DATED_NOTICE_ASSESSMENT_2026-10-28.md), the location-evidence guard now attaches a bounded private explanation to future rejections. The prior ALPLA response cannot be reconstructed and was not retried.

## Failure diagnosis

The existing `AI_LOCATION_EVIDENCE_UNRESOLVED` failure now carries a versioned diagnostic with the first rejected field, a fixed reason and an optional zero-based place index. City, province and country use `place_not_in_span`; attendance and coverage use `explicit_label_not_supported`; relocation uses `verbatim_line_not_supported`. No quote, returned place name, relocation wording, provider response or arbitrary property is retained.

The worker projects only known field/reason combinations with valid bounded indices into private ordinary exceptions and per-programme exception decisions. Invalid diagnostics are omitted; extra properties are discarded. Public worker results retain their existing state/reason shape. Extraction and split metadata retain the diagnostic alongside reported usage. Existing evidence checks, successful mappings, model prompts, cache identities, budgets and semantic retry behavior are unchanged. The diagnostic neither repairs output nor changes publication eligibility.

Regression coverage exercises every rejection field, unchanged input, fixed error messages, invalid indices/versions/fields, extra-value removal, single/split propagation with charged usage, and actual emulator persistence in a worker exception without exposure in its returned result.

## Reviewer setup

Read-only Admin SDK probes found no staging Firebase Authentication configuration and no `m0_operators` records. The first probe lacked a quota-project header and was inconclusive. Repeating it with the staging quota project set for that process returned the explicit missing-configuration error for both project configuration and the current account lookup. The Identity Toolkit and Secure Token APIs are already enabled; enabling an API alone did not initialize Authentication. Global ADC and project configuration were not changed.

The founder selected the current Google Cloud account for the staging reviewer. Its email and pending setup packet are private. The Firebase console opened at Google sign-in, so Authentication initialization and genuine reviewer sign-in remain pending. No Firebase user, UID, credential or application role was invented or created. Console administrator sign-in and application reviewer sign-in are separate steps: a real Firebase UID/token must exist before assigning the role and using the normal operator path.

Use the [staging Authentication console](https://console.firebase.google.com/project/skilved-staging/authentication) to initialize standard Firebase Authentication and configure the intended sign-in provider. After genuine sign-in, bind the verified current account's UID to the required operator role through authorized infrastructure setup. The operator CLI itself still has no role-bootstrap command. Google's separate [public Identity Platform initialization endpoint](https://docs.cloud.google.com/identity-platform/docs/reference/rest/v2/projects.identityPlatform/initializeAuth) requires a billing-enabled project; no paid upgrade or billing change was attempted here.

## Source and staging state

The prepared Bidvest notice still requires source qualification and supported original-destination evidence. Its employer robots disallows automated retrieval, and its job page was not fetched. Brochem's saved email notice contains qualification alternatives requiring source-faithful interpretation. Neither was registered, assessed with AI or published in this sprint. Employer crawling remains optional; an unavailable automated crawl is not evidence that a job is closed or that an email is verified.

Independent complete cloud readback verified all 448 staging documents unchanged. There were zero model calls, cloud writes, operator grants or publications. The retired local quota ledger remains byte-identical. Hosting stays undeployed at the founder's request; Gemini remains shadow-only and production publishing disabled.

## Verification

The full concurrent catalogue run executed 1,001 tests: 998 passed and three failed. One failure was an incorrect new assertion expecting missing place evidence where the fixture actually omitted its attendance label; that assertion is corrected. A publication-preview snapshot also observed another test's audit writes, and a timed suggestion-route case returned 500 instead of 404. All three cases subsequently passed in a fresh emulator with test files run serially. This does not establish a clean concurrent full-suite run or resolve the suggestion-route failure's cause; test isolation/timing remains follow-up work.

All 13 final location evidence/metadata tests pass, including single/split diagnostic and usage propagation. Eight scoped metadata/runtime guard checks also pass. The final worker image was rebuilt and checked with networking disabled: it runs as `node`, rejects disabled activation, and includes both the diagnostic and malformed-field rejection. It was not deployed. Changed-document checks verify 246 local links, and Git whitespace checks pass. Private identity probes, pending account details, logs and source packets remain ignored outside Git.
