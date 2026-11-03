import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import { loadUi } from "./helpers/load-ui.mjs"
import { categories, makeRecord } from "../../../packages/types/tests/fixtures/opportunities.mjs"
const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server"),{projectOpportunity}=require("@skilved/types/opportunities/internal"),{PublicOpportunitySchema}=require("@skilved/types/opportunities")
const {OpportunitySupport,SupportEntry}=loadUi("components/catalogue/OpportunitySupport.tsx")
const example=(category="bursary")=>projectOpportunity(makeRecord(category)).opportunity
const render=o=>renderToStaticMarkup(React.createElement(OpportunitySupport,{opportunity:PublicOpportunitySchema.parse(o)}))
const plain=html=>html.replace(/<[^>]*>/g," ").replace(/\s+/g," ")

test("all category support files preserve the eight benefit kinds and each entry's period and coverage",()=>{
 const kinds=["salary","stipend","tuition","books","accommodation","transport","allowance","other"],labels=["Salary","Stipend","Tuition","Books","Accommodation","Transport","Allowance","Other support"]
 const headings=new Set()
 for(const category of categories){
  const o=example(category),base=o.compensation[0]
  o.compensation=kinds.map((kind,index)=>({...base,value:{...base.value,kind,amount:1250.125,maximum:2000.75,period:index%2?"once":"month",coverage:`Coverage for ${kind} only.`}}))
  const html=render(o),text=plain(html)
  for(const [index,label]of labels.entries()){assert.ok(text.includes(label+" · "+(index%2?"Once":"Per month")));assert.ok(text.includes(`Coverage for ${kinds[index]} only.`))}
  assert.match(html,/ZAR 1,250.125–2,000.75/);assert.match(html,/8 separate entries/)
  headings.add(html.match(/<h2[^>]*>(.*?)<\/h2>/)[1])
  assert.doesNotMatch(html,/Total funding|total package|guaranteed funding|<input|<button|\/apply\?|PRIVATE_/i)
 }
 assert.equal(headings.size,6)
})

test("zero, fractional ranges and tiny positive numbers are preserved without currency or period inference",()=>{
 const o=example(),base=o.compensation[0]
 o.compensation=[
  {...base,value:{...base.value,amount:0,maximum:0}},
  {...base,value:{...base.value,amount:1e-25,maximum:null,period:"not_stated"}},
  {...base,value:{...base.value,amount:1234.56789,maximum:2000.98765,currency:null}},
  {...base,value:{...base.value,amount:null,maximum:null,currency:"USD",coverage:null}},
 ]
 const html=render(o),text=plain(html)
 assert.match(text,/ZAR 0 per month/);assert.ok(text.includes("ZAR 0.0000000000000000000000001 period not stated"))
 assert.match(text,/Recorded maximum 0/);assert.match(text,/Recorded amount 1,234.56789 Recorded maximum 2,000.98765 Currency Currency not stated/)
 assert.match(text,/1,234.56789–2,000.98765 · currency not stated/)
 assert.match(text,/Amount not stated Currency USD/);assert.match(html,/Coverage not stated/)
 assert.doesNotMatch(text,/ZAR 1,234|USD 0|1,234.57|2,000.99|monthly equivalent|annual total/i)
})

test("uncertain support never promotes residual structured values and preserves its original wording",()=>{
 const base=example().compensation[0]
 for(const state of ["ambiguous","conflicting","not_stated"]){
  const fact={...base,state,value:{...base.value,amount:9999999,currency:"USD",coverage:"RESIDUAL_COVERAGE"},originalText:"Original uncertain wording <script>unsafe</script>\nLast source sentence."}
  const html=renderToStaticMarkup(React.createElement(SupportEntry,{fact,index:0,citations:example().citations}))
  assert.match(html,state==="ambiguous"?/The notice is unclear/:state==="conflicting"?/The sources disagree/:/Not stated in the reviewed notice/)
  assert.match(html,/Original uncertain wording &lt;script&gt;unsafe&lt;\/script&gt;\nLast source sentence/)
  assert.doesNotMatch(html,/USD|9,999,999|RESIDUAL_COVERAGE|Recorded amount|<script>/)
 }
 const o=example();o.compensation=[]
 const html=render(o)
 assert.match(html,/Pay and support are not stated/);assert.match(html,/Missing support details do not mean support is offered or excluded/)
 assert.doesNotMatch(html,/separate entries|No support offered|No funding available/)
})

test("entry disclosures resolve only their own unique sources and retain complete multiline wording",()=>{
 const o=example(),wording="Long coverage clause ".repeat(20)+"\nFinal source sentence <unsafe>."
 o.citations.push({id:"support_source",label:"Support source <unsafe>",url:"https://support.example/notice"},{id:"unrelated",label:"UNRELATED_SOURCE_SENTINEL",url:"https://other.example/notice"})
 const fact={...o.compensation[0],originalText:wording,citations:["support_source","support_source","not_present"]}
 const html=renderToStaticMarkup(React.createElement(SupportEntry,{fact,index:2,citations:o.citations}))
 assert.match(html,/id="support-entry-3" tabindex="-1"/)
 assert.ok(html.includes(wording.replaceAll("<","&lt;").replaceAll(">","&gt;")))
 assert.equal([...html.matchAll(/href="https:\/\/support.example\/notice"/g)].length,1)
 assert.match(html,/1 reference for this entry/);assert.match(html,/target="_blank" rel="noreferrer noopener"/)
 assert.match(html,/href="#evidence"/);assert.doesNotMatch(html,/UNRELATED_SOURCE_SENTINEL|https:\/\/issuer.example|<unsafe>|<details[^>]* open/)
 const missing=renderToStaticMarkup(React.createElement(SupportEntry,{fact:{...fact,originalText:null,citations:[]},index:0,citations:o.citations}))
 assert.match(missing,/No source wording is recorded/);assert.match(missing,/No public source reference is available here/)
})

test("feed support links point to visible entry headings in the complete notice without exposing private state",()=>{
 const o=example(),href="/opportunities/"+o.id+"?from=%2F%3Fcategory%3Dbursary%26province%3Dgauteng"
 const {OpportunityBrief}=loadUi("components/catalogue/OpportunityBrief.tsx",{"next/link":{__esModule:true,default:({href,children,...props})=>React.createElement("a",{href,...props},children)}})
 const brief=renderToStaticMarkup(React.createElement(OpportunityBrief,{opportunity:o,href})),support=render(o)
 for(let index=0;index<o.compensation.length;index++){
  assert.ok(brief.includes(href+`#support-entry-${index+1}`))
  assert.ok(support.includes(`id="support-entry-${index+1}" tabindex="-1"`))
 }
 assert.match(support,/id="funding-heading" tabindex="-1"/)
 assert.doesNotMatch(brief+support,/reportedAppliedAt|writeToken|localStorage|profile|PRIVATE_/)
})
