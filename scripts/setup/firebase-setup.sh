#!/usr/bin/env bash
export PATH="/home/lx_singw/.npm-global/bin:/home/lx_singw/google-cloud-sdk/bin:$PATH"
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT="skilved-dev"

echo "=============================================="
echo "  Skilved Firebase (Spark/Free) Setup"
echo "  Project: ${PROJECT}"
echo "=============================================="
echo ""
echo "This script sets up everything you need to build"
echo "on Firebase Spark — completely free, no billing required."
echo ""
echo "--- Prerequisites ---"
echo "Make sure you are logged in: firebase login"
echo ""

# ── Step 1: Firebase CLI ──────────────────────────────────────────
echo "=============================================="
echo "  Step 1: Firebase CLI"
echo "=============================================="
bash "${DIR}/firebase-install-cli.sh"
echo ""

# ── Step 2: Firebase Project ──────────────────────────────────────
echo "=============================================="
echo "  Step 2: Firebase Project"
echo "=============================================="
bash "${DIR}/firebase-init-project.sh"
echo ""

# ── Step 3: Firestore Rules & Indexes ────────────────────────────
echo "=============================================="
echo "  Step 3: Firestore Rules + Indexes"
echo "=============================================="
bash "${DIR}/firebase-firestore.sh"
echo ""

# ── Step 4: Firebase Storage Rules ───────────────────────────────
echo "=============================================="
echo "  Step 4: Storage Rules"
echo "=============================================="
bash "${DIR}/firebase-storage.sh"
echo ""

# ── Step 5: Local .env file ───────────────────────────────────────
echo "=============================================="
echo "  Step 5: Environment Variables (.env.local)"
echo "=============================================="
bash "${DIR}/firebase-env-setup.sh"
echo ""

# ── Step 6: Firebase Emulator Suite ──────────────────────────────
echo "=============================================="
echo "  Step 6: Emulator Suite Config"
echo "=============================================="
bash "${DIR}/firebase-emulator-setup.sh"
echo ""

echo "=============================================="
echo "  Firebase Setup Complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "  1. Fill in your API keys in apps/web/.env.local"
echo "  2. Start the emulator:  firebase emulators:start"
echo "  3. Start the app:       pnpm dev"
echo ""
echo "When billing is ready, run the full GCP upgrade:"
echo "  bash scripts/setup/gcp-setup.sh"
echo ""
echo "See docs/FIREBASE_TO_GCP_UPGRADE.md for the migration path."
