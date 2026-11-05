# Durable private refresh cycles and restart integration

5 November 2026. Follow-up to the live source cutover. The fast shadow runtime now has an explicit private-refresh option for notices it has already validated. It is not enabled against staging, and the 21 imported historical notices remain held.

## Entry and restart rules

Use `worker:fast --enable-shadow <source-id> <source-revision> --refresh-private` with the existing verified machine identity, ingest-only source grant and Gemini authority where applicable. Defaults remain unchanged without the flag. The launcher/runtime checks the refresh query before discovery. No identity, grant, quota or public publishing role is provisioned by this command.

First activation creates a source/revision-bound feature marker and refuses live notice/poll ownership or any pre-existing completed fast work that lacks this adoption. It does not backfill old completions or release imported history. Once activated, subsequent ingestion transactions require the matching refresh option, including after restart; a misconfigured old launcher cannot silently stop maintenance. Source revision changes still require separate reviewed reconciliation. The staging source has no feature activation marker or running worker.

## Watches, generations and canonical records

Successful private drafting atomically commits its coordinator completion and a watch bound to the actual canonical draft, completed execution and coordinator JSON hashes. Watch timing comes from the committed verification decision's `nextCheckAt`, including the existing TTL, deadline or undated-window boundary. A failed watch write rolls back the draft/completion; accepted model charges survive.

Due watches are admitted in bounded transactions under existing ownership, authority and fetch/model controls. The scheduler rechecks the same unreviewed private draft, completed execution, notice identity and active capacity before archiving the previous coordinator/watch metadata and creating the next cycle. Previous execution rows stay unchanged. Canonical opportunity IDs, creation times and earliest observations are retained. Global lease-attempt counts remain cumulative; retry/deferral counters remain scoped to the particular cycle. A new cycle is available only after a validated completed cycle, never by aging failed evidence or resetting an imported hold.

The new execution obtains fresh publisher/original evidence through the normal worker and re-runs current gates. Valid unchanged inputs reuse existing model caches; changed inputs use the normal new cache bindings and shared charge reservations. There are no cache aliases or source/provider-budget resets. Natural quota waits resume the same cycle and cached stage after restart.

Manual edits/review, public/withdrawn records and altered historical bindings block the relevant watch. Draft/execution/archive bindings are checked again before each refresh effect, so an edit during a model request fences later cache/draft writes while retaining the admitted charge. Lease renewals drain before recording such a hold. Expired owners recover the same cycle; one generation is not created per retry. Closed or semantically rejected evidence remains held and does not renew the old draft.

## Fairness and measurement

Transactional claim counters persist the three-new-admissions/one-due-refresh order across competing workers. Selection remains advisory and all actual claims share the existing slot/pacing/authority controls. Other admitted work can continue around a watch blocked for review. Active queue capacity remains 500 per source, with bounded watch batches of at most twenty.

Refresh cycles retain their original first-seen time and are excluded from initial-discovery latency percentiles. Current refresh wait/hold counts are separate. No private marker establishes public visibility, production throughput, broad source coverage or a publishing SLO. Historical admission and failed-evidence review remain separate work.

## Staging preparation and verification

The exact due-watch query initially requires a composite index. The matching staging index on `m0_ingestion_refresh_watches` (`sourceId`, `state`, `nextAt`, ascending, collection scope) is created, observed **READY**, and verified with an actual read-only query. Only index infrastructure is changed: source revision 5, its two-call allowance, user/worker access and the private/public catalogue are not activated or modified by refresh code. Raw index/provider responses remain private under `.artifacts/`.

Verification: **289/289 affected emulator checks passed**, followed by **22/22 final focused checks**, including the final lease-renewal drain refinement. Authored cases cover repeated cycles, canonical identity and creation time, archive retention, unchanged/changed cache inputs, quota-reset resumption, closure and semantic holds, concurrent scheduling/fairness, mid-request edits, atomic rollback, lease recovery, query refusal and actual runtime restart/automatic dispatch. No real source/model calls are used by these tests.

An independent staging readback confirms source revision 5, all 21 imported historical notices still held, zero active fast jobs or worker grants, restored reviewer-only access and zero IAM delegations. Retained non-source collections, model charges/caches and the two-call daily source allowance remain unchanged: six private drafts, zero public records. Private proof remains ignored under `.artifacts/`.

Next: reviewed adoption of legacy/cached historical state and source revisions, durable attached machine operation, regularly refreshed private read surfaces, sufficient qualified capacity and a real mixed-batch automatic-publication/freshness demonstration. No worker or public publisher is started by this sprint.
