import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requirementContext} from '../src/ai/requirement-context.mjs';
import {requirementEvidence} from '../src/ai/requirement-evidence.mjs';
import {decodeRequirements,decodeRequirementsV11,requirementsPayload,extractRequirements} from '../src/ai/requirements.mjs';

const candidate=sourceText=>({title:'Fictional apprenticeship',sourceText,applicationCandidates:[]});
const passage=(first,last=first,role='context',condition=null)=>({span:[first,last],role,condition});
const condition=(first,kind='other',level='unclear')=>passage(first,first,'condition',{kind,level,group:1,relation:'all'});

test('bounded behavioral attributes outside minimum requirements are individual stated evidence; None excludes policies',()=>{
  const input=candidate('Job description\nBehavioral\n· Integrity\n· Professionalism\n· Customer focused\nAttributes\n· None\n“If you are not contacted, assume unsuccessful.”\nWorkplace policy applies.\nMinimum requirements\nGrade 12\nHow to apply');
  const layout=requirementContext(input);
  assert.deepEqual(layout.requiredLineNumbers,[4,5,6,12]);
  assert.deepEqual(layout.evidenceHints.map(hint=>[hint.line,hint.kind,hint.level,hint.state]),[
    [4,'other','unclear','stated'],[5,'other','unclear','stated'],[6,'other','unclear','stated']]);
  assert.deepEqual(requirementEvidence(input).requiredLineNumbers,[12]);
  const data={passages:[passage(1,3),condition(4),condition(5),condition(6),passage(7,11),condition(12,'education','required'),passage(13)]};
  assert.equal(decodeRequirements(data,input).items.length,4);
  data.passages.splice(1,3,passage(4,6));
  assert.equal(decodeRequirementsV11(data,input).items.length,1);
  assert.throws(()=>decodeRequirements(data,input),/AI_REQUIREMENT_COVERAGE/);
});

test('behavioral preference markers retain level; duties stop the list and unbounded sections abstain',()=>{
  const input=candidate('Behavioral competencies\nMust work accurately\nPreferred:\nTeamwork\nDuties\nInstall machinery\nHow to apply');
  assert.deepEqual(requirementContext(input).evidenceHints.map(h=>[h.line,h.level]),[[3,'required'],[5,'preferred']]);
  assert.deepEqual(requirementContext(candidate('Behavioral\nIntegrity\nUnknown footer')).evidenceHints,[]);
  assert.deepEqual(requirementContext(candidate('Attributes\nNone\nHow to apply')).evidenceHints,[]);
});

test('standalone subjects get subject kind but nested qualification subjects remain in the complete qualification',()=>{
  const input=candidate('Desired Experience & Qualification\nMatric / N2\nMathematics High Grade\nEnglish\nHow to apply');
  const payload=requirementsPayload(input);
  assert.deepEqual(payload.evidenceHints.map(h=>[h.line,h.kind]),[[4,'subjects'],[5,'subjects']]);
  const data={passages:[passage(1,2),condition(3,'education','required'),condition(4,'subjects','required'),condition(5,'subjects','required'),passage(6)]};
  assert.equal(decodeRequirements(data,input).items.length,3);
  data.passages[2].condition.kind='education';
  assert.equal(decodeRequirementsV11(data,input).items.length,3);
  assert.throws(()=>decodeRequirements(data,input),/AI_INVALID_EXTRACTION/);
  data.passages[2]=passage(4,4,'unresolved');
  assert.throws(()=>decodeRequirements(data,input),/AI_SOURCE_ROLE_CONFLICT/);
  const nested=candidate('Requirements\nOne of the following:\nGrade 12\nN3 with:\nMathematics\nEngineering Science\nHow to apply');
  assert.deepEqual(requirementContext(nested).evidenceHints,[]);
  const branch={kind:'education',level:'required',group:1,relation:'any'};
  assert.equal(decodeRequirements({passages:[passage(1,3),passage(4,4,'condition',branch),passage(5,7,'condition',branch),passage(8)]},nested).expression.op,'any');
  assert.deepEqual(requirementContext(candidate('Requirements\nGrade 12 with:\nMathematics\nScience\nHow to apply')).evidenceHints,[]);
});

test('subject supplements abstain outside a bounded requirement section and on broader skills prose',()=>{
  for(const text of ['English\nHow to apply','Requirements\nEnglish communication skills\nHow to apply','Requirements\nEnglish\nUnknown footer'])
    assert.deepEqual(requirementContext(candidate(text)).evidenceHints,[]);
});

test('a previous-intake preparation caveat binds its complete dependent passage while current documents stay separate',()=>{
  const input=candidate('The application is only complete after you click the final submission button.\nMinimum requirements\nFor the next intake, prepare for requirements similar to a previous apprenticeship intake:\nSouth African citizen\nGrade 12 with Mathematics\nImportant: the current application page specifically says applicants must have certified results.\nHow to apply');
  const payload=requirementsPayload(input);
  assert.deepEqual(payload.unresolvedEvidenceSpans,[[4,6]]);
  assert.deepEqual([payload.fixedRoles.L2,payload.fixedRoles.L4,payload.fixedRoles.L5,payload.fixedRoles.L6],['condition','unresolved','unresolved','unresolved']);
  const data={passages:[passage(1),condition(2,'document','required'),passage(3),passage(4,6,'unresolved'),condition(7,'document','required'),passage(8)]};
  const decoded=decodeRequirements(data,input);
  assert.equal(decoded.items.length,2);assert.match(decoded.expression.children.find(n=>n.op==='unknown').originalText,/prepare for requirements/);
  for(const mutate of [data=>data.passages[3]=passage(4,6),
    data=>data.passages.splice(3,1,passage(4,5,'unresolved'),passage(6,6,'unresolved')),
    data=>data.passages.splice(3,1,passage(4,4,'unresolved'),condition(5,'citizenship','required'),condition(6,'education','required')),
    data=>data.passages.splice(3,2,passage(4,7,'unresolved'))]) {
    const changed=structuredClone(data);mutate(changed);assert.throws(()=>decodeRequirements(changed,input),/AI_/);
  }
});

test('confirmed current eligibility does not become unresolved merely by referring to history',()=>{
  const input=candidate('Previous intake required N3; the current advert requires Grade 12.\nRequirements\nGrade 12\nHow to apply');
  assert.deepEqual(requirementContext(input).unresolvedEvidenceSpans,[]);
});

test('unknown preparation scope and excessive newly selected evidence stop before provider spending',async()=>{
  let calls=0;const options={env:{SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_context_test_key'},fetchImpl:async()=>{calls++;}};
  await assert.rejects(extractRequirements(candidate('Prepare for requirements similar to the previous intake:\nGrade 12'),options),/AI_APPLICABILITY_SCOPE_UNBOUNDED/);
  await assert.rejects(extractRequirements(candidate('Behavioral\n'+Array(41).fill('Integrity').join('\n')+'\nHow to apply'),options),/AI_INPUT_LIMIT/);
  assert.equal(calls,0);
});
