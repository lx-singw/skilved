# Skilved — AI Employees Architecture
### The 8 Agents That Run the Business | Version 2.0 | June 2026

---

## The Fundamental Reframe

Most teams entering the XPRIZE will build this:

```
User → searches → job board → applies
```

Skilved builds this:

```
Agent scouts → Agent analyses → Agent matches → Agent applies
User wakes up to results
```

**The user becomes the exception. The agent is the default.**

This is not a product with AI features. This is a business operated by AI employees — where the human sets direction once and the agents work forever.

---

## The Core Thesis

**Current world:** Humans hunt opportunities.  
**Skilved world:** Opportunities hunt humans — through agents.

The XPRIZE is not asking "can you build a useful AI feature?" It is asking "can you build a business that is operated by AI?" These are fundamentally different questions. The first produces a tool. The second produces a company.

**The sentence judges will remember:**
> "LinkedIn helps people present themselves. Skilved helps opportunities find people."

---

## The 8 AI Employees

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SKILVED AGENT SYSTEM                            │
│                  "The AI-Operated Business"                         │
├──────────────────────┬──────────────────────┬───────────────────────┤
│    SUPPLY SIDE       │    MATCHING LAYER     │    DEMAND SIDE        │
│  (find opportunities)│  (connect the dots)   │  (serve the user)     │
├──────────────────────┼──────────────────────┼───────────────────────┤
│  Agent 1             │  Agent 3             │  Agent 4              │
│  SCOUT               │  MATCHING            │  CAREER               │
│  Finds everything    │  Ranks per user      │  Guides the path      │
│                      │                      │                       │
│  Agent 2             │  Agent 5             │  Agent 8              │
│  ANALYST             │  APPLICATION         │  CUSTOMER SUCCESS     │
│  Extracts structure  │  Applies for user    │  Onboards + supports  │
├──────────────────────┴──────────────────────┴───────────────────────┤
│                      BUSINESS LAYER                                 │
│           (runs the company, not just the product)                  │
├──────────────────────────────┬──────────────────────────────────────┤
│  Agent 6                     │  Agent 7                             │
│  REVENUE                     │  GROWTH                              │
│  Monetisation decisions      │  Acquisition + retention             │
└──────────────────────────────┴──────────────────────────────────────┘
                               ↕
                    THE GRAPH (BigQuery)
              Every agent reads and writes here.
              The graph is the intelligence that
              makes every agent smarter over time.
```

---

## The Core Insight: Agents Are Blind Without the Passport

Before detailing each agent, one architectural truth must be understood:

> *"Without the passport, agents are blind. A career agent applying to jobs without a verified skills record is just a better CV sender. With a passport, it knows exactly which roles you'd pass a technical screen for — and only applies to those."*

The Skills Passport is not a feature. It is the foundational data layer that every agent reads from. The Skills Profile Agent is the agent that builds it.

**Build order matters:**
1. The passport must exist before matching is meaningful
2. The passport must be rich before the Career Agent is accurate
3. The passport must be trusted before the Application Agent can act
4. The graph compounds from passport data + outcomes — both are required

---

## Agent 0: Skills Profile Agent (The Foundation)

**The AI employee who builds and maintains the passport.**

This agent is numbered 0 because everything else depends on it. It is not user-facing in the traditional sense — it runs in the background, continuously enriching the Skills Passport from everything the user provides.

### Job
Transform self-reported information into a structured, AI-verified Skills Passport. Extract real skills from free text. Map qualifications to the NQF framework. Build the economic identity that every other agent reads from.

### Runs
- On every profile update (event-driven)
- On certificate upload (Document AI pipeline)
- Weekly: re-evaluates completeness, surfaces enrichment opportunities
- On outcome reported: updates passport to reflect demonstrated capabilities

### What It Builds

```typescript
interface SkillsPassport {
  userId: string;
  version: number;
  lastEnrichedAt: Timestamp;
  completenessScore: number;       // 0-100
  completenessLevel: PassportLevel;

  // Verified identity (Phase 2: MyMzansi linked)
  myMzansiLinked: boolean;
  verifiedCredentials: VerifiedCredential[];

  // Trade identity
  primaryTrade: TradeCategory;
  subSpecialisations: string[];    // e.g. "Solar installation", "HV switching"
  province: Province;
  willingToRelocate: boolean;

  // Qualifications (NQF framework)
  qualifications: PassportQualification[];
  highestNqfLevel: number;
  tradeTested: boolean;
  tradeTestDate?: Timestamp;

  // Skills (AI-extracted, not self-reported)
  extractedSkills: ExtractedSkill[];
  skillsSourced: 'self_reported' | 'document_ai' | 'mymzansi' | 'outcome_verified';

  // Experience
  workHistory: PassportWorkEntry[];
  yearsExperience: number;
  employmentStatus: EmploymentStatus;

  // Portfolio (Phase 2: project evidence)
  portfolioItems: PortfolioItem[];

  // Graph signals (built from outcomes)
  placementHistory: PlacementRecord[];
  applicationSuccessRate?: number;
  avgTimeToPlacement?: number;

  // Agent-readable summary
  agentSummary: string;    // Gemini-generated 2-3 sentence summary for agent context
  matchingSignals: MatchingSignal[];  // pre-computed for matching agent speed
}
```

### Skills Extraction Pipeline

```
User provides free text:
"I worked at City Power for 3 years as an electrician.
 I wired industrial control panels and did HV switching up to 11kV."
       ↓
GeminiExtractor identifies:
  - Trade: Electrical (confirmed)
  - Sub-specialisation: Industrial control panels, HV switching
  - Implied NQF: NQF 4+ (HV switching requires certification)
  - Experience: 3 years, employer-context industrial
  - Skills extracted: ["panel wiring", "HV switching 11kV", "industrial electrical"]
       ↓
QualificationMapper cross-references:
  - HV switching requires Wireman's Licence
  - Flags: "You may have a Wireman's Licence — add it to unlock 12 more opportunities"
       ↓
PassportBuilder writes enriched passport to Firestore
       ↓
Matching Agent automatically improves for this user
```

### Passport Completeness Levels

| Level | Score | What unlocks |
|---|---|---|
| Starter | 0–20% | Basic filtering, anonymous-equivalent feed |
| Active | 21–40% | Matching Agent activates, match scores on cards |
| Strong | 41–60% | Career Agent activates, career plan generated |
| Skilved | 61–80% | Application Agent Level 2 available (CV + cover letter drafts) |
| Verified | 81–100% | Application Agent Level 3+ available, employer search visibility |

### GCP Stack
`Cloud Functions (event-driven) → Gemini (skills extraction) → Document AI (certificate processing) → Firestore (passport store) → BigQuery (passport analytics)`

### Autonomy Level
**Full.** Runs without user input. Enriches continuously. User sees their passport getting richer over time — without doing anything extra.

---

**The AI employee who never sleeps.**

### Job
Find every skilled trades opportunity in South Africa. Continuously. From every source that exists.

### Runs
Every 4 hours. 24/7. No human triggers it.

### Sources
- All 21 SETA portals (government skills agencies)
- 6 major job boards (Indeed SA, PNet, CareerJunction, Careers24, JobMail, Gumtree)
- Government Gazette (learnership proclamations)
- NAMB (trade test registration windows)
- Provincial skills development portals (all 9 provinces)
- Top 50 trade employer career pages (Eskom, Transnet, Sasol, Murray & Roberts, etc.)
- TVET college notice boards
- NGO opportunity portals (Youth Employment Service, Harambee, etc.)
- Corporate CSI bursary programmes

### Produces
```
New Opportunity (structured)
  → title, type, trade, province, salary, deadline
  → requirements, qualifications, application URL
  → quality score, freshness timestamp
  → published to feed
  → triggers Analyst Agent
```

### GCP Stack
`Cloud Scheduler → Cloud Pub/Sub → Cloud Run → Vertex AI Search → Firestore → BigQuery`

### Autonomy Level
**Full.** No human reviews or approves any published opportunity. The business cannot function at XPRIZE scale without this agent.

---

## Agent 2: Analyst Agent (Opportunity Intelligence)

**The AI employee who reads everything so users don't have to.**

### Job
Read every opportunity the Scout finds. Extract every piece of structured intelligence from it. Create the data layer that makes matching possible.

### Runs
Triggered by every new opportunity from Scout Agent (Pub/Sub).

### What It Extracts
```typescript
interface OpportunityIntelligence {
  // Classification (what is this?)
  opportunityType: 'apprenticeship' | 'learnership' | 'bursary' | 'job' | 'trade_test' | 'short_course';
  tradeCategory: TradeCategory;
  subSpecialisations: string[];          // e.g. "solar installation" within "electrical"

  // Location intelligence
  province: Province;
  city: string;
  travelRequired: boolean;
  remoteEligible: boolean;

  // Requirements intelligence
  qualificationsRequired: Qualification[];
  nqfLevelRequired: number;
  experienceRequired: ExperienceLevel;
  tradeTested: boolean;
  documentsRequired: string[];
  citizenshipRequired: boolean;
  ageRange?: { min: number; max: number };
  genderPreference?: string;             // some programmes target specific groups

  // Financial intelligence
  salaryAmount?: number;
  salaryType: SalaryType;
  benefitsIncluded: string[];
  bursaryCoversWhat?: string[];          // tuition, accommodation, stipend?

  // Timing intelligence
  deadline: Date;
  urgencyScore: number;                  // 0-100, how urgent to apply
  programmeStartDate?: Date;
  programmeDuration?: string;

  // Organisation intelligence
  organisationReputation: number;        // 0-100, from graph history
  previousPlacementRate?: number;        // from graph outcomes
  isVerifiedOrganisation: boolean;

  // Application intelligence
  applicationMethod: ApplicationMethod;
  applicationComplexity: number;         // 0-100, how hard to apply
  applicationAutoEligible: boolean;      // can Application Agent auto-apply?
  requiredDocuments: Document[];

  // AI-generated content
  descriptionSummary: string;           // 2-3 sentences
  requirementsChecklist: string[];      // bullet points
  whyThisIsGood: string;                // what makes this opportunity notable
  potentialDownsides?: string;          // honest assessment
}
```

### What Makes This Different
The Analyst doesn't just extract fields. It assesses:
- **Application complexity** — can the Application Agent auto-apply, or does this need user input?
- **Organisation reputation** — informed by the graph (previous outcomes with this employer)
- **Urgency score** — not just deadline, but demand vs supply signals
- **Honesty layer** — flags if stipend is low, if employer has poor outcomes in graph

### GCP Stack
`Cloud Pub/Sub → Cloud Run → Gemini API (structured extraction) → Firestore → BigQuery`

### Autonomy Level
**Full.** Every opportunity processed autonomously. Analyst creates the intelligence that all other agents depend on.

---

## Agent 3: Matching Agent (Personalised Ranking)

**The AI employee who knows what you need before you ask.**

### Job
For every user (anonymous or authenticated), rank all available opportunities in the optimal order for that specific person. Run on every feed request and continuously in the background.

### Runs
- Real-time: on every feed page load (response in < 300ms)
- Background: nightly re-ranking for all users (new opportunities found overnight)
- Event-driven: re-ranks immediately when user updates profile

### Matching Intelligence
```
Anonymous user matching:
  Trade filter selection          → 50% weight
  Province filter selection       → 30% weight
  Session browse history          → 10% weight
  Opportunity freshness           → 10% weight

Authenticated user matching:
  Trade category match            → 30% weight
  Qualification fit               → 25% weight
  Province match                  → 20% weight
  Experience level fit            → 10% weight
  Application history (no repeats)→  5% weight
  Opportunity freshness           → 10% weight

Graph-enhanced matching (Month 3+):
  + Organisation placement rate from graph
  + Similar user success patterns
  + Career trajectory alignment
```

### Match Explanation (Gemini)
Every matched opportunity gets a 1-sentence explanation:
> "Matches your N3 electrical and Gauteng — this employer placed 4 Skilved candidates last quarter."

The graph data makes these explanations increasingly specific and trustworthy over time.

### Behavioral Signals & Adaptive Matching

The Skills Passport remembers *what a user is* (skills, qualifications, experience). It does not, by itself, remember *how a user behaves* — which matches they ignore, which career suggestions they dismiss, which channels and times they engage through. Without this, "increasingly accurate decisions across multi-turn, cross-session interactions" is only half true: the agents get smarter about opportunities, but not about the individual.

**The fix:** a `behavioralSignals` object on the passport, updated by a lightweight enrichment step every time an agent observes a dismissal, override, or repeated pattern.

```typescript
interface BehavioralSignals {
  // Dismissal patterns
  dismissedOpportunityTypes: { type: OpportunityType; count: number }[];
  dismissedOrganisations: { orgName: string; count: number }[];

  // Engagement patterns
  preferredContactChannel: 'whatsapp' | 'email' | 'in_app';
  peakEngagementHours: number[];        // hours of day, derived from open/click times

  // Application Agent override patterns (Level 3/4)
  overrideRate: number;                 // % of agent-selected applications user disputed/reverted
  thresholdAdjustmentSuggested?: number; // if override rate high, suggest raising match threshold

  // Career patterns
  careerStepsCompleted: number;
  careerStepsIgnored: number;

  lastUpdatedAt: Timestamp;
}
```

**How agents use it:**
- **Matching Agent** down-weights opportunity types and organisations the user has repeatedly dismissed — without the user ever explicitly saying "don't show me these"
- **Revenue Agent** checks `overrideRate` before sending an upgrade prompt for Application Agent — a user who frequently overrides Level 3 decisions is not ready for Level 4, regardless of how the prompt is worded
- **Career Agent** notices when `careerStepsIgnored` is high for a particular step type and adjusts the plan rather than repeating the same suggestion
- **Notification Agent** sends digests at `peakEngagementHours` rather than a fixed 7am for every user

**This is the literal mechanism that makes Skilved's agents increasingly accurate over time** — not just because the graph grows, but because each individual agent-user relationship compounds.

**Timeline:** Sprint 4 stretch goal (the underlying events already exist in BigQuery — this is a derived enrichment, not new data collection). If it slips, first item in Phase 2.

### GCP Stack
`Cloud Run (HTTP) → Vertex AI Ranking API → Gemini (explanations) → Redis (cache) → BigQuery (log)`

### Autonomy Level
**Full.** No human curates the ranking. The model learns from outcome data and improves weekly.

---

## Agent 4: Career Agent (Path Intelligence)

**The AI employee who sees your future before you do.**

### Job
Understand where a user is in their career, where they want to go, and map the specific steps — qualifications, certifications, experience — needed to get there. Tell them what to do next.

### Runs
- On profile completion or update (background job)
- On user request (conversational, WhatsApp-native)
- Weekly: proactive career insight pushed to users

### What Career Agent Knows
```
User's current state:
  - Trade category + specialisation
  - Qualification level (NQF, N-codes)
  - Years of experience
  - Employment status
  - Certifications held
  - Province and willingness to relocate

User's stated goals:
  - Target role / income
  - Timeline ("I want to be trade-tested in 2 years")
  - Constraints ("I can't leave Gauteng")

The graph's knowledge:
  - Which qualifications unlock which salary bands (from outcomes data)
  - Which learnerships have the highest completion rates
  - Which certifications are most in-demand by employers in their trade
  - What the career trajectory looks like for people like them
```

### Career Agent Output (WhatsApp-native)
```
Morning [Name] 👋

Based on your profile, here's your career snapshot:

📍 You are: N3 Electrical, 2 years experience, Gauteng
🎯 Your goal: Artisan (trade-tested electrician)
📅 Estimated timeline: 18 months

Your next 3 steps:
1️⃣  Complete N4 Electrical (5 institutions near you offer this)
2️⃣  Apply for EWSETA apprenticeship (Skilved found 3 open right now)
3️⃣  Register for trade test (NAMB registration opens March 2027)

Skilved is watching for opportunities that move you toward step 2.
You'll hear from me when one appears.
```

### What Makes This Not a Chatbot
The Career Agent doesn't answer generic questions. It uses the SA Skills Graph to give career intelligence that is specific, verified by outcomes, and impossible to get from any other source. A Career Agent response in Year 3 will be informed by thousands of real career trajectories — not by generic career advice.

### GCP Stack
`Cloud Run → Gemini (career reasoning) → BigQuery (graph queries) → Firestore (career plan storage) → WhatsApp API`

### Autonomy Level
**Semi-autonomous.** Career plans generated autonomously. User confirms direction. Agent then acts autonomously within that direction.

---

## Agent 5: Application Agent (Autonomous Application)

**The AI employee who does the work while you sleep.**

### Job
With user permission, autonomously complete job applications on behalf of users. Fill forms, tailor CVs, generate cover letters, submit applications, track status.

### This Is Where Judges Get Excited

Most platforms help users apply better. Skilved applies for users. The difference is the entire product thesis.

**The permission model:**
> "Skilved found an electrical apprenticeship at Eskom. Based on your profile, you have an 87% match score. Should I apply for you?"
>
> [Yes, apply] [Show me first] [Not interested]

One tap. The agent does the rest.

### What Application Agent Does

**Step 1: Eligibility verification**
Check every requirement against user profile. Confirm eligibility before attempting application.

**Step 2: Document preparation**
- CV generation (tailored to this specific opportunity)
- Cover letter generation (uses opportunity requirements + user background)
- Document checklist (what's needed, what's available, what's missing)

**Step 3: Application execution**
- **Email application:** Composes and sends email with correct subject, body, and attachments
- **Online form:** Uses Playwright to fill web-based application forms autonomously
- **Portal application:** Navigates employer/SETA portals to submit

**Step 4: Confirmation and tracking**
- Captures confirmation number / reference
- Sets up status tracking
- Schedules follow-up if no response in X days
- Feeds outcome data back to graph

### Application Agent Permission Levels

| Level | User grants | Agent does |
|---|---|---|
| **Notify** | "Find opportunities, tell me" | Scout + Matching only |
| **Recommend** | "Find and recommend, I apply" | Scout + Matching + drafts ready for review |
| **Semi-auto** | "Apply to high-confidence matches (>85%)" | Full autonomous application above threshold |
| **Full-auto** | "Manage my applications completely" | Autonomous across all matches above minimum threshold |

Users set their permission level once. The agent operates within it forever.

### Technical Approach

**Email applications (70% of SA trades opportunities):**
```typescript
// Application Agent composes email via Gmail API / direct SMTP
const email = await gemini.compose({
  template: 'application_email',
  opportunity: opportunityData,
  user: userProfile,
  cv: generatedCV,
  coverLetter: generatedCoverLetter
});
await emailSender.send(email);
```

**Web form applications (20% of opportunities):**
```typescript
// Playwright for form filling on common portal types
const browser = await playwright.launch();
const page = await browser.newPage();
await page.goto(opportunity.applicationUrl);
await formFiller.fill(page, userProfile, opportunity);
await page.click('[type="submit"]');
```

**SETA portal applications (10% of opportunities):**
Built specifically for each major SETA portal (MERSETA, EWSETA, CETA have fixed portal structures).

### GCP Stack
`Cloud Run (Playwright) → Gemini (document generation) → Gmail API / SMTP → Firestore → BigQuery (application_submitted event)`

### Autonomy Level
**Conditional full autonomy.** User sets permission once. Agent applies autonomously within permissions forever. This is the most impressive demo for XPRIZE judges.

---

## Agent 6: Revenue Agent (Monetisation Intelligence)

**The AI employee who runs the business model.**

### Job
Make autonomous decisions about pricing, upsells, tier management, and revenue optimisation. The Revenue Agent is what makes Skilved a business operated by AI — not just a product that uses AI.

### This Is What Makes Judges Pay Attention

Most teams have a human pricing their product. Skilved's pricing is set by an agent that knows:
- Which users are about to churn
- Which users are ready for premium
- What price point maximises lifetime value
- When to prompt, and what to offer

### What Revenue Agent Decides

**Tier assignment:**
```
Free tier: all workers, always
Premium tier ($50/month): Career Agent + Application Agent (semi-auto)
Premium+  ($150/month): Full-auto applications + priority matching

Revenue Agent decides:
  - When to prompt free users to upgrade
  - What specific value to highlight in the prompt
  - Whether to offer a discount (and how much)
  - When to offer a free trial extension vs. hard paywall
```

**Dynamic pricing signals:**
```typescript
interface RevenueTrigger {
  userId: string;
  trigger: 'high_match_score' | 'career_milestone' | 'application_success' |
           'inactivity_risk' | 'profile_completion' | 'organic_upgrade_intent';
  recommendedAction: 'upgrade_prompt' | 'retention_offer' | 'trial_extension' | 'nothing';
  promptMessage: string;           // AI-generated, personalised
  suggestedPrice?: number;         // personalised pricing
  confidence: number;              // 0-1
  reasoning: string;               // why the agent made this decision
}
```

**Employer-side revenue decisions:**
- When to prompt an employer to move from pay-per-referral to SaaS dashboard
- Which employers to offer volume discounts (based on predicted LTV)
- When a SETA relationship is ready for contract upsell
- Which employer segments to target with outbound (based on matching data)

### The Agent's Own Dashboard (XPRIZE Demo)
```
Revenue Agent decisions — last 7 days:
  Upgrade prompts sent: 234
  Upgrade conversion: 12% (industry avg: 3%)
  Pricing experiments running: 3
  A/B test winner: "Your career plan is ready" vs "4 new matches" → career plan wins
  Revenue attributed to agent decisions: R18,400
  Human revenue decisions: 0
```

### GCP Stack
`Cloud Functions (event-driven) → Gemini (decision reasoning) → Firestore (user events) → BigQuery (revenue analytics) → WhatsApp API (prompt delivery)`

### Autonomy Level
**Full on prompts and pricing experiments. Human approval for price changes above threshold.**

---

## Agent 7: Growth Agent (Acquisition and Retention)

**The AI employee who grows the company.**

### Job
Monitor referrals, social channels, and engagement signals. Create content, run campaigns, identify growth opportunities. Autonomously.

### What Growth Agent Does

**Content creation (daily):**
```
Daily social content calendar — no human writes this:
  - "Skilved found this R5,400/month electrical apprenticeship in Joburg. 
    Here's how to apply: [link]" → TikTok + Instagram + Facebook
  - Trade explainer: "What's the difference between N3 and N6? 
    Here's what it means for your salary" → LinkedIn + TikTok
  - Success story: "Thandeka applied through Skilved and started 
    her apprenticeship at Eskom" → All channels
```

**WhatsApp community seeding:**
```
Growth Agent identifies:
  - High-engagement Skilved users (likely community leaders)
  - Opportunity for new WhatsApp group seeding
  - Timing: new opportunities discovered → share within 30 min
  
Agent sends to identified ambassadors:
  "Hey [Name], we found this great opportunity in your area.
   Would you share it in your WhatsApp group? [One-tap share]"
```

**Referral programme management:**
```
Growth Agent monitors:
  - Which users referred others
  - Referral conversion rates per channel
  - Which opportunity types drive most shares
  
Agent decisions:
  - Trigger referral reward (WhatsApp message + account credit)
  - Prompt high-sharers to become Skilved Ambassadors
  - Identify which content to boost (based on organic share rate)
```

**SEO content generation:**
```
Weekly: Growth Agent identifies top searched trade queries
  (from Google Search Console API)
  
Creates:
  - "[Trade] apprenticeship [Province] [Year]" pages
  - "How to apply for [SETA] learnership" guides
  - "[Trade] salary guide South Africa"
  
Published automatically to Skilved blog
Submitted to Google Search Console for indexing
```

### GCP Stack
`Cloud Scheduler (daily) → Cloud Run → Gemini (content generation) → Social APIs (Meta, LinkedIn) → WhatsApp API → Google Search Console API → BigQuery (growth analytics)`

### Autonomy Level
**Full for content creation and community seeding. Human reviews weekly performance reports.**

---

## Agent 8: Customer Success Agent (Support and Onboarding)

**The AI employee who makes sure every user succeeds.**

### Job
Handle all user support, onboarding guidance, and follow-ups. Ensure no user falls through the cracks. Convert first-time visitors into active, engaged Skilved users.

### Onboarding Flow (Autonomous)
```
Day 0: User creates profile
  Agent: "Welcome to Skilved, [Name]. I've found [N] opportunities 
  matching your N3 Electrical in Gauteng. Here are the top 3 right now:"
  [opportunity 1] [opportunity 2] [opportunity 3]
  "Reply with a number to see more details, or 'all' to see everything."

Day 1: Morning digest (if no activity)
  Agent: "Morning [Name] 👋 2 new opportunities since yesterday:
  [opp 1] [opp 2]
  The first one closes in 3 days."

Day 3: Profile completion nudge (if profile < 60%)
  Agent: "Your Skilved profile is 40% complete. Adding your qualification 
  level unlocks 23 more opportunities I can see for you. Takes 30 seconds:"
  [Add qualification]

Day 7: Career intelligence intro
  Agent: "You've been on Skilved for a week. Based on what I know about 
  your trade, here's what the next 12 months could look like if we work 
  together: [career snapshot]"

Day 14: Application Agent introduction (if user hasn't applied)
  Agent: "You've viewed 12 opportunities but haven't applied yet.
  Want me to apply for the top 3 on your behalf? One tap."
  [Yes, apply for me] [Show me how to apply]
```

### Support Handling
```
User query types and agent responses:

"How does this work?" → Onboarding explanation + quick-start guide
"I can't find [trade] opportunities" → Check filters, suggest alternatives, explain search
"Is this opportunity legitimate?" → Quality score + source credibility + graph history
"I applied but heard nothing" → Timeline guidance + follow-up message template
"How do I improve my profile?" → Specific next steps with completion unlock preview
"Cancel my subscription" → Retention flow + pause option before cancel
"I got the job!" → Congratulate + outcome recording + invite to share story
```

### Escalation Protocol
When agent cannot resolve:
1. Log the query and attempted resolution to BigQuery
2. Tag for human review (weekly batch review by founder)
3. Respond to user: "I've flagged this for our team — you'll hear back within 24 hours"

The goal: human intervention < 5% of all support interactions.

### GCP Stack
`WhatsApp API (inbound) → Cloud Functions → Gemini (response generation) → Firestore (conversation history) → BigQuery (support analytics)`

### Autonomy Level
**Full for standard queries. Human batch review of edge cases weekly.**

---

## Agent 12: Interview Coordination Agent (Closing the Loop)

**The AI employee who finishes what Application Agent started.**

### Why this agent exists

"Resume screening to interview scheduling" is the workflow span named explicitly in the agentic AI brief. Right now, when Application Agent submits an application, Outcome Tracker logs the submission and waits passively for the user to report back what happened. That's a gap — the highest-value moment in the entire pipeline (an employer responding with interview interest) currently requires the *user* to notice, forward, and act on it manually. An agent that closes this loop is a natural, low-cost extension of agents already being built — not a new domain.

### Job
Detect employer responses to agent-submitted applications, coordinate scheduling with the user, confirm with the employer, and prepare the user for the interview using data the Career Agent already has.

### Runs
Event-driven: triggered when an employer reply is detected (email parsing on the `applications@skilved.com` inbox used by Application Agent, or a forwarded WhatsApp message from the user).

### The Workflow
```
Employer replies to agent-submitted application:
  "We'd like to interview you Thursday at 2pm — please confirm."
       ↓
EmailParser detects interview request, extracts: date, time, location/format, opportunity_id
       ↓
InterviewCoordinationAgent → WhatsApp to user:
  "Eskom wants to interview you Thursday 2pm for the
   electrical apprenticeship. Works for you?"
       ↓
User replies "yes"
       ↓
Agent → confirms with employer via email
Agent → writes interview to applications.interviewSchedule
Agent → triggers Career Agent: generate interview prep notes
   (Career Agent already has the opportunity's requirements —
    prep notes are a natural extension, not new intelligence)
       ↓
WhatsApp to user (morning of interview):
  "Reminder: Eskom interview today 2pm.
   Prep notes: [3 likely technical questions based on the role
   + your N3 electrical background]. Good luck!"
       ↓
Outcome Tracker follow-up updated: interview_completed → outcome
```

### What If the User Can't Make It / Wants to Reschedule
Agent negotiates directly with the employer ("Thabo asked if Friday morning would work instead") and confirms back to the user — this is the "negotiation" criterion from the agentic AI brief, applied to a real, low-stakes scenario where agent autonomy genuinely helps.

### GCP Stack
`Gmail API (inbound parsing) → Gemini (interview detection + prep generation) → WhatsApp API → Firestore (applications.interviewSchedule) → agent_context (coordination with Career Agent)`

### Autonomy Level
**High, with confirmation gates.** The agent detects, schedules, and prepares — but never confirms a final time without the user's explicit "yes." This matches Level 3 permission semantics: agent prepares and surfaces, user confirms once, agent executes the rest.

### Timeline
Sprint 4 stretch goal — depends on Application Agent v1 (Sprint 3) having produced real submissions to respond to. If it slips past Sprint 4, it is the first Phase 2 item, since the underlying agents (Application, Career, Outcome Tracker) are already MVP-complete and this is additive.

---

## What the User Experiences

### Week 1: The Magic Moment

```
Monday:   User creates profile (3 minutes: trade + province + qualification)
Tuesday:  "Morning Thabo 👋 Skilved found 4 electrical apprenticeships 
           in Joburg overnight. Top match: Eskom, R4,500/month, closes Friday."
Wednesday: [Thabo taps "Apply for me"]
           Application Agent composes CV + cover letter
           Submits to Eskom at 7:45am
           "Application submitted ✓ Reference: ESK-2026-4471"
Thursday: "New match: Murray & Roberts artisan development programme.
           I haven't applied because you set semi-auto (>85% match only).
           This one is 91%. Apply?"
Friday:   Career Agent: "Thabo, here's your 12-month career plan.
           Step 1 is already underway — your Eskom application."
```

### 30 Days Later

Thabo has:
- Had 8 applications submitted on his behalf
- Received 2 interview invitations
- Been guided through interview preparation by Career Agent
- Had his profile automatically updated when he completed a short course

Thabo has opened Skilved **twice**. The agent did everything else.

**This is the XPRIZE demo.**

---

## The Agent Coordination Layer

**The gap between "a pipeline of agents" and "a multi-agent system that collaborates."**

The chain Scout → Analyst → Quality → Matching is a real event-driven pipeline — but it is one-directional. Agents downstream don't know what agents elsewhere have recently done for the same user. Revenue Agent can send an upgrade prompt the same day Customer Success Agent handled a complaint from that user. Application Agent can apply against a career plan that Career Agent just changed an hour ago. That's not collaboration — it's parallel agents that happen to share a database.

**The fix:** a single shared `agent_context` document per user — a lightweight, fast-read coordination layer that any agent checks before acting and updates after acting.

```typescript
// Firestore: agent_context/{userId} — one document per user, frequently read, frequently updated
interface AgentContext {
  userId: string;
  updatedAt: Timestamp;

  // Recent agent activity (rolling 7-day window, most recent first)
  recentActions: {
    agent: string;
    action: string;
    at: Timestamp;
    relevantTo?: string[];   // which other agents should consider this
  }[];

  // Coordination flags — set by one agent, read by others
  flags: {
    csEscalationOpenSince?: Timestamp;     // Revenue Agent: suppress upgrade prompts
    careerPlanChangedAt?: Timestamp;       // Application Agent: re-score before applying
    applicationConfirmedAt?: Timestamp;    // Growth Agent: this is a share-invite moment
    circuitBreakerHaltedAt?: Timestamp;    // All agents: user-facing actions paused
  };
}
```

**Real coordination this enables:**

| Scenario | Without coordination | With `agent_context` |
|---|---|---|
| User disputed something with CS Agent yesterday | Revenue Agent sends upgrade prompt today — feels tone-deaf | Revenue Agent checks `csEscalationOpenSince`, suppresses prompt for 7 days |
| Career Agent just changed the user's target role | Application Agent applies against the old plan | Application Agent checks `careerPlanChangedAt`, re-scores against new plan first |
| Application Agent just got a confirmed submission | Growth Agent has no signal this happened | Growth Agent checks `applicationConfirmedAt` — this is the "agent worked overnight" share-invite moment |
| Circuit breaker halted Application Agent for this user | Revenue/Growth agents act on this user normally | All agents check `circuitBreakerHaltedAt` — user-facing autonomous actions pause platform-wide until resolved |

**Why this matters for the XPRIZE framing:** "multiple agents work together through task division, dialogue, and negotiation" is a specific, named criterion. A shared coordination context that agents read and write — with visible cause-and-effect between agents — is the difference between *demonstrating* a pipeline and *demonstrating* collaboration. The Agent Trace Visualizer (Sprint 3) becomes more powerful here too: it can show not just "Agent X did Y" but "Agent X did Y *because* Agent Z had done W."

**Implementation cost:** low. One small Firestore document per user, read at the start of each agent's logic and written at the end. No new agents required — this is a coordination primitive that existing agents adopt.

**Timeline:** Sprint 4. Each agent adds a 2-line read/write to `agent_context` as part of its existing logic — this is the kind of addition that's far cheaper to build alongside the agents than to retrofit later.

---

## Agent Interaction Map

```
                    ┌─────────────────┐         ┌──────────────────┐
                    │   THE GRAPH     │◀───────▶│  AGENT CONTEXT    │
                    │   (BigQuery)    │         │  (per-user state) │
                    │  All agents     │         │  All agents       │
                    │  read + write   │         │  read + write     │
                    └────────┬────────┘         └─────────┬─────────┘
                             │                             │
         ┌───────────────────┼───────────────────┐        │
         │                   │                   │        │
    ┌────▼────┐         ┌────▼────┐         ┌────▼────┐   │
    │ SCOUT   │──────▶  │ANALYST  │──────▶  │MATCHING │◀──┤ (behavioral signals)
    │ (finds) │         │(reads)  │         │(ranks)  │   │
    └─────────┘         └─────────┘         └────┬────┘   │
                                                 │         │
                        ┌────────────────────────┼─────────────────────┐
                        │                        │                     │
                   ┌────▼────┐            ┌──────▼──────┐        ┌─────▼────┐
                   │ CAREER  │◀──────────▶│ APPLICATION │◀──────▶│CUSTOMER  │
                   │(guides) │             │ (applies)   │        │SUCCESS   │
                   └────┬────┘             └──────┬──────┘        │(supports)│
                        │                          │               └────┬─────┘
                        └──────────┬───────────────┘                    │
                                   │                                    │
                        ┌──────────▼──────────┐         ┌───────────────▼──┐
                        │      OUTCOME        │────────▶│ INTERVIEW COORD.  │
                        │   (did they get it?)│         │ (closes the loop) │
                        └──────────┬──────────┘         └───────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │                             │
               ┌────▼────┐                  ┌────▼────┐
               │ REVENUE │◀────────────────▶│ GROWTH  │
               │(monetise│   agent_context   │ (grows) │
               └─────────┘                  └─────────┘
```

The dashed/bidirectional arrows represent `agent_context` reads and writes — this is what turns the pipeline into a coordinated system.

---

## XPRIZE Demonstration: AI-Native Operations

This is what the judges see:

> "In the last 24 hours, Skilved's 8 AI agents made 4,847 autonomous decisions:
>
> - Scout Agent discovered 312 new opportunities from 50 sources
> - Analyst Agent extracted structured intelligence from every one
> - Matching Agent served 1,247 personalised feeds
> - Career Agent sent 89 career pathway updates
> - Application Agent submitted 34 applications on behalf of users
> - Revenue Agent sent 67 upgrade prompts, converting 8
> - Growth Agent created and published 4 content pieces
> - Customer Success Agent resolved 156 user queries
>
> Human decisions made in this period: **0**
>
> That is what a business operated by AI looks like."

---

## MVP Agent Priority (Build Order — 8 Weeks)

| Sprint | Agents to ship | Why |
|---|---|---|
| 1 | Scout + Analyst + Quality | Feed must be live with real data, scam-free |
| 2 | Skills Profile (Agent 0) + Matching | The passport must exist before matching is meaningful |
| 3 | Career + Application (email) + Customer Success | Career Agent is the "magic moment"; Application Agent is the XPRIZE differentiator |
| 4 | Application v2 + Revenue + Growth | Scale and monetisation |

Never build agents out of dependency order. Agent 0 (Skills Profile) ships before any agent that reads from the passport.

---

## Post-MVP: Agents 10-13 — Reputation, Credentials, and the Gig Economy (Phase 2/3, Month 4+)

These two agents extend the passport from "verified skills" to "verified skills + verified reputation." They are deliberately deferred — both depend on having enough real outcome data to synthesize, which an 8-week sprint cannot produce credibly. Building them early would mean shipping an empty or fake-looking feature.

**The schema is seeded in Sprint 2** (`reputation` field on `skills_passports`, empty `reviews` collection) so Phase 2 requires no migration on live user data.

### Agent 10: Reputation Agent

**Job:** Collect, weight, and synthesize peer/manager/employer feedback into a trust score on the passport.

**Why it matters:** Outcome data alone tells you *what happened* (placed, completed, etc.). Reputation tells you *how well* — and that's what makes a Skilved passport worth more than a CV or even a verified credential alone.

**Core design — "review the reviewer":**
- Reviews can only be submitted by parties tied to a *verified outcome* in the graph (an employer who Skilved confirms placed this worker cannot be a stranger)
- Each reviewer has a `reviewerCredibilityScore` — built from their own history of varied, considered reviews (an employer who rates everyone 5 stars contributes less weight than one with a track record of honest, differentiated feedback)
- Output is not just a number — `synthesis` is a Gemini-generated plain-language summary: "Rated highly for reliability and technical skill by 2 verified employers over 18 months"

**This anti-gaming design is not optional.** A gameable trust score is worse than no trust score — it actively misleads employers and damages the passport's core value proposition. Reputation cannot ship without it.

**Runs:** Triggered when an outcome is confirmed (placement, completion) → requests review from the relevant employer/manager → on review submission, recalculates `trustScore` and `synthesis` → updates passport.

**GCP Stack:** `Cloud Functions (event-driven) → Gemini (review synthesis + credibility scoring) → Firestore (reviews + passport update) → BigQuery (reputation analytics)`

---

### Agent 11: Credential Issuance Agent

**Job:** Issue Skilved-native verifiable credentials based on outcomes + reputation — credentials no other institution can issue, because only Skilved has this combination of outcome and reputation data.

**Example output:** "Completed Eskom Electrical Apprenticeship — Skilved Verified — Employer-rated 4.8/5 — 18 months — Issued [date]"

**Why it matters:** This is new credential *creation*, not verification of existing paper qualifications. It's the mechanism by which "send me your Skilved" becomes progressively more meaningful — a passport with two years of Skilved-issued credentials is a fundamentally different asset than a self-reported profile.

**Design constraint for Phase 2:** Build on the **W3C Verifiable Credentials standard** from day one. This costs nothing extra at build time but makes every issued credential portable — usable with MyMzansi, other platforms, and potentially recognised internationally. Retrofitting a proprietary format later would require re-issuing every credential.

**Runs:** Triggered when Reputation Agent confirms a trust score update tied to a completed placement with sufficient tenure (e.g. 3+ months) → generates credential → issues to passport → notifies user.

**GCP Stack:** `Cloud Functions (event-driven) → Gemini (credential description generation) → Firestore (credential store, W3C VC format) → Cloud Storage (signed credential documents)`

---

## Agent 13: Gig Agent — From Job Seeker to Micro-Business (Phase 2/3)

**The agent that turns Skilved from "AI job board" into "AI operating layer for South Africa's informal economy."**

### The Insight

A large proportion of tradespeople on Skilved are not only job-seekers — they are also informal micro-business owners. The electrician looking for an apprenticeship on Skilved is frequently the same person who rewires a neighbour's house or fixes a geyser on weekends. That side of their economic life is currently unserved by any platform — and it maps directly onto the "customer inquiry to quote generation" workflow named in the agentic AI brief, just applied to a person instead of a company.

### Job
Act as the AI back office for a tradesperson's private gig work: receive customer inquiries via WhatsApp, generate quotes, schedule jobs, send reminders, and produce simple invoices — using the same Gemini reasoning and WhatsApp interface already built for Application Agent and Customer Success Agent.

### The Workflow
```
Customer messages tradesperson's Skilved-linked WhatsApp number:
  "Hi, my geyser is leaking, how much to fix?"
       ↓
GigAgent reads inquiry, asks clarifying questions if needed:
  "What type of geyser, and roughly how old is it?"
       ↓
Customer replies with details
       ↓
GigAgent generates a quote based on:
  - The tradesperson's stated rates (set once, in passport)
  - Job type + typical scope (same Gemini reasoning as cover letters)
       ↓
GigAgent → customer: "Quote: R850 for inspection + repair,
                       R1,200 if element replacement needed.
                       Available Thursday or Friday."
       ↓
Customer accepts + picks a time
       ↓
GigAgent schedules against tradesperson's calendar,
confirms with both parties
       ↓
After job: GigAgent generates simple invoice (PDF)
       ↓
Completed gig → becomes an OUTCOME in the graph
  → feeds Reputation Agent (Agent 10) — except now reviews
    come from real private customers, not just employers
```

### Why This Is the "Inevitable" Addition

- **Minimal new infrastructure.** Same Gemini reasoning (Application Agent's CV/cover letter generation → quote generation), same WhatsApp interface (Customer Success Agent), same outcome → reputation pipeline (Agent 10/11).
- **Valuable even to fully employed users.** A tradesperson who already has a job still does side work. Skilved becomes useful every week, not just during job searches — this is the mechanism that makes Skilved "something they can't live without," independent of employment status.
- **Strengthens the Reputation Graph with a second source of trust signals** — private customer reviews alongside employer reviews, making the passport richer faster.
- **The bridge to the full vision.** A tradesperson who builds a strong Gig Agent track record is, functionally, running a small business. The same agentic infrastructure that helps them today scales to helping them formally register that business, hire their first employee through Skilved, and eventually appear on the *employer* side of the platform — closing the loop from "worker" to "employer who hires through Skilved." This is the on-ramp to the broader education/career/HR vision: Skilved becomes the operating layer for the entire lifecycle, not just the entry point.

### GCP Stack
`WhatsApp API (inbound/outbound) → Gemini (inquiry understanding + quote generation) → Firestore (gigs, quotes, invoices) → Cloud Scheduler (reminders) → BigQuery (gig outcomes feed Reputation Agent)`

### Autonomy Level
**High, with confirmation gates** — same pattern as Interview Coordination Agent. Agent drafts quotes and schedules; tradesperson confirms pricing once (or sets standing rates); agent then operates autonomously within those rates.

### Timeline
Phase 2/3 (Month 6-12) — depends on Reputation Agent (10) being live, since gig outcomes are a key reputation input. Named in the roadmap now (see `08_Post_MVP_Future_Plans.md` §3.x) and referenced in the XPRIZE narrative as the long-term vision, even though it does not ship in the 8-week MVP.

---

## What This Unlocks (Phase 2+)

The reputation layer is not just a feature — it's a structural unlock for several other roadmap items:

- **Employer-side trust signals** — employers can filter candidates by trust score, not just self-reported qualifications
- **Verified references replace cold references** — "send me your Skilved" includes employer-verified history, reducing reference-check friction
- **Community activity feed (opt-in)** — aggregate trust/placement trends ("12 electricians placed in Gauteng this week, average rating 4.6") become shareable without exposing individuals
- **Premium tier expansion** — "Verified" passport tier becomes meaningfully different from "Skilved" tier, supporting tiered employer search pricing
- **The Gig Agent (Agent 13)** — a second source of trust signals (private customer reviews), and the on-ramp from "worker" to "micro-business" to eventual "employer on Skilved"
- **The domino effect** — as more workers accumulate verified reputation, employers trust the platform more, which drives more employers to request reviews, which makes the passport richer for everyone — a genuine two-sided network effect anchored to real outcomes, not vanity metrics

---

## The Two-Sentence XPRIZE Pitch

> "LinkedIn helps people present themselves to opportunities. Skilved helps opportunities find people — through AI agents that discover, match, and apply on behalf of every worker, 24 hours a day, without the worker ever having to search."

That is:
- A new primitive (opportunities hunt humans)
- AI-native operations (agents do the work)
- Population-scale impact (every SA skilled worker)
- A defensible moat (the graph compounds with every agent action)

---

*Document version 4.0 — June 2026*
*This document supersedes the agent sections in 06_Agent_Architecture.md*
*v3.0: Added Agent 0 (Skills Profile — the foundation) and Agents 10-11 (Reputation + Credential Issuance — Post-MVP Phase 2)*
*v4.0: Added Behavioral Signals & Adaptive Matching (Agent 3), the Agent Coordination Layer (agent_context, Sprint 4), Agent 12 (Interview Coordination — Sprint 4 stretch/Phase 2), Agent 13 (Gig Agent — Phase 2/3, the bridge to the full education/career/HR vision)*
*Owner: Founder + Engineering*
