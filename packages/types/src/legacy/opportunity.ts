import { z } from 'zod';

export const OpportunityTypeSchema = z.enum([
  'apprenticeship',
  'learnership',
  'bursary',
  'job',
  'trade_test',
  'short_course',
]);
export type OpportunityType = z.infer<typeof OpportunityTypeSchema>;

export const TradeCategorySchema = z.enum([
  'electrical',
  'plumbing',
  'welding',
  'automotive',
  'construction',
  'hvac',
  'mechanical',
  'mining',
  'ict',
  'agriculture',
  'logistics',
  'clothing',
  'other',
]);
export type TradeCategory = z.infer<typeof TradeCategorySchema>;

export const ProvinceSchema = z.enum([
  'gauteng',
  'western_cape',
  'kwazulu_natal',
  'eastern_cape',
  'limpopo',
  'mpumalanga',
  'north_west',
  'free_state',
  'northern_cape',
  'national',
]);
export type Province = z.infer<typeof ProvinceSchema>;

export const ExperienceLevelSchema = z.enum([
  'entry_level',
  '1_3_years',
  '3_plus_years',
  'trade_tested',
]);
export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>;

export const ATSPlatformSchema = z.enum([
  'successfactors',
  'oracle_taleo',
  'pageup',
  'merseta_portal',
  'ewseta_portal',
  'ceta_portal',
  'email_only',
  'direct_web_form',
  'job_board_hosted',
  'unknown',
]);
export type ATSPlatform = z.infer<typeof ATSPlatformSchema>;

export const RequiredDocumentTypeSchema = z.enum([
  'sa_id',
  'tvet_certificate',
  'trade_test_certificate',
  'proof_of_address',
  'matric_certificate',
  'driver_licence',
  'cv',
  'wiremans_licence',
]);
export type RequiredDocumentType = z.infer<typeof RequiredDocumentTypeSchema>;

export const OpportunitySchema = z.object({
  // Identity
  id: z.string(),
  slug: z.string(),

  // Classification
  title: z.string(),
  organisation: z.string(),
  opportunityType: OpportunityTypeSchema,
  tradeCategory: TradeCategorySchema,
  subTrade: z.string().optional(),

  // Location
  province: ProvinceSchema,
  city: z.string().optional(),
  remote: z.boolean().default(false),

  // Compensation
  salaryAmount: z.number().optional(),
  salaryCurrency: z.literal('ZAR').default('ZAR'),
  salaryType: z
    .enum(['monthly', 'annual', 'stipend', 'funded', 'market_related'])
    .optional(),
  salaryDisplay: z.string().optional(),

  // Requirements
  qualificationsRequired: z.array(z.string()).default([]),
  nqfLevelRequired: z.number().min(1).max(10).optional(),
  experienceRequired: ExperienceLevelSchema.optional(),
  tradeTested: z.boolean().default(false),
  documentsRequired: z.array(z.string()).default([]),
  requiredDocuments: z.array(RequiredDocumentTypeSchema).default([]),

  // ATS Detection (Sprint 1)
  applicationPlatform: ATSPlatformSchema.default('unknown'),
  applicationPlatformConfidence: z
    .enum(['high', 'medium', 'low'])
    .default('medium'),
  requiresAccountCreation: z.boolean().default(false),
  captchaLikely: z.boolean().default(false),
  formComplexityEstimate: z.number().min(0).max(100).default(0),

  // Employer Accountability (Sprint 3/4)
  employerAccountabilityScore: z.number().optional(),
  employerAccountabilityGrade: z.enum(['A', 'B', 'C', 'D', 'F']).optional(),
  employerScoreUpdatedAt: z.string().optional(),

  // Content
  descriptionFull: z.string(),
  descriptionSummary: z.string(),
  requirementsChecklist: z.array(z.string()).optional(),
  duration: z.string().optional(),

  // Application
  applicationUrl: z.string().url().optional(),
  applicationEmail: z.string().email().optional(),
  applicationMethod: z.enum(['external', 'email', 'in_app']),
  deadline: z.string().optional(),
  deadlineDisplay: z.string().optional(),

  // Source & Discovery
  sourceUrl: z.string(),
  sourceName: z.string(),
  sourceType: z.enum(['seta', 'jobboard', 'government', 'employer', 'tvet_college']),
  discoveredAt: z.string(),
  agentRunId: z.string(),

  // Quality
  qualityScore: z.number().min(0).max(100).default(0),
  qualityDecision: z
    .enum(['published', 'rejected', 'flagged', 'pending'])
    .default('pending'),
  qualityReason: z.string().optional(),
  isVerifiedSource: z.boolean().default(false),

  // Status
  status: z.enum(['active', 'expired', 'removed']).default('active'),
  expiredAt: z.string().optional(),
  removedAt: z.string().optional(),
  removedReason: z.string().optional(),

  // Engagement
  viewCount: z.number().default(0),
  applyClickCount: z.number().default(0),
  shareCount: z.number().default(0),

  // Metadata
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Opportunity = z.infer<typeof OpportunitySchema>;
