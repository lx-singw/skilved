// Authored regression fixture; no real employer, notice or application is represented.
import {parseRecentJobsDetail} from '../../src/adapters/recentjobs.mjs';
export const labelLines=['Fictional Workshop invites applicants to its apprenticeship.',
  'Job Location: Fictional City – Gauteng – South Africa','Working Mode: Fully On-Site',
  'Key Responsibilities','Complete workshop training records during the apprenticeship.',
  'Skills Required','Technical aptitude','Ability to learn','Preferred Qualifications',
  'N2/Matric: Subjects:','Mathematics (Maths Literacy will not apply)','English',
  'What We Offer','Retirement benefits','Medical aid','Closing date: 30 October 2026'];
export const labelHtml=`<article class="type-post"><h1 class="entry-title">Fictional electrical apprentice</h1><div class="entry-content">${labelLines.map(s=>`<p>${s}</p>`).join('')}<a href="https://employer.example/apply">Apply now online</a></div></article>`;
export const labelCandidate=parseRecentJobsDetail({html:labelHtml,url:'https://recentjobs.co.za/2026/09/26/fictional-apprentice/',observedOn:'2026-09-26'});
const lines=(labelCandidate.title+'\n'+labelCandidate.sourceText).split('\n');
export const labelSpan=quote=>{const first=lines.indexOf(quote.split('\n')[0])+1;return [first,first+quote.split('\n').length-1];};
export const preferredLabelEducation=labelLines.slice(9,12).join('\n');
export function labelWire(){const fact=(value,quote)=>({state:'stated',value,span:labelSpan(quote)});return {
  category:'apprenticeship',categorySpan:[1,1],issuer:fact('Fictional Workshop',labelLines[0]),summary:fact(labelLines[0],labelLines[0]),intake:null,
  location:fact({places:[{city:'Fictional City',province:'gauteng',country:'ZA'}],coverage:'not_stated',attendance:'in_person',relocation:null},labelLines.slice(1,3).join('\n')),
  residence:null,experience:null,deadline:fact({kind:'date',localDate:'2026-10-30',localTime:null,timezone:null,utcInstant:null},labelLines[15]),
  compensation:labelLines.slice(13,15).map(coverage=>fact({kind:'other',amount:null,maximum:null,currency:null,period:'not_stated',coverage},coverage)),
  practicalConditions:null,applicationCandidateIndex:0,requirements:{items:[
    {id:'s1',kind:'other',level:'required',state:'stated',span:labelSpan(labelLines[6])},
    {id:'s2',kind:'other',level:'required',state:'stated',span:labelSpan(labelLines[7])},
    {id:'q',kind:'education',level:'preferred',state:'stated',span:labelSpan(preferredLabelEducation)}],expression:'all(s1,s2,q)'}};}
