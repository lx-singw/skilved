# Application-layout parser connected to the worker

5 November 2026. The prepared integration from operation 228 is now applied to the shared worker and Source schema, following the completed overnight task and the reviewed fast-source API work. No source configuration, worker grant, model allowance or hosting/publication state is changed.

## Behaviour

`RecentJobsWorker` now uses `parseWorkerDetail()`. Without a source's explicit `automation.applicationLayouts: "shadow_v1"`, parsing and stored source-hold fields retain the legacy behaviour. Opt-in is schema-restricted to shadow RecentJobs sources. The shared adapter can retain labelled application-email/subject instructions and bounded notice-footer application links, while excluding adjacent social invitations.

Source holds record the adapter profile when opted in. A legacy hold cannot suppress a newly opted-in parser evaluation, and an opt-in hold cannot be reused after disabling that profile. The new profile does not reset actual calls or quotas. Unchanged valid model inputs reuse their real caches; changed routes/content use separate bindings. Employer/method authority, deadline, independent validation and private/public writer checks remain in force. Recovering a route does not qualify it as a safe original application method or approve publication.

The fast worker inherits the shared detail-processing boundary. Its separate single-notice leases, quota reservations, history fences and explicit shadow-only publication prohibition remain unchanged. No source is opted in live, and the local applicant viewer remains its separately protected pilot snapshot.

## Verification and preparation tool

The eight existing prepared-integration acceptance cases now run against the installed normal worker and Source schema. They cover labelled email and footer routes, private drafting, real cache reuse after worker recreation, changed-content separation, unqualified/missing-date holds, opt-in transitions and budget preservation. Parser/Source checks also reject unsupported modes and structured-json use of this setting.

The old preparation CLI recognizes a complete installed integration and returns an applied/readiness manifest without modifying files or generating another patch. Partial/duplicated installed anchors fail closed. Historical unapplied input still uses the review-only preparation path; the active command does not enable source policy or call a provider.

All 198 affected emulator checks pass, including the eight installed-parser acceptance cases, the worker regressions, fast bridge/runtime and reviewed source-adoption cases. All 17 final parser/readiness checks pass. The actual preparation CLI verifies the installed integration with identical before/after file hashes and no new patch; whitespace checks pass. Private logs remain under `.artifacts/application-layout-active-*`. All responses in worker acceptance tests are authored and all database writes use demo emulators. No fresh real model success, real mixed-batch acceptance, source cutover or automatic publishing is claimed.

## Next delivery

Source-role authority is still absent in staging. A temporary Source-role request is pending; the current account remains reviewer-only and no access expansion is assumed. Controlled live policy/history cutover must use operation 238's reviewed API. Fast revision/job reconciliation, historical refresh/fairness, durable restart identity and real V32 batch/publication qualification remain ahead. Hosting/publication stay off.
