# Public export current-read and origin boundary

24 October 2026. B07b1 composes the [public formatter](158_PUBLIC_CHECKLIST_WHITELIST_FORMATTER_2026-10-24.md) with explicit public-origin settings and bounded fresh reads. It adds no UI, public route, share/download action, metadata, deployment or live call. No environment values are written.

## Composition

The shared strict HTTPS origin schema is reused by the formatter and a pure server settings helper. Only SKILVED_PUBLIC_ORIGIN is read; the helper exposes a validated origin or null, never the environment or raw errors. There is no default hostname and no request-header-derived origin. The setting's syntax does not establish a deployed/approved domain; actual configuration and release authority remain separate.

Each preparer call makes a fresh GET only to /api/v1/opportunities/{validatedPublicId}, with no-store, omitted credentials, no referrer and redirect rejection. The response must be 200, unredirected JSON with a supported UTF-8 media type, bounded declared/actual body size at 500000 bytes, valid UTF-8/JSON and the strict public detail schema. It never reads browser progress, ticks, annotations or receipt storage. Failure yields only a dated canonical reference; missing/invalid trusted context disables before fetching. No prior preview authorizes a later export action.

The public detail transaction already resolves confirmed aliases and reads the current projection/freshness together in Catalogue.detail. A valid returned canonical ID therefore supplies the formatter context; no personal reference is rewritten. Restricted/closed current results become canonical-only references, and failed/missing/malformed reads retain no old public facts or official destination. The preparer supplies the completion-time UTC copy date explicitly to the formatter.

An eight-second maximum configured asynchronous deadline covers fetch and body consumption, including fetch implementations that ignore abort. Cancellation is best-effort and never awaited to complete the deadline. External cancellation returns no payload. Parsing/formatting inputs are bounded; host scheduling and actual device performance are not measured by these tests.

The reader clears prior output on a new intent and guards both publication and the awaitable action result with sequence/abort/disposal checks. Cancellation/invalidation does not replay a mutation or cache an earlier result. A consumer that cancels during notification also invalidates the result returned to the awaiting action.

## Actual verification

Fourteen new injected fetch/Response/ReadableStream/clock/deferred cases and all 129 web cases pass, together with 52 contract cases and a fresh production build including lint/type checks. They cover strict origin and no-fetch failure, fixed credential-free GET, repeated fresh revisions, canonical alias/status handling, closure/removal/failure, malformed/private response fields, byte/length/UTF-8 limits, stalled fetch/body deadlines, explicit abort, superseding/cancel/dispose and notification-time cancellation. Local-storage access traps and private error/body/environment sentinels remain absent from outputs. These are deterministic composition checks, not new native/emulator journeys.

Initial 13 focused cases had 12 passes and one reproduced oversize-stream cancellation failure: cleanup retained a released reader reference. One bounded correction clears that reference so the unlocked body is cancelled; the unchanged 13 cases then passed. A separate consumer-notification reentry probe under the same original stale-result criterion failed 0/1 because cancellation still returned an earlier payload. That genuinely new diagnostic justified one scoped post-notification sequence check; final 14/14 pass. Both failure logs, corrected results and the first/final build are retained privately. No acceptance criterion was weakened, and neither failure persisted after its correction.

Five corrected code/test hashes and the unchanged backend detail-transaction source comparison are recorded under ignored .artifacts/sprint-loop/b07-current-read-2026-10-24/. The broader backend alias evidence is credited separately; injected canonical responses do not become an observed native alias journey.

## Remaining work

[B07b2](../planning/14_B07_PUBLIC_EXPORT_IMPLEMENTATION_PLAN.md) must inject only safe server origin settings, re-prepare per user intent and integrate preview/copy/download/native share/WhatsApp with honest cancellation/failure states. Current metadata and native sentinel inspection remain B07c/d. A fresh response cannot prevent a later source change or update an external static copy; recipients must open current details. Actual public-origin, source permission, visual/assistive/device/participant, operating and release facts remain open, including the retained B06/G3/M0 holds. Suggestions stay default disabled; preserve all six categories and R0–R5/S01–S35.
