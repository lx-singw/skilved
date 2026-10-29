import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {parseOriginalDeadline} from '../src/original-deadline.mjs';
import {resolveOriginalNotice,refreshOriginalResolution} from '../src/original-notice-resolver.mjs';
import {originalFixture,originalHtml,originalMicrodataHtml} from './fixtures/original-notices.mjs';
const resolve=(raw,{date='2026-10-30',format='jsonld',now='2026-10-29T10:00:00.000Z',posting={}}={})=>{
 const f=originalFixture();f.candidate.deadlineCandidates=[{localDate:date}];f.now=now;
 return resolveOriginalNotice({...f,observation:{url:f.url,text:(format==='jsonld'?originalHtml:originalMicrodataHtml)({...f.posting,validThrough:raw,...posting})}});
};
test('calendar dates remain calendar evidence with no invented time or midnight instant',()=>{
 const p=parseOriginalDeadline('2026-10-30');assert.equal(p.format,'calendar_date');assert.equal(p.instant,null);assert.equal(p.localDate,p.raw);assert.equal(p.dayShift,false);
 assert.equal(resolve(p.raw,{now:'2026-10-30T00:00:00.000Z'}).reason,'CLOSING_DAY_HOLD');
 assert.equal(resolve(p.raw,{now:'2026-10-31T00:00:00.000Z'}).reason,'ORIGINAL_DEADLINE_ELAPSED');
});
test('explicit ISO offsets and fractional precision produce canonical instants and South African dates',()=>{
 for(const [raw,instant,date] of [['2026-10-30T09:00:00+02:00','2026-10-30T07:00:00.000Z','2026-10-30'],
  ['2026-10-30T09:00:00.1Z','2026-10-30T09:00:00.100Z','2026-10-30'],
  ['2026-10-30T22:00:00Z','2026-10-30T22:00:00.000Z','2026-10-31'],
  ['2026-10-30T00:30:00+14:00','2026-10-29T10:30:00.000Z','2026-10-29']]){
  const p=parseOriginalDeadline(raw);assert.equal(p.raw,raw);assert.equal(p.instant,instant);assert.equal(p.localDate,date);assert.equal(p.format,'iso_zoned');
 }
});
test('explicit UTC/GMT legacy forms validate their weekday and preserve the written date',()=>{
 for(const zone of ['UTC','GMT']){
  const raw=`Fri Oct 30 09:00:00 ${zone} 2026`,p=parseOriginalDeadline(raw);assert.equal(p.format,'legacy_utc');assert.equal(p.raw,raw);
  assert.equal(p.writtenDate,'2026-10-30');assert.equal(p.instant,'2026-10-30T09:00:00.000Z');assert.equal(p.localDate,'2026-10-30');
  for(const format of ['jsonld','microdata'])assert.equal(resolve(raw,{format}).outcome,'matched');
 }
});
test('midnight rollover is explicit conflicting evidence, never an inferred end-of-previous-day cutoff',()=>{
 for(const raw of ['Fri Oct 30 22:00:00 UTC 2026','2026-10-30T22:00:00Z']){
  const r=resolve(raw);assert.equal(r.outcome,'conflicting');assert.equal(r.reason,'DEADLINE_CONFLICT');assert.equal(r.deadlineEvidence.localDate,'2026-10-31');
  assert.equal(r.deadlineEvidence.writtenDate,'2026-10-30');assert.equal(r.deadlineEvidence.dayShift,true);assert.equal(r.identity.validThrough,raw);
  assert.equal(resolve(raw,{date:'2026-10-31'}).outcome,'matched');
 }
});
test('invalid calendars, contradictory weekdays, clocks, unknown zones and unspecified offsets stay unresolved',()=>{
 for(const raw of [null,{},'','x'.repeat(101),'2026-02-30','2026-10-30T24:00:00Z','2026-10-30T23:60:00Z','2026-10-30T23:59:60Z',
  '2026-10-30T09:00:00','2026-10-30T09:00:00-00:00','2026-10-30T09:00:00+24:00','2026-10-30T09:00:00+02:60',
  '2026-10-30T09:00:00.1234Z','Thu Oct 30 09:00:00 UTC 2026','Mon Feb 30 09:00:00 UTC 2026','Fri Oct 30 24:00:00 UTC 2026',
  'Fri Oct 30 09:00:00 SAST 2026','Fri Oct 30 09:00:00 PST 2026','Fri Oct 30 09:00:00 GMT+0200 2026','Oct 30 09:00:00 UTC 2026',
  'Fri Oct 30 09:00:00 UTC 26','Fri Oct 30 09:00:00 UTC 2026 extra',' Fri Oct 30 09:00:00 UTC 2026'])assert.equal(parseOriginalDeadline(raw),null,JSON.stringify(raw));
 for(const raw of ['Thu Oct 30 09:00:00 UTC 2026','2026-10-30T24:00:00Z','2026-10-30T09:00:00-00:00'])assert.equal(resolve(raw).reason,'DEADLINE_UNRESOLVED');
});
test('leap years and positive/negative offsets are validated without host-local parsing',()=>{
 assert.equal(parseOriginalDeadline('Tue Feb 29 10:00:00 UTC 2028').localDate,'2028-02-29');
 assert.equal(parseOriginalDeadline('2027-02-29T10:00:00Z'),null);
 const raw='2026-10-30T23:30:00-05:00',p=parseOriginalDeadline(raw);assert.equal(p.instant,'2026-10-31T04:30:00.000Z');assert.equal(p.localDate,'2026-10-31');
 const script=`import {parseOriginalDeadline} from ${JSON.stringify(new URL('../src/original-deadline.mjs',import.meta.url).href)};console.log(JSON.stringify(parseOriginalDeadline(${JSON.stringify(raw)})));`;
 for(const TZ of ['UTC','Pacific/Honolulu','Asia/Tokyo']){const run=spawnSync(process.execPath,['--input-type=module','-e',script],{env:{...process.env,TZ},encoding:'utf8'});assert.equal(run.status,0,run.stderr);assert.deepEqual(JSON.parse(run.stdout),p);}
});
test('only matched vacancy identity can be marked closed from a legacy timestamp',()=>{
 const raw='Wed Oct 28 09:00:00 UTC 2026';assert.equal(resolve(raw).outcome,'closed');
 assert.equal(resolve(raw,{posting:{url:'https://other.example/123'}}).reason,'VACANCY_URL_CONFLICT');
 assert.equal(resolve(raw,{posting:{hiringOrganization:{name:'Other issuer'}}}).reason,'ISSUER_CONFLICT');
});
test('refresh retains evidence, expires at the precise instant and holds changed policy or interpretation',()=>{
 const r=resolve('Fri Oct 30 09:00:00 UTC 2026');assert.equal(r.outcome,'matched');
 assert.equal(refreshOriginalResolution(r,'2026-10-30T08:59:59.999Z').outcome,'matched');
 const closed=refreshOriginalResolution(r,'2026-10-30T09:00:00.000Z');assert.equal(closed.outcome,'closed');assert.deepEqual(closed.deadlineEvidence,r.deadlineEvidence);assert.equal(r.outcome,'matched');
 assert.equal(refreshOriginalResolution({...r,version:'original_jobposting_v2'},'2026-10-29T11:00:00.000Z').reason,'RESOLVER_POLICY_CHANGED');
 assert.equal(refreshOriginalResolution({...r,deadlineEvidence:{...r.deadlineEvidence,localDate:'2026-10-31'}},'2026-10-29T11:00:00.000Z').reason,'DEADLINE_EVIDENCE_CHANGED');
 assert.equal(refreshOriginalResolution({...r,deadlineEvidence:undefined},'2026-10-29T11:00:00.000Z').reason,'DEADLINE_EVIDENCE_CHANGED');
});
