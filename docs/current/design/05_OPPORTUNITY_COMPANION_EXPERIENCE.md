# Opportunity companion: experience, content and interaction specification

Updated: 13 September 2026. Status: accepted direction translated into proposed build acceptance, not delivered UI. Owner: product/design; founder initially. Scope authority: [M0](../product/03_DISCOVERY_FIRST_MVP.md). Engineering and review behaviour: [implementation contract](../engineering/04_DISCOVERY_COMPANION_IMPLEMENTATION.md), [source-check operations](../operations/03_SOURCE_CHECKS_AND_COMMUNITY_CONTRIBUTIONS.md).

## 1. Experience purpose

Skilved helps people starting their careers in South Africa make sense of work and study opportunities—with clear sources, practical next steps and support that grows with them. This positioning adds value to permitted scraping, reviewed posting and the public feed. Users may browse casually without a profile, preparation plan, public participation or payment.

| Feeling to earn | Observable product behaviour | How to evaluate |
|---|---|---|
| Understood | Stage-aware explanations, unknowns acknowledged, national/remote options retained | Participant identifies an appropriate route without inventing a qualification |
| Informed | Source, requirement, check scope and uncertainty are inspectable | Participant explains what was checked and what it does not guarantee |
| In control | Browse first; optional saves/sharing; clear, reversible status changes | Participant can save, resume, correct and clear local work |
| Supported | A next step, a correction route and visible handling of material changes | Participant can recover from an expired listing or unclear requirement |

Warm language cannot compensate for stale or misleading information. The companion experience is dependable behaviour; M0 does not pretend a human or AI is continuously watching the user's career. Do not imply emotional dependence, guaranteed employment, personal surveillance or round-the-clock staffed support.

## 2. Public navigation and entry paths

M0 primary navigation: Opportunities, Saved, Bring a link; contextual access to issuer pages, About/how checks work and report/support. Keep all six categories visible. Filter selections belong in shareable public search URLs; local progress, receipt tokens and private circumstances do not.

Entry A: open feed, filter, read a detail, save/share or apply externally. Entry B: arrive from a shared detail link, inspect the current record and explore related listings. Entry C: bring a supported public link, find an existing record or submit it for review. Entry D: revisit Saved and resume from the prior state. No entry path requires an employer to join.

The default local focus is editorial coverage and reachable community learning, not an invisible eligibility filter. Location selection is explicit and removable. Distinguish where work/study takes place, required residence and willingness to relocate. Unknown locations have an understandable inclusion option; national funding and remote options remain discoverable. Never infer a precise home location or relocate a user automatically.

## 3. Feed card and detail hierarchy

Cards show title, issuer, category, meaningful location, source-stated pay/funding summary where known, deadline/uncertainty, source-check summary and save/share controls. Avoid repeating a full checklist on every card: it increases scanning effort. Use concise requirement highlights with detail access. New means new on Skilved unless a different date is explicitly labelled.

The detail must answer seven questions:

| Question | Required presentation |
|---|---|
| What is this? | Plain description, category, intake/reference where stated; internship subtype where known |
| Who offers it? | Issuer and relevant provider/host roles; primary announcement and application relationship |
| Is it available? | Lifecycle, stated deadline, last relevant check and uncertainty |
| Could it suit me? | Required, preferred, conditional and unclear criteria, with original wording available |
| What is involved? | Location/residency, duration, stated compensation/funding and obligations; unknowns visible |
| What next? | Source-backed preparation checklist and labelled application destination/method |
| What if something is wrong? | Report and clarification route with realistic response information |

Suggested reading order: identity/summary → availability → key requirements → practical conditions → preparation → destination → detailed source checks/corrections. Keep check summaries visible near consequential claims; do not bury all evidence at the bottom. A sticky action, if used, must not obstruct text, keyboard focus or small screens.

## 4. Source-check panel

Call the component "Source and checks" or similarly plain language. Show the original announcement, discovery reference when useful, actual application destination, scope of each check and check time. Distinguish a working URL from issuer attribution and from confirming the intake is open. Reuse the engineering check record; never derive reassuring copy from a generic completeness score.

Example wording is conditional on actual evidence:

- "Found on the employer's careers website."
- "Application destination checked 13 September, 09:20 SAST."
- "Deadline not stated in the announcement."
- "We couldn't recheck this source. Last successful check: [actual time]."
- "This requirement needs clarification."
- "Applications have closed."

Every relative time has an accessible absolute-time equivalent. Do not claim a recent check because a page was rendered or a database row was edited. Avoid a blanket green verified badge, scam-free guarantee or a shield implying guaranteed safety. An attributed third-party ATS destination can be legitimate; display its relationship rather than treating its hostname as a verdict.

## 5. Source-faithful explanations and preparation

Separate three layers: original source requirement, plain-language explanation, and outstanding clarification. Retain logical relationships: AND, OR, conditional alternatives and unknown relationships. Never add a marks threshold, substitute Maths Literacy for Mathematics, equate qualifications or waive a trade test/certification requirement without source support.

"What you don't need yet" is allowed only where the source explicitly supports that statement. Silence is not a waiver. File formats, size limits, document certification/age and the stage at which each item is requested must also be sourced. M0 checklists explain preparation without uploading private documents or attesting that the user meets requirements.

Examples:

| Situation | Helpful wording | Avoid |
|---|---|---|
| No experience rule stated | "The announcement does not specify previous experience." | "No experience needed" |
| Provisional results unclear | "The provider hasn't explained whether provisional results are accepted." | "You're eligible with provisional results" |
| Required subject gap | "The source requires Mathematics. It does not list Maths Literacy as an alternative." | Automatically rejecting the person from every related route |
| Missing pay | "Stipend amount not stated." | Zero, a market estimate presented as actual pay, or fabricated employer figures |
| Closed opportunity | "This intake has closed. Explore current opportunities in this category." | Reset urgency or silently substituting a different intake |

Do not display unrelated identity or financial-document requirements merely because they appear on a standard template. Explain any genuinely source-stated condition precisely and allow the person to decide what to pursue. Alternative listings are discovery suggestions, not guaranteed eligibility.

## 6. Bring a link

Prompt: "Found an opportunity somewhere else? Bring the public link." Explain supported routes before submission. M0 accepts a public URL only: no screenshot upload, login credentials, private messages, ID documents or unrestricted free-text evidence.

States: validating → existing public listing found OR received for review → reviewing → linked to published record / unable to establish source / unsupported route / review paused. A network error is not a rejection. A receipt records that the request was received, not that the opportunity is genuine. Public publication always requires review. Explain that review may not finish before the opportunity deadline; users can continue browsing while waiting.

Keep receipt access on this browser, with an explicit shared-device notice and clear option. Show only safe status and an approved public result; never expose another submitter, internal notes or the submitted raw link through a public status page. Do not promise receipt recovery without an account. The accepted-link scope and moderation availability must match actual operations.

## 7. Saved progress and return experience

Device-local progress labels: Interested, Preparing, Applied — marked by you, No longer pursuing. Record "Application route opened" as a separate dated event rather than overwriting user-selected progress. Opening again must not demote Applied. These are personal annotations, not an employer pipeline or official submission evidence.

First save copy: "Saved in this browser. People using this browser may see it. Clear your saved list any time." Provide remove, undo where feasible and clear-all confirmation. No cross-device sync promise. If storage fails, say it did not save and offer copy/share; never show false success.

On return, preserve status while displaying current availability and changes since the last viewed revision. Examples: source requirement changed, destination under review, intake closed, record merged. A closure does not erase user work. Browser-only M0 can update on revisit; push/email monitoring arrives later with opt-in controls. Clearing progress and clearing receipt access must be understandable separately or through a clearly scoped clear-all action.

## 8. Sharing and public previews

Provide user-initiated WhatsApp text, native share when available, and copy-link fallback. Preview the content. Include title/category, issuer, source-stated key facts, deadline uncertainty, as-of date and canonical Skilved link. Keep it readable; do not promise a universally beautiful preview or that the recipient received it.

Synthetic template, never a real vacancy:

```text
[Opportunity title] — [category]
Offered by: [issuer]
Location: [stated location or not stated]
Requirements: [short source-backed summary]
Closes: [stated date or not stated]
Details as of [date]. Check current details and application route:
[canonical Skilved opportunity URL]
```

Omit absent optional fields when that improves brevity, but do not replace them with invented facts. No "verified safe", private progress, applicant identity or receipt capability in shared text. A cancelled share is not a completed referral. Messaging clients can cache previews and forwarded text cannot be recalled; current detail pages must communicate changes and closure.

## 9. Voice, inclusion and performance

Use calm, dignified, practical language. Explain jargon contextually; retain the official term beside the explanation where needed. Avoid forced slang, corporate prestige cues, poverty stereotypes, shame about incomplete profiles, false scarcity and motivational filler. Founder experience may inform the story truthfully without implying it represents every young person.

Plain English is the initial baseline; test priority languages with actual users. Translated requirements must preserve meaning and link to source wording. Browser/device/network limitations are user circumstances, not signs of low ability. Use text-first layouts, accessible labels, non-colour status cues, keyboard navigation, readable focus, announced errors and retained scroll/filter state. No compulsory video, programmatic display advertising, popups or autoplay in M0. Later clearly labelled sponsorship remains a separate decision under existing policy.

Measure transfer bytes, requests, interactive usability and memory behaviour on an identified low-end Android/reference network, including cold and repeat loads. "Under 100KB", "instant" and zero-rated access are not published claims until scoped measurements or provider agreements support them. Agree an engineering performance budget after the baseline; record failures and remedies.

## 10. Pre-build prototype review

Use real public opportunities and labelled synthetic scenarios for uncertain, changed and suspicious cases. Ask reachable peers/school leavers to explain the source, one requirement, remaining uncertainty and next action; save and resume; share voluntarily; and report a problem. Compare with their existing method without coaching or selecting only favourable cases. Record comprehension errors and participant effort, not only stated enthusiasm. Broad institutional studies remain post-M0.

Acceptance cases: [DCF catalogue](../quality/02_DISCOVERY_COMPANION_ACCEPTANCE.md). Detailed issue order and estimates: [M0 delivery plan](../planning/03_M0_COMPANION_DELIVERY_PLAN.md).
