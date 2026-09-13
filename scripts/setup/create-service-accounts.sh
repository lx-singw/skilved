#!/usr/bin/env bash
export PATH="$HOME/google-cloud-sdk/bin:$PATH"
set -euo pipefail

PROJECT="${PROJECT:-skilved-dev}"

echo "=== Step 3: Create Service Accounts + IAM Bindings ==="

gcloud iam service-accounts create skilved-web \
  --project="${PROJECT}" \
  --display-name="Skilved Web Application" \
  2>/dev/null || echo "Service account skilved-web already exists, skipping."

gcloud iam service-accounts create skilved-agents \
  --project="${PROJECT}" \
  --display-name="Skilved AI Agents" \
  2>/dev/null || echo "Service account skilved-agents already exists, skipping."

gcloud iam service-accounts create skilved-document-service \
  --project="${PROJECT}" \
  --display-name="Skilved Document Microservice" \
  2>/dev/null || echo "Service account skilved-document-service already exists, skipping."

gcloud iam service-accounts create skilved-verification \
  --project="${PROJECT}" \
  --display-name="Skilved SAQA/NAMB Verifier" \
  2>/dev/null || echo "Service account skilved-verification already exists, skipping."

gcloud iam service-accounts create skilved-admin \
  --project="${PROJECT}" \
  --display-name="Skilved Admin" \
  2>/dev/null || echo "Service account skilved-admin already exists, skipping."

SA_PREFIX="${PROJECT}.iam.gserviceaccount.com"

# skilved-web: Firestore read/write, BigQuery write events, Secret Manager read
gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:skilved-web@${SA_PREFIX}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:skilved-web@${SA_PREFIX}" \
  --role="roles/bigquery.dataEditor"

gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:skilved-web@${SA_PREFIX}" \
  --role="roles/secretmanager.secretAccessor"

# skilved-agents: Firestore, Storage, BigQuery, Vertex AI
gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:skilved-agents@${SA_PREFIX}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:skilved-agents@${SA_PREFIX}" \
  --role="roles/bigquery.dataEditor"

gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:skilved-agents@${SA_PREFIX}" \
  --role="roles/aiplatform.user"

# skilved-document-service: Firestore, BigQuery, KMS encrypt/decrypt
gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:skilved-document-service@${SA_PREFIX}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:skilved-document-service@${SA_PREFIX}" \
  --role="roles/bigquery.dataEditor"

gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:skilved-document-service@${SA_PREFIX}" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"

# skilved-verification: Firestore
gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:skilved-verification@${SA_PREFIX}" \
  --role="roles/datastore.user"

# skilved-admin: Firestore read, BigQuery read
gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:skilved-admin@${SA_PREFIX}" \
  --role="roles/datastore.viewer"

gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:skilved-admin@${SA_PREFIX}" \
  --role="roles/bigquery.dataViewer"

echo "All service accounts and IAM bindings created for ${PROJECT}."
