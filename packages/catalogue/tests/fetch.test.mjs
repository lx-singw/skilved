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

test('HTML and robots formats are explicit and retain exact redirect and MIME guards', async () => {
  const html = transport({ responses: [{ status: 200, headers: { 'content-type': 'text/html; charset=utf-8' }, body: '<p>Notice</p>' }] });
  assert.equal((await retrieve(source, source.urls[0], html.io, 'html')).text, '<p>Notice</p>');
  const robots = transport({ responses: [{ status: 200, headers: { 'content-type': 'text/plain' }, body: 'User-agent: *\nAllow: /' }] });
  assert.match((await retrieve(source, source.urls[0], robots.io, 'text')).text, /Allow/);
  await assert.rejects(retrieve(source, source.urls[0], transport().io, 'html'), /UNSUPPORTED_RESPONSE/);
  await assert.rejects(retrieve(source, source.urls[0], transport().io, 'zip'), /UNSUPPORTED_FORMAT/);
});

test('PDF transport preserves binary bytes and the existing MIME, size, redirect and TLS guards',async()=>{
 const body=Buffer.from([0x25,0x50,0x44,0x46,0x2d,0x31,0x2e,0x37,0x0a,0xff,0xfe,0x00]);
 const response={status:200,headers:{'content-type':'application/pdf'},body},t=transport({responses:[response]});
 const r=await retrieve(source,source.urls[0],t.io,'pdf');assert.deepEqual(r.data,body);assert.equal(r.text,undefined);
 for(const options of [{responses:[{...response,body:Buffer.alloc(101)}]},{responses:[{...response,headers:{'content-type':'text/html'}}]},
  {responses:[{...response,status:403}]},{responses:[{...response,headers:{'content-type':'application/pdf','content-encoding':'gzip'}}]},
  {socketAddress:'10.0.0.1',responses:[response]},{responses:[{status:302,headers:{location:'https://other.example/a'}}]}])
  await assert.rejects(retrieve(source,source.urls[0],transport(options).io,'pdf'));
});
test('explicit RSS reads accept XML media types without accepting browser challenges or weakening transport bounds',async()=>{
 for(const mime of ['application/rss+xml; charset=UTF-8','application/xml','text/xml']){
  const t=transport({responses:[{status:200,headers:{'content-type':mime},body:'<rss version="2.0"/>'}]});
  assert.equal((await retrieve(source,source.urls[0],t.io,'rss')).text,'<rss version="2.0"/>');
 }
 for(const options of [{responses:[{status:200,headers:{'content-type':'text/html'},body:'<title>One moment...</title>'}]},
  {responses:[{status:200,headers:{'content-type':'application/rss+xml','content-encoding':'gzip'}}]},
  {responses:[{status:200,headers:{'content-type':'application/rss+xml'},body:'x'.repeat(101)}]},
  {responses:[{status:302,headers:{location:'https://unapproved.example/feed/'}}]},
  {socketAddress:'127.0.0.1',responses:[{status:200,headers:{'content-type':'application/rss+xml'}}]}])
  await assert.rejects(retrieve(source,source.urls[0],transport(options).io,'rss'));
});
