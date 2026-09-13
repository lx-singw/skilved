# Vendor, procurement and contract controls

Date: 11 September 2026. Status: purchasing and contracting blueprint; no purchase or partnership is authorised or concluded here.

## Vendor selection record

For each cloud, model, email, messaging, analytics, payment or verification provider, record the exact service/tier, contracting party, account owner, intended data, region, subprocessors, retention/training settings, access/security features, recurring and variable prices, credits/expiry, cancellation/export path and incident contact. Link dated primary terms and the actual accepted agreement version in a restricted register.

Select a provider using demonstrated task quality, privacy fit, operational burden and total cost. A headline free tier is not the price of the complete deployment. Do not change clouds solely for another promotional credit if migration work and recurring cost outweigh it.

## Risk tiers

| Tier | Example | Minimum review |
|---|---|---|
| Low | Public static asset/tool without personal data | Licence, owner, price and exit |
| Medium | Operational telemetry with minimised identifiers | Data fields, retention, access, contract and incident route |
| High | Private evidence storage, authentication, AI receiving personal material, payments | Data-processing terms, transfers, security evidence, recovery/export, permissions, dependency failure and cost controls |
| Critical workflow | Credential verification or external application submission | All high-tier checks plus authority, accuracy, replay/duplicate handling, recipient acceptance and rollback limitations |

The founder can complete low-risk records. High-risk terms and consequential contracts may require qualified review. Missing evidence becomes an explicit dependency and limits the affected feature; it does not require stopping unrelated useful work.

## Contract pack checklist

Before a paid customer engagement, establish scope/order form, parties, price/tax treatment, delivery assumptions, acceptance, revisions/change control, cancellation/refund/dispute handling, support coverage, data roles and security responsibilities, confidentiality, intellectual-property ownership/licences, permitted use, liability allocation, term/termination and return/deletion of data. These are drafting requirements, not legally executed clauses.

For source/partner agreements, additionally record access method, reuse/display rights, attribution, update/expiry handling, rate limits, contact/escalation, logo/marketing permissions and end-of-access procedure. An organisation publishing opportunities through a portal is not automatically agreeing to give Skilved an API or endorse the product.

For contractors, document deliverables, acceptance, payment, confidentiality, IP/licensing, repository access and offboarding. Do not treat a contractor agreement as automatically resolving employment classification.

## Procurement workflow

Identify need → compare realistic options → evaluate data/risk → estimate total recurring exposure → confirm available authorised funds → agree terms → provision least-privilege access → record renewal/exit → verify invoice and usage → review value. A recommendation in the roadmap does not skip the funding step.

Use a separate test environment where possible. Trial expiry must have a named owner and a documented service consequence. Do not allow a critical user function to disappear without notice because promotional credits end.

## Exit drill

For critical providers, prove that Skilved can export necessary records in usable form, revoke credentials, remove pending webhooks/tasks, transfer DNS/configuration where applicable and delete data under the contract. Estimate migration effort before a dependency becomes deeply embedded. Portability is demonstrated by a tested export and restoration path, not by saying the architecture is cloud-agnostic.

Use [architecture](../engineering/06_ARCHITECTURE.md), [integration policy](../engineering/02_INTEGRATION_AND_MIGRATION_POLICY.md) and [cost model](../operations/12_COST_CAPACITY_AND_OPERATIONS.md) for technical and financial inputs.
