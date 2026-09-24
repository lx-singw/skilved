#!/usr/bin/env bash
export PATH="/home/lx_singw/.npm-global/bin:/home/lx_singw/google-cloud-sdk/bin:$PATH"
set -euo pipefail

PROJECT="skilved-dev"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "=== Step 2: Firebase Project Init ==="

# ── Auth check ────────────────────────────────────────────────────
echo "Checking Firebase auth..."
if ! firebase projects:list &>/dev/null; then
  echo ""
  echo "Not logged in. Running: firebase login"
  firebase login
fi

# ── Create or select project ─────────────────────────────────────
echo ""
echo "Checking if project '${PROJECT}' exists..."

# Check if already a Firebase project
if firebase projects:list 2>/dev/null | grep -q "${PROJECT}"; then
  echo "Project '${PROJECT}' already exists in Firebase. Using it."
else
  # Check if it exists in GCP first (via gcloud)
  if ~/google-cloud-sdk/bin/gcloud projects describe "${PROJECT}" &>/dev/null; then
    echo "GCP project '${PROJECT}' exists. Adding Firebase resources..."
    firebase projects:addfirebase "${PROJECT}" || {
      echo "Failed to add Firebase to existing GCP project '${PROJECT}'."
      exit 1
    }
  else
    echo "GCP project does not exist. Creating Firebase project '${PROJECT}'..."
    firebase projects:create "${PROJECT}" --display-name="Skilved Development" || {
      echo ""
      echo "Project creation failed or requires manual step."
      echo "Go to: https://console.firebase.google.com"
      echo "Create a project named: ${PROJECT}"
      echo "Then re-run this script."
      exit 1
    }
  fi
fi

# ── Write .firebaserc ─────────────────────────────────────────────
cat > "${ROOT}/.firebaserc" << EOF
{
  "projects": {
    "default": "${PROJECT}"
  }
}
EOF
echo "Written: .firebaserc"

# ── Write firebase.json if not present ───────────────────────────
if [ ! -f "${ROOT}/firebase.json" ]; then
  cat > "${ROOT}/firebase.json" << 'EOF'
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "functions": {
      "port": 5001
    },
    "hosting": {
      "port": 5000
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
EOF
  echo "Written: firebase.json"
else
  echo "firebase.json already exists — skipping."
fi

echo ""
echo "Firebase project '${PROJECT}' ready."
echo "Console: https://console.firebase.google.com/project/${PROJECT}"
