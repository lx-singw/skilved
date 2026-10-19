# V21 UFS submission retained and experience field held

Date: 19 October 2026. Status: one bounded real extraction retains the complete submission block, all thirteen requirements and source-supported attendance uncertainty. The unchanged private source checklist holds it because the separate experience fact is absent, although the preferred experience requirement remains present. No validation, candidate, cache entry, draft or publication is added.

## Fixed source and pre-call plan

The [V21 guidance sprint](122_COMPLETE_SUBMISSION_BLOCK_AND_ATTENDANCE_GUIDANCE_2026-10-19.md), committed as `f2f9943`, passed the contracts build, 79 focused checks and the final 686-test serial emulator suite. This evaluation changes no product code. Sixteen code/test hashes match that verified state.

Two guarded requests freshly retrieve RecentJobs robots.txt and its UFS Mechanical Apprentice notice. Both return HTTP 200. The parsed source is identical to the [V20 trial](121_V20_UFS_REQUIREMENTS_RETAINED_AND_METADATA_HELD_2026-10-19.md), including the stated 21 October deadline and original UFS ATS application destination. This is a familiar-source version trial, not another unseen-source test. Source authenticity, employer availability and destination reachability remain independently unverified; no employer page is fetched.

The source semantic checklist is frozen unchanged before calls. Only acquisition and extraction-version metadata change. V21/V9 supplies the full submission-block hint at lines 6–11 and the no-label attendance policy. Compact wire schema V7, validation V15, extraction/validation output caps and thinking levels stay fixed.

The private plan starts at `gemini-3.5-flash-lite`, the endpoint that returned the earlier V19 and V20 answers. It keeps the configured suffix through `gemini-3.1-flash-lite` for availability failures. Higher endpoints previously encountered timeouts and 503s; this deliberate starting point tests the new guidance on the same requested endpoint. Production defaults remain unchanged. Eight total calls are allowed, including any availability fallback and validation. Semantic failure ends the trial without fallback or repair.

## Returned answer and actual hold

The requested endpoint and reported model version are both `gemini-3.5-flash-lite`. One extraction returns HTTP 200, valid JSON and a normal `STOP`, with 6,328 prompt and 1,432 output tokens: 7,760 total. No truncation is reported.

| Check on the same notice | V19 answer | V20 answer | V21 answer |
| --- | --- | --- | --- |
| Nine required competency details | Omitted | Retained | Retained |
| Knowledge classification | Education | Other | Other |
| Four standard documents and submission context | Omitted | Omitted | Retained |
| Attendance inferred from campus place alone | Unsupported inference | Unsupported inference | Not inferred |
| Preferred experience requirement | Retained | Retained | Retained |
| Separate experience fact | Stated | Stated | Not stated |
| Frozen checklist issues | 16 | 6 | 1 |

The practical field now contains the complete contiguous submission passage, including all-document context, foreign-qualification/SAQA wording, identity alternatives and the external-applicant limitation. All thirteen requirement items remain under ALL, with preferred experience still preferred. Location retains the complete raw campus evidence and uses attendance `not_stated`; province stays null with raw FS preserved. Province normalization remains unqualified.

Compact decoding now succeeds. The real private extractor then runs its unchanged pre-validation checklist and throws `PRIVATE_SOURCE_CHECKLIST_FAILED`. Its only issue is `EXPERIENCE_FACT_SCOPE`: the separate experience field is `not_stated`, despite the explicit experience preference already retained in the requirements. This is a field-completeness inconsistency, not wholesale loss of the experience requirement or promotion to mandatory experience.

This hold occurs before canonical runtime mapping, candidate/cache storage and model validation. Seven calls remain unused; 3.1 is not called. No returned field is filled, repaired or retried, and no prompt, guard or checklist is changed after seeing the answer.

## Production gap and limits of the comparison

The production location and submission checks pass the answer. A separate offline diagnostic maps the same unchanged values into an unapproved review record, without storing it or continuing the worker. The absent experience field therefore is not a demonstrated production completeness rejection: the private evaluation checklist stops this trial. No model-validator result is available to establish whether a later validation would catch the inconsistency.

One answer per version on a familiar source cannot establish causal improvement, repeatability or general reliability. The document and attendance failures are absent in this answer, while the separate experience fact regresses. Prior raw answers, negative assessments and failures remain unchanged.

## Accounting and verification

Source revision four preserves ten spent calls and three unused calls, adding five daily capacity for the eight-call trial. It finishes at eleven spent against a cap of eighteen. The received call receipt reconciles with the one actual request and its 7,760 tokens. Shared observations advance to 83 requests, 282,408 known tokens and 32 unknown-usage calls. Same-day usage increments without refunds; prior-day usage, shared availability/exhaustion records and existing source cooldown timestamps remain unchanged.

Fresh audits pass for guarded source retrieval, identical source content, pre-call checklist/contract hashes, exact request/provenance/receipt reconciliation, raw-response decoding, unchanged-value mapping, storage deltas and quota preservation. All 306 frozen historical artifact hashes and sixteen code/test hashes match. The prior contracts build, 79 focused checks and 686-test suite are reused for unchanged product code, not rerun or reported as new tests.

One terminal checklist exception, one job and one received model-call receipt are added. No new snapshot, cache entry, candidate, draft or public record is added. The two earlier private drafts, pending jobs, failure receipts, responses, caches and spending remain preserved. The isolated emulators exit successfully. Source snapshots, provider responses, private checklists and evaluation artifacts remain ignored under `.artifacts/`; no credentials or local configuration enter the commit.

Next implement source-bound experience-field completeness guidance and regression checks, preserving preferred/required strength, education exclusions and this raw held answer. Then assess a separately bounded fresh answer. Automatic continuation across fallback windows remains separate worker work. Employer crawling stays optional/off; production scheduling and publication remain disabled.
