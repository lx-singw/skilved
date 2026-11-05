import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Catalogue} from '../src/store.mjs';
const at='2026-11-05T04:00:00.000Z';
function fixture(roleExpiries){const c=new Catalogue(null,null,()=>at);return{c,tx:{get:async()=>({data:()=>({active:true,roles:['source','reviewer'],roleExpiries})})}};}
test('temporary Source access expires at the exact boundary without expiring reviewer access',async()=>{
 const {c,tx}=fixture({source:at});c.ref=()=>null;
 await assert.rejects(c.operator(tx,'operator','source'),{code:'FORBIDDEN'});
 await assert.doesNotReject(c.operator(tx,'operator','reviewer'));
});
test('future grants work and malformed or expired role deadlines fail closed',async()=>{
 for(const expiry of ['2026-11-05T04:00:00.001Z',undefined]){const {c,tx}=fixture(expiry===undefined?undefined:{source:expiry});c.ref=()=>null;await assert.doesNotReject(c.operator(tx,'operator','source'));}
 for(const expiry of [null,'not-a-time','2026-11-05T03:59:59.999Z']){const {c,tx}=fixture({source:expiry});c.ref=()=>null;await assert.rejects(c.operator(tx,'operator','source'),{code:'FORBIDDEN'});}
});
