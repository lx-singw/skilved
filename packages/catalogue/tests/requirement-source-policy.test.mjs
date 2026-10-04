import {test} from 'node:test';import assert from 'node:assert/strict';
import {requirementSourcePolicy,assertRequirementSourcePolicy} from '../src/ai/requirement-source-policy.mjs';import {requirementLineNumbers} from '../src/ai/source-lines.mjs';
const candidate={title:'Authored apprenticeship',sourceText:['Minimum requirements','You need:','Grade 12','Added advantages','These aren’t stated as mandatory, but can strengthen an application:','N2 Mechanical','Documents — very important','Only applications with certified copies of the required documents will be considered.','Prepare:','Certified ID','Other certificates, if applicable','What makes this opportunity useful','Career development description.','Closing date: 30 October 2026'].join('\n')};
const item=(id,quote,kind,level,state='stated')=>({id,kind,level,fact:{state,quote,value:state==='stated'?{description:quote,qualification:null,document:null}:null}});
const extraction=()=>({practicalConditions:{state:'stated',value:'Other certificates, if applicable',quote:'Other certificates, if applicable'},requirements:{items:[item('r1','Grade 12','education','required'),item('r2','N2 Mechanical','education','preferred'),item('r3','Only applications with certified copies of the required documents will be considered.','document','required'),item('r4','Certified ID','document','required')],expression:{op:'all',children:['r1','r2','r3','r4'].map(id=>({op:'ref',id}))}}});

test('bounded required, preferred and document sections exclude navigation and editorial context',()=>{
 const policy=requirementSourcePolicy(candidate);assert.deepEqual(policy.requiredLineNumbers,[4,7,9,11]);assert.deepEqual(policy.lineHints.map(h=>h.level),['required','preferred','required','required']);assert.deepEqual(policy.conditionalDocumentInstructions,[{originalText:'Other certificates, if applicable',span:[12,12]}]);assert.doesNotThrow(()=>assertRequirementSourcePolicy(candidate,extraction()));
 // Keep the historical selector's overbroad result unchanged for old replays.
 assert.ok(requirementLineNumbers(candidate).includes(14));
});

test('a document list does not replace its certified-copy acceptance rule',()=>{
 const value=extraction();value.requirements.items.splice(2,1);assert.throws(()=>assertRequirementSourcePolicy(candidate,value),/AI_REQUIREMENT_COVERAGE/);
});

test('preferred facts cannot become mandatory, and document rules cannot change their kind',()=>{
 const value=extraction();value.requirements.items[1].level='required';assert.throws(()=>assertRequirementSourcePolicy(candidate,value),/AI_REQUIREMENT_LEVEL_UNRESOLVED/);
 value.requirements.items[1].level='preferred';value.requirements.items[2].kind='other';assert.throws(()=>assertRequirementSourcePolicy(candidate,value),/AI_DOCUMENT_REQUIREMENT_UNRESOLVED/);
});

test('conditional supporting documents must retain full value and evidence without eligibility nodes',()=>{
 for(const field of ['value','quote']){const value=extraction();value.practicalConditions[field]='Other certificates';assert.throws(()=>assertRequirementSourcePolicy(candidate,value),/AI_CONDITIONAL_DOCUMENT_COVERAGE/);}
 for(const state of ['not_stated','ambiguous']){const value=extraction();value.practicalConditions.state=state;assert.throws(()=>assertRequirementSourcePolicy(candidate,value),/AI_CONDITIONAL_DOCUMENT_COVERAGE/);}
 for(const level of ['required','preferred','unclear']){const value=extraction();value.requirements.items.push(item('r5','Other certificates, if applicable','document',level,level==='unclear'?'ambiguous':'stated'));assert.throws(()=>assertRequirementSourcePolicy(candidate,value),/AI_CONDITIONAL_DOCUMENT_MISCLASSIFIED/);}
 const value=extraction();value.requirements.expression={op:'all',children:[value.requirements.expression,{op:'unknown',originalText:'Other certificates, if applicable'}]};assert.throws(()=>assertRequirementSourcePolicy(candidate,value),/AI_CONDITIONAL_DOCUMENT_MISCLASSIFIED/);
});

test('unclear eligibility, named credentials, mixed and unbounded clauses do not get the supporting-document exception',()=>{
 for(const [heading,line] of [['Minimum requirements','Other certificates, if applicable'],['Required documents','Driver licence, if applicable'],['Required documents','Other certificates, if applicable, and Grade 12 required'],['Required documents','Other certificates where required']]){
  const source={title:'Authored',sourceText:heading+'\n'+line+'\nClosing date: 30 October 2026'};
  assert.deepEqual(requirementSourcePolicy(source).conditionalDocumentInstructions,[]);
  const value={requirements:{items:[item('r1',line,'document','required')],expression:{op:'ref',id:'r1'}}};assert.throws(()=>assertRequirementSourcePolicy(source,value),/AI_CONDITIONAL_REQUIREMENT_UNRESOLVED/);
  value.requirements.items[0]=item('r1',line,'document','unclear','ambiguous');assert.doesNotThrow(()=>assertRequirementSourcePolicy(source,value));
 }
 assert.deepEqual(requirementSourcePolicy({title:'Authored',sourceText:'Required documents\nOther certificates, if applicable'}).conditionalDocumentInstructions,[]);
});
test('unbounded document sections abstain and repeated evidence cannot cover only a partial line',()=>{
 assert.deepEqual(requirementSourcePolicy({title:'Authored',sourceText:'Required documents\nCertified ID\nFooter'}).requiredLineNumbers,[]);
 const value=extraction();value.requirements.items[3].fact.quote='Certified';assert.throws(()=>assertRequirementSourcePolicy(candidate,value),/AI_REQUIREMENT_COVERAGE/);
});

test('scoped apprenticeship views exclude explicit WIL-only documents and blank-form retrieval steps',()=>{
 const value={title:'Authored programmes',programmeScope:{id:'authored'},sourceText:'Documents required\nUpdated CV\nInstitutional release letter for WIL applicants where required.\nRequest an application form from forms@example.test.\nClosing date: 30 October 2026'};
 assert.deepEqual(requirementSourcePolicy(value).requiredLineNumbers,[3]);
 assert.deepEqual(requirementSourcePolicy({...value,programmeScope:undefined}).requiredLineNumbers,[3,4]);
});

const assessmentCandidate={title:'Authored apprenticeship',sourceText:'Minimum requirements\nPass Authored Workshop’s Technical Assessment, including:\nNumeracy\nLiteracy\nValid driving licence\nAdded advantages\nValid passport\nClosing date: 30 October 2026'};
const assessmentPassage='Pass Authored Workshop’s Technical Assessment, including:\nNumeracy\nLiteracy';
const assessmentExtraction=()=>({requirements:{items:[item('r1',assessmentPassage,'other','required'),item('r2','Valid driving licence','other','required'),item('r3','Valid passport','other','preferred')],expression:{op:'all',children:['r1','r2','r3'].map(id=>({op:'ref',id}))}}});

test('bounded assessment components remain in one complete condition instead of independent eligibility items',()=>{
 assert.deepEqual(requirementSourcePolicy(assessmentCandidate).completeRequirementSpans,[{span:[3,5],kind:'other'}]);
 assert.doesNotThrow(()=>assertRequirementSourcePolicy(assessmentCandidate,assessmentExtraction()));
 const split=assessmentExtraction();split.requirements.items.splice(0,1,...assessmentPassage.split('\n').map((quote,index)=>item(`split${index}`,quote,'other','required')));
 assert.throws(()=>assertRequirementSourcePolicy(assessmentCandidate,split),/AI_REQUIREMENT_GROUP_UNRESOLVED/);
 const overlap=assessmentExtraction();overlap.requirements.items.push(item('extra','Numeracy','other','required'));
 assert.throws(()=>assertRequirementSourcePolicy(assessmentCandidate,overlap),/AI_REQUIREMENT_GROUP_UNRESOLVED/);
 const wrong=assessmentExtraction();wrong.requirements.items[0].kind='education';assert.throws(()=>assertRequirementSourcePolicy(assessmentCandidate,wrong),/AI_REQUIREMENT_KIND_UNRESOLVED/);
});

test('assessment recognition abstains on incomplete, unbounded or unknown continuation layouts',()=>{
 for(const sourceText of ['Minimum requirements\nPass Technical Assessment, including:\nNumeracy\nLiteracy','Minimum requirements\nPass Technical Assessment, including:\nNumeracy\nLiteracy\nSpatial reasoning\nClosing date: 30 October 2026','Minimum requirements\nPass Technical Assessment, including:\nNumeracy\nNumeracy\nClosing date: 30 October 2026','Minimum requirements\nPass Technical Assessment, including:\nNumeracy or literacy\nClosing date: 30 October 2026'])assert.deepEqual(requirementSourcePolicy({title:'Authored',sourceText}).completeRequirementSpans,[]);
 const unknown=assessmentExtraction();unknown.requirements.items.shift();unknown.requirements.expression={op:'all',children:[...unknown.requirements.items.map(i=>({op:'ref',id:i.id})),{op:'unknown',originalText:assessmentPassage}]};
 assert.doesNotThrow(()=>assertRequirementSourcePolicy(assessmentCandidate,unknown));
 unknown.requirements.items.push(item('partial','Literacy','other','required'));assert.throws(()=>assertRequirementSourcePolicy(assessmentCandidate,unknown),/AI_REQUIREMENT_GROUP_UNRESOLVED/);
});

test('an unqualified held passport does not establish citizenship or document submission',()=>{
 const policy=requirementSourcePolicy(assessmentCandidate);assert.equal(policy.lineHints.find(h=>h.line===8).kind,'other');
 for(const kind of ['citizenship','document']){const wrong=assessmentExtraction();wrong.requirements.items[2].kind=kind;assert.throws(()=>assertRequirementSourcePolicy(assessmentCandidate,wrong),/AI_REQUIREMENT_KIND_UNRESOLVED/);}
 const submitted={title:'Authored',sourceText:'Required documents\nValid passport\nClosing date: 30 October 2026'};
 assert.equal(requirementSourcePolicy(submitted).lineHints[0].kind,'document');
 const qualified={title:'Authored',sourceText:'Added advantages\nValid South African passport\nClosing date: 30 October 2026'};
 assert.equal(requirementSourcePolicy(qualified).lineHints[0].kind,null);
});
