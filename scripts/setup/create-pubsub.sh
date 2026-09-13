#!/usr/bin/env bash
export PATH="$HOME/google-cloud-sdk/bin:$PATH"
set -euo pipefail

PROJECT="${PROJECT:-skilved-dev}"

echo "=== Step 5: Create Pub/Sub Topics + Subscriptions ==="

gcloud config set project "${PROJECT}"

# ── Agent-to-agent event topics ────────────────────────────────────────────────

create_topic() {
  local topic="$1"
  if gcloud pubsub topics describe "${topic}" --project="${PROJECT}" &>/dev/null; then
    echo "Topic ${topic} already exists, skipping."
  else
    gcloud pubsub topics create "${topic}" --project="${PROJECT}"
    echo "Created topic: ${topic}"
  fi
}

create_subscription() {
  local topic="$1" sub="$2" deadline="${3:-60}"
  if gcloud pubsub subscriptions describe "${sub}" --project="${PROJECT}" &>/dev/null; then
    echo "Subscription ${sub} already exists, skipping."
  else
    gcloud pubsub subscriptions create "${sub}" \
      --topic="${topic}" \
      --project="${PROJECT}" \
      --ack-deadline="${deadline}" \
      --expiration-period="never"
    echo "Created subscription: ${sub} → ${topic}"
  fi
}

# Discovery pipeline
create_topic "new-opportunity"
create_topic "opportunity-analysed"
create_topic "opportunity-quality-approved"
create_topic "opportunity-quality-rejected"

# Application pipeline
create_topic "application-requested"
create_topic "application-submitted"
create_topic "application-failed"
create_topic "application-held"       # pre-flight failed — docs missing

# Outcome & notification pipeline
create_topic "outcome-reported"
create_topic "outcome-verified"
create_topic "notification-requested"
create_topic "notification-sent"

# User lifecycle
create_topic "user-registered"
create_topic "passport-updated"
create_topic "document-uploaded"
create_topic "document-verified"

# DLP (already created in configure-dlp.sh — idempotent)
create_topic "dlp-log-scan"

# ── Subscriptions (agent consumers) ───────────────────────────────────────────

# Analyst listens for new opportunities from Scout
create_subscription "new-opportunity" "analyst-new-opportunity-sub" 120

# Quality listens for analysed opportunities from Analyst
create_subscription "opportunity-analysed" "quality-opportunity-analysed-sub" 120

# Matching listens for approved opportunities from Quality
create_subscription "opportunity-quality-approved" "matching-quality-approved-sub" 60

# Application agent listens for application requests
create_subscription "application-requested" "application-agent-sub" 300

# Outcome tracker listens for submitted applications
create_subscription "application-submitted" "outcome-tracker-submitted-sub" 120

# Notification agent listens for notification requests
create_subscription "notification-requested" "notification-agent-sub" 120

# Customer success listens for new users
create_subscription "user-registered" "customer-success-registered-sub" 120

# Document verification listens for document uploads
create_subscription "document-uploaded" "verification-document-uploaded-sub" 300

echo ""
echo "Pub/Sub topics and subscriptions configured for ${PROJECT}."
