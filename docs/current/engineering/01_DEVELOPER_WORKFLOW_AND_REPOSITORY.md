# Developer workflow and repository guide

Date: 11 September 2026. Status: observed repository orientation plus proposed workflow. No successful clean install/build is claimed by this documentation refresh.

## Observed baseline

The repository is a pnpm/Turborepo TypeScript monorepo with a Next.js web application and agent/service scaffolding. Static package inspection found pnpm 9, Turbo 2, Node >=20 and a web package targeting Next.js ^15.1, React 19 and TypeScript 5.7. Resolve the actual supported runtime and lockfile in S01; these observations are not a recommendation to remain indefinitely on an old major version.

Important areas include `apps/web`, `apps/agents`, shared `packages`, infrastructure definitions, setup scripts and `docs`. Some agent files, persistence/auth paths and earlier documentation are incomplete. Existing uncommitted implementation work must be preserved and reviewed before changes; do not overwrite it to match an old directory diagram.

## S01 reproducibility procedure

Inspect Git state and applicable repository instructions. Inventory package manifests, lockfile, runtime requirements and available scripts. Create an isolated development environment using non-production credentials and synthetic data. Run the scripts that actually exist, record exact versions/commands, failures and missing prerequisites, and produce a baseline report. Do not copy setup commands from the archived hackathon plan without checking their resource creation, permissions and billing effects.

Separate failures caused by missing configuration, incomplete code, dependency compatibility and external access. A clean local build does not prove ownership rules, workers or production deployment. The baseline report supplies evidence for the next work packages.

## Change workflow

1. Select one work package and its user outcome, contracts and acceptance cases.
2. Inspect current implementation and uncommitted work; create a scoped branch/worktree when appropriate.
3. Update the contract/decision before introducing a new state, permission or external effect.
4. Implement the smallest complete usable slice, including error and recovery paths.
5. Run meaningful targeted tests plus repository-required checks; retain reproducible evidence.
6. Review privacy, security, accessibility and source correctness for affected paths.
7. Write a concise change description: problem, resulting behaviour, validation and limitations.
8. Release through the documented gate, observe and update actual capability status.

Use the branch prefix `codex/` for assistant-created branches unless a different explicit name is requested. Do not commit, merge, deploy or spend merely because this document describes the process.

## Configuration and secrets

Maintain an environment-variable inventory with name, purpose, consuming service, public/server classification, required environments, default/failure behaviour and secret-manager reference where needed. Examples contain placeholders only. Fail safely when a production-critical value is absent; never default to a shared demo owner, public bucket or fabricated verification result.

Separate local emulators, test cloud resources and production. Confirm emulator targeting before running destructive fixtures. Setup scripts require a reviewed resource plan, identities, region, expected cost and rollback/cleanup approach. Avoid blanket project-admin permissions for routine workers.

## CI and release policy

The earlier plan described pipelines that static inspection did not find under `.github/workflows`. Implement CI as work, not as an existing fact. Proposed checks: lockfile-consistent install, formatting/lint where configured, type checking, relevant unit/contract tests, owner/tenant rules tests, build, dependency/secret review and selected integration tests in an isolated environment. Production secrets must not be available to untrusted pull-request code.

Build once where practical and promote a traceable artefact. Keep migration version and rollback compatibility in the release record. Do not rebuild an unreviewed revision during deployment and call it the tested artefact.

## Engineering completion record

Commit/build; affected PRD/work package; changed contract; test commands/results; environment; migrations; security/access review; design evidence; operational impact; rollout/rollback; known limitations. Documentation changes do not establish a completed feature. [Architecture](06_ARCHITECTURE.md), [data/API contracts](07_DATA_AND_API_CONTRACTS.md) and [agent execution](08_AGENT_EXECUTION.md) define the target system.
