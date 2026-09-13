# ATS adapters and application-route strategy

Updated: 12 September 2026. Status: proposed engineering and product specification; no adapter coverage, employer deployment, application submission or partnership is established by this document. Owner roles: engineering, source operations and product, held by the founder until assigned.

This is the current successor to the [original ATS strategy](../../archive/2026-09-11-pre-strategy-refresh/docs/29_ATS_Adapter_Strategy.md). It preserves reusable platform adapters while replacing unsupported coverage promises and unsafe submission assumptions. Read with [integration policy](02_INTEGRATION_AND_MIGRATION_POLICY.md), [data contracts](07_DATA_AND_API_CONTRACTS.md) and [durable agent execution](08_AGENT_EXECUTION.md).

## 1. Product purpose and core insight

Repeated application tasks can share platform-level code, field mappings and error handling. Skilved should reuse these capabilities while treating each employer/tenant, application route and workflow version as something to validate. A platform family is a useful engineering abstraction; recognising its name is not proof that an application can be submitted correctly.

The complete journey is:

**Discover a lead → establish the original issuer/source → resolve the actual application route → identify its requirements → prepare truthful material → assist or submit within the supported authority → retain an attributable outcome.**

This applies to bursaries, learnerships, apprenticeships, internships, graduate programmes and jobs. A bursary intake may use a different process from a job at the same organisation. Do not equate employer coverage, platform coverage and opportunity-category coverage.

## 2. Scraping is used to find the source

When Skilved uses an aggregator, the goal is to discover opportunities and trace them to their original source. Preserve the discovery page for provenance within its permitted reuse scope, then prioritise the original issuer's notice and authorised application destination for consequential facts. Where appropriate and permitted, add the issuer to the maintained source register so future opportunities can be discovered directly.

An illustrative, fictional chain is: an aggregator mentions an apprenticeship → an employer's careers notice identifies intake AP-123 → its Apply link opens a recruitment-provider tenant for AP-123. The aggregator is the discovery source, the employer is the issuer, and the tenant is the application destination. They must not be collapsed into one unqualified `sourceUrl`.

| Record concept | Meaning |
|---|---|
| Discovery reference | Where Skilved first found the lead; retain other discovery references as appropriate |
| Issuer | Organisation responsible for the opportunity, not automatically the hosting platform |
| Primary-source reference | Issuer notice, authorised programme announcement or supported official record |
| Application route | Portal, API, email, hybrid sequence or manual instructions identified by the source |
| Destination identity | Validated host, tenant/context, opportunity/intake reference and relevant redirect chain |
| Resolution evidence | Why the notice and route belong together, who/what checked, date and revision |

The authoritative notice can itself be hosted on an employer's recruitment platform; a separate corporate webpage is not always available or necessary. Record the issuer relationship rather than requiring a specific URL shape. A primary source that cannot be established remains unresolved. Preserve a useful private preparation path, label uncertainty and prevent definitive automated submission while destination authority or critical instructions are unresolved. Never fabricate an official link to complete the chain.

Revalidate bounded redirects, host/address safety and source conditions under [opportunity operations](../operations/09_OPPORTUNITY_OPERATIONS.md). Discovery rights do not establish submission authority. Resolving an official source also does not certify that every fact it publishes is true.

## 3. What changes from the original strategy

| Original element | Current treatment |
|---|---|
| Shared interface, platform detection and routing | Retained, with versioned capabilities and tenant/workflow-specific validation |
| Email, API and browser routes | Retained as distinct delivery methods; each has its own readiness and receipt requirements |
| Account/document preflight | Retained and strengthened; a valid shared session does not establish a candidate's account or eligibility |
| Hybrid portal-then-email sequencing | Retained when the issuer's actual instructions require it; each step has separate evidence |
| Reference capture, logs and failure classification | Retained, distinguishing internal IDs, provider acceptance and issuer acknowledgement |
| “Eight platforms cover 80%+”, later 88%/95% | Unverified historical estimates; replace with measured coverage using declared samples and denominators |
| Listed employers and SETA portals | Research candidates only; no current platform assignment, portal endpoint or volume is verified here |
| “Build once … forever” and universal selectors | Retired; shared core plus tested workflow/tenant configuration and ongoing maintenance |
| Taleo/HCM treated as one interchangeable adapter | Do not assume interchangeability; identify the actual product/interface before grouping implementations |
| Shared candidate account as preferred MVP mode | Retired; preserve applicant identity and isolation; delegated organisational access needs explicit supported scope |
| Default disability answer “No”, city used as address, opportunity location used as applicant location | Retired; use the person's supplied facts or ask for missing information |
| Clicking Submit or generating an email timestamp means success | Retired; success states require appropriate attributable evidence |
| Automatic SMTP/email fallback on generic failure | Retired; reconcile uncertain effects and validate that an alternative route is actually accepted |
| CAPTCHA solver and “always zero approvals” | Retired as product requirements; use a supported route or user checkpoint, and measure useful authorised work |
| BigQuery required for every attempt | Keep structured audit receipts in the adopted operational store; warehouse use follows an actual analytical need |

The archive remains unchanged, including its illustrative code. That code is not the implementation contract for the current strategy.

## 4. Separate capabilities instead of one “supported” badge

| Capability | What Skilved can claim after validation | Initial placement |
|---|---|---|
| Source resolution | The lead is connected to an attributable issuer notice and route | S03–S04 |
| Route detection | The route type/platform hypothesis and uncertainty are recorded | S03–S04; refreshed before use |
| Preparation | Checklist, selected files, draft text and genuine external route work | S05–S06, refined through R2 |
| Guided completion | User can follow field-specific instructions and handle personal declarations/checkpoints | Existing preparation scope; browser autofill is separate work |
| Browser autofill | Supported fields can be filled in the correct user session, with appropriate scope and review | Conditional S26 adapter slice; not automatically in MVP |
| Delegated submission | A specific supported route can transmit the reviewed application under a current mandate | S26, subject to readiness |
| Reconciliation/status | A permitted method can establish what the destination accepted or reported | Part of each enabled submission route |

The MVP must remain useful when only source resolution, preparation and external handoff are supported. Say “Prepare and apply on the employer's site” rather than advertising automatic submission for an untested platform.

## 5. Route and adapter registry

Use a maintained registry rather than routing directly from a model guess or broad URL substring. The following are proposed concepts to map into the canonical data contracts during implementation, not claims that new database collections already exist.

| Registry field | Required content |
|---|---|
| Route identity | Stable route ID, issuer, category/intake and source revision |
| Destination | Exact validated hosts, tenant/product context, supported path patterns and expiry |
| Detection | Method, evidence, platform hypothesis, last check and unresolved ambiguity |
| Method/sequence | API, email, browser, external/manual or an ordered hybrid workflow |
| Capabilities | Resolve/read, prepare, autofill, submit, reconcile, withdraw where actually supported |
| Adapter/configuration | Adapter version, tenant configuration version, schema and fixtures |
| Access/authority | Source-specific permitted method, destination terms/agreement as applicable and supported delegation model |
| User context | Required candidate account/session, identity binding, required documents and declarations |
| Operations | Owner, timeouts, rate/concurrency limits, retry policy, circuit breaker and review date |
| Evidence | Last validation build/environment, outcomes, limitations and receipt semantics |

Candidate families from the historical plan include SAP SuccessFactors, Oracle Taleo, Oracle recruiting/HCM routes, PageUp, email and programme-specific portals. These names organise research; they do not establish a working adapter or current employer assignment. Do not invent a SETA `/apply` endpoint from the organisation's domain.

Parse and validate URLs before considering platform patterns. Recheck the resolved destination at execution; a host match alone cannot establish employer identity, tenant, vacancy or permission. If the destination changes materially, invalidate the old preflight and resolve it again.

## 6. Adapter responsibilities and execution boundary

| Operation | Contract |
|---|---|
| `inspectRoute` | Read permitted public/authorised metadata without submitting; report identity, requirements, checkpoints and unsupported steps |
| `preflight` | Check current mandate, destination, candidate session, source/version, required facts/files, deadline certainty and duplicate ledger; return explicit blockers |
| `prepare` | Produce a versioned field/document mapping with provenance and unanswered fields; do not invent facts |
| `execute` | Perform only the approved supported effect against the reviewed version and destination; create a durable attempt before dispatch |
| `reconcile` | Use provider receipt/status or another permitted method to determine whether an uncertain attempt took effect |
| `cancelPending` | Stop future undispatched work; do not imply that cancelling a local task withdraws an already submitted application |

Deterministic orchestration controls permission, state transitions, destination checks and dispatch. Models may propose mappings or draft explanations; untrusted pages and model output cannot expand authority. Use the [task/outbox protocol](08_AGENT_EXECUTION.md) for leases, fencing, replay handling and cancellation instead of inventing a second submission queue.

## 7. Identity, declarations and account lifecycle

Bind each application to the actual candidate and appropriate platform account. Isolate browser sessions and stored credentials by user, provider and tenant. A Skilved operator/service identity is suitable only where the destination explicitly supports acting for distinct candidates and preserves their separation; it is not a substitute for everyone sharing one candidate login.

User-authorised account creation needs a supported process for personal terms, verification, MFA, recovery and later user access. Do not accept new declarations on behalf of a person merely because the form has a checkbox. Stop at a required user checkpoint when the current mandate does not cover it. The mandate can cover repeated supported actions within a defined scope; this does not require asking again for every routine field fill.

Never infer disability, identity number, demographic answers, consent, residential address or experience from missing information. An opportunity's location is not the person's address. Missing required facts block the relevant step; optional questions remain unanswered unless the person supplies an answer. Store credentials only if necessary under the adopted security controls; logs and receipts must not include tokens, passwords or complete browser session state.

## 8. Preflight and truthful submission states

Before dispatch, confirm the candidate, current authority, source/destination revision, intended intake, accepted route, required files, applicable declarations and prior attempt ledger. Explain blockers and preserve prepared work. Preflight expires when consequential input or destination facts change.

| Display/receipt state | Evidence required |
|---|---|
| Prepared | Versioned pack/checklist exists; nothing sent |
| External route opened | Link-opening event only |
| Waiting for user | Specific missing fact, login/MFA, declaration or permitted user checkpoint |
| Attempt recorded | Durable intent/attempt exists; not proof of transmission |
| Transmission accepted | Provider accepted the message/request; record actual provider evidence and its meaning |
| Submission acknowledged | Destination explicitly acknowledges this candidate's application for the intended intake |
| User reports submitted | Attributed user report, separate from external confirmation |
| Outcome unknown | Dispatch may have occurred but no reliable determination is available |
| Failed / cancelled before dispatch | Known failure or confirmed prevention of the pending action |

These are presentation/evidence distinctions to map onto existing canonical task/application states, not a replacement enum. A confirmation screenshot is supporting evidence only if it actually establishes the intended action; page load or a requisition number alone is insufficient. An internal attempt ID must be labelled internal. Do not manufacture an employer reference.

For email, preserve the provider message ID and acceptance/bounce information available through the authorised method. Provider acceptance is not proof that the employer received, read or accepted the application. A source-listed address must be an accepted application route for that intake; syntax validity alone does not establish this.

## 9. Retry, fallback and recovery rules

- Safe read/preparation operations can retry within bounded backoff and resource limits.
- A timeout after dispatch creates an uncertain effect unless non-delivery is established. Reconcile before repeating the submission or switching channels.
- Do not automatically switch Gmail to SMTP, portal to email, or one account to another after an ambiguous error. A second transmission may create a duplicate or change applicant identity.
- Alternative routes require current issuer instructions or supported agreement, applicable user authority and a duplicate check. Some hybrid routes require both steps; follow the actual sequence rather than treating them as interchangeable fallbacks.
- A CAPTCHA or unsupported MFA/identity checkpoint pauses for the appropriate user action or supported alternative. No bypass service is a required dependency.
- Form/schema drift disables the affected route capability until repaired and retested. Other validated preparation/source capabilities can remain available.
- Cancellation stops future covered actions and revokes undispatched intents. Withdrawing an acknowledged application is a separate action supported only by an actual destination process and mandate.

The safe fallback is useful: retain the pack, show the exact destination and reference, identify the unfinished step and let the user record what they did. Never claim a manual-fallback queue actually submitted the application.

## 10. Build order and selection criteria

| Stage | Work | Completion evidence |
|---|---|---|
| S03–S04 | Source-chain resolution, route metadata, uncertain detection and issuer-source monitoring | Trace real leads to supported primary notices/routes; reject misleading redirects |
| S05–S06 | Route-aware checklist, selected pack, personal-fact review and external handoff | User completes a useful preparation task across all six categories |
| S07–S11 | Durable tasks, activity, cancellation, honest outcome records and meaningful telemetry | Restart/replay and authority tests; no false submission claims |
| S26 conditional | One scoped authorised API/email/browser adapter, including reconciliation and operations | Representative accepted/failed/uncertain cases plus user and destination authority |
| Subsequent S26/S34 slices | Reuse platform core with independently validated tenant/workflow support | Measured benefit, acceptable maintenance cost and stable controls |

S26 is currently placed in the conditional R5 portfolio, but its dependency is R2 reliability plus route-specific readiness; it does not technically require completing every R3/R4 feature. If a valuable supported route becomes available earlier, explicitly reprioritise a bounded slice and revise capacity/roadmap allocations. This document does not silently accelerate it or add all-platform submission to the MVP.

Choose the first route from actual user demand, issuer acceptance, access, completion burden, testability, maintenance effort and recurring cost. Email is a candidate, not automatically the most valuable or universally accepted route. A documented API can be preferable when available; an unsupported generic browser submitter is not the default fallback for every unknown site.

## 11. Validation and operating measures

| Test ID | Scenario | Required result |
|---|---|---|
| ATS-01 | Aggregator links to issuer notice and different recruitment host | Preserve all roles and correct intake; no domain-equality assumption |
| ATS-02 | Official relationship missing or destination changes | Unresolved/review state; no fabricated source or authorised-submission claim |
| ATS-03 | Two employers share a platform but differ in questions | Configuration scope respected; unsupported flow held for review |
| ATS-04 | Candidate A session used for candidate B | Execution denied; no cross-user state/file leakage |
| ATS-05 | Required personal fact/declaration absent | User checkpoint; no invented answer or silent acceptance |
| ATS-06 | Provider accepted action, worker lost response | Unknown/reconciling state; no blind second send or alternate-channel fallback |
| ATS-07 | Submit click succeeds but no acknowledgement exists | No confirmed-submission label or invented reference |
| ATS-08 | Hybrid route requires portal registration before email | Candidate-specific registration evidence required; steps recorded separately |
| ATS-09 | Mandate revoked or source materially changed before dispatch | Pending action prevented or returned for renewed review |
| ATS-10 | Form drift, CAPTCHA or unsupported checkpoint | Affected capability pauses; pack and actionable handoff preserved |
| ATS-11 | Email accepted then bounced | Update delivery evidence without claiming employer acceptance |
| ATS-12 | User cancels after acknowledged submission | Explain that local cancellation is not withdrawal; no unmandated withdrawal |

Track source-resolution rate, route-detection accuracy/unknowns, preparation task success, acknowledged submissions, uncertain attempts, duplicates, wrong-destination attempts, manual interventions, cost and maintenance hours. Report denominators, category/tenant mix, sample period, configuration/version and exclusions. Separate supported catalogue routes from successfully attempted applications; neither establishes national coverage.

Preserve minimised audit receipts: actor/mandate, opportunity/intake, source and pack versions, adapter/configuration, attempt/idempotency key, timestamps, state changes and actual external receipt provenance. Private screenshots/documents follow the evidence retention and access policy. Monitoring detects drift, failures, unusual volume and pending uncertain effects; a route owner can pause submission independently of discovery.

## 12. Definition of an enabled adapter

A route is enabled only after its supported capability scope, identity model, destination/terms, user authority, representative tests, reconciliation, source changes, privacy controls, operating owner and cost are evidenced. Record unsupported steps and user-facing wording. A detector, illustrative code sample or successful demo on one page is not platform-wide coverage.

Use [release validation](../quality/11_VALIDATION_AND_RELEASE.md) and [access controls](../security/02_ACCESS_AND_DATA_PROTECTION.md) for shared gates. This strategy retains autonomous application assistance as a meaningful product direction while making its claims and execution boundaries testable.
