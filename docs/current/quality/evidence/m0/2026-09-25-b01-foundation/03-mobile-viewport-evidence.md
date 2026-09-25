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
- **Route**: `http://127.0.0.1:3001/` (Bound explicitly to loopback via native `serve.mjs` outside Next.js)
- **Observed Behavior**: Prominently renders the sticky top warning banner: `[LABELED TASK PROTOTYPE — FOR USABILITY OBSERVATION ONLY — NOT CONNECTED TO PRODUCTION CATALOGUE]`. Renders persistent fixture badge `[SIMULATED TEST FIXTURE — NOT A LIVE OPPORTUNITY]` in modal headers. Demonstrates 5 fictional test fixtures (including Vukani Community Trust uncertainty fixture), interactive category filtering, 7-question detail modal, checklist with Grade 12 OR N2 alternative, and simulated external handoff advisory modal with softened fee disclaimer.
- **Screenshot Artifact**: `mobile_prototype.png`

---

## 2. Telemetry & Budget Performance Measurements

### A. Measured Local Loopback & Build Payload

| Metric | Budget Target | Measured Observed Value | Status |
|---|---|---|:---:|
| **First Load JS (Home)** | < 120 kB | 114 kB | **PASS** |
| **First Load JS (About)** | < 120 kB | 114 kB | **PASS** |
| **First Load JS (Opportunity)** | < 120 kB | 115 kB | **PASS** |
| **Shared JS Chunks** | < 110 kB | 102 kB | **PASS** |
| **Prototype Static Payload** | < 250 kB | 16.8 kB uncompressed (~4.8 kB gzip) | **PASS** |
| **Time to First Byte (Local Loopback)** | < 300 ms | ~12 ms (Node http loopback) | **PASS** |

### B. Deployed Mobile Performance Budgets (Throttled Profile)

| Metric | Budget Limit | Measured Observed Value | Status |
|---|---|---|:---:|
| **Largest Contentful Paint (LCP)** | < 2.5 s | Pending staging environment deployment | **UNMEASURED PROVISIONAL BUDGET (Target for Staging B09 qualification)** |
| **Interaction to Next Paint (INP)** | < 100 ms | Pending 4x CPU throttle trace on device | **UNMEASURED PROVISIONAL BUDGET (Target for Staging B09 qualification)** |
| **Cumulative Layout Shift (CLS)** | 0.00 | Visual zero shift observed; lab trace pending | **UNMEASURED PROVISIONAL BUDGET (Target for Staging B09 qualification)** |
| **Time to First Byte (Johannesburg)** | < 300 ms | Pending `africa-south1` deployment | **UNMEASURED PROVISIONAL BUDGET (Target for Staging B09 qualification)** |

---

## 3. Touch Target Sizing & Modal Keyboard Accessibility

### A. Touch Target Verification (WCAG 2.5.5 / 2.5.8)
All interactive controls in the mobile task prototype are sized to at least 44 × 44 px:
- **Filter Dropdowns (`#catFilter`, `#provFilter`)**: Measured rendered box `160 × 44 px` (`min-height: 44px; min-width: 44px;`) — **PASS**.
- **Card Detail Action Buttons (`.btn-detail`)**: Measured rendered box `298 × 44 px` (`min-height: 44px;`) — **PASS**.
- **Modal Close Button (`.btn-close`)**: Explicitly styled `44 × 44 px` (`min-width: 44px; min-height: 44px; width: 44px; height: 44px;`) — **PASS**.
- **Handoff & Advisory Buttons (`.btn-handoff`, `.btn-adv-ok`, `.btn-adv-cancel`)**: Min-height 44px and min-width 44px — **PASS**.
- **Checklist Checkboxes (`input[type="checkbox"]`)**: Explicitly sized `44 × 44 px` with `min-width: 44px; min-height: 44px;` embedded in `44px` minimum height row labels — **PASS**.
- **Viewport Zoom Capability**: Configured as `<meta name="viewport" content="width=device-width, initial-scale=1.0">` with `maximum-scale` removed, enabling pinch-to-zoom — **PASS**.

### B. Modal Keyboard Accessibility & Dialog Semantics
- **Semantic Dialog Attributes**: Modal containers specify `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` referencing the respective modal title.
- **Initial Focus Entry**: When `openModal()` is triggered, focus immediately moves to `#btnModalClose`. When `triggerHandoff()` opens the advisory modal, focus immediately moves to `#btnAdvOk`.
- **Focus Containment (Trap)**: A `Tab` / `Shift+Tab` key listener restricts focus cycling strictly to interactive controls inside the active modal (`close`, checkboxes, `handoff`, or advisory buttons), preventing focus leaks to the background feed.
- **Focus Restoration**: Upon calling `closeModal()`, focus restores to the card button that initiated the dialog. Closing the advisory modal restores focus to `#btnHandoff`.
- **Keyboard Dismissal**: An `Escape` key listener closes the active modal dialog and restores focus accordingly.

---

## 4. Boundary & Fictional Fixture Verification
- **Fictional Test Entities**: Replaced real entity names with clearly labelled fixtures (`[Test Fixture] Apex Engineering Academy`, `[Test Fixture] Khanyisa Skills Institute`, `[Test Fixture] Southern Star STEM Foundation`, `[Test Fixture] Metro Digital Innovations`).
- **Uncertainty Fixture**: Added 5th fixture `[Test Fixture] Vukani Community Trust` with unstated deadline ("Rolling intake / Not stated") and unstated stipend ("Not specified in source announcement").
- **Checklist Logic**: Fixed alternative qualification logic to "Certified Matric results OR N2 Certificate".
- **Boundary Safeguards**: Sticky banner (`position: fixed; top: 0; left: 0; right: 0; z-index: 100`) and persistent modal badge `[SIMULATED TEST FIXTURE — NOT A LIVE OPPORTUNITY]`.
- **Public Surface Isolation**: Checked public assets for sample opportunity strings: **None found**. Public pages for prototype imports: **None found**. `/api/opportunities/[id]`: **404 confirmed**.
