import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeGroqMetadata,decodeGroqExtraction,decodeLegacyGroqExtraction,LEGACY_GROQ_EXTRACTION_VERSION,GROQ_EXTRACTION_VERSION,GroqExtractionSchema} from '../src/ai/groq-schema.mjs';
import {METADATA_VERSION,extractMetadata} from '../src/ai/metadata.mjs';
import {extractWithProvider} from '../src/ai/provider.mjs';
import {PROGRAMME_EXTRACTION_VERSION,ProgrammeExtractionSchema} from '../src/ai/programme-extraction.mjs';
const passage='Other certificates, if applicable.\nDo not travel before confirmation.';
const candidate={title:'Authored apprenticeship',sourceText:passage,applicationCandidates:[]};
const metadata=()=>({category:'apprenticeship',categorySpan:[1,1],issuer:null,summary:null,intake:null,location:null,residence:null,experience:null,deadline:null,compensation:[],practicalConditions:{state:'stated',span:[2,3]},applicationCandidateIndex:null});
const wire=()=>({...metadata(),requirements:{items:[],expression:'unknown(2,3)'}});

test('span-only practical facts reconstruct exact conditional/negative source text without modifying input',()=>{
 const raw=wire(),before=structuredClone(raw),decoded=decodeGroqExtraction(raw,candidate);
 assert.deepEqual(decoded.practicalConditions,{state:'stated',value:passage,quote:passage});assert.deepEqual(raw,before);
 assert.deepEqual(decodeGroqMetadata(metadata(),candidate).practicalConditions,decoded.practicalConditions);
 for(const state of ['ambiguous','conflicting']){const x=metadata();x.practicalConditions.state=state;assert.deepEqual(decodeGroqMetadata(x,candidate).practicalConditions,{state,value:null,quote:passage});}
 const absent=metadata();absent.practicalConditions=null;assert.deepEqual(decodeGroqMetadata(absent,candidate).practicalConditions,{state:'not_stated',value:null,quote:null});
});

test('model text, extra fields, malformed bounds and unstated-state objects cannot enter the new contract',()=>{
 for(const patch of [{value:passage},{value:null},{quote:passage},{extra:'do not retain'},{state:'not_stated'},{span:[0,3]},{span:[3,2]},{span:[2,4]},{span:[2,2.5]},{span:[2,3,3]}]){
  const raw=wire();Object.assign(raw.practicalConditions,patch);const before=structuredClone(raw);
  assert.throws(()=>decodeGroqExtraction(raw,candidate),{code:'AI_INVALID_EXTRACTION'});assert.deepEqual(raw,before);
 }
 for(const sourceText of ['\n','x'.repeat(4001)]){const raw=metadata();raw.practicalConditions.span=[2,2];assert.throws(()=>decodeGroqMetadata(raw,{...candidate,sourceText}),{code:'AI_INVALID_EXTRACTION'});}
});

test('old answers stay on explicit offline legacy replay; live decoding never strips their model-written values',()=>{
 assert.equal(LEGACY_GROQ_EXTRACTION_VERSION,'recentjobs_extraction_v27_groq_v7');
 const old=wire();old.practicalConditions.value=passage;const before=structuredClone(old);
 assert.equal(decodeLegacyGroqExtraction(old,candidate).practicalConditions.value,passage);
 assert.throws(()=>decodeGroqExtraction(old,candidate),{code:'AI_INVALID_EXTRACTION'});
 old.practicalConditions.value='Other certificates.';
 assert.throws(()=>decodeLegacyGroqExtraction(old,candidate),{code:'AI_PRACTICAL_EVIDENCE_UNRESOLVED'});
 assert.throws(()=>decodeGroqExtraction(old,candidate),{code:'AI_INVALID_EXTRACTION'});
 old.practicalConditions.value=passage;assert.deepEqual(old,before);
 const invalid=structuredClone(old);invalid.practicalConditions.value='Unsupported text';
 invalid.requirements={items:['r1','r2'].map(id=>({id,kind:'other',level:'required',state:'stated',span:[2,3]})),expression:'all(r1,r2)'};
 assert.throws(()=>decodeLegacyGroqExtraction(invalid,candidate),{code:'AI_DUPLICATE_REQUIREMENT_PASSAGE'});
});

test('ordinary, split and programme contracts all reject redundant values and have new cache versions',()=>{
 assert.equal(GROQ_EXTRACTION_VERSION,'recentjobs_extraction_v31_groq_v8');assert.equal(METADATA_VERSION,'recentjobs_metadata_v23');assert.equal(PROGRAMME_EXTRACTION_VERSION,'recentjobs_programme_extraction_v31');
 const raw=wire();assert.equal(GroqExtractionSchema.safeParse(raw).success,true);const {applicationCandidateIndex,...programme}=raw;assert.equal(ProgrammeExtractionSchema.safeParse(programme).success,true);
 programme.practicalConditions.value=passage;assert.equal(ProgrammeExtractionSchema.safeParse(programme).success,false);
});

test('simulated Groq/Gemini ordinary and split extraction copy source text and reject old shapes after one spent call',async()=>{
 for(const provider of ['groq','gemini'])for(const split of [false,true])for(const invalid of [false,true]){
  let calls=0;const raw=split?metadata():wire();if(invalid)raw.practicalConditions.value=passage;
  const env={SKILVED_AI_MODE:provider,GROQ_API_KEY:'synthetic_span_test_key',GEMINI_API_KEY:'synthetic_span_test_key',SKILVED_AI_FALLBACK:'true'};
  const options={env,fetchImpl:async()=>{calls++;return provider==='gemini'?Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(raw)}]}}],usageMetadata:{promptTokenCount:10,totalTokenCount:15}}):Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(raw)}}],usage:{prompt_tokens:10,completion_tokens:5,total_tokens:15}});}};
  const run=(split?extractMetadata:extractWithProvider)(candidate,options);
  if(invalid)await assert.rejects(run,e=>e.code==='AI_INVALID_EXTRACTION'&&e.usage.totalTokens===15);
  else{const r=await run;assert.equal((r.metadata??r.extraction).practicalConditions.value,passage);assert.equal(r.provenance.usage.totalTokens,15);}
  assert.equal(calls,1);
 }
});
