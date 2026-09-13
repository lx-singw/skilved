# Brand and design system

13 September companion voice: the [experience specification](05_OPPORTUNITY_COMPANION_EXPERIENCE.md) adds understood/informed/in-control/supported outcomes, practical plain-language copy, no forced slang or shame, source uncertainty and relatable local circumstances. Trust is demonstrated by accurate service behaviour. Existing visual foundations remain; no mascot, fabricated human supporter or brand redesign is implied.

Date: 11 September 2026. Owner role: product/design; founder accountable until assigned. Status: proposed specification, not an implemented component library.

## Brand promise

**Skilved helps you turn what you do into evidence you can use for your next opportunity.** The identity must remain useful to a school leaver, apprentice, coordinator and experienced worker. Use the spelling “Skilved” consistently; historical SKILVD treatments are archived explorations. A trademark clearance and domain registration are separate outstanding tasks.

The experience should feel practical, encouraging and credible. Show useful work before asking people to decorate a profile. Celebrate a completed preparation step or attributable contribution; never imply that popularity, an AI score or a decorative badge establishes employability. “Not just skilled. Skilved.” is an optional brand line, not a verification guarantee.

## Visual foundations

Retain the prototype's blue direction to reduce unnecessary redesign. The following are proposed tokens; measure rendered contrast before accepting any foreground/background pairing.

| Token | Initial value | Intended use |
|---|---|---|
| brand.primary | #1A56DB | Primary action, active navigation, selected controls |
| surface.canvas | #F4F4F5 | Page background |
| surface.card | #FFFFFF | Content and form surfaces |
| text.primary | #18181B | Main reading text |
| text.secondary | #52525B | Secondary text; test actual pairing |
| border.default | #D4D4D8 | Decorative separation; interactive boundaries require their own contrast check |
| status.warning | #92400E | Warning text with icon and explanation |
| status.success | #065F46 | Completed action text, never universal “verified” status |
| status.danger | #B91C1C | Error and destructive-action text |
| focus.ring | #1A56DB | Visible keyboard focus on suitable surrounding surfaces |

Do not reuse the historical pale/amber/green fills as small text without testing. Each semantic state has text and an icon as well as colour. Dark mode is a later token variant after core screens pass contrast and image/document tests; it must not delay a usable initial release.

Use Inter if available and affordable to deliver, with system sans-serif fallback; use a monospace font only for identifiers or diagnostic code. Prefer local or system fonts over a blocking external font request. Body text starts at 16px with approximately 1.5 line height. Supporting text should remain comfortably readable; do not shrink legally or operationally important information into captions. Headings follow semantic levels independently of their visual size.

Spacing uses a 4px base: 4, 8, 12, 16, 24, 32, 48. Proposed page padding is 16px mobile, 24px tablet, 32px desktop. Reading blocks generally stay within 65–75 characters per line; broad tables can use a wider contained region. Container maximum starts at 1200px. Radius tokens are 4, 8, 12, 16px and full for appropriate pills. Use elevation sparingly; borders and spacing should communicate grouping without expensive visual effects.

## Layout and interaction rules

- Mobile is a primary design context, not an assumed percentage of users. Test actual reachable users' devices and network conditions.
- A screen has one dominant next action, a clear back route and recoverable progress. Sticky actions cannot cover validation errors, focused controls or browser zoomed content.
- The product target for interactive areas is at least 44×44 CSS pixels. This is a product choice; do not describe it as the exact WCAG AA minimum.
- Show explicit loading, empty, offline, stale, partial and permission-denied states. Never render a missing value as zero or silently hide a failed task.
- Save drafts safely. A visible “Saved at …” message must correspond to confirmed persistence; “Saved on this device” is a different state with different privacy implications.
- Respect reduced motion. Use animation to explain state changes, not to demand attention.
- Use load-more or accessible pagination with position restoration. An endless engagement feed is not required for the career workflow.

## Naming and product surfaces

Recommended main labels: **Opportunities, My record, My next steps, Activity**. “My record” contains experience, projects, education and evidence; “My next steps” contains saved opportunities and preparation workspaces. Add “Groups” only when the structured group release is ready. A coordinator enters an explicitly labelled organisation workspace rather than acquiring silent access through the same navigation.

Agent language is task-first: “Watch this deadline”, “Check what is missing”, “Prepare a draft”, “Show what changed”. A technical agent name can appear in diagnostics, but the person needs to know what will happen, when and under whose authority.

## Brand assets and governance

Before public launch, produce a scalable wordmark, favicon, app icon, social preview and monochrome variant. Record creator, licence, source file and export versions. These assets have not been created by this documentation task. Do not use partner logos, employer insignia or government visual identity without applicable permission.

Maintain tokens and components in the repository alongside the actual web implementation. Every change records purpose, affected components, contrast/accessibility evidence and migration notes. The designer may be the founder initially; accountability remains explicit without pretending a design department exists.

## Acceptance and delivery

S05–S06 implement the first record/preparation flows using these foundations. S10 validates the complete public journey. A design is accepted when representative users can understand the action and recover from failure; screenshots alone do not establish usability. The [flow specification](02_INFORMATION_ARCHITECTURE_AND_USER_FLOWS.md), [component specification](03_COMPONENTS_CONTENT_AND_STATES.md) and [design QA](04_ACCESSIBILITY_AND_DESIGN_QA.md) supply implementation detail.
