# Span-only practical-instruction extraction

29 October 2026 (SAST). Practical instructions now use a source-span selection contract. For ordinary, split-metadata and programme extraction, AI returns `practicalConditions` as null or an object containing only `state` and `span`. Trusted decoding reconstructs the practical value and quote from the selected passage. Model-written practical text is rejected rather than compared, repaired or overwritten.

This implements the prospective simplification identified by the [Sasol practical-evidence hold](194_SASOL_SOURCE_REVIEW_AND_PRACTICAL_HOLD_2026-10-29.md). It removes the redundant text-copying task; it does not establish that the selected source passage is complete or semantically appropriate.

## Contract and evidence behavior

Stated facts copy the selected source passage into both canonical value and quote. Null remains not stated. Ambiguous/conflicting facts retain their state and supporting passage with a null value. Existing canonical whitespace rules remain unchanged, and internal line breaks, conditions and negations are preserved. No canonical record schema or public projection shape changes.

Wire objects containing `value`, `quote` or any other extra property fail strict parsing, even if supplied text matches the source. Invalid/reversed/out-of-bounds ranges, blank or oversized passages, and invalid states remain rejected. Programme extraction still checks the selected intake's source scope before reconstruction. Publisher promotions, preparation advice, missing required submission blocks, incomplete conditions and cross-programme evidence retain their existing downstream rejection paths. Choosing a shorter span is not a way around coverage checks.

The canonical practical-value equality guard remains active for native inputs and mapping. Prompt wording distinguishes source selection from the code-reconstructed canonical value. No live option accepts legacy value-bearing practical wire objects.

## Versions and legacy replay

Ordinary extraction advances to `recentjobs_extraction_v28_groq_v8`, with canonical extraction version 28. Split metadata advances to version 20 and programme extraction to version 28. Existing worker keys incorporate those versions, so old wire/decoded caches are not selected as current results. Existing stored caches, snapshots, spending and failed jobs are preserved.

An explicit offline-only decoder retains the previous `recentjobs_extraction_v27_groq_v7` shape and original requirement-before-metadata failure order. Tests reproduce acceptance of a faithful old answer and rejection of a mismatched one without modifying either input. Live ordinary and programme decoders still reject those old value-bearing objects. The original Sasol rejected JSON was not retained, so no replay of that exact answer or claim that it now passes is made.

## Verification

Five new regression tests cover exact conditional/negative text, absence and uncertainty, malformed ranges, extra fields, legacy replay and error priority, contract versions and simulated Groq/Gemini ordinary/split calls. Rejections retain reported usage and stop after one simulated request. Authored existing fixtures now use the new wire shape; their canonical expected text and independent evidence checks remain in place.

The full serial emulator run executes **1,006 tests: 1,005 pass and one fails**. All extraction, programme and worker cases pass. The unchanged actual suggestion-route case returns 503 where 200 is expected after review; it subsequently passes alone in a fresh emulator. That intermittent failure remains unresolved, and no clean full-suite run or suggestion-concurrency fix is claimed. Serial execution avoids the previously documented cross-file snapshot interference but does not establish the route failure's cause. The final five span-contract tests also pass separately, and the contracts build succeeds.

The rebuilt worker image runs as `node`. Network-disabled checks verify both rejection of disabled activation and the new span contract: source text is reconstructed and a redundant supplied value is rejected. No image was deployed. Changed-document link and Git whitespace checks pass. Private trial scripts, source/provider material, credentials and logs remain ignored outside Git.

## Live state and remaining work

Independent cloud readback confirms all **470 staging documents unchanged**, including the Sasol failure, source revision, reviewer-only role, inactive worker grant and quota authority. There were zero provider calls, new budgets or publication writes. The retired local quota ledger remains byte-identical. This was an offline engineering sprint; no temporary cloud access was activated.

Sasol retains one of its two source calls spent for 29 October. A fresh extraction plus validation needs two available calls; the allowance was not raised and no replacement source/job was created to evade it. After offline verification and genuine allowance availability, perform a new bounded trial under this contract. A correct practical span does not by itself qualify the rest of the extraction or an autonomous publication policy.

Hosting remains undeployed, Gemini remains shadow-only, employer crawling remains optional/off and production automatic publication remains disabled.
