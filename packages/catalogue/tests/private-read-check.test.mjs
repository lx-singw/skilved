import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {getRuntime} from '../src/runtime.mjs';
import {Catalogue} from '../src/store.mjs';
import {verifyPrivateCatalogueReads} from '../src/private-read-check.mjs';
import {makeRecord} from '../../types/tests/fixtures/opportunities.mjs';
import {projectOpportunity} from '@skilved/types/opportunities/internal';

let runtime,record,readRuntime;
before(async()=>{
  process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-private-reads';
  runtime=await getRuntime();
  record=makeRecord();record.id='private_read_fixture';record.lifecycle='review';record.publication.approved=false;
  record.private.reviewerNotes='PRIVATE_DRAFT_SENTINEL';
  await runtime.db.doc('m0_drafts/'+record.id).set({json:JSON.stringify(record)});
  readRuntime={config:{reads:true,reports:false},catalogue:new Catalogue(runtime.db,null)};
});
after(async()=>{await runtime?.db.terminate();});

test('private feed acceptance checks the real HTTP boundary without writing reports or modifying drafts',async()=>{
  const before=(await runtime.db.doc('m0_drafts/'+record.id).get()).data();
  const report=await verifyPrivateCatalogueReads(readRuntime,[record.id]);
  assert.equal(report.publicItems,0);assert.equal(report.privateDetailsChecked,1);
  assert.equal(report.privateDetailStatus,404);assert.equal(report.reportsDisabled,true);assert.equal(report.noStore,true);
  assert.doesNotMatch(JSON.stringify(report),/PRIVATE_DRAFT_SENTINEL|private_read_fixture/);
  assert.deepEqual((await runtime.db.doc('m0_drafts/'+record.id).get()).data(),before);
  assert.equal((await runtime.db.collection('m0_reports').get()).size,0);
  assert.equal((await runtime.db.collection('m0_report_limits').get()).size,0);
});

test('an unexpected public projection fails the private-stage acceptance check',async()=>{
  const published=makeRecord();published.id='unexpected_public_fixture';
  const projection=projectOpportunity(published);assert.equal(projection.kind,'opportunity');
  const ref=runtime.db.doc('m0_public/'+published.id);await ref.set({json:JSON.stringify(projection)});
  try{await assert.rejects(verifyPrivateCatalogueReads(readRuntime,[record.id]),{code:'PRIVATE_READ_CHECK_FAILED'});}
  finally{await ref.delete();}
});

test('misconfiguration, unbounded identities and unavailable reads fail without exposing dependency errors',async()=>{
  for(const ids of [[],[record.id,record.id],Array.from({length:21},(_,i)=>'private_'+i),['../invalid']])
    await assert.rejects(verifyPrivateCatalogueReads(readRuntime,ids),{code:'PRIVATE_READ_CHECK_FAILED'});
  for(const config of [{reads:false,reports:false},{reads:'true',reports:false},{reads:true,reports:true},{}])
    await assert.rejects(verifyPrivateCatalogueReads({...readRuntime,config},[record.id]),{code:'PRIVATE_READ_CHECK_FAILED'});
  const failing={config:{reads:true,reports:false},catalogue:{list:async()=>{throw Error('PRIVATE_DATABASE_FAILURE');}}};
  await assert.rejects(verifyPrivateCatalogueReads(failing,[record.id]),error=>{
    assert.equal(error.code,'PRIVATE_READ_CHECK_FAILED');assert.doesNotMatch(error.stack,/PRIVATE_DATABASE_FAILURE/);return true;
  });
});

test('staging read CLI refuses emulator configuration before credentials or SDK startup',()=>{
  const child=spawnSync(process.execPath,['tools/check-staging-reads.mjs'],{cwd:new URL('../',import.meta.url),
    env:{...process.env,NODE_ENV:'production'},encoding:'utf8'});
  assert.equal(child.status,1);assert.equal(child.stdout,'');
  assert.deepEqual(JSON.parse(child.stderr),{error:'STAGING_READ_CHECK_FAILED'});
});
