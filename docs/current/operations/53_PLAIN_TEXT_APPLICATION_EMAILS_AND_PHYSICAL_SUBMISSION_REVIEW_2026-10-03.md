# Plain-text application emails and physical submission review — 3 October 2026

RecentJobs discovery now recognises explicitly labelled application emails in article text, alongside existing application anchors. The original recipient and complete source line become a pending candidate; AI still selects a supplied candidate rather than generating a destination. A synthetic worker test reaches a private draft through extraction, validation and issuer checks with an original plain-text email. **All 373 catalogue tests pass. Production scheduling and publication remain disabled; employer crawling stays optional.**

## Application method boundaries

Discovery requires application wording and a recipient label in the same source line. Addresses for enquiries, form requests and references are excluded, along with negative submission instructions, malformed recipients and emails embedded in HTTP URLs. Bare emails and context spanning separate lines remain unresolved. Discovery neither probes a mailbox nor sends mail. Email destinations still require an exact registered issuer address before model work, followed by the existing issuer, evidence, deadline and semantic gates.

Existing anchors keep their order and evidence when a plain-text email duplicates one. Distinct programme recipients remain distinct candidates. The single-record worker holds multiple routes before model work; it does not choose the first trade, merge programmes, or infer which address belongs to an unlabelled programme. The existing 20-candidate limit applies to both discovery paths.

Positive hand-delivery, courier and postal application instructions are retained verbatim in optional `applicationInstructions`, with pending method findings. Courier remains a distinct finding rather than being reclassified as post. A recruitment "post title" is not a postal submission method. Negative physical-submission wording does not create a positive method. Physical findings stop the worker with `NOTICE_APPLICATION_METHOD_REVIEW_REQUIRED` at preflight and publication gates, even beside a qualified portal candidate. No canonical physical destination is approved by this change.

The optional field is absent on notices without physical findings. Candidate content hashes include actual discovered recipients/instructions; ALPLA and West Coast Personnel remain unchanged in the private replay. No provider instructions, extraction wire contracts or public schemas change.

## Private replay and verification

Four private source snapshots collected on 3 October are replayed locally; there are **zero new source requests, zero model calls and zero public records**. This is a deterministic parser review, not another live Gemini trial or independent human qualification.

| Snapshot | Result |
| --- | --- |
| MISA | Five explicitly labelled apprenticeship application emails retained. The form-request email and three unlabelled experiential addresses are excluded. Multiple destinations remain held with `NOTICE_PRECISION_UNSUPPORTED`; the source deadline is also past. |
| EWC | One exact hand-delivery/courier instruction retained. Enquiry email excluded. Held with `NOTICE_APPLICATION_METHOD_REVIEW_REQUIRED`; its date is also past and still unsupported by the date parser. |
| ALPLA | Existing original ATS candidate and content hash unchanged. No new draft or model call in this replay. |
| West Coast Personnel | Existing portal candidate and content hash unchanged. Missing closing date remains held. |

Nine new tests cover explicit and excluded email contexts, separate programmes, anchor deduplication, physical wording, bounded discovery, a private plain-text-email worker draft, multiple qualified email destinations stopping before AI, and physical alternatives stopping before AI/destination retrieval. All 373 catalogue tests pass in the isolated Auth/Firestore emulators, which shut down cleanly. Private replay reports, source snapshots and test logs remain under ignored `.artifacts/`.

Next, programme splitting needs an explicit source-to-intake boundary and review of the requirements and application address for each programme. Physical submission needs an approved destination/instruction policy before automatic publication. More open notices still need review; these expired, familiar snapshots do not establish production accuracy or availability. Gemini workers remain restricted to shadow mode.
