import {createHash} from 'node:crypto';
import {z} from 'zod';
import {IdSchema,InstantSchema} from '@skilved/types/opportunities';
export const refreshHash=s=>createHash('sha256').update(s).digest('hex');
const digest=z.string().regex(/^[a-f0-9]{64}$/);
export const RefreshTicket=z.object({version:z.literal('private_v1'),generation:z.number().int().min(1).max(1000000),
 requestedAt:InstantSchema,archiveId:IdSchema,previousExecutionId:IdSchema,previousJobSha256:digest,
 previousDraftSha256:digest,previousExecutionSha256:digest}).strict();
export const RefreshWatch=z.object({version:z.literal('private_v1'),sourceId:IdSchema,sourceRevision:z.number().int().positive(),
 noticeId:IdSchema,generation:z.number().int().min(0).max(1000000),executionId:IdSchema,recordId:IdSchema,
 state:z.enum(['waiting','scheduled','blocked']),nextAt:InstantSchema,updatedAt:InstantSchema,
 jobSha256:digest,draftSha256:digest,executionSha256:digest,
 reason:z.enum(['binding_changed','public_or_reviewed','execution_changed','source_revision','archive_conflict']).optional()}).strict();
export const DispatchCounter=z.object({sourceId:IdSchema,sourceRevision:z.number().int().positive(),newSinceRefresh:z.number().int().min(0).max(3)}).strict();
export const RefreshFeature=z.object({version:z.literal('private_v1'),sourceId:IdSchema,sourceRevision:z.number().int().positive(),activatedAt:InstantSchema}).strict();
export function fastExecutionId(job){return refreshHash('fast-single:'+job.id+':'+job.sourceRevision+(job.refresh?':refresh:'+job.refresh.generation:''));}
export function readyFastJobs(jobs,revision,at){return jobs.filter(j=>!j.history&&j.sourceRevision===revision&&['queued','leased'].includes(j.state)&&j.nextAt<=at&&!(j.leaseUntil>at));}
export function dispatchKind(jobs,revision,at,count){const due=readyFastJobs(jobs,revision,at),hasRefresh=due.some(j=>j.refresh);return count>=3&&hasRefresh?'refresh':due.some(j=>!j.refresh)?'new':hasRefresh?'refresh':null;}
