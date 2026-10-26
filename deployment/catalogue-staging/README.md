# Current catalogue staging runtime

This directory packages the current Next website and the current bounded RecentJobs worker. It does not deploy the legacy agents or Terraform stack. The images accept only `skilved-staging`; they cannot point at `skilved-dev` or `skilved-prod`.

The website enables catalogue reads from persistent Firestore, with reports, suggestions and AI disabled. Cloud Run must require authenticated invocation. It reads the normal public projection; private drafts are not feed entries. An empty database therefore produces an empty catalogue, not a demonstration listing.

The worker job remains disabled in the template. No scheduler is included. Its launcher requires explicit activation, a reviewed source ID and revision, a verified workload identity, shadow mode, employer crawling off and an ingest-only application grant. Cloud Gemini workers also require a matching quota-authority epoch, checked transactionally before each operation. The ordinary worker retains its budget, freshness and publication checks. Gemini still cannot publish automatically.

## Build and local verification

Run from the repository root under Linux/WSL:

```sh
node --test deployment/catalogue-staging/runtime/guards.test.mjs
docker build --target worker -f deployment/catalogue-staging/Dockerfile -t skilved-catalogue-staging-worker:local .
docker build --target web -f deployment/catalogue-staging/Dockerfile -t skilved-catalogue-staging-web:local .
docker run --rm skilved-catalogue-staging-worker:local
```

The final command must exit 1 with `STAGING_CONFIGURATION_REQUIRED`. It makes no database or provider calls. The adjacent `Dockerfile.dockerignore` allowlists only the required source, manifests and runtime files. Environment files, credentials, `.git`, node_modules and `.artifacts` are excluded from the build context. Do not substitute a broad remote source upload such as `gcloud builds submit .`; its ignore mechanism is separate. The images run as the unprivileged `node` user. Pin the built image digest when deploying.

For an isolated website container startup check without cloud credentials:

```sh
docker run --rm --name skilved-staging-web-check -p 127.0.0.1:8080:8080 \
  -e SKILVED_STAGING_PROJECT=skilved-staging \
  -e SKILVED_CATALOGUE_PROJECT=skilved-staging \
  -e SKILVED_CATALOGUE_MODE=cloud -e SKILVED_CATALOGUE_READS=true \
  -e SKILVED_CATALOGUE_REPORTS=false -e SKILVED_SUGGESTIONS_ENABLED=false \
  -e SKILVED_AI_MODE=disabled skilved-catalogue-staging-web:local
```

Without ADC this proves HTTP startup only; the catalogue endpoint will fail closed with 503. It is not a database integration check.

## Cloud prerequisites and deployment

1. Provision a dedicated `skilved-staging` project and its `(default)` Firestore database in an approved region. Enable required APIs. Cloud Run and image storage need working project billing. Project/database creation does not prove hosting eligibility.
2. Apply this directory's deny-all client Firestore rules explicitly to staging. Do not deploy the root legacy rules. The Admin SDK uses IAM and bypasses these rules, so service account permissions remain essential. This directory's empty index file is a baseline for a new database; deploy only rules unless index changes are deliberate.
3. Use separate keyless service accounts: `catalogue-staging-web@skilved-staging.iam.gserviceaccount.com` with database read access, and `catalogue-staging-worker@skilved-staging.iam.gserviceaccount.com` with database read/write access. Give only the worker access to the one Gemini secret. Neither needs project Editor/Owner, BigQuery, all-secret access or a downloaded key. Web's IAM read role is database-wide; there is no collection boundary in this image.
4. Push the locally built images to an approved staging Artifact Registry repository. Replace image placeholders in copies of the YAML with immutable image digests. Keep these deployment copies outside tracked files if they contain private settings. Deploy the web service with authenticated invocation and give only named staging testers `roles/run.invoker`. The `ingress: all` annotation permits reaching the authenticated endpoint; it does not grant public invocation. IAM policy lives outside this YAML: after deployment, verify there is no `allUsers` or `allAuthenticatedUsers` binding and that the invoker IAM check is enabled, including when replacing an existing service. Do not disable that check or reuse the legacy module that grants public invocation.
5. Confirm a real ADC read through the deployed service's versioned catalogue API. Empty results are a valid initial persistent-database check. A normal worker draft remains private until a separately reviewed staging publication; no fixture is written to the production feed.

Example rules deployment, from the repository root:

```sh
firebase deploy --project skilved-staging --config deployment/catalogue-staging/firebase.json --only firestore:rules
```

For a new project, create the two keyless identities and minimal data roles explicitly (skip creation when the identities already exist):

```sh
gcloud iam service-accounts create catalogue-staging-web --project skilved-staging
gcloud iam service-accounts create catalogue-staging-worker --project skilved-staging
gcloud projects add-iam-policy-binding skilved-staging \
  --member=serviceAccount:catalogue-staging-web@skilved-staging.iam.gserviceaccount.com --role=roles/datastore.viewer
gcloud projects add-iam-policy-binding skilved-staging \
  --member=serviceAccount:catalogue-staging-worker@skilved-staging.iam.gserviceaccount.com --role=roles/datastore.user
```

Provisioning the worker identity does not activate ingestion: no application grant, source registration, provider secret permission, job execution or scheduler is implied by those commands.

The YAML templates contain no service-account keys, provider keys, IAM public bindings or scheduled triggers. `worker.job.yaml` points to a pinned Secret Manager version that must be created separately; it is never a build argument or a website environment variable.

## Before activating the worker

The [private-feed acceptance check](../../docs/current/operations/186_STAGING_PRIVATE_READS_AND_LIFECYCLE_2026-10-26.md) now verifies real persistent reads under the delegated staging web identity, denied database writes, an empty feed and 404 for all five drafts. It does not verify attached hosted identity or deploy a website. The normal CLI can repeat the read acceptance check under an existing keyless authentication setup, with the same web identity and staging flags:

```sh
NODE_ENV=production \
SKILVED_STAGING_PROJECT=skilved-staging \
SKILVED_CATALOGUE_PROJECT=skilved-staging \
SKILVED_CATALOGUE_MODE=cloud \
SKILVED_CATALOGUE_READS=true \
SKILVED_CATALOGUE_REPORTS=false \
SKILVED_SUGGESTIONS_ENABLED=false \
SKILVED_AI_MODE=disabled \
pnpm --filter @skilved/catalogue check:staging-reads
```

Do not load provider keys or emulator settings into this read-only process. The CLI uses ADC, checks existing unapproved private drafts and requires an empty public catalogue. It does not create authentication, attest the caller's IAM role or replace hosted identity verification. It deliberately fails after public listings exist; use the normal catalogue API for later operational checks. The real delegated check supplied its authenticated client in memory without installing global ADC. Publication, correction, expiry and withdrawal were rehearsed separately in an isolated emulator, with no cloud publication.

The persistent database must receive a reviewed migration of existing source versions, jobs, captures, origins/import receipts, decisions, caches, spent source allowances and Gemini usage/availability. Preserve document IDs and the first acquisition/publication timestamps. An empty cloud database is not permission to repeat exhausted experiments. Keep accepted drafts and public projections separate from private assessments, and never extend accepted expiry through migration.

`SKILVED_GEMINI_PROJECT_ID` identifies the actual Google project owning the Gemini key, which can differ from `skilved-staging`. Set the verified value and model-limit configuration consistently across every process sharing that provider project. An isolated database does not automatically share counters with a local worker: import/reconcile the shared ledger, then prevent simultaneous workers using divergent databases. A newly registered source or fresh job must not reset an existing allowance or undated origin.

Every cloud Gemini `RecentJobsWorker` requires `SKILVED_GEMINI_AUTHORITY_PROJECT` equal to its catalogue database project and `SKILVED_GEMINI_AUTHORITY_EPOCH` equal to the active record's 64-character lowercase hex epoch. The record is `m0_model_authorities/<provider-scope-hash>` with a single `json` field containing `version:1`, `provider:"gemini"`, `scopeHash`, `projectId`, `epoch`, `status:"active"`, reviewed `migrationSha256`, original `quotaSha256` and canonical UTC `activatedAt`. Missing, malformed, future, revoked or mismatched records block operations before their writes. The staging launcher requires the authority settings even before SDK initialization; the template epoch remains an invalid placeholder. Setting environment variables does not create authority or an application grant.

The database containing the authority also contains source budgets, jobs, usage and provider cooldowns. Each worker transaction reads the authority, so epoch changes conflict with concurrent reservations and stale clients reject on retry. Requests already admitted by committed reservations cannot be recalled. Before activation or rotation, stop and drain all old callers and reconcile outstanding reservations and the complete ledger. Keep the imported history receipt immutable; the importer refuses targets containing quota authority.

The [registered provider routing policy](../../packages/catalogue/src/ai/gemini-authority-routes.mjs) now binds Skilved's shared Gemini scope to staging's default database and the reviewed epoch. Use that epoch when replacing the template placeholder. Registered scopes cannot use emulator ledgers, even when authority settings are omitted. Native Gemini transport requires admission context from a committed worker reservation; registered scopes require context for injected transports too. Standalone extraction and old emulator-pilot entry points in current code therefore fail before a provider request. Unregistered synthetic mock tests can still run locally. This is not an API-key security boundary against arbitrary code or older external checkouts.

The [cutover module](../../packages/catalogue/src/gemini-authority-cutover.mjs) validates fresh drain evidence and the complete reviewed replica, then atomically creates authority and its immutable handoff receipt without changing history or granting execution. Exact immediate retries are read-only. The [managed cutover report](../../docs/current/operations/184_MANAGED_GEMINI_QUOTA_AUTHORITY_CUTOVER_2026-10-25.md) records the real verification and remaining limits. An active quota authority still needs a separately reviewed source-scoped ingest grant, verified identity and explicit job activation. Hosting and the job remain undeployed/disabled.

Only after that review, replace the existing source ID/revision placeholders, mount the provider key from its staging secret, add the source-scoped raw `m0_workers` grant (actor ID is `worker_` plus the first 40 hex characters of SHA-256 of the service-account email), and explicitly change `SKILVED_STAGING_WORKER_ENABLED` to `true`. Grant only `roles: ["ingest"]`; no publish role. Run one job execution first. The job has one task, no automatic retry and no scheduler. Review persistent exceptions and draft output before adding scheduling.

The [staging identity and normal-writer check](../../docs/current/operations/185_STAGING_INGEST_IDENTITY_AND_NORMAL_WRITER_2026-10-26.md) now verifies a Google-signed delegated worker identity, service-account Firestore access and one real CNH private draft through the normal extractor and validator. The temporary service-account-only delegation was removed and its ingest grant disabled. It does not verify attached Cloud Run identity or deploy either image. IAM policy reads can converge before token issuance; verify token readiness before activating a source, and bound any permission-only retries.

Application grants may include an optional `expiresAt` UTC timestamp. Every normal worker transaction rejects expired or malformed values. Use a short expiry for bounded staging work and deactivate the grant afterward; the source list and roles remain the authorization scope. A job ID in operator metadata is not an additional runtime restriction. Revoking delegation alone does not invalidate previously issued credentials or cancel an admitted network request. Keep admitted reservations spent if access expires before settlement.

The [employer review and publication preview](../../docs/current/operations/187_EMPLOYER_EVIDENCE_AND_PUBLICATION_PREVIEW_2026-10-26.md) prepares a private CNH correction using current employer observations. The authenticated `publication-preview` operator command shows the prospective projection without changing a draft or approving anything. Later mutation still requires a current reviewer role, exact revision, current source checks and a reason. The real CNH draft remains revision 2; its proposed employer snapshot and corrected revision exist only in the offline rehearsal. The guarded employer fetch hit the existing body limit; browser evidence was kept separate and no larger worker allowance was introduced.

Remaining release work includes reviewed staging feed visibility, approval/import of current employer evidence and destination checks, attached hosted identities, hosted website integration, operational rollback, monitoring and scheduled recovery. The read boundary and publication lifecycle have been checked under the documented delegated/emulator limits. Hosting remains undeployed, employer crawling optional/off, Gemini shadow-only and production publication disabled.
