# RecentJobs pilot readiness: live access and candidate checks

Date: 26 September 2026. This is a bounded live assessment, not a successful AI or publication run. It extends the [initial source assessment](13_RECENTJOBS_FIRST_ADAPTER.md) and [implemented autonomous pipeline](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md).

**Subsequent founder clarification:** this assessment used an overly restrictive implementation assumption: every application destination had to supply a crawled primary notice before publication. The intended product extracts original application methods from discovery sites and hands applicants directly to those methods. The [corrected distinction and remaining implementation gap](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md#founder-clarification-discovery-source-versus-application-destination) supersede recommendations below that make employer-page crawling a universal prerequisite. The observed robots restriction remains relevant to fetching the page, not to a user's direct application link. The five-notice result describes the old pilot rules, not five opportunities proven unsuitable for Skilved.

## Observed results

The production HTTPS transport retrieved RecentJobs robots, the first apprenticeship category page and its first five notices. Reads used `SkilvedSourceReview/1.0`, exact URLs, public-address/TLS checks, identity encoding, a 500 KB cap, ten-second request limits and sequential pacing of at least 2.5 seconds. The robots parser allowed these RecentJobs paths. Source bodies were inspected in memory, not committed or sent to a model. The web reader could not fetch RecentJobs; these observations came from the ordinary guarded HTTPS transport.

| Notice | Source observation | Current pilot consequence |
|---|---|---|
| [Feltex electrical apprentice](https://recentjobs.co.za/2026/09/23/feltex-connacher-electrical-apprentice/) | Stated closing date 28 September 2026; application anchor points to Feltex eRecruit | The application's robots policy denies our user agent. No employer notice was fetched, so primary-content corroboration remains unavailable |
| [Hytec fitter apprentice](https://recentjobs.co.za/2026/09/22/hytec-sa-apprentice-fitter-kempton-park/) | Stated closing date 23 September 2026 | Past the source date; do not spend model calls or claim the issuer independently confirmed closure |
| [Unique Personnel machinery apprenticeship](https://recentjobs.co.za/2026/09/20/unique-personnel-construction-heavy-machinery-apprenticeship-2/) | Closing date not specified; application candidate on PNet | Unknown-date support and the destination relationship need qualification; no primary page fetched |
| [Eskom YES notice](https://recentjobs.co.za/2026/09/19/eskom-employment-service-yes-x50/) | Closing date 22 September 2026 appears twice; title does not establish apprenticeship category | Past the source date; category inclusion is not category proof. Repeated identical dates must not be mistaken for conflicting dates |
| [Actom engineering apprenticeship](https://recentjobs.co.za/2026/09/17/actom-engineering-apprenticeship-2027/) | Closing date not specified; application candidate is a LinkedIn short link | Unknown date and unresolved destination. No redirect was followed and no issuer relationship inferred |

This small assessment found **no candidate ready for the current automatic-publication policy**. It does not establish that RecentJobs has no suitable vacancies or that all employer sites block access. The remaining category cards and older pages were not assessed in this continuation.

The retrieved [Feltex robots policy](https://feltex.erecruit.co/robots.txt) allows named crawlers and disallows the wildcard user agent. Our worker matches the wildcard restriction. SHA-256 of the observed policy: `0e0bb07633f5e18b2f4e7fd0b2b2177d464a34459720f583b4309f8359165fef`. We did not change our identity, use a browser/proxy or fetch the disallowed application page. Search results and another site's summary are not substituted for a worker's qualified primary snapshot.

## Engineering changes from these observations

The worker now performs deterministic preflight before AI: require a supported date/route, reject a past or closing-day date, verify the destination is within a configured issuer scope, and check the primary host's robots policy. It retains the source snapshot and a private exception when preflight fails. Model reservations and calls do not occur for those cases. The later extracted issuer, semantic comparison and transactional publication gates still apply; scoped URLs alone do not authenticate a notice.

Repeated equivalent closing dates are accepted as one date; conflicting or partially unknown dates remain exceptions. The publisher rechecks the same date rule at commit. Regression cases cover zero model calls for expired notices, unqualified destinations and primary robots denial, plus successful duplicate-date handling and rejection of conflicting dates.

## Historical next steps and current updates

The Groq migration now supplies a working provider and makes employer crawling optional/off by default; see the [current runbook](../engineering/16_AUTONOMOUS_RECENTJOBS_PIPELINE.md). The following list records the earlier Gemini/mandatory-crawl assessment. Its credential and mandatory-primary-route prerequisites are superseded. RecentJobs reuse/source qualification and representative extraction evaluation remain open.

1. Configure a usable private `GEMINI_API_KEY`. The existing `apps/web/.env.local` value is present but fails client format validation; the root `.env.local` does not exist. No provider request or key disclosure occurred. Only the selected key was read, not the rest of the app configuration loaded into the worker.
2. Record RecentJobs access, evidence-retention and excerpt-reuse basis. The earlier privacy-policy observation did not establish a content-reuse grant. No outreach has been sent and no grant has been inferred.
3. Qualify at least one accessible primary route and issuer relationship. For the Feltex route, obtain a supported access/feed arrangement or another attributable primary notice that permits the required checks. Another source's summary or spoofed bot identity cannot stand in for this.
4. Evaluate support for unknown deadlines against an accessible primary notice with explicit current availability. Do not invent a deadline to increase feed supply. Short-link resolution also requires separately qualified redirect targets.
5. Run real-provider extraction and validation on permitted evidence in shadow mode; measure material-fact accuracy, eligibility relationships, exception rate and cost per usable notice. Only then configure scheduled automatic publication, actual machine grants, funded monetary limits and deployed checks.

RecentJobs remains the selected discovery source. These findings change the order of pilot work: usable credentials and a verifiable application route come before scheduling. More AI calls or broader crawling would not resolve the observed access and date constraints.
