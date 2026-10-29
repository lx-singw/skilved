# Shared Microdata JobPosting support

Follow-up: [explicit deadline evidence](202_ORIGINAL_DEADLINE_EVIDENCE_2026-10-29.md) subsequently decodes supported legacy UTC values and records South African day shifts. The frozen portal still lacks authority; its decoded date disagrees with the publisher. The earlier results below retain their original adapter/policy context.

29 October 2026 (SAST). A shared, bounded Microdata adapter now reads the employer-page representation identified by the [first-ten RecentJobs assessment](200_REAL_RECENTJOBS_NATIVE_COVERAGE_2026-10-29.md). It contains no employer names, vacancy IDs, host-specific selectors or per-opportunity rules. Supported Microdata enters the existing exact-original resolver only in the opt-in shadow lane; the legacy validation/publication path retains its JSON-LD format boundary.

## Supported representation and controls

The adapter implements a conservative local-descendant subset of the [HTML Microdata model](https://html.spec.whatwg.org/multipage/microdata.html) for [Schema.org JobPosting](https://schema.org/JobPosting). It reads marked properties within one posting scope, including nested organizations, locations and identifiers. Nested item properties remain separate: a place's name cannot become the employer name. Meta content, link destinations, data values and time attributes retain their explicit values. Literal hiring-organization names are retained without inventing a corporate URL or delegation.

The HTML is parsed inertly, without script execution, linked resources or external item-reference traversal. Input is bounded to 500 KB, 20,000 document nodes and depth 100; item decoding has additional visit, nesting, property and repetition bounds. Common executable, navigation, form and explicitly hidden subtrees are excluded from property text. Description paragraphs and reference boundaries survive the safe text projection, including literal entities and comparison signs.

Multiple postings, mixed JSON-LD/Microdata postings, repeated identity fields, external item references, unsupported item types, base-URL overrides and missing required evidence remain unsupported. This is deliberately a subset, not universal Microdata or ATS coverage. Mixed representations are held rather than silently selecting a preferred posting, including on the legacy parser path.

The original resolver records `jobposting_microdata_v1` separately from `jobposting_jsonld_v1`. Its version advances to `original_jobposting_v2`, separating shadow AI cache keys from the earlier resolver policy. Existing issuer approval, exact destination/canonical/main-entity binding, reference, title, date and optional-crawl checks still apply. Microdata item IDs and nested main-page URL claims cannot contradict the target. No parsed value establishes employer authority or permission to publish.

## Frozen real-cohort comparison

The exact same ten publisher notices and saved eligible portal body were reassessed offline, with the same input fingerprint and denominator. All ten details still parse. Supported structured employer representations increase from **zero to one**: the formerly unsupported Microdata page now parses. Its coverage row advances to `AUTHORITY_NOT_ASSESSED`, not to a matched or publishable result. The other nine rows keep their previous holds.

The saved employer page supplies a literal organization name without a corporate URL usable by the existing authority-discovery contract. Its legacy UTC deadline is preserved verbatim, not converted into an agreed South African closing date. The adapter does not manufacture a recruitment reference, vacancy binding or issuer relationship. Employer authority, exact-vacancy evidence and deadline agreement still require their own supported corroboration.

Normal `RecentJobsWorker.run` was also replayed against those frozen observations under one publisher/grant and an intentionally empty authority registry. All ten details remain held: five precision holds, two publisher-date holds and three original-verification holds. The portal still has `ISSUER_HINT_UNSUPPORTED` / `ORIGIN_UNQUALIFIED`; its new format support does not bypass authority. There are **zero extraction/validation attempts, model calls/budgets, candidates, decisions, drafts or public records**. The 24 frozen response reads are not live network requests.

These are frozen format and worker checks, not new live acquisition, real AI accuracy measurement or a positive production qualification. Private observations, comparisons and replay receipts remain ignored under `.artifacts/groq/microdata-adapter-2026-10-29/` and `.artifacts/shadow/`. No captured HTML, provider response or real-source fixture is committed.

## Verification and remaining work

Eight authored adapter cases cover multiple fictional employers, literal organization handling, nested scope separation, text/reference preservation, ambiguous/unsupported representations, conflicting URLs/item IDs, raw dates, optional crawling and resource limits. A normal worker batch produces two private drafts for two fictional issuers and holds a third unresolved date before either model stage. A separate legacy-path regression rejects Microdata before validation and produces no draft, retaining its existing post-extraction acquisition order.

All **105 affected checks** pass: 75 parser/coverage/resolver/origin/policy/staging-guard checks and 30 emulator worker/registry/discovery cases. The final two Microdata worker cases are also repeated after the binding-conflict check, followed by the real frozen replay. The contract build passes. The local worker container is rebuilt and checked as user `node` with networking disabled: Microdata loads, raw dates survive, legacy-format rejection remains enforced and disabled activation remains rejected. Changed-document links and Git whitespace pass. The full catalogue suite is not rerun; the previously noted intermittent suggestion-route failure remains open.

Next, extend reusable original-source identity/authority and deadline corroboration, plus exact email/intake verification for dated email methods. Keep the fixed mixed-cohort denominator and typed holds while measuring which shared capability unlocks real notices. Do not replace missing evidence with employer-name branches, guessed dates, generic application pages or manual per-vacancy grants.

No provider calls, live cloud writes, source/registry changes, quota changes, grant changes, publication or deployment occur. Employer crawling remains optional. Hosting stays undeployed at the founder's request; automatic verified publication and the durable unattended orchestration milestone remain unqualified.
