# RSS transport in the normal shadow pipeline

5 November 2026. The ordinary fast worker can now use the publisher-advertised apprenticeship RSS feed for discovery and full-detail acquisition under explicit Source opt-in. It runs the existing extraction, original-employer checks, independent validation and canonical private writer. This is installed-code/emulator integration. **The live Source remains revision 5 without RSS opt-in; its frozen HTML service still waits on the publisher challenge.** Hosting and public publishing remain off.

## Explicit Source policy

`automation.publisherFeed: "rss_shadow_v1"` requires shadow RecentJobs mode, valid fast-ingestion policy, both the existing category URL and the exact category-feed URL in `urls`, and `discovery.maxPages: 1`. Feed-window coverage cannot masquerade as paginated archive coverage. Unsupported or automatic-mode settings fail Source validation. No setting is added to an existing Source implicitly, and employer crawling stays separately optional.

The current Source API still refuses ordinary edits to a fast source except its exact emergency-pause transition. The new schema field does not bypass that guard. Activating RSS against retained live state needs a reviewed revision-adoption operation; directly overwriting the Source, renaming it or replacing its model authority is not a supported cutover. Neither the active Source nor the installed runtime release is changed here.

## Discovery and acquisition evidence

The coordinator selects its discovery transport from current Source policy under normal source/grant/authority checks. RSS discovery checks robots permission and crawl delay, uses shared durable fetch reservations and captures a typed feed receipt. The receipt records its feed hash, per-item hashes, canonical notice URLs, titles, publication timestamps, actual retrieval time and `feed_window_only` coverage. It stores bounded metadata, not the whole XML body in a queue document. Every queue chunk revalidates the receipt; a receipt is required for RSS discovery admission.

Existing canonical notice IDs, original first-seen times, queue/concurrency limits and held history are preserved. A partial poll can reuse its saved receipt across restart without relabeling old observations as new. HTML and RSS receipt profiles cannot substitute for one another, and receipts from another poll cannot backdate new work.

Each admitted RSS detail job separately retrieves the current feed under the normal robots, pacing, source, lease and grant gates. It selects the exact canonical article URL and parses its full description. A discovery receipt is not a fresh detail acquisition. The copied description is explicitly framed as RSS input, with worker adapter `recentjobs_category_rss_shadow_v1`, rather than represented as fetched article HTML. The engineering review profile remains distinct and pending; only an explicitly opted-in worker uses the normal shadow pipeline profile.

Acquisition provenance is retained with the private snapshot and execution: feed URL/hash, item hash, GUID, original publication-date text, actual retrieval time and coverage. Content snapshots remain immutable; a subsequent refresh execution records its new retrieval separately. Unchanged retries retain their original acquisition/freshness boundary. Canonical item identity remains the article-URL hash, while content/cache identity distinguishes worker RSS from engineering review and HTML. A sibling/feed acquisition change does not invalidate unchanged item content. Changed item content does invalidate that binding.

## Existing quality and recovery gates

The existing detail parser retains connected qualifications, subject alternatives, deadline candidates, original email/portal instructions and strict layout holds. RSS category membership does not establish the canonical category. Source preflight, registered issuer/origin trust, original-notice matching when configured, extraction completeness, material-fact checks, independent validation and shadow-only drafting remain in force. A wrong original vacancy is rejected before extraction. A validation response omitting required employer evidence is rejected before drafting. Aggregator URLs do not become application handoffs.

Feed-window disappearance produces `RECENTJOBS_RSS_ITEM_UNAVAILABLE`, not a closure, deletion or invented replacement notice. During a private refresh it preserves the earlier draft and charged allowance without renewing that draft's freshness. Structural detail failures remain held; existing bounded transport retries and exceptions remain inspectable. Falling out of a ten-item feed is not evidence that an opportunity has closed, and feed-only acquisition does not establish complete long-term refresh coverage.

Recognized discovery transport/XML availability failures record `poll.source_unavailable` and retain the owned lease as the durable retry boundary. With the current lease policy this is ten minutes. Restart preserves that wait; later valid acquisition can resume. Source/grant revocation, expired ownership, unsafe destinations and robots refusal retain their own failures rather than being hidden by the availability path. No fallback executes browser challenges or transfers browser cookies.

The existing source-day budget, provider exhaustion tracking, configured fallback chain, charged-call ledger and model caches remain authoritative. An exhausted allowance defers a job without an extraction or counter reset. RSS changes acquisition; it does not supply extra calls, approve a result or qualify production capacity.

## Evidence and retained live state

The emulator cases use authored notices and stubbed model responses. They exercise the ordinary discovery, dispatcher, extraction, employer resolver, independent validator and canonical private draft path, including partial-poll restart, robots/access fences, unavailable XML, missing window entries, exhausted allowance and private refresh. Original HTML/application-layout, migration and refresh regressions are checked alongside the new path. The final affected run passes **328/328 checks**, with no failures or skips, using four concurrent test files.

The earlier broad run passed 327/328: the existing private-refresh fairness assertion observed a counter of two where it expected three. That case then passed eight isolated repeats and the complete final run. The test now includes dispatch-result diagnostics; production fairness logic is unchanged. The earlier failure's cause is not established, and higher-concurrency qualification remains open. Passing reruns are not presented as a concurrency fix or proof of production load behaviour. All logs remain private.

An offline replay of the previously captured native feed under a **proposed local context only** produces the same nine pending candidates and one layout hold from ten items. It makes zero network/model requests or catalogue writes. It is parser evidence, not fresh provider validation, Source approval or a live worker run. Captures, responses and raw source context remain private under ignored `.artifacts/`.

Independent staging readback at **21:07 UTC / 23:07 SAST** verifies the unchanged Source revision 5/hash, all 21 historical notices still held, six private drafts, zero public records and the existing one charged call for 5 November against the two-call pilot cap. Application access remains reviewer-only. The WSL service is active on its prior frozen release; ingest-only machine access and conditional delegation still expire on **6 November at 19:40:15 SAST**. No Source, role, grant, provider scope, budget or installed release change occurs.

## Remaining cutover work

Prepare the normal Source API's reviewed RSS revision-adoption path around quiescent retained state. Reconcile revision-bound jobs, cursors/polls, refresh activation/watch state and inventory while preserving historical holds, actual ages, canonical IDs, charges and cache authority. Then prepare/admit a new frozen runtime and test current notices through the real provider and private reader. Do not claim the nine parser candidates are validated drafts.

Provider capacity beyond the inherited two-call pilot cap, original-source coverage, feed-window fallback/long-term refresh qualification and a representative automatic-publication acceptance batch remain required. No public publishing speed, production SLO or hosting activation is established by this integration.
