# Programme boundary plans and fresh-notice screening — 3 October 2026

The shadow worker now saves private programme-boundary plans before holding multi-route notices. MISA's familiar snapshot yields five distinct apprenticeship review plans, each bound to its original heading, reference, application email and source lines. **All 385 catalogue tests pass. This creates review plans, not canonical intake drafts or public feed records.** Production scheduling/publication remains disabled and employer crawling stays optional.

## Source boundaries before per-intake extraction

`recentjobs-programmes.mjs` recognises a deliberately narrow layout: lettered programme groups, numbered apprenticeship trade headings followed by explicit references, one exact written application-email instruction per trade, and a final `DOCUMENTS REQUIRED` section. Missing, extra or duplicate references, ambiguous recipients, repeated labels, portal-only destinations, unbounded shared sections and unsupported layouts produce explicit unsupported results without partial intakes. Other programme groups remain context rather than becoming apprenticeship intakes.

Private programme IDs depend on the parent source ID and normalised reference, so a requirement change updates the source binding while retaining the intake ID. The binding includes the source text and parsed routes. These are planning IDs; no public opportunity schema or existing extraction contract changes.

Each plan retains original included line ranges for the shared introduction, apprenticeship context, selected trade and shared instructions. Its review payload keeps the **entire** original numbered source. `programmePassage` recomputes the plan and permits only contiguous original passages wholly inside the selected intake's included ranges. Another trade, the experiential section or a quote bridging an omitted range is rejected. Distant passages are never concatenated into fabricated contiguous evidence.

Shared text is explicitly marked for applicability review. In particular, MISA's institutional letter "for WIL applicants where required" remains conditional source wording; code does not make it an unconditional apprenticeship requirement or silently remove it. The planner makes no eligibility, requirement-kind, ALL/ANY/IF, issuer-approval or availability decisions.

In shadow mode, multi-route notices save `worker_programme_plans` linked to the original snapshot, job and exception. The existing preflight still holds the notice before model reservations, extraction or destination retrieval. Automatic mode does not invoke this planner. Shadow reports include the private collection; no public read endpoint exposes it.

The local `plan:recentjobs` CLI accepts a bounded saved-HTML manifest and prints a private plan without AI credentials, network or database calls. Keep real source output under ignored `.artifacts/`. Its synthetic fixture contains no real vacancy or recipient.

## Private pilot and wider source screening

An agent source checklist is saved before generating the MISA plan. All five reference/email pairs match it. Each trade's passage contains its own reference and recipient, excludes the other trade references, and retains the shared conditional document context. This is an agent review of a familiar, expired notice, not independent human adjudication or production qualification.

The actual worker replays that snapshot in isolated Auth/Firestore emulators with AI disabled. It saves **one private plan containing five intake scopes**, one source snapshot and one linked exception. Model calls, budget reservations, drafts and public records all remain zero. Both the full suite and pilot shut their emulators down cleanly. An escaped private HTML boundary preview and reports remain under `.artifacts/`.

A separate guarded, paced retrieval makes seven retrieval calls: robots, two category pages and four detail attempts. Three notices were previously unreviewed; Tronox is a repeated check of its known layout failure. No employer or application destination is fetched, and no model calls are made.

| Notice | Screening result |
| --- | --- |
| GIBB YES Civil Engineering | No parsed deadline; manual source review finds `DEADLINE: 30 September 2026`, already past. The source describes a YES placement; apprenticeship classification is not established. |
| Eskom Learner Artisan x12 | Both parsed date occurrences state 21 September 2026, already past. Mixed learnership/internship/apprenticeship wording still needs classification review; twelve positions do not establish twelve distinct intakes. |
| Tharisa Engineer in Training | Parsed closing date is 18 September 2026, already past. The source addresses engineering graduates/diplomates. |
| Tronox | Nested article layout remains rejected; the parser is not relaxed. |

No additional open case is found in this bounded sample. A category listing, fresh retrieval or syntactically valid destination does not establish an open apprenticeship.

## Verification and remaining work

Twelve new tests cover the source boundary planner, stable IDs/source binding, reference and recipient ambiguity, shared conditional context, original numbering and evidence isolation, the AI-disabled CLI, and worker plan persistence/privacy. All 385 tests pass, including existing provider fallback, single-record extraction and publication guards.

Per-intake model extraction, shared-condition applicability assessment and creation of canonical child drafts are still unimplemented. The worker deliberately retains the multi-route exception after saving the plan. Those stages need original-source evidence enforcement, separate budgets/cache identities and validation before public publication can be considered. More open, relevant notices also need review; these source checks do not qualify live multi-programme ingestion.
