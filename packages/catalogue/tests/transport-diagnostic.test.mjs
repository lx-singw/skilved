import {test} from 'node:test';
import assert from 'node:assert/strict';
import {transportCodeOf} from '../src/ai/transport-diagnostic.mjs';

test('transport diagnostics retain only fixed codes through Node fetch causes',()=>{
  for(const code of ['EAI_AGAIN','ENOTFOUND','ECONNRESET','UND_ERR_CONNECT_TIMEOUT','ERR_TLS_CERT_ALTNAME_INVALID']){
    const error=new TypeError('PRIVATE_REQUEST_SECRET',{cause:Object.assign(new Error('PRIVATE_ADDRESS'),{code})});
    assert.equal(transportCodeOf(error),code);
  }
  for(const error of [null,undefined,12,'EAI_AGAIN',new Error('EAI_AGAIN'),{code:'PRIVATE_API_KEY'},{transportCode:'PRIVATE_API_KEY'}])
    assert.equal(transportCodeOf(error),null);
});

test('transport diagnostics inspect AggregateError children without retaining messages',()=>{
  const error=new TypeError('PRIVATE_HEADER',{cause:new AggregateError([
    Object.assign(new Error('PRIVATE_HOST'),{code:'UNRECOGNIZED_PRIVATE_VALUE'}),
    Object.assign(new Error('PRIVATE_URL'),{code:'ENETUNREACH'}),
  ],'PRIVATE_STACK')});
  assert.equal(transportCodeOf(error),'ENETUNREACH');
  assert.equal(transportCodeOf({transportCode:'EAI_AGAIN'}),'EAI_AGAIN');
});

test('transport diagnostics terminate on cycles and limit deep or wide cause graphs',()=>{
  const a={code:'PRIVATE_VALUE'},b={cause:a};a.cause=b;
  assert.equal(transportCodeOf(a),null);
  let deep={code:'EAI_AGAIN'};for(let i=0;i<8;i++)deep={cause:deep};
  assert.equal(transportCodeOf(deep),null);
  assert.equal(transportCodeOf(deep.cause),'EAI_AGAIN');
  const wide=new AggregateError([...Array.from({length:8},()=>({})),{code:'EAI_AGAIN'}]);
  assert.equal(transportCodeOf(wide),null);
});

test('transport diagnostics do not invoke accessors, inherit codes or throw on hostile objects',()=>{
  let getters=0;const input={cause:{code:'ECONNREFUSED'}};
  for(const key of ['code','transportCode','errors'])Object.defineProperty(input,key,{get(){getters++;throw Error('PRIVATE_GETTER');}});
  assert.equal(transportCodeOf(input),'ECONNREFUSED');assert.equal(getters,0);
  assert.equal(transportCodeOf(Object.create({code:'EAI_AGAIN'})),null);
  assert.equal(transportCodeOf(new Proxy({},{getOwnPropertyDescriptor(){throw Error('PRIVATE_PROXY');}})),null);
});
