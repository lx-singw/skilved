import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requirementLayout} from '../src/ai/requirement-layout.mjs';
import {decodeRequirements,requirementsSchema,requirementsInstruction,REQUIREMENTS_V2_INSTRUCTION,extractRequirements} from '../src/ai/requirements.mjs';

const notice=text=>({title:'Fictional apprenticeship',sourceText:text,applicationCandidates:[]});
const alternatives=notice('Minimum requirements\nYou need one of the following:\nGrade 12 with Mathematics and Science\nN3 with:\nElectrical Trade Theory\nMathematics\nEngineering Science\nNCV Level 3 or 4 Electrical\nMain responsibilities\nMaintain equipment');
const condition=(span,group=1,relation='any')=>({span,group,relation,kind:'education',level:'required',state:'stated'});
const wire=()=>({coverage:{L4:condition([4,4]),L5:condition([5,8]),L9:condition([9,9])},additional:[],unresolvedSpan:null});

test('explicit qualification list preserves complete branches and requires one ANY group',()=>{
  assert.deepEqual(requirementLayout(alternatives),{requiredLineNumbers:[4,5,6,7,8,9],alternativeGroups:[{group:1,markerLine:3,spans:[[4,4],[5,8],[9,9]]}]});
  assert.deepEqual(requirementsSchema(alternatives).properties.coverage.required,['L4','L5','L9']);
  const decoded=decodeRequirements(wire(),alternatives);
  assert.deepEqual(decoded.expression,{op:'any',children:[{op:'ref',id:'r_4_4'},{op:'ref',id:'r_5_8'},{op:'ref',id:'r_9_9'}]});
  assert.equal(decoded.items[1].fact.quote,'N3 with:\nElectrical Trade Theory\nMathematics\nEngineering Science');
  const firstMandatory=wire();firstMandatory.coverage.L4.relation='all';
  assert.throws(()=>decodeRequirements(firstMandatory,alternatives),/AI_INVALID_EXTRACTION/);
  const firstDifferent=wire();firstDifferent.coverage.L4.group=2;
  assert.throws(()=>decodeRequirements(firstDifferent,alternatives),/AI_INVALID_EXTRACTION/);
  const incomplete=wire();incomplete.coverage.L5.span=[5,5];
  assert.throws(()=>decodeRequirements(incomplete,alternatives),/AI_ALTERNATIVE_REQUIREMENT_SPAN/);
});

test('reserved alternative groups cannot swallow additional unrelated conditions',()=>{
  const data=wire();data.additional=[{...condition([11,11]),kind:'other'}];
  assert.throws(()=>decodeRequirements(data,alternatives),/AI_RESERVED_REQUIREMENT_GROUP/);
  const nullField=wire();nullField.coverage.L4=null;
  assert.throws(()=>decodeRequirements(nullField,alternatives),/AI_INVALID_EXTRACTION/);
});

test('narrow alternative rule abstains from mixed, conditional, incomplete and unbounded lists',()=>{
  for(const body of [
    'One of the following:\nGrade 12\nN3\nCV is required.',
    'One of the following:\nGrade 12 if you have experience\nN3',
    'One of the following:\nGrade 12\nN3 with:',
    'One of the following:\nGrade 12\nN3 with:\nA drivers licence',
    'Grade 12\nN3',
    'Preferred:\nOne of the following:\nGrade 12\nN3',
    'One of the following:\nGrade 12\nN3 is advantageous',
  ])assert.deepEqual(requirementLayout(notice(`Requirements\n${body}\nHow to apply`)).alternativeGroups,[],body);
  assert.deepEqual(requirementLayout(notice('Requirements\nOne of the following:\nGrade 12\nN3')).requiredLineNumbers,[]);
});

test('decorated and desired-qualification sections get exact coverage with preference markers excluded',()=>{
  const input=notice('🔧 Minimum requirements\nYou should have:\nN3\nAdvantageous:\nHydraulic knowledge\n🛠️ Main training/duties\nMaintain machinery\nDesired Experience & Qualification\nMatric / N2\nMathematics High Grade\nEnglish\nJoin our WhatsApp group\nApply now');
  assert.deepEqual(requirementLayout(input).requiredLineNumbers,[4,6,10,11,12]);
  const data={coverage:{L4:condition([4,4],1,'all'),L6:{...condition([6,6],1,'all'),kind:'experience',level:'preferred'},
    L10:condition([10,10],1,'all'),L11:condition([11,11],1,'all'),L12:condition([12,12],1,'all')},additional:[],unresolvedSpan:null};
  const result=decodeRequirements(data,input);assert.equal(result.items[1].level,'preferred');
  assert.equal(result.items[2].fact.quote,'Matric / N2');
  delete data.coverage.L12;assert.throws(()=>decodeRequirements(data,input),/AI_INVALID_EXTRACTION/);
  const unresolved={coverage:Object.fromEntries([4,6,10,11,12].map(line=>[`L${line}`,{...condition([line,line],1,'all'),state:'ambiguous'}])),additional:[],unresolvedSpan:[4,6]};
  assert.throws(()=>decodeRequirements(unresolved,input),/AI_REQUIREMENT_COVERAGE/);
});

test('separate explicit lists receive separate reserved group numbers',()=>{
  const input=notice('Requirements\nOne of the following:\nGrade 12\nN3\nMain responsibilities\nWork\nMinimum qualifications\nOne of the following:\nN2\nNCV Level 3 Electrical\nHow to apply');
  assert.deepEqual(requirementLayout(input).alternativeGroups.map(g=>g.group),[1,2]);
});

test('notices without bounded sections use group format before the single provider call',async()=>{
  const candidate=notice('Applicants need Grade 12.\nWorkshop experience is advantageous.');
  assert.equal(requirementsInstruction(candidate),REQUIREMENTS_V2_INSTRUCTION);
  assert.deepEqual(Object.keys(requirementsSchema(candidate).properties),['groups','unresolvedSpan']);
  let calls=0;
  const result=await extractRequirements(candidate,{env:{SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_requirements_test_key'},fetchImpl:async(_url,init)=>{
    calls++;const request=JSON.parse(init.body);
    assert.deepEqual(Object.keys(request.response_format.json_schema.schema.properties),['groups','unresolvedSpan']);
    return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({groups:[{relation:'all',items:[
      {kind:'education',level:'required',state:'stated',span:[2,2]},
      {kind:'experience',level:'preferred',state:'stated',span:[3,3]},
    ]}],unresolvedSpan:null})}}]});
  }});
  assert.equal(calls,1);assert.equal(result.requirements.items.length,2);
  assert.equal(result.provenance.extractionVersion,'recentjobs_requirements_v7');
});
