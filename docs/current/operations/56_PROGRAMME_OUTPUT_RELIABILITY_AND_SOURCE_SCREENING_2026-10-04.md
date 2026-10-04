# Programme output reliability and source screening — 4 October 2026

Programme extraction now explicitly distinguishes an opportunity data object from its JSON Schema and keeps a complete single-line OR condition in one verbatim requirement item. Malformed output receives a specific, private structural diagnostic. **All 402 catalogue tests pass.** One live synthetic extraction passes the strict format and local evidence checks, but validation returns HTTP 503; no canonical drafts or public records are created. Its additional form-request classification remains unadjudicated. Publication and production scheduling remain disabled; employer crawling remains optional.

## Offline failure reproduction and implementation

The previous sprint's saved electrical answer is replayed unchanged through the real extraction adapter with a mocked transport. It fails once as `AI_INVALID_EXTRACTION`, with one unknown root property reported as a count. Removing only the extra `type` property in a clearly labelled diagnostic copy exposes the second failure, `AI_DUPLICATE_REQUIREMENT_PASSAGE`: two education items cite the same complete OR sentence. Neither replay creates an accepted record or makes a live provider request. The diagnostic copy is not an automatic repair policy.

The programme-specific instruction lists the root data keys from the strict schema, forbids schema wrappers and keywords in data, and explicitly gives the single-line rule precedence over the base instruction's alternative-splitting examples. Separate `any(...)` items require separately citable, distinct passages. All existing strict shape, source-span, duplicate-passage, scope, coverage, issuer, deadline and semantic checks remain in place. The shared single-notice contract is unchanged.

The programme extraction version advances to `recentjobs_programme_extraction_v2`, separating cached answers and validation requests from the earlier instruction. Invalid wire shape becomes `AI_INVALID_EXTRACTION` rather than a generic programme-stage error. It retains reported usage and a bounded diagnostic from the existing schema-owned diagnostic helper: required-field paths, structural findings and unknown-property counts, without provider text, values or unknown property names. The worker stores this diagnostic only on the private per-intake exception decision. Semantic failures still do not trigger fallback, while a valid sibling may continue.

Three new regression tests cover unexpected root properties with sensitive names/values, preservation of usage, the faithful single-line OR condition versus duplicate passages, and private worker diagnostics with sibling isolation. All previous 399 tests also pass, including actual per-attempt budget accounting, private canonical drafts, cache reuse and publication restrictions.

## Fixed live canary

The fresh local Auth/Firestore emulator replays the authored synthetic two-trade fixture. It explicitly selects Gemini 3.5 Flash with fallback disabled and a four-call maximum, because that model returned an answer in the previous run. This is a bounded prompt check; the normal worker model defaults and descending availability fallback are unchanged. It does not compare model accuracy or isolate the instruction's causal effect. No real source, employer, application or cloud endpoint is fetched in this replay.

Only two live provider calls occur:

| Stage | Result |
| --- | --- |
| Electrical extraction, low reasoning | HTTP 200; no extra schema property and one complete OR qualification item. Strict decoding and local mapping save a private candidate. |
| Electrical validation, medium reasoning | HTTP 503; the worker leaves the parent pending and stops before processing plumbing. No automatic retry is dispatched by this private canary. |
| Saved real MISA replay | Five planned scopes; `NOTICE_NOT_OPEN` before AI because the deadline is past. Zero provider calls. |

Both real provider calls have reservations and receipts. The extraction reports **4,608 tokens**; usage for the rejected validation is unknown. The run saves two parent plans, one private candidate and one MISA expiry exception, with **zero canonical drafts and zero public records**. Four is a cap, not the number of requests sent.

Agent review checks the electrical reference, original application email, issuer, deadline, complete OR education wording, required CV and parent snapshot/citation bindings. The answer also adds `Request an application form from forms@employer.example.` as a third required document item. Its treatment as a required document rather than a preparation instruction needs semantic review; the incomplete validator supplies no adjudication. The candidate is not recorded as a complete source-fidelity match. A valid shape and exact quotes alone do not establish correct classification or completeness.

## Bounded real-source screening

Guarded, paced retrieval makes ten retrieval calls: fresh robots text, three RecentJobs apprenticeship category pages and six detail attempts. It honours the retrieved robots policy and makes no employer/application requests or model calls. This counts retrieval invocations, not a separately instrumented total of redirect hops.

| Notice | Source review |
| --- | --- |
| [Tronox engineering apprenticeship](https://recentjobs.co.za/2026/09/15/tronox-engineering-apprenticeship-2026/) | Recheck of the known nested layout; parser still rejects it. |
| [Johnson Controls HVAC apprentice](https://recentjobs.co.za/2026/09/07/hvac-mechanical-service-apprentice-technician/) | Single role with an original employer portal. No deadline is stated in the saved text, so open status is not established. |
| [MAN diesel mechanic](https://recentjobs.co.za/2026/09/04/man-automotive-diesel-mechanic-x10/) | Explicit 6 September 2026 closing date, already past. Ten positions do not establish ten intakes. |
| [Komatsu millwright apprentice](https://recentjobs.co.za/2026/09/03/komatsu-millwright-apprentice-x1/) | Single role, no stated deadline, malformed reference and no qualified application candidate. |
| [Nampak engineering apprenticeship](https://recentjobs.co.za/2026/09/03/nampak-engineering-apprenticeship-2026/) | Explicit 3 September 2026 closing date, already past; no qualified application candidate. |
| [MAN auto electrician](https://recentjobs.co.za/2026/09/02/man-automotive-auto-electrician/) | Explicit 6 September 2026 closing date, already past. |

No open, supported multi-programme case is found in this bounded sample. An unstated deadline does not prove closure, and this sample does not show that no suitable notice exists elsewhere. Real source snapshots, model requests/answers, replay diagnostics, agent review and the escaped private HTML preview remain ignored under `.artifacts/` with restricted permissions. Local environment configuration and credentials are unchanged.

## Remaining qualification

The format failures are reproduced, specific diagnostics are implemented, and one new live extraction avoids those two failures. General output reliability and semantic fidelity are still unqualified. Next assess the form-request classification, reduce repeated attempts on recently unavailable models, complete a bounded validation retry using cached extraction, and review an open real multi-programme notice. Keep automatic publication disabled until those source and semantic checks are satisfied.
