import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import { loadUi } from "./helpers/load-ui.mjs"
const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server")
const {encodeCursor,parseReadQuery,decodeCursor}=require("@skilved/types/opportunities")
const {changeFeed,feedSelections,feedRecovery,feedResultsHeading}=loadUi("lib/feed-discovery.ts")
const {FeedResultsSummary,FeedEmptyRecovery,FeedFilters}=loadUi("components/catalogue/FeedDiscovery.tsx")
const render=(Component,props)=>renderToStaticMarkup(React.createElement(Component,props))
const params=href=>new URL(href,"https://skilved.test").searchParams

test("removing a single choice keeps every other public binding and restarts pagination",()=>{
 const input=new URLSearchParams("q=caf%C3%A9+%26+tools&category=job&province=gauteng&remote=false&field=Electrical&stage=graduate&limit=5&sort=updated_desc&cursor=old")
 const before=input.toString(),active=feedSelections(input)
 assert.equal(active.length,6)
 for(const selection of active){
  const next=params(selection.href)
  assert.equal(next.has(selection.key),false)
  assert.equal(next.has("cursor"),false)
  for(const [key,value] of input)if(key!==selection.key&&key!=="cursor")assert.equal(next.get(key),value,key)
  assert.equal(parseReadQuery(next).ok,true)
 }
 assert.equal(input.toString(),before)
 assert.ok(active.some(s=>s.label==="In person or hybrid"))
})

test("recovery widens only its named dimension and never invents result counts",()=>{
 const input=new URLSearchParams("q=engineering&category=bursary&field=Electrical&stage=student&province=gauteng&coverage=national&remote=false&limit=2&cursor=old")
 const options=feedRecovery(input)
 assert.equal(options.length,3)
 assert.equal(params(options[0].href).has("q"),false)
 assert.equal(params(options[1].href).has("field"),false)
 assert.equal(params(options[2].href).has("stage"),false)
 for(const option of options){
  const next=params(option.href)
  assert.equal(next.get("category"),"bursary")
  assert.equal(next.get("remote"),"false")
  assert.equal(next.get("limit"),"2")
  assert.equal(next.has("cursor"),false)
  assert.equal(parseReadQuery(next).ok,true)
 }
})

test("location recovery removes province, coverage and attendance together while retaining direction",()=>{
 const input=new URLSearchParams("category=job&province=gauteng&coverage=local&remote=false&limit=1&cursor=old")
 const [location,category]=feedRecovery(input),next=params(location.href)
 for(const key of ["province","coverage","remote","cursor"])assert.equal(next.has(key),false)
 assert.equal(next.get("category"),"job")
 assert.equal(next.get("limit"),"1")
 const across=params(category.href)
 assert.equal(across.has("category"),false)
 assert.equal(across.get("province"),"gauteng")
 assert.equal(across.get("remote"),"false")
})

test("unsafe and duplicate queries cannot enter recovery links or be silently repaired",()=>{
 for(const input of ["q=one&q=two","admin=true","stage=unknown","remote=yes"]){
  for(const build of [feedSelections,feedRecovery,feedResultsHeading])assert.throws(()=>build(new URLSearchParams(input)),/INVALID_QUERY/)
  assert.throws(()=>changeFeed(new URLSearchParams(input),{q:null}),/INVALID_QUERY/)
 }
 assert.throws(()=>changeFeed(new URLSearchParams(),{stage:"unknown"}),/INVALID_QUERY/)
 assert.deepEqual(feedSelections(new URLSearchParams("q=+++")),[])
 assert.deepEqual(feedRecovery(new URLSearchParams()),[])
})

test("recovery creates a fresh cursor binding and preserves literal Unicode phrase semantics",()=>{
 const input=new URLSearchParams({q:"café & tools",province:"gauteng",field:"engineering",remote:"false",limit:"2"})
 const parsed=parseReadQuery(input).query
 const old=encodeCursor(parsed,8,{id:"last_record",updatedAt:"2026-10-15T04:00:00.000Z"})
 input.set("cursor",old)
 const next=params(changeFeed(input,{field:null})),query=parseReadQuery(next).query
 assert.equal(query.q,"café & tools")
 assert.equal(query.remote,false)
 assert.equal(decodeCursor(old,query,8).ok,false)
 const fresh=encodeCursor(query,8,{id:"last_record",updatedAt:"2026-10-15T04:00:00.000Z"})
 assert.equal(decodeCursor(fresh,query,8).ok,true)
})

test("page summaries distinguish continuation and page size without claiming a catalogue total",()=>{
 const selected=new URLSearchParams("category=job&province=gauteng&cursor=old")
 const html=render(FeedResultsSummary,{selected,count:2,more:true})
 assert.match(html,/2 published notices on this page/)
 assert.match(html,/More available/)
 assert.match(html,/Continuing your search/)
 assert.match(html,/href="\/\?category=job&amp;province=gauteng"/)
 assert.doesNotMatch(html,/2 total|2 matches|cursor=old/)
 assert.match(render(FeedResultsSummary,{selected:new URLSearchParams(),count:1,more:false}),/1 published notice on this page/)
})

test("long search phrases and recovery text are escaped and form controls retain all choices without the cursor",()=>{
 const selected=new URLSearchParams({q:'<script>unsafe</script> & "phrase"',category:"bursary",province:"gauteng",remote:"false",stage:"student",field:"Engineering",limit:"5",cursor:"old"})
 const html=render(FeedFilters,{selected})+render(FeedEmptyRecovery,{selected})+render(FeedResultsSummary,{selected,count:0,more:false})
 assert.match(html,/role="search"/)
 assert.match(html,/aria-label="Search the opportunity feed"/)
 assert.match(html,/name="remote"/)
 assert.match(html,/value="false" selected=""/)
 assert.match(html,/name="limit" value="5"/)
 assert.doesNotMatch(html,/name="cursor"|<script>unsafe/)
 assert.match(html,/&lt;script&gt;unsafe&lt;\/script&gt;/)
 assert.match(html,/Remove filter: Bursaries/)
 assert.match(html,/Include every field/)
 assert.match(html,/matches your phrase in titles, issuers and summaries/)
 assert.match(html,/ignoring capitalisation/)
 assert.doesNotMatch(html,/<details[^>]+open=/)
})

test("outages offer a retry rather than a zero count or empty-search recovery",async()=>{
 const ui=loadUi("components/catalogue/PublicCatalogue.tsx",{
  "@/components/layout/Header":{Header:()=>null},
  "@/lib/public-catalogue":{readCatalogue:async()=>({kind:"error",reason:"unavailable"})},
 })
 const html=renderToStaticMarkup(await ui.PublicCatalogue({query:new URLSearchParams("q=engineering&category=bursary")}))
 assert.match(html,/The catalogue is temporarily unavailable/)
 assert.match(html,/Reload opportunities/)
 assert.doesNotMatch(html,/0 published notices|Try without the search phrase|No opportunities match/)
})
