import {setTimeout as delay} from 'node:timers/promises';
import {InstantSchema} from '@skilved/types/opportunities';
import {DomainError} from './config.mjs';

const fail = code => { throw new DomainError(code); };
const integer = (value,min,max) => Number.isSafeInteger(value) && value >= min && value <= max;
const millis = instant => {
  if (!InstantSchema.safeParse(instant).success) fail('RUNNER_STATE_INVALID');
  return Date.parse(instant);
};
function state(row) {
  if (!row || !['ready','waiting'].includes(row.state) || !integer(row.queued,0,200) ||
      !integer(row.ready,0,row.queued)) fail('RUNNER_STATE_INVALID');
  millis(row.nextWakeAt);
  return row;
}

/** Bounded backend supervisor. It provisions no identity, grants, quota or timer. */
export async function runRecentJobsController({createController, signal, maxTicks = 24, maxRunMs = 2_700_000,
  pollMs = 60_000, now = Date.now, monotonic = () => performance.now(),
  wait = (ms,signal) => delay(ms,undefined,{signal}), onEvent = () => {}} = {}) {
  if (typeof createController !== 'function' || typeof now !== 'function' || typeof monotonic !== 'function' ||
      typeof wait !== 'function' || typeof onEvent !== 'function' || !integer(maxTicks,1,100) ||
      !integer(maxRunMs,1,43_200_000) || !integer(pollMs,1,60_000) ||
      signal !== undefined && !(signal instanceof AbortSignal)) fail('RUNNER_CONFIGURATION_REQUIRED');
  const started = monotonic();
  if (!Number.isFinite(started)) fail('RUNNER_STATE_INVALID');
  let ticks = 0, expected, earliestTick = 0, lastWake, lastNotice, previousElapsed = 0;
  const elapsed = () => {
    const value = monotonic() - started;
    if (!Number.isFinite(value) || value < previousElapsed) fail('RUNNER_STATE_INVALID');
    previousElapsed = value;
    return value;
  };
  const event = async row => { await onEvent(row); };
  const stop = async reason => {
    const result = {reason,ticks,nextWakeAt:lastWake ?? null};
    await event({type:'stopped',...result});
    return result;
  };
  try {
    while (true) {
      if (signal?.aborted) return await stop('signal');
      if (elapsed() >= maxRunMs) return await stop('max_runtime');
      if (ticks >= maxTicks) return await stop('max_ticks');
      // The factory renews/verifies identity. Probe rechecks current access and
      // work without adding audit/control rows on every idle poll.
      const controller = await createController();
      const identity = [controller?.sourceId,controller?.sourceRevision,controller?.worker?.principal];
      if (typeof controller?.probe !== 'function' || typeof controller?.tick !== 'function' ||
          typeof identity[0] !== 'string' || !integer(identity[1],1,Number.MAX_SAFE_INTEGER) ||
          typeof identity[2] !== 'string') fail('RUNNER_STATE_INVALID');
      if (expected && identity.some((v,i) => v !== expected[i])) fail('RUNNER_IDENTITY_CHANGED');
      expected ??= identity;
      const plan = state(await controller.probe()), wall = now();
      if (!Number.isFinite(wall)) fail('RUNNER_STATE_INVALID');
      if (signal?.aborted) return await stop('signal');
      if (elapsed() >= maxRunMs) return await stop('max_runtime');
      const target = Math.max(millis(plan.nextWakeAt),earliestTick);
      lastWake = new Date(target).toISOString();
      if (plan.state === 'ready' && target <= wall) {
        const result = state(await controller.tick({signal,shouldStop:() => elapsed() >= maxRunMs}));
        ticks++; lastWake = result.nextWakeAt;
        earliestTick = result.state === 'ready' ? millis(result.nextWakeAt) : 0;
        lastNotice = undefined;
        await event({type:'tick',ticks,state:result.state,nextWakeAt:result.nextWakeAt,
          queued:result.queued,outcomes:result.outcomes});
        continue;
      }
      if (target <= wall) fail('RUNNER_STATE_INVALID');
      const notice = JSON.stringify({nextWakeAt:lastWake,queued:plan.queued,reason:plan.reason});
      if (notice !== lastNotice) {
        await event({type:'waiting',ticks,nextWakeAt:lastWake,queued:plan.queued,reason:plan.reason});
        lastNotice = notice;
      }
      const remaining = maxRunMs - elapsed();
      if (remaining <= 0) return await stop('max_runtime');
      await wait(Math.min(pollMs,target-wall,remaining),signal);
    }
  } catch(error) {
    if (error?.code === 'WORKER_STOP_REQUESTED' && elapsed() >= maxRunMs)
      return await stop('max_runtime');
    if (signal?.aborted && (error?.name === 'AbortError' || error?.code === 'WORKER_STOP_REQUESTED'))
      return await stop('signal');
    await event({type:'failed',ticks,error:/^[A-Z_]+$/.test(error?.code ?? '') ? error.code : 'RUNNER_FAILED'});
    throw error;
  }
}
