#!/usr/bin/env bash
# full-setup.sh — Run the complete Skilved setup: Firebase first, then GCP.
# Usage:
#   BILLING_ID=01575B-23EAEE-CF5627 bash scripts/setup/full-setup.sh
#
# Prerequisites:
#   1. gcloud auth login
#   2. gcloud auth application-default login
#   3. firebase login (or firebase login --no-localhost for WSL)

export PATH="$HOME/google-cloud-sdk/bin:$HOME/.npm-global/bin:$PATH"
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# BILLING_ID is required — passed as env var or fallback to interactive
export BILLING_ID="${BILLING_ID:-}"

echo ""
echo "============================================================"
echo "  Skilved — Full Cloud Setup"
echo "  Firebase + Full GCP (billing required)"
echo "============================================================"
echo ""

if [ -z "${BILLING_ID:-}" ]; then
  echo "Enter your GCP Billing Account ID (e.g. 01575B-23EAEE-CF5627):"
  read -r BILLING_ID
  export BILLING_ID
fi

echo ""
echo "============================================================"
echo "  PHASE 1: Full GCP Setup"
echo "============================================================"
BILLING_ID="${BILLING_ID}" bash "${DIR}/gcp-setup.sh"

echo ""
echo "============================================================"
echo "  PHASE 2: Firebase Setup"
echo "============================================================"
bash "${DIR}/firebase-setup.sh"

echo ""
echo "============================================================"
echo "  PHASE 3: Terraform State Bucket"
echo "============================================================"
PROJECT="skilved-dev"
TF_BUCKET="skilved-terraform-state-dev"
if gcloud storage buckets describe "gs://${TF_BUCKET}" &>/dev/null; then
  echo "Terraform state bucket gs://${TF_BUCKET} already exists."
else
  gcloud storage buckets create "gs://${TF_BUCKET}" \
    --project="${PROJECT}" \
    --location=africa-south1 \
    --uniform-bucket-level-access
  echo "Created Terraform state bucket: gs://${TF_BUCKET}"
fi

echo ""
echo "============================================================"
echo "  PHASE 4: Verify Everything"
echo "============================================================"
bash "${DIR}/verify-setup.sh"

echo ""
echo "============================================================"
echo "  ✅ Full Setup Complete!"
echo "============================================================"
echo ""
echo "Next steps:"
echo "  1. Populate secrets:"
echo "     echo -n 'your-value' | gcloud secrets versions add GEMINI_API_KEY \\"
echo "       --project=${PROJECT} --data-file=-"
echo ""
echo "  2. Initialise Terraform:"
echo "     cd infrastructure"
echo "     terraform init \\"
echo "       -backend-config=\"bucket=${TF_BUCKET}\" \\"
echo "       -backend-config=\"prefix=${PROJECT}\""
echo "     terraform plan -var-file=environments/dev/dev.tfvars"
echo ""
echo "  3. Start local dev:"
echo "     pnpm install && pnpm dev"
