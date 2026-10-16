# Native local-progress loss and recovery

16 October 2026. B05-5b follows [bounded public-read recovery](87_BOUNDED_PUBLIC_SUMMARY_RECOVERY_2026-10-16.md) and completes the current scoped local packet sequence in the [B05 plan](../planning/12_B05_LOCAL_CONTINUITY_IMPLEMENTATION_PLAN.md). Formal B05/user/device acceptance remains open.

## Change and checked result

The browser notice now distinguishes an incompatible document format from unreadable data. Neither is silently reset or described as an empty saved list. Save stays disabled while data cannot be read. The existing saved-list clear/cancel controls remain the deliberate recovery path; an unavailable native database does not offer an unsafe reset.

Final lint, typecheck, production build and **all 89 web tests pass**, with no skipped tests. The existing UI regression now checks both unreadable reasons, disabled save and unavailable storage without false empty/success/reset controls. Storage/contract/server implementations are unchanged; earlier atomic transaction, quota/abort and strict-contract evidence is credited rather than rerun reflexively.

**Nineteen actual synthetic browser checkpoints** use visible controls on a private loopback fixture page, exercising the real browser IndexedDB and actual Skilved component/session/adapter. No storage was mutated through hidden browser evaluation. The test origin was observed empty before creating disposable records.

| Behavior | Actual observation |
|---|---|
| Native database deletion with stale tab | A tab still displaying Applied attempts Preparing after the progress database is deleted. The actual write reports conflict. Reloads show empty; the record does not reappear. A deliberate fresh save then works. |
| Incompatible document | A schema version 99 synthetic document survives app reads, reload/new tab and cancelling clear byte-for-byte. UI explains the different format, disables save and makes no empty/success claim. Confirmed scoped clear commits a readable empty document. |
| Malformed document | The exact malformed string survives reads/reload with its own explanation. Explicit clear recovers empty. |
| Native database unavailable | Raising the database to native version 2 causes the app's version 1 open to fail honestly. Its existing document/version remain unchanged and no clear control is offered. Deletion through the private fixture repairs the test environment; the product did not reset it. Reload/fresh save then resumes in another tab. |
| Scoped clear | A separate synthetic receipt-sentinel database, a test localStorage preference and a synthetic CacheStorage entry survive progress deletion/reset. These test sentinels do not establish a production receipt implementation. |
| Cache independence | Deleting only synthetic CacheStorage leaves the exact native progress document unchanged. This is not a browser HTTP-cache or OS site-data settings test. |
| Layout and cleanup | Actual 375/1280 viewports fit document widths 375/1280. The mobile view shows incompatible-format explanation and explicit scoped confirmation. All synthetic saves/sentinels and owned tabs were cleaned, viewport restored and local services stopped. |

An initial viewport request affected a different tab and returned 1280; it was not accepted as mobile evidence. The actual 375 view was positively measured after selecting a new test tab. No product correction or acceptance change was needed after verification.

Private fixtures, logs, checked hashes, raw synthetic storage observations, DOM/results and screenshots stay ignored under .artifacts/sprint-loop/b05-loss-2026-10-16/. The harness uses the existing ignored local environment with reads explicitly routed to a demo emulator; the control page is served only by the private loopback proxy and is not a product route or committed asset. No issuer destination was visited; its synthetic guard smoke redirect was not followed. No provider, source-permission, publication or deployment action occurred.

## Local disposition and remaining acceptance

B05 now has scoped local implementation/evidence for explicit save/resume, reversible stages, independent route actions, current revision/status recovery, alias/reversal preservation, deliberate stage reconciliation, bounded public reads, scoped clear and native database loss/unreadable recovery. This is local engineering evidence, not full formal B05 acceptance.

Still unperformed: full browser-process restart, OS/browser-settings site-data deletion or eviction, actual browser HTTP-cache clearing, power-loss durability, physical-device/network/assistive-technology checks and participant observation. Native quota/abort failures remain controlled adapter tests rather than an exhausted physical browser disk. Keep these acceptance items and G0/G1/G2/source/held-out/seasonal/operations/release gates open.

Next independent authorized work is B06 planning/reconciliation against the existing URL suggestion, safe-fetch, queue, capability/receipt, withdrawal and retention boundaries. B06 intake must stay disabled until its controls and real review capacity are evidenced. No participant, source permission, funded operation or release authority is supplied by this packet.
