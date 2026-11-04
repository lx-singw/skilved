# Closing wording and timing file

Implemented: 4 November 2026.

The application rail previously showed a calendar stamp and the deadline's source wording. It now gives the closing record its own compact file: a labelled heading, fact state, calendar stamp, separate local-time and timezone fields, and a scoped wording/source drawer. The category accent connects it to the rest of the notice.

A date-only record explicitly leaves time and timezone unstated. A local time without a zone retains its exact value, including midnight, and explains the missing zone. A recorded timezone is shown verbatim. A UTC time appears only when the public record supplies an exact instant; no instant, browser-local conversion, end-of-day cutoff, countdown or closure verdict is calculated. The machine-readable timestamp retains the original instant while the visible value shows its UTC calendar date and minute.

Until-filled wording has its own explanation without fabricated clock fields or a claim that places remain available. Missing, ambiguous and conflicting facts remain separate states; uncertain facts do not promote residual structured values. Closed lifecycle labels remain independent of the recorded date or until-filled wording. Application availability and handoff guards are unchanged.

The drawer retains the fact's complete original wording and, when different, the separately recorded deadline wording. Only that deadline's unique available source references appear, with separate missing-wording and missing-reference copy. Source links open separately; the separate evidence-check destination is retained. No drawer opens automatically.

Each feed card's “Closing wording” link now reaches the visible, focusable `deadline-heading`, preserving its existing results context. The overview's unresolved closing-date question reaches the same target. Navigation does not tick preparation items, save the notice or change a personal stage. The previous `ApplicationDate` export remains available from `OpportunityOverview` for existing callers.

## Verification

Web lint, typecheck and production build passed. All 315 web tests passed using the unchanged fresh production build. Five new tests cover the precision matrix, until-filled/closed independence, uncertain facts and defensive residual-value rendering, complete/scoped source wording, and contextual feed links to the visible keyboard target. Existing feed destination counts and canonical detail assertions were updated. The application test still prohibits a direct application-destination anchor while permitting the deadline's distinct notice-source link. Withheld detail states omit the timing file.

In the integrated local fictional feed, keyboard activation of a closing-wording link opened the apprenticeship detail with its results context and focused `deadline-heading`. The heading was visible, the source drawer remained closed and preparation ticks stayed at zero. Explicitly opening the drawer displayed only its timing source. No source or application destination was visited and no Saved record was changed.

A private ignored workshop exercised exact time, midnight without a zone, until-filled wording and conflicting sources. The exact example displayed 18:00, Africa/Johannesburg and its recorded 16:00 UTC value. Its drawer retained both distinct source wordings through the final multiline sentence and linked only the closing addendum. Until-filled and conflicting examples had no machine-readable date/time element.

A temporary 320px viewport request produced a measured 415px browser viewport with a 396px document client width. Scroll width equalled client width, no timing-file descendant overflowed horizontally and the source summary measured approximately 56px high. The viewport override was reset.

Both supported screenshot methods failed to capture. DOM, accessibility and geometry checks passed; screenshot-based visual approval is outstanding. Live catalogue data, dark-mode visual appearance, assistive-technology research, external application destinations and deployed behaviour were not verified.

The isolated local preview was updated only with the affected components, CSS and an explicitly fictional timing workshop. Public-read flags, the read-only fictional catalogue adapter, browser records and service state were retained. The workshop is not a production route or published opportunity.
