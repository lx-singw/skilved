import {isDeepStrictEqual} from 'node:util';
import {DateSchema} from '@skilved/types/opportunities';
import {parseOriginalDeadline} from './original-deadline.mjs';

const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
function calendar(raw){
  if(DateSchema.safeParse(raw).success)return raw;
  const m=raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);if(!m)return null;
  const index=months.findIndex(v=>v===m[2].toLowerCase()||v.slice(0,3)===m[2].toLowerCase());if(index<0)return null;
  const date=`${m[3]}-${String(index+1).padStart(2,'0')}-${m[1].padStart(2,'0')}`;return DateSchema.safeParse(date).success?date:null;
}
/** Explicit fields inside the already-scoped JobPosting description only. */
export function originalClosingDateProof(descriptionText){
  if(typeof descriptionText!=='string')return null;
  if(descriptionText.length>20000)return {version:'original_closing_date_v1',descriptionText:null,state:'unresolved',localDate:null,fields:[]};
  const lines=descriptionText.split('\n'),fields=[];let unresolved=false;
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim(),m=line.match(/^(?:(?:application\s+)?closing\s+date|(?:application\s+)?deadline)\b\s*[:;–—-]?\s*(.*)$/i);
    if(!m){if(/^(?:apply\s+(?:by|before)|applications?\s+(?:will\s+)?clos(?:e|es|ing))\b/i.test(line))unresolved=true;continue;}
    const value=m[1]||lines[++i]?.trim()||'',date=calendar(value);fields.push({quote:m[1]?line:`${line}\n${value}`,localDate:date});
    if(fields.length>3||!date)unresolved=true;
  }
  if(!fields.length&&!unresolved)return null;
  const dates=new Set(fields.map(f=>f.localDate));
  return {version:'original_closing_date_v1',descriptionText,state:unresolved||dates.size!==1?'unresolved':'stated',
    localDate:unresolved||dates.size!==1?null:fields[0].localDate,fields};
}
export function validOriginalClosingDateProof(proof){
  return proof?.state==='stated'&&isDeepStrictEqual(proof,originalClosingDateProof(proof.descriptionText));
}
/** An explicit closing date may end exactly where a zoned technical expiry starts.
 * This never changes the expiry's written/calendar date or invents a time.
 */
export function originalApplicationDate(expiry,proof=null){
  if(!expiry)return null;if(proof===null)return expiry.localDate;
  if(!validOriginalClosingDateProof(proof))return null;
  if(expiry.localDate===proof.localDate)return proof.localDate;
  const midnight=Date.parse(`${proof.localDate}T00:00:00.000+02:00`)+86400000;
  return expiry.instant!==null&&Date.parse(expiry.instant)===midnight?proof.localDate:null;
}
export function matchesOriginalTiming(validThrough,expiry,proof=null){
  return isDeepStrictEqual(parseOriginalDeadline(validThrough),expiry)&&originalApplicationDate(expiry,proof)!==null;
}
