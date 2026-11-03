import assert from "node:assert/strict"
import {createRequire} from "node:module"
import {test} from "node:test"
import {loadUi} from "./helpers/load-ui.mjs"
import {allFixtures,makeRecord} from "../../../packages/types/tests/fixtures/opportunities.mjs"
const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server")
const {projectOpportunity}=require("@skilved/types/opportunities/internal"),{PublicOpportunitySchema}=require("@skilved/types/opportunities")
const {InstructionDetails}=loadUi("components/catalogue/InstructionDetails.tsx"),{preparationDetails,exactFileLimit}=loadUi("lib/preparation-details.ts")
const opportunity=()=>projectOpportunity(makeRecord()).opportunity
const render=(item,citations,index=0)=>renderToStaticMarkup(React.createElement(InstructionDetails,{item,citations,index}))
function nodes(tree,predicate){const out=[];function visit(node){if(Array.isArray(node))node.forEach(visit);else if(node&&typeof node==="object"){if(predicate(node))out.push(node);visit(node.props?.children)}}visit(tree);return out}
function documentItem(){const o=opportunity(),item=o.requirements.requirements[0];item.kind="document";item.fact.value={description:"A fictional academic record",qualification:null,document:{kind:"Academic record",stage:"At shortlisting",certification:"Certification wording needs checking",format:"PDF",maxBytes:2097152}};item.fact.originalText="Follow the fictional notice's connected document conditions.";return{o,item}}

test("every category inspects source-linked instruction details without assigning eligibility or leaking review material",()=>{
 for(const record of allFixtures()){
  const o=projectOpportunity(record).opportunity
  for(const item of o.requirements.requirements){const html=render(item,o.citations);assert.match(html,/Instruction details &amp; sources/);assert.match(html,/https:\/\/issuer.example\/notice/);assert.match(html,/alternatives and conditions/);assert.doesNotMatch(html,/PRIVATE_|assertion_|reviewer_fixture|snapshot_fixture|you qualify|eligible score|application submitted/i)}
 }
})

test("qualification completion and thresholds retain provisional, in-progress, zero and fractional meanings",()=>{
 const o=opportunity(),item=o.requirements.requirements[0],q=item.fact.value.qualification
 q.subjects=[{name:"Fictional subject zero",minimumPercent:0},{name:"Fictional fractional subject",minimumPercent:51.75},{name:"Threshold not stated",minimumPercent:null}]
 for(const [completion,label] of [["completed","Completed as stated"],["provisional","Provisional as stated"],["in_progress","In progress as stated"],["not_stated","Completion not stated"]]){
  q.completion=completion;PublicOpportunitySchema.parse(o);const html=render(item,o.citations)
  assert.ok(html.includes(label));assert.match(html,/At least 0% as stated/);assert.match(html,/At least 51.75% as stated/);assert.match(html,/Minimum not stated/)
  if(completion!=="completed")assert.doesNotMatch(html,/Completed as stated/)
 }
 q.level=null;q.subjects=[];const html=render(item,o.citations)
 assert.match(html,/Level stated/);assert.match(html,/Not stated in this entry/);assert.match(html,/No subject details are recorded/);assert.doesNotMatch(html,/NQF/)
})

test("document stage, certification, format and byte limit stay separate from personal progress",()=>{
 const {o,item}=documentItem();PublicOpportunitySchema.parse(o)
 const html=render(item,o.citations)
 for(const value of ["Academic record","At shortlisting","Certification wording needs checking","PDF","2,097,152 bytes"])assert.ok(html.includes(value))
 assert.match(html,/Document stage in the notice/);assert.doesNotMatch(html,/type="file"|name="stage"|Applied — marked by you|upload documents|assess eligibility/i)
 const d=item.fact.value.document;d.stage=d.certification=d.format=d.maxBytes=null
 const unknown=render(item,o.citations);assert.equal((unknown.match(/Not stated in this entry/g)??[]).length,4);assert.doesNotMatch(unknown,/No certification required|Any format|Unlimited/)
 for(const [bytes,value]of [[null,"Not stated in this entry"],[1,"1 byte"],[1000,"1,000 bytes"],[1048576,"1,048,576 bytes"],[Number.MAX_SAFE_INTEGER,"9,007,199,254,740,991 bytes"]])assert.equal(exactFileLimit(bytes),value)
})

test("qualification and document details follow the actual value and can coexist in one instruction",()=>{
 const {o,item}=documentItem();item.kind="other";item.fact.value.qualification={designation:"Fictional qualification",level:4,completion:"provisional",subjects:[]};PublicOpportunitySchema.parse(o)
 const html=render(item,o.citations)
 assert.match(html,/Other instruction/);assert.match(html,/Qualification details/);assert.match(html,/Document details/);assert.match(html,/Fictional qualification/);assert.match(html,/Academic record/)
})

test("each instruction uses only its cited references, deduplicated in recorded order",()=>{
 const o=opportunity(),item=o.requirements.requirements[0]
 o.citations.push({id:"second_source",label:"Second fictional source",url:"https://second.example/notice"},{id:"unrelated_source",label:"UNRELATED_PUBLIC_SOURCE",url:"https://unrelated.example/notice"})
 item.fact.citations=["second_source","citation_fixture","second_source"];PublicOpportunitySchema.parse(o)
 const model=preparationDetails(item,o.citations),html=render(item,o.citations)
 assert.deepEqual(model.sources.map(s=>s.id),["second_source","citation_fixture"]);assert.match(html,/2 source references/);assert.doesNotMatch(html,/UNRELATED_PUBLIC_SOURCE|unrelated.example|second_source|citation_fixture/)
 assert.match(render(item,[]),/No public source reference is available here/);assert.doesNotMatch(render(item,[]),/issuer.example|second.example/)
})

test("uncertain facts preserve status and never turn residual values into structured instructions",()=>{
 const {o,item}=documentItem()
 for(const [state,message]of [["ambiguous","The instruction needs clarification"],["conflicting","Sources disagree about this instruction"],["not_stated","Details are not stated in this entry"]]){
  item.fact={state,value:null,originalText:state==="not_stated"?null:"Fictional wording needs clarification.",citations:state==="not_stated"?[]:["citation_fixture"]};PublicOpportunitySchema.parse(o)
  const html=render(item,o.citations);assert.ok(html.includes(message));assert.doesNotMatch(html,/Qualification details|Document details|2,097,152|At shortlisting/)
  const residue={...item,fact:{...item.fact,value:{description:"PRIVATE_RESIDUAL",qualification:null,document:{kind:"PRIVATE_DOCUMENT",stage:null,certification:null,format:null,maxBytes:1}}}}
  assert.equal(preparationDetails(residue,o.citations).value,null);assert.doesNotMatch(render(residue,o.citations),/PRIVATE_/)
 }
})

test("long wording, Unicode, subjects and source labels stay complete and escaped",()=>{
 const o=opportunity(),item=o.requirements.requirements[0],name="Fictional Σπουδές ".repeat(60)+"<script>bad</script>"
 item.fact.value.qualification.designation=name;item.fact.value.qualification.subjects=[{name:"Fictional subject <img src=x onerror=bad>",minimumPercent:50}];item.fact.value.description="First fictional line.\nSecond line <script>bad</script>";o.citations[0].label="<img src=x onerror=bad> fictional reference"
 PublicOpportunitySchema.parse(o);const html=render(item,o.citations)
 assert.ok(html.includes(name.replaceAll("<","&lt;").replaceAll(">","&gt;")));assert.match(html,/First fictional line.\nSecond line &lt;script&gt;/);assert.match(html,/&lt;img src=x onerror=bad&gt;/);assert.doesNotMatch(html,/<script>|<img src=x/)
})

test("pending requirement values and wording stay outside the public inspection panel",()=>{
 const record=makeRecord(),fact=record.requirements.requirements[0].fact
 fact.review="pending";fact.originalText="PRIVATE_ORIGINAL";fact.value.description="PRIVATE_DESCRIPTION";fact.value.qualification.designation="PRIVATE_QUALIFICATION"
 const o=projectOpportunity(record).opportunity,html=render(o.requirements.requirements[0],o.citations)
 assert.match(html,/Details are not stated in this entry/);assert.doesNotMatch(html,/PRIVATE_|Qualification details|https:\/\/issuer.example/)
})

test("inspection controls sit outside checkbox labels, and ticking or clearing remains a temporary reading count",()=>{
 const cells=[];let slot=0
 const {PreparationChecklist}=loadUi("components/catalogue/PreparationChecklist.tsx",{react:{...React,useState:initial=>{const i=slot++;if(!(i in cells))cells[i]=typeof initial==="function"?initial():initial;return[cells[i],next=>{cells[i]=typeof next==="function"?next(cells[i]):next}]}}})
 const o=opportunity()
 function tree(){slot=0;const outer=PreparationChecklist({id:o.id,revision:o.revision,requirements:o.requirements,citations:o.citations});return outer.type(outer.props)}
 let view=tree()
 for(const label of nodes(view,n=>n.type==="label"))assert.equal(nodes(label,n=>n.type==="details"||n.type==="button"||n.type==="a"||typeof n.type==="function"&&n.type.name==="InstructionDetails").length,0)
 const checkbox=nodes(view,n=>n.type==="input"&&n.props.type==="checkbox")[0]
 checkbox.props.onChange({target:{checked:true}});view=tree()
 assert.equal(nodes(view,n=>n.type==="progress")[0].props.value,1);assert.match(renderToStaticMarkup(view),/1 of 2 reviewed/);assert.match(renderToStaticMarkup(view),/ANY of .* OR /)
 nodes(view,n=>n.type==="button")[0].props.onClick();view=tree();assert.equal(nodes(view,n=>n.type==="progress")[0].props.value,0)
 assert.equal(nodes(view,n=>n.type==="form"||n.type==="input"&&n.props.name).length,0)
})
