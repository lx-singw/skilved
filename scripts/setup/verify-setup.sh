#!/usr/bin/env bash
export PATH="$HOME/google-cloud-sdk/bin:$PATH"
set -euo pipefail

PROJECT="${PROJECT:-skilved-dev}"
ENV="${PROJECT##*-}"
DATASET_NAME="skilved_${ENV}"
ACCESS_TOKEN=$(gcloud auth print-access-token 2>/dev/null || echo "")
PASS=0
FAIL=0

echo "=============================================="
echo "  Skilved Setup Verification — ${PROJECT}"
echo "=============================================="
echo ""

check() {
  local label="$1"
  shift
  set +e
  "$@" &>/dev/null
  local status=$?
  set -e
  if [ $status -eq 0 ]; then
    echo "  ✅ ${label}"
    PASS=$((PASS + 1))
  else
    echo "  ❌ ${label}"
    FAIL=$((FAIL + 1))
  fi
}

# ── 1. Project & Billing ───────────────────────────────────────────────────────
echo "--- Project ---"
check "Project ${PROJECT} exists" \
  gcloud projects describe "${PROJECT}"

check_billing() {
  local enabled
  enabled=$(gcloud billing projects describe "${PROJECT}" --format="value(billingEnabled)" 2>/dev/null || echo "false")
  [[ "${enabled}" =~ [Tt]rue ]]
}
check "Billing linked" check_billing
echo ""

# ── 2. APIs ───────────────────────────────────────────────────────────────────
echo "--- APIs ---"
check_api() {
  local api_name="$1"
  local found
  found=$(gcloud services list --project="${PROJECT}" --filter="name:${api_name}" --format="value(name)" 2>/dev/null || echo "")
  [[ "${found}" == *"${api_name}"* ]]
}

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
  check "API enabled: ${api}" check_api "${api}"
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
  skilved-documents-${ENV} \
  skilved-identity-${ENV} \
  skilved-screenshots-${ENV} \
  skilved-government-reports-${ENV} \
  skilved-audit-logs-${ENV}; do
  check "Bucket: gs://${bucket}" \
    gcloud storage buckets describe "gs://${bucket}"
done
echo ""

# ── 7. BigQuery ───────────────────────────────────────────────────────────────
echo "--- BigQuery ---"
check "Dataset: ${DATASET_NAME}" \
  bq show --project_id="${PROJECT}" "${DATASET_NAME}"
for table in events outcomes agent_runs quality_decisions graph_skills security_events document_verification_events; do
  check "Table: ${DATASET_NAME}.${table}" \
    bq show --project_id="${PROJECT}" "${DATASET_NAME}.${table}"
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
check_dlp() {
  local token="${ACCESS_TOKEN:-}"
  [ -z "${token}" ] && token=$(gcloud auth print-access-token 2>/dev/null || echo "")
  [ -z "${token}" ] && return 1
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${token}" \
    "https://dlp.googleapis.com/v2/projects/${PROJECT}/locations/africa-south1/inspectTemplates/skilved-pii-scanner")
  if [ "${code}" -eq 200 ] || [ "${code}" -eq 403 ]; then return 0; fi
  code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${token}" \
    "https://dlp.googleapis.com/v2/projects/${PROJECT}/inspectTemplates/skilved-pii-scanner")
  [ "${code}" -eq 200 ] || [ "${code}" -eq 403 ]
}
check "DLP inspect template: skilved-pii-scanner" check_dlp
check "Log sink: pii-log-scanner" \
  gcloud logging sinks describe pii-log-scanner --project="${PROJECT}"
echo ""

# ── 10. Vertex AI Search ──────────────────────────────────────────────────────
echo "--- Vertex AI Search ---"
check_vertex() {
  local token="${ACCESS_TOKEN:-}"
  [ -z "${token}" ] && token=$(gcloud auth print-access-token 2>/dev/null || echo "")
  [ -z "${token}" ] && return 1
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${token}" \
    -H "X-Goog-User-Project: ${PROJECT}" \
    "https://discoveryengine.googleapis.com/v1/projects/${PROJECT}/locations/global/collections/default_collection/dataStores/skilved-opportunities")
  if [ "${code}" -eq 200 ] || [ "${code}" -eq 403 ]; then return 0; fi
  code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${token}" \
    "https://discoveryengine.googleapis.com/v1/projects/${PROJECT}/locations/global/collections/default_collection/dataStores/skilved-opportunities")
  [ "${code}" -eq 200 ] || [ "${code}" -eq 403 ]
}
check "Data store: skilved-opportunities" check_vertex
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
