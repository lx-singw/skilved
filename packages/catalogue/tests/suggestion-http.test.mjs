import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleSuggestion } from '../src/suggestion-http.mjs';
const origin = 'https://app.example', base = '/api/v1/opportunity-suggestions';
const id = 'a'.repeat(64), capability = 'b'.repeat(64), key = 'c'.repeat(64);
const at = '2026-10-16T12:00:00.000Z', expiresAt = '2026-10-17T12:00:00.000Z';
const config = { enabled: true, intakeEnabled: true, origin, readDeadlineMs: 100, serviceDeadlineMs: 100 };
const received = { kind: 'received', access: { receiptId: id, capability, expiresAt } };
const state = { schemaVersion: 1, receiptId: id, status: 'received', revision: 1, createdAt: at, updatedAt: at, expiresAt, publicResultIds: [] };
function request(method = 'POST', path = base, headers = {}, body = JSON.stringify({ url: 'https://source.example/notice' }), signal) {
  return new Request(origin + path,{ method, headers: method === 'POST' ? { 'Content-Type': 'application/json', 'Idempotency-Key': key, ...headers } : { Authorization: `Bearer ${capability}`, ...headers },
    ...(method === 'POST' ? { body, ...(body instanceof ReadableStream ? { duplex: 'half' } : {}) } : {}), ...(signal ? { signal } : {}) });
}
function fixture(overrides = {}, ...settingsArgs) {
  const settings = settingsArgs.length ? settingsArgs[0] : config;
  const calls = [];let providers = 0;
  const service = { create: async (...args) => { calls.push(['create',...args]);return received; }, status: async input => { calls.push(['status',input]);return state; }, ...overrides };
  return { calls, get providers() { return providers; }, run: req => handleSuggestion(req,{ config: settings, provider: async () => { providers++;return service; } }) };
}
async function safe(response) {
  assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.equal(response.headers.get('Referrer-Policy'),'no-referrer');
  assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow');
  for (const name of ['Set-Cookie','Location','Access-Control-Allow-Origin','Access-Control-Allow-Credentials'])assert.equal(response.headers.has(name),false);
  return response.json();
}

test('disabled, malformed and missing configuration never initialize runtime', async () => {
  for (const settings of [undefined, {}, { ...config, enabled: false }, { ...config, enabled: 'true' }, { ...config, origin: 'http://app.example' }, { ...config, readDeadlineMs: 6000 }, { ...config, extra: 'PRIVATE' }]) {
    const f = fixture({},settings), response = await f.run(request());assert.equal(response.status,503);assert.equal(f.providers,0);await safe(response);
  }
  assert.equal((await handleSuggestion(request())).status,503);
});

test('valid create dispatches only URL plus header replay key and validates private/public outcomes', async () => {
  const f = fixture();const response = await f.run(request());assert.equal(response.status,202);assert.deepEqual(await safe(response),received);
  assert.deepEqual(f.calls,[['create',{ url: 'https://source.example/notice' },key]]);
  for (const result of [{ kind: 'approved', publicResultIds: ['current_listing'] },{ kind: 'previous_result_unavailable' }]) {
    const next = fixture({ create: async () => result }), r = await next.run(request());assert.equal(r.status,200);assert.deepEqual(await safe(r),result);
  }
});

test('status remains available with intake off and accepts only receipt ID plus header capability', async () => {
  const f = fixture({}, { ...config, intakeEnabled: false });assert.equal((await f.run(request())).status,503);assert.equal(f.providers,0);
  const response = await f.run(request('GET',`${base}/${id}/status`));assert.equal(response.status,200);assert.deepEqual(await safe(response),state);
  assert.deepEqual(f.calls,[['status',{ receiptId: id, capability }]]);
});

test('unknown methods/paths and unimplemented withdrawal never dispatch or acknowledge work', async () => {
  const f = fixture({ withdraw: () => assert.fail('No withdrawal exists') });
  for (const [method,path,expected] of [['PUT',base,404],['OPTIONS',base,404],['HEAD',base,404],['GET',base,404],
    ['POST',base+'/',404],['GET',`${base}/invalid/status`,404],['DELETE',`${base}/${id}`,503]])
    assert.equal((await f.run(request(method,path))).status,expected);
  assert.equal(f.providers,0);
});

test('cookies, URL credentials/query/hash, cross-origin/site, encoding and wrong media type reject before dispatch', async () => {
  const f = fixture();
  for (const [path,headers,expected] of [[base+'?token=PRIVATE',{},400],[base+'#PRIVATE',{},400],
    [base,{ Cookie: 'session=PRIVATE' },400],[base,{ Origin: 'https://evil.example' },403],
    [base,{ 'Sec-Fetch-Site': 'cross-site' },403],[base,{ 'Content-Encoding': 'gzip' },400],
    [base,{ 'Content-Type': 'text/plain' },415],[base,{ Authorization: `Bearer ${capability}` },400]]) {
    const response = await f.run(request('POST',path,headers));assert.equal(response.status,expected);assert.doesNotMatch(JSON.stringify(await safe(response)),/PRIVATE|evil\.example/);
  }
  const otherOrigin = new Request('https://evil.example'+base,{ method:'POST' });assert.equal((await f.run(otherOrigin)).status,403);
  assert.equal(f.providers,0);
});

test('missing/invalid/merged credentials never enumerate receipts or reach service', async () => {
  const f = fixture();
  for (const token of ['',`Bearer ${capability}, Bearer ${capability}`,'Basic PRIVATE',`Bearer ${capability.toUpperCase()}`,`Bearer ${capability.slice(1)}`])
    assert.equal((await f.run(request('GET',`${base}/${id}/status`,{ Authorization: token }))).status,404);
  for (const replay of ['',key+', '+key,'PRIVATE',key.toUpperCase()])assert.equal((await f.run(request('POST',base,{ 'Idempotency-Key': replay }))).status,400);
  assert.equal((await f.run(request('GET',`${base}/${id}/status`,{ 'Idempotency-Key': key }))).status,404);
  assert.equal(f.providers,0);
});

test('header, announced body, actual body, length mismatch, JSON/UTF8 and personal fields are bounded/rejected', async () => {
  const f = fixture();
  for (const [headers,body,expected] of [[{ 'X-Extra':'x'.repeat(8192) },'{}',431],[{ 'Content-Length':'4097' },'{}',413],
    [{},'x'.repeat(4097),413],[{ 'Content-Length':'3' },'{}',400],[{ 'Content-Length':'-1' },'{}',400],
    [{},'PRIVATE_BAD_JSON',400],[{},new Uint8Array([255,254]),400],[{},JSON.stringify({ url:'https://source.example/a',email:'PRIVATE' }),400],
    [{},JSON.stringify({ url:'https://source.example/a?token=PRIVATE' }),400]]) {
    const response = await f.run(request('POST',base,headers,body));assert.equal(response.status,expected);assert.doesNotMatch(JSON.stringify(await safe(response)),/PRIVATE/);
  }
  const headers = Object.fromEntries(Array.from({length:33},(_,i) => [`x-test-${i}`,'a']));
  assert.equal((await f.run(request('POST',base,headers))).status,431);assert.equal(f.providers,0);
});

test('stalled body times out and abort cancels reading without waiting on an untrusted cancel promise', async () => {
  let cancelled = 0;
  const stream = () => new ReadableStream({ cancel() { cancelled++;return new Promise(() => {}); } });
  const f = fixture({}, { ...config, readDeadlineMs: 15 });
  let response = await f.run(request('POST',base,{},stream()));assert.equal(response.status,408);await safe(response);
  const controller = new AbortController();const pending = f.run(request('POST',base,{},stream(),controller.signal));controller.abort();
  response = await pending;assert.equal(response.status,408);assert.equal(cancelled,2);assert.equal(f.providers,0);
});

test('backend deadline returns unavailable without claiming that an in-flight create was cancelled', async () => {
  let finish, committed = false;
  const pending = new Promise(resolve => { finish = () => { committed = true;resolve(received); }; });
  const f = fixture({ create: async () => pending },{ ...config, serviceDeadlineMs: 15 });
  const response = await f.run(request());assert.equal(response.status,503);assert.equal(committed,false);await safe(response);
  finish();await pending;assert.equal(committed,true);assert.equal(f.providers,1);
});

test('known service failures map to stable codes and arbitrary errors/invalid projections never leak', async () => {
  for (const [code,status] of [['SUGGESTION_NOT_FOUND',404],['SUGGESTION_CONFLICT',409],['SUGGESTION_RATE_LIMITED',429],
    ['SUGGESTION_UNSUPPORTED',422],['SUGGESTION_PAUSED',503],['SUGGESTION_SOURCE_CHANGED',503],['SUGGESTION_CAPACITY',503],['INVALID_COMMAND',400],
    ['PRIVATE_SDK_ERROR',503],['constructor',503],['toString',503]]) {
    const f = fixture({ create: async () => { throw Object.assign(new Error('PRIVATE_URL_TOKEN_KEY'),{ code }); } });
    const response = await f.run(request());assert.equal(response.status,status);assert.doesNotMatch(JSON.stringify(await safe(response)),/PRIVATE/);
  }
  for (const result of [{ ...received, notes:'PRIVATE' },{ kind:'approved',publicResultIds:[] },null])
    assert.equal((await fixture({ create:async () => result }).run(request())).status,503);
  for (const result of [{ ...state, receiptId:'d'.repeat(64) },{ ...state, capability }])
    assert.equal((await fixture({ status:async () => result }).run(request('GET',`${base}/${id}/status`))).status,503);
});

test('Next-normalized loopback URLs require explicit emulator mode, same port and exact browser Origin', async () => {
  const settings = { ...config, emulator: true, origin: 'http://127.0.0.1:3010' };
  const make = (url = 'http://localhost:3010', browserOrigin = settings.origin) => new Request(url + base,{method:'POST',
    headers:{'Content-Type':'application/json','Idempotency-Key':key,Origin:browserOrigin},body:JSON.stringify({url:'https://source.example/notice'})});
  const provider = async () => ({create:async () => received});
  assert.equal((await handleSuggestion(make(),{config:settings,provider})).status,202);
  assert.equal((await handleSuggestion(make(undefined,'http://localhost:3010'),{config:settings,provider})).status,403);
  assert.equal((await handleSuggestion(make('http://localhost:3011'),{config:settings,provider})).status,403);
  assert.equal((await handleSuggestion(make(),{config:{...settings,emulator:false},provider})).status,503);
});
