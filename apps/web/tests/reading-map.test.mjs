import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { loadUi } from "./helpers/load-ui.mjs"
const require=createRequire(import.meta.url),React=require("react"),{renderToStaticMarkup}=require("react-dom/server")
const {readingSections,sectionInReadingArea,observeReadingMap}=loadUi("lib/reading-map.ts")

test("reading positions follow the largest visible reading area, preserving an unselected opening and backwards travel",()=>{
 const positions=readingSections.map((section,index)=>({id:section.id,top:500+index*700}))
 assert.equal(sectionInReadingArea(positions,100,400),null)
 assert.equal(sectionInReadingArea(positions,500,1200),"opportunity-story")
 assert.equal(sectionInReadingArea(positions,1200,1900),"preparation")
 assert.equal(sectionInReadingArea(positions,9999,11000),"evidence")
 assert.equal(sectionInReadingArea([...positions].reverse(),1201,1900),"preparation")
 assert.equal(sectionInReadingArea(positions,600,1600),"opportunity-story")
 assert.equal(sectionInReadingArea(positions,900,1600),"preparation")
 assert.equal(sectionInReadingArea([],100,200),null)
 assert.equal(sectionInReadingArea(positions,1200,700),null)
})

function observerFixture(resizeSupported=true){
 const previousWindow=globalThis.window,previousResize=globalThis.ResizeObserver
 const events=new Map(),rootEvents=new Map(),frames=new Map(),published=[],targets=new Map(readingSections.map((section,index)=>[section.id,{top:1000+index*700}]))
 let frameId=0,disconnects=0,observed=[];const geometry={bottom:160},rootGeometry={bottom:6000}
 const root={getBoundingClientRect:()=>rootGeometry,querySelector:selector=>targets.has(selector.slice(1))?{getBoundingClientRect:()=>({top:targets.get(selector.slice(1)).top})}:null,addEventListener:(name,callback,capture)=>rootEvents.set(name,{callback,capture}),removeEventListener:(name,callback,capture)=>{assert.equal(rootEvents.get(name)?.callback,callback);assert.equal(rootEvents.get(name)?.capture,capture);rootEvents.delete(name)}}
 const nav={closest:selector=>selector==="main"?root:null,getBoundingClientRect:()=>geometry}
 const fakeWindow={innerHeight:720,scrollY:100,addEventListener:(name,callback)=>events.set(name,callback),removeEventListener:(name,callback)=>{assert.equal(events.get(name),callback);events.delete(name)},requestAnimationFrame:callback=>{frames.set(++frameId,callback);return frameId},cancelAnimationFrame:id=>frames.delete(id)}
 globalThis.window=fakeWindow
 globalThis.ResizeObserver=resizeSupported?class {constructor(callback){this.callback=callback}observe(target){observed.push(target)}disconnect(){disconnects++}}:undefined
 const stop=observeReadingMap(nav,value=>published.push(value))
 return {published,targets,events,rootEvents,frames,observed,geometry,rootGeometry,flush:()=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(callback=>callback())},stop,disconnects:()=>disconnects,restore:()=>{stop();if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;if(previousResize===undefined)delete globalThis.ResizeObserver;else globalThis.ResizeObserver=previousResize}}
}

test("scroll observation coalesces events, tracks disclosures and back navigation, and cleans up pending work",()=>{
 const f=observerFixture()
 try{
  assert.equal(f.frames.size,1);f.flush();assert.deepEqual(f.published,[null])
  f.geometry.bottom=900;f.targets.get("opportunity-story").top=950
  f.events.get("resize")();f.flush();assert.deepEqual(f.published,[null]) // Below-screen content is not current.
  f.geometry.bottom=160
  f.targets.get("opportunity-story").top=-100
  f.events.get("scroll")();f.events.get("scroll")();f.events.get("resize")()
  assert.equal(f.frames.size,1);f.flush();assert.deepEqual(f.published,[null,"opportunity-story"])
  f.events.get("scroll")();f.flush();assert.equal(f.published.length,2)
  f.targets.get("preparation").top=220;f.rootEvents.get("toggle").callback();f.flush();assert.equal(f.published.at(-1),"preparation")
  f.targets.get("preparation").top=600;f.events.get("hashchange")();f.flush();assert.equal(f.published.at(-1),"opportunity-story")
  f.rootGeometry.bottom=720;f.targets.get("opportunity-story").top=-1500;f.targets.get("preparation").top=-1000;f.targets.get("your-workspace").top=-200;f.targets.get("evidence").top=400
  f.events.get("scroll")();f.flush();assert.equal(f.published.at(-1),"evidence") // A short final section need not reach the map.
  f.rootGeometry.bottom=2000;f.rootEvents.get("toggle").callback();f.flush();assert.equal(f.published.at(-1),"evidence")
  assert.equal(f.rootEvents.get("toggle").capture,true);assert.equal(f.observed.length,2)
  f.events.get("pageshow")();assert.equal(f.frames.size,1)
  f.stop();assert.equal(f.frames.size,0);assert.equal(f.events.size,0);assert.equal(f.rootEvents.size,0);assert.equal(f.disconnects(),1)
 }finally{f.restore()}
})

test("native navigation remains usable without resize observation, without a main root, and before enhancement",()=>{
 const f=observerFixture(false)
 try{f.flush();f.targets.get("opportunity-story").top=100;f.events.get("scroll")();f.flush();assert.equal(f.published.at(-1),"opportunity-story")}finally{f.restore()}
 assert.doesNotThrow(()=>observeReadingMap({closest:()=>null},()=>{throw Error("must not publish")} )())
 const {OpportunityContents}=loadUi("components/catalogue/OpportunityContents.tsx")
 const html=renderToStaticMarkup(React.createElement(OpportunityContents))
 for(const section of readingSections)assert.ok(html.includes(`href="#${section.id}"`))
 assert.match(html,/Choose where to start/);assert.doesNotMatch(html,/aria-current|<button|<progress|completed|reviewed|percent/i)
})

test("the route uses visible keyboard targets and a fresh map per notice without persisting read state",()=>{
 const source=readFileSync(new URL("../src/app/opportunities/[id]/page.tsx",import.meta.url),"utf8")
 for(const section of readingSections)assert.ok(source.includes(`id="${section.id}" tabIndex={-1}`),section.id)
 assert.match(source,/<OpportunityContents key=\{o.id\}/)
 const component=readFileSync(new URL("../src/components/catalogue/OpportunityContents.tsx",import.meta.url),"utf8")
 const observer=readFileSync(new URL("../src/lib/reading-map.ts",import.meta.url),"utf8")
 assert.match(component,/aria-current=\{active === section.id \? "location"/)
 assert.doesNotMatch(component+observer,/localStorage|indexedDB|fetch\(|pushState|replaceState|\.focus\(|\.click\(|\.scrollIntoView\(/)
})
