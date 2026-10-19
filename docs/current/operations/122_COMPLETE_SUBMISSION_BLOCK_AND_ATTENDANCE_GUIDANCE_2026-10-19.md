# Complete submission-block and attendance guidance

Date: 19 October 2026. Status: offline implementation supplies complete bounded submission passages and explicit attendance-label guidance to extraction. The AI still returns its own checked facts. Neither hints nor code fill missing documents, widen returned evidence or repair invented attendance. Both saved UFS negative answers remain unchanged and rejected; no real provider call or source request occurs.

## Problem and resulting guidance

The [V20 UFS trial](121_V20_UFS_REQUIREMENTS_RETAINED_AND_METADATA_HELD_2026-10-19.md), committed as `0af4b1e`, retained all nine competency details but still returned only the incomplete-application rejection sentence in practical conditions. The all-document context and four document instructions were absent. It also inferred in-person attendance from a campus location. Valid JSON and a normal stop did not establish complete or source-supported metadata.

Requirement source policy V9 adds advisory `submissionBlocks` ranges assembled only from its already recognized instructions in a closed explicit standard-document block. The passage includes the rejection/acceptance rule when directly adjacent, the full submission context and document applicability wording. Guidance prefers the complete contiguous passage for practical conditions instead of only its first sentence. Existing per-instruction requirements remain enforced.

The hint does not merge disjoint blocks, bridge a programme scope hole, cross publisher preparation advice or silently include skipped unfamiliar text. It abstains when unbounded or longer than the existing 4,000-character practical value/evidence limit. Separate blocks remain separate suggestions; no concatenation or automatic selection is introduced. Missing hints do not excuse omitted instructions. Unknown or unsupported layouts continue to require semantic review.

An attendance evidence policy describes eligible inline `Attendance`, `Work arrangement` and `Work mode` labels, preserving their source spans and text. It distinguishes no eligible label, a supported value and unresolved labels. Unsupported, negated, alternative or conflicting labels do not supply a chosen mode. Programme scope and publisher preparation exclusions apply. A place-only campus label does not establish in-person attendance.

This is deliberately narrow label recognition, not proof that every possible attendance phrase is absent. The model must still read the source, preserve uncertainty where needed and cite a complete labelled span for any stated mode. Place evidence must also remain complete. The existing location guard continues to reject unsupported returned attendance.

## Contracts and unchanged acceptance rules

Canonical extraction and scoped programme extraction advance to V21, compact extraction to `recentjobs_extraction_v21_groq_v7` and split metadata to V14. Ordinary, split and programme requests receive the guidance. Compact output format V7 and its wire schema remain unchanged. Full validation stays V15 and programme validation V14; the full validation contract is unchanged.

Versions separate future extraction/cache use from earlier behavior. Historical responses, caches, records and assessments are not rewritten. Returned spans are never expanded to a suggested block, and `no_label` does not assign or overwrite an output field. A partial practical answer and invented campus attendance still fail without semantic fallback or repair.

The requirement acceptance guard is textually unchanged and the location-evidence module is byte-for-byte unchanged. New block ranges do not create applicant conditions or change existing education, knowledge, recommendation, conditional-document or ALL/ANY rules.

## Saved UFS regressions

The unchanged UFS source now has one advisory full submission block at lines 6–11, retaining its context and all four standard document instructions with foreign-qualification, identity-alternative and external-applicant scope. The attendance policy reports no eligible inline attendance label. The rest of its requirement/instruction policy matches V8 apart from version and the new advisory ranges.

Both old raw responses remain identical. Compact decoding still rejects the V19 and V20 answers with `AI_LOCATION_EVIDENCE_UNRESOLVED`. Direct policy/canonical checks still reject V19's missing competency details with `AI_REQUIREMENT_COVERAGE` and V20's missing submission instructions with `AI_SUBMISSION_INSTRUCTION_COVERAGE`. These are offline regression entry points, not newly generated answers or a rerun of the real worker. Province normalization is not the attendance failure.

The new hint is not evidence that V21 will return a complete answer. No real extraction, model validation, candidate, draft or publication is added in this sprint.

## Verification and next work

The contracts build, all 79 focused checks and the final 686-test serial Firestore/Auth emulator suite pass. Eight new authored tests cover complete submission context, separate blocks and bounded abstention, scope/preparation exclusions, campus versus explicit attendance, unsupported/conflicting labels, ordinary/split/programme request guidance and unchanged rejection without repair. Existing worker checks continue to cover validation/drafting boundaries. No test uses a committed real employer snapshot or real provider response.

The private audit verifies all 292 frozen historical artifact hashes and an identical quota-state hash. Shared observations remain 82 requests, 274,648 known tokens and 32 unknown-usage calls. Earlier spending, daily exhaustion, availability, pending jobs, failures and the two existing drafts remain unchanged. Only authored fictional sources and simulated provider responses are added to public tests; real snapshots/responses and credentials remain private and ignored.

The authored transport regression measures a 23,588-byte request with the additional guidance. Its test ceiling increases from 23,000 to 24,000 bytes; production input, output-token and evidence limits remain unchanged. The initial ceiling failure and probe remain in private diagnostics.

Next assess freshly retrieved eligible notices with V21 under a fixed pre-call source checklist and bounded allowance. Real-model completeness, repeatability, source qualification and independent employer verification remain open. Automatic continuation across expired fallback windows remains a separate worker task. Employer crawling stays optional/off; production scheduling and publication remain disabled.
