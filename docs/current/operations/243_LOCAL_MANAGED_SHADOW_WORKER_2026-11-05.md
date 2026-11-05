# Local managed shadow ingestion and source-challenge recovery

5 November 2026. The local worker now has a frozen runtime and a WSL user-service lifecycle, independent of this chat and the applicant viewer. The reviewed RecentJobs source remains revision 5 in shadow mode. RecentJobs currently returns a browser-check page to the crawler, so source acquisition is blocked before AI extraction. No public publishing or hosting is enabled.

## Runtime and deployment boundaries

`run-local-fast-worker.mjs` delegates the existing bounded fast command to the explicitly named staging service account through the existing, pinned gcloud account. The normal verified machine identity, source revision, ingest-only grant, Gemini authority, lease, fetch pacing, cache and model-budget checks remain in force. The local path requires cloud staging configuration and disabled public reads/reports/suggestions. Hosted workers retain their attached-ADC entry point.

`--check` verifies identity, source/grant and active/refresh queries without discovery, model calls or refresh activation. Identity diagnostics contain only the existing stage/status/error enums. Unknown failures expose a bounded error category and numeric backend status, never raw exception messages, tokens or provider responses. Recognized infrastructure failures can restart; access, configuration, source-state and other terminal failures exit 78.

`prepare-local-fast-service.mjs` takes a private JSON profile and creates a new output under `.artifacts/`. It copies an allowlist of owned runtime source and builds its own copy of the canonical contracts. The service resolves `@skilved/types` to that frozen copy, not the mutable checkout. Installed third-party links resolve to their actual versioned package locations. A release manifest hashes all 173 owned runtime/contract files; bootstrap refuses changed content before credentials or database work. The manifest records the base commit and actual content digests, including prepared changes that were not yet committed when frozen.

No environment file, credential, permission or service is created by preparation itself. The separate existing-key environment file must be private, under `.artifacts/`, with no group/other access. Outputs cannot overwrite existing directories or escape through symlink parents. The generated unit uses an explicit Cloud SDK path, supports paths containing spaces, and keeps credentials out of its command line and the committed source.

The systemd user unit restarts successful bounded sessions and recognized transient failures after thirty seconds. Exit 78 prevents restart. Four starts in ten minutes is the infrastructure restart limit. SIGTERM reaches the existing drain path; the twenty-minute stop timeout is an upper bound before service-manager enforcement. The service is enabled for the WSL user manager. It runs while WSL and the existing Cloud login are available; this is not Windows startup automation or deployed hosting.

Preparation uses `node packages/catalogue/tools/prepare-local-fast-service.mjs <private-profile.json>`. The profile names the output directory, existing private environment file, source/revision, machine principal and gcloud account. After admission and review, systemd can enable the generated unit by its **absolute path**. A replacement outside the standard unit directory must also be enabled by absolute path; re-enabling only a previously linked unit name can remove its link before resolving the replacement. No shell evaluates the profile arguments.

## Live access and private refresh

The existing source owner is checked against the actual Firebase user and the pinned Cloud account. The application operator stays reviewer-only. The existing machine receives only source-scoped `ingest` access, with an expiry of **6 November 2026 at 17:40:15 UTC / 19:40:15 SAST**. The same deadline limits conditional token delegation for the existing Cloud account. There is no `publish` grant, new source ID, replacement quota authority, API key rotation or service-account key file.

Startup check-only admission succeeds before the service is enabled. An initial identity failure rolls back both temporary grants; the bounded retry of read-only admission then observes IAM propagation. The service uses its explicit private-refresh option and activates the source/revision-bound feature marker. It does not adopt old completed work or release the 21 imported historical notices. The source's **two model calls per SAST day**, all real provider accounting and the original Gemini quota scope remain unchanged. The local shell's Groq configuration is not rewritten; the private service profile explicitly selects the existing Gemini chain.

The private stop/restore helper is retained with the installation. It stops the service before restoring the prior machine grant and removing only its own conditional delegation. Grant expiry itself fences later effects, even if a process or cleanup fails. No source/operator privilege is silently expanded to keep the worker alive. Restart after expiry requires renewed reviewed access.

For this private installation, `node .artifacts/groq/local-managed-ingestion-2026-11-05/operate-service.mjs --stop-restore` performs that cleanup under the existing Cloud account. A local `systemctl --user stop` also stops the generated unit without requiring a Cloud login; restoring Cloud access records requires the account to remain available.

## Browser-check pages are unavailable source evidence

A manual engineering inspection uses the shared TLS/address/MIME bounds and current robots/pacing checks. The returned page has no jobs wrapper and asks the browser to perform a check. Its raw HTML stays private; its script is neither executed nor solved by this worker.

The shared RecentJobs adapter now preserves its existing error codes and recognizes this specific challenge signature separately from arbitrary layout changes. An ordinary notice mentioning a browser check does not become a challenge. Both list and detail parsing still refuse to invent notice content from the interstitial.

For discovery, the recognized challenge records `poll.source_challenged` through normal source/grant/authority ownership checks. The existing poll lease remains the durable retry boundary: **ten minutes with the current lease policy**. It is not deleted, shortened or reset to force another request. A restarted worker observes that same wait. No receipt, opportunity, first-seen timestamp or model reservation is manufactured. A later successful parsed page can resume the existing poll and establish its actual observation time. Unknown layouts, source pause, revoked access and stale authority retain their existing failure behaviour.

The runtime can therefore stay alive and retry source acquisition without repeatedly failing its whole process or spending AI calls on a browser-check page. This does not provide access to the protected jobs, qualify a new extraction, or establish publication speed. A permitted accessible publisher feed/API or another supported access route is needed before RecentJobs can supply fresh notices reliably. There is no challenge bypass or quality-gate relaxation.

## Verification

The final combined emulator/offline run passes **249/249 checks**, with no failures or skips in this environment. It covers existing normal-worker, fast discovery/runtime, private refresh, machine identity and new local launcher/service behaviour. Authored challenge cases prove durable wait across restart, no queued records or charge resets, recovery at the existing boundary, actual observation times and continued source/grant revocation enforcement. The saved real challenge is also classified offline without executing its script.

The generated unit is actually loaded and started in the native user manager with an authored environment and no API key. It reaches the expected AI-configuration guard, proving environment-file loading rather than just static unit parsing. The test refuses modified frozen contracts before credentials. This native case is explicitly skipped on machines without the local Linux/Cloud SDK/user-manager prerequisites. Separate native lifecycle probes observe successful-session restart, shutdown drain, no restart after an explicit stop and no restart after exit 78. These probes make no source/model calls.

At **19:41 UTC / 21:41 SAST**, the live worker records `source_challenged`, zero queued notices and a retry at 19:51:27 UTC, while its dispatch lane stays active. A real managed restart is independently verified at **19:44 UTC / 21:44 SAST**: the process and invocation change, the poll ID and retry boundary remain identical, and neither a source fetch nor an AI call occurs during restart. The generated unit remains enabled and running.

Final readback confirms the same source revision/hash, ingest-only expiring machine access, reviewer-only application access, the exact conditional delegation, all 21 historical notices still held, six private drafts and zero public records. The source budget remains at its pre-existing one charged call on 5 November, against the unchanged two-call allowance. Live source acquisition and restart proofs remain ignored under `.artifacts/`. Nineteen final launcher/service checks also pass after the native configuration refinements. New real extraction, a new private draft and automatic publication are not claimed by these checks.

## Remaining delivery work

Resolve reliable permitted publisher access, then qualify current notices and sufficient provider capacity. The inherited two-call pilot cap is not production throughput. Historical/cached-stage and source-revision adoption remain separate from this service lifecycle. A real mixed-batch automatic-publication/freshness demonstration, publishing authority and public hosting are still required. The updating local applicant feed can consume future eligible canonical output; it does not convert a source challenge or a private preview into a published opportunity.
