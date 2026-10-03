import { createHash } from 'node:crypto';
import { DomainError } from '../config.mjs';

export const PROGRAMME_PLAN_VERSION = 'recentjobs_programme_plan_v1';
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

/** Private source-bound planning only. No record creation, eligibility decisions or fetching. */
export function planRecentJobsProgrammes(candidate) {
  if (candidate?.adapter !== 'recentjobs_html_v1' || typeof candidate.title !== 'string' ||
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
