# Skilved

> AI-powered skills opportunity platform for South Africa — a Turborepo monorepo.

Skilved discovers, analyses, ranks, and helps workers apply to apprenticeships, learnerships, and trade opportunities across South Africa, powered by a fleet of autonomous AI agents.

## Architecture

This is a **Turborepo** monorepo managed with **pnpm workspaces**.

```
skilved/
├── apps/
│   ├── web/        ← Next.js frontend (PWA)
│   ├── agents/     ← Agent services (Cloud Run)
│   └── admin/      ← Internal admin dashboard
├── packages/
│   ├── types/      ← shared TypeScript types
│   ├── utils/      ← shared utilities
│   ├── ui/         ← shared component library
│   ├── config/     ← shared configs (ESLint, TS, Tailwind)
│   └── database/   ← Firestore + BigQuery clients
├── infrastructure/ ← GCP infrastructure as code (Terraform)
├── scripts/        ← one-off scripts, data migration
├── docs/           ← technical documentation
└── .github/        ← CI/CD workflows
```

## Agents

| Agent | Purpose |
| --- | --- |
| scout | Opportunity discovery (crawlers) |
| analyst | Opportunity intelligence extraction |
| quality | Scam + duplicate filtering |
| matching | Personalised ranking |
| career | Career path intelligence |
| application | Autonomous application submission |
| revenue | Monetisation intelligence |
| growth | Acquisition + retention |
| customer-success | Support + onboarding |
| notification | Daily WhatsApp digest |
| outcome-tracker | Application outcome tracking |
| webhook-handler | Incoming WhatsApp webhook router |

## Development Setup

```bash
# Install dependencies (pnpm workspaces)
pnpm install

# Copy env files
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
# ... fill in GCP credentials

# Start all apps in dev mode
pnpm dev

# Start a specific app
pnpm --filter web dev

# Build / lint / typecheck / test all
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

## GCP Region

**Primary region:** `africa-south1` (Johannesburg) for low latency and POPIA data residency. Vertex AI Search and Ranking run in `us-central1` (not yet available in `africa-south1`).

---

*See [`docs/`](./docs) for full technical documentation.*
