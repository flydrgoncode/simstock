import {
  MembershipStatus,
  RecordStatus,
  TenantShellStatus,
  TenantStatus,
  UserStatus,
  VerticalDefinitionStatus,
  VerticalStatus,
} from '@prisma/client'
import { z } from 'zod'

import {
  cuidSchema,
  jsonValueSchema,
  nullableStringSchema,
  optionalNullableStringSchema,
} from '../../lib/validation/common'

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9-]+$/)

const keySchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9-]+$/)

export const verticalCreateSchema = z.object({
  key: keySchema,
  name: z.string().trim().min(2).max(160),
  description: nullableStringSchema,
  category: nullableStringSchema,
  icon: nullableStringSchema,
  color: nullableStringSchema,
  status: z.nativeEnum(VerticalStatus).default(VerticalStatus.ACTIVE),
  version: z.coerce.number().int().positive().default(1),
  metadataJson: jsonValueSchema.optional(),
  createdByUserId: z.union([cuidSchema, z.null()]).optional(),
  updatedByUserId: z.union([cuidSchema, z.null()]).optional(),
})

export const verticalUpdateSchema = verticalCreateSchema.partial()

export const verticalDefinitionCreateSchema = z.object({
  verticalId: cuidSchema,
  version: z.coerce.number().int().positive(),
  commonModelConfigJson: jsonValueSchema,
  verticalModelConfigJson: jsonValueSchema,
  llmConfigJson: jsonValueSchema,
  commandPackJson: jsonValueSchema,
  skillPackJson: jsonValueSchema,
  orgChartTemplateJson: jsonValueSchema,
  status: z
    .nativeEnum(VerticalDefinitionStatus)
    .default(VerticalDefinitionStatus.DRAFT),
})

export const verticalDefinitionUpdateSchema = verticalDefinitionCreateSchema
  .omit({ verticalId: true, version: true })
  .partial()

export const skillCreateSchema = z.object({
  key: keySchema,
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(2),
  instructions: z.string().trim().min(2),
  triggerHintsJson: jsonValueSchema.optional(),
  inputSchemaJson: jsonValueSchema.optional(),
  outputSchemaJson: jsonValueSchema.optional(),
  toolsConfigJson: jsonValueSchema.optional(),
  examplesJson: jsonValueSchema.optional(),
  tagsJson: jsonValueSchema.optional(),
  version: z.coerce.number().int().positive().default(1),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
  metadataJson: jsonValueSchema.optional(),
  createdByUserId: z.union([cuidSchema, z.null()]).optional(),
  updatedByUserId: z.union([cuidSchema, z.null()]).optional(),
})

export const skillUpdateSchema = skillCreateSchema.partial()

export const verticalSkillCreateSchema = z.object({
  verticalId: cuidSchema,
  skillId: cuidSchema,
  priority: z.coerce.number().int().nullable().optional(),
  active: z.coerce.boolean().default(true),
})

export const verticalSkillUpdateSchema = z.object({
  priority: z.coerce.number().int().nullable().optional(),
  active: z.coerce.boolean().optional(),
})

export const tenantCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  status: z.nativeEnum(TenantStatus).default(TenantStatus.ACTIVE),
  defaultCurrency: z.string().trim().min(3).max(3),
  defaultTimezone: z.string().trim().min(2).max(120),
})

export const tenantUpdateSchema = tenantCreateSchema.partial()

export const companyCreateSchema = z.object({
  tenantId: z.union([cuidSchema, z.null()]).optional(),
  key: keySchema,
  name: z.string().trim().min(2).max(160),
  legalName: nullableStringSchema,
  slug: slugSchema,
  taxId: nullableStringSchema,
  country: nullableStringSchema,
  timezone: nullableStringSchema,
  currency: nullableStringSchema,
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
  verticalId: cuidSchema,
  metadataJson: jsonValueSchema.optional(),
  createdByUserId: z.union([cuidSchema, z.null()]).optional(),
  updatedByUserId: z.union([cuidSchema, z.null()]).optional(),
})

export const companyUpdateSchema = companyCreateSchema
  .omit({ key: true })
  .partial()

export const tenantShellCreateSchema = z.object({
  tenantId: cuidSchema,
  verticalId: cuidSchema,
  verticalDefinitionId: cuidSchema,
  name: z.string().trim().min(2).max(160),
  slug: slugSchema,
  configJson: jsonValueSchema.default({}),
  status: z.nativeEnum(TenantShellStatus).default(TenantShellStatus.ACTIVE),
})

export const tenantShellUpdateSchema = tenantShellCreateSchema
  .omit({ tenantId: true, verticalId: true })
  .partial()

export const userCreateSchema = z.object({
  tenantId: cuidSchema.optional(),
  email: z.string().trim().email(),
  firstName: z.string().trim().min(1).max(120).optional(),
  lastName: z.string().trim().min(1).max(120).optional(),
  displayName: z.string().trim().min(1).max(160).optional(),
  name: z.string().trim().min(2).max(160).optional(),
  passwordHash: optionalNullableStringSchema,
  authProvider: optionalNullableStringSchema,
  authProviderUserId: optionalNullableStringSchema,
  status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
  globalRole: optionalNullableStringSchema,
  metadataJson: jsonValueSchema.optional(),
})

export const userUpdateSchema = z.object({
  email: z.string().trim().email().optional(),
  firstName: z.string().trim().min(1).max(120).optional(),
  lastName: z.string().trim().min(1).max(120).optional(),
  displayName: z.string().trim().min(1).max(160).optional(),
  name: z.string().trim().min(2).max(160).optional(),
  passwordHash: optionalNullableStringSchema,
  authProvider: optionalNullableStringSchema,
  authProviderUserId: optionalNullableStringSchema,
  status: z.nativeEnum(UserStatus).optional(),
  globalRole: optionalNullableStringSchema,
  metadataJson: jsonValueSchema.optional(),
})

export const userCompanyMembershipCreateSchema = z.object({
  userId: cuidSchema,
  companyId: cuidSchema,
  role: z.string().trim().min(2).max(80),
  status: z
    .nativeEnum(MembershipStatus)
    .default(MembershipStatus.ACTIVE),
})

export const userCompanyMembershipUpdateSchema = z.object({
  role: z.string().trim().min(2).max(80).optional(),
  status: z.nativeEnum(MembershipStatus).optional(),
})

export const userVerticalMembershipCreateSchema = z.object({
  userId: cuidSchema,
  verticalId: cuidSchema,
  role: z.string().trim().min(2).max(80),
  status: z
    .nativeEnum(MembershipStatus)
    .default(MembershipStatus.ACTIVE),
})

export const userVerticalMembershipUpdateSchema = z.object({
  role: z.string().trim().min(2).max(80).optional(),
  status: z.nativeEnum(MembershipStatus).optional(),
})

export const tenantSettingsSchema = z.object({
  configJson: jsonValueSchema,
})

export const personCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: nullableStringSchema,
  role: nullableStringSchema,
  department: nullableStringSchema,
  managerId: z.union([cuidSchema, z.null()]).optional().transform((value) => value ?? null),
  active: z.coerce.boolean().default(true),
})

export const personUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: optionalNullableStringSchema,
  role: optionalNullableStringSchema,
  department: optionalNullableStringSchema,
  managerId: z.union([cuidSchema, z.null()]).optional(),
  active: z.coerce.boolean().optional(),
})

export const llmProviderConfigCreateSchema = z.object({
  providerKey: keySchema,
  name: z.string().trim().min(2).max(160),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
  baseUrl: nullableStringSchema,
  apiKeyRef: nullableStringSchema,
  configJson: jsonValueSchema.optional(),
})

export const llmProviderConfigUpdateSchema =
  llmProviderConfigCreateSchema.partial()

export const llmModelConfigCreateSchema = z.object({
  providerConfigId: cuidSchema,
  modelKey: z.string().trim().min(2).max(160),
  displayName: z.string().trim().min(2).max(160),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
  isDefault: z.coerce.boolean().default(false),
  temperature: z.coerce.number().min(0).max(2).nullable().optional(),
  maxTokens: z.coerce.number().int().positive().nullable().optional(),
  supportsTools: z.coerce.boolean().nullable().optional(),
  supportsStructuredOutput: z.coerce.boolean().nullable().optional(),
  configJson: jsonValueSchema.optional(),
})

export const llmModelConfigUpdateSchema = llmModelConfigCreateSchema
  .omit({ providerConfigId: true })
  .partial()

export const verticalLlmConfigCreateSchema = z.object({
  verticalId: cuidSchema,
  providerConfigId: cuidSchema,
  modelConfigId: cuidSchema,
  purpose: nullableStringSchema,
  systemPrompt: nullableStringSchema,
  configJson: jsonValueSchema.optional(),
  active: z.coerce.boolean().default(true),
})

export const verticalLlmConfigUpdateSchema = verticalLlmConfigCreateSchema
  .omit({ verticalId: true, providerConfigId: true, modelConfigId: true })
  .partial()

export const emailProviderConfigCreateSchema = z.object({
  providerKey: keySchema,
  name: z.string().trim().min(2).max(160),
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
  host: nullableStringSchema,
  port: z.coerce.number().int().positive().nullable().optional(),
  usernameRef: nullableStringSchema,
  passwordRef: nullableStringSchema,
  fromEmail: nullableStringSchema,
  fromName: nullableStringSchema,
  configJson: jsonValueSchema.optional(),
})

export const emailProviderConfigUpdateSchema =
  emailProviderConfigCreateSchema.partial()

export const emailTemplateCreateSchema = z.object({
  key: keySchema,
  name: z.string().trim().min(2).max(160),
  subjectTemplate: z.string().trim().min(1),
  bodyTemplate: z.string().trim().min(1),
  type: nullableStringSchema,
  status: z.nativeEnum(RecordStatus).default(RecordStatus.ACTIVE),
})

export const emailTemplateUpdateSchema =
  emailTemplateCreateSchema.partial()
