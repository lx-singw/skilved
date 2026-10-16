# Bounded public-summary recovery

16 October 2026. B05-5a qualifies delayed public reads following [explicit reconciliation](86_EXPLICIT_SAVED_STAGE_RECONCILIATION_2026-10-16.md). Native database-loss/corrupt/future-document browser recovery remains B05-5b; device/user and full B05 acceptance stay open.

## Implemented result

Current public-summary reads now abort after eight seconds, including stalled response bodies. Upstream cancellation is forwarded; completed reads remove their timer/listener. A cancelled, failed or invalid read returns unavailable, separately from a genuine 404 missing result. Identity-revalidation callers receive the same bounded behavior. This deadline is an engineering recovery limit, not measured phone/network performance acceptance.

Saved entries use a small read-only latest-request controller for refresh/focus/pageshow/visibility. A new read cancels its predecessor, shows loading and accepts only its own result. Disposal blocks late completions and future reads, including a transport that ignores cancellation. No local progress write is triggered by these effects. Public requests remain ID-only and no-store; source titles/revisions remain transient, with no saved application destination.

## Verification

Final lint, typecheck, production build and **all 89 web tests pass**, with no skipped tests. Four new tests exercise obsolete responses ignoring abort, disposal, retry, the exact eight-second timer, stalled fetch/body cancellation, upstream abort and minimal public requests. Existing personal-progress, alias and private-boundary regressions remain included. Contract/store/server behavior is unchanged, so their full suites were not repeated.

**Ten actual synthetic browser checkpoints** use a private loopback proxy around the real local Next/API/emulator stack. An old response is held while personal Applied remains visible; updated source facts then appear, and releasing the obsolete cancelled response does not restore the old title. A separate rapid manual refresh supersedes a held request in 595ms, before its deadline. Proxy evidence confirms the browser closed each held request before release. The unit test separately proves ordering when a transport ignores abort; the native browser did honor cancellation.

A further held response reaches the visible unavailable state, retaining personal progress and distinguishing outage from missing. The browser wait adapter ended before the product deadline; a subsequent actual DOM observation confirms the final failure state. No exact browser timeout duration is inferred from that wait. Explicit retry restores the updated title/change notice, with exact saved/Applied-report timestamps unchanged. A new tab retains the same progress. Measured document widths360/1265 fit actual375/1280 viewports; the mobile screenshot shows failure, retry and Applied together.

Private logs, hashes, proxy events, DOM/results, fixtures and screenshots remain ignored under .artifacts/sprint-loop/b05-refresh-2026-10-16/. Synthetic saves were removed, owned tabs closed, viewport reset and local web/proxy/emulators stopped. The existing ignored environment was loaded with reads explicitly directed to a demo emulator. No issuer destination was visited; a harness guard smoke redirect was not followed. No provider, source-permission, deployment, real-user, physical-device, browser-process restart or OS-loss result is claimed.

## Next

B05-5b: native database deletion with a stale tab, malformed/future-document preservation and explicit scoped reset, storage-unavailable recovery, separate receipt/site-data boundaries and final local B05 disposition. Record actual evidence separately from browser restart, OS site-data eviction, physical-device and participant qualification. Formal G2/source/held-out/seasonal/operating/release gates remain open.
