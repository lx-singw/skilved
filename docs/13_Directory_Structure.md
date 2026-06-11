# Skilved — Complete Directory Structure
### Monorepo | Version 1.0 | June 2026

---

## Architecture Overview

Skilved is a monorepo managed with **Turborepo**. All apps, agents, packages, and infrastructure live in one repository. This keeps the codebase coherent, enables shared packages (types, utils, config), and simplifies CI/CD.

```
skilved/                          ← monorepo root
├── apps/                         ← deployable applications
│   ├── web/                      ← Next.js frontend (PWA)
│   ├── agents/                   ← Agent services (Cloud Run)
│   └── admin/                    ← Internal admin dashboard
├── packages/                     ← shared libraries
│   ├── types/                    ← shared TypeScript types
│   ├── utils/                    ← shared utilities
│   ├── ui/                       ← shared component library
│   ├── config/                   ← shared configs (ESLint, TS, Tailwind)
│   └── database/                 ← Firestore + BigQuery clients
├── infrastructure/               ← GCP infrastructure as code (Terraform)
├── scripts/                      ← one-off scripts, data migration
├── docs/                         ← technical documentation
└── .github/                      ← CI/CD workflows
```

---

## Full Directory Tree

```
skilved/
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                        ← lint, typecheck, test on PR
│   │   ├── deploy-web.yml                ← deploy web app to Vercel on main
│   │   ├── deploy-agents.yml             ← deploy agents to Cloud Run on main
│   │   ├── deploy-admin.yml              ← deploy admin to Cloud Run on main
│   │   └── terraform.yml                 ← apply infra changes on main
│   ├── CODEOWNERS                        ← who reviews what
│   ├── pull_request_template.md          ← PR checklist
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       ├── feature_request.md
│       └── agent_failure.md              ← specific template for agent issues
│
├── apps/
│   │
│   ├── web/                              ← Next.js 14 (App Router) PWA
│   │   ├── public/
│   │   │   ├── favicon.ico
│   │   │   ├── favicon-16x16.png
│   │   │   ├── favicon-32x32.png
│   │   │   ├── apple-touch-icon.png
│   │   │   ├── manifest.json             ← PWA manifest
│   │   │   ├── robots.txt
│   │   │   ├── sitemap.xml               ← auto-generated
│   │   │   └── icons/
│   │   │       ├── icon-192x192.png
│   │   │       └── icon-512x512.png
│   │   │
│   │   ├── src/
│   │   │   ├── app/                      ← Next.js App Router
│   │   │   │   ├── layout.tsx            ← root layout (fonts, providers)
│   │   │   │   ├── page.tsx              ← homepage / feed
│   │   │   │   ├── loading.tsx           ← root loading state
│   │   │   │   ├── error.tsx             ← root error boundary
│   │   │   │   ├── not-found.tsx         ← 404 page
│   │   │   │   ├── globals.css           ← global styles
│   │   │   │   │
│   │   │   │   ├── (feed)/               ← feed route group
│   │   │   │   │   ├── layout.tsx        ← feed layout (nav, filters)
│   │   │   │   │   ├── page.tsx          ← all opportunities feed
│   │   │   │   │   ├── loading.tsx       ← feed skeleton
│   │   │   │   │   └── [trade]/
│   │   │   │   │       ├── page.tsx      ← trade-filtered feed
│   │   │   │   │       └── [province]/
│   │   │   │   │           └── page.tsx  ← trade + province feed
│   │   │   │   │
│   │   │   │   ├── opportunity/
│   │   │   │   │   └── [slug]/
│   │   │   │   │       ├── page.tsx      ← opportunity detail view
│   │   │   │   │       ├── loading.tsx
│   │   │   │   │       └── opengraph-image.tsx ← dynamic OG image
│   │   │   │   │
│   │   │   │   ├── profile/
│   │   │   │   │   ├── page.tsx          ← current user profile (auth required)
│   │   │   │   │   ├── edit/
│   │   │   │   │   │   └── page.tsx      ← edit profile
│   │   │   │   │   └── [username]/
│   │   │   │   │       └── page.tsx      ← public profile (shareable URL)
│   │   │   │   │
│   │   │   │   ├── onboarding/
│   │   │   │   │   ├── page.tsx          ← step 1: trade + province
│   │   │   │   │   ├── qualifications/
│   │   │   │   │   │   └── page.tsx      ← step 2: qualifications
│   │   │   │   │   └── notifications/
│   │   │   │   │       └── page.tsx      ← step 3: WhatsApp opt-in
│   │   │   │   │
│   │   │   │   ├── auth/
│   │   │   │   │   ├── signin/
│   │   │   │   │   │   └── page.tsx      ← sign in (WhatsApp OTP / Google)
│   │   │   │   │   ├── verify/
│   │   │   │   │   │   └── page.tsx      ← OTP verification
│   │   │   │   │   └── signout/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── applications/
│   │   │   │   │   └── page.tsx          ← user's application history (manual + agent)
│   │   │   │   │
│   │   │   │   ├── saved/
│   │   │   │   │   └── page.tsx          ← user's saved opportunities
│   │   │   │   │
│   │   │   │   ├── apply/
│   │   │   │   │   └── [opportunityId]/
│   │   │   │   │       └── page.tsx      ← in-app application form
│   │   │   │   │
│   │   │   │   ├── career/
│   │   │   │   │   └── page.tsx          ← career plan (auth required, Career Agent output)
│   │   │   │   │
│   │   │   │   ├── permissions/
│   │   │   │   │   └── page.tsx          ← Level 1-4 selector + explainer + consent
│   │   │   │   │
│   │   │   │   ├── privacy/
│   │   │   │   │   └── page.tsx          ← POPIA privacy notice
│   │   │   │   │
│   │   │   │   ├── terms/
│   │   │   │   │   └── page.tsx          ← terms of service
│   │   │   │   │
│   │   │   │   └── api/                  ← Next.js API routes
│   │   │   │       ├── feed/
│   │   │   │       │   └── route.ts      ← GET /api/feed (ranked opportunities)
│   │   │   │       ├── opportunities/
│   │   │   │       │   ├── route.ts      ← GET /api/opportunities
│   │   │   │       │   └── [id]/
│   │   │   │       │       └── route.ts  ← GET /api/opportunities/:id
│   │   │   │       ├── apply/
│   │   │   │       │   └── route.ts      ← POST /api/apply (manual or agent-triggered)
│   │   │   │       ├── agent-apply/
│   │   │   │       │   └── route.ts      ← POST /api/agent-apply (Application Agent trigger)
│   │   │   │       ├── career/
│   │   │   │       │   └── route.ts      ← GET /api/career (user's career plan)
│   │   │   │       ├── permissions/
│   │   │   │       │   └── route.ts      ← GET/PUT /api/permissions (Level 1-4)
│   │   │   │       ├── save/
│   │   │   │       │   └── route.ts      ← POST /api/save
│   │   │   │       ├── profile/
│   │   │   │       │   └── route.ts      ← GET/PUT /api/profile
│   │   │   │       ├── auth/
│   │   │   │       │   ├── whatsapp/
│   │   │   │       │   │   ├── send-otp/
│   │   │   │       │   │   │   └── route.ts
│   │   │   │       │   │   └── verify-otp/
│   │   │   │       │   │       └── route.ts
│   │   │   │       │   └── [...nextauth]/
│   │   │   │       │       └── route.ts  ← NextAuth (Google OAuth)
│   │   │   │       ├── events/
│   │   │   │       │   └── route.ts      ← POST /api/events (analytics ingestion)
│   │   │   │       ├── webhooks/
│   │   │   │       │   └── whatsapp/
│   │   │   │       │       └── route.ts  ← incoming WhatsApp messages
│   │   │   │       └── health/
│   │   │   │           └── route.ts      ← GET /api/health (uptime check)
│   │   │   │
│   │   │   ├── components/               ← UI components
│   │   │   │   ├── feed/
│   │   │   │   │   ├── FeedContainer.tsx         ← main feed wrapper
│   │   │   │   │   ├── FeedFilters.tsx            ← trade + province filters
│   │   │   │   │   ├── FeedSortBar.tsx            ← sort controls
│   │   │   │   │   ├── OpportunityCard.tsx        ← main card component
│   │   │   │   │   ├── OpportunityCardSkeleton.tsx← loading skeleton
│   │   │   │   │   ├── OpportunityCardExpired.tsx ← expired state
│   │   │   │   │   ├── NewTodaySection.tsx        ← "new today" feed section
│   │   │   │   │   ├── BestMatchesSection.tsx     ← logged-in matches section
│   │   │   │   │   ├── ClosingSoonBanner.tsx      ← closing soon strip
│   │   │   │   │   ├── PersonalisationPrompt.tsx  ← soft signup trigger
│   │   │   │   │   └── EmptyFeedState.tsx         ← no results state
│   │   │   │   │
│   │   │   │   ├── opportunity/
│   │   │   │   │   ├── OpportunityDetail.tsx      ← full detail view
│   │   │   │   │   ├── OpportunityRequirements.tsx← requirement checklist
│   │   │   │   │   ├── OpportunityAISummary.tsx   ← Gemini-generated summary
│   │   │   │   │   ├── OpportunityActions.tsx     ← apply + share buttons
│   │   │   │   │   ├── RelatedOpportunities.tsx   ← similar opportunities
│   │   │   │   │   └── ShareButton.tsx            ← WhatsApp share
│   │   │   │   │
│   │   │   │   ├── profile/
│   │   │   │   │   ├── ProfileHeader.tsx          ← name, trade, "send me your Skilved"
│   │   │   │   │   ├── ProfileCompletion.tsx      ← progress bar + next steps
│   │   │   │   │   ├── ProfileTrade.tsx           ← trade + qualification section
│   │   │   │   │   ├── ProfileCertificates.tsx    ← certificates list
│   │   │   │   │   ├── ProfileWorkHistory.tsx     ← work history
│   │   │   │   │   ├── ProfileApplications.tsx    ← application history tab
│   │   │   │   │   ├── ProfileSaved.tsx           ← saved opportunities tab
│   │   │   │   │   ├── SkilvedBadge.tsx           ← verified badge component
│   │   │   │   │   └── ShareProfileButton.tsx     ← "send my Skilved" button
│   │   │   │   │
│   │   │   │   ├── auth/
│   │   │   │   │   ├── WhatsAppOTPForm.tsx        ← phone + OTP flow
│   │   │   │   │   ├── GoogleSignInButton.tsx
│   │   │   │   │   └── AuthModal.tsx              ← modal wrapper
│   │   │   │   │
│   │   │   │   ├── onboarding/
│   │   │   │   │   ├── TradeSelector.tsx          ← trade category picker
│   │   │   │   │   ├── ProvinceSelector.tsx       ← province picker
│   │   │   │   │   ├── QualificationSelector.tsx  ← NQF level picker
│   │   │   │   │   ├── WhatsAppOptIn.tsx          ← notification opt-in
│   │   │   │   │   └── OnboardingProgress.tsx     ← step indicator
│   │   │   │   │
│   │   │   │   ├── apply/
│   │   │   │   │   ├── ApplicationForm.tsx        ← in-app application
│   │   │   │   │   ├── CoverNoteField.tsx         ← AI-assisted cover note
│   │   │   │   │   ├── AgentApplyButton.tsx        ← "Apply for me" one-tap button
│   │   │   │   │   └── ApplicationConfirmation.tsx
│   │   │   │   │
│   │   │   │   ├── career/
│   │   │   │   │   ├── CareerPlanCard.tsx         ← career plan summary display
│   │   │   │   │   ├── CareerStepItem.tsx         ← individual step in career path
│   │   │   │   │   ├── SkillsGapBadge.tsx         ← missing qualification indicator
│   │   │   │   │   ├── TimelineDisplay.tsx        ← estimated timeline visualisation
│   │   │   │   │   └── CareerInsightBanner.tsx    ← weekly insight from Career Agent
│   │   │   │   │
│   │   │   │   ├── permissions/
│   │   │   │   │   ├── PermissionLevelSelector.tsx← Level 1-4 picker with explainer
│   │   │   │   │   ├── PermissionLevelCard.tsx    ← single level description card
│   │   │   │   │   ├── AutopilotToggle.tsx        ← quick Level 3/4 toggle
│   │   │   │   │   ├── ConsentCapture.tsx         ← POPIA consent for Level 3+
│   │   │   │   │   └── TrustProgressBar.tsx       ← journey from L1 → L4
│   │   │   │   │
│   │   │   │   ├── agent-activity/
│   │   │   │   │   ├── AgentActivityFeed.tsx      ← "Agent applied to X on your behalf"
│   │   │   │   │   ├── ApplicationAgentCard.tsx   ← "Apply for me" action card
│   │   │   │   │   ├── CareerAgentCard.tsx        ← career plan prompt card
│   │   │   │   │   └── AgentStatusBadge.tsx       ← "Agent working" indicator
│   │   │   │   │
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Header.tsx                 ← top nav
│   │   │   │   │   ├── BottomNav.tsx              ← mobile bottom navigation
│   │   │   │   │   ├── Sidebar.tsx                ← desktop sidebar
│   │   │   │   │   └── Footer.tsx
│   │   │   │   │
│   │   │   │   └── shared/
│   │   │   │       ├── TradeBadge.tsx             ← coloured trade pill
│   │   │   │       ├── ProvincePill.tsx           ← province tag
│   │   │   │       ├── OpportunityTypePill.tsx    ← apprenticeship/learnership etc
│   │   │   │       ├── FreshnessBadge.tsx         ← "found 2h ago"
│   │   │   │       ├── SalaryDisplay.tsx          ← formatted salary
│   │   │   │       ├── DeadlineBadge.tsx          ← closing date + urgency
│   │   │   │       ├── MatchScore.tsx             ← match explanation
│   │   │   │       ├── VerifiedBadge.tsx          ← MyMzansi verified
│   │   │   │       ├── SkeletonCard.tsx           ← loading skeleton
│   │   │   │       ├── EmptyState.tsx             ← empty content state
│   │   │   │       ├── ErrorBoundary.tsx
│   │   │   │       ├── CookieConsent.tsx          ← POPIA cookie banner
│   │   │   │       └── OfflineBanner.tsx          ← offline indicator
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useFeed.ts                     ← feed data + pagination
│   │   │   │   ├── useOpportunity.ts              ← single opportunity
│   │   │   │   ├── useProfile.ts                  ← user profile
│   │   │   │   ├── useAuth.ts                     ← auth state
│   │   │   │   ├── useFilters.ts                  ← filter state + URL sync
│   │   │   │   ├── usePersonalisation.ts          ← soft prompt logic
│   │   │   │   ├── useTracking.ts                 ← event tracking
│   │   │   │   ├── useShare.ts                    ← WhatsApp share
│   │   │   │   ├── useCareerPlan.ts               ← Career Agent output
│   │   │   │   ├── usePermissions.ts              ← Level 1-4 state + mutation
│   │   │   │   ├── useAgentActivity.ts            ← agent actions on user's behalf
│   │   │   │   ├── useApplicationAgent.ts         ← trigger + track agent apply
│   │   │   │   ├── useGeolocation.ts              ← browser location (optional)
│   │   │   │   └── useOffline.ts                  ← offline detection
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── firebase.ts                    ← Firebase client init
│   │   │   │   ├── firebase-admin.ts              ← Firebase Admin (server-side)
│   │   │   │   ├── bigquery.ts                    ← BigQuery client
│   │   │   │   ├── gemini.ts                      ← Gemini API client
│   │   │   │   ├── whatsapp.ts                    ← WhatsApp Business API
│   │   │   │   ├── matching.ts                    ← matching score functions
│   │   │   │   ├── seo.ts                         ← SEO meta helpers
│   │   │   │   ├── share.ts                       ← share URL generators
│   │   │   │   ├── analytics.ts                   ← event tracking client
│   │   │   │   ├── auth.ts                        ← auth helpers
│   │   │   │   └── cache.ts                       ← in-memory + Redis cache
│   │   │   │
│   │   │   ├── store/
│   │   │   │   ├── feedStore.ts                   ← Zustand: feed state
│   │   │   │   ├── filterStore.ts                 ← Zustand: active filters
│   │   │   │   ├── userStore.ts                   ← Zustand: current user
│   │   │   │   ├── permissionStore.ts             ← Zustand: Level 1-4 state
│   │   │   │   ├── careerStore.ts                 ← Zustand: career plan state
│   │   │   │   ├── agentActivityStore.ts          ← Zustand: recent agent actions
│   │   │   │   └── sessionStore.ts                ← Zustand: anonymous session
│   │   │   │
│   │   │   ├── types/
│   │   │   │   ├── opportunity.ts                 ← Opportunity type
│   │   │   │   ├── user.ts                        ← User + Profile types
│   │   │   │   ├── filter.ts                      ← Filter state types
│   │   │   │   ├── event.ts                       ← Analytics event types
│   │   │   │   └── api.ts                         ← API request/response types
│   │   │   │
│   │   │   ├── constants/
│   │   │   │   ├── trades.ts                      ← 12 trade categories + metadata
│   │   │   │   ├── provinces.ts                   ← 9 provinces + metadata
│   │   │   │   ├── qualifications.ts              ← NQF levels + TVET qualifications
│   │   │   │   ├── opportunityTypes.ts            ← 6 opportunity types
│   │   │   │   ├── setas.ts                       ← 21 SETAs + metadata
│   │   │   │   └── routes.ts                      ← app route constants
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── formatting.ts                  ← date, currency, string formatters
│   │   │       ├── slugify.ts                     ← opportunity slug generator
│   │   │       ├── validation.ts                  ← form validation helpers
│   │   │       ├── whatsappMessage.ts             ← WhatsApp message builder
│   │   │       └── classNames.ts                  ← Tailwind class merging
│   │   │
│   │   ├── .env.local                             ← local env vars (gitignored)
│   │   ├── .env.example                           ← env var template
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── postcss.config.js
│   │   └── package.json
│   │
│   │
│   ├── agents/                                    ← 8 AI employee services (Cloud Run)
│   │   │
│   │   ├── scout/                                 ← Agent 1: Scout (Opportunity Discovery)
│   │   │   ├── src/
│   │   │   │   ├── index.ts                       ← Cloud Run entry point
│   │   │   │   ├── runner.ts                      ← main agent orchestrator
│   │   │   │   ├── sources/                       ← source-specific crawlers
│   │   │   │   │   ├── index.ts                   ← source registry
│   │   │   │   │   ├── BaseCrawler.ts             ← abstract base class
│   │   │   │   │   ├── setas/
│   │   │   │   │   │   ├── MersetaCrawler.ts
│   │   │   │   │   │   ├── EwsetaCrawler.ts
│   │   │   │   │   │   ├── CetaCrawler.ts
│   │   │   │   │   │   ├── LgsetaCrawler.ts
│   │   │   │   │   │   ├── MqaCrawler.ts
│   │   │   │   │   │   ├── TetaCrawler.ts
│   │   │   │   │   │   ├── MictSetaCrawler.ts
│   │   │   │   │   │   ├── AgriSetaCrawler.ts
│   │   │   │   │   │   ├── ChietaCrawler.ts
│   │   │   │   │   │   ├── FassetCrawler.ts
│   │   │   │   │   │   ├── FoodbevCrawler.ts
│   │   │   │   │   │   ├── HwsetaCrawler.ts
│   │   │   │   │   │   ├── InsetaCrawler.ts
│   │   │   │   │   │   ├── PsetaCrawler.ts
│   │   │   │   │   │   ├── CathssetaCrawler.ts
│   │   │   │   │   │   ├── WrsetaCrawler.ts
│   │   │   │   │   │   ├── BanksetaCrawler.ts
│   │   │   │   │   │   ├── EtdpSetaCrawler.ts
│   │   │   │   │   │   ├── SassetaCrawler.ts
│   │   │   │   │   │   ├── ServicesSetaCrawler.ts
│   │   │   │   │   │   └── FietaCrawler.ts
│   │   │   │   │   ├── jobboards/
│   │   │   │   │   │   ├── IndeedSaCrawler.ts
│   │   │   │   │   │   ├── PnetCrawler.ts
│   │   │   │   │   │   ├── CareerJunctionCrawler.ts
│   │   │   │   │   │   ├── Careers24Crawler.ts
│   │   │   │   │   │   ├── JobMailCrawler.ts
│   │   │   │   │   │   └── GumtreeCrawler.ts
│   │   │   │   │   ├── government/
│   │   │   │   │   │   ├── GazetteParser.ts       ← Government Gazette PDFs
│   │   │   │   │   │   ├── DpsaVacancyCrawler.ts
│   │   │   │   │   │   ├── NambCrawler.ts         ← trade test dates
│   │   │   │   │   │   └── ProvincialSkillsCrawlers.ts
│   │   │   │   │   └── employers/
│   │   │   │   │       ├── EskomCrawler.ts
│   │   │   │   │       ├── TransnetCrawler.ts
│   │   │   │   │       ├── SasolCrawler.ts
│   │   │   │   │       └── [40+ more employer crawlers]
│   │   │   │   │
│   │   │   │   ├── deduplication/
│   │   │   │   │   ├── Deduplicator.ts            ← fuzzy match engine
│   │   │   │   │   └── similarity.ts              ← string similarity utils
│   │   │   │   │
│   │   │   │   ├── publisher/
│   │   │   │   │   ├── FirestorePublisher.ts      ← write to Firestore
│   │   │   │   │   └── PubSubNotifier.ts          ← publish new_opportunity event → Analyst
│   │   │   │   │
│   │   │   │   └── logging/
│   │   │   │       └── AgentLogger.ts             ← BigQuery run logging
│   │   │   │
│   │   │   ├── Dockerfile
│   │   │   ├── .env.example
│   │   │   ├── tsconfig.json
│   │   │   └── package.json
│   │   │
│   │   │
│   │   ├── analyst/                               ← Agent 2: Analyst (Opportunity Intelligence)
│   │   │   ├── src/
│   │   │   │   ├── index.ts                       ← Pub/Sub listener entry (new_opportunity)
│   │   │   │   ├── AnalystAgent.ts                ← main agent class
│   │   │   │   ├── extractor/
│   │   │   │   │   ├── GeminiExtractor.ts         ← structured intelligence extraction
│   │   │   │   │   ├── prompts.ts                 ← extraction + intelligence prompts
│   │   │   │   │   └── schema.ts                  ← OpportunityIntelligence schema
│   │   │   │   ├── intelligence/
│   │   │   │   │   ├── ApplicationComplexityScorer.ts  ← can Application Agent auto-apply?
│   │   │   │   │   ├── OrganisationReputationScorer.ts ← lookup from graph outcomes
│   │   │   │   │   ├── UrgencyScorer.ts           ← deadline + demand signals
│   │   │   │   │   ├── RequirementsParser.ts      ← extract checklist from description
│   │   │   │   │   └── HonestyLayer.ts            ← flags low stipends, poor outcomes
│   │   │   │   ├── publisher/
│   │   │   │   │   ├── FirestoreEnricher.ts       ← enrich opportunity with intelligence
│   │   │   │   │   └── PubSubNotifier.ts          ← publish opportunity_analysed → Quality
│   │   │   │   └── logging/
│   │   │   │       └── AnalystLogger.ts           ← BigQuery intelligence log
│   │   │   │
│   │   │   ├── Dockerfile
│   │   │   ├── tsconfig.json
│   │   │   └── package.json
│   │   │
│   │   │
│   │   ├── quality/                               ← Agent 3: Quality (Scam + Duplicate Filter)
│   │   │   ├── src/
│   │   │   │   ├── index.ts                       ← Pub/Sub listener entry
│   │   │   │   ├── QualityAgent.ts                ← main agent class
│   │   │   │   ├── rules/
│   │   │   │   │   ├── RulesEngine.ts             ← fast deterministic checks
│   │   │   │   │   ├── ScamDetector.ts            ← scam pattern matching
│   │   │   │   │   ├── DuplicateDetector.ts       ← cross-source duplicate check
│   │   │   │   │   ├── ExpiryChecker.ts           ← deadline validation
│   │   │   │   │   └── UrlValidator.ts            ← application URL check
│   │   │   │   ├── classifier/
│   │   │   │   │   ├── GeminiClassifier.ts        ← LLM quality scoring
│   │   │   │   │   └── prompts.ts
│   │   │   │   ├── sources/
│   │   │   │   │   └── SourceCredibility.ts       ← known source scoring
│   │   │   │   └── publisher/
│   │   │   │       ├── FirestoreUpdater.ts        ← update opportunity status
│   │   │   │       └── QualityLogger.ts           ← BigQuery decision log
│   │   │   │
│   │   │   ├── Dockerfile
│   │   │   ├── tsconfig.json
│   │   │   └── package.json
│   │   │
│   │   │
│   │   ├── matching/                              ← Agent 4: Matching (Personalised Ranking)
│   │   │   ├── src/
│   │   │   │   ├── index.ts                       ← HTTP server entry (called by web API)
│   │   │   │   ├── MatchingAgent.ts               ← main agent class
│   │   │   │   ├── context/
│   │   │   │   │   ├── AnonymousContext.ts        ← build context for anon users
│   │   │   │   │   └── AuthenticatedContext.ts    ← build context for logged-in users
│   │   │   │   ├── scoring/
│   │   │   │   │   ├── TradeScorer.ts             ← trade match scoring
│   │   │   │   │   ├── LocationScorer.ts          ← province/city scoring
│   │   │   │   │   ├── QualificationScorer.ts     ← NQF level fit scoring
│   │   │   │   │   ├── FreshnessScorer.ts         ← recency scoring
│   │   │   │   │   ├── GraphScorer.ts             ← graph outcome signals
│   │   │   │   │   └── CompositeScorer.ts         ← weighted combination
│   │   │   │   ├── explanation/
│   │   │   │   │   ├── MatchExplainer.ts          ← Gemini explanation generator
│   │   │   │   │   └── prompts.ts
│   │   │   │   ├── ranking/
│   │   │   │   │   └── VertexRanker.ts            ← Vertex AI Ranking API
│   │   │   │   ├── training/
│   │   │   │   │   └── WeeklyRetrainer.ts         ← weekly model retrain on outcomes
│   │   │   │   └── cache/
│   │   │   │       └── RankingCache.ts            ← Redis cache for rankings
│   │   │   │
│   │   │   ├── Dockerfile
│   │   │   ├── tsconfig.json
│   │   │   └── package.json
│   │   │
│   │   │
│   │   ├── career/                                ← Agent 5: Career (Path Intelligence)
│   │   │   ├── src/
│   │   │   │   ├── index.ts                       ← HTTP + Pub/Sub entry
│   │   │   │   ├── CareerAgent.ts                 ← main agent class
│   │   │   │   ├── analysis/
│   │   │   │   │   ├── SkillsGapAnalyser.ts       ← current skills vs goal gap
│   │   │   │   │   ├── CareerPathMapper.ts        ← map steps to target role
│   │   │   │   │   ├── QualificationAdviser.ts    ← which quals to pursue next
│   │   │   │   │   └── TimelineEstimator.ts       ← realistic timeline from graph data
│   │   │   │   ├── graph/
│   │   │   │   │   ├── GraphCareerQuery.ts        ← query graph for similar career paths
│   │   │   │   │   └── OutcomePatternMatcher.ts   ← what worked for similar workers
│   │   │   │   ├── messaging/
│   │   │   │   │   ├── CareerPlanBuilder.ts       ← build career plan WhatsApp message
│   │   │   │   │   ├── WeeklyUpdateBuilder.ts     ← weekly career insight message
│   │   │   │   │   └── prompts.ts
│   │   │   │   ├── storage/
│   │   │   │   │   └── CareerPlanStore.ts         ← persist career plans to Firestore
│   │   │   │   └── logging/
│   │   │   │       └── CareerLogger.ts            ← BigQuery career plan log
│   │   │   │
│   │   │   ├── Dockerfile
│   │   │   ├── tsconfig.json
│   │   │   └── package.json
│   │   │
│   │   │
│   │   ├── application/                           ← Agent 6: Application (Autonomous Apply)
│   │   │   ├── src/
│   │   │   │   ├── index.ts                       ← HTTP entry (triggered by user permission tap)
│   │   │   │   ├── ApplicationAgent.ts            ← main agent class
│   │   │   │   ├── permission/
│   │   │   │   │   ├── PermissionChecker.ts       ← validate user permission level
│   │   │   │   │   ├── MatchThresholdGuard.ts     ← enforce Level 3 >85% rule
│   │   │   │   │   └── ConsentVerifier.ts         ← POPIA consent check before applying
│   │   │   │   ├── documents/
│   │   │   │   │   ├── CVGenerator.ts             ← Gemini: tailored CV generation
│   │   │   │   │   ├── CoverLetterGenerator.ts    ← Gemini: specific cover letter
│   │   │   │   │   ├── DocumentAssembler.ts       ← combine into PDF/Word output
│   │   │   │   │   └── prompts.ts                 ← CV + cover letter generation prompts
│   │   │   │   ├── submission/
│   │   │   │   │   ├── EmailSubmitter.ts          ← Gmail API / SMTP email applications
│   │   │   │   │   ├── WebFormSubmitter.ts        ← Playwright web form automation
│   │   │   │   │   ├── PortalSubmitter.ts         ← SETA/employer portal specific
│   │   │   │   │   └── SubmissionRouter.ts        ← route to correct submitter by method
│   │   │   │   ├── browser/
│   │   │   │   │   ├── PlaywrightManager.ts       ← Playwright browser lifecycle
│   │   │   │   │   ├── FormFiller.ts              ← intelligent form field mapping
│   │   │   │   │   ├── CaptchaHandler.ts          ← CAPTCHA detection + fallback
│   │   │   │   │   └── ScreenshotCapture.ts       ← capture confirmation for records
│   │   │   │   ├── tracking/
│   │   │   │   │   ├── ApplicationTracker.ts      ← track status post-submission
│   │   │   │   │   ├── ConfirmationParser.ts      ← extract reference numbers
│   │   │   │   │   └── FollowUpScheduler.ts       ← schedule outcome tracker follow-up
│   │   │   │   └── logging/
│   │   │   │       └── ApplicationLogger.ts       ← BigQuery application_submitted log
│   │   │   │
│   │   │   ├── Dockerfile
│   │   │   ├── tsconfig.json
│   │   │   └── package.json
│   │   │
│   │   │
│   │   ├── revenue/                               ← Agent 7: Revenue (Monetisation Intelligence)
│   │   │   ├── src/
│   │   │   │   ├── index.ts                       ← Cloud Functions entry (event-driven)
│   │   │   │   ├── RevenueAgent.ts                ← main agent class
│   │   │   │   ├── triggers/
│   │   │   │   │   ├── TriggerClassifier.ts       ← classify which trigger fired
│   │   │   │   │   ├── HighMatchTrigger.ts        ← user viewed 85%+ match 3x
│   │   │   │   │   ├── CareerMilestoneTrigger.ts  ← career agent sent plan
│   │   │   │   │   ├── ApplicationSuccessTrigger.ts ← user applied manually 2x
│   │   │   │   │   ├── InactivityRiskTrigger.ts   ← user hasn't visited in 7 days
│   │   │   │   │   └── OrganicUpgradeTrigger.ts   ← user visited upgrade page
│   │   │   │   ├── decisions/
│   │   │   │   │   ├── ActionDecider.ts           ← upgrade_prompt / retention / nothing
│   │   │   │   │   ├── PricingOptimiser.ts        ← personalised price suggestion
│   │   │   │   │   └── TimingOptimiser.ts         ← when to send (best engagement window)
│   │   │   │   ├── experiments/
│   │   │   │   │   ├── ABTestManager.ts           ← manage concurrent pricing experiments
│   │   │   │   │   ├── ExperimentLogger.ts        ← log variants + outcomes to BigQuery
│   │   │   │   │   └── WinnerDetector.ts          ← auto-promote winning variant
│   │   │   │   ├── messaging/
│   │   │   │   │   ├── UpgradePromptBuilder.ts    ← Gemini: personalised upgrade message
│   │   │   │   │   ├── RetentionOfferBuilder.ts   ← pause/discount offer
│   │   │   │   │   └── prompts.ts
│   │   │   │   ├── employer/
│   │   │   │   │   ├── EmployerUpsellDetector.ts  ← when employer ready for SaaS upgrade
│   │   │   │   │   └── SetaContractScorer.ts      ← SETA relationship readiness score
│   │   │   │   └── logging/
│   │   │   │       └── RevenueDecisionLogger.ts   ← BigQuery: every decision + outcome
│   │   │   │
│   │   │   ├── Dockerfile
│   │   │   ├── tsconfig.json
│   │   │   └── package.json
│   │   │
│   │   │
│   │   ├── growth/                                ← Agent 8: Growth (Acquisition + Retention)
│   │   │   ├── src/
│   │   │   │   ├── index.ts                       ← Cloud Scheduler entry (daily)
│   │   │   │   ├── GrowthAgent.ts                 ← main agent class
│   │   │   │   ├── content/
│   │   │   │   │   ├── ContentCalendar.ts         ← daily content plan generator
│   │   │   │   │   ├── OpportunityPostGenerator.ts ← "found this apprenticeship" posts
│   │   │   │   │   ├── TradeExplainerGenerator.ts ← "what is a learnership" content
│   │   │   │   │   ├── SuccessStoryGenerator.ts   ← user placement story posts
│   │   │   │   │   └── prompts.ts
│   │   │   │   ├── publishing/
│   │   │   │   │   ├── MetaPublisher.ts           ← Facebook/Instagram Graph API
│   │   │   │   │   ├── LinkedInPublisher.ts       ← LinkedIn API
│   │   │   │   │   └── PublishingScheduler.ts     ← optimal time scheduling
│   │   │   │   ├── community/
│   │   │   │   │   ├── AmbassadorIdentifier.ts    ← find top sharers
│   │   │   │   │   ├── WhatsAppSeeder.ts          ← seed opportunities to groups
│   │   │   │   │   └── ReferralManager.ts         ← track + reward referrals
│   │   │   │   ├── seo/
│   │   │   │   │   ├── KeywordMonitor.ts          ← Search Console API monitoring
│   │   │   │   │   ├── ContentPageGenerator.ts    ← auto-generate trade/province pages
│   │   │   │   │   └── SitemapUpdater.ts          ← update sitemap.xml after generation
│   │   │   │   └── logging/
│   │   │   │       └── GrowthLogger.ts            ← BigQuery growth actions log
│   │   │   │
│   │   │   ├── Dockerfile
│   │   │   ├── tsconfig.json
│   │   │   └── package.json
│   │   │
│   │   │
│   │   ├── customer-success/                      ← Agent 9: Customer Success (Support + Onboarding)
│   │   │   ├── src/
│   │   │   │   ├── index.ts                       ← Always-on WhatsApp listener
│   │   │   │   ├── CustomerSuccessAgent.ts        ← main agent class
│   │   │   │   ├── onboarding/
│   │   │   │   │   ├── OnboardingOrchestrator.ts  ← manage 30-day onboarding journey
│   │   │   │   │   ├── Day0Welcome.ts             ← welcome message + first matches
│   │   │   │   │   ├── Day1Nudge.ts               ← if no activity, morning nudge
│   │   │   │   │   ├── Day3ProfileCompletion.ts   ← profile completion prompt
│   │   │   │   │   ├── Day7CareerIntro.ts         ← career agent introduction
│   │   │   │   │   ├── Day14ApplicationIntro.ts   ← application agent introduction
│   │   │   │   │   └── OnboardingState.ts         ← track user's onboarding stage
│   │   │   │   ├── support/
│   │   │   │   │   ├── QueryClassifier.ts         ← classify inbound message type
│   │   │   │   │   ├── HowItWorksHandler.ts       ← explain Skilved + agents
│   │   │   │   │   ├── OpportunityQueryHandler.ts ← "can't find X" queries
│   │   │   │   │   ├── LegitimacyHandler.ts       ← "is this opportunity real?"
│   │   │   │   │   ├── ApplicationStatusHandler.ts← "did my application go through?"
│   │   │   │   │   ├── ProfileHelpHandler.ts      ← "how do I improve my profile?"
│   │   │   │   │   ├── CancellationHandler.ts     ← retention flow before cancel
│   │   │   │   │   ├── PlacementSuccessHandler.ts ← "I got the job!" celebration + outcome
│   │   │   │   │   └── EscalationHandler.ts       ← flag for weekly human review
│   │   │   │   ├── conversation/
│   │   │   │   │   ├── ConversationHistory.ts     ← Firestore conversation state
│   │   │   │   │   ├── ContextBuilder.ts          ← build Gemini context from history
│   │   │   │   │   └── ResponseGenerator.ts       ← Gemini response generation
│   │   │   │   └── logging/
│   │   │   │       └── SupportLogger.ts           ← BigQuery support interaction log
│   │   │   │
│   │   │   ├── Dockerfile
│   │   │   ├── tsconfig.json
│   │   │   └── package.json
│   │   │
│   │   │
│   │   ├── notification/                          ← Daily WhatsApp digest agent
│   │   │   ├── src/
│   │   │   │   ├── index.ts                       ← Cloud Scheduler HTTP entry
│   │   │   │   ├── NotificationAgent.ts           ← main agent class
│   │   │   │   ├── digest/
│   │   │   │   │   ├── DigestBuilder.ts           ← select opportunities per user
│   │   │   │   │   ├── DigestPersonaliser.ts      ← Gemini message personalisation
│   │   │   │   │   └── prompts.ts
│   │   │   │   ├── delivery/
│   │   │   │   │   ├── WhatsAppSender.ts          ← WhatsApp API sender
│   │   │   │   │   ├── MessageTemplates.ts        ← approved WA message templates
│   │   │   │   │   └── DeliveryTracker.ts         ← sent/delivered/read tracking
│   │   │   │   ├── preferences/
│   │   │   │   │   └── UserPreferences.ts         ← opt-out, backoff logic
│   │   │   │   └── logging/
│   │   │   │       └── DigestLogger.ts            ← BigQuery digest log
│   │   │   │
│   │   │   ├── Dockerfile
│   │   │   ├── tsconfig.json
│   │   │   └── package.json
│   │   │
│   │   │
│   │   ├── outcome-tracker/                       ← Application outcome tracking agent
│   │   │   ├── src/
│   │   │   │   ├── index.ts                       ← Cloud Functions entry
│   │   │   │   ├── OutcomeAgent.ts                ← main agent class
│   │   │   │   ├── triggers/
│   │   │   │   │   ├── ApplyEventHandler.ts       ← fires on apply_click or application_submitted
│   │   │   │   │   └── ScheduledFollowUp.ts       ← day 3, 14, 30 follow-ups
│   │   │   │   ├── followup/
│   │   │   │   │   ├── FollowUpBuilder.ts         ← build follow-up messages
│   │   │   │   │   ├── FollowUpSender.ts          ← WhatsApp sender
│   │   │   │   │   └── ResponseParser.ts          ← classify user reply to outcome
│   │   │   │   ├── graph/
│   │   │   │   │   ├── OutcomeWriter.ts           ← write outcomes to BigQuery
│   │   │   │   │   └── GraphUpdater.ts            ← update graph derived tables
│   │   │   │   └── logging/
│   │   │   │       └── OutcomeLogger.ts
│   │   │   │
│   │   │   ├── Dockerfile
│   │   │   ├── tsconfig.json
│   │   │   └── package.json
│   │   │
│   │   │
│   │   └── webhook-handler/                       ← Incoming WhatsApp webhooks router
│   │       ├── src/
│   │       │   ├── index.ts                       ← Express server
│   │       │   ├── router.ts                      ← route incoming messages
│   │       │   ├── handlers/
│   │       │   │   ├── OtpHandler.ts              ← OTP verification replies
│   │       │   │   ├── OutcomeReplyHandler.ts     ← outcome follow-up replies
│   │       │   │   ├── DigestReplyHandler.ts      ← digest opt-out / queries
│   │       │   │   ├── CustomerSuccessRouter.ts   ← route to customer-success agent
│   │       │   │   ├── PermissionReplyHandler.ts  ← Level change requests
│   │       │   │   └── UnknownMessageHandler.ts   ← fallback handler
│   │       │   └── verification/
│   │       │       └── WebhookVerifier.ts         ← Meta webhook signature verify
│   │       │
│   │       ├── Dockerfile
│   │       ├── tsconfig.json
│   │       └── package.json
│   │
│   │
│   └── admin/                                     ← Internal admin + XPRIZE demo dashboard
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx                       ← admin home / 8-agent overview
│       │   │   ├── autonomy/
│       │   │   │   └── page.tsx                   ← XPRIZE: 24h decisions, 0 human approvals
│       │   │   ├── opportunities/
│       │   │   │   ├── page.tsx                   ← opportunity management
│       │   │   │   └── [id]/
│       │   │   │       └── page.tsx               ← detail + edit + analyst output
│       │   │   ├── agents/
│       │   │   │   ├── page.tsx                   ← all 8 agents health + run logs
│       │   │   │   ├── scout/
│       │   │   │   │   └── page.tsx               ← scout run history + source health
│       │   │   │   ├── analyst/
│       │   │   │   │   └── page.tsx               ← intelligence extract quality
│       │   │   │   ├── quality/
│       │   │   │   │   └── page.tsx               ← quality decisions + review queue
│       │   │   │   ├── matching/
│       │   │   │   │   └── page.tsx               ← model version + ranking accuracy
│       │   │   │   ├── career/
│       │   │   │   │   └── page.tsx               ← career plans generated + engagement
│       │   │   │   ├── application/
│       │   │   │   │   └── page.tsx               ← submission log + success rate
│       │   │   │   ├── revenue/
│       │   │   │   │   └── page.tsx               ← revenue decisions + A/B experiments
│       │   │   │   ├── growth/
│       │   │   │   │   └── page.tsx               ← content calendar + community metrics
│       │   │   │   └── customer-success/
│       │   │   │       └── page.tsx               ← support queries + escalation queue
│       │   │   ├── users/
│       │   │   │   ├── page.tsx                   ← user management
│       │   │   │   └── permissions/
│       │   │   │       └── page.tsx               ← Level 1-4 distribution + progression
│       │   │   ├── employers/
│       │   │   │   └── page.tsx                   ← employer CRM + revenue pipeline
│       │   │   ├── setas/
│       │   │   │   └── page.tsx                   ← SETA partnership management
│       │   │   ├── graph/
│       │   │   │   └── page.tsx                   ← graph analytics + skills insights
│       │   │   └── metrics/
│       │   │       └── page.tsx                   ← business metrics dashboard
│       │   │
│       │   └── components/
│       │       ├── AutonomyDashboard.tsx           ← XPRIZE: 24h decisions, 0 approvals
│       │       ├── AgentHealthCard.tsx             ← per-agent status + last run
│       │       ├── AgentRunTable.tsx               ← sortable run history table
│       │       ├── OpportunityTable.tsx
│       │       ├── QualityReviewCard.tsx
│       │       ├── MetricsChart.tsx
│       │       ├── GraphInsights.tsx
│       │       ├── ApplicationLog.tsx              ← all autonomous applications
│       │       ├── RevenueDecisionLog.tsx          ← revenue agent decision history
│       │       ├── PermissionLevelChart.tsx        ← Level 1-4 distribution
│       │       ├── GrowthContentCalendar.tsx       ← agent-generated content log
│       │       └── EscalationQueue.tsx             ← CS agent escalations for review
│       │
│       ├── tsconfig.json
│       └── package.json
│
│
├── packages/                                      ← shared packages
│   │
│   ├── types/                                     ← shared TypeScript types
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── opportunity.ts                     ← Opportunity + OpportunityIntelligence
│   │   │   ├── user.ts                            ← User + Profile + PermissionLevel
│   │   │   ├── permission.ts                      ← Level 1-4 permission model types
│   │   │   ├── agent.ts                           ← all 8 agent run + decision types
│   │   │   ├── application.ts                     ← Application + ApplicationAgent types
│   │   │   ├── career.ts                          ← CareerPlan + CareerAgent types
│   │   │   ├── revenue.ts                         ← RevenueTrigger + RevenueDecision types
│   │   │   ├── event.ts                           ← analytics event taxonomy
│   │   │   ├── graph.ts                           ← SkillsGraph + Outcome types
│   │   │   └── api.ts                             ← API request/response types
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── utils/                                     ← shared utilities
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── date.ts                            ← date formatting, freshness calc
│   │   │   ├── currency.ts                        ← ZAR formatting
│   │   │   ├── slug.ts                            ← slug generation
│   │   │   ├── fuzzy.ts                           ← fuzzy string matching
│   │   │   ├── validation.ts                      ← shared validation functions
│   │   │   └── constants.ts                       ← shared constants
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── ui/                                        ← shared component library
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Progress.tsx
│   │   │   └── theme.ts                           ← design tokens
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── config/                                    ← shared configs
│   │   ├── eslint/
│   │   │   └── index.js                           ← shared ESLint config
│   │   ├── typescript/
│   │   │   ├── base.json                          ← base TS config
│   │   │   ├── nextjs.json                        ← Next.js TS config
│   │   │   └── node.json                          ← Node TS config
│   │   ├── tailwind/
│   │   │   └── index.ts                           ← shared Tailwind config
│   │   └── package.json
│   │
│   └── database/                                  ← database clients + schemas
│       ├── src/
│       │   ├── firestore/
│       │   │   ├── client.ts                      ← Firestore client init
│       │   │   ├── collections.ts                 ← collection name constants
│       │   │   ├── opportunities.ts               ← opportunity CRUD
│       │   │   ├── users.ts                       ← user profile CRUD
│       │   │   ├── applications.ts                ← application tracking
│       │   │   └── sessions.ts                    ← anonymous session store
│       │   ├── bigquery/
│       │   │   ├── client.ts                      ← BigQuery client init
│       │   │   ├── events.ts                      ← event ingestion
│       │   │   ├── outcomes.ts                    ← outcome writes + queries
│       │   │   ├── graph.ts                       ← graph queries
│       │   │   └── analytics.ts                   ← metrics queries
│       │   └── redis/
│       │       ├── client.ts                      ← Redis client (Cloud Memorystore)
│       │       └── cache.ts                       ← cache helpers
│       ├── tsconfig.json
│       └── package.json
│
│
├── infrastructure/                                ← Terraform (GCP)
│   ├── environments/
│   │   ├── dev/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── terraform.tfvars
│   │   ├── staging/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── terraform.tfvars
│   │   └── prod/
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       └── terraform.tfvars
│   │
│   ├── modules/
│   │   ├── cloud-run/
│   │   │   ├── main.tf                            ← Cloud Run service module
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── cloud-scheduler/
│   │   │   ├── main.tf                            ← scheduler jobs
│   │   │   └── variables.tf
│   │   ├── pubsub/
│   │   │   ├── main.tf                            ← Pub/Sub topics + subscriptions
│   │   │   └── variables.tf
│   │   ├── bigquery/
│   │   │   ├── main.tf                            ← datasets + tables
│   │   │   ├── schema/
│   │   │   │   ├── opportunities.json
│   │   │   │   ├── users.json
│   │   │   │   ├── events.json
│   │   │   │   ├── outcomes.json
│   │   │   │   ├── agent_runs.json
│   │   │   │   └── quality_decisions.json
│   │   │   └── views/
│   │   │       ├── daily_metrics.sql
│   │   │       ├── graph_insights.sql
│   │   │       ├── agent_health.sql
│   │   │       └── revenue_metrics.sql
│   │   ├── firestore/
│   │   │   ├── main.tf
│   │   │   └── indexes.tf                         ← Firestore composite indexes
│   │   ├── vertex-ai/
│   │   │   ├── main.tf                            ← Vertex AI Search + Ranking
│   │   │   └── variables.tf
│   │   ├── secret-manager/
│   │   │   ├── main.tf                            ← secrets (API keys)
│   │   │   └── variables.tf
│   │   ├── monitoring/
│   │   │   ├── main.tf                            ← dashboards + alerting
│   │   │   ├── dashboards/
│   │   │   │   ├── agent-health.json
│   │   │   │   └── business-metrics.json
│   │   │   └── alerts/
│   │   │       ├── agent-failure.tf
│   │   │       ├── high-latency.tf
│   │   │       └── low-opportunity-count.tf
│   │   └── iam/
│   │       ├── main.tf                            ← service accounts + roles
│   │       └── variables.tf
│   │
│   ├── main.tf                                    ← root module
│   ├── providers.tf                               ← GCP provider config
│   ├── variables.tf
│   ├── outputs.tf
│   └── backend.tf                                 ← Terraform state (GCS bucket)
│
│
├── scripts/
│   ├── seed/
│   │   ├── seed-opportunities.ts                  ← seed initial opportunity data
│   │   ├── seed-users.ts                          ← seed test users
│   │   └── seed-seta-sources.ts                   ← seed SETA source list
│   ├── migration/
│   │   ├── migrate-schema.ts                      ← Firestore schema migrations
│   │   └── backfill-graph.ts                      ← backfill historical graph data
│   ├── analysis/
│   │   ├── quality-audit.ts                       ← spot-check quality agent
│   │   └── graph-report.ts                        ← generate graph insights report
│   └── setup/
│       ├── create-gcp-project.sh                  ← new project setup
│       ├── enable-apis.sh                         ← enable all required GCP APIs
│       └── create-service-accounts.sh             ← IAM setup
│
│
├── docs/
│   ├── architecture/
│   │   ├── overview.md                            ← system architecture overview
│   │   ├── agent-design.md                        ← agent design decisions
│   │   ├── data-model.md                          ← Firestore + BigQuery schemas
│   │   └── adr/                                   ← Architecture Decision Records
│   │       ├── 001-monorepo.md
│   │       ├── 002-nextjs-vercel.md
│   │       ├── 003-firestore-vs-postgres.md
│   │       ├── 004-bigquery-for-graph.md
│   │       └── 005-whatsapp-first.md
│   ├── api/
│   │   ├── feed.md                                ← feed API docs
│   │   ├── opportunities.md
│   │   ├── profile.md
│   │   └── webhooks.md
│   ├── agents/
│   │   ├── discovery.md
│   │   ├── quality.md
│   │   ├── matching.md
│   │   ├── notification.md
│   │   └── outcome-tracker.md
│   ├── runbooks/
│   │   ├── agent-failure.md                       ← what to do when agent fails
│   │   ├── data-breach.md                         ← incident response
│   │   ├── deploy.md                              ← deployment guide
│   │   └── rollback.md                            ← how to rollback
│   └── contributing.md                            ← contribution guide
│
│
├── turbo.json                                     ← Turborepo config
├── package.json                                   ← monorepo root (workspaces)
├── pnpm-workspace.yaml                            ← pnpm workspaces
├── .gitignore
├── .env.example                                   ← root env template
├── README.md                                      ← project overview
└── CLAUDE.md                                      ← AI context file (for Claude Code)
```

---

## Key Files Explained

### `turbo.json` — Monorepo Pipeline
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {},
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

### `CLAUDE.md` — AI Context File
This file tells Claude Code everything it needs to know about the codebase:
- Monorepo structure
- Which agent does what
- GCP service mapping
- Coding conventions
- How to run locally
- Environment variables required

### `.env.example` (root)
```bash
# GCP
GCP_PROJECT_ID=
GCP_REGION=africa-south1

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Gemini
GEMINI_API_KEY=

# Vertex AI
VERTEX_AI_LOCATION=africa-south1

# WhatsApp Business API
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=

# BigQuery
BIGQUERY_DATASET=skilved_prod

# Redis (Cloud Memorystore)
REDIS_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Vercel (web deployment)
NEXT_PUBLIC_APP_URL=https://skilved.com
```

---

## GCP Region Note

**Primary region:** `africa-south1` (Johannesburg)

This is the correct region for Skilved. Lower latency for SA users, data residency in SA (POPIA compliance benefit), and it signals commitment to African cloud infrastructure.

Available services in `africa-south1`: Cloud Run, Cloud Storage, Firestore, BigQuery, Pub/Sub, Cloud Scheduler, Secret Manager, Cloud Monitoring.

**Note:** Vertex AI Search and Vertex AI Ranking are not yet available in `africa-south1`. Use `us-central1` for Vertex AI services with VPC peering or direct API calls. This is acceptable for MVP — data is processed in Johannesburg, AI calls go to `us-central1`.

---

## Development Setup

```bash
# Clone repo
git clone https://github.com/skilved/skilved.git
cd skilved

# Install dependencies (pnpm workspaces)
pnpm install

# Copy env files
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
# ... fill in GCP credentials

# Start all apps in dev mode
pnpm dev

# Start specific app
pnpm --filter web dev
pnpm --filter agents/discovery dev

# Build all
pnpm build

# Lint all
pnpm lint

# Typecheck all
pnpm typecheck

# Run tests
pnpm test
```

---

*Document version 1.0 — June 2026*  
*Owner: Engineering*
