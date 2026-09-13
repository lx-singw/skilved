# Skilved

Skilved is a developing career platform that connects a living, user-controlled career record with opportunities, preparation, selected evidence sharing and persistent assistance. It aims to help people carry useful evidence across schools, programmes and employers.

The public MVP includes **bursaries, learnerships, apprenticeships, internships, graduate programmes and jobs**. The first reachable community is apprentice peers and school leavers in South Africa; broader African and international expansion is conditional on demonstrated value and local readiness.

## Current status

This repository contains a prototype and incomplete implementation scaffolding. Static review found simulated source/verification paths and unfinished authentication/persistence; production readiness is not established. Founder conversations indicate interest, not measured adoption, placements, payments or signed partnerships.

The September 2026 documentation refresh is a planning baseline. It does not deploy services, authorise spending, execute agreements or certify security/compliance.

## Documentation

The accepted companion refinements are documented across [design](docs/current/design/05_OPPORTUNITY_COMPANION_EXPERIENCE.md), [implementation](docs/current/engineering/04_DISCOVERY_COMPANION_IMPLEMENTATION.md), [operations](docs/current/operations/03_SOURCE_CHECKS_AND_COMMUNITY_CONTRIBUTIONS.md), [network growth](docs/current/growth/04_LOCAL_DISTRIBUTION_AND_CAREER_NETWORK.md), [acceptance](docs/current/quality/02_DISCOVERY_COMPANION_ACCEPTANCE.md) and [M0 delivery](docs/current/planning/03_M0_COMPANION_DELIVERY_PLAN.md). [Traceability](docs/current/governance/06_DISCOVERY_STRATEGY_TRACEABILITY.md) distinguishes accepted ideas from unsupported claims. No implementation completion is implied.

The 13 September launch plan prioritises a [discovery-first public MVP (M0)](docs/current/product/03_DISCOVERY_FIRST_MVP.md): six-category browsing, clear requirements, saves/sharing, source-backed issuer pages and original application handoff. The complete career workspace follows; broader institutional research is scheduled after M0. Earlier R2-first wording is superseded for launch sequencing.

Start with the [current documentation index](docs/current/00_START_HERE.md). It organises specialist specifications under product, design, engineering, data, security, legal, quality, research, growth, commercial, finance, operations, people, governance, planning and history.

- [Product strategy](docs/current/product/01_PRODUCT_STRATEGY.md) and [requirements](docs/current/product/02_PRODUCT_REQUIREMENTS.md)
- [Build roadmap](docs/current/planning/15_BUILD_ROADMAP.md) and [35 delivery work packages](docs/current/planning/16_SPRINT_BACKLOG.md)
- [Architecture](docs/current/engineering/06_ARCHITECTURE.md), [data/API contracts](docs/current/engineering/07_DATA_AND_API_CONTRACTS.md) and [agent execution](docs/current/engineering/08_AGENT_EXECUTION.md)
- [Design and accessibility](docs/current/design/README.md), [security](docs/current/security/README.md) and [release evidence](docs/current/quality/11_VALIDATION_AND_RELEASE.md)
- [Research and sources](docs/current/research/13_RESEARCH_AND_EVIDENCE.md), [benchmarks](docs/current/research/05_COMPETITIVE_BENCHMARKS.md) and [commercial experiments](docs/current/commercial/README.md)
- [Decisions and assumptions](docs/current/governance/14_DECISIONS_AND_ASSUMPTIONS.md), [migration map](docs/current/governance/18_DOCUMENT_MIGRATION_MAP.md) and [preserved originals](docs/archive/2026-09-11-pre-strategy-refresh/ARCHIVE_INDEX.md)

## Engineering orientation

The observed repository uses a pnpm/Turborepo TypeScript monorepo, a Next.js web application, agent scaffolding and shared packages. Google Cloud/Firebase remains the proposed reference cloud, with a small number of execution services and logically separate agent responsibilities. Existing manifests and actual behaviour take precedence over archived directory diagrams.

Begin with **S01: reproduce the baseline** using the [developer workflow](docs/current/engineering/01_DEVELOPER_WORKFLOW_AND_REPOSITORY.md). Inspect current scripts and configuration before running setup; archived commands may create billable resources or overly broad permissions. Preserve existing uncommitted work. No clean install/build result is implied here.

## Product principles

The consumer tier is 100% free. Proposed revenue comes from [TVET, SDF and employer-funded institutional workflows](docs/current/commercial/03_TVET_SDF_AND_EMPLOYER_BUSINESS_MODEL.md); buyer demand and procurement are unvalidated. Applicant subscriptions and paid preparation upgrades are retired.

Private records by default; deliberate selected sharing; truthful source/evidence status; unknowns preserved; durable user-authorised tasks; useful external handoff before assumed integrations; accessible low-data journeys; outcomes measured honestly. Public links to other platforms do not imply partnership, endorsement or authorised API access.
