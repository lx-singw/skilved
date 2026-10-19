# UFS Flash-Lite answer and attendance/completeness hold

Date: 19 October 2026. Status: Gemini 3.6 and 3.5 extraction endpoints return HTTP 503; 3.5 Flash-Lite returns the first semantic answer for the frozen UFS case. Valid JSON infers `in_person` attendance from a campus location, so the existing compact metadata guard rejects it before validation or candidate/cache storage. A separate diagnostic audit of the unchanged answer finds omitted application documents and required competency details, plus misclassified knowledge. No draft or public record is added.

## Frozen availability follow-up

This follows the [two-call UFS availability failure](118_UNSEEN_UFS_SCREENING_AND_BOUNDED_AVAILABILITY_FAILURE_2026-10-19.md), committed as `1ba1059`. The same UFS Mechanical Apprentice source is now familiar to this private evaluation. Its earlier two requests returned no semantic answer; this is neither another unseen-source selection nor an independent held-out test.

Two guarded HTTP 200 requests refresh robots.txt and the notice. Reparsing preserves the candidate content hash, both consistent notice-stated 21 October deadlines and the original employer-named ATS application anchor. The employer page is not fetched. Employer authenticity, open applications and destination reachability remain independently unverified.

Before model calls, a recorded private source revision increases its cap from two to ten, preserving both spent calls and their cooldown history. The new trial permits at most eight actual calls and starts at 3.6, followed by 3.5, 3.5 Flash-Lite and 3.1 Flash-Lite for availability fallback. V19/compact V7 extraction, V15 validation, schemas, instructions, source-only semantic expectations, 3,072/6,144-token caps and low/medium thinking remain frozen. Only retrieval metadata, the trial's starting endpoint and allowance change. The three extraction request bodies are identical apart from the separately selected endpoint.

## Actual worker hold: unsupported attendance

| Requested endpoint | Extraction HTTP | Reported version | Usage |
| --- | --- | --- | --- |
| Gemini 3.6 Flash | 503 | No answer | Unknown |
| Gemini 3.5 Flash | 503 | No answer | Unknown |
| Gemini 3.5 Flash-Lite | 200 | `gemini-3.5-flash-lite` | 6,116 known tokens |

Flash-Lite returns schema-valid JSON with a normal stop. It assigns `in_person` attendance using only the source's Bloemfontein Campus location line. That line contains no explicit attendance statement. The existing compact metadata location-evidence guard raises `AI_LOCATION_EVIDENCE_UNRESOLVED`, stopping the actual worker before an accepted decoder result, the private pre-validation checklist, candidate/cache storage or model validation.

The province stays null and the complete raw `FS ZA` source wording is retained. Province normalization does not cause this rejection; its earlier unqualified boundary remains unchanged. No guard is relaxed and no answer is repaired. Availability fallback does not continue after this semantic hold: 3.1 is not requested, and five of the new eight-call allowance remain unused. There is no semantic retry.

## Additional findings are diagnostic only

A private reconstruction preserves every returned value and exact source span. It is used only to inspect the rejected answer; it is not an accepted extraction, repaired result or validation input. Compact decoding, split metadata decoding and canonical mapping reject the same unchanged attendance claim. The frozen private checklist is assessed afterward for diagnosis, not as the worker's actual first hold.

The diagnostic checklist fails sixteen checks:

- The location check fails on unsupported attendance. Its combined location/province issue label does not establish a province error.
- The answer omits the submission context requiring all listed documents and all four standard document instructions: CV; qualifications/proof with conditional foreign-qualification SAQA; identity-document alternatives; and employment proof applying only to external applicants. The incomplete-application rejection sentence alone is retained.
- Basic mechanical-equipment knowledge appears as required education instead of required `other` knowledge.
- All nine detail bullets under required competencies are omitted. Headings are not substitutes for those conditions.

The answer retains the complete Grade 12/NQF-4 OR clause, the separate mechanical qualification, preferred experience without making it mandatory, the monthly 3,879.84 stipend, deadline and selected employer ATS route. Residence and intake remain unstated. These narrower successes do not qualify the incomplete answer for drafting.

The frozen request's source policy supplies no required-line, conditional-document or submission-instruction hints for this layout, despite transmitting all source lines. This identifies a coverage gap to address offline; it does not prove why the model omitted those passages.

## Verification, accounting and next work

Fresh source, contract, request/response, unchanged-answer, storage, budget and quota audits pass. All 188 frozen historical artifact hashes and 22 code/test hashes match. The preceding contracts build, 72 focused checks and final 667-test serial suite are reused for unchanged product code, not rerun or presented as new tests. This remains an agent audit without independent human review or source qualification.

Three new receipts and observed requests reconcile with 6,116 known tokens and two unknown failed-call usages. Shared observations now total 77 requests, 267,299 known tokens and 28 unknown-usage calls. All older daily usage/exhaustion and shared availability records remain unchanged, including the earlier twenty-request 3.8 row. Failed-call consumption is unknown, not zero.

The UFS source budget retains five spent calls against its ten-call cap. Both new HTTP 503 receipts record two-minute per-source, per-model cooldown timestamps; older cooldown timestamps are preserved. Those availability cooldowns are separate from shared daily exhaustion memory. Flash-Lite receives no availability cooldown for this semantic rejection. No earlier failure, snapshot, cache, receipt, draft or spending is reset or refunded; the unchanged source snapshot is reused.

Next implement offline source-obligation coverage for standard and conditional application documents, inherent requirements and explicitly required competency sections. Preserve knowledge classification, preferred experience, conditional scope, complete qualification alternatives and duties/heading exclusions. Keep the attendance guard strict and retain this unchanged negative answer as regression evidence. No further provider calls occur in this sprint.

Employer crawling stays optional/off; production scheduling and publication remain disabled. Credentials, source snapshots, provider responses and private evaluation artifacts remain ignored and uncommitted.
