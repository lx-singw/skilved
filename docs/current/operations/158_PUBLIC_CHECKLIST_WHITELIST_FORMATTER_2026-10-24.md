# Public checklist whitelist formatter

24 October 2026. B07a adds one shared browser-safe formatPublicChecklist function for a dated plain-text preparation copy. It builds on the existing strict public projection, requirement-expression formatter and B04 source/check distinctions. B05 public-link copy remains credited; the legacy share helper uses a legacy record shape and is not adopted as this boundary. The [B07 plan](../planning/14_B07_PUBLIC_EXPORT_IMPLEMENTATION_PLAN.md) sequences current-read and UI integration.

## Implemented boundary

The pure function accepts a strict public projection plus an explicit trusted HTTPS origin, public ID and canonical UTC copy time. It returns text, canonical URL, a deterministic public-only filename and checklist/link kind. Invalid context returns null. The module reads no browser storage, personal state, network or implicit clock and has no share/download side effects.

Whitelisted text preserves category and internship context, source-worded experience/residence/practical conditions, deadline wording and ALL/ANY/IF/unknown requirement relationships. Required/preferred/unclear and uncertain states remain visible, alongside instruction citations. Six separate check scopes retain outcome, method, actual check time and a separately labelled proposed next-check time. Copy time and listing update time do not become source-check claims. The canonical detail URL and recorded official portal/email/in-person/post destination are labelled separately. The copy explains that it may become outdated and does not confirm eligibility or submission.

Invalid/missing/restricted/mismatched/closed or application-unavailable inputs yield only a dated canonical reference without old facts or official destination. Future-dated records/checks, expired or missing automatic next-check times and an exact passed deadline also fall back. A schema-valid copy above 64KiB of UTF-8 text falls back as a whole; it never clips a condition or half an alternative. Public wording is plain text with line/control/directional characters normalized so it cannot create a new generated header line.

## Actual evidence

Twelve new contract cases and all 52 contract/inspection cases pass, including all six categories and both internship routes, all route methods, independent expected expression strings, uncertainty and check dates, strict context, failure/closure/freshness/identity fallbacks, Unicode, valid oversized output, private-field sentinels, non-JSON/cyclic data, storage-access absence, determinism and non-mutation. All 115 web regressions and a fresh production build including lint/type checks pass. No browser/share/download or real-source qualification is claimed by these pure tests.

Initial contract compilation identified an overly narrow wording-helper type; it was narrowed to the fields actually read. Initial 51 contract cases passed. Focused review then reproduced a rejected aggregate object's 1601428-character full encoding allocation; the affected regression passed 11/12. One targeted coarse character/node/depth/cycle/sparse-array preflight correction now stops that input before full serialization while preserving the strict JSON/UTF-8 validator. The unchanged independent probe's largest encoding call is 94 characters, and the final 12 focused/all 52 contract cases pass without failures or skips. Before/after probes and logs remain private under .artifacts/sprint-loop/b07-formatter-2026-10-24/.

## Remaining integration and acceptance

Callers must fetch current authorized public facts before every preview/action and supply trusted origin configuration. The formatter cannot prove source truth, detect a still-public-looking cached record that has since been withheld, or classify private material mistakenly approved into public wording. Current-read/deadline/sequence recovery, preview/copy/download/native share/WhatsApp actions, metadata and native browser sentinel inspection remain B07b/c/d. No public route, UI or deployment is activated. Actual source/device/participant/operating/release gates, including the retained B06 holds, stay open; all six categories and R0–R5/S01–S35 remain in scope.
