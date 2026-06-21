# Skilved — Career Simulation Engine
### "What If I Do X?" | Agent 15 | Version 1.0 | June 2026

---

## Table of Contents

- [Why This Exists](#why-this-exists)
- [The XPRIZE Argument](#the-xprize-argument)
- [How It Works](#how-it-works)
- [Agent 15: Career Simulation Agent](#agent-15-career-simulation-agent)
- [Simulation Types](#simulation-types)
- [Output Formats](#output-formats)
- [Early Data Strategy](#early-data-strategy)
- [Integration Points](#integration-points)
- [Sprint Plan](#sprint-plan)

---

## Why This Exists

Every South African trades worker makes career decisions in the dark. Should I get my trade test now or take the learnership first? Is it worth moving to Gauteng for better opportunities? Will getting my N4 actually increase my salary?

These questions have answers — but only inside elite networks. The uncle who works at Eskom. The TVET lecturer who's placed 50 students. The MERSETA official who sees placement data.

Everyone else guesses.

The Career Simulation Engine changes this. It uses verified outcome data from thousands of real career trajectories to answer "what if I do X?" with actual data, not generic advice.

This is what McKinsey charges R500,000 for in workforce planning reports. Skilved delivers it free, on a phone, in 30 seconds.

---

## The XPRIZE Argument

> "For the first time, any South African trades worker can ask 'what happens to my career if I get my Wireman's licence?' and receive an answer grounded in what actually happened to 47 people who were exactly where they are — verified, timestamped, real. This capability did not exist before Skilved. It brings an economic future to the present."

---

## How It Works

```
Worker asks: "What if I get my trade test?"
       ↓
Career Simulation Agent builds current cohort:
  N3 Electrical, Gauteng, 2 years experience, entry level
  → finds 47 matching users in BigQuery
       ↓
Applies hypothetical change:
  N3 Electrical → Trade-tested Electrician
  → finds cohort of trade-tested electricians who were N3 two years ago
       ↓
Compares outcomes:
  Current cohort: avg R5,200/month, 67% placed within 6 months
  Hypothetical cohort: avg R8,400/month, 84% placed within 3 months
       ↓
Generates narrative (Gemini):
  "Getting your trade test would likely increase your salary by ~R3,200/month.
   Based on 31 similar electricians, 84% were placed within 3 months of
   trade testing. Your top employer would shift from contractors to Eskom."
       ↓
Surfaces aligned opportunities:
  "3 open trade test registration windows this quarter in Gauteng"
```

---

## Agent 15: Career Simulation Agent

### Job
Answer outcome-verified "what if" career queries. Use the SA Skills Graph to show workers what real people with their profile experienced when they made a specific career change.

### Runs
- HTTP trigger: per user query (conversational)
- Scheduled batch: pre-compute top-5 simulations per cohort type daily
- Career Agent integration: proactively surfaces insights weekly

### Core Engine

```typescript
class CareerSimulationEngine {

  async simulate(
    user: SkillsPassport,
    query: SimulationQuery
  ): Promise<SimulationResult> {

    const currentCohort = await this.buildCohort(user);
    const hypotheticalProfile = this.applyChange(user, query);
    const hypotheticalCohort = await this.buildCohort(hypotheticalProfile);

    // Need at least 5 in hypothetical cohort to show anything
    if (hypotheticalCohort.size < 5) {
      return this.buildLowDataResult(query);
    }

    const currentOutcomes = await this.getOutcomes(currentCohort);
    const hypotheticalOutcomes = await this.getOutcomes(hypotheticalCohort);

    const delta = this.calculateDelta(currentOutcomes, hypotheticalOutcomes);

    // Opportunity count change (always available, no outcome data needed)
    const currentOpportunities = await this.countOpportunities(user);
    const hypotheticalOpportunities = await this.countOpportunities(hypotheticalProfile);

    const narrative = await this.generateNarrative(
      user, query, currentOutcomes, hypotheticalOutcomes, delta
    );

    const alignedOpportunities = await this.findAlignedOpportunities(
      hypotheticalProfile, query
    );

    return {
      query,
      currentState: {
        opportunities: currentOpportunities,
        avgSalary: currentOutcomes.avgSalary,
        placementRate: currentOutcomes.placementRate,
        avgDaysToPlacement: currentOutcomes.avgDays,
      },
      hypotheticalState: {
        opportunities: hypotheticalOpportunities,
        avgSalary: hypotheticalOutcomes.avgSalary,
        placementRate: hypotheticalOutcomes.placementRate,
        avgDaysToPlacement: hypotheticalOutcomes.avgDays,
      },
      delta: {
        opportunitiesChange: hypotheticalOpportunities - currentOpportunities,
        salaryChange: hypotheticalOutcomes.avgSalary - currentOutcomes.avgSalary,
        placementRateChange: hypotheticalOutcomes.placementRate - currentOutcomes.placementRate,
        daysToPlacementChange: hypotheticalOutcomes.avgDays - currentOutcomes.avgDays,
      },
      sampleSize: hypotheticalCohort.size,
      confidence: this.calculateConfidence(hypotheticalCohort.size),
      narrative,
      alignedOpportunities,
      dataPointsAge: hypotheticalOutcomes.avgAgeDays, // how recent the data is
    };
  }

  private calculateConfidence(sampleSize: number): ConfidenceLevel {
    if (sampleSize < 5) return 'insufficient';
    if (sampleSize < 20) return 'low';
    if (sampleSize < 100) return 'medium';
    return 'high';
  }

  private async generateNarrative(
    user: SkillsPassport,
    query: SimulationQuery,
    current: CohortOutcomes,
    hypothetical: CohortOutcomes,
    delta: OutcomeDelta
  ): Promise<string> {
    const prompt = `
You are a career advisor for a South African trades worker.
Worker profile: ${JSON.stringify(user.agentSummary)}
They asked: "${this.describeQuery(query)}"

Current state (based on ${current.sampleSize} similar workers):
- Average salary: R${current.avgSalary.toLocaleString()}/month
- Placement rate: ${(current.placementRate * 100).toFixed(0)}%
- Average time to placement: ${current.avgDays} days

Hypothetical state (based on ${hypothetical.sampleSize} workers who made this change):
- Average salary: R${hypothetical.avgSalary.toLocaleString()}/month
- Placement rate: ${(hypothetical.placementRate * 100).toFixed(0)}%
- Average time to placement: ${hypothetical.avgDays} days

Write a concise, honest, specific career insight (max 4 sentences).
Start with the most important number. Be honest about uncertainty.
Don't oversell. If the change has downsides, mention them.
Use South African context (rand amounts, local employer names if known).
`;
    return this.gemini.generate(prompt);
  }
}
```

### Cohort Builder

```typescript
class CohortBuilder {
  async buildCohort(profile: SkillsPassport): Promise<Cohort> {
    const query = `
      SELECT
        o.user_id,
        o.outcome_type,
        o.opp_salary,
        o.days_to_placement,
        o.opp_organisation,
        o.outcome_at
      FROM skilved_prod.outcomes o
      JOIN skilved_prod.users u ON o.user_id = u.id
      WHERE u.primary_trade = @trade
        AND u.province = @province
        AND u.highest_nqf_level BETWEEN @nqfMin AND @nqfMax
        AND u.experience_level = @experience
        AND o.outcome_type IN ('accepted', 'offered')
        AND DATE(o.outcome_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 730 DAY)
      ORDER BY o.outcome_at DESC
      LIMIT 500
    `;

    const results = await this.bigquery.query(query, {
      trade: profile.primaryTrade,
      province: profile.province,
      nqfMin: profile.highestNqfLevel - 1,
      nqfMax: profile.highestNqfLevel + 1,
      experience: profile.experienceLevel,
    });

    return {
      size: results.length,
      outcomes: results,
      avgSalary: this.avg(results, 'opp_salary'),
      avgDays: this.avg(results, 'days_to_placement'),
      placementRate: results.length > 0 ? results.length / await this.totalApplicants(profile) : 0,
      topEmployers: this.topN(results, 'opp_organisation', 5),
    };
  }
}
```

---

## Simulation Types

### Type 1: Add Qualification
```
"What if I get my N4?"
"What if I complete my trade test?"
"What if I get my Wireman's Licence?"
```
Changes: `highestNqfLevel`, `tradeTested`, qualifications array

### Type 2: Change Province
```
"What if I move to Gauteng?"
"What opportunities are there in Western Cape?"
```
Changes: `province`

### Type 3: Take a Learnership
```
"What if I do the EWSETA solar learnership?"
"What happens after a MERSETA apprenticeship?"
```
Changes: `qualifications`, `highestNqfLevel`, `subSpecialisations`

### Type 4: Add Certification
```
"What if I get my OHAS certificate?"
"What does a First Aid Level 3 unlock?"
```
Changes: `certificates`, `extractedSkills`

### Type 5: Change Trade
```
"Is there more work in plumbing than electrical in my area?"
"What if I pivoted to HVAC?"
```
Changes: `primaryTrade`

### Type 6: Career Path Comparison
```
"Should I do the apprenticeship or the learnership first?"
"Is it better to get the trade test or the N5 first?"
```
Runs two simulations and compares them head-to-head.

---

## Output Formats

### WhatsApp Format (primary)
```
What if you get your trade test? ⚡

Based on 31 electricians with your profile who got trade-tested:

📈 Salary: R4,500 → R8,400/month (+R3,900)
⏱️  Placement: 84% placed within 3 months
🏢 Top employers after: Eskom, City Power, Zest WEG
🎯 New opportunities: +12 (8 now → 20)

Without trade test (your current path):
  67% placed · avg 6 months · R5,200/month ceiling

Confidence: High (31 verified outcomes, 2024–2026)

Next step: 3 trade test registrations open in Gauteng now
Reply VIEW to see them.
```

### Web Format (profile page)
Interactive comparison card:
- Before/After salary bar chart
- Opportunities unlocked counter (animated)
- Timeline comparison
- Top employers visualization
- "Based on N real people" provenance label

### Proactive Format (Career Agent weekly)
```
💡 Career Insight for you this week:

Getting your Wireman's Licence would unlock 12 more opportunities
that match you — including the EWSETA Solar Apprenticeship that
has a 75% interview rate for electricians in Gauteng.

73% of electricians with your profile who got it were placed
within 90 days at avg R7,700/month.

Want to see the study options near you?
[Yes, show me] [Tell me more first]
```

---

## Early Data Strategy

The engine provides value even before significant outcome data exists.

| Data Available | What Engine Shows | Confidence Label |
|---|---|---|
| 0 outcomes | Opportunity count change only ("You'd match 12 more opportunities") | "Based on current opportunities" |
| 5–19 outcomes | Directional salary/placement data | "Early data — directional only" |
| 20–99 outcomes | Partial simulation with ranges | "Based on limited data (N=X)" |
| 100–499 outcomes | Full simulation | "Medium confidence (N=X)" |
| 500+ outcomes | High-confidence simulation with percentiles | "High confidence (N=X)" |

**The key:** always show the sample size. Honesty about data limitations builds trust faster than hiding them.

---

## Integration Points

### Career Agent
Career Agent proactively runs simulations when:
- User profile changes (new qualification detected)
- Career plan step completed
- High-value opportunity found that requires one more qualification
- Weekly career insight run

### Customer Success Agent
Routes these queries to Career Simulation Agent:
- "What if I..."
- "Should I do X or Y?"
- "Is it worth getting my..."
- "What would happen if..."

### Feed
For authenticated users with passport ≥ 40%:
- Each opportunity card shows: "Getting [X qualification] would make this a 95% match"
- Links to simulation for that specific change

### Notifications
Weekly digest addition:
- "Your top career simulation this week: getting your trade test would unlock R3,900/month increase (based on 31 real outcomes)"

---

## Sprint Plan

**Sprint 2 (Week 3–4) — v1:**
- Opportunity-based simulation only
- "You'd match X more opportunities if you had [qualification]"
- No outcome data needed — just opportunity matching
- Available via WhatsApp and profile page
- Routes through Customer Success Agent for conversational queries

**Sprint 3 (Week 5–6) — v2:**
- First outcome data (20–50 data points from early users)
- Basic salary/placement direction with "early data" label
- Career Agent proactively surfaces top simulation weekly
- Web UI comparison card on profile page

**Sprint 4 (Week 7–8) — v3:**
- Full simulation with confidence intervals
- All 6 simulation types supported
- Type 6 (path comparison) available
- Pre-computed daily batch for top cohort scenarios
- XPRIZE demo: "Watch this worker ask 'what if I get my trade test?' and get an answer in 8 seconds, grounded in 47 real verified outcomes"

---

*Document version 1.0 — June 2026*
*Owner: Engineering + Product*
*NEW in v5.0 — Career Simulation Engine and Agent 15 specification*
