# Bounded document identity evidence and a fresh mixed batch

29 October 2026. Follow-up to [shared employer onboarding](204_EVIDENCE_BACKED_EMPLOYER_ONBOARDING_2026-10-29.md) and the [autonomous delivery target](../engineering/17_AUTONOMOUS_OPPORTUNITY_SYSTEM.md).

## Result and limits

The onboarding collector supports small PDF identity documents through one shared adapter. Two real company-directory/corporate/careers evidence sets pass the existing checks and complete an explicit Source-role review in the **local emulator**. No live employer authority is registered. The exchange PDF candidates remain unavailable; their failed captures cannot qualify.

A newly collected publisher-ordered RecentJobs batch still yields **zero accepted originals, AI attempts, private drafts or public records out of ten notices** in normal worker replay. All ten exceptions remain visible. Corporate identity is only one step: the Sasol route now reaches `DELEGATION_LINK_UNSUPPORTED` rather than `CORPORATE_AUTHORITY_UNQUALIFIED`. It still cannot pass original-vacancy corroboration.

This is shared adapter/onboarding evidence, not production or unattended publication qualification. Hosting and scheduling remain undeployed. Employer crawling is opt-in and remains off in the staging launcher. No live database, source, machine grant, quota or publication state changes.

## Shared PDF contract

The private employer plan optionally sets `identityFormat: "pdf"`; omitting it retains HTML behavior. PDF is accepted only for the identity observation. Corporate/careers pages retain their HTML contract. Existing HTML bundle hashes and immutable proposal identities remain unchanged.

Transport explicitly requests `application/pdf`, preserves binary bytes and retains exact HTTPS URL approval, public DNS pinning, TLS socket verification, redirect checks, identity encoding and body limits. It does not accept arbitrary downloads or expand the allowed origins. Robots and pacing still precede collection.

PDF processing uses Poppler with stdin/stdout, fixed arguments and no shell. Each subprocess has a five-second timeout with forced termination, a three-second CPU limit, 256 MiB address space, 32 descriptors and bounded output. Only PATH, a fixed locale and a nonexistent HOME are passed to the subprocess; application credentials are not inherited. Limits are:

| Evidence | Bound |
| --- | --- |
| PDF bytes | 400,000 |
| Pages | 1–20 |
| Extracted text | 120,000 UTF-8 bytes |
| Serialized observation | 900,000 bytes |

Malformed, encrypted, empty/image-only, oversized and over-page-limit documents are held. No OCR, JavaScript execution, attachment extraction or linked-resource acquisition is added. Missing tools have a fixed error outcome. Poppler and `prlimit` are installed in the worker/web runtime base and the catalogue CI test environment.

The private snapshot retains canonical base64 original bytes, SHA-256, byte/page counts, parser version and normalized text. Recording and qualification re-extract the submitted bytes and compare all derived fields. Hashes and re-extraction establish internal integrity; they do not establish document ownership or that a submitted URL published those bytes. Source-role verification remains necessary. A parser/environment disagreement is held, not silently reinterpreted.

The identity adapter recognizes explicit printed HTTP(S) or `www.` corporate website hosts. It preserves the printed pointer, requires the exact proposed corporate hostname and does not derive authority from an email, similar hostname or userinfo URL. Printed HTTP addresses are evidence pointers, not fetched or silently followed. Warning contexts defeat corroboration. A PDF qualification quote must contain both the issuer and an explicitly printed matching website pointer from the pinned text, within the existing quote bound. Source-role confirmation of the independent evidence kind, current authority preconditions, expiry and one-time review all remain required.

Example plan shape (fictional):

```json
{
  "version": 1,
  "employers": [{
    "issuer": "Authored Forge",
    "corporateUrl": "https://corporate.example/",
    "careersUrl": "https://corporate.example/careers/",
    "identityUrl": "https://directory.example/notices/company.pdf",
    "identityFormat": "pdf"
  }]
}
```

Use the existing private `onboard:employers`, `employer-onboarding-record` and `employer-onboarding-review` workflow. Recording alone creates no authority. PDF support does not add company-specific code or qualify original job-advert PDFs, email recipients or ATS tenants.

## Real acquisition and local authority review

Two small exchange-hosted PDF candidates were assessed: [Sasol's metrics announcement](https://senspdf.jse.co.za/documents/SENS_20260423_S520270.pdf) and [Nampak's announcement](https://senspdf.jse.co.za/documents/SENS_20251219_S515150.pdf). Native GET collection reports `UNSUPPORTED_RESPONSE`. Subsequent bounded metadata-only HEAD probes return HTTP 403 with HTML content types for both. They are retained as incomplete evidence and remain unqualifiable even with a Source-role qualification request. No alternate headers, cookies, proxy, browser-derived document or relaxed transport policy substitutes for these failed captures.

The existing `reviewed_directory` policy is then exercised using the independently maintained [Sasol company profile](https://stockanalysis.com/quote/jse/SOL/company/) and [Nampak company profile](https://stockanalysis.com/quote/jse/NPK/company/). Native captures include visible company identity and explicit corporate website links. These are directory evidence, not government/exchange identity certificates. Their trust classification is an explicit local Source-role review, not an automatic decision based on a different origin.

Both directory/corporate/careers bundles pass the existing HTML checks and create two versioned corporate roots in the local emulator. The blocked PDF proposals create no roots. These roots carry no email authority or ATS delegation. The authored local reviewer is disabled before the mixed worker batch. No live account is impersonated or granted a role; no staging authority is written.

The bounded acquisition sequence makes 41 logical native retrieval/probe attempts: one document-host robots probe, twelve PDF onboarding/careers-path attempts, two HEAD probes, ten directory onboarding attempts, fourteen fresh publisher/original collection attempts and two corporate robots captures for replay. This counts logical retrieval calls, not every possible redirect hop. Provider calls are zero.

## Fresh mixed-batch result

Selection is frozen before detail acquisition: the first ten distinct notice URLs on the first RecentJobs apprenticeship listing, in publisher order, with no title/employer exclusions. All ten parse. The listing order matches the prior same-day cohort; this is a fresh acquisition, not a claim of ten new unseen notices. Raw responses, failed rows and the declared selection remain private.

The normal worker replays that newly saved evidence under one unchanged publisher registration/revision and one ingest-only machine grant, with two locally reviewed reusable roots. Every requested replay observation is present. It does not fabricate robots or employer responses. Reviewer access is inactive during the run.

| Stage/outcome | Count |
| --- | --- |
| Discovered and parsed notices | 10 |
| Incomplete date/method precision | 5 |
| Source date not open | 2 |
| Unsupported original corroboration | 3 |
| Matched originals / extraction / validation | 0 / 0 / 0 |
| Private drafts / public records | 0 / 0 |

The three original holds comprise two unsupported email methods and one unresolved corporate-to-ATS delegation. Shared company identity now resolves for the portal case, but its careers layout/link scope is unsupported. The previously measured exact vacancy-binding and South African deadline disagreement remain separate concerns; this run does not pass or erase them.

There are no model calls or budgets created in the local batch. No provider is invoked because no notice passes the prerequisite checks. No extraction-accuracy or positive end-to-end claim follows. The replay validates processing/state decisions on current captured evidence; it does not reproduce live network timing or run an unattended service.

## Verification and next work

**301 distinct affected tests pass:** 114 transport/document/collector/parser/resolver/policy/coverage/staging cases and 187 emulator onboarding/registry/origin/worker/undated cases. The first run exposes clipping in the authored PDF test fixture; wrapping its long fixture line corrects the fixture, followed by passing document and all five onboarding store cases. The production checks are not relaxed. Contract typechecking, production worker packaging, changed-document links and Git whitespace are checked. The full catalogue suite is not rerun; the earlier intermittent suggestion-route failure remains open.

Both staging images are built locally with native WSL Buildx. Build-time host networking is used after the initial package-install build stalls; runtime verification uses `node` with `--network none`. Verification compares all six current PDF/onboarding/fetch/store/worker source hashes, decodes authored PDF bytes with the packaged tools, rejects changed derived evidence and rejects unconfigured activation. The web build also compiles, typechecks and generates its pages. No container is deployed or scheduled. Build/package checks do not demonstrate database-backed hosting or publication.

Private plans, source captures, probes, bundles, replay receipts and image/test logs remain ignored under `.artifacts/groq/pdf-identity-2026-10-29/` and `.artifacts/shadow/`. No raw source snapshot, document bytes, credential or provider response is committed.

Next priority is a shared corporate-careers layout/delegation improvement and exact original email/intake corroboration, followed by another fixed mixed-batch acceptance run. A positive real original-to-extraction-to-draft result is still required. Unattended unknown-company qualification, reset-aware orchestration, publication-lane qualification, closure/change handling and hosting remain open.

Follow-up: [shared careers delegation, 30 October](206_SHARED_CAREERS_DELEGATION_2026-10-30.md) replays this frozen cohort offline, clearing the portal's corporate delegation barrier while preserving its exact vacancy-binding hold and both email holds. No new live acceptance or publication follows.
