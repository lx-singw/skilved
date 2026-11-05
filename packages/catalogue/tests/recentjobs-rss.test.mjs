import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseRecentJobsRss,reviewRecentJobsRssItem,RECENTJOBS_CATEGORY_FEED as url} from '../src/adapters/recentjobs-rss.mjs';
const sha=value=>createHash('sha256').update(value).digest('hex');
const source={permission:{method:'recentjobs_html'},automation:{mode:'shadow'}};
const body='<p>Grade 12 with Mathematics OR N3 Electrical</p><p>Closing date: 15 November 2026</p><p>Email a CV to training@issuer.example</p>';
const encode=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function item({id=11,title='Authored electrical apprenticeship',path='authored-electrical',content=body,published='Thu, 05 Nov 2026 08:00:00 +0000',categories='<category><![CDATA[Apprenticeships]]></category>'}={}){
 return `<item><title>${encode(title)}</title><link>https://recentjobs.co.za/2026/11/05/${path}/</link><guid isPermaLink="false">https://recentjobs.co.za/?p=${id}</guid><pubDate>${published}</pubDate>${categories}<description>Summary only.</description><content:encoded><![CDATA[${content}]]></content:encoded></item>`;
}
const feed=(items=item())=>`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Authored category feed</title><link>https://recentjobs.co.za</link><atom:link href="${url}" rel="self" type="application/rss+xml"/><lastBuildDate>Thu, 05 Nov 2026 12:00:00 +0000</lastBuildDate>${items}</channel></rss>`;
test('publisher RSS preserves full item content, canonical notice identities and original/normalized dates',()=>{
 const parsed=parseRecentJobsRss({xml:feed(),url});assert.equal(parsed.items.length,1);assert.equal(parsed.publication,false);assert.equal(parsed.coverage,'feed_window_only');
 const first=parsed.items[0];assert.equal(first.contentHtml,body);assert.equal(first.sourceRecordId,sha(first.sourceUrl));assert.equal(first.publishedAt,'2026-11-05T08:00:00.000Z');assert.equal(first.publishedAtRaw,'Thu, 05 Nov 2026 08:00:00 +0000');assert.equal(first.guid,'https://recentjobs.co.za/?p=11');
});
test('derived review retains connected requirements, route wording and metadata while remaining unapproved',()=>{
 const parsed=parseRecentJobsRss({xml:feed(),url}),candidate=reviewRecentJobsRssItem(source,parsed,0,{observedOn:'2026-11-05'});
 assert.equal(candidate.sourceUrl,parsed.items[0].sourceUrl);assert.equal(candidate.sourceRecordId,parsed.items[0].sourceRecordId);assert.match(candidate.sourceText,/Grade 12 with Mathematics OR N3 Electrical/);
 assert.equal(candidate.deadlineCandidates[0].localDate,'2026-11-15');assert.equal(candidate.applicationCandidates[0].destination,'training@issuer.example');assert.equal(candidate.review,'pending');assert.ok(candidate.issues.includes('feed_transport_requires_review'));assert.equal(candidate.rssEvidence.itemHash,parsed.items[0].itemHash);
});
test('changing a sibling or read time does not invalidate an unchanged item, while changed content does',()=>{
 const a=parseRecentJobsRss({xml:feed(item()+item({id:12,path:'second'})),url}),b=parseRecentJobsRss({xml:feed(item()+item({id:12,path:'second',content:body+'<p>Changed sibling</p>'})),url});
 assert.notEqual(a.feedHash,b.feedHash);assert.equal(a.items[0].itemHash,b.items[0].itemHash);
 const one=reviewRecentJobsRssItem(source,a,0,{observedOn:'2026-11-05'}),two=reviewRecentJobsRssItem(source,b,0,{observedOn:'2026-11-06'});assert.equal(one.contentHash,two.contentHash);
 const c=parseRecentJobsRss({xml:feed(item({content:body+'<p>Different condition</p>'})),url});assert.notEqual(reviewRecentJobsRssItem(source,c,0).contentHash,one.contentHash);
 a.items[0].contentHtml+='<p>Unbound edit</p>';assert.throws(()=>reviewRecentJobsRssItem(source,a,0),{code:'RECENTJOBS_RSS_ITEM_CHANGED'});
});
test('feed routing, self identity and namespace rebinding are strict',()=>{
 for(const wrong of [url+'?page=2','https://other.example/feed/','http://recentjobs.co.za/category/apprenticeships/feed/'])assert.throws(()=>parseRecentJobsRss({xml:feed(),url:wrong}),{code:'RECENTJOBS_RSS_URL_INVALID'});
 for(const xml of [feed().replace('xmlns:content="http://purl.org/rss/1.0/modules/content/"','xmlns:content="https://other.example/content"'),
  feed().replace('<item>','<item xmlns:content="https://other.example/content">'),feed().replace('<content:encoded>','<content:encoded xmlns:content="https://other.example/content">'),
  feed().replace('rel="self"','rel="other"'),feed().replace('<link>https://recentjobs.co.za</link>','<link>https://other.example</link>')])assert.throws(()=>parseRecentJobsRss({xml,url}));
});
test('DTD, external instructions, malformed XML, deep nesting and excessive input are rejected',()=>{
 for(const xml of ['<!DOCTYPE rss [<!ENTITY payload SYSTEM "file:///etc/passwd">]>'+feed(),'<rss><!ENTITY test "x"></rss>',
  feed().replace('<?xml version="1.0" encoding="UTF-8"?>','<?xml-stylesheet href="http://internal.example"?>'),feed().replace('</channel>',''),
  feed().replace('<description>Summary only.</description>','<extra>'.repeat(40)+'x'+'</extra>'.repeat(40)),feed().replace('<description>','<__proto__>').replace('</description>','</__proto__>')])assert.throws(()=>parseRecentJobsRss({xml,url}));
 assert.throws(()=>parseRecentJobsRss({xml:'x'.repeat(500001),url}),{code:'RECENTJOBS_RSS_LIMIT'});
});
test('missing full bodies, duplicate fields/items and category confusion cannot become candidates',()=>{
 for(const xml of [feed().replace(/<content:encoded>[\s\S]*?<\/content:encoded>/,''),feed().replace('<title>Authored electrical apprenticeship</title>','<title>A</title><title>B</title>'),
  feed(item()+item()),feed(item()+item({id:11,path:'different'})),feed(item({categories:'<category>Jobs</category>'})),feed(''),feed(Array.from({length:51},(_,i)=>item({id:i+1,path:'post-'+i})).join(''))])assert.throws(()=>parseRecentJobsRss({xml,url}));
});
test('canonical links and date metadata reject unsafe URLs, impossible dates and contradictory weekdays',()=>{
 for(const target of ['https://127.0.0.1/2026/11/05/a/','https://recentjobs.co.za.evil.example/2026/11/05/a/','https://recentjobs.co.za/2026/02/31/a/','https://recentjobs.co.za/2026/11/05/a/?tracking=1'])
  assert.throws(()=>parseRecentJobsRss({xml:feed().replace('https://recentjobs.co.za/2026/11/05/authored-electrical/',target),url}),{code:'RECENTJOBS_RSS_ARTICLE_URL_INVALID'});
 for(const published of ['Mon, 05 Nov 2026 08:00:00 +0000','Thu, 05 Nov 2026 24:00:00 +0000','Fri, 06 Nov 2026 08:00:00 +0000','2026-11-05'])
  assert.throws(()=>parseRecentJobsRss({xml:feed(item({published})),url}),{code:'RECENTJOBS_RSS_DATE_INVALID'});
 assert.equal(parseRecentJobsRss({xml:feed(item({published:'Thu, 05 Nov 2026 10:00:00 +0200'})),url}).items[0].publishedAt,'2026-11-05T08:00:00.000Z');
});
test('review frames cannot turn sibling notices or foreign GUIDs into the primary notice',()=>{
 const nested='<article class="post type-post"><h1 class="entry-title">Other notice</h1><div class="entry-content">Other requirements</div></article>';
 assert.throws(()=>reviewRecentJobsRssItem(source,parseRecentJobsRss({xml:feed(item({content:nested})),url}),0),{code:'RECENTJOBS_LAYOUT_CHANGED'});
 const foreign=feed().replace('https://recentjobs.co.za/?p=11','https://other.example/?p=11');assert.throws(()=>reviewRecentJobsRssItem(source,parseRecentJobsRss({xml:foreign,url}),0),{code:'RECENTJOBS_RSS_REVIEW_ID_UNSUPPORTED'});
 const escaped=parseRecentJobsRss({xml:feed(item({content:'</div></article><p>Full wording remains inside the bound frame.</p>'+body})),url});assert.match(reviewRecentJobsRssItem(source,escaped,0).sourceText,/Full wording remains inside the bound frame/);
 assert.throws(()=>reviewRecentJobsRssItem({...source,automation:{mode:'automatic'}},escaped,0),{code:'RECENTJOBS_RSS_REVIEW_CONFIGURATION_REQUIRED'});
});
