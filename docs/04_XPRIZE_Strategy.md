# Skilved — XPRIZE Strategy
### Build with Gemini XPRIZE | 8-Week Execution Plan | Version 5.0 | June 2026

---

## Table of Contents

- [The Prize](#the-prize)
- [Why Skilved Wins](#why-skilved-wins)
- [The "Bringing the Future to the Present" Frame](#the-bringing-the-future-to-the-present-frame)
- [Judging Criteria — Skilved's Score](#judging-criteria--skilvedss-score)
- [8-Week Execution Timeline](#8-week-execution-timeline)
- [GCP Stack — Depth of Integration](#gcp-stack--depth-of-integration)
- [Risk Register](#risk-register)
- [The Judge Narrative](#the-judge-narrative)
- [The 10-Year Story](#the-10-year-story-beyond-job-creation)
- [Pre-Submission Checklist](#pre-submission-checklist)
- [Change Log](#change-log)

---

## The Prize

$2,000,000 total prizes. $500,000 for first place.
Category: **Entrepreneurship & Job Creation**
Requirements: Real business, real users, real revenue. AI agents run operations. Category impact at scale.

---

## Why Skilved Wins

Most XPRIZE submissions will be polished demos with synthetic users and aspirational revenue. Skilved enters with structural advantages none of them can replicate:

**1. A real national pain.**
32% youth unemployment in South Africa. 500K+ trades workers actively seeking opportunities. 21 government skills agencies funding thousands of learnerships that expire unfilled every year. This is not a manufactured problem.

**2. A real infrastructure tailwind.**
MyMzansi is live government DPI. Skilved is the private-sector intelligence layer on top of it. No other submission has sovereign government infrastructure as their foundation.

**3. Seventeen AI employees running the entire business.**
Scout, Analyst, Matching, Career, Application, Revenue, Growth, Customer Success, Interview Coordination — plus Skills Pulse, Career Simulation, Employer Accountability, and Collective Intelligence agents. Zero human intervention. This is not an LLM wrapper — this is a company operated by AI.

**4. The fundamental reframe.**
Most teams will build a job board with a chatbot and call it AI. Skilved inverts the entire paradigm: workers no longer search for opportunities. Opportunities hunt workers — through agents. The user is the exception. The agent is the default.

**5. The ATS adapter strategy.**
Application Agent targets the 8 underlying platforms covering 80%+ of SA employer opportunities — SuccessFactors, Oracle Taleo, PageUp, plus 3 SETA portal adapters. Named employers, real submissions, verifiable in BigQuery.

**6. A trust escalation model.**
Level 1 to 4 permission model — intentional architecture for population-scale AI autonomy. Not a limitation. The design that makes full autonomy achievable.

**7. A zero-to-one data asset.**
The outcome graph is not replicable. After 90 days, it has data no competitor can buy.

**8. Bringing the future to the present — four new capabilities.**
The Skills Pulse Dashboard, Career Simulation Engine, Employer Accountability Layer, and Collective Intelligence Layer make four things possible today that the world thought were years away. See next section.

**The sentence judges will remember:**
> "LinkedIn helps people present themselves to opportunities. Skilved helps opportunities find people."

**The sentence that wins first place:**
> "We didn't optimise the existing system. We changed what information is available, to whom, and when — bringing an economic future to South Africa's workers that was previously only accessible to a privileged few."

---

## The "Bringing the Future to the Present" Frame

This is the XPRIZE's core question: does your submission make something possible today that the world thought was 5–10 years away?

Most submissions will show AI making existing processes faster or cheaper. That is optimisation, not the future. Skilved makes four genuinely new capabilities real:

### Future 1: Real-Time National Skills Intelligence

**What was impossible before:** South Africa allocates R25 billion in skills development funding annually based on surveys conducted 18 months ago. Thousands of learnerships expire unfilled because no one has real-time intelligence about demand vs. supply.

**What Skilved makes real now:** The Skills Pulse Dashboard at `skilved.com/skills-pulse` — the first real-time national skills intelligence platform on the African continent. Updated daily from verified outcomes. Showing which trades are in shortage, which learnerships are expiring unfilled, which qualifications have the best ROI. Free, public, cited by government.

**The judge moment:** "No government, no research institution, no management consultancy has this. It exists nowhere on the continent. And Skilved built it as a byproduct of helping individual workers — the national intelligence emerges from the individual data."

### Future 2: Outcome-Verified Career Simulation

**What was impossible before:** Career guidance in South Africa is either generic ("get more qualifications") or anecdotal ("my uncle said..."). McKinsey charges R500,000 for the workforce planning analysis that contains real career path intelligence.

**What Skilved makes real now:** Any worker can ask "what happens to my career if I get my Wireman's licence?" and receive an answer grounded in what actually happened to 47 people who were exactly where they are — verified, timestamped, real. Free. On a phone. In 30 seconds.

**The judge moment:** "This is what McKinsey charges half a million rand for. Thandeka from Soweto can get it for free, right now, in a WhatsApp message."

### Future 3: Democratic Career Insider Knowledge

**What was impossible before:** The career intelligence that flows through elite social networks — which opportunities actually lead somewhere, which employers are worth applying to, what are people like you actually doing — is invisible to workers without those connections.

**What Skilved makes real now:** The Collective Intelligence Layer surfaces this intelligence from verified outcome data and makes it available to every worker. "3 N3 electricians in Gauteng applied to this opportunity. 2 got interviews. 1 got placed." This is the information the child of an Eskom executive has always had. Now Thandeka from Soweto has it too.

**The judge moment:** "Economic equity isn't just about equal access to opportunities. It's about equal access to information about opportunities. Skilved closes that gap."

### Future 4: Employer Accountability at Scale

**What was impossible before:** Workers have no way to know if a learnership at Company X actually leads anywhere. Exploitative learnerships — collecting SETA funding, paying inadequate stipends, delivering no real training — face no market consequences because candidates have no information.

**What Skilved makes real now:** Every employer gets a verified accountability score based on what actually happened to candidates. Workers see this before they apply. Employers who score poorly lose candidate flow. Good employers attract more. For the first time, the SA learnership market has accountability driven by verified data, not regulation alone.

**The judge moment:** "This is a systemic change. Not a product feature. The SA learnership market is more accountable today than it was before Skilved."

---

## Judging Criteria — Skilved's Score

### Criterion 1: Business Viability

**Target score: 90/100**

**What judges assess:** Real users acquired, real revenue generated, sustainable business model.

**Evidence Skilved provides:**
- Screenshots of PayFast transactions (employer referral fees, Day 16+)
- Named paying employers with invoice amounts
- SETA letters of intent or signed contracts
- Worker Premium billing evidence (R200–R500/month)
- 5,000+ registered users with Skills Passports
- 50+ paying employers/SETAs

**Revenue model (90-day):**
```
Month 1: R11,500
Month 2: R83,000
Month 3: R290,000
Total 90 days: ~R384,500
```

**Action this week:** Close 2 employers at even R500 introductory pricing. Get a signed letter of intent from one SETA. These are relationship calls, not engineering tasks.

**Projected score: 90/100**

---

### Criterion 2: AI-Native Operations

**Target score: 96/100**

**What judges assess:** AI runs key decisions live in production. Not AI-assisted — AI-operated.

**The 17 autonomous agents Skilved runs:**

| Agent | What It Decides Autonomously |
|---|---|
| 0. Skills Profile | Extract, structure, enrich the Skills Passport |
| 1. Scout | Which opportunities to ingest from 3 portal sources (PuffAndPass, RecentJobs, StudentRoom) every 4 hours, expanding to 50+ |
| 2. Analyst | What structured intelligence + ATS platform for every opportunity |
| 3. Matching | How to rank opportunities per user with cohort intelligence |
| 4. Career | What career path to recommend, which steps are next |
| 5. Application | Which ATS adapter to use, CV generation, autonomous submission |
| 6. Revenue | When to prompt upgrades, what price, which experiments |
| 7. Growth | Daily content, community seeding, SEO |
| 8. Customer Success | Every onboarding message, every support query |
| 12. Interview Coordination | Detect interviews, schedule, generate prep notes |
| 14. Skills Pulse | Build and publish national skills intelligence daily |
| 15. Career Simulation | Answer "what if I do X?" with outcome-verified data |
| 16. Employer Accountability | Calculate and publish employer scores from outcomes |
| 17. Collective Intelligence | Surface cohort-based career intelligence per user |

**The XPRIZE demonstration script (updated):**

> "Here is the agent dashboard. Every row is an autonomous decision made by Skilved's AI employees in the last 24 hours — no human made any of these choices.
>
> Scout discovered 312 opportunities from 50 sources.
> Analyst extracted intelligence and detected ATS platforms for all 312.
> Application Agent submitted 34 applications — 18 via SuccessFactors, 10 via Oracle Taleo, 6 via email.
> Skills Pulse Agent updated the national skills dashboard with fresh intelligence.
> Career Simulation Agent answered 47 'what if' career queries.
> Employer Accountability Agent recalculated scores for 23 employers.
> Collective Intelligence Agent surfaced cohort data on 891 feed loads.
>
> Total autonomous decisions: 6,247.
> Human approvals required: 0.
> Workers protected from low-scoring employers: 3.
> Workers who saw their career simulation and immediately applied: 12.
>
> This is not AI-assisted. This is a business operated by AI — that brings an awesome future to the present."

**Projected score: 96/100**

---

### Criterion 3: Category Impact

**Target score: 97/100**

**Layer 1 — Immediate (Day 90):**
- 5,000 SA trades workers with daily AI-matched opportunity access
- 200+ measurable placements
- National skills intelligence dashboard live and cited
- First employer accountability scores published
- Collective intelligence giving workers access to previously exclusive knowledge

**Layer 2 — Medium-term (Year 1–3):**
- MyMzansi credential integration — government-grade verified Skills Passports
- Skills Pulse Dashboard cited in government budget submissions
- Employer accountability scores changing learnership quality industry-wide
- Career Simulation Engine informing thousands of career decisions monthly

**Layer 3 — Long-term (Year 3–10):**
- SA Skills Graph: definitive record of which skills unlock which opportunities
- National Treasury and DPSA using Skilved data for skills policy
- Pan-African expansion: same model for Kenya, Nigeria, Rwanda

**The category-redefining claim:**

> "Every job board in history has asked employers to post opportunities and workers to search for them. Skilved inverts this. But more than that — Skilved builds the intelligence layer that the entire SA skills economy has never had. Workers can see their futures. Employers are held accountable. Government can see where to invest. This is not optimisation. This is a category change."

**Projected score: 97/100**

---

## 8-Week Execution Timeline

**Week 0 (Pre-Sprint):**
- Close 2 pilot employers (even R500 introductory pricing) — phone calls this week
- Email MERSETA + EWSETA with data-first pitch
- Register Skilved (Pty) Ltd + POPIA Information Officer
- Apply for WhatsApp Business API (takes 1–7 days — do today)
- Record rough demo video of vision — forces articulation before build

---

### Sprint 1 — Weeks 1–2: The Feed + First Intelligence

**Must-haves:**
- Scout + Analyst (with ATS detection) + Quality agents live
- Feed live at skilved.com — 200+ opportunities, all 12 trades, all 9 provinces
- Full detail view + direct apply — no login required
- "Found X hours ago" freshness on every card
- WhatsApp share live
- Anonymous ceiling locked
- **Skills Pulse Dashboard v1** — static page with live opportunity counts, trade × province distribution
- BigQuery `agent_autonomy` view live from Day 1 with `human_approvals_required: 0`
- ATS platform stored on every opportunity from day 1

**Gate:** Feed loads < 1.5s, 200+ real opportunities, ATS detection running, Skills Pulse page live

---

### Sprint 2 — Weeks 3–4: The Skills Passport + Collective Intelligence

**Must-haves:**
- Skills Profile Agent v1 live — passport onboarding < 90 seconds
- Matching Agent live (authenticated users only)
- **Collective Intelligence Layer v1** — "X people with your profile viewed this" on opportunity cards
- **Micro-credentials live** — Skilved Verified: Active Applicant and Profile Complete
- **Agent Trace Visualizer live** — full chain for any user_id, XPRIZE demo artifact
- Public profile URL live: `skilved.com/[username]`
- Notification digest sending
- Outcome tracker Day 3 follow-up
- **First employer referral fee received — Day 16 target (FIRST REVENUE)**
- 500+ registered users, 5+ paying employers

**Gate:** Passport live, matching running, collective intelligence on cards, first revenue, Trace Visualizer working

---

### Sprint 3 — Weeks 5–6: Agents + Future Capabilities

**Must-haves:**
- Career Agent live (triggers at 40% passport completeness)
- **Career Simulation Engine v1** (opportunity-based, no outcome data needed)
- Customer Success Agent onboarding sequence live
- **Application Agent v1** (email + SuccessFactors adapter)
- **First real autonomous application submitted in production**
- **Employer Accountability Layer v1** (scores based on early outcome data)
- Permission Level 1+2+3 with POPIA consent
- Worker Premium subscriptions billing live (R200/month)
- 2,000+ users, 30+ paying employers/SETAs

**Gate:** Application Agent submitting real applications, Career Simulation answering queries, employer scores on cards

---

### Sprint 4 — Weeks 7–8: Scale + Full Intelligence + Submission

**Must-haves:**
- Application Agent v2 (Oracle Taleo + PageUp + MERSETA + EWSETA adapters)
- Revenue Agent + Growth Agent live
- **Skills Pulse Dashboard v2** — fully automated, updating daily, Gemini intelligence
- **Career Simulation Engine v2** — outcome-verified with real graph data
- **Collective Intelligence Layer v3** — full outcome-backed cohort intelligence
- Agent 14, 15, 16, 17 all running autonomously
- Agent coordination layer (`agent_context`) live
- Permission Level 4 live
- All 17 agents: `human_approvals_required: 0` across full BigQuery view
- 5,000+ registered users with Skills Passports
- 200+ Premium subscribers
- 50+ paying employers/SETAs
- R300,000+ documented revenue
- 200+ outcomes in graph
- Demo video recorded (5 minutes)
- **SUBMIT**

**Submission package:**
1. Business metrics — users, revenue, placements, Premium subscribers
2. Agent autonomy dashboard — live, `human_approvals_required: 0`
3. Skills Passport → matching → career plan → autonomous application chain demo
4. Skills Pulse Dashboard — national intelligence live
5. Career Simulation Engine — live "what if" query in demo
6. Employer accountability scores — real scores on real opportunities
7. Collective intelligence — cohort data on live feed
8. Permission model progression data (Level 1 → Level 4)
9. Category impact narrative — 90 days → 10 years
10. GCP integration depth documentation

---

## GCP Stack — Depth of Integration

| GCP Service | Agents That Depend on It | Why Not Cosmetic |
|---|---|---|
| Vertex AI Search | Scout, Matching | Cannot index or retrieve opportunities without it |
| Vertex AI Ranking | Matching | Feed ranking collapses without it |
| Gemini API | 12 of 17 agents | Core reasoning for every intelligent decision |
| Document AI | Skills Profile | Cannot extract skills from certificate PDFs |
| Cloud Run | All 17 agents | Every agent executes here |
| Cloud Scheduler | Scout, Notification, Growth, Skills Pulse | All scheduled agents stop |
| Cloud Pub/Sub | Scout→Analyst→Quality→Matching pipeline | Agent pipeline collapses |
| BigQuery | All agents (the graph) | Graph stops building; model retraining fails |
| Firestore | All agents (operational data) | No passport = no agents |
| Cloud Memorystore (Redis) | Matching, Collective Intelligence | Feed latency 10×; cohort cache lost |
| Cloud Monitoring | All agents | Agents fail silently |
| Cloud Functions | Skills Profile, Revenue, Outcome Tracker | Event-driven agents cannot trigger |
| Secret Manager | All agents | Credentials unavailable |
| Firebase Auth | Web + agents | Permission model breaks |
| Playwright on Cloud Run | Application Agent | Cannot fill ATS forms |
| Gmail API | Application Agent | Email applications fail |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| SuccessFactors structure changes | Low | High | Version-pin adapter, weekly health check |
| CAPTCHA solving API downtime | Low | Medium | Two CAPTCHA provider keys (2captcha + CapSolver fallback) |
| ATS blocks Skilved IP | Medium | Medium | Rotate IPs via Cloud Run, respect robots.txt |
| SETA websites block crawler | Medium | High | HTML parsing fallback, manual CSV, multiple sources |
| WhatsApp API approval delays | High | High | Apply Day 1, Twilio fallback while waiting |
| Employer sales cycle > 14 days | Medium | High | Free trial (first 3 referrals free) to accelerate |
| Skills Pulse insufficient data Sprint 1 | Certain | Low | Launch as "opportunity intelligence" — no outcome data needed |
| Career Simulation < 5 outcomes | High (Sprint 2) | Low | Opportunity-based simulation first, label honestly |
| Employer Accountability insufficient data | High (Sprint 3) | Low | "Based on limited early data" label, show "N/A" if < 3 |
| 8-week timeline too tight | Medium | High | Drop Growth/Revenue/Coord layer if behind; keep feed + passport + application |

---

## The Judge Narrative

### Opening (30 seconds)

> "South Africa has 32% youth unemployment and R25 billion in annual skills development funding. Thousands of learnerships expire unfilled every year while qualified candidates can't find them. This is not a supply problem. It is an information problem. No one — not government, not employers, not workers — can see the skills market clearly. Until now."

### The Product (60 seconds)

> "Skilved is the intelligence layer South Africa's skills economy has never had. Seventeen AI employees work around the clock: discovering every trade opportunity in the country every four hours, matching them to workers by real profile fit, submitting applications autonomously, and building the verified outcome graph that makes every agent smarter over time.
>
> Workers create a profile once. Agents work forever. Thandeka from Soweto woke up this morning to see that her agent had applied to two opportunities on her behalf while she slept — both via the same SuccessFactors system that Eskom uses, submitted with a tailored CV and cover letter. She did nothing. The agents did everything."

### The Future (60 seconds)

> "But Skilved is more than a job-matching platform. It is the intelligence layer the entire SA skills market has been missing.
>
> The Skills Pulse Dashboard shows — in real time — which trades are in shortage, which learnerships are expiring unfilled, which qualifications have the best ROI. National Treasury has never had this. It exists nowhere on the continent.
>
> The Career Simulation Engine lets any worker ask 'what happens to my career if I get my trade test?' and receive an answer grounded in 47 real verified trajectories — not generic advice. This is what McKinsey charges R500,000 for. Thandeka gets it free on WhatsApp.
>
> The Employer Accountability Layer publishes verified scores for every employer, based on what actually happened to their candidates. For the first time, the SA learnership market has accountability — not from regulation, from data.
>
> And the Collective Intelligence Layer gives every worker access to the career intelligence that previously only flowed through elite social networks — which opportunities actually lead somewhere, verified by real outcomes."

### The Numbers (30 seconds)

> "In 90 days: 5,000 workers with Skills Passports. 34 applications submitted daily by our Application Agent. 200 verified placements. R300,000 in documented revenue. 200 outcomes in the SA Skills Graph. Zero human approvals in any agent run.
>
> And one national intelligence dashboard that South Africa's government will be bookmarking."

### The Close (30 seconds)

> "LinkedIn helps people present themselves. Skilved helps opportunities find people — and gives workers, employers, and government the intelligence they need to make better decisions about South Africa's most valuable asset: its skilled workers.
>
> This is not the future of job searching. This is what the SA skills economy looks like when it can finally see itself."

---

## The 10-Year Story: Beyond Job Creation

Judges scoring "Autonomous Agents & Workflow Automation" look for three things: agents with persistent memory, multiple agents that genuinely collaborate, and agents that automate complete end-to-end workflows.

Skilved delivers all three — and extends the same architecture into new domains:

**Persistent memory:** The Skills Passport is memory of what a worker is. `behaviouralSignals` is memory of how they behave. The graph is memory of what worked for people like them. Every agent improves for every user across every session.

**Genuine multi-agent collaboration:** The `agent_context` coordination layer means agents reason about each other's recent actions. Revenue Agent suppresses upgrade prompts after CS escalations. Application Agent re-scores against Career Agent's updated plan. Career Simulation Agent and Collective Intelligence Agent feed each other's outputs. The Agent Trace Visualizer makes this visible to judges.

**End-to-end workflow automation:** Discovery → matching → application → interview scheduling → outcome tracking. The entire pipeline from "opportunity exists" to "person placed" with zero human steps.

**The second workflow — the Gig Agent:** The same agentic infrastructure extends to managing a tradesperson's private gig work. Customer inquiry → quote → scheduling → invoice. This bridges "worker" to "micro-business" to "employer on Skilved" — the full lifecycle.

**The 10-year claim:**

> "Skilved starts with trades. It builds toward the operating system for work itself in South Africa — and then Africa. The intelligence that tells 800 million working-age Africans what they should do next, and increasingly does it for them, anchored to their government-verified identity. That is the awesome future we are bringing to the present."

---

## Pre-Submission Checklist

### Two Weeks Before Submission
- [ ] All 17 agents running autonomously in production
- [ ] BigQuery: `human_approvals_required = 0` across 8-week view
- [ ] 5,000+ registered users confirmed
- [ ] 200+ Premium subscribers confirmed
- [ ] 50+ paying employers/SETAs confirmed
- [ ] R300,000+ revenue documented with evidence
- [ ] 200+ outcomes in graph confirmed
- [ ] Skills Pulse Dashboard fully live and auto-updating
- [ ] Career Simulation Engine answering real queries
- [ ] Employer accountability scores on real employer cards
- [ ] Collective intelligence showing on authenticated feed
- [ ] Agent Trace Visualizer showing real user journey
- [ ] Demo video scripted and first draft recorded

### One Week Before Submission
- [ ] Demo video final version recorded and edited
- [ ] All submission materials compiled
- [ ] Submission narrative finalised
- [ ] GCP integration depth documented
- [ ] Legal review of submission claims
- [ ] One documented end-to-end placement story (with permission)
- [ ] XPRIZE submission package assembled

### Day of Submission
- [ ] All systems healthy (check `/api/health`)
- [ ] BigQuery autonomy query returns all zeros
- [ ] Demo video uploaded
- [ ] Submission complete before deadline

---

## Change Log

### v5.0 — June 2026
- Added "Bringing the Future to the Present" section with four future-present capabilities
- Updated XPRIZE demonstration script for 17 agents
- Added Skills Pulse Dashboard to Sprint 1 deliverables
- Added Collective Intelligence Layer to Sprint 2 deliverables
- Added Career Simulation Engine and Employer Accountability to Sprint 3
- Added all four new agents to Sprint 4 full autonomy requirements
- Updated GCP stack table for new agents
- Added pre-submission checklist
- Added ATS adapter strategy to risk register
- Strengthened judge narrative with four "future to present" arguments
- Updated submission package (10 items vs previous 6)

### v4.0 — June 2026
- Added 8-agent architecture
- Added trust escalation model
- Added agent coordination layer

*Document version 5.0 — June 2026*
*Owner: Founder*
*8-week sprint. Submission at end of Week 8.*
