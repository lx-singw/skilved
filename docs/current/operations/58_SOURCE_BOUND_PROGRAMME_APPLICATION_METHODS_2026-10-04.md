# Source-bound programme application methods — 4 October 2026

Programme extraction now leaves application selection to the source planner. Both authored synthetic trades complete fresh live Gemini extraction and semantic validation and become canonical private drafts. Four successful 3.8 Flash requests report 15,485 tokens; zero public records are created. All 412 catalogue tests pass. Open real multi-programme qualification remains unresolved, production scheduling/publication stays disabled and employer crawling remains optional.

## Bind applications in code

The previous programme payload exposed the original notice's application index alongside a one-entry scoped candidate array. Plumbing's original index was 1, but the old extraction contract required the scoped index 0. A live model returned 1 and local mapping correctly rejected it. Choosing an application route is unnecessary AI work once the narrow source planner has already verified the trade/reference/email relationship.

`recentjobs_programme_extraction_v4` uses a strict programme wire schema derived from the compact extraction shape with `applicationCandidateIndex` removed. Programme root-key hints and instructions describe the new shape. The selected intake's application evidence remains visible, including its exact original wording and span, but its original index is omitted from the extraction payload. The full original numbered notice remains available for evidence and scope checks.

Only after the new wire object passes strict parsing and scoped-span verification does trusted code supply the sole scoped candidate index to the existing canonical decoder. The mapper recomputes the trusted plan, requires the exact selected reference and restores the original parent's application index in evidence. Issuer/destination checks, mandatory coverage, WIL separation, form preparation rules, semantic validation and transaction gates still apply. Unsupported source layouts or ambiguous application bindings remain held by the planner.

This does not repair an old rejected answer. Any AI-written application index—including 0—or application-route/destination field is an unexpected property and fails strict parsing. Wrong references, foreign trade evidence and invalid canonical selectors remain rejected. Local or semantic rejection does not cause availability fallback or automatic answer rewriting. Ordinary single-notice extraction retains its existing contract.

The validation instructions advance to `recentjobs_programme_validation_v4`. Versioned scope/cache identities prevent prior index-bearing programme extraction or validation caches from satisfying the new stages. Stable child record identities remain unchanged. Provider selection, descending availability fallback, cooldowns, token allowances and call caps are unchanged.

## Fresh live canary and source audit

An isolated demo Auth/Firestore emulator replays the authored two-trade notice with programme extraction enabled, shadow mode, employer crawling off and a ten-call ceiling. Expected facts are recorded before the first request. No previous provider response, model cache or draft is restored. The normal descending availability chain starts at 3.8 Flash; each stage succeeds on that model without fallback or retry.

| Stage | Outcome |
| --- | --- |
| Electrical extraction and validation | Two complete successful responses; one private draft. |
| Plumbing extraction and validation | Two complete successful responses; one private draft. |
| Saved expired MISA replay | `NOTICE_NOT_OPEN` before AI; zero model calls. |

All four actual HTTP attempts have budget reservations and receipts. All usages are known, totalling 15,485 tokens. Final private state contains two canonical drafts, two successful programme decisions, four stage caches and zero public records. The emulator shuts down successfully.

Agent review checks each child's original trade title, exact reference, distinct submission email, authored deadline, qualification and required CV. Electrical retains its entire Grade 12 OR N3 condition. Both drafts preserve the blank-form request and prohibited delivery methods in practical instructions; the form-request email does not become a submission destination or required document. Evidence offsets, original route indices 0 and 1, parent snapshot text and citations match exactly. Each requirement expression requires both the qualification and CV. Extraction and validation provenance both identify the new stage versions and 3.8 Flash.

This is one successful run on authored text, with agent review, not independent human adjudication or real-source fidelity qualification. Source-verified here means the route matches explicit scoped notice instructions, not that an employer mailbox was independently checked.

## Real-source screening

Six paced, robots-aware RecentJobs retrievals cover three apprenticeship category pages and two previously unseen notices. Discovery excludes previously saved candidates and previously recorded rejected collection URLs. No employer page or live real-notice AI request is made.

- [Festive engineering apprenticeship](https://recentjobs.co.za/2026/09/01/festive-engineering-apprenticeship/) has a stated 13 September 2026 closing date and is expired. Its layout does not support the programme planner.
- [Tjantjello electrical apprenticeship](https://recentjobs.co.za/2026/08/27/tjantjello-training-solutions-electrical-apprenticeship/) has no parsed deadline or application candidate and an unsupported programme layout. Its openness cannot be inferred.

Neither provides an open supported multi-programme case. The saved real MISA notice remains expired. No source policy is qualified or widened based on this screen.

## Verification and next qualification

All 412 catalogue tests pass. Three added regression tests verify code-owned binding for both original recipients, rejection of model-written route fields without fallback or repair, and worker rejection isolation while the valid sibling completes. Existing tests exercise two private draft creation, independent stage requests, evidence/reference enforcement, budget accounting, cache reuse, source/grant races, unsupported plans and publication guards. `git diff --check` passes.

Source snapshots, fresh requests/responses, expected facts, emulator state, call receipts, agent audit and an escaped CSP-restricted HTML preview stay ignored and private under `.artifacts/`. Credentials and local environment configuration are unchanged.

Next establish repeatability of the new programme contract and qualify a current real multi-programme notice with an independently reviewed source checklist. The synthetic route-index failure is addressed; the evidence is insufficient to enable autonomous public feed publication.
