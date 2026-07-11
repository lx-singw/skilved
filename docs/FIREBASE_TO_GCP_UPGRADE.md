# Firebase → Full GCP Upgrade Guide

When your billing account is open (or you get Google for Startups credits),
run the original GCP scripts **in addition to** the Firebase setup — they pick
up from where Firebase left off.

---

## Service Mapping: Firebase (Now) → GCP (Later)

| What you need | Firebase Spark (free, now) | GCP Upgrade (later) |
|---|---|---|
| Database | Firestore (Spark) | Firestore (same — no migration) |
| File storage | Firebase Storage | Cloud Storage with CMEK |
| Auth | Firebase Auth | Firebase Auth (same) |
| Server / API | Local dev only | Cloud Run |
| Background jobs | Firebase Functions (limited) | Cloud Run + Cloud Scheduler |
| Secrets | .env.local | Secret Manager |
| Encryption at rest | N/A (Spark default) | Cloud KMS |
| PII scanning | N/A | Cloud DLP |
| Semantic search | Firestore queries | Vertex AI Search |
| Analytics | N/A | BigQuery |
| Caching | In-memory | Cloud Memorystore (Redis) |
| Logs/monitoring | Firebase console | Cloud Logging + Monitoring |

## When to Upgrade

| Trigger | Upgrade step |
|---|---|
| Billing account opened | Run gcp-setup.sh |
| Need Cloud Run (hosted APIs) | After Step 1 + 2 of GCP setup |
| Need BigQuery analytics | After Step 10-11 |
| Need KMS encryption | After Step 7 |
| Need Vertex AI Search | After Step 9 |

## How to Upgrade

### 1 — Open billing, then run:
```bash
BILLING_ID=01575B-23EAEE-CF5627 bash scripts/setup/full-setup.sh
```

### 2 — Populate secrets
```bash
echo -n 'your-key' | gcloud secrets versions add GEMINI_API_KEY \
  --project=skilved-dev --data-file=-
```

### 3 — Remove emulator flags from .env.local
Delete the FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST, 
FIREBASE_STORAGE_EMULATOR_HOST, BIGQUERY_ENABLED=false, REDIS_ENABLED=false lines.

### 4 — Deploy to Cloud Run
```bash
gcloud run deploy skilved-web \
  --source apps/web \
  --project=skilved-dev \
  --region=africa-south1
```

## Nothing is Lost

Firestore data needs zero migration — Firebase Spark Firestore IS Cloud Firestore.
The GCP scripts are idempotent — run gcp-setup.sh anytime, it skips what exists.

## Script Map

```
scripts/setup/
├── full-setup.sh              ← Run this now (billing required) — runs both
│
├── firebase-setup.sh          ← Firebase only (free, no billing needed)
│   ├── firebase-install-cli.sh
│   ├── firebase-init-project.sh
│   ├── firebase-firestore.sh
│   ├── firebase-storage.sh
│   ├── firebase-env-setup.sh
│   └── firebase-emulator-setup.sh
│
└── gcp-setup.sh               ← GCP only (needs billing)
    ├── create-gcp-project.sh
    ├── enable-apis.sh
    ├── create-service-accounts.sh
    ├── configure-secrets.sh
    ├── create-pubsub.sh        ← NEW
    ├── create-kms.sh
    ├── create-buckets.sh
    ├── configure-dlp.sh
    ├── create-vertex-datastore.sh
    ├── create-bigquery.sh
    └── verify-setup.sh         ← NEW
```
