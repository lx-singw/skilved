import assert from "node:assert/strict"
import {createRequire} from "node:module"
import {test} from "node:test"
import {loadUi} from "./helpers/load-ui.mjs"
import {allFixtures,makeRecord} from "../../../packages/types/tests/fixtures/opportunities.mjs"
const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server")
const {projectOpportunity}=require("@skilved/types/opportunities/internal"),{PublicOpportunitySchema}=require("@skilved/types/opportunities")
const {OpportunityContext}=loadUi("components/catalogue/OpportunityConditions.tsx"),{contextInventory}=loadUi("lib/opportunity-context.ts")
const opportunity=()=>projectOpportunity(makeRecord("graduate_programme")).opportunity
const render=o=>renderToStaticMarkup(React.createElement(OpportunityContext,{opportunity:PublicOpportunitySchema.parse(o)}))
function nodes(tree,predicate){const out=[];function visit(node){if(Array.isArray(node))node.forEach(visit);else if(node&&typeof node==="object"){if(predicate(node))out.push(node);visit(node.props?.children)}}visit(tree);return out}
const entries=o=>nodes(OpportunityContext({opportunity:PublicOpportunitySchema.parse(o)}),n=>n.type==="li"&&n.props.className?.startsWith("context-role-entry"))
const text=html=>html.replace(/<[^>]*>/g," ").replace(/\s+/g," ")

test("all six categories have a scoped intake title, with internship routes confined to internships",()=>{
 const titles=new Set()
 for(const record of allFixtures()){
  const o=projectOpportunity(record).opportunity,html=render(o),inventory=contextInventory(o);titles.add(inventory.title)
  assert.equal((html.match(/class="context-drawer"/g)??[]).length,1);assert.match(html,/<summary id="context-heading">/);assert.match(html,/aria-labelledby="context-file-title"/);assert.match(html,/Intake and organisation roles/);assert.match(html,/1 stated role entry/)
  if(o.category==="internship")assert.match(html,/Internship route/)
  else assert.doesNotMatch(html,/Internship route|Graduate internship|work-integrated/)
  assert.doesNotMatch(html,/PRIVATE_|assertion_|reviewer_fixture|snapshot_fixture/)
 }
 assert.equal(titles.size,6)
})

test("inventory counts recorded entries without merging names or presenting a count of unique organisations",()=>{
 const o=opportunity(),base=o.organisations[0]
 o.organisations=Array.from({length:20},(_,i)=>i<18?{...base,value:{role:i%2?"employer_host":"training_provider",name:"Same fictional organisation"}}:{state:i===18?"ambiguous":"conflicting",value:null,originalText:"Fictional role wording needs checking.",citations:["citation_fixture"]})
 const inventory=contextInventory(PublicOpportunitySchema.parse(o))
 assert.equal(inventory.stated,18);assert.equal(inventory.unresolved,2);assert.match(inventory.description,/18 stated role entries · 2 unresolved entries/)
 assert.equal(entries(o).length,20)
 assert.doesNotMatch(inventory.description,/20 organisations|unique|verified|accredited/)
})

test("the stated intake value and its distinct original wording both survive, with the intake's own reference",()=>{
 const o=opportunity()
 o.citations.push({id:"intake_source",label:"Fictional cohort reference",url:"https://cohort.example/notice"})
 o.intake={state:"stated",value:"GRAD-2027-4",originalText:"Please quote GRAD-2027-4 for this fictional operations cohort.",citations:["intake_source"]}
 const tree=OpportunityContext({opportunity:PublicOpportunitySchema.parse(o)})
 const block=nodes(tree,n=>n.props?.className?.startsWith("context-intake "))[0],html=renderToStaticMarkup(block)
 assert.match(html,/class="context-value">GRAD-2027-4/);assert.match(html,/Please quote GRAD-2027-4/);assert.match(html,/https:\/\/cohort.example\/notice/)
 assert.doesNotMatch(html,/issuer.example|Fictional Learning Workshop|assertion_/)
})

test("five organisation roles keep their own wording and citations, including repeated names across roles",()=>{
 const o=opportunity(),base=o.organisations[0],roles=["issuer","employer_host","training_provider","qualification_issuer","oversight"]
 o.organisations=roles.map((role,i)=>{
  o.citations.push({id:"role_source_"+i,label:"Fictional reference "+i,url:"https://role"+i+".example/notice"})
  return{...base,value:{role,name:"Shared fictional organisation"},originalText:"Fictional wording for "+role,citations:["role_source_"+i]}
 })
 const rows=entries(o)
 assert.equal(rows.length,5)
 for(const [index,row] of rows.entries()){
  const html=renderToStaticMarkup(row)
  assert.match(html,/Shared fictional organisation/);assert.ok(html.includes("Fictional wording for "+roles[index]));assert.ok(html.includes("https://role"+index+".example/notice"))
  for(let other=0;other<5;other++)if(index!==other)assert.equal(html.includes("https://role"+other+".example"),false)
  assert.doesNotMatch(html,/issuer.example|snapshot_fixture|reviewer_fixture|assertion_/)
 }
 for(const label of ["Issuer","Employer or host","Training provider","Qualification issuer","Oversight body"])assert.ok(text(render(o)).includes(label))
})

test("ambiguous, conflicting and absent role entries remain unresolved without inventing a structured role",()=>{
 for(const [state,label] of [["ambiguous","Needs clarification"],["conflicting","Sources disagree"],["not_stated","Not stated"]]){
  const o=opportunity();o.organisations=[{state,value:null,originalText:state==="not_stated"?null:"Fictional role text requires clarification.",citations:state==="not_stated"?[]:["citation_fixture"]}];o.intake={...o.organisations[0]}
  const row=renderToStaticMarkup(entries(o)[0]),inventory=contextInventory(o)
  assert.ok(row.includes(label));assert.match(row,/Role not established/);assert.doesNotMatch(row,/<h4>Training provider|<h4>Qualification issuer|Named as providing training/)
  assert.equal(inventory.stated,0);assert.equal(inventory.unresolved,1)
  if(state==="not_stated"){assert.match(row,/No organisation or role is stated in this entry/);assert.match(row,/No source wording or reference recorded/);assert.doesNotMatch(row,/<details/)}
  else assert.match(row,/Fictional role text requires clarification/)
 }
})

test("missing wording and references are labelled independently, without borrowing another fact's evidence",()=>{
 for(const [originalText,citations,expected] of [[null,["citation_fixture"],"No separate wording recorded"],["Fictional unresolved wording",[],"No source reference recorded"]]){
  const o=opportunity();o.organisations=[{state:"ambiguous",value:null,originalText,citations}]
  const html=renderToStaticMarkup(entries(o)[0])
  assert.ok(html.includes(expected))
  assert.equal(html.includes('href="https://issuer.example/notice"'),citations.length>0)
 }
 const o=opportunity();o.organisations=[]
 assert.match(render(o),/No additional organisation roles are stated/)
 assert.equal(entries(o).length,0)
})

test("long Unicode names, multi-line wording and markup are retained and escaped in each source entry",()=>{
 const o=opportunity(),name="Fictional Σχολή—".repeat(70)+"<script>not executable</script>",wording="First fictional line.\nSecond fictional line. <img src=x onerror=bad>"
 o.organisations[0].value={role:"training_provider",name};o.organisations[0].originalText=wording;o.citations[0].label="<script>fictional reference</script>"
 const html=renderToStaticMarkup(entries(o)[0])
 assert.ok(html.includes(name.replaceAll("<","&lt;").replaceAll(">","&gt;")));assert.match(html,/First fictional line.\nSecond fictional line./)
 assert.match(html,/&lt;img src=x onerror=bad&gt;/);assert.match(html,/&lt;script&gt;fictional reference&lt;\/script&gt;/);assert.doesNotMatch(html,/<script>|<img src=x/)
})

test("pending intake, issuer and organisation facts do not escape the real public projection",()=>{
 const record=makeRecord("graduate_programme")
 for(const fact of [record.intake,record.issuer,...record.organisations]){fact.review="pending";fact.originalText="PRIVATE_UNREVIEWED_ROLE";if(typeof fact.value==="string")fact.value="PRIVATE_UNREVIEWED_NAME";else fact.value.name="PRIVATE_UNREVIEWED_NAME"}
 const o=projectOpportunity(record).opportunity,html=render(o)
 assert.match(html,/Issuer not established/);assert.match(html,/Role not established/);assert.match(html,/0 stated role entries/)
 assert.doesNotMatch(html,/PRIVATE_|snapshot_fixture|reviewer_fixture|assertion_|Named as issuing the notice/)
})
