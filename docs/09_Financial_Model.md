# Skilved — Financial Model
### Seed Stage | Version 1.0 | June 2026

---

## Financial Philosophy

Skilved's financial model has two defining characteristics:

1. **Zero marginal cost scaling on the worker side.** Adding the 10,000th worker costs the same as adding the 10th — the agents do the work. This means gross margin improves with scale, not the reverse.

2. **Revenue compounds with graph quality.** As the outcome graph grows, match quality improves. As match quality improves, employer willingness to pay increases. As employers pay more, more workers join. The financial model is the flywheel.

---

## Revenue Streams

### Stream 1: Employer Referral Fees (Primary — MVP)
Workers are matched and referred to employers. Employer pays per qualified candidate.

| Tier | Price | Qualification |
|---|---|---|
| Standard referral | R500 | Trade + Province match, self-reported qualifications |
| Verified referral | R1,500 | Trade + Province + qualification level verified |
| MyMzansi verified (Phase 2) | R3,000–R5,000 | Government-grade credential verification |

**MVP assumption:** R800 average referral fee

### Stream 2: Employer Dashboard SaaS (Phase 2)
Recurring monthly subscription for employer self-serve platform.

| Plan | Price/month | Target |
|---|---|---|
| Starter | R2,000 | 1–10 hires/year |
| Growth | R5,000 | 10–50 hires/year |
| Scale | R12,000 | 50–200 hires/year |
| Enterprise | R30,000–R50,000 | 200+ hires/year, ATS integration |

### Stream 3: SETA Institutional Contracts
Annual contracts with SETAs for candidate pipeline and placement management.

| Contract type | Price/year |
|---|---|
| Basic listing partnership | Free (drives candidate volume) |
| Candidate pipeline access | R10,000–R30,000 |
| Managed placement service | R50,000–R200,000 |
| Full SETA OS (portal + analytics) | R100,000–R500,000 |

### Stream 4: Skills Graph API (Phase 3)
Data licensing for the SA Skills Graph.

| License | Price/year |
|---|---|
| Corporate (workforce planning) | R50,000–R200,000 |
| Government (policy intelligence) | R200,000–R1,000,000 |
| Research institution | R20,000–R50,000 |

### Stream 5: Verification API (Phase 2)
B2B credential verification for third-party platforms.

| Volume | Price/verification |
|---|---|
| 1–1,000/month | R20 |
| 1,000–10,000/month | R10 |
| 10,000+/month | R5 |

---

## 90-Day Revenue Model (XPRIZE Period)

### Assumptions
- Week 2: First 2 paying employers (R500 introductory)
- Month 1: 5 paying employers, avg 3 referrals each
- Month 2: 15 employers, avg 4 referrals, price increases to R800
- Month 3: 30 employers, avg 5 referrals at R1,000; first SETA contract signed

### Month-by-Month

| Month | Employers | Referrals/employer | Price | Referral Rev | SETA | Total |
|---|---|---|---|---|---|---|
| 1 | 5 | 3 | R500 | R7,500 | R0 | R7,500 |
| 2 | 15 | 4 | R800 | R48,000 | R0 | R48,000 |
| 3 | 30 | 5 | R1,000 | R150,000 | R20,000 | R170,000 |
| **Total** | | | | **R205,500** | **R20,000** | **R225,500** |

**Conservative 90-day total: R225,500 (~$12,500 USD)**  
**Optimistic 90-day total: R400,000 (~$22,000 USD)**

---

## 12-Month Financial Projection

### Revenue

| Month | Employer SaaS | Referrals | SETAs | Other | Total MRR |
|---|---|---|---|---|---|
| 1 | R0 | R7,500 | R0 | R0 | R7,500 |
| 2 | R0 | R48,000 | R0 | R0 | R48,000 |
| 3 | R0 | R150,000 | R20,000 | R0 | R170,000 |
| 4 | R20,000 | R200,000 | R30,000 | R0 | R250,000 |
| 5 | R60,000 | R280,000 | R60,000 | R0 | R400,000 |
| 6 | R120,000 | R350,000 | R80,000 | R10,000 | R560,000 |
| 7 | R200,000 | R420,000 | R100,000 | R20,000 | R740,000 |
| 8 | R280,000 | R500,000 | R120,000 | R30,000 | R930,000 |
| 9 | R380,000 | R600,000 | R150,000 | R50,000 | R1,180,000 |
| 10 | R480,000 | R700,000 | R180,000 | R70,000 | R1,430,000 |
| 11 | R600,000 | R800,000 | R200,000 | R100,000 | R1,700,000 |
| 12 | R750,000 | R1,000,000 | R250,000 | R120,000 | R2,120,000 |

**Year 1 Total Revenue: ~R9,500,000 (~$530,000 USD)**  
**Month 12 ARR Run Rate: ~R25,000,000 (~$1.4M USD)**

---

## Cost Structure

### Fixed Costs (Monthly)

| Cost | Month 1–3 | Month 4–6 | Month 7–12 |
|---|---|---|---|
| Salaries (team) | R80,000 | R200,000 | R450,000 |
| GCP infrastructure | R15,000 | R35,000 | R80,000 |
| WhatsApp Business API | R5,000 | R15,000 | R40,000 |
| Legal / compliance | R10,000 | R15,000 | R20,000 |
| Tools / SaaS | R5,000 | R10,000 | R15,000 |
| Office / co-working | R5,000 | R8,000 | R15,000 |
| **Total Fixed** | **R120,000** | **R283,000** | **R620,000** |

### Variable Costs

| Cost | Rate |
|---|---|
| Employer referral commission (if using reseller) | 10–15% of referral fee |
| Worker acquisition (performance marketing) | R20–R50 per registered user |
| SETA partnership management | R5,000/month per SETA |

### GCP Cost Breakdown (Month 3 estimate)

| Service | Est. Monthly Cost |
|---|---|
| Vertex AI Search (indexing + queries) | R8,000 |
| Gemini API calls (quality + matching + notifications) | R12,000 |
| Cloud Run (agent execution) | R5,000 |
| BigQuery (storage + queries) | R4,000 |
| Firestore (reads + writes) | R2,000 |
| Cloud Storage | R500 |
| Other (Monitoring, Scheduler, Pub/Sub) | R1,500 |
| **Total GCP** | **~R33,000/month** |

*GCP costs scale with usage but gross margin improves as revenue scales faster.*

---

## Unit Economics

### Per Employer (Growth Dashboard, Month 6)

| Metric | Value |
|---|---|
| Monthly subscription | R5,000 |
| Average referrals/month | 8 |
| Average referral fee | R1,000 |
| Total monthly revenue per employer | R13,000 |
| Cost to serve (GCP + account management) | R2,000 |
| **Gross profit per employer/month** | **R11,000** |
| **Gross margin** | **85%** |

### Per SETA Contract (Annual)

| Metric | Value |
|---|---|
| Annual contract value | R80,000 |
| Cost to serve (portal + account management) | R15,000 |
| **Gross profit per SETA** | **R65,000** |
| **Gross margin** | **81%** |

### CAC & LTV

| Segment | CAC | LTV (3 year) | LTV:CAC |
|---|---|---|---|
| Mid-size employer | R5,000 | R468,000 | 93:1 |
| SETA | R15,000 | R240,000 | 16:1 |
| Enterprise employer | R50,000 | R1,800,000 | 36:1 |

---

## Burn Rate & Runway

### Pre-Seed Scenario (XPRIZE prize + R1M angel)

| Item | Amount |
|---|---|
| Starting capital | R3,400,000 (R2.4M XPRIZE + R1M angel) |
| Monthly burn (Month 1–3) | R120,000 |
| Revenue offset (Month 1–3) | R150,000 |
| Net burn Month 1–3 | R30,000 net positive |

*If XPRIZE is won, the MVP is essentially self-funding from Month 3.*

### Seed Round Scenario (R10M raised, Month 4)

| Month | Revenue | Burn | Net |
|---|---|---|---|
| 4 | R250,000 | R350,000 | -R100,000 |
| 6 | R560,000 | R450,000 | +R110,000 |
| 9 | R1,180,000 | R600,000 | +R580,000 |
| 12 | R2,120,000 | R700,000 | +R1,420,000 |

**Break-even: Month 5–6**  
**Runway from R10M seed: 24+ months (business becomes profitable at Month 6)**

---

## Key Financial Assumptions

| Assumption | Value | Sensitivity |
|---|---|---|
| Employer churn rate | 5%/month | High impact — model breaks at 15%+ |
| Average referrals per employer/month | 5 | Moderate — quality of match drives this |
| Referral fee growth rate | 20%/year | Driven by MyMzansi verification premium |
| SETA contract win rate | 30% of approached | Driven by government relationship quality |
| Worker acquisition cost | R30/user | Primarily organic + WhatsApp (low) |
| GCP cost as % of revenue | 15% at scale | Improves as revenue scales |

---

## 5-Year Revenue Forecast

| Year | Revenue | ARR | Team Size | Key Milestone |
|---|---|---|---|---|
| 1 | R9.5M | R25M | 8 | XPRIZE + MVP + Phase 2 beginning |
| 2 | R60M | R80M | 25 | MyMzansi integrated, white-collar begins |
| 3 | R200M | R280M | 60 | Skills Graph API, government contracts |
| 4 | R500M | R700M | 120 | Kenya launch, pan-African begins |
| 5 | R1.2B | R1.7B | 250 | Pan-African infrastructure play |

---

*Document version 1.0 — June 2026*  
*Owner: Finance / Founder*  
*All figures in ZAR unless stated*  
*Model assumptions should be reviewed monthly against actuals*
