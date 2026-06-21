# Skilved — API Reference
### Internal + External APIs | Version 1.0 | June 2026

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

### Anonymous requests
No authentication required. Session tracked via `X-Session-ID` header (UUID stored in cookie).

### Authenticated requests
```
Authorization: Bearer {firebase_id_token}
```

Token obtained via Firebase Auth (WhatsApp OTP or Google OAuth).

### Rate Limiting
| Endpoint type | Anonymous | Authenticated |
|---|---|---|
| Feed | 60 req/min | 120 req/min |
| Detail | 100 req/min | 200 req/min |
| Apply | 10 req/min | 20 req/min |
| Profile write | — | 10 req/min |
| Events | 200 req/min | 200 req/min |

Rate limit headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Internal API Routes

### `GET /api/feed`

Returns a ranked list of opportunities for the current user/session.

**Query parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `trade` | string | No | Trade category filter |
| `province` | string | No | Province filter |
| `type` | string | No | Opportunity type filter |
| `sort` | string | No | `relevance` (default) \| `newest` \| `closing_soon` |
| `salaryMin` | number | No | Minimum salary filter |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Results per page (default: 20, max: 50) |

**Request headers:**
```
X-Session-ID: {session_uuid}          ← required for anonymous personalisation
Authorization: Bearer {token}          ← optional, unlocks personalised ranking
```

**Response:**
```typescript
{
  opportunities: OpportunityCard[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  meta: {
    personalised: boolean;             // true if logged-in user
    filterCount: number;               // active filters applied
    totalActive: number;               // total active opportunities
    lastUpdated: string;               // ISO timestamp of last agent run
  };
}

interface OpportunityCard {
  id: string;
  slug: string;
  title: string;
  organisation: string;
  opportunityType: string;
  tradeCategory: string;
  province: string;
  city?: string;
  salaryDisplay?: string;
  deadline?: string;                   // ISO date
  discoveredAt: string;                // ISO timestamp
  freshnessLabel: string;              // "Found 2 hours ago"
  isNew: boolean;                      // < 24 hours old
  isClosingSoon: boolean;              // < 3 days to deadline
  applicationMethod: string;
  qualityScore: number;
  // Personalisation (logged-in only)
  matchScore?: number;
  matchExplanation?: string;
  // Engagement
  viewCount: number;
  applyClickCount: number;
}
```

**Example:**
```bash
curl https://skilved.com/api/feed \
  -H "X-Session-ID: sess_abc123" \
  -G \
  --data-urlencode "trade=electrical" \
  --data-urlencode "province=gauteng" \
  --data-urlencode "sort=newest"
```

---

### `GET /api/opportunities/:id`

Returns full opportunity detail.

**Path parameters:**
- `id` — opportunity ID or slug

**Response:**
```typescript
{
  opportunity: {
    // All OpportunityCard fields, plus:
    descriptionFull: string;
    descriptionSummary: string;
    requirementsChecklist: string[];
    qualificationsRequired: string[];
    experienceRequired?: string;
    tradeTested: boolean;
    documentsRequired?: string[];
    duration?: string;
    applicationUrl?: string;
    applicationEmail?: string;
    sourceUrl: string;
    sourceName: string;
    isVerifiedSource: boolean;
  };
  related: OpportunityCard[];          // 3-5 similar opportunities
  // Personalisation
  userHasApplied?: boolean;
  userHasSaved?: boolean;
  matchScore?: number;
  matchExplanation?: string;
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

### `POST /api/save`

Saves or unsaves an opportunity for a logged-in user.

**Request body:**
```typescript
{
  opportunityId: string;
  action: 'save' | 'unsave';
}
```

---

### `GET /api/profile`

Returns the current user's profile (auth required).

**Response:** Full `User` object (minus sensitive fields like hashed phone)

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

### `POST /api/webhooks/whatsapp`

Receives incoming WhatsApp messages (Meta webhook).

**Security:** Validates `X-Hub-Signature-256` header against `WHATSAPP_VERIFY_TOKEN`.

**Handled message types:**
- OTP replies → OtpHandler
- Outcome follow-up replies → OutcomeReplyHandler
- Digest replies (STOP, etc.) → DigestReplyHandler
- Unknown → UnknownMessageHandler (graceful fallback)

---

### `GET /api/health`

Uptime check. Returns 200 if healthy.

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
  };
}
```

---

## External API (Phase 2 — Employer & Verification)

### Base URL: `https://api.skilved.com/v1/`

Authentication via API key: `X-API-Key: sk_live_{key}`

---

### `GET /v1/candidates`

Search for matched candidates (employer dashboard).

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `trade` | string | Trade category |
| `province` | string | Province |
| `qualificationMin` | string | Minimum NQF level |
| `experienceMin` | string | Minimum experience level |
| `tradeTested` | boolean | Require trade-tested |
| `verified` | boolean | Require MyMzansi-verified |
| `page` | number | Pagination |
| `limit` | number | Results per page (max 50) |

**Response:**
```typescript
{
  candidates: CandidateProfile[];
  total: number;
  hasMore: boolean;
}

interface CandidateProfile {
  id: string;                          // anonymised until contact purchased
  trade: string;
  province: string;
  qualification: string;
  nqfLevel: number;
  experienceLevel: string;
  tradeTested: boolean;
  verified: boolean;                   // MyMzansi verified
  completionLevel: string;             // profile completeness
  lastActiveAt: string;                // recency signal
  // Contact details revealed after referral purchase:
  contactRevealed: boolean;
  displayName?: string;                // only if contactRevealed
  whatsappNumber?: string;             // only if contactRevealed
}
```

---

### `POST /v1/referrals`

Purchase a candidate referral (reveals contact details, bills employer).

**Request body:**
```typescript
{
  candidateId: string;
  jobTitle: string;                    // what role you're hiring for
  message?: string;                    // optional intro message to candidate
}
```

**Response:**
```typescript
{
  referralId: string;
  candidate: {
    displayName: string;
    whatsappNumber: string;
    email?: string;
  };
  billedAmount: number;               // in ZAR
  invoiceUrl: string;
}
```

---

### `POST /v1/verify`

Verify a candidate's credentials (Phase 2 — requires MyMzansi integration).

**Request body:**
```typescript
{
  candidateId?: string;                // Skilved candidate ID
  // OR:
  idNumber?: string;                   // SA ID number
  qualificationType: string;           // "N3 Electrical", "Trade Test - Electrician"
}
```

**Response:**
```typescript
{
  verified: boolean;
  verificationId: string;
  credential?: {
    type: string;
    issuingAuthority: string;
    issueDate: string;
    expiryDate?: string;
    nqfLevel?: number;
  };
  verifiedAt: string;
  source: 'mymzansi' | 'saqa' | 'namb' | 'seta';
  billedAmount: number;                // in ZAR (R5-R20)
}
```

---

### `GET /v1/graph/insights`

Access the SA Skills Graph data (data license required).

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `trade` | string | Filter by trade |
| `qualification` | string | Filter by qualification |
| `province` | string | Filter by province |
| `metric` | string | `salary_range` \| `placement_rate` \| `time_to_placement` |

**Response:**
```typescript
{
  insights: SkillsGraphInsight[];
  dataAsOf: string;                    // last graph rebuild date
  sampleSize: number;                  // data points this is based on
}

interface SkillsGraphInsight {
  trade: string;
  qualification: string;
  nqfLevel: number;
  province?: string;
  
  salaryRange?: {
    min: number;
    median: number;
    max: number;
    currency: 'ZAR';
  };
  
  placementRate?: {
    applyToInterview: number;          // percentage
    applyToOffer: number;
    offerToAccept: number;
  };
  
  timeToPlacement?: {
    avgDays: number;
    medianDays: number;
  };
  
  opportunityTypes: {
    type: string;
    count: number;
    avgSalary: number;
  }[];
  
  confidenceScore: number;             // 0-1 based on sample size
}
```

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

## Webhooks (Employer API)

Employers can register webhook URLs to receive real-time events.

**Supported events:**

| Event | Description |
|---|---|
| `candidate.matched` | New candidate matches employer's criteria |
| `referral.accepted` | Candidate accepts employer's intro |
| `referral.declined` | Candidate declines |
| `placement.confirmed` | Outcome confirmed as accepted |

**Webhook payload:**
```typescript
{
  id: string;                          // event ID
  type: string;                        // event type
  createdAt: string;
  data: Record<string, any>;           // event-specific data
}
```

**Security:** HMAC-SHA256 signature in `X-Skilved-Signature` header.

---

*Document version 1.0 — June 2026*  
*Owner: Engineering*  
*External API (v1) available Phase 2+*
