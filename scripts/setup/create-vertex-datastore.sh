#!/usr/bin/env bash
set -euo pipefail

PROJECT="skilved-dev"

echo "=== Step 9: Create Vertex AI Search Data Store ==="

if gcloud discovery-engine data-stores describe skilved-opportunities \
  --project="${PROJECT}" --location=global &>/dev/null; then
  echo "Data store skilved-opportunities already exists."
else
  gcloud discovery-engine data-stores create skilved-opportunities \
    --project="${PROJECT}" \
    --location=global \
    --display-name="Skilved Opportunities" \
    --industry-vertical=GENERIC \
    --content-config=CONTENT_REQUIRED
  echo "Created Vertex AI Search data store."
fi

echo "Vertex AI Search configured."
