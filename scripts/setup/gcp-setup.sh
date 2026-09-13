#!/usr/bin/env bash
export PATH="$HOME/google-cloud-sdk/bin:$HOME/.npm-global/bin:$PATH"
set -euo pipefail

# BILLING_ID can be set as an environment variable to avoid interactive prompts:
#   BILLING_ID=01575B-23EAEE-CF5627 bash scripts/setup/gcp-setup.sh
export BILLING_ID="${BILLING_ID:-}"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT="${PROJECT:-skilved-dev}"

echo "=============================================="
echo "  Skilved GCP Setup — ${PROJECT}"
echo "=============================================="
echo ""

echo "Starting ordered setup..."
echo ""

echo "--- Prerequisites ---"
echo "Make sure you have run: gcloud auth login && gcloud auth application-default login"
if [ -z "${BILLING_ID:-}" ]; then
  echo ""
  echo "TIP: Set BILLING_ID env var to skip the interactive billing prompt:"
  echo "  BILLING_ID=01575B-23EAEE-CF5627 bash scripts/setup/gcp-setup.sh"
  echo ""
fi
echo ""

# Step 1: Create GCP Project first
echo "=============================================="
echo "  Step 1: Create GCP Project"
echo "=============================================="
bash "${DIR}/create-gcp-project.sh"
echo ""

# Now set project and default region non-interactively
gcloud config set project "${PROJECT}" --quiet
gcloud config set run/region africa-south1 --quiet
gcloud config set compute/region africa-south1 --quiet 2>/dev/null || true

# Step 2
echo "=============================================="
echo "  Step 2: Enable APIs"
echo "=============================================="
bash "${DIR}/enable-apis.sh"
echo ""

# Step 3
echo "=============================================="
echo "  Step 3: Service Accounts + IAM"
echo "=============================================="
bash "${DIR}/create-service-accounts.sh"
echo ""

# Step 4
echo "=============================================="
echo "  Step 4: Secret Manager"
echo "=============================================="
bash "${DIR}/configure-secrets.sh"
echo ""

# Step 5 (new)
echo "=============================================="
echo "  Step 5: Pub/Sub Topics + Subscriptions"
echo "=============================================="
bash "${DIR}/create-pubsub.sh"
echo ""

# Step 7 (must be before Step 6 — KMS before CMEK buckets)
echo "=============================================="
echo "  Step 7: KMS Key Ring"
echo "=============================================="
bash "${DIR}/create-kms.sh"
echo ""

# Step 6 (depends on KMS)
echo "=============================================="
echo "  Step 6: Cloud Storage Buckets"
echo "=============================================="
bash "${DIR}/create-buckets.sh"
echo ""

# Step 8
echo "=============================================="
echo "  Step 8: Cloud DLP"
echo "=============================================="
bash "${DIR}/configure-dlp.sh"
echo ""

# Step 9
echo "=============================================="
echo "  Step 9: Vertex AI Search"
echo "=============================================="
bash "${DIR}/create-vertex-datastore.sh"
echo ""

# Step 10 & 11
echo "=============================================="
echo "  Step 10-11: BigQuery Dataset + Tables + Views"
echo "=============================================="
bash "${DIR}/create-bigquery.sh"
echo ""

echo "=============================================="
echo "  GCP Setup Complete for ${PROJECT}"
echo "=============================================="
echo ""
echo "Next steps:"
echo "  1. Add secret values using the commands printed by configure-secrets.sh"
echo "  2. Create Terraform state bucket and initialise:"
echo "     ENV=\"${PROJECT##*-}\""
echo "     gcloud storage buckets create gs://skilved-terraform-state-\${ENV} \\"
echo "       --project=${PROJECT} --location=africa-south1 --uniform-bucket-level-access"
echo "     cd infrastructure && terraform init \\"
echo "       -backend-config=\"bucket=skilved-terraform-state-\${ENV}\" \\"
echo "       -backend-config=\"prefix=${PROJECT}\""
echo "  3. Run: BILLING_ID=${BILLING_ID:-<your-billing-id>} bash scripts/setup/firebase-setup.sh"
echo "  4. Run: bash scripts/setup/verify-setup.sh  (to confirm everything was provisioned)"
