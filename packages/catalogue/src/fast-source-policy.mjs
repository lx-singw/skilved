import {z} from 'zod';
export const FastSourcePolicy=z.object({version:z.literal('shadow_v1'),
  discoveryIntervalMs:z.number().int().min(120000).max(300000),
  maxConcurrentJobs:z.number().int().min(1).max(20),
  leaseMs:z.number().int().min(30000).max(600000)}).strict();
