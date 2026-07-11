#!/usr/bin/env bash
export PATH="$HOME/google-cloud-sdk/bin:$PATH"
set -euo pipefail

PROJECT="skilved-dev"
PASS=0
FAIL=0

echo "=============================================="
echo "  Skilved Setup Verification — ${PROJECT}"
echo "=============================================="
echo ""

check() {
  local label="$1"
  shift
  if "$@" &>/dev/null; then
    echo "  ✅ ${label}"
    PASS=$((PASS + 1))
  else
    echo "  ❌ ${label}"
    FAIL=$((FAIL + 1))
  fi
}

# ── 1. Project & Billing ───────────────────────────────────────────────────────
echo "--- Project ---"
check "Project skilved-dev exists" \
  gcloud projects describe "${PROJECT}"
check "Billing linked" \
  gcloud billing projects describe "${PROJECT}" --format="value(billingEnabled)" | grep -q "True"
echo ""

# ── 2. APIs ───────────────────────────────────────────────────────────────────
echo "--- APIs ---"
for api in \
  run.googleapis.com \
  cloudscheduler.googleapis.com \
  pubsub.googleapis.com \
  cloudfunctions.googleapis.com \
  documentai.googleapis.com \
  storage.googleapis.com \
  cloudkms.googleapis.com \
  dlp.googleapis.com \
  firestore.googleapis.com \
  bigquery.googleapis.com \
  aiplatform.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com; do
  check "API enabled: ${api}" \
    gcloud services list --project="${PROJECT}" --filter="name:${api}" --format="value(name)" | grep -q "${api}"
done
echo ""

# ── 3. Service Accounts ───────────────────────────────────────────────────────
echo "--- Service Accounts ---"
SA_PREFIX="${PROJECT}.iam.gserviceaccount.com"
for sa in skilved-web skilved-agents skilved-document-service skilved-verification skilved-admin; do
  check "SA: ${sa}@${SA_PREFIX}" \
    gcloud iam service-accounts describe "${sa}@${SA_PREFIX}" --project="${PROJECT}"
done
echo ""

# ── 4. Secrets ────────────────────────────────────────────────────────────────
echo "--- Secret Manager ---"
for secret in \
  GEMINI_API_KEY \
  CAPTCHA_SOLVER_API_KEY \
  WHATSAPP_API_TOKEN \
  SAQA_API_URL \
  PAYFAST_MERCHANT_ID \
  PAYFAST_MERCHANT_KEY \
  ID_HASH_SALT; do
  check "Secret exists: ${secret}" \
    gcloud secrets describe "${secret}" --project="${PROJECT}"
done
echo ""

# ── 5. KMS ────────────────────────────────────────────────────────────────────
echo "--- Cloud KMS ---"
check "Key ring: skilved-documents" \
  gcloud kms keyrings describe skilved-documents --location=africa-south1 --project="${PROJECT}"
check "Key: document-encryption-key" \
  gcloud kms keys describe document-encryption-key \
    --keyring=skilved-documents --location=africa-south1 --project="${PROJECT}"
echo ""

# ── 6. Storage Buckets ────────────────────────────────────────────────────────
echo "--- Cloud Storage ---"
for bucket in \
  skilved-documents-dev \
  skilved-identity-dev \
  skilved-screenshots-dev \
  skilved-government-reports-dev \
  skilved-audit-logs-dev; do
  check "Bucket: gs://${bucket}" \
    gcloud storage buckets describe "gs://${bucket}"
done
echo ""

# ── 7. BigQuery ───────────────────────────────────────────────────────────────
echo "--- BigQuery ---"
check "Dataset: skilved_dev" \
  bq show --project_id="${PROJECT}" "skilved_dev"
for table in events outcomes agent_runs quality_decisions graph_skills security_events document_verification_events; do
  check "Table: skilved_dev.${table}" \
    bq show --project_id="${PROJECT}" "skilved_dev.${table}"
done
echo ""

# ── 8. Pub/Sub ────────────────────────────────────────────────────────────────
echo "--- Pub/Sub Topics ---"
for topic in \
  new-opportunity \
  opportunity-analysed \
  opportunity-quality-approved \
  application-requested \
  application-submitted \
  notification-requested \
  user-registered \
  document-uploaded \
  dlp-log-scan; do
  check "Topic: ${topic}" \
    gcloud pubsub topics describe "${topic}" --project="${PROJECT}"
done
echo ""

# ── 9. DLP ────────────────────────────────────────────────────────────────────
echo "--- Cloud DLP ---"
check "DLP inspect template: skilved-pii-scanner" \
  gcloud dlp inspect-templates describe \
    --project="${PROJECT}" --location=africa-south1 \
    --template-id=skilved-pii-scanner
check "Log sink: pii-log-scanner" \
  gcloud logging sinks describe pii-log-scanner --project="${PROJECT}"
echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
echo "=============================================="
echo "  Results: ${PASS} passed | ${FAIL} failed"
echo "=============================================="
if [ "${FAIL}" -eq 0 ]; then
  echo "  🎉 All checks passed! Infrastructure is ready."
else
  echo "  ⚠️  ${FAIL} check(s) failed. Review output above."
  exit 1
fi
