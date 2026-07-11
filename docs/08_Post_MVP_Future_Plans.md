# Skilved — Post-MVP & Future Plans

### Phase 2, 3, 4 Roadmap | Version 4.0 | June 2026

---

## Table of Contents

- [Overview](#overview)
- [Phase 1 (MVP): Opportunity Infrastructure + Skills Passport + Intelligence Layer](#phase-1-mvp)
- [Phase 2: Trust Infrastructure](#phase-2-trust-infrastructure)
- [Phase 3: Labour Market OS](#phase-3-labour-market-os)
- [Phase 4: Pan-African Expansion](#phase-4-pan-african-expansion)
- [Product Roadmap Summary](#product-roadmap-summary)
- [Technology Evolution](#technology-evolution)
- [Team Scaling Plan](#team-scaling-plan)
- [Funding Strategy](#funding-strategy)
- [Change Log](#change-log)

---

## Overview

The MVP proves the thesis: an AI agent system can discover, match, and help a skilled trades worker apply for opportunities better than any human or job board — while simultaneously building national intelligence that benefits the entire skills ecosystem.

Post-MVP deepens the moat, widens the surface, and builds toward the SA Skills Graph as national infrastructure.

**Each phase is gated by the previous.** Phase 2 cannot start without a functioning graph from Phase 1. Phase 3 cannot start without MyMzansi integration from Phase 2.

---

## Phase 1 (MVP)

**Timeline:** 8 weeks (4 sprints)
**Status:** Active

**Core deliverables:**
- Feed + Skills Passport + Application Agent (ATS adapters)
- Skills Pulse Dashboard (national intelligence)
- Career Simulation Engine
- Employer Accountability Layer
- Collective Intelligence Layer
- Micro-Credential System

**Exit criteria:**
- 5,000+ registered users
- 200+ Premium subscribers
- 50+ paying employers/SETAs
- 200+ outcome data points
- All 17 agents autonomous (`human_approvals_required: 0`)
- R300,000+ revenue
- XPRIZE submission complete

---

## Phase 2: Trust Infrastructure

**Timeline:** Month 4–18
**Theme:** Verified identity + reputation transforms the product

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

When MyMzansi's credential wallet API goes live, Skilved becomes the first private platform to integrate it. Self-reported "I have N3 Electrical" becomes "Verified by MyMzansi."

**NEW v4.0 connection:** Skills Pulse Dashboard becomes significantly more powerful with MyMzansi verification — when qualifications are government-verified rather than self-reported, the intelligence is more accurate. This is a selling point for the MyMzansi partnership.

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

**NEW v4.0:** Mobile app includes a native Career Simulation tool — "What If?" as a feature with rich visualisations. Cohort intelligence shown as animated charts. Skills Pulse digest as a daily notification.

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

**NEW v4.0 connection:** Career Coach powered by Career Simulation Engine. "Based on 47 electricians like you, getting your trade test would add R3,900/month. Here's the study plan." The Coach becomes the conversational interface to the simulation engine.

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

### 2.7 The Reputation Graph — Agent 10 (Reputation Agent)

**This is the second half of the moat.** The Skills Passport (MVP) answers "what can this person do?" The Reputation Graph answers "how well do they do it, according to people who've actually worked with them?"

**What it adds to the passport:**
- `trustScore` — 0-100, synthesised from peer/manager/employer reviews
- `synthesis` — plain-language summary: "Rated highly for reliability and technical skill by 2 verified employers over 18 months"
- `topAttributes` — extracted recurring themes from reviews (e.g. "punctual", "strong problem-solver")

**The non-negotiable design constraint — "review the reviewer":**
Reviews can only come from parties tied to a *verified outcome* in the graph (an employer Skilved has confirmed placed this worker). Each reviewer accumulates a `reviewerCredibilityScore` based on the variance and considered nature of their review history — an employer who rates everyone 5 stars contributes less weight than one with a track record of honest, differentiated feedback.

**Why this can't ship in MVP:** It requires a meaningful base of verified outcomes to synthesize from. Shipping it with 10-20 outcomes would produce thin, unconvincing trust scores — worse than not having the feature. Schema is seeded in MVP Sprint 2 (`reputation` field on `skills_passports`, empty `reviews` collection) so this requires no migration when it ships.

**Revenue impact:** "Verified" tier passports (with reputation data) become a distinct, premium tier for employer search — supporting tiered employer pricing beyond the basic referral fee.

**Timeline:** Design + build Month 4-6, once Phase 1 has produced 200+ outcomes with employer contact relationships established.

---

**NEW v4.0 connection:** Employer Accountability Score (Agent 16, live in MVP) feeds directly into Reputation Agent's dataset. The MVP accountability score is the precursor to the full reputation graph.

### 2.8 Credential Issuance — Agent 11 (Credential Issuance Agent)

Once the Reputation Graph exists, Skilved can issue its own verifiable credentials — based on combined outcome + reputation data that no other institution has access to.

**Example:** "Completed Eskom Electrical Apprenticeship — Skilved Verified — Employer-rated 4.8/5 — 18 months — Issued [date]"

This is credential *creation*, not verification of existing paper qualifications. A passport accumulating Skilved-issued credentials over time becomes a fundamentally richer asset than a self-reported profile or even a single MyMzansi-verified qualification.

**Design constraint — build on W3C Verifiable Credentials standard from day one.** This costs nothing extra at build time and makes every credential portable: usable with MyMzansi, shareable with other platforms, and a foundation for eventual cross-border recognition (relevant for Phase 4 pan-African expansion).

**Trigger condition:** Credential issued when Reputation Agent confirms a trust score update tied to a placement with sufficient tenure (3+ months recommended).

**Timeline:** Month 6-9, immediately following Reputation Agent.

---

**NEW v4.0 connection:** Micro-Credential System (live in MVP) is the precursor to Agent 11. MVP issues simple platform-native badges. Agent 11 upgrades these to full W3C Verifiable Credentials linked to MyMzansi.

### 2.9 Community Activity Feed (Opt-In)

The MVP ships a private, per-user `ActivityTimeline` (own agent activity only — see PRD FR-22). Phase 2 extends this to an opt-in, aggregate-first community feed — the mechanism for the "domino effect" of platform growth.

**What it shows:**
- Aggregate trend stats: "12 electricians placed in Gauteng this week, average employer rating 4.6"
- Opt-in individual milestones: a user can choose to share "I just completed my N4!" to their network
- Trade-specific community boards: "47 new electrical opportunities this week — see what others in your trade are doing"

**Privacy-first design:** Aggregate stats never require consent (no individual identified). Individual shares are opt-in per-post, not a default-on social feed. This avoids the trap of "Thabo got placed and didn't want strangers to know."

**Why this matters for growth:** This is the visible proof of the platform's compounding effect — the more people use Skilved, the more visible (and credible) its impact becomes, which drives further adoption. This is the Growth Agent's expanded surface area in Phase 2.

**Timeline:** Month 6-9, alongside Growth Agent maturation.

---

**NEW v4.0 connection:** Collective Intelligence Layer (live in MVP) is the precursor to the community activity feed. MVP shows aggregate cohort data on cards. Phase 2 extends to an opt-in community feed with richer interaction.

### 2.10 Voice Note Intake for Skills Passport

Many trades workers are more comfortable speaking than typing — particularly for the work-history input that feeds the Skills Profile Agent's extraction pipeline.

**What it adds:** WhatsApp voice note → transcription (Gemini audio or Speech-to-Text API) → Skills Profile Agent extraction pipeline (same as free-text today).

**Why it matters:** This is a meaningful accessibility and inclusion improvement — it lowers the barrier to building a rich passport for workers less comfortable with written English. It's a strong category-impact talking point even before it ships, since it directly addresses a real adoption barrier for the target population.

**Technical note:** No new extraction logic required — the Skills Profile Agent already processes free text; this adds a transcription step upstream.

**Timeline:** Month 4-6, low complexity, high inclusion impact — candidate for early Phase 2 prioritisation.

---

### 2.11 Automated Employer Verification

MVP relies on manual verification of each paying employer (low volume, acceptable for Sprint 2-4). As employer volume grows, this needs automation — both to scale and to protect passport data from fake employer accounts.

**What it adds:**
- Company registration number verification (CIPC API lookup)
- Domain verification (employer email domain matches registered company)
- Flagging for manual review when automated checks are inconclusive

**Why it matters:** As the Reputation Graph (2.7) goes live, employer accounts gain the ability to write reviews that affect workers' trust scores. A fake employer account writing fraudulent reviews is a meaningfully worse problem than a fake employer account viewing the feed. Automated verification should ship before or alongside the Reputation Agent.

**Timeline:** Month 4-6, sequenced just ahead of 2.7.

---

**NEW v4.0 note:** Employer verification now more urgent because Employer Accountability Scores are public from MVP. Fraudulent employer accounts could game scores if verification isn't robust.

### 2.12 Skills Pulse Dashboard — Government API
*(New addition v4.0)*

**What:** A formal government data API built on top of the Skills Pulse Dashboard — enabling DHET, National Treasury, and provincial governments to query Skilved's intelligence programmatically.

**Why Phase 2:** MVP launches the dashboard and builds the relationship. Phase 2 formalises it with a proper API, SLA, and paid license.

**Technical work:** REST API layer on top of BigQuery views, rate limiting, government-grade security, SLA monitoring, audit logging.

**Revenue:** R200,000–R1,000,000/year per government department.

### 2.13 Career Simulation API — White-Label
*(New addition v4.0)*

**What:** White-label Career Simulation Engine for TVET colleges, SETAs, and corporate L&D teams.

**Why Phase 2:** Once Career Simulation has enough outcome data (6–12 months post-launch), the confidence levels are strong enough to sell to institutions.

**Technical work:** Embeddable widget, API with authentication, branded output, institution-specific cohort filtering.

**Revenue:** R30,000–R150,000/year per institution.

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

**NEW v4.0 enhancement:** Skills Graph API now enhanced by the MVP intelligence layer data — employer accountability scores, career simulation outcomes, collective intelligence patterns. The public API is richer because of the Phase 1 additions.

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

**NEW v4.0 note:** Career Simulation Engine works for white-collar roles with zero code changes — it's trade-agnostic. Collective Intelligence Layer works for any profession. Skills Pulse Dashboard already tracks all sectors. Phase 1 intelligence layer scales to white-collar automatically.

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

**NEW v4.0 enhancement:** Workforce planning product now powered by Career Simulation Engine. "Which qualifications should we fund learnerships for to address our skills gap?" is a Career Simulation query scaled to an employer's entire workforce.

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

**NEW v4.0 enhancement:** The MVP Skills Pulse Dashboard is already this product at smaller scale. Phase 3 adds: predictive modelling, scenario analysis ("what happens to the skills market if we cut the construction levy by 20%?"), parliamentary-grade reports.

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

### 3.6 The Gig Agent — From Job Seeker to Micro-Business (Agent 13)

**This is the bridge between "AI job board" and "AI operating layer for South Africa's informal economy" — and the on-ramp to the full education/career/HR vision.**

**The insight:** A large proportion of Skilved's trades workers are also informal micro-business owners. The electrician using Skilved to find an apprenticeship is frequently the same person who rewires a neighbour's house or fixes a geyser on weekends. That side of their economic life is currently unserved by any platform.

**What it does:** Acts as an AI back office for a tradesperson's private gig work — reusing infrastructure already built for the core platform:

- Customer messages the tradesperson's Skilved-linked WhatsApp number with an inquiry ("my geyser is leaking, how much to fix?")
- Gig Agent asks clarifying questions, generates a quote based on standing rates (same Gemini reasoning as Application Agent's CV/cover letter generation)
- Schedules the job, sends reminders, generates a simple invoice after completion
- The completed gig becomes an outcome in the graph — feeding **Reputation Agent (2.7)** as a second source of trust signals (private customer reviews alongside employer reviews)

**Why this is the inevitable addition, not a generic one:**

1. **Near-zero new infrastructure.** Same WhatsApp interface (Customer Success Agent), same Gemini reasoning (Application Agent), same outcome→reputation pipeline (Agents 10/11)
2. **Valuable independent of employment status.** A fully employed tradesperson still does side work — Skilved becomes useful every week, not just during job searches. This is the mechanism that makes the platform something users genuinely can't live without
3. **Strengthens the reputation graph faster** — a second, independent source of trust data alongside employer reviews
4. **The structural on-ramp to the full vision.** A tradesperson with a strong Gig Agent track record is, functionally, running a small business. The same agentic infrastructure scales to help them formally register that business, hire their first employee through Skilved, and eventually appear on the **employer side** of the platform. This closes the loop: Skilved becomes the operating layer for the entire career lifecycle — education → first job → skilled worker → micro-business → employer — not just the entry point.

**Dependencies:** Reputation Agent (2.7) live for outcome feedback; Automated Employer Verification (2.11) live to prevent fraudulent gig-customer accounts at scale.

**Revenue:** Initially free (drives engagement + reputation data). Phase 3+: small transaction fee on invoiced amounts (1-2%), or bundled into Worker Premium+ tier.

**Timeline:** Month 6-12, immediately following Reputation Agent. Named in the roadmap and referenced in the XPRIZE narrative now (see `04_XPRIZE_Strategy.md`), even though it does not ship in the 8-week MVP — it is the long-term story that justifies the category framing "beyond job creation."

**Full technical spec:** see `24_AI_Employees_Architecture.md`, Agent 13.

---

**NEW v4.0 Employer Accountability connection:** Gig Agent outcomes (customer reviews, completed jobs) feed the Employer Accountability equivalent for independent tradespeople — a "Freelance Accountability Score" that works the same way as the employer score but for solo operators.

### 3.7 Employer Accountability — Industry Standards
*(New addition v4.0)*

**What:** When enough employer scores exist (Month 18+), publish an annual "SA Learnership Employer Rankings" — a public document ranking employers by accountability score, with full methodology.

**Why:** This creates media value (annual rankings always get coverage), reinforces Skilved's position as the authority on SA skills market intelligence, and creates pressure on poor-performing employers to improve.

**Revenue:** Sponsorship of annual rankings event, premium placement in rankings publication, consulting for score improvement.

---

## Phase 4: Pan-African Expansion
**Timeline:** Year 4–10  
**Theme:** SA's DPI advantage exported to the continent

**NEW v4.0 note:** Skills Pulse Dashboard scales to any country — just needs the local data sources and local SETA equivalents. When Skilved expands to Kenya, the Skills Pulse model goes with it. National skills intelligence is the product that governments pay for — and every African country building DPI needs it.

---

## Product Roadmap Summary

| Timeline | Phase | Key Features | Revenue Target |
|---|---|---|---|
| Month 1–3 | MVP | Feed, passport, 17 agents, ATS adapters, intelligence layer | R300K |
| Month 4–6 | Phase 2a | MyMzansi integration (prep), employer dashboard, SETA portal, Skills Pulse API | R600K/month |
| Month 7–12 | Phase 2b | Mobile app, Career Coach, in-app applications, Credential Issuance Agent, Career Simulation API | R2M/month |
| Month 13–18 | Phase 3a | White-collar expansion (healthcare, ICT), Skills Graph API v1, Employer Rankings publication | R5M/month |
| Month 19–24 | Phase 3b | Government policy intelligence platform, workforce planning product | R10M/month |
| Month 25–36 | Phase 3c | Full SA labour market OS, all sectors, national coverage | R20M/month |
| Year 4–5 | Phase 4a | Kenya expansion, East Africa pilot | R30M/month |
| Year 6–10 | Phase 4b/c | Pan-African scale, AfCFTA integration | R100M+/month |

---

## Technology Evolution

### Phase 2 Technology Additions
- MyMzansi OAuth integration
- React Native mobile app
- In-app messaging (WebSocket)
- ATS API integrations (BambooHR, Workday for enterprise)
- Gemini conversational career coach
- Advanced Vertex AI ranking
- **Government data API (Skills Pulse)** ← NEW v4.0
- **Career Simulation API (white-label)** ← NEW v4.0
- **W3C Verifiable Credentials issuance** ← enhanced from v3.0

### Phase 3 Technology Additions
- Skills Graph API (BigQuery + REST API)
- Federated learning (privacy-preserving model training)
- Real-time labour market intelligence dashboard (enhanced Skills Pulse)
- Predictive hiring
- **Employer Rankings automation** ← NEW v4.0
- **Scenario modelling for government** ← NEW v4.0

### Phase 4 Technology Additions
- Multi-country qualification framework mapping
- Cross-border credential verification (AfCFTA compatible)
- Multi-language NLP (Swahili, French, Arabic, Hausa)
- Distributed graph architecture (per-country data sovereignty)
- **Skills Pulse multi-country** ← NEW v4.0

---

## Team Scaling Plan

### Phase 2 Team Additions (Month 4–12): +8 people
*(Unchanged — see v3.0)*

**NEW v4.0 addition:**
- Government Relations Specialist (Month 6): dedicated relationship manager for DHET, National Treasury, Skills Pulse licensing

### Phase 3 Team Additions (Month 12–24): +15 people
*(Unchanged — see v3.0)*

**NEW v4.0 addition:**
- Policy Intelligence Analyst (Month 14): builds the government intelligence reports, presents at policy forums
- Intelligence Layer Product Manager (Month 12): owns Skills Pulse, Career Simulation API, Employer Rankings products

---

## Funding Strategy

**NEW v4.0 note for investors:** The intelligence layer (Skills Pulse Dashboard, Career Simulation Engine, Employer Accountability) creates a second business model alongside the platform — B2G (business-to-government) intelligence licensing. This is high-margin (database queries + report generation), high-value (government contracts), and creates a strategic moat that platform businesses rarely have. Include this in investor pitch as distinct from the B2C and B2B revenue streams.

---

## Change Log

### v4.0 — June 2026
- Updated Phase 1 exit criteria to include intelligence layer deliverables
- Added connections between MVP intelligence layer and Phase 2/3 features throughout
- Added Phase 2.12: Skills Pulse Dashboard Government API
- Added Phase 2.13: Career Simulation API White-Label
- Added Phase 3.7: Employer Accountability — Industry Standards (Annual Rankings)
- Updated product roadmap table with intelligence layer milestones
- Added Government Relations Specialist and Intelligence Layer Product Manager to team plan
- Added B2G intelligence licensing note to funding strategy
- Updated technology evolution with government data API, Career Simulation API, W3C VCs

### v3.0 — June 2026
- Added sections 2.7–2.11 (Reputation Graph, Credential Issuance, community feed, voice intake, employer verification)
- Added Gig Agent (section 3.6)

*Document version 4.0 — June 2026*
*Owner: Founder*
*Review: Quarterly*