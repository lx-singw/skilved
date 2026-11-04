import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import { makeRecord } from "../../../packages/types/tests/fixtures/opportunities.mjs"
import { loadUi } from "./helpers/load-ui.mjs"

const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server")
const {projectOpportunity}=require("@skilved/types/opportunities/internal"),{PublicOpportunitySchema}=require("@skilved/types/opportunities")
const {ApplicationDate}=loadUi("components/catalogue/OpportunityDeadline.tsx")
const example=()=>projectOpportunity(makeRecord()).opportunity
const render=o=>renderToStaticMarkup(React.createElement(ApplicationDate,{opportunity:PublicOpportunitySchema.parse(o)}))
const plain=html=>html.replace(/<[^>]*>/g," ").replace(/\s+/g," ")

test("timing precision preserves date-only, local time, timezone and recorded UTC without computing missing parts",()=>{
 for(const value of [
  {localTime:null,timezone:null,utcInstant:null},
  {localTime:"00:00",timezone:null,utcInstant:null},
  {localTime:null,timezone:"Africa/Johannesburg",utcInstant:null},
  {localTime:"18:00",timezone:"Africa/Johannesburg",utcInstant:null},
  {localTime:"18:00",timezone:"Africa/Johannesburg",utcInstant:"2026-10-30T16:00:00.000Z"},
 ]){
  const o=example();Object.assign(o.deadline.value,value)
  const html=render(o),text=plain(html)
  assert.match(html,/dateTime="2026-10-30"/)
  assert.ok(text.includes(value.localTime??"Time not stated"))
  assert.ok(text.includes(value.timezone??"Timezone not stated"))
  if(value.utcInstant){assert.match(html,/dateTime="2026-10-30T16:00:00.000Z"/);assert.match(text,/2026-10-30 · 16:00 UTC/)}
  else assert.doesNotMatch(text,/Recorded UTC time|16:00 UTC/)
  if(!value.localTime)assert.match(text,/without a closing time/)
  if(value.localTime&&!value.timezone)assert.match(text,/without a timezone/)
  assert.doesNotMatch(html,/days left|hours left|closing soon|Intake closed|device timezone:|23:59|<input|<button/i)
 }
})

test("until-filled wording and closed lifecycle stay independent of fixed dates and clocks",()=>{
 const o=example();o.deadline={...o.deadline,originalText:"Applications until filled.",value:{kind:"open_until_filled",originalText:"Applications until filled.",localDate:null,localTime:null,timezone:null,utcInstant:null}}
 let html=render(o)
 assert.match(html,/Until filled/);assert.match(html,/does not confirm that places remain available/)
 assert.doesNotMatch(html,/<time|Local closing time|Timezone not stated|Recorded UTC time|Intake closed/)
 o.lifecycle="closed";o.application={state:"unavailable",reason:"closed"}
 html=render(o);assert.match(html,/Intake closed/);assert.match(html,/Applications until filled/)
 const dated=example();dated.lifecycle="closed";dated.application={state:"unavailable",reason:"closed"}
 assert.match(render(dated),/dateTime="2026-10-30"/)
})

test("uncertain closing facts preserve their wording without promoting residual structured timing",()=>{
 for(const state of ["not_stated","ambiguous","conflicting"]){
  const o=example();o.deadline={...o.deadline,state,value:null,originalText:state==="not_stated"?null:"First wording <script>unsafe</script>\nFinal source sentence."}
  const html=render(o)
  assert.match(html,state==="conflicting"?/No single closing date or time/:state==="ambiguous"?/needs clarification/:/A closing date is not stated/)
  if(state!=="not_stated")assert.match(html,/First wording &lt;script&gt;unsafe&lt;\/script&gt;\nFinal source sentence/)
  assert.doesNotMatch(html,/<time|Local closing time|Africa\/Johannesburg|2026-10-30|<script>/)
  // Defensive rendering never promotes a residual value; this is not a newly accepted public projection.
  o.deadline.value={...example().deadline.value,localTime:"18:00",timezone:"Africa/Johannesburg",utcInstant:"2026-10-30T16:00:00.000Z"}
  const defensive=renderToStaticMarkup(React.createElement(ApplicationDate,{opportunity:o}))
  assert.doesNotMatch(defensive,/<time|18:00|16:00|Africa\/Johannesburg|2026-10-30/)
 }
})

test("timing drawer resolves only unique deadline sources and retains both distinct source wordings",()=>{
 const o=example();o.citations.push({id:"timing",label:"Closing addendum <unsafe>",url:"https://timing.example/addendum"},{id:"other",label:"UNRELATED_SENTINEL",url:"https://other.example/notice"})
 o.deadline.citations=["timing","timing"]
 o.deadline.originalText="Closing statement ".repeat(35)+"\nFinal timing clause <unsafe>."
 o.deadline.value.originalText="Separate recorded deadline wording."
 const html=render(o)
 assert.equal([...html.matchAll(/href="https:\/\/timing.example\/addendum"/g)].length,1)
 assert.match(html,/1 reference for this timing/);assert.match(html,/Final timing clause &lt;unsafe&gt;/)
 assert.match(html,/Recorded deadline wording: Separate recorded deadline wording/)
 assert.match(html,/target="_blank" rel="noreferrer noopener"/);assert.match(html,/href="#evidence"/)
 assert.doesNotMatch(html,/UNRELATED_SENTINEL|href="https:\/\/issuer.example|<unsafe>|<details[^>]* open/)
 o.deadline={state:"not_stated",value:null,originalText:null,citations:[]}
 assert.match(render(o),/No separate source wording is recorded/);assert.match(render(o),/No public source reference is available/)
})

test("feed closing links and unresolved questions reach the visible keyboard target without changing personal progress",()=>{
 const link={__esModule:true,default:({href,children,...props})=>React.createElement("a",{href,...props},children)}
 const {OpportunityPost}=loadUi("components/catalogue/OpportunityPost.tsx",{"next/link":link})
 const {OpportunityOverview}=loadUi("components/catalogue/OpportunityOverview.tsx")
 const o=example(),query=new URLSearchParams("category=bursary&province=gauteng")
 const card=renderToStaticMarkup(React.createElement(OpportunityPost,{opportunity:o,query}))
 assert.match(card,/from=%2F%3Fcategory%3Dbursary%26province%3Dgauteng#deadline-heading/)
 const timing=render(o)
 assert.match(timing,/<h3 id="deadline-heading" tabindex="-1">Closing wording &amp; timing<\/h3>/)
 assert.ok(timing.indexOf('id="deadline-heading"')<timing.indexOf("<details"))
 o.deadline={state:"ambiguous",value:null,originalText:"Confirm the date.",citations:["citation_fixture"]}
 assert.match(renderToStaticMarkup(React.createElement(OpportunityOverview,{opportunity:o})),/href="#deadline-heading">Closing date/)
 assert.doesNotMatch(card+timing,/localStorage|reportedAppliedAt|writeToken|automatically saved|PRIVATE_/)
})
