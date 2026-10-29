# Explicit original deadlines and preserved date conflicts

29 October 2026 (SAST). The shared original resolver now decodes a bounded subset of explicitly zoned timestamps, including UTC/GMT legacy values, and records the raw value, canonical instant, written calendar date and derived South African date. It does not infer a timezone or reinterpret a midnight timestamp as the end of the preceding day. This follows [shared Microdata support](201_SHARED_MICRODATA_JOBPOSTING_2026-10-29.md); no employer-specific parser, source registration or grant is added.

## Deadline interpretation

`original-deadline.mjs` accepts valid calendar-only dates, strict ISO timestamps with explicit numeric offsets or `Z`, and a narrow English weekday/month legacy form with an explicit `UTC` or `GMT` zone. Legacy weekdays must agree with the actual calendar. Missing/unknown timezone abbreviations, unsupported offset forms, contradictory weekdays, invalid dates/clocks, leap seconds and unsupported precision remain unresolved. The RFC 3339 unknown-local-offset form `-00:00` is deliberately outside this supported subset. See [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339.html) and the [Java Date serialization description](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Date.html#toString()).

Date-only evidence retains a null instant and the existing closing-day hold; no midnight is invented. A timestamp retains its exact instant and is expired at that instant, including when model work crosses the cutoff. Explicit offset conversion can change its calendar day in South Africa. Both dates and the day-shift flag are retained. A publisher date must agree with the derived South African date; otherwise the identity-matched resolver returns `DEADLINE_CONFLICT`. The written UTC date is not substituted to force agreement.

Only an identity-matched original can be classified closed. URL, canonical/main-entity/item-ID, issuer, title and recruitment-reference checks still precede deadline classification. The new decoder establishes no employer authority, vacancy binding or application-method permission.

## Worker integration and compatibility

Resolver receipts reaching a supported deadline assessment retain versioned `deadlineEvidence`; primary notice text and `identity.validThrough` keep the raw source value. The resolver advances to `original_jobposting_v3`, separating its AI cache keys from the earlier policy. Refresh checks reject prior-policy matches and changed/missing deadline interpretations rather than silently upgrading them. Original immutable receipts remain observations of their acquisition time; expiry during validation stops the later draft without rewriting the earlier receipt or refunding admitted usage.

The shadow draft gate now consumes the pinned interpretation passed by the already-matched original resolver, rechecks it against the raw primary timestamp and requires the record's calendar date to agree. It also checks precise expiry. This is confined to `mode: shadow` with `originalVerification: shadow_v1`. Legacy and automatic publication callers retain their existing ISO-prefix rule, optional employer acquisition and other gates; passing a deadline object cannot activate the broader format there. Programme and undated exceptions retain their existing restrictions.

The first new worker check caught a downstream compatibility hold: the old draft gate rejected a valid legacy timestamp after the original resolver had matched it. The integration now carries the explicit interpretation through the shadow draft gate instead of changing the raw timestamp or removing the date check. Regression cases cover that boundary, forged/mismatched interpretations and the unchanged automatic path.

## Frozen real-source evidence

The same fixed first-ten [RecentJobs cohort](200_REAL_RECENTJOBS_NATIVE_COVERAGE_2026-10-29.md), input fingerprint and saved eligible portal body are reused; there is no fresh source retrieval or selection change. All ten details still parse and one employer representation remains supported. The saved portal timestamp now decodes to **7 November 2026 at 00:00 in South Africa**, while the publisher's extracted date is **6 November**. This is a diagnostic calendar disagreement, not evidence that the original is closed or that its authority was established.

Normal frozen worker replay still stops at `ISSUER_HINT_UNSUPPORTED` / `ORIGIN_UNQUALIFIED` for that portal, before original deadline matching. No issuer approval or vacancy binding is fabricated to reach a later stage. All ten selected notices remain held before AI. The native coverage counts are unchanged; the improvement is supported interpretation and clearer conflicting evidence, not a newly publishable real notice.

The normal replay creates no model attempts/calls/budgets, candidates, decisions, drafts or public records. It replays saved responses under one publisher/grant in an emulator with an empty authority registry. Its response reads are not live GETs. Private source bodies, diagnostics, receipts and test/build logs remain ignored under `.artifacts/groq/original-deadlines-2026-10-29/` and `.artifacts/shadow/`.

## Verification and remaining work

Authored checks cover calendar-only dates, explicit offsets/fractions, UTC/GMT legacy forms, leap years, invalid calendars/clocks, unknown zones, contradictory weekdays, both directions of day shift, host-timezone independence, identity-before-closure ordering, exact expiry and interpretation/policy pinning. Normal worker cases admit two fictional issuers across JSON-LD and Microdata, hold a conflicting rollover and malformed weekday before either model stage, and retain two private drafts. A legacy timestamp expiring during validation produces no draft and retains the two admitted mock calls in the original source-day budget.

All **268 affected tests pass**: 93 parser/resolver/policy/coverage/undated/staging checks and 175 emulator worker/registry/origin/undated-v2 cases, including the full legacy worker regression file. The real frozen replay, contract compilation, packaged worker checks, changed-document links and Git whitespace also pass. The container runs as `node`, is checked with networking disabled and still rejects disabled activation. The full catalogue suite is not rerun; the previously noted intermittent suggestion-route failure remains open.

Reusable employer-authority/vacancy corroboration and exact email/intake verification remain the next coverage priorities. The real date disagreement stays held until supported evidence resolves it. No live source policy, provider quota history, cloud database, grant, publication or hosting state changes. No real provider calls occur; hosting stays undeployed and automatic verified publication remains unqualified.
