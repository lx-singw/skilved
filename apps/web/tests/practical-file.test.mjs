import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import { loadUi } from "./helpers/load-ui.mjs"
import { categories, makeRecord } from "../../../packages/types/tests/fixtures/opportunities.mjs"
const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server"),{projectOpportunity}=require("@skilved/types/opportunities/internal"),{PublicOpportunitySchema}=require("@skilved/types/opportunities")
const {OpportunityPractical}=loadUi("components/catalogue/OpportunityPractical.tsx"),{OpportunityOverview}=loadUi("components/catalogue/OpportunityOverview.tsx"),{opportunityLens}=loadUi("lib/opportunity-lens.ts")
const example=(category="graduate_programme")=>projectOpportunity(makeRecord(category)).opportunity
const render=o=>renderToStaticMarkup(React.createElement(OpportunityPractical,{opportunity:PublicOpportunitySchema.parse(o)}))
const plain=html=>html.replace(/<[^>]*>/g," ").replace(/\s+/g," ")

test("all categories retain separate place fields without inferring a country or filling missing locality details",()=>{
 const headings=new Set()
 for(const category of categories){
  const o=example(category)
  o.location.value={places:[{city:"First locality",province:"gauteng",country:null},{city:null,province:null,country:"BW"},{city:"Second locality",province:"western_cape",country:"ZA"}],coverage:"international",attendance:"hybrid",relocation:"Relocation at own expense\nRead the notice before arranging travel."}
  const html=render(o),text=plain(html)
  headings.add(html.match(/<h2[^>]*>(.*?)<\/h2>/)[1])
  assert.match(text,/City \/ locality First locality Province Gauteng Country code Country not stated/)
  assert.match(text,/City \/ locality City not stated Province Province not stated Country code BW/)
  assert.match(text,/City \/ locality Second locality Province Western Cape Country code ZA/)
  assert.match(text,/Coverage International Attendance Hybrid/)
  assert.match(text,/Relocation at own expense Read the notice/)
  assert.doesNotMatch(html,/western_cape|maps\.google|maps\.apple|latitude|kilometres|near you|travel time|Everyone eligible/i)
 }
 assert.equal(headings.size,6)
})

test("remote national coverage does not decide residence, relocation, experience or working commitments",()=>{
 const o=example()
 o.location.value={places:[],coverage:"national",attendance:"remote",relocation:null}
 o.residence={state:"not_stated",value:null,originalText:null,citations:[]}
 o.experience={...o.experience,state:"stated",value:"Five years stated in this notice",originalText:"Original experience wording, retained separately.",citations:[o.citations[0].id]}
 o.practicalConditions={...o.practicalConditions,state:"stated",value:"Programme arrangement, as recorded.\nThe final condition remains visible.",originalText:"Original arrangement wording, retained separately."}
 const html=render(o),text=plain(html)
 assert.match(text,/Coverage National Attendance Remote/)
 assert.match(html,/No individual places are recorded/);assert.match(html,/Relocation not stated/)
 assert.match(text,/Residence conditions Not stated Not stated in the reviewed notice/)
 assert.match(html,/Five years stated in this notice/)
 assert.match(html,/Programme arrangement, as recorded\.\nThe final condition remains visible/)
 assert.match(html,/Original experience wording, retained separately/)
 assert.match(html,/Original arrangement wording, retained separately/)
 assert.match(html,/No separate source wording is recorded/)
 assert.match(html,/does not establish residence eligibility or relocation support/)
 assert.doesNotMatch(html,/Anywhere in South Africa|No experience required|Relocation provided|permanent employment|infinite duration/i)
 o.experience.originalText=null
 assert.throws(()=>PublicOpportunitySchema.parse(o),/Public assertion needs reviewed citation/)
 const defensive=renderToStaticMarkup(React.createElement(OpportunityPractical,{opportunity:o}))
 assert.match(defensive,/Five years stated in this notice/)
 assert.match(defensive,/No separate source wording is recorded/)
})

test("uncertain states cannot promote residual location or text values and keep source wording escaped",()=>{
 for(const state of ["ambiguous","conflicting","not_stated"]){
  const o=example()
  o.location={...o.location,state,value:{places:[{city:"RESIDUAL_CITY",province:"gauteng",country:"ZA"}],coverage:"local",attendance:"in_person",relocation:"RESIDUAL_RELOCATION"},originalText:"Available uncertain location wording <unsafe>."}
  for(const key of ["residence","experience","practicalConditions"])o[key]={...o[key],state,value:"RESIDUAL_TEXT",originalText:"Original uncertain wording\nFinal sentence <unsafe>."}
  const html=renderToStaticMarkup(React.createElement(OpportunityPractical,{opportunity:o}))
  assert.match(html,state==="ambiguous"?/The notice is unclear/:state==="conflicting"?/The sources disagree/:/Not stated in the reviewed notice/)
  assert.match(html,/Original uncertain wording\nFinal sentence &lt;unsafe&gt;/)
  assert.doesNotMatch(html,/RESIDUAL_CITY|RESIDUAL_RELOCATION|RESIDUAL_TEXT|<unsafe>|Attendance<\/dt><dd>In person/)
 }
})

test("each detail keeps only its own unique sources and does not substitute wider listing references",()=>{
 const o=example(),keys=["location","residence","experience","practicalConditions"]
 o.citations.push({id:"unrelated_source",label:"UNRELATED_SOURCE_SENTINEL",url:"https://unrelated.example/notice"})
 for(const [index,key]of keys.entries()){
  const id="condition_source_"+index
  o.citations.push({id,label:`Own source ${index} <unsafe>`,url:`https://source${index}.example/notice`})
  o[key]={...o[key],originalText:`Complete wording ${index}\nFinal source clause.`,citations:[id]}
 }
 o.location.citations.push(o.location.citations[0])
 const html=renderToStaticMarkup(React.createElement(OpportunityPractical,{opportunity:o}))
 for(let index=0;index<4;index++){
  assert.equal([...html.matchAll(new RegExp(`href="https://source${index}.example/notice"`,"g"))].length,1)
  assert.match(html,new RegExp(`Complete wording ${index}\\nFinal source clause`))
 }
 assert.equal([...html.matchAll(/1 reference for this detail/g)].length,4)
 assert.match(html,/target="_blank" rel="noreferrer noopener"/)
 assert.doesNotMatch(html,/UNRELATED_SOURCE_SENTINEL|https:\/\/issuer.example|<unsafe>|<details[^>]* open/)
 o.residence={state:"not_stated",value:null,originalText:null,citations:[]}
 const missing=render(o)
 assert.match(missing,/No separate source wording is recorded/);assert.match(missing,/No public source reference is available here/)
})

test("unclear-detail and category links target visible keyboard headings, with source drawers independent",()=>{
 const o=example()
 for(const key of ["location","residence","experience"])o[key]={state:"not_stated",value:null,originalText:null,citations:[]}
 const overview=renderToStaticMarkup(React.createElement(OpportunityOverview,{opportunity:o})),html=render(o)
 for(const [label,id]of [["Location","location-heading"],["Attendance","location-heading"],["Residence conditions","residence-heading"],["Experience","experience-heading"]])assert.ok(overview.includes(`href="#${id}">${label}`))
 for(const category of categories){const lens=opportunityLens(example(category));for(const fact of lens.facts.filter(f=>["place","experience","conditions"].includes(f.key)))assert.ok(["#location-heading","#experience-heading","#arrangement-heading"].includes(fact.href))}
 const targets=["conditions-heading","location-heading","residence-heading","experience-heading","arrangement-heading"]
 let detailsDepth=0,seen=[]
 for(const match of html.matchAll(/<(\/?)(details|h[23])\b([^>]*)>/g)){
  if(match[2]==="details")detailsDepth+=match[1]?-1:1
  else if(!match[1]){const id=match[3].match(/id="([^"]+)"/)?.[1];if(targets.includes(id)){assert.equal(detailsDepth,0);assert.match(match[3],/tabindex="-1"/);seen.push(id)}}
 }
 assert.deepEqual(seen,targets)
 assert.doesNotMatch(html,/<form|<input|<button|\/apply\?|reportedAppliedAt|writeToken|PRIVATE_/)
})
