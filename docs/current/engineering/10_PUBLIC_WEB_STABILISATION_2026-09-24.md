# Public web stabilisation — 24 September 2026

Status: implemented and locally checked B01/S01 foundation slice. **B01, S01 and M0 are not complete; nothing was deployed.** This follows the [bounded baseline audit](09_BASELINE_AUDIT_2026-09-24.md) and [operational refinements](../governance/08_OPERATIONAL_REFINEMENTS_2026-09-24.md). The six-category scope, free consumer service and later career, agent, network and institutional ambitions remain accepted.

## Result and preservation

The web application now builds with a deliberately empty public catalogue. Home and About explain that listings and personal features are being prepared. Navigation no longer invites users into unfinished sign-in, profile or application flows. Public metadata no longer promises verified profiles or automatic four-hour updates; indexing remains disabled until release readiness is reviewed.

Earlier UI, five substantive prototype API handlers, synthetic opportunity records and unused loading/layout/preview files are preserved under `apps/web/prototype/`. They are outside the Next app directory and explicitly excluded from web lint/type checking. Their earlier relative imports are historical references, not a promise that the prototype runs independently. Reusing them requires review against current contracts. Source lint rejects direct imports of prototype and agent-execution code into the public web app. This guard is not a sandbox or a complete dependency/security audit.

The duplicate home-page entry was removed. The two direct web type errors identified in the baseline were fixed: related opportunities now receive the opportunity object, and unknown closing dates are handled after the unrestricted-window early return. Next route types regenerate before standalone type checking so stale removed-route types do not block it. Remote Google font imports were replaced with system font stacks, removing font-download dependence from the build.

## Reviewed app route inventory

This inventory covers the current `apps/web/src/app` entry points and their production-server HTTP behaviour, not agent/admin services or deployed cloud resources.

| Route | Current behaviour |
|---|---|
| `/` | 200; preparation status, no published listings, all six planned categories |
| `/about` | 200; ambition, free consumer service and explicit unavailable features |
| `/opportunity/[slug]` | 404 while no reviewed record exists; includes old fixture slugs |
| `/api/health` GET | 200 with process-liveness information only; no database/worker readiness claim |
| `/api/opportunities` GET | 200 with `status: preparing`, count zero and an empty list; no crawl, inference or publication side effect |
| `/api/profile` GET/PATCH | 404, unavailable; no shared demo-user reads or writes |
| `/api/documents/verify` POST | 404, unavailable; no fabricated verification |
| `/api/applications/pre-flight` POST | 404, unavailable; no agent execution |
| `/api/passport/upload-cv` POST | 404, unavailable; no upload or profile generation |
| `/api/save`, `/api/career`, `/api/apply`, `/api/events`, `/api/agent-apply`, `/api/permissions`, `/api/feed`, `/api/webhooks/whatsapp` GET/POST | 404, unavailable |
| `/api/auth/whatsapp/send-otp`, `/api/auth/whatsapp/verify-otp`, `/api/auth/[...nextauth]` GET/POST | 404, unavailable; no authentication or messaging |
| `/api/opportunities/[id]` GET/POST | 404, unavailable; no detail or write API is implemented yet |

All 16 unavailable handlers return the same `FEATURE_UNAVAILABLE` JSON with `Cache-Control: no-store`; they do not parse request bodies. The two available API responses are also marked `no-store`. Methods not exported are left to Next's HTTP handling; this does not add support for them.

Former `/profile` (including edit and username), `/career-profile`, `/career`, `/onboarding` (including qualifications and notifications), `/auth/signin`, `/auth/signout`, `/auth/verify`, `/applications`, `/apply/[opportunityId]`, `/permissions`, `/saved`, `/privacy` and `/terms` pages are outside the routed app. Requests return 404. The already-missing `/auth/signup` remains unavailable. Finished legal notices are still release work; prototype notices were not presented as adopted policy.

The generic opportunity Open Graph image endpoint was also preserved outside the routed app. There are currently no metadata-file routes. Next's internal assets and generated not-found handling remain framework-owned. The route inventory test must be updated deliberately when adding app routes or previews.

An initial HTTP regression check found a missing opportunity returning 200 with not-found content because a loading boundary had already begun streaming. Removing the root/detail loading boundaries produced actual 404 responses; the test asserts the HTTP status as well as absence of prototype content.

## Reproducible selected checks

Environment: existing Ubuntu WSL checkout at `/home/lx_singw/projects/skilved`; Node `v22.22.0`, pnpm `9.0.0`, installed Next `15.5.19`, TypeScript `5.9.3`. Added web-local ESLint 9, `@eslint/eslintrc` 3 and `eslint-config-next` `15.5.19`; the pnpm lockfile records the installation. No clean-room install, framework upgrade or dependency vulnerability assessment is claimed. Installation reported an ESLint 9 deprecation warning; lint runs successfully with the selected Next 15 configuration. Reassess support together during dependency maintenance.

Run from the repository root, in this order:

```sh
NEXT_TELEMETRY_DISABLED=1 pnpm web:lint
NEXT_TELEMETRY_DISABLED=1 pnpm web:typecheck
NEXT_TELEMETRY_DISABLED=1 pnpm web:build
NEXT_TELEMETRY_DISABLED=1 pnpm web:test
```

| Check | Observed result |
|---|---|
| `web:lint` | Exit 0; ESLint CLI, zero warnings allowed, no interactive setup |
| `web:typecheck` | Exit 0; generated Next route types and `tsc --noEmit` |
| `web:build` | Exit 0; production compilation, lint/type validation, page generation and traces |
| `web:test` | Exit 0; 21 tests passed, none skipped |

`web:test` requires a current production build. It starts that build on an ephemeral loopback port, waits for its health endpoint and stops its own server afterwards. Tests enumerate current page/API/metadata entry points; exercise the 16 unavailable APIs with their declared methods and valid/malformed write bodies; check empty discovery, old private URLs and fixture detail URLs; inspect public copy and shipped page scripts for known sample records. They use synthetic request data and do not call source sites, send messages or operate cloud resources.

Build-reported first-load JavaScript is approximately **114 kB for Home/About**, **115 kB for the currently unavailable detail route**, with **102 kB shared**. These are Next build figures, not measured full page transfer, phone usability, cold/repeat network cost or an accepted performance budget. No browser visual, assistive-technology or real-user task review was performed in this slice.

Next reported loading the existing `.env.local` during build. Its contents were not inspected or copied. The current public handlers do not use cloud credentials. No setup/provisioning scripts, live source ingestion or production data operations were run.

## Scope of evidence and remaining work

The original all-workspace commands remain separate. Agent package wiring, admin readiness, database implementation and infrastructure access-rule findings from the baseline are not repaired or certified by scoped web success. No GitHub CI workflow, deployed configuration or complete security assessment is established here. Existing unrelated edits and research/output files were preserved. All 29 moved prototype source files were compared with their original Git HEAD content, allowing only line-ending normalisation; all matched. The four affected implementation/status documents passed 94 local-link checks and a trailing-whitespace check.

| Next work | Completion evidence still required |
|---|---|
| Remaining B01 | Deployment boundary and configuration inventory, usable source-to-action prototype, measured phone/network/cost budgets, remaining-effort reforecast |
| B02 | Shared six-category domain contract, both internship subtypes, explicit unknowns, source/check records, reviewed public projection and contract tests; old web/shared opportunity types are still not the accepted complete contract |
| First B03/B04 demonstration | Permitted real source, review/publication, faithful detail/checklist, original-source handoff and correction/closure path |
| Remaining M0 | Useful representative catalogue; local continuity and loss notices; public checklist export/share; reviewed link intake; issuer/shelf experiences; operations, accessibility and release evidence |

The empty catalogue is an honest interim state, not a scope reduction or launch substitute. Restoring prototype data to make the site appear populated would invalidate this boundary. The [delivery plan](../planning/03_M0_COMPANION_DELIVERY_PLAN.md) and [M0 acceptance cases](../quality/02_DISCOVERY_COMPANION_ACCEPTANCE.md) still govern completion. No measured labour total or new launch date follows from these checks.
