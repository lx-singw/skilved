import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { RecentJobsWorker } from '../src/recentjobs-worker.mjs';
import { Catalogue } from '../src/store.mjs';
import { getRuntime } from '../src/runtime.mjs';
import { configuration, DomainError } from '../src/config.mjs';
import { RECENTJOBS_INDEX } from '../src/worker-policy.mjs';
import { syntheticExtraction } from './fixtures/recentjobs-model.mjs';
import { GroqError } from '../src/ai/groq.mjs';
import {extractWithProvider} from '../src/ai/provider.mjs';
import {validateExtraction} from '../src/ai/validation.mjs';
import {extractProgramme,validateProgramme} from '../src/ai/programme-extraction.mjs';
import {programmeWire,subjectProgrammeWire} from './fixtures/programme-model.mjs';
import {parseRecentJobsDetail} from '../src/adapters/recentjobs.mjs';
import {qualificationHtml,qualificationWire,qualificationSpan,qualificationPassage} from './fixtures/qualification-model.mjs';
import {metadataHtml,metadataWire} from './fixtures/metadata-completeness.mjs';
import {locationHtml,locationWire} from './fixtures/location-metadata.mjs';
import {completenessHtml,completenessWire,completenessExtraction} from './fixtures/location-completeness.mjs';
import {extractMetadata} from '../src/ai/metadata.mjs';
import {spanHtml,spanWire,titleSpanHtml,titleSpanWire,titleSpanCandidate,workBase} from './fixtures/location-span-hints.mjs';
import {residenceHtml,residenceWire,residenceExtraction,residenceSpan,citizenship} from './fixtures/residence-model.mjs';
import {submissionHtml,submissionWire,submissionCandidate} from './fixtures/submission-competency.mjs';
import {decodeGroqExtraction} from '../src/ai/groq-schema.mjs';
import {undatedHistoryHash} from '../src/undated-origin-import.mjs';
import {boundDetail,boundBody} from './fixtures/recentjobs-bound-detail.mjs';
import {GEMINI_MODEL_CHAIN} from '../src/ai/gemini-models.mjs';
import {labelHtml,labelCandidate,labelWire,labelSpan,labelLines} from './fixtures/source-labels.mjs';
import {noticeHtml,noticeWire,invitation,regionalBenefits} from './fixtures/notice-metadata.mjs';
import {geminiQuotaScope} from '../src/ai/gemini-quota.mjs';
import {assertGeminiRequestAuthority} from '../src/ai/gemini-authority.mjs';

let runtime, db;
const payload = v => ({ json: JSON.stringify(v) });
const value = s => s.exists ? JSON.parse(s.data().json) : null;
const detailUrl = 'https://recentjobs.co.za/2026/09/26/fictional-apprentice/';
const detailHtml = await readFile(new URL('./fixtures/recentjobs-synthetic.html', import.meta.url), 'utf8');
const programmeHtml = await readFile(new URL('./fixtures/recentjobs-programmes.html',import.meta.url),'utf8');
const listing = `<div class="articles-wrap"><article class="type-post"><h2 class="entry-title"><a href="${detailUrl}">Fictional apprentice</a></h2></article></div>`;
const primaryHtml = (issuer = 'Fictional Workshop') => `<script type="application/ld+json">${JSON.stringify({ '@type': 'JobPosting',
  title: 'Electrical apprentice', hiringOrganization: { name: issuer }, validThrough: '2026-10-30',
  description: 'Fictional Workshop seeks an electrical apprentice. Applicants require Grade 12 with Mathematics OR N3 Electrical.',
})}</script>`;

before(async () => {
  // Separate synthetic namespace prevents collisions with catalogue.test.mjs's record-count assertions.
  process.env.SKILVED_CATALOGUE_MODE = 'emulator'; process.env.SKILVED_CATALOGUE_PROJECT = 'demo-skilved-worker';
  configuration(); runtime = await getRuntime(); db = runtime.db;
});
after(async () => { await db?.terminate(); });

function authorityOptions(f, providerProject = `authored-${randomUUID()}`, limits = {}) {
  const env = {...geminiEnv, SKILVED_GEMINI_PROJECT_ID:providerProject,
    SKILVED_GEMINI_AUTHORITY_PROJECT:db.projectId, SKILVED_GEMINI_AUTHORITY_EPOCH:'a'.repeat(64),
    SKILVED_GEMINI_MODEL_LIMITS:JSON.stringify(limits)};
  const record = {version:1,provider:'gemini',scopeHash:geminiQuotaScope(env),projectId:db.projectId,
    epoch:env.SKILVED_GEMINI_AUTHORITY_EPOCH,status:'active',migrationSha256:'b'.repeat(64),
    quotaSha256:'c'.repeat(64),activatedAt:f.now()};
  return {env,record,ref:db.collection('m0_model_authorities').doc(record.scopeHash),
    options:{provider:'gemini',env}};
}

test('authority fencing blocks missing, revoked and stale workers before scheduling or quota writes', async () => {
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false}),a=authorityOptions(f);
  const worker=f.restart(a.options);
  for (const change of [null,{status:'revoked'},{epoch:'d'.repeat(64)}]) {
    if(change)await a.ref.set(payload({...a.record,...change}));
    await assert.rejects(worker.run(f.sourceId), {code:change?'GEMINI_QUOTA_AUTHORITY_STALE':'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
    assert.equal((await worker.ref('worker_leases',f.sourceId).get()).exists,false);
    assert.equal((await worker.ref('model_budgets',createHash('sha256').update(`${f.sourceId}:2026-09-26`).digest('hex')).get()).exists,false);
  }
  assert.deepEqual(f.state.requests,[]); assert.equal(f.state.modelCalls,0);
  await a.ref.set(payload(a.record));
  const id=await worker.schedule(f.sourceId); assert.ok(await worker.claim(f.sourceId,id));
  await a.ref.set(payload({...a.record,status:'revoked'}));
  await assert.rejects(worker.holdModelForDay(f.sourceId,'gemini-3.8-flash'), {code:'GEMINI_QUOTA_AUTHORITY_STALE'});
  assert.equal((await worker.ref('model_availability',worker.modelAvailabilityId('gemini-3.8-flash')).get()).exists,false);
});

test('authority revocation during source pacing prevents the external fetch', async () => {
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false}),a=authorityOptions(f);
  await a.ref.set(payload(a.record));
  const worker=f.restart({...a.options,sleep:async()=>a.ref.set(payload({...a.record,status:'revoked'}))});
  const claim=await worker.claim(f.sourceId,await worker.schedule(f.sourceId));
  await assert.rejects(worker.request(claim,RECENTJOBS_INDEX,'html'),{code:'GEMINI_QUOTA_AUTHORITY_STALE'});
  assert.deepEqual(f.state.requests,[]); assert.equal(f.state.modelCalls,0);
});

test('only a committed worker reservation supplies transport admission context', async () => {
  const f=await fixture({mode:'shadow',publisher:false}),a=authorityOptions(f);
  await a.ref.set(payload(a.record));const worker=f.restart(a.options);
  const claim=await worker.claim(f.sourceId,await worker.schedule(f.sourceId));
  assert.throws(()=>assertGeminiRequestAuthority(a.env,true),{code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
  await worker.modelCall(claim,'extract',async()=>{
    assert.doesNotThrow(()=>assertGeminiRequestAuthority(a.env,true));
    return {provenance:{usage:{inputTokens:1,totalTokens:2}}};
  },{model:'gemini-3.8-flash'});
  assert.throws(()=>assertGeminiRequestAuthority(a.env,true),{code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
});

test('separate workers sharing one authority cannot both reserve the last provider request', async () => {
  const f=await fixture({mode:'shadow',publisher:false}),g=await fixture({mode:'shadow',publisher:false});
  const a=authorityOptions(f,`authored-${randomUUID()}`,{'gemini-3.8-flash':{rpd:1}});
  await a.ref.set(payload(a.record));
  const workers=[f.restart(a.options),g.restart(a.options)];
  const claims=await Promise.all(workers.map(async(w,i)=>w.claim([f,g][i].sourceId,await w.schedule([f,g][i].sourceId))));
  let sends=0;
  const result=await Promise.allSettled(workers.map((w,i)=>w.modelCall(claims[i],'extract',async()=>{
    sends++; return {provenance:{usage:{inputTokens:3,totalTokens:5}}};
  },{model:'gemini-3.8-flash'})));
  assert.equal(sends,1);assert.equal(result.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(result.find(r=>r.status==='rejected').reason.code,'AI_RATE_LIMITED');
  const id=createHash('sha256').update(`${a.record.scopeHash}:gemini-3.8-flash:2026-09-26`).digest('hex');
  const usage=value(await workers[0].ref('model_usage',id).get());
  assert.equal(usage.requests,1);assert.equal(usage.knownTotalTokens,5);
  await a.ref.set(payload({...a.record,epoch:'e'.repeat(64)}));
  await assert.rejects(workers[0].modelCall(claims[0],'extract',()=>assert.fail('stale model send'),{model:'gemini-3.8-flash'}),
    {code:'GEMINI_QUOTA_AUTHORITY_STALE'});
  assert.deepEqual(value(await workers[0].ref('model_usage',id).get()),usage);
});

test('bounded documents and required competency details gate candidate storage, validation and drafting',async()=>{
 for(const scenario of ['missing_documents','missing_competency','wrong_knowledge_kind','optional_competency','complete']){
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=submissionHtml;
  f.worker.extractor=async()=>{
   f.state.modelCalls++;const x=decodeGroqExtraction(submissionWire(),submissionCandidate);
   if(scenario==='missing_documents')x.practicalConditions={state:'not_stated',value:null,quote:null};
   if(scenario==='missing_competency'){
    x.requirements.items=x.requirements.items.filter(i=>i.id!=='c8');x.requirements.expression.children=x.requirements.expression.children.filter(n=>n.id!=='c8');
   }
   if(scenario==='wrong_knowledge_kind')x.requirements.items.find(i=>i.id==='k').kind='education';
   if(scenario==='optional_competency'){
    x.requirements.expression.children=x.requirements.expression.children.filter(n=>n.id!=='c0');
    x.requirements.expression.children.push({op:'any',children:[{op:'ref',id:'c0'},{op:'ref',id:'p'}]});
   }
   return {extraction:x,provenance:{usage:{totalTokens:20}}};
  };
  f.worker.validator=async()=>{f.state.validations++;return {supported:true,issues:[],evidence:[{source:'recentjobs',quote:submissionCandidate.title}],provenance:{usage:{totalTokens:20}}};};
  const drafts=(await db.collection('m0_drafts').get()).size,publicRows=(await db.collection('m0_public').get()).size;
  const result=await f.worker.run(f.sourceId);assert.equal(f.state.modelCalls,1);
  if(scenario==='complete'){
   const record=detailResult(result);assert.ok(record,JSON.stringify(result.results));assert.equal(f.state.validations,1);assert.equal(record.published,false);
   const draft=value(await f.worker.ref('drafts',record.recordId).get());assert.equal(draft.publication.approved,false);assert.equal(draft.applicationRoute.value.destination,'https://employer.example/apply');
  }else{
   const reason={missing_documents:'AI_SUBMISSION_INSTRUCTION_COVERAGE',missing_competency:'AI_REQUIREMENT_COVERAGE',wrong_knowledge_kind:'AI_REQUIREMENT_KIND_UNRESOLVED',optional_competency:'AI_REQUIREMENT_CONJUNCTION_UNRESOLVED'}[scenario];
   assert.ok(result.results.some(r=>r.reason===reason),JSON.stringify(result.results));assert.equal(f.state.validations,0);
   const exception=(await db.collection('m0_worker_exceptions').get()).docs.map(value).find(e=>e.sourceId===f.sourceId);
   assert.equal((await f.worker.ref('worker_candidates',exception.jobId).get()).exists,false);assert.equal((await db.collection('m0_drafts').get()).size,drafts);
  }
  assert.equal((await db.collection('m0_public').get()).size,publicRows);assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
 }
});

async function fixture({ mode = 'automatic', calls = 10, publisher = true, cadenceHours = 24, employerCrawl = true } = {}) {
  const sourceId = `source_${randomUUID()}`, principal = `${randomUUID()}@example.test`;
  let now = '2026-09-26T10:00:00.000Z';
  const state = { requests: [], modelCalls: 0, validations: 0, html: detailHtml, listing, primary: primaryHtml(),
    denyRobots: false, denyPrimaryRobots: false, failPrimary: false, supported: true, afterValidation: null };
  const options = { now: () => now, sleep: async () => {},
    fetcher: async (_source, url, _io, format) => {
      state.requests.push({ url, format });
      if (url.endsWith('/robots.txt')) return { url, text: `User-agent: *\n${state.denyRobots || (state.denyPrimaryRobots && url.startsWith('https://employer.example/')) ? 'Disallow: /' : 'Allow: /'}` };
      if (url === RECENTJOBS_INDEX) return { url, text: state.listing };
      if (url === detailUrl) return { url, text: state.html };
      if (url === 'https://employer.example/apply') {
        if (state.failPrimary) throw new DomainError('UNSUPPORTED_RESPONSE');
        return { url, text: state.primary };
      }
      assert.fail(`Unexpected fetch ${url}`);
    },
    extractor: async (_candidate, config) => { state.extractionThinking = config.env.SKILVED_AI_THINKING; state.modelCalls++; return { extraction: syntheticExtraction(), provenance: { model: 'synthetic', usage: { totalTokens: 20 } } }; },
    validator: async ({ primary }, config) => {
      state.validationThinking = config.env.SKILVED_AI_VALIDATION_THINKING;
      state.validations++; await state.afterValidation?.();
      return { supported: state.supported, issues: state.supported ? [] : [{ field: 'requirements', reason: 'Synthetic mismatch' }],
        evidence: [{ source: 'recentjobs', quote: 'Grade 12 with Mathematics OR N3 Electrical' }, ...(primary ? [{ source: 'primary', quote: 'Fictional Workshop' }] : [])],
        provenance: { model: 'synthetic', usage: { totalTokens: 20 } } };
    } };
  const worker = new RecentJobsWorker(db, principal, options);
  const source = { id: sourceId, revision: 1, name: 'Synthetic RecentJobs test', urls: [RECENTJOBS_INDEX],
    permission: { reference: 'Authored test evidence', method: 'recentjobs_html', reuse: 'Synthetic test only, including primary fixtures', reviewedAt: now },
    categories: ['apprenticeship'], owner: 'fixture_owner', paused: false, cadenceHours, maxBytes: 500000,
    automation: { mode, employerCrawl, qualificationRef: 'Synthetic evaluation only, not live qualification', maxArticles: 10,
      maxModelCallsPerDay: calls, minRequestIntervalMs: 2000, checkTtlHours: 24,
      issuers: [{ name: 'Fictional Workshop', host: 'employer.example', pathPrefix: '/apply', evidence: 'Synthetic issuer relationship' }] } };
  await worker.ref('sources', sourceId).set(payload(source));
  await worker.ref('workers', worker.actor).set({ principal, active: true, sources: [sourceId], roles: publisher ? ['ingest', 'publish'] : ['ingest'] });
  const catalogue = new Catalogue(db, null, () => now);
  return { worker, state, source, sourceId, catalogue, advance: ms => { now = new Date(Date.parse(now) + ms).toISOString(); },
    restart: (overrides = {}) => new RecentJobsWorker(db, principal, { ...options, ...overrides }), now: () => now };
}
const detailResult = result => result.results.find(r => r.recordId);

const sourceHoldId = f => createHash('sha256').update(`${f.sourceId}:${detailUrl}`).digest('hex');
const missingDeadline = () => detailHtml.replace('<p>Closing date: 30 October 2026</p>', '<p>Closing date: not stated</p>');
const sourceRows = async (f, collection) => (await db.collection(`m0_${collection}`).get()).docs.map(value).filter(x => x.sourceId === f.sourceId);

test('an explicitly written compound-location country cannot disappear before validation or private drafting',async()=>{
  const place='Job Location: Exampletown – Gauteng – South Africa';
  for(const complete of [false,true]){
    const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});
    f.state.html=detailHtml.replace('<p>Closing date:',`<p>${place}</p><p>Closing date:`);
    f.worker.extractor=async()=>{
      f.state.modelCalls++;const x=syntheticExtraction();x.location={state:'stated',quote:place,value:{places:[{city:'Exampletown',province:'gauteng',country:complete?'ZA':null}],coverage:'not_stated',attendance:'not_stated',relocation:null}};
      return {extraction:x,provenance:{usage:{totalTokens:20}}};
    };
    const result=await f.worker.run(f.sourceId);assert.equal(f.state.modelCalls,1);
    if(!complete){
      assert.ok(result.results.some(r=>r.reason==='AI_LOCATION_COMPLETENESS_UNRESOLVED'));assert.equal(f.state.validations,0);
      const job=(await sourceRows(f,'worker_jobs')).find(j=>j.kind==='detail');
      assert.equal((await f.worker.ref('worker_candidates',job.id).get()).exists,false);
      assert.equal((await f.worker.ref('drafts',job.recordId).get()).exists,false);
      assert.equal((await f.worker.ref('public',job.recordId).get()).exists,false);
    }else{
      const row=detailResult(result);assert.ok(row);assert.equal(f.state.validations,1);assert.equal(row.published,false);
      const record=value(await f.worker.ref('drafts',row.recordId).get());assert.equal(record.location.value.places[0].country,'ZA');
      assert.equal(record.applicationRoute.value.destination,'https://employer.example/apply');
    }
    assert.equal((await sourceRows(f,'model_calls')).length,complete?2:1);
  }
});

test('source-label checks stop incomplete skills, qualification groups and location evidence before validation or private drafting',async()=>{
  for(const scenario of ['missing_skill','incomplete_location','split_qualification','complete']) {
    const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=labelHtml;
    f.worker.extractor=async()=>{f.state.modelCalls++;const raw=labelWire();
      if(scenario==='missing_skill'){raw.requirements.items.shift();raw.requirements.expression='all(s2,q)';}
      if(scenario==='incomplete_location')raw.location.span=labelSpan(labelLines[1]);
      if(scenario==='split_qualification'){
        const q=raw.requirements.items.pop();raw.requirements.items.push(...labelLines.slice(9,12).map((text,index)=>({...q,id:'q'+index,kind:index?'subjects':'education',span:labelSpan(text)})));
        raw.requirements.expression='all(s1,s2,q0,q1,q2)';
      }
      return {extraction:decodeGroqExtraction(raw,labelCandidate),provenance:{model:'synthetic',usage:{totalTokens:15}}};};
    f.worker.validator=async()=>{f.state.validations++;return {supported:true,issues:[],evidence:[{source:'recentjobs',quote:labelCandidate.title}],provenance:{model:'synthetic',usage:{totalTokens:15}}};};
    const result=await f.worker.run(f.sourceId),job=(await sourceRows(f,'worker_jobs')).find(j=>j.kind==='detail');assert.equal(f.state.modelCalls,1);
    if(scenario==='complete') {
      const row=detailResult(result);assert.ok(row);assert.equal(row.published,false);assert.equal(f.state.validations,1);
      const draft=value(await f.worker.ref('drafts',row.recordId).get());assert.equal(draft.requirements.requirements.length,3);assert.equal(draft.compensation.length,2);
      assert.equal(draft.location.value.attendance,'in_person');assert.equal(draft.publication.approved,false);
    }else{
      const reason={missing_skill:'AI_REQUIREMENT_COVERAGE',incomplete_location:'AI_LOCATION_EVIDENCE_UNRESOLVED',split_qualification:'AI_REQUIREMENT_GROUP_UNRESOLVED'}[scenario];
      assert.ok(result.results.some(r=>r.reason===reason));
      assert.equal(f.state.validations,0);assert.equal((await f.worker.ref('worker_candidates',job.id).get()).exists,false);
      assert.equal((await f.worker.ref('drafts',job.recordId).get()).exists,false);
    }
    assert.equal((await f.worker.ref('public',job.recordId).get()).exists,false);assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
  }
});

test('notice metadata omissions stop before cache or validation and complete scoped evidence reaches only a private draft',async()=>{
  for(const [reason,change]of [
    ['AI_SOURCE_REFERENCE_UNRESOLVED',x=>{x.intake=null;}],
    ['AI_AUDIENCE_UNRESOLVED',x=>{x.summary.value='An apprenticeship programme.';}],
    ['AI_REGIONAL_BENEFITS_UNRESOLVED',x=>{x.compensation=[];}],
    ['AI_SUMMARY_EVIDENCE_UNRESOLVED',x=>{x.summary.value+=' In Gauteng.';}],
    ['AI_LOCATION_EVIDENCE_UNRESOLVED',x=>{x.compensation=[{...x.compensation[0],value:{...x.compensation[0].value,coverage:regionalBenefits}}];x.location.span=[x.location.span[0],x.location.span[0]];}],
    [null,()=>{}],
    [null,x=>{x.compensation=[{...x.compensation[0],value:{...x.compensation[0].value,coverage:regionalBenefits}}];}]
  ]) {
    const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=noticeHtml;
    const wire=noticeWire(),completeLocationSpan=[...wire.location.span];change(wire);const before=structuredClone(wire);let sends=0;
    const worker=f.restart(geminiOptions(async(_url,init)=>{
      sends++;const input=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);
      if(!input.extracted)assert.deepEqual(input.locationSpanHints.recommendedSpan,completeLocationSpan);
      return geminiAnswer(input.extracted?{supported:true,issues:[],evidence:[{source:'recentjobs',quote:invitation}]}:wire);
    }));
    const cache=(await db.collection('m0_model_cache').get()).size,drafts=(await db.collection('m0_drafts').get()).size,publicRows=(await db.collection('m0_public').get()).size;
    const result=await worker.run(f.sourceId),calls=await sourceRows(f,'model_calls');assert.equal(sends,reason?1:2);
    assert.equal(calls.length,sends);assert.equal(calls.reduce((n,c)=>n+c.usage.totalTokens,0),sends*15);assert.deepEqual(wire,before);
    assert.equal((await sourceRows(f,'model_budgets'))[0].calls,sends);
    if(reason) {
      assert.ok(result.results.some(r=>r.reason===reason));assert.equal(calls[0].stage,'extraction');
      assert.equal((await worker.ref('worker_candidates',calls[0].jobId).get()).exists,false);
      assert.equal((await db.collection('m0_model_cache').get()).size,cache);assert.equal((await db.collection('m0_drafts').get()).size,drafts);
    }else{
      const row=detailResult(result);assert.ok(row);const draft=value(await worker.ref('drafts',row.recordId).get());
      assert.equal(draft.intake.value,'APP/TEST-042');assert.equal(draft.summary.value,invitation);
      assert.ok(draft.compensation.every(fact=>fact.originalText===regionalBenefits&&fact.value.amount===null));
      assert.equal(draft.applicationRoute.value.destination,'https://employer.example/apply');assert.equal(draft.publication.approved,false);
    }
    assert.equal((await db.collection('m0_public').get()).size,publicRows);assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
  }
});

async function undatedFixture({publishedAt='2026-09-26T09:00:00+00:00',ttl=24}={}) {
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false,cadenceHours:1});
  f.state.html=detailHtml.replace('<p>Closing date: 30 October 2026</p>','')
    .replace('<h1 class="entry-title">',`<time class="published" datetime="${publishedAt}">Authored publication date</time><h1 class="entry-title">`);
  f.source.automation.undatedNotices='shadow_recent';f.source.automation.checkTtlHours=ttl;
  await f.worker.ref('sources',f.sourceId).set(payload(f.source));
  f.options={extractor:async()=>{f.state.modelCalls++;const extraction=syntheticExtraction();
    extraction.deadline={state:'not_stated',value:null,quote:null};return {extraction,provenance:{model:'synthetic',usage:{totalTokens:20}}};}};
  f.worker=f.restart(f.options);return f;
}

test('recent undated shadow notices create unapproved private drafts with honest unknown deadlines and expiry',async()=>{
  const f=await undatedFixture(),result=detailResult(await f.worker.run(f.sourceId));assert.ok(result);assert.equal(result.published,false);
  const draft=value(await f.worker.ref('drafts',result.recordId).get()),decision=(await sourceRows(f,'worker_decisions'))[0];
  assert.equal(draft.deadline.state,'not_stated');assert.equal(draft.deadline.value,null);assert.equal(draft.deadline.originalText,null);
  assert.equal(draft.lifecycle,'review');assert.equal(draft.publication.approved,false);assert.deepEqual(draft.checks,[]);
  assert.equal(draft.applicationRoute.value.destination,'https://employer.example/apply');
  assert.equal(decision.decision,'undated_shadow_pass');assert.equal(decision.deadlinePolicy,'undated_shadow_v1');
  assert.equal(decision.availability,'unverified');assert.equal(decision.reviewExpiresAt,'2026-09-27T10:00:00.000Z');
  assert.equal(decision.sourceRetrievedAt,f.now());assert.equal(f.state.modelCalls,1);assert.equal(f.state.validations,1);
  assert.equal((await f.worker.ref('public',result.recordId).get()).exists,false);assert.equal((await sourceRows(f,'worker_watches')).length,0);
  assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
});

test('opting into undated shadow assessment with a source revision releases the old negative hold',async()=>{
  const f=await undatedFixture();delete f.source.automation.undatedNotices;
  await f.worker.ref('sources',f.sourceId).set(payload(f.source));
  assert.ok((await f.worker.run(f.sourceId)).results.some(r=>r.reason==='NOTICE_PRECISION_UNSUPPORTED'));assert.equal(f.state.modelCalls,0);
  const hold=value(await f.worker.ref('worker_holds',sourceHoldId(f)).get());
  f.source.revision++;f.source.automation.undatedNotices='shadow_recent';await f.worker.ref('sources',f.sourceId).set(payload(f.source));f.advance(3600000);
  const result=detailResult(await f.restart(f.options).run(f.sourceId));assert.ok(result);assert.equal(result.published,false);
  assert.equal(value(await f.worker.ref('worker_jobs',hold.jobId).get()).state,'exception');
  assert.deepEqual(value(await f.worker.ref('worker_holds',sourceHoldId(f)).get()),hold);
});

test('stale undated articles stop before AI and their freshness holds survive worker restart',async()=>{
  const f=await undatedFixture({publishedAt:'2026-09-19T10:00:00Z'});
  assert.ok((await f.worker.run(f.sourceId)).results.some(r=>r.reason==='UNDATED_NOTICE_FRESHNESS_REQUIRED'));
  const hold=value(await f.worker.ref('worker_holds',sourceHoldId(f)).get());assert.equal(hold.reason,'UNDATED_NOTICE_FRESHNESS_REQUIRED');
  f.advance(3600000);assert.ok((await f.restart(f.options).run(f.sourceId)).results.some(r=>r.sourceHeld));
  assert.equal(f.state.requests.filter(r=>r.url===detailUrl).length,1);assert.equal(f.state.modelCalls,0);assert.equal(f.state.validations,0);
});

test('undated expiry is rechecked inside the draft commit after a supported model assessment',async()=>{
  const f=await undatedFixture({publishedAt:'2026-09-19T10:01:00Z'}),finish=f.worker.finish.bind(f.worker);
  const cacheBefore=(await db.collection('m0_model_cache').get()).size;
  f.worker.finish=async(claim,result,write)=>{if(result.recordId)f.advance(120000);return finish(claim,result,write);};
  const result=await f.worker.run(f.sourceId);assert.ok(result.results.some(r=>r.reason==='UNDATED_NOTICE_FRESHNESS_REQUIRED'));
  assert.equal(f.state.modelCalls,1);assert.equal(f.state.validations,1);assert.equal((await sourceRows(f,'worker_decisions')).length,0);
  const job=(await sourceRows(f,'worker_jobs')).find(j=>j.kind==='detail');assert.equal((await f.worker.ref('drafts',job.recordId).get()).exists,false);
  assert.equal((await db.collection('m0_model_cache').get()).size,cacheBefore+2);
  assert.equal((await f.worker.ref('worker_candidates',job.id).get()).exists,true);
  assert.equal((await f.worker.ref('public',job.recordId).get()).exists,false);
});

test('unchanged retries preserve their first acquisition and cannot renew an undated review window',async()=>{
  const f=await undatedFixture({ttl:1});
  f.worker.validator=async()=>{f.state.validations++;throw new DomainError('UNSUPPORTED_RESPONSE');};
  const first=await f.worker.run(f.sourceId);assert.ok(first.results.some(r=>r.reason==='UNSUPPORTED_RESPONSE'));
  const original=(await sourceRows(f,'worker_jobs')).find(j=>j.kind==='detail');assert.equal(original.state,'pending');
  assert.equal(original.sourceRetrievedAt,'2026-09-26T10:00:00.000Z');f.advance(3600000);
  const result=await f.restart(f.options).runJob(f.sourceId,original.id);assert.equal(result.reason,'UNDATED_NOTICE_FRESHNESS_REQUIRED');
  const retried=value(await f.worker.ref('worker_jobs',original.id).get());assert.equal(retried.sourceRetrievedAt,original.sourceRetrievedAt);
  assert.equal(retried.snapshotId,original.snapshotId);assert.equal(f.state.modelCalls,1);assert.equal(f.state.validations,1);
  assert.equal(f.state.requests.filter(r=>r.url===detailUrl).length,2);assert.equal((await f.worker.ref('drafts',original.recordId).get()).exists,false);
});

test('undated shadow assessment still rejects semantic failures without drafting or claiming a source hold',async()=>{
  const f=await undatedFixture();f.state.supported=false;
  assert.ok((await f.worker.run(f.sourceId)).results.some(r=>r.reason==='SEMANTIC_VALIDATION_FAILED'));
  const job=(await sourceRows(f,'worker_jobs')).find(j=>j.kind==='detail');
  assert.equal(f.state.modelCalls,1);assert.equal(f.state.validations,1);
  assert.equal((await f.worker.ref('drafts',job.recordId).get()).exists,false);assert.equal((await f.worker.ref('worker_holds',sourceHoldId(f)).get()).exists,false);
});

async function boundedUndatedFixture({wording='Closing date: not stated',publishedAt,ttl=6}={}) {
  const f=await undatedFixture({...(publishedAt?{publishedAt}:{}),ttl});
  f.source.automation.undatedNotices='shadow_recent_v2';
  f.state.html=f.state.html.replace('<a href=',`<p>${wording}</p><a href=`)
    .replace('https://employer.example/apply',`https://employer.example/apply/${f.sourceId}`);
  f.url=detailUrl.replace('fictional-apprentice/',`fictional-apprentice-${f.sourceId.replaceAll('_','-')}/`);
  f.state.listing=listing.replace(detailUrl,f.url);
  f.options={...f.options,fetcher:async(_source,url,_io,format)=>{
    f.state.requests.push({url,format});
    if(url.endsWith('/robots.txt'))return {url,text:'User-agent: *\nAllow: /'};
    if(url===RECENTJOBS_INDEX)return {url,text:f.state.listing};
    if(url===f.url)return {url,text:f.state.html};
    assert.fail(`Unexpected V2 fixture fetch ${url}`);
  }};
  f.worker=f.restart(f.options);await f.worker.ref('sources',f.sourceId).set(payload(f.source));return f;
}

test('V2 holds captured V1 history before AI and resumes only after authenticated matching origin import',async()=>{
  const f=await boundedUndatedFixture({wording:''});f.source.automation.undatedNotices='shadow_recent';
  await f.worker.ref('sources',f.sourceId).set(payload(f.source));
  const first=detailResult(await f.worker.run(f.sourceId));assert.ok(first);
  const draft=value(await f.worker.ref('drafts',first.recordId).get()),spent=(await sourceRows(f,'model_calls')).length;
  f.source.revision++;f.source.automation.undatedNotices='shadow_recent_v2';
  await f.worker.ref('sources',f.sourceId).set(payload(f.source));f.advance(3600000);
  const result=await f.restart(f.options).run(f.sourceId);
  assert.ok(result.results.some(r=>r.reason==='UNDATED_ORIGIN_IMPORT_REQUIRED'),JSON.stringify(result));
  assert.equal((await sourceRows(f,'model_calls')).length,spent);
  assert.equal((await sourceRows(f,'worker_notice_origins')).length,0);
  assert.deepEqual(value(await f.worker.ref('drafts',first.recordId).get()),draft);
  const jobs=(await sourceRows(f,'worker_jobs')).filter(j=>j.sourceRetrievedAt).sort((a,b)=>a.sourceRetrievedAt.localeCompare(b.sourceRetrievedAt));
  const uid='origin_operator_'+randomUUID(),store=new Catalogue(db,{verifyIdToken:async()=>({uid})},f.now);
  await f.worker.ref('operators',uid).set({active:true,roles:['source']});
  const review={sourceId:f.sourceId,sourceRevision:f.source.revision,url:f.url,html:f.state.html,
    expectedFirstJobId:jobs[0].id,decisionJobId:jobs[0].id,expectedHistoryHash:undatedHistoryHash(jobs)};
  const imported=await store.importUndatedOrigin('synthetic_operator_token',review,'Reviewed synthetic V1 history including held capture');
  const hold=(await sourceRows(f,'worker_holds'))[0];assert.equal(hold.reason,'UNDATED_ORIGIN_IMPORT_REQUIRED');
  const requests=f.state.requests.length;
  await f.worker.ref('worker_notice_origins',imported.originKeys[1]).delete();f.advance(3600000);
  assert.ok((await f.restart(f.options).run(f.sourceId)).results.some(r=>r.sourceHeld));
  assert.equal((await sourceRows(f,'model_calls')).length,spent);assert.equal(f.state.requests.length,requests+2);
  // Discovery still reads robots/index; the held detail makes no request.
  await f.worker.ref('worker_notice_origins',imported.originKeys[1]).create(payload(imported.origin));
  f.advance(3600000);const resumed=detailResult(await f.restart(f.options).run(f.sourceId));assert.ok(resumed);
  assert.deepEqual((await sourceRows(f,'worker_holds'))[0],hold);
  const decision=value(await f.worker.ref('worker_decisions',(await sourceRows(f,'worker_jobs')).find(j=>j.recordId===resumed.recordId&&j.sourceRetrievedAt===f.now()).id).get());
  assert.equal(decision.firstSeenAt,jobs[0].sourceRetrievedAt);assert.equal(decision.deadlinePolicy,'undated_shadow_v2');
  assert.equal(imported.origin.firstSeenAt,jobs[0].sourceRetrievedAt);
  assert.equal((await sourceRows(f,'model_calls')).length,spent+2);
});

test('V2 stores two immutable private origin bindings and a six-hour decision, with no public checks or watch',async()=>{
  for(const wording of ['', 'Closing date: not specified']) {
    const f=await boundedUndatedFixture({wording}),result=await f.worker.run(f.sourceId),row=detailResult(result);assert.ok(row,JSON.stringify(result.results));
    const decision=(await sourceRows(f,'worker_decisions'))[0],origins=await sourceRows(f,'worker_notice_origins');
    assert.equal(origins.length,2);assert.deepEqual(origins[0],origins[1]);assert.equal(origins[0].firstSeenAt,f.now());
    assert.equal(origins[0].sourcePublishedAt,'2026-09-26T09:00:00.000Z');
    assert.equal(decision.deadlinePolicy,'undated_shadow_v2');assert.equal(decision.reviewExpiresAt,'2026-09-26T16:00:00.000Z');
    assert.equal(decision.timingEvidence.state,wording?'explicitly_unspecified':'absent');
    const draft=value(await f.worker.ref('drafts',row.recordId).get());assert.equal(draft.deadline.state,'not_stated');
    assert.equal(draft.publication.approved,false);assert.deepEqual(draft.checks,[]);assert.equal(row.published,false);
    assert.equal((await sourceRows(f,'worker_watches')).length,0);assert.equal((await f.worker.ref('public',row.recordId).get()).exists,false);
    assert.equal(f.state.modelCalls,1);assert.equal(f.state.validations,1);
  }
});

test('V2 source rechecks retain origin age and reuse bound caches across new jobs and restarts',async()=>{
  const f=await boundedUndatedFixture(),first=detailResult(await f.worker.run(f.sourceId));assert.ok(first);
  const origins=await sourceRows(f,'worker_notice_origins');f.advance(3600000);
  const second=detailResult(await f.restart(f.options).run(f.sourceId));assert.ok(second);
  assert.deepEqual(await sourceRows(f,'worker_notice_origins'),origins);
  const decisions=await sourceRows(f,'worker_decisions');assert.equal(decisions.length,2);
  assert.ok(decisions.every(d=>d.firstSeenAt==='2026-09-26T10:00:00.000Z'));
  assert.equal(decisions.find(d=>d.at===f.now()).reviewExpiresAt,'2026-09-26T17:00:00.000Z');
  assert.equal(f.state.modelCalls,1);assert.equal(f.state.validations,1);assert.equal((await sourceRows(f,'model_calls')).length,2);
});

test('V2 new job and revised source cannot retime publication, change route or silently replace an intake',async()=>{
  for(const mutate of [s=>s.replace('2026-09-26T09:00:00+00:00','2026-09-26T10:30:00Z'),
    s=>s.replace('/apply/source_', '/apply/replacement_source_'),
    s=>s.replace('Fictional electrical apprentice','Another fictional apprentice intake')]) {
    const f=await boundedUndatedFixture(),first=detailResult(await f.worker.run(f.sourceId));assert.ok(first);
    const origins=await sourceRows(f,'worker_notice_origins'),draft=value(await f.worker.ref('drafts',first.recordId).get());
    f.state.html=mutate(f.state.html);f.source.revision++;await f.worker.ref('sources',f.sourceId).set(payload(f.source));f.advance(3600000);
    const result=await f.restart(f.options).run(f.sourceId);assert.ok(result.results.some(r=>r.reason==='UNDATED_NOTICE_ORIGIN_CONFLICT'));
    assert.deepEqual(await sourceRows(f,'worker_notice_origins'),origins);assert.deepEqual(value(await f.worker.ref('drafts',first.recordId).get()),draft);
    assert.equal(f.state.modelCalls,1);assert.equal(f.state.validations,1);
  }
});

test('V2 global origin keys stop a replacement source ID and a different URL using the same original route',async()=>{
  const f=await boundedUndatedFixture(),first=detailResult(await f.worker.run(f.sourceId));assert.ok(first);
  const origins=await sourceRows(f,'worker_notice_origins'),other=await boundedUndatedFixture();other.state.html=f.state.html;
  other.state.listing=other.state.listing.replace(other.url,f.url);other.url=f.url;
  assert.ok((await other.worker.run(other.sourceId)).results.some(r=>r.reason==='UNDATED_NOTICE_ORIGIN_CONFLICT'));
  assert.equal(other.state.modelCalls,0);assert.equal((await sourceRows(other,'worker_notice_origins')).length,0);
  for(const query of ['', '?campaign=repost']) {
    const url=`https://recentjobs.co.za/2026/09/26/authored-repost-${randomUUID()}/`,id=`repost_${randomUUID()}`;
    await f.worker.ref('worker_jobs',id).set(payload({id,sourceId:f.sourceId,kind:'detail',url,bucket:999,state:'pending',attempts:0,lease:null,nextAt:f.now()}));
    const html=f.state.html.replace(`https://employer.example/apply/${f.sourceId}`,`https://employer.example/apply/${f.sourceId}${query}`);
    const worker=f.restart({...f.options,fetcher:async(_source,target)=>({url:target,text:target.endsWith('/robots.txt')?'User-agent: *\nAllow: /':html})});
    assert.equal((await worker.runJob(f.sourceId,id)).reason,'UNDATED_NOTICE_ORIGIN_CONFLICT');
    assert.deepEqual(await sourceRows(f,'worker_notice_origins'),origins);assert.equal(f.state.modelCalls,1);
  }
});

test('V2 retry preserves first acquisition at six-hour expiry, retaining prior calls and caches',async()=>{
  const f=await boundedUndatedFixture();f.worker.validator=async()=>{f.state.validations++;throw new DomainError('UNSUPPORTED_RESPONSE');};
  assert.ok((await f.worker.run(f.sourceId)).results.some(r=>r.reason==='UNSUPPORTED_RESPONSE'));
  const job=(await sourceRows(f,'worker_jobs')).find(j=>j.kind==='detail'),origins=await sourceRows(f,'worker_notice_origins');f.advance(6*3600000);
  const result=await f.restart(f.options).runJob(f.sourceId,job.id);assert.equal(result.reason,'UNDATED_NOTICE_FRESHNESS_REQUIRED');
  assert.equal(value(await f.worker.ref('worker_jobs',job.id).get()).sourceRetrievedAt,job.sourceRetrievedAt);
  assert.deepEqual(await sourceRows(f,'worker_notice_origins'),origins);assert.equal(f.state.modelCalls,1);assert.equal(f.state.validations,1);
  assert.equal((await sourceRows(f,'model_calls')).length,2);assert.equal((await f.worker.ref('drafts',job.recordId).get()).exists,false);
});

test('V2 seven-day origin cap is rechecked inside the draft commit after successful validation',async()=>{
  const f=await boundedUndatedFixture({publishedAt:'2026-09-19T10:01:00Z'}),finish=f.worker.finish.bind(f.worker);
  f.worker.finish=async(claim,result,write)=>{if(result.recordId)f.advance(120000);return finish(claim,result,write);};
  assert.ok((await f.worker.run(f.sourceId)).results.some(r=>r.reason==='UNDATED_NOTICE_FRESHNESS_REQUIRED'));
  assert.equal(f.state.modelCalls,1);assert.equal(f.state.validations,1);assert.equal((await sourceRows(f,'worker_decisions')).length,0);
  assert.equal((await sourceRows(f,'worker_notice_origins')).length,2);
});

test('V2 changed text requires new model work and a failed reassessment never renews the accepted decision',async()=>{
  const f=await boundedUndatedFixture(),first=detailResult(await f.worker.run(f.sourceId));assert.ok(first);
  const origins=await sourceRows(f,'worker_notice_origins'),draft=value(await f.worker.ref('drafts',first.recordId).get()),decisions=await sourceRows(f,'worker_decisions');
  f.state.html=f.state.html.replace('Grade 12','Grade 12 and a driving licence');f.advance(3600000);
  const worker=f.restart({...f.options,extractor:async()=>{f.state.modelCalls++;throw new DomainError('AI_REQUIREMENT_COVERAGE');}});
  assert.ok((await worker.run(f.sourceId)).results.some(r=>r.reason==='AI_REQUIREMENT_COVERAGE'));
  assert.equal(f.state.modelCalls,2);assert.equal(f.state.validations,1);assert.deepEqual(await sourceRows(f,'worker_notice_origins'),origins);
  assert.deepEqual(await sourceRows(f,'worker_decisions'),decisions);assert.deepEqual(value(await worker.ref('drafts',first.recordId).get()),draft);
});

test('V2 corrupt or removed origin bindings stop before AI and are rechecked during commit',async()=>{
  for(const stage of ['before_ai','commit']) {
    const f=await boundedUndatedFixture(),first=detailResult(await f.worker.run(f.sourceId));assert.ok(first);
    const job=(await sourceRows(f,'worker_jobs')).find(j=>j.kind==='detail'),key=job.undatedOriginKeys[0];
    const draft=value(await f.worker.ref('drafts',first.recordId).get());
    if(stage==='before_ai')await f.worker.ref('worker_notice_origins',key).delete();
    const worker=f.restart(f.options),finish=worker.finish.bind(worker);
    if(stage==='commit')worker.finish=async(claim,result,write)=>{if(result.recordId)await worker.ref('worker_notice_origins',key).delete();return finish(claim,result,write);};
    f.advance(3600000);assert.ok((await worker.run(f.sourceId)).results.some(r=>r.reason==='UNDATED_NOTICE_ORIGIN_CONFLICT'));
    assert.equal(f.state.modelCalls,1);assert.equal(f.state.validations,1);assert.deepEqual(value(await worker.ref('drafts',first.recordId).get()),draft);
  }
});

test('V2 concurrent replacement-source jobs cannot both establish a fresh origin for one notice and route',async()=>{
  const a=await boundedUndatedFixture(),b=await boundedUndatedFixture();b.state.html=a.state.html;
  b.state.listing=b.state.listing.replace(b.url,a.url);b.url=a.url;
  const results=await Promise.all([a.worker.run(a.sourceId),b.worker.run(b.sourceId)]);
  const accepted=results.filter(r=>detailResult(r)).length;
  // If both captures land before either binding, both require history review.
  assert.ok(accepted<=1);
  assert.equal(results.filter(r=>r.results.some(x=>['UNDATED_NOTICE_ORIGIN_CONFLICT','UNDATED_ORIGIN_IMPORT_REQUIRED'].includes(x.reason))).length,2-accepted);
  assert.equal(a.state.modelCalls+b.state.modelCalls,accepted);assert.equal(a.state.validations+b.state.validations,accepted);
  assert.equal((await sourceRows(a,'worker_notice_origins')).length+(await sourceRows(b,'worker_notice_origins')).length,2*accepted);
});

test('V2 source pause, revision change and grant revocation during validation prevent draft commits',async()=>{
  for(const change of ['pause','revision','grant']) {
    const f=await boundedUndatedFixture();f.state.afterValidation=async()=>{
      if(change==='grant')await f.worker.ref('workers',f.worker.actor).update({active:false});
      else {if(change==='pause')f.source.paused=true;else f.source.revision++;await f.worker.ref('sources',f.sourceId).set(payload(f.source));}
    };
    const expected={pause:/SOURCE_PAUSED/,revision:/SOURCE_CHANGED/,grant:/WORKER_FORBIDDEN/}[change];
    await assert.rejects(()=>f.worker.run(f.sourceId),expected);
    assert.equal(f.state.modelCalls,1);assert.equal(f.state.validations,1);assert.equal((await sourceRows(f,'worker_decisions')).length,0);
    const job=(await sourceRows(f,'worker_jobs')).find(j=>j.kind==='detail');assert.equal((await f.worker.ref('drafts',job.recordId).get()).exists,false);
    assert.equal((await sourceRows(f,'worker_notice_origins')).length,2);
  }
});

test('source holds survive restart and skip detail requests without changing the original exception, snapshot or quota', async () => {
  const f = await fixture({mode:'shadow', publisher:false, employerCrawl:false, cadenceHours:1});
  f.state.html = missingDeadline();
  assert.ok((await f.worker.run(f.sourceId)).results.some(r => r.reason === 'NOTICE_PRECISION_UNSUPPORTED'));
  const ref = f.worker.ref('worker_holds', sourceHoldId(f)), hold = value(await ref.get());
  assert.equal(hold.reason, 'NOTICE_PRECISION_UNSUPPORTED');
  assert.equal(Date.parse(hold.recheckAt) - Date.parse(hold.at), 24 * 3600000);
  assert.ok(hold.snapshotId); assert.ok(hold.contentHash);
  const exception = value(await f.worker.ref('worker_exceptions', hold.jobId).get());
  const snapshot = value(await f.worker.ref('snapshots', hold.snapshotId).get());
  const budget = await sourceRows(f, 'model_budgets');
  const detailRequests = f.state.requests.filter(r => r.url === detailUrl).length;
  f.advance(3600000);
  const skipped = (await f.restart().run(f.sourceId)).results.find(r => r.sourceHeld);
  assert.equal(skipped.originalExceptionJobId, hold.jobId); assert.equal(skipped.recheckAt, hold.recheckAt);
  assert.equal(skipped.published, false); assert.equal(f.state.requests.filter(r => r.url === detailUrl).length, detailRequests);
  assert.deepEqual(value(await ref.get()), hold);
  assert.deepEqual(value(await f.worker.ref('worker_exceptions', hold.jobId).get()), exception);
  assert.deepEqual(value(await f.worker.ref('snapshots', hold.snapshotId).get()), snapshot);
  assert.equal(value(await f.worker.ref('worker_jobs', hold.jobId).get()).state, 'exception');
  assert.deepEqual(await sourceRows(f, 'model_budgets'), budget); assert.equal((await sourceRows(f, 'model_calls')).length, 0);
  assert.equal(f.state.modelCalls, 0); assert.equal(f.state.validations, 0);
});

test('a corrected source is re-fetched at exact hold expiry and can create a private draft without reopening its old job', async () => {
  const f = await fixture({mode:'shadow', publisher:false, employerCrawl:false, cadenceHours:1});
  f.state.html = missingDeadline(); await f.worker.run(f.sourceId);
  const hold = value(await f.worker.ref('worker_holds', sourceHoldId(f)).get());
  f.state.html = detailHtml; f.advance(23 * 3600000);
  assert.ok((await f.restart().run(f.sourceId)).results.some(r => r.sourceHeld));
  f.advance(3600000); assert.equal(f.now(), hold.recheckAt);
  const result = detailResult(await f.restart().run(f.sourceId));
  assert.ok(result); assert.equal(result.published, false); assert.equal(f.state.modelCalls, 1); assert.equal(f.state.validations, 1);
  assert.equal(f.state.requests.filter(r => r.url === detailUrl).length, 2);
  assert.equal(value(await f.worker.ref('worker_jobs', hold.jobId).get()).state, 'exception');
  assert.equal((await f.worker.ref('worker_exceptions', hold.jobId).get()).exists, true);
  assert.equal((await f.worker.ref('public', result.recordId).get()).exists, false);
});

test('source policy revision and programme-mode changes release held notices before the time limit', async () => {
  for (const change of ['source_revision', 'programme_mode']) {
    const f = await fixture({mode:'shadow', publisher:false, employerCrawl:false, cadenceHours:1});
    f.state.html = missingDeadline(); await f.worker.run(f.sourceId);
    const hold = value(await f.worker.ref('worker_holds', sourceHoldId(f)).get());
    f.state.html = detailHtml; f.advance(3600000);
    if (change === 'source_revision') { f.source.revision++; await f.worker.ref('sources', f.sourceId).set(payload(f.source)); }
    const result = detailResult(await f.restart({programmeExtraction:change === 'programme_mode'}).run(f.sourceId));
    assert.ok(result, change); assert.equal(result.published, false); assert.ok(f.now() < hold.recheckAt);
    assert.deepEqual(value(await f.worker.ref('worker_holds', sourceHoldId(f)).get()), hold);
    assert.equal(value(await f.worker.ref('worker_jobs', hold.jobId).get()).state, 'exception');
  }
});

test('strict layout failures are remembered without inventing a parsed candidate or snapshot', async () => {
  const f = await fixture({mode:'shadow', publisher:false, employerCrawl:false, cadenceHours:1});
  f.state.html = '<main>Unrecognised notice structure</main>'; await f.worker.run(f.sourceId);
  const hold = value(await f.worker.ref('worker_holds', sourceHoldId(f)).get());
  assert.equal(hold.reason, 'RECENTJOBS_LAYOUT_CHANGED'); assert.equal(hold.snapshotId, null); assert.equal(hold.contentHash, null);
  f.advance(3600000); assert.ok((await f.restart().run(f.sourceId)).results.some(r => r.sourceHeld));
  assert.equal(f.state.requests.filter(r => r.url === detailUrl).length, 1);
  assert.equal(f.state.modelCalls, 0); assert.equal((await sourceRows(f, 'snapshots')).length, 0);
});

test('a prior hold-policy version releases the notice after preflight policy changes', async () => {
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false,cadenceHours:1});
  f.state.html=missingDeadline(); await f.worker.run(f.sourceId);
  const ref=f.worker.ref('worker_holds',sourceHoldId(f)),hold=value(await ref.get()); assert.equal(hold.version,4);
  await ref.set(payload({...hold,version:3})); f.state.html=detailHtml; f.advance(3600000);
  const result=detailResult(await f.restart().run(f.sourceId)); assert.ok(result); assert.equal(result.published,false);
  assert.ok(f.now()<hold.recheckAt); assert.equal(value(await f.worker.ref('worker_jobs',hold.jobId).get()).state,'exception');
});

test('a scoped next-line application email reaches a private draft through registered issuer checks', async () => {
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});
  f.state.html=detailHtml.replace('<a href="https://employer.example/apply">Apply now</a>',
    '<h2>HOW TO APPLY</h2><p>Submit applications to:<br>applications@employer.example</p>');
  f.source.automation.issuers[0].emailAddresses=['applications@employer.example'];
  await f.worker.ref('sources',f.sourceId).set(payload(f.source));
  const result=detailResult(await f.worker.run(f.sourceId)); assert.ok(result); assert.equal(result.published,false);
  const draft=value(await f.worker.ref('drafts',result.recordId).get());
  assert.equal(draft.applicationRoute.value.method,'email'); assert.equal(draft.applicationRoute.value.destination,'applications@employer.example');
  assert.equal(draft.publication.approved,false); assert.equal(f.state.modelCalls,1); assert.equal(f.state.validations,1);
  assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
});

test('mail-the-below discovery still requires the registered email and never sends mail or crawls an employer',async()=>{
  for(const qualified of [true,false]){
    const f=await fixture({mode:'shadow',publisher:false,employerCrawl:true});
    const instruction='If you are interested in this position, mail the below to – applications@employer.example',cv='1. A CV (2 pages max)';
    f.state.html=detailHtml.replace('<a href="https://employer.example/apply">Apply now</a>',`<p>${instruction}</p><p>${cv}</p>`);
    f.source.automation.issuers[0].emailAddresses=qualified?['applications@employer.example']:[];
    await f.worker.ref('sources',f.sourceId).set(payload(f.source));
    f.worker.extractor=async()=>{f.state.modelCalls++;const x=syntheticExtraction();
      x.practicalConditions={state:'stated',value:instruction+'\n'+cv,quote:instruction+'\n'+cv};
      x.requirements.items.push({id:'cv',kind:'document',level:'required',fact:{state:'stated',quote:cv,value:{description:cv,qualification:null,document:null}}});
      x.requirements.expression={op:'all',children:[x.requirements.expression,{op:'ref',id:'cv'}]};return {extraction:x,provenance:{usage:{totalTokens:20}}};};
    const results=await f.worker.run(f.sourceId);assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
    if(qualified){const result=detailResult(results);assert.ok(result);const draft=value(await f.worker.ref('drafts',result.recordId).get());
      assert.deepEqual(draft.applicationRoute.value,{method:'email',destination:'applications@employer.example'});assert.equal(draft.applicationRoute.originalText,instruction);
      assert.equal(draft.publication.approved,false);assert.equal(f.state.modelCalls,1);assert.equal(f.state.validations,1);
    }else{assert.ok(results.results.some(r=>r.reason==='ISSUER_RELATIONSHIP_UNQUALIFIED'));assert.equal(f.state.modelCalls,0);assert.equal(f.state.validations,0);}
  }
});

test('model rejection and semantic failure do not create source holds or suppress later retrievals', async () => {
  for (const failure of ['extraction', 'validation']) {
    const f = await fixture({mode:'shadow', publisher:false, employerCrawl:false, cadenceHours:1});
    if (failure === 'extraction') f.worker.extractor = async () => { f.state.modelCalls++; throw new DomainError('AI_INVALID_EXTRACTION'); };
    else f.state.supported = false;
    await f.worker.run(f.sourceId); assert.equal((await f.worker.ref('worker_holds', sourceHoldId(f)).get()).exists, false);
    f.advance(3600000); await f.worker.run(f.sourceId);
    assert.equal(f.state.requests.filter(r => r.url === detailUrl).length, 2);
    assert.equal((await f.worker.ref('worker_holds', sourceHoldId(f)).get()).exists, false);
    assert.ok((await sourceRows(f, 'model_calls')).length >= 2);
  }
});

test('a saved hold cannot postpone a published freshness watch, and failed public rechecks do not create holds', async () => {
  const f = await fixture({employerCrawl:false, cadenceHours:1}), first = detailResult(await f.worker.run(f.sourceId));
  const ref = f.worker.ref('worker_holds', sourceHoldId(f));
  await ref.set(payload({sourceId:f.sourceId, sourceRevision:f.source.revision, url:detailUrl, version:2, programmeExtraction:false,
    reason:'NOTICE_PRECISION_UNSUPPORTED', jobId:'saved_exception', snapshotId:null, contentHash:null,
    at:f.now(), recheckAt:new Date(Date.parse(f.now()) + 24 * 3600000).toISOString()}));
  f.advance(3600000);
  assert.equal(detailResult(await f.restart().run(f.sourceId)).recordId, first.recordId);
  await ref.delete(); f.state.html = missingDeadline(); f.advance(3600000);
  assert.ok((await f.restart().run(f.sourceId)).results.some(r => r.reason === 'NOTICE_PRECISION_UNSUPPORTED'));
  assert.equal((await ref.get()).exists, false);
  const status = await f.catalogue.detail(first.recordId); assert.equal(status.kind, 'status'); assert.equal(status.status.status, 'under_review');
});

test('mismatched, obsolete or overlong source holds cannot suppress a fresh detail check', async () => {
  const f = await fixture({mode:'shadow', publisher:false, employerCrawl:false, cadenceHours:1});
  f.state.html = missingDeadline(); await f.worker.run(f.sourceId);
  const ref = f.worker.ref('worker_holds', sourceHoldId(f)), held = value(await ref.get()); f.state.html = detailHtml;
  for (const change of [{sourceId:'another_source'}, {url:detailUrl+'other/'}, {version:0}, {reason:'AI_RATE_LIMITED'},
    {at:'invalid'}, {recheckAt:new Date(Date.parse(held.at) + 25 * 3600000).toISOString()}]) {
    await ref.set(payload({...held,...change})); f.advance(3600000);
    const requests = f.state.requests.filter(r => r.url === detailUrl).length;
    assert.ok(detailResult(await f.restart().run(f.sourceId)), JSON.stringify(change));
    assert.equal(f.state.requests.filter(r => r.url === detailUrl).length, requests + 1);
  }
});

test('source hold inspection remains private and requires the existing reviewer authority', async () => {
  const f = await fixture({mode:'shadow', publisher:false, employerCrawl:false});
  f.state.html = missingDeadline(); await f.worker.run(f.sourceId);
  const uid = `reviewer_${randomUUID()}`, operator = new Catalogue(db, {verifyIdToken:async () => ({uid})}, f.now);
  await assert.rejects(operator.inspect('test-token', 'worker_holds', sourceHoldId(f)), /FORBIDDEN/);
  await f.worker.ref('operators', uid).set({active:true, roles:['reviewer']});
  assert.equal((await operator.inspect('test-token', 'worker_holds', sourceHoldId(f))).reason, 'NOTICE_PRECISION_UNSUPPORTED');
  assert.ok((await operator.queue('test-token', 'worker_holds')).items.some(x => x.id === sourceHoldId(f)));
});

test('unsupported source categories stop before model spending even with an open deadline and original route',async()=>{
  for(const scenario of ['missing_evidence','conflicting_intake']){
    const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});
    if(scenario==='missing_evidence')f.state.html=detailHtml.replaceAll(/\bapprentice(?:ship)?s?\b/gi,'assistant');
    else f.state.html=detailHtml.replace('<p>Applicants require Grade 12 with Mathematics OR N3 Electrical.</p>','<p>Join our internship programme!</p><p>Applicants require Grade 12 with Mathematics OR N3 Electrical.</p>');
    const result=await f.worker.run(f.sourceId),expected=scenario==='missing_evidence'?'NOTICE_CATEGORY_REVIEW_REQUIRED':'NOTICE_CATEGORY_CONFLICT';
    assert.ok(result.results.some(r=>r.reason===expected),JSON.stringify(result.results));
    assert.equal(f.state.modelCalls,0);assert.equal(f.state.validations,0);
    assert.equal((await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId).length,0);
    assert.equal((await db.collection('m0_worker_candidates').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId).length,0);
    assert.equal((await db.collection('m0_model_budgets').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId).length,0);
    assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
  }
});

test('a trade-only title with explicit apprenticeship body evidence retains the existing private workflow',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});
  f.state.html=detailHtml.replace('Fictional electrical apprentice','Fictional Turner Machinist');
  f.worker.extractor=async()=>{f.state.modelCalls++;const extraction=syntheticExtraction();
    extraction.categoryQuote='Fictional Workshop seeks an electrical apprentice.';
    return {extraction,provenance:{model:'synthetic',usage:{totalTokens:20}}};};
  const result=detailResult(await f.worker.run(f.sourceId));assert.ok(result);assert.equal(result.published,false);
  assert.equal(f.state.modelCalls,1);assert.equal(f.state.validations,1);
});

const geminiEnv = {SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_worker_gemini_key',SKILVED_AI_FALLBACK:'true'};
const compactWire = () => ({category:'apprenticeship',categorySpan:[1,1],issuer:{state:'stated',value:'Fictional Workshop',span:[3,3]},
  summary:{state:'stated',value:'Fictional Workshop seeks an electrical apprentice.',span:[3,3]},
  intake:null,location:null,residence:null,experience:null,compensation:[],practicalConditions:null,applicationCandidateIndex:0,
  deadline:{state:'stated',value:{kind:'date',localDate:'2026-10-30',localTime:null,timezone:null,utcInstant:null},span:[5,5]},
  requirements:{items:[{id:'r1',kind:'education',level:'required',state:'stated',span:[4,4]}],expression:'r1'}});
const geminiAnswer = data => Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],
  usageMetadata:{promptTokenCount:10,candidatesTokenCount:5,totalTokenCount:15}});
const geminiOptions = fetchImpl => ({provider:'gemini',env:geminiEnv,
  extractor:(candidate,options)=>extractWithProvider(candidate,{...options,fetchImpl}),
  validator:(input,options)=>validateExtraction(input,{...options,fetchImpl})});
const programmeOptions=fetchImpl=>({provider:'gemini',env:geminiEnv,programmeExtraction:true,
  programmeExtractor:(candidate,id,options)=>extractProgramme(candidate,id,{...options,fetchImpl}),
  programmeValidator:(input,candidate,id,options)=>validateProgramme(input,candidate,id,{...options,fetchImpl})});
const programmeResponse=(input,candidate)=>input.extracted
  ? {supported:true,issues:[],evidence:[{source:'recentjobs',quote:input.selectedIntake.reference.originalText}]}
  : programmeWire(candidate,input.selectedIntake);

test('main-notice binding preserves worker safety: eligible authored wrappers draft privately, while ambiguous layouts and missing dates spend no calls',async()=>{
 for(const scenario of ['eligible','missing_deadline','wrong_canonical','independent_nested_notice']){
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=boundDetail({url:detailUrl});
  if(scenario==='missing_deadline')f.state.html=boundDetail({url:detailUrl,body:boundBody.replace('<p>Closing date: 30 October 2026</p>','<p>Training may commence in October 2026.</p>')});
  if(scenario==='wrong_canonical')f.state.html=f.state.html.replace('href="'+detailUrl+'"','href="https://recentjobs.co.za/2026/09/26/another-notice/"');
  if(scenario==='independent_nested_notice')f.state.html=f.state.html.replace('<div class="entry-content mt-5">','<div class="entry-content mt-5"><h1>Different notice</h1>');
  const drafts=(await db.collection('m0_drafts').get()).size,publicRows=(await db.collection('m0_public').get()).size,cache=(await db.collection('m0_model_cache').get()).size,result=await f.worker.run(f.sourceId);
  if(scenario==='eligible'){
   const completion=detailResult(result);assert.ok(completion,JSON.stringify(result.results));assert.equal(completion.published,false);assert.equal(f.state.modelCalls,1);assert.equal(f.state.validations,1);
   const draft=value(await f.worker.ref('drafts',completion.recordId).get());assert.equal(draft.applicationRoute.value.destination,'https://employer.example/apply');assert.equal(draft.publication.approved,false);
  }else{
   const reason=scenario==='missing_deadline'?'NOTICE_PRECISION_UNSUPPORTED':'RECENTJOBS_LAYOUT_CHANGED';assert.ok(result.results.some(r=>r.reason===reason),JSON.stringify(result.results));assert.equal(f.state.modelCalls,0);assert.equal(f.state.validations,0);
   assert.equal((await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId).length,0);assert.equal((await db.collection('m0_worker_candidates').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId).length,0);assert.equal((await db.collection('m0_model_cache').get()).size,cache);assert.equal((await db.collection('m0_drafts').get()).size,drafts);
  }
  assert.equal((await db.collection('m0_public').get()).size,publicRows);assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
 }
});

test('experience completeness stops ordinary and split workers before cache or validation, while a complete preference reaches a private draft',async()=>{
 for(const mode of ['ordinary_missing','split_missing','complete']){
  const complete=mode==='complete',split=mode==='split_missing',f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=submissionHtml;
  const wire=submissionWire();if(!complete)wire.experience=null;const {requirements,...metadata}=wire,data=split?metadata:wire,original=structuredClone(data);let sends=0;
  const fetchImpl=async(_url,init)=>{sends++;const input=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);return geminiAnswer(input.extracted?{supported:true,issues:[],evidence:[{source:'recentjobs',quote:submissionCandidate.title}]}:data);};
  const worker=f.restart({...geminiOptions(fetchImpl),...(split?{extractionMode:'split',metadataExtractor:(c,o)=>extractMetadata(c,{...o,fetchImpl}),requirementsExtractor:()=>assert.fail('Rejected experience must stop requirement extraction')}:{} )});
  const drafts=(await db.collection('m0_drafts').get()).size,cache=(await db.collection('m0_model_cache').get()).size,publicRows=(await db.collection('m0_public').get()).size;
  const result=await worker.run(f.sourceId),calls=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);
  assert.equal(sends,complete?2:1);assert.equal(calls.length,sends);assert.equal(calls.reduce((n,c)=>n+c.usage.totalTokens,0),sends*15);assert.deepEqual(data,original);
  const budget=(await db.collection('m0_model_budgets').get()).docs.map(value).find(b=>b.sourceId===f.sourceId);assert.equal(budget.calls,sends);
  if(complete){
   const record=detailResult(result);assert.ok(record,JSON.stringify(result.results));assert.equal(record.published,false);const draft=value(await worker.ref('drafts',record.recordId).get());
   assert.equal(draft.experience.value,submissionWire().experience.value);assert.equal(draft.requirements.requirements.find(r=>r.kind==='experience').level,'preferred');assert.equal(draft.applicationRoute.value.destination,'https://employer.example/apply');assert.equal(draft.publication.approved,false);
  }else{
   assert.ok(result.results.some(r=>r.reason==='AI_EXPERIENCE_COMPLETENESS_UNRESOLVED'),JSON.stringify(result.results));assert.equal(calls[0].state,'received');
   assert.equal((await worker.ref('worker_candidates',calls[0].jobId).get()).exists,false);assert.equal((await worker.ref('worker_decisions',calls[0].jobId).get()).exists,false);assert.equal((await worker.ref('worker_exceptions',calls[0].jobId).get()).exists,true);
   assert.equal((await db.collection('m0_model_cache').get()).size,cache);assert.equal((await db.collection('m0_drafts').get()).size,drafts);
  }
  assert.equal((await db.collection('m0_public').get()).size,publicRows);assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
 }
});

test('canonical mapping rechecks a cached missing experience fact without new spending or repair',async()=>{
 const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=submissionHtml;
 const x=decodeGroqExtraction(submissionWire(),submissionCandidate);x.experience={state:'not_stated',value:null,quote:null};const original=structuredClone(x);let extracts=0;
 // A simulated internal decoder bypasses compact validation; canonical mapping
 // still rejects its cached result on both attempts.
 const options={provider:'gemini',env:geminiEnv,extractor:(_c,o)=>o.runAttempt({model:'gemini-3.8-flash',requestHash:'e'.repeat(64)},async()=>{extracts++;return {extraction:structuredClone(x),provenance:{usage:{totalTokens:15}}};}),validator:()=>assert.fail('Missing experience reached validation')};
 const worker=f.restart(options),drafts=(await db.collection('m0_drafts').get()).size,publicRows=(await db.collection('m0_public').get()).size;
 assert.ok((await worker.run(f.sourceId)).results.some(r=>r.reason==='AI_EXPERIENCE_COMPLETENESS_UNRESOLVED'));
 const cache=(await db.collection('m0_model_cache').get()).docs.map(d=>({id:d.id,...value(d)}));
 f.advance(24*3600000);assert.ok((await f.restart(options).run(f.sourceId)).results.some(r=>r.reason==='AI_EXPERIENCE_COMPLETENESS_UNRESOLVED'));assert.equal(extracts,1);assert.deepEqual(x,original);
 assert.deepEqual((await db.collection('m0_model_cache').get()).docs.map(d=>({id:d.id,...value(d)})),cache);
 const calls=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);assert.equal(calls.length,1);assert.equal(calls[0].usage.totalTokens,15);
 assert.equal((await db.collection('m0_worker_candidates').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId).length,0);assert.equal((await db.collection('m0_drafts').get()).size,drafts);assert.equal((await db.collection('m0_public').get()).size,publicRows);assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
});

test('qualification logic and experience source holds preserve spending and stop before validation or drafting',async()=>{
 for(const [reason,change] of [
  ['AI_REQUIREMENT_CONJUNCTION_UNRESOLVED',wire=>{wire.requirements.expression='all(any(q1,q2),s,d)';}],
  ['AI_EXPERIENCE_EVIDENCE_UNRESOLVED',wire=>{wire.experience={state:'stated',value:'Grade 12 OR N2 Electrical',span:qualificationSpan(qualificationPassage)};}],
 ]){
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false}),wire=qualificationWire();f.state.html=qualificationHtml;change(wire);
  const drafts=(await db.collection('m0_drafts').get()).size,publicRows=(await db.collection('m0_public').get()).size;let sends=0;
  const worker=f.restart(geminiOptions(async(_url,init)=>{sends++;assert.equal(JSON.parse(JSON.parse(init.body).contents[0].parts[0].text).extracted,undefined);return geminiAnswer(wire);}));
  const result=await worker.run(f.sourceId);assert.ok(result.results.some(r=>r.reason===reason));assert.equal(sends,1);
  const calls=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);
  assert.equal(calls.length,1);assert.equal(calls[0].usage.totalTokens,15);
  const budget=(await db.collection('m0_model_budgets').get()).docs.map(value).find(b=>b.sourceId===f.sourceId);assert.equal(budget.calls,1);
  assert.equal((await worker.ref('worker_candidates',calls[0].jobId).get()).exists,false);
  assert.equal((await db.collection('m0_drafts').get()).size,drafts);assert.equal((await db.collection('m0_public').get()).size,publicRows);
  assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
 }
});

test('citizenship-only residence stops ordinary and split workers before cache, validation or drafting with spending retained',async()=>{
 for(const split of [false,true]){
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=residenceHtml;
  const wire=residenceWire();wire.residence={state:'stated',value:'South African citizens',span:residenceSpan(citizenship)};
  const {requirements,...metadata}=wire,data=split?metadata:wire,before=structuredClone(data);let sends=0;
  const fetchImpl=async(_url,init)=>{sends++;assert.equal(JSON.parse(JSON.parse(init.body).contents[0].parts[0].text).extracted,undefined);return geminiAnswer(data);};
  const worker=f.restart({...geminiOptions(fetchImpl),...(split?{extractionMode:'split',metadataExtractor:(c,o)=>extractMetadata(c,{...o,fetchImpl}),requirementsExtractor:()=>assert.fail('Rejected residence reached requirements extraction')}:{} )});
  const drafts=(await db.collection('m0_drafts').get()).size,publicRows=(await db.collection('m0_public').get()).size,cache=(await db.collection('m0_model_cache').get()).size;
  assert.ok((await worker.run(f.sourceId)).results.some(r=>r.reason==='AI_RESIDENCE_EVIDENCE_UNRESOLVED'));assert.equal(sends,1);
  const calls=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);
  assert.equal(calls.length,1);assert.equal(calls[0].usage.totalTokens,15);assert.equal(calls[0].state,'received');
  const budget=(await db.collection('m0_model_budgets').get()).docs.map(value).find(b=>b.sourceId===f.sourceId);assert.equal(budget.calls,1);
  assert.equal((await worker.ref('worker_candidates',calls[0].jobId).get()).exists,false);assert.equal((await worker.ref('worker_decisions',calls[0].jobId).get()).exists,false);
  assert.equal((await worker.ref('worker_exceptions',calls[0].jobId).get()).exists,true);
  assert.equal((await db.collection('m0_model_cache').get()).size,cache);assert.equal((await db.collection('m0_drafts').get()).size,drafts);
  assert.equal((await db.collection('m0_public').get()).size,publicRows);assert.deepEqual(data,before);
  assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
 }
});

test('canonical mapping rechecks cached citizenship residence without another model call, validation or repair',async()=>{
 const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=residenceHtml;let extracts=0;
 const x=residenceExtraction();x.residence={state:'stated',value:'South African citizens',quote:citizenship};const before=structuredClone(x);
 // An internal/older decoder bypasses the new compact guard; mapping still holds it.
 const options={provider:'gemini',env:geminiEnv,extractor:(_c,o)=>o.runAttempt({model:'gemini-3.8-flash',requestHash:'a'.repeat(64)},async()=>{
  extracts++;return {extraction:structuredClone(x),provenance:{usage:{totalTokens:15}}};
 }),validator:()=>assert.fail('Citizenship residence reached validation')};
 const worker=f.restart(options),drafts=(await db.collection('m0_drafts').get()).size,publicRows=(await db.collection('m0_public').get()).size;
 assert.ok((await worker.run(f.sourceId)).results.some(r=>r.reason==='AI_RESIDENCE_EVIDENCE_UNRESOLVED'));
 const cache=(await db.collection('m0_model_cache').get()).docs.map(d=>({id:d.id,...value(d)}));
 f.advance(24*3600000);assert.ok((await f.restart(options).run(f.sourceId)).results.some(r=>r.reason==='AI_RESIDENCE_EVIDENCE_UNRESOLVED'));assert.equal(extracts,1);
 assert.deepEqual((await db.collection('m0_model_cache').get()).docs.map(d=>({id:d.id,...value(d)})),cache);assert.deepEqual(x,before);
 const calls=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);assert.equal(calls.length,1);assert.equal(calls[0].usage.totalTokens,15);
 assert.equal((await db.collection('m0_worker_candidates').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId).length,0);
 assert.equal((await db.collection('m0_drafts').get()).size,drafts);assert.equal((await db.collection('m0_public').get()).size,publicRows);
 assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
});

test('pay and duration omissions spend one call and stop before validation, storage or drafts',async()=>{
 for(const [reason,change] of [
  ['AI_QUALITATIVE_PAY_UNRESOLVED',wire=>{wire.compensation=[];}],
  ['AI_MAXIMUM_DURATION_UNRESOLVED',wire=>{wire.summary=null;}],
 ]){
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false}),wire=metadataWire();f.state.html=metadataHtml;change(wire);
  const drafts=(await db.collection('m0_drafts').get()).size,publicRows=(await db.collection('m0_public').get()).size;let sends=0;
  const worker=f.restart(geminiOptions(async(_url,init)=>{sends++;assert.equal(JSON.parse(JSON.parse(init.body).contents[0].parts[0].text).extracted,undefined);return geminiAnswer(wire);}));
  const result=await worker.run(f.sourceId);assert.ok(result.results.some(r=>r.reason===reason));assert.equal(sends,1);
  const calls=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);
  assert.equal(calls.length,1);assert.equal(calls[0].usage.totalTokens,15);
  const budget=(await db.collection('m0_model_budgets').get()).docs.map(value).find(b=>b.sourceId===f.sourceId);assert.equal(budget.calls,1);
  assert.equal((await worker.ref('worker_candidates',calls[0].jobId).get()).exists,false);
  assert.equal((await db.collection('m0_drafts').get()).size,drafts);assert.equal((await db.collection('m0_public').get()).size,publicRows);
  assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
 }
});

test('complete qualitative pay and bounded duration reach validation and one private draft with original route',async()=>{
 const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false}),wire=metadataWire();f.state.html=metadataHtml;let sends=0;
 const worker=f.restart(geminiOptions(async(_url,init)=>{
  sends++;const input=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);
  return geminiAnswer(input.extracted?{supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Fictional Workshop seeks an electrical apprentice.'}]}:wire);
 }));
 const publicRows=(await db.collection('m0_public').get()).size,record=detailResult(await worker.run(f.sourceId));assert.ok(record);assert.equal(sends,2);
 const draft=value(await worker.ref('drafts',record.recordId).get());
 assert.deepEqual(draft.compensation[0].value,wire.compensation[0].value);
 assert.equal(draft.summary.value,wire.summary.value);assert.equal(draft.practicalConditions.value,wire.practicalConditions.value);
 assert.equal(draft.applicationRoute.value.destination,'https://employer.example/apply');assert.equal(draft.publication.approved,false);
 const calls=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);
 assert.equal(calls.length,2);assert.equal(calls.reduce((n,c)=>n+c.usage.totalTokens,0),30);
 assert.equal((await db.collection('m0_public').get()).size,publicRows);
 assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
});

test('location spans gate extraction caching and validation while complete separate place evidence reaches a private draft',async()=>{
 for(const complete of [false,true]) {
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false}),wire=locationWire(complete);f.state.html=locationHtml;let sends=0;
  const worker=f.restart(geminiOptions(async(_url,init)=>{
   sends++;const input=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);
   return geminiAnswer(input.extracted?{supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Fictional Workshop seeks an electrical apprentice.'}]}:wire);
  }));
  const drafts=(await db.collection('m0_drafts').get()).size,publicRows=(await db.collection('m0_public').get()).size,cache=(await db.collection('m0_model_cache').get()).size;
  const result=await worker.run(f.sourceId),calls=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);
  assert.equal(sends,complete?2:1);assert.equal(calls.length,sends);assert.equal(calls.reduce((n,c)=>n+c.usage.totalTokens,0),sends*15);
  if(complete) {
   const record=detailResult(result);assert.ok(record);const draft=value(await worker.ref('drafts',record.recordId).get());
   assert.equal(draft.location.value.places[0].province,'gauteng');assert.equal(draft.location.value.places[0].country,null);
   assert.equal(draft.applicationRoute.value.destination,'https://employer.example/apply');assert.equal(draft.publication.approved,false);
  } else {
   assert.ok(result.results.some(r=>r.reason==='AI_LOCATION_EVIDENCE_UNRESOLVED'));
   assert.equal((await worker.ref('worker_candidates',calls[0].jobId).get()).exists,false);
   assert.equal((await db.collection('m0_model_cache').get()).size,cache);assert.equal((await db.collection('m0_drafts').get()).size,drafts);
  }
  assert.equal((await db.collection('m0_public').get()).size,publicRows);assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
 }
});

test('location completeness holds ordinary and split answers before caching or validation; supported locations reach a private draft',async()=>{
 for(const mode of ['ordinary_missing','split_missing','complete']) {
  const complete=mode==='complete',split=mode==='split_missing',f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=completenessHtml;
  const wire=completenessWire(complete),{requirements,...metadata}=wire;let sends=0;
  const fetchImpl=async(_url,init)=>{
   sends++;const input=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);
   return geminiAnswer(input.extracted?{supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Fictional Workshop seeks an electrical apprentice.'}]}:split?metadata:wire);
  };
  const worker=f.restart({...geminiOptions(fetchImpl),...(split?{extractionMode:'split',metadataExtractor:(c,o)=>extractMetadata(c,{...o,fetchImpl}),requirementsExtractor:()=>assert.fail('Failed metadata must stop requirements extraction')}:{} )});
  const drafts=(await db.collection('m0_drafts').get()).size,publicRows=(await db.collection('m0_public').get()).size,cache=(await db.collection('m0_model_cache').get()).size;
  const result=await worker.run(f.sourceId),calls=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);
  assert.equal(sends,complete?2:1);assert.equal(calls.length,sends);assert.equal(calls.reduce((n,c)=>n+c.usage.totalTokens,0),sends*15);
  const budget=(await db.collection('m0_model_budgets').get()).docs.map(value).find(b=>b.sourceId===f.sourceId);assert.equal(budget.calls,sends);
  if(complete) {
   const record=detailResult(result);assert.ok(record);const draft=value(await worker.ref('drafts',record.recordId).get());
   assert.equal(draft.location.value.places[0].city,'Exampletown');assert.equal(draft.applicationRoute.value.destination,'https://employer.example/apply');assert.equal(draft.publication.approved,false);
  }else{
   assert.ok(result.results.some(r=>r.reason==='AI_LOCATION_COMPLETENESS_UNRESOLVED'));assert.equal(calls[0].state,'received');
   assert.equal((await worker.ref('worker_candidates',calls[0].jobId).get()).exists,false);assert.equal((await db.collection('m0_model_cache').get()).size,cache);assert.equal((await db.collection('m0_drafts').get()).size,drafts);
  }
  assert.equal((await db.collection('m0_public').get()).size,publicRows);assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
 }
});

test('canonical mapping rechecks cached province-only extraction without another model call or validation',async()=>{
 const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=completenessHtml;let extracts=0;
 // Simulate an internal/older decoder returning an already canonical answer.
 const options={provider:'gemini',env:geminiEnv,extractor:(_candidate,o)=>o.runAttempt({model:'gemini-3.8-flash',requestHash:'f'.repeat(64)},async()=>{
  extracts++;return {extraction:completenessExtraction(false),provenance:{usage:{totalTokens:15}}};
 }),validator:()=>assert.fail('Omitted work base reached validation')};
 const worker=f.restart(options),drafts=(await db.collection('m0_drafts').get()).size,publicRows=(await db.collection('m0_public').get()).size;
 assert.ok((await worker.run(f.sourceId)).results.some(r=>r.reason==='AI_LOCATION_COMPLETENESS_UNRESOLVED'));
 const cache=(await db.collection('m0_model_cache').get()).docs.map(d=>({id:d.id,...value(d)}));
 f.advance(24*3600000);
 assert.ok((await f.restart(options).run(f.sourceId)).results.some(r=>r.reason==='AI_LOCATION_COMPLETENESS_UNRESOLVED'));assert.equal(extracts,1);
 assert.deepEqual((await db.collection('m0_model_cache').get()).docs.map(d=>({id:d.id,...value(d)})),cache);
 const calls=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);assert.equal(calls.length,1);assert.equal(calls[0].usage.totalTokens,15);
 assert.equal((await db.collection('m0_worker_candidates').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId).length,0);
 assert.equal((await db.collection('m0_drafts').get()).size,drafts);assert.equal((await db.collection('m0_public').get()).size,publicRows);
});

test('location range guidance reaches the worker without repairing a short answer or preventing supported private drafting',async()=>{
 for(const complete of [false,true]){
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=spanHtml;const wire=spanWire(complete),original=structuredClone(wire);let sends=0;
  const worker=f.restart(geminiOptions(async(_url,init)=>{
   sends++;const input=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);
   if(input.extracted)return geminiAnswer({supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Fictional Workshop seeks an electrical apprentice.'}]});
   assert.equal(input.locationSpanHints.passages.length,2);assert.deepEqual(input.locationSpanHints.recommendedSpan,spanWire().location.span);
   return geminiAnswer(wire);
  }));
  const drafts=(await db.collection('m0_drafts').get()).size,cache=(await db.collection('m0_model_cache').get()).size,publicRows=(await db.collection('m0_public').get()).size;
  const result=await worker.run(f.sourceId),calls=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);
  assert.equal(sends,complete?2:1);assert.equal(calls.length,sends);assert.equal(calls.reduce((n,c)=>n+c.usage.totalTokens,0),sends*15);assert.deepEqual(wire,original);
  const budget=(await db.collection('m0_model_budgets').get()).docs.map(value).find(b=>b.sourceId===f.sourceId);assert.equal(budget.calls,sends);
  if(complete){
   const record=detailResult(result);assert.ok(record);const draft=value(await worker.ref('drafts',record.recordId).get());
   assert.equal(draft.location.value.places[0].city,'Exampletown');assert.equal(draft.location.value.places[0].country,null);
   assert.equal(draft.applicationRoute.value.destination,'https://employer.example/apply');assert.equal(draft.publication.approved,false);
  }else{
   assert.ok(result.results.some(r=>r.reason==='AI_LOCATION_EVIDENCE_UNRESOLVED'));assert.equal((await db.collection('m0_model_cache').get()).size,cache);
   assert.equal((await worker.ref('worker_candidates',calls[0].jobId).get()).exists,false);assert.equal((await db.collection('m0_drafts').get()).size,drafts);
  }
  assert.equal((await db.collection('m0_public').get()).size,publicRows);assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
 }
});

test('short title evidence can reach a private draft but never overrides a negative grouping assessment',async()=>{
 for(const supported of [false,true]){
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=titleSpanHtml;
  const verdict={supported,issues:supported?[]:[{field:'requirements',reason:'Standalone exclusion must merge.'}],evidence:[{source:'recentjobs',quote:'Mathematical Literacy not accepted.'}]},original=structuredClone(verdict);let sends=0;
  const worker=f.restart(geminiOptions(async(_url,init)=>{
   sends++;const body=JSON.parse(init.body),input=JSON.parse(body.contents[0].parts[0].text);
   if(input.extracted){assert.match(body.systemInstruction.parts[0].text,/standalone subject acceptance\/exclusion rule/);return geminiAnswer(verdict);}
   assert.deepEqual(input.locationSpanHints.recommendedSpan,[1,2]);assert.equal(input.locationSpanHints.titleAlternatives.length,1);return geminiAnswer(titleSpanWire());
  }));
  const drafts=(await db.collection('m0_drafts').get()).size,publicRows=(await db.collection('m0_public').get()).size;
  const result=await worker.run(f.sourceId),calls=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);
  assert.equal(sends,2);assert.equal(calls.length,2);assert.equal(calls.reduce((n,c)=>n+c.usage.totalTokens,0),30);assert.deepEqual(verdict,original);
  if(supported){
   const record=detailResult(result);assert.ok(record);assert.equal(record.published,false);const draft=value(await worker.ref('drafts',record.recordId).get());
   assert.equal(draft.location.originalText,titleSpanCandidate.title+'\n'+workBase);assert.equal(draft.applicationRoute.value.destination,'https://employer.example/apply');assert.equal(draft.publication.approved,false);
  }else{
   assert.ok(result.results.some(r=>r.reason==='SEMANTIC_VALIDATION_FAILED'));assert.equal((await db.collection('m0_drafts').get()).size,drafts);
   assert.equal((await worker.ref('worker_candidates',calls[0].jobId).get()).exists,true);
  }
  assert.equal((await db.collection('m0_public').get()).size,publicRows);assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
 }
});

test('Gemini shadow extraction and validation reserve every fallback call, preserve routes and cache without publishing',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false,calls:4}), requests=[];
  const options=geminiOptions(async(url,init)=>{
    const body=JSON.parse(init.body),input=JSON.parse(body.contents[0].parts[0].text),validation=!!input.extracted;
    requests.push({model:url.split('/models/')[1].split(':')[0],validation,thinking:body.generationConfig.thinkingConfig.thinkingLevel});
    assert.equal(body.generationConfig.maxOutputTokens,validation?6144:3072);assert.equal(body.generationConfig.responseJsonSchema,undefined);
    if(requests.length===1)return new Response(null,{status:503});
    if(requests.length===3)return new Response(null,{status:429,headers:{'Retry-After':'90'}});
    return geminiAnswer(validation?{supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Grade 12 with Mathematics OR N3 Electrical'}]}:compactWire());
  });
  const worker=f.restart(options),result=detailResult(await worker.run(f.sourceId));assert.ok(result);assert.equal(result.published,false);
  assert.deepEqual(requests.map(r=>r.model),['gemini-3.8-flash','gemini-3.7-flash','gemini-3.7-flash','gemini-3.6-flash']);
  assert.deepEqual(requests.map(r=>r.thinking),['LOW','LOW','MEDIUM','MEDIUM']);
  const draft=value(await worker.ref('drafts',result.recordId).get());assert.equal(draft.publication.approved,false);
  assert.equal(draft.applicationRoute.value.destination,'https://employer.example/apply');
  assert.equal((await worker.ref('public',result.recordId).get()).exists,false);assert.equal(f.state.requests.some(r=>r.url.startsWith('https://employer.example')),false);
  const rows=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);
  assert.equal(rows.length,4);assert.deepEqual(rows.map(r=>r.providerStatus).sort(),[null,null,429,503].sort());assert.ok(rows.every(r=>r.provider==='gemini'));
  const budget=(await db.collection('m0_model_budgets').get()).docs.map(value).find(b=>b.sourceId===f.sourceId);
  assert.equal(budget.calls,4);assert.equal(budget.nextCallByModel['gemini-3.8-flash'],new Date(Date.parse(f.now())+120000).toISOString());
  assert.equal(budget.nextCallByModel['gemini-3.7-flash'],new Date(Date.parse(f.now())+90000).toISOString());assert.equal(budget.nextCallAt,undefined);
  f.advance(24*3600000);assert.equal(detailResult(await f.restart(options).run(f.sourceId)).published,false);assert.equal(requests.length,4);
});

test('Gemini fallback stops at the daily budget before sending the next model',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false,calls:1});let sends=0;
  const worker=f.restart(geminiOptions(async()=>{sends++;return new Response(null,{status:503});}));
  assert.ok((await worker.run(f.sourceId)).results.some(r=>r.reason==='MODEL_BUDGET_EXHAUSTED'));assert.equal(sends,1);
  assert.equal((await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId).length,1);
});

test('a Gemini availability cooldown delays retry and cached extraction avoids another extraction call',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false,calls:3}),requests=[];
  const options=geminiOptions(async(url,init)=>{
    const input=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);requests.push({model:url.split('/models/')[1].split(':')[0],validation:!!input.extracted});
    if(requests.length===2)return new Response(null,{status:503});
    return geminiAnswer(input.extracted?{supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Grade 12 with Mathematics OR N3 Electrical'}]}:compactWire());
  });options.env={...geminiEnv,SKILVED_AI_FALLBACK:'false'};
  const worker=f.restart(options),initial=await worker.run(f.sourceId);
  assert.ok(initial.results.some(r=>r.state==='pending'&&r.reason==='AI_PROVIDER_REJECTED'));
  const job=(await db.collection('m0_worker_jobs').get()).docs.map(value).find(j=>j.sourceId===f.sourceId&&j.kind==='detail');
  assert.equal(job.nextAt,new Date(Date.parse(f.now())+120000).toISOString());
  f.advance(119999);await assert.rejects(worker.runJob(f.sourceId,job.id),/JOB_UNAVAILABLE/);assert.equal(requests.length,2);
  f.advance(2);const result=await worker.runJob(f.sourceId,job.id);assert.equal(result.published,false);
  assert.deepEqual(requests.map(r=>r.validation),[false,true,true]);assert.ok(requests.every(r=>r.model==='gemini-3.8-flash'));
  assert.equal(value(await worker.ref('drafts',result.recordId).get()).publication.approved,false);
  const receipts=(await db.collection('m0_model_calls').get()).docs.map(value).filter(r=>r.sourceId===f.sourceId);assert.equal(receipts.length,3);
  assert.equal((await worker.ref('public',result.recordId).get()).exists,false);
});

test('Gemini authentication and invalid-request failures do not create availability cooldowns or fallback calls',async()=>{
  for(const status of [400,401,403]){
    const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});let calls=0;
    const worker=f.restart(geminiOptions(async()=>{calls++;return new Response(null,{status});}));
    assert.ok((await worker.run(f.sourceId)).results.some(r=>r.state==='exception'&&r.reason==='AI_PROVIDER_REJECTED'));assert.equal(calls,1);
    const budget=(await db.collection('m0_model_budgets').get()).docs.map(value).find(b=>b.sourceId===f.sourceId);
    assert.equal(budget.nextCallByModel,undefined);assert.equal(budget.calls,1);
  }
});

test('Gemini availability cooldown honours a longer provider Retry-After',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false}),options=geminiOptions(async()=>new Response(null,{status:503,headers:{'Retry-After':'300'}}));
  options.env={...geminiEnv,SKILVED_AI_FALLBACK:'false'};const worker=f.restart(options);
  assert.ok((await worker.run(f.sourceId)).results.some(r=>r.reason==='AI_PROVIDER_REJECTED'));
  const budget=(await db.collection('m0_model_budgets').get()).docs.map(value).find(b=>b.sourceId===f.sourceId);
  assert.equal(budget.nextCallByModel['gemini-3.8-flash'],new Date(Date.parse(f.now())+300000).toISOString());
});

test('Gemini local schema rejection stops without fallback and does not reuse a Groq cache',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});assert.ok(detailResult(await f.worker.run(f.sourceId)));
  f.advance(24*3600000);let sends=0;
  const worker=f.restart(geminiOptions(async()=>{sends++;return geminiAnswer({});}));
  assert.ok((await worker.run(f.sourceId)).results.some(r=>r.reason==='AI_INVALID_EXTRACTION'));assert.equal(sends,1);
  assert.equal((await db.collection('m0_worker_decisions').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId).length,1);
});

test('Gemini is restricted to shadow sources even when a worker holds a publication grant',async()=>{
  const f=await fixture();let sends=0;
  await assert.rejects(f.restart(geminiOptions(async()=>{sends++;return geminiAnswer(compactWire());})).run(f.sourceId),/GEMINI_SHADOW_ONLY/);
  assert.equal(sends,0);assert.equal(f.state.requests.length,0);
});

test('selecting the Gemini worker cannot override disabled AI even when its key exists',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});let sends=0;
  const options=geminiOptions(async()=>{sends++;return geminiAnswer(compactWire());});
  options.env={...geminiEnv,SKILVED_AI_MODE:'disabled'};
  assert.ok((await f.restart(options).run(f.sourceId)).results.some(r=>r.reason==='AI_DISABLED'));assert.equal(sends,0);
  assert.equal((await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId).length,0);
});

test('Gemini preserves a qualified application email in a private draft without destination probes',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:true});
  f.state.html=detailHtml.replace('https://employer.example/apply','mailto:jobs@employer.example');
  f.source.automation.issuers[0].emailAddresses=['jobs@employer.example'];
  await f.worker.ref('sources',f.sourceId).set(payload(f.source));
  const worker=f.restart(geminiOptions(async(_url,init)=>{
    const input=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);
    return geminiAnswer(input.extracted?{supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Grade 12 with Mathematics OR N3 Electrical'}]}:compactWire());
  }));
  const result=detailResult(await worker.run(f.sourceId));assert.equal(result.published,false);
  const draft=value(await worker.ref('drafts',result.recordId).get());assert.deepEqual(draft.applicationRoute.value,{method:'email',destination:'jobs@employer.example'});
  assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
  assert.equal((await worker.ref('public',result.recordId).get()).exists,false);
});

function splitOptions(counts) {
  return {extractionMode:'split',metadataExtractor:async()=>{
    counts.metadata++;const {requirements,...metadata}=syntheticExtraction();
    return {metadata,provenance:{extractionVersion:'synthetic_metadata',usage:{totalTokens:20}}};
  },requirementsExtractor:async()=>{
    counts.requirements++;
    return {requirements:syntheticExtraction().requirements,provenance:{extractionVersion:'synthetic_requirements',usage:{totalTokens:20}}};
  }};
}

test('split shadow processing reserves three calls, caches each stage, keeps the original route and never publishes',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false,calls:3}), counts={metadata:0,requirements:0};
  const options=splitOptions(counts), worker=f.restart(options), result=detailResult(await worker.run(f.sourceId));
  assert.equal(result.published,false);assert.equal(f.state.validations,1);
  const draft=value(await worker.ref('drafts',result.recordId).get());
  assert.equal(draft.applicationRoute.value.destination,'https://employer.example/apply');assert.equal(draft.publication.approved,false);
  assert.equal((await worker.ref('public',result.recordId).get()).exists,false);
  const calls=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);
  assert.deepEqual(calls.map(c=>c.stage).sort(),['metadata','requirements','validation']);
  assert.equal(f.state.requests.some(r=>r.url.startsWith('https://employer.example/')),false);
  f.advance(24*3600000);assert.equal(detailResult(await f.restart(options).run(f.sourceId)).published,false);
  assert.deepEqual(counts,{metadata:1,requirements:1});assert.equal(f.state.validations,1);
});

test('split mode is refused for automatic sources before requests or model work',async()=>{
  const f=await fixture(),counts={metadata:0,requirements:0};
  await assert.rejects(f.restart(splitOptions(counts)).run(f.sourceId),/SPLIT_EXTRACTION_SHADOW_ONLY/);
  assert.equal(f.state.requests.length,0);assert.deepEqual(counts,{metadata:0,requirements:0});
});

test('split stages cannot hide their second extraction call inside one budget reservation',async()=>{
  const f=await fixture({mode:'shadow',employerCrawl:false,calls:2}),counts={metadata:0,requirements:0};
  const result=await f.restart(splitOptions(counts)).run(f.sourceId);
  assert.ok(result.results.some(r=>r.reason==='MODEL_BUDGET_EXHAUSTED'));assert.equal(f.state.validations,0);
  assert.deepEqual(counts,{metadata:1,requirements:1});
  const calls=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);
  assert.equal(calls.length,2);
});

test('split retry reuses metadata after a rate limit and charges the failed requirements attempt',async()=>{
  const f=await fixture({mode:'shadow',employerCrawl:false,calls:4}),counts={metadata:0,requirements:0},options=splitOptions(counts);
  const original=options.requirementsExtractor;let failOnce=true;
  options.requirementsExtractor=async(...args)=>{if(failOnce){failOnce=false;counts.requirements++;throw new GroqError('AI_RATE_LIMITED',true,null,60000,429);}return original(...args);};
  assert.ok((await f.restart(options).run(f.sourceId)).results.some(r=>r.reason==='AI_RATE_LIMITED'));
  f.advance(61000);assert.equal(detailResult(await f.restart(options).run(f.sourceId)).published,false);
  assert.deepEqual(counts,{metadata:1,requirements:2});assert.equal(f.state.validations,1);
  const calls=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);
  assert.equal(calls.length,4);
});

test('validation reasoning changes invalidate only the validation cache and reach the provider options', async () => {
  const f = await fixture({ employerCrawl: false });
  assert.equal(detailResult(await f.worker.run(f.sourceId)).published, true);
  assert.equal(f.state.extractionThinking, 'low'); assert.equal(f.state.validationThinking, 'medium');
  f.advance(24 * 3600000);
  assert.equal(detailResult(await f.restart({ validationThinking: 'low' }).run(f.sourceId)).published, true);
  assert.equal(f.state.modelCalls, 1); assert.equal(f.state.validations, 2);
  assert.equal(f.state.validationThinking, 'low');
});

test('provider-generated schema failures retry after restart within the reserved call budget', async () => {
  const f = await fixture({ employerCrawl: false, calls: 3 });
  f.worker.extractor = async () => { throw new GroqError('AI_INVALID_PROVIDER_OUTPUT', true, null, null, 400); };
  assert.ok((await f.worker.run(f.sourceId)).results.some(r => r.state === 'pending' && r.reason === 'AI_INVALID_PROVIDER_OUTPUT'));
  assert.equal((await f.restart().run(f.sourceId)).results.length, 0);
  f.advance(61000);
  assert.equal(detailResult(await f.restart().run(f.sourceId)).published, true);
  const calls = (await db.collection('m0_model_calls').get()).docs.map(value).filter(c => c.sourceId === f.sourceId);
  assert.equal(calls.length, 3); assert.equal(calls.find(c => c.state === 'failed').providerStatus, 400);
  const budget = (await db.collection('m0_model_budgets').get()).docs.map(value).find(b => b.sourceId === f.sourceId);
  assert.equal(budget.calls, 3);
});

test('employer crawling defaults off; original portal publishes without employer fetch claims', async () => {
  const f = await fixture(); delete f.source.automation.employerCrawl;
  await f.worker.ref('sources', f.sourceId).set(payload(f.source));
  f.state.denyPrimaryRobots = true;
  const result = detailResult(await f.worker.run(f.sourceId));
  assert.equal(result.published, true);
  assert.equal(f.state.requests.some(r => r.url.startsWith('https://employer.example/')), false);
  const o = (await f.catalogue.detail(result.recordId)).opportunity;
  assert.equal(o.application.route.destination, 'https://employer.example/apply');
  assert.equal(o.citations.some(c => c.id === 'primary_notice'), false);
  assert.equal(o.checks.some(c => ['destination_reachability', 'issuer_attribution', 'availability'].includes(c.scope)), false);
});

test('promotional application instructions are rejected before semantic validation or publication', async () => {
  const f = await fixture({ employerCrawl: false });
  f.state.html = f.state.html.replace('</div>', '<p>Join our WhatsApp group</p></div>');
  f.worker.extractor = async () => {
    const extraction = syntheticExtraction();
    extraction.practicalConditions = { state: 'stated', value: 'Join our WhatsApp group', quote: 'Join our WhatsApp group' };
    return { extraction, provenance: { usage: { totalTokens: 20 } } };
  };
  const result = await f.worker.run(f.sourceId);
  assert.ok(result.results.some(r => r.reason === 'AI_PROMOTIONAL_CONTENT'));
  assert.equal(f.state.validations, 0);
  assert.equal(result.results.some(r => r.published === true), false);
});

test('unresolved material facts retain the candidate but spend no validation call or employer-page fetch', async () => {
  const f = await fixture();
  f.worker.extractor = async () => {
    const extraction = syntheticExtraction();
    extraction.requirements = { items: [], expression: { op: 'unknown', originalText: 'Grade 12 with Mathematics OR N3 Electrical' } };
    return { extraction, provenance: { usage: { totalTokens: 20 } } };
  };
  const result = await f.worker.run(f.sourceId);
  assert.ok(result.results.some(r => r.reason === 'MATERIAL_FACTS_UNRESOLVED'));
  assert.equal(f.state.validations, 0);
  assert.equal(f.state.requests.some(r => r.url === 'https://employer.example/apply'), false);
  const rows = await db.collection('m0_worker_exceptions').get();
  const exception = rows.docs.map(value).find(e => e.sourceId === f.sourceId);
  assert.equal(exception.stage, 'material_checks');
  assert.equal((await f.worker.ref('worker_candidates', exception.jobId).get()).exists, true);
});

test('qualified original application email publishes without fetching a website or sending mail', async () => {
  const f = await fixture({ employerCrawl: false });
  f.state.html = detailHtml.replace('https://employer.example/apply', 'mailto:jobs@employer.example');
  f.source.automation.issuers[0].emailAddresses = ['jobs@employer.example'];
  await f.worker.ref('sources', f.sourceId).set(payload(f.source));
  const result = detailResult(await f.worker.run(f.sourceId));
  assert.equal(result.published, true);
  const o = (await f.catalogue.detail(result.recordId)).opportunity;
  assert.deepEqual(o.application.route, { method: 'email', destination: 'jobs@employer.example' });
  assert.equal(f.state.requests.every(r => r.url.startsWith('https://recentjobs.co.za/')), true);
});

test('a qualified explicit plain-text email reaches a private draft with its source instruction',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:true});
  f.state.html=detailHtml.replace('<a href="https://employer.example/apply">Apply now</a>','<p>Apply by email: jobs@employer.example</p>');
  f.source.automation.issuers[0].emailAddresses=['jobs@employer.example'];
  await f.worker.ref('sources',f.sourceId).set(payload(f.source));
  const result=detailResult(await f.worker.run(f.sourceId));assert.equal(result.published,false);
  const draft=value(await f.worker.ref('drafts',result.recordId).get());
  assert.deepEqual(draft.applicationRoute.value,{method:'email',destination:'jobs@employer.example'});
  assert.equal(draft.applicationRoute.originalText,'Apply by email: jobs@employer.example');
  assert.equal(f.state.modelCalls,1);assert.equal(f.state.validations,1);
  assert.equal(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')),true);
  assert.equal((await f.worker.ref('public',result.recordId).get()).exists,false);
});

test('multiple programme email destinations are held before model work even when both are qualified',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});
  f.state.html=detailHtml.replace('<a href="https://employer.example/apply">Apply now</a>','<p>Apply: electrical@employer.example</p><p>Apply: plumbing@employer.example</p>');
  f.source.automation.issuers[0].emailAddresses=['electrical@employer.example','plumbing@employer.example'];
  await f.worker.ref('sources',f.sourceId).set(payload(f.source));
  const result=await f.worker.run(f.sourceId);
  assert.ok(result.results.some(r=>r.reason==='NOTICE_PRECISION_UNSUPPORTED'));
  assert.equal(f.state.modelCalls,0);assert.equal(f.state.validations,0);
});

test('a shadow worker saves a source-bound programme plan linked to its exception without model calls or drafts',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=programmeHtml;
  f.source.automation.issuers[0].emailAddresses=['electrical@employer.example','plumbing@employer.example'];
  await f.worker.ref('sources',f.sourceId).set(payload(f.source));
  const result=await f.worker.run(f.sourceId);assert.ok(result.results.some(r=>r.reason==='NOTICE_PRECISION_UNSUPPORTED'));
  const plans=(await db.collection('m0_worker_programme_plans').get()).docs.map(value).filter(p=>p.sourceId===f.sourceId);
  assert.equal(plans.length,1);assert.equal(plans[0].plan.intakes.length,2);assert.equal(plans[0].plan.qualification,false);
  const exception=value(await f.worker.ref('worker_exceptions',plans[0].jobId).get());
  assert.equal(exception.programmePlanId,plans[0].jobId);assert.equal(exception.snapshotId,plans[0].snapshotId);
  assert.equal((await f.worker.ref('snapshots',plans[0].snapshotId).get()).exists,true);
  assert.equal(f.state.modelCalls,0);assert.equal(f.state.validations,0);
  assert.equal((await f.worker.ref('drafts',exception.recordId).get()).exists,false);
  assert.equal((await f.worker.ref('public',exception.recordId).get()).exists,false);
  assert.equal(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')),true);
});

test('unsupported multi-route layouts save an explicit unsupported plan only in shadow mode',async()=>{
  for(const mode of ['shadow','automatic']){
    const f=await fixture({mode,employerCrawl:false});
    f.state.html=detailHtml.replace('<a href="https://employer.example/apply">Apply now</a>','<p>Apply: electrical@employer.example</p><p>Apply: plumbing@employer.example</p>');
    const result=await f.worker.run(f.sourceId);assert.ok(result.results.some(r=>r.reason==='NOTICE_PRECISION_UNSUPPORTED'));
    const plans=(await db.collection('m0_worker_programme_plans').get()).docs.map(value).filter(p=>p.sourceId===f.sourceId);
    assert.equal(plans.length,mode==='shadow'?1:0);
    if(plans.length){assert.equal(plans[0].plan.state,'unsupported');assert.deepEqual(plans[0].plan.intakes,[]);}
    assert.equal(f.state.modelCalls,0);
  }
});

test('opt-in programme extraction creates two isolated private drafts with per-attempt fallback accounting and cache reuse',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:true,calls:5});f.state.html=programmeHtml;
  f.source.automation.issuers[0].emailAddresses=['electrical@employer.example','plumbing@employer.example'];
  await f.worker.ref('sources',f.sourceId).set(payload(f.source));
  const candidate=parseRecentJobsDetail({html:programmeHtml,url:detailUrl}),calls=[];
  const worker=f.restart(programmeOptions(async(url,init)=>{
    const body=JSON.parse(init.body),input=JSON.parse(body.contents[0].parts[0].text);
    calls.push({model:url.split('/models/')[1].split(':')[0],validation:!!input.extracted,intake:input.selectedIntake.id});
    assert.equal(body.generationConfig.thinkingConfig.thinkingLevel,input.extracted?'MEDIUM':'LOW');
    assert.equal(body.generationConfig.maxOutputTokens,input.extracted?6144:3072);
    if(calls.length===1)return new Response(null,{status:503});
    return geminiAnswer(programmeResponse(input,candidate));
  }));
  const first=(await worker.run(f.sourceId)).results.find(r=>r.programmes);
  assert.equal(first.draftCount,2,JSON.stringify(first));assert.equal(first.published,false);assert.equal(calls.length,5);
  assert.equal(calls[0].model,'gemini-3.8-flash');assert.equal(calls[1].model,'gemini-3.7-flash');
  assert.ok(calls.slice(1).every(c=>c.model==='gemini-3.7-flash'));
  const drafts=await Promise.all(first.programmes.map(r=>worker.ref('drafts',r.recordId).get().then(value)));
  assert.deepEqual(drafts.map(d=>d.intake.value),['Electrical TEST/01','Plumbing TEST/02']);
  assert.deepEqual(drafts.map(d=>d.applicationRoute.value.destination),['electrical@employer.example','plumbing@employer.example']);
  assert.equal(drafts[0].requirements.requirements[0].fact.originalText,'Applicants require Grade 12 with Mathematics OR N3 Electrical.');
  assert.equal(drafts[1].requirements.requirements[0].fact.originalText,'Applicants require N2 Plumbing.');
  assert.ok(drafts.every(d=>d.practicalConditions.value.includes('Request an application form from forms@employer.example.')));
  assert.ok(drafts.every(d=>d.requirements.requirements.length===2&&!d.publication.approved&&d.lifecycle==='review'));
  for(const row of first.programmes)assert.equal((await worker.ref('public',row.recordId).get()).exists,false);
  const budget=(await db.collection('m0_model_budgets').get()).docs.map(value).find(b=>b.sourceId===f.sourceId);assert.equal(budget.calls,5);
  const receipts=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);
  assert.equal(receipts.length,5);assert.equal(new Set(receipts.map(c=>c.stage)).size,4);
  assert.equal(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')),true);
  f.advance(24*3600000);const second=(await worker.run(f.sourceId)).results.find(r=>r.programmes);
  assert.deepEqual(second.programmes.map(r=>r.recordId),first.programmes.map(r=>r.recordId));assert.equal(calls.length,5);
});

test('programme budget exhaustion stops the next validation request and preserves only completed sibling drafts',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false,calls:3});f.state.html=programmeHtml;
  f.source.automation.issuers[0].emailAddresses=['electrical@employer.example','plumbing@employer.example'];await f.worker.ref('sources',f.sourceId).set(payload(f.source));
  const candidate=parseRecentJobsDetail({html:programmeHtml,url:detailUrl});let calls=0;
  const worker=f.restart(programmeOptions(async(_url,init)=>{calls++;return geminiAnswer(programmeResponse(JSON.parse(JSON.parse(init.body).contents[0].parts[0].text),candidate));}));
  const result=await worker.run(f.sourceId);assert.ok(result.results.some(r=>r.reason==='MODEL_BUDGET_EXHAUSTED'));assert.equal(calls,3);
  const decisions=(await db.collection('m0_worker_programme_decisions').get()).docs.map(value).filter(d=>d.sourceId===f.sourceId);
  assert.equal(decisions.length,1);assert.equal(decisions[0].decision,'shadow_pass');
  assert.equal((await worker.ref('drafts',decisions[0].recordId).get()).exists,true);assert.equal((await worker.ref('public',decisions[0].recordId).get()).exists,false);
});

test('cross-trade extraction fails locally without fallback while a valid sibling continues',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=programmeHtml;
  f.source.automation.issuers[0].emailAddresses=['electrical@employer.example','plumbing@employer.example'];await f.worker.ref('sources',f.sourceId).set(payload(f.source));
  const candidate=parseRecentJobsDetail({html:programmeHtml,url:detailUrl});let calls=0;
  const worker=f.restart(programmeOptions(async(_url,init)=>{
    calls++;const input=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text),answer=programmeResponse(input,candidate);
    if(!input.extracted&&input.selectedIntake.reference.value.startsWith('Electrical'))answer.requirements.items[0].span=[11,11];
    return geminiAnswer(answer);
  }));
  const result=(await worker.run(f.sourceId)).results.find(r=>r.programmes);
  assert.equal(result.programmes[0].reason,'PROGRAMME_EVIDENCE_OUTSIDE_SCOPE');assert.equal(result.programmes[1].state,'draft');assert.equal(result.draftCount,1);assert.equal(calls,3);
});

test('malformed programme data records structural diagnostics privately and continues a valid sibling',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=programmeHtml;
  f.source.automation.issuers[0].emailAddresses=['electrical@employer.example','plumbing@employer.example'];await f.worker.ref('sources',f.sourceId).set(payload(f.source));
  const candidate=parseRecentJobsDetail({html:programmeHtml,url:detailUrl});let calls=0;
  const worker=f.restart(programmeOptions(async(_url,init)=>{
    calls++;const input=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text),answer=programmeResponse(input,candidate);
    if(!input.extracted&&input.selectedIntake.reference.value.startsWith('Electrical'))answer.private_provider_key='sensitive provider value';
    return geminiAnswer(answer);
  }));
  const result=(await worker.run(f.sourceId)).results.find(r=>r.programmes);
  assert.equal(result.programmes[0].reason,'AI_INVALID_EXTRACTION');assert.equal(result.programmes[1].state,'draft');assert.equal(calls,3);
  const rejected=(await db.collection('m0_worker_programme_decisions').get()).docs.map(value).find(d=>d.sourceId===f.sourceId&&d.decision==='exception');
  assert.deepEqual(rejected.outputDiagnostic.unknownPropertyCounts,[{path:'',count:1}]);
  assert.doesNotMatch(JSON.stringify(rejected),/private_provider_key|sensitive provider value/);
  assert.equal((await worker.ref('public',result.programmes[1].recordId).get()).exists,false);
});

test('semantic validation rejection holds one child without approving it or blocking a valid sibling',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=programmeHtml;
  f.source.automation.issuers[0].emailAddresses=['electrical@employer.example','plumbing@employer.example'];await f.worker.ref('sources',f.sourceId).set(payload(f.source));
  const candidate=parseRecentJobsDetail({html:programmeHtml,url:detailUrl});let calls=0;
  const worker=f.restart(programmeOptions(async(_url,init)=>{
    calls++;const input=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text),answer=programmeResponse(input,candidate);
    if(input.extracted&&input.selectedIntake.reference.value.startsWith('Electrical')){answer.supported=false;answer.issues=[{field:'requirements',reason:'Synthetic semantic mismatch'}];}
    return geminiAnswer(answer);
  }));
  const result=(await worker.run(f.sourceId)).results.find(r=>r.programmes);
  assert.equal(result.programmes[0].reason,'SEMANTIC_VALIDATION_FAILED');assert.equal(result.programmes[1].state,'draft');assert.equal(calls,4);
});

test('expired programme notices stop before all model work even when programme extraction is enabled',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=programmeHtml.replace('30 October 2026','25 September 2026');
  f.source.automation.issuers[0].emailAddresses=['electrical@employer.example','plumbing@employer.example'];await f.worker.ref('sources',f.sourceId).set(payload(f.source));let calls=0;
  const worker=f.restart(programmeOptions(async()=>{calls++;assert.fail('Expired notice reached AI');}));
  assert.ok((await worker.run(f.sourceId)).results.some(r=>r.reason==='NOTICE_NOT_OPEN'));assert.equal(calls,0);
});

test('programme extraction rejects automatic publication and incompatible split mode before effects',async()=>{
  const f=await fixture({mode:'automatic'});const worker=f.restart({programmeExtraction:true});
  await assert.rejects(worker.run(f.sourceId),/PROGRAMME_EXTRACTION_SHADOW_ONLY/);assert.equal(f.state.requests.length,0);
  assert.throws(()=>f.restart({programmeExtraction:true,extractionMode:'split'}),/AI_CONFIGURATION_REQUIRED/);
});

test('source pause during a programme request prevents receipt persistence, child drafts and later sibling calls',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=programmeHtml;
  f.source.automation.issuers[0].emailAddresses=['electrical@employer.example','plumbing@employer.example'];await f.worker.ref('sources',f.sourceId).set(payload(f.source));
  const candidate=parseRecentJobsDetail({html:programmeHtml,url:detailUrl});let calls=0;
  const worker=f.restart(programmeOptions(async(_url,init)=>{
    calls++;f.source.paused=true;await worker.ref('sources',f.sourceId).set(payload(f.source));
    return geminiAnswer(programmeResponse(JSON.parse(JSON.parse(init.body).contents[0].parts[0].text),candidate));
  }));
  await assert.rejects(worker.run(f.sourceId),/SOURCE_PAUSED/);assert.equal(calls,1);
  assert.equal((await db.collection('m0_worker_programme_decisions').get()).docs.map(value).filter(d=>d.sourceId===f.sourceId).length,0);
});

test('physical submission alternatives require review even beside a qualified website route',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:true});
  f.state.html=detailHtml.replace('</div>','<p>Applications should be hand delivered / couriered to: Fictional College, 9 Example Street.</p></div>');
  const result=await f.worker.run(f.sourceId);
  assert.ok(result.results.some(r=>r.reason==='NOTICE_APPLICATION_METHOD_REVIEW_REQUIRED'));
  assert.equal(f.state.modelCalls,0);assert.equal(f.state.validations,0);
  assert.equal(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')),true);
});

test('provider Retry-After persists across worker restarts and defers model calls', async () => {
  const f = await fixture({ employerCrawl: false });
  let attempts = 0;
  f.worker.extractor = async () => {
    attempts++; const error = new DomainError('AI_RATE_LIMITED');
    error.retryable = true; error.retryAfterMs = 180000; throw error;
  };
  assert.ok((await f.worker.run(f.sourceId)).results.some(r => r.reason === 'AI_RATE_LIMITED'));
  const jobs = (await db.collection('m0_worker_jobs').get()).docs.map(value).filter(j => j.sourceId === f.sourceId && j.kind === 'detail');
  assert.equal(jobs[0].nextAt, '2026-09-26T10:03:00.000Z');
  f.advance(120000); assert.equal((await f.restart().run(f.sourceId)).results.length, 0);
  assert.equal(attempts, 1);
  f.advance(60000); assert.equal(detailResult(await f.restart().run(f.sourceId)).published, true);
});

test('qualified synthetic notice reaches public feed without an operator command', async () => {
  const f = await fixture(), result = detailResult(await f.worker.run(f.sourceId));
  assert.equal(result.published, true);
  const detail = await f.catalogue.detail(result.recordId);
  assert.equal(detail.kind, 'opportunity'); assert.equal(detail.opportunity.application.state, 'available');
  assert.equal(detail.opportunity.checks.every(c => c.method === 'automatic'), true);
  assert.equal(detail.opportunity.requirements.expression.op, 'any');
  assert.ok((await f.catalogue.list(new URLSearchParams())).items.some(o => o.id === result.recordId));
  assert.equal(f.state.modelCalls, 1); assert.equal(f.state.validations, 1);
  assert.equal(f.state.requests.filter(r => r.format === 'html').length, 3);
  assert.doesNotMatch(JSON.stringify(detail), /worker_|reviewedBy|sourceSnapshotIds|qualificationRef/);
});

test('reruns and restart reuse model results; fresh retrieval renews checks without duplicate IDs', async () => {
  const f = await fixture(), first = detailResult(await f.worker.run(f.sourceId));
  assert.equal((await f.restart().run(f.sourceId)).results.length, 0);
  f.advance(24 * 3600000);
  const second = detailResult(await f.restart().run(f.sourceId));
  assert.equal(second.recordId, first.recordId); assert.equal(second.snapshotId, first.snapshotId);
  assert.equal(f.state.modelCalls, 1); assert.equal(f.state.validations, 1);
  assert.equal((await f.catalogue.detail(first.recordId)).opportunity.revision, 2);
});

test('shadow mode exercises the same gates and saves a private draft', async () => {
  const f = await fixture({ mode: 'shadow', publisher: false }), result = detailResult(await f.worker.run(f.sourceId));
  assert.equal(result.published, false);
  await assert.rejects(f.catalogue.detail(result.recordId), /NOT_FOUND/);
  const draft = value(await f.worker.ref('drafts', result.recordId).get());
  assert.equal(draft.lifecycle, 'review'); assert.equal(draft.publication.approved, false);
});

test('semantic failure preserves source/primary evidence and queues an exception', async () => {
  const f = await fixture(); f.state.supported = false;
  const result = await f.worker.run(f.sourceId);
  assert.ok(result.results.some(r => r.reason === 'SEMANTIC_VALIDATION_FAILED'));
  const rows = await db.collection('m0_worker_exceptions').get();
  const exception = rows.docs.map(value).find(e => e.sourceId === f.sourceId);
  assert.ok(exception.snapshotId); assert.ok(exception.primarySnapshotId);
  assert.equal((await f.worker.ref('worker_candidates', exception.jobId).get()).exists, true);
  await assert.rejects(f.catalogue.detail(exception.recordId), /NOT_FOUND/);
});

test('unqualified employer relationship and a different primary employer cannot publish', async () => {
  const f = await fixture(); f.source.automation.issuers = [];
  await f.worker.ref('sources', f.sourceId).set(payload(f.source));
  assert.ok((await f.worker.run(f.sourceId)).results.some(r => r.reason === 'ISSUER_RELATIONSHIP_UNQUALIFIED'));
  assert.equal(f.state.requests.some(r => r.url === 'https://employer.example/apply'), false);
  assert.equal(f.state.modelCalls, 0);
  const g = await fixture(); g.state.primary = primaryHtml('Different employer');
  assert.ok((await g.worker.run(g.sourceId)).results.some(r => r.reason === 'PRIMARY_ISSUER_MISMATCH'));
});

test('publication requires a separate machine grant; source policy alone cannot grant it', async () => {
  const f = await fixture({ publisher: false });
  assert.ok((await f.worker.run(f.sourceId)).results.some(r => r.reason === 'WORKER_FORBIDDEN'));
  const jobs = (await db.collection('m0_worker_jobs').get()).docs.map(value).filter(j => j.sourceId === f.sourceId && j.recordId);
  assert.equal(jobs.length, 1); await assert.rejects(f.catalogue.detail(jobs[0].recordId), /NOT_FOUND/);
});

test('revoked machine authority during a model call blocks late publication', async () => {
  const f = await fixture();
  f.state.afterValidation = async () => f.worker.ref('workers', f.worker.actor).update({ active: false });
  await assert.rejects(f.worker.run(f.sourceId), /WORKER_FORBIDDEN/);
  const jobs = (await db.collection('m0_worker_jobs').get()).docs.map(value).filter(j => j.sourceId === f.sourceId && j.recordId);
  await assert.rejects(f.catalogue.detail(jobs[0].recordId), /NOT_FOUND/);
});

test('source pause during extraction prevents late results from becoming public', async () => {
  const f = await fixture();
  f.worker.extractor = async () => { await f.worker.ref('sources', f.sourceId).set(payload({ ...f.source, paused: true, revision: 2 }));
    return { extraction: syntheticExtraction(), provenance: {} }; };
  await assert.rejects(f.worker.run(f.sourceId), /SOURCE_PAUSED/);
});

test('public reads suppress expired automatic checks even with a stopped worker', async () => {
  const f = await fixture(), result = detailResult(await f.worker.run(f.sourceId));
  f.advance(24 * 3600000);
  const expired = await f.catalogue.detail(result.recordId);
  assert.equal(expired.kind, 'status'); assert.equal(expired.status.application, 'unavailable');
  assert.equal((await f.catalogue.list(new URLSearchParams())).items.some(o => o.id === result.recordId), false);
});

test('failed primary recheck restricts a previous action without claiming closure or renewing checks', async () => {
  const f = await fixture({ cadenceHours: 1 }), first = detailResult(await f.worker.run(f.sourceId));
  const before = value(await f.worker.ref('drafts', first.recordId).get());
  f.advance(3600000); f.state.failPrimary = true;
  const result = await f.worker.run(f.sourceId);
  assert.ok(result.results.some(r => r.state === 'pending' && r.reason === 'UNSUPPORTED_RESPONSE'));
  assert.equal((await f.catalogue.detail(first.recordId)).status.status, 'under_review');
  const after = value(await f.worker.ref('drafts', first.recordId).get());
  assert.equal(after.lifecycle, 'review'); assert.deepEqual(after.checks, before.checks);
});

test('daily call reservation survives restarts and prevents a partial validation from publishing', async () => {
  const f = await fixture({ calls: 1 });
  assert.ok((await f.worker.run(f.sourceId)).results.some(r => r.reason === 'MODEL_BUDGET_EXHAUSTED'));
  assert.equal(f.state.modelCalls, 1); assert.equal(f.state.validations, 0);
  f.advance(24 * 3600000);
  const next = detailResult(await f.restart().run(f.sourceId));
  assert.equal(next.published, true); assert.equal(f.state.modelCalls, 1); assert.equal(f.state.validations, 1);
});

test('source lease excludes concurrent workers and expired crash leases can be reclaimed', async () => {
  const f = await fixture(), id = await f.worker.schedule(f.sourceId);
  const claims = await Promise.allSettled([f.worker.claim(f.sourceId, id), f.restart().claim(f.sourceId, id)]);
  assert.equal(claims.filter(c => c.status === 'fulfilled').length, 1);
  f.advance(11 * 60000);
  const recovered = await f.restart().claim(f.sourceId, id); assert.equal(recovered.attempts, 2);
  f.advance(11 * 60000); await f.restart().claim(f.sourceId, id);
  f.advance(11 * 60000); assert.equal(await f.restart().claim(f.sourceId, id), null);
  assert.equal((await f.worker.ref('worker_queue', id).get()).exists, false);
});

test('robots denial becomes a discovery exception before HTML or model access', async () => {
  const f = await fixture(); f.state.denyRobots = true;
  assert.ok((await f.worker.run(f.sourceId)).results.some(r => r.reason === 'ROBOTS_DISALLOWED'));
  assert.equal(f.state.requests.length, 1); assert.equal(f.state.modelCalls, 0);
});

test('past and closing-day notices preserve evidence but spend no model calls', async () => {
  for (const date of ['25 September 2026', '26 September 2026']) {
    const f = await fixture(); f.state.html = detailHtml.replace('30 October 2026', date);
    const result = await f.worker.run(f.sourceId);
    assert.ok(result.results.some(r => r.reason === 'NOTICE_NOT_OPEN'));
    assert.equal(f.state.modelCalls, 0); assert.equal(f.state.validations, 0);
    assert.equal(f.state.requests.some(r => r.url.startsWith('https://employer.example/')), false);
    const rows = (await db.collection('m0_worker_exceptions').get()).docs.map(value);
    const exception = rows.find(e => e.sourceId === f.sourceId);
    assert.ok(exception.snapshotId);
    assert.equal((await f.worker.ref('snapshots', exception.snapshotId).get()).exists, true);
  }
});

test('primary robots denial stops before AI or fetching the application notice', async () => {
  const f = await fixture(); f.state.denyPrimaryRobots = true;
  assert.ok((await f.worker.run(f.sourceId)).results.some(r => r.reason === 'ROBOTS_DISALLOWED'));
  assert.equal(f.state.modelCalls, 0); assert.equal(f.state.validations, 0);
  assert.equal(f.state.requests.some(r => r.url === 'https://employer.example/apply'), false);
});

test('repeated equivalent deadline wording can publish without flattening conflicting dates', async () => {
  const f = await fixture();
  f.state.html = detailHtml.replace('</div>', '<p>Apply by: 30/10/2026</p></div>');
  assert.equal(detailResult(await f.worker.run(f.sourceId)).published, true);
  const g = await fixture();
  g.state.html = detailHtml.replace('</div>', '<p>Apply by: 31/10/2026</p></div>');
  assert.ok((await g.worker.run(g.sourceId)).results.some(r => r.reason === 'NOTICE_PRECISION_UNSUPPORTED'));
  assert.equal(g.state.modelCalls, 0);
});

test('operator withdrawal is sticky across future collection and cached model output', async () => {
  const f = await fixture(), first = detailResult(await f.worker.run(f.sourceId));
  const uid = `reviewer_${randomUUID()}`;
  await f.worker.ref('operators', uid).set({ active: true, roles: ['reviewer'] });
  const operator = new Catalogue(db, { verifyIdToken: async () => ({ uid }) }, f.now);
  await operator.publish('synthetic-verified-token', first.recordId, 1, 'withdraw', 'Synthetic operator correction');
  f.advance(24 * 3600000);
  assert.ok((await f.restart().run(f.sourceId)).results.some(r => r.reason === 'RESTORE_REQUIRES_REVIEW'));
  assert.equal((await f.catalogue.detail(first.recordId)).status.status, 'withdrawn');
});

test('material source changes invalidate the old public action before new model work completes', async () => {
  const f = await fixture(), first = detailResult(await f.worker.run(f.sourceId));
  f.advance(24 * 3600000); f.state.html = detailHtml.replace('Grade 12 with Mathematics OR N3 Electrical', 'Grade 12 with Mathematics AND N3 Electrical');
  f.worker.extractor = async () => {
    assert.equal((await f.catalogue.detail(first.recordId)).status.status, 'under_review');
    throw new DomainError('AI_INVALID_EXTRACTION');
  };
  assert.ok((await f.worker.run(f.sourceId)).results.some(r => r.reason === 'AI_INVALID_EXTRACTION'));
  assert.equal((await f.catalogue.detail(first.recordId)).status.status, 'under_review');
});

test('published notices are rechecked even when category discovery no longer finds them', async () => {
  const f = await fixture(), first = detailResult(await f.worker.run(f.sourceId));
  f.advance(24 * 3600000); f.state.listing = '<h1>Changed category layout</h1>';
  const next = detailResult(await f.restart().run(f.sourceId));
  assert.equal(next.recordId, first.recordId); assert.equal(next.published, true);
  assert.equal((await f.catalogue.detail(first.recordId)).opportunity.revision, 2);
});

test('a programme model cannot override the source-bound route and a valid sibling still completes',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=programmeHtml;
  f.source.automation.issuers[0].emailAddresses=['electrical@employer.example','plumbing@employer.example'];await f.worker.ref('sources',f.sourceId).set(payload(f.source));
  const candidate=parseRecentJobsDetail({html:programmeHtml,url:detailUrl});let calls=0;
  const worker=f.restart(programmeOptions(async(_url,init)=>{
    calls++;const input=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text),answer=programmeResponse(input,candidate);
    if(!input.extracted&&input.selectedIntake.reference.value.startsWith('Electrical'))answer.applicationCandidateIndex=1;
    return geminiAnswer(answer);
  }));
  const result=(await worker.run(f.sourceId)).results.find(r=>r.programmes);
  assert.equal(result.programmes[0].reason,'AI_INVALID_EXTRACTION');assert.equal(result.programmes[1].state,'draft');assert.equal(calls,3);
  const held=(await db.collection('m0_worker_programme_decisions').get()).docs.map(value).find(d=>d.sourceId===f.sourceId&&d.decision==='exception');
  assert.equal((await worker.ref('drafts',createHash('sha256').update(`${f.sourceId}:${held.intakeId}`).digest('hex')).get()).exists,false);
  const draft=value(await worker.ref('drafts',result.programmes[1].recordId).get());
  assert.equal(draft.applicationRoute.value.destination,'plumbing@employer.example');
  assert.equal((await worker.ref('public',draft.id).get()).exists,false);
});

test('shared email with distinct explicit trade subjects cannot enter a single-notice extraction path',async()=>{
  for(const [mode,programmes] of [['automatic',false],['shadow',false],['shadow',true]]){
    const f=await fixture({mode,publisher:mode==='automatic',employerCrawl:false});
    f.state.html=detailHtml.replace('<a href="https://employer.example/apply">Apply now</a>',
      '<h2>How to apply</h2><p>Send an email to:</p><p>jobs@employer.example</p><p>Use the correct subject line:</p><p>Electrical — if applying for Electrical</p><p>Plumbing — if applying for Plumbing</p>');
    f.source.automation.issuers[0].emailAddresses=['jobs@employer.example'];await f.worker.ref('sources',f.sourceId).set(payload(f.source));
    const worker=programmes?f.restart(programmeOptions(async()=>assert.fail('Unsupported subjects reached AI'))):f.worker;
    const result=await worker.run(f.sourceId);
    assert.ok(result.results.some(r=>r.reason===(programmes?'PROGRAMME_LAYOUT_UNSUPPORTED':'NOTICE_PROGRAMME_SCOPE_REVIEW_REQUIRED')));
    assert.equal(f.state.modelCalls,0);assert.equal(f.state.validations,0);
    const receipts=(await db.collection('m0_model_calls').get()).docs.map(value).filter(r=>r.sourceId===f.sourceId);assert.equal(receipts.length,0);
    const plans=(await db.collection('m0_worker_programme_plans').get()).docs.map(value).filter(r=>r.sourceId===f.sourceId);
    assert.equal(plans.length,mode==='shadow'?1:0);if(plans.length)assert.equal(plans[0].plan.state,'unsupported');
  }
});

const subjectProgrammeHtml=await readFile(new URL('./fixtures/recentjobs-subject-programmes.html',import.meta.url),'utf8');
test('opt-in subject programmes create distinct private drafts with a shared email and exact subjects',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=subjectProgrammeHtml;
  f.source.automation.issuers[0].emailAddresses=['jobs@employer.example'];await f.worker.ref('sources',f.sourceId).set(payload(f.source));
  const candidate=parseRecentJobsDetail({html:subjectProgrammeHtml,url:detailUrl});let calls=0;
  const worker=f.restart(programmeOptions(async(_url,init)=>{
    calls++;const input=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);
    return geminiAnswer(input.extracted?{supported:true,issues:[],evidence:[{source:'recentjobs',quote:input.selectedIntake.subject.originalText}]}:subjectProgrammeWire(candidate,input.selectedIntake));
  }));
  const result=(await worker.run(f.sourceId)).results.find(r=>r.programmes);
  assert.equal(result.draftCount,2);assert.equal(calls,4);assert.notEqual(result.programmes[0].recordId,result.programmes[1].recordId);
  const drafts=await Promise.all(result.programmes.map(r=>worker.ref('drafts',r.recordId).get().then(value)));
  assert.deepEqual(drafts.map(d=>d.title.value),['Electrical','Plumbing']);assert.ok(drafts.every(d=>d.intake.state==='not_stated'&&d.applicationRoute.value.destination==='jobs@employer.example'&&!d.publication.approved));
  assert.deepEqual(drafts.map(d=>d.practicalConditions.value),['Electrical — if applying for Electrical','Plumbing — if applying for Plumbing']);
  for(const r of result.programmes)assert.equal((await worker.ref('public',r.recordId).get()).exists,false);
  const receipts=(await db.collection('m0_model_calls').get()).docs.map(value).filter(r=>r.sourceId===f.sourceId);assert.equal(receipts.length,4);
});

test('explicit qualification uncertainty stops before candidate storage, validation and drafts',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=subjectProgrammeHtml.replace('<p>SOR is not accepted.</p>',"<p>SOR is not accepted.</p><p>The advert doesn't specify which qualification subjects are required.</p>");
  f.source.automation.issuers[0].emailAddresses=['jobs@employer.example'];await f.worker.ref('sources',f.sourceId).set(payload(f.source));
  const candidate=parseRecentJobsDetail({html:f.state.html,url:detailUrl});let calls=0;
  const worker=f.restart(programmeOptions(async(_url,init)=>{
    calls++;const input=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);assert.equal(input.extracted,undefined);
    return geminiAnswer(subjectProgrammeWire(candidate,input.selectedIntake));
  }));
  const result=(await worker.run(f.sourceId)).results.find(r=>r.programmes);
  assert.equal(result.draftCount,0);assert.equal(calls,2);assert.ok(result.programmes.every(r=>r.reason==='MATERIAL_FACTS_UNRESOLVED'));
  const candidates=(await db.collection('m0_worker_programme_candidates').get()).docs.map(value).filter(r=>r.sourceId===f.sourceId);assert.equal(candidates.length,0);
  const decisions=(await db.collection('m0_worker_programme_decisions').get()).docs.map(value).filter(r=>r.sourceId===f.sourceId);
  assert.equal(decisions.length,2);assert.ok(decisions.every(d=>d.reason==='MATERIAL_FACTS_UNRESOLVED'));
});

test('unsupported location metadata stops programme worker before candidate storage or validation',async()=>{
 const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});f.state.html=subjectProgrammeHtml;
 f.source.automation.issuers[0].emailAddresses=['jobs@employer.example'];await f.worker.ref('sources',f.sourceId).set(payload(f.source));
 const candidate=parseRecentJobsDetail({html:f.state.html,url:detailUrl});let calls=0;
 const worker=f.restart(programmeOptions(async(_url,init)=>{
  calls++;const input=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);assert.equal(input.extracted,undefined,'Validation must not run for unsupported location');
  const wire=subjectProgrammeWire(candidate,input.selectedIntake);wire.location.value.attendance='in_person';return geminiAnswer(wire);
 }));
 const result=(await worker.run(f.sourceId)).results.find(r=>r.programmes);assert.equal(calls,2);assert.equal(result.draftCount,0);
 assert.ok(result.programmes.every(r=>r.reason==='AI_LOCATION_EVIDENCE_UNRESOLVED'));
 const candidates=(await db.collection('m0_worker_programme_candidates').get()).docs.map(value).filter(r=>r.sourceId===f.sourceId);assert.equal(candidates.length,0);
 const decisions=(await db.collection('m0_worker_programme_decisions').get()).docs.map(value).filter(r=>r.sourceId===f.sourceId);assert.equal(decisions.length,2);assert.ok(decisions.every(r=>r.reason==='AI_LOCATION_EVIDENCE_UNRESOLVED'));
});

const quotaResponse = (_url,init) => {
  const input=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);
  return geminiAnswer(input.extracted?{supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Grade 12 with Mathematics OR N3 Electrical'}]}:compactWire());
};
const quotaFixture = () => fixture({mode:'shadow',publisher:false,employerCrawl:false});
const quotaOptions = (project,fetchImpl,limits={}) => ({...geminiOptions(fetchImpl),env:{...geminiEnv,SKILVED_GEMINI_PROJECT_ID:project,SKILVED_GEMINI_MODEL_LIMITS:JSON.stringify(limits)}});
const quotaRows = async (worker,name) => (await db.collection('m0_'+name).get()).docs.map(value).filter(r=>r.scopeHash===worker.quotaScope);

// Advance only the provider's generation clock. Firestore and worker leases keep
// their own clocks, so authored 45-second failures need no real network or wait.
const windowOptions = (handler, project=`authored-${randomUUID()}`) => {
  let clock=0;const requests=[];
  const fetchImpl=async(url,init)=>{
    const body=JSON.parse(init.body),input=JSON.parse(body.contents[0].parts[0].text),row={model:url.split('/models/')[1].split(':')[0],validation:!!input.extracted,body};
    requests.push(row);return handler(row,()=>{clock+=45000;throw Error('AUTHORED_UNAVAILABLE');},()=>quotaResponse(url,init));
  };
  const options=quotaOptions(project,fetchImpl);
  options.extractor=(candidate,o)=>extractWithProvider(candidate,{...o,fetchImpl,now:()=>clock});
  options.validator=(input,o)=>validateExtraction(input,{...o,fetchImpl,now:()=>clock});
  return {options,requests};
};
const detailJob = async f => (await db.collection('m0_worker_jobs').get()).docs.map(value).find(j=>j.sourceId===f.sourceId&&j.kind==='detail');
const advanceToJob = (f,job) => f.advance(Math.max(0,Date.parse(job.nextAt)-Date.parse(f.now())));
const sourceCalls = async f => (await db.collection('m0_model_calls').get()).docs.map(value).filter(r=>r.sourceId===f.sourceId);

test('Gemini worker receipts retain only safe transport labels and preserve failed spending across restart',async()=>{
  for(const [code,expected] of [['EAI_AGAIN','EAI_AGAIN'],['UND_ERR_CONNECT_TIMEOUT','UND_ERR_CONNECT_TIMEOUT'],['PRIVATE_API_KEY',null]]){
    const f=await quotaFixture(),requests=[];let unavailable=true;
    const options=quotaOptions(`authored-${randomUUID()}`,async(url,init)=>{
      requests.push(url.split('/models/')[1].split(':')[0]);
      if(unavailable)throw new TypeError('PRIVATE_TRANSPORT_MESSAGE',{cause:Object.assign(new Error('PRIVATE_HOST_AND_KEY'),{code})});
      return quotaResponse(url,init);
    });
    const worker=f.restart(options);await worker.run(f.sourceId);
    const job=await detailJob(f),receipts=await sourceCalls(f);
    assert.equal(job.state,'pending');assert.equal(job.error,'AI_TRANSPORT_FAILED');assert.equal(job.modelWindowRetries,1);
    assert.deepEqual(requests,GEMINI_MODEL_CHAIN);assert.equal(receipts.length,6);
    assert.ok(receipts.every(r=>r.transportCode===expected&&r.error==='AI_TRANSPORT_FAILED'&&r.usage===null&&r.providerStatus===null));
    assert.doesNotMatch(JSON.stringify(receipts),/PRIVATE_/);
    let usage=await quotaRows(worker,'model_usage');assert.equal(usage.reduce((n,u)=>n+u.requests,0),6);
    assert.equal(usage.reduce((n,u)=>n+u.unknownUsageCalls,0),6);assert.equal(usage.reduce((n,u)=>n+u.knownTotalTokens,0),0);
    assert.equal((await quotaRows(worker,'model_availability')).length,0);
    // The real generation clock can round the earliest retry just before the
    // fixture clock's per-model cooldown. Resume at the stored holds, not a
    // guessed delay, when testing receipt preservation rather than wake timing.
    const beforeBudget=(await db.collection('m0_model_budgets').get()).docs.map(value).find(b=>b.sourceId===f.sourceId);
    const resumeAt=Math.max(Date.parse(job.nextAt),...Object.values(beforeBudget.nextCallByModel).map(at=>Date.parse(at)));
    unavailable=false;f.advance(resumeAt-Date.parse(f.now()));const result=await f.restart(options).runJob(f.sourceId,job.id);
    assert.equal(result.state,'done');assert.equal(result.published,false);
    const final=await sourceCalls(f);assert.equal(final.length,8);
    for(const row of receipts)assert.deepEqual(final.find(r=>r.model===row.model&&r.state==='failed'),row);
    assert.ok(final.filter(r=>r.state==='received').every(r=>r.transportCode===null));
    usage=await quotaRows(worker,'model_usage');assert.equal(usage.reduce((n,u)=>n+u.requests,0),8);
    assert.equal(usage.reduce((n,u)=>n+u.unknownUsageCalls,0),6);assert.equal(usage.reduce((n,u)=>n+u.knownTotalTokens,0),30);
    const budget=(await db.collection('m0_model_budgets').get()).docs.map(value).find(b=>b.sourceId===f.sourceId);assert.equal(budget.calls,8);
    const draft=value(await worker.ref('drafts',result.recordId).get());assert.equal(draft.publication.approved,false);
    assert.equal((await worker.ref('public',result.recordId).get()).exists,false);
  }
});

test('worker receipt transport labels cannot be populated by arbitrary injected fields or provider rejections',async()=>{
  for(const [code,label,expected] of [['AI_TRANSPORT_FAILED','PRIVATE_API_KEY',null],['AI_PROVIDER_REJECTED','EAI_AGAIN',null],['AI_TRANSPORT_FAILED','ECONNRESET','ECONNRESET']]){
    const f=await quotaFixture(),worker=f.restart(quotaOptions(`authored-${randomUUID()}`,()=>assert.fail('No network expected')));
    const claim=await worker.claim(f.sourceId,await worker.schedule(f.sourceId));
    const error=Object.assign(new DomainError(code),{transportCode:label,retryable:true});
    await assert.rejects(worker.modelCall(claim,'extraction',async()=>{throw error;},{model:GEMINI_MODEL_CHAIN[0]}),e=>e===error);
    const calls=await sourceCalls(f);assert.equal(calls.length,1);assert.equal(calls[0].transportCode,expected);
    assert.equal(calls[0].usage,null);assert.doesNotMatch(JSON.stringify(calls),/PRIVATE_API_KEY/);
    assert.equal((await quotaRows(worker,'model_usage'))[0].unknownUsageCalls,1);
  }
});

test('Gemini model windows reach the final model across restarts and reuse extraction during validation continuation',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false,calls:12});
  const {options,requests}=windowOptions((r,expire,respond)=>r.model===GEMINI_MODEL_CHAIN.at(-1)?respond():expire());
  let worker=f.restart(options),result=await worker.run(f.sourceId),job=await detailJob(f);
  assert.ok(result.results.some(r=>r.state==='pending'&&r.reason==='AI_TIMEOUT'));
  assert.equal(job.modelWindow.nextModel,'gemini-3.6-flash');assert.equal(job.modelWindow.stage,'extraction');
  assert.equal(job.modelWindowRetries,1);const preserved=await sourceCalls(f);assert.equal(preserved.length,2);
  for(let run=2;run<=5;run++){
    advanceToJob(f,job);worker=f.restart(options);result=await worker.runJob(f.sourceId,job.id);job=await detailJob(f);
    if(run<5)assert.equal(result.state,'pending');
    if(run===3){assert.equal(job.modelWindow.stage,'validation');assert.equal(requests.filter(r=>!r.validation).length,6);}
  }
  assert.equal(result.state,'done');assert.equal(result.published,false);assert.equal(job.attempts,5);assert.equal(job.modelWindowRetries,4);assert.equal(job.modelWindow,null);
  for(const validation of [false,true]){
    const rows=requests.filter(r=>r.validation===validation);assert.deepEqual(rows.map(r=>r.model),GEMINI_MODEL_CHAIN);
    for(const row of rows)assert.deepEqual(row.body,rows[0].body);
  }
  const calls=await sourceCalls(f);assert.equal(calls.length,12);assert.equal(calls.filter(c=>c.usage===null).length,10);
  for(const prior of preserved)assert.deepEqual(calls.find(c=>c.requestHash===prior.requestHash),prior);
  const budgets=(await db.collection('m0_model_budgets').get()).docs.map(value).filter(b=>b.sourceId===f.sourceId);assert.equal(budgets[0].calls,12);
  const usage=await quotaRows(worker,'model_usage');assert.equal(usage.reduce((n,u)=>n+u.requests,0),12);assert.equal(usage.reduce((n,u)=>n+u.unknownUsageCalls,0),10);assert.equal(usage.reduce((n,u)=>n+u.knownTotalTokens,0),30);
  const draft=value(await worker.ref('drafts',result.recordId).get());assert.equal(draft.publication.approved,false);assert.equal(draft.applicationRoute.value.destination,'https://employer.example/apply');assert.equal((await worker.ref('public',result.recordId).get()).exists,false);
});

test('Gemini model windows stop after six availability windows with every failed call still spent',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false,calls:40}),{options,requests}=windowOptions(()=>new Response(null,{status:503}));
  let worker=f.restart(options);await worker.run(f.sourceId);let job=await detailJob(f),result;
  for(let run=2;run<=6;run++){advanceToJob(f,job);worker=f.restart(options);result=await worker.runJob(f.sourceId,job.id);job=await detailJob(f);}
  assert.equal(result.state,'exception');assert.equal(result.reason,'AI_PROVIDER_REJECTED');assert.equal(job.attempts,6);assert.equal(job.modelWindowRetries,5);assert.equal(requests.length,36);
  assert.equal((await sourceCalls(f)).length,36);assert.ok((await sourceCalls(f)).every(c=>c.usage===null));
  assert.equal((await worker.ref('worker_queue',job.id).get()).exists,false);assert.equal(value(await worker.ref('worker_exceptions',job.id).get()).modelWindowRetries,5);
  advanceToJob(f,job);await assert.rejects(worker.runJob(f.sourceId,job.id),/JOB_UNAVAILABLE/);assert.equal(requests.length,36);
});

test('Gemini model windows wait for the earliest model hold and create no skipped reservations',async()=>{
  const f=await quotaFixture(),{options,requests}=windowOptions((_r,_expire,respond)=>respond()),worker=f.restart(options);
  for(const model of GEMINI_MODEL_CHAIN.slice(1))await worker.holdModelForDay(f.sourceId,model);
  const budgetId=createHash('sha256').update(`${f.sourceId}:2026-09-26`).digest('hex');
  await worker.ref('model_budgets',budgetId).set(payload({sourceId:f.sourceId,date:'2026-09-26',calls:0,nextCallByModel:{'gemini-3.8-flash':new Date(Date.parse(f.now())+120000).toISOString()}}));
  await worker.run(f.sourceId);const job=await detailJob(f);assert.equal(job.nextAt,'2026-09-26T10:02:00.000Z');assert.equal(requests.length,0);assert.equal((await sourceCalls(f)).length,0);assert.equal((await quotaRows(worker,'model_usage')).length,0);
  f.advance(119999);await assert.rejects(f.restart(options).runJob(f.sourceId,job.id),/JOB_UNAVAILABLE/);
  f.advance(1);const result=await f.restart(options).runJob(f.sourceId,job.id);assert.equal(result.state,'done');assert.deepEqual(requests.map(r=>r.model),['gemini-3.8-flash','gemini-3.8-flash']);
});

test('Gemini model windows preserve all daily holds until Pacific reset without polling them',async()=>{
  const f=await quotaFixture(),{options,requests}=windowOptions((_r,_expire,respond)=>respond()),worker=f.restart(options);
  for(const model of GEMINI_MODEL_CHAIN)await worker.holdModelForDay(f.sourceId,model);
  await worker.run(f.sourceId);const job=await detailJob(f);assert.equal(job.nextAt,'2026-09-27T07:00:00.000Z');assert.equal(job.modelWindowRetries,1);assert.equal(requests.length,0);assert.equal((await sourceCalls(f)).length,0);
  const holds=await quotaRows(worker,'model_availability');advanceToJob(f,job);assert.equal((await f.restart(options).runJob(f.sourceId,job.id)).state,'done');
  assert.deepEqual(requests.map(r=>r.model),['gemini-3.8-flash','gemini-3.8-flash']);assert.deepEqual(await quotaRows(worker,'model_availability'),holds);
});

test('Gemini model windows reconsider earlier models after a continued suffix is entirely held',async()=>{
  const f=await quotaFixture();let unavailable=true;
  const {options,requests}=windowOptions((_r,expire,respond)=>unavailable?expire():respond());let worker=f.restart(options);
  await worker.run(f.sourceId);let job=await detailJob(f);assert.equal(job.modelWindow.nextModel,'gemini-3.6-flash');
  for(const model of GEMINI_MODEL_CHAIN.slice(2))await worker.holdModelForDay(f.sourceId,model);
  unavailable=false;advanceToJob(f,job);worker=f.restart(options);
  assert.equal((await worker.runJob(f.sourceId,job.id)).state,'pending');job=await detailJob(f);
  assert.equal(job.modelWindow,null);assert.equal(requests.length,2);assert.ok(Date.parse(job.nextAt)-Date.parse(f.now())<=120000);
  advanceToJob(f,job);assert.equal((await f.restart(options).runJob(f.sourceId,job.id)).state,'done');
  assert.deepEqual(requests.slice(2).map(r=>r.model),['gemini-3.8-flash','gemini-3.8-flash']);assert.equal((await sourceCalls(f)).length,4);
});

test('Gemini model windows do not carry a cursor into changed evidence, source revision, configuration, scope or provider day',async()=>{
  for(const change of ['evidence','revision','thinking','configured_model','scope','provider_day']){
    const f=await quotaFixture();let unavailable=true;
    const {options,requests}=windowOptions((_r,expire,respond)=>unavailable?expire():respond());let worker=f.restart(options);
    await worker.run(f.sourceId);const job=await detailJob(f);assert.equal(job.modelWindow.nextModel,'gemini-3.6-flash');unavailable=false;f.advance(180000);
    if(change==='evidence'){
      const before=parseRecentJobsDetail({html:f.state.html,url:detailUrl});
      f.state.html=f.state.html.replace('Fictional electrical apprentice','Fictional electrical apprentice Updated');
      assert.notEqual(parseRecentJobsDetail({html:f.state.html,url:detailUrl}).contentHash,before.contentHash);
    }
    if(change==='revision'){f.source.revision++;await worker.ref('sources',f.sourceId).set(payload(f.source));}
    if(change==='thinking')options.thinking='medium';
    if(change==='configured_model')options.model='gemini-3.7-flash';
    if(change==='scope')options.env={...options.env,SKILVED_GEMINI_PROJECT_ID:`authored-${randomUUID()}`};
    if(change==='provider_day')f.advance(21*3600000);
    worker=f.restart(options);const result=await worker.runJob(f.sourceId,job.id);assert.equal(result.state,'done',change);
    assert.equal(requests[2].model,change==='configured_model'?'gemini-3.7-flash':'gemini-3.8-flash',change);
    assert.equal((await sourceCalls(f)).length,4);assert.equal(value(await worker.ref('drafts',result.recordId).get()).publication.approved,false);
  }
});

test('Gemini model windows stop on schema, authentication and semantic validation failures without another model',async()=>{
  for(const failure of ['schema','authentication','semantic_validation']){
    const f=await quotaFixture();let unavailable=true;
    const {options,requests}=windowOptions((r,expire,respond)=>{
      if(unavailable)return expire();
      if(failure==='authentication')return new Response(null,{status:401});
      if(failure==='schema')return geminiAnswer({});
      if(r.validation)return geminiAnswer({supported:false,issues:[{field:'requirements',reason:'Authored semantic rejection'}],evidence:[{source:'recentjobs',quote:'Grade 12 with Mathematics OR N3 Electrical'}]});
      return respond();
    });
    await f.restart(options).run(f.sourceId);const job=await detailJob(f);unavailable=false;advanceToJob(f,job);
    const result=await f.restart(options).runJob(f.sourceId,job.id);assert.equal(result.state,'exception');
    assert.equal(result.reason,{schema:'AI_INVALID_EXTRACTION',authentication:'AI_PROVIDER_REJECTED',semantic_validation:'SEMANTIC_VALIDATION_FAILED'}[failure]);
    assert.equal(requests.length,failure==='semantic_validation'?4:3);assert.equal((await sourceCalls(f)).length,requests.length);
    const final=await detailJob(f);assert.equal(final.modelWindowRetries,1);assert.equal((await f.worker.ref('drafts',final.recordId).get()).exists,false);
  }
});

test('Gemini model windows do not consume the three ordinary source-failure attempts',async()=>{
  const f=await quotaFixture(),{options,requests}=windowOptions((_r,expire)=>expire());await f.restart(options).run(f.sourceId);let job=await detailJob(f),result;
  options.fetcher=async()=>{throw new DomainError('UNSUPPORTED_RESPONSE');};
  for(let n=0;n<3;n++){advanceToJob(f,job);result=await f.restart(options).runJob(f.sourceId,job.id);job=await detailJob(f);if(n<2)assert.equal(result.state,'pending');}
  assert.equal(result.state,'exception');assert.equal(job.attempts,4);assert.equal(job.modelWindowRetries,1);assert.equal(requests.length,2);assert.equal((await sourceCalls(f)).length,2);
});

test('Gemini model windows cannot bypass spent source budgets, revoked grants or a paused source',async()=>{
  for(const boundary of ['budget','revoked','paused']){
    const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false,calls:2}),{options,requests}=windowOptions((_r,expire)=>expire());
    const worker=f.restart(options);await worker.run(f.sourceId);const job=await detailJob(f);advanceToJob(f,job);
    if(boundary==='revoked')await worker.ref('workers',worker.actor).update({active:false});
    if(boundary==='paused'){f.source.paused=true;await worker.ref('sources',f.sourceId).set(payload(f.source));}
    if(boundary==='budget')assert.equal((await f.restart(options).runJob(f.sourceId,job.id)).reason,'MODEL_BUDGET_EXHAUSTED');
    else await assert.rejects(f.restart(options).runJob(f.sourceId,job.id),new RegExp(boundary==='revoked'?'WORKER_FORBIDDEN':'SOURCE_PAUSED'));
    assert.equal(requests.length,2);assert.equal((await sourceCalls(f)).length,2);
    const budgets=(await db.collection('m0_model_budgets').get()).docs.map(value).filter(b=>b.sourceId===f.sourceId);assert.equal(budgets[0].calls,2);
  }
});

test('daily provider exhaustion is shared across sources and keys, survives restart and expires at Pacific reset',async()=>{
  const project=`authored-${randomUUID()}`, f=await quotaFixture(),g=await quotaFixture(),requests=[];
  let exhausted=false;
  const options=quotaOptions(project,async(url,init)=>{
    const model=url.split('/models/')[1].split(':')[0];requests.push(model);
    if(model==='gemini-3.8-flash'&&!exhausted){exhausted=true;return Response.json({error:{details:[{'@type':'type.googleapis.com/google.rpc.QuotaFailure',violations:[{quotaId:'GenerateRequestsPerDayPerProjectPerModel-FreeTier',quotaDimensions:{model}}]}]}},{status:429});}
    return quotaResponse(url,init);
  });
  const worker=f.restart(options);assert.ok(detailResult(await worker.run(f.sourceId)));
  assert.deepEqual(requests,['gemini-3.8-flash','gemini-3.7-flash','gemini-3.7-flash']);
  const hold=value(await worker.ref('model_availability',worker.modelAvailabilityId('gemini-3.8-flash')).get());
  assert.equal(hold.reason,'provider_daily_exhaustion');assert.equal(hold.until,'2026-09-27T07:00:00.000Z');
  const otherOptions={...options,env:{...options.env,GEMINI_API_KEY:'another_authored_key'}};
  const restarted=g.restart(otherOptions);assert.ok(detailResult(await restarted.run(g.sourceId)));
  assert.deepEqual(requests.slice(3),['gemini-3.7-flash','gemini-3.7-flash']);
  const rows=await quotaRows(worker,'model_usage'),failed=rows.find(r=>r.model==='gemini-3.8-flash');
  assert.equal(failed.requests,1);assert.equal(failed.unknownUsageCalls,1);assert.equal(failed.knownTotalTokens,0);
  const success=rows.find(r=>r.model==='gemini-3.7-flash');assert.equal(success.requests,4);assert.equal(success.knownInputTokens,40);assert.equal(success.knownTotalTokens,60);
  const budgets=(await db.collection('m0_model_budgets').get()).docs.map(value).filter(r=>r.sourceId===g.sourceId);assert.equal(budgets[0].calls,2);
  const h=await quotaFixture();h.advance(21*3600000);assert.ok(detailResult(await h.restart(otherOptions).run(h.sourceId)));
  assert.deepEqual(requests.slice(5),['gemini-3.8-flash','gemini-3.8-flash']);
  assert.equal((await quotaRows(worker,'model_usage')).find(r=>r.model==='gemini-3.8-flash'&&r.date==='2026-09-27').requests,2);
});

test('operator daily hold skips a known exhausted model without reserving requests or spending budgets',async()=>{
  const f=await quotaFixture(),g=await quotaFixture(),requests=[];
  const options=quotaOptions(`authored-${randomUUID()}`,async(url,init)=>{requests.push(url.split('/models/')[1].split(':')[0]);return quotaResponse(url,init);});
  const worker=f.restart(options);await worker.holdModelForDay(f.sourceId,'gemini-3.8-flash');
  assert.ok(detailResult(await g.restart(options).run(g.sourceId)));
  assert.deepEqual(requests,['gemini-3.7-flash','gemini-3.7-flash']);
  assert.ok((await quotaRows(worker,'model_usage')).every(r=>r.model!=='gemini-3.8-flash'));
  await worker.ref('workers',worker.actor).update({active:false});
  await assert.rejects(worker.holdModelForDay(f.sourceId,'gemini-3.7-flash'),/WORKER_FORBIDDEN/);
});

test('configured daily request reservations skip that model across jobs, including concurrent claims',async()=>{
  const f=await quotaFixture(),g=await quotaFixture(),options=quotaOptions(`authored-${randomUUID()}`,quotaResponse,{'gemini-3.8-flash':{rpd:1}});
  const workers=[f.restart(options),g.restart(options)];
  const claims=await Promise.all(workers.map((w,i)=>w.schedule([f,g][i].sourceId).then(id=>w.claim([f,g][i].sourceId,id))));
  let sends=0;
  const results=await Promise.allSettled(workers.map((w,i)=>w.modelCall(claims[i],'extraction',async()=>{sends++;return {provenance:{usage:{inputTokens:10,totalTokens:15}}};},{model:'gemini-3.8-flash'})));
  assert.equal(sends,1);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  const error=results.find(r=>r.status==='rejected').reason;assert.equal(error.code,'AI_RATE_LIMITED');assert.equal(error.rateLimitKind,'daily');
  assert.equal((await quotaRows(workers[0],'model_usage'))[0].requests,1);
  const budgets=(await db.collection('m0_model_budgets').get()).docs.map(value).filter(r=>[f.sourceId,g.sourceId].includes(r.sourceId));assert.equal(budgets.reduce((n,b)=>n+b.calls,0),1);
});

test('shared rolling minute request and known token counters release across worker restarts',async()=>{
  for(const limits of [{rpm:1},{tpm:10}]){
    const f=await quotaFixture(),g=await quotaFixture(),requests=[];
    const options=quotaOptions(`authored-${randomUUID()}`,async(url,init)=>{requests.push(url.split('/models/')[1].split(':')[0]);return quotaResponse(url,init);},{'gemini-3.8-flash':limits});
    assert.ok(detailResult(await f.restart(options).run(f.sourceId)));
    assert.deepEqual(requests,['gemini-3.8-flash','gemini-3.7-flash']);
    assert.ok(detailResult(await g.restart(options).run(g.sourceId)));
    assert.deepEqual(requests.slice(2),['gemini-3.7-flash','gemini-3.7-flash']);
    const h=await quotaFixture();h.advance(60000);assert.ok(detailResult(await h.restart(options).run(h.sourceId)));
    assert.equal(requests[4],'gemini-3.8-flash');
    const usage=(await quotaRows(h.restart(options),'model_usage')).find(r=>r.model==='gemini-3.8-flash');assert.equal(usage.requests,2);assert.equal(usage.minute.length,1);
  }
});

test('rolling request limits remain active through a Pacific daily reset',async()=>{
  const f=await quotaFixture(),g=await quotaFixture();
  f.advance(Date.parse('2026-09-27T06:59:45.000Z')-Date.parse(f.now()));
  g.advance(Date.parse('2026-09-27T07:00:01.000Z')-Date.parse(g.now()));
  const options=quotaOptions(`authored-${randomUUID()}`,quotaResponse,{'gemini-3.8-flash':{rpm:1}}),a=f.restart(options),b=g.restart(options);
  const claimA=await a.claim(f.sourceId,await a.schedule(f.sourceId)),claimB=await b.claim(g.sourceId,await b.schedule(g.sourceId));let sends=0;
  const work=async()=>{sends++;return {provenance:{usage:{inputTokens:10,totalTokens:15}}};};
  await a.modelCall(claimA,'extraction',work,{model:'gemini-3.8-flash'});
  await assert.rejects(b.modelCall(claimB,'extraction',work,{model:'gemini-3.8-flash'}),error=>error.code==='AI_RATE_LIMITED'&&error.rateLimitKind==='minute');
  assert.equal(sends,1);g.advance(44000);
  await b.modelCall(claimB,'extraction',work,{model:'gemini-3.8-flash'});assert.equal(sends,2);
  const rows=await quotaRows(a,'model_usage');assert.equal(rows.length,2);assert.ok(rows.every(r=>r.requests===1));
});

test('split qualification evidence stops the worker before candidate storage, validation or drafts',async()=>{
 const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});
 const passage='Grade 12\nMathematics (Core) — not Mathematical Literacy\nPhysical Science\nEngineering Graphics & Design (EGD)';
 f.state.html=detailHtml.replace('<p>Applicants require Grade 12 with Mathematics OR N3 Electrical.</p>','<h2>Minimum requirements</h2><p>'+passage.split('\n').join('</p><p>')+'</p>');
 assert.ok(f.state.html.includes('<p>Physical Science</p>'));
 f.worker.extractor=async()=>{
  f.state.modelCalls++;const extraction=syntheticExtraction();
  extraction.requirements={items:passage.split('\n').map((quote,index)=>({id:'q'+index,kind:'education',level:'required',fact:{state:'stated',value:{description:quote,qualification:null,document:null},quote}})),expression:{op:'all',children:[0,1,2,3].map(index=>({op:'ref',id:'q'+index}))}};
  return {extraction,provenance:{usage:{totalTokens:20}}};
 };
 const drafts=(await db.collection('m0_drafts').get()).size,publicRows=(await db.collection('m0_public').get()).size;
 const result=await f.worker.run(f.sourceId);assert.ok(result.results.some(r=>r.reason==='AI_REQUIREMENT_GROUP_UNRESOLVED'));
 assert.equal(f.state.modelCalls,1);assert.equal(f.state.validations,0);
 const exception=(await db.collection('m0_worker_exceptions').get()).docs.map(value).find(e=>e.sourceId===f.sourceId);
 assert.equal((await f.worker.ref('worker_candidates',exception.jobId).get()).exists,false);
 assert.equal((await db.collection('m0_drafts').get()).size,drafts);assert.equal((await db.collection('m0_public').get()).size,publicRows);
 assert.ok(f.state.requests.every(r=>r.url.startsWith('https://recentjobs.co.za/')));
});
test('numbered-section attachment coverage gates validation and accepts a complete practical instruction',async()=>{
 const attachment='Attach your qualifications and relevant academic records.';
 for(const retain of [false,true]){
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});
  f.state.html=detailHtml.replace('<p>Applicants require Grade 12 with Mathematics OR N3 Electrical.</p>','<p>2. Minimum requirements</p><p>Grade 12</p><p>'+attachment+'</p><p>3. Duties and responsibilities</p><p>Maintain tools.</p>');
  f.worker.extractor=async()=>{
   f.state.modelCalls++;const extraction=syntheticExtraction();
   extraction.requirements={items:[{id:'q1',kind:'education',level:'required',fact:{state:'stated',quote:'Grade 12',value:{description:'Grade 12',qualification:null,document:null}}}],expression:{op:'ref',id:'q1'}};
   if(retain)extraction.practicalConditions={state:'stated',value:attachment,quote:attachment};
   return {extraction,provenance:{usage:{totalTokens:20}}};
  };
  f.worker.validator=async()=>{f.state.validations++;return {supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Grade 12'}],provenance:{usage:{totalTokens:20}}};};
  const result=await f.worker.run(f.sourceId);assert.equal(f.state.modelCalls,1);
  if(!retain){
   assert.ok(result.results.some(r=>r.reason==='AI_SUBMISSION_INSTRUCTION_COVERAGE'));assert.equal(f.state.validations,0);
   const exception=(await db.collection('m0_worker_exceptions').get()).docs.map(value).find(e=>e.sourceId===f.sourceId);
   assert.equal((await f.worker.ref('worker_candidates',exception.jobId).get()).exists,false);
  }else{
   const record=detailResult(result);assert.equal(record.published,false);assert.equal(f.state.validations,1);
   const draft=value(await f.worker.ref('drafts',record.recordId).get());assert.equal(draft.practicalConditions.value,attachment);
   assert.equal(draft.applicationRoute.value.destination,'https://employer.example/apply');assert.equal((await f.worker.ref('public',record.recordId).get()).exists,false);
  }
  assert.ok(f.state.requests.every(request=>request.url.startsWith('https://recentjobs.co.za/')));
 }
});

test('practical evidence, preparation scope and standalone subject kind gate storage and validation',async()=>{
 const attachment='Attach your qualifications and relevant academic records.',threshold='Mathematics must have been passed with at least 50%.';
 for(const scenario of ['expanded_value','publisher_preparation','wrong_subject_kind','complete']){
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false});
  f.state.html=detailHtml.replace('<p>Applicants require Grade 12 with Mathematics OR N3 Electrical.</p>',
   '<p>2. Minimum requirements</p><p>Grade 12</p><p>'+threshold+'</p><p>'+attachment+'</p><p>3. Duties and responsibilities</p><p>Maintain tools.</p><p>4. Documents to prepare</p><p>Use this checklist before applying.</p><p>Updated CV</p><p>5. Why you should apply</p><p>Publisher advice.</p>');
  f.worker.extractor=async()=>{
   f.state.modelCalls++;const extraction=syntheticExtraction(),item=(id,quote,kind)=>({id,kind,level:'required',fact:{state:'stated',quote,value:{description:quote,qualification:null,document:null}}});
   extraction.requirements={items:[item('q','Grade 12','education'),item('s',threshold,scenario==='wrong_subject_kind'?'education':'subjects')],expression:{op:'all',children:[{op:'ref',id:'q'},{op:'ref',id:'s'}]}};
   extraction.practicalConditions={state:'stated',value:attachment,quote:attachment};
   if(scenario==='expanded_value')extraction.practicalConditions.value+=' Updated CV';
   if(scenario==='publisher_preparation'){
    extraction.practicalConditions={state:'stated',value:'Updated CV',quote:'Updated CV'};
    extraction.requirements.items.push(item('d',attachment,'document'));extraction.requirements.expression.children.push({op:'ref',id:'d'});
   }
   return {extraction,provenance:{usage:{totalTokens:20}}};
  };
  f.worker.validator=async()=>{f.state.validations++;return {supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Grade 12'}],provenance:{usage:{totalTokens:20}}};};
  const drafts=(await db.collection('m0_drafts').get()).size,publicRows=(await db.collection('m0_public').get()).size;
  const result=await f.worker.run(f.sourceId);assert.equal(f.state.modelCalls,1);
  if(scenario==='complete'){
   const record=detailResult(result);assert.ok(record,JSON.stringify(result.results));
   const draft=value(await f.worker.ref('drafts',record.recordId).get());assert.equal(f.state.validations,1);
   assert.equal(draft.practicalConditions.value,attachment);assert.equal(draft.practicalConditions.originalText,attachment);
   assert.equal(draft.applicationRoute.value.destination,'https://employer.example/apply');assert.equal(draft.publication.approved,false);
  }else{
   const expected={expanded_value:'AI_PRACTICAL_EVIDENCE_UNRESOLVED',publisher_preparation:'AI_PUBLISHER_PREPARATION_UNRESOLVED',wrong_subject_kind:'AI_REQUIREMENT_KIND_UNRESOLVED'}[scenario];
   assert.ok(result.results.some(row=>row.reason===expected));assert.equal(f.state.validations,0);
   const exception=(await db.collection('m0_worker_exceptions').get()).docs.map(value).find(row=>row.sourceId===f.sourceId);
   assert.equal((await f.worker.ref('worker_candidates',exception.jobId).get()).exists,false);assert.equal((await db.collection('m0_drafts').get()).size,drafts);
  }
  assert.equal((await db.collection('m0_public').get()).size,publicRows);assert.ok(f.state.requests.every(row=>row.url.startsWith('https://recentjobs.co.za/')));
 }
});
