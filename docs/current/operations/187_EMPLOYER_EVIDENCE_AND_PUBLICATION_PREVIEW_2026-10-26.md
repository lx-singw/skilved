# Employer evidence and read-only publication preview

26 October 2026 (SAST). CNH's current employer page advertises an application entry for Apprentice, requisition 6175, in Isando. A private correction proposal and publication preview are prepared. The real draft remains private at revision 2; no reviewer grant or publication was added.

## Employer observations and limits

The refreshed [CNH notice](https://join.cnh.com/job/Apprentice/6175-en_US) displayed an Apply Now menu with manual and LinkedIn options. No login, account creation or application submission was attempted. This establishes an advertised entry, rather than successful application acceptance. The notice's eight requirement groups match the draft, including the preferred N2/Matric subjects. The discovery-site summary's unemployed-youth framing is absent from the employer wording, so the proposal replaces that summary with an exact employer job-purpose excerpt without adding an eligibility restriction.

Robots allowed the notice retrieval, but the guarded employer HTML fetch exceeded the existing 500,000-byte limit. The attempt stopped with `BODY_TOO_LARGE`; no larger limit, alternate worker transport or incomplete primary parsing was used. Browser observations are separate manual evidence, not automatic corroboration. The worker's employer-crawl option stays off. The proposal's manual snapshot and citation exist only in the isolated emulator and private packet; they were not imported into live history.

The packet binds the current draft/source revisions and hashes, employer URL and observation hash, original worker decision expiry, first acquisition and source publication time. It retains the original employer destination and unknown deadline. Its proposed private correction is revision 3; a later publication would be revision 4. Those revisions do not exist in the live database. The original worker decision still expires at 06:40 SAST on 26 October; preparing or previewing the proposal does not extend freshness.

## Preview before mutation

`Catalogue.previewPublication` and the operator's `publication-preview` command require a verified token, an active current reviewer role, an exact draft revision and a supported action. Preview and publication share the same private transition planner, source checks, withdrawal/closure rules and whitelist projection. Preview returns an explicit `publication_preview` envelope with `publication:false`, the expected and projected revisions, catalogue revisions and a point-in-time projection. It writes no draft, version, public projection, audit or outbox event.

A preview is not approval or an execution capability. The later `publish` command independently rechecks identity, current role, draft revision, source state and projection. It also requires the normal reason. Role revocation, source pause and stale revisions still prevent execution. The command is available only through the protected operator workflow, with no new public route or role bootstrap.

An authenticated emulator reviewer and a separate operator CLI process previewed both the existing CNH draft and the corrected proposal. The proposed publication leaves application actions unavailable because no reviewed current route check was added. No synthetic availability observation was promoted to a real check. The proposed snapshot is clearly labelled manual browser evidence, with unsupported automated capture and untested submission recorded. All original cloned worker decisions remain unchanged, and no emulator publication occurred.

## Verification and release state

All **992 catalogue tests pass** in a fresh emulator. Four new tests cover real emulator token/role verification, exact revisions/actions, zero-write preview, safe output, parity with later publication, source/role changes, route checks and sticky withdrawal. The separate focused run passed 4/4. Its fixtures initially contaminated the namespace used for a full run; that invalid run was deliberately stopped, retained, and replaced by a fresh full-suite execution. No assertion or production guard was weakened.

The rebuilt worker image runs as `node` and passes network-disabled startup checks for disabled execution and missing authority. It is not deployed. Separate-process cloud verification confirms all 422 documents unchanged, no reviewer grant or public record, and unchanged quota totals of 153 requests, 470,793 known tokens and 72 unknown usages. There were zero AI calls and no cloud data writes; public employer browsing and the two guarded retrieval attempts are separate source observations. Local credentials, source captures, provider evidence and review artifacts stay out of Git.

The private HTML review file was generated, but browser URL policy blocked rendering its local file URL. A Markdown review packet provides the safer readable alternative; the HTML is not claimed as visually verified. No alternate protocol or browser-policy workaround was used.

Next review the manual employer evidence and reuse scope, approve the exact correction and destination checks through a real reviewer identity, and recheck freshness before considering a staging listing. Application acceptance remains unverified, the undated source remains shadow-only, employer crawling optional/off, hosting undeployed and production publishing disabled. This sprint prepares a reviewable result without claiming production qualification.
