# Sprint 1 review disposition after B02 engineering work

Date: 25 September 2026. The original review remains historical evidence against `0e655d1`. This ledger accounts for its findings after correction commits and the current implementation; it does not mark production controls proven.

| Finding | Current correction/evidence | Limit / remaining work |
|---|---|---|
| R1 CI skips development dependencies | Corrected workflow installs with NODE_ENV unset, production scoped to build/test; final-candidate clean sequence retained in this bundle | Hosted GitHub execution not run; do not claim remote CI |
| R2 unsafe emulator advice | Example emulator variables commented; document distinguishes Admin/client behavior and specifies fail-closed guard | Active Firebase helpers are TODO stubs and no active SDK initializes. Guard wiring/tests mandatory before B03 SDK activation; not a deployed control |
| R3 spending stop ineffective | ADR rewritten around explicit project/resource inventory, supported manual scaling, tagged-revision caveat, trigger/job containment and recorded restoration | Not executed; staged rehearsal and actual resource/billing inventory required |
| R4 premature G0 closure | G0 remains open; separate engineering results from real observation and founder confirmation | Observation/decision kit prepared; no fabricated session or confirmation |
| R5 real-looking fixtures and wrong checklist logic | B01 issuer examples labelled test fixtures; canonical examples use fictional issuers and .example domains; OR/conditional logic tested | No examples count as live-source coverage. Human understanding remains to observe |
| R6 accessibility/evidence overstatement | Actual 375/1280 viewport inspection, 44px B01 controls, focus wrap/Escape/restore checked; background inertness and truthful handoff copy fixed in this task | Browser evidence is desktop emulation. No physical phone, throttled LCP/INP/CLS or screen-reader certification |
| R7 ignored evidence | Earlier text logs tracked; new logs/results/manifest and screenshots portable in this bundle | Candidate identity is base plus file hashes, not a fabricated commit or hosted run |
| R8 overloaded schedule | Earlier correction redistributes B02–B10 over seven two-week timeboxes; next plan counts B01 carry-over inside capacity | Remaining dates/capacity/effort still need actual founder confirmation and empirical reforecast |
| R9 inaccurate hosting/cost claims | ADR removes provider impossibility/key/security guarantees, regional/legal conclusions and unsupported dollar estimates; scoped workload/operating model added | Price actual SKUs/account allowances and measure deployment before B09 |
| R10 proposed behavior called implemented | ADR explicitly states no standalone container/worker/store deployment; canonical B02 document lists actual entry points and SDK exclusions | Remaining environment-schema proposals are contracts, not startup implementation; current status must not call them installed guards |
| R11 incomplete SSRF design | Corrected ADR includes connection-time destination validation, redirects and IPv4/IPv6 normalization; B02 explicitly does not fetch URLs | Real fetch adapter and bypass tests required in B03 |
| P3 local server binding | Existing B01 server defaults to loopback; new inspection server is fixed to loopback | No LAN binding or public deployment performed |
| P3 category identifiers | Canonical active M0 enum uses graduate_programme; old values retained only for explicit legacy compatibility/manual-review conversion | Dormant agents/web prototypes retain old types until their future migration |
| P3 stale metadata/formatting | Current status/doc links updated; changed-file whitespace and link checks recorded at handoff | Historical evidence is not rewritten to represent current results |

Additional findings corrected locally: the active detail route retained unreachable legacy verification/action UI, now preserved outside routing; revised spending advice still assumed removing public IAM guaranteed all compute stopped, now replaced; private negative safety checks must suppress handoff even when notes are not public, now tested.
