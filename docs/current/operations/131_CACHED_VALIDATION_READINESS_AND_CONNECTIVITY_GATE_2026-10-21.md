# Cached validation readiness and connectivity gate

Date: 21 October 2026. Status: the separately bounded validation follow-up stops at its unauthenticated connectivity gate. No source request, generation call, worker invocation or state change occurs. Offline checks confirm that the accepted ALPLA extraction and its worker cache identity remain intact. Product code and acceptance checks are unchanged.

## Plan and observed connection

The [earlier eight-call pilot](130_LIVE_ALPLA_CONTINUATION_AND_TRANSPORT_HOLD_2026-10-21.md), committed as `7aa156b`, stays closed. Its exception, accepted extraction and spent calls are preserved. Before this sprint's diagnostic, a separate plan fixes at most four validation calls, zero extraction calls, two worker invocations and six minutes of worker time. Generation requires two successful unauthenticated provider connectivity checks followed by, or surrounding, a fresh robots/ALPLA source check with unchanged parsed content. A failed gate stops this sprint before generation; the unused allowance does not automatically reopen either pilot.

The first WSL diagnostic has a shared twelve-second deadline. DNS returns sixteen addresses after 7,246 milliseconds. The request selects a public IPv4 address, retains TLS hostname/certificate verification, disables redirects and prepares an unauthenticated HEAD request to the provider's models-list path. No TCP connection, TLS completion or HTTP response is observed before the abort at 12,007 milliseconds (`ABORT_ERR`). It sends no API key, prompt or generation request. Preparing a request object does not establish that HTTP reached the server.

This differs from the earlier diagnostic's DNS `EAI_AGAIN`: name resolution completes here, but consumes about 7.2 seconds of the deadline, leaving about 4.8 seconds for the later stages. The observation does not establish a provider-wide outage, billing failure or model-quality problem. The next diagnostic should give DNS and TCP/TLS distinct bounded time allowances so a slow DNS lookup does not consume most of the connection window.

Windows reports WiFi IPv4 Internet connectivity and IPv6 NoTraffic. An optional Windows comparison script is rejected before execution by the unsigned-script policy on the WSL UNC path; it makes zero network requests. No execution-policy bypass, resolver change, adapter reset or WSL restart is performed. The second provider check and source retrieval are not reached, and no authenticated request is attempted.

## Offline readiness and preserved state

The saved Gemini 3.7 raw answer decodes unchanged under extraction V22. Its frozen ALPLA checklist passes again with four required conditions, qualification/subject grouping, the standalone subject exclusion, the additional N3 requirement and the document passage's internal alternative. Canonical material and issuer checks pass, retaining the original employer-named ATS destination. This is a recheck of saved evidence, not a refreshed notice, independent employer check or validation approval.

Recomputing the worker's extraction-cache identity with source revision fourteen, the original source fingerprint, configured 3.8 start model, unchanged fallback policy, low thinking and current contracts finds the accepted cache entry. The provider that actually produced the answer remains 3.7. The medium-thinking validation payload matches the previous request exactly; no validation-cache entry exists. A future runner must prohibit extraction on a cache miss rather than silently spending another extraction call.

The source cap remains seventeen, with eight calls already spent on source day 21 October. The Pacific provider day is now 21 October, unlike the earlier pilot's provider day 20 October. Changing provider day does not erase historical usage or refund source spending. Shared quota bytes remain identical: 95 cumulative observed generation attempts, 315,549 known tokens and 39 unknown-usage calls. These cumulative totals are not today's requests-per-day figures.

No worker or emulator is started. No new job, receipt, candidate, exception, cache, decision, snapshot, draft or public record is created, and all earlier records remain unchanged. The former pilot's closed exception is not converted into a pending job. The accepted candidate still lacks validation and remains unqualified for publication.

## Verification and next step

All 592 historical artifact hashes and twenty-six tested code/test hashes match. Offline verification checks unchanged raw decoding, frozen contracts/checklist, material facts, issuer, original route, computed cache identity, identical validation payload, closed-job preservation and byte-identical quota. An initial private audit incorrectly equated one pilot's 66 historical receipts with the shared ledger's 95 cumulative calls across evaluations; that invalid equality is corrected, with its failure retained privately. No product behavior or evidence is changed to make it pass.

This diagnostic/documentation sprint reuses the unchanged product's passing contracts build, 107 focused checks and final 720-test serial suite; those tests are not rerun. Documentation links, staged scope and secret checks are verified before commit. Connection observations, saved answers, quota and the preview remain private and ignored.

Next perform a separately planned connection diagnostic with distinct DNS and connection deadlines. Only after stable connectivity and fresh unchanged source checks should a separately bounded validation-only worker reuse the accepted extraction at revision fourteen, preserving all spending and the closed pilot. No prompt change, semantic retry or answer repair follows from this connectivity result. Employer crawling stays optional/off; production scheduling and publication remain disabled.
