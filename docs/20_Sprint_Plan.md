# Skilved — Sprint Plan
### 8-Week Execution | XPRIZE Submission at Week 8 | Version 6.0 | June 2026

---

## Table of Contents

- [Strategic Context](#strategic-context)
- [Sprint Map](#sprint-map)
- [Sprint 0 — Pre-Launch Foundation](#sprint-0--pre-launch-foundation)
- [Sprint 1 — Weeks 1–2: Feed + Intelligence + ATS Foundation](#sprint-1--weeks-12)
- [Sprint 2 — Weeks 3–4: Skills Passport + Document Vault + SAQA](#sprint-2--weeks-34)
- [Sprint 3 — Weeks 5–6: Agents + Pre-flight + Review-Before-Submit](#sprint-3--weeks-56)
- [Sprint 4 — Weeks 7–8: Scale + Full Intelligence + Submission](#sprint-4--weeks-78)
- [Priority Triage If Behind Schedule](#priority-triage-if-behind-schedule)
- [Key Metrics by Sprint](#key-metrics-by-sprint)
- [What We Are NOT Building in MVP](#what-we-are-not-building-in-mvp)
- [Change Log](#change-log)

---

## Strategic Context

**One month is gone. Eight weeks remain.**

The sprint plan v6.0 incorporates everything from all strategic sessions:

1. **The anonymous ceiling.** Feed is full-access. Agents, matching, vault, and intelligence are authentication rewards.

2. **The Skills Passport is the moat.** Every agent reads from it. It builds from CV uploads, document photos, and work history — not just forms.

3. **The Document Vault is the portable identity.** Upload once, share forever. Pre-flight check ensures applications are always complete before submission. Review-before-submit ensures users see what was sent.

4. **The intelligence layer brings the future to the present.** Skills Pulse, Career Simulation, Employer Accountability, Collective Intelligence — all live by Week 8.

5. **Application Agent submits correctly or not at all.** Pre-flight check before every submission. If documents missing, application is HELD — never submitted incomplete silently.

6. **Trades is the entry, not the ceiling.** TVET colleges added to Scout in Sprint 1. Scope expansion monitoring begins Sprint 4.

7. **ATS adapters, not generic Playwright.** SuccessFactors Sprint 2, Taleo + PageUp + SETA portals Sprint 3, CETA Sprint 4.

8. **Seven cases from Linda's sessions** — all implemented across sprints:
   - Case 1: Review-before-submit (Sprint 3)
   - Case 2: Sign in with Skilved (Sprint 2, branding)
   - Case 3: Trades is entry not ceiling (Sprint 1 framing + Scout)
   - Case 4: TVET colleges as sources (Sprint 1)
   - Case 5: NAMB artisan register (Sprint 3)
   - Case 6: CV/doc ingestion + 4 onboarding paths (Sprint 2)
   - Case 7: Document scanning via WhatsApp (Sprint 3)

---

## Sprint Map

| Sprint | Weeks | Theme | Gate |
|---|---|---|---|
| 0 | Pre | Foundation — legal, infra, partnerships, employer calls | Everything registered, 2 employers committed, SAQA tested |
| 1 | 1–2 | Feed + ATS Detection + TVET + Skills Pulse v1 | 200+ opps, TVET colleges in Scout, ATS detection live, Skills Pulse static page |
| 2 | 3–4 | Skills Passport + Document Vault + SAQA + 4 Ingestion Paths | Vault live, SAQA verifying, CV upload working, first revenue |
| 3 | 5–6 | Agents + Pre-flight + Review-Before-Submit + NAMB | Application Agent submitting with pre-flight, NAMB live, Career Simulation v1 |
| 4 | 7–8 | Scale + Full Intelligence + All Adapters + SUBMIT | All 19 agents, full doc pipeline, R300K+ revenue, XPRIZE |

---

## Sprint 0 — Pre-Launch Foundation

### Legal & Business
- [ ] Register Skilved (Pty) Ltd at CIPC
- [ ] Open business bank account
- [ ] Register POPIA Information Officer
- [ ] Register for PAYE with SARS
- [ ] Privacy notice drafted (includes Document Vault data processing)
- [ ] Legal opinion on labour broker question

### Domains & Accounts
- [ ] Register skilved.com, skilved.co.za, skilved.app, skilved.ai
- [ ] Configure DNS (Cloudflare)
- [ ] Google Workspace setup
- [ ] **Apply for WhatsApp Business API today**
- [ ] **Register 2captcha or CapSolver account**
- [ ] **Test SAQA API** — `regqs.saqa.org.za` (free, public, test this week)
- [ ] **Contact NAMB** — artisan register partnership (email this week)
- [ ] **Contact MyMzansi developer program** — begin relationship

### Employer Pipeline — Do This Week
- [ ] Call 5 target employers Monday — close 2 at any introductory price
- [ ] Email MERSETA + EWSETA: "We'll be sending you candidates from week 3"
- [ ] Identify 10 trade WhatsApp groups to seed in Week 1

### GCP Setup
- [ ] Create GCP projects: `skilved-prod` + `skilved-dev`
- [ ] Enable all required APIs
- [ ] Create service accounts with least-privilege IAM
- [ ] Configure Secret Manager
- [ ] Set primary region `africa-south1`
- [ ] **Create Cloud Storage buckets with CMEK** (`skilved-documents-dev`, `skilved-identity-dev`)
- [ ] **Configure Cloud KMS key ring for document encryption**
- [ ] **Configure Cloud DLP to scan logs for PII**
- [ ] Vertex AI Search data store provisioned
- [ ] BigQuery datasets + all tables created (including `security_events`, `document_verification_events`)
- [ ] BigQuery `agent_autonomy` view created

### Security Pre-Work
- [ ] Cloud Storage CMEK tested in dev
- [ ] Signed URL generation tested (15-min expiry)
- [ ] IAM: document-verification service account has NO access to application service account's scope
- [ ] Security audit scoped and vendor engaged (for pre-Document Vault-launch review)

**Completion gate:** Team can run `pnpm dev`. GCP project exists. SAQA API tested and working. CMEK buckets created. NAMB contacted. 2 employers committed. Company registered.

---

## Sprint 1 — Weeks 1–2: Feed + ATS Detection + TVET + Skills Pulse v1

### What Anonymous Users Get (The Deliberate Ceiling)
- Full feed — every opportunity, all trades, all provinces
- Full opportunity detail — no login
- Employer score (grade only, anonymously) — builds trust
- WhatsApp share
- "Found X hours ago" freshness
- Skills Pulse Dashboard (public, no login)

### What Anonymous Users Do NOT Get
- No personalised matching
- No cohort intelligence
- No career simulation
- No document vault
- No application agent

### Engineering — Week 1

**Scout Agent v1 (with ATS Detection + 3 Portal Sources)**
- [ ] Scaffold `apps/agents/scout/`
- [ ] `BaseCrawler` abstract class
- [ ] Portal spider for PuffAndPass.co.za (Scrapy)
- [ ] Portal spiders for RecentJobs.co.za and StudentRoom.co.za (Scrapy)
- [ ] `GeminiExtractor` — structured opportunity extraction
- [ ] **`ATSDetector` class** — URL + HTML pattern matching for 8 platforms
- [ ] `applicationPlatform` field stored on every opportunity
- [ ] **`requiredDocuments[]` field** — what documents each application needs
- [ ] `Deduplicator` + `FirestorePublisher` + `AgentLogger`
- [ ] Cloud Scheduler every 4 hours

> **ON HOLD until Sprint 2+:** Crawlers for 15 SETA portal sources and 50 TVET college website crawlers (Ekurhuleni East, Northlink, eThekwini, etc.) are deferred. Sprint 1 uses only the 3 portal aggregator sources above. See `scout_portal_sources.md` for full source specifications.

**Analyst Agent v1 (with Required Documents)**
- [ ] `GeminiExtractor` with updated prompt:
  ```json
  "required_documents": ["sa_id", "tvet_certificate", "proof_of_address"],
  "application_platform": "successfactors",
  "application_platform_confidence": "high"
  ```
- [ ] `ATSDetector` integration
- [ ] Deploy to Cloud Run

**Quality Agent v1**
- [ ] `RulesEngine`, `GeminiClassifier`, `SourceCredibility`, `ExpiryChecker`

**Feed UI**
- [ ] Next.js project + Vercel deployment
- [ ] `OpportunityCard` — all states + employer score placeholder (shows when data available)
- [ ] `FeedFilters` — trade + province + employer grade filter
- [ ] Infinite scroll, SSR first load
- [ ] `FreshnessBadge` — non-negotiable
- [ ] `ShareButton` — WhatsApp share (include employer score in share message)
- [ ] Opportunity detail page
- [ ] BigQuery event pipeline
- [ ] SEO: trade + province URL structure

**Skills Pulse Dashboard v1 (static)**
- [ ] Page at `skilved.com/skills-pulse`
- [ ] National overview: live opportunity counts by trade and province
- [ ] Trade × province table showing distribution
- [ ] "Skills intelligence growing as we verify outcomes" messaging
- [ ] "Based on [N] opportunities indexed" label
- [ ] Share buttons on key stats

**Skills Pulse Teaser on Feed**
- [ ] After 20+ cards scrolled: "SA Skills Intelligence — Updated Today" banner

### Engineering — Week 2

- [ ] All 9 province + 12 trade filters validated with real opportunities
- [ ] Scout expanded to 30+ sources (PNet, CareerJunction, Indeed SA)
- [ ] Mobile audit: Samsung Galaxy A52 + SA 4G — < 1.5s
- [ ] POPIA cookie consent banner
- [ ] Conversion hook: "Skilved found 47 more opportunities. Create your Skills Passport to see what people like you are applying for — and get matched automatically."

### Sprint 1 Acceptance Gate
- [ ] Feed loads < 1.5s on mobile
- [ ] 200+ real opportunities live
- [ ] All 12 trade + 9 province filters working
- [ ] TVET college opportunities appearing in feed
- [ ] `applicationPlatform` detected and stored on every new opportunity
- [ ] `requiredDocuments[]` extracted for every opportunity
- [ ] Scout + Analyst + Quality agents autonomous
- [ ] `human_approvals_required: 0` in all BigQuery agent runs
- [ ] **Skills Pulse Dashboard v1 live at `skilved.com/skills-pulse`**
- [ ] Zero scam listings

---

## Sprint 2 — Weeks 3–4: Skills Passport + Document Vault + SAQA + Ingestion

### Four Jobs This Sprint
1. Skills Passport live with 4 ingestion paths
2. Document Vault foundation with SAQA verification
3. Collective Intelligence v1 on feed
4. First revenue (Day 16)

### Engineering — Week 3

**Document Vault Infrastructure**
- [ ] `identity_documents` Firestore collection schema
- [ ] Cloud Storage CMEK integration in production
- [ ] `DocumentAccessService` — signed URL generation (15-min expiry)
- [ ] Cloud DLP configured on upload pipeline
- [ ] File type validation (server-side, not client-side)
- [ ] Malware scan on upload (Cloud DLP)
- [ ] `security_events` BigQuery table flowing

**Skills Profile Agent v1 (4 Ingestion Paths)**
- [ ] `GeminiSkillsExtractor` — free text skills extraction
- [ ] **`CVIngestionPipeline`** — PDF/Word → Document AI → Skills Profile Agent → review → passport
- [ ] **`CertificateUploadPipeline`** — individual certificate upload → Document AI → vault
- [ ] `QualificationMapper` — NQF framework mapping
- [ ] `AgentSummaryGenerator`
- [ ] `CompletenessScorer` — verified docs score higher than self-reported
- [ ] `EnrichmentNudger` — "Add N3 certificate to unlock 12 more opportunities"

**Updated Onboarding Screen**
- [ ] "Build your Skills Passport" with 4 path options:
  - [Upload your CV] — fastest, fills everything
  - [Scan your certificates] — WhatsApp your documents
  - [Type it yourself] — 5-minute form (existing)
  - Coming soon: LinkedIn import
- [ ] CV upload flow: upload → Document AI → review screen → confirm → passport populated

**Agent 18 v1 — Document Verification (SAQA)**
- [ ] `apps/agents/document-verification/` scaffolded
- [ ] `SAQAVerifier` — live integration with `regqs.saqa.org.za`
- [ ] Triggered on every document upload event
- [ ] Verification status updated in `identity_documents`
- [ ] Passport completeness score updated (verified = higher score)
- [ ] `document_verification_events` BigQuery table flowing
- [ ] Deploy to Cloud Functions (event-driven)

**Authentication (Sign in with Skilved branding)**
- [ ] Firebase Auth configuration
- [ ] WhatsApp OTP — branded as "Your Skilved identity"
- [ ] Google OAuth — branded as "Sign in with Skilved"
- [ ] Login screen: "Sign in with MyMzansi — coming soon" (grayed out)
- [ ] Session → user migration preserving anonymous history

**Matching Agent v1**
- [ ] `PassportScorer` — match score from Skills Passport
- [ ] `VertexRanker` — Vertex AI Ranking API
- [ ] `MatchExplainer` — Gemini 1-sentence explanation
- [ ] Anonymous users: filter-based, no match scores
- [ ] "Create your Skilved to see your match score" for anonymous

**Collective Intelligence Layer v1**
- [ ] `CohortBuilder` — BigQuery cohort queries with tiered fallback
- [ ] "X people with your profile viewed this" on authenticated opportunity cards
- [ ] Feed cohort insight banner (between cards 5–10, once per session)
- [ ] Redis caching (TTL 1 hour per opp/cohort)
- [ ] Minimum 5 users in cohort before display

**Micro-Credential System v1**
- [ ] `MicroCredentialIssuer`
- [ ] "Skilved Verified: Active Applicant" (5+ apps + 40% passport)
- [ ] "Skilved Verified: Profile Complete" (80%+ passport)
- [ ] WhatsApp notification on issuance
- [ ] Verification page (`/verify/:code`)
- [ ] QR code generation

**Agent Trace Visualizer (Sprint 2 — XPRIZE critical)**
- [ ] Admin page `/agents/trace/[userId]`
- [ ] Full chain: Scout → Analyst → Quality → Matching → Application
- [ ] Each entry: agent, decision, `human_approvals_required: 0`

**Document section on profile page**
- [ ] Document vault section: list of uploaded documents with verification status
- [ ] Upload button per document type
- [ ] Verification badges: "SAQA Verified ✓" / "Self-reported" / "Pending verification"

### Engineering — Week 4

**Employer Pipeline + First Revenue**
- [ ] Employer account creation
- [ ] `POST /api/referrals` — R500 per candidate
- [ ] PayFast payment
- [ ] **TARGET: First referral fee by Day 16**

**Notification Agent v1**
- [ ] Daily digest with cohort intelligence addition
- [ ] "What people like you applied for this week" digest section

**Outcome Tracker v1 + Document Feedback**
- [ ] Fires on `apply_click` and `agent_apply_success`
- [ ] Day 3 follow-up
- [ ] **Day 30 addition: employer feedback questions** (for Accountability Layer)

### Growth — Week 3–4
- [ ] **FIRST REVENUE — Day 16 target**
- [ ] Email 20 TVET colleges
- [ ] 5 WhatsApp groups seeded
- [ ] First SETA demo call (MERSETA) — show their learnerships on Skilved feed
- [ ] Email Skills Pulse link to 10 government officials

### Sprint 2 Acceptance Gate
- [ ] Passport onboarding < 90 seconds via form path
- [ ] **CV upload populates passport from PDF/Word document**
- [ ] **SAQA verification live and verifying uploaded certificates**
- [ ] **Document vault section on profile page**
- [ ] Matching Agent live for authenticated users
- [ ] Collective Intelligence on opportunity cards
- [ ] Micro-credentials issuing
- [ ] Agent Trace Visualizer live
- [ ] Public profile URL live
- [ ] **FIRST REVENUE RECEIVED**
- [ ] 500+ registered users, 5+ paying employers

---

## Sprint 3 — Weeks 5–6: Agents + Pre-flight + Review-Before-Submit + NAMB

### Four Jobs This Sprint
1. Career Agent + Career Simulation v1
2. Application Agent v1 (email + SuccessFactors) WITH pre-flight + review-before-submit
3. Agent 18 v2 (NAMB + WhatsApp photo intake)
4. Employer Accountability v1

### Engineering — Week 5

**Career Agent v1**
- [ ] `SkillsGapAnalyser`, `CareerPathMapper`, `TimelineEstimator`
- [ ] Trigger: passport ≥ 40%
- [ ] Career plan via WhatsApp < 60 seconds
- [ ] `AlignedOpportunities` — surfaces current opps advancing the plan
- [ ] Weekly career update Sundays

**Career Simulation Engine v1 (Agent 15)**
- [ ] `CareerSimulationEngine` — opportunity-based (no outcome data needed)
- [ ] "You'd match X more opportunities if you had [qualification]"
- [ ] All 6 query types (opportunity count only in v1)
- [ ] WhatsApp conversational query routing via Customer Success Agent
- [ ] Web UI comparison card on profile page
- [ ] "Based on current opportunities" label

**Customer Success Agent v1**
- [ ] Day 0–14 onboarding sequence
- [ ] `HowItWorksHandler`, `OpportunityQueryHandler`, `LegitimacyHandler`
- [ ] **Career simulation query routing** — "what if I..." → Agent 15
- [ ] `DisputeHandler` — "Reply DISPUTE"
- [ ] Deploy (min 1 instance, always-on)

**Permission Model — Level 1 + 2 + 3**
- [ ] `/permissions` page live with Document Vault mention
- [ ] Level 3 consent capture including: "I consent to Skilved submitting applications including attaching relevant documents from my Skilved vault"
- [ ] Soft nudge during Level 3 activation: "To apply automatically, Skilved needs your core documents. [Upload ID + Qualification]"

**Agent 18 v2 — NAMB + WhatsApp Photo Intake**
- [ ] `NAMBVerifier` — artisan register lookup
- [ ] `WhatsAppPhotoIngestion` pipeline:
  - Webhook receives photo
  - Cloud Vision: document type detection
  - Document AI: extract certificate details
  - WhatsApp confirmation: "Got your N3 ✓ — Added to vault. Reply YES to confirm."
  - On YES: save to vault + trigger SAQA/NAMB verification
- [ ] Expiry alert system live (30/7/1 day warnings)
- [ ] `pre_flight_check` cache in Redis

### Engineering — Week 6

**Application Agent v1 — Email + SuccessFactors + Pre-flight + Review**
- [ ] `PermissionChecker` — Level 3+ required
- [ ] `ConsentVerifier` — valid consent including document sharing consent
- [ ] `CircuitBreaker` — halts at 5 apps/user/hour
- [ ] **`PreFlightChecker`** — calls Agent 18, checks vault against `requiredDocuments[]`
  - All docs present + verified → proceed
  - Missing docs → WhatsApp user with upload request → hold for 24h
  - Many missing → route to manual application
  - Certified copy required → flag and offer two paths
- [ ] `CVGenerator` — Gemini tailored CV
- [ ] `CoverLetterGenerator` — Gemini specific cover letter
- [ ] `EmailSubmitter` — Gmail API + SMTP fallback
- [ ] **`SuccessFactorsAdapter`** — full implementation with CAPTCHA solver
- [ ] **`CaptchaSolver`** — 2captcha integration
- [ ] **Review-before-submit flow:**
  - Fill form
  - Take screenshot
  - Compile: what was filled + documents attached + verification status
  - WhatsApp: "Your [Org] application is ready. [Details]. Reply YES/EDIT/CANCEL"
  - Level 3: wait for YES (hold up to 24h)
  - Level 4: submit after 4h if no reply
- [ ] `ApplicationTracker` — Firestore + BigQuery
- [ ] `human_approvals_required: 0` in every log
- [ ] `pre_flight_passed`, `review_confirmed` in `application_submissions` table
- [ ] **Deploy. First real autonomous application in production.**

**Employer Accountability Layer v1 (Agent 16)**
- [ ] `EmployerAccountabilityAgent` — weekly run
- [ ] `AccountabilityScorer` — 5-component score
- [ ] Score on opportunity cards (employers with 3+ outcomes)
- [ ] "Based on [N] verified outcomes — early data" label

**Collective Intelligence Layer v2**
- [ ] "X applied · Y got interviews" with early outcome data
- [ ] Warning opportunities (low success rate)
- [ ] Profile page cohort intelligence section

**Worker Premium Billing**
- [ ] PayFast subscription: Level 3 = R200/month, Level 4 = R500/month

### Sprint 3 Acceptance Gate
- [ ] Career Agent generating plans on passport ≥ 40%
- [ ] **Career Simulation answering "what if" queries**
- [ ] **Application Agent pre-flight check running before every submission**
- [ ] **Zero incomplete applications submitted (check BigQuery)**
- [ ] **Review-before-submit WhatsApp flow working**
- [ ] **Application Agent using SuccessFactors adapter**
- [ ] **NAMB verification live**
- [ ] **WhatsApp photo of certificate → vault → verification pipeline working**
- [ ] Employer Accountability scores on opportunity cards
- [ ] Worker Premium billing live
- [ ] 2,000+ users, 30+ paying employers/SETAs
- [ ] `human_approvals_required: 0` all agents

---

## Sprint 4 — Weeks 7–8: Scale + Full Intelligence + Submission

### Engineering — Week 7

**Application Agent v2 — More ATS Adapters**
- [ ] `OracleTaleoAdapter` — Transnet, Anglo American, mining
- [ ] `PageUpAdapter` — Murray & Roberts, WBHO, construction
- [ ] `MersetaPortalAdapter` — all MERSETA learnerships
- [ ] `EwsetaPortalAdapter` — all EWSETA learnerships
- [ ] `SubmissionRouter` fully populated
- [ ] `ConfirmationParser` — reference numbers per platform
- [ ] Manual fallback list for consistently failing forms

**Revenue Agent v1**
- [ ] All trigger types + `UpgradePromptBuilder`
- [ ] 72-hour cooldown + agent_context check
- [ ] A/B test: 2 variants
- [ ] `human_approvals_required: 0`

**Permission Level 4**
- [ ] Three-consent flow (including document sharing consent)
- [ ] Minimum threshold slider

**Agent 18 Full — Document Verification**
- [ ] Enrichment nudges live: "Add Wireman's Licence to unlock 12 more opportunities"
- [ ] Weekly vault summary WhatsApp (Mondays)
- [ ] Pre-flight cache warm-up (batch pre-compute for users with pending Level 3 applications)
- [ ] Full expiry alert pipeline

**Skills Pulse Agent v2 (Agent 14)**
- [ ] Fully automated daily run
- [ ] All 6 dashboard sections live
- [ ] Gemini intelligence synthesis
- [ ] Government PDF report auto-generated
- [ ] `human_approvals_required: 0`

**Career Simulation v2 (Agent 15)**
- [ ] Outcome-verified simulations with real graph data
- [ ] Confidence intervals based on sample size
- [ ] Pre-computed daily batch for top cohort scenarios
- [ ] Type 6: path comparison ("should I do X or Y first?")

### Engineering — Week 8

**Growth Agent v1**
- [ ] Daily social content + Meta/LinkedIn publishing
- [ ] WhatsApp ambassador identification
- [ ] Referral tracking
- [ ] Skills Pulse insights as social content: "Critical shortage: Electrical in Limpopo. 47 jobs, 12 candidates."
- [ ] Reads `agent_context` before publishing

**Collective Intelligence Layer v3 (Agent 17)**
- [ ] Fully automated weekly WhatsApp digest addition
- [ ] Pre-computed daily batch

**Employer Accountability v2 (Agent 16)**
- [ ] Employer response mechanism
- [ ] Trend display
- [ ] Monthly accountability digest

**Agent 19 Stub — Scope Expansion**
- [ ] `apps/agents/scope-expansion/` scaffolded
- [ ] Weekly opportunity distribution analysis running
- [ ] Gap report to admin dashboard
- [ ] New source proposals logged to Firestore for engineering review

**CETA Portal Adapter (if time permits)**
- [ ] `CetaPortalAdapter` — all CETA learnerships

**Agent Coordination Layer**
- [ ] `agent_context/{userId}` live
- [ ] Revenue Agent reads `csEscalationOpenSince`
- [ ] Application Agent reads `careerPlanChangedAt` + `vaultComplete`
- [ ] All agents check `circuitBreakerHaltedAt`

**XPRIZE Submission Package**
- [ ] Agent autonomy dashboard polished
- [ ] Skills Pulse Dashboard polished
- [ ] All metrics compiled in BigQuery
- [ ] Permission level distribution chart
- [ ] ATS adapter breakdown chart
- [ ] Document verification statistics
- [ ] Zero incomplete applications confirmed (BigQuery query)
- [ ] Pre-flight hold resolution time statistics
- [ ] One documented end-to-end placement with full agent trace
- [ ] Demo video scripted, recorded, edited (5 minutes)
- [ ] Submission narrative finalised
- [ ] **SUBMIT**

### Sprint 4 Acceptance Gate = XPRIZE Submission Gate

**Autonomy:**
- [ ] All 19 agents running autonomously
- [ ] `human_approvals_required: 0` full 8-week BigQuery view

**Application Agent:**
- [ ] Pre-flight check: zero incomplete applications submitted (query confirms)
- [ ] Review-before-submit: user confirmation flow working across all adapters
- [ ] ATS adapters: Taleo + PageUp + MERSETA + EWSETA in production
- [ ] 34+ applications/day

**Document Vault:**
- [ ] SAQA verification: 200+ qualifications verified
- [ ] NAMB verification: trade test certificates verified
- [ ] WhatsApp photo intake: documents added from phone photos
- [ ] Expiry alerts: live and tested
- [ ] Vault completeness improving passport match scores

**Intelligence Layer:**
- [ ] Skills Pulse fully automated
- [ ] Career Simulation outcome-verified
- [ ] Employer accountability statistically significant
- [ ] Collective intelligence full weekly digest

**Business:**
- [ ] 5,000+ users, 200+ Premium, 50+ employers
- [ ] R300,000+ revenue
- [ ] 200+ outcomes in graph
- [ ] Demo video complete
- [ ] **SUBMITTED**

---

## Priority Triage If Behind Schedule

### Never Drop
1. Scout (ATS + TVET) + Analyst (req docs) + Feed
2. Skills Passport + Matching + Document Vault + SAQA
3. Application Agent v1 (email + SuccessFactors) with pre-flight
4. Review-before-submit (pre-flight and review are inseparable)
5. Agent autonomy dashboard + Skills Pulse v1 (1 day of work)

### Drop First If Behind
1. Application Agent v2 (Taleo, PageUp) — keep email + SuccessFactors
2. Growth Agent — manual social posts instead
3. Revenue Agent — manual upgrade prompts
4. Level 4 permissions — Level 3 is sufficient for XPRIZE
5. Agent coordination layer — demonstrate pipeline not coordination

### Document Vault Must-Haves vs Nice-to-Have
**Must (Sprint 2–3):** Vault infrastructure, SAQA, CV upload, pre-flight check, review-before-submit
**Nice (Sprint 4):** NAMB, WhatsApp photo intake, expiry alerts, enrichment nudges, Agent 19

---

## Key Metrics by Sprint

| Metric | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 |
|---|---|---|---|---|
| Opportunities indexed | 500+ | 3,000+ | 8,000+ | 10,000+ |
| TVET college opportunities | 50+ | 200+ | 500+ | 1,000+ |
| Registered users | 0 | 500+ | 2,000+ | 5,000+ |
| Skills Passports | 0 | 400+ | 1,500+ | 5,000+ |
| Documents in vault | 0 | 200+ | 800+ | 3,000+ |
| SAQA verifications | 0 | 100+ | 400+ | 1,500+ |
| Paying employers/SETAs | 0 | 5+ | 30+ | 50+ |
| Agent applications/day | 0 | 0 | 10+ | 34+ |
| Incomplete apps submitted | 0 | 0 | **0** | **0** |
| Premium subscribers | 0 | 0 | 50+ | 200+ |
| Revenue (cumulative) | R0 | R19,000 | R110,000 | R300,000+ |
| Outcomes in graph | 0 | 20+ | 100+ | 200+ |
| Human approvals | 0 | 0 | 0 | 0 |
| Skills Pulse version | v1 static | v1 + data | v1 growing | v2 live |
| Career simulations | 0 | 0 | 50+ | 200+ |
| Employer scores live | 0 | 0 | 5+ | 20+ |

---

## What We Are NOT Building in MVP

| Feature | When |
|---|---|
| MyMzansi OAuth integration | Phase 2 (Month 6–12) |
| eNaTIS driver's licence verification | Phase 2 |
| SARS/UIF employment verification | Phase 2 |
| Full employer SaaS dashboard | Phase 2 |
| SETA management portal | Phase 2 |
| Mobile app React Native | Phase 2 |
| Multi-language isiZulu/Afrikaans | Phase 2 |
| Reputation Agent (Agent 10) | Phase 2 |
| Credential Issuance Agent (Agent 11) | Phase 2 |
| Interview Coordination Agent (Agent 12) | Sprint 4 stretch |
| Gig Agent (Agent 13) | Phase 2/3 |
| Agent coordination layer | Sprint 4 stretch |
| Behavioural signals enrichment | Sprint 4 stretch |
| Per-user account creation on ATS platforms | Phase 2 |
| LinkedIn import | Phase 2 |
| Voice note passport intake | Phase 2 |
| W3C Verifiable Credentials format | Phase 2 |
| Scope Expansion Agent full (Agent 19) | Phase 2 |
| University graduate opportunities | Phase 2 |
| Professional licence verification (ECSA, etc.) | Phase 3 |
| Pan-African expansion | Phase 3 |
| Skills Graph public API | Phase 3 |
| "Sign in with MyMzansi" | Phase 2 |
| "Skilved as OAuth provider" for third parties | Phase 2 |

---

## Change Log

### v6.0 — June 2026
- Added Sprint 0 items: SAQA API test, NAMB contact, MyMzansi developer program, CMEK bucket setup, Cloud DLP
- Sprint 1: Added TVET college crawlers to Scout, `requiredDocuments[]` to Analyst, Skills Pulse teaser on feed
- Sprint 2: Added Document Vault infrastructure, SAQA integration, 4 onboarding paths, CV upload pipeline, Agent 18 v1, "Sign in with Skilved" branding, document section on profile page
- Sprint 3: Added pre-flight check to Application Agent (non-negotiable), review-before-submit flow, Agent 18 v2 (NAMB + WhatsApp photo), updated Level 3 consent to include document sharing
- Sprint 4: Added Agent 18 full (enrichment nudges, weekly summary), Agent 19 stub, CETA adapter, document statistics to XPRIZE package
- Updated all acceptance gates with Document Vault deliverables
- Updated key metrics table with document vault metrics + "Incomplete apps submitted = 0" row
- Updated priority triage: pre-flight + review-before-submit are inseparable must-haves
- Updated "What We Are NOT Building" with new deferred items

### v5.0 — June 2026
- Added 4 intelligence agents (14–17), ATS adapters, CAPTCHA solver, intelligence layer

