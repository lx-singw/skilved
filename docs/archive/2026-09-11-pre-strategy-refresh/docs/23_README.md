# Skilved
### Version 2.0 | June 2026

> **Not just skilled. Skilved.**

Skilved is the AI advancement layer for South Africa's 11 million skilled trades workers. We answer the question South Africa's digital public infrastructure cannot: **what should this person do next?**

And we bring an awesome future to the present — making four capabilities real that didn't exist before.

---

## Table of Contents

- [What We Build](#what-we-build)
- [The Four Future-to-Present Capabilities](#the-four-future-to-present-capabilities)
- [Architecture](#architecture)
- [The Seventeen AI Employees](#the-seventeen-ai-employees)
- [The ATS Adapter Strategy](#the-ats-adapter-strategy)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Documents](#documents)
- [The Bigger Picture](#the-bigger-picture)
- [Contact](#contact)
- [Change Log](#change-log)

---

## What We Build

A continuously running AI agent system that discovers every apprenticeship, learnership, bursary, and artisan job in South Africa — every 4 hours, from 3 portal aggregator sources (PuffAndPass, RecentJobs, StudentRoom), expanding to 50+ sources, across all 12 trade categories and all 9 provinces. Workers get matched, notified, and have applications autonomously submitted on their behalf through targeted ATS adapters.

**The graph:** Every application, every outcome, every placement — logged to BigQuery and turned into the SA Skills Graph. The intelligence that compounds with every user.

**The intelligence layer:** National skills intelligence, outcome-verified career simulation, democratic career insider knowledge, employer accountability — all running autonomously, available to workers and government alike.

---

## The Four Future-to-Present Capabilities

### 1. Skills Pulse Dashboard — `skilved.com/skills-pulse`
The first real-time national skills intelligence platform on the African continent. Updated daily by Agent 14. Shows demand-supply gaps by trade and province, learnerships expiring unfilled, qualification ROI, TVET college performance, and 6-month predictive signals. Free, public, cited by government.

> "National Treasury currently allocates R25 billion in skills development funding based on surveys conducted 18 months ago. Skilved shows this in real time."

### 2. Career Simulation Engine
Any worker can ask "What if I get my trade test?" and receive an answer grounded in what actually happened to 47 people who were exactly where they are — verified, timestamped, real. Free. On a phone. In 30 seconds.

> "This is what McKinsey charges R500,000 for. Thandeka from Soweto gets it free on WhatsApp."

### 3. Employer Accountability Layer
Every employer gets a verified accountability score (A/B/C/D/F) based on what actually happened to candidates — placement rate, completion rate, salary on placement, candidate feedback. First time this information exists publicly in South Africa.

> "Workers can now see which employers deliver on their learnership promises — before they apply."

### 4. Collective Intelligence Layer
"3 people with your profile applied to this — 2 got interviews." The career insider knowledge that previously only flowed through elite social networks. Democratic. Verified. Free.

> "We close the gap between the child of an Eskom executive and Thandeka from Soweto — both now have the same career intelligence."

---

## Architecture

```
MyMzansi DPI (government)
  Identity → Credentials → Payments → Data Exchange
          ↓
Skilved Intelligence Layer
  Scout (ATS detect) → Analyst → Quality → Matching
  Career → Application (ATS adapters) → Outcome Tracker
  Skills Pulse → Career Simulation → Employer Accountability
  Collective Intelligence → Notification → Customer Success
          ↓
Workers get matched, applied for, guided
Employers get pre-qualified candidates + accountability scores
Government gets real-time national skills intelligence
SA Skills Graph compounds forever
```

**Stack:** Next.js · Cloud Run · Vertex AI · Gemini · Firestore · BigQuery · Redis · WhatsApp Business API · Playwright · 2captcha · Terraform · pnpm workspaces · Turborepo

---

## The Seventeen AI Employees

| # | Agent | Trigger | Job |
|---|---|---|---|
| 0 | Skills Profile | Event (profile update) | Build and enrich the Skills Passport |
| 1 | Scout | Every 4 hours | Find all SA trades opportunities + detect ATS platform |
| 2 | Analyst | Per new opportunity | Extract intelligence + ATS platform metadata |
| 3 | Quality | Per new opportunity | Publish, reject, or flag opportunity |
| 4 | Matching | Per feed request | Rank per passport + cohort intelligence |
| 5 | Career | Passport ≥ 40% | Generate career path + simulation integration |
| 6 | Application | Level 3+ permission | ATS adapters, CV generation, autonomous submission |
| 7 | Revenue | Event-driven | Upgrade prompts, pricing experiments |
| 8 | Growth | Daily | Content creation, community seeding, SEO |
| 9 | Customer Success | Always-on | Onboarding, support, simulation routing |
| 12 | Interview Coordination | Email receipt | Detect interviews, schedule, generate prep notes |
| **14** | **Skills Pulse** | **Daily 2am** | **Build and publish national skills intelligence** |
| **15** | **Career Simulation** | **Per query** | **"What if I do X?" outcome-verified simulation** |
| **16** | **Employer Accountability** | **Weekly** | **Employer scores from verified outcomes** |
| **17** | **Collective Intelligence** | **Per feed + daily** | **Cohort-based career intelligence** |
| + | Notification | Daily 7am | Personalised WhatsApp digest |
| + | Outcome Tracker | Event-driven | Follow up on applications, build the graph |

All agents run without human approval. This is not AI-assisted — it is AI-operated.

---

## The ATS Adapter Strategy

Rather than generic Playwright automation, the Application Agent uses targeted adapters for the 8 platforms covering 80%+ of SA employer opportunities.

| Platform | Employers Covered | Coverage | Sprint |
|---|---|---|---|
| Email (SMTP/Gmail) | Govt depts, NGOs, smaller employers | ~20% | 1 |
| SAP SuccessFactors | Eskom, Sasol, Vodacom, Barloworld | ~25% | 2 |
| Oracle Taleo/HCM | Transnet, Anglo American, mining houses | ~20% | 3 |
| PageUp | Murray & Roberts, WBHO, construction | ~10% | 3 |
| MERSETA Portal | All MERSETA learnerships | ~8% | 3 |
| EWSETA Portal | All EWSETA learnerships | ~5% | 3 |
| CETA Portal | All CETA learnerships | ~5% | 4 |
| Generic Playwright | Unknown portals | ~7% | 4 |

CAPTCHA solving integrated via 2captcha/CapSolver API. Never a reason to fail on a CAPTCHA.

---

## Repository Structure

```
skilved/
├── apps/
│   ├── web/              Next.js 14 PWA (user-facing)
│   ├── agents/           17 autonomous AI agents (Cloud Run)
│   │   ├── skills-profile/
│   │   ├── scout/
│   │   ├── analyst/
│   │   ├── quality/
│   │   ├── matching/
│   │   ├── career/
│   │   ├── application/       (ATS adapters + CAPTCHA solver)
│   │   ├── revenue/
│   │   ├── growth/
│   │   ├── customer-success/
│   │   ├── skills-pulse/      ★ NEW
│   │   ├── career-simulation/ ★ NEW
│   │   ├── employer-accountability/ ★ NEW
│   │   ├── collective-intelligence/ ★ NEW
│   │   ├── notification/
│   │   ├── outcome-tracker/
│   │   └── webhook-handler/
│   └── admin/            Internal operations + XPRIZE demo dashboard
├── packages/
│   ├── types/            Shared TypeScript types
│   ├── utils/            Shared utilities
│   ├── ui/               Shared component library
│   ├── config/           Shared configs
│   └── database/         Firestore + BigQuery clients
├── infrastructure/       Terraform (GCP)
├── scripts/              Setup + migration scripts
└── docs/                 Technical documentation (32 documents)
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 8+
- GCP account with billing enabled
- Firebase project
- Google AI Studio API key (Gemini)
- Meta WhatsApp Business API access
- 2captcha or CapSolver API key (for Application Agent ATS adapters)

### Setup

```bash
# Clone
git clone https://github.com/skilved/skilved.git
cd skilved

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Fill in all required values (see docs/16_Environment_Variables.md)

# Start Firebase emulators
firebase emulators:start

# Start all apps
pnpm dev
```

### Open
- Web app: http://localhost:3000
- Admin: http://localhost:3001
- Skills Pulse: http://localhost:3000/skills-pulse
- Firebase Emulator UI: http://localhost:4000

---

## Documents

| # | Document | Description | Version |
|---|---|---|---|
| 00 | Index | Master index + strategy | v5.0 |
| 01 | MVP Scope | 8-week scope, 17-agent build order | v4.0 |
| 02 | PRD | FR-01 through FR-35 | v4.0 |
| 03 | Feed Plan | Feed-first development | v2.0 |
| 04 | XPRIZE | 8-week competition plan | v5.0 |
| 05 | Pitch Deck | Investor narrative | v2.0 |
| 06 | Agent Architecture (legacy) | Original 5-agent spec | v1.0 |
| 07 | GTM | Acquisition + government strategy | v2.0 |
| 08 | Future Plans | Phase 2–4 roadmap | v4.0 |
| 09 | Financial Model | Projections with intelligence layer | v2.0 |
| 10 | Legal | POPIA + compliance | v1.0 |
| 11 | Brand | Design system | v1.0 |
| 12 | Operations | Team + processes | v1.0 |
| 13 | Directory | Full repo structure | v5.0 |
| 14 | Data Models | All schemas v3.0 | v3.0 |
| 15 | API Reference | All endpoints | v2.0 |
| 16 | Env Variables | Config reference | v2.0 |
| 17 | CI/CD | Deployment guide | v2.0 |
| 18 | Testing | Test strategy | v1.0 |
| 19 | CLAUDE.md | AI context file | v5.0 |
| 20 | Sprint Plan | 4 sprints, 8 weeks | v5.0 |
| 21 | SETA Playbook | SETA partnerships | v1.0 |
| 22 | Runbooks | Operational procedures | v4.0 |
| 23 | README | This file | v2.0 |
| 24 | AI Employees Architecture | Full spec: 17 agents | v5.0 |
| 25 | XPRIZE Narrative | Primary submission narrative | v3.0 |
| 26 | Worker Permission Model | Level 1–4, UX flows | v1.0 |
| **27** | **Skills Pulse Dashboard** | **National intelligence spec** | **v1.0 ★NEW** |
| **28** | **Career Simulation Engine** | **"What if?" simulation spec** | **v1.0 ★NEW** |
| **29** | **ATS Adapter Strategy** | **Application agent platforms** | **v1.0 ★NEW** |
| **30** | **Employer Accountability** | **Public employer ratings** | **v1.0 ★NEW** |
| **31** | **Micro-Credential System** | **Skilved Verified badges** | **v1.0 ★NEW** |
| **32** | **Collective Intelligence** | **Cohort career intelligence** | **v1.0 ★NEW** |

---

## The Bigger Picture

Skilved starts with trades. It builds toward the SA Skills Graph — the definitive record of which skills unlock which opportunities in South Africa, verified by government-grade identity and confirmed by real outcomes.

**MyMzansi tells the world who you are. Skilved tells the world what you can do — and what you should do next.**

**The Skills Pulse Dashboard tells South Africa where its skills economy is going — before it gets there.**

The ten-year vision: the intelligence layer for 800 million working-age Africans, anchored to their government-verified identity, powered by the outcome graph that compounds with every agent action.

---

## Contact

**skilved.com** · hello@skilved.com
Skills Pulse: **skilved.com/skills-pulse** · data@skilved.com

---

## Change Log

### v2.0 — June 2026
- Added "The Four Future-to-Present Capabilities" section
- Updated What We Build to include intelligence layer
- Updated Architecture diagram to include 4 new agents
- Added "The Seventeen AI Employees" table (was "The Five Agents")
- Added "The ATS Adapter Strategy" section
- Updated repository structure with 4 new agent directories
- Added 2captcha to prerequisites
- Added Skills Pulse URL to Open section
- Updated Documents table with 6 new documents
- Updated The Bigger Picture with Skills Pulse mention
- Added data@skilved.com contact for Skills Pulse

*Skilved (Pty) Ltd · Johannesburg, South Africa · June 2026*
