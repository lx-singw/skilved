# Data governance, retention and rights operations

## M0 companion records — 13 September 2026

Apply the [discovery contract](../engineering/04_DISCOVERY_COMPANION_IMPLEMENTATION.md) before collecting new suggestions/reports. Anonymous access still creates data responsibilities. Public source records, private suggestion receipts, security logs and browser-local progress have distinct purposes; no general claim that M0 collects no data.

| Record | Proposed retention/handling baseline | Required launch decision |
|---|---|---|
| Browser-local progress | Until the person removes it, clears browser data or storage is unavailable; clear controls and shared-device warning | Test actual storage/clear behaviour; no cloud backup claim |
| Receipt access capability | Proposed 30-day maximum validity from issuance; earlier revocation/withdrawal supported | Configure expiry and disclose loss of access; store server hashes, redact logs |
| Raw suggestion URL and private intake metadata | Proposed removal within 30 days after resolution/withdrawal; review unresolved records at 30 days and close/delete by 60 days unless a documented necessary exception applies | Purpose, deletion job and owner; raw links must not contain private/session data |
| Reports and investigation details | Proposed 30-day review after resolution; retain only justified minimal decision evidence under actual incident/legal requirements | Separate unsupported allegations/private details from published correction; record any exception and next review |
| Abuse/security request metadata | Proposed short 14-day operational window, with minimal evidenced incident records separated when justified | Confirm provider logs, identifiers, access and actual deletion capability |
| Public source/check/correction records | Retain necessary permitted attribution/version evidence under source reuse and public-record policy | Content rights, withdrawal/tombstone behaviour and review schedule |

These are recommended operating defaults, not statutory retention periods or adopted legal terms. Before launch reconcile with vendors, actual purposes, legal obligations and privacy notice; any change must be explicit. Clearing browser receipt access does not itself delete the server suggestion; provide a separately understandable withdrawal/deletion action. Withdrawal of a suggestion does not erase an independently sourced public announcement or justified incident evidence. Expired capabilities cannot be recovered through an unauthenticated identity guess.

Source facts and derived explanations cannot be reused for unrelated personal profiling. No private submission data enters public metadata, general model training or unrestricted analytics. Review deletion across worker queues, logs and retained payloads; document backup/processor limitations and actual exceptions honestly. [DCF-10/12/21](../quality/02_DISCOVERY_COMPANION_ACCEPTANCE.md) covers the resulting controls.

Date: 11 September 2026. Status: proposed internal schedule requiring purpose/legal/vendor validation before production. These periods are planning defaults, not statutory retention claims.

## Data inventory and proposed retention

| Class | Purpose / access | Proposed treatment | Deletion considerations |
|---|---|---|---|
| Public opportunity metadata | Discovery; public approved projection | Keep active facts while useful; retain a minimal dated closed record for workspace integrity | Source licence/complaints may require change; private source artefacts separate |
| Raw source snapshots | Review/provenance; restricted operations | Start with 90 days where permitted, then minimal hashes/excerpts/revision metadata | Honour source rights and incident/legal hold needs |
| Personal record and evidence | User's continuing career use; owner/grants | Retain while account purpose continues; annual purpose/inactivity review proposed | Do not silently delete a valuable career record merely for missing a weekly visit |
| Application snapshots | User history and selected recipient context | User-controlled archive while account exists; review unnecessary sensitive attachments | External recipients may retain their own copies |
| Expired share grants | Audit of authorised sharing | Remove access immediately at expiry/revocation; retain minimal audit under schedule | Avoid reusable live tokens in logs |
| Agent task payloads | Execute user's mandate | Minimise; proposed 30-day detailed payload window after completion | Keep a small useful receipt rather than full prompts/private documents |
| Security/audit logs | Incident detection/accountability; restricted | Proposed 90-day searchable window, longer only justified | Redact sensitive fields; documented holds |
| Product analytics | Understand task completion; minimised identifiers | Proposed 90-day raw event window, de-identified aggregate review | Delete/link-sever where applicable; small groups may remain identifiable |
| Support records | Resolve request; restricted support | Proposed closure plus 90 days unless dispute/purpose requires longer | Do not copy entire vault to ticket system |
| Backups | Recover service; restricted operations | Proposed rolling 30 days if selected provider/cost permits | Deleted data may remain inaccessible until backup expiry; restore re-applies deletion ledger |
| Financial/contracts | Accounting, service and legal obligations | Determine schedule with adviser for actual entity and record type | Do not apply short product-analytics retention to statutory records |

Before enabling a data class, record controller/responsible-party and operator/processor roles as applicable, purpose, fields, source, lawful basis, subjects, recipients, storage/transfer locations, retention, security, rights route and owner. Consent is not a universal substitute for this analysis.

## Data quality and provenance

Maintain origin, timestamp, responsible actor, claim scope and correction history. Distinguish user assertion, observer reference, assessment and official credential. A digital signature authenticates a signing relationship under its scheme; it does not independently establish the truth of every claim. Corrections propagate to current views while historical snapshots retain an appropriate correction context.

Never infer sensitive characteristics solely to improve matching. Collect category-specific eligibility information only when useful and justified, with clear user control. Unknown fields remain unknown.

## Access, correction and deletion requests

1. Receive through a monitored channel and acknowledge under the adopted policy.
2. Verify identity proportionately; avoid collecting more sensitive identity data than necessary.
3. Identify relevant records, processors, recipients and legal holds.
4. Decide action and applicable time requirements using current law and the actual circumstances.
5. Perform export/correction/deletion using an auditable job; restrict new sharing during deletion where needed.
6. Confirm completed scope, any justified retained categories, backup handling and external-recipient limitations.
7. Record minimal evidence of handling without retaining the deleted material in the ticket.

An account deletion must cover active objects, derivatives, search indexes, analytics linkage and pending tasks. It must not leave live agent mandates or organisation grants. A legal hold is scoped, documented, access-restricted and reviewed; it is not a blanket excuse to retain everything.

## Public releases and research datasets

Do not publish raw learner records, contact lists or identifiable evaluation inputs. Synthetic fixtures must be labelled synthetic and separated from live opportunities. De-identification requires considering combinations and small cohorts; removing a name alone is insufficient. Public benchmark data needs a rights and re-identification review.

## Governance acceptance

S02 defines the inventory and ownership. S05 implements evidence lifecycle. S10 exercises rights and retention behaviour. R3 adds organisation/processor-specific schedules. Country expansion rechecks obligations rather than copying a South African notice. The [trust policy](../security/10_TRUST_PRIVACY_AND_SAFETY.md) provides legal context and primary sources; this document supplies the operating procedure.
