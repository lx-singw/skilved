# Skilved — XPRIZE Strategy
### Build with Gemini XPRIZE | 90-Day Execution Plan | June 2026

---

## The Prize

$2,000,000 total prizes. $500,000 for first place.  
Category: **Entrepreneurship & Job Creation**  
Requirements: Real business, real users, real revenue. AI agents run operations. Category impact at scale.

---

## Why Skilved Wins

Most XPRIZE submissions will be polished demos with synthetic users and aspirational revenue. Skilved enters with structural advantages none of them can replicate:

1. **A real national pain.** 32% youth unemployment in South Africa. 500K+ trades workers actively seeking opportunities at any given time. This is not a manufactured problem.

2. **A real infrastructure tailwind.** MyMzansi is live government DPI. Skilved is the private-sector intelligence layer on top of it. No other submission has sovereign government infrastructure as its foundation.

3. **Genuine AI-native operations.** The opportunity discovery, matching, quality filtering, notification, and outcome tracking agents all run without human intervention. The business literally cannot operate at scale without the AI — that is not an LLM wrapper, that is an agentic system.

4. **A zero-to-one data asset.** The outcome graph is not replicable. After 90 days, it has data no competitor can buy. After 3 years, it is national infrastructure.

5. **The right category.** Entrepreneurship & Job Creation is the most nakedly impact-aligned with Skilved's thesis. The judges will understand the opportunity.

---

## Judging Criteria — Skilved's Score

### Criterion 1: Business Viability

**What judges assess:** Real users acquired, real revenue generated, sustainable business model.

**Skilved's approach:**

*Users:* Trades workers have an acute, immediate pain. They are actively searching. There is no marketing budget required to explain the value proposition. "Find me an electrical apprenticeship" is the whole pitch. Target: 5,000 registered users in 90 days, 50,000+ anonymous feed sessions.

*Revenue:* Two streams, both live by Day 14:
- Employer referral fees: R500–R2,000 per qualified candidate referred
- SETA placement fees: R5,000–R20,000 per institutional contract

Conservative 90-day revenue model:
```
Month 1: 5 employers × 3 referrals × R1,000 = R15,000
Month 2: 15 employers × 4 referrals × R1,000 = R60,000
Month 3: 30 employers × 5 referrals × R1,500 = R225,000
Total: ~R300,000 (~$16,500 USD)
```

*Sustainability:* The business model improves with scale. More users → better graph → better matches → higher employer willingness to pay → more users. Classic two-sided marketplace flywheel, powered by AI that compounds.

**Projected score: 88/100**

---

### Criterion 2: AI-Native Operations

**What judges assess:** AI runs key decisions live in production. Not AI-assisted — AI-operated.

**The five autonomous agents Skilved runs in production:**

#### Agent 1: Discovery Agent
- **Decision:** Which opportunities to ingest, extract, and publish
- **Autonomy:** Runs every 4 hours without human input
- **Human role:** None in normal operation (only infrastructure alerts)
- **GCP:** Cloud Scheduler → Cloud Run → Vertex AI Search → Firestore
- **Demonstrable:** Agent run logs show: time started, sources crawled, opportunities found/published/rejected, no human approval step

#### Agent 2: Matching Agent
- **Decision:** How to rank opportunities for each user
- **Autonomy:** Runs on every page load, personalises in real time
- **Human role:** None
- **GCP:** Vertex AI Ranking API → Cloud Run → personalisation pipeline
- **Demonstrable:** Side-by-side comparison of anonymous vs. logged-in feed showing different ranking for same opportunity set

#### Agent 3: Quality Agent
- **Decision:** Which opportunities are scams, duplicates, or low quality
- **Autonomy:** Runs on every new opportunity, auto-removes without approval
- **Human role:** Reviews flagged edge cases weekly (not in real-time path)
- **GCP:** Gemini classification → Cloud Run → Firestore update
- **Demonstrable:** Show opportunities rejected with quality agent reasoning

#### Agent 4: Notification Agent
- **Decision:** Which opportunities to include in each user's daily digest
- **Autonomy:** Sends personalised WhatsApp message to each user at 7am
- **Human role:** None
- **GCP:** Cloud Scheduler → Cloud Run → Gemini (message personalisation) → WhatsApp API
- **Demonstrable:** Show digest content differing per user based on profile

#### Agent 5: Outcome Tracking Agent
- **Decision:** When to prompt users for outcome updates, how to update the graph
- **Autonomy:** Monitors application events, sends follow-up prompts, updates BigQuery
- **Human role:** None
- **GCP:** Cloud Functions (event trigger) → Gemini → WhatsApp → BigQuery
- **Demonstrable:** Show graph data accumulating from user outcome reports

**The XPRIZE Demonstration Script:**

> "Here is the agent dashboard. Every row is an autonomous decision made by Skilved's AI in the last 4 hours — no human made any of these choices. 847 opportunities discovered. 12 rejected as scams. 3 duplicates removed. 1,247 personalised feeds updated. 892 WhatsApp digests sent. 0 human approvals required. This is not AI-assisted. This is AI-operated."

**Projected score: 94/100**

---

### Criterion 3: Category Impact

**What judges assess:** Meaningfully moves the needle in the category — redefines how it works OR reaches credible scale.

**Skilved's impact story has three layers:**

**Layer 1 — Immediate (Day 90):**
- 5,000 SA trades workers with daily AI-matched opportunity access they didn't have before
- 200+ measurable placements (applied → outcome documented)
- First AI-native opportunity platform built specifically for Africa's largest skilled-trades workforce
- Zero equivalent product exists in SA or on the continent

**Layer 2 — Medium-term (Year 1–3):**
- MyMzansi credential wallet integrates with Skilved profiles
- "I have this certificate" becomes "verify from MyMzansi" — government-grade trust
- Skilved becomes the private-sector completion of MyMzansi's explicit social promise: "linking grant recipients to jobs, training and education opportunities that lead to sustainable livelihoods"
- This is not incidental — it is the government's stated goal, and Skilved is the mechanism

**Layer 3 — Long-term (Year 3–10):**
- The SA Skills Graph: the definitive map of which skills unlock which opportunities, verified by outcome data
- National Treasury and DPSA use Skilved data for skills policy
- Every TVET college uses Skilved placement data to adjust curriculum in real time
- Pan-African expansion: the model replicates to Kenya, Nigeria, Rwanda — countries building the same DPI stack

**The category-redefining claim:**

> "Every job board in history has asked employers to post opportunities and workers to search for them. Skilved inverts this: the AI agent finds opportunities autonomously, matches them to workers before they search, and builds a verified outcome graph that makes every subsequent match smarter. Job creation isn't about more listings. It's about better intelligence. Skilved is that intelligence layer."

**Projected score: 95/100**

---

## 90-Day Execution Timeline

### Days 1–7: Infrastructure + First Feed
**Must-haves by Day 7:**
- GCP project provisioned (all services enabled)
- Discovery agent v1 live (10 SETA sources, 4-hour cycle)
- Opportunity Firestore schema live
- Feed UI live at skilved.com (200+ opportunities)
- BigQuery event pipeline live
- Cloud Monitoring + alerting live

**Team allocation:**
- 2 engineers: Discovery agent + Firestore + Cloud Run
- 1 engineer: Next.js feed UI
- 1 designer: Card design system
- Founder: SETA source list compilation, first employer outreach

---

### Days 8–14: Matching + First Revenue
**Must-haves by Day 14:**
- Matching agent v1 live (anonymous ranking)
- WhatsApp share live
- First employer / SETA contact pitched and signed (R500+ fee)
- Match explanation on cards
- All 12 trade categories in discovery scope

**First revenue target:** R1,000–5,000 by Day 14

**Employer pitch script:**
> "Skilved's AI agent finds and indexes every trade opportunity in South Africa every 4 hours. We have [X] electrical candidates in Gauteng actively browsing right now. For R1,000 per qualified candidate we refer to you, you access pre-interested talent without advertising. No placement, no charge."

---

### Days 15–30: Accounts + Quality
**Must-haves by Day 30:**
- Account creation (WhatsApp OTP)
- Personalised feed (logged-in users)
- Quality agent live (scam detection, duplicate removal)
- WhatsApp digest agent live
- Outcome tracking flow
- 500+ registered users
- 5+ paying employers

**Revenue target Day 30:** R15,000–30,000

---

### Days 31–60: Scale + Graph
**Must-haves by Day 60:**
- 2,000+ registered users
- 20+ paying employers / SETAs
- 50+ documented outcomes (applied → result)
- All 9 provinces validated
- Employer referral dashboard (basic)
- First SETA institutional contract signed (R5,000–20,000)
- Vertex AI matching model v2 (trained on first outcome data)

**Revenue target Day 60:** R60,000–100,000

---

### Days 61–90: XPRIZE Submission Prep
**Must-haves by Day 90:**
- 5,000+ registered users
- 50,000+ anonymous feed sessions
- 50+ paying employers / SETAs
- 200+ documented outcomes
- All 5 agents running autonomously (demonstrable)
- Revenue R100,000–300,000 documented
- Agent autonomy dashboard built (for judges)
- Video demo scripted and recorded
- Submission document complete

**Submission components:**
1. Business metrics report (users, revenue, placements)
2. Agent autonomy demonstration (live or recorded)
3. Category impact narrative (3-layer story)
4. 10-year architecture (MyMzansi integration roadmap)
5. GCP integration depth documentation

---

## GCP Stack — Depth of Integration

The XPRIZE requires meaningful GCP integration. Skilved's stack is not cosmetic:

| GCP Service | How Skilved Uses It | Why This Isn't Cosmetic |
|---|---|---|
| Vertex AI Search | Opportunity discovery indexing and retrieval | Core to the discovery agent — without it, the agent cannot function |
| Vertex AI Ranking | Personalised feed ranking | Core to the matching agent — the personalisation model lives here |
| Gemini API | Quality agent classification, match explanations, cover note generation, digest personalisation | Multiple production agents depend on Gemini for decisions |
| Cloud Run | All agent execution environments | Every agent runs on Cloud Run — it is the operational backbone |
| Cloud Scheduler | Agent trigger orchestration | Schedules discovery, notification, and outcome agents |
| BigQuery | The graph — every event, outcome, and match | This IS the product's long-term moat — not just analytics |
| Firestore | Opportunity store, user profiles, session state | Primary operational database |
| Cloud Pub/Sub | Event-driven agent communication | Agents communicate via Pub/Sub — true event-driven architecture |
| Cloud Monitoring | Agent health, alerting, SLO tracking | Production monitoring — judges can see uptime and agent health |
| Cloud Storage | Source cache, opportunity snapshots | Discovery agent caches source pages for processing |
| Secret Manager | API keys, WhatsApp credentials | Security best practice |
| Firebase Auth | User authentication | WhatsApp OTP + Google OAuth |

**The key judge message:** Skilved does not use GCP as a deployment platform. GCP is the intelligence infrastructure. Remove any of these services and the business stops functioning.

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| SETA websites block crawler | Medium | High | Use HTML parsing fallback, respect robots.txt, manual CSV import as backup |
| WhatsApp Business API approval delays | High | High | Apply Day 1, use Twilio as backup while waiting |
| Employer sales cycle > 14 days | Medium | High | Offer free trial (first 3 referrals free) to accelerate first revenue |
| Fake/scam opportunities in feed | Medium | High | Quality agent live before public launch |
| POPIA compliance challenge | Low | High | Legal review Week 1, POPIA notice on all data collection |
| Competitor launches similar product in 90 days | Low | Medium | The graph moat — they cannot replicate 90 days of outcome data |
| Team bandwidth (90-day sprint) | Medium | High | Narrow scope ruthlessly, no scope creep, MVP discipline |

---

## The Judge Narrative

When Skilved presents to XPRIZE judges, the story is:

> "South Africa has 32% youth unemployment and 500,000 skilled trades workers who cannot find the opportunities that exist for them — not because the opportunities don't exist, but because there is no intelligent system finding and matching them. We built one.
>
> Skilved's AI agents discovered 10,000 opportunities this quarter. They matched them to 5,000 workers based on trade, qualification, and location. They sent personalised daily digests to every user without a single human approval. They tracked 200 outcomes that became the first nodes in the SA Skills Graph — the data asset that compounds forever.
>
> This is not a job board with AI features. This is an AI-native advancement layer built on South Africa's new digital public infrastructure. The government built the identity rails. We built the intelligence on top. And we are just getting started."

---

*Document version 1.0 — June 2026*  
*Owner: Founder*  
*Submission deadline: 90 days from incorporation*
