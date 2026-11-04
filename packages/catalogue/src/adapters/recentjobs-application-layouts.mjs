import { createHash } from 'node:crypto';
import { parse, serialize, serializeOuter } from 'parse5';
import { z } from 'zod';
import { parseRecentJobsDetail } from './recentjobs.mjs';

// Explicit prototype entry point. The ordinary worker continues to import the
// existing adapter; this module does not qualify destinations or fetch them.
export const RECENTJOBS_APPLICATION_LAYOUTS_ADAPTER = 'recentjobs_application_layouts_shadow_v1';
const email = z.string().max(254).email();
const attr = (node, key) => node.attrs?.find(a => a.name === key)?.value ?? '';
const hasClass = (node, key) => attr(node, 'class').split(/\s+/).includes(key);
const ignored = node => ['script','style','iframe','noscript','template','svg','form','aside','nav'].includes(node.tagName) ||
  attr(node, 'class').split(/\s+/).some(c => /^(?:addtoany|a2a_|adsbygoogle|wp-block-latest-comments|comment-|comments|sharedaddy)/.test(c));
const hidden = node => node.attrs?.some(a=>a.name==='hidden' || a.name==='style' || a.name==='aria-hidden' && a.value!=='false');
const ancestor = (node, test) => { for (let p=node.parentNode;p;p=p.parentNode) if(test(p)) return p; return null; };
const within = (node, parent) => node === parent || ancestor(node, p => p === parent) !== null;
function nodes(root) {
  const found=[], stack=[[root,0]];
  while(stack.length) {
    const [node,depth]=stack.pop();
    if(found.length>=20000 || depth>100) throw Error('RECENTJOBS_TREE_LIMIT');
    found.push(node); for(const child of node.childNodes??[]) stack.push([child,depth+1]);
  }
  return found;
}
function visibleText(root) {
  const stack=[root], parts=[];
  while(stack.length) {
    const node=stack.pop(); if(ignored(node)) continue;
    if(node.nodeName==='#text') parts.push(node.value);
    stack.push(...(node.childNodes??[]).slice().reverse());
  }
  return parts.join('').replace(/\s+/g,' ').trim();
}

function openNoticeFooters(root, baseline) {
  const all=nodes(root);
  const posts=all.filter(n => n.tagName==='article' && hasClass(n,'type-post') &&
    all.some(h => h.tagName==='h1' && hasClass(h,'entry-title') &&
      ancestor(h,p=>p.tagName==='article')===n && visibleText(h)===baseline.title));
  if(posts.length!==1) return 0;
  const post=posts[0], bodies=all.filter(n => hasClass(n,'entry-content') && ancestor(n,p=>p.tagName==='article')===post);
  if(bodies.length!==1) return 0;
  const body=bodies[0], allowed=new Set(['footer','div','p','span','a','strong','b','em','i','br']);
  let opened=0;
  for(const footer of all.filter(n=>n.tagName==='footer' && within(n,body))) {
    if(ancestor(footer,n=>n.tagName==='article')!==post || ancestor(footer,n=>n.tagName==='footer') ||
      ancestor(footer,n=>within(n,body) && (ignored(n) || hidden(n) || n.tagName==='header'))) continue;
    const contents=nodes(footer);
    if(contents.some(n => n.tagName && (!allowed.has(n.tagName) || ignored(n) ||
      n!==footer && n.tagName==='footer' || hidden(n)))) continue;
    const anchors=contents.filter(n=>n.tagName==='a');
    const actions=anchors.filter(a=>/^(?:apply(?: now)?(?: online)?|(?:submit|start) (?:your )?application)$/i.test(visibleText(a)));
    if(actions.length!==1) continue;
    const anchor=actions[0];
    // A publisher social invitation may sit next to the real CTA. Discard only
    // explicit, matching social actions; unfamiliar links/text remain a hold.
    const social=anchors.filter(a=>a!==anchor);
    if(social.some(a=>{
      let target;try{target=new URL(attr(a,'href'));}catch{return true;}
      return target.protocol!=='https:' || target.username || target.password || target.port ||
        !(/^(?:www\.)?(?:whatsapp\.com|wa\.me)$/.test(target.hostname) && /^join (?:our|the) whatsapp (?:group|channel)$/i.test(visibleText(a)));
    })) continue;
    if(visibleText(footer)!==anchors.slice().reverse().map(visibleText).join('').replace(/\s+/g,' ').trim() &&
      visibleText(footer)!==anchors.slice().reverse().map(visibleText).join(' ').replace(/\s+/g,' ').trim()) continue;
    // Reuse the destination parser, including IP/credentials/social exclusions.
    // This local probe checks syntax only; source identity was bound above.
    const probe=`<article class="type-post"><h1 class="entry-title">Application route probe</h1><div class="entry-content">${serializeOuter(anchor)}</div></article>`;
    if(parseRecentJobsDetail({html:probe,url:baseline.sourceUrl}).applicationCandidates.length!==1) continue;
    for(const a of social) a.parentNode.childNodes=a.parentNode.childNodes.filter(n=>n!==a);
    footer.nodeName='div'; footer.tagName='div'; opened++;
  }
  return opened;
}

const heading = line => /^(?:\d+[.)]\s*)?How to apply\s*:?$/i.test(line);
// Numbered document/instruction lists still belong to the application section.
const nextSection = line => /^(?:important (?:information|notes?)|(?:additional|other) information|selection process|closing date|about (?:the |this )?(?:company|programme))\b/i.test(line.replace(/^\d+[.)]\s+/,''));
const excluded = /\b(?:enquir\w*|inquir\w*|queries|contact|poster|forms?|request|examples?|samples?|templates?|referees?)\b/i;
const prohibited = /\b(?:do not|must not|may not|cannot|will not|no)\b[^\n]{0,200}\b(?:e-?mail|apply|applications?|send|submit|cv)\b|\b(?:e-?mail|applications?|cv)\b[^\n]{0,200}\b(?:not accepted|not be accepted|not permitted|not allowed|will not|must not|cannot)\b|\bdo not\s+(?:do (?:so|this)|use (?:it|this|that))\b/i;
function labelledEmails(sourceText) {
  const lines=sourceText.split('\n'), candidates=[];
  for(let start=0;start<lines.length;start++) {
    if(!heading(lines[start])) continue;
    let end=start+1;
    while(end<lines.length && !heading(lines[end]) && !nextSection(lines[end])) end++;
    const section=lines.slice(start,end);
    // Address components are data, not words such as "example" or "contact"
    // describing the instruction. Context outside the address still governs it.
    if(section.length>30 || section.join('\n').length>4000 || section.some(s=>{
      const context=s.replace(/[^\s<>]+@[^\s<>]+/g,'[recipient]');
      return excluded.test(context)||prohibited.test(context);
    })) continue;
    let label=start+1; if(/^e-?mail application\s*:?$/i.test(lines[label]??'')) label++;
    if(!/^(?:application e-?mail|e-?mail address for applications)\s*:?$/i.test(lines[label]??'')) continue;
    let at=label+1; const recipients=[];
    while(at<end && email.safeParse(lines[at]).success && recipients.length<21) recipients.push(lines[at++]);
    if(!recipients.length || recipients.length>20) continue;
    if(/^(?:e-?mail )?subject\s*:?$/i.test(lines[at]??'')) {
      const subject=lines[at+1];
      if(at+1>=end || !subject || subject.length>250 || /@|https?:\/\//i.test(subject) || nextSection(subject)) continue;
      at+=2;
    }
    // A second recipient or subject outside this exact block cannot be silently
    // assigned to the same intake. Leave the entire labelled block unsupported.
    if(lines.slice(at,end).some(s=>/@|\b(?:subject|application e-?mail)\b/i.test(s))) continue;
    const originalText=lines.slice(start,at).join('\n');
    for(const destination of recipients) candidates.push({method:'email',destination,originalText,check:'pending'});
  }
  return candidates;
}

/** Opt-in parser prototype; returns only pending publisher methods, never trust. */
export function parseRecentJobsApplicationLayouts(input) {
  const baseline=parseRecentJobsDetail(input), root=parse(input.html);
  const opened=openNoticeFooters(root,baseline);
  const parsed=opened ? parseRecentJobsDetail({...input,html:serialize(root)}) : baseline;
  const extras=labelledEmails(parsed.sourceText);
  if(!opened && !extras.length) return baseline;
  const applicationCandidates=[...parsed.applicationCandidates];
  for(const route of extras) {
    const index=applicationCandidates.findIndex(c=>c.method===route.method && c.destination===route.destination);
    if(index<0) applicationCandidates.push(route);
    else if(route.originalText.includes(applicationCandidates[index].originalText)) applicationCandidates[index]=route;
  }
  if(applicationCandidates.length>20) throw Error('RECENTJOBS_CONTENT_LIMIT');
  const issues=parsed.issues.filter(i=>!['application_route_missing','multiple_application_routes'].includes(i));
  if(!applicationCandidates.length) issues.push('application_route_missing');
  if(applicationCandidates.length>1) issues.push('multiple_application_routes');
  if(new Set(extras.map(r=>r.originalText)).size>1) issues.push('programme_subject_scope_review_required');
  if(!opened && JSON.stringify(applicationCandidates)===JSON.stringify(baseline.applicationCandidates) &&
    JSON.stringify(issues)===JSON.stringify(baseline.issues)) return baseline;
  const {contentHash:oldHash,observedOn,review,issues:oldIssues,...fields}=parsed;
  const candidate={...fields,adapter:RECENTJOBS_APPLICATION_LAYOUTS_ADAPTER,applicationCandidates};
  return {...candidate,contentHash:createHash('sha256').update(JSON.stringify(candidate)).digest('hex'),observedOn,review,issues};
}
