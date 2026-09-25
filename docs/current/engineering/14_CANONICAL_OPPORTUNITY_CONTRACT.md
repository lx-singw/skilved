# Canonical M0 opportunity contract — B02 implementation

Date: 25 September 2026. Engineering implementation: local, schema version 1. Formal G0/B02 acceptance remains conditional on the missing human observation and founder decisions in the delivery record. This contract does not provide persistence, authorization, source retrieval or a live catalogue.

## Entry points and compatibility

| Entry point | Purpose |
|---|---|
| `@skilved/types/opportunities` | Browser-safe category/value/public-response schemas, query/cursor validation and public requirement formatting |
| `@skilved/types/opportunities/internal` | Internal reviewed-record schema and whitelist projector; server/operator/test use only |
| `@skilved/types/opportunities/storage` | JSON serialization, alias resolution and repository interface; no client or SDK |
| `@skilved/types/opportunities/migration` | Pure legacy dry-run conversion; never publishes records |
| `@skilved/types` / `@skilved/types/legacy` | Deprecated prototype/agent compatibility; old opportunity file preserved in `src/legacy/` |

Active public catalogue code imports `PublicOpportunity` from the canonical entry. The old detail renderer is preserved under `apps/web/prototype/b02-preserved/`; the active detail route returns a real 404 until B03/B04 provide reviewed publication and its interface. Other old web types/components and inactive agent consumers remain compatibility work, not active M0 contracts. Root agent imports continue resolving their old types; this task does not claim those agents pass global tests or implement the new model.

The canonical categories are `bursary`, `learnership`, `apprenticeship`, `internship`, `graduate_programme`, `job`. Internships require subtype `student_wil`, `graduate`, `other_stated` or `unknown`; other categories cannot contain a subtype. National coverage is not a tenth province. General jobs have no mandatory trade or entry-level classification.

## Facts, logic and public boundaries

Runtime schemas use the already selected Zod 3 dependency and TypeScript 5.9.3. Schema types are inferred. Objects are strict, except the intentionally private legacy payload retained for manual review. No per-visit model call or third-party service is used.

Internal facts retain assertion ID, state, original wording, typed value, source snapshot/evidence references, extraction method and review identity/state. Uncertainty is `not_stated`, `ambiguous` or `conflicting`, with no asserted value. Optional attributed alternative values remain internal; they do not become a chosen public answer. Stated facts require wording and evidence. Public facts include approved citation IDs and omit reviewer/evidence internals. Unsupported or unreviewed assertions are withheld as unknown, not exposed as raw text.

Requirement sets retain stable atom IDs, kind, required/preferred/unclear level, structured qualifications/documents, and `all`/`any`/`if`/`unknown` relationships. Reference and coverage checks prevent missing atoms being silently omitted. Nested input is bounded before recursive validation; cycles fail. Formatting preserves grouping and explicitly unknown branches; it never determines an applicant's eligibility.

Events use canonical UTC milliseconds; deadline dates retain date-only precision, original wording and optional named timezone/time. An instant must agree with source-local date/time. A comparison returns `no_exact_instant` when exact precision is absent and never invents a close-of-day cutoff. A past instant does not itself change the source lifecycle. Compensation components keep individual currency/period/coverage and never default to a sum or a salary.

`projectOpportunity` accepts unknown input, validates the internal record and constructs every public field explicitly. Invalid input returns only `INVALID_RECORD`. Draft/review records return `not_public`. Previously public withheld/withdrawn/archived records return a minimal inactive status; never-public records reveal no tombstone. Closed details retain approved context with no active application action. Approved facts and explanations are independent: an old/unreviewed/unsupported explanation is omitted.

Application destinations require a reviewed route and a supporting scoped relationship check bound to the exact destination and record revision. Newer/equal-time contradictory checks suppress the action. Private negative safety checks still suppress actions without exposing their notes. A failed reachability check disables the affected action but does not label the opportunity closed. URL syntax validation is neither source permission nor SSRF protection; B03 must establish actual source/ATS relationships and enforce connection-time egress controls.

Bounds: 4,000-character ordinary text, 100 requirements, expression depth 12/nodes 300, bounded arrays, IDs up to 96 restricted characters, and a 500,000-byte JSON input ceiling. Input traversal rejects cycles, unsupported values, overlong strings and excessive nesting before recursive parsing. These are initial engineering bounds; revise them against permitted source evidence with explicit compatibility and resource tests.

## Future public read API

The validators/examples exist; **the `/api/v1` routes are not enabled by B02**. Current `/api/opportunities` continues to return the empty preparation response, `no-store`, and existing private/action/detail denials remain intact. Do not route the fixture inspection into Next public assets or API handlers.

| Surface | Contract |
|---|---|
| `GET /api/v1/opportunities` | Future list of approved published projections; schemaVersion, catalogueRevision, asOf, items, nextCursor |
| `GET /api/v1/opportunities/{id}` | Future discriminated opportunity/status response; private or absent IDs return the same 404 |
| Bad query/cursor | 400 with safe code, no raw input/stack/record |
| Store unavailable | 503 `SERVICE_UNAVAILABLE`; never substitute fictional or stale unsafe inventory |
| Changed catalogue while paging | 400 `STALE_CURSOR`; client deliberately restarts the query |

Query fields: optional single category/province/coverage, explicit remote boolean, trimmed keyword `q` up to 120 characters, limit 1–50 (default 20), `updated_desc` sort only, optional bounded cursor. Unknown/repeated parameters are invalid, including privilege-bearing fields. Province filtering retains national and remote records; residence is never an implicit eligibility filter. Unknown location remains browsable with no locality filter. Search reference behavior is literal case-insensitive inclusion over approved title/issuer/summary; B03 must either support it faithfully with a bounded retrieval/index strategy or revise the contract explicitly, not silently drop results through post-limit filtering.

Order is updatedAt descending, then opaque ID ascending as tie-breaker. Cursor contains version, normalized query binding, catalogue revision and last sort key. It is encoded continuation data, not a signed authorization capability. Every B03 page must reapply publication eligibility. A cursor can never grant private access. On a changed catalogue revision the caller restarts instead of combining inconsistent result windows.

Initial public cache policy remains `no-store` through B03 correctness qualification. Any later cache introduction must bound freshness and invalidate on publication, material correction, withholding, closure and confirmed alias changes, including metadata. Do not let cache rollback restore a revoked destination.

## Storage and query design for B03

The following collection names are proposed integration targets, not provisioned collections. B03 owns SDK initialization, emulator guards, authenticated identities, query/index execution, transaction tests and persistence across restart. Live cloud records were not inspected; absence of a client does not prove absence of remote data.

| Collection / key | Data and visibility | Writer / query or index requirement |
|---|---|---|
| `sources/{sourceId}` | Permitted method, access/reuse evidence, review owner, category coverage, health; private | Source operator; lookup by ID, bounded due-review schedule |
| `source_snapshots/{snapshotId}` | Source/version/hash/retrieval and permitted retained evidence; private by default | Ingestion identity; sourceId + retrievedAt descending; content retention governed separately |
| `opportunity_drafts/{id}` | Validated internal record with schemaVersion/revision; never public | Operator/ingestion permissions separated; lifecycle + updatedAt + ID review queue |
| `opportunity_versions/{id_revision}` | Immutable reviewed version and requirement/check references | Authorized review transaction; opportunityId + revision |
| `requirement_sets/{id_revision}` | Versioned logic and evidence; raw/private form | Reviewed writer; exact ID/revision lookup |
| `source_checks/{checkId}` | Scope, outcome, exact record revision/destination and private notes | Source reviewer; opportunityId + scope + checkedAt descending |
| `public_opportunities/{id}` | Validated projection only; derived discovery keys kept separately from private source payload | Publication transaction; lifecycle + updatedAt descending + ID ascending; add category and geographic retrieval indexes for supported queries |
| `opportunity_aliases/{fromId}` | Confirmed/reversed identity decision and target; only approved safe resolution public | Operator review; exact ID lookup, bounded chain, cycle rejection |
| `catalogue_state/current` | Monotonic publication revision for cursor consistency | Same publication transaction as projection/invalidation intent |

A combined province/national/remote filter needs a bounded union or a derived geographic search index; a single equality query is insufficient. Before shipping B03, test the selected index/query design against the reference matcher, pagination and completeness cases. No full-text capability is claimed for the store by this contract. Permission/access/reuse evidence is a distinct source-register responsibility; a reachable HTTPS citation does not grant collection rights.

Store canonical JSON values, including explicit nulls and UTC strings; do not serialize undefined, Date objects or non-finite numbers implicitly. Requirement expression child arrays occur inside node objects; adapters must validate provider limits and their final encoding. `serializeRecord`/`deserializeRecord` round-trip schema version 1; no database SDK is involved.

Atomic publication must check server-derived operator identity, expected draft revision, review approval and current risk disposition, then write the version/public projection/catalogue revision and invalidation intent together. Handle conflicts explicitly; no client-provided operator ID is authoritative. Repository interface operator parameters denote a verified internal context, not request fields. Invalidation dispatch must be restartable and preserve deletion/withholding intent. These controls are B03 work, not implemented by an interface signature.

## Migration and rollback

`migrateLegacy` accepts the known shared legacy shape and returns a private `manual_review` envelope preserving the input. Compatible category is only a candidate; unsupported categories remain null. Legacy salary defaults, `isVerifiedSource`, missing deadline and quality scores never create approved facts. Unknown schema versions fail. Existing version-1 records validate unchanged. Reprocessing a review envelope is idempotent. No network or data writes occur.

Web-specific prototype objects remain isolated and must be mapped deliberately if later needed; this converter does not pretend to support every historical shape. Root legacy compatibility remains until all named consumers migrate. Inventory: analyst/extractor, scout/runner/BaseCrawler, quality/scorer, matching/matcher and application/pre-flight still use shared legacy opportunities; their feature activation remains later work. Other root helper enums/user types are preserved.

Before a real migration: inventory actual records, retain permitted original evidence, dry-run conversions, resolve required manual reviews, prove old-reader/new-reader compatibility and preserve IDs/intakes. Revert local code by reverting scoped changes while retaining user work; do not apply a destructive store rollback. Withholding/withdrawal state and current destinations must survive any later recovery. B09 must rehearse this with real persistence.

## Verification and demonstration

Run `pnpm contracts:typecheck`, `pnpm contracts:test`, then the selected web lint/typecheck/build/test sequence. Tests compile the contract using its declared TypeScript development dependency and run Node's test runner; no global runner, secrets, model or cloud SDK is required. CT-01–18/20 are named in contract tests; CT-19 is a production-build HTTP/asset boundary test. Additional cases exercise private safety checks and escaped inspection rendering.

Run `pnpm contracts:inspect --serve --port 39202` for the loopback-only fictional demonstration. `--help` documents arguments; `--fixture ID` limits inspection. Generated HTML/public JSON live in ignored `.artifacts/contracts/`, outside Next routing/assets. The demonstration uses actual parser/projector output, includes uncertainty/withholding/migration cases, and never navigates to an application destination. `/prototype` serves the corrected B01 task harness for observation preparation.

See the [candidate evidence and limitations](../quality/evidence/m0/2026-09-25-b02-contracts/README.md). Schema correctness does not establish source truth, legal reuse permission, production authorization, physical-device performance, participant comprehension or successful delivery of the complete MVP.
