import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleSuggestion } from '../src/suggestion-http.mjs';
const origin = 'https://app.example', base = '/api/v1/opportunity-suggestions';
const id = 'a'.repeat(64), capability = 'b'.repeat(64);
const at = '2026-10-16T12:00:00.000Z', expiresAt = '2026-10-17T12:00:00.000Z';
const key = ['s1','e'.repeat(64),Date.parse(at),Date.parse(expiresAt),'c'.repeat(64),'d'.repeat(64)].join('.');
const config = { enabled: true, intakeEnabled: true, origin, readDeadlineMs: 100, serviceDeadlineMs: 100 };
const received = { kind: 'received', access: { receiptId: id, capability, expiresAt } };
const state = { schemaVersion: 1, receiptId: id, status: 'received', revision: 1, createdAt: at, updatedAt: at, expiresAt, publicResultIds: [] };
const withdrawn = { schemaVersion: 1, receiptId: id, status: 'withdrawn' };
function request(method = 'POST', path = base, headers = {}, body = JSON.stringify({ url: 'https://source.example/notice' }), signal) {
  return new Request(origin + path,{ method, headers: method === 'POST' ? { 'Content-Type': 'application/json', 'Idempotency-Key': key, ...headers } : { Authorization: `Bearer ${capability}`, ...headers },
    ...(method === 'POST' ? { body, ...(body instanceof ReadableStream ? { duplex: 'half' } : {}) } : {}), ...(signal ? { signal } : {}) });
}
function fixture(overrides = {}, ...settingsArgs) {
  const settings = settingsArgs.length ? settingsArgs[0] : config;
  const calls = [];let providers = 0;
  const service = { create: async (...args) => { calls.push(['create',...args]);return received; }, status: async input => { calls.push(['status',input]);return state; },
    issueTicket: async input => { calls.push(['issue',input]); return { ticket: key, expiresAt }; },
    withdraw: async input => { calls.push(['withdraw',input]);return withdrawn; }, ...overrides };
  return { calls, get providers() { return providers; }, run: req => handleSuggestion(req,{ config: settings, provider: async () => { providers++;return service; } }) };
}
async function safe(response) {
  assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.equal(response.headers.get('Referrer-Policy'),'no-referrer');
  assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow');
  for (const name of ['Set-Cookie','Location','Access-Control-Allow-Origin','Access-Control-Allow-Credentials'])assert.equal(response.headers.has(name),false);
  return response.json();
}
const issueRequest = (headers = {}, payload = JSON.stringify({ url: 'https://source.example/notice' }), path = base+'/tickets') =>
  new Request(origin+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:payload,
    ...(payload instanceof ReadableStream ? {duplex:'half'} : {})});

test('ticket issuance is URL-only, private and unavailable with intake off', async () => {
  const f = fixture(), response = await f.run(issueRequest()); assert.equal(response.status,200);
  assert.deepEqual(await safe(response),{ticket:key,expiresAt}); assert.deepEqual(f.calls,[['issue',{url:'https://source.example/notice'}]]);
  const off = fixture({}, {...config,intakeEnabled:false});
  assert.equal((await off.run(issueRequest())).status,503); assert.equal(off.providers,0);
});

test('ticket issuance rejects credentials, unsafe placement, origins and personal fields before provider', async () => {
  const f=fixture();
  for(const [headers,payload,path,status] of [[{'Idempotency-Key':key},undefined,undefined,400],
    [{Authorization:`Bearer ${capability}`},undefined,undefined,400],[{Cookie:'PRIVATE'},undefined,undefined,400],
    [{Origin:'https://evil.example'},undefined,undefined,403],[{},undefined,base+'/tickets?ticket=PRIVATE',400],
    [{},JSON.stringify({url:'https://source.example/notice',ticket:key}),undefined,400],
    [{},JSON.stringify({url:'https://source.example/notice',email:'PRIVATE'}),undefined,400]]) {
    const r=await f.run(issueRequest(headers,payload,path));assert.equal(r.status,status);assert.doesNotMatch(JSON.stringify(await safe(r)),/PRIVATE|evil/);
  }
  assert.equal(f.providers,0);
  assert.equal((await f.run(request('POST',base,{'Idempotency-Key':'c'.repeat(64)}))).status,400);
});

test('issuance validates coherent output and retains bounded body/backend deadlines', async () => {
  for(const output of [{ticket:key,expiresAt,url:'PRIVATE'},{ticket:key,expiresAt:at},received,null])
    assert.equal((await fixture({issueTicket:async()=>output}).run(issueRequest())).status,503);
  const f=fixture({}, {...config,readDeadlineMs:15});
  const stalled=new ReadableStream({cancel(){return new Promise(()=>{});}});
  assert.equal((await f.run(issueRequest({},stalled))).status,408);assert.equal(f.providers,0);
  const late=fixture({issueTicket:async()=>new Promise(()=>{})},{...config,serviceDeadlineMs:15});
  assert.equal((await late.run(issueRequest())).status,503);
  const denied=fixture({issueTicket:async()=>{throw Object.assign(new Error('PRIVATE'),{code:'SUGGESTION_RATE_LIMITED'});}});
  const response=await denied.run(issueRequest());assert.equal(response.status,429);assert.doesNotMatch(JSON.stringify(await safe(response)),/PRIVATE/);
});

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

test('unknown methods/paths never dispatch or acknowledge work', async () => {
  const f = fixture();
  for (const [method,path,expected] of [['PUT',base,404],['OPTIONS',base,404],['HEAD',base,404],['GET',base,404],
    ['POST',base+'/',404],['GET',`${base}/invalid/status`,404],['DELETE',`${base}/invalid`,404]])
    assert.equal((await f.run(request(method,path))).status,expected);
  assert.equal(f.providers,0);
});

test('withdrawal uses only ID/header capability with intake off and validates minimal matching output', async () => {
  const f=fixture({}, {...config,intakeEnabled:false}),response=await f.run(request('DELETE',`${base}/${id}`));
  assert.equal(response.status,200);assert.deepEqual(await safe(response),withdrawn);assert.deepEqual(f.calls,[['withdraw',{receiptId:id,capability}]]);
  for(const result of [{...withdrawn,capability},{...withdrawn,receiptId:'d'.repeat(64)},{...withdrawn,url:'PRIVATE'},state,null])
    assert.equal((await fixture({withdraw:async()=>result}).run(request('DELETE',`${base}/${id}`))).status,503);
  for(const [code,status] of [['SUGGESTION_NOT_FOUND',404],['SUGGESTION_RATE_LIMITED',429],['PRIVATE',503]]) {
    const r=await fixture({withdraw:async()=>{throw Object.assign(new Error('PRIVATE'),{code});}}).run(request('DELETE',`${base}/${id}`));
    assert.equal(r.status,status);assert.doesNotMatch(JSON.stringify(await safe(r)),/PRIVATE/);
  }
});

test('withdrawal body/query/cookie/origin/replay credentials reject before provider', async () => {
  const f=fixture();
  for(const [path,headers,expected] of [[`${base}/${id}?capability=PRIVATE`,{},400],[`${base}/${id}#PRIVATE`,{},400],
    [`${base}/${id}`,{Cookie:'PRIVATE'},400],[`${base}/${id}`,{Origin:'https://evil.example'},403],
    [`${base}/${id}`,{'Sec-Fetch-Site':'cross-site'},403],[`${base}/${id}`,{'Idempotency-Key':key},404],
    [`${base}/${id}`,{Authorization:'Basic PRIVATE'},404],[`${base}/${id}`,{'Content-Length':'1'},400]]) {
    const r=await f.run(request('DELETE',path,headers));assert.equal(r.status,expected);assert.doesNotMatch(JSON.stringify(await safe(r)),/PRIVATE|evil/);
  }
  const r=await f.run(new Request(origin+`${base}/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${capability}`},body:'PRIVATE'}));
  assert.equal(r.status,400);assert.equal(f.providers,0);
});

test('withdrawal timeout may commit later; retry can return not-found without proving physical deletion', async () => {
  let finish,revoked=false;const pending=new Promise(resolve=>{finish=()=>{revoked=true;resolve(withdrawn);};});
  const f=fixture({withdraw:async()=>{if(revoked)throw Object.assign(new Error(),{code:'SUGGESTION_NOT_FOUND'});return pending;}},{...config,serviceDeadlineMs:15});
  const r=await f.run(request('DELETE',`${base}/${id}`));assert.equal(r.status,503);assert.equal(revoked,false);await safe(r);
  finish();await pending;assert.equal(revoked,true);const retry=await f.run(request('DELETE',`${base}/${id}`));assert.equal(retry.status,404);await safe(retry);
});

test('Next-style empty DELETE streams are accepted only after bounded zero-byte completion', async () => {
  const f=fixture({}, {...config,readDeadlineMs:15});
  const streamed=stream=>new Request(origin+`${base}/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${capability}`,'Content-Length':'0'},body:stream,duplex:'half'});
  const empty=new ReadableStream({start(controller){controller.close();}});
  let r=await f.run(streamed(empty));assert.equal(r.status,200);assert.deepEqual(await safe(r),withdrawn);assert.equal(f.providers,1);
  const hidden=new ReadableStream({start(controller){controller.enqueue(new Uint8Array([1]));controller.close();}});
  r=await f.run(streamed(hidden));assert.equal(r.status,400);assert.equal(f.providers,1);
  const stalled=new ReadableStream({cancel(){return new Promise(()=>{});}});
  r=await f.run(streamed(stalled));assert.equal(r.status,408);assert.equal(f.providers,1);await safe(r);
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
