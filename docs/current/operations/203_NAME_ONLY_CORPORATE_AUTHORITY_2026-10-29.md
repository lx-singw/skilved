# Name-only corporate anchor lookup

29 October 2026 (SAST). The shared shadow origin-discovery path can now use an exact organization name when a supported original JobPosting supplies no corporate URL. The name is a bounded lookup hint into already-reviewed corporate authority, not permission to guess a domain or qualify a new employer. The reviewed corporate careers page must still link back to the exact supported recruitment scope; original-vacancy and [deadline checks](202_ORIGINAL_DEADLINE_EVIDENCE_2026-10-29.md) still follow before AI.

## Lookup and authority boundaries

Supported JobPosting identity is parsed before creating the hint. A missing organization URL yields `host: null` and an `organization_name` hint; an explicit valid URL keeps the existing `structured_url` path. Invalid or conflicting supplied URL claims remain unsupported and cannot be discarded to fall back to a preferred employer. Names are bounded to the issuer-route limit and normalized by NFKC, whitespace and case. No substrings, fuzzy company matching, guessed domains, search-engine trust or per-vacancy selectors are added.

Only relationships with an explicitly reviewed `delegationPage` receive derived, versioned name/alias index keys. Runtime lookup uses one indexed query capped at 31 rows and refuses more than 30. Current state, review/expiry, apprenticeship scope, exact normalized name/alias and an explicit delegation page must leave exactly one anchor. Unknown, ambiguous, revoked, expired, future or unsupported authority remains held. ATS registrations without a delegation page do not become corporate roots merely because they share a name.

Once selected, the existing parent-dependent acquisition and delegation checks apply: safe original probe, robots/pacing, current parent fences, fixed reviewed corporate page, visible supported careers backlink and narrow explicit non-root scope. A matching name without the backlink cannot qualify a destination. Six-hour bounded reuse, parent expiry/revocation, exact-vacancy checks and cleared email authority remain unchanged. Optional acquisition and the shadow-only activation boundary remain enforced.

Private origin receipts record `issuer_hint_v2` and the hint method. The corporate delegation proof remains `corporate_delegation_v1`: the final proof still derives from the same reviewed parent and corporate backlink. A new name lookup changes how a candidate anchor is found, not what qualifies its delegation. Coverage reports advance to v3 and distinguish hint availability/method from authority qualification.

## Existing records and metadata backfill

New registrations/updates generate the name index automatically. `readRelationship` accepts exactly the complete legacy route/email index or the complete current derived index, while rejecting corrupt or partially forged index data. Relationship JSON, revisions and authority fingerprints are unchanged; old URL-based discovery and pinned authority continue to work without a backfill. Legacy records do not silently participate in name lookup until their metadata is updated. Workers never scan the registry to compensate for a missing index.

The private operator command `employer-relationship-reindex` takes a `bindings` array of **1–30 unique current `{id, revision, hash}` tuples** and an audit reason. Use the normalized relationship fingerprints from the existing registry tooling; do not invent hashes. It requires a current Firebase identity with the source role and checks every tuple atomically. Missing/stale/corrupt records abort the entire batch. The command updates only `routeKeys`, retains the exact JSON bytes and appends an audit record. Repeating a current batch is idempotent for lookup metadata, with a new audit record of the request.

The action does not create authority, raise a revision, change aliases/routes/review/expiry, alter historical versions, refresh trust, or modify sources, grants, budgets, calls or public data. Batches can be selected from the existing bounded operator queue and processed separately. No live backfill is performed in this sprint.

## Evidence and limitations

Authored worker cases exercise literal-organization Microdata without a URL: a reviewed parent plus its backlink yields private drafts for two notices, with one corporate-page retrieval and reused delegation. Unknown names, two current roots sharing a name, invalid explicit URLs, absent/incorrect backlinks and parent revocation during acquisition stop before AI. Existing structured-URL, exact-vacancy, optional-crawl, reuse/expiry, concurrent-discovery, quota and privacy cases remain covered.

Index tests cover normalization and reviewed aliases, bounded lookup, legacy/current index validation, fingerprint stability and atomic backfill. Emulator cases verify current source-role authorization, exact preconditions, invalid/duplicate/oversized batches, idempotence and preserved JSON, versions, grants and spent budgets. Revoked/expired/future authority is excluded; capacity overflow fails closed.

All **276 affected tests pass**: 94 parser/resolver/policy/coverage/staging cases and 182 emulator registry/index/discovery/worker/undated-v2 cases. Contract compilation, changed-document local links, Git whitespace and the frozen normal-worker replay also pass. The rebuilt worker container runs as `node` and passes network-disabled checks for name hints, invalid-URL rejection, stable legacy bindings, the bundled reindex API and disabled activation. No container is deployed.

The same frozen first-ten RecentJobs cohort and input fingerprint are retained. Its sole supported portal now supplies an organization-name hint. In normal worker replay against an intentionally empty authority registry, its origin reason advances from `ISSUER_HINT_UNSUPPORTED` to `CORPORATE_AUTHORITY_UNQUALIFIED`. This is clearer coverage, not employer approval: all ten notices still remain held before AI, with no candidates, decisions, drafts, public records or model calls/budgets. The previously measured South African calendar-date disagreement also remains unresolved.

The saved responses are replayed under one publisher/grant in an emulator; no fresh source retrieval, live corporate authority creation, provider calls or staging writes occur. Source bodies, private comparisons, receipts and logs remain ignored under `.artifacts/groq/name-authority-2026-10-29/` and `.artifacts/shadow/`. The full catalogue suite is not rerun; the previously noted intermittent suggestion-route failure remains open.

Wholly unknown corporate authority still needs a supported onboarding path. Broader real-source qualification, exact email/intake corroboration, missing vacancy bindings and conflicting dates remain open. Automatic verified publication stays unqualified and disabled; hosting remains undeployed at the founder's request. Provider exhaustion history, source allowances and live grants remain unchanged.
