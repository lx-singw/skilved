import {createHash} from 'node:crypto';
import {z} from 'zod';
import {InstantSchema} from '@skilved/types/opportunities';
import {Source} from './schemas.mjs';
import {DomainError} from './config.mjs';
import {RECENTJOBS_INDEX} from './worker-policy.mjs';
import {dayInSA,nextSouthAfricanDay} from './south-african-time.mjs';

const fail=code=>{throw new DomainError(code);};
const canonical=value=>Array.isArray(value)?'['+value.map(canonical).join(',')+']':value&&typeof value==='object'
 ?'{'+Object.keys(value).filter(k=>value[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}':JSON.stringify(value);
const hash=value=>createHash('sha256').update(typeof value==='string'?value:canonical(value)).digest('hex');
const Budget=z.object({sourceId:z.string(),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),calls:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)}).strict();
const Input=z.object({source:Source,observedAt:InstantSchema,budgets:z.array(Budget).max(10000),
 discovery:z.object({maxPages:z.number().int().min(1).max(5),maxArticles:z.number().int().min(1).max(10)}).strict()}).strict();

/** Read-only proposal for expanding an existing source, never a new quota pool.
 * The normal Source-role command still requires genuine authentication and a
 * current expected revision. This module creates no client, grant or job. */
export function planRecentJobsPublisher(input){
 let parsed;try{parsed=Input.parse(input);}catch{fail('PUBLISHER_PLAN_INVALID');}
 const {source,observedAt,budgets,discovery}=parsed,a=source.automation;
 if(source.permission.method!=='recentjobs_html'||source.paused||a?.mode!=='shadow'||
   !source.categories.includes('apprenticeship')||!source.urls.includes(RECENTJOBS_INDEX))fail('PUBLISHER_PLAN_SOURCE_UNSUPPORTED');
 if(discovery.maxPages<(a.discovery?.maxPages??1)||discovery.maxArticles<a.maxArticles)fail('PUBLISHER_PLAN_NOT_EXPANSION');
 if(source.revision>=Number.MAX_SAFE_INTEGER)fail('PUBLISHER_PLAN_INVALID');
 const dates=new Set();
 for(const row of budgets){
  const instant=new Date(row.date+'T12:00:00.000Z');
  if(row.sourceId!==source.id||dates.has(row.date)||!Number.isFinite(instant.getTime())||instant.toISOString().slice(0,10)!==row.date)fail('PUBLISHER_PLAN_BUDGET_INVALID');
  dates.add(row.date);
 }
 const sourceDay=dayInSA(observedAt),calls=budgets.find(r=>r.date===sourceDay)?.calls??0;
 const proposed=Source.parse({...source,revision:source.revision+1,name:'RecentJobs apprenticeship publisher (shadow)',automation:{...a,
  discovery:{maxPages:discovery.maxPages},maxArticles:discovery.maxArticles,
  qualificationRef:'Publisher expansion rehearsal; existing trust and daily spending retained. Not qualified for automatic publication.'}});
 const history=[...budgets].sort((l,r)=>l.date.localeCompare(r.date)).map(row=>({...row,id:hash(row.sourceId+':'+row.date)}));
 const remaining=Math.max(0,a.maxModelCallsPerDay-calls);
 const body={version:'recentjobs_publisher_plan_v1',observedAt,sourceId:source.id,expectedRevision:source.revision,
  currentSourceHash:hash(source),proposedSourceHash:hash(proposed),requiredRole:'source',
  command:{command:'source',source:proposed,expected:source.revision,reason:'Expand the existing publisher source while retaining its identity, trust and spent daily allowance; shadow evaluation only.'},
  sourceBudget:{day:sourceDay,limit:a.maxModelCallsPerDay,calls,remaining,earliestModelAdmission:remaining?observedAt:nextSouthAfricanDay(observedAt)},
  budgetHistory:{rows:history,sha256:hash(history)},
  preserved:{sourceId:true,owner:true,permission:true,existingUrls:true,issuerTrust:true,optionalEmployerCrawl:true,modelCallCeiling:true,providerAccountingUntouched:true},
  applied:false,cloudWrites:0,providerCalls:0,publication:false};
 return {...body,sha256:hash(body)};
}
