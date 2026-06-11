# Skilved — CI/CD & Deployment
### GitHub Actions + Vercel + Cloud Run | Version 1.0 | June 2026

---

## Overview

Skilved uses a trunk-based development model with three environments:

| Environment | Branch | URL | Deploy trigger |
|---|---|---|---|
| Development | feature branches | localhost | Manual (`pnpm dev`) |
| Staging | `main` | staging.skilved.com | Auto on merge to `main` |
| Production | `main` (tagged) | skilved.com | Manual release tag |

**Web app:** Deployed to Vercel (automatic preview on PR, staging on main)  
**Agents:** Deployed to Cloud Run via GitHub Actions  
**Infrastructure:** Terraform applied via GitHub Actions on infra changes

---

## Branch Strategy

```
main                    ← production-ready code, always deployable
  └── feature/feed-filters
  └── feature/quality-agent-v2
  └── fix/opportunity-expiry-bug
  └── agent/discovery-new-sources
```

**Rules:**
- No direct commits to `main`
- All changes via pull request
- Minimum 1 reviewer approval required
- All CI checks must pass before merge
- Squash merge only (clean history)

---

## GitHub Actions Workflows

### `ci.yml` — Continuous Integration

Runs on every PR and push to `main`.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    services:
      firestore-emulator:
        image: gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
        env:
          FIRESTORE_EMULATOR_HOST: localhost:8080

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
```

---

### `deploy-web.yml` — Deploy Web App to Vercel

Vercel handles this automatically via GitHub integration. No separate workflow needed.

**Vercel settings:**
```
Framework: Next.js
Root directory: apps/web
Build command: cd ../.. && pnpm build --filter web
Output directory: apps/web/.next
Install command: pnpm install --frozen-lockfile
```

**Preview deployments:** Every PR gets a unique preview URL.  
**Staging:** Every merge to `main` deploys to staging.skilved.com.  
**Production:** Promoted via Vercel dashboard or CLI on release.

---

### `deploy-agents.yml` — Deploy Agents to Cloud Run

```yaml
name: Deploy Agents

on:
  push:
    branches: [main]
    paths:
      - 'apps/agents/**'
      - 'packages/**'

env:
  GCP_PROJECT_ID: skilved-prod
  GCP_REGION: africa-south1
  REGISTRY: gcr.io

jobs:
  deploy-discovery:
    runs-on: ubuntu-latest
    if: |
      contains(github.event.head_commit.modified, 'apps/agents/discovery')
      || contains(github.event.head_commit.modified, 'packages/')
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to GCP
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker

      - name: Build and push Docker image
        run: |
          docker build \
            -f apps/agents/discovery/Dockerfile \
            -t $REGISTRY/$GCP_PROJECT_ID/discovery-agent:$GITHUB_SHA \
            -t $REGISTRY/$GCP_PROJECT_ID/discovery-agent:latest \
            .
          docker push $REGISTRY/$GCP_PROJECT_ID/discovery-agent:$GITHUB_SHA
          docker push $REGISTRY/$GCP_PROJECT_ID/discovery-agent:latest

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy discovery-agent \
            --image $REGISTRY/$GCP_PROJECT_ID/discovery-agent:$GITHUB_SHA \
            --region $GCP_REGION \
            --platform managed \
            --no-allow-unauthenticated \
            --memory 2Gi \
            --cpu 2 \
            --timeout 3600 \
            --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest"

  # Repeat for quality, matching, notification, outcome-tracker, webhook-handler
  deploy-quality:
    runs-on: ubuntu-latest
    # ... similar steps with quality-agent image

  deploy-matching:
    runs-on: ubuntu-latest
    # ... similar steps with matching-agent image

  deploy-notification:
    runs-on: ubuntu-latest
    # ... similar steps with notification-agent image

  deploy-outcome-tracker:
    runs-on: ubuntu-latest
    # ... similar steps with outcome-tracker image

  deploy-webhook-handler:
    runs-on: ubuntu-latest
    # ... similar steps with webhook-handler image
    # This one IS publicly accessible (webhook endpoint)
```

---

### `terraform.yml` — Infrastructure Changes

```yaml
name: Terraform

on:
  push:
    branches: [main]
    paths:
      - 'infrastructure/**'
  pull_request:
    branches: [main]
    paths:
      - 'infrastructure/**'

jobs:
  terraform-plan:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - name: Terraform Plan
        run: |
          cd infrastructure/environments/prod
          terraform init
          terraform plan -out=tfplan
        env:
          GOOGLE_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}
      - name: Comment plan on PR
        uses: actions/github-script@v7
        with:
          script: |
            // Post terraform plan output as PR comment

  terraform-apply:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - name: Terraform Apply
        run: |
          cd infrastructure/environments/prod
          terraform init
          terraform apply -auto-approve
        env:
          GOOGLE_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}
```

---

### `release.yml` — Production Release

Manual trigger to promote staging to production.

```yaml
name: Release to Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Release version (e.g. v1.2.0)'
        required: true
      description:
        description: 'Release notes'
        required: true

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Create release tag
        run: |
          git tag ${{ github.event.inputs.version }}
          git push origin ${{ github.event.inputs.version }}

      - name: Create GitHub Release
        uses: actions/create-release@v1
        with:
          tag_name: ${{ github.event.inputs.version }}
          release_name: ${{ github.event.inputs.version }}
          body: ${{ github.event.inputs.description }}

      - name: Promote Vercel deployment to production
        run: |
          vercel promote --token ${{ secrets.VERCEL_TOKEN }} --prod

      - name: Tag all agent images as production
        run: |
          # Re-tag latest staging images as this version
          for agent in discovery quality matching notification outcome-tracker webhook-handler; do
            docker pull gcr.io/skilved-prod/$agent-agent:latest
            docker tag gcr.io/skilved-prod/$agent-agent:latest \
              gcr.io/skilved-prod/$agent-agent:${{ github.event.inputs.version }}
            docker push gcr.io/skilved-prod/$agent-agent:${{ github.event.inputs.version }}
          done

      - name: Notify team on Slack
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":"🚀 Skilved ${{ github.event.inputs.version }} deployed to production"}'
```

---

## Docker Configuration

### Agent Dockerfile Template

```dockerfile
# apps/agents/discovery/Dockerfile
FROM node:20-slim AS base
RUN npm install -g pnpm

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/agents/discovery/package.json ./apps/agents/discovery/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/database/package.json ./packages/database/
RUN pnpm install --frozen-lockfile --prod

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter discovery build

# Runtime
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Install Playwright (for JS-heavy site crawling)
RUN npx playwright install --with-deps chromium

COPY --from=builder /app/apps/agents/discovery/dist ./dist
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 8080
CMD ["node", "dist/index.js"]
```

---

## Cloud Run Configuration

### Service Configurations

| Service | Memory | CPU | Min instances | Max instances | Timeout |
|---|---|---|---|---|---|
| `scout-agent` | 2Gi | 2 | 0 | 1 | 3600s |
| `analyst-agent` | 1Gi | 1 | 0 | 10 | 120s |
| `quality-agent` | 512Mi | 1 | 0 | 10 | 60s |
| `matching-agent` | 1Gi | 2 | 1 | 20 | 30s |
| `career-agent` | 1Gi | 1 | 0 | 5 | 120s |
| `application-agent` | 4Gi | 4 | 0 | 5 | 300s |
| `revenue-agent` | 512Mi | 1 | 0 | 10 | 60s |
| `growth-agent` | 1Gi | 1 | 0 | 2 | 1800s |
| `customer-success-agent` | 512Mi | 1 | 1 | 20 | 30s |
| `notification-agent` | 1Gi | 1 | 0 | 1 | 1800s |
| `outcome-tracker` | 512Mi | 1 | 0 | 10 | 60s |
| `webhook-handler` | 256Mi | 1 | 1 | 20 | 30s |
| `admin` | 512Mi | 1 | 0 | 2 | 60s |

**Notes:**
- Scout: min 0 (scheduled only), large memory for Playwright crawling
- Application: 4Gi / 4 CPU — Playwright browser for web form automation is resource-intensive
- Matching + Customer Success + Webhook: min 1 — must respond instantly
- Growth: long timeout for content generation + publishing pipeline
- Revenue: Cloud Functions preferred over Cloud Run (purely event-driven, no persistent load)

---

## Deployment Runbook

### New Agent Deployment

```bash
# 1. Test locally
cd apps/agents/discovery
pnpm dev

# 2. Build Docker image
docker build -f apps/agents/discovery/Dockerfile \
  -t gcr.io/skilved-prod/discovery-agent:test .

# 3. Test Docker image locally
docker run -p 8080:8080 \
  -e GCP_PROJECT_ID=skilved-dev \
  -e GEMINI_API_KEY=$GEMINI_API_KEY \
  gcr.io/skilved-prod/discovery-agent:test

# 4. Push to PR → CI runs
git push origin feature/discovery-new-sources

# 5. Merge to main → auto-deploys to staging
# 6. Verify on staging
# 7. Manual release trigger → production
```

### Rollback Procedure

```bash
# Roll back web to previous Vercel deployment
vercel rollback --token $VERCEL_TOKEN

# Roll back agent to previous image
gcloud run deploy discovery-agent \
  --image gcr.io/skilved-prod/discovery-agent:v1.1.0 \
  --region africa-south1

# Check agent health
gcloud run services describe discovery-agent \
  --region africa-south1 \
  --format="value(status.conditions[0].status)"
```

---

## Monitoring & Alerting

### Cloud Monitoring Alerts (auto-configured via Terraform)

| Alert | Condition | Notification |
|---|---|---|
| Agent failure | Cloud Run error rate > 5% | PagerDuty + Slack |
| Discovery agent missed | No successful run in 5 hours | PagerDuty |
| High feed latency | p95 > 2 seconds | Slack |
| Low opportunity count | < 10 new opps in any run | Slack |
| WhatsApp delivery failure | > 20% failed | Slack |
| Firestore latency | p95 > 500ms | Slack |

### Uptime Monitoring

External uptime monitoring via **Better Uptime** (or similar):
- `https://skilved.com/api/health` — checked every minute
- `https://staging.skilved.com/api/health` — checked every 5 minutes

---

## Required GitHub Secrets

Set in GitHub repository Settings → Secrets and variables → Actions:

| Secret | Description |
|---|---|
| `GCP_SA_KEY` | GCP service account JSON key for CI/CD |
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `SLACK_WEBHOOK` | Slack webhook for deploy notifications |

---

*Document version 1.0 — June 2026*  
*Owner: Engineering*
