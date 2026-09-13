import { z } from 'zod';

export const AgentRunSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  agentName: z.string(),
  agentVersion: z.string(),
  triggerType: z.enum(['cron', 'event', 'http', 'manual']),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  status: z.enum(['running', 'completed', 'failed', 'circuit_breaker_triggered']),
  
  // Execution Metrics
  inputCount: z.number().default(0),
  outputCount: z.number().default(0),
  humanApprovalsRequired: z.literal(0).default(0), // Key principle: ALWAYS 0
  circuitBreakerTriggered: z.boolean().default(false),
  
  // Details
  errorDetails: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type AgentRun = z.infer<typeof AgentRunSchema>;
