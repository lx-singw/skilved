# Skilved — MyMzansi Integration
### Building on South Africa's Digital Public Infrastructure | Version 1.0 | June 2026

---

## Table of Contents

- [What MyMzansi Is](#what-mymzansi-is)
- [The Strategic Foundation](#the-strategic-foundation)
- [What MyMzansi Provides](#what-mymzansi-provides)
- [Integration Phases](#integration-phases)
- [Phase 1: Document Vault + SAQA/NAMB (MVP)](#phase-1-document-vault--saqa--namb-mvp)
- [Phase 2: MyMzansi OAuth + Credentials Wallet](#phase-2-mymzansi-oauth--credentials-wallet)
- [Phase 3: Full DPI Integration](#phase-3-full-dpi-integration)
- [Sign In With Skilved / Sign In With MyMzansi](#sign-in-with-skilved--sign-in-with-mymzansi)
- [Technical Integration Spec](#technical-integration-spec)
- [Government Partnership Strategy](#government-partnership-strategy)
- [Legal & Compliance](#legal--compliance)
- [The Scope Expansion: Beyond Trades](#the-scope-expansion-beyond-trades)
- [Change Log](#change-log)

---

## What MyMzansi Is

MyMzansi is South Africa's Digital Public Infrastructure (DPI) — built and maintained by the DPSA (Department of Public Service and Administration). It is the government-built technical foundation for digital service delivery to all South African citizens.

**What is currently live or in active development:**

| Layer | What It Provides | Status |
|---|---|---|
| Digital Identity | Verified SA ID linked to digital wallet | Live |
| Credentials Wallet | Government-issued qualifications, licences | In development |
| Data Exchange APIs | Institutions request citizen data with consent | Developer sandbox open |
| Payments Rail | Social grants, government disbursements | Live for grants |
| OAuth / Login | "Sign in with MyMzansi" for applications | In development |
| Developer Portal | API documentation, sandbox | Open |

**The government's explicit stated goal** (MyMzansi documentation):
> "Linking grant recipients to jobs, training, and education opportunities that lead to sustainable livelihoods."

This is Skilved's mission statement, written by the South African government. The alignment is not incidental — it is the strategic foundation.

---

## The Strategic Foundation

**Skilved's architecture decision: build around MyMzansi, not alongside it.**

Most private sector platforms treat government digital infrastructure as a future integration. Skilved treats it as the foundation from day one — even before the APIs are fully live. This is the correct strategic posture because:

1. **MyMzansi is inevitable.** The SA government is committed. When it is fully live, platforms that are already integrated will have an insurmountable advantage.

2. **The government needs a private sector partner.** MyMzansi builds infrastructure. It cannot build the intelligence layer — that requires private sector speed, user obsession, and commercial incentives. Skilved is the partner MyMzansi needs.

3. **Verified identity changes everything.** The difference between "I have N3 Electrical" (self-reported) and "N3 Electrical — verified by MyMzansi" (government-confirmed) is the difference between a claim and a fact. Employers pay more for facts.

4. **The certified copy problem disappears.** MyMzansi-verified documents are legally equivalent to certified copies. This eliminates one of the biggest friction points in SA job applications.

**The Stripe analogy:**
> "Stripe didn't build the banking system. They built the intelligence layer on top of it. Skilved isn't building MyMzansi. We're building the economic mobility layer on top of it."

---

## What MyMzansi Provides

### For Workers (Citizens)
- Verified digital identity (government-confirmed who you are)
- Credentials wallet (government-issued qualifications, licences stored securely)
- Consent-based data sharing (citizen controls who sees their data)
- One-tap authentication across all government and partner services

### For Skilved (The Integration)
- **Identity verification:** Confirm that a worker is who they say they are, linked to real SA ID
- **Qualification verification:** Pull government-confirmed qualification records
- **Licence verification:** Pull government-issued licences (driver's, wireman's, etc.)
- **Employment history:** Via UIF records (every formal employer, with dates)
- **Tax number confirmation:** SARS integration
- **Payments rail:** Stipend disbursement for learnerships (Phase 3)

### For Employers / SETAs (Via Skilved)
- Pre-verified candidates — no need to re-verify documents
- Government-grade credential confirmation
- Reduced hiring risk (verified qualifications, not self-reported)

---

## Integration Phases

### Phase 1: Intermediate Verifications (MVP — Now)

Before MyMzansi APIs are fully accessible, Skilved integrates with the existing public verification systems that MyMzansi will eventually consolidate:

| System | API | What It Verifies | Sprint |
|---|---|---|---|
| SAQA | `regqs.saqa.org.za` | All NQF qualifications | Sprint 2 |
| NAMB | Verification portal (partnership) | Trade test certifications | Sprint 3 |
| eNaTIS | RTMC data sharing agreement | Driver's licence, PrDP | Phase 2 |
| SARS | Via MyMzansi eventually | Tax number, employment history | Phase 2 |

### Phase 2: MyMzansi OAuth + Credentials Wallet (Month 6–12)

Full OAuth integration. Workers authenticate with MyMzansi and consent to Skilved reading their verified credentials.

### Phase 3: Full DPI Integration (Month 18+)

Payments rail for stipend disbursement. Full UIF integration. Government procurement pathway.

---

## Phase 1: Document Vault + SAQA / NAMB (MVP)

### What Happens Before MyMzansi APIs Are Accessible

Skilved does not wait for MyMzansi. The Document Vault (doc 33) is built in Sprint 2 with the intermediate verification systems that are available today.

**Sprint 2 — SAQA Integration:**
```typescript
// Every TVET certificate uploaded triggers SAQA verification
const saqa = new SAQAVerifier();
const result = await saqa.verify(certificateNumber, holderName);
if (result.verified) {
  await updateDocumentStatus(docId, 'saqa_verified');
  await awardPassportCompletionScore(userId, +15); // verified docs score higher
}
```

**Sprint 3 — NAMB Integration:**
```typescript
// Every trade test certificate uploaded triggers NAMB lookup
const namb = new NAMBVerifier();
const result = await namb.verify(nambNumber, tradeName);
if (result.verified) {
  await updateDocumentStatus(docId, 'namb_verified');
  await addPassportBadge(userId, 'NAMB_Registered_Artisan');
}
```

**The bridge:** All intermediate verifications (SAQA, NAMB, eNaTIS) will eventually be accessible through the MyMzansi credentials wallet. Building these integrations now means Phase 2 is a migration, not a rebuild.

---

## Phase 2: MyMzansi OAuth + Credentials Wallet

### The OAuth Flow

```
User taps "Verify with MyMzansi" on profile page
    ↓
Redirect to MyMzansi OAuth endpoint
    ↓
User authenticates with their MyMzansi identity
(government-grade authentication — same as accessing Home Affairs)
    ↓
Consent screen:
  "Skilved requests access to:
   ✓ Your verified ID and name
   ✓ Your qualification records
   ✓ Your registered licences
   These will only be used for job applications and profile
   verification. You can revoke access at any time."
    ↓
User grants consent
    ↓
MyMzansi returns access token to Skilved
    ↓
Skilved reads credentials wallet:
  - SA ID: ✓ Verified
  - N3 Electrical Engineering: ✓ Verified (Northlink TVET, March 2024)
  - Trade Test — Electrician: ✓ Verified (NAMB, June 2025)
  - Driver's Licence: ✓ Verified (valid, no endorsements)
    ↓
Passport updated with "MyMzansi Verified" status
"Skilved Verified: MyMzansi" badge appears on public profile
```

### What Changes for Workers

- No more uploading ID copies to every employer
- No more queuing at SETA offices to verify qualifications
- Government-grade verification in one tap
- Share verified credentials with any institution via Skilved — with explicit consent per share

### What Changes for Employers

- "This candidate's qualifications are verified by the South African government" — not self-reported
- Application fraud eliminated
- Verification cost eliminated (no more calling TVET colleges to confirm certificates)
- Premium access to MyMzansi-verified candidates (higher referral fee tier)

### API Technical Spec

```typescript
class MyMzansiClient {
  private baseUrl = 'https://api.mymzansi.gov.za/v1'; // actual URL TBC
  private clientId: string;
  private clientSecret: string;

  // OAuth2 Authorization Code Flow
  getAuthorizationUrl(state: string, scopes: string[]): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: 'https://skilved.com/auth/mymzansi/callback',
      scope: scopes.join(' '),
      state,
      response_type: 'code',
    });
    return `${this.baseUrl}/oauth/authorize?${params}`;
  }

  async exchangeCode(code: string): Promise<MyMzansiToken> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: 'https://skilved.com/auth/mymzansi/callback',
      }),
    });
    return response.json();
  }

  async getIdentity(token: string): Promise<MyMzansiIdentity> {
    const response = await fetch(`${this.baseUrl}/identity`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  }

  async getCredentials(token: string): Promise<MyMzansiCredential[]> {
    const response = await fetch(`${this.baseUrl}/credentials`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  }

  async getLicences(token: string): Promise<MyMzansiLicence[]> {
    const response = await fetch(`${this.baseUrl}/licences`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  }
}

interface MyMzansiIdentity {
  idNumber: string;             // NEVER stored in plaintext
  fullName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  verifiedAt: string;
}

interface MyMzansiCredential {
  type: string;                 // "NQF_QUALIFICATION"
  title: string;                // "N3 Electrical Engineering"
  issuingInstitution: string;
  nqfLevel: number;
  dateAwarded: string;
  verificationReference: string;
  status: 'active' | 'suspended' | 'expired';
}
```

---

## Phase 3: Full DPI Integration

### Stipend Disbursement via MyMzansi Payments Rail

For SETA learnerships where Skilved manages the placement:

```
SETA confirms learnership placement via Skilved
    ↓
Skilved triggers monthly stipend payment via MyMzansi payments API
    ↓
MyMzansi routes to learner's verified bank account
    ↓
Learner receives stipend via bank transfer or MyMzansi wallet
    ↓
Confirmation logged to BigQuery for SETA reporting
```

This closes the entire learnership administration loop:
- Opportunity discovered (Scout Agent)
- Candidate matched (Matching Agent)
- Application submitted (Application Agent)
- Interview coordinated (Interview Coordination Agent)
- Placement confirmed (Outcome Tracker)
- Stipend disbursed (MyMzansi Payments)
- Outcome tracked (Outcome Tracker)
- Graph updated (forever)

**Zero human steps in the entire pipeline.**

### UIF Integration (Employment History)

Via MyMzansi, Skilved can access a worker's UIF (Unemployment Insurance Fund) records — which confirm every formal employer they've ever worked for, with exact dates.

This replaces self-reported work history with government-confirmed employment history. Every employer, every date, every contribution period — verified by SARS/DoL.

---

## Sign In With Skilved / Sign In With MyMzansi

### Two Distinct Things — Both Needed

**"Sign in with MyMzansi"** — Government identity as login credential.
Workers use their MyMzansi identity to authenticate on Skilved. Strongest possible identity verification. Equivalent to government-grade authentication.

**"Sign in with Skilved"** — Skilved identity for third-party platforms.
Other platforms (TVET college portals, employer career pages, SETA portals) offer "Sign in with Skilved" as a login option. Worker uses their Skilved identity — which includes their verified Skills Passport — to authenticate on other platforms. This is OAuth2 with Skilved as the provider.

### MVP (Sprint 1–2): Skilved as Login (Branded)

The current WhatsApp OTP + Google OAuth login is already effectively "Sign in with Skilved." The change is purely branding and framing:

```
Login screen:
  [Sign in with WhatsApp]
  [Sign in with Google]
  [Sign in with MyMzansi] ← coming soon (grayed out)
```

When user shares their profile link and someone clicks "Create your Skilved" — it's framed as creating a Skilved identity, not just creating an account.

### Phase 2: MyMzansi Login

Add "Sign in with MyMzansi" as a primary login option. Workers who have a MyMzansi identity use it to authenticate on Skilved.

### Phase 2: Skilved as OAuth Provider

Build Skilved's own OAuth2 server. Third-party platforms (TVET college portals, SETA application systems) offer "Sign in with Skilved." When a worker uses it, the third-party platform receives the worker's Skilved identity — including their verified Skills Passport, qualification level, trade, and verification status.

This is enormously valuable for SETAs: instead of workers filling in qualification forms on SETA portals, they click "Sign in with Skilved" and their verified skills passport pre-fills the entire form.

---

## Technical Integration Spec

### Environment Variables (Phase 2 additions)

```bash
MYMZANSI_API_URL=https://api.mymzansi.gov.za/v1
MYMZANSI_CLIENT_ID=skilved_client_id
MYMZANSI_CLIENT_SECRET=  # Secret Manager
MYMZANSI_REDIRECT_URI=https://skilved.com/auth/mymzansi/callback
MYMZANSI_SCOPES=identity credentials licences

# Skilved as OAuth provider
SKILVED_OAUTH_SIGNING_KEY=  # Secret Manager
SKILVED_OAUTH_TOKEN_EXPIRY_SECONDS=3600
```

### New API Endpoints (Phase 2)

```
GET  /auth/mymzansi              → Redirect to MyMzansi OAuth
GET  /auth/mymzansi/callback     → Handle OAuth callback
POST /auth/mymzansi/verify       → Verify MyMzansi token
GET  /auth/skilved/authorize     → Skilved as OAuth provider
POST /auth/skilved/token         → Exchange code for token
GET  /auth/skilved/userinfo      → Return Skills Passport as OAuth userinfo
```

### Data Processor Agreement

Before any MyMzansi integration, Skilved must have a signed Data Processor Agreement with DPSA. Skilved is a data processor (processes citizen data on behalf of the data controller — MyMzansi/DPSA). This agreement must:
- Define what data Skilved can access and for what purposes
- Define retention limits
- Define breach notification procedures
- Define citizen rights under POPIA

**Action Month 1:** Contact DPSA/MyMzansi partnership team. Begin agreement negotiation.

---

## Government Partnership Strategy

### The Pitch to Government

> "MyMzansi builds the rails. Skilved builds the train. You've stated your goal: link grant recipients to jobs and training opportunities. We are the mechanism that makes that promise real. Every day Skilved's agents find opportunities, match them to workers, and submit applications — and every outcome we verify makes the next match smarter. We don't compete with MyMzansi. We complete it."

### The Pathway

| Milestone | Action | Timeline |
|---|---|---|
| Begin relationship | Attend MyMzansi developer program events | Month 1 |
| Developer sandbox | Apply for and receive MyMzansi developer access | Month 1 |
| Skills Pulse proof | Show DPSA the Skills Pulse Dashboard | Month 2 |
| Formal partnership | Propose formal private-sector partner agreement | Month 3 |
| Data Processor Agreement | Negotiate and sign | Month 4–6 |
| Technical integration | Begin Phase 2 MyMzansi API integration | Month 6 |
| Pilot | First 1,000 workers with MyMzansi-verified passports | Month 9 |
| Full launch | MyMzansi verification available to all Skilved users | Month 12 |

### The Government's Incentive

MyMzansi needs adoption to prove its value. Every Skilved user who uses "Sign in with MyMzansi" is a MyMzansi adoption event. Every MyMzansi-verified job placement is proof of MyMzansi's social return on investment.

Skilved drives MyMzansi adoption among the exact demographic (youth, trades workers, unemployed) that the government most wants on the platform.

---

## Legal & Compliance

### POPIA Obligations as Data Processor

When processing MyMzansi citizen data, Skilved is a data processor under POPIA. Obligations:
- Process only for the agreed purposes
- Implement appropriate security measures (see `35_Security_Architecture.md`)
- Notify DPSA of any data breach
- Delete data when no longer needed for the specified purpose
- Not transfer data outside SA without DPSA consent

### Automated Decision-Making (POPIA Section 71)

MyMzansi-based identity and qualification data will be used for automated matching decisions. POPIA Section 71 gives citizens the right to object to automated decisions and request human review.

This is already handled by the existing dispute mechanism (FR-24) and the POPIA compliance section of the Permission Model (Doc 26).

---

## The Scope Expansion: Beyond Trades

This is a foundational document point. The MyMzansi integration makes Skilved's scope expansion from trades to all qualifications natural and architecturally inevitable.

**The current framing in all documents says:** "Skilved starts with trades."

**The correct full framing is:**
> "Skilved starts with trades — the most acute pain, highest verification need, and fastest path to verifiable outcomes. The architecture is designed for every qualification level from day one: from matric, to college diplomas, to university degrees, to professional licences. Trades is the entry point, not the ceiling."

**The expansion sequence:**

| Phase | Scope Addition | Why This Phase |
|---|---|---|
| MVP | Trade qualifications (N1–N6, trade test) | Clearest pain, most underserved, SETA supply |
| Phase 2 | All TVET: diplomas, occupational certificates | Same SETA infrastructure |
| Phase 2 | Matric + Grade 12 learnerships | Largest youth volume |
| Phase 3 | University graduates (graduate programmes) | Higher employer willingness to pay |
| Phase 3 | Professional licences (engineering, healthcare) | Verification demand highest here |
| Phase 3 | White-collar: ICT, finance, healthcare | Largest employer SaaS market |

**What enables this:** MyMzansi's credentials wallet covers ALL NQF qualifications — not just trades. The same Document Vault, same Skills Passport, same Application Agent, same verification pipeline works for a software engineering degree as for an N3 Electrical certificate. The scope expansion is a data and source question (more SAQA records, more opportunity sources), not an architecture question.

**Update to all documents:** Replace "12 trade categories" with "starting with trades, expanding to all qualification types." Replace "SA trades workers" with "SA workers at every qualification level."

---

## Change Log

### v1.0 — June 2026
- Initial specification
- NEW — created from portable identity + MyMzansi strategic sessions
- Covers: MyMzansi architecture, 3-phase integration roadmap, OAuth flows, technical spec, government partnership strategy, scope expansion framework

*Document version 1.0 — June 2026*
*Owner: Founder + Engineering + Legal*
*Begin government partnership conversations Month 1*
