import {DomainError} from '../config.mjs';

const label=text=>text.trim().replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s·•]+/u,'');
const experienceWords=/\b(?:experience|experienced|work|worked|working|employment|employed|years?|months?|exposure|practical)\b/i;
const educationHeading=/^(?:minimum requirements|requirements|qualifications and experience required|minimum qualifications|entry requirements|qualifications|education)\s*:?$/i;
const schoolQualification=/^(?:Matric(?:\/Grade 12)?|Grade 12)(?: (?:certificate|qualification)| with (?:(?:a )?pass(?: rate)? in )?(?:Mathematics|Maths|Physical Science)(?: and (?:Mathematics|Maths|Physical Science))?)?[.]?$/i;
const technicalQualification=/^(?:Minimum\s+)?N[1-6]\s+(?:[A-Za-z][A-Za-z &/-]{0,100} )?(?:studies|certificate|qualification)[.]?$/i;

// Deliberately limited to short school/N-certificate lines. Mixed work evidence,
// unfamiliar qualifications and broad prose remain for semantic validation.
export function qualificationLineKind(line) {
 const text=label(line);
 if(text.length>200||experienceWords.test(text))return null;
 if(schoolQualification.test(text))return 'school';
 if(technicalQualification.test(text))return 'technical';
 return null;
}
export const isSubjectExclusion=line=>/^(?:Mathematics|Mathematical) Literacy(?: is)? not (?:applicable|accepted)[.]?$/i.test(label(line));
export const isEducationOnlyLine=line=>qualificationLineKind(line)!==null||isSubjectExclusion(line);

export const EXPERIENCE_EVIDENCE_INSTRUCTION=`
Experience means actual prior work or an explicit experience rule, not educational qualifications.
educationOnlySpans identifies recognised qualification/subject passages, not work experience.
Do not copy Grade 12, Matric or N-certificate requirements into experience, or invent OR between them.
Read the whole source for actual experience evidence; the hints are not an exhaustive classifier.
If the source states only education and no experience rule, leave experience not_stated/null.`;

export function assertExperienceEvidence(candidate,fact) {
 if(fact?.state!=='stated'||typeof fact.quote!=='string')return;
 const corpus=`${candidate.title}\n${candidate.sourceText}`;
 if(!corpus.includes(fact.quote))return; // The ordinary evidence check rejects this separately.
 const lines=fact.quote.split('\n').map(label).filter(Boolean);
 if(lines.some(line=>qualificationLineKind(line)!==null)&&
    lines.every(line=>isEducationOnlyLine(line)||educationHeading.test(line.replace(/^\d{1,2}[.)]\s+(?=[A-Za-z])/,''))))
  throw new DomainError('AI_EXPERIENCE_EVIDENCE_UNRESOLVED');
}
