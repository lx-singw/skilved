import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extractMetadata,METADATA_VERSION} from '../src/ai/metadata.mjs';
import {decodeGroqMetadata} from '../src/ai/groq-schema.mjs';

const candidate = {title:'Fictional Works Apprentice',sourceText:'Based in Exampletown for four years.\nProvince: Gauteng\nSalary: Market related\nApply now',applicationCandidates:[{method:'portal',destination:'https://employer.example/apply',originalText:'Apply now'}]};
const stated = (value,span)=>({state:'stated',value,span});
const wire = ()=>({category:'apprenticeship',categorySpan:[1,1],issuer:stated('Fictional Works',[1,1]),summary:null,intake:null,
  location:stated({places:[{city:'Exampletown',province:'gauteng',country:null}],coverage:'not_stated',attendance:'not_stated',relocation:null},[2,3]),
  residence:null,experience:null,deadline:null,compensation:[stated({kind:'salary',amount:null,maximum:null,currency:null,period:'not_stated',coverage:'Market related'},[4,4])],
  practicalConditions:stated('Based in Exampletown for four years.',[2,2]),applicationCandidateIndex:0});

test('metadata stage preserves prose city and qualitative pay without requirements or invented country/amount',async()=>{
  let calls=0;
  const result=await extractMetadata(candidate,{env:{SKILVED_AI_MODE:'groq',GROQ_API_KEY:'synthetic_metadata_test_key'},fetchImpl:async(_url,init)=>{
    calls++;const body=JSON.parse(init.body);
    assert.equal(body.response_format.json_schema.name,METADATA_VERSION);
    assert.equal('requirements' in body.response_format.json_schema.schema.properties,false);
    assert.equal(JSON.parse(body.messages[1].content).applicationCandidates[0].destination,'https://employer.example/apply');
    return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(wire())}}],usage:{prompt_tokens:700,completion_tokens:300,total_tokens:1000}});
  }});
  assert.equal(calls,1);assert.equal(result.metadata.location.value.places[0].city,'Exampletown');
  assert.equal(result.metadata.location.value.places[0].country,null);assert.equal(result.metadata.compensation[0].value.amount,null);
  assert.equal(result.metadata.compensation[0].quote,'Salary: Market related');assert.equal('requirements' in result.metadata,false);
});
test('metadata rejects injected destinations, requirement trees, invalid spans and invalid assertion state',()=>{
  for(const data of [{...wire(),applicationUrl:'https://attacker.example'},{...wire(),requirements:{}},
    {...wire(),issuer:stated('Fictional',[99,99])},{...wire(),issuer:{state:'ambiguous',value:'invented',span:[1,1]}}])
    assert.throws(()=>decodeGroqMetadata(data,candidate),/AI_INVALID_EXTRACTION/);
});
test('metadata rejects disabled provider before spending a request',async()=>{
  await assert.rejects(extractMetadata(candidate,{env:{},fetchImpl:()=>assert.fail('request attempted')}),/AI_DISABLED/);
});
