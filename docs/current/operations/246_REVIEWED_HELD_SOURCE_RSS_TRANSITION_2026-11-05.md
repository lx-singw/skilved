# Reviewed held-source RSS transition

5 November 2026. A normal Source-role API now supports the initial transition of an existing shadow fast source from HTML to RSS when all its coordinator jobs are held and its workers are quiescent. It archives the replaced revision bindings and preserves original notice identity, age, attempts, history, pacing, model charges and authority. Public publishing and hosting remain off.

## Supported transition and refusal boundaries

`collectRssTransitionSnapshot` reads a bounded, coherent private inventory of the retained legacy/fast pipeline collections. `planRssTransition` requires the exact current Source version, a recent feed-evidence reference and the initial HTML shadow policy. Its only target policy changes are the next Source revision, the explicit `rss_shadow_v1` setting, the advertised feed URL and one-window discovery. The Source ID, model cap, employer-crawl setting, issuer trust and other policies remain unchanged.

The first application requires a current snapshot, inactive worker grants, no live poll/notice/execution leases, no queued work or unfinished executions, and held-only jobs with matching notice identity/history. Completed work, refresh cycles/watches and revision-mismatched jobs require another reviewed adoption; they are rejected rather than silently rebound. Evidence and jobs with future timestamps are refused. A stale, incomplete, oversized or changed inventory cannot apply.

`Catalogue.adoptRssSource` authenticates the real caller and requires the normal Source role. It binds the reviewed hash to the proposed Source and retained inventory, independently recollects that inventory inside the mutation transaction, point-checks changed records and rechecks Source-role expiry before committing. Ordinary Source editing still cannot bypass this operation.

The transaction changes the Source/version and held-job revision bindings, removes the expired discovery cursor and carries any private-refresh feature marker and fairness counter to the new revision. Every replaced/deleted coordinator record is archived with its exact before/after data under the reviewed plan hash. Held jobs stay held; original first-seen times, attempts, deadlines and history/SLO exclusions are not rewritten. Existing poll receipts remain immutable. Slots and fetch pacing are retained, and an unexpired lease must finish naturally before adoption.

RSS polls now use a revision-qualified namespace, so the first RSS poll cannot collide with a retained HTML poll from the same scheduler bucket. A worker pinned to the old revision cannot operate after cutover. The carried private-refresh marker still requires the runtime's explicit refresh option; old historical notices are not released or given new model/execution budgets.

Model budgets, charged-call ledgers, provider usage/exhaustion, caches, authority/handoff records, drafts, public records, grants and original notice records are read-only in the Source transaction. Replay verifies the applied Source/version and immutable transition archives without another mutation or audit write. A failure after queued archive writes rolls back all Source/binding changes atomically.

The operator command is `fast-rss-adopt`, with a private `inputFile`, `expectedSha256` and audit `reason`, using the existing private Firebase token-file mechanism. It creates no role or worker grant. The retained inventory is deliberately broad for this one-source pilot; activity elsewhere in that inventory can invalidate review and require a fresh snapshot. This is not a general migration for concurrently active production sources.

## Verification

The final affected emulator/native run passes **95/95 checks**, with no failures or skips. Coverage includes atomic/concurrent adoption and replay, old-worker fencing, same-bucket poll identity, retained held ages/attempts/history, unchanged model/provider/cache records, failed-commit rollback, Source-role expiry during checks, altered inventories, conflicting archives/versions, direct-edit refusal, RSS discovery/private drafting, refresh and service preparation. Model responses in pipeline tests are authored stubs, not live provider evaluations.

The earlier higher-concurrency fairness assertion from the preceding sprint remains documented in [the RSS integration runbook](245_RSS_TRANSPORT_IN_NORMAL_SHADOW_PIPELINE_2026-11-05.md). This transition does not claim to fix or qualify production concurrency.

## Native preparation and authentication handoff

The read-only staging inventory at **21:32 UTC / 23:32 SAST** contains 779 retained records and 21 held notices. It proposes revision 5 → 6 and 23 archived/rebound records: the held jobs, discovery cursor and private-refresh feature marker. The running grant and live poll lease are correctly reported as blockers. No Source or model record is changed by planning.

The candidate local release freezes **176 owned runtime/contract files**. A native check-only invocation under the existing delegated machine identity succeeds against current revision 5; it performs no discovery, model call or Source activation. Revision 6 must pass its own admission after the Source update, before the prepared service starts.

The existing challenged HTML service is then stopped/disabled and its ingest grant deactivated. Its poll lease is allowed to expire at **21:41:53 UTC / 23:41:53 SAST**. Fresh inventory at **21:41:57 UTC / 23:41:57 SAST** is ready for review, with the Source still revision 5, 21 held notices and no model/publication change. The same bounded IAM delegation remains; inactive application ingest permission fences worker effects.

The private local review page is available at `http://localhost:48740/rss-transition`. It uses a systemd-managed loopback server, explicit Host/Origin/nonce checks, bounded JSON bodies and no-store/CSP headers. Only the existing Source owner's fresh, verified Google sign-in can apply the displayed plan. The page makes its temporary ten-minute Source-role grant explicit, calls the normal reviewed API, restores the exact reviewer-only record and verifies retained quota/draft/public state. It then restores the **same** ingest-only worker grant/expiry, admits revision 6 and starts the prepared frozen service. It does not extend access, create an IAM binding or enable publication.

The original machine/delegation deadline remains **6 November at 19:40:15 SAST**. The inherited two-call source-day cap remains a private-pilot capacity limitation. Genuine sign-in/application, successful revision-6 admission and actual RSS runtime outcomes require their own readback; a prepared page or check-only success is not evidence that the transition has executed.

Private preparation, inventories, evidence and recovery helpers are under `.artifacts/groq/rss-source-transition-2026-11-05/`. `operate-service.mjs --restore-html` can restore the old local service only while the exact revision-5 Source is unchanged. `--stop-restore` stops the local service, restores the original inactive grant and removes only the prior owned conditional delegation; it does not roll back an applied Source revision. Recovery refuses unexpected role/grant changes rather than overwriting another operator's work.

## Remaining delivery work

Complete the genuine Google-authenticated Source update and independently inspect revision 6, role restoration, held history, accounting, keyless service admission and real feed acquisition. Then qualify current notices through the real provider, original application methods and private applicant reads. Feed-window disappearance still holds rather than inventing closure, and long-term refresh/fallback coverage needs qualification. Production capacity, concurrency and a representative automatic-publication acceptance batch remain open; hosting remains undeployed.
