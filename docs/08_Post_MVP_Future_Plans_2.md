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
*(Unchanged from v3.0)*

When MyMzansi's credential wallet API goes live, Skilved becomes the first private platform to integrate it. Self-reported "I have N3 Electrical" becomes "Verified by MyMzansi."

**NEW v4.0 connection:** Skills Pulse Dashboard becomes significantly more powerful with MyMzansi verification — when qualifications are government-verified rather than self-reported, the intelligence is more accurate. This is a selling point for the MyMzansi partnership.

### 2.2 Employer Dashboard (Full)
*(Unchanged from v3.0)*

### 2.3 SETA Management Portal
*(Unchanged from v3.0)*

### 2.4 Mobile App (iOS + Android)
*(Unchanged from v3.0)*

**NEW v4.0:** Mobile app includes a native Career Simulation tool — "What If?" as a feature with rich visualisations. Cohort intelligence shown as animated charts. Skills Pulse digest as a daily notification.

### 2.5 AI Career Coach (Conversational)
*(Unchanged from v3.0)*

**NEW v4.0 connection:** Career Coach powered by Career Simulation Engine. "Based on 47 electricians like you, getting your trade test would add R3,900/month. Here's the study plan." The Coach becomes the conversational interface to the simulation engine.

### 2.6 In-App Application System
*(Unchanged from v3.0)*

### 2.7 The Reputation Graph — Agent 10 (Reputation Agent)
*(Unchanged from v3.0)*

**NEW v4.0 connection:** Employer Accountability Score (Agent 16, live in MVP) feeds directly into Reputation Agent's dataset. The MVP accountability score is the precursor to the full reputation graph.

### 2.8 Credential Issuance — Agent 11 (Credential Issuance Agent)
*(Unchanged from v3.0)*

**NEW v4.0 connection:** Micro-Credential System (live in MVP) is the precursor to Agent 11. MVP issues simple platform-native badges. Agent 11 upgrades these to full W3C Verifiable Credentials linked to MyMzansi.

### 2.9 Community Activity Feed (Opt-In)
*(Unchanged from v3.0)*

**NEW v4.0 connection:** Collective Intelligence Layer (live in MVP) is the precursor to the community activity feed. MVP shows aggregate cohort data on cards. Phase 2 extends to an opt-in community feed with richer interaction.

### 2.10 Voice Note Intake for Skills Passport
*(Unchanged from v3.0)*

### 2.11 Automated Employer Verification
*(Unchanged from v3.0)*

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
*(Unchanged from v3.0)*

**NEW v4.0 enhancement:** Skills Graph API now enhanced by the MVP intelligence layer data — employer accountability scores, career simulation outcomes, collective intelligence patterns. The public API is richer because of the Phase 1 additions.

### 3.2 White-Collar Expansion
*(Unchanged from v3.0)*

**NEW v4.0 note:** Career Simulation Engine works for white-collar roles with zero code changes — it's trade-agnostic. Collective Intelligence Layer works for any profession. Skills Pulse Dashboard already tracks all sectors. Phase 1 intelligence layer scales to white-collar automatically.

### 3.3 Skilved for Employers — Workforce Planning
*(Unchanged from v3.0)*

**NEW v4.0 enhancement:** Workforce planning product now powered by Career Simulation Engine. "Which qualifications should we fund learnerships for to address our skills gap?" is a Career Simulation query scaled to an employer's entire workforce.

### 3.4 Skilved for Government — Policy Intelligence
*(Unchanged from v3.0)*

**NEW v4.0 enhancement:** The MVP Skills Pulse Dashboard is already this product at smaller scale. Phase 3 adds: predictive modelling, scenario analysis ("what happens to the skills market if we cut the construction levy by 20%?"), parliamentary-grade reports.

### 3.5 Skilved Verify — B2B API
*(Unchanged from v3.0)*

### 3.6 The Gig Agent — From Job Seeker to Micro-Business (Agent 13)
*(Unchanged from v3.0)*

**NEW v4.0 Employer Accountability connection:** Gig Agent outcomes (customer reviews, completed jobs) feed the Employer Accountability equivalent for independent tradespeople — a "Freelance Accountability Score" that works the same way as the employer score but for solo operators.

### 3.7 Employer Accountability — Industry Standards
*(New addition v4.0)*

**What:** When enough employer scores exist (Month 18+), publish an annual "SA Learnership Employer Rankings" — a public document ranking employers by accountability score, with full methodology.

**Why:** This creates media value (annual rankings always get coverage), reinforces Skilved's position as the authority on SA skills market intelligence, and creates pressure on poor-performing employers to improve.

**Revenue:** Sponsorship of annual rankings event, premium placement in rankings publication, consulting for score improvement.

---

## Phase 4: Pan-African Expansion
*(Unchanged from v3.0)*

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

*(Unchanged from v3.0, with additions)*

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

*(Unchanged from v3.0)*

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
