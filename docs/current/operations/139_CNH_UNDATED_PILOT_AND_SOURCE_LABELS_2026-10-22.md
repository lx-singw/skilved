# CNH undated shadow trial and source-label corrections

22 October 2026. The first real undated worker trial reaches Gemini extraction but stops before validation or drafting. The returned location evidence is incomplete, and the answer also omits required skills and qualitative benefits. Offline changes improve source hints without repairing or retrying that answer.

## Trial boundaries and result

The checklist, source content, original application route, extraction/validation contracts and call cap are fixed before generation. The isolated local worker has an ingest-only grant for one CNH source, revision one, with `undatedNotices: shadow_recent`, employer crawling off and a daily cap of twelve calls. The trial permits at most four invocations, eight worker source requests and ten minutes; only one invocation is needed to reach a terminal extraction failure.

The worker performs two actual guarded RecentJobs requests: robots and the CNH notice, both HTTP 200. The parsed content hash matches the frozen source. No cached HTML is presented as a new acquisition. The source has no closing date and one original portal for apprentice requisition 6175. A separate issuer review confirms that [CNH's corporate careers page](https://www.cnh.com/en-US/Careers) redirects to `join.cnh.com`; the [CASE careers page](https://www.casece.com/en-us/northamerica/inside-case/join-us) corroborates the CNH portal relationship. This review does not establish that the specific vacancy remains open. No employer job page is fetched.

A separate unauthenticated provider HEAD request completes DNS, TCP, TLS and HTTP headers. Its 404 response establishes connectivity only, without an API key or generation. The issuer web review and this diagnostic are separate from the two worker source requests.

The unchanged V22 extraction contract makes five generation attempts through the existing availability fallback:

| Requested model | Result |
| --- | --- |
| Gemini 3.8 Flash | HTTP 503; usage unknown |
| Gemini 3.7 Flash | HTTP 503; usage unknown |
| Gemini 3.6 Flash | HTTP 503; usage unknown |
| Gemini 3.5 Flash | HTTP 503; usage unknown |
| Gemini 3.5 Flash Lite | HTTP 200; valid wire JSON, 6,417 reported tokens; local evidence rejection |

The worker stops with `AI_LOCATION_EVIDENCE_UNRESOLVED`. The answer claims in-person attendance but cites only the location line, excluding the working-mode line. The source's explicit `Working Mode: Fully On-Site` wording is also outside the old label recognizer. Its sole requirement item correctly retains the complete preferred qualification and subjects; all seven required skills are missing. Both regional qualitative benefits are missing from compensation. Requisition 6175 and the unknown deadline are retained.

There are zero validation calls, new model caches, new real drafts or public records. The terminal job and original answer remain unchanged. There is no semantic retry, response repair, altered checklist or fallback to seek a more agreeable answer. Five of the source's twelve generation calls are spent; seven remain in its 22 October allowance. A continuation must restore this latest source budget and shared ledger, without creating a fresh identity or raising the cap to replace spent calls.

## Offline implementation

The source policy now recognizes an exact bounded `Skills Required` section as required competencies. Its items receive `other`, required strength and cumulative ALL hints. `What We Offer` ends the requirements/preference section, keeping benefit prose outside requirement hints. Unbounded, conditional and duty-only wording still abstains.

Attendance evidence and hints now recognize `Working mode` alongside existing labels, and the sole affirmative value `Fully On-Site` maps to in-person attendance. The complete labelled line must be inside the returned location evidence. Negation, alternatives, conflicts, preparation text and material outside a selected programme's scope still cannot establish attendance. Code never widens a returned span.

The real-source offline comparison shows that all seven skills now receive coverage hints, while the two benefit lines leave the old overextended preference hints. The unchanged live answer still fails location evidence. Checking its requirements independently also fails with `AI_REQUIREMENT_COVERAGE`; recognizing the mode does not make the answer acceptable.

Changed prompt/cache identities advance to extraction V23, metadata V16, programme extraction V23 and programme validation V15. The bounded requirement policy becomes V10 and attendance hints V2. The compact wire remains V7 and ordinary semantic validation remains V15. Prior snapshots, failures, budgets, drafts and cache contents are preserved; no old cache is relabelled under a new contract.

## Verification and preservation

The contracts build, 76 focused tests, two targeted worker tests and all 771 tests across 80 selected catalogue test files pass. The full selection includes the new source-label test and all 79 previously tracked test files. The two pre-existing unrelated replay-ticket files remain untracked and byte-identical.

Authored regressions prove complete private drafting, rejection of omitted/optional/misclassified/alternative skills before validation, preservation of preferred qualification wording, qualitative benefits outside eligibility hints, and strict complete-span attendance checks. Eleven private checklist controls include one positive authored witness and ten rejected mutations. These authored cases are not real-source qualification.

All 884 historical artifact hashes are verified. A separate freeze preserves the live outcome and its V22 code/contract evidence before the offline code changes. The shared ledger increases by exactly five requests, 6,417 known tokens and four unknown-usage calls: cumulative totals are 105 requests, 325,971 known tokens and 47 unknown-usage calls. These are historical totals, not today's RPD. Actual usage, daily exhaustion and cooldown records remain shared across jobs; nothing is reset or refunded.

Private source captures, raw responses, restored history, diagnostics, controls and reports remain ignored under `.artifacts/groq/cnh-undated-pilot-2026-10-22/`. The three earlier real drafts remain unchanged. There is no new production source configuration, schedule or publication.

## Next

Run one bounded fresh V23 CNH trial using this sprint's saved runtime history and the current shared quota ledger. Freeze the same source checklist and the new contracts before generation, retain the source's remaining allowance, and stop on semantic failure. Complete extraction, independent checklist acceptance and semantic validation remain unproven for CNH. The next answer must retain skills, preferred qualification scope, qualitative benefits, original portal and the missing deadline without inventing application documents or prior experience. Gemini remains shadow-only; employer crawling remains optional/off.
