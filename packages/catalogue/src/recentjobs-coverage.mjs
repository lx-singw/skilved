import {createHash} from 'node:crypto';
import {parse} from 'parse5';
import {z} from 'zod';
import {InstantSchema} from '@skilved/types/opportunities';
import {parseRecentJobsList,parseRecentJobsDetail} from './adapters/recentjobs.mjs';
import {inspectPrimaryJobPosting} from './adapters/primary-jobposting.mjs';
import {RECENTJOBS_INDEX,dayInSA,preflightCandidate} from './worker-policy.mjs';
import {issuerHint,probeUrl} from './origin-discovery.mjs';

export const COVERAGE_VERSION='recentjobs_native_coverage_v2';
const digest=text=>createHash('sha256').update(text).digest('hex');
export const CoverageObservation=z.object({url:z.string().url().max(2048),html:z.string().optional(),error:z.string().regex(/^[A-Z][A-Z_]{0,79}$/).optional()})
 .strict().refine(o=>(o.html!==undefined)!==(o.error!==undefined),'One body or error required');
const Input=z.object({observedAt:InstantSchema,limit:z.number().int().min(1).max(10).default(10),
 listing:z.object({url:z.literal(RECENTJOBS_INDEX),html:z.string()}).strict(),
 notices:z.array(CoverageObservation).max(10),portals:z.array(CoverageObservation).max(10)}).strict();

/** Format diagnostics only. Parsing never qualifies employer authority or publication. */
export function primaryFormatDiagnostic(html){
 if(typeof html!=='string'||Buffer.byteLength(html)>500000)return{kind:'unsupported',reason:'PRIMARY_BODY_LIMIT',microdataRoots:0,propertyMarkers:[]};
 const roots=new Set(),properties=new Set(),stack=[[parse(html),0,null]];let count=0;
 while(stack.length){const[n,depth,scope]=stack.pop();if(++count>20000||depth>100)return{kind:'unsupported',reason:'PRIMARY_TREE_LIMIT',microdataRoots:0,propertyMarkers:[]};
  const attr=key=>n.attrs?.find(a=>a.name===key)?.value;
  if(roots.has(scope))for(const p of(attr('itemprop')??'').split(/\s+/))if(/^[A-Za-z][A-Za-z0-9]{0,79}$/.test(p))properties.add(p);
  const ownScope=n.attrs?.some(a=>a.name==='itemscope');
  if(ownScope&&(attr('itemtype')??'').split(/\s+/).some(t=>['http://schema.org/JobPosting','https://schema.org/JobPosting'].includes(t)))roots.add(n);
  for(const child of(n.childNodes??[]).slice().reverse())stack.push([child,depth+1,ownScope?n:scope]);
 }
 const base={microdataRoots:roots.size,propertyMarkers:[...properties].sort()};
 try{const p=inspectPrimaryJobPosting(html);return{kind:p.adapter==='jobposting_microdata_v1'?'microdata_jobposting':'jsonld_jobposting',supported:true,reason:null,...base};}catch(e){if(e.code!=='PRIMARY_NOTICE_UNSUPPORTED')throw e;}
 return{kind:roots.size===1?'microdata_jobposting':roots.size>1?'multiple_microdata_postings':'unsupported',
  supported:false,reason:roots.size===1?'MICRODATA_SUBSET_UNSUPPORTED':roots.size>1?'MULTIPLE_POSTINGS':'PRIMARY_NOTICE_UNSUPPORTED',...base};
}
function mapObservations(rows){const map=new Map();for(const row of rows){if(map.has(row.url))throw Error('COVERAGE_DUPLICATE_OBSERVATION');
 if(row.html!==undefined&&Buffer.byteLength(row.html)>500000)throw Error('COVERAGE_BODY_LIMIT');map.set(row.url,row);}return map;}
function sourceHold(candidate,code,now){
 if(code==='NOTICE_NOT_OPEN')return candidate.deadlineCandidates.some(d=>d.localDate<dayInSA(now))?'publisher_deadline_elapsed':'publisher_closing_day_hold';
 if(code==='NOTICE_PRECISION_UNSUPPORTED'){
  if(!candidate.applicationCandidates.length)return'application_route_missing';
  if(candidate.applicationCandidates.length>1)return'multiple_application_routes';
  if(!candidate.deadlineCandidates.length)return'deadline_absent';
  if(candidate.deadlineCandidates.some(d=>!d.localDate))return'deadline_unresolved';
 }
 return code;
}
/** Reproducible native format coverage from saved observations, with a fixed ordered denominator.
 * No network, models, authority qualification, database writes or publication.
 */
export function buildRecentJobsCoverage(raw){
 const input=Input.parse(raw),list=parseRecentJobsList(input.listing),selected=list.articles.slice(0,input.limit),
  notices=mapObservations(input.notices),portals=mapObservations(input.portals),allowed=new Set(selected.map(a=>a.sourceUrl));
 if(input.notices.some(o=>!allowed.has(o.url)))throw Error('COVERAGE_UNSELECTED_OBSERVATION');
 const rows=[],source={automation:{mode:'shadow',undatedNotices:'reject',employerCrawl:false,issuers:[],checkTtlHours:6}},portalTargets=new Set();
 for(const article of selected){const row={url:article.sourceUrl,title:article.title,stage:'detail',reason:null,blocker:null};rows.push(row);
  const observation=notices.get(article.sourceUrl);if(!observation||observation.error){row.reason=observation?.error??'DETAIL_OBSERVATION_MISSING';row.blocker='detail_unavailable';continue;}
  let c;try{c=parseRecentJobsDetail({html:observation.html,url:article.sourceUrl,observedOn:dayInSA(input.observedAt)});}
  catch(e){row.reason=e.code??(/^RECENTJOBS_[A-Z_]+$/.test(e.message)?e.message:'DETAIL_PARSE_FAILED');row.blocker='publisher_layout';continue;}
  row.parsed=true;row.contentHash=c.contentHash;row.title=c.title;row.applicationMethods=c.applicationCandidates.map(r=>r.method);
  row.stage='source';
  try{preflightCandidate(source,c,input.observedAt,input.observedAt);}
  catch(e){if(e.code!=='ISSUER_RELATIONSHIP_UNQUALIFIED'){row.reason=e.code??'PREFLIGHT_FAILED';row.blocker=sourceHold(c,row.reason,input.observedAt);continue;}}
  row.sourceEligible=true;const route=c.applicationCandidates[0];row.stage='method';row.method=route.method;
  if(route.method!=='portal'){row.reason='METHOD_UNSUPPORTED';row.blocker='email_or_manual_corroboration';continue;}
  if(!probeUrl(route.destination)){row.reason='PROBE_TARGET_UNSUPPORTED';row.blocker='portal_target';continue;}
  portalTargets.add(route.destination);row.stage='portal';const original=portals.get(route.destination);
  if(!original||original.error){row.reason=original?.error??'PORTAL_OBSERVATION_MISSING';row.blocker='portal_unavailable';continue;}
  row.portalObserved=true;row.format=primaryFormatDiagnostic(original.html);
  if(!row.format.supported){row.reason=row.format.reason;row.blocker='primary_format';continue;}
  row.stage='authority';row.issuerHintAvailable=issuerHint(original.html)!==null;row.reason='AUTHORITY_NOT_ASSESSED';row.blocker='authority_not_assessed';
 }
 if(input.portals.some(o=>!portalTargets.has(o.url)))throw Error('COVERAGE_UNSELECTED_PORTAL');
 const count=predicate=>rows.filter(predicate).length,blockers={};for(const row of rows)blockers[row.blocker]=(blockers[row.blocker]??0)+1;
 const hashes=observations=>observations.map(o=>({url:o.url,...(o.html!==undefined?{sha256:digest(o.html)}:{error:o.error})})).sort((a,b)=>a.url.localeCompare(b.url));
 return{version:COVERAGE_VERSION,scope:'native_format_coverage_only',qualification:false,observedAt:input.observedAt,
  selection:{method:'publisher_order_first_n',limit:input.limit,listingArticles:list.articles.length,selected:rows.length},
  inputSha256:digest(JSON.stringify({observedAt:input.observedAt,selected:selected.map(a=>a.sourceUrl),listing:digest(input.listing.html),notices:hashes(input.notices),portals:hashes(input.portals)})),
  summary:{selected:rows.length,detailsObserved:count(r=>notices.has(r.url)&&notices.get(r.url).html!==undefined),detailsParsed:count(r=>r.parsed),
   sourceEligible:count(r=>r.sourceEligible),eligibleEmails:count(r=>r.sourceEligible&&r.method==='email'),eligiblePortals:count(r=>r.sourceEligible&&r.method==='portal'),
   portalsObserved:count(r=>r.portalObserved),jsonldSupported:count(r=>r.format?.supported&&r.format.kind==='jsonld_jobposting'),
   microdataSupported:count(r=>r.format?.supported&&r.format.kind==='microdata_jobposting'),structuredSupported:count(r=>r.format?.supported),
   microdataDetected:count(r=>r.format?.kind==='microdata_jobposting'),blockers},
  rows,networkRequests:0,providerCalls:0,cloudWrites:0,publication:false};
}
