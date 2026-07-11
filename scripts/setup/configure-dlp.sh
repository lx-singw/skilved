#!/usr/bin/env bash
set -euo pipefail

PROJECT="skilved-dev"

echo "=== Step 8: Configure Cloud DLP ==="

# Create inspect template
cat > /tmp/dlp-inspect-template.json << 'EOF'
{
  "inspectTemplate": {
    "displayName": "Skilved PII Scanner",
    "description": "Scans logs for SA ID numbers, names, and other PII",
    "inspectConfig": {
      "infoTypes": [
        {"name": "PERSON_NAME"},
        {"name": "PHONE_NUMBER"},
        {"name": "EMAIL_ADDRESS"},
        {"name": "STREET_ADDRESS"},
        {"name": "PASSPORT"},
        {"name": "SOUTH_AFRICA_ID_NUMBER"},
        {"name": "CREDIT_CARD_NUMBER"},
        {"name": "IBAN_CODE"}
      ],
      "minLikelihood": "LIKELY",
      "limits": {
        "maxFindingsPerRequest": 100
      }
    }
  }
}
EOF

if gcloud dlp inspect-templates describe --project="${PROJECT}" --location=africa-south1 \
  --template-id=skilved-pii-scanner &>/dev/null; then
  echo "DLP inspect template skilved-pii-scanner already exists."
else
  gcloud dlp inspect-templates create \
    --project="${PROJECT}" \
    --location=africa-south1 \
    --template-id=skilved-pii-scanner \
    --json-file=/tmp/dlp-inspect-template.json
  echo "Created DLP inspect template."
fi
rm -f /tmp/dlp-inspect-template.json

# Create Pub/Sub topic for DLP log routing
gcloud pubsub topics create dlp-log-scan --project="${PROJECT}" 2>/dev/null || \
  echo "Pub/Sub topic dlp-log-scan already exists."

# Create log sink
if gcloud logging sinks describe pii-log-scanner --project="${PROJECT}" &>/dev/null; then
  echo "Log sink pii-log-scanner already exists."
else
  gcloud logging sinks create pii-log-scanner \
    "pubsub.googleapis.com/projects/${PROJECT}/topics/dlp-log-scan" \
    --project="${PROJECT}" \
    --log-filter='resource.type="cloud_run_revision" OR resource.type="cloud_function"'

  SINK_SA=$(gcloud logging sinks describe pii-log-scanner \
    --project="${PROJECT}" --format='value(writerIdentity)')

  gcloud pubsub topics add-iam-policy-binding dlp-log-scan \
    --project="${PROJECT}" \
    --member="${SINK_SA}" \
    --role="roles/pubsub.publisher"
  echo "Created log sink and granted publish permission."
fi

echo "DLP infrastructure configured."
echo ""
echo "NOTE: You still need a Cloud Function subscriber on the dlp-log-scan topic"
echo "      to call the DLP API and alert on PII findings."
