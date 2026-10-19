import {locationEvidenceHints} from './location-evidence.mjs';
import {practicalEvidencePolicy} from './practical-evidence.mjs';
import {isPromotionalLine} from './source-lines.mjs';

export const ATTENDANCE_EVIDENCE_INSTRUCTION=`
attendanceEvidencePolicy describes eligible inline Attendance/Work arrangement/Work mode labels only.
no_label never means in_person: Location: Example Campus states a place, so keep attendance not_stated.
unresolved means unsupported/conflicting labels; preserve uncertainty rather than choose a mode.
supportedValue needs its full labelled evidence in the returned location span. Keep all place evidence too.
These hints neither prove all attendance wording absent nor fill or repair a returned fact.`;

/** Advisory source labels, with original numbering and selected programme scope. */
export function attendanceEvidencePolicy(candidate){
 const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n'),excluded=practicalEvidencePolicy(candidate).publisherPreparationSpans;
 const eligible=index=>(!candidate.programmeScope||candidate.programmeScope.includedSpans?.some(([first,last])=>first<=index+1&&index+1<=last))&&
  !excluded.some(([first,last])=>first<=index+1&&index+1<=last)&&!isPromotionalLine(lines[index]);
 const selected=lines.map((line,index)=>eligible(index)?line:''),labels=selected.flatMap((line,index)=>
  /^(?:Attendance|Work arrangement|Work mode)\s*:/i.test(line.trim())?[{span:[index+1,index+1],originalText:line}]:[]);
 const recognised=locationEvidenceHints({title:selected[0],sourceText:selected.slice(1).join('\n')}).filter(h=>h.field==='attendance');
 return {version:'source_attendance_labels_v1',status:!labels.length?'no_label':recognised.length?'supported':'unresolved',labels,
  supportedValue:recognised[0]?.value??null};
}
