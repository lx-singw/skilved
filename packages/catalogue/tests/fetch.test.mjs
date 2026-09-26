import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {retrieve} from '../src/fetch.mjs';
const source={paused:false,urls:['https://source.example/a','https://source.example/b'],maxBytes:100};
function transport({responses=[{status:200,body:'{}'}],address='8.8.8.8',socketAddress=address}={}) {
  let calls=0;
  const io={ lookup:async()=>[{address,family:4}], request:(url,options,callback)=>{
    assert.equal(options.servername,url.hostname);assert.equal(options.rejectUnauthorized,true);assert.equal(options.agent,false);
    options.lookup(url.hostname,{},(err,pinned)=>{assert.equal(err,null);assert.equal(pinned,address);});
    const req=new EventEmitter();let killed=false;
    req.destroy=error=>{killed=true;queueMicrotask(()=>req.emit('error',error));};
    req.end=()=>queueMicrotask(()=>{
      const socket=new EventEmitter();socket.remoteAddress=socketAddress;req.emit('socket',socket);socket.emit('secureConnect');if(killed)return;
      const current=responses[calls++]??responses.at(-1),res=new EventEmitter();res.statusCode=current.status;
      res.headers={'content-type':'application/json',...current.headers};res.destroy=()=>{};callback(res);
      res.emit('data',Buffer.from(current.body??''));res.emit('end');
    });return req;
  }};return {io,calls:()=>calls};
}
test('transport pins a public address with hostname TLS verification',async()=>{
  const t=transport();assert.equal((await retrieve(source,source.urls[0],t.io)).text,'{}');assert.equal(t.calls(),1);
});
test('mixed DNS answers and changed socket address rejected',async()=>{
  const t=transport();t.io.lookup=async()=>[{address:'8.8.8.8',family:4},{address:'127.0.0.1',family:4}];
  await assert.rejects(retrieve(source,source.urls[0],t.io),/UNSAFE_ADDRESS/);assert.equal(t.calls(),0);
  await assert.rejects(retrieve(source,source.urls[0],transport({socketAddress:'10.0.0.1'}).io),/UNSAFE_ADDRESS/);
  await assert.rejects(retrieve(source,source.urls[0],transport({socketAddress:'1.1.1.1'}).io),/UNSAFE_ADDRESS/);
});
test('every redirect is revalidated and repeated redirects are bounded',async()=>{
  await assert.rejects(retrieve(source,source.urls[0],transport({responses:[{status:302,headers:{location:'https://internal.example/'}}]}).io),/UNSAFE_URL/);
  const good=transport({responses:[{status:302,headers:{location:'/b'}},{status:200,body:'{}'}]});
  assert.equal((await retrieve(source,source.urls[0],good.io)).url,source.urls[1]);
  await assert.rejects(retrieve(source,source.urls[0],transport({responses:[{status:302,headers:{location:'/a'}}]}).io),/TOO_MANY_REDIRECTS/);
});
test('oversized, compressed, wrong-MIME and blocked-status responses rejected',async()=>{
  for(const response of [{status:200,body:'a'.repeat(101)},{status:200,headers:{'content-encoding':'gzip'}},{status:200,headers:{'content-type':'text/html'}},{status:403},{status:200,headers:{'content-length':'101'}}])
    await assert.rejects(retrieve(source,source.urls[0],transport({responses:[response]}).io));
  await assert.rejects(retrieve({...source,paused:true},source.urls[0],transport().io),/SOURCE_PAUSED/);
});
