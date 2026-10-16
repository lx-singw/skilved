/** Browser-safe M0 contract. Internal records/projectors are a separate entry point. */
export { CategorySchema, CATEGORY_LABELS, ProvinceSchema, InternshipSchema, IdSchema, InstantSchema, DateSchema } from './primitives';
export type { Category } from './primitives';
export * from './public';
export { formatRequirements, PublicRequirementSetSchema } from './requirements';
export { DeadlineSchema, deadlineTiming, CompensationSchema, ApplicationRouteSchema } from './values';
export { EntryStageSchema, EntryStagesSchema, ENTRY_STAGE_LABELS } from './values';
export type { EntryStage } from './values';
export * from './api';
export * from './local-progress';
