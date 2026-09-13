# Skilved — Employer Accountability Layer
### Public Employer Ratings from Verified Outcomes | Agent 16 | Version 1.0 | June 2026

---

## Table of Contents

- [Why This Exists](#why-this-exists)
- [The XPRIZE Argument](#the-xprize-argument)
- [What Workers See](#what-workers-see)
- [Accountability Score Model](#accountability-score-model)
- [Agent 16: Employer Accountability Agent](#agent-16-employer-accountability-agent)
- [Data Sources](#data-sources)
- [Employer Response Mechanism](#employer-response-mechanism)
- [Anti-Gaming Design](#anti-gaming-design)
- [Sprint Plan](#sprint-plan)
- [Revenue Implications](#revenue-implications)

---

## Why This Exists

South Africa's learnership market has a structural information asymmetry problem.

Employers know everything: how many candidates they have, how many learnerships they can fund, what the stipend will be, whether the training is real or exploitative.

Workers know almost nothing: whether the learnership leads to employment, whether the stipend gets paid on time, whether the employer has a track record of actually training people.

This asymmetry allows bad actors to run exploitative learnerships — collecting the SETA funding, paying inadequate stipends, providing no real training, and producing no employment outcomes — without consequence.

The Employer Accountability Layer inverts this asymmetry for the first time in South Africa.

**Every employer on Skilved gets a verified accountability score based on what actually happened to candidates. Workers see this before they apply.**

---

## The XPRIZE Argument

> "Right now, there's no way for a learner to know if a learnership at Company X actually leads anywhere. This information exists nowhere publicly in South Africa. Skilved changes this — permanently. Employers who run exploitative learnerships lose access to candidates. Good employers attract more. For the first time, the SA learnership market has accountability. That is a systemic change."

This is Skilved's equity and systemic-change argument to judges. Not just helping individuals — changing the rules of the market.

---

## What Workers See

### On the Opportunity Card

```
┌─────────────────────────────────────────────────────┐
│ [NEW] ELECTRICAL APPRENTICESHIP                      │
│ Eskom Holdings · Johannesburg, GP                    │
│                                                      │
│ [Apprenticeship] [Electrical] [Gauteng]              │
│                                                      │
│ R4,500/month stipend                                 │
│ Closes: 15 July 2026 · Found 2h ago ✦               │
│                                                      │
│ ★ Employer Score: A (94/100)                        │
│ 8 Skilved placements · 92% completed programmes     │
│                                                      │
│ [View Details]  [Apply Now]  [↗ Share]               │
└─────────────────────────────────────────────────────┘
```

### On the Opportunity Detail Page

```
About Eskom Holdings — Skilved Verified Data

Accountability Score: A (94/100)     ↑ Improving

Based on 8 verified Skilved outcomes:

✅ Placement rate: 87% of learners found employment
✅ Programme completion: 92% completed the full programme
✅ Average salary on completion: R8,200/month
✅ Would recommend: 88% of learners said yes
⏱️ Average time from application to start: 34 days

Candidate feedback highlights:
"Training was genuine and the supervisors were experienced."
"Stipend was paid on time every month."

⚠️  Note: 1 candidate reported payment delays in January 2026.
    Eskom responded: "Payment system issue resolved — all
    candidates were back-paid with interest."

Data based on 8 verified placements (Jan 2025–Jun 2026)
Score last updated: 12 June 2026
```

### Score Interpretation

| Grade | Score | What It Means |
|---|---|---|
| A | 80–100 | Excellent track record. High confidence this employer delivers. |
| B | 65–79 | Good track record. Minor concerns noted. |
| C | 50–64 | Average. Mixed feedback or limited data. |
| D | 35–49 | Below average. Proceed with caution. |
| F | 0–34 | Poor track record. Multiple complaints or very low completion. |
| N/A | — | Insufficient data (fewer than 3 verified outcomes). |

---

## Accountability Score Model

### Score Calculation

```typescript
interface AccountabilityScoreInput {
  outcomes: VerifiedOutcome[];
  feedbackResponses: CandidateFeedback[];
  programmeCompletions: ProgrammeCompletion[];
}

class AccountabilityScorer {
  calculate(input: AccountabilityScoreInput): AccountabilityScore {

    if (input.outcomes.length < 3) {
      return {
        score: null,
        grade: null,
        confidence: 'insufficient',
        reason: 'Fewer than 3 verified outcomes',
      };
    }

    // Component scores (out of their weight)
    const placementScore = this.calcPlacementScore(input.outcomes);        // 30 points
    const completionScore = this.calcCompletionScore(input.programmeCompletions); // 25 points
    const salaryScore = this.calcSalaryScore(input.outcomes);              // 20 points
    const feedbackScore = this.calcFeedbackScore(input.feedbackResponses); // 15 points
    const timeScore = this.calcTimeScore(input.outcomes);                  // 10 points

    const total = placementScore + completionScore + salaryScore +
                  feedbackScore + timeScore;

    return {
      score: Math.round(total),
      grade: this.toGrade(total),
      confidence: this.toConfidence(input.outcomes.length),
      components: { placementScore, completionScore, salaryScore,
                    feedbackScore, timeScore },
    };
  }

  private calcPlacementScore(outcomes: VerifiedOutcome[]): number {
    const placed = outcomes.filter(o =>
      ['accepted', 'offered'].includes(o.outcomeType)
    ).length;
    const rate = placed / outcomes.length;
    return rate * 30; // max 30 points
  }

  private calcCompletionScore(completions: ProgrammeCompletion[]): number {
    if (completions.length === 0) return 15; // neutral if no data
    const completed = completions.filter(c => c.completed).length;
    return (completed / completions.length) * 25; // max 25 points
  }

  private calcSalaryScore(outcomes: VerifiedOutcome[]): number {
    const placedOutcomes = outcomes.filter(o => o.salary > 0);
    if (placedOutcomes.length === 0) return 10; // neutral
    const avgSalary = placedOutcomes.reduce((s, o) => s + o.salary, 0) / placedOutcomes.length;
    // Normalize against trade median (from graph)
    const tradeMedian = this.getTradeMedianSalary(outcomes[0].trade);
    const ratio = Math.min(avgSalary / tradeMedian, 1.5);
    return (ratio / 1.5) * 20; // max 20 points
  }

  private calcFeedbackScore(feedback: CandidateFeedback[]): number {
    if (feedback.length === 0) return 7.5; // neutral
    const wouldRecommend = feedback.filter(f => f.wouldRecommend).length;
    return (wouldRecommend / feedback.length) * 15; // max 15 points
  }

  private calcTimeScore(outcomes: VerifiedOutcome[]): number {
    const avgDays = outcomes.reduce((s, o) => s + o.daysToPlacement, 0) / outcomes.length;
    // Lower is better; 30 days = full score, 120+ days = 0
    const score = Math.max(0, 10 - (avgDays / 12));
    return score; // max 10 points
  }

  private toGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 80) return 'A';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    if (score >= 35) return 'D';
    return 'F';
  }

  private toConfidence(sampleSize: number): ConfidenceLevel {
    if (sampleSize < 3) return 'insufficient';
    if (sampleSize < 10) return 'low';
    if (sampleSize < 30) return 'medium';
    return 'high';
  }
}
```

---

## Agent 16: Employer Accountability Agent

### Job
Continuously calculate employer accountability scores from verified outcomes, generate natural-language summaries, and publish scores to opportunity cards and employer profiles.

### Runs
- Weekly: full recalculation of all employer scores
- On new verified outcome: update affected employer's score
- Monthly: generate employer accountability digest (which employers improved/declined)

### Core Process

```typescript
class EmployerAccountabilityAgent {
  async run(): Promise<AgentRunResult> {
    const employers = await this.getEmployersWithOutcomes();
    let processed = 0;

    for (const employer of employers) {
      const outcomes = await this.getVerifiedOutcomes(employer.id);
      const feedback = await this.getCandidateFeedback(employer.id);
      const completions = await this.getProgrammeCompletions(employer.id);

      const score = this.scorer.calculate({ outcomes, feedback, completions });
      const summary = await this.generateSummary(employer, score, outcomes);
      const trend = await this.calculateTrend(employer.id, score);

      await this.storeScore({
        employerId: employer.id,
        employerName: employer.name,
        calculatedAt: new Date(),
        sampleSize: outcomes.length,
        ...score,
        summary,
        trend,
      });

      processed++;
    }

    await this.bigquery.log({
      agent_name: 'employer_accountability',
      decisions_made: processed,
      human_approvals_required: 0,
    });

    return { processed, human_approvals_required: 0 };
  }

  private async generateSummary(
    employer: Employer,
    score: AccountabilityScore,
    outcomes: VerifiedOutcome[]
  ): Promise<string> {
    const prompt = `
Write a 2-sentence honest summary of this employer's learnership/apprenticeship track record.
Be specific about numbers. Include any notable positives or concerns.
Keep it factual — no marketing language.

Employer: ${employer.name}
Score: ${score.grade} (${score.score}/100)
Placements: ${score.components.placementScore}
Completion rate: ${score.components.completionScore}
Average salary on placement: R${outcomes.reduce((s, o) => s + o.salary, 0) / outcomes.length}
Sample size: ${outcomes.length} verified outcomes

Write only the 2-sentence summary. No preamble.
`;
    return this.gemini.generate(prompt);
  }
}
```

### Candidate Feedback Collection

Outcome Tracker Agent collects feedback as part of its Day 30 follow-up:

```
Day 30 follow-up addition (if placement confirmed):

"One last question about your time at [Employer]:

On a scale of 1–5, how would you rate the quality of training?
Would you recommend this programme to a friend?
Any feedback for future applicants?

Your response helps other workers make better decisions.
It's completely anonymous."
```

---

## Data Sources

### 1. Verified Outcome Data (BigQuery outcomes table)
Primary source. Every confirmed placement from Outcome Tracker Agent.
- Employer name, trade, province
- Outcome type (placed, offered, rejected)
- Salary on placement
- Days from application to placement

### 2. Programme Completion Data (collected at Day 90 follow-up)
"Did you complete the programme?"
- Yes → completion recorded
- No → reason collected (funding stopped, employer cancelled, personal)

### 3. Candidate Feedback (Day 30 follow-up addition)
- Training quality rating (1–5)
- Would recommend (yes/no)
- Open text feedback (used for summary generation)
- Stipend payment reliability (yes/issues/no)

### 4. Employer Response (optional)
Employers can see their score and respond to specific feedback.
Their responses are displayed alongside the candidate feedback.

---

## Employer Response Mechanism

Employers with a Skilved account can:
1. See their current accountability score and breakdown
2. Respond to specific candidate feedback points
3. Provide context for low scores
4. See how their score compares to industry average

**This is not employers controlling their scores** — scores are calculated from verified outcomes only. Employers can add context; they cannot change the underlying data.

```
Employer dashboard notification:
"Your Skilved Accountability Score updated: B (72/100)
Previous: B (69/100) ↑

1 new candidate feedback item:
'Stipend payment was 2 weeks late twice'

You can respond to this feedback. Your response will appear
alongside the feedback on your opportunity listings.
[Respond] [View Full Score Breakdown]"
```

---

## Anti-Gaming Design

### Why Gaming Is Difficult

1. **Scores are based on verified outcomes only** — employers cannot submit fake outcomes. Outcomes are collected from workers via Outcome Tracker Agent follow-ups.

2. **Workers are contacted independently** — feedback is solicited from the worker, not through the employer. Employers cannot intercept this.

3. **Minimum sample size** — scores don't appear until 3 verified outcomes exist. Gaming requires real placements.

4. **Trend tracking** — sudden score changes trigger manual review.

5. **Anomaly detection** — if an employer's completion rate jumps from 40% to 100% in one month, the score is flagged and manually reviewed.

```typescript
class AnomalyDetector {
  async checkForAnomalies(employerId: string, newScore: AccountabilityScore): Promise<boolean> {
    const previousScore = await this.getPreviousScore(employerId);
    if (!previousScore) return false;

    const delta = newScore.score - previousScore.score;

    // Flag if score jumps more than 20 points in one week
    if (Math.abs(delta) > 20) {
      await this.flagForReview(employerId, delta, 'score_jump');
      return true;
    }

    // Flag if completion rate jumps more than 30%
    if (newScore.components.completionScore - previousScore.components.completionScore > 7.5) {
      await this.flagForReview(employerId, delta, 'completion_jump');
      return true;
    }

    return false;
  }
}
```

---

## Sprint Plan

**Sprint 2 (Week 3–4) — Infrastructure:**
- Add feedback questions to Day 30 Outcome Tracker follow-up
- Create `employer_accountability_scores` BigQuery table
- Start collecting data silently (no public display yet)
- Employer score placeholders on opportunity cards ("Score coming soon")

**Sprint 3 (Week 5–6) — v1 Live:**
- Agent 16 (Employer Accountability Agent) running weekly
- Scores displayed on opportunity cards for employers with 3+ outcomes
- "Based on limited early data" label with sample size
- Employer detail page with breakdown
- Employer dashboard notification when score updates

**Sprint 4 (Week 7–8) — v2 Polished:**
- Employer response mechanism live
- Trend display (improving/stable/declining)
- Monthly employer accountability digest published
- XPRIZE demo: show real employer scores based on real outcomes

---

## Revenue Implications

**Direct:**
- Employers pay more for "Accountability Score: A" badge in their listings (premium placement fee addition)
- SETAs use employer scores to decide which employers get learnership funding allocation

**Indirect:**
- Demonstrates Skilved's systemic impact to investors and XPRIZE judges
- Builds trust with workers → more profiles → better graph → more employer revenue
- Government uses accountability data for SETA grant allocation (data license revenue)

**The market effect:**
When workers routinely check employer scores before applying, the value of a good score becomes apparent to employers. This creates a natural incentive for employers to improve learnership quality — a market mechanism that SETA regulations have never successfully created.

---

*Document version 1.0 — June 2026*
*Owner: Product + Data*
*NEW in v5.0 — Employer Accountability Layer and Agent 16 specification*
