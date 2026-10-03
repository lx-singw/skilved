# Native schema compatibility and unavailable comparison — 3 October 2026

The V14 development experiment sends the existing strict source-line schema to Gemini. **All 328 catalogue tests pass**, but the full Volkswagen request receives HTTP 400, including a smaller schema with shared references. No native notice inventory is available to score. Minimal structured-output controls succeed, so this sprint establishes limited API compatibility without establishing extraction accuracy or resolving V13's semantic failures.

## Preserved comparison

`native-line-review.mjs` exposes `recentjobs_requirement_review_v14`. It keeps V13's source policy, numbered payload and literal provider system text, including the previous JSON-object schema instruction. The native response schema is additional, out-of-band information. It requires every residual line key, excludes extra keys, limits non-current role strings, requires complete current-condition objects and bounds continuation/alternative numbers. It comes from the same Zod schema used locally. The final contract shares repeated primitive schemas through root references and omits dialect metadata.

Source, contract, reasoning, output mode and schema are bound before decoding. Alternative completeness, continuation ownership, protected uncertainty, applicability, strength, quotation and source coverage remain local checks. There is no answer repair, automatic retry, fallback or adoption by the worker. The offline comparison tool dispatches V1–V14.

All six frozen faithful manual inventories still pass unchanged audits: Siemens, Sea Harvest, Mercedes, Volkswagen, Traxtion and MISA. Volkswagen keeps eight conditions and its two unresolved scopes. The same faithful/defective Volkswagen and Traxtion controls are reused byte-for-byte; audits and source notices are not changed to fit the experiment. These audits remain agent judgments rather than independently adjudicated qualification evidence.

## Calls and capability controls

The planned notice comparison is Volkswagen, an identical repeat, and Traxtion, using Gemini 3.5 Flash-Lite, low thinking, a 3,072-token cap and 60-second pacing. Each notice trial stops on its first HTTP 400 before either remaining call. Saved request comparisons confirm the numbered payload and system text are unchanged; only structured-output configuration differs from V13.

| Request group | Calls | Outcome |
| --- | ---: | --- |
| Full inline Volkswagen schema | 1 | HTTP 400; repeat and Traxtion not attempted |
| Private rejection diagnostic, same request | 1 | HTTP 400, `INVALID_ARGUMENT`, generic invalid-argument message |
| Full schema through documented `responseFormat` | 1 | HTTP 400; remaining calls not attempted |
| Minimal boolean object, existing schema fields | 1 | HTTP 200, valid expected output, 17 reported tokens |
| Same minimal object through `responseFormat` | 1 | HTTP 400; error identifies rejected `text.mimeType` value `application/json` |
| One-line union with Zod nullable integer | 1 | HTTP 200, valid expected role, 10 reported tokens |
| Same union with nullable type array | 1 | HTTP 200, valid expected role, 10 reported tokens |
| Compact Volkswagen schema with shared references | 1 | HTTP 400; repeat and Traxtion not attempted |

There are eight explicitly bounded calls in total: five rejections and three successful capability controls. Successful controls report **37 tokens**. Rejected calls provide no usage; their usage or cost cannot be treated as zero. The inline Volkswagen schema is 22,174 bytes; the final shared-reference schema is 17,638 bytes. The compact trial retains the original source-specific constraints. Neither full schema is accepted.

The minimal tests show that this key/model can use the existing `responseMimeType`/`responseJsonSchema` configuration and accept the tested string/object and nullable-integer union. They do not establish support for the entire source-specific schema. The generic notice rejection does not identify the exact failing constraint or prove a schema-size limit. The newer format probe identifies a transport incompatibility, but the existing format also rejects both full schemas. The attempted newer transport is therefore not retained in the adapter; existing Gemini callers remain unchanged.

Google's [Generate Content schema reference](https://ai.google.dev/api/generate-content#v1beta.GenerationConfig) lists references, unions, required keys and numeric bounds. Its [structured-output guide](https://ai.google.dev/gemini-api/docs/generate-content/structured-output) also warns that large/complex schemas may be rejected and that valid structure does not guarantee correct meaning. The exact cause of the notice's generic HTTP 400 remains unresolved.

There is no manual billing preflight or billing change. There are no new source downloads, employer crawls, route requests or feed writes. Credentials and all requests, responses, audits and evaluation artifacts remain private and ignored.

## Verification and next step

All 328 catalogue tests pass, including exact blind native requests, the unchanged V13 prompt/payload, complete submission reconstruction, source/schema/reasoning bindings, strict wire validation, semantic rejection of singleton alternatives and omitted obligations, retained usage on invalid answers, and one-request rejection without fallback. Firestore/Auth emulators shut down cleanly.

All 144 historical V1–V13 payload/contract hashes and replay outcomes are preserved. The faithful/defective V14 manual replay yields four decision matches and exits 0. Live replay yields six **unavailable** comparisons and exits 1 because no notice inventory was returned; these are not six model extraction failures. There is no paired accuracy comparison or observed native repeatability.

The next experiment should simplify the native wire shape, establish full-schema acceptance with a small source, then repeat these same frozen notice/audit comparisons. A uniform line record with explicit role fields is a candidate; local coverage and semantic constraints must remain strict. Passing small controls does not justify changing providers or enabling publication. Groq remains the worker provider, production scheduling/publication remains disabled, and employer crawling remains optional/off by default. Deadline and original employer/ATS/email handoff qualification still require full-pipeline testing.
