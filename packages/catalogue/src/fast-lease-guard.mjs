import {setTimeout as delay} from 'node:timers/promises';
import {DomainError} from './config.mjs';

const fail=code=>{throw new DomainError(code);};
export function leaseSupervisionOptions(input) {
  if(input===false)return false;
  if(!input||input.enabled!==true||Object.keys(input).some(k=>!['enabled','maxRunMs','wait','monotonic'].includes(k))||
    input.maxRunMs!==undefined&&(!Number.isSafeInteger(input.maxRunMs)||input.maxRunMs<1||input.maxRunMs>3600000)||
    input.wait!==undefined&&typeof input.wait!=='function'||input.monotonic!==undefined&&typeof input.monotonic!=='function')fail('FAST_LEASE_CONFIGURATION_REQUIRED');
  return{enabled:true,maxRunMs:input.maxRunMs??900000,wait:input.wait??((ms,signal)=>delay(ms,undefined,{signal})),monotonic:input.monotonic??(()=>performance.now())};
}

/** One non-overlapping renewal loop, always drained before scope exit. A lost
 * heartbeat fences later transactions; it never refunds already admitted work. */
export class FastLeaseGuard {
  constructor({renew,intervalMs,maxRunMs,wait,monotonic,signal}) {
    if(typeof renew!=='function'||!Number.isSafeInteger(intervalMs)||intervalMs<1||intervalMs>10000||
      !Number.isSafeInteger(maxRunMs)||maxRunMs<1||typeof wait!=='function'||typeof monotonic!=='function'||signal!==undefined&&!(signal instanceof AbortSignal))fail('FAST_LEASE_CONFIGURATION_REQUIRED');
    Object.assign(this,{renew,intervalMs,maxRunMs,wait,monotonic,signal});
    this.started=monotonic();this.elapsed=0;this.cancel=new AbortController();this.stopping=false;this.error=null;
    if(!Number.isFinite(this.started))fail('FAST_LEASE_CLOCK_INVALID');
  }
  assertHealthy() {
    if(this.error)throw this.error;
    const elapsed=this.monotonic()-this.started;
    if(!Number.isFinite(elapsed)||elapsed<this.elapsed)this.error=new DomainError('FAST_LEASE_CLOCK_INVALID');
    else if(this.signal?.aborted)this.error=new DomainError('FAST_LEASE_STOPPED');
    else if(elapsed>=this.maxRunMs)this.error=new DomainError('FAST_LEASE_RUNTIME_LIMIT');
    this.elapsed=elapsed;if(this.error)throw this.error;
  }
  async loop() {
    try {
      while(!this.stopping){
        this.assertHealthy();await this.wait(Math.min(this.intervalMs,this.maxRunMs-this.elapsed),this.cancel.signal);
        if(this.stopping)return;this.assertHealthy();await this.renew();
      }
    } catch(error) {
      if(!(this.stopping&&this.cancel.signal.aborted&&error?.name==='AbortError'))this.error??=error;
    }
  }
  async stopRenewals() {
    this.stopping=true;this.cancel.abort();await this.pending;this.assertHealthy();
  }
  async run(work) {
    this.assertHealthy();this.pending=this.loop();
    try{const result=await work();if(!this.stopping)await this.stopRenewals();else await this.pending;return result;}
    finally{this.stopping=true;this.cancel.abort();await this.pending;}
  }
}
