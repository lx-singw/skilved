import {requirementLayout} from './requirement-layout.mjs';
import {requirementEvidence} from './requirement-evidence.mjs';
import {requirementContext} from './requirement-context.mjs';
import {wholeSourcePayloadFromContext,wholeSourceLineCount} from './whole-source.mjs';
import {requirementReviewPolicyWithEvidence} from './requirement-review-policy.mjs';

export const BOUNDED_REVIEW_POLICY_VERSION='entry_applicability_v2';
const label=text=>text.trim().replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s·•*-]+/u,'');
// Exact section headings only. Prose mentioning dates or duties is still evidence.
const metadata=/^(?:general instructions|key responsibilities|duties\s*(?:&|and)\s*responsibilities|package\s*(?:&|and)\s*remuneration|enquiries)\s*:?$/i;
const timing=/^(?:commencement date|start date|duration(?: of (?:program(?:me)?|apprenticeship))?|working hours)(?:\s*:\s*.*)?$/i;
export const isReviewSectionBoundary=text=>metadata.test(label(text))||timing.test(label(text));

// Opt-in policy: recompute source constraints rather than deleting selected
// lines from an old payload or using model output/evaluation expectations.
export function boundedReviewEvidence(candidate) {
  const source={title:candidate?.title,sourceText:candidate?.sourceText,applicationCandidates:[]};
  wholeSourceLineCount(source);
  const layout=requirementLayout(source,{sectionEnd:isReviewSectionBoundary});
  const evidence=requirementEvidence(source,layout,isReviewSectionBoundary);
  const context=requirementContext(source,evidence,isReviewSectionBoundary);
  return requirementReviewPolicyWithEvidence(source,wholeSourcePayloadFromContext(source,context),
    BOUNDED_REVIEW_POLICY_VERSION,isReviewSectionBoundary);
}
