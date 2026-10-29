import {test,before,after} from 'node:test';import assert from 'node:assert/strict';import {randomUUID,createHash} from 'node:crypto';
import {getRuntime} from '../src/runtime.mjs';import {Catalogue} from '../src/store.mjs';import {RecentJobsWorker} from '../src/recentjobs-worker.mjs';
import {Source} from '../src/schemas.mjs';import {onboardingNeedId} from '../src/employer-onboarding.mjs';
import {originalFixture,originalHtml} from './fixtures/original-notices.mjs';import {syntheticExtraction} from './fixtures/recentjobs-model.mjs';
import {onboardingFixture} from './fixtures/employer-onboarding.mjs';import {RECENTJOBS_INDEX} from '../src/worker-policy.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex'),value=s=>s.exists?JSON.parse(s.data().json):null;let db;
before(async()=>{process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-onboarding';db=(await getRuntime()).db;});
after(async()=>db?.terminate());
async function fixture(){
 const id=randomUUID(),uid=`operator_${id}`,issuer=`Authored Forge ${id}`;let now='2026-10-29T10:00:00.000Z';
 const c=new Catalogue(db,{verifyIdToken:async token=>{if(token!=='authored-token')throw Error();return{uid};}},()=>now);
 await c.ref('operators',uid).set({active:true,roles:['source','reviewer']});
 const evidence=onboardingFixture({issuer,corp:`corporate-${id}.example`,directory:`directory-${id}.example`,at:now});
 return{c,uid,issuer,evidence,now:()=>now,advance:ms=>{now=new Date(Date.parse(now)+ms).toISOString();}};
}
const review=(p,f,extra={})=>({proposalId:p.id,expectedHash:p.evidenceHash,action:'qualify',expectedAuthority:null,identityKind:'reviewed_directory',identityConfirmed:true,identityQuote:f.issuer,expiresAt:'2026-11-01T10:00:00.000Z',...extra});
test('one company onboarding is reused by a later mixed publisher batch without reviewer login or per-advert setup',async()=>{
 const f=await fixture(),host=`ats-${randomUUID()}.example`,cases=['good-a','good-b','wrong-url','wrong-date'].map((slug,i)=>originalFixture({issuer:f.issuer,host,path:`/tenant-a/job/${i+100}/`,reference:`AP-${i+100}`,slug:`authored-${slug}-${randomUUID()}`}));
 cases[2].posting.url=`https://${host}/tenant-a/job/9999/`;cases[3].posting.validThrough='2026-11-01';
 const source=Source.parse({...cases[0].source,id:`publisher_${randomUUID()}`,cadenceHours:1,automation:{...cases[0].source.automation,issuerRegistry:'shadow_v1',originDiscovery:'shadow_v1',issuers:[]}});
 let extracted=0,validated=0;const principal=`${randomUUID()}@example.test`,worker=new RecentJobsWorker(db,principal,{now:f.now,sleep:async()=>{},fetcher:async(_s,url)=>{
  if(url.endsWith('/robots.txt'))return{url,text:'User-agent: *\nAllow: /'};
  if(url===RECENTJOBS_INDEX)return{url,text:`<div class="articles-wrap">${cases.map(c=>`<article class="type-post"><h2 class="entry-title"><a href="${c.detailUrl}">${c.candidate.title}</a></h2></article>`).join('')}</div>`};
  if(url===f.evidence.plan.careersUrl)return{url,text:`<main><h1>Careers at ${f.issuer}</h1><a href="https://${host}/tenant-a/">Current jobs</a></main>`};
  const c=cases.find(c=>c.detailUrl===url||c.url===url);assert.ok(c);return{url,text:url===c.url?originalHtml(c.posting):c.detailHtml};
 },extractor:async candidate=>{extracted++;const x=JSON.parse(JSON.stringify(syntheticExtraction()).replaceAll('Fictional Workshop',f.issuer)),r=candidate.sourceText.match(/^Reference: (.+)$/m);x.intake={state:'stated',value:r[1],quote:r[0]};return{extraction:x,provenance:{usage:{totalTokens:20}}};},
 validator:async({primary})=>{validated++;return{supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Grade 12 with Mathematics OR N3 Electrical'},{source:'primary',quote:primary.issuer}],provenance:{usage:{totalTokens:20}}};}});
 await f.c.registerSource('authored-token',source,null,'Authored persistent publisher');const grant={principal,active:true,sources:[source.id],roles:['ingest']};
 await worker.ref('workers',worker.actor).set(grant);
 const budget=f.c.ref('model_budgets',hash(`${source.id}:2026-10-29`));await budget.set({json:JSON.stringify({sourceId:source.id,date:'2026-10-29',calls:5})});
 const first=await worker.run(source.id);assert.ok(first.results.every(r=>!r.recordId));assert.equal(extracted,0);
 const needId=onboardingNeedId({issuer:f.issuer,host:null}),need=value(await f.c.ref('employer_onboarding_needs',needId).get());assert.equal(need.observations.length,4);
 f.evidence.bundle.plan.needId=needId;const proposal=await f.c.recordEmployerOnboarding('authored-token',f.evidence.bundle,'Record independent corporate evidence');
 assert.equal(proposal.evaluation.state,'awaiting_identity_review');const decision=await f.c.decideEmployerOnboarding('authored-token',review(proposal,f),'Qualify authored independent identity');
 assert.equal(value(await f.c.ref('employer_onboarding_needs',needId).get()).state,'authority_registered');
 assert.equal(value(await budget.get()).calls,5);
 await f.c.ref('operators',f.uid).set({active:false,roles:[]});f.advance(3600001);
 const second=await worker.run(source.id);assert.equal(second.results.filter(r=>r.recordId).length,2);assert.equal(extracted,2);assert.equal(validated,2);
 assert.ok(second.results.some(r=>r.reason==='ORIGINAL_NOTICE_CONFLICTING'));
 assert.equal(value(await f.c.ref('sources',source.id).get()).revision,1);
 assert.equal(value(await budget.get()).calls,9);
 assert.deepEqual((await worker.ref('workers',worker.actor).get()).data(),grant);
 const root=value(await f.c.ref('employer_relationships',decision.authority.id).get());assert.equal(root.revision,1);
 for(const r of second.results.filter(r=>r.recordId)){assert.equal(value(await f.c.ref('drafts',r.recordId).get()).publication.approved,false);assert.equal((await f.c.ref('public',r.recordId).get()).exists,false);}
});
test('renewal requires fresh evidence and the exact current authority; unknown need IDs cannot be attached',async()=>{
 const f=await fixture(),p=await f.c.recordEmployerOnboarding('authored-token',f.evidence.bundle,'Capture initial root evidence');
 const first=await f.c.decideEmployerOnboarding('authored-token',review(p,f),'Initial identity qualification');
 f.advance(1000);const fresh=structuredClone(f.evidence.bundle);fresh.observations.forEach(o=>{o.at=f.now();});
 const q=await f.c.recordEmployerOnboarding('authored-token',fresh,'Capture fresh evidence for renewal');
 await assert.rejects(f.c.decideEmployerOnboarding('authored-token',review(q,f),'Missing current authority precondition'),{code:'CONFLICT'});
 await assert.rejects(f.c.decideEmployerOnboarding('authored-token',review(q,f,{expectedAuthority:{...first.authority,hash:'0'.repeat(64)}}),'Stale authority renewal'),{code:'CONFLICT'});
 const next=await f.c.decideEmployerOnboarding('authored-token',review(q,f,{expectedAuthority:first.authority}),'Renew from current reviewed evidence');
 assert.equal(next.authority.revision,2);assert.equal(next.authority.id,first.authority.id);
 const g=await fixture();g.evidence.bundle.plan.needId='unobserved_need';await assert.rejects(g.c.recordEmployerOnboarding('authored-token',g.evidence.bundle,'Attach unrelated need'),{code:'ONBOARDING_NEED_CONFLICT'});
});
test('capture alone grants no authority; role, fingerprint, quote, freshness, expiry and one-time review are enforced',async()=>{
 const f=await fixture(),p=await f.c.recordEmployerOnboarding('authored-token',f.evidence.bundle,'Capture authored evidence');
 assert.equal((await f.c.ref('employer_onboarding_decisions',p.id).get()).exists,false);
 await f.c.ref('operators',f.uid).set({active:true,roles:['reviewer']});await assert.rejects(f.c.decideEmployerOnboarding('authored-token',review(p,f),'Forbidden root qualification'),{code:'FORBIDDEN'});
 await f.c.ref('operators',f.uid).set({active:true,roles:['source','reviewer']});
 for(const [change,code] of [[{expectedHash:'0'.repeat(64)},'ONBOARDING_EVIDENCE_CHANGED'],[{identityConfirmed:undefined},'ONBOARDING_REVIEW_REQUIRED'],[{identityQuote:'Invented identity evidence'},'ONBOARDING_IDENTITY_QUOTE_UNSUPPORTED'],[{expiresAt:'2027-01-01T00:00:00.000Z'},'ONBOARDING_EXPIRY_INVALID']])await assert.rejects(f.c.decideEmployerOnboarding('authored-token',review(p,f,change),'Invalid authored root qualification'),{code});
 const approved=await f.c.decideEmployerOnboarding('authored-token',review(p,f),'Qualify reviewed authored root');assert.ok(approved.authority);
 await assert.rejects(f.c.decideEmployerOnboarding('authored-token',review(p,f),'Repeat qualification'),{code:'ONBOARDING_ALREADY_REVIEWED'});
 const r=value(await f.c.ref('employer_relationships',approved.authority.id).get());assert.equal(r.revision,1);
 assert.equal((await f.c.ref('employer_relationship_versions',hash(`${r.id}:1`)).get()).exists,true);
 const g=await fixture(),q=await g.c.recordEmployerOnboarding('authored-token',g.evidence.bundle,'Capture expiring authored evidence');g.advance(86400001);
 await assert.rejects(g.c.decideEmployerOnboarding('authored-token',review(q,g),'Stale qualification'),{code:'ONBOARDING_EVIDENCE_STALE'});
});
test('changed snapshots, incomplete evidence and rejected proposals cannot qualify authority',async()=>{
 const f=await fixture(),p=await f.c.recordEmployerOnboarding('authored-token',f.evidence.bundle,'Capture immutable authored evidence');
 const proposal=value(await f.c.ref('employer_onboarding',p.id).get()),s=f.c.ref('employer_onboarding_snapshots',proposal.snapshots[0]),old=value(await s.get());
 await s.set({json:JSON.stringify({...old,html:old.html+'changed'})});await assert.rejects(f.c.decideEmployerOnboarding('authored-token',review(p,f),'Changed snapshot qualification'),{code:'ONBOARDING_EVIDENCE_CHANGED'});
 const g=await fixture();g.evidence.bundle.observations[0]={url:g.evidence.plan.identityUrl,at:g.now(),error:'ROBOTS_DISALLOWED'};
 const q=await g.c.recordEmployerOnboarding('authored-token',g.evidence.bundle,'Capture unavailable identity');assert.equal(q.evaluation.state,'evidence_incomplete');
 await assert.rejects(g.c.decideEmployerOnboarding('authored-token',review(q,g),'Incomplete qualification'),{code:'ONBOARDING_REVIEW_REQUIRED'});
 await g.c.decideEmployerOnboarding('authored-token',review(q,g,{action:'reject'}),'Reject unavailable identity');
 await assert.rejects(g.c.decideEmployerOnboarding('authored-token',review(q,g),'Revive rejected proposal'),{code:'ONBOARDING_ALREADY_REVIEWED'});
});
