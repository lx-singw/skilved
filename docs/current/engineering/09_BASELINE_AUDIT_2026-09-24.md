# Bounded technical baseline audit — 24 September 2026

Status: observed local evidence for B01/S01, **not completion of either work package or release approval**. Repository HEAD: `8b63db9`. Inspection and commands used the existing Ubuntu WSL checkout at `/home/lx_singw/projects/skilved`, launched from Windows PowerShell.

## Scope and preservation

Read `CLAUDE.md`, the current documentation index, developer workflow, decisions/assumptions, product requirements, build roadmap and M0 delivery plan. No `AGENTS.md` was found in a repository search that excluded `.git` and `node_modules`. Reviewed manifests, selected critical routes/components, shared schema, source scaffolding and access rules. This is selective static inspection, not an exhaustive route/security audit or browser usability review.

Before work, 13 tracked files were already modified: the archived scout-source document and manifest, `docs/current/governance/documentation-check.json`, and ten scripts under `scripts/setup`. Untracked `output/` and `research/` directories were present. They were preserved. This audit adds only this report; it does not repair application code, alter dependencies or run setup scripts. Commands may write ignored TypeScript/Turbo caches.

No dependency installation, server startup, provisioning, deployment, cloud-resource inspection, credential access or real-data operation was performed. The initial overly broad parent-directory instruction search was interrupted and replaced with a bounded repository search. All started check commands exited; no build/service process was started or left running.

## Runtime and manifests

| Item | Observed evidence |
|---|---|
| Runtime | `node --version` → `v22.22.0`; `pnpm --version` → `9.0.0` |
| Root requirement | `package.json`: Node `>=20`, `packageManager: pnpm@9.0.0` |
| Existing dependencies | `node_modules` present; no clean install reproduced |
| Actual Next/TypeScript | `pnpm --filter @skilved/web exec next --version` → `Next.js v15.5.19`; `pnpm --filter @skilved/web exec tsc --version` → `Version 5.9.3` |
| Lockfile | pnpm format `9.0`; resolves Turbo `2.9.18`, Next `15.5.19`, React/React DOM `19.2.7`, TypeScript `5.9.3` in inspected application importer |
| Workspace | Web, admin, 12 agent packages and five shared packages; Turbo reports 19 workspace packages |
| Application scripts | All 14 application manifests expose `next dev`, `next build`, `next start`, `next lint`, `tsc --noEmit` |
| Shared package scripts | No scripts in the five shared package manifests; root `typecheck` does not independently typecheck all shared-package source |
| Tests/CI | Root has `turbo run test`, but no workspace manifest defines a test script; no tracked `*.test.*`, `*.spec.*` or `.github/workflows/` file found |
| Dependency wiring | Agent manifests import shared types in source but do not declare `@skilved/types`; only the database manifest declares that workspace dependency |

The manifest ranges (`Next ^15.1.0`, `React ^19.0.0`, `TypeScript ^5.7.2`, `Turbo ^2.0.0`) are not the installed versions. No vulnerability or latest-version claim is made.

## Commands and exact outcomes

Commands below ran from the repository root in Ubuntu. `TURBO_TELEMETRY_DISABLED=1` and `NEXT_TELEMETRY_DISABLED=1` were set for checks.

1. `TURBO_TELEMETRY_DISABLED=1 NEXT_TELEMETRY_DISABLED=1 timeout 90s pnpm typecheck`
   - Exit **1** after Turbo reported **15.22 seconds**; `7 successful, 14 total`, `5 cached, 14 total`.
   - Scout, quality, matching and analyst emitted `TS2307: Cannot find module '@skilved/types' or its corresponding type declarations.`
   - Failed task reported: `@skilved/agent-scout#typecheck`. Turbo stopped on failure; neither all-package success nor full fresh execution is established.
2. `TURBO_TELEMETRY_DISABLED=1 NEXT_TELEMETRY_DISABLED=1 timeout 45s pnpm --filter @skilved/web typecheck`
   - Wrapper exit **1**; TypeScript child exit **2**. Nine diagnostics:
   - `src/app/api/applications/pre-flight/route.ts(2,44)` and `(3,36)`: `TS2307`, unresolved application/pre-flight and skills-profile/builder relative imports.
   - `src/app/api/documents/verify/route.ts(2,43)`: `TS2307`, unresolved document-verification/verifier relative import.
   - `src/app/api/opportunities/route.ts(2,29)`: `TS2307`, unresolved scout/runner relative import; `(15,44)` and `(20,44)`: `TS7006`, parameter `o` implicitly has type `any`.
   - `src/app/api/passport/upload-cv/route.ts(2,36)`: `TS2307`, unresolved skills-profile/builder relative import.
   - `src/app/opportunity/[slug]/page.tsx(34,43)`: `TS2345`, string argument not assignable to `Opportunity`.
   - `src/lib/matching.ts(46,29)`: `TS2367`, comparison between `"this-week" | "this-month"` and `"any"` has no overlap.
3. `TURBO_TELEMETRY_DISABLED=1 NEXT_TELEMETRY_DISABLED=1 CI=1 timeout 20s pnpm --filter @skilved/web lint </dev/null`
   - Exit **1**. `next lint` warned it is deprecated and displayed `How would you like to configure ESLint?`.
   - No lint analysis completed. No configuration option was selected or dependency installed. `packages/config/eslint/index.js` is empty.

**Build not run:** typechecking already fails, and the web layout imports three `next/font/google` families. A normal build may fetch fonts; no network-dependent build was attempted in this bounded audit. Consequently there is no successful build, standalone artifact, runtime or deployment claim. **Tests not run:** no workspace test script or tracked test suite was found; root Turbo tests also depend on build. No new tests were written for this evidence-only change.

## What exists, and what it actually establishes

| Surface | Static observation and implication |
|---|---|
| Discovery UI | `apps/web/src/components/feed/FeedClient.tsx` implements filters and card rendering. `apps/web/src/lib/opportunities.ts` explicitly describes a mock dataset. Reusable UI exists; real inventory and browser functionality were not demonstrated. Feed labels say “live”, and layout metadata says AI updates every four hours despite no corresponding operational evidence. |
| Category contract | Web `constants/opportunityTypes.ts` and shared `packages/types/src/opportunity.ts` contain apprenticeships, learnerships, bursaries, jobs, trade tests and short courses. **Internships and graduate programmes are absent**, including both required internship subtypes. Six entries are not the six accepted M0 categories. Web uses hyphens where shared types use underscores in several enum values. |
| Source fidelity | `apps/agents/scout/src/runner.ts` defaults unidentified province to Gauteng, assigns the same N2/N3/Grade 12 qualifications, selects a fixed Transnet email whenever text contains `@`, and marks discoveries `published`/`active`. The inspected PuffAndPass crawler returns a hardcoded array. This does not establish permitted live crawling, reviewed publication, truthful requirements, deduplication persistence or rechecking. |
| Opportunity API | `apps/web/src/app/api/opportunities/route.ts` constructs a scout and calls discovery on GET; its relative import fails typecheck. Public retrieval and private review/publication work need separate boundaries. |
| Save/resume | Card Save links to `/auth/signup`; no corresponding signup page was found in the tracked web pages. `/saved` says “Coming soon.” `/api/save` returns 501. Device-local M0 continuity is unimplemented on these paths. |
| Share/handoff | `ShareButton.tsx` constructs a WhatsApp URL and opens it. `utils/whatsappMessage.ts` hardcodes `https://skilved.com`. Cards contain outbound apply links. These are reusable interaction code, not evidence of message delivery, an application submission, valid current source URLs or configured deployment origin. |
| Authentication/profile | Auth route and auth library are stubs. `/api/profile` GET/PATCH operate on shared `DEMO_USERNAME`; PATCH passes request JSON to an in-memory store without authentication or a runtime allowlist. No private owner separation or durable persistence is established. |
| Documents/credentials | The verification route accepts caller-provided `userId` with a fixed anonymous fallback. Its referenced agent source returns SAQA/NAMB verification statuses and fixed details without external checks. The route currently has an unresolved import; repairing that import alone would expose misleading behaviour. |
| Database | All 13 inspected TypeScript files under `packages/database/src` are empty. Its manifest names `src/index.ts`, which is absent. This package is not a working persistence layer. |
| API breadth | 18 web route files exist, many returning 501. File presence is not completed API functionality. Full exposed-route classification remains B01 work. |
| Access/infrastructure | Firestore admin status reads a role field from a user document that its owner can create/update without a protected-field restriction. Conversation writes check proposed owner but not existing owner. Storage screenshot reads permit any signed-in user. Cloud Run Terraform grants `roles/run.invoker` to `allUsers`. These are code/configuration risks; no deployed configuration or live exploit was examined. |

## First three implementation tasks, in order

1. **Finish the M0 public boundary and make its checks reproducible (B01/S01).** Classify every exposed route; explicitly disable/isolate unfinished private profile, credential and automated-action paths from M0. Remove demo/live/verification claims from the public surface or visibly isolate synthetic examples. Repair the selected package/import wiring and two direct web type errors; configure a non-interactive lint command. Resolve font assets for a reproducible build, then run the selected app build and affected checks. Acceptance: recorded passing checks, explicit public route inventory and no accidentally exposed unsupported action. This task does not require implementing full accounts or every agent.
2. **Implement the accepted six-category contract and reviewed public projection (B02).** Consolidate domain types, include both internship routes and graduate programmes, retain general jobs, define explicit unknown deadlines/requirements and scoped source-check records, and map old fixtures deliberately. Keep synthetic fixtures labelled. Acceptance: all six categories and unknown/closed/changed cases represented in meaningful contract tests, with a stable projection the UI can consume.
3. **Deliver one complete source-to-action demonstration through that foundation (first B03/B04 slice).** Record permitted source access, ingest/review a small real listing, publish its source-backed requirements and current application route, render an understandable detail/checklist page, and demonstrate handoff without claiming submission. Acceptance: a repeatable correction/closure path, observed comprehension on a real user task, and a recorded source review. Continue the representative six-category catalogue and accepted B05–B10 work; this first example does not substitute for full M0 coverage.

No new calendar commitment or replacement effort total is justified by this bounded inspection. B01 still owes the complete exposure audit, deployment choice, usable task prototype, measured performance/cost budgets and revised remaining estimate. No B slice or S package is marked complete here.
