import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,access,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {reviewRssFile} from '../tools/review-recentjobs-rss.mjs';
import {originalFixture} from './fixtures/original-notices.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const url='https://recentjobs.co.za/category/apprenticeships/feed/';
const xml=`<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Authored apprenticeship feed</title><link>https://recentjobs.co.za/</link><atom:link rel="self" type="application/rss+xml" href="${url}"/><lastBuildDate>Thu, 05 Nov 2026 12:00:00 +0000</lastBuildDate><item><title>Authored electrical apprenticeship</title><link>https://recentjobs.co.za/2026/11/05/authored-review/</link><guid isPermaLink="false">https://recentjobs.co.za/?p=12</guid><pubDate>Thu, 05 Nov 2026 08:00:00 +0000</pubDate><category>Apprenticeships</category><content:encoded><![CDATA[<p>Grade 12 with Mathematics</p><p>Closing date: 15 November 2026</p><p>Email a CV to training@issuer.example</p>]]></content:encoded></item></channel></rss>`;
test('RSS review writes private pending evidence without overwriting files or mutating its source/input',async()=>{
 const task=await mkdtemp(resolve(root,'.artifacts/rss-review-test-')),outside=await mkdtemp(resolve(tmpdir(),'skilved-rss-test-'));
 try{
  const source=structuredClone(originalFixture().source);source.automation.mode='shadow';
  const input=resolve(task,'feed.xml'),sourceFile=resolve(task,'source.json'),sourceText=JSON.stringify(source),outputDir=resolve(task,'review');await writeFile(input,xml);await writeFile(sourceFile,sourceText);
  const args={input,sourceFile,outputDir,observedOn:'2026-11-05'},summary=await reviewRssFile(args);
  assert.equal(summary.parsedCandidates,1);assert.equal(summary.modelCalls,0);assert.equal(summary.canonicalWrites,0);assert.equal(summary.publication,false);assert.equal(summary.workerIntegration,false);
  assert.equal(await readFile(sourceFile,'utf8'),sourceText);assert.equal(await readFile(input,'utf8'),xml);
  const before=await readFile(resolve(outputDir,'review.json'),'utf8');assert.equal(JSON.parse(before).rows[0].candidate.review,'pending');
  await assert.rejects(reviewRssFile(args),{code:'RSS_REVIEW_ALREADY_EXISTS'});assert.equal(await readFile(resolve(outputDir,'review.json'),'utf8'),before);
  await assert.rejects(reviewRssFile({...args,outputDir:resolve(outside,'escaped')}),{code:'RSS_REVIEW_PRIVATE_OUTPUT_REQUIRED'});await assert.rejects(access(resolve(outside,'escaped')),{code:'ENOENT'});
  await symlink(outside,resolve(task,'escape'),'dir');await assert.rejects(reviewRssFile({...args,outputDir:resolve(task,'escape','review')}),{code:'RSS_REVIEW_PRIVATE_OUTPUT_REQUIRED'});
  await assert.rejects(reviewRssFile({...args,observedOn:'tomorrow'}),{code:'RSS_REVIEW_CONFIGURATION_REQUIRED'});
 }finally{await rm(task,{recursive:true,force:true});await rm(outside,{recursive:true,force:true});}
});
