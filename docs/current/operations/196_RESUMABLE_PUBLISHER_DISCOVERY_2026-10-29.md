# Resumable RecentJobs publisher discovery

29 October 2026 (SAST). The shared RecentJobs worker now supports an opt-in publisher discovery cycle across several listing pages. A single publisher source and machine grant cover previously unseen detail URLs and several employers. No title, reference, employer or vacancy-specific discovery branch is added.

This is the first implementation slice of [autonomous batch ingestion](../engineering/17_AUTONOMOUS_OPPORTUNITY_SYSTEM.md). It does not complete employer discovery, original-source verification, production qualification or automatic publication.

## Configuration and compatibility

An existing revisioned RecentJobs source can opt in with this addition to its automation policy:

```json
{
  "discovery": { "maxPages": 3 },
  "maxArticles": 10
}
```

`maxPages` accepts one through five pages, starting at the apprenticeship category index. In this mode, `maxArticles` is the chunk size, from one through ten, rather than a truncation of the page. The existing parser admits at most 50 cards per page, so one cycle can queue at most 250 distinct detail URLs. Only a parser-recognized next-page navigation link can advance the cycle. Reaching the configured boundary records `page_limit`; it is not reported as the end of the publisher archive. Archive-wide coverage is not implemented.

The publisher source only needs the category index in `urls`; discovered vacancy URLs are data. Employer-route checks, source permission, source revisions, grants, pause controls and pacing remain enforced. Existing sources without `automation.discovery` retain their first-page behavior. No existing live source is opted in by this sprint, and no pilot-source migration or source renaming occurs.

## Durable execution and provenance

`m0_worker_discovery/{sourceId}` records the active cycle, current job, state, cumulative listed/queued/already-queued counts and completion boundary. `alreadyQueued` means a detail job already exists for that source, URL and cadence bucket; it is not a semantic cross-publisher duplicate decision. Source and bucket continue to determine detail-job identity, including shared identities with freshness watches.

Each page's normalized, parsed list and next link are captured immutably in `m0_worker_discovery_pages`, with retrieval time, source/revision, cycle, URL and content hash. Continuations within that page share its saved observation. A restart or changing live list cannot shift the remaining-card offset. This stores the bounded parsed observation, not a full HTML archive. Existing detail snapshots remain the evidence for extraction.

Detail jobs, the continuation, progress counts and completion of the current discovery job commit in one transaction. An unfinished cycle survives cadence boundaries; scheduling cannot replace it with a new root or change its bucket. Concurrent schedulers converge on the same active cycle. Retry exhaustion or another terminal discovery error marks that cycle as an exception so a later cadence can begin another one. Retries preserve the existing attempt limits.

Each invocation retains the existing eleven-job limit. Discovery continuations are addressed directly through the saved cursor, so a continuation outside the first 50 queued document IDs still progresses. This is not a general detail-queue fairness or capacity redesign. A deployed recurring controller will still be needed to invoke subsequent bounded runs.

Authenticated reviewers can inspect and list discovery progress, and inspect captured page observations, through the existing operator API. These are private diagnostic reads; they do not approve an employer or opportunity. Existing local checkpoint export discovers both collections automatically. The older historical staging-import manifest has not been extended to migrate these new active workflow collections.

## Verification

Authored emulator cases use the normal source-registration API once per publisher and one unchanged ingest grant. A mixed two-page batch discovers three distinct vacancy URLs: two registered employers reach private drafts, a duplicate URL shares its job, and an unqualified route becomes an isolated exception before model work. Subsequent unchanged observations reuse versioned extraction/validation caches and the same record IDs; earlier spending is preserved.

Further cases cover restart after page capture and lease expiry, a changed live listing, concurrent scheduling, a cadence boundary, page limits, robots denial, attempt exhaustion, corrupted saved observations, unsafe listing URLs, invalid offsets/policy bounds, legacy compatibility and authenticated diagnostic reads. A five-page case queues 250 notices over several bounded invocations, including when the cursor is outside the first 50 queue rows. No fixture represents a real employer or opportunity.

The affected serial emulator run passes **215/215 tests** across catalogue registration/publication, discovery, fetch safety, publication previews, worker policy and worker execution. After the operator diagnostic additions, a fresh discovery run passes **10/10 tests**, including the authenticated read restrictions. Those ten overlap the affected run's discovery coverage; the counts are not added together. Source-registration and diagnostic cases use an authored identity verifier to exercise the normal role-checked core API, not a new real Firebase sign-in. Contract build/typecheck and all five staging runtime guard checks pass.

The local worker image is rebuilt and checked with networking disabled. It runs as `node`, imports the new discovery module, advances a same-page chunk and next-page cursor, rejects a foreign listing origin and refuses disabled activation. It is not deployed. Five changed documents pass 311 local-link checks, and Git whitespace checks pass. Private logs and verification receipts are in ignored `.artifacts/groq/publisher-discovery-2026-10-29/`. The full catalogue suite is not rerun; the previously recorded intermittent suggestion-route failure remains open.

## Remaining work and operating state

Employer trust is still held in the source's configured issuer routes. An unknown employer is safely held, rather than automatically discovered/corroborated. Separating reusable employer/ATS trust and implementing the original-source resolver is the next delivery slice. Exact vacancy matching, independent original-source evidence, cross-origin deduplication and qualification must precede activation of the target verified publication lane.

No provider requests, cloud writes, source migrations, grants, quota resets, publication or deployment are performed in this sprint. Existing source/model budgets and daily-exhaustion handling are unchanged. Stage-aware allowance admission and deferred resumption remain later work; the existing terminal source-budget behavior is not solved by discovery cursors. The existing 50-watch capacity and bounded detail-queue selection also remain limits before production scale.

Hosting remains undeployed at the founder's request. Gemini, split extraction and programme extraction retain their shadow-only guards. Employer crawling remains optional. The prior intermittent suggestion-route failure remains unresolved; this sprint does not claim a clean full-suite baseline.
