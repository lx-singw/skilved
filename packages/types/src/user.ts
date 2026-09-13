import { z } from 'zod';
import { ProvinceSchema, TradeCategorySchema } from './opportunity';

export const CompletenessLevelSchema = z.enum([
  'starter',
  'active',
  'strong',
  'skilved',
  'verified',
]);
export type CompletenessLevel = z.infer<typeof CompletenessLevelSchema>;

export const EmploymentStatusSchema = z.enum([
  'unemployed',
  'employed_looking',
  'employed_satisfied',
  'student_apprentice',
  'freelance_contractor',
]);
export type EmploymentStatus = z.infer<typeof EmploymentStatusSchema>;

export const PassportQualificationSchema = z.object({
  name: z.string(),
  nqfLevel: z.number().min(1).max(10),
  issuingAuthority: z.string(),
  issueDate: z.string().optional(),
  verified: z.boolean().default(false),
  verificationSource: z
    .enum(['mymzansi', 'saqa', 'seta', 'self_reported'])
    .optional(),
});
export type PassportQualification = z.infer<typeof PassportQualificationSchema>;

export const ExtractedSkillSchema = z.object({
  skill: z.string(),
  category: z.string(),
  nqfLevel: z.number().optional(),
  sourceType: z.enum(['free_text', 'document_ai', 'mymzansi', 'outcome']),
  confidence: z.number().min(0).max(1),
  extractedAt: z.string(),
});
export type ExtractedSkill = z.infer<typeof ExtractedSkillSchema>;

export const PassportWorkEntrySchema = z.object({
  roleTitle: z.string(),
  employerName: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
  skillsUsed: z.array(z.string()).default([]),
  verified: z.boolean().default(false),
});
export type PassportWorkEntry = z.infer<typeof PassportWorkEntrySchema>;

export const SkillsPassportSchema = z.object({
  userId: z.string(),
  version: z.number().default(1),
  lastEnrichedAt: z.string(),
  agentVersion: z.string().default('v1.0'),

  // Completeness
  completenessScore: z.number().min(0).max(100).default(0),
  completenessLevel: CompletenessLevelSchema.default('starter'),

  // Trade identity
  primaryTrade: TradeCategorySchema,
  subSpecialisations: z.array(z.string()).default([]),
  province: ProvinceSchema,
  willingToRelocate: z.boolean().default(false),

  // Qualifications
  qualifications: z.array(PassportQualificationSchema).default([]),
  highestNqfLevel: z.number().default(0),
  tradeTested: z.boolean().default(false),
  tradeTestDate: z.string().optional(),

  // Skills
  extractedSkills: z.array(ExtractedSkillSchema).default([]),

  // Work history
  workHistory: z.array(PassportWorkEntrySchema).default([]),
  yearsExperience: z.number().default(0),
  employmentStatus: EmploymentStatusSchema.default('unemployed'),

  // Verification state
  myMzansiLinked: z.boolean().default(false),

  // Agent readable summary
  agentSummary: z.string(),

  // Stats
  placementCount: z.number().default(0),
  applicationSuccessRate: z.number().optional(),
});

export type SkillsPassport = z.infer<typeof SkillsPassportSchema>;

export const DocumentTypeSchema = z.enum([
  'sa_id',
  'passport',
  'trade_test_certificate',
  'tvet_certificate',
  'wiremans_licence',
  'matric_certificate',
  'driver_licence',
  'proof_of_address',
  'cv',
  'other',
]);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export const DocumentVerificationStatusSchema = z.enum([
  'unverified',
  'pending_verification',
  'verified_saqa',
  'verified_namb',
  'verified_mymzansi',
  'rejected',
  'expired',
]);
export type DocumentVerificationStatus = z.infer<typeof DocumentVerificationStatusSchema>;

export const IdentityDocumentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  documentType: DocumentTypeSchema,
  fileName: z.string(),
  storageUri: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  kmsKeyId: z.string(),
  
  // Verification State
  verificationStatus: DocumentVerificationStatusSchema.default('unverified'),
  verifiedAt: z.string().optional(),
  verificationSource: z.enum(['saqa', 'namb', 'mymzansi', 'manual']).optional(),
  verificationDetails: z.record(z.unknown()).optional(),

  // Metadata
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  uploadedAt: z.string(),
  updatedAt: z.string(),
});

export type IdentityDocument = z.infer<typeof IdentityDocumentSchema>;
