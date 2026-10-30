import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Source} from '../src/schemas.mjs';
import {missingDateEvidenceTiming,preflightCandidate} from '../src/worker-policy.mjs';
import {parseRecentJobsDetail} from '../src/adapters/recentjobs.mjs';
import {originalFixture} from './fixtures/original-notices.mjs';

const f=originalFixture(),source=Source.parse({...f.source,automation:{...f.source.automation,missingDateEvidence:'shadow_v1'}});
const candidate=html=>parseRecentJobsDetail({html:f.detailHtml.replace('<p>Closing date: 30 October 2026</p>',html),url:f.detailUrl});
const assess=(c, s=source,code='NOTICE_PRECISION_UNSUPPORTED')=>missingDateEvidenceTiming(s,c,code);
test('missing-date evidence is an explicit opt-in with rejected undated admission and crawling',()=>{
 assert.equal(Source.parse(f.source).automation.missingDateEvidence,undefined);
 for(const patch of [{mode:'automatic'},{mode:'disabled'},{employerCrawl:false},{originalVerification:undefined},
  {undatedNotices:'shadow_recent'},{undatedNotices:'shadow_recent_v2'}])
  assert.equal(Source.safeParse({...source,automation:{...source.automation,...patch}}).success,false);
 const registry=Source.parse({...source,automation:{...source.automation,issuerRegistry:'shadow_v1',originDiscovery:'shadow_v1',issuers:[]}});
 assert.equal(registry.automation.undatedNotices,'reject');
 assert.equal(assess(candidate(''),Source.parse(f.source)),null);
});
test('only absent or whole explicitly unspecified publisher dates yield collection timing; preflight still rejects',()=>{
 for(const [html,state] of [['','absent'],['<p>Closing date: Not specified</p>','explicitly_unspecified'],
  ['<p>Closing date:</p><p>Not stated</p>','explicitly_unspecified']]){
  const c=candidate(html);assert.equal(assess(c).state,state);
  assert.throws(()=>preflightCandidate(source,c,f.now,f.now),{code:'NOTICE_PRECISION_UNSUPPORTED'});
 }
 for(const html of ['<p>Closing date: soon</p>','<p>Closing date: 31 February 2026</p>',
  '<p>Closing date: Not specified</p><p>Apply before Monday</p>',
  '<p>Closing date: Not specified</p><p>Closing date: Not stated</p>',
  '<p>Applications are closed</p>','<p>Apply until filled</p>','<p>Closing date: 30 October 2026</p>'])
  assert.equal(assess(candidate(html)),null,html);
});
test('method, category, programme, source-code and crawl fences keep other failures out of collection',()=>{
 const c=candidate('');
 for(const bad of [{...c,applicationCandidates:[]},{...c,applicationCandidates:[...c.applicationCandidates,...c.applicationCandidates]},
  {...c,applicationCandidates:[{method:'email',destination:'apply@example.test'}]},
  {...c,applicationInstructions:[{method:'physical'}]},
  {...c,issues:['programme_subject_scope_review_required']},
  {...c,title:'Graduate role',sourceText:'Apply for an internship programme'},
  {...c,sourceText:c.sourceText+'\nJoin our internship programme'}])assert.equal(assess(bad),null);
 for(const code of ['NOTICE_NOT_OPEN','NOTICE_CATEGORY_CONFLICT','WORKER_FORBIDDEN','ISSUER_RELATIONSHIP_UNQUALIFIED'])assert.equal(assess(c,source,code),null);
 assert.equal(assess(c,{...source,automation:{...source.automation,employerCrawl:false}}),null);
});
