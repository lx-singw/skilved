# Skilved — Post-MVP & Future Plans
### Phase 2, 3, 4 Roadmap | Version 1.0 | June 2026

---

## Overview

The MVP proves the thesis: an AI agent can discover, match, and help a skilled trades worker apply for opportunities better than any human or job board. Post-MVP is about deepening the moat, widening the surface, and building toward the SA Skills Graph.

Each phase is gated by the previous. Phase 2 cannot start without a functioning graph from Phase 1. Phase 3 cannot start without MyMzansi integration from Phase 2. This is intentional — the phases compound.

---

## Phase 1 (MVP): Opportunity Infrastructure
**Timeline:** Month 1–3  
**Status:** Active (this is the MVP)

Already documented in MVP Scope, PRD, and Feed Development Plan.

**Exit criteria for Phase 1:**
- 5,000+ registered users
- 50+ paying employers/SETAs
- 200+ outcome data points in the graph
- All 5 agents running autonomously
- R100,000+ revenue
- XPRIZE submission complete

---

## Phase 2: Trust Infrastructure
**Timeline:** Month 4–18  
**Theme:** Verified identity transforms the product

### 2.1 MyMzansi Credential Integration

The single most important Phase 2 feature. When MyMzansi's credential wallet API goes live, Skilved becomes the first private platform to integrate it.

**What changes:**
- Self-reported "I have N3 Electrical" becomes "Verified by MyMzansi — N3 Electrical, ESKOM TVET College, 2024"
- Employer trust increases dramatically — verified profile = premium candidate
- "Skilved Verified" badge appears on profiles with MyMzansi-linked credentials
- Workers own their verified credential permanently, portable across platforms

**Technical integration:**
- MyMzansi credential wallet OAuth flow
- Credential schema mapping (NQF levels, SAQA qualifications)
- Verification API call on profile view (real-time verification)
- Verified badge display with last-verified timestamp

**Revenue impact:**
- Verified candidates command premium referral fees (R2,000–R5,000 vs R500–R1,000)
- New product: Verification API for employers (R5–R20 per check)
- Government partnership revenue (DPSA, DoBE using Skilved as placement layer)

**Timeline:** Begin API relationship-building Month 1. Technical integration Month 6–12. Live Month 12.

---

### 2.2 Employer Dashboard (Full)

Beyond basic referral, employers get a full self-serve recruitment platform.

**Features:**
- Candidate search (filter by trade, qualification, province, experience, verified status)
- Saved candidate lists
- Application pipeline management (shortlist → interview → offer)
- Direct messaging with candidates (in-app)
- Interview scheduling (integrated calendar)
- Bulk CSV export
- Analytics: time-to-fill, candidate quality scores, placement success rates
- B-BBEE reporting (skills development spend tracking)

**Pricing:** R5,000–R50,000/month depending on size and usage

**Why this matters:** Employers who use the dashboard churn at < 5% annually. It becomes operationally embedded. This is the enterprise SaaS moat.

---

### 2.3 SETA Management Portal

SETAs manage thousands of learnership applications manually, with spreadsheets and email. Skilved becomes their operating system.

**Features:**
- Learnership listing management (SETA posts/updates directly)
- Candidate pipeline (pre-screened, qualified applicants from Skilved)
- Application management (shortlist, interview, placement tracking)
- Outcome reporting (DHET compliance reports auto-generated)
- Disbursement tracking (stipend payment integration)
- Impact dashboard (placements, completions, employment outcomes)

**Pricing:** R20,000–R100,000/year per SETA (based on learnership volume)

**Strategic value:** 21 SETA contracts = R420K–R2.1M annual recurring revenue, plus the most comprehensive SA learnership outcome data in existence.

---

### 2.4 Mobile App (iOS + Android)

PWA covers the MVP. A native app unlocks:
- Push notifications (faster than WhatsApp digests)
- Offline browsing (cached feed for low-connectivity)
- Camera integration (document upload for applications)
- Biometric login
- App Store distribution (acquisition channel)

**Build timeline:** Month 6–9  
**Tech:** React Native (shared codebase with web)

---

### 2.5 AI Career Coach (Conversational)

Beyond opportunity discovery, a conversational AI agent that helps workers:
- Understand which qualifications they need for their target role
- Plan a multi-year career path
- Prepare for interviews (trade-specific practice questions)
- Write CVs and cover letters
- Understand their rights as an apprentice/learner

**Interface:** WhatsApp-native conversation (no new app required)  
**Model:** Gemini with Skilved's SA trades knowledge base  
**Pricing:** Free tier (3 sessions/month) + R50/month premium (unlimited)

---

### 2.6 In-App Application System

Currently Skilved redirects to external application URLs. Phase 2 brings applications in-app for participating employers.

**Benefits:**
- Complete application data flows to Skilved graph
- Outcome tracking becomes automatic (no follow-up needed)
- AI cover note generation is integrated (not bolted on)
- Application status updates visible in Skilved dashboard
- Employer receives structured, pre-formatted applications

**Revenue:** Premium employer feature, included in Growth and Enterprise plans

---

## Phase 3: Labour Market OS
**Timeline:** Month 18–48  
**Theme:** From platform to national infrastructure

### 3.1 The SA Skills Graph — Public API

By Month 18, Skilved has enough outcome data to publish insights that no other entity in South Africa has:

- Which NQF qualifications unlock which salary ranges
- Which learnerships have the highest employment rates post-completion
- Which trades have the largest demand-supply gaps by province
- Which TVET colleges produce the most employable graduates
- Which career paths are real (verified by outcomes, not by LinkedIn posts)

**The Skills Graph API:**
- Sell to: National Treasury, DHET, DPSA, provincial skills offices
- Use cases: policy design, curriculum development, skills levy allocation
- Pricing: R50,000–R500,000 per annual data license
- First mover: no equivalent dataset exists in South Africa

**The comparison:**
> LinkedIn knows what people claim. Skilved knows what actually happened — verified by identity, confirmed by outcomes, built over years. Government will pay for this because it makes their policy better.

---

### 3.2 White-Collar Expansion

Trades is the wedge. The methodology works for any skills-based labour market segment.

**Expansion sequence (by data availability and demand):**
1. Healthcare (nurses, paramedics, radiographers) — Month 18
2. ICT / tech (developers, data analysts, network engineers) — Month 20
3. Finance and accounting (bookkeepers, payroll, auditors) — Month 22
4. Education (teachers, ECE practitioners) — Month 24
5. All other sectors — Month 24–36

**Why this order:** Healthcare has the most acute shortage, most structured qualifications, and government willingness to pay. ICT has highest employer spend. Finance has highest professional willingness to pay.

---

### 3.3 Skilved for Employers — Workforce Planning

Beyond recruitment, large employers use Skilved data to plan:

- Skills forecasting: which roles will be hardest to fill in 12 months
- Internal mobility: which existing employees are candidates for upskilling
- Learnership ROI: which of their own learnerships have the highest retention
- Competitive benchmarking: are they paying competitive salaries for trade roles

**Product:** SaaS analytics dashboard  
**Pricing:** R10,000–R50,000/month (enterprise only)  
**Target:** Top 200 SA employers, all parastatals

---

### 3.4 Skilved for Government — Policy Intelligence

The most strategically valuable product Skilved can build, but requires years of data to be credible.

**Product:** Annual SA Skills Report — the definitive analysis of SA's labour market, built on Skilved's verified outcome graph.

**Delivered to:**
- National Treasury (for skills levy allocation)
- DHET (for TVET curriculum policy)
- DPSA (for public service skills planning)
- Parliament's portfolio committee on higher education

**Positioning:**
> Every year, SA allocates R25 billion in skills development funding based on surveys and projections. Skilved's graph provides actual outcome data — which investments created employment, which didn't. That is a fundamentally better basis for policy.

**Revenue:** Government data licenses, consulting contracts, policy advisory  
**Estimated:** R5M–R20M annually by Year 5

---

### 3.5 Skilved Verify — B2B API

A standalone API product for any platform that needs to verify SA skills and credentials.

**Use cases:**
- Fintech apps verifying employment status for loan applications
- Insurance companies verifying trade qualifications
- Background check providers
- Gig platforms verifying artisan credentials before customer assignment

**Pricing:** R5–R50 per verification depending on depth  
**Integration:** REST API with OAuth2  
**Compliance:** POPIA-compliant, consent-based, auditable

---

## Phase 4: Pan-African Expansion
**Timeline:** Year 4–10  
**Theme:** SA's DPI advantage exported to the continent

### 4.1 Strategic Context

South Africa has built the most advanced Digital Public Infrastructure on the African continent. MyMzansi is a world-class DPI stack — ahead of most African countries by 3–5 years.

15+ African countries are in the process of building their own DPI. They will face the same challenge SA faces: DPI without an intelligence layer is just bureaucracy, not advancement.

Skilved's expansion thesis: take the SA model (DPI intelligence layer + skills graph + verified opportunity matching) and replicate it in countries that are building equivalent DPI stacks.

**Target markets (priority order):**
1. Kenya — most advanced DPI (Huduma Namba), large skilled workforce, English-speaking
2. Rwanda — fastest digital adoption in Africa, government-friendly innovation environment
3. Nigeria — largest labour market on the continent, massive skills gap
4. Ghana — stable, English-speaking, growing middle class
5. Egypt — large technical workforce, strong TVET system

---

### 4.2 Expansion Model

**Phase 4a (Year 4–5): Kenya pilot**

- Hire 2 Kenya-based team members (local context is non-negotiable)
- Map Kenya's TVET and skills development landscape (NITA, TVETA equivalent of SETAs)
- Adapt opportunity graph model for Kenyan qualifications framework
- Launch Kenya feed with local opportunity sources
- Partner with Kenya's DPI team for credential integration

**Phase 4b (Year 5–7): East Africa**

- Rwanda, Uganda, Tanzania from Kenya base
- Shared technology platform, local data and partnerships per country
- Pan-East African skills graph begins forming

**Phase 4c (Year 7–10): West Africa + North Africa**

- Nigeria (Lagos first, as with Gauteng), Ghana, Egypt
- Potential for AfCFTA cross-border credential recognition layer
- Pan-African skills mobility intelligence

---

### 4.3 The Africa Advancement Layer

The 10-year endgame:

> Skilved becomes the intelligence layer for the African Continental Free Trade Area's labour market. When a welder in Nairobi wants to work in Johannesburg, Skilved verifies their credentials, finds them opportunities, and tracks their career outcomes — all connected to their country's DPI identity infrastructure.

This is not a job board. This is the economic mobility engine for 800 million working-age Africans.

---

## Product Roadmap Summary

| Timeline | Phase | Key Features | Revenue Target |
|---|---|---|---|
| Month 1–3 | MVP: Opportunity infrastructure | Feed, agents, accounts, WhatsApp digest | R300K |
| Month 4–6 | Phase 2a | MyMzansi integration (prep), employer dashboard, SETA portal | R600K/month |
| Month 7–12 | Phase 2b | Mobile app, AI career coach, in-app applications, verification API | R2M/month |
| Month 13–18 | Phase 3a | White-collar expansion (healthcare, ICT), skills graph API v1 | R5M/month |
| Month 19–24 | Phase 3b | Government policy intelligence, workforce planning product | R10M/month |
| Month 25–36 | Phase 3c | Full LA labour market OS, all sectors, national coverage | R20M/month |
| Year 4–5 | Phase 4a | Kenya expansion, East Africa pilot | R30M/month |
| Year 6–10 | Phase 4b/c | Pan-African scale, AfCFTA integration | R100M+/month |

---

## Technology Evolution

### Phase 2 Technology Additions
- MyMzansi OAuth integration
- React Native mobile app
- In-app messaging (WebSocket)
- ATS API integrations (BambooHR, Workday for enterprise employers)
- Gemini conversational career coach
- Advanced Vertex AI ranking (multimodal inputs)

### Phase 3 Technology Additions
- Skills Graph API (BigQuery + REST API)
- Federated learning (privacy-preserving model training across employer data)
- Real-time labour market intelligence dashboard (Looker Studio + BigQuery)
- Predictive hiring (which candidates will succeed in which roles)
- Automated B-BBEE reporting engine

### Phase 4 Technology Additions
- Multi-country qualification framework mapping
- Cross-border credential verification (AfCFTA compatible)
- Multi-language NLP (Swahili, French, Arabic, Hausa)
- Distributed graph architecture (per-country data sovereignty)

---

## Team Scaling Plan

### MVP Team (Month 1–3)
- 1 Founder (product, strategy, sales)
- 2 Engineers (fullstack + agents)
- 1 Designer
- 1 Growth (partnerships, outreach)

### Phase 2 Team (Month 4–12): +8 people
- CTO (hire Month 3)
- 3 additional engineers (mobile, ML, backend)
- 1 Data scientist (graph, ML ops)
- 1 Enterprise sales (employer/SETA)
- 1 Marketing manager
- 1 Operations (POPIA, legal, finance)

### Phase 3 Team (Month 12–24): +15 people
- VP Product
- 5 engineers (platform scale, API products)
- 2 data scientists
- 2 enterprise account managers
- 1 Government relations
- 1 HR
- 2 Customer success
- 1 Finance

### Phase 4 Team (Year 4+): +30 people (per country)
- Country managers (Kenya, Nigeria)
- Local engineering teams
- Local partnerships
- Pan-African data team

---

## Funding Strategy

### Pre-Seed / XPRIZE (Now)
**Target:** R500,000–R1,500,000  
**Sources:** XPRIZE prize money (R2.4M if won), angel investors, SA innovation grants (SEDA, IDC, DSI)  
**Use:** MVP build, first 90 days, XPRIZE submission

### Seed Round (Month 3–6)
**Target:** R5,000,000–R15,000,000  
**Valuation:** R30M–R50M (based on XPRIZE validation + traction)  
**Investors:** SA VCs (4Di Capital, Knife Capital, Newtown Partners), impact investors (Omidyar Network, Luminate), pan-African funds (TLcom, Partech Africa)  
**Use:** Phase 2 build, team scaling, employer sales

### Series A (Month 18–24)
**Target:** R50,000,000–R150,000,000  
**Valuation:** R300M–R500M  
**Investors:** Pan-African growth funds, international impact funds, strategic (telco, bank)  
**Use:** Phase 3 build, white-collar expansion, government product

### Series B (Year 4)
**Target:** R300,000,000+  
**Use:** Pan-African expansion, Kenya + Nigeria

---

*Document version 1.0 — June 2026*  
*Owner: Founder*  
*Review: Quarterly*
