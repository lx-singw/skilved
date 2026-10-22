import { DomainError } from '../config.mjs';

export const LOCATION_EVIDENCE_INSTRUCTION = `
Location values need evidence in their own selected span. Check every non-null city/province/country.
If city and province occur on separate lines, cite one inclusive span covering both. A province
elsewhere does not support a city-only span. Retain stated places and their complete evidence.
Never infer province from city or country from province. Copy stated place names only.
Coverage is not a consequence of a work location; attendance is not a consequence of an apprenticeship.
Only state attendance from an explicit Attendance, Work arrangement, Work mode or Working mode label with
in person/on site/fully on-site, remote or hybrid as its sole value. Cite the entire labelled line
inside the location span along with every stated place. Only state coverage from an explicit
Coverage, Geographical coverage, Recruitment coverage or Recruitment scope label with
local, national/nationwide or international as its sole value. Locations: All provinces (including
a two-line Locations/All provinces table) explicitly supports national coverage without inventing a country.
locationEvidenceHints supplies only recognised labelled spans, never geographical knowledge.
When using a hint, cite its ENTIRE span, including the label: All provinces alone does not support coverage.
Otherwise leave these not_stated.
Relocation must copy a complete source line explicitly about relocation/relocating, verbatim;
otherwise leave relocation null. Do not guess or paraphrase these missing details.`;

const normalise = text => text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const contains = (quote,text) => (` ${normalise(quote)} `).includes(` ${normalise(text)} `);
const fail = () => { throw new DomainError('AI_LOCATION_EVIDENCE_UNRESOLVED'); };
// Deliberately narrow affirmative labels. A city, local-residence rule, duty,
// alternative, negation or a remote-control skill does not establish these facts.
export const attendanceLabel = /^(?:Attendance|Work arrangement|Work mode|Working mode)\s*:/i;
const attendancePattern = /^(?:Attendance|Work arrangement|Work mode|Working mode)\s*:\s*(in[- ]person|(?:fully )?on[- ]site|remote|hybrid)\s*[.]?$/i;
const attendanceValue = value => ['in person','on site','fully on site'].includes(normalise(value)) ? 'in_person' : normalise(value);
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
  const modes=labelled(lines,attendancePattern,attendanceLabel,attendanceValue);
  if(attendance!=='not_stated' && (modes.size!==1 || !modes.has(attendance))) fail();
  const scopes=labelled(lines,coveragePattern,/^(?:Coverage|Geographical coverage|Recruitment coverage|Recruitment scope)\s*:/i,v=>v==='nationwide'?'national':v);
  if(lines.some((line,index)=>/^Locations?\s*:\s*All provinces[.]?$/i.test(line.trim()) ||
     /^Locations?\s*:?[ \t]*$/i.test(line.trim()) && /^All provinces[.]?$/i.test(lines[index+1]?.trim()??''))) scopes.add('national');
  if(coverage!=='not_stated' && (scopes.size!==1 || !scopes.has(coverage))) fail();
  if(relocation && !lines.some(line=>line.trim()===relocation && /\brelocat(?:ion|e|ing)\b/i.test(line))) fail();
}

/** Source-local hints only; the model still returns its own checked facts. */
export function locationEvidenceHints(candidate) {
  const lines=`${candidate.title}\n${candidate.sourceText}`.split('\n'),coverage=[],attendance=[];
  for(const [index,line] of lines.entries()) {
    const text=line.trim(),mode=text.match(attendancePattern),scope=text.match(coveragePattern);
    if(mode)attendance.push({field:'attendance',span:[index+1,index+1],value:attendanceValue(mode[1])});
    else if(attendanceLabel.test(text))attendance.push(null);
    if(scope)coverage.push({field:'coverage',span:[index+1,index+1],value:normalise(scope[1])==='nationwide'?'national':normalise(scope[1])});
    else if(/^(?:Coverage|Geographical coverage|Recruitment coverage|Recruitment scope)\s*:/i.test(text))coverage.push(null);
    if(/^Locations?\s*:\s*All provinces[.]?$/i.test(text))coverage.push({field:'coverage',span:[index+1,index+1],value:'national'});
    else if(/^Locations?\s*:?[ \t]*$/i.test(text)&&/^All provinces[.]?$/i.test(lines[index+1]?.trim()??''))coverage.push({field:'coverage',span:[index+1,index+2],value:'national'});
  }
  // Any unsupported or conflicting label suppresses the corresponding hint.
  return [coverage,attendance].flatMap(rows=>rows.some(row=>row===null)||new Set(rows.map(row=>row.value)).size!==1?[]:rows);
}
