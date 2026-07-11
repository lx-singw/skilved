#!/usr/bin/env bash
export PATH="/home/lx_singw/.npm-global/bin:/home/lx_singw/google-cloud-sdk/bin:$PATH"
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "=== Step 6: Firebase Emulator Suite ==="

# firebase.json already written by firebase-init-project.sh
# This script just confirms emulator ports and writes the emulator seed data dir

SEED_DIR="${ROOT}/.emulator-data"
mkdir -p "${SEED_DIR}"

cat > "${SEED_DIR}/README.md" << 'EOF'
# Emulator Seed Data

This directory is used by the Firebase Emulator Suite to persist data between runs.

## Start emulators with persistence:
```bash
firebase emulators:start --import=.emulator-data --export-on-exit
```

## Start fresh (no persistence):
```bash
firebase emulators:start
```

## Emulator UI
Open http://localhost:4000 while emulators are running.

## Ports
| Service    | Port |
|------------|------|
| Auth       | 9099 |
| Firestore  | 8080 |
| Storage    | 9199 |
| Functions  | 5001 |
| Hosting    | 5000 |
| UI         | 4000 |
EOF

echo "Written: .emulator-data/README.md"

# Add emulator scripts to package.json if pnpm workspace
if [ -f "${ROOT}/package.json" ]; then
  echo ""
  echo "Tip: Add these to your root package.json scripts:"
  echo '  "emulate":      "firebase emulators:start --import=.emulator-data --export-on-exit"'
  echo '  "emulate:fresh": "firebase emulators:start"'
fi

echo ""
echo "Emulator suite configured."
echo ""
echo "To start local dev environment:"
echo "  Terminal 1: firebase emulators:start --import=.emulator-data --export-on-exit"
echo "  Terminal 2: pnpm dev"
echo ""
echo "Emulator UI: http://localhost:4000"
