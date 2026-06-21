# Skilved — Document Vault
### Portable Verified Economic Identity | Version 1.0 | June 2026

---

## Table of Contents

- [Why This Exists](#why-this-exists)
- [The Strategic Repositioning](#the-strategic-repositioning)
- [Document Types Supported](#document-types-supported)
- [Document Vault Architecture](#document-vault-architecture)
- [Ingestion Paths](#ingestion-paths)
- [Verification Pipeline](#verification-pipeline)
- [Pre-Flight Application Check](#pre-flight-application-check)
- [Sharing & Consent Model](#sharing--consent-model)
- [MyMzansi Integration](#mymzansi-integration)
- [Security Requirements](#security-requirements)
- [Agent 18: Document Verification Agent](#agent-18-document-verification-agent)
- [Sprint Plan](#sprint-plan)
- [POPIA Compliance](#popia-compliance)
- [The Certified Copy Problem](#the-certified-copy-problem)
- [Change Log](#change-log)

---

## Why This Exists

A South African trades worker applies for a learnership at MERSETA. They upload their ID, N3 certificate, proof of address, and trade test certificate. Three months later they apply at EWSETA — same four documents, uploaded again. Then Eskom — same again. Then a bank account for their stipend — same again.

The same 8 documents, uploaded hundreds of times across a lifetime, to institutions that each store their own copy and never talk to each other.

**Skilved Document Vault: upload once, share forever — with your explicit consent every time.**

---

## The Strategic Repositioning

This changes what Skilved fundamentally is.

**Before Document Vault:**
> "Skilved is an AI-powered opportunity matching platform for SA trades workers."

**After Document Vault:**
> "Skilved is South Africa's portable verified economic identity — built on MyMzansi rails — that tells every institution not just who you are, but what you can do, what you've done, and what you should do next."

**The Stripe analogy for investors and XPRIZE judges:**
> "Stripe didn't build the banking system. They built the intelligence layer on top of it that made payments programmable. Skilved isn't building MyMzansi. We're building the intelligence and opportunity layer on top of it that makes economic mobility programmable."

The trades entry point is correct — we start where the pain is highest. But the Document Vault is not a feature of the job platform. The job platform is the first application of the identity vault.

---

## Document Types Supported

### Tier 1 — Core Identity (collected Sprint 2)

| Document | Verification Path | MVP Status |
|---|---|---|
| SA ID document / Smart ID | Home Affairs API via MyMzansi | Self-upload MVP; verified Phase 2 |
| SA ID number | SARS/DHA verification | Pattern validation MVP; verified Phase 2 |
| Passport | Home Affairs API | Self-upload only |

### Tier 2 — Qualifications (collected Sprint 2–3)

| Document | Verification Path | MVP Status |
|---|---|---|
| TVET certificate (N1–N6) | SAQA API (`regqs.saqa.org.za`) | **Verifiable Sprint 2** |
| National diploma | SAQA API | Verifiable Sprint 2 |
| Degree / BTech | SAQA API | Verifiable Sprint 2 |
| Trade test certificate | NAMB register lookup | **Verifiable Sprint 3** |
| Occupational certificate | SAQA API | Verifiable Sprint 2 |
| Academic transcripts | SAQA / institution | Self-upload only initially |

### Tier 3 — Licences & Certifications (collected Sprint 3–4)

| Document | Verification Path | MVP Status |
|---|---|---|
| Driver's licence | eNaTIS API (partnership needed) | Self-upload MVP; Phase 2 verified |
| Professional Driving Permit (PrDP) | eNaTIS API | Self-upload MVP |
| OHAS / Safety certificate | Issuing body varies | Self-upload only |
| First Aid Level 1/2/3 | Issuing body varies | Self-upload only |
| Wireman's Licence | EWSETA / CoE register | Self-upload MVP; Phase 2 verified |
| CIDB grading | CIDB register | Self-upload MVP; Phase 2 verified |
| Lifting machinery operator | DMR register | Self-upload MVP |

### Tier 4 — Employment & Financial (collected Sprint 3–4)

| Document | Verification Path | MVP Status |
|---|---|---|
| Employment history | UIF records (SARS/Dept Labour) | Self-upload MVP; Phase 2 UIF API |
| Payslip | SARS payroll data via MyMzansi | Self-upload MVP |
| Employment letter | Self-upload + employer confirmation | Self-upload only |
| Bank statement / proof | Bank API (future) | Self-upload only |
| Proof of address | Self-upload + timestamp | Self-upload only |
| Tax number (SARS) | SARS eFiling API | Phase 2 |

### Tier 5 — References (covered by Reputation Agent)

Already handled by Agent 10 (Reputation Agent) — employer-verified references via outcome tracking.

---

## Document Vault Architecture

### Storage Design

```
Documents NEVER stored in Firestore.
Documents NEVER appear in logs.
Documents stored ONLY in Cloud Storage with CMEK.

Firestore stores ONLY metadata:
  - Document type
  - Upload timestamp
  - Verification status
  - Storage path reference (encrypted)
  - Expiry date (if applicable)
  - Share history (who, when, consent ID)
  - Hash for integrity verification

Cloud Storage stores ACTUAL files:
  - Bucket: skilved-documents-[env]
  - Customer-Managed Encryption Keys (CMEK)
  - Separate bucket per document sensitivity tier
  - No public access ever
  - Access only via signed URLs with 15-minute expiry
  - Audit logging on every access
```

### Firestore Schema

```typescript
// Collection: identity_documents
interface IdentityDocument {
  id: string;
  userId: string;

  // Document classification
  documentType: DocumentType;
  documentSubtype?: string;         // e.g., "N3_Electrical" within "tvet_certificate"
  issuerName?: string;              // "Northlink TVET College"
  issuerType?: 'government' | 'tvet' | 'university' | 'seta' | 'private';

  // File metadata (NO file content here)
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  storagePath: string;              // ENCRYPTED path reference
  fileHash: string;                 // SHA-256 for integrity

  // Dates
  uploadedAt: Timestamp;
  documentDate?: Timestamp;         // date on the document itself
  expiryDate?: Timestamp;           // driver's licence, First Aid, etc.
  expiryAlertSent?: boolean;

  // Verification
  verificationStatus: VerificationStatus;
  verificationSource?: VerificationSource;
  verificationReference?: string;   // SAQA reference number, NAMB number, etc.
  verifiedAt?: Timestamp;
  verificationDetails?: string;     // what exactly was verified

  // Sharing
  shareHistory: DocumentShare[];
  totalShareCount: number;

  // Status
  status: 'active' | 'replaced' | 'expired' | 'revoked';
  replacedByDocumentId?: string;
  notes?: string;                   // agent-added context
}

type DocumentType =
  | 'sa_id'
  | 'passport'
  | 'tvet_certificate'
  | 'diploma'
  | 'degree'
  | 'trade_test_certificate'
  | 'occupational_certificate'
  | 'transcript'
  | 'drivers_licence'
  | 'prdp'
  | 'ohas_certificate'
  | 'first_aid_certificate'
  | 'wiremans_licence'
  | 'cidb_grading'
  | 'employment_letter'
  | 'payslip'
  | 'bank_statement'
  | 'proof_of_address'
  | 'tax_number'
  | 'uif_record'
  | 'other_certification'
  | 'other';

type VerificationStatus =
  | 'self_reported'           // uploaded, not verified
  | 'pending_verification'    // verification in progress
  | 'saqa_verified'           // verified by SAQA API
  | 'namb_verified'           // verified by NAMB register
  | 'mymzansi_verified'       // verified by MyMzansi (Phase 2)
  | 'employer_confirmed'      // confirmed by employer via Reputation Agent
  | 'verification_failed'     // verification attempted, failed
  | 'unverifiable';           // no verification path available

type VerificationSource =
  | 'saqa' | 'namb' | 'mymzansi' | 'home_affairs'
  | 'employer' | 'enatis' | 'sars' | 'manual';

interface DocumentShare {
  shareId: string;
  sharedAt: Timestamp;
  sharedWithType: 'employer' | 'seta' | 'tvet' | 'bank' | 'other';
  sharedWithName: string;
  sharedWithId?: string;
  consentId: string;            // reference to consents collection
  purpose: string;              // why this was shared
  expiresAt?: Timestamp;        // when share access expires
  revokedAt?: Timestamp;
}
```

---

## Ingestion Paths

### The Four Paths — Ranked by Quality of Data Produced

**Path A: CV / Resume Upload (Primary — Sprint 2)**
User uploads PDF or Word CV → Document AI extracts ALL fields → Skills Profile Agent structures them → passport pre-populated in 60 seconds.

This is the highest-quality ingestion path. A well-made CV contains: work history, qualifications, contact details, certifications, references. One upload fills 80% of the passport.

```typescript
class CVIngestionPipeline {
  async process(file: File, userId: string): Promise<PassportUpdateResult> {
    // Step 1: Extract text via Document AI
    const extracted = await documentAI.processDocument(file, 'cv_parser');

    // Step 2: Skills Profile Agent structures the extraction
    const structured = await skillsProfileAgent.extractFromCV(extracted);

    // Step 3: Present to user for review (never auto-apply without confirmation)
    const review = await this.presentForReview(userId, structured);

    // Step 4: On confirmation, update passport
    if (review.confirmed) {
      await passportService.update(userId, structured);
      await this.extractIndividualDocuments(file, structured, userId);
    }

    return { fieldsExtracted: structured.fieldCount, confirmed: review.confirmed };
  }
}
```

**Path B: WhatsApp Photo of Certificate/Document (Sprint 3)**
User sends photo to Skilved WhatsApp number → Cloud Vision reads it → Document AI extracts qualification details → specific document added to vault.

```
User sends photo via WhatsApp:
  "Hi, I want to add my N3 certificate"
  [photo attached]

Document Verification Agent receives:
  1. Cloud Vision: image quality check
  2. Document AI: "N3 Electrical Engineering, Northlink TVET, March 2024"
  3. SAQA verification: certificate number looked up
  4. WhatsApp confirmation: "Found: N3 Electrical Engineering from
     Northlink TVET College (March 2024). SAQA verified ✓
     Added to your Skilved vault. Reply YES to confirm."
  5. User replies YES → document saved, passport updated
```

**Path C: Direct File Upload (Web/App — Sprint 2)**
Standard file upload on profile page. Supports: PDF, JPG, PNG, DOCX. Max 10MB per document.

Each document upload:
1. File type validation
2. Malware scan (Cloud DLP)
3. CMEK encryption
4. Document AI extraction (if applicable)
5. Metadata stored in Firestore
6. User notified of verification status

**Path D: Manual Profile Form (Existing — Sprint 1)**
Current 5-step onboarding. Still available as fallback. Produces self-reported data without document evidence.

**Path E: Voice Note (Phase 2)**
WhatsApp voice note → transcription → Skills Profile Agent extraction. No documents attached, but richer free-text work history.

**Path F: LinkedIn Import (Phase 2)**
OAuth import → Skills Profile Agent maps to SA trades context. Work history, qualifications, skills all pulled in.

### Onboarding Screen (Updated)

```
Build your Skills Passport:

📄 [Upload your CV]         — fastest, fills everything
📸 [Scan your certificates] — WhatsApp your documents
✍️ [Type it yourself]       — 5-minute form
🔗 [Import from LinkedIn]   — coming soon

Your documents are encrypted and only shared with your consent.
```

---

## Verification Pipeline

### SAQA Integration (Sprint 2)

South African Qualifications Authority has a public verification API.

```typescript
class SAQAVerifier {
  private baseUrl = 'https://regqs.saqa.org.za';

  async verify(certificateNumber: string, holderName: string): Promise<SAQAResult> {
    const response = await fetch(
      `${this.baseUrl}/verifyQualification.php`,
      {
        method: 'POST',
        body: JSON.stringify({
          certificate_number: certificateNumber,
          holder_name: holderName,
        }),
      }
    );

    const result = await response.json();

    return {
      verified: result.status === 'VERIFIED',
      qualificationName: result.qualification_title,
      nqfLevel: result.nqf_level,
      issuingInstitution: result.awarding_institution,
      issueDate: result.date_awarded,
      saqaReference: result.verification_reference,
    };
  }
}
```

**What gets verified:** TVET certificates (N1–N6), national diplomas, degrees, occupational certificates — any qualification registered on the NQF.

**Cost:** Free (public API).

**Timeline:** Sprint 2. Highest-value verification available today.

### NAMB Integration (Sprint 3)

National Artisan Moderation Body maintains the official SA artisan register.

```typescript
class NAMBVerifier {
  // NAMB has a public lookup at namb.org.za/artisan-register/
  // Partnership agreement needed for API access
  // MVP: scrape public verification page
  // Phase 2: formal API partnership

  async verify(nambNumber: string, tradeName: string): Promise<NAMBResult> {
    const page = await playwright.goto(
      `https://namb.org.za/artisan-register/verify?number=${nambNumber}`
    );

    const result = await this.extractVerificationResult(page);

    return {
      verified: result.isRegistered,
      artisanName: result.fullName,
      tradeName: result.trade,
      registrationNumber: nambNumber,
      registrationDate: result.registrationDate,
      status: result.status,         // 'active' | 'suspended' | 'expired'
    };
  }
}
```

**What this unlocks:** The NAMB artisan register is the government database of all trade-tested artisans in SA. Every trade-tested electrician, plumber, welder, etc. is in this database. Skilved having access to this — even partial — changes the employer value proposition completely. Employers can search for "NAMB-registered electricians in Gauteng" and get a verified list.

**Action this week:** Contact NAMB directly. Frame as: "We want to help registered artisans find work faster — can we integrate with your verification system?" They have a mandate to support artisan employment.

### MyMzansi Integration (Phase 2)

Full spec in `34_MyMzansi_Integration.md`. Summary:

Phase 2 replaces self-uploaded documents with government-verified credentials pulled directly from the citizen's MyMzansi wallet via consent-based API.

```
Worker taps "Verify with MyMzansi"
  → OAuth redirect to MyMzansi
  → Worker authenticates with their MyMzansi identity
  → Skilved receives consent token
  → Skilved reads: verified ID, verified qualifications, verified licences
  → "Skilved Verified: MyMzansi" badge appears on passport
  → Documents are now government-grade verified — no more self-upload
```

---

## Pre-Flight Application Check

### The Core Problem

Application Agent cannot submit a complete application if required documents are missing from the vault. Submitting an incomplete application is worse than not applying — it wastes the employer's time and gets the candidate rejected before they're even considered.

### The Pre-Flight Architecture

```typescript
class ApplicationPreFlightChecker {

  async check(
    user: SkillsPassport,
    opportunity: Opportunity,
    documents: IdentityDocument[]
  ): Promise<PreFlightResult> {

    // Get required documents from Analyst Agent extraction
    const required = opportunity.requiredDocuments ?? [];

    // Map document types to vault documents
    const checks = required.map(req => ({
      requirement: req,
      satisfied: this.isSatisfied(req, documents),
      document: this.findDocument(req, documents),
      verificationStatus: this.getVerificationStatus(req, documents),
    }));

    const missing = checks.filter(c => !c.satisfied);
    const unverified = checks.filter(c => c.satisfied && c.verificationStatus === 'self_reported');
    const verified = checks.filter(c => c.satisfied && c.verificationStatus !== 'self_reported');

    return {
      canAutoSubmit: missing.length === 0,
      missingDocuments: missing.map(c => c.requirement),
      unverifiedDocuments: unverified.map(c => c.requirement),
      verifiedDocuments: verified.map(c => c.requirement),
      recommendation: this.getRecommendation(missing, unverified),
    };
  }

  getRecommendation(
    missing: DocumentCheck[],
    unverified: DocumentCheck[]
  ): PreFlightRecommendation {
    if (missing.length === 0 && unverified.length === 0) {
      return 'submit_now';          // all docs present and verified
    }
    if (missing.length === 0) {
      return 'submit_with_warning'; // all docs present, some unverified
    }
    if (missing.length <= 2) {
      return 'request_upload';      // 1-2 docs missing, ask user to upload
    }
    return 'manual_application';    // too many missing, route to manual
  }
}
```

### Pre-Flight Decision Tree

```
Application Agent triggered for opportunity X
         ↓
Pre-Flight Check runs
         ↓
ALL docs present + verified?
    YES → Submit automatically
    NO  ↓
Missing docs?
    YES → WhatsApp user:
          "To apply to [Org] I need [N] documents not in your vault yet.
           Upload them and I'll apply automatically:
           → [Document 1] [Upload]
           → [Document 2] [Upload]
           Or reply SKIP to apply without them.
           I'll hold this application for 24 hours."
         ↓
         User uploads → Submit automatically
         User replies SKIP → Submit with note in log
         User ignores (Level 3) → Hold, re-ask Day 2
         User ignores (Level 4) → Submit without on Day 2
         Opportunity expires → Cancel, notify user
         ↓
All docs present but some UNVERIFIED (self-reported)?
    → Submit with flag: "Note: ID copy is self-reported, not SAQA-verified"
    → WhatsApp: "Applied ✓ — Consider verifying your N3 certificate
                 for stronger future applications. [Verify now →]"
```

### WhatsApp Pre-Flight Request Message

```
Your application to Eskom is almost ready ⚡

I need 2 documents to complete it:

📄 ID copy — not in your vault
📜 N3 Electrical certificate — not in your vault

Upload them here: [secure upload link]
Or reply SKIP to apply without them.

I'll hold this application for 24 hours while you upload.

Already have them in your phone?
Just send them to this WhatsApp chat as photos.
```

### User Uploads Via WhatsApp (Sprint 3)

This is the seamless path: user sends document photos directly to the Skilved WhatsApp number in response to the pre-flight request. No web interface needed.

```
User sends photo of ID card to Skilved WhatsApp
  ↓
Document Verification Agent receives
  ↓
Cloud Vision: document type detection ("South African ID card")
  ↓
Document AI: extracts ID number, name, date of birth
  ↓
Confirmation WhatsApp: "Got your ID ✓
                        Added to your vault securely.
                        Applying to Eskom now..."
  ↓
Application Agent resumes and submits
```

### Review Before Submit (Level 3 Required Step)

Before final submission, user reviews what the agent filled in and what documents are attached. This is the "confirm details" step.

```
Application Agent fills SuccessFactors form
  ↓
Takes screenshot of completed form
  ↓
WhatsApp to user:
  "Your Eskom application is filled in and ready. ✓

   What I filled in:
   • Name: Thabo Nkosi
   • Trade: Electrical
   • NQF level: 3
   • Province: Gauteng
   • Experience: 2 years

   Documents attached:
   📄 CV_Thabo_Nkosi.pdf ✓
   📜 Cover_Letter_Eskom.pdf ✓
   🪪 ID_copy.pdf ✓ (verified)
   📋 N3_Electrical_Northlink.pdf ✓ (SAQA verified)

   Reply YES to submit
   Reply EDIT to change something
   Reply CANCEL to stop"
         ↓
   YES → Agent clicks submit
   EDIT → Customer Success Agent guides correction
   CANCEL → Application cancelled, logged
   No reply 4h → WhatsApp reminder
   No reply 24h (L3) → cancel
   No reply 24h (L4) → submit
```

---

## Sharing & Consent Model

### The Principle: User Controls Every Share

Documents are never shared without explicit per-share consent. The user decides who gets to see their documents, for what purpose, and for how long.

```typescript
interface DocumentShareRequest {
  requestedBy: string;          // employer ID or application ID
  requestedByName: string;
  documentTypes: DocumentType[];
  purpose: string;              // "Application for Electrical Apprenticeship"
  expiresAfterDays: number;     // how long the share remains valid
}

// User receives WhatsApp:
// "[Eskom Holdings] has requested access to your:
//  • ID copy
//  • N3 certificate
//  For: Application for Electrical Apprenticeship
//  Access expires: 30 days
//
//  Reply YES to share  Reply NO to decline"
```

### Application Agent Sharing (Automated)

When Application Agent submits a form that requires document uploads, it shares the documents on the user's behalf under the Level 3/4 consent already captured. This is covered by the existing Level 3 consent — "I consent to Skilved submitting applications on my behalf" — which includes document sharing as part of the application process.

Level 3 consent language (to be updated in `26_Worker_Permission_Model.md`):
> "I consent to Skilved submitting job applications on my behalf, including attaching the relevant documents from my Skilved vault, for opportunities with a match score of 85% or higher."

### Share Audit Trail

Every document share is logged permanently:
- Who it was shared with
- What documents were shared
- When
- Which consent covered it
- Whether the share has expired

Users can see their full share history in settings. They can revoke unexpired shares.

---

## MyMzansi Integration

Full detailed spec in `34_MyMzansi_Integration.md`. Key points:

**What MyMzansi provides:**
- Digital identity verification (SA ID confirmed by Home Affairs)
- Credentials wallet (government-issued qualifications, licences)
- Data exchange APIs (citizen-consented data sharing)
- OAuth-style login using government identity

**Integration phases:**
- **Phase 2 (Month 6–12):** MyMzansi OAuth login + credentials wallet read
- **Phase 3 (Month 18+):** Full DPI integration including payments rail for stipend disbursement

**Why this matters for the Document Vault:**
MyMzansi-verified documents are the legal equivalent of certified copies. This eliminates the certified copy problem entirely for supported document types.

---

## Security Requirements

**Critical: The Document Vault holds identity documents. Security is not optional overhead.**

Full security architecture in `35_Security_Architecture.md`. Summary of non-negotiables:

- Documents stored ONLY in Cloud Storage with CMEK (Customer-Managed Encryption Keys)
- Document metadata in Firestore — NO document content ever
- Zero document content in any logs (enforced by Cloud DLP scanning of logs)
- Signed URLs for document access — 15-minute expiry, single-use
- Full audit log on every document access
- Separate IAM service accounts for document read vs write vs verify
- Security audit required before Document Vault goes live (budget R50K–R100K)
- Breach insurance (budget R20K–R50K/year)

---

## Agent 18: Document Verification Agent

### NEW v6.0

*The AI employee who keeps your vault current, verified, and complete.*

### Job
Monitor the document vault: trigger verification for new uploads, alert users when documents expire, run pre-flight checks for Application Agent, and surface vault completeness nudges.

### Runs
- Event-driven: on every document upload
- Daily batch: check expiry dates, run pending verifications
- On Application Agent pre-flight request: check vault against requirements
- Weekly: surface enrichment nudges ("Your Wireman's Licence unlocks 12 more opportunities")

### Core Functions

```typescript
class DocumentVerificationAgent {

  // Triggered on document upload
  async onDocumentUploaded(doc: IdentityDocument): Promise<void> {
    const verifier = this.getVerifier(doc.documentType);
    if (verifier) {
      await this.triggerVerification(doc, verifier);
    }
    await this.updatePassportCompleteness(doc.userId);
    await this.checkPreFlightQueues(doc.userId);
  }

  // Daily batch
  async dailyBatch(): Promise<void> {
    await this.checkExpiringDocuments();     // alert 30/7/1 days before expiry
    await this.retryFailedVerifications();   // retry SAQA/NAMB that failed
    await this.surfaceEnrichmentNudges();    // "add X to unlock Y"
  }

  // Pre-flight for Application Agent
  async preFlightCheck(
    userId: string,
    opportunityId: string
  ): Promise<PreFlightResult> {
    const docs = await this.getVaultDocuments(userId);
    const required = await this.getRequiredDocuments(opportunityId);
    return this.checker.check(null, null, docs);
  }

  // Expiry alerts
  async checkExpiringDocuments(): Promise<void> {
    const expiring = await this.getExpiringDocuments(30); // next 30 days
    for (const doc of expiring) {
      await this.sendExpiryAlert(doc);
    }
  }
}
```

### GCP Stack
`Cloud Functions (event-driven) + Cloud Scheduler (daily) → Document AI → SAQA API → NAMB API → Cloud Vision → Firestore → BigQuery → WhatsApp API`

### Autonomy Level
Full. Zero human approvals.

### Sprint
Sprint 2 (basic upload + SAQA verification) → Sprint 3 (NAMB + WhatsApp photo intake) → Phase 2 (MyMzansi).

---

## Sprint Plan

### Sprint 2 (Week 3–4) — Document Vault Foundation

**Infrastructure:**
- [ ] Cloud Storage bucket setup with CMEK (`skilved-documents-prod`)
- [ ] Firestore `identity_documents` collection schema
- [ ] Document upload API (`POST /api/documents/upload`)
- [ ] Document AI processor configured for CV parsing and certificate extraction
- [ ] Cloud DLP configured to prevent PII in logs
- [ ] SAQA API integration live

**UX:**
- [ ] Document upload section on profile page
- [ ] "Build your Skills Passport" onboarding screen with 4 paths (Upload CV, Scan docs, Type it, coming soon)
- [ ] CV upload flow: upload → Document AI → review → confirm → passport populated
- [ ] Document list view with verification status badges
- [ ] Soft nudge: "Upload your N3 certificate to unlock SAQA verification"

**Profile onboarding update:**
- [ ] CV upload as primary onboarding path (before the form)
- [ ] Document upload contributing to passport completeness score

**Level 3 activation update:**
- [ ] Soft nudge to upload core documents (ID + highest qualification) during Level 3 flow
- [ ] Not a hard gate — but clear messaging: "Applications are stronger with verified documents"

### Sprint 3 (Week 5–6) — Pre-Flight + WhatsApp Intake

**Application Agent integration:**
- [ ] Analyst Agent extracts `requiredDocuments[]` for every opportunity
- [ ] Pre-flight check before every Application Agent submission
- [ ] WhatsApp pre-flight request message
- [ ] "Review before submit" flow with screenshot
- [ ] Document attachment to ATS form submissions

**WhatsApp document intake:**
- [ ] Webhook handler routes document photos to Document Verification Agent
- [ ] Cloud Vision document type detection
- [ ] Document AI extraction from photos
- [ ] Confirmation flow before vault save
- [ ] NAMB artisan register integration

**UX:**
- [ ] Document vault page (`/vault`)
- [ ] Share history view
- [ ] Expiry alerts in WhatsApp

### Sprint 4 (Week 7–8) — Polish + XPRIZE

- [ ] Agent 18 (Document Verification Agent) fully automated
- [ ] Expiry alerts live (30/7/1 day warnings)
- [ ] Enrichment nudges: "Add Wireman's Licence to unlock 12 more opportunities"
- [ ] Document sharing consent model (per-share consent for employer requests)
- [ ] Full audit trail in admin dashboard
- [ ] Verified document count in XPRIZE submission metrics

### Phase 2 — MyMzansi Integration

- [ ] MyMzansi OAuth flow
- [ ] Credentials wallet read API
- [ ] "Sign in with MyMzansi" option
- [ ] "Verify with MyMzansi" flow for existing self-uploaded documents
- [ ] Certified copy equivalence for MyMzansi-verified documents

---

## POPIA Compliance

### Special Personal Information

SA ID numbers, biometric data (face photos), and health information are **special personal information** under POPIA Section 26. Processing requires explicit consent AND specific purpose specification AND cannot be used for other purposes.

**Implementation:**
- ID number is stored in encrypted form only
- ID number is NEVER included in logs
- ID number is NEVER passed to Gemini or any AI model
- Explicit consent captured for every document type with purpose stated
- Purpose limitation enforced: documents uploaded for job applications cannot be used for marketing

### Consent Architecture for Documents

```typescript
type DocumentConsentPurpose =
  | 'job_applications'          // Application Agent can attach
  | 'skills_verification'       // Matching Agent can reference
  | 'employer_direct_share'     // Worker manually shares with employer
  | 'seta_placement'            // SETA placement administration
  | 'skilved_profile'           // Display on public profile

// Each document upload captures which purposes are consented to
interface DocumentConsent {
  documentId: string;
  userId: string;
  purposes: DocumentConsentPurpose[];
  capturedAt: Timestamp;
  consentVersion: string;
  ipAddress: string; // hashed
  explicit: true;    // always — no implied consent
}
```

### Right to Deletion

When user requests account deletion:
- All documents deleted from Cloud Storage within 24 hours
- All document metadata deleted from Firestore within 24 hours
- Share history anonymised (counterparty records retained for legal compliance)
- Document content irretrievably destroyed (Cloud Storage `gsutil rm` with secure delete)

---

## The Certified Copy Problem

### The Problem

Many SA employers and SETAs require **certified copies** — documents stamped by a commissioner of oaths or police officer. A scanned PDF is not legally equivalent to a certified copy.

### MVP Response

Application Agent flags when "certified copy" is required:
```
WhatsApp pre-flight message:
"[Employer] requires CERTIFIED copies — documents must be stamped
 by a commissioner of oaths.

 I can't certify documents automatically. Options:
 1. Take your documents to your nearest police station or
    post office for certification (free, takes ~30 minutes)
 2. Apply anyway — some employers accept digital copies
    for screening and ask for certified copies later

 Reply 1 to hold this application until you certify
 Reply 2 to apply now anyway"
```

### Phase 2 Solution

MyMzansi-verified documents ARE the certified copy. Government-verified digital documents are legally equivalent to certified copies for all government and SETA purposes. This is one of MyMzansi's explicit goals.

For MVP: honest flagging. For Phase 2: the problem disappears.

---

## Change Log

### v1.0 — June 2026
- Initial specification
- NEW — created in response to Document Vault + Portable Identity strategic sessions
- Covers: document vault architecture, 4 ingestion paths, SAQA/NAMB verification, pre-flight checks, sharing model, MyMzansi integration preview, Agent 18 spec, sprint plan, POPIA compliance

*Document version 1.0 — June 2026*
*Owner: Engineering + Legal*
*Security audit required before Document Vault goes live in production*
