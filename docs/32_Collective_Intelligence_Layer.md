# Skilved — Collective Intelligence Layer
### "What Are People Like Me Doing?" | Agent 17 | Version 1.0 | June 2026

---

## Table of Contents

- [Why This Exists](#why-this-exists)
- [The XPRIZE Argument](#the-xprize-argument)
- [The Equity Insight](#the-equity-insight)
- [Agent 17: Collective Intelligence Agent](#agent-17-collective-intelligence-agent)
- [Cohort Definition](#cohort-definition)
- [What Workers See](#what-workers-see)
- [Privacy Design](#privacy-design)
- [Technical Implementation](#technical-implementation)
- [Data Progression](#data-progression)
- [Sprint Plan](#sprint-plan)
- [Integration with Other Agents](#integration-with-other-agents)

---

## Why This Exists

Right now, career intelligence in South Africa flows through social networks. The child of an Eskom employee knows which apprenticeships actually lead somewhere. The nephew of a MERSETA official knows which learnerships have stipend payment problems. The TVET student whose lecturer placed 50 graduates knows which employers are worth applying to.

Thandeka from Soweto, with no connections, has none of this. She guesses.

The Collective Intelligence Layer changes this. It surfaces the career intelligence that flows through elite networks — and makes it available to every worker on Skilved, grounded in verified real-world data, not rumour or privilege.

---

## The XPRIZE Argument

> "The most valuable career advice in South Africa flows through social networks that the most vulnerable workers don't have access to. Skilved captures this intelligence — from verified outcomes, not rumour — and gives every worker access to it. This is what equity looks like when AI has access to real data."

---

## The Equity Insight

**What privileged workers have always had:**
- "My uncle at Eskom says don't bother with the X programme, the stipend never gets paid"
- "The EWSETA solar learnership has a 90% placement rate — apply for that one"
- "Murray & Roberts takes their learnership seriously, but Group Five just warehouses people"

**What Skilved now gives every worker:**
The same intelligence, but verified by real outcomes, not anecdote. Better than the uncle's advice, because it's based on dozens of real verified trajectories, not one person's experience.

---

## Agent 17: Collective Intelligence Agent

### Job
For each authenticated user, identify their profile cohort, query recent outcomes and activity patterns, and surface cohort intelligence — what are people like you applying to, what's working, what's not — on the feed and in weekly digests.

### Runs
- Per feed load (authenticated, passport ≥ 20%): inject cohort data into feed response
- Daily batch: pre-compute cohort snapshots for all active cohort types
- Weekly: push "people like you" digest additions via Notification Agent

### GCP Stack
`Cloud Run (HTTP per feed request) → BigQuery (cohort queries) → Redis (cohort cache TTL 1h) → Gemini (narrative) → Firestore (cohort snapshots)`

---

## Cohort Definition

A cohort is a group of users with similar profile characteristics. Skilved uses a tiered approach to cohort definition — broader cohorts provide more data, narrower cohorts provide more relevant intelligence.

```typescript
interface CohortKey {
  primaryTrade: TradeCategory;
  province: Province;
  nqfLevel: number;        // exact match first, ±1 if insufficient
  experienceLevel: ExperienceLevel;
}

class CohortBuilder {
  async buildCohort(
    user: SkillsPassport,
    minSize: number = 5
  ): Promise<Cohort> {

    // Try narrowest cohort first
    let cohort = await this.query({
      trade: user.primaryTrade,
      province: user.province,
      nqfLevel: user.highestNqfLevel,
      experienceLevel: user.experienceLevel,
    });

    // Widen if too small
    if (cohort.size < minSize) {
      cohort = await this.query({
        trade: user.primaryTrade,
        province: user.province,
        nqfLevel: user.highestNqfLevel,
        // drop experience level filter
      });
    }

    if (cohort.size < minSize) {
      cohort = await this.query({
        trade: user.primaryTrade,
        province: user.province,
        // drop nqf and experience
      });
    }

    if (cohort.size < minSize) {
      cohort = await this.query({
        trade: user.primaryTrade,
        // drop province
      });
    }

    return cohort;
  }

  private async query(key: Partial<CohortKey>): Promise<Cohort> {
    const query = `
      SELECT u.id, u.primary_trade, u.province, u.highest_nqf_level
      FROM skilved_prod.users u
      WHERE u.primary_trade = @trade
        ${key.province ? 'AND u.province = @province' : ''}
        ${key.nqfLevel ? 'AND u.highest_nqf_level BETWEEN @nqfMin AND @nqfMax' : ''}
        ${key.experienceLevel ? 'AND u.experience_level = @experience' : ''}
        AND u.last_active_at > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
    `;

    const results = await this.bigquery.query(query, {
      trade: key.trade,
      province: key.province,
      nqfMin: key.nqfLevel ? key.nqfLevel - 1 : null,
      nqfMax: key.nqfLevel ? key.nqfLevel + 1 : null,
      experience: key.experienceLevel,
    });

    return {
      size: results.length,
      userIds: results.map(r => r.id),
      cohortDescription: this.describeCohort(key),
    };
  }

  describeCohort(key: Partial<CohortKey>): string {
    // Returns human-readable description for UI
    const parts = [key.trade];
    if (key.province) parts.push(key.province);
    if (key.nqfLevel) parts.push(`NQF ${key.nqfLevel}`);
    if (key.experienceLevel) parts.push(key.experienceLevel);
    return parts.join(', ');
  }
}
```

---

## What Workers See

### On Opportunity Cards (authenticated users, passport ≥ 20%)

**Phase 1 (no outcome data):**
```
┌─────────────────────────────────────────────────────┐
│ ELECTRICAL APPRENTICESHIP                            │
│ Eskom Holdings · Johannesburg                        │
│                                                      │
│ 👥 6 electricians in Gauteng viewed this            │
│    Most popular with N3 candidates this week         │
│                                                      │
│ R4,500/month · Closes 15 July                       │
└─────────────────────────────────────────────────────┘
```

**Phase 2 (with outcome data):**
```
┌─────────────────────────────────────────────────────┐
│ ELECTRICAL APPRENTICESHIP                            │
│ Eskom Holdings · Johannesburg                        │
│                                                      │
│ 👥 3 N3 electricians in Gauteng applied             │
│    2 got interviews · 1 placed ✓                    │
│    Highest success rate for your profile            │
│                                                      │
│ ★ Employer: A (94/100)                              │
│ R4,500/month · Closes 15 July                       │
└─────────────────────────────────────────────────────┘
```

### On Feed — Cohort Insight Banner

Shown once per session, between the 5th and 10th opportunity card:

```
┌─────────────────────────────────────────────────────┐
│ 👥 What N3 electricians in Gauteng are doing        │
│                                                      │
│ This week: 12 people with your profile applied for  │
│ learnerships. The top opportunity by success rate:  │
│                                                      │
│ EWSETA Solar Apprenticeship                         │
│ 4 applied · 3 got interviews (75% interview rate)   │
│                                                      │
│ [View it] [Show me more like this]  [Dismiss]       │
└─────────────────────────────────────────────────────┘
```

### On Profile Page — Cohort Intelligence Section

```
Your Career Cohort: N3 Electrical · Gauteng · Entry Level

47 workers with a similar profile are active on Skilved

📊 This month in your cohort:
   • 8 applied for EWSETA opportunities (most popular)
   • 3 got placements (avg: 67 days from application)
   • Top employer: Eskom (4 placements)
   • Average salary on placement: R4,800/month

📈 Your cohort trend:
   Demand for N3 electricians in Gauteng ↑ 18% this quarter

⚠️  Watch out for:
   CETA Construction Bursary — 2 in your cohort applied,
   0 got interviews. Low success rate for your profile.

[See all cohort opportunities] [Set cohort alerts]
```

### Weekly WhatsApp Digest Addition

Appended to the standard weekly digest:

```
👥 Your cohort update — N3 Electrical, Gauteng

This week, 12 people with your exact profile:
✅ 4 applied for EWSETA Solar Apprenticeship
   (3 got interviews — highest success rate in your cohort)
✅ 2 got their Wireman's licence
   (avg salary jump: R3,200/month within 18 months)
⚠️  Most are skipping the CETA bursary
   (low completion rate in your cohort: 31%)

Top opportunity for your cohort right now:
EWSETA Solar — 75% interview rate for N3 Gauteng
[View it →]
```

---

## Privacy Design

### Aggregation First

All cohort displays use aggregate data — never individual names or identifiable details.

**Rule 1:** No display if fewer than 5 users in cohort for a specific data point.

**Rule 2:** No display of individual user actions ("Thabo applied for this yesterday"). Only counts and percentages.

**Rule 3:** All outcome data is anonymized before aggregation — user IDs stripped, cohort statistics only.

**Rule 4:** Users can opt out of contributing to cohort statistics (but not from seeing them).

```typescript
interface CohortPrivacySettings {
  contributeToStatistics: boolean;   // default: true
  shareWithCohort: boolean;          // default: true (anonymous)
}
```

### POPIA Compliance

Cohort intelligence displays aggregate data. This falls under "statistical or research purposes" under POPIA Section 15(3) — processing for statistical purposes with adequate safeguards does not require individual consent when the data is anonymous and cannot be re-identified.

The explicit consent captured at account creation covers anonymized aggregate usage. No additional consent required for cohort displays.

---

## Technical Implementation

### Cohort Intelligence Query

```typescript
class CohortIntelligenceBuilder {
  async buildForOpportunity(
    user: SkillsPassport,
    opportunity: Opportunity
  ): Promise<OpportunityCohortIntelligence | null> {

    const cohort = await this.cohortBuilder.buildCohort(user);

    if (cohort.size < 5) return null;

    const userIdList = cohort.userIds.map(id => `'${id}'`).join(',');

    // How many in cohort viewed this opportunity
    const viewQuery = `
      SELECT COUNT(DISTINCT user_id) as viewers
      FROM skilved_prod.events
      WHERE event_type = 'opportunity_detail'
        AND opportunity_id = @oppId
        AND user_id IN (${userIdList})
        AND DATE(event_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    `;

    // How many applied
    const applyQuery = `
      SELECT COUNT(DISTINCT user_id) as applicants
      FROM skilved_prod.events
      WHERE event_type IN ('apply_click', 'agent_apply_success')
        AND opportunity_id = @oppId
        AND user_id IN (${userIdList})
        AND DATE(event_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
    `;

    // Outcome data for this opportunity from this cohort
    const outcomeQuery = `
      SELECT outcome_type, COUNT(*) as count
      FROM skilved_prod.outcomes
      WHERE opportunity_id = @oppId
        AND user_id IN (${userIdList})
      GROUP BY outcome_type
    `;

    const [views, applies, outcomes] = await Promise.all([
      this.bigquery.query(viewQuery, { oppId: opportunity.id }),
      this.bigquery.query(applyQuery, { oppId: opportunity.id }),
      this.bigquery.query(outcomeQuery, { oppId: opportunity.id }),
    ]);

    const interviews = outcomes.find(o => o.outcome_type === 'interviewed')?.count ?? 0;
    const placements = outcomes.find(o => o.outcome_type === 'accepted')?.count ?? 0;
    const applicants = applies[0]?.applicants ?? 0;

    if (applicants < 3) return null; // Don't show with very small numbers

    return {
      cohortSize: cohort.size,
      cohortDescription: cohort.cohortDescription,
      viewers: views[0]?.viewers ?? 0,
      applicants,
      interviews,
      placements,
      interviewRate: applicants > 0 ? interviews / applicants : null,
      placementRate: applicants > 0 ? placements / applicants : null,
      isTopForCohort: await this.isTopOpportunityForCohort(opportunity.id, cohort),
    };
  }

  async buildWeeklyDigestAddition(
    user: SkillsPassport
  ): Promise<WeeklyDigestCohortContent | null> {

    const cohort = await this.cohortBuilder.buildCohort(user, 10); // higher minimum for digest
    if (!cohort || cohort.size < 10) return null;

    const userIdList = cohort.userIds.map(id => `'${id}'`).join(',');

    // Top opportunity this week for cohort
    const topOppQuery = `
      SELECT
        o.opportunity_id,
        opp.title,
        opp.organisation,
        COUNT(*) as applicants,
        COUNTIF(o.outcome_type = 'interviewed') as interviews
      FROM skilved_prod.outcomes o
      JOIN skilved_prod.opportunities opp ON o.opportunity_id = opp.id
      WHERE o.user_id IN (${userIdList})
        AND DATE(o.outcome_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
      GROUP BY o.opportunity_id, opp.title, opp.organisation
      HAVING applicants >= 3
      ORDER BY interviews / applicants DESC
      LIMIT 1
    `;

    // Warning opportunities (low success rate)
    const warningOppQuery = `
      SELECT
        o.opportunity_id,
        opp.title,
        COUNT(*) as applicants,
        COUNTIF(o.outcome_type = 'interviewed') as interviews
      FROM skilved_prod.outcomes o
      JOIN skilved_prod.opportunities opp ON o.opportunity_id = opp.id
      WHERE o.user_id IN (${userIdList})
        AND DATE(o.outcome_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      GROUP BY o.opportunity_id, opp.title
      HAVING applicants >= 3 AND (interviews / applicants) < 0.15
      ORDER BY applicants DESC
      LIMIT 1
    `;

    const [topOpps, warnings] = await Promise.all([
      this.bigquery.query(topOppQuery),
      this.bigquery.query(warningOppQuery),
    ]);

    if (topOpps.length === 0) return null;

    return {
      cohortSize: cohort.size,
      cohortDescription: cohort.cohortDescription,
      topOpportunity: topOpps[0],
      warningOpportunity: warnings[0] ?? null,
    };
  }
}
```

### Redis Caching

Cohort intelligence is cached to avoid re-querying BigQuery on every feed load:

```typescript
// Redis keys
const COHORT_KEY = (userId: string) => `cohort:${userId}`;
const OPP_COHORT_KEY = (oppId: string, cohortHash: string) =>
  `cohort_opp:${oppId}:${cohortHash}`;

// TTL: 1 hour for per-opportunity data, 4 hours for user cohort definition
```

---

## Data Progression

| Stage | Data Available | What Shows | Label |
|---|---|---|---|
| Week 1–2 | View events only | "6 electricians in Gauteng viewed this" | "Based on recent activity" |
| Week 3–4 | Apply click events | "3 N3 electricians applied to this" | "Based on application activity" |
| Week 5–8 | First outcome data | "2 got interviews · 1 placed" | "Based on early outcomes (limited)" |
| Month 2–3 | Growing outcome data | Full cohort intelligence | "Based on N verified outcomes" |
| Month 6+ | Rich outcome data | High-confidence intelligence | "High confidence — N outcomes" |

**The key:** show something useful at every stage. Never show nothing. Always label what the data is based on.

---

## Sprint Plan

**Sprint 2 (Week 3–4) — v1 (activity-based):**
- Cohort Builder live (BigQuery queries)
- Opportunity card: "X people with your profile viewed this"
- Feed banner: "What [trade] workers in [province] are viewing"
- No outcome data yet — purely activity signals
- Redis caching

**Sprint 3 (Week 5–6) — v2 (application-based):**
- "X applied · Y got interviews" (first outcome data)
- Profile page cohort intelligence section
- Warning opportunities (low success rate for cohort)
- Weekly digest addition via Notification Agent

**Sprint 4 (Week 7–8) — v3 (outcome-verified):**
- Full cohort intelligence with verified placements
- Agent 17 (Collective Intelligence Agent) as standalone service
- Pre-computed daily batch for top cohort types
- XPRIZE demo: "Thandeka from Soweto sees the same intelligence about which opportunities lead somewhere that the child of an Eskom executive has always had"

---

## Integration with Other Agents

### Career Agent
Career Agent reads cohort intelligence when generating career plans:
- "In your cohort, the most common path to trade-tested is via the EWSETA apprenticeship"
- Timeline estimates informed by cohort average times, not generic estimates

### Matching Agent
Cohort popularity (viewed/applied by similar users) is a weak positive signal in the matching score. Not the primary signal, but a tiebreaker.

### Career Simulation Agent
Cohort data is the underlying dataset for Career Simulation Engine. When a user asks "what if I get my trade test?", the simulation uses the cohort who made that specific change.

### Notification Agent
Weekly digest includes cohort intelligence update via `buildWeeklyDigestAddition()`.

### Skills Pulse Dashboard
Aggregate cohort patterns visible on the national dashboard — e.g., "Most applied-for opportunity for N3 electricians in Gauteng this week."

---

*Document version 1.0 — June 2026*
*Owner: Engineering + Product*
*NEW in v5.0 — Collective Intelligence Layer and Agent 17 specification*
