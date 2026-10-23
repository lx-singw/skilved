import {test} from 'node:test';
import assert from 'node:assert/strict';
import {suggestionCleanupConfiguration as config,executeSuggestionCleanup as execute} from '../src/suggestion-cleanup-operator.mjs';
const retirement={retiredRecoveryEpochs:[],retireLegacy:false};
const env=value=>({SKILVED_SUGGESTION_CLEANUP_CONFIG:JSON.stringify(value)});
const code=(p,value)=>assert.rejects(p,e=>e.code===value&&e.message===value);
test('cleanup configuration is absent by default and mutations default off with explicit trusted retirement',()=>{
  assert.equal(config({}),null);const input=env({retirement}),before=JSON.stringify(input);
  assert.deepEqual(config(input),{mutationsEnabled:false,retirement});assert.equal(JSON.stringify(input),before);
  assert.equal(config(env({mutationsEnabled:true,retirement})).mutationsEnabled,true);
});
test('cleanup config rejects malformed, oversized, duplicate and extra policy without private errors',()=>{
  for(const text of ['PRIVATE_BAD_JSON','x'.repeat(2049),...[
    null,{}, {retirement,notes:'PRIVATE'}, {retirement,mutationsEnabled:'true'},
    {retirement:{retireLegacy:false,retiredRecoveryEpochs:['a'.repeat(64),'a'.repeat(64)]}},
    {retirement:{...retirement,retireLegacy:1}},
  ].map(JSON.stringify)])assert.throws(()=>config({SKILVED_SUGGESTION_CLEANUP_CONFIG:text}),e=>e.code==='UNSAFE_CONFIGURATION'&&e.message==='UNSAFE_CONFIGURATION');
});
test('strict command rejects authority injection and disabled mutations before reading runtime',async()=>{
  const runtime=new Proxy({}, {get(){assert.fail('Disabled or invalid command must not touch runtime');}});
  for(const command of ['receipt','work','public-replay','counter']) {
    const c={command:'suggestion-cleanup-'+command,cleanup:{}};
    await code(execute(runtime,'private-token',c,{},null),'SUGGESTION_UNAVAILABLE');
    await code(execute(runtime,'private-token',c,{},config(env({retirement}))),'SUGGESTION_UNAVAILABLE');
    await code(execute(runtime,'private-token',{...c,retirement}, {},{mutationsEnabled:true,retirement}),'INVALID_COMMAND');
  }
  await code(execute(runtime,'private-token',{command:'suggestion-cleanup-all'}, {},{}),'INVALID_COMMAND');
});
test('cleanup dispatch refuses runtime project or mode mismatch before database composition',async()=>{
  const runtime={config:{mode:'emulator',projectId:'demo-other'},get db(){assert.fail('Mismatch must not touch database');}};
  const c={command:'suggestion-cleanup-preview',preview:{target:'counter'}};
  await code(execute(runtime,'token',c,{catalogue:{mode:'emulator',projectId:'demo-current'}},{retirement}),'UNSAFE_CONFIGURATION');
});
