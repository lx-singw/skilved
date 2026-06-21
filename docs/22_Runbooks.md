# Skilved — Operations Runbooks
### Incident Response + Common Procedures | Version 1.0 | June 2026

---

## Overview

Runbooks are step-by-step procedures for common operational scenarios. Every team member should be able to execute these without asking for help. Review and update after every incident.

---

## Runbook 1: Discovery Agent Failure

### Symptoms
- Cloud Monitoring alert: "Discovery agent missed run"
- BigQuery `agent_runs` shows last successful run > 5 hours ago
- Feed is not updating (freshness timestamps going stale)

### Severity: High (feed quality degrades hourly)

### Steps

**Step 1: Diagnose**
```bash
# Check last agent runs
bq query --use_legacy_sql=false '
SELECT run_id, started_at, status, error_messages
FROM skilved_prod.agent_runs
WHERE agent_name = "discovery"
ORDER BY started_at DESC
LIMIT 5'

# Check Cloud Run logs
gcloud run services logs read discovery-agent \
  --region africa-south1 \
  --limit 100

# Check if service is deployed
gcloud run services describe discovery-agent \
  --region africa-south1
```

**Step 2: Check Cloud Scheduler**
```bash
# Verify scheduler job exists and last run status
gcloud scheduler jobs describe discovery-agent-schedule \
  --location africa-south1

# Check scheduler logs
gcloud logging read "resource.type=cloud_scheduler_job" \
  --limit 20
```

**Step 3: Manual trigger (if service is up)**
```bash
# Trigger manually via HTTP
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  https://discovery-agent-[hash]-af.a.run.app/run
```

**Step 4: Check specific failure**

If Gemini API failure:
```bash
# Test Gemini API directly
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=$GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
```

If Firestore write failure:
```bash
# Check Firestore quota
gcloud firestore operations list
```

If source website blocking:
- Check which sources returned errors in agent logs
- Temporarily disable blocked sources in source registry
- Notify team to review robots.txt and terms

**Step 5: Deploy fix if needed**
```bash
# Redeploy agent (picks up latest image)
gcloud run deploy discovery-agent \
  --image gcr.io/skilved-prod/discovery-agent:latest \
  --region africa-south1
```

**Step 6: Verify recovery**
- Wait for next scheduled run (or manually trigger)
- Verify opportunities are being published to feed
- Check freshness timestamps are updating

**Step 7: Post-mortem**
- Document what failed, why, how long it was down
- Add monitoring rule if gap identified
- Update this runbook if steps were unclear

---

## Runbook 2: Feed Performance Degradation

### Symptoms
- Feed load time > 3 seconds (normally < 1.5s)
- Users reporting slow feed
- Cloud Monitoring: high latency alert

### Severity: High (core user experience)

### Steps

**Step 1: Diagnose latency source**
```bash
# Check Cloud Run matching agent latency
gcloud monitoring read \
  --filter='metric.type="run.googleapis.com/request_latencies"' \
  --interval='2024-01-01T00:00:00Z/2024-01-01T01:00:00Z'

# Check Redis cache hit rate
redis-cli --url $REDIS_URL info stats | grep keyspace_hits

# Check Firestore read latency
bq query --use_legacy_sql=false '
SELECT
  AVG(latency_ms) as avg_latency,
  APPROX_QUANTILES(latency_ms, 100)[OFFSET(95)] as p95_latency
FROM skilved_prod.events
WHERE event_type = "feed_view"
  AND DATE(event_at) = CURRENT_DATE()'
```

**Step 2: Check Redis**
```bash
# Test Redis connectivity and latency
redis-cli --url $REDIS_URL ping
redis-cli --url $REDIS_URL info memory

# If Redis is down, feed falls back to Firestore (slower but functional)
# Clear Redis cache if corrupted
redis-cli --url $REDIS_URL FLUSHDB
```

**Step 3: Check matching agent**
```bash
# Check matching agent health
curl https://matching-agent-[hash]-af.a.run.app/health

# Scale up instances if CPU-bound
gcloud run services update matching-agent \
  --min-instances 2 \
  --max-instances 20 \
  --region africa-south1
```

**Step 4: Check Firestore**
- Check Firestore console for quota warnings
- Check if missing composite index is causing collection scans
- Add missing indexes if identified

**Step 5: Temporary mitigations**
- Increase Redis TTL to 15 minutes (reduces DB load)
- Disable match explanations temporarily (saves Gemini API calls)
- Set feature flag `FEATURE_MATCHING_EXPLANATIONS=false`

---

## Runbook 3: Scam Opportunity Published

### Symptoms
- User reports scam listing via in-app report button
- Scam pattern not caught by quality agent
- Operator notices suspicious listing in admin dashboard

### Severity: Critical (trust damage)

### Steps

**Step 1: Remove immediately**
```bash
# In admin dashboard:
# Navigate to opportunity
# Click "Remove" with reason: "Scam - user reported"

# OR via BigQuery (for multiple):
bq query --use_legacy_sql=false '
UPDATE skilved_prod.opportunities
SET status = "removed", removed_reason = "scam_user_report"
WHERE id IN ("opp_id_1", "opp_id_2")'

# Then update Firestore:
# Firestore console → opportunities → find by ID → update status field
```

**Step 2: Respond to reporter**
If user reported via WhatsApp:
> "Thank you for reporting this. We've removed the listing immediately. We take fake and scam opportunities very seriously — your report helps protect the entire Skilved community."

**Step 3: Analyse how it passed quality agent**
```bash
# Get quality decision for this opportunity
bq query --use_legacy_sql=false '
SELECT *
FROM skilved_prod.quality_decisions
WHERE opportunity_id = "opp_id"'
```

- What score did it receive?
- Which rules did it pass?
- Why did Gemini not flag it?

**Step 4: Update quality agent**
- Add the scam pattern to `ScamDetector` rules
- If Gemini-based: add to classifier training examples
- Redeploy quality agent with fix
- Re-scan recent publications from same source

**Step 5: Audit same source**
```bash
# Find all opportunities from same source
bq query --use_legacy_sql=false '
SELECT id, title, quality_score, source_url
FROM skilved_prod.opportunities
WHERE sourceName = "[source_name]"
  AND status = "active"
ORDER BY discoveredAt DESC'
```
Review manually. Remove any suspicious ones.

**Step 6: Source credibility update**
- Lower credibility score for this source in `SourceCredibility.ts`
- If serial offender: add source to blocklist

---

## Runbook 4: WhatsApp API Issues

### Symptoms
- Digests not being sent
- OTPs not delivering
- Webhook handler not receiving messages

### Severity: High (WhatsApp is primary user channel)

### Steps

**Step 1: Check Meta Business Manager**
- Log into business.facebook.com
- Check WhatsApp Business Account status
- Look for policy violations or temporary restrictions

**Step 2: Check API status**
```bash
# Test WhatsApp API directly
curl -X GET \
  "https://graph.facebook.com/v18.0/$WHATSAPP_PHONE_NUMBER_ID" \
  -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN"

# Check message delivery status
curl -X GET \
  "https://graph.facebook.com/v18.0/$WHATSAPP_BUSINESS_ACCOUNT_ID/messages" \
  -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN"
```

**Step 3: Check webhook handler**
```bash
# Verify webhook handler is running
gcloud run services describe webhook-handler \
  --region africa-south1

# Check logs
gcloud run services logs read webhook-handler \
  --region africa-south1 \
  --limit 50
```

**Step 4: Test webhook endpoint**
```bash
# Meta provides a webhook test button in Developer Portal
# Also test manually:
curl -X POST https://skilved.com/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Step 5: Twilio fallback (if Meta API down)**
- Set environment variable `WHATSAPP_PROVIDER=twilio`
- Twilio has pre-configured WhatsApp Business number as backup
- This is a temporary measure — resolve Meta issue ASAP

**Step 6: User communication**
If digests delayed > 4 hours:
- Post on Skilved's own WhatsApp Business status (if applicable)
- Note in admin: digest sending paused

---

## Runbook 5: Data Breach Response

### Severity: Critical (legal and trust consequences)

### POPIA requires notification within 72 hours of discovery.

### Steps

**Step 1: Immediate containment (within 1 hour)**
- Identify which system was compromised
- Revoke compromised credentials immediately
```bash
# Rotate all API keys if credentials exposed
gcloud secrets versions disable --secret=GEMINI_API_KEY 1
# Create new version:
gcloud secrets versions add GEMINI_API_KEY --data-file=new-key.txt
```
- Take compromised service offline if active attack
- Preserve logs (do NOT delete — evidence)

**Step 2: Assess scope (within 2 hours)**
- How many users affected?
- What data was exposed? (name, phone, trade, province — not financial data in MVP)
- How did the breach occur?
- Is it still ongoing?

**Step 3: Notify Information Regulator (within 72 hours)**
- File notification at inforegulator.org.za
- Required information:
  - Description of breach
  - Approx number of affected data subjects
  - Categories of data exposed
  - Likely consequences
  - Measures taken or proposed

**Step 4: Notify affected users**
Draft WhatsApp message:
> "Important security notice from Skilved: We discovered that some user data may have been accessed without authorisation on [date]. The data potentially exposed includes [specific fields]. We have contained the breach and are taking steps to prevent recurrence. If you have questions, reply to this message."

**Step 5: Fix and remediate**
- Fix the vulnerability
- Security audit of related systems
- Update security measures
- Document in post-mortem

**Step 6: Post-mortem (within 1 week)**
- Root cause analysis
- Timeline of events
- What was done right
- What can be improved
- Action items with owners and deadlines

---

## Runbook 6: Employer Billing Issue

### Symptoms
- Employer reports being charged incorrectly
- Payment failure
- Invoice not received

### Steps

**Step 1: Check PayFast logs**
```bash
# Check PayFast merchant portal for transaction
# Log into payfast.co.za/merchants
# Find transaction by employer email or amount
```

**Step 2: Check Firestore employer record**
```bash
# In admin dashboard → Employers → find employer
# Check: plan, monthlySpendLimit, referralsThisMonth, billingHistory
```

**Step 3: Check BigQuery for referral count**
```bash
bq query --use_legacy_sql=false '
SELECT COUNT(*) as referrals, SUM(billed_amount) as total_billed
FROM skilved_prod.referrals
WHERE employer_id = "emp_id"
  AND DATE(created_at) >= DATE_TRUNC(CURRENT_DATE(), MONTH)'
```

**Step 4: Resolution**

If overcharged:
- Issue credit note
- Adjust next month's invoice
- Email apology with explanation

If payment failed:
- Check PayFast for failure reason (card expired, insufficient funds)
- Retry payment
- Email employer with update

If invoice not received:
- Re-send invoice from admin dashboard
- Check billing email is correct in employer record

**Step 5: Update billing system**
- Fix any underlying calculation bug
- Add test for the scenario that caused the issue

---

## Runbook 7: Deploying to Production

**Only run after:**
- All CI checks passing
- Staging verified manually
- No critical bugs in Linear
- Team lead approval

### Steps

```bash
# 1. Verify staging is healthy
curl https://staging.skilved.com/api/health

# 2. Run production smoke test on staging
pnpm --filter web test:e2e --env=staging

# 3. Tag release
git tag v1.x.x
git push origin v1.x.x

# 4. Trigger release workflow in GitHub Actions
# Go to Actions → Release to Production → Run workflow
# Enter version and release notes

# 5. Monitor deployment
# Watch Cloud Run deployment progress:
gcloud run services describe discovery-agent --region africa-south1

# 6. Verify production health
curl https://skilved.com/api/health

# 7. Run production smoke test
curl https://skilved.com/api/feed | jq '.meta'

# 8. Monitor Cloud Monitoring for 30 minutes
# Look for: error rate, latency, agent health

# 9. Announce in Slack
# "🚀 Skilved v1.x.x deployed to production"
```

### Rollback if needed
```bash
# Rollback web (Vercel)
vercel rollback --token $VERCEL_TOKEN

# Rollback agents (previous image tag)
gcloud run deploy discovery-agent \
  --image gcr.io/skilved-prod/discovery-agent:v1.x-1 \
  --region africa-south1

# Repeat for each agent that was updated
```

---

## Daily Health Check (5 minutes every morning)

```bash
#!/bin/bash
# scripts/daily-health-check.sh
# Run this every morning before standup

echo "=== SKILVED DAILY HEALTH CHECK ==="
echo "Date: $(date)"

echo "\n--- Agent Status ---"
bq query --use_legacy_sql=false \
  'SELECT agent_name, MAX(started_at) as last_run, status
   FROM skilved_prod.agent_runs
   WHERE DATE(started_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
   GROUP BY agent_name, status
   ORDER BY agent_name'

echo "\n--- Opportunities (last 24h) ---"
bq query --use_legacy_sql=false \
  'SELECT COUNT(*) as new_opportunities
   FROM skilved_prod.opportunities
   WHERE DATE(discovered_at) = CURRENT_DATE()'

echo "\n--- Yesterday Metrics ---"
bq query --use_legacy_sql=false \
  'SELECT * FROM skilved_prod.daily_metrics
   WHERE date = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)'

echo "\n--- Revenue (this month) ---"
bq query --use_legacy_sql=false \
  'SELECT SUM(amount) as mrr
   FROM skilved_prod.revenue
   WHERE DATE_TRUNC(date, MONTH) = DATE_TRUNC(CURRENT_DATE(), MONTH)'

echo "\n=== END HEALTH CHECK ==="
```

---

## Runbook 8: Application Agent Failure

### Symptoms
- User reports "I tapped Apply for me but nothing happened"
- BigQuery `agent_apply_failed` events appearing
- `application_agent` Cloud Run showing high error rate

### Severity: High (core XPRIZE differentiator, user trust at stake)

### Steps

**Step 1: Identify failure type**
```bash
# Check recent failures in BigQuery
bq query --use_legacy_sql=false '
SELECT failure_reason, COUNT(*) as count
FROM skilved_prod.events
WHERE event_type = "agent_apply_failed"
  AND DATE(event_at) = CURRENT_DATE()
GROUP BY failure_reason
ORDER BY count DESC'
```

**Step 2: Email application failures**
```bash
# Check Gmail API status
curl -H "Authorization: Bearer $(cat /tmp/gmail_token)" \
  "https://gmail.googleapis.com/gmail/v1/users/me/profile"

# If Gmail API down: check SMTP fallback is configured
gcloud run services describe application-agent --region africa-south1 \
  | grep SMTP
```

**Step 3: Playwright (web form) failures**
```bash
# Check Playwright Cloud Run logs
gcloud run services logs read application-agent \
  --region africa-south1 \
  --filter "playwright" --limit 50

# Common failures:
# - CAPTCHA detected: add to manual fallback list
# - Form structure changed: update FormFiller selectors
# - Browser crash: increase Cloud Run memory (currently 4Gi)
```

**Step 4: Notify affected users**
For each `agent_apply_failed` event today, send WhatsApp:
> "I couldn't complete your application to [Org] automatically — the form changed. Here's the direct link to apply manually: [URL]. Sorry for the inconvenience."

**Step 5: Add to manual fallback list**
If a specific employer's form is consistently failing, add to `PLAYWRIGHT_MANUAL_FALLBACK_LIST` in Secret Manager — Application Agent will use email method instead.

**Post-mortem:** Document which form structure caused the failure and update `FormFiller.ts` selector mappings.

---

## Runbook 9: Revenue Agent Sending Too Many Prompts

### Symptoms
- Users replying "STOP" in high numbers
- Upgrade prompt unsubscribe rate > 15%
- Complaints about too many messages

### Severity: Medium (trust damage, churn risk)

### Steps

**Step 1: Check prompt frequency**
```bash
bq query --use_legacy_sql=false '
SELECT user_id, COUNT(*) as prompts_sent
FROM skilved_prod.revenue_decisions
WHERE action = "upgrade_prompt"
  AND DATE(decided_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
GROUP BY user_id
HAVING prompts_sent > 2
ORDER BY prompts_sent DESC
LIMIT 20'
```

**Step 2: Identify the misconfigured trigger**
```bash
# Check if cooldown is being respected
bq query --use_legacy_sql=false '
SELECT user_id, decided_at, trigger_type
FROM skilved_prod.revenue_decisions
WHERE user_id IN (SELECT user_id FROM above_query)
ORDER BY user_id, decided_at'
```

**Step 3: Immediate fix**
If cooldown logic broken:
```bash
# Increase cooldown temporarily via environment variable
gcloud run services update revenue-agent \
  --region africa-south1 \
  --update-env-vars REVENUE_TRIGGER_COOLDOWN_HOURS=168
# This pauses prompts for 7 days per user while fix is deployed
```

**Step 4: Deploy fix**
Fix `TimingOptimiser.ts` cooldown check. Deploy via standard CI/CD.

**Step 5: User communication**
If significant users affected:
> "We sent you too many messages recently. We've fixed this. We'll only reach out when we have something genuinely useful for you."

---

## Runbook 10: Customer Success Agent Escalation Backlog

### Symptoms
- Escalation queue in admin growing (> 20 unreviewed items)
- Users waiting > 24 hours for escalation response

### Severity: Medium (trust, XPRIZE CS metric)

### Steps

**Step 1: Triage the queue**
Admin dashboard → Agents → Customer Success → Escalation queue

Sort by:
1. Age (oldest first)
2. Query type (placement questions most urgent)

**Step 2: Batch process**
For each escalation:
- Review CS Agent's attempted responses
- Send human response via WhatsApp
- Mark as resolved in admin
- If it's a query type the agent should handle: add to `QueryClassifier.ts` training examples

**Step 3: Prevent future backlog**
If one query type is repeatedly escalating:
- Add specific handler to `apps/agents/customer-success/src/support/`
- Deploy new handler
- Re-run escalated queries through new handler

**Target:** Escalation queue cleared within 24 hours. Recurring query types resolved at the handler level within 1 sprint.

---

## Runbook 11: Permission Level Consent Audit

*Run quarterly or before any regulatory inquiry.*

### Purpose
Verify that every agent action has a corresponding valid consent record.

```sql
-- Find any agent applications without valid consent
SELECT a.id, a.user_id, a.initiated_by, a.permission_level_at_time, a.consent_id
FROM `skilved_prod.applications` a
LEFT JOIN `skilved_prod.consents` c
  ON a.consent_id = c.id
WHERE a.initiated_by = 'application_agent'
  AND (c.id IS NULL OR c.granted = false OR c.revoked_at IS NOT NULL)
```

If any rows return: immediate investigation required.
- Application was submitted without valid consent — potential POPIA violation
- Contact legal immediately
- Notify affected users
- Review Application Agent `ConsentVerifier.ts` logic

---

## Runbook 12: Interview Coordination Agent Failure

### Symptoms
- User reports "I said yes to the interview but nothing happened"
- `interview_coordination` missing expected `employer_confirmed` events in BigQuery
- Employer received no confirmation reply

### Severity: High (an interview opportunity being missed directly harms the user)

### Steps

**Step 1: Check email parsing**
```bash
# Check Gmail API inbox monitor logs
gcloud run services logs read interview-coordination-agent \
  --region africa-south1 --filter "EmailParser" --limit 30

# If Gmail API errors: check token rotation (refresh token expires every 6 months)
```

**Step 2: Check user confirmation state**
```bash
bq query --use_legacy_sql=false '
SELECT application_id, user_id, interview_schedule
FROM skilved_prod.applications
WHERE DATE(applied_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
  AND JSON_EXTRACT(interview_schedule, "$.userConfirmed") IS NOT NULL'
```

**Step 3: Manual intervention if agent failed**
- Contact user via WhatsApp manually with interview details
- Send confirmation to employer manually
- Log the failure to BigQuery for post-mortem
- Add the email format that failed to `EmailParser` test fixtures

**Note:** This agent is a Sprint 4 stretch goal. If it has not shipped yet, Outcome Tracker handles passive follow-up. The agent failure is high-severity but not blocking — manual intervention is the graceful fallback.

---

## Runbook 13: Agent Context Staleness

### Symptoms
- Revenue Agent sending upgrade prompts to users with open CS escalations
- Application Agent applying against a stale career plan
- `agent_context` document missing for a user who has been active

### Severity: Medium (coordination failure — user experience degraded but no data loss)

### Steps

**Step 1: Check if agent_context exists**
```javascript
const ctx = await db.collection('agent_context').doc(userId).get();
if (!ctx.exists) {
  // Create with empty state — this is the safe recovery
  await db.collection('agent_context').doc(userId).set({
    userId, updatedAt: new Date(), recentActions: [], flags: {}
  });
}
```

**Step 2: Check for stale flags**
```javascript
// A csEscalationOpenSince older than 30 days is almost certainly stale
const flags = ctx.data().flags;
if (flags.csEscalationOpenSince) {
  const age = Date.now() - flags.csEscalationOpenSince.toMillis();
  if (age > 30 * 24 * 60 * 60 * 1000) {
    // Auto-clear stale flag
    await ctx.ref.update({ 'flags.csEscalationOpenSince': FieldValue.delete() });
  }
}
```

**Step 3: Prevention**
- All agents should handle missing `agent_context` gracefully (treat as empty, not as error)
- Add a weekly Cloud Function that prunes `recentActions` older than 7 days and clears stale flags
- Alert in Cloud Monitoring if `agent_context` write fails for any reason

---

*Document version 3.0 — June 2026*
*Owner: Engineering*
*v3.0: Added Runbooks 12 (Interview Coordination Agent failure) and 13 (Agent context staleness)*
