import { DropletType, RecordStatus, VerticalDropletStatus } from '@prisma/client'
import { z } from 'zod'

import {
  cuidSchema,
  jsonValueSchema,
  nullableStringSchema,
  optionalNullableStringSchema,
} from '../../../lib/validation/common'
import { dropletEntities } from '../../../lib/droplets/entities'
import {
  dropletGenerationStatusSchema,
  dropletRunInputSchema,
  readonlyTableDropletDefinitionSchema,
} from '../../../lib/droplets/schema'
import {
  canonicalDropletEntities,
  commandAliasArraySchema,
  commandSchema,
  readonlyFilterSchema,
  shadowSkillDefinitionV2Schema,
} from './shadowSkillV2'

export const dropletTypeSchema = z.nativeEnum(DropletType)
export const dropletStatusSchema = z.nativeEnum(VerticalDropletStatus)
export const recordStatusSchema = z.nativeEnum(RecordStatus)

export const verticalDropletCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  description: nullableStringSchema,
  dropletType: dropletTypeSchema.default(DropletType.READONLY_TABLE),
  command: commandSchema,
  commandAliasesJson: commandAliasArraySchema,
  commandHelpText: z.string().trim().min(4).max(280),
  authorHintText: optionalNullableStringSchema,
  shadowSkillDefinitionJson: shadowSkillDefinitionV2Schema.optional(),
  generationPromptVersion: optionalNullableStringSchema,
  generationStatus: dropletGenerationStatusSchema.optional(),
  generationWarningsJson: z.array(z.string()).optional(),
  previewDummyDataConfigJson: jsonValueSchema.optional(),
  dropletDefinitionJson: readonlyTableDropletDefinitionSchema,
  supportedEntitiesJson: z.array(z.enum(canonicalDropletEntities)).min(1),
  status: dropletStatusSchema.default(VerticalDropletStatus.DRAFT),
  version: z.coerce.number().int().positive().default(1),
})

export const verticalDropletUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: optionalNullableStringSchema,
  dropletType: dropletTypeSchema.optional(),
  command: commandSchema.optional(),
  commandAliasesJson: commandAliasArraySchema.optional(),
  commandHelpText: z.string().trim().min(4).max(280).optional(),
  authorHintText: optionalNullableStringSchema,
  shadowSkillDefinitionJson: shadowSkillDefinitionV2Schema.optional(),
  generationPromptVersion: optionalNullableStringSchema,
  generationStatus: dropletGenerationStatusSchema.optional(),
  generationWarningsJson: z.array(z.string()).optional(),
  previewDummyDataConfigJson: jsonValueSchema.optional(),
  dropletDefinitionJson: readonlyTableDropletDefinitionSchema.optional(),
  supportedEntitiesJson: z.array(z.enum(canonicalDropletEntities)).optional(),
  status: dropletStatusSchema.optional(),
  version: z.coerce.number().int().positive().optional(),
})

export const promptTemplateCreateSchema = z.object({
  verticalId: cuidSchema.nullish(),
  key: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(160),
  purpose: z.string().trim().min(2).max(240),
  templateText: z.string().trim().min(10),
  version: z.coerce.number().int().positive().default(1),
  status: recordStatusSchema.default(RecordStatus.ACTIVE),
})

export const promptTemplateUpdateSchema = z.object({
  verticalId: cuidSchema.nullish().optional(),
  key: z.string().trim().min(2).max(120).optional(),
  name: z.string().trim().min(2).max(160).optional(),
  purpose: z.string().trim().min(2).max(240).optional(),
  templateText: z.string().trim().min(10).optional(),
  version: z.coerce.number().int().positive().optional(),
  status: recordStatusSchema.optional(),
})

export const dummyDataScenarioCreateSchema = z.object({
  verticalId: cuidSchema.nullish(),
  key: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(160),
  description: nullableStringSchema,
  entity: z.string().trim().min(2).max(120),
  scenarioJson: jsonValueSchema,
  status: recordStatusSchema.default(RecordStatus.ACTIVE),
})

export const dummyDataScenarioUpdateSchema = z.object({
  verticalId: cuidSchema.nullish().optional(),
  key: z.string().trim().min(2).max(120).optional(),
  name: z.string().trim().min(2).max(160).optional(),
  description: optionalNullableStringSchema,
  entity: z.string().trim().min(2).max(120).optional(),
  scenarioJson: jsonValueSchema.optional(),
  status: recordStatusSchema.optional(),
})

export const tenantDropletAssignmentUpdateSchema = z.object({
  nameOverride: optionalNullableStringSchema,
  placement: optionalNullableStringSchema,
  configOverrideJson: jsonValueSchema.optional(),
  active: z.coerce.boolean().optional(),
})

export const previewDropletSchema = z.object({
  dropletDefinitionJson: readonlyTableDropletDefinitionSchema.optional(),
  shadowSkillDefinitionJson: shadowSkillDefinitionV2Schema.optional(),
  dummyScenarioKey: z.string().trim().min(2).max(120).optional(),
  inputParams: dropletRunInputSchema.optional(),
})

export const commandExecuteSchema = z.object({
  command: z.string().trim().min(1),
})

export const exploreRequestSchema = z.object({
  entity: z.enum(dropletEntities),
  fields: z.array(z.string().min(1)).optional(),
  filters: z.array(readonlyFilterSchema).optional(),
  sort: z
    .object({
      field: z.string().min(1),
      direction: z.enum(['asc', 'desc']),
    })
    .optional(),
  grouping: z
    .object({
      field: z.string().min(1),
    })
    .optional(),
  labels: z.record(z.string(), z.string()).optional(),
  summary: z
    .object({
      enabled: z.boolean(),
      fields: z.array(z.string()).optional(),
    })
    .optional(),
  limit: z.coerce.number().int().positive().max(500).optional().default(50),
})

export const dropletRunSchema = z.object({
  dummyScenarioKey: z.string().trim().min(2).max(120).optional(),
  inputParams: dropletRunInputSchema.optional(),
})

export const verticalIdSchema = z.object({ verticalId: cuidSchema })
export const tenantDropletActivationSchema = z.object({
  placement: nullableStringSchema
    .optional()
    .transform((value: string | null | undefined) => value ?? null),
  configOverrideJson: jsonValueSchema.optional().default({}),
})
