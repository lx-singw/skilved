# Next sprint implementation plan — verify the foundation and build B02

Execution update, 25 September 2026: the user's subsequent instruction to implement was carried through locally across N01 and B02a–d from `f116f4b`. See the [candidate implementation and evidence](../quality/evidence/m0/2026-09-25-b02-contracts/README.md) and [implemented contract](../engineering/14_CANONICAL_OPPORTUNITY_CONTRACT.md). Fresh-candidate checks pass, including 22 contract/inspection and 22 web boundary tests. N02 participant observation and N03 actual capacity/budget decisions remain pending; formal G0/B02 acceptance is open and B03 is not activated. The plan below preserves its original baseline and estimates for comparison, not as a claim of current remaining effort.

Prepared: 25 September 2026. Planning baseline: `5fd878d` (verify HEAD again before execution). Status: **proposed execution plan; no implementation, observation, budget approval or gate closure is claimed by this document**. Owner: founder for product, availability and release decisions; implementer for engineering and evidence. One person may hold several roles. No additional team capacity is assumed.

The next iteration has one outcome: **a verified foundation and one executable, source-faithful six-category opportunity contract that B03 can persist and publish safely**. It starts with the remaining B01 work, then B02a–d. It ends with a working contract demonstration and evidence, not a live catalogue or a complete MVP.

## 1. Authority, scope and actual starting point

Read with the [chronological runbook](04_M0_CHRONOLOGICAL_BUILD_RUNBOOK.md), [delivery status](05_M0_DELIVERY_STATUS.md), [M0 scope](../product/03_DISCOVERY_FIRST_MVP.md), [canonical contracts](../engineering/07_DATA_AND_API_CONTRACTS.md), [companion extensions](../engineering/04_DISCOVERY_COMPANION_IMPLEMENTATION.md), [acceptance catalogue](../quality/02_DISCOVERY_COMPANION_ACCEPTANCE.md), and [Sprint 1 review](../quality/reviews/2026-09-25_SPRINT_01_REVIEW.md). This document decomposes existing B01/B02 work; it creates no new product release or parallel opportunity model. If an execution detail conflicts with a canonical requirement, reconcile the decision and affected documents before implementing it.

The repository changed after the review of `0e655d1`. Six correction commits through `5fd878d` now scope CI's production environment to build/test, revise emulator and deployment guidance, change the prototype, rebalance the schedule, track text logs and reopen G0. Static inspection for this plan confirms those edits exist. **Their new runtime behavior was not independently retested during this planning task.** The earlier review's passing tests and failing CI reproduction refer to its candidate, not automatically to the corrected candidate.

| Observed starting fact | Consequence for this sprint |
|---|---|
| G0 remains open; participant observation and founder confirmation are pending | Resolve or record those dependencies before full B02 acceptance; do not silently waive them |
| Current workflow installs without job-level `NODE_ENV=production` | Verify the corrected exact workflow environment; do not blindly reapply R1's fix |
| Environment document includes a guard code example | A specification is not proof that a runtime guard is wired; inventory actual consumers and classify implementation status |
| `packages/types/src/opportunity.ts` has Zod but a legacy taxonomy including `trade_test` and `short_course` | Build the canonical M0 contract here through an explicit compatibility transition |
| `apps/web/src/types/opportunity.ts` and `src/constants/opportunityTypes.ts` define a separate legacy web model | Remove competing models from the active M0 dependency path; preserve isolated prototypes explicitly |
| Several inactive agent packages import legacy `Opportunity` and helper enums | Avoid a silent breaking root-export change; inventory and retain explicitly named compatibility paths |
| `packages/database/package.json` exists, but its declared `src/index.ts` does not | Specify the persistence boundary; do not claim an existing working database client |
| `apps/worker` is proposed, not implemented | Provide a shared contract for future worker use; do not create a worker service just to complete B02 |
| Public opportunity APIs are preparation/empty-state boundaries | Keep them honest until B03 supplies approved persistent publication |
| Doc 13 now has seven forecast sprints; delivery status still mentions 6.5 in DEP-09 and calls a provisional plan committed | Reconcile current planning claims; preserve historical reports |

Retain all six categories, student/WIL and graduate internships, general jobs including experienced roles, the free consumer service, all M0-A–G slices, and the later career-record/evidence/assistance/network/institutional ambition. This sprint makes those later features easier to build through stable identity, provenance, versioning and privacy boundaries.

Excluded implementation: live scraping, unrestricted URL fetching, cloud provisioning, deployment, production auth, accounts, uploads, personal eligibility processing, agent/model calls, local shortlist, suggestion receipts, export/share, issuer catalogue and commercial features. Their data compatibility requirements inform B02; their functional delivery remains B03–B10 or later. Do not add infrastructure or expose fixtures to achieve a demonstration.

## 2. Capacity, dates and commitment rules

Default scenario: one implementer, two weeks, 20 gross hours/week, 25% reserve. This yields **40 gross hours − 10 reserved hours = 30 planned task hours**. These hours and the old 9–23 October 2026 dates remain unconfirmed. Use relative working sessions until the founder confirms a start and availability. The plan does not presume work every weekday, weekend work, or extra availability during holidays.

| Allocation | Planning point | Plausible remaining range | Counting rule |
|---|---:|---:|---|
| B01 correction verification and remaining gate evidence | 6 h | 4–10 h | Includes engineering rechecks, observation preparation/session/synthesis and planning reconciliation; excludes waiting for a participant |
| B02a canonical vocabulary and compatibility | 6 h | 5–9 h | Includes its design, code and focused tests |
| B02b fact/requirement/projection semantics | 8 h | 7–12 h | Includes focused logic/privacy tests |
| B02c API/store/version contracts | 6 h | 5–9 h | Includes contract examples and migration checks |
| B02d fixture demonstration and integrated acceptance | 4 h | 3–6 h | Includes fixture coverage, final CI integration, clean verification, evidence and handoff; do not count earlier focused tests again |
| **Total** | **30 h** | **24–46 h** | Planning judgment, not measured velocity or guaranteed delivery |

The 24-hour B02 point retains Doc 13's scenario; the six-hour B01 carry-over consumes its previously unallocated next-sprint capacity. It is not free work. At the range's upper end the work must span iterations. If B01 carry-over was omitted from the old 196-hour B02–B10 scenario, the combined remaining point becomes 202 hours before new discoveries; label that arithmetic adjustment, not a validated whole-MVP estimate. Re-estimate downstream work separately rather than accepting 196 hours as measured truth.

Checkpoint after the B01 reconciliation: estimate remaining work again. If B01 needs more than six planned hours, actual capacity is below the scenario, or B02 exceeds remaining capacity, split B02 at a task acceptance boundary. Prefer completing B02a and B02b with their tests over half-finishing all four. Record B02c/d as carry-over, move downstream dates and keep B02 open. Do not remove tests, spend the interruption reserve twice, drop categories, or add presumed agents to make the dates fit.

Account for human observation time within founder/implementer capacity. Agent elapsed runtime is not equivalent to human productive hours. External waits extend the calendar; unused hours in an earlier sprint are not automatically transferable to a later timebox.

## 3. Entry paths and chronological execution

| Entry state | Permitted next work | Acceptance limit |
|---|---|---|
| Corrected candidate unverified | N01 correction verification; N02/N03 preparation can proceed independently | G0 stays open |
| Technical G0 items pass; participant or founder decision outstanding | Complete N02/N03 materials and a bounded B02a/B02b contract-only spike within remaining capacity | Keep public routes unchanged; no full B02 acceptance or B03 start |
| All G0 requirements evidenced and critical issues resolved | Execute B02a → B02b → B02c → B02d | B02 may close only with all acceptance below |
| New technical/security/semantic regression | Repair the affected prerequisite and rerun its evidence | Dependent work pauses; independent schema/design checks may continue |

Execution order: **N01 → G0 decision (N02 + N03) → B02a → B02b → B02c → B02d → sprint review → B03 eligibility decision**. N02 session logistics and N03 decisions can run alongside N01, but one implementer has one principal code change in progress. Do not interpret this overlap as extra capacity.

At the 30-hour point, cumulative checkpoints are: hours 0–6 foundation; 6–12 vocabulary/compatibility; 12–20 semantics/projection; 20–26 read/store/version contracts; 26–30 integration/demo/handoff. These are effort checkpoints, not automatic passing times. Stop and reforecast when acceptance fails or a checkpoint overruns.

At each checkpoint record completed tests, actual effort, changed assumptions, remaining range and blocker owner. A task progresses through `NOT STARTED → IN PROGRESS → VERIFIED` or `BLOCKED`; `VERIFIED` needs linked evidence. All tasks start as not executed by this plan.

## 4. B01 carry-over work packets

### N01 — Reconcile corrected candidate and verify technical prerequisites

Parent: B01a/b/c/d. Owner: implementer. Point: 2 h; range 1.5–4 h. Dependency: repository access.

1. Verify workspace, HEAD, branch, dirty files, applicable instructions, manifests and lockfile. Inspect the six correction commits against the review's R1–R11 and P3 items. Preserve unrelated work. Record exact base/candidate revision; if candidate is uncommitted, capture the patch and file hashes used in isolated reproduction.
2. Create a disposition table with one row for every review finding: corrected file, inspected behavior, verification method, result and unresolved work. A changed paragraph is sufficient only for a documentation defect; it does not prove runtime security or cloud operation.
3. Reproduce the corrected workflow in a clean checkout/archive with declared Node/pnpm, no `.env.local` or production credentials, the frozen lockfile, and matching environment at each step. Record whether the store was reused. Install development tools as the workflow actually does; do not conceal a workflow mismatch by using an undocumented local-only override.
4. Recheck prototype fiction labels in feed/detail/handoff, requirement alternatives and uncertainty, actual control dimensions, keyboard focus/escape/restoration, zoom, narrow/wide layout and loopback binding. Capture new evidence for changed code rather than relabelling old screenshots. Record console/request failures. Measure the cold/repeat prototype scenario if it remains outstanding; label unsupported metrics unavailable and name the later measurement task.
5. Reconcile environment inventory with actual code. If no SDK initializes in the active boundary, mark the guard as specified and its implementation mandatory before B03 SDK activation. If an active consumer exists, wire and test fail-closed behavior before it initializes. Do not equate a document snippet with an installed guard or prematurely build authentication.
6. Reconcile status wording with actual evidence: local workflow reproduction versus hosted CI, proposed hosting versus deployed resources, provisional workload/cost limits versus tested spending control. Correct residual contradictory G0 and schedule statements. Do not execute cloud shutdown commands during this local task.

Output: updated review-disposition ledger and sanitized current-candidate logs/browser evidence. Acceptance: no unresolved technical G0 blocker; each original finding accounted for; exclusions and future enforcement tasks named. A real GitHub run is linked only if one exists or is separately authorized; a local reproduction stays labelled local.

### N02 — Complete a real initial task observation or retain the dependency

Parent: B01d / G0.6 / DEP-07. Owner: founder/product for arranging a participant, implementer for the harness and fixes. Point: 2 h; range 1.5–3 h, excluding recruitment wait.

Use the corrected, clearly fictional prototype. Prepare a short task sheet and a matching fictional source notice, or use permitted attributed real material with its checks recorded. The initial session should ask the participant to find a relevant example, identify issuer and conditions, distinguish an alternative requirement, explain an unknown deadline/pay fact, and describe the next application action. Include one failed or changed state. Ask what information would be kept after leaving the page, without claiming unimplemented saving works.

Use an adult consenting participant as the default planning case. If the actual participant needs additional safeguarding arrangements, apply the existing safeguarding process before the session. The founder arranges contact; no unsolicited outreach is authorized by this plan. Participation is optional, can stop, and requires no identity documents, applications or private employment records. Do not publish names, recordings or personal circumstances in the repository.

Record pseudonymous session reference, candidate/fixture, date, device/browser, task, action, answer, coaching, confusion, outcome and change needed. Observe first, explain afterward. At least one actual initial observation is required to close this specific carry-over item; it is neither representative market research nor full DCF-18 launch acceptance. Save/resume and integrated six-category tasks remain B05/B10 evidence.

Acceptance: an actual session with findings, scoped conclusions and fixes/retests for critical misunderstanding; or explicit `BLOCKED` status, owner and next review date. An agent walkthrough cannot fill the participant row. If the session exposes material prototype or schema problems, re-estimate the fix before G0 closure.

### N03 — Confirm assumptions and record the G0 decision

Parent: B01d / G0.7 / DEP-01/02/04/09. Owner: founder for decisions, implementer for calculation/status. Point: 2 h; range 1–3 h.

Prepare one compact decision record: actual weekly gross availability; reserve; proposed start/end; funded monthly operating limit and whether any services already incur cost; available observation/device arrangements; and owner for the next gate review. Budget confirmation authorizes a planning limit, not automatic purchasing/provisioning. If an existing confirmation is available, cite it instead of asking again.

Update the current status and Doc 13 consistently. Replace stale 6.5-sprint figures, “committed” wording for unconfirmed dates, and claims that a pending dependency is resolved. Keep measured results, chosen defaults and founder confirmations separate. Record G0.1–G0.7 individually, then the aggregate disposition. A pending item remains pending with an owner and review date.

Acceptance: a coherent capacity sheet and explicit G0 decision backed by actual evidence. Withhold G0 closure if required observations or decisions are missing; continue only the bounded contract spike allowed above.

## 5. B02a — Canonical vocabulary and compatibility foundation

Owner: implementer. Point: 6 h; range 5–9 h. Prerequisite: G0 for full acceptance; a bounded spike may start earlier. Acceptance families: partial DCF-01/02/22/24.

### Implementation sequence

1. Inventory definitions and consumers of opportunity categories, provinces, dates, salary, requirements, lifecycle, verification and source links. Classify each as active production, inactive but typechecked, isolated prototype, test fixture or future package. Record an explicit migration mapping before replacing an export.
2. Define the canonical category enum exactly once: `bursary`, `learnership`, `apprenticeship`, `internship`, `graduate_programme`, `job`. UI display labels are separate from machine values. Unsupported legacy categories never silently become jobs.
3. Add internship subtype semantics for student/WIL, graduate, other-stated and unknown. Proposed machine values are `student_wil`, `graduate`, `other_stated`, `unknown`; confirm these against any actual adopted consumer and document the decision. A non-internship cannot carry an internship subtype. “Other stated” retains sourced wording. A graduate internship remains an internship, not a graduate programme.
4. Define stable opaque opportunity, source, snapshot, requirement-set and revision references. Validate schema versions and positive revisions; IDs are not titles, URLs or inferred company slugs. Human-readable aliases are separate. Distinct intakes retain distinct IDs.
5. Remove mandatory trade-only assumptions from the active M0 contract. Allow general fields and experienced jobs; preserve sourced entry stage without turning unstated experience into “no experience.” Model national coverage separately from the nine province identifiers; physical place, remote reach and required residence are different concepts.
6. Use the existing TypeScript/Zod package as the runtime-schema authority and infer types from schemas. Add a browser-safe public entry point and an explicitly private/internal entry point. Neither public entry point imports SDKs, process environment, private fixtures, reviewer records or full source content.
7. Keep legacy consumers working through clearly marked compatibility exports or isolate them deliberately. Recommended transition: canonical M0 exports under `@skilved/types/opportunities`; legacy types moved behind a documented legacy entry while old root aliases are deprecated. Record every remaining legacy consumer and owner. Active M0 code may not import legacy types; do not mass-rewrite dormant agents or reactivate prototype routes.
8. Add only the workspace dependency/export/compiler configuration actually needed. Resolve TypeScript execution for package tests explicitly; inspect existing tooling first. If a runner dependency is needed, use a pinned compatible development dependency and update the lockfile normally. Do not rely on undeclared global tooling or direct imports from pnpm's internal store paths.

### Acceptance

All six categories parse; both internship routes and general experienced jobs survive serialization; invalid category/subtype combinations fail with bounded structured errors. Legacy `trade_test`, `short_course`, `trade-test` and `short-course` inputs are classified unsupported/review-needed rather than coerced. An import inventory shows one canonical active M0 type source. Existing unavailable public endpoints stay unavailable and all selected web typechecks still run. Deliver the compatibility table and focused tests with this task.

## 6. B02b — Source facts, requirement logic and safe public projection

Owner: implementer. Point: 8 h; range 7–12 h. Dependency: B02a. Acceptance families: partial DCF-03/04/05/06/13/17/22/24.

Implement small schemas and deterministic functions rather than one unreviewable schema. Do not build a personal eligibility engine. Source text remains untrusted data; this sprint does not fetch or execute it.

| Contract area | Required behavior and negative boundary |
|---|---|
| Facts | Represent `stated`, `not_stated`, `ambiguous`, `conflicting`; validate state/value combinations, retain original wording and source/evidence references. A stated material assertion requires attributable support. Conflicting assertions retain alternatives privately and expose a truthful safe summary; never choose one silently |
| Provenance | Source ID/version, assertion references, method and review state are traceable. A model/rule explanation is not a reviewed source fact. Raw snapshots, actor IDs and reviewer notes are internal |
| Organisations | Distinguish issuer, employer/host, training provider, qualification issuer and oversight roles. Unstated accreditation or relationships stay unknown |
| Location | Distinguish work/study location, remote/hybrid/in-person attendance, national coverage, residence eligibility and sourced relocation requirements. Missing locality is not exclusion |
| Deadlines | Retain original text, date, optional time, named zone and optional resolved instant. Date-only is not an invented 23:59 cutoff; unknown timezone is not assumed SAST. Distinguish unknown, explicitly open-until-filled and a stated date. Reject invalid calendar values and inconsistent date/instant pairs; inject the clock in comparisons |
| Requirements | Versioned atomic requirements with stable IDs, original wording, evidence, required/preferred/unclear level and nested `all`, `any`, conditional and unknown relationship nodes. Validate references and bounded depth/size; reject cycles/empty invalid groups. Preserve alternatives and branches when formatting a preparation checklist |
| Qualifications/documents | Retain designation, stated level, subject marks, provisional/completed status and document stage/requiredness. Certification age, document format and size are known only when sourced. No invented equivalence, waiver or universal PDF/CV rule |
| Compensation | Separate salary, stipend, tuition, books, accommodation, transport, allowance and other components; preserve amount/range, currency, period, coverage and uncertainty. Zero requires a stated zero. Do not default to ZAR/month or sum incomparable components |
| Practical conditions | Preserve sourced attendance, duration, work/placement obligations and support. No guessed transport cost, net-pay ranking or eligibility exclusion |
| Explanations | Reference source assertions and the requirement-set revision; retain authoring method and review status. Outdated/unreviewed explanations cannot replace current original requirements |
| Application route | Distinguish discovery link, issuer notice and issuer-directed destination; support portal/email/in-person/post without requiring a web URL for every opportunity. URL shape checks are not SSRF protection or authenticity proof. Unresolved/unsafe relationships yield an unavailable action and reason |
| Scoped checks | Scope/outcome/time/evidence and next-check information remain separate from availability. HTTP success is not verification; failed recheck preserves the prior successful check record and does not establish closure |
| Lifecycle/publication | Retain `draft`, `review`, `published`, `closed`, `withdrawn`, `archived`; use separate publication eligibility/risk disposition for withholding. Never infer approval from a completeness score |

### Projection design

Build an explicit whitelist projection with its own runtime schema. Construct fields deliberately rather than spreading an internal record and deleting known secrets. Public facts may retain approved source citations and scoped public check summaries, but not private snapshot bodies, reviewer identifiers, policy/security notes, raw submitted URLs, queue metadata, credentials or arbitrary unknown keys.

Use a discriminated result: public opportunity, minimal previously-public status/tombstone, or not-public. New drafts/review records produce no public detail. Closed records may expose approved historical context with an inactive application action; withheld/withdrawn/archived records follow the canonical safe-status policy with no active unsafe destination. A tombstone must not disclose a previously private record. Confirmed aliases may point to a safe canonical record; unconfirmed merges never redirect automatically. These are pure projection decisions; persistence, authorization and cache invalidation implementation remain B03.

Validate the public DTO after projection as well as at input. Bound arrays, string lengths and nesting through named constants and document chosen values as engineering defaults to review against sources. Return safe error codes/paths rather than echoing private input. Treat text as plain text; an isolated HTML inspection renderer must escape it. No `any` escape hatch or unvalidated type cast at the boundary.

### Acceptance

Tests preserve OR and conditional requirements, source wording, date uncertainty, differing compensation periods, unknown residence and scoped checks. Sentinel strings placed in every private field and nested extra field are absent from serialized public output and errors. A withheld record cannot expose its prior active destination. Tests show materially changed requirements invalidate outdated explanations without changing the original evidence. Run these focused tests before moving to B02c.

## 7. B02c — Public read, persistence and migration contracts

Owner: implementer. Point: 6 h; range 5–9 h. Dependency: B02a/b. Acceptance families: partial DCF-01/02/04/13/15/22.

### Public API specification and executable examples

Specify `/api/v1/opportunities` and `/api/v1/opportunities/{id}` as the future approved public read surface. Define query/response/error schemas and executable contract tests now; do not enable a fixture-backed public route. Document how the existing `/api/opportunities` preparation response will transition in B03. Keep unknown/detail fixture paths returning their existing real HTTP 404 and personal/action routes denied in this sprint.

Proposed API defaults to confirm in the contract decision: page size 20, maximum 50, deterministic ordering with ID tie-breaker, opaque versioned cursor bound to filters/sort, and bounded keyword input. Declare canonical parameter names, repeated-value/unknown-parameter handling, field/category/province/national/remote behavior, cursor expiry or revision mismatch behavior, and safe structured `400` errors. Explicitly define whether invalid cursors restart or fail; do not silently mix results from different filters. Display labels never become unstable filter identifiers.

List only publishable discovery records. Define `200` list/approved detail and safe previously-public status responses, `404` for nonexistent/private IDs without disclosing which, and `503` for unavailable future storage with no fixture fallback. A successful empty preparation response remains distinct from a broken store. Design validators for errors without stack traces, private links or raw payload echoes. No receipt/admin/write API is enabled by B02.

Specify publication revision, safe `asOf`/check semantics, cache keys and invalidation responsibilities for publish/correct/withhold/close/merge. Choose explicit bounded cache freshness before B03 enables reads; for this sprint the preparation surface remains `no-store`. A written cache policy is not evidence of deployed invalidation.

### Persistence boundary

Provide a collection/document inventory for sources, permitted snapshots, opportunity drafts/versions, requirement sets, scoped checks, public projections and confirmed aliases. For each: purpose, ID, schema version, required/optional fields, reader/writer boundary, revision authority, retention reference and indexes needed by the declared queries. Reuse existing proposed names where possible; record deliberate changes once.

Specify serialization of UTC instants/date-only values/nulls and Firestore-compatible structures; reject unsupported/undefined/non-finite values at the adapter boundary. Document index entries and query examples together. A proposed index file or serialization test is not an emulator/query performance result. Record document/array bounds, atomic publication expectations, optimistic expected-revision conflict handling and how a material revision replaces a projection. No Firestore deployment or broad security-rule rewrite belongs here.

Define a small repository interface consumed by future B03 operations. Use an in-memory test adapter only if needed to exercise contract behavior, labelled ephemeral and excluded from public routing. Do not instantiate cloud SDKs, pretend restart persistence works, or create placeholder services to satisfy the interface.

### Migration and rollback

Document old-field → new-field mapping, loss/uncertainty handling and manual-review cases. In particular: `verified`/quality score cannot create scoped checks; `null` deadline cannot automatically become open-until-filled; implicit ZAR/month defaults cannot become source facts; singular salary retains its original assertion; legacy trade categories do not map automatically to jobs; source URL is not proof of permission or issuer relationship.

Implement pure versioned conversion/validation helpers for known legacy fixture shapes where justified. Unknown versions fail safely. Keep adapters deterministic and repeatable; preserve IDs and distinct intakes; record conversion warnings without auto-publication. Test already-converted inputs and dry-run behavior. If actual stored records cannot be inspected without cloud access, say migration is designed/tested on fixtures and live-data inventory remains outstanding; do not assert that the database is empty.

Document expand/read compatibility and the last compatible reader/schema pair. Local rollback reverts the scoped candidate or switches an isolated checkout, preserving user work. Later database rollback must not revive withdrawn or unsafe destinations; it belongs in B03/B09 rehearsal. No migration is applied to live data this sprint.

### Acceptance

Versioned request/response/storage examples parse; bad versions, cursors, dates, private IDs and unauthorized field shapes produce specified safe outcomes in contract tests. Serialization round-trips preserve uncertainty/revisions; migration cases retain original evidence or flag manual review. A B03 implementer can identify exact collections, queries, indexes, identity boundaries and compatibility decisions without inventing a second schema.

## 8. B02d — Fixtures, inspection demonstration and integrated verification

Owner: implementer; founder/product observes the final demonstration. Point: 4 h; range 3–6 h. Dependency: B02a/b/c. This packet completes fixture coverage and integrated evidence; focused tests are built with the preceding tasks.

Store fixtures under a test-only directory with obviously fictional issuers, `.example` web domains, synthetic IDs and a visible fixture version. No real employer deadline, stipend, verification badge or fabricated contact. Production exports and public route imports must not reference them.

### Required coverage matrix

The rows below are scenarios, not a target to inflate the test count. One meaningful test may cover several rows; every row needs a named test/evidence reference.

| ID | Fixture/scenario | Required assertion |
|---|---|---|
| CT-01 | Six canonical categories; internship student/WIL and graduate; experienced general job | Correct category/subtype survives parse/project/serialize; no trade-only restriction |
| CT-02 | Other-stated/unknown internship; non-internship subtype; legacy categories | Truthful optionality; invalid combinations rejected; unsupported legacy values not relabelled |
| CT-03 | Unknown/ambiguous/conflicting fact; asserted fact without evidence | No false/zero/verified default; invalid support rejected; uncertainty preserved |
| CT-04 | Local work, different required residence, national and remote examples | Independent fields and documented filter semantics |
| CT-05 | Grade 12 OR N2, nested AND/OR, conditional provisional results | Logical grouping and original text preserved in checklist output |
| CT-06 | Missing/cyclic requirement reference, empty group, excessive nesting | Bounded validation failure, no crash or unbounded recursion |
| CT-07 | Unknown deadline, date-only, explicit time/zone, open-until-filled, invalid/leap dates | No invented precision; deterministic injected-clock result; invalid calendar values rejected |
| CT-08 | Salary/stipend/tuition/books, mixed currencies/periods, unknown amount, stated zero | Separate components; no fabricated total/monthly ZAR default |
| CT-09 | Sourced document constraint versus unstated age/format/size | Only actual requirements displayed; suggestions separately labelled |
| CT-10 | Successful reachability, failed recheck, confirmed closure | Check scope distinct from availability; no timeout-driven closure |
| CT-11 | Draft/review/published/closed/withdrawn/archived; withheld previously-public record | Correct public/not-public/tombstone result; unsafe destination suppressed |
| CT-12 | Private nested sentinels, unknown keys, reviewer/source payloads and unsafe text | No private output/error leak; inspection rendering escapes text |
| CT-13 | Portal/email/in-person/post, third-party issuer-directed route, unresolved destination | Route method/relationship retained; no invented active action |
| CT-14 | Explanation tied to old/new requirement revision | Stale explanation not treated as current reviewed guidance |
| CT-15 | Separate intakes, confirmed alias and unresolved merge | Stable identity; no false deduplication/redirect |
| CT-16 | Pagination boundaries, repeated/unknown params, wrong-filter/malformed cursor | Bounded deterministic contract outcomes; no internal data in errors |
| CT-17 | Storage serialization, version mismatch, missing optional field and invalid numeric values | Compatible round trip or safe rejection; no silent fact loss |
| CT-18 | Legacy salary/date/verification migration and repeated conversion | Original evidence preserved; manual-review flags; no automatic publication |
| CT-19 | Public production build and route/import inventory | No fixture content or private module leakage; preparation/denial/404 semantics retained |
| CT-20 | No secrets, model service or database configuration | Contract tests and selected web verification work without external services |

### Demonstration

Build a minimal isolated inspection view driven by the **actual canonical parser and projector**, not copied fixture markup. Show all categories, original versus explained requirements, uncertainty, sourced compensation components, public check scope, and inactive/simulated handoff. Include a private-input/public-output comparison using synthetic sentinels. The view is for reviewing the contract; it is not B04's production interface.

Preferred small implementation: a test CLI produces escaped static HTML and JSON into an ignored local artifact directory, served only by the isolated loopback prototype harness. Keep generated fixture artifacts outside Next public assets/routes and label every view. An equivalent existing isolated harness is acceptable if it imports the same tested projector and remains outside the production graph. Record the exact start/inspect command, output location and cleanup procedure.

Demonstrate one OR/conditional case, one unknown date/pay case, a withheld destination, private-field rejection and a legacy migration needing review. Inspect the new view at narrow/wide widths, with keyboard navigation and readable structured labels. Do not claim real publication, persistence, source coverage or applicant eligibility.

### Commands and CI integration

Existing commands are `pnpm web:lint`, `pnpm web:typecheck`, `pnpm web:build`, `pnpm web:test`. The boundary suite requires a fresh build. Add proposed root commands `contracts:typecheck`, `contracts:test`, and `contracts:inspect` only when their package scripts exist; these names are **planned, not currently runnable**. Define arguments/help for inspection and ensure fixture tooling is never part of production startup.

The intended verification sequence after implementing those commands is:

```sh
# In a clean candidate; install environment matches the corrected CI workflow.
pnpm install --frozen-lockfile
pnpm contracts:typecheck
pnpm contracts:test
pnpm web:lint
pnpm web:typecheck
pnpm web:build
pnpm web:test
```

Set telemetry disabled for the run; apply production environment only where the actual workflow specifies it. Add contract verification to the selected CI job with no cloud secrets. Inspect transitive imports and dependency changes; typecheck the actual affected packages and record inactive/excluded packages rather than claiming a full-monorepo pass. Keep meaningful public-boundary assertions, adapting them only to an explicitly reviewed route change. Do not suppress failures with broad casts, skipped tests or fixture fallbacks.

Final clean reproduction must include the **final candidate changes**, not merely the pre-sprint HEAD. Retain commands, environment, stdout/stderr, exit statuses and candidate identity. Hosted CI, if unavailable, remains outstanding with local evidence described accurately. Repeat checks only after relevant changes or failures, not to accumulate identical logs.

## 9. Expected file ownership and mutation surface

These are intended targets, not claims that every listed new file exists. The implementer may choose equivalent smaller files while recording the final mapping. One implementer owns shared exports/manifests/lockfile and final status; do not concurrently edit them.

| Area | Existing anchors / proposed targets | Boundary |
|---|---|---|
| Shared schema | `packages/types/src/opportunity.ts`, `src/index.ts`, new `src/opportunities/` modules and explicit legacy module | One active M0 schema, no cloud imports |
| Package/test wiring | `packages/types/package.json`, package tsconfig/tests, root `package.json`, lockfile if needed | Declared reproducible toolchain; no broad upgrades |
| Web consumer seam | `apps/web/src/types/opportunity.ts`, `src/constants/opportunityTypes.ts`, `src/lib/opportunities.ts`, actual importers | Replace active duplicates or make compatibility explicit; preserve empty public behavior |
| Persistence specification | Canonical contract doc plus a focused schema/query mapping; optional pure types in `packages/database` | No SDK/client claimed or deployed without implementation |
| Fixtures and inspection | `packages/types/tests/fixtures/` and test tooling; isolated prototype harness if reused | Fictional, test-only, loopback, excluded from production assets |
| Verification | `.github/workflows/ci.yml`, `apps/web/tests/public-boundary.test.mjs`, new contract tests | Contract + public-boundary checks; real HTTP statuses |
| Current docs | Engineering 04/07/11/12/13 as affected; planning status; review disposition | Record implemented versus proposed and compatibility once |
| Evidence | New dated candidate directory under `docs/current/quality/evidence/m0/` | Track sanitized `.txt`/JSON/Markdown; do not overwrite historical evidence |

Preserve prototype source and unrelated user changes. No deletion of dormant workspace packages merely to get a selected pass. Any unavoidable compatibility break requires a named consumer, migration decision and test or explicit exclusion before merge review.

## 10. Evidence, decisions and blocker records

Create the evidence directory when execution begins, using the actual date/candidate, not this plan as proof. Suggested artifacts:

| Artifact | Contents |
|---|---|
| `README.md` | Candidate/base, scope, environment, command results, evidence links, task/gate disposition and exclusions |
| `review-disposition.md` | R1–R11 and P3 corrections, evidence and remaining owners |
| `g0-decision.md` | G0.1–G0.7 results, actual participant reference and actual founder decisions or pending state |
| `contract-decisions.md` | Names/defaults/bounds, legacy mapping, public/internal split, version policy and rationale |
| `contract-coverage.md` | CT-01–20 → actual tests/results, applicable partial DCF cases and deferred integrated acceptance |
| `api-storage-compatibility.md` | Request/response examples, query/index map, collections, migration and rollback compatibility |
| Command outputs | Tracked sanitized `.txt` logs with actual command and exit status; portable links |
| Browser evidence | Actual view dimensions, controls/tasks, screenshots and measured conditions; unsupported metrics labelled |
| `handoff.md` | Delivered files, actual effort, residual range, blockers, G0/B02 disposition and next eligible task |

Do not put private observation notes or credentials in this bundle. Public research summaries use pseudonymous safe references to separately stored records. Before handoff inspect all links from committed/candidate files, verify logs are not ignored, and check that the SHA/patch matches the tested content. Evidence filenames alone are not evidence.

Decision/blocker template:

```text
ID / parent task:
Question or failed requirement:
Observed evidence / candidate:
Recommended choice and alternatives:
Owner / needed-by checkpoint / next review date:
Status: proposed | confirmed | blocked | resolved
Confirmation reference, if any:
Affected work / independent work that may continue:
Effort or calendar consequence:
```

Unknown provider access, source permission and deployment funding are tracked for their dependent B03/B09/B10 tasks. They do not require provisioning during B02. No confirmation is inferred from silence, a document's uppercase status or an agent's summary.

## 11. Risk handling and stop conditions

| Risk/trigger | Required response |
|---|---|
| Corrections incomplete or evidence belongs to old candidate | Reopen affected item; fix/retest before counting it complete |
| Participant or capacity confirmation unavailable | Keep G0 open; finish materials and bounded contract spike only; record owner/date |
| Legacy shared exports break unrelated agents | Use explicit compatibility boundary; do not broaden into all-agent repair or silently leave active imports broken |
| Requirement/deadline model loses meaning | Stop downstream projection/API work; correct schema and adversarial cases first |
| Private data or fixture appears in public output/build | Block acceptance; remove the path and rerun privacy/boundary checks |
| Store/SDK unexpectedly needed for a pure test | Separate adapter from domain logic; keep offline deterministic tests; re-estimate actual integration separately |
| Package/test runner change cannot reproduce | Repair declared dependency/lockfile/tooling; do not use a global local-only installation as proof |
| Actual task hours exceed checkpoint | Reforecast remaining tasks and split iteration; preserve reserve/scope/tests |
| Unresolved policy or source semantics | Retain explicit unknown/review-needed state; no invented equivalence or publication |
| New hosted access/action is required | Prepare reviewable artifact; request only the missing authority/access for that action; continue independent local work |

## 12. Definition of done and sprint review

B02 is verified only when every item below has evidence:

- G0's required subcriteria are actually closed, or the work is explicitly reported as a partial contract spike with B02 open.
- One runtime-validated active M0 contract supports six categories, both internship routes and general jobs; legacy consumers are mapped and isolated deliberately.
- Source facts, original requirements, alternatives/conditions, unknown deadlines, practical conditions and mixed compensation survive without fabricated defaults.
- Public projection is a validated whitelist; draft/private/withheld states and unsafe destinations have tested outcomes.
- API/storage/version/migration contracts are coherent, with executable examples and safe failures, and no unsupported claim of live persistence.
- CT-01–20 have actual coverage references; focused tests and the selected clean verification sequence pass for the final candidate.
- The isolated inspection demonstration uses the real parser/projector, is labelled fictional and passes its scoped browser checks.
- Production remains an honest empty/preparation surface; no new personal action, fixture catalogue or unaudited cloud integration is exposed.
- Evidence is portable, sanitized and candidate-specific; local/hosted, proposed/implemented and prototype/participant results remain distinct.
- Current status, contract documentation, actual effort, capacity forecast and B03 handoff agree; no critical schema/privacy/compatibility failure remains open.

Sprint review agenda: demonstrate the contract and its negative cases; inspect review-fix evidence; read the test/coverage matrix; inspect a public/private diff; check migration compatibility; compare actual versus planned effort; decide G0 and B02 separately; assign carry-over and next owners.

Possible outcomes:

1. **G0 closed + B02 verified:** next eligible implementation is B03a, subject to source permission, operator ownership and the chosen fetch/store/auth boundaries. G1 stays open until B03's real reviewed persistent publication and correction tests pass.
2. **G0 open + contract spike delivered:** useful schema/test work is retained, with no B02 completion claim and no B03 activation.
3. **G0 closed + B02 partial:** accept completed task evidence, schedule unfinished tasks next and shift downstream dates. No category or accepted feature disappears.

Passing B02 is not G1, G4, G5 or REL-M0. The next sprint establishes the executable contract for a trustworthy catalogue; B03 supplies real reviewed persistence, and B04–B10 complete the working MVP.

## 13. B03 handoff contents

Provide the B03 implementer with canonical import paths, schema/version policy, projection function and result types, source/requirement/check fixtures, repository interface, collection/query/index map, intended API examples, migration warnings, publication/withholding invariants and the exact verification commands. List unresolved source permission, review ownership, access and workload decisions with owners. Keep future production emulator guards, connection-time fetch validation, operator authorization, atomic publication/cache invalidation and real persistence/restart tests as explicit B03 acceptance items; a B02 schema never proves those controls.

## 14. Ready-to-use executor instruction

> Execute `docs/current/planning/06_NEXT_SPRINT_IMPLEMENTATION_PLAN.md` in the actual Skilved workspace. First reconcile HEAD and user changes with the plan's `5fd878d` baseline and inspect applicable instructions. Treat every current completion claim as candidate-specific evidence to verify. Produce the task/status/decision checkpoint, then implement authorized local work in the order N01, N02/N03, B02a, B02b, B02c, B02d. Honour the application's review requirements without inventing additional approval gates. Keep unresolved participant/capacity dependencies visible; the bounded contract spike is allowed but cannot close G0/B02. Preserve the full agreed scope, legacy work and empty public boundary. Do not deploy, provision, contact participants, process real applicant data, push/merge or publish fixtures from this planning instruction. Add the declared contract test/inspection commands, verify the final candidate in a clean environment, retain portable sanitized evidence and finish with task results, actual blockers, G0/B02 disposition and B03 handoff. Do not start B03 automatically. If scope exceeds confirmed capacity, split at an accepted task boundary and carry the remainder forward with tests intact.

## 15. Verification of this planning change

On 25 September, read-only checks covered the six changed/new Markdown files: 133 local links resolved, fenced blocks balanced, no trailing whitespace, CT-01–20 appeared once each as coverage rows, and task/range/capacity arithmetic passed. Tracked changes passed `git diff --check`; the new plan was checked separately. The repository PowerShell documentation checker was attempted but blocked by the Windows unsigned-script policy for the UNC path. No security setting was changed; focused Python checks ran through WSL instead. These checks validate the planning artifacts only. No application tests, new implementation, participant observation or cloud action were executed by this planning task.
