# Native suggestion replay and intake pause

24 October 2026. B06-7a qualifies native browser recovery and paused-intake continuity for the [delivered suggestion UI](155_SUGGESTION_FORM_RECEIPTS_AND_NATIVE_BROWSER_CHECKS_2026-10-23.md). This packet changes documentation only. Suggestions remain default disabled; no live source/provider/model call, deployment, cleanup or production configuration activation occurs.

## Observed recovery

An isolated disposable demo-skilved-b06-replay Firestore/Auth emulator and Next fixture used the direct browser origin. Fixture-only response instrumentation discarded one successful create response after the real backend completed. The browser reported an unconfirmed create and retained its pending entry across reload. The reload issued neither a ticket nor a create request.

Explicit Retry this entry then sent the same signed ticket, verified through matching SHA-256 header digests rather than logging the credential. The browser confirmed committed private access. The server receipt count remained two before and after retry: the earlier diagnostic submission had one receipt and the dropped response had created the second. Retry created no duplicate. This is actual native IndexedDB plus route/backend evidence; it does not replace participant or device qualification.

The original fixture drop condition expected 200, while successful creation returned 202. That initial submission saved normally. The private fixture was corrected to recognize both successful response codes and reloaded through owned server restarts. The subsequent dropped response and recovery passed with unchanged product code and acceptance criteria. The diagnostic remains private; no origin or response guard was weakened.

## Paused-intake continuity

After restarting the owned Next process with intake disabled, the native page displayed the paused notice and disabled the URL input and new-submission button. An existing recovered receipt still returned Received for review through explicit Refresh status. Confirmed server withdrawal removed its local access; independent emulator inspection found one revoked receipt out of the two retained records. The unrelated diagnostic receipt remained. No active pending retry button was present during this paused check, so native disabled-pending-retry qualification remains open.

Visible receipt/status text contained no submitted notice URL, bearer marker or signed-ticket marker. Navigation stayed /suggestions without query or fragment; the disabled input was empty and had no name. All seven observed API requests omitted cookies and referrers. A 375-pixel viewport had no measured horizontal overflow, and the paused notice was visually inspected. This does not close the prior host-clipped wide visual gate.

Local cleanup explicitly discarded only disposable browser receipt references and sent no further server request. The fixture exited normally; its Next/proxy, Firestore/Auth, hub/logging and websocket ports were closed. Raw browser snapshots, screenshots, bounded request digests and server counts remain ignored under .artifacts/sprint-loop/b06-replay-intake-2026-10-24/.

## Verification and remaining gates

A fresh production build including lint/type checks, all 115 web cases, 46 focused catalogue cases and 40 contract cases pass with zero failures or skips. Product source hashes match the tested inputs. No product correction was needed. Previous broader lifecycle emulator evidence remains credited separately and was not rerun as part of this browser packet.

B06-7b must still check native approved/resolved/current-result removal, paused pending retries and nonempty progress/receipt cross-clear. Full wide visual review, deeper keyboard/assistive behavior, real device/participant observations, source permission/qualification, funded staffing/capacity, purpose/notices/retention/vendor facts and release authority remain open. Full B06 and release acceptance are not established. Preserve all six categories, both internship routes, general jobs, free consumer access and R0–R5/S01–S35. Independent authorized B07 work may follow local qualification while actual external gates remain explicit.
