# Persistent staging database and current runtime packaging

25 October 2026. A dedicated **`skilved-staging`** Google/Firebase project and persistent **`(default)` Firestore Native database** now exist. The database is in **`africa-south1` (Johannesburg)** with deletion protection enabled. A private connectivity record survives a separate process restart, and the existing `Catalogue.list` implementation successfully queries the real database and returns a valid empty catalogue. This supersedes the earlier status that only emulator persistence had been demonstrated.

The user explicitly chose to **keep hosting undeployed for now** after Google rejected the hosting API setup because staging has no linked billing account. Both billing accounts visible to the current account are closed. No billing account is reopened or linked, no payment is made, and no Cloud Run service/job or scheduler is deployed.

## Cloud state and access

The new project is isolated from `skilved-dev` and `skilved-prod`. Firebase is added, and Firestore, IAM and rules APIs are enabled. No existing project, database, source allowance or production service is changed.

Two keyless identities are provisioned:

| Identity | Staging data role | Activation |
|---|---|---|
| `catalogue-staging-web@skilved-staging.iam.gserviceaccount.com` | `roles/datastore.viewer` | No hosted service attached yet |
| `catalogue-staging-worker@skilved-staging.iam.gserviceaccount.com` | `roles/datastore.user` | No worker grant, provider secret permission, job or scheduler |

The staging-specific [deny-all client rules](../../../deployment/catalogue-staging/firestore.rules) are deployed using the isolated [Firebase configuration](../../../deployment/catalogue-staging/firebase.json). An unauthenticated REST read of the private connectivity record returns **403 `PERMISSION_DENIED`**. Project IAM has no `allUsers` or `allAuthenticatedUsers` binding. The two identities have only the data roles listed above; these roles are project/database-wide and do not establish collection-level isolation. No service-account key is created.

The cloud smoke uses the existing authenticated gcloud user's short-lived access token held only in process memory, through the installed Firestore server client and the ordinary catalogue repository. No token is saved and local ADC is not installed. This proves persistent cloud storage and the repository query. It does **not** prove the future attached Cloud Run identity, deployed website API or a hosted worker invocation.

The database contains only the private connectivity marker. It has no migrated ingestion sources, source versions, draft history, model ledger, worker application grant or public listing. An empty catalogue is the truthful initial result.

## Deployment package

The new [staging runtime package](../../../deployment/catalogue-staging/README.md) contains separate web/worker Docker targets, an allowlisted build context, startup guards, authenticated-service deployment guidance, Cloud Run templates and the isolated client rules. It packages the current Next website and bounded RecentJobs worker rather than deploying the legacy agent stack.

Both images build successfully. The Next production build, lint and type checks pass. Container checks verify the unprivileged `node` user, absence of environment files/Git/private artifacts, worker dependency imports and HTTP health **200**. Without ADC, the local web catalogue endpoint correctly returns **503**; that check is not presented as cloud feed connectivity. Five staging guard/launcher tests pass.

The website image accepts only `skilved-staging`, enables catalogue reads and keeps reports, suggestions and AI disabled. The worker template is disabled, has no automatic retry or schedule, and requires explicit source/revision admission, a verified attached identity, shadow mode, an ingest-only grant and employer crawling off. It has no authority-bootstrap or quota-reset operation. Gemini's existing publication restriction remains unchanged. Future web deployment must separately verify private invocation IAM; a YAML ingress annotation does not establish that policy.

Cloud Run, image-registry and build API activation fails with **`UREQ_PROJECT_BILLING_NOT_FOUND`**. Prepared images/templates remain local. The user's decision to leave hosting undeployed takes precedence over further deployment attempts.

## Normal draft writer: offline evidence

The [previous private CNH assessments](179_CNH_FRESH_COUNTRY_GUARD_ASSESSMENT_2026-10-25.md) used an assessment-only final write. This sprint additionally replays the successful archived CNH extraction and validation through the **unmodified normal `runJob` / `detail` / `finish` / catalogue publication writer** in a disposable emulator. Two explicitly derived cache rows and a synthetic ingest grant supply the offline setup; archived robots/HTML replace network retrieval. The clock stays at the original successful acquisition, **2026-10-25T11:40:20.326Z**, rather than claiming a fresh retrieval.

The isolated CNH draft advances revision 1 → 2 with a V2 decision. The original ATS destination and **17:40:20.326Z** expiry are retained. The other four drafts, both private assessments, origins, source revision, spent budgets, usage and model receipts remain unchanged; 384 prior documents are preserved. There are zero public records, public checks, publication watches, live source requests or provider calls. This is cached regression evidence only. It does not qualify a fresh live normal-writer run, promote the isolated draft or replace accepted history.

## Preserved state and next work

The shared provider ledger remains byte-for-byte unchanged at **151 historical calls, 458,579 known tokens and 72 unknown usages**. CNH remains **12/12** and Motus **6/6** for the source day, with their existing **26 October 00:00 SAST / 25 October 22:00 UTC** reset. All accepted runtime drafts and expiry timestamps stay unchanged. The prior **940-test complete catalogue pass** remains the unchanged application-code baseline; this sprint adds the five staging checks, container builds, real database smoke and offline writer replay.

Future ingestion still restores `.artifacts/groq/cnh-country-guard-live-2026-10-25/pilot-report.json` plus the latest shared quota ledger. The normal-writer replay is not a replacement runtime. Before any cloud worker activation, review and migrate original source versions, jobs/captures, origins/import receipt, budgets, provider exhaustion and caches without resetting identities, first acquisitions, accepted expiry or spent allowances. Keep the actual Gemini provider project as the quota scope, independently of the staging database project, and prevent divergent local/cloud workers sharing an unreconciled provider ledger.

Remaining work is a reviewed history migration, a bounded fresh normal-writer run after allowance reset, staged feed visibility and application handoff, then scheduling/recovery, corrections/expiry, monitoring and rollback. Hosted identity/API checks wait for the user's later hosting decision and an active billing link. Employer crawling remains optional/off and production publication remains disabled.

Database setup follows Google's [database management guidance](https://docs.cloud.google.com/firestore/native/docs/manage-databases) and [location reference](https://docs.cloud.google.com/firestore/native/docs/locations). Identity design follows [Firestore IAM](https://docs.cloud.google.com/firestore/docs/security/iam) and [Cloud Run service identity](https://docs.cloud.google.com/run/docs/configuring/jobs/service-identity).
