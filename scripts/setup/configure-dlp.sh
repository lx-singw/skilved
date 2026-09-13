export PATH="$HOME/google-cloud-sdk/bin:$PATH"
set -euo pipefail

PROJECT="${PROJECT:-skilved-dev}"

echo "=== Step 8: Configure Cloud DLP ==="

TOKEN=$(gcloud auth print-access-token 2>/dev/null || true)

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  "https://dlp.googleapis.com/v2/projects/${PROJECT}/locations/africa-south1/inspectTemplates/skilved-pii-scanner")

if [ "${HTTP_STATUS}" -eq 200 ] || [ "${HTTP_STATUS}" -eq 409 ]; then
  echo "DLP inspect template skilved-pii-scanner already exists."
else
  RESP=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
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
      },
      "templateId": "skilved-pii-scanner"
    }' \
    "https://dlp.googleapis.com/v2/projects/${PROJECT}/locations/africa-south1/inspectTemplates")
  
  if echo "${RESP}" | grep -q "HTTP_STATUS:400"; then
    # Fallback to global location if region-specific location is not supported for DLP templates
    curl -s -X POST \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
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
        },
        "templateId": "skilved-pii-scanner"
      }' \
      "https://dlp.googleapis.com/v2/projects/${PROJECT}/inspectTemplates" > /dev/null
  fi
  echo "Created DLP inspect template skilved-pii-scanner."
fi

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
