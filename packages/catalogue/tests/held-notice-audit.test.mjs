import{test}from'node:test';import assert from'node:assert/strict';import{createHash}from'node:crypto';import{mkdtemp,writeFile,mkdir,symlink,rm}from'node:fs/promises';import{tmpdir}from'node:os';import{join}from'node:path';
import{auditSavedRecentJobsHolds}from'../tools/lib/held-notice-audit.mjs';import{auditRecentJobsHoldsCli}from'../tools/audit-recentjobs-holds.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');
const source={id:'audit_source',revision:3,name:'Authored private source',urls:['https://recentjobs.co.za/category/apprenticeships/'],permission:{reference:'Synthetic evidence only',method:'recentjobs_html',reuse:'Private test',reviewedAt:'2026-11-01T00:00:00.000Z'},categories:['apprenticeship'],owner:'synthetic_owner',paused:false,cadenceHours:24,maxBytes:500000,
 automation:{mode:'shadow',employerCrawl:false,undatedNotices:'reject',qualificationRef:'Synthetic only',maxArticles:10,maxModelCallsPerDay:2,minRequestIntervalMs:2000,checkTtlHours:6,issuers:[{name:'Synthetic Workshop',aliases:[],host:'employer.example',pathPrefix:'/jobs/',emailAddresses:[],evidence:'Synthetic only'}]}};
const future='<p>Closing date: 13 November 2026</p>',past='<p>Closing date: 02 November 2026</p>',link='<a href="https://employer.example/jobs/1">Apply now</a>';
function fixture(cases){
 const selected=cases.map((c,i)=>({url:`https://recentjobs.co.za/2026/11/04/authored-${i}/`,title:c.title??`Authored apprenticeship ${i}`}));
 const observations=cases.map((c,i)=>{const html=`<article class="type-post"><h1 class="entry-title">${selected[i].title}</h1><div class="entry-content">${c.body}</div></article>${c.outside??''}`;return{url:selected[i].url,retrievedAt:'2026-11-04T00:00:03.000Z',html,sha256:digest(html)};});
 const outcomes=cases.map((c,i)=>({jobId:'job_'+i,url:selected[i].url,startedAt:'2026-11-04T00:00:02.000Z',completedAt:'2026-11-04T00:00:04.000Z',state:c.state??'exception',reason:c.reason??'NOTICE_PRECISION_UNSUPPORTED',...(c.original?{original:c.original}:{})}));
 return{version:1,observedAt:'2026-11-04T00:00:05.000Z',source:structuredClone(source),selection:{frozenAt:'2026-11-04T00:00:01.000Z',sourceId:source.id,sourceRevision:3,selected},observations,outcomes};
}
test('audit keeps a frozen ordered denominator and distinguishes source holds, authority and pending AI',()=>{
 const f=fixture([{body:past+link,reason:'NOTICE_NOT_OPEN'},
  {body:future+link},{body:future+link,reason:'ORIGINAL_NOTICE_UNSUPPORTED',original:{outcome:'unsupported',reason:'ORIGIN_UNQUALIFIED'}},
  {body:future+link,state:'pending',reason:'MODEL_BUDGET_EXHAUSTED'}]);
 f.observations[1].html=f.observations[1].html.replace(future,'');f.observations[1].sha256=digest(f.observations[1].html);
 const original=structuredClone(f),r=auditSavedRecentJobsHolds(f);assert.equal(r.summary.selected,4);assert.equal(r.summary.held,3);assert.equal(r.summary.pending,1);
 assert.deepEqual(r.rows.map(r=>r.finding),['supported_publisher_date_hold','publisher_date_not_supplied','employer_authority_unqualified','pipeline_quota_deferred']);
 assert.equal(r.summary.findings.employer_authority_unqualified,1);assert.equal(r.qualification,false);assert.equal(r.publication,false);assert.equal(r.networkRequests,0);assert.equal(r.providerCalls,0);assert.equal(r.cloudWrites,0);assert.deepEqual(f,original);
 assert.equal(auditSavedRecentJobsHolds({...f,observations:[...f.observations].reverse(),outcomes:[...f.outcomes].reverse()}).inputSha256,r.inputSha256);
});
test('precision holds distinguish missing routes from absent and explicitly unspecified dates',()=>{
 const f=fixture([{body:future},{body:link},{body:'<p>Closing date: Not specified</p>'+link}]),r=auditSavedRecentJobsHolds(f);
 assert.equal(r.summary.precisionRouteMissing,1);assert.equal(r.summary.precisionDateOnly,2);assert.equal(r.summary.absentOrUnspecifiedDates,2);
 assert.deepEqual(r.rows.map(r=>r.deadline.status),['future','absent','explicitly_unspecified']);
});
test('labelled email blocks are diagnostic hints; bare poster/contact addresses do not become routes',()=>{
 const r=auditSavedRecentJobsHolds(fixture([{body:future+'<h2>How to apply</h2><p>Email application</p><p>APPLICATION EMAIL</p><p>apply@employer.example</p>'},
  {body:'<p>Email on your supplied poster: poster@employer.example.</p><p>The age requirement needs confirmation.</p>'},
  {body:'<h2>How to apply</h2><p>Enquiries</p><p>APPLICATION EMAIL</p><p>help@employer.example</p>'}]));
 assert.equal(r.rows[0].finding,'labelled_email_parser_gap');assert.equal(r.rows[0].routeCount,0);assert.equal(r.rows[0].routeHints[0].destination,'apply@employer.example');assert.equal(r.rows[0].routeHints[0].qualified,false);
 assert.equal(r.rows[1].finding,'incomplete_application_evidence');assert.ok(r.rows[1].secondary.includes('source_flags_uncertainty'));
 assert.ok(r.rows[1].routeHints.every(h=>h.kind==='unqualified_email_mention'));assert.equal(r.rows[2].finding,'incomplete_application_evidence');
});
test('only an application footer inside the selected notice body becomes a missing-route hint',()=>{
 const footer='<footer><a href="https://employer.example/jobs/2">Apply now online</a></footer>';
 const r=auditSavedRecentJobsHolds(fixture([{body:future+footer},{body:future,outside:footer},
  {body:future+'<footer><nav>'+link+'</nav></footer>'},{body:future+'<footer><a href="https://127.0.0.1/jobs/1">Apply now</a></footer>'},
  {body:future+'<footer><a href="https://employer.example/jobs/2">Apply now Join our WhatsApp group</a></footer>'},
  {body:future+'<footer><a href="https://employer.example/jobs/2"><script>Apply now</script></a></footer>'}]));
 assert.equal(r.rows[0].finding,'bound_footer_parser_gap');assert.equal(r.rows[0].routeHints[0].scope,'footer_inside_selected_notice_body');assert.equal(r.rows[0].routeHints[0].qualified,false);
 for(const row of r.rows.slice(1))assert.ok(!row.routeHints.some(h=>h.kind==='application_link_in_notice_footer'));
});
test('secondary elapsed dates survive category-first holds without claiming employer closure',()=>{
 const r=auditSavedRecentJobsHolds(fixture([{body:past+'<p>Join our internship programme!</p>'+link,reason:'NOTICE_CATEGORY_CONFLICT'},
  {title:'Authored work integrated learner',body:past+link,reason:'NOTICE_CATEGORY_REVIEW_REQUIRED'}]));
 assert.equal(r.summary.elapsedPublisherDates,2);assert.ok(r.rows.every(r=>r.finding==='supported_source_category_hold'));
 assert.ok(r.rows.every(r=>r.deadline.employerClosureVerified===false));
 const day=auditSavedRecentJobsHolds(fixture([{body:'<p>Closing date: 04 November 2026</p>'+link,reason:'NOTICE_NOT_OPEN'}]));
 assert.equal(day.rows[0].deadline.status,'closing_day');assert.equal(day.summary.elapsedPublisherDates,0);
});
test('duplicate equal dates remain one date; conflicts and weekday mismatches remain unresolved',()=>{
 const r=auditSavedRecentJobsHolds(fixture([{body:future+future+link,state:'pending',reason:'MODEL_BUDGET_EXHAUSTED'},
  {body:future+'<p>Closing date: 14 November 2026</p>'+link},{body:'<p>Closing date: Thursday, 13 November 2026</p>'+link}]));
 assert.equal(r.rows[0].deadline.status,'future');assert.equal(r.rows[0].deadline.dates.length,1);assert.equal(r.rows[1].deadline.status,'conflicting');assert.equal(r.rows[2].deadline.status,'unresolved');
});
test('missing observations/outcomes stay in the denominator; hashes, selection and time bindings reject tampering',()=>{
 const f=fixture([{body:future+link}]),r=auditSavedRecentJobsHolds({...f,observations:[],outcomes:[]});assert.equal(r.summary.selected,1);assert.equal(r.rows[0].finding,'outcome_missing');
 for(const mutate of [x=>{x.observations[0].html+='tampered';},x=>{x.observations[0].sha256=undefined;},
  x=>{x.selection.selected.push(x.selection.selected[0]);},x=>{x.outcomes.push(x.outcomes[0]);},
  x=>{x.outcomes[0].startedAt='2026-11-04T00:00:00.000Z';},x=>{x.selection.sourceRevision=4;},
  x=>{x.observations[0].url='https://recentjobs.co.za/2026/11/04/unselected/';}]){const input=structuredClone(f);mutate(input);assert.throws(()=>auditSavedRecentJobsHolds(input));}
 const changed=structuredClone(f);changed.outcomes[0].contentHash='a'.repeat(64);assert.equal(auditSavedRecentJobsHolds(changed).rows[0].contentHashMatchesRecorded,false);
});
test('job-board and talent-pool evidence add review flags rather than asserting original methods or vacancies',()=>{
 const r=auditSavedRecentJobsHolds(fixture([{body:'<p>We are building a database of young people.</p><a href="https://za.indeed.com/viewjob?jk=authored">Apply now</a>'}]));
 assert.ok(r.rows[0].secondary.includes('talent_pool_language_needs_review'));assert.ok(r.rows[0].secondary.includes('job_board_method_needs_corroboration'));assert.equal(r.rows[0].routes[0].qualified,false);
});
test('CLI uses bounded local files, keeps raw values out of stdout and rejects escaping paths and symlinks',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'skilved-held-audit-')),bundle=join(directory,'bundle');await mkdir(bundle);const f=fixture([{body:future+'<p>DO_NOT_PRINT_SOURCE_BODY</p>'+link,state:'pending',reason:'MODEL_BUDGET_EXHAUSTED'}]);
 const manifest={version:1,observedAt:f.observedAt,sourcePath:'source.json',selectionPath:'selection.json',outcomesPath:'outcomes.json',observations:f.observations.map(({html,...o},i)=>({...o,htmlPath:`notice-${i}.html`}))};
 try{await Promise.all([['source.json',JSON.stringify(f.source)],['selection.json',JSON.stringify(f.selection)],['outcomes.json',JSON.stringify(f.outcomes)],['manifest.json',JSON.stringify(manifest)],['notice-0.html',f.observations[0].html]].map(([p,text])=>writeFile(join(bundle,p),text)));
  const output=[];await auditRecentJobsHoldsCli([join(bundle,'manifest.json')],x=>output.push(x));assert.equal(JSON.parse(output[0]).summary.selected,1);assert.doesNotMatch(output[0],/DO_NOT_PRINT_SOURCE_BODY|Synthetic Workshop|employer\.example/);
  await writeFile(join(directory,'outside.json'),JSON.stringify(f.source));manifest.sourcePath='../outside.json';await writeFile(join(bundle,'manifest.json'),JSON.stringify(manifest));await assert.rejects(auditRecentJobsHoldsCli([join(bundle,'manifest.json')],()=>{}),/HOLD_AUDIT_PATH_OUTSIDE_BUNDLE/);
  await symlink(join(directory,'outside.json'),join(bundle,'escape.json'));manifest.sourcePath='escape.json';await writeFile(join(bundle,'manifest.json'),JSON.stringify(manifest));await assert.rejects(auditRecentJobsHoldsCli([join(bundle,'manifest.json')],()=>{}),/HOLD_AUDIT_PATH_OUTSIDE_BUNDLE/);
 }finally{await rm(directory,{recursive:true,force:true});}
});
