# Skilved — Environment Variables & Configuration
### Complete Reference | Version 2.0 | June 2026

---

## Table of Contents

- [Overview](#overview)
- [GCP Core](#gcp-core)
- [Firebase / Firestore](#firebase--firestore)
- [Google AI / Vertex AI](#google-ai--vertex-ai)
- [BigQuery](#bigquery)
- [Redis](#redis)
- [WhatsApp Business API](#whatsapp-business-api-meta)
- [Authentication](#authentication-nextauth)
- [App Configuration](#app-configuration)
- [Agent Configuration — Core Agents](#agent-configuration--core-agents)
- [ATS Adapter Configuration](#ats-adapter-configuration-new-v20)
- [Intelligence Layer Configuration](#intelligence-layer-configuration-new-v20)
- [Feature Flags](#feature-flags-updated-v20)
- [External Services Phase 2](#external-services-phase-2)
- [GCP Secret Manager Setup](#gcp-secret-manager-setup)
- [Per-Environment Config](#per-environment-config)
- [Vercel Environment Variable Setup](#vercel-environment-variable-setup)
- [Change Log](#change-log)

---

## Overview

All secrets are stored in **GCP Secret Manager**. Environment variables are injected at runtime via Cloud Run secret binding and Vercel environment variables. No secrets in `.env` files committed to git.

---

## GCP Core

| Variable | Required | Description | Where Set |
|---|---|---|---|
| `GCP_PROJECT_ID` | Yes | GCP project ID (`skilved-prod`) | All services |
| `GCP_REGION` | Yes | Primary region (`africa-south1`) | All services |
| `GOOGLE_APPLICATION_CREDENTIALS` | Cloud Run | Path to service account key | Cloud Run (auto-injected) |

---

## Firebase / Firestore

| Variable | Required | Description | Where Set |
|---|---|---|---|
| `FIREBASE_PROJECT_ID` | Yes | Same as GCP project ID | Web + agents |
| `FIREBASE_CLIENT_EMAIL` | Yes | Service account email | Server-side only |
| `FIREBASE_PRIVATE_KEY` | Yes | Service account private key | Secret Manager |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase Web API key | Web only |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | `skilved-prod.firebaseapp.com` | Web only |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket | Web only |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | FCM sender ID | Web only |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase app ID | Web only |

---

## Google AI / Vertex AI

| Variable | Required | Description | Where Set |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes | Gemini API key (Google AI Studio) | Agents + web API |
| `VERTEX_AI_PROJECT` | Yes | GCP project for Vertex AI | Matching agent |
| `VERTEX_AI_LOCATION` | Yes | `us-central1` | Matching agent |
| `VERTEX_AI_SEARCH_ENGINE_ID` | Yes | Vertex AI Search data store ID | Discovery + matching |
| `VERTEX_AI_RANKING_CONFIG` | Yes | Vertex AI Ranking configuration name | Matching agent |

---

## BigQuery

| Variable | Required | Description | Where Set |
|---|---|---|---|
| `BIGQUERY_PROJECT_ID` | Yes | GCP project ID | All services |
| `BIGQUERY_DATASET` | Yes | `skilved_prod` or `skilved_dev` | All services |
| `BIGQUERY_LOCATION` | Yes | `africa-south1` | All services |

---

## Redis

| Variable | Required | Description | Where Set |
|---|---|---|---|
| `REDIS_URL` | Yes | `redis://10.x.x.x:6379` (internal VPC IP) | Web + agents |
| `REDIS_PASSWORD` | No | Redis AUTH password (if enabled) | Web + agents |

---

## WhatsApp Business API (Meta)

| Variable | Required | Description | Where Set |
|---|---|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Yes | Meta Business permanent access token | Notification + webhook |
| `WHATSAPP_PHONE_NUMBER_ID` | Yes | WhatsApp Business phone number ID | Notification + webhook |
| `WHATSAPP_VERIFY_TOKEN` | Yes | Webhook verification token | Webhook handler |
| `WHATSAPP_APP_SECRET` | Yes | Meta app secret (for signature verification) | Webhook handler |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Yes | Meta Business Account ID | Notification agent |

---

## Authentication (NextAuth)

| Variable | Required | Description | Where Set |
|---|---|---|---|
| `NEXTAUTH_SECRET` | Yes | Random 32-char string for JWT signing | Web only |
| `NEXTAUTH_URL` | Yes | `https://skilved.com` | Web only |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID | Web only |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret | Web only |

---

## App Configuration

| Variable | Required | Description | Default |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | `https://skilved.com` | — |
| `NEXT_PUBLIC_APP_ENV` | Yes | `production` \| `staging` \| `development` | `development` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics 4 ID | — |
| `NODE_ENV` | Auto | `production` \| `development` | Auto |
| `PORT` | Cloud Run | Port for HTTP server | `8080` |

---

## Agent Configuration — Core Agents

| Variable | Required | Description | Default |
|---|---|---|---|
| `SCOUT_AGENT_SCHEDULE` | Yes | Cron: `0 */4 * * *` | Cloud Scheduler |
| `SCOUT_MAX_CONCURRENCY` | No | Max parallel source crawlers | `10` |
| `SCOUT_TIMEOUT_MS` | No | Per-source timeout | `30000` |
| `ANALYST_INTELLIGENCE_THRESHOLD` | No | Min quality for detailed analysis | `40` |
| `QUALITY_MIN_SCORE_PUBLISH` | No | Min score to auto-publish | `70` |
| `QUALITY_MAX_SCORE_REJECT` | No | Max score to auto-reject | `29` |
| `NOTIFICATION_SEND_HOUR_SAST` | No | Hour to send digests | `7` |
| `NOTIFICATION_MIN_OPPORTUNITIES` | No | Min new opps to trigger digest | `3` |
| `OUTCOME_FOLLOWUP_DAY3` | No | Days for first follow-up | `3` |
| `OUTCOME_FOLLOWUP_DAY14` | No | Days for second follow-up | `14` |
| `OUTCOME_FOLLOWUP_DAY30` | No | Days for final follow-up | `30` |
| `CAREER_PLAN_TRIGGER_PCT` | No | Profile completion to trigger career plan | `40` |
| `CAREER_GRAPH_MIN_SAMPLE` | No | Min data points for timeline estimate | `10` |
| `APPLICATION_LEVEL3_THRESHOLD` | No | Default match score for Level 3 | `85` |
| `APPLICATION_LEVEL4_MIN_THRESHOLD` | No | Minimum Level 4 user threshold | `50` |
| `APPLICATION_CIRCUIT_BREAKER_MAX_PER_HOUR` | No | Max applications per user per hour | `5` |
| `APPLICATION_CIRCUIT_BREAKER_RESUME_HOURS` | No | Auto-resume hours | `24` |
| `REVENUE_TRIGGER_COOLDOWN_HOURS` | No | Min hours between upgrade prompts | `72` |
| `REVENUE_MIN_CONFIDENCE` | No | Min confidence to send prompt | `0.70` |
| `GROWTH_CONTENT_POST_HOUR_SAST` | No | Hour to publish social content | `9` |
| `CS_MAX_AGENT_ATTEMPTS` | No | Agent reply attempts before escalation | `2` |
| `CS_ESCALATION_RESPONSE_HOURS` | No | SLA for human review | `24` |
| `AGENT_CONTEXT_MAX_RECENT_ACTIONS` | No | Max recentActions entries per user | `50` |

---

## ATS Adapter Configuration — NEW v2.0

| Variable | Required | Description | Sprint |
|---|---|---|---|
| `CAPTCHA_SOLVER_API_KEY` | Sprint 2 | 2captcha or CapSolver API key | Sprint 2 |
| `CAPTCHA_SOLVER_PROVIDER` | No | `2captcha` or `capsolver` | Default: `2captcha` |
| `CAPTCHA_MAX_WAIT_SECONDS` | No | Max time to wait for CAPTCHA solve | `120` |
| `CAPTCHA_SOLVER_FALLBACK_PROVIDER` | No | Fallback if primary fails | `capsolver` |
| `ATS_SERVICE_ACCOUNT_SF_EMAIL` | Sprint 2 | SuccessFactors service account email | Sprint 2 |
| `ATS_SERVICE_ACCOUNT_SF_PASSWORD` | Sprint 2 | SuccessFactors service account password | Secret Manager |
| `ATS_SERVICE_ACCOUNT_TALEO_EMAIL` | Sprint 3 | Oracle Taleo service account email | Sprint 3 |
| `ATS_SERVICE_ACCOUNT_TALEO_PASSWORD` | Sprint 3 | Oracle Taleo service account password | Secret Manager |
| `ATS_SERVICE_ACCOUNT_PAGEUP_EMAIL` | Sprint 3 | PageUp service account email | Sprint 3 |
| `ATS_SERVICE_ACCOUNT_PAGEUP_PASSWORD` | Sprint 3 | PageUp service account password | Secret Manager |
| `ATS_SERVICE_ACCOUNT_MERSETA_EMAIL` | Sprint 3 | MERSETA portal service account | Sprint 3 |
| `ATS_SERVICE_ACCOUNT_MERSETA_PASSWORD` | Sprint 3 | MERSETA portal password | Secret Manager |
| `ATS_SERVICE_ACCOUNT_EWSETA_EMAIL` | Sprint 3 | EWSETA portal service account | Sprint 3 |
| `ATS_SERVICE_ACCOUNT_EWSETA_PASSWORD` | Sprint 3 | EWSETA portal password | Secret Manager |
| `PLAYWRIGHT_MANUAL_FALLBACK_LIST` | No | Comma-separated URL patterns to force email | `""` |
| `PLAYWRIGHT_SCREENSHOT_BUCKET` | Sprint 2 | GCS bucket for submission screenshots | Sprint 2 |
| `ATS_ADAPTER_SUCCESSFACTORS_ENABLED` | No | Enable SuccessFactors adapter | `true` (Sprint 2+) |
| `ATS_ADAPTER_TALEO_ENABLED` | No | Enable Oracle Taleo adapter | `true` (Sprint 3+) |
| `ATS_ADAPTER_PAGEUP_ENABLED` | No | Enable PageUp adapter | `true` (Sprint 3+) |
| `ATS_ADAPTER_MERSETA_ENABLED` | No | Enable MERSETA portal adapter | `true` (Sprint 3+) |
| `ATS_ADAPTER_EWSETA_ENABLED` | No | Enable EWSETA portal adapter | `true` (Sprint 3+) |
| `ATS_ADAPTER_CETA_ENABLED` | No | Enable CETA portal adapter | `true` (Sprint 4+) |
| `ACCOUNT_CREATION_MODE` | No | `service_account` (Approach A) or `per_user` (Approach B) | `service_account` |

---

## Intelligence Layer Configuration — NEW v2.0

### Skills Pulse Agent (Agent 14)

| Variable | Required | Description | Default |
|---|---|---|---|
| `SKILLS_PULSE_SCHEDULE` | Yes | Cron: `0 2 * * *` (2am SAST) | Cloud Scheduler |
| `SKILLS_PULSE_BIGQUERY_TIMEOUT_MS` | No | BigQuery query timeout | `90000` |
| `SKILLS_PULSE_MIN_OUTCOMES_FOR_ROI` | No | Min outcomes to show qualification ROI | `10` |
| `SKILLS_PULSE_GOVERNMENT_REPORT_BUCKET` | Yes | GCS bucket for PDF reports | Sprint 1 |
| `SKILLS_PULSE_GOVERNMENT_REPORT_DAY` | No | Day of month for PDF generation | `1` |
| `SKILLS_PULSE_PREDICTIVE_ENABLED` | No | Enable predictive signals section | `false` (Sprint 4) |
| `SKILLS_PULSE_REVALIDATION_TOKEN` | Yes | Next.js revalidation token for dashboard | Sprint 1 |

### Career Simulation Agent (Agent 15)

| Variable | Required | Description | Default |
|---|---|---|---|
| `CAREER_SIM_MIN_COHORT_SIZE` | No | Min users in cohort before showing outcomes | `5` |
| `CAREER_SIM_COHORT_WINDOW_DAYS` | No | Days to look back for cohort outcomes | `730` |
| `CAREER_SIM_CACHE_TTL_HOURS` | No | Redis cache TTL for simulations | `24` |
| `CAREER_SIM_MAX_COHORT_ROWS` | No | Max BigQuery rows for cohort query | `500` |
| `CAREER_SIM_OPPORTUNITY_ONLY_THRESHOLD` | No | Show opportunity-only below this sample size | `5` |
| `CAREER_SIM_MEDIUM_CONFIDENCE_THRESHOLD` | No | Cohort size for medium confidence | `20` |
| `CAREER_SIM_HIGH_CONFIDENCE_THRESHOLD` | No | Cohort size for high confidence | `100` |

### Employer Accountability Agent (Agent 16)

| Variable | Required | Description | Default |
|---|---|---|---|
| `EMPLOYER_ACCOUNTABILITY_SCHEDULE` | Yes | Cron: `0 3 * * 1` (3am Monday) | Cloud Scheduler |
| `EMPLOYER_ACCOUNTABILITY_MIN_OUTCOMES` | No | Min verified outcomes to show score | `3` |
| `EMPLOYER_ACCOUNTABILITY_ANOMALY_THRESHOLD` | No | Score jump to trigger review | `20` |
| `EMPLOYER_ACCOUNTABILITY_LOW_GRADE_THRESHOLD` | No | Score below which shows warning | `34` |
| `EMPLOYER_ACCOUNTABILITY_CACHE_TTL_DAYS` | No | Redis cache TTL for scores | `7` |

### Collective Intelligence Agent (Agent 17)

| Variable | Required | Description | Default |
|---|---|---|---|
| `COLLECTIVE_INT_MIN_COHORT_SIZE` | No | Min users in cohort for display | `5` |
| `COLLECTIVE_INT_CACHE_TTL_HOURS` | No | Redis cache TTL for cohort data | `4` |
| `COLLECTIVE_INT_OPP_CACHE_TTL_HOURS` | No | Redis cache TTL for opp+cohort data | `1` |
| `COLLECTIVE_INT_LOOKBACK_DAYS` | No | Days to look back for cohort activity | `30` |
| `COLLECTIVE_INT_BATCH_SCHEDULE` | Yes | Cron: `0 1 * * *` (1am daily) | Cloud Scheduler |
| `COLLECTIVE_INT_MIN_APPLICANTS_DISPLAY` | No | Min applicants before showing "X applied" | `3` |

### Micro-Credential System

| Variable | Required | Description | Default |
|---|---|---|---|
| `MICRO_CRED_ACTIVE_APPLICANT_MIN_APPS` | No | Min applications for Active Applicant | `5` |
| `MICRO_CRED_ACTIVE_APPLICANT_MIN_PCT` | No | Min passport % for Active Applicant | `40` |
| `MICRO_CRED_PROFILE_COMPLETE_MIN_PCT` | No | Min passport % for Profile Complete | `80` |
| `MICRO_CRED_INTERVIEW_READY_MIN` | No | Min interview invitations for credential | `2` |
| `MICRO_CRED_VERIFICATION_CODE_LENGTH` | No | Length of verification code | `12` |
| `MICRO_CRED_QR_CODE_BUCKET` | Yes | GCS bucket for QR codes | Sprint 2 |
| `CLOUD_STORAGE_CREDENTIALS_BUCKET` | Yes | GCS bucket for credential assets | Sprint 2 |

---

## Feature Flags (Updated v2.0)

| Variable | Default | Description |
|---|---|---|
| `FEATURE_IN_APP_APPLY` | `false` | Enable in-app application form |
| `FEATURE_MYMZANSI_VERIFY` | `false` | Enable MyMzansi credential verification |
| `FEATURE_EMPLOYER_DASHBOARD` | `false` | Enable employer self-serve dashboard |
| `FEATURE_AI_COVER_NOTE` | `true` | Enable AI-generated cover notes |
| `FEATURE_MATCHING_EXPLANATIONS` | `true` | Show match explanations on cards |
| `FEATURE_CAREER_AGENT` | `true` | Enable Career Agent |
| `FEATURE_APPLICATION_AGENT` | `false` | Enable Application Agent (Level 3+) — Week 6 |
| `FEATURE_APPLICATION_SUCCESSFACTORS` | `false` | Enable SuccessFactors adapter — Week 4 |
| `FEATURE_APPLICATION_TALEO` | `false` | Enable Oracle Taleo adapter — Week 6 |
| `FEATURE_APPLICATION_PAGEUP` | `false` | Enable PageUp adapter — Week 6 |
| `FEATURE_APPLICATION_MERSETA` | `false` | Enable MERSETA portal adapter — Week 6 |
| `FEATURE_APPLICATION_EWSETA` | `false` | Enable EWSETA portal adapter — Week 6 |
| `FEATURE_APPLICATION_WEB_FORMS` | `false` | Enable generic Playwright — Week 8 |
| `FEATURE_REVENUE_AGENT` | `false` | Enable Revenue Agent — Week 7 |
| `FEATURE_GROWTH_AGENT` | `false` | Enable Growth Agent — Week 8 |
| `FEATURE_LEVEL4_PERMISSIONS` | `false` | Enable Level 4 full-auto — Week 8 |
| `FEATURE_SKILLS_PULSE_DASHBOARD` | `true` | Enable Skills Pulse Dashboard — Week 1 |
| `FEATURE_SKILLS_PULSE_LIVE` | `false` | Enable fully automated Skills Pulse — Week 8 |
| `FEATURE_CAREER_SIMULATION` | `false` | Enable Career Simulation Engine — Week 5 |
| `FEATURE_EMPLOYER_ACCOUNTABILITY` | `false` | Enable Employer Accountability Layer — Week 6 |
| `FEATURE_COLLECTIVE_INTELLIGENCE` | `false` | Enable Collective Intelligence Layer — Week 3 |
| `FEATURE_MICRO_CREDENTIALS` | `false` | Enable Micro-Credential System — Week 3 |
| `FEATURE_CAPTCHA_SOLVER` | `false` | Enable CAPTCHA solving — Week 4 |

---

## External Services (Phase 2)

| Variable | Required | Description |
|---|---|---|
| `PAYFAST_MERCHANT_ID` | Month 2 | PayFast payment gateway |
| `PAYFAST_MERCHANT_KEY` | Month 2 | PayFast merchant key |
| `PAYFAST_PASSPHRASE` | Month 2 | PayFast security passphrase |
| `SENTRY_DSN` | Phase 2 | Error tracking |
| `MYMZANSI_API_URL` | Phase 2 | MyMzansi credential API |
| `MYMZANSI_CLIENT_ID` | Phase 2 | MyMzansi OAuth client ID |
| `MYMZANSI_CLIENT_SECRET` | Phase 2 | MyMzansi OAuth client secret |

### Skills Profile Agent

| Variable | Required | Description |
|---|---|---|
| `DOCUMENT_AI_PROCESSOR_ID` | Week 3 | Document AI processor ID |
| `DOCUMENT_AI_LOCATION` | Week 3 | `us` or `eu` |
| `CLOUD_STORAGE_CERTIFICATES_BUCKET` | Week 3 | GCS bucket for certificate PDFs |

### Application Agent (Gmail / SMTP)

| Variable | Required | Description |
|---|---|---|
| `GMAIL_CLIENT_ID` | Week 5 | Gmail OAuth client ID |
| `GMAIL_CLIENT_SECRET` | Week 5 | Gmail OAuth client secret |
| `GMAIL_REFRESH_TOKEN` | Week 5 | Gmail refresh token |
| `APPLICATION_EMAIL_ADDRESS` | Week 5 | `applications@skilved.com` |
| `SMTP_HOST` | Week 5 | SMTP fallback host |
| `SMTP_PORT` | Week 5 | SMTP fallback port |
| `SMTP_USER` | Week 5 | SMTP credentials |
| `SMTP_PASS` | Week 5 | SMTP password |

### Growth Agent (Social APIs)

| Variable | Required | Description |
|---|---|---|
| `META_PAGE_ACCESS_TOKEN` | Week 9 | Facebook/Instagram Graph API |
| `META_PAGE_ID` | Week 9 | Skilved Facebook Page ID |
| `META_INSTAGRAM_ACCOUNT_ID` | Week 9 | Skilved Instagram Business Account ID |
| `LINKEDIN_ACCESS_TOKEN` | Week 9 | LinkedIn API access token |
| `LINKEDIN_ORGANIZATION_ID` | Week 9 | Skilved LinkedIn Company Page ID |
| `GOOGLE_SEARCH_CONSOLE_PROPERTY` | Week 9 | Search Console property URL |
| `GOOGLE_SEARCH_CONSOLE_KEY_FILE` | Week 9 | Service account JSON for Search Console |

---

## GCP Secret Manager Setup

```bash
# Create all secrets
gcloud secrets create FIREBASE_PRIVATE_KEY --replication-policy="automatic"
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
gcloud secrets create WHATSAPP_ACCESS_TOKEN --replication-policy="automatic"
gcloud secrets create NEXTAUTH_SECRET --replication-policy="automatic"

# NEW v2.0 — ATS + Intelligence Layer secrets
gcloud secrets create CAPTCHA_SOLVER_API_KEY --replication-policy="automatic"
gcloud secrets create CAPSOLVER_API_KEY --replication-policy="automatic"
gcloud secrets create ATS_SERVICE_ACCOUNT_SF_PASSWORD --replication-policy="automatic"
gcloud secrets create ATS_SERVICE_ACCOUNT_TALEO_PASSWORD --replication-policy="automatic"
gcloud secrets create ATS_SERVICE_ACCOUNT_PAGEUP_PASSWORD --replication-policy="automatic"
gcloud secrets create ATS_SERVICE_ACCOUNT_MERSETA_PASSWORD --replication-policy="automatic"
gcloud secrets create ATS_SERVICE_ACCOUNT_EWSETA_PASSWORD --replication-policy="automatic"
gcloud secrets create SKILLS_PULSE_REVALIDATION_TOKEN --replication-policy="automatic"

# Grant access to Cloud Run service account
gcloud secrets add-iam-policy-binding CAPTCHA_SOLVER_API_KEY \
  --member="serviceAccount:skilved-agents@skilved-prod.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Per-Environment Config

### Development (local)
```bash
# apps/web/.env.local (gitignored)
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
FIREBASE_PROJECT_ID=skilved-dev
BIGQUERY_DATASET=skilved_dev
FIRESTORE_EMULATOR_HOST=localhost:8080

# NEW v2.0
CAPTCHA_SOLVER_API_KEY=your_dev_key
CAPTCHA_SOLVER_PROVIDER=2captcha
FEATURE_SKILLS_PULSE_DASHBOARD=true
FEATURE_COLLECTIVE_INTELLIGENCE=false
FEATURE_CAREER_SIMULATION=false
```

### Staging
```bash
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.skilved.com
GCP_PROJECT_ID=skilved-staging
BIGQUERY_DATASET=skilved_staging
FEATURE_SKILLS_PULSE_DASHBOARD=true
FEATURE_CAPTCHA_SOLVER=true
```

### Production
```bash
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://skilved.com
GCP_PROJECT_ID=skilved-prod
BIGQUERY_DATASET=skilved_prod
GCP_REGION=africa-south1
FEATURE_SKILLS_PULSE_DASHBOARD=true
```

---

## Vercel Environment Variable Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Set production secrets (core + new)
vercel env add NEXTAUTH_SECRET production
vercel env add FIREBASE_PRIVATE_KEY production
vercel env add GEMINI_API_KEY production
vercel env add SKILLS_PULSE_REVALIDATION_TOKEN production

# Pull to local
vercel env pull .env.local
```

---

## Change Log

### v2.0 — June 2026
- Added ATS Adapter Configuration section (12 new variables for CAPTCHA solver, service accounts, adapter enables)
- Added Intelligence Layer Configuration section (Skills Pulse, Career Simulation, Employer Accountability, Collective Intelligence, Micro-Credentials — 28 new variables)
- Updated Feature Flags (12 new flags for all new capabilities)
- Added new Secret Manager setup commands for ATS and intelligence secrets
- Added new dev/staging environment variables for new features
- Added table of contents

*Document version 2.0 — June 2026*
*Owner: Engineering*
*Never commit secrets to git — use Secret Manager in production*
