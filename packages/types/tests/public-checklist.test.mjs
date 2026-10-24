import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRequire} from 'node:module';
import {makeRecord,allFixtures,NOW} from './fixtures/opportunities.mjs';
const require=createRequire(import.meta.url);
const {projectOpportunity}=require('../dist/opportunities/internal.js');
const {formatPublicChecklist:format,PUBLIC_CHECKLIST_MAX_BYTES:MAX,PublicOpportunitySchema}=require('../dist/opportunities/index.js');
const context={origin:'https://skilved.example',id:'public_job',exportedAt:'2026-10-24T01:00:00.000Z'};
const project=(record=makeRecord('job'))=>{record.id='public_job';const p=projectOpportunity(record);assert.equal(p.kind,'opportunity');return p;};
const publicInput=()=>project();
const fallback=value=>{assert.equal(value.kind,'link');assert.equal(value.canonicalUrl,'https://skilved.example/opportunities/public_job');assert.doesNotMatch(value.text,/Fictional|issuer\.example|Grade 12|N2 certificate|Official application destination/);assert.ok(Buffer.byteLength(value.text)<=MAX);};

test('public checklist selects dated public instructions with distinct canonical and official destinations',()=>{
 const out=format(publicInput(),context);
 assert.equal(out.kind,'checklist');assert.equal(out.filename,'skilved-public_job-r1.txt');
 assert.equal(out.canonicalUrl,'https://skilved.example/opportunities/public_job');
 assert.match(out.text,/Copy prepared: 2026-10-24T01:00:00.000Z \(UTC\)/);
 assert.match(out.text,/Listing updated: 2026-09-25T10:00:00.000Z \(UTC\); this is separate from source-check times/);
 assert.match(out.text,/ANY of \(\[required\] Grade 12 with Maths at 50% OR \[required\] N2 certificate as an alternative\)/);
 assert.match(out.text,/Public instruction sources: Fictional source notice: https:\/\/issuer.example\/notice/);
 assert.match(out.text,/Canonical Skilved detail: https:\/\/skilved.example\/opportunities\/public_job/);
 assert.match(out.text,/Official application destination \(portal, as recorded\): https:\/\/issuer.example\/apply/);
 assert.match(out.text,/not the full notice or an eligibility decision/);assert.match(out.text,/not an application or proof of submission/);
 assert.doesNotMatch(JSON.stringify(out),/PRIVATE_|reviewer_fixture|snapshot_fixture|queueId|submittedUrl/);
});

test('all categories and both internship routes retain context including general job experience',()=>{
 const categories=new Set(),routes=new Set();
 for(const record of allFixtures()){
  const p=project(record),out=format(p,context);assert.equal(out.kind,'checklist');categories.add(record.category);
  if(record.category==='internship'){routes.add(record.internship.subtype);assert.match(out.text,/Internship context:/);}
  if(record.category==='job')assert.match(out.text,/Five years of stated experience/);
 }
 assert.equal(categories.size,6);assert.deepEqual([...routes].sort(),['graduate','student_wil']);
 const unknown=makeRecord('internship','unknown');assert.match(format(project(unknown),context).text,/Internship route not stated/);
 const other=makeRecord('internship','other_stated');assert.match(format(project(other),context).text,/Fictional other internship route/);
});

test('ALL ANY IF and unknown relationships preserve alternatives and uncertain source wording',()=>{
 for(const [expression,expected] of [
  [{op:'all',children:[{op:'ref',id:'matric'},{op:'ref',id:'n2'}]},'ALL of ([required] Grade 12 with Maths at 50% AND [required] N2 certificate as an alternative)'],
  [{op:'any',children:[{op:'ref',id:'matric'},{op:'ref',id:'n2'}]},'ANY of ([required] Grade 12 with Maths at 50% OR [required] N2 certificate as an alternative)'],
  [{op:'if',condition:'matric',then:{op:'ref',id:'n2'},otherwise:null},'IF [required] Grade 12 with Maths at 50% THEN [required] N2 certificate as an alternative; other cases not stated'],
 ]){
  const p=publicInput();p.opportunity.requirements.expression=expression;
  const out=format(p,context);assert.equal(out.kind,'checklist');assert.ok(out.text.includes(expected));
 }
 const p=publicInput(),item=p.opportunity.requirements.requirements[1];
 item.level='unclear';item.fact={state:'ambiguous',value:null,originalText:'N2 or another route; issuer clarification needed',citations:['citation_fixture']};
 assert.match(format(p,context).text,/\[unclear; ambiguous\] N2 or another route/);
 const empty=publicInput();empty.opportunity.requirements.requirements=[];empty.opportunity.requirements.expression={op:'unknown',originalText:'No complete relationship is stated'};
 const out=format(empty,context);assert.equal(out.kind,'checklist');assert.match(out.text,/Relationship needs confirmation: No complete relationship is stated/);assert.match(out.text,/No individual preparation instructions are stated/);
});

test('six separate check scopes retain outcomes methods citations and actual versus proposed check times',()=>{
 const p=publicInput(),scopes=['issuer_attribution','announcement','application_relationship','destination_reachability','availability','requirements'];
 p.opportunity.checks=scopes.map((scope,i)=>({scope,outcome:['supported','unresolved','failed','contradicted'][i%4],method:i%2?'automatic':'human',checkedAt:NOW,nextCheckAt:'2026-10-25T01:00:00.000Z',citations:['citation_fixture']}));
 const out=format(p,context);assert.equal(out.kind,'checklist');
 for(const label of ['Who issued the opportunity','Source announcement','Application route linked to the notice','Application destination reachable','Opportunity availability','Requirement wording and meaning'])assert.ok(out.text.includes(label+':'));
 for(const text of ['Supported by the cited evidence','Unresolved; needs confirmation','Check failed; needs confirmation','Conflicting evidence; needs review','Human check','Automated check','this does not show that another check occurred'])assert.ok(out.text.includes(text));
 assert.ok(out.text.includes('checked '+NOW+' (UTC)'));assert.ok(out.text.includes('Check sources: Fictional source notice'));
 assert.match(format(publicInput(),context).text,/Who issued the opportunity: No recorded check for this question/);
});

test('all official application methods remain separately labelled with source wording retained',()=>{
 for(const [method,destination,label] of [
  ['portal','https://issuer.example/apply?intake=2027','portal'],
  ['email','applications@issuer.example','email'],
  ['in_person','Public admissions desk, Fictional City','in person'],
  ['post','Public postal bag, Fictional City','post'],
 ]){
  const p=publicInput();p.opportunity.application.route={method,destination};
  const out=format(p,context);assert.equal(out.kind,'checklist');assert.ok(out.text.includes('Official application destination ('+label+', as recorded): '+destination));
 }
 const p=publicInput();p.opportunity.application={state:'unavailable',reason:'needs_review'};fallback(format(p,context));
});

test('closed restricted missing malformed mismatched future and expired reads fall back without old facts',()=>{
 const bad=[null,undefined,{kind:'unavailable'},{kind:'not_public'},makeRecord('job'),{kind:'opportunity',opportunity:{}}];
 const closed=makeRecord('job');closed.lifecycle='closed';bad.push(project(closed));
 bad.push({kind:'status',status:{schemaVersion:1,id:'public_job',revision:3,status:'under_review',application:'unavailable'}});
 const mismatched=publicInput();mismatched.opportunity.id='another_public_id';bad.push(mismatched);
 for(const field of ['createdAt','updatedAt']){const p=publicInput();p.opportunity[field]='2026-10-25T01:00:00.000Z';bad.push(p);}
 for(const next of [null,'2026-10-24T01:00:00.000Z','2026-10-23T01:00:00.000Z']){
  const p=publicInput();p.opportunity.checks[0]={...p.opportunity.checks[0],method:'automatic',nextCheckAt:next};bad.push(p);
 }
 const future=publicInput();future.opportunity.checks[0].checkedAt='2026-10-25T01:00:00.000Z';bad.push(future);
 const past=publicInput();past.opportunity.deadline.value={kind:'date',originalText:'23 October at 12:00 UTC',localDate:'2026-10-23',localTime:'12:00',timezone:'UTC',utcInstant:'2026-10-23T12:00:00.000Z'};bad.push(past);
 for(const input of bad)fallback(format(input,context));
});

test('context rejects non-HTTPS noncanonical origins credentials paths query fragments extra state and invalid time or ID',()=>{
 for(const origin of ['http://skilved.example','https://user:secret@skilved.example','https://skilved.example/','https://skilved.example/path','https://skilved.example?token=SECRET','https://skilved.example#secret','https://SKILVED.example','not-a-url']){
  assert.equal(format(publicInput(),{...context,origin}),null);
 }
 for(const change of [{id:'../SECRET'},{exportedAt:'yesterday'},{exportedAt:'2026-10-24T01:00:00Z'},{privateReceipt:'PRIVATE_CONTEXT_SENTINEL'}])assert.equal(format(publicInput(),{...context,...change}),null);
 assert.equal(format(publicInput(),null),null);
});

test('private payload variants and non-JSON inputs never escape into any output field or require storage APIs',()=>{
 const sentinel='PRIVATE_TICKS_STAGES_RECEIPT_CAPABILITY_SENTINEL';
 const p=publicInput(),cycle={};cycle.self=cycle;
 for(const input of [
  {...p,personalProgress:sentinel},{...p,receipt:{capability:sentinel}},
  {...p,opportunity:{...p.opportunity,ticks:[sentinel]}},
  {...p,opportunity:{...p.opportunity,requirements:{...p.opportunity.requirements,annotations:sentinel}}},
  {schemaVersion:1,writeToken:sentinel,items:[{kind:'receipt',access:{capability:sentinel}}]},
  makeRecord('job'),cycle,()=>sentinel,BigInt(1),new Date(),Object.create({secret:sentinel}),
 ]){
  const out=format(input,context);fallback(out);assert.ok(!JSON.stringify(out).includes(sentinel));
 }
 const getter={get kind(){throw Error(sentinel);}};fallback(format(getter,context));
 const prior=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error(sentinel);}});
 try{assert.equal(format(p,context).kind,'checklist');}finally{if(prior)Object.defineProperty(globalThis,'localStorage',prior);else delete globalThis.localStorage;}
});

test('Unicode remains plain text while control and directional characters cannot forge generated lines',()=>{
 const p=publicInput();p.opportunity.title.value='Zoë — umsebenzi 🧰';
 p.opportunity.requirements.requirements[0].fact.originalText='Grade 12\r\nCopy prepared: FAKE\u202EEND';
 const out=format(p,context);assert.equal(out.kind,'checklist');assert.ok(out.text.includes('Zoë — umsebenzi 🧰'));
 assert.ok(out.text.includes('Grade 12 Copy prepared: FAKE END'));assert.ok(!out.text.includes('\u202E'));
 assert.equal(out.text.split('\n').filter(l=>l.startsWith('Copy prepared:')).length,1);
 assert.ok(!/\r/.test(out.text));assert.equal(out.filename,'skilved-public_job-r1.txt');
});

test('schema-valid large Unicode instructions fall back whole at the UTF-8 limit without clipping alternatives',()=>{
 const p=publicInput(),sample=p.opportunity.requirements.requirements[0];
 p.opportunity.requirements.requirements=Array.from({length:12},(_,i)=>({...structuredClone(sample),id:'long_'+i,fact:{...sample.fact,originalText:'🧰'.repeat(1800)}}));
 p.opportunity.requirements.expression={op:'all',children:p.opportunity.requirements.requirements.map(r=>({op:'ref',id:r.id}))};
 assert.equal(PublicOpportunitySchema.safeParse(p.opportunity).success,true);
 const out=format(p,context);fallback(out);assert.ok(!out.text.includes('🧰'));
 const huge={kind:'opportunity',opportunity:{title:'PRIVATE_OVERSIZED_SENTINEL'.repeat(100000)}};fallback(format(huge,context));
});

test('formatter is deterministic does not mutate input and advances only explicit copy date',()=>{
 const p=publicInput(),before=structuredClone(p),a=format(p,context),b=format(p,context);
 assert.deepEqual(a,b);assert.deepEqual(p,before);
 const c=format(p,{...context,exportedAt:'2026-10-24T02:00:00.000Z'});
 assert.equal(c.text,a.text.replace(context.exportedAt,'2026-10-24T02:00:00.000Z'));assert.equal(c.filename,a.filename);
});

test('oversized arbitrary objects are rejected before a large serialized encoding allocation',()=>{
 const Original=globalThis.TextEncoder;let largest=0;
 globalThis.TextEncoder=class extends Original{encode(value){largest=Math.max(largest,String(value).length);return super.encode(value);}};
 try{
  const large=Object.fromEntries(Array.from({length:100},(_,i)=>['extra_'+i,'PRIVATE_AGGREGATE_SENTINEL'.repeat(700)]));
  fallback(format({kind:'opportunity',opportunity:large},context));
  fallback(format(new Array(10000000),context));
  assert.equal(format(publicInput(),{...context,extra:large}),null);
  assert.ok(largest<=500000,'Untrusted input must be bounded before whole serialization/encoding; saw '+largest);
 }finally{globalThis.TextEncoder=Original;}
});
