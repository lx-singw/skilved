# Skilved — MVP Scope
### Version 4.0 | 8-Week XPRIZE Sprint | June 2026

---

## Table of Contents

- [What We Are Building](#what-we-are-building)
- [MVP North Star](#mvp-north-star)
- [The Two Non-Negotiables](#the-two-non-negotiables)
- [The Four Future-to-Present Capabilities](#the-four-future-to-present-capabilities)
- [Scope Boundaries](#scope-boundaries)
- [The Feed — First Principles](#the-feed--first-principles)
- [The Skills Passport — First Principles](#the-skills-passport--first-principles)
- [The Intelligence Layer — First Principles](#the-intelligence-layer--first-principles-new-v40)
- [The ATS Strategy — First Principles](#the-ats-strategy--first-principles-new-v40)
- [The AI Agent Architecture](#the-ai-agent-architecture-mvp)
- [Opportunity Types](#opportunity-types-mvp)
- [User Flows](#user-flows)
- [Profile — Optional Progressive](#profile-optional-progressive)
- [Technical Stack](#technical-stack-mvp)
- [The Graph Schema](#the-graph-schema)
- [MVP Success Metrics](#mvp-success-metrics-8-week-sprint-gates)
- [MVP Timeline](#mvp-timeline-8-weeks)
- [What We Are NOT Building in MVP](#what-we-are-not-building-in-mvp)
- [Change Log](#change-log)

---

## What We Are Building

Skilved is the intelligence layer on top of South Africa's digital public infrastructure. Eight weeks. Four sprints. One XPRIZE submission.

The MVP proves three things simultaneously:
1. Agents can find every opportunity in SA and submit applications autonomously
2. A verified Skills Passport makes those agents dramatically smarter
3. The same data creates national intelligence that didn't exist before — bringing an awesome future to the present

**The MVP is not a job board. It is a Skills Passport with agents that work around the clock — and an intelligence layer that serves workers, employers, and government.**

---

## MVP North Star

> A South African trades worker opens Skilved on their phone. They see fresh, relevant opportunities immediately — no login, no gate. After viewing a few, they create a Skills Passport in 90 seconds. The passport immediately unlocks personalised matching and shows them what people with their exact profile are doing. Their first WhatsApp message from Skilved is their career plan — plus a simulation of what happens if they get their trade test. Three days later, they wake up to a message: "Applied to Eskom electrical apprenticeship on your behalf via SuccessFactors. Reference: ESK-2026-4471. Employer score: A (94/100)." They did nothing. The agents did everything.
>
> Meanwhile, at DHET, a policy official opens `skilved.com/skills-pulse` and sees that electrical trades in Limpopo have a critical shortage — 47 open opportunities, only 12 qualified candidates — and downloads this month's intelligence report for their budget submission.

---

## The Two Non-Negotiables

**The feed and the passport are the two surfaces that must be nailed. Everything else follows from them.**

**The feed** is proof that the agents are working. It is the viral distribution mechanism, the first impression, and the anonymous-to-authenticated conversion engine.

**The passport** is the moat. It is what every agent reads from. Without a rich passport, the Application Agent is just a better CV sender. With it, it knows exactly which roles a worker would pass a technical screen for — and submits to the right ATS platform autonomously.

---

## The Four Future-to-Present Capabilities

**These are new in v4.0. They are what separates Skilved from "better job board" and makes it a category change.**

### 1. Skills Pulse Dashboard — National Intelligence (Sprint 1 → Sprint 4)
`skilved.com/skills-pulse` — the first real-time national skills intelligence platform on the African continent. Updated daily by Agent 14. Shows demand-supply gaps, expiring learnerships, qualification ROI, TVET college performance. Free, public, cited by government.

**Sprint 1:** Static page with live opportunity counts (1 day of work, immediate XPRIZE signal).
**Sprint 4:** Fully automated with Gemini intelligence narratives.

### 2. Career Simulation Engine (Sprint 3 → Sprint 4)
"What if I get my trade test?" — answered in 30 seconds with verified outcome data. Agent 15.

**Sprint 3:** Opportunity-based simulation ("you'd match 12 more opportunities"). No outcome data needed.
**Sprint 4:** Outcome-verified ("based on 47 electricians who got their trade test, average salary jumped R3,900/month").

### 3. Employer Accountability Layer (Sprint 3 → Sprint 4)
Every employer gets a verified accountability score (A/B/C/D/F) based on what actually happened to candidates. Agent 16. First time this information exists publicly in SA.

**Sprint 3:** v1 with early outcome data, labelled.
**Sprint 4:** Statistically significant, public.

### 4. Collective Intelligence Layer (Sprint 2 → Sprint 4)
"3 people with your profile applied to this — 2 got interviews." The career insider knowledge that previously only flowed through elite networks. Agent 17. Democratic.

**Sprint 2:** "X people with your profile viewed this" (activity-based).
**Sprint 4:** Full outcome-verified cohort intelligence.

---

## Scope Boundaries

### In Scope (8 weeks, 4 sprints)

**Core product:**
- Public opportunity feed — no login, full details, direct apply, WhatsApp share
- Skills Profile Agent — builds and enriches passport
- Skills Passport — public profile URL, extracted skills, CV export
- Matching Agent — authenticated users, passport-anchored
- Career Agent — triggers at 40% completeness
- Application Agent v1 — email applications + SuccessFactors adapter
- Application Agent v2 — Oracle Taleo + PageUp + MERSETA + EWSETA adapters
- CAPTCHA solver integration (2captcha/CapSolver)
- Revenue Agent — upgrade prompts, A/B experiments
- Growth Agent — daily content, community seeding, SEO
- Customer Success Agent — onboarding + support + simulation routing
- WhatsApp digest — authenticated users, daily 7am
- Outcome tracking — Day 3, 14, 30 follow-ups
- Permission model Level 1–4 with POPIA consent
- Employer referral fees — Day 16 target (first revenue)
- Worker Premium subscriptions — R200–R500/month
- Portal aggregator pipeline (PuffAndPass, RecentJobs, StudentRoom) — basic
- Admin autonomy dashboard — for XPRIZE judges
- PWA — installable on Android + iOS

**Intelligence layer (NEW v4.0):**
- Skills Pulse Dashboard (Agent 14) — Sprint 1 static → Sprint 4 live
- Career Simulation Engine (Agent 15) — Sprint 3 → Sprint 4
- Employer Accountability Layer (Agent 16) — Sprint 3 → Sprint 4
- Collective Intelligence Layer (Agent 17) — Sprint 2 → Sprint 4
- Micro-Credential System — Sprint 2

**ATS adapter strategy (NEW v4.0):**
- ATS platform detection in Analyst Agent (Sprint 1)
- Email submitter (Sprint 1)
- SuccessFactors adapter + CAPTCHA solver (Sprint 2)
- Oracle Taleo + PageUp + MERSETA + EWSETA adapters (Sprint 3)
- CETA portal + Generic Playwright (Sprint 4)

### Out of Scope (MVP — deferred)
- MyMzansi credential API integration (Phase 2, Month 4+)
- Full employer SaaS dashboard (Phase 2)
- SETA management portal (Phase 2)
- Mobile app React Native (Phase 2)
- Multi-language isiZulu/Afrikaans (Phase 2)
- Pan-African expansion (Phase 3)
- Skills Graph public API (Phase 3)
- Reputation Agent / Credential Issuance Agent (Phase 2)
- Gig Agent (Phase 2/3)

---

## The Feed — First Principles

### Anonymous Feed Design Principles

1. **Zero friction.** No signup wall. Full details. Direct apply.
2. **Freshness signal.** "Found 2 hours ago by Skilved" — non-negotiable.
3. **Specificity over volume.** 20 highly relevant beats 200 generic.
4. **Shareable by default.** WhatsApp share one tap.
5. **The deliberate ceiling.** Anonymous users get a great feed. They do not get matching, cohort intelligence, career simulation, or agents. That contrast IS the conversion hook.
6. **Employer accountability visible anonymously.** Employer score (A/B/C/D/F) shown on cards for all users — no login needed to see this.

### The Conversion Trigger (Updated v4.0)
After 3 views:
> "Skilved found 47 more electrical opportunities. Create your Skills Passport to see what 12 other electricians in Gauteng are doing — and get matched automatically."

After sharing:
> "Shared that one? Create your passport to see your career simulation — what happens if you get your trade test — and get daily matches on WhatsApp."

### Feed Information Architecture

```
Feed
├── Filter bar (Trade | Province | Opportunity type | Salary range)
├── Opportunity cards
│   ├── Title + company/organisation
│   ├── Trade badge + province tag
│   ├── Opportunity type pill
│   ├── Salary / stipend
│   ├── Closing date
│   ├── "Found X hours ago by Skilved agent"
│   ├── ★ Employer Score: A (94/100) [authenticated: full; anon: grade only]
│   ├── 👥 "3 people like you applied · 2 got interviews" [authenticated only]
│   ├── Share button (WhatsApp)
│   └── Apply / View details CTA
├── Cohort insight banner (authenticated, once per session)
├── Soft personalisation prompt (after 3 views — anonymous)
└── Load more (infinite scroll)
```

---

## The Skills Passport — First Principles

The passport is the most important product Skilved will ever build. Ships Sprint 2.

### Passport Design Principles

1. **Not a form. An agent builds it.** Skills Profile Agent extracts structured skills from free text.
2. **Completeness gates capability.** Each level unlocks a specific named agent capability.
3. **Portable by design.** `skilved.com/[username]` — designed to be sent to a recruiter.
4. **Intelligence layer reads it.** Career Simulation Agent and Collective Intelligence Agent read passport to build cohort and simulate futures.
5. **It compounds.** Every outcome makes the passport richer and every agent smarter.

### Passport Completeness Levels

| Level | Score | What Unlocks |
|---|---|---|
| Starter | 0–20% | Basic feed access — same as anonymous |
| Active | 21–40% | **Matching Agent** — match scores + explanations |
| Strong | 41–60% | **Career Agent** — career plan + **Career Simulation Engine** |
| Skilved | 61–80% | **Application Agent Level 2** — agent drafts CV + cover letter |
| Verified | 81–100% | **Application Agent Level 3** — agent applies autonomously |

---

## The Intelligence Layer — First Principles — NEW v4.0

### Why the Intelligence Layer Exists

The Skills Passport and Application Agent are the product. The intelligence layer is the future being brought to the present.

Most competitors could eventually build a better feed or application agent. Nobody can replicate:
- The SA Skills Graph (outcome-verified, compounding)
- The Skills Pulse Dashboard (national intelligence from verified data)
- The Career Simulation Engine (outcome-verified "what if" queries)
- The Employer Accountability Layer (verified scores nobody else has)
- The Collective Intelligence Layer (democratised career insider knowledge)

These are the moat. These are the XPRIZE differentiators. These are why Skilved wins.

### Intelligence Layer Design Principles

1. **Data honesty.** Every intelligence display shows sample size and confidence level. Never show a number without saying what it's based on.

2. **Progressive value.** Each intelligence feature has a v1 that works with zero outcome data (opportunity-based) and a v2 that gets richer with every verified outcome.

3. **Public by default.** Skills Pulse Dashboard is public — no login. Employer scores are public. This builds trust and drives distribution.

4. **Democratic.** Collective Intelligence gives every worker the insider knowledge that previously only flowed through elite networks. This is the equity argument.

5. **Autonomous.** All four intelligence agents run without human intervention. `human_approvals_required: 0` always.

---

## The ATS Strategy — First Principles — NEW v4.0

### The Core Insight
You're not facing 50 unique application systems. You're facing 8 underlying platforms covering 80%+ of SA opportunities.

### ATS Detection First
Analyst Agent detects the ATS platform during opportunity extraction. Application Agent never discovers it at runtime. This makes routing fast and BigQuery logs clean.

### Build Order
1. **Sprint 1:** ATS detection in Analyst (all opportunities tagged from day 1)
2. **Sprint 2:** Email submitter + SuccessFactors (Eskom, Sasol) + CAPTCHA solver
3. **Sprint 3:** Oracle Taleo (Transnet, mining) + PageUp (construction) + MERSETA + EWSETA portals
4. **Sprint 4:** CETA portal + Generic Playwright fallback

### Coverage by Sprint 4
~95% of SA trades opportunities can be submitted autonomously by Application Agent.

### CAPTCHA Is Not an Excuse
Every ATS adapter integrates CAPTCHA solver from day 1. Cost: ~R0.18/solve. Never a reason to fail on a CAPTCHA.

---

## The AI Agent Architecture (MVP)

### The 17 AI Employees — Build Order (8 weeks, 4 sprints)

| # | Agent | Sprint | Core Job | Depends On |
|---|---|---|---|---|
| 0 | **Skills Profile** | 2 | Build + enrich passport | User provides data |
| 1 | **Scout** | 1 | Find every SA trades opportunity + detect ATS platform | Nothing |
| 2 | **Analyst** | 1 | Extract intelligence + ATS platform metadata | Scout |
| 3 | **Quality** | 1 | Filter scams, duplicates, expired | Analyst |
| 4 | **Matching** | 2 | Rank per passport + cohort signals | Skills Passport |
| 5 | **Career** | 3 | Map career path + simulation integration | Passport ≥ 40% |
| 6 | **Application** | 3–4 | ATS adapters, autonomous submission | Passport ≥ 80%, Level 3+ |
| 7 | **Revenue** | 4 | Upgrade prompts, pricing experiments | User behaviour events |
| 8 | **Growth** | 4 | Content, community, SEO | Scout |
| 9 | **Customer Success** | 3 | Onboarding, support, simulation routing | Auth + WhatsApp |
| **14** | **Skills Pulse** | **1→4** | **National intelligence dashboard** | **BigQuery** |
| **15** | **Career Simulation** | **3→4** | **"What if I do X?" queries** | **Passport + BigQuery** |
| **16** | **Employer Accountability** | **3→4** | **Employer scores from outcomes** | **Outcomes data** |
| **17** | **Collective Intelligence** | **2→4** | **Cohort career intelligence** | **Passport + events** |
| + | **Notification** | 2 | Daily digest | Passport + Matching |
| + | **Outcome Tracker** | 2 | Follow up on applications | Application events |

### The Critical Architecture Dependency
```
Skills Passport (Agent 0)
    ↓ read by
Matching Agent       → ranked feed
Career Agent         → accurate path
Application Agent    → targeted applications via ATS adapters
Notification         → relevant digest
Career Simulation    → outcome-verified "what if" answers
Collective Intel.    → cohort-based career intelligence

Intelligence Agents (14, 16, 17) read from THE GRAPH (BigQuery outcomes)
    ↓
Skills Pulse         → national intelligence from all data combined
```

---

## Opportunity Types (MVP)

| Type | Definition | Source |
|---|---|---|
| Apprenticeship | Formal trade apprenticeship with employer | SETA portals, employer sites |
| Learnership | NQF-aligned structured learning + work | SETA portals |
| Bursary | Financial study assistance | Corporate CSI, government |
| Job | Direct employment (artisan, technician) | Job boards, employer sites |
| Trade test | Upcoming trade test registration windows | NAMB, SETA portals |
| Short course | Funded upskilling (< 6 months) | SETA discretionary grants |

---

## User Flows

### Flow 1: Anonymous Browse → Apply
```
Land on feed
→ See opportunity cards with employer scores visible
→ Click opportunity card
→ Read full details
→ Click "Apply"
→ Redirect to source OR in-app application
→ "Track your application?" prompt (soft signup trigger)
```

### Flow 2: Anonymous → Account Creation (Updated v4.0)
```
Browse 3+ opportunities
→ See soft personalisation prompt (mentions cohort intelligence)
→ "Get Skilved" CTA
→ Quick profile: Trade + Province + Qualification (3 fields)
→ Optional: WhatsApp number
→ Immediately see personalised feed with cohort intelligence
→ "See what people like you are applying for"
→ Career Simulation prompt at 40% passport
```

### Flow 3: Returning User (Logged In)
```
Land on personalised feed
→ "New since your last visit: 12 opportunities"
→ Opportunity cards ranked by match score + cohort intelligence
→ "Skilved found this 2 hours ago — 3 people like you applied, 2 got interviews"
```

### Flow 4: Career Simulation (NEW v4.0)
```
User profile reaches 40% (Strong level)
→ Career Agent fires: "Your career plan is ready"
→ WhatsApp: "Getting your trade test would unlock R3,900/month increase
              — based on 47 real verified outcomes"
→ User taps "Show me how" → Career Simulation detail page
→ User taps "Find trade test registrations" → Aligned opportunities
```

---

## Profile (Optional, Progressive)

### Profile Completion Levels

| Level | Fields | Unlock |
|---|---|---|
| Starter (20%) | Trade + Province | Basic personalisation |
| Active (40%) | + Qualification + Experience | Matching + Cohort Intelligence + Career Simulation |
| Strong (60%) | + Certificates/NQF + Status | Career Agent + Application autofill |
| Skilved (80%) | + Work history + References | Employer search + "Skilved" badge |
| Verified (100%) | + MyMzansi link (Phase 2) | Verified badge + premium employer access |

### What a Skilved Profile Contains (MVP)

- Trade category (primary + secondary)
- Province
- Qualification level
- Certificates (self-reported)
- Work history (free text, AI-extracted skills)
- Employment status
- Opportunity preferences
- WhatsApp number (optional)
- Application history
- **Micro-credentials (NEW v4.0)**
- **Cohort intelligence section (NEW v4.0)**
- Career plan (from Career Agent)

---

## Technical Stack (MVP)

### Frontend
- **Framework:** Next.js 14 (App Router) — PWA
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Hosting:** Vercel

### Backend
- **API:** Next.js API routes + tRPC
- **Database:** Firestore + BigQuery
- **Search:** Vertex AI Search
- **Analytics:** BigQuery
- **Auth:** Firebase Auth
- **Messaging:** WhatsApp Business API (Meta)

### AI / Agents
- **Gemini:** Quality, extraction, matching explanations, career reasoning, CV/cover letter, intelligence narratives
- **Vertex AI Search:** Opportunity indexing
- **Vertex AI Ranking:** Personalised feed ranking
- **Cloud Scheduler:** All scheduled agents
- **Cloud Run:** All agent execution
- **Cloud Pub/Sub:** Event-driven agent communication
- **Playwright:** ATS web form automation
- **2captcha/CapSolver:** CAPTCHA solving for ATS adapters

### Infrastructure
- **GCP Project:** Primary cloud platform (XPRIZE requirement)
- **Cloud Run:** All agent workloads
- **Cloud Storage:** Credentials, QR codes, government reports
- **Cloud Monitoring:** Agent health + alerts
- **BigQuery:** The graph — every event, every outcome, all intelligence

---

## The Graph Schema

Every user interaction logged to BigQuery from day one.

```sql
-- Core tables (MVP)
opportunities (id, title, type, trade, province, salary, deadline, source,
               quality_score, ats_platform, employer_accountability_score,
               discovered_at)

users (id, trade, province, qual_level, created_at, source_channel)

events (user_id, opportunity_id, event_type, timestamp, session_id)

outcomes (user_id, opportunity_id, outcome_type, reported_at)

-- NEW v4.0
application_submissions (id, user_id, opp_id, ats_platform, success,
                         captcha_encountered, captcha_solved, duration_ms)

skills_pulse_snapshots (date, national_overview, gaps, expiry_risks,
                        qualification_roi, tvet_performance, gemini_intelligence)

employer_accountability_scores (employer_id, score, grade, placement_rate,
                                completion_rate, sample_size, calculated_at)

cohort_snapshots (cohort_key, cohort_size, top_opportunities, computed_at)

career_simulations (user_id, query_type, cohort_size, salary_delta,
                    opportunity_delta, confidence, simulated_at)

micro_credential_events (user_id, credential_type, event_type, event_at)
```

---

## MVP Success Metrics (8-Week Sprint Gates)

### Sprint 1 Gate (End of Week 2)
- [ ] Feed loads < 1.5s on Samsung Galaxy A52 + SA 4G
- [ ] 200+ real opportunities live
- [ ] All 12 trade + 9 province filters working
- [ ] Full detail view + apply without login
- [ ] "Found X hours ago" freshness badge
- [ ] WhatsApp share working
- [ ] Scout + Analyst (with ATS detection) + Quality agents autonomous
- [ ] `human_approvals_required: 0` in all BigQuery agent runs
- [ ] **Skills Pulse Dashboard v1 live at `skilved.com/skills-pulse`**
- [ ] Zero scam listings

### Sprint 2 Gate (End of Week 4)
- [ ] Passport onboarding < 90 seconds
- [ ] Skills Profile Agent extracting skills from free text
- [ ] Matching Agent live for authenticated users
- [ ] **Collective Intelligence Layer v1 on opportunity cards**
- [ ] **Micro-credentials issuing (Active Applicant + Profile Complete)**
- [ ] **Agent Trace Visualizer live**
- [ ] Public profile URL live
- [ ] **First employer referral fee (FIRST REVENUE — Day 16 target)**
- [ ] 500+ registered users, 5+ paying employers

### Sprint 3 Gate (End of Week 6)
- [ ] Career Agent generating plans on passport ≥ 40%
- [ ] **Career Simulation Engine answering "what if" queries**
- [ ] **Application Agent submitted ≥ 10 real applications**
- [ ] **Application Agent using SuccessFactors adapter on real submission**
- [ ] **CAPTCHA solver working**
- [ ] **Employer Accountability scores on opportunity cards**
- [ ] Permission Level 3 consent fully captured
- [ ] Worker Premium billing live (R200/month)
- [ ] 2,000+ registered users, 30+ employers/SETAs
- [ ] `human_approvals_required: 0` all agents

### Sprint 4 Gate — XPRIZE Submission
- [ ] All 17 agents running autonomously
- [ ] Application Agent v2 (Taleo + PageUp + MERSETA + EWSETA) in production
- [ ] **Skills Pulse Dashboard v2 — fully automated, all sections, Gemini intelligence**
- [ ] **Career Simulation Engine v2 — outcome-verified**
- [ ] **Employer Accountability scores — statistically significant**
- [ ] **Collective Intelligence v3 — full weekly digest addition**
- [ ] **ATS adapter breakdown visible in admin (6 platforms)**
- [ ] Revenue + Growth agents live
- [ ] Permission Level 4 live
- [ ] `human_approvals_required: 0` full 8-week BigQuery view
- [ ] 5,000+ users, 200+ Premium, 50+ employers
- [ ] R300,000+ documented revenue
- [ ] 200+ outcomes in graph
- [ ] Demo video recorded (5 minutes)
- [ ] **SUBMIT**

---

## MVP Timeline (8 Weeks)

| Week | Milestone |
|---|---|
| 1 | Scout (ATS detection) + Analyst + Quality live. Feed live. 200+ opps. Skills Pulse v1 static. |
| 2 | Feed hardened. All 12 trades + 9 provinces. Mobile < 1.5s. Anonymous conversion hook. |
| 3 | Auth live. Skills Profile Agent v1. Passport onboarding. Matching Agent. Collective Intelligence v1. Micro-credentials. |
| 4 | Passport enrichment. **First revenue (Day 16)**. Notification digest. Outcome tracker. Agent Trace Visualizer. |
| 5 | Career Agent live. Customer Success Agent. Permission Level 1–3. Career Simulation v1. |
| 6 | **Application Agent v1 (email + SuccessFactors + CAPTCHA solver)**. **First autonomous application**. Employer Accountability v1. Worker Premium billing. |
| 7 | Application Agent v2 (Taleo + PageUp + MERSETA + EWSETA). Revenue Agent. Level 4. Skills Pulse v2. |
| 8 | Growth Agent. Career Simulation v2. Collective Intelligence v3. XPRIZE metrics. Demo video. **SUBMIT**. |

---

## What We Are NOT Building in MVP

- MyMzansi credential API integration (Phase 2)
- Full employer SaaS dashboard (Phase 2)
- SETA management portal (Phase 2)
- Mobile app React Native (Phase 2)
- Multi-language isiZulu/Afrikaans (Phase 2)
- Reputation Agent (Phase 2 — schema seeded Sprint 2)
- Credential Issuance Agent (Phase 2)
- Gig Agent (Phase 2/3)
- Pan-African expansion (Phase 3)
- Skills Graph public API (Phase 3)
- CETA portal adapter if Sprint 4 is tight (Phase 2)
- W3C Verifiable Credentials format (Phase 2 — schema compatible)
- Community activity feed (Phase 2)
- Voice note passport intake (Phase 2)

---

## Change Log

### v4.0 — June 2026
- Added "The Four Future-to-Present Capabilities" section
- Added "The Intelligence Layer — First Principles" section
- Added "The ATS Strategy — First Principles" section
- Updated MVP North Star to include Skills Pulse and Employer Accountability
- Updated feed IA with employer score and cohort intelligence on cards
- Updated conversion triggers to mention cohort intelligence
- Updated profile levels with career simulation unlock at Strong (60%)
- Updated technical stack with Playwright and CAPTCHA solver
- Updated graph schema with 6 new tables
- Updated all 4 sprint gates with intelligence layer deliverables
- Updated MVP timeline (8 weeks) with new milestones
- Updated Agents table from 13 to 17 agents
- Added Persona 5 context (Government Policy Official) to North Star

### v3.0 — June 2026
- Added Skills Passport as second non-negotiable
- Added 9 AI employees

*Document version 4.0 — June 2026*
*8 weeks. 4 sprints. Skills Passport is the moat. Intelligence layer brings the future to the present.*
