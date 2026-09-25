# Performance Envelopes, Numeric Budgets, and M0 Delivery Reforecast

Date: 2026-09-25. Status: PROVISIONAL PLANNING SCENARIO (Subject to formal Founder availability & start date confirmation).
Authority: Task B01d, M0 Chronological Build Runbook. Resolves DEP-01, DEP-04, and DEP-09.

## 1. Context and Target Environment

Skilved's primary demographic is young South Africans accessing public work and study discovery on entry-level mobile devices over metered, prepaid cellular data connections. High data transfer, JavaScript execution bloat, and sluggish UI interactions lead directly to candidate abandonment and failed discovery.

Performance envelopes and operational budgets are hard engineering constraints enforced across all M0 development slices, not post-launch optimisations.

## 2. Reference Mobile Hardware Specification (DEP-04)

All client-side performance measurements, bundle constraints, and usability observations are benchmarked against an entry-level South African market reference device:

| Hardware Dimension | Specification | Emulation / Testing Baseline |
|---|---|---|
| **Device Class** | Budget Android (Samsung Galaxy A03 / Moto G Play tier) | Low-tier Android reference device |
| **SoC / Processor** | Octa/Quad-core ARM Cortex-A53 @ 1.6 GHz | 4x to 6x CPU slowdown in Chrome DevTools |
| **System Memory** | 3 GB LPDDR4x RAM | Available JS heap ceiling: 300 MB |
| **Display / Viewport** | 720 x 1600 px (HD+), 20:9 ratio, ~270 ppi, 60 Hz | 375 x 667 px to 375 x 812 px mobile viewport |
| **Operating System** | Android 11 / 12 (Go Edition or standard) | Chrome Mobile (Blink engine) latest stable |

## 3. Throttled Network Profile (DEP-04)

Network testing simulates domestic South African cellular conditions (prepaid 3G / congested 4G peak cell tower transit):

| Network Parameter | Value | Rationale |
|---|---|---|
| **Downlink Bandwidth** | 1.5 Mbps (187.5 kB/s) | Median South African 3G / congested prepaid LTE throughput |
| **Uplink Bandwidth** | 750 kbps (93.75 kB/s) | Upstream link for search query and receipt lookups |
| **Round-Trip Time (RTT)** | 150 ms | Mobile radio network latency to `africa-south1` (Johannesburg) |
| **Packet Loss & Jitter** | 1–2% sporadic loss | Edge cellular tower congestion during commute hours |

## 4. Hard Numeric Performance Budgets

Every public web route and worker service must adhere to the following hard limits:

| Metric | Hard Limit | Target | Scope / Condition |
|---|---|---|---|
| **First Load JS** | < 120 kB | < 90 kB | Compressed (Gzip/Brotli) transferred to client on initial load |
| **Largest Contentful Paint (LCP)** | < 2.5 s | < 1.8 s | Cold visit on throttled 3G profile (1.5 Mbps, 150ms RTT) |
| **Interaction to Next Paint (INP)** | < 100 ms | < 50 ms | Filter toggle, modal open, checklist toggle under 4x CPU throttle |
| **Cumulative Layout Shift (CLS)** | 0.00 | 0.00 | Strict zero shift; all containers/banners reserve exact dimensions |
| **Total Page Transfer** | < 250 kB | < 180 kB | HTML + CSS + JS + fonts/icons for initial discovery view |
| **Time to First Byte (TTFB)** | < 300 ms | < 150 ms | Server response time served from `africa-south1` |
| **Cloud Run Cold Start** | < 1.2 s | < 800 ms | Container start to response write on scale-from-zero |
| **Queue Retries** | Max 3 | 2 | Exponential backoff before dispatch to Dead-Letter Queue (DLQ) |
| **Monthly Cloud Budget** | $25.00 USD | < $15.00 USD | Total GCP/Firebase monthly spend ceiling (ADR DEP-02) |

## 5. Usability Prototype Observation (Task B01d)

Usability observation is conducted using the dedicated, self-contained task harness:
- **Location:** `apps/web/prototype/task-prototype/index.html` (served via `node:http` on port 3001).
- **Isolation:** Completely separated from Next.js routing and production build boundaries.
- **Visual Safeguard:** Labelled banner `[LABELED TASK PROTOTYPE — FOR USABILITY OBSERVATION ONLY — NOT CONNECTED TO PRODUCTION CATALOGUE]`.
- **Observed Flow:** Discovery feed scan -> Category & province filtering -> Detail modal inspection (7 questions & preparation checklist) -> Simulated external application handoff with scam-advisory warning.

## 6. Revised M0 Remaining-Effort Capacity Reforecast (DEP-09) — Provisional Planning Scenario

> [!NOTE]
> **Planning Basis:** Provisional Planning Scenario (Subject to formal Founder availability & start date confirmation).

The historical pre-refinement estimate (160–288h) is reconciled into an evidenced task-level reforecast:
- **Available Working Capacity:** 20 gross hours/week.
- **Contingency / Interruption Reserve:** 25% (5 hours/week reserved for uncertainty and external waits).
- **Net Productive Velocity:** 15 net task hours/week (30 net task hours per 2-week sprint).
- **Total M0 Remaining Effort:** 196 net task hours across 7 two-week sprints (14 calendar weeks = 210 h net capacity; each sprint <= 30 h).
- **Unallocated Operational Buffer:** 14 net hours reserved across the 14-week delivery window (210h capacity - 196h task effort), accommodating review waits and operational stabilization.

### Remaining Sprint Allocation Breakdown (Sprints 2 to 8 — Provisional Planning Scenario)

| Sprint | Slice(s) | Calendar Dates | Net Hours | Scope Focus & Deliverables |
|---|---|---|---|---|
| **Sprint 2** | B02a–B02d | Oct 09 – Oct 23, 2026 | 24 h | Canonical 6-category schema, requirement logic, whitelist projection, test fixtures |
| **Sprint 3** | B03a–B03d | Oct 23 – Nov 06, 2026 | 30 h | Source register, bounded crawler adapter, operator review/publish, public read API |
| **Sprint 4** | B04a–B04d | Nov 06 – Nov 20, 2026 | 28 h | Usable discovery feed, 7-question detail, checklist, handoff, operator report route |
| **Sprint 5** | B05 & B06 (Part 1) | Nov 20 – Dec 04, 2026 | 30 h | Browser-local shortlist continuity (16h) + Public-link suggestions intake & validation (14h) |
| **Sprint 6** | B06 (Part 2), B07 & B08 (Part 1) | Dec 04 – Dec 18, 2026 | 30 h | Public-link receipts & review status (4h) + Public checklist export & sharing (16h) + Issuer directory & pages (10h) |
| **Sprint 7** | B08 (Part 2) & B09 | Dec 18 – Jan 01, 2027 | 30 h | Editorial shelves & task coverage (6h) + Candidate qualification, performance budgets & accessibility observation (24h) |
| **Sprint 8** | B10a–B10d | Jan 01 – Jan 15, 2027 | 24 h | Production promotion, smoke verification, rollback readiness & 7-day operating observation window (24h task effort + 6h sprint reserve) |
| **Total** | **B02–B10** | **Oct 09 – Jan 15, 2027** | **196 h** | **Complete M0 MVP Release (Gate G4 & REL-M0) across 14 calendar weeks (210 h net capacity)** |

## 7. Dated Plan for Sprint 2 B02 (DEP-01) — Provisional Planning Scenario

> [!NOTE]
> **Planning Basis:** Provisional Planning Scenario (Subject to formal Founder availability & start date confirmation).

Sprint 2 establishes the canonical domain schemas and persistence projections:
- **Timebox:** 9 October 2026 – 23 October 2026 (2 weeks).
- **Committed Net Hours:** 24 task hours (leaving 6h contingency within 30h net capacity).
- **Entry Gate:** Gate G0 confirmed (B01 checks reproducible, prototype observed, budgets established).

| Task ID | Net Hours | Concrete Task Deliverable |
|---|---|---|
| **B02a** | 6 h | Consolidate canonical category enum (`bursary`, `learnership`, `apprenticeship`, `internship`, `graduate_programme`, `job`) and runtime schema validation across web, worker, and store. Add internship subtypes (student/WIL vs graduate). |
| **B02b** | 8 h | Implement source-linked facts, requirements with AND/OR/conditional logic, deadline uncertainty, compensation components, and strict whitelist public projection. |
| **B02c** | 6 h | Specify versioned public read contracts (`/api/v1`), pagination/filter semantics, Firestore document schema, indexes, and upgrade/rollback compatibility. |
| **B02d** | 4 h | Implement labelled 6-category test fixtures, unknown/conflicting edge cases, validation rejection tests, and projection privacy assertions. |

- **Exit Gate (G1 Prerequisite):** Six-category contract test suite passes; private administrative and draft fields are completely excluded from public read projections.

## 8. Governance and Review Cadence

- **Owner:** Performance QA Engineer / Implementer; confirmed by Founder.
- **Review Frequency:** Budget compliance is checked at every pull request and audited at sprint reviews.
- **Gate Enforcement:** Failure to meet numeric budgets (First Load JS >= 120 kB or LCP >= 2.5s on 3G) blocks PR merge and release qualification at Gate G4.
