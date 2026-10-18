# Gemini 3.1 HTTP timing and fresh ALPLA fidelity failures

Date: 18 October 2026. Status: API metadata and three bounded generation requests return HTTP 200. The availability probe passes, but both fresh ALPLA extractions are held before validation or drafting. Contracts build, 70 targeted tests and private audits pass. No product code or publication changes.

## Availability traced without changing the request

Following the [earlier 3.1 timeout](99_GEMINI31_AVAILABILITY_TIMEOUT_2026-10-18.md), a read-only `models.get` request using the same local key returns HTTP 200 in 705 ms and lists `generateContent` support. This establishes metadata access, not the project's billing balance or generation availability. Google's [model reference](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite) documents the configured model name and structured outputs; its [Models API reference](https://ai.google.dev/api/models) documents the metadata endpoint.

An observer records only selected client event names, elapsed times, status codes and TLS authorization. Credentials, headers, sockets and raw diagnostic messages are excluded. It leaves the existing fetch transport and request unchanged. The fixed 3.1 JSON-object probe retains its 1,024-token cap, low thinking, disabled fallback and 45-second deadline. Its actual request body and hash match the earlier timed-out probe.

The established connection sends the complete generation body at 3 ms. HTTP 200 headers arrive at 28,599 ms, followed by the requested JSON object and 203 reported tokens. The earlier failed call remains counted with unknown usage. Its cause is not established or proven fixed by this later success. Neither the deadline nor production transport is changed.

The probe's private source grant explicitly advances from revision 1/cap 1 to revision 2/cap 2 for this single additional call. Its original failed job, receipt and spending remain. The sprint permits three new generation calls total, including the probe, plus one separately recorded metadata GET and at most two source requests. Metadata is not represented as a generation call in the worker's RPD observations; no billing conclusion is drawn from that distinction.

## Fresh ALPLA source and two held extractions

After the passing probe, two guarded, paced requests refresh robots.txt and ALPLA AP-32. Both return HTTP 200 with expected MIME types and identity encoding. Robots permits the notice. Its content hash, 31 October deadline, original recruitment destination and extraction payload match the earlier source. The employer endpoint is not fetched. The agent checklist is frozen before either notice call; ALPLA remains a familiar, privately evaluated notice with unqualified source reuse and issuer relationship.

V13/V7 extraction and V12 validation remain frozen, with the 3,072/6,144-token stage limits. Both actual extraction bodies match each other and the earlier model-independent extraction body. Fixed 3.1 is used with fallback disabled. ALPLA's existing records are restored; revision 3 uses a two-call allowance for the current source day while retaining all five earlier calls and their budgets, jobs, snapshots and failures.

The first current extraction returns HTTP 200 and 6,146 reported tokens, then fails the existing `AI_PRACTICAL_EVIDENCE_UNRESOLVED` guard during decoding. It reaches neither candidate mapping nor validation. Its raw output was not retained by that harness, so the record supports the rejection reason and usage, not exact offending wording.

The remaining conditional validation call is explicitly reallocated to one captured extraction repeat under the same source, checklist, contract and source cap. The original failed job and spending remain. This is a separate model draw, not recovery, correction or repair of the first answer. It returns HTTP 200 and 5,975 reported tokens, decodes, then fails the private pre-validation checklist:

- Grade 12 and N3 become alternatives rather than cumulative requirements.
- The standalone Literacy exclusion uses education rather than subjects.
- Qualifications are presented as experience, with an unsupported OR.
- In-person attendance is inferred without the required explicit source label.
- Salary is classified as other, and the maximum-four-year duration is absent from the intended material fields.

The raw checker also flags the issuer because its frozen local alias list contains only ALPLA/Alpla. The title itself supports Alpla Plastics. This is a local registry/allowlist gap, not evidence of an invented issuer. The original checker output and frozen expectations are retained; that flag is distinguished from semantic errors in the agent review.

Reference AP-32, the deadline, the original application selection, all four mandatory passages, their qualification/subject grouping and the document passage's internal OR are preserved. These correct fields do not make the whole answer faithful. The private checker holds the repeat before worker mapping; offline replay of the untouched answer also fails the unchanged production mapper with `AI_LOCATION_EVIDENCE_UNRESOLVED`. Private checks are not claimed as deployed production controls. No model validation call, new candidate, draft or public record results.

## Verification, accounting and next work

The contracts build passes. Fifteen Gemini fallback/quota tests and 55 practical/source-policy, numbered-requirement, metadata/provider and validation tests pass, totaling 70. Product code is unchanged; the full catalogue suite is not rerun. Private audits bind all three receipts to actual requests, verify the captured output against its decoded form, replay the production rejection, compare contracts and source checklists, and preserve previous jobs, failures, receipts, budgets and the earlier Transnet draft.

Three new generation requests report 12,324 known total tokens, with no new unknown usage. Shared history now retains 40 observed generation requests, 89,032 known total tokens and 23 unknown-usage calls. These are worker observations, not provider dashboard totals. The earlier timeout is not refunded, historical rows outside the affected model/day stay unchanged, and no daily-exhaustion hold is created or extended.

Credentials, environment files, sources, provider responses, checklists, diagnostics, quota state and preview remain private and ignored. Employer crawling remains optional/off and production scheduling/publication disabled. The separate suggestion and withdrawal implementation is preserved.

Next use the captured rejected answer and authored synthetic cases for offline regression work on false qualification alternatives and qualifications-as-experience. Preserve the failed outputs and source expectations; assess any later contract revision in a separate bounded trial. Source reuse qualification, same-model repeatability and independent fidelity remain open.
