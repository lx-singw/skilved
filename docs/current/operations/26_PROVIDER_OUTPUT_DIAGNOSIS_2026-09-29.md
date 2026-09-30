# Rejected-output diagnosis — 29 September 2026

One bounded repeat of the frozen Unique Personnel V7 request reproduced `json_validate_failed`. Its rejected generation was **valid JSON with seven required coverage entries missing**. This establishes an output-completeness failure for this attempt; it does not establish why the model omitted them. No prompt, schema, model, reasoning setting or decoder was changed. Production remains disabled.

## Evidence and diagnostics

All local references in the generated Unique Personnel schema resolved. A local, already installed Ajv validator compiled the actual normalized provider schema. During the single live request, the bounded rejected response was inspected transiently: the 561-byte generation parsed as JSON, failed seven `required` checks at the coverage object, and was rejected by the application decoder as `AI_INVALID_EXTRACTION`. The private diagnostic retains only validation keywords and schema-owned paths, never failed-generation text or provider messages. Token usage was unavailable. There was no local retry, website retrieval, employer crawl, metadata/semantic-validation call or publication.

The diagnostic attempt and report are in ignored `.artifacts/groq/unique-v7-diagnostic/`. The frozen candidate and prompt/schema hashes match the earlier V7 attempt. This is another development observation on a reused notice, not independent or held-out qualification.

The Groq adapter now attaches `outputDiagnostic` to explicit `json_validate_failed` errors. It reports unavailable/oversized/invalid JSON or bounded missing-required-field paths from the request schema. The local extraction CLI includes that summary. Input values, unknown input keys and arbitrary provider errors are excluded. It does not persist raw rejected output, retry, repair, supply missing fields, change budgets or turn a failure into an accepted record.

The production diagnostic is deliberately only a structural completeness inspection, **not a full JSON Schema validator**. Empty missing-field results do not establish valid types, enum values, unions, semantics or publication readiness. Traversal, recursion, input size and reported field counts are bounded. Worker model-call persistence continues to retain its existing safe status/error fields.

## Classification review and corrected reporting

The saved ALPLA V7 response labels line 25, “Mathematics Literacy not applicable”, as `other`. The preceding write-up incorrectly said it used `subjects`; that reporting mistake is now corrected. Its negative wording and required level were retained.

The reviewed convention is: a standalone subject acceptance or exclusion uses `subjects`; a qualification with embedded subject requirements remains `education`. This changes the agent-authored expectation for that one ALPLA line from `education` to `subjects`. It does not change the model output, applicant condition, polarity, level or requirement relationships. A future prompt revision should state this convention explicitly.

Ignored `.artifacts/groq/source-inventory-v2/` records the revised manifest, prior/revised hashes, reason and offline replay. Historical manifests/responses/reports remain unchanged. The reviewer is still an agent, and no independent review is claimed. Replaying the same V7 outputs against the revised expectation makes **zero model calls** and still produces one match (Feltex), two mismatches (ALPLA classification and Hytec's unresolved source relationship), and one absent accepted response (Unique Personnel). The offline missing-file result is distinct from the live provider rejection.

## Next experiment

Verification: all **151 catalogue tests passed**, including the new diagnostic privacy, reference traversal, recursion/output bounds and unchanged single-call rejection tests. Firebase emulators shut down cleanly. The focused provider/diagnostic run passed 16 tests; tests made no live provider calls.

Use the diagnosed omission to design a smaller extraction contract with explicit coverage tasks for supplementary evidence. Freeze the contract and the subject-classification convention before testing; retain the current rejection and uncertainty gates. Evaluate both these development cases and newly reviewed notices before considering autonomous publication. Repeatedly accepting incomplete output or weakening the audit would not resolve the failure.

Employer crawling stays optional and off by default. Original employer/ATS/email application routes remain the only publication destinations; aggregators remain discovery/attribution sources.
