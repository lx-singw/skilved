# Verified staging reviewer

29 October 2026 (SAST). The founder completed Firebase console sign-in and initialized standard Firebase Authentication with Google enabled in `skilved-staging`. The selected current Google Cloud account now has a verified Firebase identity and an active staging reviewer role. This completes the identity gap recorded in the [reviewer-readiness sprint](192_PRIVATE_LOCATION_DIAGNOSTICS_AND_REVIEWER_READINESS_2026-10-28.md).

## Sign-in and role binding

Read-only checks confirmed Authentication configuration, enabled Google sign-in in the console, no initial application user for the selected email and zero operator records. Existing authorized domains already included localhost. One Firebase web app was registered for local reviewer sign-in; no website was deployed and no authorized domains were added.

A private loopback sign-in helper used the official Firebase JavaScript SDK and Google provider. The browser flow produced a genuine Firebase ID token. The backend verified its signature, staging audience, revocation state, Google sign-in provider, recent authentication, exact selected email and verified-email claim, then independently checked the enabled Firebase user and linked Google provider. The account's UID came from that token and user record; it was not invented or minted through custom authentication. The temporary token file is private, owner-readable only and expires normally; no refresh token or service-account key was exported.

The helper used a loopback listener, exact Host/Origin checks, a random request nonce, bounded request body/time, no-store responses and a content-security policy. It requested only normal Google identity/profile scopes. Its local session was stopped after verification. Credentials, SDK configuration, account details and raw evidence remain ignored outside Git.

An explicit infrastructure transaction created one `m0_operators` record with `active: true` and only the `reviewer` role, plus a private bootstrap receipt. There is no source-role grant, worker publish grant or IAM expansion. The existing operator CLI still has no bootstrap command. The founder's earlier account choice authorizes this specific reviewer binding; Google Cloud administrative access alone was not treated as a Firebase application identity.

## Actual operator verification

The normal Catalogue API, using Firebase Admin's real token verification and revocation checks, rejected the authenticated account before its application role existed. After the grant, the same token successfully read all five private drafts. Read-only publication previews returned three dated-record forecasts and rejected both undated worker records with `UNDATED_WORKER_PUBLICATION_UNSUPPORTED`.

Those dated forecasts are not approvals of open availability, extraction accuracy or source qualification. ALPLA's employer destination was previously observed unavailable, and the other dated records have historical closing dates. No draft, check or decision was edited to make a forecast pass. No publication action was executed.

Complete readback preserves all 448 pre-existing staging documents. Only the reviewer record and bootstrap receipt were added, bringing staging to 450 documents. Public records remain zero; sources, drafts, decisions, origins, worker grants, provider calls, budgets and quota authority are unchanged. Verification includes real sign-in, denial before role assignment, authenticated operator reads/previews and independent database comparison. Application code did not change; no full-suite rerun is claimed. The previous concurrent-suite failures and their passing isolated reruns remain documented in the preceding sprint.

## Next release step

Reviewer authentication is established. Next prepare an eligible current dated notice with qualified source scope and supported original application method, then use the authenticated review/preview/publication path for the first staging feed entry. Source registration still requires a separately authorized source-role operator. Bidvest's saved notice states a 29 October closing date, but its employer availability remains unverified and robots disallows automated retrieval; it must not be assumed open from that date alone. Brochem's saved email notice requires qualification/source-faithfulness review. No AI assessment or source registration was performed here.

Hosting remains undeployed at the founder's request. Employer crawling remains optional, Gemini remains shadow-only and production automatic publication stays disabled.
