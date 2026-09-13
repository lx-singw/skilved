#!/usr/bin/env bash
export PATH="/home/lx_singw/.npm-global/bin:/home/lx_singw/google-cloud-sdk/bin:$PATH"
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "=== Step 4: Firebase Storage Rules ==="

cat > "${ROOT}/storage.rules" << 'RULES'
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // ─── Helpers ──────────────────────────────────────────────────
    function isSignedIn() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    // Max file size: 10 MB
    function isUnder10MB() {
      return request.resource.size < 10 * 1024 * 1024;
    }
    // Allowed document types
    function isDocumentType() {
      return request.resource.contentType.matches('application/pdf') ||
             request.resource.contentType.matches('image/.*');
    }

    // ─── User documents (CVs, certificates) ──────────────────────
    // Path: documents/{userId}/{filename}
    match /documents/{userId}/{allPaths=**} {
      allow read:   if isOwner(userId);
      allow write:  if isOwner(userId) && isUnder10MB() && isDocumentType();
      allow delete: if isOwner(userId);
    }

    // ─── Profile photos ───────────────────────────────────────────
    // Path: avatars/{userId}/{filename}
    match /avatars/{userId}/{allPaths=**} {
      allow read:   if true; // public profile photos
      allow write:  if isOwner(userId) &&
                       request.resource.size < 2 * 1024 * 1024 &&
                       request.resource.contentType.matches('image/.*');
      allow delete: if isOwner(userId);
    }

    // ─── Screenshots (agent-written only) ────────────────────────
    // Path: screenshots/{agentRunId}/{filename}
    match /screenshots/{allPaths=**} {
      allow read:   if isSignedIn();
      allow write:  if false; // service account only
    }

    // ─── Default deny ─────────────────────────────────────────────
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
RULES
echo "Written: storage.rules"

echo "Deploying Storage rules..."
firebase deploy --only storage || {
  echo ""
  echo "Deploy failed — rules written to disk. Deploy manually with:"
  echo "  firebase deploy --only storage"
}

echo "Storage setup complete."
