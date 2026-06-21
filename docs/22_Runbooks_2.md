# Skilved — Operations Runbooks
### Incident Response + Common Procedures | Version 4.0 | June 2026

---

## Table of Contents

- [Overview](#overview)
- [Runbook 1: Discovery Agent Failure](#runbook-1-discovery-agent-failure)
- [Runbook 2: Feed Performance Degradation](#runbook-2-feed-performance-degradation)
- [Runbook 3: Scam Opportunity Published](#runbook-3-scam-opportunity-published)
- [Runbook 4: WhatsApp API Issues](#runbook-4-whatsapp-api-issues)
- [Runbook 5: Data Breach Response](#runbook-5-data-breach-response)
- [Runbook 6: Employer Billing Issue](#runbook-6-employer-billing-issue)
- [Runbook 7: Deploying to Production](#runbook-7-deploying-to-production)
- [Runbook 8: Application Agent Failure](#runbook-8-application-agent-failure)
- [Runbook 9: Revenue Agent Sending Too Many Prompts](#runbook-9-revenue-agent-sending-too-many-prompts)
- [Runbook 10: Customer Success Agent Escalation Backlog](#runbook-10-customer-success-agent-escalation-backlog)
- [Runbook 11: Permission Level Consent Audit](#runbook-11-permission-level-consent-audit)
- [Runbook 12: Interview Coordination Agent Failure](#runbook-12-interview-coordination-agent-failure)
- [Runbook 13: Agent Context Staleness](#runbook-13-agent-context-staleness)
- [Runbook 14: ATS Adapter Failure](#runbook-14-ats-adapter-failure-new-v40)
- [Runbook 15: CAPTCHA Solver Failure](#runbook-15-captcha-solver-failure-new-v40)
- [Runbook 16: Skills Pulse Dashboard Failure](#runbook-16-skills-pulse-dashboard-failure-new-v40)
- [Runbook 17: Career Simulation Engine Failure](#runbook-17-career-simulation-engine-failure-new-v40)
- [Runbook 18: Employer Accountability Score Anomaly](#runbook-18-employer-accountability-score-anomaly-new-v40)
- [Runbook 19: Collective Intelligence Cohort Empty](#runbook-19-collective-intelligence-cohort-empty-new-v40)
- [Daily Health Check](#daily-health-check-5-minutes-every-morning)
- [Change Log](#change-log)

---

## Overview

Runbooks are step-by-step procedures for common operational scenarios. Every team member should be able to execute these without asking for help. Review and update after every incident.

---

## Runbook 1: Discovery Agent Failure

*(Unchanged from v3.0)*

### Symptoms
- Cloud Monitoring alert: "Discovery agent missed run"
- BigQuery `agent_runs` shows last run > 5 hours ago
- Feed freshness timestamps going stale

### Severity: High

### Steps

**Step 1: Diagnose**
```bash
bq query --use_legacy_sql=false '
SELECT run_id, started_at, status, error_messages
FROM skilved_prod.agent_runs
WHERE agent_name = "scout"
ORDER BY started_at DESC
LIMIT 5'

gcloud run services logs read scout-agent --region africa-south1 --limit 100
```

**Step 2: Manual trigger**
```bash
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  https://scout-agent-[hash]-af.a.run.app/run
```

**Step 3: Verify recovery**
- Wait for next scheduled run or manually trigger
- Verify `human_approvals_required: 0` in new run log

---

## Runbook 2: Feed Performance Degradation

*(Unchanged from v3.0)*

---

## Runbook 3: Scam Opportunity Published

*(Unchanged from v3.0)*

---

## Runbook 4: WhatsApp API Issues

*(Unchanged from v3.0)*

---

## Runbook 5: Data Breach Response

*(Unchanged from v3.0)*

---

## Runbook 6: Employer Billing Issue

*(Unchanged from v3.0)*

---

## Runbook 7: Deploying to Production

*(Unchanged from v3.0)*

---

## Runbook 8: Application Agent Failure

*(Unchanged from v3.0 base, enhanced for ATS adapters)*

### Symptoms
- User reports "I tapped Apply for me but nothing happened"
- BigQuery `ats_submission_failed` events appearing
- `application_agent` Cloud Run showing high error rate
- Specific ATS platform showing high failure rate in `ats_performance` view

### Severity: High

### Steps

**Step 1: Check failure type and platform**
```bash
# Check failures by ATS platform
bq query --use_legacy_sql=false '
SELECT ats_platform, failure_reason, COUNT(*) as count
FROM skilved_prod.application_submissions
WHERE submission_success = false
  AND DATE(submitted_at) = CURRENT_DATE()
GROUP BY ats_platform, failure_reason
ORDER BY count DESC'
```

**Step 2: Platform-specific diagnosis**

*SuccessFactors failures:*
```bash
# Check if SuccessFactors structure changed
gcloud run services logs read application-agent \
  --region africa-south1 \
  --filter "SuccessFactors" --limit 30
# Look for: selector not found, timeout, form structure errors
```

*Email failures:*
```bash
# Check Gmail API status
curl -H "Authorization: Bearer $(cat /tmp/gmail_token)" \
  "https://gmail.googleapis.com/gmail/v1/users/me/profile"
```

*CAPTCHA failures:*
```bash
# Check CAPTCHA solver balance
curl "https://2captcha.com/res.php?key=${CAPTCHA_SOLVER_API_KEY}&action=getbalance"
# If balance < $1: top up immediately
```

**Step 3: Check CAPTCHA solver**
```bash
bq query --use_legacy_sql=false '
SELECT captcha_solver_provider, COUNT(*) as attempts,
  COUNTIF(captcha_solved) as solved,
  AVG(captcha_solve_time_ms) as avg_ms
FROM skilved_prod.application_submissions
WHERE captcha_encountered = true
  AND DATE(submitted_at) = CURRENT_DATE()
GROUP BY captcha_solver_provider'
```

**Step 4: Notify affected users**
For each `ats_submission_failed` today, send WhatsApp:
> "I couldn't complete your application to [Org] automatically — [platform] changed something. Here's the direct link to apply manually: [URL]. Sorry for the inconvenience."

**Step 5: Add to manual fallback if structural change**
```bash
# Update PLAYWRIGHT_MANUAL_FALLBACK_LIST in Secret Manager
# Add the affected employer URL pattern
gcloud secrets versions add PLAYWRIGHT_MANUAL_FALLBACK_LIST \
  --data-file=updated-fallback-list.txt
```

**Step 6: Fix adapter if structure changed**
- Inspect failing form in browser
- Update selector patterns in relevant adapter class
- Deploy with standard CI/CD

---

## Runbook 9: Revenue Agent Sending Too Many Prompts

*(Unchanged from v3.0)*

---

## Runbook 10: Customer Success Agent Escalation Backlog

*(Unchanged from v3.0)*

---

## Runbook 11: Permission Level Consent Audit

*(Unchanged from v3.0)*

---

## Runbook 12: Interview Coordination Agent Failure

*(Unchanged from v3.0)*

---

## Runbook 13: Agent Context Staleness

*(Unchanged from v3.0)*

---

## Runbook 14: ATS Adapter Failure — NEW v4.0

### Symptoms
- Specific ATS platform showing success rate < 50% in `ats_performance` view
- Users receiving "application failed" WhatsApp messages at unusual frequency
- `form_structure_changed` failure reason appearing for multiple applications

### Severity: High (affects 20–25% of opportunities per platform)

### Steps

**Step 1: Identify affected platform**
```bash
bq query --use_legacy_sql=false '
SELECT
  ats_platform,
  COUNT(*) as total,
  COUNTIF(submission_success) as successes,
  SAFE_DIVIDE(COUNTIF(submission_success), COUNT(*)) as success_rate,
  ARRAY_AGG(DISTINCT failure_reason IGNORE NULLS) as reasons
FROM skilved_prod.application_submissions
WHERE DATE(submitted_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)
GROUP BY ats_platform
HAVING success_rate < 0.5
ORDER BY total DESC'
```

**Step 2: Take a screenshot of current form structure**
```bash
# Quick Playwright script to capture current state
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('[FAILING_URL]');
  await page.screenshot({ path: '/tmp/current_form.png', fullPage: true });
  await browser.close();
})();"
# Compare to expected selectors in adapter code
```

**Step 3: Immediate mitigation**
```bash
# Route affected platform to email fallback or manual queue
gcloud run services update application-agent \
  --update-env-vars ADAPTER_FALLBACK_SUCCESSFACTORS=email
# This sends email for all SuccessFactors opps where email is available
```

**Step 4: Fix the adapter**
```bash
# Update selector patterns in adapter file
# Test locally with fixture HTML
cd apps/agents/application
pnpm test -- --grep "SuccessFactors"
# Deploy via standard CI/CD
```

**Step 5: Verify fix**
```bash
# After deploy, check new success rate
bq query --use_legacy_sql=false '
SELECT COUNT(*) as total, COUNTIF(submission_success) as successes
FROM skilved_prod.application_submissions
WHERE ats_platform = "successfactors"
  AND submitted_at > CURRENT_TIMESTAMP() - INTERVAL 1 HOUR'
```

**Step 6: Post-mortem**
- Document: which selector changed, when, which employers affected
- Add HTML snapshot to test fixtures
- Add regression test for the specific change pattern
- Consider: weekly adapter health check job

---

## Runbook 15: CAPTCHA Solver Failure — NEW v4.0

### Symptoms
- `captcha_solved = false` rate > 10% in `application_submissions`
- Application Agent logs showing "CAPTCHA solving timed out"
- 2captcha/CapSolver API returning errors

### Severity: High (affects all ATS portals with CAPTCHA, ~45% of opportunities)

### Steps

**Step 1: Check solver status**
```bash
# Check 2captcha balance
curl "https://2captcha.com/res.php?key=${CAPTCHA_SOLVER_API_KEY}&action=getbalance"

# Check CapSolver (fallback)
curl -X POST "https://api.capsolver.com/getBalance" \
  -H "Content-Type: application/json" \
  -d '{"clientKey": "'${CAPSOLVER_API_KEY}'"}'
```

**Step 2: Check solve times**
```bash
bq query --use_legacy_sql=false '
SELECT
  captcha_solver_provider,
  AVG(captcha_solve_time_ms) as avg_ms,
  MAX(captcha_solve_time_ms) as max_ms,
  COUNTIF(captcha_solved) as solved,
  COUNT(*) as attempted
FROM skilved_prod.application_submissions
WHERE captcha_encountered = true
  AND DATE(submitted_at) = CURRENT_DATE()
GROUP BY captcha_solver_provider'
# If avg_ms > 60000 (60 seconds): solver is overloaded, switch to fallback
```

**Step 3: Switch provider if needed**
```bash
# Update environment variable to use fallback provider
gcloud run services update application-agent \
  --update-env-vars CAPTCHA_SOLVER_PROVIDER=capsolver
```

**Step 4: If both solvers failing**
- This is rare (major outage at both providers)
- Temporary mitigation: disable CAPTCHA-heavy platforms, use email-only
```bash
gcloud run services update application-agent \
  --update-env-vars SKIP_CAPTCHA_PLATFORMS=successfactors,oracle_taleo
```
- This reduces Application Agent coverage to ~40% but keeps it running
- Resolve within 4 hours maximum

**Step 5: Top up balance if depleted**
- 2captcha: topup at 2captcha.com (minimum $5 = ~R90)
- Set up auto-topup at threshold to prevent future outages

---

## Runbook 16: Skills Pulse Dashboard Failure — NEW v4.0

### Symptoms
- `skilved.com/skills-pulse` showing stale data (> 26 hours old)
- Skills Pulse Agent Cloud Run job failing
- BigQuery `skills_pulse_snapshots` table not updating
- Government PDF report not generating

### Severity: Medium (doesn't affect core product, but affects XPRIZE credibility)

### Steps

**Step 1: Check last successful run**
```bash
bq query --use_legacy_sql=false '
SELECT snapshot_date, generated_at, data_points_analysed, confidence_score,
  processing_time_seconds
FROM skilved_prod.skills_pulse_snapshots
ORDER BY snapshot_date DESC
LIMIT 5'
```

**Step 2: Check agent logs**
```bash
gcloud run services logs read skills-pulse-agent \
  --region africa-south1 --limit 50
# Common failures: BigQuery timeout (increase query timeout), Gemini API error, Firestore write failure
```

**Step 3: Manual trigger**
```bash
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  https://skills-pulse-agent-[hash]-af.a.run.app/run
```

**Step 4: BigQuery timeout mitigation**
If BigQuery queries are timing out (happens when data volume grows):
```bash
# Update query timeout setting
gcloud run services update skills-pulse-agent \
  --update-env-vars BIGQUERY_QUERY_TIMEOUT_MS=120000
```

**Step 5: Add stale data banner to dashboard**
If agent will be down > 4 hours, add banner to Skills Pulse page:
```typescript
// In skills-pulse page component, check snapshot age
const isStale = snapshotAge > 26 * 60 * 60 * 1000; // 26 hours
// Show: "This data is being refreshed. Last updated: [timestamp]"
```

**Post-mortem:** Skills Pulse failure is low severity for users but high visibility for government/XPRIZE. Resolve within 24 hours and document.

---

## Runbook 17: Career Simulation Engine Failure — NEW v4.0

### Symptoms
- Users receiving error when asking "what if I..." questions
- Career Simulation Agent Cloud Run returning 5xx errors
- BigQuery `career_simulations` table showing failed runs
- Career Agent weekly digest not including simulation insights

### Severity: Medium

### Steps

**Step 1: Check failure type**
```bash
bq query --use_legacy_sql=false '
SELECT query_type, COUNT(*) as attempts,
  COUNTIF(narrative_generated) as successes
FROM skilved_prod.career_simulations
WHERE DATE(simulated_at) = CURRENT_DATE()
GROUP BY query_type'

gcloud run services logs read career-simulation-agent \
  --region africa-south1 --limit 30
```

**Step 2: Common failures and fixes**

*BigQuery cohort query timeout:*
```bash
# Add LIMIT to cohort query, or increase timeout
gcloud run services update career-simulation-agent \
  --update-env-vars COHORT_QUERY_MAX_ROWS=200
```

*Gemini API failure:*
```bash
# Check Gemini API status at https://status.cloud.google.com
# Temporary: return simulation without narrative (data only)
gcloud run services update career-simulation-agent \
  --update-env-vars SKIP_NARRATIVE_ON_GEMINI_FAIL=true
```

*Insufficient cohort data (< 5 users):*
- This is expected behaviour, not a failure
- Agent should return opportunity-only simulation with appropriate label
- Check that this fallback is working correctly

**Step 3: Fallback behaviour**
When Career Simulation fails, Customer Success Agent should respond:
> "I can't run a full career simulation right now — try again in a few minutes. In the meantime, here's what I know about [qualification] opportunities in your area: [manual context]"

**Step 4: Cache check**
```bash
# Check Redis for stale simulation cache
redis-cli --url $REDIS_URL KEYS "simulation:*" | head -10
# If cached simulations are stale or returning errors, clear
redis-cli --url $REDIS_URL DEL "simulation:${USER_ID}:${QUERY_HASH}"
```

---

## Runbook 18: Employer Accountability Score Anomaly — NEW v4.0

### Symptoms
- Employer score jumps > 20 points in one week (anomaly detection alert)
- Score appears inconsistent with available outcome data
- Employer complaining their score is unfair
- Users reporting score doesn't match their experience

### Severity: Medium (trust-critical feature)

### Steps

**Step 1: Investigate the anomaly**
```bash
bq query --use_legacy_sql=false '
SELECT employer_id, employer_name, accountability_score, accountability_grade,
  sample_size, placement_rate, completion_rate, would_recommend_pct,
  calculated_at
FROM skilved_prod.employer_accountability_scores
WHERE employer_id = "[EMPLOYER_ID]"
ORDER BY calculated_at DESC
LIMIT 10'
# Look for: sudden sample size change, unusual metric values
```

**Step 2: Check underlying outcomes**
```bash
bq query --use_legacy_sql=false '
SELECT outcome_type, opp_salary, days_to_placement, reported_by, outcome_at
FROM skilved_prod.outcomes
WHERE opp_organisation = "[EMPLOYER_NAME]"
ORDER BY outcome_at DESC
LIMIT 20'
```

**Step 3: Manual score review**
If anomaly detected:
```bash
# Temporarily pause this employer's score display
gcloud firestore documents update employers/[EMPLOYER_ID] \
  --data='{"accountabilityScorePaused": true, "accountabilityPauseReason": "anomaly_review"}'
# Score shows as "Under Review" on cards, not suppressed entirely
```

**Step 4: Investigate for gaming attempt**
If score jumped upward suspiciously:
- Check if new outcome reports came from same phone number
- Check if outcome reports were submitted within 24 hours of each other
- Check if employer account was recently created

```bash
bq query --use_legacy_sql=false '
SELECT user_id, reported_by, outcome_type, outcome_at,
  -- Check for suspicious patterns
  COUNT(*) OVER (PARTITION BY DATE(outcome_at), opp_organisation) as same_day_count
FROM skilved_prod.outcomes
WHERE opp_organisation = "[EMPLOYER_NAME]"
  AND DATE(outcome_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
ORDER BY outcome_at DESC'
```

**Step 5: Resolution**
- Legitimate data: resume score display, document investigation
- Gaming attempt: mark outcomes as disputed, remove from score calculation, notify employer
- Technical error: fix calculation, recalculate, resume display

**Step 6: Employer communication if complaint**
> "We take our accountability scores seriously. Your current score is based on [N] verified candidate outcomes. If you believe this is inaccurate, you can respond to specific feedback via your employer dashboard. Scores reflect verified outcomes only and cannot be changed by request — but they improve naturally as more positive outcomes are verified."

---

## Runbook 19: Collective Intelligence Cohort Empty — NEW v4.0

### Symptoms
- Users not seeing cohort intelligence on feed (authenticated users)
- "cohort_intelligence_displayed" events missing from BigQuery
- Profile page cohort section showing nothing
- BigQuery `cohort_snapshots` table not populating for some cohort types

### Severity: Low (graceful degradation — feed still works, just without cohort data)

### Steps

**Step 1: Check cohort availability**
```bash
bq query --use_legacy_sql=false '
SELECT cohort_key, cohort_size, snapshot_date
FROM skilved_prod.cohort_snapshots
WHERE snapshot_date = CURRENT_DATE()
ORDER BY cohort_size DESC
LIMIT 20'
# Check: are any cohorts being generated? What sizes?
```

**Step 2: Check for minimum size threshold**
The most common cause: cohort < 5 users — suppressed by design.

```bash
# Check how many users exist per trade/province combination
bq query --use_legacy_sql=false '
SELECT primary_trade, province, COUNT(*) as user_count
FROM skilved_prod.users
WHERE last_active_at > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
GROUP BY primary_trade, province
HAVING user_count >= 5
ORDER BY user_count DESC
LIMIT 20'
# If most cohorts < 5: this is expected in early days — cohort intelligence grows with users
```

**Step 3: Expected behaviour in early MVP**
In Sprint 2–3, most cohorts will be < 5 users. This is correct — the system should gracefully not show cohort intelligence rather than show meaningless data.

The fix for this is user growth, not engineering. Once trade/province cohorts reach 10+ users (typically 500–1000 total users), cohort intelligence becomes consistently visible.

**Step 4: Fallback display**
If cohort consistently empty for a user, feed should show nothing (not an error). Verify:
```typescript
// In CohortIntelligenceBuilder
if (cohort.size < 5) return null; // Silent - no error, no display
```

**Step 5: Manual pre-computation trigger**
```bash
# Trigger collective intelligence batch job manually
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  https://collective-intelligence-agent-[hash]-af.a.run.app/precompute
```

**Post-mortem:** Cohort empty is almost always expected in early MVP. Document if it persists beyond 1,000 users.

---

## Daily Health Check (5 Minutes Every Morning)

```bash
#!/bin/bash
# scripts/daily-health-check.sh v4.0

echo "=== SKILVED DAILY HEALTH CHECK v4.0 ==="
echo "Date: $(date)"

echo "\n--- Core Agent Status ---"
bq query --use_legacy_sql=false \
  'SELECT agent_name, MAX(started_at) as last_run, status,
    SUM(human_approvals_required) as human_approvals
   FROM skilved_prod.agent_runs
   WHERE DATE(started_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
   GROUP BY agent_name, status
   ORDER BY agent_name'

echo "\n--- Intelligence Layer Health ---"
bq query --use_legacy_sql=false \
  'SELECT * FROM skilved_prod.intelligence_layer_health'

echo "\n--- ATS Adapter Performance ---"
bq query --use_legacy_sql=false \
  'SELECT ats_platform, COUNT(*) as apps, COUNTIF(submission_success) as ok,
    SAFE_DIVIDE(COUNTIF(submission_success), COUNT(*)) as rate,
    COUNTIF(captcha_solved) as captchas_solved
   FROM skilved_prod.application_submissions
   WHERE DATE(submitted_at) = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
   GROUP BY ats_platform'

echo "\n--- Skills Pulse Freshness ---"
bq query --use_legacy_sql=false \
  'SELECT snapshot_date, generated_at, data_points_analysed, confidence_score
   FROM skilved_prod.skills_pulse_snapshots
   ORDER BY snapshot_date DESC LIMIT 2'

echo "\n--- Employer Accountability Scores ---"
bq query --use_legacy_sql=false \
  'SELECT accountability_grade, COUNT(*) as employers
   FROM skilved_prod.employer_accountability_scores
   WHERE calculated_at > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
   GROUP BY accountability_grade ORDER BY accountability_grade'

echo "\n--- Yesterday Feed Metrics ---"
bq query --use_legacy_sql=false \
  'SELECT * FROM skilved_prod.daily_metrics
   WHERE date = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)'

echo "\n--- Revenue (this month) ---"
bq query --use_legacy_sql=false \
  'SELECT SUM(amount) as mrr
   FROM skilved_prod.revenue
   WHERE DATE_TRUNC(date, MONTH) = DATE_TRUNC(CURRENT_DATE(), MONTH)'

echo "\n--- CAPTCHA Solver Balance ---"
curl -s "https://2captcha.com/res.php?key=${CAPTCHA_SOLVER_API_KEY}&action=getbalance"
echo " (2captcha balance)"

echo "\n=== END HEALTH CHECK v4.0 ==="
```

---

## Change Log

### v4.0 — June 2026
- Added Runbook 14: ATS Adapter Failure
- Added Runbook 15: CAPTCHA Solver Failure
- Added Runbook 16: Skills Pulse Dashboard Failure
- Added Runbook 17: Career Simulation Engine Failure
- Added Runbook 18: Employer Accountability Score Anomaly
- Added Runbook 19: Collective Intelligence Cohort Empty
- Updated Runbook 8 (Application Agent Failure) with ATS platform-specific diagnosis
- Updated Daily Health Check with ATS performance, intelligence layer, CAPTCHA balance checks
- Added table of contents

### v3.0 — June 2026
- Added Runbooks 12 (Interview Coordination) and 13 (Agent Context Staleness)

*Document version 4.0 — June 2026*
*Owner: Engineering*
*Review after every incident. Update with learnings.*
