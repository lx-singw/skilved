# Enterprise risk and dependency register

## M0 companion additions — 13 September 2026

| Risk | Exposure | Treatment and evidence |
|---|---|---|
| Misleading reassurance | Reachable link presented as safe opportunity; rewritten eligibility excludes/misleads | Scoped check records, original/explained/unclear layers, DCF-03–06/24 |
| Anonymous intake abuse | SSRF, DNS/redirect bypass, prompt injection, queue cost or receipt leakage | Bounded allowlisted fetching, egress separation, capability controls and DCF-07–10 |
| Stale shared/saved content | Changed or unsafe destination survives in previews or local cache | Canonical current status, as-of text, cache invalidation and DCF-13–15; disclose external cache limits |
| Shared-device disclosure | Progress and receipt access seen by another browser user | Minimal local data, visible scope, clear/withdraw controls and DCF-10–12 |
| Moderation overload or manipulation | A serious report waits for an arbitrary count, or brigading removes valid listings | Severity/evidence triage, review owner, intake pause and DCF-16/22 |
| Strategy drift | New companion features displace scraping, six categories or later social ambition | A01–24 coverage register, M0-A–G and B01–B10 reviews |
| Unfunded quality promises | Ad-free launch assumed costless; institutions assumed to pay | Actual source/review/support costs, free-consumer model, post-M0 buyer research |

Owners and response thresholds are set during B01/B10 from actual capacity. These are risks to manage, not a report that incidents occurred. See [accepted strategy](06_DISCOVERY_STRATEGY_TRACEABILITY.md) and [acceptance](../quality/02_DISCOVERY_COMPANION_ACCEPTANCE.md).

Date: 11 September 2026. Status: initial qualitative assessment, not a quantified probability model. Founder owns review until roles are assigned.

## Register

| ID | Risk / dependency | Exposure | Early signal | Response and owner role |
|---|---|---|---|---|
| RISK-01 | Stated interest fails to become repeat use | High | Users cannot name a task completed without prompting | Observe tasks/diaries; product |
| RISK-02 | Buyer values service but will not pay | High | Praise without budget owner, date or commitment | Present scoped price, track actual payment; commercial |
| RISK-03 | Six-category breadth overwhelms curation | High | Stale queue, missing critical fields, duplicate reviews | Shared schema, primary sources, explicit sparse coverage, operating time measurement; operations |
| RISK-04 | Founder capacity overestimated | High | Work packages spill while apprenticeship/rest suffer | Rebaseline observed hours; reduce parallel work, extend calendar; founder |
| RISK-05 | Personal funding insufficient for recurring service | High | Forecast commitments exceed available business cash | Pre-authorise affordable exposure, throttle optional jobs, validate paid work; finance |
| RISK-06 | Private-data exposure or account escalation | Critical | Failed ownership tests or unexplained access | Block affected release, remediate/test; security |
| RISK-07 | Source access withdrawn or reuse not permitted | High | Terms change, robots restriction, complaint, blocking | Pause source, use permitted link/manual path, seek authorised feed; operations |
| RISK-08 | Government/partner integration unavailable | High | No published interface/agreement | Portable exports and external links; commercial/engineering |
| RISK-09 | AI fabricates consequential requirement or claim | High | Unsupported dates, credentials, eligibility | Critical-field review, abstention, held-out evaluation; engineering |
| RISK-10 | Network/social features attract abuse | High | Unwanted contact, public comparison, spam | Invited purpose-bounded interactions, reports, staffed safeguards; safety |
| RISK-11 | Schools/organisations claim excessive learner access | High | Buyer requests entire private records | Explicit grants, purpose limitation and contract boundary; privacy |
| RISK-12 | Competitor reproduces visible feature | Medium/high | Similar feature launched | Prove task quality, recipient acceptance, service execution and trusted relationships; product |
| RISK-13 | Brand/domain collision | Medium | Confusing existing marks or unavailable domains | Clearance before material branding spend; founder |
| RISK-14 | Enterprise procurement exceeds runway | High | Long security/legal cycles without sponsor | Smaller bounded pilots and paid service evidence; commercial |
| RISK-15 | Outcome data biased/incomplete | High | Only successful/engaged users report | Report missingness, cohort definitions and attribution limits; research |
| RISK-16 | Backup exists but recovery fails | High | Untested restore, absent deletion reconciliation | Isolated restore before public release; operations |
| RISK-17 | Country expansion creates new legal/operating burden | High | Local requirements assumed identical | Country research and local partner gate before launch; founder |
| RISK-18 | Service work distracts from product indefinitely | Medium | Bespoke commitments consume planned build time | Scope service, log hours, reassess repeatability; founder |
| RISK-19 | Existing institutional systems already solve the proposed paid task | High | Buyer demonstrates equivalent installed functionality or required incumbent workflow | Observe actual task and benchmark complementary value before commitment; product/commercial |
| RISK-20 | Apparent admin savings transfer burden or risk to learners/supervisors | High | More re-entry, unwanted monitoring or rejected attestations | Measure total participant effort, authority and voluntary learner value; product/privacy |
| RISK-21 | Evidence is complete but unacceptable to the real recipient | High | Report/template/signature rejected despite internal completion score | Test accepted output and provenance with the recipient before scaling; programme operations |

## Dependency tracking

Every dependency has a named external/internal owner, request date, expected evidence, earliest needed gate, fallback and next review. “Partnership planned” is not a dependency satisfied. Examples: source permission, actual billing configuration, school safeguarding contact, recipient agreement to review packs, paying buyer, business identity, backup configuration, external adapter credentials and cloud region availability.

Do not promise a calendar date controlled by an unsigned partner. Work on the fallback that preserves user value while waiting; stop dependent data sharing when permission is genuinely required.

## Risk review cadence

Review the highest risks at each two-week delivery review and the full register monthly or before a major release. Update impact, current controls, residual exposure, owner and next action. Escalate a release blocker immediately rather than waiting for a meeting. Close risks only when the cause is removed or the scoped evidence supports a lower exposure; moving them to another document is not closure.

## Decision template

Risk ID; affected users/assets; scenario; evidence; impact; likelihood rationale; control; residual risk; accountable acceptance; expiry/review trigger; linked work package. Avoid multiplying ordinal scores into a pseudo-precise financial probability. Estimate monetary exposure only when amounts and mechanisms are known.

The roadmap's contingency covers normal uncertainty, not unlimited incidents or scope. If a newly discovered obligation adds material work, revise [roadmap estimates](../planning/15_BUILD_ROADMAP.md) instead of absorbing it invisibly.
