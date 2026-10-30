# Scoped Recruiting Marketing application evidence and vacancy binding

30 October 2026. Follow-up to [shared careers delegation](206_SHARED_CAREERS_DELEGATION_2026-10-30.md) under the [autonomous delivery target](../engineering/17_AUTONOMOUS_OPPORTUNITY_SYSTEM.md).

## Result and actual limits

A shared Recruiting Marketing adapter can bind a single Microdata JobPosting to its canonical vacancy page using posting-owned declared application controls. It records the platform ID in its own namespace, without inventing a structured posting URL or recruitment reference. There are no employer names, advert titles or sample IDs in production matching rules.

In the frozen **29 October first-ten cohort**, the saved Sasol notice now passes corporate delegation and vacancy binding. It then reaches the existing `DEADLINE_CONFLICT`: the original timestamp converts to 7 November in South Africa, while the publisher states 6 November. The date interpretation and conflict rule are unchanged. All ten notices remain held before AI; there are zero real drafts or publications.

This is offline replay of saved evidence at the prior `2026-10-29T18:07:41.442Z` baseline, not a fresh 30 October availability check or use of expired historical proof in a live service. Execution time is recorded separately. Source selection, failed rows, one publisher revision, one ingest-only grant and locally reviewed corporate roots are retained. No live notice acquisition, provider calls, cloud writes, role grants, quota changes or deployment occurs.

## Shared binding contract

The supported relationship consists of:

- One bounded Microdata JobPosting, with its existing issuer/title/description identity checks.
- One canonical HTTPS page matching the original application destination exactly.
- A supported canonical `/job/<slug>/<numeric-platform-id>/` path.
- Declared Apply/Apply-now anchors or buttons owned by that posting, outside descriptions, nested items, navigation, headers, footers, forms and scripts.
- Safe same-origin `/talentcommunity/apply/<same-platform-id>/` targets, with no query except an optional single supported `locale` value.

This is an adapter for observed platform markup, not a claim that every SAP site or application flow has this shape. SAP's [external career-site/application flow](https://help.sap.com/docs/successfactors-recruiting/recruiting-with-integration-to-position-management-and-employee-central-test-script/access-external-career-site-review-job-postings-and-choose-apply?locale=en-US&version=2211) and [requisition deep-link documentation](https://help.sap.com/docs/successfactors-recruiting/setting-up-and-maintaining-sap-successfactors-recruiting/deep-links-in-recruiting) provide platform context; they do not prove identity for the captured vacancy or equate platform and requisition IDs.

IDs remain bounded strings, including values beyond JavaScript's safe integer range. Multiple identical top/bottom controls are deduplicated; at most eight declared controls are examined. Different job IDs or origins conflict, even when a structured URL agrees elsewhere. Unsupported schemes, credentials, ports, fragments, encoded path ambiguity, queries, duplicate locale parameters and excess controls are held. Explicit hidden/disabled markers, warning contexts and non-application labels cannot qualify.

The adapter never executes JavaScript, follows an application link, submits a form or reads applicant inputs. It uses static declared controls, not computed CSS visibility or evidence that an application can actually be completed. Markup requiring different semantics remains unsupported. The existing 500,000-byte, 20,000-node and depth-100 primary bounds remain; control-label/context traversal has separate fixed bounds.

Controls outside the JobPosting, within its description or in a nested item's scope do not bind it. Canonical alone remains insufficient. All supplied structured URL/item/main-entity/canonical claims must still agree. Existing authority, issuer, title, recruitment reference, original expiry and publisher-date checks remain mandatory.

The new proof is `rmk_apply_action_v1`, retaining canonical URL, opaque platform ID, distinct declared application URLs and control kinds. It is sideband original-verification evidence; `parsePrimaryJobPosting` does not gain a fabricated `url` or `identifier`. The user-facing application destination remains the original vacancy page, not a rewritten control URL or discovery publisher.

## Resolver version and reference separation

Original verification advances to `original_jobposting_v4`. Matched results record whether binding came from a structured URL, canonical plus independently corroborated reference, or the supported action protocol. Refresh rejects old-policy matches and changed/invalid action proof while preserving the existing expiry/deadline checks. The worker's original-aware model cache key incorporates the resolver version. Existing stored spend, source IDs, quotas and historical receipts are not reset or rewritten.

An RMK action ID cannot corroborate a recruitment reference, even when the numeric values happen to match. Known explicitly named RMK/Recruiting Marketing identifier labels are also excluded from the reference fallback. An independently stated original recruitment reference can still agree while a distinct platform identifier coexists. Unknown identifier formats retain the existing contract; no universal cross-platform namespace interpretation is claimed.

Microdata projection and its adapter identifier stay unchanged; the additional binding is inspected separately. Legacy automatic/validation opt-outs are retained. The source's original-verification and optional employer-crawl policies are not broadened, and no publication guard is removed.

## Verification and measured cohort

An authored four-notice batch under one publisher/grant covers two employers with matching scoped actions, a wrong action and a midnight rollover. Only the two matching notices reach private drafts, using four mock extraction/validation calls. The wrong action and date conflict are held before AI. Original destinations, source revision and grant remain unchanged. These are emulator/model-fixture results, not real-provider accuracy or publication qualification.

The saved real cohort yields:

| Outcome | Count |
| --- | --- |
| Discovered and parsed | 10 |
| Precision holds | 5 |
| Source-date holds | 2 |
| Unsupported original email methods | 2 |
| Original deadline conflict | 1 |
| Real extraction / validation / drafts / public records | 0 / 0 / 0 / 0 |

The portal resolution now records `issuer`, `title` and `vacancy_url` checks plus its scoped action proof. Its original `Fri Nov 06 22:00:00 UTC 2026` is retained as `2026-11-06T22:00:00.000Z`, South African local date `2026-11-07`, with the day shift explicit. It is not silently moved to the previous day or relabelled as the publisher date. The two email-method and other cohort holds are unchanged. No native observation is missing during replay; no model calls/budgets are created.

**315 affected tests pass:** 124 transport/document/binding/parser/resolver/policy/coverage/staging cases and 191 emulator onboarding/registry/origin/worker/undated cases. Resolver/binding tests and the complete original-worker file are repeated after the numeric namespace hardening. Contract typechecking, changed-document links and Git whitespace pass. The full catalogue suite is not rerun; the previously reported intermittent suggestion-route failure remains open.

Both staging images build locally, including web compilation/typechecking/page generation. Network-disabled checks as `node` compare the five current adapter/resolver/worker source hashes, verify positive binding without injected fields, reject wrong actions and old/tampered proof, and reject unconfigured activation. Images remain undeployed. Packaging does not establish live database-backed operation or publishing readiness.

## Next work

The missing-binding barrier is resolved for this supported shape. The remaining real portal hold is a genuine policy disagreement between original timestamp and publisher date. It needs evidence-backed reconciliation or review; this sprint does not relax the date rule. A broader freshly acquired mixed cohort is needed to demonstrate positive real original-to-extraction-to-draft behavior.

Original email/intake acquisition/corroboration remains a separate shared delivery gap, as assessed in [the prior sprint](206_SHARED_CAREERS_DELEGATION_2026-10-30.md). Corporate-domain ownership must not become recipient/intake authority. Unattended new-company qualification, reset-aware orchestration, publication-lane qualification and hosting remain open.

Private source inspection, test/build/image logs and replay receipts remain ignored under `.artifacts/groq/vacancy-binding-2026-10-30/`; original bodies remain in the prior private collection. No raw snapshots, provider responses or credentials are committed. Hosting/scheduling remain undeployed, employer crawling optional/off in the launcher and automatic publication disabled.
