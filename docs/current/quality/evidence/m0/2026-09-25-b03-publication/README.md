# B03 local implementation and source-planning evidence

Date: 25 September 2026. Base: `d91d9d3`. Tested local candidate: [file hashes](candidate-files.json). Changes are not committed or deployed by this task. No hosted CI run, real source permission, external scraper publication or G0/G1 closure is claimed.

## Engineering delivered

- Source register with immutable versions, private snapshots, source/intake-scoped drafts and protected review commands.
- Firebase token verification plus current server-owned operator roles, explicit emulator/cloud guards and default-disabled public routes.
- Firestore transactions for publication, correction, withholding, closure, aliases/reversal, serious report restriction, audit history and no-store invalidation records.
- Durable jobs with idempotency, source/job leases, bounded retries, source pause checks and explicit due-recheck scheduling.
- HTTPS JSON transport with exact URL scope, DNS/address pinning, connected-address verification, TLS checks and redirect/time/byte/MIME bounds.
- Versioned public list/detail and bounded report intake; full filtering before pagination, cursor invalidation and private-data exclusion.
- A source-acquisition plan based on actual repository inspection and current primary-source documentation. The founder's clarification about planning scraping is incorporated; a JSON test adapter is not presented as a completed real scraper.

## Verification

| Check | Result | Log |
|---|---|---|
| Frozen-lockfile installation | Exit 0 in isolated candidate | [Install](install.txt) |
| Contract typecheck | Exit 0 | [Typecheck](contracts-typecheck.txt) |
| Canonical contract/inspection suite | 22 passed | [Contracts](contracts-test.txt) |
| Auth/Firestore integration and transport suite | 21 passed | [Catalogue](catalogue-test.txt) |
| Web lint | Exit 0 | [Lint](web-lint.txt) |
| Web typecheck | Exit 0 | [Typecheck](web-typecheck.txt) |
| Production build | Exit 0 | [Build](web-build.txt) |
| Production HTTP/asset boundary suite | 23 passed | [Web tests](web-test.txt) |

Machine-readable [results](results.json). Check these actual log results before treating the table as evidence for a different candidate. The final source-version change reruns the affected catalogue suite, production build and web tests; unchanged contract/lint/typecheck results come from the same isolated candidate baseline. The manifest is updated to the final tested code.

Final [consistency checks](final-consistency.json): all 736 recorded code/configuration inputs match, 13 changed/new Markdown files have no broken local links and `git diff --check` passes. Terminal-only carriage returns/trailing spaces in captured text logs were normalized without changing results. Test servers/emulators shut down after verification; their loopback ports were confirmed closed.

Environment: WSL Ubuntu, Node 22.22.0, pnpm 9.0.0, Java 21 and Firebase CLI 15.22.3, with the current candidate lockfile. The fresh directory contains tracked/non-ignored source files without `.env.local`, node_modules or copied build output. The initial install reused the local package store; it is not a cold-registry measurement. Only PATH/HOME/USER/SHELL/LANG/TMPDIR were inherited; CI and telemetry flags were explicit, NODE_ENV unset except production web build/test. Firebase CLI's existing install directory was added to PATH after the first restricted-environment run could not find it; that [initial setup failure](initial-cli-path-failure.txt) is retained. No production token/credential was supplied to tests.

Firebase Admin adds server-side dependencies and resolves the existing Next.js optional OpenTelemetry peer; Next/React versions were not upgraded. The root generic all-workspace agent suites were not run. Full dependency security review and hosted IAM/egress testing remain release qualification work.

## Test meaning and limits

The integration suite uses actual Auth and Firestore emulators, verifies a real emulator ID token and current operator role, rejects guests/forged/disabled identities, and exercises transactions, contention, source changes, source pause during retrieval, alias reversal, report quotas and a separate CLI process reading persisted history. Direct unauthenticated access is denied under the dedicated emulator test rules. This is stronger than an in-memory repository mock, but not proof of deployed production rules or IAM.

Transport tests inject deterministic DNS/socket/response events into the same transport to exercise mixed/private DNS, changed connection address, redirection and payload bounds. They make no requests to private hosts or third-party sites. No physical phone, assistive technology, real issuer extraction, cloud failover, packet-level egress or cold-network performance result is claimed. No new user-facing catalogue UI is part of B03; B04 owns it.

Operator CLI output can contain private review/source data; test evidence only uses fictional material and never prints tokens. The publication APIs remain unavailable without explicit configuration. The existing Home/About/detail preparation boundaries remain; this is not a launched catalogue or complete MVP.

## Remaining acceptance and next work

| Area | Status / next action |
|---|---|
| B03a source acquisition | Partial: register/transport/controlled JSON input implemented. Assess real sources, choose the first permitted HTML/PDF/feed/API adapter and implement its format mapping, robots and collection policy. |
| B03b persistence/jobs | Locally evidenced for scoped JSON ingestion and review history. Hosted scheduler, source-scale throughput and recovery qualification remain unexecuted. |
| B03c review/correction/report controls | Locally evidenced protected CLI and report handler. Actual operator provisioning, support coverage, intake retention and deployed abuse controls remain open. |
| B03d public projections/corrections | Locally evidenced API handlers and default-disabled production routes. Real-notice G1 demonstration and deployed source/query/rules/cost evidence remain open. |
| G0 / B02 formal acceptance | Participant observation and actual capacity/budget decisions still pending; no synthetic substitute. |
| G1 | OPEN. A controlled fixture pipeline and passing tests cannot establish permitted useful live source coverage. |

See [source coverage](source-coverage.md), [source acquisition plan](../../../../operations/10_SOURCE_ACQUISITION_AND_SCRAPING_PLAN.md), [B03 plan](../../../../planning/07_B03_IMPLEMENTATION_PLAN.md), [runtime/operator guide](../../../../engineering/15_SOURCE_PUBLICATION_RUNTIME.md) and [delivery status](../../../../planning/05_M0_DELIVERY_STATUS.md).

Reforecast B03's remaining source work after choosing actual source formats and confirming review capacity. The old 30-hour scenario is not measured throughput. Source assessment, adapter implementation, rights/access waiting and ongoing review are distinct costs. No public content was fabricated, no outreach was sent, and no cloud resource or scheduled automation was provisioned.
