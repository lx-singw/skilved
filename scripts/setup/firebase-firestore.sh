#!/usr/bin/env bash
export PATH="/home/lx_singw/.npm-global/bin:/home/lx_singw/google-cloud-sdk/bin:$PATH"
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "=== Step 3: Firestore Rules + Indexes ==="

# ── firestore.rules ───────────────────────────────────────────────
cat > "${ROOT}/firestore.rules" << 'RULES'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ─── Helpers ──────────────────────────────────────────────────
    function isSignedIn() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // ─── opportunities ────────────────────────────────────────────
    // Public read (feed is open). Only service accounts / admin write.
    match /opportunities/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // ─── users ────────────────────────────────────────────────────
    match /users/{userId} {
      allow read:   if isOwner(userId) || isAdmin();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // ─── skills_passports ─────────────────────────────────────────
    match /skills_passports/{userId} {
      allow read:   if isOwner(userId) || isAdmin();
      allow write:  if isOwner(userId) || isAdmin();
    }

    // ─── applications ─────────────────────────────────────────────
    match /applications/{appId} {
      allow read:   if isSignedIn() &&
                       (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isSignedIn() &&
                       request.resource.data.userId == request.auth.uid;
      allow update: if isAdmin();
      allow delete: if false;
    }

    // ─── agent_context ────────────────────────────────────────────
    match /agent_context/{userId} {
      allow read:   if isOwner(userId) || isAdmin();
      allow write:  if isAdmin(); // agents only — write via service account
    }

    // ─── career_plans ─────────────────────────────────────────────
    match /career_plans/{userId} {
      allow read:   if isOwner(userId) || isAdmin();
      allow write:  if isAdmin();
    }

    // ─── consents (POPIA — never deleted) ────────────────────────
    match /consents/{consentId} {
      allow read:   if isSignedIn() &&
                       (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isSignedIn() &&
                       request.resource.data.userId == request.auth.uid;
      allow update: if false;
      allow delete: if false;
    }

    // ─── conversations ────────────────────────────────────────────
    match /conversations/{convId} {
      allow read:   if isSignedIn() &&
                       (resource.data.userId == request.auth.uid || isAdmin());
      allow write:  if isSignedIn() &&
                       request.resource.data.userId == request.auth.uid;
    }

    // ─── reviews (Phase 2 stub — sealed now) ─────────────────────
    match /reviews/{reviewId} {
      allow read:   if true;
      allow write:  if false; // sealed until Phase 2
    }

    // ─── revenue_decisions (admin / agent only) ───────────────────
    match /revenue_decisions/{id} {
      allow read:   if isAdmin();
      allow write:  if isAdmin();
    }

    // ─── application_circuit_breaker_state ───────────────────────
    match /application_circuit_breaker_state/{userId} {
      allow read:   if isOwner(userId) || isAdmin();
      allow write:  if isAdmin();
    }

    // ─── Default deny ─────────────────────────────────────────────
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
RULES
echo "Written: firestore.rules"

# ── firestore.indexes.json ────────────────────────────────────────
cat > "${ROOT}/firestore.indexes.json" << 'INDEXES'
{
  "indexes": [
    {
      "collectionGroup": "opportunities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status",        "order": "ASCENDING" },
        { "fieldPath": "discoveredAt",  "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "opportunities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tradeCategory", "order": "ASCENDING" },
        { "fieldPath": "province",      "order": "ASCENDING" },
        { "fieldPath": "status",        "order": "ASCENDING" },
        { "fieldPath": "discoveredAt",  "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "opportunities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tradeCategory", "order": "ASCENDING" },
        { "fieldPath": "status",        "order": "ASCENDING" },
        { "fieldPath": "deadline",      "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "opportunities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "opportunityType", "order": "ASCENDING" },
        { "fieldPath": "province",        "order": "ASCENDING" },
        { "fieldPath": "status",          "order": "ASCENDING" },
        { "fieldPath": "discoveredAt",    "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId",      "order": "ASCENDING" },
        { "fieldPath": "appliedAt",   "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId",        "order": "ASCENDING" },
        { "fieldPath": "status",        "order": "ASCENDING" },
        { "fieldPath": "appliedAt",     "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "consents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId",      "order": "ASCENDING" },
        { "fieldPath": "consentType", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
INDEXES
echo "Written: firestore.indexes.json"

# ── Deploy rules + indexes ────────────────────────────────────────
echo ""
echo "Deploying Firestore rules and indexes..."
firebase deploy --only firestore || {
  echo ""
  echo "Deploy failed — project may not exist yet or emulator is target."
  echo "Rules and indexes written to disk. Deploy manually with:"
  echo "  firebase deploy --only firestore"
}

echo "Firestore setup complete."
