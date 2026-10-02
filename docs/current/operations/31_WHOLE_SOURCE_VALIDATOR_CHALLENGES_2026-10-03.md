# Whole-source validator challenges — 3 October 2026

The existing full validator accepted a known-bad ALPLA extraction that promoted employer context into applicant eligibility and downgraded a required document condition. Its passing ALPLA control also returned support. The full validator therefore failed to distinguish that pair. **Automatic publication remains disabled.**

Five bounded Groq validation calls reported **22,496 tokens**. Three decisions matched the frozen expected supported/unsupported result, one was a false acceptance, and one assessment failed local validation. Decision agreement is not complete defect detection: ACTOM's rejection also misinterpreted preparation claims, and Cummins's rejection missed other defects. The final catalogue suite passed **198 tests**.

## Test scope and controls

All challenges used saved sources and outputs; there were no new extraction, website, employer, metadata, database or publication calls. Inputs, expectations, known defects and their source spans were frozen before validation. They are agent-authored development evidence, not independent qualification.

The ALPLA pair exercised the unchanged production validator, `recentjobs_validation_v6`, with the same previously saved metadata. The positive control used the V11 requirements that matched the frozen inventory. The negative case used V12's 17-condition extraction, including contextual employer claims and an incorrect document level. Both mapped into canonical private records and passed the material-fact gate. Neither was published.

The metadata source hash and complete source text were checked against the saved snapshot before reuse. Mocked requests captured the original V6 request hashes before refactoring; both live full-validation requests matched those hashes exactly. The false acceptance was not introduced by a prompt/schema change in this sprint. Saved metadata reuse is not a fresh end-to-end pipeline run.

Eskom, ACTOM and Cummins had saved requirement-stage outputs without separately qualified metadata. A new development-only requirements diagnostic audits those outputs against the entire discovery notice. Its version is `recentjobs_requirements_validation_v1`. It shares the existing validator's core instruction and schema, with an explicit trusted requirements-only scope. It does not assess metadata, application routes or a full record, and its results carry `scope: requirements_only` and `qualification: false`. It is not wired into the worker or its cache.

The diagnostic retains exact requirement facts and the entire expression, including local unknown passages. It checks bounded inputs, unique/used IDs, references and source-supported quotes before spending. Assessments must cite exact discovery evidence, give reasons for rejection and use requirements issue paths. Invalid responses keep numeric usage and do not trigger a retry or repair. Routes, snapshot IDs and approval metadata are excluded.

All five calls used Groq `openai/gpt-oss-120b` at the existing medium validation setting, with the 3,072 completion-token bound. The private harness capped calls at five, paced them at 45 seconds, checked frozen hashes and wrote exclusive attempt files. No provider/model fallback or local retry occurred. All calls supplied only discovery evidence; employer crawling remained off.

## Results and defect review

| Challenge | Scope | Result | Reported tokens |
| --- | --- | --- | ---: |
| ALPLA passing control | Full V6 validator | Supported, matching the expected control decision. | 4,263 |
| ALPLA invented eligibility | Full V6 validator | **Supported incorrectly**, with no issues. Employer context and the document-level error were not reported. | 5,511 |
| Eskom context and taxonomy | Requirements diagnostic | `AI_INVALID_VALIDATION`. No valid assessment was retained; this is not credited as a semantic rejection. | 3,476 |
| ACTOM omitted documents | Requirements diagnostic | Unsupported. Its reasons mentioned missing certified copies, but also wrongly treated caveated past-intake citizenship, education and training claims as mandatory current requirements. | 3,889 |
| Cummins uncertainty loss | Requirements diagnostic | Unsupported. It caught the community preference marked required, but did not report the merged independent conditions or incomplete education scope. | 5,357 |
| **Total** | **Two full, three scoped** | **One correct control, one false acceptance, one invalid assessment, two partial rejections** | **22,496** |

ACTOM and Cummins are only decision matches. ACTOM's mixed reasoning does not demonstrate faithful handling of applicability; Cummins's single reported defect does not establish completeness. The source quotes in their retained assessments passed local evidence checks, which still did not guarantee correct interpretation.

The Eskom call failed after receiving provider-accepted output. The diagnostic did not retain the raw accepted assessment on the local failure, so its exact quote/shape/scope failure is unknown. Usage remains available. No rejected-generation text was saved or another call made to reconstruct the failure.

## Offline replay and implementation

The existing full-validator prompt, schema, version and input projection remain unchanged. `validationContract` and `validationPayload` expose pure preparation for reproducible hashes without exposing storage metadata. Contract schemas are cloned so a diagnostic caller cannot mutate the worker schema.

`tools/evaluate-validation.mjs` replays explicit local challenge manifests without credentials, network or model calls. It checks frozen canonical input hashes, assessment version/scope, decision consistency and exact source evidence. It reports decision matches/mismatches, invalid or unavailable assessments and unreasoned rejections. It does not automatically grade whether every known defect was found. Private issue reasons and source quotes are not emitted in the replay summary.

```sh
node packages/catalogue/tools/evaluate-validation.mjs .artifacts/groq/validation-challenges-v1/manifest.json
```

Zero-call replay returned three decision matches, one mismatch and one unavailable assessment. The unavailable assessment corresponds to the live Eskom validation error; it was not reclassified as an unmade call or a passing rejection. A separate agent review recorded partial defect coverage and incorrect reasoning. V6 baseline/request integrity checks also made zero model calls.

Plans, hashes, canonical inputs, expected defect spans, attempts, valid assessments, numeric usage, offline reports and defect review remain private under `.artifacts/groq/validation-challenges-v1/`. No credentials or private snapshots were added to tracked files.

## Verification and next work

All **198 catalogue tests passed**, with clean Firebase emulator shutdown. The final focused run passed 16 tests. New coverage checks diagnostic scope, exact facts and uncertainty, medium reasoning, pre-spend input rejection, unsupported evidence, off-scope issues, usage on local failures, no retries, isolated schema clones, frozen-input replay, missing assessments and private-summary output. An earlier 195-test suite passed before the three offline-replay tests were added. Syntax and whitespace checks passed.

The next change should replace the single supported/unsupported judgment with a structured review that accounts for each source condition and each extracted claim, then compares them in code. It must distinguish current eligibility from employer context and preparation caveats, preserve uncertainty, and expose omitted conditions. Keep the positive/negative pair and these failure cases frozen, and test repeated runs before connecting a revised validator to publication. Another supported boolean or one successful pair cannot establish reliability.

Publication, public reads and scheduling remain disabled. Employer crawling remains optional and off by default. Only original employer/ATS/email methods are approved application destinations; this sprint made no new route qualifications.

See [scoped extraction evidence and failures](30_SCOPED_REQUIREMENT_EVIDENCE_2026-10-03.md) and the [pipeline runbook](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md).
