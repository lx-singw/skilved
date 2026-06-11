# Skilved — Operations & Team
### Version 1.0 | June 2026

---

## Operating Principles

1. **Agents first.** Before hiring a human to do a task, ask: can an agent do this? If yes, build the agent. Human time is for strategy, relationships, and judgment — not repetitive execution.

2. **The graph is sacred.** Every product and operational decision is evaluated against one question: does this build the graph? The graph is the company's permanent competitive moat.

3. **Speed over perfection in MVP.** Ship fast, learn fast. A working feed with 200 opportunities beats a perfect feed that launches in 6 weeks.

4. **No dark patterns. Ever.** Skilved earns trust. Trust is the product. Any UX pattern that manipulates, deceives, or pressures users is permanently off the table.

5. **The hybrid model is intentional.** Permission Levels 1–4 are not a concession — they are the architecture that makes full autonomy achievable at population scale. Never apologise for the hybrid model.

6. **SA-native.** Skilved is built for South Africa, by people who understand South Africa. This is not a Western tech playbook applied to SA. It is a SA-first product.

---

## Founding Team Structure

### What the founding team must cover:

| Function | Who |
|---|---|
| Product + vision | Founder |
| Engineering + agents | CTO / Lead Engineer |
| Design + UX | Product Designer |
| Growth + partnerships | Growth Lead |

### Minimum viable team for MVP (4 people):
The MVP can be built by 4 people in 90 days if scoped correctly. Every additional person increases coordination cost. Keep the team small until Month 3.

---

## Hiring Plan

### Month 1–3 (MVP Sprint)
Existing founding team only. No new hires until XPRIZE submission unless critical skill is missing.

### Month 4–6 (Post-XPRIZE, Seed Funding)
Priority hires:

| Role | Priority | Why Now |
|---|---|---|
| Senior Full-Stack Engineer | P0 | Agent complexity increases, need dedicated backend |
| ML / Data Engineer | P0 | Graph infrastructure, model ops, Vertex AI |
| Enterprise Sales (Employer/SETA) | P1 | Revenue scaling requires dedicated sales |
| Marketing Manager | P1 | WhatsApp seeding + SEO needs dedicated owner |

### Month 7–12
| Role | Priority | Why |
|---|---|---|
| Mobile Engineer (React Native) | P0 | App launch Phase 2 |
| Customer Success | P1 | Employer retention, SETA relationships |
| Operations / Finance | P1 | Compliance, accounting, SARS |
| Government Relations Advisor | P2 | DPSA, MyMzansi API partnership |

### Year 2
| Role | Count | Function |
|---|---|---|
| Engineers | +5 | Platform scale, API products, agent improvements |
| Data Scientists | +2 | Graph intelligence, predictive matching |
| Account Managers | +3 | Enterprise employer and SETA accounts |
| Legal / Compliance | +1 | Full-time as SETA + government contracts grow |

---

## 90-Day Sprint Operations

### Daily Rhythms
- 9am standup: 15 minutes. Three questions: what did I ship, what am I shipping today, what's blocking me.
- Agent health check: every morning, review Cloud Monitoring dashboard. Any agent failures get fixed before anything else.
- New opportunity review: weekly sample of 20 published opportunities. Quality check.

### Weekly Rhythms
- Monday: sprint planning (1 hour)
- Friday: metrics review — users, revenue, agent performance, graph growth
- Friday: employer outreach review — pipeline, follow-ups, closes

### Monthly Rhythms
- Month-end metrics compiled and documented (for XPRIZE submission)
- Legal/compliance review (POPIA, any issues)
- Financial review (burn rate, revenue vs target)
- Agent performance review (model accuracy, retrain if needed)

---

## Key Metrics Dashboard

Checked daily by founding team. Compiled weekly for record.

### Product Metrics

| Metric | Check frequency | Tool |
|---|---|---|
| Feed daily active users | Daily | BigQuery |
| Registered users (cumulative) | Daily | Firestore |
| Apply click rate | Daily | BigQuery |
| WhatsApp share rate | Daily | BigQuery |
| Feed → signup conversion | Weekly | BigQuery |
| Return visit rate (7-day) | Weekly | BigQuery |

### Agent Metrics

| Metric | Check frequency | Tool |
|---|---|---|
| Discovery agent last run | Daily | Cloud Monitoring |
| Opportunities discovered per run | Daily | BigQuery |
| Quality rejection rate | Daily | BigQuery |
| Matching agent p95 latency | Daily | Cloud Monitoring |
| Digest delivery rate | Daily | WhatsApp API logs |
| Outcome response rate | Weekly | BigQuery |

### Business Metrics

| Metric | Check frequency | Tool |
|---|---|---|
| Revenue (cumulative) | Daily | Accounting system |
| New paying employers | Weekly | CRM |
| Employer churn | Monthly | CRM |
| Pipeline (employer prospects) | Weekly | CRM |
| SETA conversations active | Weekly | CRM |

---

## Tools Stack

### Communication
- **Slack** — internal team communication
- **WhatsApp** — external (SETA, employer, TVET communication)
- **Notion** — documentation, decisions, meeting notes

### Product Management
- **Linear** — sprint planning, issues, engineering tasks
- **Figma** — design, prototypes, component library

### Engineering
- **GitHub** — code repository, PRs, CI/CD
- **Vercel** — frontend deployment
- **GCP Console** — infrastructure management
- **Cloud Monitoring** — agent health, alerts

### Sales / Growth
- **HubSpot (free tier)** — employer CRM, pipeline tracking
- **Apollo.io** — employer contact sourcing
- **Notion** — SETA partnership tracker

### Finance
- **Sage Business Cloud / Xero** — accounting
- **PayFast / PayGate** — payment processing for employer subscriptions

### Legal
- **HelloSign / DocuSign** — employer contract signing
- **Google Drive** — document storage

---

## Partnership Operations

### TVET College Partnership Process

**Step 1:** Identify college placement officer (LinkedIn, college website)  
**Step 2:** Email outreach (templated, personalised by college)  
**Step 3:** Follow-up call Day 3  
**Step 4:** Demo call (15 minutes, show feed + outcomes)  
**Step 5:** Simple partnership letter (not a contract — a letter of intent)  
**Step 6:** Onboard: add college logo to Skilved website, share tool with students  
**Step 7:** Monthly check-in: how many students, any placements to report?

**Time investment per college:** 2–3 hours total  
**Target:** 5 colleges in Month 1, 20 by Month 3

---

### Employer Outreach Process

**Step 1:** Build list of 50 target employers (Gauteng first, trade-relevant)  
**Step 2:** Find HR/Training Manager on LinkedIn  
**Step 3:** Email outreach — personalised subject line with their trade/location  
**Step 4:** Follow-up call Day 3 if no response  
**Step 5:** Demo (live feed showing their trade candidates)  
**Step 6:** Trial offer: first 3 referrals free  
**Step 7:** First paid referral → standard agreement signed  
**Step 8:** Monthly check-in: are candidates meeting quality expectations?

**Sales cycle target:** < 14 days for first paid referral  
**Target:** 5 paying employers by Day 30

---

### SETA Outreach Process

SETAs are longer sales cycles (30–90 days) but higher value.

**Step 1:** Attend SETA sector skills committee meetings (public) — introduces Skilved to SETA management  
**Step 2:** Direct outreach to SETA CEO/COO (not training manager — go high)  
**Step 3:** Pitch: "We are indexing your learnerships and sending pre-qualified candidates. We'd like to formalise this."  
**Step 4:** Propose pilot: free for 90 days, then R10,000/year  
**Step 5:** Procurement compliance (under threshold if possible)  
**Step 6:** Signed contract  

**Target SETAs (priority):** MERSETA, EWSETA, CETA, MQA  
**Target:** First SETA contract by Day 60

---

## Incident Response

### Agent Failure Protocol

**Discovery agent down > 2 hours:**
1. Cloud Monitoring alert fires → founder + CTO notified
2. Check Cloud Run logs — identify failure reason
3. Manual trigger attempt
4. If not resolved in 1 hour: post to feed banner "Skilved agent is updating — new opportunities in [X] hours"
5. Post-mortem within 24 hours, fix deployed

**Quality agent failure (scam passes through):**
1. User report triggers review
2. Opportunity removed within 30 minutes
3. Quality agent retrained on the failed case
4. Affected employers notified if referral was made

**Data breach:**
1. Immediately isolate affected system
2. Assess scope within 2 hours
3. Notify Information Regulator within 72 hours (POPIA requirement)
4. Notify affected users
5. Public statement if > 100 users affected

---

## Office & Remote Policy

**MVP period (Month 1–3):** Fully remote. Daily standups on Slack Huddle. Weekly in-person if team is SA-based.

**Post-seed (Month 4+):** Hybrid. Co-working space in Johannesburg (Rosebank or Sandton — near enterprise employer targets). 3 days in-person, 2 remote.

**Why Johannesburg:** 
- Largest concentration of SA trade employers
- MERSETA, EWSETA, and CETA headquarters
- TVET colleges with largest trade programmes
- Eskom, Transnet headquarters
- DPSA in Pretoria — 30 minutes away

---

*Document version 1.0 — June 2026*  
*Owner: Founder*
