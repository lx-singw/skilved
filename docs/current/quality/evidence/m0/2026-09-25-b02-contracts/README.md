# B02 engineering implementation and evidence

Date: 25 September 2026. Base revision: `f116f4b`. Candidate: local changes identified by [candidate file hashes](candidate-files.json), reproduced in a fresh temporary directory. No commit, hosted CI run, cloud deployment or participant session is claimed.

**Engineering result:** canonical opportunity contracts, public projection, requirements/date logic, API/storage/legacy-conversion contracts, fixtures, isolated inspection, selected CI integration and production boundary changes are implemented and locally verified. **Formal G0 and B02 acceptance remain open** for the actual participant observation and founder availability/budget decisions. The user's instruction to implement locally was carried through across B02a–d; this does not stand in for those external facts or enable B03.

## Results

| Command / check | Actual result | Evidence |
|---|---|---|
| `pnpm install --frozen-lockfile` | Exit 0; fresh candidate, existing package store reused | [Install](install.txt) |
| `pnpm contracts:typecheck` | Exit 0 | [Contract typecheck](contracts-typecheck.txt) |
| `pnpm contracts:test` | Exit 0; 22 tests passed, no skips | [Contract tests](contracts-test.txt) |
| `pnpm web:lint` | Exit 0 | [Lint](web-lint.txt) |
| `pnpm web:typecheck` | Exit 0 | [Web typecheck](web-typecheck.txt) |
| `pnpm web:build` | Exit 0 | [Production build](web-build.txt) |
| `pnpm web:test` | Exit 0; 22 tests passed, no skips | [HTTP/build boundary tests](web-test.txt) |
| Narrow/wide browser inspection and B01 dialog checks | Scoped checks passed | [Browser record](browser-evidence.md) |

Machine-readable exit statuses: [results](results.json). Selected commands used WSL Ubuntu, Node 22.22.0, pnpm 9.0.0 and the committed dependency versions plus the candidate lockfile. TypeScript 5.9.3 was made an explicit package development dependency; no framework/library upgrade was introduced. The install environment had NODE_ENV unset, CI=true and telemetry disabled; production was set for build/test. Only PATH/HOME/USER/SHELL/LANG/TMPDIR were otherwise inherited. No `.env.local`, node_modules or generated build output was copied. The fresh install reused package-store content; it is not an uncached registry test.

Final [consistency check](final-consistency.json): all 720 recorded candidate file hashes match, the 14 changed/new Markdown files have no broken local links, and `git diff --check` passes. The temporary inspection server and agent-created test tab were stopped after verification; the demonstration can be restarted with the command below.

The source candidate was copied from tracked and non-ignored new files, excluding this evidence bundle, with original file bytes. The manifest records application/configuration/test input hashes and the base revision. Later documentation-only additions do not alter that tested code. Logs include commands and exit codes. No secret or actual applicant/participant data was used. Current full-workspace agent checks, production cloud configuration and provider billing behavior are outside these passing results.

## Delivered task disposition

| Work packet | Result | Remaining dependency |
|---|---|---|
| N01 / B01 technical reconciliation | Current candidate verified; earlier review findings accounted for; additional prototype and ADR claims corrected | Cloud/auth/fetch implementation and staging rehearsal belong to their later tasks |
| N02 / G0.6 | Observation procedure and safe sheet prepared | Actual consenting participant session and any resulting fixes |
| N03 / G0.7 | Scenario arithmetic/decision sheet retained honestly | Founder confirmation of actual capacity, start and funded operating limit |
| B02a | Canonical six-category/subtype schema and explicit legacy compatibility | Formal prerequisite gate |
| B02b | Source facts, bounded requirement logic, deadline/compensation semantics, checked whitelist projection | Real source authority and publication controls in B03 |
| B02c | Executable API/storage/version/alias/legacy conversion contracts and B03 query/index specification | Actual repository adapter, persistent migration and hosted query tests in B03 |
| B02d | Fictional parser/projector inspection, test matrix, CI steps and clean reproduction | Formal sprint acceptance after G0 prerequisites; hosted CI unexecuted |

See [review disposition](review-disposition.md), [pending observation/decisions kit](observation-and-decisions.md), and the [implemented contract and B03 handoff specification](../../../../engineering/14_CANONICAL_OPPORTUNITY_CONTRACT.md).

## Coverage and demonstration

CT-01–18 and CT-20 are named cases in `packages/types/tests/contracts.test.mjs`. Additional tests verify newer/equal-time/private negative safety checks, public-schema invariants and HTML escaping in the inspection. CT-19 lives in `apps/web/tests/public-boundary.test.mjs` and verifies the canonical active seam, denied fixture/versioned routes and absence of new private/synthetic sentinels in shipped browser assets. These results are partial DCF-01–06/13/17/19/22/24 evidence; they do not complete integrated DCF cases or source coverage.

Run `pnpm contracts:inspect --serve --port 39202`, then open `http://localhost:39202/`. It generates ten fictional cases from the real parser/projector; `/prototype` serves the isolated B01 observation harness. `--help` and `--fixture ID` are supported. Generated HTML/public JSON are under ignored `.artifacts/contracts/`. Only the loopback interface is used. Stop with Ctrl+C. No application is submitted or source fetched.

The active detail route's old verification/action renderer is preserved at `apps/web/prototype/b02-preserved/opportunity-detail.tsx`; the public route remains a true 404. Legacy shared schema content is preserved at `packages/types/src/legacy/opportunity.ts`, with compatibility re-exports. The public catalogue's active type is the canonical `PublicOpportunity`. No fictional inventory was activated.

## Handoff and remaining work

Review the current diff and candidate evidence. Complete the observation/decision sheet before declaring G0/B02 accepted. B03 then needs permitted source records, an actual review owner, environment guards before SDK initialization, operator authorization, a bounded safe-fetch adapter, persistent review/publication, optimistic concurrency, query completeness, alias/correction controls and cache invalidation evidence. Schema/URL validation is not proof of any of those runtime controls.

The old human-hour estimate is not mechanically reduced by agent runtime. Reforecast remaining B01 observation/decision work and B03–B10 against actual founder capacity and operating burden. No inferred completion of S01, G1, a live catalogue or REL-M0 is recorded. Nothing was pushed, merged or deployed.
