# Private local pilot: real feed, detail and browser saves

4 November 2026. The founder asked to begin using Skilved privately on their own computer rather than wait for production hosting. A separately protected local applicant viewer is now running at **http://localhost:3000/**. The founder completed genuine Google reviewer sign-in and confirmed that the real opportunity opened. Browser verification confirms the feed, detail and Saved flow. This is a one-draft private pilot, not automatic publication or a continuously refreshed catalogue.

## What can be used now

- Open http://localhost:3000/ for the private feed, or http://localhost:3000/signin when fresh authentication is needed.
- Browse the real Sasol learner electro-mechanic draft, its stated 6 November deadline, requirements, locations and source references.
- Save the notice in this browser and return to it from http://localhost:3000/saved. Local personal stages are available; opening or saving does not assert eligibility or submission.
- Review the preparation checklist. Its ticks are temporary while that page is open; they are not durable saved preparation records.

The private banner and feed count identify an unapproved **private preview**, rather than a publicly published notice. Application actions remain unavailable; the pilot does not approve a draft, renew its checks, submit an application or enable public sharing. Existing source references can still be inspected deliberately.

The save test added the real notice in the browser's default Interested stage. It remains saved for the founder to use. Three earlier sample references were preserved; the pilot connects only the real selected draft, so unrelated saved IDs correctly have no current listing. No saved history was deleted or reset.

## Actual database and access

A fresh read-only staging transaction at **13:35 UTC on 4 November** confirms six persistent unapproved drafts and zero public records. The selected draft is unchanged, the source remains exactly the pinned revision-3 policy, and the pending validation job remains due at **22:00 UTC / midnight SAST**. This pilot makes no catalogue database writes, source requests or model calls.

The Google login verifies the current Cloud account's existing Firebase user and reviewer-only role. Normal authenticated draft inspection and `previewPublication()` produce a hypothetical public-shaped rendering without committing it. The actual public detail remains 404. Identity, current access and exact draft revision are rechecked on reads; a stale, changed or unauthorized record fails closed.

The gateway binds to loopback on port 3000. A copied applicant Next server binds to loopback on 3001 and requires an internal random gate. It receives no cloud/provider credentials or copied environment files and has catalogue/AI execution disabled. The internal projection bridge requires the gate plus the current in-memory reviewer session. Unrelated API paths and mutation requests are blocked. Browser-local saves continue to work without a catalogue mutation.

The applicant copy comes from committed UI snapshot `3b9ab3a`; private-only access plumbing and labels are applied in ignored local artifacts. Production application, extraction, publication and Source API code are unchanged. Port 48739 remains the separate old publisher-policy review tool; it is not the applicant feed.

## Session and local lifetime

The pilot is running for a bounded eight-hour local session from startup. Google tokens stay in gateway memory, with an HttpOnly, same-site cookie; they are not written into environment files or proof artifacts. Access expires no later than the Firebase token expiry or one hour after login. Sign in again at `/signin` when prompted. A new verified login replaces the prior local session without expanding roles.

Browser saves stay with this browser and localhost origin. They have no account backup or cross-device sync, and clearing site data can remove them. The database remains the real remote staging Firestore; this is **a local interface to private staging data**, not a fully offline or locally hosted database. An internet connection and existing reviewer access are required for current reads.

If the pilot has stopped, start it from the WSL checkout:

```sh
bash .artifacts/groq/local-private-use-2026-11-04/start.sh
```

Keep that process running. Do not start a second instance while ports 3000/3001 are occupied. A restart requires fresh Google sign-in; it does not clear browser saves. Local scripts, source projections, authentication proofs and runtime logs remain private under the ignored artifact directory. This is a founder-specific pilot bootstrap, not yet a general packaged development launcher or an installed persistent service.

## Verification and remaining delivery

The copied current applicant UI passes Next route generation and TypeScript checking. Seven pre-authentication route checks, a forged bridge request and a bad login-origin request verify the access boundaries. Windows independently receives the no-store sign-in page. Genuine reviewer proof confirms normal private inspection/preview, reviewer-only access, denied public detail and no token persistence. Browser inspection verifies the real detail, requirements, unavailable application route, saved confirmation, current saved summary, private feed card and save retention after reload.

Browser screenshot capture was unavailable, so no image is claimed as visual evidence; the authenticated DOM states, user confirmation, gateway route responses and private verification artifacts supply the checks above. The previous 121 backend checks remain prior evidence, not a new test run for this local-viewer change.

The **23:40 SAST validation task**, pinned worker/bootstrap files and live source policy remain unchanged. Hosting and public publication stay off. Browsing this pilot does not spend the pending job's source/model allowance.

The next product milestone is a dependable, regularly refreshed **private user feed**: connect eligible real pipeline results to the private read surface, retain existing quality/expiry/application gates, replace the one-draft bootstrap with a reusable local launcher and verify restart/login/save behaviour under daily use. The supervised fast runtime/index/source-history adoption, historical refresh, real mixed-notice qualification and end-to-end automatic-publication/public-feed acceptance are still required for production. The founder can try the current browsing/saving experience now without waiting for public hosting.
