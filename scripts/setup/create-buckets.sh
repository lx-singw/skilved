#!/usr/bin/env bash
set -euo pipefail

PROJECT="${PROJECT:-skilved-dev}"
ENV="${PROJECT##*-}"
KMS_KEY="projects/${PROJECT}/locations/africa-south1/keyRings/skilved-documents/cryptoKeys/document-encryption-key"

echo "=== Step 6: Create Cloud Storage Buckets with CMEK ==="

# Ensure Cloud Storage service agent exists and grant KMS access
gcloud storage service-agent --project="${PROJECT}" &>/dev/null || true

PROJECT_NUMBER=$(gcloud projects describe "${PROJECT}" --format="value(projectNumber)")
GCS_SA="service-${PROJECT_NUMBER}@gs-project-accounts.iam.gserviceaccount.com"

echo "Granting KMS access to Cloud Storage service account: ${GCS_SA}..."
gcloud kms keys add-iam-policy-binding document-encryption-key \
  --project="${PROJECT}" \
  --location=africa-south1 \
  --keyring=skilved-documents \
  --member="serviceAccount:${GCS_SA}" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter" --quiet

# Brief sleep for IAM propagation
sleep 5

create_bucket() {
  local name="$1" location="$2" class="$3" encrypt="$4"
  if gcloud storage buckets describe "gs://${name}" &>/dev/null; then
    echo "Bucket gs://${name} already exists, skipping."
    return
  fi
  local args=(
    gcloud storage buckets create "gs://${name}"
    --project="${PROJECT}"
    --location="${location}"
    --default-storage-class="${class}"
    --uniform-bucket-level-access
  )
  if [ "${encrypt}" = "true" ]; then
    args+=(--default-encryption-key="${KMS_KEY}")
  fi
  "${args[@]}"
  echo "Created bucket: gs://${name}"
}

create_bucket "skilved-documents-${ENV}" "africa-south1" "STANDARD" "true"
create_bucket "skilved-identity-${ENV}" "africa-south1" "STANDARD" "true"
create_bucket "skilved-screenshots-${ENV}" "africa-south1" "STANDARD" "false"
create_bucket "skilved-government-reports-${ENV}" "africa-south1" "STANDARD" "false"
create_bucket "skilved-audit-logs-${ENV}" "africa-south1" "STANDARD" "false"

# Enable versioning on document and identity buckets
gcloud storage buckets update "gs://skilved-documents-${ENV}" --versioning 2>/dev/null || true
gcloud storage buckets update "gs://skilved-identity-${ENV}" --versioning 2>/dev/null || true

# Retention policy on identity bucket (1 year = 31536000s)
gcloud storage buckets update "gs://skilved-identity-${ENV}" --retention-period=31536000 2>/dev/null || true

# Lifecycle rule on documents bucket
cat > /tmp/lifecycle.json << 'EOF'
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"numNewerVersions": 3}
    }
  ]
}
EOF
gcloud storage buckets update "gs://skilved-documents-${ENV}" --lifecycle-file=/tmp/lifecycle.json 2>/dev/null || true
rm -f /tmp/lifecycle.json

# Bucket-level IAM
SA_PREFIX="${PROJECT}.iam.gserviceaccount.com"

# skilved-document-service: full admin on documents + identity
gcloud storage buckets add-iam-policy-binding "gs://skilved-documents-${ENV}" \
  --member="serviceAccount:skilved-document-service@${SA_PREFIX}" \
  --role="roles/storage.objectAdmin" 2>/dev/null || true

gcloud storage buckets add-iam-policy-binding "gs://skilved-identity-${ENV}" \
  --member="serviceAccount:skilved-document-service@${SA_PREFIX}" \
  --role="roles/storage.objectAdmin" 2>/dev/null || true

# skilved-agents: viewer on documents, admin on screenshots
gcloud storage buckets add-iam-policy-binding "gs://skilved-documents-${ENV}" \
  --member="serviceAccount:skilved-agents@${SA_PREFIX}" \
  --role="roles/storage.objectViewer" 2>/dev/null || true

gcloud storage buckets add-iam-policy-binding "gs://skilved-screenshots-${ENV}" \
  --member="serviceAccount:skilved-agents@${SA_PREFIX}" \
  --role="roles/storage.objectAdmin" 2>/dev/null || true

# skilved-verification: viewer on documents
gcloud storage buckets add-iam-policy-binding "gs://skilved-documents-${ENV}" \
  --member="serviceAccount:skilved-verification@${SA_PREFIX}" \
  --role="roles/storage.objectViewer" 2>/dev/null || true

echo "Storage buckets and IAM configured."
