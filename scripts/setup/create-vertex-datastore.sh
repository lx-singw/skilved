export PATH="$HOME/google-cloud-sdk/bin:$PATH"
set -euo pipefail

PROJECT="${PROJECT:-skilved-dev}"

echo "=== Step 9: Create Vertex AI Search Data Store ==="

TOKEN=$(gcloud auth print-access-token)

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  "https://discoveryengine.googleapis.com/v1/projects/${PROJECT}/locations/global/collections/default_collection/dataStores/skilved-opportunities")

if [ "${HTTP_STATUS}" -eq 200 ]; then
  echo "Data store skilved-opportunities already exists."
else
  curl -s -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "displayName": "Skilved Opportunities",
      "industryVertical": "GENERIC",
      "solutionTypes": ["SOLUTION_TYPE_SEARCH"],
      "contentConfig": "CONTENT_REQUIRED"
    }' \
    "https://discoveryengine.googleapis.com/v1/projects/${PROJECT}/locations/global/collections/default_collection/dataStores?dataStoreId=skilved-opportunities" > /dev/null
  echo "Created Vertex AI Search data store skilved-opportunities."
fi

echo "Vertex AI Search configured."
