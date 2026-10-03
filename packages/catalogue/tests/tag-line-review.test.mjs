import {test} from 'node:test';
import assert from 'node:assert/strict';
import {tagLinePayload,tagLineContract,tagInventorySchema,projectTagInventory,bindTagInventory,decodeTagInventory,compareTagInventory,reviewTagSource} from '../src/ai/tag-line-review.mjs';
import {submissionLinePayload,bindSubmissionInventory,decodeSubmissionInventory} from '../src/ai/submission-line-review.mjs';
import {bindRecordInventory} from '../src/ai/record-line-review.mjs';
const source=sourceText=>({title:'Fictional apprenticeship',sourceText});
const candidate=source('Requirements\nGrade 12\nMust select training trades in order of priority\nMake selection in the application question.\nHow to apply');
const row=(line,tag='context',anchor=0,alternative=0)=>({line,tag,anchor,alternative});
const wire=(candidate,values={})=>({lines:tagLinePayload(candidate).requiredOutputKeys.map(key=>values[key]??row(Number(key.slice(1))))});
const faithful=()=>wire(candidate,{L3:row(3,'education:mandatory'),L4:row(4,'document:mandatory'),L5:row(5,'continuation',4)});
const decode=(candidate,inventory)=>decodeTagInventory(candidate,bindTagInventory(candidate,inventory));

test('one classification tag preserves source semantics, complete submission quotes and claim comparison',()=>{
  assert.deepEqual(tagLinePayload(candidate),submissionLinePayload(candidate));
  const inventory=faithful(),requirements=decode(candidate,inventory);
  const original={lines:{L1:'context',L2:'context',L3:{kind:'education',strength:'mandatory',alternative:null},L4:{kind:'document',strength:'mandatory',alternative:null},L5:4,L6:'context'}};
  assert.deepEqual(projectTagInventory(tagLinePayload(candidate),inventory),original);
  assert.deepEqual(requirements,decodeSubmissionInventory(candidate,bindSubmissionInventory(candidate,original)));
  assert.equal(requirements.items[1].fact.quote,'Must select training trades in order of priority\nMake selection in the application question.');
  assert.equal(compareTagInventory({candidate,requirements,review:bindTagInventory(candidate,inventory)}).supported,true);
  assert.deepEqual(decode(candidate,{lines:[...inventory.lines].reverse()}),requirements);
});

test('native schema has four fields and cannot express uncertain plus current kind/strength',()=>{
  const contract=tagLineContract(candidate),schema=contract.schema,items=schema.properties.lines.items;
  assert.deepEqual(items.required,['line','tag','anchor','alternative']);assert.equal(items.additionalProperties,false);
  assert.ok(items.properties.tag.enum.includes('uncertain'));assert.ok(items.properties.tag.enum.includes('education:mandatory'));
  assert.ok(items.properties.tag.enum.includes('age:advantage'));assert.ok(!items.properties.tag.enum.includes('current'));
  assert.equal(schema.properties.lines.minItems,undefined);assert.equal(schema.properties.lines.maxItems,undefined);
  assert.notEqual(contract.tagSchemaSha256,contract.localTagSchemaSha256);
  assert.doesNotMatch(JSON.stringify(schema),/"anyOf"|"\$ref"|"\$schema"/);
  assert.doesNotMatch(contract.instruction,/Every record has exactly line,role|kind and strength must be none/);
  for(const invalid of [row(4,'document'),row(4,'education:none'),row(4,'current'),{...row(4,'uncertain'),kind:'other',strength:'unstated'},
    {...row(4,'document:mandatory'),role:'uncertain'}]){
    const inventory=faithful();inventory.lines[3]=invalid;
    assert.throws(()=>decode(candidate,inventory),/AI_INVALID_REVIEW_INVENTORY/);
  }
});

test('tag records still reject missing, duplicate, extra and foreign line coverage',()=>{
  const missing=faithful();missing.lines.pop();
  const duplicate=faithful();duplicate.lines[5]=row(1);
  const foreign=faithful();foreign.lines[5]=row(7);
  const extra=faithful();extra.lines.push(row(7));
  for(const inventory of [missing,duplicate,foreign,extra,{...faithful(),extra:true}])
    assert.throws(()=>decode(candidate,inventory),/AI_INVALID_REVIEW_INVENTORY|AI_REVIEW_LINE_COVERAGE/);
});

test('remaining tag/anchor contradictions are rejected without inferring a continuation',()=>{
  for(const value of [row(4,'document:mandatory',3),row(4,'context',3),row(4,'uncertain',0,4),row(4,'continuation'),row(4,'continuation',3,3)]){
    const inventory=faithful();inventory.lines[3]=value;
    assert.ok(tagInventorySchema(tagLinePayload(candidate)).safeParse(inventory).success);
    assert.throws(()=>decode(candidate,inventory),/AI_REVIEW_TAG_ANCHOR_CONFLICT/);
  }
});

test('single tags never bypass singleton alternatives, omitted obligations or continuation ownership',()=>{
  for(const [values,code] of [[{L3:row(3,'education:mandatory',0,3),L4:row(4,'document:mandatory'),L5:row(5,'continuation',4)},/AI_REVIEW_ALTERNATIVE_INVALID/],
    [{L3:row(3,'education:mandatory')},/AI_REQUIREMENT_COVERAGE/],
    [{L3:row(3,'education:mandatory'),L4:row(4,'document:mandatory'),L5:row(5,'continuation',6)},/AI_INVALID_REVIEW_INVENTORY/]])
    assert.throws(()=>decode(candidate,wire(candidate,values)),code);
});

test('compiled and residual alternatives retain their separate groups and code-owned lines cannot be echoed',()=>{
  const compiled=source('What You Bring\nCandidate must have passed the following subjects at TVET college to join the programme:\nMathematics N3-N6\nEngineering Science N3-N6\nOr National Certificate (Vocational) 4\nEngineering Processes\nProfessional Engineering Practice\nClear criminal record\nEither prior mechanical experience\nOr prior electrical experience\nHow to apply');
  const inventory=wire(compiled,{L9:row(9,'other:mandatory'),L10:row(10,'experience:mandatory',0,10),L11:row(11,'experience:mandatory',0,10)});
  const decoded=decode(compiled,inventory);assert.equal(decoded.items.length,5);
  assert.deepEqual(decoded.expression.children.map(child=>child.op),['any','ref','any']);
  const echoed=structuredClone(inventory);echoed.lines[1]=row(3);
  assert.throws(()=>decode(compiled,echoed),/AI_REVIEW_LINE_COVERAGE/);
  assert.throws(()=>decode(compiled,wire(compiled,{L9:row(9,'continuation',3)})),/AI_INVALID_REVIEW_INVENTORY/);
  assert.throws(()=>decode(compiled,wire(compiled,{L9:row(9,'other:mandatory',0,3)})),/AI_REVIEW_ALTERNATIVE_INVALID/);
});

test('uncertainty tags keep complete protected scopes and cannot promote dependent past-intake documents',()=>{
  const preparation=source('Preparation for eligibility requirements from previous intake\nEnsure your application includes the following:\nCV\nHow to apply');
  const decoded=decode(preparation,wire(preparation,{L2:row(2,'preparation'),L3:row(3,'continuation',2),L4:row(4,'continuation',2)}));
  assert.equal(decoded.items.length,0);assert.equal(decoded.expression.op,'unknown');
  assert.throws(()=>decode(preparation,wire(preparation,{L2:row(2,'preparation'),L4:row(4,'document:mandatory')})),/AI_REVIEW_SOURCE_CONSTRAINT/);
});

test('tag reviews bind source, version, schema and thinking without accepting older cached records',()=>{
  const review=bindTagInventory(candidate,faithful());
  assert.throws(()=>decodeTagInventory(candidate,bindRecordInventory(candidate,{lines:[]})),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>decodeTagInventory({...candidate,sourceText:candidate.sourceText+'\nContact recruiter'},review),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>decodeTagInventory(candidate,{...review,thinking:'medium'}),/AI_REVIEW_BINDING_MISMATCH/);
  assert.throws(()=>tagLineContract(candidate,{thinking:'high'}),/AI_INVALID_REVIEW_THINKING/);
});

test('tag review makes a blind bounded native request and preserves invalid usage without fallback',async()=>{
  const env={SKILVED_AI_MODE:'gemini',SKILVED_AI_MODEL:'gemini-3.5-flash-lite',GEMINI_API_KEY:'synthetic_tag_review_key'};
  let calls=0;
  const fetchImpl=async(_url,init)=>{
    calls++;const request=JSON.parse(init.body),contract=tagLineContract(candidate);
    assert.deepEqual(request.generationConfig.responseJsonSchema,contract.schema);
    assert.equal(request.generationConfig.maxOutputTokens,3072);
    assert.equal(request.systemInstruction.parts[0].text,contract.instruction);
    assert.deepEqual(JSON.parse(request.contents[0].parts[0].text),tagLinePayload(candidate));
    assert.doesNotMatch(JSON.stringify(request),/PRIVATE_GOLD|PRIVATE_ROUTE/);
    if(calls===3)return new Response('',{status:400});
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(calls===1?faithful():wire(candidate))}]}}],usageMetadata:{promptTokenCount:100,candidatesTokenCount:50,totalTokenCount:150}});
  };
  const review=await reviewTagSource({...candidate,gold:'PRIVATE_GOLD',applicationCandidates:['PRIVATE_ROUTE']},{env,fetchImpl});
  assert.equal(decodeTagInventory(candidate,review).items.length,2);
  await assert.rejects(reviewTagSource(candidate,{env,fetchImpl}),error=>error.code==='AI_REQUIREMENT_COVERAGE'&&error.usage.totalTokens===150);
  await assert.rejects(reviewTagSource(candidate,{env,fetchImpl}),error=>error.code==='AI_PROVIDER_REJECTED'&&error.providerStatus===400);
  assert.equal(calls,3);
});
