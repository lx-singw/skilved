# CLAUDE.md — Skilved Codebase Context
### For Claude Code | Version 6.0 | Keep Updated as Architecture Evolves

---

## Table of Contents

- [What Is Skilved](#what-is-skilved)
- [Monorepo Structure](#monorepo-structure)
- [The 8-Week Sprint Context](#the-8-week-sprint-context)
- [The 19 AI Employees](#the-19-ai-employees)
- [GCP Services Used](#gcp-services-used)
- [Data Architecture](#data-architecture)
- [Document Vault Architecture](#document-vault-architecture)
- [ATS Adapter Architecture](#ats-adapter-architecture)
- [Intelligence Layer Summary](#intelligence-layer-summary)
- [Key Domain Types](#key-domain-types)
- [Coding Conventions](#coding-conventions)
- [Environment Setup](#environment-setup)
- [Common Tasks](#common-tasks)
- [Do Not](#do-not)
- [Change Log](#change-log)

---

## What Is Skilved

Skilved is South Africa's portable verified economic identity — built on MyMzansi DPI rails — that tells every institution not just who you are, but what you can do, what you've done, and what you should do next.

**Core thesis:** MyMzansi answers "who are you?" Skilved answers "what should you do next?" — and stores all the verified documents you need to prove it.

**Scope:** Starts with trades (N1–N6, trade test). Expands to all TVET qualifications, Grade 12 learnerships, university graduates, and professional licences. The architecture is qualification-agnostic — same agents, same passport, same vault for any NQF level.

**The XPRIZE vision:** Bringing the future to the present — national skills intelligence, career simulation, employer accountability, collective intelligence, and portable verified identity. None of these existed before Skilved.

---

## Monorepo Structure

```
skilved/
├── apps/
│   ├── web/          → Next.js 14 PWA (user-facing)
│   ├── agents/       → 19 Cloud Run / Cloud Functions agent services
│   │   ├── skills-profile/
│   │   ├── scout/                   (+ TVET college sources)
│   │   ├── analyst/                 (+ required_documents extraction)
│   │   ├── quality/
│   │   ├── matching/
│   │   ├── career/
│   │   ├── application/             (+ pre-flight + review-before-submit)
│   │   ├── revenue/
│   │   ├── growth/
│   │   ├── customer-success/
│   │   ├── reputation/              Phase 2 stub
│   │   ├── credential-issuance/     Phase 2 stub
│   │   ├── interview-coordination/  Sprint 4 stretch
│   │   ├── gig/                     Phase 2/3 stub
│   │   ├── skills-pulse/            Agent 14 ★
│   │   ├── career-simulation/       Agent 15 ★
│   │   ├── employer-accountability/ Agent 16 ★
│   │   ├── collective-intelligence/ Agent 17 ★
│   │   ├── document-verification/   Agent 18 ★ NEW v6.0
│   │   ├── scope-expansion/         Agent 19 ★ NEW v6.0
│   │   ├── notification/
│   │   ├── outcome-tracker/
│   │   └── webhook-handler/
│   └── admin/        → Internal admin + XPRIZE demo dashboard
├── packages/
│   ├── types/        → Shared TypeScript types
│   ├── utils/        → Shared utilities
│   ├── ui/           → Shared component library
│   ├── config/       → Shared configs
│   └── database/     → Firestore + BigQuery + Cloud Storage clients
├── infrastructure/   → Terraform (GCP)
└── scripts/          → One-off scripts
```

---

## The 8-Week Sprint Context

| Sprint | Weeks | Theme | New v6.0 Additions |
|---|---|---|---|
| 1 | 1–2 | Feed + ATS Detection + Skills Pulse v1 | TVET colleges in Scout, required_documents in Analyst |
| 2 | 3–4 | Skills Passport + Document Vault + SAQA | Agent 18 v1, 4 onboarding paths, CV ingestion |
| 3 | 5–6 | Agents + Pre-flight + Review-before | Application Agent pre-flight + review, Agent 18 v2 (NAMB + photo) |
| 4 | 7–8 | Scale + Full Intelligence + Submit | Agent 18 full, Agent 19 stub, full doc pipeline |

---

## The 19 AI Employees

| Agent | Location | Trigger | What It Decides | Sprint |
|---|---|---|---|---|
| 0. Skills Profile | `agents/skills-profile/` | Event (profile update) | Extract, structure, enrich passport | 2 |
| 1. Scout | `agents/scout/` | Cloud Scheduler 4h | Ingest opps from 3 portal sources + ATS detect | 1 |
| 2. Analyst | `agents/analyst/` | Pub/Sub | Extract intelligence + ATS + required_documents[] | 1 |
| 3. Quality | `agents/quality/` | Pub/Sub | Publish/reject/flag | 1 |
| 4. Matching | `agents/matching/` | HTTP per feed | Rank per passport + cohort | 2 |
| 5. Career | `agents/career/` | Passport ≥ 40% | Career path + simulation integration | 3 |
| 6. Application | `agents/application/` | HTTP Level 3+ | ATS adapters + pre-flight + review | 3 |
| 7. Revenue | `agents/revenue/` | Cloud Functions event | Upgrade prompts | 4 |
| 8. Growth | `agents/growth/` | Cloud Scheduler daily | Content, community, SEO | 4 |
| 9. Customer Success | `agents/customer-success/` | Always-on WhatsApp | Onboarding, support, simulation routing | 3 |
| 10. Reputation | `agents/reputation/` | Phase 2 stub | Trust score synthesis | Phase 2 |
| 11. Credential Issuance | `agents/credential-issuance/` | Phase 2 stub | W3C VC issuance | Phase 2 |
| 12. Interview Coordination | `agents/interview-coordination/` | Sprint 4 stretch | Interview detect, schedule, prep | Sprint 4 |
| 13. Gig | `agents/gig/` | Phase 2/3 stub | Gig work back office | Phase 2/3 |
| 14. Skills Pulse | `agents/skills-pulse/` | Cloud Scheduler 2am | National intelligence dashboard | 1→4 |
| 15. Career Simulation | `agents/career-simulation/` | HTTP + batch | "What if I do X?" simulation | 3→4 |
| 16. Employer Accountability | `agents/employer-accountability/` | Cloud Scheduler weekly | Employer scores from outcomes | 3→4 |
| 17. Collective Intelligence | `agents/collective-intelligence/` | HTTP per feed + batch | Cohort career intelligence | 2→4 |
| **18. Document Verification** | `agents/document-verification/` | **Event + daily batch** | **SAQA/NAMB/MyMzansi verification, pre-flight, expiry alerts** | **2→4** |
| **19. Scope Expansion** | `agents/scope-expansion/` | **Weekly + monthly** | **Gap analysis, new source discovery** | **4→Phase 2** |

**Key principle:** `human_approvals_required = 0` in every BigQuery `agent_runs` row. Always. Circuit breaker halts log `circuit_breaker_triggered`. Incomplete application holds log `pre_flight_held`. Neither is a human approval.

---

## GCP Services Used

| Service | Purpose | Agents That Depend On It |
|---|---|---|
| Cloud Run | All agent execution | All 19 agents |
| Cloud Scheduler | Scout (4h), Notification (7am), Growth (daily), Skills Pulse (2am), Doc Verification (1am), Scope Expansion (weekly) | 6 agents |
| Cloud Pub/Sub | Agent pipeline communication | Scout→Analyst→Quality→Matching |
| Cloud Functions | Event-driven agents | Skills Profile, Revenue, Outcome Tracker, Document Verification |
| Document AI | CV parsing, certificate extraction, photo intake | Skills Profile, Document Verification |
| Cloud Vision | Document type detection from WhatsApp photos | Document Verification |
| Cloud Storage (CMEK) | Document vault — encrypted file storage | Document Verification, Application |
| Cloud KMS | Customer-managed encryption keys for documents | Document Verification |
| Cloud DLP | Malware scanning on uploads, PII log prevention | Document Verification |
| Firestore | Operational DB | All agents |
| BigQuery | The graph + audit logs | All agents |
| Vertex AI Search | Opportunity indexing | Scout, Matching |
| Vertex AI Ranking | Personalised feed ranking | Matching |
| Gemini API | 14 of 19 agents use it | Most agents |
| Playwright on Cloud Run | ATS web form submission | Application |
| Gmail API / SMTP | Email applications | Application |
| WhatsApp Business API | All worker communication | Notification, CS, Outcome Tracker, Document Verification |
| Cloud Memorystore (Redis) | Feed cache, cohort cache, pre-flight cache | Matching, Collective Intelligence, Document Verification |
| Secret Manager | All secrets | All agents |
| Cloud Monitoring | Agent health + alerts | All agents |
| SAQA API | Qualification verification | Document Verification |
| NAMB Register | Artisan registration verification | Document Verification |
| MyMzansi APIs (Phase 2) | Government credential wallet | Document Verification, Auth |

**Region:** `africa-south1` for most services. Vertex AI + Document AI use `us-central1`. IMPORTANT: Document storage bucket MUST be in `africa-south1` for POPIA data residency.

---

## Data Architecture

### Firestore Collections

| Collection | Purpose | New in v6.0 |
|---|---|---|
| `opportunities` | Live opportunity store (+ applicationPlatform, requiredDocuments) | requiredDocuments[] field |
| `skills_passports` | Passport + behavioural signals + micro-creds | No change |
| `users` | Registered users | No change |
| `applications` | Application tracking (+ pre-flight results, review status) | preFlightResult, reviewConfirmedAt fields |
| `identity_documents` | Document vault METADATA only (no file content) | **NEW v6.0** |
| `document_consents` | Per-share consent records for documents | **NEW v6.0** |
| `micro_credentials` | Skilved Verified badges | No change |
| `skills_pulse_snapshots` | Daily national intelligence | No change |
| `agent_context` | Multi-agent coordination (+ vault flags) | New vault flags |
| `career_plans` | Career Agent output | No change |
| `consents` | POPIA consent audit trail | No change |
| `conversations` | Customer Success Agent history | No change |
| `revenue_decisions` | Revenue Agent audit trail | No change |
| `sessions` | Anonymous session state | No change |
| `employers` | Employer accounts | No change |
| `setas` | SETA partnerships | No change |
| `reviews` | Phase 2 stub (empty) | No change |
| `gigs` / `quotes` / `invoices` | Phase 2/3 stubs (empty) | No change |

### BigQuery Tables

| Table | Purpose | New in v6.0 |
|---|---|---|
| `events` | Every user interaction | New document event types |
| `outcomes` | Verified placements (THE GRAPH) | No change |
| `agent_runs` | Full agent audit trail | Agents 18–19 added |
| `quality_decisions` | Quality Agent | No change |
| `skills_pulse_snapshots` | Daily national intelligence | No change |
| `employer_accountability_scores` | Employer scores | No change |
| `cohort_snapshots` | Daily cohort intelligence | No change |
| `career_simulations` | Simulation queries | No change |
| `application_submissions` | ATS submission tracking (+ pre_flight_passed, review_confirmed) | New fields |
| `micro_credential_events` | Credential events | No change |
| `security_events` | **Document access audit log** | **NEW v6.0** |
| `document_verification_events` | **SAQA/NAMB verification results** | **NEW v6.0** |
| `graph_skills` | Derived skills intelligence | No change |

### Redis Cache

```
# Existing caches
feed:anon:{trade}:{province}:{sort}     TTL: 5 min
feed:user:{userId}:{sort}               TTL: 10 min
opp:{opportunityId}                     TTL: 1 hour
cohort:{userId}                         TTL: 4 hours
cohort_opp:{oppId}:{cohortHash}         TTL: 1 hour
simulation:{userId}:{queryHash}         TTL: 24 hours
skills_pulse:latest                     TTL: 2 hours
employer_score:{employerId}             TTL: 1 week
micro_cred:{userId}                     TTL: 1 hour
user:{userId}                           TTL: 15 min

# NEW v6.0 — Document Vault Caches
preflight:{userId}:{opportunityId}      TTL: 1 hour
vault_complete:{userId}                 TTL: 4 hours
doc_verification:{docId}               TTL: 24 hours
```

---

## Document Vault Architecture

### The Cardinal Rules

```
DOCUMENTS NEVER IN FIRESTORE — only metadata
DOCUMENTS NEVER IN LOGS — Cloud DLP enforced
DOCUMENTS NEVER IN GEMINI PROMPTS — agents see metadata only
DOCUMENTS STORED ONLY IN Cloud Storage with CMEK
AGENTS OPERATE ON DOCUMENT METADATA ONLY
EVERY ACCESS VIA SIGNED URL (15-min expiry)
EVERY ACCESS LOGGED TO security_events BigQuery table
```

### Storage Buckets

| Bucket | Contents | Sensitivity |
|---|---|---|
| `skilved-documents-{env}` | CVs, certificates, transcripts | High |
| `skilved-identity-{env}` | ID documents, Smart IDs, passports | Maximum |
| `skilved-screenshots-{env}` | Application confirmation screenshots | Medium |
| `skilved-government-reports-{env}` | Skills Pulse PDFs | Public |

### Ingestion Paths (Priority Order)

1. **CV/Resume Upload** (Sprint 2) — PDF/Word → Document AI → Skills Profile Agent → review → passport populated
2. **Direct file upload** (Sprint 2) — Profile page upload for individual documents
3. **WhatsApp photo** (Sprint 3) — Photo sent to Skilved WhatsApp → Cloud Vision → Document AI → confirmation
4. **Manual form** (Sprint 1) — Existing 5-step form (fallback)
5. **LinkedIn import** (Phase 2)
6. **MyMzansi OAuth** (Phase 2)

### Verification Pipeline

```
Document uploaded
    ↓
Agent 18 (Document Verification) triggered
    ↓
Document type detection
    ↓
SAQA API (if qualification) → 'saqa_verified'
NAMB API (if trade test) → 'namb_verified'
Cloud Vision (if photo) → type detection
MyMzansi (Phase 2) → 'mymzansi_verified'
    ↓
Passport completeness updated (verified docs score higher)
Pre-flight cache invalidated
Pending application queues checked
```

### Pre-Flight Check Flow

```
Application Agent triggered
    ↓
Agent 18 pre-flight check (from Redis cache or BigQuery)
    ↓
All required docs present + verified? → Submit automatically
1-2 docs missing? → WhatsApp user → hold for 24h → upload → submit
Many docs missing? → Route to manual application
Certified copy required? → Flag to user → offer two paths
    ↓
(Always) Take form screenshot → WhatsApp review message
User replies YES → click submit
User replies EDIT → Customer Success routing
No reply 24h (L3) → cancel
No reply 24h (L4) → submit
```

---

## ATS Adapter Architecture

| Platform | Sprint | Employers | Coverage |
|---|---|---|---|
| Email (SMTP/Gmail) | 1 | Govt, NGOs, smaller | ~20% |
| SAP SuccessFactors | 2 | Eskom, Sasol, Vodacom | ~25% |
| Oracle Taleo/HCM | 3 | Transnet, Anglo American | ~20% |
| PageUp | 3 | Murray & Roberts, WBHO | ~10% |
| MERSETA Portal | 3 | All MERSETA | ~8% |
| EWSETA Portal | 3 | All EWSETA | ~5% |
| CETA Portal | 4 | All CETA | ~5% |
| Generic Playwright | 4 | Unknown | ~7% |

CAPTCHA: 2captcha/CapSolver. Cost: ~R0.18/solve.

---

## Intelligence Layer Summary

| Agent | Job | Output |
|---|---|---|
| 14: Skills Pulse | National intelligence, daily | `skilved.com/skills-pulse` dashboard |
| 15: Career Simulation | "What if I do X?" | Salary delta, opportunity delta, cohort-verified |
| 16: Employer Accountability | Employer scores | A-F grade on opportunity cards |
| 17: Collective Intelligence | "People like you" | Cohort data on opportunity cards |

---

## Key Domain Types

```typescript
// ATS platforms
type ATSPlatform =
  | 'successfactors' | 'oracle_taleo' | 'pageup'
  | 'merseta_portal' | 'ewseta_portal' | 'ceta_portal'
  | 'email_only' | 'direct_web_form' | 'job_board_hosted' | 'unknown';

// Document types (Document Vault)
type DocumentType =
  | 'sa_id' | 'passport' | 'tvet_certificate' | 'diploma' | 'degree'
  | 'trade_test_certificate' | 'occupational_certificate' | 'transcript'
  | 'drivers_licence' | 'prdp' | 'ohas_certificate' | 'first_aid_certificate'
  | 'wiremans_licence' | 'cidb_grading' | 'employment_letter' | 'payslip'
  | 'bank_statement' | 'proof_of_address' | 'tax_number' | 'uif_record' | 'other';

// Verification status
type VerificationStatus =
  | 'self_reported' | 'pending_verification' | 'saqa_verified'
  | 'namb_verified' | 'mymzansi_verified' | 'employer_confirmed'
  | 'verification_failed' | 'unverifiable';

// Opportunity types (expanding beyond trades)
type OpportunityType =
  | 'apprenticeship' | 'learnership' | 'bursary' | 'job'
  | 'trade_test' | 'short_course'
  | 'graduate_programme' | 'internship'       // Phase 2
  | 'tvet_partnership' | 'skills_programme';   // Phase 2

// Trade categories (trades MVP, expanding Phase 2+)
type TradeCategory =
  | 'electrical' | 'plumbing' | 'welding' | 'automotive'
  | 'construction' | 'hvac' | 'mechanical' | 'mining'
  | 'ict' | 'agriculture' | 'logistics' | 'clothing'
  | 'healthcare' | 'education' | 'finance' | 'other'; // Phase 2+

// Micro-credentials
type CredentialType =
  | 'active_applicant' | 'profile_complete' | 'interview_ready'
  | 'placed' | 'employer_endorsed' | 'trade_specialist';
```

---

## Coding Conventions

### TypeScript
- Strict mode always on. No `any`. Interfaces over types.

### React / Next.js
- Server Components by default. Tailwind only. `data-testid` on all interactive elements.

### Agents
- Every agent logs to BigQuery `agent_runs` with `human_approvals_required: 0`
- Agents never throw unhandled errors
- Agents are stateless — all state in Firestore/BigQuery
- Document Vault: agents NEVER receive document content — metadata + signed URLs only
- All ATS adapters integrate CaptchaSolver
- Pre-flight check MUST run before every Application Agent submission

### Document Security (enforced in code)
- ID numbers: encrypted at rest via Cloud KMS before Firestore storage
- Documents: stored in Cloud Storage only, never Firestore
- Logs: Cloud DLP scans all logs for PII — fail closed if DLP unavailable
- Signed URLs: 15-minute expiry, generated via `DocumentAccessService` only

---

## Environment Setup

```bash
pnpm install
pnpm dev                                    # all apps
pnpm --filter web dev
pnpm --filter document-verification dev
pnpm --filter scope-expansion dev
firebase emulators:start
```

**Required for local development:**
- Firebase emulator running
- `.env.local` populated (see `16_Environment_Variables.md`)
- `GEMINI_API_KEY`, `CAPTCHA_SOLVER_API_KEY` set
- `CLOUD_STORAGE_DOCUMENTS_BUCKET` set (use dev bucket)
- `SAQA_API_URL` set (free public API — test immediately)

---

## Common Tasks

### Add a new ATS adapter
1. Create `apps/agents/application/src/adapters/NewPlatformAdapter.ts`
2. Implement `SubmissionAdapter` interface
3. Register in `SubmissionRouter`
4. Add URL patterns to `ATSDetector` in `apps/agents/analyst/`
5. Add unit test + fixture HTML

### Add a new portal source
1. Create a new Scrapy spider in `proofile_2.0/scraping-engine/spiders/portals/` following the pattern in `puffandpass_spider.py`
2. Extend `scrapy.Spider`, implement `parse()` (list pages) and `parse_detail()` (opportunity pages)
3. Yield `OpportunityItem` with all shared extraction fields (see `scout_portal_sources.md` for full field list)
4. Register the spider name in the Scrapy scheduler and add it to the 4-hour Cloud Scheduler cycle

### Test Document Vault upload
```bash
curl -X POST https://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/certificate.pdf" \
  -F "documentType=tvet_certificate"
# Verify: identity_documents Firestore doc created (NO file content)
# Verify: file in Cloud Storage bucket
# Verify: SAQA verification triggered
# Verify: passport completeness updated
```

### Test Application Agent pre-flight
```bash
cd apps/agents/document-verification && pnpm dev
curl -X GET "http://localhost:8081/preflight?userId=test&opportunityId=opp123"
# Returns: {canAutoSubmit, missingDocuments, recommendation}
```

### Test review-before-submit flow
```bash
# Set up test at Level 3 with required docs in vault
# Trigger Application Agent
# Verify: WhatsApp message received with form screenshot
# Reply YES
# Verify: form submitted, reference captured, confirmation WhatsApp sent
```

### Verify SAQA integration
```bash
cd apps/agents/document-verification
node -e "
const { SAQAVerifier } = require('./src/verification/SAQAVerifier');
const v = new SAQAVerifier();
v.verify('YOUR_CERT_NUMBER', 'TEST NAME').then(console.log);
"
```

### Verify XPRIZE autonomy claim
```sql
SELECT agent_name, SUM(human_approvals_required) as total_human_approvals
FROM skilved_prod.agent_runs
WHERE DATE(started_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
GROUP BY agent_name;
-- Every row must show 0
```

### Check pre-flight holds (should resolve quickly)
```sql
SELECT user_id, opportunity_id, missing_documents, held_since
FROM skilved_prod.application_submissions
WHERE pre_flight_passed = false
  AND submitted_at IS NULL
  AND DATE(created_at) = CURRENT_DATE()
ORDER BY held_since;
-- Items here are waiting for user to upload missing docs
-- Should resolve within 24h
```

### Check document verification rate
```sql
SELECT
  document_type,
  verification_status,
  COUNT(*) as count
FROM skilved_prod.document_verification_events
WHERE DATE(verified_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
GROUP BY document_type, verification_status
ORDER BY document_type, count DESC;
```

### Check incomplete applications (should always be 0)
```sql
SELECT COUNT(*) as incomplete_submitted
FROM skilved_prod.application_submissions
WHERE pre_flight_passed = false
  AND submitted_at IS NOT NULL
  AND initiated_by = 'application_agent';
-- THIS MUST ALWAYS BE 0 -- never submit an incomplete application
```

---

## Do Not

- **Do not** add a login gate before showing opportunity content
- **Do not** add a human approval step to any agent
- **Do not** store secrets in code or `.env` files in commits
- **Do not** use `useEffect` for data fetching — server components or React Query
- **Do not** write to `outcomes` without `user_id`
- **Do not** remove `human_approvals_required: 0` from any agent run
- **Do not** trigger Application Agent without valid Level 3+ consent record
- **Do not** send Revenue Agent prompt if one sent in last 72 hours
- **Do not** let Application Agent bypass `CircuitBreaker.ts`
- **Do not** let Application Agent bypass `PreFlightChecker` — EVERY submission must pass pre-flight
- **Do not** submit an incomplete application silently — HOLD and notify user always
- **Do not** store document content in Firestore — metadata only
- **Do not** log document content or ID numbers — Cloud DLP will catch it but don't create the risk
- **Do not** pass document content to Gemini — metadata and signed URLs only
- **Do not** store ID numbers in plaintext — encrypt via Cloud KMS before Firestore
- **Do not** serve documents directly — always via signed URLs with 15-min expiry via `DocumentAccessService`
- **Do not** give agents access to the `skilved-identity` bucket — only `DocumentAccessService` service account
- **Do not** go live with Document Vault without security audit completed
- **Do not** go live with Document Vault without cyber insurance in place
- **Do not** display cohort intelligence for cohorts < 5 users
- **Do not** display employer accountability scores with < 3 verified outcomes
- **Do not** write to `reviews`, `gigs`, `quotes`, `invoices` in MVP
- **Do not** build Agents 10, 11, or 13 in MVP
- **Do not** frame the hybrid permission model as a limitation
- **Do not** frame "trades only" as permanent — scope expansion is the plan
- **Do not** reference old `discovery` agent directory — it is now `scout`

---

## Change Log

### v6.0 — June 2026
- Added Agent 18 (Document Verification) and Agent 19 (Scope Expansion) to agent table
- Added Document Vault Architecture section
- Added `identity_documents`, `document_consents` to Firestore collections
- Added `security_events`, `document_verification_events` to BigQuery tables
- Added document vault Redis cache keys
- Added Cloud Storage buckets, Cloud KMS, Cloud DLP, Cloud Vision, SAQA API, NAMB to GCP services
- Added 6 new Common Tasks (document vault, pre-flight, review-before-submit, SAQA, incomplete check)
- Added 9 new "Do Not" rules for Document Vault security
- Updated scope from "trades only" to "starting with trades, all qualification levels"
- Updated `TradeCategory` and `OpportunityType` types with Phase 2+ expansions
- Added `DocumentType` and `VerificationStatus` to Key Domain Types

### v5.0 — June 2026
- Added Agents 14–17, ATS adapters, intelligence layer

