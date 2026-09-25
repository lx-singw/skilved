# Gate G0 Evidence Bundle — 25 September 2026

- **Phase**: Phase P0 (Foundation)
- **Slice**: B01 (Finish the Build Foundation)
- **Status**: **OPEN (Engineering foundation evidenced; participant observation & founder confirmation pending)**
- **Execution Context**: WSL Ubuntu, Node v22.22.0, pnpm 9.0.0, Next.js 15.5.19

---

## 1. Evidence File Index

This directory contains the immutable, reproducible evidence logs and artifacts proving completion of Sprint 1 (B01) and satisfaction of Gate G0:

1. **[`01-baseline-reconciliation.txt`](01-baseline-reconciliation.txt)**:
   - Full terminal output and zero exit codes for `web:lint`, `web:typecheck`, `web:build`, and `web:test` (21/21 passing boundary assertions).
2. **[`02-clean-reproduction.txt`](02-clean-reproduction.txt)**:
   - Reproduction logs from an isolated clone in `/tmp/skilved-isolated` executing `pnpm install --frozen-lockfile` and all verification suites with zero production secrets.
3. **[`03-mobile-viewport-evidence.md`](03-mobile-viewport-evidence.md)**:
   - Technical analysis of mobile viewport rendering (375 × 667 px) and performance envelope measurements (JS payload, TTFB, layout stability).
4. **Visual Artifacts**:
   - `mobile_home.png`: Screenshot of production Home page (`/`) on mobile viewport.
   - `mobile_about.png`: Screenshot of production About page (`/about`) on mobile viewport.
   - `mobile_prototype.png`: Screenshot of isolated task prototype (`task-prototype/`) on mobile viewport.

---

## 2. Gate G0 Exit Disposition

| Gate Requirement | Evidence Location | Disposition |
|---|---|:---:|
| 1. Reproducible selected web checks | `01-baseline-reconciliation.txt` | **PASS (Exit 0)** |
| 2. Isolated prototype & clean routing | `apps/web/prototype/`, `01-baseline-reconciliation.txt` | **PASS (21/21)** |
| 3. Clean-room frozen lockfile repro | `02-clean-reproduction.txt` | **PASS (Exit 0)** |
| 4. Automated CI workflow | `.github/workflows/ci.yml` | **PASS (Validated)** |
| 5. Exhaustive environment schema | `docs/current/engineering/11_ENVIRONMENT_SCHEMA_AND_CONFIGURATION.md` | **PASS** |
| 6. Hosting ADR (DEP-02) | `docs/current/engineering/12_DEPLOYMENT_AND_RUNTIME_DECISION_RECORD.md` | **PASS** |
| 7. Mobile prototype & numeric budgets | `apps/web/prototype/task-prototype/`, `03-mobile-viewport-evidence.md` | **PASS** |
| 8. Remaining effort reforecast & Sprint 2 | `docs/current/engineering/13_PERFORMANCE_ENVELOPES_AND_BUDGETS.md` | **PASS (196h)** |
| 9. Participant observation (DCF-18) | Human observation session (DEP-07) | **PENDING (Founder/Product)** |
| 10. Founder capacity & budget confirmation | DEP-01, DEP-02, DEP-09 confirmation | **PENDING CONFIRMATION** |
