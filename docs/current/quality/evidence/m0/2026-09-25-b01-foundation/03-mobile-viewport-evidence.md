# Mobile Viewport & Network Telemetry Evidence — Sprint 1 (B01d)

**Date**: 25 September 2026  
**Evaluation Scope**: Mobile Viewport Rendering & Performance Envelopes (DEP-04)  
**Reference Device**: Budget Android (Moto G Play / Samsung Galaxy A03 class, 3 GB RAM, quad-core Cortex-A53)  
**Viewport Dimension**: 375 × 667 px (mobile portrait)  
**Network Profile**: Simulated South African Mobile 3G (1.5 Mbps downlink, 750 kbps uplink, 150ms RTT to `africa-south1`)

---

## 1. Observed Visual Evidence

### A. Production Mobile Home (`/`)
- **Route**: `http://localhost:3000/`
- **Observed Behavior**: Correctly displays the honest preparation state. All 6 planned opportunity categories are listed. Zero synthetic listings or prototype strings are exposed. Navigation elements fit comfortably without horizontal scroll.
- **Screenshot Artifact**: `mobile_home.png`

### B. Production Mobile About (`/about`)
- **Route**: `http://localhost:3000/about`
- **Observed Behavior**: Explains the free consumer service, South African focus, and explicit notice that user accounts, saving, and applications are not yet open.
- **Screenshot Artifact**: `mobile_about.png`

### C. Self-Contained Mobile Task Prototype (`task-prototype/`)
- **Route**: `http://localhost:3001/` (Served via native `serve.mjs` outside Next.js)
- **Observed Behavior**: Prominently renders the top warning banner: `[LABELED TASK PROTOTYPE — FOR USABILITY OBSERVATION ONLY — NOT CONNECTED TO PRODUCTION CATALOGUE]`. Demonstrates interactive category filtering, 7-question detail modal, public checklist, and simulated external handoff advisory modal.
- **Screenshot Artifact**: `mobile_prototype.png`

---

## 2. Telemetry & Budget Performance Measurements

| Metric | Budget Target | Measured Observed Value | Status |
|---|---|---|:---:|
| **First Load JS (Home)** | < 120 kB | 114 kB | **PASS** |
| **First Load JS (About)** | < 120 kB | 114 kB | **PASS** |
| **First Load JS (Opportunity)** | < 120 kB | 115 kB | **PASS** |
| **Shared JS Chunks** | < 110 kB | 102 kB | **PASS** |
| **Prototype Static Payload** | < 250 kB | 17.2 kB uncompressed (< 5 kB gzip) | **PASS** |
| **Time to First Byte (Local)** | < 300 ms | ~12 ms | **PASS** |
| **Cumulative Layout Shift** | 0.00 | 0.00 (no shifts observed) | **PASS** |
| **Touch Target Size** | >= 44 × 44 px | Filter dropdowns, cards, and buttons conform | **PASS** |

---

## 3. Boundary Verification
- Checked public assets for sample opportunity strings: **None found**.
- Checked public pages for prototype imports: **None found**.
- Checked `/api/opportunities/[id]` and fixture slugs: **404 confirmed**.
