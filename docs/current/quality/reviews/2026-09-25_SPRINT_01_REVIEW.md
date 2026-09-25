# Sprint 1 independent review — 25 September 2026

Verdict: **request changes; Gate G0 is not ready for sign-off.** Preserve the foundation, ambition and agreed M0 scope. Correct the implementation and evidence defects below before treating Sprint 2's entry gate as satisfied. This report records a review; it does not change the authoritative delivery status or implement the fixes.

Reviewed candidate: `0e655d118a3a0d45477f4a0cd83c29befefa9595`, against `62245b9`. Scope: all 19 changed files across the five Antigravity commits, related canonical requirements and sprint prompt, supplied evidence, independent clean reproduction, and local prototype browser inspection. Line references below refer to this candidate. P1 means resolve before foundation sign-off; P2 means a material correction required in its stated acceptance area; P3 means lower-priority cleanup.

## Verified results and limits

An archive of the committed candidate was extracted to `/tmp/skilved-sprint1-review-3rnaenlh`, without working-tree dependencies, build output or `.env.local`. Commands ran in WSL Ubuntu with Node 22.22.0 and pnpm 9.0.0, using a restricted environment and the existing pnpm package store. No production credentials or cloud deployment were needed.

| Independent check | Result | Raw output |
|---|---|---|
| Install with workflow's `NODE_ENV=production`, frozen lockfile, offline store | Exit 0; development dependencies explicitly skipped | [CI install](2026-09-25-sprint-01-evidence/ci-install.txt) |
| `pnpm web:lint` under that workflow environment | **Exit 1: eslint not found** | [CI failure](2026-09-25-sprint-01-evidence/ci-lint.txt) |
| Install with `--prod=false`, frozen lockfile, offline store | Exit 0 | [Full install](2026-09-25-sprint-01-evidence/full-install.txt) |
| `pnpm web:lint` after full installation | Exit 0 | [Lint](2026-09-25-sprint-01-evidence/lint.txt) |
| `pnpm web:typecheck` | Exit 0 | [Typecheck](2026-09-25-sprint-01-evidence/typecheck.txt) |
| `pnpm web:build` | Exit 0 | [Build](2026-09-25-sprint-01-evidence/build.txt) |
| `pnpm web:test` | Exit 0; 21 passed, none skipped | [Boundary tests](2026-09-25-sprint-01-evidence/test.txt) |
| `node --check apps/web/prototype/task-prototype/serve.mjs` | Exit 0 | Syntax check; no separate log |

The public application remains a truthful preparation-state foundation, and the prototype remains outside its routed production surface. No production application source, package manifest or lockfile changed in this sprint. The passing boundary suite is useful evidence; it does not test the new CI environment, task prototype accessibility, future cloud configuration or participant usability.

The install check used cached package contents in a fresh candidate directory. It is not an uncached registry download or a hosted GitHub Actions execution. No physical Android device, deployed latency, paid cloud controls, production auth, or real participant was tested by this review. Browser observations below used the desktop in-app browser at an explicit 375 × 667 viewport and are not physical-device performance results.

## Findings

### R1 — P1: CI skips the tools it immediately needs

Location: `.github/workflows/ci.yml:22` and `:39`.

The job sets `NODE_ENV=production` before `pnpm install --frozen-lockfile`. pnpm 9 consequently omits development dependencies. Independent reproduction installed 28 packages and printed `devDependencies: skipped because NODE_ENV is set to production`; the next lint command failed because `eslint` was absent. A previous local installation with development dependencies hides this problem.

Correction: explicitly install development dependencies for verification, or limit the production environment setting to appropriate later steps. Reproduce all four commands in a fresh directory with the workflow's actual environment; then retain a hosted run reference when available. Do not mark CI validated from a local run with a different install environment.

### R2 — P1: Emulator guidance can disable real authentication verification

Location: `docs/current/engineering/11_ENVIRONMENT_SCHEMA_AND_CONFIGURATION.md:58–61`; `.env.example:33`.

The schema says emulator host variables are ignored in production. Firebase Admin instead automatically uses `FIREBASE_AUTH_EMULATOR_HOST` when present, including acceptance of unsigned emulator ID tokens and session cookies. Setting `NODE_ENV=production` is not protection. The example exports the variable without a production startup guard. This is an unsafe future implementation instruction, not a claim that the currently disabled auth surface is exploitable. [Firebase's official emulator guidance](https://firebase.google.com/docs/emulator-suite/connect_auth) explicitly warns against setting this variable in production.

Correction: clearly separate development emulator configuration from deployment configuration; reject emulator variables at production startup before SDK initialization; distinguish Admin SDK environment behavior from explicit browser SDK emulator connections. Replace the claim that the template alone ensures fully offline operation. Acceptance should include production-config rejection and development emulator connection checks when those consumers are implemented.

### R3 — P1: The spending stop procedure is ineffective as written

Location: `docs/current/engineering/12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md:91–112`, especially `:106`.

The proposed emergency command sets `--max-instances=0`; revision maximum instances must be a positive integer. Setting minimum instances to zero only permits idle scale-to-zero and does not prevent scaling on new traffic. Budget alerts also do not themselves enforce the claimed hard spending ceiling. [Cloud Run maximum-instance guidance](https://docs.cloud.google.com/run/docs/configuring/max-instances), [manual scaling](https://docs.cloud.google.com/run/docs/configuring/services/manual-scaling), and [Cloud Billing budget behavior](https://docs.cloud.google.com/billing/docs/how-to/budgets) describe these distinctions.

Correction: document and rehearse a supported service-disable procedure, such as the documented manual-scaling-to-zero mechanism where applicable, accounting for tagged revisions, scheduled triggers and already running jobs. Name the project and service explicitly, include actual execution cancellation and restoration steps, and distinguish compute containment from residual storage/network/other charges. Record alert delay and possible overshoot; describe $25 as a funded operating limit until its enforcement is actually established. This review did not execute cloud commands.

### R4 — P1: Gate closure exceeds the available evidence

Location: `docs/current/planning/05_M0_DELIVERY_STATUS.md:7–24`, `:32–40`, `:55`; `docs/current/quality/evidence/m0/2026-09-25-b01-foundation/README.md:29–38`.

The records mark G0 passed, CI validated, the prototype observed and all relevant dependencies resolved. R1 contradicts CI validation; R6 and R7 contradict parts of the claimed evidence. No participant task record was found in the supplied bundle. DEP-07 itself correctly says synthetic internal tests do not count as participant observations. A browser agent exercising the interface can support functional testing but cannot establish participant understanding or suitability.

The records also say the founder confirmed $25/month, 20 hours/week and dated Sprint 2 commitments. That confirmation was not established in the review materials. A clarification was requested; without a reply, this remains **unverified**, not an assertion that confirmation never occurred elsewhere.

Correction: reopen failed or unsupported acceptance items, preserve the independently passing checks, distinguish browser inspection from participant observation, and link actual decisions/observations. Confirmed availability may resolve the planning assumption but does not resolve the demonstrated CI or evidence defects. Propagate the corrected disposition through Start Here, governance, delivery status and the evidence bundle; keep historical records identifiable.

### R5 — P2: Prototype facts are presented as checked real opportunities without supporting sources

Location: `apps/web/prototype/task-prototype/index.html:94–149`, and `:84`.

The fixtures name Eskom, MERSETA, Sasol and Standard Bank, with specific deadlines, stipends, accreditation references, contact details and recent verification claims. No supporting source snapshot or review record accompanies these facts. The generic prototype banner does not identify the opportunity facts as invented or unverified, and it is obscured by the modal. These examples can mislead a participant and bias the observation even though they are excluded from the public app.

There is also a concrete requirement-logic error: the Eskom example says Grade 12 **or** N2, then presents both as unqualified checklist items. Other document-age/format requirements are asserted without evidence. The blanket assertion that legitimate employers/SETAs never charge application fees reintroduces wording the source-faithful contract avoids. All examples present definite answers, so the critical unknown/conflicting-source path is absent.

Correction: use unmistakably fictional issuers and visibly simulated verification states, or permitted, attributed, dated source material with reviewed facts. Keep fixture status visible in detail and handoff views. Preserve alternatives and conditions in checklists, distinguish suggested preparation from issuer requirements, and add an uncertainty task. Do not solve this by making synthetic records public or reducing the six-category MVP scope. The limited prototype coverage is not itself evidence that the full six-category MVP has been implemented.

### R6 — P2: Accessibility and performance passes are overstated

Location: `apps/web/prototype/task-prototype/index.html:5`, `:30`, `:70–89`, `:186–216`; `docs/current/quality/evidence/m0/2026-09-25-b01-foundation/03-mobile-viewport-evidence.md:32–41`.

The evidence claims all relevant controls meet 44 × 44 pixels. Independent rendered DOM measurements at 375 × 667 showed filter selects approximately 160 × 30, detail buttons 298 × 30, and the close button 28 × 28. Opening a detail modal left focus on the underlying card; pressing Tab reached the next background card. Escape did not close the modal. Neither overlay exposed a dialog role. The viewport also requests `maximum-scale=1.0`.

The performance table mixes Next build estimates, local response timing and visual impressions with a declared throttled mobile profile. It provides no retained trace establishing numeric CLS, cold/repeat transfer behavior, LCP or INP under the claimed conditions. A local ~12 ms TTFB does not validate a Johannesburg deployment budget. Cropped screenshots cannot establish whole-viewport fit. The independently observed prototype did not show horizontal overflow at the tested width, so this report does not infer an overflow defect from those screenshots.

Correction: implement accessible dialog semantics, focus entry/containment/restoration, Escape handling, usable zoom and the agreed target sizes. Replace the incorrect PASS claims, capture complete viewport evidence, and retain actual measurement artifacts with route, build, cache, browser, CPU and network conditions. Mark unmeasured budgets unmeasured. Do not treat a configured target as a measured result or a viewport override as proof of a budget phone's CPU/RAM behavior.

### R7 — P2: The advertised reproduction logs do not travel with the repository

Location: `docs/current/quality/evidence/m0/2026-09-25-b01-foundation/README.md:14–17`.

Both linked `.log` files exist locally but are excluded by the repository's `*.log` ignore rule and absent from the candidate's tracked files. A clean archive therefore has two broken evidence links. Calling the bundle immutable and reproducible does not preserve evidence that is missing from the delivered revision.

Correction: retain sanitized logs in a tracked format such as `.txt`, narrowly allowlist the intended evidence files, or use durable accessible artifact links. Include candidate SHA, commands, environment and exit status. Verify the bundle from committed files. The new review's independent logs are separately retained beside this report; they do not retroactively prove Antigravity's execution claims.

### R8 — P2: The dated forecast exceeds its own available capacity

Location: `docs/current/engineering/13_PERFORMANCE_ENVELOPES_AND_BUDGETS.md:62–78`.

The forecast allows 15 productive hours per week, or 30 per two-week sprint. Sprint 5 assigns 34 hours, Sprint 6 assigns 32, and the one-week Sprint 7.5 assigns 18. The 196-hour total is arithmetically correct, but the 13-week window has only 195 productive hours. Unused hours in an earlier sequential sprint do not automatically make later overloaded timeboxes feasible. The final partial sprint also needs to accommodate promotion and the required operating observation window, which includes elapsed time beyond hands-on effort.

Correction: move work into feasible dependency-respecting timeboxes or revise dates/capacity explicitly; retain the reserve and all accepted scope. Add remaining task estimates, ranges, assumptions and external waits before calling the forecast evidenced. Reconcile B10 promotion timing with its full observation window. Confirm actual founder availability and start date rather than converting a proposal into a commitment.

### R9 — P2: Hosting selection relies on inaccurate facts and unsupported costs

Location: `docs/current/engineering/12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md:16–21`, `:30`, `:37–38`, `:79`.

The comparison says Vercel has no South African compute region. Its official Cape Town `cpt1` page lists regional active CPU and provisioned memory pricing. This invalidates the categorical exclusion, although Cloud Run may still be the appropriate choice. The quoted end-user latency, initial monthly cost and sub-five-second rollback are not supported by measurements or a workload model. [Vercel Cape Town pricing](https://vercel.com/docs/pricing/regional-pricing/cpt1).

The architecture leaves connector versus Direct VPC Egress unresolved while treating the low cost estimate as established. Connector, NAT/egress, storage, logs, builds, secrets and two-environment costs need explicit assumptions; scaling the web service to zero does not remove all of them. [Google's VPC connectivity guidance](https://docs.cloud.google.com/run/docs/configuring/connecting-vpc) identifies distinct connectivity options and costs. The comparison also calls a $10–$35 database range directly above a $25 total limit without a complete aggregate estimate.

Correction: keep the hosting choice provisional or justify it using accurate current provider capabilities and a bounded workload/cost model. Separate residency preferences from legal conclusions requiring their own support. Mark rollback timing as a target until rehearsed. No provider migration is required merely to correct the comparison.

### R10 — P2: Configuration documentation describes proposed behavior as already implemented

Location: `docs/current/engineering/11_ENVIRONMENT_SCHEMA_AND_CONFIGURATION.md:17`, `:28–61`; `docs/current/engineering/12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md:21`, `:27`.

The inventory identifies consuming modules, validations and fallback behavior that are not implemented in the candidate. For example, `apps/worker` does not exist; the source has no consumers for the new application environment, BigQuery and Redis toggles; the Next config does not set `output: "standalone"`. The ADR nevertheless says standalone output is configured and a minimal image deployed. A value in `.env.example` does not implement a fallback or validation rule.

Correction: classify each entry as active, reserved or proposed; link actual consumers and defaults where they exist, with a future task for the remainder. State containerization and cloud resources as proposed until implemented and evidenced. Keep secret/public classification, but do not require premature worker/auth implementation solely to make aspirational wording true.

### R11 — P2: The fetch design omits connection-time destination validation

Location: `docs/current/engineering/12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md:57–64`; compare the existing approved-fetch specification in engineering document 04, section 5.

A DNS pre-check followed by a client that resolves the hostname again permits the connected address to differ from the checked address. The enumerated ranges also omit private IPv6 unique-local addresses and do not explain IPv4-mapped IPv6 normalization. This weakens the existing requirement to validate the actual destination at connection time and handle DNS changes. It is a design gap before B03, not a demonstrated exploit in an implemented crawler. [OWASP's SSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) discusses DNS pinning and IPv4/IPv6 validation.

Correction: carry forward the complete approved-fetch contract, including validated destination binding on each connection and redirect, comprehensive non-public address rejection and defense-in-depth egress controls. Later adapter tests must exercise DNS changes, mapped/private IPv6 and redirect escapes before untrusted fetching is enabled.

## Additional cleanup

- **P3 — Local server binding:** `apps/web/prototype/task-prototype/serve.mjs:54` omits the host argument, which binds all interfaces rather than only the logged localhost address. Bind explicitly to loopback by default; make any intended LAN test binding explicit. Actual external reachability depends on host networking/firewall configuration.
- **P3 — Canonical naming:** document 13, line 89 and the prototype use `graduate-programme`, while the canonical machine identifier is `graduate_programme`. Reconcile before B02 generates incompatible schema/fixture names; the user-facing category remains unchanged.
- **P3 — Status metadata and formatting:** delivery status still says updated 24 September and that no dated sprint is committed while subsequently committing Sprint 2. The reviewed range also fails `git diff --check` on seven Markdown trailing-space lines. Normalize metadata and use non-whitespace hard breaks if this check is enforced.

## Recommended correction order and acceptance

1. Fix the CI install environment and rerun the exact clean verification sequence. Retain the command outputs and hosted run reference when available.
2. Correct the emulator, spending-control and fetch-design instructions before downstream implementation consumes them; label unimplemented behavior honestly.
3. Make the prototype fixtures truthful about their status; fix requirement alternatives, uncertainty handling and accessibility. Rerun the browser checks and replace unsupported measurements.
4. Restore portable evidence and obtain/link the participant observation and founder decisions that are genuinely required. Record unavailable items as pending with an owner and next action.
5. Reforecast within confirmed capacity and dependency order; reconcile all G0 and Sprint 2 status claims against the corrected evidence. Only then close the foundation gate.

These corrections preserve the six opportunity categories, both internship subtypes, free consumer service and future expansion direction. They strengthen the evidence and execution path rather than narrowing the product. The review does not claim to certify the whole future MVP, production infrastructure or every possible defect.
