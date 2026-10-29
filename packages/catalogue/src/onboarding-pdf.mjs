import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {z} from 'zod';
import {DomainError} from './config.mjs';

export const PDF_EVIDENCE_VERSION='poppler_text_v1';
export const PdfEvidence=z.object({version:z.literal(PDF_EVIDENCE_VERSION),base64:z.string().max(533336),sha256:z.string().regex(/^[a-f0-9]{64}$/),
 bytes:z.number().int().min(8).max(400000),pages:z.number().int().min(1).max(20),text:z.string().min(1).refine(v=>Buffer.byteLength(v)<=120000)}).strict()
 .refine(p=>{const b=Buffer.from(p.base64,'base64');return b.length===p.bytes&&b.toString('base64')===p.base64&&/^%PDF-\d\.\d/.test(b.subarray(0,8).toString('ascii'))&&createHash('sha256').update(b).digest('hex')===p.sha256;});
function command(name,args,bytes,maxBuffer){return new Promise((resolve,reject)=>{
 const child=execFile('prlimit',['--as=268435456','--cpu=3','--nofile=32','--',name,...args],{timeout:5000,killSignal:'SIGKILL',maxBuffer,encoding:'utf8',env:{PATH:process.env.PATH,LC_ALL:'C',HOME:'/nonexistent'}},(error,stdout)=>{
  if(error){reject(new DomainError(error.code==='ENOENT'||error.code===127?'PDF_TOOL_UNAVAILABLE':'PDF_EVIDENCE_UNSUPPORTED'));return;}resolve(stdout);
 });child.stdin.on('error',()=>{});child.stdin.end(bytes);
});}
/** Text extraction only: no rendering, JavaScript, attachments, linked resources,
 * shell command strings or caller-selected tools. CPU/address space/output bounded.
 */
export async function decodePdfEvidence(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length>400000||bytes.length<8||!/^%PDF-\d\.\d/.test(bytes.subarray(0,8).toString('ascii')))throw new DomainError('PDF_EVIDENCE_UNSUPPORTED');
 const info=await command('pdfinfo',['-'],bytes,16000),pages=Number(info.match(/^Pages:\s+(\d+)\s*$/m)?.[1]);
 if(!Number.isInteger(pages)||pages<1||pages>20||!/^Encrypted:\s+no\s*$/m.test(info))throw new DomainError('PDF_EVIDENCE_UNSUPPORTED');
 const raw=await command('pdftotext',['-layout','-nopgbrk','-','-'],bytes,120000),text=raw.replace(/\s+/g,' ').trim();
 if(!text||Buffer.byteLength(text)>120000)throw new DomainError('PDF_EVIDENCE_UNSUPPORTED');
 return PdfEvidence.parse({version:PDF_EVIDENCE_VERSION,base64:bytes.toString('base64'),sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,pages,text});
}
export async function verifyPdfEvidence(document){
 const parsed=PdfEvidence.parse(document),decoded=await decodePdfEvidence(Buffer.from(parsed.base64,'base64'));
 if(!isDeepStrictEqual(parsed,decoded))throw new DomainError('PDF_EVIDENCE_CHANGED');return decoded;
}
export function pdfIdentityMaterial(document,corporateUrl){
 const p=PdfEvidence.parse(document),target=new URL(corporateUrl),links=[];
 const found=p.text.matchAll(/(?<![\p{L}\p{N}@._-])(?:https?:\/\/|www\.)[^\s<>"()]+/giu);
 for(const match of found){const printed=match[0].replace(/[.,;:]+$/g,'');if(printed.length>2048)continue;
  try{const u=new URL(/^www\./i.test(printed)?'https://'+printed:printed);
   if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.port||u.hostname!==target.hostname)continue;
   const context=p.text.slice(Math.max(0,match.index-100),match.index+printed.length+100).replace(/(?:https?:\/\/|www\.)[^\s<>"()]+/giu,'');
   links.push({href:corporateUrl,printed,denied:/\b(?:not|never|avoid|fake|fraud(?:ulent)?|unauthori[sz]ed|example|unrelated)\b/i.test(context)});
  }catch{}
 }
 return{text:p.text,links,headingCount:0,format:'pdf',sha256:p.sha256,pages:p.pages};
}
