import {readFile,writeFile,mkdir,realpath,lstat} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {Source} from '../src/schemas.mjs';
import {DateSchema} from '@skilved/types/opportunities';
import {parseRecentJobsRss,reviewRecentJobsRssItem,RECENTJOBS_CATEGORY_FEED} from '../src/adapters/recentjobs-rss.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const fail=code=>{throw Object.assign(Error(code),{code});};
const inside=(parent,child)=>{const path=relative(parent,child);return path!==''&&!path.startsWith('..')&&!path.startsWith('/');};
export async function reviewRssFile({input,sourceFile,outputDir,observedOn}={}){
 if([input,sourceFile,outputDir].some(value=>typeof value!=='string'||!value))fail('RSS_REVIEW_CONFIGURATION_REQUIRED');
 const artifacts=await realpath(resolve(root,'.artifacts')),output=resolve(root,outputDir),parent=await realpath(dirname(output));
 if(!inside(artifacts,output)||!inside(artifacts,resolve(parent,output.split('/').at(-1))))fail('RSS_REVIEW_PRIVATE_OUTPUT_REQUIRED');
 if(observedOn!==undefined&&observedOn!==null&&!DateSchema.safeParse(observedOn).success)fail('RSS_REVIEW_CONFIGURATION_REQUIRED');
 const inputPath=await realpath(resolve(root,input)),info=await lstat(inputPath),contextPath=await realpath(resolve(root,sourceFile)),contextInfo=await lstat(contextPath);
 if(!info.isFile()||info.size>500000||!contextInfo.isFile()||contextInfo.size>1000000)fail('RECENTJOBS_RSS_LIMIT');
 const source=Source.parse(JSON.parse(await readFile(contextPath,'utf8')));if(source.permission.method!=='recentjobs_html'||source.automation?.mode!=='shadow')fail('RSS_REVIEW_CONFIGURATION_REQUIRED');
 if(info.size>source.maxBytes)fail('RECENTJOBS_RSS_LIMIT');const xml=await readFile(inputPath,'utf8');
 const feed=parseRecentJobsRss({xml,url:RECENTJOBS_CATEGORY_FEED}),rows=[];
 for(let index=0;index<feed.items.length;index++){
  try{rows.push({index,sourceUrl:feed.items[index].sourceUrl,state:'parsed_for_review',candidate:reviewRecentJobsRssItem(source,feed,index,{observedOn})});}
  catch(error){rows.push({index,sourceUrl:feed.items[index].sourceUrl,state:'adapter_hold',reason:/^[A-Z][A-Z0-9_]{0,99}$/.test(error?.code??'')?error.code:'RSS_REVIEW_UNSUPPORTED'});}
 }
 try{await mkdir(output,{mode:0o700});}catch(error){if(error.code==='EEXIST')fail('RSS_REVIEW_ALREADY_EXISTS');throw error;}
 const summary={kind:'recentjobs_rss_review',items:feed.items.length,parsedCandidates:rows.filter(row=>row.state==='parsed_for_review').length,adapterHolds:rows.filter(row=>row.state==='adapter_hold').length,
  coverage:feed.coverage,sourceId:source.id,sourceRevision:source.revision,feedHash:feed.feedHash,sourcePolicyChanged:false,workerIntegration:false,modelCalls:0,canonicalWrites:0,publication:false};
 await writeFile(resolve(output,'review.json'),JSON.stringify({summary,rows},null,2)+'\n',{mode:0o600});await writeFile(resolve(output,'summary.json'),JSON.stringify(summary,null,2)+'\n',{mode:0o600});return summary;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{if(process.argv.length!==3)fail('RSS_REVIEW_CONFIGURATION_REQUIRED');console.log(JSON.stringify(await reviewRssFile(JSON.parse(await readFile(process.argv[2],'utf8')))));}
 catch(error){console.error(JSON.stringify({error:/^[A-Z][A-Z0-9_]{0,99}$/.test(error?.code??'')?error.code:'RSS_REVIEW_FAILED'}));process.exitCode=1;}
}
