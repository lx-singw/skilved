# Skilved — AI Employees Architecture
### The 19 Agents That Run the Business | Version 6.0 | June 2026

---

## Table of Contents

- [The Fundamental Reframe](#the-fundamental-reframe)
- [The 19 AI Employees — Overview](#the-19-ai-employees--overview)
- [Agents 0–17 Summary Table](#agents-017-summary-table)
- [Agent 5: Application Agent — Updated v6.0](#agent-5-application-agent--updated-v60)
- [Agent 18: Document Verification Agent](#agent-18-document-verification-agent-new-v60)
- [Agent 19: Scope Expansion Agent](#agent-19-scope-expansion-agent-new-v60)
- [The ATS Adapter Strategy](#the-ats-adapter-strategy)
- [The Agent Coordination Layer](#the-agent-coordination-layer)
- [XPRIZE Demonstration](#xprize-demonstration)
- [MVP Agent Priority](#mvp-agent-priority-build-order)
- [Change Log](#change-log)

---

## The Fundamental Reframe

Most teams build: User → searches → job board → applies

Skilved builds:
```
Agent scouts → Agent analyses → Agent matches → Agent applies
Agent verifies documents → Agent confirms → User wakes up to results
User's identity is portable, verified, and permanently theirs
```

**The user becomes the exception. The agent is the default.**

**The XPRIZE vision:**
> "We didn't optimise the existing system. We changed what information is available, to whom, and when — and we gave South African workers a portable verified economic identity they can carry forever. Starting with trades. Expanding to every qualification level."

---

## The 19 AI Employees — Overview

```
SUPPLY SIDE       MATCHING LAYER    DEMAND SIDE
Agent 0           Agent 3           Agent 4
SKILLS PROFILE    MATCHING          CAREER

Agent 1           Agent 5           Agent 8
SCOUT             APPLICATION       CUSTOMER SUCCESS
(ATS detect +     (ATS adapters +   (simulation routing)
 TVET colleges)    pre-flight +
                   review-before)

Agent 2           Agent 12          Agent 15
ANALYST           INTERVIEW COORD   CAREER SIMULATION
(+ reqd docs)

IDENTITY LAYER (NEW v6.0)
Agent 18: DOCUMENT VERIFICATION
Vault monitoring, SAQA/NAMB, pre-flight checks, expiry alerts

INTELLIGENCE LAYER
Agent 14           Agent 16          Agent 17
SKILLS PULSE       EMPLOYER ACCT     COLLECTIVE INTEL

BUSINESS LAYER
Agent 6: REVENUE   Agent 7: GROWTH

GROWTH LAYER (NEW v6.0)
Agent 19: SCOPE EXPANSION
Gap analysis, new source discovery, opportunity type extension

THE GRAPH + DOCUMENT VAULT
BigQuery (outcomes) + Cloud Storage (documents, CMEK)
```

---

## Agents 0–17 Summary Table

| # | Agent | Trigger | Core Job | Sprint |
|---|---|---|---|---|
| 0 | Skills Profile | Event (profile update) | Build + enrich Skills Passport | 2 |
| 1 | Scout | Every 4h | Find all SA opportunities + ATS detect + TVET colleges | 1 |
| 2 | Analyst | Per new opportunity | Extract intelligence + ATS metadata + required_documents[] | 1 |
| 3 | Matching | Per feed request | Rank per passport + cohort signals | 2 |
| 4 | Career | Passport ≥ 40% | Career path + simulation integration | 3 |
| 5 | Application | Level 3+ | ATS adapters + pre-flight + review-before-submit | 3 |
| 6 | Revenue | Event-driven | Upgrade prompts (reads agent_context) | 4 |
| 7 | Growth | Daily | Content, community, SEO | 4 |
| 8 | Customer Success | Always-on | Onboarding, support, simulation routing | 3 |
| 9 | Notification | Daily 7am | Personalised WhatsApp digest | 2 |
| 10 | Reputation | Phase 2 stub | Trust score synthesis | Phase 2 |
| 11 | Credential Issuance | Phase 2 stub | W3C VC issuance | Phase 2 |
| 12 | Interview Coordination | Sprint 4 stretch | Detect interviews, schedule, prep | Sprint 4 |
| 13 | Gig | Phase 2/3 stub | Gig work back office | Phase 2/3 |
| 14 | Skills Pulse | Daily 2am | National intelligence dashboard | 1→4 |
| 15 | Career Simulation | Per query | "What if I do X?" | 3→4 |
| 16 | Employer Accountability | Weekly | Employer scores from outcomes | 3→4 |
| 17 | Collective Intelligence | Per feed + daily | Cohort career intelligence | 2→4 |

---

## Agent 5: Application Agent — Updated v6.0

*The AI employee who submits applications with complete verified documents.*

### Key Updates in v6.0

**1. Pre-Flight Check (new)**
Before any submission, Agent 18 pre-flight check is called. If documents are missing, the submission is HELD — never submitted incomplete.

**2. Review Before Submit (new — Level 3 required, Level 4 optional)**
After form-filling, before final click:
- Screenshot of completed form generated
- Document list with verification status compiled
- WhatsApp sent to user: "Your application to Eskom is ready. [Details]. Reply YES to submit."
- Level 3: always waits for YES
- Level 4: submits after 24h silence

**3. Document Attachment (new)**
Required documents attached from Document Vault via signed URLs. Agent never sees document content — only passes signed URL to form submission.

**4. Certified Copy Handling (new)**
When employer requires certified copies, agent flags this to user and offers two paths: hold until certified, or apply anyway with note.

### Updated Submission Flow

```
Application Agent triggered (Level 3/4, match threshold met)
    ↓
Pre-flight check (Agent 18) → all docs present?
    NO → WhatsApp user with upload request → hold for 24h
    YES ↓
Generate CV + Cover Letter (Gemini)
    ↓
Fill ATS form via adapter (SuccessFactors/Taleo/etc.)
    ↓
Take screenshot of completed form
    ↓
Compile: what was filled in + documents to attach + verification status
    ↓
WhatsApp review message to user:
  "Your [Org] application is ready ✓
   [Form details]
   Documents: CV ✓ Cover Letter ✓ ID ✓ (verified) N3 ✓ (SAQA)
   Reply YES to submit / EDIT to change / CANCEL"
    ↓
Level 3: wait for YES (hold up to 24h, then cancel if no reply)
Level 4: submit after 4h if no reply
    ↓
User replies YES → click submit → capture reference → WhatsApp confirmation
User replies EDIT → Customer Success Agent guides correction
User replies CANCEL → cancel and log
    ↓
Log to BigQuery: ats_platform, captcha_encountered, captcha_solved,
                 pre_flight_passed, review_confirmed, human_approvals_required: 0
```

---

## Agent 18: Document Verification Agent — NEW v6.0

*The AI employee who keeps your vault current, verified, and pre-flight ready.*

### Job

Monitor the Document Vault. Trigger SAQA/NAMB/MyMzansi verification for new uploads. Alert users when documents expire. Run pre-flight checks for Application Agent. Surface enrichment nudges ("adding your Wireman's Licence unlocks 12 more opportunities").

### Runs

- **Event-driven:** On every document upload
- **Daily batch:** Expiry checks, retry failed verifications, enrichment nudges
- **On Application Agent request:** Return cached pre-flight result (< 100ms from Redis)
- **Weekly (Mondays):** Vault completeness summary to user via WhatsApp

### Core Logic

```typescript
class DocumentVerificationAgent {

  async onDocumentUploaded(doc: IdentityDocument): Promise<void> {
    const verifier = this.getVerifier(doc.documentType);
    if (verifier) await this.triggerVerification(doc, verifier);
    await this.updatePassportCompleteness(doc.userId);
    await this.checkPendingPreFlights(doc.userId);
    await this.invalidatePreFlightCache(doc.userId);
    await this.bigquery.log({ agent_name: 'document_verification',
      action: 'upload_processed', human_approvals_required: 0 });
  }

  async preFlightCheck(userId: string, opportunityId: string): Promise<PreFlightResult> {
    const cached = await this.redis.get(`preflight:${userId}:${opportunityId}`);
    if (cached) return JSON.parse(cached);

    const docs = await this.getVaultDocuments(userId);
    const opp = await this.getOpportunity(opportunityId);
    const required = opp.intelligence?.requiredDocuments ?? [];
    const result = await this.checker.check(docs, required);

    await this.redis.setex(`preflight:${userId}:${opportunityId}`, 3600,
      JSON.stringify(result));
    return result;
  }

  async checkExpiringDocuments(): Promise<void> {
    for (const days of [30, 7, 1]) {
      const expiring = await this.getDocumentsExpiringInDays(days);
      for (const doc of expiring) {
        if (!doc.expiryAlertSent) {
          await this.sendExpiryAlert(doc, days);
          await this.markAlertSent(doc.id);
        }
      }
    }
  }
}
```

### Verification Sources

| Source | Documents Verified | Sprint |
|---|---|---|
| SAQA API | All NQF qualifications (N1–N6, diplomas, degrees) | Sprint 2 |
| NAMB register | Trade test certificates, artisan registration | Sprint 3 |
| Cloud Vision | Document type detection from photos | Sprint 3 |
| MyMzansi OAuth | All government credentials (Phase 2) | Phase 2 |
| eNaTIS | Driver's licence, PrDP (Phase 2) | Phase 2 |

### Pre-Flight Result

```typescript
interface PreFlightResult {
  canAutoSubmit: boolean;
  missingDocuments: RequiredDocument[];
  unverifiedDocuments: RequiredDocument[];
  verifiedDocuments: RequiredDocument[];
  certifiedCopyRequired: boolean;
  recommendation:
    | 'submit_now'
    | 'submit_with_warning'
    | 'request_upload'
    | 'manual_application';
  userMessage?: string;
  holdUntil?: Timestamp;
}
```

### GCP Stack
`Cloud Functions (event) + Cloud Scheduler (daily 1am) → Document AI → SAQA API → NAMB API → Cloud Vision → Firestore → Redis → BigQuery → WhatsApp API`

### Autonomy Level
**Full. Zero human approvals.**

---

## Agent 19: Scope Expansion Agent — NEW v6.0

*The AI employee who continuously widens Skilved's opportunity reach.*

### Job

Monitor opportunity distribution across qualification levels and sectors. Identify gaps (province × NQF level combinations with few opportunities). Discover new source portals. Propose new Scout Agent crawlers.

### Runs

- **Weekly:** Opportunity distribution analysis, gap identification
- **Monthly:** New source discovery — Gemini-powered search for new portals
- **On admin trigger:** Expand to specific new sector or qualification level

### Core Logic

```typescript
class ScopeExpansionAgent {

  async weeklyAnalysis(): Promise<ExpansionAnalysis> {
    const distribution = await this.analyseOpportunityDistribution();
    const gaps = this.identifyGaps(distribution);
    const addressable = await this.findAddressableGaps(gaps);
    const recommendations = this.generateRecommendations(addressable);

    await this.bigquery.log({ agent_name: 'scope_expansion',
      gaps_identified: gaps.length,
      recommendations_generated: recommendations.length,
      human_approvals_required: 0 });

    return { distribution, gaps, recommendations };
  }

  identifyGaps(distribution: Distribution): Gap[] {
    const gaps = [];
    // NQF levels with < 10 active opportunities
    for (let nqf = 1; nqf <= 10; nqf++) {
      const count = distribution.filter(d => d.nqf_level_required === nqf)
        .reduce((sum, d) => sum + d.count, 0);
      if (count < 10) gaps.push({ type: 'nqf_level', nqfLevel: nqf, count });
    }
    // Provinces with < 20 opportunities
    for (const province of ALL_PROVINCES) {
      const count = distribution.filter(d => d.province === province)
        .reduce((sum, d) => sum + d.count, 0);
      if (count < 20) gaps.push({ type: 'province', province, count });
    }
    return gaps;
  }
}
```

### Autonomy Level
**Semi-autonomous.** Discovers gaps + proposes sources. Engineering reviews source proposals before crawlers are built — the one place a human step is appropriate.

### GCP Stack
`Cloud Scheduler (weekly) → Cloud Run → BigQuery → Gemini (source discovery) → Firestore → Admin dashboard`

### Sprint
Sprint 4 basic → Phase 2 full.

---

## The ATS Adapter Strategy

*(Full spec in Doc 29)*

| Platform | Sprint | Employers | Coverage |
|---|---|---|---|
| Email | 1 | Govt, NGOs | ~20% |
| SAP SuccessFactors | 2 | Eskom, Sasol | ~25% |
| Oracle Taleo/HCM | 3 | Transnet, mining | ~20% |
| PageUp | 3 | Construction | ~10% |
| MERSETA Portal | 3 | All MERSETA | ~8% |
| EWSETA Portal | 3 | All EWSETA | ~5% |
| CETA Portal | 4 | All CETA | ~5% |
| Generic Playwright | 4 | Unknown | ~7% |

CAPTCHA: 2captcha/CapSolver, ~R0.18/solve.
Review before submit: screenshot + WhatsApp YES/EDIT/CANCEL flow.

---

## The Agent Coordination Layer

*(agent_context — unchanged from v5.0 base)*

**New flags v6.0:**
```typescript
flags: {
  // ... existing ...
  documentUploadedAt?: Timestamp;
  preFlightCheckUpdatedAt?: Timestamp;
  vaultComplete?: boolean;
  certifiedCopyRequiredForPendingApp?: boolean;
}
```

**New coordination behaviours v6.0:**
- Application Agent checks `vaultComplete` before pre-flight — if false, routes to Agent 18 first
- Customer Success Agent checks `certifiedCopyRequiredForPendingApp` to surface certification guidance
- Skills Profile Agent reads `documentUploadedAt` to trigger re-enrichment

---

## XPRIZE Demonstration

> "In the last 24 hours, Skilved's 19 AI agents made 7,100+ autonomous decisions:
>
> Document Verification Agent: SAQA-verified 23 qualifications, NAMB-verified 4 trade tests, ran 89 pre-flight checks, sent 3 expiry alerts, held 2 applications pending uploads (resolved within 4h).
>
> Application Agent: submitted 34 applications — all with complete verified documents, all preceded by user review confirmation.
>
> Zero incomplete applications. Zero human approvals.
>
> 27 workers had their qualifications verified without picking up the phone or visiting a TVET college.
>
> This is what portable verified economic identity looks like."

---

## MVP Agent Priority (Build Order)

| Sprint | Agents | Key Additions v6.0 |
|---|---|---|
| 1 | Scout (TVET colleges added) + Analyst (req docs) + Quality + Skills Pulse v1 | TVET college sources, required_documents extraction |
| 2 | Skills Profile + Matching + Collective v1 + **Agent 18 v1 (SAQA)** + Micro-creds | Document Vault + SAQA + onboarding paths |
| 3 | Career + Career Sim v1 + Application (**pre-flight + review-before**) + Employer Acct v1 + **Agent 18 v2 (NAMB + photo)** | Pre-flight, review-before-submit, NAMB |
| 4 | Application v2 + Revenue + Growth + Skills Pulse v2 + **Agent 18 full** + **Agent 19 stub** | Full doc pipeline, scope expansion stub |

---

## Change Log

### v6.0 — June 2026
- Added Agent 18: Document Verification Agent (full spec)
- Added Agent 19: Scope Expansion Agent (full spec)
- Updated Agent 5 (Application Agent): pre-flight check, review-before-submit, document attachment, certified copy handling
- Updated Agent 2 (Analyst): extracts required_documents[] for every opportunity
- Updated Agent 1 (Scout): 3 portal aggregator sources (PuffAndPass, RecentJobs, StudentRoom) as Sprint 1 sources; TVET colleges and SETA crawlers deferred
- Updated agent_context with Document Vault flags
- Updated XPRIZE demonstration script (19 agents, 7,100+ decisions, 0 incomplete applications)
- Updated build order table

### v5.0 — June 2026
- Added Agents 14–17, ATS adapters, CAPTCHA solver, coordination layer

