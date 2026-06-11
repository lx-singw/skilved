# Skilved — MVP Scope
### Version 1.0 | June 2026

---

## What We Are Building

Skilved is the intelligence layer on top of South Africa's digital public infrastructure. The MVP is the narrowest possible product that proves the core thesis: **an AI agent can discover, match, and help a skilled trades worker apply for opportunities better than any human or job board can — with zero account required.**

The MVP is not a job board. It is a continuously running AI agent that happens to have a public feed as its interface.

---

## MVP North Star

> A South African trades worker opens Skilved on their phone, sees opportunities matched to their trade and province within 3 seconds, clicks into one, reads the full details, and applies — all without ever creating an account. If they do create an account, the AI immediately gets smarter about what to show them next.

---

## Scope Boundaries

### In Scope
- Public opportunity feed (no login required)
- Full opportunity detail view (no login required)
- Direct application (external link or in-app, no login required)
- Optional account creation — triggers AI personalisation
- AI opportunity discovery agent (runs 24/7, autonomous)
- AI matching agent (personalises feed per anonymous + logged-in user)
- 12 trade categories, all 9 SA provinces
- WhatsApp share integration
- Basic outcome tracking (did they apply?)

### Out of Scope (MVP)
- MyMzansi credential verification integration
- Employer dashboard
- SETA portal
- Paid placements / promoted listings
- Mobile app (PWA first)
- Multi-language (English first, isiZulu + Afrikaans in v1.1)

---

## The Feed — First Principles

The feed is the most important surface Skilved will ever build. It must be nailed before anything else. It is the product before signup, the proof of agent quality, and the viral distribution mechanism.

### Feed Design Principles

1. **Zero friction.** No signup wall. No "create account to see more." Full details visible to everyone.
2. **Freshness signal.** Every opportunity shows when it was found by the agent. "Found 2 hours ago" is trust-building.
3. **Specificity over volume.** 20 highly relevant opportunities beats 200 generic ones. The agent filters ruthlessly.
4. **Shareable by default.** Every opportunity card has a WhatsApp share button. One tap. Pre-filled message.
5. **Location-aware without asking.** Browser geolocation (with permission) silently improves relevance. Fallback to province selector.
6. **Trade-first navigation.** The primary filter is trade category, not keyword search. Workers know their trade.

### Feed Information Architecture

```
Feed
├── Filter bar (Trade | Province | Opportunity type | Salary range)
├── Opportunity cards
│   ├── Title + company/organisation
│   ├── Trade badge + province tag
│   ├── Opportunity type (Apprenticeship / Learnership / Bursary / Job / Trade test)
│   ├── Salary / stipend (if available)
│   ├── Closing date
│   ├── "Found X hours ago by Skilved agent" 
│   ├── Share button (WhatsApp)
│   └── Apply / View details CTA
├── Soft personalisation prompt (after 3 views)
│   └── "Want Skilved to match these to your exact skills?"
└── Load more (infinite scroll)
```

### Opportunity Card States

| State | Trigger | Display |
|---|---|---|
| Fresh | < 24 hours old | Green "New" badge |
| Active | 1–7 days | Standard |
| Closing soon | < 3 days to deadline | Orange "Closing soon" badge |
| Expired | Past deadline | Greyed out, moved to bottom |

### The Soft Signup Trigger (Not a Gate)

After a user views 3+ opportunities:
> "Skilved's agent found 47 more electrical opportunities in Gauteng this week. Create a free profile to get matched automatically."

After browsing a specific trade 2+ sessions:
> "You've looked at 12 welding opportunities. Tell Skilved your qualifications and it will find the best matches for you."

After sharing an opportunity:
> "Shared that one? Get Skilved to send you better matches every morning on WhatsApp."

**Rules:**
- Prompt appears once per session maximum
- Dismissible with one tap, never returns that session
- Never blocks content
- Never darkens/blurs content behind it

---

## The AI Agent Architecture (MVP)

> **See `technical/24_AI_Employees_Architecture.md` for the full specification of all 8 agents.**  
> This section covers build priority and MVP scope per agent.

### The 8 AI Employees — Build Order

| # | Agent | MVP build week | Core job |
|---|---|---|---|
| 1 | **Scout** | Week 1 | Find every SA trades opportunity every 4 hours |
| 2 | **Analyst** | Week 1 | Extract structured intelligence from every opportunity |
| 3 | **Matching** | Week 2 | Rank opportunities for each user on every feed load |
| 4 | **Career** | Week 3 | Map each worker's path to their goal |
| 5 | **Application** | Week 5–6 | Apply autonomously on user's behalf |
| 6 | **Revenue** | Week 7–8 | Make monetisation decisions autonomously |
| 7 | **Growth** | Week 9–10 | Create content, seed communities, manage referrals |
| 8 | **Customer Success** | Week 3 (basic) | Onboard users, resolve support queries |

### Agent 1: Scout Agent
**Runs:** Every 4 hours, 24/7  
**What it does:** Crawls 50+ sources, extracts structured opportunity data, deduplicates, publishes to feed. No human trigger. No human review.  
**Sources (MVP):** All 21 SETA portals, Indeed SA, PNet, CareerJunction, Government Gazette, NAMB, provincial skills portals, top 50 employer career pages  
**GCP Stack:** Cloud Scheduler → Cloud Pub/Sub → Cloud Run → Vertex AI Search → Firestore → BigQuery

### Agent 2: Analyst Agent
**Runs:** Triggered by every new opportunity from Scout (Pub/Sub)  
**What it does:** Reads every opportunity. Extracts: location, requirements, salary, deadline, qualifications, application complexity, organisation reputation, application method. Creates structured OpportunityIntelligence object. Determines if Application Agent can auto-apply.  
**GCP Stack:** Cloud Pub/Sub → Cloud Run → Gemini API (structured extraction) → Firestore → BigQuery

### Agent 3: Matching Agent
**Runs:** On every feed request; background nightly re-rank for all users  
**What it does:** Ranks all opportunities for each user. Anonymous: filter selections + session signals. Authenticated: full profile. Generates 1-sentence match explanation. Retrains weekly on outcome data.  
**GCP Stack:** Vertex AI Ranking API → Cloud Run → Redis (cache) → Gemini (explanations) → BigQuery

### Agent 4: Career Agent
**Runs:** On profile completion; weekly update per user  
**What it does:** Analyses worker's current skills vs. goals. Maps specific steps to target role. Identifies which current Skilved opportunities advance them. Sends weekly career insight via WhatsApp.  
**GCP Stack:** Cloud Run → Gemini (career reasoning) → BigQuery (graph queries) → Firestore → WhatsApp API

### Agent 5: Application Agent *(the XPRIZE differentiator)*
**Runs:** On user permission trigger (one tap: "Apply for me")  
**What it does:** Generates tailored CV, writes specific cover letter, fills application form (email or web), submits, captures reference, sets up follow-up tracking.  
**Permission levels:** Level 3 (semi-auto, >85% match), Level 4 (full-auto, all matches above minimum)  
**GCP Stack:** Cloud Run (Playwright) → Gemini (CV + cover letter) → Gmail API/SMTP → Firestore → BigQuery

### Agent 6: Revenue Agent
**Runs:** Event-driven (user behaviour signals)  
**What it does:** Decides when to prompt upgrades, what price to offer, which users are upgrade-ready, pricing experiments. Makes monetisation decisions autonomously.  
**GCP Stack:** Cloud Functions → Gemini (decision reasoning) → Firestore → WhatsApp API → BigQuery

### Agent 7: Growth Agent
**Runs:** Daily (content), weekly (community seeding, SEO)  
**What it does:** Creates and publishes social content, seeds WhatsApp communities, manages referral programme, generates SEO content, activates ambassadors.  
**GCP Stack:** Cloud Scheduler → Cloud Run → Gemini (content) → Meta API → Google Search Console API → BigQuery

### Agent 8: Customer Success Agent
**Runs:** Always-on (WhatsApp inbound + scheduled onboarding)  
**What it does:** Onboards new users with personalised journey, resolves support queries via WhatsApp, manages 30-day onboarding sequence, escalates edge cases to weekly human review.  
**GCP Stack:** WhatsApp API → Cloud Functions → Gemini → Firestore (conversation history) → BigQuery

---

## Opportunity Types (MVP)

| Type | Definition | Source |
|---|---|---|
| Apprenticeship | Formal trade apprenticeship with employer, leads to trade test | SETA portals, employer sites |
| Learnership | NQF-aligned structured learning + work experience | SETA portals, LGSETA |
| Bursary | Financial study assistance for trade/technical qualifications | Corporate CSI, government |
| Job | Direct employment opportunity (artisan, technician, operator) | Job boards, employer sites |
| Trade test | Upcoming trade test registration windows | NAMB, SETA portals |
| Short course | Funded upskilling (< 6 months) | SETA discretionary grants |

---

## User Flows

### Flow 1: Anonymous Browse → Apply
```
Land on feed
→ See trade-filtered opportunities
→ Click opportunity card
→ Read full details (requirements, salary, deadline, how to apply)
→ Click "Apply"
→ Redirect to source application (external) OR in-app application form
→ Confirmation + "Get notified of similar opportunities?" prompt
```

### Flow 2: Anonymous → Account Creation
```
Browse 3+ opportunities
→ See soft personalisation prompt
→ "Get Skilved" CTA
→ Quick profile: Trade category + Province + Highest qualification (3 fields)
→ Optional: WhatsApp number for daily digest
→ Immediately see personalised feed
→ "Your Skilved profile is 20% complete — add your qualifications to unlock better matches"
```

### Flow 3: Returning User (Logged In)
```
Land on feed (personalised, picks up where they left off)
→ "New since your last visit: 12 opportunities"
→ Opportunity cards ranked by match score
→ "Skilved found this 2 hours ago and thinks it's a strong match because: [trade + location + qualification level]"
```

---

## Profile (Optional, Progressive)

### Profile Completion Levels

| Level | Fields | Unlock |
|---|---|---|
| Starter (20%) | Trade + Province | Basic personalisation |
| Active (40%) | + Qualification level + Years experience | Better matching, WhatsApp digest |
| Strong (60%) | + Certificates/NQF level + Employment status | Application autofill, employer visibility |
| Skilved (80%) | + Work history + References | Employer search, "Skilved" badge |
| Verified (100%) | + MyMzansi credential link (Phase 2) | Verified badge, premium employer access |

### What a Skilved Profile Contains (MVP)
- Trade category (primary + secondary)
- Province
- Qualification level (Grade 10 / Grade 12 / N1–N6 / NQF 1–8 / Trade tested)
- Certificates (self-reported in MVP, verified in Phase 2)
- Work history (free text in MVP)
- Employment status
- Opportunity preferences (type, salary range, travel willingness)
- WhatsApp number (optional, for digest)
- Application history (auto-tracked)

---

## Technical Stack (MVP)

### Frontend
- **Framework:** Next.js 14 (App Router) — PWA
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Hosting:** Vercel (fast global CDN, easy CI/CD)

### Backend
- **API:** Next.js API routes + tRPC
- **Database:** Firestore (opportunity store + user profiles)
- **Search:** Vertex AI Search (opportunity discovery + ranking)
- **Analytics:** BigQuery (outcome tracking + graph seed)
- **Auth:** Firebase Auth (optional, social + phone number)
- **Messaging:** WhatsApp Business API (Meta) + Twilio fallback

### AI / Agents
- **Gemini 1.5 Pro:** Quality agent, opportunity extraction, matching explanations
- **Vertex AI Search:** Opportunity indexing and retrieval
- **Vertex AI Ranking:** Personalised feed ranking
- **Cloud Scheduler:** Agent trigger orchestration
- **Cloud Run:** Agent execution environment
- **Cloud Pub/Sub:** Event-driven agent communication

### Infrastructure
- **GCP Project:** Primary cloud platform (XPRIZE requirement)
- **Cloud Run:** All agent workloads
- **Cloud Storage:** Opportunity source cache
- **Cloud Monitoring:** Agent health + alert pipeline
- **BigQuery:** The graph — every event, every outcome

---

## The Graph Schema (Plant the Seed Now)

Every user interaction is logged to BigQuery from day one. This is the graph we are building.

```sql
-- Core tables (MVP)
opportunities (id, title, type, trade, province, salary, deadline, source, quality_score, discovered_at)
users (id, trade, province, qual_level, created_at, source_channel)
events (user_id, opportunity_id, event_type, timestamp, session_id)
  -- event_types: view, detail_view, share, apply_click, apply_complete, save
outcomes (user_id, opportunity_id, outcome_type, reported_at)
  -- outcome_types: applied, interviewed, offered, accepted, rejected, no_response
```

This schema is the foundation of the SA Skills Graph. Every row is a data point that competitors cannot buy.

---

## MVP Success Metrics

### Week 2 (First Revenue Gate)
- [ ] 200+ opportunities live across all trade categories
- [ ] First paying employer (R500+ referral fee)
- [ ] Scout + Analyst agents running on 4-hour cycle
- [ ] Matching Agent live

### Day 30
- [ ] 2,000+ opportunities indexed
- [ ] 500+ registered users
- [ ] 50+ daily active anonymous users
- [ ] 5+ paying employers / SETAs
- [ ] Career Agent live (career plans generating)
- [ ] Customer Success Agent handling onboarding
- [ ] Permission model Level 1 + 2 live
- [ ] Apply click rate > 15%
- [ ] WhatsApp share rate > 8%

### Day 60
- [ ] Application Agent live (email applications)
- [ ] Permission Level 3 (semi-auto) live
- [ ] Worker Premium subscriptions billing live
- [ ] First Premium subscribers (R200–R500/month)
- [ ] Revenue Agent live (upgrade prompt decisions)
- [ ] 2,000+ registered users
- [ ] 20+ paying employers / SETAs

### Day 90 (XPRIZE submission)
- [ ] All 8 agents running autonomously (demonstrable)
- [ ] Application Agent — web form submission live
- [ ] Permission Level 4 (full-auto) available
- [ ] Growth Agent live
- [ ] 10,000+ opportunities indexed
- [ ] 5,000+ registered users
- [ ] 200+ Premium subscribers
- [ ] 50+ paying employers / SETAs
- [ ] R300,000–415,000 total revenue
- [ ] 200+ trackable placements (applied → outcome)
- [ ] All 12 trade categories active
- [ ] All 9 provinces covered
- [ ] Agent autonomy dashboard: zero human approvals demonstrable

---

## What We Are NOT Building in MVP

To be explicit about scope:

- No employer-side dashboard (v1.1)
- No in-app chat between worker and employer (v1.2)
- No MyMzansi integration (Phase 2)
- No mobile app (Phase 2)
- No AI career coaching conversations (v1.2)
- No salary negotiation agent (v2)
- No SETA management portal (Phase 2)
- No white-collar / professional jobs (Phase 2)
- No pan-African expansion (Phase 3)

---

## MVP Timeline

| Week | Milestone |
|---|---|
| 1 | Scout Agent live, Analyst Agent live, first 500 opportunities indexed |
| 1 | Feed UI live (anonymous, public) |
| 2 | Matching Agent live, first personalisation and match explanations |
| 2 | First employer / SETA outreach, first revenue |
| 3 | Profile creation flow live |
| 3 | Career Agent live (career plans on profile completion) |
| 3 | Customer Success Agent live (onboarding sequence) |
| 4 | Quality Agent live, scam detection |
| 4 | WhatsApp digest (Notification Agent) live |
| 5 | Outcome tracking live, graph seeding begins |
| 5–6 | **Application Agent v1 live (email applications)** |
| 6 | Permission Level 3 (semi-auto) live |
| 6 | Worker Premium subscriptions billing live |
| 7–8 | Revenue Agent live (upgrade prompt decisions) |
| 7–8 | All 12 trade categories, all 9 provinces |
| 9–10 | **Application Agent v2 (web form submission via Playwright)** |
| 9–10 | Growth Agent live (daily content + community seeding) |
| 10 | Permission Level 4 (full-auto) available |
| 11–12 | XPRIZE submission prep, agent autonomy dashboard, metrics compilation |

---

*Document version 1.0 — June 2026*  
*Next: PRD → Feed Development Plan → Pitch Deck*
