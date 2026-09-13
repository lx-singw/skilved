# Analytics and metrics dictionary

## M0 companion event supplement — 13 September 2026

The [implementation contract](../engineering/04_DISCOVERY_COMPANION_IMPLEMENTATION.md) and [local growth plan](../growth/04_LOCAL_DISTRIBUTION_AND_CAREER_NETWORK.md) define M0 measurement. The expanded career events below apply only when their underlying capabilities exist. No mandatory account or persistent cross-site tracking is introduced merely to measure the feed.

| Event/measure | Meaning | Exclusions and limits |
|---|---|---|
| `opportunity_detail_viewed` | Approved public detail displayed | Bot/staff/test exclusions declared; views are not people |
| `source_details_opened` | Person requested check/source information | Does not prove understanding or legitimacy |
| `application_route_opened` | Person initiated the external route | Not submission, completed redirect or employer receipt |
| `share_intent` | Person opened native/WhatsApp compose or copy action | Cancellation/delivery unknown; never count as recipient acquisition |
| `shared_link_landing` | Public page opened through a non-personal channel marker if present | Attribution incomplete; marker is not an individual sender identity |
| `suggestion_received/resolved` | Intake/review system action with status and latency | Queue completion is not opportunity authenticity or a placement |
| `report_received/resolved` | Operator workflow event with severity and resolution | Reporter volume does not establish fraud; resolution reason required |
| `meaningful_return_observed` | Observed/appropriately measured return to a useful task | Define window and evidence; unavailable identity cannot be fabricated |

Local saved stages stay on-device by default. Do not transmit an entire shortlist, applied status, raw submitted URL, receipt capability, free-text report or precise residence as analytics. If aggregate save actions are later collected, adopt a purpose/retention design first and describe browser-level limitations; trend activation is separately gated. Obtain required choices for the actual measurement design and publish them accurately.

For ratios, record numerator, eligible denominator, window, exclusions and missingness. Measure observed comprehension separately from event proxies. Cost samples include human review, corrections, source checks and support. Trending cannot claim unique applicants from browser identities. See [DCF-18/21](../quality/02_DISCOVERY_COMPANION_ACCEPTANCE.md) for evidence checks.

Date: 11 September 2026. Status: proposed instrumentation; no baseline values exist yet. Owner role: product/research with engineering.

## North-star candidate

Count **people who complete a useful career task with attributable evidence of completion** during a stated period. Qualifying tasks may include completing a preparation step, creating a recipient-used pack, resolving a specific blocker or recording a programme milestone. Define each qualifying event before measurement. Page views, AI messages and profile decoration do not qualify automatically.

This is a candidate operating metric, not proof of improved employment. Track outcome quality, safety, cost and missingness alongside it so the metric cannot reward low-value activity.

## Event contracts

| Event | Trigger | Essential non-sensitive fields |
|---|---|---|
| opportunity_viewed | Detail rendered successfully | Opportunity ID/category, source revision, surface |
| workspace_created | Server confirms saved workspace | Workspace ID, category, catalogue/external-link origin |
| requirement_state_changed | Confirmed checklist change | Requirement ID/type, prior/new state, actor class |
| evidence_added | Confirmed permitted record entry | Evidence ID/type, origin class; no file content |
| pack_created | Snapshot successfully created | Pack ID, selected-item count, format |
| pack_recipient_feedback | Recipient voluntarily reports use/issue | Pack ID, feedback category and reporter provenance |
| watch_started / paused / cancelled | Mandate transition persisted | Task type, state, trigger class |
| task_completed / failed | Worker final receipt persisted | Task type, failure class, attempt count, latency/cost bucket |
| external_route_opened | User opens verified destination link | Opportunity/workspace ID; never label submitted |
| outcome_recorded | User/provider records outcome | Outcome class, provenance, timestamp, correction flag |
| help_resolved, later | Request closed with reason | Request type, resolution class, participant count |

Common envelope: event ID, schema version, occurrence/receipt time, pseudonymous actor ID where justified, session/context, environment and build. Deduplicate retries by event ID. Exclude passwords, identity numbers, names, contact details, document text, raw prompts and private signed URLs. Pseudonymous IDs remain potentially personal data.

## Metric definitions

| Metric | Numerator / denominator | Interpretation and limitation |
|---|---|---|
| Activation | New users completing a defined useful first task / eligible new users in cohort | State eligibility/window; not merely account creation |
| Task success | Successfully completed tasks / attempted eligible tasks | Report assistance, failure and abandonment separately |
| Week-N meaningful return | Activated cohort members completing a qualifying task in week N / original activated cohort | Fixed denominator; distinguish notification-driven and voluntary return |
| Opportunity freshness | Active sampled records within declared check policy / sampled active records | Also report unreachable/unknown source states |
| Critical factual error | Sampled records with a consequential unsupported/wrong field / reviewed sample | Zero in a sample is not universal zero risk |
| Pack acceptance | Recipients who report usable output / recipients providing feedback | Also show feedback response rate to expose selection bias |
| Agent useful-action rate | Completed tasks producing a user-relevant result / attempted tasks | A no-change check may be valid but should not be mislabelled new value |
| Support burden | Human support/review minutes / completed useful tasks or active users | Define workload and period consistently |
| Paid conversion | Paying qualified buyers / qualified buyers offered exact terms | Separate deposits, trials and renewals |
| Outcome progression | Cohort with a stated outcome / eligible cohort | Report self-report, corroboration, missingness and time lag |

Segment by category, new/returning user, device/network context where consent/purpose supports it, source type and cohort period. Avoid sensitive demographic breakdowns without a justified purpose and suitable safeguards. Suppress or aggregate small groups when disclosure risk arises.

## Instrumentation QA

Test event creation only after actual persistence, retry deduplication, ordering tolerance, deletion linkage, environment isolation and absence of sensitive fields. Compare a small manual trace with the analytics funnel. A dashboard is not reliable until its events are reconciled to real actions.

## Reporting rhythm

Initial weekly report: cohort/sample counts, useful tasks, critical failures, source coverage, operating time, cost and qualitative blockers. Monthly report adds repeat use, recipient acceptance and commercial evidence as data matures. Show “not measured” instead of fabricated zeros. [Growth](../growth/03_RETENTION_AND_GROWTH.md) and [benchmark methods](../research/05_COMPETITIVE_BENCHMARKS.md) supply hypotheses and comparison rules.
