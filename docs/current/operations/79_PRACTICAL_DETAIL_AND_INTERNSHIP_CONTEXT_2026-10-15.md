# Practical detail and internship context

15 October 2026. Scoped B04b engineering against the [seven-question detail](../design/05_OPPORTUNITY_COMPANION_EXPERIENCE.md#3-feed-card-and-detail-hierarchy). This adds presentation of existing public facts; it does not change extraction, approval, publication, schemas or release gates.

## Result

Canonical detail now shows the known student/WIL or graduate internship route, other-stated wording and an explicit unknown route. No route is inferred for another category. The existing subtype metadata has no per-subtype citation field; the UI does not invent one or present the label as an eligibility decision.

Intake/reference and organisation roles show their reviewed wording and fact-specific public citations. Employer/host, training provider, qualification issuer, oversight and issuer remain separate roles. Work/study places, geographic coverage, attendance and relocation are shown separately from residence conditions. Experience and duration/other practical conditions retain the original text. Compensation shows its stated support kind and period beside the original wording and citation; no amount, fee, commute or payment schedule is estimated.

Missing, ambiguous and conflicting facts have distinct language. Uncertain facts never select a structured value. Clarification directs readers to the original notice and its issuer contact details, without inventing contact information. The preparation prompt asks readers to consider travel, accommodation and recurring costs; missing support does not mean it is offered or excluded. Restricted detail still omits the conditions and application action.

## Actual verification

- Ten focused component/integration tests passed initially. These exercise all six categories, both internship types, other/unknown types, four additional organisation roles, national/hybrid location versus a residence restriction, missing/conflicting/ambiguous facts, pending-review suppression, citation scope and markup escaping.
- Web lint, type checking, production build and all **57 web tests** pass, with no skipped tests. The canonical page integration test also verifies restricted-state omission. No store, contract or worker logic changed; their full suites were not rerun for this presentation packet.
- A temporary Firestore/Auth emulator with synthetic public projections drove actual browser observations at 375 × 812 and 1280 × 900. The stated detail shows WIL, host, hybrid attendance, self-funded relocation, a distinct residence restriction and monthly stipend wording. The uncertain detail shows unknown route, conflicting conditions and absent support. The restricted detail removes those facts and the application action.
- Document width was 360 at viewport 375 for stated/uncertain detail and 1265 at viewport 1280. Screenshots and DOM evidence were saved. The temporary tab closed, viewport was restored and emulator/server processes stopped.

Command logs, checked input hashes, synthetic browser fixture, screenshots and mutable packet review remain ignored under `.artifacts/sprint-loop/b04-practical-detail-2026-10-15/`. These checks used the existing local checkout and its ignored environment configuration, with catalogue reads explicitly routed to the demo emulator. No clean-install, provider-call, real vacancy, participant, physical-device, assistive-technology or production observation is claimed.

## Remaining work

B04 and G2 stay open. Reconcile the existing operator report → restriction → correction → public-read tests and fill only an observed gap. Audit loading and limited-inventory/seasonal explanations against actual catalogue evidence before progressing to B05 local continuity. Credit the delivered field/stage filters, navigation, checklist, scoped source checks and this detail work.

Source sprint `b10e0a2` remains a separate held extraction/validation result. This packet does not approve a source, fund provider calls, establish real category coverage or close any user/deployment/release gate.
