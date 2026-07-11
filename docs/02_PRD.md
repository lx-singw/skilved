# Skilved — Product Requirements Document (PRD)
### Version 5.1 | June 2026

---

## Table of Contents

- [Document Purpose](#document-purpose)
- [Product Vision](#product-vision)
- [Stakeholders](#stakeholders)
- [User Personas](#user-personas)
- [Functional Requirements](#functional-requirements)
  - [FR-01: Public Opportunity Feed](#fr-01-public-opportunity-feed)
  - [FR-02: Opportunity Detail View](#fr-02-opportunity-detail-view)
  - [FR-03: Application Flow](#fr-03-application-flow)
  - [FR-04: Soft Personalisation Triggers](#fr-04-soft-personalisation-triggers)
  - [FR-05: Account Creation (Optional)](#fr-05-account-creation-optional)
  - [FR-06: User Profile](#fr-06-user-profile)
  - [FR-07: WhatsApp Digest](#fr-07-whatsapp-digest)
  - [FR-08: AI Discovery Agent](#fr-08-ai-discovery-agent)
  - [FR-09: AI Matching Agent](#fr-09-ai-matching-agent)
  - [FR-10: AI Quality Agent](#fr-10-ai-quality-agent)
  - [FR-11: Career Agent](#fr-11-career-agent)
  - [FR-12: Application Agent](#fr-12-application-agent)
  - [FR-13: Revenue Agent](#fr-13-revenue-agent)
  - [FR-14: Growth Agent](#fr-14-growth-agent)
  - [FR-15: Customer Success Agent](#fr-15-customer-success-agent)
  - [FR-16: The Feed — Core Surface Requirements](#fr-16-the-feed--core-surface-requirements)
  - [FR-17: The Profile — Portable Career Identity](#fr-17-the-profile--portable-career-identity)
  - [FR-18: Anonymous vs Authenticated Agent Access](#fr-18-anonymous-vs-authenticated-agent-access)
  - [FR-19: Skills Profile Agent](#fr-19-skills-profile-agent)
  - [FR-20: Anonymous Experience Ceiling](#fr-20-anonymous-experience-ceiling)
  - [FR-21: Skills Passport as Portable Career Identity](#fr-21-skills-passport-as-portable-career-identity)
  - [FR-22: Profile Activity Timeline](#fr-22-profile-activity-timeline)
  - [FR-23: Application Agent Circuit Breaker](#fr-23-application-agent-circuit-breaker)
  - [FR-24: Dispute and Override Handling](#fr-24-dispute-and-override-handling)
  - [FR-25: Agent Trace Visualizer](#fr-25-agent-trace-visualizer)
  - [FR-26: Behavioral Signals & Adaptive Matching](#fr-26-behavioral-signals--adaptive-matching)
  - [FR-27: Agent Coordination Layer](#fr-27-agent-coordination-layer)
  - [FR-28: Interview Coordination Agent](#fr-28-interview-coordination-agent)
  - [FR-29: Gig Agent](#fr-29-gig-agent)
  - [FR-30: Skills Pulse Dashboard](#fr-30-skills-pulse-dashboard)
  - [FR-31: Career Simulation Engine](#fr-31-career-simulation-engine)
  - [FR-32: Employer Accountability Layer](#fr-32-employer-accountability-layer)
  - [FR-33: Collective Intelligence Layer](#fr-33-collective-intelligence-layer)
  - [FR-34: Micro-Credential System](#fr-34-micro-credential-system)
  - [FR-35: ATS Adapter Architecture](#fr-35-ats-adapter-architecture)
  - [FR-36: Document Vault](#fr-36-document-vault)
  - [FR-37: Document Verification Pipeline](#fr-37-document-verification-pipeline)
  - [FR-38: Pre-Flight Application Check](#fr-38-pre-flight-application-check)
  - [FR-39: Review Before Submit](#fr-39-review-before-submit)
  - [FR-40: Multiple Ingestion Paths](#fr-40-multiple-ingestion-paths)
  - [FR-41: MyMzansi Integration](#fr-41-mymzansi-integration)
  - [FR-42: Scope Expansion](#fr-42-scope-expansion)
- [Non-Functional Requirements](#non-functional-requirements)
- [Analytics & Event Tracking](#analytics--event-tracking)
- [Acceptance Criteria — Launch Gates](#acceptance-criteria--launch-gates)
- [Open Questions](#open-questions)
- [Change Log](#change-log)

---

## Document Purpose

This PRD defines the complete product requirements for Skilved v1.0 (MVP). It is the single source of truth for engineering, design, and agent development. It covers all functional requirements, agent behaviours, data requirements, non-functional requirements, and acceptance criteria.

---

## Product Vision

Skilved is South Africa's portable verified economic identity — built on MyMzansi digital public infrastructure rails — that tells every institution not just who you are, but what you can do, what you've done, and what you should do next.

Starting with trades — the highest pain point and clearest TVET infrastructure — and expanding to every qualification level from matric to PhD, from first apprenticeship to senior artisan.

**The five pillars:** Skills Passport + Document Vault + Autonomous Application Agent + Intelligence Layer + MyMzansi Foundation.

---

## Stakeholders

| Role | Responsibility |
|---|---|
| Founder / Product Owner | Vision, prioritisation, XPRIZE submission |
| Engineering Lead | Technical architecture, agent development |
| Design Lead | Feed UI, profile UX, component system |
| Data Lead | Graph schema, BigQuery pipeline, analytics |
| Growth Lead | Acquisition, SETA partnerships, employer sales |

---

## User Personas

### Persona 1: Thandeka — The Apprentice Seeker
- 22 years old, Soweto
- Completed N3 electrical engineering at TVET college
- Searching for an electrical apprenticeship for 6 months
- Uses WhatsApp constantly, phone-first
- Pain: doesn't know where to look, wastes time on fake listings
- Job to be done: find a legitimate, funded electrical apprenticeship in Gauteng

### Persona 2: Sipho — The Experienced Artisan
- 34 years old, Durban
- Trade-tested plumber, 8 years experience
- Wants better-paying work or his own contracts
- Intermittently employed
- Pain: job boards show him irrelevant office jobs
- Job to be done: find plumbing contracts and employer roles matching his trade test level

### Persona 3: Nomvula — The TVET Graduate
- 19 years old, East London
- Just finished N6 boilermaking
- Never been employed formally
- First-time job seeker, overwhelmed
- Pain: doesn't know the difference between a learnership, apprenticeship, and job
- Job to be done: understand what she qualifies for and apply with confidence

### Persona 4: Kagiso — The Employer / SETA Manager
- 41 years old, Pretoria
- Training manager at a mid-size construction company
- Needs to fill 20 learnership spots per year
- Pain: gets hundreds of unqualified applications, wastes weeks screening
- Job to be done: receive pre-filtered, qualified candidates with verified trade backgrounds

### Persona 5: Dr Mokoena — Government Policy Official
- 52 years old, Pretoria
- DHET Deputy Director
- Needs real-time skills intelligence for budget submissions
- Uses Skills Pulse Dashboard

### Persona 6: Kefilwe — TVET Graduate (NEW v5.0)
- 20 years old, East London
- Just finished N6 Boilermaking
- First-time job seeker
- Uploads her TVET certificate via WhatsApp photo. Skilved verifies it against SAQA automatically. Her first application has all documents pre-attached — she never uploads her ID again.

### Persona 7: Lwazi — Trade-Tested Artisan with Documents (NEW v5.0)
- 35 years old, Durban
- Trade-tested plumber
- Has NAMB registration number
- Uploads his trade test certificate — Skilved verifies against NAMB register. His "NAMB Verified Artisan" badge makes him dramatically more visible to employers.

---

## Functional Requirements

### FR-01: Public Opportunity Feed
**Priority:** P0 — Must ship in week 1

| Requirement | Detail |
|---|---|
| FR-01.1 | Feed loads without authentication |
| FR-01.2 | Feed displays minimum 50 opportunities on initial load |
| FR-01.3 | Feed supports infinite scroll (load 20 more per scroll) |
| FR-01.4 | Feed filters: Trade category, Province, Opportunity type, Salary range |
| FR-01.5 | Filters apply without page reload |
| FR-01.6 | Each card shows: title, organisation, trade badge, province, type, salary/stipend, deadline, freshness timestamp |
| FR-01.7 | Feed sorted by: relevance (default), newest, closing soon |
| FR-01.8 | Feed updates in real time when agent publishes new opportunities (no manual refresh required) |
| FR-01.9 | Expired opportunities auto-removed within 1 hour of deadline passing |
| FR-01.10 | Feed accessible on mobile (375px+) with no horizontal scroll |

### FR-02: Opportunity Detail View
**Priority:** P0 — Must ship in week 1

| Requirement | Detail |
|---|---|
| FR-02.1 | Detail view accessible without authentication |
| FR-02.2 | Detail shows: full title, organisation, location (specific), type, full description, requirements, salary/stipend, duration, how to apply, deadline, source URL |
| FR-02.3 | AI-generated summary of key requirements (3 bullet points, generated by Gemini) |
| FR-02.4 | "What you need" checklist (qualification level, experience, documentation) |
| FR-02.5 | Share button (WhatsApp, copy link) |
| FR-02.6 | Apply CTA — primary button, always visible |
| FR-02.7 | Related opportunities section (3–5 similar, AI-selected) |
| FR-02.8 | Detail view has unique URL, shareable and indexable |
| FR-02.9 | SEO meta tags auto-generated per opportunity |
| FR-02.10 | Detail view shows employer accountability score (full breakdown), cohort intelligence (authenticated), required documents checklist ("This application needs: ID copy, N3 certificate, proof of address"), and ATS platform badge. |

### FR-03: Application Flow
**Priority:** P0 — Must ship in week 1

| Requirement | Detail |
|---|---|
| FR-03.1 | External application: "Apply" button opens source URL in new tab |
| FR-03.2 | Application click logged to BigQuery (anonymous session ID) |
| FR-03.3 | Post-click: "Track your application?" prompt (soft signup trigger) |
| FR-03.4 | For opportunities with email application: in-app application form (name, contact, WhatsApp, cover note) |
| FR-03.5 | AI-assisted cover note: Gemini generates a personalised first draft based on opportunity requirements + user profile (if available) |
| FR-03.6 | Application confirmation page with next steps guidance |

### FR-04: Soft Personalisation Triggers
**Priority:** P0 — Must ship in week 1

| Requirement | Detail |
|---|---|
| FR-04.1 | After viewing 3 opportunities: soft personalisation prompt appears |
| FR-04.2 | After browsing same trade 2+ sessions: trade-specific prompt |
| FR-04.3 | After sharing an opportunity: WhatsApp digest offer |
| FR-04.4 | Prompts appear maximum once per session |
| FR-04.5 | Prompts dismissible in one tap, never reappear that session |
| FR-04.6 | Prompts never block, blur, or obscure content |
| FR-04.7 | No dark patterns — no countdown timers, no fake urgency |

### FR-05: Account Creation (Optional)
**Priority:** P1 — Must ship in week 3

| Requirement | Detail |
|---|---|
| FR-05.1 | Signup via: WhatsApp number + OTP (primary), Google OAuth (secondary), Email (tertiary) |
| FR-05.2 | Minimum profile: Trade category + Province (2 fields) |
| FR-05.3 | Signup < 60 seconds from decision to active personalised feed |
| FR-05.4 | Existing session preserved on signup (browsing history used to pre-populate preferences) |
| FR-05.5 | WhatsApp number optional at signup but nudged |
| FR-05.6 | Profile completion progress bar visible |
| FR-05.7 | Each completion step shows what unlocks |

### FR-06: User Profile
**Priority:** P1 — Must ship in week 3

| Requirement | Detail |
|---|---|
| FR-06.1 | Profile has shareable public URL: skilved.com/[username] |
| FR-06.2 | Public profile shows: trade, province, qualification level, experience, certificates (user-controlled visibility) |
| FR-06.3 | "Send me your Skilved" link prominently displayed |
| FR-06.4 | Profile completion percentage visible |
| FR-06.5 | Edit profile inline (no separate edit page) |
| FR-06.6 | Application history tab (opportunities applied to via Skilved) |
| FR-06.7 | Saved opportunities tab |
| FR-06.8 | Outcome reporting: user can mark applications as interviewed / offered / accepted |

### FR-07: WhatsApp Digest
**Priority:** P1 — Must ship in week 3

| Requirement | Detail |
|---|---|
| FR-07.1 | Daily digest sent at 7am (user configurable) |
| FR-07.2 | Contains: 3–5 new opportunities matching profile |
| FR-07.3 | Each opportunity: title, org, type, deadline, direct link |
| FR-07.4 | One-tap reply to pause digest |
| FR-07.5 | Digest only sent for genuinely new opportunities since last message |
| FR-07.6 | Unsubscribe honoured within 1 message |

### FR-08: AI Discovery Agent
**Priority:** P0 — Must run before launch

| Requirement | Detail |
|---|---|
| FR-08.1 | Agent runs every 4 hours, 24/7, without human intervention |
| FR-08.2 | Agent crawls minimum 50 sources on each cycle |
| FR-08.3 | Agent extracts: title, type, organisation, location, requirements, salary, deadline, application URL |
| FR-08.4 | Agent deduplicates across sources (fuzzy match on title + org + deadline) |
| FR-08.5 | Agent assigns quality score 0–100 per opportunity |
| FR-08.6 | Opportunities below quality threshold 40 not published to feed |
| FR-08.7 | Agent logs every run to BigQuery with: sources crawled, opportunities found, published, rejected, errors |
| FR-08.8 | Agent alerts on failure via Cloud Monitoring |
| FR-08.9 | Agent never requires human approval to publish |

### FR-09: AI Matching Agent
**Priority:** P0 — Must ship in week 2

| Requirement | Detail |
|---|---|
| FR-09.1 | Matching runs on every feed page load |
| FR-09.2 | Anonymous users: ranked by trade filter selection + location signals |
| FR-09.3 | Logged-in users: ranked by full profile match score |
| FR-09.4 | Match score factors: trade match (40%), location match (25%), qualification level fit (20%), opportunity freshness (15%) |
| FR-09.5 | Match explanation visible: "Skilved matched this because: [reason]" (1 sentence) |
| FR-09.6 | Model retrains on outcome data weekly |

### FR-10: AI Quality Agent
**Priority:** P1 — Must ship in week 4

| Requirement | Detail |
|---|---|
| FR-10.1 | Quality agent runs on every new opportunity before publication |
| FR-10.2 | Scam detection: flags opportunities with payment requests, vague descriptions, suspicious contact details |
| FR-10.3 | Duplicate detection: flags near-duplicate listings across sources |
| FR-10.4 | Deadline validation: removes expired listings within 1 hour |
| FR-10.5 | Source credibility scoring: known SETAs and employers score higher |
| FR-10.6 | User-reported issues feed back into quality model |

### FR-11: Career Agent
**Priority:** P1 — Must ship in week 3

| Requirement | Detail |
|---|---|
| FR-11.1 | Career Agent runs on every profile completion or update |
| FR-11.2 | Career Agent generates a career plan within 60 seconds of profile reaching 40% completion |
| FR-11.3 | Career plan contains: current skills assessment, target role, skills gap, 3 specific next steps, estimated timeline |
| FR-11.4 | Timeline estimate draws from graph data (similar users' actual outcomes) where sample size ≥ 10 |
| FR-11.5 | Career plan delivered via WhatsApp message (primary) and profile page (secondary) |
| FR-11.6 | Career Agent sends weekly update when new opportunities align with a user's career steps |
| FR-11.7 | Career plan visually displayed on profile page under "My career path" |
| FR-11.8 | User can update target role — Career Agent regenerates plan within 60 seconds |
| FR-11.9 | Career Agent available to authenticated users only (requires profile with trade + qualification) |
| FR-11.10 | Career Agent explicitly surfaces which current Skilved opportunities advance the user's plan |

### FR-12: Application Agent
**Priority:** P0 for XPRIZE — Must ship in week 5–6

| Requirement | Detail |
|---|---|
| FR-12.1 | Application Agent only activates when user has set Permission Level 3 or 4 (see FR-18) |
| FR-12.2 | "Apply for me" button visible on every opportunity card for Level 3+ users |
| FR-12.3 | Level 3 (semi-auto): Agent applies only when match score ≥ 85% — prompts user for lower scores |
| FR-12.4 | Level 4 (full-auto): Agent applies to all matches above minimum threshold without prompting |
| FR-12.5 | Application Agent generates a tailored CV per application using user profile + opportunity requirements |
| FR-12.6 | Application Agent generates a specific cover letter per opportunity (not a template — opportunity-specific) |
| FR-12.7 | Email application method: agent sends email with correct subject, CV attached, cover letter in body |
| FR-12.8 | Web form method: Playwright fills and submits online application forms autonomously |
| FR-12.9 | Agent captures confirmation reference number and logs to Firestore applications collection |
| FR-12.10 | User receives WhatsApp confirmation within 60 seconds of successful submission: "Applied to [Org] ✓ Ref: [REF]" |
| FR-12.11 | Failed applications (CAPTCHA, broken forms) reported to user within 5 minutes with manual fallback |
| FR-12.12 | All agent-submitted applications visible in user's Applications tab with "Applied by Skilved" label |
| FR-12.13 | Application Agent logs every submission to BigQuery with `human_approvals_required: 0` |
| FR-12.14 | Playwright application attempts must not violate employer/SETA terms of service — check robots.txt |
| FR-12.15 | Application Agent MUST run pre-flight check (Agent 18) before every submission — no exceptions |
| FR-12.16 | Application Agent MUST NOT submit an incomplete application silently — HOLD and notify user |
| FR-12.17 | Missing 1–2 docs: WhatsApp user with upload request, hold application up to 24h, submit when uploaded |
| FR-12.18 | Missing many docs: route to manual application with pre-filled detail link |
| FR-12.19 | Review-before-submit required at Level 3 — screenshot + document list + YES/EDIT/CANCEL |
| FR-12.20 | Level 4: review-before-submit optional (user can configure), auto-submits after 4h silence |
| FR-12.21 | Document attachment via signed URLs — Application Agent NEVER reads document content |
| FR-12.22 | Certified copy requirement flagged to user with two options: hold until certified, or apply noting limitation |
| FR-12.23 | `pre_flight_passed` and `review_confirmed` fields logged on every submission in BigQuery |
| FR-12.24 | Zero incomplete applications may ever be submitted without user explicit knowledge |
| FR-12.25 | Email + portal registration hybrid: if opportunity has `applicationEmail` AND `requiresAccountCreation=true`, Application Agent MUST first complete portal registration (Approach A service account), THEN send the email application — both steps logged as a single application submission in BigQuery |
| FR-12.26 | If portal registration fails in a hybrid email+portal flow, email is NOT sent — application HELD, user notified with manual apply link |
| FR-12.27 | `EmailSubmitter` MUST validate `applicationEmail` is non-empty and well-formed before attempting send — if invalid, log `invalid_application_email` to BigQuery and route to `GenericPlaywrightSubmitter` or manual fallback |

### FR-13: Revenue Agent
**Priority:** P1 — Must ship in week 7–8

| Requirement | Detail |
|---|---|
| FR-13.1 | Revenue Agent monitors user behaviour events in real time via BigQuery streaming |
| FR-13.2 | Revenue Agent fires on defined trigger events: high_match_view (3x ≥85%), career_plan_sent, application_success, inactivity_risk (7 days no visit), organic_upgrade_intent (visited /permissions) |
| FR-13.3 | For each trigger, Revenue Agent decides: upgrade_prompt, retention_offer, or nothing |
| FR-13.4 | Decision confidence threshold: agent only sends prompt if confidence ≥ 0.70 |
| FR-13.5 | Upgrade prompts delivered via WhatsApp at user's peak engagement time (inferred from event history) |
| FR-13.6 | Upgrade prompt copy generated by Gemini — personalised to trigger event, not a generic template |
| FR-13.7 | Maximum 1 upgrade prompt per user per 72-hour window (no harassment) |
| FR-13.8 | All Revenue Agent decisions logged to BigQuery with: trigger, action, confidence, message, conversion outcome |
| FR-13.9 | `human_approvals_required: 0` in all Revenue Agent logs |
| FR-13.10 | A/B testing: Revenue Agent runs max 2 concurrent pricing experiments; auto-promotes winner after 200 samples |

### FR-14: Growth Agent
**Priority:** P1 — Must ship in week 9–10

| Requirement | Detail |
|---|---|
| FR-14.1 | Growth Agent creates minimum 1 social post per day autonomously (no human approval required) |
| FR-14.2 | Content types: opportunity highlight, trade explainer, success story, SETA guide, salary insight from graph |
| FR-14.3 | Posts published to: Facebook Page, Instagram (Reels caption), LinkedIn Page |
| FR-14.4 | Growth Agent monitors Google Search Console API weekly and generates SEO content for top unranked queries |
| FR-14.5 | Growth Agent identifies top sharers (users who shared 3+ opportunities) and sends ambassador invitation |
| FR-14.6 | Ambassador invitation message generated by Gemini, personalised to the user's trade and sharing history |
| FR-14.7 | Referral tracking: Growth Agent monitors referral UTM parameters and triggers reward WhatsApp on conversion |
| FR-14.8 | All Growth Agent actions logged to BigQuery: content_created, content_published, ambassador_invited, referral_converted |
| FR-14.9 | `human_approvals_required: 0` for standard content. Human weekly review of flagged content only |
| FR-14.10 | Growth Agent pauses publishing if no opportunities discovered in last 8 hours (Scout Agent down) |

### FR-15: Customer Success Agent
**Priority:** P1 — Must ship in week 3 (basic onboarding), full spec week 6

| Requirement | Detail |
|---|---|
| FR-15.1 | Customer Success Agent sends welcome message within 5 minutes of account creation |
| FR-15.2 | Welcome message includes: top 3 matched opportunities, quick-start guidance, next step prompt |
| FR-15.3 | 30-day onboarding sequence: Day 0, 1, 3, 7, 14 touchpoints (see 24_AI_Employees_Architecture.md) |
| FR-15.4 | Agent handles inbound WhatsApp queries: how-it-works, find-opportunity, legitimacy-check, application-status, profile-help, cancel, placement-success |
| FR-15.5 | Response generated by Gemini with full conversation history as context |
| FR-15.6 | Resolution target: 95%+ of queries resolved without human escalation |
| FR-15.7 | Escalation: unresolved after 2 agent attempts → flagged for weekly human batch review → user notified within 24h |
| FR-15.8 | All interactions logged to BigQuery: query_type, resolved, escalated, resolution_time |
| FR-15.9 | `human_approvals_required: 0` in real-time path. Human batch review weekly only |
| FR-15.10 | Customer Success Agent available to all authenticated users via WhatsApp reply |

### FR-16: The Feed — Core Surface Requirements
**Priority:** P0 — The feed is the product. These requirements are non-negotiable.

| Requirement | Detail |
|---|---|
| FR-16.1 | Feed is fully accessible to anonymous users — no login gate, no content blur, no "sign up to see more" |
| FR-16.2 | Feed loads with minimum 50 opportunities on initial render |
| FR-16.3 | Every opportunity card shows freshness timestamp: "Found [X] hours ago by Skilved" — this is non-negotiable |
| FR-16.4 | Feed is the primary proof of agent operation — users must feel the AI is actively working for them |
| FR-16.5 | Feed personalisation improves visibly as user completes more profile (creates incentive for profile completion) |
| FR-16.6 | Feed for anonymous users shows trade + province filter above fold — no scroll required on mobile |
| FR-16.7 | For Level 3+ users: "Skilved applied to 2 opportunities for you overnight" banner appears at top of feed on return visit |
| FR-16.8 | "New since your last visit: X opportunities" shown to returning users (anonymous session or authenticated) |
| FR-16.9 | Feed never shows the same expired opportunity twice |
| FR-16.10 | WhatsApp share on every card — one tap, pre-filled message, never buried in a menu |
| FR-16.11 | Feed SEO: every trade + province combination generates a unique indexed URL with proper meta tags |
| FR-16.12 | Feed must load in < 1.5 seconds on a mid-range Android device on SA 4G (tested on Samsung Galaxy A52) |

### FR-17: The Profile — Portable Career Identity
**Priority:** P0 — The profile is the second non-negotiable. It is not a preferences form. It is the worker's portable, verified career identity.

| Requirement | Detail |
|---|---|
| FR-17.1 | Profile has a permanent, shareable public URL: `skilved.com/[username]` |
| FR-17.2 | Profile public URL is the answer to "send me your Skilved" — it must be findable, shareable, and readable by recruiters and employers |
| FR-17.3 | Profile displays: trade, province, qualification level, experience, certificates, employment status, career plan summary |
| FR-17.4 | Profile completion drives agent capability unlock — each level unlocks a named, specific benefit (not generic "better results") |
| FR-17.5 | Profile is progressive: Starter (20%) → Active (40%) → Strong (60%) → Skilved (80%) → Verified (100%) |
| FR-17.6 | "Skilved Verified" badge (Phase 2) appears when MyMzansi credentials are linked — government-grade trust |
| FR-17.7 | Profile shows career plan section — powered by Career Agent, visible to profile owner and (optionally) public |
| FR-17.8 | Profile shows application history — manual and agent-submitted, with outcome status |
| FR-17.9 | Profile shows permission level badge: "Skilved agent is working for you at Level [X]" |
| FR-17.10 | Profile is designed to be sent to a recruiter, employer, or SETA as a living credential document |
| FR-17.11 | Profile CV export: one-tap PDF download of a formatted CV generated from profile data |
| FR-17.12 | Profile is updated automatically by agents: Career Agent updates career plan, Application Agent logs submissions, Outcome Tracker updates placement status |
| FR-17.13 | Profile serves as the data input for all personalised agent operations — quality of agents directly proportional to profile completeness |

### FR-18: Anonymous vs Authenticated Agent Access
**Priority:** P0 — Critical for XPRIZE demonstration and product architecture

| Agent | Anonymous (no account) | Authenticated Level 1 | Authenticated Level 2 | Authenticated Level 3 | Authenticated Level 4 |
|---|---|---|---|---|---|
| **Scout** | ✅ Full feed access | ✅ Full feed access | ✅ Full feed access | ✅ Full feed access | ✅ Full feed access |
| **Analyst** | ✅ Summary + checklist on detail view | ✅ Full intelligence | ✅ Full intelligence | ✅ Full intelligence | ✅ Full intelligence |
| **Matching** | ✅ Filter-based ranking | ✅ Profile-matched ranking | ✅ Profile-matched ranking | ✅ Profile-matched ranking | ✅ Profile-matched ranking |
| **Career** | ❌ Not available | ✅ Career plan generated | ✅ Career plan + weekly updates | ✅ Full career intelligence | ✅ Full career intelligence |
| **Application** | ❌ Not available | ❌ Not available (manual apply only) | ✅ Drafts ready, user submits | ✅ Auto-applies to ≥85% matches | ✅ Auto-applies to all matches above min |
| **Revenue** | ❌ No (no account to upgrade) | ✅ Upgrade prompts sent | ✅ Upgrade prompts sent | ✅ Retention + upsell prompts | ✅ Retention + upsell prompts |
| **Growth** | ✅ Share button (manual) | ✅ Share + referral tracking | ✅ Share + referral + ambassador eligible | ✅ Agent shares on their behalf | ✅ Agent shares + full ambassador programme |
| **Customer Success** | ✅ Generic FAQ only (WhatsApp) | ✅ Full personalised onboarding | ✅ Full support + career guidance | ✅ Full support + application help | ✅ Full support + proactive check-ins |
| **Notification** | ❌ No account = no digest | ✅ Daily digest (if WA provided) | ✅ Daily digest | ✅ Daily digest + "agent applied" alerts | ✅ Daily digest + full agent activity stream |
| **Outcome Tracker** | ❌ No account to track | ✅ Manual outcome reporting | ✅ Manual + prompted follow-up | ✅ Automated follow-up | ✅ Fully automated outcome tracking |

### FR-19: Skills Profile Agent
**Priority:** P0 — The foundation. Must ship in Sprint 2 (Week 3).

| Requirement | Detail |
|---|---|
| FR-19.1 | Skills Profile Agent fires on every profile update event |
| FR-19.2 | Agent extracts structured skills from free-text work history using Gemini |
| FR-19.3 | Extracted skills stored as `extractedSkills[]` — never the raw user text |
| FR-19.4 | Agent maps self-reported qualifications to NQF levels and SAQA framework |
| FR-19.5 | Agent generates an `agentSummary` — 2–3 sentence passport summary for other agents to read |
| FR-19.6 | Agent pre-computes `matchingSignals[]` for Matching Agent performance |
| FR-19.7 | Agent calculates `completenessScore` 0–100 with named level |
| FR-19.8 | Agent generates `enrichmentSuggestions[]` — specific actions user can take to unlock more opportunities |
| FR-19.9 | Enrichment suggestions shown on profile page: "Add your Wireman's licence to unlock 12 more opportunities" |
| FR-19.10 | Agent runs on uploaded certificates via Document AI — extracts qualification data from PDF |
| FR-19.11 | Passport version incremented on every enrichment run — full history maintained |
| FR-19.12 | All enrichment runs logged to BigQuery with `human_approvals_required: 0` |
| FR-19.13 | Matching Agent reads `agentSummary` and `matchingSignals` — not raw profile fields |
| FR-19.14 | Career Agent reads full passport — plan accuracy depends on passport richness |
| FR-19.15 | Application Agent reads passport for CV and cover letter generation |
| FR-19.16 | Passport completeness gates agent capability: Active (40%) → Matching; Strong (60%) → Career; Skilved (80%) → Application |

### FR-20: Anonymous Experience Ceiling
**Priority:** P0 — The anonymous ceiling is a deliberate product decision. Must be respected from Sprint 1.

| Requirement | Detail |
|---|---|
| FR-20.1 | Anonymous users get: full feed, full opportunity details, direct apply, WhatsApp share |
| FR-20.2 | Anonymous users do NOT get: personalised matching, match scores, Career Agent, Application Agent, saved opportunities, notification digest |
| FR-20.3 | Matching Agent does NOT run for anonymous users — feeds are filter-ordered, not passport-matched |
| FR-20.4 | Anonymous feed shows "Create your Skills Passport to see your match score" where match badge would appear on authenticated feed |
| FR-20.5 | Anonymous conversion hook: after 3 opportunity views, show soft prompt emphasising passport benefits — not "sign up to see more" |
| FR-20.6 | Conversion hook copy: "Skilved found 47 more electrical opportunities. Create your Skills Passport to get matched automatically." — never "sign up to unlock" |
| FR-20.7 | The contrast between anonymous feed (unranked, no match scores) and authenticated feed (ranked, explained) is the product's primary conversion mechanism |
| FR-20.8 | Anonymous users can complete the full apply flow — passport creation is never a gate to accessing opportunities |
| FR-20.9 | Soft prompts maximum once per session, dismissible, never blocking |

### FR-21: Skills Passport as Portable Career Identity
**Priority:** P0 — The passport is not a profile form. It is the worker's portable career credential.

| Requirement | Detail |
|---|---|
| FR-21.1 | Every authenticated user has a permanent public URL: `skilved.com/[username]` |
| FR-21.2 | Public profile answers "send me your Skilved" — designed to be sent to a recruiter or employer |
| FR-21.3 | Public profile displays: trade, province, NQF level, extracted skills, work history, completeness level |
| FR-21.4 | "Skilved Verified" badge appears when passport completeness = 100% (Phase 2: MyMzansi linked) |
| FR-21.5 | One-tap CV export: PDF generated from passport data, formatted for employer submission |
| FR-21.6 | CV is generated by Skills Profile Agent from passport — not a form download |
| FR-21.7 | Profile shows career plan section (Career Agent output, visible after Sprint 3) |
| FR-21.8 | Profile shows application history — manual and agent-submitted, with outcome status |
| FR-21.9 | Profile shows permission level: "Skilved agent is working for you at Level [X]" |

### FR-22: Profile Activity Timeline
**Priority:** P1 — Ships in Sprint 2 with the Skills Passport

| Requirement | Detail |
|---|---|
| FR-22.1 | Every authenticated user's profile includes an `ActivityTimeline` — chronological feed of agent and user activity |
| FR-22.2 | Timeline entries include: passport enrichment events, matches found, career plan generated/updated, applications submitted (manual or agent), outcomes reported, permission level changes |
| FR-22.3 | Each entry is plain-language, e.g. "Skilved found 4 new matches for you", "Your career plan was updated", "Applied to Eskom on your behalf" |
| FR-22.4 | Timeline is the visual proof that agents are actively working — reinforces the permission model value |
| FR-22.5 | Timeline is private by default — visible only to the profile owner (public profile shows summary stats only, not full timeline) |
| FR-22.6 | Timeline data sourced from existing BigQuery events — no new data collection required |

### FR-23: Application Agent Circuit Breaker
**Priority:** P0 — Ships with Application Agent v1, Sprint 3. Non-negotiable safety requirement.

| Requirement | Detail |
|---|---|
| FR-23.1 | Application Agent tracks applications submitted per user within a rolling 1-hour window |
| FR-23.2 | If applications for one user exceed threshold (default 5/hour), the agent halts further applications for that user |
| FR-23.3 | Halt triggers a `circuit_breaker_triggered` event to BigQuery — logged separately from `human_approvals_required` (a safety pause is not a human approval) |
| FR-23.4 | User is notified via WhatsApp: "I've paused applying for you for now — want to review what I've sent so far?" |
| FR-23.5 | Resuming requires either: user confirmation via WhatsApp reply, OR 24 hours elapsed with no further trigger |
| FR-23.6 | Threshold is configurable via `APPLICATION_CIRCUIT_BREAKER_MAX_PER_HOUR` environment variable |
| FR-23.7 | Circuit breaker state is per-user, not global — one user's halt does not affect others |

### FR-24: Dispute and Override Handling
**Priority:** P1 — Ships with Customer Success Agent v1, Sprint 3

| Requirement | Detail |
|---|---|
| FR-24.1 | User can reply "DISPUTE" to any agent-generated WhatsApp message to flag it |
| FR-24.2 | DisputeHandler acknowledges within one message: "Got it — I've flagged this for review. A human will look at it within 24 hours." |
| FR-24.3 | Dispute logged to Firestore `conversations` with `status: escalated`, `escalationReason: user_dispute` |
| FR-24.4 | Dispute appears in admin escalation queue, sorted by age |
| FR-24.5 | Disputes related to Application Agent actions (e.g. "I didn't want to apply there") immediately pause that user's Application Agent (same mechanism as circuit breaker) pending review |
| FR-24.6 | Human response to dispute sent via WhatsApp within 24h SLA |
| FR-24.7 | This satisfies the POPIA "right to object to automated decision-making" requirement (Section 71) — see 26_Worker_Permission_Model.md |

### FR-25: Agent Trace Visualizer (XPRIZE Demonstration Tool)
**Priority:** P0 — Ships in Sprint 3. Primary artifact for proving AI-native operations to judges.

| Requirement | Detail |
|---|---|
| FR-25.1 | Admin page at `/agents/trace/[userId]` renders the full chronological chain of agent actions for one user |
| FR-25.2 | Chain includes: Scout discovery → Analyst enrichment → Quality approval → Matching score + reasoning → Career plan alignment → Application Agent action + consent/threshold reasoning → Outcome follow-up |
| FR-25.3 | Each step shows: agent name, timestamp, decision made, plain-language reasoning, `human_approvals_required: 0` |
| FR-25.4 | Data sourced by joining `agent_runs`, `revenue_decisions`, `applications`, `quality_decisions`, `consents` by `user_id` |
| FR-25.5 | Designed to be the centrepiece of the XPRIZE live demo — "here is exactly what happened for this real user, and no human touched any of it" |
| FR-25.6 | Accessible only to admin users (internal tool, not public-facing) |

### FR-26: Behavioral Signals & Adaptive Matching
**Priority:** P1 — Sprint 4 stretch goal, otherwise first Phase 2 item. This is the mechanism that makes agents demonstrably more accurate across sessions.

| Requirement | Detail |
|---|---|
| FR-26.1 | A `behavioralSignals` object on `skills_passports` tracks dismissal patterns, engagement timing, override rates, and career step completion — derived from existing BigQuery events, no new data collection |
| FR-26.2 | Matching Agent down-weights opportunity types and organisations the user has repeatedly dismissed (3+ times) without requiring an explicit "don't show me this" action |
| FR-26.3 | Revenue Agent checks `overrideRate` before sending Level 4 upgrade prompts — high override rate suppresses the prompt regardless of other triggers |
| FR-26.4 | Career Agent detects when `careerStepsIgnored` is high for a step type and adjusts the plan rather than repeating the same suggestion |
| FR-26.5 | Notification Agent sends digests at the user's `peakEngagementHours` rather than a fixed 7am for every user |
| FR-26.6 | `behavioralSignals` is recalculated on a scheduled basis (daily) by a lightweight enrichment job, not in the request path |
| FR-26.7 | This requirement directly demonstrates "agents that remember user preferences and make increasingly accurate decisions across multi-turn, cross-session interactions" for XPRIZE judging |

### FR-27: Agent Coordination Layer (agent_context)
**Priority:** P1 — Sprint 4. Demonstrates genuine multi-agent collaboration, not just sequential pipeline execution.

| Requirement | Detail |
|---|---|
| FR-27.1 | A single `agent_context/{userId}` Firestore document is read by every agent at the start of its run and updated at the end |
| FR-27.2 | `agent_context` contains a rolling 7-day log of `recentActions` and a set of coordination `flags` (see 14_Data_Models_Schema.md) |
| FR-27.3 | Revenue Agent must check `flags.csEscalationOpenSince` and suppress upgrade prompts for 7 days following an open CS escalation |
| FR-27.4 | Application Agent must check `flags.careerPlanChangedAt` and re-score the opportunity against the updated career plan before applying, if the plan changed since the last scoring |
| FR-27.5 | Growth Agent must check `flags.applicationConfirmedAt` as a trigger condition for share-invite prompts |
| FR-27.6 | All agents must check `flags.circuitBreakerHaltedAt` and pause user-facing autonomous actions platform-wide for that user while set |
| FR-27.7 | The Agent Trace Visualizer (FR-25) should surface cause-and-effect between agents where `agent_context` flags influenced a decision — "Agent X did Y because Agent Z had set flag W" |
| FR-27.8 | Implementation is additive to existing agent logic — no new agents required |

### FR-28: Interview Coordination Agent
**Priority:** P2 — Sprint 4 stretch goal, otherwise first Phase 2 item following Application Agent v1 (Sprint 3) producing real submissions.

| Requirement | Detail |
|---|---|
| FR-28.1 | Agent monitors the `applications@skilved.com` inbox (used by Application Agent for email submissions) for employer replies indicating interview intent |
| FR-28.2 | On detection, agent extracts proposed date/time/format and sends a WhatsApp confirmation request to the user |
| FR-28.3 | On user confirmation, agent confirms the time with the employer via email and writes `interviewSchedule` to the `applications` document |
| FR-28.4 | Agent triggers Career Agent to generate interview prep notes from the opportunity's requirements (existing Career Agent data — no new intelligence required) |
| FR-28.5 | Agent sends a reminder + prep notes via WhatsApp on the morning of the interview |
| FR-28.6 | If the user requests a reschedule, agent negotiates a new time with the employer and confirms back to the user — never finalises a new time without explicit user confirmation |
| FR-28.7 | Outcome Tracker is updated with `interview_completed` / `no_show` / `cancelled` following the scheduled time |
| FR-28.8 | All actions logged with `human_approvals_required: 0`; confirmation gates (user "yes") are user actions, not human approvals of agent decisions |

### FR-29: Gig Agent (Phase 2/3 — Roadmap Visibility)
**Priority:** P3 — Not built in MVP. Included here for roadmap completeness and to inform schema decisions made now (see `gigs`, `quotes`, `invoices` stubs in 14_Data_Models_Schema.md).

| Requirement | Detail |
|---|---|
| FR-29.1 | Gig Agent will operate as an AI back office for a tradesperson's private gig work — receiving customer inquiries via WhatsApp, generating quotes, scheduling, and producing invoices |
| FR-29.2 | Quote generation will reuse the CV/cover-letter generation pattern from Application Agent (Gemini reasoning against structured input — job type + standing rates) |
| FR-29.3 | Completed gigs will become outcomes in the graph, feeding Reputation Agent (Agent 10) as a second source of trust signals alongside employer reviews |
| FR-29.4 | Standing rates will be set once by the tradesperson (stored on passport or a linked settings object); agent operates autonomously within those rates with confirmation gates for non-standard requests |
| FR-29.5 | This agent is the structural bridge from "worker" to "micro-business" to eventual "employer on Skilved" — informing the long-term education/career/HR vision referenced in 00_INDEX.md and 04_XPRIZE_Strategy.md |
| FR-29.6 | Dependency: requires Reputation Agent (Agent 10) and Automated Employer Verification (08_Post_MVP_Future_Plans.md §2.11) to be live first |

### FR-30: Skills Pulse Dashboard
*Managed by Agent 14 (Skills Pulse Agent). For detailed specs refer to [27_Skills_Pulse_Dashboard.md](file://wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/docs/27_Skills_Pulse_Dashboard.md).*
- FR-30.1: Live National Overview interface updating daily
- FR-30.2: Demand-Supply Gap Heatmap of SA provinces and trades
- FR-30.3: At-Risk Learnership alerts
- FR-30.4: Median ROI qualification rankings
- FR-30.5: TVET college placement metric indexing

### FR-31: Career Simulation Engine
*Managed by Agent 15 (Career Simulation Agent). For detailed specs refer to [28_Career_Simulation_Engine.md](file://wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/docs/28_Career_Simulation_Engine.md).*
- FR-31.1: Automated "What if I get X qualification?" simulation outputs
- FR-31.2: Career progression path modeling
- FR-31.3: Interactive cohort matching logic

### FR-32: Employer Accountability Layer
*Managed by Agent 16 (Employer Accountability Agent). For detailed specs refer to [30_Employer_Accountability_Layer.md](file://wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/docs/30_Employer_Accountability_Layer.md).*
- FR-32.1: Automated verified placement scoring model
- FR-32.2: Publicly displayed employer accountability grade maps (A/B/C/D/F)

### FR-33: Collective Intelligence Layer
*Managed by Agent 17 (Collective Intelligence Agent). For detailed specs refer to [32_Collective_Intelligence_Layer.md](file://wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/docs/32_Collective_Intelligence_Layer.md).*
- FR-33.1: Live worker profile cohort analysis
- FR-33.2: "Workers like you" salary and placement outcome metrics

### FR-34: Micro-Credential System
*Platform-native Badging framework. For detailed specs refer to [31_Micro_Credential_System.md](file://wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/docs/31_Micro_Credential_System.md).*
- FR-34.1: Auto-issuance of platform-native verified badging
- FR-34.2: QR-code verifiable public credential endpoints

### FR-35: ATS Adapter Architecture
*Autonomous form submitters. For detailed specs refer to [29_ATS_Adapter_Strategy.md](file://wsl.localhost/Ubuntu/home/lx_singw/projects/skilved/docs/29_ATS_Adapter_Strategy.md).*
- FR-35.1: SuccessFactors, Taleo, PageUp, and SETA crawler adapters
- FR-35.2: CapSolver/2captcha CAPTCHA bypass execution

### FR-36: Document Vault
**Priority:** P0 — Must ship Sprint 2 (before Application Agent goes live)

| Requirement | Detail |
|---|---|
| FR-36.1 | Document Vault stores encrypted files in Cloud Storage (CMEK) — NEVER in Firestore or logs |
| FR-36.2 | Firestore stores document metadata only: type, upload date, verification status, storage path reference |
| FR-36.3 | Documents served ONLY via signed URLs with 15-minute expiry — never directly |
| FR-36.4 | Every document access logged to `security_events` BigQuery table |
| FR-36.5 | Separate Cloud Storage bucket for high-sensitivity documents (ID, passports): `skilved-identity` |
| FR-36.6 | Supported document types: SA ID, passport, TVET certificates, diplomas, degrees, trade test certificates, driver's licence, PrDP, OHAS cert, First Aid cert, Wireman's Licence, CIDB grading, employment letters, payslips, proof of address |
| FR-36.7 | Upload validation: file type (server-side), max 10MB, malware scan via Cloud DLP |
| FR-36.8 | Document vault section on user profile page showing all uploaded documents with verification status |
| FR-36.9 | Document expiry tracking: alert user 30/7/1 days before document expires (driver's licence, etc.) |
| FR-36.10 | Per-share consent for every document share — user explicitly consents each time |
| FR-36.11 | Share audit trail: who was shared with, when, what purpose, when access expires |
| FR-36.12 | Right to deletion: all documents deleted from Cloud Storage within 24h of account deletion request |
| FR-36.13 | ID numbers encrypted via Cloud KMS before any storage — NEVER stored in plaintext |
| FR-36.14 | Documents added to vault from Application Agent pre-flight responses persist permanently |
| FR-36.15 | Agent 18 (Document Verification) is the only agent with access to document verification flows |

### FR-37: Document Verification Pipeline
**Priority:** P0 — Sprint 2 (SAQA), Sprint 3 (NAMB + photo)

| Requirement | Detail |
|---|---|
| FR-37.1 | SAQA verification live Sprint 2 — all uploaded TVET certificates, diplomas, degrees verified against SAQA API |
| FR-37.2 | SAQA verification: `regqs.saqa.org.za` — free public API, no partnership needed |
| FR-37.3 | NAMB verification live Sprint 3 — trade test certificates verified against NAMB artisan register |
| FR-37.4 | NAMB partnership initiated Sprint 0 (contact this week) |
| FR-37.5 | WhatsApp photo intake Sprint 3: user sends document photo → Cloud Vision type detection → Document AI extraction → confirmation → vault |
| FR-37.6 | Verified documents score higher in passport completeness calculation than self-reported |
| FR-37.7 | Verification status displayed per document: "SAQA Verified ✓" / "NAMB Verified ✓" / "Self-reported" / "Pending" |
| FR-37.8 | MyMzansi verification (Phase 2): replaces all individual verifications with single government-grade verification |
| FR-37.9 | Failed verification notifies user: "We couldn't verify your N3 certificate — check the certificate number and try again" |
| FR-37.10 | Verification results cached in Redis (24h) to avoid repeated API calls for unchanged documents |
| FR-37.11 | `document_verification_events` BigQuery table tracks all verification attempts and results |
| FR-37.12 | `human_approvals_required: 0` in all Document Verification Agent runs |

### FR-38: Pre-Flight Application Check
**Priority:** P0 — Ships with Application Agent (Sprint 3). Non-negotiable.

| Requirement | Detail |
|---|---|
| FR-38.1 | Pre-flight check runs before EVERY Application Agent submission — no exceptions, no bypass |
| FR-38.2 | Pre-flight check queries Agent 18 (cached in Redis TTL 1h, BigQuery fallback) |
| FR-38.3 | Pre-flight checks vault documents against opportunity's `requiredDocuments[]` (from Analyst Agent) |
| FR-38.4 | All required docs present + verified → Application Agent proceeds to form fill |
| FR-38.5 | Missing 1–2 docs → WhatsApp user with specific upload request → hold application for 24h |
| FR-38.6 | Missing many docs → route to manual application — provide pre-filled detail page link |
| FR-38.7 | Application HELD state logged to BigQuery — NOT counted as `human_approvals_required` |
| FR-38.8 | User uploads missing doc via web or WhatsApp photo → vault updated → pre-flight re-run → submission resumes |
| FR-38.9 | Certified copy required: flag to user, offer "hold until certified" or "apply noting limitation" |
| FR-38.10 | Opportunity deadline check: if deadline < 48h and docs missing, notify urgently + recommend manual |
| FR-38.11 | Pre-flight result: `{canAutoSubmit, missingDocuments, unverifiedDocuments, certifiedCopyRequired, requiresAccountCreation, captchaSolverAvailable, platformReady, recommendation}` |
| FR-38.12 | `pre_flight_passed` field logged on every application submission in BigQuery |
| FR-38.13 | **BigQuery query `SELECT COUNT(*) FROM applications WHERE pre_flight_passed=false AND initiated_by='application_agent'` MUST always return 0** |
| FR-38.14 | Pre-flight checks `requiresAccountCreation` — if true and no service account exists, HOLD application and notify user: "This employer requires a portal account. We're setting one up for you." |
| FR-38.15 | Pre-flight checks `captchaLikely` — if true and CAPTCHA solver is unavailable (quota exhausted, service down), HOLD application and log `captcha_solver_unavailable` to BigQuery |
| FR-38.16 | Extended pre-flight check evaluates platform readiness |
| FR-38.17 | If portal account creation is required and service account is available, proceed with account provisioning |
| FR-38.18 | If rate limits or duplicate registrations block the service account flow, automatically trigger manual fallback |

### FR-39: Review Before Submit
**Priority:** P0 — Ships with Application Agent (Sprint 3). Required at Level 3.

| Requirement | Detail |
|---|---|
| FR-39.1 | After form-filling and before final submit, Application Agent takes screenshot of completed form |
| FR-39.2 | Agent compiles review package: what was filled in, documents attached (with verification status) |
| FR-39.3 | WhatsApp review message sent to user: form details + document list + YES/EDIT/CANCEL options |
| FR-39.4 | Level 3: ALWAYS waits for YES before submitting — application held until confirmation |
| FR-39.5 | Level 3: If no reply within 24h → application cancelled, user notified |
| FR-39.6 | Level 4: User can configure auto-submit after N hours (default: submit after 4h silence) |
| FR-39.7 | User replies EDIT → Customer Success Agent guides correction → re-fill → new review message |
| FR-39.8 | User replies CANCEL → application cancelled, opportunity still visible for manual apply |
| FR-39.9 | `review_confirmed` field in BigQuery: true (user replied YES), false (auto-submitted L4), null (pending) |
| FR-39.10 | Review message format: "Your [Org] application is ready ✓\n\n[Form details]\n\nDocuments: CV ✓ Cover Letter ✓ ID ✓ (verified) N3 ✓ (SAQA)\n\nReply YES to submit / EDIT / CANCEL" |
| FR-39.11 | Screenshot stored in `skilved-screenshots` bucket for 90 days (user audit trail) |
| FR-39.12 | Review step cannot be skipped at Level 3 — it is architecturally required |

### FR-40: Multiple Ingestion Paths
**Priority:** P0 — Sprint 2

| Requirement | Detail |
|---|---|
| FR-40.1 | Onboarding screen presents 4 paths: "Upload your CV", "Scan your certificates", "Type it yourself", "LinkedIn (coming soon)" |
| FR-40.2 | CV upload (Path A, primary): PDF or Word → Document AI full extraction → Skills Profile Agent structures → review screen → user confirms → passport populated |
| FR-40.3 | CV upload populates: trade, qualifications, work history, certificates, contact details — one upload fills 80% of passport |
| FR-40.4 | Certificate/document upload (Path B): individual document → Document AI → vault + SAQA/NAMB verification triggered |
| FR-40.5 | Manual form (Path C, existing): 5-step form — kept as fallback, no longer primary |
| FR-40.6 | WhatsApp photo intake (Path B variant, Sprint 3): send photo to Skilved WhatsApp → Cloud Vision → Document AI → confirmation → vault |
| FR-40.7 | CV review screen: show extracted data before confirming — "Here's what I found in your CV. Confirm or edit." |
| FR-40.8 | LinkedIn import (Path D, Phase 2): OAuth import → Skills Profile Agent maps to SA trades context |
| FR-40.9 | Voice note (Phase 2): WhatsApp voice note → transcription → Skills Profile Agent |
| FR-40.10 | All paths produce identical passport data structure — path is implementation detail |
| FR-40.11 | Document AI processor configured for: SA CVs, SA TVET certificates, SA ID documents, trade test certificates |
| FR-40.12 | Users can mix paths — upload CV AND add individual certificates AND type additional info |

### FR-41: MyMzansi Integration
**Priority:** P2 (Phase 2) — begin relationship Sprint 0

| Requirement | Detail |
|---|---|
| FR-41.1 | "Sign in with MyMzansi" displayed on login screen as "coming soon" from Sprint 1 |
| FR-41.2 | Phase 2: Full MyMzansi OAuth flow — citizen authenticates with government identity |
| FR-41.3 | Phase 2: Credentials wallet read — pull verified qualifications, licences from MyMzansi |
| FR-41.4 | Phase 2: MyMzansi-verified documents = certified copy equivalent for all government/SETA purposes |
| FR-41.5 | Phase 2: "Skilved Verified: MyMzansi" badge on passport — highest trust level |
| FR-41.6 | Phase 2: Data Processor Agreement with DPSA required before any MyMzansi data flows |
| FR-41.7 | Phase 3: Stipend disbursement via MyMzansi payments rail for learnership administration |
| FR-41.8 | Phase 3: UIF records pull — government-confirmed employment history |
| FR-41.9 | Phase 2: "Skilved as OAuth provider" — other platforms offer "Sign in with Skilved" |
| FR-41.10 | Begin MyMzansi developer program relationship Sprint 0 (this week) |
| FR-41.11 | POPIA Data Processor Agreement negotiation begins Month 1 |

### FR-42: Scope Expansion
**Priority:** P1 for narrative, P3 for technical implementation

| Requirement | Detail |
|---|---|
| FR-42.1 | All product copy updated: "starting with trades, expanding to all qualification levels" |
| FR-42.2 | 3 aggregator portal sources (PuffAndPass, RecentJobs, StudentRoom) as primary Scout Agent sources in Sprint 1 — SETA portal crawlers and 50 TVET college crawlers deferred to Sprint 2+ |
| FR-42.3 | TVET college opportunity types (`tvet_short_course`, `tvet_partnership`, `tvet_placement_agreement`) added in Phase 2 |
| FR-42.4 | `TradeCategory` type extended to include `healthcare`, `education`, `finance`, `other_professional` in Phase 2 |
| FR-42.5 | `OpportunityType` extended with `graduate_programme`, `internship`, `skills_programme` in Phase 2 |
| FR-42.6 | Skills Passport NQF framework already covers all qualification levels — no schema change needed |
| FR-42.7 | Agent 19 (Scope Expansion) monitors opportunity distribution gaps weekly from Sprint 4 |
| FR-42.8 | Agent 19 proposes new opportunity sources — engineering reviews before implementation |
| FR-42.9 | University sources (USAf, NSFAS, corporate CSI) added Phase 2 |
| FR-42.10 | Brand narrative updated everywhere: "from matric to PhD, from first apprenticeship to senior artisan" |

---

## Non-Functional Requirements

### NFR-01: Performance
- Feed initial load: < 1.5 seconds on 4G mobile (South Africa average)
- Feed filter update: < 300ms
- Opportunity detail load: < 1 second
- Agent discovery cycle: complete within 45 minutes
- 99.5% uptime target
- Document upload: < 5 seconds processing after upload
- SAQA verification: < 10 seconds (API call + update)
- Pre-flight check: < 100ms (Redis cached), < 2s (BigQuery fallback)
- Review-before-submit WhatsApp: < 30 seconds after form fill
- Screenshot generation: < 5 seconds

### NFR-02: Mobile First
- All features fully functional on 375px viewport
- Touch targets minimum 44px
- No horizontal scroll on any page
- Offline graceful degradation (cached last feed state)
- PWA installable on Android and iOS

### NFR-03: Accessibility
- WCAG 2.1 AA compliance
- Screen reader compatible
- All images have alt text
- Colour contrast ratio minimum 4.5:1
- No reliance on colour alone for status communication

### NFR-04: Privacy & Data (POPIA)
- POPIA compliant from day one
- Anonymised session IDs for non-authenticated users
- No personal data in analytics without consent
- Data retention policy documented
- Right to deletion honoured within 72 hours
- Cookie consent banner (minimal, not dark-pattern)

### NFR-05: General Security
- All API endpoints authenticated
- Rate limiting on all public endpoints
- Input sanitisation on all user-submitted fields
- No PII logged in error logs
- Secrets management via GCP Secret Manager

### NFR-06: Document Security
- Documents stored ONLY in Cloud Storage with CMEK
- Zero document content in any log (Cloud DLP enforced)
- Zero document content in any AI prompt
- Signed URLs only, 15-minute expiry
- ID numbers encrypted via Cloud KMS, never plaintext
- Every document access logged to `security_events`
- Security audit completed before Document Vault goes live
- Cyber insurance in place before Document Vault goes live

---

## Analytics & Event Tracking

Every event tracked to BigQuery from day one. This is the graph.

### Core Events
- `feed_view`: session_id, trade_filter, province_filter, sort_order
- `opportunity_view`: session_id, opportunity_id, source, trade, province
- `apply_click`: session_id, opportunity_id, opportunity_type, method (manual/agent)
- `apply_complete`: session_id, opportunity_id, method, agent_level
- `agent_apply_started`: user_id, opportunity_id, permission_level, match_score
- `agent_apply_success`: user_id, opportunity_id, reference_number, method
- `agent_apply_failed`: user_id, opportunity_id, failure_reason
- `share`: session_id, opportunity_id, channel, initiated_by (user/agent)
- `signup_prompt_shown`: session_id, trigger_type
- `signup_prompt_dismissed`: session_id
- `signup_complete`: user_id, method, trade, province
- `profile_updated`: user_id, field_updated, completion_pct
- `permission_level_set`: user_id, old_level, new_level, consent_captured
- `career_plan_generated`: user_id, target_role, steps_count, timeline_months
- `career_plan_viewed`: user_id
- `career_step_completed`: user_id, step_type, unlocked_opportunities
- `outcome_reported`: user_id, opportunity_id, outcome_type, reported_by (user/agent)
- `digest_sent`: user_id, opportunity_count, new_since_last
- `digest_opened`: user_id, opportunity_clicked
- `upgrade_prompt_sent`: user_id, trigger_type, message_variant, price_shown
- `upgrade_prompt_converted`: user_id, old_plan, new_plan, revenue
- `revenue_decision`: user_id, trigger, action, confidence, human_approval (always 0)
- `growth_content_created`: content_type, trade_focus, channel
- `growth_content_published`: content_id, channel, reach
- `ambassador_invited`: user_id, share_count, trade
- `referral_converted`: referrer_id, new_user_id, channel
- `cs_query_received`: user_id, query_type, channel
- `cs_query_resolved`: user_id, resolution_type (agent/human), response_time_seconds
- `cs_escalated`: user_id, query_type, reason
- `agent_run`: agent_name, run_id, start_time, end_time, decisions_made, human_approvals_required

### Document Vault & Pipeline Events (NEW v5.0)
- `document_uploaded`: user_id, document_type, file_size, verification_triggered
- `document_verified`: user_id, document_type, verification_source, result
- `document_verification_failed`: user_id, document_type, failure_reason
- `document_shared`: user_id, document_type, shared_with_type, consent_id
- `preflight_check_run`: user_id, opportunity_id, result, missing_count
- `preflight_hold_created`: user_id, opportunity_id, missing_documents
- `preflight_hold_resolved`: user_id, opportunity_id, resolution_method
- `review_before_submit_sent`: user_id, opportunity_id, ats_platform
- `review_before_submit_confirmed`: user_id, opportunity_id, response_time_minutes
- `review_before_submit_edited`: user_id, opportunity_id
- `review_before_submit_cancelled`: user_id, opportunity_id
- `cv_uploaded`: user_id, file_size, fields_extracted_count
- `cv_review_confirmed`: user_id, fields_accepted, fields_edited
- `whatsapp_photo_document`: user_id, document_type_detected, verification_triggered
- `document_expiry_alert_sent`: user_id, document_type, days_until_expiry
- `incomplete_application_prevented`: user_id, opportunity_id, missing_documents

---

## Acceptance Criteria — Launch Gates

### Gate 1: Feed Live (End of Week 2)
- [ ] Feed loads in < 1.5s on mobile (Samsung Galaxy A52, SA 4G)
- [ ] Minimum 200 real opportunities displayed
- [ ] All 12 trade category filters working
- [ ] All 9 province filters working
- [ ] Freshness badge "Found X hours ago" on every card
- [ ] Full detail view accessible without login
- [ ] Apply button works (external redirect or in-app form)
- [ ] WhatsApp share working
- [ ] Scout + Analyst agents running on schedule
- [ ] BigQuery event pipeline live
- [ ] `human_approvals_required: 0` in all agent runs
- [ ] TVET college opportunities appearing in feed
- [ ] `requiredDocuments[]` extracted for every opportunity
- [ ] ATS platform detected on every opportunity

### Gate 2: Passport + Document Vault (End of Week 4)
- [ ] Account creation flow < 60 seconds
- [ ] Personalised feed live for logged-in users
- [ ] Match explanation shown per card
- [ ] **Career Agent live — career plan generated on profile completion**
- [ ] Career plan displayed on profile + delivered via WhatsApp
- [ ] Customer Success Agent onboarding sequence firing (Day 0, 1, 3)
- [ ] WhatsApp digest sending correctly
- [ ] Soft signup triggers working (no dark patterns)
- [ ] Profile public URL accessible and shareable
- [ ] Permission Level 1 + 2 selectable in UI
- [ ] CV upload populates passport from PDF
- [ ] Document vault section on profile page
- [ ] SAQA verification live and verifying certificates
- [ ] Agent 18 running autonomously
- [ ] `document_verification_events` BigQuery table flowing

### Gate 3: Application Agent + Pre-flight (End of Week 6)
- [ ] **Application Agent v1 live (email applications)**
- [ ] Permission Level 3 (semi-auto, ≥85% match) live and working
- [ ] Worker Premium subscription billing live (R200/month)
- [ ] "Apply for me" button live on opportunity cards for Level 3+ users
- [ ] Agent-submitted applications logged to BigQuery
- [ ] WhatsApp confirmation sent on successful submission
- [ ] Application history tab shows manual + agent submissions
- [ ] Revenue Agent firing upgrade prompts
- [ ] Outcome tracking live (Day 3 follow-up)
- [ ] 1,000+ registered users
- [ ] Pre-flight check running before every Application Agent submission
- [ ] `SELECT COUNT(*) FROM applications WHERE pre_flight_passed=false AND initiated_by='application_agent'` returns 0
- [ ] Review-before-submit WhatsApp flow working end-to-end
- [ ] NAMB verification live
- [ ] WhatsApp photo → vault → verification pipeline working
- [ ] Application Agent using SuccessFactors adapter

### Gate 4: Full Autonomy & XPRIZE (End of Week 8)
- [ ] All 12 baseline agents running autonomously
- [ ] Application Agent v2 (web form + Playwright)
- [ ] Permission Level 4 (full-auto) available
- [ ] Growth Agent publishing daily content autonomously
- [ ] Revenue Agent A/B experiments running
- [ ] Customer Success Agent resolving 95%+ of queries without escalation
- [ ] Agent autonomy dashboard built (BigQuery view, `human_approvals_required = 0`)
- [ ] 5,000+ registered users
- [ ] 200+ Premium subscribers (Level 3 or 4)
- [ ] 50+ paying employers / SETAs
- [ ] R300,000+ documented revenue
- [ ] 200+ outcomes in graph
- [ ] Zero human approvals in any agent run (verifiable in BigQuery)
- [ ] Hybrid model progression data: % of users at each Level
- [ ] Demo video scripted and recorded
- [ ] Submission narrative complete
- [ ] Zero incomplete applications in 8-week BigQuery view (confirmed by query)
- [ ] 200+ documents verified via SAQA
- [ ] Document vault with 3,000+ documents from 5,000+ users
- [ ] Agent 18 fully autonomous (expiry alerts, enrichment nudges)

---

## Open Questions

| # | Question | Owner | Deadline |
|---|---|---|---|
| OQ-1 | WhatsApp Business API: Meta direct or Twilio fallback? | Engineering | Week 1 |
| OQ-2 | Application Agent: which opportunity types are email vs web form? | Engineering | Week 4 |
| OQ-3 | Employer referral fee pricing: R500, R1,000, or R2,000 per placement? | Growth | Week 1 |
| OQ-4 | Username format: auto-generated or user-chosen? | Design | Week 2 |
| OQ-5 | Language: English only at launch or add isiZulu immediately? | Product | Week 1 |
| OQ-6 | Anonymous data retention period: 30, 60, or 90 days? | Legal | Week 1 |
| OQ-7 | Application Agent minimum match threshold for Level 4: 60%, 70%, or 80%? | Product | Week 4 |
| OQ-8 | Playwright approach: self-hosted or cloud browser service (Browserless.io)? | Engineering | Week 4 |
| OQ-9 | CV format: PDF only or Word + PDF? | Product | Week 5 |
| OQ-10 | Level 3/4 consent: one-time capture or per-session reconfirmation? | Legal | Week 3 |
| OQ-19 | Document Vault: should documents uploaded for one application automatically be available for future applications, or require per-application consent? | Legal | Week 2 |
| OQ-20 | Pre-flight check: should Skilved tell users the SPECIFIC documents each employer requires, or a general "this application typically needs" message? | Product | Week 3 |
| OQ-21 | NAMB integration: partnership agreement needed or can we scrape public verification page for MVP? | Legal | Week 1 |
| OQ-22 | Certified copy requirement: show as blocker or optional warning? | Product | Week 3 |
| OQ-23 | Document retention after account closure: 24h deletion or longer for legal compliance? | Legal | Week 2 |
| OQ-24 | WhatsApp photo intake: what do we do if document photo is too blurry to read? | Product/Engineering | Week 3 |
| OQ-25 | Scope expansion: should the MVP onboarding explicitly say "starting with trades, expanding to all"? | Product | Week 1 |
| OQ-26 | MyMzansi developer sandbox: apply this week — who owns this relationship? | Founder | Week 0 |

---

## Change Log

### v5.1 — June 2026
- Unified `02_PRD.md` and `02_PRD_2.md` into a single canonical file.
- Added FR-38.14–38.18: Pre-flight platform readiness checks (requiresAccountCreation, captchaLikely, service account availability).
- Added FR-12.25–12.27: Email + portal registration hybrid flow, email validation before send.
- Extended FR-38.11 pre-flight result shape with `requiresAccountCreation`, `captchaSolverAvailable`, `platformReady`.

### v5.0 — June 2026
- Added FR-36: Document Vault (15 requirements)
- Added FR-37: Document Verification Pipeline (12 requirements)
- Added FR-38: Pre-Flight Application Check (13 requirements — includes "always returns 0" verification query)
- Added FR-39: Review Before Submit (12 requirements)
- Added FR-40: Multiple Ingestion Paths (12 requirements)
- Added FR-41: MyMzansi Integration (11 requirements)
- Added FR-42: Scope Expansion (10 requirements)
- Updated FR-12 (Application Agent) with 10 new requirements (FR-12.15 through FR-12.24)
- Updated FR-02 (Opportunity Detail) with document requirements checklist
- Added Personas 6 and 7
- Added NFR-06: Document Security
- Added 18 new analytics events
- Updated all 4 acceptance gates
- Added OQ-19 through OQ-26

### v4.0 — June 2026
- Added FR-30 through FR-35.

### v1.0 — June 2026
- Initial requirements document for Skilved MVP.
