# Cost, capacity and operations

Status: current planning model, 2026-09-11. Owner: founder. Numbers below are reference scenarios and calculations, not approved expenditure, customer demand forecasts or vendor quotations. No live billing account, subscription, cloud credit, domain ownership or deployment cost was inspected in this documentation refresh.

Related: [commercial plan](../commercial/04_COMMERCIAL_AND_PARTNERSHIPS.md), [architecture](../engineering/06_ARCHITECTURE.md), [agent execution](../engineering/08_AGENT_EXECUTION.md), [roadmap](../planning/15_BUILD_ROADMAP.md), [sprint backlog](../planning/16_SPRINT_BACKLOG.md), [evidence register](../research/13_RESEARCH_AND_EVIDENCE.md).

## 1. Resource policy

Preserve the full product ambition and all six opportunity categories. Sequence investment by technical dependencies, verified user value and available operating capacity. The founder asked for the best-use estimate without arbitrary scope caps; this is not authorisation for unlimited cloud spending, subscriptions, borrowing or staffing.

The previously discussed R200/month allowance was provisional advice, not a confirmed project ceiling. Weekly hours, spendable funding, existing subscriptions, credit expiry dates and committed collaborators remain unknown. Do not turn them into facts. Financial capacity must be established before purchasing or deploying billable resources. Private household and relationship details are outside this repository's operating documentation.

Replace these archived assumptions: zero marginal cost per worker; an already assembled four-person founding team; guaranteed revenue in week two; automatic government contracts in month two; paid verification without issuer access; and fixed calendar dates derived from a missed competition.

## 2. Reference architecture and cost rationale

Start from the existing Next.js/TypeScript interface and Google direction: one web service, one worker codebase scheduled as needed, managed authentication, Firestore for initial operational records, private object storage, and a replaceable AI-provider interface. Logical agents do not require 22 deployments. Browser automation, broad search infrastructure, a data warehouse, Redis, continual inference and extra regions each need a measured use case.

Google's Cloud Run pricing distinguishes services and jobs; jobs charge for instance lifetime with a one-minute minimum. Builds, images and connected resources can add charges. Choose appropriate request-based versus instance-based behaviour and measure actual executions. [Cloud Run pricing](https://cloud.google.com/run/pricing)

Firestore charges can include document/index reads, writes, storage and network use. Free allowances are limited, and backup/PITR/restore functions are separately billable. Query shape, listeners and reconnections can affect cost. Do not equate user count with database cost. [Firestore billing](https://firebase.google.com/docs/firestore/pricing)

Cloud Storage for Firebase requires a billing-enabled Blaze project; no-cost allowances may still apply but depend on the bucket and region. Do not plan a document vault on the assumption that Spark provides continuing storage access. [Firebase storage requirements](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)

## 3. Full monthly cost equation

```text
Cash operating cost =
  web and worker compute + database operations/index/storage
  + object storage/operations/downloads + network egress
  + authentication and account recovery
  + AI tokens/tools/OCR/browser sessions
  + email/SMS/WhatsApp delivery/provider fees
  + scheduler/queues/secrets/builds/image registry
  + monitoring/log retention/backups/restores
  + domains/software/support tools
  + payment fees/refunds/contracted operations
  + professional review and other business overheads

Fully loaded operating cost = cash cost + staff/contractor labour
  + founder hours valued at an explicit comparison rate

Net cash requirement = cash outflows + tax/payment timing reserve
  - money actually collected - usable approved credits
```

Maintain gross vendor cost before credits alongside cash paid. Credits lower a temporary invoice; they do not establish sustainable unit economics. A signed contract is not cash collected. Annual renewals, setup fees, review costs and deposits need a separate cash calendar.

For each service record vendor, plan, unit, region, currency, unit rate, quota, current utilisation, monthly estimate, invoice lag, owner, renewal/credit expiry and evidence date. The model must include tax and foreign-exchange assumptions explicitly; do not silently treat USD as rand.

## 4. Workload formulas

| Workload | Formula and factors to measure |
|---|---|
| Public source fetching | Sources × pages per source × scheduled checks, minus valid conditional-cache savings; honour each source's permitted cadence |
| Extraction | New/changed candidate records × fraction needing AI; separate deterministic parsing from paid calls |
| User assistance | Active users × actions per user × paid calls per action; include unsuccessful calls and retries |
| AI text cost | Input tokens / 1,000,000 × input rate + output tokens / 1,000,000 × output rate; add tool/search/OCR charges |
| Worker compute | Billable execution seconds × vCPU/GiB allocation × applicable rates; account for minimum billing and startup |
| Database | Read/write/delete/index operations × respective rate, plus storage and egress; distinguish per-day allowances from monthly totals |
| Documents | Uploaders × documents × average size × retained versions, plus downloads, scanning and backup duplication |
| Messages | Opted-in recipients × events/digests × applicable channel/category/country/provider rate |
| Support | New users × onboarding minutes + cases × handling minutes + verification/moderation/review time |
| Revenue | Paying organisations × collected fee; services separately priced and costed by delivery effort |

Measure cost per correctly published opportunity, per completed preparation action, per resolved help request and per active organisation. Cost per account is insufficient when many accounts are dormant. Do not describe application clicks as successful applications or employment outcomes.

## 5. Reference monthly workload scenarios

These inputs are sensitivity examples, not adoption predictions or limits. More users may be supported if the measured system and operating team can handle them. Lower traffic may still cost more if documents, expensive models or support needs dominate.

| Input | Controlled pilot | Early public use | Expanded operation |
|---|---:|---:|---:|
| Monthly active users | 100 | 1,000 | 10,000 |
| Source inventory | 20 | 50 | 200 |
| Pages/source/check | 10 | 20 | 20 |
| Checks/month used for arithmetic | 30 | 30 | 30 |
| Gross page fetches | 6,000 | 30,000 | 120,000 |
| New/changed records sent to AI | 300 | 4,500 | 18,000 |
| User AI calls, five/user | 500 | 5,000 | 50,000 |
| Total AI calls | 800 | 9,500 | 68,000 |
| Input tokens at 3,000/call | 2.4 million | 28.5 million | 204 million |
| Output tokens at 500/call | 0.4 million | 4.75 million | 34 million |

The source schedule is only an arithmetic convention: weekly issuers, rapidly changing sources and restricted sources require different cadences. AI calls include extraction and user assistance; avoid charging the same extraction again for each reader. Investigate context size, repeated prompts, retries and model choice before multiplying call frequency.

### AI sensitivity calculation

For transparent arithmetic, assume two fictional rate pairs: USD 0.30 input / 2.50 output per million tokens, and USD 3.00 input / 15.00 output. These are modelling assumptions, not quotations for a named model or recommended vendor plan. Replace with the selected provider's current rates and measured token distribution before deployment.

| Monthly text-only AI estimate | Pilot | Early public | Expanded |
|---|---:|---:|---:|
| Lower illustrative rate pair | $1.72 | $20.43 | $146.20 |
| Higher illustrative rate pair | $13.20 | $156.75 | $1,122.00 |

Tool calls, OCR, embeddings, audio, image processing and browser sessions are excluded from this token table and must be added if enabled. Long-document extraction can invalidate the assumed average. Benchmark expensive models where they measurably improve a necessary result; do not assume the most expensive model creates the best product.

### Digital operating allowance to test

| Monthly allowance category, USD | Pilot | Early public | Expanded |
|---|---:|---:|---:|
| Compute, database, document storage/egress, backup | $5–25 | $20–80 | $80–400 |
| Authentication and message delivery | $0–5 | $5–50 | $50–300 |
| Build/registry/scheduler/logs/secrets/domain accrual | $0–10 | $10–50 | $50–250 |
| Illustrative text AI from above | $1.72–13.20 | $20.43–156.75 | $146.20–1,122 |
| **Combined allowance** | **$6.72–53.20** | **$55.43–336.75** | **$326.20–2,072** |
| At hypothetical R18/USD, before tax | **R121–958** | **R998–6,062** | **R5,872–37,296** |

The non-AI rows are engineering planning allowances to replace with calculator and invoice evidence, not rates derived from a provider quote. R18/USD is a scenario conversion, not the current exchange rate. Lower bounds assume restrained use and eligible free allowances; they are not guaranteed. Costs may exceed the upper values. This table excludes salaries, founder labour, sales travel, legal/security/accounting work, hardware, business connectivity and paid development subscriptions. There is no total-business forecast until those inputs exist.

During R0, build the SKU-based estimate; during R1, compare measured use against it. Do not deploy on the strength of these allowances alone. Fixed production quality requirements can dominate low-volume costs.

## 6. Capacity and timeline model

Use the [roadmap](../planning/15_BUILD_ROADMAP.md) as the single schedule authority. Reference capacity is 20 gross hours/week with 25% left unallocated for contingency, producing 15 planned hours/week. Alternatives use 10 or 35 gross hours. This is not the founder's confirmed availability. Planned effort includes customer research, design, implementation, validation and ordinary operations; do not count only coding or subtract contingency twice.

| Phase | Additional all-work effort range |
|---|---:|
| R0 foundation | 50–80 hours |
| R1 controlled alpha | 100–160 hours |
| R2 public MVP | 140–220 hours |
| R3 social and partnerships | 180–300 hours |
| R4 credentials, RPL and programme retention | 320–520 hours |
| R5 intelligence and expansion | 500–900 hours |
| Through R2 | 290–460 hours |
| Entire conditional sequence | 1,290–2,180 hours |

External waiting time for agreements, interviews, procurement, credential access or review is additional. Dependency-free work can continue while waiting; waiting does not prove access will be granted. Later phases require re-estimation after measured operations and discoveries.

Track actual time by product work, customer work, opportunity review, support, incidents and administration. As operations grow, they consume planned capacity and reduce new-feature throughput. If the queue persistently exceeds response capacity, improve the process, change the published service promise, recruit funded help or slow onboarding rather than hide the backlog.

AI assistance reduces some drafting and implementation time but does not supply stakeholder agreements, incident ownership, legal judgement, user research participants or guaranteed defect-free software.

## 7. Revenue and delivery economics

The first-paid-pilot package remains a proposed offer, not a sale. Its historical R1,500 price and bounded delivery are an experiment; do not insert it into revenue forecasts as committed income. Confirm the scope and recipient organisation before contracting.

```text
Delivery contribution = collected fee - payment fees - direct digital cost
  - refunds - paid delivery labour

Labour-adjusted contribution = delivery contribution
  - actual founder delivery hours × chosen comparison hourly rate

Organisation break-even count = fixed monthly operating cost
  / positive contribution per recurring organisation
```

Example, not a forecast: R1,500 collected minus R150 direct costs leaves R1,350 before labour, tax and shared overhead. At eight delivery hours valued at a hypothetical R100/hour, labour-adjusted contribution is R550. At sixteen hours it becomes negative R250. This illustrates why scope, repeatable delivery and accurate time records matter; it does not establish the right price or hourly rate.

Count recurring revenue only when the contract and billing pattern support it. Separate pilots, setup fees, sponsorship, donations, grants and organisation subscriptions. The confirmed consumer tier is entirely free; no applicant-paid fallback is planned. Fund operating capacity explicitly without assuming future data sales. See the [institutional model](../commercial/03_TVET_SDF_AND_EMPLOYER_BUSINESS_MODEL.md) and [trust document](../security/10_TRUST_PRIVACY_AND_SAFETY.md).

## 8. Operating responsibilities

Roles are functions, not existing hires. The founder may hold several, with the limitation recorded.

| Function | Required output | Trigger to add help |
|---|---|---|
| Product and validation | Prioritised evidence, participant interviews, experiment decisions | Research and support compete persistently with delivery |
| Engineering and reliability | Working releases, access tests, recovery evidence | Incident burden or complexity exceeds available competent capacity |
| Opportunity operations | Freshness review, corrections, source relationships | Review backlog makes source-quality promises unattainable |
| Partnerships and sales | Written offers, authority/terms checks, collected payments | Repeatable demand and positive contribution justify dedicated effort |
| Safety and support | Reports resolved, disputes handled, escalation coverage | Minors/social features or volume require staffed supervision |
| Finance/privacy administration | Cash calendar, contracts, processing register, retention | New regulated activity or organisational scope requires expertise |

Agents can draft, triage and perform bounded repetitive work. They do not replace the accountable human role. A collaborator's expected contribution is zero until they make a concrete commitment; a potential funder is not a financing plan.

## 9. Weekly operating rhythm

Use a short asynchronous status record rather than invent a daily meeting schedule around an apprenticeship.

1. At the beginning of a work block: inspect critical failures, source freshness and unresolved safety reports.
2. Weekly: compare planned versus actual hours, cost, changed requirements, completed actions and customer evidence; choose the next smallest complete deliverable.
3. Before a release: check the [release gates](../quality/11_VALIDATION_AND_RELEASE.md), rollback path, current authority and known limitations.
4. Monthly: reconcile invoices and collected cash; inspect renewal/credit expiry; review access, retention and unpaid delivery obligations; re-estimate capacity.

Publish support hours and expected acknowledgement ranges only after capacity is confirmed. App availability is separate from human response availability. Do not promise 24/7 staffed support without staffing.

## 10. Cost protection and degradation

Google now documents preview spend caps for selected services, scoped to one project and one eligible service. Enforcement is not instantaneous, in-flight/fixed costs can continue, and overages remain billable. Recheck availability in the actual account; it is not a hard global cost ceiling. [Google spend-cap documentation](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps)

Combine applicable vendor controls with application enforcement: per-action token ceilings, finite retries, job timeouts, pagination, content-change detection, bounded uploads, restricted invocation, idempotency and rate limits. Set the actual runtime values from measured workloads and authorised funding. User ambition does not remove the need to prevent an accidental infinite loop.

If cost capacity is reached, first pause optional regeneration, nonessential digests and experiments. Preserve already-published source facts, personal records, exports and clear status where technically feasible. Show that assistance is paused; never pretend a job finished. A cost-control event is an incident to examine, not something the agent silently resolves by lifting the budget.

## 11. Provider changes and funding gates

| Option | Current verified consideration | Decision rule |
|---|---|---|
| Google | Existing direction; usage-based services; billing-enabled storage needed | Default while measured cost, reliability and control satisfy the current stage |
| AWS | New-customer free plan can end after six months or credit exhaustion | Migrate only for a concrete capability or sustainable total-cost benefit, not credits alone |
| Supabase/PostgreSQL | Free-plan limitations; Pro starts at $25/month at research date | Revisit if relational reporting/organisation workflows justify migration and recurring cost |
| Vercel Hobby | Restricted to personal non-commercial use | Do not assume the free plan supports the commercial launch |

Sources: [AWS FAQ](https://aws.amazon.com/free/free-tier-faqs/), [Supabase pricing](https://supabase.com/pricing), [Vercel Hobby terms](https://vercel.com/docs/plans/hobby).

Before any funded expansion record the milestone, money available, direct/ongoing cost, owner, timeframe, rollback/degradation plan and the evidence that would justify continuation. Security reviews, partner contracts and credential integrations need real quotations and lead times. No purchase, deployment, investment agreement, message campaign or hiring commitment is authorised by this plan.
