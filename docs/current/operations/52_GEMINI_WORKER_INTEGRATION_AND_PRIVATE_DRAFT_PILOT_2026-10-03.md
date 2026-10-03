# Gemini worker integration and private draft pilot — 3 October 2026

The RecentJobs worker now supports Gemini for extraction and validation, including ordered availability fallback. A fresh-snapshot pilot creates one private ALPLA draft and holds four other notices before model calls. **All 364 catalogue tests pass. Nothing is published, and employer crawling remains optional/off by default.**

## Provider integration and call accounting

`ai/provider.mjs` selects the explicitly configured Groq or Gemini adapter. The worker, extraction CLI, shadow CLI, metadata/requirements stages and full/requirements-only validators use this boundary. Groq remains supported and its existing local configuration is unchanged. The pilot explicitly selects Gemini 3.8 Flash, low extraction thinking and medium validation thinking.

Both providers use the existing compact extraction protocol and canonical decoder. Gemini sends rich worker schemas as JSON-object instructions with a 3,072-token output cap; strict local schema, evidence, requirement, route and assessment checks remain mandatory. This avoids the native schema compatibility failures recorded in earlier experiments without relaxing output validation. Fixed native model-comparison tools continue to use their own Gemini contracts.

Each Gemini HTTP attempt runs inside the worker's reservation/result boundary. Daily source budgets count every fallback request separately, including rejected calls; reservations are not refunded after possible billing or crashes. Grant, source revision, pause and lease checks run before each attempt. Budget exhaustion stops before the next request. Successful calls retain their actual model and request hash; transport receipts do not mean the later decoded record passed validation.

Gemini rate-limit cooldowns are stored per model. A cooling model can be deferred without a new HTTP request, letting the chain consider the next model. Groq retains its existing source-level cooldown. Cache keys distinguish provider, requested model, Gemini output mode and fallback policy/order, extraction reasoning, stage version and validation reasoning. Existing Groq cache keys remain unchanged; Groq results cannot satisfy a Gemini stage.

Gemini workers currently require `automation.mode=shadow`, even when their principal has a publication grant. Selecting Gemini does not authorize public feed writes. Worker and shadow CLIs pass the configured provider through; `SKILVED_AI_MODE=gemini` requires the private Gemini key and a supported model. `SKILVED_AI_FALLBACK=false` still provides fixed-model operation.

## Fresh sources and private pilot

RecentJobs robots and category pages are fetched with the guarded retriever and pacing. Six detail requests produce five distinct fresh snapshots, including one repeated retrieval to diagnose a layout rejection. The actual worker then processes those saved snapshots in an isolated local Auth/Firestore emulator, using live Gemini requests. There are no employer/ATS fetches, mailbox probes, sent emails, cloud writes or source scheduling changes.

ALPLA, West Coast Personnel and MISA are familiar notices retrieved again. EWC and Tronox are previously unreviewed cases in this pilot. This is not five unseen accuracy trials. An ALPLA source checklist is saved before model output, and the resulting draft is reviewed against it afterwards. Both reviews are agent judgments, not independent human adjudication or employer corroboration.

| Notice | Worker result | Reason or evidence |
| --- | --- | --- |
| ALPLA | One private draft, `shadow_pass` | 3.8 extraction succeeds; 3.8 validation receives 503, then 3.7 validation passes |
| EWC | Exception before AI | Hand delivery/courier application, no supported application candidate; enquiry email is not an application address. The stated deadline is also past and time-specific |
| West Coast Personnel | Exception before AI | Closing date is not specified |
| MISA | Exception before AI | Multiple programme emails in plain text, no single parsed application candidate; the stated closing date is also past |
| Tronox | Layout exception before AI | Nested second article body; the parser refuses to mix article content |

The ALPLA draft preserves Grade 12 with Mathematics/Physical Science and the Mathematics Literacy exclusion, minimum N3 Mechanical Engineering, and the CV/results-or-certificates obligation. Three requirement items cover the four reviewed passages under ALL logic; the document's internal OR wording is retained. There are no extra requirement items. Reference AP-32, 31 October 2026 and the original ALPLA ATS destination remain intact. Programme behaviour for successful candidates is not promoted into applicant requirements.

The pilot makes **three model requests**: successful 3.8 extraction, rejected 3.8 validation and successful 3.7 validation. Daily budget reservations and model-call records both equal three. Successful responses report **6,209 tokens**; usage for the HTTP 503 request is unknown. One draft, one shadow decision, four exceptions and zero public records are saved privately. A private HTML draft-feed preview and complete reports remain under ignored `.artifacts/`; no credentials, source snapshots or provider responses are committed.

## Verification and next step

All 364 catalogue tests pass; the test and pilot emulators shut down cleanly. Eight new tests cover per-attempt reservation refusal, cooldown deferral, Gemini extraction/validation fallback with separate reasoning and accounting, budget exhaustion, provider cache separation/local rejection, the shadow-only gate, disabled-AI enforcement even with a key present, and original email preservation without destination probes. Existing Groq, publication and source-policy tests continue to pass. All 162 historical V1–V16 payload/contract hashes and replay outcomes are preserved.

This establishes one familiar source-to-private-draft success with a live validation fallback. It does not qualify broad extraction accuracy, public publication, direct employer verification or live email ingestion. Further work needs independent review of more open notices and programme-specific application methods. MISA's plain-text, multi-programme email destinations and EWC's physical submission method cannot be replaced by a generic contact email or an aggregator redirect. Keep uncertain routes/deadlines in exceptions and public publishing disabled while that scope is qualified.
