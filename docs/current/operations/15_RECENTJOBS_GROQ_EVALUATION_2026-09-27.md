# RecentJobs Groq evaluation — 27 September 2026

**Decision: keep production publication disabled.** This diagnostic sample found real extraction failures and a false acceptance by the semantic validator. No real record was published. Employer-page crawling remains optional and off by default; it was not used in this evaluation.

## Sample and results

The RecentJobs robots file allowed the review user agent. A bounded category fetch returned ten cards. Three detail pages were retrieved sequentially with request pacing, the existing guarded HTTPS client and a 500 KB limit. Source HTML, parsed candidates, structured responses and local replay scripts are private under ignored `.artifacts/groq/`; the corpus is not committed.

| Notice | Observed result | Model use |
| --- | --- | --- |
| [Feltex Connacher Electrical Apprentice](https://recentjobs.co.za/2026/09/23/feltex-connacher-electrical-apprentice/) | Future date-only deadline of 28 September; one original Feltex eRecruit portal. Diagnostic iterations described below. Still unqualified for automatic publication. | Extraction and validation trials |
| [Hytec SA Apprentice: Fitter](https://recentjobs.co.za/2026/09/22/hytec-sa-apprentice-fitter-kempton-park/) | Deadline 23 September. Production preflight returned `NOTICE_NOT_OPEN`. | Zero calls |
| [Unique Personnel apprenticeship](https://recentjobs.co.za/2026/09/20/unique-personnel-construction-heavy-machinery-apprenticeship-2/) | Closing date explicitly not specified. Production preflight returned `NOTICE_PRECISION_UNSUPPORTED`. | Zero calls |

This is a development diagnostic sample, not a held-out benchmark. Repeated trials on one notice cannot establish general accuracy or a pass rate. Source/issuer qualification and a production worker grant were not created by this evaluation.

## Findings and changes

1. Groq replaced newlines in a quoted requirements list with spaces and commas. The exact-evidence mapper correctly rejected it. Extraction instructions now explicitly require original punctuation and escaped newlines. Regression tests accept original multi-line text with exact snapshot offsets and reject joined or punctuated paraphrases; quote matching was not relaxed.
2. The canonical place schema required a country even when only a town/province was stated. Country is now nullable. A regression test retains a stated city without guessing the country. Existing known-country values remain valid.
3. The validator quoted a parsed application href that was not present in visible source text. Instructions now distinguish structured application candidates from text evidence: check the destination against the candidate, but quote the visible link label. Original portal/email handoff remains separate from discovery-source attribution.
4. One extraction plus validator pair passed their then-current checks, retaining the three qualification alternatives and original destination. Manual inspection found that the explicit recruitment reference had been omitted. The mapper now rejects omitted, mismatched or conflicting labelled reference codes with `AI_SOURCE_REFERENCE_UNRESOLVED`; replaying that earlier accepted response now rejects it. This demonstrates why two agreeing model calls alone do not qualify publication.
5. A subsequent low-reasoning response retained the reference but returned unknown requirements logic with no requirement items. It maps to a private unresolved record and is ineligible for publication. A bounded medium-reasoning trial returned HTTP 400 `json_validate_failed`: the provider reported that the 3,072 completion-token limit truncated the document before the requirements expression. The default remains low; no retry, output-budget increase or paid fallback was enabled.

Extraction prompt version is `recentjobs_extraction_v3` (Groq wire version `recentjobs_extraction_v3_groq_v1`); validation is `recentjobs_validation_v4`. Cache keys already incorporate these versions. Groq errors now expose numeric HTTP status for diagnosis without retaining or logging provider response text in the production client.

Nine provider requests were made in this session. Seven returned usage totalling **33,112 tokens**, including reasoning within completion counts. Two HTTP 400 rejections returned no usage metadata; their usage/cost is unknown. These totals include unsuccessful development attempts, not just the passing intermediate pair. No model calls were needed to reject the expired and unknown-deadline samples.

## Verification and next work

Contract tests: 22 passed. Final provider/extraction/policy tests: 28 passed. Full catalogue emulator suite: 84 passed. Web production build and 24 boundary tests passed.

The next implementation target is a smaller extraction representation that fits the Groq budget while reliably preserving references and complete qualification alternatives. Evaluate repeated runs and unseen notices against authored expected facts before enabling a source pilot. Retain the current deterministic evidence/reference/date/route checks. Then qualify source policy and original application relationships, configure the real worker identity and run scheduled shadow ingestion before automatic feed publication. Employer-page crawling is not a prerequisite.

See the [pipeline runbook](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md).
