import {InstantSchema} from '@skilved/types/opportunities';
import {DomainError} from '../src/config.mjs';

/** Local scheduler admission only. This creates no timer, credentials or grants. */
export function scheduledWorkerStartWindow(plan, {now = Date.now} = {}) {
  if (!InstantSchema.safeParse(plan?.startAt).success || !InstantSchema.safeParse(plan?.latestStartAt).success ||
      typeof now !== 'function') throw new DomainError('SCHEDULE_CONFIGURATION_REQUIRED');
  const first=Date.parse(plan.startAt),last=Date.parse(plan.latestStartAt),current=now();
  if (last<=first || last-first>2*3600000 || !Number.isFinite(current)) throw new DomainError('SCHEDULE_CONFIGURATION_REQUIRED');
  return {state:current<first?'waiting':current>=last?'expired':'ready',startAt:plan.startAt,latestStartAt:plan.latestStartAt};
}

/** Keep privileged bootstrap and its imports inside activate; never retry it here. */
export async function runScheduledWorkerStart(plan, activate, options) {
  if (typeof activate!=='function') throw new DomainError('SCHEDULE_CONFIGURATION_REQUIRED');
  const window=scheduledWorkerStartWindow(plan,options);
  if (window.state!=='ready') return {window,activated:false};
  return {window,activated:true,result:await activate()};
}
