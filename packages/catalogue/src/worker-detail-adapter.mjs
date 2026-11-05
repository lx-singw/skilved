import { DomainError } from './config.mjs';
import { parseRecentJobsDetail } from './adapters/recentjobs.mjs';
import { parseRecentJobsApplicationLayouts } from './adapters/recentjobs-application-layouts.mjs';
import {usesPublisherFeed,RSS_SOURCE_PROFILE} from './publisher-feed-policy.mjs';

export const APPLICATION_LAYOUTS_PROFILE = 'application_layouts_shadow_v1';
function enabled(source) {
  const setting=source.automation?.applicationLayouts;
  if(setting===undefined) return false;
  if(setting!=='shadow_v1' || source.automation.mode!=='shadow' || source.permission?.method!=='recentjobs_html')
    throw new DomainError('SOURCE_POLICY_REQUIRED');
  return true;
}

/** Shared worker boundary; legacy parsing remains the default without source opt-in. */
export function parseWorkerDetail(source,input) {
  return enabled(source) ? parseRecentJobsApplicationLayouts(input) : parseRecentJobsDetail(input);
}

// Preserve legacy hold serialization. Opt-in holds are distinguishable even when
// no route changed; disabling or enabling must not reuse the other profile's hold.
export function sourceHoldAdapterFields(source) {
  return {...(enabled(source)?{detailAdapterProfile:APPLICATION_LAYOUTS_PROFILE}:{}),
    ...(usesPublisherFeed(source)?{publisherFeedProfile:RSS_SOURCE_PROFILE}:{})};
}
export function sourceHoldAdapterMatches(source,saved) {
  const profile=sourceHoldAdapterFields(source);
  return saved!=null&&['detailAdapterProfile','publisherFeedProfile'].every(key=>
    Object.hasOwn(profile,key)?saved[key]===profile[key]:!Object.hasOwn(saved,key));
}
