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

The live opportunity store. Discovery agent writes here. Feed reads from here.

```typescript
interface Opportunity {
  // Identity
  id: string;                          // auto UUID
  slug: string;                        // URL-safe slug for detail page

  // Classification
  title: string;
  organisation: string;
  opportunityType: OpportunityType;    // enum — see below
  tradeCategory: TradeCategory;        // enum — see below
  subTrade?: string;                   // e.g. "Solar installation" within "Electrical"

  // Location
  province: Province;                  // enum — see below
  city?: string;
  remote: boolean;

  // Compensation
  salaryAmount?: number;               // numeric, null if not stated
  salaryCurrency: 'ZAR';
  salaryType?: 'monthly' | 'annual' | 'stipend' | 'funded' | 'market_related';
  salaryDisplay?: string;              // "R4,500/month" or "Funded" or "Market related"

  // Requirements
  qualificationsRequired: string[];    // ["N3 Electrical", "Grade 12"]
  nqfLevelRequired?: number;           // 1-10
  experienceRequired?: ExperienceLevel;
  tradeTested: boolean;                // does this require trade test?
  documentsRequired?: string[];        // ["ID copy", "Certificate"]

  // Content
  descriptionFull: string;             // full opportunity description
  descriptionSummary: string;          // AI-generated 2-3 sentence summary
  requirementsChecklist?: string[];    // AI-extracted requirement bullets
  duration?: string;                   // "3 years", "6 months"

  // Application
  applicationUrl?: string;             // external apply URL
  applicationEmail?: string;           // email application
  applicationMethod: 'external' | 'email' | 'in_app';
  deadline?: Timestamp;
  deadlineDisplay?: string;            // "15 July 2026" or "Open until filled"

  // Source & Discovery
  sourceUrl: string;                   // where agent found it
  sourceName: string;                  // "MERSETA", "Indeed SA", "Eskom"
  sourceType: 'seta' | 'jobboard' | 'government' | 'employer';
  discoveredAt: Timestamp;
  agentRunId: string;                  // which discovery run found this

  // Quality
  qualityScore: number;                // 0-100, set by quality agent
  qualityDecision: 'published' | 'rejected' | 'flagged' | 'pending';
  qualityReason?: string;              // if rejected or flagged
  isVerifiedSource: boolean;           // known SETA or government body

  // Status
  status: 'active' | 'expired' | 'removed';
  expiredAt?: Timestamp;
  removedAt?: Timestamp;
  removedReason?: string;

  // Engagement (denormalised from BigQuery for fast reads)
  viewCount: number;
  applyClickCount: number;
  shareCount: number;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Enums
type OpportunityType =
  | 'apprenticeship'
  | 'learnership'
  | 'bursary'
  | 'job'
  | 'trade_test'
  | 'short_course';

type TradeCategory =
  | 'electrical'
  | 'plumbing'
  | 'welding'
  | 'automotive'
  | 'construction'
  | 'hvac'
  | 'mechanical'
  | 'mining'
  | 'ict'
  | 'agriculture'
  | 'logistics'
  | 'clothing';

type Province =
  | 'gauteng'
  | 'western_cape'
  | 'kwazulu_natal'
  | 'eastern_cape'
  | 'limpopo'
  | 'mpumalanga'
  | 'north_west'
  | 'free_state'
  | 'northern_cape'
  | 'national';

type ExperienceLevel =
  | 'entry_level'
  | '1_3_years'
  | '3_plus_years'
  | 'trade_tested';
```

**Firestore indexes required:**
```
Collection: opportunities
Composite indexes:
  - tradeCategory ASC, province ASC, status ASC, discoveredAt DESC
  - tradeCategory ASC, status ASC, deadline ASC
  - opportunityType ASC, province ASC, status ASC, discoveredAt DESC
  - status ASC, discoveredAt DESC (for "new today" section)
  - qualityDecision ASC, status ASC (for admin quality queue)
```

---

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

The core moat. Every agent reads from here. Continuously enriched by the Skills Profile Agent.

```typescript
interface SkillsPassport {
  userId: string;
  version: number;
  lastEnrichedAt: Timestamp;
  agentVersion: string;            // which Skills Profile Agent version built this

  // Completeness
  completenessScore: number;       // 0-100
  completenessLevel: 'starter' | 'active' | 'strong' | 'skilved' | 'verified';

  // Trade identity
  primaryTrade: TradeCategory;
  subSpecialisations: string[];
  province: Province;
  willingToRelocate: boolean;

  // Qualifications (NQF mapped)
  qualifications: PassportQualification[];
  highestNqfLevel: number;
  tradeTested: boolean;
  tradeTestDate?: Timestamp;

  // Skills (AI-extracted — not self-reported labels)
  extractedSkills: ExtractedSkill[];

  // Work history
  workHistory: PassportWorkEntry[];
  yearsExperience: number;
  employmentStatus: EmploymentStatus;

  // Verification state
  myMzansiLinked: boolean;         // Phase 2
  verifiedCredentials: VerifiedCredential[];

  // Agent-readable (pre-computed for performance)
  agentSummary: string;            // "N3 electrician, 3yr industrial experience, Gauteng"
  matchingSignals: MatchingSignal[];

  // Graph signals (from outcomes)
  placementCount: number;
  applicationSuccessRate?: number;

  // Reputation (Phase 2 — schema seeded now, unused in MVP)
  // Populated by Reputation Agent once review volume is sufficient.
  // Left null/undefined in MVP — no migration required when Phase 2 ships.
  reputation?: ReputationSummary;

  // Behavioral signals — how the user behaves, not just what they are.
  // Updated by a lightweight enrichment step whenever an agent observes
  // a dismissal, override, or repeated pattern. This is what makes
  // matching "increasingly accurate across sessions" rather than static.
  behavioralSignals?: BehavioralSignals;

  // Enrichment state
  enrichmentSuggestions: EnrichmentSuggestion[];  // "Add Wireman's licence to unlock 12 more"
}

interface ExtractedSkill {
  skill: string;                   // "HV switching 11kV"
  category: string;                // "Electrical — High Voltage"
  nqfLevel?: number;               // implied NQF level
  sourceType: 'free_text' | 'document_ai' | 'mymzansi' | 'outcome';
  confidence: number;              // 0-1
  extractedAt: Timestamp;
}

interface PassportQualification {
  name: string;                    // "N3 Electrical Engineering"
  nqfLevel: number;
  issuingAuthority: string;
  issueDate?: Timestamp;
  verified: boolean;
  verificationSource?: 'mymzansi' | 'saqa' | 'seta' | 'self_reported';
}

interface EnrichmentSuggestion {
  type: 'add_certificate' | 'add_work_history' | 'upload_document' | 'link_mymzansi';
  message: string;                 // "Add your Wireman's licence to unlock 12 more opportunities"
  opportunitiesUnlocked: number;
  completenessGain: number;
}

// Phase 2 — Reputation Agent output. Defined now so the field above is
// type-safe from MVP, but no agent writes to it until Phase 2.
interface ReputationSummary {
  trustScore: number;              // 0-100, weighted by reviewer credibility
  reviewCount: number;
  verifiedReviewCount: number;     // reviews tied to a verified outcome
  synthesis: string;               // Gemini: "Rated highly for reliability by 2 verified employers"
  topAttributes: string[];         // e.g. ["reliable", "strong technical skill"]
  lastUpdatedAt: Timestamp;
}

// Sprint 4 stretch / early Phase 2 — derived from existing BigQuery events,
// no new data collection required. Read by Matching, Career, Revenue, Notification agents.
interface BehavioralSignals {
  dismissedOpportunityTypes: { type: OpportunityType; count: number }[];
  dismissedOrganisations: { orgName: string; count: number }[];

  preferredContactChannel: 'whatsapp' | 'email' | 'in_app';
  peakEngagementHours: number[];        // hours of day (0-23), derived from open/click times

  overrideRate: number;                  // % of Level 3/4 agent decisions user disputed/reverted
  thresholdAdjustmentSuggested?: number; // if overrideRate high, suggest raising match threshold

  careerStepsCompleted: number;
  careerStepsIgnored: number;

  lastUpdatedAt: Timestamp;
}
```

**Key design principle:** `extractedSkills` is never what the user typed. It is what the Skills Profile Agent extracted and structured from what the user typed. This distinction is what makes the passport more valuable than a CV — it is AI-interpreted, not self-reported.

---

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

All registered users. Linked to Firebase Auth UID. Simplified — passport data lives in `skills_passports`.

```typescript
interface User {
  // Identity
  id: string;                      // Firebase Auth UID
  username: string;
  displayName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActiveAt: Timestamp;

  // Auth
  authMethod: 'whatsapp' | 'google' | 'email';
  whatsappNumber?: string;         // hashed
  email?: string;

  // Passport reference (data lives in skills_passports)
  passportId: string;              // same as userId
  passportCompleteness: number;    // denormalised for fast reads

  // Preferences
  digestEnabled: boolean;
  digestTime: string;              // "07:00" SAST
  lastDigestSentAt?: Timestamp;

  // Permission model
  permissionLevel: 1 | 2 | 3 | 4;
  permissionUpdatedAt: Timestamp;
  matchThreshold?: number;         // Level 3/4 minimum match score

  // Privacy
  profilePublic: boolean;
  consentVersion: string;
  consentAt: Timestamp;
  marketingConsent: boolean;
}
```

interface Certificate {
  name: string;
  issuingAuthority: string;
  issueDate?: Timestamp;
  expiryDate?: Timestamp;
  certificateNumber?: string;
  verified: boolean;                   // false until MyMzansi integration
  verifiedAt?: Timestamp;
}

interface VerifiedCredential {
  credentialType: string;
  issuingAuthority: string;
  verifiedAt: Timestamp;
  myMzansiReference: string;
}

type EmploymentStatus =
  | 'employed'
  | 'unemployed'
  | 'student'
  | 'self_employed'
  | 'seeking';

type Qualification =
  | 'grade_10'
  | 'grade_11'
  | 'grade_12'
  | 'n1' | 'n2' | 'n3' | 'n4' | 'n5' | 'n6'
  | 'nqf_1' | 'nqf_2' | 'nqf_3' | 'nqf_4' | 'nqf_5' | 'nqf_6' | 'nqf_7' | 'nqf_8'
  | 'trade_test'
  | 'diploma'
  | 'degree';
```

---

---

### Collection: `applications`

Tracks every apply action by a registered user — manual or agent-submitted.

```typescript
interface Application {
  id: string;
  userId: string;
  opportunityId: string;

  // How it was applied
  appliedAt: Timestamp;
  applicationMethod: 'external' | 'in_app' | 'agent_email' | 'agent_web_form';
  initiatedBy: 'user' | 'application_agent';
  permissionLevelAtTime: 1 | 2 | 3 | 4;
  consentId: string;               // reference to consents collection

  // Agent-generated documents (if agent-applied)
  cvGenerated: boolean;
  coverLetterGenerated: boolean;
  cvStoragePath?: string;          // Cloud Storage path
  coverLetterStoragePath?: string;

  // Submission tracking
  submissionReferenceNumber?: string;
  submissionConfirmationUrl?: string;
  submissionScreenshotPath?: string;

  // Application content (in-app only)
  coverNote?: string;
  documentsSubmitted?: string[];

  // Status tracking
  status: ApplicationStatus;
  statusUpdatedAt: Timestamp;

  // Outcome (collected by outcome tracker agent)
  outcome?: OutcomeType;
  outcomeReportedAt?: Timestamp;
  outcomeReportedBy: 'user' | 'agent_followup';

  // Follow-up tracking
  followUpsSent: FollowUp[];
  lastFollowUpAt?: Timestamp;
  followUpsComplete: boolean;

  // Interview coordination (Agent 12 — Sprint 4 stretch / Phase 2)
  // Populated when an employer reply with interview intent is detected
  interviewSchedule?: InterviewSchedule;
}

interface InterviewSchedule {
  detectedAt: Timestamp;
  employerProposedTime: Timestamp;
  format: 'in_person' | 'phone' | 'video';
  location?: string;
  userConfirmed: boolean;
  userConfirmedAt?: Timestamp;
  employerConfirmedAt?: Timestamp;
  rescheduleRequested: boolean;
  finalTime?: Timestamp;
  prepNotesGenerated: boolean;        // Career Agent generated prep notes
  prepNotesStoragePath?: string;
  reminderSentAt?: Timestamp;
  outcome?: 'completed' | 'no_show' | 'cancelled';
}
```

---

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

**The coordination layer.** One document per user, frequently read and written by every agent. This is what turns a sequential pipeline into a coordinated multi-agent system — see `24_AI_Employees_Architecture.md` "The Agent Coordination Layer" for full design rationale.

```typescript
interface AgentContext {
  userId: string;
  updatedAt: Timestamp;

  // Rolling 7-day window of recent agent activity, most recent first.
  // Capped at ~50 entries — older entries pruned on write.
  recentActions: {
    agent: string;                  // 'career', 'application', 'customer_success', etc.
    action: string;                 // short description, e.g. "career_plan_updated"
    at: Timestamp;
    relevantTo?: string[];          // which other agents should consider this on next run
  }[];

  // Coordination flags — set by one agent, read by others before acting
  flags: {
    csEscalationOpenSince?: Timestamp;     // Revenue Agent: suppress upgrade prompts while set
    careerPlanChangedAt?: Timestamp;       // Application Agent: re-score against new plan
    applicationConfirmedAt?: Timestamp;    // Growth Agent: share-invite moment
    circuitBreakerHaltedAt?: Timestamp;    // All agents: pause user-facing autonomous actions
    interviewScheduledAt?: Timestamp;      // Career Agent: prep notes requested
  };
}
```

**Read/write pattern:** every agent reads `agent_context/{userId}` at the start of its run and writes a `recentActions` entry + relevant flags at the end. This is a 2-line addition to existing agent logic — no new agents required, and it's far cheaper to build alongside Sprint 4 agents than retrofit later.

---

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

Career Agent output — each user's personalised career plan.

```typescript
interface CareerPlan {
  id: string;
  userId: string;
  generatedAt: Timestamp;
  updatedAt: Timestamp;
  agentVersion: string;             // which Career Agent model generated this

  // Current state (from profile at time of generation)
  currentTrade: TradeCategory;
  currentQualification: Qualification;
  currentNqfLevel: number;
  currentExperience: ExperienceLevel;

  // Target (from user's stated goal or inferred from graph)
  targetRole: string;               // e.g. "Trade-tested Electrician"
  targetSalaryRange?: { min: number; max: number };
  targetNqfLevel: number;
  userDefinedGoal: boolean;         // true if user set it, false if agent inferred

  // The plan
  steps: CareerStep[];
  estimatedMonths: number;
  estimatedMonthsSource: 'graph_data' | 'general_estimate';
  graphSampleSize?: number;         // how many similar users the estimate is based on

  // Current opportunity alignment
  alignedOpportunityIds: string[];  // opportunities that advance this plan right now

  // Delivery status
  deliveredViaWhatsApp: boolean;
  whatsAppDeliveredAt?: Timestamp;
  profilePageVisible: boolean;
}

interface CareerStep {
  order: number;
  stepType: 'qualification' | 'certification' | 'experience' | 'learnership' | 'trade_test';
  title: string;
  description: string;
  estimatedDuration: string;        // "6 months", "3 years"
  linkedOpportunityTypes: OpportunityType[];
  completed: boolean;
  completedAt?: Timestamp;
}
```

---

---

### Collection: `consents`

POPIA consent audit trail. Never deleted (7-year legal retention).

```typescript
interface ConsentRecord {
  id: string;
  userId: string;
  consentType:
    | 'level1_account'
    | 'level1_whatsapp_digest'
    | 'level2_document_generation'
    | 'level3_autonomous_application'
    | 'level4_autonomous_application'
    | 'level4_autonomous_sharing'
    | 'level4_data_decisions';
  consentVersion: string;           // e.g. "v1.2"
  granted: boolean;
  grantedAt?: Timestamp;
  revokedAt?: Timestamp;

  // Level 3/4 specific
  matchThreshold?: number;          // e.g. 85 for Level 3

  // Evidence
  ipAddress: string;                // hashed (SHA-256)
  deviceType: string;
  consentText: string;              // exact text shown to user
  checkboxTicked: boolean;          // was it an active tick (not pre-checked)?

  // POPIA automated decision-making notice (Level 3/4)
  automatedDecisionNoticeShown: boolean;
  rightToObjectExplained: boolean;
}
```

---

---

### Collection: `conversations`

Customer Success Agent conversation history.

```typescript
interface Conversation {
  id: string;
  userId: string;
  channel: 'whatsapp' | 'in_app';
  startedAt: Timestamp;
  lastMessageAt: Timestamp;
  status: 'active' | 'resolved' | 'escalated';

  messages: ConversationMessage[];

  // Resolution
  resolvedBy: 'agent' | 'human' | 'user';
  resolvedAt?: Timestamp;
  queryType?: string;
  resolutionSummary?: string;

  // Escalation
  escalatedAt?: Timestamp;
  escalationReason?: string;
  humanReviewedAt?: Timestamp;
  humanResponse?: string;
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'agent' | 'human';
  content: string;
  timestamp: Timestamp;
  geminiPromptTokens?: number;      // for cost tracking
  geminiCompletionTokens?: number;
}
```

---

---

### Collection: `revenue_decisions`

Revenue Agent decision audit trail.

```typescript
interface RevenueDecision {
  id: string;
  userId: string;
  decidedAt: Timestamp;

  // What triggered it
  triggerType:
    | 'high_match_view'
    | 'career_milestone'
    | 'application_success'
    | 'inactivity_risk'
    | 'organic_upgrade_intent';
  triggerData: Record<string, any>;

  // What the agent decided
  action: 'upgrade_prompt' | 'retention_offer' | 'nothing';
  confidence: number;               // 0-1
  reasoning: string;               // Gemini's reasoning

  // If prompt sent
  messageVariant?: string;
  priceSuggested?: number;
  messageSentAt?: Timestamp;

  // Outcome
  converted: boolean;
  convertedAt?: Timestamp;
  conversionRevenue?: number;

  // XPRIZE requirement
  human_approvals_required: 0;     // ALWAYS 0
  experiment_id?: string;          // A/B test ID if applicable
}

type ApplicationStatus =
  | 'applied'
  | 'interviewed'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'pending'
  | 'no_response';

type OutcomeType =
  | 'applied'
  | 'interviewed'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

interface FollowUp {
  sentAt: Timestamp;
  dayNumber: 3 | 14 | 30;
  messageSid: string;
  responseReceived: boolean;
  responseAt?: Timestamp;
  responseText?: string;
  classifiedOutcome?: OutcomeType;
}
```

---

---

### Collection: `sessions`

Anonymous browser sessions. Used for personalisation before signup.

```typescript
interface Session {
  id: string;                          // anonymous session UUID (cookie)
  createdAt: Timestamp;
  lastSeenAt: Timestamp;
  expiresAt: Timestamp;                // 90 days from creation

  // Inferred preferences
  inferredTrade?: TradeCategory;       // from filter selections
  inferredProvince?: Province;         // from filter selections or geolocation
  viewedOpportunityIds: string[];      // last 50 viewed
  appliedOpportunityIds: string[];
  sharedOpportunityIds: string[];

  // Soft prompt state
  promptShownCount: number;
  promptLastShownAt?: Timestamp;
  promptDismissedAt?: Timestamp;

  // Source attribution
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}
```

---

---

### Collection: `employers`

Paying employer accounts.

```typescript
interface Employer {
  id: string;
  companyName: string;
  registrationNumber?: string;         // CIPC registration
  industry: string;
  tradeCategories: TradeCategory[];
  provinces: Province[];

  // Contact
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
  billingEmail: string;

  // Subscription
  plan: 'pay_per_referral' | 'starter' | 'growth' | 'scale' | 'enterprise';
  planStartDate: Timestamp;
  planEndDate?: Timestamp;
  monthlySpendLimit?: number;

  // Billing
  vatNumber?: string;
  billingAddress: string;
  paymentMethodId?: string;            // PayFast token

  // Usage
  referralsThisMonth: number;
  referralsTotal: number;
  activeJobListings: number;

  // Status
  status: 'active' | 'suspended' | 'churned';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

**Addition v3.0:**

```typescript
// Added to Employer interface
accountabilityScore?: number;      // NEW — from Agent 16
accountabilityGrade?: string;      // NEW 'A'|'B'|'C'|'D'|'F'
accountabilityScoreUpdatedAt?: Timestamp; // NEW
```

---

### Collection: `setas`

SETA partnership accounts.

```typescript
interface Seta {
  id: string;
  name: string;                        // "MERSETA"
  fullName: string;                    // "Manufacturing, Engineering and Related Services SETA"
  sector: string;
  website: string;
  tradeCategories: TradeCategory[];
  provinces: Province[];               // operational provinces

  // Contact
  ceoName?: string;
  contactEmail: string;
  contactPhone?: string;

  // Partnership
  partnershipStatus: 'prospect' | 'negotiating' | 'active' | 'inactive';
  contractValue?: number;
  contractStartDate?: Timestamp;
  contractEndDate?: Timestamp;

  // Integration
  crawlerEnabled: boolean;
  crawlerUrl?: string;
  crawlerLastRunAt?: Timestamp;
  apiEnabled: boolean;                 // future: SETA provides API

  // Metrics
  opportunitiesIndexed: number;
  candidatesReferred: number;
  placementsConfirmed: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

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

Every user interaction. The rawest form of the graph.

```sql
CREATE TABLE skilved_prod.events (
  event_id        STRING NOT NULL,
  session_id      STRING NOT NULL,          -- anonymous session
  user_id         STRING,                   -- null if not logged in
  opportunity_id  STRING,
  event_type      STRING NOT NULL,          -- see event taxonomy below
  event_at        TIMESTAMP NOT NULL,
  
  -- Context
  trade_filter    STRING,                   -- active trade filter at time of event
  province_filter STRING,                   -- active province filter
  sort_order      STRING,                   -- relevance / newest / closing_soon
  
  -- Session context
  session_number  INT64,                    -- which session for this user
  events_in_session INT64,                  -- position in session
  
  -- Source attribution
  utm_source      STRING,
  utm_medium      STRING,
  utm_campaign    STRING,
  referrer        STRING,
  
  -- Device
  device_type     STRING,                   -- mobile / tablet / desktop
  user_agent      STRING,
  
  -- Opportunity context (denormalised for query speed)
  opp_trade       STRING,
  opp_province    STRING,
  opp_type        STRING,
  opp_salary      FLOAT64,
  opp_freshness_hours FLOAT64,             -- hours old when viewed
  
  -- Match context (for logged-in users)
  match_score     FLOAT64,
  match_position  INT64,                   -- position in ranked feed

  PARTITION BY DATE(event_at)
)
CLUSTER BY event_type, user_id, opportunity_id;
```

**Event taxonomy:**
```
feed_view             -- user views the feed page
feed_filter_change    -- user changes a filter
opportunity_view      -- user views an opportunity card (impression)
opportunity_detail    -- user clicks into detail view
apply_click           -- user clicks apply (external redirect)
apply_start           -- user starts in-app application
apply_complete        -- user completes in-app application
save                  -- user saves an opportunity
unsave                -- user removes saved opportunity
share                 -- user shares an opportunity
share_channel         -- which channel (whatsapp / copy_link)
signup_prompt_shown   -- soft prompt displayed
signup_prompt_dismissed
signup_start          -- user begins account creation
signup_complete       -- user completes account creation
profile_updated       -- user updates their profile
digest_sent           -- WhatsApp digest sent
digest_opened         -- digest link clicked (UTM tracking)
digest_opportunity_clicked
outcome_followup_sent -- outcome tracker sent a follow-up
outcome_reported      -- user reported an outcome
```

---

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

The most valuable table. Every confirmed outcome is a graph node.

```sql
CREATE TABLE skilved_prod.outcomes (
  outcome_id          STRING NOT NULL,
  user_id             STRING NOT NULL,
  opportunity_id      STRING NOT NULL,
  
  -- The outcome
  outcome_type        STRING NOT NULL,  -- applied/interviewed/offered/accepted/rejected/withdrawn
  outcome_at          TIMESTAMP NOT NULL,
  outcome_reported_at TIMESTAMP NOT NULL,
  reported_by         STRING,           -- user / agent_followup
  
  -- Opportunity snapshot (at time of application)
  opp_trade           STRING,
  opp_type            STRING,
  opp_province        STRING,
  opp_salary          FLOAT64,
  opp_source          STRING,
  opp_organisation    STRING,
  
  -- User snapshot (at time of application)
  user_trade          STRING,
  user_province       STRING,
  user_qualification  STRING,
  user_nqf_level      INT64,
  user_experience     STRING,
  user_trade_tested   BOOL,
  
  -- Time metrics
  days_to_apply       INT64,            -- days from discovery to apply
  days_to_outcome     INT64,            -- days from apply to outcome
  
  PARTITION BY DATE(outcome_at)
)
CLUSTER BY outcome_type, opp_trade, opp_province;
```

---

---

### Table: `agent_runs`

Full audit trail of every agent execution. Critical for XPRIZE demonstration.

```sql
CREATE TABLE skilved_prod.agent_runs (
  run_id              STRING NOT NULL,
  agent_name          STRING NOT NULL,  -- discovery/quality/matching/notification/outcome_tracker
  started_at          TIMESTAMP NOT NULL,
  completed_at        TIMESTAMP,
  duration_seconds    FLOAT64,
  status              STRING,           -- success / partial / failed
  
  -- Discovery agent specific
  sources_attempted   INT64,
  sources_succeeded   INT64,
  sources_failed      INT64,
  opportunities_found INT64,
  opportunities_published INT64,
  opportunities_rejected  INT64,
  opportunities_duplicate INT64,
  
  -- Quality agent specific
  opportunities_reviewed INT64,
  auto_published      INT64,
  auto_rejected       INT64,
  flagged_for_review  INT64,
  
  -- Notification agent specific
  users_targeted      INT64,
  digests_sent        INT64,
  digests_failed      INT64,
  
  -- Outcome tracker specific
  followups_sent      INT64,
  outcomes_collected  INT64,
  
  -- Error tracking
  error_count         INT64,
  error_messages      ARRAY<STRING>,
  
  -- Human involvement (should always be 0 in normal operation)
  human_approvals_required INT64,
  
  PARTITION BY DATE(started_at)
)
CLUSTER BY agent_name, status;
```

---

**Addition v3.0:** New agents tracked:

```sql
-- New values for agent_name field:
-- 'skills_pulse', 'career_simulation', 'employer_accountability', 'collective_intelligence'
-- 'micro_credential_issuer'
```

---

### Table: `quality_decisions`

Every quality agent decision. Training data for improving the quality model.

```sql
CREATE TABLE skilved_prod.quality_decisions (
  decision_id         STRING NOT NULL,
  opportunity_id      STRING NOT NULL,
  agent_run_id        STRING NOT NULL,
  decided_at          TIMESTAMP NOT NULL,
  
  -- Decision
  decision            STRING NOT NULL,  -- published / rejected / flagged
  quality_score       FLOAT64,
  
  -- Rules engine
  rules_passed        ARRAY<STRING>,
  rules_failed        ARRAY<STRING>,
  
  -- Gemini classifier
  gemini_score        FLOAT64,
  gemini_reasoning    STRING,
  
  -- Source credibility
  source_score        FLOAT64,
  source_name         STRING,
  
  -- Rejection detail
  rejection_reason    STRING,
  
  -- Feedback loop
  user_reported_issue BOOL,
  user_report_reason  STRING,
  overridden_by_human BOOL,
  human_decision      STRING,
  
  PARTITION BY DATE(decided_at)
)
CLUSTER BY decision, source_name;
```

---

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

Derived table — the skills graph. Rebuilt weekly from events + outcomes.

```sql
CREATE TABLE skilved_prod.graph_skills (
  skill_id            STRING NOT NULL,   -- trade + qualification combination
  trade               STRING NOT NULL,
  qualification       STRING NOT NULL,
  nqf_level           INT64,
  
  -- Opportunity access
  opportunity_types_accessible  ARRAY<STRING>,
  avg_salary_accessible         FLOAT64,
  max_salary_accessible         FLOAT64,
  min_salary_accessible         FLOAT64,
  
  -- Outcome rates
  apply_to_interview_rate       FLOAT64,  -- % who got interviews
  apply_to_offer_rate           FLOAT64,  -- % who got offers
  offer_to_accept_rate          FLOAT64,  -- % who accepted
  
  -- Time metrics
  avg_days_to_placement         FLOAT64,
  
  -- Sample size
  applicant_count               INT64,
  outcome_count                 INT64,
  
  -- Confidence
  confidence_score              FLOAT64,  -- 0-1, based on sample size
  
  last_updated                  TIMESTAMP,
  
  PARTITION BY DATE(last_updated)
)
CLUSTER BY trade, nqf_level;
```

---

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