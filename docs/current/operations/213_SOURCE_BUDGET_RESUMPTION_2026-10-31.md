# Durable waits for the source's daily model allowance

31 October 2026. Follow-up to the [real original/validation canary](212_REAL_ORIGINAL_AND_VALIDATION_CANARY_2026-10-31.md), within the [autonomous system target](../engineering/17_AUTONOMOUS_OPPORTUNITY_SYSTEM.md).

## Result

A normal worker job that reaches its source's daily model ceiling now stays pending in the durable queue until South African midnight. A subsequent authorised worker tick can resume the same job and reuse valid cached stages. Exhaustion no longer requires a human to reopen that new job from the exception queue.

This is worker behavior, not a deployed timer. Hosting and scheduling remain off. Existing exception records, including the real canary's negative semantic assessment, are not reopened or rewritten. No fresh successful AI extraction or private draft is claimed by this sprint.

## Admission and retry accounting

Only the worker's own rejected source-budget reservation creates a source-reset wait. A provider or injected validator cannot obtain that behavior merely by returning `MODEL_BUDGET_EXHAUSTED` as an error label. Source admission still checks machine grant, source revision, pause and lease rules. A blocked reservation creates no model-call receipt and charges no provider/source request.

The job retains `sourceBudgetWaits` and its pending `sourceBudgetResetAt`. Its `nextAt` is the exact next South African midnight, rather than a minute retry or exception. If that reset passes while failure persistence is finishing, it becomes immediately eligible without an added minute delay. Calendar tests cover exact, month, leap-year and year boundaries.

Daily waits do not consume the three ordinary failure attempts or the separate Gemini model-window allowance. Actual retrieval/provider failures keep their existing bounds. Corrupt counters and reset metadata cannot bypass admission. Claiming a released job clears its active budget-wait marker/error while retaining the wait count as history.

The source budget is checked before model availability/fallback processing. Gemini's shared usage and exhaustion holds are not reset, refunded or copied into a new pool. Once the source renews, a still-active provider hold independently defers work until its own release. Provider-day renewal alone cannot release an exhausted source allowance.

## Progress and safety

Source collection/preflight still runs on a job's first visit; admission defers only newly required model work. Already completed cache-only work can finish even when the source has no calls left. Waiting jobs cannot be claimed early across restarts, so repeated ticks do not repeatedly fetch their notices or attempt model requests.

On resumption the normal source, original-evidence, freshness, expiry, material-fact and validation checks still run. A notice that has closed remains held without a validation call. Revoked grants and paused sources remain blocked. A previously published action remains restricted while its changed-source recheck waits; old verification is not renewed merely by deferral. Completed programme siblings and cached partial extraction remain retained.

## Verification and live boundary

The worker/resolver/origin/undated/time regression passes 192 tests, with zero failures/skips. Two additional targeted checks pass for same-job employer-evidence refresh and programme-sibling resumption, giving 194 distinct checks. Focused coverage also verifies exact reset boundaries, multiple days/jobs, preserved ordinary failure limits, rejected malformed metadata, independent Gemini holds, cache-only completion and restriction of a previously published action.

Worker and web images build locally, including web compilation/typechecking/page generation. Network-disabled checks as `node` compare both changed production-module hashes, verify exact SAST reset boundaries and reject disabled runtime/launcher activation. Verified images are tagged locally; neither is deployed. All six documentation files pass a 202-link check.

The current staging source was read without mutation: two calls spent against its two-call ceiling on source day 31 October. A private bounded plan requires fresh V29 extraction and V17 validation, the same source/revision/authority and unchanged ceiling, no publication, and no more than two real calls after **00:00 SAST on 1 November 2026**. Preparing that plan queues no cloud job, schedules no retry and grants no identity access.

There are no new native notice acquisitions, provider requests, source/grant/authority changes or quota writes. The live positive-draft milestone from the previous sprint remains open. Publisher-wide acceptance, original-method coverage, deployed orchestration and automatic-publication qualification remain ahead; employer crawling stays optional.

Private test/build logs and the prospective plan remain ignored under `.artifacts/groq/source-budget-resume-2026-10-31/`.
