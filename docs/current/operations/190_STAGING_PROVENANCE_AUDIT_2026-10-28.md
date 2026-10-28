# Staging provenance audit and snapshot history restoration

28 October 2026 (SAST). A read-only audit of all five staging drafts found identifiable worker bindings, original snapshots and valid citation/source links for each draft. All five review windows had expired. Transnet and UFS had reached their recorded closing dates; CNH and Motus/Kia were undated private-only assessments. ALPLA's recorded closing date is 31 October, but its last assessment expired on 22 October. None of these findings approves current availability or publication.

Four cited snapshots referenced source version 1 without the corresponding immutable history record. A bounded search examined 410 candidate artifact files, parsing 90 that mentioned the relevant source IDs. Matching schema-valid records were found for Transnet, UFS, ALPLA and Motus/Kia. Multiple matches agreed, and every candidate had evidence whose file hash matched a previously frozen baseline. Original shadow mode, employer-crawl settings and source allowances were retained exactly.

## Restoration and verification

The recovery plan copied only those four historical source records into `m0_source_versions`. An emulator trial imported the complete 422-document staging snapshot, proved that an interruption rolled back all proposed writes, and then verified the successful transaction. The same transaction rechecked every existing staging document before creating the four missing versions and one restoration receipt in `m0_staging_checks`.

A separate-process readback verified all 422 prior records unchanged and exactly five additions, bringing staging to 427 documents and six source-version records. Every currently cited snapshot now has its referenced source version. The current source configurations, decisions, expiry times, origin bindings, quotas, grants and immutable migration receipts were untouched. No worker was activated, source fetched, AI called or feed entry published. Hosting remains undeployed.

This was an operational recovery using private scripts and preserved artifacts; application code did not change. Verification used real emulator rollback/success trials and two cloud readbacks. The prior 999-test application result remains applicable; the suite was not rerun for documentation and history-only additions. Private source objects, snapshots, credentials and evaluation material remain outside Git.

## Remaining work

The audit also checked the current decisions against source-version history. Three additional references remain missing: Transnet revision 11, UFS revision 6 and ALPLA revision 14. Their recovery is still pending. The audit did not certify every older job, call or decision revision, so the four restored snapshot versions must not be described as complete historical recovery.

Next reconcile the three current-decision references against preserved evidence, then perform a fresh bounded assessment of a dated notice such as ALPLA if it remains eligible. Closed notices should not be republished, and expired/undated assessments must not be renewed by migration or history restoration. These steps still do not establish application acceptance or production qualification.
