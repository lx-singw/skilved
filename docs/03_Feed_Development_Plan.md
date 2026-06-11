# Skilved — Feed Development Plan
### The First Surface Must Be Nailed | Version 1.0 | June 2026

---

## Why the Feed Is Everything

The feed is not a feature. It is the company's first impression, distribution mechanism, proof of agent quality, and viral loop — all in one surface.

Before a single user creates an account, before any employer pays a rand, before the graph has a single data point — the feed must work perfectly. It is the only thing standing between a visitor and a Skilved believer.

**The feed succeeds if:**
- A trades worker opens it and immediately sees something relevant to them
- They feel the AI is working for them, not just showing them a list
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

### Visual Hierarchy Per Card
1. **What is the opportunity?** (Title — largest, boldest)
2. **Where and what trade?** (Location + trade badge — immediate visual scan)
3. **What type and what money?** (Type pill + salary — the two decision criteria)
4. **How fresh?** (Agent timestamp — builds trust)
5. **When does it close?** (Deadline — urgency)
6. **Actions** (View / Share / Apply — always visible)

### The Freshness Signal Is Critical
"Found 2 hours ago by Skilved" is not a vanity metric. It is the proof that the agent is alive and working. It differentiates Skilved from every static job board. It creates urgency. It builds trust.

Every card must show this.

---

## Feed Component Specification

### Opportunity Card (Standard)

```
┌─────────────────────────────────────────┐
│ [NEW] ELECTRICAL APPRENTICESHIP          │ ← Title (bold, 16px)
│ Eskom Holdings · Johannesburg, GP        │ ← Org + Location (14px, muted)
│                                          │
│ [Apprenticeship] [Electrical] [Gauteng]  │ ← Trade + Type + Province pills
│                                          │
│ R4,500/month stipend                     │ ← Salary (green, prominent)
│ Closes: 15 July 2026 · Found 2h ago ✦   │ ← Deadline + Freshness
│                                          │
│ [View Details]  [Apply Now]  [↗ Share]   │ ← Actions
└─────────────────────────────────────────┘
```

### Opportunity Card States

**Fresh (< 24 hours):**
- Green "New" badge top-left
- Slightly elevated card (box shadow)
- Freshness timestamp in green

**Active (1–7 days):**
- Standard card, no badge
- Freshness timestamp in muted grey

**Closing Soon (< 3 days):**
- Orange "Closing Soon" badge
- Deadline text in orange
- Subtle pulse animation on deadline

**Expired:**
- Greyed out, reduced opacity
- "Opportunity closed" label
- Moved to end of feed, then removed within 1 hour

**Matched (logged-in user):**
- Teal "Strong match" or "Good match" badge
- 1-sentence match reason: "Matches your electrical trade in Gauteng"

### Card Interaction States
- **Hover/tap:** Slight background lift, cursor pointer
- **Viewed:** Subtle left border accent (distinguishes seen from unseen)
- **Saved:** Bookmark icon fills
- **Applied:** "Applied" badge replaces Apply button

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

### Filter UX Rules
- Filters apply immediately, no "Apply filters" button
- Active filter count shown on "More filters" button
- "Clear all" visible when any filter active
- Filter state persists in URL (shareable filtered views)
- Estimated result count updates as filters change

### Smart Filter Suggestions
After 2 sessions, feed shows:
> "You always look at Electrical in Gauteng — set this as your default?"

One tap to set. Persists without account.

---

## Sorting & Ranking Logic

### Anonymous Users
Default sort: **Relevance** (based on filter selections + browser signals)

Ranking formula:
```
relevance_score = (
  trade_match * 0.40 +
  province_match * 0.25 +
  freshness_score * 0.20 +
  quality_score * 0.15
)
```

### Logged-In Users
Default sort: **Match score** (full profile considered)

Ranking formula:
```
match_score = (
  trade_match * 0.35 +
  qualification_fit * 0.25 +
  province_match * 0.20 +
  freshness_score * 0.10 +
  quality_score * 0.10
)
```

Match is recomputed on profile update and nightly for all users.

---

## Feed Sections

The feed is not one undifferentiated list. It has sections that create rhythm and narrative:

### Section 1: "New today" (top, 3–5 cards)
Opportunities found by the agent in the last 24 hours. Always fresh. This section proves the agent is working every time a user visits.

### Section 2: "Best matches for you" (logged-in only, 5–8 cards)
Top-ranked opportunities from the current profile. Personalised. Labelled with match reason.

### Section 3: "All opportunities" (main feed, infinite scroll)
Full ranked list with all active opportunities. Default for anonymous users.

### Section 4: "Closing soon" (sticky at bottom of viewport, dismissible)
2–3 opportunities closing within 72 hours matching current filter. Urgency section.

---

## Feed Performance Requirements

| Metric | Target | Why |
|---|---|---|
| Initial load (4G mobile) | < 1.5 seconds | SA 4G average: ~15Mbps. Users bounce at 3s. |
| Filter update | < 300ms | Must feel instant, not like a page load |
| Infinite scroll load | < 500ms | Next batch must appear before user notices |
| Image loading | Lazy, progressive | Above-fold images only on initial load |
| Agent data freshness | < 4 hours | Newest opportunities never older than 4 hours |

### Performance Architecture
- Feed data served from Firestore (low-latency reads)
- First 50 results server-side rendered (Next.js SSR) for SEO + speed
- Subsequent loads client-side (React Query)
- Opportunity images: none in MVP (text-only cards = faster)
- Skeleton loading states (not spinners)

---

## SEO Architecture

The feed must be discoverable. Every trade + province combination is a high-intent search.

### URL Structure
```
skilved.com/                           → All opportunities feed
skilved.com/electrical/                → Electrical trade feed
skilved.com/electrical/gauteng/        → Electrical + Gauteng feed
skilved.com/learnerships/              → All learnerships
skilved.com/opportunity/[slug]         → Individual opportunity
```

### Meta Tags Per Feed Page
```html
<title>Electrical Apprenticeships in Gauteng | Skilved</title>
<meta name="description" content="47 electrical apprenticeships, 
learnerships and jobs in Gauteng. Updated by AI every 4 hours. 
Apply directly, no signup required.">
```

### Structured Data (JSON-LD)
JobPosting schema for every opportunity. Enables Google Jobs integration — free distribution to every SA jobs seeker searching Google.

### Target Keywords
- "electrical apprenticeship Gauteng 2026"
- "welding learnership South Africa"
- "MERSETA learnership"
- "EWSETA apprenticeship"
- "[trade] bursary South Africa"
- "artisan jobs [province]"

---

## WhatsApp Share Flow

WhatsApp is the primary viral distribution channel. The share UX must be effortless.

### Share Button Behaviour
1. Tap share icon on any card or detail view
2. Pre-filled WhatsApp message opens immediately:

```
💡 Found this on Skilved:

*Electrical Apprenticeship — Eskom Holdings*
📍 Johannesburg, Gauteng
💰 R4,500/month
📅 Closes 15 July 2026

Full details + apply: skilved.com/opportunity/eskom-electrical-gauteng-july26

Get matched to more: skilved.com
```

3. User selects contact / group from WhatsApp
4. Sent. Done.

### Share Attribution
Every shared link carries a UTM parameter tracing back to the sharer's session. This tracks:
- Which opportunities go viral
- Which users are the top sharers (potential ambassadors)
- Which WhatsApp groups are driving traffic (inferred from referral spikes)

---

## Feed Content Quality Standards

Every opportunity published to the feed must meet these standards:

| Field | Requirement |
|---|---|
| Title | Clear, specific, not "Various positions" |
| Organisation | Named entity (not "A leading company") |
| Location | Province minimum, city preferred |
| Type | One of 6 defined types |
| Requirements | Minimum 1 requirement stated |
| Application URL | Valid, working URL |
| Deadline | Date present or "Open until filled" |
| Salary/stipend | Amount or "Funded" or "Market related" |

Opportunities failing 3+ fields are rejected by the quality agent. Opportunities failing application URL or title are always rejected.

---

## Feed Development Sprint Plan

### Sprint 1 (Days 1–7): Core Feed
**Goal:** Public feed live with real data

- [ ] Next.js project setup, Vercel deployment
- [ ] Firestore schema for opportunities
- [ ] Discovery agent v1: crawl 10 SETA sources
- [ ] Opportunity card component (all states)
- [ ] Feed page with Trade + Province filters
- [ ] Detail view page
- [ ] External apply redirect + click logging
- [ ] BigQuery pipeline (feed_view, opportunity_view, apply_click)
- [ ] Basic mobile responsive (375px)

**Launch criteria:** 200+ real opportunities, feed loads in < 2s, apply works

### Sprint 2 (Days 8–14): Matching + Share
**Goal:** Feed feels intelligent, shareable

- [ ] Matching agent v1: anonymous ranking
- [ ] Match score on cards (anonymous version)
- [ ] WhatsApp share button + pre-filled message
- [ ] Soft personalisation prompt (trigger after 3 views)
- [ ] URL-based filter persistence
- [ ] Closing soon section
- [ ] SEO meta tags + structured data
- [ ] Discovery agent expanded to 30 sources

**Launch criteria:** Share working, filters persisting, 500+ opportunities

### Sprint 3 (Days 15–21): Accounts + Profile
**Goal:** Optional signup, personalised experience

- [ ] WhatsApp OTP signup
- [ ] Google OAuth
- [ ] Minimum profile (Trade + Province)
- [ ] Personalised feed for logged-in users
- [ ] Match explanation ("Matched because...")
- [ ] Profile completion progress
- [ ] Application tracking (save applied state)
- [ ] "New today" section
- [ ] "Best matches" section (logged-in)

**Launch criteria:** Signup < 60s, personalised feed live

### Sprint 4 (Days 22–30): Quality + Notifications
**Goal:** Feed quality high, notifications driving return

- [ ] Quality agent: scam detection, duplicate removal
- [ ] WhatsApp daily digest (7am)
- [ ] Expired opportunity removal (< 1 hour)
- [ ] Public profile page (skilved.com/[username])
- [ ] Outcome reporting flow
- [ ] All 12 trade categories validated
- [ ] All 9 provinces validated
- [ ] Discovery agent expanded to 50+ sources

**Launch criteria:** Zero scam listings, digest sending, quality agent running

### Sprint 5–6 (Days 31–45): Polish + Scale
**Goal:** Feed feels production-grade, scaling to thousands

- [ ] Skeleton loading states
- [ ] Offline graceful degradation
- [ ] PWA manifest (installable)
- [ ] Performance optimisation (target < 1.5s)
- [ ] A/B test: card layouts (2 variants)
- [ ] A/B test: signup prompt copy (3 variants)
- [ ] POPIA consent implementation
- [ ] Error states (empty filter results, network failure)
- [ ] Accessibility audit (WCAG 2.1 AA)

---

## Feed Metrics Dashboard

Live dashboard in BigQuery Studio tracking:

| Metric | Target (Day 30) | Target (Day 90) |
|---|---|---|
| Daily active users (feed views) | 500+ | 5,000+ |
| Opportunities in feed | 2,000+ | 10,000+ |
| Apply click rate | > 15% | > 20% |
| WhatsApp share rate | > 8% | > 12% |
| Feed → signup conversion | > 5% | > 10% |
| Return visit rate (7-day) | > 30% | > 45% |
| Avg session duration | > 2 min | > 3 min |
| Agent freshness (avg age) | < 24 hours | < 8 hours |

---

## What Makes This Feed Different From Every Other Job Board

| Feature | Skilved | PNet / Indeed / CareerJunction |
|---|---|---|
| AI discovers opportunities | ✅ Every 4 hours | ❌ Employer posts manually |
| No login to see full details | ✅ Always | ❌ Often gated |
| Freshness signal | ✅ "Found 2h ago" | ❌ "Posted 3 weeks ago" |
| Trades-specific filtering | ✅ 12 trade categories | ❌ Generic keyword only |
| SETA learnerships included | ✅ All 21 SETAs crawled | ❌ Rarely |
| Trade tests and bursaries | ✅ All types | ❌ Jobs only mostly |
| WhatsApp share + digest | ✅ Native | ❌ None |
| Match explanation | ✅ Per card | ❌ None |
| Outcome tracking | ✅ Graph building | ❌ None |
| No promoted/fake listings | ✅ Quality agent filters | ❌ Pay-to-post model |

---

*Document version 1.0 — June 2026*  
*Owner: Engineering + Design*  
*This document is the single source of truth for the Skilved feed*
