# Preparation checklist and private issue reporting

Date: 15 October 2026. Status: scoped B04b/c local engineering completed and verified. Base: `f65d645`. No live source/model/provider request, new source permission, deployment or formal G0/G1/G2 acceptance was supplied by this sprint.

## Delivered behavior

The canonical public opportunity detail now includes a preparation checklist. Its shared formatter preserves requirement AND/OR/conditional relationships. Each instruction retains source wording and required/preferred/unclear strength; unknown facts stay explicit. Readers can tick reviewed instructions or clear the ticks. The UI explains that ticks neither establish eligibility nor confirm an application, are not sent with reports and are not saved. The keyed checklist resets when record/requirement revisions change; no localStorage, sync or B05 persistence claim was added.

When the existing report flag is enabled, a detail page offers a private report form for incorrect/unclear facts, apparent closure, suspicious destination/payment requests or another issue. It accepts a reason and a description up to 1,500 characters, with no attachments or contact fields. Its fetch sends exactly opportunityId/kind/text with credentials omitted. A POST fallback prevents text entering query URLs before JavaScript hydration. JavaScript is required for the interactive JSON report flow.

Submission blocks concurrent sends and uses a ten-second client deadline. Error messages distinguish invalid input, rate limiting, service failure and uncertain network receipt; descriptions remain available for deliberate retry. Only a 202 response carrying received produces the receipt message and hides the form. Receipt is explicitly distinct from verified/resolved. Reports remain in the existing protected operator queue and do not automatically remove a listing.

## Actual verification

A fresh temporary checkout copied tracked and non-ignored source bytes, excluding local environment files and generated dependencies/build output. The install reused the package store. The candidate file hashes, logs, synthetic browser harness, screenshots and report receipt remain private under `.artifacts/sprint-loop/b04-2026-10-15/` per AGENTS.md. No private artifacts are committed.

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | Exit 0 |
| `pnpm --filter @skilved/types build:contracts` | Exit 0 |
| `pnpm web:lint` | Exit 0 |
| `pnpm web:typecheck` | Exit 0 |
| `pnpm web:build` | Exit 0 |
| `pnpm web:test` | Exit 0; 27 passed, none skipped: 24 existing production boundaries plus 3 preparation/report regressions |

The rendering tests execute repository-owned TSX after TypeScript transpilation with the real React server renderer. They exercise six categories, student/WIL and graduate internships, OR/conditional wording, unknown instructions, source escaping and the bounded POST form. They do not execute or evaluate source notices. An initial lint failure on the test harness's reserved module variable was corrected without changing product acceptance. Its diagnostic log remains private.

Browser verification used the actual local Next.js development application with explicit Auth/Firestore emulator configuration and a synthetic public projection, isolated from production and all live provider keys. Initial cold navigation took longer than the browser command timeout; the loaded page was recovered and inspected. The private emulator config initially referenced a rules path outside its project directory; a private copy of the same deny-all test rules fixed the harness scope. No hosted rules were changed.

- At 375 × 812, keyboard ticking and clearing work. Source OR wording and transient-state limits remain visible; scroll width was 360 px, with no horizontal overflow.
- A whitespace-only description is rejected locally and creates no report.
- A simulated full hourly quota returns the real API's 429 response. The UI preserves description and ticks, restores the submit control and focuses the error message. No report is stored.
- After resetting only the synthetic emulator quota, deliberate retry reaches the real handler and shows the receipt-only acknowledgement. The form is removed, receipt receives focus, and exactly one pending synthetic report appears in Firestore. Stored fields contain no tick state or personal data.
- Reload clears both ticks and acknowledgement. At 1280 × 800 the document width is 1265 px, with no horizontal overflow. Mobile receipt and wide checklist screenshots remain private.
- The temporary browser tab, viewport override, Next.js server and emulators were cleaned up; their local ports were confirmed closed.

Production tests keep the default-disabled configuration and ensure no new private/synthetic sentinels enter shipped static assets. Backend contracts/rules/worker code were unchanged; the prior 477 catalogue-test result remains tied to the qualification sprint and was not rerun as if this UI packet changed it.

## Limits and next work

This packet supplies local checklist/report UI and synthetic queue integration. It does not establish a maintained real catalogue, successful user preparation, assistive-technology compatibility, physical-device/network performance, deployed intake retention/abuse controls, or complete B04/G2. Client timeout/unconfirmed-receipt handling is implemented but was not forced in the browser session; 429 retry was observed. Ticks intentionally remain memory-only; B05 must add versioned local storage, successful-write evidence and changed-record recovery before claiming persistence.

The [packet plan](../planning/11_B04_PREPARATION_AND_REPORT_PACKET.md) and [loop handoff](../planning/09_SPRINT_LOOP_HANDOFF.md) identify the bounded outcome. Next independent B04 work is geographic filtering and query/pagination/error behavior in the public feed, using the existing canonical matcher contract. The live-source qualification trial remains separately held pending its actual budget/authority and current-source evidence. No formal gate was silently closed.
