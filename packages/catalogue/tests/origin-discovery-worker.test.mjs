import { test,before,after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID,createHash } from 'node:crypto';
import { Catalogue } from '../src/store.mjs';
import { RecentJobsWorker } from '../src/recentjobs-worker.mjs';
import { Source,EmployerRelationship } from '../src/schemas.mjs';
import { DomainError } from '../src/config.mjs';
import { getRuntime } from '../src/runtime.mjs';
import { RECENTJOBS_INDEX } from '../src/worker-policy.mjs';
import { originalFixture,originalHtml,originalMicrodataHtml } from './fixtures/original-notices.mjs';
import { syntheticExtraction } from './fixtures/recentjobs-model.mjs';
import {makeDelegation,delegationDocument,delegationBinding} from '../src/origin-discovery.mjs';
import {onboardingNeedId} from '../src/employer-onboarding.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex'),payload=v=>({json:JSON.stringify(v)}),value=s=>s.exists?JSON.parse(s.data().json):null;
let db;
before(async()=>{process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-origins';db=(await getRuntime()).db;});
after(async()=>db?.terminate());
async function fixture({root=true,count=2,hint='url',issuer='Fictional Workshop',format='jsonld',dedicatedHost=false,missingDateEvidence}={}){
 const id=randomUUID(),host=dedicatedHost?`jobs.authored-${id}.co.za`:`ats-${id}.example`,corp=dedicatedHost?`www.authored-${id}.co.za`:`corporate-${id}.example`,page=`https://${corp}/careers/`,link=`https://${host}/${dedicatedHost?'':'tenant-a/'}`;
 let now='2026-10-29T10:00:00.000Z';
 const cases=Array.from({length:count},(_,i)=>originalFixture({issuer,host,path:`/tenant-a/job/${i+100}/`,reference:`AP-${i+100}`,slug:`authored-${id}-${i}`}));
 if(hint==='url')cases.forEach(c=>{c.posting.hiringOrganization.sameAs=`https://${corp}/`;});
 if(missingDateEvidence)cases.forEach(c=>{c.detailHtml=c.detailHtml.replace('<p>Closing date: 30 October 2026</p>','<p>Closing date: Not specified</p>');});
 const source=Source.parse({...cases[0].source,id:`publisher_${id}`,automation:{...cases[0].source.automation,issuerRegistry:'shadow_v1',originDiscovery:'shadow_v1',issuers:[],...(missingDateEvidence?{missingDateEvidence}:{})}});
 let parent=EmployerRelationship.parse({id:`corporate_${id}`,revision:1,state:'qualified',categories:['apprenticeship'],reviewedAt:now,expiresAt:'2026-11-01T10:00:00.000Z',
  route:{name:issuer,host:corp,pathPrefix:'/careers/',evidence:'Authored corporate authority'},delegationPage:page});
 const state={requests:[],extracted:[],validated:[],page:`<main><h1>Careers</h1><a href="${link}">View jobs</a></main>`,onValidate:null,onRobots:null,failProbe:false};
 const options={now:()=>now,sleep:async()=>{},fetcher:async(_source,url)=>{
  state.requests.push(url);
  if(url.endsWith('/robots.txt')){await state.onRobots?.(url);return{url,text:'User-agent: *\nAllow: /'};}
  if(url===RECENTJOBS_INDEX)return{url,text:`<div class="articles-wrap">${cases.map(c=>`<article class="type-post"><h2 class="entry-title"><a href="${c.detailUrl}">${c.candidate.title}</a></h2></article>`).join('')}</div>`};
  if(url===page)return{url,text:state.page};const c=cases.find(c=>c.url===url||c.detailUrl===url);assert.ok(c,`Unexpected URL ${url}`);
  if(url===c.url&&state.failProbe)throw new DomainError('FETCH_TIMEOUT');
  const html=format==='microdata_literal'?originalMicrodataHtml(c.posting).replace(/<div itemprop="hiringOrganization"[\s\S]*?<\/div>/,`<meta itemprop="hiringOrganization" content="${issuer}">`):originalHtml(c.posting);
  return{url,text:url===c.url?html:c.detailHtml};
 },extractor:async candidate=>{state.extracted.push(candidate.sourceUrl);const x=JSON.parse(JSON.stringify(syntheticExtraction()).replaceAll('Fictional Workshop',issuer)),r=candidate.sourceText.match(/^Reference: (.+)$/m);x.intake={state:'stated',value:r[1],quote:r[0]};
  return{extraction:x,provenance:{usage:{inputTokens:10,totalTokens:20}}};},validator:async({primary})=>{state.validated.push(primary.issuer);await state.onValidate?.();
  return{supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Grade 12 with Mathematics OR N3 Electrical'},{source:'primary',quote:primary.issuer}],provenance:{usage:{inputTokens:10,totalTokens:20}}};}};
 const principal=`${id}@example.test`,uid=`operator_${id}`,worker=new RecentJobsWorker(db,principal,options);
 const catalogue=new Catalogue(db,{verifyIdToken:async token=>{if(token!=='authored-token')throw Error();return{uid};}},options.now);
 await worker.ref('operators',uid).set({active:true,roles:['source','reviewer']});
 if(root)await catalogue.registerEmployerRelationship('authored-token',parent,null,'Authored corporate careers authority');
 await catalogue.registerSource('authored-token',source,null,'Authored automatic origin policy');
 const grant={principal,active:true,sources:[source.id],roles:['ingest']};await worker.ref('workers',worker.actor).set(grant);
 const rows=async collection=>(await db.collection(`m0_${collection}`).get()).docs.map(value).filter(r=>r.sourceId===source.id);
 return{worker,catalogue,source,grant,uid,cases,state,page,link,corp,host,parent,rows,advance:ms=>{now=new Date(Date.parse(now)+ms).toISOString();},
  restart:()=>new RecentJobsWorker(db,principal,options),revoke:async()=>{const next={...parent,revision:parent.revision+1,state:'revoked'};await catalogue.registerEmployerRelationship('authored-token',next,parent.revision,'Authored parent revocation');parent=next;},
  recheck:async()=>{const id=hash(randomUUID());await worker.ref('worker_jobs',id).set(payload({id,sourceId:source.id,kind:'detail',url:cases[0].detailUrl,state:'pending',attempts:0,lease:null,nextAt:now}));return id;}};
}
test('new ATS destinations are corroborated and reused for unseen notices without a reviewed ATS registration',async()=>{
 const f=await fixture(),result=await f.worker.run(f.source.id);assert.equal(result.results.filter(r=>r.recordId).length,2);
 assert.equal(f.state.extracted.length,2);assert.equal(f.state.requests.filter(url=>url===f.page).length,1);
 for(const c of f.cases)assert.equal(f.state.requests.filter(url=>url===c.url).length,1,'Probe observation is reused for original verification');
 const records=await f.rows('employer_delegations');assert.equal(records.length,1);assert.equal(records[0].route.pathPrefix,'/tenant-a/');
 const receipts=await f.rows('worker_origin_discoveries');assert.deepEqual(new Set(receipts.map(r=>r.resolution.outcome)),new Set(['corroborated','cached']));
 assert.equal((await f.rows('employer_delegation_versions')).length,1);
 for(const decision of await f.rows('worker_decisions')){
  const issuer=await f.catalogue.inspect('authored-token','worker_issuer_resolutions',decision.issuerResolutionId);assert.equal(issuer.resolution.delegations.length,1);assert.ok(issuer.originDiscoveryId);
  assert.equal((await f.worker.ref('public',decision.recordId).get()).exists,false);
 }
 assert.deepEqual(value(await f.worker.ref('sources',f.source.id).get()),f.source);assert.deepEqual((await f.worker.ref('workers',f.worker.actor).get()).data(),f.grant);
});
test('dedicated recruitment roots reuse parent-bound proofs across notices, then stop on revocation without resetting usage',async()=>{
 const f=await fixture({dedicatedHost:true,hint:'name',format:'microdata_literal',issuer:`Authored Dedicated ${randomUUID()}`});
 f.state.page=`<div><h1>Careers</h1><div><h1>CAREERS</h1><p>Our process does not require advance payments. Candidates can apply for vacancies through our <a href="${f.link}">career website</a>.</p><h1>Join our team</h1></div></div>`;
 const run=await f.worker.run(f.source.id);assert.equal(run.results.filter(r=>r.recordId).length,2,JSON.stringify({run,origins:await f.rows('worker_origin_discoveries'),originals:await f.rows('worker_original_resolutions')}));
 const proof=(await f.rows('employer_delegations'))[0];assert.equal(proof.version,'corporate_delegation_v2');assert.equal(proof.scopeKind,'corporate_subdomain');assert.equal(proof.route.pathPrefix,'/');assert.deepEqual(proof.route.emailAddresses,[]);
 assert.equal(f.state.requests.filter(u=>u===f.page).length,1);assert.equal((await f.rows('employer_delegation_versions')).length,1);
 assert.deepEqual(new Set((await f.rows('worker_origin_discoveries')).map(r=>r.resolution.outcome)),new Set(['corroborated','cached']));
 for(const result of run.results.filter(r=>r.recordId)){assert.equal(value(await f.worker.ref('drafts',result.recordId).get()).publication.approved,false);assert.equal((await f.worker.ref('public',result.recordId).get()).exists,false);}
 await f.revoke();await f.restart().runJob(f.source.id,await f.recheck());assert.equal(f.state.extracted.length,2);assert.equal(value(await f.worker.ref('model_budgets',hash(`${f.source.id}:2026-10-29`)).get()).calls,4);
 assert.deepEqual(value(await f.worker.ref('employer_delegation_versions',delegationBinding(proof).hash).get()),proof);
 assert.deepEqual(value(await f.worker.ref('sources',f.source.id).get()),f.source);assert.deepEqual((await f.worker.ref('workers',f.worker.actor).get()).data(),f.grant);
});
test('a V2 dedicated host proof cannot override an exact vacancy URL conflict',async()=>{
 const f=await fixture({dedicatedHost:true,count:1});f.cases[0].posting.url=`https://${f.host}/other-vacancy/`;
 const run=await f.worker.run(f.source.id);assert.ok(run.results.some(r=>r.reason==='ORIGINAL_NOTICE_CONFLICTING'));assert.deepEqual(f.state.extracted,[]);
 assert.equal((await f.rows('worker_origin_discoveries'))[0].resolution.outcome,'corroborated');assert.equal((await f.rows('model_calls')).length,0);
});
test('unexpired legacy V1 path proofs are reused unchanged under the new reader without new authority or reset spend',async()=>{
 const f=await fixture({count:1}),v2=makeDelegation(f.parent,f.link,{now:f.parent.reviewedAt,snapshotId:'authored_legacy_snapshot',sourceId:f.source.id,sourceRevision:1}),{scopeKind,...legacy}=v2;
 legacy.version='corporate_delegation_v1';await f.worker.ref('employer_delegations',legacy.id).set(delegationDocument(legacy));await f.worker.ref('employer_delegation_versions',delegationBinding(legacy).hash).set(payload(legacy));
 const run=await f.worker.run(f.source.id);assert.equal(run.results.filter(r=>r.recordId).length,1);assert.ok(!f.state.requests.includes(f.page));
 assert.deepEqual(value(await f.worker.ref('employer_delegations',legacy.id).get()),legacy);assert.equal((await f.rows('employer_delegation_versions')).length,1);
 assert.equal((await f.rows('worker_origin_discoveries'))[0].resolution.outcome,'cached');
});
test('name-only Microdata finds a reviewed corporate anchor, requires its backlink and reuses proof across notices',async()=>{
 const issuer=`Authored Forge ${randomUUID()}`,f=await fixture({hint:'name',issuer,format:'microdata_literal'});
 const result=await f.worker.run(f.source.id);assert.equal(result.results.filter(r=>r.recordId).length,2);
 assert.equal(f.state.requests.filter(url=>url===f.page).length,1);assert.equal(f.state.extracted.length,2);
 const receipt=(await f.rows('worker_origin_discoveries')).find(r=>r.resolution.outcome==='corroborated');
 assert.deepEqual(receipt.issuerHint,{version:'issuer_hint_v2',method:'organization_name',issuer,host:null});
 assert.equal((await f.rows('employer_delegations')).length,1);
 for(const decision of await f.rows('worker_decisions')){
  assert.equal(value(await f.worker.ref('drafts',decision.recordId).get()).publication.approved,false);
  assert.equal((await f.worker.ref('public',decision.recordId).get()).exists,false);
 }
 assert.deepEqual(value(await f.worker.ref('sources',f.source.id).get()),f.source);
});
test('unknown name-only organizations cannot trigger corporate guesses, authority writes or model work',async()=>{
 const f=await fixture({root:false,hint:'name',issuer:`Unreviewed Forge ${randomUUID()}`,count:1});await f.worker.run(f.source.id);
 const receipt=(await f.rows('worker_origin_discoveries'))[0];assert.equal(receipt.resolution.reason,'CORPORATE_AUTHORITY_UNQUALIFIED');assert.equal(receipt.issuerHint.method,'organization_name');
 assert.ok(!f.state.requests.some(url=>url.includes(f.corp)));assert.deepEqual(f.state.extracted,[]);assert.equal((await f.rows('employer_delegations')).length,0);
});
test('ambiguous reviewed names and invalid explicit URL claims cannot fall back to a preferred corporate root',async()=>{
 const f=await fixture({hint:'name',issuer:`Ambiguous Forge ${randomUUID()}`,count:1});
 const second={...f.parent,id:`another_${randomUUID()}`,route:{...f.parent.route,host:'other-corporate.example'},delegationPage:'https://other-corporate.example/careers/'};
 await f.catalogue.registerEmployerRelationship('authored-token',second,null,'Authored ambiguous authority');
 await f.worker.run(f.source.id);assert.equal((await f.rows('worker_origin_discoveries'))[0].resolution.reason,'CORPORATE_AUTHORITY_UNQUALIFIED');
 assert.ok(!f.state.requests.some(url=>url.includes(f.corp)||url.includes('other-corporate.example')));assert.deepEqual(f.state.extracted,[]);
 const g=await fixture({hint:'name',issuer:`Claimed Forge ${randomUUID()}`,count:1});g.cases[0].posting.hiringOrganization.sameAs='http://unreviewed.example/';
 await g.worker.run(g.source.id);assert.equal((await g.rows('worker_origin_discoveries'))[0].resolution.reason,'ISSUER_HINT_UNSUPPORTED');
 assert.ok(!g.state.requests.some(url=>url.includes(g.corp)));assert.deepEqual(g.state.extracted,[]);
});
test('name-only matching does not replace the corporate backlink or current parent fence',async()=>{
 const f=await fixture({hint:'name',issuer:`Scoped Forge ${randomUUID()}`,count:1});f.state.page='<main><h1>Careers</h1><a href="https://unrelated.example/tenant/">Jobs</a></main>';
 await f.worker.run(f.source.id);assert.equal((await f.rows('worker_origin_discoveries'))[0].resolution.reason,'DELEGATION_LINK_UNSUPPORTED');assert.deepEqual(f.state.extracted,[]);
 const g=await fixture({hint:'name',issuer:`Revoked Forge ${randomUUID()}`,count:1});g.state.onRobots=async url=>{if(url.includes(g.corp))await g.revoke();};
 const result=await g.worker.run(g.source.id);assert.ok(result.results.some(r=>r.reason==='ISSUER_TRUST_CHANGED'));assert.ok(!g.state.requests.includes(g.page));
 assert.equal((await g.rows('employer_delegations')).length,0);assert.deepEqual(g.state.extracted,[]);
});
test('self-claimed corporate identities are held without fetching unreviewed corporate pages or spending AI',async()=>{
 const f=await fixture({root:false,count:1});await f.worker.run(f.source.id);
 assert.equal((await f.rows('worker_origin_discoveries'))[0].resolution.reason,'CORPORATE_AUTHORITY_UNQUALIFIED');
 assert.ok(!f.state.requests.some(url=>url.includes(f.corp)));assert.deepEqual(f.state.extracted,[]);assert.equal((await f.rows('employer_delegations')).length,0);
});
test('an unrelated tenant or footer link does not establish corporate delegation',async()=>{
 const f=await fixture({count:1});f.state.page=`<main><h1>Careers</h1><a href="https://${f.host}/other-tenant/">Jobs</a></main><footer><a href="${f.link}">Jobs</a></footer>`;
 await f.worker.run(f.source.id);assert.equal((await f.rows('worker_origin_discoveries'))[0].resolution.reason,'DELEGATION_LINK_UNSUPPORTED');
 assert.deepEqual(f.state.extracted,[]);assert.equal((await f.rows('employer_delegations')).length,0);
});
test('optional acquisition and discovery opt-in remain explicit and stop employer probes',async()=>{
 const f=await fixture({count:1});f.source.automation.employerCrawl=false;await f.worker.ref('sources',f.source.id).set(payload(f.source));
 await f.worker.run(f.source.id);assert.ok(f.state.requests.every(url=>url.startsWith('https://recentjobs.co.za/')));assert.deepEqual(f.state.extracted,[]);
 assert.equal((await f.rows('worker_origin_discoveries'))[0].resolution.reason,'ACQUISITION_DISABLED');
 const g=await fixture({count:1});delete g.source.automation.originDiscovery;await g.worker.ref('sources',g.source.id).set(payload(g.source));
 await g.worker.run(g.source.id);assert.ok(g.state.requests.every(url=>url.startsWith('https://recentjobs.co.za/')));assert.equal((await g.rows('worker_origin_discoveries')).length,0);
});
test('cached delegation never outlives parent revocation and does not reset spending',async()=>{
 const f=await fixture({count:1});await f.worker.run(f.source.id);const proof=(await f.rows('employer_delegations'))[0];await f.revoke();
 const result=await f.restart().runJob(f.source.id,await f.recheck());assert.equal(result.reason,'ORIGINAL_NOTICE_UNSUPPORTED');
 assert.equal(f.state.extracted.length,1);assert.equal(f.state.requests.filter(url=>url===f.page).length,1);
 assert.deepEqual(value(await f.worker.ref('employer_delegation_versions',hash(JSON.stringify(proof))).get()),proof);
 assert.equal(value(await f.worker.ref('model_budgets',hash(`${f.source.id}:2026-10-29`)).get()).calls,2);
});
test('parent revocation during model work preserves usage and blocks cache use and drafting',async()=>{
 const f=await fixture({count:1});f.state.onValidate=()=>f.revoke();
 const result=await f.worker.run(f.source.id);assert.ok(result.results.some(r=>r.reason==='ISSUER_TRUST_CHANGED'));
 assert.equal((await f.rows('model_calls')).length,2);assert.equal((await f.rows('worker_decisions')).length,0);
 assert.ok((await f.rows('model_calls')).every(r=>r.state==='received'&&r.usage.totalTokens===20));
});
test('parent revocation during corporate acquisition fences the page request',async()=>{
 const f=await fixture({count:1});f.state.onRobots=async url=>{if(url.includes(f.corp))await f.revoke();};
 const result=await f.worker.run(f.source.id);assert.ok(result.results.some(r=>r.reason==='ISSUER_TRUST_CHANGED'));
 assert.ok(!f.state.requests.includes(f.page));assert.equal((await f.rows('employer_delegations')).length,0);assert.deepEqual(f.state.extracted,[]);
});
test('six-hour expiry requires fresh corporate corroboration and preserves prior proof versions',async()=>{
 const f=await fixture({count:1});await f.worker.run(f.source.id);const old=(await f.rows('employer_delegations'))[0];f.advance(6*3_600_000+1);
 assert.ok((await f.restart().runJob(f.source.id,await f.recheck())).recordId);
 assert.equal(f.state.requests.filter(url=>url===f.page).length,2);assert.equal((await f.rows('employer_delegation_versions')).length,2);
 assert.deepEqual(value(await f.worker.ref('employer_delegation_versions',hash(JSON.stringify(old))).get()),old);
});
test('corroborated tenant authority cannot override a different vacancy; proof diagnostics remain private',async()=>{
 const f=await fixture({count:1});f.cases[0].posting.url=`https://${f.host}/tenant-a/job/9999/`;
 const result=await f.worker.run(f.source.id);assert.ok(result.results.some(r=>r.reason==='ORIGINAL_NOTICE_CONFLICTING'));assert.deepEqual(f.state.extracted,[]);
 const receipt=(await f.rows('worker_origin_discoveries'))[0];assert.equal(receipt.resolution.outcome,'corroborated');
 assert.equal((await f.catalogue.inspect('authored-token','worker_origin_discoveries',receipt.id)).id,receipt.id);
 await f.worker.ref('operators',f.uid).set({active:false,roles:['reviewer']});
 await assert.rejects(f.catalogue.queue('authored-token','employer_delegations'),{code:'FORBIDDEN'});
});
test('probe failure remains an unavailable check, not a closure or unqualified employer assertion',async()=>{
 const f=await fixture({count:1});f.state.failProbe=true;const result=await f.worker.run(f.source.id);
 assert.ok(result.results.some(r=>r.reason==='ORIGIN_DISCOVERY_UNAVAILABLE'));
 const receipt=(await f.rows('worker_origin_discoveries'))[0];assert.equal(receipt.resolution.outcome,'unavailable');
 assert.equal((await f.rows('worker_exceptions'))[0].originDiscoveryId,receipt.id);assert.deepEqual(f.state.extracted,[]);
 assert.equal((await f.rows('employer_delegations')).length,0);assert.ok(!f.state.requests.includes(f.page));
});
test('closed publisher notices fail cheap checks without probing employer origins',async()=>{
 const f=await fixture({count:1});f.cases[0].detailHtml=f.cases[0].detailHtml.replace('30 October 2026','20 October 2026');
 const result=await f.worker.run(f.source.id);assert.ok(result.results.some(r=>r.reason==='NOTICE_NOT_OPEN'));
 assert.ok(f.state.requests.every(url=>url.startsWith('https://recentjobs.co.za/')));assert.equal((await f.rows('worker_origin_discoveries')).length,0);
});
test('concurrent publisher discoveries converge on one current delegation and preserve one authority version',async()=>{
 const f=await fixture({count:1}),sibling={...f.source,id:`publisher_${randomUUID()}`};
 await f.catalogue.registerSource('authored-token',sibling,null,'Authored concurrent publisher policy');
 await f.worker.ref('workers',f.worker.actor).set({...f.grant,sources:[f.source.id,sibling.id]});
 const results=await Promise.all([f.worker.run(f.source.id),f.restart().run(sibling.id)]);
 assert.ok(results.every(r=>r.results.some(job=>job.recordId)));
 const docs=await db.collection('m0_employer_delegations').where('routeKeys','array-contains',`portal:${f.host}`).get();assert.equal(docs.size,1);
 const current=value(docs.docs[0]);
 const versions=(await db.collection('m0_employer_delegation_versions').get()).docs.map(value).filter(r=>r.id===current.id);assert.equal(versions.length,1);
 assert.ok(f.state.requests.filter(url=>url===f.page).length<=2);assert.equal(f.state.extracted.length,2);
});

test('V2 missing-date probes corroborate reviewed corporate authority and reuse exact originals while retaining publisher holds',async()=>{
 const f=await fixture({missingDateEvidence:'shadow_v2'});
 f.cases[0].detailHtml=f.cases[0].detailHtml.replace('<p>Closing date: Not specified</p>','<table><tr><td>Closing date</td><td>Not specified</td></tr></table>');
 const run=await f.worker.run(f.source.id);
 assert.equal((await f.rows('employer_delegations')).length,1);
 const originals=await f.rows('worker_original_resolutions');assert.equal(originals.length,2);
 for(const r of originals){assert.equal(r.resolution.reason,'SOURCE_DEADLINE_UNRESOLVED');assert.equal(r.assessment.version,'missing_publisher_date_v2');assert.equal(r.assessment.admission,'held');assert.ok(r.primarySnapshotId);}
 for(const c of f.cases)assert.equal(f.state.requests.filter(u=>u===c.url).length,1);
 assert.equal(f.state.requests.filter(u=>u===f.page).length,1);
 assert.deepEqual(new Set((await f.rows('worker_origin_discoveries')).map(r=>r.resolution.outcome)),new Set(['corroborated','cached']));
 assert.ok(!run.results.some(r=>r.recordId));assert.ok((await f.rows('worker_exceptions')).every(r=>r.reason==='NOTICE_PRECISION_UNSUPPORTED'&&r.stage==='preflight'));
 for(const name of ['worker_candidates','worker_decisions','drafts','public','model_calls','model_budgets'])assert.equal((await f.rows(name)).length,0);
 assert.deepEqual(f.state.extracted,[]);assert.deepEqual(f.state.validated,[]);
 assert.deepEqual(value(await f.worker.ref('sources',f.source.id).get()),f.source);assert.deepEqual((await f.worker.ref('workers',f.worker.actor).get()).data(),f.grant);
});
test('V2 unknown missing-date portals create one onboarding need across jobs without corporate guesses or authority',async()=>{
 const issuer=`Unreviewed Missing ${randomUUID()}`,f=await fixture({root:false,hint:'name',issuer,missingDateEvidence:'shadow_v2'});
 await f.worker.run(f.source.id);
 const origins=await f.rows('worker_origin_discoveries');assert.equal(origins.length,2);assert.ok(origins.every(r=>r.resolution.reason==='CORPORATE_AUTHORITY_UNQUALIFIED'&&r.snapshots.length===1));
 const need=value(await f.worker.ref('employer_onboarding_needs',onboardingNeedId({issuer,host:null})).get());
 assert.equal(need.state,'needs_evidence');assert.equal(need.observations.length,2);
 assert.deepEqual(new Set(need.observations.map(o=>o.originDiscoveryId)),new Set(origins.map(o=>o.id)));
 assert.ok(!f.state.requests.some(u=>u.includes(f.corp)));assert.equal((await f.rows('employer_delegations')).length,0);
 assert.ok((await f.rows('worker_original_resolutions')).every(r=>r.resolution.reason==='ORIGIN_UNQUALIFIED'&&r.assessment.version==='missing_publisher_date_v2'&&r.primarySnapshotId===null));
 assert.deepEqual(f.state.extracted,[]);assert.deepEqual(f.state.validated,[]);
 const requests=f.state.requests.length;assert.equal((await f.restart().runJob(f.source.id,await f.recheck())).sourceHeld,true);assert.equal(f.state.requests.length,requests);
 assert.equal(value(await f.worker.ref('employer_onboarding_needs',need.id).get()).observations.length,2);
});
test('V1 missing-date policy does not inherit V2 unqualified portal probes',async()=>{
 const f=await fixture({root:false,count:1,missingDateEvidence:'shadow_v1'});await f.worker.run(f.source.id);
 assert.ok(f.state.requests.every(u=>u.startsWith('https://recentjobs.co.za/')));assert.equal((await f.rows('worker_origin_discoveries')).length,0);
 const r=(await f.rows('worker_original_resolutions'))[0];assert.equal(r.resolution.reason,'ORIGIN_UNQUALIFIED');assert.equal(r.assessment.version,'missing_publisher_date_v1');
});
test('V2 unavailable probes retain unavailable evidence without replacing the publisher hold or claiming closure',async()=>{
 const f=await fixture({count:1,missingDateEvidence:'shadow_v2'});f.state.failProbe=true;await f.worker.run(f.source.id);
 const origin=(await f.rows('worker_origin_discoveries'))[0],exception=(await f.rows('worker_exceptions'))[0];
 assert.equal(origin.resolution.outcome,'unavailable');assert.equal(exception.reason,'NOTICE_PRECISION_UNSUPPORTED');assert.equal(exception.stage,'preflight');assert.equal(exception.originDiscoveryId,origin.id);
 assert.equal((await f.rows('worker_original_resolutions'))[0].assessment.availability,'unverified');assert.equal((await f.rows('employer_delegations')).length,0);
 assert.deepEqual(f.state.extracted,[]);assert.ok(!f.state.requests.includes(f.page));
});
test('V2 missing-date probes keep ambiguous timing and revoked grants outside acquisition',async()=>{
 const f=await fixture({count:1,missingDateEvidence:'shadow_v2'});f.cases[0].detailHtml=f.cases[0].detailHtml.replace('Not specified','soon');await f.worker.run(f.source.id);
 assert.ok(f.state.requests.every(u=>u.startsWith('https://recentjobs.co.za/')));assert.equal((await f.rows('worker_origin_discoveries')).length,0);assert.equal((await f.rows('worker_original_resolutions')).length,0);
 const g=await fixture({count:1,missingDateEvidence:'shadow_v2'});g.state.onRobots=async url=>{if(url.includes(g.host))await g.worker.ref('workers',g.worker.actor).set({...g.grant,active:false});};
 await assert.rejects(g.worker.run(g.source.id),{code:'WORKER_FORBIDDEN'});assert.ok(!g.state.requests.includes(g.cases[0].url));assert.equal((await g.rows('worker_origin_discoveries')).length,0);assert.equal((await g.rows('worker_original_resolutions')).length,0);
});
