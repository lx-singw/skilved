# Discovery companion acceptance and evidence catalogue

Updated: 13 September 2026. Status: specified tests and observations, **NOT RUN**. Owner: engineering/product/founder. These DCF cases refine M0 acceptance under existing PRD families; they do not replace the 64-PRD register or claim implementation. Source authority: [M0](../product/03_DISCOVERY_FIRST_MVP.md), [experience](../design/05_OPPORTUNITY_COMPANION_EXPERIENCE.md), [contracts](../engineering/04_DISCOVERY_COMPANION_IMPLEMENTATION.md), [operations](../operations/03_SOURCE_CHECKS_AND_COMMUNITY_CONTRIBUTIONS.md).

## 1. Cases

| ID | Scenario / method | Expected evidence | PRD families |
|---|---|---|---|
| DCF-01 | Browse real representative catalogue and synthetic boundary cases across six categories | Six distinct routes; both internship subtypes; non-entry-level jobs supported; no fake inventory; truthful seasonal gaps | 001,002,008 |
| DCF-02 | Filter location, required residence, national/remote and unknown location | Location fields are distinct; widening works; no hidden eligibility or locality exclusion | 004,007,027 |
| DCF-03 | Inspect original source, discovery reference and issuer-directed external ATS | Correct relationship evidence and destination label; non-issuer hostname alone is not rejected or trusted | 003,004,028 |
| DCF-04 | Successful HTTP fetch, source timeout, unknown deadline and confirmed closure | Reachability is not availability; check time reflects actual scope; failure is not closure; no invented exact countdown | 003,005,008 |
| DCF-05 | Review complex AND/OR requirements, provisional results, marks and document constraints | Original logic preserved; no qualification equivalence, false waiver or invented PDF limit; explanation traceable | 004,026,027 |
| DCF-06 | Multi-component compensation, no amount, varying period and funding coverage | Salary/stipend/funding remain distinct; no unsupported sum, zero-default or fabricated pay | 002,004 |
| DCF-07 | Bring an already-listed supported public link | Returns approved canonical record; duplicate request cannot disclose someone else's private receipt | 006,009,024 |
| DCF-08 | Submit new, unsupported, private or sensitive URL | Bounded intake/status; no auto-publication, instant verification or login bypass; honest unsupported state | 006,009,024,042 |
| DCF-09 | Attempt SSRF through redirect/DNS/IP encodings or embedded page instructions | App/network checks prevent internal access and unsafe processing; source instructions cannot publish, exfiltrate or message | 024,039,042 |
| DCF-10 | Guess/reuse expired receipt, inspect logs/referrers/share output, withdraw lead | Capability scoped and non-enumerating; raw link/notes/tokens private; withdrawal/expiry affect queued work and declared retention | 022,024,038 |
| DCF-11 | Save, reload, update progress, report Applied, reopen application route | Durable browser-local state; route-open event separate; no fake submission and no stage regression | 029,036,041 |
| DCF-12 | Clear/remove, block storage, corrupt local record, open two tabs | Accurate success/failure, no crash or unwanted resurrection; clear shared-device notice; no sync promise | 036,038 |
| DCF-13 | Change/close/merge/withhold a saved opportunity and revisit | Preserve user annotation, resolve aliases safely, show current change; unsafe destination not retained as active cached action | 005,029,036 |
| DCF-14 | Share through native, WhatsApp compose and copy fallback; cancel/no app | Source-backed text, as-of date, canonical current link; no private data; cancellation is not delivery | 028,035,038,041 |
| DCF-15 | Open a stale forwarded link and inspect current metadata | Closure/change/under-review visible; no guarantee of recalled third-party previews; safe public tombstone where appropriate | 003,005,009 |
| DCF-16 | Submit one credible serious report and a coordinated false-report burst | Serious report can trigger triage; raw counts do not prove fraud; restricted record has neutral state and audited review | 009,039,040 |
| DCF-17 | Inspect reviewed clarification vs community anecdote | Attribution, source version and uncertainty visible; anecdote cannot overwrite issuer criteria or become credential | 004,019,039 |
| DCF-18 | Observed first task using original post and Skilved prototype | Participant identifies issuer, requirements, uncertainty, next action and save/resume path; record errors, effort and coaching | 035,038,041 |
| DCF-19 | Reference phone/network cold/repeat load, keyboard/screen reader, interrupted navigation | Recorded bytes/timings/device; agreed budget met or blocker documented; focus/scroll/errors work; no compulsory media/ad scripts | 035,036,042 |
| DCF-20 | Inspect issuer pages, editorial shelves, missing experience and future trend fixture | Accurate catalogue-only counts; editor picks labelled; no-experience requires evidence; trend cannot invent activity or imply safety | 003,004,005,007,041 |
| DCF-21 | Reconcile anonymous aggregate events, share intents, local progress and costs | Declared event meanings, retention and denominator; no private raw URLs/tokens; clicks not placements; actual review costs included | 038,041,042,062 |
| DCF-22 | Audit exposed routes, admin privilege, publication/cache invalidation and rollback | No prototype private/verification leak; reviewed publication only; old projection cannot restore unsafe destination; rollback evidenced | 024,037,039,040,042 |
| DCF-23 | Review later group/profile/referral pilot design | Solo browsing still useful; permissions, identity claims, moderation, safeguarding and contact controls before release | 019,034,043,044,046,049,064 |
| DCF-24 | Review market copy, illustrative fixtures, free-consumer and source notices | No unsupported safety/performance/competitor guarantees, real-looking invented vacancies or applicant charges | 003,004,062,063 |

## 2. Release allocation

### 24 September operational subcriteria — not run

The founder accepted the [operational refinements](../governance/08_OPERATIONAL_REFINEMENTS_2026-09-24.md). Extend the existing DCF cases below; keep DCF-01–24 identifiers and counts unchanged. These are specified checks, not recorded results.

| Existing cases | Additional scenario | Required evidence |
|---|---|---|
| DCF-01/02/18 | Run representative first-community searches across all categories, both internship routes, general jobs and location/national/remote conditions | Record relevant results, gaps, seasonal availability, comprehension and curation load; starter-sample counts are not launch proof; no trade-only hidden restriction |
| DCF-04/05/18/24 | Review unknown deadline, provisional results, unstated pay and missing official contact | Concise uncertainty plus a supported action; no invented capacity deadline, payment, certification age, contact or qualification alternative |
| DCF-02/06/18 | Inspect stipend/pay period, attendance, transport/accommodation support and unknown compensation | Sourced facts remain distinct; practical travel-cost prompt understandable; no guessed fare/net-pay ranking, eligibility exclusion or guaranteed dropout prediction |
| DCF-11/12 | Save, leave for external application and return; then separately clear site data, block storage or use a shared browser | Normal handoff preserves local state when storage remains; loss and visibility limits understood; no automatic restoration, account backup or sync claim |
| DCF-13/14/15 | Preview and copy/download/share a public checklist, then change/close/withhold the listing or fail its current fetch | Current safe public requirements, dated source context and distinct detail/application labels; unknowns retained; unsafe destination excluded; canonical-link fallback if current facts unavailable; old copies labelled static |
| DCF-10/14/21 | Put distinctive local personal stages/annotations and a receipt capability on the test browser, then generate all public export variants | None of those values enters exported text, filenames, share parameters, public metadata or telemetry; no personal-completion ticks automatically included |
| DCF-14/19/24 | Cancel share, lack WhatsApp/native share, deny clipboard access or inspect a downloaded text file | Usable fallback and truthful attempted-action states; no delivery, permanence, restoration, universal offline or zero-data claim |
| DCF-19/21 | Render reviewed pages with model service unavailable and inspect workload/transfer measurements | Core browse/detail remains useful without per-visit inference; actual bytes and total operating/review costs recorded separately |
| DCF-22 (extension) | Check public deployment boundary and selected package/dependency checks after stabilisation | Every public route classified; unsupported sensitive actions disabled server-side; real passing selected checks/build recorded; excluded packages listed; filtered pass is not reported as full-workspace success |

The source-checklist export is public information, not a backup of saved user progress. Personal progress export, an affordability calculator and carrier zero-rating are not prerequisites in these M0 subcriteria; each needs a separate later decision and appropriate tests if pursued.

DCF-01–22 and DCF-24 apply to relevant exposed M0 functions. DCF-20 tests current shelves/issuer pages at M0; actual trend activation also needs its later experiment evidence. DCF-23 is a later social-release gate, not a demand to build the social network before M0. Full document/agent/organisation tests remain applicable when those capabilities release.

The minimum observed task covers find/understand/save/handoff, one source uncertainty, one failure/change and shared-device understanding. Include all six category paths in fixtures and representative source samples. Recruit reachable people ethically and respect age-specific arrangements; an initial small sample informs improvements, not national market conclusions.

## 3. Evidence record and stop conditions

Use the [chronological runbook](../planning/04_M0_CHRONOLOGICAL_BUILD_RUNBOOK.md) for the implementing B task and phase gate, and [delivery status](../planning/05_M0_DELIVERY_STATUS.md) for actual results. DCF-01–22 and DCF-24 are mapped to M0-A–G and responsible slices there. Existing local web boundary tests are partial DCF-22 evidence only; no complete M0 case is declared passed by this planning update.

For each case record build/commit, environment/config, fixture/source version, method, date, result, evidence path, reviewer and unresolved issue. Use synthetic malicious/boundary fixtures; never probe a third party without authorisation. Application/security tests are implementation work; this documentation update does not run them.

Block the affected public release for fabricated material facts, misleading check/submission claims, exposed private data, unsafe fetch paths, inaccessible core actions, broken critical application handoff or lack of operable correction controls. Ordinary noncritical presentation defects can have named follow-up owners and honest limitations. Do not hide a missing accepted slice behind a passing aggregate score.

Evaluate the original post/existing method fairly: same opportunity/task, comparable assistance, counterbalanced order where feasible and transparent missing data. Track observed understanding separately from stated trust. Record spontaneous shares separately from prompted testing. No fabricated traffic, users or placements for a demo.

## 4. Ongoing checks

Source operations sample freshness, material fields and correction decisions after launch. Product reviews inspect return usefulness and confusion. Engineering monitors route failures, queue abuse, cache consistency and cost. Reopen acceptance when new source types, personal data, languages, external actions or social surfaces materially change risk. Use the [M0 delivery slices](../planning/03_M0_COMPANION_DELIVERY_PLAN.md) to allocate corrective work.
