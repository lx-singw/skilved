# Source-backed location completeness before validation

Date: 18 October 2026. Status: a new local guard rejects the unchanged province-only ALPLA answer at ordinary extraction decoding, split metadata decoding and canonical mapping. Earlier supported ALPLA and Transnet answers still pass offline replay. No provider requests, source retrievals, quota changes or private-pilot draft changes occur in this sprint.

## Problem and behaviour

The [full Flash comparison](108_V16_FULL_FLASH_COMPARISON_2026-10-18.md) found an answer that retained Gauteng but omitted Lanseria from structured location, even while its summary named ALPLA Lanseria. The private case checklist caught that omission; production evidence checks accepted the supported province. A quote supporting each returned value did not establish coverage of the source's work base.

`location-completeness.mjs` now derives narrow source obligations and rejects a missing structured place or incomplete supporting citation with `AI_LOCATION_COMPLETENESS_UNRESOLVED`. It does not fill fields, change states, widen spans or repair responses. No employer-specific place names or geographical lookup are built into the rule.

Recognition covers affirmative work-base sentences about successful/selected candidates or apprentices, learners, trainees, interns and you, using will/shall be based at/in a simple named base. Every recognised comma/and-separated base must have a declared city, province or country matching its terminal place name and the complete source line in location evidence. The terminal match permits an employer prefix without treating that prefix alone as the place.

Typed city/town/province/country labels are checked when explicitly qualified as Work, Job or Training, or within a contiguous Work/Job/Training location section. Section evidence includes the work-location heading. A plain city label in residence requirements or a contact address does not become a work-location obligation. Two-line labels keep their original label/value span and cannot borrow across blank scoped lines. Existing value-evidence checks still reject invented geography, unsupported attendance/coverage and incomplete location spans.

Conditional, negative, alternative, unnamed-facility, address-like and complex prose abstains from this narrow recogniser. Recognised publisher preparation sections and promotional lines are excluded. The rule is a local coverage check, not a city-boundary classifier or complete semantic/geographical verification; unrecognised wording and independent source fidelity still require review.

## Worker and programme boundaries

The guard runs after location value-evidence checks in both metadata decoding and canonical mapping. Ordinary and split provider answers therefore hold before new extraction caching, candidate storage, validation or drafting. A semantic hold retains the successful provider receipt and its reported usage; it does not turn a received response into a transport failure or invoke availability fallback.

Canonical mapping also checks previously cached or internally supplied canonical answers. The regression retains an incomplete cached extraction, then rejects it again on the next job without another model request or validation. Historical cache entries are not deleted or rewritten to make the answer pass.

Programme decoding now uses the existing selected programme view, with excluded lines masked and original line positions retained, after checking every provider span against the selected scope. Another trade's work base cannot create an obligation for this trade. The programme mapper continues to bind evidence to the original parent snapshot and original application route.

Extraction V16/compact V7, metadata V9, programme extraction V16 and validation V13 remain unchanged. Provider instructions, schemas and payloads are unchanged: this sprint adds enforcement of already stated source-retention rules. Cached extraction still passes through the current canonical mapper, so earlier positive cache results cannot bypass the new guard.

## Offline evidence and verification

Private replay binds each saved canonical answer to its raw provider output, verifies retained response/history/quota hashes, and checks the frozen provider contract and payload. The full Flash ALPLA answer fails unchanged with the new completeness error at both decoders and canonical mapping. Its earlier supported answer still passes, as does the full Flash Transnet answer. These familiar examples do not qualify fresh model reliability or population coverage.

Authored regressions cover missing cities hidden by broad evidence or summary text, typed fields, multiword names, punctuation, country-code representation, multiple named bases, residence/contact/preparation exclusions, scoped programme evidence and single-call usage retention. Worker regressions cover ordinary/split holds before caching and validation, a supported private-draft path and canonical rechecking of cached data.

Contracts build, 34 final focused tests, two targeted worker tests and the final 645-test serial catalogue suite pass. Private replay/hash audits pass against the final code. The initial 642-pass/3-fail run is retained: two new test-harness mistakes were corrected (a semantic hold retains a received provider receipt, and an injected canonical adapter must reserve its call). An existing concurrent completion/withdrawal assertion failed once, then passed two isolated checks and the final suite. No unrelated suggestion/lease product code was changed; the intermittent failure is retained as a verification limitation rather than claimed fixed.

The private pilot still has ALPLA draft revision 1 and Transnet revision 3. Shared observations remain 54 generation requests, 164,726 known total tokens and 24 unknown-usage calls; quota/availability bytes, source spending, historical outputs, positive/negative assessments and drafts remain unchanged. Synthetic emulator tests do not call providers or change this private pilot.

Next repeat the bounded current-notice workflow with the new guard and frozen provider contracts, checking source freshness and future notice-stated deadlines first. A failed answer must hold unchanged. Unseen cases, repeatability, independent fidelity and source reuse qualification remain open. Employer crawling stays optional/off; production scheduling/publication remains disabled. Credentials, source snapshots, raw provider responses and private evaluation artifacts remain ignored and uncommitted.
