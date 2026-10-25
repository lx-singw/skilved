import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {stagingEnvironment, stagingWorkerAdmission} from './guards.mjs';
const base = {NODE_ENV:'production', SKILVED_STAGING_PROJECT:'skilved-staging',
  SKILVED_CATALOGUE_PROJECT:'skilved-staging', SKILVED_CATALOGUE_MODE:'cloud',
  SKILVED_CATALOGUE_REPORTS:'false', SKILVED_SUGGESTIONS_ENABLED:'false'};
const web = {...base, SKILVED_CATALOGUE_READS:'true', SKILVED_AI_MODE:'disabled'};
const principal = 'catalogue-staging-worker@skilved-staging.iam.gserviceaccount.com';
const worker = {...base, SKILVED_STAGING_WORKER_ENABLED:'true', SKILVED_CATALOGUE_READS:'false', SKILVED_AI_MODE:'gemini',
  SKILVED_GEMINI_PROJECT_ID:'skilved-dev', SKILVED_STAGING_SOURCE_ID:'existing_reviewed_source',
  SKILVED_STAGING_SOURCE_REVISION:'2', SKILVED_STAGING_WORKER_PRINCIPAL:principal};
test('staging web permits runtime reads without receiving AI credentials or intake writes', () => {
  assert.deepEqual(stagingEnvironment('web',web), {projectId:'skilved-staging',port:8080});
  for (const change of [{GEMINI_API_KEY:'secret'}, {GROQ_API_KEY:'secret'}, {SKILVED_CATALOGUE_REPORTS:'true'},
    {SKILVED_SUGGESTIONS_ENABLED:'true'}, {SKILVED_AI_MODE:'gemini'}, {PORT:'65536'}]) {
    assert.throws(() => stagingEnvironment('web',{...web,...change}), {code:'STAGING_CONFIGURATION_REQUIRED'});
  }
});
test('staging runtimes refuse another project, service key files or emulator injection', () => {
  for (const input of [web,worker]) for (const change of [{SKILVED_CATALOGUE_PROJECT:'skilved-prod'},
    {SKILVED_STAGING_PROJECT:'skilved-dev'}, {GOOGLE_APPLICATION_CREDENTIALS:'/tmp/key.json'},
    {FIRESTORE_EMULATOR_HOST:'127.0.0.1:18080'}, {SKILVED_WORKER_EMULATOR_IDENTITY:'synthetic-worker@example.test'}]) {
    assert.throws(() => stagingEnvironment(input===web?'web':'worker',{...input,...change}), {code:'STAGING_CONFIGURATION_REQUIRED'});
  }
});
test('worker activation is explicit while quota scope remains the provider key project', () => {
  assert.equal(stagingEnvironment('worker',worker).sourceRevision,2);
  for (const change of [{SKILVED_STAGING_WORKER_ENABLED:'false'}, {SKILVED_STAGING_WORKER_ENABLED:undefined},
    {SKILVED_GEMINI_PROJECT_ID:undefined}, {SKILVED_STAGING_SOURCE_REVISION:'0'}, {SKILVED_STAGING_SOURCE_ID:'../source'},
    {SKILVED_STAGING_WORKER_PRINCIPAL:'catalogue-staging-worker@skilved-prod.iam.gserviceaccount.com'}]) {
    assert.throws(() => stagingEnvironment('worker',{...worker,...change}), {code:'STAGING_CONFIGURATION_REQUIRED'});
  }
});
test('worker admission requires the reviewed revision, optional crawl off and an ingest-only grant', () => {
  const settings=stagingEnvironment('worker',worker);
  const source={id:settings.sourceId,revision:2,paused:false,permission:{method:'recentjobs_html'},automation:{mode:'shadow',employerCrawl:false}};
  const grant={active:true,principal,sources:[source.id],roles:['ingest']};
  assert.equal(stagingWorkerAdmission(settings,source,grant,principal),undefined);
  for (const rejected of [{...source,revision:3}, {...source,paused:true}, {...source,automation:{mode:'automatic',employerCrawl:false}},
    {...source,automation:{mode:'shadow',employerCrawl:true}}]) {
    assert.throws(() => stagingWorkerAdmission(settings,rejected,grant,principal), {code:'STAGING_CONFIGURATION_REQUIRED'});
  }
  assert.throws(() => stagingWorkerAdmission(settings,source,{...grant,roles:['ingest','publish']},principal), {code:'STAGING_CONFIGURATION_REQUIRED'});
  assert.throws(() => stagingWorkerAdmission(settings,source,grant,'other@skilved-staging.iam.gserviceaccount.com'), {code:'STAGING_CONFIGURATION_REQUIRED'});
});
test('disabled launchers exit before SDK initialization or web startup', () => {
  for (const file of ['web.mjs','worker.mjs']) {
    const result=spawnSync(process.execPath,[new URL(file,import.meta.url).pathname],{env:{PATH:process.env.PATH,NODE_ENV:'production'},encoding:'utf8'});
    assert.equal(result.status,1); assert.equal(result.stdout,'');
    assert.deepEqual(JSON.parse(result.stderr),{error:'STAGING_CONFIGURATION_REQUIRED'});
  }
});
