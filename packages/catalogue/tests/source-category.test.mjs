import {test} from 'node:test';
import assert from 'node:assert/strict';
import {preflightCandidate,publicationGate} from '../src/worker-policy.mjs';
import {makeRecord} from '../../types/tests/fixtures/opportunities.mjs';
const now='2026-09-26T10:00:00.000Z',record=makeRecord(),source={automation:{issuers:[{name:record.issuer.value,host:'issuer.example',pathPrefix:'/apply'}]}};
const candidate=(title,sourceText)=>({title,sourceText,issues:[],applicationCandidates:[{method:'portal',destination:record.applicationRoute.value.destination}],deadlineCandidates:[{localDate:'2026-10-30'}]});
const rejectBoth=(c,code)=>{assert.throws(()=>preflightCandidate(source,c,now),new RegExp(code));assert.throws(()=>publicationGate(source,c,record,null,{supported:true,issues:[]},now),new RegExp(code));};

test('category membership, artisan-assistant wording and a valid route/date cannot establish apprenticeship scope',()=>{
  for(const [title,body]of [['Fictional Artisan Assistant','Grade 12. Assist artisans with maintenance.'],['Fictional Work Integrated Learner','Students completing an engineering diploma.'],['Fictional internship','Join our internship programme.']])
    rejectBoth({...candidate(title,body),categoryHint:'apprenticeship'},'NOTICE_CATEGORY_REVIEW_REQUIRED');
});

test('apprenticeship headlines cannot override current internship programme invitations',()=>{
  for(const invitation of ['Join our internship programme!','We encourage you to apply for the internship program.','An opportunity to join an internship programme.'])
    rejectBoth(candidate('Fictional apprenticeship intake','Degree/Diploma\n'+invitation),'NOTICE_CATEGORY_CONFLICT');
});

test('explicit apprenticeship body evidence supports a trade-only title',()=>{
  const c=candidate('Fictional Turner Machinist','Applicants are invited to our apprenticeship programme.');
  assert.equal(preflightCandidate(source,c,now).destination,record.applicationRoute.value.destination);
});

test('degree requirements alone do not imply an internship or reject stated apprenticeships',()=>{
  const c=candidate('Fictional apprenticeship','Degree/Diploma in a relevant technical discipline.');
  assert.ok(preflightCandidate(source,c,now));
});

test('past experience, background programmes and negated invitations do not become conflicting current intakes',()=>{
  for(const line of ['Previous internship programme experience is advantageous.','Our company also offers internship programmes.',
    'Do not join our internship programme.','Never apply for the internship program.','Previously applicants could join our internship programme.',
    'Last year we invited graduates to join our internship programme.'])
    assert.ok(preflightCandidate(source,candidate('Fictional apprenticeship',line),now),line);
});

test('historical context cannot hide a current conflicting invitation on another line or in the same sentence',()=>{
  for(const body of ['Last year we recruited artisans.\nJoin our internship programme.',
    'Last year we recruited artisans. Now join our internship programme.',
    'Previously applicants could train elsewhere, but now join our internship programme.'])
    rejectBoth(candidate('Fictional apprenticeship',body),'NOTICE_CATEGORY_CONFLICT');
});
