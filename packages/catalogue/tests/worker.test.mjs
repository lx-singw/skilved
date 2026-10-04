import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
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
import {programmeWire} from './fixtures/programme-model.mjs';
import {parseRecentJobsDetail} from '../src/adapters/recentjobs.mjs';

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

test('Gemini shadow extraction and validation reserve every fallback call, preserve routes and cache without publishing',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false,calls:4}), requests=[];
  const options=geminiOptions(async(url,init)=>{
    const body=JSON.parse(init.body),input=JSON.parse(body.contents[0].parts[0].text),validation=!!input.extracted;
    requests.push({model:url.split('/models/')[1].split(':')[0],validation,thinking:body.generationConfig.thinkingConfig.thinkingLevel});
    assert.equal(body.generationConfig.maxOutputTokens,3072);assert.equal(body.generationConfig.responseJsonSchema,undefined);
    if(requests.length===1)return new Response(null,{status:503});
    if(requests.length===3)return new Response(null,{status:429,headers:{'Retry-After':'90'}});
    return geminiAnswer(validation?{supported:true,issues:[],evidence:[{source:'recentjobs',quote:'Grade 12 with Mathematics OR N3 Electrical'}]}:compactWire());
  });
  const worker=f.restart(options),result=detailResult(await worker.run(f.sourceId));assert.ok(result);assert.equal(result.published,false);
  assert.deepEqual(requests.map(r=>r.model),['gemini-3.8-flash','gemini-3.7-flash','gemini-3.8-flash','gemini-3.7-flash']);
  assert.deepEqual(requests.map(r=>r.thinking),['LOW','LOW','MEDIUM','MEDIUM']);
  const draft=value(await worker.ref('drafts',result.recordId).get());assert.equal(draft.publication.approved,false);
  assert.equal(draft.applicationRoute.value.destination,'https://employer.example/apply');
  assert.equal((await worker.ref('public',result.recordId).get()).exists,false);assert.equal(f.state.requests.some(r=>r.url.startsWith('https://employer.example')),false);
  const rows=(await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId);
  assert.equal(rows.length,4);assert.deepEqual(rows.map(r=>r.providerStatus).sort(),[null,null,429,503].sort());assert.ok(rows.every(r=>r.provider==='gemini'));
  const budget=(await db.collection('m0_model_budgets').get()).docs.map(value).find(b=>b.sourceId===f.sourceId);
  assert.equal(budget.calls,4);assert.ok(budget.nextCallByModel['gemini-3.8-flash']);assert.equal(budget.nextCallAt,undefined);
  f.advance(24*3600000);assert.equal(detailResult(await f.restart(options).run(f.sourceId)).published,false);assert.equal(requests.length,4);
});

test('Gemini fallback stops at the daily budget before sending the next model',async()=>{
  const f=await fixture({mode:'shadow',publisher:false,employerCrawl:false,calls:1});let sends=0;
  const worker=f.restart(geminiOptions(async()=>{sends++;return new Response(null,{status:503});}));
  assert.ok((await worker.run(f.sourceId)).results.some(r=>r.reason==='MODEL_BUDGET_EXHAUSTED'));assert.equal(sends,1);
  assert.equal((await db.collection('m0_model_calls').get()).docs.map(value).filter(c=>c.sourceId===f.sourceId).length,1);
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
    if(calls.length===1)return new Response(null,{status:503});
    return geminiAnswer(programmeResponse(input,candidate));
  }));
  const first=(await worker.run(f.sourceId)).results.find(r=>r.programmes);
  assert.equal(first.draftCount,2,JSON.stringify(first));assert.equal(first.published,false);assert.equal(calls.length,5);
  assert.equal(calls[0].model,'gemini-3.8-flash');assert.equal(calls[1].model,'gemini-3.7-flash');
  const drafts=await Promise.all(first.programmes.map(r=>worker.ref('drafts',r.recordId).get().then(value)));
  assert.deepEqual(drafts.map(d=>d.intake.value),['Electrical TEST/01','Plumbing TEST/02']);
  assert.deepEqual(drafts.map(d=>d.applicationRoute.value.destination),['electrical@employer.example','plumbing@employer.example']);
  assert.equal(drafts[0].requirements.requirements[0].fact.originalText,'Applicants require Grade 12 with Mathematics OR N3 Electrical.');
  assert.equal(drafts[1].requirements.requirements[0].fact.originalText,'Applicants require N2 Plumbing.');
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
