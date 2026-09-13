# Information architecture and user flows

M0 companion flows, 13 September 2026: the [detailed experience](05_OPPORTUNITY_COMPANION_EXPERIENCE.md) governs public feed/detail, source checks, Saved progress, Bring a link and structured sharing. The richer private record/organisation flows below remain later capability design. M0 needs no account to browse or submit a supported public-link suggestion; suggestion receipt access is private and distinct from a career account.

Date: 11 September 2026. Status: proposed interaction specification. Product requirements remain authoritative for release allocation: [PRD](../product/02_PRODUCT_REQUIREMENTS.md).

## Information model

The person owns a continuing record. An opportunity is a separately versioned, attributable source record. A preparation workspace connects a person to an opportunity snapshot; it does not become an application submission merely because a draft exists. A selected evidence pack references a version of the person's material. Sharing creates a separately revocable access grant. Organisational membership is a contextual permission, not ownership of the person's entire career history.

| Surface | What belongs here | What does not belong here |
|---|---|---|
| Public discovery | Six category filters, issuer/source, deadline and date confidence, relevant requirements | Private records, guaranteed matches, fabricated vacancies |
| Opportunity detail | Source link, checked-at time, issuer facts, eligibility versus unknowns, reporting | Unsupported promises or pressure to upload an ID to browse |
| My record | Education, work, projects, evidence, attribution and visibility | A single opaque employability score |
| Preparation workspace | Requirement checklist, missing information, selected evidence, draft, external route, outcome | An unconfirmed “submitted” badge |
| Task activity | Mandate, status, last result, next check, cost/usage constraints where meaningful, pause/cancel | Invisible agent effects |
| Sharing | Recipient/view preview, included items, expiry, revoke, access history within policy | Default public identity documents |
| Help and groups, later | Specific blocker, invited participants, bounded visibility, resolved outcome | Unmoderated school-wide public comparisons |
| Organisation workspace, later | Programme roster, granted evidence, follow-up status, aggregate operations | Cross-organisation access or private unrelated evidence |

## Flow A: useful first visit without a profile network

1. Land on public opportunities; select a category or bring an external opportunity URL.
2. Open a detail page showing issuer, source and deadline certainty. If expired, clearly explain and offer current search.
3. Choose “Prepare for this”. Authentication is requested to persist personal work, with an explanation of what is saved.
4. Ask only for information needed to start the checklist. “I don't know yet” remains a valid response.
5. Show one achievable next action: obtain a document, record relevant activity, verify a requirement or open the official application route.
6. Save the workspace and offer an optional deadline watch. A declined reminder does not obstruct preparation.

Success is an understood next action and a retained useful workspace. A fully decorated profile is not the activation definition.

## Flow B: turn activity into reusable evidence

An apprentice adds a completed task, explains their contribution and attaches a permitted artefact. The interface asks whether it contains workplace secrets or another person's data. The entry is self-reported until a specific reference or assessment supports a narrower claim. A workplace photograph is not automatically proof of competence or permission to perform regulated work.

The person selects the entry for an application pack. Preview shows exactly which text, evidence and attribution the recipient will see. A later edit changes the living record; it does not rewrite the previous application snapshot. A withdrawn reference is labelled appropriately in current views without silently inventing historical endorsement.

## Flow C: weekly return with a concrete reason

The next visit starts with changes relevant to saved goals: a source changed, a deadline approaches, a requested reference arrived, a preparation step is incomplete, or a programme milestone needs evidence. Prioritise by actionability and urgency, explain why, and allow dismissal. “Nothing needs your attention” is a valid state. Do not manufacture anxiety to create weekly activity.

Each notification deep-links to the specific workspace and shows what changed. The user can inspect the source, take one action and pause the watch. Measure whether the action resolved a real task, not simply whether the notification was opened.

## Flow D: external application and outcome

The person reviews the pack, follows the real application route and returns voluntarily to record progress. States distinguish prepared, external route opened, user reports submitted, externally confirmed submitted and later outcome. Confirmation requires attributable evidence; opening a link is not confirmation. Preserve unknown outcomes and allow correction.

If a later authorised adapter is introduced, it gets a dedicated review screen containing destination, fields, documents, recipient, mandate and a duplicate-action safeguard. This is conditional scope, not a prerequisite for serving all six categories.

## Flow E: invited help and coordinator continuity

Later releases allow a user to share a selected blocker with a referee, peer or coordinator. The invitation identifies the request and access boundary. A referee can decline without receiving the entire record. A coordinator's access ends on revocation or membership expiry. The learner retains a portable record when leaving the programme. A new organisation cannot infer consent from former membership.

## Critical branches

| Condition | Required interaction |
|---|---|
| Source cannot be fetched | Preserve the supplied URL; explain that facts need checking; allow manually entered draft facts with their origin |
| Requirement is ambiguous | Label unknown and offer a source check; do not reject the person |
| Upload fails or is quarantined | Preserve permitted draft text; show retry/support without exposing quarantined content |
| Shared pack revoked | Recipient sees a neutral unavailable message; do not disclose the owner's reason |
| Background task delayed | Show last completed check and delayed status; avoid implying continuous monitoring |
| User is under 18 | Route to the approved age-appropriate path; unresolved safeguarding readiness blocks affected private/social features |
| Offline or shared device | Explain unsaved/local state; provide sign-out and avoid retaining sensitive files in browser caches |
| Category has no current results | Say so; allow saved criteria, external link and preparation help; never seed fictional live listings |

## Design handoff packet

For each implemented flow, attach: entry point, user objective, prerequisites, happy path, the critical branches above, data read/write, consent/share effects, copy, keyboard sequence, analytics event and test evidence. Low-fidelity sketches precede polished screens. Evaluate on a low-end phone and a desktop with keyboard access. Keep the flow specification with the implementation change so design and behaviour cannot drift unnoticed.
