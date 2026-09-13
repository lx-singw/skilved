# Access control and data protection specification

Date: 11 September 2026. Status: required design, implementation unverified. Applies to APIs, database rules, storage, queues, exports, support tooling and backups.

## Authorisation matrix

| Principal | Allowed by default | Explicitly excluded |
|---|---|---|
| Anonymous visitor | Published opportunity projection and public help pages | Private records, underlying source artefacts with restricted rights, user enumeration |
| Record owner | Own record/workspaces and permitted exports; grant/revoke selected access | Editing server roles, official issuer status or another person's reference |
| Invited recipient | Exact permitted snapshot/items until expiry or revocation | Whole-record search, unrelated files, further invitations unless separately authorised |
| Referee | Read the requested context and contribute an attributable response | Quietly rewriting the owner's entire record |
| Coordinator | Current organisation roster and individually/programmatically justified grants | Private unrelated record data; access surviving removal without a valid basis |
| Source reviewer | Source queue, public metadata and review receipts | Learner vault contents |
| Support operator | Minimal diagnostic metadata; exceptional scoped access with reason and expiry | Routine unrestricted impersonation or unlogged downloads |
| Worker | Specific task inputs under current mandate and service identity | General admin rights or inherited browser authority |
| Infrastructure administrator | Necessary control plane actions under separately protected identity | Treating infrastructure access as routine product-data access |

Deny by default. The API derives identity from verified authentication, never a request body's owner ID. Check tenant and object ownership on reads, writes, lists, exports, search results and signed-URL creation. A database client rule alone does not protect a server SDK route; server-side checks remain mandatory.

## Credentials and environments

Use separate development, test and production identities/resources. Production credentials never enter examples, Git history, screenshots or browser bundles. Prefer short-lived workload identity over downloadable service-account keys where supported. Store secrets in an approved secret manager with an owner, purpose, rotation/revocation process and access log. Public browser configuration must be explicitly classified; “Firebase config is public” is not permission to expose private keys.

Require MFA for privileged accounts. Document account recovery and a protected emergency access process; test recovery without publishing backup codes. A second trusted operator is a future continuity control, not an assumed team member. If absent, record the founder availability risk and narrow promised support hours.

## File lifecycle

1. Authorised owner requests upload into a private quarantine location with size/type restrictions.
2. Server records owner, intended use, hash and processing state without trusting the filename or client MIME alone.
3. A bounded scanning/parser process evaluates the upload. Until allowed, recipients cannot retrieve it.
4. Safe derivative/preview is produced if appropriate; the original stays private.
5. Sharing checks current grants at access time or uses a deliberately short-lived signed link with documented expiry exposure.
6. Revocation stops future authorised retrieval. An already downloaded file cannot be recalled; issued signed links may remain usable until expiry unless the selected storage mechanism invalidates them.
7. Deletion removes active copies and schedules derivative, index and backup lifecycle handling under the retention policy.

Do not expose storage bucket paths as public permanent document URLs. Avoid sensitive documents in URL parameters, CDN caches and email attachments. The initial useful record should minimise requests for identity documents.

## Encryption and data location

Inventory transport encryption, provider storage encryption, key access and backup encryption with configuration evidence. Customer-managed keys or application-level encryption are later risk-driven options with recovery and operating costs; merely listing KMS in a diagram does not establish stronger protection. Select regions after checking service availability, recipients, processor terms, transfer safeguards, latency and price. South African hosting alone does not establish POPIA compliance; see [trust policy](10_TRUST_PRIVACY_AND_SAFETY.md).

## Agent authority

A durable mandate states actor, purpose, resources, action types, destinations, validity, trigger and limits. Re-evaluate it at execution time. A queued task cannot use a revoked grant, changed organisation membership or expired instruction. Model output proposes content; deterministic code validates shape, provenance and action authority. External content cannot modify the mandate. Tool errors and uncertain provider responses produce reviewable states rather than invented success.

## Audit record

Capture actor/service, action, resource identifier, authorisation result, timestamp, correlation ID and reason where required. Avoid full private payloads. Restrict audit modification and reading, define retention and monitor privileged changes. A person's activity page and security audit log have different audiences; do not expose internal security or other users' data in the former.

## Acceptance

S02 establishes ownership and roles. S05 establishes private evidence handling. S07 proves task boundaries. S10/S11 prove revocation, deletion, privileged access and release controls. Run negative tests against the actual deployed architecture in a safe test environment; emulator-only evidence does not establish cloud IAM correctness.
