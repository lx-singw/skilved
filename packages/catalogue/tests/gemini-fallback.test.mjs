import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {generateStructured, GEMINI_MODEL_CHAIN} from '../src/ai/gemini.mjs';
import {reviewTagSource, tagLinePayload} from '../src/ai/tag-line-review.mjs';

const env = {SKILVED_AI_MODE:'gemini', GEMINI_API_KEY:'synthetic_fallback_key_only'};
const contract = {instruction:'Return the supplied fictional evidence as JSON.', schema:{type:'object'}, version:'synthetic'};
const answer = (data={ok:true}) => Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}],
  usageMetadata:{promptTokenCount:10,candidatesTokenCount:5,totalTokenCount:15}});
const modelOf = url => url.split('/models/')[1].split(':')[0];

test('availability fallback descends once through all six models with unchanged request and safe provenance',async()=>{
  const calls=[],statuses=[503,404,429,500,504];
  const result=await generateStructured({source:'Fictional evidence'},contract,{env,maxOutputTokens:3072,fetchImpl:async(url,init)=>{
    calls.push({model:modelOf(url),request:JSON.parse(init.body)});
    assert.equal(init.headers['x-goog-api-key'],env.GEMINI_API_KEY);assert.equal(init.redirect,'error');
    return calls.length<=statuses.length ? new Response('PRIVATE_PROVIDER_ERROR',{status:statuses[calls.length-1],headers:{'Retry-After':'60'}}) : answer();
  }});
  assert.deepEqual(calls.map(c=>c.model),GEMINI_MODEL_CHAIN);
  for(const c of calls){assert.deepEqual(c.request,calls[0].request);assert.equal(c.request.generationConfig.maxOutputTokens,3072);}
  assert.equal(result.provenance.model,'gemini-3.1-flash-lite');assert.equal(result.provenance.requestedModel,'gemini-3.8-flash');
  assert.equal(result.provenance.attempts.length,6);assert.deepEqual(result.provenance.attempts.slice(0,5).map(a=>a.providerStatus),statuses);
  for(const [i,a] of result.provenance.attempts.entries()){
    assert.equal(a.requestHash,createHash('sha256').update(JSON.stringify({model:calls[i].model,request:calls[i].request})).digest('hex'));
    if(i<5){assert.equal(a.usage,null);assert.equal(a.retryAfterMs,60000);}
  }
  assert.equal(result.provenance.usage.totalTokens,15);
  assert.equal(JSON.stringify(result).includes(env.GEMINI_API_KEY),false);assert.doesNotMatch(JSON.stringify(result),/PRIVATE_PROVIDER_ERROR/);
});

test('an explicit lower model starts there and never climbs or repeats after exhaustion',async()=>{
  for(const [model,expected] of [['gemini-3.5-flash',GEMINI_MODEL_CHAIN.slice(3)],['gemini-3.1-flash-lite',GEMINI_MODEL_CHAIN.slice(5)]]){
    const calls=[];
    await assert.rejects(generateStructured({},contract,{env:{...env,SKILVED_AI_MODEL:model},fetchImpl:async url=>{
      calls.push(modelOf(url));return new Response('PRIVATE_PROVIDER_ERROR',{status:503});
    }}),error=>error.code==='AI_PROVIDER_REJECTED'&&error.providerStatus===503&&error.attempts.length===expected.length&&
      error.attempts.every(a=>a.usage===null)&&!JSON.stringify(error).includes('PRIVATE_PROVIDER_ERROR'));
    assert.deepEqual(calls,expected);
  }
});

test('disabled fallback makes one call; invalid fallback configuration makes none',async()=>{
  for(const options of [{fallback:false},{env:{...env,SKILVED_AI_FALLBACK:'false'}}]){
    let calls=0;
    await assert.rejects(generateStructured({},contract,{env,...options,fetchImpl:async()=>{calls++;return new Response(null,{status:503});}}),
      error=>error.providerStatus===503&&error.attempts===undefined);
    assert.equal(calls,1);
  }
  for(const options of [{fallback:'true'},{env:{...env,SKILVED_AI_FALLBACK:'yes'}},{env:{...env,SKILVED_AI_MODEL:'gemini-unlisted'}}])
    await assert.rejects(generateStructured({},contract,{env,...options,fetchImpl:()=>assert.fail('network attempted')}),/AI_CONFIGURATION_REQUIRED/);
});

test('billing, authentication and request errors stop without falling through',async()=>{
  for(const status of [400,401,402,403]){
    let calls=0;
    await assert.rejects(generateStructured({},contract,{env,fetchImpl:async()=>{calls++;return new Response('PRIVATE_ERROR',{status});}}),
      error=>error.providerStatus===status&&error.attempts.length===1&&error.retryable===false);
    assert.equal(calls,1);
  }
});

test('invalid JSON, blocked content and incomplete answers stop with their reported usage',async()=>{
  for(const body of [
    {candidates:[{finishReason:'STOP',content:{parts:[{text:'PRIVATE_INVALID_JSON'}]}}]},
    {promptFeedback:{blockReason:'SAFETY'}},
    {candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'{}'}]}}]},
  ]){
    let calls=0;
    await assert.rejects(generateStructured({},contract,{env,fetchImpl:async()=>{calls++;return Response.json({...body,
      usageMetadata:{promptTokenCount:10,candidatesTokenCount:5,totalTokenCount:15}});}}),
      error=>['AI_INVALID_JSON','AI_INCOMPLETE_RESPONSE'].includes(error.code)&&error.attempts.length===1&&error.usage.totalTokens===15);
    assert.equal(calls,1);
  }
});

test('fallback stops at an available answer even when local requirement coverage subsequently fails',async()=>{
  const candidate={title:'Fictional apprenticeship',sourceText:'Requirements\nMust select training trades in order of priority\nMake selection in the application question.\nHow to apply'};
  const inventory={lines:tagLinePayload(candidate).requiredOutputKeys.map(key=>({line:Number(key.slice(1)),tag:'context',anchor:0,alternative:0}))};
  let calls=0;
  await assert.rejects(reviewTagSource(candidate,{env,fetchImpl:async()=>{
    calls++;return calls===1?new Response(null,{status:503}):answer(inventory);
  }}),error=>error.code==='AI_REQUIREMENT_COVERAGE'&&error.usage.totalTokens===15);
  assert.equal(calls,2);
});

test('transport failure descends without exposing transport details',async()=>{
  const calls=[];
  const result=await generateStructured({},contract,{env,fetchImpl:async url=>{
    calls.push(modelOf(url));if(calls.length===1)throw new Error('PRIVATE_TRANSPORT_DETAIL');return answer();
  }});
  assert.deepEqual(calls,GEMINI_MODEL_CHAIN.slice(0,2));
  assert.equal(result.provenance.attempts[0].code,'AI_TRANSPORT_FAILED');assert.doesNotMatch(JSON.stringify(result),/PRIVATE_TRANSPORT_DETAIL/);
});

test('timeouts abort each attempt and the whole chain stops after its ninety-second budget',async t=>{
  t.mock.timers.enable({apis:['Date','setTimeout']});
  const signals=[];let secondStarted;
  const second=new Promise(resolve=>{secondStarted=resolve;});
  const pending=generateStructured({},contract,{env,fetchImpl:async(_url,init)=>{
    signals.push(init.signal);if(signals.length===2)secondStarted();
    return new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new Error('PRIVATE_TIMEOUT')),{once:true}));
  }});
  const rejection=assert.rejects(pending,error=>error.code==='AI_TIMEOUT'&&error.retryable&&error.attempts.length===2);
  t.mock.timers.tick(45000);await second;t.mock.timers.tick(45000);await rejection;
  assert.equal(signals.length,2);assert.ok(signals.every(signal=>signal.aborted));
});
