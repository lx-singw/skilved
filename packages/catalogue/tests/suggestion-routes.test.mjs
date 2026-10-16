import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { projectOpportunity } from '@skilved/types/opportunities/internal';
import { makeRecord } from '../../types/tests/fixtures/opportunities.mjs';
import { getRuntime } from '../src/runtime.mjs';

test('actual suggestion routes persist private access and current results across restart with intake off', { timeout: 180000 }, async () => {
  assert.match(process.env.FIRESTORE_EMULATOR_HOST ?? '', /^127\.0\.0\.1:[1-9]\d{3,4}$/);
  assert.match(process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '', /^127\.0\.0\.1:[1-9]\d{3,4}$/);
  assert.equal(process.env.GCLOUD_PROJECT,'demo-skilved-b03');
  const project = 'demo-skilved-suggestion-web';
  process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT=project;process.env.SKILVED_CATALOGUE_READS='true';
  const runtime = await getRuntime(), db=runtime.db;
  const now=new Date().toISOString(), sourceUrl='https://source.example/synthetic-notice';
  const source={ id:'synthetic_source',revision:1,name:'Synthetic publisher',urls:[sourceUrl],
    permission:{ reference:'Synthetic fixture only; no real permission',method:'structured_json',reuse:'Test only',reviewedAt:now },
    categories:['bursary','learnership','apprenticeship','internship','graduate_programme','job'],owner:'synthetic_operator',paused:false,cadenceHours:24,maxBytes:500000 };
  const policy={intakeEnabled:true,maxWork:100,maxReceipts:500,createAttemptsPerHour:50,statusReadsPerHour:600,receiptTtlMs:86400000};
  const json = value => ({json:JSON.stringify(value)}), random=()=>randomBytes(32).toString('hex');
  const read=async path=>JSON.parse((await db.doc(path).get()).data().json);
  let child,base;
  const stop=async()=>{
    if(!child||child.exitCode!==null)return;
    const exited=once(child,'exit');child.kill('SIGTERM');const timer=setTimeout(()=>child.kill('SIGKILL'),5000);timer.unref();await exited;clearTimeout(timer);
  };
  const start=async intakeEnabled=>{
    const reservation=createServer().listen(0,'127.0.0.1');await once(reservation,'listening');const port=reservation.address().port;
    await new Promise(resolve=>reservation.close(resolve));base=`http://127.0.0.1:${port}`;
    const webRoot=new URL('../../../apps/web/',import.meta.url),require=createRequire(new URL('package.json',webRoot));
    const manifest={origin:base,keyRing:{activeKeyId:'synthetic',keys:[{id:'synthetic',secret:'a1'.repeat(32)}]},policy:{...policy,intakeEnabled}};
    child=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'dev','--hostname','127.0.0.1','--port',String(port)],{
      cwd:fileURLToPath(webRoot),env:{...process.env,NODE_ENV:'development',NEXT_TELEMETRY_DISABLED:'1',
        SKILVED_SUGGESTIONS_ENABLED:'true',SKILVED_SUGGESTIONS_CONFIG:JSON.stringify(manifest)},stdio:['ignore','pipe','pipe']});
    // Never emit child logs or read/copy the user's .env.local.
    child.stdout.resume();child.stderr.resume();
    let ready=false;
    for(let n=0;n<180;n++){
      try{ready=(await fetch(base+'/api/health',{signal:AbortSignal.timeout(1000)})).ok;}catch{}
      if(ready)break;if(child.exitCode!==null)throw new Error('Owned Next fixture server exited');
      await new Promise(resolve=>setTimeout(resolve,150));
    }
    assert.equal(ready,true);
  };
  const root='/api/v1/opportunity-suggestions';
  const post=(key,input={url:sourceUrl},headers={})=>fetch(base+root,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key,Origin:base,...headers},body:JSON.stringify(input),signal:AbortSignal.timeout(30000)});
  const status=(access,token=access.capability)=>fetch(`${base}${root}/${access.receiptId}/status`,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(30000)});
  const safe=async response=>{
    assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('referrer-policy'),'no-referrer');
    assert.equal(response.headers.has('set-cookie'),false);assert.equal(response.headers.has('access-control-allow-origin'),false);
    return response.json();
  };
  try{
    await db.doc('m0_sources/'+source.id).set(json(source));
    await db.doc('m0_suggestion_state/admission').set(json({schemaVersion:1,revision:1,workCount:0,receiptCount:0}));
    await start(true);
    const key=random();let response=await post(key);assert.equal(response.status,202);const first=await safe(response);
    assert.equal(first.kind,'received');assert.match(first.access.capability,/^[a-f0-9]{64}$/);
    response=await post(key);assert.equal(response.status,202);assert.deepEqual(await safe(response),first);
    response=await post(random());assert.equal(response.status,202);const second=await safe(response);
    assert.notEqual(second.access.receiptId,first.access.receiptId);assert.notEqual(second.access.capability,first.access.capability);
    const work=(await db.collection('m0_suggestion_work').get()).docs;assert.equal(work.length,1);assert.equal(JSON.parse(work[0].data().json).receiptCount,2);
    response=await status(first.access);assert.equal(response.status,200);const receipt=await safe(response);
    assert.equal(receipt.receiptId,first.access.receiptId);assert.equal(receipt.status,'received');assert.doesNotMatch(JSON.stringify(receipt),/capability|sourceUrl|workId|nonce/);
    for(const access of [first.access,{...first.access,receiptId:random()}]){response=await status(access,second.access.capability);assert.equal(response.status,404);assert.deepEqual(await safe(response),{error:{code:'NOT_FOUND'}});}
    await db.doc('m0_sources/'+source.id).set(json({...source,paused:true}));
    response=await post(random());assert.equal(response.status,503);assert.deepEqual(await safe(response),{error:{code:'SOURCE_PAUSED'}});
    response=await post(key);assert.equal(response.status,202);assert.deepEqual(await safe(response),first);
    await db.doc('m0_sources/'+source.id).set(json(source));
    const ids=['synthetic_job','synthetic_graduate'];
    for(const id of ids){
      const record=makeRecord(id==='synthetic_job'?'job':'internship','graduate');record.id=id;record.citations[0].url=sourceUrl;
      await db.doc('m0_drafts/'+id).set(json(record));await db.doc('m0_public/'+id).set(json(projectOpportunity(record)));
    }
    await db.doc('m0_snapshots/snapshot_fixture_1').set(json({id:'snapshot_fixture_1',sourceId:source.id,sourceRevision:1,url:sourceUrl,retrievedAt:now,hash:'b'.repeat(64),text:'Synthetic source only'}));
    const publicKey=random();response=await post(publicKey);assert.equal(response.status,200);assert.deepEqual(await safe(response),{kind:'approved',publicResultIds:ids.sort()});
    for(const id of ids)await db.doc('m0_public/'+id).delete();
    response=await post(publicKey);assert.equal(response.status,200);assert.deepEqual(await safe(response),{kind:'previous_result_unavailable'});
    response=await fetch(`${base}${root}/${first.access.receiptId}`,{method:'DELETE',headers:{Authorization:`Bearer ${first.access.capability}`}});
    assert.equal(response.status,503);assert.deepEqual(await safe(response),{error:{code:'SERVICE_UNAVAILABLE'}});
    assert.equal((await status(first.access)).status,200);
    for(const [body,headers,expected] of [[{url:sourceUrl,phone:'PRIVATE'}, {},400],[{url:sourceUrl+'?token=PRIVATE'},{},400],
      [{url:sourceUrl},{Cookie:'session=PRIVATE'},400],[{url:sourceUrl},{Origin:'https://evil.example'},403]]){
      response=await post(random(),body,headers);assert.equal(response.status,expected);assert.doesNotMatch(JSON.stringify(await safe(response)),/PRIVATE|evil\.example/);
    }
    response=await fetch(base+root,{method:'OPTIONS'});assert.equal(response.status,404);await safe(response);
    assert.equal((await read('m0_suggestion_state/admission')).receiptCount,2);
    const raw=JSON.stringify((await db.collection('m0_suggestion_receipts').get()).docs.map(d=>d.data()));
    assert.ok(!raw.includes(first.access.capability));assert.ok(!raw.includes(key));assert.ok(!raw.includes(sourceUrl));
    await stop();await start(false);
    response=await post(key);assert.equal(response.status,503);await safe(response);
    response=await status(first.access);assert.equal(response.status,200);assert.deepEqual(await safe(response),receipt);
    assert.equal((await read('m0_suggestion_state/admission')).receiptCount,2);
  }finally{await stop();await db.terminate();}
});
