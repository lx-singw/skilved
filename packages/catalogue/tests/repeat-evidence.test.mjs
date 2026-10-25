import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseRecentJobsDetail} from '../src/adapters/recentjobs.mjs';
import {mapExtraction} from '../src/ai/extraction.mjs';
import {inspectRepeat,REPEAT_EVIDENCE_VERSION} from '../src/ai/repeat-evidence.mjs';
import {qualificationHtml,qualificationExtraction} from './fixtures/qualification-model.mjs';

function example(label='Apply now') {
  const sourceCandidate=parseRecentJobsDetail({html:qualificationHtml.replaceAll('Apply now',label),
    url:'https://recentjobs.co.za/2026/09/26/fictional-apprentice/'});
  const extraction=qualificationExtraction();extraction.practicalConditions={state:'stated',value:label,quote:label};
  const baselineRecord=mapExtraction(sourceCandidate,extraction,{sourceId:'repeat_test',now:'2026-10-25T01:00:00.000Z'}).record;
  const repeatRecord=structuredClone(baselineRecord);
  repeatRecord.practicalConditions={...repeatRecord.practicalConditions,state:'not_stated',value:null,originalText:null,sourceSnapshotIds:[],evidenceRefs:[]};
  const extractionProvenance={provider:'gemini',model:'synthetic-extraction',requestHash:'a'.repeat(64)},
    validationProvenance={provider:'gemini',model:'synthetic-validation',requestHash:'b'.repeat(64)};
  return {baselineRecord,repeatRecord,sourceCandidate,sourceHash:sourceCandidate.contentHash,expectedSourceHash:sourceCandidate.contentHash,
    checklist:{passed:true},assessment:{supported:true,issues:[]},extractionProvenance,validationProvenance,
    receipts:[{...extractionProvenance,id:'new-extraction',stage:'extraction',state:'received'},
      {...validationProvenance,id:'new-validation',stage:'validation',state:'received'}],priorReceiptIds:['old-extraction','old-validation'],
    beforePreservationHashes:{draft:'c'.repeat(64),decision:'d'.repeat(64),caches:'e'.repeat(64)},
    afterPreservationHashes:{draft:'c'.repeat(64),decision:'d'.repeat(64),caches:'e'.repeat(64)}};
}
const materialIssue='MATERIAL_REPRESENTATION_DIFFERENCE_REQUIRES_REVIEW';
const rejected=(input,code=materialIssue)=>{const result=inspectRepeat(input);assert.equal(result.supportedRepeatEvidence,false);assert.ok(result.issues.includes(code),JSON.stringify(result));return result;};

test('source-bound generic portal directions may be duplicated or omitted without mutating either answer',()=>{
  for(const label of ['Apply now','Apply online','Apply now online','Click here to apply']) {
    const input=example(label),before=structuredClone(input),result=inspectRepeat(input);
    assert.equal(result.version,REPEAT_EVIDENCE_VERSION);assert.equal(result.supportedRepeatEvidence,true);
    assert.equal(result.strictMaterialCoreEqual,false);assert.equal(result.materialCoreEqual,true);
    assert.deepEqual(result.allowedRepresentationDifferences,['generic_portal_direction_duplication']);
    assert.equal(result.publication,false);assert.equal(result.qualification,false);assert.equal(result.underlyingModelIndependenceEstablished,false);
    assert.deepEqual(input,before);
    [input.baselineRecord,input.repeatRecord]=[input.repeatRecord,input.baselineRecord];assert.equal(inspectRepeat(input).supportedRepeatEvidence,true);
  }
});

test('identical practical facts remain strict matches without an exception',()=>{
  const input=example();input.repeatRecord=structuredClone(input.baselineRecord);const result=inspectRepeat(input);
  assert.equal(result.supportedRepeatEvidence,true);assert.equal(result.strictMaterialCoreEqual,true);assert.deepEqual(result.allowedRepresentationDifferences,[]);
});

test('submission documents, email subjects and recruitment references cannot disappear as generic directions',()=>{
  for(const text of ['Upload a CV and certified certificates','Email subject: Application intake 2027','Include reference APP-2027',
    'Apply now online and attach your transcript','Submit before 12:00','Apply now.']) {
    const input=example();input.baselineRecord.practicalConditions.value=text;input.baselineRecord.practicalConditions.originalText=text;rejected(input);
  }
});

test('an email application direction is never covered by the portal-only exception',()=>{
  const input=example();input.sourceCandidate.applicationCandidates[0].method='email';input.sourceCandidate.applicationCandidates[0].destination='jobs@employer.example';
  for(const record of [input.baselineRecord,input.repeatRecord])record.applicationRoute.value={method:'email',destination:'jobs@employer.example'};
  rejected(input);
});

test('a changed vacancy path, query, method or instruction still fails even on the same employer host',()=>{
  for(const mutate of [r=>{r.applicationRoute.value.destination+='/other';},r=>{r.applicationRoute.value.destination+='?job=other';},
    r=>{r.applicationRoute.value={method:'email',destination:'jobs@employer.example'};},r=>{r.applicationRoute.originalText='A different instruction';}]) {
    const input=example();mutate(input.repeatRecord);rejected(input);
  }
});

test('one source-owned route and a standalone written direction are required for the exception',()=>{
  for(const mutate of [c=>{c.applicationCandidates=[];},c=>{c.applicationCandidates.push({...c.applicationCandidates[0]});},
    c=>{c.applicationCandidates[0].originalText='Apply online';},c=>{c.sourceText=c.sourceText.replaceAll('Apply now','Unrelated text');},
    c=>{c.applicationInstructions=[{methods:['post'],originalText:'Post applications',check:'pending'}];},
    c=>{c.issues.push('programme_subject_scope_review_required');},c=>{c.programmeScope={includedSpans:[[1,2]]};}]) {
    const input=example();mutate(input.sourceCandidate);rejected(input);
  }
});

test('an unsafe portal URL cannot support the optional direction comparison',()=>{
  for(const destination of ['http://employer.example/apply','https://name@employer.example/apply','https://employer.example:444/apply','https://employer.example/apply#other']) {
    const input=example();input.sourceCandidate.applicationCandidates[0].destination=destination;
    for(const record of [input.baselineRecord,input.repeatRecord])record.applicationRoute.value.destination=destination;
    const result=inspectRepeat(input);assert.equal(result.supportedRepeatEvidence,false);assert.deepEqual(result.allowedRepresentationDifferences,[]);
  }
});

test('practical value and source evidence must both be the exact generic direction',()=>{
  for(const mutate of [p=>{p.value='Apply online';},p=>{p.originalText='Unrelated text';},p=>{p.state='ambiguous';p.value=null;}]) {
    const input=example();mutate(input.baselineRecord.practicalConditions);rejected(input);
  }
});

test('issuer, place, deadline and financial changes remain material beside an optional direction difference',()=>{
  for(const mutate of [r=>{r.issuer.value='Other Workshop';},r=>{r.deadline.value.localDate='2026-11-01';},
    r=>{r.location.state='stated';r.location.value={places:[{country:'ZA',province:'gauteng',city:'Other City'}],coverage:'not_stated',attendance:'not_stated',relocation:null};r.location.originalText='Other City';r.location.sourceSnapshotIds=[...r.title.sourceSnapshotIds];r.location.evidenceRefs=[r.location.id];},
    r=>{r.compensation.push({...r.issuer,id:'repeat_stipend',evidenceRefs:['repeat_stipend'],value:{kind:'stipend',amount:1000,maximum:null,currency:'ZAR',period:'month',coverage:null}});}]) {
    const input=example();mutate(input.repeatRecord);rejected(input);
  }
});

test('missing documents, weakened requirements and changed ALL/ANY logic still fail',()=>{
  for(const mutate of [r=>{r.requirements.requirements[0].level='preferred';},r=>{r.requirements.expression.op='any';},
    r=>{const removed=r.requirements.requirements.pop();r.requirements.expression.children=r.requirements.expression.children.filter(n=>n.id!==removed.id);},
    r=>{r.requirements.requirements[0].fact.value.description='Unrelated condition';}]) {
    const input=example();mutate(input.repeatRecord);rejected(input);
  }
});

test('an added audience stage remains material even when a generic direction is optional',()=>{
  const input=example();input.repeatRecord.entryStage={...input.repeatRecord.issuer,id:'repeat_stage',
    evidenceRefs:['repeat_stage'],value:['graduate']};rejected(input);
});

test('requirement IDs, ALL/ANY ordering, summary wording and object property order do not cause drift',()=>{
  const input=example(),r=input.repeatRecord,ids=new Map(r.requirements.requirements.map((item,i)=>[item.id,'renamed_'+i]));
  for(const item of r.requirements.requirements){item.id=ids.get(item.id);const v=item.fact.value;item.fact.value={document:v.document,qualification:v.qualification,description:v.description};}
  r.requirements.expression.children.reverse();for(const node of r.requirements.expression.children)node.id=ids.get(node.id);
  r.summary.value='Another supported authored summary';assert.equal(inspectRepeat(input).supportedRepeatEvidence,true);
});

test('conditional requirement branches preserve their condition and consequence',()=>{
  const input=example(),r=input.baselineRecord.requirements,ids=r.requirements.map(i=>i.id);
  r.expression={op:'if',condition:ids[0],then:{op:'all',children:ids.slice(1).map(id=>({op:'ref',id}))},otherwise:null};
  input.repeatRecord.requirements=structuredClone(r);assert.equal(inspectRepeat(input).supportedRepeatEvidence,true);
  input.repeatRecord.requirements.expression.condition=ids[1];input.repeatRecord.requirements.expression.then.children[0].id=ids[0];rejected(input);
});

test('cached, missing, failed, duplicate and mismatched request receipts cannot prove freshness',()=>{
  for(const mutate of [x=>{x.receipts.pop();},x=>{x.receipts[0].id='old-extraction';},x=>{x.receipts[1].state='failed';},
    x=>{x.receipts.push({...x.receipts[0]});},x=>{x.receipts[1].id=x.receipts[0].id;},
    x=>{x.receipts[0].requestHash='f'.repeat(64);},x=>{x.receipts[0].provider='other';},x=>{x.receipts[1].model='other';}]) {
    const input=example();mutate(input);const result=inspectRepeat(input);assert.equal(result.supportedRepeatEvidence,false);
    assert.ok(result.issues.some(code=>/REQUEST_REQUIRED|STAGE_RECEIPTS_REQUIRED/.test(code)));
  }
});

test('identical request hashes may be fresh when actual client receipt IDs are new',()=>{
  const input=example();input.receipts.push({...input.receipts[0],id:'old-extraction'});assert.equal(inspectRepeat(input).supportedRepeatEvidence,true);
});

test('changed or unbound source hashes fail independently of the direction exception',()=>{
  for(const mutate of [x=>{x.sourceHash='f'.repeat(64);},x=>{x.expectedSourceHash='f'.repeat(64);},
    x=>{x.sourceCandidate.contentHash='f'.repeat(64);},x=>{delete x.sourceCandidate;},x=>{x.sourceHash='not-a-hash';}]) {
    const input=example();mutate(input);rejected(input,'SOURCE_CHANGED');
  }
});

test('failed checklist or semantic support cannot be rescued by an allowed representation difference',()=>{
  for(const mutate of [x=>{x.checklist.passed=false;},x=>{x.assessment.supported=false;},x=>{x.assessment.issues=['unsupported'];}]) {
    const input=example();mutate(input);const result=inspectRepeat(input);assert.equal(result.supportedRepeatEvidence,false);
    assert.ok(result.issues.includes('FROZEN_CHECKLIST_FAILED')||result.issues.includes('SEMANTIC_ASSESSMENT_FAILED'));
  }
});

test('accepted state changes or missing preservation evidence remain failures',()=>{
  for(const mutate of [x=>{x.afterPreservationHashes.decision='f'.repeat(64);},x=>{x.afterPreservationHashes.caches='f'.repeat(64);},
    x=>{delete x.beforePreservationHashes;},x=>{x.beforePreservationHashes={};x.afterPreservationHashes={};}]) {
    const input=example();mutate(input);rejected(input,'ACCEPTED_STATE_CHANGED');
  }
});

test('invalid records and missing prior receipt inventory do not become successful comparisons',()=>{
  const input=example();delete input.repeatRecord.applicationRoute;rejected(input,'REPEAT_RECORD_INVALID');
  const other=example();delete other.priorReceiptIds;rejected(other,'PRIOR_RECEIPT_INVENTORY_REQUIRED');
});
