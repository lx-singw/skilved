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
import { SuggestionReceipts } from '../src/suggestion-receipts.mjs';
import { SuggestionAdmission } from '../src/suggestion-admission.mjs';
import { SuggestionReview } from '../src/suggestion-review.mjs';
import { SuggestionReplayTickets } from "../src/suggestion-replay-tickets.mjs";
import { Catalogue } from '../src/store.mjs';

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
  const ticketSettings={epoch:"c1".repeat(32),secret:"b1".repeat(32),notBefore:new Date(Date.now()-3600000).toISOString(),ttlMs:86400000};
  const recoveryEpoch='f1'.repeat(32);
  const json = value => ({json:JSON.stringify(value)}), random=()=>randomBytes(32).toString('hex');
  const read=async path=>JSON.parse((await db.doc(path).get()).data().json);
  let child,base;
  const stop=async()=>{
    if(!child||child.exitCode!==null)return;
    const exited=once(child,'exit');child.kill('SIGTERM');const timer=setTimeout(()=>child.kill('SIGKILL'),5000);timer.unref();await exited;clearTimeout(timer);
  };
  const start=async (intakeEnabled,epoch=ticketSettings.epoch)=>{
    const reservation=createServer().listen(0,'127.0.0.1');await once(reservation,'listening');const port=reservation.address().port;
    await new Promise(resolve=>reservation.close(resolve));base=`http://127.0.0.1:${port}`;
    const webRoot=new URL('../../../apps/web/',import.meta.url),require=createRequire(new URL('package.json',webRoot));
    const manifest={origin:base,recoveryEpoch,replayTickets:{...ticketSettings,epoch},keyRing:{activeKeyId:'synthetic',keys:[{id:'synthetic',secret:'a1'.repeat(32)}]},policy:{...policy,intakeEnabled}};
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
  const issue=()=>fetch(base+root+"/tickets",{method:"POST",headers:{"Content-Type":"application/json",Origin:base},body:JSON.stringify({url:sourceUrl}),signal:AbortSignal.timeout(30000)});
  const ticket=async()=>{const response=await issue();assert.equal(response.status,200);const value=await safe(response);assert.equal(Number(value.ticket.split(".")[3]),Date.parse(value.expiresAt));return value.ticket;};
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
    let response=await post(random());assert.equal(response.status,400);await safe(response);
    const key=await ticket();const tampered=key.slice(0,-1)+(key.endsWith("0")?"1":"0");response=await post(tampered);assert.equal(response.status,404);await safe(response);
    const expired=new SuggestionReplayTickets({...ticketSettings,recoveryEpoch,ttlMs:1,now:()=>new Date(Date.now()-1000).toISOString()}).issue({url:sourceUrl}).ticket;
    response=await post(expired);assert.equal(response.status,404);await safe(response);
    response=await post(key);assert.equal(response.status,202);const first=await safe(response);
    assert.equal(first.kind,'received');assert.match(first.access.capability,/^[a-f0-9]{64}$/);
    response=await post(key);assert.equal(response.status,202);assert.deepEqual(await safe(response),first);
    const secondKey=await ticket();response=await post(secondKey);assert.equal(response.status,202);const second=await safe(response);
    assert.notEqual(second.access.receiptId,first.access.receiptId);assert.notEqual(second.access.capability,first.access.capability);
    const work=(await db.collection('m0_suggestion_work').get()).docs;assert.equal(work.length,1);assert.equal(JSON.parse(work[0].data().json).receiptCount,2);
    response=await status(first.access);assert.equal(response.status,200);const receipt=await safe(response);
    assert.equal(receipt.receiptId,first.access.receiptId);assert.equal(receipt.status,'received');assert.doesNotMatch(JSON.stringify(receipt),/capability|sourceUrl|workId|nonce/);
    for(const access of [first.access,{...first.access,receiptId:random()}]){response=await status(access,second.access.capability);assert.equal(response.status,404);assert.deepEqual(await safe(response),{error:{code:'NOT_FOUND'}});}
    const pausedTicket=await ticket();
    await db.doc('m0_sources/'+source.id).set(json({...source,paused:true}));
    response=await issue();assert.equal(response.status,503);assert.deepEqual(await safe(response),{error:{code:'SOURCE_PAUSED'}});
    response=await post(pausedTicket);assert.equal(response.status,503);assert.deepEqual(await safe(response),{error:{code:'SOURCE_PAUSED'}});
    response=await post(key);assert.equal(response.status,202);assert.deepEqual(await safe(response),first);
    await db.doc('m0_sources/'+source.id).set(json(source));
    const ids=['synthetic_job','synthetic_graduate'];
    for(const id of ids){
      const record=makeRecord(id==='synthetic_job'?'job':'internship','graduate');record.id=id;record.citations[0].url=sourceUrl;
      await db.doc('m0_drafts/'+id).set(json(record));await db.doc('m0_public/'+id).set(json(projectOpportunity(record)));
    }
    await db.doc('m0_snapshots/snapshot_fixture_1').set(json({id:'snapshot_fixture_1',sourceId:source.id,sourceRevision:1,url:sourceUrl,retrievedAt:now,hash:'b'.repeat(64),text:'Synthetic source only'}));
    const publicKey=await ticket();response=await post(publicKey);assert.equal(response.status,200);assert.deepEqual(await safe(response),{kind:'approved',publicResultIds:ids.sort()});
    // Authenticated operator class writes decisions; the app exposes only capability-authorized status.
    await db.doc('m0_operators/synthetic_operator').set({active:true,roles:['source']});
    const receiptStore=new SuggestionReceipts(db,{keyRing:{activeKeyId:'synthetic',keys:[{id:'synthetic',secret:'a1'.repeat(32)}]},recoveryEpoch,maxTtlMs:86400000,now:()=>new Date().toISOString()});
    const reviewTickets=new SuggestionReplayTickets({...ticketSettings,recoveryEpoch,now:()=>new Date().toISOString()});
    const review=new SuggestionReview(new SuggestionAdmission(db,receiptStore,policy,{replayTickets:reviewTickets}),new Catalogue(db,{verifyIdToken:async()=>({uid:'synthetic_operator'})}));
    const currentWork=JSON.parse((await work[0].ref.get()).data().json);
    await review.decide('synthetic-token',{workId:currentWork.id,expectedRevision:currentWork.revision,outcome:'resolved_to_listing',publicResultIds:ids});
    response=await status(first.access);assert.equal(response.status,200);assert.deepEqual((await safe(response)).publicResultIds,ids);
    for(const id of ids)await db.doc('m0_public/'+id).delete();
    response=await post(publicKey);assert.equal(response.status,200);assert.deepEqual(await safe(response),{kind:'previous_result_unavailable'});
    response=await status(first.access);assert.equal(response.status,200);const latestReceipt=await safe(response);
    assert.equal(latestReceipt.status,'unresolved');assert.deepEqual(latestReceipt.publicResultIds,[]);
    response=await status(second.access);assert.equal(response.status,200);const secondReceipt=await safe(response);
    const secondBefore=await read('m0_suggestion_receipts/'+second.access.receiptId);
    const remove=access=>fetch(`${base}${root}/${access.receiptId}`,{method:'DELETE',headers:{Authorization:`Bearer ${access.capability}`},signal:AbortSignal.timeout(30000)});
    // Explicit synthetic expiry fixture; restore it only inside this test before the real withdrawal check.
    const firstRef=db.doc('m0_suggestion_receipts/'+first.access.receiptId),firstBefore=await read(firstRef.path);
    const shortExpiry=new Date(Date.now()+150).toISOString();assert.ok(shortExpiry>firstBefore.updatedAt);
    await firstRef.set(json({...firstBefore,expiresAt:shortExpiry}));await new Promise(resolve=>setTimeout(resolve,200));
    response=await remove(first.access);assert.equal(response.status,404);await safe(response);await firstRef.set(json(firstBefore));
    response=await remove({...first.access,capability:second.access.capability});assert.equal(response.status,404);await safe(response);
    response=await fetch(`${base}${root}/${first.access.receiptId}`,{method:'DELETE',headers:{Authorization:`Bearer ${first.access.capability}`}});
    assert.equal(response.status,200);assert.deepEqual(await safe(response),{schemaVersion:1,receiptId:first.access.receiptId,status:'withdrawn'});
    response=await remove(first.access);assert.equal(response.status,404);await safe(response);
    assert.equal((await status(first.access)).status,404);response=await post(key);assert.equal(response.status,404);await safe(response);
    assert.deepEqual(await read('m0_suggestion_receipts/'+second.access.receiptId),secondBefore);
    for(const [body,headers,expected] of [[{url:sourceUrl,phone:'PRIVATE'}, {},400],[{url:sourceUrl+'?token=PRIVATE'},{},400],
      [{url:sourceUrl},{Cookie:'session=PRIVATE'},400],[{url:sourceUrl},{Origin:'https://evil.example'},403]]){
      response=await post(key,body,headers);assert.equal(response.status,expected);assert.doesNotMatch(JSON.stringify(await safe(response)),/PRIVATE|evil\.example/);
    }
    response=await fetch(base+root,{method:'OPTIONS'});assert.equal(response.status,404);await safe(response);
    assert.equal((await read('m0_suggestion_state/admission')).receiptCount,2);
    const raw=JSON.stringify((await db.collection('m0_suggestion_receipts').get()).docs.map(d=>d.data()));
    assert.ok(!raw.includes(first.access.capability));assert.ok(!raw.includes(key));assert.ok(!raw.includes(sourceUrl));
    // Prove this replay was still authorized immediately before retiring its epoch.
    response=await post(secondKey);assert.equal(response.status,202);assert.deepEqual(await safe(response),second);
    await stop();await start(true,"d1".repeat(32));
    response=await post(secondKey);assert.equal(response.status,404);await safe(response);
    response=await status(second.access);assert.equal(response.status,200);assert.deepEqual(await safe(response),secondReceipt);
    assert.equal((await ticket()).split(".")[1],"d1".repeat(32));
    await stop();await start(false,"d1".repeat(32));
    response=await issue();assert.equal(response.status,503);await safe(response);
    response=await post(key);assert.equal(response.status,503);await safe(response);
    response=await status(second.access);assert.equal(response.status,200);assert.deepEqual(await safe(response),secondReceipt);
    await db.doc('m0_sources/'+source.id).set(json({...source,paused:true}));
    response=await remove(second.access);assert.equal(response.status,200);assert.deepEqual(await safe(response),{schemaVersion:1,receiptId:second.access.receiptId,status:'withdrawn'});
    assert.equal((await status(second.access)).status,404);const cancelled=await read(work[0].ref.path);
    assert.equal(cancelled.state,'cancelled');assert.equal(cancelled.referenceCount,0);assert.equal(cancelled.lease,null);
    assert.equal((await read('m0_suggestion_state/admission')).receiptCount,2);
  }finally{await stop();await db.terminate();}
});
