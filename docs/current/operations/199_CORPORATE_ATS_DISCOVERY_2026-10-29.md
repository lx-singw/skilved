# Automatic corroboration of new ATS destinations

29 October 2026 (SAST). An opt-in shadow workflow can discover a previously unregistered recruitment destination from a linked vacancy and corroborate its advertised path scope against a reviewed corporate careers page. Supported subsequent vacancies reuse that evidence without another ATS registration, source registration, worker grant or vacancy-specific script.

This extends [shared issuer relationships](198_SHARED_ISSUER_RELATIONSHIPS_2026-10-29.md), [original-notice matching](197_ORIGINAL_NOTICE_CORROBORATION_2026-10-29.md) and [publisher discovery](196_RESUMABLE_PUBLISHER_DISCOVERY_2026-10-29.md). It does not bootstrap the authenticity of every unknown corporate identity. A website's company-name or company-URL claim alone is insufficient authority.

## Scope and opt-in

A publisher sets `automation.originDiscovery: "shadow_v1"` alongside the existing shadow issuer registry and original verification policies. Automatic mode remains invalid. With the flag absent, the previous behavior remains: unknown origins are held without a probe. With employer crawling off, there are no employer or corporate requests and no AI spend in this lane. Existing source IDs, budgets, categories, grants and permission controls remain in force.

A source-role operator can explicitly add `delegationPage` to a reviewed employer relationship. This must be a fixed HTTPS page inside the reviewed corporate host/path, with no credentials, query or fragment. Existing relationships without that capability are not silently promoted into corporate discovery roots, and their parsed fingerprints remain unchanged. No live relationship is edited in this sprint.

The first supported acquisition format is a direct portal link, one JSON-LD JobPosting with an unambiguous hiring-organization URL, and a simple visible corporate careers page. Unknown corporate roots, missing/ambiguous hints, unrecognized layouts, provider-wide root URLs, query-dependent listing links, email/manual methods and indirect source chains remain unsupported. There is no general search-engine, browser-rendered ATS or corporate-directory adapter in this implementation.

## Bounded native evidence chain

1. Normal cheap category/method/deadline checks must allow assessment; a closed publisher notice does not trigger origin probes. Current reviewed relationships and usable cached delegations are checked first.
2. For an unknown portal in this opt-in lane, read its robots policy and exact linked notice using the existing paced, public-DNS-pinned, TLS-verified, bounded retrieval path. A syntactically admissible probe is not a qualification of the destination. Intermediaries, private-address syntax and ambiguous encoded path delimiters are rejected.
3. A hiring-organization URL in the posting is only a lookup hint. It must identify one corporate origin and match the name/alias of exactly one current reviewed relationship that explicitly authorizes a delegation page. No unreviewed corporate hint URL is fetched.
4. Read that fixed corporate page and robots policy. A supported page has one main region and one careers/jobs/vacancies heading. Only careers links in that region count; navigation, footers, scripts, explicit hidden attributes/inline styles and warning contexts do not. Contradictory warning links cannot qualify the same destination. External CSS and browser-rendered visibility are not evaluated by this static adapter.
5. An explicit HTTPS link must match the destination host and contain its path within a non-root, slash-bounded scope. No path is invented from the vacancy ID. When nested linked scopes agree, choose the narrowest one. This corroborates the literal linked scope; it is not a vendor-certified tenant/account identity or an independent fraud certification.
6. Persist the observation and derived delegation only while the reviewed parent remains current. Then run the existing exact original-notice identity/reference/deadline checks and independent AI extraction/validation. A corroborated recruitment scope cannot override a different vacancy, missing evidence or semantic disagreement.

A cold successful discovery uses at most four additional GETs: portal robots/notice and corporate robots/page. It follows no page links for further crawling. The probe notice is reused for that attempt's original verification, avoiding another portal fetch. Warm delegation reuse still fetches the current original notice. All request pacing, source pause, machine authority and response-size controls remain active.

## Storage, reuse and revocation

`m0_worker_origin_discoveries` stores private attempt outcomes and observed snapshot references. Successful discovery and warm reuse link into issuer-resolution and original-notice receipts; failures link into ordinary worker exceptions. A probe failure is an unavailable check, not a closed vacancy or proof that an employer is unqualified. Authorization/source fences propagate; if they interrupt observation, no positive proof is committed.

`m0_employer_delegations` holds the current derived observation for a reviewed parent and explicit link. `m0_employer_delegation_versions` preserves immutable observations. Each derived record contains the parent revision/content binding, corporate page and snapshot, exact linked scope, source/revision and observation/expiry times. Its identity is stable across refreshes, while its content hash changes with new evidence. Concurrent valid observations reuse an already-current proof rather than replacing it unnecessarily.

Validity is at most six hours and never exceeds the parent's expiry. Derived records inherit issuer names/aliases but no email-recipient authority or ability to authorize another discovery root. There is no automatic delegation chain: discovery roots come only from explicitly reviewed employer relationships. There is no public/model/CLI command to supply an arbitrary derived proof; native code constructs it from the acquired evidence.

Before subsequent effects, cache use and private drafting, workers check both the derived observation and its current reviewed parent. Revocation, replacement, removal and expiry stop positive use. Already dispatched AI usage is still recorded under the existing accounting rules. New attempts refresh evidence after expiry, retain prior versions and do not reset source allowance. Legacy registry cache keys are preserved; derived contexts add their proof bindings to the cache identity.

The first lookup implementation retains a 30-record-per-host bound. A more selective index is needed for larger shared platforms. These new private collections are discoverable by the local checkpoint exporter; the older historical staging-import manifest is not extended to migrate active derived authority.

## Verification

Six pure authored cases cover visible/narrowest scope, tenant boundaries, hidden/navigation/footer/script/warning content, unsupported root/query links, untrusted hints, unsafe probes, explicit corporate capabilities, unchanged legacy fingerprints, strict proof/index parsing and expiry clamping. Twelve emulator cases cover new ATS discovery and reuse across unseen vacancy URLs, no reviewed ATS registration, unknown corporate identity, wrong links, explicit opt-ins, parent revocation before acquisition and during model work, fresh corroboration after six hours, immutable versions, exact-vacancy conflict, private diagnostics, unavailable probes, cheap closed-notice holds and concurrent publishers converging on one current proof/version.

The positive case reaches two private drafts through one unchanged publisher registration and ingest grant, with one corporate-page retrieval, two portal-notice retrievals and no manual ATS relationship write. Fixtures and identities are authored/simulated; no real employer is qualified and no live accuracy denominator is claimed.

The affected serial emulator run passes **260/260 tests**, including discovery, registry, exact-notice matching, legacy worker policy/execution, source publication controls, fetch safety and publication previews. The final focused run passes **12/12 worker cases**, adding the concurrent-publisher assertion; the final **6/6 pure cases** also pass after long-URL/scope boundary fixes. These runs overlap and their counts are not added together. Contract build/typecheck and all **five staging guard tests** pass. The full catalogue suite is not rerun; no clean full-suite baseline or fix for the prior suggestion-route failure is claimed.

The final rebuilt local worker image runs as `node` and passes network-disabled checks for discovery-module packaging, explicit corporate links, warning rejection, parent-bound expiry, strict proof parsing and long-URL evidence bounds. Disabled launcher activation remains rejected; the image is not deployed. Changed-document local-link and Git whitespace checks pass. Private logs and verification receipts remain in ignored `.artifacts/groq/origin-discovery-2026-10-29/`.

## Remaining work and operating state

Authoritative onboarding of wholly unknown corporate identities remains open. It needs supported independent evidence or authoritative-directory acquisition; adding every employer manually is not the intended final system. More corporate/ATS layouts, indirect notice discovery, email/manual-method corroboration, cross-publisher deduplication, reset-aware source-budget deferral, queue/watch scale and representative automatic-publication qualification also remain open. Literal scope/link matching can hold legitimate sites, particularly custom root-host career portals and query-driven tenant pages.

No provider calls, cloud writes, live authority registrations, source migrations, grants, quota resets, publication or deployment are performed. Hosting remains undeployed at the founder's request, staging launcher admission remains unchanged and the new lane is shadow-only. Existing human reviewer controls remain separate. The earlier intermittent suggestion-route failure remains unresolved.
