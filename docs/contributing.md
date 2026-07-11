# Skilved — Contributing Guide

Welcome to the Skilved codebase! This guide helps you get set up locally, understand coding standards, and follow our contribution workflow.

---

## Technical Stack

Skilved is a monorepo managed with **Turborepo** and **pnpm workspaces**:

- **Web Application:** Next.js 14 (App Router) PWA at `apps/web`
- **Admin Dashboard:** Next.js App at `apps/admin`
- **Agents:** Plain Node.js/TypeScript microservices at `apps/agents/*`
- **Shared Packages:** Reusable TypeScript packages at `packages/*`
  - `types`: Common TypeScript interfaces and models
  - `database`: Firestore, BigQuery, and GCS client configurations
  - `ui`: Shared Tailwind component library
  - `utils`: Standard utility functions
  - `config`: Linting and TS configs
- **Infrastructure:** Terraform (GCP) configurations at `infrastructure/`

---

## Local Setup

### Prerequisites

1. **Node.js:** version >= 20.x
2. **pnpm:** version >= 9.x
3. **Java 21:** Required for Firestore/Firebase local emulators
4. **Google Cloud SDK (`gcloud`):** Authenticated with application default login

### Step-by-Step Local Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd skilved
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Copy the root `.env.example` to `apps/web/.env.local` and `apps/agents/<agent-name>/.env.local` and fill in necessary developer keys (e.g. `GEMINI_API_KEY`).

4. **Initialize Local Firebase Emulators & Dev Environment:**
   Run the local setup sequence:
   ```bash
   pnpm dev
   ```
   This will start the Next.js dev server and the Firebase Emulator Suite (Firestore on port `8080`, Auth on `9099`, Storage on `9199`).

---

## Code Quality Standards

We enforce strict quality guidelines to maintain architecture integrity:

### TypeScript

- Use TypeScript for all new code. Avoid using `any` (prefer structural type definitions).
- Shared types must be placed in `packages/types/src/index.ts` rather than duplicating them in apps or agents.

### Linting & Formatting

- Running `pnpm lint` triggers ESLint checks across all monorepo apps and packages.
- Format all code with Prettier before submitting PRs.

### Testing

- Running `pnpm test` executes Vitest unit tests.
- Always add unit tests for utility functions, custom hooks, and agent logic.
- Integration tests run against the local Firebase Emulators.

---

## Contribution Workflow

We follow a trunk-based branch development strategy:

1. **Create a branch:**
   Name your branch based on the issue type:
   - `feature/your-feature-name`
   - `fix/bug-description`
   - `agent/agent-improvement`

2. **Commit changes:**
   Keep commits focused and write descriptive commit messages following the Conventional Commits specification (e.g., `feat(web): add public profile view`, `fix(scout): handle MERSETA selector change`).

3. **Open a Pull Request:**
   Target `main` for all pull requests. Ensure:
   - All tests pass (`pnpm test`)
   - Typechecking succeeds (`pnpm typecheck`)
   - PR is reviewed and approved by at least one maintainer.

4. **Deployments:**
   - Merging to `main` automatically triggers deployments to the staging environment (staging.skilved.com).
   - Tagged releases trigger production deployments.
