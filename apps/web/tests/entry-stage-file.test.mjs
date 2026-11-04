import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import { makeRecord } from "../../../packages/types/tests/fixtures/opportunities.mjs"
import { loadUi } from "./helpers/load-ui.mjs"
const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server")
const {projectOpportunity}=require("@skilved/types/opportunities/internal"),{PublicOpportunitySchema}=require("@skilved/types/opportunities")
const {EntryStage}=loadUi("components/catalogue/EntryStage.tsx")
const example=()=>projectOpportunity(makeRecord("job")).opportunity
const render=o=>renderToStaticMarkup(React.createElement(EntryStage,{opportunity:PublicOpportunitySchema.parse(o)}))

test("multiple source-stated stages retain their recorded order without ranking, selection or inferred experience",()=>{
 const o=example();o.entryStage={...o.entryStage,state:"stated",value:["experienced","school_leaver","entry_level"],originalText:"Synthetic source lists these labels; read connected conditions.",citations:["citation_fixture"]}
 const html=render(o)
 assert.ok(html.indexOf('>Experienced</span>')<html.indexOf('>School leaver</span>'))
 assert.ok(html.indexOf('>School leaver</span>')<html.indexOf('>Entry level</span>'))
 assert.match(html,/Multiple labels do not establish separate application routes/)
 assert.match(html,/Entry level does not mean no experience is required/)
 assert.match(html,/href="#preparation"/);assert.match(html,/href="#experience-heading"/)
 assert.doesNotMatch(html,/<input|<button|<select|aria-selected|you qualify|your match|rank|Five years/i)
})

test("uncertain stages never expose residual labels while missing wording and references stay explicit",()=>{
 for(const state of ["not_stated","ambiguous","conflicting"]){
  const o=example();o.entryStage={state,value:null,originalText:state==="not_stated"?null:"Uncertain wording <unsafe>\nFinal source sentence.",citations:state==="not_stated"?[]:["citation_fixture"]}
  const html=render(o)
  assert.doesNotMatch(html,/entry-stage-labels/)
  assert.match(html,state==="not_stated"?/No source wording is recorded/:/Uncertain wording &lt;unsafe&gt;\nFinal source sentence/)
  if(state==="not_stated")assert.match(html,/No public source reference is available/)
  // Defensive rendering must not promote a leftover value into a stated label.
  o.entryStage.value=["graduate","experienced"]
  const defensive=renderToStaticMarkup(React.createElement(EntryStage,{opportunity:o}))
  assert.doesNotMatch(defensive,/entry-stage-labels|>Graduate<|>Experienced</)
 }
})

test("stage source disclosure preserves complete wording and only unique references for that fact",()=>{
 const o=example();o.citations.push({id:"stage_only",label:"Stage addendum <unsafe>",url:"https://stage.example/addendum"},{id:"other",label:"UNRELATED_SOURCE",url:"https://other.example/notice"})
 o.entryStage={...o.entryStage,state:"stated",value:["entry_level"],originalText:"Stage wording ".repeat(50)+"\nFinal source clause <unsafe>.",citations:["stage_only","stage_only"]}
 const html=render(o)
 assert.equal([...html.matchAll(/href="https:\/\/stage.example\/addendum"/g)].length,1)
 assert.match(html,/1 reference for the entry stage/);assert.match(html,/Final source clause &lt;unsafe&gt;/)
 assert.match(html,/target="_blank" rel="noreferrer noopener"/);assert.match(html,/href="#evidence"/)
 assert.doesNotMatch(html,/UNRELATED_SOURCE|href="https:\/\/issuer.example|<unsafe>|<details[^>]* open/)
 assert.ok(html.indexOf('id="entry-stage-heading"')<html.indexOf('<details'))
 assert.match(html,/id="entry-stage-heading" tabindex="-1"/)
})

test("feed brief shows only reviewed stage context and keeps its full results route at the visible detail target",()=>{
 const link={__esModule:true,default:({href,children,...props})=>React.createElement("a",{href,...props},children)}
 const {OpportunityBrief}=loadUi("components/catalogue/OpportunityBrief.tsx",{"next/link":link})
 const o=example(),href="/opportunities/"+o.id+"?from=%2F%3Fcategory%3Djob%26cursor%3Dopaque"
 o.entryStage={...o.entryStage,state:"stated",value:["student","entry_level"],originalText:"Synthetic source labels.",citations:["citation_fixture"]}
 let html=renderToStaticMarkup(React.createElement(OpportunityBrief,{opportunity:o,href}))
 assert.match(html,/Student · Entry level/);assert.ok(html.includes(href+"#entry-stage-heading"))
 o.entryStage={state:"conflicting",value:null,originalText:"Stage wording differs.",citations:["citation_fixture"]}
 html=renderToStaticMarkup(React.createElement(OpportunityBrief,{opportunity:o,href}))
 assert.match(html,/Sources disagree/);assert.doesNotMatch(html,/Student · Entry level|localStorage|writeToken|reportedAppliedAt|PRIVATE_/)
})
