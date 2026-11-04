import assert from "node:assert/strict"
import {createRequire} from "node:module"
import {test} from "node:test"
import {categories,makeRecord} from "../../../packages/types/tests/fixtures/opportunities.mjs"
import {loadUi} from "./helpers/load-ui.mjs"
const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server")
const {projectOpportunity}=require("@skilved/types/opportunities/internal"),{PublicOpportunitySchema}=require("@skilved/types/opportunities")
const {OpportunityBrief}=loadUi("components/catalogue/OpportunityBrief.tsx")
const {OpportunityPost}=loadUi("components/catalogue/OpportunityPost.tsx")
const example=(category="bursary")=>projectOpportunity(makeRecord(category)).opportunity
const href="/opportunities/original?from=%2F%3Fcategory%3Dbursary"
const render=o=>renderToStaticMarkup(React.createElement(OpportunityBrief,{opportunity:o,href}))
const unknown=state=>({state,value:null,originalText:state==="not_stated"?null:"Source wording <unsafe>",citations:state==="not_stated"?[]:["citation_fixture"]})

test("each category has a distinct inline brief and all nested disclosures start closed",()=>{
 const labels=new Set()
 for(const category of categories){
  const o=example(category),before=JSON.stringify(o),html=render(o)
  labels.add(html.match(/Inside the [^<]+ brief/)[0])
  assert.equal((html.match(/<details/g)??[]).length,3)
  assert.doesNotMatch(html,/<details[^>]* open=|<input|<progress|<script|PRIVATE_|snapshot_fixture|you qualify|verified opportunity/i)
  assert.match(html,/Recorded instructions<\/dt><dd>2/);assert.match(html,/Document entries<\/dt><dd>0/)
  assert.match(html,/Source references<\/dt><dd>1/);assert.equal(JSON.stringify(o),before)
  assert.ok(html.includes('aria-label="Read more about '+o.title.value+'"'))
 }
 assert.equal(labels.size,6)
})

test("conditional document entries retain wording and strength without becoming a compulsory checklist",()=>{
 const o=example(),[a,b]=o.requirements.requirements
 a.kind="document";b.kind="document";a.level="preferred";b.level="unclear"
 a.fact.originalText="Academic record only if requested";b.fact=unknown("conflicting")
 o.requirements.expression={op:"if",condition:a.id,then:{op:"ref",id:b.id},otherwise:{op:"unknown",originalText:"Other route <unsafe>"}}
 PublicOpportunitySchema.parse(o)
 const html=render(o)
 assert.match(html,/Document entries<\/dt><dd>2/)
 for(const text of ["Preferred as stated","Strength needs confirmation","Academic record only if requested","Sources disagree","alternative or conditional routes","IF ","THEN ","ELSE "])assert.ok(html.includes(text),text)
 assert.match(html,/Other route &lt;unsafe&gt;/)
 assert.doesNotMatch(html,/<unsafe>|type="checkbox"|all documents are required|you must submit/i)
})

test("an inventory counts document instructions once even when the expression references one several times",()=>{
 const o=example(),[a,b]=o.requirements.requirements
 a.kind="document";a.fact.originalText="One recorded document instruction"
 o.requirements.expression={op:"any",children:[{op:"ref",id:a.id},{op:"all",children:[{op:"ref",id:a.id},{op:"ref",id:b.id}]}]}
 PublicOpportunitySchema.parse(o)
 const html=render(o)
 assert.match(html,/Document entries<\/dt><dd>1/)
 assert.equal((html.match(/class="brief-document-level"/g)??[]).length,1)
 assert.match(html,/ANY of .* OR /);assert.match(html,/ALL of .* AND /)
})

test("no recorded document entries or instructions never claims no requirements or support",()=>{
 const o=example();o.requirements.requirements=[];o.requirements.expression={op:"unknown",originalText:"Ask about the connected conditions."};o.compensation=[]
 PublicOpportunitySchema.parse(o)
 const html=render(o)
 assert.match(html,/Recorded instructions<\/dt><dd>0/)
 assert.match(html,/No separate document entries are recorded/)
 assert.match(html,/Ask about the connected conditions/)
 assert.match(html,/No support wording is recorded/)
 assert.doesNotMatch(html,/No documents required|No requirements|No support offered/i)
})

test("support and summary uncertainty keep missing, ambiguous and conflicting meanings separate",()=>{
 const o=example()
 for(const state of ["not_stated","ambiguous","conflicting"]){
  o.summary=unknown(state);o.compensation=[unknown(state)]
  PublicOpportunitySchema.parse(o)
  const html=render(o)
  assert.match(html,state==="not_stated"?/Summary not stated/:state==="ambiguous"?/Needs clarification/:/Sources disagree/)
  if(state!=="not_stated")assert.match(html,/Source wording &lt;unsafe&gt;/)
  assert.doesNotMatch(html,/<unsafe>|You qualify|Verified/i)
 }
})

test("long multiline summary, document and support wording remain complete and escaped",()=>{
 const o=example(),wording="Detailed source wording ".repeat(25)+"\nFinal sentence <unsafe>."
 o.summary.value=wording;o.summary.originalText=wording
 o.requirements.requirements[0].kind="document";o.requirements.requirements[0].fact.originalText=wording
 o.compensation[0].originalText=wording
 PublicOpportunitySchema.parse(o)
 const html=render(o),escaped=wording.replaceAll("<","&lt;").replaceAll(">","&gt;")
 assert.equal(html.split(escaped).length-1,4) // Summary, document, connected wording and support.
 assert.doesNotMatch(html,/<unsafe>/)
})

test("all feed destinations keep the public filters and cursor while linking to their precise detail sections",()=>{
 const o=example(),query=new URLSearchParams("category=bursary&province=gauteng&field=engineering&cursor=opaque")
 const html=renderToStaticMarkup(React.createElement(OpportunityPost,{opportunity:o,query}))
 const urls=[...html.matchAll(/href="(\/opportunities\/[^"]+)"/g)].map(m=>new URL(m[1].replaceAll("&amp;","&"),"https://local.example"))
 assert.equal(urls.length,6+o.compensation.length)
 for(const url of urls){assert.equal(url.pathname,"/opportunities/"+o.id);assert.equal(url.searchParams.get("from"),"/?"+query.toString())}
 assert.deepEqual(urls.map(url=>url.hash).filter(Boolean).sort(),["#deadline-heading","#evidence","#funding-heading","#preparation",...o.compensation.map((_,index)=>`#support-entry-${index+1}`)].sort())
 assert.doesNotMatch(html,/source-dots|\/apply\?|mailto:|writeToken|reportedAppliedAt|PRIVATE_/)
})

test("closed intake facts remain inspectable without an application action or a derived closing verdict",()=>{
 const o=example();o.lifecycle="closed";o.application={state:"unavailable",reason:"closed"}
 PublicOpportunitySchema.parse(o)
 const html=renderToStaticMarkup(React.createElement(OpportunityPost,{opportunity:o,query:new URLSearchParams()}))
 assert.match(html,/Closed intake/);assert.match(html,/#evidence/);assert.match(html,/Review the full preparation view/)
 assert.doesNotMatch(html,/Apply now|\/apply\?|days left|Guaranteed/i)
})
