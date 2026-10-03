# Flash-Lite direct access and frozen comparison — 3 October 2026

At the founder's request, the trial skips manual project billing verification and tests Gemini 3.5 Flash-Lite directly. **All five full-notice requests complete without payment errors.** No billing settings, credits, local provider defaults or publishing settings are changed. This proves access worked for the tested requests; it does not establish the account tier, zero cost or future availability.

**All 314 catalogue tests pass.** Flash-Lite produces two complete Siemens matches, including an identical repeat, but Sea Harvest, Traxtion and MISA still fail source fidelity or constraints. Groq remains the worker provider. The comparison is development-only and does not qualify autonomous publication.

## Explicit model selection and comparison controls

The Gemini adapter now allows explicit `gemini-3.5-flash-lite` selection alongside its existing `gemini-3.8-flash` default. The selected model determines both the fixed Google endpoint and request/provenance hash. Arbitrary model identifiers remain rejected. There is no automatic provider or model fallback. Tests verify Flash-Lite endpoint selection, the unchanged default and stopping on HTTP 402 without retrying.

The private frozen plan permits five calls at low thinking with a 3,072-token completion cap, JSON-object mode, 60-second pacing and no built-in retries. [Google's model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite) supports structured output and thinking for this model. The numbered V12 sources, instructions, normalized generic prompt schema, exact local schema, source constraints, compiled qualification branches and agent-authored audits are unchanged. No expected answers or extracted claims are supplied to the model. Accepted inventories are saved before decoding, including the failed MISA inventory.

The baseline uses saved Groq V12 responses rather than concurrent requests. No new Groq, discovery, employer-page or application-destination requests are made. Volkswagen remains blocked before any model call by the known local multi-line submission-span constraint. MISA has no saved Groq inventory after that trial's HTTP 429, so it cannot contribute a paired model accuracy score.

## Results

| Attempt | Flash-Lite result | Saved Groq V12 result | Reported Flash-Lite tokens |
| --- | --- | --- | ---: |
| Siemens | Complete 17-condition inventory; source audit and both controls match | Coverage failure | 4,869 |
| Identical Siemens repeat | Complete match; request and inventory identical | Coverage failure | 4,869 |
| Sea Harvest | Decodes 11 conditions; one kind disagreement with audit | Source-constraint failure | 2,924 |
| Traxtion | Decodes 13 conditions; seven source-fidelity issues | Decodes with eight source-fidelity issues | 2,331 |
| MISA | Valid wire JSON; source-constraint failure | No inventory after rate limit | 4,374 |

All five responses satisfy the exact wire schema and key coverage. Four decode; two achieve complete source fidelity and correct faithful/defective control decisions. In the **four paired attempts**, Flash-Lite achieves two complete matches and Groq achieves zero. Those two successes are repeats of one notice, not two independent employers. Across four unique Flash-Lite notices, only Siemens completely matches. This is encouraging evidence for continued qualification, not a general accuracy estimate or independent benchmark.

Sea Harvest retains the audited passages but types confined-space/height readiness differently from the frozen audit. This classification disagreement is not an omitted condition. Traxtion still loses whole-scope uncertainty in packed introductory and mixed-strength evidence, splits the unresolved qualification scope and hardens preferred or unstated profiles. These are material semantic disagreements; successful JSON and decoder completion do not make its inventory faithful. MISA replaces protected audience uncertainty with a current applicant profile, fails the source-constraint check and is not assigned a complete semantic score. Audits are existing agent judgments and were not rewritten to fit the new model.

Reported usage totals **19,367 tokens**, with usage present for every response. Provider-reported thinking counts are absent and remain null, not assumed zero. Actual billing was not inspected. The same 3,072 cap bounds responses for both providers but does not imply identical tokenization, thinking behavior or cost. No cost-per-correct-notice claim is made.

## Verification and next work

The complete 314-test catalogue suite passes and Firestore/Auth emulators shut down cleanly. Tests exercise explicit model selection, identical comparison instructions, local rejection of incomplete inventories, safe provider status handling and no payment-error retries. All 126 historical V1–V11 source/contract hashes and replay outcomes remain unchanged. Six V12 source/audit/payload/contract hash sets and ten control/challenge inputs are reverified. AI module bytes remain unchanged during the trial; repeated Siemens requests and outputs are identical. Private plans, sources, credentials, requests and responses remain ignored.

Billing verification is no longer a prerequisite for these bounded development tests; actual API responses determine whether they can proceed. An actual payment rejection still stops requests. The next work is to investigate the remaining applicability/strength disagreements and known local submission-span limitation, then test Flash-Lite extraction and validation together on unseen notices, including deadlines and original application URLs/emails. This requirements-only experiment does not test or approve source-to-feed publication. Employer crawling remains optional and off by default.
