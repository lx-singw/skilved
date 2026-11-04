# Paced, resumable fast RecentJobs discovery

4 November 2026. Follow-up to [bounded notice dispatch](233_BOUNDED_FAST_NOTICE_DISPATCH_2026-11-04.md). A default-off discovery service connects the minute-poll coordinator to the existing RecentJobs list parser and safe fetcher. It persists parsed page receipts and queues notices in source-approved chunks. This is local shadow integration; staging, the scheduled validation and publication are unchanged.

## Acquisition and retained quality checks

`packages/catalogue/src/fast-recentjobs-discovery.mjs` exports `FastRecentJobsDiscovery`. Construction requires explicit enablement and an existing `FastRecentJobsWorker`. `poll({signal})` performs one bounded acquisition cycle. Competing callers share the existing transactional poll ownership; a waiting caller makes no external request.

Acquisition requires the source's apprenticeship index and explicit `automation.discovery.maxPages` policy. The existing bound of one to five pages applies before acquisition. The service uses the unchanged RecentJobs list parser. Each acquired page gets the same robots allow/crawl-delay checks as the normal worker. Requests use the worker's existing fetcher, which defaults to pinned-DNS/TLS acquisition with URL, redirect, MIME, timeout and body limits. The service additionally rejects an unexpected final URL or oversized response.

Discovery and detail requests reserve and admit turns through the same durable source pacing clock. A turn does not supply employer, model or publication authority. The fast worker now checks its Gemini authority inside every coordinator transaction, including poll claims, page receipt writes and fetch admissions. Source pause, grant revocation, source revision changes, authority revocation and expired ownership continue to fence later effects. Already admitted external requests cannot be recalled.

The service queues candidates only. Extraction, independent semantic validation, application destination checks, optional employer crawling, shared model accounting and canonical drafting still run through the existing worker and dispatcher. Discovery neither consumes a model call nor resets an exhausted allowance.

## Page receipts, chunks and restart

Each acquired listing is saved under `m0_ingestion_discovery_pages`, bound to its poll, source revision, exact page URL, parsed-list hash and retrieval timestamp. The receipt contains the parsed titles/links and next-page link, not executable HTML. It remains private backend source evidence. Receipt validation rejects altered hashes, unsupported links, duplicate cards, future timestamps and mismatched source/poll/revision bindings.

An approved subsequent page requires the preceding saved page to link to that exact contiguous URL. The configured page limit completes the poll with an explicit `page_limit` result; a link outside that bound is not fetched. Every card on each approved page is queued through `maxArticles`-sized chunks. The chunk size does not truncate a page.

Queue writes validate the saved receipt again and use its retrieval time for newly recorded first observations. Existing notice identities, first observations, history holds, retries and charges survive rediscovery. Final chunk creation and poll completion share the coordinator transaction. Earlier chunk commits remain valid if later work fails.

An interrupted owner leaves its poll leased until natural expiry. A replacement recovers the same poll, replays saved pages/chunks without another acquisition, and deduplicates already queued links. Links not yet queued inherit the saved observation time rather than becoming apparently fresh at restart. A response from an owner whose lease has expired cannot create a receipt or queue work. If no receipt committed, a replacement must acquire the page again.

There is no silent lease extension, automatic hold release or artificial retry allowance. Failures do not mark an empty or partially processed listing complete. The service has a fixed finite bound of five pages and at most fifty cards per page. A stop signal prevents further admissions; it does not cancel a request already dispatched or erase committed chunks.

## Verification and remaining delivery

All **101 final checks pass**: fourteen new discovery cases and the 87 dispatcher/migration/bridge/coordinator/planner/runner regressions. Emulator cases cover multi-page chunk completeness, pacing, waiting/deduplicated polls, natural ownership recovery, interruption after capture or after a chunk, robots denial/delay, response/layout rejection, revocation, receipt tampering and cross-poll/future-time refusal. A combined discovery/dispatch case verifies real unapproved canonical draft records and original application destinations using authored source/model responses. These are not live source/model, throughput or publication measurements.

The initial suite exposed an older fixture which installed Gemini authority only after creating its poll. Coordinator-wide enforcement now correctly refuses that sequence. The fixture installs its authored authority before admission; the existing post-reservation revocation test remains intact and passes. Initial and final logs remain private under `.artifacts/groq/fast-discovery-2026-11-04/`.

This module has no timer, public HTTP endpoint, model/publication role or deployment command. The current normal runner/controller/Source schema do not import or enable it. The **23:40 SAST on 4 November** task and its sealed worker/bootstrap inputs remain unchanged; future validation/cleanup are pending. No real source/provider call or staging write is performed in this sprint. Hosting/publication stay off.

Next: supervised runtime and lease-heartbeat integration, then the fresh quiesced legacy cutover and Source API/policy adoption after the scheduled validation. Cached pending-stage adoption, controlled historical refresh and refresh fairness remain separate work. The coordinator's existing 500-job snapshot bound also needs an admitted-capacity/retention strategy before sustained operation; this service does not archive completed history or silently truncate a full queue. Real provider quality, adequate capacity, unattended operation and actual public-feed latency must be qualified before production activation.
