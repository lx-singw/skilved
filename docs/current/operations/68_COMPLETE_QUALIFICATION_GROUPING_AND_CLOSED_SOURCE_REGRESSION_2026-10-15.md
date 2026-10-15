# Complete qualification grouping and closed-source regression

Date: 15 October 2026. Status: the prior split qualification answer now fails the source-evidence check unchanged. All 477 catalogue tests pass. No provider calls or new real-source drafts were made.

Canonical extraction advances to V11, compact extraction to recentjobs_extraction_v11_groq_v7, bounded requirement policy to V4, programme extraction to V12 and ordinary/programme validation to V9. Split metadata stays V4. Strict response schemas, grammar, source text, original application methods and material/publication gates are unchanged.

## Bounded complete-qualification evidence

The current extraction policy recognises a contiguous Grade 12 heading followed by at least two distinct known subject lines inside a closed required/preferred profile section. The supported heading forms are Grade 12, Grade 12 with: and Grade 12 with the following subjects:. The narrow subject families are Mathematics (including the source's Core / not Mathematical Literacy wording), Physical Science, and Engineering Graphics & Design with an optional EGD abbreviation. Recognition retains the complete original source span; it does not infer subjects, marks, qualifications or applicant eligibility.

The subject run must end at the section boundary or a separately recognisable applicant condition, including the technical assessment introduction. Recognition abstains on unbounded sections, blank gaps, unknown continuations, duplicate subject families, preceding alternatives and repeated member lines elsewhere in the scoped source. Document sections do not receive this qualification rule. This is deliberately not a universal qualification parser.

A recognised span must appear in one complete education item, or remain exact unknown logic without competing confident items. Split or partial items, a whole item plus overlapping subject evidence, and duplicate whole items fail AI_REQUIREMENT_GROUP_UNRESOLVED. Wrong kinds fail AI_REQUIREMENT_KIND_UNRESOLVED. Source strength checks still preserve required/preferred levels. The shared complete-span guard also now rejects duplicate whole assessment items; it previously required completeness but did not enforce the one-item count.

Ordinary and programme prompts receive these code-owned source hints. The independent validator explicitly checks qualification/subject scope even under ALL. No response is repaired, joined or regrouped by code. Unknown logic continues to fail material checks before drafting.

## Regression evidence

Authored tests cover complete required/preferred qualification spans, reversed supported subject order, split and overlapping evidence, duplicate whole items, wrong kinds and strength changes. They also cover exact unknown abstention, incomplete/unbounded/repeated/alternative/unfamiliar layouts, separate complete qualification and assessment conditions, ordinary and scoped-programme evidence offsets, and the exact original submission destination.

An emulator worker regression supplies a structurally valid split answer. It makes one extraction call, fails before canonical candidate storage and spends no semantic validation call. It creates neither a draft nor a public record and performs no employer-page fetch. This closes the earlier gap where a split answer could reach a private draft despite model agreement.

The private offline audit loads the exact previously accepted Bell answer and verifies that it still decodes to its cached extraction without alteration. The new source policy recognises its Grade 12 / Mathematics / Physical Science / EGD span and rejects the split answer before canonical mapping can return a candidate. The earlier response, source snapshot and existing private evaluation artifacts remain unchanged.

That historical notice closed on 7 October 2026. As of the South African calendar day 15 October, normal worker preflight also rejects it with NOTICE_NOT_OPEN. It was not resubmitted to any provider, refreshed, re-drafted or treated as a current opportunity. The audit creates only new private regression records and a preview. The old 3.8 hold expired on 5 October; it is not reactivated or extended. Saved quota state is byte-for-byte unchanged, and current unobserved provider usage is not estimated from the historical export.

## Verification and next work

pnpm catalogue:test passes all 477 tests, including the new worker rejection check and historical replay controls. All 83 targeted source-policy, ordinary/programme extraction, compact grammar and validation-contract tests pass.

The private audit verifies unchanged raw response/source/quota hashes, current grouping rejection, closed-notice preflight and zero real provider requests, new candidates, drafts or public records. Credentials, local environment files, source snapshots, raw answers, quota state and private audits/previews remain ignored under .artifacts/.

Next screen current RecentJobs notices and run a bounded shadow trial under the frozen updated contract. Broader qualification formats, unseen-source performance and repeatability still need evidence. Production scheduling/publication remains disabled; employer crawling stays optional and off for these evaluations.
