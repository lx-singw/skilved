import {stagingEnvironment} from '../../../deployment/catalogue-staging/runtime/guards.mjs';

let runtime;
try {
  stagingEnvironment('web'); // Validate staging-only flags before SDK initialization.
  const [{getRuntime},{verifyPrivateCatalogueReads}]=await Promise.all([
    import('../src/runtime.mjs'),import('../src/private-read-check.mjs'),
  ]);
  runtime=await getRuntime();
  const rows=await runtime.db.collection('m0_drafts').limit(21).get();
  if(rows.empty || rows.size>20)throw new Error();
  const ids=rows.docs.map(row=>{
    const record=JSON.parse(row.data().json);
    if(record.id!==row.id || record.publication?.approved!==false ||
        !['draft','review'].includes(record.lifecycle))throw new Error();
    return row.id;
  });
  console.log(JSON.stringify(await verifyPrivateCatalogueReads(runtime,ids)));
}catch{
  console.error(JSON.stringify({error:'STAGING_READ_CHECK_FAILED'}));process.exitCode=1;
}finally{await runtime?.db.terminate();}
