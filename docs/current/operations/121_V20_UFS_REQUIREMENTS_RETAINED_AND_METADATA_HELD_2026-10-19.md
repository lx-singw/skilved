# V20 UFS requirements retained and metadata held

Date: 19 October 2026. Status: the new V20 UFS answer retains all nine competency details and correctly classifies basic knowledge, but still omits the four document instructions and their submission context. It also infers unsupported in-person attendance from a campus location. Compact metadata decoding rejects it before validation or candidate/cache storage. Five of eight permitted new calls are spent; no draft or public record is added.

## Source and expectations fixed before calls

This evaluates the [bounded coverage implementation](120_BOUNDED_DOCUMENT_AND_REQUIRED_COMPETENCY_COVERAGE_2026-10-19.md), committed as `4b21ea7`. Two guarded HTTP 200 requests refresh robots.txt and the familiar UFS Mechanical Apprentice notice. The candidate content hash, two consistent notice-stated 21 October deadlines and the original employer-named ATS application anchor remain unchanged. No employer page is fetched. Employer authenticity, open applications and destination reachability remain independently unverified.

The prior semantic checklist remains unchanged. Only retrieval/version metadata changes; the checklist helper is identical and hashed before transmission. V20/V8 instructions and source-policy hints are the already committed implementation. Compared with the prior trial, the compact wire schema, V15 validator, low/medium thinking and 3,072/6,144-token stage caps remain unchanged. There are no after-response prompt, guard, schema or expectation changes.

The private source grant advances from revision 2 to 3, retaining five spent calls and five unused calls from its ten-call cap. Three additional daily capacity bring the cap to thirteen, permitting at most eight new trial calls. This preserves the unused allowance rather than replacing or refunding earlier spending. The grant stays shadow-only, employer crawling off and without a publication role.

## Availability window and bounded continuation

| Requested extraction endpoint | Observation | Usage |
| --- | --- | --- |
| Gemini 3.8 Flash | Timeout before HTTP response, about 45 seconds | Unknown |
| Gemini 3.7 Flash | Timeout before HTTP response, about 45 seconds | Unknown |
| Gemini 3.6 Flash | Timeout near the fallback-window end, about 1.1 seconds | Unknown |
| Gemini 3.5 Flash | HTTP 503 | Unknown |
| Gemini 3.5 Flash-Lite | HTTP 200; reported `gemini-3.5-flash-lite` | 7,349 known tokens |

The initial provider fallback window expires without a semantic answer, leaving an inspectable pending `AI_TIMEOUT` job. A separately recorded availability continuation starts at the next untried endpoint, 3.5, using the remaining five calls within the original total eight. It reuses the still-fresh source evidence, identical V20 request body and semantic checklist, preserves the first job/receipts and adds no source requests or capacity. The continuation stops after its second call returns a semantic answer that fails decoding. Three calls remain unused; 3.1 is not requested.

This continuation is an explicit private evaluation workflow, not an implemented automatic fallback cursor across worker jobs. The current worker retains timeout spending and receipts but does not create fresh per-model cooldowns for these timeouts. Only the new 3.5 HTTP 503 updates its two-minute source-specific cooldown. Older cooldown timestamps remain historical records, distinct from shared daily exhaustion. A short attempt near the window end does not establish the model's behavior under a full per-call allowance. Automatic continuation across such windows remains an availability limitation.

## Actual hold and diagnostic comparison

Flash-Lite returns schema-valid JSON with a normal stop: 5,989 prompt tokens and 1,360 output tokens, totaling 7,349. No output truncation is reported. It again assigns `in_person` attendance using only the Bloemfontein Campus location line. Compact metadata decoding raises `AI_LOCATION_EVIDENCE_UNRESOLVED` before an accepted extraction, the private pre-validation checklist, canonical worker mapping, candidate/cache storage or model validation. Province remains null with the complete raw `FS ZA` evidence retained; province normalization is not the failure.

A diagnostic-only reconstruction preserves every returned value and exact source span. It is never accepted, repaired, cached, validated or drafted. The frozen semantic checklist and production source-policy mapping are assessed afterward only for diagnosis:

| Observed field | Earlier V19 answer | V20 answer |
| --- | --- | --- |
| Requirement items | 4 | 13 |
| Nine required competency details | Omitted | Retained as required under ALL |
| Basic knowledge kind | Education | `other` |
| Experience recommendation | Preferred | Preferred |
| Complete qualification alternative | Retained | Retained |
| All-document context and four document instructions | Omitted | Still omitted |
| Attendance inferred from campus location | Unsupported | Still unsupported |

The six remaining diagnostic checks comprise unsupported attendance and five submission omissions. Only the incomplete-application rejection sentence is retained in practical conditions. Foreign-qualification SAQA, identity alternatives and external-applicant employment-proof instructions remain absent. Direct source-policy/canonical mapping independently raises `AI_SUBMISSION_INSTRUCTION_COVERAGE`; this is a diagnostic entry point, not the actual live worker's first hold. No requirement lines are uncovered under V8.

This is one familiar source and one returned answer per version from the same endpoint. The observed requirement retention does not establish causal improvement, general model reliability, independent validation or source qualification. Both negative answers remain unchanged.

## Verification, accounting and next work

Fresh private audits pass for source reparsing/preflight, unchanged semantic expectations, frozen contracts, all five identical extraction request bodies, three timeout records, both HTTP responses, unchanged-answer reconstruction, storage, budgets and quota reconciliation. All 238 frozen historical artifact hashes, 25 first-stage artifact hashes and 15 code/test hashes match. The preceding contracts build, 61 focused checks and 678-test serial suite are reused for unchanged product code, not rerun or represented as new tests.

Five new receipts match five attempted calls. Four failed-call usages remain unknown. Source spending is ten against a thirteen-call cap, with no refund. Shared observations now retain 82 generation requests, 274,648 known tokens and 32 unknown-usage calls. Each called endpoint's existing same-day counter increments once; earlier-day rows, shared availability and daily exhaustion history remain unchanged. Older outputs, failures, snapshots, caches, receipts and the two existing drafts remain preserved. The source snapshot is reused; one new pending availability job and one terminal location exception remain inspectable, with no active private worker left running.

Next add offline source-bound guidance for selecting the complete contiguous submission block and for distinguishing a place label from explicit attendance evidence. Keep both guards strict and retain both rejected answers as regressions. Then run a separately bounded fresh assessment. Automatic continuation after fallback-window expiry is a separate worker task. Employer crawling stays optional/off; production scheduling and publication remain disabled. Credentials, source snapshots, provider responses and private evaluation artifacts remain ignored and uncommitted.
