import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertLocationEvidence} from '../src/ai/location-evidence.mjs';
const fact=(quote,patch={})=>({state:'stated',quote,value:{places:[{country:null,province:null,city:'Polokwane'}],coverage:'not_stated',attendance:'not_stated',relocation:null,...patch}});

test('a city alone cannot establish province, country, coverage or attendance',()=>{
 const quote='Location: Polokwane';assert.doesNotThrow(()=>assertLocationEvidence(fact(quote)));
 for(const patch of [{places:[{city:'Polokwane',province:'limpopo',country:null}]},{places:[{city:'Polokwane',province:null,country:'ZA'}]},{attendance:'in_person'},{coverage:'local'},{relocation:'Polokwane'}])assert.throws(()=>assertLocationEvidence(fact(quote,patch)),/AI_LOCATION_EVIDENCE_UNRESOLVED/);
});

test('explicit place evidence allows punctuation-normalised provinces without geographic inference',()=>{
 const places=[{city:'Hammarsdale',province:'kwazulu_natal',country:'ZA'}];
 assert.doesNotThrow(()=>assertLocationEvidence(fact('Location: Hammarsdale, KwaZulu-Natal, South Africa',{places})));
 assert.throws(()=>assertLocationEvidence(fact('Location: Hammarsdale, KwaZulu-Natal, South Africa',{places:[{...places[0],city:'Durban'}]})),/AI_LOCATION_EVIDENCE_UNRESOLVED/);
 assert.throws(()=>assertLocationEvidence(fact('Location: Greater Polokwaneville')),/AI_LOCATION_EVIDENCE_UNRESOLVED/);
});

test('attendance and coverage need one explicit supported label value',()=>{
 for(const [word,mode] of [['in person','in_person'],['on-site','in_person'],['remote','remote'],['hybrid','hybrid']])assert.doesNotThrow(()=>assertLocationEvidence(fact(`Location: Polokwane\nWork arrangement: ${word}.`,{attendance:mode})));
 for(const [word,scope] of [['local','local'],['nationwide','national'],['national','national'],['international','international']])assert.doesNotThrow(()=>assertLocationEvidence(fact(`Location: Polokwane\nRecruitment coverage: ${word}`,{coverage:scope})));
});

test('negations, alternatives, duties, residency and conflicting labels do not prove arrangements',()=>{
 for(const quote of ['Location: Polokwane\nWork mode: not remote','Location: Polokwane\nWork mode: remote or hybrid','Location: Polokwane\nRepair remote controls.','Location: Polokwane\nWork mode: remote\nAttendance: hybrid','Location: Polokwane\nWork mode: remote\nAttendance: not remote'])assert.throws(()=>assertLocationEvidence(fact(quote,{attendance:'remote'})),/AI_LOCATION_EVIDENCE_UNRESOLVED/);
 for(const quote of ['Location: Polokwane\nLocal applicants only.','Location: Polokwane\nCoverage: national or international','Location: Polokwane\nCoverage: local\nCoverage: national','Location: Polokwane\nCoverage: local\nRecruitment scope: not local'])assert.throws(()=>assertLocationEvidence(fact(quote,{coverage:'local'})),/AI_LOCATION_EVIDENCE_UNRESOLVED/);
});

test('relocation is preserved as an exact complete source line without inventing a policy',()=>{
 const quote='Location: Polokwane\nRelocation assistance is not provided.';
 assert.doesNotThrow(()=>assertLocationEvidence(fact(quote,{relocation:'Relocation assistance is not provided.'})));
 for(const relocation of ['Relocation assistance is provided.','Relocation assistance','Location: Polokwane'])assert.throws(()=>assertLocationEvidence(fact(quote,{relocation})),/AI_LOCATION_EVIDENCE_UNRESOLVED/);
 assert.doesNotThrow(()=>assertLocationEvidence({state:'ambiguous',value:null,quote:'Location unclear'}));
});

test('explicit all-province location labels support coverage without inventing a country',()=>{
 for(const quote of ['Locations: All provinces','Locations\nAll provinces'])assert.doesNotThrow(()=>assertLocationEvidence(fact(quote,{places:[],coverage:'national'})));
 assert.throws(()=>assertLocationEvidence(fact('Applicants from all provinces may ask for information.',{places:[],coverage:'national'})),/AI_LOCATION_EVIDENCE_UNRESOLVED/);
 assert.throws(()=>assertLocationEvidence(fact('Locations\nAll provinces',{places:[{city:null,province:null,country:'ZA'}],coverage:'national'})),/AI_LOCATION_EVIDENCE_UNRESOLVED/);
});
