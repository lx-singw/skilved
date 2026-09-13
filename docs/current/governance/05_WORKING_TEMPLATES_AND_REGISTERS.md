# Working templates and register instructions

Date: 11 September 2026. Status: reusable operational templates. Create actual records only when the underlying activity occurs; blank templates are not evidence.

## Decision record

ID/title; date; status (recommended/accepted/superseded); accountable person; problem; evidence and uncertainty; options; chosen direction; consequences; cost/time/data effects; implementation links; revisit trigger. For an architecture decision, add compatibility, migration and recovery implications. Record later supersession without rewriting the historical rationale.

## Requirement/change request

Request ID; user/context; concrete problem; linked PRD/work package; proposed result; acceptance; dependencies; affected contracts/design/security; estimate and capacity effect; priority rationale; decision; release; evidence. Distinguish a defect in an agreed capability from a new feature or changed commercial scope.

## Research record

Study ID; decision to inform; participant/segment criteria; consent and retention process; task/protocol; sample limitations; observations; interpretation; contradictory evidence; decision; next experiment. Store participant identifiers and raw recordings privately under the adopted schedule. Public summaries use appropriately de-identified evidence.

## Source register row

Source ID; issuer/aggregator role; exact URL/host; categories; access method; rights/terms/robots review date; permission evidence if needed; extraction version; rate/refresh policy; expected critical fields; reviewer; last successful check; failure/contact path; publication status; removal/exit action. A row with unknown permission is not automatically approved for automated reuse.

## Agent mandate/receipt review

Mandate: owner, purpose, resources, action classes, destinations, trigger, validity, limits, revocation and current authorisation. Receipt: task/attempt, input versions, tool/model configuration, action, result, evidence, next state, external receipt/uncertainty and user-visible explanation. Never place secret tokens or full private documents into a publicly committed receipt example.

## Customer order and acceptance record

Actual parties; authorised contacts; deliverables; limits; intake requirements and authority; schedule trigger; price/currency/tax treatment; payment; acceptance criteria; included revisions; scope-change method; support; cancellation/disputes; data/IP responsibilities; agreement evidence. Acceptance records output version, checks, exceptions and buyer decision. Use legally appropriate reviewed terms for the actual engagement.

## Vendor review row

Provider/service/tier; purpose; data categories; owner; regions/transfers; retention/training settings; security/access; contract version; recurring/variable price; credit expiry; cancellation/export; incident route; risk tier; decision; renewal review. Do not store credentials in the row.

## Release record

Release ID; commit/artefact/configuration; included work packages/PRD; environments; migrations; test evidence; security/design review; source coverage; operational owner; monitoring; backup/restore evidence; known limitations; rollout/rollback; decision; actual observations after release. A documentation-only release record must say application checks were not run.

## Incident and corrective-action record

Incident ID/severity; commander; detection and timeline; facts/unknowns; affected assets/users; containment; evidence location; notification assessment; recovery; communication; root cause; corrective action owner/date; regression test; closure. Restrict raw incident evidence and publish only a suitable sanitised summary.

## Monthly operating review

Period; available capacity; delivered user outcomes; cohort/sample counts; source/service quality; support/review time; actual cash/commitments; customer evidence; risks/incidents; upcoming obligations; scope decisions; next review. Record “not measured” where appropriate and distinguish cash received from forecast revenue.

## Document control

Each policy/specification has title, date, status, accountable role, scope, related authority, evidence and revisit trigger. Store adopted legal/corporate records and signatures in a restricted system, with a sanitised reference if needed. Review product/technical docs on relevant changes; review operating policy at least at major release gates and after incidents. A comprehensive set stays useful through maintenance, not through accumulating unused pages.
