# Extended dated-notice screen

25 October 2026. Eight additional RecentJobs notices were read without making provider calls. None supplies a supported current dated apprenticeship for the next trial. This is a bounded result from three category pages, not a claim that the whole site lacks suitable opportunities. The previously accepted Motus notice and previously inventoried details were excluded rather than repeatedly fetched.

## Discovery scope

The initial plan permits two fresh category pages and five previously unparsed detail URLs, with eight guarded requests including robots. The source inventory distinguishes a saved parsed candidate or snapshot from merely appearing on a listing. After that screen produces no dated trial candidate, a separate frozen extension permits one discovered older category page and three previously unparsed/unattempted details, adding at most four requests. Neither plan authorises model work or new source grants.

All twelve guarded requests return HTTP 200, observe the site's robots rules and use at least three seconds between request starts. The three category pages contain thirty article entries. Eight unique details are selected; six parse and two remain explicit layout exceptions. Older publication dates alone do not rule out a future written deadline, so the dated screen does not apply the seven-day undated assessment rule as a discovery cutoff. “Previously unparsed” is relative to the inventoried private history; it does not establish that no model has ever seen a notice.

## Source results

| Notice | Finding | Decision |
| --- | --- | --- |
| [Lifta trainee technician](https://recentjobs.co.za/2026/10/10/lifta-sa-trainee-technician-apprenticeship/) | Nested copied description; no explicit closing date observed in offline review | Layout hold; no canonical candidate |
| [Teraoka technical apprentice](https://recentjobs.co.za/2026/10/09/teraoka-technical-apprentice-x7/) | Explicitly unspecified deadline; PNet route unregistered | Precision hold |
| [Transnet engineering learnership](https://recentjobs.co.za/2026/10/08/transnet-engineering-learnership-2027/) | Written deadline 14 October 2026 | Past-deadline hold |
| [Jendamark turner machinist](https://recentjobs.co.za/2026/10/08/jendamark-turner-machinist/) | Two equivalent references to 13 October 2026 | Past-deadline hold; no date conflict invented |
| [Jendamark mechanical fitter](https://recentjobs.co.za/2026/10/08/jendamark-mechanical-fitter-apprenticeship-2026/) | Written deadline 13 October 2026 | Past-deadline hold |
| [Unique Personnel machinery apprentice](https://recentjobs.co.za/2026/09/20/unique-personnel-construction-heavy-machinery-apprenticeship-2/) | Three nested publisher cards; offline review observes an explicitly unspecified deadline | Layout hold; no canonical candidate |
| [Eskom YES](https://recentjobs.co.za/2026/09/19/eskom-employment-service-yes-x50/) | Written deadline 22 September 2026; no apprenticeship category established | Category hold; past date also recorded |
| [Actom engineering apprenticeship](https://recentjobs.co.za/2026/09/17/actom-engineering-apprenticeship-2027/) | Explicitly unspecified deadline and a shortened application link | Precision hold; shortened link independently rejected |

The four parsed notices with past dates are not claims of independently verified employer closure. No application destination is fetched, replaced or inferred. None of the six parsed routes matches an existing source issuer registration. Shortened links remain unresolved; no redirect expansion or application submission is attempted.

## Layout review without source repair

Lifta has one WordPress post and one outer content container, but an additional copied description `article` inside it. Unique Personnel has one WordPress post and three nested publisher-card `article` elements. The saved pages retain the outer introduction, conditions and application anchors. These differ from the already supported, identity-bound unheaded template wrapper; the current parser continues to reject them with `RECENTJOBS_LAYOUT_CHANGED`.

Offline DOM inspection does not create a canonical candidate, strip article tags, choose a convenient fragment or relax the parser. Lifta describes a tertiary-study trainee role and a future employment start; the start is not relabelled as a closing date, and an apprenticeship classification is not inferred from the headline. Its source publication is older than the current private undated window. Unique Personnel explicitly leaves its deadline unspecified. Merely admitting either HTML structure would not establish eligibility for this dated trial.

All six parsed candidates are replayed offline through the exported preflight policy, reproducing their holds. The private screening helper initially imports a non-exported function and stops before making requests; it is corrected to use the public preflight API. Its category-label check is corrected and verified offline after screening without further network calls. Runtime code, source text, model contracts and prior answers are unchanged.

## Verification and handoff

Contracts build and all **75 focused tests** pass, covering the adapter, main-notice binding, programme discovery, issuer attribution, worker and undated policies. All **49 pipeline code/test hashes** and **1,692 previously inventoried artifact hashes** remain unchanged. The earlier full serial suite's **885 passing tests** remains the historical baseline; it is not rerun for this investigation-only sprint.

There are **zero provider calls, new grants, drafts or public records**. The shared quota ledger is byte-identical at **137 historical calls, 393,678 known tokens and 68 unknown usages**. Motus remains at **four of six calls spent for 25 October**, with two remaining. All five existing drafts, prior exceptions, caches, model holds and the original Motus review expiry of **12:58 SAST on 25 October** are preserved. A new source day is not used to clear provider exhaustion.

Evidence and the frozen selection plans remain private under `.artifacts/groq/dated-notice-screen-2026-10-25/`. Real execution must still restore `.artifacts/groq/current-canary-2026-10-25/continuation/pilot-report.json` plus the latest shared quota ledger. This source-only review is not replacement execution history.

Do not repeat these unchanged held details or spend AI merely to keep the trial moving. The next source trial needs a newly available supported notice or materially changed source evidence, followed by exact-route qualification and a frozen full checklist. A separately scoped parser improvement would need synthetic identity/ambiguity controls and would not resolve these date/category limitations. PepsiCo and Nampak retain their previous holds. Gemini remains shadow-only, worker employer crawling optional/off and production scheduling/publication disabled.
