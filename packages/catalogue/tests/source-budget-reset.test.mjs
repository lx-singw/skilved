import{test}from'node:test';import assert from'node:assert/strict';import{dayInSA,nextSouthAfricanDay}from'../src/south-african-time.mjs';
test('source allowances renew at South African midnight across exact, month, leap and year boundaries',()=>{
 for(const [now,reset,day]of [
  ['2026-10-31T21:59:59.999Z','2026-10-31T22:00:00.000Z','2026-11-01'],
  ['2026-10-31T22:00:00.000Z','2026-11-01T22:00:00.000Z','2026-11-02'],
  ['2028-02-28T23:00:00.000Z','2028-02-29T22:00:00.000Z','2028-03-01'],
  ['2026-12-31T10:00:00.000Z','2026-12-31T22:00:00.000Z','2027-01-01'],
 ]){assert.equal(nextSouthAfricanDay(now),reset);assert.equal(dayInSA(reset),day);assert.ok(Date.parse(reset)>Date.parse(now));}
 assert.throws(()=>nextSouthAfricanDay('invalid'));
});
