# Trust, privacy and safety

Status: current product and engineering requirements, 2026-09-11. Owner: founder until named operational and specialist owners accept responsibility. These are readiness requirements and proposed controls, not a claim that the repository or any live deployment already implements them. Obtain appropriate South African professional review for the actual service and contracts before the relevant regulated activity begins.

Related: [data contracts](../engineering/07_DATA_AND_API_CONTRACTS.md), [agents](../engineering/08_AGENT_EXECUTION.md), [opportunity operations](../operations/09_OPPORTUNITY_OPERATIONS.md), [release evidence](../quality/11_VALIDATION_AND_RELEASE.md), [research register](../research/13_RESEARCH_AND_EVIDENCE.md).

## 1. Product promise and prohibited shortcuts

Skilved helps a person understand requirements, prepare evidence, receive assistance and carry progress forward. It does not guarantee admission, funding, employment, accreditation or an income increase. A recommendation must disclose its source and important uncertainties. An AI confidence score is not evidence of eligibility.

Private records are private by default. Public career sharing is a separate, deliberate action on selected items. Employer payment never purchases a favourable trust rating, a qualification decision, confidential records, or an undisclosed ranking advantage. Promotional placements must be labelled and kept separate from eligibility assessments.

Growth targets do not authorise uploading address books, harvesting personal contact details, messaging groups, impersonating applicants, or sharing their records with partners. A partnership prospect is not an authorised data recipient. Publicly reachable documents are not automatically licensed for reuse; robots rules are not access authorisation. [Robots Exclusion Protocol, RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html)

## 2. Corrections to archived assumptions

| Archived assumption | Current treatment |
|---|---|
| POPIA invariably imposes a 72-hour breach deadline | Do not import another jurisdiction's deadline. Use the regulator's South African notification process and the applicable timing obligation; begin assessment and containment immediately |
| Calling Skilved a platform establishes it is not an employment agency | Actual activities require classification; wording in terms cannot settle this |
| Identity numbers are automatically a special-information category | Treat them as high-risk personal identifiers; classify each field and use case rather than equating all sensitive information with a statutory category |
| Hosting in South Africa proves compliance | Map all processing, support, backups, telemetry and AI recipients; hosting location alone does not establish lawful processing |
| Cloud encryption prevents document exposure after a database compromise | Metadata, links, tokens and permissions can still expose people; test the whole access path |
| Consent during signup permits every future use | Record purpose-specific choices and other appropriate processing grounds; a product change requires reassessment |
| All anonymised outcomes can be retained forever | Demonstrate effective de-identification and continuing purpose; small-group records can be identifiable |
| A government integration, verification badge or accredited assessment can be promised now | Require actual access, issuer authority, accepted evidence and working validation first |
| A fixed legal/security budget proves readiness | Use implemented controls, tested procedures and appropriate expert review; spending is not certification |

The regulator describes compromise reporting as required as soon as reasonably possible after discovery and directs reporting through its eServices portal from April 2025. This is the operational source to recheck when an incident occurs. [Information Regulator POPIA guidance](https://inforegulator.org.za/popia/)

## 3. Legal design decisions to resolve before collection

POPIA covers lawful processing, security, operator relationships, access/correction and retention. Its section 72 permits cross-border transfers only under specified conditions; section 57 can introduce prior-authorisation issues for certain processing, including particular foreign transfers of children's or special information. Section 71 addresses certain consequential decisions based solely on automated processing. Assess the actual data flow and decision, rather than asserting a blanket South African hosting rule or unrestricted AI processing. [POPIA consolidated text, sections 11–24, 57, 71–72](https://www.justice.gov.za/legislation/acts/2013-004.pdf)

Product implementation requirements:

1. Maintain a processing register: purpose, necessary fields, subjects, processing ground, recipients, country, retention rule, owner and user notice.
2. Establish the accountable legal entity and responsible person; confirm applicable Information Officer registration and related obligations. Do not invent a universal 30-day registration deadline.
3. Record whether Skilved or an organisation determines each purpose, and specify operator/responsible-party responsibilities in the agreement. An organisation uploading a spreadsheet must establish its authority to share it.
4. Publish understandable notices at collection, sharing and optional AI processing points. Explain practical controls, contact routes and limitations.
5. Review consumer terms, cancellation/refund terms, tax and corporate obligations for the actual offering. Archived tax thresholds, procurement shortcuts and blanket cooling-off statements are not current advice.

Employment-services classification is a specific commercial gate. Section 15 of the Employment Services Act prohibits fees to work seekers for providing employment services, with a statutory mechanism for specified exceptions. Section 13 addresses agency registration. As confirmed on 12 September 2026, the consumer tier is entirely free and Skilved does not plan to rely on a fee exception. Organisation-paid administration/support does not itself resolve legal classification or registration obligations; assess the actual services professionally before launch. [Department of Employment and Labour: Employment Services Act](https://www.labour.gov.za/DocumentCenter/Acts/Public%20Employment%20Services/Employment%20Services%20Act%202014.pdf)

## 4. School learners and people under 18

School leavers can be adults or minors. Do not infer age from graduation status. POPIA's children's-information restrictions have exceptions, including prior consent of a legally competent person; regulator authorisation is a distinct route where relevant, not automatically required for every child account. A teacher or coordinator is not automatically the competent person. [Information Regulator children's guidance](https://inforegulator.org.za/wp-content/uploads/2020/07/GuidanceNote-Processing-PersonalInformation-Children-20210628-1.pdf)

The initial controlled alpha may recruit adult apprentice peers and adult school leavers while the school-learner pathway is prepared. This is a deployment sequence, not removal of the school audience from the vision. Enable minors' accounts only after the age/authority, privacy, safeguarding and escalation gates below are demonstrably ready.

| Surface | Required default and release evidence |
|---|---|
| Age routing | Collect only the age information needed; explain why; handle unknown age and corrections without exposing documents |
| Competent-person authority | Defined verification and record of authority, scope, notice version and withdrawal; reviewed process for disputed authority |
| School/cohort membership | Named accountable organisation; controlled invitations; remove departing staff access; no public learner roster |
| Contact | No open adult-to-minor direct messaging at first; supervised, reportable help channels with a named responder |
| Sharing | No public school timetable, precise location, identity documents, rejection details or financial circumstances |
| Moderation | Report/block controls, evidence preservation with restricted access, escalation owner and published support availability |
| Transition to adulthood | Review continuing authority and sharing; let the person control their account under the applicable legal circumstances |
| Research and publicity | Separate permission process for interviews, testimonials, photos and public stories; declining must not remove core service access |

A school logo or supervisor account is not proof that a deployment is safe. Complete a scenario exercise involving impersonation, unwanted contact, a disputed guardian, a removed coordinator and an accidental public link before enabling the relevant flow.

## 5. Information classification and minimal collection

| Class | Examples | Default controls |
|---|---|---|
| Public source facts | Issuer name, published deadline, application URL | Provenance, versioning, reuse permission and correction route |
| Private account data | Contact details, goals, application status | Authenticated owner access; defined organisational grants |
| Private evidence | Work sample, feedback, qualification copy | Item-level sharing; recipient/purpose/expiry; audit event |
| High-risk documents | Identity copy, medical document, financial proof | Avoid collecting when a checklist or direct issuer submission suffices; additional review before enabling storage |
| Organisation operations | Memberships, cohort progress, support notes | Tenant isolation; need-to-know roles; exports restricted |
| Analytics | Journey events, aggregate outcomes | Minimal identifiers; suppress small identifiable groups; no raw documents in event payloads |

Keep banking credentials, account passwords, authentication codes and payment-card data out of the career vault. Skilved should not collect a full identity document merely to let a person browse opportunities or maintain a checklist.

Source documents may contain applicant contact details or signatures. Extraction must discard unnecessary personal information before publication. Logs must use opaque identifiers, not CV text, personal filenames, full source query strings containing tokens, or document contents.

## 6. Sharing and permissions contract

Represent a grant with subject, resource IDs, recipient, purpose, allowed actions, issue time, expiry, revocation state and approving actor. The server rechecks the current grant on every protected action. Membership alone must not imply access to every learner document.

| Actor | Default authority |
|---|---|
| Person | Own records; select what to share; export, correct and request deletion |
| Coordinator | Agreed progress fields for their cohort; document access only when specifically needed and granted |
| Mentor | The particular help request and selected evidence; no unrelated application history |
| Employer/provider | Material shared for a specified interaction; no bulk browsing of private vaults |
| Agent | Minimum inputs and tools for its assigned job; no implicit inheritance of all user permissions |
| Support/admin | Case-specific access with reason and audit; no routine unrestricted document browsing |

Private storage must prevent anonymous listing and retrieval. Authenticated download mediation or narrowly scoped short-lived URLs must be tested. Revoking a grant cannot recall a downloaded copy or necessarily invalidate an already issued URL instantly; disclose residual access windows and use shorter windows for more sensitive material. Revoke future access and request recipient deletion where applicable, without promising technical recall.

## 7. Evidence trust and dispute handling

Use specific labels: self-reported; uploaded copy, issuer unconfirmed; peer reviewed; supervisor attested; issuer-confirmed; cryptographically checked; expired; revoked; disputed. Record the evidence and scope supporting each label. Never collapse these into a universal employability score.

A verifiable credential establishes checks concerning an issuer's statement and the credential's integrity/status; verification does not establish that every underlying assertion is true. The receiver still needs to decide whether the issuer and evidence suit its purpose. [W3C Verifiable Credentials Data Model 2.0](https://www.w3.org/TR/vc-data-model-2.0/)

Dispute workflow: report -> acknowledge -> limit misleading display where appropriate -> preserve relevant provenance -> seek issuer/person response -> reasoned decision -> notify affected recipients where warranted -> appeal/correction route. Log changes without exposing dispute allegations publicly. Do not allow pay-to-remove adverse findings or pay-to-earn trusted status.

For RPL and trades, Skilved may organise evidence and help users find the authorised route. It must not claim to confer artisan status or replace the relevant assessment. QCTO describes trade-test and approved evidence requirements for applicable pathways. [QCTO learner guidance](https://www.qcto.org.za/for-learners.html)

## 8. AI and external-action safety

Treat fetched pages, uploaded files, user comments and model output as untrusted input. Text inside them cannot instruct an agent to reveal records, change policy, contact someone or use a new tool. Separate extracted data from instructions and constrain tool calls with server-side policy.

Proposed permission ladder:

1. Read public facts and explain a source.
2. Draft private checklists or messages, with uncertainty visible.
3. Update reversible internal records within a user-authorised workflow, retaining history.
4. Execute a specific consequential external action only through supported access and a recorded authorisation that covers recipient, content and attachments.

R1/R2 should centre on preparation and user-controlled external application. Do not infer submission from an outbound click, or placement from an acceptance message. Never invent signatures, qualifications, experience, consent, application answers or employer feedback. Apply tool limits, timeouts, retry budgets and idempotency; inability to complete must be visible.

Raw high-risk documents stay outside general-purpose AI processing by default. Any proposed exception requires a defined need, appropriate processing basis, vendor/retention review, restricted scope and testing. Redaction itself needs verification; it is not a guarantee.

## 9. Notifications, marketing and social participation

Separate requested operational reminders from promotional campaigns. Maintain channel, purpose, consent/other applicable basis, notice version, opt-out status and suppression history. Do not assume a telephone number given for support permits promotional WhatsApp messages. Electronic direct marketing has specific POPIA conditions and exceptions; evaluate them for the actual campaign. [Information Regulator direct-marketing guidance](https://inforegulator.org.za/wp-content/uploads/2020/07/GUIDANCE-NOTE-ON-DIRECT-MARKETING-IN-TERMS-OF-THE-PROTECTION-OF-PERSONAL-INFORMATION-ACT-4-OF-2013-POPIA.pdf)

A share button prepares a link for the person to send. It does not silently post to a group. Automated service notifications require explicit product configuration and applicable user permission. No external messages were authorised or sent by this documentation exercise.

Moderation categories include scam opportunities, impersonation, harassment, discriminatory exclusion, coercive requests for documents or money, misleading credentials and unsafe contact. Keep private reports available even when public social posting is disabled. Publish actual support coverage; a solo founder must not promise a continuously staffed emergency service.

## 10. Retention, export and deletion

Before live collection, approve a retention schedule for each data class with its purpose, trigger, duration, deletion mechanism, backup handling and any justified legal hold. Do not carry forward archived arbitrary perpetual retention.

Proposed starting design: short retention for extraction staging; user-controlled retention for reusable evidence while needed; time-bounded support and audit records; backup expiry with restore-time deletion replay. Final periods depend on the actual purpose and agreements and must be published before collection. De-identification requires re-identification risk assessment, especially for small cohorts and rare occupations.

Export should include structured profile data, evidence metadata, user-owned files where available, grants and meaningful statuses. A deletion request must cover derived search indexes, queued work, document links and vendor-side processing within contractual capability. Acknowledge promptly, verify proportionately, communicate the actual completion plan and explain justified exceptions. Do not promise instant deletion from immutable backups or external recipients.

## 11. Security and incident operation

Before private records: tenant/owner access tests, private-bucket checks, administrator MFA, secret handling, service-identity separation, restricted worker invocation, abuse controls, safe upload handling and a successful recovery exercise. Public website invocation must not become public worker invocation by inheritance from a Terraform module.

Incident sequence: contain exposure; preserve a restricted timeline and relevant evidence; assess affected systems, people and data; involve the accountable owner and appropriate expertise; meet applicable notification requirements; provide practical user assistance; recover and verify; document cause and preventative changes. Do not wait for complete certainty before starting the assessment. Do not publish victim details in a public incident report.

## 12. Phase gates and proof

| Phase | Trust evidence required |
|---|---|
| R0 foundation | Threat/processing register, source permissions process, legal questions assigned, truthful claim vocabulary |
| R1 controlled alpha | Consent/notice routes, access isolation, deletion/export exercise, source correction, restricted document use, incident owner |
| R2 public MVP | All six category flows tested; scam reporting; rate/cost controls; support coverage; reviewed terms and role classification; minors only if their separate gate passes |
| R3 social/partners | Cohort permissions, moderation exercises, recipient agreements, referral consent, removal and disputed-authority tests |
| R4 credentials/RPL/retention | Issuer agreements, revocation/status handling, assessment boundaries, specialist review and credential acceptance evidence |
| R5 intelligence/expansion | Cross-border and new-country review, data reuse assessment, bias/outcome evaluation, improved incident capacity |

Gate failure changes the release plan; it is not resolved by adding a disclaimer. Record test evidence and named approval responsibility in the release ledger. No certification or implemented-control claim follows from this document alone.
