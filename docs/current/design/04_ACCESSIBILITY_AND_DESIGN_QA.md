# Accessibility, usability and design assurance

13 September launch review: apply [DCF-18/19](../quality/02_DISCOVERY_COMPANION_ACCEPTANCE.md) to actual M0 flows and [companion interaction states](05_OPPORTUNITY_COMPANION_EXPERIENCE.md). Record reference phone/network, cold/repeat transfer and keyboard/screen-reader observations. The previous illustrative 100KB/instant-language is not an established performance result.

Date: 11 September 2026. Owner role: product/design with engineering. Target: WCAG 2.2 AA for the released public journey; conformance is untested until evidenced.

Use the primary [WCAG 2.2 recommendation](https://www.w3.org/TR/WCAG22/) as the criterion source. Automated checks are useful but cannot establish whole-product conformance. Do not advertise certification or full compliance from this document.

## Release review matrix

| Area | Required review | Evidence |
|---|---|---|
| Structure | Correct landmarks/headings, descriptive links, form labels, table headers | Manual screen-reader walkthrough of core flows |
| Keyboard | All actions operable; predictable focus; no trap; dialogs restore focus; skip navigation | Recorded keyboard-only checklist |
| Visibility | Visible and unobscured focus; meaningful controls distinguishable | Screens at normal and zoomed layouts |
| Contrast | Normal text at least 4.5:1, large text at least 3:1; applicable non-text controls at least 3:1 | Measured rendered token/component pairs |
| Reflow | Core tasks at narrow viewport and zoom without lost controls; essential tables have accessible alternatives | Device/browser/zoom evidence |
| Motion | Reduced-motion preference; no unnecessary flashing or auto-advancing content | Preference-specific review |
| Input | Helpful errors, preserved drafts, paste/password manager support, no inaccessible CAPTCHA dependency | Form failure and recovery walkthrough |
| Touch | Product target 44px interactions; separate nearby destructive actions | Device inspection, not visual guess |
| Cognition | Plain instructions, one clear next action, uncertainty explained, no timed pressure without necessity | Observed first-user tasks |
| Documents | Export contains readable text, clear headings and usable reading order; inaccessible original attachment labelled | Export inspection and recipient feedback |

## Representative usability tasks

Recruit school leavers and apprentices from the reachable community with appropriate consent. Start with a small formative round, such as five to eight participants; it identifies problems and does not represent all South Africans. Include lower-end devices, limited connectivity and accessibility needs deliberately rather than as an afterthought. Do not assume a friend's stated interest predicts task success.

Ask the participant to find one plausible opportunity, explain its deadline/source status, identify one missing requirement, add a relevant activity, create a selected pack, explain who can see it, activate and cancel a watch, and record an external application outcome. Use a realistic but non-sensitive example where possible. Record completion, help required, errors, time range and the participant's explanation. Avoid coaching until observation is complete.

Critical misunderstandings include believing an opportunity is guaranteed, a draft is already submitted, a self-report is officially verified, a revoked download has vanished from another device, or a coordinator can see everything. Any such misunderstanding requires design correction and retest before releasing the affected flow.

## Low-data and resilience design

Measure transferred bytes and completion on a documented throttled profile and actual devices. Define and version a performance budget after baseline measurement; do not invent a bandwidth profile and present it as a population fact. Prefer text-first pages, image sizing, deferred optional assets, paginated data and resumable safe operations. Cache public content cautiously with explicit freshness; private documents must not enter shared public caches.

An offline banner states which actions can be saved and which need a connection. On shared devices, local drafts require a deliberate privacy design and clear deletion/sign-out behaviour. Queueing must not silently submit an application when connectivity returns.

## Localisation and inclusion

Begin with plain English and validate language demand before commissioning translations. Keep strings separate from business logic, support long text and local date/currency presentation, and preserve original source wording for material requirements. Human review is required for consequential translated instructions; show the original and indicate machine assistance where used. Do not infer gender, disability, race or eligibility from names or photos.

## Sign-off and defect treatment

S10 owns public-journey accessibility and usability evidence; earlier packages test their own slices. A critical inaccessible action blocks that flow. Record lower-severity defects with affected users, workaround, owner and due review. An exception requires a reason and accessible alternative, not merely a deadline. After significant component, navigation or copy changes, repeat the affected manual tests. Store test records without unnecessary participant identifiers.

The design review is complete only when its evidence references the actual build/version and the [release record](../quality/11_VALIDATION_AND_RELEASE.md). A polished prototype is not implementation evidence.
