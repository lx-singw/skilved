#!/usr/bin/env bash
set -euo pipefail

PROJECT="${PROJECT:-skilved-dev}"

echo "=== Step 7: Configure Cloud KMS Key Ring ==="

gcloud kms keyrings create skilved-documents \
  --project="${PROJECT}" \
  --location=africa-south1 \
  --quiet 2>/dev/null || echo "Key ring skilved-documents already exists."

gcloud kms keys create document-encryption-key \
  --project="${PROJECT}" \
  --location=africa-south1 \
  --keyring=skilved-documents \
  --purpose=encryption \
  --rotation-period=7776000s \
  --next-rotation-time="$(date -u -d '+90 days' +%Y-%m-%dT%H:%M:%SZ)" \
  --quiet 2>/dev/null || echo "Key document-encryption-key already exists."

echo "KMS key ring and encryption key ready."
