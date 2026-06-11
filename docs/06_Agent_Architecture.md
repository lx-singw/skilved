# Skilved — Agent Architecture & Technical Specification
### Agentic AI Design | Version 1.0 | June 2026

---

## Design Philosophy

Skilved is not a product that uses AI. Skilved is an agentic system that happens to have a user interface. The distinction matters for the XPRIZE judges and for the long-term defensibility of the business.

**Agentic principle:** Every core business decision — which opportunities to publish, how to rank them, which are scams, who to notify, when to follow up — is made by an AI agent. Humans set the strategy and monitor health. Agents execute.

**The test:** If the engineering team disappeared for a week, Skilved should continue discovering opportunities, matching users, sending digests, and building the graph autonomously. This is the standard we build to.

---

## Agent Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SKILVED AGENT SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Discovery   │    │   Quality    │    │   Matching   │  │
│  │   Agent      │───▶│   Agent      │───▶│   Agent      │  │
│  │  (4h cycle)  │    │ (continuous) │    │ (per request)│  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                    │        │
│  ┌──────────────┐    ┌──────────────┐             │        │
│  │  Notification│    │   Outcome    │             │        │
│  │   Agent      │◀───│  Tracker     │◀────────────┘        │
│  │  (daily 7am) │    │  (event)     │                      │
│  └──────────────┘    └──────────────┘                      │
│                                                             │
│              ┌──────────────────┐                          │
│              │   The Graph      │                          │
│              │  (BigQuery)      │                          │
│              │  All agents      │                          │
│              │  read + write    │                          │
│              └──────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent 1: Discovery Agent

### Purpose
Continuously discover every skilled trades opportunity in South Africa from all available sources, extract structured data, and publish to the Skilved opportunity store.

### Trigger
Cloud Scheduler — runs every 4 hours, 24 hours a day, 7 days a week.
Cron: `0 */4 * * *`

### Architecture
```
Cloud Scheduler
    ↓
Cloud Pub/Sub (trigger message)
    ↓
Cloud Run (discovery-agent service)
    ├── Source fetcher (parallel, 50+ sources)
    │   ├── HTML parser (BeautifulSoup / Playwright for JS-heavy sites)
    │   ├── PDF extractor (Cloud Document AI)
    │   └── RSS/API consumers (where available)
    ├── Content extractor (Gemini structured extraction)
    ├── Deduplication engine (fuzzy match against existing Firestore records)
    ├── Quality pre-scorer (rules-based fast filter)
    └── Firestore writer (publish approved opportunities)
    ↓
Cloud Pub/Sub (new_opportunity message)
    ↓
Quality Agent (triggered)
    ↓
BigQuery (agent_run log)
```

### Sources (MVP — 50+ sources)

**SETA Portals (21 SETAs):**
- MERSETA (manufacturing, engineering, related services)
- EWSETA (energy, water)
- CETA (construction)
- LGSETA (local government)
- MQA (mining qualifications)
- TETA (transport)
- MICT SETA (ICT)
- AgriSETA (agriculture)
- CHIETA (chemicals)
- FASSET (finance, accounting, management consulting)
- FOODBEV SETA
- HWSETA (health, welfare)
- INSETA (insurance)
- PSETA (public service)
- CATHSSETA (culture, arts, tourism)
- WRSETA (wholesale, retail)
- BANKSETA
- ETDP SETA (education, training)
- SASSETA (safety, security)
- SERVICES SETA
- FIETA (forest industries)

**Job Platforms (filtered to trades):**
- Indeed SA (trade/artisan category)
- PNet (technical/engineering)
- CareerJunction (trades/artisan)
- Careers24
- JobMail
- Gumtree Jobs (artisan category)

**Government Sources:**
- Government Gazette (learnership notices)
- DPSA vacancy circular
- Provincial skills development portals (all 9)
- NAMB (National Artisan Moderation Body) — trade tests

**Employer Direct (top 50 trade employers in SA):**
- Eskom, Transnet, Sasol, Tongaat Hulett
- Murray & Roberts, WBHO, Group Five
- Barloworld, Imperial, WesBank
- Vodacom, MTN, Telkom (technical roles)
- City Power, Johannesburg Water
- Provincial road agencies (all 9)
- Mining houses: Anglo American, BHP, Sibanye-Stillwater, Impala, Harmony

### Gemini Extraction Prompt

```
You are a data extraction agent for Skilved, a platform for South African skilled trades workers.

Extract the following fields from the provided content. Return ONLY valid JSON. 
If a field cannot be determined, return null.

{
  "title": "exact title of the opportunity",
  "organisation": "name of the posting organisation",
  "opportunity_type": "one of: apprenticeship|learnership|bursary|job|trade_test|short_course",
  "trade_category": "one of: electrical|plumbing|welding|automotive|construction|hvac|mechanical|mining|ict|agriculture|logistics|clothing|other",
  "province": "one of: gauteng|western_cape|kwazulu_natal|eastern_cape|limpopo|mpumalanga|north_west|free_state|northern_cape|national",
  "city": "specific city or null",
  "salary_amount": "numeric value or null",
  "salary_currency": "ZAR",
  "salary_type": "monthly|annual|stipend|funded|null",
  "qualifications_required": ["array of qualification requirements"],
  "experience_required": "entry_level|1_3_years|3_plus_years|trade_tested|null",
  "deadline": "ISO date string or null",
  "duration": "duration of opportunity if applicable or null",
  "application_url": "direct application URL",
  "application_email": "email address for applications or null",
  "description_summary": "2-3 sentence summary of the opportunity",
  "source_url": "URL this was extracted from"
}

Content to extract from:
[CONTENT]
```

### Deduplication Logic
```python
def is_duplicate(new_opp, existing_opps):
    for existing in existing_opps:
        title_similarity = fuzzy_match(new_opp.title, existing.title)
        org_match = new_opp.organisation.lower() == existing.organisation.lower()
        deadline_match = new_opp.deadline == existing.deadline
        
        if title_similarity > 0.85 and org_match:
            return True
        if title_similarity > 0.92 and deadline_match:
            return True
    return False
```

### Agent Output
Each published opportunity:
```json
{
  "id": "auto-generated UUID",
  "title": "Electrical Apprenticeship",
  "organisation": "Eskom Holdings",
  "opportunity_type": "apprenticeship",
  "trade_category": "electrical",
  "province": "gauteng",
  "city": "Johannesburg",
  "salary_amount": 4500,
  "salary_currency": "ZAR",
  "salary_type": "monthly",
  "qualifications_required": ["N3 Electrical", "Grade 12"],
  "experience_required": "entry_level",
  "deadline": "2026-07-15",
  "duration": "3 years",
  "application_url": "https://eskom.co.za/careers/...",
  "description_summary": "Eskom is offering...",
  "source_url": "https://ewseta.org.za/...",
  "quality_score": null,
  "status": "pending_quality_check",
  "discovered_at": "2026-06-07T14:23:00Z",
  "agent_run_id": "run_abc123"
}
```

### Monitoring
- Cloud Monitoring alert if agent fails to run for > 5 hours
- Alert if < 10 opportunities discovered in a run (source failure)
- Daily digest to founder: opportunities found, published, rejected, errors

---

## Agent 2: Quality Agent

### Purpose
Review every new opportunity discovered by the Discovery Agent and decide: publish, reject, or flag for review. Runs autonomously — no human approval in the standard path.

### Trigger
Cloud Pub/Sub message `new_opportunity` from Discovery Agent.

### Architecture
```
Pub/Sub (new_opportunity)
    ↓
Cloud Run (quality-agent service)
    ├── Rules engine (fast, deterministic checks)
    ├── Gemini classifier (nuanced quality assessment)
    ├── Source credibility lookup (known SETAs get high scores)
    ├── Expiry check (deadline in the past → reject)
    └── Decision: publish | reject | flag
    ↓
Firestore (update opportunity status)
    ↓
BigQuery (quality_decision log)
```

### Quality Rules Engine (Fast Path)

Auto-reject if ANY of:
- `application_url` is null or returns 404
- `title` contains: "various positions", "multiple vacancies", "click here", "earn R5000 daily"
- `deadline` is in the past
- `salary_amount` > R200,000/month (data error)
- `description_summary` length < 50 characters
- `organisation` is null

Auto-flag for review (not auto-reject) if:
- Opportunity type is null
- Province is null or "national" (needs manual assignment)
- Application URL is suspicious (non-.co.za, .gov.za, .org.za domain for SETA listings)

### Gemini Quality Classifier

```
You are a quality control agent for Skilved, a platform for South African skilled trades workers.

Assess this opportunity for quality on a scale of 0-100.

Penalise for:
- Vague or misleading title (-20)
- Missing or suspicious contact details (-15)
- Requires upfront payment from applicant (-50, likely scam)
- Unrealistic salary claim (-20)
- Generic description with no specific requirements (-10)
- No legitimate organisation name (-25)

Reward for:
- Known SETA or government body (+20)
- Specific qualification requirements stated (+15)
- Salary/stipend clearly stated (+10)
- Direct employer website URL (+10)
- Clear deadline (+5)

Return JSON:
{
  "quality_score": 0-100,
  "decision": "publish|reject|flag",
  "rejection_reason": "reason if rejected or null",
  "flags": ["array of issues if flagged"]
}

Opportunity data:
[OPPORTUNITY JSON]
```

### Quality Thresholds
- Score 70–100: Auto-publish
- Score 50–69: Publish with "unverified" tag (displayed to users)
- Score 30–49: Flag for human review (reviewed in weekly batch)
- Score 0–29: Auto-reject, logged

### Ongoing Quality
- Agent re-checks all published opportunities daily for deadline expiry
- User-reported issues trigger re-evaluation
- Source credibility scores updated monthly based on quality history

---

## Agent 3: Matching Agent

### Purpose
For every feed request, rank the available opportunities in the optimal order for the specific user. Runs on every page load.

### Trigger
HTTP request to `/api/feed` endpoint.

### Architecture
```
User request (trade filter, province, user_id or session_id)
    ↓
Cloud Run (matching-agent service)
    ├── User context builder
    │   ├── Anonymous: filter selections + browser signals
    │   └── Authenticated: full profile from Firestore
    ├── Candidate retrieval (Vertex AI Search query)
    ├── Re-ranking (Vertex AI Ranking API)
    ├── Match explanation generator (Gemini, lightweight)
    └── Response builder
    ↓
Feed API response (ranked opportunities + match explanations)
    ↓
BigQuery (feed_request log with ranking signals)
```

### Anonymous Ranking Signals
- Trade filter selection (if set): weight 0.50
- Province filter selection (if set): weight 0.30
- Session browse history (which trades/types viewed): weight 0.10
- Opportunity freshness: weight 0.10

### Authenticated Ranking Signals
- Trade category match (profile vs opportunity): weight 0.30
- Qualification level fit (profile level ≤ required level): weight 0.25
- Province match: weight 0.20
- Experience match: weight 0.10
- Application history (avoid re-showing applied-to opportunities): weight 0.05
- Opportunity freshness: weight 0.10

### Match Explanation Generation (Gemini)
For logged-in users, each card gets a 1-sentence explanation:

```
Prompt: Given user profile and opportunity, write a single sentence (max 15 words) 
explaining why this is a match. Be specific. Start with "Matches your".

Examples:
- "Matches your N3 electrical qualification and Gauteng location."
- "Strong match: trade-tested plumber, Durban, your preferred salary range."
- "Entry-level welding role matching your 2 years experience in KZN."
```

### Model Retraining
- Weekly: Vertex AI pipeline retrains ranking model on new outcome data
- Retraining signal: which opportunities led to `apply_complete` and positive outcomes
- Model versioned — rollback available if quality drops

---

## Agent 4: Notification Agent

### Purpose
Send each registered user a personalised daily digest of new opportunities on WhatsApp.

### Trigger
Cloud Scheduler — daily at 7:00am SAST.

### Architecture
```
Cloud Scheduler (7:00 SAST daily)
    ↓
Cloud Run (notification-agent service)
    ├── User batch loader (all users with WhatsApp + digest enabled)
    ├── For each user:
    │   ├── Fetch new opportunities since last digest (BigQuery query)
    │   ├── Match against profile (reuse matching agent logic)
    │   ├── Select top 3–5 opportunities
    │   ├── Gemini message personaliser
    │   └── WhatsApp API send
    ├── Delivery tracking (sent / delivered / read)
    └── Unsubscribe processing
    ↓
BigQuery (digest_sent log per user)
```

### Digest Selection Logic
```python
def select_digest_opportunities(user, new_opps):
    # Filter: only opportunities newer than last_digest_sent
    fresh = [o for o in new_opps if o.discovered_at > user.last_digest_sent]
    
    # Score against user profile
    scored = [(o, match_score(user, o)) for o in fresh]
    scored.sort(key=lambda x: x[1], reverse=True)
    
    # Return top 3-5, minimum score threshold 0.6
    return [o for o, score in scored[:5] if score >= 0.6]
```

### WhatsApp Message Template

```
Good morning [First name] 👋

Skilved found *[N] new opportunities* for you overnight:

1️⃣ *[Title]* — [Organisation]
   📍 [City], [Province] | 💰 [Salary]
   📅 Closes [Date]
   👉 [Short link]

2️⃣ *[Title]* — [Organisation]
   [Same format...]

[+ 1–2 more]

View all [X] [Trade] opportunities: [Trade feed URL]

Reply STOP to pause updates.
```

### Personalisation Layer
Gemini adds one context-aware sentence when relevant:
- "This one closes in 2 days — don't wait."
- "This is a rare [Trade] opportunity in [Province]."
- "Based on your N3 certificate, you meet all the requirements."

### Delivery Rules
- Only send if ≥ 3 qualifying new opportunities (avoid noise)
- Backoff if user hasn't opened last 7 digests (reduce to weekly)
- Immediate unsubscribe on STOP reply
- Digest content changes per user — no two users get the same message

---

## Agent 5: Outcome Tracker Agent

### Purpose
Monitor user application events and follow up to collect outcome data. This data is the graph — it is the most valuable thing Skilved produces.

### Trigger
Cloud Functions (event-driven) — fires on `apply_click` and `apply_complete` events.

### Architecture
```
BigQuery event stream (apply_click / apply_complete)
    ↓
Cloud Functions (outcome-tracker trigger)
    ├── Day 3 follow-up: "Did you submit your application?"
    ├── Day 14 follow-up: "Any news on your application?"
    ├── Day 30 follow-up: "Did you hear back?"
    ├── On outcome reported: update graph, stop follow-ups
    └── Response handler: parse user reply, classify outcome
    ↓
BigQuery (outcomes table updated)
    ↓
Vertex AI (weekly model retrain triggered if enough new outcomes)
```

### Follow-Up Messages (WhatsApp)

**Day 3:**
```
Hey [Name] 👋

You applied for *[Title]* at [Organisation] 3 days ago.

Did you submit your application?

Reply:
✅ Yes, submitted
⏳ Not yet, still working on it
❌ Decided not to apply
```

**Day 14:**
```
Just checking in on your [Title] application at [Organisation].

Any news yet?

Reply:
📞 Got an interview
📬 Waiting to hear back
❌ Application was unsuccessful
✅ Got the offer!
```

**Day 30 (if no response to Day 14):**
```
One last check-in on [Organisation] — any update?

This helps Skilved find better opportunities for you and 
everyone in the [Trade] community.

[Same reply options]
```

### Outcome Classification
```python
outcome_map = {
    "yes_submitted": "applied",
    "got_interview": "interviewed",
    "waiting": "pending",
    "unsuccessful": "rejected",
    "got_offer": "offered",
    "accepted": "accepted",
    "decided_not": "withdrawn"
}
```

### Graph Impact
Every outcome updates:
```sql
UPDATE outcomes 
SET outcome_type = '[classified_outcome]',
    outcome_at = CURRENT_TIMESTAMP()
WHERE user_id = '[user]' AND opportunity_id = '[opp]';
```

This single row is a data point that:
- Improves the matching model (which opportunities lead to placements)
- Validates the quality score (scam opportunities have poor outcomes)
- Builds the SA Skills Graph (which qualifications unlock which opportunities)
- Validates the career paths (which learnerships lead to jobs)

---

## Agent Communication Architecture

Agents communicate via Cloud Pub/Sub topics:

| Topic | Publisher | Subscriber | Message |
|---|---|---|---|
| `new_opportunity_discovered` | Discovery Agent | Quality Agent | Opportunity ID |
| `opportunity_published` | Quality Agent | Matching Agent (cache invalidation) | Opportunity ID |
| `opportunity_rejected` | Quality Agent | Monitoring | Rejection reason |
| `user_applied` | Application handler | Outcome Tracker | User ID + Opportunity ID |
| `outcome_received` | Outcome Tracker | Graph updater | User ID + outcome |
| `digest_due` | Cloud Scheduler | Notification Agent | Batch trigger |
| `model_retrain_due` | Cloud Scheduler | ML Pipeline | Weekly trigger |

---

## Monitoring & Observability

### Cloud Monitoring Dashboards

**Agent Health Dashboard:**
- Discovery agent last run timestamp
- Opportunities found per run (time series)
- Quality rejection rate (should be 10–30%)
- Matching agent p95 latency
- Notification agent delivery rate
- Outcome tracker response rate

**Business Health Dashboard:**
- New users (daily)
- Feed sessions (daily)
- Apply clicks (daily)
- Outcomes reported (weekly)
- Revenue (weekly)

### Alerts
| Alert | Threshold | Channel |
|---|---|---|
| Discovery agent missed run | > 5 hours since last run | PagerDuty + Slack |
| Quality rejection rate spike | > 60% in one run | Slack |
| Matching agent latency | p95 > 2 seconds | PagerDuty |
| WhatsApp delivery failure | > 20% failed in batch | Slack |
| Zero new opportunities | 3 consecutive runs | PagerDuty |

---

## XPRIZE Autonomy Demonstration

For the XPRIZE judges, Skilved will provide:

1. **Live agent dashboard** showing all 5 agents, last run times, decisions made, zero human approvals
2. **Agent run log** in BigQuery: every discovery run with full audit trail
3. **Decision log** for quality agent: every opportunity reviewed, score, decision, reasoning
4. **Notification log**: every digest sent, per-user content, delivery status
5. **Outcome tracker log**: every follow-up sent, every response received, graph updates

The demonstration script:
> "This is the last 24 hours. 2,847 opportunities reviewed by the quality agent. 312 rejected. 2,535 published. 4,291 personalised feeds served. 1,847 WhatsApp digests sent. 23 outcomes collected. The graph now has 847 data points. Zero human decisions made in this entire period. This is what AI-native looks like."

---

*Document version 1.0 — June 2026*  
*Owner: Engineering*  
*Classification: Internal — Technical*
