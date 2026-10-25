# Current catalogue staging runtime

This directory packages the current Next website and the current bounded RecentJobs worker. It does not deploy the legacy agents or Terraform stack. The images accept only `skilved-staging`; they cannot point at `skilved-dev` or `skilved-prod`.

The website enables catalogue reads from persistent Firestore, with reports, suggestions and AI disabled. Cloud Run must require authenticated invocation. It reads the normal public projection; private drafts are not feed entries. An empty database therefore produces an empty catalogue, not a demonstration listing.

The worker job remains disabled in the template. No scheduler is included. Its launcher requires explicit activation, a reviewed source ID and revision, a verified workload identity, shadow mode, employer crawling off and an ingest-only application grant. The ordinary worker retains its own transactional authority, budget, freshness and publication checks. Gemini still cannot publish automatically.

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

The persistent database must receive a reviewed migration of existing source versions, jobs, captures, origins/import receipts, decisions, caches, spent source allowances and Gemini usage/availability. Preserve document IDs and the first acquisition/publication timestamps. An empty cloud database is not permission to repeat exhausted experiments. Keep accepted drafts and public projections separate from private assessments, and never extend accepted expiry through migration.

`SKILVED_GEMINI_PROJECT_ID` identifies the actual Google project owning the Gemini key, which can differ from `skilved-staging`. Set the verified value and model-limit configuration consistently across every process sharing that provider project. An isolated database does not automatically share counters with a local worker: import/reconcile the shared ledger, then prevent simultaneous workers using divergent databases. A newly registered source or fresh job must not reset an existing allowance or undated origin.

Only after that review, replace the existing source ID/revision placeholders, mount the provider key from its staging secret, add the source-scoped raw `m0_workers` grant (actor ID is `worker_` plus the first 40 hex characters of SHA-256 of the service-account email), and explicitly change `SKILVED_STAGING_WORKER_ENABLED` to `true`. Grant only `roles: ["ingest"]`; no publish role. Run one job execution first. The job has one task, no automatic retry and no scheduler. Review persistent exceptions and draft output before adding scheduling.

Remaining release work includes the real-source normal draft writer check, approved staging feed visibility, direct original application destination verification, expiry/correction/withdrawal and rollback checks, plus monitoring and scheduled recovery. These build artifacts do not claim those checks have passed.
