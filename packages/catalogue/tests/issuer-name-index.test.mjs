import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Catalogue} from '../src/store.mjs';
import {getRuntime} from '../src/runtime.mjs';
import {EmployerRelationship} from '../src/schemas.mjs';
import {relationshipDocument,legacyRelationshipKeys,relationshipBinding,issuerNameKey,readRelationship} from '../src/issuer-registry.mjs';
import {corporateAnchor} from '../src/origin-discovery.mjs';
let db;
before(async()=>{process.env.SKILVED_CATALOGUE_MODE='emulator';process.env.SKILVED_CATALOGUE_PROJECT='demo-skilved-name-index';db=(await getRuntime()).db;});
after(async()=>db?.terminate());
async function fixture(){
 const uid=`operator_${randomUUID()}`,issuer=`Authored Index Forge ${randomUUID()}`,now='2026-10-29T10:00:00.000Z';
 const c=new Catalogue(db,{verifyIdToken:async token=>{if(token!=='authored-token')throw Error();return{uid};}},()=>now);
 await c.ref('operators',uid).set({active:true,roles:['source','reviewer']});
 const r=EmployerRelationship.parse({id:`anchor_${randomUUID()}`,revision:1,state:'qualified',categories:['apprenticeship'],reviewedAt:now,expiresAt:'2026-11-01T10:00:00.000Z',
  delegationPage:'https://corporate.example/careers/',route:{name:issuer,aliases:[`${issuer} Brand`],host:'corporate.example',pathPrefix:'/careers/',evidence:'Authored authority only'}});
 const raw={json:JSON.stringify(r),routeKeys:legacyRelationshipKeys(r)};await c.ref('employer_relationships',r.id).set(raw);
 const lookup=(name=issuer)=>db.runTransaction(tx=>corporateAnchor(tx,db,{issuer:name,host:null},now));
 return{c,r,raw,uid,issuer,lookup};
}
test('bounded index backfill preserves exact authority JSON, bindings, versions, grants and spent budgets',async()=>{
 const f=await fixture(),binding=relationshipBinding(f.r);assert.equal(await f.lookup(),null);
 const sentinels=['source_versions','employer_relationship_versions','workers','model_calls','model_budgets'];
 for(const name of sentinels)await f.c.ref(name,f.r.id).set({json:JSON.stringify({sentinel:name,calls:7})});
 const before=await Promise.all(sentinels.map(name=>f.c.ref(name,f.r.id).get()));
 const first=await f.c.reindexEmployerRelationships('authored-token',[binding],'Backfill derived corporate name metadata');assert.equal(first.updated,1);
 const stored=await f.c.ref('employer_relationships',f.r.id).get();assert.equal(stored.data().json,f.raw.json);assert.ok(stored.data().routeKeys.includes(issuerNameKey(f.issuer)));
 assert.deepEqual(relationshipBinding(readRelationship(stored)),binding);assert.equal((await f.lookup()).id,f.r.id);assert.equal((await f.lookup(`${f.issuer} Brand`)).id,f.r.id);
 const again=await f.c.reindexEmployerRelationships('authored-token',[binding],'Repeat derived metadata backfill');assert.equal(again.updated,0);assert.equal(again.unchanged,1);
 for(let i=0;i<sentinels.length;i++)assert.deepEqual((await f.c.ref(sentinels[i],f.r.id).get()).data(),before[i].data());
 const audits=(await db.collection('m0_audit').get()).docs.map(s=>JSON.parse(s.data().json)).filter(a=>a.actor===f.uid);
 assert.equal(audits.length,2);assert.ok(audits.every(a=>a.action==='employer_relationship.reindex'));
});
test('reindex requires current source authority, exact fingerprints and an atomic bounded unique batch',async()=>{
 const f=await fixture(),binding=relationshipBinding(f.r);
 await f.c.ref('operators',f.uid).set({active:true,roles:['reviewer']});
 await assert.rejects(f.c.reindexEmployerRelationships('authored-token',[binding],'Forbidden metadata update'),{code:'FORBIDDEN'});
 await f.c.ref('operators',f.uid).set({active:true,roles:['source']});
 await assert.rejects(f.c.reindexEmployerRelationships('bad-token',[binding],'Invalid identity update'),{code:'UNAUTHORIZED'});
 for(const input of [[],[binding,binding],Array.from({length:31},(_,i)=>({...binding,id:`entry_${i}`})),[{...binding,extra:true}]])await assert.rejects(f.c.reindexEmployerRelationships('authored-token',input,'Invalid metadata batch'));
 const second={...f.r,id:`second_${randomUUID()}`};await f.c.ref('employer_relationships',second.id).set({json:JSON.stringify(second),routeKeys:legacyRelationshipKeys(second)});
 await assert.rejects(f.c.reindexEmployerRelationships('authored-token',[binding,{...relationshipBinding(second),revision:2}],'Atomic stale batch'),{code:'CONFLICT'});
 assert.deepEqual((await f.c.ref('employer_relationships',f.r.id).get()).data(),f.raw);
 assert.deepEqual((await f.c.ref('employer_relationships',second.id).get()).data().routeKeys,legacyRelationshipKeys(second));
 assert.equal(await f.lookup(),null);
});
test('name lookup excludes revoked, expired and future authority and fails closed at bounded capacity',async()=>{
 const f=await fixture();
 for(const change of [{state:'revoked'},{reviewedAt:'2026-10-20T10:00:00.000Z',expiresAt:'2026-10-21T10:00:00.000Z'},{reviewedAt:'2026-10-30T10:00:00.000Z'}]){
  const r={...f.r,...change};await f.c.ref('employer_relationships',r.id).set(relationshipDocument(r));assert.equal(await f.lookup(),null);
 }
 for(let i=0;i<31;i++){const r={...f.r,id:`capacity_${randomUUID()}`};await f.c.ref('employer_relationships',r.id).set(relationshipDocument(r));}
 await assert.rejects(f.lookup(),{code:'ISSUER_REGISTRY_CAPACITY'});
});
