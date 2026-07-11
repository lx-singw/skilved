#!/usr/bin/env bash
set -euo pipefail

PROJECT="skilved-dev"

echo "=== Step 4: Configure Secret Manager ==="

SECRETS=(
  GEMINI_API_KEY
  CAPTCHA_SOLVER_API_KEY
  WHATSAPP_API_TOKEN
  SAQA_API_URL
  PAYFAST_MERCHANT_ID
  PAYFAST_MERCHANT_KEY
  ID_HASH_SALT
)

for secret in "${SECRETS[@]}"; do
  if gcloud secrets describe "${secret}" --project="${PROJECT}" &>/dev/null; then
    echo "Secret ${secret} already exists, skipping creation."
  else
    gcloud secrets create "${secret}" --project="${PROJECT}" \
      --replication-policy="user-managed" --locations="africa-south1"
    echo "Created secret: ${secret}"
  fi
done

cat << 'EOF'

=== SECRET VALUE PROMPTS ===
Run the following commands to add values (never paste secrets into shell history directly):

EOF

for secret in "${SECRETS[@]}"; do
  echo "# Add value for ${secret}:"
  echo "echo -n 'your-${secret}-value' | gcloud secrets versions add ${secret} --project=${PROJECT} --data-file=-"
  echo ""
done

echo "Secrets created. Add values using the commands above."
