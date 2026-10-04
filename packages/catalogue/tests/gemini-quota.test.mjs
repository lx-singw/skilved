import {test} from 'node:test';import assert from 'node:assert/strict';import {generateStructured} from '../src/ai/gemini.mjs';
import {geminiQuotaDay,nextGeminiQuotaReset,geminiQuotaScope,geminiQuotaLimits,geminiUsageDelay,mergeGeminiMinuteUsage} from '../src/ai/gemini-quota.mjs';
const env={SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_quota_key_123456',SKILVED_AI_FALLBACK:'false'};
const quota=(id,model='gemini-3.8-flash')=>({error:{message:'PRIVATE_MESSAGE',details:[{'@type':'type.googleapis.com/google.rpc.QuotaFailure',violations:[{quotaId:id,quotaDimensions:{model},quotaValue:'PRIVATE_VALUE'}]}]}});

test('only structured daily quota details create daily exhaustion, without leaking provider text or values',async()=>{
 for(const [id,kind] of [['GenerateRequestsPerDayPerProjectPerModel-FreeTier','daily'],['GenerateTokensPerDayPerProjectPerModel','daily'],['GenerateRequestsPerMinutePerProjectPerModel-FreeTier',undefined]])await assert.rejects(generateStructured({}, {instruction:'Authored',schema:{type:'object'},version:'authored'}, {env,fetchImpl:async()=>Response.json(quota(id),{status:429})}),error=>{assert.equal(error.rateLimitKind,kind);assert.equal(error.code,'AI_RATE_LIMITED');assert.doesNotMatch(JSON.stringify(error),/PRIVATE|GenerateRequests|quotaValue/);return true;});
 await assert.rejects(generateStructured({}, {instruction:'Authored',schema:{type:'object'},version:'authored'}, {env,fetchImpl:async()=>Response.json(quota('GenerateRequestsPerDayPerProjectPerModel','gemini-3.7-flash'),{status:429})}),error=>error.rateLimitKind===undefined);
});

test('Pacific quota days and midnight resets handle winter and both daylight-saving transitions',()=>{
 for(const [now,day,reset] of [['2026-10-04T12:00:00.000Z','2026-10-04','2026-10-05T07:00:00.000Z'],['2026-01-04T12:00:00.000Z','2026-01-04','2026-01-05T08:00:00.000Z'],['2026-03-08T08:00:00.000Z','2026-03-08','2026-03-09T07:00:00.000Z'],['2026-11-01T07:00:00.000Z','2026-11-01','2026-11-02T08:00:00.000Z'],['2026-10-04T06:59:59.999Z','2026-10-03','2026-10-04T07:00:00.000Z']]){assert.equal(geminiQuotaDay(now),day);assert.equal(nextGeminiQuotaReset(now),reset);}
});

test('a configured project shares quota scope across keys; credential fallback isolates unrelated keys',()=>{
 assert.equal(geminiQuotaScope({...env,SKILVED_GEMINI_PROJECT_ID:'authored-project'}),geminiQuotaScope({...env,GEMINI_API_KEY:'different_private_key',SKILVED_GEMINI_PROJECT_ID:'authored-project'}));assert.notEqual(geminiQuotaScope(env),geminiQuotaScope({...env,GEMINI_API_KEY:'different_private_key'}));assert.throws(()=>geminiQuotaScope({...env,SKILVED_GEMINI_PROJECT_ID:'invalid project'}),/AI_CONFIGURATION_REQUIRED/);
});

test('configured RPD and rolling RPM/known TPM limits remember exhaustion without spending another reservation',()=>{
 const now='2026-10-04T12:00:00.000Z',usage={requests:20,minute:[{at:'2026-10-04T11:59:30.000Z',inputTokens:1000},{at:'2026-10-04T11:59:45.000Z',inputTokens:null}]};
 assert.deepEqual(geminiUsageDelay(usage,{rpd:20},now),{until:'2026-10-05T07:00:00.000Z',kind:'daily'});assert.equal(geminiUsageDelay(usage,{rpm:2},now).kind,'minute');assert.equal(geminiUsageDelay(usage,{tpm:1000},now).kind,'minute');assert.equal(geminiUsageDelay(usage,{tpm:1001},now),null);assert.equal(geminiUsageDelay(usage,{rpm:2},'2026-10-04T12:01:00.000Z'),null);
 for(const input of ['null','[]','{"unknown-model":{"rpd":20}}','{"gemini-3.8-flash":{"rpd":-1}}','{"gemini-3.8-flash":{"unsupported":1}}'])assert.throws(()=>geminiQuotaLimits({SKILVED_GEMINI_MODEL_LIMITS:input}),/AI_CONFIGURATION_REQUIRED/);
});

test('midnight carry merges pending copies without losing late reported token usage',()=>{
 const now='2026-10-04T07:00:01.000Z',at='2026-10-04T06:59:45.000Z';
 const previous={minute:[{id:'a',at,inputTokens:10}]},current={minute:[{id:'a',at,inputTokens:null},{id:'b',at:now,inputTokens:5}]};
 assert.deepEqual(mergeGeminiMinuteUsage(previous,current,now),[{id:'a',at,inputTokens:10},{id:'b',at:now,inputTokens:5}]);
 assert.equal(geminiUsageDelay({requests:1,minute:mergeGeminiMinuteUsage(previous,current,now)},{tpm:15},now).kind,'minute');
});
