# Shared original-notice corroboration

29 October 2026 (SAST). A reusable resolver now corroborates an exact linked employer portal notice before AI work in an opt-in shadow lane. It returns fixed `matched`, `conflicting`, `closed`, `unavailable` and `unsupported` outcomes. It has no employer name, title, requisition or vacancy-specific production branches.

This follows [resumable publisher discovery](196_RESUMABLE_PUBLISHER_DISCOVERY_2026-10-29.md) within the [autonomous delivery sequence](../engineering/17_AUTONOMOUS_OPPORTUNITY_SYSTEM.md). It is a foundation for B, not completion of original-source discovery or qualification of automatic publication.

## Admission and acquisition

The optional source policy is `automation.originalVerification: "shadow_v1"`. Automatic mode is rejected while this flag is present; disabled mode and the existing pause control remain available. Programme extraction is rejected before any fetch in this lane. Existing policies without the flag retain their behavior. No live source is changed or opted in by this sprint.

Employer acquisition still requires `employerCrawl: true` and an existing qualified issuer route. The source's registered host/path and issuer evidence are the trust input. The new resolver does not promote a previously unknown domain or ATS tenant into an authorized employer. An unknown origin gets a private unsupported outcome without fetching it or spending model allowance.

With employer crawling off, the outcome is unsupported acquisition-disabled and there are no employer requests or model calls. Email, physical methods, missing/ambiguous methods and unsupported layouts also remain outside this first resolver lane. No email is sent, application is submitted or alternative destination invented. The legacy shadow preparation path remains available under its existing policy. Equivalent original evidence from an API/feed is future work, not something this implementation fabricates when crawling is off.

Acquisition uses the existing paced, lease-checked worker requests, robots handling, bounded response sizes, pinned public DNS/TLS checks and exact permitted redirect targets. Robots restrictions, retrieval failures and unsafe acquisition become unavailable observations, never proof that the vacancy is closed. Grant revocation, source changes, pause and stale-lease errors propagate through their existing fences rather than being swallowed as network errors.

## Exact-notice matching

The adapter reads one inert JSON-LD `JobPosting`. Multiple postings, generic careers/search pages, script-only content and unsupported structures are held. It retains the existing model-facing primary projection and adds private identity metadata and visible description lines for the deterministic resolver. No scripts or linked resources execute.

All supplied posting URL, canonical and `mainEntityOfPage` claims must bind to the exact linked application notice. A canonical alone is insufficient unless an explicit source recruitment reference is independently corroborated. The registered issuer name or explicit alias must agree, and the original role title must occur as whole normalized words in the publisher's notice. Title normalization does not provide semantic paraphrase matching. A shared platform host or company-name substring is insufficient.

An explicit source reference must agree with a primary description's labelled reference or the structured identifier. Conflicting labelled references and ambiguous multiple references are held. An opaque platform identifier with a different value is uncorroborated; it is not silently relabelled as the employer's recruitment reference. An explicit matching description reference can corroborate the intake even when an unrelated platform ID differs. No equality between a job URL number and recruitment reference is assumed.

The original deadline must be interpretable and agree with the publisher's stated date. Identity is checked before an elapsed deadline can produce a closed outcome, preventing a different expired vacancy from closing the intended one. A date-only notice on its closing day remains a policy hold rather than an assertion that the employer has closed applications. Supported timestamps require seconds and an explicit offset, with an unambiguous matching South African calendar date. Unsupported timezone/date forms stay held. Expiry is rechecked after validation and again at the final transaction boundary; an affirmative model answer cannot override it.

These requirements are deliberately stricter than the presence of structured data. [Google's JobPosting documentation](https://developers.google.com/search/docs/appearance/structured-data/job-posting) defines identifier and expiry evidence; it does not make an arbitrary site's employer claim authoritative. [SAP's standard distribution-field reference](https://userapps.support.sap.com/sap/support/knowledge/E/3425858) distinguishes its URL-associated platform ID from job requisition fields. The resolver uses the shared JSON-LD representation where available; no new general SuccessFactors DOM/API adapter is claimed.

## Storage, model work and diagnostics

Every resolver attempt creates an immutable private `m0_worker_original_resolutions` receipt. It links the source/revision, job/attempt, publisher snapshot, captured original snapshot where available, observation time, fixed outcome/reason and identity/check basis. Failed layout/conflict observations retain their original page snapshot for inspection. Jobs, ordinary exceptions and successful shadow decisions reference the receipt. Authenticated reviewers can inspect/list receipts through the existing role-checked API. None of this state is exposed as a public opportunity or a new public verification badge.

Only a matched original proceeds to normal extraction, material-fact checks and independent semantic validation against both notices. Existing issuer attribution, source-bound requirements/metadata, evidence coverage, draft gates and quota authority remain active. Matching identity does not establish that every qualification, location or application instruction is correct.

This lane's cache context includes the resolver version. Each new detail attempt still acquires/checks fresh original evidence before it can reuse cached AI results; an old matched receipt is not an availability cache. Source/model budgets and provider-day exhaustion history are preserved. Unavailable original outcomes become ordinary job exceptions for subsequent operational handling; reset-aware deferral and generalized transient retry orchestration remain work package C.

## Verification

Eleven pure regression cases cover multiple employers, wrong URL/tenant/issuer/title/reference/deadline, explicit aliases, insufficient binding, identifier namespaces, closure ordering, timestamps, closing-day holds, expiry refresh, crawl-off, unknown origins, unsupported methods, error fencing and bounded inert parsing. Six emulator integration cases exercise one persistent publisher registration/grant, an eight-notice batch, receipts/snapshots and private drafts, fresh closure after restart, expiry during validation, optional acquisition, authority revocation, operator reads and activation restrictions. Fixtures are authored synthetic data and use a stub identity verifier for core API authorization; no real employer or provider output is committed.

The mixed batch produces two private drafts across two employers, two conflicting notices, one closed notice, one unavailable check and two unsupported outcomes. Only the two matched notices reach extraction and semantic validation: four simulated model calls total. This is regression evidence, not a real-source accuracy denominator or production qualification.

The affected serial emulator run passes **233/233 tests**, including the new resolver/integration coverage, publisher discovery, legacy worker execution/policy, source registration/publication, fetch safety and publication previews. A final **11/11 pure resolver tests** pass after expanding DNS/socket/TLS failure classification; these overlap the broader run and are not added to its denominator. Contract build/typecheck and all **five staging guard tests** pass. The full catalogue suite is not rerun; no clean full-suite baseline or fix for the prior intermittent suggestion-route failure is claimed.

The final local worker image is rebuilt and checked with networking disabled. It runs as `node`, includes the resolver, corroborates an authored exact notice, respects crawl-off, classifies DNS/TLS failures as unavailable, preserves authorization errors and rejects automatic activation of the new policy. Disabled launcher activation is also rejected. The image is not deployed. Changed-document local links and Git whitespace checks pass. Private logs and verification receipts remain in ignored `.artifacts/groq/original-resolver-2026-10-29/`.

## Remaining delivery gaps and operating state

Employer/platform trust is still configured on the publisher source. Separating that reusable trust, automatically discovering/corroborating employer authority and delegated ATS relationships, finding an original notice when the discovery link is indirect, email/manual-method corroboration, additional ATS layouts and cross-origin deduplication remain open. Legitimate canonical aliases, tracking-parameter equivalence and unsupported date forms may currently be held. These cases need shared policies/adapters and measured qualification, not vacancy-specific exceptions.

This sprint makes no provider calls, cloud writes, grants, source migrations, quota resets, publication or deployment. Hosting stays undeployed at the founder's request. Gemini, split/programme publication and the new resolver lane retain their shadow-only restrictions. The existing production-scale queue/watch limits, source-budget deferral gap and intermittent suggestion-route failure remain unresolved.

The staging launcher's existing crawl-off, reviewed-revision and ingest-only admission rules remain unchanged. Packaging the new module does not widen that cloud runtime's acquisition scope.
