import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertLocationSpanBoundary} from '../src/ai/location-span-boundary.mjs';
import {mapExtraction} from '../src/ai/extraction.mjs';
import {completenessCandidate,completenessExtraction} from './fixtures/location-completeness.mjs';

const location='Location:\nExampletown & Sample Mining';
const candidate={title:'Example apprenticeship',sourceText:'Location: Exampletown\nCompany: Example\nCompany description\nReference: 123\nClosing date: 30 December 2026\n'+location};
const fact=quote=>({state:'stated',quote,value:{places:[{city:'Exampletown',province:null,country:null},{city:'Sample Mining',province:null,country:null}],coverage:'not_stated',attendance:'not_stated',relocation:null}});
test('rejects unrelated edge lines when a complete location passage suffices without mutating evidence',()=>{
  for(const quote of [candidate.sourceText,'Closing date: 30 December 2026\n'+location,location+'\nCompany: Example']) {
    const f=fact(quote),before=structuredClone(f);
    assert.throws(()=>assertLocationSpanBoundary(candidate,f),/AI_LOCATION_SPAN_REDUNDANT/);
    assert.deepEqual(f,before);
  }
  assert.doesNotThrow(()=>assertLocationSpanBoundary(candidate,fact(location)));
});
test('retains necessary intervening text and all separately claimed places and explicit modes',()=>{
  const quote='Work city: Exampletown\nCompany: Example\nWork province: Gauteng\nAttendance: on-site';
  const c={title:'Example apprenticeship',sourceText:quote};
  const f=fact(quote);f.value.places=[{city:'Exampletown',province:'Gauteng',country:null}];f.value.attendance='in_person';
  assert.doesNotThrow(()=>assertLocationSpanBoundary(c,f));
});
test('keeps country and relocation evidence even when a later place label repeats the city',()=>{
  const quote='Country: South Africa\nRelocation is required.\nLocation: Exampletown';
  const c={title:'Example apprenticeship',sourceText:quote},f=fact(quote);
  f.value.places=[{city:'Exampletown',province:null,country:'ZA'}];f.value.relocation='Relocation is required.';
  assert.doesNotThrow(()=>assertLocationSpanBoundary(c,f));
});
test('unknown location facts remain unchanged',()=>{
  assert.doesNotThrow(()=>assertLocationSpanBoundary(candidate,{state:'not_stated',value:null,quote:null}));
});
test('normal canonical mapping rejects a redundant location tail before validation',()=>{
  const c={...completenessCandidate,sourceText:completenessCandidate.sourceText+'\nCompany: Example'},f=completenessExtraction();
  f.location.quote+='\nCompany: Example';
  assert.throws(()=>mapExtraction(c,f,{sourceId:'example_source',now:'2026-11-05T12:00:00.000Z'}),/AI_LOCATION_SPAN_REDUNDANT/);
  assert.ok(mapExtraction(completenessCandidate,completenessExtraction(),{sourceId:'example_source',now:'2026-11-05T12:00:00.000Z'}).record);
});
