#!/usr/bin/env bash
export PATH="/home/lx_singw/.npm-global/bin:/home/lx_singw/google-cloud-sdk/bin:$PATH"
set -euo pipefail

echo "=== Step 1: Firebase CLI Check ==="

if command -v firebase &>/dev/null; then
  echo "Firebase CLI already installed: $(firebase --version)"
  exit 0
fi

echo "Firebase CLI not found. Installing..."

# Try npm global install first (preferred if node is available)
if command -v npm &>/dev/null; then
  npm install -g firebase-tools
  echo "Firebase CLI installed via npm: $(firebase --version)"
  exit 0
fi

# Fallback: standalone binary
curl -sL https://firebase.tools | bash
echo "Firebase CLI installed via standalone binary."
echo ""
echo "Now run: firebase login"
