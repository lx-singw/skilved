import { createHash } from 'node:crypto';
import { DomainError } from '../config.mjs';
import {RECENTJOBS_ADAPTER,RECENTJOBS_BOUND_DETAIL_ADAPTER,RECENTJOBS_COPIED_DESCRIPTION_ADAPTER} from './recentjobs.mjs';

export const PROGRAMME_PLAN_VERSION = 'recentjobs_programme_plan_v2';
const hash = value => createHash('sha256').update(value).digest('hex');
const fail = code => { throw new DomainError(code); };
const label = text => text.trim().replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '');
const groupHeading = /^([A-Z])[.)]\s+(.+?)\s+PROGRAMME\s*:?$/i;
const intakeHeading = /^\d{1,2}[.)]\s+\S.+$/;
const reference = /^Reference(?: number)?\s*:\s*(.{1,120})$/i;
const documents = /^DOCUMENTS REQUIRED\s*:?$/i;
const merge = spans => spans.sort((a,b) => a[0]-b[0]).reduce((out,span) => {
  const last = out.at(-1);
  if (last && span[0] <= last[1]+1) last[1] = Math.max(last[1],span[1]);
  else out.push([...span]);
  return out;
}, []);

// Deliberately narrow table + numbered sections + two written email subjects.
// Subject identities are not fabricated recruitment reference numbers.
function subjectPlan(candidate,base,lines) {
  const unsupported=reason=>({...base,reason}),names=['Available trades','Important requirements','Why applying is important','Why the two trades matter','How to apply'];
  const sections=lines.flatMap((text,index)=>/^\d+\.\s+/.test(text)?[{text,start:index+1}]:[]);
  if (sections.length!==5 || sections.some((s,i)=>s.text.trim().toLowerCase()!==`${i+1}. ${names[i]}`.toLowerCase())) return unsupported('PROGRAMME_LAYOUT_UNSUPPORTED');
  if (lines.some(line=>reference.test(label(line)))) return unsupported('PROGRAMME_REFERENCE_UNRESOLVED');
  const [available,requirements,benefits,,apply]=sections;
  const subjectsAt=lines.flatMap((text,index)=>/^Use the correct subject line\s*:$/i.test(text.trim())?[index+1]:[]);
  if(subjectsAt.length!==1 || subjectsAt[0]<=apply.start) return unsupported('PROGRAMME_SUBJECT_SCOPE_UNRESOLVED');
  const subjectHeading=subjectsAt[0],subjectRows=lines.slice(subjectHeading,subjectHeading+2).map((text,index)=>{
    const match=/^([A-Za-z][A-Za-z -]{1,79}?)\s+[—–-]\s+if applying for\s+([A-Za-z][A-Za-z -]{1,79})$/i.exec(text);
    return match&&match[1].trim().toLowerCase()===match[2].trim().toLowerCase()
      ? {value:match[1].trim(),originalText:text,span:[subjectHeading+index+1,subjectHeading+index+1]} : null;
  });
  if(subjectRows.some(s=>!s) || new Set(subjectRows.map(s=>s.value.toLowerCase())).size!==2 ||
      !/^Closing date\s*:?$/i.test(lines[subjectHeading+2]??'')) return unsupported('PROGRAMME_SUBJECT_SCOPE_UNRESOLVED');
  if(lines[available.start]!=='Trade' || lines[available.start+1]!=='What you will learn/do') return unsupported('PROGRAMME_LAYOUT_UNSUPPORTED');
  const trades=subjectRows.map(subject=>{
    const found=lines.flatMap((text,index)=>index+1>available.start+2&&index+1<requirements.start&&text.trim().toLowerCase()===subject.value.toLowerCase()?[index+1]:[]);
    return found.length===1?{subject,start:found[0]}:null;
  });
  if(trades.some(t=>!t)) return unsupported('PROGRAMME_SUBJECT_SCOPE_UNRESOLVED');
  trades.sort((a,b)=>a.start-b.start);
  if(trades[0].start!==available.start+3 || trades.some((t,i)=>(trades[i+1]?.start??requirements.start)!==t.start+2)) return unsupported('PROGRAMME_LAYOUT_UNSUPPORTED');
  if(candidate.applicationCandidates.length!==1 || candidate.applicationCandidates[0].method!=='email') return unsupported('PROGRAMME_APPLICATION_SCOPE_UNRESOLVED');
  const route=candidate.applicationCandidates[0],written=lines.slice(apply.start-1,apply.start+2).join('\n');
  if(route.originalText!==written || !written.includes(route.destination) || lines[apply.start+2]!=='Attach:') return unsupported('PROGRAMME_APPLICATION_SCOPE_UNRESOLVED');
  const documentsStart=apply.start+4;
  if(documentsStart>=subjectHeading) return unsupported('PROGRAMME_SHARED_SCOPE_UNSUPPORTED');
  const requirementSpans=lines.flatMap((text,index)=>index+1>requirements.start&&index+1<benefits.start&&
    !/^(?:Location\s*:|The opportunity is .*based\.)/i.test(text)?[[index+1,index+1]]:[]);
  const documentSpans=Array.from({length:subjectHeading-documentsStart},(_,index)=>[documentsStart+index,documentsStart+index]);
  const uncertaintySpans=requirementSpans.filter(([line])=>/\b(?:doesn['’]t specify|not specified|unspecified)\b/i.test(lines[line-1])&&/\b(?:subjects?|qualifications?)\b/i.test(lines[line-1]));
  const sharedSpans=[[1,available.start-1],[requirements.start,benefits.start-1],[apply.start,subjectHeading],[subjectHeading+3,lines.length]];
  const intakes=trades.map((trade,index)=>{
    const end=(trades[index+1]?.start??requirements.start)-1;
    return {id:hash(`${candidate.sourceRecordId}:subject:${trade.subject.value.toLowerCase()}`),state:'review_required',identityKind:'application_subject',reference:null,
      heading:{originalText:lines[trade.start-1],span:[trade.start,trade.start]},subject:trade.subject,
      application:{...route,index:0,span:[apply.start,apply.start+2]},programmeSpan:[trade.start,end],
      includedSpans:merge([...sharedSpans,[trade.start,end],trade.subject.span]),mandatoryRequirementSpans:[...requirementSpans,...documentSpans],
      uncertaintySpans,sharedScopeReviewRequired:true};
  });
  return {...base,state:'review_required',reason:'PROGRAMME_SCOPE_REVIEW_REQUIRED',layout:'shared_email_subjects',sharedSpans,intakes};
}
/** Private source-bound planning only. No record creation, eligibility decisions or fetching. */
export function planRecentJobsProgrammes(candidate) {
  if (![RECENTJOBS_ADAPTER,RECENTJOBS_BOUND_DETAIL_ADAPTER,RECENTJOBS_COPIED_DESCRIPTION_ADAPTER].includes(candidate?.adapter) || typeof candidate.title !== 'string' ||
      typeof candidate.sourceText !== 'string' || !candidate.title || !candidate.sourceText || candidate.title.length > 500 || candidate.sourceText.length > 20_000 ||
      typeof candidate.sourceUrl !== 'string' || !/^https:\/\/recentjobs\.co\.za\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+\/$/i.test(candidate.sourceUrl) ||
      candidate.sourceRecordId !== hash(candidate.sourceUrl) || !/^[a-f0-9]{64}$/.test(candidate.contentHash ?? '') ||
      !Array.isArray(candidate.applicationCandidates) || candidate.applicationCandidates.length > 20 ||
      candidate.applicationCandidates.some(r => !r || !['email','portal'].includes(r.method) || typeof r.destination !== 'string' ||
        !r.destination || r.destination.length > 2048 || typeof r.originalText !== 'string' || !r.originalText || r.originalText.length > 4000)) fail('PROGRAMME_INPUT_INVALID');
  const lines = `${candidate.title}\n${candidate.sourceText}`.split('\n');
  const sourceSha256 = hash(JSON.stringify({title:candidate.title,sourceText:candidate.sourceText,
    sourceUrl:candidate.sourceUrl,sourceRecordId:candidate.sourceRecordId,applicationCandidates:candidate.applicationCandidates}));
  const base = {version:PROGRAMME_PLAN_VERSION,qualification:false,state:'unsupported',
    source:{url:candidate.sourceUrl,recordId:candidate.sourceRecordId,contentHash:candidate.contentHash,sourceSha256,lineCount:lines.length},
    intakes:[]};
  const unsupported = reason => ({...base,reason});
  if (lines.some(line=>/^Use the correct subject line\s*:$/i.test(line.trim()))) return subjectPlan(candidate,base,lines);
  const groups = lines.flatMap((line,index) => {
    const match = groupHeading.exec(label(line));
    return match ? [{start:index+1,kind:/^APPRENTICESHIP$/i.test(match[2])?'apprenticeship':'other',originalText:line}] : [];
  });
  if (!groups.length || !groups.some(g => g.kind === 'apprenticeship')) return unsupported('PROGRAMME_LAYOUT_UNSUPPORTED');
  const tails = lines.flatMap((line,index) => documents.test(label(line)) ? [index+1] : []);
  if (tails.length !== 1 || tails[0] <= groups.at(-1).start) return unsupported('PROGRAMME_SHARED_SCOPE_UNSUPPORTED');
  const tail = tails[0], sharedSpans = [[1,groups[0].start-1],[tail,lines.length]], intakes = [];
  const seenReferences = new Set(), assignedRoutes = new Set();
  for (let index=0;index<groups.length;index++) {
    const group = groups[index], until = groups[index+1]?.start ?? tail;
    if (group.kind !== 'apprenticeship') continue;
    const starts = [];
    for (let at=group.start;at<until;at++) if (intakeHeading.test(label(lines[at-1]))) {
      const ref = reference.exec(label(lines[at] ?? ''));
      if (!ref || at+1 >= until) return unsupported('PROGRAMME_REFERENCE_UNRESOLVED');
      starts.push({start:at,referenceLine:at+1,value:ref[1].trim()});
    }
    if (!starts.length) return unsupported('PROGRAMME_LAYOUT_UNSUPPORTED');
    for (let block=0;block<starts.length;block++) {
      const entry = starts[block], end = (starts[block+1]?.start ?? until)-1;
      if (lines.slice(entry.start-1,end).filter(line => reference.test(label(line))).length !== 1)
        return unsupported('PROGRAMME_REFERENCE_UNRESOLVED');
      const key = entry.value.toLowerCase();
      if (seenReferences.has(key)) return unsupported('PROGRAMME_REFERENCE_CONFLICT');
      seenReferences.add(key);
      // A repeated generic anchor label cannot locate a destination. Only exact,
      // explicitly written email instructions are currently scopeable.
      const routes = candidate.applicationCandidates.flatMap((route,routeIndex) => {
        if (route.method !== 'email' || typeof route.originalText !== 'string' || !route.originalText.includes(route.destination)) return [];
        const occurrences = lines.flatMap((line,at) => line === route.originalText ? [at+1] : []);
        return occurrences.length === 1 && occurrences[0] >= entry.start && occurrences[0] <= end
          ? [{...route,index:routeIndex,span:[occurrences[0],occurrences[0]]}] : [];
      });
      if (routes.length !== 1 || assignedRoutes.has(routes[0].index)) return unsupported('PROGRAMME_APPLICATION_SCOPE_UNRESOLVED');
      assignedRoutes.add(routes[0].index);
      const includedSpans = merge([...sharedSpans,[group.start,starts[0].start-1],[entry.start,end]]);
      intakes.push({id:hash(`${candidate.sourceRecordId}:${key}`),state:'review_required',
        heading:{originalText:lines[entry.start-1],span:[entry.start,entry.start]},
        reference:{value:entry.value,originalText:lines[entry.referenceLine-1],span:[entry.referenceLine,entry.referenceLine]},
        application:routes[0],programmeSpan:[entry.start,end],includedSpans,
        // All shared wording stays source-owned, including conditional WIL documents.
        sharedScopeReviewRequired:true});
    }
  }
  if (intakes.length < 2 || intakes.length > 20) return unsupported('PROGRAMME_COUNT_UNSUPPORTED');
  if (assignedRoutes.size !== candidate.applicationCandidates.length) return unsupported('PROGRAMME_APPLICATION_SCOPE_UNRESOLVED');
  return {...base,state:'review_required',reason:'PROGRAMME_SCOPE_REVIEW_REQUIRED',sharedSpans,intakes};
}

export function programmePassage(candidate, intakeId, span) {
  const plan = planRecentJobsProgrammes(candidate), intake = plan.intakes.find(i => i.id === intakeId);
  if (!intake || !Array.isArray(span) || span.length !== 2 || !span.every(Number.isInteger) || span[0] < 1 || span[1] < span[0] ||
      !intake.includedSpans.some(([first,last]) => first <= span[0] && span[1] <= last)) fail('PROGRAMME_EVIDENCE_OUTSIDE_SCOPE');
  return `${candidate.title}\n${candidate.sourceText}`.split('\n').slice(span[0]-1,span[1]).join('\n');
}

export function programmeReviewPayload(candidate, intakeId) {
  const plan = planRecentJobsProgrammes(candidate), intake = plan.intakes.find(i => i.id === intakeId);
  if (!intake) fail('PROGRAMME_SCOPE_UNSUPPORTED');
  // Keep original numbering and all context. Never concatenate distant source
  // ranges into a document that could manufacture a contiguous evidence quote.
  return {version:plan.version,qualification:false,source:plan.source,intake,
    sourceLines:`${candidate.title}\n${candidate.sourceText}`.split('\n').map((text,index) => ({line:index+1,text}))};
}
