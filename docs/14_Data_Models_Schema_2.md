# Skilved — Data Models & Database Schema
### Firestore + BigQuery + Redis | Version 3.0 | June 2026

---

## Table of Contents

- [Overview](#overview)
- [Firestore Collections](#firestore-collections)
  - [opportunities](#collection-opportunities)
  - [skills_passports](#collection-skills_passports)
  - [users](#collection-users)
  - [applications](#collection-applications)
  - [micro_credentials](#collection-micro_credentials-new-v30)
  - [skills_pulse_snapshots](#collection-skills_pulse_snapshots-new-v30)
  - [agent_context](#collection-agent_context)
  - [career_plans](#collection-career_plans)
  - [consents](#collection-consents)
  - [conversations](#collection-conversations)
  - [revenue_decisions](#collection-revenue_decisions)
  - [sessions](#collection-sessions)
  - [employers](#collection-employers)
  - [setas](#collection-setas)
  - [Phase 2/3 Stubs](#phase-23-stubs-empty-in-mvp)
- [BigQuery Tables](#bigquery-tables--the-graph)
  - [events](#table-events)
  - [outcomes](#table-outcomes)
  - [agent_runs](#table-agent_runs)
  - [quality_decisions](#table-quality_decisions)
  - [skills_pulse_snapshots](#table-skills_pulse_snapshots-new-v30)
  - [employer_accountability_scores](#table-employer_accountability_scores-new-v30)
  - [cohort_snapshots](#table-cohort_snapshots-new-v30)
  - [career_simulations](#table-career_simulations-new-v30)
  - [application_submissions](#table-application_submissions-new-v30)
  - [micro_credential_events](#table-micro_credential_events-new-v30)
  - [graph_skills](#table-graph_skills)
  - [BigQuery Views](#bigquery-views)
- [Redis Cache Schema](#redis-cache-schema)
- [Data Flow Summary](#data-flow-summary)
- [Change Log](#change-log)

---

## Overview

Skilved uses three data stores, each with a specific purpose:

| Store | Purpose | Why |
|---|---|---|
| **Firestore** | Operational data — opportunities, users, profiles, sessions | Low-latency reads, real-time updates |
| **BigQuery** | The graph — every event, outcome, agent run, analytics | Analytical queries, ML training data |
| **Redis** | Caching — ranked feeds, session state, cohort intelligence | Sub-millisecond response |

---

## Firestore Collections

### Collection: `opportunities`

*(Unchanged from v2.0 — see full schema in original doc)*

**Addition v3.0:** New fields on every opportunity document:

```typescript
// Added to Opportunity interface
applicationPlatform: ATSPlatform;        // NEW v3.0 — detected by Analyst Agent
applicationPlatformConfidence: 'high' | 'medium' | 'low'; // NEW
applicationUrlType: ApplicationUrlType;   // NEW
requiresAccountCreation: boolean;         // NEW
captchaLikely: boolean;                   // NEW
formComplexityEstimate: number;           // NEW 0-100

// Employer accountability
employerAccountabilityScore?: number;     // NEW v3.0 — from Agent 16
employerAccountabilityGrade?: string;     // NEW 'A'|'B'|'C'|'D'|'F'
employerScoreUpdatedAt?: Timestamp;       // NEW

type ATSPlatform =
  | 'successfactors' | 'oracle_taleo' | 'pageup'
  | 'merseta_portal' | 'ewseta_portal' | 'ceta_portal'
  | 'email_only' | 'direct_web_form' | 'job_board_hosted' | 'unknown';
```

---

### Collection: `skills_passports`

*(Base schema unchanged — see v2.0)*

**Additions v3.0:**

```typescript
// Added to SkillsPassport interface

// Micro-credentials — NEW v3.0
microCredentials: MicroCredentialSummary[];

// Cohort intelligence signals — NEW v3.0 (pre-computed daily)
cohortSignals?: {
  cohortSize: number;
  cohortDescription: string;
  topOpportunityIds: string[];
  warningOpportunityIds: string[];
  avgTimeToPlacementDays: number;
  lastComputedAt: Timestamp;
};

interface MicroCredentialSummary {
  credentialId: string;
  type: CredentialType;
  issuedAt: Timestamp;
  badgeLabel: string;
  verificationCode: string;
}
```

---

### Collection: `users`

*(Unchanged from v2.0)*

---

### Collection: `applications`

*(Base schema unchanged)*

**Additions v3.0:**

```typescript
// Added to Application interface

// ATS submission details — NEW v3.0
atsPlatform?: ATSPlatform;
atsAdapterVersion?: string;
captchaEncountered?: boolean;
captchaSolved?: boolean;
submissionAttempts?: number;
submissionDurationMs?: number;
submissionMethod?: string;
```

---

### Collection: `micro_credentials` — NEW v3.0

Stores all Skilved Verified micro-credentials.

```typescript
interface MicroCredential {
  id: string;                     // cred_{userId}_{type}_{timestamp}
  userId: string;
  type: CredentialType;
  issuedAt: Timestamp;
  issuedBy: 'skilved';
  version: string;                // '1.0'

  metadata?: {
    employer?: string;
    role?: string;
    trade?: TradeCategory;
    date?: Timestamp;
    opportunityId?: string;
    sampleSize?: number;
    trustScore?: number;
  };

  verificationCode: string;       // 12-char alphanumeric, unique
  publicUrl: string;              // skilved.com/verify/{code}
  qrCodePath?: string;            // Cloud Storage path

  badgeColor: string;
  badgeLabel: string;
  badgeIcon: string;

  status: 'active' | 'revoked' | 'expired';
  revokedAt?: Timestamp;
  revokedReason?: string;
  expiresAt?: Timestamp;
}

type CredentialType =
  | 'active_applicant'
  | 'profile_complete'
  | 'interview_ready'
  | 'placed'
  | 'employer_endorsed'     // Phase 2
  | 'trade_specialist'      // Phase 2
  | 'top_applicant'
  | 'verified_trade_test';

// Firestore indexes
// micro_credentials: userId ASC, type ASC, status ASC
// micro_credentials: verificationCode ASC (unique lookup)
```

---

### Collection: `skills_pulse_snapshots` — NEW v3.0

Daily national intelligence snapshots from Agent 14.

```typescript
interface SkillsPulseSnapshot {
  date: string;                   // YYYY-MM-DD (document ID)
  generatedAt: Timestamp;
  processingTimeSeconds: number;

  nationalOverview: {
    totalActiveOpportunities: number;
    totalWorkerProfiles: number;
    totalOutcomesVerified: number;
    totalPlacementsThisMonth: number;
    newOpportunitiesThisWeek: number;
    newProfilesThisWeek: number;
  };

  demandSupplyGaps: {
    trade: TradeCategory;
    province: Province;
    openOpportunities: number;
    qualifiedCandidates: number;
    gapScore: number;
    trend: 'worsening' | 'stable' | 'improving';
  }[];

  expiryRisks: {
    opportunityId: string;
    title: string;
    organisation: string;
    province: Province;
    trade: TradeCategory;
    expiresAt: Timestamp;
    qualifiedCandidatesAvailable: number;
    urgencyScore: number;
  }[];

  qualificationROI: {
    qualification: string;
    nqfLevel: number;
    trade: TradeCategory;
    province?: Province;
    avgSalaryOnPlacement: number;
    avgDaysToPlacement: number;
    placementRate: number;
    sampleSize: number;
    confidenceScore: number;
  }[];

  tvetCollegePerformance: {
    collegeName: string;
    province: Province;
    placementRate: number;
    avgTimeToPlacementDays: number;
    topTradesProduced: TradeCategory[];
    sampleSize: number;
  }[];

  predictiveSignals: {
    trade: TradeCategory;
    province: Province;
    predictedDemandChange: number;
    confidence: number;
    drivingFactors: string[];
    horizon: '3_months' | '6_months';
  }[];

  geminiIntelligence: {
    urgentGaps: string[];
    expiryRisk: string;
    policyRecommendation: string;
    bestROIByProvince: Record<string, { qualification: string; salaryUplift: number }>;
    weeklyInsight: string;
  };

  governmentReportGenerated: boolean;
  governmentReportStoragePath?: string;
  dataPointsAnalysed: number;
  confidenceScore: number;
  human_approvals_required: 0;
}
```

---

### Collection: `agent_context`

*(Unchanged from v2.0 — see original schema)*

**Additions v3.0:**

```typescript
// Additional flags in agent_context
flags: {
  // ... existing flags ...
  simulationRequestedAt?: Timestamp;     // NEW — Career Simulation Agent
  cohortInsightGeneratedAt?: Timestamp;  // NEW — Collective Intelligence Agent
  employerScoreUpdatedAt?: Timestamp;    // NEW — Employer Accountability Agent
  skillsPulseUpdatedAt?: Timestamp;      // NEW — Skills Pulse Agent
};
```

---

### Collection: `career_plans`

*(Unchanged from v2.0)*

---

### Collection: `consents`

*(Unchanged from v2.0)*

---

### Collection: `conversations`

*(Unchanged from v2.0)*

---

### Collection: `revenue_decisions`

*(Unchanged from v2.0)*

---

### Collection: `sessions`

*(Unchanged from v2.0)*

---

### Collection: `employers`

*(Unchanged from v2.0)*

**Addition v3.0:**

```typescript
// Added to Employer interface
accountabilityScore?: number;      // NEW — from Agent 16
accountabilityGrade?: string;      // NEW 'A'|'B'|'C'|'D'|'F'
accountabilityScoreUpdatedAt?: Timestamp; // NEW
```

---

### Collection: `setas`

*(Unchanged from v2.0)*

---

### Phase 2/3 Stubs (Empty in MVP)

Collections created with security rules defined, no writes in MVP:
- `reviews` — Phase 2 (Reputation Agent)
- `gigs` — Phase 2/3 (Gig Agent)
- `quotes` — Phase 2/3 (Gig Agent)
- `invoices` — Phase 2/3 (Gig Agent)

---

## BigQuery Tables — The Graph

### Table: `events`

*(Unchanged from v2.0)*

**New event types added v3.0:**

```
micro_credential_issued       -- credential issued to user
micro_credential_viewed       -- employer viewed credential
micro_credential_verified     -- external verification call
career_simulation_requested   -- user ran a simulation
career_simulation_completed   -- simulation returned results
cohort_intelligence_displayed -- cohort data shown on feed/card
employer_score_viewed         -- worker viewed employer score
skills_pulse_viewed           -- worker/government viewed dashboard
```

---

### Table: `outcomes`

*(Unchanged from v2.0)*

---

### Table: `agent_runs`

*(Base schema unchanged)*

**Addition v3.0:** New agents tracked:

```sql
-- New values for agent_name field:
-- 'skills_pulse', 'career_simulation', 'employer_accountability', 'collective_intelligence'
-- 'micro_credential_issuer'
```

---

### Table: `quality_decisions`

*(Unchanged from v2.0)*

---

### Table: `skills_pulse_snapshots` — NEW v3.0

```sql
CREATE TABLE skilved_prod.skills_pulse_snapshots (
  snapshot_date           DATE NOT NULL,
  generated_at            TIMESTAMP NOT NULL,
  national_overview       JSON,
  demand_supply_gaps      JSON,
  expiry_risks            JSON,
  qualification_roi       JSON,
  tvet_performance        JSON,
  predictive_signals      JSON,
  gemini_intelligence     JSON,
  data_points_analysed    INT64,
  confidence_score        FLOAT64,
  processing_time_seconds FLOAT64,
  human_approvals_required INT64,   -- always 0
  PARTITION BY snapshot_date
)
CLUSTER BY snapshot_date;
```

---

### Table: `employer_accountability_scores` — NEW v3.0

```sql
CREATE TABLE skilved_prod.employer_accountability_scores (
  score_id              STRING NOT NULL,
  employer_id           STRING NOT NULL,
  employer_name         STRING NOT NULL,
  calculated_at         TIMESTAMP NOT NULL,

  sample_size           INT64,
  confidence_level      STRING,     -- 'insufficient'|'low'|'medium'|'high'

  placement_rate        FLOAT64,
  completion_rate       FLOAT64,
  avg_salary            FLOAT64,
  stipend_reliability   FLOAT64,
  avg_days_to_placement FLOAT64,
  training_quality_rating FLOAT64,
  would_recommend_pct   FLOAT64,

  accountability_score  FLOAT64,
  accountability_grade  STRING,
  accountability_trend  STRING,     -- 'improving'|'stable'|'declining'

  summary               STRING,     -- Gemini-generated
  warnings              ARRAY<STRING>,

  human_approvals_required INT64,   -- always 0

  PARTITION BY DATE(calculated_at)
)
CLUSTER BY employer_name, calculated_at;
```

---

### Table: `cohort_snapshots` — NEW v3.0

Pre-computed daily cohort intelligence for top cohort types.

```sql
CREATE TABLE skilved_prod.cohort_snapshots (
  cohort_key            STRING NOT NULL,  -- "{trade}:{province}:{nqf}:{experience}"
  snapshot_date         DATE NOT NULL,
  cohort_size           INT64,
  cohort_description    STRING,

  top_opportunities     JSON,   -- [{oppId, title, applicants, interviews, placements}]
  warning_opportunities JSON,   -- [{oppId, title, low_success_reason}]
  common_next_steps     JSON,   -- most common career steps in cohort
  avg_time_to_placement FLOAT64,

  computed_at           TIMESTAMP,
  human_approvals_required INT64,   -- always 0

  PARTITION BY snapshot_date
)
CLUSTER BY cohort_key;
```

---

### Table: `career_simulations` — NEW v3.0

Every Career Simulation Agent query logged.

```sql
CREATE TABLE skilved_prod.career_simulations (
  simulation_id         STRING NOT NULL,
  user_id               STRING NOT NULL,
  simulated_at          TIMESTAMP NOT NULL,

  query_type            STRING,    -- 'add_qualification'|'change_province'|etc
  query_detail          STRING,    -- the specific change being simulated

  current_nqf           INT64,
  current_trade         STRING,
  current_province      STRING,

  cohort_size           INT64,
  confidence_level      STRING,

  current_opportunities INT64,
  hypothetical_opportunities INT64,
  opportunity_delta     INT64,

  current_avg_salary    FLOAT64,
  hypothetical_avg_salary FLOAT64,
  salary_delta          FLOAT64,

  current_placement_rate FLOAT64,
  hypothetical_placement_rate FLOAT64,

  narrative_generated   BOOL,
  human_approvals_required INT64,   -- always 0

  PARTITION BY DATE(simulated_at)
)
CLUSTER BY query_type, current_trade;
```

---

### Table: `application_submissions` — NEW v3.0

Detailed ATS submission tracking (extends `applications` table).

```sql
CREATE TABLE skilved_prod.application_submissions (
  submission_id           STRING NOT NULL,
  application_id          STRING NOT NULL,
  user_id                 STRING NOT NULL,
  opportunity_id          STRING NOT NULL,
  submitted_at            TIMESTAMP NOT NULL,

  ats_platform            STRING,    -- 'successfactors'|'oracle_taleo'|etc
  ats_adapter_version     STRING,
  application_url         STRING,

  submission_success      BOOL,
  failure_reason          STRING,
  submission_attempts     INT64,
  submission_duration_ms  INT64,

  captcha_encountered     BOOL,
  captcha_solved          BOOL,
  captcha_solver_provider STRING,    -- '2captcha'|'capsolver'
  captcha_solve_time_ms   INT64,

  cv_generated            BOOL,
  cover_letter_generated  BOOL,
  reference_number        STRING,

  human_approvals_required INT64,    -- always 0

  PARTITION BY DATE(submitted_at)
)
CLUSTER BY ats_platform, submission_success;
```

---

### Table: `micro_credential_events` — NEW v3.0

```sql
CREATE TABLE skilved_prod.micro_credential_events (
  event_id              STRING NOT NULL,
  user_id               STRING NOT NULL,
  credential_id         STRING,
  event_type            STRING,    -- 'issued'|'viewed'|'verified'|'shared'|'revoked'
  event_at              TIMESTAMP NOT NULL,
  credential_type       STRING,
  verification_code     STRING,
  verifier_type         STRING,    -- 'employer'|'seta'|'public'|null
  human_approvals_required INT64,  -- always 0
  PARTITION BY DATE(event_at)
)
CLUSTER BY credential_type, event_type;
```

---

### Table: `graph_skills`

*(Unchanged from v2.0)*

---

## BigQuery Views

### `daily_metrics` (unchanged from v2.0)

### `agent_autonomy` (updated v3.0)

```sql
CREATE OR REPLACE VIEW skilved_prod.agent_autonomy AS
SELECT
  DATE(started_at) as date,
  agent_name,
  COUNT(*) as runs,
  SUM(opportunities_found) as total_found,
  SUM(opportunities_published) as total_published,
  SUM(digests_sent) as total_digests,
  SUM(outcomes_collected) as total_outcomes,
  SUM(human_approvals_required) as human_interventions,
  SAFE_DIVIDE(SUM(human_approvals_required), COUNT(*)) as human_intervention_rate
FROM skilved_prod.agent_runs
GROUP BY date, agent_name
ORDER BY date DESC;
-- human_intervention_rate should always be 0.0
```

### `ats_performance` — NEW v3.0

```sql
CREATE OR REPLACE VIEW skilved_prod.ats_performance AS
SELECT
  ats_platform,
  COUNT(*) as total_applications,
  COUNTIF(submission_success) as successful,
  SAFE_DIVIDE(COUNTIF(submission_success), COUNT(*)) as success_rate,
  AVG(submission_duration_ms) as avg_duration_ms,
  COUNTIF(captcha_encountered) as captcha_encounters,
  SAFE_DIVIDE(COUNTIF(captcha_solved), COUNTIF(captcha_encountered)) as captcha_solve_rate,
  SUM(human_approvals_required) as human_approvals  -- always 0
FROM skilved_prod.application_submissions
GROUP BY ats_platform
ORDER BY total_applications DESC;
```

### `intelligence_layer_health` — NEW v3.0

```sql
CREATE OR REPLACE VIEW skilved_prod.intelligence_layer_health AS
SELECT
  'skills_pulse' as agent,
  MAX(snapshot_date) as last_run,
  AVG(data_points_analysed) as avg_data_points,
  AVG(confidence_score) as avg_confidence,
  SUM(human_approvals_required) as human_approvals
FROM skilved_prod.skills_pulse_snapshots
UNION ALL
SELECT
  'career_simulation' as agent,
  DATE(MAX(simulated_at)) as last_run,
  AVG(cohort_size) as avg_cohort_size,
  NULL as avg_confidence,
  SUM(human_approvals_required) as human_approvals
FROM skilved_prod.career_simulations
UNION ALL
SELECT
  'employer_accountability' as agent,
  DATE(MAX(calculated_at)) as last_run,
  AVG(sample_size) as avg_sample_size,
  AVG(confidence_score) as avg_confidence,
  SUM(human_approvals_required) as human_approvals
FROM skilved_prod.employer_accountability_scores;
```

---

## Redis Cache Schema

```
# Existing caches (unchanged)
feed:anon:{trade}:{province}:{sort}    TTL: 5 minutes
feed:user:{userId}:{sort}              TTL: 10 minutes
opp:{opportunityId}                    TTL: 1 hour
user:{userId}                          TTL: 15 minutes
ratelimit:api:{ip}                     TTL: 1 minute
otp:{whatsappNumber}                   TTL: 10 minutes

# NEW v3.0 — Cohort and Intelligence Caches
cohort:{userId}                        TTL: 4 hours
  → Cohort definition for this user (trade/province/nqf/experience + user_ids)

cohort_opp:{oppId}:{cohortHash}        TTL: 1 hour
  → Cohort intelligence for a specific opportunity + cohort combination

simulation:{userId}:{queryHash}        TTL: 24 hours
  → Cached career simulation result (heavy BigQuery query, cache aggressively)

skills_pulse:latest                    TTL: 2 hours
  → Latest Skills Pulse snapshot summary for dashboard quick-load

employer_score:{employerId}            TTL: 1 week
  → Employer accountability score (recalculated weekly)

micro_cred:{userId}                    TTL: 1 hour
  → User's current micro-credentials list for profile page
```

---

## Data Flow Summary

```
Discovery Agent (Scout + Analyst)
  → Firestore (opportunities + ATS platform detection)
  → BigQuery (agent_runs + quality_decisions)

Skills Pulse Agent (daily 2am)
  → BigQuery (reads outcomes, events, users)
  → Gemini (intelligence synthesis)
  → Firestore (skills_pulse_snapshots)
  → BigQuery (skills_pulse_snapshots table)
  → Redis (skills_pulse:latest cache)
  → Next.js (dashboard page revalidation)

Career Simulation Agent (per query)
  → BigQuery (cohort queries)
  → Gemini (narrative generation)
  → BigQuery (career_simulations log)
  → Redis (simulation cache)

Employer Accountability Agent (weekly)
  → BigQuery (outcomes queries)
  → Gemini (summary generation)
  → Firestore (employer accountability score)
  → BigQuery (employer_accountability_scores table)
  → Feed API (score injected into opportunity cards)
  → Redis (employer_score cache)

Collective Intelligence Agent (per feed request)
  → BigQuery (cohort queries)
  → Redis (cohort cache write)
  → Feed API (cohort data injected into cards)
  → BigQuery (cohort_intelligence_displayed event)

Application Agent (on user permission trigger)
  → SubmissionRouter (reads applicationPlatform from Opportunity)
  → ATSAdapter (SuccessFactors/Taleo/PageUp/SETA/Email)
  → CaptchaSolver (if needed)
  → Firestore (application document)
  → BigQuery (application_submissions table)
  → WhatsApp (confirmation message)

Micro-Credential Issuer (event-driven)
  → Firestore (micro_credentials collection)
  → QRCodeGenerator → Cloud Storage
  → BigQuery (micro_credential_events)
  → WhatsApp (issuance notification)

Outcome Tracker (event-driven)
  → WhatsApp (Day 3/14/30 follow-ups)
  → Firestore (application status)
  → BigQuery (outcomes table — THE GRAPH)
  → Employer Accountability Agent (triggers score recalc)
  → Skills Pulse Agent (contributes to next snapshot)
  → Career Simulation Agent (adds to cohort data)
  → Micro-Credential Issuer (triggers "Placed" credential if accepted)
```

---

## Change Log

### v3.0 — June 2026
- Added `applicationPlatform`, `applicationPlatformConfidence`, `requiresAccountCreation`, `captchaLikely`, `formComplexityEstimate` fields to `opportunities` collection
- Added `microCredentials`, `cohortSignals` to `skills_passports` collection
- Added `atsPlatform`, `captchaEncountered`, `captchaSolved`, `submissionDurationMs` to `applications` collection
- Added `accountabilityScore`, `accountabilityGrade` to `employers` collection
- Added new `agent_context` flags: `simulationRequestedAt`, `cohortInsightGeneratedAt`, `employerScoreUpdatedAt`, `skillsPulseUpdatedAt`
- Added new Firestore collection: `micro_credentials`
- Added new Firestore collection: `skills_pulse_snapshots`
- Added new BigQuery table: `skills_pulse_snapshots`
- Added new BigQuery table: `employer_accountability_scores`
- Added new BigQuery table: `cohort_snapshots`
- Added new BigQuery table: `career_simulations`
- Added new BigQuery table: `application_submissions` (ATS tracking)
- Added new BigQuery table: `micro_credential_events`
- Added new BigQuery views: `ats_performance`, `intelligence_layer_health`
- Added new Redis cache keys: cohort, simulation, skills_pulse, employer_score, micro_cred
- Added new event types: micro_credential_*, career_simulation_*, cohort_intelligence_*, employer_score_*, skills_pulse_*
- Updated data flow summary with all new agent flows

### v2.0 — June 2026
- Added `behaviouralSignals`, `reputation` to `skills_passports`
- Added `agent_context` collection
- Added `interviewSchedule` to `applications`
- Added `reviews` collection stub
- Added `gigs`, `quotes`, `invoices` stubs
- Added `application_circuit_breaker_state`

*Document version 3.0 — June 2026*
*Owner: Engineering / Data*
