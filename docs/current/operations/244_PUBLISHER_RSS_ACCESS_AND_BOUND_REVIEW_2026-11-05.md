# Publisher RSS access and bound notice review

5 November 2026. RecentJobs advertises a public, full-content apprenticeship RSS feed. Two separate native engineering requests retrieve and parse it successfully through the normal bounded HTTP transport. A new read-only review tool preserves individual notice identity and feeds the copied description through the existing detail parser. **The running shadow worker still uses HTML and encounters the publisher's browser challenge. RSS has not been enabled for that worker.** Public publishing and hosting remain off.

## Observed publisher route

Normal browser navigation to the apprenticeship category exposes an alternate link to [the publisher's category RSS feed](https://recentjobs.co.za/category/apprenticeships/feed/). The browser displays RSS 2.0 XML containing full `content:encoded` descriptions. This is a publisher-advertised endpoint, rather than a guessed API or a solved browser challenge. No cookies are transferred to the worker and no challenge solver is implemented.

Two fresh native processes retrieve the exact category feed at **20:11 and 20:30 UTC / 22:11 and 22:30 SAST**. Both check the current source's unpaused state, current robots permission and request spacing. Both receive the same 295,630-byte body with ten items. The shared fetcher's explicit RSS format accepts RSS/XML MIME types and retains HTTPS, pinned public DNS/socket addresses, no-cookie/no-proxy requests, approved redirect destinations, response-size limits and timeout. An HTML interstitial is not accepted as XML evidence.

These are manual engineering probes, not admitted production discovery polls. They make no model request or catalogue write. This proves an accessible route at those observations; it does not establish an availability or publication-latency SLO. The unsuccessful root-feed probe is not evidence of an accessible root feed. The category feed represents its current window, not a complete archive or proof that older opportunities have closed.

## Read-only parser and review contract

`packages/catalogue/src/adapters/recentjobs-rss.mjs` is deliberately separate from the running worker. It accepts only the observed category-feed URL and bounded RSS 2.0 layout. It requires the publisher channel/self link, expected content/Atom namespaces, full item descriptions, valid canonical RecentJobs article URLs and consistent RFC-style timestamps. Duplicate item URLs/GUIDs, duplicate required fields, missing full bodies, nested namespace changes, malformed XML, excessive size/depth, DTD/custom entities and external processing instructions are refused.

The explicitly pinned `fast-xml-parser` dependency uses finite positive entity limits and reserved-property rejection. Its version was already present in the lockfile; adding the direct dependency upgrades no installed package version. The XML parser does not execute encoded publisher HTML, scripts or instructions. HTML is parsed as a bounded fragment, then inserted into an owned review frame; malformed closing tags cannot escape that frame. Nested or ambiguous notice layouts retain existing holds.

Each parsed item retains its original canonical article URL, original GUID, original publication-date text, normalized timestamp and full copied body. The canonical source-record identity remains the hash of the article URL. A separate item hash binds the parsed item fields; the acquisition hash identifies the whole feed. Changing a sibling item or the local read date does not invalidate an unchanged candidate. Changing that candidate's own content does invalidate it. These hashes identify content, not authority or approval.

The derived frame uses the RSS metadata and the publisher's actual WordPress GUID. Unsupported GUID shapes are held; a numeric post ID is not invented. The frame is explicitly marked `recentjobs_category_rss_review_v1`, with RSS evidence and its own content hash. It must not be presented as fetched article HTML, share an unqualified HTML cache identity, or supply a fabricated verification receipt.

Existing detail parsing retains connected qualification/subject wording, deadline candidates and application methods. RSS category membership alone does not establish a canonical opportunity classification. Every parsed result remains **pending**, with `feed_transport_requires_review`. Parsing a copied description does not establish original employer verification, a safe application method, extraction completeness or publication eligibility. Applicants still require the original application destination/method; the aggregator is discovery evidence, not an approved application handoff.

## Private review command and actual result

Run `node packages/catalogue/tools/review-recentjobs-rss.mjs <private-config.json>` from the repository. The configuration names `input`, `sourceFile`, `outputDir` and optional `observedOn`. Input is a previously captured XML file and the context is a valid existing shadow RecentJobs Source. The output must be a new directory under ignored `.artifacts/`; symlink-parent escapes and overwrites are refused. Outputs use private directory/file modes. The tool has no network, provider, database or publication operation.

The captured native feed produces **ten items: nine parsed review candidates and one `RECENTJOBS_LAYOUT_CHANGED` adapter hold**. A second native acquisition independently produces the same result. All nine remain pending, including any pre-existing detail-parser issues. These counts do not represent nine extracted, employer-verified, approved or published opportunities. Raw XML, source context, candidates and response proofs stay private under `.artifacts/groq/publisher-feed-access-2026-11-05/`.

## Retained live state

Independent staging readback at **20:30 UTC / 22:30 SAST** verifies the exact unchanged Source revision 5/hash, its two-call SAST-day pilot cap and the existing one charged call on 5 November. All 21 imported historical notices remain held; six private drafts and zero public records remain. The application account is reviewer-only. Machine access remains source-scoped ingest-only, with the existing conditional delegation and **6 November at 19:40:15 SAST** expiry. No source ID, policy, quota scope, cache authority, worker grant or publication permission is changed by this sprint.

The existing frozen WSL service remains active. A normal bounded session has also restarted automatically under its existing systemd policy (`NRestarts=1`, prior exit 0). Its HTML discovery lane still records `poll.source_challenged` and retains its ten-minute durable retry boundary. The RSS review code has not been copied into that release or substituted for its active transport.

## Verification and next integration

All **56/56 offline checks pass**, with no failures or skips: XML/namespace/entity/size/date/URL boundaries, item identity, sibling/cache independence, connected requirements and methods, malformed/nested descriptions, existing RecentJobs/application-layout behaviour, shared fetch guards, and private-output refusal/preservation. The native feed probes and staging readback are separate real evidence; no model call, new draft or automatic-publication result is claimed.

Next, integrate RSS into the ordinary discovery/detail path with explicit acquisition provenance and reviewed Source transport opt-in. Feed receipts must preserve actual observation times, per-item evidence, expiry and replay identity. The transition must reconcile revision-bound polls/jobs/refresh state while retaining all historical holds, canonical IDs, real charges, model exhaustion history and valid cache boundaries. It must use the existing reviewed Source API rather than a direct database overwrite or a new source ID to escape history or budget limits.

Then qualify current unseen notices through extraction, original employer/application-method verification, private storage and reader refresh, including replay, source changes and closure handling. The inherited two-call pilot cap remains a throughput limitation. A mixed-batch acceptance demonstration and qualified publication authority are still needed before automatic public publishing. The founder's instruction to keep hosting undeployed remains binding.
