# Source-bound experience-field completeness

Date: 19 October 2026. Status: offline implementation closes the production omission exposed by the [V21 UFS trial](123_V21_UFS_SUBMISSION_RETAINED_AND_EXPERIENCE_FIELD_HELD_2026-10-19.md). The unchanged saved answer now fails production compact decoding, split metadata and canonical mapping. No real provider call, source retrieval or publication occurs in this sprint.

## Missing field and resulting behavior

V21 retained UFS's experience preference as a preferred requirement but left the separate experience fact `not_stated`. The private frozen checklist held it, while production mapping would have allowed that inconsistency. This matters because the experience field and requirement tree are separately retained and displayed.

The new `experienceCompletenessPolicy` provides original one-based spans and text for narrowly recognized standalone experience rules. Supported forms include explicit preferences, required experience, quantified prior-experience rules, conclusive inline `Experience:` labels and explicit no-experience waivers. Bullet and numbered-list markers remain in the original evidence. Selected programme scope and publisher-preparation exclusions apply.

When these passages exist, the separate experience fact cannot be absent merely because a requirement item contains them. Its evidence must retain every recognized passage in one actual contiguous source range. For a stated fact, its value must equal that complete evidence verbatim. Dropping “although not essential,” promoting a preference, adding text outside the evidence or concatenating distant passages fails `AI_EXPERIENCE_COMPLETENESS_UNRESOLVED`. The code never fills the field, expands a returned quote or repairs a response.

Ambiguous or conflicting facts may retain complete evidence and a null value. This completeness check does not decide whether several rules conflict or establish that a stated interpretation is semantically faithful. Canonical uncertainty checks and independent model validation still apply. No-experience waivers are explicit source statements, not defaults inferred from an apprenticeship title.

Recognition deliberately abstains on education-only labels, duty prose, unfamiliar formats, conditional/alternative routes and oversized lines. It handles conclusive inline labels, not arbitrary paragraphs or label/value pairs split across lines. Missing hints do not prove that the source has no experience rule. Broader completeness and faithful interpretation still require semantic validation.

## Shared paths and versions

Canonical mapping and compact metadata decoding enforce the new guard after the existing education-versus-experience evidence check. Ordinary compact requests, split metadata and scoped programme requests receive the shared guidance and source hints. Programme mapping uses its selected source view; another trade's rule does not become this trade's requirement.

Canonical extraction and programme extraction advance to V22, compact extraction to `recentjobs_extraction_v22_groq_v7` and split metadata to V15. Compact wire schema V7 and the full V15 validation contract remain unchanged; programme validation stays V14. Versioned caches separate future extraction behavior from older contracts. Canonical mapping also checks a cached or internally supplied extraction that bypasses compact decoding.

The education-evidence module, requirement source policy, location-evidence module and validator remain unchanged. Required/preferred strength, qualification alternatives, document applicability and attendance evidence are not relaxed.

## Saved-answer regressions

The UFS policy identifies its complete experience preference at original line 26. Its saved V21 raw answer and decoded values remain byte-for-byte unchanged. Compact decoding, split metadata and canonical mapping now reject that omission with `AI_EXPERIENCE_COMPLETENESS_UNRESOLVED`. Its preferred requirement remains present, and its complete submission and location facts still pass their existing checks.

The unchanged V19/V20 answers remain rejected too. Under the new guard, their stated experience values also fail the verbatim-completeness rule, so compact rejection now occurs there first. Separate unchanged requirement/location checks still expose their earlier failures: V19 requirement coverage, V20 submission coverage and unsupported attendance in both. Historical runtime outcomes are not rewritten to match the new offline rejection order.

## Verification and remaining work

The contracts build, 55 focused checks and all 696 tests in the final serial Firestore/Auth emulator suite pass. Ten new authored tests cover source hints, absent duplicate metadata, changed strengths and dropped qualifiers, explicit waivers, bounded abstention, programme/preparation scope, multiple passages and uncertainty, ordinary/split/programme transport, usage retention, worker storage boundaries and cached-result rechecking. Real employer snapshots and provider responses remain private rather than becoming public fixtures.

Simulated ordinary and split omissions spend one call and retain its receipt and budget without a semantic fallback, cache entry, candidate, validation or draft. A complete authored preference proceeds through simulated validation to an unapproved private draft with its preferred strength and original employer route intact. An internally supplied bad extraction is rejected again from cache without another model call or repaired answer. These are synthetic boundary checks, not a new real-source success.

All 333 frozen historical artifact hashes match, and the shared quota-state hash is identical. Observations remain 83 requests, 282,408 known tokens and 32 unknown-usage calls. Prior responses, negative assessments, jobs, failures, drafts, caches, spending, availability and daily-exhaustion history are preserved.

The authored Groq request measures 24,514 bytes. Its test-only ceiling increases from 24,000 to 25,000 bytes; production source, output-token and evidence limits remain unchanged. The initial size-test failure and measurement remain in private diagnostics.

Next run a separately bounded fresh V22 assessment with semantic expectations fixed before calls. Real-model compliance, repeatability, source qualification and independent employer verification remain open. Automatic continuation across fallback windows remains separate worker work. Employer crawling stays optional/off; production scheduling and publication remain disabled.
