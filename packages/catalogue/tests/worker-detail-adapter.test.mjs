import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseRecentJobsDetail} from '../src/adapters/recentjobs.mjs';
import {parseWorkerDetail,sourceHoldAdapterFields,sourceHoldAdapterMatches,APPLICATION_LAYOUTS_PROFILE} from '../src/worker-detail-adapter.mjs';
const legacy={permission:{method:'recentjobs_html'},automation:{mode:'shadow',employerCrawl:false}};
const opted={...legacy,automation:{...legacy.automation,applicationLayouts:'shadow_v1'}};
const url='https://recentjobs.co.za/2026/11/04/authored-profile/';
const input=body=>({url,observedOn:'2026-11-04',html:`<article class="type-post"><h1 class="entry-title">Authored apprenticeship</h1><div class="entry-content"><p>Authored requirements</p>${body}</div></article>`});
const email='<h2>How to apply</h2><p>APPLICATION EMAIL</p><p>apply@authored.example</p><p>Email subject:</p><p>Authored intake 2027</p>';

test('absent opt-in preserves exact legacy candidates and hold serialization in shadow and automatic modes',()=>{
  for(const mode of ['shadow','automatic']) {
    const source={...legacy,automation:{...legacy.automation,mode}},request=input(email),parsed=parseWorkerDetail(source,request);
    assert.deepEqual(parsed,parseRecentJobsDetail(request));assert.deepEqual(sourceHoldAdapterFields(source),{});
    assert.equal(sourceHoldAdapterMatches(source,{version:4}),true);
  }
});
test('explicit source opt-in selects the pending route parser without requiring employer crawling',()=>{
  const request=input(email),before=structuredClone(opted),parsed=parseWorkerDetail(opted,request);
  assert.equal(parsed.applicationCandidates.length,1);assert.equal(parsed.applicationCandidates[0].check,'pending');
  assert.equal(parsed.review,'pending');assert.deepEqual(opted,before);
  assert.deepEqual(sourceHoldAdapterFields(opted),{detailAdapterProfile:APPLICATION_LAYOUTS_PROFILE});
});
test('automatic, disabled, malformed and wrong-method opt-ins reject before parsing',()=>{
  for(const setting of [null,false,true,'true','shadow_v2','automatic']) {
    const source={...opted,automation:{...opted.automation,applicationLayouts:setting}};
    assert.throws(()=>parseWorkerDetail(source,input(email)),{code:'SOURCE_POLICY_REQUIRED'});
    assert.throws(()=>sourceHoldAdapterFields(source),{code:'SOURCE_POLICY_REQUIRED'});
  }
  for(const mode of ['automatic','disabled'])assert.throws(()=>parseWorkerDetail({...opted,automation:{...opted.automation,mode}},input(email)),{code:'SOURCE_POLICY_REQUIRED'});
  assert.throws(()=>parseWorkerDetail({...opted,permission:{method:'structured_json'}},input(email)),{code:'SOURCE_POLICY_REQUIRED'});
});
test('hold profile changes release incompatible holds without changing or deleting them',()=>{
  const old={version:4,reason:'NOTICE_PRECISION_UNSUPPORTED'},next={...old,...sourceHoldAdapterFields(opted)},before=structuredClone([old,next]);
  assert.equal(sourceHoldAdapterMatches(legacy,old),true);assert.equal(sourceHoldAdapterMatches(opted,old),false);
  assert.equal(sourceHoldAdapterMatches(opted,next),true);assert.equal(sourceHoldAdapterMatches(legacy,next),false);
  assert.deepEqual([old,next],before);
});
test('unknown or malformed saved profiles do not suppress a fresh detail check',()=>{
  for(const profile of [null,undefined,false,'legacy','application_layouts_shadow_v2',{}]) {
    assert.equal(sourceHoldAdapterMatches(legacy,{detailAdapterProfile:profile}),false);
    assert.equal(sourceHoldAdapterMatches(opted,{detailAdapterProfile:profile}),false);
  }
  assert.equal(sourceHoldAdapterMatches(legacy,null),false);assert.equal(sourceHoldAdapterMatches(opted,null),false);
});
