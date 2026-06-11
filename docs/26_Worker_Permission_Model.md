# Skilved — Worker Permission Model
### Level 1–4 Autonomy Architecture | UX Flows | POPIA Consent | XPRIZE Presentation
### Version 1.0 | June 2026

---

## Why This Document Exists

The permission model is the architectural decision that makes Skilved both legally compliant and genuinely AI-native. It is not a compromise between full autonomy and user control — it is the design that makes full autonomy achievable at population scale.

Most XPRIZE teams will build full autonomy for a narrow demo. Skilved builds a trust escalation model that starts with 60 million South Africans and lets autonomy grow as trust compounds. That is a fundamentally stronger story for judges and a fundamentally better product for users.

**This document is the single source of truth for:**
- What each permission level unlocks
- How the UX presents and captures each level
- How POPIA consent is structured at each level
- How the hybrid model creates virality and better Day 30 metrics
- How the model is presented to XPRIZE judges

---

## The Core Insight: The Hybrid IS the Strategy

The electric car analogy that frames this document:

> Toyota did not launch a fully autonomous vehicle. They launched a car that drove itself on the highway but handed control back in complex situations. Users learned to trust it incrementally. Autonomy expanded as trust compounded. Full autonomy was the destination — not the starting point.

Skilved's permission model follows the same logic:

- **Level 1 (Notify):** The agent finds and shows. The human decides everything.
- **Level 2 (Assist):** The agent finds, analyses, and drafts. The human submits.
- **Level 3 (Semi-auto):** The agent applies autonomously to high-confidence matches. The human sets the threshold once.
- **Level 4 (Full-auto):** The agent manages the entire opportunity pipeline. The human sets direction once and reviews outcomes.

Users do not start at Level 4. They earn Level 4 by seeing Level 1, 2, and 3 produce results. By the time they grant Level 4 permission, they have already experienced Skilved working for them. The trust is real, earned, and permanent.

---

## The Viral Mechanics of Hybrid

This is the insight that most product teams miss: **the hybrid model creates more virality than full autonomy alone.**

### Level 1 virality — the human share
At Level 1, a user finds a genuinely great opportunity and shares it to their trade WhatsApp group because they want to tell someone. This is organic, human, authentic distribution. The message reads:

> "Guys I found this R5,400/month electrical apprenticeship in Joburg on Skilved — closes Friday, apply quick"

47 people click. 12 create accounts. 3 of them find opportunities and share again. This is how Skilved spreads in the first 30 days — through the honest excitement of Level 1 users who found something real.

### Level 3/4 virality — the agent share
At Level 4, the Growth Agent identifies when an opportunity is worth sharing and does it automatically on the user's behalf (with permission). The user wakes up to see their group received a Skilved share overnight. This creates a different kind of trust signal:

> "Wait — Skilved shared this on my behalf and it's actually good?"

That surprise and delight is the moment users recommend Skilved to friends. "It just works while you sleep" is a better word-of-mouth story than "it helps me search."

### Both levels contribute to Day 30 metrics
Level 1 and 2 users have dramatically lower activation friction. They create accounts more readily because they're not being asked to give up control — they're being asked to get better matches. This means:

- More accounts created in the first 30 days
- More events in BigQuery (more graph data)
- Higher Day 7 and Day 30 retention (because the product is useful even before Agent trust is built)
- Better XPRIZE metrics at submission time

**The Level 1 user is not a lesser user. They are the seed of a Level 4 user, and they produce real engagement data that makes every agent smarter.**

---

## The Four Levels — Detailed Specification

### Level 1: Notify
*"Find for me. I'll decide."*

**What the agent does:**
- Scout discovers opportunities continuously
- Matching ranks them for the user's profile
- Career Agent generates a career plan
- Daily digest sent at 7am with top 3–5 new matches
- Customer Success Agent handles onboarding and support

**What the user does:**
- Views opportunities
- Clicks into details
- Applies manually (external link or in-app form)
- Shares manually

**Permission captured:**
- Account creation consent (name, trade, province, WhatsApp optional)
- Notification consent (if WhatsApp provided): "I agree to receive daily opportunity digests from Skilved. I can stop anytime by replying STOP."

**POPIA compliance:**
- Data collection: name, trade, province, qualification (minimal, necessary for service)
- WhatsApp number: separate, explicit, revocable consent
- No automatic action on user's behalf
- Basis for processing: consent + legitimate interest

**UX trigger from anonymous:**
> "Skilved's agent found 47 more electrical opportunities in Gauteng this week. Want it to find yours every morning? Takes 60 seconds."

---

### Level 2: Assist
*"Find and prepare for me. I'll review and submit."*

**What the agent does:**
Everything in Level 1, plus:
- Application Agent generates tailored CV on demand
- Application Agent writes specific cover letter on demand
- Documents presented to user for review before submission
- "Your application is ready — review and submit?" prompt via WhatsApp

**What the user does:**
- Reviews agent-prepared CV and cover letter
- Edits if desired
- Submits manually (one tap from WhatsApp or web)

**Permission captured:**
- Level 1 consent, plus:
- "Allow Skilved to prepare job application documents on my behalf for opportunities I select."
- Document storage consent: "Skilved may store my profile data to generate application documents."

**POPIA compliance:**
- Explicit consent for document generation using personal data
- User reviews before any submission — no autonomous action
- All generated documents stored encrypted in Firestore
- User can delete at any time

**UX trigger from Level 1:**
Appears after user has applied manually 2+ times:
> "You've applied to 3 opportunities this week. Skilved could have prepared tailored CVs for all of them automatically. Want me to handle the paperwork from now on? You still submit — I just do the hard part."

---

### Level 3: Semi-auto
*"Apply for me when you're confident. I'll review outcomes."*

**What the agent does:**
Everything in Level 1 + 2, plus:
- Application Agent autonomously applies to all opportunities with match score ≥ 85%
- User receives WhatsApp confirmation after each submission: "Applied to [Org] ✓ Ref: [REF]"
- For matches 60–84%: prompts user "This is a 78% match — should I apply?"
- For matches < 60%: does not apply, shows in feed only
- Revenue Agent manages subscription and upgrade decisions

**What the user does:**
- Sets Level 3 once
- Reviews WhatsApp confirmations
- Responds to below-threshold prompts
- Reviews weekly summary: "This week, Skilved applied to 4 opportunities on your behalf"

**Permission captured:**
This is the first level that requires explicit, informed, specific consent under POPIA. Cannot be captured via a generic T&C checkbox.

**Consent flow (see UX Flow section below):**
1. User taps "Upgrade to Level 3 (Semi-auto)"
2. Full-screen consent modal:
   - What this means: "Skilved will submit job applications on your behalf when your match score is 85% or higher. You will be notified after each application."
   - What data is used: "Your profile, qualifications, and career goals will be used to generate tailored CVs and cover letters."
   - What you control: "You can pause, reduce to Level 2, or cancel at any time. Your data is never shared with third parties without your consent."
   - Specific tick: "I consent to Skilved submitting job applications on my behalf for opportunities with a match score of 85% or higher."
3. User must actively tick (no pre-checked boxes)
4. Consent timestamped and stored to Firestore `consents` collection
5. Consent version tracked (if permission model changes, re-consent required)

**POPIA compliance:**
- Basis: explicit consent (Section 11(1)(a))
- Specific: tied to a specific match threshold, specific action (application submission)
- Informed: full modal explanation of what agent does, what data is used
- Revocable: instant level reduction via one tap in settings or WhatsApp reply "PAUSE"
- Audit trail: every agent application logged to BigQuery with consent_version reference
- POPIA Section 72 consideration: no automated decision-making that produces legal effects — application submission is advisory/facilitative, not a hiring decision

**UX trigger from Level 2:**
After user has used Level 2 (reviewed + submitted manually) for 5+ applications:
> "You've submitted 5 applications using Skilved's documents. Want me to handle the submission too? I'll only apply when your match score is 85% or higher. You get a WhatsApp message every time I apply."

---

### Level 4: Full-auto
*"Manage my opportunities completely. I'll set direction once."*

**What the agent does:**
Everything in Level 1 + 2 + 3, plus:
- Application Agent applies to all opportunities above minimum threshold (user-set, default 70%)
- No threshold prompts — fully autonomous within the set parameters
- Growth Agent shares opportunities on user's behalf when score ≥ 90%
- Revenue Agent manages user's subscription tier proactively
- Career Agent proactively updates career plan and suggests new directions
- Outcome Tracker fully automated — agent follows up and updates graph without user input
- Weekly summary: "This week: Skilved applied to 8 opportunities, shared 2, updated your career plan"

**What the user does:**
- Sets Level 4 once and sets minimum match threshold (70% default)
- Reviews weekly summary
- Responds to interview invitations that come from agent-submitted applications

**Permission captured:**
Highest level of consent. Full-screen consent flow with three separate explicit confirmations:

1. **Application consent:** "I consent to Skilved submitting job applications on my behalf for all opportunities matching my minimum threshold of [user-set]%."
2. **Sharing consent:** "I consent to Skilved sharing relevant opportunities to my WhatsApp contacts on my behalf when match score exceeds 90%."
3. **Data usage consent:** "I consent to Skilved using my profile, qualifications, career goals, and application history to make autonomous decisions on my behalf."

Each tick is separate. Each has plain-language explanation. No bundling.

**POPIA compliance:**
- Three separate consent captures, separately revocable
- Sharing consent (point 2) is high-sensitivity: explicit notice that messages will be sent from user's WhatsApp
- Full audit trail in BigQuery: every autonomous decision, every action taken, every consent version used
- Automated decision-making notice: required under POPIA Section 71 — user must be informed that decisions are automated and have the right to request human review
- Right to object: user can object to any specific agent action within 48 hours via WhatsApp reply

**UX trigger from Level 3:**
After user has received 10+ agent-submitted application confirmations at Level 3:
> "In the past 3 weeks, Skilved applied to 10 opportunities while you slept. Want to take it further? Level 4 means I manage your entire opportunity pipeline. You set the direction — I do the rest."

---

## UX Flows

### Flow 1: Anonymous → Level 1 (Account Creation)

```
User browsing anonymous feed
  ↓
Views 3 opportunities in one session
  ↓
Soft prompt appears (bottom of screen, dismissible):
  "Skilved found 47 more electrical opportunities this week.
   Get your free profile to see what matches you. 60 seconds."
  [Get Skilved] [Not now]
  ↓
[Get Skilved] tapped
  ↓
Step 1: Trade selector (visual grid, 12 trades)
Step 2: Province selector (9 provinces)
Step 3: Qualification level (dropdown)
  ↓
"Your profile is set. 23 opportunities match you right now."
  ↓
Optional: "Get daily matches on WhatsApp?" [Yes] [Skip]
  If yes → WhatsApp number input → explicit consent tick → OTP verify
  ↓
Level 1 active. Feed now personalised.
Career Agent begins generating career plan in background.
  ↓
5 minutes later: WhatsApp message (if provided):
  "Hi [Name] 👋 I've found your career path.
   You're 18 months from being trade-tested. Here's how:
   [Career plan link]"
```

---

### Flow 2: Level 1 → Level 2 (Assist Unlock)

```
Trigger: User has applied manually 2+ times in 7 days
  ↓
WhatsApp message from Skilved:
  "You've applied to 3 opportunities this week 💪
   Want Skilved to prepare tailored CVs and cover letters?
   You still click submit — I just do the hard part.
   Reply YES to activate."
  ↓
User replies "YES" (or taps link to /permissions page)
  ↓
/permissions page → Level 2 card highlighted
  ↓
Consent modal:
  "What Skilved will do: Prepare CVs and cover letters using your profile.
   What you control: You review and submit every application.
   Your data: Stored encrypted. Deleted on request.
   [I agree — activate Level 2] [Not yet]"
  ↓
Consent captured → Firestore consents collection
Level 2 active
  ↓
Immediate confirmation via WhatsApp:
  "Level 2 active ✓ Next time you tap View on an opportunity,
   your application will be ready to review. I'll let you know."
```

---

### Flow 3: Level 2 → Level 3 (Semi-auto Unlock)

```
Trigger: User has submitted 5+ Level 2 applications
  ↓
WhatsApp message:
  "You've submitted 5 applications using Skilved documents.
   Want me to submit for you too?
   I'll only apply when your match score is 85% or higher.
   You get a WhatsApp message every time I apply.
   [See Level 3] [Not yet]"
  ↓
User taps [See Level 3] → /permissions page
  ↓
Level 3 card fully explained:
  - What 85% match means (explained in plain language)
  - Example: "I would apply to 2 of your current 12 matched opportunities"
  - "You are always in control — pause anytime"
  ↓
Consent modal (cannot be scrolled past — must be read):
  Section 1: What the agent will do
  Section 2: What data is used
  Section 3: How to pause or cancel
  Single tick: "I consent to Skilved submitting applications on my behalf
                for opportunities with match score ≥ 85%"
  [Activate Level 3] [Cancel]
  ↓
Consent captured with: timestamp, consent_version, match_threshold, user_id
Level 3 active
  ↓
Immediate WhatsApp:
  "Level 3 active ✓ I found 2 opportunities above 85% for you right now.
   Applying to both. You'll hear from me in a few minutes."
  ↓
Application Agent fires for both opportunities
  ↓
WhatsApp for each submission:
  "Applied ✓ Electrical Apprenticeship — Eskom Holdings
   Reference: ESK-2026-4471
   Reply PAUSE to stop automatic applications."
```

---

### Flow 4: Level 3 → Level 4 (Full-auto Unlock)

```
Trigger: User has received 10+ Level 3 application confirmations
  ↓
Weekly summary WhatsApp (sent every Sunday):
  "Your Skilved week:
   ✓ 8 applications submitted
   ✓ 2 interviews booked
   ✓ Career plan updated
   Want to go fully autonomous? Level 4 means I manage
   your entire opportunity pipeline. [Learn more]"
  ↓
User taps [Learn more] → /permissions page
  ↓
Level 4 consent flow (3 separate screens):

Screen 1 — Application consent:
  "Skilved will apply to opportunities above your minimum threshold.
   Default: 70%. You can change this anytime.
   [I consent to autonomous applications] ☐"

Screen 2 — Sharing consent:
  "Skilved may share high-scoring opportunities to your WhatsApp
   contacts on your behalf (only when match ≥ 90%).
   [I consent to automated sharing] ☐"

Screen 3 — Data usage consent:
  "Skilved will use your profile, history, and outcomes to make
   autonomous decisions continuously on your behalf.
   [I consent to autonomous data-driven decisions] ☐"

All 3 must be ticked. Each is independently revocable.
[Activate Level 4] only enabled when all 3 ticked.
  ↓
Consents captured: 3 rows in Firestore consents collection
Level 4 active
  ↓
WhatsApp:
  "Level 4 active ✓ Skilved is now your full opportunity manager.
   I'll apply, track, and update your career plan — while you focus
   on interviews and your trade.
   
   Your settings: Apply to ≥70% matches.
   Reply SETTINGS to adjust. Reply PAUSE to stop."
```

---

### Flow 5: Downgrade (Any Level → Lower Level)

```
User wants to reduce autonomy
  ↓
Via WhatsApp: reply "PAUSE" or "LEVEL 2" etc.
OR
Via /permissions page: tap desired lower level
  ↓
Confirmation:
  "Reducing to Level [X]. Any pending agent actions will complete.
   New applications will need your approval from now on.
   [Confirm] [Cancel]"
  ↓
Level updated immediately
Consent record: updated with downgrade timestamp
BigQuery event: permission_level_set (old_level, new_level)
  ↓
WhatsApp confirmation:
  "Done. You're now at Level [X].
   I'll still find and match opportunities — you're back in control."
```

---

## The Permissions Page (/permissions)

The `/permissions` page is the single place users understand, set, and change their autonomy level. It must be:

1. **Accessible from profile** — one tap from any profile view
2. **Accessible from WhatsApp** — "Reply SETTINGS" link in every digest
3. **Clear, not overwhelming** — each level explained in 2 sentences max
4. **Non-manipulative** — no dark patterns pressuring upgrade, no urgency language
5. **Always showing current level** — user never confused about what's active

### Page Layout

```
┌─────────────────────────────────────┐
│ Your Skilved agent settings         │
│ Current: Level 2 (Assist) ✓         │
├─────────────────────────────────────┤
│                                     │
│ [1] Notify                          │
│ Agent finds. You decide.            │
│ Free                                │
│                                     │
│ [2] Assist ← CURRENT               │
│ Agent prepares. You submit.         │
│ Free                                │
│                                     │
│ [3] Semi-auto                       │
│ Agent applies to ≥85% matches.      │
│ You get WhatsApp for each.          │
│ Premium — R200/month                │
│ [Activate Level 3]                  │
│                                     │
│ [4] Full-auto                       │
│ Agent manages everything.           │
│ You set direction. Agent works.     │
│ Premium+ — R500/month               │
│ [Activate Level 4]                  │
│                                     │
│ [Pause all agent actions]           │
│ [View consent history]              │
│ [Delete my data]                    │
└─────────────────────────────────────┘
```

---

## POPIA Compliance Architecture

### Consent Store (Firestore)

```typescript
// Collection: consents
interface ConsentRecord {
  id: string;
  userId: string;
  consentType:
    | 'level1_account'
    | 'level1_whatsapp'
    | 'level2_document_generation'
    | 'level3_autonomous_application'
    | 'level4_autonomous_application'
    | 'level4_autonomous_sharing'
    | 'level4_data_decisions';
  consentVersion: string;          // e.g. "v1.2" — tracks which T&C version was shown
  granted: boolean;
  grantedAt?: Timestamp;
  revokedAt?: Timestamp;
  matchThreshold?: number;         // Level 3/4 only: the threshold consented to
  ipAddress: string;               // hashed
  deviceType: string;
  consentText: string;             // exact text the user saw and agreed to
}
```

### What Is Stored When Agent Acts

Every autonomous agent action must reference a valid consent record:

```typescript
// BigQuery: agent_actions table
interface AgentAction {
  action_id: string;
  agent_name: string;
  user_id: string;
  action_type: string;             // 'application_submitted', 'share_sent', etc.
  consent_id: string;              // reference to Firestore consent record
  consent_version: string;
  permission_level: 1 | 2 | 3 | 4;
  match_score?: number;
  human_approvals_required: 0;    // ALWAYS 0
  action_at: Timestamp;
  outcome?: string;
}
```

### Automated Decision-Making Notice (POPIA Section 71)

Under POPIA, users have the right to object to automated decision-making and request human review. Skilved's approach:

- Level 3/4 consent modal includes: "Decisions are made by AI. You have the right to request human review of any agent decision. Contact privacy@skilved.com or reply REVIEW to any agent message."
- Every agent-generated WhatsApp message ends with: "Reply REVIEW to request human review of this action."
- Human review requests are handled within 48 hours (batch review by founder in MVP, dedicated privacy officer in Phase 2)

### Right to Deletion

When a user deletes their account:
- Firestore: all user documents deleted within 72 hours
- BigQuery: PII fields anonymised (user_id replaced with anonymised_id, name/phone deleted)
- Graph data: retained in anonymised form (the outcomes still train the model — they just can't be linked to the individual)
- Consent records: retained for 7 years (legal compliance requirement)
- Agent-submitted applications: Skilved cannot delete from employer systems — notified to user in deletion flow

---

## How the Permission Model Is Presented to XPRIZE Judges

### The Framing (What to Say)

**Weak framing (avoid):**
> "We wanted full autonomy but users need to approve applications for now."

**Strong framing (use this):**
> "Skilved operates on a trust escalation architecture. We believe genuine AI-native operation requires earned trust, not assumed permission. Our four permission levels allow users to experience agent value incrementally and grant more autonomy as that value compounds.
>
> At Day 90, 60% of our active users are at Level 3 or 4 — autonomously applying for opportunities on their behalf. The remaining 40% are at Level 1 or 2, generating real engagement, real outcomes data, and real word-of-mouth. Both groups contribute to the graph.
>
> This is not a limitation. This is the architecture that makes population-scale autonomy legally compliant, genuinely trusted, and virally distributed."

### The Data Story for Judges

Show these metrics in the XPRIZE submission:

| Metric | Target at Day 90 | Why It Matters to Judges |
|---|---|---|
| Users at Level 3 or 4 | 60%+ of active users | Proves AI-native at scale |
| Agent applications submitted | 34/day | Demonstrates autonomous operation |
| Avg days from Level 1 to Level 3 | < 21 days | Shows trust escalation velocity |
| User-initiated downgrades | < 5% | Proves users trust the model |
| Application success rate (Level 3/4) | Higher than manual | Proves agents are better |
| `human_approvals_required` | 0 in all runs | The definitive AI-native proof |

### The One Chart That Wins

A simple bar or line chart showing the distribution of users across Levels 1–4 over time:
- Week 1: 100% at Level 1
- Week 3: 60% Level 1, 35% Level 2, 5% Level 3
- Week 6: 30% Level 1, 30% Level 2, 35% Level 3, 5% Level 4
- Week 12: 20% Level 1, 20% Level 2, 40% Level 3, 20% Level 4

This chart is the trust escalation story visualised. It shows the product working exactly as designed.

### The Live Demo Moment

During the XPRIZE demo:

> "Let me show you what Level 4 looks like in practice. This user, Thabo, activated Level 4 three weeks ago. Since then, without opening Skilved once: his agent applied to 12 opportunities, received 2 interview invitations, shared 4 opportunities to his WhatsApp group on his behalf, and updated his career plan when he passed his N4 exam. He has had one interaction with Skilved in three weeks — he replied 'yes' to an interview confirmation.
>
> That is what AI-native operation looks like when trust has been earned."

---

## Permission Level Summary Table

| | Level 1: Notify | Level 2: Assist | Level 3: Semi-auto | Level 4: Full-auto |
|---|---|---|---|---|
| **Tagline** | Find for me | Prepare for me | Apply for me (85%+) | Manage for me |
| **Price** | Free | Free | R200/month | R500/month |
| **Scout** | ✅ | ✅ | ✅ | ✅ |
| **Matching** | ✅ | ✅ | ✅ | ✅ |
| **Career Agent** | ✅ | ✅ | ✅ | ✅ |
| **CV/Cover Letter** | ❌ | ✅ (draft) | ✅ (submitted) | ✅ (submitted) |
| **Auto-apply** | ❌ | ❌ | ✅ ≥85% | ✅ ≥user threshold |
| **Auto-share** | ❌ | ❌ | ❌ | ✅ ≥90% |
| **Revenue Agent** | ✅ (upgrade prompts) | ✅ | ✅ | ✅ |
| **Growth Agent** | Manual share only | Manual share | Manual share | Agent shares |
| **CS Agent** | ✅ | ✅ | ✅ | ✅ (proactive) |
| **POPIA basis** | Consent + legitimate interest | Explicit consent | Explicit specific consent | 3 separate explicit consents |
| **Revoke** | Delete account | One tap | One tap / "PAUSE" | One tap per consent type |
| **Graph contribution** | Browse + share events | + Document feedback | + Application outcomes | + Full pipeline data |
| **XPRIZE value** | User base + graph seed | Document quality | **Primary autonomy demo** | **Maximum autonomy demo** |

---

*Document version 1.0 — June 2026*
*Owner: Product + Legal*
*This document governs all permission model decisions. Changes require legal review.*
