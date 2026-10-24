import assert from 'node:assert/strict'
import {test} from 'node:test'
import {readFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url),ts=require('typescript')
async function load(path,overrides={}){const out={},compiled=ts.transpileModule(await readFile(new URL('../src/'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}});new Function('require','exports',compiled.outputText)(id=>overrides[id]??require(id),out);return out}
const core=await load('lib/public-export.ts'),actions=await load('lib/public-export-actions.ts',{'./public-export':core})
test('pagehide aborts pending public read; pageshow creates an idle controller without replay; final unmount disposes it',async()=>{
  const before=Object.fromEntries(['window','navigator'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)])),events=new EventTarget(),hooks=[],ref={current:null},views=[];let resolve,reads=0,signal,nativeCalls=0
  const gate=new Promise(r=>{resolve=r}),payload={kind:'link',text:'Public reference',canonicalUrl:'https://skilved.example/opportunities/public_job',filename:'skilved-public_job.txt'},fakeReact={useState:initial=>[initial,value=>views.push(value)],useEffect:fn=>hooks.push(fn),useRef:()=>ref}
  try{Object.defineProperty(globalThis,'window',{configurable:true,value:events});Object.defineProperty(globalThis,'navigator',{configurable:true,value:{}})
    const {PublicChecklistExport}=await load('components/catalogue/PublicChecklistExport.tsx',{'react':fakeReact,'@/lib/public-export':{createPublicExportPreparer:()=>async(_id,sig)=>{reads++;signal=sig;return reads===1?gate:{kind:'prepared',payload}}},'@/lib/public-export-actions':actions,'@/lib/public-export-share':{sharePublicText:async()=>assert.fail()},'@/lib/public-export-whatsapp':{composePublicWhatsApp:()=>{nativeCalls++;return {kind:'requested',content:'text'}}}})
    const wrapper=PublicChecklistExport({id:'public_job',origin:'https://skilved.example'});wrapper.type(wrapper.props);const cleanup=hooks[0](),first=ref.current,running=first.run('whatsapp');assert.equal(reads,1);events.dispatchEvent(new Event('pagehide'));assert.equal(signal.aborted,true);assert.equal(ref.current,null);resolve({kind:'prepared',payload});await running;assert.equal(nativeCalls,0);assert.equal(views.at(-1).kind,'idle')
    events.dispatchEvent(new Event('pageshow'));assert.ok(ref.current);assert.notEqual(ref.current,first);assert.equal(reads,1);const restored=ref.current;await restored.run('preview');assert.equal(reads,2);assert.equal(views.at(-1).kind,'ready');cleanup();assert.equal(ref.current,null);await restored.run('whatsapp');assert.equal(reads,2);events.dispatchEvent(new Event('pageshow'));assert.equal(ref.current,null)
  }finally{for(const key of ['window','navigator']){if(before[key])Object.defineProperty(globalThis,key,before[key]);else delete globalThis[key]}}
})
