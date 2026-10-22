import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Source} from '../src/schemas.mjs';
import {preflightCandidate, draftGate, publicationGate} from '../src/worker-policy.mjs';
import {makeRecord} from '../../types/tests/fixtures/opportunities.mjs';

const now='2026-10-22T14:00:00.000Z', retrieved='2026-10-22T13:00:00.000Z';
function fixture() {
  const record=makeRecord(); record.deadline={...record.deadline,state:'not_stated',value:null,originalText:null};
  const source={id:'undated_fixture',revision:1,name:'Authored example',urls:['https://recentjobs.co.za/category/apprenticeships/'],
    permission:{reference:'Synthetic',method:'recentjobs_html',reuse:'Synthetic',reviewedAt:now},
    categories:['apprenticeship'],owner:'fixture',paused:false,cadenceHours:24,maxBytes:500000,
    automation:{mode:'shadow',undatedNotices:'shadow_recent',employerCrawl:false,qualificationRef:'Synthetic',maxArticles:1,
      maxModelCallsPerDay:10,minRequestIntervalMs:2000,checkTtlHours:24,
      issuers:[{name:record.issuer.value,host:'issuer.example',pathPrefix:'/apply',evidence:'Synthetic only'}]}};
  const candidate={title:'Fictional apprenticeship',sourceText:'Fictional apprentice requires Grade 12.',issues:[],
    sourcePublishedAtRaw:'2026-10-22T08:00:00+00:00',deadlineCandidates:[],applicationCandidates:[record.applicationRoute.value]};
  const assessment={supported:true,issues:[]};
  return {source,candidate,record,assessment,gate:(at=now,acquired=retrieved,primary=null)=>draftGate(source,candidate,record,primary,assessment,at,acquired)};
}

test('undated assessment is explicit, defaults off, and is invalid for automatic or disabled sources',()=>{
  const {source,candidate}=fixture();delete source.automation.undatedNotices;
  assert.equal(Source.parse(source).automation.undatedNotices,'reject');
  assert.throws(()=>preflightCandidate(source,candidate,now,retrieved),/NOTICE_PRECISION_UNSUPPORTED/);
  source.automation.undatedNotices='shadow_recent';assert.ok(Source.safeParse(source).success);
  for(const mode of ['automatic','disabled']) {source.automation.mode=mode;assert.equal(Source.safeParse(source).success,false);assert.throws(()=>preflightCandidate(source,candidate,now,retrieved),/NOTICE_PRECISION_UNSUPPORTED/);}
});

test('a recent undated source permits only private assessment and preserves unknown availability',()=>{
  const f=fixture(),before=structuredClone(f.record),window=f.gate();
  assert.equal(preflightCandidate(f.source,f.candidate,now,retrieved).destination,'https://issuer.example/apply');
  assert.deepEqual(window,{deadlinePolicy:'undated_shadow_v1',sourcePublishedAt:'2026-10-22T08:00:00.000Z',sourceRetrievedAt:retrieved,
    reviewExpiresAt:'2026-10-23T13:00:00.000Z',nextCheckAt:'2026-10-23T13:00:00.000Z',availability:'unverified'});
  assert.deepEqual(f.record,before);
  assert.throws(()=>publicationGate(f.source,f.candidate,f.record,null,f.assessment,now),/NOTICE_PRECISION_UNSUPPORTED/);
});

test('undated policy never reinterprets missing precision, explicit unknowns, rolling or conflicting deadlines',()=>{
  for(const wording of ['Closing date: not stated','Closing date: 31/2/2026','Application deadline: TBC','Apply by next Friday','Applications close tomorrow','Open until filled','Applications accepted on a rolling basis']) {
    const f=fixture();f.candidate.sourceText+='\n'+wording;assert.throws(()=>f.gate(),/NOTICE_PRECISION_UNSUPPORTED/,wording);
  }
  for(const dates of [[null],['2026-02-30'],['2026-10-30',null],['2026-10-30','2026-10-31']]) {
    const f=fixture();f.candidate.deadlineCandidates=dates.map(localDate=>({localDate}));assert.throws(()=>preflightCandidate(f.source,f.candidate,now,retrieved),/NOTICE_PRECISION_UNSUPPORTED/);
  }
});

test('missing, malformed, future and stale source timestamps fail before assessment',()=>{
  for(const published of [null,'22 October 2026','2026-02-30T08:00:00Z','2026-10-22T25:00:00Z','2026-10-22T13:00:00.001Z','2026-10-15T14:00:00Z']) {
    const f=fixture();f.candidate.sourcePublishedAtRaw=published;assert.throws(()=>f.gate(),/UNDATED_NOTICE_FRESHNESS_REQUIRED/,String(published));
  }
  for(const acquired of [undefined,'2026-10-22','2026-10-22T14:00:00.001Z','2026-10-21T14:00:00.000Z']) {
    const f=fixture();assert.throws(()=>draftGate(f.source,f.candidate,f.record,null,f.assessment,now,acquired),/UNDATED_NOTICE_FRESHNESS_REQUIRED/,String(acquired));
  }
});

test('private validity ends exactly at the earlier retrieval TTL or seven-day publication age',()=>{
  const f=fixture();f.source.automation.checkTtlHours=1;
  assert.equal(f.gate('2026-10-22T13:59:59.999Z').reviewExpiresAt,now);
  assert.throws(()=>f.gate(),/UNDATED_NOTICE_FRESHNESS_REQUIRED/);
  f.source.automation.checkTtlHours=24;f.candidate.sourcePublishedAtRaw='2026-10-15T14:00:00.001Z';
  assert.equal(f.gate().reviewExpiresAt,'2026-10-22T14:00:00.001Z');
  assert.throws(()=>f.gate('2026-10-22T14:00:00.001Z'),/UNDATED_NOTICE_FRESHNESS_REQUIRED/);
});

test('explicit closure, physical methods, multiple routes and unresolved programme subjects remain blocked',()=>{
  for(const wording of ['Applications are closed','Position has been filled','No longer accepting applications']) {
    const f=fixture();f.candidate.sourceText+='\n'+wording;assert.throws(()=>f.gate(),/NOTICE_NOT_OPEN/);
  }
  const f=fixture();f.candidate.applicationCandidates.push({...f.candidate.applicationCandidates[0]});assert.throws(()=>f.gate(),/NOTICE_PRECISION_UNSUPPORTED/);
  f.candidate.applicationCandidates.pop();f.candidate.applicationInstructions=['Hand delivery'];assert.throws(()=>f.gate(),/NOTICE_APPLICATION_METHOD_REVIEW_REQUIRED/);
  f.candidate.applicationInstructions=[];f.candidate.issues=['programme_subject_scope_review_required'];assert.throws(()=>f.gate(),/NOTICE_PROGRAMME_SCOPE_REVIEW_REQUIRED/);
});

test('invented deadline facts, changed methods, unresolved requirements and semantic rejection cannot pass',()=>{
  for(const mutate of [f=>{f.record.deadline=makeRecord().deadline;},f=>{f.record.deadline.state='ambiguous';},
    f=>{f.record.applicationRoute.value={method:'portal',destination:'https://issuer.example/apply/other'};},
    f=>{f.record.requirements.expression={op:'unknown'};},f=>{f.assessment.supported=false;}]) {
    const f=fixture();mutate(f);assert.throws(()=>f.gate());
  }
});

test('employer crawling stays optional and cannot silently discard a primary closing date or wrong issuer',()=>{
  const f=fixture();assert.equal(f.gate().availability,'unverified');f.source.automation.employerCrawl=true;
  assert.throws(()=>f.gate(),/PRIMARY_NOTICE_REQUIRED/);
  assert.throws(()=>f.gate(now,retrieved,{issuer:'Other employer'}),/PRIMARY_ISSUER_MISMATCH/);
  const primary={issuer:f.record.issuer.value,validThrough:'2026-10-30'};
  assert.throws(()=>f.gate(now,retrieved,primary),/PRIMARY_DEADLINE_UNRESOLVED/);
  primary.validThrough=null;assert.equal(f.gate(now,retrieved,primary).availability,'unverified');
});

test('dated notices retain the original gate even when the undated option is enabled',()=>{
  const f=fixture();f.record.deadline=makeRecord().deadline;f.candidate.deadlineCandidates=[{localDate:'2026-10-30'}];
  assert.deepEqual(f.gate(),publicationGate(f.source,f.candidate,f.record,null,f.assessment,now));
  assert.equal('deadlinePolicy' in f.gate(),false);
  f.candidate.deadlineCandidates=[{localDate:'2026-10-22'}];
  assert.throws(()=>preflightCandidate(f.source,f.candidate,now,retrieved),/NOTICE_NOT_OPEN/);
});
