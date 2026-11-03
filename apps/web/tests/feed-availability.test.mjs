import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import { loadUi } from "./helpers/load-ui.mjs"
const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server")
const link={__esModule:true,default:({href,children,...props})=>React.createElement("a",{href,...props},children)}
const {FeedRecovery}=loadUi("components/catalogue/FeedRecovery.tsx",{"next/link":link})
function nodes(tree,predicate){const result=[];function visit(node){if(Array.isArray(node))node.forEach(visit);else if(node&&typeof node==="object"){if(predicate(node))result.push(node);visit(node.props?.children)}}visit(tree);return result}
const primary=tree=>nodes(tree,node=>node.props?.className==="primary-button")[0]

test("disabled access, failed reads and an empty successful response remain distinct without fabricated inventory or freshness",async()=>{
 let result={kind:"error",reason:"unavailable"}
 const {PublicCatalogue}=loadUi("components/catalogue/PublicCatalogue.tsx",{"next/link":link,"@/components/layout/Header":{Header:()=>null},"@/lib/public-catalogue":{readCatalogue:async()=>result}})
 const query=new URLSearchParams("category=graduate_programme&province=gauteng")
 const disabled=renderToStaticMarkup(await PublicCatalogue({query,readsDisabled:true}))
 assert.match(disabled,/Public browsing is unavailable here/);assert.match(disabled,/href="\/about"/)
 assert.doesNotMatch(disabled,/No published opportunities|No opportunities match|no published listings yet|0 published notices|Recently updated|Reload opportunities/)
 const outage=renderToStaticMarkup(await PublicCatalogue({query,readsDisabled:false}))
 assert.match(outage,/Your feed couldn’t load this time/);assert.match(outage,/Reload opportunities/)
 assert.doesNotMatch(outage,/Public browsing is unavailable here|0 published notices|No opportunities match|Recently updated/)
 result={kind:"page",page:{items:[],nextCursor:null}}
 const empty=renderToStaticMarkup(await PublicCatalogue({query,readsDisabled:false}))
 assert.match(empty,/0 published notices on this page/);assert.match(empty,/No opportunities match these filters/)
 assert.doesNotMatch(empty,/feed-recovery-file|Public browsing is unavailable here|couldn’t load this time/)
})

test("outage retry uses a full same-query request while continuation recovery removes only the cursor",()=>{
 const query=new URLSearchParams("q=engineering&category=bursary&province=gauteng&remote=false&limit=5&cursor=opaque_old")
 const retry=primary(FeedRecovery({query,reason:"unavailable"}))
 assert.equal(retry.type,"a");assert.equal(retry.props.href,"/?"+query.toString());assert.equal(retry.props.onClick,undefined)
 for(const reason of ["stale_cursor","invalid_cursor"]){
  const restart=primary(FeedRecovery({query,reason})),url=new URL(restart.props.href,"https://skilved.example")
  assert.notEqual(restart.type,"a") // A different route can use normal client navigation.
  assert.equal(url.searchParams.has("cursor"),false)
  for(const key of ["q","category","province","remote","limit"])assert.equal(url.searchParams.get(key),query.get(key))
 }
 assert.equal(query.get("cursor"),"opaque_old")
})

test("unreadable query choices take precedence over disabled access and cannot be reflected into recovery URLs",()=>{
 for(const query of [new URLSearchParams("category=job&category=bursary"),new URLSearchParams("private_token=PRIVATE_SENTINEL"),new URLSearchParams("category=not_supported&cursor=old")]){
  const tree=FeedRecovery({query,reason:"unavailable",readsDisabled:true}),html=renderToStaticMarkup(tree)
  assert.equal(primary(tree).props.href,"/")
  assert.match(html,/These filters could not be read/);assert.doesNotMatch(html,/PRIVATE_SENTINEL|private_token|not_supported|Public browsing is unavailable here|cursor=old/)
 }
})

test("every recovery state offers real public exits with local-storage limits and no background action",()=>{
 const previous=globalThis.fetch;let requests=0
 try{
  globalThis.fetch=()=>{requests++;throw Error("Rendering recovery must not fetch")}
  for(const state of ["disabled","unavailable","stale_cursor","invalid_cursor","invalid_query"]){
   const tree=FeedRecovery({query:new URLSearchParams(),reason:state==="disabled"?"unavailable":state,readsDisabled:state==="disabled"}),html=renderToStaticMarkup(tree)
   assert.equal(nodes(tree,node=>node.type==="h2"&&node.props.id==="feed-recovery-heading").length,1)
   assert.ok(nodes(tree,node=>node.props?.href==="/saved").length)
   assert.match(html,/no account backup or cross-device sync/)
   assert.doesNotMatch(html,/<form|<input|<button|\/auth|\/profile|application submitted|automatically retry|guaranteed/i)
  }
  assert.equal(requests,0)
 }finally{globalThis.fetch=previous}
})
