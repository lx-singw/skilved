import {DomainError} from './config.mjs';
export const RECENTJOBS_CATEGORY_FEED='https://recentjobs.co.za/category/apprenticeships/feed/';
export const RSS_SOURCE_PROFILE='rss_shadow_v1';
const unavailable=new Set(['UNSUPPORTED_RESPONSE','BODY_TOO_LARGE','FETCH_TIMEOUT','ABORT_ERR','ETIMEDOUT','ECONNRESET','EAI_AGAIN',
 'RECENTJOBS_RSS_XML_INVALID','RECENTJOBS_RSS_LAYOUT_CHANGED','RECENTJOBS_RSS_NAMESPACE_INVALID','RECENTJOBS_RSS_CHANNEL_INVALID',
 'RECENTJOBS_RSS_ITEM_INVALID','RECENTJOBS_RSS_FIELD_INVALID','RECENTJOBS_RSS_DATE_INVALID','RECENTJOBS_RSS_CATEGORY_INVALID',
 'RECENTJOBS_RSS_FULL_CONTENT_REQUIRED','RECENTJOBS_RSS_DUPLICATE_ITEM','RECENTJOBS_RSS_LIMIT',
 'RECENTJOBS_RSS_DECLARATION_UNSUPPORTED','RECENTJOBS_RSS_ARTICLE_URL_INVALID']);
export const publisherFeedUnavailable=code=>unavailable.has(code);
export function usesPublisherFeed(source){
 const setting=source?.automation?.publisherFeed;if(setting===undefined)return false;
 if(setting!==RSS_SOURCE_PROFILE||source.permission?.method!=='recentjobs_html'||source.automation.mode!=='shadow'||
  !source.automation.fastIngestion||source.automation.discovery?.maxPages!==1||
  !source.urls?.includes(RECENTJOBS_CATEGORY_FEED)||!source.urls.includes('https://recentjobs.co.za/category/apprenticeships/'))
  throw new DomainError('SOURCE_POLICY_REQUIRED');
 return true;
}
