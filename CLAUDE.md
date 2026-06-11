# CLAUDE.md — AI Context File

This file gives AI coding assistants the context needed to work effectively in the Skilved codebase.

## What is Skilved?

Skilved is an AI-powered skills opportunity platform for South Africa. It discovers apprenticeships, learnerships, and trade opportunities, analyses them for quality and intelligence, ranks them per user, and can autonomously apply on a worker's behalf (subject to a Level 1-4 permission model). WhatsApp is the primary engagement channel.

## Monorepo Structure

- **Turborepo** + **pnpm workspaces**.
- `apps/web` — Next.js 14 App Router PWA (deployed to Vercel).
- `apps/admin` — internal admin + XPRIZE demo dashboard.
- `apps/agents/*` — independent Cloud Run / Cloud Functions agent services.
- `packages/*` — shared `types`, `utils`, `ui`, `config`, `database`.
- `infrastructure/` — Terraform for GCP.
- `scripts/` — seed, migration, analysis, setup scripts.

## The Agents (what each does)

1. **scout** — crawls SETAs, job boards, government sources, employers for opportunities.
2. **analyst** — Gemini-based structured intelligence extraction + honesty layer.
3. **quality** — scam detection, duplicate detection, expiry + URL validation.
4. **matching** — personalised ranking (trade/location/qualification/freshness/graph scorers, Vertex AI Ranking).
5. **career** — skills-gap analysis and career path mapping from graph data.
6. **application** — autonomous CV/cover letter generation and submission (email, web form, portal) via Playwright.
7. **revenue** — monetisation triggers, pricing experiments, upgrade/retention messaging.
8. **growth** — content generation, social publishing, community + SEO.
9. **customer-success** — WhatsApp onboarding journey + support handlers.
10. **notification** — daily personalised WhatsApp digest.
11. **outcome-tracker** — follow-ups and outcome writes back to the graph.
12. **webhook-handler** — routes incoming WhatsApp webhooks to the right agent.

## GCP Service Mapping

- **Firestore** — operational data (opportunities, users, applications, sessions).
- **BigQuery** — events, outcomes, graph, analytics, agent run logs.
- **Pub/Sub** — agent-to-agent events (e.g. `new_opportunity`, `opportunity_analysed`).
- **Cloud Run** — long-running agent services and HTTP endpoints.
- **Cloud Scheduler** — periodic agents (scout, notification, growth).
- **Cloud Functions** — event-driven agents (revenue, outcome-tracker).
- **Vertex AI** — Search + Ranking (in `us-central1`).
- **Secret Manager** — API keys.
- **Redis (Memorystore)** — ranking + general caching.

## Coding Conventions

- TypeScript everywhere. Shared types live in `packages/types`.
- Web app uses Next.js App Router, Zustand for client state, hooks for data.
- Agents are plain Node/TS services with a clear entry (`index.ts`) and orchestrator class.
- Never duplicate logic that belongs in `packages/utils` or `packages/database`.

## Running Locally

```bash
pnpm install
pnpm dev                 # all apps
pnpm --filter web dev    # just the web app
```

## Required Environment Variables

See `.env.example` (root) and `apps/web/.env.example`. Key vars: `GCP_PROJECT_ID`, `GCP_REGION=africa-south1`, `FIREBASE_*`, `GEMINI_API_KEY`, `VERTEX_AI_LOCATION`, `WHATSAPP_*`, `BIGQUERY_DATASET`, `REDIS_URL`, `NEXTAUTH_*`, `NEXT_PUBLIC_APP_URL`.
