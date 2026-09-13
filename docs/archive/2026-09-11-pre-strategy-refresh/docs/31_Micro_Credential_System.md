# Skilved — Micro-Credential System
### Skilved Verified Badges | Version 1.0 | June 2026

---

## Table of Contents

- [Why This Exists](#why-this-exists)
- [The XPRIZE Argument](#the-xprize-argument)
- [Credential Types](#credential-types)
- [Issuance Logic](#issuance-logic)
- [What Workers See](#what-workers-see)
- [What Employers See](#what-employers-see)
- [Technical Implementation](#technical-implementation)
- [Trust Model](#trust-model)
- [Sprint Plan](#sprint-plan)
- [Path to W3C Verifiable Credentials](#path-to-w3c-verifiable-credentials)

---

## Why This Exists

South African skills credentials today are:
- Paper certificates locked in a drawer
- PDF files anyone can fake
- Self-reported claims on job applications that nobody verifies

A Skilved micro-credential is fundamentally different. It is:
- Platform-native (issued by Skilved, verifiable in real time)
- Outcome-anchored (issued only when something real happened)
- Tamper-proof (stored in Firestore with cryptographic timestamp)
- Portable (QR code on public profile, shareable anywhere)

**The first employer who says "I specifically look for Skilved Verified candidates" validates the entire credential system.** This moment happens organically as employers realize Skilved candidates come pre-qualified and motivated.

---

## The XPRIZE Argument

> "Credentials today are paper certificates and PDF files. Skilved issues living credentials — anchored to real outcomes, verifiable in real time by any employer, portable across platforms. This is what the global credentialing industry has been trying to build for a decade. We deliver a working version in 8 weeks."

---

## Credential Types

### Tier 1: Activity Credentials (MVP — Sprint 2)
Issued automatically based on platform activity. No outcome data required.

**"Skilved Verified: Active Applicant"**
- Issued when: 5+ applications submitted through Skilved + passport 40%+ complete
- Signals: serious, motivated candidate with verified profile
- Value to employers: pre-screened for intent and profile completeness
- Badge: blue checkmark with "Active Applicant" label

**"Skilved Verified: Profile Complete"**
- Issued when: passport reaches 80%+ completeness
- Signals: thorough, detailed profile, AI-enriched skills
- Value to employers: rich candidate data, reduces screening time
- Badge: blue checkmark with "Full Profile" label

### Tier 2: Outcome Credentials (Sprint 3+)
Issued when verified outcomes exist.

**"Skilved Verified: Placed"**
- Issued when: outcome confirmed as `accepted` via Outcome Tracker
- Signals: this person successfully secured a position through Skilved
- Value: proof of employability, not just application activity
- Badge: green checkmark with employer name + role type + date

**"Skilved Verified: Interview Ready"**
- Issued when: user received 2+ interview invitations through Skilved applications
- Signals: application quality good enough to generate employer interest
- Badge: amber checkmark with count

### Tier 3: Reputation Credentials (Phase 2 — Agent 10)
Issued when employer verification available.

**"Skilved Verified: Employer Endorsed"**
- Issued when: employer provides positive outcome feedback via Reputation Agent
- Signals: employer-verified quality, not just self-reported
- Badge: gold checkmark with employer name

**"Skilved Verified: [Trade] Specialist"**
- Issued when: 3+ successful placements in the same trade with positive outcomes
- Signals: consistent track record in specific trade
- Badge: trade-coloured checkmark with trade name

---

## Issuance Logic

```typescript
class MicroCredentialIssuer {

  async checkAndIssue(userId: string): Promise<IssuedCredential[]> {
    const user = await this.getUser(userId);
    const passport = await this.getPassport(userId);
    const applications = await this.getApplications(userId);
    const outcomes = await this.getOutcomes(userId);
    const existing = await this.getExistingCredentials(userId);

    const issued: IssuedCredential[] = [];

    // Active Applicant
    if (
      applications.filter(a => a.status !== 'withdrawn').length >= 5 &&
      passport.completenessScore >= 40 &&
      !existing.find(c => c.type === 'active_applicant')
    ) {
      issued.push(await this.issue(userId, 'active_applicant'));
    }

    // Profile Complete
    if (
      passport.completenessScore >= 80 &&
      !existing.find(c => c.type === 'profile_complete')
    ) {
      issued.push(await this.issue(userId, 'profile_complete'));
    }

    // Interview Ready
    const interviews = outcomes.filter(o => o.outcomeType === 'interviewed');
    if (
      interviews.length >= 2 &&
      !existing.find(c => c.type === 'interview_ready')
    ) {
      issued.push(await this.issue(userId, 'interview_ready'));
    }

    // Placed
    const placements = outcomes.filter(o =>
      ['accepted', 'offered'].includes(o.outcomeType)
    );
    for (const placement of placements) {
      if (!existing.find(c =>
        c.type === 'placed' && c.opportunityId === placement.opportunityId
      )) {
        issued.push(await this.issue(userId, 'placed', {
          employer: placement.oppOrganisation,
          role: placement.oppTitle,
          trade: placement.oppTrade,
          date: placement.outcomeAt,
          opportunityId: placement.opportunityId,
        }));
      }
    }

    // Notify user of new credentials
    if (issued.length > 0) {
      await this.notifyUser(user, issued);
    }

    return issued;
  }

  private async issue(
    userId: string,
    type: CredentialType,
    metadata?: Record<string, any>
  ): Promise<IssuedCredential> {
    const credential: IssuedCredential = {
      id: `cred_${userId}_${type}_${Date.now()}`,
      userId,
      type,
      issuedAt: new Date(),
      issuedBy: 'skilved',
      version: '1.0',
      metadata,
      verificationCode: this.generateVerificationCode(),
      publicUrl: `https://skilved.com/verify/${this.generateVerificationCode()}`,
      qrCodePath: null, // generated async
    };

    await this.firestore
      .collection('micro_credentials')
      .doc(credential.id)
      .set(credential);

    // Generate QR code async
    await this.generateQRCode(credential);

    // Log to BigQuery
    await this.bigquery.log({
      event_type: 'micro_credential_issued',
      user_id: userId,
      credential_type: type,
      issued_at: new Date(),
    });

    return credential;
  }

  private generateVerificationCode(): string {
    // 12-character alphanumeric code
    return Math.random().toString(36).substring(2, 14).toUpperCase();
  }
}
```

---

## What Workers See

### On Profile Page

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Thabo Nkosi — Skilved Profile
Electrician · Gauteng · N3 Electrical

✅ Skilved Verified: Active Applicant
   Issued 15 June 2026

✅ Skilved Verified: Profile Complete
   Issued 18 June 2026

🟢 Skilved Verified: Placed
   Eskom Holdings · Electrical Apprenticeship
   Placed 1 July 2026

[Share my Skilved] [Download CV] [View all credentials]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### WhatsApp Notification on Issuance

```
🎉 You just earned a Skilved credential!

✅ Skilved Verified: Active Applicant

This credential shows employers that you're serious
and your profile is complete. It appears on your
public Skilved profile.

Share it: skilved.com/thabo-nkosi
```

---

## What Employers See

### On Candidate Profile (Employer Dashboard)

```
Thabo Nkosi — N3 Electrical · Gauteng

Credentials:
✅ Active Applicant (Jun 2026)
✅ Profile Complete (Jun 2026)
🟢 Placed: Eskom Electrical Apprenticeship (Jul 2026)

[Verify] → opens verification page
```

### Verification Page (`skilved.com/verify/ABC123XYZ456`)

```
Skilved Credential Verification

Credential: Skilved Verified — Placed
Holder: Thabo Nkosi
Employer: Eskom Holdings
Role: Electrical Apprenticeship
Date: 1 July 2026
Issued by: Skilved (Pty) Ltd
Verification code: ABC123XYZ456

✅ This credential is authentic and unmodified.
   Verified at: 14:32:07 SAST, 15 June 2026

[Download verification certificate]
```

---

## Technical Implementation

### Firestore Schema

```typescript
// Collection: micro_credentials
interface MicroCredential {
  id: string;                    // cred_{userId}_{type}_{timestamp}
  userId: string;
  type: CredentialType;
  issuedAt: Timestamp;
  issuedBy: 'skilved';
  version: string;               // '1.0'

  // Credential-specific metadata
  metadata?: {
    employer?: string;           // for 'placed' credential
    role?: string;
    trade?: TradeCategory;
    date?: Timestamp;
    opportunityId?: string;
    sampleSize?: number;         // for reputation credentials
    trustScore?: number;
  };

  // Verification
  verificationCode: string;      // 12-char alphanumeric, unique
  publicUrl: string;             // skilved.com/verify/{code}
  qrCodePath?: string;           // Cloud Storage path

  // Display
  badgeColor: string;            // hex colour
  badgeLabel: string;            // display text
  badgeIcon: string;             // emoji or icon name

  // Status
  status: 'active' | 'revoked' | 'expired';
  revokedAt?: Timestamp;
  revokedReason?: string;
  expiresAt?: Timestamp;         // null = no expiry
}

type CredentialType =
  | 'active_applicant'
  | 'profile_complete'
  | 'interview_ready'
  | 'placed'
  | 'employer_endorsed'        // Phase 2
  | 'trade_specialist'         // Phase 2
  | 'top_applicant'            // future
  | 'verified_trade_test';     // future: NAMB integration
```

### Verification API

```typescript
// GET /api/verify/:code
export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  const credential = await db
    .collection('micro_credentials')
    .where('verificationCode', '==', params.code)
    .get();

  if (credential.empty) {
    return Response.json({ valid: false, reason: 'Credential not found' });
  }

  const cred = credential.docs[0].data() as MicroCredential;

  if (cred.status !== 'active') {
    return Response.json({
      valid: false,
      reason: `Credential ${cred.status}`,
      revokedAt: cred.revokedAt,
    });
  }

  if (cred.expiresAt && cred.expiresAt.toDate() < new Date()) {
    return Response.json({ valid: false, reason: 'Credential expired' });
  }

  // Get holder's public profile info
  const user = await db.collection('users').doc(cred.userId).get();
  const passport = await db.collection('skills_passports').doc(cred.userId).get();

  return Response.json({
    valid: true,
    credential: {
      type: cred.type,
      label: cred.badgeLabel,
      issuedAt: cred.issuedAt,
      ...cred.metadata,
    },
    holder: {
      displayName: user.data()?.displayName,
      trade: passport.data()?.primaryTrade,
      province: passport.data()?.province,
    },
    verifiedAt: new Date().toISOString(),
  });
}
```

### QR Code Generation

```typescript
class QRCodeGenerator {
  async generate(credential: MicroCredential): Promise<string> {
    const QRCode = require('qrcode');

    const qrBuffer = await QRCode.toBuffer(credential.publicUrl, {
      errorCorrectionLevel: 'M',
      width: 300,
      margin: 2,
      color: {
        dark: '#1A56DB',  // Skilved Blue
        light: '#FFFFFF',
      },
    });

    // Upload to Cloud Storage
    const path = `credentials/qr/${credential.id}.png`;
    await storage.bucket('skilved-credentials').file(path).save(qrBuffer);

    return path;
  }
}
```

---

## Trust Model

### Why Employers Should Trust These Credentials

**For Activity credentials (Active Applicant, Profile Complete):**
- Issued by Skilved's automated system
- Based on verifiable activity in the platform
- Sample: "This person submitted 5+ applications with a complete profile" — difficult to fake at scale

**For Outcome credentials (Placed):**
- Issued only after Outcome Tracker Agent confirms placement
- Confirmation involves the worker responding to a follow-up message with placement details
- Cross-referenced against the opportunity the application was submitted for
- Not issued on self-report alone — requires confirmation chain

**For Reputation credentials (Phase 2):**
- Requires employer verification via Reputation Agent
- Subject to reviewer credibility scoring (see Agent 10)

### Credential Revocation

Credentials can be revoked if:
- Fraudulent activity detected
- Worker requests deletion (POPIA right to deletion)
- Verification reveals credential was issued in error

Revoked credentials show as "Revoked" on verification page — not deleted, not hidden.

---

## Sprint Plan

**Sprint 2 (Week 3–4):**
- Tier 1 credentials live (Active Applicant, Profile Complete)
- WhatsApp notification on issuance
- Display on public profile page
- Verification page (`/verify/:code`) live
- QR code generation

**Sprint 3 (Week 5–6):**
- Tier 2 credentials live (Placed, Interview Ready)
- Employer-visible credential display on candidate profiles
- CV export includes credentials section
- Skill Pulse Dashboard shows credential distribution

**Sprint 4 (Week 7–8):**
- Credential counts in XPRIZE metrics
- API endpoint for employer verification
- Credential download (PDF certificate)
- XPRIZE demo: "this worker earned their Placed credential autonomously — Skilved issued it without any human involvement"

---

## Path to W3C Verifiable Credentials

Current implementation uses Firestore + verification codes. This is sufficient for MVP.

Phase 2 migration to W3C Verifiable Credentials standard:
- Same data, different format
- Makes credentials portable to MyMzansi wallet
- Enables cross-platform recognition
- No re-issuance required — migration is format transformation

Design constraint: **build data schema to be W3C-compatible from day one** so Phase 2 is a format transformation, not a rebuild.

```typescript
// Phase 2: W3C VC format (same underlying data)
interface W3CVerifiableCredential {
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential", "SkilvedCredential"],
  "issuer": "https://skilved.com",
  "issuanceDate": string, // ISO 8601
  "credentialSubject": {
    "id": string, // DID or URL
    "type": string, // credential type
    ...metadata
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": string,
    "verificationMethod": "https://skilved.com/keys/1",
    "proofPurpose": "assertionMethod",
    "proofValue": string
  }
}
```

---

*Document version 1.0 — June 2026*
*Owner: Product + Legal*
*NEW in v5.0 — Micro-Credential System specification*
