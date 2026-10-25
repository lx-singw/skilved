import { test } from 'node:test';
import assert from 'node:assert/strict';
import { geminiAuthorityConfiguration, assertGeminiQuotaAuthority, assertGeminiRequestAuthority,
  withGeminiQuotaAuthority } from '../src/ai/gemini-authority.mjs';
import { GEMINI_AUTHORITY_ROUTES } from '../src/ai/gemini-authority-routes.mjs';
import { generateStructured } from '../src/ai/gemini.mjs';
import { spawnSync } from 'node:child_process';
import { geminiQuotaScope } from '../src/ai/gemini-quota.mjs';
import { RecentJobsWorker } from '../src/recentjobs-worker.mjs';

const at = '2026-10-25T14:00:00.000Z', epoch = 'a'.repeat(64);
const env = { SKILVED_CATALOGUE_MODE: 'cloud', SKILVED_CATALOGUE_PROJECT: 'skilved-staging',
  SKILVED_GEMINI_PROJECT_ID: 'synthetic-provider', SKILVED_GEMINI_AUTHORITY_PROJECT: 'skilved-staging',
  SKILVED_GEMINI_AUTHORITY_EPOCH: epoch };
const db = { projectId: 'skilved-staging', collection: name => ({ doc: id => ({ name, id }) }) };
const binding = geminiAuthorityConfiguration(db, env);
const record = () => ({ version: 1, provider: 'gemini', scopeHash: geminiQuotaScope(env),
  projectId: db.projectId, epoch, status: 'active', migrationSha256: 'b'.repeat(64),
  quotaSha256: 'c'.repeat(64), activatedAt: '2026-10-25T13:00:00.000Z' });
const tx = data => ({ get: async ref => {
  assert.deepEqual(ref, { name: 'm0_model_authorities', id: binding.scopeHash });
  return { exists: data !== undefined, data: () => data };
} });
const payload = data => ({ json: JSON.stringify(data) });

test('authority uses the provider scope, and requires a binding to the worker database', () => {
  assert.equal(binding.scopeHash, geminiQuotaScope(env));
  assert.notEqual(binding.scopeHash, geminiQuotaScope({SKILVED_GEMINI_PROJECT_ID:db.projectId}));
  assert.ok(Object.isFrozen(binding));
  for (const change of [{SKILVED_GEMINI_AUTHORITY_PROJECT:undefined}, {SKILVED_GEMINI_AUTHORITY_PROJECT:'other-project'},
    {SKILVED_GEMINI_AUTHORITY_EPOCH:undefined}, {SKILVED_GEMINI_AUTHORITY_EPOCH:'a'},
    {SKILVED_GEMINI_PROJECT_ID:undefined}, {SKILVED_CATALOGUE_MODE:'disabled'},
    {SKILVED_CATALOGUE_PROJECT:'other-project'}])
    assert.throws(() => geminiAuthorityConfiguration(db, {...env,...change}), {code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
});

test('only explicit, correctly targeted demo emulators can omit authority', () => {
  const emulator = { SKILVED_CATALOGUE_MODE:'emulator', SKILVED_CATALOGUE_PROJECT:'demo-authority',
    FIRESTORE_EMULATOR_HOST:'127.0.0.1:18080', FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:19099' };
  assert.equal(geminiAuthorityConfiguration({projectId:'demo-authority'},emulator),null);
  assert.throws(() => geminiAuthorityConfiguration({projectId:'demo-other'},emulator), {code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
  assert.throws(() => geminiAuthorityConfiguration({projectId:'demo-authority'},{...emulator,NODE_ENV:'production'}), {code:'UNSAFE_CONFIGURATION'});
  assert.throws(() => geminiAuthorityConfiguration({projectId:'skilved-staging'},{}), {code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
  assert.throws(() => geminiAuthorityConfiguration({projectId:'demo-authority'},{...emulator,
    SKILVED_GEMINI_AUTHORITY_PROJECT:'skilved-staging', SKILVED_GEMINI_AUTHORITY_EPOCH:epoch}), {code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
});

test('active authority is read by provider scope inside the caller transaction', async () => {
  assert.equal(await assertGeminiQuotaAuthority(tx(payload(record())),db,binding,at),undefined);
  await assertGeminiQuotaAuthority({get:()=>assert.fail('isolated emulator must not read cloud authority')},db,null,at);
});

test('absent, corrupt, incomplete and future authority fail closed', async () => {
  for (const data of [undefined, {}, {json:'{'}, {json:'null'}, {json:'[]'}, {...payload(record()),extra:true},
    ...[{version:2}, {provider:'groq'}, {quotaSha256:'missing'}, {migrationSha256:undefined},
      {activatedAt:'2026-10-26T13:00:00.000Z'}, {status:'pending'}, {extra:true}].map(change=>payload({...record(),...change}))])
    await assert.rejects(assertGeminiQuotaAuthority(tx(data),db,binding,at), {code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
});

test('wrong scope, database, epoch and revoked authority reject stale callers', async () => {
  for (const change of [{scopeHash:'d'.repeat(64)}, {projectId:'other-project'}, {epoch:'e'.repeat(64)}, {status:'revoked'}])
    await assert.rejects(assertGeminiQuotaAuthority(tx(payload({...record(),...change})),db,binding,at), {code:'GEMINI_QUOTA_AUTHORITY_STALE'});
});

test('cloud worker checks authority before grants, effects or any transaction writes', async () => {
  const database = {...db, runTransaction: work => work(tx(undefined))};
  // The suite runs under emulators. This fake cloud client must explicitly
  // remove those inherited endpoints, as a real cloud launcher requires.
  const cloudEnv = {...env, FIRESTORE_EMULATOR_HOST:undefined, FIREBASE_AUTH_EMULATOR_HOST:undefined,
    FIREBASE_STORAGE_EMULATOR_HOST:undefined, PUBSUB_EMULATOR_HOST:undefined};
  const worker = new RecentJobsWorker(database,'synthetic@example.test',{provider:'gemini',env:cloudEnv,now:()=>at,
    fetcher:()=>assert.fail('source effect'), extractor:()=>assert.fail('provider effect')});
  await assert.rejects(worker.run('synthetic_source'), {code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
  await assert.rejects(worker.holdModelForDay('synthetic_source','gemini-3.8-flash'), {code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
});

const routedEnv = {...env, SKILVED_GEMINI_PROJECT_ID:'skilved-dev',
  SKILVED_GEMINI_AUTHORITY_EPOCH:GEMINI_AUTHORITY_ROUTES[0].epoch};
test('registered provider scope cannot return to an emulator, another database or an old epoch', () => {
  assert.equal(geminiQuotaScope(routedEnv),GEMINI_AUTHORITY_ROUTES[0].scopeHash);
  const database={...db,databaseId:'(default)'};
  assert.equal(geminiAuthorityConfiguration(database,routedEnv).epoch,GEMINI_AUTHORITY_ROUTES[0].epoch);
  for(const [database,settings] of [[{...db,databaseId:'other'},routedEnv],
    [{...db,databaseId:'(default)'},{...routedEnv,SKILVED_GEMINI_AUTHORITY_EPOCH:'f'.repeat(64)}],
    [{projectId:'demo-retired',databaseId:'(default)'},{SKILVED_CATALOGUE_MODE:'emulator',
      SKILVED_CATALOGUE_PROJECT:'demo-retired',FIRESTORE_EMULATOR_HOST:'127.0.0.1:18080',
      FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:19099',SKILVED_GEMINI_PROJECT_ID:'skilved-dev'}]])
    assert.throws(()=>geminiAuthorityConfiguration(database,settings),{code:'GEMINI_QUOTA_AUTHORITY_STALE'});
});

test('direct registered-scope extraction and a hand-written runAttempt cannot send requests', async () => {
  const settings={...routedEnv,SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_transport_key_12345'};
  let calls=0;
  for(const runAttempt of [undefined,(_attempt,send)=>send()])
    await assert.rejects(generateStructured({}, {instruction:'Synthetic',schema:{type:'object'},version:'test'},
      {env:settings,runAttempt,fetchImpl:()=>{calls++;assert.fail('unadmitted request');}}),{code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
  assert.equal(calls,0);
});

test('native transport without worker admission fails before the captured fetch is called', () => {
  // Import after installing a fake native transport in a separate process.
  // This exercises the real default-transport branch without network access.
  const source=`let calls=0;globalThis.fetch=async()=>{calls++;throw Error('FETCH_CALLED')};
    const {generateStructured}=await import(${JSON.stringify(new URL('../src/ai/gemini.mjs',import.meta.url).href)});
    try{await generateStructured({}, {instruction:'test',schema:{type:'object'},version:'test'},
      {env:{SKILVED_AI_MODE:'gemini',GEMINI_API_KEY:'synthetic_native_key_12345',SKILVED_AI_FALLBACK:'false'}});
      process.exitCode=2;}catch(error){if(error.code!=='GEMINI_QUOTA_AUTHORITY_REQUIRED'||calls!==0)process.exitCode=3;}`;
  const result=spawnSync(process.execPath,['--input-type=module','-e',source],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.equal(result.stdout,'');
});

test('admission context is isolated across concurrent scopes and removed after errors', async () => {
  const a={...binding}, b={...binding,scopeHash:geminiQuotaScope({SKILVED_GEMINI_PROJECT_ID:'another-synthetic'})};
  await Promise.all([[a,env],[b,{SKILVED_GEMINI_PROJECT_ID:'another-synthetic'}]].map(async([binding,settings])=>{
    await withGeminiQuotaAuthority(binding,async()=>{
      await new Promise(resolve=>setImmediate(resolve));
      assert.doesNotThrow(()=>assertGeminiRequestAuthority(settings,true));
      assert.throws(()=>assertGeminiRequestAuthority(settings===env?{SKILVED_GEMINI_PROJECT_ID:'another-synthetic'}:env,true),
        {code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
    });
  }));
  assert.throws(()=>assertGeminiRequestAuthority(env,true),{code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
  await assert.rejects(withGeminiQuotaAuthority(a,async()=>{throw Error('synthetic');}),/synthetic/);
  assert.throws(()=>assertGeminiRequestAuthority(env,true),{code:'GEMINI_QUOTA_AUTHORITY_REQUIRED'});
});
