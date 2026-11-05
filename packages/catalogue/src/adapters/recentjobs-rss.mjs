import {createHash} from 'node:crypto';
import {XMLParser,XMLValidator} from 'fast-xml-parser';
import {parse,parseFragment,serialize} from 'parse5';
import {DateSchema} from '@skilved/types/opportunities';
import {parseWorkerDetail} from '../worker-detail-adapter.mjs';
import {DomainError} from '../config.mjs';

export const RECENTJOBS_CATEGORY_FEED='https://recentjobs.co.za/category/apprenticeships/feed/';
export const RECENTJOBS_RSS_ADAPTER='recentjobs_category_rss_review_v1';
const CONTENT_NS='http://purl.org/rss/1.0/modules/content/',ATOM_NS='http://www.w3.org/2005/Atom';
const hash=value=>createHash('sha256').update(value).digest('hex'),fail=code=>{throw new DomainError(code);};
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const array=value=>value===undefined?[]:Array.isArray(value)?value:[value];
function scalar(value,max=2048){
 if(typeof value!=='string'||!value.trim()||value.length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value))fail('RECENTJOBS_RSS_FIELD_INVALID');return value.trim();
}
function textValue(node,max){if(object(node)){if(Object.keys(node).some(key=>key!=='#text'&&!key.startsWith('@_')))fail('RECENTJOBS_RSS_FIELD_INVALID');return scalar(node['#text'],max);}return scalar(node,max);}
function articleUrl(value){
 const raw=scalar(value);let url;try{url=new URL(raw);}catch{fail('RECENTJOBS_RSS_ARTICLE_URL_INVALID');}
 const match=url.pathname.match(/^\/(\d{4})\/(\d{2})\/(\d{2})\/[a-z0-9-]+\/$/i);
 if(url.protocol!=='https:'||url.hostname!=='recentjobs.co.za'||url.username||url.password||url.port||url.search||url.hash||!match||
  !DateSchema.safeParse(match[1]+'-'+match[2]+'-'+match[3]).success)fail('RECENTJOBS_RSS_ARTICLE_URL_INVALID');return url.href;
}
const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],weekdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function rssInstant(value){
 const raw=scalar(value,100),m=raw.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat), (\d{2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d{2}):(\d{2}):(\d{2}) (GMT|[+-]\d{4})$/);
 if(!m)fail('RECENTJOBS_RSS_DATE_INVALID');const [,weekday,day,month,year,hour,minute,second,zone]=m;
 const date=year+'-'+String(months.indexOf(month)+1).padStart(2,'0')+'-'+day;
 if(!DateSchema.safeParse(date).success||+hour>23||+minute>59||+second>59||weekdays[new Date(date+'T00:00:00.000Z').getUTCDay()]!==weekday)fail('RECENTJOBS_RSS_DATE_INVALID');
 let offset=0;if(zone!=='GMT'){const h=+zone.slice(1,3),n=+zone.slice(3);if(h>23||n>59)fail('RECENTJOBS_RSS_DATE_INVALID');offset=(h*60+n)*(zone[0]==='-'?-1:1);}
 const at=Date.parse(date+'T'+hour+':'+minute+':'+second+'.000Z')-offset*60000;if(!Number.isFinite(at))fail('RECENTJOBS_RSS_DATE_INVALID');return new Date(at).toISOString();
}
function inspectNamespaces(node,root=false,depth=0){
 if(depth>32)fail('RECENTJOBS_RSS_LIMIT');if(Array.isArray(node)){for(const item of node)inspectNamespaces(item,false,depth+1);return;}
 if(!object(node))return;for(const[key,value]of Object.entries(node)){
  if(key.startsWith('@_xmlns')&&!root)fail('RECENTJOBS_RSS_NAMESPACE_INVALID');inspectNamespaces(value,false,depth+1);
 }
}

/** Pure, bounded RSS intake for engineering review. No discovery queue, cache,
 * model, canonical record, source policy or publication is changed here. */
export function parseRecentJobsRss({xml,url}={}){
 if(url!==RECENTJOBS_CATEGORY_FEED)fail('RECENTJOBS_RSS_URL_INVALID');
 if(typeof xml!=='string'||!xml||Buffer.byteLength(xml)>500000)fail('RECENTJOBS_RSS_LIMIT');
 // No DTD/custom entities or external processing instructions. The input is
 // parsed as data; neither publisher scripts nor encoded HTML are executed.
 if(/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml)||/<\?(?!xml\s)/i.test(xml))fail('RECENTJOBS_RSS_DECLARATION_UNSUPPORTED');
 let root;try{
  if(XMLValidator.validate(xml)!==true)fail('RECENTJOBS_RSS_XML_INVALID');
  root=new XMLParser({ignoreAttributes:false,ignoreDeclaration:true,parseTagValue:false,parseAttributeValue:false,trimValues:false,
   maxNestedTags:32,strictReservedNames:true,onDangerousProperty:()=>{throw Error('Reserved XML property');},
   processEntities:{enabled:true,maxEntityCount:100,maxEntitySize:10000,maxExpansionDepth:10,maxTotalExpansions:100000,maxExpandedLength:500000}}).parse(xml);
 }catch{fail('RECENTJOBS_RSS_XML_INVALID');}
 if(!object(root)||Object.keys(root).join('|')!=='rss'||!object(root.rss))fail('RECENTJOBS_RSS_LAYOUT_CHANGED');
 const rss=root.rss;if(rss['@_version']!=='2.0'||rss['@_xmlns:content']!==CONTENT_NS||rss['@_xmlns:atom']!==ATOM_NS||Object.hasOwn(rss,'@_xmlns'))fail('RECENTJOBS_RSS_NAMESPACE_INVALID');
 inspectNamespaces(rss,true);const channel=rss.channel;if(!object(channel))fail('RECENTJOBS_RSS_LAYOUT_CHANGED');
 const home=scalar(channel.link);if(!['https://recentjobs.co.za','https://recentjobs.co.za/'].includes(home))fail('RECENTJOBS_RSS_CHANNEL_INVALID');
 const self=array(channel['atom:link']).filter(node=>object(node)&&node['@_rel']==='self');
 if(self.length!==1||self[0]['@_href']!==url||self[0]['@_type']!=='application/rss+xml')fail('RECENTJOBS_RSS_CHANNEL_INVALID');
 const title=scalar(channel.title,500),builtAt=rssInstant(channel.lastBuildDate),rows=array(channel.item);
 if(rows.length<1||rows.length>50)fail('RECENTJOBS_RSS_LIMIT');const seenUrls=new Set(),seenGuids=new Set(),items=[];
 for(const row of rows){
  if(!object(row))fail('RECENTJOBS_RSS_ITEM_INVALID');const sourceUrl=articleUrl(row.link),itemTitle=scalar(row.title,500),guid=textValue(row.guid,2048),publishedAtRaw=scalar(row.pubDate,100),publishedAt=rssInstant(publishedAtRaw);
  if(publishedAt>builtAt)fail('RECENTJOBS_RSS_DATE_INVALID');
  const categories=array(row.category).map(value=>textValue(value,200));if(!categories.includes('Apprenticeships'))fail('RECENTJOBS_RSS_CATEGORY_INVALID');
  if(typeof row['content:encoded']!=='string'||!row['content:encoded'].trim()||Buffer.byteLength(row['content:encoded'])>200000)fail('RECENTJOBS_RSS_FULL_CONTENT_REQUIRED');
  if(seenUrls.has(sourceUrl)||seenGuids.has(guid))fail('RECENTJOBS_RSS_DUPLICATE_ITEM');seenUrls.add(sourceUrl);seenGuids.add(guid);
  const item={sourceUrl,title:itemTitle,guid,publishedAtRaw,publishedAt,categories,contentHtml:row['content:encoded']};
  items.push({...item,itemHash:hash(JSON.stringify(item)),sourceRecordId:hash(sourceUrl)});
 }
 return{adapter:RECENTJOBS_RSS_ADAPTER,sourceUrl:url,feedHash:hash(xml),title,builtAt,items,coverage:'feed_window_only',publication:false};
}

const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function walk(root,test){const stack=[[root,0]],found=[];let count=0;while(stack.length){const[node,depth]=stack.pop();if(++count>25000||depth>100)fail('RECENTJOBS_RSS_LIMIT');if(test(node))found.push(node);for(const child of [...(node.childNodes??[]),...(node.content?.childNodes??[])].reverse())stack.push([child,depth+1]);}return found;}
function reviewFrame(item){
 let guid;try{guid=new URL(item.guid);}catch{fail('RECENTJOBS_RSS_REVIEW_ID_UNSUPPORTED');}
 const postId=guid.searchParams.get('p');if(guid.origin!=='https://recentjobs.co.za'||guid.pathname!=='/'||guid.username||guid.password||guid.hash||
  [...guid.searchParams.keys()].join('|')!=='p'||!/^[1-9]\d{0,11}$/.test(postId??''))fail('RECENTJOBS_RSS_REVIEW_ID_UNSUPPORTED');
 const root=parse('<!doctype html><html><head><link rel="canonical" href="'+escape(item.sourceUrl)+'"></head><body><article class="post type-post" id="post-'+postId+'"><h1 class="entry-title">'+escape(item.title)+'</h1><time class="entry-date published" datetime="'+escape(item.publishedAt)+'"></time><div class="entry-content"></div></article></body></html>');
 const content=walk(root,node=>node.attrs?.some(attr=>attr.name==='class'&&attr.value==='entry-content'))[0],fragment=parseFragment(item.contentHtml);walk(fragment,()=>false);
 content.childNodes=fragment.childNodes;for(const child of content.childNodes)child.parentNode=content;
 return serialize(root);
}

/** Review-only derived frame. Its marker/hash explicitly distinguish RSS data
 * from fetched WordPress HTML. This is not imported by the running worker. */
export function reviewRecentJobsRssItem(source,feed,index,{observedOn=null}={}){
 if(source?.permission?.method!=='recentjobs_html'||source.automation?.mode!=='shadow'||!Number.isSafeInteger(index)||index<0||index>=feed?.items?.length)fail('RECENTJOBS_RSS_REVIEW_CONFIGURATION_REQUIRED');
 const item=feed.items[index];
 // Detect accidental substitution of parsed items before framing. These hashes
 // identify content; they grant no publisher, worker or publication authority.
 const {itemHash,sourceRecordId,...fields}=item;
 if(feed.adapter!==RECENTJOBS_RSS_ADAPTER||feed.sourceUrl!==RECENTJOBS_CATEGORY_FEED||hash(JSON.stringify(fields))!==itemHash||sourceRecordId!==hash(articleUrl(item.sourceUrl)))fail('RECENTJOBS_RSS_ITEM_CHANGED');
 const parsed=parseWorkerDetail(source,{html:reviewFrame(item),url:item.sourceUrl,observedOn});
 const {contentHash:oldHash,review,issues,observedOn:day,...candidate}=parsed;
 const rssEvidence={feedUrl:feed.sourceUrl,itemHash:item.itemHash,guid:item.guid,publishedAtRaw:item.publishedAtRaw};
 const bound={...candidate,adapter:RECENTJOBS_RSS_ADAPTER,rssEvidence};
 return{...bound,contentHash:hash(JSON.stringify(bound)),observedOn:day,review:'pending',issues:[...issues,'feed_transport_requires_review']};
}
