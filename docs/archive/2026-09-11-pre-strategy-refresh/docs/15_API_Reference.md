# Skilved — API Reference

### Internal + External APIs | Version 2.0 | June 2026

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Internal API Routes](#internal-api-routes)
  - [Feed](#get-apifeed)
  - [Opportunities](#get-apiopportunitiesid)
  - [Apply](#post-apiapply)
  - [Career Simulation](#post-apicareersimulate-new-v20)
  - [Skills Pulse](#get-apiskills-pulse-new-v20)
  - [Employer Score](#get-apiemployersidaccountability-new-v20)
  - [Cohort Intelligence](#get-apicohortintelligence-new-v20)
  - [Credentials](#get-apicredentials-new-v20)
  - [Verify Credential](#get-apiveriflycode-new-v20)
  - [Profile](#get-apiprofile)
  - [Permissions](#get-apipermissions)
  - [Events](#post-apievents)
  - [Auth](#post-apiauthwhatsappsend-otp)
  - [Webhooks](#post-apiwebhookswhatsapp)
  - [Health](#get-apihealth)
- [External API (Phase 2)](#external-api-phase-2--employer--verification)
- [Error Responses](#error-responses)
- [Change Log](#change-log)

---

## Overview

Skilved exposes two API surfaces:

1. **Internal API** — Next.js API routes consumed by the web frontend and agents
2. **External API** (Phase 2+) — Public REST API for employer integrations and the Verification API

All APIs are JSON over HTTPS. Authentication uses Firebase ID tokens (JWT) passed as `Authorization: Bearer {token}`.

**Base URL:** `https://skilved.com/api`
**API Version prefix (external):** `/v1/`

---

## Authentication

### Anonymous Requests
No authentication required. Session tracked via `X-Session-ID` header.

### Authenticated Requests
```
Authorization: Bearer {firebase_id_token}
```

### Rate Limiting

| Endpoint Type | Anonymous | Authenticated |
|---|---|---|
| Feed | 60 req/min | 120 req/min |
| Career Simulation | 5 req/min | 20 req/min |
| Skills Pulse | 120 req/min | 120 req/min |
| Employer Score | 120 req/min | 120 req/min |
| Cohort Intelligence | 30 req/min | 60 req/min |
| Detail | 100 req/min | 200 req/min |
| Apply | 10 req/min | 20 req/min |
| Profile write | — | 10 req/min |
| Events | 200 req/min | 200 req/min |

---

## Internal API Routes

### `GET /api/feed`

Returns ranked list of opportunities with intelligence layer data.

**Query Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `trade` | string | No | Trade category filter |
| `province` | string | No | Province filter |
| `type` | string | No | Opportunity type filter |
| `sort` | string | No | `relevance` (default) \| `newest` \| `closing_soon` |
| `minEmployerGrade` | string | No | Filter by employer grade: `A` \| `B` \| `AB` (NEW v2.0) |
| `salaryMin` | number | No | Minimum salary |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Results per page (max: 50) |

**Response additions v2.0:**
```typescript
interface OpportunityCard {
  // ... all existing fields ...

  // Employer Accountability — NEW v2.0
  employerAccountabilityScore?: number;
  employerAccountabilityGrade?: 'A' | 'B' | 'C' | 'D' | 'F';
  employerAccountabilityContext?: string; // "8 placements · 92% completed"
  employerScoreSampleSize?: number;

  // Cohort Intelligence — NEW v2.0 (authenticated only)
  cohortViewers?: number;
  cohortApplicants?: number;
  cohortInterviews?: number;
  cohortPlacements?: number;
  cohortInterviewRate?: number;
  cohortIsTopForProfile?: boolean;
  cohortSize?: number;

  // Career Simulation Teaser — NEW v2.0 (authenticated only)
  simulationTeaser?: {
    missingQualification: string;
    currentMatchScore: number;
    hypotheticalMatchScore: number;
    message: string; // "Getting N4 would make you a 95% match"
  };

  // ATS platform — NEW v2.0
  applicationPlatform?: ATSPlatform;
}
```

---

### `GET /api/opportunities/:id`

Returns full opportunity detail including intelligence layer data.

**Response additions v2.0:**
```typescript
{
  opportunity: {
    // ... all existing fields ...
    applicationPlatform: ATSPlatform;       // NEW
    employerAccountabilityFull?: {          // NEW
      score: number;
      grade: string;
      sampleSize: number;
      placementRate: number;
      completionRate: number;
      avgSalary: number;
      wouldRecommend: number;
      summary: string;
      trend: 'improving' | 'stable' | 'declining';
    };
    cohortIntelligenceFull?: {              // NEW (authenticated only)
      cohortSize: number;
      cohortDescription: string;
      applicants: number;
      interviews: number;
      placements: number;
      interviewRate: number;
      isTopForCohort: boolean;
    };
  };
}
```

---

### `POST /api/apply`

Records an application (in-app method) or tracks external apply click.

**Request body:**
```typescript
{
  opportunityId: string;
  method: 'external' | 'in_app';
  // In-app only:
  coverNote?: string;
  documentsSubmitted?: string[];
}
```

**Response:**
```typescript
{
  applicationId: string;
  status: 'recorded';
  message: string;                     // "Application sent!" or "Click tracked"
  nextSteps?: string[];                // guidance for the applicant
}
```

---

---

### `POST /api/career/simulate` — NEW v2.0

Run a career simulation for the authenticated user.

**Authentication:** Required (Bearer token)

**Request Body:**
```typescript
{
  queryType:
    | 'add_qualification'
    | 'change_province'
    | 'get_trade_test'
    | 'take_learnership'
    | 'add_certification'
    | 'change_trade';
  queryDetail: string;  // e.g., "N4 Electrical Engineering" or "gauteng"
  compareWith?: {       // Optional: Type 6 path comparison
    queryType: string;
    queryDetail: string;
  };
}
```

**Response:**
```typescript
{
  simulationId: string;
  query: {
    type: string;
    detail: string;
    description: string; // human-readable "If you get N4 Electrical Engineering"
  };
  currentState: {
    opportunities: number;
    avgSalary?: number;
    placementRate?: number;
    avgDaysToPlacement?: number;
  };
  hypotheticalState: {
    opportunities: number;
    avgSalary?: number;
    placementRate?: number;
    avgDaysToPlacement?: number;
  };
  delta: {
    opportunitiesChange: number;      // always available
    salaryChange?: number;            // only when outcome data available
    placementRateChange?: number;
    daysToPlacementChange?: number;
  };
  sampleSize: number;
  confidence: 'insufficient' | 'low' | 'medium' | 'high';
  narrative: string;                  // Gemini-generated explanation
  alignedOpportunities: OpportunityCard[]; // Current open opps matching simulation
  dataNote: string;                   // "Based on X verified outcomes" or "Opportunity-based only"
}
```

**Example:**
```bash
curl -X POST https://skilved.com/api/career/simulate \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"queryType":"add_qualification","queryDetail":"N4 Electrical Engineering"}'
```

---

### `GET /api/skills-pulse` — NEW v2.0

Returns the latest Skills Pulse snapshot for the public dashboard.

**Authentication:** Not required (public)

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `trade` | string | Filter by trade category |
| `province` | string | Filter by province |
| `section` | string | `overview` \| `gaps` \| `expiry` \| `roi` \| `tvet` \| `predictive` \| `all` |
| `date` | string | Specific snapshot date (YYYY-MM-DD, default: latest) |

**Response:**
```typescript
{
  snapshot: {
    date: string;
    generatedAt: string;
    nationalOverview: NationalOverview;
    demandSupplyGaps?: DemandSupplyGap[];
    expiryRisks?: ExpiryRisk[];
    qualificationROI?: QualificationROI[];
    tvetPerformance?: TVETPerformance[];
    predictiveSignals?: PredictiveSignal[];
    geminiIntelligence?: {
      urgentGaps: string[];
      weeklyInsight: string;
      policyRecommendation?: string; // shown to authenticated government users
    };
    dataNote: string; // "Based on N data points"
    confidenceScore: number;
  };
  availableDates: string[]; // last 30 days of snapshots
}
```

---

### `GET /api/employers/:id/accountability` — NEW v2.0

Returns full employer accountability score.

**Authentication:** Not required (public)

**Response:**
```typescript
{
  employerName: string;
  score: number | null;
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | null;
  sampleSize: number;
  confidence: 'insufficient' | 'low' | 'medium' | 'high';
  components?: {
    placementScore: number;
    completionScore: number;
    salaryScore: number;
    feedbackScore: number;
    timeScore: number;
  };
  placementRate?: number;
  completionRate?: number;
  avgSalary?: number;
  wouldRecommend?: number;
  avgDaysToPlacement?: number;
  summary?: string;
  trend?: 'improving' | 'stable' | 'declining';
  calculatedAt: string;
  dataNote: string;
}
```

---

### `GET /api/cohort/intelligence` — NEW v2.0

Returns cohort intelligence for the current user's profile.

**Authentication:** Required

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `opportunityId` | string | Get cohort intel for specific opportunity |
| `type` | string | `weekly_summary` \| `top_opportunities` \| `warnings` |

**Response:**
```typescript
{
  cohort: {
    size: number;
    description: string;  // "N3 electricians in Gauteng, entry level"
  };
  forOpportunity?: {      // if opportunityId provided
    viewers: number;
    applicants: number;
    interviews: number;
    placements: number;
    interviewRate: number;
    isTopForCohort: boolean;
  };
  topOpportunities?: {    // top opportunities for cohort this week
    opportunityId: string;
    title: string;
    organisation: string;
    applicants: number;
    interviewRate: number;
    isHighSuccess: boolean;
  }[];
  warningOpportunities?: {  // low success rate opportunities
    opportunityId: string;
    title: string;
    lowSuccessReason: string;
  }[];
  weeklyStats?: {
    totalApplied: number;
    totalPlaced: number;
    avgDaysToPlacement: number;
    topEmployer: string;
  };
}
```

---

### `GET /api/credentials` — NEW v2.0

Returns the current user's micro-credentials.

**Authentication:** Required

**Response:**
```typescript
{
  credentials: {
    id: string;
    type: CredentialType;
    issuedAt: string;
    badgeLabel: string;
    badgeColor: string;
    verificationCode: string;
    publicUrl: string;
    qrCodeUrl: string;
    metadata?: Record<string, any>;
    status: 'active' | 'revoked';
  }[];
  eligibleFor?: {          // credentials user could earn but hasn't yet
    type: CredentialType;
    requirement: string;   // "Submit 3 more applications"
    currentProgress: number;
    targetProgress: number;
  }[];
}
```

---

### `GET /api/verify/:code` — NEW v2.0

Public credential verification endpoint.

**Authentication:** Not required (public)

**Response:**
```typescript
{
  valid: boolean;
  credential?: {
    type: CredentialType;
    label: string;
    issuedAt: string;
    metadata?: Record<string, any>;
  };
  holder?: {
    displayName: string;
    trade: string;
    province: string;
  };
  verifiedAt: string;
  reason?: string;  // if valid: false
}
```

---

### `GET /api/profile`

Returns the current user's profile (auth required).

**Response:** Full `User` object (minus sensitive fields like hashed phone)

---

---

### `PUT /api/profile`

Updates the current user's profile.

**Request body:** Partial `User` object (only updatable fields)

**Updatable fields:**
```typescript
{
  displayName?: string;
  primaryTrade?: TradeCategory;
  secondaryTrade?: TradeCategory;
  province?: Province;
  city?: string;
  highestQualification?: Qualification;
  nqfLevel?: number;
  tradeTested?: boolean;
  certificates?: Certificate[];
  experienceLevel?: ExperienceLevel;
  yearsExperience?: number;
  currentEmploymentStatus?: EmploymentStatus;
  opportunityTypePreferences?: OpportunityType[];
  salaryMin?: number;
  willingToRelocate?: boolean;
  digestEnabled?: boolean;
  digestTime?: string;
  profilePublic?: boolean;
}
```

**Response:**
```typescript
{
  user: User;
  completionPct: number;
  completionLevel: string;
  unlockedFeatures: string[];          // what just unlocked from this update
}
```

---

---

### `GET /api/permissions`

*(Unchanged from v1.0)*

---

### `POST /api/events`

Analytics event ingestion. Fire-and-forget.

**Request body:**
```typescript
{
  events: AnalyticsEvent[];
}

interface AnalyticsEvent {
  eventType: string;
  sessionId: string;
  opportunityId?: string;
  properties?: Record<string, any>;
  timestamp?: string;                  // ISO, defaults to server time
}
```

**Response:** `{ received: number }`

---

**New event types v2.0:**
- `career_simulation_started`
- `career_simulation_completed`
- `employer_score_viewed`
- `cohort_intelligence_displayed`
- `cohort_intelligence_acted_on`
- `micro_credential_issued`
- `micro_credential_verified`
- `skills_pulse_viewed`

---

### `POST /api/auth/whatsapp/send-otp`

Sends OTP to WhatsApp number.

**Request body:**
```typescript
{
  phoneNumber: string;                 // E.164 format: +27821234567
}
```

**Response:**
```typescript
{
  sent: boolean;
  expiresIn: number;                   // seconds (600 = 10 minutes)
}
```

Rate limited: 3 OTP sends per phone number per hour.

---

---

### `POST /api/auth/whatsapp/verify-otp`

Verifies OTP and returns Firebase custom token.

**Request body:**
```typescript
{
  phoneNumber: string;
  otp: string;
}
```

**Response:**
```typescript
{
  customToken: string;                 // Firebase custom token — exchange for ID token client-side
  isNewUser: boolean;
}
```

---

---

### `POST /api/webhooks/whatsapp`

Receives incoming WhatsApp messages (Meta webhook).

**Security:** Validates `X-Hub-Signature-256` header against `WHATSAPP_VERIFY_TOKEN`.

**Handled message types:**
- OTP replies → OtpHandler
- Outcome follow-up replies → OutcomeReplyHandler
- Digest replies (STOP, etc.) → DigestReplyHandler
- Unknown → UnknownMessageHandler (graceful fallback)

---

---

### `GET /api/health`

*(Updated v2.0)*

**Response:**
```typescript
{
  status: 'ok';
  version: string;
  timestamp: string;
  services: {
    firestore: 'ok' | 'degraded' | 'down';
    bigquery: 'ok' | 'degraded' | 'down';
    redis: 'ok' | 'degraded' | 'down';
    gemini: 'ok' | 'degraded' | 'down';
    captchaSolver: 'ok' | 'degraded' | 'down';  // NEW v2.0
  };
  agents: {                                       // NEW v2.0
    scout: { lastRun: string; status: string };
    skillsPulse: { lastRun: string; status: string };
    employerAccountability: { lastRun: string; status: string };
    collectiveIntelligence: { lastRun: string; status: string };
  };
}
```

---

## External API (Phase 2 — Employer & Verification)

### Base URL: `https://api.skilved.com/v1/`

Authentication via API key: `X-API-Key: sk_live_{key}`

---

Authentication via API key: `X-API-Key: sk_live_{key}`

### `GET /v1/skills-pulse/export` — NEW v2.0

Government data license API endpoint.

**Authentication:** Government API key required (`X-API-Key: sk_gov_{key}`)

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `from` | string | Start date (YYYY-MM-DD) |
| `to` | string | End date (YYYY-MM-DD) |
| `province` | string | Filter by province |
| `trade` | string | Filter by trade |
| `format` | string | `json` \| `csv` \| `pdf` |

**Response:** Full Skills Pulse data for date range, optimised for government consumption.

### `GET /v1/employer/:id/score` — NEW v2.0

B2B employer accountability score API.

**Authentication:** Standard API key

**Response:** Full employer accountability score with all components.

### `POST /v1/career/simulate` — NEW v2.0

B2B career simulation API for white-label partners.

**Authentication:** Partner API key

**Request/Response:** Same as internal `/api/career/simulate`

---

## Error Responses

All errors follow this format:

```typescript
{
  error: {
    code: string;                      // machine-readable
    message: string;                   // human-readable
    details?: any;                     // additional context
  };
  requestId: string;                   // for support
}
```

**Error codes:**

| Code | HTTP Status | Description |
|---|---|---|
| `UNAUTHENTICATED` | 401 | No or invalid auth token |
| `FORBIDDEN` | 403 | Valid auth but insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Invalid request parameters |
| `RATE_LIMITED` | 429 | Too many requests |
| `OPPORTUNITY_EXPIRED` | 410 | Opportunity is no longer active |
| `INSUFFICIENT_CREDITS` | 402 | Employer out of referral credits |
| `VERIFICATION_FAILED` | 422 | Credential could not be verified |
| `INTERNAL_ERROR` | 500 | Server error |

---

**New error codes v2.0:**

| Code | HTTP Status | Description |
|---|---|---|
| `SIMULATION_INSUFFICIENT_DATA` | 422 | Cohort size too small for outcome simulation |
| `EMPLOYER_SCORE_UNAVAILABLE` | 404 | Employer has insufficient outcome data |
| `COHORT_TOO_SMALL` | 422 | Cohort < 5 users — privacy threshold |
| `CREDENTIAL_NOT_FOUND` | 404 | Verification code not found |
| `CREDENTIAL_REVOKED` | 410 | Credential has been revoked |
| `CAPTCHA_SOLVER_UNAVAILABLE` | 503 | CAPTCHA solving service temporarily unavailable |
| `ATS_ADAPTER_UNAVAILABLE` | 503 | Specific ATS platform adapter temporarily down |
| `SKILLS_PULSE_STALE` | 503 | Dashboard data older than 26 hours |

---

## Change Log

### v2.0 — June 2026
- Added `POST /api/career/simulate` endpoint
- Added `GET /api/skills-pulse` endpoint
- Added `GET /api/employers/:id/accountability` endpoint
- Added `GET /api/cohort/intelligence` endpoint
- Added `GET /api/credentials` endpoint
- Added `GET /api/verify/:code` public credential verification endpoint
- Updated `GET /api/feed` response with employer score, cohort intelligence, simulation teaser, ATS platform fields
- Updated `GET /api/opportunities/:id` response with full employer score and cohort intelligence
- Updated `GET /api/health` with CAPTCHA solver and agent status fields
- Added `minEmployerGrade` query parameter to feed
- Added new event types to `POST /api/events`
- Added new error codes for intelligence layer
- Added `GET /v1/skills-pulse/export` government API endpoint
- Added `GET /v1/employer/:id/score` B2B endpoint
- Added `POST /v1/career/simulate` B2B endpoint
- Updated rate limiting table for new endpoints
- Added table of contents

*Document version 2.0 — June 2026*
*Owner: Engineering*
*External API (v1) available Phase 2+*