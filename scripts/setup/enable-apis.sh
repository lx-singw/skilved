#!/usr/bin/env bash
set -euo pipefail

PROJECT="${PROJECT:-skilved-dev}"

echo "=== Step 2: Enable All Required APIs ==="

gcloud config set project "${PROJECT}"

gcloud services enable \
  run.googleapis.com \
  cloudscheduler.googleapis.com \
  pubsub.googleapis.com \
  cloudfunctions.googleapis.com \
  documentai.googleapis.com \
  vision.googleapis.com \
  storage.googleapis.com \
  cloudkms.googleapis.com \
  dlp.googleapis.com \
  firestore.googleapis.com

gcloud services enable \
  bigquery.googleapis.com \
  aiplatform.googleapis.com \
  discoveryengine.googleapis.com \
  redis.googleapis.com \
  secretmanager.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com \
  gmail.googleapis.com \
  cloudbuild.googleapis.com

echo "All APIs enabled for ${PROJECT}."
