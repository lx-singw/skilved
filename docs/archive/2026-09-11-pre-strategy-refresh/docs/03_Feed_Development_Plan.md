# Skilved — Feed Development Plan
### The First Surface Must Be Nailed | Version 2.0 | June 2026

---

## Table of Contents

- [Why the Feed Is Everything](#why-the-feed-is-everything)
- [Design Philosophy](#design-philosophy)
- [Feed Component Specification](#feed-component-specification)
- [Intelligence Layer on Feed Cards — NEW v2.0](#intelligence-layer-on-feed-cards--new-v20)
- [Filter System](#filter-system)
- [Sorting & Ranking Logic](#sorting--ranking-logic)
- [Feed Sections](#feed-sections)
- [Feed Performance Requirements](#feed-performance-requirements)
- [SEO Architecture](#seo-architecture)
- [WhatsApp Share Flow](#whatsapp-share-flow)
- [Feed Content Quality Standards](#feed-content-quality-standards)
- [Feed Development Sprint Plan](#feed-development-sprint-plan)
- [Feed Metrics Dashboard](#feed-metrics-dashboard)
- [What Makes This Feed Different](#what-makes-this-feed-different-from-every-other-job-board)
- [Change Log](#change-log)

---

## Why the Feed Is Everything

The feed is not a feature. It is the company's first impression, distribution mechanism, proof of agent quality, and viral loop — all in one surface.

Before a single user creates an account, before any employer pays a rand, before the graph has a single data point — the feed must work perfectly. It is the only thing standing between a visitor and a Skilved believer.

**The feed succeeds if:**
- A trades worker opens it and immediately sees something relevant to them
- They feel the AI is working for them, not just showing them a list
- They can see, without logging in, that employers are being held accountable
- They share it with someone in their trade WhatsApp group
- They come back tomorrow without being asked

**The feed fails if:**
- It looks like any other job board
- It shows irrelevant opportunities
- It asks for an account before showing value
- It feels slow on a mid-range Android on 4G

---

## Design Philosophy

### Tone: Industrial Precision
The feed should feel like it was built for people who work with their hands and their skills. Not corporate. Not startup-cute. Precise, trustworthy, honest about what it knows and doesn't know.

Every element earns its place. No decorative clutter. High information density done elegantly. The agent is visible — users should feel the AI working, not be confused by it.

### Visual Hierarchy Per Card (Updated v2.0)
1. **What is the opportunity?** (Title — largest, boldest)
2. **Where and what trade?** (Location + trade badge — immediate visual scan)
3. **What type and what money?** (Type pill + salary — two decision criteria)
4. **How fresh?** (Agent timestamp — builds trust)
5. **When does it close?** (Deadline — urgency)
6. **Is the employer trusted?** (Accountability score — NEW v2.0)
7. **What are people like me doing?** (Cohort intelligence — authenticated only — NEW v2.0)
8. **Actions** (View / Share / Apply — always visible)

### The Freshness Signal Is Critical
"Found 2 hours ago by Skilved" is not a vanity metric. It is the proof that the agent is alive and working. It differentiates Skilved from every static job board. It creates urgency. It builds trust.

Every card must show this.

### The Employer Score Is Visible to All — NEW v2.0
Employer accountability scores are shown to anonymous and authenticated users alike. This builds trust in the platform, not just in specific employers. An anonymous user seeing "★ Employer Score: A (94/100) · 8 placements" knows this is not a fake listing.

---

## Feed Component Specification

### Opportunity Card (Standard — Updated v2.0)

```
┌─────────────────────────────────────────┐
│ [NEW] ELECTRICAL APPRENTICESHIP          │ ← Title (bold, 16px)
│ Eskom Holdings · Johannesburg, GP        │ ← Org + Location
│                                          │
│ [Apprenticeship] [Electrical] [Gauteng]  │ ← Trade + Type + Province pills
│                                          │
│ R4,500/month stipend                     │ ← Salary (green)
│ Closes: 15 July 2026 · Found 2h ago ✦   │ ← Deadline + Freshness
│                                          │
│ ★ Employer: A (94/100)                  │ ← NEW: Accountability Score
│   8 Skilved placements · 92% completed  │ ← NEW: Score context
│                                          │
│ 👥 3 people like you applied · 2 inter. │ ← NEW: Cohort intelligence (auth only)
│                                          │
│ [View Details]  [Quick View]  [↗ Share]   │ ← Actions
└─────────────────────────────────────────┘
```

### Opportunity Card — Anonymous vs Authenticated

**Anonymous view:**
- Employer Score shown (grade + numeric) — public
- Cohort intelligence NOT shown ("Create passport to see what people like you are doing")
- Match score NOT shown

**Authenticated view (passport ≥ 20%):**
- Employer Score shown
- Cohort intelligence shown ("3 people like you applied · 2 got interviews")
- Match score shown (passport ≥ 40%)
- "Apply for me" button shown (Level 3+)

### Opportunity Card States

**Fresh (< 24 hours):**
- Green "New" badge
- Freshness timestamp in green

**Active (1–7 days):**
- Standard card
- Freshness in muted grey

**Closing Soon (< 3 days):**
- Orange "Closing Soon" badge
- Deadline in orange
- Subtle pulse animation

**Expired:**
- Greyed out
- Moved to end, removed within 1 hour

**Matched (logged-in user):**
- Teal "Strong match" or "Good match" badge
- 1-sentence match reason

**High Accountability Employer — NEW v2.0:**
- Gold star indicator next to employer name
- "★ A Employer" badge on card

**Low Accountability Employer — NEW v2.0:**
- Amber warning indicator
- "⚠️ Check employer score" note
- Full score visible on detail page

---

## Intelligence Layer on Feed Cards — NEW v2.0

### Employer Accountability Score Display

```typescript
interface EmployerScoreDisplay {
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | null;
  score: number | null;
  sampleSize: number;
  placementRate?: number;
  completionRate?: number;
  displayState: 'full' | 'grade_only' | 'insufficient' | 'hidden';
}

function getScoreDisplayState(
  score: EmployerAccountabilityScore | null
): EmployerScoreDisplay {
  if (!score || score.sampleSize < 3) {
    return { grade: null, score: null, sampleSize: 0, displayState: 'hidden' };
  }
  if (score.sampleSize < 5) {
    return { ...score, displayState: 'grade_only' }; // show grade, not full breakdown
  }
  return { ...score, displayState: 'full' };
}
```

**Display rules:**
- `sampleSize < 3`: Don't show score (insufficient data)
- `sampleSize 3–4`: Show grade only ("B Employer — limited data")
- `sampleSize 5+`: Show grade + numeric + key metric

### Cohort Intelligence Display

```typescript
interface CohortIntelligenceDisplay {
  cohortSize: number;
  applicants: number;
  interviews: number;
  placements: number;
  isTopForCohort: boolean;
  displayState: 'full' | 'views_only' | 'hidden';
}
```

**Display rules:**
- Authenticated users only (passport ≥ 20%)
- `applicants < 3`: Show views only ("X people with your profile viewed this")
- `applicants >= 3`: Show applies + outcomes
- `cohortSize < 5`: Don't show anything (privacy threshold)

### Career Simulation Teaser on Cards (Sprint 3)

When a user views an opportunity that requires a qualification they're close to having:

```
┌─────────────────────────────────────────┐
│ ELECTRICAL APPRENTICESHIP                │
│ Eskom Holdings · Johannesburg            │
│                                          │
│ 💡 Getting your N4 would make you a     │ ← Career Simulation teaser
│    95% match for this (currently 67%)   │
│    [See what N4 does to your career]     │
│                                          │
│ [View Details]  [Quick View]  [Share]     │
└─────────────────────────────────────────┘
```

This drives Career Simulation Engine usage from the feed itself.

---

## Filter System

### Primary Filters (always visible, above fold)

| Filter | Options | Behaviour |
|---|---|---|
| Trade | All 12 categories + "All trades" | Single select, pill style |
| Province | All 9 provinces + "All provinces" | Single select, pill style |

### Secondary Filters (expandable "More filters")

| Filter | Options | Behaviour |
|---|---|---|
| Opportunity type | Apprenticeship, Learnership, Bursary, Job, Trade test, Short course | Multi-select |
| Salary range | Any, R0 (funded/stipend), R3K–R6K, R6K–R12K, R12K+ | Single select |
| Closing window | Any, Closing this week, Closing this month | Single select |
| Experience required | Entry level, 1–3 years, 3+ years, Trade tested | Single select |
| **Employer score** | **Any, A only, A or B, Hide D/F** | **Single select — NEW v2.0** |

### Filter UX Rules
- Filters apply immediately
- Active filter count shown on "More filters" button
- "Clear all" visible when any filter active
- Filter state persists in URL
- Result count updates as filters change

### Smart Filter Suggestions
After 2 sessions:
> "You always look at Electrical in Gauteng — set this as your default?"

After filtering by employer score:
> "You filtered for A employers. Skilved has 12 A-rated employers with electrical opportunities right now."

---

## Sorting & Ranking Logic

### Anonymous Users
Default sort: **Relevance** (filter selections + browser signals)

```
relevance_score = (
  trade_match * 0.35 +
  province_match * 0.25 +
  freshness_score * 0.20 +
  quality_score * 0.10 +
  employer_accountability_score * 0.10  ← NEW v2.0
)
```

### Logged-In Users
Default sort: **Match score** (full profile + cohort signals)

```
match_score = (
  trade_match * 0.30 +
  qualification_fit * 0.20 +
  province_match * 0.15 +
  freshness_score * 0.10 +
  quality_score * 0.10 +
  employer_accountability_score * 0.10  ← NEW v2.0
  cohort_success_rate * 0.05            ← NEW v2.0
)
```

*Employer accountability score as 10% signal means A-rated employers rank slightly higher. Not dominant — opportunity quality still drives ranking — but a meaningful tiebreaker.*

---

## Feed Sections

### Section 1: "New today" (top, 3–5 cards)
Opportunities found in last 24 hours. Always fresh.

### Section 2: "Best matches for you" (logged-in only, 5–8 cards)
Top-ranked opportunities from profile. Personalised.

### Section 3: Cohort Intelligence Banner — NEW v2.0
Shown once per session for authenticated users. Between cards 5 and 10.

```
┌──────────────────────────────────────────────────┐
│ 👥 What N3 electricians in Gauteng are doing     │
│                                                   │
│ This week: 12 people with your profile applied   │
│ for learnerships.                                 │
│                                                   │
│ Top pick: EWSETA Solar Apprenticeship            │
│ 4 applied · 3 got interviews (75% rate) ⭐        │
│                                                   │
│ [View it →]                    [Dismiss ×]        │
└──────────────────────────────────────────────────┘
```

### Section 4: "All opportunities" (main feed, infinite scroll)
Full ranked list. Default for anonymous users.

### Section 5: "Closing soon" (sticky at bottom, dismissible)
2–3 opportunities closing within 72 hours.

### Section 6: Skills Pulse Teaser — NEW v2.0
Shown once per session at bottom of feed (after 20+ cards scrolled).

```
┌──────────────────────────────────────────────────┐
│ 📊 SA Skills Intelligence — Updated Today        │
│                                                   │
│ Critical shortage: Electrical in Limpopo          │
│ 47 open opportunities · Only 12 qualified         │
│                                                   │
│ Best ROI this month: N4 Electrical in Gauteng    │
│ +R3,200/month median salary uplift               │
│                                                   │
│ [See full Skills Pulse →] [Dismiss]               │
└──────────────────────────────────────────────────┘
```

---

## Feed Performance Requirements

| Metric | Target | Notes |
|---|---|---|
| Initial load (4G mobile) | < 1.5 seconds | SA 4G average: ~15Mbps |
| Filter update | < 300ms | Must feel instant |
| Infinite scroll load | < 500ms | Next batch before user notices |
| Cohort intelligence injection | < 300ms additional | Redis-cached, negligible |
| Employer score display | < 100ms additional | Pre-fetched with opportunity |
| Agent data freshness | < 4 hours | Newest opportunities never older than 4 hours |

### Performance Architecture
- Feed data served from Firestore (low-latency reads)
- Employer accountability scores: pre-fetched with opportunity document (no extra query)
- Cohort intelligence: Redis cache (TTL 1 hour per opp/cohort pair)
- Career simulation teasers: pre-computed daily, cached
- First 50 results SSR (Next.js) for SEO + speed
- Subsequent loads client-side (React Query)
- No images in MVP (text-only cards)
- Skeleton loading states

---

## SEO Architecture

### URL Structure (Updated v2.0)
```
skilved.com/                           → All opportunities feed
skilved.com/electrical/                → Electrical trade feed
skilved.com/electrical/gauteng/        → Electrical + Gauteng feed
skilved.com/learnerships/              → All learnerships
skilved.com/opportunity/[slug]         → Individual opportunity
skilved.com/skills-pulse/              → National skills intelligence ← NEW
skilved.com/skills-pulse/electrical/   → Trade intelligence          ← NEW
skilved.com/employer/[slug]/           → Employer accountability profile ← NEW
```

### Target Keywords (Updated v2.0)
- "electrical apprenticeship Gauteng 2026"
- "welding learnership South Africa"
- "MERSETA learnership"
- "artisan jobs [province]"
- "best learnership employers South Africa" ← NEW (employer accountability SEO)
- "SA skills shortage 2026" ← NEW (Skills Pulse SEO)
- "N4 electrical salary South Africa" ← NEW (Career Simulation SEO)

---

## WhatsApp Share Flow

*(Unchanged from v1.0 — works as designed)*

WhatsApp is the primary viral distribution channel. Share message now includes employer score:

```
💡 Found this on Skilved:

*Electrical Apprenticeship — Eskom Holdings*
📍 Johannesburg, Gauteng
💰 R4,500/month
📅 Closes 15 July 2026
★ Employer Score: A (94/100) — 8 verified placements

Full details + apply: skilved.com/opportunity/eskom-electrical-gauteng-july26

Get matched to more: skilved.com
```

---

## Feed Content Quality Standards

*(Unchanged from v1.0, with addition)*

| Field | Requirement |
|---|---|
| Title | Clear, specific |
| Organisation | Named entity |
| Location | Province minimum |
| Type | One of 6 defined types |
| Requirements | Minimum 1 stated |
| Application URL | Valid, working |
| Deadline | Date or "Open until filled" |
| Salary/stipend | Amount, "Funded", or "Market related" |
| **ATS Platform** | **Detected and stored by Analyst Agent — NEW v2.0** |
| **Employer Score** | **Displayed when ≥ 3 verified outcomes available — NEW v2.0** |

---

## Feed Development Sprint Plan

### Sprint 1 (Days 1–7): Core Feed + ATS Detection + Skills Pulse v1
- [ ] Next.js project setup, Vercel deployment
- [ ] Firestore schema for opportunities (including `applicationPlatform` field)
- [ ] Scout agent v1: 3 portal spiders (PuffAndPass, RecentJobs, StudentRoom)
- [ ] **`ATSDetector` in Analyst Agent: URL + HTML pattern matching**
- [ ] Opportunity card component (all states including employer score placeholder)
- [ ] Feed page with Trade + Province filters
- [ ] **Employer score filter ("Hide D/F employers")**
- [ ] Detail view page
- [ ] External apply redirect + click logging
- [ ] BigQuery pipeline
- [ ] Basic mobile responsive (375px)
- [ ] **Skills Pulse Dashboard v1 — static page at `skilved.com/skills-pulse`**

### Sprint 2 (Days 8–14): Matching + Share + Collective Intelligence
- [ ] Matching agent v1: anonymous ranking (employer score as 10% signal)
- [ ] Match score on cards (anonymous version)
- [ ] WhatsApp share button + employer score in share message
- [ ] **Collective Intelligence Layer v1: "X people with your profile viewed this"**
- [ ] **Cohort intelligence banner on feed (between cards 5–10)**
- [ ] URL-based filter persistence
- [ ] Closing soon section
- [ ] SEO meta tags + structured data
- [ ] **Skills Pulse teaser at bottom of feed**

### Sprint 3 (Days 15–21): Accounts + Profile + Employer Accountability
- [ ] WhatsApp OTP signup
- [ ] Personalised feed for logged-in users
- [ ] **Employer accountability scores live on cards (early data)**
- [ ] **Cohort intelligence v2: "X applied · Y got interviews"**
- [ ] **Career simulation teasers on cards**
- [ ] "New today" section
- [ ] "Best matches" section

### Sprint 4 (Days 22–30): Quality + Intelligence + Notifications
- [ ] Quality agent: scam detection, duplicate removal
- [ ] WhatsApp daily digest with cohort intelligence addition
- [ ] **Collective Intelligence v3 — full outcome data on cards**
- [ ] **Employer accountability scores — statistically significant**
- [ ] **Skills Pulse Dashboard v2 — fully automated**
- [ ] Expired opportunity removal
- [ ] All 12 trade categories + 9 provinces validated

### Sprint 5–6 (Days 31–45): Polish + Scale
- [ ] Skeleton loading states
- [ ] Offline graceful degradation
- [ ] PWA manifest (installable)
- [ ] Performance optimisation (target < 1.5s)
- [ ] A/B test: card layouts (employer score prominence)
- [ ] POPIA consent implementation
- [ ] Accessibility audit (WCAG 2.1 AA)

---

## Feed Metrics Dashboard

| Metric | Target (Day 30) | Target (Day 90) |
|---|---|---|
| Daily active users | 500+ | 5,000+ |
| Opportunities in feed | 2,000+ | 10,000+ |
| Apply click rate | > 15% | > 20% |
| WhatsApp share rate | > 8% | > 12% |
| Feed → signup conversion | > 5% | > 10% |
| Return visit rate (7-day) | > 30% | > 45% |
| **Employer score filter usage** | **> 15% of sessions** | **> 25%** |
| **Cohort intelligence displays** | **1,000+/day** | **20,000+/day** |
| **Skills Pulse page views** | **200+/day** | **2,000+/day** |
| **Career simulation teasers clicked** | **> 10% of impressions** | **> 15%** |

---

## What Makes This Feed Different From Every Other Job Board

| Feature | Skilved | PNet / Indeed / CareerJunction |
|---|---|---|
| AI discovers opportunities | ✅ Every 4 hours | ❌ Employer posts manually |
| No login to see full details | ✅ Always | ❌ Often gated |
| Freshness signal | ✅ "Found 2h ago" | ❌ "Posted 3 weeks ago" |
| Trades-specific filtering | ✅ 12 trade categories | ❌ Generic keyword only |
| Portal aggregator sources | 3 SA portals crawled (PuffAndPass, RecentJobs, StudentRoom) | Rarely |
| **Employer accountability score** | ✅ **Verified from real outcomes** | ❌ None |
| **Cohort intelligence** | ✅ **"3 people like you applied"** | ❌ None |
| **Career simulation teasers** | ✅ **"N4 would make you 95% match"** | ❌ None |
| **National skills intelligence** | ✅ **Skills Pulse Dashboard** | ❌ None |
| WhatsApp share + digest | ✅ Native | ❌ None |
| Match explanation | ✅ Per card | ❌ None |
| ATS adapter submissions | ✅ 8 platforms, 95% coverage | ❌ Manual apply only |
| Outcome tracking | ✅ Graph building | ❌ None |
| No promoted/fake listings | ✅ Quality agent filters | ❌ Pay-to-post model |

---

## Change Log

### v2.0 — June 2026
- Updated card design spec with employer score and cohort intelligence sections
- Added "Intelligence Layer on Feed Cards" section (employer score display, cohort intelligence display, career simulation teasers)
- Updated visual hierarchy (points 6 and 7 added)
- Added employer score filter to secondary filters
- Updated ranking formulas (employer score as 10% signal for both anon and authenticated)
- Added cohort intelligence banner as feed section
- Added Skills Pulse teaser as feed section
- Updated WhatsApp share message to include employer score
- Updated feed content quality standards with ATS platform and employer score fields
- Updated sprint plan (all 4 sprints updated with new deliverables)
- Updated feed metrics dashboard (3 new metrics)
- Updated "what makes this feed different" table (4 new rows)
- Added employer score to SEO URL structure and target keywords
- Added table of contents

*Document version 2.0 — June 2026*
*Owner: Engineering + Design*
*This document is the single source of truth for the Skilved feed*
