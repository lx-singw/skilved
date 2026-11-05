# Dynamic private applicant feed

5 November 2026. The local applicant pilot now reads current staging drafts instead of binding the viewer to a saved record ID and revision. This is a reviewer-only preview of unapproved records. It neither publishes nor starts the ingestion worker.

## Shared reader and quality boundaries

`PrivateApplicantFeed` is an explicitly enabled backend adapter with a configured source scope. It uses the existing genuine-token reviewer queue, snapshot inspection and read-only publication-preview methods. No public route or new authority is added to the normal catalogue service.

Only unapproved, never-public records in review, with a dated closing date later than the current SAST day, enter discovery. Citations must belong to the configured sources. Source pause, publication-preview gates and existing automatic-check expiry still apply. Undated, elapsed, withheld, public, malformed and out-of-scope records do not appear. A known reviewable saved reference can return an `under_review` status without its old facts; this does not assert employer closure.

Every returned opportunity disables application actions, irrespective of what a hypothetical publication could offer. Actual canonical creation/update times are retained; checking the feed does not make a notice look newly produced. The separate checked-at timestamp means the private catalogue was read, not that an employer or AI was checked at that moment.

The bounded inventory admits at most 100 drafts. Overflow refuses the read rather than silently truncating it. A second authenticated inventory read detects concurrent draft edits; changed inventories invalidate continuation cursors. Reviewer revocation or role expiry refuses the entire response. This small local reader is not a production-scale public catalogue replacement.

## Local viewer

The reusable preparation command is:

```sh
node packages/catalogue/tools/prepare-private-applicant-viewer.mjs \
  .artifacts/private-applicant-viewer
```

It copies committed web source into a new ignored directory, with no environment files or credentials, and adds private labels, a gated backend bridge and visible-tab minute refresh. It refuses existing outputs, paths outside `.artifacts/` and escaping symlink parents. It does not provision authentication, start a server or deploy anything. The localhost gateway remains separately configured with the existing Firebase project/reviewer and normal backend access.

The installed gateway runs at `http://localhost:3000/`, with its Next child bound to loopback port 3001 and protected by a random internal gate. Real Google sign-in, the expected existing reviewer identity, normal reviewer access and in-memory expiring sessions remain required. The bridge forwards no catalogue credentials into the Next child. Its Cloud access token can refresh through the existing local gcloud login; this does not extend the viewer's authenticated session or grant a worker role.

The feed checks again every minute while visible, on return to the tab, or through **Check now**. The refresh control stays available after a failed read so later reads can recover. It refreshes the private database view; it does not poll RecentJobs or request AI. Existing browser-local saves remain at the same localhost origin.

The private installation's restart command is `.artifacts/groq/dynamic-private-feed-2026-11-05/start.sh`. The previous local pilot's `start.sh` forwards to it. Run one instance; the local app still stops when its process or WSL stops. Restart requires a fresh reviewer login. This is not an operating-system startup service.

## Verification and staging readback

Twenty focused checks pass: twelve Auth/Firestore emulator reader cases, seven existing publication-preview regressions and one preparation boundary case. The reader integration starts empty, runs the actual fast worker with authored source/model responses, persists its canonical draft and sees it on the next read without a seeded viewer list. Semantic rejection creates no new feed record. Tests also cover unchanged stored data, filtering/cursors, edits during reads, revoked/expired roles, source pause, elapsed closing dates, automatic-check expiry and capacity refusal.

The reader uses the repository's normal demo Auth project and a separate named emulator database so its bounded-inventory/capacity fixtures do not contaminate other suites. The prepared viewer passes Next route generation and TypeScript checking.

The founder completes fresh genuine Google sign-in and confirms the new feed opens. The native reader considers six drafts, omits five that are undated or elapsed, and shows the remaining dated notice. Windows localhost sign-in returns 200; anonymous root access redirects to sign-in, while direct Next and ungated bridge reads return 403. An independent read-only staging check confirms source revision 5, unpaused source state, reviewer-only access, six private drafts and zero public records. No source, model allowance, role, catalogue or publication mutation is performed by this viewer work. Proof, source identifiers and installation scripts remain private under `.artifacts/`.

Browser accessibility and DOM checks verify manual refresh advances the checked-at timestamp, followed by an unattended visible-tab advance from 17:18:58 to 17:20:03 UTC. All four saved references remain; the real notice retains its Interested stage and its detail offers no application action. This verifies current private reads and refreshing, not new real AI output or automatic publication.

## Remaining automation work

The viewer can now pick up eligible canonical drafts on refresh, but it does not create them. The fast runtime/private-refresh feature remains inactive against staging. Reviewed adoption of retained historical/cached work and source revisions, durable attached machine operation, adequate qualified provider capacity and real mixed-batch publication/freshness acceptance remain required. The 21 imported historical notices are not released by a viewer read. Public publishing, hosting and application actions remain off; no full autonomous-production claim is made.
