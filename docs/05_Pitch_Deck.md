# Skilved — Pitch Deck
### Seed Round | June 2026

---

> **Deck narrative:** This document contains the full content, talking points, and data for each slide. Design this as a 12-slide deck. Every slide has one job. Every claim has a number behind it.

---

## Slide 1: Cover

**Visual:** Dark background. "Skilved" in large, confident type. Single tagline below.

**Tagline:** *The AI advancement layer for Africa's 11 million skilled workers.*

**Sub:** skilved.com · Seed Round · June 2026

**Talking point:** Say nothing on this slide. Let it breathe.

---

## Slide 2: The Problem

**Headline:** South Africa has 32% youth unemployment. The opportunities exist. The intelligence to connect them doesn't.

**Three facts, large:**
- 500,000+ skilled trades workers actively seeking opportunities right now
- 21 government skills agencies (SETAs) funding thousands of learnerships annually — most go unfilled
- The average trades worker spends 6 months finding their first apprenticeship — by word of mouth

**The real insight:**
> This is not a supply problem. SA funds learnerships that expire unfilled every year. This is an information and matching problem. No one has built the intelligence layer.

**Visual:** Simple stat callouts. No charts. The numbers speak.

---

## Slide 3: The Solution

**Headline:** Skilved flips the paradigm. Workers don't search for opportunities. Opportunities find workers — through AI agents.

**The old primitive (every product before Skilved):**
```
Worker searches → finds opportunity → applies
```

**The Skilved primitive:**
```
Agent discovers → Agent analyses → Agent matches → Agent applies
Worker wakes up to results
```

**The user creates a profile once. Eight agents work forever.**

**Three things Skilved does differently:**

1. **Scout + Analyst:** AI discovers and reads every SA trades opportunity every 4 hours — from SETAs, employers, government, NGOs. Workers never need to search.

2. **Career + Matching:** AI understands each worker's skills, goals, and gaps. It ranks opportunities by fit and maps the career path to get there. Workers see exactly what matches them and why.

3. **Application Agent:** With one tap, AI generates a tailored CV, writes a specific cover letter, fills the application form, and submits. Workers apply while they sleep.

**The business layer — what makes this a company, not a product:**

4. **Revenue Agent** makes monetisation decisions autonomously — when to prompt upgrades, what price to offer, which experiments to run.

5. **Growth Agent** creates daily content, seeds WhatsApp communities, and manages the referral programme — without human direction.

**The hybrid model:** Workers start with AI notifying them. As trust builds, they grant more autonomy. By week 3, most are letting agents apply on their behalf.

**The sentence that defines the category:**
> "LinkedIn helps people present themselves. Skilved helps opportunities find people."

**Visual:** Before/after diagram. Left: human at computer, searching. Right: human sleeping, agents working.

---

## Slide 4: The Product

**Headline:** A public feed that proves the agent is working. A profile that becomes your verified career identity.

**Two columns:**

*The Feed (anyone)*
- Continuously updated by AI agents
- Filtered by trade and province
- Full details, no login
- "Found 2 hours ago by Skilved"
- Share on WhatsApp in one tap

*The Profile (optional)*
- "Send me your Skilved"
- Progressive — more data = smarter matches
- Phase 2: verified by MyMzansi credentials
- Employers search for you, not the other way around

**The viral moment:**
> A worker shares a R4,500/month electrical apprenticeship to their trade WhatsApp group. 47 people click. 12 sign up. The group becomes the acquisition channel.

**Visual:** Phone mockup of the feed (left) and profile (right).

---

## Slide 5: The Technology

**Headline:** Eight AI employees run Skilved. Zero humans curate, filter, apply, or approve. This is a business operated by AI.

**The 8 AI employees:**

| Agent | Runs | What it decides autonomously |
|---|---|---|
| Scout | Every 4 hours | Which opportunities to ingest from 3 portal sources (PuffAndPass, RecentJobs, StudentRoom), expanding to 50+ |
| Analyst | Per new opportunity | What structured intelligence to extract from every listing |
| Matching | Every feed load | How to rank all opportunities for each specific user |
| Career | On profile + weekly | What career path to recommend, which steps are next |
| Application | On user permission | CV generation, cover letter, form fill, submission — end to end |
| Revenue | Event-driven | When to prompt upgrades, what price, which experiments |
| Growth | Daily | Content creation, community seeding, SEO, referral management |
| Customer Success | Always-on | Every onboarding message, every support query, every follow-up |

**The trust escalation model (the hybrid):**
Workers start at Level 1 (agent notifies, human decides). Trust builds through results. By week 3, most users are at Level 3 — agent applies autonomously to high-confidence matches. This is intentional architecture, not a limitation.

**The infrastructure:**
Built entirely on Google Cloud — Vertex AI, Gemini, BigQuery, Cloud Run, Cloud Pub/Sub. 14 GCP services. Remove any one and an agent stops functioning.

**The 24-hour audit:**
```
4,540 autonomous decisions yesterday.
0 human approvals.
```

**Talking point:** "Most teams build an AI-powered product. We built an AI-operated business. The difference is every slide from here."

---

## Slide 6: The Market

**Headline:** We start with trades. We are building for the entire SA labour market. Then Africa.

**Market sizing:**

| Layer | Size |
|---|---|
| SA skilled trades workers | 500,000+ active seekers |
| All SA workforce (addressable long-term) | 22 million people |
| Pan-African working-age population | 800 million people |
| SA skills development spend (SETAs) | R25 billion/year |
| SA recruitment market | R8 billion/year |

**The Thiel framing:**
> We are not trying to capture 1% of a large market. We are building to dominate the SA trades opportunity market within 18 months, then expanding from that position of strength.

**Visual:** Concentric circles. Trades at centre. SA labour market. Pan-Africa.

---

## Slide 7: Business Model

**Headline:** Workers use Skilved free. The agents create so much value that workers pay for more autonomy — and employers pay for the candidates the agents find.

**The three-sided revenue model:**

| Stream | Pricing | Who pays | Status |
|---|---|---|---|
| Employer referral fee | R500–R2,000 per candidate | Employers | Live Day 14 |
| Worker Premium — Level 3 (semi-auto Application Agent) | R200/month | Workers | Live Day 30 |
| Worker Premium+ — Level 4 (full-auto Application Agent) | R500/month | Workers | Live Day 45 |
| SETA institutional contract | R10,000–R200,000/year | SETAs | Live Month 2 |
| Employer dashboard SaaS | R2,000–R12,000/month | Employers | v1.1 |
| Verification API (Phase 2) | R5–R20 per check | Any platform | Phase 2 |
| Skills intelligence data | R50,000–R1,000,000/year | Government, corporates | Year 2 |

**Why workers pay:**
The Application Agent does work that would otherwise cost a worker 3–4 hours per application. At R200/month for unlimited autonomous applications, the ROI is immediate. Workers aren't paying for access — they're paying for the agent to work for them.

**The flywheel:**
```
More workers → better graph → better matches
→ Application Agent improves → more Premium upgrades
→ More Revenue Agent triggers → more employer revenue
→ More workers join (word of mouth from placements)
```

**Unit economics (Month 6):**
- Employer (Growth plan): R13,000/month revenue, 85% gross margin
- Worker (Premium): R500/month, ~95% gross margin
- SETA contract: R80,000/year, 81% gross margin

**Revenue Agent running all monetisation decisions autonomously.**

**Unit economics (Day 90 target):**
- 50 employer relationships
- Average R2,000/month per employer
- R100,000/month recurring revenue
- Zero marginal cost per additional user (AI scales without headcount)

**The flywheel:**
> More workers → better graph → better matches → employers pay more → more workers join → graph improves

---

## Slide 8: The MyMzansi Tailwind

**Headline:** The SA government is building the rails. Skilved is building the intelligence on top. This is not a coincidence — it is the strategy.

**What MyMzansi provides (government):**
- Verified digital identity for 60 million South Africans
- Credentials wallet (qualifications, certificates)
- Data exchange APIs
- Developer sandbox

**What Skilved provides (us):**
- Opportunity intelligence: what should this person do next?
- Outcome tracking: which paths actually work
- The SA Skills Graph: verified careers data at scale

**The government's own words:**  
MyMzansi Phase 1 explicitly states the goal of *"linking grant recipients to jobs, training and education opportunities that lead to sustainable livelihoods."*

> Government wants service delivery. Skilved wants opportunity advancement. These goals converge at exactly the point we are building. We are not competing with MyMzansi. We are completing its social promise.

**Visual:** Layer diagram. MyMzansi rails at bottom. Skilved intelligence layer on top.

---

## Slide 9: Traction

**Headline:** [To be updated with real numbers at pitch time]

**90-day targets (XPRIZE submission):**
- 5,000+ registered users
- 50,000+ anonymous feed sessions
- 10,000+ opportunities indexed
- 50+ paying employers and SETAs
- 200+ documented placements
- R100,000–R300,000 revenue

**The graph:**
> [Graph of weekly user growth, weekly revenue, opportunities indexed]  
> Every line goes up. Every line is driven by the agents, not by marketing spend.

**The signal that matters most:**
> We have [X] outcome data points in the SA Skills Graph. This data is permanently ours. No competitor can acquire it without starting from scratch. It compounds every day.

---

## Slide 10: Competition

**Headline:** We are not competing with job boards. We are building the intelligence layer they cannot.

| | Skilved | PNet | Indeed SA | LinkedIn |
|---|---|---|---|---|
| AI discovers opportunities | ✅ | ❌ | ❌ | ❌ |
| Trades-specific | ✅ | ❌ | ❌ | ❌ |
| SETA learnerships | ✅ | ❌ | ❌ | ❌ |
| No login for full details | ✅ | ❌ | ❌ | ❌ |
| MyMzansi verified (Phase 2) | ✅ | ❌ | ❌ | ❌ |
| Outcome graph | ✅ | ❌ | ❌ | ❌ |
| WhatsApp-native | ✅ | ❌ | ❌ | ❌ |

**The moat:**
> LinkedIn knows what people say. Skilved knows what actually changed their lives — verified. After 3 years of outcome data, no one can replicate the graph cold. This is the moat Cirlig describes: not in the code, in the data that the code builds.

---

## Slide 11: Team

**Headline:** Built by people who understand both the technology and the South African context.

**[Founder Name]** — CEO  
[Background: what makes you uniquely qualified to build this]  
Lived experience of the trades skills gap / deep SA context / previous startup / technical background

**[CTO Name]** — CTO  
[Background: AI/ML, GCP, agentic systems]

**[Growth/Partnerships Name]** — Head of Growth  
[Background: SETA relationships, employer networks, SA ed-tech or workforce]

**Advisors:**
- [Name]: MyMzansi / DPI / government digital transformation
- [Name]: SETA / skills development expertise
- [Name]: AI / ML / Vertex AI

**Why this team:**
> We are not outsiders parachuting in with a technology solution. We understand the SETA system, the TVET pipeline, the WhatsApp-first mobile behaviour of our users, and the MyMzansi infrastructure we are building on.

---

## Slide 12: The Ask

**Headline:** We are raising R[X]M seed to build the SA Skills Graph and win the Gemini XPRIZE.

**Use of funds:**

| Allocation | % | Purpose |
|---|---|---|
| Engineering | 45% | Agent development, GCP infrastructure, mobile app |
| Growth | 25% | SETA partnerships, employer sales, user acquisition |
| Operations | 15% | Legal (POPIA), team, tools |
| Data | 10% | Graph infrastructure, BigQuery, ML ops |
| Reserve | 5% | Working capital |

**18-month milestones:**
- Month 3: XPRIZE submission (5K users, R100K revenue)
- Month 6: MyMzansi API integration live, 25K users
- Month 9: 100K users, SETA national partnerships, R1M/month revenue run rate
- Month 12: White-collar expansion begins
- Month 18: Pan-African expansion (Kenya pilot)

**The vision:**
> Skilved becomes the answer to the question South Africa's digital public infrastructure cannot ask: *What should this person do next?* We start with trades. We build for the entire country. Then the continent.

**Contact:** [founder@skilved.com] · [skilved.com]

---

## Appendix Slides

### A1: Technical Architecture (deep dive)
Full GCP stack diagram. Agent flow diagram. BigQuery schema. MyMzansi integration points.

### A2: SETA Landscape
All 21 SETAs, coverage areas, annual learnership budgets, contact strategy.

### A3: Financial Model (detailed)
Month-by-month revenue model, unit economics, hiring plan, burn rate, runway.

### A4: Regulatory
POPIA compliance plan. Labour law considerations. SETA partnership legal structure. MyMzansi API terms.

### A5: MyMzansi Integration Roadmap
Phase 1 (self-reported credentials) → Phase 2 (MyMzansi wallet API) → Phase 3 (full DPI integration).

---

*Deck version 1.0 — June 2026*  
*Confidential — for investor use only*
