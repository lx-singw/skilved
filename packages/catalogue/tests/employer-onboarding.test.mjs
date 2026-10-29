import {test} from 'node:test';import assert from 'node:assert/strict';
import {OnboardingPlan,OnboardingBundle,evaluateOnboarding,onboardingPage} from '../src/employer-onboarding.mjs';
import {collectEmployerOnboarding} from '../src/employer-onboarding-collector.mjs';
import {onboardingFixture} from './fixtures/employer-onboarding.mjs';
import {mkdtemp,writeFile,readFile,rm,stat} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {collectEmployersCli,readOnboardingFile,collectEmployerWorkflow} from '../tools/collect-employers.mjs';
test('read-only capture uses three exact pages, two robots policies and paced bounded requests',async()=>{
 const f=onboardingFixture();let time=Date.parse(f.bundle.observations[0].at);const starts=[];
 const result=await collectEmployerOnboarding(f.plan,{now:()=>new Date(time).toISOString(),sleep:async ms=>{time+=ms;},fetcher:async(s,url,_io,format)=>{
  starts.push(time);assert.deepEqual(s.urls,[url]);assert.equal(s.maxBytes,500000);return{url,text:format==='text'?'User-agent: *\nAllow: /':f.pages.get(url)};}});
 assert.equal(result.requests.length,5);assert.equal(result.bundle.observations.length,3);assert.equal(result.providerCalls,0);assert.equal(result.authorityCreated,false);
 assert.ok(starts.slice(1).every((t,i)=>t-starts[i]>=3000));assert.equal(evaluateOnboarding(result.bundle).state,'awaiting_identity_review');
});
test('shared collection workflow corrects one observed careers path and never retries independent evidence',async()=>{
 const f=onboardingFixture(),candidate='https://corporate.example/about/careers',seen=[];let time=Date.parse(f.bundle.observations[0].at);
 f.pages.set(f.plan.corporateUrl,'<h1>Authored Forge</h1><p><a href="/about/careers">Careers</a></p>');
 const result=await collectEmployerWorkflow(f.plan,{now:()=>new Date(time).toISOString(),sleep:async ms=>{time+=ms;},fetcher:async(_s,url,_io,format)=>{
  seen.push(url);if(format==='text')return{url,text:'User-agent: *\nAllow: /'};
  if(url===f.plan.careersUrl){const e=new Error();e.code='UNSUPPORTED_RESPONSE';throw e;}
  return{url,text:url===candidate?f.pages.get(f.plan.careersUrl):f.pages.get(url)};
 }});
 assert.equal(result.requests.length,7);assert.equal(result.bundle.plan.careersUrl,candidate);assert.ok(result.initialBundle);
 assert.equal(seen.filter(u=>u===f.plan.identityUrl).length,1);assert.equal(seen.filter(u=>u===f.plan.corporateUrl).length,1);
 assert.deepEqual(result.bundle.observations[0],result.initialBundle.observations[0]);assert.equal(evaluateOnboarding(result.bundle).state,'awaiting_identity_review');
});
test('shared collector CLI saves a private bundle without database access and rejects oversized plan files',async()=>{
 const f=onboardingFixture(),dir=await mkdtemp(join(tmpdir(),'skilved-onboarding-'));let bundleFile;
 try{const path=join(dir,'plan.json');await writeFile(path,JSON.stringify({version:1,employers:[f.plan]}));let output;
  await collectEmployersCli([path],s=>{output=JSON.parse(s);},{sleep:async()=>{},now:()=>f.bundle.observations[0].at,fetcher:async(_s,url,_io,format)=>({url,text:format==='text'?'User-agent: *\nAllow: /':f.pages.get(url)})});
  bundleFile=output.bundleFile;assert.equal(output.authorityCreated,false);assert.equal(output.providerCalls,0);assert.equal((await readOnboardingFile(bundleFile)).version,f.bundle.version);
  assert.doesNotMatch(JSON.stringify(output),/<main>/);assert.equal((await stat(bundleFile)).mode&0o077,0);
  await writeFile(path,'x'.repeat(64001));await assert.rejects(collectEmployersCli([path]),/ONBOARDING_FILE_LIMIT/);
 }finally{if(bundleFile)await rm(bundleFile);await rm(dir,{recursive:true,force:true});}
});
test('robots restrictions and transport failures remain fixed evidence rows and never become authority',async()=>{
 const f=onboardingFixture(),seen=[];
 const result=await collectEmployerOnboarding(f.plan,{sleep:async()=>{},fetcher:async(_s,url,_io,format)=>{
  seen.push(url);if(url.startsWith('https://directory.example')){const e=new Error();e.code='FETCH_TIMEOUT';throw e;}
  return{url,text:format==='text'?'User-agent: *\nDisallow: /careers/':f.pages.get(url)};}});
 assert.equal(result.bundle.observations.length,3);assert.equal(result.bundle.observations[0].error,'FETCH_TIMEOUT');assert.equal(result.bundle.observations[2].error,'ROBOTS_DISALLOWED');
 assert.ok(!seen.includes(f.plan.identityUrl));assert.ok(!seen.includes(f.plan.careersUrl));assert.equal(evaluateOnboarding(result.bundle).state,'evidence_incomplete');
});
test('explicit saved-evidence reuse fetches only the new candidate and preserves prior failure/timestamps',async()=>{
 const f=onboardingFixture(),plan={...f.plan,careersUrl:'https://corporate.example/about/careers'},reuse=f.bundle.observations.filter(o=>o.url!==f.plan.careersUrl);
 reuse[0]={url:f.plan.identityUrl,at:reuse[0].at,error:'ROBOTS_DISALLOWED'};const seen=[];
 const result=await collectEmployerOnboarding(plan,{reuse,now:()=>f.bundle.observations[0].at,sleep:async()=>{},fetcher:async(_s,url,_io,format)=>{seen.push(url);return{url,text:format==='text'?'User-agent: *\nAllow: /':f.pages.get(f.plan.careersUrl)};}});
 assert.equal(seen.length,2);assert.ok(!seen.some(u=>u.includes('directory.example')));assert.deepEqual(result.bundle.observations[0],reuse[0]);
 assert.equal(result.bundle.observations[0].at,reuse[0].at);
 await assert.rejects(collectEmployerOnboarding(plan,{reuse,now:()=> '2026-10-31T10:00:00.000Z'}),{code:'ONBOARDING_REUSE_INVALID'});
});
test('candidate plans reject unsafe targets, shared-path corporate roots and same-origin identity evidence',()=>{
 const p=onboardingFixture().plan;
 for(const change of [{corporateUrl:'http://corporate.example/'},{corporateUrl:'https://127.0.0.1/'},{corporateUrl:'https://corporate.example/tenant/'},
  {identityUrl:'https://corporate.example/profile/'},{careersUrl:'https://other.example/careers/'},{identityUrl:p.identityUrl+'?x=1'},{needId:'bad/id'}])assert.equal(OnboardingPlan.safeParse({...p,...change}).success,false);
});
test('independent and corporate backlinks are required; hidden, script, warning and base URL claims do not qualify evidence',()=>{
 const f=onboardingFixture();assert.equal(evaluateOnboarding(f.bundle).identityAutomatic,false);
 for(const html of ['<h1>Authored Forge</h1>',`<h1>Authored Forge</h1><div hidden><a href="${f.plan.corporateUrl}">Website</a></div>`,
  `<h1>Authored Forge</h1><script><a href="${f.plan.corporateUrl}">Website</a></script>`,
  `<h1>Authored Forge</h1><p>Never use <a href="${f.plan.corporateUrl}">this fake website</a></p>`,
  `<h1>Authored Forge</h1><p><a href="${f.plan.corporateUrl}">Website</a></p><p>Avoid <a href="${f.plan.corporateUrl}">this site</a></p>`,
  `<base href="https://other.example/"><h1>Authored Forge</h1><a href="${f.plan.corporateUrl}">Website</a>`]){
  const b=structuredClone(f.bundle);b.observations[0].html=html;assert.equal(evaluateOnboarding(b).state,'evidence_incomplete');}
 const b=structuredClone(f.bundle);b.observations[1].html='<h1>Other company</h1>';assert.equal(evaluateOnboarding(b).state,'evidence_incomplete');
});
test('unobserved aliases, missing/duplicate pages and resource-bound violations stay unsupported',()=>{
 const f=onboardingFixture(),b=structuredClone(f.bundle);b.plan.aliases=['Unsupported Brand'];assert.equal(evaluateOnboarding(b).state,'evidence_incomplete');
 assert.equal(OnboardingBundle.safeParse({...f.bundle,observations:[f.bundle.observations[0],f.bundle.observations[0],f.bundle.observations[2]]}).success,false);
 assert.equal(OnboardingBundle.safeParse({...f.bundle,observations:f.bundle.observations.slice(0,2)}).success,false);
 assert.throws(()=>onboardingPage('x'.repeat(500001)),{code:'ONBOARDING_LAYOUT_UNSUPPORTED'});
 assert.throws(()=>onboardingPage('<div>'.repeat(101)+'x'+'</div>'.repeat(101)),{code:'ONBOARDING_LAYOUT_UNSUPPORTED'});
});
test('a careers menu does not inherit warnings from its child fraud-alert link and candidate URLs remain evidence only',()=>{
 const f=onboardingFixture(),b=structuredClone(f.bundle);
 b.observations[1].html=`<h1>Authored Forge</h1><nav><ul><li><a href="${f.plan.careersUrl}">Careers</a><ul><li><a href="/fraud-alert">Fraud alert</a></li></ul></li></ul></nav>`;
 const result=evaluateOnboarding(b);assert.equal(result.state,'awaiting_identity_review');assert.deepEqual(result.careersCandidates,[f.plan.careersUrl]);assert.equal(result.identityAutomatic,false);
 b.observations[1].html='<h1>Authored Forge</h1><p><a href="/about/careers">Careers</a></p>';
 const suggested=evaluateOnboarding(b);assert.equal(suggested.state,'evidence_incomplete');assert.deepEqual(suggested.careersCandidates,['https://corporate.example/about/careers']);
});
