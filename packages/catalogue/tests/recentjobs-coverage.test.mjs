import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildRecentJobsCoverage,primaryFormatDiagnostic} from '../src/recentjobs-coverage.mjs';
import {parsePrimaryJobPosting} from '../src/adapters/primary-jobposting.mjs';
import {assessCoverageCli} from '../tools/assess-recentjobs-coverage.mjs';
import {RECENTJOBS_INDEX} from '../src/worker-policy.mjs';
import {originalFixture} from './fixtures/original-notices.mjs';
const microdata=`<div itemscope itemtype="http://schema.org/JobPosting"><meta itemprop="hiringOrganization" content="DO_NOT_COPY_SOURCE_VALUES"><h1 itemprop="title">Authored role</h1><span itemprop="description">Authored conditions</span><meta itemprop="validThrough" content="2026-10-30"><span itemprop="jobLocation" itemscope itemtype="https://schema.org/Place"><meta itemprop="name" content="Authored place"></span></div>`;
function fixture(){const cases=[0,1].map(i=>originalFixture({slug:`authored-coverage-${i}`,path:`/tenant-a/job/${i+100}/`}));
 const listing={url:RECENTJOBS_INDEX,html:`<div class="articles-wrap">${cases.map(c=>`<article class="type-post"><h2 class="entry-title"><a href="${c.detailUrl}">${c.candidate.title}</a></h2></article>`).join('')}</div>`};
 return{cases,input:{observedAt:'2026-10-29T10:00:00.000Z',listing,notices:cases.map(c=>({url:c.detailUrl,html:c.detailHtml})),portals:cases.map(c=>({url:c.url,html:c.observation.text}))}};}
test('coverage freezes publisher order and reports format support without qualifying authority or publication',()=>{
 const f=fixture(),r=buildRecentJobsCoverage(f.input);assert.equal(r.summary.selected,2);assert.equal(r.summary.sourceEligible,2);assert.equal(r.summary.jsonldSupported,2);
 assert.deepEqual(r.rows.map(r=>r.url),f.cases.map(c=>c.detailUrl));assert.ok(r.rows.every(r=>r.stage==='authority'&&r.reason==='AUTHORITY_NOT_ASSESSED'));
 assert.equal(r.qualification,false);assert.equal(r.publication,false);assert.equal(r.providerCalls,0);assert.equal(r.networkRequests,0);
 assert.equal(buildRecentJobsCoverage({...f.input,notices:[...f.input.notices].reverse()}).inputSha256,r.inputSha256);
});
test('missing, failed and malformed detail observations remain in the denominator',()=>{
 const f=fixture();f.input.notices=[];f.input.portals=[];let r=buildRecentJobsCoverage(f.input);assert.equal(r.summary.selected,2);assert.equal(r.summary.detailsParsed,0);
 assert.ok(r.rows.every(r=>r.reason==='DETAIL_OBSERVATION_MISSING'));
 f.input.notices=[{url:f.cases[0].detailUrl,error:'FETCH_TIMEOUT'},{url:f.cases[1].detailUrl,html:'<h1>Changed layout</h1>'}];r=buildRecentJobsCoverage(f.input);
 assert.equal(r.summary.selected,2);assert.equal(r.rows[0].reason,'FETCH_TIMEOUT');assert.equal(r.rows[1].blocker,'publisher_layout');
});
test('closing-day policy and an elapsed publisher date are distinct from employer closure',()=>{
 const f=fixture();f.input.portals=[];f.input.notices[0].html=f.input.notices[0].html.replace('30 October 2026','29 October 2026');f.input.notices[1].html=f.input.notices[1].html.replace('30 October 2026','28 October 2026');
 const r=buildRecentJobsCoverage(f.input);assert.equal(r.summary.sourceEligible,0);assert.equal(r.summary.blockers.publisher_closing_day_hold,1);assert.equal(r.summary.blockers.publisher_deadline_elapsed,1);
});
test('missing dates and missing routes are counted separately rather than collapsed into one precision claim',()=>{
 const f=fixture();f.input.portals=[];f.input.notices[0].html=f.input.notices[0].html.replace(/<p>Closing date:.*?<\/p>/,'');f.input.notices[1].html=f.input.notices[1].html.replace(/<a href=.*?<\/a>/,'');
 const r=buildRecentJobsCoverage(f.input);assert.equal(r.summary.blockers.deadline_absent,1);assert.equal(r.summary.blockers.application_route_missing,1);
});
test('eligible email methods and supported microdata still need independent method/authority qualification',()=>{
 const f=fixture();f.input.notices[0].html=f.input.notices[0].html.replace(f.cases[0].url,'mailto:apply@authored.example');f.input.portals=[{url:f.cases[1].url,html:microdata}];
 const r=buildRecentJobsCoverage(f.input);assert.equal(r.summary.eligibleEmails,1);assert.equal(r.summary.eligiblePortals,1);assert.equal(r.summary.microdataDetected,1);
 assert.equal(r.rows[0].reason,'METHOD_UNSUPPORTED');assert.equal(r.rows[1].reason,'AUTHORITY_NOT_ASSESSED');assert.equal(r.summary.microdataSupported,1);
});
test('microdata diagnostics expose property names without asserting authority and reject mixed representations',()=>{
 const r=primaryFormatDiagnostic(microdata);assert.equal(r.kind,'microdata_jobposting');assert.deepEqual(r.propertyMarkers,['description','hiringOrganization','jobLocation','title','validThrough']);
 assert.doesNotMatch(JSON.stringify(r),/DO_NOT_COPY_SOURCE_VALUES|Authored conditions/);assert.equal(r.supported,true);assert.equal(parsePrimaryJobPosting(microdata).title,'Authored role');
 assert.equal(primaryFormatDiagnostic(microdata+microdata).kind,'multiple_microdata_postings');
 assert.equal(primaryFormatDiagnostic(fixture().cases[0].observation.text+microdata).supported,false);
 assert.equal(primaryFormatDiagnostic('x'.repeat(500001)).reason,'PRIMARY_BODY_LIMIT');
});
test('duplicate, out-of-cohort and unused portal inputs cannot alter the ordered cohort silently',()=>{
 const f=fixture();assert.throws(()=>buildRecentJobsCoverage({...f.input,notices:[f.input.notices[0],f.input.notices[0]]}),/COVERAGE_DUPLICATE_OBSERVATION/);
 assert.throws(()=>buildRecentJobsCoverage({...f.input,limit:1}),/COVERAGE_UNSELECTED_OBSERVATION/);
 assert.throws(()=>buildRecentJobsCoverage({...f.input,portals:[{url:'https://other.example/',html:microdata}]}),/COVERAGE_UNSELECTED_PORTAL/);
 assert.throws(()=>buildRecentJobsCoverage({...f.input,qualification:true}));
});
test('offline CLI keeps saved bodies in the private bundle and writes only a private diagnostic report',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'skilved-coverage-'));let reportPath;
 try{const f=fixture(),c=f.cases[0];await writeFile(join(dir,'list.html'),f.input.listing.html);await writeFile(join(dir,'detail.html'),c.detailHtml);await writeFile(join(dir,'portal.html'),microdata);
  const manifest={version:1,observedAt:f.input.observedAt,limit:1,listing:{url:RECENTJOBS_INDEX,htmlPath:'list.html'},notices:[{url:c.detailUrl,htmlPath:'detail.html'}],portals:[{url:c.url,htmlPath:'portal.html'}]};
  await writeFile(join(dir,'manifest.json'),JSON.stringify(manifest));let output;const result=await assessCoverageCli([join(dir,'manifest.json')],value=>{output=JSON.parse(value);});reportPath=output.report;
  assert.equal(result.summary.microdataDetected,1);assert.equal(JSON.parse(await readFile(reportPath,'utf8')).qualification,false);assert.doesNotMatch(JSON.stringify(output),/Authored conditions|DO_NOT_COPY_SOURCE_VALUES/);
  await mkdir(join(dir,'bundle'));await symlink(join(dir,'list.html'),join(dir,'bundle','escaped.html'));
  await writeFile(join(dir,'bundle','manifest.json'),JSON.stringify({...manifest,listing:{url:RECENTJOBS_INDEX,htmlPath:'escaped.html'},notices:[],portals:[]}));
  await assert.rejects(assessCoverageCli([join(dir,'bundle','manifest.json')]),/COVERAGE_PATH_OUTSIDE_BUNDLE/);
 }finally{if(reportPath)await rm(reportPath);await rm(dir,{recursive:true,force:true});}
});
