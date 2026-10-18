import {DomainError} from '../config.mjs';

const label=text=>text.trim().replace(/^(?:[-*•·]\s+|\d{1,2}[.)]\s+)/,'');
const heading=/^(?:minimum requirements|requirements|eligibility|citizenship|nationality)\s*:?$/i;
const citizenshipOnly=[
 /^(?:(?:(?:you|applicants?|candidates?) (?:must|should) be|(?:must|should) be|be) )?(?:a )?South African citizens?\.?$/i,
 /^South African citizenship(?: (?:is )?(?:required|essential|mandatory))?\.?$/i,
 /^(?:Citizenship|Nationality)\s*:\s*South African\.?$/i,
 /^Only South African citizens may apply\.?$/i,
 /^(?:Applicants?|Candidates?) must hold South African citizenship\.?$/i,
];

export const RESIDENCE_EVIDENCE_INSTRUCTION=`
Residence is where applicants live, not citizenship, nationality or permanent-resident status alone.
Retain citizenship requirements and their strength/logic; never copy them into residence.
Without an explicit residence rule use not_stated (compact: null).
Preserve actual residence rules and mixed clauses with exact evidence; infer no place from nationality.`;

// Reject only recognised citizenship-only evidence, not arbitrary mentions of
// citizenship. Mixed residence rules and unfamiliar wording need semantic review.
export function assertResidenceEvidence(candidate,fact) {
 if(fact?.state!=='stated'||typeof fact.quote!=='string')return;
 if(!`${candidate.title}\n${candidate.sourceText}`.includes(fact.quote))return;
 const lines=fact.quote.split('\n').map(label).filter(Boolean);
 const citizenship=line=>citizenshipOnly.some(pattern=>pattern.test(line));
 if(lines.some(citizenship)&&lines.every(line=>citizenship(line)||heading.test(line)))
  throw new DomainError('AI_RESIDENCE_EVIDENCE_UNRESOLVED');
}
