import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {parseRecentJobsDetail,parseRecentJobsList,RECENTJOBS_ADAPTER,RECENTJOBS_BOUND_DETAIL_ADAPTER} from '../src/adapters/recentjobs.mjs';
import {planRecentJobsProgrammes} from '../src/adapters/recentjobs-programmes.mjs';import {preflightCandidate} from '../src/worker-policy.mjs';
import {boundDetail,boundDetailUrl as url,boundIntroduction,boundRequirement,boundBody} from './fixtures/recentjobs-bound-detail.mjs';
const parse=html=>parseRecentJobsDetail({html,url,observedOn:'2026-09-26'}),held=html=>assert.throws(()=>parse(html),/RECENTJOBS_LAYOUT_CHANGED/);

test('canonical and WordPress identity bind one outer notice, preserving introduction and nested conditions exactly once',()=>{
 const html=boundDetail(),result=parse(html),lines=result.sourceText.split('\n');assert.equal(result.adapter,RECENTJOBS_BOUND_DETAIL_ADAPTER);
 assert.equal(result.title,'Fictional electrical apprentice');assert.equal(lines[0],boundIntroduction);assert.equal(lines.filter(l=>l===boundRequirement).length,1);
 assert.equal(result.sourceText,[boundIntroduction,boundRequirement,'Closing date: 30 October 2026','Apply now'].join('\n'));
 assert.equal(result.sourcePublishedAtRaw,'2026-09-26T10:00:00+02:00');assert.deepEqual(result.applicationCandidates,[{method:'portal',destination:'https://employer.example/apply',originalText:'Apply now',check:'pending'}]);
 assert.deepEqual(result.deadlineCandidates,[{originalText:'Closing date: 30 October 2026',localDate:'2026-10-30',timezone:null}]);assert.doesNotMatch(result.sourceText,/Sidebar|2099|wrong/);assert.equal(result.review,'pending');assert.equal('publication' in result,false);assert.equal(html,boundDetail());
});

test('page identity must agree across canonical URL, body post id, outer id/class and the unique main element',()=>{
 const html=boundDetail();for(const change of [
  s=>s.replace(/<link rel="canonical"[^>]+>/,''),s=>s.replace('href="'+url+'"','href=""'),s=>s.replace('href="'+url+'"',''),
  s=>s.replace(url,'https://recentjobs.co.za/2026/09/26/different-notice/'),s=>s.replace(url,'https://evil.example/notice/'),s=>s.replace(url,url+'?redirect=other'),
  s=>s.replace('</head>','<link rel="canonical" href="'+url+'"></head>'),s=>s.replace('postid-123','postid-999'),s=>s.replace('postid-123','postid-123 postid-999'),
  s=>s.replace('postid-123',''),s=>s.replace('single-post','archive'),s=>s.replace('id="post-123"','id="post-999"'),s=>s.replace('post post-123 type-post','post post-999 type-post'),
  s=>s.replace('id="main"','id="other"'),s=>s.replace('class="site-main"','class="other"'),s=>s.replace('<article id="post-123"','<div><article id="post-123"'),
 ])held(change(html));
 assert.equal(parse(html.replace(url,'/2026/09/26/fictional-apprentice/')).sourceText,parse(html).sourceText);
});

test('unfamiliar nesting, extra content containers and additional posts preserve ambiguity holds',()=>{
 const html=boundDetail();for(const change of [
  s=>s.replace('sensy-entry','unrelated-entry'),s=>s.replace('<section class="sensy-shell">','<section class="unrelated-shell">'),s=>s.replace('<section class="sensy-shell">','<section class="sensy-shell"><section class="sensy-shell">'),
  s=>s.replace('<section class="sensy-shell">','<div class="sensy-shell">'),s=>s.replace('<section class="sensy-shell">','<div><section class="sensy-shell">'),
  s=>s.replace('<div class="entry-content mt-5">','<div class="entry-content mt-5"><div class="entry-content">'),
  s=>s.replace('<div class="entry-content mt-5">','<div class="other">'),
  s=>s.replace('</main>','<article class="type-post"><div class="entry-content">Another job</div></article></main>'),
  s=>s.replace('<p>'+boundRequirement+'</p>','<article class="blog-post"><p>Another notice</p></article>'),
 ])held(change(html));
 const independent=html.replace('<article class="post post-456 type-post sensy-entry">','<article class="post post-456 type-post sensy-entry"><h1>Another notice</h1>');held(independent);
});

test('nested independent headings, post headers or publication times cannot masquerade as the unheaded wrapper',()=>{
 for(const identity of ['<h1>Other role</h1>','<h2 class="entry-title">Other role</h2>','<header class="entry-header">Other notice</header>','<time class="published">20 September 2026</time>'])
  held(boundDetail().replace('<div class="entry-content mt-5">','<div class="entry-content mt-5">'+identity));
 held(boundDetail().replace('<h1 class="entry-title">Fictional electrical apprentice</h1>',''));
});

test('ignored assets, forms, sharing and sidebars cannot contribute conditions, dates or application links',()=>{
 const ignored='<script>globalThis.BOUND_PWNED=true</script><style>HIDDEN_STYLE</style><form><h1>FORM_NOTICE</h1><p>Closing date: 1 January 2099</p><a href="https://other.example/apply">Apply</a></form><div class="addtoany_content"><a href="https://share.example/apply">Apply SHARE</a></div>';
 const result=parse(boundDetail({introduction:'<p>'+boundIntroduction+'</p><p>Do not send applications to enquiries@example.test</p>',body:ignored+boundBody}));
 assert.equal(globalThis.BOUND_PWNED,undefined);assert.doesNotMatch(result.sourceText,/BOUND_PWNED|HIDDEN_STYLE|FORM_NOTICE|2099|SHARE/);assert.equal(result.applicationCandidates.length,1);assert.equal(result.applicationCandidates[0].destination,'https://employer.example/apply');assert.equal(result.deadlineCandidates.length,1);
});

test('bound parsing discovers the original portal but does not invent a deadline or promote a bare contact email',()=>{
 const body='<p>'+boundRequirement+'</p><p>Possible training commencement in October 2026.</p><a href="https://employer.example/apply">Apply now</a><h3>Email:sales@example.test</h3>',candidate=parse(boundDetail({body}));
 assert.deepEqual(candidate.deadlineCandidates,[]);assert.ok(candidate.issues.includes('deadline_needs_review'));assert.equal(candidate.applicationCandidates.length,1);assert.equal(candidate.applicationCandidates[0].method,'portal');assert.ok(candidate.sourceText.includes('Email:sales@example.test'));
 assert.throws(()=>preflightCandidate({automation:{issuers:[{host:'employer.example',pathPrefix:'/apply'}]}},candidate,'2026-09-26T10:00:00.000Z'),/NOTICE_PRECISION_UNSUPPORTED/);
 const noRoute=parse(boundDetail({body:body.replace('<a href="https://employer.example/apply">Apply now</a>','')}));assert.deepEqual(noRoute.applicationCandidates,[]);assert.ok(noRoute.issues.includes('application_route_missing'));
});

test('legacy detail fingerprints remain unchanged, while the new bound format has its own adapter identity',()=>{
 const classic='<article class="type-post"><h1 class="entry-title">Fictional electrical apprentice</h1><time class="published" datetime="2026-09-26T10:00:00+02:00"></time><div class="entry-content"><p>'+boundIntroduction+'</p>'+boundBody+'</div></article>',a=parse(classic),b=parse(boundDetail());
 assert.equal(a.adapter,RECENTJOBS_ADAPTER);assert.equal(b.adapter,RECENTJOBS_BOUND_DETAIL_ADAPTER);assert.equal(a.sourceText,b.sourceText);assert.equal(a.sourceRecordId,b.sourceRecordId);assert.notEqual(a.contentHash,b.contentHash);
 assert.equal(parse(boundDetail({body:boundBody.replace('N3','N6')})).contentHash===b.contentHash,false);assert.equal(parse(boundDetail({introduction:'<p>A changed source introduction.</p>'})).contentHash===b.contentHash,false);
 assert.equal(parse(boundDetail({body:boundBody+'<script>volatile=123</script>'})).contentHash,b.contentHash);
});

test('source URL, content and tree bounds still apply to the newly bound structure',()=>{
 assert.throws(()=>parseRecentJobsDetail({html:boundDetail(),url:url+'?redirect=other'}),/RECENTJOBS_UNSAFE_SOURCE_URL/);
 assert.throws(()=>parse(boundDetail({body:'A'.repeat(21000)})),/RECENTJOBS_CONTENT_LIMIT/);assert.throws(()=>parse(boundDetail({body:'A'.repeat(500001)})),/RECENTJOBS_BODY_LIMIT/);
 assert.throws(()=>parse(boundDetail({body:'<div>'.repeat(110)+'text'+'</div>'.repeat(110)})),/RECENTJOBS_TREE_LIMIT/);
});

test('programme planning accepts the bound adapter with original scoped passages and rejects unknown adapter versions',async()=>{
 const original=await readFile(new URL('./fixtures/recentjobs-programmes.html',import.meta.url),'utf8'),body=original.match(/<div class="entry-content">([\s\S]*?)<\/div>/)[1],candidate=parse(boundDetail({title:'Fictional Workshop apprenticeships and experiential programme',introduction:'',body})),plan=planRecentJobsProgrammes(candidate);
 assert.equal(plan.state,'review_required');assert.equal(plan.intakes.length,2);assert.ok(plan.intakes.every(i=>i.application.method==='email'));assert.equal(plan.source.contentHash,candidate.contentHash);
 assert.throws(()=>planRecentJobsProgrammes({...candidate,adapter:'recentjobs_html_unknown'}),/PROGRAMME_INPUT_INVALID/);
});

test('category listing discovery retains its existing adapter and pagination behavior',()=>{
 const listUrl='https://recentjobs.co.za/category/apprenticeships/',html='<div class="articles-wrap"><article class="type-post"><h2 class="entry-title"><a href="'+url+'">Fictional apprenticeship</a></h2></article></div><nav class="posts-navigation"><a href="/category/apprenticeships/page/2/">Older posts</a></nav>',result=parseRecentJobsList({html,url:listUrl});assert.equal(result.adapter,RECENTJOBS_ADAPTER);assert.equal(result.articles[0].sourceUrl,url);assert.equal(result.nextPage,listUrl+'page/2/');
});
