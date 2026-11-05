import robotsParser from 'robots-parser';
import {FastRecentJobsWorker} from './fast-recentjobs-worker.mjs';
import {parseRecentJobsList} from './adapters/recentjobs.mjs';
import {RECENTJOBS_INDEX,assertSourceTarget} from './worker-policy.mjs';
import {DomainError} from './config.mjs';
import {usesPublisherFeed,RECENTJOBS_CATEGORY_FEED,publisherFeedUnavailable} from './publisher-feed-policy.mjs';
import {parseRecentJobsRss,rssDiscoveryList} from './adapters/recentjobs-rss.mjs';

const fail=code=>{throw new DomainError(code);};
const UA='SkilvedSourceReview/1.0';

/** One explicit bounded poll, not a daemon or publication entry point. Saved
 * parsed pages survive ownership recovery; every queue chunk revalidates them. */
export class FastRecentJobsDiscovery {
  constructor(worker,{enabled=false}={}) {
    if(enabled!==true)fail('FAST_INGESTION_DISABLED');
    if(!(worker instanceof FastRecentJobsWorker))fail('FAST_DISCOVERY_WORKER_REQUIRED');
    this.worker=worker;this.store=worker.fast;
  }
  stopped(signal){if(signal?.aborted)fail('FAST_DISCOVERY_STOPPED');}
  async request(claim,source,url,format,signal) {
    this.stopped(signal);
    const reservation=await this.store.reserveFetch(claim);
    for(let attempt=0;;attempt++){
      await this.worker.sleep(Math.max(0,Date.parse(reservation.at)-Date.parse(this.worker.now())));this.stopped(signal);
      try{await this.store.admitFetch(claim,reservation);break;}
      catch(error){if(error.code!=='FETCH_PACING_RETRY'||attempt>=2)throw error;await this.worker.sleep(Math.max(0,Date.parse(error.retryAt)-Date.parse(this.worker.now())));}
    }
    // Admission includes current source/grant/authority and poll ownership.
    this.stopped(signal);
    const response=await this.worker.fetcher({...source,urls:[url]},url,undefined,format);
    if(response?.url!==url||typeof response.text!=='string'||Buffer.byteLength(response.text)>source.maxBytes)fail('UNSAFE_RESPONSE');
    return response;
  }
  async poll({signal}={}) {
    if(signal!==undefined&&!(signal instanceof AbortSignal))fail('FAST_DISCOVERY_CONFIGURATION_REQUIRED');
    if(signal?.aborted)return{state:'stopped',queued:0};
    const poll=await this.store.poll();if(poll.state!=='ready')return poll;
    return this.worker.superviseLease(poll.claim,async()=>{
      try{return await this.acquire(poll,signal);}
      catch(error){
        if(poll.discoveryUrl===RECENTJOBS_CATEGORY_FEED&&publisherFeedUnavailable(error?.code)){
          this.stopped(signal);const retry=await this.store.recordFeedUnavailable(poll.claim);
          return{state:'source_unavailable',queued:0,reason:error.code,nextPollAt:retry.nextPollAt,publiclyVisible:false};
        }
        if(error?.code!=='RECENTJOBS_SOURCE_CHALLENGE')throw error;
        this.stopped(signal);const retry=await this.store.recordSourceChallenge(poll.claim);
        return{state:'source_challenged',queued:0,nextPollAt:retry.nextPollAt,publiclyVisible:false};
      }
    },undefined,{signal});
  }
  async acquire(poll,signal) {
    const claim=poll.claim;let url=poll.discoveryUrl??RECENTJOBS_INDEX,pages=0,queued=0,observed=0,cacheHits=0;
    for(let number=1;number<=5;number++){
      this.stopped(signal);if(url!==RECENTJOBS_CATEGORY_FEED)assertSourceTarget(url,'index');
      let {page,source}=await this.store.discoveryPage(claim,url);
      if(!page){
        const robotsUrl=new URL('/robots.txt',url).href;
        const robots=await this.request(claim,source,robotsUrl,'text',signal),policy=robotsParser(robotsUrl,robots.text);
        if(policy.isAllowed(url,UA)!==true)fail('ROBOTS_DISALLOWED');
        const delay=policy.getCrawlDelay(UA);if(delay&&delay*1000>source.automation.minRequestIntervalMs)fail('ROBOTS_DELAY_EXCEEDS_POLICY');
        const rss=usesPublisherFeed(source),response=await this.request(claim,source,url,rss?'rss':'html',signal),retrievedAt=this.worker.now();
        const list=rss?rssDiscoveryList(parseRecentJobsRss({xml:response.text,url:response.url})):parseRecentJobsList({html:response.text,url:response.url});this.stopped(signal);
        ({page,source}=await this.store.discoveryPage(claim,url,{capture:{list,retrievedAt}}));
      }else cacheHits++;
      pages++;const last=page.list.nextPage===null||number===source.automation.discovery.maxPages;
      for(let offset=0;offset<page.list.articles.length;offset+=source.automation.maxArticles){
        this.stopped(signal);const articles=page.list.articles.slice(offset,offset+source.automation.maxArticles);
        const result=await this.store.recordDiscovery(claim,articles.map(a=>a.sourceUrl),{pageReceiptId:page.id,
          complete:last&&offset+articles.length===page.list.articles.length});queued+=result.queued;observed+=result.observed;
      }
      if(last)return{state:'complete',pollId:claim.id,pages,queued,observed,cacheHits,stop:page.list.nextPage===null?'end':'page_limit',nextPollAt:poll.nextPollAt,publiclyVisible:false};
      url=page.list.nextPage;
    }
    fail('FAST_DISCOVERY_STATE_INVALID');
  }
}
