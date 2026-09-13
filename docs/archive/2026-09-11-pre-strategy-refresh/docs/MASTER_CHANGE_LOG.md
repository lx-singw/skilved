# Skilved — Master Change Log
### All Document Changes v5.0 | June 2026

---

## Table of Contents

- [Summary of All Changes](#summary-of-all-changes)
- [New Documents Added](#new-documents-added)
- [New Agents Added](#new-agents-added)
- [Existing Documents Updated](#existing-documents-updated)
- [Key Architectural Changes](#key-architectural-changes)
- [XPRIZE Impact Summary](#xprize-impact-summary)

---

## Summary of All Changes

This change log documents every addition, modification, and new document created in the v5.0 update of the Skilved documentation suite.

**Total documents:** 32 (was 26)
**New documents:** 6
**Updated documents:** 10
**New agents:** 4 (Agents 14–17)
**New BigQuery tables:** 6
**New Firestore collections:** 2
**New environment variables:** 40+
**New functional requirements:** 6 (FR-30 through FR-35)
**New runbooks:** 6 (Runbooks 14–19)

---

## New Documents Added

### 27_Skills_Pulse_Dashboard.md — NEW v5.0
**What:** Full specification for the national skills intelligence dashboard
**Agent:** Agent 14 (Skills Pulse Agent)
**Why:** Brings "real-time national intelligence" to the present — judges see this is national infrastructure, not just a product
**Sprint:** v1 static Sprint 1 → v2 fully automated Sprint 4
**Key contents:**
- Dashboard sections: national overview, demand-supply gap heatmap, expiry risks, qualification ROI, TVET performance, predictive signals
- Agent 14 BigQuery queries and Gemini intelligence synthesis
- Government PDF report auto-generation
- Revenue path: free public dashboard → government data license (R200K–R1M/year)

---

### 28_Career_Simulation_Engine.md — NEW v5.0
**What:** Full specification for the "What if I do X?" career simulation
**Agent:** Agent 15 (Career Simulation Agent)
**Why:** Delivers outcome-verified career intelligence that McKinsey charges R500K for — free, on a phone, in 30 seconds
**Sprint:** v1 opportunity-based Sprint 3 → v2 outcome-verified Sprint 4
**Key contents:**
- 6 simulation query types (add_qualification, change_province, get_trade_test, take_learnership, add_certification, change_trade)
- CohortBuilder with tiered widening strategy
- Confidence levels based on sample size (insufficient/low/medium/high)
- Early data strategy: shows value at 0 outcomes, improves every week
- WhatsApp and web output formats

---

### 29_ATS_Adapter_Strategy.md — NEW v5.0
**What:** Complete implementation specs for all 8 ATS platform adapters
**Why:** Replaces "generic Playwright" with targeted adapters — more achievable, more impressive to judges
**Sprint:** Email Sprint 1 → SuccessFactors Sprint 2 → Taleo/PageUp/SETAs Sprint 3 → CETA/Generic Sprint 4
**Key contents:**
- SA employer ATS platform distribution (% of opportunities per platform)
- Full TypeScript implementations: SuccessFactorsAdapter, OracleTaleoAdapter, PageUpAdapter, MersetaPortalAdapter, EmailSubmitter
- CAPTCHA solving integration (2captcha/CapSolver)
- Account management strategy (service account approach for MVP)
- SubmissionRouter implementation
- Failure handling with email fallback

---

### 30_Employer_Accountability_Layer.md — NEW v5.0
**What:** Public employer ratings from verified outcomes
**Agent:** Agent 16 (Employer Accountability Agent)
**Why:** First time this information exists publicly in SA — systemic change argument for XPRIZE
**Sprint:** Infrastructure Sprint 2 → v1 early data Sprint 3 → v2 polished Sprint 4
**Key contents:**
- 5-component scoring model (placement 30, completion 25, salary 20, feedback 15, time 10)
- Anti-gaming design (verified outcomes only, anomaly detection, minimum sample size)
- What workers see on opportunity cards (grade + key metric)
- Employer response mechanism (context, not score change)
- Revenue implications (market effect on learnership quality)

---

### 31_Micro_Credential_System.md — NEW v5.0
**What:** Skilved Verified platform-native badges
**Why:** Living credentials anchored to real outcomes — what the global credentialing industry has tried to build for a decade
**Sprint:** Sprint 2
**Key contents:**
- 4 credential types: Active Applicant, Profile Complete, Interview Ready, Placed
- Issuance logic with automated criteria checking
- Verification page with QR code
- Employer-visible credential display
- Path to W3C Verifiable Credentials (Phase 2, schema-compatible from day 1)
- POPIA compliance

---

### 32_Collective_Intelligence_Layer.md — NEW v5.0
**What:** "What are people like me doing?" cohort-based career intelligence
**Agent:** Agent 17 (Collective Intelligence Agent)
**Why:** Democratic access to insider knowledge previously only in elite networks — the equity argument
**Sprint:** v1 activity-based Sprint 2 → v2 apply/interview Sprint 3 → v3 full outcome Sprint 4
**Key contents:**
- Cohort definition with tiered widening (narrow → broad)
- Minimum cohort size privacy protection (5 users)
- All 3 display surfaces: opportunity cards, feed banner, profile page
- Weekly WhatsApp digest addition
- POPIA compliance (aggregate data only)
- Data progression strategy from 0 to 500+ outcomes

---

## New Agents Added

### Agent 14: Skills Pulse Agent
- **Trigger:** Cloud Scheduler daily 2am SAST
- **Job:** Query BigQuery for national skills intelligence, synthesize with Gemini, publish to Skills Pulse Dashboard
- **Key outputs:** Demand-supply gaps, expiry risks, qualification ROI, TVET performance, predictive signals, government PDF report
- **Sprint:** v1 Sprint 1 (static) → v2 Sprint 4 (fully automated)
- **`human_approvals_required: 0`**

### Agent 15: Career Simulation Agent
- **Trigger:** HTTP per query + daily batch pre-computation
- **Job:** Answer "what if I do X?" queries using cohort data from BigQuery
- **Key outputs:** Opportunity delta, salary delta, placement rate change, confidence level, aligned opportunities
- **Sprint:** v1 Sprint 3 → v2 Sprint 4
- **`human_approvals_required: 0`**

### Agent 16: Employer Accountability Agent
- **Trigger:** Cloud Scheduler weekly (Monday 3am) + event-driven on new outcome
- **Job:** Calculate employer accountability scores from verified outcomes, publish to opportunity cards
- **Key outputs:** 0–100 score, A–F grade, plain-language summary, trend
- **Sprint:** Infrastructure Sprint 2 → v1 Sprint 3 → v2 Sprint 4
- **`human_approvals_required: 0`**

### Agent 17: Collective Intelligence Agent
- **Trigger:** HTTP per feed request (authenticated) + daily batch
- **Job:** Build cohort for user, surface "people like you" intelligence on feed
- **Key outputs:** Cohort-based card data, feed banner, profile section, weekly digest addition
- **Sprint:** v1 Sprint 2 → v2 Sprint 3 → v3 Sprint 4
- **`human_approvals_required: 0`**

---

## Existing Documents Updated

### 00_INDEX.md → v5.0
- Added all 6 new documents to index
- Added "The XPRIZE Vision Addition" to strategy section
- Added new agents (14–17) to architecture description
- Added "ATS Reality" section to strategy
- Added complete addition log section
- Added table of contents

### 01_MVP_Scope.md → v4.0
- Added "The Four Future-to-Present Capabilities" section
- Added "The Intelligence Layer — First Principles" section
- Added "The ATS Strategy — First Principles" section
- Updated MVP North Star (includes Skills Pulse and employer accountability)
- Updated all 4 sprint gates with intelligence layer deliverables
- Updated agents table to 17 agents
- Added employer score and cohort intelligence to feed IA
- Updated technical stack with Playwright and CAPTCHA solver
- Updated graph schema with 6 new tables
- Updated conversion triggers to mention cohort intelligence

### 02_PRD.md → v4.0
- Added FR-30: Skills Pulse Dashboard (15 requirements)
- Added FR-31: Career Simulation Engine (15 requirements)
- Added FR-32: Employer Accountability Layer (14 requirements)
- Added FR-33: Collective Intelligence Layer (14 requirements)
- Added FR-34: Micro-Credential System (15 requirements)
- Added FR-35: ATS Adapter Architecture (15 requirements)
- Updated FR-02 (opportunity detail) with employer score and cohort intelligence
- Added Persona 5 (Government Policy Official)
- Added 16 new analytics events
- Updated all 4 acceptance gates
- Added OQ-11 through OQ-18

### 04_XPRIZE_Strategy.md → v5.0
- Added "The Bringing the Future to the Present Frame" section (four future-present capabilities)
- Updated XPRIZE demonstration script for 17 agents (6,247 decisions vs 4,540)
- Added Skills Pulse to Sprint 1, Collective Intelligence to Sprint 2
- Added Career Simulation and Employer Accountability to Sprint 3
- Added all 4 intelligence agents to Sprint 4
- Updated GCP stack table for new agents
- Updated risk register with ATS-specific risks
- Strengthened judge narrative with four future-to-present arguments
- Updated submission package (10 items vs 6)
- Added pre-submission checklist

### 14_Data_Models_Schema.md → v3.0
- Added `applicationPlatform`, ATS fields to `opportunities` collection
- Added `microCredentials`, `cohortSignals` to `skills_passports`
- Added ATS fields to `applications`
- Added accountability score fields to `employers`
- Added new `agent_context` flags for v5.0 agents
- Added `micro_credentials` Firestore collection (full schema)
- Added `skills_pulse_snapshots` Firestore collection (full schema)
- Added 6 new BigQuery tables: `skills_pulse_snapshots`, `employer_accountability_scores`, `cohort_snapshots`, `career_simulations`, `application_submissions`, `micro_credential_events`
- Added 2 new BigQuery views: `ats_performance`, `intelligence_layer_health`
- Added 6 new Redis cache keys

### 16_Environment_Variables.md → v2.0
- Added ATS Adapter Configuration section (15 new variables)
- Added Intelligence Layer Configuration section (28 new variables across 5 agents)
- Updated Feature Flags (12 new flags)
- Added new Secret Manager setup commands
- Added table of contents

### 19_CLAUDE_MD.md → v5.0
- Added Agents 14–17 to agent table
- Added ATS Adapter Architecture section
- Added Intelligence Layer Summary section
- Updated monorepo structure with new agent directories
- Added new Firestore collections and BigQuery tables
- Added new Redis cache keys
- Added 5 new Common Tasks (ATS adapters, Career Simulation, Skills Pulse, employer accountability, cohort empty)
- Added 10 new "Do Not" rules
- Updated sprint context table

### 20_Sprint_Plan.md → v5.0
- Added Sprint 0 items: employer calls this week, CAPTCHA solver setup
- Sprint 1: Added Skills Pulse v1 + ATS detection deliverables
- Sprint 2: Added Collective Intelligence v1 + Micro-credentials + Agent Trace Visualizer
- Sprint 3: Added Career Simulation v1 + SuccessFactors adapter + Employer Accountability v1
- Sprint 4: Added Oracle Taleo + PageUp + SETA adapters + Agent 14/15/16/17 full specs + CAPTCHA solver
- Updated all acceptance gates
- Updated key metrics table (8 new rows)
- Added "Intelligence Layer Priority" to triage section

### 22_Runbooks.md → v4.0
- Added Runbook 14: ATS Adapter Failure
- Added Runbook 15: CAPTCHA Solver Failure
- Added Runbook 16: Skills Pulse Dashboard Failure
- Added Runbook 17: Career Simulation Engine Failure
- Added Runbook 18: Employer Accountability Score Anomaly
- Added Runbook 19: Collective Intelligence Cohort Empty
- Updated Runbook 8 with ATS platform-specific diagnosis steps
- Updated Daily Health Check script with ATS performance, intelligence layer health, CAPTCHA balance

### 24_AI_Employees_Architecture.md → v5.0
- Added Agent 14 full specification (Skills Pulse)
- Added Agent 15 full specification (Career Simulation with full engine code)
- Added Agent 16 full specification (Employer Accountability with scoring model)
- Added Agent 17 full specification (Collective Intelligence with cohort builder)
- Added "The ATS Adapter Architecture" section with full SubmissionRouter, adapter implementations, CAPTCHA solver
- Added ATS platform detection to Analyst Agent (ATSDetector class + updated extraction prompt)
- Updated XPRIZE demonstration script (17 agents, 6,247 decisions)
- Added new `agent_context` flags for v5.0 agents
- Updated agent interaction map diagram
- Added table of contents

---

## Key Architectural Changes

### 1. ATS Adapter Strategy (replaces "generic Playwright")
**Before:** "Application Agent uses Playwright for web form automation"
**After:** Application Agent uses targeted adapters for 8 specific platforms (SuccessFactors, Oracle Taleo, PageUp, MERSETA, EWSETA, CETA portals, Email, Generic fallback). Analyst Agent detects platform during extraction. Application Agent routes by pre-detected platform. CAPTCHA solver integrated from Sprint 2.

**Why this matters:** More achievable, more impressive, covers ~95% of opportunities by Sprint 4 end. Named employers (Eskom via SuccessFactors, Transnet via Oracle Taleo) in BigQuery logs.

### 2. Intelligence Layer (4 new agents, 3 new public surfaces)
**Before:** Product helps individual workers find and apply for opportunities
**After:** Product helps individuals AND serves as national intelligence infrastructure for government and employers

**New surfaces:**
- `skilved.com/skills-pulse` — public, no login, national intelligence
- Employer accountability scores on every opportunity card — public
- Cohort intelligence on opportunity cards — authenticated
- Career simulation on profile page — authenticated

### 3. Micro-Credential System
**Before:** Self-reported qualifications, no platform-native verification
**After:** Skilved issues living credentials anchored to verified outcomes — Active Applicant, Profile Complete, Interview Ready, Placed — with verification codes, QR codes, and public verification pages

### 4. XPRIZE Narrative Strengthened
**Before:** "Skilved is an AI-operated job matching platform"
**After:** "Skilved brings an awesome future to the present — making four capabilities real that didn't exist before: national skills intelligence, outcome-verified career simulation, democratic career insider knowledge, and employer accountability at scale"

### 5. Agent Count: 13 → 17
**Before:** 13 agents (0–13)
**After:** 17 agents (0–17, with 10–11 Phase 2 stubs and 12–13 stretch/Phase 2)

---

## XPRIZE Impact Summary

### Score Projection Before v5.0
- Business Viability: 85/100
- AI-Native Operations: 92/100
- Category Impact: 90/100
- **Estimated total: 89/100**

### Score Projection After v5.0
- Business Viability: 90/100 (more revenue streams, faster activation)
- AI-Native Operations: 96/100 (17 agents, ATS adapters named + verified in logs)
- Category Impact: 97/100 (national intelligence + equity + accountability = systemic change)
- **Estimated total: 94/100**

### What Changed the Score

**Business Viability (+5):**
- Skills Pulse Dashboard creates government data license revenue path (R200K–R1M/year)
- Employer Accountability Layer creates premium listing fee revenue
- Career Simulation Engine drives Premium subscription conversion (immediate ROI demonstration)

**AI-Native Operations (+4):**
- 4 more agents = more autonomous decisions in 24-hour XPRIZE count
- ATS adapter breakdown by platform visible in BigQuery (concrete, verifiable)
- CAPTCHA solving removes the main Application Agent failure mode

**Category Impact (+7):**
- National intelligence dashboard = "this is infrastructure, not a product"
- Career Simulation = "democratising the intelligence McKinsey sells"
- Collective Intelligence = "closing the equity gap in career information"
- Employer Accountability = "systemic change, not optimisation"

### The Single Most Important Addition
**Career Simulation Engine** — because it gives judges a specific, memorable, emotionally resonant demonstration of the future being brought to the present. "Thandeka from Soweto can now ask what McKinsey clients pay R500,000 to know — free, on WhatsApp, in 30 seconds, grounded in 47 verified real outcomes." Judges will remember this sentence.

---

*Master Change Log — June 2026*
*v5.0 additions: 6 new documents, 4 new agents, 40+ new environment variables, 6 new FR, 6 new runbooks*
*v5.1 additions: Account creation + email application gap coverage (8 new requirements, 2 updated classes)*
*All changes logged above are reflected in their respective documents*

---

## v5.1 — Account Creation & Email Application Coverage (June 2026)

**Problem:** `requiresAccountCreation` field existed on the opportunity schema but was never consumed by any agent, adapter, or pre-flight check. Email applications had no validation or hybrid flow handling.

### Changes to `docs/02_PRD_2.md`
| Addition | Detail |
|---|---|
| FR-12.25 | Email + portal registration hybrid: portal registration MUST complete before email is sent |
| FR-12.26 | Portal registration failure in hybrid flow → email NOT sent, application HELD |
| FR-12.27 | `EmailSubmitter` MUST validate `applicationEmail` before send; invalid → BigQuery log + fallback |
| FR-38.14 | Pre-flight MUST check `requiresAccountCreation` — HOLD if no service account configured |
| FR-38.15 | Pre-flight MUST check `captchaLikely` — HOLD if CAPTCHA solver unavailable |
| FR-38.16 | Pre-flight result shape extended with `requiresAccountCreation`, `captchaSolverAvailable`, `platformReady` |
| FR-38.17 | `requiresAccountCreation=true` + service account available → pre-flight passes |
| FR-38.18 | Service account rate-limited → auto-escalate to Approach B (per-user) or HOLD |

### Changes to `docs/29_ATS_Adapter_Strategy.md`
| Addition | Detail |
|---|---|
| `SubmissionRouter` | Now injects `ATSAccountManager`; checks `requiresAccountCreation` and `captchaLikely` BEFORE routing. Throws `AccountNotReadyError` or `CaptchaSolverUnavailableError` to trigger HOLD |
| `EmailSubmitter.submit()` | Added email validation (`isValidEmail`), hybrid portal registration check (`ensurePortalRegistration`), BigQuery logging for invalid emails, correct failure modes per FR-12.25/26/27 |
| `ATSAccountManager` | New methods: `hasActiveServiceAccount()` (readiness check), `ensureUserRegisteredOnPlatform()` (Approach A/B dispatch), `createPerUserAccount()` (Phase 2 per-user registration via Playwright) |

### Changes to `docs/16_Environment_Variables.md`
| Addition | Detail |
|---|---|
| `ACCOUNT_CREATION_MODE` | New env var: `service_account` (Approach A, MVP default) or `per_user` (Approach B, Phase 2). Controls how `ATSAccountManager.ensureUserRegisteredOnPlatform()` behaves |
