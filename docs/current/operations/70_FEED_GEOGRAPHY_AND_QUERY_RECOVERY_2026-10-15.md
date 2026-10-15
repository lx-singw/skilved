# Feed geography and query recovery

Date: 15 October 2026. Base: `9ab19c1`. Scoped local B04 discovery packet verified; full B04/G2 and real-source qualification remain open.

The feed now accepts province, coverage and remote/non-remote attendance through the canonical query contract. Single empty optional selects mean all; repeated or unknown parameters are rejected instead of silently discarded. Explicit remote=false and supported page-size/sort settings survive pagination. Submitting filters drops the old cursor. Province filtering uses the existing matcher, retaining national/remote semantics without treating residence as eligibility.

The server read boundary distinguishes invalid filters, invalid cursors, stale catalogue cursors and unavailable service. Recovery messages cannot be mistaken for empty inventory. A stale/invalid cursor offers a first-page restart with the same valid filters; bad filters offer a clean restart. Unknown errors become generic unavailable state without private details. All navigation targets are fixed local routes with encoded query values.

## Verification

- Nine focused regressions pass: geographic/false-value parsing, empty-select normalization, duplicate/unsupported rejection, real canonical cursor binding, filter-preserving restart, local links, safe error classification, rendered controls/recovery and invalid-query rejection before SDK initialization.
- `pnpm web:lint`, `pnpm web:typecheck` and `pnpm web:build` exit 0.
- `pnpm web:test` passes all 36 tests with no skips, including existing sensitive-route, default-disabled and asset-leak boundaries.
- An isolated synthetic emulator/browser check at 375 × 812 confirms Western Cape includes the national fixture and excludes the Gauteng-only fixture. Submitting Gauteng shows both. Pagination preserves province and page size. Bumping only the synthetic catalogue revision produces the changed-results state; its restart returns to the same filters without the stale cursor. Document width is 360 px, with no horizontal overflow.
- The temporary tab, viewport override, dev server and emulators were stopped. No live source/provider request, source permission, cloud deployment or production publication was performed.

Private logs, browser screenshot and recovery records remain under `.artifacts/sprint-loop/b04-query-2026-10-15/`. Browser verification used a separate previously clean-installed temporary checkout updated with the four current production files; production checks ran in the working checkout. No fresh-install claim is added for this packet. Backend source/worker contracts were unchanged and their full suite was not rerun.

The five-hour allowance reached the checkpoint reserve after verification. Commit/push and durable recovery are the final actions for this run, then the loop waits for the actual reset plus its configured buffer. Next review the remaining B04 acceptance gaps; if they depend exclusively on real-source/user/provider facts, plan independent B05 local continuity while keeping formal gates open. Physical-device, assistive-technology and real-user results remain unestablished.
