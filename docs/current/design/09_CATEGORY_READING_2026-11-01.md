# Category-specific opportunity reading

Implemented: 1 November 2026.

Cards and detail overviews now order public facts around the category's main decisions:

- Bursary: funding kinds, study fields, education conditions and setting.
- Learnership: the full training arrangement, support, setting and education conditions.
- Apprenticeship: trade / field, training support, setting and workplace conditions.
- Internship: the source-stated student / WIL, graduate, other or unknown route, discipline, setting and support.
- Graduate programme: fields, connected education instructions, setting and programme support.
- Job: pay, experience wording, setting and working conditions.

Each detail page has category-specific introductory copy, additional facts beyond its overview, and three optional questions to check against the notice. These questions are explicitly prompts, not additional requirements. Links return to the existing connected requirements, organisation roles and full practical/support wording.

The support section presents each source-stated component separately, including exact amount/range, currency, period and coverage. It does not add unlike components into a total. Missing coverage and unknown amounts remain explicit. Long facts have native expandable wording, retaining the complete text and escaping markup. Closed intake status is now visible in the overview as well as the application section.

The implementation uses the existing public projection. It introduces no fields, inferred hours, contract lengths, accreditation or qualification outcomes. Education previews count education/subject instructions and retain their route relationship; they do not flatten alternatives into a combined qualification.

Verification passed: type checking, lint, production build and all 188 web tests, including eight new tests for category priorities, route variants, connected education previews, uncertainty, exact pay, organisation roles, long wording and support coverage. Existing condition tests now use the shared recursive UI loader, preserving their assertions.

Browser review used fictional local emulator notices across all six categories. A temporary long job title and multiline conditions were checked on mobile, including expansion to the final source sentence, conflicting experience, ambiguous closing wording and absence of horizontal overflow. A closed fictional intake showed its status without an application link. The organisation shortcut opened its collapsed source context. Stress records were restored afterwards. Category counts also exposed stale requirement kinds in the local demo; those fictional records were corrected without changing their source wording.

Limits: the notice corpus still needs editorial review. Hours, contract, duration and arrangements remain in source wording where the public model has no separate structured fields. No production deployment or real application was performed.
