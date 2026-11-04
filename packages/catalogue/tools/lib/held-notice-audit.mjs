import {createHash} from 'node:crypto';
import {parse} from 'parse5';
import {z} from 'zod';
import {InstantSchema} from '@skilved/types/opportunities';
import {Source} from '../../src/schemas.mjs';
import {parseRecentJobsDetail} from '../../src/adapters/recentjobs.mjs';
import {preflightCandidate,dayInSA,assertSourceTarget} from '../../src/worker-policy.mjs';

const hash=text=>createHash('sha256').update(text).digest('hex');
const fail=code=>{throw Error(code);};
const code=z.string().regex(/^[A-Z][A-Z_]{0,79}$/);
const url=z.string().url().max(2048),id=z.string().min(1).max(100);
export const HeldAuditInput=z.object({version:z.literal(1),observedAt:InstantSchema,source:Source,
 selection:z.object({frozenAt:InstantSchema,sourceId:id,sourceRevision:z.number().int().positive(),
  selected:z.array(z.object({url,title:z.string().min(1).max(500)}).strict()).min(1).max(200)}).strict(),
 outcomes:z.array(z.object({jobId:id,url,startedAt:InstantSchema,completedAt:InstantSchema,
  state:z.enum(['done','pending','exception']),reason:code.nullable(),sourceHeld:z.boolean().default(false),
  contentHash:z.string().regex(/^[a-f0-9]{64}$/).optional(),
  original:z.object({outcome:z.string().max(80),reason:z.string().max(80).nullable()}).strict().optional(),
 }).strict()).max(200),
 observations:z.array(z.object({url,retrievedAt:InstantSchema,html:z.string().optional(),sha256:z.string().regex(/^[a-f0-9]{64}$/).optional(),error:code.optional()})
  .strict().refine(o=>(o.html!==undefined)!==(o.error!==undefined),'One body or error required')).max(200),
}).strict();
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
const attr=(n,key)=>n.attrs?.find(a=>a.name===key)?.value??'';
const hasClass=(n,key)=>attr(n,'class').split(/\s+/).includes(key);
function nodes(root){const out=[],stack=[[root,0]];while(stack.length){const[n,depth]=stack.pop();if(out.length>=20000||depth>100)fail('HOLD_AUDIT_TREE_LIMIT');out.push(n);for(const child of n.childNodes??[])stack.push([child,depth+1]);}return out;}
const within=(n,parent)=>{for(let p=n;p;p=p.parentNode)if(p===parent)return true;return false;};
const nearest=(n,test)=>{for(let p=n.parentNode;p;p=p.parentNode)if(test(p))return p;return null;};
function text(root){const parts=[],stack=[root];while(stack.length){const n=stack.pop();if(['script','style','noscript','template','svg','iframe'].includes(n.tagName))continue;if(n.nodeName==='#text')parts.push(n.value);for(const child of(n.childNodes??[]).slice().reverse())stack.push(child);}return parts.join('').replace(/\s+/g,' ').trim();}

/** Hints are diagnostic evidence, never new application candidates or trust. */
export function heldRouteHints(candidate,html){
 if(typeof html!=='string'||Buffer.byteLength(html)>500000)fail('HOLD_AUDIT_BODY_LIMIT');
 const lines=(candidate.title+'\n'+candidate.sourceText).split('\n'),hints=[],known=new Set(candidate.applicationCandidates.map(r=>r.destination));
 const email=z.string().max(254).email(),bare=/[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}/g;
 for(let i=0;i+1<lines.length;i++){
  const label=lines[i].trim(),recipient=lines[i+1].trim(),context=lines.slice(Math.max(0,i-4),i).join('\n');
  if(!/^(?:application e-?mail|e-?mail (?:address for applications|applications))\s*:?$/i.test(label)||!email.safeParse(recipient).success||known.has(recipient)||
    !/how to apply|e-?mail application/i.test(context)||/enquir|contact|quer(?:y|ies)|form request/i.test(context))continue;
  hints.push({kind:'labelled_application_email',destination:recipient,span:[i+1,i+2],originalText:lines.slice(i,i+2).join('\n'),qualified:false});
 }
 for(let i=0;i<lines.length;i++)for(const match of lines[i].matchAll(bare))if(email.safeParse(match[0]).success&&!known.has(match[0])&&!hints.some(h=>h.destination===match[0]))
  hints.push({kind:'unqualified_email_mention',destination:match[0],span:[i+1,i+1],originalText:lines[i],qualified:false});
 const all=nodes(parse(html));
 const posts=all.filter(n=>n.tagName==='article'&&hasClass(n,'type-post')&&nodes(n).some(h=>h.tagName==='h1'&&hasClass(h,'entry-title')&&text(h)===candidate.title));
 if(posts.length===1)for(const a of all.filter(n=>n.tagName==='a'&&attr(n,'href'))){
  const post=nearest(a,n=>n.tagName==='article'),body=nearest(a,n=>hasClass(n,'entry-content')),footer=nearest(a,n=>n.tagName==='footer');
  if(post!==posts[0]||!body||!footer||!within(footer,body)||!within(body,post)||nearest(a,n=>['nav','aside'].includes(n.tagName)))continue;
  const label=text(a);if(!/\b(?:apply|application)\b/i.test(label)||/\b(?:share|whatsapp|group|channel)\b/i.test(label))continue;
  let target;try{target=new URL(attr(a,'href'),candidate.sourceUrl);}catch{continue;}
  if(target.protocol!=='https:'||target.username||target.password||target.port||target.hash||known.has(target.href)||target.href.length>2048||
   !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(target.hostname)||/(?:^|\.)(?:recentjobs\.co\.za|localhost|internal|local|whatsapp\.com|facebook\.com)$/.test(target.hostname))continue;
  hints.push({kind:'application_link_in_notice_footer',destination:target.href,originalText:label,scope:'footer_inside_selected_notice_body',qualified:false});
 }
 return hints.slice(0,40);
}

function dateEvidence(candidate,at){
 const values=candidate.deadlineCandidates,dates=[...new Set(values.map(d=>d.localDate).filter(Boolean))].sort(),day=dayInSA(at);
 const status=!values.length?'absent':values.some(d=>!d.localDate)?values.every(d=>/not\s+(?:specified|stated)/i.test(d.originalText))?'explicitly_unspecified':'unresolved':dates.length!==1?'conflicting':dates[0]<day?'elapsed':dates[0]===day?'closing_day':'future';
 return{status,dates,candidates:values,employerClosureVerified:false};
}
function finding(row){
 if(!row.recorded)return'outcome_missing';
 if(!row.parsed)return'observation_or_layout_unavailable';
 if(row.recorded.reason==='ORIGINAL_NOTICE_UNSUPPORTED'&&row.recorded.original?.reason==='ORIGIN_UNQUALIFIED')return'employer_authority_unqualified';
 if(row.recorded.reason==='MODEL_BUDGET_EXHAUSTED'&&row.recorded.state==='pending')return'pipeline_quota_deferred';
 if(row.recorded.reason!==row.replayCode)return'preflight_outcome_not_reproduced';
 if(row.replayCode==='NOTICE_NOT_OPEN')return'supported_publisher_date_hold';
 if(['NOTICE_CATEGORY_CONFLICT','NOTICE_CATEGORY_REVIEW_REQUIRED'].includes(row.replayCode))return'supported_source_category_hold';
 if(row.replayCode==='NOTICE_PRECISION_UNSUPPORTED'){
  if(row.routeCount===0)return row.routeHints.some(h=>h.kind==='labelled_application_email')?'labelled_email_parser_gap':
   row.routeHints.some(h=>h.kind==='application_link_in_notice_footer')?'bound_footer_parser_gap':'incomplete_application_evidence';
  if(row.routeCount>1)return'multiple_application_routes';
  if(['absent','explicitly_unspecified'].includes(row.deadline.status))return'publisher_date_not_supplied';
  return'publisher_date_unresolved';
 }
 return'review_required';
}

/** Pure saved-cohort replay. No network, models, cloud clients, grants or publication. */
export function auditSavedRecentJobsHolds(raw){
 const input=HeldAuditInput.parse(raw);
 if(!input.source.automation||input.source.permission.method!=='recentjobs_html'||input.source.id!==input.selection.sourceId||input.source.revision!==input.selection.sourceRevision)fail('HOLD_AUDIT_SOURCE_BINDING');
 const selected=new Set();for(const article of input.selection.selected){assertSourceTarget(article.url);if(selected.has(article.url))fail('HOLD_AUDIT_DUPLICATE_SELECTION');selected.add(article.url);}
 const map=(list,label)=>{const result=new Map();for(const row of list){if(!selected.has(row.url))fail('HOLD_AUDIT_UNSELECTED_'+label);if(result.has(row.url))fail('HOLD_AUDIT_DUPLICATE_'+label);result.set(row.url,row);}return result;};
 const outcomes=map(input.outcomes,'OUTCOME'),observations=map(input.observations,'OBSERVATION'),jobIds=new Set();
 for(const o of input.outcomes){if(jobIds.has(o.jobId))fail('HOLD_AUDIT_DUPLICATE_JOB');jobIds.add(o.jobId);if(o.startedAt<input.selection.frozenAt||o.completedAt<o.startedAt||o.completedAt>input.observedAt)fail('HOLD_AUDIT_TIMING_BINDING');}
 for(const o of input.observations){if(o.retrievedAt>input.observedAt||o.retrievedAt<input.selection.frozenAt)fail('HOLD_AUDIT_TIMING_BINDING');if(o.html!==undefined&&(Buffer.byteLength(o.html)>500000||!o.sha256||hash(o.html)!==o.sha256))fail('HOLD_AUDIT_BODY_BINDING');}
 const rows=[];
 for(const [index,article]of input.selection.selected.entries()){
  const recorded=outcomes.get(article.url),observation=observations.get(article.url),row={index:index+1,url:article.url,title:article.title,recorded:recorded??null,parsed:false,replayCode:null,qualified:false};rows.push(row);
  if(!observation||observation.error){row.observationError=observation?.error??'OBSERVATION_MISSING';row.finding=finding(row);continue;}
  let c;try{c=parseRecentJobsDetail({html:observation.html,url:article.url,observedOn:dayInSA(input.observedAt)});}catch{row.observationError='DETAIL_REPLAY_FAILED';row.finding=finding(row);continue;}
  row.parsed=true;row.adapter=c.adapter;row.contentHash=c.contentHash;row.contentHashMatchesRecorded=recorded?.contentHash?recorded.contentHash===c.contentHash:null;row.bodySha256=observation.sha256;
  const at=recorded?.completedAt??input.observedAt;
  try{preflightCandidate(input.source,c,at,observation.retrievedAt);}catch(e){row.replayCode=/^[A-Z_]+$/.test(e.code??'')?e.code:'PREFLIGHT_REPLAY_FAILED';}
  row.deadline=dateEvidence(c,at);row.routeCount=c.applicationCandidates.length;row.routes=c.applicationCandidates.map(({method,destination})=>({method,destination,qualified:false}));row.routeHints=heldRouteHints(c,observation.html);
  row.secondary=[];if(row.deadline.status==='elapsed')row.secondary.push('publisher_date_elapsed');if(['absent','explicitly_unspecified'].includes(row.deadline.status))row.secondary.push('publisher_date_not_supplied');
  if(c.applicationCandidates.some(r=>r.method==='portal'&&/(?:^|\.)(?:indeed\.com|pnet\.co\.za)$/.test(new URL(r.destination).hostname)))row.secondary.push('job_board_method_needs_corroboration');
  if(/\b(?:building a database|talent pool|expression of interest)\b/i.test(c.sourceText))row.secondary.push('talent_pool_language_needs_review');
  if(/\b(?:needs? confirmation|information has some differences)\b/i.test(c.sourceText))row.secondary.push('source_flags_uncertainty');
  row.finding=finding(row);
 }
 const findings={},recordedReasons={};for(const row of rows){findings[row.finding]=(findings[row.finding]??0)+1;const reason=row.recorded?.reason??row.recorded?.state??'OUTCOME_MISSING';recordedReasons[reason]=(recordedReasons[reason]??0)+1;}
 const count=test=>rows.filter(test).length;
 const inputSha256=hash(JSON.stringify(stable({version:1,observedAt:input.observedAt,source:input.source,selection:input.selection,
  outcomes:[...input.outcomes].sort((a,b)=>a.url.localeCompare(b.url)),observations:input.observations.map(({html,...o})=>o).sort((a,b)=>a.url.localeCompare(b.url))})));
 return{version:'recentjobs_held_cohort_audit_v1',scope:'saved_source_diagnostics_only',qualification:false,observedAt:input.observedAt,inputSha256,
  source:{id:input.source.id,revision:input.source.revision,issuerPolicy:input.source.automation.issuerRegistry?'registry':'inline',inlineIssuerCount:input.source.automation.issuers.length,undatedPolicy:input.source.automation.undatedNotices},
  summary:{selected:rows.length,observed:observations.size,outcomes:outcomes.size,held:count(r=>r.recorded?.state==='exception'),pending:count(r=>r.recorded?.state==='pending'),parsed:count(r=>r.parsed),
   findings,recordedReasons,precisionRouteMissing:count(r=>r.recorded?.reason==='NOTICE_PRECISION_UNSUPPORTED'&&r.routeCount===0),precisionDateOnly:count(r=>r.recorded?.reason==='NOTICE_PRECISION_UNSUPPORTED'&&r.routeCount===1&&r.deadline.status!=='future'),
   absentOrUnspecifiedDates:count(r=>r.secondary?.includes('publisher_date_not_supplied')),elapsedPublisherDates:count(r=>r.secondary?.includes('publisher_date_elapsed')),jobBoardRoutes:count(r=>r.secondary?.includes('job_board_method_needs_corroboration'))},
  rows,networkRequests:0,providerCalls:0,cloudWrites:0,publication:false};
}
