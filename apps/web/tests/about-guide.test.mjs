import assert from "node:assert/strict"
import {createRequire} from "node:module"
import {test} from "node:test"
import {loadUi} from "./helpers/load-ui.mjs"
const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server"),{CategorySchema}=require("@skilved/types/opportunities")
const {default:AboutPage}=loadUi("app/about/page.tsx",{"@/components/layout/Header":{Header:()=>null},"next/link":{__esModule:true,default:({href,children,...props})=>React.createElement("a",{href,...props},children)}})
function nodes(tree,predicate){const out=[];function visit(node){if(Array.isArray(node))node.forEach(visit);else if(node&&typeof node==="object"){if(predicate(node))out.push(node);visit(node.props?.children)}}visit(tree);return out}
function render(enabled){const before=process.env.SKILVED_CATALOGUE_READS;try{process.env.SKILVED_CATALOGUE_READS=enabled;return renderToStaticMarkup(React.createElement(AboutPage))}finally{if(before===undefined)delete process.env.SKILVED_CATALOGUE_READS;else process.env.SKILVED_CATALOGUE_READS=before}}

test("availability follows the catalogue gate without a health claim, fabricated inventory or page-load request",()=>{
 const fetch=globalThis.fetch;let calls=0
 try{globalThis.fetch=()=>{calls++;throw Error("About must not fetch catalogue or private access")}
  const enabled=render("true"),disabled=render("false"),unset=render("")
  assert.match(enabled,/Published notices, when available/);assert.doesNotMatch(enabled,/Public browsing is unavailable here/)
  for(const html of [disabled,unset]){assert.match(html,/Public browsing is unavailable here/);assert.match(html,/browser-local Saved workspace remain available/);assert.doesNotMatch(html,/No published listings|Published notices, when available|all notices have been removed/i)}
  for(const html of [enabled,disabled])assert.doesNotMatch(html,/Live now|\d+ verified opportunities|Every opportunity is verified|demo_graduate|PRIVATE_/)
  assert.equal(calls,0)
 }finally{globalThis.fetch=fetch}
})

test("pathways use all six supported category filters and guide links resolve to visible native targets",()=>{
 const tree=AboutPage(),links=nodes(tree,n=>typeof n.props?.href==="string"),categories=links.filter(n=>n.props.href.startsWith("/?category="))
 assert.deepEqual(categories.map(n=>new URL(n.props.href,"https://skilved.example").searchParams.get("category")).sort(),[...CategorySchema.options].sort())
 const ids=new Map(nodes(tree,n=>typeof n.props?.id==="string").map(n=>[n.props.id,n]))
 for(const link of links){
  const href=link.props.href
  if(href.startsWith("#"))assert.ok(ids.has(href.slice(1)),href)
  else assert.ok(href==="/"||href==="/saved"||href==="/suggestions"||href.startsWith("/?category="),href)
 }
 for(const id of ["about-evidence-question","about-application-question"])assert.equal(ids.get(id).type,"summary")
 assert.equal(nodes(tree,n=>n.type==="main"&&n.props.id==="main-content").length,1)
 assert.equal(nodes(tree,n=>n.type==="h1").length,1)
 assert.equal(nodes(tree,n=>n.type==="form"||n.type==="input").length,0)
})

test("the guide preserves local-access, review-scope and manual-application boundaries",()=>{
 const html=render("true")
 for(const pattern of [/No account needed/,/no account backup or cross-device sync/,/Requirement review ticks are temporary/,/Each check applies to a particular question/,/does not establish that you qualify/,/You submit the application yourself/,/does not confirm submission/,/Accounts, document uploads and application assistance are not available/,/when intake is available/])assert.match(html,pattern)
 const questions=nodes(AboutPage(),n=>n.type==="details")
 assert.equal(questions.length,4);assert.ok(questions.every(n=>n.props.open===undefined))
 assert.doesNotMatch(html,/automatic applications|we apply for you|guaranteed eligibility|href="\/(auth|profile|applications|onboarding|privacy|terms)/i)
})
