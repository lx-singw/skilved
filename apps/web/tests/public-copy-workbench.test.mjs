import assert from "node:assert/strict"
import {createRequire} from "node:module"
import {test} from "node:test"
import {loadUi} from "./helpers/load-ui.mjs"
const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server")
const {PublicCopyPreview}=loadUi("components/catalogue/PublicCopyPreview.tsx")
const {createPublicExportActions,copyPublicText}=loadUi("lib/public-export-actions.ts")
const payload={kind:"checklist",text:"Public rôle — café\nANY of A OR B\n<script>source wording</script>",filename:"skilved-public_job-r2.txt",canonicalUrl:"https://skilved.example/opportunities/public_job"}
const render=(value=payload,busy=false)=>renderToStaticMarkup(React.createElement(PublicCopyPreview,{payload:value,busy,onHide:()=>{}}))

test("the document preview retains complete Unicode text and alternatives without interpreting source markup",()=>{
 const html=render()
 assert.match(html,/Dated public copy/)
 assert.match(html,/ANY of A OR B/)
 assert.match(html,/&lt;script&gt;source wording&lt;\/script&gt;/)
 assert.doesNotMatch(html,/<script>/)
 assert.match(html,/readonly=""/i)
 assert.match(html,/aria-describedby="public-copy-return-note"/)
 assert.match(html,/skilved-public_job-r2.txt/)
 assert.ok(html.includes(new TextEncoder().encode(payload.text).length+" B"))
})

test("reference-only output has its own heading and retains no facts from a prior public document",()=>{
 const html=render({kind:"link",text:"Only a current public reference is available.",filename:"skilved-public_job.txt",canonicalUrl:payload.canonicalUrl})
 assert.match(html,/Reference only/)
 assert.match(html,/Keep a way back/)
 assert.match(html,/Current checklist details and the application destination could not be included/)
 assert.doesNotMatch(html,/ANY of A OR B|Public rôle|r2.txt|Dated public copy/)
})

test("the return link is exactly the canonical reference and opens separately without referrer data",()=>{
 const html=render()
 assert.match(html,/href="https:\/\/skilved.example\/opportunities\/public_job" target="_blank" rel="noopener noreferrer"/)
 assert.match(html,/file cannot update itself/)
 assert.doesNotMatch(html,/from=|userStage|receipt|reviewedTicks/)
})

test("manual selection focuses and selects the whole public text, while hiding delegates to the existing session",()=>{
 let focuses=0,selections=0,hides=0
 const {PublicCopyPreview:Preview}=loadUi("components/catalogue/PublicCopyPreview.tsx",{"react":{...React,useRef:()=>({current:{focus:()=>focuses++,select:()=>selections++}})}})
 const tree=Preview({payload,busy:false,onHide:()=>hides++})
 const walk=node=>[node,...[].concat(node?.props?.children??[]).flatMap(child=>child&&typeof child==="object"?walk(child):[])]
 const buttons=walk(tree).filter(node=>node?.type==="button")
 const select=buttons.find(node=>[].concat(node.props.children).includes("Select preview text")),hide=buttons.find(node=>[].concat(node.props.children).includes("Hide public preview"))
 select.props.onClick();hide.props.onClick()
 assert.equal(focuses,1);assert.equal(selections,1);assert.equal(hides,1)
 assert.match(render(payload,true),/disabled=""/)
})

test("clipboard timeout retains the fresh selectable preview and releases the action for a new intent",async()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,"navigator"),views=[]
 try{
  Object.defineProperty(globalThis,"navigator",{configurable:true,value:{clipboard:{writeText:()=>new Promise(()=>{})}}})
  const session=createPublicExportActions("public_job",async()=>({kind:"prepared",payload}),v=>views.push(v),{copy:text=>copyPublicText(text,5),download:()=>assert.fail()})
  await session.run("copy")
  assert.equal(views.at(-1).kind,"ready")
  assert.equal(views.at(-1).payload,payload)
  assert.match(views.at(-1).message,/Select the preview text/)
  assert.doesNotMatch(views.at(-1).message,/Public text copied|PUBLIC_COPY_UNCONFIRMED/)
  await session.run("preview")
  assert.equal(views.at(-1).kind,"ready")
  session.hide();assert.equal(views.at(-1).kind,"idle")
 }finally{if(descriptor)Object.defineProperty(globalThis,"navigator",descriptor);else delete globalThis.navigator}
})

test("initial controls lead with the preview while sharing and copy limits remain in native disclosures",()=>{
 const {PublicChecklistExport}=loadUi("components/catalogue/PublicChecklistExport.tsx")
 const html=renderToStaticMarkup(React.createElement(PublicChecklistExport,{id:"public_job",origin:"https://skilved.example"}))
 assert.match(html,/Read what goes with the copy/)
 assert.match(html,/public-copy-primary/)
 assert.match(html,/Share in another app/)
 assert.match(html,/What this copy includes/)
 assert.equal((html.match(/disabled=""/g)??[]).length,5)
 assert.doesNotMatch(html,/textarea|public_job-r2|PRIVATE_|<details[^>]+open=/)
})

test("a fresh read that becomes reference-only replaces the old visible document before copy is attempted",async()=>{
 let current=payload
 const views=[],copied=[]
 const session=createPublicExportActions("public_job",async()=>({kind:"prepared",payload:current}),v=>views.push(v),{copy:async text=>copied.push(text),download:()=>{}})
 await session.run("preview")
 current={kind:"link",text:"Only public reference",filename:"skilved-public_job.txt",canonicalUrl:payload.canonicalUrl}
 const copying=session.run("copy")
 assert.equal(views.at(-1).payload,undefined)
 await copying
 assert.deepEqual(copied,["Only public reference"])
 assert.equal(views.at(-1).payload.kind,"link")
 assert.doesNotMatch(render(views.at(-1).payload),/Public rôle|ANY of/)
})

test("a reference-only session labels the panel contents as a reference rather than a full checklist",()=>{
 let state=0
 const reference={kind:"link",text:"Only a public reference",filename:"skilved-public_job.txt",canonicalUrl:payload.canonicalUrl}
 const {PublicChecklistExport}=loadUi("components/catalogue/PublicChecklistExport.tsx",{"react":{...React,useEffect:()=>{},useRef:()=>({current:null}),useState:initial=>[state++===0?{kind:"ready",message:"Only a public reference is available.",payload:reference}:initial,()=>{}]}})
 const wrapper=PublicChecklistExport({id:"public_job",origin:"https://skilved.example"})
 const html=renderToStaticMarkup(wrapper.type(wrapper.props))
 assert.match(html,/Public reference only/)
 assert.match(html,/Reference only/)
 assert.doesNotMatch(html,/Connected instructions|Source references|Public rôle/)
})