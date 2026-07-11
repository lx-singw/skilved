#!/usr/bin/env bash
export PATH="$HOME/google-cloud-sdk/bin:$PATH"
set -euo pipefail

PROJECT="skilved-dev"
PROJECT_NAME="Skilved Development"

echo "=== Step 1: Create GCP Project ==="

gcloud projects create "${PROJECT}" --name="${PROJECT_NAME}" || echo "Project may already exist — continuing."

echo "Link billing account..."
if [ -z "${BILLING_ID:-}" ]; then
  echo "Enter your billing account ID:"
  read -r BILLING_ID
fi
gcloud billing projects link "${PROJECT}" --billing-account="${BILLING_ID}"

echo "Project ${PROJECT} ready."
