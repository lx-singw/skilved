import { DomainError } from '../config.mjs';

export const LOCATION_EVIDENCE_INSTRUCTION = `
Location values need evidence in the selected location span, not geographical knowledge.
Never infer a province from a city, or a country from a province. Copy stated place names only.
Coverage is not a consequence of a work location; attendance is not a consequence of an apprenticeship.
Only state attendance from an explicit Attendance, Work arrangement or Work mode label with
in person/on site, remote or hybrid as its sole value. Only state coverage from an explicit
Coverage, Geographical coverage, Recruitment coverage or Recruitment scope label with
local, national/nationwide or international as its sole value. Locations: All provinces (including
a two-line Locations/All provinces table) explicitly supports national coverage without inventing a country.
Otherwise leave these not_stated.
Relocation must copy a complete source line explicitly about relocation/relocating, verbatim;
otherwise leave relocation null. Do not guess or paraphrase these missing details.`;

const normalise = text => text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const contains = (quote,text) => (` ${normalise(quote)} `).includes(` ${normalise(text)} `);
const fail = () => { throw new DomainError('AI_LOCATION_EVIDENCE_UNRESOLVED'); };
// Deliberately narrow affirmative labels. A city, local-residence rule, duty,
// alternative, negation or a remote-control skill does not establish these facts.
const attendancePattern = /^(?:Attendance|Work arrangement|Work mode)\s*:\s*(in[- ]person|on[- ]site|remote|hybrid)\s*[.]?$/i;
const coveragePattern = /^(?:Coverage|Geographical coverage|Recruitment coverage|Recruitment scope)\s*:\s*(local|national|nationwide|international)\s*[.]?$/i;
const labelled = (lines,pattern,label,canonical) => new Set(lines.flatMap(line=>{
  const match=line.trim().match(pattern);return match?[canonical(normalise(match[1]))]:label.test(line.trim())?[null]:[];
}));

/** A conservative source check, not independent location/employer verification. */
export function assertLocationEvidence(fact) {
  if (fact.state !== 'stated') return;
  const {places,coverage,attendance,relocation}=fact.value,quote=fact.quote,lines=quote.split('\n');
  for (const place of places) {
    if(place.city && !contains(quote,place.city)) fail();
    if(place.province && !contains(quote,place.province)) fail();
    if(place.country && !(contains(quote,place.country) || place.country==='ZA'&&contains(quote,'South Africa'))) fail();
  }
  const modes=labelled(lines,attendancePattern,/^(?:Attendance|Work arrangement|Work mode)\s*:/i,v=>['in person','on site'].includes(v)?'in_person':v);
  if(attendance!=='not_stated' && (modes.size!==1 || !modes.has(attendance))) fail();
  const scopes=labelled(lines,coveragePattern,/^(?:Coverage|Geographical coverage|Recruitment coverage|Recruitment scope)\s*:/i,v=>v==='nationwide'?'national':v);
  if(lines.some((line,index)=>/^Locations?\s*:\s*All provinces[.]?$/i.test(line.trim()) ||
     /^Locations?\s*:?[ \t]*$/i.test(line.trim()) && /^All provinces[.]?$/i.test(lines[index+1]?.trim()??''))) scopes.add('national');
  if(coverage!=='not_stated' && (scopes.size!==1 || !scopes.has(coverage))) fail();
  if(relocation && !lines.some(line=>line.trim()===relocation && /\brelocat(?:ion|e|ing)\b/i.test(line))) fail();
}
